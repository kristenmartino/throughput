// Beer Game engine (rules approved by Kristen, Nov 24: docs/beer-game-rules.md). Used by the page and by
// math/check.js, which replays the same games in math/beer.py and requires every weekly value to match.
// Integer cases. Costs are kept in half-dollars (integers) so they are exact: $0.50 a case held = 1, $1.00 a case short = 2.
(function (root) {
  'use strict';
  const RULES = { weeks: 36, orderDelay: 2, shipDelay: 2, prodDelay: 3, initInv: 12, flow: 4, stepWeek: 5, stepTo: 8, train: 4 };
  const SEATS = ['Retailer', 'Wholesaler', 'Distributor', 'Factory'];
  // Sterman (1989) mean fitted parameters (Table 4) and his benchmark (footnote 9).
  const AVERAGE = { theta: 0.36, alpha: 0.26, beta: 0.34, sp: [17, 17, 17, 17] };
  const BENCH = { theta: 0, alpha: 1, beta: 1, sp: [28, 28, 28, 20] };
  const rhu = x => Math.floor(x + 0.5);
  const anchor = p => ({ theta: p.theta, f: (i, t, net, sl, le) => Math.max(0, rhu(le + p.alpha * (p.sp[i] - net - p.beta * sl))) });

  // policies: four objects { theta?, f(i, t, net, supplyLine, expectedDemand, incoming) }; f may return null to
  // pause the game at that week's order (the player has not ordered yet). Returns the history so far.
  function play(policies, o) {
    const P = Object.assign({}, RULES, o || {});
    const n = 4, inv = Array(n).fill(P.initInv), back = Array(n).fill(0);
    const ship = [0, 1, 2].map(() => Array(P.shipDelay).fill(P.flow)).concat([Array(P.prodDelay).fill(P.flow)]);
    const opipe = [null].concat([1, 2, 3].map(() => Array(P.orderDelay).fill(P.flow)));
    const placed = [], recvd = Array(n).fill(0), le = Array(n).fill(P.flow);
    for (let i = 0; i < n; i++) placed[i] = ship[i].reduce((a, b) => a + b, 0) + (i < 3 ? opipe[i + 1].reduce((a, b) => a + b, 0) : 0);
    const hist = {}; for (const k of ['inv', 'back', 'incoming', 'recv', 'order', 'cost2', 'onorder']) hist[k] = [[], [], [], []];
    const demand = [];
    for (let t = 1; t <= P.weeks; t++) {
      const d = t < P.stepWeek ? P.flow : P.stepTo; demand.push(d);
      const got = [];
      for (let i = 0; i < n; i++) { const g = ship[i].shift(); ship[i].push(0); inv[i] += g; recvd[i] += g; got.push(g); }
      const inc = [d]; for (let i = 1; i < n; i++) { inc.push(opipe[i].shift()); opipe[i].push(0); }
      for (let i = 0; i < n; i++) { const want = inc[i] + back[i], s = Math.min(inv[i], want); inv[i] -= s; back[i] = want - s; if (i > 0) ship[i - 1][P.shipDelay - 1] += s; }
      const cost2 = inv.map((v, i) => v + 2 * back[i]);
      const onorder = placed.map((v, i) => v - recvd[i]);
      for (let i = 0; i < n; i++) if ('theta' in policies[i]) le[i] = policies[i].theta * inc[i] + (1 - policies[i].theta) * le[i];
      const orders = [];
      for (let i = 0; i < n; i++) {
        let q = t <= P.train ? P.flow : policies[i].f(i, t, inv[i] - back[i], placed[i] - recvd[i], le[i], inc[i]);
        if (q === null || q === undefined) {   // paused: record the week without orders and stop
          for (let k = 0; k < n; k++) { hist.inv[k].push(inv[k]); hist.back[k].push(back[k]); hist.incoming[k].push(inc[k]); hist.recv[k].push(got[k]); hist.cost2[k].push(cost2[k]); hist.onorder[k].push(onorder[k]); }
          return { hist, demand, waiting: t, rules: P };
        }
        orders.push(Math.max(0, Math.trunc(q)));
      }
      for (let i = 0; i < n; i++) { placed[i] += orders[i]; if (i < 3) opipe[i + 1][P.orderDelay - 1] += orders[i]; else ship[3][P.prodDelay - 1] += orders[i]; }
      for (let i = 0; i < n; i++) { hist.inv[i].push(inv[i]); hist.back[i].push(back[i]); hist.incoming[i].push(inc[i]); hist.recv[i].push(got[i]); hist.order[i].push(orders[i]); hist.cost2[i].push(cost2[i]); hist.onorder[i].push(onorder[i]); }
    }
    return { hist, demand, waiting: 0, rules: P };
  }
  // A game: the player sits in `seat` and has typed `orders` (for weeks 5, 6, ...); the others use Sterman's average rule.
  function game(seat, orders, others) {
    const pol = [0, 1, 2, 3].map(() => anchor(others || AVERAGE));
    pol[seat] = { f: (i, t) => { const q = orders[t - RULES.train - 1]; return q === undefined ? null : q; } };
    return play(pol);
  }
  const all = p => play([0, 1, 2, 3].map(() => anchor(p)));
  // The player's seat played by the benchmark rule, everything else as in the game.
  const benchInSeat = seat => { const pol = [0, 1, 2, 3].map(() => anchor(AVERAGE)); pol[seat] = anchor(BENCH); return play(pol); };
  const sum = a => a.reduce((x, y) => x + y, 0);
  const variance = a => { const m = sum(a) / a.length; return sum(a.map(v => (v - m) * (v - m))) / a.length; };
  // Summary of a finished game: costs in dollars (half-dollar sums / 2), peak orders, variance ratio to customer demand.
  function stats(r) {
    const vd = variance(r.demand);
    const stages = [0, 1, 2, 3].map(i => {
      const o = r.hist.order[i], peak = Math.max.apply(null, o);
      return { cost2: sum(r.hist.cost2[i]), peak, peakWeek: o.indexOf(peak) + 1, varRatio: variance(o) / vd };
    });
    return { stages, team2: sum(stages.map(s => s.cost2)) };
  }
  const api = { RULES, SEATS, AVERAGE, BENCH, rhu, anchor, play, game, all, benchInSeat, stats, variance };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BeerEngine = api;
})(typeof window !== 'undefined' ? window : this);
