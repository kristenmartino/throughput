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
    for (const h of ['#deck-define', '#deck-measure', '#cards-define', '#cards-measure', '#beer-game'].concat(BANK.decks.flatMap(d => d.lessons.map(l => '#lesson-' + l.id)))) {
      await page.goto(URL + h); await page.waitForTimeout(120); await fit(page, tag + ' ' + h);
    }
    // a lesson with every question answered (long why/whyNot text), practice, a flipped card
    await page.goto(URL + '#lesson-ms-9'); await page.waitForSelector('[data-act="pick"]');
    for (let i = 0; i < 6; i++) { const b = page.locator('[data-act="pick"]:not([disabled])').nth(1); if (await b.count()) await b.click(); }
    await fit(page, tag + ' lesson ms-9 answered');
    await page.goto(URL + '#practice-measure'); await page.waitForSelector('[data-act="ppick"]'); await page.locator('[data-act="ppick"]').nth(2).click(); await page.waitForSelector('.verdict');
    await fit(page, tag + ' practice answered');
    await page.goto(URL + '#cards-measure'); await page.waitForSelector('[data-act="card-flip"]'); await act(page, 'card-flip'); await fit(page, tag + ' card flipped');
    // Beer Game: play screen and debrief
    await page.goto(URL + '#beer-game'); await page.waitForSelector('[data-act="beer-start"]'); await page.locator('[data-act="beer-start"]').click(); await page.waitForSelector('#beer-qty');
    await fit(page, tag + ' beer play');
    await page.evaluate(() => { window.__tp.beer.put('game', { ts: Date.now(), seat: 2, orders: Array.from({ length: 32 }, (x, i) => (i * 7) % 23) }); window.__tp.host.go('beer', {}); });
    await page.waitForSelector('#beer-table'); await fit(page, tag + ' beer debrief');
    await page.goto(URL + '#craft'); await page.waitForTimeout(150); await fit(page, tag + ' craft list');
    await page.goto(URL + '#sims'); await page.waitForTimeout(150); await fit(page, tag + ' sims list');
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    await act(page, 'theme', scheme === 'dark' ? 'light' : 'dark');
    ok(await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === (scheme === 'dark' ? 'light' : 'dark'), tag + ' theme switch sets data-theme');
    await fit(page, tag + ' home, forced other theme');
    await page.goto(URL + '#lane-quality'); await page.waitForSelector('.secrow');
    await fit(page, tag + ' quality lane, forced other theme');
    for (const h of ['#lesson-df-8', '#deck-define', '#beer-game']) { await page.goto(URL + h); await page.waitForTimeout(150); await fit(page, tag + ' ' + h + ', forced other theme'); }
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
    const qs = await page.locator('.secrow').allTextContents();
    ok([11, 20, 20, 18, 16, 15].every((n, i) => qs[i].indexOf(n + ' of 100 scored questions') !== -1), 'section weights shown');
    ok(/110 questions \(100 scored\), 4 h 18 min/.test(await page.locator('main').textContent()), 'exam facts shown');
    await page.reload(); await page.waitForSelector('.secrow');
    ok(await page.locator('.secrow').count() === 7, 'lane route survives a reload');
    await act(page, 'home'); await page.waitForSelector('.lanebtn');
    ok(/last visited/.test(await page.locator('.lanebtn[data-id="quality"]').textContent()), 'home marks the last lane');
    ok(/Saved on this device/.test(await page.locator('#prefs-saved').textContent()), 'save line without Claude');
    // Engines load with role-play rules on (no content yet).
    ok(BANK.craft.length === 0 && BANK.runs.length === 0 && BANK.roleplays.length === 0, 'no Craft or Simulations content yet');
    ok(/^v0\.2\.0$/.test(BANK.kitVersion), 'study-kit pinned to v0.2.0');
    await page.goto(URL + '#sims'); await page.waitForTimeout(150);
    ok(/Simulations/.test(await page.locator('.playtop .ttl').textContent()), '#sims opens the Simulations list');
    await ctx.close();
  }

  // ---- 2b. decks and the Beer Game
  {
    const BG = require('./math/beer.js');
    const { ctx, page } = await newPage();
    await page.goto(URL + '#lane-quality'); await page.waitForSelector('.secrow');
    ok(await page.locator('#quality-define a[href="#deck-define"]').count() === 1 && await page.locator('#quality-measure a[href="#deck-measure"]').count() === 1, 'lane links the Define and Measure decks');
    ok(await page.locator('#quality-analyze .soon').count() === 1, 'Analyze still shows its phase');
    for (const d of BANK.decks) {
      await page.goto(URL + '#deck-' + d.id); await page.waitForSelector('.itemrow');
      ok(await page.locator('main .itemrow').count() === 9, d.id + ': nine lessons listed');
      ok(/Draft/.test(await page.locator('main').textContent()), d.id + ': Draft label');
      ok(d.questions.length === 30 && d.cards.length === (d.id === 'define' ? 20 : 24), d.id + ': 30 questions and the approved card count');
      for (const l of d.lessons) {
        await page.goto(URL + '#lesson-' + l.id); await page.waitForSelector('.prose');
        const n = await page.locator('[data-act="pick"]').evaluateAll(b => new Set(b.map(x => x.dataset.id)).size);
        ok(n === d.questions.filter(q => q.lesson === l.id).length, l.id + ': its questions shown (' + n + ')');
        ok(await page.locator('.src li').count() === l.sources.length && l.sources.length > 0, l.id + ': sources listed');
      }
    }
    ok(!/\{\{|NaN|undefined/.test(JSON.stringify(BANK.decks)), 'no unfilled placeholder or NaN in deck text');
    // answering saves; the deck page counts it
    await page.goto(URL + '#lesson-df-8'); await page.waitForSelector('[data-act="pick"]');
    const q24 = BANK.decks[0].questions.find(q => q.id === 'DF-24');
    await page.locator('[data-act="pick"][data-id="DF-24"][data-j="' + q24.answer + '"]').click(); await page.waitForSelector('#q-df-24 .verdict');
    ok(/Right/.test(await page.locator('#q-df-24 .verdict').textContent()) && /30,000/.test(await page.locator('#q-df-24').textContent()), 'DF-24 keyed answer is right and shows 30,000 DPMO');
    await page.locator('[data-act="pick"][data-id="DF-25"][data-j="0"]').click(); await page.waitForSelector('#q-df-25 .verdict');
    ok(/Not quite/.test(await page.locator('#q-df-25 .verdict').textContent()) && /84\.8%/.test(await page.locator('#q-df-25').textContent()), 'DF-25 wrong pick explained; RTY 84.8%');
    await page.goto(URL + '#deck-define'); await page.waitForSelector('.stat');
    ok(/1\/30/.test(await page.locator('.stat').textContent()), 'deck counts one right');
    // practice: ten questions, unseen first
    await page.goto(URL + '#deck-define'); await act(page, 'practice', 'define'); await page.waitForSelector('[data-act="ppick"]');
    let seenIds = [];
    for (let i = 0; i < 10; i++) { const id = await page.locator('[data-act="ppick"]').first().getAttribute('data-id'); seenIds.push(id); await page.locator('[data-act="ppick"]').first().click(); await page.waitForSelector('.verdict'); await act(page, 'pnext'); }
    await page.waitForSelector('main h2');
    ok(/of 10 right/.test(await page.locator('main h2').first().textContent()) && new Set(seenIds).size === 10, 'practice runs ten distinct questions to a result');
    ok(!seenIds.includes('DF-24') && !seenIds.includes('DF-25'), 'practice puts unseen questions first');
    // cards
    await page.goto(URL + '#cards-define'); await act(page, 'card-flip'); await page.waitForSelector('.flash .back');
    ok(/Suppliers, inputs/.test(await page.locator('.flash .back').textContent()), 'first card is SIPOC');
    await page.locator('[data-act="card-mark"][data-id="again"]').click(); await page.waitForTimeout(80);
    await act(page, 'cards-only'); await page.waitForSelector('.flash');
    ok(/1\/1/.test(await page.locator('.playtop .meta').textContent()), 'Again-only shows the one card marked Again');
    await act(page, 'card-flip'); await page.locator('[data-act="card-mark"][data-id="got"]').click(); await page.waitForTimeout(80);
    ok(/No cards marked Again/.test(await page.locator('main').textContent()), 'marking it Got it empties the Again list');
    // Beer Game: a full game with "same as last week", Enter key, a bad entry, then the debrief against the engine
    await page.goto(URL + '#beer-game'); await page.waitForSelector('[data-act="beer-seat"]');
    ok(await page.locator('[data-act="beer-seat"][aria-pressed="true"]').getAttribute('data-id') === '1', 'Wholesaler suggested first');
    await act(page, 'beer-start'); await page.waitForSelector('#beer-qty');
    ok(/Week 5/.test(await page.locator('.playtop .meta').textContent()), 'play starts at week 5');
    const st5 = await page.locator('#beer-status .v').allTextContents();
    ok(st5.slice(0, 5).join() === '12,0,4,4,12', 'week 5 position for the Wholesaler: on hand 12, backlog 0, order in 4, delivered 4, on order 12 (' + st5.join() + ')');
    await page.fill('#beer-qty', '-3'); await act(page, 'beer-order'); await page.waitForTimeout(100);
    ok(await page.locator('.toast').count() === 1 && /Week 5/.test(await page.locator('.playtop .meta').textContent()), 'a negative order is refused');
    await page.fill('#beer-qty', '9'); await page.press('#beer-qty', 'Enter'); await page.waitForFunction(() => /Week 6/.test(document.querySelector('.playtop .meta').textContent));
    for (let i = 0; i < 31; i++) await act(page, 'beer-same');
    await page.waitForSelector('#beer-table');
    const want = BG.stats(BG.game(1, [9].concat(Array(31).fill(9))));
    const score = await page.locator('#beer-score .v').allTextContents();
    const d$ = h => '$' + (h / 2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    ok(score[0] === d$(want.stages[1].cost2) && score[1] === d$(want.team2), 'debrief costs match the engine (' + score.slice(0, 2).join(' ') + ')');
    ok(score[2] === '$204.00' && score[3] === '$2,694.00', 'benchmark $204.00 and all-average $2,694.00 shown');
    const rows = await page.locator('#beer-table tbody tr').allTextContents();
    ok(rows.length === 4 && rows.every((r, i) => r.indexOf(String(want.stages[i].peak)) !== -1), 'debrief table shows each stage');
    ok(await page.locator('svg.fig polyline').count() === 5, 'bullwhip chart draws four stages and demand');
    await page.goto(URL); await page.goto(URL + '#beer-game'); await page.waitForSelector('[data-act="beer-seat"]');
    ok(/best \$/.test(await page.locator('[data-act="beer-seat"][data-id="1"]').textContent()), 'best cost per stage remembered');
    // abandon
    await page.locator('[data-act="beer-seat"][data-id="3"]').click(); await act(page, 'beer-start'); await page.waitForSelector('#beer-qty');
    page.once('dialog', dl => dl.accept()); await act(page, 'beer-quit'); await page.waitForSelector('[data-act="beer-seat"]');
    ok(!(await page.evaluate(() => { const g = window.__tp.beer.get('game'); return g && !g.done; })), 'abandoning ends the game');
    await page.goto(URL); await page.waitForSelector('.itemrow[href="#beer-game"]');
    ok(/Draft/.test(await page.locator('.itemrow[href="#beer-game"]').textContent()), 'home lists the Beer Game as Draft under Simulations');
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
    await page.goto(URL + '#lesson-df-1'); await page.waitForSelector('[data-act="pick"]'); await page.locator('[data-act="pick"][data-id="DF-01"][data-j="1"]').click();
    await page.goto(URL + '#beer-game'); await page.waitForSelector('[data-act="beer-start"]'); await act(page, 'beer-start'); await page.waitForSelector('#beer-qty'); await act(page, 'beer-order'); await page.waitForTimeout(200);
    await page.waitForTimeout(5000);
    const n = await page.evaluate(() => Object.assign({}, window.__sets));
    await page.waitForTimeout(3000);
    const n2 = await page.evaluate(() => Object.assign({}, window.__sets));
    ok((n['data/users/u_loop/prefs'] || 0) >= 1, 'idle-write: prefs document written (' + JSON.stringify(n) + ')');
    ok(JSON.stringify(n2) === JSON.stringify(n), 'idle-write: no further writes once idle (' + JSON.stringify(n) + ' then ' + JSON.stringify(n2) + ')');
    ok(!n['data/users/u_loop/craft'] && !n['data/users/u_loop/sims'], 'idle-write: empty Craft and Simulations documents are never written');
    ok((n['data/users/u_loop/decks'] || 0) >= 1 && (n['data/users/u_loop/beer'] || 0) >= 1, 'idle-write: decks and Beer Game documents written');
    const dd = await page.evaluate(() => window.__docs['data/users/u_loop/decks']), bd = await page.evaluate(() => window.__docs['data/users/u_loop/beer']);
    ok(dd && dd.decks['DF-01'] && dd.decks['DF-01'].last === 1 && bd && bd.beer.game && bd.beer.game.orders.length === 1, 'idle-write: the answer and the game in progress are in the account');
    const d = await page.evaluate(() => window.__docs['data/users/u_loop/prefs']);
    ok(d && d.prefs && d.prefs.lane && d.prefs.lane.v === 'quality', 'idle-write: prefs hold the lane ' + JSON.stringify(d && d.prefs));
    // a second device: the stored copy loads, and loading it writes nothing
    await page.evaluate(() => localStorage.clear()); await page.goto(URL); await page.reload(); await page.waitForSelector('.lanebtn'); await page.waitForTimeout(3000);
    ok(/last visited/.test(await page.locator('.lanebtn[data-id="quality"]').textContent()), 'second device: last lane comes from the account');
    ok(/In progress · Wholesaler/.test(await page.locator('.itemrow[href="#beer-game"]').textContent()), 'second device: the game in progress comes from the account');
    const n3 = await page.evaluate(() => Object.assign({}, window.__sets));
    ok(JSON.stringify(n3) === '{}', 'second device: loading writes nothing (' + JSON.stringify(n3) + ')');
    await ctx.close();
  }

  await browser.close();
  ok(!errs.length, 'page errors: ' + errs.join(' | '));
  console.log(pass + ' passed, ' + fails.length + ' failed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
