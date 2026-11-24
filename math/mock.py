"""Second computation of the held-out mock pool's numbers (see math/mock.js), with scipy.stats, math.comb and plain
Python. Loaded by math/numbers.py by path."""
import math
from scipy import stats

def compute_mock(K):
    M = {}
    M['taktAvail'] = 440; M['taktDemand'] = 220; M['takt'] = 440 / 220; M['taktWrongInv'] = 220 / 440; M['taktNoBreak'] = 480 / 220
    M['pceVa'] = 18; M['pceLead'] = 960; M['pce'] = 18 / 960; M['pceWrongNva'] = 18 / 942; M['pceNvaShare'] = 942 / 960
    M['rpn'] = 126; M['rpnSum'] = 16; M['rpnAfter'] = 42
    M['dpUnits'] = 2500; M['dpOpp'] = 4; M['dpDef'] = 150; M['dpmo'] = 150 / 10000 * 1e6; M['dpmoNoOpp'] = 150 / 2500 * 1e6; M['dpu'] = 0.06
    M['rty'] = math.prod([0.98, 0.96, 0.99, 0.97]); M['rtyAvg'] = sum([0.98, 0.96, 0.99, 0.97]) / 4; M['rtyMin'] = 0.96
    M['pertE'] = 30 / 6; M['pertSd'] = 10 / 6; M['pertAvg'] = 6
    M['cpm1'] = 12; M['cpm2'] = 11; M['slackCD'] = 1
    M['copq'] = 87000; M['coqTotal'] = 115000; M['copqWrongAppr'] = 107000
    M['qfd'] = 54; M['qfdNoW'] = 13
    M['atLeast1'] = 1 - stats.binom.pmf(0, 4, 0.05); M['allGood'] = stats.binom.pmf(0, 4, 0.05); M['atLeastWrong'] = 0.2
    M['comb'] = math.comb(10, 2); M['perm'] = math.perm(10, 2)
    M['se'] = 3.0; M['seN36'] = 1.5
    M['bin0'] = stats.binom.pmf(0, 5, 0.2); M['binWrong'] = 0.2
    M['poi0'] = stats.poisson.pmf(0, 1.5); M['poi1'] = stats.poisson.pmf(1, 1.5)
    M['nz'] = 2.0; M['nTail'] = stats.norm.sf(2.0); M['nTailWrong'] = stats.norm.sf(1.5)
    d = [8, 9, 9, 10, 11, 12, 25]
    M['dMean'] = sum(d) / 7; M['dMedian'] = sorted(d)[3]; M['dMode'] = max(set(d), key=d.count); M['dRange'] = max(d) - min(d)
    g = math.hypot(0.3, 0.4); t = math.hypot(g, 2.0)
    M['grr'] = g; M['grrTot'] = t; M['grrPct'] = g / t; M['grrPctAdd'] = 0.7 / t
    M['cp'] = 1.2 / 0.6; M['cpk'] = min(0.45, 0.75) / 0.3; M['cpkLow'] = 0.75 / 0.3
    import numpy as np
    base = np.arange(16, dtype=float); base = (base - base.mean()) / base.std(ddof=1)
    t1 = stats.ttest_1samp(10.6 + 1.2 * base, 10.0).statistic   # a sample built to have mean 10.6 and s 1.2
    M['t1'] = (10.6 - 10) / (1.2 / 4); M['t1c'] = stats.t.ppf(0.975, 15); M['t1p'] = 2 * stats.t.sf(M['t1'], 15)
    assert abs(t1 - M['t1']) < 1e-3
    M['regY'] = 32.0; M['regYw'] = 20.0; M['r2'] = 0.36
    M['chiDf'] = 6
    M['fRatio'] = 2.25; M['fSd'] = 1.5
    M['aF'] = 5.0; M['aFp'] = stats.f.sf(5.0, 3, 16); M['aFc'] = stats.f.ppf(0.95, 3, 16)
    n = ((stats.norm.ppf(0.975) + stats.norm.ppf(0.80)) * 2) ** 2
    M['nSize'] = n; M['nSizeUp'] = math.ceil(n); M['nSize90'] = math.ceil(((stats.norm.ppf(0.975) + stats.norm.ppf(0.90)) * 2) ** 2)
    M['chiP'] = stats.chi2.sf(9.8, 4); M['chiC'] = stats.chi2.ppf(0.95, 4)
    M['runs62'] = 16; M['runs6'] = 64
    M['effA'] = 36 - 25; M['effAB'] = (12 - 10) / 2
    M['kan'] = 240 * 1.5 * 1.2 / 20; M['kanUp'] = math.ceil(M['kan']); M['kanNoSafety'] = 18.0
    M['flow'] = 34; M['batch'] = 150; M['smed'] = 20
    M['xUcl'] = 100 + 0.729 * 4; M['xLcl'] = 100 - 0.729 * 4; M['xUclW'] = 112
    M['cUcl'] = 18; M['cLcl'] = 0
    M['pUcl'] = 0.1 + 3 * math.sqrt(0.09 / 100); M['pUclW'] = 0.1 + 3 * math.sqrt(0.09)
    M['iUcl'] = 50 + 3 * 2.256 / 1.128; M['iUclW'] = 50 + 3 * 2.256
    M['pceCal'] = 18 / 2880; M['dpko'] = 15.0
    M['orP'] = 0.09; M['orNoOverlap'] = 0.10; M['orProd'] = 0.0024; M['orAdd'] = 0.11
    M['n2t'] = 2 * stats.norm.sf(2.0); M['grrPctV'] = 0.25 / (0.25 + 4.0); M['rSqrt'] = math.sqrt(0.6)
    za, zb = stats.norm.ppf(0.975), stats.norm.ppf(0.80)
    M['nSizeHalf'] = math.ceil((za + zb) ** 2); M['nSizeQuarter'] = math.ceil(((za + zb) * 4) ** 2)
    M['iUclD4'] = 50 + 3.267 * 2.256; M['qfdTop'] = 27
    return {f'mk.{k}': float(v) for k, v in M.items()}
