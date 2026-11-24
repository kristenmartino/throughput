// Lists questions whose keyed option is the strictly longest, with the ratio to the longest distractor.
// Usage: node tools/longest.js <deck file under content/>
const NUM = require('../math/numbers.js'), FL = NUM.flat(NUM.compute()), src = require('../content/' + process.argv[2]);
for (const q of src.questions) { const O = q.options.map(o => NUM.fill(o, FL)), L = O.map(o => o.length), k = L[q.answer];
  if (L.every((x, j) => j === q.answer || x < k)) console.log(q.id, 'ABCD'[q.answer], (k / Math.max(...L.filter((x, j) => j !== q.answer))).toFixed(2), '|', O.map((o, j) => (j === q.answer ? '*' : '') + o).join(' | ')); }
console.log('keys', [0, 1, 2, 3].map(j => src.questions.filter(q => q.answer === j).length).join('/'));
