# R57-001: Shiva's feet between attack and idle (FFX only; diagnosed in the release 58 assembly, nothing changed)

**What the release 57 focused review said:** CHK-026, Shiva attack to idle moves the feet 80 px in Braska's final aeon fight (Chapter III, the possessed Shiva; art id `shiva`); the defect is also on the live build.
**Game case: FFX only.** `shiva` is the FFX aeon's art id (every FFX chapter that fields it: the possessed Shiva of Chapter III link 5 and a summon in 1, 2, 7, 9, 10, 12, 14, 17, 18, 27). FFX-2's Shiva is `x2-shiva`, another art id with its own rows, and was not looked at.
**Verdict: not a value that can be corrected for the attack painting alone, so it was left as it is.** The numbers below are reproduced offline from the shipped paintings (the r58 art mirror, byte-identical to live's for these files), the sidecars, `docs/target/pose-measure.json` and the engine's own placement rule (`src/engine/PoseRegistration.ts`, `PaintedScale.ts`); no browser was run (the review browser flag was up).

## What the engine does

A pose is placed so that its REGISTERED stance sits where the idle's does (`stanceShift`). The registered stance is "the middle of the lowest thick part of the silhouette" (`tools/posescale/measure.py`, `stance_from_hem`); for Shiva it is stored as `stanceX` in `src/data/art/poseRegistrationFoes.ts` and as `stance` in `docs/target/pose-measure.json`:

| painting | size | registered stance (x, row) | lowest thick part | sidecar baseline |
|---|---|---|---|---|
| idle | 574 x 1147 | (304, 1131) | x 79 to 529 | 1131 |
| attack | 754 x 1209 | (337, 1193) | x 142 to 532 | 1194 |

Placed that way the two registered points coincide to **0.0 painting px sideways and 1.0 px vertically**, and the harness's registered-stance reading says the same (the earlier Braska recordings, e.g. review `72973096`, read possessed-shiva attack to idle at 0.4 to 0.5 px, source `registration`). The paintings are fresh against the records (sha256 of `attack.png` `caa014a7...` and of `idle.png` `b24f08be...` are the rows' own), so nothing is stale and no row is wrong by its own rule.

## Where the 80 px comes from

It is the harness's SILHOUETTE reading (W4, `swaps[].feetSil`, `estimateStance` in `critic/runner/lib/continuity-silhouette.mjs`, which reads the silhouette's own stance whatever the registration says). Run over the same two paintings:

| painting | the harness's own stance (painting px) | the registered stance |
|---|---|---|
| idle | **(450.2, 1129.1)**: the far end of the gown's train | (304, 1131) |
| attack | (339.3, 1171.2): the ice star under her | (337, 1193) |

Through the engine's placement the silhouette stances are 143.9 px apart sideways and 20.9 px vertically; at the drawing scale the review saw (about 0.56 screen px per painting px, her 1131 px baseline being about 630 px at 1600 wide) that is the **80 px**. The harness gates only the vertical gap when both stances are registered (`feetSil.gate: 'dy'`, 11.6 px here against a tolerance of about 12.6 px), so by this reproduction the 80 px is the number shown (`px`), not the one judged (`gatePx`).

## What is really wrong (and why one attack value does not fix it)

Neither registered stance is under her feet. Rows of solid pixels near the ground line (alpha at least 128): the idle's shoes are at about x 67 to 153 (rows 1060 to 1120; the legs above them at x 96 to 249) and the train's end at x 362 to 543, so the registered 304 is the middle of shoes plus train; the attack's standing foot is at about x 267 to 300 (row 1185 to 1170) inside an ice star that spans x 142 to 532, so the registered 337 is the middle of the ice. Her feet are therefore about 160 painting px left of the registered point in the idle and about 50 px left of it in the attack, and aligning the registered points leaves the feet about 100 painting px apart, roughly **50 to 70 px on screen at 1600 wide**. That is a real slide of the feet, smaller than 80 px, and it is the stance RULE (the middle of the lowest thick part) failing for a gown with a train and for a figure standing on a burst of ice, not a mistyped number.

Correcting it means giving Shiva's idle, cast (the idle plus a glow: the same stance as the idle), hurt, attack and Overdrive a hand stance at the feet (`tools/posescale/overrides.json`, entries of the kind `"stance": [x, row]` with a `why`, which `measure.py` writes as `src: "hand"` into `pose-measure.json` and the tables), then regenerating the tables. Changing only the attack's would move the attack plane against the idle's registered point and not fix the idle's. It moves where Shiva's planes sit in every FFX fight, so it wants a look at the result before it ships (rule 9), and it is a change to `tools/posescale/**` and `docs/target/pose-*.json`, which `critic/policy.json` classes as reviewed with the harness.

## Options

1. **Leave it** (what release 58 does). The slide is real but a fraction of a second at each attack; Shiva's rig (built, gated, OFF: `docs/handoff/rig-shiva.md`) plants the feet by construction and would end the question for FFX when it is switched on.
2. **Hand stances for Shiva's five poses** as above, with a before-and-after sheet for Bailey. Small, data only, no painting touched.
3. **Fix the harness's reading** so the silhouette stance of a gown with a train does not read the train's tip (an opening that keeps the hem's body). Only the review's number would change, not what the player sees.
