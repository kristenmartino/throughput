// Every number in the Define and Measure decks. Text gets numbers only through {{placeholders}}:
//   {{df8.dpu|2}} 2 decimals · {{df8.dpmo|0}} grouped integer · {{df8.rty|%1}} percent, 1 decimal · {{df8.copq|$}} dollars
// math/numbers.py computes the same values independently (Python's math.erf and statistics.NormalDist), and
// math/check.js fails the build on any difference.
'use strict';

// Standard normal CDF via erf (series below 3, continued fraction above), and Acklam's inverse.
function erf(x) {
  const s = x < 0 ? -1 : 1; x = Math.abs(x);
  if (x < 3) { let term = x, sum = x; for (let n = 1; n < 200; n++) { term *= -x * x / n; const t = term / (2 * n + 1); sum += t; if (Math.abs(t) < 1e-17) break; } return s * 2 / Math.sqrt(Math.PI) * sum; }
  let f = 0; for (let n = 60; n >= 1; n--) f = n / 2 / (x + f);   // erfc continued fraction
  return s * (1 - Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f));
}
const phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
function invPhi(p) {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const lo = 0.02425, hi = 1 - lo;
  let q, r;
  if (p < lo) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > hi) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
const fact = n => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
const comb = (n, k) => fact(n) / (fact(k) * fact(n - k));
const perm = (n, k) => fact(n) / fact(n - k);
const sum = a => a.reduce((x, y) => x + y, 0);

function compute() {
  const N = {};
  // df-4 QFD: three customer needs (weights 1-5) against three design characteristics, relationships 9/3/1/0.
  { const needs = [['Fits airline carry-on sizers', 5], ['Rolls easily over curbs', 3], ['Survives baggage drops', 4]];
    const chars = ['Outside length', 'Empty weight', 'Wheel diameter'];
    const rel = [[9, 3, 1], [0, 3, 9], [0, 1, 3]];
    const score = chars.map((c, j) => sum(needs.map((nd, i) => nd[1] * rel[i][j])));
    N.df4 = { needs, chars, rel, length: score[0], weight: score[1], wheel: score[2], unweighted0: sum(rel.map(r => r[0])), unweighted2: sum(rel.map(r => r[2])) }; }
  // df-6 CPM and PERT on a six-activity network; FMEA RPN.
  { const act = { A: [3, []], B: [4, ['A']], C: [2, ['A']], D: [5, ['B']], E: [3, ['C']], F: [2, ['D', 'E']] };
    const es = {}, ef = {}; for (const k of 'ABCDEF') { es[k] = Math.max(0, ...act[k][1].map(p => ef[p])); ef[k] = es[k] + act[k][0]; }
    const dur = ef.F, lf = {}, ls = {};
    for (const k of 'FEDCBA') { const succ = 'ABCDEF'.split('').filter(s => act[s][1].indexOf(k) !== -1); lf[k] = succ.length ? Math.min(...succ.map(s => ls[s])) : dur; ls[k] = lf[k] - act[k][0]; }
    const a = 3, m = 5, b = 9;
    N.df6 = { dur, slackC: ls.C - es.C, slackE: ls.E - es.E, slackB: ls.B - es.B, pathShort: 3 + 2 + 3 + 2, pertTe: (a + 4 * m + b) / 6, pertSd: (b - a) / 6, pertMean3: (a + m + b) / 3,
      rpn1: 8 * 4 * 6, rpn2: 10 * 2 * 3, rpn3: 5 * 7 * 7 }; }
  // df-8 business results: 1,000 units, three steps, six defect opportunities a unit.
  { const units = 1000, opp = 6, defects = 180, fpy = [0.95, 0.97, 0.92];
    const rty = fpy.reduce((x, y) => x * y, 1), dpo = defects / (units * opp), dpmo = dpo * 1e6;
    const copq = 42000 + 18000 + 35000, coq = copq + 25000 + 10000;
    N.df8 = { units, opp, defects, dpu: defects / units, rty, rtyApprox: Math.exp(-defects / units), fpyMean: sum(fpy) / 3, dpmo, sigmaLt: invPhi(1 - dpo), sigma: invPhi(1 - dpo) + 1.5,
      dpmoWrong: defects / units * 1e6, copq, coq }; }
  // ms-2 probability.
  N.ms2 = { none5: Math.pow(0.98, 5), atLeast1: 1 - Math.pow(0.98, 5), excl: 0.03 + 0.05, notExcl: 0.03 + 0.05 - 0.01, perm83: perm(8, 3), comb83: comb(8, 3), both2of10: 2 / 10 * 1 / 9, both2of10wr: 0.2 * 0.2 };
  // ms-3 central limit theorem.
  N.ms3 = { se: 12 / Math.sqrt(36), seWrong: 12 / 36, n4x: 36 * 4, se100: 12 / Math.sqrt(144) };
  // ms-4 distributions.
  { const binom = (n, p, k) => comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k), pois = (l, k) => Math.exp(-l) * Math.pow(l, k) / fact(k);
    N.ms4 = { b0: binom(10, 0.1, 0), b1: binom(10, 0.1, 1), bLe1: binom(10, 0.1, 0) + binom(10, 0.1, 1), p0: pois(2, 0), p3: pois(2, 3), pLe1: pois(2, 0) + pois(2, 1),
      z: (53 - 50) / 2, tail: 1 - phi((53 - 50) / 2), between: phi(1) - phi(-1) }; }
  // ms-6 descriptive statistics on 15 cycle times (minutes).
  { const x = [12, 15, 11, 14, 13, 18, 12, 16, 13, 12, 30, 14, 13, 15, 12];
    const s = x.slice().sort((p, q) => p - q), n = x.length, mean = sum(x) / n;
    const counts = {}; x.forEach(v => { counts[v] = (counts[v] || 0) + 1; }); const mode = +Object.keys(counts).sort((p, q) => counts[q] - counts[p] || p - q)[0];
    const sd = Math.sqrt(sum(x.map(v => (v - mean) * (v - mean))) / (n - 1)), sdPop = Math.sqrt(sum(x.map(v => (v - mean) * (v - mean))) / n);
    const y = x.filter(v => v !== 30), meanNo = sum(y) / y.length;
    N.ms6 = { data: x.join(', '), n, mean, median: s[(n - 1) / 2], mode, range: s[n - 1] - s[0], sd, sdPop, meanNo, modeCount: counts[mode] }; }
  // ms-7 gauge R&R (standard deviations in mm).
  { const rep = 0.12, repro = 0.16, part = 1.0, tol = 8.0, grr = Math.sqrt(rep * rep + repro * repro), tot = Math.sqrt(grr * grr + part * part);
    N.ms7 = { rep, repro, part, tol, grr, tot, pctGrr: grr / tot * 100, pctAdd: (rep + repro) / tot * 100, pctVar: grr * grr / (tot * tot) * 100, pt: 6 * grr / tol * 100, pt515: 5.15 * grr / tol * 100,
      biasRef: 25.000, biasMean: 25.012, bias: 25.012 - 25.000 }; }
  // ms-9 capability: spec 9.5 to 10.5 mm, target 10.0, mean 10.1, within 0.12, overall 0.15.
  { const usl = 10.5, lsl = 9.5, t = 10.0, mu = 10.1, sw = 0.12, so = 0.15;
    const cp = (usl - lsl) / (6 * sw), cpk = Math.min((usl - mu) / (3 * sw), (mu - lsl) / (3 * sw)), pp = (usl - lsl) / (6 * so), ppk = Math.min((usl - mu) / (3 * so), (mu - lsl) / (3 * so));
    const cpm = (usl - lsl) / (6 * Math.sqrt(sw * sw + (mu - t) * (mu - t)));
    const zU = (usl - mu) / so, zL = (mu - lsl) / so, ppmU = (1 - phi(zU)) * 1e6, ppmL = (1 - phi(zL)) * 1e6;
    N.ms9 = { usl, lsl, t, mu, sw, so, cp, cpk, pp, ppk, cpm, cpkWrongSide: (mu - lsl) / (3 * sw), zUw: (usl - mu) / sw, zU, zL, ppmU, ppmL, ppm: ppmU + ppmL, zSt: zU + 1.5, sigma3cpk: 3 * cpk,
      sixSigmaDpmo: (1 - phi(4.5)) * 1e6, cp133Ppm: 2 * (1 - phi(4)) * 1e6 }; }
  Object.assign(N, require('./phase2.js').compute2());
  N.mk = require('./mock.js').computeMock(N);   // held-out mock pool (Phase 2b)
  Object.assign(N, require('./supply.js').computeSupply());   // supply chain decks (Phase 3)
  return N;
}

function flat(o, pre, out) {
  out = out || {};
  for (const k in o) { const v = o[k], key = pre ? pre + '.' + k : k; if (typeof v === 'number' || typeof v === 'string') out[key] = v; else if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out); }
  return out;
}
const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
function fmt(v, f) {
  if (typeof v === 'string') return v;
  if (f === '$') return '$' + group(Math.round(v).toString());
  const pct = /^%(\d)$/.exec(f || ''); if (pct) return (v * 100).toFixed(+pct[1]) + '%';
  const d = /^(\d)$/.exec(f || ''); if (!d) throw new Error('bad format ' + f);
  const s = v.toFixed(+d[1]), parts = s.split('.'); return group(parts[0]) + (parts[1] ? '.' + parts[1] : '');
}
// Replaces {{key|format}}. An unknown key or format is an error, so a typo never reaches the page.
function fill(text, FL) {
  return String(text).replace(/\{\{([a-z0-9.]+)(?:\|([^}]+))?\}\}/gi, (m, k, f) => { if (!(k in FL)) throw new Error('unknown number ' + m); return fmt(FL[k], f || '0'); });
}
module.exports = { compute, flat, fill, fmt, phi, invPhi, erf };
