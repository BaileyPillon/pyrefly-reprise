# motion-fx: spell, hit and item effects for the demo chapters (lane fx, branch `motion-fx`)

Bailey, 2026-10-22 00:10 to 01:30 EDT: spell effects "Faithful shape, painted finish": each effect's shape, colour and timing follow its own game (FFX in Chapter I, FFX-2 in Chapter IV), drawn with a brushy painted finish; reference "Official videos"; scope "Demo chapters first" (Chapter I Seymour Flux and Chapter IV Bahamut only, only when switched on); perf guard "Trim particles first"; motion SFX and hit-stop belong to the other lanes.
Base: `origin/main` 3e520971e (release 61 + records). Tree `D:/pyrefly-rig-auron2`, dev port 5303. Notes folder (scratch, not in the repo): `D:/Tools/pyrefly-scratch/2026-10-22/motion/fx/`.

## State

| Step | What | State |
|---|---|---|
| 1 of 3 | Reference notes: shape, motion, colour, timing, layering and caster/target for every effect in scope, per game, from research and official videos | **DONE** (`docs/handoff/motion-fx-reference.md`; no code) |
| 2 of 3 | The painted finish, the switch, the guard, and the party effects: Cure/Cura, Haste/Shell/Protect/Reflect/Dispel, hit sparks per weapon, items, Fire/Blizzard/Thunder | **DONE, default OFF** (this note; code, 4 test files, captures) |
| 3 of 3 | Bosses' attacks, Overdrives and their openings, the FFX-2 name slab and dress change, Jump, Darkness, and the before-and-after clips | **DONE, default OFF** (the section "Step 3" below; code, 5 test files with 82 tests, 21 moves recorded today and new, frame times at 1440p) |
| review | The adversarial review (2 majors, 7 minors, no critical): numeral hold, FFX-2 pace, and the minors | **FIXED, default OFF** (the section "After the review" at the end; 23 new tests, 90 related test files with 1143 tests pass) |

## Switch (read this first)

* **Off by default.** With no address key, in every unit test and in every chapter but two, nothing here runs: `FxSwitch.fxNewOn()` is false and every hook falls through to today's code.
* **On** when the address carries `?fx=new` or the shared `?pack=demo` (the Thursday test build), **and** the running chapter is Chapter I (`seymour-flux`, FFX) or Chapter IV (`ffx2-bahamut`, FFX-2). `?fx=today` beats the pack (for A/B). `?fx=` is also the eye-candy key (`fx/EyeCandy.ts`); its parser skips the two new words, and `?fx=new,b` feeds both.
* Read once per page. `window.__pyrefly.fxNew('new' | 'today')` sets it for what starts from now on (a running copy keeps the look it started with); `fxNewOn()`, `fxNewChapter(id)` and `fxNewGuard(dtMs, busy)` are for the recorder.
* The chapter gate is named by the spell layer itself (`SpellFxLayerOptions.chapterId`, passed by `battleSpellFx` from the one changed line in `BattleScreen`), set while the layer lives and cleared only by the layer that set it.
* **Flipping the default (Friday):** change `fxModeFromSearch`'s fallback in `src/engine/spellfx/FxSwitch.ts` (one line) for the set Bailey approves. Step 2's effects are one set; **step 3's pieces turn off one by one with `?fxoff=bosses,openings,banner,slab,status`** (see "The switches" in the Step 3 section).

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

Every new mark is today's or earlier (Cure 0.45 against 0.5, hit 0.3 as today, the buffs 0.45 against today's bloom's none) and every hold cap is today's 900 ms (`SPELL_HOLD_CAP_MS`). A party-wide FFX Cure staggers its columns by 0.18 s a target (the footage shows about 1 s; 0.18 keeps the third target's mark, 0.45 + 0.36 s, inside the 900 ms wait). The presenter and the engines are untouched: `FX_SPECS` (pinned by `spellfx-effects.test.ts`) is unchanged and the new specs live in `SpellFxFresh.ts`. ~~FFX-2's ATB never waits for an effect; no new code path waits at all.~~ **Wrong for this port** (the review's M2): the retail game never waits for an effect (research/re-ffx2-timing-measured.md), but this presenter does not tick the ATB while a burst plays (`BattlePresenterActive.runActivePump`, `battle/ffx2/engine.ts`), so every millisecond the presenter waits is paused ATB. See "After the review".

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

* Bosses' attacks, Overdrives and their openings, Kimahri's Jump, FFX-2's name slab and dress change: BUILT in step 3 (see "Step 3" below, with what step 3 did not do). A boss's physical blow is still the generic painted hit.
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
6. **Review class.** `node tools/critic-plan.mjs --paths <the changed files>` says DEEP (after the deploy, the build owes it), and names two additive lines as the only reason: `BattlePresenterPorts.ts` (the optional `item` flag on `VfxPort.land`) and `BattlePresenterSpellFx.ts` (passing it). If a deep review owed is a problem for the Thursday build, drop those two lines: the only loss is the small item form of the Cure column (a Potion would land the full column).
7. Steam capture of the gaps (reference open question 1) would let the buffs and Fire/Blizzard/Thunder become faithful instead of neutral.

## Step 3: the bosses' attacks, the Overdrive's opening, the dress change, and the clips (lane fx, branch `motion-fx`)

Bailey, 2026-10-22 00:10 to 01:30 EDT: spell effects "PLUS the bosses' attacks, items, Overdrives (with 'Each game's own intro')"; "Demo chapters first"; perf guard "Trim particles first"; hit-stop "Short, big hits only", camera punch on big hits and Overdrives, rumble "Light, big moments only" (those hooks are the other lanes').
Same switch as step 2 (`?fx=new` or `?pack=demo`, demo chapters only, default OFF, `?fx=today` beats the pack). **New in step 3: each piece turns off alone with `?fxoff=`** (below), because Bailey picks on Thursday which pieces stay and the default of an approved piece is flipped on Friday.

### What was built (game case per piece, AGENTS.md rule 14; the basis of each)

| Piece | Game case | Basis | What it draws | Files |
|---|---|---|---|---|
| **Lance of Atrophy** | FFX only (Seymour Flux) | [ours] shape; one random character, one hit, Zombie: sourced (`research/ffx-seymour-flux.md`, `seymour-flux-abilities.ts`) | a long violet lance flies in from the attacker's side (a solid dark body, an additive core), strikes with a sickly flash and ring; grey-green motes sink off the body; a dim vignette round the target. Mark 0.32 s | `effects-painted-flux.ts` |
| **Full-Life** | FFX only (Mortiorchis) | [ours]; "healing turned lethal" (notes line 1138), the Cure column (sourced) inverted | a pale gold column falls instead of rising; at the mark it goes dark and black motes climb off the body. Mark 0.45 s | `effects-painted-spirit.ts` |
| **Cross Cleave** | FFX only | [ours]; from the name; whole party, one hit each: sourced | two long cuts make a cross, a flash at the crossing, a shock line along the floor, sparks; staggered 0.07 s along the party. Mark 0.34 s | `effects-painted-flux.ts` |
| **Total Annihilation** | FFX only | [ours] shape; the charge ladder and FIVE separate hits on the whole party: sourced | a dark sphere gathers, then five strikes fall one after another, each wider than the last, the fifth a pillar of light; five marks 0.19 s apart (the presenter's per-hit beat), so each numeral lands on its own strike | `effects-painted-flux.ts` |
| **Flare** | FFX only | [ours]; Self, or a party member through Reflect: sourced | a solid sun swells, bursts into twelve rays, a gold ring, embers. Mark 0.5 s | `effects-painted-flux.ts` |
| **Banish**, **Slowga**, **Mortibsorption** | FFX only | [ours]; Eject / Slow on the party / "visible drain into Seymour" (`research/ffx-vs-ffx2-presentation.md` line 147): sourced rules | a gold column, climbing rings, pyreflies / a blue-grey ring closing against turning arcs, drifting sand / streams of motes from the mount up into the rider (a group effect drawn from Mortiorchis) | `effects-painted-spirit.ts` |
| **Kimahri's Jump** | FFX only | the landing burst SOURCED in part (official footage, V3 54.5 s: a hard white-yellow burst, a white ground ring, gold vertical streaks); the descent streak, debris and dust [ours] | mark 0.26 s (today's slash 0.3) | `effects-painted-od.ts` |
| **Mighty Guard** | FFX only | [ours] | Protect's dome, once, on the party | `BossFx.ts` (table) |
| **Curse** | FFX-2 only (Bahamut) | the girl's model DARKENS (`research/ffx2-bahamut.md` line 292, interpretive) and the dark family's black spheres and violet bolts (official FFX-2 footage, V4 33.0 s) sourced; the shape [ours] | black spheres rise out of the floor, thin violet bolts, a violet fog, a heavy vignette; **the girl is drawn at 0.78 brightness until the status ends** (`curseDim`) | `effects-painted-bahamut.ts`, `BattlePresenterBossFx.ts` |
| **Impulse** | FFX-2 only | [ours]; the aura before an enemy's magic (`research/ffx2-combat-core.md` line 3243, single source) | a violet aura round Bahamut, then a wavefront from his chest across the party, a ring, a flash and sparks on each girl (a group effect). Mark 0.8 s | same |
| **Darkness** (Rikku, Dark Knight) | FFX-2 only | **SOURCED shape**: Square Enix JP's FFX-2 battle short (V4 33.0 to 35.5 s, notes 3.1): sword glow, a violet bolt, a flat pink-white ring at her feet, about ten black spheres out of the floor, a violet-pink fog band, the arena darkens for about half a second with a red-orange line along the ground, a second bolt, pink sparkles at the mark. The footage's 1.5 s to the numeral is run in **0.82 s** [ours: a pace choice] | the most-seen Chapter IV ability (Rikku casts it every turn) | same |
| **The charge (gather)** | both games, each its own skin | the escalating charge is the repo's own art note (`research/ffx2-bahamut.md` line 964); the ladder is sourced (`research/ffx-seymour-flux.md`) | motes pulled into the chest, a core that swells and beats faster with the level 1 to 5 (FFX-2 counts 5, 4, 3, 2, 1: level = 6 - n; FFX's ladder is level 2 then 4), a ring closing, a pulse on the floor | same |
| **The Overdrive's opening** | FFX only (Chapter I) | the banner and the aura of Tidus and Auron SOURCED (official footage V1, notes 2.7): a thin dark-violet banner across the very top with the move's name and an orange OVERDRIVE tab, no letterbox; Tidus's orange-gold flame wisps round legs and waist brightening over about 1.5 s, white-cyan wisps along the blade, a thin jagged line at the end; Auron's blue ground ring with yellow-green wisps. Anyone else [gap]: a neutral cool aura. The 0.35 s calm beat is [ours] (the footage shows about 0.5 s) | with `?pack=demo` an Overdrive opens: banner (no letterbox) + the aura building under it + the calm beat + the strike | `od-retail.css`, `MomentOverlay.ts`, `effects-painted-od.ts`, `BattlePresenterBossFx.odOpening` |
| **FFX-2's opening: the name slab** | FFX-2 only (Chapter IV) | SOURCED (V4, notes 3.2): the move's name in a small dark slab with a gold border above the acting girl's head, following her while the effect plays. FFX-2 has no Overdrive, so this is its "intro" | the paper banner at the top right (the approved tile) is left as it is: whether the slab replaces it is a question | `ui/ffx2/NameSlab.ts`, `name-slab.css`, a line each in `FFX2BattleHud.ts` |
| **The dress change's painted burst** | FFX-2 only | the colours per girl SOURCED (V4 10 to 21 s, notes 3.2: Yuna white wisps then a magenta-pink ribbon; Paine violet arcs, a white column, golden shafts, a starburst; Rikku a green-teal ring, a lime-yellow burst, purple five-point stars); the retail change lasts about 3 s, this one keeps the HUD flourish's 0.8 s budget [ours] | under the HUD's own column, motes and ring (`SpherechangeFlourish.ts`, unchanged) | `effects-painted-od.ts` |
| **Moves with no damage event now reach the layer** | both | n/a (plumbing) | Haste, Shell, Protect, Reflect, Dispel (step 2), Banish, Slowga, Curse: the engine emits NO `damage` event for a `formula: 'none'` row (`battle/ffx/hit-apply.ts`), so before this hook the spell layer was never asked to draw them and step 2's five buffs drew only through the debug trigger. A status event waits 250 ms for the effect to be seen starting (there is no numeral to hold) and the effect goes on drawing | `BattlePresenterBossFx.statusFxLanding` |

**Mega Flare** (FFX-2) keeps its D-233 special exactly (shape, marks, the id `megaflare`), with step 2's painted finish; see "What to merge with r62-extra".

### The wiring, in one place

* **Ids and tables** `spellfx/BossFx.ts` (per game; FFX-2's rows under both ids the engine can use, `bahamut-curse` and `x2-bahamut-curse`), **the clocks** `SpellFxFreshBoss.ts`, **the draws** `effects-painted-{flux,spirit,bahamut,od}.ts`. A new effect that is not an ability (the charge, the aura, the dress change) is asked for by a pseudo id (`fx:gather`, `fx:odaura`, `fx:dress`).
* **`LandOpts`** (and `VfxPort.land`'s options in `BattlePresenterPorts.ts`; not a listed contract file) gains four optional fields: `level`, `variant`, `status` (the call comes from a status event: only an effect no damage event starts is drawn) and `deco` (decoration: started, never waited for, covers no blow, throws no spell light).
* **The presenter** (`BattlePresenterBossFx.ts`; each call is one line in `BattlePresenterArrivals`, `Events`, `Beats` and `SpellFx`): `statusFxLanding` (status-add and a dispelled status-remove), `curseDim`, `chargeFx`, `odOpening`, `dressFx`, `bigBlow`.
* **The spell light** (the demo look's coloured point light on the figures near an effect) lit every unknown id as the warm white bloom: a white pool on the floor. Each new id is lit as the existing kind nearest to it (`BossFx.LIGHT_KIND`; the dark attacks as the short `hit` flash), and decoration asks for none. `look/relight/RelightConfig.ts` is not touched (r62-extra edits it).
* **The wait.** A damaging move holds its numeral for its mark (0.26 to 1.02 s; every hold cap is the 900 ms every spell keeps); a status move waits 250 ms in FFX and **0 ms in FFX-2** (after the review: the ATB does not tick while the presenter plays). A move that drew the bare bloom waited for nothing before, so some of them are now longer: see the pace table, and "After the review" for FFX-2's pre-roll.

### The switches

* `?fx=new` or `?pack=demo` turns on step 2 and step 3 together, in the two demo chapters only; `?fx=today` beats the pack.
* **`?fxoff=` turns one piece off** (a comma list): `bosses` (the boss attacks, Jump, Darkness, Curse's darkening), `openings` (the charge, the aura and calm beat, the dress burst), `banner` (the retail Overdrive banner and the missing letterbox), `slab` (FFX-2's name slab), `status` (the hook that lets a move with no damage event draw). Step 2's effects are one set.
* `window.__pyrefly.fxPiece(piece, on?)` for the recorder; `fxPlay(events)` plays a list of battle events through the running battle's real presenter (how the clips were made); `fxHooksProbe(true)` registers recording hooks with the adapter and returns the log array.
* **Flipping the default (Friday):** `FxSwitch.fxModeFromSearch`'s fallback turns the whole set on; a piece Bailey rejects becomes a default entry in `fxOffFromSearch`'s list.

### Overdrive "each game's own intro" and the other lanes' hooks

* **FFX (Chapter I)**: the retail opening of V1: the banner, no bars, the ready aura, then (sourced, left to the existing flow) the input panel and the strike. **Not rebuilt** (rule 9, a screen needs a mockup): the retail input band with violet LCD digits and the gold GOOD word (the existing `OverdriveOverlay` is kept), and the hard cut to a close low shot (the existing held push-in stays; the camera is another lane's).
* **FFX-2 (Chapter IV)**: no Overdrive exists; its "intro" is the move's name slab over the girl and, for a dress change, the painted burst; Bahamut's Mega Flare is introduced by the countdown's escalating charge (5, 4, 3, 2, 1).
* **The adapter** (`spellfx/FxMotionAdapter.ts`): this lane does not import the other lanes' code. Each big moment calls `fxBeat(kind, actorId, {calm})`, which calls whatever has been registered with `setFxMotionHooks` and does NOTHING while the registry is empty. At integration, register once:
  ```ts
  setFxMotionHooks({
    anticipate: (id, ms) => core.anticipate(id, ms),   // motion-core: the wind-up while the aura builds (od-open)
    smear:      (id) => core.smear(id),                // motion-core: cut the ready pose to the strike pose
    hitStop:    (frames) => feel.hitStopShort(frames), // motion-feel: 3 to 4 frames (od-strike, boss-big)
    punch:      (amount) => feel.punch(amount),        // motion-feel: 0.02 to 0.03 of the view
    rumble:     (strength, ms) => feel.rumble(strength, ms),
  });
  ```
  The four beats and their numbers are `FX_BEATS` (data: Bailey's picks). `od-open` (the opening: anticipate, smear, a light rumble), `od-strike` (an Overdrive's first blow: hit-stop 4, punch 0.025, rumble), `boss-big` (Total Annihilation's last hit, Cross Cleave, Mega Flare: hit-stop 4, punch 0.03, rumble, once per action), `boss-charge` (a charge's last step: a light rumble). REDUCE MOTION calls only `anticipate` and `smear`.

### What to merge with r62-extra (the Mega Flare's screen-filling light, `D:/pyrefly-pilgrim-proto`)

`git -C D:/pyrefly-pilgrim-proto log --oneline origin/main..HEAD` shows r62-extra already changed Mega Flare (d1e811c0f: `look/flare/` floods and whites the frame, `engine/MegaFlareImpact.ts` shakes the camera 0.32 for 1,100 ms, the relight kind `megaflare` is the cold white-blue) and the living cathedral. This lane did NOT duplicate any of it: it draws no flood, no white-out and no shake for Mega Flare, keeps the `megaflare` id, its mark (1.45 s) and its `notifyLand` call (what r62-extra's flare listens for), and only adds step 2's painted finish to its quads and, before it, the countdown's gather. **Merge notes**: (1) the two branches touch the same two shared files, `BattlePresenterPorts.ts` (r62-extra +3 lines, this lane +7 over step 2 and 3 together: take both) and `BattlePresenterBeats.ts` (r62-extra +4/-1, this lane +2 lines and one replaced line in `actionStart`, the Overdrive's `await`: take both and re-check the Overdrive branch); (2) the Mega Flare's hit-stop and rumble belong to `boss-big` here (`mega-flare` and `x2-bahamut-mega-flare` are in `BIG_BLOWS`); r62-extra's camera shake and the feel lane's rumble can both fire: decide in the integration pass whether the shake or the new hooks lead; (3) the painted finish makes Mega Flare's quads brush-edged: look at it once beside r62-extra's flood.

### Tests and checks (step 3)

* `node node_modules/typescript/bin/tsc --noEmit -p .`: clean. `node tools/orphans.mjs`: no module of this lane is an orphan (the 24 it lists are older).
* New, 82 tests in 5 files: `fx-boss-effects` (30: every new effect at both tiers, finite, painted, inside the 600/400 budget, the thinning, REDUCE FLASHES, determinism, direction, the charge's levels, the aura's and the dress's skins, Darkness's spheres, the five marks of Total Annihilation), `fx-boss-layer` (13: the tables per game, off is off, the gate, status landing, group effects, decoration, the low tier), `fx-boss-presenter` (13: the real presenter against the fake stage: status landing and its cap, Dispel, the charge ladder, the Overdrive's opening, calm beat and hooks, REDUCE MOTION, the dress change, Curse's darkening, the big-blow hooks once per action, the spell light's kinds), `fx-boss-adapter-dom` (18: every id against the game data (rule 6), the adapter and Bailey's numbers, the name slab's timing and DOM, the CSS), `fx-boss-pieces` (8: `?fxoff=` per piece). `fx-new-effects` pins the 25 ids.
* Regression, 79 existing files (presenter, moments, HUDs, spherechange, comfort, battle screen, flash rules, SKILL TRAVEL, FF7 effects, look presets), 1,051 tests: all green. **The full suite was NOT run**: the machine had 5.6 GB of RAM free (the brief asks for more than 12 GB), and D: had 9.8 GB free (below the 12 GB the brief asks to keep; this lane's scratch is about 0.4 GB).

### Evidence (what was run, what it showed)

Everything in the real game, headless Chromium on the real GPU, Vite on :5303 started and stopped by PID under the machine's browser lock, **zero console errors in every run**. Scratch tooling (not committed) and the raw outputs are under `D:/Tools/pyrefly-scratch/2026-10-22/motion/fx/`.

1. **Clips, before and after, every effect of both demo chapters** (`clips/`, listed with their basis in `CLIPS.md`; 21 moves, today and new, mp4 at 60 fps, 1280 x 720). The real presenter plays the engine's own events (`__pyrefly.fxPlay`), so each clip shows the whole presentation: banner, slab, numerals, camera, HUD. The game runs at an exact 120 Hz (the fake clock steps 8, 8 and 9 ms; one game frame each; every second frame captured). In Chapter IV the Skill sub-menu is held open (Wait Mode stops the ATB only for a sub-menu) so Bahamut does not act in the middle of a clip; the engine's event log did not grow in any Chapter IV clip. Committed review images, today above new (8 frames of each clip): `docs/screenshots/motion-fx/step3-*-today-above-new.jpg`.
2. **Contact sheets of each effect held at fixed times** on the frozen first-menu scene (the first look, which found the problems below): `cap/out8`.
3. **What the first look found, and what it changed**: against Chapter I's bright room the additive whites washed the frame out (a Jump burst filled a third of the screen; the Total Annihilation wash whitened everything); the demo look's spell light lit every unknown effect id as the warm white bloom, which pooled on the floor; a boss is two or three times a girl's height, so sizes drawn from it were huge. Changes: sizes clamp to `SC_MAX` 1.5, flash caps and washes down (the Total Annihilation wash 0.4 to 0.15), solids under the light (the lance's body, the sun's disc), the dim vignette sized to be seen (1,700 px, 0.5 to 0.8) and each new id lit as the nearest existing kind.
4. **Frame times at 2560 x 1440 with `?pack=demo`** (`cap/out9`, `cap-fx5.mjs`): the real presenter plays the heaviest moves in real time, today's look and the new one in turn. **Headless Chromium holds the display at 60 Hz, so 120 Hz itself is not measured; what is measured is the cost of the effects.**

| Chapter, phase | frames | median / worst p95 / max frame (ms) | peak quads | layer CPU per busy frame, median / max (ms) |
|---|---|---|---|---|
| I, today, 1x | 1,786 | 16.7 / 33.3 / 133.3 | 289 | 0.30 / 0.50 |
| I, new, 1x | 1,846 | 16.7 / 16.8 / 33.4 | 338 | 0.20 / 0.50 |
| I, new, CPU 4x slower | 1,668 | 16.7 / 50.1 / 66.7 | 267 | 1.40 / 3.00 (the guard thinned to level 2) |
| I, today, CPU 4x slower | 1,360 | 16.7 / 50.1 / 50.1 | 286 | 1.40 / 1.70 |
| IV, today, 1x | 1,800 | 16.7 / 33.4 / 66.7 | 132 | 0.20 / 0.30 |
| IV, new, 1x | 1,895 | 16.7 / 16.8 / 16.8 | 116 | 0.20 / 0.50 |
| IV, new, CPU 4x slower | 946 | 33.3 / 100.0 / 100.0 | 61 | 1.20 / 2.80 (guard level 2, scale 0.8; the game's own governor stepped to A2) |
| IV, today, CPU 4x slower | 671 | 33.3 / 133.4 / 133.4 | 114 | 1.20 / 1.50 |

   At normal speed the new moves held the display's 16.7 ms frames at least as well as today's (the hitches in the today rows are today's: the presenter's own work and the demo look's lights). The layer's own CPU is 0.2 ms at the median and 0.5 ms at worst per busy frame, **about 6 percent of a 120 Hz frame at worst**. Under a 4x CPU slowdown both looks fall to the same frame rate, and the guard (step 2) thinned the new one to level 2 and, in Chapter IV, asked the 3D scene for 0.8 (sticky for the battle, by design). Peak quads of the new moves: 338 in Chapter I (budget 600), 116 in Chapter IV.

**Pace: the presenter's time from the first event to the last (ms at normal speed), today and with the new effects** (`CLIPS.md` has the same with the files). The dress changes are the presenter's own time only (the HUD's flourish runs beside it).

| Chapter | Move | Today | New | Difference |
|---|---|---|---|---|
| I (FFX) | Lance of Atrophy | 2408 | 2675 | +267 |
| I (FFX) | Full-Life | 2183 | 2117 | -66 |
| I (FFX) | Cross Cleave | 2008 | 2058 | +50 |
| I (FFX) | Total Annihilation (with its two charge beats) | 7725 | 8908 | +1183 |
| I (FFX) | Flare | 1750 | 2175 | +425 |
| I (FFX) | Banish | 1458 | 1758 | +300 |
| I (FFX) | Slowga | 1992 | 2283 | +291 |
| I (FFX) | Mortibsorption | 1550 | 2292 | +742 |
| I (FFX) | Haste, Shell, Protect, Reflect (four casts) | 5850 | 7050 | +1200 |
| I (FFX) | Dispel | 1508 | 1833 | +325 |
| I (FFX) | Overdrive: Tidus, Spiral Cut | 7017 | 6500 | -517 |
| I (FFX) | Overdrive: Kimahri, Jump | 5425 | 5100 | -325 |
| I (FFX) | Overdrive: Kimahri, Mighty Guard | 6450 | 6475 | +25 |
| IV (FFX-2) | Curse | 1333 | 1608 | +275 |
| IV (FFX-2) | Attack (step 2's hit) | 917 | 917 | +0 |
| IV (FFX-2) | Impulse | 2150 | 3033 | +883 |
| IV (FFX-2) | Countdown 5 to 1 and Mega Flare | 9008 | 9008 | +0 |
| IV (FFX-2) | Darkness | 1558 | 2350 | +792 |
| IV (FFX-2) | Dress change (Yuna) | 233 | 233 | +0 |
| IV (FFX-2) | Dress change (Rikku) | 242 | 242 | +0 |
| IV (FFX-2) | Dress change (Paine) | 233 | 233 | +0 |

The Overdrives are as long as before or shorter (the retail opening has no letterbox to slide, and the calm beat is 0.35 s); the moves that drew the bare bloom now wait for their own effect (at most 0.5 s for a status move: `STATUS_WAIT_MS` 250 ms; a damaging move waits for its mark). Total Annihilation's difference is nearly all the engine's own per-hit numeral beats lining up behind five marks.


## What is [ours] and what is sourced (step 3)

* **Sourced from an official upload**: Darkness (V4 33.0 to 35.5 s); the retail Overdrive banner's place, colour and label and no letterbox (V1); Tidus's and Auron's ready aura (V1); Jump's landing burst, ring and gold streaks (V3 54.5 s); each girl's dress-change colours (V4 10 to 21 s); FFX-2's name slab above the girl's head (V4). Read in the step-1 notes (`docs/handoff/motion-fx-reference.md`); every frame was read headlessly in memory and none is kept.
* **Sourced from the research**: who each boss move hits and how often (Lance 1, Cross Cleave 1 each, Total Annihilation 5 each, Flare Self, Banish Eject, Slowga the party, Mortibsorption into Seymour, Curse one girl, Impulse three, the countdown 5 to 1), the Total Annihilation charge ladder, Curse darkens the model, the aura before an enemy's magic (single source), the escalating charge (the repo's art note, interpretive).
* **[ours], and not a fact about the original**: every shape of every boss attack except Darkness; every number (sizes, counts, marks, the 0.82 s Darkness, the 0.35 s calm beat, the 0.78 curse brightness); Kimahri's aura (neutral); Mighty Guard's dome; the descent streak, debris and dust of Jump; the pace; every colour not named above; the guard's thresholds (step 2).

## Not done (step 3), and why

* **The retail Overdrive input band** (the translucent violet panel with the orange tab, the violet LCD digits, the gold GOOD word, the bar or the dropping glyphs; notes 2.7 points 3 and 4) and **the hard cut to a close low shot**: a new screen needs a mockup first (AGENTS.md rule 9) and the camera is another lane's. The existing input minigames and the held push-in are untouched.
* **The Swordplay strike's debris, smoke and light shafts** (notes 2.7 point 6) and **Spiral Cut itself** stay D-233's approved special; a new Special look needs Bailey's yes.
* **Seymour Flux's dispersal into pyreflies and Mortiorchis's re-form** (KO and the Mortibsorption's re-form) belong to the KO presentation; not touched.
* **FFX-2's other abilities** (the White Mage's spells, the Warrior's Breaks, Sentinel, the Dark Knight's other moves, the Gunner) keep step 2's neutral versions: the footage shows only Darkness. The FFX-2 chain counters (`ChainCounter.ts` already draws section 4.6's) were not changed.
* **A dress change as long as the original** (about 3 s, 4 to 5 with the polyhedron): kept to the HUD's 0.8 s budget; a longer change is a pace decision (the original is in Wait Mode for it).
* **Items on foes, Aeons (Yuna's Grand Summon), Yojimbo**: out of the demo line.
* **The 3D spell layers over option B** (`fx/c/SpellLayers.ts`) are not given the painted finish.
* The Chapter IV clips hold the Skill sub-menu open, so it shows at the right of those frames.

## Open questions (step 3, for the driver)

1. **Which pieces stay?** Five can be tried one at a time with `?fxoff=` (the boss effects, the openings, the banner, the slab, the status hook). The banner and the slab replace approved chrome (the Ink and Gold Overdrive slab with its letterbox; FFX-2's paper banner stays beside the slab): Bailey's yes is needed (rule 10).
2. **FFX-2: should the name slab REPLACE the paper banner?** Both name the move today; the retail game has only the slab.
3. **Pace.** A move that drew the bare bloom waited for nothing; the new ones wait for their own mark (at most 900 ms; Total Annihilation's five marks; Darkness 0.82 s every Rikku turn). The table of before and after is in `CLIPS.md`; FFX-2's ATB does not wait for effects. If it is too slow, shorten the marks (one number each in `SpellFxFreshBoss.ts`). **After the review:** FFX-2's long moves start with the cast and its status moves wait 0 ms, so only Impulse (+420 ms a cast) still adds time there; the table in "After the review" has the new figures.
4. **The Steam capture of the gaps** (notes open question 1): Seymour Flux's moves, Bahamut's and Mega Flare, the Warrior's Breaks, the White Mage's spells would make the [ours] shapes faithful; the recommendation of step 1 stands (accept [ours] for Thursday, capture for Friday if Bailey wants them faithful).
5. **Curse's darkening** is `setBrightness(0.78)` through the port; the Departures and Recall code also set brightness and may reset it while a girl yields or is held. If Bailey likes it, a tint channel of its own is the next step.
6. **The adapter at integration** (`setFxMotionHooks`): who registers it, and whether r62-extra's Mega Flare shake or the feel lane's rumble leads.
7. **REDUCE MOTION and LOW EFFECTS** draw none of the new effects (the existing quality rule), the aura and the charge with them; the banner and the slab still show (they are chrome, not motion), without sliding under `prefers-reduced-motion`.

## Review class and merge notes (step 3)

`node tools/critic-plan.mjs --paths <the changed files>` says **DEEP, after the deploy** (the build owes it): the reason is the shared systems touched, the battle presenter (`BattlePresenterArrivals`, `Beats`, `Events`, `Ports`, `SpellFx`, one to five lines each) and global layout (`MomentOverlay`, a CSS file). If a deep review owed is a problem for the Thursday build, the presenter hooks can be dropped one line at a time: without them the new effects still draw for every move with a damage event, and only the status moves, the charge, the aura, the dress burst and the hooks to the other lanes are lost.
Files shared with other lanes: `BattlePresenterBeats.ts` and `BattlePresenterPorts.ts` (r62-extra edits both; see above), `BattlePresenterEvents.ts`, `BattlePresenterArrivals.ts` and `BattlePresenterSpellFx.ts` (the other lanes' hooks go through the presenter too: re-read each after merging), `FFX2BattleHud.ts` (four lines), `MomentOverlay.ts`. `NOW.md`, `ACTIONS.md`, `DECISIONS.md`, `CHANGELOG.md` and `CONTRACT-CHANGES.md` are not touched (hot files; the driver adds the rows). For the CONTRACT-CHANGES reader: `VfxPort.land`'s options gain four optional fields (`level`, `variant`, `status`, `deco`; `BattlePresenterPorts.ts`, not a listed contract file).

## After the review (lane fx; the adversarial review of 2026-10-22, 06:00 to 06:50 EDT)

The review found **no critical defect** and proved that with the switch off the game is today's game (150 spell-layer scenarios drew identical items against an extract of `origin/main`, 12 scripted fights through the real presenter gave identical traces, every hook is gated by `fxNewOn()` or `fxPieceOn()`). It confirmed **two majors and seven minors**. Everything not marked "not changed" or "to Bailey" below is fixed, in commits `c8c051ecc`, `d9b1cdafe`, `b88bff4b9` (code and tests) and the note's own commits; every fix has a test in `tests/unit/fx-review-fixes.test.ts` (23 tests) that fails on the pre-fix tree (run against an extract of the previous head: 19 of the first 22 fail there; the other three pin what must not change). The review's write-up and probes are in `D:/Tools/pyrefly-scratch/2026-10-22/motion/fx/review/`.

Game case (rule 14) for the fixes: the numeral hold (M1) is **both games** (it holds Chapter I's FFX moves and Chapter IV's FFX-2 moves, each by its own table); the pre-roll and the status wait of 0 ms (M2) are **FFX-2 only**, because only this port's FFX-2 presenter pauses an ATB clock (FFX is turn-based, so a wait there costs no game time); everything else is shared plumbing or one game as the finding said. Everything is still **default OFF** behind `?fx=new` / `?pack=demo`, demo chapters only.

| # | Finding | Verdict | What changed |
|---|---|---|---|
| **M1** | The new boss effects refuse the SKILL TRAVEL shot (`canTravelFx`), which also dropped the numeral hold: the number and the HP row came 0.3 to 1.0 s before the strike, or before the effect started (Chapter I always; Chapter IV when no command menu is open) | **Confirmed and fixed** | `BattlePresenterBossFx.freshBlowHeld`, asked first by `SkillTravel.blowHeld` (3 lines): a blow of a new-table boss move that has a striker is held until the effect's own clock reaches its mark, independent of any shot and of an open FFX-2 menu. A blow with no striker (Darkness's HP cost on Rikku) still shows at once. |
| **M2** | In this port the ATB does not tick while the presenter plays, so the added waits (Darkness +792 ms every Rikku turn, Impulse +883, Curse +275, every buff +250) are paused ATB; the note's "FFX-2's ATB never waits for an effect" is true of retail, not of this presenter | **Confirmed and fixed (mostly); the rest is the faithful lead-in** | (a) `prerollFx`: Curse, Impulse and Darkness start their effect at the action start (`LandOpts.deco` with the action's number; `SpellFxLayer.decorate` now starts group effects too), so the cast pose's 380 ms runs inside the lead-in and the blows find the copy by the action. (b) `STATUS_WAIT_FFX2_MS = 0`: a status move waits for nothing in FFX-2 (FFX keeps 250 ms). (c) `costOfFreshMove`: Darkness's HP cost on Rikku no longer waits for the effect (found in the browser re-check, below). The real engine's Impulse names no target when it starts, so the pre-roll takes the other team's figures on the field. Table below. |
| re-check | The browser re-check of the fixes found two things the review did not: Darkness's foe numeral came 240 ms after the strike (effect clock 1.065 against the mark 0.82) because the HP cost on Rikku waited for the whole effect and the foe's blow queued behind it, which also made the cast 240 ms longer; and the cost blow on Rikku pulled the effect's centre toward her (a group effect took any target that landed into its group, the caster too) | **Found and fixed** | `BattlePresenterBossFx.costOfFreshMove` (one line in `awaitSpellLanding`): the cost blow does not wait for the effect, the foe's blow waits for the mark alone. `SpellFxLayer.landGroup`: a blow on the group's own caster does not join the group. Browser, 60 and 144 Hz: the foe's numeral at effect 0.823 and 0.821 (mark 0.82); the cast takes exactly today's time. |
| m1 | The item toss's comet trail was 0.233 s at 60 and 120 Hz but 0.156 s at 90, 0.194 s at 144, 0.175 s at 240 | **Fixed** | `ItemOrbFlourish` keeps the orb's place each frame and reads the trail's 15 points at fixed ages (`TRAIL_STEP` 1/60 s). 0.233 s at 30, 60, 90, 120, 144 and 240 Hz (it was 0.467 s at 30). |
| m2 | `curseDim` read `ctx.acting`, so a girl's action overlapping Bahamut's Curse skipped the dimming | **Fixed** | It finds the action by the status event's caster (`actionOfBlow(ctx, sourceId)`), as `statusFxLanding` does. |
| m3 | REDUCE MOTION and LOW EFFECTS draw none of the new spell effects (the `low` tier), but Bailey's pick turns off only "shake, punch, freeze, rumble" | **Not changed: a decision for Bailey** | The rule is the pre-existing accessibility tier for every spell effect (today's too); the new effects follow it. The adapter does follow his pick (`fxBeat` passes `calm`; the hit-stop, punch and rumble hooks stay quiet, anticipate and smear still run). Question 8 below. |
| m4 | With the switch off, FFX `haste` / `hastega` resolved to the bloom instead of the Cure motes; `statusAdded` took one extra microtask turn | **Fixed** | `resolveSpellFx` takes a `fresh` flag (the lookup passes `fxNewOn()`): the buffs' rows count only with the new effects on, so FFX Haste resolves as on main. `statusFxLanding` returns `undefined` when there is nothing to wait for and its callers await only a promise. Three existing tests that pinned the lane's own bloom for FFX Haste were corrected. |
| m5 | Bahamut's plain Attack got a name slab; slabs of overlapping actions stack and can cover the guide panel's text | **Attack fixed; stacking not changed** | `isPlainAttack` (an `ability` command with the id `attack`). The overlap is the coach panel's placement under a slab that sits where the footage puts it (above the girl's head); hiding it needs Bailey's eye (question 9). |
| m6 | A running copy's ring, band and decal bristle pattern jumped once when an earlier copy in the frame's list ended (seeds were list positions) | **Fixed** | `CopySeeds` (per layer): each copy gets a seed the first time it is drawn and keeps it for its life. The Cure's ring seeds stay 75.564 and 38.513 through a Haste's end (they became 79.206 and 42.155). |
| m7 | (a) rumble numbers called "Bailey's picks"; (b) `CrispRig` `Math.max(1.05, ...)` moved `?ss=` overrides between 1.001 and 1.049; (c) the painted finish also applies to the approved Spiral Cut and Mega Flare when on; (d) three already-oversize files grew; (e) a victim drawn twice at the first frame of a boss hit | **(a), (b) fixed; (c) to Bailey; (d), (e) not changed** | (a) labelled [ours] (he named "light, big moments only" and no number). (b) the guard's cut is `max(min(ss, 1.05), ss * cut)`: it never raises a rung. (c) is question 10. (d) `BattlePresenterEvents.ts` is 450 lines as before (the new code went into `BattlePresenterBossFx.ts`, 164 lines), `BattlePresenterPorts.ts` and `FFX2BattleHud.ts` are untouched by the fixes. (e) is the pose crossfade of `hurt`, not this lane's code (for the pose lanes). |

### Where the numeral lands now (the real presenter and layer on a virtual clock, `fix/hold.mts` and `fix/hold4.mts`)

The effect clock when the HUD is shown the blow, in seconds (the strike is the effect's mark). Before the fix: 0.014 or "not started" for every row.

| Chapter | Move | Mark | Before | After |
|---|---|---|---|---|
| I (FFX) | Lance of Atrophy | 0.32 | not started | 0.32 |
| I (FFX) | Full-Life | 0.45 | not started | 0.45 |
| I (FFX) | Flare | 0.50 | not started | 0.50 |
| IV (FFX-2) | Darkness | 0.82 | not started | 0.82 |
| IV (FFX-2) | Impulse, the three girls | 0.80 / 1.04 / 1.28 | not started, then 0.24 and 0.48 s after the first | 0.80 / 1.04 / 1.28 |

The same holds with SKILL TRAVEL open and closed (an open FFX-2 command menu closes it), and in the browser at exact frame steps (below).

### What the fixes do to the pace (presenter time, ms at normal speed, the Skill menu open as in the clips; `fix/pace.mts`)

| Chapter | Move | Today | New before the fix | New now | Added over today, before to now |
|---|---|---|---|---|---|
| IV (FFX-2) | Darkness (with its HP-cost blow) | 1680 | 2300 | 1680 | +620 to **0** (browser, stepped, 60 and 144 Hz: 1967 ms, today's 1967) |
| IV (FFX-2) | Impulse (three girls, no target named at the start, as the engine has it) | 1720 | 2520 | 2140 | +800 to **+420** |
| IV (FFX-2) | Curse | 1220 | 1470 | 1220 | +250 to **0** |
| IV (FFX-2) | Haste, Shell (the White Mage buffs) | 1220 | 1470 | 1220 | +250 to **0** |
| IV (FFX-2) | Bahamut's Attack | 1340 | 1340 | 1340 | 0 |
| I (FFX) | Lance, Full-Life, Flare, Haste | 1340, 1740, 1240, 1220 | 1560, 1690, 1740, 1470 | 1560, 1690, 1740, 1470 | unchanged (turn-based; the wait costs no game time) |

What is left in FFX-2 is Impulse's faithful lead-in: its streams run 0.80 s to the first girl's numeral and the cast pose covers 0.38 s of it (the browser's stepped run: 2633 ms against today's 2167). Darkness (the move Rikku casts every turn) adds nothing now: the pre-roll and the cost blow's no-wait together cover its 0.82 s. **[ours]**: the pre-roll itself, the 0 ms wait and the marks (`DARKNESS_MARK`, `IMPULSE_MARK`, `CURSE_MARK` in `effects-painted-bahamut.ts`). Bailey judges the feel on Thursday. If Impulse is too slow, its lead-in has to be re-timed in that file (the mark is also where the draw puts its strike, so it is not a one-number change), a small job.

### Evidence (after the fixes)

Headless Chromium on the real GPU, 1600 x 900, `?pack=demo&coach=off`, the shared browser lock (RIG-RECORD) taken and released for each job with a gap of 95 s between my holds, Vite on :5303 started and stopped by PID. Scratch tooling and captures (not committed): `D:/Tools/pyrefly-scratch/2026-10-22/motion/fx/fix/cap/` (`step2.mjs`, `play.mjs`, `rlib.mjs`, `chain*.sh`; `step2-seymour-flux/result.json`, `step2-ffx2-bahamut/result.json`, `step-*/result.json`, `out-*/report.json` and the frames). The tests and the virtual-clock probes are `tests/unit/fx-review-fixes.test.ts` and `D:/Tools/pyrefly-scratch/2026-10-22/motion/fx/fix/*.mts`.

**1. Stepped frames** (the page clock paused, one game frame per 1/60 s and per 1/144 s, the real presenter playing engine-shaped events through `__pyrefly.fxPlay`, the Chapter IV Skill sub-menu held open as in the clips). The time the damage numeral is in the DOM and the effect's own clock then; the strike is the effect's mark. 0 console errors in all of them.

| Chapter | Move | Mark | Numeral before the fix | Numeral now | Today | Move done, now / today |
|---|---|---|---|---|---|---|
| I (FFX) | Lance of Atrophy | 0.32 | 1417 ms at effect 0.014 | **1817 ms at 0.333** (144 Hz: 1798 ms at 0.324) | 1417 ms | 2683 / 2417 |
| I (FFX) | Full-Life | 0.45 | 967 ms at 0.014 | **1517 ms at 0.458** | 1567 ms (Cure at 0.50) | 2133 / 2200 |
| I (FFX) | Flare | 0.50 | 967 ms at 0.014 | **1567 ms at 0.500** | 1133 ms (the bloom, no effect) | 2200 / 1767 |
| I (FFX) | Total Annihilation, first blow | 0.26 | 967 ms at 0.014 | **1283 ms at 0.264** | 1133 ms | 6350 / 5183 |
| IV (FFX-2) | Darkness, the foe's 3912 | 0.82 | the HUD saw the blow before the effect had started (800 ms, no menu open); with the first fix alone 1667 ms at 1.065 | **1400 ms at 0.823** (144 Hz: 1396 ms at 0.821) | 1300 ms | **1967 / 1967** |
| IV (FFX-2) | Impulse, the first girl | 0.80 | 883 ms, effect not started | **1350 ms at 0.803** | 883 ms | 2633 / 2167 |
| IV (FFX-2) | Curse | | | | | 1350 / 1350 |
| IV (FFX-2) | Haste | | | | | 1350 / 1350 |
| I (FFX) | Haste | | | | | 1767 / 1467 (turn-based: the 250 ms wait stays) |

The Cure and Cura columns, Bahamut's Attack and the Overdrive's lead-in are as before the fixes (the frame jobs of the review's own run and this one agree to the frame). The 144 Hz runs repeat the 60 Hz ones to within one frame.

**2. Real keyboard play** (after the chapter is picked, keyboard only; menus chosen by reading the DOM): Chapter I, 5 turns, 34 s to the results screen (effects seen: hit, cure, atrophy, haste through the new status hook, cleave); Chapter IV twice, 38 turns in 3 minutes and 28 turns in 2 (effects seen: curse, hit, darkness, cure, impulse, gather, protect, shell, megaflare; slabs: Curse, Cure, Darkness, Impulse, Protect, Mega Flare). No console error in any run but one warning, `[fx-b] depth plates unavailable EncodingError`, which is an art decode warning from the art mirror being rewritten by another lane at the time (the review saw the same). Frame interval p50 16.7 ms, p95 16.8 ms, p99 16.8 ms on the 60 Hz display; the worst frame is 500 to 516 ms in Chapter IV and 750 ms in Chapter I, the first use of an effect or a texture (not attributed; the review saw 517 and 883).

**3. Two review images** (committed): `docs/screenshots/motion-fx/review-fix-ch1-lance-numeral-at-strike.jpg` (six frames of Seymour Flux's Lance in a real Chapter I fight: no numeral and Tidus's row at 2420 at effect 0.06, 0.17 and 0.26; the numeral 796 and the row at 1624 on the frame of the strike, 0.32) and `review-fix-ch4-curse-dim-with-overlapping-actions.jpg` (Chapter IV: Bahamut's Curse dims Yuna while Rikku's Darkness and Yuna's own Cure overlap it, the case m2 broke; the "Cure" slab covers the start of the coach panel's text, m5's open part).

### Open questions added by the review

8. **REDUCE MOTION and LOW EFFECTS (m3).** They draw none of the new spell effects (the existing `low` tier: the bloom). Bailey's pick says REDUCE MOTION turns off "shake, punch, freeze, rumble" only. Should REDUCE MOTION keep the new effects (leaving them off for LOW EFFECTS only)? One condition in `SpellFxParams.resolveFxQuality` and its tests; a decision for Bailey (accessibility).
9. **The name slab over the guide panel (m5).** In the first battle the coach panel's text sits where a slab over the left girl's head can cover it. Keep the slab where the footage puts it, or move or hide the coach panel while a slab is up?
10. **The painted finish on D-233's Spiral Cut and Mega Flare (m7c).** When the new effects are on, the painted finish also draws on the approved specials (the note named Mega Flare; Spiral Cut too). Bailey's yes belongs on the Thursday list, per piece, or the specials can be excluded in one line (`SpellFxFreshLayer.configureList`).
11. **Is Impulse's extra 0.42 s acceptable?** Darkness, Curse and the White Mage buffs now cost FFX-2 no ATB time over today; Impulse (every fourth Bahamut turn) still adds 0.42 s (lead-in 0.80 s, the cast pose covers 0.38 s). The footage's own 1.5 s to Darkness's numeral is run in 0.82 s; Impulse's shape is [ours] throughout.

## Evidence and downloads

No download in step 2. Scratch tooling (`cap/`, not committed): `cap-fx2.mjs` (sheets, stepped captures, perf), `lib.mjs`, logs. Captures are under `D:/Tools/pyrefly-scratch/2026-10-22/motion/fx/cap/out*/`.

No download in step 3 either (the footage was read in step 1). Step 3's scratch tooling (`cap/`, not committed): `cap-fx3.mjs` (sheets of each effect held at fixed times), `cap-fx4.mjs` (the real-presenter clips, `__pyrefly.fxPlay`, exact 120 Hz), `cap-fx5.mjs` (frame times at 2560 x 1440, the CPU throttled), `export-step3.mjs` (CLIPS.md and the committed review images), `common3.mjs`. The clips are `D:/Tools/pyrefly-scratch/2026-10-22/motion/fx/clips/<chapter>/<today|new>/<chapter>__<move>__<mode>.mp4` (with a contact sheet and a summary JSON each) and `CLIPS.md` beside them; the frame times are `cap/out9/*-perf3.json`; the sheets of each effect are `cap/out8`.
