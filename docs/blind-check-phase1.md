# Blind check, Phase 1 (Nov 24, 2026)

Checker: Claude Sonnet (subagent), given `questions.txt` (60 items, no key, no explanations) and `lesson-numbers.txt` (32 lesson paragraphs that state numbers), exported by `tools/export-blind.js` from build 03013e8. Full answers: `docs/blind-check-phase1-answers.md`.

## Result (Measured)
- **60 of 60 keyed answers agree** with the checker's own answers (compared by script against `key.json`). 57 high confidence, 3 medium.
- Lesson numbers: every stated number recomputed by the checker in Python; **no errors**.

## Flags and what was done
| Id | Flag | Fix |
|---|---|---|
| DF-08 | "Most at risk of being hurt" is ambiguous; the policyholder is also defensible | Stem rewritten to name the change (incomplete files passed on) and ask which customer absorbs the extra work; whyNot for the policyholder updated |
| MS-21 | "Needs calibration or repair" goes beyond what the slope test shows | Option shortened to "nonlinear across the range"; the remedy moved to the explanation and attributed to NIST |
| DF-05 | Medium confidence: some texts call cross-industry benchmarking functional or generic | Explanation now names those terms; key unchanged |
| ms-8 ¶2 | Checker could not confirm NIST's sample-size wording from memory | No change: read on the NIST capability page this session (about 50 independent values; n ≥ 100 for capability studies), tagged Read |

Not changed: the keyed option is sometimes the longest, as in other apps' checks.
