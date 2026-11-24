# Blind check answers

| id | answer | confidence | flag |
|---|---|---|---|
| DF-01 | B | high | none |
| DF-02 | C | high | none |
| DF-03 | A | high | none |
| DF-04 | D | high | none |
| DF-05 | B | medium | none (cross-industry = best-practice/functional; defensible only as B) |
| DF-06 | C | high | none |
| DF-07 | A | high | none (double-barreled) |
| DF-08 | D | medium | Ambiguous: "most at risk of being hurt" - policyholder (A) is also defensible if the change is rushed; D relies on internal downstream customers |
| DF-09 | C | high | none |
| DF-10 | A | high | none |
| DF-11 | D | high | none (45/44/28 verified) |
| DF-12 | B | high | none |
| DF-13 | C | high | none |
| DF-14 | B | high | none |
| DF-15 | D | high | none |
| DF-16 | A | high | none |
| DF-17 | D | high | none (14 days; C slack 4) |
| DF-18 | C | high | none (5.33) |
| DF-19 | A | high | none |
| DF-20 | B | high | none |
| DF-21 | D | high | none |
| DF-22 | A | high | none |
| DF-23 | B | high | none |
| DF-24 | B | high | none (30,000) |
| DF-25 | C | high | none (84.8%) |
| DF-26 | A | high | none |
| DF-27 | D | high | none ($95,000) |
| DF-28 | C | high | none |
| DF-29 | D | high | none |
| DF-30 | A | high | none |
| MS-01 | B | high | none |
| MS-02 | C | high | none |
| MS-03 | D | high | none (0.0961) |
| MS-04 | A | high | none (7%) |
| MS-05 | C | high | none (56) |
| MS-06 | A | high | none (0.0222) |
| MS-07 | D | high | none (2) |
| MS-08 | B | high | none |
| MS-09 | A | high | none |
| MS-10 | C | high | none (0.3487) |
| MS-11 | A | high | none (6.68%) |
| MS-12 | C | high | none |
| MS-13 | D | high | none |
| MS-14 | C | high | none |
| MS-15 | C | high | none |
| MS-16 | D | high | none (median 13) |
| MS-17 | A | high | none (4.62) |
| MS-18 | B | high | none |
| MS-19 | B | high | none (19.6%, marginal) |
| MS-20 | C | high | none (15%) |
| MS-21 | D | medium | Wording: slope differing from 1 shows nonlinearity per NIST; "needs calibration or repair" is slightly beyond what the test shows, but D is still the only defensible choice |
| MS-22 | B | high | none |
| MS-23 | C | high | none |
| MS-24 | D | high | none (1.11) |
| MS-25 | A | high | none (1.39) |
| MS-26 | B | high | none |
| MS-27 | D | high | none |
| MS-28 | B | high | none (4.17) |
| MS-29 | A | high | none |
| MS-30 | A | high | none |

## Task B findings

Recomputed with Python (standard library): no numeric errors found. Verified: QFD 45/44/28 and 13 vs 9; critical path 14 vs 10, slack 4; PERT 5.33 / SD 1.0 / plain mean 5.67; RPN 192; DPU 0.18; RTY 84.8%, mean yield 94.7%, e^-0.18 = 83.5%; DPMO 30,000; z for 30,000 DPMO = 1.88, sigma 3.38; COPQ 95,000, total 130,000; probabilities 0.9039/0.0961, 0.0222, 7%, 336, 56; SE 2 and n=144; binomial 0.3487 and 0.7361; Poisson 0.1353 and 0.1804; z=1.5, 0.0668; stats 14.67/13/mode 12 (4 times)/range 19/4.62/4.47/13.57; GR&R 0.20, 19.6%, 27.5%, P/T 15%, 12.9% at 5.15; Cp 1.39, Cpk 1.11, Pp 1.11, Ppk 0.89, Cpm 1.07; z 2.67/4.00, 3,862 ppm; 4.17; 3.4 DPM at z 4.5.

Claim to verify (not judged wrong): ms-8 para 2 sample-size figures ("about 50 independent values, 100 or more for capability studies") attributed to NIST; I could not confirm the wording from memory. Everything else stated factually is standard.
