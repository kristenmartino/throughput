// Numbers for the held-out mock pool (Phase 2b, approved Nov 24). Merged into numbers.js compute() as N.mk.
// math/mock.py recomputes every value with independent tools (scipy.stats, math.comb, numpy) and math/check.js
// compares them. Data sets are invented for teaching; none comes from a practice exam or from the decks.
'use strict';
const S = require('./stats.js');
function computeMock(N) {
  const C = require('./numbers.js'), phi = C.phi, z = C.invPhi, A2n4 = N.k.A2n4;
  const comb = (n, r) => { let x = 1; for (let i = 1; i <= r; i++) x = x * (n - r + i) / i; return x; };
  const M = {};
  // I. Overview
  M.taktAvail = 8 * 60 - 40; M.taktDemand = 220; M.takt = M.taktAvail / M.taktDemand; M.taktWrongInv = M.taktDemand / M.taktAvail; M.taktNoBreak = 480 / 220;
  M.pceVa = 18; M.pceLead = 2 * 8 * 60; M.pce = M.pceVa / M.pceLead; M.pceWrongNva = M.pceVa / (M.pceLead - M.pceVa); M.pceNvaShare = 1 - M.pce;
  M.rpn = 7 * 3 * 6; M.rpnSum = 7 + 3 + 6; M.rpnAfter = 7 * 3 * 2;
  // II. Define
  M.dpUnits = 2500; M.dpOpp = 4; M.dpDef = 150; M.dpmo = M.dpDef / (M.dpUnits * M.dpOpp) * 1e6; M.dpmoNoOpp = M.dpDef / M.dpUnits * 1e6; M.dpu = M.dpDef / M.dpUnits;
  M.rty = 0.98 * 0.96 * 0.99 * 0.97; M.rtyAvg = (0.98 + 0.96 + 0.99 + 0.97) / 4; M.rtyMin = 0.96;
  M.pertE = (2 + 4 * 4 + 12) / 6; M.pertSd = (12 - 2) / 6; M.pertAvg = (2 + 4 + 12) / 3;
  // network: A 2, B 6 (after A), C 3 (after A), D 2 (after C), E 4 (after B and D)
  M.cpm1 = 2 + 6 + 4; M.cpm2 = 2 + 3 + 2 + 4; M.slackCD = M.cpm1 - M.cpm2;
  M.copq = 30000 + 12000 + 45000; M.coqTotal = M.copq + 20000 + 8000; M.copqWrongAppr = M.copq + 20000;
  // QFD column: weights 5, 3, 2; scores 9, 1, 3
  M.qfd = 5 * 9 + 3 * 1 + 2 * 3; M.qfdNoW = 9 + 1 + 3;
  // III. Measure
  M.atLeast1 = 1 - Math.pow(0.95, 4); M.allGood = Math.pow(0.95, 4); M.atLeastWrong = 4 * 0.05;
  M.comb = comb(10, 2); M.perm = 10 * 9;
  M.se = 9 / Math.sqrt(9); M.seN36 = 9 / Math.sqrt(36);
  M.bin0 = Math.pow(0.8, 5); M.binWrong = 0.2;
  M.poi0 = Math.exp(-1.5); M.poi1 = 1.5 * Math.exp(-1.5);
  M.nz = (56 - 50) / 3; M.nTail = 1 - phi(M.nz); M.nTailWrong = 1 - phi(6 / 4);
  { const d = [8, 9, 9, 10, 11, 12, 25], s = d.reduce((a, b) => a + b, 0); M.dMean = s / d.length; M.dMedian = 10; M.dMode = 9; M.dRange = 25 - 8; }
  M.grr = Math.sqrt(0.3 * 0.3 + 0.4 * 0.4); M.grrTot = Math.sqrt(M.grr * M.grr + 2 * 2); M.grrPct = M.grr / M.grrTot; M.grrPctAdd = (0.3 + 0.4) / M.grrTot;
  M.cp = (20.6 - 19.4) / (6 * 0.1); M.cpk = Math.min((20.6 - 20.15) / 0.3, (20.15 - 19.4) / 0.3); M.cpkLow = (20.15 - 19.4) / 0.3;
  // IV. Analyze
  M.t1 = (10.6 - 10) / (1.2 / Math.sqrt(16)); M.t1c = S.tinv(0.975, 15); M.t1p = 2 * (1 - S.tcdf(M.t1, 15));
  M.regY = 12 + 0.8 * 25; M.regYw = 0.8 * 25; M.r2 = 0.6 * 0.6;
  M.chiDf = (4 - 1) * (3 - 1);
  M.fRatio = 9 / 4; M.fSd = 3 / 2;
  M.aF = 30 / 6; M.aFp = 1 - S.fcdf(M.aF, 3, 16); M.aFc = S.finv(0.95, 3, 16);
  M.nSize = Math.pow((z(0.975) + z(0.80)) * 6 / 3, 2); M.nSizeUp = Math.ceil(M.nSize); M.nSize90 = Math.ceil(Math.pow((z(0.975) + z(0.90)) * 6 / 3, 2));
  M.chiP = 1 - S.chi2cdf(9.8, 4); M.chiC = S.chi2inv(0.95, 4);
  // V. Improve
  M.runs62 = Math.pow(2, 6 - 2); M.runs6 = Math.pow(2, 6);
  M.effA = (34 + 38) / 2 - (24 + 26) / 2; M.effAB = ((38 - 26) - (34 - 24)) / 2;
  M.kan = 240 * 1.5 * 1.2 / 20; M.kanUp = Math.ceil(M.kan); M.kanNoSafety = 240 * 1.5 / 20;
  M.flow = 30 + 5 - 1; M.batch = 5 * 30; M.smed = 60 - 25 - 15;
  // VI. Control
  M.xUcl = 100 + 0.729 * 4; M.xLcl = 100 - 0.729 * 4; M.xUclW = 100 + 3 * 4; void A2n4;   // NIST's printed A2 for n = 4, as a table user would
  M.cUcl = 9 + 3 * 3; M.cLcl = 9 - 3 * 3;
  M.pUcl = 0.1 + 3 * Math.sqrt(0.1 * 0.9 / 100); M.pUclW = 0.1 + 3 * Math.sqrt(0.1 * 0.9);
  M.iUcl = 50 + 3 * 2.256 / 1.128; M.iUclW = 50 + 3 * 2.256;   // NIST writes the constant as 1.128
  // extras for distractors and second facts
  M.pceCal = M.pceVa / (48 * 60); M.dpko = M.dpDef / (M.dpUnits * M.dpOpp) * 1000;
  M.orP = 0.04 + 0.06 - 0.01; M.orNoOverlap = 0.04 + 0.06; M.orProd = 0.04 * 0.06; M.orAdd = 0.04 + 0.06 + 0.01;
  M.n2t = 2 * M.nTail; M.grrPctV = (M.grr * M.grr) / (M.grrTot * M.grrTot); M.rSqrt = Math.sqrt(0.6);
  M.nSizeHalf = Math.ceil(Math.pow((z(0.975) + z(0.80)) * 6 / 6, 2)); M.nSizeQuarter = Math.ceil(Math.pow((z(0.975) + z(0.80)) * 6 / 1.5, 2));
  M.iUclD4 = 50 + 3.267 * 2.256; M.qfdTop = 9 * 3;
  return M;
}
module.exports = { computeMock };
