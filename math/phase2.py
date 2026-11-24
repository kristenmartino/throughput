"""Second computation of every Phase 2 number (see math/phase2.js), with independent tools: scipy.stats tests and
distributions (ttest_1samp, ttest_ind, ttest_rel, f_oneway, chi2_contingency, linregress), scipy.integrate.quad for
the range constants d2 and d3, and scipy.special.gamma for c4. Imported by math/numbers.py."""
import json, math
import numpy as np
from scipy import stats, integrate, special

def range_moments(n):
    phi, dens = stats.norm.cdf, stats.norm.pdf
    d2 = integrate.quad(lambda x: 1 - phi(x) ** n - (1 - phi(x)) ** n, -np.inf, np.inf, epsabs=1e-12)[0]
    # density of the range, f(r) = n(n-1) ∫ φ(x) φ(x+r) (Φ(x+r) - Φ(x))^(n-2) dx, integrated with Simpson's rule on a
    # grid (a different rule and a different formula from the JS side, which integrates P(R > r))
    x = np.linspace(-12, 12, 2401); r = np.linspace(0, 14, 1401)
    px, dx = phi(x), dens(x)
    fr = np.array([integrate.simpson(dx * dens(x + rr) * (phi(x + rr) - px) ** (n - 2), x=x) for rr in r]) * n * (n - 1)
    e2 = integrate.simpson(r * r * fr, x=r)
    return d2, math.sqrt(e2 - d2 * d2)

def c4(n):
    return math.sqrt(2 / (n - 1)) * special.gamma(n / 2) / special.gamma((n - 1) / 2)

def rng(a):
    return max(a) - min(a)

def compute2():
    N = {}
    avail, demand, work, cycle = 2 * (8 * 60 - 30), 360, 12, 3
    takt = avail / demand
    N['ov3'] = dict(avail=avail, demand=demand, takt=takt, taktSec=takt * 60, work=work, ops=work / takt, opsUp=math.ceil(work / takt), cycle=cycle,
                    short=(cycle - takt) * demand, maxOut=avail / cycle, taktWrong=demand / avail)
    vaT, lead = 4 + 12 + 6 + 9 + 5 + 2, 3 * 8 * 60
    N['ov4'] = dict(vaT=vaT, lead=lead, pce=vaT / lead, nva=lead - vaT, leadHalf=lead / 2, pceHalf=vaT / (lead / 2))
    N['ov6'] = dict(rpnA=9 * 2 * 3, rpnB=5 * 6 * 5, rpnC=7 * 4 * 4, rpnBafter=5 * 2 * 5, rpnMax=10 ** 3, rpnAdetect=9 * 2 * 8, sumB=16)

    # multi-vari: rebuild the data with numpy and take the three families of variation
    base = np.array([25.010, 25.030, 25.055, 25.080])
    piece = np.array([[0.000, 0.004, -0.003], [0.002, -0.002, 0.003], [-0.003, 0.001, 0.002], [0.003, 0.000, -0.002]])
    pos = np.array([0.002, 0.000, -0.002])
    h, k, j = np.meshgrid(range(4), range(3), range(3), indexing='ij')
    data = np.round(base[h] + piece[h, k] + pos[j] + np.where((h + k + j) % 2 == 1, 0.001, -0.001), 3)
    within = np.ptp(data, axis=2).mean(); p2p = np.ptp(data.mean(axis=2), axis=1).mean(); hm = data.reshape(4, 9).mean(axis=1); t2t = np.ptp(hm)
    N['an1'] = dict(within=within, p2p=p2p, t2t=t2t, hourLo=hm[0], hourHi=hm[3], ratio=t2t / max(within, p2p))

    x = np.array([150, 155, 160, 165, 170, 175, 180, 185.0]); y = np.array([41.2, 43.0, 44.1, 46.5, 46.9, 49.3, 50.2, 52.4])
    lr = stats.linregress(x, y); n = len(x); tc = stats.t.ppf(0.975, n - 2)
    resid = y - (lr.intercept + lr.slope * x); s = math.sqrt((resid ** 2).sum() / (n - 2)); sxx = ((x - x.mean()) ** 2).sum()
    x0 = 172; yhat = lr.intercept + lr.slope * x0
    se_m = s * math.sqrt(1 / n + (x0 - x.mean()) ** 2 / sxx); se_p = s * math.sqrt(1 + 1 / n + (x0 - x.mean()) ** 2 / sxx)
    r = np.corrcoef(x, y)[0, 1]
    N['an2'] = dict(n=n, r=r, r2=r * r, rNeg=-r)
    N['an3'] = dict(b0=lr.intercept, b1=lr.slope, s=s, seb1=lr.stderr, t=lr.slope / lr.stderr, p=lr.pvalue, df=n - 2, tc=tc, x0=x0, yhat=yhat,
                    ciLo=yhat - tc * se_m, ciHi=yhat + tc * se_m, piLo=yhat - tc * se_p, piHi=yhat + tc * se_p, r2=lr.rvalue ** 2,
                    xFar=240, yFar=lr.intercept + lr.slope * 240, per10=lr.slope * 10)

    za, zb, zb80 = stats.norm.ppf(0.975), stats.norm.ppf(0.90), stats.norm.ppf(0.80)
    nn = ((za + zb) * 4 / 2) ** 2; n80 = ((za + zb80) * 4 / 2) ** 2; nh = ((za + zb) * 4 / 1) ** 2
    zbig = 0.1 / (4 / math.sqrt(10000))
    N['an4'] = dict(za=za, zb=zb, n=nn, nUp=math.ceil(nn), n80=n80, n80Up=math.ceil(n80), nHalf=nh, nHalfUp=math.ceil(nh), zBig=zbig, pBig=2 * stats.norm.sf(zbig))

    fills = [502.1, 499.4, 503.8, 501.2, 500.9, 504.0, 498.7, 502.6, 503.1, 501.5]
    t1 = stats.ttest_1samp(fills, 500)
    a = [12.4, 11.8, 13.1, 12.9, 12.2, 13.4, 12.7, 12.0]; b = [11.6, 11.2, 12.3, 11.9, 12.4, 11.0, 11.7, 11.5]
    t2 = stats.ttest_ind(a, b, equal_var=True)
    sp = math.sqrt(((len(a) - 1) * np.var(a, ddof=1) + (len(b) - 1) * np.var(b, ddof=1)) / (len(a) + len(b) - 2))
    before = [14.2, 15.8, 13.1, 16.4, 12.9, 15.1, 14.6, 13.8]; after = [13.5, 15.0, 12.9, 15.2, 12.1, 14.8, 13.7, 13.6]
    tp = stats.ttest_rel(before, after); tw = stats.ttest_ind(before, after, equal_var=True); d = np.subtract(before, after)
    N['an5'] = dict(mean=np.mean(fills), s=np.std(fills, ddof=1), t=t1.statistic, p=t1.pvalue, df=9, tc=stats.t.ppf(0.975, 9),
                    ma=np.mean(a), mb=np.mean(b), sa=np.std(a, ddof=1), sb=np.std(b, ddof=1), sp=sp, t2=t2.statistic, df2=14, p2=t2.pvalue, tc2=stats.t.ppf(0.975, 14),
                    dmean=d.mean(), dsd=d.std(ddof=1), tp=tp.statistic, pp=tp.pvalue, dfp=7, tcp=stats.t.ppf(0.975, 7), tW=tw.statistic, pW=tw.pvalue)

    old = [10.02, 9.96, 10.05, 9.93, 10.08, 9.97, 10.04, 9.95, 10.06, 9.94]; new = [10.01, 9.99, 10.02, 9.98, 10.00, 10.03, 9.99, 10.01, 9.98, 10.02]
    v1, v2 = np.var(old, ddof=1), np.var(new, ddof=1); F = v1 / v2
    g = [[18.2, 17.6, 19.0, 18.4, 17.9], [19.4, 20.1, 19.8, 20.6, 19.6], [18.1, 18.8, 17.7, 18.5, 18.0]]
    fa = stats.f_oneway(*g); allv = np.concatenate(g); gm = allv.mean()
    sst = sum(len(v) * (np.mean(v) - gm) ** 2 for v in g); sse = sum(((np.array(v) - np.mean(v)) ** 2).sum() for v in g)
    N['an6'] = dict(s1=math.sqrt(v1), s2=math.sqrt(v2), v1=v1, v2=v2, F=F, d1=9, d2=9, pF=2 * min(stats.f.sf(F, 9, 9), stats.f.cdf(F, 9, 9)), fcU=stats.f.ppf(0.975, 9, 9),
                    mA=np.mean(g[0]), mB=np.mean(g[1]), mC=np.mean(g[2]), gm=gm, sst=sst, sse=sse, stot=((allv - gm) ** 2).sum(), dft=2, dfe=12, dftot=14,
                    mst=sst / 2, mse=sse / 12, FA=fa.statistic, pA=fa.pvalue, fcA=stats.f.ppf(0.95, 2, 12))

    xa, na, xb, nb = 18, 400, 34, 400
    pp = (xa + xb) / (na + nb); z = (xb / nb - xa / na) / math.sqrt(pp * (1 - pp) * (1 / na + 1 / nb))
    obs = np.array([[22, 15, 13], [30, 14, 6], [18, 26, 16]])
    chi, pc, dof, exp = stats.chi2_contingency(obs, correction=False)
    N['an7'] = dict(xa=xa, na=na, xb=xb, nb=nb, pa=xa / na, pb=xb / nb, pp=pp, z=z, pz=2 * stats.norm.sf(abs(z)), n=int(obs.sum()), e11=exp[0, 0], e23=exp[1, 2], e32=exp[2, 1],
                    r1=int(obs[0].sum()), c1=int(obs[:, 0].sum()), chi=chi, df=dof, pc=pc, cc=stats.chi2.ppf(0.95, 4), cell32=(obs[2, 1] - exp[2, 1]) ** 2 / exp[2, 1])
    N['an8'] = dict(now=0.82, target=0.95, gap=0.95 - 0.82, orders=1200, lateNow=1200 * (1 - 0.82), lateTarget=1200 * (1 - 0.95), lateCut=1200 * (0.95 - 0.82))

    N['im1'] = dict(full3=2 ** 3, full3x2=2 ** 3 * 2, full5=2 ** 5, half5=2 ** 4, three3=3 ** 3, full4=2 ** 4)
    # 2x2 design by least squares on coded columns: effect = 2 x coefficient
    A = np.array([-1, 1, -1, 1] * 2); B = np.array([-1, -1, 1, 1] * 2); Y = np.array([62, 70, 65, 85, 64, 72, 67, 87.0])
    X = np.column_stack([np.ones(8), A, B, A * B]); coef = np.linalg.lstsq(X, Y, rcond=None)[0]
    cell = {(i, j): Y[(A == i) & (B == j)].mean() for i in (-1, 1) for j in (-1, 1)}
    N['im2'] = dict(mmm=cell[(-1, -1)], pm=cell[(1, -1)], mp=cell[(-1, 1)], pp=cell[(1, 1)], A=2 * coef[1], B=2 * coef[2], AB=2 * coef[3],
                    aLo=Y[A == -1].mean(), aHi=Y[A == 1].mean(), bLo=Y[B == -1].mean(), bHi=Y[B == 1].mean(),
                    aAtBlo=cell[(1, -1)] - cell[(-1, -1)], aAtBhi=cell[(1, 1)] - cell[(-1, 1)], grand=coef[0], runs=8, best=cell[(1, 1)])
    kk = 180 * 2 * 1.15 / 25
    N['im4'] = dict(D=180, L=2, a=0.15, C=25, k=kk, kUp=math.ceil(kk), noSafety=180 * 2 / 25)
    N['im6'] = dict(steps=4, per=1, batch=50, batchLead=4 * 50, flowLead=50 + 3, firstBatch=200, firstFlow=4, setup=80, internal=50, external=30, afterSep=50, afterConv=30,
                    afterStream=30 * 0.6, cut=80 - 18, cutPct=(80 - 18) / 80)

    K = {}
    for n in range(2, 11):
        d2, d3 = range_moments(n); c = c4(n)
        K.update({f'd2n{n}': d2, f'd3n{n}': d3, f'A2n{n}': 3 / (d2 * math.sqrt(n)), f'D3n{n}': max(0, 1 - 3 * d3 / d2), f'D4n{n}': 1 + 3 * d3 / d2,
                  f'c4n{n}': c, f'A3n{n}': 3 / (c * math.sqrt(n)), f'B3n{n}': max(0, 1 - 3 * math.sqrt(1 - c * c) / c), f'B4n{n}': 1 + 3 * math.sqrt(1 - c * c) / c})
    K['e2'] = 3 / K['d2n2']
    N['k'] = K
    xbb, rbar, sbar = 50.20, 1.8, 0.77
    ind = np.array([24.1, 25.3, 23.8, 24.9, 25.6, 24.4, 23.9, 25.1, 24.7, 25.8, 24.2, 24.6]); mr = np.abs(np.diff(ind))
    N['co3'] = dict(xbb=xbb, rbar=rbar, sbar=sbar, A2=K['A2n5'], D4=K['D4n5'], uclX=xbb + K['A2n5'] * rbar, lclX=xbb - K['A2n5'] * rbar, uclR=K['D4n5'] * rbar, lclR=K['D3n5'] * rbar,
                    sigma=rbar / K['d2n5'], uclXs=xbb + K['A3n5'] * sbar, lclXs=xbb - K['A3n5'] * sbar, uclS=K['B4n5'] * sbar, lclS=K['B3n5'] * sbar, A3=K['A3n5'], B4=K['B4n5'],
                    uclXwrong=xbb + 3 * rbar, n7lcl=K['D3n7'] * rbar, xbI=ind.mean(), mrb=mr.mean(), uclI=ind.mean() + K['e2'] * mr.mean(), lclI=ind.mean() - K['e2'] * mr.mean(),
                    uclMR=K['D4n2'] * mr.mean(), e2=K['e2'], d2n2=K['d2n2'])
    xs = np.array([50.1, 49.8, 50.5, 50.0, 50.3, 49.7, 50.2, 49.9, 50.4, 50.6, 50.5, 50.8, 50.4, 50.7, 50.6, 50.9, 50.3, 50.0, 49.6, 50.2])
    above = (xs > 50.20).astype(int); best = end = run = 0
    for i, v in enumerate(above):
        run = run + 1 if v else 0
        if run > best: best, end = run, i
    N['co1'] = dict(runLen=best, runFrom=end - best + 2, runTo=end + 1, beyond=int(((xs > N['co3']['uclX']) | (xs < N['co3']['lclX'])).sum()), max=xs.max())
    pbar, n = 0.045, 200; s_ = math.sqrt(pbar * (1 - pbar) / n); np_ = n * pbar; snp = math.sqrt(np_ * (1 - pbar))
    N['co4'] = dict(pbar=pbar, n=n, uclP=pbar + 3 * s_, lclPraw=pbar - 3 * s_, lclP=max(0, pbar - 3 * s_), np=np_, uclNp=np_ + 3 * snp, lclNp=np_ - 3 * snp,
                    cbar=6.2, uclC=6.2 + 3 * math.sqrt(6.2), lclCraw=6.2 - 3 * math.sqrt(6.2), ub=1.6, un=5, uclU=1.6 + 3 * math.sqrt(1.6 / 5), lclUraw=1.6 - 3 * math.sqrt(1.6 / 5),
                    n100ucl=pbar + 3 * math.sqrt(pbar * (1 - pbar) / 100), nistC=28, nistCl=4)
    c, p = N['co3'], N['co4']
    c.update(uclXA2n2=xbb + K['A2n2'] * rbar, a2r=K['A2n5'] * rbar, r3=3 * rbar, uclIw1=ind.mean() + 3 * mr.mean(), uclIw2=ind.mean() + K['D4n2'] * mr.mean(), uclIw3=ind.mean() + mr.mean() / K['d2n2'])
    p.update(qbar=1 - pbar, wNoN=pbar + 3 * math.sqrt(pbar * (1 - pbar)), wPx3=pbar + 3 * pbar, sqrtC=math.sqrt(6.2), cW1=6.2 + 3 * 6.2, cW2=6.2 + math.sqrt(6.2), cW3=6.2 + 3 * math.sqrt(6.2 / 5))
    out = {}
    for key, d in N.items():
        for j, v in d.items():
            out[f'{key}.{j}'] = float(v)
    return out

if __name__ == '__main__':
    print(json.dumps(compute2()))
