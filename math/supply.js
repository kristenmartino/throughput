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
  // ---- sc6: relationships
  {
    const o = {};
    o.gm = 0.30; o.costOrder = 80; o.costDel = 150;
    o.pRev = 500000; o.pOrd = 400; o.pDel = 200; o.pRet = 10000;
    o.qRev = 800000; o.qOrd = 1500; o.qDel = 600; o.qRet = 40000;
    for (const c of ['p', 'q']) {
      o[c + 'Gm'] = o[c + 'Rev'] * o.gm; o[c + 'Cts'] = o[c + 'Ord'] * o.costOrder + o[c + 'Del'] * o.costDel + o[c + 'Ret'];
      o[c + 'Prof'] = o[c + 'Gm'] - o[c + 'Cts']; o[c + 'Margin'] = o[c + 'Prof'] / o[c + 'Rev'];
    }
    o.otd = 0.95; o.complete = 0.97; o.undamaged = 0.99; o.docs = 0.98;
    o.perfect = o.otd * o.complete * o.undamaged * o.docs; o.perfectAvg = (o.otd + o.complete + o.undamaged + o.docs) / 4; o.perfectMin = Math.min(o.otd, o.complete, o.undamaged, o.docs);
    o.wQual = 0.40; o.wDel = 0.35; o.wCost = 0.25; o.rQual = 92; o.rDel = 85; o.rCost = 90;
    o.score = o.wQual * o.rQual + o.wDel * o.rDel + o.wCost * o.rCost; o.scoreAvg = (o.rQual + o.rDel + o.rCost) / 3;
    o.rDel2 = 95; o.score2 = o.wQual * o.rQual + o.wDel * o.rDel2 + o.wCost * o.rCost; o.scoreUp = o.score2 - o.score;
    o.qLoss = -o.qProf; o.gain = 200000; o.gainShare = 0.5; o.gainEach = o.gain * o.gainShare;
    S.sc6 = o;
  }
  // ---- sc8: postponement pooling
  {
    const o = {};
    o.nVar = 4; o.sdVar = 100; o.z = 1.645;
    o.ssSep = o.nVar * o.z * o.sdVar; o.sdPool = o.sdVar * Math.sqrt(o.nVar); o.ssPool = o.z * o.sdPool; o.ssCut = o.ssSep - o.ssPool; o.ssCutPct = o.ssCut / o.ssSep;
    o.sdPoolWrong = o.sdVar * o.nVar;
    o.nVar9 = 9; o.ssSep9 = o.nVar9 * o.z * o.sdVar; o.ssPool9 = o.z * o.sdVar * Math.sqrt(o.nVar9); o.ssCutPct9 = 1 - o.ssPool9 / o.ssSep9;
    S.sc8 = o;
  }
  // ---- mc: numbers for the CSCP held-out mock pool (Phase 3b); different inputs from the decks.
  {
    const o = {};
    // sc1 forecasting
    o.d1 = 210; o.d2 = 190; o.d3 = 230; o.d4 = 250; o.ma3 = (o.d2 + o.d3 + o.d4) / 3; o.ma4 = (o.d1 + o.d2 + o.d3 + o.d4) / 4;
    o.wma = 0.5 * o.d4 + 0.3 * o.d3 + 0.2 * o.d2; o.wmaRev = 0.2 * o.d4 + 0.3 * o.d3 + 0.5 * o.d2;
    o.esF = 220; o.esA = 250; o.esAl = 0.2; o.es = o.esF + o.esAl * (o.esA - o.esF); o.esWrong = o.esA + o.esAl * (o.esF - o.esA); o.esAl8 = o.esF + 0.8 * (o.esA - o.esF);
    const A = [200, 196, 206, 210], F = [192, 200, 200, 200], e = A.map((x, i) => x - F[i]);
    A.forEach((x, i) => { o['a' + (i + 1)] = x; o['f' + (i + 1)] = F[i]; o['e' + (i + 1)] = e[i]; });
    o.sumE = sum(e); o.mad = sum(e.map(Math.abs)) / 4; o.bias = o.sumE / 4; o.ts = o.sumE / o.mad; o.mape = sum(e.map((x, i) => Math.abs(x) / A[i])) / 4;
    o.mse = sum(e.map(x => x * x)) / 4;
    o.qAvg = 500; o.q3Avg = 600; o.si3 = o.q3Avg / o.qAvg; o.annual = 2400; o.q3fc = o.annual / 4 * o.si3; o.q3fcWrong = o.annual * o.si3;
    // sc2 networks
    const pts = [[20, 10, 200], [50, 40, 600], [10, 50, 200]], V = sum(pts.map(x => x[2]));
    pts.forEach((x, i) => { o['x' + (i + 1)] = x[0]; o['y' + (i + 1)] = x[1]; o['v' + (i + 1)] = x[2]; });
    o.cgX = sum(pts.map(x => x[0] * x[2])) / V; o.cgY = sum(pts.map(x => x[1] * x[2])) / V; o.avgX = sum(pts.map(x => x[0])) / 3; o.avgY = sum(pts.map(x => x[1])) / 3;
    o.price = 80; o.freight = 6; o.dutyRate = 0.10; o.duty = o.dutyRate * o.price; o.ins = 1.2; o.broker = 0.8; o.inland = 2;
    o.landed = o.price + o.freight + o.duty + o.ins + o.broker + o.inland; o.landedNoDuty = o.landed - o.duty;
    o.dio = 45; o.dso = 30; o.dpo = 40; o.c2c = o.dio + o.dso - o.dpo; o.c2cWrong = o.dio + o.dso + o.dpo;
    // sc3 sourcing
    o.fixed = 90000; o.vMake = 15; o.pBuy = 24; o.be = o.fixed / (o.pBuy - o.vMake); o.beWrong = o.fixed / o.pBuy;
    o.q = 12000; o.makeQ = o.fixed + o.vMake * o.q; o.buyQ = o.pBuy * o.q; o.saveQ = o.buyQ - o.makeQ;
    o.wQ = 0.5; o.wC = 0.3; o.wD = 0.2; o.sA = o.wQ * 5 + o.wC * 3 + o.wD * 4; o.sB = o.wQ * 4 + o.wC * 5 + o.wD * 3; o.avgA = 4; o.avgB = 4;
    o.tPrice = 30; o.tFreight = 3; o.tDef = 0.05; o.tDefCost = 40; o.tDefU = o.tDef * o.tDefCost; o.tco = o.tPrice + o.tFreight + o.tDefU;
    o.tgtCost = 200000; o.tgtFee = 20000; o.shB = 0.7; o.shS = 0.3; o.act = 220000; o.over = o.act - o.tgtCost; o.feeAdj = o.shS * o.over;
    o.fee = o.tgtFee - o.feeAdj; o.priceInc = o.act + o.fee; o.feeWrong = o.tgtFee - o.shB * o.over;
    // sc4 operations and inventory
    o.gr3 = 80; o.oh = 30; o.sr2 = 20; o.net3 = o.gr3 - o.oh - o.sr2; o.netNoSr = o.gr3 - o.oh;
    o.D = 12000; o.S = 50; o.H = 3; o.eoq = Math.sqrt(2 * o.D * o.S / o.H); o.eoqNo2 = Math.sqrt(o.D * o.S / o.H); o.ordersYr = o.D / o.eoq;
    o.dd = 50; o.sdd = 10; o.L = 16; o.z = 1.645; o.sdL = o.sdd * Math.sqrt(o.L); o.ss = o.z * o.sdL; o.rop = o.dd * o.L + o.ss; o.ssNoRoot = o.z * o.sdd * o.L;
    const abc = [500, 250, 90, 60, 40, 25, 15, 10, 6, 4], at = sum(abc);
    o.abcTot = at; o.abcTop2 = (abc[0] + abc[1]) / at; o.abcBot5 = (abc[5] + abc[6] + abc[7] + abc[8] + abc[9]) / at;
    o.cogs = 3600000; o.avgInv = 600000; o.turns = o.cogs / o.avgInv; o.days = 365 / o.turns;
    o.hrs = 2 * 8 * 5; o.util = 0.9; o.eff = 0.95; o.rated = o.hrs * o.util * o.eff; o.ratedUtil = o.hrs * o.util;
    o.kd = 400; o.kL = 0.5; o.kSafety = 0.1; o.kC = 50; o.kRaw = o.kd * o.kL * (1 + o.kSafety) / o.kC; o.kanbans = Math.ceil(o.kRaw); o.kNoSafety = o.kd * o.kL / o.kC;
    o.ccOk = 47; o.ccN = 50; o.ira = o.ccOk / o.ccN;
    // sc5 logistics
    o.ltlRate = 15; o.shipLb = 6000; o.nShip = 3; o.ltlAll = o.nShip * o.shipLb / 100 * o.ltlRate; o.ftl = 2000; o.consSave = o.ltlAll - o.ftl; o.breakLb = o.ftl / o.ltlRate * 100;
    o.flow = 200; o.transit = 20; o.pipe = o.flow * o.transit; o.uVal = 150; o.carry = 0.20; o.daySave = 15; o.pipeSave = o.uVal * o.carry / 365 * o.daySave; o.pipeSaveWrong = o.uVal * o.carry * o.daySave;
    // sc6 relationships
    o.cRev = 300000; o.cGm = 0.25; o.cGmD = o.cRev * o.cGm; o.cOrd = 600; o.cOrdCost = 60; o.cDel = 300; o.cDelCost = 90; o.cRet = 15000;
    o.cCts = o.cOrd * o.cOrdCost + o.cDel * o.cDelCost + o.cRet; o.cLoss = o.cCts - o.cGmD;
    o.po1 = 0.96; o.po2 = 0.98; o.po3 = 0.99; o.po4 = 0.97; o.perfect = o.po1 * o.po2 * o.po3 * o.po4; o.perfectAvg = (o.po1 + o.po2 + o.po3 + o.po4) / 4;
    o.scW1 = 0.5; o.scW2 = 0.3; o.scW3 = 0.2; o.scR1 = 90; o.scR2 = 80; o.scR3 = 95; o.score = o.scW1 * o.scR1 + o.scW2 * o.scR2 + o.scW3 * o.scR3; o.scoreAvg = (o.scR1 + o.scR2 + o.scR3) / 3;
    o.gain = 150000; o.gBuyer = 0.6; o.gSupp = 0.4; o.gB = o.gain * o.gBuyer; o.gS = o.gain * o.gSupp;
    // sc7 risk
    o.p1 = 0.10; o.i1 = 800000; o.el1 = o.p1 * o.i1; o.p2 = 0.02; o.i2 = 5000000; o.el2 = o.p2 * o.i2; o.mCost = 30000; o.mCut = 0.5; o.mSave = o.el2 * o.mCut; o.mNet = o.mSave - o.mCost;
    o.ttr = 5; o.tts = 3; o.wRev = 400000; o.revRisk = (o.ttr - o.tts) * o.wRev; o.revRiskWrong = o.ttr * o.wRev;
    // sc8 pooling
    o.nV = 9; o.sdV = 50; o.pz = 1.645; o.ssSep = o.nV * o.pz * o.sdV; o.sdPool = o.sdV * Math.sqrt(o.nV); o.ssPool = o.pz * o.sdPool; o.cutPct = 1 - o.ssPool / o.ssSep; o.sdPoolWrong = o.sdV * o.nV;
    S.mc = o;
  }
  return S;
}
module.exports = { computeSupply };
