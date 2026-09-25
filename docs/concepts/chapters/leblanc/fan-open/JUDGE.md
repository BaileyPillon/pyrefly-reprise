# PR-0096 open-fan candidate: independent 1:1 judge

FFX-2 only (Chapter VI, Leblanc). I made none of this work. I judged the candidates in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-25-leblanc-fan/` (commit 4091d809)
against the installed idle (`public/art/characters/leblanc/idle.png`, sha256 4fea45f9...)
and Bailey's pick B (`docs/concepts/chapters/leblanc/renders/leblanc-b.png`; targets tile
"chapters/Leblanc Syndicate": "fan fully open, warm magenta"). Bar 7.

**Verdict: PASS, 7.8 (red), 7.7 (magenta).** Both candidates are ready for Bailey. Nothing
is installed, so the live defect stays open until one is installed on Bailey's word. The
installed idle is an approved painting (`approved-hashes.json`, chapter:leblanc-idles).

## What I checked myself

- **Pixel gates, recomputed from the PNGs, not taken from gates.json.** Red sha256
  77192c23..., magenta d6055789.... Both use the same 591x1118 canvas. Each changes
  15,232 px inside the bbox (383,54)-(549,217). Only 124 changed px were opaque before,
  all at the hair edge. No pixel lost alpha. Every other pixel is byte-identical. The
  installed idle's sha256 is still 4fea45f9... on disk.
- **Geometry.** The transplant opens the fan through 92 degrees (theta 196-288). The
  installed cast's own fan spans 98 degrees, so the two match. The ribs come from the
  idle's end cap under the hand.
- **Source.** The red leaf with the black guard and black-and-white ribs is the fan in
  the installed `cast.png`. Idle and cast now show one fan.
- **At 1:1, 3x and 5x** (on dark grey and on the chapter's pink), and in the claimant's
  two real 1600x900 frames: `ingame/fanred-seam3-f03.jpg`, where nothing covers her,
  and `docs/screenshots/round11/pr0096-leblanc-fan-*-ch6-link3.jpg`, the menu frame. I
  checked the sheet against the files.

## Scores (red / magenta)

| Criterion | Score | Why |
|---|---|---|
| Identity | 10 / 10 | Face, hair, eyes, smile, outfit and pose are byte-identical to the approved idle. |
| The fan | 7.5 / 7.5 | It is clearly open, a folding fan fanned from the guard at her lips to about vertical. It is not the "snapped-shut" pose C. It is not pick B's round uchiwa held at the chest. It is not literally "fully" open: it opens about 92 degrees, like the cast. The closed stack at her lips has many visible slats, so at 3x it reads a little as a closed bundle plus a leaf. At 1:1 and at game size it reads as one fan. Red departs from pick B's "warm magenta" but follows D-036. Magenta is the reverse. That conflict is Bailey's to settle, and the claimant disclosed it. |
| The hand | 8.5 / 8.5 | These are the idle's own pixels. The fingers sit correctly over the rib band, with no doubled fingers or cut knuckles. |
| Seams | 7.0 / 7.0 | At 5x the hair edge against the leaf shows the idle's old matte as a thin dark or grey contour. There are two or three near-white specks where the hair tip, leaf and guard meet. These were already in the idle; the red behind now shows them. You cannot see them at 1:1 or in game. |
| Finish | 7.5 / 7.5 | The leaf is a flat striped gradient, and the black-and-white rib band is loud. It is more graphic than the painted idle, but it matches the installed cast's fan. |
| Read at game size | 8.0 / 7.5 | In the seam frame (Leblanc about 81x156 px) a red open fan with ribs stands clearly beside her head. The magenta leaf blends a little into the pink heart backdrop. In the link 3 menu frame, the intent card's left edge (x about 867) cuts the leaf. That is a HUD staging defect (PR-0094 family), not a defect in the candidate. |

The overall score is the judge's weighted read, not an average: red 7.8, magenta 7.7.
Both clear the bar.

## Claims checked

- "MAD 0 outside the mask, 15,232 px, 124 matte px, same canvas, idle.json stays
  valid": **confirmed**.
- "Installed nothing": **confirmed** (the sha256 is unchanged; the commit holds only
  docs and screenshots).
- "The fan reads clearly open at game scale": **confirmed** in the uncovered seam frame.
  In the menu frame it is **partly true**, because the intent card covers half the leaf.
- "Join clean at 6x": **mostly**. The hair-edge matte contour and the specks above are
  the only marks. They are minor and pre-existing.

## For Bailey (unchanged from the claimant, agreed)

1. Colour: red (D-036, the same fan as the cast, stronger against the pink heart) or
   warm magenta (pick B's words). I agree with the claimant: red.
2. Before install, optionally clean the three near-white specks at the hair tip. This
   is a masked touch-up; it does not block the pass.
