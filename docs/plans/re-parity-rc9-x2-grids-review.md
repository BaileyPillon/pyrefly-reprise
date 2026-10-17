# Paper preflight: RE parity RC9, lane X2-I, Garment Grid layouts, the move rule and the gate numbers (FFX-2 only)

> `critic/RUBRIC.md` section 4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths src/battle/ffx2/kernel/grid-path.ts,src/battle/ffx2/adapters.ts,src/battle/ffx2/internal.ts,src/data/ffx2/garment-grids/layouts.ts`
> classes this as **DEEP** (FFX-2 ATB engine is a shared system; FFX-2 game data). Written 2026-10-15 before the code, by the lane's agent.
>
> **Owner's words:** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please" (wiring plan Q10, numbers-only tables, and Q17 as recommended);
> 2026-10-13 "keep going please all of this reverse engineering needs to be incorporated into our game"; 2026-10-15 "keep going full speed ahead".
> Q17 as accepted: the Garment Grid rules are built now; the Spherechange wheel's redesign is the release driver's mockup (before and after for two grids); **the gate-colour flip waits for an artwork check.**

## 1. Game case (AGENTS.md rule 14)

**FFX-2 only.** FFX has no dresspheres, garment grids or dress changes (its characters grow on the Sphere Grid). Nothing under `src/battle/ffx`, `src/data/ffx` or `src/audio` is touched; no screen is touched.
The note is `FFX2-G09` (sections 1 to 5 and 7; rows D1, D2, D3 of its section 7, XI1 to XI3 of the wiring plan addendum). XI4 (the wheel) is presentation and is the driver's.

## 2. What changes, in player words

1. A girl's dress changes follow the **real grid**: she can change to a dress whose node is joined to hers directly or through exactly one gate, and to no other. Today every grid is a ring of its node count, so a hub
   (the middle node of Vanguard and the other 5-node four-gate grids) and the extra direct joins of First Steps (nine joins on six nodes, not six) are missing. Because the engine numbers a grid's nodes along a ring through
   its real joins, every Change a build could make before it can still make (node 1 first, the last node last), and the real grid adds the others between them.
2. A change through a gate crosses **that gate** (a number 1 to 4 in the game, the grid's own colour in ours). A direct join crosses none. The gate stays crossed for the rest of the battle (as today).
3. Nothing else: the bonuses, the pay-offs and the numbers on a gate are the data's, unchanged; the Special form, the wheel and the colours are not touched.

## 3. The gate-colour question (kept as it is, said plainly)

The game keys a gate by a number 1 to 4. Our data keys it by a colour. The mapping 1 = red, 2 = green, 3 = yellow, 4 = blue is **inferred** (36 of 36 gate sets agree) and is **not applied by this lane**: no table or line of code maps a number to a colour for all grids.
Each grid's layout carries its own small table "this gate number wears this colour", pinned by what **that grid's own existing data** pays per colour and checked by a test against the game's own plate row (the gate abilities `plate.bin` puts on each condition, and the stat each ability gives).
(Where that data cannot tell which of two or more colours a gate wears, 22 of the 39 grids because every gate pays the same or two colours only ever come together, the table is the one closest to the common colours: a label, no number depends on it.)
That keeps today's colours: a colour pays what it pays today. On the five older stat grids (`vanguard`, `protection-halo`, `hour-of-need`, `bum-rush`, `flash-of-steel`) today's data has red and yellow on the physical stat and blue and green on the magical one,
the game has the physical stat on the numbers 3 and 4 and the magical one on 1 and 2, so those five tables read 1 = blue, 2 = green, 3 = yellow, 4 = red and the payout **by gate number is the game's** while the payout **by colour is today's**.
The flip (waits for the artwork look) is then exactly: replace those five tables by the common colours and swap red and blue in those five grids' data; the test proves the totals either way.

## 4. Acceptance cases

1. The path kernel (`kernel/grid-path.ts`) replays the note's vectors with 0 mismatches: gate number (690), gate state and all-worn (10,724), path finder (4,056), commit of a move with the gate evaluation (4,173); a stratified subset in `tests/fixtures/parity/ffx2/grid_path.json`.
2. The shipped layouts (`data/ffx2/garment-grids/layouts.ts`) equal the cards' export for every grid they cover, and the pairs the kernel derives equal the note's direct and through-a-gate pairs.
3. An engine-level test with an oracle that imports no kernel, adapter or layout code: for every covered grid and every node, the spherechange rows the menu offers are exactly the oracle's, a change through a gate marks the gate its number names, and the stat bonus after any set of crossed gates equals the plate row's.
4. The goldens, the data tests and the whole suite pass (art-only failures listed); the cause of every digest that moves is written in the test file.
5. Measured: 12 seeds on every FFX-2 chapter against `origin/r49-rc`, then 500 seeds on every chapter that moves, with the cause of each move.

## 5. Risks and how they are bounded

| Risk | Bound |
|---|---|
| A chapter's script relied on a ring join that is not in the game | measured; the cause of every move is written; nothing is tuned |
| The data disagrees with the cards on five grids (`healing-wind`, `ray-of-hope`, `seething-cauldron`, `strength-of-one`, `howling-wind`) | no build uses them; they keep the ring estimate and are listed in the handoff, no data is corrected |
| The dress-to-node placement is the build's estimate (`gridNodeContents`), written for a ring (node `i` beside node `i+1`, node 0 beside the last) | untouched. The game has no "node 0", so the engine's numbering is ours: node `i` is the i-th dressphere node **along a ring through the grid's real joins** (`ringOrder`: the lowest such ring from the card's first node; 62 of the 64 cards have one, every covered grid among them). Every join a build was written for is then still there and the real grid only adds joins; pinned by tests against an exhaustive search |
| The fallback table in `garment-grids.ts` (19 rings) disagrees with the injected registry | it stays (its own comment says it is the fallback); the tests that inject nothing keep their rings |
| Rollback | `constants.ts#GRID_LAYOUTS = false` restores the ring estimate for every grid |

## 6. What the deep review should look at

1. A real girl on a hub grid (Vanguard, Protection Halo, Hour of Need): the menu offers the hub and the through-a-gate dresses, never a dress the game does not join to her node.
2. The party-prep strip and the pause screen are unchanged (they read the data's node count and colours, not the layout).
3. Whether the colour a gate is shown with on the five stat grids is the one the artwork shows (the open question the flip waits for).

**Follow-up D1 (2026-10-16):** the five grids of the risk table above and White Signet's missing gate effects were corrected from the game's plate rows (decision D1, answered yes by the release driver under Bailey's standing "all your recommendations"), so all 44 data grids have a layout and none keeps the ring estimate; the table row above is the state of the first commit. See `docs/handoff/re-parity-rc9-x2-grids.md` section 10.
