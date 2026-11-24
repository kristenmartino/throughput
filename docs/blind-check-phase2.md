# Blind check, Phase 2 (Nov 24, 2026)

Checker: Claude Sonnet (subagent), given `questions.txt` (90 items from Overview, Analyze, Improve and Control; no key, no explanations) and `lesson-numbers.txt` (53 lesson paragraphs that state numbers), exported by `node tools/export-blind.js <dir> overview,analyze,improve,control`. The key was kept in a separate folder the checker was told not to open. Its full report: `docs/blind-check-phase2-answers.md`.

## Result (Measured)
- **90 of 90 keyed answers agree** with the checker's own answers (compared by script against `key.json`). 82 high confidence, 8 medium (OV-05, OV-10, AN-12, AN-13, AN-18, IM-12, IM-17, CO-12), 0 low.
- Lesson numbers: about 150 numbers recomputed in Python across 38 numeric paragraphs. One wording error, one reproducibility gap, one rounding note (below). Regression, intervals, t, F, chi-square and z tests, ANOVA, sample size, control limits and constants, takt, PCE, RPN, kanban, SMED and DOE effects all matched.

## Flags and what was done
| Id | Flag | Fix |
|---|---|---|
| an-1 ¶3, AN-01 | "At least 12 times": from the printed 0.070 and 0.006 the ratio is 11.7 (the code's 12.0 uses unrounded values) | Now "more than ten times", with both spreads printed |
| AN-01 | "Hour means rise steadily" in the stem gives the answer away | Stem now points to the lesson's readings and chart only |
| an-6 ¶1, AN-18 | F = 9.96 cannot be reproduced from s printed to 4 decimals (gives 9.94) | Lesson and stem now print the variances (0.003111 and 0.0003122), which give 9.96 |
| OV-10 | Options 2.6% and 2.7% one rounding apart | The 2.7% option replaced by the calendar-time error (0.9%) |
| AN-13, CO-12, IM-12, IM-17 | Medium confidence: a second option mildly defensible | No change: each explanation already names the distinction (repeating the test cannot change a practical judgment; a p chart would also work but is not offered; motion is people moving, transportation is material; "standard inventory" is the Lean Enterprise Institute's term) |
| co-3 ¶5 | The I-chart limit is 27.3345, printed 27.33; from rounded MR̄ the checker got 27.335 | No change: the printed value is correct to two decimals |
| co-3 ¶3 | Checker recalled D4(5) = 2.114 and doubted NIST prints 2.115 | No change: NIST's table was read twice this session and prints 2.115; the lesson already gives both |
| co-1 ¶3 | Checker could not confirm ASQ lists "10 of 11, 12 of 14, 16 of 20" | No change: read on ASQ's control chart page this session |
| Pattern | The keyed option is the longest in 39 of 90 (43%) | Fixed later the same day on Kristen's request, across all six decks, with a build rule: `docs/blind-check-option-lengths.md` |

## Also done before the check
- Five questions that rely on a lesson's chart or data set (AN-01, AN-04, IM-05, IM-06, CO-01) are marked `mock: false` and never drawn into the timed mock; each deck still has enough stand-alone questions for its draw (build enforces).
