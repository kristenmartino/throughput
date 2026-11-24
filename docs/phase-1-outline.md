# Phase 1 taster: Define and Measure decks — proposed outline (for Kristen's approval; nothing built yet)

Scope from the ASQ 2022 CSSGB Body of Knowledge (Read; `docs/sources.md`). ASQ publishes section counts only (Define 20, Measure 20 of 100 scored), not subtopic weights, so the split of questions inside a deck is my judgment (Inferred), leaning toward topics ASQ tests at Analyze or Evaluate.

## How a deck works (app code; no study-kit change)
- **Deck page** `#deck-define`, `#deck-measure`: the lessons in BoK order, a Practice button and a Recall cards button, and your progress.
- **Lesson** `#lesson-df-1`: short prose, every paragraph tagged Read, Relayed or Inferred with its source linked; then that lesson's questions.
- **Questions** `DF-01`…, `MS-01`…: four options, one key, why it is right, why each other option is wrong, the BoK code (e.g. II.E.1) and ASQ's cognitive level for that topic. Numbers in calculation items come from code (JS, checked against Python).
- **Practice** `#practice-define`: 10 questions drawn from the deck, feedback after each, result saved per question.
- **Recall cards** `#cards-define`, `#cards-measure`: term or formula on the front, meaning and a worked number on the back; mark Again or Got it, saved. No spaced-repetition schedule in the taster.
- Saved to your account in `data/users/<uid>/decks` through study-kit's store; idle-write check as for prefs.
- Everything carries the Draft label until you review it.

## II. Define (20 scored questions) — 9 lessons, 30 questions, 20 cards

| Lesson | BoK | Covers | Questions |
|---|---|---|---|
| df-1 Choosing a project | II.A.1–2 | When DMAIC fits vs. a just-do-it fix or DMADV; process components and boundaries; cross-functional hand-offs | 3 |
| df-2 SIPOC, benchmarking, stakeholders | II.A.3–5 | Building a SIPOC; competitive, collaborative and best-practice benchmarking; process owner vs. stakeholders | 3 |
| df-3 Voice of the customer: who and how | II.B.1–2 | Internal and external customers; surveys, focus groups, interviews, observation; removing bias and ambiguity from questions | 2 |
| df-4 From needs to measures | II.B.3 | CTQ trees, CTX, Kano categories, QFD (house of quality) with weighted needs | 4 |
| df-5 Charter, scope and metrics | II.C.1–4 | Agile vs. top-down methods; charter parts; a problem statement with baseline and goal; scoping with process maps and Pareto; primary and consequential metrics | 4 |
| df-6 Planning, risk and closure | II.C.5–8 | WBS, Gantt, critical path (CPM) and PERT estimates computed on a small network, toll-gate reviews; project documentation; project risk and RPN; closure against the charter | 4 |
| df-7 Management and planning tools | II.D | Affinity, interrelationship digraph, tree, prioritization matrix, matrix diagram, PDPC, activity network, SWOT: which tool for which question | 3 |
| df-8 Business results | II.E.1–2 | DPU, RTY, DPMO, sigma level, COPQ computed from one worked process; top-down, bottom-up and horizontal communication | 4 |
| df-9 Teams | II.F.1–4 | Forming to adjourning; groupthink, feuding, floundering; RACI and Six Sigma roles; brainstorming, nominal group technique, multivoting | 3 |

Cards (20): SIPOC, CTQ, CTX, Kano's three categories, QFD, charter parts, SMART goal, primary vs. consequential metric, WBS, critical path, PERT expected time, toll gate, RPN, the seven management and planning tools (one card), DPU, RTY, DPMO, COPQ, Tuckman's stages, RACI.

## III. Measure (20 scored questions) — 9 lessons, 30 questions, 24 cards

| Lesson | BoK | Covers | Questions |
|---|---|---|---|
| ms-1 Process maps and documents | III.A | Flowcharts, swim lanes, value-stream and spaghetti views; checking procedures and work instructions against the map | 2 |
| ms-2 Probability | III.B.1 | Independent and mutually exclusive events, addition and multiplication rules, permutations and combinations | 4 |
| ms-3 Central limit theorem | III.B.2 | Sampling distribution of the mean, standard error, why it matters for intervals, tests and control charts (a simulation in code shows it) | 2 |
| ms-4 Distributions | III.C | Normal, binomial, Poisson, chi-square, t and F: what each models and where Green Belts meet it | 4 |
| ms-5 Data and sampling | III.D.1–2 | Continuous vs. discrete; nominal, ordinal, interval, ratio; random and stratified sampling; check sheets, data coding, bad and missing values | 3 |
| ms-6 Describing data | III.D.3–4 | Mean, median, mode, range, standard deviation, frequency and cumulative tables; histogram, box plot, stem-and-leaf, scatter, normal probability plot | 4 |
| ms-7 Measurement system analysis | III.E | Repeatability and reproducibility, %GR&R and P/T computed, bias, linearity, attribute percent agreement | 3 |
| ms-8 Capability studies | III.F.1–2 | Natural limits vs. specification limits; stability and normality before a capability study | 2 |
| ms-9 Capability indices | III.F.3–4 | Cp, Cpk, Pp, Ppk computed, when Cpm applies, sigma level, short- vs. long-term data and the 1.5-sigma shift convention (tagged as a convention, not a law) | 6 |

Cards (24): four scales of measurement, addition rule, multiplication rule, permutations, combinations, CLT and standard error, the six distributions (one card each), mean vs. median, standard deviation, box plot, %GR&R, P/T ratio, bias, linearity, Cp, Cpk, Pp vs. Ppk, sigma level, the 1.5-sigma shift.

## Sources to open before writing (none copied; practice-exam questions are never used)
- ASQ 2022 CSSGB BoK and exam page (Read).
- ASQ's free Quality Resources pages for SIPOC, VOC, Kano, QFD, charters, the seven management and planning tools, COPQ, team stages (to open).
- NIST/SEMATECH e-Handbook of Statistical Methods for distributions, the CLT, gauge studies and capability indices (to open).
- Tuckman (1965) and Tuckman and Jensen (1977) for team stages, if an open copy exists; otherwise Relayed through ASQ.

## Checks (as for Blast Radius)
- Every number in a lesson, question or card is computed in `math/` (JS) and recomputed in Python; the build fails on any difference.
- A second model answers all 60 keyed questions blind; disagreements and fixes recorded in `docs/blind-check-phase1.md`.
- Playwright at 360/390/414 px in light and dark for every new screen, plus the idle-write check for the decks document.
