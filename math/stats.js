// Distributions for Phase 2 (t, F, chi-square), written from the textbook formulas: Lanczos log-gamma, the regularized
// incomplete beta by Lentz's continued fraction, and the regularized lower gamma by series / continued fraction.
// Inverses by bisection. math/phase2.py gets the same values from scipy.stats, an independent implementation, and
// math/check.js fails the build on any difference.
'use strict';

const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lgamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1; let a = 0.99999999999980993; const t = x + 7.5;
  for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
function betacf(a, b, x) {
  const TINY = 1e-300; let c = 1, d = 1 - (a + b) * x / (a + 1); if (Math.abs(d) < TINY) d = TINY; d = 1 / d; let h = d;
  for (let m = 1; m <= 500; m++) {
    const m2 = 2 * m; let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY; c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY; d = 1 / d; h *= d * c;
    aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY; c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY; d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return h;
}
// Regularized incomplete beta I_x(a, b).
function ibeta(x, a, b) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}
// Regularized lower incomplete gamma P(a, x).
function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) { let sum = 1 / a, del = sum, ap = a; for (let n = 0; n < 1000; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-16) break; } return sum * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
  const TINY = 1e-300; let b = x + 1 - a, c = 1 / TINY, d = 1 / b, h = d;
  for (let i = 1; i <= 1000; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < TINY) d = TINY; c = b + an / c; if (Math.abs(c) < TINY) c = TINY; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-16) break; }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
const tcdf = (t, df) => { const p = 0.5 * ibeta(df / (df + t * t), df / 2, 0.5); return t >= 0 ? 1 - p : p; };
const fcdf = (f, d1, d2) => f <= 0 ? 0 : ibeta(d1 * f / (d1 * f + d2), d1 / 2, d2 / 2);
const chi2cdf = (x, k) => gammaP(k / 2, x / 2);
function invert(cdf, p, lo, hi) { for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (cdf(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
const tinv = (p, df) => invert(t => tcdf(t, df), p, -100, 100);
const finv = (p, d1, d2) => invert(f => fcdf(f, d1, d2), p, 0, 1000);
const chi2inv = (p, k) => invert(x => chi2cdf(x, k), p, 0, 1000);
module.exports = { lgamma, ibeta, gammaP, tcdf, fcdf, chi2cdf, tinv, finv, chi2inv };
