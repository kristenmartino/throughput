// Click-tests build/index.html in headless Chrome: every screen at 360, 390 and 414 px in light and dark with no
// horizontal overflow (study-kit's width helper), the lane picker, routes, the theme switch, persistence after a
// reload, and study-kit's idle-write check against a database stand-in that sorts keys.
// The stand-in lives in the test process (exposeBinding), as in Blast Radius after its Nov 24 fix, so it survives
// the reload that plays the second device.
// Run: node build.js && node test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/npm-tools/node_modules/playwright'); } })();
const { overflow, shell, WIDTHS, SCHEMES } = require('./vendor/study-kit/widths.js');

const SCRATCH = process.env.SCRATCH || require('os').tmpdir();
// claude.ai serves the artifact body inside its own document; shell() reproduces that wrapper.
const html = fs.readFileSync(path.join(__dirname, 'build', 'index.html'), 'utf8');
const body = html.replace(/^[\s\S]*?<head>/, '').replace(/<\/head>\s*<body>/, '').replace(/<\/body>\s*<\/html>\s*$/, '').replace(/<meta[^>]*>/g, '').replace(/<title>.*?<\/title>/, '');
const file = path.join(SCRATCH, 'throughput-test.html');
fs.writeFileSync(file, shell(body));
const URL = 'file://' + file;
const BANK = JSON.parse(/const BANK = (.*?);<\/script>/s.exec(html)[1]);

let pass = 0; const fails = [];
function ok(c, m) { if (c) pass++; else { fails.push(m); console.log('FAIL', m); } }

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const newPage = async (opts, init) => {
    const binds = (opts || {}).__bindings; if (opts) delete opts.__bindings;
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, opts));
    for (const k in (binds || {})) await ctx.exposeBinding(k, binds[k]);
    await ctx.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
    if (init) await ctx.addInitScript(init);
    const page = await ctx.newPage(); page.setDefaultTimeout(6000);
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    return { ctx, page };
  };
  const fit = async (page, label) => { const r = await overflow(page); ok(r.ok, 'overflow ' + label + ' ' + JSON.stringify(r)); };
  const act = (page, a, id) => page.locator('[data-act="' + a + '"]' + (id ? '[data-id="' + id + '"]' : '')).first().click();

  // ---- 1. every screen, every width, both themes (system scheme and the forced opposite theme)
  for (const w of WIDTHS) for (const scheme of SCHEMES) {
    const { ctx, page } = await newPage({ viewport: { width: w, height: 800 }, colorScheme: scheme });
    const tag = w + ' ' + scheme;
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    await fit(page, tag + ' home');
    await page.goto(URL + '#lane-quality'); await page.waitForSelector('.secrow');
    await fit(page, tag + ' quality lane');
    await page.goto(URL + '#craft'); await page.waitForTimeout(150); await fit(page, tag + ' craft list');
    await page.goto(URL + '#sims'); await page.waitForTimeout(150); await fit(page, tag + ' sims list');
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    await act(page, 'theme', scheme === 'dark' ? 'light' : 'dark');
    ok(await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === (scheme === 'dark' ? 'light' : 'dark'), tag + ' theme switch sets data-theme');
    await fit(page, tag + ' home, forced other theme');
    await page.goto(URL + '#lane-quality'); await page.waitForSelector('.secrow');
    await fit(page, tag + ' quality lane, forced other theme');
    await ctx.close();
  }

  // ---- 2. lane picker, routes, reload
  {
    const { ctx, page } = await newPage();
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    ok(/Throughput/.test(await page.locator('.brand').textContent()), 'brand reads Throughput');
    const lanes = await page.locator('.lanebtn').evaluateAll(b => b.map(x => ({ id: x.dataset.id, off: x.disabled, t: x.textContent })));
    ok(lanes.map(l => l.id).join() === 'quality,supply-chain,coo', 'lane order ' + lanes.map(l => l.id).join());
    ok(lanes.filter(l => !l.off).map(l => l.id).join() === 'quality', 'only Quality and process improvement is active');
    ok(lanes.filter(l => l.off).every(l => /Later$/.test(l.t)), 'Supply chain and COO show Later');
    ok(/Quality and process improvement/.test(lanes[0].t) && /Supply chain/.test(lanes[1].t) && /Chief Operating Officer \(COO\)/.test(lanes[2].t), 'lane names');
    ok(lanes.every(l => !/\b(CDO|CRO|CPO|CCO)\b/.test(l.t)), 'no colliding bare acronyms in lane names');
    await page.locator('.lanebtn[data-id="coo"]').click({ force: true }); await page.waitForTimeout(100);
    ok(await page.locator('.lanebtn').count() === 3, 'a disabled lane does not open');
    await page.goto(URL + '#lane-supply-chain'); await page.waitForSelector('.lanebtn');
    ok(await page.locator('.secrow').count() === 0, 'route to a Later lane falls back to the lane picker');
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    await act(page, 'lane', 'quality'); await page.waitForSelector('.secrow');
    ok(/#lane-quality$/.test(page.url()), 'opening Quality sets #lane-quality');
    const secs = await page.locator('.secrow').evaluateAll(r => r.map(x => x.id));
    ok(secs.join() === 'quality-overview,quality-define,quality-measure,quality-analyze,quality-improve,quality-control,quality-mock', 'quality sections ' + secs.join());
    const qs = await page.locator('.secrow .k').allTextContents();
    ok([11, 20, 20, 18, 16, 15].every((n, i) => qs[i].indexOf(n + ' of 100 scored questions') !== -1), 'section weights shown');
    ok(/110 questions \(100 scored\), 4 h 18 min/.test(await page.locator('main').textContent()), 'exam facts shown');
    await page.reload(); await page.waitForSelector('.secrow');
    ok(await page.locator('.secrow').count() === 7, 'lane route survives a reload');
    await act(page, 'home'); await page.waitForSelector('.lanebtn');
    ok(/last visited/.test(await page.locator('.lanebtn[data-id="quality"]').textContent()), 'home marks the last lane');
    ok(/Saved on this device/.test(await page.locator('#prefs-saved').textContent()), 'save line without Claude');
    // Engines load with role-play rules on (no content yet).
    ok(BANK.craft.length === 0 && BANK.runs.length === 0 && BANK.roleplays.length === 0, 'Phase 0: no content');
    ok(/^v0\.2\.0$/.test(BANK.kitVersion), 'study-kit pinned to v0.2.0');
    await page.goto(URL + '#sims'); await page.waitForTimeout(150);
    ok(/Simulations/.test(await page.locator('.playtop .ttl').textContent()), '#sims opens the Simulations list');
    await ctx.close();
  }

  // ---- 3. idle-write check (study-kit's method): a database that returns keys sorted; no writes once idle
  {
    const STORE = {};
    const { ctx, page } = await newPage({ __bindings: { __dbGet: () => JSON.stringify(STORE), __dbPut: (src, p, d) => { STORE[p] = d; } } }, () => {
      const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.keys(v).sort().reduce((o, k) => { o[k] = sortKeys(v[k]); return o; }, {}) : v;
      const docs = {}, ready = window.__dbGet().then(j => Object.assign(docs, JSON.parse(j))), sets = {}; window.__docs = docs; window.__sets = sets;
      const mkRef = p => { const ls = []; const snap = () => ({ exists: !!docs[p], data: () => docs[p] ? JSON.parse(JSON.stringify(docs[p])) : undefined });
        return { set: async d => { sets[p] = (sets[p] || 0) + 1; docs[p] = sortKeys(JSON.parse(JSON.stringify(d))); window.__dbPut(p, docs[p]); setTimeout(() => ls.forEach(f => f(snap())), 5); }, onSnapshot: next => { ls.push(next); ready.then(() => setTimeout(() => next(snap()), 30)); return () => {}; } }; };
      const refs = {}, db = { doc: p => refs[p] || (refs[p] = mkRef(p)) };
      window.claude = { use: async n => n === 'db' ? db : n === 'user' ? { id: async () => 'u_loop' } : null };
    });
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    await page.waitForTimeout(800);
    ok(/Saved to your account/.test(await page.locator('#prefs-saved').textContent()), 'save line shows the account once db attaches');
    await act(page, 'lane', 'quality'); await page.waitForSelector('.secrow');
    await page.waitForTimeout(5000);
    const n = await page.evaluate(() => Object.assign({}, window.__sets));
    await page.waitForTimeout(3000);
    const n2 = await page.evaluate(() => Object.assign({}, window.__sets));
    ok((n['data/users/u_loop/prefs'] || 0) >= 1, 'idle-write: prefs document written (' + JSON.stringify(n) + ')');
    ok(JSON.stringify(n2) === JSON.stringify(n), 'idle-write: no further writes once idle (' + JSON.stringify(n) + ' then ' + JSON.stringify(n2) + ')');
    ok(!n['data/users/u_loop/craft'] && !n['data/users/u_loop/sims'], 'idle-write: empty Craft and Simulations documents are never written');
    const d = await page.evaluate(() => window.__docs['data/users/u_loop/prefs']);
    ok(d && d.prefs && d.prefs.lane && d.prefs.lane.v === 'quality', 'idle-write: prefs hold the lane ' + JSON.stringify(d && d.prefs));
    // a second device: the stored copy loads, and loading it writes nothing
    await page.evaluate(() => localStorage.clear()); await page.goto(URL); await page.reload(); await page.waitForSelector('.lanebtn'); await page.waitForTimeout(3000);
    ok(/last visited/.test(await page.locator('.lanebtn[data-id="quality"]').textContent()), 'second device: last lane comes from the account');
    const n3 = await page.evaluate(() => Object.assign({}, window.__sets));
    ok(JSON.stringify(n3) === '{}', 'second device: loading writes nothing (' + JSON.stringify(n3) + ')');
    await ctx.close();
  }

  await browser.close();
  ok(!errs.length, 'page errors: ' + errs.join(' | '));
  console.log(pass + ' passed, ' + fails.length + ' failed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
