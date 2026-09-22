# Evrae redo: independent judge (2026-09-22) — FFX only

Judged commit **c152aff** (`redo.md`) plus the later cleanup pass **aff3fa8** that touched
`ko.png` (`../cleanup/cleanup.md`). Nothing was rendered or edited. Every file is still a
**CANDIDATE**. `docs/target/approved-hashes.json` has 115 files, and all of them hash the same
before and after this judge.

Game case (AGENTS.md rule 14): **FFX only**. Evrae is the FFX airship boss.

Sheet: [`judge-sheet.jpg`](judge-sheet.jpg), built by `judge-sheet.py`. Each row shows the
picked concept B, the installed state whole on mid-grey, two native 1:1 crops (or 2x of a
1:1 crop when marked), and the verdict. The last row is the chapter card with three 1:1
crops of the 2x master.

**How the score works:** each state gets the score of its worst criterion. A state passes at
7. The criteria are colour identity against concept B, how the silhouette reads, a clean
cut-out, style match and, for the card only, whether it is legible at 1:1 on the 2x master.
**Overall: FAIL. 2 of 6 pass.**

## Scores

| State | Colour | Silhouette | Cut-out | Style | **Score** | Worst criterion |
|---|---|---|---|---|---|---|
| idle-near | 9 | 8 | 8 | 9 | **8** | silhouette: this is the concept's framing, not research §12.2's NEAR "head and claws fill the upper third" |
| idle-far | 7 | 8 | 8 | 8 | **7** | colour: dense saturated red-orange spines dominate (warm share 0.37 against the anchor's 0.21), and the belly reads grey-pink, not tan |
| breath-charge | 8 | 7 | 7 | 6 | **6** | style: the throat sac is a flat vector disc with a smooth gradient and a pale blob, not painted scales or plates. It reads like a sticker at 1:1 |
| hurt | 7 | 6 | 6 | 7 | **6** | silhouette: the body copies idle's coil and only the head lifts; see also colour, cut-out and scale below |
| ko | 8 | 7 | 5 | 8 | **5** | cut-out: the aff3fa8 hole fill left a hard-edged red and brown **block** in the tail fin, and an opaque white oval sits in the spine |
| chapter card | 7 | 7 | — | 7 | **6** | legibility at 1:1 of the ship: the deck is plain grey with random coloured dashes, and the prow is a featureless blade with a hard orange seam |

Colour numbers (re-measured with `huestat.py` on the installed files; they match `redo.md`):
the anchor is cool hue 201 with warm share 0.21. idle-near 202 / 0.22, idle-far 194 / 0.37
(saturation 0.91), breath-charge 204 / 0.22, hurt 207 / 0.17, ko 200 / 0.22. The share of
violet and pink pixels is 0.024 for hurt against 0.005 to 0.010 for every other state.

## Findings at 1:1

**Facing.** Every sidecar says `facing: left`. `mirrorFor('left', -1)` returns 1, so the
engine never mirrors these, and the art already faces the party. idle-near, idle-far,
breath-charge and hurt all have the head at frame-left, pointing left. ko has the head at the
lower left with the snout pointing right and down, which fits a tumble. No facing defect.

**Frame cut-offs.** None. Every state keeps a 16 px transparent margin on all four sides. The
cropBox values map to content that stays well inside the 1216x832 source.

**idle-near (8).** Teal head, orange crest and frill, orange eye, open jaw. This is the
closest state to the anchor. The concept's stray second head is gone, and so are the white
holes. It has 3 detached specks of 2 to 4 px, and 1.2 % of its edge is near-white. Neither is
visible at play scale.

**idle-far (7).** The distant S-streak with a small head at the upper left and a flame tail
fin reads well. The body is teal. The spines are larger and redder than the concept's, so the
streak reads red-and-teal, not teal. There is a faint light rim along the belly, as `redo.md`
says. **Engine note:** `computePoseScale` sizes every pose at idle's pixels per unit. The
streak is 1024 px long against idle's 1171, and the body is about half idle's thickness
(90th-percentile ridge half-width 23 px against 45 px). FAR therefore reads as a thinner
Evrae of the same length, not as a smaller, distant one. NEAR and FAR are not wired yet (no
`src/` reference to `idle-far`). When they are, `idle-far.json` needs a pose `scale` below 1.

**breath-charge (6).** The silhouette telegraph works: the throat is a swollen, lit orange
sac attached to the neck under the head. But the sac is a flat, posterised fill with a pale
yellow circle. It has no scale texture and no plate seams, and it breaks the painted style at
1:1. The prompt asked for a "closed mouth", and the jaw is open with ragged red teeth. A
1 px white fringe runs along the serrated dorsal edges near (700 to 800, 250 to 330). 2.8 %
of the edge is near-white, and the largest flat white run is 87 px.

**hurt (6).** Identity mostly holds (hue 207). Four problems:
1. **The recoil barely reads.** The coil is idle's, and only the head lifts with a hiss.
   This is the Leblanc pilot's "B copies the idle pose" risk, which `redo.md` also names.
2. **A lavender "ghost coil".** The pale far coil at the left (about x 60 to 330, y 270 to
   420) has violet-pink spines and a blue-lilac body. The anchor's pale coil is blue-white.
3. **White fringe.** 5.1 % of the edge is near-white, the highest of any state, in the form
   of hard white ticks along the outer silhouette. The cel-style white slash highlights are
   harsher than the anchor's soft rendering.
4. **It shrinks in play.** The body's 90th-percentile half-width is 30 px against idle's 45,
   so at idle's pixel scale Evrae shrinks to about **0.67x** the moment it is hit.

**ko (5).**
1. **A defect introduced by the cleanup (aff3fa8).** Two of the four "pin holes" it filled,
   boxes `[419,414,443,431]` and `[427,386,465,432]`, were not holes. They were real
   background showing between the red tail-fin fronds and the spine. The cleanup filled them
   with a ring-median colour, and that left a hard-edged rectangular red and brown patch that
   is plainly visible at 1:1. See the `@370,320` crop on the sheet, and compare against the
   pre-fix file at
   `D:/Tools/pyrefly-art-backup/candidates/2026-09-22-cleanup/evrae/ko.png`.
2. **An opaque white oval** (about 91 px) at (429, 338) inside the right-hand spine, where
   the background shows through as white. This is a white hole that neither pass caught.
3. **The eye still reads open.** The prompt asked for closed eyes, and `redo.md` already
   notes this.
4. **It shrinks in play.** The half-width is 25 px against idle's 45, so Evrae shows at
   about **0.56x** at idle's pixel scale.

The head-first tumble itself reads: the head is at the bottom and the coils trail upward.

**Chapter card (6).** Research §12.3 money shot 2 is in the composition: the guard rail in
the foreground, a prow at frame-left, a cloud sea, and the teal wyrm alongside on a long
diagonal. At 1:1 on the 2x master the wyrm's head is legible, with a teal head, a red-orange
crest and a slit eye. Its spines are orange, not the anchor's crimson. The ship does not
hold up at 1:1:
- The deck is flat grey with scattered cyan, orange and white dashes that read as render
  noise, not riveted plating.
- The prow is a featureless dark blade, like a wing or a surfboard, with a square-ended
  orange band at its top edge.
- The tail runs off the frame edge at the right, which is acceptable for a card.
- The lettering and Bevelle are absent, which `redo.md` already discloses.

## Redo (ranked; respects hard rule 15: no re-render and no new painting method until Bailey picks)

Deterministic fixes (pixel or metadata; the owner of these folders may apply them):
1. **ko: revert the two mis-filled fin boxes** `[419,414,443,431]` and `[427,386,465,432]`
   to the pre-cleanup pixels from the backup above. This restores the real gap. Then
   white-key the oval at (429, 338) to transparent inside a small box. Re-run
   `node tools/gen/manifest.mjs`.
2. **hurt.json and ko.json: add a pose `scale`** so that the body thickness matches idle's.
   From the ridge widths that is about 1.5 for hurt and about 1.8 for ko. Confirm by head
   length before writing the value, because the ridge measure is an estimate. Both stay
   under the 2.2x longest-side clamp.
3. **breath-charge and hurt: remove the 1 px white fringe** on the outer serrations with an
   edge-only decontaminate or erode (the existing `dematte.py` approach), limited to
   near-white pixels that touch transparency.
4. **hurt: recolour the lavender ghost coil** (hue 260 to 330 in the box around x 60 to
   330, y 270 to 420) to the anchor's blue-white. This is a boxed hue shift.
5. **idle-far.json: add a pose `scale` below 1** when NEAR and FAR are wired. Until then it is
   unused.

Needs Bailey's pick or a new method (not done here):
6. breath-charge: a painted, scaled throat sac in place of the flat disc.
7. hurt: the installed pose, or the drifting but readable alternative
   `picks/alt/hurt-r2-4-flipped.png`. This was already put to Bailey in `redo.md`.
8. ko: a closed eye.
9. Chapter card: deck plating, a prow that reads as the Fahrenheit, crimson spines.
10. Palette authority: `redo.md`'s hard-rule-6 question, the pick against research §12.2
    `[estimate]`, is still open for Bailey.
