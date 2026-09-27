# Overdrive Sin's head, round 2: one repainted option in five mouth stages (FFX only, 2026-09-27)

Round 1 (`../head-pilot/`) failed an adversarial judge on every option. This round repaints option C's look:
three-quarter view, whale-like, rock-scaled, the head turned towards the ship, over the white city in gold light.
It fixes each fault the judge named. **This is an option, not approved art.** Nothing is installed in
`public/art/`, nothing is wired, and nothing is listed on the end-state board. The Sin head stays open until
Bailey picks (rule 9).

**Game case: FFX only** (rule 14). Link IV, Overdrive Sin, is fought from the *Fahrenheit*'s deck over Bevelle.
It has CTB turn order and a turn clock that ends in a scripted Game Over. FFX-2 has no counterpart
(`research/ffx-sin.md` §0.3).

## Read on a phone, in this order

| File | What |
|---|---|
| `part-1.jpg` | The stage-4 frame, the judge's faults and what changed, and the five stages at phone size |
| `part-2.jpg` | The clock: the five mouth crops and which of Sin's turns each covers |
| `part-3.jpg`, `part-4.jpg` | The 1600 × 900 battle frames for stages 0 to 4, and the deck dressing |
| `part-5.jpg` | The five 390 × 844 phone frames |
| `part-6.jpg` | Method and our code-drawn sketches |
| `part-7.jpg` | Every render of the round with its verdict, the faults left, and two questions for Bailey |
| `frames/` | The frames at full size (`frame-s<k>-1600.jpg`, `frame-s<k>-390.jpg`; the phone is rendered at 2x), plus `paintings.jpg`, `mouths.jpg`, `phone-scale.jpg`, `renders.jpg`, `sketches.jpg` and `deck.jpg` |
| `src/` | Everything that made this. See "Re-render" below |

Each part is a 1080-px-wide JPEG under 1 MB.

## What changed from round 1

| Round 1 fault | Round 2 |
|---|---|
| No tower, no wings. §9.1 says Sin "sprouts wings and props itself on a tower in Bevelle" | Our sketch draws both. The claw clamps the top of a white, gold-banded tower. Feathered wings with purple tips rise behind the neck |
| The deck was a generic railing | The *Fahrenheit*'s riveted steel prow. The plates carry "SALVAGE DREAM" and "CID", and a gold dial is set in the deck (`ffx-evrae-airship.md` §12.1) |
| "Shut" was wide open, with a ghost row of teeth | Stage 0 is its own img2img pass from a shut sketch. The lip line is closed, and only the fang tips overlap the lower lip |
| Stage 4's lower jaw was a separate bar ending in a tusk, made by cutting and rotating the jaw | Every open stage is its own masked img2img pass from its own sketch, with the jaw drawn at that angle. Each gives one continuous jaw from the hinge to the chin. Nothing was cut out and turned |
| Stages 0 to 3 barely differed at game scale | At the snout, on a 390-px phone, the gap between the jaws is 0, 25, 49, 73 and 97 px, and the violet throat light grows with it (`frames/phone-scale.jpg`) |
| The HUD said "stage 2 of 3" beside a five-stage sheet | The HUD's mouth meter has the painting's five stages (SHUT, 1, 2, 3, FULL), and its label names the stage shown |

## The clock (research/ffx-sin.md §5.4, §9.3)

Five visual stages: **shut**, then the **three open stages** and **fully open** from the wiki gallery.

| Stage | Sin's turns (default: Giga-Graviton on 13) | If S-1 settles on 12 |
|---|---|---|
| 0 SHUT | 1–3, "Drawn to Sin." `[verified: 5 sources]` | 1–3 |
| 1 OPEN 1 | 4–6 | 4–6 |
| 2 OPEN 2 | 7–9 | 7–8 |
| 3 OPEN 3 | 10–11 | 9–10 |
| 4 FULLY OPEN | 12, then Giga-Graviton on 13 | 11, then Giga-Graviton on 12 |

- **Sourced:**
  - the three pulls
  - the mouth opening in stages from turn 4
  - three open stages and "fully open"
  - Giga-Graviton on turn 12 or 13 (**S-1 is still open**; it needs the Steam check Bailey schedules)
- **Our estimate:** which turns each painting covers. The research names the stages, not their turns.
- The frames show turns 2, 5, 8, 10 and 12.
- The Gaze counter, the Armored note and the party numbers are illustrative, as in round 1.

## How it was made (rule 8: original art only)

- **Written sources only:**
  - `research/ffx-sin.md` §5.4, §9.1, §9.3
  - `research/ffx-evrae-airship.md` §12.1, §12.3
  - the FF Wiki *Sin* Appearance text from round 1 (revid 4045228)
  - No character or franchise tag names the creature in any prompt.
- **No retail image anywhere.** None was used as input, reference or IP-Adapter. The only image inputs are our
  sketches and our own renders.
- **Sketches:** `src/sketch.py` draws one sketch per stage, with the lower jaw at 0, 6, 12, 18 and 24 degrees
  about its hinge. Every other pixel is the same in all five sketches. Some helpers are adapted from the
  uncommitted round-1 repair sketcher (`../head-pilot/src/r2/sketch2.py`), which was read and not changed.
- **Stage 0 (shut):**
  - Engine: z-image turbo img2img from sketch 0, then a RealESRGAN x4 detail pass at 2352 × 1344 (denoise 0.30).
  - Pass 1 (`run1.sh`) gave a smooth humpback. Pass 2 (`run2.sh`) used rock-armour words.
  - **Pick: `s0/c3`** at denoise 0.66: rock plates, jaws shut, claw and tower clear.
- **Stages 1 to 4** (`run3.sh`; `run4.sh` is a second seed):
  - `src/stages.py prep` pastes sketch k into the stage-0 painting only where sketch k differs from sketch 0.
  - `src/gen.py mouth` repaints inside that mask (denoise 0.62, one seed for all stages), then runs a masked detail
    pass at full size.
  - `src/stages.py blend` sets the result back into the stage-0 painting. Outside the mouth, every pixel is stage
    0's own; 7 to 12 % of the picture changes.
  - Seed a was picked for all four stages. Seed b grew gold rings and machine parts.
- **Deck dressing** (`src/dress.py`, the same pixels on all five stages):
  - The words are in our own type (Chakra Petch, OFL, from `public/fonts`), worn like stencil paint and set in
    perspective.
  - The dial ring spells "Wind bless you" in the Al Bhed letter swap, written in Latin letters (FEHT PMACC OUI).
    The script's own glyphs are a retail design and are not copied.
  - The swap table is not in `research/` yet, so the dial text is **our estimate**.
- **The Evrae backdrop was not used as a base.** The installed `evrae-airship-deck` shows the hull from below the
  rail, not a walkable deck plate, so the sketch draws the deck.
- **GPU:**
  - ComfyUI was shared with the FF7 job.
  - Every submit waited until fewer than 3 prompts were pending, and ComfyUI was never restarted.
  - No render came out black: 8 stage-0 renders, 2 stage-4 strength tests and 8 stage renders.

## Faults left for one repair pass (if Bailey picks this head)

- The head still reads as an armoured humpback. The pick is the most rock-like of eight renders.
- Rows of rivet-like dots near the jaw corner in stages 1 to 3 hint at machinery.
- Stage 4's throat has vertical, curtain-like folds.
- The lower jaw's plates are paler than the skull and change a little from stage to stage.
- The snout tip is pink in stages 0 and 1.
- On desktop, the party HUD covers half of the "SALVAGE DREAM" lettering and the dial. The phone frame shows the
  dial.

## Questions for Bailey

1. Is this the head, or should it move further from a whale?
2. Do five stages (shut, three open, fully open) read as the clock?

After a pick:
1. Record liked, disliked, must remain, must change and undecided in the tile's `reaction` (rule 15).
2. Do the repair pass above.
3. Paint the approach (turns 1 to 3), Gaze and defeat states.

## Candidates

Full size, raw, with provenance: `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round2/`

- `sketches/sketch-s0..s4.png`
- `s0/<a1..c4>.{base,full}.png` and `.prov.json`
- `stages/comp-s<k>.png`, `mask-s<k>[-full].png`, `m<k>-<a|b>.{base,full,blend}.png` and `.prov.json`
- `final/stage-0..4.png` (dressed, 2352 × 1344) and `.jpg` copies

## Re-render (from the repo root)

```
python docs/concepts/chapters/sin-2026-09-27/head-round2/src/sketch.py D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round2/sketches
docs/concepts/chapters/sin-2026-09-27/head-round2/src/run1.sh ... run4.sh        # ComfyUI; the GPU rules above
python docs/concepts/chapters/sin-2026-09-27/head-round2/src/dress.py <in.png> <out.png>
python docs/concepts/chapters/sin-2026-09-27/head-round2/src/images.py
PYREFLY_BROWSER=gpu node docs/concepts/chapters/sin-2026-09-27/head-round2/src/render.mjs frames
PYREFLY_BROWSER=gpu node docs/concepts/chapters/sin-2026-09-27/head-round2/src/render.mjs sheets
```

`stages.py prep` runs before `run3.sh`, and `stages.py blend` runs inside it.
