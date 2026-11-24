// Inventory sim engine (Phase 3, approved Nov 24: claude/throughput-phase3-proposal.md). Used by the page and by
// math/check.js, which replays the same games in math/inventory.py and requires every weekly value to match.
// One SKU, 26 weeks, continuous review checked once a week: when inventory position (on hand + on order) is at or
// below the reorder point, order Q. Lost sales, no backorders. Money in integer cents, so both sides are exact.
(function (root) {
  'use strict';
  const rhu = x => Math.floor(x + 0.5);
  const lead = (R, t) => t >= R.leadChangeWeek ? R.leadAfter : R.leadBefore;
  // phase index for week t: 0 before the first review, then 1, 2, 3
  const phaseOf = (R, t) => R.reviews.filter(w => t > w).length;

  // decisions: up to four { q, rop } (one per phase). Missing a phase's decision pauses the game at that review.
  function play(data, decisions) {
    const R = data.rules, D = data.demand;
    let onHand = R.initOnHand;
    const pipe = [];   // { arrive, q }
    const h = { arrive: [], onHand: [], sold: [], lost: [], ordered: [], ip: [], hold: [], orderCost: [], lostCost: [] };
    for (let t = 1; t <= R.weeks; t++) {
      const p = phaseOf(R, t), dec = decisions[p];
      if (!dec) return { h, waiting: p, week: t - 1, rules: R };
      let arr = 0;
      for (const o of pipe) if (o.arrive === t) arr += o.q;
      onHand += arr;
      const d = D[t - 1], sold = Math.min(onHand, d), lost = d - sold;
      onHand -= sold;
      const onOrder = pipe.filter(o => o.arrive > t).reduce((a, o) => a + o.q, 0);
      const ip = onHand + onOrder;
      let q = 0;
      if (ip <= dec.rop && dec.q > 0) { q = dec.q; pipe.push({ arrive: t + lead(R, t), q }); }
      h.arrive.push(arr); h.onHand.push(onHand); h.sold.push(sold); h.lost.push(lost); h.ordered.push(q); h.ip.push(ip + q);
      h.hold.push(onHand * R.holdCents); h.orderCost.push(q > 0 ? R.orderCents : 0); h.lostCost.push(lost * R.lostCents);
    }
    return { h, waiting: -1, week: R.weeks, rules: R };
  }
  const sum = a => a.reduce((x, y) => x + y, 0);
  function stats(r, data) {
    const hold = sum(r.h.hold), order = sum(r.h.orderCost), lost = sum(r.h.lostCost);
    const dem = sum(data.demand.slice(0, r.h.sold.length)), sold = sum(r.h.sold);
    return { hold, order, lost, total: hold + order + lost, orders: r.h.ordered.filter(q => q > 0).length, fill: dem ? sold / dem : 1, lostUnits: sum(r.h.lost) };
  }
  // Textbook policy for the parameters known at each review (EOQ for Q; ROP = expected lead-time demand plus
  // z·σ·√L safety stock). Phase 2 knows the promotion (mean 1.8x in weeks 9-10); phases 3-4 know the 4-week lead time.
  function textbook(data) {
    const R = data.rules, S = R.orderCents / 100, H = R.holdCents / 100;
    const eoq = rhu(Math.sqrt(2 * R.mean * S / H));
    const rop = (mu, L) => rhu(L * mu + R.z * R.sd * Math.sqrt(L));
    return [{ q: eoq, rop: rop(R.mean, R.leadBefore) }, { q: eoq, rop: rop(R.mean * R.promoFactor, R.leadBefore) },
      { q: eoq, rop: rop(R.mean, R.leadAfter) }, { q: eoq, rop: rop(R.mean, R.leadAfter) }];
  }
  // Best single policy with hindsight: one (Q, ROP) for all 26 weeks, Q 50..800 and ROP 0..900 in steps of 10.
  // Ties go to the smaller Q, then the smaller ROP.
  function hindsight(data) {
    let best = null;
    for (let q = 50; q <= 800; q += 10) for (let rop = 0; rop <= 900; rop += 10) {
      const d = { q, rop }, s = stats(play(data, [d, d, d, d]), data);
      if (!best || s.total < best.total) best = { q, rop, total: s.total };
    }
    return best;
  }
  const api = { rhu, lead, phaseOf, play, stats, textbook, hindsight };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.InventoryEngine = api;
})(typeof window !== 'undefined' ? window : this);
