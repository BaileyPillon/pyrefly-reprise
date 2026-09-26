# Chapter VII pause plate, option A2: independent judge (FFX only)

**Game case (rule 14): FFX only.** Human-form Seymour's pause plate in Macalania Temple, Chapter VII
(`seymour-anima-macalania`). No FFX-2 file and no shared code is involved.

Judge: a separate agent run, 2026-09-25 ~18:45 EDT. I made none of A, A2 or the sheet, and I did not
judge A. The rubric is the one in `docs/concepts/chapters/gippal/production/JUDGE.md`: 0 to 10 on each
criterion, the overall is their mean, the bar is 7, and the worst criterion is named first.
Bailey, 2026-09-25 ~18:30 EDT, verbatim: *"All your recommendations"*. The recommendation was
"A2 if an independent judge passes it, otherwise A" (`../unlock/pause-plate-redo.jpg`).

## Method

- The file judged is `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-picks/ch7-pause-plate/a2.png`
  (sha256 `446b5b7e50c1...`), 1344x768. I viewed it whole next to A, with 1:1 crops of the face, the
  crown, the left strands and the right shoulder, 3x crops of the mouth, and a per-pixel diff
  against A (gain 4).
- Anchors: the locked Chapter VII battle idle (`characters/seymour-macalania/idle.png`), the approved
  speaker portrait (`portraits/seymour-macalania.png`, D-065) and the approved Chapter I plate
  (`pause/seymour.png`), shown side by side with A2 at the same height.
- Game read: the A2 CHAPTER-tab capture on the sheet (`../unlock/img/redo-pause-a2.jpg`). After the
  install I also took a real capture of the installed files with no request interception, see below.
- Measured: the step at the rectangle `a2.py` restores around the mouth (`res[392:455, 585:690] =
  a[...]`), in the 1x file and in the RealESRGAN master.

## Scores (0 to 10; bar 7)

| Painting | Identity to pick | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall |
|---|---|---|---|---|---|---|---|---|---|
| `pause/macalania` option A2 | 8 | 7.5 | n/a | 7 | 6.5 | 7.5 | 7 | 8.5 | **7.4 PASS** |

(Mean of the seven scored criteria; no hand is in frame.)

## Findings, worst first

- **Worst: seams, 6.5.** The hair pass in `a2.py` also moves the lavender skin slightly: skin with
  saturation just over 0.2 gets a small weight, so the whole cheek shifts by 2 to 5 levels. The script
  then copies A's pixels back into the mouth rectangle (x 585 to 690, y 392 to 455). That leaves a flat
  4-level step on its top and right edges (mean 2.5, max 5 per channel). At 3x it reads as a faint
  darker box around the smile; at 1:1 you can just find it if you know where to look. In the
  RealESRGAN master the step is 1 to 2 levels and I could not see it. On the CHAPTER tab, under the
  scrim, it does not show. Not disclosed by the maker. **Repair, if anyone reopens the plate:**
  feather the mouth restore over 6 px, or keep the skin out of the hair weight (gate on hue and on
  distance from the figure's skin). Either is a new file and needs a new lock.
- **Costume and finish, 7.** The hair weight reaches the robe's blue-violet shoulder highlight, which
  turns a greyer lavender. The robe stays indigo with red trim, so it still reads. Small saturated
  cyan specks survive in the hair, outside the hue window. At game size they read as ice light, not
  as a fault. The eyebrow keeps A's teal-blue, a little darker than the hair now.
- **Identity, 8 (up from A's weak point).** The crown is now pale silver-lilac, next to the idle,
  the portrait and the Chapter I plate. It is no longer the royal blue that A inherited. The face,
  the eye, the ear, the smile line and the collar are A's pixels. The veins are tinted to skin:
  at 1:1 faint ghost lines remain on the cheek, and at game size they are gone. So the "scar" read is
  answered. The cost is that research §9.2's "pronounced facial veins" are now barely present.
  The locked battle idle drops them too, so this matches the other approved art.
- **Anatomy and edges, 7.5.** Unchanged from A: a clean matte on the shoulder and the crown, with
  soft strands at the far left.
- **Game read, 8.5.** On the tab the face reads as courteous, pale-haired and unmarked, and it matches
  his battle idle. The temple background (from A) shows at the edges.

## Verdict

**A2 PASSES at 7.4**, so Bailey's recommendation installs A2, not A. It was installed on 2026-09-25.

## Install record

- The PNG is `a2.png` byte for byte (`446b5b7e50c1...`). The master `macalania.2x.webp` (`581741cd6233...`,
  2688x1536) went through RealESRGAN_x4plus x4, then lanczos 0.5, then WebP q88, in ComfyUI
  (`scripts/master_a2.py`, one job, run once the queue had been empty for 60 s; not black). The sidecar
  `macalania.json` carries the measured focal 0.45/0.43, `status: APPROVED (...)`, and the replaced
  file's hash.
- Replaced: the 2026-09-22 CANDIDATE plate (png `68fa5225fc1a...`, production judge 6, never locked).
  The replaced png, webp and json are in `D:/Tools/pyrefly-art-backup/approved/2026-09-25-ch7-pause-plate/replaced/`,
  and the installed three are in `installed/` beside it.
- Locked as set `chapter:macalania-pause:2026-09-25` in `docs/target/approved-hashes.json`, with
  Bailey's words. `tests/unit/chapters/macalania-ship.test.ts` pins that the lock matches the files on
  disk.
- A real capture of the installed files, with no interception (`../ship/picked/pause.mjs`, own Vite
  on 5721, GPU, seed 1, debug API from a fresh load, then real P and E x3): the CHAPTER tab is
  selected, the page served exactly the three installed hashes, and there were 0 console errors and
  0 HTTP errors (`../ship/picked/pause-chapter-tab-1600x900.jpg`, `pause-1600x900.json`). The server
  was stopped by PID.
