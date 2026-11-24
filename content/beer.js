// Beer Game texts (rules approved Nov 24: docs/beer-game-rules.md; decisions A, B, C as recommended).
// Numbers on screen come from math/beer.js at run time; the reference figures here are checked by build.js.
'use strict';
module.exports = {
  id: 'beer-game', title: 'The Beer Game', status: 'Draft',
  blurb: 'Run one stage of a four-stage beer supply chain for up to 36 weeks. Watch what a single change in customer demand does upstream.',
  briefing: [
    'You run one stage of a beer supply chain: Retailer, Wholesaler, Distributor or Factory. The Retailer serves customers; each stage orders from the one above it; the Factory brews.',
    'Each week: the delivery you ordered earlier arrives; you receive an order from your customer and ship what you can; what you cannot ship becomes backlog, and backlogged customers wait (no lost sales); then you place your order.',
    'Orders take 2 weeks to reach your supplier and shipments take 2 weeks to reach you, so a case you order arrives about 4 weeks later if your supplier has it. The Factory\'s brewing takes 3 weeks.',
    'Costs: $0.50 per case on hand per week and $1.00 per case of backlog per week. Lowest total cost wins. You see only your own stage. The other three stages are run by the computer, and the game ends without warning.',
    'Everyone starts with 12 cases, steady orders of 4 a week and 4 cases in every pipeline slot. The first four weeks are played for you.'
  ],
  // Debrief lesson. Tiers as in the decks.
  lesson: [
    'What happened: customer demand stepped once, from 4 to 8 cases a week in week 5, and never moved again. Yet orders swing harder at each stage up the chain. This amplification is the bullwhip effect. Procter & Gamble named it after seeing modest swings in retail sales of Pampers become larger swings in distributors\' orders and larger still in orders to its own suppliers. (Read, Lee, Padmanabhan and Whang 1997)',
    'Why it happens here: an order takes about four weeks to arrive, so stock falls while the first extra orders are still in the pipeline. Players who look at stock and not at what is already on order keep ordering, and the cases all land together later. Sterman fitted a rule to his players and found they counted only about a third of their supply line (β ≈ 0.34). (Read, Sterman 1989; the "about a third" reading of β is Inferred)',
    'Lee and colleagues name four causes in real chains: demand forecast updating (each stage forecasts from its customer\'s orders, not from end demand), order batching, price fluctuation (forward buying on promotions) and rationing and shortage gaming (inflating orders when supply is short). They argue these are rational responses to the chain\'s structure, so fixes must change the structure. (Read, Lee et al. 1997)',
    'What reduces it: count the supply line before ordering; share point-of-sale or sell-through data so every stage sees end demand; shorten lead times; vendor-managed inventory; smaller, steadier orders through cheaper ordering; everyday low pricing instead of promotions; allocating scarce supply by past sales rather than current orders. (Read, Lee et al. 1997; "count the supply line" from Sterman, Read)',
    'The benchmark shown in your debrief orders exactly what keeps stock plus supply line at a target (28 cases, 20 for the Factory), which is Sterman\'s benchmark rule. With all four stages on it, the team spends $204 over 36 weeks. (Read, Sterman 1989; reproduced by this app\'s engine, Measured)'
  ],
  sources: ['sterman', 'lee']
};
