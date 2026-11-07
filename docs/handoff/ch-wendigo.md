# Wendigo: the brute and its two Guado Guardians on frozen Lake Macalania (a hidden FFX chapter, number 49, the word `wendigo`): the battle side

**Branch `ch-wendigo`** (from `origin/r76-int` `d6895820c`, through the research note and the paper preflight `9bde6b2e5`), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX only** (AGENTS.md rule 14): the fight is the last one before the lake bottom, after the Temple; CTB, aeons, the FFX status set. FFX-2 has no counterpart and nothing here applies to it. The registry rows, the door row and the pinned lists are shared plumbing, "both" in kind (CHK-020), inert for every other chapter.
**Status (2026-11-07): the battle side is built (section 7) and measured (section 6) and the presentation lane has built the 3D stage on top of it ("Phase 3" below): a mirror-ice frozen lake under an aurora with the Meshy party, Wendigo and Guardians, the real FFX motions retargeted onto the party, a flying camera director and the ice-break epilogue, played from the title to the results by real keys on a GPU at 60 fps. Sections 8 and 9 below are the battle lane's and describe the stand-in the 3D stage replaced; where they differ, Phase 3 wins.** The chapter opens only by a typed word on chapter select and only on a desktop window. Listing it waits for Bailey's word. **Not deployed; shipping the models is not wired (P3.8).**
Written 2026-11-06 by a Sonnet sub-agent of the release driver (the Meshy tech-demo chapter, battle lane).

Authority: Bailey, relayed by the driver, verbatim: "make 1 brand new chapter using meshy extensively please", "like a tech demo"; "you can spend as much meshy credits as you see fit. use your own judgment."; 2026-10-18 the retail-assets rule was lifted; 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." **The driver's pick of the subject (his to overturn): card B, Wendigo on frozen Lake Macalania, FFX only, hidden Chapter 49, word `wendigo`, desktop only, every model by Meshy, the party moved by the real FFX animations retargeted onto the Meshy rigs.** Every other pick below is the paper preflight's recommendation (`docs/plans/ch-wendigo-review.md`) or the bench's, "driver's call, his to overturn"; the alternative is written beside it.

## Phase 3 (2026-11-07): the 3D presentation, the tech-demo look (FFX only)

Written by a Sonnet sub-agent of the release driver (the Meshy tech-demo chapter, presentation lane). **Nothing is deployed.** Where this section contradicts sections 8 and 9 below (the battle lane's), this section wins; those are left as they were written.

**Game case: FFX only** (rule 14). Everything here is staging (a lake, a sky, a camera, a fall of ice): no battle number, no data row (rule 6). The fight, the door, the data and the scripts are the battle lane's, unchanged. **No file of `docs/CONTRACTS.md` was touched and no shared 3D plumbing was changed** (the new engine folder *imports* the Bahamut chapter's pure clip sequencer and rim accent and the Wind Waker chapter's pure clip analysis, and edits none of them), so there is no `CONTRACT-CHANGES.md` entry.

### P3.1 What exists

| What | Where |
|---|---|
| The 3D stage (loaded on use through `import()`: no other chapter carries any of it) | `src/engine/lake3d/` (22 modules, none over 300 lines) |
| The scene factory (replaces the Temple stand-in; same scene key `wendigo-lake`, same `WENDIGO_LAKE_SLOTS`; `?lake=painted` still plays the stand-in, the comparison) | `src/scenes/wendigo-lake.ts` |
| The model set: ids, files, native heights, the weapon attach table, the four props | `src/data/ffx/lake-models.ts` (no imports) |
| The story's cues: the pre scene as it was, the post scene opening on white (the ice break is played in the battle, see P3.7) | `src/story/scripts/wendigo.ts` |
| The capture tool: a real-key GPU run that records stills, ten still views, one film with an event list, and the frame rate | `tools/lake-capture.mjs` |
| Tests (121 new) | `tests/unit/lake3d/` (9 files), two reworked cases in `tests/unit/chapters/wendigo-story.test.ts` |

The files of `lake3d`: `layout` (rigs, flights, arena, epilogue clock), `clipMap` (the party's pose plan from the kit's names; the monsters' action rows), `monsterRig` (the Wendigo's and Guardians' library clips: strike read from each clip's own motion, the stance as a state), `model` (a Meshy body fitted to a figure; the channels), `weapons` (the nine weapons on their nodes), `load` (the files parsed once and cloned; the front line eager, the bench in the background; a missing file is a neutral `capsule`), `skin` (the models on the battle's actors), `beats` (the shot director's beats told to the skin, with the director's hold for a long wind-up), `director` (the flying camera), `props` (the Meshy props), and the world: `stage`, `sky`, `ice` + `iceShader`, `snow`, `air` (volumetric shafts and mist), `crystals`, `shore`, `env` (the sky as the materials' environment), `look` (light and grade), `epilogue` (the ice break).

### P3.2 The picks (the driver's, his to overturn; each with its alternative)

| # | Pick (built) | Alternative |
|---|---|---|
| P1 | **The path is the Bahamut chapter's** (the stage's actors carry the models, painted planes off, the presenter's lunge and recoil move them; a scene factory that imports its engine on use), not the Wind Waker's toon pipeline and not the Fayth chapter's local-only retail path | the Fayth `ffx` skin (dev-only, local files, unlit): rejected, it cannot ship |
| P2 | **A real lit PBR look**: the Meshy materials kept whole (base colour, normal, metal-rough) under a cold moon key from the camera's left, a sky-and-ice hemisphere, an aurora-green rim from behind and the sky's still as the environment (`env.ts`); a neutral grade that encodes (gamma 2.2), bloom above any lit surface | a toon or painted grade (the Wind Waker chapter's): Bailey rejected plastic and toon for real models, 2026-10-22 |
| P3 | **The ice is a true planar mirror** (three's `Reflector`, half-float, 4x multisampled, 1280 x 720, drawn every frame), with a polished deep-teal body, plate boundaries, frost, glitter, a snowy shore and a reflection bent by a slow undulation | a baked cube reflection (cheaper, no figures in it); a screen-space reflection |
| P4 | **The sky is one shader**: indigo night, teal horizon, stars, a low moon, and three aurora curtains over the north (behind the enemies) with rays that stream | a painted sky plate |
| P5 | **Volumetric light shafts are analytic** (a view ray through a cylinder, chord length through the haze), four of them on the moon's slant, plus a low mist sheet | cards (the Wind Waker chapter's: sorting and edges) |
| P6 | **Props are the asset lane's phase-1 Meshy models** (crystal cluster, the ice cathedral for the Temple on the far shore, ice slabs, frozen reeds, a snow drift for the banks and the hill under the Temple), textures re-encoded to 2048 base and 1024 for the rest; the bench's four bodies re-encoded to a 2048 base too (68 MB of GPU each instead of 132); a few procedural hex spires on the far shore only | new Meshy props (30 to 35 credits each): none were needed. Procedural spires in the field: tried and taken out (flat pale prisms stood beside the Meshy crystals and read as untextured) |
| P7 | **Whoever stands on a layer falls with it** in the epilogue (the party on the innermost layer last, the brute's body earlier) | the party alone sinks |
| P8 | **The camera is flown**: a Catmull-Rom path through keys with its own lens and roll for the opening, the Double Punch, the arms going up, the Overdrives, and the win and the ice break (one 6 s flight); the presenter's own shots for everything else | only the named rigs |
| P12 | **The ice break is played in the battle, held at the close of the last blow, and the post scene opens on white** (P3.7: the story's post scene cannot show the lake) | a new `script-trigger` event from Wendigo's death hook running a `midScripts` scene (the engine side, a battle-lane change) |
| P9 | **The aeons stay painted billboards** (no Meshy aeon was made) | four Meshy aeons rigged and animated (each about 40 credits and a retarget job): the next lane's if Bailey wants it |
| P10 | **The board, the party prep and the cutscene card keep Chapter VII's Temple plate** (`data/art/artNamespace.ts` maps the scene to it) | a plate rendered from the 3D lake (an art-lane install) |
| P11 | **No story line, no music change** (CW15, CW16 unchanged) | his words |

### P3.3 How the stage is staged, loaded, disposed and gated

- **The seam** (the battle lane's, kept): scene key `wendigo-lake`, `WENDIGO_LAKE_SLOTS` (Chapter VII's layout B: the party at (0, 1.8), (-0.9, 0.2), (1.3, 0.9), the bench four spots off frame-left; Guardian A (1.0, -3.6), Wendigo (2.5, -5.8), Guardian B (3.6, -1.8)), the heights 2.71 and 1.89. `buildWendigoLakeScene` is a `SceneFactory`; `WENDIGO_LAKE_3D_STAGING` adds `noRigs` (a painted rig's parts are not planes the skin could hide). The actors are the presenter's own (`PaintedActor`, named by combatant id): the skin hides their painted planes and parents a model to each one's motion group, so the presenter's lunge, recoil, hop, squash, shake, fade and breath move the models, and the HUD's anchors, damage numerals and target cursor land on them. An actor with no model (the four aeons) stays the painted billboard it was.
- **Loaded on use.** Every `lake3d` module is an `import()` inside the factory, and the factory is reached only from the scene table: no other chapter's bundle or timing changes (`tools/orphans.mjs` finds none of the 24 modules orphaned). The glTF loader and `SkeletonUtils` come in through `load.ts`. The front line and the three enemies load before the fight opens; the bench follows one at a time in the background and a member is picked up the frame its model is in.
- **Disposed.** `dispose()` frees the director, the models (geometry, materials, textures, **the skeletons' bone textures**: the Bahamut chapter's YR-11), the props, the stage (sky, shore, the mirror's render target, shafts, crystals, snow, the environment cube, the white quad), the lights and the backdrop. A retry builds a new scene before the old one is gone; the debug handle `globalThis.__lake3d` (a dev server only) is left alone if it is a newer scene's. A leak check across five retries (the Bahamut chapter's J11) was **not run** (section P3.9).
- **Gated.** The door's `desktopOnly` gate is the battle lane's and unchanged (`chapterDoors.ts`, pinned by `r74-hidden-3d-phone-doors`): the chapter cannot be reached on the phone tier. `?lake=painted` plays the stand-in. A tree or build without the model files plays on neutral capsules (`load.ts`: a missing or unreadable file is said once and replaced); the capsule path is tested.
- **The frame, in order** (`wendigo-lake.ts` `update`): the lights, the world (`stage.update`: aurora, snow, shafts, mist, glitter), the director (the flight writes the camera), the epilogue's clock (its frame goes to the ice, the white quad, the models' fall), then the skin (attach, follow, clips). The battle camera's own update follows, so a flight is drawn with the camera's shake and punch on top.

### P3.4 The look (every number is in one table: `look.ts`, `sky.ts`, `iceShader.ts`, `crystals.ts`)

- **Light.** A cold moon key (`0xcfe4ff`, 2.6) from the camera's left and above, so the party's faces (turned toward the lens) are lit; a hemisphere (sky `0x4a78c4`, ice `0x2aa6b4`, 1.05); an **aurora rim** (`0x74ffb8`, 2.2) from behind and to the right that outlines the brute and the Guardians in green; the sky's still as the environment at 0.55 (`env.ts`). No shadow maps (the mirror and the actors' soft discs ground the figures).
- **The grade** is neutral and encodes (gamma 2.2): the game's chain ends in a grade that does not encode sRGB, so lit geometry would come out dark (the Bahamut chapter's finding); bloom threshold 0.92 (above any lit surface: only the aurora's brightest curtains, the moon, the ice's cracks and the crystals' tips glow), saturation 1.08, vignette 0.22, a trace of grain.
- **The ice** is a `Reflector` (half-float, 4x multisampled, 1280 x 720, every frame): a deep teal body, lighter where thin, plate boundaries (6.5 m plates, faint, fading with distance), frost, glitter, a snowy edge, the reflection bent by a slow undulation and smeared a little more with distance. Both the aurora and the moon are in it (the best picture of the stage is a low wide one: `v-ice-low-wide`).
- **The sky** (`sky.ts`): indigo night rising from a teal horizon, a jittered grid of twinkling stars, a low moon with a halo, three aurora curtains (base heights 0.12 to 0.28, rays 32 to 62, over +-74 degrees of the north) whose bases undulate and whose rays stream.
- **Snow** (`snow.ts`): 5,200 flakes in a 60 x 22 x 60 m box, all moved in the vertex shader, sized by distance.
- **Light shafts and mist** (`air.ts`): four analytic shafts (a view ray's chord through a cylinder, `1 - exp(-chord * density)`), faint, on the moon's slant; a low mist sheet that thins with the camera's height.
- **Props** (`props.ts`, Meshy): 9 crystal clusters, 8 ice-slab piles, 10 frozen-reed stands, the ice cathedral on a snow hill 112 m north, 14 snow banks along the ice's edge; the shore is 220 x 70 vertices of snow and rock, mountains to about 60 m in the north.

### P3.5 The motion

- **The party plays the real FFX battle kit** retargeted onto the Meshy rigs by the asset lane, on the Bahamut chapter's sequencer (`yrp3d/clips.ts`, `clipSequencer.ts`), through a plan table built from the kit's names (`clipMap.ts` `partyPlans`): idle `idle1` (a phase of its own per figure), the hit `dmg1`, the kneel at low HP `weak1_00..02`, the fall `dead_00..02`, the attack as the game's parts (`attack1_00..03`: the run-in and strike, then the return; Lulu has three), a cast `magic2_00..02`, an item `item_00, item_01, item_02_1`, the victory `win_00, win_01`. An attack plays the end of its entry at the speed that puts the strike on the blow (the presenter's lunge, 0.26 s), then the return. The weapons hang from the game's own weapon nodes (`Hook_R`, `Hook_L`), so each is held the way the game holds it in every clip.
- **The Wendigo and the Guardians play Meshy library clips** (the real m212 and m213 banks are not mapped): `monsterRig.ts` reads each action clip once for its **strike** (where its bones turn fastest after the wind-up) and starts it so the strike lands on the blow; because those clips are 2.5 to 3.5 s of wind-up, swing and recovery, the director holds the presenter's lunge for the wind-up (at most 1.1 s, never at skip speed). Rows: the Punch, the plain Attack and the Counter Punch are `attack`, the Double Punch `combo`, every spell, potion and eye drop `cast`, hit `hurt`, fall `ko`. **The arms**: `wendigo-raise-arms` plays `arms_up` into a held `stance_block1` (kept through its counter punches), `wendigo-lower-arms` plays `stance_block2` into the idle; the fall drops the stance. These are library Block and Cheer poses standing in for the game's arms-up stance.
- **Flash, glow, tint, stone, fade.** A hit's flash, a heal's colour and a cast's glow ride the actor's own channels as a **rim accent** (the Bahamut chapter's `rim.ts`: a flat emissive turned a dark body into one gold silhouette in the first GPU run), a petrified figure goes grey and stands still, a fading Guardian goes transparent.
- **Known limit.** The stance is driven by the two moves' beats; a Sleep that ends the stance with no action event (the battle lane's open reading, section 4) leaves the model's arms up until the next lower.

### P3.6 The camera (`director.ts`, `layout.ts`)

| Beat | Flight |
|---|---|
| battle start | **The opening**, 6.6 s: out of the aurora (26 m up, 30 m back), down over the shore, skimming the ice at knee height past the party and rising to the idle frame, which it ends on to the digit. The scene parks the battle camera on the first key as it is made |
| the Double Punch | a quick low swing round to the target's side, 1.5 s (the beat is released at 0.7) |
| the arms going up | a slow push in and tilt up the brute, 2.2 s |
| an Overdrive | a half circle round the caster and up, 2.4 s |
| the last foe's fall | **the win and the ice break**, 6 s (P3.7) |
| every other beat | the presenter's own shots |

The flight is written into the battle camera as a rig of its own every frame (`fly`, no sway) and snapped to, with the dutch roll; if anything else moves the camera meanwhile, the flight ends at once. REDUCE MOTION and skip speed take no flight. The eye never goes below 0.5 m (the spline between a high key and a low one undershoots).

### P3.7 The ice break, and what the story's scenes can and cannot show

**Finding (the battle lane's section 9 was wrong about this):** the pre and post scenes run on their own screen (`CutsceneScreen`) over the chapter's painted plate; its camera port is empty, so `camera('ice-break')` between `camera('victory')` and `results()` would move nothing. The first GPU run showed the pre scene as the Temple's plate with its card. So the ice break is played **in the battle**:

1. At the close of the action after which every foe is down (the three actors fallen, faded or stone: `isDown` in the scene) the director starts the break **and holds that beat's answer until it is over**; the presenter awaits that beat, so the victory beat, the results and the post scene follow under the white.
2. The break is the field event's own list (RE 2), in `epilogue.ts` (pure, tested): a **magic effect** (a ring of cold light runs out from under the party, fine glowing cracks grow out from the same place), the **twelve ice layers** (twelve concentric bands, the outermost first: each shatters cell by cell, a Voronoi discard in the ice shader, and falls as 552 instanced shards, showing dark water with a slow caustic), the **camera shakes twice** (1.5 s and 3.7 s, the second harder; not under REDUCE MOTION), and the **fade to white** (a quad in clip space from 4.9 s). **Whoever stands on a layer falls with it** (`sinkFor`): the Wendigo's body on its layer, the party on the innermost one, last, as the white comes up. The party takes its victory poses on the cracking ice (`skin.celebrating`).
3. The post scene opens with `fade('white', 0)`, holds 0.9 s (the warp to the lake bottom is not ours) and goes to the results; the pre scene is unchanged but for a shorter wait.
4. A win with no such close (a foe petrified, say) starts it at the `victory` beat, which the presenter does not await, so it plays as long as the screen lasts (about 2 s of its 6) and the post scene's cut to white ends it.
5. At skip speed nothing plays. Alternative not built: a `script-trigger` event from Wendigo's death hook running a `midScripts` scene (the engine side).
6. **Seen in the GPU run** (the film, `6-ice-break`): the ring of light and the glowing cracks, the layers falling away with their shards over dark water, the party in victory poses until their layer goes, the white. **The battle HUD stays up** during the break (the presenter hides it only for the opening and Overdrives, and that hide is `protected` in `BattleMomentsBase`; a one-line additive `hud` field on `ShotCtx` would let the director hide it: not done, it is shared presenter plumbing).

### P3.8 Delivery, Meshy and what the build needs

- **Meshy spend this phase: 0 credits** (the balance the asset lane left, 2,570, is unchanged; not re-read). Nothing was missing: the props are the asset lane's phase-1 models, re-encoded locally by its `tools/glbtex.mjs` (2048 base, 1024 for the rest; five files, 1.9 to 6.0 MB), and the bench's four bodies got a 2048 base (8.4, 7.3, 8.0 and 8.7 MB, 68 MB of GPU each instead of 132). **Not made, would cost:** the four aeons (about 40 credits each plus a retarget job, and the paintings they would come from are action poses, not A-poses).
- **The files** (`public/models-exp/lake/`, gitignored, never committed): 10 bodies (7.3 to 13.9 MB; 97.6 MB), 9 weapons (1.3 to 2.5 MB; 17.1 MB), 5 props (19.0 MB): **24 files, 133.7 MB, the largest 13.9 MB (the host's file limit is 25 MiB)**. `LAKE_SHIPPED_FILES` (`data/ffx/lake-models.ts`) is the list. **Shipping is not wired** (as the battle lane said): a release build's `tools/dist-filter.mjs` drops `models-exp/**` but the two shipped sets, so today a build plays this chapter **on capsules**. The yrp pattern is the recipe: an allow-list from `LAKE_SHIPPED_FILES` in `dist-filter.mjs`, a verifier like `tools/yrp-models-verify.mjs` run by the deploy before the build is hashed (refuse a build that has none), a mirror and a backup of `public/models-exp/lake/` (the files exist once on this PC and in the asset lane's scratch), and the `rig-deploy-dry` fixture copying the import-free data file. The retargeted clips and hook rotations carry the game's own motion data (the retail-assets rule was lifted 2026-10-18).
- **The weight to a player** (estimates, not measured in a browser): about 100 MB to fetch before the fight opens (six bodies 59 MB, nine weapons 17, five props 19) and 40 MB more in the background; about 1.4 GB of GPU memory by the asset lane's own estimates (bodies 6 x 132 + 4 x 68, props 5 x 34, weapons about 220) plus the mirror's target (1280 x 720 half float, 4x multisampled) and the sky's cube. Desktop only, and no other chapter pays any of it. The scene factory's own time to hand the scene back on this PC, from a warm dev server and local files, was **1.9 s** (`__lake3d.timings`: imports 29 ms, backdrop 119 ms, models and props 1,900 ms).

### P3.9 Measured and checked

**The frame rate** (`tools/lake-capture.mjs --fps-only`, headless Chromium on the RTX 5070 Ti through ANGLE D3D11, 1600 x 900, the battle HUD hidden, `requestAnimationFrame` deltas in the page; **the PC was at 99 percent CPU the whole time** from other lanes' reviews and this lane's own full test suite, so these are the worst case):

| Window | At the display's own pace (vsync) | Uncapped (headroom) |
|---|---|---|
| the opening flight (729 frames) | 55.2 fps mean, 99th percentile 16.8 ms, 1.0 percent of frames over 20 ms (the first frames of the fly-in compile their shaders) | 383 fps (2.6 ms) |
| the fight: attacks, spells, the stance (1,839 frames) | **59.0 fps**, 99th percentile 16.8 ms, 0.9 percent over 20 ms | 315 fps (3.2 ms) |
| the win and the ice break (760 frames) | **60.0 fps**, 0 percent over 20 ms | 520 fps (1.9 ms) |

The target (60 fps at 1600 x 900) holds, with a 5 times margin on the page's side of the frame; the GPU's own time is not separated from the page's (no timer query was taken). The 1 percent over 20 ms are single stalls (a shader compiled on first use).

**The real-key GPU run** (`tools/lake-capture.mjs`, five runs; the last two stills and a film): title, board, the typed word, prep, the pre scene, the opening flight, the first menu, a party attack (Rikku, Tidus, Yuna), the Guardians' Berserk, Thundara, Auto-Potion and Protect from the dead, Wendigo's plain attack, **the arms going up and the counter punch on a physical hit**, the win by real keys and the ice break, the results. Every command is a real key; the engine's HP was edited by the debug API (party kept up; Wendigo set to 8,000 for the stance; the enemies to 1 HP for the last blows). **No console error and no failed request in any run**; the only console output is a D3D shader compiler **warning** (X4122, a constant fold in one program: not a failure, not chased).

**Tests.** `npx tsc --noEmit` clean. New: 121 in `tests/unit/lake3d/` (`layout` 14, `epilogue` 9, `clips` 18, `load` 13, `props` 7, `skin` 13, `director` 23, `world` 19, `env` 5: the numbers, the shaders' uniforms, every smoothstep's edges in order, the clip plans, the monster rig on synthetic clips, the loader on a fake file reader incl. capsules, weapons on their nodes and freed skeletons, the director against a fake camera, the actors' private parts, the epilogue's clock and fall, the sky environment on a stand-in cube generator) and the story test's two reworked cases. **Three list pins now carry the chapter** (nothing loosened): `art-url-sources` (`scenes/wendigo-lake.ts` may read the base path, as the three other hidden 3D scenes do), `ffx-local-guard` (the disk scan lets `models-exp/lake/` through as the third hidden-chapter folder, and the importer scan skips `src/engine/lake3d/` as it skips `yrp3d/`: both have a `clipMap.ts` of their own). The Wind Waker, Anime, yrp and Fayth chapters' own tests (`exp-windwaker`, `exp-anime`, `exp-yrp-3d`, `exp-yrp-3d-scene`, `exp-fayth*`, `ww3d`, `yrp3d`, the five door suites, `chapter-doors`) ran green apart from the failures explained below. **The full suite** (`npx vitest run --maxWorkers=3`, 2,072 files, 5,000 s on a PC at full load): 8 files and 14 tests failed, 32,269 passed, 582 skipped; every failure explained:
- `ffx-local-guard` (2) and `art-url-sources` (1): the list pins above; **fixed here, green**.
- `lake3d/props` (4) and `lake3d/load` (1): this lane's own files, edited while the suite ran (the drift prop and the skeleton test arrived mid-run); **green on rerun** (121 of 121).
- `ww3d/anime-files` (3) and `ww-models-tool` (1): **not this branch's**, the same four the battle lane found: they read the anime chapter's Meshy files on this disk and find them different from the recorded hashes and proportions (`tools/ww/ww-models.json`); no file of this diff is theirs.
- `windwaker-door` (1) and `valefor-door` (1): the "first word to finish wins when two are typed in a row" cases mount three real boards per door; their allowance is 15 s a door (`DOOR_PAIR_TEST_TIMEOUT_MS`, now about 28 doors = 420 s) and they took 402 s and 463 s on a PC at full load; `fayth-door`, the same test, passed in the same run (215 s) and failed in an earlier one (424 s). **Time-limit failures under load, not behaviour**; they were not run on the base.
`node tools/orphans.mjs`: 24 orphans, none new (no `lake3d` module orphaned).

### P3.10 Open issues (named, not hidden)

1. **Bailey's eye is owed on all of it** (rule 9 was met by the driver's delegation, not by a mockup): the look, the camera, the monsters' library motion, the arms stand-in, the white. The film and the contact sheet are the pictures to judge.
2. **Shipping is not wired** (P3.8): a build plays this chapter on capsules until the dist filter, the verifier and the deploy gate know the 24 files.
3. **The battle HUD stays up during the ice break** (P3.7 item 6).
4. **The aeons are painted billboards** on the mirror (summoning one shows a flat painting on the 3D lake).
5. **The board, the prep wash and the story's cards still show Chapter VII's Temple plate.** A plate rendered from the 3D lake (the capture tool's stills are the source) is an art-lane install.
6. **No leak check across retries** (the Bahamut chapter's J11: lose and retry five times, read `renderer.info.memory`): disposal is complete by reading and by the unit tests (skeletons included), not proved in a browser.
7. **Sleep ending the stance** leaves the arms up until the next lower (the battle lane's open reading, section 4, item 4); a `?lake=painted` fight is unaffected.
8. **The Wendigo's and Guardians' motion is generic library motion**; the m212 and m213 banks are unmapped. The model's hands are lax (no finger bones) and the stance is a stand-in.
9. **Not measured:** the real GPU memory and the real download over a network; the GPU's own frame time.
10. **A D3D compiler warning** (X4122) is logged once per run by one program (not identified).
11. **Carried from the battle lane:** the audition-page entry for the stand-in cues, the loot records and the gear drop, and `NOW.md` (the integrator's).
12. **Two process slips of this lane** (no harm): a dev server was first started with a shell `&` and stopped by its PID; two scratch files were written with a shell heredoc.

### P3.11 The clips and the sheet (for Bailey; scratch, nothing from them is committed)

In the lane's scratch folder `wendigo-p3/for-bailey/` (outside the repo; 1600 x 900, H.264, no sound, each under 10 MB; the battle HUD hidden, a real fight by real keys): `1-opening-fly-in.mp4` (8.2 MB, 8.9 s: out of the aurora, over the shore, skimming the ice past the party to the idle frame), `2-party-attack.mp4` (5.9 MB: Rikku's and Tidus's attacks with the presenter's hit effects), `3-wendigo-attack.mp4` (6.7 MB: the wind-up, the swing, the hit), `4-guardian-turn.mp4` (5.9 MB: Berserk and Thundara), `5-win.mp4` (6.1 MB: the last blow, the party's victory poses, the orbit, the first cracks), `6-ice-break.mp4` (3.0 MB: the layers, the shards, the dark water, the white), `7-bonus-arms-up.mp4` (6.6 MB: the stance and the counter punch), and `contact-sheet.jpg` (three frames of each).

**Stills committed** (`docs/screenshots/ch-wendigo/`, 1600 x 900, a real-key GPU run): `p3-first-menu.jpg` (the first menu with the HUD), `p3-first-menu-nohud.jpg` (the same frame without it: the party on the mirror ice, the Guardians and Wendigo among the crystals, the temple on its hill), `p3-opening-fly-in.jpg` (the opening flight, high over the lake), `p3-ice-low-wide.jpg` (the low wide shot: the reflections, the aurora, the sun disc in the mirror), `p3-wendigo-close.jpg` (Wendigo close, fur and the real model), `p3-ice-break.jpg` (the ice break under the HUD: the plates and the lit cracks).

## 0. What changed against the preflight (read first)

1. **The `onDeath` hook for an ordinary monster already existed** (the Penance chapter added `ScriptHooks.onDeath`, run by `hp.ts#koActor` for any script that has one), so no new hook was needed. What was missing is **a command of the dying monster**: the reaction drain dropped any reaction whose owner was not alive. `Reaction` gained the optional `ownerMayBeDead` (opt-in; every other dead-owner reaction is dropped as before) and the Guardians cast Protect or Shell on Wendigo as they fall. CONTRACT-CHANGES has the entry.
2. **The Berserk x3/2 did not apply to a monster with a recorded plain Attack.** Found by running the engine (T0, rule 3): a Berserk Wendigo hit Tidus for 1,736 to 1,960, a third under the note's 2,604 to 2,940. The adapter passed the party's 0x3000 as every user's default attack; `defaultAttackIdOf` now uses the monster's own plain Attack record when it is the monster's forced-action word (Wendigo's 0x4000, Sinspawn Gui's 0x6000). Everything else is unchanged. The note's arithmetic and the engine now agree to the unit (40 seeds).
3. **The first-turn order is answered** (open question 3): at the CTB start Rikku (27 ticks a turn) and Tidus (30) act first, then the two Guardians (30) and Wendigo (33), then Yuna (39). **Nobody acts before the first menu, on every seed of 1 to 100**, so Auron's line at the first menu is the party-first one (`ui/coach/turnOrderLine.ts`).
4. **One Petrify Grenade reaches both Guardians** (the item is a group item; the Guardians' Petrify byte is 25 and the grenade's chance byte 254, which lands on anything below 255): **200 of 200 seeds**. A petrified Guardian is no death: it casts no last shield, drinks no potion, casts no Berserk. It still pays when the fight ends (the engine counts it defeated). This is the sourced answer the guides name ("unless through Petrification", "Petrify Grenades x4 in the bag").
5. **The 1.55 x Tidus is the drawn height** (28.07 against 18.15), not the stored design height E (26.4, 1.45 x): the research note's first draft called 26.4 the 1.55. The note is corrected; the Guardian is 19.58 (1.08 x), E 20.0.
6. **The size estimate fell for the battle side** (the preflight's 11 agent-hours): the Temple Guardians' helpers, the forced Berserk turn, the preset and the formation command disables existed; the new work was the two scripts, the stance, the data, the guide and the bench.

## 1. Play it

1. From the title, reach the chapter-select board **on a desktop window**. Type **`wendigo`** (any case, letters at most 2 s apart; the board shows no hint). It opens the chapter's party prep itself, with no card and no sound before it. **On the phone tier the door stays shut** (decision 219q, the fourth hidden 3D chapter: `yrp`, `waker`, `gear`, `wendigo`).
2. Enter starts the chapter: a silent pre scene (a fade in), then the fight, the post scene and the results page. The party is Tidus, Yuna and Rikku in front (the Macalania preset's own; Wakka, Auron, Lulu and Kimahri on the bench, Valefor, Ifrit, Ixion and Shiva in the roster). **Escape and Flee are off for everyone; Switch and Summon are not.** A defeat is the retry card.
3. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration.

## 2. What it is

Eighteen thousand HP, STR 40, no Defense and no weakness; a punch of 1,634 to 2,015 against cells of 850 to 1,900 HP, so **a member dies to a blow unless the blow is weakened**. Two Guado Guardians keep it that way.

| Wendigo's turn (every 33 ticks) | What it does (the game's own script, RE 4.2) |
|---|---|
| above half HP | 1 turn in 3 the **Double Punch** (power 24, never misses) on the **lowest-HP** member; else the **Punch** (power 16, accuracy 120) on a random living member |
| below half HP (strictly under 9,000) | a **seven-turn cycle**: **arms up** (the raise turn and the next two: nothing), arms down, then **three attack turns** (1 in 3 the Double Punch, else the plain Attack, accuracy 90) |
| arms up | every **physical** hit on it (the Attack, Dark/Sleep/Silence Attack, the four Breaks, Delay Attack and Buster, Aerospark, Sonic Wings) is answered by the **Counter Punch** (power 20, never misses) on the attacker, **unless an aeon holds the field**; spells, Steal, Threaten, Provoke, Lancet, Jump, Spiral Cut, Cheer, Focus and every Overdrive are not answered |
| Berserk or Provoked | **no script**: the forced plain Attack, at x3/2 under Berserk (2,604 to 2,940 on Tidus); it never raises its arms or throws the Double Punch |

| The Guardians (1,200 HP, AGI 20, MAG 14; two of them; RE 4.4) | |
|---|---|
| Wendigo blind | **Eye Drops** on Wendigo (not once stolen from: GameFAQs; the script has no test, see section 4) |
| Wendigo's arms up | **Berserk on a party member** who is not Berserk yet (the file only: in no guide) |
| Wendigo Berserk | 37.5 percent Thundara, 37.5 Blizzara (240 to 333), 25 percent **Auto-Potion on Wendigo** (+1,000); stolen from: 62.5 Blizzara, 37.5 Thundara |
| otherwise | **Berserk on Wendigo** (it lands: Wendigo's byte is 0) |
| hit | **Auto-Potion on itself** (+1,000) unless stolen from, asleep, Threatened, or the hit was a Berserk cast |
| falls | the first casts **Protect** on Wendigo, the second **Shell**, from the dead; not if Petrified, not if Wendigo is dead |

Rewards: Wendigo 3,000 gil, 2,000 AP (3,000 on an overkill of 1,432), a Power Sphere (two on an overkill), steals Hi-Potion or X-Potion; each Guardian 480 gil, 290 AP (580), an Ability Sphere (two on an overkill). **The design fact:** the fight is about **controlling Wendigo's state while the Guardians keep resetting it** (Berserk on or off, arms up or down, buffs, blind or not, the Guardians alive, robbed, stone or dead); damage is secondary (18 Auron swings, 15 Fira casts, no weakness).

## 3. The data and its sources (rule 6: nothing invented)

Every number is `research/re-ffx-wendigo-lake-macalania.md` (the game's own files: monster files `m212` and `m213`, formation `maca02_01`, the Atel scripts run in the earlier lanes' interpreter; "RE n" in the files), tagged `[bytes]`, `[run]`, `[arith]`. The eight rows are pinned **word for word** to the kernel fixtures `tests/fixtures/parity/ffx/command_records.json` and `command_status.json` (rows 0x407F, 0x4080, 0x4062, 0x403B, 0x4063, 0x400F, 0x4010 and the item row 0x200C) by `tests/unit/chapters/wendigo-data.test.ts`. The plain Attack is the game's row 0x4000 (accuracy 90); the Guardians' Blizzara, Thundara, Protect and Shell are the player's own rows by their ids. **Rule 5:** the Double Punch, the Counter Punch, Berserk, Auto-Potion and Eye Drops have accuracy formula 0 and never roll (`canMiss: false`); the Punch and the plain Attack roll (120 and 90). **The stance** is the engine flag `wendigo.arms` (the game's status property 61 and its script's `v5`), with `wendigo.armTurns` (`v6`) and `wendigo.cycle` (`v7`); the Guardians, the tactic and the stage read it.

**Gaps, named (not invented):**
- **The gear drop** (50 percent: Counterattack and Piercing weapons, SOS Haste and HP +10 percent armour per the guides) is not modelled: the ability codes 0x8003, 0x800B, 0x805B and 0x8073 are not decoded, and the loot records of `m212` and `m213` are not in `loot/records.ts` (their digests are not in the repo); the engine pays the fields above as a record of the same shape.
- **The party** is the Macalania preset (`[estimate]` over a sourced build point, a few chase battles before this fight); the bag, the gauges and the armour abilities at this exact point are not sourced. Nothing was tuned toward a result.
- **A Provoked Guardian** (forced-action word 0x3047, Thundara in the game) throws the engine's one generic Attack (STR 1), as every monster's forced turn does here; the word only decides whether there is one.
- **Which theme the battle plays, the flags word and what a defeat does** (RE 8): not read; the chapter treats a defeat as the normal retry card.

## 4. Engine work and what the T0 checks found

The preflight's rows, as built:

| # | Need | What was done |
|---|---|---|
| 1 | records, rows, loot | `data/ffx/enemies/wendigo.ts`, `wendigo-abilities.ts`; the records word for word; rewards as fields |
| 2 | Wendigo's turn | `battle/ffx/ai/wendigo.ts`, `wendigo-rules.ts` (the three states, the seven-turn cycle, the lowest-HP selector with the group builder's wasted picker draw) |
| 3 | the stance and its counter | the same files: a flag, the damage type read from the command's own record (`damageTypeOf`), the aeon test, Threaten and reaction gates |
| 4 | the Guardians | `battle/ffx/ai/lake-guardian.ts` (a sibling of the Temple's, not a copy) |
| 5 | a death handler | **existing** `onDeath`; **new** `Reaction.ownerMayBeDead` (section 0, item 1) |
| 6 | a Berserk Wendigo runs no script | **existing** `forced-turn.ts` (forced-action word 0x4000 added); **new** the x3/2 fix (section 0, item 2) |
| 7 | a monster using an item (Eye Drops) | an ability row with the item's record (rank 2); after a Steal the Guardian passes its turn (GameFAQs wins what the file does not settle; the engine's own rule is unread) |
| 8 | formation | data: Escape and Flee off for everyone, Normal start, music a stand-in |
| 9 to 11 | party, HUD, plumbing | the Macalania preset unchanged, no new command, the registrations of the CONTRACT-CHANGES entry |

**T0 findings (each pinned by a test):**
1. **A Berserk Wendigo's blows now equal the note's arithmetic** (2,604 to 2,940 on Tidus, 2,638 to 2,979 on Rikku, 2,677 to 3,023 on Yuna): section 0, item 2.
2. **The exact tallies hold on the real script:** 21,846 of 65,536 the Double Punch above half HP and in the attack phase below it (at 18,000 and at exactly 9,000), the seven-turn cycle (turns 1 to 14 as the interpreter's), the half line strict and on the integer half, the Guardians' branches over all 131,072 draw pairs (25 / 37.5 / 37.5 and 62.5 / 37.5 once stolen from), Wendigo dead 32,768 each.
3. **The counter table matches the interpreter's 35 commands** on the real command rows: twelve physical commands answered, eighteen others not, an aeon on the field silences it, Threaten and a reaction in progress stop it.
4. **Open reading, followed as the note has it: Sleep ends the stance.** The Evrae lane read `isCounterattackAllowed()` as false for a sleeper, which would make the note's Sleep branch unreachable; the Wendigo note's run treats it as live. The hook's own gate here lets a sleeper through (every other refusal still refuses), and a **physical** hit wakes a sleeper before the hook runs (`hit-apply.ts`), so the branch is reached by a magic or status hit on a sleeper. **One look at the real game settles it (ask first).**
5. **Open reading: Eye Drops after a Steal.** GameFAQs says a Steal stops them; the file's branch has no steal test (the test is on the Auto-Potion branches). The Guardian passes its turn; pinned, with the other reading one line away (`lake-guardian.ts`).
6. **The stance flag is set when the script chooses Raise Arms**, a few ticks before the game's status write (RE 8: the write was not read). Invisible except to a Sleep in between.
7. **The group builder spends a picker draw nobody uses** when two or more members live (`findMatchingChr` twice for the lowest-HP pick): reproduced (`script-random.ts#drawPicker`), pinned (`wendigo-ai.test.ts` "draws the way the script does").
8. **A petrified Guardian pays.** The win paid 3,960 gil and 2,580 AP with both Guardians stone (3,000 + 2 x 480; 2,000 + 2 x 290): the engine counts a petrified monster defeated.

## 5. The picks (the driver's, his to overturn; each with its alternative)

| # | Question | Pick (built) | Alternative |
|---|---|---|---|
| CW1 | number and word | **49, `wendigo`**, not listed, desktop only (the door test pins 24 words; `wendigo` overlaps none, in any position) | any word that passes the door test |
| CW2 | scope | **the Wendigo fight (`maca02_01`) with its two Guardians** | add the Crawler and Negator fight (`maca02_00`) as a second act |
| CW3 | front line | **Tidus, Yuna, Rikku** (the preset's), bench Auron, Wakka, Lulu, Kimahri: the bench says both lines win 100 percent (section 6) | Tidus, Auron, Rikku (one line in `builds/wendigo.ts`) |
| CW4 | build | the Macalania preset with Shiva and four aeons, unchanged | none |
| CW5, CW6 | Wendigo's look and size | the next lane's; the stand-in is a procedural silhouette at **1.55 x Tidus** (drawn height, corrected) | the card's giant |
| CW8 | the ice | **the sourced epilogue only** (after the win; the next lane's); no mid-fight crack | the card's mid-fight crack (an addition: needs a yes) |
| CW15 | story and results | **no line of its own**: the pre and post scenes are silent (`story/scripts/wendigo.ts`) | a one-line caption (his words) |
| CW16 | music | scene bed `scene-macalania-temple`, battle cue `boss-challenge`, victory `victory-ffx`: **flagged stand-ins** (the game's battle theme is not read; rule 13: Bailey's ear) | `boss-seymour-macalania`, or a new take under the delegation (a spend note, rule 11) |
| CW17 | the tutorial | **none** (the game has none; the guide teaches the Guardians and the stance) | a banner in our own words (a gameplay addition: needs a yes) |
| new | the advisor's line | Petrify Grenade first, then Power Break and Dark Attack by Switch, Protect, no swing while the arms are up (section 6) | the Steal-and-kill line (wins 200 of 200 too, in 1,291 ticks against 786) |

## 6. Difficulty: measured, not tuned (rule 15)

`tests/unit/chapters/wendigo-bench.test.ts` (11 tests, 100 seeds a cell for the lines that carry the claim, 60 for the ablations), the harness `tests/unit/helpers/wendigoBot.ts` and the tool `node --experimental-transform-types tools/wendigo-bench.mjs --seeds 200 --tactic`. **No boss number was touched**; the levers (in the preflight's order: the Phoenix Down and Hi-Potion stock, Yuna's Protect and Shell, the front line, the Petrify Grenades) were not needed. A *line* is a scripted player that reads only what a player reads: **careless** (everyone Attacks Wendigo), **plain** (care and Attack), **advisor** (the sourced line), and the advisor with one piece removed.

**The table of record, 200 seeds a cell (seeds 1 to 200), no god mode, Tidus, Yuna, Rikku in front:**

| Line | Wins | Defeats | Wendigo HP at the end (median) | Ticks (median) | Wendigo turns a fight | KOs a fight (median) |
|---|---:|---:|---:|---:|---:|---:|
| careless | **0 / 200** | 200 | 17,674 | 106 | 3.9 | 3 |
| plain | **0 / 200** | 200 | 17,541 | 964 | 30.1 | 21 |
| **advisor** | **200 / 200** | 0 | 0 | 786 | 25.9 | 2 |
| the shipped line (the registered tactic through the generic ladder) | **200 / 200** | 0 | 0 | 786 | 25.9 | 2 |
| no Petrify Grenade (Steal and kill instead) | 200 / 200 | 0 | 0 | 1,291 | 39.2 | 3 |
| neither Grenade nor Steal | 60 / 200 (30 percent) | 140 | 14,935 | 1,824 | 56.5 | 20 |
| **no Power Break** | **10 / 200 (5 percent)** | 190 | 4,790 | 1,525 | 45.0 | 20 |
| the front line only (no Switch: no Power Break, no Dark Attack) | 0 / 200 | 200 | 8,765 | 1,064 | 33.0 | 20 |
| no Dark Attack | 200 / 200 | 0 | 0 | 1,054 | 33.6 | 5 |
| no Protect | 200 / 200 | 0 | 0 | 948 | 29.6 | 10 |
| no wait while the arms are up | 200 / 200 | 0 | 0 | 634 | 24.4 | 2 |
| an aeon while the arms are up | 200 / 200 | 0 | 0 | 687 | 17.1 | 3 |

The advisor over **1,000 seeds: 1,000 of 1,000**. On Tidus, Auron, Rikku in front (the preflight's alternative): advisor 200 of 200, **no Power Break 181 of 200 (90.5 percent)** (Auron's 1,900 HP survives a blow), careless and plain 0 of 200. **The preflight's target is met** (the sourced line 90 percent or more, an unmanaged line losing almost always: 0 of 200).

**What that says, plainly.** (a) **The preflight's predictions held:** an unmanaged front line is dead in a round (the careless line: 106 ticks, three KOs, Wendigo untouched); the one-shot damage is the whole problem. (b) **Power Break is the mover** (halving everything: with Protect a punch is 408 to 503 and the Double Punch 612 to 755, so a member lives through one); without it the same line wins 5 percent. **The Switch is the second:** the preset's three alone cannot do it (0 of 200); Auron and Wakka are one Switch away and a switched-in member acts at once. (c) The Petrify Grenade makes the fight faster and safer, not winnable by itself. (d) Protect, Darkness and the wait while the arms are up are comforts: each removed, the line still wins every seed (the arms' counter is survivable under Power Break and Protect). (e) **The fight is easier than the preflight feared for a player who knows it**, and exactly as lethal as the note says for one who does not. **Not tried (named):** Threaten, Provoke, Sleep Attack, Kimahri's Stone Breath, Lulu's Fira, Ixion's Aerospark, the Overdrives, the Steal's X-Potion, a Wendigo that is left Berserk with the Guardians stone.

## 7. The browser job (written before the run; what the run said)

Headless Chromium from node, `PYREFLY_BROWSER=gpu`, a dev server on port 5441 started and stopped by PID, the machine-wide browser lock taken by the tool, `node tools/fx-assets.mjs ensure` first; `node tools/wendigo-smoke.mjs --base http://127.0.0.1:5441/ --tag desk`. The party's HP is kept up by a state edit through the debug API (said so), the enemies' HP set to 1 for the last blows; **every command is a real key press**. **Predictions:** every check passes; the first screenshot shows Wendigo's procedural silhouette between the Temple's Guardians at 1.55 x Tidus; the first menu's NEXT BEST MOVE card names the Petrify Grenade; no console error; no 4xx other than the missing Wendigo painting.

**The run (2026-11-06, 1600 x 900, GPU): OK on every check.** The board has no card; the word `wendigo` opens party prep; Tidus, Yuna and Rikku open on Wendigo 18,000 and two Guardians at 1,200; the Guardians' first spell is Berserk on Wendigo and Wendigo's first action is the plain Attack; **the first Guardian to fall cast Protect on Wendigo from the dead** (the shield icon appears beside the Berserk icon); Wendigo falls; the results page reads Victory, AP 2,580, gil 3,960, Ability Sphere x2, Power Sphere; **no console error and no 4xx or 5xx at all** (the presenter draws the missing Wendigo painting's silhouette without a request). Screenshots: `docs/screenshots/ch-wendigo/desk-*.jpg` (the board, party prep, the first menu with the Petrify Grenade card, the opening, the shield, the results).

## 8. Stand-ins and what is a draft (listed)

| What | State |
|---|---|
| **Wendigo's painting and model** | none: the presenter draws its procedural silhouette (a dark horned cone) at 1.55 x Tidus; the Meshy figure is the next lane's |
| The Guardians | the Temple's painting (`characters/guado-guardian/`), twice, at 1.08 x Tidus |
| The stage | Chapter VII's Macalania Temple plate and scene (`scenes/wendigo-lake.ts`, a thin derivation: layout B for the party, Guardian A, Wendigo on Seymour's focal point, Guardian B); no plate exists for the lake |
| The story | silent (CW15) |
| The music | existing cues by reference (CW16); Bailey's ears decide; **no audition-page entry was added** (owed) |
| The chapter card, thumbnail and pause plate | Chapter VII's (`chapter-seymour-anima-macalania`, `pause/macalania`); the chapter's own are owed and unused until the board lists the chapter |
| The painted effects (the Counter Punch, the stance) | none; the stand-in plays the shared hit effects |
| The loot records and the gear drop | not modelled (section 3) |

## 9. What the presentation lane needs from this branch

**The seam.** `src/scenes/wendigo-lake.ts` exports `WENDIGO_SCENE_ENTRY` (the table row, in `scenes/experiment-scenes.ts` beside the anime chapter's `EXP_ANIME_SCENE_ENTRY`), `buildWendigoLakeScene` (the factory in `EXPERIMENT_SCENE_FACTORIES`) and `WENDIGO_LAKE_SLOTS`. The 3D stage replaces the factory and **keeps the key `wendigo-lake` and the slots** (party slots 0 to 2 Tidus, Yuna, Rikku and four bench spots off frame-left; enemy slots 0 to 2 Guardian A, Wendigo, Guardian B; `holdParty`, `enemySpots`, `figureHeights` in `WENDIGO_LAKE_STAGING`). The chapter opts out of the painted stage's framing the way the anime chapter does (`noRigs`, `ownImpacts` in `SceneStaging`). `data/art/artNamespace.ts` maps the scene key to the plate the board and the prep wash show (`macalania-temple`); change it with the stage.

**Combatant ids the stage must draw:** party `tidus yuna rikku wakka auron lulu kimahri` and the aeons `valefor ifrit ixion shiva`; enemies `wendigo`, `lake-guardian-a`, `lake-guardian-b` (`data/ffx/wendigo-ids.ts`).

**Events to animate** (from `BattleState.log`, all real in the smoke): Wendigo's `action-start` rows `attack` (the plain punch), `wendigo-punch`, `wendigo-haymaker` (the Double Punch), `wendigo-raise-arms`, `wendigo-lower-arms`; the `counter` event (actor Wendigo, `cause: 'script'`, target the attacker) followed by the `wendigo-counter-punch` action; the Guardians' `lake-berserk` (on Wendigo or on a party member), `lake-eye-drops`, `lake-auto-potion` (on itself, a reply after a hit, or on Wendigo), `blizzara`, `thundara`; **`protect` / `shell` as an `action-start` whose actor is a Guardian whose `ko` event has already fired** (the death handler's command: the stage must still play the cast from the fallen figure or its last pose; the painted stand-in draws it without error); a Guardian **petrified** (status `petrify`, hp 0, no `ko`: draw stone, not a fade); Wendigo's death animation is "Boss" (the body stays, untargetable), the Guardians' "Humanoid" (the body fades).

**State the stage reads:** `state.flags['wendigo.arms']` is true from the raise to the lower; **Sleep ends the stance with no action event** (the flag turns false and `wendigo.armTurns` is 3), so the stage must read the flag after every event, not only on the two arm rows. Statuses on Wendigo (`berserk`, `darkness`, `power-break`, `protect`, `shell`) have icons already (the smoke screenshot).

**Motion.** Wendigo's own bank `chr/mon/m212/mot/resident1.mgrp` has 26 clips and no clip map yet (the script starts motions 2 to 5 for the attacks, 184, 185, 186 for the stance, 160 to 162 for Sleep; RE 8 and the preflight's P3); the Guardian's bank `m213` was not read. The rows map: Punch, Double Punch, plain Attack and Counter Punch to the attack clips; Raise Arms to 184 (hold 185, lower 186); a hit to the hurt clip; KO to the death. The party clips are the converted Tidus, Wakka and Rikku banks and the retarget tool of the assets lane.

**The epilogue** (sourced, RE 2): after the win the field event plays a magic effect, hides the twelve ice layers, shakes the camera twice, fades to white and warps to the lake bottom. It belongs between the post scene's `camera('victory')` and `results()` in `story/scripts/wendigo.ts` (the DSL has `fx`, `shake`, `flash` and `fade`); no text (CW15).

**Shipping.** Models under `public/models-exp/lake/` (each file under the host's 25 MiB), a verifier and the dist filter, as the yrp chapter's: not started here. The door already carries the `desktopOnly` gate. The smoke tool (`tools/wendigo-smoke.mjs`) is the job to run again on the 3D stage; its checks are about the engine's state and keys, not the picture.

## 10. Tests and verification

New: `chapters/wendigo-data` (22 tests), `-ai` (40), `-engine` (9), `-bench` (11), `-tactic` (12), `-guide` (7), `-door` (7), `-scene` (7), `-story` (5), `-absence` (7), 127 in all; helpers `wendigoDrive.ts` and `wendigoBot.ts`; tools `wendigo-bench.mjs` and `wendigo-smoke.mjs`. Changed (list pins now carrying the chapter, nothing loosened): `chapter-doors`, `r74-hidden-3d-phone-doors`, `wraith-door`, `scene-backdrop-file`, `engine/party-stature-chapters`, `data-ffx-command-records`, `r62-auron-turn-order-tip`, `helpers/doorWords`.

**The full suite** (one run, `npx vitest run --maxWorkers=3`, 2,063 files, 2,770 s): **9 files failed with 12 tests, 32,148 passed, 582 skipped, 1 todo.** Every failure is explained:
- **Eight were list pins that did not yet carry the chapter** (each fixed by adding the chapter, nothing loosened; the Sanctuary Keeper's lane edited the same ones): `audio-music-batch2-2026-10-12` (two tests: the routing table and the owners of `boss-challenge`), `chapters/exp-fayth` (the side table of hidden scenes), `chapters/natus-provoke` (Wendigo's two arm rows are self rows on a Provokable enemy; a Provoked Wendigo's script does not run, so nothing is redirected), `chapters/yunas-ballad-data` (its door is no longer the last row), `parity-ffx-engine-loot-battles` (the three bodies have no loot record in the table, as the Sanctuary Keeper's), `parity-ffx-isaaru-commands` (the formations that carry `commandDisables`), `re-parity-ai-evrae` (the formula-class fixture `evrae-gaze-classes.json` gains the three records the chapter adds: 0x403B and 0x4063 class 0, 0x4080 class 2; its other five records were already there under Grothia's rows). `parity-ffx-loot-data` took the same loot-record edit.
- **Four are not this branch's:** `ww-models-tool` (1) and `ww3d/anime-files` (3) read the anime chapter's Meshy files on this disk (`anime/paine.glb`, `anime/rikku.glb`) and find them different from the recorded hashes and proportions (`tools/ww/ww-models.json` was last changed by 9a4f6c55c on `r76-int`); no file of this branch's diff is theirs.
After the fixes the 14 touched files re-ran green (201 tests) and the 56 files of the new and list-pin suites together (895 tests); `npx tsc --noEmit` is clean; `node tools/orphans.mjs`: 24 orphans, none new (all the modules of this chapter are reachable).

## 11. Open items (named, not hidden)

- **Two readings to settle on the real game** (ask first): Sleep ending the stance (section 4, item 4) and Eye Drops after a Steal (item 5).
- **The Berserk fix touches a shared adapter**: any future Berserk monster with a recorded plain Attack equal to its forced-action word is now boosted. The full suite is the proof that no listed chapter changed.
- **The loot records, the gear drop, the battle theme, the flags word and the defeat behaviour** are unread (section 3).
- **A deep review is owed** by the preflight's reading of the review class (combat core and the registry: DEEP, focused before deploy, deep after); the shared changes are small and additive. Ship it in the release that carries the other hidden chapters.
- **The audition-page entry for the stand-in cues** is owed.
- **NOW.md** is the integrator's: this lane did not edit it.
