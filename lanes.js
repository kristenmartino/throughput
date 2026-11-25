// Lanes and sections. Ids are link ids: once published they never change (published-ids.json).
// Lane names use full titles (naming rule, claude/c-suite-series-plan.md); acronyms appear only in brackets.
'use strict';
module.exports = {
  // Level tags (Phase 4 decision 2B, Nov 24): every COO lane item and the Chief Procurement Officer deck carry one or more.
  // Same three levels as Blast Radius.
  levels: [
    { id: 'director', name: 'Director', scope: 'Runs the operation or program' },
    { id: 'vp', name: 'VP', scope: 'Owns the budget and the org' },
    { id: 'c-level', name: 'C-level', scope: 'Owns the strategy and the board update' }
  ],
  lanes: [
    { id: 'quality', name: 'Quality and process improvement', short: 'Quality', active: true, color: '--s-mint',
      blurb: 'Six Sigma Green Belt (ASQ CSSGB, 2022 Body of Knowledge): DMAIC, lean, statistics and process capability.',
      cert: 'ASQ Certified Six Sigma Green Belt (CSSGB)' },
    { id: 'supply-chain', name: 'Supply chain (including Chief Procurement Officer)', short: 'Supply chain', active: true, color: '--s-sky',
      blurb: 'End-to-end supply chain on the ASCM CSCP modules: demand, sourcing, inventory, logistics, risk. Procurement leadership.',
      cert: 'ASCM Certified Supply Chain Professional (CSCP)' },
    { id: 'coo', name: 'Chief Operating Officer (COO)', short: 'COO', active: true, color: '--s-orange', leveled: true,
      blurb: 'Operating cadence, operations finance, executive S&OP, make-versus-buy, operations strategy and org design.' }
  ],
  // Sections for each active lane. Section ids are link ids (lane-section) and never change once published.
  // Quality: one section per ASQ 2022 CSSGB Body of Knowledge section, with its scored-question count
  // (Read, ASQ 2022 SSGB BoK PDF, opened Nov 24: 11 / 20 / 20 / 18 / 16 / 15 = 100 scored of 110 on the CBT).
  sections: {
    quality: [
      { id: 'overview', title: 'I. Overview: Six Sigma and the organization', kind: 'Deck', questions: 11, phase: 2 },
      { id: 'define', title: 'II. Define', kind: 'Deck', questions: 20, phase: 1 },
      { id: 'measure', title: 'III. Measure', kind: 'Deck', questions: 20, phase: 1 },
      { id: 'analyze', title: 'IV. Analyze', kind: 'Deck', questions: 18, phase: 2 },
      { id: 'improve', title: 'V. Improve', kind: 'Deck', questions: 16, phase: 2 },
      { id: 'control', title: 'VI. Control', kind: 'Deck', questions: 15, phase: 2 },
      { id: 'mock', title: 'Timed mock (110 questions, 4 h 18 min)', kind: 'Mock exam', mock: 'mock', phase: 2 }
    ],
    // Supply chain (Phase 3, approved Nov 24): the three sims, then one deck per CSCP module with ASCM's weight
    // (Read, CSCP ECM v5.0 preview, opened Nov 24: 10 / 10 / 17 / 19 / 9 / 17 / 10 / 8). Module titles from ASCM's
    // 2026 module content outline (Read, Nov 24).
    'supply-chain': [
      { id: 'inventory', title: 'Inventory policy under demand shocks', kind: 'Simulation', route: '#inventory-sim', phase: 3 },
      { id: 'bottleneck', title: 'Bottleneck line', kind: 'Simulation', route: '#bottleneck-sim', phase: 3 },
      { id: 'beer', title: 'The Beer Game', kind: 'Simulation', route: '#beer-game', phase: 1 },
      { id: 'sc1', title: '1. Supply chains, demand management and forecasting', kind: 'Deck', weight: 10, phase: 3 },
      { id: 'sc2', title: '2. Global supply chain networks', kind: 'Deck', weight: 10, phase: 3 },
      { id: 'sc3', title: '3. Sourcing products and services', kind: 'Deck', weight: 17, phase: 3 },
      { id: 'sc4', title: '4. Internal operations and inventory', kind: 'Deck', weight: 19, phase: 3 },
      { id: 'sc5', title: '5. Forward and reverse logistics', kind: 'Deck', weight: 9, phase: 3 },
      { id: 'sc6', title: '6. Supply chain relationships', kind: 'Deck', weight: 17, phase: 3 },
      { id: 'sc7', title: '7. Supply chain risk', kind: 'Deck', weight: 10, phase: 3 },
      { id: 'sc8', title: '8. Optimization, sustainability and technology', kind: 'Deck', weight: 8, phase: 3 },
      { id: 'mock', title: 'Timed mock (150 questions, 3 h 30 min)', kind: 'Mock exam', mock: 'cscp', phase: 3 },
      // Phase 4 (decision 5A): the Chief Procurement Officer's job. No exam weight; level-tagged.
      { id: 'cpo1', title: 'Chief Procurement Officer: leading procurement', kind: 'Deck', phase: 4 }
    ],
    // COO lane (Phase 4, approved Nov 24, 18:31 ET). No exam, so no weights and no mock; every item carries level tags.
    coo: [
      { id: 'coo1', title: '1. Operating cadence', kind: 'Deck', phase: 4 },
      { id: 'coo2', title: '2. Operations finance', kind: 'Deck', phase: 4 },
      { id: 'coo3', title: '3. Executive S&OP', kind: 'Deck', phase: 4 },
      { id: 'coo4', title: '4. Make vs. buy and outsourcing', kind: 'Deck', phase: 4 },
      { id: 'coo5', title: '5. Operations strategy', kind: 'Deck', phase: 4 },
      { id: 'coo6', title: '6. Organizing operations', kind: 'Deck', phase: 4 },
      { id: 'cases', title: 'Craft packets', kind: 'Craft packets', phase: 4 },
      { id: 'role-plays', title: 'Role-plays', kind: 'Role-plays', phase: 4 }
    ]
  },
  // Exam facts shown on the lane screen (Read, asq.org/cert/six-sigma-green-belt, opened Nov 24).
  exam: {
    'supply-chain': 'One exam on all eight modules: 150 questions (130 scored, 20 unscored pretest), 3.5 hours; scaled score 200 to 350, pass at 300 (ASCM exam page, Read Nov 24). Exam fee $1,450 for members with the certification upgrade, $2,015 otherwise (2026 brochure, Relayed).',
    quality: 'CBT: 110 questions (100 scored), 4 h 18 min; open book, bound references only. Fee $483 ($100 less for ASQ members), retake $283. Three years of full-time, paid experience in one or more Body of Knowledge areas.'
  }
};
