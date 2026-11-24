// Runs the Python twins and compares. Called by build.js before anything is built.
//   numbers: every value within 1e-7 (relative), and every placeholder the content uses prints the same text from both.
//   beer: 2 reference games, 4 benchmark-in-seat games and 200 seeded random games; every weekly value equal.
//   Also: the grid search reproduces Sterman's benchmark (team $204.00 at S' 28, factory 20).
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const NJ = require('./numbers.js'), BG = require('./beer.js');

function py(file, input) { return JSON.parse(execFileSync('python3', ['-I', path.join(__dirname, file)], { input: input || '', maxBuffer: 1 << 28 }).toString()); }

function check(usedFormats) {
  const errs = []; let n = 0;
  // ---- numbers
  const J0 = NJ.flat(NJ.compute()), J = {}, P = py('numbers.py');
  for (const k in J0) if (typeof J0[k] === 'number') J[k] = J0[k];
  for (const k of new Set(Object.keys(J).concat(Object.keys(P)))) {
    n++;
    if (!(k in J) || !(k in P)) { errs.push('number ' + k + ' only in ' + (k in J ? 'JS' : 'Python')); continue; }
    if (Math.abs(J[k] - P[k]) > 1e-7 * Math.max(1, Math.abs(P[k]))) errs.push('number ' + k + ': JS ' + J[k] + ' vs Python ' + P[k]);
  }
  for (const [k, f] of (usedFormats || []).filter(u => u[0] in J)) { n++; if (NJ.fmt(J[k], f) !== NJ.fmt(P[k], f)) errs.push('number ' + k + '|' + f + ' prints ' + NJ.fmt(J[k], f) + ' in JS and ' + NJ.fmt(P[k], f) + ' in Python'); }
  // ---- beer
  let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const games = []; for (let k = 0; k < 200; k++) games.push({ seat: k % 4, orders: Array.from({ length: 32 - (k % 7 === 0 ? 5 : 0) }, () => Math.floor(rnd() * 31)) });
  const R = py('beer.py', JSON.stringify({ games }));
  const js = { all_average: BG.all(BG.AVERAGE), all_bench: BG.all(BG.BENCH), bench_in_seat: [0, 1, 2, 3].map(BG.benchInSeat), games: games.map(g => BG.game(g.seat, g.orders)) };
  const cmp = (a, b, w) => {
    for (const k of ['inv', 'back', 'incoming', 'recv', 'order', 'onorder']) for (let i = 0; i < 4; i++) { n += a.hist[k][i].length; if (JSON.stringify(a.hist[k][i]) !== JSON.stringify(b.hist[k][i])) errs.push('beer ' + w + ' ' + k + ' stage ' + i + ' differs'); }
    for (let i = 0; i < 4; i++) { n += a.hist.cost2[i].length; if (JSON.stringify(a.hist.cost2[i].map(c => (c / 2).toFixed(2))) !== JSON.stringify(b.hist.cost[i].map(c => Number(c).toFixed(2)))) errs.push('beer ' + w + ' cost stage ' + i + ' differs'); }
    if (a.waiting !== b.waiting) errs.push('beer ' + w + ' pause week differs');
    if (!a.waiting) { const s = BG.stats(a); n += 13;
      if ((s.team2 / 2).toFixed(2) !== Number(b.stats.team).toFixed(2)) errs.push('beer ' + w + ' team cost differs');
      s.stages.forEach((x, i) => { const y = b.stats.stages[i]; if ((x.cost2 / 2).toFixed(2) !== Number(y.cost).toFixed(2) || x.peak !== y.peak || x.peakWeek !== y.peakWeek || Math.abs(x.varRatio - y.varRatio) > 1e-9) errs.push('beer ' + w + ' stats stage ' + i + ' differ'); }); }
  };
  cmp(js.all_average, R.all_average, 'all average'); cmp(js.all_bench, R.all_bench, 'all benchmark');
  js.bench_in_seat.forEach((g, i) => cmp(g, R.bench_in_seat[i], 'benchmark in seat ' + i));
  js.games.forEach((g, i) => cmp(g, R.games[i], 'game ' + i));
  const b = BG.stats(js.all_bench);
  if (R.grid.team !== '204.00' || R.grid.sp !== 28 || R.grid.spFactory !== 20 || b.team2 !== 408 || b.stages.map(s => s.cost2 / 2).join() !== '46,50,54,54') errs.push('beer: benchmark does not reproduce Sterman ($204; 46/50/54/54; S′ 28/20): ' + JSON.stringify(R.grid));
  return { errs, n, beer: js };
}
module.exports = { check };
if (require.main === module) { const r = check(); console.log(r.errs.length ? r.errs.join('\n') : 'ok, ' + r.n + ' values'); }
