// Every number in the Phase 2 decks (Overview, Analyze, Improve, Control). Merged into math/numbers.js compute().
// math/phase2.py computes the same keys independently (numpy, scipy.stats, scipy.integrate) and math/check.js
// compares them. Data sets are invented for teaching; none comes from a practice exam.
'use strict';
const S = require('./stats.js');
const sum = a => a.reduce((x, y) => x + y, 0);
const mean = a => sum(a) / a.length;
const ss = a => { const m = mean(a); return sum(a.map(v => (v - m) * (v - m))); };
const sd = a => Math.sqrt(ss(a) / (a.length - 1));
const range = a => Math.max(...a) - Math.min(...a);

// Control chart constants from first principles: d2 = E[range of n standard normals], d3 = its standard deviation.
// Integrals by the trapezoid rule on [-9, 9]; c4 from the gamma function.
function rangeMoments(n) {
  const phi = require('./numbers.js').phi, h = 0.01, xs = []; for (let x = -9; x <= 9 + 1e-9; x += h) xs.push(x);
  const F = xs.map(phi);
  let d2 = 0; for (let i = 0; i < xs.length; i++) { const w = (i === 0 || i === xs.length - 1) ? 0.5 : 1; d2 += w * (1 - Math.pow(F[i], n) - Math.pow(1 - F[i], n)); } d2 *= h;
  // E[R^2] = ∫_0^∞ 2r P(R > r) dr, with P(R > r) = 1 - n ∫ φ(x) (F(x + r) - F(x))^(n-1) dx (step 0.01)
  const dens = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  let e2 = 0;
  for (let ri = 1; ri * h <= 12 + 1e-9; ri++) { const r = ri * h; let inner = 0;
    for (let i = 0; i < xs.length; i++) inner += dens(xs[i]) * Math.pow((i + ri < xs.length ? F[i + ri] : 1) - F[i], n - 1);   // F = 1 beyond the grid
    inner *= h; e2 += 2 * r * (1 - n * inner); }
  e2 = e2 * h + h * h / 6;   // trapezoid end correction (Euler–Maclaurin): g(r) = 2r P(R > r) has g'(0) = 2
  return { d2, d3: Math.sqrt(Math.max(0, e2 - d2 * d2)) };
}
const c4 = n => Math.sqrt(2 / (n - 1)) * Math.exp(S.lgamma(n / 2) - S.lgamma((n - 1) / 2));

function compute2() {
  const N = {};
  // ---------------- I. Overview
  // ov-3 takt time: two shifts of 8 h with 30 min of breaks each; customer demand 360 units a day; work content 12 min a unit.
  { const avail = 2 * (8 * 60 - 30), demand = 360, takt = avail / demand, work = 12, cycle = 3;
    N.ov3 = { avail, demand, takt, taktSec: takt * 60, work, ops: work / takt, opsUp: Math.ceil(work / takt), cycle, short: (cycle - takt) * demand, maxOut: avail / cycle, taktWrong: demand / avail }; }
  // ov-4 process cycle efficiency: 6 steps with 38 minutes of value-added time; lead time 3 working days of 8 h.
  { const va = [4, 12, 6, 9, 5, 2], vaT = sum(va), lead = 3 * 8 * 60, pce = vaT / lead;
    N.ov4 = { vaT, lead, pce, nva: lead - vaT, leadHalf: lead / 2, pceHalf: vaT / (lead / 2) }; }
  // ov-6 FMEA: three failure modes.
  { const m = [[9, 2, 3], [5, 6, 5], [7, 4, 4]], r = m.map(x => x[0] * x[1] * x[2]);
    N.ov6 = { rpnA: r[0], rpnB: r[1], rpnC: r[2], rpnBafter: 5 * 2 * 5, rpnMax: 1000, rpnAdetect: 9 * 2 * 8, sumB: 5 + 6 + 5 }; }

  // ---------------- IV. Analyze
  // an-1 multi-vari: shaft diameter (mm) at three positions on three consecutive shafts, sampled at four hours.
  { const hours = ['08:00', '10:00', '12:00', '14:00'], base = [25.010, 25.030, 25.055, 25.080];
    const piece = [[0.000, 0.004, -0.003], [0.002, -0.002, 0.003], [-0.003, 0.001, 0.002], [0.003, 0.000, -0.002]];
    const pos = [0.002, 0.000, -0.002];
    const data = base.map((b, h) => piece[h].map((p, k) => pos.map((q, j) => +(b + p + q + ((h + k + j) % 2 ? 0.001 : -0.001)).toFixed(3))));
    const within = mean([].concat(...data.map(hr => hr.map(range))));
    const pieceMeans = data.map(hr => hr.map(mean)), p2p = mean(pieceMeans.map(range));
    const hourMeans = data.map(hr => mean([].concat(...hr))), t2t = range(hourMeans);
    N.an1 = { data: JSON.stringify(data), hours: JSON.stringify(hours), within, p2p, t2t, hourLo: hourMeans[0], hourHi: hourMeans[3], ratio: t2t / Math.max(within, p2p) }; }
  // an-2 / an-3 correlation and regression: cure temperature (°C) against bond strength (N), 8 runs.
  { const x = [150, 155, 160, 165, 170, 175, 180, 185], y = [41.2, 43.0, 44.1, 46.5, 46.9, 49.3, 50.2, 52.4];
    const n = x.length, mx = mean(x), my = mean(y), sxx = ss(x), syy = ss(y), sxy = sum(x.map((v, i) => (v - mx) * (y[i] - my)));
    const b1 = sxy / sxx, b0 = my - b1 * mx, r = sxy / Math.sqrt(sxx * syy), sse = sum(x.map((v, i) => Math.pow(y[i] - b0 - b1 * v, 2))), s = Math.sqrt(sse / (n - 2));
    const seb1 = s / Math.sqrt(sxx), t = b1 / seb1, p = 2 * (1 - S.tcdf(Math.abs(t), n - 2)), tc = S.tinv(0.975, n - 2);
    const x0 = 172, yhat = b0 + b1 * x0, seMean = s * Math.sqrt(1 / n + Math.pow(x0 - mx, 2) / sxx), sePred = s * Math.sqrt(1 + 1 / n + Math.pow(x0 - mx, 2) / sxx);
    N.an2 = { x: x.join(', '), y: y.join(', '), n, r, r2: r * r, rNeg: -r };
    N.an3 = { b0, b1, s, seb1, t, p, df: n - 2, tc, x0, yhat, ciLo: yhat - tc * seMean, ciHi: yhat + tc * seMean, piLo: yhat - tc * sePred, piHi: yhat + tc * sePred, r2: r * r,
      xFar: 240, yFar: b0 + b1 * 240, per10: b1 * 10 }; }
  // an-4 sample size for a mean: detect a shift of 2 with sigma 4, alpha 0.05 two-sided, power 0.90.
  { const z = require('./numbers.js').invPhi, za = z(0.975), zb = z(0.90), sg = 4, dl = 2, n = Math.pow((za + zb) * sg / dl, 2);
    const zb80 = z(0.80), n80 = Math.pow((za + zb80) * sg / dl, 2), nHalf = Math.pow((za + zb) * sg / (dl / 2), 2);
    // a big sample makes a tiny difference significant: n = 10,000, shift 0.1, sigma 4
    const zBig = 0.1 / (4 / Math.sqrt(10000)), pBig = 2 * (1 - require('./numbers.js').phi(zBig));
    N.an4 = { za, zb, n, nUp: Math.ceil(n), n80, n80Up: Math.ceil(n80), nHalf, nHalfUp: Math.ceil(nHalf), zBig, pBig }; }
  // an-5 t-tests.
  { const fills = [502.1, 499.4, 503.8, 501.2, 500.9, 504.0, 498.7, 502.6, 503.1, 501.5], mu0 = 500, n = fills.length;
    const m = mean(fills), s = sd(fills), t = (m - mu0) / (s / Math.sqrt(n)), p = 2 * (1 - S.tcdf(Math.abs(t), n - 1)), tc = S.tinv(0.975, n - 1);
    N.an5 = { fills: fills.join(', '), mean: m, s, t, p, df: n - 1, tc };
    const a = [12.4, 11.8, 13.1, 12.9, 12.2, 13.4, 12.7, 12.0], b = [11.6, 11.2, 12.3, 11.9, 12.4, 11.0, 11.7, 11.5];
    const ma = mean(a), mb = mean(b), va = sd(a) ** 2, vb = sd(b) ** 2, sp = Math.sqrt(((a.length - 1) * va + (b.length - 1) * vb) / (a.length + b.length - 2));
    const t2 = (ma - mb) / (sp * Math.sqrt(1 / a.length + 1 / b.length)), df2 = a.length + b.length - 2, p2 = 2 * (1 - S.tcdf(Math.abs(t2), df2)), tc2 = S.tinv(0.975, df2);
    N.an5.a = a.join(', '); N.an5.b = b.join(', '); Object.assign(N.an5, { ma, mb, sa: Math.sqrt(va), sb: Math.sqrt(vb), sp, t2, df2, p2, tc2 });
    const before = [14.2, 15.8, 13.1, 16.4, 12.9, 15.1, 14.6, 13.8], after = [13.5, 15.0, 12.9, 15.2, 12.1, 14.8, 13.7, 13.6];
    const d = before.map((v, i) => v - after[i]), md = mean(d), sdd = sd(d), tp = md / (sdd / Math.sqrt(d.length)), pp = 2 * (1 - S.tcdf(Math.abs(tp), d.length - 1)), tcp = S.tinv(0.975, d.length - 1);
    // the same data analysed (wrongly) as two independent samples
    const spW = Math.sqrt((sd(before) ** 2 + sd(after) ** 2) / 2), tW = (mean(before) - mean(after)) / (spW * Math.sqrt(2 / before.length)), pW = 2 * (1 - S.tcdf(Math.abs(tW), 2 * before.length - 2));
    Object.assign(N.an5, { before: before.join(', '), after: after.join(', '), dmean: md, dsd: sdd, tp, pp, dfp: d.length - 1, tcp, tW, pW }); }
  // an-6 F-test and one-way ANOVA.
  { const oldM = [10.02, 9.96, 10.05, 9.93, 10.08, 9.97, 10.04, 9.95, 10.06, 9.94], newM = [10.01, 9.99, 10.02, 9.98, 10.00, 10.03, 9.99, 10.01, 9.98, 10.02];
    const v1 = sd(oldM) ** 2, v2 = sd(newM) ** 2, F = v1 / v2, d1 = oldM.length - 1, d2 = newM.length - 1;
    const pF = 2 * Math.min(1 - S.fcdf(F, d1, d2), S.fcdf(F, d1, d2)), fcU = S.finv(0.975, d1, d2);
    N.an6 = { s1: Math.sqrt(v1), s2: Math.sqrt(v2), v1, v2, F, d1, d2, pF, fcU };
    const g = [[18.2, 17.6, 19.0, 18.4, 17.9], [19.4, 20.1, 19.8, 20.6, 19.6], [18.1, 18.8, 17.7, 18.5, 18.0]];
    const all = [].concat(...g), gm = mean(all), k = g.length, Nn = all.length;
    const sst = sum(g.map(x => x.length * Math.pow(mean(x) - gm, 2))), sse = sum(g.map(ss)), stot = ss(all);
    const mst = sst / (k - 1), mse = sse / (Nn - k), FA = mst / mse, pA = 1 - S.fcdf(FA, k - 1, Nn - k), fcA = S.finv(0.95, k - 1, Nn - k);
    Object.assign(N.an6, { gA: g[0].join(', '), gB: g[1].join(', '), gC: g[2].join(', '), mA: mean(g[0]), mB: mean(g[1]), mC: mean(g[2]), gm, sst, sse, stot, dft: k - 1, dfe: Nn - k, dftot: Nn - 1, mst, mse, FA, pA, fcA }); }
  // an-7 two proportions and chi-square.
  { const xa = 18, na = 400, xb = 34, nb = 400, pa = xa / na, pb = xb / nb, pp = (xa + xb) / (na + nb), se = Math.sqrt(pp * (1 - pp) * (1 / na + 1 / nb)), z = (pb - pa) / se;
    const pz = 2 * (1 - require('./numbers.js').phi(Math.abs(z)));
    N.an7 = { xa, na, xb, nb, pa, pb, pp, z, pz };
    const obs = [[22, 15, 13], [30, 14, 6], [18, 26, 16]];   // rows: shifts 1..3; columns: scratch, dent, misalignment
    const rt = obs.map(sum), ct = [0, 1, 2].map(j => sum(obs.map(r => r[j]))), n = sum(rt);
    const exp = obs.map((r, i) => r.map((v, j) => rt[i] * ct[j] / n)), chi = sum([].concat(...obs.map((r, i) => r.map((v, j) => Math.pow(v - exp[i][j], 2) / exp[i][j]))));
    const df = 4, pc = 1 - S.chi2cdf(chi, df), cc = S.chi2inv(0.95, df);
    Object.assign(N.an7, { obs: JSON.stringify(obs), n, e11: exp[0][0], e23: exp[1][2], e32: exp[2][1], r1: rt[0], c1: ct[0], chi, df, pc, cc, cell32: Math.pow(obs[2][1] - exp[2][1], 2) / exp[2][1] }); }
  // an-8 gap: on-time delivery 82% now, 95% target; 1,200 orders a month.
  N.an8 = { now: 0.82, target: 0.95, gap: 0.95 - 0.82, orders: 1200, lateNow: 1200 * (1 - 0.82), lateTarget: 1200 * (1 - 0.95), lateCut: 1200 * (0.95 - 0.82) };

  // ---------------- V. Improve
  // im-1 run counts.
  N.im1 = { full3: Math.pow(2, 3), full3x2: Math.pow(2, 3) * 2, full5: Math.pow(2, 5), half5: Math.pow(2, 5 - 1), three3: Math.pow(3, 3), full4: Math.pow(2, 4) };
  // im-2 a 2x2 design, two replicates: temperature (A) and pressure (B) on seal strength.
  { const y = { '--': [62, 64], '+-': [70, 72], '-+': [65, 67], '++': [85, 87] };
    const m = k => mean(y[k]), lo = (a, b) => (a + b) / 2;
    const A = lo(m('+-'), m('++')) - lo(m('--'), m('-+')), B = lo(m('-+'), m('++')) - lo(m('--'), m('+-'));
    const AB = lo(m('--'), m('++')) - lo(m('+-'), m('-+'));
    N.im2 = { mmm: m('--'), pm: m('+-'), mp: m('-+'), pp: m('++'), A, B, AB, aLo: lo(m('--'), m('-+')), aHi: lo(m('+-'), m('++')), bLo: lo(m('--'), m('+-')), bHi: lo(m('-+'), m('++')),
      aAtBlo: m('+-') - m('--'), aAtBhi: m('++') - m('-+'), grand: mean([m('--'), m('+-'), m('-+'), m('++')]), runs: 8, best: m('++') }; }
  // im-4 kanban cards: demand 180 an hour, replenishment lead time 2 h, safety factor 15%, 25 a container.
  { const D = 180, L = 2, a = 0.15, C = 25, k = D * L * (1 + a) / C; N.im4 = { D, L, a, C, k, kUp: Math.ceil(k), noSafety: D * L / C }; }
  // im-6 cycle-time reduction: batch versus one-piece flow, SMED.
  { const steps = 4, per = 1, batch = 50, batchLead = steps * per * batch, flowLead = per * batch + (steps - 1) * per, firstBatch = (steps - 1) * per * batch + per, firstFlow = steps * per;
    const setup = 80, internal = 50, external = 30, afterSep = internal, afterConv = internal - 20, afterStream = (internal - 20) * 0.6;
    N.im6 = { steps, per, batch, batchLead, flowLead, firstBatch, firstFlow, setup, internal, external, afterSep, afterConv, afterStream, cut: setup - afterStream, cutPct: (setup - afterStream) / setup }; }

  // ---------------- VI. Control
  // Constants: computed d2, d3, c4 for n = 2..10; A2, D3, D4, A3, B3, B4 from them. NIST tabulates A2, D3, D4 (Read).
  { const K = {};
    for (let n = 2; n <= 10; n++) { const r = rangeMoments(n), c = c4(n);
      K['d2n' + n] = r.d2; K['d3n' + n] = r.d3; K['A2n' + n] = 3 / (r.d2 * Math.sqrt(n)); K['D3n' + n] = Math.max(0, 1 - 3 * r.d3 / r.d2); K['D4n' + n] = 1 + 3 * r.d3 / r.d2;
      K['c4n' + n] = c; K['A3n' + n] = 3 / (c * Math.sqrt(n)); K['B3n' + n] = Math.max(0, 1 - 3 * Math.sqrt(1 - c * c) / c); K['B4n' + n] = 1 + 3 * Math.sqrt(1 - c * c) / c; }
    K.e2 = 3 / K.d2n2;   // individuals chart: 3 / 1.128
    N.k = K; }
  // co-3 X-bar and R (n = 5), X-bar and s (n = 5), I-MR.
  { const K = N.k, xbb = 50.20, rbar = 1.8, sbar = 0.77;
    N.co3 = { xbb, rbar, sbar, A2: K.A2n5, D4: K.D4n5, uclX: xbb + K.A2n5 * rbar, lclX: xbb - K.A2n5 * rbar, uclR: K.D4n5 * rbar, lclR: K.D3n5 * rbar, sigma: rbar / K.d2n5,
      uclXs: xbb + K.A3n5 * sbar, lclXs: xbb - K.A3n5 * sbar, uclS: K.B4n5 * sbar, lclS: K.B3n5 * sbar, A3: K.A3n5, B4: K.B4n5,
      uclXwrong: xbb + 3 * rbar, n7lcl: K.D3n7 * rbar };
    const ind = [24.1, 25.3, 23.8, 24.9, 25.6, 24.4, 23.9, 25.1, 24.7, 25.8, 24.2, 24.6], mr = ind.slice(1).map((v, i) => Math.abs(v - ind[i]));
    const xb = mean(ind), mrb = mean(mr);
    Object.assign(N.co3, { ind: ind.join(', '), xbI: xb, mrb, uclI: xb + K.e2 * mrb, lclI: xb - K.e2 * mrb, uclMR: K.D4n2 * mrb, e2: K.e2, d2n2: K.d2n2 }); }
  // co-1 a chart of 20 subgroup means against limits from co-3, with a run of eight above the center line.
  { const xs = [50.1, 49.8, 50.5, 50.0, 50.3, 49.7, 50.2, 49.9, 50.4, 50.6, 50.5, 50.8, 50.4, 50.7, 50.6, 50.9, 50.3, 50.0, 49.6, 50.2];
    let run = 0, best = 0, end = -1; xs.forEach((v, i) => { run = v > 50.20 ? run + 1 : 0; if (run > best) { best = run; end = i; } });
    N.co1 = { xs: JSON.stringify(xs), runLen: best, runFrom: end - best + 2, runTo: end + 1, beyond: xs.filter(v => v > N.co3.uclX || v < N.co3.lclX).length, max: Math.max(...xs) }; }
  // co-4 attribute charts.
  { const pbar = 0.045, n = 200, sp = Math.sqrt(pbar * (1 - pbar) / n), np = n * pbar, snp = Math.sqrt(n * pbar * (1 - pbar));
    const cbar = 6.2, ub = 1.6, un = 5;
    N.co4 = { pbar, n, uclP: pbar + 3 * sp, lclPraw: pbar - 3 * sp, lclP: Math.max(0, pbar - 3 * sp), np, uclNp: np + 3 * snp, lclNp: np - 3 * snp,
      cbar, uclC: cbar + 3 * Math.sqrt(cbar), lclCraw: cbar - 3 * Math.sqrt(cbar), ub, un, uclU: ub + 3 * Math.sqrt(ub / un), lclUraw: ub - 3 * Math.sqrt(ub / un),
      n100ucl: pbar + 3 * Math.sqrt(pbar * (1 - pbar) / 100), nistC: 16 + 3 * Math.sqrt(16), nistCl: 16 - 3 * Math.sqrt(16) }; }
  // wrong-answer values and small extras for the Analyze questions
  Object.assign(N.an3, { w1: N.an3.b1 * 172, w2: N.an3.b1 * 172 - N.an3.b0, ybar: mean(N.an2.y.split(', ').map(Number)) });
  Object.assign(N.an5, { w1: (N.an5.mean - 500) / N.an5.s, w2: (N.an5.mean - 500) / (N.an5.s / 10) });
  Object.assign(N.an6, { sRatio: N.an6.s1 / N.an6.s2, inv: 1 / N.an6.F, wDiff: N.an6.v1 - N.an6.v2, wSS: N.an6.sst / N.an6.sse, wMS: N.an6.mst / N.an6.sse });
  Object.assign(N.an7, { wRow: N.an7.r1 / 3, wCol: N.an7.c1 / 3 });
  Object.assign(N.im2, { Ahalf: N.im2.A / 2, ABx2: N.im2.AB * 2 }); N.im4.noSafetyUp = Math.ceil(N.im4.noSafety);
  Object.assign(N.ov3, { shortUnits: N.ov3.demand - N.ov3.maxOut, taktNoBreak: 2 * 8 * 60 / N.ov3.demand, taktOneShift: (8 * 60 - 30) / N.ov3.demand });
  Object.assign(N.ov4, { wRatio: N.ov4.vaT / N.ov4.nva, wNva: N.ov4.nva / N.ov4.lead, wCal: N.ov4.vaT / (72 * 60) });
  N.an8.gapPts = (0.95 - 0.82) * 100;
  N.an9 = { pa: 0.02, pb: 0.05, and: 0.02 * 0.05, or: 1 - (1 - 0.02) * (1 - 0.05), sum: 0.02 + 0.05 };
  // wrong-answer values for the Control questions
  { const c = N.co3, k = N.k, p = N.co4;
    Object.assign(c, { uclXA2n2: c.xbb + k.A2n2 * c.rbar, a2r: c.A2 * c.rbar, r3: 3 * c.rbar, uclIw1: c.xbI + 3 * c.mrb, uclIw2: c.xbI + k.D4n2 * c.mrb, uclIw3: c.xbI + c.mrb / k.d2n2 });
    Object.assign(p, { qbar: 1 - p.pbar, wNoN: p.pbar + 3 * Math.sqrt(p.pbar * (1 - p.pbar)), wPx3: p.pbar * 4, sqrtC: Math.sqrt(p.cbar), cW1: p.cbar * 4, cW2: p.cbar + Math.sqrt(p.cbar), cW3: p.cbar + 3 * Math.sqrt(p.cbar / 5) }); }
  return N;
}
module.exports = { compute2, rangeMoments, c4 };
