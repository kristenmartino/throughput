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
    # ---- sc2
    o = {}; pts = [(10, 20, 400), (40, 10, 300), (30, 40, 300)]; V = sum(p[2] for p in pts)
    for i, (x, y, v) in enumerate(pts): o[f'x{i + 1}'] = x; o[f'y{i + 1}'] = y; o[f'v{i + 1}'] = v
    o['vTot'] = V; o['cgX'] = sum(x * v for x, y, v in pts) / V; o['cgY'] = sum(y * v for x, y, v in pts) / V
    o['avgX'] = sum(p[0] for p in pts) / 3; o['avgY'] = sum(p[1] for p in pts) / 3
    o.update(price=40, freight=3, ins=0.40, dutyRate=0.05, duty=2.0, broker=0.60, inland=1.00, domestic=45)
    o['landed'] = 40 + 3 + 0.40 + 2.0 + 0.60 + 1.00; o['landedNoDuty'] = o['landed'] - 2.0; o['cif'] = 40 + 3 + 0.40
    o['offPrem'] = o['landed'] / 45 - 1; o['priceGap'] = (45 - 40) / 45
    o.update(dio=60, dso=45, dpo=50); o['c2c'] = 60 + 45 - 50; o['c2cWrong'] = 60 + 45 + 50; o['c2cDpo65'] = 60 + 45 - 65
    out.update({f'sc2.{k}': float(v) for k, v in o.items()})
    # ---- sc3
    o = dict(fixed=60000, vMake=12, pBuy=18, qLo=8000, qHi=15000)
    o['be'] = 60000 / 6; o['beWrong'] = 60000 / 18
    o['makeLo'] = 60000 + 12 * 8000; o['buyLo'] = 18 * 8000; o['saveLo'] = o['makeLo'] - o['buyLo']
    o['makeHi'] = 60000 + 12 * 15000; o['buyHi'] = 18 * 15000; o['saveHi'] = o['buyHi'] - o['makeHi']
    w = [0.40, 0.30, 0.20, 0.10]; sc = {'A': [4, 3, 5, 3], 'B': [3, 5, 4, 4], 'C': [5, 3, 3, 5]}
    for k, v in zip(['wQ', 'wP', 'wD', 'wS'], w): o[k] = v
    for k, vals in sc.items():
        for i, v in enumerate(vals): o[f's{k}{i}'] = v
        o[f'ws{k}'] = sum(a * b for a, b in zip(vals, w)); o[f'avg{k}'] = sum(vals) / 4
    o.update(xPrice=50, xFreight=2, xDef=0.04, yPrice=46, yFreight=4.5, yDef=0.08, defCost=25, yExp=1.5, vol=20000)
    o['xDefU'] = 0.04 * 25; o['yDefU'] = 0.08 * 25
    o['xTco'] = 50 + 2 + o['xDefU']; o['yTco'] = 46 + 4.5 + o['yDefU'] + 1.5
    o['tcoGapU'] = o['yTco'] - o['xTco']; o['tcoGapYr'] = o['tcoGapU'] * 20000; o['priceGapYr'] = 4 * 20000; o['priceGapPct'] = 4 / 50
    o['yNoDef'] = 46 + 4.5 + 1.5
    o.update(tgtCost=100000, tgtFee=10000, shareBuyer=0.8, shareSeller=0.2, actCost=90000)
    o['underrun'] = 10000; o['sellerGain'] = 0.2 * 10000; o['fee'] = 10000 + o['sellerGain']; o['priceInc'] = 90000 + o['fee']
    o['feeWrong'] = 10000 + 0.8 * 10000; o['buyerSave'] = 110000 - o['priceInc']
    out.update({f'sc3.{k}': float(v) for k, v in o.items()})
    # ---- sc7
    o = dict(pFire=0.05, iFire=2000000, pStrike=0.20, iStrike=300000, pRecall=0.02, iRecall=4000000)
    o['eFire'] = 0.05 * 2000000; o['eStrike'] = 0.20 * 300000; o['eRecall'] = 0.02 * 4000000
    o['eTotal'] = o['eFire'] + o['eStrike'] + o['eRecall']
    o.update(dualCost=40000, dualCut=0.75); o['eFireAfter'] = 0.05 * 2000000 * 0.25; o['dualSave'] = o['eFire'] - o['eFireAfter']; o['dualNet'] = o['dualSave'] - 40000
    o.update(ttr=6, tts=4, weekRev=500000); o['ttGap'] = 2; o['revRisk'] = 2 * 500000; o['revRiskWrong'] = 6 * 500000
    out.update({f'sc7.{k}': float(v) for k, v in o.items()})
    # ---- sc6
    o = dict(gm=0.30, costOrder=80, costDel=150, pRev=500000, pOrd=400, pDel=200, pRet=10000, qRev=800000, qOrd=1500, qDel=600, qRet=40000)
    for c in ('p', 'q'):
        o[c + 'Gm'] = o[c + 'Rev'] * 0.30; o[c + 'Cts'] = o[c + 'Ord'] * 80 + o[c + 'Del'] * 150 + o[c + 'Ret']
        o[c + 'Prof'] = o[c + 'Gm'] - o[c + 'Cts']; o[c + 'Margin'] = o[c + 'Prof'] / o[c + 'Rev']
    o.update(otd=0.95, complete=0.97, undamaged=0.99, docs=0.98)
    o['perfect'] = 0.95 * 0.97 * 0.99 * 0.98; o['perfectAvg'] = (0.95 + 0.97 + 0.99 + 0.98) / 4; o['perfectMin'] = 0.95
    o.update(wQual=0.40, wDel=0.35, wCost=0.25, rQual=92, rDel=85, rCost=90, rDel2=95)
    o['score'] = 0.40 * 92 + 0.35 * 85 + 0.25 * 90; o['scoreAvg'] = (92 + 85 + 90) / 3
    o['score2'] = 0.40 * 92 + 0.35 * 95 + 0.25 * 90; o['scoreUp'] = o['score2'] - o['score']
    o['qLoss'] = -o['qProf']; o.update(gain=200000, gainShare=0.5); o['gainEach'] = 100000
    out.update({f'sc6.{k}': float(v) for k, v in o.items()})
    return out
