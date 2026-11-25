// DMAIC on a P&L (TPN-1, Phase 4b; design approved by Kristen Nov 25, 14:28 ET: "A" on all four decisions; the four rule
// changes kept and an eight-month run with a six-month comparison, Nov 25, on her answers).
// Used by the page and by math/check.js, which replays the same plans in math/dmaic.py and requires every value to match.
// Integer units and dollars. A fictional machining line; every number here is a design input.
(function (root) {
  'use strict';
  // Causes 0..3: fixture wear, setup differences, bar stock variation, other. Defects a month at full output, by cause.
  // A fix removes part of its cause from the month after it is implemented; "other" has no fix.
  const RULES = {
    months: 8, perMonth: 2, budget: 60000, units: 20000, price: 40, varCost: 22, handling: 8,
    causes: ['Fixture wear', 'Setup differences', 'Bar stock variation', 'Other'],
    defects: [450, 250, 200, 100],          // true defects a month by cause: 1,000 in all, a 5.0% rate
    logShares: [0.25, 0.20, 0.40, 0.15],    // the plant's own defect log, which blames bar stock first
    // Defects a month a fix removes once working: aimed at an analyzed cause (80% of fixture wear, 60% of setup), or
    // made without analyzing the cause first (a third as much). The bar stock fix removes none: the log points at it,
    // but it is not the cause. "Other" has no fix. After two months without a control plan, gains slip by a third.
    removes: [360, 150, 0], weak: [120, 50, 0], slipped: [240, 100, 0], weakSlipped: [80, 30, 0],
    disruptUnits: 2000,                     // an unpiloted fix costs 10% of the next month's output while it is debugged
    cost: { measure: 6000, analyze: 4000, pilot: 5000, implement: [15000, 8000, 12000], control: 5000 },
    slipAfter: 2                            // months a fix holds before slipping, unless a control plan came first
  };
  // Moves, coded: 0 measure; 1-3 analyze cause 0-2; 4-6 pilot; 7-9 implement; 10 control plan.
  const MOVES = 11;
  const kindOf = m => m === 0 ? 'measure' : m <= 3 ? 'analyze' : m <= 6 ? 'pilot' : m <= 9 ? 'implement' : 'control';
  const causeOf = m => m >= 1 && m <= 9 ? (m - 1) % 3 : -1;
  const moveCost = (m, R) => { R = R || RULES; const k = kindOf(m); return k === 'implement' ? R.cost.implement[causeOf(m)] : R.cost[k]; };
  // Can move m be made in month t, given the moves made before this one (done: code -> month)? Each move once. Measure
  // before Analyze, and Analyze before Pilot of the same cause, in an earlier month or earlier in the same month (codes
  // within a month run in ascending order, which is the DMAIC order). A control plan only after some fix.
  function legal(m, t, done) {
    if (done[m] !== undefined) return false;
    const k = kindOf(m), c = causeOf(m);
    if (k === 'analyze') return done[0] !== undefined && done[0] <= t;
    if (k === 'pilot') return done[1 + c] !== undefined && done[1 + c] <= t;
    if (k === 'control') return [7, 8, 9].some(x => done[x] !== undefined && done[x] <= t);
    return true;
  }
  // One month's results, given the moves made so far (done: code -> month). Fixes implemented in an earlier month work
  // now. A pilot must have run in an earlier month than its fix; the cause must have been analyzed by the month of the
  // fix. An unpiloted fix costs 10% of the next month's output. A control plan made within two months of a fix holds it.
  function month(t, done, R) {
    let removed = 0, disrupted = false;
    for (let c = 0; c < 3; c++) {
      const ti = done[7 + c];
      if (ti === undefined || ti >= t) continue;
      const piloted = done[4 + c] !== undefined && done[4 + c] < ti, aimed = done[1 + c] !== undefined && done[1 + c] <= ti;
      if (t === ti + 1 && !piloted) disrupted = true;
      const held = done[10] !== undefined && done[10] <= ti + R.slipAfter, slip = t - ti > R.slipAfter && !held;
      removed += aimed ? (slip ? R.slipped[c] : R.removes[c]) : (slip ? R.weakSlipped[c] : R.weak[c]);
    }
    const started = R.units - (disrupted ? R.disruptUnits : 0), base = R.defects.reduce((a, b) => a + b, 0);
    const defects = (base - removed) * started / R.units, good = started - defects;
    return { removed, disrupted, started, defects, good, revenue: good * R.price, margin: good * R.price - started * R.varCost - defects * R.handling };
  }
  // Finance counts a saving only with a control plan in place, at the level held for the last three months: the
  // smallest monthly gain in those months × 12. A monthly gain is defects removed × (price + handling), at full output.
  const counted = (removedLast3, done, R) => done[10] !== undefined ? 12 * Math.min.apply(null, removedLast3) * (R.price + R.handling) : 0;
  // plan: { moves: [[codes], ...] } one array per month played (up to perMonth codes each, ascending).
  function play(plan, o) {
    const R = Object.assign({}, RULES, o || {});
    const h = { spend: [], started: [], defects: [], removed: [], good: [], revenue: [], contrib: [], disrupted: [] };
    const done = {}; let spent = 0;
    for (let t = 0; t < R.months; t++) {
      const mv = plan.moves[t];
      if (!Array.isArray(mv)) return { h, waiting: t, spent, done, rules: R };
      if (mv.length > R.perMonth) return { h, waiting: t, spent, done, error: 'too many moves', rules: R };
      for (let k = 1; k < mv.length; k++) if (!(mv[k] > mv[k - 1])) return { h, waiting: t, spent, done, error: 'moves must be distinct and in order', rules: R };
      let spend = 0;
      for (const m of mv) {
        if (!(Number.isInteger(m) && m >= 0 && m < MOVES) || !legal(m, t, done)) return { h, waiting: t, spent, done, error: 'move not allowed', rules: R };
        const c = moveCost(m, R);
        if (spent + c > R.budget) return { h, waiting: t, spent, done, error: 'over budget', rules: R };
        spent += c; spend += c; done[m] = t;
      }
      const r = month(t, done, R);
      h.spend.push(spend); h.started.push(r.started); h.defects.push(r.defects); h.removed.push(r.removed);
      h.good.push(r.good); h.revenue.push(r.revenue); h.contrib.push(r.margin - spend); h.disrupted.push(r.disrupted ? 1 : 0);
    }
    return { h, waiting: -1, spent, done, rules: R };
  }
  const sum = a => a.reduce((x, y) => x + y, 0);
  // Score: contribution over the run after project spend, plus the yearly saving finance counts.
  function stats(r) {
    const R = r.rules, h = r.h, n = h.contrib.length;
    const baseMonth = R.units * (R.price - R.varCost) - sum(R.defects) * (R.price + R.handling);
    const cnt = n === R.months ? counted(h.removed.slice(R.months - 3), r.done, R) : 0, contrib = sum(h.contrib);
    return { contrib, counted: cnt, score: contrib + cnt, spent: r.spent, baseMonth, baseRun: baseMonth * R.months,
      endDefects: n ? h.defects[n - 1] : sum(R.defects), endRate: n ? h.defects[n - 1] / h.started[n - 1] : sum(R.defects) / R.units,
      disrupted: sum(h.disrupted) };
  }
  // The best plan over every legal plan. Each month: any set of up to perMonth legal moves (ascending codes) within the
  // budget. A month's results depend only on the moves made so far, so the best rest-of-run from a given month and set
  // of moves is worked out once and reused (memoized search). Ties go to the first set tried: the empty set, then
  // single moves by code, then pairs in code order. Months in o.months, default RULES.months.
  function best(o) {
    const R = Object.assign({}, RULES, o || {}), opts = [[]];
    for (let a = 0; a < MOVES; a++) opts.push([a]);
    for (let a = 0; a < MOVES; a++) for (let b = a + 1; b < MOVES; b++) opts.push([a, b]);
    const memo = new Map(), done = {}; let states = 0;
    // What the rest of the run depends on, at the start of month t: whether Measure is done; for each cause, either its
    // fix (month, aimed, piloted) or whether it has been analyzed and piloted (past months are all before any later
    // fix, so a flag is enough); when the control plan came; and the money left.
    const key = (t, money) => {
      let k = t + '|' + money + '|' + (done[0] !== undefined ? 'M' : '-') + '|' + (done[10] !== undefined ? done[10] : '-');
      for (let c = 0; c < 3; c++) {
        const ti = done[7 + c];
        k += '|' + (ti !== undefined ? 'I' + ti + (done[1 + c] !== undefined && done[1 + c] <= ti ? 'a' : '') + (done[4 + c] !== undefined && done[4 + c] < ti ? 'p' : '')
          : (done[1 + c] !== undefined ? 'a' : '') + (done[4 + c] !== undefined ? 'p' : ''));
      }
      return k;
    };
    const rec = (t, money) => {
      if (t === R.months) {
        const last3 = []; for (let m = R.months - 3; m < R.months; m++) last3.push(month(m, done, R).removed);
        return { v: counted(last3, done, R), plan: [] };
      }
      const k = key(t, money), hit = memo.get(k);
      if (hit) return hit;
      states++;
      let top = null;
      for (const set of opts) {
        let ok = true, cost = 0; const added = [];
        for (const m of set) { if (!legal(m, t, done)) { ok = false; break; } done[m] = t; added.push(m); cost += moveCost(m, R); }
        if (ok && cost <= money) {
          const here = month(t, done, R).margin - cost, rest = rec(t + 1, money - cost), v = here + rest.v;
          if (!top || v > top.v) top = { v, plan: [set].concat(rest.plan) };
        }
        for (const m of added) delete done[m];
      }
      memo.set(k, top);
      return top;
    };
    const r = rec(0, R.budget);
    return { moves: r.plan, score: r.v, states, months: R.months };
  }
  const api = { RULES, MOVES, kindOf, causeOf, moveCost, legal, month, play, stats, best };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DmaicEngine = api;
})(typeof window !== 'undefined' ? window : this);
