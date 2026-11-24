"""Beer Game engine, second implementation (Python, Decimal costs) for math/check.js.
Same rules as math/beer.js (docs/beer-game-rules.md). Usage: python3 -I beer.py < games.json > out.json"""
import json, math, sys
from decimal import Decimal as D

RULES = dict(weeks=36, orderDelay=2, shipDelay=2, prodDelay=3, initInv=12, flow=4, stepWeek=5, stepTo=8, train=4)
AVERAGE = dict(theta=0.36, alpha=0.26, beta=0.34, sp=[17, 17, 17, 17])
BENCH = dict(theta=0.0, alpha=1.0, beta=1.0, sp=[28, 28, 28, 20])
H, B = D('0.50'), D('1.00')

def rhu(x):
    return math.floor(x + 0.5)

def anchor(p):
    return {'theta': p['theta'], 'f': lambda i, t, net, sl, le, inc: max(0, rhu(le + p['alpha'] * (p['sp'][i] - net - p['beta'] * sl)))}

def play(policies):
    P = RULES; n = 4
    inv = [P['initInv']] * n; back = [0] * n
    ship = [[P['flow']] * P['shipDelay'] for _ in range(3)] + [[P['flow']] * P['prodDelay']]
    opipe = [None] + [[P['flow']] * P['orderDelay'] for _ in range(3)]
    placed = [sum(ship[i]) + (sum(opipe[i + 1]) if i < 3 else 0) for i in range(n)]
    recvd = [0] * n; le = [float(P['flow'])] * n
    hist = {k: [[] for _ in range(n)] for k in ('inv', 'back', 'incoming', 'recv', 'order', 'cost', 'onorder')}
    demand = []
    for t in range(1, P['weeks'] + 1):
        d = P['flow'] if t < P['stepWeek'] else P['stepTo']; demand.append(d)
        got = []
        for i in range(n):
            g = ship[i].pop(0); ship[i].append(0); inv[i] += g; recvd[i] += g; got.append(g)
        inc = [d]
        for i in range(1, n):
            inc.append(opipe[i].pop(0)); opipe[i].append(0)
        for i in range(n):
            want = inc[i] + back[i]; s = min(inv[i], want); inv[i] -= s; back[i] = want - s
            if i > 0: ship[i - 1][P['shipDelay'] - 1] += s
        cost = [H * inv[i] + B * back[i] for i in range(n)]
        onorder = [placed[i] - recvd[i] for i in range(n)]
        for i in range(n):
            if 'theta' in policies[i]:
                le[i] = policies[i]['theta'] * inc[i] + (1 - policies[i]['theta']) * le[i]
        orders = []
        for i in range(n):
            q = P['flow'] if t <= P['train'] else policies[i]['f'](i, t, inv[i] - back[i], placed[i] - recvd[i], le[i], inc[i])
            if q is None:
                for k in range(n):
                    for key, v in (('inv', inv[k]), ('back', back[k]), ('incoming', inc[k]), ('recv', got[k]), ('cost', cost[k]), ('onorder', onorder[k])):
                        hist[key][k].append(v)
                return hist, demand, t
            orders.append(max(0, int(q)))
        for i in range(n):
            placed[i] += orders[i]
            if i < 3: opipe[i + 1][P['orderDelay'] - 1] += orders[i]
            else: ship[3][P['prodDelay'] - 1] += orders[i]
        for i in range(n):
            for key, v in (('inv', inv[i]), ('back', back[i]), ('incoming', inc[i]), ('recv', got[i]), ('order', orders[i]), ('cost', cost[i]), ('onorder', onorder[i])):
                hist[key][i].append(v)
    return hist, demand, 0

def game(seat, orders):
    pol = [anchor(AVERAGE) for _ in range(4)]
    def f(i, t, *a):
        k = t - RULES['train'] - 1
        return orders[k] if k < len(orders) else None
    pol[seat] = {'f': f}
    return play(pol)

def bench_in_seat(seat):
    pol = [anchor(AVERAGE) for _ in range(4)]; pol[seat] = anchor(BENCH); return play(pol)

def variance(a):
    m = sum(a) / len(a); return sum((v - m) ** 2 for v in a) / len(a)

def stats(hist, demand):
    vd = variance(demand); st = []
    for i in range(4):
        o = hist['order'][i]; pk = max(o)
        st.append({'cost': str(sum(hist['cost'][i])), 'peak': pk, 'peakWeek': o.index(pk) + 1, 'varRatio': variance(o) / vd})
    return {'stages': st, 'team': str(sum(D(s['cost']) for s in st))}

def out(r):
    hist, demand, waiting = r
    h = {k: v for k, v in hist.items() if k != 'cost'}
    h['cost'] = [[str(c) for c in s] for s in hist['cost']]
    o = {'hist': h, 'demand': demand, 'waiting': waiting}
    if not waiting: o['stats'] = stats(hist, demand)
    return o

if __name__ == '__main__':
    req = json.load(sys.stdin)
    res = {'all_average': out(play([anchor(AVERAGE)] * 4)), 'all_bench': out(play([anchor(BENCH)] * 4)),
           'bench_in_seat': [out(bench_in_seat(s)) for s in range(4)],
           'games': [out(game(g['seat'], g['orders'])) for g in req['games']]}
    # Grid search for the best order-up-to targets (theta 0, alpha 1, beta 1): reproduces Sterman's benchmark.
    best = None
    for s in range(0, 61):
        for sf in range(0, 61):
            p = dict(BENCH, sp=[s, s, s, sf]); h, d, _ = play([anchor(p)] * 4)
            c = sum(sum(x) for x in h['cost'])
            if best is None or c < best[0]: best = (c, s, sf)
    res['grid'] = {'team': str(best[0]), 'sp': best[1], 'spFactory': best[2]}
    json.dump(res, sys.stdout)
