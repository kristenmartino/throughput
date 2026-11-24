// Inventory policy under demand shocks (Phase 3, approved Nov 24: claude/throughput-phase3-proposal.md).
// Rules and demand: data/inventory.json (tools/make-inventory.py). Engine: math/inventory.js, checked against
// math/inventory.py on every build. {key} placeholders are filled by build.js from the checked engine.
'use strict';
module.exports = {
  id: 'inventory-sim', title: 'Inventory policy under demand shocks', status: 'Draft',
  blurb: 'Set an order quantity and reorder point for one product, then live with them for 26 weeks: a promotion and a supplier delay arrive along the way.',
  briefing: [
    'You manage one product. Each week customers want some units; you sell what you have on hand, and any demand you cannot fill is lost. Average demand is {mean} units a week with a standard deviation of about {sd}.',
    'You set two numbers: the order quantity (Q) and the reorder point (ROP). Each week, after sales, the app checks your inventory position: units on hand plus units already ordered and not yet received. If it is at or below your ROP, it orders Q units. Orders arrive {leadBefore} weeks later.',
    'Costs: ${hold} per unit left on hand at the end of a week, ${order} per order placed, and ${lost} per unit of lost sales. Lowest total cost over 26 weeks wins. You start with {initOnHand} units on hand and nothing on order.',
    'You can change Q and ROP at three reviews, after weeks {r1}, {r2} and {r3}. News arrives at the reviews; nothing changes your settings unless you do.'
  ],
  // Shown at each review, in order (after weeks 6, 12 and 18).
  news: [
    'Marketing confirms a promotion in weeks 9 and 10. They expect demand about 80% above normal in those two weeks, then back to normal.',
    'Your supplier writes: from orders placed in week 14 onward, delivery takes {leadAfter} weeks instead of {leadBefore}, and they cannot say for how long.',
    'No change from the supplier: delivery still takes {leadAfter} weeks. Demand looks normal again.'
  ],
  // Debrief. Tiers as in the decks.
  lesson: [
    'Economic order quantity (EOQ) balances the cost of ordering against the cost of holding: Q* = √(2 × demand × order cost ÷ holding cost). With these figures it is √(2 × {mean} × {orderD} ÷ {holdD}) = {eoq} units, and at that quantity the ordering and holding costs are equal. EOQ assumes steady demand and ignores shortages, so it says how much to order, not when. (Read, MIT OCW 15.772J; the figures Computed)',
    'The reorder point says when. In a continuous-review policy you order when the inventory position, on hand plus on order, falls to the reorder point. The usual setting is expected demand during the lead time plus safety stock of z × σ × √L, where z sets how often you accept running out during a lead time. Looking only at stock on hand, and forgetting what is already on order, is the mistake behind the Beer Game\'s bullwhip. (Read, Willems from Graves\'s notes; the Beer Game link Inferred)',
    'The textbook policy shown here uses Q = {eoq} throughout and z = {z} (about a 95% chance of not running out in a lead time): ROP = {rop0} before the promotion is known, {rop1} once it is announced (demand at 1.8 times normal over a {leadBefore}-week lead time), and {rop2} once the lead time is {leadAfter} weeks. Over 26 weeks it costs {tbTotal} with a fill rate of {tbFill}. (Computed in math/inventory.js and checked against Python)',
    'Keeping the opening policy and never changing it costs {ncTotal} with a fill rate of {ncFill}: the promotion and the longer lead time both drain stock faster than a reorder point of {rop0} can cover. It saves {ncHoldSave} in holding cost against the textbook policy but loses {ncLostCost} in lost sales ({ncLostUnits} units at ${lost}). Safety stock grows with the square root of the lead time, but the lead-time demand itself doubles when the lead time doubles. (Computed; the √L rule Read, Willems)',
    'With hindsight, the best single Q and ROP for all 26 weeks is Q = {hsQ} and ROP = {hsRop}, costing {hsTotal}. No one knows the future that well; it shows how much of your cost was the shocks and how much was the settings. (Computed by searching every Q from 50 to 800 and ROP from 0 to 900 in steps of 10)'
  ],
  sources: ['mitEoq', 'willems']
};
