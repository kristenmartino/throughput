"""Second computation of every deck number (see math/numbers.js). Independent pieces: math.erf for the normal CDF,
statistics.NormalDist for the inverse, math.comb and math.perm, statistics.stdev. Prints a flat JSON object."""
import json, math, statistics
from statistics import NormalDist

Z = NormalDist()
phi = Z.cdf

def compute():
    N = {}
    rel = [[9, 3, 1], [0, 3, 9], [0, 1, 3]]; w = [5, 3, 4]
    score = [sum(w[i] * rel[i][j] for i in range(3)) for j in range(3)]
    N['df4'] = dict(length=score[0], weight=score[1], wheel=score[2], unweighted0=sum(r[0] for r in rel), unweighted2=sum(r[2] for r in rel))
    # CPM by enumerating the two paths; slack = longest path - longest path through the activity.
    d = dict(A=3, B=4, C=2, D=5, E=3, F=2)
    p1 = d['A'] + d['B'] + d['D'] + d['F']; p2 = d['A'] + d['C'] + d['E'] + d['F']; dur = max(p1, p2)
    a, m, b = 3, 5, 9
    N['df6'] = dict(dur=dur, slackC=dur - p2, slackE=dur - p2, slackB=dur - p1, pathShort=p2, pertTe=(a + 4 * m + b) / 6, pertSd=(b - a) / 6, pertMean3=(a + m + b) / 3,
                    rpn1=8 * 4 * 6, rpn2=10 * 2 * 3, rpn3=5 * 7 * 7)
    units, opp, defects = 1000, 6, 180; fpy = [0.95, 0.97, 0.92]
    dpo = defects / (units * opp)
    N['df8'] = dict(units=units, opp=opp, defects=defects, dpu=defects / units, rty=math.prod(fpy), rtyApprox=math.exp(-defects / units), fpyMean=statistics.mean(fpy),
                    dpmo=dpo * 1e6, sigmaLt=Z.inv_cdf(1 - dpo), sigma=Z.inv_cdf(1 - dpo) + 1.5, dpmoWrong=defects / units * 1e6,
                    copq=42000 + 18000 + 35000, coq=42000 + 18000 + 35000 + 25000 + 10000)
    N['ms2'] = dict(none5=0.98 ** 5, atLeast1=1 - 0.98 ** 5, excl=0.03 + 0.05, notExcl=0.03 + 0.05 - 0.01, perm83=math.perm(8, 3), comb83=math.comb(8, 3),
                    both2of10=(2 / 10) * (1 / 9), both2of10wr=0.2 * 0.2)
    N['ms3'] = dict(se=12 / math.sqrt(36), seWrong=12 / 36, n4x=36 * 4, se100=12 / math.sqrt(144))
    binom = lambda n, p, k: math.comb(n, k) * p ** k * (1 - p) ** (n - k)
    pois = lambda l, k: math.exp(-l) * l ** k / math.factorial(k)
    N['ms4'] = dict(b0=binom(10, .1, 0), b1=binom(10, .1, 1), bLe1=binom(10, .1, 0) + binom(10, .1, 1), p0=pois(2, 0), p3=pois(2, 3), pLe1=pois(2, 0) + pois(2, 1),
                    z=(53 - 50) / 2, tail=1 - 0.5 * (1 + math.erf(1.5 / math.sqrt(2))), between=phi(1) - phi(-1))
    x = [12, 15, 11, 14, 13, 18, 12, 16, 13, 12, 30, 14, 13, 15, 12]
    y = [v for v in x if v != 30]
    N['ms6'] = dict(n=len(x), mean=statistics.mean(x), median=statistics.median(x), mode=statistics.mode(x), range=max(x) - min(x), sd=statistics.stdev(x),
                    sdPop=statistics.pstdev(x), meanNo=statistics.mean(y), modeCount=x.count(statistics.mode(x)))
    rep, repro, part, tol = 0.12, 0.16, 1.0, 8.0
    grr = math.hypot(rep, repro); tot = math.hypot(grr, part)
    N['ms7'] = dict(rep=rep, repro=repro, part=part, tol=tol, grr=grr, tot=tot, pctGrr=grr / tot * 100, pctAdd=(rep + repro) / tot * 100, pctVar=(grr / tot) ** 2 * 100,
                    pt=6 * grr / tol * 100, pt515=5.15 * grr / tol * 100, biasRef=25.000, biasMean=25.012, bias=25.012 - 25.000)
    usl, lsl, t, mu, sw, so = 10.5, 9.5, 10.0, 10.1, 0.12, 0.15
    zU, zL = (usl - mu) / so, (mu - lsl) / so
    ppmU, ppmL = (1 - phi(zU)) * 1e6, (1 - phi(zL)) * 1e6
    cpk = min((usl - mu) / (3 * sw), (mu - lsl) / (3 * sw))
    N['ms9'] = dict(usl=usl, lsl=lsl, t=t, mu=mu, sw=sw, so=so, cp=(usl - lsl) / (6 * sw), cpk=cpk, pp=(usl - lsl) / (6 * so),
                    ppk=min((usl - mu) / (3 * so), (mu - lsl) / (3 * so)), cpm=(usl - lsl) / (6 * math.sqrt(sw ** 2 + (mu - t) ** 2)),
                    cpkWrongSide=(mu - lsl) / (3 * sw), zUw=(usl - mu) / sw, zU=zU, zL=zL, ppmU=ppmU, ppmL=ppmL, ppm=ppmU + ppmL, zSt=zU + 1.5, sigma3cpk=3 * cpk,
                    sixSigmaDpmo=(1 - phi(4.5)) * 1e6, cp133Ppm=2 * (1 - phi(4)) * 1e6)
    out = {f'{k}.{j}': v for k, d in N.items() for j, v in d.items()}
    # Phase 2 numbers (math/phase2.py); loaded by path because the build runs Python with -I.
    import importlib.util, os
    spec = importlib.util.spec_from_file_location('phase2', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'phase2.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    out.update(mod.compute2())
    return out

if __name__ == '__main__':
    print(json.dumps(compute()))
