# Blind check 3 report

Answered 150/150 (answers.json). Numbers recomputed: 119 checks in Python (lesson-numbers.txt), plus full re-simulation of both sims.

## Medium/low confidence questions
- SC1-10 (medium): stem says alpha = 0, which gives 135 (not offered). 139.5 needs alpha = 0.3. Picked B. Stem is wrong.
- SC4-19 (medium): A (on-hand) and D (inventory position) are close; D picked per the lesson's inventory-position rule. A is defensible in a no-open-orders reading.
- SC5-04 (medium): stem never says all four shipments fit in one truck; D ($1,800) assumes it. Four trucks would cost more.
- SC5-06 (medium): "On inventory cost alone" is wrong wording. On inventory alone air saves $1.37; C ($3.63 ocean cheaper) is the answer only after the $5 premium. Also assumes a 365-day year.
- SC3-18 (medium): stem omits X's cost; only answerable with the SC3-17 numbers (X = $53.00, Y TCO = $54.00).
- SC3-19 (medium): stem does not say what Y's $52.00 contains; B (expediting) is defensible without the lesson. If defects are left out for both suppliers X is also $52.00, so Y is not "cheaper".
- SC7-08 (medium): needs the three-risk data from SC7-07's lesson context; stem alone does not give the other impacts.
- SC3-03 (medium): "relocate own plant" is offshoring (C); some courses call it captive offshoring/outsourcing, but C is the best fit.
- SC2-12 (medium): D (Assets) is the only internal attribute offered; depends on SCOR DS grouping (costs, profit, assets).

## Question flags
- SC1-10: stem error (alpha = 0 vs 0.3); matches lesson sc1-4 para 3 error.
- SC4-19: A and D near-duplicates in meaning.
- SC5-04, SC5-06, SC3-18, SC3-19, SC7-08: stems incomplete or ambiguous, see above.
- No stem gives its answer away in an obvious way. SC6-09 and SC3-16 are easy but fair.

## Lesson-number flags (lesson-numbers.txt)
1. sc1-4 para 3: "alpha = 0 ... next forecast is 139.5" is wrong. With alpha = 0 the forecast stays 135. 139.5 = 0.3 x 150 + 0.7 x 135, so alpha = 0.3. Certain. Same error in SC1-10.
2. sc8-2 para 2: "z = 2 ... 4 x 2 x 100 = 658.0" does not reproduce (it is 800). 658 = 4 x 1.645 x 100, so z = 1.645. Pooled 329.0, 50% cut, 67% for 9 variants all reproduce with z = 1.645. Certain.
3. sc3-6 para 3: "Leaving out defects makes Y look cheaper at $52.00". Y without defects is 52.00, but X without defects is also 52.00 (a tie). Y looks cheaper only against X's full $53.00. Wording issue.
4. sc4-8 para 1: "Using revenue ... overstates turns (here 7.5)" implies revenue of $6.0M, which is not printed. Not reproducible from the paragraph.
5. sc4-7 para 2: item-level usage values (top two = 68%, bottom five = 12%) are not printed. 68% and 12% cannot be checked. 188/200 = 94% reproduces.
6. sc1-4 para 4: MAPE 6.9% needs actual values that are not printed. Cannot be reproduced. MAD 7.5, bias 2.5, tracking signal 1.33 reproduce.
7. sc1-4 para 2: weighted MA 144.4 only reproduces if 150 is the newest month (list reads oldest first, but "newest first" weights apply to 150). Order not stated explicitly.
8. sc2-2 para 1: "minimizes volume-weighted distance" is misstated. The weighted-mean center of gravity minimizes volume-weighted squared distance; the minimum straight-line distance point needs an iterative method. Fairly certain.
9. sc5-2 para 2: "One full truckload at $1,800" assumes 20,000 lb fit in one truck; capacity not stated. Numbers otherwise reproduce (900, 3,600, 1,800, 10,000 lb, $360,000).
10. sc5-2 para 3: assumes 365-day year and says "ocean still wins by $3.63"; the $3.63 is premium minus pipeline saving. Reproduces.
11. sc4-6 para 3: the sigma_L = 2 result (83.5, 137.4) uses L = 9, but the paragraph just discussed L = 36. Reads as ambiguous. Numbers reproduce with L = 9.
12. sc6-3 para 3: 97.25 prints as 97.3 (half-up); Python float round gives 97.2. Fine, note only.
13. sc2-4 para 1 (suspect only): "version 14.0, 2022" for SCOR DS: I could not verify the version number. Seven processes list is correct.
14. sc4-4 para 3 (suspect only): "often 20 to 40 percent" holding cost range; I recall Stevenson giving a somewhat different range (about 15 to 35 percent in some editions). Not certain.
- All other numbers reproduce: sc4-2 (MRP table, releases 30/30/50 in weeks 2/3/4, error case 50), sc4-3 (64.6, 5.4), sc4-5 (536.7, 22.4, 1,342, 2,683, 3,354, 1,073, 240, 379), sc4-6 (39.5, 399.5, 55.8, 415.8, 118.4, 79.0, 83.5, 137.4), sc4-8 (6.0, 60.8, 8.7), sc1-2, sc1-4 (142.7, MAD, bias), sc5-2 pipeline, sc2-2 (25.0/23.0, 26.7/23.3, 47.00, 11.1%, 4.4%), sc2-4 (55, 155, 40), sc3-2, sc3-5, sc3-6, sc3-7, sc7-3, sc7-5, sc6-2 (72,000, 78,000, 15.6%, -10,000), sc6-3 (89.4%), sc6-6, sc6-8, sc8-2.

## Sims
- Inventory sim: re-simulated with order of events (arrivals at start of week, sales, holding on end stock, position check, order with lead 2 until week 13 and 4 from week 14). Reproduces all stated results: textbook $4,906.50 and 100% fill; fixed 247 policy $5,750, 89.2% fill, 286 lost units ($2,288); hindsight best Q 350 / ROP 310 at $4,170.50 (grid Q 50-800, ROP 0-900 step 10). EOQ 282.8 = 283; ROP 247 (246.5), 407 (406.5), 466 (465.8) reproduce.
- Flag (minor): the lesson says the fixed policy "saves $1,244.50 in holding cost" and "loses $2,288". The net difference is $843.50 only after also counting $200 saved from one fewer order (9 vs 10 orders). The paragraph omits the order-cost term.
- Claim "promotion and longer lead time both drain stock": supported. Lost sales with the fixed policy: 286 base, 166 without promo, 34 without lead-time change, 0 with neither.
- Minor: data demand sample SD is 37.7, versus the briefing's "about 20" (inflated by the 200 and 212 promo weeks). Not an inconsistency in the stated rules.
- Bottleneck sim: re-simulated. Reproduces: push 72 sold, 78 left, $528,000; pace 72 sold, 30 left, $684,000; Little lead times 5.0 and 9.3; three Cut buys sell 72 (profit $609,000, still 6 a round); Assemble +3 gives capacity 9 with Weld 7 the next constraint; best plan (pace; Assemble r1, Weld r2, Test r3) $757,500; search space 58,422 = 2 x (1 + 60 + 1,650 + 27,500) reproduces, and the exhaustive maximum matches. No inconsistencies.
