# Independent check of the five-station line lesson

Method: simulator written from sim.txt only (/tmp/blindbn/w/ref.py, Python; ex.c for the exhaustive search). The full pace search was repeated in pure Python on 2 cores as a cross-check of the C code.

## Reading that reproduces the lesson
1. Each round, process stations downstream first (Test, Assemble, Paint, Weld, Cut). Each station works on its start-of-round queue only.
2. Blocking uses live space: station i can move at most buffer[i+1] - (start queue[i+1] - units station i+1 finished this round). Blocked units = wanted output minus moved output, summed over station-rounds (unit-rounds).
3. Release joins the line AFTER the round's work (end of round). It is counted in that round's carried WIP and cannot be worked until the next round. Joining at the start of the round gives push 73 / blocked 47 and pace 73 / $691,000, which do not match.
4. Purchase timing: capacity, overtime and buffer apply in the round bought, before that round's work. Setup reduction applies from round r+2 (lag 1 gives the same results here; lag 3 gives $652,500 on the setup-at-Assemble check, so lag 2 is the one that reproduces).
5. Pacing uses the CURRENT slowest planned capacity (min over stations of base + capacity bought + setup once effective; overtime excluded). It is recomputed each round after that round's purchase effects, and used for the release at the end of that round.
   - Static pacing at 6 gives $643,500 (Assemble capacity), $653,000 (setup) and a best of $666,000. The lesson's $645,000, $666,000 and $703,000 need dynamic pacing.
   - Computing pace one round ahead (counting a setup that takes effect next round) gives $660,500 and $699,500, which do not match.

## Numbers reproduced
- No purchases, push: sold 73, 77 in line at the end, blocked 43, carried 682 unit-rounds, profit $535,000. Pace: sold 71, 31 in line, blocked 0, carried 373, profit $665,500.
- Assemble starved capacity (capacity minus output when the queue ran short): pace 6, push 4. The lesson does not define idle; this definition matches.
- Little's law: pace average WIP 373/12 = 31.08, lead time 373/71 = 5.25 rounds. Push average WIP 56.8, lead time 682/73 = 9.34 rounds. Average WIP is taken at the end of each round, after release.
- Three capacity steps at Cut with pace: sold 71, $590,500 (lesson says sells the same 71 at $75,000 cost).
- Push with buffer space at Assemble in round 1: blocked 43 to 36, sold 73, $525,000 (cost only).
- Capacity at Assemble in round 1 (pace, dynamic): sold 74, $645,000. Setup at Assemble in round 1: sold 74, $666,000.
- Overtime at Assemble in round 1: $660,000. Best single overtime across both release rules, all rounds and stations: Weld round 3 with pace, $663,500. No single overtime beats the $665,500 of buying nothing.
- Plan count 3,066,070 reproduced exactly. Each round offers 19 purchase options, not 20: capacity x5, setup x5, overtime x5, buffer x4 (stations 2-5 only). 2 x sum over k=0..3 of C(12,k) x 19^k = 2 x 1,533,035. The $75,000 budget never binds, because 3 purchases cost at most $75,000.
- Best plan: pace, capacity at Assemble in round 1, capacity at Weld in round 2, setup at Test in round 5. Sells 84, $703,000. It is unique; second best is the same plan with the setup in round 4 ($699,500). The pure-Python search over all 1,533,035 pace plans returns the same optimum. Best push plan is $629,500 (capacity at Weld round 1, setup at Test round 2, capacity at Assemble round 3). It is unchanged if push release rises with Cut capacity.

## Ambiguities in the briefing
- Order of events within a round; whether downstream consumption frees space for the upstream station in the same round (it must, to reproduce).
- When release joins (must be end of round).
- Whether "slowest station's planned capacity" updates after purchases (must update), whether it counts setup only once effective (assumed), and whether overtime counts (assumed no).
- Whether push release (10) grows if Cut capacity is bought. It makes no difference to any lesson number or to the best push plan.
- Whether blocking is measured in units or unit-rounds. "Holds back 43 units" is really 43 unit-rounds of withheld work, summed over stations.
- Purchase option set: buffer at the first station is not allowed (the briefing says "in front of each station after the first"). Needed for the count.
- Whether the variation applies on top of overtime or purchased capacity (assumed additive, floor 0).
- "Idle" and "average WIP" are not defined in the briefing.

## Flags on the lesson
1. "Both sell 74 ... the cheaper purchase wins" is only partly right. The gap is $21,000: $10,000 is purchase price and about $11,000 is carrying cost (carried 40 vs 38 at the end; blocked 24 vs 5). Say so rather than attributing it to price alone.
2. "Buying capacity anywhere but the constraint changes nothing" is true for Cut. The best plan buys at Weld and Test, the next constraints, but only in combination with Assemble. A reader could take the sentence to mean non-constraint purchases are never useful. Weld capacity alone at Assemble 6 is also useless.
3. The pacing result depends on dynamic pacing. The lesson says "pace release to the constraint" but the $703,000 plan needs release re-paced upward as capacity is bought. With static release at 6, the same purchases give $618,500, below buying nothing. State this.
4. "Push ... holds back 43 units" should say unit-rounds of blocked work.
5. Under push at the end, 77 in the line includes 10 released after round 12. Under pace the 31 includes 6 released after round 12.
6. Hindsight caveat is present and correct. The optimum is unique but only $3,500 above the runner-up, so it is fragile to the variation table.

## Rules a player would need that the briefing omits
- Release joins after the round's work, and the rule is re-evaluated each round (dynamic pace).
- Downstream-first processing, so freed space counts in the same round.
- Timing of each purchase relative to the round's work (before it).
- Buffer cannot be bought at Cut.
- Definition of blocked (unit-rounds), starved/idle capacity and average WIP for Little's law.
- Whether a purchase can be made in a round where its effect falls outside the 12 rounds (setup in round 11 or 12 is allowed and wasted; it is in the 3,066,070 count).
- That the budget cannot bind.
