// Bottleneck line (Phase 3, approved Nov 24). Levers narrowed from the outline's four (capacity, buffer space, setup
// reduction, overtime) to capacity steps plus a release rule, so the best plan is found by exhaustive search
// (recorded in claude/throughput-status.md). Engine: math/bottleneck.js, checked against math/bottleneck.py on every build.
// {key} placeholders are filled by build.js from the checked engine.
'use strict';
module.exports = {
  id: 'bottleneck-sim', title: 'Bottleneck line', status: 'Draft',
  blurb: 'Five stations, {rounds} rounds and {budget} to spend on capacity. Find the constraint, decide how to release work, and see what each purchase does to throughput, work in process and lead time.',
  briefing: [
    'You run a five-station line: {stations}. Each round every station works on what was waiting in front of it at the start of the round, up to its capacity, and passes the finished units to the next station. Units leaving the last station are sold. The line starts with {init} units waiting at every station.',
    'Capacities per round: {caps}. Each unit sold earns {margin}. Each unit still in the line at the end of a round costs {wipCost} to carry. You have {budget} to spend: each purchase adds {step} units of capacity to one station for {stepCost}, takes effect in the round you buy it, and counts against your profit. One purchase per round at most.',
    'Before round 1 you choose how work enters the line. Push: release as much as the first station can take ({cap0} a round). Pace: release only as much as the slowest station can do this round. You keep this rule for the whole run.',
    'Profit over {rounds} rounds = units sold × {margin} − units carried × {wipCost} − what you spent. Lead time is estimated with Little\'s law: average work in process ÷ average throughput.'
  ],
  lesson: [
    'The line can only sell what its slowest station makes. Here that is {c0name} at {c0cap} a round, so before any purchase the line sells {c0cap} a round whatever the other stations can do. Identifying the constraint is the first of Goldratt\'s five focusing steps; exploiting it, subordinating everything else to it, and elevating it follow, and then you go back to step one because the constraint moves. (Relayed, Goldratt via excerpt; the figures Computed)',
    'Releasing work at the first station\'s pace (push) does not raise output. The extra units pile up in front of the constraint: with no purchases, push sells {pushOut} units over {rounds} rounds, the same as pacing, but ends with {pushEndWip} units in the line against {ropeEndWip}, and makes {pushProfit} against {ropeProfit}. Releasing at the constraint\'s pace is the "subordinate" step, often called drum-buffer-rope. (Computed in math/bottleneck.js and checked against Python; the drum-buffer-rope name Relayed)',
    'Little\'s law ties the three numbers together: work in process = throughput × lead time. With pacing and no purchases the line holds {ropeWip} units on average and sells {c0cap} a round, so a unit spends about {ropeLead} rounds in the line; under push the estimate rises to {pushLead} rounds. The identity holds exactly for averages over a period; with push the line is still filling up, so treat its lead time as a measured average, not a steady state. (Read, Little 2011; the figures Computed)',
    'Buying capacity anywhere but the constraint changes nothing you can sell: three steps at {c4name} with pacing cost {wasted} and still sell {c0cap} a round. Elevating the constraint moves it: one step at {c0name} lifts it to {c0after}, and {c1name} at {c1cap} becomes the new constraint. (Computed)',
    'The best of all {searched} possible plans (both release rules, every combination of up to {maxBuys} purchases across the {rounds} rounds) is: {bestPlan}. It makes {bestProfit}. Upgrades take a few rounds to reach the last station, because the extra units still have to pass the stations after the old constraint, so buying early matters. (Computed by exhaustive search)'
  ],
  sources: ['toc', 'little']
};
