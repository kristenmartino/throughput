# The executive S&OP meeting

Harbor Kitchen Products (fictional) makes cookware. Next quarter's demand for its main family runs past what the plant can make. You chair the pre-S&OP meeting and must take one recommendation to the executive meeting on Thursday. Figures and companies are invented.

## Packet

### Demand and supply for the family

| | Month 1 | Month 2 | Month 3 |
|---|---|---|---|
| Consensus demand (units) | {{tp3.d1}} | {{tp3.d2}} | {{tp3.d3}} |
| Plant capacity, regular time (units) | {{tp3.cap}} | {{tp3.cap}} | {{tp3.cap}} |

Finished stock is at the safety target; none is free to use. The family sells at ${{tp3.price}} a unit with ${{tp3.cmU}} of contribution a unit.

### Options from the plant and planning

- Overtime: up to {{tp3.otMo}} units a month in months 2 and 3 (month 1 is booked for maintenance), at ${{tp3.otCost}} a unit above regular cost.
- Build ahead: the plant has room for {{tp3.prebuild}} extra units this month (before month 1). Holding them costs about ${{tp3.carryU}} a unit until they ship.
- No co-packer can qualify in under five months.
- Month 4 demand is forecast at {{tp3.m4}} units, below regular capacity.

### Note from the sales director

> Month 3 includes {{tp3.promo}} units for Coastal Home's spring promotion. Coastal told us the dates are flexible, but I don't want to ask them to move it.

### Task

Hand back four stages.

1. Size the gap for the quarter in units, revenue and contribution.
2. Price the overtime and build-ahead options and say how much of the gap is left.
3. Recommend how to handle what is left, and say what you would ask sales to do.
4. Write the two-sentence decision request for the executive meeting.

Planted: a flexible promotion date that sales would rather not raise, and a build-ahead window that closes this month.

## Key

### Gap

- Demand: {{tp3.d1}} + {{tp3.d2}} + {{tp3.d3}} = {{tp3.demand}} units. Supply: {{tp3.cap}} × 3 = {{tp3.supply}}.
- Gap: {{tp3.gap}} units, {{tp3.revRisk|$}} of revenue and {{tp3.cmRisk|$}} of contribution.

### Options

- Overtime: {{tp3.otUnits}} units; premium {{tp3.otSpend|$}}; net contribution {{tp3.otUnits}} × (${{tp3.cmU}} − ${{tp3.otCost}}) = {{tp3.otCm|$}}.
- Build ahead: {{tp3.prebuild}} units; holding cost {{tp3.prebuildCost|$}}; net contribution {{tp3.prebuildCm|$}}. The window closes this month, so it needs a yes now.
- Left after both: {{tp3.gap}} − {{tp3.otUnits}} − {{tp3.prebuild}} = {{tp3.left}} units, {{tp3.leftRev|$}} of revenue.

### Promotion

Moving Coastal's {{tp3.promo}}-unit promotion to month 4 covers the remaining {{tp3.left}} units with {{tp3.spareAfterPromo}} to spare, and month 4 has room for it. Coastal has said the dates are flexible. If Coastal moves, less build-ahead would be needed, but the build-ahead window closes this month, before Coastal answers, so approving it keeps the option open.

## Model answer

### Stage 1

- Demand {{tp3.demand}}, supply {{tp3.supply}}: a {{tp3.gap}}-unit gap.
- At stake: {{tp3.revRisk|$}} of revenue, {{tp3.cmRisk|$}} of contribution.
- Most of the gap sits in month 3, so timing matters as much as volume.

### Stage 2

- Overtime nets {{tp3.otCm|$}} on {{tp3.otUnits}} units.
- Building ahead nets {{tp3.prebuildCm|$}} on {{tp3.prebuild}} units, but only if approved this month.
- {{tp3.left}} units ({{tp3.leftRev|$}}) remain.

### Stage 3

- Ask sales to offer Coastal a promotion date in month 4, which has spare capacity. Coastal said dates are flexible; the risk of asking is low and the gain closes the gap.
- If Coastal will not move, agree which orders are short by {{tp3.left}} units, using customer priority rules, before month 3 starts.
- Do not let the remaining gap go undecided and fall to whoever orders last.

### Stage 4

- "Next quarter is {{tp3.gap}} units short, {{tp3.revRisk|$}} of revenue. We ask approval today for overtime and a {{tp3.prebuild}}-unit build ahead, which close all but {{tp3.left}} units, and for sales to offer Coastal Home a later promotion date to close the rest."

## Grading notes

- A strong hand-back sizes the gap in units and money before choosing options.
- It sees that the build-ahead decision cannot wait for the next cycle.
- It raises the promotion date with sales instead of accepting the sales director's reluctance.
- The decision request names what is approved, what it closes, and what is asked of sales.
