// Craft packet definitions (study-kit loadCraft), Phase 4. Each entry also carries lane, section and levels; each
// stage carries the level it practises. Checklist text may use {{placeholders}} from math/ (group tp1, tp2, tp3).
// Markdown sources are in craft-src/; build.js fills the numbers and writes build/craft/.
// Companies and people are fictional. Draft until Kristen reviews.
'use strict';
const FACTS = 'Every figure used traces to the packet or is labelled an assumption';
module.exports = [
  { id: 'TP-1', file: 'tp-1-otif-turnaround.md', status: 'Draft', lane: 'coo', section: 'cases', levels: ['director', 'vp'], kind: 'Turnaround case', title: 'OTIF turnaround', role: 'VP of Operations',
    stages: [
      { id: 'TP-1.1', level: 'director', title: 'Count OTIF', parts: [1], model: ['Stage 1', 'OTIF'], checklist: ['OTIF is {{tp1.otif|%0}} ({{tp1.both}} of {{tp1.lines}} lines)', 'Says the deck multiplies two rates', 'Explains that misses overlap, so multiplying is wrong', 'Says the deck figure must be fixed before the customer sees it', 'Counts OTIF line by line', FACTS] },
      { id: 'TP-1.2', level: 'director', title: 'Rank the causes', parts: [2], model: ['Stage 2', 'Pareto'], checklist: ['Ranks Line 2 capacity first, material second', 'Top two explain {{tp1.top2|%0}} of the {{tp1.miss}} misses', 'Fixing the top two reaches {{tp1.fixTop2|%1}}', 'Compares that with the {{tp1.target|%0}} target', 'Does not chase the carrier delays first', FACTS] },
      { id: 'TP-1.3', level: 'vp', title: '90-day plan', parts: [3], model: ['Stage 3', 'Line 2'], checklist: ['Sees Line 2 at {{tp1.l2Util|%0}} of capacity next quarter', 'Closes the {{tp1.l2Over}}-hour gap with a named action', 'Gives material shortages a procurement owner and a daily list', 'Checks planning misses for a repeated cause', 'Sets a weekly OTIF review with the owners', FACTS] },
      { id: 'TP-1.4', level: 'vp', title: 'CEO update', parts: [4], model: ['Stage 4'], checklist: ['Corrects the OTIF figure', 'Names the two main causes and their share', 'Says the target is reachable and how', 'Names the Line 2 action already under way', 'Fits in three sentences', FACTS] }
    ] },
  { id: 'TP-2', file: 'tp-2-dmaic-project.md', status: 'Draft', lane: 'coo', section: 'cases', levels: ['director', 'vp'], kind: 'Green Belt project case', title: 'A Green Belt project the CFO will check', role: 'Plant operations leader (project sponsor)',
    stages: [
      { id: 'TP-2.1', level: 'director', title: 'Problem statement', parts: [1], model: ['Stage 1', 'Baseline cost'], checklist: ['States {{tp2.defects}} defects a month at {{tp2.defBase|%1}}', 'Baseline cost is {{tp2.costBase|$}} a month', 'Names the goal of {{tp2.defTarget|%1}}', 'Puts no cause or solution in the statement', 'Names the line and the time frame', FACTS] },
      { id: 'TP-2.2', level: 'director', title: 'Causes first', parts: [2], model: ['Stage 2', 'Causes'], checklist: ['Attacks mold temperature first', 'About {{tp2.nTemp}} defects a month from temperature', 'About {{tp2.nOper}} from operator setup', 'Together {{tp2.top2Share|%0}} of defects', 'Leaves material and other for later', FACTS] },
      { id: 'TP-2.3', level: 'vp', title: 'Control', parts: [3], model: ['Stage 3'], checklist: ['Control chart on mold temperature', 'Tracks the defect rate with a reaction plan', 'Puts the setup sheet in standard work with audits', 'Waits about three months before calling the result stable', 'Says one month is not enough evidence', FACTS] },
      { id: 'TP-2.4', level: 'vp', title: 'Savings claim', parts: [4], model: ['Stage 4', 'Savings'], checklist: ['Saving is {{tp2.saveMo|$}} a month, {{tp2.saveYr|$}} a year if it holds', 'Counts savings month by month as confirmed', 'Refuses to book the full year now', 'Names the resin change as a rival explanation', 'Says how to test the resin change', FACTS] }
    ] },
  { id: 'TP-3', file: 'tp-3-sop-meeting.md', status: 'Draft', lane: 'coo', section: 'cases', levels: ['director', 'vp', 'c-level'], kind: 'S&OP case', title: 'The executive S&OP meeting', role: 'VP of Operations',
    stages: [
      { id: 'TP-3.1', level: 'director', title: 'Size the gap', parts: [1], model: ['Stage 1', 'Gap'], checklist: ['Demand totals {{tp3.demand}} and supply {{tp3.supply}}', 'Gap is {{tp3.gap}} units', 'Revenue at stake is {{tp3.revRisk|$}}', 'Contribution at stake is {{tp3.cmRisk|$}}', 'Notes that most of the gap falls in month 3', FACTS] },
      { id: 'TP-3.2', level: 'vp', title: 'Price the options', parts: [2], model: ['Stage 2', 'Options'], checklist: ['Overtime nets {{tp3.otCm|$}} on {{tp3.otUnits}} units', 'Build-ahead nets {{tp3.prebuildCm|$}} on {{tp3.prebuild}} units', 'Says the build-ahead window closes this month', 'Leaves {{tp3.left}} units ({{tp3.leftRev|$}}) uncovered', 'Rules out the co-packer on lead time', FACTS] },
      { id: 'TP-3.3', level: 'vp', title: 'What is left', parts: [3], model: ['Stage 3', 'Promotion'], checklist: ['Asks sales to offer Coastal a later promotion date', 'Shows that moving it covers the {{tp3.left}} units', 'Names a fallback: decide allocation before month 3', 'Does not leave the shortfall to whoever orders last', 'Treats the sales director\'s reluctance as a risk to discuss, not a constraint', FACTS] },
      { id: 'TP-3.4', level: 'c-level', title: 'Decision request', parts: [4], model: ['Stage 4'], checklist: ['States the gap in units and revenue', 'Asks for overtime and build-ahead approval today', 'Says what the approvals close and what remains', 'Names the ask of sales on the promotion', 'Fits in two sentences', FACTS] }
    ] }
];
