# iter2-spellfx-b: spell effects, option B (shader particles)

Branch `iter2-spellfx-b`, worktree `D:/pyrefly-iter2-spellfx`. Not merged and not deployed.

**Game case: both, with two skins.** The effect plumbing is shared ("both"). The look splits by
game, following research/ffx-vs-ffx2-presentation.md §9 row 2 ("one motion language, two skins"):
FFX gets a gold cast ring with eight points and round motes, FFX-2 a pink ring and four-point
sparkles. One mechanic splits by game too. Holy is one hit in FFX (ffx-combat-core §2) and
12 x 8 hits in FFX-2 (ffx2-combat-core), so it strikes eight times in FFX-2. The looks themselves
are ours: nothing in research/ describes the retail spell animations.

**Pick:** Bailey, 2026-09-26 ~19:30 EDT: "i'll go with all your recommendations, i love it."
That answered recommendation (1), option B from docs/concepts/spell-fx-2026-09-26/README.md.

## What was built (to the mock)

The mock's Canvas-2D code (`fx-lib.js`, `fx-b.js`) is ported function for function. It draws as
GPU instanced quads instead of canvas calls.

- `src/engine/spellfx/` holds the new code.
  - `SpellFxRegistry.ts` looks up the effect by ability id (the named spells). It falls back in
    this order: a heal draws Cure; a blow (physical damage or a Strength formula) draws the
    slash; then the element; then today's bloom.
  - `SpellFxLookup.ts` reads the data tables and then each engine's own fallback table. That is
    how the FFX-2 `attack` and `bahamut-curse` resolve.
  - `effects-elements.ts` has Fire, Ice, Thunder and Water. `effects-light.ts` has Holy, Cure and
    the hit. `effects-shared.ts` has the cast mark and the slash band.
  - `SpellFxTimeline.ts` holds the marks (when each blow lands inside its effect), the end times
    and the running copy.
  - `FxDrawList.ts` records the frame as data. `FxAtlas.ts` builds the sprites per pixel into one
    512x512 DataTexture. `FxBatch.ts` draws three instanced meshes (normal, additive, normal) in
    CSS pixels straight into clip space.
  - `SpellFxLayer.ts` runs the effects and `stageSpellFx.ts` is the DOM glue.
  - `SpellFxParams.ts` holds the flash rules and the quality tiers.
- `Renderer.addOverlay` draws the effects **after** the post chain. Bloom, tilt-shift and the grade
  do not touch them, which is how the mock drew over the plate.
- `BattlePresenterSpellFx.ts` (presenter, no three and no DOM):
  - It remembers each actor's latest action. FFX-2's ATB overlaps actions, so a blow is matched
    to its striker, not to the action on screen.
  - It calls `VfxPort.land`, cuts to the target, and **holds the numeral until the spell lands**:
    Fire 0.5 s, Thunder 0.42, Water 0.8, FFX Holy 0.85, FFX-2 Holy's first strike 0.55, Cure 0.5,
    a blow 0.1. The hold is capped at 0.9 s, scaled by playback speed, and 0 at `skip`.
  - FFX-2's clock does not pay for it: the Active pump resets after `play`
    (`BattlePresenterActive.ts` property 5).
- `VfxPort.impact` skips today's bloom where a drawn effect already carries the hit. Anything that
  resolves to `bloom` (Flare, Mega Flare, gravity, grenades) keeps today's bloom exactly.
- **Quality:**
  - `low` (the `lowEffects` or `reduceMotion` setting) keeps today's bloom and draws nothing new.
  - `phone` (the viewport's short side under 600 px) draws at 0.6 density.
  - `full` is the mock's density.
  - Peak quads per effect at full are 38 to 334; the budget caps are 600 full and 400 phone.
    A multi-target spell splits its density (`1.7 / n`).
  - The atlas (about 110 ms of pixel work) is built and the shaders compiled at battle load.
    Before that fix, the first spell of a battle hitched by 150 ms.
- **REDUCE FLASHES as parameters** (`FlashParams`). The defaults change nothing. The reduced values
  are the accessibility-review §5.2 proposal: washes capped at 0.35, white turned ivory `#FFF1D6`,
  one wash per action (FFX-2 Holy's eight become one), the actor glow capped at 0.35, and one
  thunder bolt. The setting itself belongs to the accessibility batch; it passes `flash` in
  `battleSpellFx.ts`. D-220 Q7 is still open.

**Not built. These need Bailey's word:**
- Option B's two specials, Spiral Cut and Mega Flare. The approved recommendation named the six
  elements, the heal and the hit, and deferred Overdrives and specials to a later painted pass.
  Spiral Cut resolves to the slash and Mega Flare to today's bloom.
- The mock's 10 px screen shake on a hit. The presenter's own camera shake already plays on every
  hit.

## Target vs build (docs/screenshots/spellfx-b/)

- `target-vs-build-{ffx,ffx2}-{1,2,3}.jpg`:
  - Left is the approved mock still; right is the real engine at the same local time on the same
    target. The right side is **forced through the debug trigger** and labelled so.
  - The set covers all seven effects, plus Thunder and Holy with REDUCE FLASHES on.
  - Result: a match in shape, colour, skin and timing.
  - Two small differences: the ice shards are a little paler at the base, and the ring and decal
    alpha differ slightly.
  - Holy uses t = 0.72 (FFX) and 0.66 (FFX-2), not the 0.52 / 0.72 in the mock's `render.mjs`.
    The approved stills show the FFX pillars already converged and an FFX-2 strike wash; the
    approved clip `clip-ffx-B-light.mp4` reaches that at about 0.72, and a strike lands at 0.66.
    At 0.52 the build matches the clip (pillars still falling apart).
- `real-command-{ffx,ffx2}-{desk,phone}.jpg`:
  - Every element is cast as a **real command through the presenter**, using a scripted
    AutoStrategy on the first party turn of a fresh battle (`forced.mjs`). The HUD is on.
  - All seven drew in both chapters at 1600x900 and 390x844
    (`report-forced-{desk,phone}.json`).
  - FFX-2 Holy drew one effect with eight marks (numeral waits 550, 0, 0, ...).
- `build-phone-{ffx,ffx2}.jpg` shows the forced frames at 390x844.
- `report-flow.json` is the chapters' own 'intended' auto-battle.
  - FFX drew the hit (Lance of Atrophy) and Cure (Phoenix Down).
  - FFX-2's intended plan casts no damage spell. Its blows (Bahamut's Attack, Paine's Magic Break,
    Rikku's Darkness) drew the slash at both sizes. A first run, before the ATB fix below, drew
    nothing.

**Frame time** (`report-perf.json`). Headless GPU at 1600x900, 8 s per tier. A heavy effect was
forced on the boss and a hit or Cure on each party member every 450 ms. `low` is today's bloom path:

| | low (today) | full | phone density |
|---|---|---|---|
| Ch I mean / p95 / max ms | 16.65 / 18.0 / 25.7 | 16.66 / 18.2 / 19.6 | 16.66 / 18.1 / 19.1 |
| Ch IV mean / p95 / max ms | 16.75 / 18.3 / 60.1 | 16.65 / 18.4 / 31.2 | 16.66 / 18.3 / 20.0 |
| effect CPU per frame | 0 | 0.22 to 0.26 ms | 0.18 to 0.21 ms |

The frame rate is vsync-capped, so the means are flat. The CPU line is the honest cost. "Phone"
here is the phone density at a desktop viewport, not a phone device.

## Found, not fixed (outside this batch)

- **Phone, Chapter I:**
  - At 390x844 the impact framing leaves Seymour Flux mostly past the right edge. The spell (and
    today's numerals, "121") land at the edge (`real-command-ffx-phone.jpg`).
  - The cause is the camera rig, not the effects.
  - FFX-2 Chapter IV frames Bahamut fine.

## Merge notes

- `BattlePresenterBeats.ts` (actionStart, actionEnd, damage) and `BattlePresenterEvents.ts`
  (`EventCtx.acting`) each gain a few lines. The boss-poses batch edits `poseForCommand` in the
  same files; the hunks do not overlap.
- `BattlePresenterStage.ts` (734 lines), `BattleScreen.ts` (924) and `BattlePresenterEvents.ts`
  (424) were already over the 400-line cap. They gain 16, 5 and 3 lines of wiring; the logic is
  in the new modules.
- None of the iteration-1 owned files were touched (`src/ui/ffx/**`, `PaintedArt.ts`,
  `src/scenes/**`, `PaintedActor.ts`, `chapter-ffx2-fallen-aeons.ts`).
- `VfxPort.land` is optional. `BattlePresenterPorts.ts` is not in CONTRACTS.md.
- Debug triggers, for captures only:
  - `spellfx:<effect>:<id>[:<t>]` plays an effect, or holds it at local time t.
  - `spellfx:clear` removes every effect.
  - `spellfx:quality:<full|phone|low|auto>` forces a tier.
  - `spellfx:flash:<reduced|default|auto>` forces the flash rules.
  - `snapshotState().screenState.spellFx` reads the running effects, quads and CPU ms.

## Method notes

- The first engine frames were blank: the fragment shader named a parameter `half`, which is
  reserved in GLSL ES. Renamed.
- The first FFX-2 flow drew nothing. The ATB overlap matched blows to the wrong action, and the
  engine-only abilities (`attack`, `bahamut-curse`) were missing from the lookup. Tests were
  written first, then both were fixed.
- `presenter-spellfx.test.ts`'s first five cases were written after the wiring. The registry and
  effects tests, and the ATB case, failed first.
- Before a re-shoot I deleted my own `frames/forced-*.jpg` with a plain file `rm`. It was not
  recursive and did not go through a junction, but the brief says to delete nothing while
  junctions are in the worktree. Flagging it.
- Scratch lives in `.scratch-spellfx/` (untracked, left in place).

## Checks

- `npx tsc --noEmit` is clean.
- Full vitest (`--testTimeout=60000`): 452 files passed, 4 skipped; 8336 tests.
- `node tools/orphans.mjs`: no new orphans (24, all pre-existing).
- Re-run:
  - `PYREFLY_BROWSER=gpu node docs/screenshots/spellfx-b/capture.mjs <dev url> frames|flow|perf`
  - `node docs/screenshots/spellfx-b/forced.mjs desk|phone` (port 6050)
  - `python docs/screenshots/spellfx-b/sheet.py`
