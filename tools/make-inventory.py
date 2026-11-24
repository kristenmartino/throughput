"""Writes data/inventory.json: the inventory sim's 26 weeks of demand and its rules (Phase 3, approved Nov 24).
Seeded so every player sees the same weeks. Base demand normal(100, 20) rounded, floor 0; weeks 9-10 are a
promotion at 1.8 times the base draw. Run: python3 -I tools/make-inventory.py"""
import json, os, random
rng = random.Random(20261124)
base = [max(0, round(rng.gauss(100, 20))) for _ in range(26)]
demand = [round(b * 1.8) if w in (9, 10) else b for w, b in enumerate(base, 1)]
rules = {
    'weeks': 26, 'initOnHand': 300,
    'holdCents': 50, 'orderCents': 20000, 'lostCents': 800,       # $0.50 a unit a week, $200 an order, $8 a lost sale
    'leadBefore': 2, 'leadAfter': 4, 'leadChangeWeek': 14,      # orders placed from week 14 take 4 weeks
    'reviews': [6, 12, 18],                                     # decisions may change after these weeks
    'mean': 100, 'sd': 20, 'promoWeeks': [9, 10], 'promoFactor': 1.8, 'z': 1.645
}
out = {'rules': rules, 'demand': demand}
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'inventory.json')
with open(path, 'w') as f: json.dump(out, f, indent=1)
print(demand, sum(demand))
