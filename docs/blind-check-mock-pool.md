# Blind check: held-out mock pool (Phase 2b, Nov 24)

**Method.** `node tools/export-blind.js <dir> pool` wrote the 110 pool questions without keys or explanations. Claude Sonnet received only that file, answered every question, and ran all arithmetic in Python/scipy. A script then compared its answers with `key.json`. The checker's full table is in `blind-check-mock-pool-answers.md`.

**Result (Measured).** It agreed with the key on 110 of 110 questions. It recomputed every option number and found none wrong, and judged answer positions not skewed. It flagged 6 items for wording. Rewritten items went to fresh Sonnet runs that saw only those items, until none was flagged.

| Item | Flag | Fix | Re-check |
|---|---|---|---|
| MK-DF-21 | COPQ convention unstated; $87k, $107k and $115k each defensible | Stem now says "counting internal and external failure costs" | Clean (A, high) |
| MK-AN-08 | One- or two-sample not stated | Stem says one-sample, normal approximation, rounded up (2 rounds) | Clean (A, high) |
| MK-IM-07 | Try-storming also defensible for a bench test | Replaced with "A control plan" | Clean (B, medium-high; "pilot" a mild distractor) |
| MK-DF-04 | "Functional" benchmarking not offered | Options carry a gloss; key reads "Best-practice (functional) benchmarking" | Clean (C, high) |
| MK-DF-07 | Key longest; one distractor a strawman | Options rewritten to similar length and plausibility | Clean (B, high) |
| MK-IM-08 | Distractors plainly bad practice | Round 1: four full plans; still answerable by option pattern (each distractor = key with one feature changed). Round 2: single-attribute stem (what to compare pilot results with) | Clean (A, high) |

**Checker claims not taken.** Twice the checker said the IM-08 key was the longest option. Measured character counts: round 1, 48 vs 55/54/48; round 2, 46 vs 49/50/47. Neither key is the longest. `build.js` enforces the option-length rules (key ≤ 1.3 × the longest distractor; key strictly longest in ≤ 30% of each section) on the pool as on the decks.

**Not done (Untested).** No second-model check of the `why`/`whyNot` text beyond the keyed answer. Kristen has not reviewed the pool; every item is labelled Draft.
