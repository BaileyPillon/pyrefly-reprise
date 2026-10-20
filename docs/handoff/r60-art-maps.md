# Release 60, the art for the HD-2D look: the lighting maps in a release mirror (branch `r60-art`)

**Game case: both games (shared plumbing, no game content); what the maps light is Chapter I (FFX, `seymour-flux`) and Chapter IV (FFX-2, `ffx2-bahamut`) only.** Branch `r60-art` from `origin/r60-rc` (`bc943ac41`). **Not deployed, no review run:** the driver does both.
Bailey, 2026-10-20: look "HD-2D bold (Recommended)", boss rigs "Yes, both (Recommended)"; earlier "Yes, use the GPU (Recommended)" for the depth and surface-shape maps (decisions 150d, 157).

## The problem

The look lights the painted figures with `<pose>.normal.png` and fogs a room with `backdrops/<room>.depth.png` (`D:/pyrefly-art-maps`, `MAPS-README.txt`). `D:/pyrefly-art-demo` (the release 60 art) held none: a production build showed the look without the light and logged a 404 per
missing map (and a figure the maps do not cover, such as the gunner dresssphere, a 404 on every pose).

## What was done

1. **The art manifest lists the maps a tree ships** (`lightMaps`, see `docs/CONTRACT-CHANGES.md`, 2026-10-20): `tools/gen/manifest.mjs` writes `{ normal: { <subject>: { <state>: [1, 2] } }, depth: [<room>] }` only when the tree holds a map (every other tree writes the
   manifest it always wrote); `src/engine/ArtManifestMaps.ts` reads it; `bindRelight` (`look/relight/FigureRelight.ts`) and `LookBold.loadDepth` ask for a map the manifest names and for none it does not, so a figure with no map is never requested one (no 404, unlit as before). A painting drawn
   from a 2x or larger master takes the largest map listed that it wants, else the smallest, so a build that ships only the base map serves every tier from it. **No `lightMaps` in the manifest: they ask as they did** (the dev server, whose maps come from outside `public/art`).
2. **A new mirror, `D:/pyrefly-art-r60`** (`node tools/art-mirror-add-maps.mjs`, `tools/art-maps-mirror.mjs`, hard links like `art-mirror-add-rigs.mjs`; refuses a map that is not its painting's size; proves the result from the files):
   `node tools/art-mirror-add-maps.mjs --from D:/pyrefly-art-demo --maps D:/pyrefly-art-maps --to D:/pyrefly-art-r60 --subjects tidus,yuna,kimahri,auron,wakka,lulu,rikku,seymour-flux-body,mortiorchis,valefor,ifrit,ixion,shiva,bahamut,yuna-white-mage,rikku-dark-knight,paine-warrior,paine-dark-knight,ffx2-bahamut --backdrops gagazet,bevelle-underground --tiers 1`
   -> `PROVED: 6010 file(s) in the new mirror, 5807 linked to the source's, 202 map(s) linked to the maps folder's (87.9 MB)`. `D:/pyrefly-art-demo` (5,808 files), `D:/pyrefly-art-r59` and `D:/pyrefly-art-maps` are untouched; `manifest.json` is a file of its own and differs from the demo mirror's in `generatedAt` and `lightMaps` only.
   **The release then points its `public/art` junction at `D:/pyrefly-art-r60`** (the driver's).

## Which maps ship, and why

- **Base maps only (tier 1), no `@2x`.** A normal map is smooth, and the base map is already one texel to a screen pixel at 1440p. Measured on the real files: the shader's gain (`1 + key * (n.L - flat.L)`, bold hd2d, three key directions) from the BASE map bilinearly
  upsampled to the @2x size, against the gain from the @2x map, over the opaque pixels of six figures (Yuna white mage, Rikku dark knight, Paine warrior, Tidus, Kimahri, Bahamut): **mean |gain difference| 0.005 to 0.009 (0.5 to 0.9 percent of the painting's brightness), p99 0.04 to 0.075, over 0.10 on 0.03 to 0.5 percent
  of the pixels**, against the gain's own spread of 0.22 to 0.40 (`D:/Tools/pyrefly-scratch/2026-10-20/r60-art/gaindiff.txt`). Adding `--tiers 1,2` would add about 230 MB raw (158 MB for Chapter I, 72 MB for Chapter IV; about 215 MB as shipped); the tool and the manifest support it with no code change.
- **Chapter I, 128 normal maps** (every chosen state of each): the party of seven (tidus 14, yuna 12, kimahri 13, auron 11, wakka 12, lulu 13, rikku 12), Seymour Flux's body 6 and Mortiorchis 5, the five aeons the build can summon (valefor, ifrit, ixion, shiva, bahamut: 6 each). **Chapter IV, 72:** yuna-white-mage 16, rikku-dark-knight 15, paine-warrior 18,
  paine-dark-knight 16 (the maps lane covered it; Paine owns it), ffx2-bahamut 7. **Two depth maps:** `backdrops/gagazet.depth.png`, `backdrops/bevelle-underground.depth.png` (base size only: the look asks for no other). The figure depth maps (`<pose>.depth.png`), the backdrops' normal maps and the numbered candidates' maps (`attack.1.normal.png`) are not read by the game and not shipped.
  The census behind this: a whole fight of each chapter under the intended auto-player on the dev server, `?demo=1`, 2560x1440 (Chapter I 42 map requests, Chapter IV 13, all answered); the rigged bosses and aeons ask for their idle map too (the painted idle is staged before the rig takes over), so they ship.
- **Not covered, so unlit and never requested:** any other dresssphere of the three girls (Yuna's gunner, Rikku's and Paine's others: a swap in Chapter IV shows the new dresssphere without the light); every figure of every other chapter. The maps lane would have to make them.

## Bytes

**+82.05 MB shipped** (+0.76 percent of the 10,848.6 MB art; `art/derived.json`): the 200 normal maps are 79.18 MB as made and **73.31 MB shipped** (recompressed PNG, pixels proved identical: their alpha is the painting's, so no WebP is decoder-independent, `exact` keeps them PNG),
the 2 depth maps 8.75 MB **byte for byte the master's** (16-bit, `refusalFor` leaves them alone). The same sources built from `D:/pyrefly-art-demo` ship 10,766.6 MB of art (699 WebP, 3,179 recompressed PNG, 343 unchanged); with the maps 10,848.6 MB (699, 3,379, 345).
**The 16-bit depth survives the pipeline untouched; the look needs 8 bits** (`farK = 1.0 - textureLod(uDepth, q, 0.0).r`, one channel of a smooth far fog; a browser decodes the PNG to its high byte): see "Checks".

## Checks (candidate build of `r60-art` with `public/` staged onto the new mirror, `BASE_PATH=/`; scratch `D:/Tools/pyrefly-scratch/2026-10-20/r60-art/`)

- `node tools/art-derive.mjs verify --dir <build> --public <staged public>`: `art-derive verify (exact): PASS: 4423 masters checked (699 WebP, 3724 PNG, 4078 pixel-compared); strip thumbnails: 38 checked ...; sidecars: 1312 art JSON checked ...; 0 problem(s), 134 s`.
- `audit`: `art-derive audit: PASS: 1338 text files read; 2 art name(s) in pages, styles and data, each a shipped file: yes` (bundle: 760 literal art names, 0 dangling).
- `node tools/art-browser-load.mjs`: `PASS: 4423 art file(s) (699 WebP, 3379 recompressed PNG, 345 PNG as shipped), 38 strip thumbnail(s) and 36 other image(s) in chromium and webkit, 274 s`: 4497 of 4497 loaded and decoded at the master's size in each, maps included.
- `node tools/rig-gate.mjs --rig <six> --verify --art D:/pyrefly-art-r60`: PASS, ffx2-bahamut (6 keys, 1 exempt, 60 files), ifrit, lulu, pterya, seymour-flux-body, valefor: as against the demo mirror.
- **Production, `vite preview`, `?demo=1`, headless Chromium on the GPU:** Chapter I and Chapter IV, first menu and then the whole fight under the intended auto-player: both victories, **0 console errors, 0 responses of 400 or more**, `relight: { any: true, missing: 0 }`, the depth map loaded (`bold.depth: loaded`); Chapter I 38 maps asked, Chapter IV 13, all answered. With the manifest the maps are listed, so nothing is probed.
  **The relight is visibly on:** the same frame with the figures' relight forced off differs by a mean 4.2 (Chapter I party crop) and 3.6 (Chapter IV girls crop) levels of 255, on 18 to 20 percent of the pixels by more than 8 (frame to frame noise: 0.5 to 0.9 mean); crops `prod-check/ch1-2560-crops-...png`, `ch4-2560-crops-...png`
  (A default look, B relight off, C `?look=off`).
- **The 16-bit depth maps** (`depth8.mjs` in the scratch folder): the shipped `gagazet.depth.png` and `bevelle-underground.depth.png` are byte for byte the masters (sha256); read as true 16-bit samples they hold about 60,000 distinct levels, and the browser's decode of the shipped file (an `<img>` drawn to a canvas, as WebGL reads it) equals the high byte of the master at all 48 sampled points of each (max error 0): 256 levels of the room's log depth, a step of 0.4 percent of the far fog, which the shader's one-channel read cannot show.
- **A chapter without the look asks for no map:** Chapter II on the same build, `?demo=1`: look null, 0 map requests, 0 responses of 400 or more, 0 console errors.
- Unit: `tests/unit/art-manifest-maps.test.ts` (8), `art-maps-mirror.test.ts` (6); 68 art, look, manifest, relight and demo files pass; `tsc --noEmit` clean; `node tools/orphans.mjs` 1,941 modules, the same 24 orphaned.

## The battle-start gap (measured on the production build, 1600x900, a fresh browser each, three runs each, the longest rAF gap from the battle screen)

| | with the maps (`dist-r60`) | no maps (same sources on the demo mirror) | `?look=off` (maps still fetched) |
|---|---|---|---|
| Chapter I | 933, 1017, 967 ms | 867, 917, 1050 ms | 900, 867, 800 ms |
| Chapter IV | 100, 83, 83 ms | 100, 83, 67 ms | 67, 83, 117 ms |

**The maps add nothing measurable to it** (means 972 ms with them, 945 without; the spread is larger than the difference). **The Chapter I gap of about 0.9 s is there with the look off too** (856 ms, three samples each; in the dev server the assembly saw none with `?look=off`), so in production the look's share of it is about 0.1 s at most and the rest belongs to Chapter I's battle build, which this lane did not take apart (Seymour's rig is 72 texture files, a candidate, not measured). The gap starts at the battle screen's first frame (27 to 55 ms before the screen reports `battle`) and Chapter IV has none above 117 ms.
So no map preload is proposed: the maps are not the cost. Had they been, the fix would be to fetch the two chapters' base maps into the HTTP cache while the title shows (`fetch(url)` from the chapter board's selection), which the manifest's list makes a ten-line addition.

## Findings for the driver

- `?look=off` still arms the look (the address carries a `look` key), so the figures fetch their maps although nothing uses them; only a reviewer's flag, no default path asks for a map in a chapter without the look (checked: Chapter II, under "Checks").
- The rigged bosses are lit only while their painted idle is staged: the relight does not reach a rig's parts (`demo-looks.md`), so in Chapter I and Chapter IV the party is lit and Seymour Flux and Bahamut are not.
- `vite preview` answers a missing file with `index.html` and a 200, so a missing map shows as a 200 there and as a 404 on the live host; the manifest listing is what keeps both quiet.
