# Blind check report (ASQ CSSGB study app)

Answers were computed blind from /tmp/blind2/questions.txt and lesson-numbers.txt only. Numbers were recomputed in Python (script /tmp/blind2/calc.py).

## Answers and confidence (82 high, 8 medium, 0 low)

| id | answer | confidence |
|---|---|---|
| OV-01 | C | high |
| OV-02 | A | high |
| OV-03 | B | high |
| OV-04 | D | high |
| OV-05 | C | medium |
| OV-06 | A | high |
| OV-07 | B | high |
| OV-08 | D | high |
| OV-09 | B | high |
| OV-10 | A | medium |
| OV-11 | B | high |
| OV-12 | C | high |
| OV-13 | D | high |
| OV-14 | C | high |
| OV-15 | B | high |
| OV-16 | D | high |
| AN-01 | C | high |
| AN-02 | D | high |
| AN-03 | B | high |
| AN-04 | A | high |
| AN-05 | C | high |
| AN-06 | D | high |
| AN-07 | C | high |
| AN-08 | A | high |
| AN-09 | B | high |
| AN-10 | B | high |
| AN-11 | C | high |
| AN-12 | A | medium |
| AN-13 | D | medium |
| AN-14 | A | high |
| AN-15 | B | high |
| AN-16 | C | high |
| AN-17 | B | high |
| AN-18 | D | medium |
| AN-19 | B | high |
| AN-20 | C | high |
| AN-21 | D | high |
| AN-22 | C | high |
| AN-23 | B | high |
| AN-24 | A | high |
| AN-25 | B | high |
| AN-26 | C | high |
| AN-27 | D | high |
| IM-01 | C | high |
| IM-02 | B | high |
| IM-03 | A | high |
| IM-04 | D | high |
| IM-05 | D | high |
| IM-06 | A | high |
| IM-07 | B | high |
| IM-08 | C | high |
| IM-09 | B | high |
| IM-10 | A | high |
| IM-11 | D | high |
| IM-12 | C | medium |
| IM-13 | C | high |
| IM-14 | B | high |
| IM-15 | D | high |
| IM-16 | A | high |
| IM-17 | C | medium |
| IM-18 | D | high |
| IM-19 | B | high |
| IM-20 | B | high |
| IM-21 | C | high |
| IM-22 | A | high |
| IM-23 | D | high |
| IM-24 | B | high |
| CO-01 | B | high |
| CO-02 | C | high |
| CO-03 | A | high |
| CO-04 | D | high |
| CO-05 | B | high |
| CO-06 | A | high |
| CO-07 | C | high |
| CO-08 | D | high |
| CO-09 | B | high |
| CO-10 | A | high |
| CO-11 | C | high |
| CO-12 | A | medium |
| CO-13 | D | high |
| CO-14 | B | high |
| CO-15 | C | high |
| CO-16 | B | high |
| CO-17 | D | high |
| CO-18 | A | high |
| CO-19 | B | high |
| CO-20 | C | high |
| CO-21 | D | high |
| CO-22 | A | high |
| CO-23 | C | high |

Medium reasons: OV-10 (2.64% rounds to 2.6, 2.7 is a near distractor); AN-13 (B, repeat with a larger sample, is mildly defensible); AN-18 (stem s values give F = 9.94, key is 9.96); IM-12 (Motion vs Transportation turns on person-vs-product convention); CO-12 (np is right only because a p chart is not offered); IM-17 (standard inventory is an element only if read as standard WIP); AN-12 (z-value rounding, 42.03 gives 43); OV-05 (leading vs lagging judgement).

## Flags

1. AN-18: the stem gives s = 0.0558 and 0.0177. Squared ratio from those numbers is 9.94, not 9.96 (lesson an-6 also says 9.96, presumably from unrounded data). Distractor A, 3.16, is the ratio of s. Fix: give s to more digits (the ones that reproduce 9.96) or change the key and lesson to 9.94.
2. OV-10: 38/1440 = 2.64%. Keys 2.6% (A) and distractor 2.7% (B) are one rounding apart. Fix: change B to 26% or 5.3%, or state to the nearest tenth explicitly.
3. AN-13: B ("repeat with a larger sample") is defensible; D is the intended practical-significance point. Fix: reword B to something clearly wrong, for example "Conclude the process is badly off target".
4. CO-12: correct only because a p chart is not among the options; np (constant n = 200) and p are both valid. Fix: add "p chart" as a distractor with a stem that makes n vary, or accept either, or keep as is and note that n is constant.
5. IM-17: standardized work's third element is standard in-process inventory (WIP). Option D "Standard inventory" is close enough that a reader could hesitate. Fix: label D "Standard in-process inventory" and keep C as the non-element.
6. IM-12: Transportation (A) is a plausible pick for walking 40 m. Fix: say "walks" and add "to fetch tools" (already implied) or replace A with Defects.
7. Giveaway pattern (stem or option wording): the correct option is the longest in 39 of 90 questions (43%; chance is about 25%). Worst cases are the conceptual items: OV-04, OV-08, OV-15, AN-05, AN-06, AN-08, AN-13, AN-17, AN-20, AN-26, IM-04, IM-07, IM-11, CO-01, CO-02, CO-03, CO-05, CO-21, CO-22. Fix: lengthen or trim distractors so lengths are comparable.
8. AN-01: the stem states "hour means rise steadily", which gives away Temporal. Fix: describe the numbers without the word "rise steadily" or ask the reader to read the chart.
9. AN-04: option B (0.990) is r-squared, A is r; fine, but keep. No change needed.
10. CO-04: option B (one point exactly on the center line) and C (three points in a row within 1 sigma) are clearly non-signals; fine. No change needed.
11. Answer-letter balance is acceptable: A 19, B 26, C 24, D 21.

No question had no correct option. Multiple defensible options: AN-13 (B), CO-12 (p), IM-12 (A), arguably OV-10 (B on rounding).

## Lesson numbers

Checked all 53 paragraphs in the file; 38 contain numbers I could recompute or check arithmetically. Counts below are the numbers I recomputed or checked arithmetically; everything not listed here was text only.

- ov-1 P1, P3, ov-2 P1: no numbers beyond 3.4 DPMO and 1.5 sigma (3.4 DPMO at 1.5 sigma shift: matches the standard definition; I did not recompute from normal tail). Matched.
- ov-3 P3: 960 - 60 = 900; 900/360 = 2.5 min = 150 s; 12/2.5 = 4.8 so 5; 900/3 = 300 a day, 60 short. 4 numbers, all matched.
- ov-4 P3: PCE 38/1440 = 2.64% (2.6%); halved lead time 5.28% (5.3%); three 8-hour days = 1440. All matched.
- ov-6 P2: RPN A 54, B 150, C 112. P3: B after re-rate 50. All matched.
- an-1 P2: 4 x 3 x 3 = 36 readings. Matched. an-1 P3: 25.080 - 25.010 = 0.070 matched, but "at least 12 times either of the others": 0.070/0.006 = 11.7. ERROR (see below). The raw data was not available, so the means 0.004 and 0.006 could not be recomputed.
- an-2 P2 and an-3 P1: r = 0.99478 (0.995), r-squared = 0.98959 (0.990), slope 0.31048 (0.3105), intercept -5.3048 (-5.30), +10 C = 3.10 N. All matched.
- an-3 P2: SE slope 0.013000, t = 23.88 (23.9), df 6, p = 3.5e-7 (0.0000004), R-squared 0.990. All matched.
- an-3 P3: fitted at 172 = 48.097 (48.10 matched); CI 47.706 to 48.489 (47.71 to 48.49 matched); PI 46.994 to 49.200 (46.99 to 49.20 matched). 
- an-3 P4: 240 C gives 69.21 (69.2 matched).
- an-4 P2: z = 0.1/(4/100) = 2.5; two-sided p = 0.0124 (0.012). Matched.
- an-4 P3: n = 42.03 (42.0, so 43); power 0.80 gives 31.4 (32); delta 1 gives 168.1 (169). All matched.
- an-5 P1: mean 501.73, s 1.7588 (1.759), t = 3.110 (3.11), df 9, critical 2.262, p = 0.01251 (0.0125). All matched.
- an-5 P2: means 12.5625 (12.563) and 11.700, pooled s 0.525, t = 3.286 (3.29), 14 df, p = 0.00541 (0.0054), critical 2.1448 (2.145). All matched.
- an-5 P3: mean difference 0.6375, s_d 0.3662 (0.366), t = 4.924 (4.92), 7 df, p = 0.001706 (0.0017); independent t = 1.095 (1.09; rounds to 1.09 or 1.10, 1.0948 rounds to 1.09), p = 0.2921 (0.292). All matched.
- an-6 P1: F from the stated s values 9.94; the lesson gives 9.96. Upper critical value 4.026 (4.03 matched), p = 0.00213 (0.0021 matched). F 9.96 not reproducible from the stated rounded s; plausible from unrounded raw data (not provided). Reported as a minor rounding item, not an error.
- an-6 P3: SST from means = 9.408; MST 4.704; MSE = 0.22967 (0.2297); total 12.164; F = 20.48; critical 3.885 (3.89); p = 0.000135 (0.00014). All matched.
- an-7 P1: pooled p = 0.065; z = 2.2946 (2.29); p = 0.02175 (0.0218); not significant at 0.01. All matched.
- an-7 P2: NIST 3 x 4 table df = 6; chi-square 19.18 gives p = 0.0039 (consistent with rejection). Matched.
- an-7 P3: expected 50 x 70/160 = 21.875 (21.88); df 4; critical 9.488 (9.49); p for chi-square 11.13 with 4 df = 0.02514 (0.0251). Matched. The chi-square 11.13 itself could not be recomputed (table not provided).
- an-8 P2: gap 13 points; 216 and 60 late; 156 fewer. All matched.
- an-9 P4: 0.02 x 0.05 = 0.10%; OR = 6.90%. Matched.
- im-1 P3: 2^3 = 8, 2^4 = 16 (NIST example 16 with replication), 2^5 = 32, half fraction 16, 3^3 = 27. All matched.
- im-2 P1 to P3: A high mean 78.5, A low 64.5, effect 14; B 76.0 - 67.0 = 9; interaction (20 - 8)/2 = 6; (86 - 66) = 20, (71 - 63) = 8. All matched.
- im-4 P3: 180 x 2 x 1.15/25 = 16.56 so 17; without safety 14.4. Matched.
- im-6 P1: batch first unit at 151, order at 200; one-piece 4 and 53. Matched.
- im-6 P4: 80 - 30 = 50; 50 - 20 = 30; 30 x 0.6 = 18; reduction 77.5%. Matched.
- co-1 P4: limits 49.16 and 51.24 centered on 50.20 (symmetric); points 9 to 17 inclusive = 9. Matched (the chart data itself was not available).
- co-3 P2: A2 from integration 0.5768 (0.577); limits 49.16 to 51.24 (49.161 and 51.239); D4 = 2.1145, so 3.81 (2.114 x 1.80 = 3.805, 3.81 matched with the 2.114 or 2.115 constant); D3 = 0 for n = 5. Matched.
- co-3 P3: d2(5) = 2.3259 (2.326); sigma = 1.8/2.3259 = 0.7739 (0.774); D4 n = 5 = 2.114499 (rounds to 2.114, see Facts).
- co-3 P4: c4(5) = 0.93999 (0.9400); A3 = 1.4273 (1.427); B4 = 2.0890 (2.089); B3 formula gives -0.089 so 0; limits 49.10 and 51.30 (49.101, 51.299); s chart UCL 1.6085 (1.61); c4(10) = 0.97266 (0.9727). All matched.
- co-3 P5: mean 24.70, MR-bar 0.99091 (0.991); limits 22.065 and 27.335 (22.07 and 27.33; the upper 27.335 rounds to 27.34 at two decimals; the stated 27.33 reflects 1.128 rounding. Stated vs exact differ by 0.005, treat as rounding); MR chart UCL 3.2673 x 0.991 = 3.237 (3.24). Matched. Note CO-11 option C 27.33 depends on this rounding; with 1.128 exactly, UCL = 27.3354 so 27.34 with d2 = 1.1284. Option C is still the closest, but a student using 1.128 gets 27.335.
- co-4 P2: p UCL 0.08898 (0.0890), LCL 0.00102 (0.0010); n = 100 UCL 0.10719 (0.1072). Matched.
- co-4 P3: np center 9.0; limits 0.205 (0.20) and 17.795 (17.80). Matched.
- co-4 P4: c UCL 13.670 (13.67), LCL -1.270 (-1.27); NIST c = 16 gives 4 and 28. Matched.
- co-4 P5: u UCL 3.2971 (3.297); LCL -0.097, so none. Matched.

Total: 38 paragraphs with recomputable numbers, about 150 individual numbers checked. Mismatches: 1 clear numeric error (an-1 P3 "at least 12 times"), 1 not reproducible from stated inputs (F = 9.96 vs 9.94 from rounded s), 1 rounding note (co-3 P5 upper limit 27.335).

Numeric errors found: 1 (an-1 P3). Fix: change "at least 12 times" to "at least 11 times", or "more than 11 times either of the others".

## Facts

- co-3 P3: the lesson says NIST prints D4 = 2.115 at n = 5. The standard tables (ASQ, Montgomery, NIST 6.3.2.1) show D4 = 2.114 for n = 5, and my integration gives 2.114499. I recalled this from memory and did not look up NIST, so treat it as unverified; the likely fix is to say the app matches the printed table exactly, including D4 = 2.114.
- co-1 P3: the supplementary rules (10 of 11, 12 of 14, 16 of 20) are not on the standard Western Electric/Nelson list that I know; the ASQ page lists the rules as quoted, but I did not check this against the page. Verify before presenting them as "ASQ lists".
- ov-6 P1: the 1940s US military origin of FMEA is correct (MIL-P-1629, 1949).
- ov-1: "3.4 DPMO assumes a 1.5-sigma long-term drift" is correct.
- co-3 P1: the subgroup size guidance (R for 2 to 9, s for 10 or more) is common CSSGB teaching and consistent with the BoK.
- im-1 P3: "NIST's example replicates each setting twice for 16" I could not verify.
- Questions: OV-13 is correct (DMADV = define, measure, analyze, design, verify); IM-17 (takt time, work sequence, standard WIP) matches the usual three elements; CO-19 and CO-20 follow the usual audit-party definitions.
