# Art method r3, P7 choker: independent 1:1 judge (2026-09-23)

**FFX-2 only** (Chapter 6, Leblanc; AGENTS.md hard rule 14). Bailey's option A (2026-09-23):
Leblanc keeps her idle plus ONE hero cast painting. This is an independent pass on
`CHOKER.md` (p7). I made none of these images. Nothing was rendered, queued, moved,
installed or deleted; `public/art/`, `src/`, `tests/`, `critic/`,
`docs/target/approved-hashes.json` and `docs/handoff/NOW.md` were not touched.

**Verdict.** p7 = **6** (choker, a high 6). It misses the bar of 7. It is **no worse than
the installed r2.2 on any criterion and better on two** (obi 7 against 6, and the choker's
identity and colour), so it should replace r2.2 as the Chapter VI cast candidate, still
below the bar.

## Anchors (sha256, re-hashed by me)

| File | sha256 | |
|---|---|---|
| `public/art/characters/leblanc/idle.png` = `r3/idle.png` | `4fea45f9...c9094b` | unchanged |
| `public/art/characters/leblanc/cast.png` = `r3/cast.r2.2.png` | `49d3c55f...880d66` | unchanged |
| `r3/p6/cast.p6.png` | `18f89c48...e94c58` | unchanged |
| `r3/p7/cast.p7.png` | `772661a5...3df3013e` | matches `CHOKER.md` |

## Numbers I re-ran myself (numpy + PIL, my own scripts)

| Check | Result |
|---|---|
| p7 against **r2.2**, outside the union of the p6 masks (`obi.M`, `obi.band`, `choker.M`, `choker.band`) and p7's `choker.G` (24,965 px) | **0 px changed, MAD 0.0, max 0**. Alpha changed: 0 px |
| p7 against r2.2, all changes | 23,450 px, bbox x 309 to 479, y 407 to 778 (obi, tassel, choker only) |
| p7 against **p6** | 2,688 px, all inside x 344 to 415, y 395 to 452 (= `choker.G`); obi region identical to p6 |
| Choker median Lab on p7's measured part (`mask.choker.png`, 742 px) against the idle atlas choker | p7 L 50.79 a 22.57 b -22.86 vs idle 49.11 / 22.00 / -22.62: **dE2000 1.70** (bar 3). Same pixels in p6: 7.20; in r2.2: 10.27. r2.2's own choker on its own mask: 11.53 |

The author's MAD and colour numbers reproduce exactly. I did not re-run the seam-gradient
ratio (2.20 as reported); I judged the edge by eye instead, below.

## How it was looked at

All files flattened on mid grey. Idle resampled by 0.8 (Lanczos) as `CHOKER.md` does. Crops:
the head and neck at 1:1 (idle 0.8 | r2.2 | p7); the neck at 2x (same three); the choker at
3x (smooth) and 4x/5x/8x (nearest) for r2.2, p6 and p7; the idle's choker at 4x and 8x
(native and 0.8); the obi, knot and tassel at 2x against idle and r2.2; the three whole
figures at game height (196 px) and at 2x of that.

## Scores (0 to 10 against idle; a file's score is its lowest criterion; bar 7)

| File | Hair | Face/eyes | Skin | Obi/knot/tassel | Choker | Heart | Fan | Boots | Style | Anatomy | Reads as cast | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cast.r2.2 (installed, JUDGE.md) | 7 | 8 | 8 | 6 | 6 | 8 | 8 | 8 | 7 | 8 | 8 | **6** |
| cast.p6 (JUDGE.md) | 7 | 8 | 8 | 7 | 6 | 8 | 8 | 8 | 7 | 8 | 8 | **6** |
| **cast.p7** | 7 | 8 | 8 | 7 | **6** (high) | 8 | 8 | 8 | 7 | 8 | 8 | **6** |

Everything outside the choker region is p6's pixels (verified above), and p6 is r2.2 outside
the obi and choker, so those criteria carry over. I re-looked at the obi at 2x: it is the
idle's crimson sash, knot, one cord, medallion and striped tassel; the tassel's lower strands
are slightly grey and translucent at 2x. 7 stands. At game height the obi reads crimson (r2.2:
a narrow pink band) and the choker cannot be told apart from r2.2's.

### Choker: 6 (a high 6, clearly better than p6's 6)

What p7 fixed, all four of the p6 defects I would have named:

- **Colour.** Deep violet at 1:1, the idle's own (1.70). p6's lightness is gone.
- **Identity.** A violet band with the idle's pale studs (five at 4x) and the ring at the
  right end. At 1:1 it reads as the idle's studded choker; r2.2's reads as a different,
  plain band with one stud.
- **Smudge.** Gone. The skin fill under the band matches the lit neck; I cannot find its
  border at 3x or 5x.
- **Top edge.** It carries the idle's ink line. The black tips above the left end are r2.2's
  hair, unchanged.

Why it is still not a 7 (the join is nameable at 2x, which Pass 2 forbids):

- **The right end.** At 1:1 in the head crop there is a dark, spiky cluster to the right of
  the band: the ring's black outline, r2.2's hair tooth and the start of the strap run together
  into one jagged black shape. At 2x it reads as a knot of ink rather than a ring on a strap.
  The idle's right end is busy too, but it resolves into a ring and strands; this does not.
  The author named the same spot.
- **The bottom edge.** The idle's band has a continuous lower outline. p7's lower edge is the
  idle's pink shadow line broken into short red-orange dashes on lit skin, so the lowest studs
  seem to hang off the band. Visible at 2x as a ragged edge, obvious at 4x.
- **Shape.** At 0.8 the band is shorter and narrower than r2.2's and reads as a flat patch laid
  on the neck, not a band wrapping it; its left end frays into the black hair and ink spikes.
  Beside the idle at 2x, Bailey would see that the choker was put there.

r2.2's choker, by contrast, has the cleaner finish (crisp outline top and bottom, a coherent
end at the strap) but the wrong identity and colour (11.5 dE2000, lilac, one stud), visible
at 1:1 beside the idle. Both are 6 for different reasons.

## Pass and Kill for P7

| Rule | Result |
|---|---|
| Choker at least 7 | **FAIL** (6) |
| MAD 0 outside the masks | **PASS** (verified against r2.2 and against p6) |
| Choker within dE2000 3 | **PASS** (1.70, verified) |
| No nameable seam at 2x | **FAIL** (right-end cluster, broken bottom edge) |
| Seam gradient 1.5 | FAIL as written (2.20; not re-run). I agree with the author that part of it is context (lit neck), but the eye finds a real join at the right end as well |
| Every other criterion no lower than r2.2 | **PASS** |

`CHOKER.md` says the result is final either way. This judge does not recommend a further
choker repair round.

## Is p7 no worse than r2.2 on every criterion?

**Yes.** Criterion by criterion: hair, face, skin, heart, fan, boots, style, anatomy and reads
as cast are the same pixels (equal). Obi 7 against 6 (better). Choker 6 against 6 (equal by
score); on its parts p7 wins on identity and colour, which show at 1:1 beside the idle, and
loses on the cleanliness of the edge, which shows at 2x. I weigh the 1:1 read higher, so I call
the choker no worse and slightly better. Alpha and silhouette are unchanged.

Recommendation to the driver (not an approval): replace the installed r2.2 cast candidate with
p7 (back up r2.2 first under
`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-ch6-optionA/leblanc/`; r2.2 also stays in
`D:/Tools/pyrefly-lora/leblanc/r3/cast.r2.2.png`),
recorded as **a candidate below the bar (6, choker)**, not as a pass. Reaching 7 needs a
choker that the transplant cannot deliver at this scale: the kill rule's next step (a fresh
hero-cast render) or a hand-painted choker line, each needing Bailey's yes.
