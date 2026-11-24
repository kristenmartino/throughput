# Sources read (tags: Read = opened by this session; Relayed = from a secondary source or search text; Inferred)

## ASQ Certified Six Sigma Green Belt (opened Nov 24, 2026)

**2022 SSGB Body of Knowledge** — https://asq.org/cert/resource/pdf/certification/2022-SSGB-BoK.pdf (Read, through WebFetch's text extraction of the PDF; the extract is a summary, so wording below is paraphrase).

| Section | Scored questions | Topics (highest cognitive level) |
|---|---|---|
| I. Overview: Six Sigma and the organization | 11 | A. Six Sigma and organizational goals (value; goals and projects incl. SMART; drivers and metrics, KPIs, scorecards — Understand). B. Lean: TOC, value chain, flow, takt, JIT, Gemba, spaghetti diagrams, perfection (Apply); value-stream mapping (Understand). C. DFSS: DMADV vs IDOV (Understand); basic FMEA and RPN (Analyze); design vs process FMEA (Apply) |
| II. Define | 20 | A. Project identification: selection (Understand), process elements (Analyze), benchmarking (Understand), inputs/outputs and SIPOC (Analyze), owners and stakeholders (Apply). B. VOC: customer identification, customer data (Apply), requirements via QFD, CTX, CTQ tree, Kano (Apply). C. Project management basics: methodology incl. agile (Apply), charter and problem statement with baseline and goals (Apply), scope (Apply), primary and consequential metrics (Apply), WBS, Gantt, CPM, PERT, toll-gate reviews (Apply), documentation (Apply), risk analysis incl. RPN (Understand), closure (Apply). D. Management and planning tools: affinity, interrelationship digraph, tree, prioritization matrix, matrix diagram, PDPC, activity network, SWOT (Apply). E. Business results: DPU, RTY, COPQ, DPMO, sigma level, capability indices (Analyze); communication (Apply). F. Team dynamics: stages and negative dynamics (Understand), roles incl. RACI (Apply), brainstorming, nominal group, multivoting (Apply), team communication (Apply) |
| III. Measure | 20 | A. Process mapping and documentation review (Create). B. Probability: basic concepts, multiplication rules, permutations and combinations (Understand); central limit theorem (Understand). C. Distributions: normal, binomial, Poisson, chi-square, t, F (Understand). D. Data: types and scales (Analyze); sampling and collection plans (Apply); descriptive statistics (Evaluate); graphical methods (Create). E. MSA: GR&R, correlation, bias, linearity, percent agreement, P/T (Evaluate). F. Capability: natural vs specification limits (Evaluate); capability studies (Evaluate); Cp, Cpk, Pp, Ppk, Cpm, sigma level (Evaluate); short- vs long-term capability and sigma shift (Evaluate) |
| IV. Analyze | 18 | Multi-vari; correlation and regression; hypothesis testing; gap and root cause analysis |
| V. Improve | 16 | DOE; implementation planning; lean tools (waste, cycle time, kaizen) |
| VI. Control | 15 | SPC; control plan, document control, training, audits, PDCA; TPM, visual factory |

Total 100 scored. Cognitive levels follow Bloom's taxonomy, revised 2001 (Remember … Create); the level shown is the highest at which a topic is tested (Read).

**Exam page** — https://asq.org/cert/six-sigma-green-belt (Read): CBT 110 questions, 100 scored and 10 unscored; appointment 4.5 h, exam 4 h 18 min; English. Open book: bound references only (stitched, glued, ring, spiral or snap binders); no loose or hand-stapled pages; tabs allowed; on-screen calculator, or a silent non-programmable one. Fee $483; ASQ members save $100; retake $283. Three years of full-time, paid experience in one or more BoK areas; no education waivers. The page listed the "next CBT testing window" as Oct 1–31, 2026 with a Sept 14, 2026 deadline (dates as shown on Nov 24; check before booking).

## Beer Game (opened Nov 24, 2026)

**Sterman, J. D. (1987). Modeling Managerial Behavior: Misperceptions of Feedback in a Dynamic Decision Making Experiment. MIT Sloan WP-1933-87**, published as Management Science 35(3), 321–339 (1989). https://dspace.mit.edu/bitstream/handle/1721.1/2184/SWP-1933-18213539.pdf (Read, through WebFetch text extraction):
- Four sectors: retailer, wholesaler, distributor, factory, one person each (p. 11). No limit to factory capacity (p. 11).
- Start: inventory 12 cases at each sector; each shipping and production delay holds 4 cases; order slips read 4 (p. 12).
- Customer demand 4 cases a week, stepping to 8 in week 5 and staying there (p. 12).
- Costs: $0.50 per case per week held, $1.00 per case per week backlogged (p. 11).
- Players were told the game runs 50 weeks; play stopped at 36 to avoid horizon effects (p. 12). Players could not talk but could see other stations' inventories (p. 13).
- Ordering rule fitted to players: order = max(0, expected loss + α_S(S′ − S − β·SL)), expected loss adaptive with weight θ (p. 17). Mean estimates θ 0.36, α_S 0.26, β 0.34, S′ 17 (Table 4, p. 40).
- Benchmark: θ 0, α_S 1, β 1, S′ 28 (20 for the factory) (footnote 9, p. 28). Mean team cost $2,028 vs benchmark $204 (Table 2, p. 39); by sector benchmark $46 / $50 / $54 / $54.
- The extraction did not give the number of weeks in each delay; the text gives three and four weeks in different places (pp. 11, 20, 21).

**Delay structure** (Relayed): two weeks of order delay and two of shipping delay between stages, three weeks from production request to finished goods at the factory — Kaminsky and Simchi-Levi's computerized Beer Game description (Albany archive search text; not opened); the Temple MIS 3537 slides ("2 weeks order to ship, 2 weeks ship to delivery"; search text). The prototype reproduces Sterman's published benchmark exactly under this structure (Measured; see `docs/beer-game-rules.md`).

**Other descriptions consistent with the above** (Relayed or Read as marked): arXiv 2202.12786 (Read): start 12 on hand, 4 in each shipping slot and order slot; costs $0.50 / $1.00; Sterman's mean parameters as above.

## Lesson sources (opened Nov 24, 2026 for Phase 1; full list with tiers in `content/sources.js`)
- Read: ASQ pages on SIPOC, benchmarking, voice of the customer, Kano model, QFD, the seven management and planning tools, cost of quality; NIST/SEMATECH e-Handbook pages on process capability, repeatability, linearity and the gallery of distributions; Lee, Padmanabhan and Whang (1997), Sloan Management Review (course copy).
- Relayed (search text, not opened): Tuckman and Jensen (UF/IFAS summary); AIAG gauge R&R guideline (Minitab help); the 1.5-sigma shift (INFORMS Transactions on Education, 2015).
- Not available: ASQ's team-stages page returned an error. NIST's reproducibility page does not define operator reproducibility, so that definition is tagged Inferred.

## Phase 2 sources (opened Nov 24, 2026; full list with tiers in `content/sources.js`)
- **Exam scoring** (Read): ASQ exam-results FAQ, https://www.asq.org/cert/faq/faq-exam-results: "You need a score of 550 points out of a possible 750 to be certified"; passing candidates get no score. ASQ exam grading process, https://www.asq.org/cert/faq/exam-grading-process: the raw cut score is set by a Modified Angoff cut-score study, converted to a scaled score, and adjusted for harder forms by common-item equating; CSSGB pass rates 69% (2022), 76% (2023), 77% (2024). No raw percentage is published, so the mock shows percent right by section and no pass line. The candidate handbook PDF could not be fetched (robots).
- **Read**: ASQ pages on SPC, control charts (signal rules), PDCA, auditing (first/second/third party), fishbone, five whys, root cause analysis, relations diagram, scatter diagram, 5S, mistake proofing, continuous improvement, lean (eight wastes), value-stream mapping, Six Sigma, FMEA, DOE. NIST/SEMATECH e-Handbook: X-bar/R/S charts and the A2, D3, D4 table (6.3.2.1), c4 (6.3.2), individuals charts (6.3.2.2), attribute charts (6.3.3, 6.3.3.1, 6.3.3.2), hypothesis tests (7.1.3), two-sample t (1.3.5.3), F-test (1.3.5.9), one-way ANOVA (7.4.3, 7.4.3.4), contingency tables (7.4.5), least squares (4.1.4.1), model validation (4.4.4), two-level full factorials (5.3.3.3). Lean Enterprise Institute lexicon: takt time, SMED, jidoka, andon, TPM, kanban, standardized work, gemba. The BoK PDF again for sections I, IV, V and VI.
- **Relayed** (search text, not opened): Goldratt's five focusing steps (SlideShare excerpt of *What Is This Thing Called Theory of Constraints*); DMADV and IDOV (iSixSigma); kaizen events (Purdue Lean Six Sigma Online, Minitab blog).
- **Not reachable**: ASQ pages on kaizen, TPM, hypothesis testing, control plans, gap analysis and fault tree analysis returned errors; those topics are tagged Inferred.
- **Found in NIST**: 7.4.3.4 prints SS(Total) = 829.390 − 779.041 = 45.439, which equals 50.349; its table then uses 45.349. The app does not use that example.
- **Constants (Measured)**: d2 and d3 computed by integration (JS trapezoid on P(R > r); Python Simpson on the range density), c4 from the gamma function. Computed A2, D3, D4 match NIST's table to 3 decimals for n = 2–10 except D4 at n = 5 (formula 2.1145, NIST prints 2.115); c4(10) = 0.9727 as NIST. `math/check.js` enforces this on every build.
