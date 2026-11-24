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
