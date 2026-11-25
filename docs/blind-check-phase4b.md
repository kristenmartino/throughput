# Blind check, Phase 4b (TPN-1 DMAIC on a P&L)

Checker: Claude Sonnet, given only the briefing, the rules and the lesson text (no engine code). It wrote its own
simulator (Python) and an exhaustive search (C++, every assignment of the 11 moves to a month or never). Full report:
`blind-check-phase4b-answers.md`.

## Results (Measured by the checker, compared with math/dmaic.js)
- Do nothing $2,496,000; best 8 months $2,852,960; best 6 months $2,163,552. All match the engine.
- Every lesson score, gap, spend and counted saving matches, under the reading that two unpiloted fixes in one month
  cost the next month's output once (the engine's rule).
- End defect rate is 2.45%; the lesson printed 2.5%.

## Fixes
| Flag | Fix |
|---|---|
| Same-month disruption not stated; the other reading breaks lessons 3–5 | Briefing states it costs once; build asserts it |
| End rate 2.5% vs 2.45% | Printed to two decimals |
| Slip "by a third" (setup unanalyzed slips 40%) | "about a third" |
| Each move once; "Other" has no fix | Stated in the briefing |
| Counted-saving formula not given | Stated: lowest of last three months × $48 (sale plus handling) × 12, control plan required |
| Control plan before a fix; month t+2; late plan | Stated: one control plan covers later fixes; slip starts if none within 2 months; a late plan does not undo a slip |
| Lesson 1 implied a unique best plan (4 tie) | Says several plans tie; build asserts the control-a-month-earlier tie |
| Lesson 2: loss is the decoy rule, not skipping Measure | Says the bar-stock fix removes nothing in this plant and Measure would have shown the log was wrong |
| Lesson 3: gap is not all the one-third effect; hindsight | Names the counted saving ($97,920 vs $293,760) and the debugging month; notes the causes are known only in hindsight; build asserts the hunch counts less |
| Lesson 5: "failed rollout" is not modeled | Now "the month of debugging it prevents" |
| Within-month order | No change: the briefing already says a prerequisite can come earlier in the same month |

Build and tests after the fixes: build passes (JS = Python), 2257 tests passed, 0 failed.
