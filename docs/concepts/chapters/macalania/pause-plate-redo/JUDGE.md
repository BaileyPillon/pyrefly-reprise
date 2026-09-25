# Chapter VII pause plate redo: independent judge (FFX only)

Judge: a separate agent run that made none of this work, 2026-09-25. Bar 7, and the worst
criterion sets the score. Anchors: the approved Ch I plate `public/art/pause/seymour.png`, the
approved Chapter VII speaker portrait `public/art/portraits/seymour-macalania.png`, the newly
locked battle idle, and `../unlock/art-approval.jpg`. Every option was viewed whole at
1344x768 (1:1), with 1:1 crops of the face, the top, the left and the right edges, plus the
real 1600x900 CHAPTER tab captures in `../unlock/img/redo-pause-*.jpg`.

## Part (a): the locks, checked

- Set `chapter:macalania:2026-09-25` (commit 446b3fe6) holds exactly the six files on
  art-approval.jpg other than the pause plate: Seymour idle, cast and hurt, Guardian idle and
  cast, and `backdrops/macalania-temple.png`. `pause/macalania.*` is not in it. The record
  carries Bailey's words.
- The full sha256 of every file in `public/art` matches its lock. Each backup in
  `D:/Tools/pyrefly-art-backup/approved/2026-09-25-chapter-macalania/` has the same hash as
  its live file, and each has a sidecar.
- `verify-approved.mjs`: 159 ok, 0 mismatched, 0 missing. The three vitest files that read
  `approved-hashes.json` pass, 36/36.
- `public/art/pause/macalania.*` still has its 2026-09-22 mtimes, so nothing was installed.
  No port in 5640-5659 is listening.

## Part (b): the options

| | Score | Worst criterion | Notes at 1:1 |
|---|---|---|---|
| **A** | **7** | Identity, the hair | The face is still the strongest of the three. The background now reads as the temple: gold arches, ice columns and a brazier, blurred like the other plates. The matte edges are clean on the right shoulder and at the top. The ghost strands at the far left are soft but not wrong. The mouth line is byte-identical to the installed plate. The "eye pixels identical" claim is off by 11 pixels just under the eye (max delta 52), which cannot be seen. **Residual 1:** the hair is saturated royal blue. The approved Ch VII idle, the speaker portrait and the Ch I plate all have pale silver-lilac hair. This was already true of the installed plate, and nobody fixed it. **Residual 2:** the veins are faded to thin tan lines, but on the real tab capture they still read as a crack on the cheek. They are softer than the red "scar", but not gone. |
| **B** | **6** | Identity | This is the most finished painting of the three, and its hair colour is closest to the anchors. But it is a different, younger Seymour: hair covers the second eye, there is a purple streak, there are no veins, and the ice-only background has none of the temple's gold. |
| **C** | **6** | In-game read and expression | The identity is closest to the approved portrait, and the temple background reads well. But the cold stare contradicts the courteous smile in research §9.2. It is flatter and less vivid than the approved plates (compare `seymour.png`). On the tab the eye is dim and the face is mostly hair. |

## Verdict

A clears the bar at 7, and the recommendation of A holds. Bailey should hear the two residuals
before picking. The first is the royal-blue hair, which is off-model against the approved Chapter
VII paintings. It is fixable by a hue and lightness shift on the hair matte, but that would be a
new option, not A. The second is the faded veins, which still read as a crack at game size. If he
wants no scar read at all, the choice is to drop the veins (as his approved idle does) or to
tint them to skin tone. B and C do not reach 7.

One more point: on the CHAPTER tab, the crop shows only the face, so A's main fix (the
background) is visible mostly on the chapter card. The chapter card was not captured.
