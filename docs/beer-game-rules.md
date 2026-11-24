# Beer Game: proposed rules (for Kristen's approval; nothing built in the app yet)

Tags: Read (source opened, `docs/sources.md`), Relayed, Inferred (my design choice), Measured (computed by the prototype in `proto/beer-game/`).

## 1. The chain and the starting position
- Four stages: Retailer, Wholesaler, Distributor, Factory. One customer, at the Retailer. Factory capacity unlimited. (Read, Sterman p. 11)
- Every stage starts with 12 cases on hand and no backlog. Every delay slot holds 4 cases or an order for 4. Customer demand is 4 cases a week for weeks 1–4, then 8 a week from week 5 to the end. (Read, Sterman p. 12)
- Costs: $0.50 per case on hand per week, $1.00 per case of backlog per week, counted at the end of each week after shipping. Team cost is the sum over the four stages and all weeks. (Read, Sterman p. 11; the counting point is Inferred)

## 2. Delays
- Orders take 2 weeks to reach the supplier. Shipments take 2 weeks to arrive. The Factory's production request takes 3 weeks to become finished cases. So a case ordered by the Retailer, Wholesaler or Distributor arrives 4 weeks later if the supplier has stock; the Factory's arrives 3 weeks later. (Relayed: Kaminsky and Simchi-Levi; Temple course slides)
- Why this structure: with it, the best order-up-to rule found by searching every target from 0 to 80 is S′ 28 (20 for the Factory), with team cost $204.00 and stage costs $46 / $50 / $54 / $54. Those are exactly Sterman's published benchmark parameters and costs. (Measured; Sterman's figures Read, footnote 9 and Table 2.) No other pair of targets reaches $204.

## 3. Each week, in this order (all stages together)
1. Receive the shipment in the front slot; the slots move up one.
2. Read this week's incoming order (the Retailer reads customer demand).
3. Ship as much of incoming order plus backlog as stock allows; the rest stays as backlog (no lost sales). Shipped cases go into the customer stage's last shipping slot.
4. Count costs.
5. Place an order (a whole number, 0 or more). It goes into the supplier's last order slot; the Factory's goes into its production line.
(Inferred, standard board sequence; arXiv 2202.12786 lists the same steps, Read)

## 4. Your seat and what you see
- You pick one seat. The app suggests Wholesaler for a first game. (Inferred)
- Weeks 1–4 are played for you at 4 a week, as in Sterman's training weeks (Read, p. 12). You order from week 5 to the end: 32 decisions.
- Each week you see: on hand, backlog, this week's incoming order, this week's delivery, what you have on order and not yet received, last week's costs and your running total. The Retailer also sees customer demand (it is the incoming order). Nothing else.
- Sterman's players could see the other stations' inventories (Read, p. 13). **Decision A:** show only your own position during play (recommended, fits a phone and keeps the surprise), or show all four inventories as Sterman did.

## 5. The other three stages
- Played by the rule Sterman fitted to his players, with his mean parameters: expected demand updated each week with weight θ 0.36; order = max(0, round(expected demand + 0.26 × (17 − net stock − 0.34 × supply line))). Net stock is on hand minus backlog; supply line is everything ordered and not yet received. (Rule and values Read, pp. 17 and 40. Rounding half up to whole cases, Inferred.)
- No random noise: the same orders from you always give the same game. (Inferred)
- All four stages on this rule cost $2,694.00 over 36 weeks; peak orders 11 / 17 / 27 / 33 cases from Retailer to Factory, in weeks 8 / 15 / 18 / 20. (Measured.) Sterman's human teams averaged $2,028 (Read); the fitted rule without noise is not expected to match it.

## 6. Length
- The game stops after week 36. **Decision B:** tell the player "the game ends without warning" (recommended: true, and it avoids end-of-game effects), or tell them 50 weeks as Sterman did (Read, p. 12), which misleads the player.

## 7. Score and debrief
- Score: your stage cost and the team cost, beside the benchmark ($204 team; your seat's benchmark cost) and the all-average team ($2,694). Lower is better. (Measured)
- Debrief screens: orders by week for all four stages on one chart (the bullwhip); your on-hand and backlog by week; peak order and the week it came for each stage; order variance ÷ customer-demand variance for each stage (all-average game: 5.5 / 25.8 / 55.9 / 82.6, Measured). Then a replay of your seat with the benchmark rule, same other players, so you see what your choices cost. Reference: with the benchmark in your seat and the fitted rule elsewhere, team cost is $1,277 (Retailer seat), $1,111.50 (Wholesaler), $1,819.50 (Distributor), $2,733 (Factory). (Measured)
- A short lesson after the debrief: why the bullwhip happens and what reduces it (count the supply line, share sell-through data, smaller and steadier orders). Sources to open before writing it: Sterman 1989 (Read) and Lee, Padmanabhan and Whang (1997), "The Bullwhip Effect in Supply Chains" (not yet opened). (Inferred plan)

## 8. Saving and ids
- One game in progress plus best and last finished cost per seat, in `data/users/<uid>/beer`, through study-kit's `save.createStore` (the same store Blast Radius uses for its prefs). (Inferred)
- Route `#beer-game`; id `beer-game` in `published-ids.json` under a new kind `games`. (Inferred)
- **Decision C, where it is listed:** on the home page under "Simulations" until the Supply chain lane opens, then also in that lane (recommended); or inside the Quality lane now.

## 9. study-kit
- No kit change needed. The kit's run engine is multiple choice with four meters, so it cannot take a typed order each week; the Beer Game runs on its own small engine in the app and saves through the kit's store. (Inferred, from reading `src/sims.js` at v0.2.0)
- Proposal for later, not now: when Phase 3 brings the inventory-policy and bottleneck sims, a numeric-step engine in study-kit (v0.3.0) could serve all three. I would bring that as its own approval list then.

## 10. Math checks (Measured, Nov 24)
- Python (`proto/beer-game/beer.py`, Decimal costs) and JS (`beer.js`, integer half-dollars) on 202 games: the two reference policies plus 200 games with seeded random orders, 50 in each seat. Every weekly inventory, backlog, incoming order, delivery, order and cost matched: 174,528 values, 0 differences.
- In the app build, the same check runs on every build, plus the benchmark reproduction ($204; S′ 28/20).
