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
// Link ids use the dash form only (#lane-quality, #lesson-df-1): study-kit v0.2.0's craft.route rejects dots.
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
for (const ln of L.lanes) {
  if (!ID.test(ln.id)) errors.push('lane ' + ln.id + ': bad id');
  claim(ln.id, 'lane'); laneIds.push(ln.id);
  if (!ln.name || !ln.blurb || !ln.short || !ln.color) errors.push('lane ' + ln.id + ': name, short, blurb and color required');
  if (/\b(CDO|CRO|CPO|CCO)\b/.test(ln.name)) errors.push('lane ' + ln.id + ': colliding bare acronym in the name');
}
if (laneIds.join() !== 'quality,supply-chain,coo') errors.push('lanes are quality, supply-chain, coo in that order');
if (L.lanes.filter(l => l.active).map(l => l.id).join() !== 'quality') errors.push('Phase 1: only the quality lane is active');
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

// ---- Decks (Phase 1: Define and Measure; outline approved Nov 24)
const FL = NUM.flat(NUM.compute()), used = new Map();
const fill = (s, w) => { try { String(s).replace(/\{\{([a-z0-9.]+)(?:\|([^}]+))?\}\}/gi, (m, k, f) => { used.set(k + '|' + (f || '0'), [k, f || '0']); return ''; }); return NUM.fill(s, FL); } catch (e) { errors.push(w + ': ' + e.message); return s; } };
const LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const OUTLINE = { define: { counts: [3, 3, 2, 4, 4, 4, 3, 4, 3], cards: 20 }, measure: { counts: [2, 4, 2, 4, 3, 4, 3, 2, 6], cards: 24 } };
const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const DECKS = [require('./content/define.js'), require('./content/measure.js')].map(src => {
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
    return { id: l.id, title: l.title, bok: l.bok, status: l.status, body: l.body.map(p => fill(p, lw)), sources: l.sources.map(k => SRC[k]).filter(Boolean) };
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
    const out = { id: q.id, lesson: q.lesson, bok: q.bok, level: q.level, status: q.status === undefined ? 'Draft' : q.status, stem: fill(q.stem, qw), options: q.options.map(x => fill(x, qw)), answer: q.answer, why: fill(q.why, qw), whyNot: {} };
    for (const j in q.whyNot) out.whyNot[j] = fill(q.whyNot[j], qw);
    if (new Set(out.options).size !== 4) errors.push(qw + ': two options print the same text: ' + out.options.join(' | '));
    return out;
  });
  if (o) o.counts.forEach((n, i) => { const got = questions.filter(q => q.lesson === d.prefix + '-' + (i + 1)).length; if (got !== n) errors.push(w + ': lesson ' + d.prefix + '-' + (i + 1) + ' needs ' + n + ' questions (outline), has ' + got); });
  if (pos.some(n => n < 5 || n > 10)) errors.push(w + ': keyed answers should spread over A–D (got ' + pos.join('/') + ')');
  const cards = src.cards.map((c, i) => {
    const cw = 'card ' + c.id; claim(c.id, cw);
    if (c.id !== d.cPrefix + '-' + String(i + 1).padStart(2, '0') || !c.front || !c.back) errors.push(cw + ': id ' + d.cPrefix + '-nn in order, front and back');
    return { id: c.id, front: fill(c.front, cw), back: fill(c.back, cw), status: c.status === undefined ? 'Draft' : c.status };
  });
  if (o && cards.length !== o.cards) errors.push(w + ': ' + o.cards + ' cards in the approved outline, got ' + cards.length);
  return { id: d.id, title: d.title, bok: d.bok, scored: d.scored, lessons, questions, cards, keyPositions: pos };
});
for (const dk of DECKS) for (const t of [].concat(...dk.lessons.map(l => l.body), ...dk.questions.map(q => [q.stem, q.why].concat(q.options, Object.values(q.whyNot))), ...dk.cards.map(c => [c.front, c.back])))
  if (/\{\{|NaN|undefined|Infinity/.test(t)) errors.push('unfilled or bad number in: ' + t.slice(0, 80));

// ---- Numbers and the Beer Game: JS against Python (math/check.js)
const mc = require('./math/check.js').check(Array.from(used.values()));
if (mc.errs.length) errors.push('math cross-check failed:\n  ' + mc.errs.slice(0, 20).join('\n  '));
const BEER = require('./content/beer.js');
for (const p of BEER.lesson) if (!/\((Read|Relayed|Inferred|Measured)/.test(p)) errors.push('beer lesson: every paragraph needs a tier tag');
claim(BEER.id, 'game');

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
  cards: [].concat(...DECKS.map(d => d.cards.map(c => c.id))), decks: DECKS.map(d => d.id), games: [BEER.id] };
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
const bank = { lanes: L.lanes, sections: L.sections, exam: L.exam, craft: craft.packets, runs: sims.runs, roleplays: sims.roleplays, kitVersion, decks: DECKS, beer };
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const json = JSON.stringify(bank).replace(/<\//g, '<\\/').split(LS).join('\\u2028').split(PS).join('\\u2029');
const tpl = read('index.src.html');
for (const t of ['__BANK__', '__STUDY_KIT__', '__SHELL_CSS__', '__KIT_CSS__', '__BEER_ENGINE__']) if (tpl.split(t).length !== 2) { console.error('template must contain one ' + t); process.exit(1); }
const kit = read('vendor/study-kit/study-kit.js').replace(/<\//g, '<\\/');
const out = tpl.replace('__SHELL_CSS__', () => read('vendor/study-kit/shell.css')).replace('__KIT_CSS__', () => read('vendor/study-kit/study-kit.css'))
  .replace('__STUDY_KIT__', () => kit).replace('__BEER_ENGINE__', () => read('math/beer.js').replace(/<\//g, '<\\/')).replace('__BANK__', () => json);
fs.mkdirSync(path.join(here, 'build'), { recursive: true });
fs.writeFileSync(path.join(here, 'build', 'index.html'), out);
fs.writeFileSync(path.join(here, 'build', 'bank.json'), JSON.stringify(bank));   // for the blind-check export; not published
console.log('study-kit', kitVersion, '· lanes', laneIds.length, '(active: quality) · sections', sectionIds.length,
  '· decks', DECKS.map(d => d.id + ' ' + d.lessons.length + 'L/' + d.questions.length + 'Q/' + d.cards.length + 'C keys ' + d.keyPositions.join('/')).join(', '),
  '· math', mc.n + ' values, JS = Python', '· bytes', Buffer.byteLength(out));
