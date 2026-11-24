# Beer Game prototype (not in the app)

Built Nov 24 to test the rules proposed in `docs/beer-game-rules.md` before Kristen approves them. Nothing here is
loaded by `build.js`. After approval the engine moves into `math/` with the app's own checks.

- `beer.py` and `beer.js`: the same engine (integer cases; Python costs in Decimal, JS in half-dollars).
- `cross.js` writes `js-out.json` for 202 games (all four seats with seeded random orders, plus two reference
  policies); the check in the rules doc compares every weekly value with Python.

Run: `node cross.js && python3 -c "..."` (see `docs/beer-game-rules.md`, "Checks").
