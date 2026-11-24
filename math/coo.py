"""Twin of math/coo.js, written independently for math/check.js (Phase 4, Nov 24)."""
import math


def compute_coo():
    out = {}

    def put(g, d):
        out.update({f'{g}.{k}': float(v) for k, v in d.items()})

    o = dict(bUnits=50000, price=200, bCost=130, aUnits=47000, aCost=134)
    o['bRev'] = 50000 * 200; o['aRev'] = 47000 * 200; o['revVar'] = o['aRev'] - o['bRev']; o['revVarPct'] = o['revVar'] / o['bRev']
    o['bMarginU'] = 70; o['aMarginU'] = 66; o['bMargin'] = 50000 * 70; o['aMargin'] = 47000 * 66; o['marginVar'] = o['aMargin'] - o['bMargin']
    o['volEffect'] = -3000 * 70; o['costEffect'] = -4 * 47000
    o['flexCost'] = 130 * 47000; o['actCost'] = 134 * 47000; o['spendVar'] = o['actCost'] - o['flexCost']; o['staticCostVar'] = o['actCost'] - 130 * 50000
    o['revShort'] = 600000; o['marginShort'] = 3500000 - 3102000; o['unitShort'] = 3000; o['costUp'] = 4
    o['volLoss'] = 210000; o['costLoss'] = 188000; o['staticUnder'] = 130 * 50000 - 134 * 47000
    o.update(avail=0.90, perf=0.95, qual=0.98, perf2=0.99); o['oee'] = 0.90 * 0.95 * 0.98; o['oeeAvg'] = (0.90 + 0.95 + 0.98) / 3
    o['oee2'] = 0.90 * 0.99 * 0.98; o['oeeUp'] = o['oee2'] - o['oee']
    put('c1', o)

    o = dict(fixed=1200000, var=45, vLo=40000, vHi=60000, p0=100, v0=40000, v1=43000, p1=98, c0=45, c1=47)
    o['ucLo'] = 1200000 / 40000 + 45; o['ucHi'] = 1200000 / 60000 + 45; o['ucDrop'] = o['ucLo'] - o['ucHi']
    o['cm'] = 55; o['cmRatio'] = 0.55; o['be'] = 1200000 / 55; o['beU'] = math.ceil(1200000 / 55); o['beWrong'] = 1200000 / 100
    o['cm0'] = 55 * 40000; o['cm1'] = 51 * 43000; o['cmChange'] = o['cm1'] - o['cm0']
    o['volFx'] = 3000 * 55; o['priceFx'] = -2 * 43000; o['costFx'] = -2 * 43000
    o.update(dio=50, dso=40, dpo=35, cogsDay=50000, dioCut=10); o['ccc'] = 55; o['cashFreed'] = 500000
    o.update(cmDrop=2200000 - 2193000, vUp=3000, pDown=2, cUp=2, priceLoss=86000, costLoss=86000, p1Low=60, rushCm=15, priceLossOld=80000, cccWrong=125, opCycle=90)
    o.update(capex=600000, saveYr=150000); o['paybackDbl'] = 8.0; o['payback'] = 4.0; o['paybackWrong'] = 150000 / 600000
    put('c2', o)

    o = dict(dMo=12000, capMo=10500, months=3, invOver=1000, price=150, otMo=800, otCost=6, cmU=50, copCost=14)
    o['demand'] = 36000; o['supply'] = 31500 + 1000; o['gap'] = 36000 - 32500; o['revRisk'] = o['gap'] * 150
    o['otUnits'] = 2400; o['otSpend'] = 2400 * 6; o['gapAfterOt'] = o['gap'] - 2400
    o['otCmNet'] = 2400 * (50 - 6); o['gapWrong'] = 1500 * 3; o['copNet'] = o['gapAfterOt'] * (50 - 14)
    o['gapMo'] = 1500; o['otCmGross'] = 2400 * 50; o['revOt'] = 2400 * 150
    put('c3', o)

    o = dict(carry=0.25, offUnit=20, offFreight=2.5, offDutyRate=0.05, offDays=40, nearUnit=22.5, nearFreight=0.8, nearDays=7, vol=200000)
    o['offDuty'] = 1.0; o['offBase'] = 23.5; o['offPipe'] = 23.5 * 0.25 * 40 / 365; o['offTotal'] = 23.5 + o['offPipe']
    o['nearBase'] = 23.3; o['nearPipe'] = 23.3 * 0.25 * 7 / 365; o['nearTotal'] = 23.3 + o['nearPipe']
    o['gapU'] = o['offTotal'] - o['nearTotal']; o['gapYr'] = o['gapU'] * 200000; o['priceGap'] = 2.5; o['offNoPipe'] = 23.5
    o['offNoDuty'] = o['offTotal'] - 1.0; o['priceGapYr'] = 500000
    put('c4', o)

    o = dict(fA=200000, vA=30, fB=500000, vB=18, qPlan=40000, dem=11000, cap=13000)
    o['cross'] = 300000 / 12; o['crossWrong'] = 500000 / 30
    o['costA'] = 200000 + 30 * 40000; o['costB'] = 500000 + 18 * 40000; o['saveB'] = o['costA'] - o['costB']
    o['util'] = 11000 / 13000; o['cushion'] = 1 - o['util']
    o['crossB'] = 500000 / 18; o['fixedGap'] = 300000; o['cushionWrong'] = 2000 / 11000; o['gapUnits'] = 2000
    put('c5', o)

    def mgrs(front, span):
        res = []; n = front
        while n > 1:
            n = -(-n // span); res.append(n)
        return res
    m8 = mgrs(1000, 8); m12 = mgrs(1000, 12)
    o = dict(front=1000, span8=8, span12=12, mgrCost=140000)
    o['mgr8'] = sum(m8); o['layers8'] = len(m8); o['mgr12'] = sum(m12); o['layers12'] = len(m12); o['mgrCut'] = sum(m8) - sum(m12)
    o['l8a'], o['l8b'], o['l8c'] = m8[0], m8[1], m8[2]; o['l12a'], o['l12b'] = m12[0], m12[1]
    o['costCut'] = o['mgrCut'] * 140000
    o['mgrFlat'] = 1000 // 8 + 1000 // 64 + 1000 // 512; o['costCutWrong'] = (125 - 84) * 140000; o['costCutAll'] = 92 * 140000
    put('c6', o)

    o = dict(vol=100000, oldP=50, newP=46, mktP=53, spend=240, sum=180, savings=12, cost=2, realRate=0.6)
    o['hard'] = 400000; o['avoid'] = 700000; o['avoidOnly'] = 300000; o['mktRise'] = 53 / 50 - 1
    o['sumPct'] = 180 / 240; o['roi'] = 6.0; o['realized'] = 12 * 0.6
    o['unrealized'] = 12 - 12 * 0.6; o['sumWrong'] = 240 / 180; o['unmanaged'] = 1 - 180 / 240; o['hardWrong'] = 1100000
    put('cp1', o)

    o = dict(lines=2000, onTime=1720, inFull=1800, both=1640, mCap=150, mMat=120, mPlan=60, mCarrier=30, target=0.95, l2Load=1150, l2Cap=1000)
    o['otif'] = 1640 / 2000; o['ot'] = 0.86; o['inf'] = 0.90; o['otifWrong'] = 0.86 * 0.90
    o['miss'] = 360; o['mSum'] = 360; o['top2'] = 270 / 360; o['capShare'] = 150 / 360
    o['fixTop2'] = (1640 + 270) / 2000; o['fixAll'] = 1; o['l2Util'] = 1.15; o['l2Over'] = 150
    put('tp1', o)

    o = dict(units=25000, defBase=0.048, defTarget=0.020, defAfter=0.019, costDef=60, cTemp=0.45, cOper=0.25, cMat=0.20, cOther=0.10)
    o['costBase'] = 25000 * 0.048 * 60; o['costAfter'] = 25000 * 0.019 * 60; o['saveMo'] = o['costBase'] - o['costAfter']; o['saveYr'] = o['saveMo'] * 12
    o['defects'] = 25000 * 0.048; o['nTemp'] = o['defects'] * 0.45; o['nOper'] = o['defects'] * 0.25
    o['drop'] = 0.048 - 0.019; o['dropPct'] = o['drop'] / 0.048
    o['top2Share'] = 0.70
    put('tp2', o)

    o = dict(d1=12000, d2=13000, d3=14000, cap=11200, invOver=0, price=120, cmU=40, otMo=1000, otCost=8, prebuild=1500, carryU=3)
    o['demand'] = 39000; o['supply'] = 33600; o['gap'] = 5400; o['revRisk'] = 5400 * 120; o['cmRisk'] = 5400 * 40
    o['otUnits'] = 3000; o['otCm'] = 3000 * 32; o['prebuildCost'] = 4500; o['left'] = 5400 - 3000 - 1500; o['leftRev'] = o['left'] * 120
    o['prebuildCm'] = 1500 * 37; o['gapNoQ3'] = 25000 - 22400; o['otSpend'] = 24000; o['promo'] = 2000; o['spareAfterPromo'] = 2000 - 900
    put('tp3', o)

    o = dict(rev=40, gm0=0.30, gm1=0.28, bPrice=-0.004, bMix=-0.006, bMat=-0.012, bOps=0.002)
    o['drop'] = 0.30 - 0.28; o['bSum'] = -0.004 - 0.006 - 0.012 + 0.002; o['gpLost'] = 40 * o['drop']; o['opsShare'] = 0.002
    o.update(bPricePt=-0.4, bMixPt=-0.6, bMatPt=-1.2, bOpsPt=0.2, recoverMin=0.5, dropPt=2.0)
    put('rp2', o)
    return out
