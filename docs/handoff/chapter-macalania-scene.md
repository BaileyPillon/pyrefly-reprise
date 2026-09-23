# Chapter: Seymour and Anima, Macalania Temple: the scene

**Game case: FFX only** [AGENTS.md rule 14]. It is an FFX encounter with an FFX party, and none of it
applies to an FFX-2 chapter. The absence check is the last `describe` in
`tests/unit/chapters/macalania-scene.test.ts`: the four scene files import nothing from `battle/ffx2`
or `data/ffx2`.

Built the way the Leblanc scene was built (`68b8b6b`, `docs/handoff/chapter-leblanc-scene.md`): a
`SceneFactory` that owns no actors, a staged preview, a throwaway debug screen, pure-export tests,
and one browser pass. It differs in one way. **This track edited no shared registry.** The brief
said to leave the integrator a one-line TODO, so `src/scenes/index.ts` and `src/debug/api.ts` are
untouched (see §6).

## 1. Files

| File | Lines | What |
|---|---|---|
| `src/scenes/macalania-temple.ts` | 352 | `buildMacalaniaTempleScene` (the `SceneFactory`: backdrop, lights, ice glitter, pyreflies, light pools, rigs), `MACALANIA_TEMPLE_SLOTS`, `MACALANIA_TEMPLE_ACTOR_HEIGHTS`, `MACALANIA_ENEMY_SLOT`, `SEYMOUR_STEP_BACK`, `ANIMA_HOVER`, `MACALANIA_TEMPLE_RIGS`, `MACALANIA_TEMPLE_BACKDROP`, `MACALANIA_TEMPLE_PALETTE` (the scene's own grade, kept in the scene file so `ScenePalettes.ts` stays untouched) |
| `src/scenes/macalania-temple-arrival.ts` | 232 | Anima's arrival: a **pure** timeline (`ANIMA_ARRIVAL_MS`, `ANIMA_ARRIVAL_CAMERA`, `animaArrivalAt(ms)`, `animaRiseY`), the depth-only floor occluder that hides whatever is still under the ice, and the chains |
| `src/scenes/macalania-temple-painted.ts` | 360 | Preview only: Tidus, Yuna and Rikku, Guardian A, Seymour, Guardian B and Anima on their slots. Beats: `arrival`/`summon`, `arrival-at:<ms>`, `reset`, `attack`, `cast`, `hurt`, `rig:<name>` |
| `src/scenes/macalania-temple-debug.ts` | 163 | `MacalaniaTempleSceneScreen` (`scene-macalania-temple`), plus concept B's tags as DOM over the canvas |
| `tests/unit/chapters/macalania-scene.test.ts` | 172 | 10 cases (§5) |

## 2. The picks this scene reads

- **Backdrop A**, warm brazier gold (`docs/target/targets.json` chapter tile, D-019). The installed
  file is `public/art/backdrops/macalania-temple.png`, a CANDIDATE img2img of A at 2688x1536.
- **Seymour B** (`characters/seymour-macalania/`), **Guado Guardian A** (`characters/guado-guardian/`)
  and **Anima**, which reuses the approved aeon painting plus CANDIDATE `hurt`/`ko`
  (`characters/anima/`). All are loaded by folder and state name through `PaintedActor.fromSubject`.
- **The layout** is read from the sources, not guessed. `options.json` (cast canon notes) says "Two
  identical retainers flank Seymour", and research §9.3 says "one per side". So slot 0, Guardian A,
  stands in front of him on the party side; slot 1, Seymour, stands centre; slot 2, Guardian B,
  stands behind him on the far side. Anima is slot 3 and rises behind them, right of centre, where
  arrival frame B puts her. The slot indices match `seymour-anima-macalania.ts`, and a test pins
  this.
- **Sizes.** Seymour is 1.87, which is sourced (research §9.2, "187 cm"). The other sizes are
  presentation estimates, labelled in the code. The Guardians are 1.85: "tall and narrow" but
  "subordinate in silhouette". Anima is 3.6 plus a 0.3 hover: "towering", and the smaller of the two
  models (§9.4 note 1). The party heights are Chapter 1's.

## 3. Framing: a knowing crop

The painting is a **low, level** view, and its ice floor is only the bottom 11 % of the frame (the
seam sits at 0.89 of the height). A battle camera looks down, so the painted floor can never be the
floor the fighters stand on. The painting therefore stands close, as the room's back wall
(`z -20`, 40 wide), with its seam at world `y 0.25`. The 3D ice runs up to it and fades out before
it, so the painted mirror floor shows at the back. The camera is FFX framing (fov 32) but nearly
level, which was Dream's End's choice for the same reason.

The cost: at `idle` the painting shows from about 0.37 down (the door arches, both braziers and the
seam). **The dome is off the top of the frame.** You can see this in
`docs/screenshots/chapters/macalania-scene-target-vs-build.jpg`. To get the dome back would take a
backdrop painted from a higher viewpoint, which is art work and not staging.

## 4. Anima's arrival (INFERRED, not approved)

Bailey has **not** picked from the arrival options round (`docs/concepts/chapters/macalania/arrival/`).
This track built the driver's recommendation, **A's staging with B's name tag**. It is recorded as its
own tile in `docs/target/targets.json` (group `chapters`, state `gap`, delivery `implemented`), and
its `reaction.inferred` reads exactly "built to the driver's recommendation A + B's tag, awaiting
Bailey".

The beats (`ANIMA_ARRIVAL_MS`, 6.3 s, one continuous move with no snap):

1. 0 to 0.95 s: the camera drops to floor height (`anima-low`).
2. 0.25 to 1.3 s: violet light comes up under her slot.
3. From 0.45 s: both Guardians die together (a violet dissolve over 1.4 s). §5.2 says the summon
   kills them.
4. 0.7 to 1.6 s: the chains come up out of the ice and go taut.
5. 1.3 to 4.3 s: she rises through the floor. A depth-only occluder hides the part of her still
   under the ice. The camera rises with her (`anima`) over the same 3 s.
6. 2.3 to 3.6 s: Seymour steps back out of the light to `SEYMOUR_STEP_BACK` and dims. This is B's
   beat.
7. From 4.3 s: B's tag. Grey reticle corners and "Cannot be targeted" appear on Seymour (decision
   C-2), and "Anima" lights gold on her.
8. 4.7 to 6.3 s: the camera settles to `idle`. Control returns at 5.1 s, while it is still moving.

The cue is the story script's `mac-anima-summon` mid-battle script. The rise is meant to start after
Yuna's line ("An aeon. He is summoning an aeon."), because she names the aeon before the player sees
it.

**Knowing departure (recorded on the tile):** she is the approved aeon painting at 3.6 units. No
source gives the Macalania model's size.

## 5. How it was verified

- `npx tsc --noEmit`: clean.
- `npx vitest run tests/unit/chapters/macalania-scene.test.ts`: **10 passed**.
  - The slots match the data file's `slot` fields.
  - Seymour is flanked in depth.
  - **The HUD rail is measured, not eyeballed.** The slots are pushed through a real three.js
    camera on the `idle` rig at 16:9, and every enemy, including Anima risen and Seymour stepped
    back, lies left of the FFX rail at 0.79. That closes the gap the Leblanc scene left open in its
    §3.
  - The painting's seam sits just above the floor.
  - The arrival's camera moves are ordered, timed and end on `idle`.
  - The chains appear before her, and the Guardians are gone before she clears the ice.
  - The rise is monotonic, from wholly under the ice to her own baseline.
  - The tag appears only after the rise and the step back, and control returns before the camera
    settles.
  - FFX-only absence.
- `npx vitest run` on `critic-policy-adoptions` and `pause-remake` (the two suites that read
  `targets.json`) with the new tile: green.
- **One browser pass.** This track's own vite dev server ran on :5432 (a random free port in
  5400-5990) with `PYREFLY_BROWSER=gpu`, and was stopped by its PID. The screen was registered at
  runtime through `window.__pyrefly.app.register` after a Vite `import()` of the debug module, so
  no shared registry was edited. The scratch harness is `tools/zz-macalania-scene.tmp.mjs` (agent
  scratch, not committed). The pass had 0 console errors and 0 HTTP errors.
  - `docs/screenshots/chapters/macalania-scene.png` is `idle` at 1600x900.
  - `docs/screenshots/chapters/macalania-scene-target-vs-build.jpg` is picked backdrop A beside the
    build (`node tools/end-state-board.mjs --pair`).
  - `docs/screenshots/chapters/macalania-arrival.png` shows the drop at 1.5 s, the rise at 3.0 s,
    and the landing with the tags.
  - `docs/screenshots/chapters/macalania-arrival-target-vs-build.jpg` is arrival frame A beside the
    rise and the landing. It was composed by hand so that the target is labelled NOT picked;
    `--pair` stamps "approved".
  - Two bugs were found in the pass and fixed. First, an opaque occluder ate the ground at the low
    rig and left a black band; three draws opaque before transparent whatever the renderOrder, so
    the occluder is now `transparent`. Second, the `anima-low` rig swung past the painting's right
    edge; the rigs now look along the axis.
- Looked at once, side by side:
  - **Backdrop.** The build matches A's doors, braziers, gold banding and mirror floor. The dome is
    cropped (§3).
  - **Arrival.** Frame A is a close-up with her filling the frame. The build's rise shows her
    mid-frame at battle scale, cut cleanly at the floor, with chains taut and Seymour stepping
    aside. The low camera and the no-cut move read. The build is smaller and less dramatic than
    A's still.

## 6. For the integrator (one line each; this track did not edit them)

- `src/scenes/index.ts`: add `'macalania-temple': buildMacalaniaTempleScene` to `SCENE_FACTORIES`,
  plus a `SCENES` entry (`key: 'macalania-temple'`, `slots: MACALANIA_TEMPLE_SLOTS`,
  `placeholder: false`, `build: buildDemoScene`), in the pattern of the Leblanc entry.
- `src/debug/api.ts`: add
  `app.register('scene-macalania-temple', () => new MacalaniaTempleSceneScreen())`.
- `src/data/encounters.ts`: the chapter record's `sceneKey: 'macalania-temple'`. That name is the
  preflight's (§6.2 names `src/scenes/macalania-temple.ts`), and the story script already plays
  `scene-macalania-temple`.
- **Unlock.** The chapter stays LOCKED as Coming. Unlocking is the integrator's one-line data
  change in the chapter registration, not in these files.

## 7. Found, not mine to fix

These belong to the presenter and data owners, and each was checked by reading the code.

1. **Seymour's art id is a wasted probe.** `seymour-anima-macalania.ts` gives him
   `spriteKey: 'seymour'`, and `public/art/characters/seymour/` does not exist; the art is at
   `seymour-macalania/`. `BattlePresenterStage.add` resolves `[artIdFor(c), c.spriteKey, c.id]` in
   order, so he still finds his paintings through his raw id. The failed first probe costs one
   request and may count as a 404 against plan A-10's "0 404s". The one-line fix is
   `spriteKey: 'seymour-macalania'`.
2. **Real-battle sizes ignore the scene's heights.** `fromSceneBuild` in `src/scenes/index.ts`
   hard-codes `partyHeight: 1.82, enemyHeight: 4.1`, and `worldHeightFor` scales them:
   - Seymour (a boss) would be 4.1.
   - The Guardians (non-boss) would be 2.87.
   - Anima (`isPart`) would be 2.26, which makes her the smallest enemy on the field.

   The staged sizes above are what this scene publishes; the presenter should read them.
3. **The arrival still needs its presenter hook.** `docs/handoff/chapter-macalania-engine.md` §3 is
   still owed: `part-restored` does nothing for an enemy that was never staged. This track's
   timeline is pure and ready for that handler to drive: `animaArrivalAt`, `ANIMA_ARRIVAL_CAMERA`,
   `makeFloorOccluder`, `makeArrivalChains`, `SEYMOUR_STEP_BACK`. B's tag in a real battle belongs
   to the targeting HUD (the `untargetable` flag), and the debug screen shows what it should look
   like.

## 8. Not done

- The dome crop (§3). This is an art question.
- The seal mark (plan §6.1). It is not part of A + B.
- Pyreflies when the Guardians die. The dissolve is violet; no pyrefly burst was added.
- Any audio.
- A screenshot with the live HUD on. The debug screen has no HUD.
