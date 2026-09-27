# Handoff: iter2-vegnagun-a (Vegnagun staging option A)

**Game case: FFX-2 only** (AGENTS.md rule 14). Chapter V's four Vegnagun links have no FFX
counterpart; no other chapter stages these combatant ids. The one shared hook
(`SceneBuild.bindCamera`) is additive plumbing (both) that only the Farplane sets on this branch.

**On whose word.** Bailey, 2026-09-26 ~19:30 EDT: "i'll go with all your recommendations, i love
it.", answering the B3 options round, recommendation A
(`docs/concepts/vegnagun-colossus-2026-09-26/README.md`). A pick approves only what the option
showed, so this builds the mock's frames and nothing beyond them.

Branch `iter2-vegnagun-a`, worktree `D:/pyrefly-iter2-vegnagun`. Not merged, not deployed.

## What changed

| File | Change |
|---|---|
| `src/scenes/farplane-colossus.ts` (new, ~250 lines) | Option A's tables: per-link part spot, scale and mirror, the low idle camera and the push rig, for a desktop and for an upright phone. `colossusStaging(phone)` builds the staging switches. `VegnagunColossus` is a per-frame controller that sets the rigs, the backdrop, the head's mirror and the ring draw order while a part is staged. |
| `src/scenes/farplane.ts` (+5 lines, the file `r21-road-phone` is said to own; that branch does not touch it) | Builds one `VegnagunColossus` (line ~491), publishes `...colossus.staging` in place of `...FARPLANE_STAGING`, plus `bindCamera` (line ~855). Calls `colossus.update(group.parent)` in `update` and `colossus.bind(null)` in `dispose`. |
| `src/scenes/types.ts`, `src/scenes/index.ts` | `SceneBuild.bindCamera?` and its one call in `fromSceneBuild`. **Byte-identical to `r21-road-phone`'s hunk** (applied from its diff), so the two merge cleanly. After both land, the doc comment on `bindCamera` should name both users (the Road's phone camera and the Farplane colossus). |
| `tests/unit/chapters/vegnagun-colossus.test.ts` (17), `vegnagun-colossus-scene.test.ts` (2, jsdom, real `loadScene('farplane')`) | Written first; both failed before the module and the wiring existed. |
| `docs/screenshots/vegnagun-a/` | Target-vs-build sheets, build frames at 1600x900 (`desk`), 2000x1012 (`wide`) and 390x844 (`phone`), plus `measurements.json`. |

`src/scenes/farplane-parts.ts` (t1-b2b's folder) is **unchanged**: the colossus module derives its
table from `FARPLANE_STAGING` without editing it. No boss number, no game data and no HUD file changed.

## How option A is built

- **Parts.** Each part is pinned (`enemySpots`) and sized (`figureHeights` = 4.1 × the scale; 4.1 is
  the stage's default boss height, which is what the mock scaled from). Scales: tail 5.6, leg 5.5,
  body 4.3, head 4.8 on a desktop; tail 3.9, leg 4.6, body 2.7, head 3.6 on a phone. The head is drawn
  mirrored (group `scale.x` negative, as the mock did it).
- **Camera.** While a Vegnagun part is staged, `idle` becomes the low master
  (`[1.2, 1.15, 14.5] → [1.8, 3.4, -4]`, fov 40, sway 0.6). `enemy` becomes the push up the part
  (`[1.35, 1.0, 12.0] → [1.9, 3.9, -4]`, fov 40); the boss reveal and every enemy action move to that
  rig. The phone uses its own pair. `action`, `party`, `victory` and `reveal` are unchanged.
- **Backdrop.** The painting, its layers, the haze and the mist grow 1.8× and rise 6 (the mock's `bg(1.8, 6)`).
- **Link switching.** The latest staged link in chain order wins. The staging holds through the gap
  between two links, and everything is given back exactly when Shuyin takes the field (link 5).
  Chapter XI's placeholder use of this scene never switches it on.
- **Phone or desktop** is read once when the scene is built (`PHONE_BATTLE_QUERY`), as the Road does.

### One correction to the README's listed values (read this before re-tuning)

The mock's console placed the tail at x −5.0 and the head at x 13.5. Neither part was pinned on
main, so the stage re-solved both figures' x afterwards; the leg and body were pinned and stayed
put. **The frames Bailey approved therefore show the tail at x 9.74 and the head at x 0.33 on a
desktop, and 0.79 and −4.32 on a phone.** I solved those values from the mock's own capture reports
(`D:/Tools/pyrefly-scratch/b3/out/*-report.json`) using the projected rects and the Redoubt rings'
world points. As a check on the method, the pinned leg and body solved back to their listed values
within 0.05. Building to the listed −5.0 and 13.5 gave a mirrored tail and a head pushed 550 px
right, which is not the picked frame.

## Target vs build

- `compare-desk-1600-target-vs-build.jpg`: all four links match the mock's option A frames in part
  position, scale, facing and crop, and the girls sit small at lower left (about 160 px tall against
  the mock's about 155).
- `compare-phone-390-target-vs-build.jpg`: all four links match. The part is on screen above the
  HUD at every link.
- Visible differences, none from the staging:
  - The guide, moves and intent panels are open by default. The mock had closed them with G, N and E.
  - HP and turn states differ.
  - The target bracket and selection petals on a Bulwark or Redoubt are larger than in the mock's
    target frame, because they now size from the scaled ring radius (see Rings below).
- `push-enemy-rig-desk-1600-debug.jpg`: the push rig at each link. It was reached by
  `battleCamera.snapTo('enemy')` from the debug API, which is why the file is labelled debug.

Part height against the tallest girl, measured on the projected quads at the first menu:

| Link | Desktop (1600x900) | Wide (2000x1012) | Phone (390x844) |
|---|---|---|---|
| 1 Tail | 5.3× | 4.9× | 3.8× |
| 2 Leg | 6.1× | 5.4× | 4.5× |
| 3 Body | 4.2× | 4.2× | 2.5× |
| 4 Head | 5.2× | 5.3× | 4.0× |

## Rings, plates, Nodes (PR-0095 / PR-0094): which anchors followed the scale

- **Redoubts:** same painted anchor pixels (tusk 330,510; jaw 560,680). The ring radius is × the
  head's scale (0.42 → 2.02 and 0.36 → 1.73 on a desktop).
- **Bulwarks:** re-anchored as the mock did it, from a flat ground ring at the foot line (y 811) to
  an **upright** ring at y 700. At 4.3× a floor ring was a sliver. The radius is × the body's scale
  (0.55 → 2.37 on a desktop, 1.49 on a phone), and the chest aim points are unchanged.
- **Nodes:** the overhead offsets are the mock's (6, 40, −4), (10, 46, 0) and (6, 40, 4), in place of
  (2, 9, ±1.5), so they still hang "far overhead" of a leg that is now 22 units tall. The HUD's edge
  markers show them, as before.
- **Consequences:**
  - The figure-less actor, the target bracket and the selection accent size from the same radius
    (`StageAnchors.anchoredRingRadius`), so they grew with the ring. The mock scaled only the ring
    mesh.
  - The rings draw over the paintings (render order 11 in place of 7, the mock's `ringsOver(true)`).
  - The name plates follow their anchors; no plate code changed.
  - PR-0072's contact shadow (farplane.ts, waiting on `r21-road-phone`) should be measured on this
    staging.

## HUD against each part's key feature (measured, `measurements.json`)

Method: I chose key-feature boxes in each painting's pixels, projected them through the live plane
(`paintPoint`), and measured the covered fraction against `.eint__panel` (the intent slab),
`.ffx2hud__command`, the enemy bars and the party panel. Each was measured at the first menu and
again while aiming with real keys.

- **Command window: covers no key feature at any viewport or link (0 everywhere).**
- **Intent slab:**

| Link, feature | 1600x900 | 2000x1012 | 390x844 |
|---|---|---|---|
| Tail stinger | 0 | 0 | 0 |
| Tail joint (secondary) | 0 | 0.47 | 0 |
| Leg spike claw | 0 | 0 | 0 |
| Leg green lens | 0 | 0 | **0.99** |
| Leg knee (secondary) | 0.13 | 0.15 | 0.30 |
| Body core (Charge Core) | **0.18** | **0.18** | 0 |
| Head skull face | 0 | 0 | 0 |
| Head horn / Right Redoubt ring | 0 (0.42 aiming, earlier run) | 0.13 (0.42 aiming) | 0 |

- **Enemy bars:** they cover the body's left muzzle lens (0.64 on the desktop views), a secondary
  feature.

**Not met, disclosed:**

1. **Phone, link 2.** The top intent strip (y 145 to 195 under three Node bars) covers the leg's
   green lens. The approved phone frame hides it in the same way, because the mock ignored the HUD.
   The spike claw, the part's main shape, is clear. Scene-side fix, measured: phone leg scale 4.6 →
   3.7 (k 0.8) clears the lens (top 194 against the strip's 195; about 3.8× a girl). But the leg then
   no longer runs off the top edge, which changes the picked frame, so it is **not built**; it needs
   the driver's or Bailey's call.
2. **Desktop and wide, link 3.** When Vegnagun's own "Charge Core" slab is up, its lower-left corner
   clips the top-right of the core's rim (18% of the box). The slab hangs over the body's head point,
   which is the frame's centre for a part this large. The core is clear while aiming. Sinking the
   body does not clear it, because the slab's height varies from 323 to 396 px with its text. The real
   fix is HUD-side: the FFX-2 intent solver (`src/ui/ffx2/intentBoard.ts` `fighterBoxes`) should treat
   a part's key-feature box as an obstacle in place of its whole (frame-filling) soft box. That is
   plumbing (scene → stage → HUD), outside this brief's scene-only scope, so it is **proposed, not
   built**.

## Checks

- `npx tsc --noEmit` is clean.
- The new tests (19) and `tests/unit/engine/part-anchors.test.ts` pass.
- Full `vitest --testTimeout=60000`: 450 files passed, 1 failed:
  `tests/unit/audio-manifest-io.test.ts`, a file-IO test unrelated to this change. It passes 9/9 on
  its own on this branch and on main, so it is a flake under load.
- `node tools/orphans.mjs`: 24 orphans, the same count as main; `farplane-colossus.ts` is reachable.
- **Browser, headless GPU (`PYREFLY_BROWSER=gpu`), dev server on port 6070:**
  - The links were reached with the debug API: seed 1, `gotoChapter` plus `autoBattle('intended')`
    at skip speed, the same route the mock used.
  - At each link's first menu, real keys: Enter opened the first command. At links 3 and 4,
    ArrowRight aimed at the Left Bulwark and the Left Redoubt. Escape backed out to the root menu.
    All of this worked at all three viewports (`build-*-keys.jpg`; before, after and back are in
    `measurements.json`).
  - Every server I started was stopped by its PID.

## Not done / next

- The two disclosed HUD overlaps above, which need a decision.
- The plan's Shuyin-link Vegnagun silhouette on the horizon needs new art, and is outside links 1-4.
- Option B (the unified repaint, ART-6) is a separate decision after A is live.
- The scratch files in the worktree (`tools/zz-vega-*.tmp.mjs`, `.vega-vite-tmp.config.mjs`) are
  uncommitted agent scratch.

## CHECK (independent, 2026-09-26; did not build it)

Checked commit `fa7bb1a8` on `iter2-vegnagun-a` against the picked mock (`docs/concepts/vegnagun-colossus-2026-09-26/`,
its raw captures in `D:/Tools/pyrefly-scratch/b3/out/` and `mock-scripts/`). **Game case: FFX-2 only** (Chapter V);
the `bindCamera` hook is shared plumbing ("both") and changes nothing where a scene does not set it.

**Re-run here**
- `tsc --noEmit`: clean (TS 7.0.2, 2063 files).
- Full `vitest --testTimeout=60000`: **451 files passed, 0 failed** (4 skipped; 8330 tests). The builder's
  `audio-manifest-io` flake did not recur. The 3 new/related files alone: 34/34.
- `node tools/orphans.mjs`: 24 orphans, same as main (777 → 778 reachable; `farplane-colossus.ts` reachable).
- No file under `src/data/**` or `src/battle/**` changed: **no boss number moved**. `farplane-parts.ts` unchanged.
- My own production build (`vite build`, base `/pyrefly-reprise/`) of the branch on port 6075 and of main (a
  detached worktree of `8abc7473`) on port 6076, headless Chromium with `PYREFLY_BROWSER=gpu`. Both servers
  stopped by PID.

**Links reached** with the debug API (labelled: seed 1, `gotoChapter` with `auto: 'intended'` at skip speed, then
autoplay off and normal speed at each link's first menu), at 1600x900, 2000x1012 and 390x844, through **all five
battles** (links 1-4 and Shuyin). No page errors at any size.

**Real keys (Playwright keyboard) at each link's first menu, all three sizes: pass.** Enter opened the first
command (White Magic submenu or Attack targeting); at links 3 and 4 ArrowRight reached `bulwark-l` and `redoubt-l`;
Escape returned to the same root menu every time. One pre-existing quirk, **also on main at the same point**: the
very first Enter after the debug-API hand-off at link 1 is ignored and the second one opens the menu (probed
press by press on both builds). Not caused by this branch; possibly an artefact of the autoplay hand-off.

**Target vs build** (my own frames: `D:/Tools/pyrefly-scratch/vega-check/out/check-desk-1600-target-vs-build.jpg`,
`desk-*`, `wide-*`, `phone-*`): part position, scale, facing and crop match the mock's option A frames at all four
links on desktop and phone; the girls stand small at lower left; on the phone the part is on screen above the HUD
at every link. Measured on the production build:

| | Tail | Leg | Body | Head | Shuyin (link 5) |
|---|---|---|---|---|---|
| part x, desktop / phone | 9.74 / 0.79 | 3.2 / 0.6 | −4.6 / −4.6 | 0.33 / −4.32, mirrored | today's |
| part height (world) desktop / phone | 22.96 / 15.99 | 22.55 / 18.86 | 17.63 / 11.07 | 19.68 / 14.76 | 4.1 |
| idle rig fov | 40 | 40 | 40 | 40 | **32 (today's)** |
| backdrop scale, painting y | 1.8, 5.5 | 1.8, 5.5 | 1.8, 5.5 | 1.8, 5.5 | **1.0, −0.5 (today's)** |

The builder's correction of the README's tail and head x (the mock never pinned them) checks out: the mock's
frames show the parts where the build puts them, and building to the listed −5.0 / 13.5 would not reproduce them.

**Regressions: none found.**
- Shuyin (link 5), desktop and phone: idle and enemy rigs, backdrop and Shuyin's projected rect equal main's to
  within 2 px. (On the phone Shuyin sits at x 330-480 of 390, mostly off the right edge, **on main too**: the known
  A-1 phone framing defect, not this branch.)
- Chapter XI (`ffx2-fallen-aeons`, the same scene), desktop and phone: rigs, backdrop and every projected rect equal
  main's to within 9 px (idle sway). The colossus never switched on.
- The head stayed mirrored in all 249 samples over 30 s of real enemy and party actions at link 4; a real enemy
  action moves to the new push rig (frames `push-vegnagun-*-real-enemy-*.png`). The `party` and `action` rigs are
  today's, so while the girls act or are hit the camera goes in close on them and the part leaves the frame; the
  mock did not show those moments, so nothing to compare.

**Deviations from the picked frames (not regressions)**
1. **Bulwark rings are round, the approved ones are flat ellipses (minor).** In the mock the patched anchor turned
   the rings upright, but `PartRings` had already set `mesh.scale.y = 0.46` for a ground ring and never reset it,
   so every approved frame (`02`, `05`, the raw `desk-3-body-A-*.png`) shows a camera-facing ring squashed to
   0.46. The build draws a full circle of the same width (about 190 px at 1600), so it is about twice as tall as
   the approved ring and covers more of the foot. The handoff's "upright ring, as in the mock" is true of the
   orientation, not of the look. Matching the picked frame needs a vertical squash on these two rings, which is
   a small `PartAnchors` change (engine, not the scene); or Bailey accepts the round ring. Not changed here.
2. **Target bracket and selection petals on a Bulwark are about twice the mock's size** (already disclosed by the
   builder): they size from the scaled ring radius; the mock scaled only the ring mesh.
3. The two HUD overlaps the builder disclosed are confirmed on my frames: at 1600 and 2000 the "Charge Core" slab's
   lower-left corner touches the core's upper-right rim (slab 719-1094 × 74-323 at 1600), and on the phone at link
   2 the top intent strip (y 145-195) sits over the leg's green lens. Both need a decision (HUD-side avoidance, or
   the smaller phone leg that changes the picked frame).

**Other notes**
- `src/scenes/types.ts`: the `bindCamera` doc comment still says the Road is "the one user"; after this branch the
  Farplane uses it too (the builder flagged this for the merge with `r21-road-phone`).
- `src/scenes/farplane.ts` is 1180 lines (1175 on main): over the 400-line house rule before this branch; the
  branch adds 5 and keeps its logic in the new 267-line module.
- Uncommitted agent scratch in the worktree: `tools/zz-vega*.tmp.mjs` (the builder's and mine), `.vega-vite-tmp.config.mjs`.

**Verdict:** ship-ready for the changed area (no critical, no regression; tests, types, orphans green; real keys
pass at every link and size). One minor fidelity deviation (round Bulwark rings) and the two disclosed HUD overlaps
need the driver's or Bailey's call.
