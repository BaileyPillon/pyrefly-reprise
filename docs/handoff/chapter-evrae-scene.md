# Chapter: Evrae on the deck of the Fahrenheit (FFX): the scene and the NEAR / FAR switch

**Game case: FFX only** [AGENTS.md rule 14]. The airship distance mechanic "has no X-2
counterpart" (`research/ffx-evrae-airship.md` §0.4), and nothing here applies to an FFX-2
chapter. The absence check is the last `describe` in `tests/unit/chapters/evrae-scene.test.ts`:
the seven scene files import nothing from `battle/ffx2`, `data/ffx2` or `ui/ffx2`.

Built the way the Leblanc (`68b8b6b`) and Macalania (`823450d`) scenes were built: a `SceneFactory`
that owns no actors, a staged preview, a throwaway debug screen, pure-export tests and one browser
pass. Like Macalania, **this track edited no shared registry** (§6 has the integrator's lines).

## 1. Files

| File | Lines | What |
|---|---|---|
| `src/scenes/evrae-airship-deck.ts` | 324 | `buildEvraeAirshipDeckScene` (the `SceneFactory`: the rolled sky painting, the deck, the lights, wind grit, rigs), `EVRAE_AIRSHIP_DECK_SLOTS`, `EVRAE_AIRSHIP_ACTOR_HEIGHTS`, `EVRAE_ENEMY_SLOT`, `EVRAE_AIRSHIP_DECK_RIGS`, `EVRAE_AIRSHIP_DECK_BACKDROP`, `EVRAE_AIRSHIP_DECK_PALETTE` (kept in the scene file, so `ScenePalettes.ts` is untouched) |
| `src/scenes/evrae-airship-range.ts` | 247 | **Pure** (no three, no DOM): `airshipRangeOf(state)` (the one "does this encounter declare the range" test), `airshipOrderOf`, `missilesLeftOf`, the head-ratio numbers (`EVRAE_HEAD_PX`, `EVRAE_FAR_HEAD_RATIO`, `farActorScale`, `farWorldWidth`), `RANGE_STAGING` (Evrae's spot, the three rigs, haze, wind, key light and ambient per range), `DECK`, the shift timeline `rangeShiftAt(ms)` |
| `src/scenes/evrae-airship-director.ts` | 239 | `AirshipRangeDirector` (swaps the rigs, moves and re-paints Evrae, blends haze, wind and light), `attachAirshipRange` / `airshipRangeDirectorOf` (the `userData` channel `StageArrivals.ts` set) |
| `src/scenes/evrae-airship-sky.ts` | 335 | The deck (procedural plating, the "SALVAGE DREAM / CID" stencil as one decal), the rail, the deck lip, the scrolling cloud layers and the cold haze sheet |
| `src/scenes/evrae-airship-painted.ts` | 212 | Preview only: Tidus, Wakka and Rikku (the build's active three), Evrae, a battle camera, the director bound to both. Beats `far`, `near`, `far!`, `near!`, `attack`, `hurt`, `inhale`, `rig:<name>` |
| `src/scenes/evrae-airship-debug.ts` | 120 | `EvraeAirshipSceneScreen` (`scene-evrae-airship-deck`), plus `battle` and `hud:off` beats |
| `src/scenes/evrae-airship-debug-battle.ts` | 178 | Debug only: the real FFX engine (Fahrenheit build, `evrae-airship`, seed 1), the real `FFXBattleHud` and the guide track's `AirshipOrderWidget`, stepped on a real clock, feeding the director. This is how the order loop was proven before registration |
| `tests/unit/chapters/evrae-scene.test.ts` | 323 | 16 cases (§5) |

`docs/target/targets.json`: the existing tile **"Evrae's order/range widget (FFX)"** (added by the
guide track, `d030d82`) now records that C's half is built, with the stills. Its
`reaction.inferred` already read "built to the driver's recommendation A + C's staging, awaiting
Bailey"; it stays `state: gap`, never approved.

## 2. The picks this scene reads, and what is not a pick

- **Backdrop B** ("looking up at the hull from the rail"; `docs/target/targets.json` chapter tile,
  D-020). Installed file `public/art/backdrops/evrae-airship-deck.png`, 2688x1536, **CANDIDATE**.
- **Evrae look B** (teal body, orange fins) through the installed CANDIDATE set
  `public/art/characters/evrae/` (`idle`/`idle-near`, `idle-far`, `breath-charge`, `hurt`, `ko`),
  loaded by folder and state name.
- **The layout is not a pick.** `options.json` and `sheet.png` pick a backdrop and a silhouette;
  neither places anyone. The placement comes from the research (§12.2: "At NEAR it is a
  head-and-claws threat filling the upper third, jaw level with the deck"; "At FAR it is a long
  diagonal streak across open sky with the head small"; §12.3: "a railing and then nothing", the
  deck across the lower third, "At NEAR: Evrae's head over the rail, the deck shadowed by its bulk
  ... At FAR: Evrae small against clean sky, the whole deck lit") and from option **C** of the
  order-widget round, which Bailey has **not** picked (INFERRED, §4).
- **Sizes.** Evrae is 4.1 world units at NEAR, which is the stage's boss height, so the preview and
  a real battle draw the same creature. **No source gives a size** (§12.2 is words only). The party
  heights are Chapter 1's.

### Framing: the rolled sky (measured)

The picked painting is a sky plate with no deck in it, and its own rail runs diagonally across the
bottom: row 0.93 at the left edge, row 0.57 at the right, which is 11.6 degrees in pixels. The deck
and rail the party stands at are geometry. The painting stands far out (z -45, 90 wide), and it is
**rolled -0.2025 rad about its centre**, so its rail lies level (the two ends are within 0.5 units
after the roll; the test pins it). With the centre at y 3.0, the rail's top edge sits near y -8.0.
The sightline over the deck's far edge (z -2.7) crosses the painting plane at y -5.1 on NEAR's
idle rig, y -6.5 on FAR's and y -6.0 on the intro rig, so the painted rail is always behind our
deck. The painting then reads as the sky past our own rail, down to the bright cloud under its hull.
The test measures all three rigs.

Three things a first pass got wrong, and how each was found at 1:1:

- The painting sat too low, with a hull-only sky. The roll fixed this.
- Horizontal wisp sheets read as scan lines over the dark hull. They are now soft cumulus with a
  soft edge mask, and the lines stayed only below the rail.
- The "SALVAGE DREAM CID" stencil was tiled across the deck five times. It is now one decal
  (§12.1, `[single source: wiki Fahrenheit]`).

## 3. NEAR and FAR: one creature, two positions (the far scale)

**The far scale comes from the head length**, which is what `idle-far.json`'s note asked the scene
owner to set. The head was measured on the installed CANDIDATE paintings at native pixels, from
3x/4x nearest-neighbour crops with 10 px ticks, snout tip to eye centre:

| Painting | Snout | Eye | Head |
|---|---|---|---|
| `idle-near.png` (1171x784, baseline 768) | (221.7, 210) | (281.7, 175) | **69.5 px** |
| `idle-far.png` (1024x477, baseline 461) | (18.8, 97.5) | (72.5, 85.5) | **55.1 px** |

So FAR is drawn at `69.5 / 55.1 = 1.261` times NEAR's pixel scale. At the same distance, the head
is the same world size. **Distance then does the shrinking**: FAR stands at (6.4, 3.3, -30), out in
open sky, against NEAR's (2.3, -0.9, -4.7) past the rail. The painting is never simply drawn small.
The FAR streak comes out 6.9 world units long.

While FAR shows, the director loads the `idle-far` painting under `idle`, `attack`, `cast` and
`hurt`. That way every `setPose('idle')` the presenter makes stays on the streak, and only `ko`
keeps its own painting. `PaintedActor` then sizes the reference pose to the boss height and clamps
its long side at 2.2x (it logs one "very different pixel scale" warning per load). So the director
**measures what the actor drew** (`poseSize`) and scales the group to `farWorldWidth`.

The browser measured scale 0.764, against 0.757 on paper; the difference is that clamp. A
re-render of either painting changes the two head numbers. The test compares the sidecars'
baselines and width with the constants whenever the art is on disk.

**The switch** (`AirshipRangeDirector`, driven by `state.flags['airship.range']`). No dedicated
range event exists: the flag flips when Cid flies a queued order (a `message`, "The Fahrenheit
pulls back" / "closes in") and when Swooping Scythe drags the ship in (a `counter`). So the
director reads the flag and never parses text. `rangeShiftAt` runs a 1.5 s shift, one continuous
move with no cut:

- **0 to 0.45 s:** the cloud drift and the wind grit reach the new speed first. The ship has
  already moved; this is §12.3's "its speed ... must visibly change when the ship manoeuvres".
- **0 to 0.38 s:** Evrae fades out where it was.
- **At 0.38 s:** it is re-painted and re-placed, then fades in over 0.62 s once the painting has
  loaded.
- **Over 1.5 s:** the camera travels to the new range's rig. The scene's generic `idle`, `action`
  and `enemy` rigs are replaced under the same names, so every later `moveTo('idle')` lands right.
  The haze and the key light (warm and shadowed at NEAR, cool and open at FAR) blend over the same
  1.5 s.

## 4. What is INFERRED, not approved (rule 9)

Bailey has **not** picked from `docs/concepts/chapters/evrae/widget/` (A the Trigger pair in the
cascade with a cost preview, B a deck-side gauge, C the field re-staged). The driver's
recommendation is **A's widget with C's staging**:

- **A (the widget) was built by the guide track in `d030d82`**: `src/ui/ffx/AirshipOrderWidget.ts`,
  its CSS in `ffx-hud.css`, and `tests/unit/ui-ffx-airship-order-widget.test.ts`. This track did
  **not** build a second one. It drove that widget with the keyboard in the browser pass, docked its
  `orderChipHtml` on Cid's CTB tile in the harness, and recorded C's half on the same tile.
  (During the work this track briefly wrote over that file by mistake. It was put back from `HEAD`
  with `git show` before anything was committed, and the file is unchanged in this track's commit.)
- **C (the staging) is this track.** Not built from C: the one-shot "Pull back, Cid!" shout. A's
  ORDER chip is the confirmation in the recommended mix.

## 5. How it was verified

- `npx tsc --noEmit`: clean.
- `npx vitest run tests/unit/chapters/evrae-scene.test.ts`: **16 passed**, run alongside
  `ui-ffx-airship-order-widget` and `evrae-engine` (49 passed together). The cases:
  - The enemy slots are indexed exactly as `evrae.ts` numbers them. Cid's slot repeats Evrae's.
  - The party stands on the deck. NEAR Evrae hangs past the rail, with its coils below the deck
    line and its head above the rail.
  - **Through a real three.js camera at 16:9:** NEAR Evrae is inside the frame and left of the FFX
    HUD rail (0.79). FAR Evrae is less than half NEAR's width, in the sky above the rail line, and
    left of the rail. FAR's camera is further back and higher.
  - The painted rail is level after the roll and below the deck-edge sightline on the NEAR, FAR
    and intro rigs.
  - The head ratio, `farActorScale` 0.757 and `farWorldWidth` 6.9 are pinned, and the sidecars
    agree with the constants when the art is present.
  - The shift timeline: the fade out, the swap, the fade in; the wind leads the blend; the blend is
    monotonic; `done` at 1.5 s.
  - **The director driven by the real FFX engine.** Tidus or Rikku orders `pull-back`, everyone
    else defends, and Cid flies it. The flag reads `far`, and `director.sync` swaps the camera's
    `idle` rig to FAR's numbers. Stepped for 2.5 s, the shift ends with the wind and haze at FAR's
    values. `airshipRangeDirectorOf` finds it on a scene group and returns null on any other.
  - A battle without the mechanic has no range. FFX-only absence.
- `npx vitest run` on `critic-policy-adoptions` and `pause-remake` (the suites that read
  `targets.json`) with the tile edit: 63 passed.
- `node tools/orphans.mjs`: the seven scene files are orphans until the integrator registers them.
  This is expected and exactly Macalania's state before `62b4927`.
- **One browser pass.** This track's own vite dev server ran on :5760 (a random free port in
  5400-5990) with `PYREFLY_BROWSER=gpu`, and was stopped by its Windows PID (50608). The screen was
  registered at runtime through `window.__pyrefly.app.register` after a Vite `import()`, so no
  shared registry was edited. The scratch harness is `tools/zz-evrae-scene.tmp.mjs` (agent
  scratch, not committed). The pass had **0 console errors and 0 HTTP errors**.
  - `docs/screenshots/chapters/evrae-scene.png` is NEAR `idle` at 1600x900.
  - `evrae-scene-far.jpg` is FAR after the `far` beat.
  - **The order loop with real input:** `evrae-order-near.jpg` shows the real HUD, the widget open
    on Tidus's turn, "Pull back" live and "Close in" reading "Already near". Enter was pressed on
    the keyboard. `evrae-order-sent.jpg` shows the order queued (`airship.order = far`) and the
    ORDER chip on Cid's tile. Cid's turn flew it ("The Fahrenheit pulls back"), and the snapshot
    read range far, Evrae at (6.4, 3.3, -30), scale 0.764. `evrae-order-far.jpg` is the deck
    re-staged to FAR with Rikku's widget reading "Already far". `evrae-far-muted.jpg` is the same
    frame with the HUD hidden (§12.3's bar).
  - `docs/screenshots/chapters/evrae-scene-target-vs-build.jpg` is picked backdrop B beside the
    build (`node tools/end-state-board.mjs --pair`).
  - `docs/screenshots/chapters/evrae-staging-target-vs-build.jpg` is C's NEAR and FAR frames
    beside the build's, composed by hand and labelled NOT picked.
- **Looked at once, side by side:**
  - **Backdrop.** The largest gap. The picked concept render is a bright blue sky with the hull
    diagonal on the right. The installed CANDIDATE production painting is darker, and its hull
    reads as a dark vortex upper left. That is an art gap, not a staging one: the art track's
    `production.md` already says the installed candidate "does not legibly show" the lettering,
    and the chapter's art is CANDIDATE throughout.
  - **Staging against C.** NEAR reads: the head is over the rail and the coils are hidden by the
    deck. The creature is smaller than C's still, which fills the frame; the build keeps the whole
    head left of the HUD rail. FAR reads with the HUD off: a thin streak far out in open sky, more
    deck, a brighter and cooler field. C's FAR is a shrunk copy of the NEAR painting; the build
    uses the real `idle-far` streak. The party in C's frames are foreground silhouettes, and here
    they are the approved paintings at battle scale.

## 6. For the integrator (this track did not edit them)

- `src/scenes/index.ts`: add `'evrae-airship-deck': buildEvraeAirshipDeckScene` to
  `SCENE_FACTORIES`, and a `SCENES` entry (`key: 'evrae-airship-deck'`,
  `slots: EVRAE_AIRSHIP_DECK_SLOTS`, `placeholder: false`, `build: buildDemoScene`), in the pattern
  of the Macalania entry.
- `src/debug/api.ts`: add
  `app.register('scene-evrae-airship-deck', () => new EvraeAirshipSceneScreen())`.
- `src/data/encounters.ts`: the chapter record's `sceneKey: 'evrae-airship-deck'`. The preflight's
  file plan said `fahrenheit.ts`; the brief named `src/scenes/evrae*`, and the key follows the
  installed backdrop's name.
- **The range director in a real battle.** Two short hooks in `BattleScreen.enter`, after
  `await this.stage.stage(...)`:

  ```ts
  const range = airshipRangeDirectorOf(this.scene.scene);
  if (range) { range.bindCamera(this.scene.battleCamera); await range.bindEvrae(this.stage.actor('evrae') ?? null); }
  ```

  Then call `range?.sync(state)` wherever the presenter syncs the HUD (`syncHud` at the end of each
  burst is the exact moment). A per-frame `range?.sync(this.engine?.state())` in `update` also
  works, but it starts the move as the burst begins rather than after "The Fahrenheit pulls back"
  has been read.
- **The widget in a real battle** is the guide track's call site
  (`docs/handoff/chapter-evrae-guide.md` item 5). The harness shows one way: mount it in
  `.ffx-cmd-area` and open it on Tidus's or Rikku's turn with the decision's commands, the range and
  `missilesLeftOf(state)`. Then dock `orderChipHtml` on `.ig-ctb__row[data-actor="cid"]` after each
  CTB render while `airship.order` is set.
- **Unlock.** The chapter stays LOCKED as Coming. Unlocking is the integrator's one-line data change
  in the chapter registration (`LOCKED_CHAPTER_IDS`, as Macalania did), not in these files.

## 7. Found, not mine to fix

Each of these was checked by reading the code, and F-1 by running the engine.

1. **F-1: the stage will draw Cid.** He is `side: 'enemy'`, is not `hidden` and has no art, so
   `PaintedStage.stage` builds him a grey boss silhouette. With two enemies on the field,
   `applyFormation` then re-lays the lane and **sets every enemy's y to 0**, which would stand
   Evrae on the deck. The scene gives Cid Evrae's own slot, so the lane is not widened. The real
   fix belongs to the presenter: do not stage a non-combatant. `ActorRuntime.nonCombatant` is
   engine-internal, so the options are a public flag (a contract change) or a stage rule for
   `untargetable && hideHpBar`. This is the integrator's or the presenter owner's decision.
2. **F-2: the widget re-offers a standing order.** `AirshipOrderWidget.open` takes the range but
   not the pending order. With "Pull back" already queued and the ship still near, the widget
   offers "Pull back" again. The engine accepts it, and last order wins, so it wastes a turn. The
   harness works round this by only opening the widget when no order is standing.
3. **F-3: the widget's layout.** Mounted in `.ffx-cmd-area`, the row label wraps ("PULL / BACK")
   beside its cost line, and the volley pips did not show in the still. That is guide-track CSS.
4. **F-4: a clamp warning.** `PaintedActor` logs a "very different pixel scale" warning each time
   the FAR painting becomes the reference pose (§3). It is harmless, and the director corrects the
   size, but a sidecar `scale` would silence it. That file belongs to the art track, is
   `public/art` and is gitignored.

## 8. Not done

- The one-shot "Pull back, Cid!" shout (C's confirmation). The recommendation uses A's chip.
- Bevelle growing on the horizon (§12.3, "a free, diegetic progress bar"). It is not in the picked
  painting and would need its own art.
- A dedicated missile-volley, Photon Spray or Swooping Scythe VFX, and any audio.
- The breath-charge painting is reachable in the preview (`inhale`), but a real battle only shows
  it if the presenter maps Inhale to it.
- A still of a real registered battle. That comes after the integrator's commit.
- `docs/handoff/NOW.md` is the driver's to update.
