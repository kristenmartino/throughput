// Lanes and sections. Ids are link ids: once published they never change (published-ids.json).
// Lane names use full titles (naming rule, claude/c-suite-series-plan.md); acronyms appear only in brackets.
'use strict';
module.exports = {
  lanes: [
    { id: 'quality', name: 'Quality and process improvement', short: 'Quality', active: true, color: '--s-mint',
      blurb: 'Six Sigma Green Belt (ASQ CSSGB, 2022 Body of Knowledge): DMAIC, lean, statistics and process capability.',
      cert: 'ASQ Certified Six Sigma Green Belt (CSSGB)' },
    { id: 'supply-chain', name: 'Supply chain (including Chief Procurement Officer)', short: 'Supply chain', active: false, color: '--s-sky',
      blurb: 'End-to-end supply chain on the ASCM CSCP modules: demand, sourcing, inventory, logistics, risk. Procurement leadership.' },
    { id: 'coo', name: 'Chief Operating Officer (COO)', short: 'COO', active: false, color: '--s-orange',
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
      { id: 'mock', title: 'Timed mock (110 questions, 4 h 18 min)', kind: 'Mock exam', phase: 2 }
    ]
  },
  // Exam facts shown on the lane screen (Read, asq.org/cert/six-sigma-green-belt, opened Nov 24).
  exam: {
    quality: 'CBT: 110 questions (100 scored), 4 h 18 min; open book, bound references only. Fee $483 ($100 less for ASQ members), retake $283. Three years of full-time, paid experience in one or more Body of Knowledge areas.'
  }
};
