# Art method r3: the last choker repair (P7), Leblanc cast

**FFX-2 only** (chapter 6, Leblanc; AGENTS.md hard rule 14). This is the one targeted attempt the
driver authorised after the judge (`JUDGE.md`, commit `707adab4`) scored the p6 choker 6. It
changes the choker only; the obi, knot and tassel of `p6/cast.p6.png` are kept byte for byte. The
result is final either way. **The score below is my own self-score, not a pass.** An independent
judge decides.

Sheet: `choker-sheet.jpg` (idle | r2.2 | p6 | p7: neck at 1:1, choker at 2x and 4x, the p7
provenance map and part edge). Result: `D:/Tools/pyrefly-lora/leblanc/r3/p7/cast.p7.png`
(625x1203, sha256 `772661a5d09f5b56e2d4961d4485894dcb58b1ccd417f247bcd1a25e3df3013e`).

## Result in one paragraph

The choker is the idle's own pixels again, warped with the pilot's six landmarks, with **no Lab
ring lock** and a hard edge. Its median is **1.70 CIEDE2000** from the idle's (p6 7.18, r2.2
11.53; bar 3), at L 50.8 against the idle's 49.1 (p6 56.4). The violet band on its own is 0.39
from the idle's band, and the studs are 0.84 from the idle's studs. The p6 band repaint and its
Telea pre-fill are gone: inside the p6 choker region every pixel is either r2.2's own, the
idle's warped pixels, or a skin fill taken only from r2.2's lit skin. So the pale smudge is gone,
and the top edge carries the idle's ink line. The right end is the idle's ring. Its black outline
now runs into r2.2's black strap, and the notch between them is closed with those dark pixels
extended. **No GPU was used** (no seam repaint was needed: 0 prompts, 0 GPU minutes). One gate
still fails as written: the seam-gradient ratio, 2.20 against the idle's own 1.16. The controls
below show why: the edge is 16 % crisper than the idle's own edge, and r2.2's lit neck is a calm
far ring. **Self-score: choker 7 (a low 7).** The right end is the weakest point.

## Anchors

| | sha256 | |
|---|---|---|
| `public/art/characters/leblanc/idle.png` | `4fea45f9...094b` | unchanged |
| installed `public/art/characters/leblanc/cast.png` (= cast.r2.2) | `49d3c55f...0d66` | unchanged |
| `p6/cast.p6.png` (the base) | `18f89c48...4c58` | unchanged |
| `p7/cast.p7.png` | `772661a5...013e` | new, in `D:/Tools/pyrefly-lora/leblanc/r3/p7/` only |

Nothing was written under `public/`, `src/`, `tests/`, `critic/`, or to
`docs/target/approved-hashes.json` or `docs/handoff/NOW.md`. Nothing was downloaded.

## What changed from p6 (`choker.py`, `choker-p7.json`)

Every change stays inside **G**: the p6 choker region, which is dilate(p6 choker M, 10), the region
the p6 merge owned (2,745 px, x 344 to 417, y 395 to 452). Inside G, from the bottom layer up:

1. **r2.2's own pixels.** The p6 band repaint (the model's d 0.25 pass) and the Telea pre-fill
   under it are dropped. Those two made the pale smudge and the broken right end.
2. **The gap.** This is r2.2's old choker (its SAM mask grown 2 px) where the new part does not
   cover it, plus the underside SAM's mask left out. That underside is the red lower edge line and
   the pale lavender V patch under the band's middle and right. I placed it by hand as a polygon
   on a 14x grid crop (`choker-p7.json`).
   - r2.2's neutral ink stays: L < 30 and chroma < 12, which is the hair, the strap and the
     halter's edge line. SAM's old mask had taken part of the strap.
   - The gap is filled by **normalised convolution from r2.2's lit skin and the halter's white
     only** (L > 85). The fill cannot pull grey out of the strap or violet out of the choker.
     The P6 Telea pulled both, and that was the smudge.
3. **The idle's choker.**
   - **Mask.** The idle atlas mask, grown 1 px so its own ink outline comes with it.
   - **Skin removed from the mask.** The idle's own neck skin that SAM's mask holds is left out:
     tan with b* > 4 and a* < 15, and the halter's white with L > 85 and a* < 10. That is 55 of
     the mask's 1,099 px (107 of 1,246 once it is grown), under the jaw and under the ring. On r2.2's lit neck it read as a tan
     smear. The pink shadow line under the studs stays.
   - **Warp.** The pilot's landmarks (`cast-landmarks-p6.json`), sampled **once at 1x with
     Lanczos-4**. The pilot's 2x canvas with an INTER_AREA reduction softens a 1 px ink line at
     0.8x. Without the lock it holds 14.5 % ink against 15.6 % for the 1x sample (idle 16 %;
     p6 10 %, where the lock, the 4 px feather and the repaint lightened it too).
   - **No lock.**
   - **Alpha.** 1 inside the warped mask. On the outer 1 px ring the alpha is 1 where the warped
     pixel is ink (L < 40) and 0.5 elsewhere; that ring is the only feather.
4. **The strap bridge.** Between the ring's black outline (the idle's) and r2.2's black strap, the
   fill left a 17 px notch. I closed it by extending those dark pixels: each notch pixel takes the
   colour of the nearest one. Nothing was generated.

**No seam repaint.** The brief said to try none first. At 1:1 and 2x I could not find a join the
model would hide that it would not also re-invent, so ComfyUI was never called. I did not poll the
queue either, since no prompt was queued.

### Variants tried before the pick (all CPU; kept in `D:/Tools/pyrefly-lora/leblanc/r3/p7/v*/`)

| | Change | Seen at 4x to 16x | Kept? |
|---|---|---|---|
| vA, vB | no lock, hard paste; gap = idle's warped surroundings (A) or Telea (B) | A: the idle's shadowed neck is tan and its halter lines miss r2.2's. B: r2.2's old underside (red line, lavender V) still shows, since SAM's mask left it out | no |
| vC to vF | + underside polygon, Telea with ink masked; dilate 1 or 2 | smudge gone, but r2.2's strap pixels inside SAM's old mask were filled grey; dilate 2 brings more tan | no |
| vG, vH | + the idle's skin left out of the part; + r2.2's hair kept in front of the left end | tan smear gone. Hair-in-front left a small blue fleck of the part between strands, and its gate median (2.46) passed only because r2.2's black hair sat inside the measured mask | no (hairOver 0 from here) |
| vI, vJ | hair not in front; 2x canvas (I, median 3.03) against a 1x Lanczos-4 sample (J, 2.86) | J is crisper: studs and outline sharper | 1x kept |
| vL | skin fill by normalised convolution instead of Telea | the grey gradient by the strap is gone | kept |
| vM | + strap bridge | the notch between the ring and the strap is closed | kept |
| **vN = p7** | the skin rule narrowed (tan a* < 15, white L > 85) so the pink line under the studs stays whole | the bottom edge is less broken; median 1.70 | **picked** |

## Gates (`gates.py`)

The command:

```
gates.py --cast p7/cast.p7.png --p2 p7 --p3 p7 --repaste 0 --base p6/cast.p6.png --regions choker --parts choker --skipHurt 1 --out p7/gates
```

- `--base`, `--regions`, `--parts` and `--skipHurt` are new options. Their defaults keep the old
  behaviour: re-running the P6 arguments reproduces `gates-p6/gates.json` exactly (cast, hurt and
  verdicts are all equal).
- Output: `D:/Tools/pyrefly-lora/leblanc/r3/p7/gates/gates.json`.

| Gate | Bar | p7 | p6 | Note |
|---|---|---|---|---|
| MAD outside the choker mask and band (G), against **cast.p6** | 0 | **0.0** (max 0) | | **PASS**. 2,688 px changed, all inside x 344 to 415, y 395 to 452. The obi region differs from p6 by 0 px |
| alpha changed | 0 | **0 px** | 0 | **PASS** |
| choker median CIEDE2000 against idle | 3 | **1.70**: Lab (50.79, 22.57, -22.86) against the idle's (49.11, 22.00, -22.62) | 7.18 (L 56.4) | **PASS**. r2.2: 11.53 |
| the same, 2 px core | | **1.56** | 3.98 | |
| seam gradient ratio (edge ring +/-2 px over the ring 10 to 14 px out) | 1.5; the idle's own choker is 1.16 | **2.20** | 1.59 | **FAIL as written**. Controls below |
| invented colour in the region (the proposal's measure) | 1 % | **0.84 %** | | **PASS**. r2.2 on the same px: 1.17 %. Against every idle colour: 0.00 %. Changed pixels outside the part (fill, bridge, pixels restored to r2.2): 0.28 %. Transplanted pixels: 2.19 % (the floor on the idle's own parts is 3.85 %) |
| cut-out margins | 16 | 16/16/16/16 | 16 | PASS |

**Colour controls.** These are my own classes over the measured part: band = a* > 12, b* < -15,
L < 62; studs = L >= 62, b* < -5; ink = L < 30.

| | band share | stud share | ink share | band median (dE00 to idle band) | stud median (dE00 to idle studs) |
|---|---|---|---|---|---|
| idle | 42 % | 23 % | 16 % | L 44.8, a 33.9, b -43.3 | L 73.6, a 20.8, b -22.1 |
| r2.2 (its own choker) | 33 % | 40 % | 13 % | 11.77 | 3.85 |
| p6 | 37 % | 29 % | 10 % | 1.87 | 1.98 |
| **p7** | **42 %** | **26 %** | **15 %** | **0.39** | **0.84** |

p6 was light because it lost ink and gained pale pixels, not because its violet was wrong. p7 has
the idle's proportions back. Of the 742 measured px, 713 are the idle's warped pixels, 26 are
skin fill (where the idle's own tan skin was left out), 2 are bridge and 1 is r2.2's ink.

**Seam-ratio controls.** These are the mean Lab gradient on the edge ring and on the far ring.

| | edge | far | ratio | far ring that is lit skin |
|---|---|---|---|---|
| idle, own choker | 18.00 | 15.49 | 1.16 | 44 % |
| r2.2, its own choker on its own mask | 18.17 | 9.40 | 1.93 | 77 % |
| r2.2 on p7's rings | 14.77 | 10.13 | 1.46 | 74 % |
| p6 | 15.72 | 9.91 | 1.59 | 74 % |
| **p7** | **20.84** | **9.46** | **2.20** | 76 % |

- The idle's own ratio is low because its far ring is busy: jaw shadow, hair and the fan.
- r2.2's lit neck gives a calm far ring, so even r2.2's own painted choker scores 1.93 there.
- p7's edge is 16 % sharper than the idle's own edge. That is the hard edge: a dark ink outline
  against lit skin, where the idle's outline sits against black jaw shadow.
- I read this as the gate measuring the context, and I do not claim it as a pass.

## What I saw (1:1, 2x, 4x and 8x; `choker-sheet.jpg`)

These are the judge's four p6 defects, one by one.

1. **Lighter than idle.** Fixed. At 2x the band is the idle's deep violet, with the idle's row of
   pale studs (five show) and the ring at the right end.
2. **Top edge: no clean ink line, jagged spikes on the left.**
   - The top edge now carries the idle's own 1 px ink line along its length.
   - The black strands above the left end are r2.2's own hair tips (the pixels are unchanged).
     They end on the choker's top edge.
   - A strict judge could still read those tips as spikes. They were in r2.2 as well.
3. **Pale smudge under the middle to right.** Gone. It was r2.2's old underside plus a Telea pull
   from the strap. It is now flat lit skin that matches the neck around it (L 95), and I cannot
   see the fill's border at 2x.
4. **Broken right end.**
   - The idle's ring (pale blue, black outline) now meets r2.2's black strap directly, and the
     strap runs down from it.
   - No white or grey is left in the join.
   - It is still a small dark cluster: the ring, r2.2's black hair tooth to its right, and the
     black wedge where the strap starts. It is darker and heavier than the idle's own busy right
     end (ring, black strands, V lines).

Other things a judge may name:
- **The bottom edge.** Under the studs the idle's pink shadow line shows as short red dashes on
  lit skin, where the idle's sit on tan skin. It reads as a thin shadow at 1:1 and is visibly
  dotted at 4x.
- **Width.** At 0.8x (the pilot's landmarks), the choker is narrower than r2.2's band, so a
  little more neck shows.
- **A small pale notch** (about 2 px) at the band's top right, just left of the black hair. That is
  where the idle's tan skin under the jaw was left out and r2.2's lit skin shows.

## Self-score (not a pass; bar 7; the independent judge decides)

| | Choker |
|---|---|
| p6 (judge) | 6 |
| **p7 (self)** | **7, a low 7**. Identity, colour and top edge are 8. The finish is 7: nothing pale, no smudge, and no join I can name at 2x. The right-end cluster is the one place I would not argue with a 6 |

Everything else in the file is p6's (obi 7 per the judge), which is r2.2 byte for byte outside
the obi and choker regions. So the file's score is min(obi 7, choker), under the judge's rules.

## GPU

**0 prompts, 0 GPU minutes** (cap 10). ComfyUI (`http://127.0.0.1:8188`) was not called, polled or
restarted. The pilot's ledger (`gpu-ledger.json`, 8.09 min) is unchanged.

## Files

- `choker.py`: the P7 repair (CPU; its defaults are the P7 settings).
- `choker-p7.json`: the hand-placed old-underside polygon.
- `choker-sheet.py` and `choker-sheet.jpg`: the crop sheet.
- `gates.py`: the new options `--base`, `--regions`, `--parts` and `--skipHurt`, with defaults
  unchanged.
- Scratch in `D:/Tools/pyrefly-lora/leblanc/r3/p7/`:
  - `cast.p7.png`
  - masks: `choker.{P,M,band,G}.png`, `mask.choker.png`, `gap.png`, `strap.png`
  - `provenance.png`, `choker.json`
  - `gates/gates.json`
  - the variants `vA` to `vN`
  - the regression run `gates-regress-p6/`
