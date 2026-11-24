"""Bottleneck line engine, second implementation (Python) for math/check.js. Same rules as math/bottleneck.js.
Usage: python3 -I bottleneck.py < plans.json > out.json, where plans.json = {"plans": [{"release": ..., "buys": [...]}, ...]}"""
import json, sys

RULES = dict(rounds=12, caps=[10, 7, 9, 6, 8], init=6, step=3, stepCost=25000, budget=75000, margin=12000, wipCost=500)


def play(plan):
    R = RULES; caps = list(R['caps']); q = [R['init']] * 5
    h = {k: [] for k in ('release', 'out', 'wip', 'caps', 'constraint', 'profit', 'queues')}
    spent = 0
    for t in range(R['rounds']):
        if t >= len(plan['buys']) or plan['buys'][t] is None:
            return {'h': h, 'waiting': t, 'spent': spent}
        b = plan['buys'][t]
        if b >= 0:
            if spent + R['stepCost'] > R['budget']:
                return {'h': h, 'waiting': t, 'spent': spent, 'error': 'over budget'}
            caps[b] += R['step']; spent += R['stepCost']
        min_cap = min(caps); rel = min_cap if plan['release'] == 'rope' else caps[0]
        done = [min(q[i], caps[i]) for i in range(5)]
        q = [q[i] - done[i] for i in range(5)]
        for i in range(4):
            q[i + 1] += done[i]
        q[0] += rel
        out = done[4]; wip = sum(q)
        h['release'].append(rel); h['out'].append(out); h['wip'].append(wip); h['caps'].append(list(caps))
        h['constraint'].append(caps.index(min_cap))
        h['profit'].append(out * R['margin'] - wip * R['wipCost'] - (R['stepCost'] if b >= 0 else 0)); h['queues'].append(list(q))
    return {'h': h, 'waiting': -1, 'spent': spent}


def stats(r):
    h = r['h']; out = sum(h['out']); wip_sum = sum(h['wip']); n = len(h['out'])
    return {'profit': sum(h['profit']), 'out': out, 'avgWip': wip_sum / n if n else 0, 'lead': wip_sum / out if out else 0,
            'spent': r['spent'], 'endWip': h['wip'][-1] if n else 0}


def all_plans():
    R = RULES; max_buys = R['budget'] // R['stepCost']; plans = []

    def rec(t, left, buys):
        if t == R['rounds']:
            plans.append(list(buys)); return
        buys.append(-1); rec(t + 1, left, buys); buys.pop()
        if left > 0:
            for s in range(5):
                buys.append(s); rec(t + 1, left - 1, buys); buys.pop()
    rec(0, max_buys, [])
    return plans


def best():
    top = None; n = 0
    for release in ('rope', 'push'):
        for buys in all_plans():
            n += 1; s = stats(play({'release': release, 'buys': buys}))
            if top is None or s['profit'] > top['profit']:
                top = {'release': release, 'buys': buys, 'profit': s['profit']}
    top['searched'] = n
    return top


if __name__ == '__main__':
    inp = json.load(sys.stdin)
    out = {'best': best(), 'plans': []}
    for p in inp['plans']:
        r = play(p)
        out['plans'].append({'h': r['h'], 'waiting': r['waiting'], 'spent': r['spent'], 'stats': stats(r) if r['waiting'] < 0 else None})
    json.dump(out, sys.stdout)
