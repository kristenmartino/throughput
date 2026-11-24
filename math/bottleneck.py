"""Bottleneck line engine, second implementation (Python) for math/check.js. Same rules as math/bottleneck.js.
Usage: python3 -I bottleneck.py [--best] < plans.json > out.json, where plans.json = {"plans": [{"release": ..., "buys": [...]}, ...]}.
--best also runs the exhaustive search (slow; check.js caches its result by engine hash)."""
import json, sys

RULES = dict(rounds=12, caps=[10, 7, 9, 6, 8], init=6, buf=8, margin=12000, wipCost=500, budget=75000, maxBuys=3,
             noise=[[-1, -2, -2, -1, 1], [1, -1, 1, 1, 0], [-1, -2, 2, -2, -1], [1, 0, -2, 2, 0], [0, -1, -1, 2, 0], [-1, 1, 2, 0, 0],
                    [0, 0, 0, 0, -1], [2, 0, -2, 0, -2], [-1, -2, 0, 2, 1], [1, 1, 1, 2, 1], [0, 0, 0, -1, -1], [0, 1, 1, 0, -1]],
             kinds={'cap': {'add': 3, 'cost': 25000}, 'setup': {'add': 2, 'cost': 15000, 'delay': 2},
                    'over': {'add': 3, 'cost': 6000}, 'buf': {'add': 4, 'cost': 10000}})
INF = float('inf')


def decode(b):
    if b < 0: return None
    if b < 5: return ('cap', b)
    if b < 10: return ('setup', b - 5)
    if b < 15: return ('over', b - 10)
    if b < 19: return ('buf', b - 14)
    return None


def cost(b):
    d = decode(b)
    return RULES['kinds'][d[0]]['cost'] if d else 0


def play(plan):
    R = RULES; K = R['kinds']; caps = list(R['caps']); q = [R['init']] * 5
    buf = [INF, R['buf'], R['buf'], R['buf'], R['buf']]; pend = []
    h = {k: [] for k in ('release', 'out', 'wip', 'caps', 'rate', 'bufs', 'constraint', 'profit', 'queues', 'blocked', 'done')}
    spent = 0; nb = 0
    for t in range(R['rounds']):
        if t >= len(plan['buys']) or plan['buys'][t] is None:
            return {'h': h, 'waiting': t, 'spent': spent}
        b = plan['buys'][t]; d = decode(b)
        if b >= 0 and d is None:
            return {'h': h, 'waiting': t, 'spent': spent, 'error': 'bad purchase'}
        if d:
            c = K[d[0]]['cost']
            if spent + c > R['budget']:
                return {'h': h, 'waiting': t, 'spent': spent, 'error': 'over budget'}
            if nb >= R['maxBuys']:
                return {'h': h, 'waiting': t, 'spent': spent, 'error': 'too many purchases'}
            spent += c; nb += 1
            if d[0] == 'cap': caps[d[1]] += K['cap']['add']
            elif d[0] == 'setup': pend.append((t + K['setup']['delay'], d[1]))
            elif d[0] == 'buf': buf[d[1]] += K['buf']['add']
        for at, s in pend:
            if at == t: caps[s] += K['setup']['add']
        min_cap = min(caps); rel = min_cap if plan['release'] == 'rope' else caps[0]
        rate = [max(0, caps[i] + R['noise'][t][i] + (K['over']['add'] if d and d[0] == 'over' and d[1] == i else 0)) for i in range(5)]
        done = [0] * 5; blocked = [0] * 5
        done[4] = min(q[4], rate[4])
        for i in range(3, -1, -1):
            room = max(0, buf[i + 1] - (q[i + 1] - done[i + 1])); can = min(q[i], rate[i])
            done[i] = min(can, room); blocked[i] = can - done[i]
        q = [q[i] - done[i] for i in range(5)]
        for i in range(4):
            q[i + 1] += done[i]
        q[0] += rel
        out = done[4]; wip = sum(q)
        h['release'].append(rel); h['out'].append(out); h['wip'].append(wip); h['caps'].append(list(caps)); h['rate'].append(rate)
        h['bufs'].append([int(x) for x in buf[1:]]); h['constraint'].append(caps.index(min_cap)); h['queues'].append(list(q))
        h['blocked'].append(blocked); h['done'].append(done); h['profit'].append(out * R['margin'] - wip * R['wipCost'] - (K[d[0]]['cost'] if d else 0))
    return {'h': h, 'waiting': -1, 'spent': spent}


def stats(r):
    h = r['h']; out = sum(h['out']); wip_sum = sum(h['wip']); n = len(h['out'])
    return {'profit': sum(h['profit']), 'out': out, 'avgWip': wip_sum / n if n else 0, 'lead': wip_sum / out if out else 0,
            'spent': r['spent'], 'endWip': h['wip'][-1] if n else 0, 'blocked': sum(sum(x) for x in h['blocked'])}


def best():
    R = RULES; top = None; n = 0
    for release in ('rope', 'push'):
        buys = []

        def rec(t, left, money):
            nonlocal top, n
            if t == R['rounds']:
                n += 1; p = stats(play({'release': release, 'buys': buys}))['profit']
                if top is None or p > top['profit']:
                    top = {'release': release, 'buys': list(buys), 'profit': p}
                return
            buys.append(-1); rec(t + 1, left, money); buys.pop()
            if left > 0:
                for b in range(19):
                    c = cost(b)
                    if c <= money:
                        buys.append(b); rec(t + 1, left - 1, money - c); buys.pop()
        rec(0, R['maxBuys'], R['budget'])
    top['searched'] = n
    return top


if __name__ == '__main__':
    inp = json.load(sys.stdin)
    out = {'best': best() if '--best' in sys.argv else None, 'plans': []}
    for p in inp['plans']:
        r = play(p)
        out['plans'].append({'h': r['h'], 'waiting': r['waiting'], 'spent': r['spent'], 'stats': stats(r) if r['waiting'] < 0 else None})
    json.dump(out, sys.stdout)
