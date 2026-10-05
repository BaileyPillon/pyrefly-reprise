# r39-art: the GPU art lane of release 39 (fidelity masters, two pilots, the E library)

Date 2026-10-04, evening to night. Branch `r39-art` (from `origin/r39-int` d7ac0ccf, because the held-backdrop repair this lane clears exists only there), worktree `D:/pyrefly-r39-art`.
Nothing is merged into `main` and nothing is deployed. The lane was the only user of ComfyUI; it honoured the driver's `PAUSE-GPU` file (the camera-lab timing run) throughout.
Bailey, 2026-10-04, verbatim: "I need super high resolution now. DO NOT hold back. I want the visual fidelity to be amazing and absolutely beautiful. It needs to be breathtaking." and, later,
"The characters and enemy models in general don't look detailed and polished enough." and "As poses change for the characters their size changes too sometimes and that looks really bad".

Game case, per item: stated in each row (hard rule 14). The methods and tools are shared plumbing.

## Where each item stands

| item | state | case | evidence |
|---|---|---|---|
| P1a the six held backdrop masters | **done, installed**; `HELD_BACKDROPS` is empty (the mechanism stays; its test passes its own list) | Gagazet, Garden of Pain, Via Purifico FFX only; Road to the Farplane and its links variant FFX-2 only; `title` no screen | commit 5cebbd58; all six pass the backdrop QC (SSIM 0.987 to 0.990, mean dE 0.7 to 0.9, edge correlation 0.94 to 0.99), looked at 1:1 against the approved painting: `docs/screenshots/r39-art/backdrop-*`; recipe `tools/gen/hires-faithful/` |
| P1b Evrae's ten masters | **done, installed** (4x and 3x for five states, 2x for four; `idle@2x` stays the approved E1-H master) | FFX only (Chapter VIII) | commit ea732eb5; QC SSIM 0.947 to 0.957, mean dE 2.75 to 2.82, edge correlation 0.969 to 0.975, refine SSIM 0.982 to 0.984; rim bias -4.6 to -5.7 became +0.46; `docs/screenshots/r39-art/evrae-*` |
| P1c Kimahri's one-horn 2x master | **no re-make needed**: the master already draws one horn | FFX only | `docs/screenshots/r39-art/kimahri-head-4x-one-horn.jpg` |
| P1d Rikku Dark Knight and x2-Anima 2x masters | **done, installed and locked** (`approved-hashes.json`, set bailey:2026-10-01-art, +2) | FFX-2 only | commit 5cebbd58; they fail the library thresholds (SSIM 0.90 and 0.86) as the other approved D-315 masters do, so they are approved masters with documented numbers |
| Figure-detail pilot | **delivered**: `D:/Tools/pyrefly-art-backup/candidates/2026-10-04-detail/README.md` | Tidus, Seymour Flux FFX only; Yuna Gunner FFX-2 only | finding: stronger diffusion on the same painting (D1 0.45 and 0.55) is the same picture at battle size, a redraw (D2, Klein) is a different one; the edge treatment E alone is a clear polish win; scripts committed 9636532f |
| The E library | **finished, not installed anywhere**: `D:/Tools/pyrefly-art-backup/hires-E/` | both games (every figure with alpha) | below |
| Style pilot | **delivered**: `D:/Tools/pyrefly-art-backup/candidates/2026-10-04-style/README.md` | Tidus, Seymour Flux FFX only; Yuna Gunner FFX-2 only; concepts only | below |
| P2 (e to h): animation keys | **not started, by the driver's order** (Bailey may pick a new finish; the keys would be repainted) | n/a | "What exists for P2" below |
| P3: the overnight hi-res refine | **stopped** by the driver before the pilots; it stays stopped until Bailey picks a detail method | both | nothing of it ran after the stop |

## The E library (the edge treatment E over every figure master that has alpha)

`D:/Tools/pyrefly-art-backup/hires-E/`, same layout as the other libraries (`characters/<id>/<state>@4x.png`, `@2x.png`, `manifest.json`, `batch.log`), every output a new file (the other
libraries are hard-linked into running worktrees and were never rewritten). E is `tools/gen/hires-detail/edge_e.py`: a signed-distance contour smoothed at 0.8 px of the 1x painting
(capped at 0.6 px of movement), a 1 px ramp, the white fringe taken out, the colour bled 24 px under the transparent area. Run by `tools/gen/hires-detail/e_batch.py` (3 workers,
BelowNormal, 58 minutes wall).

- 651 figure assets planned: **636 treated, 15 skipped on purpose, 0 failed**. The 15 are assets whose only installed master is an approved one, which is never changed: evrae/idle-far,
  overdrive-sin idle and stage-0 to stage-4, pterya/idle, sin-core/idle, sin-left-fin and sin-right-fin idle-near and idle-far, vegnagun-tail/idle, yunalesca-2/idle. An asset with an approved
  `@2x` and a 4x master keeps the approved 2x and gets an E'd 4x only.
- 1,196 PNG files: 597 at 4x, 599 at 2x (39 wide-only assets got E at 2x; the others' 2x is the 4x reduced, colour and alpha apart). 5.14 GB in the manifest, 4.8 GB on disk.
- Per master the manifest keeps (`edge_E`): the 1x painting's sha256, the input master's sha256, the output's sha256, the alpha IoU against the approved alpha upscaled (median 0.9976,
  lowest 0.99386 for yunalesca-1/hurt) and the mean edge move (median 0.735 px at 4x, highest 0.835 px for bahamut/ko). The silhouette stays the approved one; the stair-stepping, the white
  fringe and the halo go.
- **Install** (dry run proven on this tree, nothing written): `node tools/hires-install.mjs --lib D:/Tools/pyrefly-art-backup/hires-E --replace-from D:/Tools/pyrefly-art-backup/hires-alpha-fixed --park <dir> --only characters/`
  says 1,779 to install (1,187 replace, 592 `@3x` derived, about 6.9 GB), 24 skipped (15 status skipped; 9 kept because `public/art` does not hold the old library's file there). Run the same line
  once more with `--replace-from D:/Tools/pyrefly-art-backup/hires-r39-art` for Evrae's re-made masters, then `node tools/gen/manifest.mjs`; add `--apply` to do it. The release 39 integration lane
  owns that step.

## The style pilot (`candidates/2026-10-04-style/`)

Three finishes of three approved paintings (S1 Premium cel on Animagine, S2 Painterly on FLUX.2 Klein, S3a semi-real on Z-Image Turbo, S3b semi-real on Klein), two seeds each, five faked 3840x2160
Gagazet battle frames, sheets with 100 percent face and torso crops, the licences read from the model cards, the GPU minutes (16.5 of the 45 allowed) and a distance-from-approved table. Short read: S1 is
the same picture as today at battle size; S2 is the visible painted upgrade that sits in the backdrop but redraws faces and drifts in small parts; S3a changes who the characters are; S3b looks like a render
pasted on a painting. Recommendation and the decisions it leaves are in its README; **nothing is built from it without Bailey's pick** (rule 9, rule 10).

## What exists for P2 (not installed; do not install these before Bailey picks the finish)

- Rikku Warrior twirl keys: candidates and contact sheets in `D:/Tools/pyrefly-art-backup/candidates/2026-10-04-r39/rikku-warrior/` (picks going-2 and forming-2, trousers kept).
- The other FFX-2 apex keys and Rikku's and Yuna's Overdrive keys: the install-ready packages `D:/Tools/pyrefly-art-backup/candidates/2026-10-03-overnight/install-ready/{3-apex-ffx2,2-apex-ffx}`;
  22 of them staged with their idles in `D:/Tools/pyrefly-scratch/2026-10-04/r39-art/stage-art/` (`tools/stage_keys.py`). **Bailey's size rule is not met yet**: a key's head must be measured against the idle's
  and written as the sidecar `scale` and `baselineY` before install. The posescale lane's tool (`tools/posescale/measure.py` in `D:/pyrefly-r39-posescale`, uncommitted when this was written) now works from
  hand-read ruler sheets: `PYREFLY_ART_DIR=<stage-art> python tools/posescale/measure.py tiles <subject> --poses idle,<key> --out <dir>` makes the sheets (tried on yuna-gunner), the reviewer writes the scale.
- D-333 (Yuna Gunner wind-up) and D-334 (hooded Yuna White Mage hurt and KO): partly rendered in `.../2026-10-04-r39/method-g/` (`STOP` is there, `queue.log`, `METHOD-CHECK-identity-words.md`). Proposals only: an
  approved pick is never replaced on an agent's say-so.
- Wiring scan (not acted on): songstress `dance` (three FFX-2 figures), kimahri `jump`, yuna `summon` and rikku `steal` have a painting and no slot; every telegraph is wired; Omnis and the other telegraphs
  stay unwired (D-355, rule 10). One small code change is ready to write when the keys install: in `src/engine/KeySlots.ts` `odFamilyOf`, an FFX-2-only alias
  `/^x2-black-mage-(fire|fira|firaga|blizzard|blizzara|blizzaga|thunder|thundara|thundaga|water|watera|waterga)$/` to `['x2-black-mage-cast']`, with a unit test.

## Scripts (all under `tools/gen/`)

`hires-faithful/` (the faithful backdrop recipe, the job runner, the library-record writer, the PAUSE-GPU watcher), `hires-alpha-fix/batch.py` (reads the art tree from `R39_ART`, takes exact ids),
`hires-detail/` (`pilot_*.py` the detail pilot; `edge_e.py` the edge treatment; `e_batch.py` the E library; `style_gpu.py`, `style_cpu.py`, `style_finish.py`, `style_readme.py` the style pilot). They need the
closeup-art helpers (`hires_lib.py`, `cc.py`, `klein.py`, `qc.py` under `D:/Tools/pyrefly-scratch/2026-10-04/closeup-art/tools`), the Windows embedded ComfyUI Python and the reference images in
`F:/pyrefly-parked/2026-10-04/r39-art/pilot-work/`. A GPU stage waits while `PAUSE-GPU` exists and keeps one prompt in flight; an all-black frame means restart ComfyUI (`schtasks /end /tn PyreflyComfyUI`,
then `/run`), never re-roll.

## Where the bytes are

| folder | size | what |
|---|---|---|
| `D:/Tools/pyrefly-art-backup/hires-E/` | 4.8 GB | the E library (above) |
| `D:/Tools/pyrefly-art-backup/hires-r39-art/` | 130 MB | the six faithful backdrops and Evrae's masters, with `manifest.json` and reports |
| `D:/Tools/pyrefly-art-backup/approved/2026-10-04-r39-art/` | 32 MB | the install package of the two D-315 masters and the replaced originals |
| `D:/Tools/pyrefly-art-backup/candidates/2026-10-04-{detail,style,r39}/` | 514 MB, 196 MB, 35 MB | pilots and P2 candidates, each with a README |
| `F:/pyrefly-parked/2026-10-04/r39-art/` | 1.9 GB | work files of both pilots (the library's refine tiles, Klein references, style outputs) |
| `D:/Tools/pyrefly-scratch/2026-10-04/r39-art/` | 335 MB | scripts, logs, experiments, the P2 stage dir; disposable once the keys are decided |

D: is at 99 percent (36 GB free) and F: at 98 percent; the E library is the lane's one large addition. Nothing of the lane's is running at the end of the session.

## Gates run at the end (tree `D:/pyrefly-r39-art`)

`tsc --noEmit` clean; `tests/unit/r39-hires-install.test.ts` and `tests/unit/target-approved-hashes-judge-locked.test.ts` 18 of 18; `node tools/orphans.mjs` ran (no TypeScript module was added by this lane).
**Not re-run tonight:** `art-derive verify` and `audit` and `art-browser-load` on a production build (a 9 GB build; no game code and no installed master changed after commit ea732eb5, the later commits are Python tools and docs, and the release build of the integration lane
covers them) and the full `npm test`. They are owed by whoever cuts the release with these masters.

## The painterly lock round (2026-10-05, after Bailey picked S2 painterly)

`D:/Tools/pyrefly-art-backup/candidates/2026-10-05-painterly-lock/README.md` (candidates only, nothing installed, no approved painting touched; Tidus and Seymour Flux FFX only, Yuna Gunner FFX-2 only; the method is shared
plumbing). Klein 9B with close-ups of the approved head and costume as extra references and an **init lock** (the painting's own latent noised to sigma 0.99, then the model's four-step schedule) holds the silhouette
(IoU 0.98 to 0.99, Yuna Gunner 0.95), the costume parts and the seeds' agreement; a palette lock (C) and a painterly face pass (D) take the colour drift and the face drift out. **C and D are the best two; no single
method holds both the S2 finish and the lock**: they keep about a third to a half of last round's finish by the CLIP measure and look visibly painted by eye. Recommendation: D as the default, C per figure where the face
pass makes a face younger. Costs for a roll-out (636 masters about 13 GPU hours for one seed, plus about 27 animation keys about 35 GPU minutes) are in its README; the roll-out, the P2 keys and the refine were NOT started.
Scripts: `tools/gen/hires-detail/lock_*.py`, `clipsim.py`, `comfy_wait.py`. Incidents: a Klein KV cache with four references overflowed the card and stalled 45 minutes (the same graph without the cache runs in 39 s), a second
15.7 minutes, and a sampler fault 8.5 minutes; 31.7 minutes of runs completed; the lock pass must run without the KV cache and in a window where `PAUSE-GPU` is honoured.

## Decisions for Bailey

1. The finish: S1, S2, S3b, a mix, or none (the style pilot README has the pictures and the recommendation). Name what is right and wrong in each; the pick approves only what he names.
2. Whether faces and small parts of approved paintings may change (S2 and S3 change them, S1 does not).
3. FLUX.2 Klein 9B is under the FLUX Non-Commercial License v2.1 (weights non-commercial; outputs usable, per its outputs clause, except for training competing models): fine for a free fan tribute, read the text before any commercial plan.
4. When the overnight refine may resume, and whether the animation keys are painted in the chosen finish before they install.
