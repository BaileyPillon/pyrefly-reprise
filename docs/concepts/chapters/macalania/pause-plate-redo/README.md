# Chapter VII pause plate: redo options (FFX only)

**Options only. Nothing is installed.** `public/art/pause/macalania.*` is still the plate that
scored 6. The sheet for Bailey is `../unlock/pause-plate-redo.jpg` (`.html`).

**Game case (rule 14): FFX only.** This is human-form Seymour in Macalania Temple, Chapter VII
(`seymour-anima-macalania`). No FFX-2 file and no shared code is touched.

**Why a redo.** Bailey, 2026-09-25: "I'll go with all your recommendations". The
recommendation on `../unlock/art-approval.jpg` was to approve the other six paintings (they are
now locked as `chapter:macalania:2026-09-25` in `docs/target/approved-hashes.json`) and to redo
the pause plate. The production judge gave it 6 (`../production/judge.md`): the background is a
lantern-lit rooftop village, not the antechamber (research §9.1), and the facial veins read as
a red cheek scar.

## The options

| | What it is | How it was made | Off |
|---|---|---|---|
| **A** (recommended) | Same face, the right room | The installed plate's own pixels are kept inside an isnet-anime matte, corrected by hand where the matte took rooftops or spires (`scripts/prep_a.py`). The background is prefilled with a blurred crop of the installed backdrop, then repainted with a masked KSampler pass (`SetLatentNoiseMask`, denoise 0.62, seed 560102, `scripts/inpaint_mask.mjs`). The figure is composited back (`scripts/finish_a.py`). The veins stay, because research §9.2 sources "pronounced facial veins". They are faded from red to a faint cool line by a pixel operation (a median-based repaint of red line pixels in the cheek box). The mouth and nose lines are excluded, and they measure 0 difference from the installed plate. | Crown shades pale to royal blue, as before. A few soft, repainted strands at the far left. |
| **B** | A new painting | The hero recipe of the approved plates (`tools/gen/comfy.mjs hero`: Animagine XL 4.0, 1344x768, 30 steps, cfg 6, euler_ancestral/normal), IP-Adapter at 0.4 ease in, 0.2 to 0.6, on the approved Chapter VII speaker portrait placed on the backdrop (`refs/ref-portrait-head.png`; on a flat colour the monochrome guard skipped it). Seed 560203 (`scripts/run_b.sh`). | Younger and softer than his idle and portrait. Hair across the other eye, a purple streak in the hair, ice only (no gold or brazier), no veins. |
| **C** | His dialogue face | The approved speaker portrait (`portraits/seymour-macalania.png`) at 1.1x on the blurred backdrop (`baseC`). The hair its frame cut off is repainted with two masked passes (0.85, seed 560302; 0.9, seed 560312). Then one hero img2img at 0.4 unifies the plate, with the same reference (seed 560322). | A cold stare, not the courteous smile of §9.2. On the tab, the eye is dim and hair fills the frame. Flatter and less vivid than the other plates. |

Rejected on sight (pilot and seeds): the B pilot 560201 (the reference was skipped as
monochrome: a buttoned red coat, a brooch, pink eyes), 560202 (gold pauldrons, medium shot),
560204 and 560205 (medium shots). For A: 560101 and 560103 (the first mask kept a purple shard
and the right spire), 560104 and 560105 (clean, but a weaker temple read than 560102). For C: 560301 (a gold lamp across the hair).

## Looked at 1:1

Every option and the installed plate, as a 220 px face crop with no scaling (`../unlock/img/redo-*-face.png`),
and each plate whole. The face-crop pass for A caught a real defect: the first vein pass also
greyed his smile line. It was fixed by excluding the mouth and nose, and the check was measured
again (0 difference in the mouth box).

No independent judge has scored these options yet. A judge in the same agent run is not
allowed, so that pass is owed before anything is installed.

## In the game

`capture.mjs` runs its own Vite server on a free port in 5640..5659 with `--strictPort`. The
scratch config turns HMR and the watcher off (`scripts/vite.scratch.config.mjs`). It uses
`PYREFLY_BROWSER=gpu` (ANGLE on D3D11) at 1600x900, seed 1.

- Chapter VII is still locked on the chapter select, so the capture calls
  `gotoChapter('seymour-anima-macalania', { skipCutscenes: true })`.
- A real **P** opens the pause, and three real **E** presses reach the CHAPTER tab.
- The plate's three URLs are answered with the option's files by Playwright request
  interception, in that page only.
- The option's 2x master is a lanczos upscale. The installed plates use RealESRGAN.
- The sidecar focal is measured on each option: A 0.45/0.43, B 0.46/0.56, C 0.35/0.51.

The captures had 0 page errors and 0 HTTP errors, and the CHAPTER tab was selected in every
run. The server was stopped by its PID. The first attempt hung because a first load that makes
Vite re-optimise its dependencies never gets its reload while HMR is off. `capture.mjs` now
reloads in that case.

The pause tab crops tightly to the face, so the background shows mostly at the plate's edges
and on the chapter card. The chapter card was not captured.

## Option A2, 2026-09-25 (added after the judge; not judged yet)

A2 answers the judge's two notes on A (see "Independent check" below) by **pixel edits only**. No
render, no GPU and no model: `scripts/a2.py`, numpy on A's own pixels.

- **Hair:** A's crown is saturated royal blue, but the approved idle, the speaker portrait and the
  Chapter I plate are pale silver-lilac. A2 pulls the hair's saturation from 0.69 to about 0.45,
  near the idle's measured 0.41 (hair pixels, hue 185-260, value > 0.55, median).
- **Veins:** A's faded veins still read as a crack at game size. A2 tints them to the skin around
  them. The mouth, nose, eyes, collar and background are A's pixels.

Files: `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-picks/ch7-pause-plate/a2.png` (with a
lanczos `a2.2x.webp` preview and `a2.json`, an unedited copy of the installed sidecar; both
preview only, like A's), the sheet row `../unlock/img/redo-a2.jpg`, the 1:1 face
`../unlock/img/redo-a2-face.png`, and the real pause capture `../unlock/img/redo-pause-a2.jpg`
(`../unlock/rehearsal/rehearse.mjs`, mode `pause`: own Vite on 5700, GPU, the plate's three URLs
answered in the page only; 0 console errors, 0 HTTP errors). The sheet recommends A2 **only if an
independent judge passes it**, and A otherwise. That judge pass is owed; the maker of A2 cannot be
its judge.

## Owed on a pick

- An independent 1:1 judge.
- The 2x master by the RealESRGAN x4 -> lanczos 0.5 route.
- The sidecar (focal as above) and the install to `public/art/pause/macalania.*`. Back up the
  replaced plate first.
- A `PLATE_FRAMING` row, if the integrator wants one (`src/app/screens/pause/plates.ts`).
- The lock in `approved-hashes.json`.

## Files

- In git: `README.md`, `capture.mjs`, `scripts/`, `sidecars/` (the provenance of the renders
  that were used), `refs/ref-portrait-head.png`, and `../unlock/pause-plate-redo.{html,jpg}`
  with `../unlock/img/redo-*`.
- The full-resolution options (`a|b|c.png`, `.2x.png`, `.json`), every render, mask and
  prefill: `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-picks/ch7-pause-plate/`.
- **Not install-ready.** In that folder, `a|b|c.2x.png` are lanczos previews, and
  `a|b|c.json` are unedited copies of the installed plate's sidecar (tag `hero.550003`, the old
  focal). Both exist only so `capture.mjs` can answer the plate's three URLs. The install still
  owes the RealESRGAN 2x master and a new sidecar with the measured focal (see "Owed on a
  pick"). The folder carries `PREVIEW-ONLY-DO-NOT-INSTALL.txt` saying the same.
- Scratch: `D:/Tools/pyrefly-scratch/picks0925/ch7-art/`.
- GPU use: about 20 renders of 8 to 40 s each, one at a time. No render came back black.

## Independent check, 2026-09-25 (a separate agent that made none of this)

Scope: the brief's (a) locks and (b) redo options. Bar 7; the worst criterion decides.

**(a) Locks: confirmed.** Set `chapter:macalania:2026-09-25` holds exactly the six files named
in the brief (Seymour idle, cast, hurt; Guardian idle, cast; `backdrops/macalania-temple.png`),
with Bailey's words. `pause/macalania.png` is not in it (installed sha `68fa5225...`,
untouched). Every installed file's sha256 equals its lock and its backup under
`D:/Tools/pyrefly-art-backup/approved/2026-09-25-chapter-macalania/`. The five character
hashes match the 12-character hashes in `../unlock/README.md`. The sheet image itself shows no
hashes, and the backdrop has none listed, but its mtime (09-22) is earlier than the sheet
(09-24). `verify-approved`: 185 ok, 0 mismatched, 0 missing. The count is higher than the 159
claimed because other sets were added since. The three vitest files that read the locks
pass, 36/36.

**(b) Options, judged at 1:1 from `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-picks/ch7-pause-plate/`:**

| Option | Score | Worst | Notes |
|---|---|---|---|
| A | **7** | Hair crown shades to saturated royal blue, off his pale-blue approved idle and portrait. This is inherited from the installed plate and disclosed. | The pixel diff confirms that the face, hair and robe equal the installed plate. Only the background (the edges, 37% of pixels) and the vein patch changed. The background reads as the antechamber (arches, gold metalwork, a candle), with no seams at the hair edge. The veins are now faint beige lines; at 1:1 they still form a small crackle, but it no longer reads as a red scar. The smile and the eye hold. |
| B | 6 | Identity: a generic long-haired youth, with no veins, no crest, a purple streak and hair over the second eye. | This is the cleanest rendering of the three, but it is the furthest from the anchors. |
| C | 6 | Composition and expression: the face is pushed into the left third in profile, hair fills the frame, and the cold stare goes against the courteous smile that §9.2 asks for. | It is on-model (the approved portrait), but flatter than the other plates. |

The recommendation **A** stands: it is the only option at the bar. If Bailey picks A, an
optional polish is to pull the crown's royal blue toward the idle's pale blue. It is not
needed to ship. The capture log shows 0 errors and the CHAPTER tab on all four shots, and no
listener remains on ports 5640-5659. Nothing under `public/art` changed.
