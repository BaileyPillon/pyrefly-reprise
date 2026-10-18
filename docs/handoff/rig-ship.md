# The rig ships (branch `rig`, 2026-10-17): the release art mirror, the 1x tier, the deploy gate

Bailey, 2026-10-17: "yes start rigging ... start rigging for all chapters please. i want a permanent fix now." and his standing "i'll go with all your recommendations". This is the **SHIP lane**: everything a rig needs to
get into a release. The engine is [rig-engine.md](rig-engine.md), the cutting pipeline and the rig gate are [rig-pipeline.md](rig-pipeline.md). **Game case: both games, shared plumbing** (nothing here knows which game a figure is
from; FFX chapters are 1 to 3, FFX-2 chapters are 4 and 5, and a rig is per art id). Paper preflight: [docs/plans/rig-review.md](../plans/rig-review.md). Contract entry: [CONTRACT-CHANGES](../CONTRACT-CHANGES.md), 2026-10-17, "The rig ships".

**Not merged, not deployed, no review run.** No rig exists in `public/art` or in any release mirror yet: Kimahri's rig is still being fitted (it does not pass the gate). Everything below is proved on fixtures, on a real production
build of a scratch mirror, and (the memory numbers) on Kimahri's real parts in a real battle.

## The driver's two rules, and where each is kept

| Rule | Kept by |
|---|---|
| **(a) A figure turns its rig on only with FULL COVERAGE**: every pose the game paints it in has a gate-passing key. No per-pose fallback to paintings. | `rig-gate` demands it **by default** (`--allow-partial` is the dev loop's opt-out; the stamp then says `coverage: "partial"`, which `--verify` and the deploy refuse; `--require-coverage` is still accepted and means the default). The installer (`art-install --rig`) and the pose-gate census (`--rigs`) require it too. At the stage, `RigLoad.chooseRig` applies it again to the poses the figure's art actually paints: a figure with a painted pose that has no key and is not in the stamp's `exempt` list is **the painting set**, with the reason on record (`[rig] kimahri off (no key for cast ...)`). `?rig=on` (a person looking at a rig still being fitted) skips that one rule. |
| **(b) The deploy runs `rig-gate --verify` on every shipped rig; any refusal stops it; `--owner-override` does not bypass it.** | `tools/deploy-pages.mjs` calls `enforceShippedRigs` as the **first preflight step** (before tsc, vitest, the audio check and the pose scan; in `--dry-run` too; outside the `--skip-tests` branch; above the release gate that `--owner-override` reaches), and `enforceBuiltRigs` after the build. `tests/unit/tools/rig-deploy-dry.test.ts` runs the real `deploy-pages.mjs --dry-run` against a fake root with six kinds of bad rig, with and without both flags. |

## The commands

```
node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/<subject> [--art D:/pyrefly-art-r50]     judge it, full coverage required, stamp the verdict, the ship record and every key's silhouette
node tools/rig-gate.mjs --rig <folder> --verify --art <release art folder>                   the cheap check the DEPLOY runs: stamp ok + full coverage + seal, costume = the master in --art, every painted pose keyed, the 1x tier proved, nothing unvetted in the folder
node tools/rig-tiers.mjs write|verify --rig <folder>                                          the 1x twins of every part PNG and rim mask (art-install --rig writes them for you)
node tools/art-mirror-add-rigs.mjs --from D:/pyrefly-art-r50 --rigs D:/pyrefly-art-rigs --to D:/pyrefly-art-r51 [--subjects a,b] [--make-tiers] [--dry]
```

## Cutting a release that carries a rig (the order)

1. The rig passes the gate: `node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/<subject> --art D:/pyrefly-art-r50` (or it was installed with `art-install --rig`, which also writes `1x/`).
2. `node tools/art-mirror-add-rigs.mjs --from D:/pyrefly-art-r50 --rigs D:/pyrefly-art-rigs --to D:/pyrefly-art-r51 --dry`, then without `--dry`. It refuses before writing if the target exists, is inside the source or is on another
   volume, or if any rig does not verify against **the source mirror's paintings**. It ends with `PROVED`.
3. Point the release worktree's `public/art` junction at `D:/pyrefly-art-r51` (`cmd /c rmdir` the old junction first; never delete through it).
4. `npm run deploy` from `D:\pyrefly-release` as always. The rig gate runs first, the build's `art/rigs` is proved against it after, and the rest of the art gates (identity, audit, WebKit and Chromium load, the artifact manifest) cover
   the rig's files because they are art masters like any other.
5. `critic-plan --paths` says what review the change needs: `public/art/**` is the "painted artwork" system (focused), and the files of the asset loader (`ArtManifest.ts`, `tools/gen/manifest.mjs`) are "deep after the deploy".

## What was built, part by part

| Part | Files | What it does |
|---|---|---|
| Release art mirror | `tools/art-mirror-add-rigs.mjs`, `tools/rig/rig-mirror.mjs` | A NEW mirror: every file of the source mirror hard-linked (none opened for writing), `manifest.json` and `rigs/<subject>/` real files of their own (`COPYFILE_EXCL`, byte-compared). `verifyMirror` proves inodes, link counts, bytes, the manifest and each rig again in the new place. Tested on fixtures, and run for real on M: (4 linked, 7 copied, 6 tier files, PROVED). **Not run on `D:/pyrefly-art-r50`**: it is the source and is only read; a trial with the real r50 as the source needs a target on D: (a hard link cannot cross to M:), which this lane was told not to make. |
| Art pipeline | `tools/gen/manifest.mjs` (`rigTiers`), `ArtManifest.ts`, `art-sidecar-fields.mjs` (`art/rigs/*/rig.json` is no painting sidecar), `artifact-manifest.mjs` (a rim mask may be flat), `tests/unit/art-sidecar-redact.test.ts` | The part PNGs, rim masks and 1x twins are in `listMasterPngs`, so `art-derive` plans them (an opaque one as a lossless WebP, one with partly transparent texels as a recompressed PNG), `verify` proves their pixels, `audit` finds no dangling name, `art-browser-load` loads them in WebKit and Chromium at their master's size, the artifact manifest hashes them and the privacy gate scans `rig.json`. Proved by `tests/unit/tools/rig-art-pipeline.test.ts` and by a real `vite build` of a scratch mirror (below). The sidecar-guard test had been failing on this branch since the engine lane read `rig.json` from `RigLoad.ts`; it lists the reader now. |
| Device tiers | `tools/rig/rig-tiers.mjs`, `src/engine/rig/RigTier.ts`, `RigFigure.ts`, `RigActor.ts`, `RigLoad.ts` | `<subject>/1x/<same names>` at half width and height, derived by an integer 2x2 premultiplied box rule and proved by re-deriving. A figure loads the tier the device would draw its idle painting at (`ArtTier.baseScaleFor`), **the rim masks at 1x whenever a twin exists** (the rim is a soft factor along an outline, read in painting px; a mask already at half its map's size or less has a byte-identical twin, Kimahri's do), inside `RIG_SHARE` (0.5) of the class's texture budget, from the file sizes the gate stamps (`gate.textures`); over the budget it takes the 1x tier, and over it again it is the painting set. A figure on its 1x maps raises them to 2x when the camera magnifies the idle's texel past a pixel (the art governor's own target), if the budget has room. Part URLs go through `shippedArtUrl`, so a master the build derived as WebP is asked for as `.webp`. |
| Silhouette per key | `tools/rig/rig-silhouette.mjs`, `src/engine/rig/RigShape.ts`, `RigSilhouette.ts`, `Silhouette.ts` (3 lines) | The gate measures each key's posed box (alpha 0.35), lowest foot and 40-band painted front from its own raster and stamps them into `gate.silhouettes`. `RigActor.contentQuad` (the HUD's target brackets), `poseShape` and `Silhouette.profileOfActor` (the strike's reach) follow the pose SHOWN, blended between keys on the game's ease; `feetPoint()` is the foot. |
| Deploy gate | `tools/rig/rig-ship.mjs`, `tools/deploy-pages.mjs` | `verifyShippableRig`, `enforceShippedRigs`, `enforceBuiltRigs` (see the table above). |

## Numbers

**GPU memory of the rigs on a phone, before and after the tiers.** Headless Chromium 153 on the real GPU (`PYREFLY_BROWSER=gpu`), a 390 x 844 portrait window at pixel ratio 2 (the `phone` class: 220 MB for all
figures, so 110 MB for the rigs), the first menu of the hidden chapter "Biran and Yenke", with 6 and then 12 Kimahris added to the live battle through `RigActor.createRigged`. The rig is the Kimahri lane's of 15:44
(15 parts, 32 bones, 13 keys; the part PNGs total 4.79 Mpx and the rim masks 1.16 Mpx). BEFORE is what a rig loaded before the tiers (the full-size maps and rim masks); AFTER is the tier a phone picks (the 1x maps; the rim
masks as they are, because Kimahri's are already half the size of their maps).

| | texture storage asked of the GPU (every `texStorage2D`, counted at the GL call) | the engine's own count (`rigInfo().textureMB`) | GPU process "Dedicated Usage" moved by |
|---|---|---|---|
| before, 6 figures | **181.3 MB** (180 textures) | 181.2 MB | +131.7 MB (three earlier runs: +107, +140, +149) |
| after, 6 figures | **71.9 MB** | 72.0 MB | +126.0 MB |
| before, 12 figures | 362.6 MB | 362.4 MB | +325.5 MB |
| after, 12 figures | 143.7 MB | 144.0 MB | +109.4 MB |

Per figure **30.2 MB to 12.0 MB (60 percent less)**; the phone's share for rigs is 110 MB, so six figures at the old size would not have fitted (the budget would have sent three to the painting set), and at the new size they fit with 38 MB
to spare. **Trust the first two columns, not the third**: they agree to 0.1 MB, so the engine's budget is exact. The Windows per-process counter is noisy at this size (a calibration of four 2048 x 2048 textures read +86 to +91 MB against
85.3 expected, but another process on this machine holds 8.5 GB of the card, so the driver moves allocations between dedicated and shared memory, and the rig runs do not move it by what the API reports). Frame time with 6 or 12 rigs on
screen: median 16.7 ms, p95 16.8 ms (vsync-bound) both ways. Through the real stage on the same window (`?rig=on`): `[rig] kimahri on (gate ok, 15 parts, 32 bones, 13 keys, 1x maps)`, `textureMB` 12, and the figure draws the same
(`docs/screenshots/rig-ship/phone-390x844-kimahri-idle-attack-2x-tier-then-1x-tier.jpg`: idle and a move at the 2x tier, then at the 1x tier, the crop enlarged 2x).

**What the measurement found that the paper did not.** The engine lane's estimate (about 23 MB a figure) and this lane's first count (59 MB a figure) were both wrong for the real rig, in opposite ways. A part's PNG is not always its box
(the ribbon-mapped spear shaft is a 2220 x 64 strip in a 1189 x 1936 box: counting the box overstates it sixteen times), and Kimahri's rim masks are half the size of their maps (the format says "same size as `png`"). Memory is now
budgeted from the sizes of the files themselves, which the gate stamps (`gate.textures`, sealed, checked against the files by `--verify`), and the tier rule halves a rim mask only when it is bigger than half its map. A rim mask is still
uploaded as RGBA (4 bytes a texel for a grey mask): at 1x the rims are 1.16 Mpx of the figure's 2.36 Mpx, so a single-channel upload would take about 40 percent more off.

**The gate, the mirror and the deploy on a real production build.** A scratch mirror made by `art-mirror-add-rigs.mjs` on M: (4 files linked, 7 rig files copied, 6 tier files written, PROVED), a real `vite build` of it
(86 s; `pyrefly-art-derive`: 2 WebP, 12 PNG recompressed), then: `art-derive verify` PASS (16 masters, 14 compared pixel for pixel), the privacy gate clean, `art-browser-load` 16 of 16 in Chromium 153 and WebKit 26.6, the artifact
manifest built with no problem (28 files), `rig-gate --verify` PASS, `enforceShippedRigs` and `enforceBuiltRigs` PASS (13 files under `art/rigs`, `rigTiers` in the built manifest). (The reference audit named the title plate, which the
fixture mirror does not have: nothing to do with rigs.)

## Findings and decisions to know

- **The stamp's ship record is sealed, not signed.** `gate.seal` fingerprints the digest and the fields the digest does not cover (`keys`, `coverage`, `exempt`, `silhouettes`). A hand edit of `coverage` or `exempt` breaks it, the way a hand
  edit of a key breaks the digest. A forged stamp is still possible by recomputing both; the full gate (`rig-gate` without `--verify`, which renders every key and blend) is what a forged stamp meets, and the pose gate's census runs it.
  The deploy runs the cheap check by the driver's wording (`--verify`); say if it should run the full gate too (about 40 s for Kimahri's 13 keys with blends on this machine).
- **`exempt`** are the painted poses with no key that the gate does not owe one (staged or part paintings, or a painting the pose table has no row for). The deploy and the stage refuse a pose painted AFTER the gate ran unless it has a key.
- **The 1x twins are derived, never authored**, and a folder that holds anything else refuses the deploy. A rig cut from a 1x master would need its own story (the rule assumes the rig was cut from the 2x).
- **A rig whose 1x twin is missing from the manifest** has only the full-size files, whatever the device; on a phone that is the budget's problem (the figure may be refused to the painting set). `art-install --rig` and `art-mirror-add-rigs --make-tiers` always write the tier.
- **For the Kimahri lane: the gate refuses a partial rig now, and `rig.py export` runs the gate without a flag** (`rig_export.py` line 83), so an export of a rig still being fitted is stamped `refused` and does not draw. To stamp it
  for the dev loop run `node tools/rig-gate.mjs --rig <folder> --art D:/pyrefly-art-r50 --allow-partial` after the export (it is then `ok` with `coverage: "partial"`, draws with `?rig=on`, and the deploy refuses it), or pass the flag
  through in `rig_export.py`. A rig meant to ship is judged with full coverage, the default.
- **Kimahri's rig on disk (D:/pyrefly-art-rigs/kimahri) does not pass the gate today** (this lane gated a copy: overlaps 0.5 to 0.8 against the 0.85 bar, holes at the forearm, several `key-fit-stale`); that is the Kimahri lane's work and not touched here.
- The scratch files this lane left in the tree are `tools/zz-ship-*.tmp.*` and `tests/unit/tools/zz-ship-world.tmp.test.ts` (not committed).

## What is left

- A real rig to ship: nothing exercises the mirror, the tier and the gate on a real figure until Kimahri's passes. When it does: run the mirror tool on `D:/pyrefly-art-r50` to a new `D:/pyrefly-art-r51` (a driver's step), a real `npm run deploy --dry-run` from the release worktree, and the focused review.
- The settings row for the rig switch (rule 9, Bailey's yes) and the other engine items in `rig-engine.md` (shadows, special looks, edge-feathered subjects) are unchanged.
- A shared-texture cache for several copies of one subject on a stage (they load their textures separately today); and a downgrade path (evicting a raised figure's 2x maps under pressure) as the art governor has for paintings.
- The rim mask is uploaded as RGBA like any texture (4 bytes a texel for a grey mask); a single-channel upload would take it to a quarter.
