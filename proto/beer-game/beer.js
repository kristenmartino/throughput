'use strict';
// Beer Game engine prototype (JS). Integer cases; costs in half-dollars to stay exact, printed as dollars.
const rhu = x => Math.floor(x + 0.5);
function play(policies, o = {}) {
  const P = Object.assign({ weeks: 36, orderDelay: 2, shipDelay: 2, prodDelay: 3, initInv: 12, flow: 4, stepWeek: 5, stepTo: 8, train: 4 }, o);
  const n = 4, inv = Array(n).fill(P.initInv), back = Array(n).fill(0);
  const ship = [0, 1, 2].map(() => Array(P.shipDelay).fill(P.flow)).concat([Array(P.prodDelay).fill(P.flow)]);
  const opipe = [null].concat([1, 2, 3].map(() => Array(P.orderDelay).fill(P.flow)));
  const placed = [], recvd = Array(n).fill(0), le = Array(n).fill(P.flow);
  for (let i = 0; i < n; i++) placed[i] = ship[i].reduce((a, b) => a + b, 0) + (i < 3 ? opipe[i + 1].reduce((a, b) => a + b, 0) : 0);
  const hist = {}; for (const k of ['inv', 'back', 'incoming', 'recv', 'order', 'cost2']) hist[k] = [[], [], [], []];
  const demand = [];
  for (let t = 1; t <= P.weeks; t++) {
    const d = t < P.stepWeek ? P.flow : P.stepTo; demand.push(d);
    const got = [];
    for (let i = 0; i < n; i++) { const g = ship[i].shift(); ship[i].push(0); inv[i] += g; recvd[i] += g; got.push(g); }
    const inc = [d]; for (let i = 1; i < n; i++) { inc.push(opipe[i].shift()); opipe[i].push(0); }
    for (let i = 0; i < n; i++) { const want = inc[i] + back[i], s = Math.min(inv[i], want); inv[i] -= s; back[i] = want - s; if (i > 0) ship[i - 1][P.shipDelay - 1] += s; }
    const cost2 = inv.map((v, i) => v + 2 * back[i]);   // half-dollars: $0.50 per case held, $1.00 per case short
    const orders = [];
    for (let i = 0; i < n; i++) {
      const p = policies[i];
      if ('theta' in p) le[i] = p.theta * inc[i] + (1 - p.theta) * le[i];
      let q = t <= P.train ? P.flow : p.f(i, t, inv[i] - back[i], placed[i] - recvd[i], le[i], inc[i]);
      q = Math.max(0, Math.trunc(q)); orders.push(q); placed[i] += q;
      if (i < 3) opipe[i + 1][P.orderDelay - 1] += q; else ship[3][P.prodDelay - 1] += q;
    }
    for (let i = 0; i < n; i++) { hist.inv[i].push(inv[i]); hist.back[i].push(back[i]); hist.incoming[i].push(inc[i]); hist.recv[i].push(got[i]); hist.order[i].push(orders[i]); hist.cost2[i].push(cost2[i]); }
  }
  return { hist, demand };
}
const anchor = (theta, alpha, beta, sp) => ({ theta, f: (i, t, net, sl, le) => Math.max(0, rhu(le + alpha * ((Array.isArray(sp) ? sp[i] : sp) - net - beta * sl))) });
module.exports = { play, anchor, rhu };
