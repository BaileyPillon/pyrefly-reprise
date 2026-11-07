# Paper preflight: hidden chapter 49 (provisional) — Wendigo and the Guado Guardians on frozen Lake Macalania, the Meshy 3D tech demo (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-beast-review.md`, `ch-keeper-review.md`, `ch-spherimorph-review.md` and `ch-anime-review.md`: a number is read the way the source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no Meshy call, no browser, no engine run.** Written 2026-11-06 by a Sonnet sub-agent of the release driver (Meshy-chapter research lane, FFX only; program row 49). Authority (relayed words, verbatim): Bailey 2026-11-06 "make 1 brand new chapter using meshy extensively please", then "like a tech demo"; earlier "you can spend as much meshy credits as you see fit. use your own judgment."; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." The options cards went to him ~14:45 EST (a scratch folder outside the repo); **he was told the driver builds B (Wendigo, frozen Lake Macalania, FFX only) with the party moved by the real FFX animations if he does not pick: that default stands, his to overturn.** **Every other pick below is the planner's recommendation, "driver's call, his to overturn", with the alternative named.** Nothing deploys and nothing goes into a repo tree.

**Read:** `research/re-ffx-wendigo-lake-macalania.md` (the sister note in this folder; "RE §n" below), the program plan (row 49, sections 6 to 9), `docs/plans/ch-spherimorph-review.md` and `ch-beast-review.md` (format, sizes), the 3D handoffs `docs/handoff/ch-yrp.md`, `ch-waker.md`, `ch-anime.md`, `fayth-3d.md` and the engine modules of `src/engine/ww3d`, `yrp3d` and `ffx3d` (headers and imports), `src/battle/ffx/ai/hooks.ts`, `macalania-guardian.ts`, `forced-turn.ts`, `src/data/ffx/builds/macalania.ts` and `macalania-bench.ts`, all at `origin/r76-int` or `origin/main` (read only), the Meshy lane's `REPORT.md` and card B (`cards/card-B-wendigo.jpg`, `spec-b.json`), the extraction notes of the extraction lane's assets folder, outside the repo (`INVENTORY.md`, `runtime/evrae/clipmap.json`). **Engine claims were read at `origin/r76-int` and `origin/main`; nothing was run, so rule 3 is owed by T0 and the bench.**

**Verdict: PROCEED on the battle side, the retarget tool, the data and the shipping plumbing now (nothing Bailey perceives); card B is the approved default target for the picture; HOLD every perceivable refinement beyond it (the Wendigo's look and size, the aurora and ice, the camera program, the ice-break epilogue) until the 2 to 4 option frames of section 10 are shown (hard rule 9); the winnability numbers wait for the bench.**

## 0. What changes against the plan (read first)

1. **The research is done.** Both AIs are read in full (3,133 and 1,972 bytes of code; the plan's "Crawler 149 KB" is the other fight). The residual R is a quarter of an hour of live checks (section 14), not 8 hours.
2. **The plan said "painted 2.5D only, no Meshy" for every row (PLAN §1, §9.6); for this chapter that is superseded** by Bailey's 2026-11-06 words above: a real 3D chapter on Meshy models, a tech demo. The standing "AI 3D rejected" line (D-1117, D-1130: "uncanny valley", "AI slop") stays on file; the two weak points the Meshy lane found are tracked as risks (R1, R2).
3. **The fight is a status-management fight, not a damage race.** An unmanaged Wendigo punch is 1,634 to 2,015 against cells of 850 to 1,900 HP; Berserk (which the Guardians cast on it at once) makes its only move a x3/2 punch of 2,451 to 3,022 and switches off its stance and its other moves; Power Break and Protect together make a punch 408 to 503. The Guardians heal, buff, Berserk the party while the arms are up, and Protect or Shell Wendigo when they die. [RE §0, §4, §6]
4. **Card B's "a big hit can crack the ice under it" is not the game.** The battle script has no ice; the ice breaks in the field event after the victory (a magic effect, twelve map layers hidden, two camera shakes, a fade to white, a warp to the lake bottom). It is the epilogue. Mid-fight cracking is an addition: rule 10 needs Bailey's yes (pick CW8). [RE §2]
5. **Real-animation retarget is new work**, and the biggest unknown of the chapter: the game's skeletons are 134 to 181 bones with anonymous joint names (`SkeletonNode_<n>`), the Meshy rigs are 24 named bones; the existing retarget tool (`tools/anime/retarget.mjs`, by bone name, Meshy to Meshy) does not apply. The real banks exist (Tidus, Wakka, Rikku converted already; Yuna, Auron, Kimahri, Lulu, Wendigo and the Guardian not). [section 4.2, RE §12]
6. **The Meshy Wendigo reads as a generic white yeti; the game's Wendigo is a blue-skinned brute with an olive shaggy mane** (`real/m212-*.png`), and the game draws it **1.55 times Tidus's height**, not the card's giant. A faithfulness fix costs 35 credits (a second image-to-3D from the real model's views) and one frame (picks CW5, CW6). [RE §1.1]
7. **The size rises** (42 to about 70 Sonnet agent-hours, section 12): a 3D engine path for FFX with real shipped models, a retarget tool, four new environment modules, a camera program and the epilogue are new; the battle side shrinks (the Temple Guardians' module, the forced Berserk turn and the Macalania preset exist).

## 1. Game case and sources

**Game case: FFX only** (AGENTS.md rule 14): CTB, aeons, the FFX status set; the fight is the last boss before the lake bottom. New battle logic lives in new files under `src/battle/ffx` and `src/data/ffx` (an absence test pins that no ffx2 file imports it, as for the Keeper); **the 3D engine's FFX-2 coupling is two modules, not the engine** (`ww3d/moves.ts` imports `data/ffx2/enemies/valefor-abilities.ts`; `yrp3d/dress*.ts` import `battle/ffx2/*`): the rest carries "FFX-2 only" in its comments and in the cast-id types (`WwId`, `YrpId`) and reads no FFX-2 data, so the new chapter generalises the ids and imports nothing of FFX-2 (an import-graph test). The chapter registration and the other shared tables (PLAN §7) are shared plumbing, case "both", inert for every other chapter, left to the integrator commit.

| Source | What it gives | Tag |
|---|---|---|
| RE note: `m212`, `m213`, `maca02_01`, the command rows, the field event `maca0200` | the records, the formation, the whole AI, the story beat, every battle number below | [R] (FFX_Data.vbf, Steam build 25501027) |
| RE §4 `[run]` | exact tallies in the Atel interpreter: the turn mix, the seven-turn cycle, the counter table (35 commands), the Guardians' branches | [run] |
| GameFAQs "Lake Macalania" (read through headless Chromium), Jegged, Gamer Guides, Samurai Gamers | the guides' account: agrees with the files except where RE §7 says (Haste, "weak to fire") | [guide] |
| `src/data/ffx/builds/macalania.ts`, `macalania-bench.ts` | the repo's stat cells, aeons and bag at the Temple, a few battles before this fight | [estimate], build point sourced |
| the extraction lane's size table `ffx-monsters-size.tsv`, outside the repo | the game's heights: Wendigo 26.4 (1.55 x Tidus), the Guardian 20.0 (1.08 x Tidus) | [R] |
| The Meshy lane (`REPORT.md`, cards, `cost-log.jsonl`) | the Meshy settings that worked, the prices, the pilot's weak motion, the frame time of the staged frame | [lane] |
| the extraction lane's converted-assets folder, outside the repo | the real party motions already converted (Tidus, Wakka, Rikku), the clip map's format and open questions | [extract] |

## 2. What the player experiences, in plain words (the game's own rules, RE §4)

**The set-up.** The party flees the Temple across the frozen lake; the field's pursuit music plays; Wendigo (18,000 HP) steps out with two Guado Guardians at its sides. Escape and Flee are off; Switch and Summon work. No tutorial line (the game has none for this fight).

**Wendigo's turns.** Above half HP: a punch on a random member (about 1,700 to 2,000) on two turns in three, and on the third **the strong double punch (about 2,500 to 3,000, never misses) on whoever has the lowest HP**. Below half HP it goes into a **seven-turn cycle**: it raises its arms for three turns, during which **every physical hit it takes is answered by a counter punch (about 2,000 to 2,500, never misses) unless an aeon is out**; it lowers them; it throws three punches (one in three the double punch); it raises them again.

**The Guardians.** They Berserk Wendigo first (a Berserk Wendigo throws only its default punch, at x3/2, and never raises its arms), cure its Darkness with Eye Drops, drink an Auto-Potion (+1,000) when hit unless Rikku has stolen from them, heal Wendigo now and then while it is Berserk, throw Blizzara and Thundara (about 250 to 330), **Berserk your party while the arms are up**, and **cast Protect or Shell on Wendigo when they die** (not if Petrified).

**What the player has to read:** the Berserk on Wendigo (strip it, or it never uses its other moves, but its one move kills), the arms (do not attack physically, or summon), the Guardians' deaths (their last buff). Answers the game and the guides give: Steal both Guardians, Power Break, Protect, Darkness (Dark Attack; the rolled punches miss about 91 to 98 percent), Esuna or Provoke or Threaten for Berserk, Petrify the Guardians, Ixion's Aerospark for Protect and Shell.

**The win.** HP 0; the body stays ("Boss"). 3,000 gil, 2,000 AP (3,000 overkill), a Power Sphere (two rarely), a steal of Hi-Potion or X-Potion, gear at 50 percent; the Guardians 480 gil, 290 AP and an Ability Sphere each. **Then the epilogue (sourced):** the ice gives way (a magic effect, the ice layers vanish, the camera shakes twice), a fade to white, the lake bottom. [RE §1.2, §2]

**The design fact `[derived]`.** The fight is about **controlling Wendigo's state while the Guardians keep resetting it**: Berserk on or off, arms up or down, buffs on or off, the Guardians alive or dead, blind or not. Damage is secondary (18 Auron swings, 15 Fira casts, no weakness).

## 3. Engine work, battle side

Each row is mapped to the files on `origin/main`, marked **existing**, **partly** or **new**, and sized `[estimate]`: S under 1 agent-hour, M 1 to 3, L over 3. Host files at the 400-line cap (`encounters.ts`, `battle/ffx/setup.ts`, `chapter-meta.ts`) get net-zero edits or one-line hooks.

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | Records: Wendigo (18,000 HP, STR 40, the Break, Berserk, Provoke, Threaten 100 bytes), the Guardian `m213` (1,200 HP, the Threaten-immune bytes), the four punch rows, Raise and Lower arms, Berserk (chance 120), Auto-Potion, Eye Drops, the Guardian's death buffs, loot | **Existing** formulas and the status set; new data (the repo's Seymour module has the Temple Guardian's rows, `m141`, not `m213`) | new `data/ffx/enemies/hidden-ffx.ts` entries + `loot/records.ts` | S |
| 2 | Wendigo's turn: three states (above half; below half; arms up), the seven-turn cycle, the 1-in-3 strong punch on the **lowest-HP** member | **Partly**: the selectors and `pickMatching` exist (`ai/script-random.ts`); the cycle and the stance are new | new `ai/wendigo.ts` + `-rules.ts` | M |
| 3 | The arms-up stance: a readable status on Wendigo, the counter on a **physical** hit (the kernel's damage type), silenced by an aeon in the front line, cleared by Sleep, off when counters are not allowed | **New**; `UsedCommand`, damage type, `queueReaction` with `requiresAlive`, Threaten's gate exist (`ai/hooks.ts`, `ai/hit-gates.ts`) | rules file | M |
| 4 | The Guardians' turn: Berserk on Wendigo, Eye Drops, Berserk on a party member during the stance, the Berserk-branch split (37.5 / 37.5 / 25), the stolen-from variant | **Partly**: `ai/macalania-guardian.ts` is the Temple variant (Auto-Potion, steal count, the coin helpers); this is a sibling module | new `ai/lake-guardian.ts` | M |
| 5 | **An `onDeath` hook for an ordinary monster** (the Guardians cast Protect or Shell on Wendigo when they die; not when Petrified) | **New, small**: `ScriptHooks` has `preTurn`, `onTargeted`, `onHit`, `postPoison`; Macalania's Anima polls after every action instead (`ai/macalania-acts.ts`); a generic hook or the same poll | `ai/hooks.ts` (a shared contract: CONTRACT-CHANGES entry) | S to M |
| 6 | A **Berserk Wendigo runs no script** (a forced default attack at x3/2) | **Existing** (`forced-turn.ts`: Provoke, Berserk, Confuse turns skip the script) | none (a test pins it for this record) | none |
| 7 | A monster using an item row (Eye Drops) and the steal rule for it | **Open** (RE §8): GameFAQs says Steal stops it, the script has no test | data + a rules line | S |
| 8 | Formation: Escape and Flee off for all, Normal start, three party and aeon entries, no messages | **Existing** (`formation-commands.ts`, `commandDisables`) | formation data | S |
| 9 | Party: the Macalania preset with its four aeons, the default front line | **Existing** (`macalania.ts`) | none | none |
| 10 | HUD | **None new** (no new command); the standard status icons; the Guardians' Berserk, Protect, Shell and Darkness show on the existing icons | | none |
| 11 | Chapter plumbing: new `ChapterId`, `Chapter.number` 49, meta, story, door word `wendigo` (desktop-only gate, decision 219q), guide, tactic; absence tests | **New**, via side tables and new files | PLAN §7 | M |

**Order of dependence:** 5 before 4; 3 before 2; the rules after the data.

## 4. Engine work, presentation side (the 3D chapter on the hidden chapters' engine)

### 4.1 What exists to build on

| Piece | Where | Reuse |
|---|---|---|
| Models ride the painted actors, planes off; facing, flash, tint, KO fall, fade, size fit | `yrp3d/skin.ts`, `model.ts`, `load.ts`; the FFX twin `ffx3d/ffxSkin.ts` | **the pattern**; ids and layout must be generalised (`YrpId` is yuna, rikku, paine, bahamut) |
| A real clip rig on a mixer, a clip map of poses, a sequencer (start, hold, finish; fall, hold, rise; the idle fidget), the game's clip names | `yrp3d/clips.ts`, `clipMap.ts`, `clipSequencer.ts`; the FFX format `ffx3d/clipMap.ts`, `ffxClips.ts`, `ffxAnimator.ts` and the Evrae `clipmap.json` | **reusable as is** once the clips are baked into the Meshy glb under the game's clip names |
| A look for PBR models (the Meshy Bahamut's "pbr" look: the file's own material kept whole under soft studio suns), the figure rig, the rim accent for flash and glow, contact shadows | `yrp3d/shade.ts`, `rig.ts`, `look.ts`, `rim.ts`, `contact.ts` | **reusable**; the light table is new (a night lake) |
| A planar mirror floor with a Fresnel opacity, a ripple, a once-per-frame guard, a low-quality switch; the nested render the wet floor uses; brush grain | `ww3d/stageAnime.ts` (`AnimeFloor`, `reflectionAlpha`), `yrp3d/wetFloor.ts`, `wetFloorShader.ts`, `nested.ts`, `grain.ts` | **the mechanism**; the ice material is new |
| Atmosphere: a field of drifting motes, a light-shaft card, mist | `ww3d/stageAnime.ts` `addAtmosphere`, `stageTextures.ts` `shaftTexture` | **the precedent** for snow and shafts |
| The HD post (bloom threshold 1.0, an encoding grade, no tilt-shift) as a `ScenePalette` | `ww3d/post.ts`, `yrp3d/stageLook.ts` `YRP_PALETTE` | **reusable**: only values above 1.0 bloom, which is how an aurora and crystals glow |
| The shot director seam (beats `actionOpen`, `impact`, `actionClose`, camera moves awaited), the camera rig table | `engine/ShotDirector.ts`, `yrp3d/director.ts`, `frames.ts`, `ww3d/camera.ts` | **the seam** for a fly-in and held shots |
| A hidden door, desktop-only gate, a model folder under `public/models-exp/`, a build filter and a verifier that refuse a release without the models | `chapterDoors.ts`, `tools/dist-filter.mjs`, `tools/yrp-models-verify.mjs`, `tools/vite-ww-models.mjs` | **the plumbing** (yrp ships 43 files, 141.3 MiB; the host's file limit is 25 MiB) |
| FFX unit transform and the formation's own start positions | `ffx3d/ffxWorld.ts` (`FFX_UNIT = 0.09642`), `ffxStaging.ts` | **the staging source**: the party at (164, 125 to 157, -424 to -478), Wendigo at (86, -397), the Guardians at (89, -357) and (39.5, -418) |
| A neutral capsule for a missing file | `capsule.ts` | the fallback |

### 4.2 The gaps

| # | Gap | What exists | New work | Size |
|---:|---|---|---|---|
| P1 | **An FFX 3D path in production.** `ffx3d` is dev-gated and its production build holds no loader or skin (fayth-3d phase 3: "a production-mode build holds no skin code"); no FFX real model ships | yrp ships real FFX-2 models; `ffx3d` has the units and the clip map | a chapter-owned folder `src/engine/lake3d/` that generalises `yrp3d`'s skin, model, load, clip stack and shade to an FFX cast of 10 ids (`tidus`, `yuna`, `auron`, `kimahri`, `wakka`, `lulu`, `rikku`, `wendigo`, two Guardians), imports nothing of FFX-2 (the import-graph test), is a dynamic import so no other chapter pays | L |
| P2 | **Retarget the real FFX motions onto the Meshy rigs.** Sources: 134 to 181-bone anonymous skeletons (Tidus 136, Yuna 142, Auron 153, Kimahri 156, Wakka 134, Lulu 181, Rikku 162; Wendigo 184 targets); targets: Meshy's 24 named bones | `tools/anime/retarget.mjs` (name to name, Meshy to Meshy), `yrp3d/props.ts` `findHands` (a hand found by shape, the habit for anonymous bones) | **a node tool** `tools/lake/retarget-ffx.mjs`: a per-skeleton bone map found by hierarchy and rest position (pelvis, spine chain, head, shoulders, elbows, wrists, hips, knees, ankles, toes), a rest-pose conversion (the game's T-pose against Meshy's rest), a world-space delta rotation per mapped bone, the hip's translation scaled by the leg-length ratio, a root held in place (the presenter moves the actor), an optional foot lock, unmapped bones (cloth, hair, face) dropped; writes `<id>-anims.glb` with the game's clip names so `clipMap.ts`'s plans apply; a report of the worst joint error per clip. **Pilot first on Tidus's idle, attack, hurt and victory, shown as a motion clip before anything else is built** (Bailey's rule, rigs are judged in motion). Python only through a node wrapper | L |
| P3 | **Convert the missing banks.** Converted: Tidus (132 clips), Wakka, Rikku; not: Yuna (`c002`: 142 bones against 111 skeleton names in the HD model, "needs a mapping before retargeting"), Auron, Kimahri, Lulu, **Wendigo `m212` (26 clips, 724 frames, 184 targets; no clip map)** and the Guardian `m213` | the Evrae lane's converter (`tools/phyre2gltf`, python) and its `clipmap.json` method (Proven / Read labels, loop seams, "program to clip" rows) | run it for the six; **build Wendigo's clip map** (the script starts motions 1, 17 idle, 2 to 5 the punch, 12 and 13, 80 and 81 move, 128 and 130, 153 to 156, 160 to 162 sleep, **184, 185, 186 the arms-up stance**: program to clip is unmapped, RE §8) | M (L for Yuna) |
| P4 | **Meshy files fit the host.** The Wendigo glb is 36.75 MB (a 18.9 MB base-colour png), over the host's 25 MiB file limit (yrp met the same: its Meshy Bahamut was 32.6 to 35.9 MB and was left out of the shipped set); the loaders do not decode Draco or Meshopt | the pass that re-exported three yrp dress files under the limit (texture size, one subdivision level) | a **Blender (node-wrapped) or glTF-transform-style pass**: textures to 2k or WebP-in-glb (the loader decodes `EXT_texture_webp` where the browser does), the triangle count from about 100k to a budget, one file per figure under 24 MiB, a size check in the verifier | M |
| P5 | **Shipping the models**: `public/models-exp/lake/`, the dist filter, a verifier, the deploy gate, a mirror and backup of the files | `tools/dist-filter.mjs`, `yrp-models-verify.mjs`, deploy's models check | `tools/lake-models-verify.mjs` and the filter rows; **a release cut from a tree without the models is refused** (yrp P13) | M |
| P6 | **The mirror ice.** A near-mirror frozen lake: a Fresnel reflection with roughness variation, frost and scratch normals, deep blue subsurface tint, cracks, the figures reflected and lit, soft contact | `AnimeFloor` (a `Reflector` at 1 cm over the floor, once per frame, blur taps, ripple), `wetFloor` (a nested figure render, linear output) | `iceFloor.ts` and its shader: dark-blue base with depth fakery, a roughness mask from a seeded noise, a crack texture that the epilogue can grow, reflection of the sky, the figures and the crystals; a `low` quality that keeps the ice and drops the mirror | M to L |
| P7 | **The aurora.** Animated curtains over a dark sky, reflected in the ice | a sky plate path (`ffx3d/ffxSky.ts`), a painted sky in the Meshy frame | a sky dome shader: layered noise ribbons in green, teal and violet, HDR above the bloom threshold for the glow; **or** a painted sky plate (ComfyUI, one image) plus a shimmer shader (end-state pick CW11) | M |
| P8 | **Snow and breath.** Drifting snow in two depth layers, wind gusts, a ground haze | the motes (`addAtmosphere`: Points, additive) | `snow.ts`: instanced points or sprites, a wind field, a pause on REDUCE MOTION; sized for 5k to 20k flakes | S to M |
| P9 | **Volumetric light.** Moonlight shafts through the crystals and over the ice | the light-shaft card (additive, textured) | **cheap:** layered shaft cards with noise and depth fade, under the bloom; **dear:** a screen-space radial-blur pass added to the post chain (shared plumbing in `engine/Renderer.ts`, a deep-review file, case "both", inert elsewhere). **Recommendation: the cards first, the pass only if the frame shows the need** | M (L for the pass) |
| P10 | **The flying camera.** A low fly-in across the ice to Wendigo, a held shot as it rears, a drop through the ice at the end, with the fight's own camera between | `BattleCamera` rigs (named static rigs), `ShotDirector` (`actionOpen` and the rest can answer "taken" and be awaited), `yrp3d/director.ts` (Mega Flare's move) | a **path player** (a spline of positions and look-ats with easing, awaited by the beat), the intro shot at the chapter start, a held shot on the arms-up rise (an `actionOpen` of Raise arms), the epilogue; **the game's CHAPTER FRAMING and EYE CANDY looks fight a custom camera** (fayth-3d: "the sink must clear `camera.view` and run after the mix, or the chapter must opt out"): the chapter opts out like the other hidden 3D chapters | M |
| P11 | **The ice-break epilogue (sourced).** After the win: the effect's flash, twelve ice layers vanishing, two camera shakes, a fade to white, the lake bottom | `camShake` machinery in the presenter, the fade | `iceBreak.ts`: cracks grow over the floor texture, shards (an instanced mesh) fall, the camera drops, a white fade, then the results screen (or a one-card epilogue: pick CW8) | M |
| P12 | **Guardians and props.** Two Guardians from one Meshy model (instanced twice), six arena props (crystals, ice pillars, a snow bank, rocks), their staging | `ww3d/swaps.ts` (props as files, origin and scale conventions), `ww3d/stageParts.ts` | props as swappable files; the Guardian as a figure | M |
| P13 | **Lighting and look for a night lake**: a cold key (moon), a violet aurora fill, an ice-bounce, the figures lit to read | `yrp3d/look.ts` (`LOOK.rig` table), `rig.ts` | a new light table (the only place its numbers live) | S |
| P14 | **Performance budget.** Desktop only; the mirror draws the scene again each frame, a 4096 shadow map, 4k PBR maps | the anime chapter's mirror (about 40 captured fps on the RTX 5070 Ti), the card's staged frame at 4.4 to 5.3 ms (a purpose-built renderer, not the engine) | a **texture budget**: 4096 px base colour for Wendigo only (a 4k RGBA map with mips is about 89 MB of GPU memory, three PBR maps about 270 MB), 2048 px for the party and the Guardians (about 22 MB a map), props 1024 px; **p95 frame time under 20 ms at 1600 x 900 on the target GPU (a prediction to falsify), a quality switch that drops the mirror** | S (the budget), M (the measuring) |

**Order of dependence:** P2 and P3 gate the party and the boss's motion (do the Tidus pilot first); P4 before P5; P1 before everything that draws; P6 to P9 are independent of the fight and of each other; P10 and P11 after P1.

## 5. The party

- **Build point:** the repo's Macalania preset (`macalania.ts` plus `macalania-bench.ts`, the midpoint of the published ranges, `[estimate]`): the Temple's cells and bag, a few chase battles before this fight, **with Shiva in the roster** (she is owned here; her gauge starts at 0 as the Temple's rule says) and four aeons (Valefor, Ifrit, Ixion, Shiva). All seven characters are available; the formation takes three. [RE §12]
- **It already carries the sourced tactics:** Yuna Esuna, Protect, Shell, Life, Cure, Cura; Auron Power, Armor and Magic Break, Threaten; Wakka Dark Attack and Silence Attack (no Sleep Attack); Rikku Steal, Use, Mix; Tidus Haste, Provoke, Delay Attack, Cheer; Lulu Fire, Fira and the other tier-2 spells, Focus; Kimahri Lancet, Jump; Ixion's Aerospark; the bag (30 Potions, 10 Hi-Potions, 17 Phoenix Downs, 4 Petrify Grenades, 10 Eye Drops, 3 Remedies ...). **No Dispel** (Yuna), as at the Temple.
- **Recommended front line: Tidus, Yuna, Rikku (the preset's own `activeSlots`), bench Auron, Wakka, Lulu, Kimahri.** Rikku steals both Guardians in her first turns, Yuna carries Protect and Esuna and the aeons, Tidus Hastes; Auron's Power Break and Wakka's Dark Attack are one Switch away. Alternative: Tidus, Auron, Rikku (the Power Break line). **The bench runs both and reports** (changing `activeSlots` is one line).
- **Which characters need a Meshy model and a bank for the first build:** the front line (Tidus, Yuna, Rikku) and, because a Switch brings them in, the sourced bench pieces (Auron, Wakka); Lulu and Kimahri second. **Tidus, Wakka and Rikku already have converted banks** (the Evrae trio), so the first build's real-motion set is the cheapest possible one for three of the five (P3). A bench member with no model stands on the neutral capsule (the existing fallback) and is listed as owed.
- **Gaps, none of which this lane fills (rule 6):** the exact bag and gauges at this point, the armour abilities, whether Shiva's gauge is still 0. All `[estimate]`, never tuned toward a result.
- **Boss numbers are never tuned** (PRODUCT-BRIEF "mechanics never bend"). If the measured line is unwinnable or trivial, Bailey gets options with numbers.

## 6. The arena and the look (the tech demo)

- **No plate exists for Lake Macalania** (PLAN row 49: "none (temple plate stand-in)"); **this chapter has no plate at all**: it is a 3D scene, so the stage is built, not painted. The formation puts the party in a diagonal at x 125 to 164, z -424 to -478, Wendigo 7.9 m from the front member, the Guardians behind and to its flank; map centre (118, 0, -430). One area. [RE §2]
- **The look (card B, the approved default target):** a night lake under an aurora, a mirror ice floor reflecting the figures and the sky, snow, glowing blue crystals, moonlight shafts, fur lit from behind, a low fly-in and a held shot as Wendigo rears, and **at the end the ice gives way** (sourced, section 2). The card's frame is a purpose-built three.js render with the live HUD matted on top, **not** this engine; it is the target, not proof of the engine.
- **The five required effects against the engine:** mirror ice (P6, new material on an existing mechanism), aurora (P7, new), snow (P8, new but a precedent), volumetric shafts (P9, cards first), flying camera (P10, a seam exists). The party in the frame is the Meshy cast retargeted from the game's motions (P2).
- **The HUD** is the live build's FFX HUD over the 3D frame, as the card shows; the command menu covers part of the left of the frame (the yrp frame b was tuned for this: stand the party where the menu does not cover it, measured live).
- **Desktop only** (the door's `desktopOnly` gate, decision 219q; the fourth hidden 3D chapter after yrp, waker and anime); no phone budget applies.

## 7. Models, motion and credits

| Asset | Meshy cost (the card's own figures) | Note |
|---|---:|---|
| Wendigo: model 35, rig 5, clips 18 | 58 | **the clips drop out if the motion is the game's retargeted bank** (3 credits each); a faithful redo from the real model's views is another 35 (CW5) |
| Two Guado Guardians (one model, two copies, or two) | 116 as the card prices two; 58 for one instanced | humanoids, 1.08 x Tidus tall; their own motion bank (`m213`) not yet read |
| Six arena props (crystal cluster, ice pillars, rocks, a snow bank, a frozen wreck) | 190 | static, one mesh each, cleaned like the Wind Waker props |
| Redo reserve | 70 | |
| **This chapter** | **434** | |
| The FFX cast, shared with every FFX chapter | 293 more (Tidus's first 55 spent) | 6 more characters; their clip credits drop out the same way |
| **First chapter built** | **727** | the lane spent 320 (balance 4,405 to 4,085) |

- **Settings that worked:** `meshy-7.1`, 4k geometry, 4k textures, PBR on, about 100k triangles a figure, no pose for creatures. [lane]
- **The motion plan:** the real FFX clips (the game's own names, the Evrae `clipmap.json` format) **retargeted** onto each Meshy rig by the P2 tool; Meshy's library clips are the fallback (a generic attack that ignores the sword, the Tidus pilot's weak motion). Wendigo's own bank (26 clips) carries the stance, the punches, the sleep and the death that no library has.
- **The files:** under the host's 25 MiB limit each (P4); the Meshy originals stay local; the retargeted files and the `clipmap.json` are the shipped set; a mirror and backup are the driver's disk decision (the yrp precedent: Bailey's models are a single copy plus a backup).
- **Weapons:** Tidus's sword and Rikku's and Wakka's weapons are the game's own weapon models on the game's locators in the game's skeleton; **on a Meshy figure they must be parented to the retargeted hand bone** with an offset measured once (P2 reports it); the game's weapon files are converted for Tidus, Wakka and Rikku (`weapons.json`). Original shapes (code props) are the fallback.
- **Retail assets are allowed and the public site included** (Bailey 2026-10-18); the converted clips and weapons are retail-derived and ship like yrp's.
- **Likeness risks, recorded rather than waved away:** Tidus's Meshy face is softer and more generic than the painting and one forearm shows a speckled patch in several poses (the nearest thing to the uncanny look he rejected); the Wendigo reads as a generic white yeti; Meshy Tidus beside the game's low-poly Wakka shows two fidelities in one frame (so every character is Meshy or none).

## 8. Music (rule 13: only his ears judge)

The game's own cue for this fight is **not read** (the field script loads the pursuit theme before the battle; the Crawler fight loads the boss theme). Stand-ins (flagged, the driver's pick): scene bed `scene-macalania-temple` (exists), battle cue `boss-challenge` (the neutral FFX boss cue) with `boss-seymour-macalania` as the alternative (the boss just before this one); an entry on the audition page for Bailey. The epilogue's quiet bed is the existing `scene-macalania-temple`. Alternative: one new take under the standing delegation (needs the driver's spend note; rule 11).

## 9. Winnability method (rule 15: nothing is tuned; the bench measures and the preset moves)

**The target** differs from the chain's 70 percent band, as the Spherimorph's did: this is a **status puzzle with one-shot damage**, so **the advisor's sourced line should win about 90 percent or more**, and an **unmanaged line (Attack only, no status work) should lose almost always** (the arithmetic below says a Berserk Wendigo ends a front line in a round). If the sourced line sits far below 90, the levers are, in order: the Phoenix Down and Hi-Potion stock, Yuna's Protect and Shell, the front line, the Petrify Grenades. **Never** Wendigo's or the Guardians' numbers.

**The sourced line the advisor carries (`engine/tactics/wendigo.ts`, one named constant per rule):** Haste the party; **Steal from each Guardian first** (Rikku); **Power Break on Wendigo and Protect on the party before anything else lands**; Darkness on Wendigo once the Guardians are dead (their Eye Drops cure it); remove Berserk (Esuna, Provoke, Threaten) **only when the Guardians cannot re-cast it**; kill the Guardians (they are Threaten-, Sleep-, Silence- and Berserk-immune; a Petrify Grenade or Stone Breath avoids their Protect or Shell); strip Protect and Shell with Ixion's Aerospark; **no physical hit below 9,000 HP while the arms are up unless an aeon stands in the front line**, and Esuna the party's Berserk; keep everyone above the strong punch's lower bound.

**Predictions from the arithmetic (to be falsified by the bench, not promises):** (1) an unmanaged front line loses in the first Berserk round: a x3/2 punch is 2,451 to 3,022 against a front line of 850 to 1,900 HP; (2) with Power Break and Protect together a punch is 408 to 503 and the double punch 612 to 755, so the cells survive one hit each and need Cure or Hi-Potion between; (3) Darkness cuts the two rolled punches to under 10 percent (the double punch and the counter punch ignore it); (4) a Guardian needs one hit of 1,200 or a steal first (each hit is answered with +1,000), and its death gives Wendigo a halving buff; (5) below 9,000 HP, Wendigo attacks on 3 turns in 7 and the arms-up turns punish every Attack, Break and Dark Attack with 2,041 to 2,519 unless Protect and Power Break are on or an aeon is out; (6) Lulu's MP (205) is not a limit (15 Fira casts cost 120).

**Tests (T0 first, T7 last):** T0 the engine checks (rows 3, 5, 7); T1 the data fixture; **T2 the AI rules with the interpreter's exact tallies as pins: the turn mix above half HP (21,846 and 43,690 of 65,536), the seven-turn cycle, the 35-command counter table, the Guardians' branches (the 37.5 / 37.5 / 25 split over 131,072 draw pairs, the stolen-from 62.5 / 37.5), the Berserk, Eye Drops and Auto-Potion rules, the Protect and Shell on death, the Petrify exception, the lowest-HP target, the aeon-silences-the-counter rule, Sleep ending the stance, Threaten and counter-not-allowed gates, a Berserk Wendigo running no script**; T3 the bench (12 then 500 seeds, copied from `tools/mirror-aeons-bench.mjs`, with the sourced line, the unmanaged line and the Auron front-line variant); T4 the HUD (none new); T5 the retarget tool's tests (a synthetic rig, the rest pose, the hip scale, a bone-map by shape) and the model fit checks (size under 24 MiB, joint names, clip names); T6 the shipping verifier; T7 the integration. Rule 14: FFX only; the absence test names `ffx2-atb-golden` and `ff7-golden` unchanged and the new engine folder imports nothing of FFX-2.

## 10. Picks (driver's calls, his to overturn); each perceivable one owes 2 to 4 end-state options before building (rule 9)

| # | Pick | Recommended | Alternative |
|---|---|---|---|
| CW1 | Number and word | **49, door word `wendigo`** (PLAN §8; checked against the 15 words and `pilgrim`; free on `origin/r76-int`) | none |
| CW2 | Scope | **the Wendigo fight (`maca02_01`) with its two Guardians, the one battle** | add the Crawler and Negator fight (`maca02_00`, Yuna absent, 16,000 HP; the Negator's block rule and the Mana Beam charge are new; PLAN's bundle) as a second act: about 20 more hours and its research |
| CW3 | Front line | **Tidus, Yuna, Rikku** (the preset's), bench Auron, Wakka, Lulu, Kimahri | Tidus, Auron, Rikku |
| CW4 | Build | the Macalania preset with Shiva and four aeons | none |
| CW5 | Wendigo's look | **card B's Meshy model as the build target, with a faithfulness redo owed:** a second image-to-3D from the real model's front, side and three-quarter views (35 credits) so the blue skin and olive mane return; one frame of both beside each other first | keep the white yeti (reads generic); the game's own model (no Meshy: against his word "using meshy extensively") |
| CW6 | Wendigo's size | **the game's 1.55 x Tidus** | the card's showpiece giant (a bigger frame, not the game) |
| CW7 | The camera | **a low fly-in (the card), the fight's own camera between, a held shot on the arms rising, the epilogue drop**; the fight camera is the presenter's | a fixed frame |
| CW8 | The ice | **the sourced epilogue only** (after the win: the ice goes, the fall, the fade); the mirror ice is a look, never a rule | the card's mid-fight crack (an addition: needs his yes, rule 10) |
| CW9 | The Guardians | **one Meshy Guardian model instanced twice**, real motions (`m213`) retargeted | two models; stand-ins |
| CW10 | Motion | **the game's real FFX banks, retargeted onto the Meshy rigs** (his brief); a Tidus motion clip is shown before the rest is built | Meshy library clips (generic, the pilot's weak motion) |
| CW11 | The aurora | **a procedural dome shader**; mock (b) a painted sky plate (one ComfyUI image, RIG-RECORD lock) with a shimmer beside it | the plate only |
| CW12 | Volumetric light | **layered shaft cards under the bloom**; the post pass only if a frame shows the need | the pass first |
| CW13 | The look of the models | **PBR under soft night lights** (card B: the Meshy file's own material kept whole), not toon, not cel | the Wind Waker toon or the anime cel (the engine has both; fur reads worse) |
| CW14 | Shipping | models under `public/models-exp/lake/`, files under 24 MiB, a verifier that refuses a release without them, a mirror and backup | dev-only like fayth-3d (not shipped) |
| CW15 | Story and results | **no lines of its own** (rule 6): the battle plays its fight, the epilogue plays without text, the results screen as a normal FFX win | a one-line epilogue caption (his words to write or approve) |
| CW16 | Music | stand-ins of section 8 | a new take |
| CW17 | The fight's tutorial | **none** (the game has none; the guide teaches the Guardians and the stance) | a banner in our own words (a gameplay addition: needs his yes) |

## 11. Review class, tracks, hosting

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/battle/common/types.ts,src/battle/ffx/**,src/data/ffx/**,src/engine/**,src/scenes/**,tools/dist-filter.mjs` was **not run** (treeless lane); by the Keeper and yrp preflights' reading the chapter registry, the shared combat core, the presenter and the build config each class a change **DEEP**, so expect **review DEEP, focused before deploy, live verification and the deep review after, obligations live + focused + deep**; not save-data class; a shared post pass (P9's dear option) would add the global-layout reading. The driver re-runs the command from the host. **Ship it in the release that carries the other hidden chapters** so it shares a deep review.

**Tracks (small vertical slices):** T0 engine checks (rows 3, 5, 7); T1 data and loot; T2 the AI and rules; T3 the build and the bench; **T4a the Tidus retarget pilot (P2, P3 for the Evrae trio) with a motion clip**; T4b the converter runs and Wendigo's clip map; T5 Meshy files (the cast, props; P4); T6 the 3D folder (P1, P13); T7 environment (P6 to P9); T8 camera and epilogue (P10, P11); T9 shipping (P5); T10 the integrator (shared tables, tests, the door-word re-check with `door-check.mjs`). **Host (PLAN §6, wave 5, driver's call):** `r395-int` after repointing, or the wave-3 tree that finished first; **repoint `public/art` to the newest mirror first, create `public/models-exp/lake/` (gitignored, like the art and the yrp models)**; a tree never creates or removes a junction itself.

**Serialisation:** every browser, GPU or ComfyUI job holds the one machine-wide lock (RIG-RECORD); a Meshy call spends credits and is logged in `cost-log.jsonl`; python only through a node wrapper; D: stays above 25 GB.

## 12. Size (Sonnet agent-hours, counted the way `ch-keeper-review.md` counts)

| | Plan | This preflight | Why |
|---|---:|---:|---|
| R research | 8 | **1** | both AIs read; a quarter of an hour of live checks and the clip-map build |
| B battle side | 16 (with the engine) | **11** | data and loot (S), the Wendigo and Guardian AIs (M + M), the stance and the hook (M + S), tests (M) |
| B presentation side | | **30** | the FFX 3D folder (L), the retarget tool (L), the ice, aurora, snow, shafts (M + M + S + M), the camera program (M), the epilogue (M), shipping (M), the budget and measuring (M) |
| A art and models | 10 | **12** | Meshy cast and props (a Blender clean-up pass each), the Wendigo redo, the sky plate if picked, cards |
| I integration and tests | 8 | **9** | the 12 to 15 shared tables (PLAN §7), the import-graph and shipping tests, the door |
| **Total** | **42** | **about 63** | a real 3D chapter with a tool and four environment modules: the plan's painted estimate does not apply |

## 13. Top risks

| Risk | Answer |
|---|---|
| **R1: the retarget looks wrong on a Meshy body** (proportions differ from the game's stylised figures; a stiff, floating or hunched pose; hands miss weapons) | the Tidus pilot, shown as a motion clip, is the first gate; per-clip error report; the foot lock; Meshy library clips as the named fallback (CW10) |
| **R2: the Wendigo reads as a generic yeti, the face of Tidus is soft, mixed fidelity** | CW5's redo and side-by-side frame; every character Meshy or none; the likeness items stay on the list rather than being waved through |
| **R3: files over the host's 25 MiB limit; GPU memory too big** | P4 and P14 (texture sizes, a triangle budget, a size gate in the verifier; a quality switch) |
| **R4: the Guardians' Berserk on the party during the stance is in no guide and the file is read, not run in the game** | T2 pins it; the first live check (section 14) looks for it on the real game if a Steam session is allowed (ask before taking the screen, per the standing rule) |
| **R5: Berserk and the stance interlock is subtle** (a Berserk Wendigo never raises its arms; the Guardians re-cast Berserk) | the interpreter's tallies are pins; the bench reports the line's actual turn counts |
| **R6: CHAPTER FRAMING and EYE CANDY fight the camera program and the HUD safe area** | the chapter opts out like the other hidden 3D chapters; the party is stood where the menu does not cover it (measured live) |
| **R7: a host file at the 400-line cap** | net-zero edits and side tables; shared edits left to the integrator |
| **R8: a post-chain pass for volumetrics is a shared change** | cards first; the pass only with a deep-review plan |
| **R9: the standing "AI 3D rejected" memory against this chapter** | superseded by his 2026-11-06 words for this chapter; every perceivable Meshy item is shown as a frame or a clip before it ships (rules 9 and the motion rule) |

## 14. Open questions, and the live checks that settle them (about a quarter of an hour each)

1. **Does a monster's item command stop after a steal?** (Eye Drops; RE §8.) One engine test.
2. **Is the stance's status property 61 set by command 0x403B, and do the Guardians read it as modelled?** One engine test; ideally one look at the real game (ask first).
3. **The first-turn order from the CTB start** (the Guardians, Wendigo, the party): the engine's `ctb-init`, one computation.
4. **Which theme the battle plays; the flags word; what a defeat does** (RE §8): not read.
5. **The program-to-clip map of Wendigo's bank** (the converter's work, P3), and whether the Guardian's `m213` bank covers a humanoid's idle, hurt, KO.
6. **The Meshy Wendigo against the game's size and design**: CW5 and CW6 frames.
7. **The in-game scale of Wendigo in the HD build** (26.4 engine height is the size table's reading).

## Corrections and findings (what the mapping turned up)

- The plan's "Guado Guardian m141/m213/m222": **only `m213`** is in this formation, twice (RE §0).
- **Jegged says the Guardians cast Haste and Berserk; the files have no Haste.** GameFAQs agrees with the files. **SG's prose "weak to fire" contradicts its own table; there is no affinity.** GameFAQs' "any damage Wendigo takes is countered with a Hi-Potion" is the Guardian's own reaction plus a 25 percent turn branch (RE §7).
- **A Berserk monster runs no script**: the guides' "remove Berserk" is the whole fight: a Berserk Wendigo throws one punch at x3/2 and never raises its arms.
- **The Guardians Berserk the party while the arms are up** (the file only).
- The card's mid-fight ice crack is an addition; the real break is the epilogue.
- The card's Wendigo is white and huge; the game's is blue and olive and 1.55 x Tidus.
- **The yrp precedent applies in full**: Meshy files over 25 MiB cannot ship (its Bahamut was left out for it); `models-exp` is gitignored; a release without the models is refused.
