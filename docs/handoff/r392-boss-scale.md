# r392-boss-scale: Yojimbo holds 1.15 times the party on screen, and no boss is re-sized between command menus

Branch `r392-boss-scale` (worktree `D:/pyrefly-critic-continuity`), from `origin/main` 9c690231 (its code is the live 39.1 build's, d3fe9fe5: nothing under `src`, `public`, `tools` or the build
config changed in between). **Not merged, not deployed, not reviewed.** Paper preflight: [docs/plans/r392-boss-scale-review.md](../plans/r392-boss-scale-review.md).

Bailey asked "Yojimbo looks huge compared to the party. Are the proportions accurate?" A measurement of the live build found the answer is "not steady": Yojimbo's on-screen size jumped between
1.34 and 0.96 times the party from one command menu to the next. Asked what fixed size he should hold until a real FFX screenshot settles it, **Bailey picked 1.15 times the party** (2026-10-06,
"About 1.15x the party (Recommended)"). This lane holds him there at every menu, and stops every boss in the colossus set from being re-sized between menus.

## Game case (rule 14), per change

| Change | Game case | Why |
|---|---|---|
| Yojimbo's BOSS SCALE target is 1.15 (was 2.2) and he holds it (`masters.ts`, `staging.ts`) | **FFX only** | Chapter IX is FFX; FFX-2 has no Yojimbo. His drawn height (2.55 against the party's 1.75, `scenes/cavern-stolen-fayth.ts`) is a presentation `[estimate]` from the visual bible, not game data: no battle number changed. `research/` states no on-screen proportion for him, so the picture is Bailey's pick until the real game's is read (see "For Bailey") |
| A boss is sized once per phase of a link (`scaleLock.ts`, `framing.ts`) | **both** (shared plumbing, CHK-020) | The cause was shared: the live check at a menu's opening asks for another plan and every plan searched BOSS SCALE's steps afresh. It reaches FFX's Natus, Braska's Final Aeon, Evrae and Yojimbo and FFX-2's Bahamut; measured, it changes Yojimbo (FFX) and Bahamut (FFX-2) and nothing else |
| A held boss takes its size before the first plan lands (`scaleLock.ts` `holdEarly`) | **FFX only** | Only Yojimbo is held |
| The upright phone | **neither** (unchanged) | `framing.ts` has never applied BOSS SCALE on the phone (it keeps today's rig and its own fit): Yojimbo reads 1.00 times the party there, before and after. The gauge card over him is FFX Chapter IX only: reported, not built |

Presentation only (rule 1): a figure's group scale (`Staging`); the engine, the RNG and every game number are untouched.

## In one screen

Chapter IX, real keys, headless GPU Chromium (`PYREFLY_BROWSER=gpu`) on a `vite preview` of a `BASE_PATH=/` build, seed 1, the first two rounds (7 menus). "x party" is Yojimbo's painted height over
the mean of Lulu, Kimahri and Yuna, the way the first measurement took it (the engine's painted content box through the live camera, px). Before = the branch tip before this lane (the 39.1 code).

**Yojimbo at 1600x900, seed 1, real keys.** boss px / group scale k / boss over the party mean (the three members, live).

| menu | member | before: px | k | x party | after: px | k | x party |
|---|---|---|---|---|---|---|---|
| 1 | kimahri | 285 | 1.311 | 1.34 | 252 | 1.163 | 1.19 |
| 2 | yuna | 222 | 1.000 | 0.97 | 260 | 1.163 | 1.13 |
| 3 | yuna | 222 | 1.000 | 0.96 | 260 | 1.163 | 1.13 |
| 4 | lulu | 214 | 1.000 | 1.04 | 259 | 1.163 | 1.20 |
| 5 | kimahri | 280 | 1.289 | 1.31 | 261 | 1.163 | 1.17 |
| 6 | yuna | 280 | 1.289 | 1.28 | 261 | 1.163 | 1.13 |
| 7 | lulu | 279 | 1.289 | 1.35 | 260 | 1.163 | 1.19 |
| | **before** | boss 214 to 285 px (x1.33) | k 1.000 to 1.311 | 0.96 to 1.35 | | | |
| | **after** | boss 252 to 261 px (x1.04) | k 1.163 to 1.163 | 1.13 to 1.20 | | | |

**Yojimbo at 2560x1440, seed 1, real keys.** boss px / group scale k / boss over the party mean (the three members, live).

| menu | member | before: px | k | x party | after: px | k | x party |
|---|---|---|---|---|---|---|---|
| 1 | kimahri | 458 | 1.311 | 1.35 | 401 | 1.163 | 1.17 |
| 2 | yuna | 359 | 1.000 | 0.98 | 415 | 1.163 | 1.12 |
| 3 | yuna | 358 | 1.000 | 0.98 | 415 | 1.163 | 1.12 |
| 4 | lulu | 346 | 1.000 | 1.05 | 415 | 1.163 | 1.19 |
| 5 | kimahri | 446 | 1.289 | 1.30 | 418 | 1.163 | 1.16 |
| 6 | yuna | 446 | 1.289 | 1.27 | 417 | 1.163 | 1.13 |
| 7 | lulu | 448 | 1.289 | 1.36 | 417 | 1.163 | 1.20 |
| | **before** | boss 346 to 458 px (x1.32) | k 1.000 to 1.311 | 0.98 to 1.36 | | | |
| | **after** | boss 401 to 418 px (x1.04) | k 1.163 to 1.163 | 1.12 to 1.20 | | | |

**Yojimbo at 1280x720, seed 1, real keys.** boss px / group scale k / boss over the party mean (the three members, live).

| menu | member | before: px | k | x party | after: px | k | x party |
|---|---|---|---|---|---|---|---|
| 1 | kimahri | 227 | 1.311 | 1.34 | 200 | 1.163 | 1.17 |
| 2 | yuna | 171 | 1.000 | 0.98 | 207 | 1.163 | 1.12 |
| 3 | yuna | 172 | 1.000 | 0.98 | 208 | 1.163 | 1.13 |
| 4 | lulu | 173 | 1.000 | 1.04 | 209 | 1.163 | 1.20 |
| 5 | kimahri | 223 | 1.289 | 1.31 | 208 | 1.163 | 1.15 |
| 6 | yuna | 223 | 1.289 | 1.27 | 207 | 1.163 | 1.12 |
| 7 | lulu | 223 | 1.289 | 1.35 | 209 | 1.163 | 1.20 |
| | **before** | boss 171 to 227 px (x1.32) | k 1.000 to 1.311 | 0.98 to 1.35 | | | |
| | **after** | boss 200 to 209 px (x1.04) | k 1.163 to 1.163 | 1.12 to 1.20 | | | |

- **Held:** k is one number, 1.163, at every menu and at every size; his painted height moves only with the camera (x1.04) where it moved x1.33 (k 1.00 to 1.31). Against the three at rest (each
  member's height at the menus where he is not the one leaning, under one camera) he is **1.153, 1.151 and 1.152 times the party** at 1600x900, 2560x1440 and 1280x720 (before: 1.31, 1.30, 1.30).
- **Why the live column wanders 1.12 to 1.21:** the member whose menu is open stands in her "ready" painting, and that painting is not the idle one's height: Yuna's reads 7 % taller on screen
  (244 px against 228 at rest), Lulu's 10 % shorter (204 against 228), Kimahri's 1 % shorter. The party mean moves with her, Yojimbo does not. It is the same in the 39.1 build (Yuna 245 px at her menu against 217 at
  Kimahri's, Lulu 193 against 216).
- **Seeds 2 and 3** (1600x900): Yojimbo 250 to 261 and 250 to 262 px, k 1.163 at all 14 menus (before: x1.57 with k up to 1.535, and x1.32).
- **Done:** 0 console errors and 0 failed requests in every run; no pop when the plan lands (the size is on from the first calm frame, within 0.3 s of the battle screen, and the plan plays the same factor).

## The bosses, before and after

First two rounds (7 menus), 1600x900, seed 1: the boss's painted height over the menus, and the group scales seen (the framing's and the scene's own).

| boss | before (the 39.1 code): boss px over 7 menus | k seen | after: boss px | k seen |
|---|---|---|---|---|
| Yojimbo (FFX IX) | 214 to 285 (x1.33) | 1, 1.289, 1.311 | 252 to 261 (x1.04) | 1.163 |
| Bahamut (FFX-2 IV) | 416 to 581 (x1.40) | 1, 1.387, 1.408 | 550 to 572 (x1.04) | 1.387 |
| Seymour Natus (FFX X) | 348 to 350 (x1.00) | 1.638 | 348 to 350 (x1.00) | 1.638 |
| Braska's Final Aeon (FFX III) | 328 to 335 (x1.02) | 1 | 329 to 333 (x1.01) | 1 |
| Evrae (FFX VIII) | 184 to 403 (x2.19) | 0.764, 1 | 184 to 404 (x2.19) | 0.764, 1 |
| Vegnagun (FFX-2 V) | 858 to 881 (x1.03) | 1 | 857 to 882 (x1.03) | 1 |
| Sin, face (FFX XVIII) | 529 to 549 (x1.04) | 3.471 | 527 to 544 (x1.03) | 3.471 |
| Sin, fins (FFX XVII) | 445 to 724 (x1.63) | 1.656, 3.85 | 445 to 726 (x1.63) | 1.656, 3.85 |

- **Changed between menus before the fix, by the framing: Yojimbo (FFX IX) and Bahamut (FFX-2 IV)**, at every seed measured (3). Both hold one size now. Bahamut: k 1.00 / 1.387 / 1.408 -> 1.387, 416 to 581 px -> 550 to 572 (the camera's own
  moves are what is left: his menus open during actions in Active ATB).
- **Not changed by the framing, and not touched:** Natus (pinned master: one plan, no re-plan), Braska's Final Aeon (BOSS SCALE never lands there: `scale -1` at every plan in both builds, 3 seeds),
  Vegnagun and Sin (they keep today's rig). **Evrae** changes size at the airship's NEAR / FAR range in both builds (k 0.764 at FAR): "The Fahrenheit pulls back / closes in" re-registers the camera and the scene
  scales him (`scenes/evrae-airship-range.ts`), a phase of the fight, not a re-plan; the plans there are `scale -1` before and after. **Sin's fins** (Chapter XVII) change at the link boundary (left fin, right fin, core), the scene's own.
- **The first plan is the 39.1 build's for every boss but Yojimbo:** a test holds `planScale` against the old method over 200 random scenes, and the first-menu heights match, before and after: Natus 349, Braska's Final Aeon 332
  to 334, Evrae 403, Bahamut 563, Vegnagun 868, Sin 549 and 445 px.

Seeds 2 and 3, 1600x900 (the same sequence; the screenshots are kept for seed 1 only):

| boss, seed | before: boss px over 7 menus (k seen) | after: boss px (k seen) |
|---|---|---|
| Yojimbo (FFX IX), seed 2 | 214 to 336 (x1.57); k 1, 1.311, 1.313, 1.535; first menu plans 1 | 250 to 261 (x1.04); k 1.163; first menu plans 1 |
| Yojimbo (FFX IX), seed 3 | 215 to 283 (x1.32); k 1, 1.289, 1.311; first menu plans 1 | 250 to 262 (x1.05); k 1.163; first menu plans 1 |
| Bahamut (FFX-2 IV), seed 2 | 413 to 566 (x1.37); k 1, 1.387, 1.388, 1.408; first menu plans 1 | 517 to 569 (x1.10); k 1.387; first menu plans 1 |
| Bahamut (FFX-2 IV), seed 3 | 415 to 581 (x1.40); k 1, 1.387, 1.408; first menu plans 1 | 554 to 572 (x1.03); k 1.387; first menu plans 1 |
| Seymour Natus (FFX X), seed 2 | 348 to 349 (x1.00); k 1.638; first menu plans 1 | 349 to 350 (x1.00); k 1.638; first menu plans 1 |
| Seymour Natus (FFX X), seed 3 | 349 to 349 (x1.00); k 1.638; first menu plans 1 | 348 to 349 (x1.00); k 1.638; first menu plans 1 |
| Braska's Final Aeon (FFX III), seed 2 | 330 to 343 (x1.04); k 1; first menu plans 1 | 329 to 335 (x1.02); k 1; first menu plans 1 |
| Braska's Final Aeon (FFX III), seed 3 | 329 to 334 (x1.01); k 1; first menu plans 1 | 330 to 334 (x1.01); k 1; first menu plans 1 |
| Evrae (FFX VIII), seed 2 | 184 to 418 (x2.27); k 0.764, 1; first menu plans 1 | 184 to 404 (x2.19); k 0.764, 1; first menu plans 1 |
| Evrae (FFX VIII), seed 3 | 184 to 404 (x2.19); k 0.764, 1; first menu plans 1 | 184 to 403 (x2.19); k 0.764, 1; first menu plans 1 |

## What is in the branch

| File | What |
|---|---|
| `src/engine/fx/mix/masters.ts` | `scaleTarget('yojimbo')` is 1.15 (the colossi keep 2.2 / 2.4 / 2.0); `scaleHeld` (Yojimbo only); the header notes both |
| `src/engine/fx/mix/staging.ts` | `Staging.planScale(..., opts)`: `locked` (a boss the phase already sizes keeps its factor as it stands), `held` (full target whatever the step), `view` (a held boss is read as the picture shows it: its painted box and the party's through today's camera, not by distance). Without options it is the old method |
| `src/engine/fx/mix/scaleLock.ts` (new, 114 lines) | `ScaleLock`, `phaseLayout` (the layout, TEXT SIZE and whether the table pins the master), `scaleKey` (a phase = the sized bosses + today's resting rig + that layout), `stepsFor` (a held boss one step; a phase with a lock plays its step; else every step as ever), `stepOf` (a plan that falls back to today's rig leaves the phase's step standing, so the master is tried again), `lockOf`, `sizingOf`, `viewOf`, `holdEarly` |
| `src/engine/fx/mix/framing.ts` (397 lines) | `decide` reads the lock for this phase, passes it to every candidate (today's rig included: it plays only the sizes the phase holds, and is held to the colossus gate when it does: it is exempt only because it draws the stage's own boss), tries only the phase's step, and records the lock in the `Decision`; `commit` keeps it; `update` runs `holdEarly` until the first plan is on screen (and lets the early size go when the framing is switched off first) |
| `src/engine/fx/mix/framingTypes.ts` | `Decision.lock` |
| `tests/unit/fx-mix-boss-scale.test.ts` (21), `fx-mix-boss-scale-framing.test.ts` (11) | The numbers; Yojimbo's 1.15 at three sizes; `planScale` against the old method on 200 random scenes; the lock held across three simulated menu states with a control that shows the jump without it; `Framing` run through its real plan with a stand-in rig and document (Yojimbo at three menus with three command lists and three leaning members; a stepping boss over four panel sets, with the control; a member leaning into the boss; phone and framing-off no-ops; the early size before the plan, with a menu open, and released) |
| `docs/screenshots/r392-boss-scale/` | `yojimbo-bahamut-before-after.jpg` (Yojimbo at Kimahri's and Yuna's menus, Bahamut at the two menus it jumped between) and `phone-gauge-card-390x844.jpg` |
| `docs/handoff/r392-boss-scale-evidence/` | `bs-measure.mjs` (the real-keys harness: every menu's boxes, scales, plan report and a 110 ms series between them), `phone-options.mjs`, and `tables.md` (the tables above, generated) |
| `docs/plans/r392-boss-scale-review.md` | The paper preflight |

No shared contract (`docs/CONTRACTS.md`) is touched, so there is no `CONTRACT-CHANGES.md` entry. `node tools/orphans.mjs`: `scaleLock.ts` is reachable (the 24 orphans are main's own).

## How it works, and why this approach

**The jump.** `Framing.decide` searched BOSS SCALE's steps afresh on every plan (`FRACS`, the first step that clears the HUD wins), and the live check at a menu's opening asks for another plan when a member
is under a panel. Which step cleared depended on the member leaning at that moment and on the panels that menu shows (the command list is taller for Yuna's seven commands than for Kimahri's five), so the same
fight chose step 0.25 at Kimahri's menu, today's rig at Yuna's, step 0 at Lulu's and 0.25 again: Yojimbo 285, 222, 214, 280 px.

**Held (Yojimbo).** His target is a proportion Bailey picked, not a loom, so there is no step to give up: he takes the full target in every candidate, under the colossus master and on today's rig
alike, read from the painted boxes through today's camera (so it is 1.15 at today's rig, within 1.4 percent under the master: the old distance reading lands about 2 percent high). The HUD fit moves the
camera for him, never him.

**The lock (every sized boss).** The first plan chooses as it always did and the factor it put on each sized boss is kept, by painted id, for the phase. Every later plan plays that factor as it stands,
and the fit (blend toward today's rig, stand-back, lens shift, the party's step) moves the camera for it. A phase ends when the sized bosses on the stage, today's resting rig (a scene that re-registers
it: Evrae's range) or the layout (the window, the phone, TEXT SIZE, a table's pin) change; a link is a new `Framing`, so it starts clean. This is the "keep the scale fixed and let the HUD-clearance fallback
move the camera" approach of the brief. The other, "the largest step that clears the HUD for every menu state, computed up front", cannot be computed up front: which member leans and which list is up is known only
at that menu, and an estimate over the worst case would change the first plan of every colossus (the approved Natus, Bahamut and Braska pictures). The lock keeps every first plan exactly and removes
only the later swings, so the art stays steady: one size per fight, the camera free to answer the HUD.

**Before the plan lands.** The plan waits for a calm frame and, decided under an open menu, for the menu to close. In 2 of the 11 runs at 1600x900 of the first measurement the first menu opened before the plan
had landed and showed Yojimbo at 1.00 (the "C" frame of the first report; none of the runs here saw it, which is why it is tested in code, with a menu open, and not by a run). A held boss now takes its size at the first
calm frame and keeps it every frame, and the plan plays the factor already there. Under a x6 CPU throttle (`--throttle=6`) the plan landed 2.0 s into the fight instead of 0.8 s, and Yojimbo was at k 1.163 from 0.4 s
(plans 0), unchanged by the plan.

## Trade-offs, measured

- **A menu the colossus master cannot clear at the phase's size.** Bahamut seed 1, menu 4 (Rikku's), is the one: the search tries the master at the phase's size and today's rig at that size. A first version let today's
  rig win it with the boss covering 31 percent of a girl's box; today's rig is exempt from the colossus gate only because it draws the stage's own boss, so it is now held to it when it plays a size the phase holds, and the
  master wins: party overlap 0.30 (the 39.1 build: 0.73, with the boss shrunk to k 1.00, 416 px), boss cover 0 (0.02), 559 px against 563 at the first menu. The next plan plays the master at the same size again (`stepOf`).
- **A lock is as good as the first plan.** A phase whose first plan fell back to today's rig keeps it (Braska's Final Aeon and Evrae did at every plan in both builds, so they stay the drawn size; Natus is pinned). A first
  plan that lands on a transient state would keep that size for the phase: the first plan is the blind one at the battle's start, which is why it stays the approved look.
- **The live ratio moves with the leaning member's painting** (above), not with the boss.

## The phone (390x844, FFX Chapter IX)

**BOSS SCALE does not apply on the phone** (`decide`: the colossus tries need `!phoneBattle()`, and the sizing options are empty there: the scene fits its own rig to the slice, A-12), so the brief's "about 1.15 if the
phone path applies boss scale; otherwise leave the phone as is" resolves to **left as is, and said so**: Yojimbo is 128 to 129 px against a party mean of 128 to 132 (0.97 to 1.00 times, k 1.00) at the first three menus, before and after.

**The Zanmato gauge card covers him** (`docs/screenshots/r392-boss-scale/phone-gauge-card-390x844.jpg`): the card stands at 12, 142 to 378, 287 (`phone-hud-parts.css`: under the rail and the enemy line, `--phud-line-bottom` + 6; 145 px
tall) and Yojimbo's painted box is 248 to 372 wide and 136 to 286 tall: **95 to 100 percent of him is behind it** at all three menus (Daigoro and Ginnem too). The cause is dated: the card's phone place came with the compact rail,
while the Chapter IX phone rigs (`scenes/cavern-stolen-fayth-rigs.ts`) were solved "against the phone HUD measured live: the gauge across the top" and promise the fiends "clear of the gauge". The framing's panel scan does
read the card (its live check has Yojimbo 92 to 100 percent and Daigoro and Ginnem 100 percent under a panel at every menu) and lets it stand: its rule for a boss part is "no worse than today's rig shows it", and today's rig already has
Yojimbo 94 percent under it (the plan's limits read `yojimbo-cavern 0.97/0.94`). The fit's vertical lens shift is capped at 4 percent of the field (21 px of 520; menus 2 and 3 carry exactly that) against a card 145 px tall.

**Not a small fix, so nothing is built.** The visible band between the card and the party tiles (486) is 199 px; Yojimbo (129 px) and the party (130 px) need about 260 px between them because he stands 130 px higher on the screen
(behind them), so a rig shift alone cannot fit both. Two frames, tried by overriding CSS on the open page and not built:

1. **The card keeps to the left 72 percent of the width** (`right: calc(28vw + 8px)`): Yojimbo is clear at menus 2 and 3 but his left edge is still 27 percent under the card at menu 1, and the three band labels (DAIGORO, + KOZUKA,
   + WAKIZASHI, placed by percent along the bar) collide at that width. It needs the labels reflowed: a design change.
2. **A compact card and the field lower** (name, percent, bar and bands, about 100 px; the field drawn 126 px lower at 0.88): Yojimbo, Daigoro and the party all stand in the band, 0 percent covered. It changes the gauge card (the
   "Next:" line and the 25 / 50 / 80 numbers go, or move) and the Chapter IX phone rigs: both look at Bailey's old picks (the gauge, D-124; the phone HUD, option B), so it needs his look before it is built (rule 9).

## For Bailey and the driver

1. **Yojimbo's size is one number** (`scaleTarget('yojimbo')`, 1.15), held until a real FFX screenshot settles it. The Steam HD Remaster copy (`D:/Tools/ffx-hd`, app 359870) is the place to look (ask before taking over the
   screen; no retail frames in the repo). Nothing in `research/` states his on-screen proportion.
2. **The phone gauge card:** which of the two frames above (or neither) to build; a note on the Chapter IX phone rigs' own comment ("clear of the gauge") is stale either way.
3. Not measured: 16:10 and ultrawide windows, TEXT SIZE other than 100, FFX-2 Bahamut at sizes other than 1600x900, the other chapters (they have no sized boss).
4. The decision ("About 1.15x the party", 2026-10-06, FFX only) and the action rows for this lane are the driver's to add to `decisions.json` / `actions.json` and the ledgers; this branch writes none, nor `NOW.md`.

## How to repeat it

Build (PowerShell; Git Bash turns the lone `/` of `BASE_PATH=/` into its install folder): `$env:BASE_PATH='/'; npm run build`, then `npx vite preview --port 4392`. With a lean copy of `vite.config.ts` that sets
`build.copyPublicDir: false`, `PYREFLY_ART_WEBP=off` and junctions to `public/art`, `fx`, `audio` and `fonts` in the output, a rebuild of the code takes 2 seconds and no disk (7.7 GB of art otherwise). Measure, one browser at a time:
`PYREFLY_BROWSER=gpu node docs/handoff/r392-boss-scale-evidence/bs-measure.mjs --base=http://127.0.0.1:4392/ --chapter=yojimbo-cavern --size=1600x900 --menus=7 --seed=1 --out=<dir>` (chapter ids:
`yojimbo-cavern`, `ffx2-bahamut`, `seymour-natus`, `braskas-final-aeon`, `evrae-airship`, `ffx2-vegnagun-shuyin`, `sin-fins-core`, `sin-face`; `--throttle=6` slows the CPU; `--touch=true` with `--size=390x844` for the phone;
seeds other than 1 take no screenshots, and `--noshots=true` skips them for seed 1 too). `phone-options.mjs` takes the phone frames of the gauge card. The builds measured: before = `9c690231`, after = this branch's code (the bundle built from the committed tree is byte-identical to the one measured: `index-C_C63iWI.js`, 3,896,101 bytes).
