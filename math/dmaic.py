"""DMAIC on a P&L (TPN-1), second implementation (Python) for math/check.js. Same rules as math/dmaic.js.
Usage: python3 -I dmaic.py [--best] < plans.json > out.json, where plans.json = {"plans": [{"moves": [[...], ...], "months": 8}, ...]}.
--best also runs the best-plan search for 8 and 6 months (slow; check.js caches the result by engine hash)."""
import json, sys

RULES = dict(months=8, perMonth=2, budget=60000, units=20000, price=40, varCost=22, handling=8,
             defects=[450, 250, 200, 100], removes=[360, 150, 0], weak=[120, 50, 0], slipped=[240, 100, 0],
             weakSlipped=[80, 30, 0], disruptUnits=2000,
             cost=dict(measure=6000, analyze=4000, pilot=5000, implement=[15000, 8000, 12000], control=5000), slipAfter=2)
MOVES = 11


def kind(m):
    if m == 0: return 'measure'
    if m <= 3: return 'analyze'
    if m <= 6: return 'pilot'
    if m <= 9: return 'implement'
    return 'control'


def cause(m):
    return (m - 1) % 3 if 1 <= m <= 9 else -1


def move_cost(m, R):
    k = kind(m)
    return R['cost']['implement'][cause(m)] if k == 'implement' else R['cost'][k]


def legal(m, t, done):
    if m in done: return False
    k, c = kind(m), cause(m)
    if k == 'analyze': return 0 in done and done[0] <= t
    if k == 'pilot': return (1 + c) in done and done[1 + c] <= t
    if k == 'control': return any(x in done and done[x] <= t for x in (7, 8, 9))
    return True


def month(t, done, R):
    removed = 0; disrupted = False
    for c in range(3):
        ti = done.get(7 + c)
        if ti is None or ti >= t: continue
        piloted = (4 + c) in done and done[4 + c] < ti
        aimed = (1 + c) in done and done[1 + c] <= ti
        if t == ti + 1 and not piloted: disrupted = True
        held = 10 in done and done[10] <= ti + R['slipAfter']
        slip = (t - ti > R['slipAfter']) and not held
        if aimed: removed += R['slipped'][c] if slip else R['removes'][c]
        else: removed += R['weakSlipped'][c] if slip else R['weak'][c]
    started = R['units'] - (R['disruptUnits'] if disrupted else 0)
    base = sum(R['defects'])
    defects = (base - removed) * started / R['units']
    good = started - defects
    margin = good * R['price'] - started * R['varCost'] - defects * R['handling']
    return dict(removed=removed, disrupted=disrupted, started=started, defects=defects, good=good, revenue=good * R['price'], margin=margin)


def counted(last3, done, R):
    return 12 * min(last3) * (R['price'] + R['handling']) if 10 in done else 0


def num(x):
    return int(x) if float(x).is_integer() else x


def play(plan, R):
    h = {k: [] for k in ('spend', 'started', 'defects', 'removed', 'good', 'revenue', 'contrib', 'disrupted')}
    done = {}; spent = 0
    for t in range(R['months']):
        mv = plan['moves'][t] if t < len(plan['moves']) else None
        if not isinstance(mv, list):
            return dict(h=h, waiting=t, spent=spent, done=done)
        if len(mv) > R['perMonth']:
            return dict(h=h, waiting=t, spent=spent, done=done, error='too many moves')
        if any(not (mv[k] > mv[k - 1]) for k in range(1, len(mv))):
            return dict(h=h, waiting=t, spent=spent, done=done, error='moves must be distinct and in order')
        spend = 0
        for m in mv:
            if not (isinstance(m, int) and 0 <= m < MOVES) or not legal(m, t, done):
                return dict(h=h, waiting=t, spent=spent, done=done, error='move not allowed')
            c = move_cost(m, R)
            if spent + c > R['budget']:
                return dict(h=h, waiting=t, spent=spent, done=done, error='over budget')
            spent += c; spend += c; done[m] = t
        r = month(t, done, R)
        for k, v in (('spend', spend), ('started', r['started']), ('defects', r['defects']), ('removed', r['removed']),
                     ('good', r['good']), ('revenue', r['revenue']), ('contrib', r['margin'] - spend), ('disrupted', 1 if r['disrupted'] else 0)):
            h[k].append(num(v))
    return dict(h=h, waiting=-1, spent=spent, done=done)


def stats(r, R):
    h = r['h']; n = len(h['contrib'])
    base_month = R['units'] * (R['price'] - R['varCost']) - sum(R['defects']) * (R['price'] + R['handling'])
    cnt = counted(h['removed'][R['months'] - 3:], r['done'], R) if n == R['months'] else 0
    contrib = sum(h['contrib'])
    return dict(contrib=num(contrib), counted=num(cnt), score=num(contrib + cnt), spent=r['spent'], baseMonth=base_month,
                baseRun=base_month * R['months'], disrupted=sum(h['disrupted']))


def best(R):
    opts = [[]] + [[a] for a in range(MOVES)] + [[a, b] for a in range(MOVES) for b in range(a + 1, MOVES)]
    memo = {}; done = {}; states = [0]

    def key(t, money):
        k = [t, money, 'M' if 0 in done else '-', done.get(10, '-')]
        for c in range(3):
            ti = done.get(7 + c)
            if ti is not None:
                k.append('I%d%s%s' % (ti, 'a' if (1 + c) in done and done[1 + c] <= ti else '', 'p' if (4 + c) in done and done[4 + c] < ti else ''))
            else:
                k.append(('a' if (1 + c) in done else '') + ('p' if (4 + c) in done else ''))
        return tuple(k)

    def rec(t, money):
        if t == R['months']:
            last3 = [month(m, done, R)['removed'] for m in range(R['months'] - 3, R['months'])]
            return (counted(last3, done, R), [])
        k = key(t, money)
        if k in memo: return memo[k]
        states[0] += 1
        top = None
        for s in opts:
            ok = True; cost = 0; added = []
            for m in s:
                if not legal(m, t, done): ok = False; break
                done[m] = t; added.append(m); cost += move_cost(m, R)
            if ok and cost <= money:
                here = month(t, done, R)['margin'] - cost
                rest = rec(t + 1, money - cost)
                v = here + rest[0]
                if top is None or v > top[0]: top = (v, [list(s)] + rest[1])
            for m in added: del done[m]
        memo[k] = top
        return top

    v, plan = rec(0, R['budget'])
    return dict(moves=plan, score=num(v), states=states[0], months=R['months'])


if __name__ == '__main__':
    sys.setrecursionlimit(10000)
    data = json.load(sys.stdin)
    out = {'plans': []}
    for p in data['plans']:
        R = dict(RULES, months=p.get('months', RULES['months']))
        r = play(p, R)
        res = dict(h=r['h'], waiting=r['waiting'], spent=r['spent'])
        if r['waiting'] < 0: res['stats'] = stats(r, R)
        out['plans'].append(res)
    if '--best' in sys.argv:
        out['best'] = {str(m): best(dict(RULES, months=m)) for m in (8, 6)}
    json.dump(out, sys.stdout)
