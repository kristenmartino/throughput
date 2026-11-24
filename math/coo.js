// Numbers for the COO lane, the Chief Procurement Officer deck and the Phase 4 Craft packets and role-play (Nov 24).
// Twin: math/coo.py. math/check.js compares every value. Figures describe fictional companies.
'use strict';
const sum = a => a.reduce((x, y) => x + y, 0);
function computeCoo() {
  const S = {};
  { // coo1: operating cadence — variance review and OEE
    const o = {};
    o.bUnits = 50000; o.price = 200; o.bCost = 130; o.aUnits = 47000; o.aCost = 134;
    o.bRev = o.bUnits * o.price; o.aRev = o.aUnits * o.price; o.revVar = o.aRev - o.bRev; o.revVarPct = o.revVar / o.bRev;
    o.bMarginU = o.price - o.bCost; o.aMarginU = o.price - o.aCost;
    o.bMargin = o.bUnits * o.bMarginU; o.aMargin = o.aUnits * o.aMarginU; o.marginVar = o.aMargin - o.bMargin;
    o.volEffect = (o.aUnits - o.bUnits) * o.bMarginU; o.costEffect = -(o.aCost - o.bCost) * o.aUnits;
    o.flexCost = o.bCost * o.aUnits; o.actCost = o.aCost * o.aUnits; o.spendVar = o.actCost - o.flexCost; o.staticCostVar = o.actCost - o.bCost * o.bUnits;
    o.revShort = -o.revVar; o.marginShort = -o.marginVar; o.unitShort = o.bUnits - o.aUnits; o.costUp = o.aCost - o.bCost;
    o.volLoss = -o.volEffect; o.costLoss = -o.costEffect; o.staticUnder = -o.staticCostVar;
    o.avail = 0.90; o.perf = 0.95; o.qual = 0.98; o.oee = o.avail * o.perf * o.qual; o.oeeAvg = (o.avail + o.perf + o.qual) / 3;
    o.perf2 = 0.99; o.oee2 = o.avail * o.perf2 * o.qual; o.oeeUp = o.oee2 - o.oee;
    S.c1 = o;
  }
  { // coo2: operations finance — unit cost, contribution, PVM bridge, cash, payback
    const o = {};
    o.fixed = 1200000; o.var = 45; o.vLo = 40000; o.vHi = 60000; o.ucLo = o.fixed / o.vLo + o.var; o.ucHi = o.fixed / o.vHi + o.var; o.ucDrop = o.ucLo - o.ucHi;
    o.p0 = 100; o.cm = o.p0 - o.var; o.cmRatio = o.cm / o.p0; o.be = o.fixed / o.cm; o.beU = Math.ceil(o.be); o.beWrong = o.fixed / o.p0;
    o.v0 = 40000; o.v1 = 43000; o.p1 = 98; o.c0 = 45; o.c1 = 47;
    o.cm0 = (o.p0 - o.c0) * o.v0; o.cm1 = (o.p1 - o.c1) * o.v1; o.cmChange = o.cm1 - o.cm0;
    o.volFx = (o.v1 - o.v0) * (o.p0 - o.c0); o.priceFx = (o.p1 - o.p0) * o.v1; o.costFx = -(o.c1 - o.c0) * o.v1;
    o.dio = 50; o.dso = 40; o.dpo = 35; o.ccc = o.dio + o.dso - o.dpo; o.cogsDay = 50000; o.dioCut = 10; o.cashFreed = o.dioCut * o.cogsDay;
    o.cmDrop = -o.cmChange; o.vUp = o.v1 - o.v0; o.pDown = o.p0 - o.p1; o.cUp = o.c1 - o.c0; o.priceLoss = -o.priceFx; o.costLoss = -o.costFx;
    o.p1Low = 60; o.rushCm = o.p1Low - o.var; o.priceLossOld = o.pDown * o.v0; o.cccWrong = o.dio + o.dso + o.dpo; o.opCycle = o.dio + o.dso;
    o.capex = 600000; o.saveYr = 150000; o.payback = o.capex / o.saveYr; o.paybackWrong = o.saveYr / o.capex; o.paybackDbl = 2 * o.capex / o.saveYr;
    S.c2 = o;
  }
  { // coo3: executive S&OP — three-month gap and closing options
    const o = {};
    o.dMo = 12000; o.capMo = 10500; o.months = 3; o.invOver = 1000; o.price = 150;
    o.demand = o.dMo * o.months; o.supply = o.capMo * o.months + o.invOver; o.gap = o.demand - o.supply; o.revRisk = o.gap * o.price;
    o.otMo = 800; o.otCost = 6; o.otUnits = o.otMo * o.months; o.otSpend = o.otUnits * o.otCost; o.gapAfterOt = o.gap - o.otUnits;
    o.cmU = 50; o.otCmNet = o.otUnits * (o.cmU - o.otCost); o.gapWrong = (o.dMo - o.capMo) * o.months;
    o.gapMo = o.dMo - o.capMo; o.otCmGross = o.otUnits * o.cmU; o.revOt = o.otUnits * o.price;
    o.copCost = 14; o.copNet = o.gapAfterOt * (o.cmU - o.copCost);
    S.c3 = o;
  }
  { // coo4: make vs. buy at the executive level — offshore vs. nearshore landed cost
    const o = {};
    o.carry = 0.25;
    o.offUnit = 20; o.offFreight = 2.5; o.offDutyRate = 0.05; o.offDuty = o.offUnit * o.offDutyRate; o.offDays = 40;
    o.offBase = o.offUnit + o.offFreight + o.offDuty; o.offPipe = o.offBase * o.carry * o.offDays / 365; o.offTotal = o.offBase + o.offPipe;
    o.nearUnit = 22.5; o.nearFreight = 0.8; o.nearDays = 7;
    o.nearBase = o.nearUnit + o.nearFreight; o.nearPipe = o.nearBase * o.carry * o.nearDays / 365; o.nearTotal = o.nearBase + o.nearPipe;
    o.gapU = o.offTotal - o.nearTotal; o.vol = 200000; o.gapYr = o.gapU * o.vol; o.priceGap = o.nearUnit - o.offUnit;
    o.offNoPipe = o.offBase; o.offNoDuty = o.offTotal - o.offDuty; o.priceGapYr = o.priceGap * o.vol;
    S.c4 = o;
  }
  { // coo5: operations strategy — process crossover and capacity utilization
    const o = {};
    o.fA = 200000; o.vA = 30; o.fB = 500000; o.vB = 18; o.cross = (o.fB - o.fA) / (o.vA - o.vB); o.crossWrong = o.fB / o.vA;
    o.qPlan = 40000; o.costA = o.fA + o.vA * o.qPlan; o.costB = o.fB + o.vB * o.qPlan; o.saveB = o.costA - o.costB;
    o.dem = 11000; o.cap = 13000; o.util = o.dem / o.cap; o.cushion = 1 - o.util; o.crossB = o.fB / o.vB; o.fixedGap = o.fB - o.fA; o.cushionWrong = (o.cap - o.dem) / o.dem; o.gapUnits = o.cap - o.dem;
    S.c5 = o;
  }
  { // coo6: organizing operations — spans and layers
    const o = {};
    const mgrs = (front, span) => { const out = []; let n = front; while (n > 1) { n = Math.ceil(n / span); out.push(n); } return out; };
    o.front = 1000; o.span8 = 8; o.span12 = 12;
    const m8 = mgrs(o.front, 8), m12 = mgrs(o.front, 12);
    o.mgr8 = sum(m8); o.layers8 = m8.length; o.mgr12 = sum(m12); o.layers12 = m12.length; o.mgrCut = o.mgr8 - o.mgr12;
    o.l8a = m8[0]; o.l8b = m8[1]; o.l8c = m8[2]; o.l12a = m12[0]; o.l12b = m12[1];
    o.mgrCost = 140000; o.costCut = o.mgrCut * o.mgrCost;
    { let n = o.front, t = 0; while ((n = Math.floor(n / 8)) >= 1) t += n; o.mgrFlat = t; }
    o.costCutWrong = (o.l8a - o.l12a) * o.mgrCost; o.costCutAll = o.mgr12 * o.mgrCost;
    S.c6 = o;
  }
  { // cpo1: procurement savings accounting and coverage
    const o = {};
    o.vol = 100000; o.oldP = 50; o.newP = 46; o.mktP = 53;
    o.hard = (o.oldP - o.newP) * o.vol; o.avoid = (o.mktP - o.newP) * o.vol; o.avoidOnly = o.avoid - o.hard; o.mktRise = o.mktP / o.oldP - 1;
    o.spend = 240; o.sum = 180; o.sumPct = o.sum / o.spend;
    o.savings = 12; o.cost = 2; o.roi = o.savings / o.cost;
    o.realRate = 0.6; o.realized = o.savings * o.realRate; o.unrealized = o.savings - o.realized; o.sumWrong = o.spend / o.sum; o.unmanaged = 1 - o.sumPct; o.hardWrong = o.hard + o.avoid;
    S.cp1 = o;
  }
  { // TP-1: OTIF turnaround data pack
    const o = {};
    o.lines = 2000; o.onTime = 1720; o.inFull = 1800; o.both = 1640;
    o.otif = o.both / o.lines; o.ot = o.onTime / o.lines; o.inf = o.inFull / o.lines; o.otifWrong = o.ot * o.inf;
    o.miss = o.lines - o.both; o.mCap = 150; o.mMat = 120; o.mPlan = 60; o.mCarrier = 30;
    o.mSum = o.mCap + o.mMat + o.mPlan + o.mCarrier; o.top2 = (o.mCap + o.mMat) / o.miss; o.capShare = o.mCap / o.miss;
    o.target = 0.95; o.fixTop2 = (o.both + o.mCap + o.mMat) / o.lines; o.fixAll = 1;
    o.l2Load = 1150; o.l2Cap = 1000; o.l2Util = o.l2Load / o.l2Cap; o.l2Over = o.l2Load - o.l2Cap;
    S.tp1 = o;
  }
  { // TP-2: DMAIC project data
    const o = {};
    o.units = 25000; o.defBase = 0.048; o.defTarget = 0.020; o.defAfter = 0.019; o.costDef = 60;
    o.costBase = o.units * o.defBase * o.costDef; o.costAfter = o.units * o.defAfter * o.costDef; o.saveMo = o.costBase - o.costAfter; o.saveYr = o.saveMo * 12;
    o.defects = o.units * o.defBase; o.cTemp = 0.45; o.cOper = 0.25; o.cMat = 0.20; o.cOther = 0.10;
    o.nTemp = o.defects * o.cTemp; o.nOper = o.defects * o.cOper;
    o.drop = o.defBase - o.defAfter; o.dropPct = o.drop / o.defBase; o.top2Share = o.cTemp + o.cOper;
    S.tp2 = o;
  }
  { // TP-3: S&OP meeting data
    const o = {};
    o.d1 = 12000; o.d2 = 13000; o.d3 = 14000; o.cap = 11200; o.invOver = 0; o.price = 120; o.cmU = 40;
    o.demand = o.d1 + o.d2 + o.d3; o.supply = o.cap * 3; o.gap = o.demand - o.supply; o.revRisk = o.gap * o.price; o.cmRisk = o.gap * o.cmU;
    o.otMo = 1000; o.otCost = 8; o.otUnits = o.otMo * 3; o.otCm = o.otUnits * (o.cmU - o.otCost);
    o.prebuild = 1500; o.carryU = 3; o.prebuildCost = o.prebuild * o.carryU; o.left = o.gap - o.otUnits - o.prebuild;
    o.leftRev = o.left * o.price; o.prebuildCm = o.prebuild * (o.cmU - o.carryU); o.gapNoQ3 = o.d1 + o.d2 - 2 * o.cap; o.otSpend = o.otUnits * o.otCost; o.promo = 2000; o.spareAfterPromo = o.promo - o.left;
    S.tp3 = o;
  }
  { // TPL-2: gross margin bridge for the CEO review
    const o = {};
    o.rev = 40; o.gm0 = 0.30; o.gm1 = 0.28; o.drop = o.gm0 - o.gm1;
    o.bPrice = -0.004; o.bMix = -0.006; o.bMat = -0.012; o.bOps = 0.002;
    o.bSum = o.bPrice + o.bMix + o.bMat + o.bOps; o.gpLost = o.rev * o.drop; o.opsShare = o.bOps;
    o.bPricePt = o.bPrice * 100; o.bMixPt = o.bMix * 100; o.bMatPt = o.bMat * 100; o.bOpsPt = o.bOps * 100; o.recoverMin = 0.5; o.dropPt = o.drop * 100;
    S.rp2 = o;
  }
  return S;
}
module.exports = { computeCoo };
