# Blind check, Phase 3b: CSCP held-out mock pool (Nov 24, 2026)

**Checker:** Claude Sonnet, run as a subagent. It received `questions.txt`, the 150 pool questions with no key and no explanations. The key was kept in a separate folder that the checker was told not to open. Its full report is `docs/blind-check-phase3b-answers.md`.

## Result (Measured)
- **150 of 150 keyed answers agree** with the checker's own answers, compared by script against `key.json`. Confidence: 143 high, 5 medium, 2 low.
- All 41 numeric questions were recomputed in Python. Every value matched an option, except in MK-SC1-12, whose stem was garbled (below).
- The key is the longest option in 44 of 150 questions (29%), close to the 25% expected by chance.

## Flags and what was done
| Id | Flag | Fix |
|---|---|---|
| MK-SC1-12 (and the why of MK-SC1-11) | The errors printed as "80,000, 100,000, 6, 10". Cause: the key names `mc.e1` and `mc.e2` were used both for forecast errors and for the risk deck's expected losses, so the later assignment overwrote the earlier one in both JS and Python. That is why the cross-check passed. | The risk keys were renamed `el1` and `el2`. A check found no other repeated key within any group. The stem is now self-contained and defines error as actual − forecast. |
| MK-SC6-14 | "Buys its only supplier" could mean buying *from* the supplier. | Now "acquires the company that is its only supplier". |
| MK-SC4-27 | The stem did not say to round up. | Now asks for the answer "in whole cards". |
| MK-SC6-02 | "Most would accept three days" gave the answer away. | The stem now describes only the uniform next-day service. |
| MK-SC3-10 | "Its absence stops assembly" gave the answer away. | Now "has no qualified substitute". |
| MK-SC2-11, MK-SC3-08, MK-SC4-03, MK-SC4-12 | Medium confidence. | No change. In SC2-11, Reliability is not offered, so only one option is customer-facing. In SC3-08, high spend makes the item high impact, which rules out bottleneck. In SC4-03, the S&OP plan is the top of the planning hierarchy that the lesson teaches. In SC4-12, freight is a transport cost in the lesson's list. |
| MK-SC4-15, MK-SC4-19, MK-SC8-05 | These reuse numbers from the question before. | No change: each stem states the numbers it needs. The mock shuffles questions within each module, so they rarely appear in sequence. |
