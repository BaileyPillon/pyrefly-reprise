# The Evrae fight's battle camera: what the website's shot table is, how it was made, and what is a fit

Game case: **FFX only** (Evrae on the Highbridge airship, the hidden Fayth chapter). Written 2026-10-12 with the table at `src/data/ffx/camera/evrae-shots*.ts`; the build is `tools/ffxcam-record.mjs` then `tools/ffxcam-table-build.mjs`.

## What it is

The dev server's camera replays FFX's battle-camera programs from Bailey's own copy (`docs/handoff/fayth-3d.md`, phases 4b and 5a); that data never leaves his PC (AGENTS.md rule 8). The **website** needs a camera of its own. This table is it: **our own keyframes, derived by replaying FFX's battle-camera programs for the Evrae fight from Bailey's own copy, simplified to keyframes and clamped (variant B); not the game's scripts.** It holds poses (the eye and the look-at in FFX's frame, the roll, the lens) and the curves between them, keyed by the beat, the ability, the acting slot, the target, the range and the branch. It holds no instruction, no condition, no program id: `tests/unit/ffxcam-table-data.test.ts` scans the source for them.

## What was replayed

The live chapter's own director (`FfxCameraDirector`), headless, with the live chapter's host values:

- **Extents.** The characters' camHeight and camWidth are the game's own (**Proven**: the `.chr` params block, `docs/handoff/fayth-3d.md` "Camera tracking" cause b); Evrae's is 49 FFX units, the party's 14 to 22.
- **Where they stand.** The party on FFX's three slots, Evrae on his NEAR or FAR spot, the party facing -x, Evrae +x (`src/engine/ffx3d/ffxStaging.ts`). A character that lunges is not followed: the table is fixed-point, recorded with the actors at their stand points.
- **The FAR fit** (`src/engine/ffxcam/farFit.ts`: **a fit**, the script's FAR look-at moved to the party's column) is on, so the FAR default view and everything that ends on it are the fitted ones.
- **The roster.** The three on the deck are the party in slot order. A reserve member (Lulu, Auron, Kimahri) is recorded in each of the three slots, with his own extents, and is found at run time by the slot he stands in.

**The scenarios** (996 beat scenarios, 1,008 records): for every row of the action table (44 party rows by the character that has them, 11 items, the plain Attack of each side, Evrae's 8 moves and Cid's missiles), the beat at the action's **opening** (command accepted plus the cast's start) and at its **launch** (the effect fires), for each of the slots the actor can stand in, each kind of target its `targeting` allows (Evrae `e`, itself `s`, one other member by slot `a0` to `a2`, the party `p`, both sides `x`) and both ranges; then Enter, Select and Normal at each range (one default view each), Cid's Pull back and Move in, the victory (both ranges) and the defeat (each of the three members falling last, both ranges). A launch is recorded 40 steps into its action's opening shot; 125 launches replayed from three different cameras (at the opening, 40 steps in, after the opening has ended) start on the same poses to 0.01 (**every launch cuts to its own shot**), and an opening is always started from the default view of its range, which is where FFX's Normal leaves the camera.

**Branches.** A shot the programs choose at random (`camRand` mod 2, 3 or 5, `GetRandomValue`) is replayed under **96 seeds** of the camera's own presentation dice; each distinct outcome is kept once with how many seeds drew it (1,894 distinct outcomes). The weights are the programs' own moduli seen through 96 draws, not FFX's RNG; the table director draws among them from the presentation dice, never the battle's.

## How the table is made

1. **Clamp, each recorded step** (variant B, `src/engine/ffxcam/variant.ts` and `plateFit.ts`):
   - the eye's **azimuth about the look-at** within **35 degrees** of the near default view's (101.52 degrees), nearest edge, the eye's height and horizontal radius kept (D-632, Bailey's pick);
   - an **elevation limit** on the look direction's pitch, **measured from the painted sky plate's extent**: the plate is 162 by 92.6 world units, rolled 11.6 degrees, 80 down the near camera's view line (`src/engine/ffxcam/plate.ts`); from the eye it was built for, the frame's top edge stays on it up to +0.5 degrees on a 4:3 window, -0.6 on 16:9 and -2.1 on 21:9, its bottom edge down to -27.0, -26.1 and -25.0. The limit is the lowest of the first three, rounded down to the half degree (**-2.5**), and the highest of the last three, rounded up (**-24.5**); `node tools/ffxcam-plate.mjs` prints them. The near default view is at -17.2 and inside;
   - **the plate fit** (`[ours]`; not asked for, found necessary): the plate is one painting only 162 wide, so a frame at the arc's edge, or a wide lens, still reaches past its side. After the two clamps a frame that is not wholly on the plate and the deck (17 by 9 rays, 99.5 percent) is turned about its look-at, **inside the arc**, to the nearest azimuth at which it is, at **16:9**; its height, distance and lens are kept. The runtime filter is the same arithmetic (so the safety net's poses are fitted too, for the window's own shape).
2. **Quantise** to 0.01 units and degrees and 0.1 of a lens value (the lens, not the field of view, is what the game blends).
3. **Fit keyframes** (`tools/ffxcam-table-lib.mjs`): the fewest keys that reproduce the path within **0.5 FFX units** (eye, look-at), **0.3 degrees** (roll, field of view, and the view direction, which holds a close-up tighter than a wide shot). A segment is a **cut** (a hold then a jump), a **linear** blend, a **cosine** blend or a **trapezoid** of one of the seven shapes the recording saw; a shortest-path search over the steps, so a trapezoid after a hold is found at its true start. Worst measured error against the clamped, quantised path: eye 0.50, look-at 0.46, roll 0.00, field of view 0.30, view direction 0.29 (0.31 against the unrounded path).
4. **Share and route** (`tools/ffxcam-table-routes.mjs`): identical shots are one; abilities whose cells come out the same share a route; a dimension a route does not depend on becomes `*`.
5. **Shots the painting cannot hold are not baked** (`[ours]`): an action's shot with more than a tenth of the frame off the plate and the deck for half a second or more is **"leave the camera"**: the actor keeps the shot it had; the Move in is a still of the default view it started from for as long as the scene would have run, then Normal as ever. By outcome (of the recorded ones): **Slow and each black-magic spell, 9 of 18** (the half played at the FAR range, where the target stands 850 units off the painted sky; the NEAR half is kept), **Cid's Guided Missiles, 4 of 4**, **the Move in, 1 of 1**. Photon Spray, Poison Breath and the Pull back are kept (their worst frame is 96, 99 and 87 percent on the painting). **Shots FFX's own camera shows, and the website does not.**

## What it came to

- **Size.** 83 shots (74 action, 2 default views, 3 defeat, 2 scenes, 2 victory), 843 keys, 17 routes, 48 cells, 57 rows, 56.6 KB of source in two files.
- **On the painting** (a grid of the frame's rays against the plate and the deck, 16:9): the default views, the victory and the defeat **100 percent** at every step; the action shots **99.7 percent** of the frame on average, 95 percent of their steps wholly; the scenes 99.1 percent, 87 percent of their steps wholly (the Pull back's widest frame leaves a wedge of the plate's top corner). Before the plate fit the same shots were 80 percent on average and 17 percent wholly; before the elevation limit the two offenders phase 4b found, Poison Breath's tilt-up and the defeat camera, ran off the top.
- **Tracking** (`tools/ffxcam-audit.mjs`, five whole fights' method, here seeds 1 to 3): see `docs/handoff/fayth-3d.md`, "Website version (painted B)".

## What is a fit, what is ours, what is open

| Item | Label |
|---|---|
| The programs' poses at each step, per scenario | **Proven** for the programs' output (the replay is the lane's, checked against the PS2 capture to 0.01 for the near default view); **Read** for which request each beat raises |
| Evrae's and the party's camHeight and camWidth | **Proven** |
| The FAR default view's look-at; the party's FAR column | **fit** (`farFit.ts`) |
| The azimuth limit (35 degrees), the near default view as its centre | Bailey's pick (D-632) |
| The elevation limit (-2.5, -24.5) | **measured** from the plate, `[ours]` as a rule |
| The plate fit, the 99.5 percent line, 16:9 | `[ours]` |
| The unbaked shots (a tenth of the frame for half a second): Slow and the black magic at FAR, Cid's missiles, the Move in | `[ours]` |
| Branch weights | 96 draws of the programs' moduli |
| Which member fell last for the defeat | **not known** at run time: the director picks one of the three by the dice |
| A reserve member's shots by slot, not by character | `[ours]` (his own extents were used when recording) |
| The Overdrive cameras (no program was found), Evrae's flight position, a character that lunges | not covered; the net and the default view stand in |
| Spell, item and status shots framed on the live targets | recorded with the targets at their stand points; a context nobody recorded finds no shot (the camera keeps what it had) |

Not in the repo, by rule 8: the programs themselves, `extents.json`, the recording (`D:\Tools\ffx-parity\camera\table\raw.json`, 138 thousand samples).
