# Blind check, supply chain mock exam (150 questions)

Answered 150/150. High confidence 143, medium 5, low 2. Letter spread A 38, B 38, C 39, D 35.
Numeric questions recomputed in Python: 41 (script /tmp/blind3b_check.py). Every keyed-looking value follows from the stem inputs except the garbled SC1-12 stem noted below.

## Medium / low confidence
- MK-SC1-12 (low): stem lists errors "80,000, 100,000, 6, 10", which are not the errors from SC1-11 (8, -4, 6, 10). Bias 5.0 = sum 20 / 4 using actual minus forecast, so positive means forecast runs low (A). Sign convention is not stated in the stem; with forecast minus actual it would flip.
- MK-SC2-11 (medium): Responsiveness (C) is the answer, but Reliability is also customer-facing and is not offered, so it works only by elimination. Costs and Asset management are internal.
- MK-SC3-08 (medium): "high-spend, one qualified supplier, hard to replace" fits Kraljic strategic (partnership), but a reader could argue bottleneck (also single-source). A is still the best option.
- MK-SC4-03 (medium): "comes first, at the highest level" answered S&OP; the stem does not say the scope is planning hierarchy. Reads fine, little ambiguity.
- MK-SC4-27 (medium): 400 x 0.5 x 1.1 / 50 = 4.4, answer 5 depends on rounding up, which the stem does not state.
- MK-SC4-12 (medium): obsolescence chosen as holding cost; inbound freight (B) belongs to purchase cost, order setup (A) to ordering cost. Fine, but a candidate counting freight as carrying cost could object.
- MK-SC6-14 (low): "buys its only supplier of a critical chip" read as acquiring the supplier (vertical integration). "Buys" could be read as purchases from, which would make it transactional or collaborative.

## Flags
Second option defensible
- SC1-12: sign convention unstated (see above).
- SC4-27: rounding unstated.
- SC6-14: "buys" is ambiguous (acquires vs purchases from).
- SC3-08: Kraljic strategic vs bottleneck.
- SC7-11: insurance (A) is a transfer, not mitigation, so it holds; no issue unless the learner treats insurance as mitigation.

Stem gives answer away
- SC6-02: "most would accept three days" nearly states the finding.
- SC3-10: "its absence stops assembly" states the supply risk answer.
- SC7-12 and SC3-19: stems name the signals so directly that distractors are weak.

Option factually wrong in an unfair way
- None found. SC5-08 is correct (DAP any mode; FOB, CFR, FAS are sea/inland waterway only).
- SC1-12: stem figures (80,000, 100,000) contradict the SC1-11 errors; this is a stem error, not an option error.

Options that mean the same
- SC2-06: A (volume each customer buys) and C (weighting of each location) are close to the same idea; both are wrong, so it does not change the key.

Cannot be answered from stem alone
- SC1-12 (needs the SC1-11 data and a sign convention; the stem figures are inconsistent).
- SC1-13 and SC4-18/19 are self-contained.
- SC8-05 assumes independence of variants; the stem for SC8-04 states it, SC8-05 only by reference to "those 9 variants".

Obvious tells
- Longest option is the key in 44/150 (29%), close to chance for 4 options (25%); no systematic length tell. Cases where the key is the longest and most specific: SC1-02, SC1-14, SC3-09, SC3-20, SC4-10, SC4-21, SC5-12, SC6-09, SC6-25, SC7-06.
- Hedged-option tell: SC3-16 D ("Nothing, if he documents it") is the only conditional option and it is wrong; SC7-08 and SC8-03 keys are the most specific options.
- Stem restates a number from the previous question (SC1-12, SC4-15, SC4-19, SC8-05), so those can be keyed by chaining.

## Numeric recompute summary
SC1: 04, 05, 08, 09, 10, 11, 12, 13. SC2: 04, 05, 10. SC3: 04, 05, 14, 15, 17, 22. SC4: 04, 08, 14, 15, 17, 18, 19, 22, 24, 25, 27. SC5: 04, 05, 06, 07. SC6: 04, 07, 16, 23. SC7: 07, 08, 14. SC8: 04, 05. Total 41.
Traps noted: SC1-05 (2,880 if the annual forecast is multiplied by the index), SC3-22 (6,000 is the supplier share, 14,000 is the fee), SC5-04 (the LTL cost is $2,700, saving $700), SC6-16 (88.3 is the unweighted mean).
