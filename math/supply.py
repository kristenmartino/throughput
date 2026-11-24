"""Second computation of the supply chain deck numbers (see math/supply.js). Written independently: MRP by netting
cumulative requirements, statistics with Python's statistics module. Loaded by math/numbers.py by path."""
import math
from statistics import NormalDist


def compute_supply():
    out = {}
    # ---- sc4
    o = {}
    gross = [0, 40, 0, 60, 30, 50]; sched = [0, 20, 0, 0, 0, 0]; L = 2; oh = 50
    o['onHand'] = oh; o['lt'] = L; o['sr'] = 20
    for i, g in enumerate(gross): o[f'gr{i + 1}'] = g
    # lot-for-lot net requirement in week t = max(0, cumulative gross - (on hand + cumulative receipts) - earlier net)
    net = []; cum_g = 0; cum_s = 0
    for t in range(6):
        cum_g += gross[t]; cum_s += sched[t]
        short = cum_g - (oh + cum_s) - sum(net)
        net.append(max(0, short))
    pab = []; cum_g = 0; cum_s = 0
    for t in range(6):
        cum_g += gross[t]; cum_s += sched[t]
        pab.append(oh + cum_s + sum(net[:t + 1]) - cum_g)
    for t in range(6): o[f'net{t + 1}'] = net[t]; o[f'pab{t + 1}'] = pab[t]
    rel = [net[t + L] if t + L < 6 else 0 for t in range(6)]
    for t in range(6): o[f'rel{t + 1}'] = rel[t]
    o['netTotal'] = sum(net); o['firstNetWeek'] = next(i for i, x in enumerate(net) if x > 0) + 1
    o['firstRelWeek'] = next(i for i, x in enumerate(rel) if x > 0) + 1
    o['netNoSr'] = max(0, sum(gross[:4]) - oh); o['netW4NoSr'] = o['netNoSr']; o['netW4'] = net[3]
    o['machines'] = 2; o['hours'] = 40; o['avail'] = 2 * 40; o['util'] = 0.85; o['eff'] = 0.95
    o['rated'] = o['avail'] * 0.85 * 0.95; o['load'] = 70; o['over'] = 70 - o['rated']
    o['ratedNoEff'] = 80 * 0.85; o['ratedUtilOnly'] = 80 * 0.95
    D, S, c, i = 12000, 60, 25, 0.20; H = i * c
    o.update(D=D, S=S, c=c, i=i, H=H)
    q = (2 * D * S / H) ** 0.5
    o['eoq'] = q; o['eoqUp'] = math.ceil(q); o['ordersYr'] = D / q; o['ordCost'] = D / q * S; o['holdCost'] = q / 2 * H
    o['tc'] = o['ordCost'] + o['holdCost']; o['eoqWrongC'] = (2 * D * S / c) ** 0.5; o['eoqNo2'] = (D * S / H) ** 0.5
    o['tc2x'] = D / (2 * q) * S + q * H; o['tc2xRatio'] = o['tc2x'] / o['tc']; o['tc2xRise'] = o['tc2xRatio'] - 1
    o['eoqD4'] = (2 * 4 * D * S / H) ** 0.5; o['eoqD4Ratio'] = o['eoqD4'] / q
    d, sd, Lt = 40, 8, 9
    o.update(d=d, sd=sd, L=Lt, z95=1.645, z99=2.326, ltd=d * Lt)
    o['ss95'] = 1.645 * sd * Lt ** 0.5; o['rop95'] = d * Lt + o['ss95']; o['ss99'] = 2.326 * sd * Lt ** 0.5; o['rop99'] = d * Lt + o['ss99']
    o['ssNoRoot'] = 1.645 * sd * Lt; o['ssL36'] = 1.645 * sd * 36 ** 0.5; o['sdL'] = 2
    o['sdLtd'] = (Lt * sd ** 2 + d ** 2 * 2 ** 2) ** 0.5; o['ssVarL'] = 1.645 * o['sdLtd']
    abc = [420, 260, 90, 60, 50, 40, 30, 25, 15, 10]; tot = sum(abc)
    o['abcTotal'] = tot; o['abcTop2'] = sum(sorted(abc, reverse=True)[:2]) / tot; o['abcTop2Pct'] = o['abcTop2']
    o['abcItems'] = len(abc); o['abcTop2Items'] = 2 / len(abc); o['abcC5'] = sum(sorted(abc)[:5]) / tot
    o['counted'] = 200; o['withinTol'] = 188; o['ira'] = 188 / 200
    o['cogs'] = 4800000; o['avgInv'] = 800000; o['turns'] = 4800000 / 800000; o['days'] = 365 / o['turns']
    o['turnsWrongRev'] = 6000000 / 800000; o['wkCogs'] = 4800000 / 52; o['wos'] = 800000 / o['wkCogs']
    # z values must match the normal distribution to the 3 decimals used
    assert abs(NormalDist().inv_cdf(0.95) - 1.645) < 0.0005 and abs(NormalDist().inv_cdf(0.99) - 2.326) < 0.0005
    out.update({f'sc4.{k}': float(v) for k, v in o.items()})
    # ---- sc1 (forecasting by explicit loops; seasonal index by ratio to the mean)
    o = {}; dm = [120, 132, 125, 140, 138, 150]
    for i, x in enumerate(dm): o[f'm{i + 1}'] = x
    o['ma3'] = sum(dm[-3:]) / 3; o['ma6'] = sum(dm) / len(dm)
    w = [0.2, 0.3, 0.5]; o['wma'] = sum(a * b for a, b in zip(w, dm[-3:])); o['wmaRev'] = sum(a * b for a, b in zip(w[::-1], dm[-3:]))
    o['f6'] = 135; o['alpha'] = 0.3
    o['es7'] = 0.3 * dm[5] + 0.7 * 135                       # alpha*actual + (1-alpha)*previous forecast
    o['esWrong'] = 0.3 * 135 + 0.7 * dm[5]; o['es7a8'] = 0.8 * dm[5] + 0.2 * 135
    A = [100, 110, 95, 120]; F = [105, 100, 100, 110]
    for i in range(4): o[f'a{i + 1}'] = A[i]; o[f'f{i + 1}'] = F[i]; o[f'e{i + 1}'] = A[i] - F[i]
    errs = [a - f for a, f in zip(A, F)]
    o['sumE'] = sum(errs); o['mad'] = sum(abs(x) for x in errs) / len(errs); o['bias'] = sum(errs) / len(errs)
    o['ts'] = sum(errs) / o['mad']; o['mape'] = sum(abs(x) / a for x, a in zip(errs, A)) / len(A); o['madSigned'] = abs(sum(errs)) / 4
    o['mse'] = sum(x * x for x in errs) / 4
    qa = [80, 95, 105, 120]; mean = sum(qa) / 4
    o['q4avg'] = qa[3]; o['qOver'] = mean; o['si4'] = qa[3] / mean; o['si1'] = qa[0] / mean
    o['annual'] = 480; o['q4fc'] = 480 / 4 * o['si4']; o['q4fcFlat'] = 480 / 4; o['q4fcWrong'] = 480 * o['si4']; o['q4fcQ1'] = 480 / 4 * o['si1']
    out.update({f'sc1.{k}': float(v) for k, v in o.items()})
    # ---- sc5
    o = {}
    o['shipLb'] = 5000; o['nShip'] = 4; o['ltlRate'] = 18; o['ftl'] = 1800
    cwt = 5000 / 100; o['ltlEach'] = cwt * 18; o['ltlAll'] = 4 * cwt * 18; o['consSave'] = o['ltlAll'] - 1800
    o['breakLb'] = 1800 * 100 / 18; o['ltlWrongLb'] = 4 * 5000 * 18
    o['unitVal'] = 200; o['carry'] = 0.25; o['daysSaved'] = 10; o['airPrem'] = 5
    o['holdDay'] = 200 * 0.25 / 365; o['pipeSave'] = 10 * 200 * 0.25 / 365; o['airNet'] = 5 - o['pipeSave']; o['pipeWrongYr'] = 200 * 0.25 * 10
    o['dcUnits'] = 1200; o['dcDays'] = 14; o['pipeUnits'] = 4200
    o['flow'] = 300; o['transit'] = 14; o['pipe'] = 300 * 14; o['transitAir'] = 3; o['pipeAir'] = 900; o['pipeCut'] = 4200 - 900
    out.update({f'sc5.{k}': float(v) for k, v in o.items()})
    return out
