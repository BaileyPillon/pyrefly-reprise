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

## CHECK (independent, 2026-09-26, not the builder)

Checked `74b6ad19` in `D:/pyrefly-iter2-spellfx`. Game case: both (two skins). **Verdict: ready to
merge. No blockers.** The findings below are for the merge note and the next batch.

**Re-run on this branch:**
- `tsc --noEmit` is clean.
- Full vitest (`--testTimeout=60000`): 452 files passed, 4 skipped; 8336 tests passed.
- `tools/orphans.mjs`: 24 orphans, the same list as main. None is in `spellfx/`.
- No boss number moved: the diff against the branch point is empty for `src/data`, `src/battle`
  and `research`.

**Real keys, own production build** (`vite build` into this worktree's `dist/`, preview on 6055,
headless GPU). Spells were chosen through the command menu with Playwright key presses (arrows,
Enter, Escape). That includes Switch to Lulu in Chapter I and Change to Black Mage in Chapter IV.
The stage's own `spellFx` snapshot then showed which effect drew.

| | 1600x900 | 390x844 |
|---|---|---|
| Ch I (FFX) | Fire, Blizzard, Thunder, Water, Cure, Attack drew fire, ice, thunder, water, cure, hit | the same six |
| Ch IV (FFX-2) | White Mage Cure, Attack, then Black Mage Fire, Blizzard, Thunder, Water: all six drew | the same six |

- Holy is in neither chapter's kit. It was **forced through the debug API** (`autoBattle` with the
  ability id), in both games at both sizes. FFX Holy is one mark, and the numeral waits 850 ms.
  FFX-2 Holy is one effect with eight marks; the waits are 550 ms, then 0 for the other seven.
- Peak quads per effect: 38 to 334 on desktop, and 24 to 202 on a phone (the phone tier is picked
  on its own at 390x844).
- No page errors in any run.

**Target vs build.**
- The builder's `target-vs-build-*.jpg` pairs use the approved stills
  (`docs/concepts/spell-fx-2026-09-26/stills/<game>-B-<el>.jpg`), and they match.
- I also paired each approved still with a **real-key** frame. The sheets are
  `.scratch-check/tvb-ffx-realkeys.jpg` and `tvb-ffx2-realkeys.jpg`; they are untracked, and so is
  `phone-sheet.jpg`.
- Shape, colour, motion and skin match the mock:
  - Fire: a column from a scorched mark.
  - Ice: shards from the floor.
  - Thunder: a bolt from the top of the frame.
  - Water: a ring, motes and a sphere.
  - Holy: the pillar (FFX) and eight sparkle strikes (FFX-2).
  - Cure: rising motes.
  - Hit: an arc with sparks.
  - FFX has the gold eight-point ring and round motes; FFX-2 has the pink ring and four-point
    sparkles.
- The real-key frames land on Mortiorchis, the default target, rather than on the mock's Seymour.
  The shapes are the same.

**Frame time** (`.scratch-check/perf.mjs`). Same build and chapter, with effects forced every
450 ms for 8 s, twice per tier. `low` is today's bloom path through `vfx.impact`.
- The mean is 16.67 ms and p95 is 16.7 to 16.8 ms in every tier, in Chapters I and IV, desktop and
  phone. The frame rate is vsync-capped.
- The effects cost 0.1 to 0.3 ms of CPU per frame (median).
- Under this stress loop the peak hit the caps exactly: 600 quads full, 400 phone. The budget holds.

**No regression in the other chapters** (both games). Every chapter ran its `intended` auto-battle
at `fast` speed on this build and on a build of the branch point `a253cae9` (worktree
`D:/pyrefly-iter2-spellfx-base`, preview on 6056). That is 15 chapters: seymour-flux, yunalesca,
braskas-final-aeon, ffx2-bahamut, ffx2-vegnagun-shuyin, ffx2-leblanc, evrae-airship,
isaaru-via-purifico, seymour-anima-macalania, seymour-natus, seymour-omnis, yojimbo-cavern,
ffx2-den-of-woe, ffx2-fallen-aeons and ffx2-trema.
- Outcome and turn count are identical in all 15.
- FFX: ticks and event counts are identical too.
- FFX-2: ticks are equal or within a few hundred of 775k (Trema). Event counts vary from run to
  run on **both** builds (Bahamut base 2077, 2077, 2012; branch 2003, 2042, 2018). That is the ATB
  pump, not this change.
- No page errors.
- The effects drew in every chapter. Bloom stayed only on non-elemental magic, gravity and the
  like.

**Findings (none blocks; none is a regression against live):**
1. **Major, not introduced: phone framing.** At 390x844 the impact cut leaves the target at or past
   the right edge in **both** chapters, so the effects land half off-screen:
   - Seymour Flux in Chapter I, which the builder found.
   - Bahamut in Chapter IV too, contrary to the note above. See `rk-ffx2-bahamut-phone-*.jpg` and
     `forced-holy-ffx2-phone.jpg` in `.scratch-check/out/`.
   - Mortiorchis frames fine.
   - The cause is the camera rig, not this change; disclose it and carry it to the camera or phone
     batch.
2. **Minor: fast-forward (held R1, `SPEED_SCALE.fast` 0.32).**
   - The numeral hold goes through `ctx.sleep`, which scales with the speed. The effect clock
     (`RunningFx.advance`, real `dt`) does not.
   - Under fast-forward a Fire numeral shows at about 0.16 s, but the column lands at 0.5 s.
     Effects up to 2.8 s long run on over later actions.
   - Found by reading the code, not measured. The fix would scale the layer's `dt` by the playback
     speed.
3. **Minor: FFX-2 Holy numerals trail the strikes.**
   - Strikes land 110 ms apart; numerals come at least 190 ms apart (`TIMING.perHit`).
   - By the eighth hit the numeral is about 0.6 s behind its strike. It is never ahead.
4. **Minor: heals now cut the camera.**
   - `awaitSpellLanding` calls `moments.impact` for negative-damage heals, which had no cut before.
   - It is usually the same party rig the caster's action already uses, and the mock does not show
     it either way.
5. **Minor: Full-Life on a zombie.**
   - In Chapter I (the "cure-zombie-before-full-life" beat), Seymour Flux's Full-Life draws the
     Cure motes on the party member it kills: the ability has the `heals` flag.
   - This is defensible, since it is a life spell, but it reads as a heal while the numeral kills.
     Leave it unless Bailey says otherwise.
6. **Minor: crits lose the bigger bloom.** Where the drawn effect covers a hit, `vfx.impact` skips
   `impactAt` entirely, so a critical hit loses the 1.3x crit bloom. The white actor flash, punch
   and hit-stop remain, and the mock has no crit variant.
7. **Trivial:**
   - `SpellFxLayer.ts` has an orphaned doc comment ("Build the frame and draw it...") above
     `prepare()`.
   - The first registry test ("resolves to a known effect") cannot fail, because the resolver
     always returns an id. The second test (a drawn effect for every elemental, heal and physical
     ability) is the real guard.

**Housekeeping.**
- Servers 6055 and 6056 were stopped by PID.
- Only the junction links were removed, with `rmdir` and no `/s`, in both worktrees. Both
  worktrees are kept.
- The branch `iter2-spellfx-check-base` (at `a253cae9`) exists only for the base build.
- Scratch is in `.scratch-check/`, untracked. Nothing was deleted.
