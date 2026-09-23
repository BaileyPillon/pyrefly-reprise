# Evrae r3 re-judge: breath-charge cycle 2 and the lunge cast candidate (2026-09-23)

FFX only (Chapter 8, Evrae, an FFX boss; no FFX-2 chapter, shared code or game file is touched,
AGENTS.md hard rule 14). Independent judge: I made none of this art and rendered, installed,
edited or approved nothing. `docs/target/approved-hashes.json` sha256 `ac7d7214...2638` before
and after. This report is the only file committed. No browser was used.

| File | sha256 | Reference |
|---|---|---|
| `public/art/characters/evrae/breath-charge.png` (installed, cycle 2) | `55ce9c75...5934` | `idle-near.png` `4140ba74...28af` (judged 8), look B |
| `docs/concepts/chapters/evrae/r3/cast-candidate.png` (NOT installed, cycle 2) | `f1723ed0...7b24` | `idle-near.png`; `hurt.png` `f6699012...7529` (passed at 7) for confusability |

Method: whole files on grey; 1:1 and 2x Lanczos crops of the head, throat, neck arch and dorsal
line over a dark sky (18,24,48); 4x nearest-neighbour on the rims; a numpy diff and alpha count
against idle-near; all four states downscaled to NEAR game size (0.532 screen px per image px,
Lanczos, baseline-aligned) over the dark sky and a dusk salmon, looked at 1:1 and 2x. Crops are
in my scratchpad and are not committed. No score comes from the painter's sheet or captures.

## Scores (0 to 10, bar 7 on every criterion; the score is the worst)

| Item | Identity | Colour | Seams | Anatomy | Alpha edges | Reads as state | **Score** | Verdict |
|---|---|---|---|---|---|---|---|---|
| breath-charge (cycle 2) | 8 | 7 | **7** | 7 | 8 | 8 | **7** | **PASS** (at the bar) |
| cast candidate (cycle 2, not installed) | 8 | 9 | 6 | **6** | 6 | 8 | **6** | **FAIL** |

Cast against hurt at game size: **9, clearly distinct** (see below).

## breath-charge (7; PASS at the bar; worst: seams 7)

All three cycle-1 mustFix items are fixed.

- **Dorsal pixels, numpy.** Outside the box x 241..561, y 93..244 not one pixel differs from
  idle-near (15,279 changed pixels, 4.2 % of idle's opaque area). In all 100 neck columns of the
  swell (x 382..528, crest-spike columns excluded) every row from the top of the neck down to
  **17 px above the belly-plate seam** is byte-identical to idle: 58 % of each column's neck run,
  including every dorsal scale and spike. The sidecar's "seam minus 12 px" is slightly
  optimistic: the change starts 7 to 17 px above the lowest teal row, and 29 of 100 columns
  differ in rows seam-17..seam-13. Those changes are the warm spill and are tiny (1,255 of 6,219
  neck teal pixels touched, median max-channel delta 6 of 255), not visible at 2x. **Verified.**
- **Alpha edges 8.** 0 soft-alpha pixels (idle 0). At 4x the swell's rim steps 1 px at a time,
  the same stair density as idle's own edges; at 2x Lanczos and at 1:1 over the dark sky the rim
  is a clean smooth curve and **the stair-steps are not visible**. No pale fleck on the swell.
- **Seams 7.** The level teal-to-orange cut is gone: the glow's top edge is the belly plates' own
  scalloped seam with idle's dark outline intact, and the right end fades along the neck into
  the pink band. What keeps it at 7: (1) at the frill end the swell's left flank carries a
  stretched pinkish streak where idle's belly edge was pulled down (2x and 4x); (2) the swell's
  outline has no painted edge line, unlike idle's belly. Neither shows at game size.
- **Anatomy 7.** A real in-place swelling: the underside goes from rows 134..154 to 199 at its
  deepest (x about 450), about +65 px on a 95 px neck, one convex curve merging into the arch's
  belly line; no pendant bulb. It rises steeply into the frill's crook, a slight pinch at 2x.
- **Colour 7.** Teal body and orange fins untouched; the glow reads as light through the plates.
  Inside the swell the lit plates are smoother and flatter than idle's painted plates (the Lab
  lift lowers their texture), a slightly plastic yellow at 2x. The mouth glow (unchanged from
  cycle 1) is a soft yellow wash over the lower teeth at 2x; it reads as a lit mouth at game size.
  **Flag: the orange glow colour is unsourced** (research section 12.2 names none). Scored on
  craft only; the colour is Bailey's call.
- **Identity 8, reads as a charge 8.** Head and body are idle's pixels. At NEAR game size the
  swollen, lit throat is the first thing the eye finds; on the dusk ground it still separates.

## cast candidate (6; FAIL; worst: anatomy 6, with seams and alpha edges also 6)

- **Reads as an action 8.** The head is driven down and forward: the snout tip moves from idle's
  (221, 208) to (173, 283), about 47 screen px at NEAR, and the long flattened neck reads as a
  lunge at the party. Cycle 1's "the idle, a little taller" problem is solved.
- **Cast against hurt 9.** Hurt's snout sits at (260, 85) on the same baseline, up and back; the
  two snouts are about 117 screen px apart at NEAR and the silhouettes are opposites (a low
  forward lunge against a high rear). They cannot be confused at game size.
- **Anatomy 6.** The mouth. The sidecar's own `foldPx` is **266** (min Jacobian -4.5) in the box
  x 197..239, y 268..296, which is the jaw; this contradicts its note that the teeth are not
  folded. At 2x and 4x the upper snout's underside becomes a flat shelf and the lower jaw a thin
  sliver bent back under the head, so the head reads blunter than idle's. At game size it passes
  as an open mouth, but at 1:1 to 2x it is visibly not idle's jaw.
- **Seams 6.** The -55/+28 px drive shears the upper neck: at 2x the dorsal scales are stretched
  and slanted along the arch, and the middle dorsal spike is pulled into a long thin blade about
  twice its idle length.
- **Alpha edges 6.** 4,030 soft-alpha pixels (idle 0), 242 of them pale (luminance > 180); at 2x
  over the dark sky they draw a thin whitish line along the top of the neck right of the crest,
  faint at 1:1.
- **Identity 8, colour 9.** Idle's head, frill and palette; the blunter snout costs a point.

## mustFix (cast candidate, before it is offered for Decision 1)

1. Open the jaw without folding: 0 fold pixels in the mouth box, the upper snout's underline kept
   as idle's, the lower jaw keeping its width (for example rotate the lower jaw as a rigid layer
   and fill the gap with the gullet, instead of a weighted warp across the mouth corner).
2. Keep the dorsal scales and spikes rigid under the drive (bend the neck lower down, or rotate
   rather than shear the upper arch) so that no spike or scale stretches beyond about 1.2x.
3. Binary alpha like idle's, with no pale fringe along the dorsal contour.

The pose itself (down and forward, the opposite of hurt) is right; keep it.

## For Bailey

Breath-charge passes at the bar: an in-place, lit throat that reads at game size; the orange glow
colour has no source and is your pick. The cast pose is now clearly an action and clearly not the
hurt, but the jaw and the stretched top of the neck are not clean enough yet. Nothing here is
approved until Bailey says so.
