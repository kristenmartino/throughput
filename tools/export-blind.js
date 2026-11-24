// Writes the blind-check packet: every keyed question without its key or explanations, and every lesson paragraph
// that states a number (for the checker to recompute). Reads build/bank.json.
// Usage: node tools/export-blind.js <dir> [deck,deck...]   (no deck list: every deck)
'use strict';
const fs = require('fs'), path = require('path');
const bank = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'build', 'bank.json'), 'utf8'));
const out = process.argv[2] || '.', only = process.argv[3] ? process.argv[3].split(',') : null;
const qs = [], paras = [];
for (const d of bank.decks.filter(x => !only || only.includes(x.id))) {
  for (const q of d.questions) qs.push(q.id + ' [' + q.bok + ']\n' + q.stem + '\n' + q.options.map((o, j) => '  ' + 'ABCD'[j] + '. ' + o).join('\n'));
  for (const l of d.lessons) l.body.forEach((p, i) => { if (/\d/.test(p.replace(/\([^()]*\)\s*$/, '').replace(/[IVX]+\.[A-F](\.\d)?/g, ''))) paras.push(l.id + ' ¶' + (i + 1) + ': ' + p); });
}
fs.writeFileSync(path.join(out, 'questions.txt'), qs.join('\n\n') + '\n');
fs.writeFileSync(path.join(out, 'lesson-numbers.txt'), paras.join('\n\n') + '\n');
fs.writeFileSync(path.join(out, 'key.json'), JSON.stringify(Object.fromEntries([].concat(...bank.decks.filter(x => !only || only.includes(x.id)).map(d => d.questions.map(q => [q.id, 'ABCD'[q.answer]]))))));
console.log(qs.length + ' questions, ' + paras.length + ' numeric paragraphs');
