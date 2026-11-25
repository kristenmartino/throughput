// Runs the Python twins and compares. Called by build.js before anything is built.
//   numbers: every value within 1e-7 (relative), and every placeholder the content uses prints the same text from both.
//   beer: 2 reference games, 4 benchmark-in-seat games and 200 seeded random games; every weekly value equal.
//   Also: the grid search reproduces Sterman's benchmark (team $204.00 at S' 28, factory 20).
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const NJ = require('./numbers.js'), BG = require('./beer.js'), IE = require('./inventory.js'), BN = require('./bottleneck.js'), DM = require('./dmaic.js');
const INV = require('../data/inventory.json');

function py(file, input, args) { return JSON.parse(execFileSync('python3', ['-I', path.join(__dirname, file)].concat(args || []), { input: input || '', maxBuffer: 1 << 28, timeout: 3600000 }).toString()); }

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
  // ---- control chart constants against NIST's table (Read, e-Handbook 6.3.2.1, Nov 24): A2, D3, D4 printed to 3 decimals.
  //      Allowed difference 0.0011: NIST prints D4 = 2.115 at n = 5, where 1 + 3 d3/d2 = 2.1145. c4(10) = 0.9727 (NIST 6.3.2).
  const NIST = { 2: [1.880, 0, 3.267], 3: [1.023, 0, 2.575], 4: [0.729, 0, 2.282], 5: [0.577, 0, 2.115], 6: [0.483, 0, 2.004], 7: [0.419, 0.076, 1.924], 8: [0.373, 0.136, 1.864], 9: [0.337, 0.184, 1.816], 10: [0.308, 0.223, 1.777] };
  for (const nn in NIST) ['A2', 'D3', 'D4'].forEach((c, i) => { n++; if (Math.abs(J['k.' + c + 'n' + nn] - NIST[nn][i]) > 0.0011) errs.push('constant ' + c + ' n=' + nn + ': computed ' + J['k.' + c + 'n' + nn] + ', NIST ' + NIST[nn][i]); });
  n++; if (Math.abs(J['k.c4n10'] - 0.9727) > 0.00005) errs.push('c4(10) computed ' + J['k.c4n10'] + ', NIST 0.9727');
  n++; if (Math.abs(J['k.d2n2'] - 1.128) > 0.0005) errs.push('d2(2) computed ' + J['k.d2n2'] + ', NIST 1.128');
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
  // ---- inventory sim: textbook and no-change policies, the hindsight grid search, and 300 seeded random games
  //      (some paused at a review); every weekly value, total and fill rate equal.
  const ig = [IE.textbook(INV), [0, 0, 0, 0].map(() => IE.textbook(INV)[0])];
  for (let k = 0; k < 300; k++) { const ph = 1 + (k % 4 === 0 ? k % 3 : 3); ig.push(Array.from({ length: ph }, () => ({ q: Math.floor(rnd() * 900), rop: Math.floor(rnd() * 1000) }))); }
  const IP = py('inventory.py', JSON.stringify({ data: INV, games: ig }));
  ig.forEach((g, i) => { const a = IE.play(INV, g), b2 = IP.games[i];
    for (const k in a.h) { n += a.h[k].length; if (JSON.stringify(a.h[k]) !== JSON.stringify(b2.h[k])) errs.push('inventory game ' + i + ' ' + k + ' differs'); }
    if (a.waiting !== b2.waiting || a.week !== b2.week) errs.push('inventory game ' + i + ' pause differs');
    if (a.waiting < 0) { const s = IE.stats(a, INV), t = b2.stats; n += 6;
      for (const k of ['hold', 'order', 'lost', 'total', 'orders', 'lostUnits']) if (s[k] !== t[k]) errs.push('inventory game ' + i + ' ' + k + ': JS ' + s[k] + ' vs Python ' + t[k]);
      if (Math.abs(s.fill - t.fill) > 1e-12) errs.push('inventory game ' + i + ' fill rate differs'); } });
  n += 2; if (JSON.stringify(IE.textbook(INV)) !== JSON.stringify(IP.textbook)) errs.push('inventory textbook policy differs');
  const hs = IE.hindsight(INV); if (JSON.stringify(hs) !== JSON.stringify(IP.hindsight)) errs.push('inventory hindsight best differs: ' + JSON.stringify(hs) + ' vs ' + JSON.stringify(IP.hindsight));
  // ---- bottleneck line: 400 seeded random plans (some paused, some over budget) plus named ones, and the exhaustive search
  const bp = [{ release: 'push', buys: Array(12).fill(-1) }, { release: 'rope', buys: Array(12).fill(-1) }];
  // Random plans use all four purchase kinds (codes 0-18) and sometimes break the budget or the three-purchase limit.
  for (let k = 0; k < 400; k++) { const len = k % 5 === 0 ? k % 12 : 12; bp.push({ release: k % 2 ? 'rope' : 'push', buys: Array.from({ length: len }, () => rnd() < 0.75 ? -1 : Math.floor(rnd() * 19)) }); }
  // The exhaustive search (about 3 million plays) is slow in Python, so its agreed result is cached in
  // data/bottleneck-best.json under a hash of both engine files; it is rerun in both languages when either file changes.
  const crypto = require('crypto'), fs = require('fs'), path = require('path'), cacheF = path.join(__dirname, '..', 'data', 'bottleneck-best.json');
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'bottleneck.js'))).update(fs.readFileSync(path.join(__dirname, 'bottleneck.py'))).digest('hex');
  let cache = null; try { cache = JSON.parse(fs.readFileSync(cacheF, 'utf8')); } catch (e) { cache = null; }
  const fresh = !(cache && cache.hash === hash);
  const BP = py('bottleneck.py', JSON.stringify({ plans: bp }), fresh ? ['--best'] : []);
  bp.forEach((p, i) => { const a = BN.play(p), b2 = BP.plans[i];
    for (const k in a.h) { n += a.h[k].length; if (JSON.stringify(a.h[k]) !== JSON.stringify(b2.h[k])) errs.push('bottleneck plan ' + i + ' ' + k + ' differs'); }
    if (a.waiting !== b2.waiting || a.spent !== b2.spent) errs.push('bottleneck plan ' + i + ' pause or spend differs');
    if (a.waiting < 0) { const s = BN.stats(a), t = b2.stats; n += 6;
      for (const k of ['profit', 'out', 'spent', 'endWip']) if (s[k] !== t[k]) errs.push('bottleneck plan ' + i + ' ' + k + ': JS ' + s[k] + ' vs Python ' + t[k]);
      for (const k of ['avgWip', 'lead']) if (Math.abs(s[k] - t[k]) > 1e-12) errs.push('bottleneck plan ' + i + ' ' + k + ' differs'); } });
  let bb;
  if (fresh) { bb = BN.best(); n++; if (JSON.stringify(bb) !== JSON.stringify(BP.best)) errs.push('bottleneck best plan differs: ' + JSON.stringify(bb) + ' vs ' + JSON.stringify(BP.best));
    else fs.writeFileSync(cacheF, JSON.stringify({ hash, best: bb, note: 'Exhaustive search, JS and Python agreed' }, null, 1) + '\n'); }
  else { bb = cache.best; n++; const s = BN.stats(BN.play(bb)); if (s.profit !== bb.profit) errs.push('cached bottleneck best plan no longer replays to its profit'); }
  // ---- DMAIC on a P&L (TPN-1): 400 seeded random plans (some cut short, many breaking a rule) plus named ones, at 8 and
  // 6 months, and the best-plan search for both lengths. The Python search takes about 16 s, so the agreed result is
  // cached in data/dmaic-best.json under a hash of both engine files and rerun in both languages when either changes.
  const dp = [{ moves: Array(8).fill([]) }, { moves: Array(6).fill([]), months: 6 }];
  for (let k = 0; k < 400; k++) {
    const M = k % 3 ? 8 : 6, len = k % 7 === 0 ? k % M : M;
    // Most plans pick random legal moves within the budget; one in ten picks any codes, to test the rule checks.
    const done = {}, moves = []; let money = DM.RULES.budget;
    for (let t = 0; t < len; t++) {
      const set = [], c = Math.floor(rnd() * 3);
      for (let j = 0; j < c; j++) {
        const cand = k % 10 === 0 ? [Math.floor(rnd() * DM.MOVES)] : Array.from({ length: DM.MOVES }, (_, m) => m).filter(m => set.indexOf(m) === -1 && (set.length === 0 || m > set[set.length - 1]) && DM.legal(m, t, done) && DM.moveCost(m) <= money);
        if (!cand.length) break;
        const m = cand[Math.floor(rnd() * cand.length)]; set.push(m); done[m] = t; money -= DM.moveCost(m);
      }
      moves.push(set);
    }
    dp.push({ months: M, moves });
  }
  const dhash = crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'dmaic.js'))).update(fs.readFileSync(path.join(__dirname, 'dmaic.py'))).digest('hex');
  const dcacheF = path.join(__dirname, '..', 'data', 'dmaic-best.json');
  let dcache = null; try { dcache = JSON.parse(fs.readFileSync(dcacheF, 'utf8')); } catch (e) { dcache = null; }
  const dfresh = !(dcache && dcache.hash === dhash);
  const DP = py('dmaic.py', JSON.stringify({ plans: dp }), dfresh ? ['--best'] : []);
  let dmOk = 0;
  dp.forEach((p, i) => { const o = { months: p.months || DM.RULES.months }, a = DM.play(p, o), b2 = DP.plans[i];
    for (const k in a.h) { n += a.h[k].length; if (JSON.stringify(a.h[k]) !== JSON.stringify(b2.h[k])) errs.push('dmaic plan ' + i + ' ' + k + ' differs'); }
    if (a.waiting !== b2.waiting || a.spent !== b2.spent) errs.push('dmaic plan ' + i + ' pause or spend differs');
    if (a.waiting < 0) { dmOk++; const s = DM.stats(a), t = b2.stats; n += 5;
      for (const k of ['contrib', 'counted', 'score', 'spent', 'disrupted']) if (s[k] !== t[k]) errs.push('dmaic plan ' + i + ' ' + k + ': JS ' + s[k] + ' vs Python ' + t[k]); } });
  if (dmOk < 50) errs.push('dmaic: only ' + dmOk + ' random plans ran to the end; the cross-check is too thin');
  let db;
  if (dfresh) { db = { 8: DM.best({ months: 8 }), 6: DM.best({ months: 6 }) }; n += 2;
    if (JSON.stringify(db) !== JSON.stringify(DP.best)) errs.push('dmaic best plans differ: ' + JSON.stringify(db) + ' vs ' + JSON.stringify(DP.best));
    else fs.writeFileSync(dcacheF, JSON.stringify({ hash: dhash, best: db, note: 'Memoized search over every legal plan, JS and Python agreed' }, null, 1) + '\n'); }
  else { db = dcache.best; n += 2; for (const m of ['8', '6']) { const s = DM.stats(DM.play({ moves: db[m].moves }, { months: +m })); if (s.score !== db[m].score) errs.push('cached dmaic best plan (' + m + ' months) no longer replays to its score'); } }
  return { errs, n, beer: js, inventory: { textbook: IE.textbook(INV), hindsight: hs }, bottleneck: { best: bb }, dmaic: { best: db, randomFinished: dmOk } };
}
module.exports = { check };
if (require.main === module) { const r = check(); console.log(r.errs.length ? r.errs.join('\n') : 'ok, ' + r.n + ' values'); }
