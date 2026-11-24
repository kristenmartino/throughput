const { play, anchor } = require('./beer.js');
const fs = require('fs');
const out = [];
const st = anchor(0.36, 0.26, 0.34, 17), bm = anchor(0, 1, 1, 28), bmf = anchor(0, 1, 1, 20);
const scen = [['all-sterman', [st, st, st, st]], ['all-bench', [bm, bm, bm, bmf]]];
// player sequences: seeded random orders in a seat, others Sterman
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const seqs = [];
for (let k = 0; k < 200; k++) { const seat = k % 4, seq = Array.from({ length: 36 }, () => Math.floor(rnd() * 31)); seqs.push({ seat, seq }); }
for (const s of scen) out.push({ name: s[0], r: play(s[1]) });
for (const q of seqs) { const p = [st, st, st, st]; p[q.seat] = { f: (i, t) => q.seq[t - 1] }; out.push({ name: 'seq', seat: q.seat, r: play(p) }); }
fs.writeFileSync('js-out.json', JSON.stringify({ seqs, out }));
