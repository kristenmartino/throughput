// Role-plays (study-kit validateSims), Phase 4. Each entry also carries lane, section and levels.
// Claude plays the counterpart with the guarded, noCoaching and noUnpromptedOffer rules on, and scoring
// outcomeAgreesWithScore and verifiedQuotes (index.src.html). The engine's learner label is 'operations leader' for
// every role-play, so each persona says who the learner is. Numbers come from math/coo.js (group rp2).
// People and companies are fictional. Draft until Kristen reviews.
'use strict';
module.exports = fill => [
  { id: 'TPL-1', status: 'Draft', lane: 'coo', section: 'role-plays', levels: ['director', 'vp'], title: 'A supplier is late on a critical part',
    role: 'Tom Reyes, account manager at Castell Castings (supplier)',
    brief: 'Castell Castings makes the only qualified housing for your best-selling pump. Its last two shipments were a week late, and the next one, due Friday, will be late again. Your plant has four days of housings left before the pump line stops. You need to find out what is really causing the delays, secure enough housings to keep the line running, and agree a recovery plan with dates. Renegotiating the contract price is out of scope today. You have up to eight messages before the conversation is scored against four rubric points.',
    persona: 'You are talking with the operations leader responsible for the pump plant at your largest customer. Friendly, a little defensive about your plant, wants to keep the account; says yes to things you cannot yet promise.',
    hidden: ['A furnace at your plant failed three weeks ago and runs at about half speed until a part arrives next month', 'You have 600 finished housings allocated to another customer that could be split if asked directly', 'Your plant manager would support a weekend shift if the customer shares the overtime cost for one month'],
    walkaway: 'He agrees to ship part of the allocated housings this week and to run a weekend shift for a month if the customer shares the overtime, with daily status until the furnace is repaired.',
    opening: 'Sorry about the delay. It is a busy season, everyone is late. We will get Friday\'s shipment out as soon as we can.',
    goodOutcome: 'The operations leader learns about the furnace, secures part of the allocated stock this week, agrees a shared-cost weekend shift and gets daily status until the repair.',
    rubric: ['Asks what is behind the delays instead of accepting "busy season"', 'States the line-stop date and what is needed by when', 'Agrees specific actions with quantities and dates', 'Sets up daily status and an escalation contact until recovery'],
    lessons: [] },
  { id: 'TPL-2', status: 'Draft', lane: 'coo', section: 'role-plays', levels: ['vp', 'c-level'], title: 'The CEO asks why gross margin fell 2 points',
    role: 'Elena Marsh, CEO',
    brief: fill('Quarterly revenue held at ${{rp2.rev}} million, but gross margin fell from {{rp2.gm0|%0}} to {{rp2.gm1|%0}}, about ${{rp2.gpLost|1}} million of gross profit. Your bridge, built with finance, shows price {{rp2.bPricePt|1}} points, mix {{rp2.bMixPt|1}}, material cost {{rp2.bMatPt|1}} and plant cost +{{rp2.bOpsPt|1}}. The CEO wants an answer for the board next week. You need to find out what she has heard, explain the drop with the bridge, and agree who owns each recovery action. You have up to eight messages before the conversation is scored against four rubric points.'),
    persona: 'You are talking with the COO. Direct, short on time, prepares hard for the board; trusts numbers she can trace and dislikes being told it is complicated.',
    hidden: ['The CFO told her informally that the plants had a bad quarter', 'She is weighing a price increase but has not told the commercial team', fill('She will back a plan that recovers at least ${{rp2.recoverMin|1}} million within two quarters if each action has an owner')],
    walkaway: 'She accepts the bridge and a recovery plan with named owners for price, mix and material cost, and stops treating the drop as a plant problem.',
    opening: 'Two points of margin in one quarter. The board will ask what went wrong in the plants. What do I tell them?',
    goodOutcome: 'She agrees that material cost and mix drove most of the drop, the plants slightly helped, and a dated recovery plan has an owner for each line of the bridge.',
    rubric: ['Asks what she has heard before defending operations', 'Walks through the bridge with each driver and its size', 'Assigns each recovery action to an owner, including commercial for price and mix', 'Confirms what goes to the board and the date of the next check-in'],
    lessons: [] }
];
