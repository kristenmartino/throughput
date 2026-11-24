# Blind check, Phase 3 (Nov 24, 2026)

**Checker:** Claude Sonnet, run as a subagent. It received three files:
- `questions.txt`: the 150 supply-chain questions (sc1–sc8), with no key and no explanations.
- `lesson-numbers.txt`: the 58 lesson paragraphs that state numbers.
- `sims.txt`: the inventory and bottleneck simulation text, with their data and stated results.

The files were exported by `node tools/export-blind.js <dir> sc4,sc1,sc5,sc2,sc3,sc7,sc6,sc8`, plus a sims dump. The key was kept in a separate folder that the checker was told not to open. Its full report is `docs/blind-check-phase3-answers.md`.

## Result (Measured)
- **150 of 150 keyed answers agree** with the checker's own answers, compared by script against `key.json`. Confidence: 141 high, 9 medium, 0 low.
- **Lesson numbers:** the checker ran 119 Python checks.
  - It found two printing errors, both from one cause (below).
  - It found one misleading comparison, one misstated definition, and several figures that could not be reproduced from what was printed.
- **Sims:** the checker re-simulated both games from their stated rules and data, and every number reproduced:
  - Inventory: EOQ 283; reorder points 247, 407 and 466; textbook policy $4,906.50; fixed policy $5,750; hindsight best $4,170.50.
  - Bottleneck: push $528,000; pace $684,000; best plan $757,500; the exhaustive search covered 58,422 plans.

## Flags and what was done
| Id | Flag | Fix |
|---|---|---|
| sc1-4 ¶3, SC1-10; sc8-2 ¶2 | "α = 0" and "z = 2" were printed where the values are 0.3 and 1.645. A placeholder with no format rounds to a whole number. | Every such placeholder now has a format. **New build rule:** a non-integer value in a placeholder with no format fails the build. The rule found 17 uses in Phase 3 text: SC4-08, SC5-06, SC3-17, SC7-07, SC7-08, SC6-08, SC6-18, SC6-23 and the two above. None were found in the published Green Belt decks. |
| sc3-6 ¶3, SC3-19 | "Leaving out defects makes Y look cheaper at $52.00" is only true against X's full $53.00. Leaving defects out for both suppliers gives a tie. The SC3-19 stem did not say what the $52.00 included. | The lesson now says "counting defects for X but forgetting them for Y". The SC3-19 stem now says the $52.00 covers price, freight and expediting and is compared with X's $53.00. Distractors were replaced. |
| sc2-2 ¶1 | The center of gravity was said to minimize volume-weighted distance. It minimizes weighted squared distance. | Reworded to say so. |
| sc1-4 ¶4 | MAPE could not be reproduced because the actuals were not printed. | Actuals and forecasts are now printed. |
| sc1-4 ¶2 | The paragraph did not say which month is newest, which the weighted average depends on. | "(oldest to newest)" added. |
| sc4-7 ¶2 | The ABC percentages could not be checked because the ten item values were not printed. | The values are now printed. |
| sc4-8 ¶1 | "7.5 turns on revenue" implies revenue that was never printed. | $6,000,000 is now printed. |
| sc4-6 ¶3 | The variable lead-time figures use L = 9, right after a paragraph about L = 36. | "Back at the 9-day lead time" added. |
| sc5-2 ¶2, SC5-04 | The paragraph assumed a full truck holds all four shipments without saying so. | It now says so in both places. |
| SC5-06 | "On inventory cost alone" was misworded: on inventory alone, air saves $1.37. | The stem now reads "counting only the premium and pipeline holding cost". |
| SC7-08 | The stem relied on data from the lesson. | The three probabilities and impacts are now in the stem. |
| SC4-19 | Options A (on hand) and D (inventory position) were close. | A now reads "on-hand stock alone, ignoring open orders". |
| Inventory lesson | The fixed-policy comparison listed holding saved and lost sales but left out the $200 ordering saving. | It now gives all three and the net figure, all filled from the engine. |
| SC3-03, SC2-12, SC3-18 | Medium confidence: SC3-03 might be called captive outsourcing; SC2-12 relies on SCOR grouping; SC3-18 relies on figures from SC3-17. | No change. Offshoring is the standard term for SC3-03 and the explanation says why. The SCOR grouping in SC2-12 was Read in SCOR DS v14.0. The SC3-18 stem states the per-unit gap it needs. |
| sc2-4 ¶1 | The checker could not verify "SCOR DS version 14.0, 2022". | No change: Read on scor.ascm.org this session. |
| sc4-4 ¶3 | The checker recalled a different holding-cost range from Stevenson. | No change. The figure is already tagged Relayed. Kristen can check it against the book. |
| sc6-3 ¶3 | 97.25% prints as 97.3%. This is half-up rounding, while Python's float rounding gives 97.2. | No change: the app's formatter rounds half-up throughout. |

All fixes were applied before publishing. The build passes, and the Playwright run passes 1,660 of 1,660.
