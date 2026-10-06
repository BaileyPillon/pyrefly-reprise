# Experimental: Leblanc (new art) — the playable chapter and the art spec

Branch `exp-leblanc` (from `origin/main` 30e7d701, worktree `D:/pyrefly-r39-posescale`). **Game case: FFX-2 only** (Chateau Leblanc is FFX-2's; nothing here is read by an FFX chapter; the one shared piece, the art-namespace mechanism, is plumbing with one user). Never merged, never deployed to production: it goes to the Cloudflare PREVIEW worker only.

Bailey's words (chat, 2026-10-06), the authority for all of it:

- ~12:25 "the experimental new chapter will be the leblanc preview"
- ~12:40 "so the leblanc preview will be an additional experimental chapter. keep the current leblanc chapter."
- ~12:15 "the artwork for that experimental chapter will be chatgpt images 2.5, flare for mockups and sunburst for anything mission critical, stuff that ships"
- ~12:55 "you may use flare if thats the only one available to you."
- ~13:30 "You make the selections for me as far as the experimental chapter goes."
- ~14:00 "the priority is the experimental chapter right now. devote all resources to the playable experimental chapter."

## 1. What exists today

- **A playable chapter**, "Experimental: Leblanc (new art)" (`exp-leblanc`): Chapter VI's encounter end to end (Act I the entrance, Act II Logos' room, Act III the Last Room with Leblanc, Logos and Ormi), listed on the board after the eighteen (the last card of the FFX-2 group, numeral EXP), with every figure and the backdrop read from a separate art set. Chapter VI is untouched.
- **The art set is a placeholder**: a real copy of today's Chapter VI paintings (1x paintings and sidecars only) under the namespace `exp-leblanc`, so the chapter plays now and every painting that is replaced shows up the moment it is installed.
- **The workspace and the install tool**: `D:/pyrefly-art-exp/` (hard-linked mirror of the release art plus the namespace as real copies; `public/art` of this worktree points at it) and `tools/exp-install.mjs`, which takes an approved Art Room image to a game-ready painting (matte, frame, tiers, sidecar, registration). Tested on one image, Yuna Gunner idle (section 11).

How to run it: `npm run dev` (or `npx vite --port 5190`), or the smoke build of section 13 (`node tools/exp-smoke.mjs build`, then `preview`); title, Enter, ArrowLeft once from the first card wraps to the last card, Enter, Enter (party prep), the pre-battle scene (hold Enter to skip), the fight. `PYREFLY_BROWSER=gpu node tools/exp-smoke.mjs run` plays all of that by real keys and checks it.

## 2. The approved target

The driver picked option B, "Moonlit Blue Hall" (Art Room proposal `p_14df3754`, v7, score 8.7): `D:/Tools/pyrefly-scratch/2026-10-06/leblanc-mockups/B-moonlit-blue-hall-p_14df3754-v7-8.7.png` (1672x941). A copy of the picture beside the build is `docs/screenshots/exp-leblanc/target-vs-build.png`.

What makes it right (read off the picture): a cool, moonlit marble hall in lavender and periwinkle, with light shafts falling from a tall heart-shaped stained-glass window and a heart-inlaid double door at the centre back; a polished reflective floor with a pink heart flower in its tiles; blue-glowing spheres on the shelves of the side walls, candles, drifting motes; the party at the left seen from behind in a loose arc, the three Syndicate members at the right (Logos with two pistols, Leblanc with her fan open, Ormi with the heart shield), everyone standing on the one reflective floor. The light is cool and soft, the figures are painted in the same soft anime rendering as the plate.

Liked / disliked / must remain / must change / undecided: Bailey has not reacted to option B himself (the driver picked it under "You make the selections for me"); nothing is recorded as Bailey's yet. Undecided: whether the plate keeps Chapter VI's door-and-crates layout or this hall (the plate is not painted yet; section 8), the figures' lighting (the plate's cool light on warm figures), the Syndicate's final designs.

## 3. How it is built (the smallest clean way)

One idea: **the experimental chapter is Chapter VI's record with its own id, title and scene key, and the art is found by a namespaced id.**

| Piece | File | What it does |
|---|---|---|
| Namespace | `src/data/art/artNamespace.ts` | `exp-leblanc`; `inArtNamespace(ns, id)` (`yuna-gunner` becomes `exp-leblanc-yuna-gunner`, idempotent), `baseArtId`, `artNamespaceOfScene`; `SCENE_ART_NAMESPACE` maps the scene key `exp-leblanc-last-room` to it |
| Chapter record | `src/data/chapter-exp-leblanc.ts` | `experimentalLeblanc(FFX2_LEBLANC)`: the spread of Chapter VI's record (party build, formations and their chain, scripts, music, Sensor lines, location, all **by reference**) with `id`, `number: 19`, `experimental: true`, the title and words, and `sceneKey: 'exp-leblanc-last-room'` |
| Registry | `src/data/encounters.ts` | `'exp-leblanc'` in `ChapterId` (not in `ListedChapterId`), `EXPERIMENT_CHAPTERS`, `getChapter` finds it; **`CHAPTERS` and `CHAPTER_IDS` stay the eighteen**, so every chapter-generic suite and count is untouched |
| Scene | `src/scenes/exp-leblanc-last-room.ts`, `leblanc-last-room.ts`, `index.ts` | the Last Room factory now takes a plate (`makeLeblancLastRoomScene({ key, artNamespace })`); Chapter VI's is `{ key: 'leblanc-last-room' }`; the experiment draws `backdrops/exp-leblanc-last-room.png` and publishes `artNamespace` on its staging (`SceneStaging.artNamespace`) |
| Figures | `BattlePresenterArt.ts` (`artCandidatesFor`), `BattlePresenterStage.ts` (`add`, `setArt`), `battlePreload.ts`, `BattleScreen.ts` | every id the stage resolves gets the scene's namespace (a spherechange too); the start card and the preload read the same ids. With no namespace every id is exactly what it was |
| Flow and save | `BattleScreenFlow.ts`, `app/experiments/experimentRecords.ts` | an experiment plays through the chapters' own flow (prep, pre-battle scene, entry, the chain, results, retry) but is handed `experimentProgress` in place of the save: its attempts, clears and time go to the experiments' store (`pyrefly-reprise:experiments:v1`), never `pyrefly-reprise:save:v1`; FF7's hidden experiment keeps its own flow |
| Board | `chapterGrid.ts`, `chapterCards.ts`, `chapterPlates.ts`, `chapterProgress.ts`, `roman.ts`, CSS | the card after the eighteen, "EXP" for a numeral, its own plate (Chapter VI's composition over the namespaced Leblanc), a smaller title; "N of 18" stays the eighteen |
| Registration | `src/data/art/poseRegistrationExp.ts` (generated), `PoseRegistration.ts` | the rows for `exp-leblanc-<subject>`, keyed by the namespaced id (section 9) |
| Scene-keyed tables | `pyreflyCanon.ts`, `fx/b/ambient/plateRooms.ts` | the same rows as `leblanc-last-room` under the new key (it is its own painting, so its own rows) |
| Meta | `chapter-meta-exp-leblanc.ts` | the pause-screen record: Chapter VI's with the preview's words and numeral EXP |

**What is NOT namespaced yet (reads the base art, small, listed in section 12):** the FFX-2 HUD party rows' head crops, the party prep roster and Garment Grid icons, the story scenes' figures (`cutsceneFigures.ts`), the pause close-ups (`art/pause/`), the results poses, the dressphere-change twirl and splash keys, `portraits/`.

## 4. The art workspace

- `D:/pyrefly-art-exp/` is a **hard-linked mirror** of `D:/pyrefly-r39-int/public/art` (4,005 files, 10.1 GB, no extra bytes; created in 1 second) plus the namespace as **real copies**: `characters/exp-leblanc-<subject>/` (24 subjects, 490 files, about 100 MB, plus whatever has been installed) and `backdrops/exp-leblanc-last-room.png|.json|@2x.png`. `manifest.json` is a real copy too (`node tools/gen/manifest.mjs` rewrites it in place on every build; a hard link would rewrite the release tree's).
- `public/art` of the worktree is a junction to it (`node tools/exp-art.mjs link`; the old junction was removed with `rmdir`, which cannot delete files).
- **The rule that keeps the release tree safe: never write a hard-linked file in place** (a write through one name changes the other). The install tool writes a temporary file and renames it over; nothing in the namespace is a link.
- `node tools/exp-art.mjs verify` proves it: the release tree holds no namespace file, every mirrored file is the release file's inode, every namespace file and `manifest.json` has one link. `status` lists every namespaced pose as placeholder or installed; `seed` makes the placeholders again (never over an existing file); `snapshot` writes `tests/fixtures/exp-leblanc/ch6-art.json`, Chapter VI's art as the release tree holds it (the test compares what `public/art` serves with it).
- Local-only, never committed: `public/art/` (gitignored), `public/fx/exp-leblanc-last-room/` (a copy of the Chapter VI depth map; derive a new one with `tools/fx/depth.py exp-leblanc-last-room` after the plate is installed). A clean checkout needs `node tools/exp-art.mjs seed` (or the workspace) before the chapter shows art; the preview deploy builds locally, as every deploy does.
- Subject list (read from the game's data by `tools/exp-art-lib.mjs`, never guessed): the 19 girl paintings Chapter VI can draw (one per dressphere she can wear here, falling back to the build's sprite key exactly as `resolveArt` does) and the 5 fiends (`ormi`, `leblanc`, `logos`, `ffx2-dr-goon`, `ffx2-fem-goon`).

## 5. What a new figure painting must be (game-ready)

All of this is measured off the shipped Chapter VI paintings (15 of them: Yuna Gunner's seven, Rikku Thief's and Paine Warrior's idle and ready, Leblanc's idle and attack, Ormi's and Logos's idle; `tools/exp-art/figure.py` enforces it).

| | the rule |
|---|---|
| Canvas | **A tight crop of one figure with a 16 px margin on every side** (measured: 16 on all four sides in 11 of the 15; the other four have one side at 0, 4, 6 or 10). No other canvas padding: the engine sizes a figure from the idle's `baselineY` (world height over the pixels from the top of the canvas to the soles), so a canvas with headroom makes the figure small. Size is free (the shipped 1x figures are about 400 to 820 px wide, a KO 1,180, and 800 to 1,210 px tall; the Art Room's 1024x1536 canvas crops to about 670x1550 for a standing figure, so a new figure has about 1.3 times the pixels of the old) |
| Aspect | Whatever the figure is: a standing pose is about 0.35 to 0.45 wide over tall, a lunge or a cast with arms out is wider, a **KO is a lying body wider than tall** (the engine lays a painting wider than 1.15 over its height down by its aspect; a standing lunge wider than tall must be marked `upright` in its registration row) |
| Facing | **Girls face right, fiends face left** (the house contract); a painting that does not says so in its sidecar `facing` (`right`, `left` or `front`) and the engine mirrors it only when it disagrees with the side it stands on. Today: most girl paintings `right` (Paine Songstress `left`, Rikku Songstress `front`), Leblanc and Logos `left`, Ormi and the goons `right` (mirrored in play) |
| Feet line | Both soles on **one ground line**, the lowest part of the figure (no weapon tip, hem or tail lower than the boots; a thick one that cannot be avoided is registered as `feetRow`). `baselineY` is the bottom row of the content in the cropped image |
| Content | One figure. No background, no ground, no cast shadow, no glow, haze, particles, motion lines, muzzle flash, magic circle or other effect (the game adds its own light and effects); the figure's own colour to the edge |
| Style | The approved Art Room set (soft anime digital painting; `docs/target/` targets). Ink & Gold is the interface only, never a painting palette |
| Poses | Same artist, same set, same scale as the idle (the Art Room's "ready ... belongs to one set with the master in Image 1"); the engine matches each pose's head to the idle's (section 9) but a pose painted at a different density costs registration accuracy |

## 6. Alpha and the local matting plan

**The Art Room's images are RGBA with real alpha** (checked: 15 of 15 approved images; the three full-bleed pictures are RGB). The figure files have alpha 0 to 254 (max 254), 72 percent of the pixels 0, 25 percent 250 or more, and **a faint glow at alpha 1 to 7 around the figure** (1.75 percent of the pixels in Yuna's idle; coloured, which shows as a haze when composited on a dark floor). Nothing may ship with that haze.

The matte (`tools/exp-art/figure.py`, ComfyUI's embedded python, nothing downloaded):

1. **Real alpha kept** when the image has a real cut-out (more than 10 percent transparent, four corners transparent); an **opaque image** is cut with rembg's `isnet-anime` (the house cutter of `tools/gen/rembg.py`; weights in `D:/Tools/ComfyUI/rembg-models/models`: `isnet-anime`, `isnet-general-use`, `u2net_human_seg`), then cleaned the same way.
2. **Clean**: alpha under 16 is zeroed (the haze), the largest body and any part that is big (2 percent of the body) or within 10 px of it are kept, specks are dropped, a soft pixel farther than 3 px from a kept body is dropped.
3. **De-halo**: the colour of every pixel that is not fully opaque becomes the nearest opaque pixel's (an edge never carries a halo's colour); a 24 px ring of the figure's own colour is bled under the transparent pixels beside it (bilinear and mip filtering never blend in black or grey; the shipped masters keep the same ring).
4. **Frame**: crop to the content (alpha 8 and up) plus 16 px; `baselineY` = the content's bottom row.

Result on Yuna's idle: 1024x1536 canvas, figure 642x1516, haze 29,103 pixels removed, 4 specks dropped, 63 stray soft pixels dropped, soft edge 2.4 percent of the canvas, output 674x1548, margins 16/16/16/16.

## 7. Hi-res tiers

`<pose>@2x.png`, `<pose>@3x.png`, `<pose>@4x.png` beside the 1x file, exactly 2, 3 and 4 times its width and height (`ArtTier.ts` draws a master only when it is exactly that size and the manifest lists it; the manifest lists them after `node tools/gen/manifest.mjs`).

- **@4x**: the figure's colour enlarged by local RealESRGAN (`D:/Tools/ComfyUI/ComfyUI/models/upscale_models/RealESRGAN_x4plus_anime_6B.pth`, the one trained on line art; `RealESRGAN_x4plus.pth` is there too, `--model x4plus`), through `spandrel` in ComfyUI's python, tiled with a blended overlap, fp16 on the GPU; the **alpha is enlarged apart** by Lanczos (so the edge stays a clean line and no glow is invented).
- **@2x**: the 4x reduced by Lanczos on colour and alpha apart (a straight RGBA resize premultiplies and turns the colour under alpha 0 into one flat grey).
- **@3x** is derived from the 4x by `tools/hires-install.mjs` (its `derive3`, premultiplied-free Lanczos 0.75), which also installs the three: the tool writes a one-asset library (`D:/pyrefly-art-exp-lib/manifest.json`, hires-install's own format, with the source's sha256 so it refuses a 1x that changed) and runs `hires-install --copy --apply --only characters/exp-leblanc-<subject>/<pose>`.
- Size notes: a 1,500 px figure's @4x is about 6,100x3,100 and 15 to 25 MB as a PNG; **Cloudflare's per-file limit is 25 MiB**, and the deploy's art derive recompresses every master (`tools/art-derive.mjs`). The release library's recipe also runs an SDXL refine over the 4x and gates it by SSIM; this tier skips it (the Art Room's figures are already 1,500 px tall, so the 1x is the master and the tiers only serve 4K and high-DPI screens). A fidelity look at 1:1 against the 1x is part of an install.
- A **backdrop** has tiers `@2x` only (`backdropTiers`): 1x is 2688x1536 and `@2x` 5376x3072 (a 4x master of a backdrop is 264 MB of GPU, never installed).

## 8. The backdrop plate

`backdrops/exp-leblanc-last-room.png`: **2688x1536 (16:9)**, `@2x` 5376x3072, RGB, opaque. **No figures, no text** (the approved mockups carry the party and the Syndicate; the plate is the empty hall they stand in, so the install of a plate refuses until Bailey approves an empty one: `exp-install.mjs backdrop` is specified and dry-runs, and stops there). Composition the scene is solved for (`leblanc-last-room.ts`): the camera at (0, 2.8, 9.4) looking at (0.55, 1.55, -1.35), the plate 74 units wide at distance -47, centre y -1.9; the party arc lower-left, the trio right of centre and back; the floor is where the figures' shadows land (a reflective floor is welcome: the 3D ground catches contact shadows only). The scene samples the plate for its light: bands `sky` 0 to 0.08, `horizon` 0.46 to 0.56, `ground` 0.85 to 0.97, `key` 0.08 to 0.3 of its height; the door and the window are the 0.22 to 0.62 band the parallax layer cuts.

After the plate is installed: regenerate its depth map (`HF_HOME=D:/Tools/pyrefly-scratch/eye-candy/hf D:/Tools/ComfyUI/python_embeded/python.exe tools/fx/depth.py exp-leblanc-last-room`, CPU, Depth Anything V2 Small from the local cache), copy `public/fx/exp-leblanc-last-room/` to wherever the preview is built, and run `node tools/gen/manifest.mjs`. The chapter select card and the prep wash read the same plate by scene key.

## 9. The sidecar and the pose registration (CHK-026)

**Sidecar** `<pose>.json` (the engine reads `width`, `height`, `baselineY`, `facing`, and optional `scale`/`anchorY` hand overrides; the install writes none of the overrides):

```
{ "width": 674, "height": 1548, "baselineY": 1532, "facing": "right",
  "pose": "idle", "composition": "full", "game": "ffx2", "expNamespace": "exp-leblanc",
  "model": "ChatGPT Images 2.5 (auto), via the Art Room",
  "source": { "artRoomId": "p_...", "version": 3, "title": "...", "score": 8.7, "approvedAt": "...", "file": "...", "sha256": "...", "size": [1024, 1536] },
  "prompt": "<the Art Room's revised prompt>", "matte": { ... }, "margins": { ... }, "installedAt": "...", "installedBy": "tools/exp-install.mjs" }
```

**Registration** (`src/engine/PoseRegistration.ts`, release 39; CHK-026: at every pose swap a figure's head changes by at most 3 percent and a standing figure's feet by at most 2 px at 1600 wide). The engine sizes every pose from the idle's pixel scale times the pose's `scale`, and slides each plane so its stance lands where the idle's does. A row is `{ scale?, stanceX?, feetRow?, upright? }`:

- **`stanceX`** (automatic): the middle of the support under the figure, in the painting's own pixels from its left edge (`tools/posescale/ps_lib.py` `stance_from_hem`, the registration's own rule; the install runs it on the finished painting). Yuna's new idle: x 417, row 1532.
- **`scale`** (read by eye): brings the pose's head to the idle's. **Head box** = the hair or headgear mass and the face, hair top to chin, outer side to side, thin tassels and hairpins left out, in the painting's pixels. `scale = sqrt(idle head w x h) / sqrt(pose head w x h)`, raised to the stature floor (D-298: a standing pose may not be drawn under 0.60 of the idle's height), a KO's divided by 0.978 (its lying plane draws the head smaller). The install takes `--head x0,y0,x1,y1` for the pose and keeps the idle's box as the reference; **a pose installed without a head box is recorded PROVISIONAL and drawn at the idle's pixel scale** (it is no worse than before; read its head with `tools/posescale/measure.py tiles` rulers or by eye, then install again with `--head`).
- **`feetRow`**: the row of the soles when a thick weapon hangs lower (`--feet-row`); **`upright`**: a standing pose wider than tall (`--upright`).
- **Placeholders beside a new idle are rescaled**: the idle's `baselineY` sets the pixel scale of the whole figure, so when a new idle is a different height in pixels than the old one (Yuna's: 1,532 against 1,178), every pose that is still the old painting carries `scale x (new baselineY / old baselineY)` or it would be drawn that much larger beside the idle. `exp-art-table.mjs` does it when it generates the table. The twirl keys (`twirl-*`, staged by `fx/mix/twirl.ts` from the base art) are not covered; they are outside the namespace today.
- The records: `docs/target/exp-leblanc/installed.json` (what is installed: Art Room id and sha256, the painting's sha256, size, baseline, content box, head, tiers, the row) and the generated `src/data/art/poseRegistrationExp.ts`; both are committed (the art is not).

## 10. The poses the chapter needs

What Chapter VI draws today, per subject (`tests/fixtures/exp-leblanc/ch6-art.json`), so the table is what the engine actually asks for. **Must-have** = a pose the chapter plays on screen in a normal clear; **rare** = a pose only some play reaches (a spherechange, a status, a low-HP slouch, a victory beat) or one the engine falls back from (`POSE_FALLBACKS`: `cast` falls to `idle` for a dressphere, `ko` to `idle`).

**The three girls at the start (the build's own dresspheres)** — must-have: `idle`, `ready` (the acting pose), `attack`, `cast`, `item`, `hurt`, `ko`, `victory`. Rare: `defend`, `sleep`, `critical` (the low-HP kneel), `follow` (after-hit), `od-<special>` (Paine Warrior has two), and the dressphere-change keys `twirl-start`, `twirl-going`, `twirl-mid`, `twirl-forming`, `twirl-end` (every spherechange, so if a girl is going to change in the fight the five are needed).

| Subject | poses today | Art Room approved (2026-10-05) |
|---|---|---|
| `yuna-gunner` | idle, ready, attack, cast, hurt, ko, victory, item, critical, sleep, twirl-x5 | **idle (finish A p_b2886056 and finish B p_3712fb7d), ready, attack, cast, hurt, ko, victory**; still to paint: item |
| `rikku-thief` | idle, ready, cast, hurt, ko, victory, item, critical, follow, sleep, twirl-x4 | **idle (p_132ae9c8), ready (p_80e34964)**; to paint: attack is absent today (the placeholder is cast), cast, hurt, ko, victory, item |
| `paine-warrior` | idle, ready, attack, cast, victory, item, critical, follow, sleep, od-x2-warrior-armor-break, od-x2-warrior-power-break, twirl-x4 | **idle (p_b3095cd4), ready (p_b345f398)**; to paint: attack, cast, hurt (absent today), ko (absent today), victory, item |
| the other 16 girl paintings (a girl changes dressphere) | each has idle and most of attack, cast, item, ko, victory, twirl | rare: needed only after a spherechange; the placeholder carries them (a missing one falls to the starting dressphere's painting, as in Chapter VI) |

**The five fiends** — must-have: `idle`, `attack`, `hurt`; `cast` for the three who cast (Leblanc, Logos, Ormi). The goons also have `ko`. Leblanc, Logos and Ormi **yield** (walk off) when beaten (`BattlePresenterDepartures.ts`, D-035: "living people who walk off"), so they need no `ko`. `telegraph` (a wind-up) is optional for each (it falls to the idle).

| Subject | poses today | facing |
|---|---|---|
| `leblanc` | idle, attack, cast, hurt | left |
| `logos` | idle, attack, cast, hurt | left |
| `ormi` | idle, attack, cast, hurt | right (mirrored in play) |
| `ffx2-dr-goon` | idle, attack, hurt, ko | right |
| `ffx2-fem-goon` | idle, attack, hurt, ko | right |

World heights the stage scales them to (`LEBLANC_LAST_ROOM_ACTOR_HEIGHTS`): Yuna 1.68, Rikku 1.60, Paine 1.72, Leblanc 1.66, Logos 1.95 ("tall and slim"), Ormi 1.50 ("short and stout"). A fiend's painting is sized from its own idle, so a Logos painted tall in the canvas is tall in the room.

## 11. The install script: usage, and the test on Yuna Gunner idle

```
node tools/exp-install.mjs install --src D:/Tools/art-room/data/approved/p_3712fb7d-yuna-gunner-idle-finish-b-v3.png --subject yuna-gunner --pose idle
node tools/exp-install.mjs install --src <approved ready.png> --subject yuna-gunner --pose ready --head x0,y0,x1,y1
node tools/exp-install.mjs install ... --dry-run            validate only
node tools/exp-install.mjs list | table | backdrop --src <plate.png> --dry-run
```

It refuses an image that is not in the Art Room's approved record (`D:/Tools/art-room/data/approved.jsonl`, matched by id and sha256: **only Bailey approves**), a subject the chapter does not draw, a target outside the namespace, and a pose that has tiers of an earlier painting when asked to install without tiers. It never deletes: a painting that replaces earlier new art is copied to `D:/pyrefly-art-exp-replaced/` first. **The test: Yuna Gunner idle (approved, finish B, `p_3712fb7d`, score 7.6; finish A `p_b2886056` is also approved and installs the same way) is installed.** 21 seconds end to end:

- matte: the image has real alpha, so it is kept (`how: keep`); 29,103 haze pixels (alpha 1 to 15) removed, 4 specks dropped, 63 stray soft pixels dropped; 1024x1536 canvas, figure 642x1516, cropped to **674x1548 with margins 16/16/16/16**, `baselineY` 1532 (the engine's own rule reads 1531), opaque share 37.2 percent, soft edge 2.4 percent;
- files: `idle.png` 822 KB, `idle@2x.png` 1348x3096 (3.1 MB), `idle@3x.png` 2022x4644 (9.0 MB), `idle@4x.png` 2696x6192 (10.0 MB), `idle.json` (the sidecar of section 9, with the Art Room's id, version, score, approval time, source sha256 and its revised prompt);
- registration: the idle's row is `{ stanceX: 417 }` (stance row 1532, support from x 190 to 644); the table builder rescaled the placeholder poses of the subject by 1532/1178 = 1.3005 (attack `scale 1.3005`, ready 1.7583, hurt 1.3746, ko 0.7816, ...); `docs/target/exp-leblanc/installed.json` holds the record and `src/data/art/poseRegistrationExp.ts` the table;
- the manifest lists `tiers: { idle: [2,3,4] }` for `exp-leblanc-yuna-gunner`; `node tools/exp-art.mjs verify` still passes (496 namespace files, every one a single-link real copy; 4,005 mirrored files still the release files' inodes);
- in the game (real keys, headless GPU Chromium, a `BASE_PATH=/` build under `vite preview`): Yuna stands on the field in the new painting at the same world height and the same ground line as before, and her attack plays from the placeholder attack painting, rescaled to match (`docs/screenshots/exp-leblanc/yuna-5-battle-first-menu.png`, `yuna-7a..7c-yuna-attack-*.png`, and the before and after crop `yuna-idle-before-after.png`); the figure at 1:1 and its @4x are compared in the scratch sheet `D:/Tools/pyrefly-scratch/2026-10-06/exp-leblanc/tier-compare.png` (the 4x draws cleaner line work than a bicubic enlargement of the 1x; the hair's silhouette keeps the source's own stair-stepped alpha).

To put Yuna's idle back to the placeholder (nothing does it for you, because nothing deletes): copy the release tree's `characters/yuna-gunner/idle.png` and `idle.json` over the namespace's (real copies), move the three `idle@Nx.png` aside, take the pose out of `docs/target/exp-leblanc/installed.json`, run `node tools/exp-install.mjs table` and `node tools/gen/manifest.mjs`. `D:/pyrefly-art-exp-replaced/` holds any earlier NEW art a re-install replaced.

## 12. What is still the base art, and what a next lane would do

1. **Surfaces outside the stage** (section 3): the FFX-2 HUD party heads (`ui/ffx2/dressphereIcons.ts` `dressphereArtUrl`, `PartyRows`), the prep roster and grid, the story scenes' figures (`cutsceneFigures.ts`: Leblanc, Ormi, Logos and the girls speak over the base art), `art/pause/`, the results poses (`victoryLine.ts`), the twirl and splash keys (`engine/fx/mix/`), `portraits/`. Each reads `art/characters/<id>/...` by a string built from the base id; the namespace helper (`inArtNamespace`) is the one-line change at each, once the namespace is known there (the HUD and prep know the chapter; the cutscene knows its chapter).
2. **A plate** (section 8) and its depth map; the scene's camera and slots are Chapter VI's until a plate painted differently needs its own (a per-plate rig table would go in `exp-leblanc-last-room.ts`).
3. **Lighting**: the figures are lit by the scene's rim and ambient (Chapter VI's palette `ScenePalettes.chateauLeblanc`); target B is cooler. `?fx=` options and the lighting-mockups branch are the place to try a cooler grade; nothing is changed here.
4. **Merging**: never merged. If it is merged to main, the card appears in production unless `EXPERIMENT_CHAPTERS` is emptied (one line in `encounters.ts`); the deploy tooling has no preview-only gate for it. The preview worker is `echoes-of-spira-preview` (`tools/cloudflare/wrangler.preview.jsonc`, `deploy-pages.mjs --host=cloudflare --preview`).
5. **Disk**: D: is nearly full; the mirror costs nothing and the namespace is 100 MB, but every installed pose with tiers adds 20 to 60 MB, so a full set (24 subjects, about 200 poses) is several GB; install the must-have poses first.

## 13. Tests, checks and screenshots

SUITE_RESULT_PLACEHOLDER

**The smoke** (`tools/exp-smoke.mjs`, headless Chromium on the GPU, `PYREFLY_BROWSER=gpu`; real keys; a `BASE_PATH=/` build under `vite preview`): `node tools/exp-smoke.mjs build`, `node tools/exp-smoke.mjs preview --port 4190` (stop it by its port when done), `PYREFLY_BROWSER=gpu node tools/exp-smoke.mjs run --base http://127.0.0.1:4190/ --tag final`. It checks that the board shows the experiment last and selected with "of 18" unchanged, that the field's chapter and scene are the experiment's and every one of the six figures is read from `exp-leblanc-*`, that a party attack lands (Yuna among them), that no fiend is read from the base art in battle (the story scene's Leblanc and Ormi are the known exception), and 0 console errors and 0 404s. Result: **SMOKE PASSED** (`docs/screenshots/exp-leblanc/final-log.json`). Because `public/` is not copied, the build is 3 seconds and the art is read through junctions: remove them with `cmd /c rmdir` before removing the folder (`exp-smoke.mjs build` does).

Screenshots, `docs/screenshots/exp-leblanc/`: `smoke-2-chapter-select-experiment.png`, `smoke-3-party-prep.png`, `smoke-4-cutscene.png`, `smoke-5-battle-first-menu.png`, `smoke-8-attack-landed.png` (the placeholder art: the chapter exactly as Chapter VI looks); `final-*` (the last build); `yuna-5-battle-first-menu.png`, `yuna-7a-yuna-attack-start.png`, `yuna-7b-yuna-attack-hit.png` (Yuna's new idle installed, her attack from the rescaled placeholder); `yuna-idle-before-after.png`; `target-vs-build.png` (the approved target beside the build: the build still has Chapter VI's placeholder plate and one new figure; the distance from the target is the plate, the cool light, the Syndicate's and the other girls' paintings).

## Appendix: the recon, read from the code

- **Chapters**: `src/data/encounters.ts` owns `ChapterId`, `Chapter`, `CHAPTERS` (18) and `getChapter`; chapters 7 on live in `src/data/chapter-*.ts` (type-only import of `Chapter`, no runtime cycle); `chapters-unlisted.ts` holds registered-but-unlisted ones (`UNLISTED_CHAPTERS`, FF7's hidden experiment); `LOCKED_CHAPTER_IDS` (`comingChapters.ts`) is empty. The board (`chapterGrid.ts`) sorts each game's tiles by `number`.
- **Figures**: a combatant's painting is `artIdFor(c)` (an FFX-2 girl is `<girl>-<dressphere>`, a boss with forms `<id>-<n>`, else `c.spriteKey || c.id`), resolved by `resolveArt([artIdFor, spriteKey, id])` against `public/art/manifest.json` (`tools/gen/manifest.mjs`: `characters/<id>/<state>.png` is a chosen pose, `@2x/@3x/@4x` its masters), URLs by `artUrl` (`PaintedArt.ts`; `ArtShipped.ts` maps a master to the WebP a build derived and writes `@` as `%40`), poses by `PARTY_POSES`/`ENEMY_POSES` with fallback chains (`BattlePresenterArt.ts`), sizes by the idle's `baselineY` (`PaintedScale.ts`) and the registration rows (`PoseRegistration.ts`, `data/art/poseRegistration*.ts`, generated by `tools/posescale/measure.py table`).
- **Scene and backdrop**: `Chapter.sceneKey` -> `SCENES`/`SCENE_FACTORIES` (`scenes/index.ts`) -> `loadScene`; the plate is `art/backdrops/<sceneKey>.png` read by the scene, the board card, the prep wash, the cutscene and the start card; scene-keyed tables: `pyreflyCanon.ts`, `fx/b/ambient/plateRooms.ts` (its depth map `public/fx/<key>/depth.png`, recorded in `tools/fx/fx-assets.json`, which the deploy gate and `fx-depth-guard.test.ts` read).
- **Chapter VI's chain** (`leblancEntranceGroup` -> `nextGroupId`): Act I `ffx2-leblanc-entrance` (Ormi `ormi-entrance` 1,640 HP, Dr. Goon, Fem-Goon), Act II `ffx2-leblanc-logos-room` (Logos `logos-room`, Ormi `ormi-logos-room`, opens on randomised bars), Act III `ffx2-leblanc-last-room` (Leblanc, Logos, Ormi); `findEnemyGroup` resolves a link by id from `ENEMY_GROUPS_BY_ID`; the chain restages on one scene. Sprite keys: `ormi`, `ffx2-dr-goon`, `ffx2-fem-goon`, `logos`, `leblanc`.
- **The girls** (`data/ffx2/builds/chateau.ts`): Yuna Lv 20 (Gunner, owns Gunner, Songstress, White Mage, Black Mage, Thief, Warrior, Gun Mage, Alchemist, Floral Fallal), Rikku Lv 21 (Thief; Thief, Black Mage, Gunner, Warrior, White Mage, Songstress, Alchemist, Gun Mage, Machina Maw), Paine Lv 22 (Warrior; Warrior, White Mage, Gunner, Songstress, Thief, Black Mage, Gun Mage, Alchemist); Garment Grids `hour-of-need` (Yuna, 5 nodes, her node 0 Gunner, Songstress and Thief one link away), `bum-rush`, `stonehewn`; the node order is the `owned` order, so a spherechange swaps the art id (`setArt`). A dressphere with no painting (Gun Mage, Floral Fallal, Machina Maw) falls back to the build's sprite key, so the 19 girl paintings the chapter can draw are Gunner, Songstress, White Mage, Black Mage, Thief and Warrior for Yuna, the same set plus Alchemist for Rikku, and for Paine the same without Alchemist (the manifest decides).
