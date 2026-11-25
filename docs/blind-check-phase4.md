# Blind check, Phase 4 (Nov 24, 2026)

**Checker:** Claude Sonnet, run as a subagent. It received four files and was told not to open the key or the repo:
- `questions.txt`: the 84 questions in coo1–coo6 and cpo1, with no key and no explanations.
- `lesson-numbers.txt`: the 33 lesson paragraphs that state numbers.
- `packets.md`: TP-1, TP-2 and TP-3 as filled by the build (packet, key, model answer, grading notes).
- `roleplays.md`: TPL-1 and TPL-2 (brief, persona, hidden facts, walkaway, opening, good outcome, rubric).

Exported with `node tools/export-blind.js <dir> coo1,coo2,coo3,coo4,coo5,coo6,cpo1`, plus the filled packets and a role-play dump. Full report: `docs/blind-check-phase4-answers.md`. The checker's recompute script ran under `python3 -I`.

## Result (Measured)
- **84 of 84 keyed answers agree** with the checker's own answers, compared by script against `key.json`. Medium confidence on 7 (COO1-02, COO2-08, COO3-09, COO4-05, COO4-06, COO5-02, COO5-09).
- **Numbers:** every lesson, key and model-answer figure reproduced except one rounding mismatch ($146,425 against a printed $0.73 gap). Four figures rested on assumptions that were not printed.
- **Packets:** 18 flags (6 each). **Role-plays:** 11 flags.

## Flags and what was done
| Id | Flag | Fix |
|---|---|---|
| coo4-2 ¶3, COO4-05 | $146,425 comes from the unrounded $0.7321 gap; the printed $0.73 gives $146,000. | Both now print "about $146,000" (new key `c4.gapYrK`, rounded to the thousand, in JS and Python). |
| coo4-2 ¶2, COO4-04 | The base for the carrying rate was not stated. | Both now say the rate applies to price, freight and duty. |
| COO2-08 | "Price and cost each fell $86,000": cost rose; its effect on contribution fell. | "Price and cost each took $86,000". |
| COO5-09 | "Capacity cushion" undefined; spare ÷ demand (18.2%) is also defensible. | Stem adds "as a share of capacity". |
| coo3-3 ¶2, COO3-07 | Did not say the $50 contribution is before the overtime premium. | Both say so. |
| coo6-2 ¶3, COO6-05 | $7.28M assumes every cut role goes and pay for the rest is unchanged. | Both state the assumption. |
| cpo1-3 ¶2 | Avoidance depends on taking the market price as the baseline. | The assumption is now stated in the sentence. |
| About 25 distractors | Absolutes ("always", "certainly", "no downside", "every") let a test-wise reader eliminate them. | Reworded 20 of the strongest. Words like "only" remain where they are the point of the option. Key-length and key-spread rules still pass. |
| COO1-02, COO3-09 | Second option defensible in a narrow reading. | Not changed: the keyed option is the lesson's point and the checker chose it. Open for Kristen. |
| TP-1 | 95.5% assumes the top two causes vanish entirely; Task 2's "gap" was ambiguous; "misses grow" not supported; customer's OTIF definition missing; the weekend shift was treated as decided without a cost. | Key and model now say about 96% of those misses must go to reach 95%; Task 2 reworded; "will not fall without action"; the packet states the customer counts line by line; the shift is priced before approval. |
| TP-2 | Claimed $43,500 while also saying to claim only the fix's share; $60 mixed material and rework; "three months" not from the packet. | Trays are scrapped, not reworked; the CFO's three-stable-month rule is in the packet; the claim is "up to $43,500 a month", reduced by any share the resin change explains. |
| TP-3 | Month-1 overtime (1,000) exceeded the month-1 gap (800), so the 900 left was approximate; month 4 unknown; build-ahead larger than needed if Coastal moves. | Overtime is available in months 2 and 3 only (1,500 a month, same 3,000 total), so the month-by-month balance gives exactly 900 short; month 4 demand (9,500, below capacity) is in the packet; the key says why build-ahead is still approved before Coastal answers. |
| TPL-1 | Learner's authority to share cost not stated; no minimum quantity; end dates did not line up; hollow promises could pass rubric point 3. | Brief gives the 500-unit need and authority to share up to one month of overtime; walkaway names 500 units and "until the furnace is repaired next month"; rubric 3 now asks for stock and shifts and quantities he can deliver. Brief trimmed to 109 words. |
| TPL-2 | Walkaway named three owners, good outcome four; walkaway left out the $0.5M condition; "+0.2" sign unclear; rubric 4 not in the outcome. | Walkaway: an owner for each bridge line and at least $0.5M in two quarters; brief says "+0.2 (a gain)"; good outcome includes the board message and check-in date. |

## Not changed, for review
- TP-3 holding cost "about $3 a unit until they ship" is a flat figure; units held longer cost more. Left as stated.
- TP-1 names owners (plant manager, procurement lead, planning manager) that the packet does not list; they are roles, not facts.
