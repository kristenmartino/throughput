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
if (L.lanes.filter(l => l.active).map(l => l.id).join() !== 'quality,supply-chain,coo') errors.push('Phase 4: all three lanes are active');
const levelIds = (L.levels || []).map(l => l.id);
if (levelIds.join() !== 'director,vp,c-level') errors.push('levels are director, vp, c-level');
const badLevels = v => !Array.isArray(v) || !v.length || v.some(x => levelIds.indexOf(x) === -1);
{ const w = (L.sections['supply-chain'] || []).filter(s => s.kind === 'Deck' && s.weight).map(s => s.weight);   // ASCM CSCP ECM v5.0 weights (Read, Nov 24)
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
const fill = (s, w) => { try { String(s).replace(/\{\{([a-z0-9.]+)(?:\|([^}]+))?\}\}/gi, (m, k, f) => { used.set(k + '|' + (f || '0'), [k, f || '0']); if (!f && typeof FL[k] === 'number' && !Number.isInteger(FL[k])) errors.push(w + ': {{' + k + '}} is ' + FL[k] + ' but has no format, so it prints rounded to a whole number'); return ''; }); return NUM.fill(s, FL); } catch (e) { errors.push(w + ': ' + e.message); return s; } };
const LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const OUTLINE = { overview: { counts: [3, 3, 3, 2, 2, 3], cards: 16 }, define: { counts: [3, 3, 2, 4, 4, 4, 3, 4, 3], cards: 20 }, measure: { counts: [2, 4, 2, 4, 3, 4, 3, 2, 6], cards: 24 },
  analyze: { counts: [3, 3, 3, 4, 4, 3, 3, 2, 2], cards: 22 }, improve: { counts: [4, 4, 3, 3, 3, 4, 3], cards: 20 }, control: { counts: [4, 2, 5, 4, 3, 3, 2], cards: 22 },
  // Supply chain (Phase 3, approved Nov 24): questions, lessons and cards in ASCM's module weights (150 / 48 / 112 by
  // largest remainder, ties to the heavier module); lessons follow the sections of ASCM's 2026 module outline.
  sc1: { counts: [3, 3, 2, 4, 3], cards: 11 }, sc2: { counts: [3, 4, 3, 3, 2], cards: 11 }, sc3: { counts: [3, 4, 3, 3, 3, 4, 3, 3], cards: 19 },
  sc4: { counts: [3, 4, 3, 3, 3, 4, 3, 3, 3], cards: 22 }, sc5: { counts: [3, 4, 3, 3], cards: 10 }, sc6: { counts: [3, 4, 3, 3, 3, 3, 3, 3], cards: 19 },
  sc7: { counts: [3, 3, 3, 3, 3], cards: 11 }, sc8: { counts: [3, 3, 3, 3], cards: 9 },
  // COO lane and the Chief Procurement Officer deck (Phase 4, approved Nov 24): 5 lessons, 12 questions, 10 cards each.
  coo1: { counts: [3, 3, 2, 2, 2], cards: 10 }, coo2: { counts: [3, 3, 2, 2, 2], cards: 10 }, coo3: { counts: [3, 3, 2, 2, 2], cards: 10 },
  coo4: { counts: [3, 3, 2, 2, 2], cards: 10 }, coo5: { counts: [3, 3, 2, 2, 2], cards: 10 }, coo6: { counts: [3, 3, 2, 2, 2], cards: 10 },
  cpo1: { counts: [3, 3, 2, 2, 2], cards: 10 } };
{ const t = k => ['sc1', 'sc2', 'sc3', 'sc4', 'sc5', 'sc6', 'sc7', 'sc8'].map(id => k === 'q' ? OUTLINE[id].counts.reduce((a, b) => a + b, 0) : k === 'l' ? OUTLINE[id].counts.length : OUTLINE[id].cards);
  if (t('q').join() !== '15,15,26,29,13,25,15,12' || t('l').join() !== '5,5,8,9,4,8,5,4' || t('c').join() !== '11,11,19,22,10,19,11,9') errors.push('supply chain outline must follow the ASCM weights: questions ' + t('q') + ', lessons ' + t('l') + ', cards ' + t('c')); }
const FIGS = require('./math/figs.js'), NUMS = NUM.compute();
const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const DECKS = ['overview', 'define', 'measure', 'analyze', 'improve', 'control', 'sc4', 'sc1', 'sc5', 'sc2', 'sc3', 'sc7', 'sc6', 'sc8', 'coo1', 'coo2', 'coo3', 'coo4', 'coo5', 'coo6', 'cpo1'].filter(id => fs.existsSync(path.join(here, 'content', id + '.js'))).map(id => require('./content/' + id + '.js')).map(src => {
  const d = src.deck, o = OUTLINE[d.id], w = 'deck ' + d.id, lane = d.lane || 'quality', leveled = !!d.leveled;
  if (leveled !== (lane === 'coo' || d.id === 'cpo1')) errors.push(w + ': COO lane decks and cpo1 carry level tags; no other deck does');
  const lv = (x, xw) => { if (!leveled) return undefined; if (badLevels(x.levels)) errors.push(xw + ': levels must be a non-empty list of ' + levelIds.join(', ')); return x.levels; };
  if (!o || sectionIds.indexOf(lane + '-' + d.id) === -1) errors.push(w + ': no section ' + lane + '-' + d.id);
  if (!ID.test(d.id)) errors.push(w + ': bad id');
  claim('deck-' + d.id, w);
  const lessons = src.lessons.map((l, i) => {
    const lw = 'lesson ' + l.id; claim(l.id, lw);
    if (l.id !== d.prefix + '-' + (i + 1) || !l.title || !l.bok || !Array.isArray(l.body) || !l.body.length) errors.push(lw + ': id ' + d.prefix + '-n in order, title, bok and body required');
    if (l.status !== 'Draft' && l.status !== '') errors.push(lw + ': status must be Draft or empty');
    for (const p of l.body) if (!/\([^()]*\b(Read|Relayed|Inferred|Computed|computed)\b[^()]*\)\s*$/.test(p)) errors.push(lw + ': every paragraph needs a tier tag: ' + p.slice(0, 60));
    for (const k of l.sources) if (!SRC[k]) errors.push(lw + ': unknown source ' + k);
    const figs = (l.figs || []).map(g => { if (!(g.after >= 0 && g.after < l.body.length) || FIGS.kinds.indexOf(g.kind) === -1) { errors.push(lw + ': bad figure ' + JSON.stringify(g)); return null; } return Object.assign({ after: g.after, kind: g.kind }, FIGS.draw(g.kind, NUMS)); }).filter(Boolean);
    return { id: l.id, title: l.title, bok: l.bok, status: l.status, levels: lv(l, lw), body: l.body.map(p => fill(p, lw)), sources: l.sources.map(k => SRC[k]).filter(Boolean), figs };
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
    const out = { id: q.id, levels: lv(q, qw), mock: q.mock !== false, lesson: q.lesson, bok: q.bok, level: q.level, status: q.status === undefined ? 'Draft' : q.status, stem: fill(q.stem, qw), options: q.options.map(x => fill(x, qw)), answer: q.answer, why: fill(q.why, qw), whyNot: {} };
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
    return { id: c.id, levels: lv(c, cw), front: fill(c.front, cw), back: fill(c.back, cw), status: c.status === undefined ? 'Draft' : c.status };
  });
  if (o && cards.length !== o.cards) errors.push(w + ': ' + o.cards + ' cards in the approved outline, got ' + cards.length);
  const ln = L.lanes.find(x => x.id === lane), sec = (L.sections[lane] || []).find(x => x.id === d.id) || {};
  return { id: d.id, title: d.title, bok: d.bok, scored: d.scored, weight: sec.weight, lane, laneShort: ln ? ln.short : lane,
    leveled, bokLabel: d.bokLabel || (lane === 'quality' ? 'ASQ BoK section' : 'CSCP module'), lessons, questions, cards, keyPositions: pos };
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
    lane: 'quality', laneShort: 'Quality', exam: 'ASQ CSSGB', dur: '4 h 18 min', route: '#mock', keys: { run: 'run', last: 'last' }, secLabel: 'Section',
    intro: '110 questions in 4 hours 18 minutes, as on the computer-based exam: 100 scored and 10 unscored there; here every question counts, split across the six sections in the Body of Knowledge ratio.',
    deckNote: 'Deck questions: drawn from the practice questions in the six decks, so you may have seen some before. A different draw each run.',
    scoring: 'ASQ reports a scaled score and certifies at 550 of a possible 750. The raw number of correct answers needed is set for each exam form by a Modified Angoff cut-score study and is not published, so this mock shows percent right by section and no pass line.',
    sources: ['asqexam', 'asqscore', 'asqgrade', 'bok'].map(k => SRC[k]) };
})();
claim('mock', 'mock');

// ---- Held-out mock pool (Phase 2b, approved Nov 24, 09:08 ET). Same rules as deck questions: four options, a why and a
// whyNot for each wrong option, lesson and BoK code in its section, option-length limits and key spread per section.
// The pool must hold exactly the mock's draw for each section, so a held-out mock uses every pool question once.
function buildPool(MOCK, P, CODE) {
  const out = {};
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
}
MOCK.pool = buildPool(MOCK, require('./content/mock-pool.js'), { overview: 'OV', define: 'DF', measure: 'MS', analyze: 'AN', improve: 'IM', control: 'CO' });

// ---- CSCP timed mock (Phase 3b; decision 3B approved Nov 24, 09:50 ET). ASCM: 150 questions (130 scored, 20 unscored
// pretest), 3.5 hours (Read, ASCM exam page). ASCM does not say how pretest items are spread, so all 150 count and the draw
// per module is the deck size, which follows the ECM weights (largest remainder). Held-out pool by default, as Green Belt.
const CSCP = (() => {
  const secs = (L.sections['supply-chain'] || []).filter(x => x.kind === 'Deck' && x.weight), draw = {};
  secs.forEach(x => { const d = DECKS.find(k => k.id === x.id); draw[x.id] = d ? d.questions.length : 0; });
  const total = Object.values(draw).reduce((a, b) => a + b, 0);
  if (total !== 150) errors.push('CSCP mock: draw totals ' + total + ', not 150');
  return { id: 'cscp-mock', title: 'CSCP timed mock', status: 'Draft', minutes: 210, total, draw, order: secs.map(x => x.id),
    lane: 'supply-chain', laneShort: 'Supply chain', exam: 'ASCM CSCP', dur: '3 h 30 min', route: '#mock-cscp', keys: { run: 'cscpRun', last: 'cscpLast' }, secLabel: 'Module',
    intro: '150 questions in 3 hours 30 minutes, as on the exam: 130 scored and 20 unscored pretest questions there; here every question counts, split across the eight modules by ASCM\'s published weights.',
    deckNote: 'Deck questions: all 150 practice questions from the eight decks, so you have probably seen them. A new order each run.',
    scoring: 'ASCM reports a scaled score from 200 to 350 and passes at 300. This app has found no published way to turn a count of right answers into that scale, so this mock shows percent right by module and no pass line.',
    sources: ['cscpexam', 'cscpecm'].map(k => SRC[k]) };
})();
claim(CSCP.id, 'mock');
CSCP.pool = buildPool(CSCP, require('./content/mock-pool-cscp.js'), { sc1: 'SC1', sc2: 'SC2', sc3: 'SC3', sc4: 'SC4', sc5: 'SC5', sc6: 'SC6', sc7: 'SC7', sc8: 'SC8' });

// ---- Numbers and the Beer Game: JS against Python (math/check.js)
const mc = require('./math/check.js').check(Array.from(used.values()));
if (mc.errs.length) errors.push('math cross-check failed:\n  ' + mc.errs.slice(0, 20).join('\n  '));
const BEER = require('./content/beer.js');
for (const p of BEER.lesson) if (!/\((Read|Relayed|Inferred|Measured)/.test(p)) errors.push('beer lesson: every paragraph needs a tier tag');
claim(BEER.id, 'game');

// ---- Bottleneck line (Phase 3): engine math/bottleneck.js, checked against math/bottleneck.py above. The lesson's
// claims are asserted here, so a change to the rules that breaks one stops the build.
const BN = require('./math/bottleneck.js'), BNC = require('./content/bottleneck.js');
claim(BNC.id, 'game');
const bottleneck = (() => {
  const R = BN.RULES, K = R.kinds, best = mc.bottleneck.best, none = Array(R.rounds).fill(-1);
  const at = (t, b) => { const x = none.slice(); x[t] = b; return x; };
  const run = p => BN.stats(BN.play(p)), push = run({ release: 'push', buys: none }), rope = run({ release: 'rope', buys: none });
  const minCap = Math.min.apply(null, R.caps), c0 = R.caps.indexOf(minCap), waste = 0;
  const wasted = run({ release: 'rope', buys: [waste, waste, waste].concat(none.slice(3)) });
  const bufBuy = 14 + c0, pushBuf = run({ release: 'push', buys: at(0, bufBuy) });
  const capA = run({ release: 'rope', buys: at(0, c0) }), setupA = run({ release: 'rope', buys: at(0, 5 + c0) }), overA1 = run({ release: 'rope', buys: at(0, 10 + c0) });
  const afterSetup = R.caps.slice(); afterSetup[c0] += K.setup.add; const c1cap = Math.min.apply(null, afterSetup), c1 = afterSetup.indexOf(c1cap);
  let bestOver = null; for (const release of ['rope', 'push']) for (let t = 0; t < R.rounds; t++) for (let s = 0; s < 5; s++) { const st = run({ release, buys: at(t, 10 + s) }); if (!bestOver || st.profit > bestOver.profit) bestOver = { release, t, s, profit: st.profit }; }
  const idle = rel => { const h = BN.play({ release: rel, buys: none }).h; return h.done.reduce((a, d, t) => a + h.rate[t][c0] - d[c0] - h.blocked[t][c0], 0); }, ropeIdle = idle('rope'), pushIdle = idle('push');
  if (!(pushIdle < ropeIdle) || ropeIdle - pushIdle !== push.out - rope.out) errors.push('bottleneck lesson 2: push should sell more only because the constraint idles less');
  if (!(bestOver.profit < Math.max(rope.profit, push.profit))) errors.push('bottleneck lesson 6: no single overtime purchase should pay');
  const usd = d => (d < 0 ? '−$' : '$') + Math.abs(d).toLocaleString('en-US');
  const buyText = (b, t) => { const d = BN.decode(b); return K[d.kind].label.toLowerCase() + (d.kind === 'buf' ? ' in front of ' : ' at ') + R.names[d.s] + ' in round ' + (t + 1); };
  const planText = p => (p.release === 'rope' ? 'pace release to the constraint' : 'push') + (p.buys.some(b => b >= 0) ? ', then buy ' + p.buys.map((b, t) => b >= 0 ? buyText(b, t) : null).filter(Boolean).join(', ') : ', and buy nothing');
  // Each lesson claim, asserted from the engine.
  if (!(push.out >= rope.out) || !(push.profit < rope.profit) || !(push.endWip > rope.endWip) || !(push.blocked > 0) || rope.blocked !== 0) errors.push('bottleneck lesson 2: push should sell at least as much, block, and end with more WIP and less profit');
  if (wasted.out !== rope.out || wasted.profit !== rope.profit - 3 * K.cap.cost || waste === c0) errors.push('bottleneck lesson 4: capacity at a non-constraint should change nothing but cost');
  if (pushBuf.out !== push.out || !(pushBuf.blocked < push.blocked) || pushBuf.profit !== push.profit - K.buf.cost) errors.push('bottleneck lesson 4: buffer space under push should cut blocking but not sales');
  if (capA.out !== setupA.out || !(setupA.profit > capA.profit) || !(c1cap < R.caps[c0] + K.cap.add) || !(c1cap <= R.caps[c0] + K.setup.add)) errors.push('bottleneck lesson 5: setup reduction at the constraint should match capacity on sales and beat it on profit');
  const carryGap = (capA.avgWip - setupA.avgWip) * R.rounds * R.wipCost, priceGap = K.cap.cost - K.setup.cost;
  if (Math.abs(setupA.profit - capA.profit - priceGap - carryGap) > 1e-6 || !(capA.blocked > setupA.blocked)) errors.push('bottleneck lesson 5: the setup-capacity gap should be price plus carrying cost');
  if (!(best.buys.findIndex(b => b >= 0 && BN.decode(b).s === c0) < best.buys.findIndex(b => b >= 0 && BN.decode(b).s === c1))) errors.push('bottleneck lesson 5: the best plan should raise the constraint before the next one');
  if (!(overA1.profit < rope.profit) || overA1.out !== rope.out) errors.push('bottleneck lesson 6: overtime at the constraint in round 1 should not pay');
  if (best.release !== 'rope' || !best.buys.some(b => b >= 0 && BN.decode(b).s === c0)) errors.push('bottleneck lesson 7: the best plan should pace release and elevate the constraint');
  const V = { rounds: R.rounds, budget: usd(R.budget), stations: R.names.join(', '), init: R.init, buf: R.buf, caps: R.names.map((nm, i) => nm + ' ' + R.caps[i]).join(', '),
    margin: usd(R.margin), wipCost: usd(R.wipCost), cap0: R.caps[0], maxBuys: R.maxBuys,
    capAdd: K.cap.add, capCost: usd(K.cap.cost), setupAdd: K.setup.add, setupCost: usd(K.setup.cost), setupDelay: K.setup.delay, setupRound: 1 + K.setup.delay,
    overAdd: K.over.add, overCost: usd(K.over.cost), bufAdd: K.buf.add, bufCost: usd(K.buf.cost),
    c0name: R.names[c0], c0cap: minCap, c1name: R.names[c1], c1cap, wasteName: R.names[waste], bufBuyName: 'buffer space',
    pushOut: push.out, ropeOut: rope.out, ropeIdle, pushIdle, pushEndWip: push.endWip, ropeEndWip: rope.endWip, pushBlocked: push.blocked, pushBufBlocked: pushBuf.blocked,
    pushProfit: usd(push.profit), ropeProfit: usd(rope.profit), ropeWip: rope.avgWip.toFixed(1), ropeLead: rope.lead.toFixed(1), pushLead: push.lead.toFixed(1),
    wasted: usd(rope.profit - wasted.profit), capAProfit: usd(capA.profit), setupAProfit: usd(setupA.profit), capAOut: capA.out, capABlocked: capA.blocked, setupABlocked: setupA.blocked, setupGap: usd(setupA.profit - capA.profit), priceGap: usd(priceGap), carryGap: usd(carryGap), overA1Profit: usd(overA1.profit),
    bestOverText: (bestOver.release === 'rope' ? 'with pacing, ' : 'with push, ') + 'overtime at ' + R.names[bestOver.s] + ' in round ' + (bestOver.t + 1), bestOverProfit: usd(bestOver.profit),
    searched: best.searched.toLocaleString('en-US'), bestPlan: planText(best), bestProfit: usd(best.profit) };
  const f = (t, w) => t.replace(/\{([A-Za-z0-9]+)\}/g, (m, k) => { if (!(k in V)) { errors.push('bottleneck ' + w + ': unknown {' + k + '}'); return m; } return String(V[k]); });
  BNC.lesson.forEach((p, i) => { if (!/\((Read|Relayed|Inferred|Measured|Computed)/.test(p)) errors.push('bottleneck lesson ' + (i + 1) + ': needs a tier tag'); });
  return { id: BNC.id, title: BNC.title, status: BNC.status, blurb: f(BNC.blurb, 'blurb'), briefing: BNC.briefing.map((p, i) => f(p, 'briefing ' + i)),
    lesson: BNC.lesson.map((p, i) => f(p, 'lesson ' + i)), sources: BNC.sources.map(k => SRC[k]), best, bestText: planText(best), ref: { push, rope } };
})();

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
    ncHoldSave: money(S1.hold - S0.hold), ncLostCost: money(S0.lost), ncOrdSave: money(S1.order - S0.order), ncNet: money(S1.total - S0.total), ncLostUnits: S0.lostUnits, hsQ: hs.q, hsRop: hs.rop, hsTotal: money(hs.total) };
  const f = (t, w) => t.replace(/\{([A-Za-z0-9]+)\}/g, (m, k) => { if (!(k in V)) { errors.push('inventory ' + w + ': unknown {' + k + '}'); return m; } return String(V[k]); });
  INVC.lesson.forEach((p, i) => { if (!/\((Read|Relayed|Inferred|Measured|Computed)/.test(p)) errors.push('inventory lesson ' + (i + 1) + ': needs a tier tag'); });
  if (S0.total <= S1.total) errors.push('inventory: the textbook policy should beat the unchanged one on this demand');
  if (INVC.news.length !== R.reviews.length) errors.push('inventory: one news item per review');
  return { id: INVC.id, title: INVC.title, status: INVC.status, blurb: f(INVC.blurb, 'blurb'), briefing: INVC.briefing.map((p, i) => f(p, 'briefing ' + i)),
    news: INVC.news.map((p, i) => f(p, 'news ' + i)), lesson: INVC.lesson.map((p, i) => f(p, 'lesson ' + i)), sources: INVC.sources.map(k => SRC[k]),
    data: INVD, textbook: tb, hindsight: hs, ref: { textbook: S1, unchanged: S0 } };
})();

// Engines (Phase 4): Craft packets TP-n (craft-stages.js + craft-src/*.md, numbers filled from math/ into build/craft/),
// runs TPN-n (sims-runs.js) and role-plays TPL-n (sims-roleplay.js), all validated by study-kit's tools. Each item also
// carries lane, section and level tags.
const craftDefs = fs.existsSync(path.join(here, 'craft-stages.js')) ? require('./craft-stages.js') : [];
const craftDir = path.join(here, 'build', 'craft'); fs.mkdirSync(craftDir, { recursive: true });
for (const d of craftDefs) {
  try { fs.writeFileSync(path.join(craftDir, d.file), fill(fs.readFileSync(path.join(here, 'craft-src', d.file), 'utf8'), 'packet ' + d.id)); } catch (e) { errors.push('packet ' + d.id + ': ' + e.message); }
  for (const st of d.stages) st.checklist = st.checklist.map(x => fill(x, 'stage ' + st.id));
}
const craft = loadCraft(craftDefs, { dir: craftDir, idPrefix: 'TP', takenIds: new Set() });
errors.push(...craft.errors);
const runDefs = fs.existsSync(path.join(here, 'sims-runs.js')) ? require('./sims-runs.js')(fill) : [];
const rpDefs = fs.existsSync(path.join(here, 'sims-roleplay.js')) ? require('./sims-roleplay.js')(fill) : [];
const sims = validateSims({ runs: runDefs, roleplays: rpDefs, runPrefix: 'TPN', rpPrefix: 'TPL', takenIds: new Set(craft.ids) });
errors.push(...sims.errors);
for (const x of [].concat(craftDefs, runDefs, rpDefs)) {
  if (sectionIds.indexOf(x.lane + '-' + x.section) === -1) errors.push(x.id + ': unknown section ' + x.lane + '-' + x.section);
  if (badLevels(x.levels)) errors.push(x.id + ': levels must be a non-empty list of ' + levelIds.join(', '));
  if (x.status !== 'Draft' && x.status !== '') errors.push(x.id + ': status must be Draft or empty');
}
for (const d of craftDefs) for (const st of d.stages) if (levelIds.indexOf(st.level) === -1) errors.push(st.id + ': stage level must be one of ' + levelIds.join(', '));
for (const p of craft.packets) { const d = craftDefs.find(x => x.id === p.id); p.lane = d.lane; p.levels = d.levels; p.section = d.section; p.status = d.status; p.stages.forEach((st, i) => { st.level = d.stages[i].level; }); }
for (const t of [].concat(...craft.packets.map(p => [p.title].concat(p.stages.map(st => JSON.stringify(st)))), ...sims.runs.map(r => JSON.stringify(r)), ...sims.roleplays.map(r => JSON.stringify(r))))
  if (/\{\{|NaN|Infinity/.test(t)) errors.push('unfilled or bad number in a packet, run or role-play: ' + t.slice(0, 80));

// Published link ids: the build refuses to drop any.
const PUB = path.join(here, 'published-ids.json');
const pub = JSON.parse(fs.readFileSync(PUB, 'utf8'));
const now = { lanes: laneIds, sections: sectionIds, craft: craft.ids, sims: sims.ids,
  lessons: [].concat(...DECKS.map(d => d.lessons.map(l => l.id))), questions: [].concat(...DECKS.map(d => d.questions.map(q => q.id))),
  cards: [].concat(...DECKS.map(d => d.cards.map(c => c.id))), decks: DECKS.map(d => d.id), games: [BEER.id, INVC.id, BNC.id], mocks: [MOCK.id, CSCP.id], mockQuestions: [].concat(...[MOCK, CSCP].map(m => [].concat(...Object.values(m.pool).map(l => l.map(q => q.id))))) };
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
const bank = { levels: L.levels, lanes: L.lanes, sections: L.sections, exam: L.exam, craft: craft.packets, runs: sims.runs, roleplays: sims.roleplays, kitVersion, decks: DECKS, beer, inventory, bottleneck, mock: MOCK, mocks: { mock: MOCK, cscp: CSCP } };
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const json = JSON.stringify(bank).replace(/<\//g, '<\\/').split(LS).join('\\u2028').split(PS).join('\\u2029');
const tpl = read('index.src.html');
for (const t of ['__BANK__', '__STUDY_KIT__', '__SHELL_CSS__', '__KIT_CSS__', '__BEER_ENGINE__', '__INV_ENGINE__', '__BN_ENGINE__']) if (tpl.split(t).length !== 2) { console.error('template must contain one ' + t); process.exit(1); }
const kit = read('vendor/study-kit/study-kit.js').replace(/<\//g, '<\\/');
const out = tpl.replace('__SHELL_CSS__', () => read('vendor/study-kit/shell.css')).replace('__KIT_CSS__', () => read('vendor/study-kit/study-kit.css'))
  .replace('__STUDY_KIT__', () => kit).replace('__BEER_ENGINE__', () => read('math/beer.js').replace(/<\//g, '<\\/')).replace('__INV_ENGINE__', () => read('math/inventory.js').replace(/<\//g, '<\\/')).replace('__BN_ENGINE__', () => read('math/bottleneck.js').replace(/<\//g, '<\\/')).replace('__BANK__', () => json);
fs.mkdirSync(path.join(here, 'build'), { recursive: true });
fs.writeFileSync(path.join(here, 'build', 'index.html'), out);
fs.writeFileSync(path.join(here, 'build', 'bank.json'), JSON.stringify(bank));   // for the blind-check export; not published
console.log('study-kit', kitVersion, '· lanes', laneIds.length, '(active: ' + L.lanes.filter(l => l.active).map(l => l.id).join(', ') + ') · sections', sectionIds.length,
  '· decks', DECKS.map(d => d.id + ' ' + d.lessons.length + 'L/' + d.questions.length + 'Q/' + d.cards.length + 'C keys ' + d.keyPositions.join('/')).join(', '),
  '· math', mc.n + ' values, JS = Python', '· bytes', Buffer.byteLength(out));
