// Builds build/index.html from index.src.html and the lane data, after validating them.
// Engines come from study-kit, pinned in vendor/study-kit/VERSION. Never edit the vendored files by hand.
// `node build.js --record` adds every current link id to published-ids.json (run after a publish).
'use strict';
const fs = require('fs');
const path = require('path');
const here = __dirname;
const { loadCraft } = require('./vendor/study-kit/tools/craft-parse.js');
const { validateSims } = require('./vendor/study-kit/tools/sims-validate.js');
const L = require('./lanes.js');

const errors = [];
const laneIds = [], sectionIds = [], seen = new Set();
const claim = (id, w) => { if (seen.has(id)) errors.push(w + ': duplicate id ' + id); seen.add(id); };
// Link ids use the dash form only (#lane-quality, #stage-tp-1-1): study-kit v0.2.0's craft.route rejects dots.
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
for (const ln of L.lanes) {
  if (!ID.test(ln.id)) errors.push('lane ' + ln.id + ': bad id');
  claim(ln.id, 'lane'); laneIds.push(ln.id);
  if (!ln.name || !ln.blurb || !ln.short || !ln.color) errors.push('lane ' + ln.id + ': name, short, blurb and color required');
  if (/\b(CDO|CRO|CPO|CCO)\b/.test(ln.name)) errors.push('lane ' + ln.id + ': colliding bare acronym in the name');
}
if (laneIds.join() !== 'quality,supply-chain,coo') errors.push('lanes are quality, supply-chain, coo in that order');
if (L.lanes.filter(l => l.active).map(l => l.id).join() !== 'quality') errors.push('Phase 0: only the quality lane is active');
for (const ln of L.lanes.filter(l => l.active)) if (!(L.sections[ln.id] || []).length) errors.push('active lane ' + ln.id + ': sections required');
for (const lane in L.sections) {
  if (laneIds.indexOf(lane) === -1) errors.push('sections for unknown lane ' + lane);
  for (const s of L.sections[lane]) {
    const id = lane + '-' + s.id;
    if (!ID.test(id)) errors.push('section ' + id + ': bad id');
    claim(id, 'section'); sectionIds.push(id);
    if (!s.title || !s.kind || !(s.phase >= 1)) errors.push('section ' + id + ': title, kind and phase required');
  }
}
// ASQ 2022 CSSGB scored-question counts (Read, ASQ BoK PDF): the six decks add up to the 100 scored questions.
{ const q = (L.sections.quality || []).filter(s => s.kind === 'Deck').map(s => s.questions);
  if (q.join() !== '11,20,20,18,16,15' || q.reduce((a, b) => a + b, 0) !== 100) errors.push('quality decks must carry the BoK counts 11,20,20,18,16,15 (got ' + q.join() + ')'); }

// Engines: no content yet (Phase 0). Craft packets will use ids TP-n, runs TPN-n, role-plays TPL-n.
const craft = loadCraft([], { dir: path.join(here, 'build', 'craft'), idPrefix: 'TP', takenIds: new Set() });
errors.push(...craft.errors);
const sims = validateSims({ runs: [], roleplays: [], runPrefix: 'TPN', rpPrefix: 'TPL', takenIds: new Set(craft.ids) });
errors.push(...sims.errors);

// Published link ids: the build refuses to drop any.
const PUB = path.join(here, 'published-ids.json');
const pub = JSON.parse(fs.readFileSync(PUB, 'utf8'));
const now = { lanes: laneIds, sections: sectionIds, craft: craft.ids, sims: sims.ids, lessons: [], questions: [], cards: [] };
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
const bank = { lanes: L.lanes, sections: L.sections, exam: L.exam, craft: craft.packets, runs: sims.runs, roleplays: sims.roleplays, kitVersion };
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const json = JSON.stringify(bank).replace(/<\//g, '<\\/').split(LS).join('\\u2028').split(PS).join('\\u2029');
const tpl = read('index.src.html');
for (const t of ['__BANK__', '__STUDY_KIT__', '__SHELL_CSS__', '__KIT_CSS__']) if (tpl.split(t).length !== 2) { console.error('template must contain one ' + t); process.exit(1); }
const kit = read('vendor/study-kit/study-kit.js').replace(/<\//g, '<\\/');
const out = tpl.replace('__SHELL_CSS__', () => read('vendor/study-kit/shell.css')).replace('__KIT_CSS__', () => read('vendor/study-kit/study-kit.css'))
  .replace('__STUDY_KIT__', () => kit).replace('__BANK__', () => json);
fs.mkdirSync(path.join(here, 'build'), { recursive: true });
fs.writeFileSync(path.join(here, 'build', 'index.html'), out);
console.log('study-kit', kitVersion, '· lanes', laneIds.length, '(active: ' + L.lanes.filter(l => l.active).map(l => l.id).join(', ') + ') · sections', sectionIds.length, '· craft', craft.packets.length, '· runs', sims.runs.length, '· role-plays', sims.roleplays.length, '· bytes', Buffer.byteLength(out));
