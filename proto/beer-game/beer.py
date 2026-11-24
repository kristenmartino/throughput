# Beer Game prototype (rules proposal). Integer cases, Decimal costs.
from decimal import Decimal as D
import json, sys, math
H, B = D('0.50'), D('1.00')
def rhu(x):  # round half up, same as JS Math.floor(x+0.5)
    return math.floor(x + 0.5)
def play(policies, weeks=36, order_delay=2, ship_delay=2, prod_delay=3, init_inv=12, flow=4, step_week=5, step_to=8, train=4):
    n = 4
    inv = [init_inv]*n; back = [0]*n
    ship = [[flow]*ship_delay for _ in range(3)] + [[flow]*prod_delay]  # inbound pipes; ship[3] = factory production
    opipe = [None] + [[flow]*order_delay for _ in range(3)]          # incoming orders for stages 1..3
    placed = [0]*n; recvd = [0]*n
    # supply line at start = everything already on its way to me
    for i in range(n):
        placed[i] = sum(ship[i]) + (sum(opipe[i+1]) if i < 3 else 0)
    le = [float(flow)]*n
    hist = {k: [[] for _ in range(n)] for k in ('inv','back','incoming','recv','order','cost')}
    demand = []
    for t in range(1, weeks+1):
        d = flow if t < step_week else step_to; demand.append(d)
        got = []
        for i in range(n):  # A receive
            g = ship[i].pop(0); ship[i].append(0); inv[i] += g; recvd[i] += g; got.append(g)
        inc = [d] + [opipe[i].pop(0) for i in range(1, n)]
        for i in range(1, n): opipe[i].append(0)
        for i in range(n):  # C ship
            want = inc[i] + back[i]; s = min(inv[i], want); inv[i] -= s; back[i] = want - s
            if i > 0: ship[i-1][ship_delay-1] += s
        costs = [H*inv[i] + B*back[i] for i in range(n)]
        orders = []
        for i in range(n):  # E order
            le[i] = policies[i]['theta']*inc[i] + (1-policies[i]['theta'])*le[i] if 'theta' in policies[i] else le[i]
            if t <= train: o = flow
            else: o = policies[i]['f'](i, t, inv[i]-back[i], placed[i]-recvd[i], le[i], inc[i])
            o = max(0, int(o)); orders.append(o); placed[i] += o
            if i < 3: opipe[i+1][order_delay-1] += o
            else: ship[3][prod_delay-1] += o
        for i in range(n):
            for k, v in (('inv',inv[i]),('back',back[i]),('incoming',inc[i]),('recv',got[i]),('order',orders[i]),('cost',costs[i])): hist[k][i].append(v)
    return hist, demand
def anchor(theta, alpha, beta, sp):
    return {'theta': theta, 'f': lambda i, t, net, sl, le, inc: max(0, rhu(le + alpha*((sp[i] if isinstance(sp, list) else sp) - net - beta*sl)))}
def team(h): return sum(sum(c) for c in h['cost'])
def stats(h, demand):
    def var(x): m = sum(x)/len(x); return sum((v-m)**2 for v in x)/len(x)
    vd = var(demand)
    return [{'peak': max(h['order'][i]), 'peakWeek': h['order'][i].index(max(h['order'][i]))+1, 'varRatio': round(var(h['order'][i])/vd, 2), 'cost': str(sum(h['cost'][i]))} for i in range(4)]
if __name__ == '__main__':
    st = anchor(0.36, 0.26, 0.34, 17)
    h, dmd = play([st]*4)
    print('Sterman-average team', team(h)); print(json.dumps(stats(h, dmd)))
    best = None
    for s in range(0, 81):
        for sf in range(0, 81, 1):
            p = [anchor(0.0, 1.0, 1.0, s)]*3 + [anchor(0.0, 1.0, 1.0, sf)]
            hh, _ = play(p); c = team(hh)
            if best is None or c < best[0]: best = (c, s, sf)
    print('best order-up-to (theta 0, alpha 1, beta 1)', best)
    p = [anchor(0.0,1.0,1.0,best[1])]*3 + [anchor(0.0,1.0,1.0,best[2])]
    hh,_ = play(p); print(json.dumps(stats(hh, dmd)))
