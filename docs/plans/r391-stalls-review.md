# Paper preflight: release 39.1, the master-swap stalls (`r391-stalls`)

Paper preflight under AGENTS.md rule 15 and `critic/RUBRIC.md` §4, 2026-10-05, by a Sonnet sub-agent of the driver session.
Track `r391-stalls`: branch from `origin/main` cfab29b4 (release 39, live 816d80f9), worktree `D:/pyrefly-critic-continuity` (no new worktree).
Nothing is deployed and nothing is merged. Bailey (2026-10-04) "I need super high resolution now. DO NOT hold back." and (2026-10-05)
"you can go full speed ahead i have another account with full usage": this is a bug fix inside that approved scope, not a new look.

`node tools/critic-plan.mjs --paths src/engine/ArtGovernor.ts,src/engine/StageArt.ts,src/engine/PaintedArt.ts,src/engine/TextureStager.ts,...`
says **DEEP** ("asset loader and manifests" is a shared system). Not the save-data class (no save key, no setting), so the focused review runs
before a deploy and the deep one after, on the live build. Obligations: live + focused + deep. Checks: CHK-008 012 013 016 017 018 019 020 021
026 027. CHK-026 and CHK-027 are the continuity checks: this change swaps pixels and must not make a pose change pop, flicker or show a half-loaded figure.

## 1. Game case (rule 14)

**Both games, shared plumbing.** The art governor, the painted textures and the renderer are the same code for FFX (chapters 1 to 3 and the FFX
chapters after) and FFX-2 (4, 5 and the FFX-2 chapters after); nothing here reads a game id, and no painting, scale or number of any chapter changes.

## 2. What is true today (measured, not read)

Release 39 swaps a master in place: `ArtGovernor.setImage` does `texture.dispose()`, sets the new image and `needsUpdate = true`, and Three uploads it
inside the next `render()`, on the frame that draws it (`WebGLTextures.uploadTexture`: `texStorage2D`, one `texSubImage2D(image)`, `generateMipmap`).
A pose texture that was never drawn (a sibling the governor brought up in the background, or a base-loaded 2x pose) is uploaded the same way
at its first draw, which is mid-turn. Spike (headless Chromium 153 on the RTX 5070 Ti, ANGLE/D3D11, a draw loop at 60 Hz, real masters;
`D:/Tools/pyrefly-scratch/2026-10-05/r391-stalls/spike/`):

| One master, main-thread time of the upload | 4096 x 4096 figure (16.8 Mpx) | 5376 x 3072 backdrop (16.5 Mpx) | 1346 x 1532 pose (2.1 Mpx) |
|---|---|---|---|
| today: `texSubImage2D(<img>)` with FLIP_Y, no premultiply (what Three does) | **145 ms** (frame 150) | **193 to 216 ms** (frame 200) | 16 ms |
| `createImageBitmap(<img element>, opts)` | 135 ms on the main thread (it decodes synchronously) | not run | 15 ms |
| `createImageBitmap(blob, opts)`, decode off the main thread | 132 ms wall, **0 ms of the main thread** | 201 ms wall, 0 ms | 14 ms wall |
| `texSubImage2D(ImageBitmap)`, one call | 21 ms | 25 ms | 1.8 ms |
| `texSubImage2D(ImageBitmap)` in 256-row bands, one per frame (WebGL2 sub-rectangle overload) | **1.3 to 1.7 ms a band**, 16 frames, no frame over 17 ms | 1.6 to 1.7 ms a band, 12 frames, none over 17 ms | one band |

Why it is slow: with `UNPACK_PREMULTIPLY_ALPHA_WEBGL` off and an image that has alpha, Chromium decodes the PNG again on the main thread inside the
upload (the `img.decode()` the loader awaits decodes the premultiplied copy, which is a different one). The bitmap path decodes once, off the
thread, with the alpha left straight. In the real game (release 39 production code build, Chapter I, 1440p, real keys, the first three turns)
the same thing shows up as 18 `texSubImage2D` calls of 17 to 39 ms each and 12 frames over 50 ms (worst 167 ms); frames of 66 to 83 ms line up with them.

**Pixels.** The same spike read level 0 back after each path on three real masters (Tidus ready 4x, Bahamut idle 2x, Seymour Flux body idle 3x: 340,533 to
1,971,579 texels of colour hidden under alpha 0 and 57,783 to 155,793 of partial alpha): the legacy upload, the banded bitmap upload and the one-shot bitmap upload
are byte for byte the same, and equal sharp's straight RGBA read of the PNG, flipped. 0 GL errors.

## 3. Options

1. **Decode off-thread (`createImageBitmap(blob)`) and upload in one call.** Removes the 145 to 216 ms; leaves a 21 to 25 ms call that, with the frame
   itself, is one dropped frame (30 to 50 ms) on every big master, mid-turn. Needs the file's bytes as a Blob (an `<img>` source decodes synchronously).
2. **Upload ahead of the cut in slices, swap when resident (chosen).** `texStorage2D` through Three (`renderer.initTexture` of a staging texture whose
   `source.dataReady` is false), then `texSubImage2D` of the bitmap in row bands through the WebGL2 sub-rectangle overload, a byte budget a frame, then
   `generateMipmap`. The painting keeps drawing from the texture it has; when the staging texture is fully resident the painting adopts its GPU texture
   (Three's own `Source` sharing: the painting's `texture.source` becomes the staging texture's, the painting's old GL texture is freed, no upload) and
   the staging texture is disposed. The swap is atomic in one frame and costs no upload. Worst frame cost of a band: 1.3 to 1.7 ms.
3. **`texStorage2D` plus `texSubImage2D` in bands by hand, outside Three.** Same bands as option 2 but the GL texture is made by hand: Three cannot adopt
   it (its `_sources` map is private), so the painting would have to be pointed at a new texture object everywhere it is referenced (two slot materials,
   the shadow depth material, the governor's map). Rejected for the blast radius.
4. **A compressed GPU texture format (KTX2 / Basis).** Smallest uploads and memory, but it needs a transcoder download (the Basis wasm and its loader,
   a third-party artifact), a second shipped file set for every master, and it is not lossless: it breaks the exact-art rule (a shipped image must stay
   pixel-identical, `tools/art-derive.mjs`, `tools/art-browser-identity.mjs`). Not built. Asking the driver first is not needed because nothing here needs it.
5. **GPU to GPU copy (`copyTextureToTexture`) from a staging texture into the painting's texture.** Atomic and cheap on the GPU, but it needs the painting's
   texture allocated at the new size first (a second full allocation, a copy of up to 89 MB and the staging texture alive at once). Option 2 adopts the staged
   texture and frees the old one, so peak memory is the same and nothing is copied.

Fall-backs, because nothing here may make a browser worse than release 39: (a) no bands (the browser rejects the sub-rectangle overload, or `properties` is not
the shape pinned three 0.186 has): the same staged texture is uploaded in one `initTexture` call and adopted, which costs 21 to 25 ms on the biggest master and
nothing on a 2x pose; (b) no bitmap (no `createImageBitmap`, the probe fails): the release 39 in-place swap, unchanged.

## 4. Design (as built; the changes from the first draft of this note are marked)

- `MasterLoad.ts` (new): the governor's load, fetched once as a Blob: an `<img>` over an object URL (the handle `texture.image` keeps; decoded off the thread as `loadPixels` always did,
  because the effects that read a painting's alpha through a 2D canvas draw it: `fx/mix/breathRig.ts`, `geometry.ts`) and
  `createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none', imageOrientation: 'flipY' })`. The same fall-back chain as `loadPixels`
  (one retry when the manifest says the file ships, then the next master down, then the approved file). *Changed:* a background load is fetched at `priority: 'low'` (an `<img>` request
  is low priority, a `fetch` is high, and on a slow link the speculative masters must not crowd out what the first menu waits for) and a warm-up reads the cache (`force-cache`).
- `TextureStager.ts` (new, plus `StageBands.ts` for the pure arithmetic and `StageProbe.ts` for the runtime check): jobs, the per-frame band budget (about
  4 MB a frame, 6 MB for a live need, a quarter of that while the page is already late), the adoption, cancellation on dispose and on a lost context.
  A probe at first use uploads a 4 x 2 PNG with colour under alpha 0 and partial alpha both ways (the legacy `<img>` path and the staged path), reads both back
  and compares them: any difference or error turns the stager off for the session, so a browser or a driver where the bitmap path is not exact keeps the
  release 39 path. This is the runtime form of the exact-art rule.
- `ArtGovernor`: a loaded master is staged (when the stage dependency exists and the load carried a bitmap) and only then queued to be applied; a load
  stays counted as in flight until it is resident, so at most two masters are in the air (*changed:* plus one more for a figure on screen, so a live need never waits behind a
  speculative load); the staged swap is applied in the frame's own `update`, before the render; the stats gain `staging`, `stagedLanded`, `warmed`, `warmMB` and the last swaps with
  how long each waited. Eviction is unchanged (it hands back the base image; that upload is lazy as before; it only runs over the texture budget, which the high class does not reach).
- **The warm pool (*added after the first measurement*).** The first build removed the master-swap stalls but left the same stall one step earlier: a pose whose master had been swapped in
  place but never drawn (a sibling brought up in the background, or a 2x opening pose the first menu had not drawn yet, the `ready` pose of each hero) was uploaded by Three at its first draw,
  mid-turn (17 to 39 ms a texture). The governor now uploads those ahead of their first draw the same way (a painting not drawn yet is staged, and a base-loaded one of 1.5 Mpx or more is
  re-read from the cache and staged as the master it already holds), up to a cap on speculative GPU memory: a share of the class's texture budget (30 percent), never more than 640 MB
  (`ArtMemory.ts`). Past the cap a painting is uploaded the old way at its first draw. This costs memory early (Chapter I, 1440p: about +600 MB at the first menu) and is measured below.
- `?stage=off` (and `__pyrefly.art.stage(false)`): the kill switch and the A/B of the measurements; nothing is saved.
- `StageArt` builds the stager from the renderer the stage is given and ticks it each frame; `BattleScreen` hands the stage the renderer (one line).

## 5. Risks

| Risk | What stops it |
|---|---|
| **Memory.** A decoded bitmap is 33 to 89 MB of CPU memory and the staging texture is up to 89 MB of GPU until adoption (the painting's old texture is freed at the swap). | At most two masters in the air (the existing `MAX_LOADS`), the bitmap is closed the moment its last band is in, the governor's `committedMB` already counts a load on its way as promised, so the texture budget (900 / 2600 MB) already covers staging. Measured before and after (GPU tally, peak and resident). |
| **Context loss.** A job holds a staging texture and a bitmap across frames. | Every job checks `gl.isContextLost()` each tick; a lost context cancels every job (disposes the staging textures, closes the bitmaps) and the governor re-asks; Three re-uploads the painting from `texture.image` (the `<img>` handle, unchanged) after a restore, exactly as in release 39. |
| **Safari / WebKit / Firefox.** The WebGL2 sub-rectangle overload for an ImageBitmap, the bitmap options and `UNPACK_SKIP_ROWS` are less exercised there. | The runtime probe (above) and the two fall-backs. Playwright's WebKit runs the probe in the unit run's browser check; real Safari and Firefox are not measured (said so in the handoff). |
| **Exact art.** A decoded master must equal what the legacy path draws. | The identity spike above (legacy == banded == one-shot == sharp, byte for byte, on masters with hidden colour and partial alpha), the same comparison as a browser test over real masters on the production build, the probe at run time, and `art-derive verify/audit` and `art-browser-identity --screen-exact` on the build (the shipped files are untouched, so these prove the build and the identity test proves the upload). |
| **Three internals.** The band path reads `renderer.properties.get(texture).__webglTexture`. | three is pinned at 0.186.0; the path is guarded (`typeof` checks on the handle, a `WebGLTexture` instance check) and falls back to the one-shot staged upload; a unit test pins the shape against the real three package. The `Source` sharing and `initTexture` are public three behaviour (a cloned texture shares its source and its GL texture by design). |
| **A pose drawn before its master lands.** | Unchanged from release 39 (it draws the file it has); the swap is now atomic and never lands mid-upload. |
| **Time to first sharp master.** Staging adds the band time (0.1 to 0.3 s for a 4x master) to a swap that used to be instant but froze the page. | Measured and reported; a live need gets the larger budget. |
| **File size / layering.** `ArtGovernor.ts` is 388 of 400 lines. | The stats shape moves to its own module; the new code lives in new files; `BattlePresenter*.ts` stays free of DOM (the stage only forwards an opaque host). |

## 6. How I will measure

Production code builds (`vite build`, `publicDir` off, the art served from one shared root so before and after draw the same files) of `cfab29b4` (before) and of the
branch (after), `PYREFLY_BROWSER=gpu`, headless Chromium from node (no extension, no browser pane), at most two browsers at once, one at a time for timing. Chapters I (FFX),
IV (FFX-2) and VIII (FFX) at 2560 x 1440 and 3840 x 2160, real keys, three commands from the first menu to the end of the third turn, three repetitions each side. Per run:
frames over 33, 50 and 100 ms and the worst frame (whole window and load and intro apart), every GL texture call over 0.8 ms and the frame it landed in, long tasks, the exact GPU
texture tally (at the first menu, at the end, peak), the governor's timeline (first swap after the first menu, swaps in the turns), and art bytes fetched. Then the gates: `tsc`,
the art, governor and loader tests and the new ones, `node tools/orphans.mjs`, `art-derive verify` and `audit`, `art-browser-load`, `art-browser-identity --screen-exact` on a full build, the full
`npm test` before the push.

## 7. Not doing

No new look, no new art, no setting and no save key. No change to which master is chosen, to the budget or to the plan (`StageArt.plan`). No compressed format. No change to the first
load of the base paintings (the opening poses and the backdrop still arrive as in release 39; measured and reported, not touched unless the numbers ask for it). No eviction rework.

## 8. Results

See `docs/handoff/r391-stalls.md`: the before and after tables, the memory, the identity proofs and what is left.
