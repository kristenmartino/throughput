# Option-length fix and re-check (Nov 24, 2026)

The Phase 2 blind check found the keyed option was the longest in 39 of 90 questions. Kristen asked for it to be fixed (04:25 ET). Measured on the printed text across all six decks before the fix:

| Deck | Key strictly longest | Key > 1.3 × longest distractor |
|---|---|---|
| Overview | 5/16 | 3 |
| Define | 15/30 | 10 |
| Measure | 10/30 | 9 |
| Analyze | 11/27 | 5 |
| Improve | 10/24 | 6 |
| Control | 8/23 | 3 |
| **All** | **59/150 (39%)** | **36** |

## What changed
- The options of those 36 questions were rewritten (`tools/option-lengths-nov24.json`, applied by `tools/apply-options.js`): answers shortened, distractors given the same specificity. Keys, key positions, ids, stems and explanations unchanged, except DF-14's option D (now "Average talk time per call", a restatement of the primary metric, with its explanation), DF-13's D explanation, CO-05's C explanation and CO-05's stem (now asks about the chart's ability to detect shifts).
- A re-check of the 36 flagged six wording tells that held up (DF-13 only option with figures, DF-14 D defensible, OV-15 echoing the stem, MS-27 business wording, IM-07 hedged, CO-05 only option with a mechanism); those six were reworded again (`tools/option-wording-nov24.json`).
- **Build rule** (`build.js`): every keyed option is at most 1.3 times its longest distractor, and is the strictly longest option in at most 30% of a deck's questions. The build fails otherwise.

## After (Measured)
- Key strictly longest: 36/150 (24%; 25% is chance). Overview 2/16, Define 8/30, Measure 5/30, Analyze 8/27, Improve 7/24, Control 6/23. Largest key-to-distractor ratio 1.28. Key strictly shortest: 12/150, so no reverse tell.
- Blind re-check (Claude Sonnet, no key): **36/36** of the rewritten questions agree with the key (28 high, 7 medium, 1 low confidence); the six reworded again: **6/6**, all high. No question had two defensible options or none.
- Left as is: DF-04's "Per ASQ" (read on ASQ's SIPOC page in Phase 1); DF-19 hedged wording; the residual "most specific option" tell in DF-13, DF-14 and CO-05, where the answer has to carry the specific content.
- Full reports: `docs/blind-check-option-lengths-answers.md`.
