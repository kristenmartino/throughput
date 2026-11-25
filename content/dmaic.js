// DMAIC on a P&L (TPN-1, Phase 4b). Design approved by Kristen Nov 25, 14:28 ET ("A" on all four decisions), with the
// four rule changes she kept and the eight-month run plus a six-month comparison ("should both lessons be in there
// somewhere"). Engine: math/dmaic.js, checked against math/dmaic.py on every build. {key} placeholders are filled by
// build.js from the checked engine, and build.js asserts each claim the lesson makes. The plant is fictional.
'use strict';
module.exports = {
  id: 'TPN-1', title: 'DMAIC on a P&L', status: 'Draft', levels: ['director', 'vp'],
  blurb: 'A machining line scraps {baseRate} of its parts. {months} months, {budget} and up to {perMonth} moves a month. Find the real causes, fix them, and hold the gains, judged on the P&L and on the savings finance will count.',
  briefing: [
    'You sponsor a Green Belt project on a machining line that starts {units} parts a month. Each part sells for {price} and costs {varCost} in material and machine time. {baseDefects} parts a month are scrapped ({baseRate}); a scrapped part earns nothing and costs {handling} more to handle. Doing nothing, the line makes {baseMonth} a month.',
    'Four causes make the scrap: fixture wear, setup differences, bar stock variation and other. The plant\'s own defect log blames bar stock first. You do not know how much each cause really makes until you find out.',
    'Each month you may make up to {perMonth} moves from a project budget of {budget} for the whole run. Measure ({measureCost}) checks the measurement system and the log, and shows the true ranking of causes. Analyze ({analyzeCost} a cause) shows that cause\'s share; it needs Measure first. Pilot ({pilotCost} a cause) shows how much a fix would remove; it needs that cause analyzed. Implement ({implCosts}) puts a fix in. A control plan ({controlCost}) holds the gains; it needs a fix in place. A step\'s prerequisite can come earlier in the same month.',
    'A fix works from the month after you make it. A fix made without analyzing its cause first removes a third as much. A fix made without a pilot in an earlier month costs {disruptPct} of the next month\'s output while it is debugged. Without a control plan made within {slipAfter} months of a fix, its gains slip by a third from the month after that.',
    'Each month shows a P&L: revenue, material and machine cost, scrap handling, project spend and contribution, against the do-nothing month. Your score is the contribution over the {months} months after project spend, plus the yearly saving finance will count: only with a control plan in place, and only the gain held for the last three months, × 12.'
  ],
  lesson: [
    'Doing nothing makes {baseRun} over {months} months. The best plan of every legal plan, found by searching them all, scores {best8Score}: {best8Text}. It spends {best8Spent}, ends at a defect rate of {best8EndRate}, and finance counts {best8Counted} a year. (Computed in math/dmaic.js and checked against Python)',
    'The plant log points at bar stock. Fixing it first, without measuring, costs {logFirstCost} and a month of disrupted output and removes nothing: the run scores {logFirstScore}, below doing nothing. Measurement system analysis comes before analysis because the data can be wrong. (Computed; see Measure, lesson ms-7)',
    'Skipping Measure and Analyze and fixing the two real causes on a hunch, with a control plan, scores {noMeasureScore}: each fix removes only a third as much because it is not aimed at the cause. That is {noMeasureGap} less than the best plan. (Computed; see Analyze, lesson an-9)',
    'Over {months} months, piloting pays. A plan that skips the pilots ({noPilot8Text}) gets the setup fix in a month sooner but loses a month of output to debugging, and scores {noPilot8Score}, {noPilotGap} below the best plan. (Computed; see Improve, lesson im-3)',
    'With a {months6}-month deadline the answer flips. The best {months6}-month plan skips the pilots: {best6Text}, scoring {best6Score}. The best {months}-month plan cut to {months6} months pilots first, so its setup fix misses one of the last three months finance counts: finance counts {piloted6Counted} a year instead of {best6Counted}, and the run scores {piloted6Score}, {pilot6Gap} less. A pilot pays when a failed rollout costs more than the delay; a deadline can change which is larger. (Computed)',
    'Without a control plan the gains slip and finance counts nothing: the best plan without its control plan scores {noControlScore}, {noControlGap} less. (Computed; see Control, lesson co-5)',
    'The rules have no chance in them, so the best plan is a true optimum for these rules, not a lucky run. The numbers are a model of one fictional plant: real fixes, delays and finance rules vary. (Inferred)'
  ],
  // Lessons and packets to read next, by DMAIC step (ids published in Phases 1, 2 and 4).
  links: [['ms-7', 'Measure: measurement system analysis'], ['an-9', 'Analyze: root cause analysis'], ['im-3', 'Improve: pilots'], ['co-5', 'Control: control plans'], ['df-8', 'Define: cost of poor quality'], ['coo2-2', 'COO: contribution margin']],
  packet: 'TP-2',
  sources: ['bok']
};
