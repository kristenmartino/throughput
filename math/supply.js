// Supply chain deck numbers (Phase 3). Every number a CSCP lesson or question prints comes from here, through
// {{sc4.key}}-style placeholders, and math/supply.py computes the same values a second way (checked every build).
'use strict';
function computeSupply() {
  const S = {};
  const sum = a => a.reduce((x, y) => x + y, 0);
  // ---- sc4: internal operations and inventory
  {
    const o = {};
    // MRP, lot-for-lot, lead time 2 weeks, no safety stock (sc4-2)
    const gross = [0, 40, 0, 60, 30, 50], sched = [0, 20, 0, 0, 0, 0], L = 2;
    let pab = 50; const net = [], por = [], pabs = [];
    o.onHand = 50; o.lt = L; o.sr = 20;
    gross.forEach((g, i) => { o['gr' + (i + 1)] = g; });
    for (let i = 0; i < 6; i++) { const avail = pab + sched[i]; const n = Math.max(0, g(i) - avail); net.push(n); por.push(n); pab = avail + n - g(i); pabs.push(pab); }
    function g(i) { return gross[i]; }
    net.forEach((n, i) => { o['net' + (i + 1)] = n; o['pab' + (i + 1)] = pabs[i]; });
    const rel = por.map((x, i) => por[i + L] || 0);
    rel.forEach((r, i) => { o['rel' + (i + 1)] = r; });
    o.netTotal = sum(net); o.firstNetWeek = net.findIndex(x => x > 0) + 1; o.firstRelWeek = rel.findIndex(x => x > 0) + 1;
    o.netNoSr = Math.max(0, gross[0] + gross[1] + gross[2] + gross[3] - o.onHand);   // what you get if the scheduled receipt is forgotten (weeks 1-4)
    o.netW4NoSr = o.netNoSr; o.netW4 = net[3];
    // Capacity (sc4-3): rated capacity = available time × utilization × efficiency
    o.machines = 2; o.hours = 40; o.avail = 80; o.util = 0.85; o.eff = 0.95; o.rated = 80 * 0.85 * 0.95; o.load = 70; o.over = o.load - o.rated;
    o.ratedNoEff = 80 * 0.85; o.ratedUtilOnly = 80 * 0.95;
    // EOQ (sc4-5)
    o.D = 12000; o.S = 60; o.c = 25; o.i = 0.20; o.H = 0.20 * 25; o.eoq = Math.sqrt(2 * 12000 * 60 / o.H); o.eoqUp = Math.ceil(o.eoq);
    o.ordersYr = o.D / o.eoq; o.ordCost = o.D / o.eoq * o.S; o.holdCost = o.eoq / 2 * o.H; o.tc = o.ordCost + o.holdCost;
    o.eoqWrongC = Math.sqrt(2 * 12000 * 60 / 25); o.eoqNo2 = Math.sqrt(12000 * 60 / o.H);
    o.tc2x = (o.D / (2 * o.eoq)) * o.S + (2 * o.eoq) / 2 * o.H; o.tc2xRatio = o.tc2x / o.tc; o.tc2xRise = o.tc2xRatio - 1;
    o.eoqD4 = Math.sqrt(2 * 4 * 12000 * 60 / o.H); o.eoqD4Ratio = o.eoqD4 / o.eoq;
    // Safety stock and reorder point (sc4-6): daily demand 40, sd 8, lead time 9 days
    o.d = 40; o.sd = 8; o.L = 9; o.z95 = 1.645; o.z99 = 2.326; o.ltd = 40 * 9;
    o.ss95 = 1.645 * 8 * Math.sqrt(9); o.rop95 = o.ltd + o.ss95; o.ss99 = 2.326 * 8 * 3; o.rop99 = o.ltd + o.ss99;
    o.ssNoRoot = 1.645 * 8 * 9; o.ssL36 = 1.645 * 8 * 6; o.sdL = 2; o.sdLtd = Math.sqrt(9 * 64 + 1600 * 4); o.ssVarL = 1.645 * o.sdLtd;
    // ABC (sc4-7): ten items, annual usage value in $000
    const abc = [420, 260, 90, 60, 50, 40, 30, 25, 15, 10], tot = sum(abc);
    o.abcTotal = tot; o.abcTop2 = (abc[0] + abc[1]) / tot; o.abcTop2Pct = o.abcTop2; o.abcItems = abc.length; o.abcTop2Items = 2 / abc.length;
    o.abcC5 = (abc[5] + abc[6] + abc[7] + abc[8] + abc[9]) / tot;
    o.counted = 200; o.withinTol = 188; o.ira = 188 / 200;
    // Inventory turns and days of supply (sc4-8)
    o.cogs = 4800000; o.avgInv = 800000; o.turns = 4800000 / 800000; o.days = 365 / o.turns; o.turnsWrongRev = 6000000 / 800000;
    o.wkCogs = 4800000 / 52; o.wos = 800000 / o.wkCogs;
    S.sc4 = o;
  }
  // ---- sc1: demand and forecasting
  {
    const o = {}, dm = [120, 132, 125, 140, 138, 150];
    dm.forEach((x, i) => { o['m' + (i + 1)] = x; });
    o.ma3 = (dm[3] + dm[4] + dm[5]) / 3; o.ma6 = sum(dm) / 6; o.wma = 0.5 * dm[5] + 0.3 * dm[4] + 0.2 * dm[3]; o.wmaRev = 0.2 * dm[5] + 0.3 * dm[4] + 0.5 * dm[3];
    o.f6 = 135; o.alpha = 0.3; o.es7 = o.f6 + 0.3 * (dm[5] - o.f6); o.esWrong = dm[5] + 0.3 * (o.f6 - dm[5]); o.es7a8 = o.f6 + 0.8 * (dm[5] - o.f6);
    const A = [100, 110, 95, 120], F = [105, 100, 100, 110], e = A.map((x, i) => x - F[i]);
    A.forEach((x, i) => { o['a' + (i + 1)] = x; o['f' + (i + 1)] = F[i]; o['e' + (i + 1)] = e[i]; });
    o.sumE = sum(e); o.mad = sum(e.map(Math.abs)) / 4; o.bias = o.sumE / 4; o.ts = o.sumE / o.mad;
    o.mape = sum(e.map((x, i) => Math.abs(x) / A[i])) / 4; o.madSigned = Math.abs(o.sumE) / 4;
    o.mse = sum(e.map(x => x * x)) / 4;
    // seasonal index: quarterly averages over three years
    const qAvg = [80, 95, 105, 120], over = sum(qAvg) / 4; o.q4avg = qAvg[3]; o.qOver = over; o.si4 = qAvg[3] / over; o.si1 = qAvg[0] / over;
    o.annual = 480; o.q4fc = o.annual / 4 * o.si4; o.q4fcFlat = o.annual / 4; o.q4fcWrong = o.annual * o.si4; o.q4fcQ1 = o.annual / 4 * o.si1;
    S.sc1 = o;
  }
  // ---- sc5: logistics
  {
    const o = {};
    o.shipLb = 5000; o.nShip = 4; o.ltlRate = 18; o.ftl = 1800;   // LTL $ per hundredweight (cwt = 100 lb)
    o.ltlEach = o.shipLb / 100 * o.ltlRate; o.ltlAll = o.nShip * o.ltlEach; o.consSave = o.ltlAll - o.ftl; o.breakLb = o.ftl / o.ltlRate * 100;
    o.ltlWrongLb = o.nShip * o.shipLb * o.ltlRate;   // forgetting cwt
    o.unitVal = 200; o.carry = 0.25; o.daysSaved = 10; o.airPrem = 5;
    o.holdDay = o.unitVal * o.carry / 365; o.pipeSave = o.holdDay * o.daysSaved; o.airNet = o.airPrem - o.pipeSave;
    o.pipeWrongYr = o.unitVal * o.carry * o.daysSaved;   // forgetting to divide by 365
    o.dcUnits = 1200; o.dcDays = 14; o.pipeUnits = 300 * 14;   // pipeline stock = daily flow × transit days
    o.flow = 300; o.transit = 14; o.pipe = o.flow * o.transit; o.transitAir = 3; o.pipeAir = o.flow * o.transitAir; o.pipeCut = o.pipe - o.pipeAir;
    S.sc5 = o;
  }
  // ---- sc2: networks and metrics
  {
    const o = {}, pts = [[10, 20, 400], [40, 10, 300], [30, 40, 300]], V = sum(pts.map(p => p[2]));
    pts.forEach((p, i) => { o['x' + (i + 1)] = p[0]; o['y' + (i + 1)] = p[1]; o['v' + (i + 1)] = p[2]; });
    o.vTot = V; o.cgX = sum(pts.map(p => p[0] * p[2])) / V; o.cgY = sum(pts.map(p => p[1] * p[2])) / V;
    o.avgX = sum(pts.map(p => p[0])) / 3; o.avgY = sum(pts.map(p => p[1])) / 3;
    o.price = 40; o.freight = 3; o.ins = 0.40; o.dutyRate = 0.05; o.duty = 0.05 * 40; o.broker = 0.60; o.inland = 1.00;
    o.landed = o.price + o.freight + o.ins + o.duty + o.broker + o.inland; o.landedNoDuty = o.landed - o.duty; o.cif = o.price + o.freight + o.ins; o.domestic = 45;
    o.offPrem = o.landed / o.domestic - 1; o.priceGap = 1 - o.price / o.domestic;
    o.dio = 60; o.dso = 45; o.dpo = 50; o.c2c = o.dio + o.dso - o.dpo; o.c2cWrong = o.dio + o.dso + o.dpo; o.c2cDpo65 = o.dio + o.dso - 65;
    S.sc2 = o;
  }
  // ---- sc3: sourcing
  {
    const o = {};
    o.fixed = 60000; o.vMake = 12; o.pBuy = 18; o.be = o.fixed / (o.pBuy - o.vMake); o.beWrong = o.fixed / o.pBuy;
    o.qLo = 8000; o.makeLo = o.fixed + o.vMake * o.qLo; o.buyLo = o.pBuy * o.qLo; o.saveLo = o.makeLo - o.buyLo;
    o.qHi = 15000; o.makeHi = o.fixed + o.vMake * o.qHi; o.buyHi = o.pBuy * o.qHi; o.saveHi = o.buyHi - o.makeHi;
    const w = [0.40, 0.30, 0.20, 0.10], sc = { A: [4, 3, 5, 3], B: [3, 5, 4, 4], C: [5, 3, 3, 5] };
    ['wQ', 'wP', 'wD', 'wS'].forEach((k, i) => { o[k] = w[i]; });
    for (const k of ['A', 'B', 'C']) { sc[k].forEach((v, i) => { o['s' + k + i] = v; }); o['ws' + k] = sum(sc[k].map((v, i) => v * w[i])); o['avg' + k] = sum(sc[k]) / 4; }
    o.xPrice = 50; o.xFreight = 2; o.xDef = 0.04; o.yPrice = 46; o.yFreight = 4.5; o.yDef = 0.08; o.defCost = 25; o.yExp = 1.5; o.vol = 20000;
    o.xDefU = o.xDef * o.defCost; o.yDefU = o.yDef * o.defCost;
    o.xTco = o.xPrice + o.xFreight + o.xDefU; o.yTco = o.yPrice + o.yFreight + o.yDefU + o.yExp;
    o.tcoGapU = o.yTco - o.xTco; o.tcoGapYr = o.tcoGapU * o.vol; o.priceGapYr = (o.xPrice - o.yPrice) * o.vol; o.priceGapPct = (o.xPrice - o.yPrice) / o.xPrice;
    o.yNoDef = o.yPrice + o.yFreight + o.yExp;   // forgets defects
    o.tgtCost = 100000; o.tgtFee = 10000; o.shareBuyer = 0.8; o.shareSeller = 0.2; o.actCost = 90000;
    o.underrun = o.tgtCost - o.actCost; o.sellerGain = o.shareSeller * o.underrun; o.fee = o.tgtFee + o.sellerGain; o.priceInc = o.actCost + o.fee;
    o.feeWrong = o.tgtFee + o.shareBuyer * o.underrun; o.buyerSave = o.tgtCost + o.tgtFee - o.priceInc;
    S.sc3 = o;
  }
  // ---- sc7: risk
  {
    const o = {};
    o.pFire = 0.05; o.iFire = 2000000; o.pStrike = 0.20; o.iStrike = 300000; o.pRecall = 0.02; o.iRecall = 4000000;
    o.eFire = o.pFire * o.iFire; o.eStrike = o.pStrike * o.iStrike; o.eRecall = o.pRecall * o.iRecall;
    o.eTotal = o.eFire + o.eStrike + o.eRecall;
    o.dualCost = 40000; o.dualCut = 0.75; o.eFireAfter = o.pFire * o.iFire * (1 - o.dualCut); o.dualSave = o.eFire - o.eFireAfter; o.dualNet = o.dualSave - o.dualCost;
    o.ttr = 6; o.tts = 4; o.ttGap = o.ttr - o.tts; o.weekRev = 500000; o.revRisk = o.ttGap * o.weekRev; o.revRiskWrong = o.ttr * o.weekRev;
    S.sc7 = o;
  }
  return S;
}
module.exports = { computeSupply };
