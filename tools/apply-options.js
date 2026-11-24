// Replaces the options of listed questions in content/*.js, keeping each question's key position.
// Usage: node tools/apply-options.js <patch.json>   ({ "ID": { "options": [4 strings] } })
'use strict';
const fs = require('fs'), path = require('path');
const patch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const files = fs.readdirSync(path.join(__dirname, '..', 'content')).filter(f => f.endsWith('.js')).map(f => path.join(__dirname, '..', 'content', f));
const q = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
let n = 0;
for (const id of Object.keys(patch)) {
  const f = files.find(x => fs.readFileSync(x, 'utf8').includes("{ id: '" + id + "'"));
  if (!f) throw new Error('no question ' + id);
  let s = fs.readFileSync(f, 'utf8');
  const at = s.indexOf("{ id: '" + id + "'"), a = s.indexOf('options: [', at), b = s.indexOf('], answer:', a);
  if (a < 0 || b < 0 || s.indexOf("{ id: '", at + 5) < b && s.indexOf("{ id: '", at + 5) > 0) throw new Error('cannot locate options of ' + id);
  if (patch[id].options.length !== 4) throw new Error(id + ': four options');
  s = s.slice(0, a) + 'options: [' + patch[id].options.map(q).join(', ') + s.slice(b);
  fs.writeFileSync(f, s); n++;
}
console.log('replaced options of', n, 'questions');
