// Bottleneck line engine (Phase 3, approved Nov 24; levers narrowed to capacity steps and a release rule so the best plan
// can be found by exhaustive search; see claude/throughput-status.md). Used by the page and by math/check.js, which
// replays the same plans in math/bottleneck.py and requires every value to match. Integer units and dollars.
(function (root) {
  'use strict';
  // Five stations in a line. Each round every station works, at the same time, on what was waiting in front of it at the
  // start of the round: it finishes min(that queue, its capacity) and hands the units to the next station's queue
  // (station 5's output is the round's throughput). New work released this round joins station 1's queue for next
  // round. The line starts full: 6 units waiting at each station, the constraint's rate.
  const RULES = { rounds: 12, caps: [10, 7, 9, 6, 8], names: ['Cut', 'Weld', 'Paint', 'Assemble', 'Test'], init: 6,
    step: 3, stepCost: 25000, budget: 75000, margin: 12000, wipCost: 500 };
  // plan: { release: 'push' | 'rope', buys: [station index or -1, one per round played] }. A buy takes effect that round.
  function play(plan, o) {
    const R = Object.assign({}, RULES, o || {}), caps = R.caps.slice(), q = [0, 0, 0, 0, 0].map(() => R.init);
    const h = { release: [], out: [], wip: [], caps: [], constraint: [], profit: [], queues: [] };
    let spent = 0;
    for (let t = 0; t < R.rounds; t++) {
      const b = plan.buys[t];
      if (b === undefined || b === null) return { h, waiting: t, spent, rules: R };
      if (b >= 0) { if (spent + R.stepCost > R.budget) return { h, waiting: t, spent, error: 'over budget', rules: R }; caps[b] += R.step; spent += R.stepCost; }
      const minCap = Math.min.apply(null, caps), rel = plan.release === 'rope' ? minCap : caps[0];
      const done = q.map((x, i) => Math.min(x, caps[i]));
      for (let i = 0; i < 5; i++) q[i] -= done[i];
      for (let i = 0; i < 4; i++) q[i + 1] += done[i];
      q[0] += rel;
      const out = done[4];
      const wip = q.reduce((a, x) => a + x, 0);
      h.release.push(rel); h.out.push(out); h.wip.push(wip); h.caps.push(caps.slice()); h.constraint.push(caps.indexOf(minCap));
      h.profit.push(out * R.margin - wip * R.wipCost - (b >= 0 ? R.stepCost : 0)); h.queues.push(q.slice());
    }
    return { h, waiting: -1, spent, rules: R };
  }
  const sum = a => a.reduce((x, y) => x + y, 0);
  function stats(r) {
    const out = sum(r.h.out), wipSum = sum(r.h.wip), n = r.h.out.length;
    // Little's law: average lead time (rounds) = average WIP / average throughput.
    return { profit: sum(r.h.profit), out, avgWip: n ? wipSum / n : 0, lead: out ? wipSum / out : 0, spent: r.spent, endWip: n ? r.h.wip[n - 1] : 0 };
  }
  // Every plan: release push or rope; up to budget/stepCost buys, at most one per round, any station. Best by profit;
  // ties go to the plan that comes first in this enumeration (rope before push, then fewer buys, earlier rounds, lower stations).
  function allPlans(R0) {
    const R = Object.assign({}, RULES, R0 || {}), maxBuys = Math.floor(R.budget / R.stepCost), plans = [];
    const rec = (t, left, buys) => {
      if (t === R.rounds) { plans.push(buys.slice()); return; }
      buys.push(-1); rec(t + 1, left, buys); buys.pop();
      if (left > 0) for (let s = 0; s < 5; s++) { buys.push(s); rec(t + 1, left - 1, buys); buys.pop(); }
    };
    rec(0, maxBuys, []);
    return plans;
  }
  function best() {
    let top = null, n = 0;
    for (const release of ['rope', 'push']) for (const buys of allPlans()) {
      n++; const s = stats(play({ release, buys }));
      if (!top || s.profit > top.profit) top = { release, buys, profit: s.profit };
    }
    return Object.assign(top, { searched: n });
  }
  const api = { RULES, play, stats, allPlans, best };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BottleneckEngine = api;
})(typeof window !== 'undefined' ? window : this);
