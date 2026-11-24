"""Inventory sim engine, second implementation (Python) for math/check.js. Same rules as math/inventory.js.
Usage: python3 -I inventory.py < games.json > out.json, where games.json = {"data": {...}, "games": [[{q, rop}, ...], ...]}"""
import json, math, sys


def rhu(x):
    return math.floor(x + 0.5)


def lead(R, t):
    return R['leadAfter'] if t >= R['leadChangeWeek'] else R['leadBefore']


def phase_of(R, t):
    return sum(1 for w in R['reviews'] if t > w)


def play(data, decisions):
    R, D = data['rules'], data['demand']
    on_hand = R['initOnHand']
    pipe = []
    h = {k: [] for k in ('arrive', 'onHand', 'sold', 'lost', 'ordered', 'ip', 'hold', 'orderCost', 'lostCost')}
    for t in range(1, R['weeks'] + 1):
        p = phase_of(R, t)
        if p >= len(decisions) or decisions[p] is None:
            return {'h': h, 'waiting': p, 'week': t - 1}
        dec = decisions[p]
        arr = sum(o[1] for o in pipe if o[0] == t)
        on_hand += arr
        d = D[t - 1]; sold = min(on_hand, d); lost = d - sold
        on_hand -= sold
        on_order = sum(o[1] for o in pipe if o[0] > t)
        ip = on_hand + on_order
        q = 0
        if ip <= dec['rop'] and dec['q'] > 0:
            q = dec['q']; pipe.append((t + lead(R, t), q))
        h['arrive'].append(arr); h['onHand'].append(on_hand); h['sold'].append(sold); h['lost'].append(lost)
        h['ordered'].append(q); h['ip'].append(ip + q)
        h['hold'].append(on_hand * R['holdCents']); h['orderCost'].append(R['orderCents'] if q > 0 else 0)
        h['lostCost'].append(lost * R['lostCents'])
    return {'h': h, 'waiting': -1, 'week': R['weeks']}


def stats(r, data):
    h = r['h']
    hold, order, lost = sum(h['hold']), sum(h['orderCost']), sum(h['lostCost'])
    dem = sum(data['demand'][:len(h['sold'])]); sold = sum(h['sold'])
    return {'hold': hold, 'order': order, 'lost': lost, 'total': hold + order + lost,
            'orders': sum(1 for q in h['ordered'] if q > 0), 'fill': sold / dem if dem else 1.0, 'lostUnits': sum(h['lost'])}


def textbook(data):
    R = data['rules']; S = R['orderCents'] / 100; H = R['holdCents'] / 100
    eoq = rhu(math.sqrt(2 * R['mean'] * S / H))
    rop = lambda mu, L: rhu(L * mu + R['z'] * R['sd'] * math.sqrt(L))
    return [{'q': eoq, 'rop': rop(R['mean'], R['leadBefore'])}, {'q': eoq, 'rop': rop(R['mean'] * R['promoFactor'], R['leadBefore'])},
            {'q': eoq, 'rop': rop(R['mean'], R['leadAfter'])}, {'q': eoq, 'rop': rop(R['mean'], R['leadAfter'])}]


def hindsight(data):
    best = None
    for q in range(50, 801, 10):
        for rop in range(0, 901, 10):
            d = {'q': q, 'rop': rop}
            s = stats(play(data, [d, d, d, d]), data)
            if best is None or s['total'] < best['total']:
                best = {'q': q, 'rop': rop, 'total': s['total']}
    return best


if __name__ == '__main__':
    inp = json.load(sys.stdin)
    data = inp['data']
    out = {'games': [], 'textbook': textbook(data), 'hindsight': hindsight(data)}
    for g in inp['games']:
        r = play(data, g)
        out['games'].append({'h': r['h'], 'waiting': r['waiting'], 'week': r['week'], 'stats': stats(r, data) if r['waiting'] < 0 else None})
    json.dump(out, sys.stdout)
