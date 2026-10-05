# Paper preflight: release 39, the high-resolution engine (`r39-hires-engine`)

Paper preflight under AGENTS.md rule 15 and `critic/RUBRIC.md` §4, 2026-10-04, by a Sonnet sub-agent of the driver session.
Track: `r39-hires-engine` (branch from `origin/r38-bytes` 61708db6, worktree `D:/pyrefly-r21-road`). Priority 1 was built and measured
first (it is what Bailey sees on today's camera); this note was written when priority 2 began and is updated with the measured
numbers as each part lands. Nothing here is deployed, nothing is merged.

`node tools/critic-plan.mjs --paths src/engine/Renderer.ts,src/engine/PaintedArt.ts,src/engine/BattlePresenterStage.ts,src/engine/fx/b/DepthPlates.ts,tools/gen/manifest.mjs,...`
says **DEEP**: "global layout, input and boot", "asset loader and manifests" and "battle presenter and lifecycle" are shared systems.
Not the save-data class (no save key, no setting: the device tier is automatic), so the focused review runs before a deploy and the
deep one after it, on the live build. Obligations: live + focused + deep. Checks: CHK-002 003 006 008 009 012 013 015 016 017 018
019 020 021 022 023. Targets: cast, fight, pause, phone, presentation, scenes.

Bailey, 2026-10-04 ~00:35 EDT, verbatim: "I need super high resolution now. DO NOT hold back. I want the visual fidelity to be
amazing and absolutely beautiful. The critic will ensure this is the case." Release 39 ships on Cloudflare, which lifts GitHub's
1 GB cap; the 800 MB rule (D-332, D-344) no longer binds it, but the totals are reported.

---

## 1. Game case (rule 14)

**Both games, shared plumbing**, one exception: the Bevelle Underground deck (`src/scenes/bevelle-underground.ts`) is Chapter IV,
**FFX-2 only**. Every other change is the renderer's, the art loader's or the manifest's and means the same in both games
(CHK-020, CHK-021). The held-shot sizes the governor plans for are per game, from `src/engine/fx/mix/heldShots.ts`: the FFX Overdrive
shot (up to 0.72 of the frame's height) is FFX only; the FFX-2 dressphere shot (up to 0.68) is FFX-2 only. The masters are each
figure's own (FFX figures, FFX-2 dresspheres, bosses by chapter): nothing is drawn for a figure that has no approved painting.

## 2. What is true today (read from the code and measured on the release 38 build)

- **Plates.** `DepthPlates.build` cut every backdrop painting (2688x1536) at 2048 wide (`plates.width`), four plates, and drew
  them: 1.28x / 1.72x / 2.57x texels per pixel at 1080p / 1440p / 4K in Chapter I's first menu, 1.15x / 1.53x / 2.29x in Chapter IV's.
  The depth maps are 1344x768 (`public/fx/*/depth.json`).
- **Floors.** `Backdrop`'s ground is a 1024 canvas repeated 4x over 44 units (Chapter I); the Bevelle deck is a 512 canvas
  repeated 3.25x over 46 units. The earlier evidence (`D:/Tools/pyrefly-scratch/2026-10-04/closeup/capture`) read them as 11.6x and
  22x typical because it did not divide by the repeat. Corrected, 1440p: Chapter I median 2.47x (max 3.63), Chapter IV median 6.2x (max 10.0).
- **Edges.** `antialias: false`, no multisampling, no AA pass.
- **Figures.** `ArtTier.ts` (D-315) loads a `@2x` master of an idle on a desktop and nothing else; every pose, every boss part and
  every backdrop is the 1x file. The standard camera at 1440p draws every figure at 0.25x to 0.95x (the rig table, `docs/handoff/r39-hires-engine.md`),
  so the figures are fine there; the camera lab's close shots (HERO CLOSE 2.4x to 3.0x) and 4K are what ask for more.
- **Cache.** `PaintedArtCache` is bounded by count (96) only.
- **Found by the all-chapters sweep (hiding each textured plane in turn on a frozen frame, `planecheck.mjs`).** The parallax bands
  (`backdrop-layer-N`) were capped at 1536 px wide: in the scenes with no depth plates (Evrae's deck, Yojimbo's cavern, Natus, the Fallen
  Aeons, Sin) they cover the lower half of the frame and were the softest thing in it (2.1x to 3.2x at 1440p, against the painting's 1.2x
  to 1.4x). The Fahrenheit's foredeck (FFX only: Evrae, Sin's flight) was a 1024 x 2048 canvas, 3.9x at 1440p. And `Backdrop.dispose`
  never freed the painting's own texture: every battle left 22 MB (84 MB from a 2x master) on the GPU.

## 3. What is built, and the alternatives that were weighed

1. **Plates (1a).** The cut runs at the depth map's own 1344 (a quarter of the cost of a cut at 2688, half of the old 2048); the
   plates are composed on the GPU at the painting's own width (2688, or the 2x master's 5376) from the painting's pixels and the cut's
   fill and alpha. *Rejected:* a CPU composite at 16.5 million pixels (about 1 GB of transient typed arrays and 2 to 4 s of main thread);
   shader-composed plates over one shared painting texture (the best memory, but it rewrites `Lamps`, `PlateFocus` and the floor
   shader); a second cut at 5376 (6.9x the old cost).
2. **Floors (1b).** Both floors are procedural canvases written on a design grid, so they are drawn through a scale to the device's
   budget (1024 / 2048 / 4096 for the snow, 512 / 2048 / 4096 for the deck). *Rejected:* a RealESRGAN + SDXL upscale of the floors
   (they are vector drawings, not paintings: the same drawing at 8x the pixels is exact, where an upscale would invent a new floor);
   a detail-texture layer (a second texture and a patched shader for what a bigger canvas does without changing a material).
3. **Anti-aliasing (1c).** SMAA after the grade is the desktop default; 4x MSAA on the scene pass is kept selectable (`?aa=msaa`).
   Measured, paired and interleaved: SMAA +0.05 ms / +0.4 ms at 1440p / 4K and 57 / 127 MB; MSAA +0.9 ms / +1.9 ms and 211 / 475 MB,
   and MSAA cannot touch a figure's texture edge or rim light. *Rejected:* multisampling both composer buffers (three times the memory
   for no benefit, a full-screen post pass has no edges); FXAA (blurs the painted detail more than SMAA); TAA (ghosts on the particles).
4. **Bands and the Fahrenheit's deck (1b follow-up).** `ArtBudget.bandPx` (1536 phone and low, 2688 mid, 4096 high) is the band cap;
   the deck is drawn on its design grid through `floorDetail` (1 / 1 / 2 / 3, and 4 on a strong card at 4K). *Rejected:* cropping each band's
   canvas to its rows (a third of the memory, but the planes, their feathers and the parallax placement were tuned on full-height
   quads); drawing the bands at the master's full 5376 (176 MB for two layers, and they sit under the same camera as a painting that is
   already sharper than a pixel).
5. **The cold first battle (2 follow-up).** Every pose at 2x from 1440p up made a first battle 3x the bytes (59 MB to 177 MB, Chapter I), +28 s on the project's
   named network (25 Mbit/s, 20 ms: 22.8 s to 50.5 s). So only the backdrop and the poses the first menu draws (`ArtTier.isOpeningPose`: `idle*`, `ready`) start at the
   master; every other pose starts at the approved file and the governor's existing sibling rule brings it to the base scale in the background once its figure's
   opening pose is on screen, as room allows and without evicting. A slow link (`ArtDevice.slowLink`: data-saver, 3G or slower, under 10 Mbit/s; Chromium
   reports it, the rest read as fast) starts everything at the approved file. *Rejected:* a settings row (no setting, no save key); measuring throughput from
   the page's own resources (HTTP/2 shares one pipe among parallel responses, so a busy page reads slow).
6. **Tiers (2).** `ArtBudget` (pure) classes the device (phone / low / mid / high) from the GPU string and the phone layout and gives
   each class a budget; `ArtTier` names `@2x` to `@4x` masters; the manifest lists them (`tiers`, `backdropTiers`); `ArtGovernor` measures
   every drawn figure against the camera that is looking at it and swaps in the smallest master that keeps a texel under one pixel,
   in place, within the class's ceiling and texture budget, evicting the masters that are off screen first; `StageArt` plans ahead
   (every rig at rest, the held shots by size, the colossus master). *Rejected:* choosing a tier once per session (a close shot needs
   what a wide one does not); a settings row (Bailey: automatic by device, no save key); loading every pose at 4x (about 3 GB for
   one battle).

## 4. Risks, and what answers each

| Risk | Answer |
|---|---|
| VRAM: high tier holds about 575 MB of textures in Chapter I at 1440p (262 before), 640 MB in Chapter IV | Per-class budget; plates 2x only on a discrete GPU at 1440p and up; `?arttier=` to force a class; measured per tier in the handoff |
| A discrete GPU string that is not in the list reads as `mid` | `classifyGpu` falls to `unknown` -> `mid`: native plates, 2048 floors, SMAA, figures to 2x. Never a crash, only less |
| The sRGB path of the GPU composite differs from the CPU plates | Same frame, plates on against the painting plane alone: mean difference 4.14 against 4.12 on the release 38 build (`platecheck.mjs`), the crops side by side |
| Upload hitch when a 4x master is swapped in (50 MB) | One swap per frame, two loads in flight; the persistence rule (0.3 s) so a punch does not fetch; measured frame spikes in the handoff |
| The governor chases a transient (a punch, a shake) | `PERSIST_MS` (0.3 s, time not frames, so a 240 Hz screen waits as long as a 60 Hz one); planned views are rigs at rest, never pushes |
| Memory growth over a long session | Eviction by `evictionOrder`; the painting cache is bounded by decoded megabytes as well as count; textures are disposed with their actors |
| Missing or undecodable master | Falls back one tier at a time to the approved painting; a failed scale is not asked for again; no new 404 (the manifest lists what exists) |
| The approved 1x paintings | Never replaced: masters are added files; `tools/hires-install.mjs` checks the 1x sha256 and never overwrites; `docs/target/approved-hashes.json` untouched |
| WebGL context loss | The composed plates are render targets and die with the context; `LivingPaintings` rebuilds them on `webglcontextrestored` (measured: lose and restore at 1080p and 1440p in Chapters I and IV, mean difference 0.1 level, no errors) |
| The deck sparkles with a sharper bump map | The drawing is the same plate through a scale, no extra grain; the crops in the handoff; `?arttier=low` shows the old 512 deck |
| Bytes | Masters ship as PNG under the exact scope (partly transparent), see the handoff's totals and the decision it asks Bailey for |
| First load: every pose at 2x was 3x the bytes before the first menu (59 MB to 177 MB, Chapter I at 1440p; 22.8 s to 50.5 s on 25 Mbit/s) | Only the backdrop and the opening poses start at the master, the rest at 1x and then up in the background (sibling rule); `slowLink` keeps a slow connection at the approved set; measured in the handoff |
| A battle leaves textures on the GPU | The one that did (the backdrop painting, pre-existing) is fixed and measured flat over six visits (`leak.mjs`: 148 MB at the chapter select after each) |

## 5. Measurement plan (all headless GPU Playwright from node, one browser at a time)

Before: the pristine production build of the starting commit (served on 6921) and the live site, Chapters I and IV at 1080p, 1440p,
4K and a 390x844 phone at 4x CPU throttle. After: the same matrix on the branch's build. Per run: magnification of every figure,
plate and floor (`inpage.mjs`), GPU texture bytes by tracking every `texStorage2D`/`renderbufferStorage` call, an isolated render
benchmark (render + one-pixel readback, 150 frames) and the uncapped rAF intervals, first-menu time and art bytes. 1:1 crops of floors,
plates, faces and silhouettes at 1440p and 4K. The harness is `D:/Tools/pyrefly-scratch/2026-10-04/hires-engine/harness/`.

## 6. For the critic

Look at: the plates against the painting at the drift extremes (a seam where two plates part), the deck's crops (no sparkle, the
seams where they were), a figure's edge with SMAA (no softened thin line), a held close shot (`__pyrefly.art.stats()` shows the
masters arriving; the first 0.3 s are the smaller one by design), the phone (no 2x plates, no SMAA, no 4096 canvases), and that no
approved painting's hash changed. Unknown on a critical is a HOLD.
