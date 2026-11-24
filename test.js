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
    for (const h of ['#beer-game', '#mock'].concat(BANK.decks.flatMap(d => ['#deck-' + d.id, '#cards-' + d.id].concat(d.lessons.map(l => '#lesson-' + l.id))))) {
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
    // a Phase 2 lesson with every question answered, and the mock: question, review and result screens
    await page.goto(URL + '#lesson-an-6'); await page.waitForSelector('[data-act="pick"]');
    for (let i = 0; i < 4; i++) { const b = page.locator('[data-act="pick"]:not([disabled])').nth(0); if (await b.count()) await b.click(); }
    await fit(page, tag + ' lesson an-6 answered');
    await page.evaluate(() => { localStorage.removeItem('throughput:mock:v1'); window.__tp.mock.loadLocal(); });
    await page.goto(URL + '#mock'); await page.waitForSelector('[data-act="mock-start"]'); await page.locator('[data-act="mock-start"]').click(); await page.waitForSelector('#mq');
    await page.locator('[data-act="mock-pick"]').nth(1).click(); await page.locator('[data-act="mock-flag"]').click();
    await fit(page, tag + ' mock question');
    await page.locator('[data-act="mock-review"]').first().click(); await page.waitForSelector('.mgrid'); await fit(page, tag + ' mock review');
    page.once('dialog', dl => dl.accept()); await page.locator('[data-act="mock-submit"]').click(); await page.waitForSelector('#mock-by'); await fit(page, tag + ' mock result');
    await page.goto(URL + '#craft'); await page.waitForTimeout(150); await fit(page, tag + ' craft list');
    await page.goto(URL + '#sims'); await page.waitForTimeout(150); await fit(page, tag + ' sims list');
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    await act(page, 'theme', scheme === 'dark' ? 'light' : 'dark');
    ok(await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === (scheme === 'dark' ? 'light' : 'dark'), tag + ' theme switch sets data-theme');
    await fit(page, tag + ' home, forced other theme');
    await page.goto(URL + '#lane-quality'); await page.waitForSelector('.secrow');
    await fit(page, tag + ' quality lane, forced other theme');
    for (const h of ['#lesson-df-8', '#deck-define', '#beer-game', '#lesson-an-1', '#lesson-im-2', '#lesson-co-1', '#lesson-an-3', '#mock']) { await page.goto(URL + h); await page.waitForTimeout(150); await fit(page, tag + ' ' + h + ', forced other theme'); }
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
    for (const id of ['overview', 'define', 'measure', 'analyze', 'improve', 'control']) ok(await page.locator('#quality-' + id + ' a[href="#deck-' + id + '"]').count() === 1, 'lane links the ' + id + ' deck');
    ok(await page.locator('#quality-mock a[href="#mock"]').count() === 1 && await page.locator('.secrow .soon').count() === 0, 'lane links the mock; no section shows "Phase n" any more');
    // Approved outlines: lessons / questions / cards per deck (Phase 1 and Phase 2 proposals)
    const OUT = { overview: [6, 16, 16], define: [9, 30, 20], measure: [9, 30, 24], analyze: [9, 27, 22], improve: [7, 24, 20], control: [7, 23, 22] };
    ok(BANK.decks.map(d => d.id).join() === 'overview,define,measure,analyze,improve,control', 'decks in BoK order');
    for (const d of BANK.decks) {
      await page.goto(URL + '#deck-' + d.id); await page.waitForSelector('.itemrow');
      ok(await page.locator('main .itemrow').count() === OUT[d.id][0], d.id + ': ' + OUT[d.id][0] + ' lessons listed');
      ok(/Draft/.test(await page.locator('main').textContent()), d.id + ': Draft label');
      ok(d.questions.length === OUT[d.id][1] && d.cards.length === OUT[d.id][2], d.id + ': approved question and card counts');
      ok(d.questions.every(q => q.status === 'Draft') && d.lessons.every(l => l.status === 'Draft'), d.id + ': every lesson and question is Draft');
      for (const l of d.lessons) {
        await page.goto(URL + '#lesson-' + l.id); await page.waitForSelector('.prose');
        const n = await page.locator('[data-act="pick"]').evaluateAll(b => new Set(b.map(x => x.dataset.id)).size);
        ok(n === d.questions.filter(q => q.lesson === l.id).length, l.id + ': its questions shown (' + n + ')');
        ok(await page.locator('.src li').count() === l.sources.length && l.sources.length > 0, l.id + ': sources listed');
        ok(await page.locator('figure.lfig svg.fig').count() === (l.figs || []).length, l.id + ': ' + (l.figs || []).length + ' figure(s) drawn');
        if (['overview', 'analyze', 'improve', 'control'].includes(d.id)) {   // Phase 2: every keyed answer is marked right in the page
          for (const q of d.questions.filter(x => x.lesson === l.id)) {
            await page.locator('[data-act="pick"][data-id="' + q.id + '"][data-j="' + q.answer + '"]').click();
            ok(/Right/.test(await page.locator('#q-' + q.id.toLowerCase() + ' .verdict').textContent()), q.id + ': keyed answer marked right');
          }
        }
      }
    }
    // figures carry a text alternative and name numbers that match the lesson text
    await page.goto(URL + '#lesson-co-1'); await page.waitForSelector('figure.lfig');
    ok(/UCL 51\.24, center 50\.20 and LCL 49\.16/.test(await page.locator('figure.lfig svg').getAttribute('aria-label')) && /51\.24/.test(await page.locator('.prose').textContent()), 'co-1 chart label and text agree on the limits');
    await page.goto(URL + '#lesson-im-2'); await page.waitForSelector('figure.lfig');
    ok(await page.locator('figure.lfig').count() === 2, 'im-2 draws the main-effects and interaction plots');
    ok(!/\{\{|NaN|undefined/.test(JSON.stringify(BANK.decks)), 'no unfilled placeholder or NaN in deck text');
    // answering saves; the deck page counts it
    await page.goto(URL + '#lesson-df-8'); await page.waitForSelector('[data-act="pick"]');
    const q24 = BANK.decks.find(d => d.id === 'define').questions.find(q => q.id === 'DF-24');
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

  // ---- 2c. timed mock
  {
    const { ctx, page } = await newPage();
    const M = BANK.mock;
    ok(M.total === 110 && M.minutes === 258 && Object.values(M.draw).reduce((a, b) => a + b, 0) === 110, 'mock: 110 questions in 258 minutes');
    ok(JSON.stringify(M.draw) === JSON.stringify({ overview: 12, define: 22, measure: 22, analyze: 20, improve: 18, control: 16 }), 'mock: drawn in the BoK ratio ' + JSON.stringify(M.draw));
    ok(/550 of a possible 750/.test(M.scoring) && /no pass line/.test(M.scoring), 'mock: ASQ scoring stated, no pass line');
    await page.goto(URL + '#mock'); await page.waitForSelector('[data-act="mock-start"]');
    ok(!/pass(ing)? (score|mark|line) (is|of) \d/i.test(await page.locator('main').textContent()), 'mock: no pass mark shown');
    ok(await page.locator('[data-act="mock-pause-opt"]').getAttribute('aria-pressed') === 'false', 'mock: pausing off by default');
    await page.locator('[data-act="mock-start"]').click(); await page.waitForSelector('#mq');
    const ids = await page.evaluate(() => window.__tp.mock.get('run').ids);
    const QSEC = {}; BANK.decks.forEach(d => d.questions.forEach(q => { QSEC[q.id] = d.id; }));
    const per = {}; ids.forEach(id => { per[QSEC[id]] = (per[QSEC[id]] || 0) + 1; });
    ok(ids.every(id => BANK.decks.flatMap(d => d.questions).find(q => q.id === id).mock) && ids.length === 110 && new Set(ids).size === 110 && JSON.stringify(per) === JSON.stringify(M.draw), 'mock: 110 distinct questions, counts per section match the draw');
    ok(/^4:1[78]:\d\d$/.test(await page.locator('#mock-clock').textContent()), 'mock: clock starts at 4:18:00 (' + await page.locator('#mock-clock').textContent() + ')');
    ok(await page.locator('[data-act="mock-pause"]').count() === 0, 'mock: no Pause button when pausing is off');
    ok(!/Draft|BoK|Remember|Understand|Apply|Analyze|Evaluate|Create/.test(await page.locator('#mq .row').textContent()), 'mock: question shows no section, level or key hints');
    // answer the first three with the key, the fourth wrongly; flag the fourth
    for (let k = 0; k < 4; k++) {
      const q = BANK.decks.flatMap(d => d.questions).find(x => x.id === ids[k]);
      await page.locator('[data-act="mock-pick"][data-j="' + (k < 3 ? q.answer : (q.answer + 1) % 4) + '"]').click();
      if (k === 3) await page.locator('[data-act="mock-flag"]').click();
      if (k < 3) await page.locator('[data-act="mock-go"]', { hasText: 'Next' }).click();
    }
    ok(await page.locator('.opt.is-picked').count() === 1 && await page.locator('[data-act="mock-flag"]').getAttribute('aria-pressed') === 'true', 'mock: pick and flag shown');
    const t1 = await page.evaluate(() => window.__tp.mock.get('run').start);
    await page.waitForTimeout(1200); await page.reload(); await page.waitForSelector('#mq');
    const r2 = await page.evaluate(() => window.__tp.mock.get('run'));
    ok(r2.start === t1 && r2.i === 3 && Object.keys(r2.picks).length === 4 && r2.flags[ids[3]] === 1, 'mock: a reload keeps the start time, position, answers and flag');
    ok(/Mock · 4 of 110/.test(await page.locator('.playtop .ttl').textContent()), 'mock: reload returns to question 4');
    const c1 = await page.locator('#mock-clock').textContent(); await page.waitForTimeout(2100); const c2 = await page.locator('#mock-clock').textContent();
    ok(c1 !== c2, 'mock: the clock runs (' + c1 + ' then ' + c2 + ')');
    await page.locator('[data-act="mock-review"]').first().click(); await page.waitForSelector('.mgrid');
    ok(await page.locator('.mgrid button').count() === 110 && await page.locator('.mgrid button.ans').count() === 4 && await page.locator('.mgrid button.flg').count() === 1, 'mock: review grid shows 110, 4 answered, 1 flagged');
    await page.locator('[data-act="mock-flagged"]').click();
    ok(await page.locator('.mgrid button').count() === 1, 'mock: "Only flagged" shows the flagged question');
    await page.locator('.mgrid button').first().click(); await page.waitForSelector('#mq');
    ok(/Mock · 4 of 110/.test(await page.locator('.playtop .ttl').textContent()), 'mock: review jumps to the flagged question');
    await page.locator('[data-act="mock-review"]').first().click(); await page.waitForSelector('.mgrid');
    let msg = ''; page.once('dialog', dl => { msg = dl.message(); dl.accept(); }); await page.locator('[data-act="mock-submit"]').click(); await page.waitForSelector('#mock-by');
    ok(/106 questions are unanswered/.test(msg), 'mock: submit warns about unanswered questions');
    ok((await page.locator('#mock-score .v').allTextContents()).join() === '3/110,3%', 'mock: score 3 of 110 (' + (await page.locator('#mock-score .v').allTextContents()).join() + ')');
    const cells = await page.locator('#mock-by tbody tr td:nth-child(2)').allTextContents();
    ok(cells.length === 6 && cells.map(c => +c.split('/')[1]).join() === Object.values(M.draw).join() && cells.reduce((a, c) => a + +c.split('/')[0], 0) === 3, 'mock: results by section for six sections (' + cells.join(' ') + ')');
    ok(await page.locator('#mock-misses li').count() === 107 && await page.locator('#mock-misses a[href^="#lesson-"]').count() === 107, 'mock: each miss links to its lesson');
    ok(/550 of a possible 750/.test(await page.locator('main').textContent()), 'mock result: ASQ scoring note shown, no pass line');
    await page.goto(URL + '#lane-quality'); await page.waitForSelector('#quality-mock');
    ok(/last: 3 of 110/.test(await page.locator('#quality-mock').textContent()), 'lane shows the last mock result');
    // time runs out: a run started 4 h 19 min ago submits itself on opening
    await page.evaluate(ids => { window.__tp.mock.put('run', { ts: Date.now(), ids, picks: {}, flags: {}, start: Date.now() - 259 * 60000, allowPause: false, pausedAt: 0, pausedMs: 0, i: 0 }); }, ids);
    await page.goto(URL + '#mock'); await page.waitForSelector('#mock-by');
    ok(/Time ran out/.test(await page.locator('main').textContent()) && /4:18:00 used/.test(await page.locator('main').textContent()), 'mock: submits itself at 0:00:00');
    // pausing, when allowed, stops the clock and hides the question
    await page.goto(URL + '#lane-quality'); await page.goto(URL + '#mock'); await page.waitForSelector('[data-act="mock-start"]');
    await page.locator('[data-act="mock-pause-opt"]').click(); await page.locator('[data-act="mock-start"]').click(); await page.waitForSelector('#mq');
    await page.locator('[data-act="mock-pause"]').click(); await page.waitForSelector('[data-act="mock-resume"]');
    const p1 = await page.locator('#mock-clock').textContent(); await page.waitForTimeout(2100);
    ok(p1 === await page.locator('#mock-clock').textContent() && await page.locator('#mq').count() === 0, 'mock: pause stops the clock and hides the question');
    await page.locator('[data-act="mock-resume"]').click(); await page.waitForSelector('#mq');
    page.once('dialog', dl => dl.accept()); await page.locator('[data-act="mock-review"]').first().click(); await page.locator('[data-act="mock-quit"]').click(); await page.waitForSelector('[data-act="mock-start"]');
    ok(!(await page.evaluate(() => { const r = window.__tp.mock.get('run'); return r && !r.done; })), 'mock: abandoning ends the run');
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
    await page.goto(URL + '#mock'); await page.waitForSelector('[data-act="mock-start"]'); await act(page, 'mock-start'); await page.waitForSelector('#mq'); await page.locator('[data-act="mock-pick"]').first().click();
    await page.waitForTimeout(5000);   // stays on the mock screen with its clock ticking
    const n = await page.evaluate(() => Object.assign({}, window.__sets));
    await page.waitForTimeout(3000);
    const n2 = await page.evaluate(() => Object.assign({}, window.__sets));
    ok((n['data/users/u_loop/prefs'] || 0) >= 1, 'idle-write: prefs document written (' + JSON.stringify(n) + ')');
    ok(JSON.stringify(n2) === JSON.stringify(n), 'idle-write: no further writes once idle (' + JSON.stringify(n) + ' then ' + JSON.stringify(n2) + ')');
    ok(!n['data/users/u_loop/craft'] && !n['data/users/u_loop/sims'], 'idle-write: empty Craft and Simulations documents are never written');
    ok((n['data/users/u_loop/decks'] || 0) >= 1 && (n['data/users/u_loop/beer'] || 0) >= 1 && (n['data/users/u_loop/mock'] || 0) >= 1, 'idle-write: decks, Beer Game and mock documents written');
    const md = await page.evaluate(() => window.__docs['data/users/u_loop/mock']);
    ok(md && md.mock.run && md.mock.run.ids.length === 110 && Object.keys(md.mock.run.picks).length === 1, 'idle-write: the mock in progress is in the account');
    const dd = await page.evaluate(() => window.__docs['data/users/u_loop/decks']), bd = await page.evaluate(() => window.__docs['data/users/u_loop/beer']);
    ok(dd && dd.decks['DF-01'] && dd.decks['DF-01'].last === 1 && bd && bd.beer.game && bd.beer.game.orders.length === 1, 'idle-write: the answer and the game in progress are in the account');
    const d = await page.evaluate(() => window.__docs['data/users/u_loop/prefs']);
    ok(d && d.prefs && d.prefs.lane && d.prefs.lane.v === 'quality', 'idle-write: prefs hold the lane ' + JSON.stringify(d && d.prefs));
    // a second device: the stored copy loads, and loading it writes nothing
    await page.evaluate(() => localStorage.clear()); await page.goto(URL); await page.reload(); await page.waitForSelector('.lanebtn'); await page.waitForTimeout(3000);
    ok(/last visited/.test(await page.locator('.lanebtn[data-id="quality"]').textContent()), 'second device: last lane comes from the account');
    ok(/In progress · Wholesaler/.test(await page.locator('.itemrow[href="#beer-game"]').textContent()), 'second device: the game in progress comes from the account');
    await page.goto(URL + '#lane-quality'); await page.waitForSelector('#quality-mock'); await page.waitForTimeout(1500);
    ok(/In progress · 4:1\d:\d\d left · 1 of 110 answered/.test(await page.locator('#quality-mock').textContent()), 'second device: the mock in progress comes from the account (' + await page.locator('#quality-mock').textContent() + ')');
    const n3 = await page.evaluate(() => Object.assign({}, window.__sets));
    ok(JSON.stringify(n3) === '{}', 'second device: loading writes nothing (' + JSON.stringify(n3) + ')');
    await ctx.close();
  }

  await browser.close();
  ok(!errs.length, 'page errors: ' + errs.join(' | '));
  console.log(pass + ' passed, ' + fails.length + ' failed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
