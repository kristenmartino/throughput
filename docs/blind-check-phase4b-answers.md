# Blind check report

## Simulator results
Files: sim.py (evaluator in Python, run with `python3 -I sim.py`; it also contains an exact Python search that is too slow, over 10 min), search.cpp/s2.cpp/s3.cpp (same rules, exhaustive DFS over every assignment of each of the 11 moves to a month or never, with budget, 2-per-month and prerequisite pruning only; C++ for speed). Python evaluator reproduces the C++ scores on the best plans.
Interpretations used: (a) two unpiloted fixes in the same month cost one 2,000-part loss, not two (stack=off); (b) a control plan made in month c covers a fix in month t when c <= t+2, including c < t; (c) defect rate = (1000 - removed in month 8)/20000.
- Do-nothing 8 months: 2,496,000.
- Best 8 months: 2,852,960, 4 tied plans (all same shape): M+Aw / As+Pw / Ps+Iw / Is(+C) / C in month 4 or 5; swapping Aw and As in months 1-2 gives the other two. Spend 52,000. Counted saving 293,760. Contribution 2,559,200. Month-8 scrap 490/20000 = 2.45%.
- Best 6 months: 2,163,552, 6 ties, no pilots: M, Aw+As (any split over months 1-2 with M in month 1), Iw+Is month 3, C month 4 or 5. Spend 42,000.
- Best 8 with no pilots allowed: 2,836,512 (6 ties). Best 8 with no control plan allowed: 2,542,120 (2 ties, same plan as best minus C). Best 8 with no Measure/Analyze/Pilot: 2,591,024 (Iw+Is month 1, C month 2 or 3).
- Sensitivity, if same-month unpiloted fixes stack (4,000-part loss): 8-month best unchanged; 6-month best becomes 2,158,552 and includes pilot plans (the "flip" disappears); no-pilot 8 = 2,802,864; hunch plan = 2,559,008.
- Sensitivity, control plan before a fix not counted: optima unchanged for 8 and 6 months.

## Lesson number checks
| Claim | Lesson | Mine | Match |
|---|---|---|---|
| 1 Do nothing, 8 mo | 2,496,000 | 2,496,000 | yes |
| 1 Best 8-mo score | 2,852,960 | 2,852,960 | yes |
| 1 Best plan as written (M+Aw; As+Pw; Ps+Iw(wear fix); Is; C m5) | listed | is one of 4 tied optima | yes (tie not mentioned) |
| 1 Spend | 52,000 | 52,000 | yes |
| 1 End defect rate | 2.5% | 2.45% | rounding only (2.45% rounds to 2.5 half-up; 24.5 per 1,000) |
| 1 Counted saving | 293,760 | 293,760 (12 x 510 x 48) | yes |
| 2 Fix bar stock first (Ib month 1, nothing else) | 2,452,800 | 2,452,800 | yes |
| 2 "below doing nothing" | yes | 43,200 below | yes |
| 3 Hunch: fix wear+setup, no M/A, with C | 2,591,024 | 2,591,024 (fix month 1, C by month 3; best such plan) | yes (months not given by lesson) |
| 3 Gap to best | 261,936 | 261,936 | yes |
| 4 No-pilot plan (M; Aw+As; Iw+Is m3; C m5) | 2,836,512 | 2,836,512 | yes |
| 4 Gap | 16,448 | 16,448 | yes |
| 5 Best 6-mo, no pilots | 2,163,552 | 2,163,552 | yes |
| 5 Best 8-mo plan cut to 6 months | 2,093,600 | 2,093,600 | yes |
| 5 Finance counts, cut plan | 207,360 | 207,360 (12 x 360 x 48) | yes |
| 5 Finance counts, 8-mo plan | 293,760 | 293,760 | yes |
| 5 Gap | 69,952 | 69,952 | yes |
| 6 Best plan without its control plan | 2,542,120 | 2,542,120 | yes |
| 6 Gap | 310,840 | 310,840 | yes |
| 6 Also true that 2,542,120 is the best of ALL no-control plans | implied | yes (2 ties) | yes |
All numbers match under the no-stacking interpretation. Under stacking, claims 3, 4, 5 (6-month part) would not match.

## Briefing flags
1. Slip size: briefing says gains slip "by a third". Rules: analyzed fixes 360->240 and 150->100 (a third), unanalyzed wear 120->80 (a third), but unanalyzed setup 50->30 (40%). Contradiction for that one case.
2. Ambiguous: disruption for two unpiloted fixes made in the same month. Briefing says "costs 10% of the next month's output" and does not say whether it stacks. Rules (as I read them) give 10% once. Result-changing: the 6-month "flip" in lesson 5 depends on it.
3. Not told: each move can be made only once (matters for control plan, pilots).
4. Not told: "other" has no analyze, pilot or fix (Analyze is listed as "$4,000 a cause" and "other" is one of the four causes).
5. Not told: order of moves within a month (Measure, Analyze, Pilot, Implement, Control) beyond "prerequisite can come earlier in the same month". The briefing does cover that case, so this is minor.
6. Not told: counted saving is priced at $48 per scrap part removed per month (x 12), is the minimum of the removed figure over the last three months, and is at full output (not reduced by disruption). "The gain held for the last three months" is vague on min vs average.
7. Ambiguous: "control plan made within 2 months of a fix" - does it count if the control plan comes before the fix, and does month t+2 count? Rules: made by month t+2 counts, including earlier. Optima do not change under either reading.
8. Not told: a late control plan does not undo a slip that has already started.
9. Not told: whether "analyzed first" includes analysis in the same month as the fix (rules: yes, t or earlier) versus pilot (earlier month only). The asymmetry is only partly stated ("pilot in an earlier month").
10. Not told: bar stock fix removes nothing; the player can only find out via Pilot (pilot shows removal, fine) but the briefing does not say a cause can have a no-effect fix.
11. Not told: the budget is for the whole run, but also whether unspent budget counts (it does not). Fine; no flag beyond noting score uses spend only.
Consistent with rules: starting parts, price, costs, scrap, $312,000, 2 moves per month, $60,000 budget, all move costs, prerequisites, fix timing (month after), one-third effect for unanalyzed fixes, 10% disruption.

## Reasoning flags
1. Claim 2: "Fixing it first, without measuring, ... removes nothing" and the link to measurement. Under the rules a bar-stock fix removes 0 even if measured, analyzed and piloted. The loss comes from the rule, not from skipping Measure. Also the rules give bar stock 200 true scrap with no fixable part, which the lesson does not explain. The "because the data can be wrong" sentence is supported only in that the log ranks bar stock first and the true ranking is wear 450, setup 250, bar 200.
2. Claim 3: "each fix removes only a third as much because it is not aimed at the cause". Rules say it is because the cause was not analyzed (a third as much), not mis-aiming. Also the 261,936 gap is not only the one-third effect: the hunch plan also pays a 2,000-part disruption month (no pilots) and its counted saving is 97,920 vs 293,760. The lesson attributes the whole gap to the one-third effect. Also "the two real causes" are unknown to a player who skipped Measure; it is a hindsight plan.
3. Claim 4: "gets the setup fix in a month sooner but loses a month of output to debugging" is supported (fix month 3 vs 4; 2,000 parts lost in month 4). OK. Depends on non-stacking: the two same-month fixes lose output once.
4. Claim 5: "the answer flips" holds only if same-month unpiloted fixes lose 2,000 parts once. Under stacking the best 6-month plan has pilots (2,158,552). "A pilot pays when a failed rollout costs more than the delay" is not what the rules model: skipping a pilot costs a 10% output month (debugging), not a failed rollout. Reword.
5. Claim 5: "its setup fix misses one of the last three months" is correct (setup fix month 4 works from month 5; last three months are 4-6).
6. Claim 1: tied optima exist (4 for 8 months, 6 for 6 months); "the best plan" implies uniqueness. Score is unique. Claim 7 "a true optimum" is supported (exhaustive search; no randomness in the rules).
7. Claim 6: "gains slip and finance counts nothing" is correct as stated; most of the 310,840 is the lost counted saving (293,760), the remaining 17,080 is the contribution gap (slip losses net of the 5,000 control cost saved). Not stated, not wrong.
