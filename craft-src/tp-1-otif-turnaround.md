# OTIF turnaround

Ridgeline Components (fictional) supplies parts to three automakers. Its largest customer has put it on a watch list for late and short deliveries and wants a plan in 30 days. You have just been named to lead the turnaround. Figures and companies are invented.

## Packet

### Last quarter's order lines

| Measure | Lines |
|---|---|
| Order lines due | {{tp1.lines}} |
| Shipped on time | {{tp1.onTime}} |
| Shipped in full | {{tp1.inFull}} |
| Shipped both on time and in full | {{tp1.both}} |

### Why lines missed (one main cause recorded for each line that missed)

| Cause | Lines |
|---|---|
| Line 2 capacity | {{tp1.mCap}} |
| Material shortage from suppliers | {{tp1.mMat}} |
| Planning error | {{tp1.mPlan}} |
| Carrier delay | {{tp1.mCarrier}} |

### Line 2 next quarter

Line 2 is loaded at {{tp1.l2Load}} hours a week against {{tp1.l2Cap}} hours of capacity.

### From the monthly operations deck

> OTIF = on-time rate × in-full rate = {{tp1.ot|%0}} × {{tp1.inf|%0}} = {{tp1.otifWrong|%1}}.

### The customer's target

OTIF of {{tp1.target|%0}} within two quarters. The customer's scorecard counts an order line as a hit only if it arrived both on time and in full.

### Task

Hand back four stages.

1. Work out OTIF correctly and say what is wrong with the figure in the operations deck.
2. Rank the causes, say what share of the missed lines the top two explain, and how much of them must be fixed to reach the target.
3. Lay out a 90-day plan with owners for the top causes, including Line 2.
4. Write the three-sentence update to the CEO before the customer meeting.

Planted: an OTIF formula that multiplies two rates instead of counting lines, and a line loaded past its capacity next quarter.

## Key

### OTIF

OTIF counts lines that were both on time and in full: {{tp1.both}} ÷ {{tp1.lines}} = {{tp1.otif|%0}}. Multiplying the two rates ({{tp1.otifWrong|%1}}) assumes misses are independent; here they overlap, so the deck understates OTIF.

### Pareto

- {{tp1.miss}} lines missed. Line 2 capacity is {{tp1.capShare|%0}} of misses; capacity plus material is {{tp1.top2|%0}}.
- Removing the top two causes entirely lifts OTIF to {{tp1.fixTop2|%1}}. Reaching {{tp1.target|%0}} needs about {{tp1.fixNeed|%0}} of those misses gone, so there is little room to spare.

### Line 2

Line 2 is at {{tp1.l2Util|%0}} of capacity next quarter, {{tp1.l2Over}} hours a week short. Its capacity misses will not fall without action.

## Model answer

### Stage 1

- OTIF is {{tp1.otif|%0}}: {{tp1.both}} of {{tp1.lines}} lines on time and in full.
- The deck's {{tp1.otifWrong|%1}} multiplies two rates. OTIF must be counted line by line.
- Fix the deck's formula before the customer sees it.

### Stage 2

- Line 2 capacity {{tp1.mCap}}, material {{tp1.mMat}}, planning {{tp1.mPlan}}, carrier {{tp1.mCarrier}}.
- The top two explain {{tp1.top2|%0}} of misses. Removing them entirely reaches {{tp1.fixTop2|%1}}; about {{tp1.fixNeed|%0}} of them must go to reach {{tp1.target|%0}}.

### Stage 3

- Line 2: close the {{tp1.l2Over}}-hour weekly gap with overtime or a weekend shift, priced before approval, and look for setup time to recover. Owner: plant manager.
- Material: daily shortage list with the top suppliers, expediting rules, and a review of safety stock for the shortage parts. Owner: procurement lead.
- Planning: check the {{tp1.mPlan}} planning misses for one repeated cause. Owner: planning manager.
- Weekly OTIF review with the three owners, counted line by line.

### Stage 4

- "OTIF last quarter was {{tp1.otif|%0}}, not the {{tp1.otifWrong|%1}} in our deck. Line 2 capacity and supplier shortages explain {{tp1.top2|%0}} of misses, and removing them reaches {{tp1.fixTop2|%1}}. Line 2 is overloaded next quarter, so we are pricing a weekend shift now and will show the customer a weekly line-by-line OTIF report."

## Grading notes

- A strong hand-back catches the formula error before ranking causes.
- It works from the Pareto, not from the loudest complaint.
- It sees that Line 2 gets worse next quarter without action.
- Each action has an owner and is reviewed weekly.
