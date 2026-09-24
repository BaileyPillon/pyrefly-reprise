# Chapter X (Seymour Natus): installed production candidates

**Which game (rule 14): FFX only.** Natus, Mortibody and the Highbridge fight exist only in FFX.

Bailey, 2026-09-24 ~14:40 EDT, verbatim: *"I'll go with your recommendations for all"*. That
answer picks O-1 A, O-2 A with the KO-and-revive strip, O-3 C (night, the city lit) and O-5 A
(`README.md`). Every file below is a **CANDIDATE**. None is judged independently, none is in
`approved-hashes.json`, and nothing in `src/` loads it yet. All five sit under **new** ids, so
no existing file was replaced and no backup was needed. `public/art` is gitignored, so these
files exist only on this disk. `public/art/manifest.json` was regenerated with
`node tools/gen/manifest.mjs` (65 subjects, 34 portraits, 12 backdrops).

| Path (under `public/art/`) | Pick | Size | sha256 (first 12) | What was done |
|---|---|---|---|---|
| `characters/seymour-natus/idle.png` + `.json` | O-1 A | 693x1165, `facing: front` | `c53d22c1cea6` | The render's own pixels (seed 911104), same crop. Two repairs: the white matte fringe on the skirt and blade edges was peeled off (it glowed under bloom in the options frame), and the background pockets rembg had left between the right-hand skirt strips were opened (4,497 px). The hair, face and chest were never touched. The sidecar's `layers` block records where the ring goes. |
| `characters/seymour-natus-ring/idle.png` + `.json` | O-1 A (ring layer) | 1006x1006, `facing: front`, `layerOf: seymour-natus` | `bd6754303eb7` | The options `ring-stone.png` pixels, Lanczos-scaled x1.228 to the idle's composite scale (sidecar scale 1.0). The alpha stays soft on purpose because the layer is meant to turn. It sits **behind** the figure: diameter 974 px, centred at idle (346, 469). Turning it is presentation work (our idea, not sourced). |
| `characters/mortibody/idle.png` + `.json` | O-2 A | 945x984, `facing: left`, `nonBiped` | `20b012ade63e` | The render's own pixels (seed 912103), same crop. One white background pocket at the root of the horn was opened (40 px). `baselineY` is the blade tips because he hovers. |
| `backdrops/bevelle-highbridge.png` + `.json` | O-3 C | 2688x1536, one opaque plate | `3c8aebf46c53` | The picked plate, installed unchanged (MAD 0), as the Evrae deck backdrop was. Every approved chapter backdrop is the same single 2688x1536 plate. |
| `portraits/seymour-natus.png` + `.json` | O-5 A | 832x1216 | `0980d552d487` | The raw render's pixels (seed 914101) under the isnet-anime matte, with the white halo peeled off the matte edge (268 px). See the guard note below. |

Also committed: a `portraits.seymour-natus` row in `src/ui/common/face-crops.json` (fb4c08bd).
The pupils are at (361, 494) and (502, 495), which gives fx 0.5192, fy 0.4067, ipd 0.1695.
`ui-portrait-face-crop.test.ts` passes. No speaker id uses the portrait yet. B12 wires it for
the lines after the transformation (a `SpeakerId` in `src/story/dsl.ts` is a shared contract).

## What was not painted, and why

- **No hero cast for Natus.** The plan (`docs/plans/chapter-natus-review.md` §6.1) names no
  states for him, and the O-1 round showed only an idle. Chapter VII's decision D-045 gave each
  boss an idle plus one hero cast. Whether Natus gets one is **a question for Bailey**, not
  painted here.
- **No Mortibody hurt, KO or revive painting.** The picked strip (`mortibody/a-ko-revive.jpg`)
  is the engine's pyrefly dissolve, the Mortibsorption drain number on Natus, and the same idle
  coming back weaker ("no death state of its own"). Per the METHOD-CHECK state map, hurt is the
  idle under the engine's flinch.
- **No turning ring in paint.** The ring is its own layer, and turning it is presentation work.

## The portrait's cut-out guard

The options run quarantined the matte for **one** reason: crop coverage was 100% x 100% of the
canvas, because the spike crown is cut off by the top of the frame. The component check passed
(one component), and so did the near-white check. Measured at file size with the same guard,
every approved portrait fails that rule the same way: tidus, yuna, auron, seymour, anima,
nooj, cid and seymour-macalania all measure 100% x 100%. The matte itself was clean. The fix
was a halo peel plus this record. The close framing is handled by the face-crops row.

To give the portrait headroom, two masked outpaints were tried (8 seeds, 76 GPU seconds). Every
seed invented a gold crown or cone above the spikes, so the approach was dropped after two
failures (rule 15) and nothing from it was shipped. The Review flag still applies: portrait A
has a gold-tipped spike crown and facial marks that the O-1 A body does not have.

## Frames and sheet

- `production/sheet.jpg`: all five files at source pixels, the skirt before and after the
  repair at 1:1, and the engine frames.
- `production/battle-1600.jpg`, `clean-1600.jpg`: real 1600x900 engine frames. They use
  Chapter VII's staging (`seymour-anima-macalania` at its first command menu). Playwright
  request interception served the installed files in place of `macalania-temple`,
  `seymour-macalania` (Natus with his ring layer composited per the sidecar) and
  `guado-guardian` (Mortibody; Guardian B hidden). Natus is at 1.3x and Mortibody is lifted 1
  unit, as in the options frames. The HUD still shows Chapter VII leftovers (FLEE, "Physical
  damage", Guardian queue icons); those are for the HUD and scene tracks to fix, not the art.
- `production/dialogue-1600.jpg`: the dialogue card with the O-5 A portrait over the Highbridge
  plate. The line and the chapter label are Chapter VII's.
- `production/battle-390.jpg`: the game as it runs today at 390x844. There is no phone layout
  yet. Mortibody reads at this width.
- Private Vite on port 5766 (HMR off, GPU browser), stopped by PID. Keys were pressed for real
  (Enter, G, N, I). ComfyUI was never restarted, there were no black frames, nothing was
  downloaded, and the GPU total was 76 s. Scripts are in `D:/Tools/pyrefly-scratch/natus-prod/`.
