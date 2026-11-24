# Throughput

Operations study app: quality and process improvement (Six Sigma Green Belt), supply chain (CSCP; Chief Procurement Officer), COO. Plan of record: `claude/operations-app-plan.md` in the claude.ai Project "Interview, Cert Exam, and Career Prep Apps". Status and handoffs: `claude/throughput-status.md`. Shared rules: `claude/study-apps-index.md`.

## Rules
- Engines come from study-kit, pinned in `vendor/study-kit/VERSION` (v0.2.0, ba9cff8). Never edit `vendor/study-kit/` by hand: engine fixes go to study-kit, get a new tag, and are copied in. Kit changes this app needs are listed in the status doc for Kristen's approval.
- Routes use the dash form only (`#lane-quality`, `#stage-tp-1-1`, `#run-tpn-1`). study-kit v0.2.0's `craft.route` rejects dots.
- Never rename or drop a published id. `build.js` refuses to build if an id in `published-ids.json` is missing. After a publish, run `node build.js --record`.
- Lane names use full titles; no bare colliding acronyms (CDO, CRO, CPO, CCO).
- Role-plays: rules `guarded`, `noCoaching`, `noUnpromptedOffer` and scoring `outcomeAgreesWithScore`, `verifiedQuotes` are on. Learner label 'operations leader'.
- Id prefixes: Craft packets TP-n, runs TPN-n, role-plays TPL-n.
- New content: helper drafts, blind check by a second model (fixes recorded in `docs/`), all arithmetic and statistics in code and checked JS against Python, Draft label until Kristen reviews. Claim tags: Measured, Read, Relayed, Inferred, Untested. Practice-exam questions are never copied.
- Boundaries: metric formulas live in Dry Run, accounting in Going Concern, procurement negotiation in Critical Path, ITIL in Inspect & Adapt; link, never copy. Throughput owns operating cadence and S&OP.
- Work on a branch and open a pull request (`gh api`, not `gh pr create`); never push to main or force-push; merge only on Kristen's word.

## Build and test
```sh
node build.js        # build/index.html
node test.js         # Playwright: 360/390/414 px in light and dark, lane picker, routes, idle-write check
```
