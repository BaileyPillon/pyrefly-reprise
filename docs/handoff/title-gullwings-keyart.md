# Title key art: the Gullwings "Farplane Field", built on a branch

**Game case: both.** The title screen is the front door to the FFX chapters (1 to 3) and the FFX-2 chapters (4 and 5) and every
chapter added since; nothing about it is true of one game and not the other, and its strap names both. The picture shows the FFX-2
party (Yuna, Rikku, Paine), but Bailey chose it for the title of the whole game (AGENTS.md rule 14).

Branch `title-gullwings-keyart` (worktree `D:/pyrefly-title-gullwings`, kept for the driver; its junctions are unlinked, see the end).
Not merged, not deployed, nothing in `D:/Final Fantasy/public/art` touched. The art swap happens at integration (section 5).

## 1. What Bailey approved

- 2026-10-05, 19:24 EDT, in the Art Room: Art Room proposal `p_f4836b8c` ("V3c Farplane Field - the Gullwings (FFX-2)", chain `c_e9ded2f3`,
  version 2, made by Codex with ChatGPT Images 2.5). File `D:/Tools/art-room/data/approved/p_f4836b8c-v3c-farplane-field-the-gullwings-ffx-2-v2.png`,
  1672x941, sha256 `40b99f34cbf0c78235d1175cbbffcad43e63d0410b0235c024fc40b3bec44be5`; the exact prompt is in `D:/Tools/art-room/data/approved.jsonl` and in `keyart.json`.
- 19:25 EDT, verbatim: "use what i just approved for the new title screen please, it's soooo epic i love it."
- It shows Yuna, Rikku and Paine from behind in the lower left, a lavender flower field with golden pyreflies, a golden crystal spire on the water at right.

What Bailey approved is the picture. Everything in section 4 is a consequence of putting it on the existing screen that he has not seen: the
main session decides what to show him (target and build side by side: `docs/screenshots/title-gullwings-target-vs-build.png`).

## 2. The art (staged, not installed)

Staged at `D:/Tools/pyrefly-art-staging/title-gullwings/`, copied for the record to `D:/Tools/pyrefly-art-backup/approved/2026-10-05-title-gullwings/` (with the
lossless master, the crop, the approved original and the scripts; `SHA256SUMS.txt`). The three files that go into `public/art/title/`:

| file | what | bytes | sha256 |
|---|---|---|---|
| `keyart.png` | the 1344x768 plate (a Lanczos downscale of the 2x master) | 1,396,775 | `94f37ae06ab7ad3e7db38b7aace91e72c7de2949485a172d45c59479ffe48c05` |
| `keyart.2x.webp` | the 2688x1536 master, lossy WebP (quality 95, effort 6, smart subsampling; the old one was lossy too, about quality 86) | 750,528 | `58a13dd78f73bed879494346a3e79b17237692245ed86f84d0074e11d5ef27bd` |
| `keyart.json` | the provenance sidecar (exact prompt, approval, upscaler, canvas, focal, planes) | 7,835 | `6c779890ef287367519900de24a3b3e9ef911410735f4355e9a520f70cf212e1` |

How it was made, and nothing else (the picture is never re-generated or repainted):

1. The approved PNG is checked against the sha256 the Art Room recorded, then cropped to 1647x941 (1.75:1, the plate ratio) by taking **25 px off the right edge only**. The three heroes are in the left third; none is touched.
2. **RealESRGAN_x4plus.pth through ComfyUI** (the project's helper `tools/gen/hires-faithful/r39lib.py`: the shared GPU lock, the PAUSE-GPU gate, one prompt in flight): x4 to 6588x3764, Lanczos down to 2688x1536 (ComfyUI `ImageScale`), the same graph the backdrop preset uses. One job, 6.9 GPU seconds, 26 s wall; the painterly roll-out's queue was not touched. A side-by-side with a plain Lanczos resize (faces, water, flowers, sky) showed the upscaler cleaning the source's block noise and sharpening edges, with no stripes or invented lines, so it is used.
3. **Colour drift removed.** The upscaler pulled the picture about +1.7 levels toward green (R -0.4, G +1.7, B -0.4 on average, up to +3 in places). That low-frequency drift is subtracted (Gaussian sigma 12 px against a plain Lanczos resize of the crop, `tone_match.py`); everything finer is the upscaler's own output.
4. The 1x plate is the Lanczos downscale of the 2x master; the 2x is encoded with sharp.

**Pixel check** (staged 1x plate against the approved crop, both at 1344x768, `pixel-check.json`): mean absolute difference **1.96 of 255 (0.77 %)**, PSNR 38.1 dB, mean RGB identical to 0.01 (162.31, 126.44, 161.63 against 162.32, 126.44, 161.63). Before the colour correction it was 2.62 (1.03 %) with G +1.7. What still differs is the upscaler's cleaning and sharper edges. The lossy WebP of the master differs from its PNG by 1.17 on average (PSNR 43.3 dB).

Shipped by a production build (`BASE_PATH=/`): `art/title/keyart.webp` (the lossless WebP the build derives from `keyart.png`, 1,128,012 bytes), `keyart.2x.webp` (750,528), `keyart.json` (7,835).
The browser picks the 2x master once the covered width passes about 1,210 px (`titlePlateSizes`), so most desktops load 0.75 MB.

The old files are backed up (a copy, verified identical to main's) at `D:/Tools/pyrefly-art-backup/title-2026-10-05-before-gullwings/` (`SHA256SUMS.txt`): `keyart.png` `835d56b4...`, `keyart.2x.webp` `1ab89b73...`, `keyart.json` `4b185786...`.

## 3. What changed on the branch

| file | change |
|---|---|
| `src/app/screens/frontend/frontend.css` | the planes, the near-plane mask, the slab, the scrim, the strap (section 4 has the why; every number is measured in section 6) |
| `src/app/screens/frontend/title-reveal.css` | the 32 px placeholder takes the far plane's grade from one variable and the same crop anchor |
| `src/app/screens/frontend/titleMarkup.ts` | `TITLE_CAST_ON = false` (the two silhouettes are not drawn); `castHtml(on)` keeps the old markup; header and comments |
| `src/app/screens/frontend/titleReveal.ts` | the new 32x18 placeholder (475 characters, mean luma 0.54; the old plate's was 0.46) and its comment |
| `src/app/screens/TitleScreen.ts` | the near plane's scale 1.11 to 1.06; comments |
| `src/engine/ArtManifest.ts` | the comment on `title` (the file stays at 398 lines) |
| `docs/target/approved-hashes.json` | the `title:keyart` set takes the new sha256 (the old ones under `supersedes`, the way `chapter:leblanc-idles` does it): `verify-approved` would fail on the swap without it |
| `tests/unit/title-near-mask.test.ts` (new) | pins the mask against the heroes' lowest pixels, the registration with the painting, and the crop anchors |
| `tests/unit/frontend-title-motion.test.ts`, `title-reveal.test.ts` | the cast is off (and still builds when switched on); the placeholder is a 32 x 18 WebP |
| `docs/screenshots/title-gullwings-*.png` | 13 pictures (section 7) |

No new module (`node tools/orphans.mjs` has nothing to report for this change), no shared contract changed (`docs/CONTRACTS.md`), no save data.

## 4. Decisions this build takes, for the main session to show Bailey

Dropping the file in as it was (`docs/screenshots/title-gullwings-before-naive-swap-1920x1080.png`) has four defects: the paper slab sits in front of Yuna and
Rikku and hides both; the concept's two black silhouettes (Tidus, Yuna) stand in the flower field as two extra people; the grade makes the pastel picture dull;
the near plane (a 61 to 100 % ramp over the lower frame) draws the heroes' legs twice. The smallest changes that remove each are below, each with its undo.

1. **The two silhouettes on the shore are no longer drawn** (Tidus, Yuna as ink cut-outs from the concept's `after.png`). The picture already has three people. Undo: `TITLE_CAST_ON = true` in `titleMarkup.ts` (the CSS, the parallax layer and the tests for it stay).
2. **The slab moved up and got 20 % shorter.** Same slab, same skew, same words; its top went from 214 to 22 grid units, the wordmark from 76 to 62 units, tighter padding and gaps (343 to 274 units tall). It ends at 0.37 of the frame over the pink clouds, and the three heads (at 0.44) stay clear. It is **not** scaled by a transform: that would draw the 14 px type floor below 14 effective px (PR-0066, CHK-003; `frontend-css-type-floor.test.ts` pins every size). The drop shadow is shorter (6 down, 24 blur, 0.40 instead of 26, 70, 0.72) because the old one reached the heroes' faces. The art's own prompt asked for a calm upper-centre sky for the wordmark; two other places are mocked up from CSS overrides, not built: **top centre** (`title-gullwings-option-top-centre-mockup-1920x1080.png`) and **lower right** over the field (`...-option-lower-right-mockup-1920x1080.png`). A different placement is a change of `left` and `top` in `.fe-title__slab`.
3. **The grade is light.** The concept's grade (brightness 0.78 under a 0.66 black cap, a 0.72 foot, a 0.62 vignette) was cut for the dusk plate; over this picture it measures 0.64 of the approved picture's mean luminance (sky band 0.47, foot band 0.26). Now: no filter on the picture, and a scrim of three named strengths on `.fe-title` (`--fe-scrim-top` 0.12, `--fe-scrim-foot` 0.16, `--fe-scrim-edge` 0.14): 0.98 of the approved luminance (sky 0.96, centre 1.00, foot 0.90). Nothing the chrome needs comes from the grade (the slab, chip and hint row have their own backgrounds). The pure picture is `.fe-title__grade { display: none; }`; a moodier one is a bigger number. Before and after: `title-gullwings-grade-before-after.png`.
4. **The strap ("Final Fantasy X and X-2", the vertical gold text at the right) has a dark halo and full gold.** It was 78 % gold with nothing behind it, which the old dark edge carried; on the pink clouds and lilac flowers it measures 1.3:1 (WCAG contrast, median over the letters, 1920x1080); with the halo 5.9:1. An edge scrim would have dimmed the picture instead. Before and after: `title-gullwings-strap-before-after.png`.
5. **The crop follows the heroes in a window that is not 16:9.** `--fe-art-x/-y` (30 %, 45 %) are `keyart.json`'s `focal`, used the way the pause plates use theirs: the three heroes stay on screen down to 4:3 and the spire down to about 1:1 (the old 50 % cut Yuna off at 5:4). A phone anchors at 14 %: all three heads in frame (390x844), the spire and Paine's sword out. The phone slab went from 120 to 36 units from the top so it clears the heads. The `focal` in the sidecar is (0.30, 0.45), the heads where the gaze toward the spire starts; the midpoint of the gaze line (0.42, 0.40) would have cut Yuna off at 5:4 (justified in `keyart.json`).
6. **The near plane is the foreground flower band only, and its mask is registered with the painting.** The mask is an SVG picture (1344x768, `mask-size: cover` at the same anchor as the image's `object-position`), nothing above v 0.85 of the painting, full from 0.94; a gradient on the box would slide down the heroes in every window that is not 16:9 (at 2560x1080 onto their faces). The near plane's scale is 1.06 (was 1.11): at 1.11 its band sat 25 px off the far plane's at rest, a visible double image where it fades in. The warm bloom blob (`.fe-title__bloom`, positioned for the old tower) is off, because the painting has its own glow at the spire's base; the element stays in the markup.
7. **`docs/target/approved-hashes.json`** carries the new hashes (see section 3). Bailey's yes is the approval; the file records it with his words.

## 5. The swap procedure at integration (the driver)

The art goes in at integration, not before. In **every tree the release is built from** (`D:/Final Fantasy` and, for 39.1, `D:/pyrefly-r39-int`):

1. Check what is there: `Get-FileHash` (SHA256) of `public\art\title\keyart.png`, `keyart.2x.webp`, `keyart.json` should read `835d56b4...`, `1ab89b73...`, `4b185786...` (the backed-up old ones).
2. Install the three staged files. In the main tree `keyart.png` and `keyart.json` are hard-linked to a 10-04 scratch rig (`D:\Tools\pyrefly-scratch\2026-10-04\keyart\public-no2x`); an overwrite in place would rewrite the rig's copy too, so remove the three old files first (they are backed up) and copy the new ones:
   `Copy-Item "D:\Tools\pyrefly-art-staging\title-gullwings\keyart.png","D:\Tools\pyrefly-art-staging\title-gullwings\keyart.2x.webp","D:\Tools\pyrefly-art-staging\title-gullwings\keyart.json" "<tree>\public\art\title\"`
3. The hashes in section 2 must match: `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs` with `ROOT=<tree>` (the title entries read MATCH; the main tree's art is behind the release's, so its other counts are not this change's: on 2026-10-05 it read 743 ok, 17 mismatched, 47 missing before and after).
4. Merge `origin/title-gullwings-keyart` (its `docs/target/approved-hashes.json` change goes with it). `node tools/gen/manifest.mjs` changes nothing (`title` and `title2x` still list `keyart`).
5. The release gates for this change, as `node tools/critic-plan.mjs --paths <the files above>` reads them: checks CHK-002, 003, 009, 012 to 017, 019 to 021, 026 and 027, targets cast, pause, phone, presentation and scenes plus the approved-art hash check; the review class is the build's (deep debt), not this change's. CHK-003 is the one this change can break (type sizes on the slab): all sizes keep the 14 px floor.

## 6. Measurements

**Verification** (in the worktree, main's `node_modules` by path, never `npx`):

- `tsc --noEmit`: clean.
- vitest, 26 files, **441 passed, 5 skipped**: the art tests (`art-*`, `artifact-manifest`, `vite-art-at`, `painted-art-retry`, `r39-art-tiers`), `deploy-host`, the frontend ones (`frontend-title-motion`, `title-reveal`, `title-near-mask`, `frontend-css-type-floor`, `frontend-chapter-grid`, `frontend-chapter-select-screen`, `inkgold-screens`, `moved-notice`, `player-facing-title`); plus the four tests that read `approved-hashes.json` (22 passed).
- Production build in the worktree's own `dist` (not the shared one), `BASE_PATH=/`, 24 s: `art-derive verify` **PASS** (1,005 masters, 0 problems), `art-derive audit` **PASS** (0 dangling), `art-browser-load` **PASS** (1,049 images loaded in Chromium 153 and WebKit 26.6, 0 failed). The production frame is pixel-identical to the dev server's at 1920x1080 (mean difference 0.0).
- Real input on the production build: Enter, a click on the chip, and a click over the painting each take the title to chapter select, with no console errors.
- WebKit renders the same layout and the mask applies there (no doubled heroes at a parallax extreme).

**The slab against the heroes** (rest; gap from the slab's bottom to the top of Yuna's hair; the production build):

| window | slab bottom | heads top | gap | heroes / spire in frame |
|---|---|---|---|---|
| 1920x1080 | 395 | 468 | 72 px (6.7 %) | all in |
| 1600x900 | 329 | 390 | 60 px | all in |
| 1366x768 | 301 | 332 | 32 px | all in |
| 1280x720 | 286 | 312 | 26 px | all in |
| 1920x900 | 329 | 387 | 58 px | all in |
| 2560x1080 | 395 | 462 | 67 px | all in |
| 3440x1440 | 527 | 616 | 89 px | all in |
| 1600x1200 | 329 | 520 | 190 px | all in |
| 390x844 | 301 | 366 | 64 px | three heads in; spire and Paine's sword out |
| 360x640 | 272 | 277 | 5 px | Yuna and Rikku in; Paine cut, spire out |

The clearance shrinks as a window gets wider than 3:1 (the heroes rise in the frame as the crop cuts more off the top); at about 3.2:1 (3240x1080, 32:9) the slab would meet Yuna's hair. Not built for.

**Near plane against the heroes:** the lowest pixel of any hero is Paine's boot at v 0.81 and his sword tip at v 0.82 (u 0.40) of the painting; the mask is 0 until v 0.85. The near plane slides against the far one by at most 9.1 px (14 px of travel x the 0.65 depth gap), 1.5 % of a 600 px window; `title-near-mask.test.ts` checks the mask's alpha is 0.005 or less at every hero's lowest pixel plus that slide. Both parallax extremes at 1920x1080 are in `title-gullwings-parallax-extreme-a/-b-1920x1080.png` (and clips of the foot band at 2x showed no seam).

**Legibility** (WCAG contrast, median over the glyph pixels at 1920x1080): the wordmark and the chip sit on the opaque paper slab and ink chip (ink on paper 17.4:1; unaffected by the art); the hint row's ink chip 5.6:1; the strap 1.3:1 before, 5.9:1 after. The eyebrow ("An unofficial fan tribute", gold on paper, 2.9:1) is the Ink & Gold token's own and was not touched.

## 7. Pictures (`docs/screenshots/`)

`title-gullwings-1920x1080.png`, `-1280x720.png`, `-2560x1080.png`, `-1440p-hidpi-1280x720@2x.png` (2560x1440 px), `-phone-390x844@2x.png`,
`-parallax-extreme-a-1920x1080.png` (pointer up-left) and `-b-` (down-right), `-target-vs-build.png` (the approved picture beside the build),
`-before-naive-swap-1920x1080.png`, `-grade-before-after.png`, `-strap-before-after.png`, and the two layout mock-ups of section 4.

## 8. Not done, and limits

- Bailey has not seen the screen. Nothing here is live or merged; the layout choices in section 4 are mine.
- The wordmark is still the type on a paper slab; a painted logo is the follow-up recorded in `titleMarkup.ts` (`docs/handoff/r38-rename.md`).
- At 1280x720 the eyebrow wraps to two lines (the 14 px floor makes it wider than the slab's text column; the old slab's column was about as wide, so the arithmetic is the same, but the old frame was not re-shot to prove it).
- 360x640 clears Yuna's hair by 5 px only; windows wider than 3:1 meet the heroes (section 6).
- Only Chromium and WebKit were driven. The art tools cover decoding, not Firefox's CSS.
- The painterly roll-out and the camera work are untouched; the title does not use the figure masters.

## 9. Cleanup state

Dev and preview servers were started on port 5191 and stopped by port (0 listeners left). The worktree's junctions (`node_modules`, `public/art/backdrops`, `characters`,
`pause`, `portrait-parts`, `portraits`) are unlinked with `cmd /c rmdir` (no `/s`) and checked; its `public/art/title` keeps the new files, its `dist` is deleted. Never run
`git worktree remove` on it while a junction exists (the 2026-09-26 incident).
