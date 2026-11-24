// Bottleneck line engine (Phase 3; four purchase kinds from the approved outline: capacity, setup reduction, overtime and
// buffer space, added Nov 24 on Kristen's word). Used by the page and by math/check.js, which replays the same plans in
// math/bottleneck.py and requires every value to match. Integer units and dollars.
(function (root) {
  'use strict';
  // Five stations in a line. Each round every station works on what was waiting in front of it at the start of the
  // round, up to its rate for the round: planned capacity plus that round's variation (a fixed, seeded table, the same in
  // every run), plus overtime if bought. A station can hand finished units on only if the waiting area in front of the
  // next station has room once that station has taken its own units; otherwise it is blocked. Station 5's output is sold.
  // New work released this round joins station 1's waiting area (no limit) for next round.
  const RULES = { rounds: 12, caps: [10, 7, 9, 6, 8], names: ['Cut', 'Weld', 'Paint', 'Assemble', 'Test'], init: 6, buf: 8,
    margin: 12000, wipCost: 500, budget: 75000, maxBuys: 3,
    // Variation in each station's output, round by round (seed 20261124, values −2..2; tools in this file's history).
    noise: [[-1, -2, -2, -1, 1], [1, -1, 1, 1, 0], [-1, -2, 2, -2, -1], [1, 0, -2, 2, 0], [0, -1, -1, 2, 0], [-1, 1, 2, 0, 0],
      [0, 0, 0, 0, -1], [2, 0, -2, 0, -2], [-1, -2, 0, 2, 1], [1, 1, 1, 2, 1], [0, 0, 0, -1, -1], [0, 1, 1, 0, -1]],
    // Purchase kinds. Codes: -1 none; 0-4 capacity at a station; 5-9 setup reduction; 10-14 overtime; 15-18 buffer space
    // in front of stations 2-5.
    kinds: {
      cap: { add: 3, cost: 25000, label: 'Capacity' },
      setup: { add: 2, cost: 15000, delay: 2, label: 'Setup reduction' },
      over: { add: 3, cost: 6000, label: 'Overtime' },
      buf: { add: 4, cost: 10000, label: 'Buffer space' } } };
  const decode = b => b < 0 ? null : b < 5 ? { kind: 'cap', s: b } : b < 10 ? { kind: 'setup', s: b - 5 } : b < 15 ? { kind: 'over', s: b - 10 } : b < 19 ? { kind: 'buf', s: b - 14 } : null;
  const cost = (b, R) => { const d = decode(b); return d ? (R || RULES).kinds[d.kind].cost : 0; };
  // plan: { release: 'push' | 'rope', buys: [code, one per round played] }.
  function play(plan, o) {
    const R = Object.assign({}, RULES, o || {}), K = R.kinds, caps = R.caps.slice(), q = [0, 0, 0, 0, 0].map(() => R.init);
    const buf = [Infinity, R.buf, R.buf, R.buf, R.buf], pend = [];
    const h = { release: [], out: [], wip: [], caps: [], rate: [], bufs: [], constraint: [], profit: [], queues: [], blocked: [], done: [] };
    let spent = 0, nb = 0;
    for (let t = 0; t < R.rounds; t++) {
      const b = plan.buys[t];
      if (b === undefined || b === null) return { h, waiting: t, spent, rules: R };
      const d = decode(b);
      if (b >= 0 && !d) return { h, waiting: t, spent, error: 'bad purchase', rules: R };
      if (d) {
        const c = K[d.kind].cost;
        if (spent + c > R.budget) return { h, waiting: t, spent, error: 'over budget', rules: R };
        if (nb >= R.maxBuys) return { h, waiting: t, spent, error: 'too many purchases', rules: R };
        spent += c; nb++;
        if (d.kind === 'cap') caps[d.s] += K.cap.add;
        else if (d.kind === 'setup') pend.push({ at: t + K.setup.delay, s: d.s });
        else if (d.kind === 'buf') buf[d.s] += K.buf.add;
      }
      for (const p of pend) if (p.at === t) caps[p.s] += K.setup.add;
      const minCap = Math.min.apply(null, caps), rel = plan.release === 'rope' ? minCap : caps[0];
      const rate = caps.map((c, i) => Math.max(0, c + R.noise[t][i] + (d && d.kind === 'over' && d.s === i ? K.over.add : 0)));
      const done = [0, 0, 0, 0, 0], blocked = [0, 0, 0, 0, 0];
      done[4] = Math.min(q[4], rate[4]);
      for (let i = 3; i >= 0; i--) {
        const room = Math.max(0, buf[i + 1] - (q[i + 1] - done[i + 1])), can = Math.min(q[i], rate[i]);
        done[i] = Math.min(can, room); blocked[i] = can - done[i];
      }
      for (let i = 0; i < 5; i++) q[i] -= done[i];
      for (let i = 0; i < 4; i++) q[i + 1] += done[i];
      q[0] += rel;
      const out = done[4], wip = q.reduce((a, x) => a + x, 0);
      h.release.push(rel); h.out.push(out); h.wip.push(wip); h.caps.push(caps.slice()); h.rate.push(rate); h.bufs.push(buf.slice(1));
      h.constraint.push(caps.indexOf(minCap)); h.queues.push(q.slice()); h.blocked.push(blocked); h.done.push(done);
      h.profit.push(out * R.margin - wip * R.wipCost - (d ? K[d.kind].cost : 0));
    }
    return { h, waiting: -1, spent, rules: R };
  }
  const sum = a => a.reduce((x, y) => x + y, 0);
  function stats(r) {
    const out = sum(r.h.out), wipSum = sum(r.h.wip), n = r.h.out.length;
    // Little's law: average lead time (rounds) = average WIP / average throughput.
    return { profit: sum(r.h.profit), out, avgWip: n ? wipSum / n : 0, lead: out ? wipSum / out : 0, spent: r.spent,
      endWip: n ? r.h.wip[n - 1] : 0, blocked: sum(r.h.blocked.map(sum)) };
  }
  // Every plan: release push or rope; up to maxBuys purchases within the budget, at most one per round, any kind and
  // station. Best by profit; ties go to the plan found first (rope before push, then the enumeration order below).
  function best() {
    const R = RULES, codes = []; for (let b = 0; b < 19; b++) codes.push(b);
    let top = null, n = 0;
    for (const release of ['rope', 'push']) {
      const buys = [];
      const rec = (t, left, money) => {
        if (t === R.rounds) { n++; const p = stats(play({ release, buys })).profit; if (!top || p > top.profit) top = { release, buys: buys.slice(), profit: p }; return; }
        buys.push(-1); rec(t + 1, left, money); buys.pop();
        if (left > 0) for (const b of codes) { const c = cost(b); if (c <= money) { buys.push(b); rec(t + 1, left - 1, money - c); buys.pop(); } }
      };
      rec(0, R.maxBuys, R.budget);
    }
    return Object.assign(top, { searched: n });
  }
  const api = { RULES, play, stats, best, decode, cost };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BottleneckEngine = api;
})(typeof window !== 'undefined' ? window : this);
