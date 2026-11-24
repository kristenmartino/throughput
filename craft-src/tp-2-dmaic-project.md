# A Green Belt project the CFO will check

Alder Packaging (fictional) runs a thermoforming line that scraps too many trays. You sponsor a Green Belt project as the operations leader, and the CFO has said she will only count savings finance can see. Figures and companies are invented.

## Packet

### Baseline

- The line makes {{tp2.units}} trays a month.
- Defect rate over the last six months: {{tp2.defBase|%1}}.
- Each defective tray costs ${{tp2.costDef}} in material and rework.
- Goal set by the plant: {{tp2.defTarget|%1}}.

### What the team found

| Cause of defects | Share |
|---|---|
| Mold temperature drift | {{tp2.cTemp|%0}} |
| Operator setup differences | {{tp2.cOper|%0}} |
| Sheet material variation | {{tp2.cMat|%0}} |
| Other | {{tp2.cOther|%0}} |

### After the fix

The team added temperature control on the mold and a standard setup sheet. The defect rate for the first month after the change was {{tp2.defAfter|%1}}.

### Note from the plant manager

> Let's book the full year's savings now. Also, the sheet supplier changed resin grades the same month we made the fix, but I don't think it matters.

### Task

Hand back four stages.

1. Write the problem statement with the baseline cost a month.
2. Say which causes to attack first, with the number of defects each explains.
3. Say what control is needed before the result counts.
4. Write the savings claim for the CFO: what to claim, when, and what could weaken it.

Planted: one month of data treated as a lasting result, and a supplier change in the same month that could explain part of the gain.

## Key

### Baseline cost

{{tp2.units}} × {{tp2.defBase|%1}} = {{tp2.defects}} defects a month × ${{tp2.costDef}} = {{tp2.costBase|$}} a month.

### Causes

Mold temperature explains about {{tp2.nTemp}} defects a month and operator setup about {{tp2.nOper}}: together {{tp2.top2Share|%0}} of defects.

### Savings

- After: {{tp2.units}} × {{tp2.defAfter|%1}} × ${{tp2.costDef}} = {{tp2.costAfter|$}} a month.
- Saving: {{tp2.saveMo|$}} a month, {{tp2.saveYr|$}} a year if it holds. The defect rate fell {{tp2.dropPct|%0}}.

## Model answer

### Stage 1

- "The thermoforming line scraps {{tp2.defBase|%1}} of trays, about {{tp2.defects}} a month, costing {{tp2.costBase|$}} a month. The goal is {{tp2.defTarget|%1}} within the project."
- No cause or solution in the problem statement.

### Stage 2

- Mold temperature first (about {{tp2.nTemp}} defects a month), then operator setup (about {{tp2.nOper}}).
- Together they explain {{tp2.top2Share|%0}} of defects.

### Stage 3

- Control chart on mold temperature and on the defect rate, with a reaction plan.
- Setup sheet in the standard work, with audits.
- Run at least three months before calling the result stable.

### Stage 4

- Claim {{tp2.saveMo|$}} a month ({{tp2.saveYr|$}} a year), counted month by month as it is confirmed, not booked up front.
- Check the resin change: compare defect rates by resin lot or run a short trial with the old grade, so the project claims only its own share.
- "Savings are counted as each month confirms them; the resin change is being checked so we claim only what the fix caused."

## Grading notes

- A strong hand-back states the problem without a cause in it.
- It works from the cause shares, temperature first.
- It refuses to book a year's savings on one month of data.
- It treats the resin change as a rival explanation to test.
