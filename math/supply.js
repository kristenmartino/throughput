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
  return S;
}
module.exports = { computeSupply };
