# FF7 Guard Scorpion: the hidden experiment, integrated and turned on (FF7 only)

## Phase 3: the high-fidelity fight (branch `ff7-phase3`), 2026-09-27

Branch `ff7-phase3` (worktree `D:/pyrefly-ff7-p3`, from `main` 47ab4ae8), pushed; not merged into
`main`, not deployed. **Game case: FF7 only** (AGENTS.md rule 14); the shared files touched are
shared plumbing (both + FF7), each change optional or keyed to FF7's own ids and switches
(`docs/CONTRACT-CHANGES.md`, 2026-09-27 "FF7 phase 3").

On whose word: Bailey, 2026-09-27 ~13:00 EDT, verbatim: "I'll go with all of your recommendations"
(D-259 art direction 3 "Film" with the back-edge rim fixed first; D-260 effects "Spectacle" built on
"A3 plus"; D-261 the punchier menu look on the D-237 layout; D-262 "cant you just have the characters
and enemy switch sides? not mirrored just literally switch sides"; and the accepted options round
D-244: B1, C1 + G1, D1, E1, F1). Still in force: "i need tons of eye candy it needs to be higher
fidelity than the original in this regard". Music stays `null` until Bailey hears the sketch.

### Release prep: merged with main, the see-through boss, Barret's aim (2026-09-28)

Game case: **FF7 only**; the shared hooks are optional and unset for FFX and FFX-2 (`docs/CONTRACT-CHANGES.md`,
2026-09-28 "FF7 release prep"). No line was added to `PaintedActor.ts`, `BattlePresenterStage.ts` or
`BattlePresenterPorts.ts` (P3C-3).

- **P3C-1, merged.** `origin/main` d89541b6 (Ixion as Chapter XVI, advisor v3, the combat switches) merged into the
  branch. The two conflicts were both-sides additions: `approved-hashes.json` keeps the `bailey:2026-09-27-ff7-film`
  and `bailey:2026-09-27-ixion` sets; `CONTRACT-CHANGES.md` keeps both sides' entries (FF7's first). Main's FFX and
  FFX-2 behaviour is untouched; the FF7 e2e now expects main's 16 tiles.
- **Item 2, the see-through boss: fixed.** Cause, found by measuring, not by the suspects in the brief: the planes
  were opaque at every pixel through every hit (rendered against white and against black, and against a flat green
  in place of the painting: no background inside the silhouette), the pose change was already a hard cut, and depth
  and post were ruled out one by one. The culprit was the **cast light**: 150 ms after B1's white pop the target took
  the effect's colour at 0.75 for 680 ms, and the shader's flash floor (0.34, meant to make a black-armoured fiend
  react) lifted every dark texel by about 0.22. Through the reactor's grade (gamma 2.0) the shaded belly and legs went
  a flat pale that matched the dark grating behind them, so the lower body read as see-through for about half a
  second. With the flash switched off the look vanished; with it on, it was there with the FX layer, bloom and
  tilt-shift all off. Fix: the cast now carries no floor (light on what the painting shows: lit plates still catch
  it, the darks stay dark), and B1's white pop keeps half the floor (`FF7_HIT_FLOOR_CUT` 0.5, our estimate). Measured
  on the production build (the 20th-percentile luminance of the boss's red pixels in the leg band, 1600x900): idle
  44 to 47; before the fix (the same seed on the dev build) 53 to 63 for about 250 ms after each hit; after it 38 to 49, with one 53 to 57 frame at
  the white pop. Frames: `docs/screenshots/ff7-phase3/release-prep/dense-three-hits-1600x900.jpg` (three hits,
  Barret's shot, Cloud's slash, the shot again, every other frame at about 50 ms), `before-after-boss-lower-body.jpg`,
  `hit1-frame-1600x900.jpg`; the 180 raw frames are in `D:/Tools/pyrefly-scratch/ff7-p3-prep/dense-3hits/`. The
  tail swap (`opaqueForms`, no fade) and the recoil painting (alpha 98 % solid, holes as in the idle) were checked
  and needed nothing.
- **P3C-2, Barret's aim 90 px off his stance: fixed.** Cause: the aim painting is 1302x1130, just over the house's
  1.15 prone aspect, so the actor took it for a KO body: it was **rolled 0.30 rad** onto its underside (the gun
  tilted up, which is most of the "aims over the boss's head" of repair item 13) and ProneLay slid it along the floor
  (-1.057 world units instead of -0.450, and not the same each time). Cloud's strike (1230x947) was rolled 0.09 rad,
  and the boss's idle (-0.06) and recoil (+0.15, undoing part of its painted 12-degree tilt) too. FF7's staging now
  sets `restPoses: false`: no Film key is laid to rest by its aspect (FF7's KO is the motion port's `lieDown`,
  unchanged). Measured live: the aim plane at -0.450 every frame, the aim, fire and idle stances within a few px
  (`release-prep/before-after-barret-aim-stance.jpg`). Side effect, toward the target: the boss now stands level as
  painted (it was tipped 3.5 degrees), registered on its rear foot as the installer meant, and its recoil shows the
  full painted tilt.
- P3C-4: the "Checks" of the first phase-3 pass name `verify-approved.mjs`, which does not exist in any tree; the
  hash check here is the checker's scratch script (`tools/zz-p3prep-approved.tmp.mjs`, not committed), on the
  worktree and the built `dist`.

Checks (release prep): `tsc` (app and e2e) clean; full `vitest run` 610 files pass, 5 skipped, 1 fails: the known `strategy-ffx2-bahamut` "heal-only route" timeout under full load (alone: 19/19); `ffx2-atb-golden` and
`ff7-golden` 9/9 unchanged (no engine change); `orphans.mjs` 24, the same list; approved art 242 + 48 judge-locked
= 290 ok, 0 mismatched, 0 missing, in `public/art` and in the built `dist`; the FF7 e2e **5 of 5** on a production
build (preview on 7801, PYREFLY_BROWSER=gpu, one browser); new `tests/unit/ff7-release-prep.test.ts` (6: every cast
without the floor and the white pop at half, the shader's uniform, the dark-texel lift, the scene switch on desk and
phone, FFX and FFX-2 without it, no Film pose prone with it and Barret's aim prone without it). Servers on 7800 and
7801 were stopped by PID. The e2e re-shot `docs/screenshots/ff7-phase3/game-*.jpg`.

Still open from this pass: the target-vs-build sheets 1 to 11 were not re-shot (the boss stands 3.5 degrees more
level and the aim is upright); the FFX and FFX-2 real-key comparison against main (the checker's (d)) was not re-run
here: the shared edits are optional hooks nobody else sets, and the suite passes, but the focused review should run it
on the merged candidate.

### Repair pass (the judge's list: fidelity 7.6, eye candy 6.9), 2026-09-27

Game case: **FF7 only**; the shared files gain only optional hooks nobody else sets (`docs/CONTRACT-CHANGES.md`,
"FF7 phase 3 repair pass"). Every item below is fixed on the branch; frames and before/after sheets are
`docs/screenshots/ff7-phase3/sheet-12-repair-motion.jpg` and `sheet-13-repair-look.jpg` (the judge's frames in
`repair/before-*`), and every target-vs-build sheet 1 to 11 was re-shot on the repaired production build.

| # | What the judge saw | What changed |
|---|---|---|
| 1 major | A see-through idle Barret left behind; aim/fire 120 px right, over Cloud; sparks at the ghost's gun | The installer centred the idle on its stance but the aim and fire on the rear foot. The stage now shifts each Film party pose so its stance (the two boots' sole centres) lands on the idle's: `src/data/ff7/filmPoseAnchors.ts`, measured by `film-set/scripts/anchors.py` (the fire registers on the aim by leg overlap); the locked PNGs are untouched. FF7 pose changes are hard cuts (`poseCut`). The muzzle is the measured barrel tip of the active pose's box. Test: each pose's stance within 6 px of the idle's, read from the PNGs (`ff7-judge-repair.test.ts`) |
| 2 major | Boss semi-transparent around recoil and its own attacks | Same hard cut for the boss; the raised tail's form change swaps under the flash with no fade (`opaqueForms`) |
| 3 major | Scorpion Tail fired while Ice played; both numbers together | FF7's `submit` waits for the burst already playing (the ATB pump's boss turn) before its own (research/ff7-battle-core.md §2.6). The gauges keep their rules. Pinned through the real engine and presenter: the boss's `action-end` precedes the player's `action-start` (the test fails with the line removed) |
| 4 major | A KO'd Barret stood upright; G1 bodies were flat smears | A KO lays the fighter down at once (`ActionMotionPort.ko`), the hurt painting rolled and tipped back 0.55 rad, not flat (our estimate); a Phoenix Down stands him up. **The two KO paintings G1 asked for are not painted**: an art request for Bailey (open) |
| 5 major | Effects weaker than the Spectacle frames | Tail Laser: beam 42 px core with a 96 and a 190 px glow and a white centre, a white impact wash, a darker stage, bigger impact glows. Bolt and Braver: whole-body glow, heavier bright floor rings, stronger washes and dim. The cast light on the fighters is stronger (peak 0.9) and the target takes the effect's colour after the white hit flash |
| 6 minor | Numbers before the blow | The FF7 HUD holds each numeral (and the HP rows) from the event until the presenter's numeral beat, which now waits for the effect's own frame clock to reach the mark (`pendingLand`); the director's hit flash fires on the drawn strike too |
| 7 minor | D1 kept the wide camera | The camera eases to `ff7-victory` (desk: a 20-degree lens from 12 units, framed on the party; phone: moved in); our estimate |
| 8 minor | A 0.3 s white pop for the boss | `sendOff`: a white flash and a shake, eight explosions with debris walking the machine (`effects-ff7-down.ts`, with the cast light), then a one-second burn-away; our estimate |
| 9 minor | Pale grey-blue halo; not graded into the core | The house rim (pale blue from the upper left) is replaced for FF7 by a green rim from screen-right, a light green bounce, and a 2.5-texel silhouette erosion (the matte fringe); mako motes drift from the core (two particle fields, none on Low) |
| 10 minor | Bolt over the message window | FF7's effects draw under a scissor that ends at the message window's bottom while it is up |
| 11 minor | The boss's aim box ran to x 493 of 390; the HUD slid | Aim boxes are clamped to the frame; the FF7 HUD layers are `overflow: clip`; the e2e checks both |
| 12 minor | Full EXP to a KO'd member; an AP line FF7 lacks | 0 EXP (and an empty gauge) to a member KO'd at the end (core §11, `ff7Standing.ts`); the AP line is gone. The gauge still shows the award counting in (disclosed estimate) |
| 13 minor | No visible Braver leap; Barret aims over the boss | The leap is higher (1.6), carries on toward the boss, and the blow lands on the way down (the live frame shows him airborne). Barret's aim angle is an art limit: noted for the next art round; the locked paintings are not replaced without Bailey |

Checks (repair pass): `tsc` (app and e2e) clean; full `vitest run` 599 files pass, 5 skipped, the known
`strategy-ffx2-bahamut` heal-only timeout under load (alone: 19/19); `ffx2-atb-golden` and the FF7 golden pass
**unchanged (no re-pin: the engine did not change)**; `orphans.mjs` 24, the same list; approved-hash check 286 ok,
0 mismatched, 0 missing (no art file touched); the FF7 e2e **5 of 5** on a production build (preview on 7204),
now also asserting D1's closer framing, no AP line, and the aim boxes inside the frame with the HUD unscrolled.
New `tests/unit/ff7-judge-repair.test.ts` (11). Servers started on 7201 to 7204 were stopped by PID.

### What is built

| Item | What | Files |
|---|---|---|
| Sides (D-262) | The party stands on the LEFT facing screen-right, Guard Scorpion on the RIGHT facing screen-left, towering. Barret stands upstage-left of Cloud; on Change the back row steps further LEFT. Nothing is mirrored (every Film sidecar `mirrored: false`; the stage turns the bodies with `sideFacing { party: 1, enemy: -1 }`). The camera (y 2.6, z 11, pitched 8 degrees) and the formation are solved to the approved Film frame (`hifi/scripts/compose.py`'s desk layout: Cloud 300 px with his feet near 615 at 1600x900) | `src/scenes/sector1-reactor-staging.ts`, `sector1-reactor.ts`, `src/app/screens/BattleScreenFf7Stage.ts` |
| Art (D-259) | The Film repair round's recommended file per pose (`docs/concepts/ff7-art-2026-09-27/film-set/README.md`), installed add-only under new keys: `ff7-film-cloud` (idle, windup, attack = strike, follow, victory = fist pump, spin, back, hurt), `ff7-film-barret` (idle, aim, attack = fire, victory = squat, punch, hurt), `ff7-film-guard-scorpion` (idle tail down, hurt = the recoil), `ff7-film-guard-scorpion-tail-up` (idle raised, hurt = the recoil), `backdrops/ff7-film-reactor`. The installer (`film-set/scripts/install.py`) turns the last mint on Cloud's BACK edge to ink (2 to 112 px per pose; the repair round had already inked the rest), resizes (party x0.5, the boss x0.75, premultiplied) and pads each plane to register on the feet (the boss on its rear foot, so idle, raised and both recoils need no shift). Manifest regenerated (only additions); backups in `D:/Tools/pyrefly-art-backup/approved/2026-09-27-ff7-film/`; locked as set `bailey:2026-09-27-ff7-film` in `docs/target/approved-hashes.json`. The round-2 `ff7-*` files stay installed and unused | `src/data/ff7/builds/sector1-reactor.ts`, `src/data/ff7/enemies/guard-scorpion.ts` |
| Effects (D-260) | Eleven FF7 effects on the house spell-FX particle system (`FxDrawList`, `FxBatch`, its density tiers and phone cap): Bolt, Ice, Cure, Cloud's slash, Barret's shot (the muzzle flash drawn by code), Braver, Big Shot, Search Scope's lock-on, Rifle, Scorpion Tail, and Tail Laser as one beam swept up off the floor across both members, key frame on the nearer, with the scorch. A3 plus underneath (tapered beams, jagged bolts, faceted bursts, glow, floor light pools, a stage dim), Spectacle on top (sparks, embers, motes along beams, anamorphic streaks, heat haze, charge rings, washes). The director (`battleFf7Fx.ts`) adds B1's white hit flash, a knock-back on the boss, the effect's colour cast on every fighter by distance, and on Tail Laser and Braver a short camera shake and one flash frame (once per action). **Calm version** under reduced motion: particles at 40 %, no haze, streaks, washes, shake or flash frame. Low effects keeps the plain bloom | `src/engine/spellfx/ff7/*`, `src/app/screens/battleFf7Fx.ts`, `battleSpellFx.ts` (shared plumbing) |
| B1 | Cloud runs in with the wind-up painting, strikes (the house lunge stays out: `ownsWindUp`), holds the follow-through, runs back in idle; Braver leaps and strikes on the way down; Barret aims, then fires from his spot (Big Shot charges longer); a caster raises Cloud's sword or Barret's free hand. The boss's hit shows its recoil painting (its `hurt`) | `BattleScreenFf7Motion.ts`; `BattlePresenterMotion.ts`, `BattlePresenterBeats.ts` (shared plumbing) |
| D1 | Cloud pumps his fist twice, spins, puts the sword on his back; Barret squats, stands and punches the air, looping; a 2.5 s hold in silence; a KO'd member stays down | `BattleScreenFf7Motion.ts` (`victory`) |
| C1 + G1 | FF7's own results: step 1 EXP and AP windows and a window per member (a crop of their Film idle as the portrait, LV, the award counting in, "10 AP · Lightning, Ice"), step 2 Gil and Items ("Assault Gun 1 (Barret: Att 17, Long Range)", "Received 100 gil and the Assault Gun."); a wipe-out pans the camera up with the band sunk away, then black, GAME OVER, RETRY / CHAPTER SELECT. Numbers from the engine (100 EXP, 10 AP, 100 gil, the Assault Gun). Named `'results'` like the house panel | `src/app/screens/Ff7ResultsScreen.ts`, `src/ui/ff7/ff7ResultsHtml.ts`, `ff7-results.css`; one line in `BattleScreenFlow.ts` (shared plumbing) |
| E1 | An upright phone gets its own layout: the formation drawn in, the camera moved in (fov 60), the painting covering the frame (zoom 1.3). Cloud about 140 px at 390x844 (the letterbox drew him about 50); the lowered tail may trail off the right edge | `sector1-reactor-staging.ts` (`SECTOR1_PHONE`) |
| F1 | FF7's swirl of the frozen board: an SVG vortex displacement plus a CSS turn and zoom on `#app` for 1 s, lightening, a cut to black, the battle swapped in under it, a fade up; then the opening camera from close on the boss to the fixed view in 2 s, the band rising after. Confirm (Enter, Space, Z, a tap) cuts to the fixed view; reduced motion cuts both | `src/ui/ff7/ff7Swirl.ts`, `BattleScreenFf7Opening.ts`; `BattleScreenExperiment.ts`; one line each in `BattleScreen.ts`, `BattleScreenAirship.ts` (shared plumbing) |
| HUD look (D-261) | Heavier letters (a stroke in the glyph's colour under the fill), a glass sheen and a soft blue outer glow on every window, the lit active row, a glowing finger and ready marker, a blazing full Limit gauge, glowing digits. A look change: no box moved; all vector, sharp at DPR 1, 1.5 and 2 (`hud-crop-dpr*.png`) | `src/ui/ff7/ff7-hud-look.css`, `ff7MenuHtml.ts` |

The shared-plumbing additions, all optional: `ActionMotionPort.ownsWindUp / victory / defeat`,
`FixedCamera.unheld()`, `SceneStaging.figureExtent` (the long machine's paintings run 2.7x its
height; the actor's `maxExtent`), the spell-FX `'ff7'` game with `onLand` and `FxTarget.members`,
`AirshipBattleHook.opening`, and FF7-only extra key poses in `resolvePoseMap` (`ff7-` art ids only).

### Checks

- `npx tsc --noEmit` and `npx tsc --noEmit -p tsconfig.e2e.json` clean.
- Full `vitest run`: 598 files pass, 5 skipped, 1 fails: the known `strategy-ffx2-bahamut` "heal-only
  route" timeout under full load; alone it passes 19/19. `ffx2-atb-golden` 6/6. New:
  `tests/unit/ff7-fx.test.ts` (20: every FF7 effect inside the peak budget at full and phone quality,
  the calm version thinner with no wash, the lookup by FF7 id, FFX and FFX-2 never drawing an FF7
  effect, Tail Laser as one copy over both, the director's hit flash, knock-back, shake and one flash
  frame) and `tests/unit/ff7-phase3.test.ts` (13: C1 from the engine's real result, G1's choices by
  keys and taps, B1's keys, D1 with a KO'd member staying down, G1's pan on the free camera, F1's
  skip and reduced-motion cut, the instant swirl, the lit row, FF7's own-poses-only pose map).
  Updated for the switch: `ff7-stage`, `ff7-repair`, `ff7-class-a` (the boss towers: raised height at
  least 1.4x Cloud's, length at least 2.2x on a desk, everything above the band and under the message
  window, at 1600x900 and 390x844), `ff7-integration`, `ff7-guard-scorpion-ai` (the form's art key),
  `spellfx-effects` (sweeps the non-FF7 ids only).
- **FF7 golden re-pinned for a staging reason only** (the art keys `ff7-*` became `ff7-film-*`):
  replacing `ff7-film-` with `ff7-` in every seed's log reproduces all 40 old hashes; outcomes,
  turns, ticks and event counts are unchanged.
- `node tools/orphans.mjs`: 24, the same list (no FF7 module).
- `verify-approved.mjs` (ROOT = the worktree): 286 ok, 0 mismatched, 0 missing (238 approved, of
  them the 19 new Film files, + 48 judge-locked).
- E2E on a production build (`vite build` to a scratch outDir, `vite preview`, headless GPU
  Chromium, one browser): **5 of 5 pass** (`tests/e2e/ff7-guard-scorpion.spec.ts`): 1600x900 keys
  (the door, the swirl, the opening, every window inside the frame, a win with effect frames for
  Bolt, Search Scope, the shot, Rifle, Scorpion Tail, the slash and Tail Laser, Braver by the Limit,
  D1, both results windows, the board and save unchanged); 390x844 taps (E1: Cloud at least 110 px,
  the same win, the results by taps); 1600x900 keys loss (G1's pan, GAME OVER, RETRY at seed + 1000,
  a second loss, CHAPTER SELECT, the store at 2 attempts); the pad door; phone A.
- First load (the branch build, gzip -9): 879,897 B (JS 832,009 + CSS 47,888).
- Every server this run started (ports 7200 to 7205) was stopped by its PID.

### Frames and sheets

`docs/screenshots/ff7-phase3/`: `game-<size>-<moment>.jpg` from the e2e on the production build
(door, swirl, opening-close, opening-settled, first-turn, turn, magic, target, the effect frames
`fx-ff7-*`, melee-strike, hint-2, hint-3, defend, limit-full, limit-window, win-poses, win-spin,
win-hold, results-1, results-2, gameover-pan, gameover, gameover-chapter-select, retry, pad-open),
the held effect frames `held-1600x900-{full,calm}-*.jpg`, the other aspects
(`game-1024x768-first-turn`, `game-2000x1012-first-turn`), the DPR crops `hud-crop-dpr{1.5,2}.png`,
and the target-vs-build sheets (`python tools/ff7-phase3-sheets.py`): `sheet-1-film-art-and-sides`,
`sheet-2-hud-look`, `sheet-3-fx-tail-laser`, `sheet-4-fx-bolt-braver-scope`,
`sheet-5-fx-more-and-calm`, `sheet-6-attack-b1`, `sheet-7-victory-d1`, `sheet-8-results-c1`,
`sheet-9-gameover-g1`, `sheet-10-way-in-f1`, `sheet-11-phone-e1`.

### Estimates that show (say "our estimate" to Bailey)

Every number in the staging (camera, pitch, fov, spots, heights, the phone layout, the strike gap),
every timing (the run, the holds, the victory sequence and its 2.5 s hold, the pan, the swirl, the
opening), the look of every effect (no source describes FF7's), the cast-light falloff, the shake
and the flash frame, the anchor points on the paintings (measured), the results window arrangement,
the portrait crops, the Game Over fade. The results' EXP gauge shows the award counting in, not the
progress to the next level (the EXP table is not in research/, so levels gained are not computed);
every member row prints the full EXP (the result does not say who stood at the end). That Scorpion
Tail is a shot from the tail's lens is our reading of its Shoot element.

### Open

1. Bailey's review of the build against the sheets (rule 9: the targets are approved; the build is
   an agent's reading of them). The judge's earlier faults on the first Film picks were repaired
   before this install (the film-set README); the repaired set was not re-judged by an independent
   judge in this run.
2. Known art limits carried from the film-set README: the spin pose's head about 8 % small, the
   wind-up forearm shadow a little red, Barret's aim at chest height, small cheek scars on squat,
   punch and hurt.
3. No KO paintings: a KO'd member lies down at once in the hurt painting, rolled and tipped back part
   way (repair item 4); G1's target asked for two KO poses to paint, which needs Bailey's look first.
8. Repair-pass leftovers: Barret's aim and fire point the gun up over the boss's head (art; the next art
   round, shown to Bailey before any locked painting is replaced). Every new number in the repair (the
   pose shifts are measured; the KO tilt, the death's timing and look, the victory rig, the rim, bounce,
   erosion and motes, the beam widths and washes) is our estimate.
4. Music stays silent (D-245's sketch awaits Bailey's ear); no retail fanfare, reel or "Continue?".
5. Resizing a window mid-fight keeps the layout it was built with (desk or phone).
6. Merge into `main`, the focused review and the release are the driver's.
7. Scratch: two broken junctions from this run's first `mklink` (a bad target) sit at
   `D:/pyrefly-ff7-p3/zz-broken-junction-{nm,art}.tmp` (they point at `D:\D:\...`, nothing). Remove
   them with `cmd /c rmdir` before any `git worktree remove`, as for the live junctions.


## Before phase 3: integration, repair and class-A (branch `ff7-integration`)

Branch `ff7-integration` (worktree `D:/pyrefly-ff7-int`), 2026-09-27: `origin/ff7-engine` merged
into `ff7-plumbing` (the HUD), then `origin/main` (already contained). Not merged into `main`, not
deployed. **Game case: FF7 only** (AGENTS.md rule 14). Shared files touched are labelled
"shared plumbing (both + FF7)" below; each answers `'ff7'` on its own line and leaves the FFX and
FFX-2 paths as they were.

On whose word: Bailey, 2026-09-27, verbatim: "ff7 screen layout ill go with a but it needs to be
EVEN more faithful than a but remember it is specific to the ff7 encounters not ffx or ffx-2 ..."
(D-237), "also the secret door to guard scorpion i really like your ideas there i will go with it"
(D-238), "full speed ahead please. godspeed. ill go with all your recommendations." (D-240, with the
driver's recommendations: M PLUS Rounded 1c body face; stretch on 16:9; Cloud's hint verbatim with
"it's"; the phone layout by the real-input check; music silent; no door sign).

## How to open it

On chapter select:

- **Keyboard:** type `L I M I T` (letters at most about 2 s apart).
- **Phone or mouse:** tap the small "Chapter select" label at the top **seven times** within about 4 s.
- **Gamepad:** `L1 R1 L1 R1 Select` (on a keyboard `F R F R M`).

The fight opens with the chapters' own transition (the battle swirl) and no other sign. No card,
no count, no ribbon: the board still has 15 tiles (14 playable, one COMING) and reads "0 OF 14
BEATEN" on a fresh save, exactly as `main` does. Victory shows the results panel and
returns to the board with the cursor where it was. Defeat shows the defeat panel: **RETRY** goes
straight back in with a new seed (`seed + 1000`), **CHAPTER SELECT** returns. The pause's QUIT and
RESTART work as in the chapters. Nothing writes `pyrefly-reprise:save:v1`; attempts, clears, best
time and play time go to `pyrefly-reprise:experiments:v1`.

Controls in the fight (FF7's): arrows move, Enter / Space / Z confirm, Esc / X / Backspace back,
**left on the command window = Change, right = Defend** (manual p. 18), H = SELECT (help). Taps: a
row chooses; a figure aims, a second tap confirms; an unmarked strip beside the command window's
left / right edge moves the finger to Change / Defend, a second tap chooses it.

## What is built

| Area | What | Files |
|---|---|---|
| Switch | `FF7_EXPERIMENT_READY = true` | `src/app/experiments/ff7Flag.ts` |
| Flow | The loop: swirl in, fight, results or defeat panel, RETRY reseeds, CHAPTER SELECT returns; nothing touches the save | `src/app/screens/BattleScreenExperiment.ts`, one call in `BattleScreenFlow.ts` (shared plumbing) |
| HUD on the engine | Command window from the engine's rows: Attack or Limit, Magic (the engine's category `'magic'`, MP costs, targeting), the blank Summon slot, Item with the engine bag's counts; Change and Defend off the window's edges | `src/ui/ff7/ff7MenuModel.ts`, `ff7MenuHtml.ts`, `Ff7CommandMenu.ts`; `createHud('ff7', field, engine)` in `BattleScreenWiring.ts` |
| Messages | Ability names up top (not Attack; not Raise Tail / Drop Tail, whose script name is blank "<>", gs §5.2), "Locked On Target", the three hint lines verbatim with the game's "it's", each opening with a quote mark and no speaker name (spec §3.3) | `src/ui/ff7/Ff7BattleHud.ts` |
| Gauges | Limit (`limit-gauge` events, 0 to 255, blink when full) and TIME (the engine's `gaugeSnapshot` through `sync` / `syncGauges`), damage / heal / "Miss" numerals, KO through `syncVitals`, the Barrier boxes empty (unsourced fills) | already in the HUD; now fed by the real engine |
| Clock | The presenter brackets every played burst with `engine.setAnimating(true/false)` (only engines that have it: FF7); the HUD reports `'top'` / `'deep'` so Wait and Recommended hold as core §2.5 says; FF7's default mode is **Recommended** | `src/engine/BattlePresenterAnimating.ts` (new, shared plumbing, inert without `setAnimating`), one line in `BattleScreen.ts` |
| Tail | The raised tail's painting swap and shift (the stage hook from `ff7-engine`) | unchanged |
| Screen | FF7 gets no Ink & Gold battle-start card and no Ink & Gold moments (name slab, letterbox) (spec §7 #15, §8); spell effects draw nothing until their options round (the stage's plain impact still lands) | `BattleScreen.ts`, `battleSpellFx.ts` (shared plumbing) |
| Results | The house results panel with recording off: EXP to each member, AP "PER MATERIA", gil, the Assault Gun; FF7 rows (`LV n · 10 AP to k MATERIA`); the clear time from FF7's own clock | `src/ui/ff7/ff7ResultRows.ts`; `resultsMath.ts`, `ResultsScreen.ts` (shared plumbing) |
| Audit sites | `abilityFactsFor('ff7')` has no rows (no FFX-2 facts), the pause's IN THIS FIGHT column is empty for FF7 | `battleAbilityFacts.ts`, `pause/meters.ts` (shared plumbing) |
| Phone | Two adaptations of the A+ target; **B is the default** (see below); `?ff7phone=a` shows A | `src/ui/ff7/ff7Geometry.ts`, `Ff7PartyRows.ts` |

Settled by Bailey's picks: body face **M PLUS Rounded 1c** (OFL, `public/fonts/ff7/`), the band
**stretches** on 16:9 (no pillarbox), the hint **verbatim**, **music silent** (`null` cues), **no
door sign**.

### Phone layout: B (real-input check, 390x844, taps)

Both were played by taps in the same fight (`sheet-phone-a-vs-b.jpg`). **B reads better**: each
status row carries its name ("Cloud 176/ 316 37"), so a row reads across as FF7's own rows do; in
A the names sit in their own window at other heights than the HP rows, so on a turn nothing on
the HP line says whose it is. B's smaller band also leaves the fighters' feet clear of the command
window. A's larger type (cap 16 px against B's 13) is its one advantage; B's type still reads at
arm's length in the frames.

## Checks

- `npx tsc --noEmit` clean; `npx tsc --noEmit -p tsconfig.e2e.json` clean.
- FF7 unit suites (22 files) pass, including the new `tests/unit/ff7-integration.test.ts` (12:
  the command window from the real engine, Change / Defend by keys and taps and the engine taking
  them, item counts from the bag, quoted dialogue and nameless tail moves, the animation bracket
  and Recommended's hold, an engine without `setAnimating` left untouched, the flow's results
  panel, RETRY with `seed + 1000`, CHAPTER SELECT, `skipResults`).
- Repair pass: the FF7 unit suites (22 files, 343 tests) and `enemy-action-pose` pass, including the new
  `tests/unit/ff7-repair.test.ts` (15: every fighter's feet above the band and heads under the
  message window through a real three.js camera, the diagonal, the painting's bottom at 72 %, no
  turn rings for FF7 and a gold one for FFX, the melee run and the run back, Barret firing in
  place, Braver running, the boss's stand-ins, no motion port for FFX / FFX-2, the presenter's
  order (motion before the wind-up, the run back before idle), the warnings as one block and the
  bracket holding on them, the held Limit gauge, the numeral clamp, Change / Defend over whole
  fields, phone B's names once).
- Full `npm test` (repair pass): 513 files pass, 4 skipped, 1 fails: `strategy-ffx2-bahamut`
  "heal-only route" times out (21 s against 15 s) under the full load, the known timeout also on
  `main`; alone it passes 19/19. `ffx2-atb-golden` passes (6/6); `critic-policy-adoptions` 12/12.
- `node tools/orphans.mjs`: 24, the same list as before (no FF7 module orphaned).
- Every touched shared file stayed under 400 lines or did not grow (`BattleScreen.ts` 931,
  `BattleScreenFlow.ts` 510, `ResultsScreen.ts` 391, `BattlePresenterStage.ts` 746,
  `BattlePresenterPorts.ts` 413, one shorter).

### Real input (`tests/e2e/ff7-guard-scorpion.spec.ts`, one headless GPU Chromium)

1. 1600x900, keys: L I M I T, the fight, Bolt while the tail is down, Defend while it is up, one
   deliberate hit into the raised tail (the Tail Laser frame), Limits when full; victory; results;
   Enter; the board: same snapshot (15 tiles, order, cursor, beaten of total), same words, the main
   save key byte-identical, the experiments store shows the clear.
2. 390x844, touch: seven taps on the label; the same play by taps (Defend by the edge strip);
   victory; the board as it was.
3. 1600x900, keys: attacking every turn into the raised tail loses; the defeat panel; RETRY is a
   new fight at `seed + 1000`; lose again; CHAPTER SELECT; the board as it was; the store shows
   2 attempts, 0 clears.
4. 1600x900, pad: L1 R1 L1 R1 Select on a stand-in pad (`navigator.getGamepads`) opens the fight.
5. 390x844: phone A by taps, for the layout comparison.

Repair pass: runs 1 and 2 also assert that the three warnings are one block (the top window's
line after "Attack while it's tail's up!" is "It's gonna counterattack with its laser.") and run 1
that Cloud reached the strike point (`game-*-melee-strike.jpg`).

Every run asserts no uncaught page error. Frames: `docs/screenshots/ff7/game-<size>-<moment>.jpg`
(door, opening, turn, magic, target, hint-2, hint-3, melee-strike, tail-laser, defend, limit-full,
limit-window, victory, defeat, retry, pad-open), `phoneA-390x844-*.jpg`. Sheets: `sheet-game-1600-a.jpg`, `sheet-game-1600-b.jpg`,
`sheet-game-390.jpg`, `sheet-phone-a-vs-b.jpg`, `sheet-game-vs-composite.jpg`
(`python tools/ff7-game-sheets.py`).

### Bundle (vite build to a scratch outDir, no public dir, gzip -9)

| | First load (entry JS + CSS), gzip | raw |
|---|---|---|
| `origin/main` 1a43fd7b (no FF7 code) | 811,018 B | 3,172,580 B |
| `ff7-integration` (integration) | 837,625 B | 3,251,622 B |
| `ff7-integration` after the repair pass | 839,075 B | 3,255,629 B |
| Difference against main | **+28.1 kB** (the repair adds 1.5 kB) | +83 kB |

Under the 60 kB line, so the FF7 engine, HUD and stage stay static imports (engine check C4
closed by measurement). The M PLUS woff2 is not in the first load: the browser fetches it only
when the FF7 HUD draws text.

## Repair pass: the FF7 purist review (scored 6.8), 2026-09-27

Every major fixed except the two that need Bailey's options round (5 and 7), where the stand-in the
review asked for is built; the minors fixed except 9 and 15 (options) and 17 (kept, flagged).
Game case: **FF7 only**; the four shared files touched are shared plumbing (both + FF7), inert for
FFX and FFX-2 (each takes its FF7 path from a scene switch, a deps field or the game id).

| # | Item | What changed | Files |
|---|---|---|---|
| 1 | Camera: the band hid every fighter below the knees | The fixed camera is raised (y 3.1, z 13.8) and pitched down 8.47 degrees; the painting is turned square to that view and lifted so its floor ends at 72 % of the frame, its crown cropped. At 1600x900 Cloud's feet are at about 66 %, Barret's 59 %, the boss's 62 %: every fighter whole above the band (71 %). Our estimate, solved against the A+ target's raised look. | `src/scenes/sector1-reactor-staging.ts`, `sector1-reactor.ts` |
| 2 | Numerals on the band | Follows from 1; also the numeral anchor is clamped 1.5 numeral heights above the band (and a phone's command window). | `src/ui/ff7/ff7Marks.ts` |
| 3 | Formation: Barret in front of Cloud | Both front row at the same x (4.1), side by side in depth (Cloud z 0.9 downstage, Barret z -1.9 upstage), so from the raised camera they read as a diagonal (Barret's feet about 70 px higher, 90 px nearer the middle). The back row still steps right. | `sector1-reactor-staging.ts` |
| 4 | Melee Attack had no run-up | New presenter port `actionMotion` (optional deps field, called by the beats at action-start and action-end). FF7's: a member whose weapon is not Long Range (Cloud) runs to a strike point in front of the target for a physical action (Attack, Braver), the house wind-up strikes there, the numeral lands, and he runs back. Barret (Gatling Gun, Long Range) fires from his spot. Timings ours. | `src/engine/BattlePresenterMotion.ts` (new), `BattlePresenterBeats.ts`, `BattlePresenterPorts.ts` (one field, file shorter than before); `src/app/screens/BattleScreenFf7Motion.ts`, `BattleScreenGameDeps.ts` (new); `BattleScreen.ts` (same line count) |
| 5 | Enemy abilities have no animation | Stand-ins until the options round: Rifle kicks the body back (-0.35), Scorpion Tail lunges forward (1.1), Tail Laser braces back (-0.5), on top of the house counter lunge. **The effects options round is still owed** (see Open). | `BattleScreenFf7Motion.ts` |
| 6 | Hint lines split by other actions | The three warnings are one block: the HUD's top window never cuts or splits dialogue (an action name waits after its last line), and the animation bracket holds the burst that said dialogue, still animating, until every line has shown (`dialogueShown`). The e2e asserts line 3 follows line 2 with nothing between, at both sizes. | `src/ui/ff7/Ff7HelpLine.ts`, `Ff7BattleHud.ts`, `src/engine/BattlePresenterAnimating.ts`, one argument in `BattleScreen.ts` |
| 7 | House results and defeat | FF7's results rows drop the "x2 PARTY" tag, the clear-time chip (it reads "RESULTS" alone) and NEW BEST. Victory poses (original art) and an FF7 results screen in the blue window material are **the options round still owed**. | `ResultsScreen.ts`, `ui/common/resultsPage.ts`, `resultsPhone.ts` (shared plumbing; FFX and FFX-2 always have a clock, their output is unchanged) |
| 8 | Ground rings on the phone | Scene switch `turnRings: false` (FF7's staging only): no turn ring under any figure; the triangle is the only marker. | `src/scenes/types.ts`, `BattlePresenterStage.ts` (same line count), staging |
| 9 | Phone framing | Not changed (options; see Open). The raised camera made the phone's figures smaller (the whole 16:9 field is shown in the upright letterbox). | |
| 10 | PAUSE chip | For FF7 the chip is an unmarked corner tap zone (opacity 0): nothing drawn on desktop or phone, Esc / Start still pause, a click or tap on the corner still does. | `BattleScreen.ts` (class on the same line), `src/ui/ff7/ff7-screen.css` (new) |
| 11 | Right window spacing | On a desktop every status column sits at its own u as a fraction of the width (spec §5.2): HP 720, max ends 1020, MP 1035-1180, LIMIT 1195-1375, TIME 1385-1565, gauges 180 x 36 px. | `src/ui/ff7/ff7Geometry.ts` |
| 12 | Defend / Change cut words | On a desktop Change reaches to the names window's left edge (the whole name), Defend to the end of the HP field; on a phone the label keeps a pad inside the frame. | `src/ui/ff7/ff7MenuHtml.ts` |
| 13 | Limit gauge before the blow | During a burst the band keeps each gauge where the last full sync left it until that member's own `limit-gauge` event, which the engine emits right after the damage (the engine's state is already the burst's end). | `Ff7BattleHud.ts` |
| 14 | Command window position | FF7's measured box 72-131 u: 360-655 px at 1600, text at 390; the Magic grid's columns at 78 / 130 / 174 u. | `ff7Geometry.ts` |
| 15 | Door and opening | No change (Bailey's picks); noted as approved departures on D-238 and D-240 in `docs/target/decisions.json`, with the FF7 swirl and camera intro as the options to offer. | |
| 16 | Phone B names twice | Phone B's names window keeps only its BARRIER column; each name shows once, at the left of its status row. | `src/ui/ff7/Ff7PartyRows.ts` |
| 17 | SELECT help echoes the name | Kept; flagged as our estimate in the spec's in-game-check list (§9 #4). | `docs/plans/ff7-hud-faithful-a-spec.md` |

Sheets: `sheet-repair-1600.jpg` (before vs after: framing, the Tail Laser numerals, the results
rows), `sheet-repair-moments.jpg` (the warnings' lines 2 then 3; Cloud at the strike point; Defend
over the whole HP field), `sheet-repair-390.jpg` (the phone before vs after), plus the re-shot
`sheet-game-*.jpg`. New frames: `game-1600x900-{hint-2,hint-3,melee-strike,defend}.jpg` and the
same at 390x844.

## Update and class-A fixes, 2026-09-27 (after release 22)

**Game case: FF7 only**, with shared plumbing (both + FF7) for the merge, `battleSpellFx.ts`,
`ResultsScreen.ts`, `PyreflyStage.ts` / `pyreflyCanon.ts` and the contract files; each answers
`'ff7'` on its own branch and FFX and FFX-2 behave exactly as on `main`.

| Item | What changed | Files |
|---|---|---|
| Merge | `origin/main` at `a44297ca` (iter2-b1, b3, b4, the FFX-2 engine and resolver split) merged `--no-ff`. Conflicts: `battleSpellFx.ts` (main's signature with the playback-speed `rate`, widened to `GameId`; `'ff7'` still returns `{}`), `BattleScreen.ts` (main's stage options: speed getter, `sceneKey`, `grade`), `CONTRACT-CHANGES.md` (both sides, newest first). Main's new `story-fielded-speakers.test.ts` skips FF7 chapters (a type narrowing; FF7 has no mid-battle lines) | merge commit |
| Pyreflies | Main's A-5 / A-6 would have given the beaten Guard Scorpion the FFX pyrefly dissolve (every enemy defaults to `'dissolve'`). The canon table gets an FF7 row, `sector1-reactor`: absent (pyreflies are Spira's, `research/ffx-vs-ffx2-presentation.md` §3.1; derived), and `PyreflyStage` adds neither the band nor the dissolve for it. The boss keeps the house plain dissolve it had before | `src/engine/pyreflyCanon.ts`, `PyreflyStage.ts` |
| Boss scale (review major) | `SECTOR1_HEIGHTS['guard-scorpion']` 2.16 to **3.3** (the painting's full height). World: 1.89x Cloud, 1.63x Barret. On screen at 1600x900: 387 px against Cloud's 221 and Barret's 213 (**1.75x / 1.82x**; before 251 px, 1.13x); feet at 560 (band 639), idle top 173, raised tail top 134 (message window ends at 121), tail tip 106 px inside the left edge. At 390x844 the same ratios, top 345, left edge 26 px in. The tail-up sidecar's relative scale (748/681) and its shift (scales with the height) are unchanged. The melee strike point is 1.22 x the target's height (was 1.4), so Cloud still stops about 1.1 in front of the bigger painting (x 0.93). Presentation, our estimate | `src/scenes/sector1-reactor-staging.ts`, `src/app/screens/BattleScreenFf7Motion.ts` |
| C-2 | The defeat panel reads `pyrefly-reprise:experiments:v1` for an experimental chapter (attempts, best), read-only; the chapters still read the save | `src/app/screens/ResultsScreen.ts` (391 lines) |
| C-3 | `types.ts` back to **2,667 lines, the same as `main`**: `EnemyDef.ff7` by module augmentation from `types-ff7.ts`, the `'limit-gauge'` fields as `Ff7LimitGaugeFields` there, the rest folded onto existing lines. CONTRACT-CHANGES entry | `src/battle/common/types.ts`, `types-ff7.ts` |
| C-4 | The board wording above: 15 tiles, "0 OF 14 BEATEN" | this note |

New tests: `tests/unit/ff7-class-a.test.ts` (7: the scale at both sizes through a real three.js
camera, the strike gap, C-2 with the store and an empty store, C-3, the FF7 pyrefly row);
`ff7-stage` reads the height from the staging; the e2e's strike-point check is `x < 1.6` (was 0.6).

Checks on the merged tree: `tsc` app and e2e clean; full `vitest run` 533 files pass, 5 skipped,
1 fails: the known `strategy-ffx2-bahamut` "heal-only route" timeout under full load (17 s), 19/19
alone; `ffx2-atb-golden` 6/6; the FFX / FFX-2 engine and CTB suites (`ffx-ctb*`, `ffx-engine*`,
`ffx-round04-engine`, `ffx2-engine*`, `engine/`) 25 files, 316 pass, 5 skipped (the bench);
`orphans.mjs` 24, the same list; `verify-approved.mjs` 267 ok, 0 mismatched, 0 missing (219
approved + 48 judge-locked). E2E on a production build (`vite preview`, port 6601, headless GPU
Chromium): **5 of 5 pass** (the first run failed only the old strike-point threshold). Frames:
`docs/screenshots/ff7/game-{1600x900,390x844}-{opening,hint-3,tail-laser}.jpg` (the opening, the
tail raised with the third warning, Tail Laser), with the rest of the set re-shot.

Still owed: the upright phone framing (item 9) makes the bigger boss about 94 px tall on a phone;
the options round is unchanged. Main's A-8 contact shadows now draw under the FF7 figures too (the
house shadow restyled, as for every scene).

## Estimates that show (say "our estimate" to Bailey)

Everything in `docs/handoff/ff7-hud.md` and `ff7-engine.md` still stands. New here: the look of the
Change / Defend label beside the edge (FF7 draws the finger there; the small window is ours) and the
touch strips; the item name without the engine's "xN" with the count in its own column; results:
every member's row prints the full EXP (FF7 gives a member KO'd at the end 0; the result does not
say who stood), levels gained are not computed. From the repair pass: the raised camera's height,
pitch and the painting's lift; the party's depth spread; the melee run's strike point (1.22 x the
target's height in front of it), its timings (460 ms there, 400 ms back) and which actions run; the
boss's stand-in lunges; the numeral clamp.

## Open

1. **Options owed to Bailey (rule 9), cheapest first:**
   - **FF7 action effects** (review item 5): the Tail Laser beam from the raised tail across both
     members, the Scorpion Tail strike, the Search Scope lock-on; then Bolt / Ice / Cure and the two
     Limits. Today: the stand-in lunges and the house impact flash.
   - **FF7 results screen** (item 7): blue four-corner windows, the EXP and AP rows, the Gil and
     Items window, and victory poses (a new "win" painting per fighter); Game Over for a wipe.
   - **Upright phone framing** (item 9): (a) a taller crop with the camera moved in on the fight so
     the fighters fill the width, (b) the top message window moved down onto the scene, (c) keep
     the letterbox. Since the raised camera, the phone shows the whole field small (Cloud about
     50 px tall) with dark bands above and below.
   - **Opening** (item 15): an FF7-style battle swirl for the FF7 fight only, and a short camera
     intro; today the chapters' own transition, by Bailey's pick.
2. **Target vs build**: windows, band, command window, finger, Magic grid with the MP window, the
   Limit colours and the Limit window match A+; the field is now framed like the target (raised,
   everyone whole above the band). Differences to judge: the real paintings instead of the
   target's placeholders; no laser beam or spell effects (item 1 above).
3. **Pause** is the house Ink & Gold screen with FF7 rows; an FF7 pause would be a new screen
   (options first).
4. **Active mode's running gauges during animations**: the engine and the bracket support it, but no
   presenter ticks the clock during playback and no FF7 Config row can choose Active; Recommended
   is the only reachable mode.
5. Music stays `null` until an original FF7 cue exists and Bailey hears it (approved departure).
6. `critic/policy.json` has no `ff7` game or `ff7-engine` system row yet (driver to-do from the
   architecture plan §2.4); `decisions.json` allows `game: 'ff7'` (D-237, D-238, D-240).
7. The deep review for a new engine is owed after the deploy (architecture plan §2.4).

## Run it

In the worktree: `npx vite --port 6400 --base /pyrefly-reprise/`, open
`http://127.0.0.1:6400/pyrefly-reprise/`, go to chapter select, type LIMIT. The e2e:
`PREVIEW_PORT=6400 PYREFLY_BROWSER=gpu npx playwright test tests/e2e/ff7-guard-scorpion.spec.ts`
(reuses the running server). Stop the server by its port when done.

## CHECK: independent release-readiness check of 54916f56, 2026-09-27

An independent checker who built none of this checked the branch. **Verdict: no blocker.** One major:
the branch is now behind `main`, so these results hold only against the merge base. Five minors.
Game case: FF7 only. The FFX and FFX-2 results below are the proof that neither game changed.

**Method.** The checker made two production builds of their own with the art, both served by `vite
preview` on ports 6420 (branch) and 6421 (`main` at the merge base `1a43fd7b`, from `git archive`).
Everything ran in headless Chromium with `PYREFLY_BROWSER=gpu`, one browser at a time. Scratch
scripts: `tools/zz-ffcheck-*.tmp.mjs` (not committed). Frames: `D:/Tools/pyrefly-scratch/ff7-check/`.
Both servers were stopped by their PIDs.

| Check | Result |
|---|---|
| tsc (app, e2e) | Both clean |
| Full `vitest run` | 513 files pass, 4 skipped, 1 fails: the known `strategy-ffx2-bahamut` timeout under full load (18 s). It passes 19/19 alone. `ffx2-atb-golden` 6/6, `critic-policy-adoptions` 12/12 |
| `orphans.mjs` | 24, none of them FF7 |
| Approved art | Every hash in `approved-hashes.json` (219) and `judge-locked-hashes.json` (48) matches, in `public/art` and in the built `dist`: 0 mismatched, 0 missing |
| (a) Board unchanged | At 1600x900, 1024x768 and 390x844 the board's snapshot and words match `main`'s build exactly: 15 tiles, the same order, "0 OF 14 BEATEN" with one COMING. No FF7 text in the DOM. Pixel diff against `main`: 0 px at 1600 and 390; 97 px at 1024, a thumbnail fading in, the same layout |
| (a) Door stays shut | These do nothing: H, h, L, l, I, M and T pressed alone (0.02 mean px against the board frame); LIMI, a 2.6 s pause, then T; LIMXT (X is cancel, back to the title as on `main`); every arrow, WASD, Q/E/R/F/V/H, Tab, PgUp/PgDn/Home/End ×18 (the cursor reached all 14 playable tiles, never FF7, never left the board); six taps, a 4.5 s wait, then one more; a click or tap on each of the 15 rail tiles. `__pyrefly.chapters()` lists the same 15 ids as `main`, and the API has the same keys. Only `scenes()` adds `sector1-reactor` |
| (b) Door and fight by real input | **Keys, 1600x900.** LIMIT, then Esc pause and resume, then a sensible fight: a win in 21 turns. Enter goes back to the board. F R F R M (the pad sequence on its keyboard mapping) opens it again: a naive loss, RETRY (seed +1000, checked), a second loss, ↓ Enter to CHAPTER SELECT. **Taps, 390x844.** Seven taps, then a win in 20 turns. The three warnings came in a row every time. No page errors |
| (c) Save untouched | A non-empty `pyrefly-reprise:save:v1` (527 B) was byte-identical after the win, and again after two losses and a RETRY. No other key changed except `pyrefly-reprise:experiments:v1`, which counted 3 attempts, 1 clear and the best time. Board snapshot unchanged each time |
| (d) FFX / FFX-2 | **Real keys from the title.** Chapter I (Seymour Flux) and Chapter IV (Bahamut), each through prep, cutscene and first command menu, on both builds: same layout, and the only pixel differences are sway. The guide card's text rotation is the same on both. Chapter I played to the end by keys gives the identical defeat on both (turn 9, 42 ticks, the same HP). Chapter IV by Enter alone does not finish in 7 minutes on either build (turn 224 on both). **Flow autoplayer (seed 1).** Chapters I, II, IV and VI give identical outcomes, turns, ticks, links, EXP and AP, and saves that differ only in `updatedAt` and `playTimeMs`. **Code.** The diff against the merge base touches `src/battle/ffx*` and `src/ui/ffx*` only in `withTargets.ts` (two `case` lines). Every engine, UI and results edit is an explicit `'ff7'` branch, or is equivalent for FFX and FFX-2 (for example `leaderId`) |
| (e) Bundle (gzip -9, first load) | Branch 839,104 B (3,255,869 raw) against `main` at `1a43fd7b` 811,033 B (3,172,804 raw): **+28.1 kB gzip**, +83 kB raw. Matches the builder's figures to within 30 B |
| (f) `critic-plan --json` | Against `1a43fd7b`: **deep class, focused before deploy, deep after deploy** (`deepBeforeDeploy: false`), obligations `live`, `focused`, `deep`, games `both`, 101 product paths. Against the last deploy (`d8837334`): the same class |

**Findings**

- **Major C-1: the branch is behind `main`.** `origin/main` moved to `a44297ca` during the check: 48
  commits, including the iter2 B1/B3/B4 merges and the FFX-2 engine split. `git merge-tree` finds
  conflicts in `src/app/screens/BattleScreen.ts`, `battleSpellFx.ts` and `docs/CONTRACT-CHANGES.md`.
  Everything above is proven only against `1a43fd7b`. The merged candidate needs (a) to (f) run
  again, above all the FFX-2 checks and the `BattleScreen` wiring.
- Minor C-2: FF7's defeat panel reads the main save's (empty) record for the hidden chapter. It
  shows "ATTEMPTS 1" and "BEST — NEVER CLEARED" after 3 attempts and a clear (frame
  `fight-1600x900/025`). It only reads, never writes. FF7 only. It could read the experiments store,
  or drop those rows until the FF7 results options round.
- Minor C-3: `src/battle/common/types.ts` (a contract file, already over 400 lines) grew from 2660
  to 2675 lines. Rule 7 says files over 400 must not grow, and the line-count list above leaves it
  out. The CONTRACT-CHANGES entries exist.
- Minor C-4: this note says the board still reads "of 15". Both builds actually read "0 OF 14
  BEATEN" (15 tiles, one COMING). The behaviour is the same; only the wording here is wrong.
- Minor C-5: a debug-only route shows the wrong picture. If `__pyrefly.gotoChapter(...)` runs over
  a live board and `goto('chapter-select')` follows, the FF7 fight opened next by the door draws
  under the title screen's DOM: only the HUD and the turn triangle show. A player cannot reach this.
  The player's route (title, Enter, board, LIMIT or seven taps) is clean at 1600x900 and 390x844.
  It matters only to an e2e that uses that debug route.
- Minor C-6: FFX-2 Chapter IV was not played to an outcome by real keys. Enter alone stalls on both
  builds. Its whole battle was checked by the flow's autoplayer instead (identical results).

## RE-CHECK: independent check of d21e4587 after the merge with main and the class-A fixes, 2026-09-27

A second independent checker, who built none of this, checked `ff7-integration` at `d21e4587`, which
has `origin/main` `a44297ca` merged in. `origin/main` has since moved to `cd9e8d0a`, but that commit
only adds `docs/concepts/`, so the product is the same. **Verdict: no blocker.** One major, which is
a judgement call for the driver (R-1), and four minors. Game case: FF7 only. The FFX and FFX-2 rows
below are the proof that neither game changed.

**Method.** The checker made two production builds with the art: the branch, and `main` at
`a44297ca` (from `git archive`). They were served by `vite preview` on ports 6620 (branch) and 6621
(main), with headless Chromium, `PYREFLY_BROWSER=gpu` and one browser at a time. Both servers were
stopped by their PIDs. The scratch scripts are `tools/zz-recheck-*.tmp.mjs` (not committed). Frames
and reports are in `D:/Tools/pyrefly-scratch/ff7-recheck/`. The FF7 fights began from a non-empty
main save. It was made in a separate page and injected before boot, so each fight page reached the
board only the player's way (title, then Enter or a tap).

| Check | Result |
|---|---|
| tsc (app, e2e) | Both clean |
| Full `vitest run` | 533 files pass, 5 skipped, 1 fails: the known `strategy-ffx2-bahamut` "heal-only route" timeout under full load (15 s limit). It passes alone (19/19, 8.2 s). `ffx2-atb-golden` 6/6, `ff7-class-a` 7/7 |
| `orphans.mjs` | 24, the same list, none of them FF7 |
| Approved art | sha256 of every file in `approved-hashes.json` (219) and `judge-locked-hashes.json` (48): all match in `public/art` and in the built `dist`. 0 mismatched, 0 missing |
| (a) Board unchanged | At 1600x900, 1024x768 and 390x844 the board's snapshot and words match `main`'s build: 15 tiles in the same order, one COMING, "0 OF 14 BEATEN". No FF7 text in the DOM. Pixel diff against `main`: 0 px at 1024 and 390. At 1600 there are 383 px (mean 0.03), all inside the rail's thumbnails, a fade-in caught at a different moment; the layout is the same |
| (a) Door stays shut | Nothing opened on: H, h, L, l, I, M and T pressed alone; LIMI, a 2.6 s pause, then T; LIMXT (X cancels back to the title, as on `main`); arrows, WASD, Q/E/R/F/V/H, Tab, PgUp/PgDn/Home/End x18 (the cursor visited all 14 playable tiles and never FF7); a click on each of the 15 rail tiles; at 390x844, six taps, a 4.5 s wait, one more tap, then a tap on each tile. `?chapter=ff7-guard-scorpion#ff7-guard-scorpion` does nothing, and `goto('ff7-hud-demo')` does nothing (DEV only, not in the bundle). `__pyrefly.chapters()` and the API's keys are identical to `main`'s; only `scenes()` adds `sector1-reactor`. **But `__pyrefly.gotoChapter('ff7-guard-scorpion')` opens the fight** (R-1) |
| (b) Door and fight by real input | **Keys, 1600x900.** Typing LIMIT opened the fight; Esc paused and Esc resumed. A sensible fight won in 19 turns, and Enter on the results returned to the board. F R F R M (the pad sequence on keys) opened it again. A naive loss; the defeat panel reads "ATTEMPTS 2, BEST 0:49" (**C-2 fixed**). RETRY re-entered with seed +1000. A second loss, then Down and Enter to CHAPTER SELECT. **Keys, 1024x768.** The same sequence: a win in 21 turns, two losses, RETRY at +1000. **Taps, 390x844.** Seven taps on the label opened it; a win in 19 turns; CONFIRM returned to the board. No page errors in any run |
| (b) Scale and numerals | The boss is clearly the biggest figure and stays inside the frame. At 1600x900 the tail tip is at about y 195, the turret top about 235 and the feet about 545, against Cloud at about 385 to 595. Measured by eye, the visible silhouette is about 1.5x Cloud (body) and about 1.65x (tail tip); the builder's 1.75x measures the painting's box. The raised tail stays under the message window. Every damage numeral was sampled on each frame (`.ff7-dmg` boxes; about 4,000 samples per desktop run, 974 on the phone). None left the viewport: at 1600x900 x 364 to 1402 and y 278 to 522; at 1024x768 x 231 to 908 and y 265 to 435; at 390x844 x 79 to 351 and y 383 to 447 |
| (c) Save untouched | A non-empty `pyrefly-reprise:save:v1` (501 B) was byte-identical after the win, and again after two losses and a RETRY, in all three runs. No other key changed except `pyrefly-reprise:experiments:v1` (attempts 3, clears 1, best time, play time). The board snapshot was unchanged each time |
| (d) FFX / FFX-2 by real keys | **Chapter I (Seymour Flux)**, from the title through prep and the cutscene, on both builds. The first command menus have the same HUD, the same guide card and the same text. The best pixel match between builds (mean 5.9) sits within the difference between two `main` runs (mean 5.6): idle sway and camera phase. The whole battle by Enter gives the identical defeat on both builds: turn 9, 42 ticks, the same HP. **Chapter IV (Bahamut)**, played to a **win by real keys** on both builds with the critic's route driver (`critic/runner/lib/route.mjs`, seed 1). Both: victory in 56 turns, the same first enemy action (Curse on Paine), **the same 55 picks in the same order**, the same results ledger (only the clear time differs: 6:36 against 6:49), and the same board afterwards. The event counts are identical except `status-tick`, which runs on the wall clock under Active. First-menu frames: within the sway baseline. **C-6 closed** |
| (d) Code | `src/battle/ffx*`: no diff against `main`. `src/ui/ffx*`: only `withTargets.ts` (two `case` lines for FF7 commands). Every edit to a shared file was read. Each one is an explicit `'ff7'` branch; or goes through `ffxFamily()` (FF7 throws, FFX and FFX-2 unchanged); or is equivalent for both games (`leaderId`, `bodyFacingOption`/`stageCamera` with no scene switch, `bracketAnimations`, which is a no-op because no FFX or FFX-2 engine has `setAnimating`, `presenterGameDeps`, and `BattleMoments.slidePartyIn`, where every FFX and FFX-2 party actor is built with `facing` 1). The merge took `main`'s `battleSpellFx` rate and `BattleScreen` stage options as they were |
| (e) Bundle (gzip -9, first load) | Branch 853,627 B (3,296,327 raw) against `main` at `a44297ca`, 824,783 B (3,212,761 raw): **+28.8 kB gzip**, +83.6 kB raw |
| (f) `critic-plan --json` | Against the last deploy in the worktree's log (`d8837334`), and with `--since a44297ca`: **deep** class, `focusedBeforeDeploy: true`, `deepBeforeDeploy: false`, `deepAfterDeploy: true`, obligations `live`, `focused`, `deep`, games `both`, 103 product paths since `a44297ca`, carried deep `d8837334`. No save-data reason |

**Findings**

- **Major R-1: a debug route reaches the fight.** On the production build,
  `window.__pyrefly.gotoChapter('ff7-guard-scorpion')` opens the FF7 battle and draws it correctly
  (frame `debugroute-branch.jpg`). On `main` the same call resolves `null`. The brief's (a) says no
  debug route may reach it except the door, so (a) fails on this point. A player needs the console
  and the literal id, which neither `chapters()` nor the page shows. `ff7Flag.ts` says this route is
  intended. The checker rates it major, not a blocker, and leaves the call to the driver. Two ways
  out: keep it and record it as the testers' route, or let `gotoChapter` refuse `experimental`
  chapters outside `import.meta.env.DEV`. FF7 only.
- Minor R-2 (was C-5, still there): after `gotoChapter(...)` plus `goto('chapter-select')` over a
  live board, the door's FF7 fight draws under the title screen's DOM. Only the HUD shows (frames
  `fight-1600x900/009`, `011`). The player's route is clean at all three sizes. Only a harness that
  uses the debug route is affected.
- Minor R-3: C-3 is met by the letter, since `types.ts` has exactly 2,667 lines. It got there by
  folding statements onto existing lines. Line 31 is a doc comment followed by
  `export type GameId` on the same line. Line 32 is `import type { ... } from './types-ff7.ts';
  export type * from './types-ff7.ts';`, an import placed after the header and not at the top.
  Readability suffers. It is a contract file, and it was already over 400 lines.
- Minor R-4 (known, disclosed): on an upright phone the whole field is small. The boss is about
  110 px wide and about 90 px tall at 390x844 (frame `fight-390x844-taps/008`), with dark bands
  above and below. This is the handoff's open item 9, and its options round is still owed.
- Minor R-5 (informational): the "1.75x Cloud" figure measures the painting's box. The visible
  silhouette is about 1.5x (body) to about 1.65x (tail tip). The boss clearly towers over the party
  either way.

C-1 (behind `main`) is settled by the merge. C-2, C-4 and C-6 are fixed or closed as described
above. C-3 is covered by R-3.

## CHECK: independent release-readiness check of ff7-phase3 at 09a74ad9 (the repair pass), 2026-09-27

An independent checker, who built none of this, checked branch `ff7-phase3` at `09a74ad9`. **Verdict: no
blocker.** Two majors: the branch no longer merges cleanly with today's `main` (P3C-1), and repair item 1 is
only half fixed, because Barret's aim now stands about 90 px **left** of his idle (P3C-2). There are also
three minors. Game case: **FF7 only**. The FFX and FFX-2 rows below show that neither game changed, against
`47ab4ae8` (the branch's base, and `origin/main` when the check began).

**Method.** The checker made two production builds with the art, using `vite build` into
`D:/Tools/pyrefly-scratch/ff7-p3-check/dist-{branch,main}`. `main` is `47ab4ae8`, taken with `git archive`
and built with the same `public/`. The two builds were served by `vite preview` on ports 7220 (branch) and
7221 (main). Everything ran in headless Chromium with `PYREFLY_BROWSER=gpu`, one browser at a time. Both
servers were stopped by their PIDs. The scratch scripts are `tools/zz-p3check-*.tmp.mjs`, and `main`'s
source is in `zz-p3check-main.tmp/`. Neither is committed. Frames and reports are in
`D:/Tools/pyrefly-scratch/ff7-p3-check/`. Each FF7 fight started from a non-empty main save, made in a
separate page and injected before boot. The fight page then reached the board only the player's way: the
title, then Enter or a tap.

| Check | Result |
|---|---|
| tsc (app, e2e) | Both clean (TypeScript 7.0.2, 2,389 files) |
| Full `vitest run` | 599 files pass, 5 skipped, 1 fails. The failure is the known `strategy-ffx2-bahamut` "heal-only route" timeout under full load (15 s). Run alone with `ffx2-atb-golden`, 25/25 pass. `ff7-golden` passes 3/3. The branch diff does not touch `tests/fixtures` or `src/battle` since `3afd0e4e`, so there was no re-pin |
| Repair test is real | With the FF7 `await this.playing` line in `BattlePresenter.submit` disabled, `ff7-judge-repair`'s item-3 test fails (10/11). With the line restored, it passes 11/11 |
| `orphans.mjs` | 24, the same list, none of them FF7 |
| Approved art | The sha256 of every entry in `approved-hashes.json` (238) and `judge-locked-hashes.json` (48) matches, in `public/art` and in the built `dist`: 286 ok, 0 mismatched, 0 missing. `tools/verify-approved.mjs` does not exist in this tree, in `main`'s tree or anywhere in git history (P3C-4) |
| `git merge-tree` | Against `47ab4ae8` (`origin/main` when the check began): clean, because the branch is a fast-forward. **Against today's `origin/main` `d89541b6` it is not clean** (P3C-1) |
| (a) FF7 hidden | At 1600x900, 1024x768 and 390x844, the board reached by real input matches `main`'s build **pixel for pixel (0 px differ)**, and the snapshot and words are identical: 15 tiles, one COMING, "0 of 14 beaten". There is no FF7 text in the DOM. `__pyrefly` keys, `chapters()` and `scenes()` are identical to `main`'s. These do nothing: h, l, i, m, t, L, H, f and r pressed alone; LIMI, a 2.6 s pause, then T; FRFR, a 2.6 s pause, then M; LIMXT (X goes back to the title, as on `main`); 18 presses each of arrows, WASD, Q, E, Tab, PgUp/PgDn/Home/End (all 14 playable tiles visited, never FF7); a click, and at 390x844 a tap, on each of the 15 cards, twice (each opens its own party prep or does nothing; none opens FF7); six taps, a 4.5 s wait, one more tap. `?chapter=ff7-guard-scorpion#ff7-guard-scorpion` stays on the title. `goto('ff7-hud-demo')` does nothing. Only the intended debug route, `gotoChapter('ff7-guard-scorpion')`, opens the fight, and it does the same on `main`'s build |
| (b) Door, win, Game Over and RETRY by real input | **Keys, 1600x900.** LIMIT, the swirl and the opening, then a sensible fight: a win in 19 turns with Bolt, Scope, Rifle, Tail, Tail Laser and the shot. Then D1, both C1 windows ("EXP 100, AP 10, Cloud LV 7 +100, Barret LV 6 +100"; "GIL 100, Assault Gun 1 (Barret: Att 17, Long Range), Received 100 gil and the Assault Gun."), and Enter twice to the board. LIMIT again, then a naive loss (Braver, Big Shot, a KO'd Barret laid down at once). G1 GAME OVER with RETRY / CHAPTER SELECT. RETRY by Enter uses seed + 1000 (checked). A second loss, then Down and Enter to CHAPTER SELECT. **Taps, 390x844, DPR 3.** Seven taps on the label, a win in 18 turns, the results by taps on `.ff7-res-next`, then a loss, RETRY by a tap (seed + 1000), a loss, and CHAPTER SELECT by a tap. The same run again at 4x CPU throttle won in 16 turns. There were no page or console errors in any run. Every damage numeral stayed inside the frame: 3,779 samples at 1600x900 (x 164 to 1212); 3,962 at 390x844 (x 2.4 to 334) |
| (c) Save untouched | `pyrefly-reprise:save:v1` (511 B) was byte-identical after the win, and again after two losses and RETRY, in all three runs. The only other key that changed was `pyrefly-reprise:experiments:v1` (attempts 3, clears 1, best time). The board snapshot and words were unchanged each time |
| (d) FFX / FFX-2 by real keys | **Chapter I (Seymour Flux)** and **Chapter IV (Bahamut)** were run from the title through prep and cutscene to the first command menu on both builds. The HUD, guide card, advisor card and text are the same. The best pixel match between builds (Ch I mean 4.2, Ch IV mean 4.2) is within the difference between two `main` frames (4.6 and 9.7): idle sway. **Whole battles** used the critic's route driver (`critic/runner/lib/route.mjs`, seed 1, real keys) on both builds. Ch I: the same 23 picks, the same first enemy action (Lance of Atrophy on Yuna), and the same defeat at turn 47. Ch IV: a **win** on both, the same first enemy action (Curse on Paine), and the same 30 picks with the same engine HP at every pick. The only difference is the route's wall-clock label of what was playing. The results are the same (EXP 1,300 x3, 15 AP, 1,000 gil, Gris Gris Bag), and only the clear time differs (4:01 against 3:59). **Code.** Every shared-file edit since `47ab4ae8` was read. Each one is either an explicit `game === 'ff7'` branch or an optional hook that only FF7 sets (`actionMotion` exists only for an FF7 build; `SpellFxLayer.lands` is filled only for `'ff7'`, so `pendingLand` returns 0 elsewhere; `erode` is 0 unless a scene sets `figureLight`). Nothing under `src/battle` changed |
| Phone frame time (Spectacle) | This was measured on this PC's GPU in headless Chromium, not on a phone (P3C-5). At 390x844 and DPR 3, frames with an FF7 effect running averaged **16.67 ms** (p95 16.8, max 16.8, none over 33 ms; 4,854 frames). At 4x CPU throttle they averaged **16.89 ms** (p99 16.8; 15 of 4,554 frames over 33 ms). The effect layer's own CPU cost averaged 0.07 ms (0.36 ms throttled). At 1600x900 the average was 16.67 ms |
| Bundle, first load (gzip -9) | Branch 882,678 B (JS 834,781 + CSS 47,897; 3,389,146 raw) against `main` at `47ab4ae8`, 866,115 B (818,822 + 47,293; 3,345,348 raw): **+16.6 kB gzip**, +43.8 kB raw |

**Findings**

- **Major P3C-1: the branch does not merge cleanly with today's `main`.** `origin/main` moved during the
  check from `47ab4ae8` to `d89541b6`: 31 commits, including the advisor v3, combat-switches and
  Chapter XVI Ixion merges, with 54 `src` files changed. `git merge-tree` reports conflicts in
  `docs/target/approved-hashes.json` and `docs/CONTRACT-CHANGES.md`. In both files, both sides added a new
  entry at the same place: the `bailey:2026-09-27-ff7-film` set against `bailey:2026-09-27-ixion`, and
  two newest-first log entries. Keeping both sides resolves each one, but the JSON needs its comma back.
  `tests/e2e/ff7-guard-scorpion.spec.ts` auto-merges to main's `tiles` value of 16, because Ixion is now
  listed. Everything above is proven only against `47ab4ae8`. The merged candidate needs (a), (c) and
  (d) run again, above all the board (16 tiles) and the FFX-2 chapters with advisor v3 and action time.
- **Major P3C-2: repair item 1 is only half fixed. Barret's aim now stands about 90 px left of his idle.**
  In the live fights at 1600x900, Barret's boots at idle are centred at about x 255. At aim they are at
  about 165, and at fire at about 255. Each shot now jumps him about 90 px left, then back (frames
  `fight-1600x900-keys/004`, `005`, `006`, `026`, `027`, `042`; a direct probe gives `stance-1600x900/sheet-barret.jpg`).
  The phone shows the same thing. The fire plane sits where its offset puts it: world x -0.429, which is
  -203 px x `unitsPerPixel` 0.002113. The aim plane measured -0.747 and -1.057 world units in two probes,
  where -213 x 0.002113 gives -0.450. Something else moves the aim plane, and the amount is not the same
  every time. The unit test (`ff7-judge-repair`, "within 6 px") works in PNG pixels with each sidecar's
  `scale`, not on the drawn plane, so it passes regardless. Suggested test: measure the projected feet
  (or the plane's x) per pose on a real `PaintedActor`. Cloud's keys stand on his idle within a few px.
  His strike stands about 45 px forward, which is fine, because it is only drawn at the strike point.
  FF7 only. This is not a blocker (the fight plays and is won), but it is the judge's pose-jump major in
  the other direction.
- Minor P3C-3 (rule 7): six contract or shared files that were already over 400 lines grew. They are
  `PaintedActor.ts` (1,998 to 2,022), `BattlePresenter.ts` (689 to 697), `BattlePresenterPorts.ts` (465
  to 471), `BattleScreen.ts` (943 to 947), `BattlePresenterStage.ts` (845 to 848) and
  `BattlePresenterEvents.ts` (435 to 436). The CONTRACT-CHANGES entries exist.
- Minor P3C-4: the "Checks" list of the first phase-3 pass above reports that `verify-approved.mjs` ran
  ("ROOT = the worktree"). No such script exists in any tree or in git history. The repair note says so
  and did the hash check by hand, and this check did the same. `NOW.md` and several handoffs still name
  the script.
- Minor P3C-5 (disclosure): no real phone was measured. The 60 fps figures are from a desktop GPU,
  including the 4x CPU throttle run. A mid-range phone's GPU fill rate for the washes, glows and haze
  at DPR 3 is still unknown.

What the builder claimed and this check confirmed: tsc; the suite with the one known timeout; the
goldens unchanged; orphans at 24; 286/0/0 on the approved art (also in the built `dist`); the item-3 test
failing without its fix; D1, C1 without an AP line, and G1 with RETRY at + 1000; the KO'd member lying
down at once; the board and the save untouched; FFX and FFX-2 identical. The checker did not re-run the
builder's e2e and ran their own real-input fights instead.

## CHECK: independent check of the release prep, ff7-phase3 at 6807a000, 2026-09-28

An independent checker, who built none of this, checked branch `ff7-phase3` at `6807a000`: the merge
`68b7ceca`, the fix `15efd668` and the frames `6807a000`. **Verdict: 0 blockers, 0 majors, two minors.**
P3C-1 and P3C-2 are settled. The see-through boss is fixed, and the measurement below shows it against the
pre-fix build. Game case: **FF7 only**. FFX and FFX-2 were checked against `main` `d89541b6` and are
unchanged.

**Method.** The checker made three production builds with the art, using `vite build` into
`D:/Tools/pyrefly-scratch/ff7-p3-check2/dist-{branch,main,prefix}`: the branch, `origin/main` `d89541b6` and the
pre-fix merge `68b7ceca`. `main` and `prefix` came out of `git archive` and were built with the worktree's
`public/`, which has no diff against `main`. The builds were served by `vite preview` on ports 7810 (branch),
7811 (main) and 7812 (prefix). All three servers were stopped by their PIDs. Everything ran in headless
Chromium (`PYREFLY_BROWSER=gpu`), one browser at a time. The scratch scripts are `tools/zz-p3check2-*.tmp.mjs`,
with the sources in `zz-p3check2-{main,prefix}.tmp/`. None of them is committed. Frames and reports are in
`D:/Tools/pyrefly-scratch/ff7-p3-check2/`. A path slip left the stance frames in `.../ff7-p3-check22/`.

| Check | Result |
|---|---|
| tsc, typecheck:e2e | Both clean |
| Full `vitest run` (once) | 607 files pass, 5 skipped and 4 fail. Every failure is a timeout under full load: `strategy-ffx2-bahamut` heal-only (the known one), `audio-manifest-io`, `ff7-judge-repair` item 3 and `ui-ffx2-atbmode`. Run alone, the four files pass 45/45 (minor P3C2-2) |
| Goldens | `ffx2-atb-golden` 6/6 and `ff7-golden` 3/3 pass, and `ff7-release-prep` passes 6/6. Nothing under `src/battle`, `src/data` or `tests/fixtures` changed after the merge |
| `orphans.mjs` | 24, the same list |
| Approved art | `approved-hashes.json` 242 and `judge-locked-hashes.json` 48: 290 ok, 0 mismatched, 0 missing, in `public/art` and in the built `dist`. All 45 of `main`'s sets are present and byte-identical, plus `bailey:2026-09-27-ff7-film`. `CONTRACT-CHANGES.md` removes no line of `main`'s |
| `git merge-tree` against `origin/main` `d89541b6` | Clean (the branch contains it) |
| Rule 7 | `PaintedActor.ts` 2,022, `BattlePresenterStage.ts` 848 and `BattlePresenterPorts.ts` 471 lines, the same as at `68b7ceca`. The edits were made in place |
| Code | `floorCut` defaults to 0, so every FFX and FFX-2 caller keeps `FLASH_FLOOR` 0.34. `poseScalingOf` returns `{}` unless a scene sets `figureExtent` or `restPoses: false`, and only `sector1Staging` sets either one. `proneAspect` is read only by `PaintedScale`'s prone test |
| The boss stays opaque (dense frames, 1600x900, opened by the door) | **Green screen.** The backdrop was hidden and the background set to pure green (inspection only). Six hits were captured in 430 frames (shot, slash, scope, rifle, tail laser, the recoil painting, tail up). The green-tinted share of the boss's lower-body pixels was 0.029 to 0.071 through every hit. At idle it was 0.039 to 0.041, which is edge antialiasing. The spikes are the tracer and the numerals. The 10 other frames are full-screen washes that cover the HUD too. **Continuous frames**, about 50 ms apart, JPEG, seed 7, 150 s, the whole fight by Enter: 2,955 frames on the branch and 2,933 on the pre-fix build. On the branch, every boss slot sat at fade and opacity 0 or 1 in every frame. The tail swap is a hard cut between two frames (417 against 416), and the recoil is the same. **The cast light, before and after.** The measure is the 20th-percentile brightness of the boss's red plates in the leg band. On the pre-fix build it stayed above 52 for up to 250 to 266 ms after each hit, and the cast window held 55 to 62 for 5 to 7 frames (`crop-legs-before-after.jpg`, panel 2: pale legs). On the branch, the cast window (`flashFloorCut` 1) holds 31 to 39, against 36 to 38 at idle. Only the impact moment lifts: 1 to 3 frames, at most about 150 ms (minor P3C2-1) |
| Barret's aim (P3C-2) | The live planes on the branch sit at idle 0, aim -0.4501, fire -0.429, hurt 0.013 and victory -0.013 world units. The aim is -213 px x 0.002113 exactly, the same in each probe. On screen at 1600x900, the boots at aim and at fire fall within about 20 px of the idle stance, with the gun level (`sheet-stance.jpg`). Cloud's keys are unchanged |
| FF7 hidden | At 1600x900, 1024x768 and 390x844, the board reached by real input is **0 px different** from `main`'s build, with the same snapshot and words: 16 tiles including Chapter XVI Ixion, one COMING, "0 of 15 beaten", and no FF7 text in the DOM. The `__pyrefly` keys, `chapters()` and `scenes()` are identical. None of these opens it: the single keys, LIMI + pause + T, FRFR + pause + M, or LIMXT (back to the title, as on `main`). 18 presses of each of the arrow, WASD and paging keys visited all 15 playable tiles and never FF7. Neither did a click (1600x900) or a tap (390x844) on each of the 16 cards, nor six taps, a wait and one more tap. `?chapter=ff7-guard-scorpion` stays on the title, and `goto('ff7-hud-demo')` does nothing. Only `gotoChapter('ff7-guard-scorpion')` opens it, which it also does on `main` |
| Win, Game Over, RETRY by real input | **Keys at 1600x900.** LIMIT, then a win in 18 turns. D1, then C1 ("EXP 100, AP 10, Cloud LV 7 +100, Barret LV 6 +100", then "GIL 100 ... Assault Gun"), and Enter to the board. LIMIT again, a loss, G1 GAME OVER, and RETRY by Enter (seed + 1000, checked). A second loss, then Down + Enter to CHAPTER SELECT. **Taps at 390x844, DPR 3.** The same sequence: a win in 18 turns, results by taps, a loss, RETRY by a tap (+ 1000), a loss, and CHAPTER SELECT by a tap. No page or console errors. The numerals stayed inside the frame: 3,717 samples at 1600x900 (x 164 to 1212) and 4,025 at 390x844 (x 13 to 333). Frames while an effect ran: mean 16.67 ms, none over 33 ms (desktop GPU) |
| Main save | `pyrefly-reprise:save:v1` (511 B, from a Chapter I run in a separate page) is **byte-identical** after the win and after two losses and RETRY, in both runs. Only `pyrefly-reprise:experiments:v1` changed. The board was unchanged |
| FFX and FFX-2 first menus, real keys, seed 1 | **Chapter I** (Seymour Flux), **Chapter IV** (Bahamut) and **Chapter XVI** (Ixion at Djose) were each played from the title through prep and the cutscene to the first command menu, on both builds. The engine snapshots are identical (turn, HP of every combatant). The best main-against-branch pixel match falls within main's own idle-sway baseline for all three (mean 5.2 against 4.5, 5.9 against 11.2, 4.7 against 6.6), and the Chapter I frames match by eye (`sheet-ch1.jpg`) |

**Findings**

- Minor P3C2-1 (accuracy of the note, not a regression): "B1's white pop keeps half the floor" is true only
  for the first frame. On the same hit, the shared damage beat (`BattlePresenterBeats.ts` line 125,
  `target.flash(0xffd0c0, 200, 0.8)`, or white at 1 on a crit) calls `flash` without a `floorCut` and resets it
  to 0. For about 100 to 150 ms after the pop, the boss's darks therefore lift with the full floor (p20 47 to
  83 against 37 at idle), and then the floorless cast takes over. This matches the builder's "one 53 to 57
  frame at the white pop" only loosely. It reads as a hit flash, not a veil, and the 0.5 s veil is gone. If
  Bailey still sees a flicker there, the FF7 director could re-send its white pop with `FF7_HIT_FLOOR_CUT`
  after the beat's flash, or the beat could take an FF7 floor cut. FF7 only.
- Minor P3C2-2: under full-suite load, four files timed out, against the builder's one
  (`audio-manifest-io`, `ff7-judge-repair` item 3 and `ui-ffx2-atbmode` besides `strategy-ffx2-bahamut`). All
  four pass alone (45/45). This is the machine's load, not the branch. `ff7-judge-repair`'s 30 s test is the
  one to watch on the release tree.
- Carried, not re-opened: P3C-5 (no real phone measured) stands.

What the builder claimed and this check confirmed: the clean merge that keeps both sides; tsc; the goldens;
orphans at 24; 290/0/0 on the approved art; no line added to the three files over 400 lines; the boss opaque
through every hit, the tail swap and the recoil; the pre-fix veil and its cause (the cast light's floor); the aim
plane at -0.450 every time and the stances together; the boss standing level; FF7 hidden; the save untouched;
FFX and FFX-2 unchanged, including Chapter XVI.
