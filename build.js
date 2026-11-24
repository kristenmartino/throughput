// Builds build/index.html from index.src.html, the lane data, the decks and the Beer Game, after validating them.
// Engines come from study-kit, pinned in vendor/study-kit/VERSION. Never edit the vendored files by hand.
// `node build.js --record` adds every current link id to published-ids.json (run after a publish).
'use strict';
const fs = require('fs');
const path = require('path');
const here = __dirname;
const { loadCraft } = require('./vendor/study-kit/tools/craft-parse.js');
const { validateSims } = require('./vendor/study-kit/tools/sims-validate.js');
const L = require('./lanes.js');
const NUM = require('./math/numbers.js');
const SRC = require('./content/sources.js');

const errors = [];
const laneIds = [], sectionIds = [], seen = new Set();
const claim = (id, w) => { if (seen.has(id)) errors.push(w + ': duplicate id ' + id); seen.add(id); };
// Link ids use the dash form only (#lane-quality, #lesson-df-1): published links keep the dash form (study-kit accepts dots too since v0.2.1).
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
for (const ln of L.lanes) {
  if (!ID.test(ln.id)) errors.push('lane ' + ln.id + ': bad id');
  claim(ln.id, 'lane'); laneIds.push(ln.id);
  if (!ln.name || !ln.blurb || !ln.short || !ln.color) errors.push('lane ' + ln.id + ': name, short, blurb and color required');
  if (/\b(CDO|CRO|CPO|CCO)\b/.test(ln.name)) errors.push('lane ' + ln.id + ': colliding bare acronym in the name');
}
if (laneIds.join() !== 'quality,supply-chain,coo') errors.push('lanes are quality, supply-chain, coo in that order');
if (L.lanes.filter(l => l.active).map(l => l.id).join() !== 'quality,supply-chain') errors.push('Phase 3: the quality and supply-chain lanes are active');
{ const w = (L.sections['supply-chain'] || []).filter(s => s.kind === 'Deck').map(s => s.weight);   // ASCM CSCP ECM v5.0 weights (Read, Nov 24)
  if (w.join() !== '10,10,17,19,9,17,10,8') errors.push('supply-chain decks must carry the ASCM weights 10,10,17,19,9,17,10,8 (got ' + w.join() + ')'); }
for (const s of L.sections['supply-chain'] || []) if (s.kind === 'Simulation' && !/^#[a-z0-9-]+$/.test(s.route || '')) errors.push('section supply-chain-' + s.id + ': a simulation needs a route');
for (const lane in L.sections) {
  if (laneIds.indexOf(lane) === -1) errors.push('sections for unknown lane ' + lane);
  for (const s of L.sections[lane]) {
    const id = lane + '-' + s.id;
    if (!ID.test(id)) errors.push('section ' + id + ': bad id');
    claim(id, 'section'); sectionIds.push(id);
    if (!s.title || !s.kind || !(s.phase >= 1)) errors.push('section ' + id + ': title, kind and phase required');
  }
}
{ const q = (L.sections.quality || []).filter(s => s.kind === 'Deck').map(s => s.questions);
  if (q.join() !== '11,20,20,18,16,15' || q.reduce((a, b) => a + b, 0) !== 100) errors.push('quality decks must carry the BoK counts 11,20,20,18,16,15 (got ' + q.join() + ')'); }

// ---- Decks (Phase 1: Define and Measure; Phase 2: Overview, Analyze, Improve, Control; outlines approved Nov 24)
const FL = NUM.flat(NUM.compute()), used = new Map();
const fill = (s, w) => { try { String(s).replace(/\{\{([a-z0-9.]+)(?:\|([^}]+))?\}\}/gi, (m, k, f) => { used.set(k + '|' + (f || '0'), [k, f || '0']); return ''; }); return NUM.fill(s, FL); } catch (e) { errors.push(w + ': ' + e.message); return s; } };
const LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const OUTLINE = { overview: { counts: [3, 3, 3, 2, 2, 3], cards: 16 }, define: { counts: [3, 3, 2, 4, 4, 4, 3, 4, 3], cards: 20 }, measure: { counts: [2, 4, 2, 4, 3, 4, 3, 2, 6], cards: 24 },
  analyze: { counts: [3, 3, 3, 4, 4, 3, 3, 2, 2], cards: 22 }, improve: { counts: [4, 4, 3, 3, 3, 4, 3], cards: 20 }, control: { counts: [4, 2, 5, 4, 3, 3, 2], cards: 22 } };
const FIGS = require('./math/figs.js'), NUMS = NUM.compute();
const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const DECKS = ['overview', 'define', 'measure', 'analyze', 'improve', 'control'].filter(id => fs.existsSync(path.join(here, 'content', id + '.js'))).map(id => require('./content/' + id + '.js')).map(src => {
  const d = src.deck, o = OUTLINE[d.id], w = 'deck ' + d.id;
  if (!o || sectionIds.indexOf('quality-' + d.id) === -1) errors.push(w + ': no section quality-' + d.id);
  if (!ID.test(d.id)) errors.push(w + ': bad id');
  claim('deck-' + d.id, w);
  const lessons = src.lessons.map((l, i) => {
    const lw = 'lesson ' + l.id; claim(l.id, lw);
    if (l.id !== d.prefix + '-' + (i + 1) || !l.title || !l.bok || !Array.isArray(l.body) || !l.body.length) errors.push(lw + ': id ' + d.prefix + '-n in order, title, bok and body required');
    if (l.status !== 'Draft' && l.status !== '') errors.push(lw + ': status must be Draft or empty');
    for (const p of l.body) if (!/\([^()]*\b(Read|Relayed|Inferred|Computed|computed)\b[^()]*\)\s*$/.test(p)) errors.push(lw + ': every paragraph needs a tier tag: ' + p.slice(0, 60));
    for (const k of l.sources) if (!SRC[k]) errors.push(lw + ': unknown source ' + k);
    const figs = (l.figs || []).map(g => { if (!(g.after >= 0 && g.after < l.body.length) || FIGS.kinds.indexOf(g.kind) === -1) { errors.push(lw + ': bad figure ' + JSON.stringify(g)); return null; } return Object.assign({ after: g.after, kind: g.kind }, FIGS.draw(g.kind, NUMS)); }).filter(Boolean);
    return { id: l.id, title: l.title, bok: l.bok, status: l.status, body: l.body.map(p => fill(p, lw)), sources: l.sources.map(k => SRC[k]).filter(Boolean), figs };
  });
  if (o && lessons.length !== o.counts.length) errors.push(w + ': ' + o.counts.length + ' lessons in the approved outline, got ' + lessons.length);
  const pos = [0, 0, 0, 0];
  const questions = src.questions.map((q, i) => {
    const qw = 'question ' + q.id; claim(q.id, qw);
    if (q.id !== d.qPrefix + '-' + String(i + 1).padStart(2, '0')) errors.push(qw + ': ids must run ' + d.qPrefix + '-01.. in order');
    if (!lessons.some(l => l.id === q.lesson)) errors.push(qw + ': unknown lesson ' + q.lesson);
    if (!new RegExp('^' + d.bok + '\\.').test(q.bok) && q.bok !== d.bok) errors.push(qw + ': BoK code ' + q.bok + ' is not in section ' + d.bok);
    if (LEVELS.indexOf(q.level) === -1) errors.push(qw + ': level must be one of ' + LEVELS.join(', '));
    if (!Array.isArray(q.options) || q.options.length !== 4 || !(q.answer >= 0 && q.answer < 4) || !q.why || words(q.stem) < 6) errors.push(qw + ': stem, four options, an answer and a why');
    for (let j = 0; j < 4; j++) { if (j !== q.answer && !(q.whyNot && q.whyNot[j])) errors.push(qw + ': option ' + j + ' needs a whyNot'); }
    if (q.whyNot && q.whyNot[q.answer]) errors.push(qw + ': the answer has a whyNot');
    pos[q.answer]++;
    const out = { id: q.id, mock: q.mock !== false, lesson: q.lesson, bok: q.bok, level: q.level, status: q.status === undefined ? 'Draft' : q.status, stem: fill(q.stem, qw), options: q.options.map(x => fill(x, qw)), answer: q.answer, why: fill(q.why, qw), whyNot: {} };
    for (const j in q.whyNot) out.whyNot[j] = fill(q.whyNot[j], qw);
    if (new Set(out.options).size !== 4) errors.push(qw + ': two options print the same text: ' + out.options.join(' | '));
    return out;
  });
  if (o) o.counts.forEach((n, i) => { const got = questions.filter(q => q.lesson === d.prefix + '-' + (i + 1)).length; if (got !== n) errors.push(w + ': lesson ' + d.prefix + '-' + (i + 1) + ' needs ' + n + ' questions (outline), has ' + got); });
  // Option length must not give the answer away (blind check, Nov 24): the keyed option is never more than 1.3 times
  // its longest distractor, and it is the strictly longest option in at most 30% of a deck's questions (25% is chance).
  { let longest = 0;
    for (const q of questions) { const L = q.options.map(o => o.length), k = L[q.answer], other = Math.max(...L.filter((x, j) => j !== q.answer));
      if (k > 1.3 * other) errors.push('question ' + q.id + ': keyed option is ' + (k / other).toFixed(2) + ' times the longest distractor (limit 1.3)');
      if (L.every((x, j) => j === q.answer || x < k)) longest++; }
    if (longest > Math.floor(0.3 * questions.length)) errors.push(w + ': keyed option is the longest in ' + longest + ' of ' + questions.length + ' questions (limit ' + Math.floor(0.3 * questions.length) + ')'); }
  { const n = questions.length, lo = Math.floor(0.2 * n), hi = Math.ceil(0.3 * n);   // each of A–D keyed 20–30% of the time
    if (pos.some(k => k < lo || k > hi)) errors.push(w + ': keyed answers should spread over A–D, each ' + lo + '–' + hi + ' (got ' + pos.join('/') + ')'); }
  const cards = src.cards.map((c, i) => {
    const cw = 'card ' + c.id; claim(c.id, cw);
    if (c.id !== d.cPrefix + '-' + String(i + 1).padStart(2, '0') || !c.front || !c.back) errors.push(cw + ': id ' + d.cPrefix + '-nn in order, front and back');
    return { id: c.id, front: fill(c.front, cw), back: fill(c.back, cw), status: c.status === undefined ? 'Draft' : c.status };
  });
  if (o && cards.length !== o.cards) errors.push(w + ': ' + o.cards + ' cards in the approved outline, got ' + cards.length);
  return { id: d.id, title: d.title, bok: d.bok, scored: d.scored, lessons, questions, cards, keyPositions: pos };
});
for (const dk of DECKS) for (const t of [].concat(...dk.lessons.map(l => l.body.concat(l.figs.map(g => g.svg))), ...dk.questions.map(q => [q.stem, q.why].concat(q.options, Object.values(q.whyNot))), ...dk.cards.map(c => [c.front, c.back])))
  if (/\{\{|NaN|undefined|Infinity/.test(t)) errors.push('unfilled or bad number in: ' + t.slice(0, 80));

// ---- Timed mock (route #mock; option A approved Nov 24): 110 questions drawn from the deck bank by section.
// ASQ: 100 scored + 10 unscored, 4 h 18 min (Read). Scored split 11/20/20/18/16/15 (Read, BoK). ASQ does not say how the
// 10 unscored items are spread, so they are drawn in the same ratio (largest remainder) and every item is scored (Inferred).
// Questions marked mock: false refer to a lesson's chart or table and are left out of the draw.
const MOCK = (() => {
  const secs = (L.sections.quality || []).filter(x => x.kind === 'Deck'), total = 110, scored = 100;
  const extra = secs.map(x => x.questions * (total - scored) / scored), base = extra.map(Math.floor);
  let left = (total - scored) - base.reduce((a, b) => a + b, 0);
  extra.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).forEach(([, i]) => { if (left > 0) { base[i]++; left--; } });
  const draw = {}; secs.forEach((x, i) => { draw[x.id] = x.questions + base[i]; });
  for (const id in draw) { const d = DECKS.find(k => k.id === id); if (!d) errors.push('mock: deck ' + id + ' missing'); else if (d.questions.filter(q => q.mock).length < draw[id]) errors.push('mock: deck ' + id + ' has ' + d.questions.filter(q => q.mock).length + ' questions that stand alone, mock draws ' + draw[id]); }
  if (Object.values(draw).reduce((a, b) => a + b, 0) !== total) errors.push('mock: draw does not total 110');
  return { id: 'mock', title: 'Timed mock', status: 'Draft', minutes: 4 * 60 + 18, total, draw, order: secs.map(x => x.id),
    scoring: 'ASQ reports a scaled score and certifies at 550 of a possible 750. The raw number of correct answers needed is set for each exam form by a Modified Angoff cut-score study and is not published, so this mock shows percent right by section and no pass line.',
    sources: ['asqexam', 'asqscore', 'asqgrade', 'bok'].map(k => SRC[k]) };
})();
claim('mock', 'mock');

// ---- Held-out mock pool (Phase 2b, approved Nov 24, 09:08 ET). Same rules as deck questions: four options, a why and a
// whyNot for each wrong option, lesson and BoK code in its section, option-length limits and key spread per section.
// The pool must hold exactly the mock's draw for each section, so a held-out mock uses every pool question once.
MOCK.pool = (() => {
  const P = require('./content/mock-pool.js'), CODE = { overview: 'OV', define: 'DF', measure: 'MS', analyze: 'AN', improve: 'IM', control: 'CO' }, out = {};
  for (const id of MOCK.order) {
    const dk = DECKS.find(k => k.id === id), list = P[id] || [], w = 'mock pool ' + id, pos = [0, 0, 0, 0];
    if (list.length !== MOCK.draw[id]) errors.push(w + ': ' + MOCK.draw[id] + ' questions needed (the draw), has ' + list.length);
    out[id] = list.map((q, i) => {
      const qw = 'mock question ' + q.id; claim(q.id, qw);
      if (q.id !== 'MK-' + CODE[id] + '-' + String(i + 1).padStart(2, '0')) errors.push(qw + ': ids must run MK-' + CODE[id] + '-01.. in order');
      if (!dk || !dk.lessons.some(l => l.id === q.lesson)) errors.push(qw + ': unknown lesson ' + q.lesson);
      if (dk && !new RegExp('^' + dk.bok + '\\.').test(q.bok)) errors.push(qw + ': BoK code ' + q.bok + ' is not in section ' + (dk && dk.bok));
      if (LEVELS.indexOf(q.level) === -1) errors.push(qw + ': level must be one of ' + LEVELS.join(', '));
      if (!Array.isArray(q.options) || q.options.length !== 4 || !(q.answer >= 0 && q.answer < 4) || !q.why || words(q.stem) < 6) errors.push(qw + ': stem, four options, an answer and a why');
      for (let j = 0; j < 4; j++) { if (j !== q.answer && !(q.whyNot && q.whyNot[j])) errors.push(qw + ': option ' + j + ' needs a whyNot'); }
      if (q.whyNot && q.whyNot[q.answer]) errors.push(qw + ': the answer has a whyNot');
      pos[q.answer]++;
      const o = { id: q.id, deck: id, held: true, lesson: q.lesson, bok: q.bok, level: q.level, status: q.status || 'Draft', stem: fill(q.stem, qw), options: q.options.map(x => fill(x, qw)), answer: q.answer, why: fill(q.why, qw), whyNot: {} };
      for (const j in q.whyNot) o.whyNot[j] = fill(q.whyNot[j], qw);
      if (new Set(o.options).size !== 4) errors.push(qw + ': two options print the same text: ' + o.options.join(' | '));
      const L = o.options.map(x => x.length), k = L[o.answer], other = Math.max(...L.filter((x, j) => j !== o.answer));
      if (k > 1.3 * other) errors.push(qw + ': keyed option is ' + (k / other).toFixed(2) + ' times the longest distractor (limit 1.3)');
      o.longest = L.every((x, j) => j === o.answer || x < k);
      return o;
    });
    const n = list.length, lo = Math.floor(0.2 * n), hi = Math.ceil(0.3 * n), longest = out[id].filter(x => x.longest).length;
    if (pos.some(k => k < lo || k > hi)) errors.push(w + ': keyed answers should spread over A–D, each ' + lo + '–' + hi + ' (got ' + pos.join('/') + ')');
    if (longest > Math.floor(0.3 * n)) errors.push(w + ': keyed option is the longest in ' + longest + ' of ' + n + ' (limit ' + Math.floor(0.3 * n) + ')');
    out[id].forEach(x => { delete x.longest; });
    MOCK.poolKeys = MOCK.poolKeys || {}; MOCK.poolKeys[id] = pos.join('/');
  }
  return out;
})();

// ---- Numbers and the Beer Game: JS against Python (math/check.js)
const mc = require('./math/check.js').check(Array.from(used.values()));
if (mc.errs.length) errors.push('math cross-check failed:\n  ' + mc.errs.slice(0, 20).join('\n  '));
const BEER = require('./content/beer.js');
for (const p of BEER.lesson) if (!/\((Read|Relayed|Inferred|Measured)/.test(p)) errors.push('beer lesson: every paragraph needs a tier tag');
claim(BEER.id, 'game');

// ---- Inventory sim (Phase 3): rules and demand in data/inventory.json; engine math/inventory.js, checked against
// math/inventory.py above. {key} placeholders in its text come from the checked engine.
const INVD = require('./data/inventory.json'), IE = require('./math/inventory.js'), INVC = require('./content/inventory.js');
claim(INVC.id, 'game');
const inventory = (() => {
  const R = INVD.rules, tb = mc.inventory.textbook, hs = mc.inventory.hindsight, nc = [tb[0], tb[0], tb[0], tb[0]];
  const S1 = IE.stats(IE.play(INVD, tb), INVD), S0 = IE.stats(IE.play(INVD, nc), INVD);
  const money = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 });
  const pct = f => (100 * f).toFixed(1) + '%';
  const V = { mean: R.mean, sd: R.sd, leadBefore: R.leadBefore, leadAfter: R.leadAfter, initOnHand: R.initOnHand, z: R.z,
    hold: (R.holdCents / 100).toFixed(2), order: R.orderCents / 100, lost: R.lostCents / 100, holdD: (R.holdCents / 100).toFixed(2), orderD: R.orderCents / 100,
    r1: R.reviews[0], r2: R.reviews[1], r3: R.reviews[2], eoq: tb[0].q, rop0: tb[0].rop, rop1: tb[1].rop, rop2: tb[2].rop,
    tbTotal: money(S1.total), tbFill: pct(S1.fill), ncTotal: money(S0.total), ncFill: pct(S0.fill),
    ncHoldSave: money(S1.hold - S0.hold), ncLostCost: money(S0.lost), ncLostUnits: S0.lostUnits, hsQ: hs.q, hsRop: hs.rop, hsTotal: money(hs.total) };
  const f = (t, w) => t.replace(/\{([A-Za-z0-9]+)\}/g, (m, k) => { if (!(k in V)) { errors.push('inventory ' + w + ': unknown {' + k + '}'); return m; } return String(V[k]); });
  INVC.lesson.forEach((p, i) => { if (!/\((Read|Relayed|Inferred|Measured|Computed)/.test(p)) errors.push('inventory lesson ' + (i + 1) + ': needs a tier tag'); });
  if (S0.total <= S1.total) errors.push('inventory: the textbook policy should beat the unchanged one on this demand');
  if (INVC.news.length !== R.reviews.length) errors.push('inventory: one news item per review');
  return { id: INVC.id, title: INVC.title, status: INVC.status, blurb: f(INVC.blurb, 'blurb'), briefing: INVC.briefing.map((p, i) => f(p, 'briefing ' + i)),
    news: INVC.news.map((p, i) => f(p, 'news ' + i)), lesson: INVC.lesson.map((p, i) => f(p, 'lesson ' + i)), sources: INVC.sources.map(k => SRC[k]),
    data: INVD, textbook: tb, hindsight: hs, ref: { textbook: S1, unchanged: S0 } };
})();

// Engines: no Craft or Simulations content yet. Craft packets will use ids TP-n, runs TPN-n, role-plays TPL-n.
const craft = loadCraft([], { dir: path.join(here, 'build', 'craft'), idPrefix: 'TP', takenIds: new Set() });
errors.push(...craft.errors);
const sims = validateSims({ runs: [], roleplays: [], runPrefix: 'TPN', rpPrefix: 'TPL', takenIds: new Set(craft.ids) });
errors.push(...sims.errors);

// Published link ids: the build refuses to drop any.
const PUB = path.join(here, 'published-ids.json');
const pub = JSON.parse(fs.readFileSync(PUB, 'utf8'));
const now = { lanes: laneIds, sections: sectionIds, craft: craft.ids, sims: sims.ids,
  lessons: [].concat(...DECKS.map(d => d.lessons.map(l => l.id))), questions: [].concat(...DECKS.map(d => d.questions.map(q => q.id))),
  cards: [].concat(...DECKS.map(d => d.cards.map(c => c.id))), decks: DECKS.map(d => d.id), games: [BEER.id, INVC.id], mocks: [MOCK.id], mockQuestions: [].concat(...Object.values(MOCK.pool).map(l => l.map(q => q.id))) };
for (const k of Object.keys(pub)) if (k !== 'note' && !(k in now)) errors.push('published-ids.json has an unknown kind ' + k);
for (const k of Object.keys(now)) for (const id of (pub[k] || [])) if (now[k].indexOf(id) === -1) errors.push('published ' + k + ' id ' + id + ' is missing; links depend on it');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
if (process.argv.includes('--record')) {
  const rec = { note: pub.note };
  for (const k of Object.keys(now)) rec[k] = Array.from(new Set((pub[k] || []).concat(now[k])));
  fs.writeFileSync(PUB, JSON.stringify(rec, null, 1) + '\n');
  console.log('recorded', Object.keys(now).map(k => rec[k].length + ' ' + k).join(', '));
}

const read = f => fs.readFileSync(path.join(here, f), 'utf8');
const kitVersion = read('vendor/study-kit/VERSION').split('\n')[0].trim();
const ref = { average: mc.beer.all_average, benchSeat: mc.beer.bench_in_seat };   // reference games, already checked against Python
const BG = require('./math/beer.js');
const beer = { id: BEER.id, title: BEER.title, status: BEER.status, blurb: BEER.blurb, briefing: BEER.briefing, lesson: BEER.lesson, sources: BEER.sources.map(k => SRC[k]),
  refTeam2: { average: BG.stats(ref.average).team2, bench: BG.stats(mc.beer.all_bench).team2 }, benchAll2: BG.stats(mc.beer.all_bench).stages.map(s => s.cost2), benchTeam2: ref.benchSeat.map(g => BG.stats(g).team2) };
const bank = { lanes: L.lanes, sections: L.sections, exam: L.exam, craft: craft.packets, runs: sims.runs, roleplays: sims.roleplays, kitVersion, decks: DECKS, beer, inventory, mock: MOCK };
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const json = JSON.stringify(bank).replace(/<\//g, '<\\/').split(LS).join('\\u2028').split(PS).join('\\u2029');
const tpl = read('index.src.html');
for (const t of ['__BANK__', '__STUDY_KIT__', '__SHELL_CSS__', '__KIT_CSS__', '__BEER_ENGINE__', '__INV_ENGINE__']) if (tpl.split(t).length !== 2) { console.error('template must contain one ' + t); process.exit(1); }
const kit = read('vendor/study-kit/study-kit.js').replace(/<\//g, '<\\/');
const out = tpl.replace('__SHELL_CSS__', () => read('vendor/study-kit/shell.css')).replace('__KIT_CSS__', () => read('vendor/study-kit/study-kit.css'))
  .replace('__STUDY_KIT__', () => kit).replace('__BEER_ENGINE__', () => read('math/beer.js').replace(/<\//g, '<\\/')).replace('__INV_ENGINE__', () => read('math/inventory.js').replace(/<\//g, '<\\/')).replace('__BANK__', () => json);
fs.mkdirSync(path.join(here, 'build'), { recursive: true });
fs.writeFileSync(path.join(here, 'build', 'index.html'), out);
fs.writeFileSync(path.join(here, 'build', 'bank.json'), JSON.stringify(bank));   // for the blind-check export; not published
console.log('study-kit', kitVersion, '· lanes', laneIds.length, '(active: quality) · sections', sectionIds.length,
  '· decks', DECKS.map(d => d.id + ' ' + d.lessons.length + 'L/' + d.questions.length + 'Q/' + d.cards.length + 'C keys ' + d.keyPositions.join('/')).join(', '),
  '· math', mc.n + ' values, JS = Python', '· bytes', Buffer.byteLength(out));
