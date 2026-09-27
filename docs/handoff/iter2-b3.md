# iter2-b3: actors, particles, light and Vegnagun parts (iteration 2, batch 3)

Branch `iter2-b3`, lighter worktree `D:/pyrefly-iter2-b3` (sparse: no `docs/screenshots/`),
from main `0bf77169`. Not merged, not deployed. Ports 6120 to 6129.

**Words behind it.** Bailey, 2026-09-26 ~23:25 EDT: "i'll go with all of your recommends. full
speed ahead please. godspeed." (D-232 to D-234), and earlier the same day (15:00): "Focus on
meeting all score thresholds iteratively." The batch is `docs/plans/iteration-2-batches.md` §3 B3,
plus the specials option A (D-233), phase lighting option A (D-224), pyreflies per the sources
(D-225) and the PR-0094/0095 Vegnagun parts on the release-21 colossus staging (D-228).

**Review class.** `node tools/critic-plan.mjs --paths` says **deep** (battle presenter and its
lifecycle): focused before deploy, deep after. Paper preflight: `docs/plans/iter2-b3-review.md`.

## What was built, per item (game case in each row)

| Item | Game | What | Files |
|---|---|---|---|
| D-233 specials, option A | Spiral Cut FFX; Mega Flare FFX-2 | The mock's `B.spiral` and `B.megaflare` ported into the option-B particle language, keyed by ability id **per game** (`spiral-cut` in FFX; `mega-flare` and `x2-bahamut-mega-flare` in FFX-2). FFX's own `mega-flare` (the aeon) and `spathi-mega-flare` keep the bloom: the pick does not carry over to them. Mega Flare is one group copy per action, drawn from the caster (new optional `VfxPort.land` `sourceId`) to the targets' centre; later targets join it. | `spellfx/effects-specials.ts`, `SpellFxSpecials.ts`, `SpellFxTimeline.ts`, `SpellFxLayer.ts`, `SpellFxLookup.ts`, `SpellFxRegistry.ts` |
| The numeral hold (a timing choice) | both | **Chosen:** follow the mock. On the first play in a battle the numeral waits for the landing, 1.43 s (Spiral Cut) and 1.45 s (Mega Flare), with a per-effect cap of 1.5 s; ordinary spells keep 0.9 s. A repeat in the same battle starts the effect 0.35 s in, so it lands about 1.1 s after the blow: at most 1.2 s more than today (the slash's 0.1 s for Spiral Cut; nothing for Mega Flare). | `SpellFxSpecials.ts`, `BattlePresenterSpellFx.ts` |
| Spell-effect minors | both | The effect clock runs at the playback speed's inverse (`SPEED_RATE`: held fast-forward 3.1x, skip runs out), so a Fire column lands with its numeral under R1. A crit (new optional `land` `crit`) widens the drawn effect's figure bloom 1.3x, as the impact bloom did. The Holy numeral pacing lives in Beats' `TIMING.perHit`: **moved to B5** as the plan allows. | `SpellFxLayer.ts`, `FxDrawList.ts` (`bloom()`), `battleSpellFx.ts`, one line in `BattleScreen.ts` |
| A-5 pyrefly dissolve | both; never a person | `PaintedShader` `dissolveSweep`: noise x 0.56 + height x 0.44 (the tile prototype's field), feet first, the prototype's GOLD edge. Only `'dissolve'` departures that are not people (`NEVER_PYREFLIES`: the goons keep the plain dissolve). The eroding band releases motes into one stage-owned `PyreflyEmitter`; they keep rising after `removeCombatant` (so under the results wipe) and go with the stage. Low effects / reduced motion: the erosion, no motes. | `pyreflyCanon.ts`, `PyreflyEmitter.ts`, `PyreflyStage.ts`, `PaintedActor.ts` (`setDissolveStyle`, `dissolveLevel`), `shaders/PaintedShader.ts` |
| A-6 air at three depths | per location | A cited canon row for all 16 scene keys (`PYREFLY_CANON`). Every `attested` scene already draws its own far and mid bands, so the stage adds the tile's seven-mote lens band there and nothing elsewhere. | `pyreflyCanon.ts`, `PyreflyStage.ts` |
| D-225 | Leblanc FFX-2; Macalania FFX; Gagazet FFX | Leblanc: the magenta and cyan glow motes removed, the warm dust kept. Macalania: the Chamber-door field is named `pyreflies:after-seymour-macalania`, hidden, and faded in over 1.5 s at Seymour's KO (read from the engine state: his body stays, so removal is not the trigger). Gagazet: unchanged. | `scenes/leblanc-last-room.ts`, `scenes/macalania-temple.ts` (B2-owned scenes, small edits away from t1-b2b's lines) |
| D-224 phase lighting, option A | per trigger | Canon triggers only (research §9 row 4): FFX Flux's Reflect, the Mortiorchis ladder (transient), Yunalesca's forms 2 and 3, Anima, Cid pulling the ship back (the `airship.range` flag); FFX-2 Bahamut's countdown and Mega Flare (transient), Vegnagun's leg, body and head links (the staged formation). Twelve hand-picked grades (ours; hue and exposure only), tweened 1.5 s: renderer palette, scene fog, a floor glow under the party, the figures' bounce and rim. At most three starts a second; `reduceFlashes()` (default false; B7 wires it) lands it at once; no canon beat, no renderer write; the base palette is restored on dispose. | `phaseCanon.ts`, `PhaseLighting.ts`, `BattlePresenterPhase.ts`, one line in `BattlePresenterEvents.ts`, `BattlePresenterPorts.ts` (`BattleStage.lighting`) |
| PR-0095 remainder | FFX-2 Ch V | The colossus Bulwark rings stay upright but flattened to 0.46 as in the picked frames (the mock's leftover ground squash); Redoubts stay round. | `PartAnchors.ts` (`ring.squash`, `GROUND_RING_SQUASH`), one line in `scenes/farplane-colossus.ts` |
| PR-0094 + the Charge Core slab | FFX-2 Ch V | Each Vegnagun part names its face or weapon in its idle painting's pixels (the boxes the vegnagun-a builder measured); the stage projects them; the FFX-2 intent solver treats them as **hard**, so the slab covers armour before a face or weapon (CHK-008). | `keyFeatures.ts`, `BattlePresenterStage.keyFeatureRects`, `HudPort.ts` (`TargetingPort.keyFeatures`), `ui/ffx2/intentBoard.ts`, `ui/ffx2/FFX2BattleHud.ts` |
| A-8 contact shadows | both | The blob's opacity and colour follow the luma of the scene's own `ground` mesh (0.48 navy on a bright floor, up to 0.78 black on a dark one; a scene with no ground mesh keeps today's blob); a tight foot-occlusion ellipse rides the blob; hovering figures get none. | `ContactShadow.ts`, `BattlePresenterStage.ts` |

## Contract and shared-file notes (for the driver to record at merge)

None of the five contract files changed. Additive optional members on shared ports:
- `BattlePresenterPorts.ts`: `VfxPort.land` opts `sourceId?`, `crit?`; `LightingPort`; `BattleStage.lighting?`.
- `HudPort.ts`: `TargetingPort.keyFeatures?()`.
- `PaintedStageOptions`: `sceneKey?`, `grade?`, `reduceFlashes?`, `spellFx.rate`.
- Files outside B3's list, touched by one or a few lines: `BattleScreen.ts` (rate, sceneKey, grade,
  keyFeatures), `BattlePresenterEvents.ts` (one `cuePhase` line), `battleSpellFx.ts`,
  `farplane-colossus.ts`, `leblanc-last-room.ts`, `macalania-temple.ts`, `ui/ffx2/FFX2BattleHud.ts`,
  `intentBoard.ts`. `t1-b2b` (unmerged) touches `PaintedActor.ts`, `PaintedShader.ts`,
  `BattlePresenterStage.ts` and `leblanc-last-room.ts` on other lines; expect a clean merge, check it.

## Checks

Code: `npx tsc --noEmit` clean; the full suite once (`--testTimeout=60000`, during round 14's
capture): 499 files passed, 4 skipped, 8,620 tests passed; the touched files again after the browser
fixes (12 files, 88 tests); `node tools/orphans.mjs`: 24 orphans, the same list as main (every new
module is reachable).

Browser (after `round14-capture.done` at 03:48; dev server on 6120, headless Playwright,
`PYREFLY_BROWSER=gpu`, stopped by PID). Frames in `docs/screenshots/iter2-b3/` (FORCED in a file name
means the debug API set it up), reports beside them.

| Item | What was run | Result |
|---|---|---|
| D-233 specials | Held frames at 0.5 to 2.3 s (FORCED); a real Spiral Cut twice in Ch I (gauge filled by the debug API) | Helix, gold slash, white burst and ring in FFX; chest core, beam, blast, pink ring and sparkles in FFX-2. Numeral hold measured: **1,430 ms first play, 1,080 ms repeat** (today's slash 100 ms, so the repeat adds 0.98 s). `specials-spiral-cut-and-mega-flare-FORCED-holds-1600.jpg` |
| A-5 dissolve | `dissolveTo` on Seymour Flux and Bahamut (FORCED), frames at 150 ms to 2.4 s | Gold burn from the feet, lights rising and still in the air at 2.4 s, 175+ motes. `pyrefly-dissolve-FORCED-ch1-ch4-1600.jpg` |
| A-6 | First menus of II, V, VII, VI | Lens band on in the Dome and the Farplane, off in Macalania and Leblanc; faint, as the tile asks. Macalania's held field hidden at the first menu. |
| D-224 | `lighting.cue` (FORCED) in II, I, IV; the Vegnagun links by real keys | Tween lands in 1.5 s; the link phases follow the formation (leg, body, head, then base for Shuyin, fixed after this run). The looks are a first pass and read subtle (Yunalesca's third form takes the backdrop from 63/57/90 to 52/53/76 mean RGB). `phase-lighting-FORCED-before-after-1600.jpg` |
| PR-0095 | Ch V, seed 1, links reached by auto at skip speed, then real keys (Enter, ArrowRight to the Left Bulwark / Left Redoubt, Escape) at 1600x900 and 2000x1012 | Both Bulwark rings drawn at 0.46 (flat), both Redoubt rings round; every ring visible; the target plate shows on the aimed part. `vegnagun-links-3-4-real-keys-{1600,2000}.jpg` |
| PR-0094 + Charge Core | Same drive | Intent slab over a key feature: **0 at every link, at both sizes, at the first menu and while aiming** (the vegnagun-a build measured the core rim 0.18 and the horn up to 0.42). |
| A-14 probe | Ch I, Tidus idle against his lunge peak on a real Attack | Painted figures take no fog (`material.fog` false); tint, brightness, desaturate, flash, rim and bounce are identical at idle and at the peak. The only change is the painting: `attack.png` (816x1135) against `idle.png` (730x1132), and the torso's mean saturation is 0.66 against 0.54 **in the PNGs themselves** (+22 %). Cause: the art. Stopped, as the plan says: an art-lane fix, not a shader one. |
| A-8 | Luma just under each party member's feet against the floor either side, HUD off, 15 chapters | **Inconclusive.** The side samples often land on a neighbour's legs (negative drops), and in Ch V the party's shadows show no drop at all (bright floor, colossus staging). No before/after pair on main was taken. Owed: a cleaner measure (a mask of the blob, main against branch). |

## Open (needs a design choice, Bailey's word, or another batch)

1. **Phase lighting looks (D-224):** twelve first-pass grades; the tile's `after.png` must be re-shot
   and the looks tuned with a picture in front of Bailey before the tile is called delivered (plan).
   The real-key captures per canon trigger (Flux's Reflect, the Mortiorchis ladder, Yunalesca's forms,
   Anima, Evrae's range, Bahamut's countdown) were not taken: only forced cues and Vegnagun's links.
2. **The OR-2 camera moment** (a dolly and a hit-freeze on the last hit, named in the plan's D-233 row):
   not built. `BattleMoments.ts` is B2's, and the specials README keeps the camera round separate.
3. **Gagazet (D-225):** the decision says "snow and glitter only", the plan says "unchanged". Built as
   unchanged: its 80 sparse pyreflies stay. If "only" means they go, that is one line in `gagazet.ts`.
4. **PR-0094's acceptance names "the head quad".** The head fills the frame at link 4, so the build reads
   it as the head's face and weapon (CHK-008). The driver should confirm that reading.
5. **A-9 Ginnem's glow:** not built. The plan puts it after PR-0184, PR-0185 and R15-02, which sit on the
   unmerged `t1-b2b`, and its captures are the Ch IX pre and post scenes (B4's `cutsceneFx.ts` side).
6. **A-14:** the saturation jump is in `tidus/attack.png` itself (art lane; an approved-painting question
   for Bailey, no shader change).
7. **A-8:** the measure above is owed; `BackdropPalette.ground` (B2 part 1) is not on main, so the
   stage reads the scene's `ground` mesh, and a scene with none keeps today's blob.
8. **The dissolve's length** is the presenter's 620 ms KO (`TIMING.ko` in Beats, B2/B5); the tile shows
   1.9 s. Lengthening it is a timing choice for the owner of Beats.
9. **Holy's numeral pacing** (spell-fx minor): lives in `TIMING.perHit`, moved to B5 as the plan allows.
10. **The goons** (Dr. Goon, Fem-Goon) keep the plain dissolve with no pyreflies (A-5: people never
    dissolve into pyreflies; D-035 names only the trio as yielding). Whether they should yield instead
    is Bailey's call.
11. **REDUCE FLASHES:** the specials' washes follow the existing flash rules; `reduceFlashes()` for phase
    lighting defaults to off until B7 wires the setting.

## Housekeeping

- Scratch (untracked, agent): `.b3-vite-tmp.config.mjs`, `tools/zz-b3-*.tmp.mjs`; captures and logs in
  `D:/Tools/pyrefly-scratch/iter2-b3/`. The dev server on 6120 was stopped by PID. The two junction
  links (`node_modules`, `public/art`) were removed with `rmdir`; the worktree is kept.
- No deploy, no NOW.md, nothing under `critic/`.

## CHECK (independent, 2026-09-27; did not build it)

Checked `5223a306` in `D:/pyrefly-iter2-b3` after `round14-capture.done`. The branch merges cleanly
onto today's main `1a43fd7b` (`git merge-tree`; main's 22 new commits are FF7 docs and audio). My
production build (`vite build`, served by `vite preview` on 6130, stopped by PID), headless Playwright
with `PYREFLY_BROWSER=gpu`. Evidence and scripts are in `D:/Tools/pyrefly-scratch/iter2-b3-check/`
(not committed). **Verdict: no blocker.** Items 2, 3 and 4 below are open against their acceptance.

**Code.** `npx tsc --noEmit` is clean. The full `vitest run --testTimeout=60000`: 499 files passed and
4 skipped, 8,620 tests passed. `node tools/orphans.mjs`: 24 orphans, the same list as main.

**Engine, not grep (rule 3).** I played the real engines and fed each log to `phaseCue`:
- Ch I (80 seeds): Flux's Reflect, the Mortiorchis ladder and its `total-annihilation` restore.
- Ch II: Yunalesca's forms 2 and 3.
- Ch VII: `anima-macalania`'s `part-restored`.
- Ch VIII: the `airship.range` flag reads far, then near.
- Ch IV (FFX-2): Bahamut's `charge` stages 1 and 2, then `mega-flare`.
- Ch V: the formations read leg, body, head, then base.

Every canon trigger fires, and nothing else does except the case in finding 5. `resolveAbilityFx`
gives these results:

| Ability id | FFX | FFX-2 |
|---|---|---|
| `spiral-cut` | `spiral` | `bloom` |
| `mega-flare` | `bloom` | `megaflare` |
| `x2-bahamut-mega-flare` | (not an FFX id) | `megaflare` |

The game keying holds.

| Item | What I ran on the production build | Result |
|---|---|---|
| D-233 Spiral Cut (FFX) | Ch I, seed 1: Spiral Cut handed in twice by `autoBattle` with the gauge filled (**FORCED setup**; the presenter path is real) | Numeral hold is **1,430 ms first, 1,080 ms repeat**, reproducing the builder's figures. The repeat is +0.98 s over today's 100 ms slash, inside the 1.2 s budget. Frames at 0.9 to 1.8 s show the helix, burst and white ring, as in sheet 2 option A. **Not done by keys:** the OVERDRIVE row never surfaced in the check's attempts, because the gauge was set after the decision was computed. |
| D-233 Mega Flare (FFX-2) | Ch IV, seed 1, intended auto line at normal speed. **No forcing:** Bahamut's own countdown | Hold **1,450 ms** on the first target, then 0 ms on the others (they join the running copy). Frames show the chest core, beam, blast, pink ring and sparkles, matching sheet 3 option A. The numeral follows the blast. |
| Spell-fx minors | Ch I: a Fire played through `land` at normal speed and at `fast` | At `fast` the rate is 3.125, the mark comes at 168 ms, and the presenter's sleep is 160 ms, so the Fire lands with its numeral. The crit bloom is covered by the unit tests. |
| A-5 dissolve | Real KOs by the intended line: Seymour Flux (Ch I, seed 42), Yunalesca (Ch II), Seymour's Anima (Ch VII) | Erosion runs feet first with the bright burn edge. About 240 motes stay in the air after `removeCombatant`. The Flux column reads like `pyrefly-death/after.png`, though less dense. |
| A-6 / D-225 | First menus of II, V, VII and VI; Ch VII to Seymour's KO | The lens band is on in the Dome and the Farplane and off in Macalania and Leblanc. There are no magenta or cyan motes in Leblanc. Macalania's held field is hidden until Seymour's KO, then visible about 12 s after Anima's dissolve. |
| D-224 | Real flows, intended line (no forced cue). Ch I seed 42: Flux's Reflect, charge, imminent. Ch II: forms 2 and 3. Ch VII: Anima. Ch VIII: far, then base. Ch IV: countdown, imminent, base after Mega Flare. Ch V: leg, body, head, base | Every start tweens to 1 within 1.6 s at the table's exposure, with no more than three starts a second. This covers the **real-trigger captures the build owed**. The looks read subtle (open item 1 stands). |
| PR-0095 | Ch V, seed 1, real keys (Enter, ArrowRight to the Left Bulwark or Left Redoubt, Escape) at 1600x900, 2000x1012 and 390x844 | Both Bulwark rings have scale-y 0.46 and both Redoubt rings are round. All rings are visible, the name plate sits on the aimed part as in `05-rings-plates-targeted-1600.jpg` option A, and Escape returns to the top menu. No errors. |
| PR-0094 + Charge Core | Same runs | The intent slab covers **0 %** of every key-feature box at every link, at all three sizes, at the menu and while aiming. |
| A-8 | **New measure:** the same frame with every blob shown and then hidden, HUD off, at each of 15 chapters' first menus. The drop is taken in a band under each baseline | **38 of 43 figures reach 12 %.** Below it: Ch IV Yuna 6.9 %, Ch V Yuna 6.9 %, Ch VII Rikku 10.4 %, Ch II Tidus 11.5 %, Ch V Rikku 11.7 %. Median is about 24 %. |

**Findings** (none blocks; severity in brackets):
1. [major, acceptance] **A-8 is not met at every first menu.** Five figures fall below the 12 % drop,
   listed above; the bright floors (Ch V at 0.52 luma, Ch IV) keep the old 0.48 navy blob. This is not
   a regression: the blob only got stronger.
2. [major, acceptance, open design] **PR-0094's literal "misses the head" is not met at link 4.** The
   intent card lies over the back of the helmet: at 1600 the card is at x 1163 to 1538, y 74 to 230,
   and the head reaches x 1331. It misses the face and the horn. The builder's "face and weapon"
   reading needs the driver's word.
3. [major, open] **D-224 looks are subtle.** Mortiorchis-imminent at t+1.6 s is barely told from base.
   The tile's `after.png` re-shoot and Bailey's eye are still owed, as the build says.
4. [minor, open] **Spiral Cut chosen by real keys is unverified by this check** (see the table).
5. [minor] **`phaseCanon` `PAYLOADS.bahamut` also catches FFX's aeon Bahamut.** Yuna's aeon casts
   `mega-flare` in Ch I and II, and a `restore` fires on its action end. The comment says this changes
   nothing, but if it ever lands inside a Mortiorchis ladder it ends the ladder's look early. It happened
   in 0 of 80 seeds. Fix: key the payload table by game, or arm `restore` only after that charger's
   `charge`.
6. [minor] **A ladder's transient look outlives the battle.** In 16 of 80 Ch I seeds the fight ends
   mid-ladder, and the red rim and floor stay on the party through the victory pose. Anima's look
   likewise stays after Anima's KO. Reset to base on the last enemy's KO, or accept it.
7. [minor] **`pyreflyCanon` says "Isaaru is never a combatant", which is false.** `isaaru` (and `cid`)
   are untargetable enemy-side combatants whose departure defaults to `dissolve`. Their KO is
   unreachable, so nothing shows, but add both to `NEVER_PYREFLIES` and fix the comment.
8. [minor, house style] **`BattlePresenterStage.ts` grew by 97 lines, to 839.** It was already over 400;
   `keyFeatureRects` and `partyFloorCentre` could move to a new module.
9. [note] **Ch II's frame at the form-2 start is fully white.** That is the existing form-change flash;
   the phase tween starts from base, so B3 cannot produce it.

**Open items 3 (Gagazet) and 10 (goons)** stay with the driver or Bailey. The D-225 record reads
"keeps today's snow-and-glitter treatment ... adding no pyreflies", and the scene has 80 motes. The
check's scratch files are `tools/zz-b3check-*` (untracked). The junction links are
removed with `rmdir`; the worktree is kept.
