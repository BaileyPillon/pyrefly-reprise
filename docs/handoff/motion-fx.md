# motion-fx: spell, hit and item effects for the demo chapters (lane fx, branch `motion-fx`)

Bailey, 2026-10-22 00:10 to 01:30 EDT: spell effects "Faithful shape, painted finish": each effect's shape, colour and timing follow its own game (FFX in Chapter I, FFX-2 in Chapter IV), drawn with a brushy painted finish; reference "Official videos"; scope "Demo chapters first" (Chapter I Seymour Flux and Chapter IV Bahamut only, only when switched on); perf guard "Trim particles first"; motion SFX and hit-stop belong to the other lanes.
Base: `origin/main` 3e520971e (release 61 + records). Tree `D:/pyrefly-rig-auron2`, dev port 5303. Notes folder (scratch, not in the repo): `D:/Tools/pyrefly-scratch/2026-10-22/motion/fx/`.

## State

| Step | What | State |
|---|---|---|
| 1 of 3 | Reference notes: shape, motion, colour, timing, layering and caster/target for every effect in scope, per game, from research and official videos | **DONE** (`docs/handoff/motion-fx-reference.md`; no code) |
| 2 of 3 | The painted finish, the switch, the guard, and the party effects: Cure/Cura, Haste/Shell/Protect/Reflect/Dispel, hit sparks per weapon, items, Fire/Blizzard/Thunder | **DONE, default OFF** (this note; code, 4 test files, captures) |
| 3 of 3 | Bosses' attacks, Overdrives and their intros, the FFX-2 name slab and dress change, Jump, Swordplay strike | not started (see "Not done") |

## Switch (read this first)

* **Off by default.** With no address key, in every unit test and in every chapter but two, nothing here runs: `FxSwitch.fxNewOn()` is false and every hook falls through to today's code.
* **On** when the address carries `?fx=new` or the shared `?pack=demo` (the Thursday test build), **and** the running chapter is Chapter I (`seymour-flux`, FFX) or Chapter IV (`ffx2-bahamut`, FFX-2). `?fx=today` beats the pack (for A/B). `?fx=` is also the eye-candy key (`fx/EyeCandy.ts`); its parser skips the two new words, and `?fx=new,b` feeds both.
* Read once per page. `window.__pyrefly.fxNew('new' | 'today')` sets it for what starts from now on (a running copy keeps the look it started with); `fxNewOn()`, `fxNewChapter(id)` and `fxNewGuard(dtMs, busy)` are for the recorder.
* The chapter gate is named by the spell layer itself (`SpellFxLayerOptions.chapterId`, passed by `battleSpellFx` from the one changed line in `BattleScreen`), set while the layer lives and cleared only by the layer that set it.
* **Flipping the default (Friday):** change `fxModeFromSearch`'s fallback in `src/engine/spellfx/FxSwitch.ts` (one line) for the pieces Bailey approves; pieces are not individually switchable today (one switch for the whole set; see open question 3).

## What was built (case per effect, AGENTS.md rule 14)

| Piece | Game case | Shape source | Clock | Files |
|---|---|---|---|---|
| **Painted finish** (a brush look on every quad of every effect in the layer: bristle-streaked soft edges, a hand-drawn wobble on hard edges, streaks of pigment in the body) | both | [ours]; the look is Bailey's pick, the method is a shader, no image file | none | `FxBatch.ts` (shader, `iQ` attribute), `FxPaint.ts` (how much per primitive, stable seeds), `FxAtlas.ts` (4 extra tiles drawn in code, only when on), `FxDrawList.ts`, `fxMath.ts` |
| **Cure / Cura**, FFX | FFX only | **sourced**: the column (reference 2.1: mint and white crystalline column, ground ripple, cyan darts, dusk, one column per target in turn) | mark 0.45 s (today 0.5), stagger 0.18 s per target | `effects-painted-cure.ts` |
| Cure, FFX-2 | FFX-2 only | [gap] in the footage: neutral painted version of today's pink/mint sparkles, ripple ring, eased sparkles on brush trails | mark 0.5 s (today's) | same |
| Items' heal (Potion family, Phoenix Down) | FFX only | the sparkles falling are [M] (research/re-ffx-party-motion-timing.md §6); size and the warm Phoenix tint are [ours] | 0.45 s | same, `LandOpts.item` |
| **Haste, Shell, Protect, Reflect, Dispel** | both, one design in two skins | [ours] entirely ([gap] in the footage); colours are the status chips | mark 0.45 s (Dispel 0.35) | `effects-painted-buffs.ts`, ids in `SpellFxRegistry.ts` |
| **Hit sparks per weapon** (sword, katana, greatsword, dagger, spear, staff, blitzball, doll, claw, gun, generic) | both; each game's own weapons (`audio/sfxV2/weapons.ts`: FFX `weaponType`; FFX-2 dressphere or the girl's own) | [ours] except the blitzball's round cyan-white flash (Wakka's Overdrive footage, shape only) | mark 0.3 s, as today | `effects-painted-hit.ts`, `SparkWeapon.ts` |
| **Fire, Blizzard, Thunder** | both (shared functions, two skins) | [ours] additions on today's effects: shockwave rings, eased sparks as strokes with trails, Thunder's afterglow | marks 0.5 / 0.5 / 0.42 s, as today | `effects-painted-elements.ts` |
| **Item toss, livelier** | FFX: orb with a painted comet trail, burst; FFX-2: burst only (its source says no trail) | the gesture is sourced ([M]); trail, rings, sparks [ours] | none (reads the light's phase) | `fx/ItemOrbFlourish.ts`, `ItemOrbStage.ts` |
| **Frame-time guard** | both | [ours] | n/a | `FxPerfGuard.ts`, `SpellFxFreshLayer.ts`, `CrispRig.setScaleCut` |

Every spark and ring travels on an eased path (`outQuart`, `outExpo`, a little gravity for debris) and is drawn as a stroke from where it was to where it is, so it stretches while fast and shortens as it settles; the trails are `FxDrawList.trail()` segments (0 when the guard has cut them).

### The numeral never waits longer than it did

Every new mark is today's or earlier (Cure 0.45 against 0.5, hit 0.3 as today, the buffs 0.45 against today's bloom's none) and every hold cap is today's 900 ms (`SPELL_HOLD_CAP_MS`). A party-wide FFX Cure staggers its columns by 0.18 s a target (the footage shows about 1 s; 0.18 keeps the third target's mark, 0.45 + 0.36 s, inside the 900 ms wait). The presenter and the engines are untouched: `FX_SPECS` (pinned by `spellfx-effects.test.ts`) is unchanged and the new specs live in `SpellFxFresh.ts`. FFX-2's ATB never waits for an effect (research/re-ffx2-timing-measured.md); no new code path waits at all.

### The frame-time guard (Bailey: "Trim particles first")

`FxPerfGuard` is fed one frame interval per drawn frame by `SpellFxLayer.render` (through `FreshWatch`). While an effect of the new set is on screen it keeps a rolling window of 48 frame intervals (trimmed mean, the slowest tenth left out so a hitch is not a reading) and compares it with the display's own calm interval (the median of the frames drawn with no effect up: 8.3 ms on a 120 Hz screen, 16.7 ms on a 60 Hz one): over budget is 1.25 times the calm interval and 1.2 ms more. Over budget for a full window, it thins one level (3/4 of the particles and half the trails; then half the particles and no trails), then asks `CrispRig.setScaleCut` for the 3D scene at 0.9 and at most 0.8 of the rung's supersample (the supersampled rungs only; sticky for the battle, given back at the end, because a render-target resize is a hitch and must not repeat per spell). The thinning is given back one level per 150 calm effect frames. REDUCE FLASHES parameters (`FlashParams`) are untouched and every flash the new effects add goes through `o.wash` / `o.actorCap`.

## Tests and checks

* `npx tsc --noEmit` (run as `node node_modules/typescript/bin/tsc --noEmit -p .`): clean.
* New: `fx-new-effects` (15: budgets at both tiers, marks and holds, skins, weapon variants, REDUCE FLASHES, thinning, determinism), `fx-new-switch-guard` (15: the switch, the guard on synthetic frame sequences, the weapon table, the ids), `fx-new-layer` (12: the layer with the switch off and on, gate, variants, stagger, guard hand-off, chapter name), `fx-new-atlas-flourish` (10: the live atlas is byte-identical, the four new tiles, the item toss and its hook in the item stage). 52 new tests in all.
* Existing and unchanged: `spellfx-effects`, `spellfx-registry`, `spellfx-specials`, `presenter-spellfx`, `item-orb-stage`, `r38-flight-fx`, `r38-skill-travel`, `flash-rules`, `flash-sources`, `ff7-fx`, `ff7-integration`, `ff7-judge-repair`, `look-presets`, `access-off-is-today`, `comfort-presenters`.
* `node tools/orphans.mjs`: none of the new modules is an orphan.

## Evidence (what was run, what it showed)

All in the real game, `?pack=demo`, headless Chromium on the real GPU at 1600 x 900 unless noted, Vite on :5303 started and stopped by PID, under the machine's browser lock; **zero console errors in every run**. Scratch tooling and the raw frames are in `D:/Tools/pyrefly-scratch/2026-10-22/motion/fx/cap/` (`cap-fx2.mjs`, `lib.mjs`, `filmstrip.mjs`, `out3` to `out6`); the review sheets are committed under `docs/screenshots/motion-fx/`.

1. **Review sheets, both demo chapters, today above new** (`ch1-ffx-*-sheet.jpg`, `ch4-ffx2-*-sheet.jpg`: Cure, hits per weapon, the five buffs, Fire/Blizzard/Thunder). The effects are played through `__pyrefly.trigger('spellfx:<fx>:<combatant>[+<striker>]:<t>[:<weapon>]')` held at a fixed local time with the battle standing at its first menu, so every cell has the same scene behind it. (The pale pool on the floor in some cells is the demo look's spell light, which the paused clock holds at its start; it is in today's rows too.) What they show: the painted finish (bristle-edged slash band, hand-drawn dome and rings), the Cure column and its dusk, the per-weapon hits, the five buffs in two skins.
2. **Stepped captures at an exact 1/120 s** (page clock paused, a manual frame queue, frames of 8, 8 and 9 ms; every frame a crop for the first 0.8 s, every fourth after): `ch1-ffx-cure-strip-1of120s.jpg`, `ch1-ffx-hit-strip-1of120s.jpg`, `ch1-ffx-orb-strip-1of120s.jpg`, `ch4-ffx2-cure-strip-1of120s.jpg`, `ch4-ffx2-hit-strip-1of120s.jpg`, `ch4-ffx2-spark-strip-1of120s.jpg` (every frame of the capture is in `cap/out4/`). The sword hit: the blade sweeps in frames 0 to 12, contact at frame 14 (0.117 s: the effect's clock starts at 0.2 s, contact is 0.3 s), the ring and star pop on frames 14 to 18, the sparks leave on eased paths; the orb: the comet trail behind the toss, the burst's two rings and ground ripple on landing. Nothing steps or snaps frame to frame; every position is a function of the effect's clock, which follows real elapsed time (so it is smooth at 120 Hz or more by construction: nothing is tied to a frame count).
3. **Quads per effect at full quality** (the peak over the effect's life, from the draw lists; budget 600 full, 400 phone): Cure FFX 66 (today 109), FFX-2 175 (105); hit 26 to 33 (38); Fire 267 (230); Blizzard 177 (138); Thunder 329 (130); Haste 31, Shell 26, Protect 33, Reflect 18, Dispel 48 (new; the bloom before). In the real fights above the layer peaked at 66 (Cure), 267 (Fire), 175 (FFX-2 Cure) and 329 (Thunder).
4. **The guard, under load** (`perf` job, 2560 x 1440, seven effects re-cast every 1.4 s so 400 to 600 quads were up almost all the time): at normal speed today's effects and the new ones both held the display's 16 ms frames (the page runs at 60 Hz in headless Chromium: the uncapped flags did not take, so **the cost at 120 Hz is not measured here**), the guard measured 14.4 to 15.4 ms against a 20 ms budget and did nothing. With the CPU throttled to a quarter (Chrome DevTools protocol) the guard stepped four times in about 5 s: thinning level 1 (at 0.7 s), level 2 (2.0 s), the 3D scale to 0.9 (3.4 s: the supersample read 1.35, which is the rung's 1.5 times 0.9) and to 0.8 (5.1 s). When the throttle was lifted the thinning came back one level at a time (level 1 after about 3.5 s, 0 after about 6 s) and the scale step stayed (sticky for the battle, by design). The game's own frame governor (`crisp/FrameGovernor.ts`, a 22 ms median over about 2 s) also stepped the sharpness rung down in the same minute (F plus to F to A2); the two are independent, and at the last step the governor's drop to A2 hid the effect of the 0.8 step. The governor never goes back up, so the rung stayed A2 for the rest of that page.
5. **Unit tests**: see "Tests and checks".

## What is [ours]

Everything marked [ours] above and in the reference. The Cure column's numbers (the footage is read to about a quarter of a second), its shard count, the dusk as a spotlight vignette, the buffs' whole design, every weapon's spark shape but the blitzball's flash, the Fire/Blizzard/Thunder additions, the item toss's rings and sparks, the guard's thresholds. None of it is a fact about the original.

## Not done

* Bosses' attacks (Seymour Flux, Mortiorchis, Bahamut: Curse, Impulse, Mega Flare), Overdrives and "each game's own intro", Kimahri's Jump, the Swordplay strike, FFX-2's name slab, chain counters and dress change: step 3 (all [gap] or sourced-but-unbuilt in the reference). A boss's physical blow is the generic painted hit.
* Fire, Blizzard and Thunder additions are drawn but, like today's, only appear when a switched-in Lulu casts them (not in either demo line).
* The 3D spell layers over option B (`fx/c/SpellLayers.ts`: FireColumns, IceBurst, Lightning) are unchanged and are not given the finish (they are in the 3D field).
* No new look for FFX-2's White Mage spells beyond the neutral version; no capture of the Steam copies (the reference's open question 1).
* The demo look's spell light (`look/relight/RelightConfig.ts POINT_KINDS`) has no rows for the five buffs; they take the bloom's warm white as they always did.
* REDUCE MOTION and LOW EFFECTS keep today's bloom (the existing `resolveFxQuality` rule); under them the new effects do not draw, and the item toss draws no gesture at all (`BattlePresenterItem.ts`).
* NOW.md, ACTIONS.md, DECISIONS.md, CHANGELOG.md and CONTRACT-CHANGES.md are not touched (hot files shared by every lane); the driver adds the rows. For the CONTRACT-CHANGES reader: `VfxPort.land`'s options gain an optional `item?: boolean` (`BattlePresenterPorts.ts`, additive; not one of the listed contract files).

## Open questions (for the driver)

1. Is the painted finish what Bailey meant by "sits inside the paintings"? It is a shader (no file, so rule 8 and the 2026-10-18 lift do not matter); a hand-painted brush-sprite family under `public/art/fx/` would be the next rung.
2. Replacing the approved option-B Cure (motes) with the retail column in Chapter I needs Bailey's yes (rule 10); it ships only with `?fx=new` / `?pack=demo` until then.
3. One switch for the whole set, or one per piece (`?fx=cure,hit,...`)? Bailey picks Thursday; splitting is a table lookup in `SpellFxFresh.ts`.
4. The five buffs and the weapon sparks are [ours] designs: rule 9 says show Bailey options first; this branch is the first round (captures below), not a decision.
5. The guard's scale step needs a supersampled rung: on the A2 rung or a phone there is nothing to lower and it only thins.
6. Steam capture of the gaps (reference open question 1) would let the buffs and Fire/Blizzard/Thunder become faithful instead of neutral.

## Evidence and downloads

No download in step 2. Scratch tooling (`cap/`, not committed): `cap-fx2.mjs` (sheets, stepped captures, perf), `lib.mjs`, logs. Captures are under `D:/Tools/pyrefly-scratch/2026-10-22/motion/fx/cap/out*/`.
