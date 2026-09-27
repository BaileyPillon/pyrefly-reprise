# Overdrive Sin's head, round 3: a layered rig, one moving jaw (FFX only, 2026-09-27)

Rounds 1 (`../head-pilot/`) and 2 (`../head-round2/`) failed an adversarial judge, and the same issue stayed open
both times. So AGENTS.md rule 15 applies: this round starts with a written method check,
[METHOD-CHECK.md](METHOD-CHECK.md), and **changes the method**.
- Sin is painted **once**, with the mouth fully open.
- That painting is cut into layers.
- Each clock stage is the same layers with **only the lower jaw turned about its hinge**.

**This is an option, not approved art.** Nothing is installed in `public/art/` and nothing is wired. Nothing is on
the end-state board, and `approved-hashes.json` is untouched. The Sin head stays open until Bailey picks (rule 9).

**Game case: FFX only** (rule 14). Link IV, Overdrive Sin, is fought from the *Fahrenheit*'s deck over Bevelle. It
has CTB turn order and a turn clock that ends in a scripted Game Over. FFX-2 has no counterpart
(`research/ffx-sin.md` §0.3).

## Read on a phone, in this order

| File | What |
|---|---|
| `part-1.jpg` | The stage-4 frame, and the judge's round-2 faults beside round 3 |
| `part-2.jpg` | The method check: test A against test B, and the choice |
| `part-3.jpg` | The clock: five stages from one jaw, the turns each covers, the phone-size strip |
| `part-4.jpg`, `part-5.jpg` | The 1600 × 900 battle frames for stages 0 to 4, and the deck |
| `part-6.jpg` | The five 390 × 844 phone frames |
| `part-7.jpg` | The rig's layers, and our sketches with the rig run on them |
| `part-8.jpg` | Every render with its verdict, the faults left, and two questions for Bailey |
| `frames/` | Full-size frames (`frame-s<k>-1600.jpg`, `frame-s<k>-390.jpg`, the phone at 2x), the sheet images, and `identity.json` |
| `src/` | Everything that made this. See "Re-render" below |

Each part is a 1080-px-wide JPEG under 1 MB.

## Result against the brief

| The brief asked for | Round 3 |
|---|---|
| A readable tall white Bevelle tower, fully in frame, under the claw | A slender white tower with gold bands runs from the claw on its round top down to the rail (plate `p6`) |
| Wings with a clear root on both sides, opaque | Two opaque, purple-tipped feathered wings. The near wing clearly rises from its shoulder. The far wing's root sits behind the shoulder: see "Faults left" |
| No buildings on Sin | None, in the sketch, the words or the paint |
| An organic throat (no ladders, banners or curtains) | Dark wet flesh: the painting's own interior colours with the streaks smoothed out (`repair.py throat`) |
| No pink snout | The snout is the head's grey. A warm band at its tip was greyed (`repair.py mend`) |
| The deck identical in every stage, as its own fixed layer | `L4-deck` is cut from the plate and laid over everything. **0 deck pixels differ between any two stages** (`frames/identity.json`) |
| The head's surface identical between stages | By construction. Stages 0 to 3 differ from stage 4 only in the jaw's path (**4.7 %** of the picture at most) |
| Five clock stages (shut, 1, 2, 3, fully open) that read apart at phone scale | The jaw turns 0, 6.5, 13, 19.5 and 26 degrees. The gap at the snout on a 390-px phone is about 0 (lips together), 15, 35, 55 and 74 CSS px (`frames/phone-scale.jpg`) |
| 1600 × 900 and 390 × 844 frames per stage, the party on the deck, a stand-in FFX HUD whose clock label matches | `frames/frame-s0..4-{1600,390}.jpg`. The HUD's mouth meter and label name the stage shown |

## The clock (research/ffx-sin.md §5.4, §9.3)

| Stage | Jaw open | Sin's turns (default: Giga-Graviton on 13) | If S-1 settles on 12 |
|---|---|---|---|
| 0 SHUT | 0° | 1–3, "Drawn to Sin." `[verified: 5 sources]` | 1–3 |
| 1 OPEN 1 | 6.5° | 4–6 | 4–6 |
| 2 OPEN 2 | 13° | 7–9 | 7–8 |
| 3 OPEN 3 | 19.5° | 10–11 | 9–10 |
| 4 FULLY OPEN | 26° | 12, then Giga-Graviton on 13 | 11, then Giga-Graviton on 12 |

**Sourced:**
- the three pulls
- the mouth opening in stages from turn 4
- three open stages and "fully open"
- Giga-Graviton on turn 12 or 13 (**S-1 is still open** until the Steam check Bailey schedules)

**Our estimate:** which turns each stage covers, and the angles.

The Gaze counter, the Armored note and the party numbers are illustrative, as in rounds 1 and 2.

## The rig (what the engine would do)

`src/rig.py` writes these layers into `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3/final/rig/`,
back to front:

| Layer | What | Moves? |
|---|---|---|
| `L0-plate` | Sky, Bevelle, the white tower | no |
| `L1-throat` | The mouth interior. Each stage shows it only inside the mouth as it is at that stage: between the upper lip and the turned lower lip | no (its mask follows the jaw) |
| `L1b-hinge` | The jaw's own rear pixels near the hinge, so closing never opens a notch of sky under the cheek | no |
| `L2-jaw` | The lower jaw with its teeth | **turned clockwise (chin up) about the hinge (1612, 471) by 26 × (1 − k/4) degrees at stage k** |
| `L3-top` | Skull, upper jaw, cheek, neck, arm, claw, both wings | no |
| `L4-deck` | The *Fahrenheit*'s deck and rails, dressed once | no |

`rig-out.json` holds the hinge and the angles. Every layer's alpha comes from the painting itself. The creature is
wherever the creature painting differs from the plate, split along our sketch's jaw, mouth and head lines. Stray
specks that would ride along with the jaw are dropped.

## How it was made (rule 8: original art only)

**Written sources only:**
- `research/ffx-sin.md` §5.4, §9.1, §9.3
- `research/ffx-evrae-airship.md` §12.1, §12.3
- No character or franchise tag names the creature in any prompt.

**No retail image anywhere.** None was used as input, reference, IP-Adapter or trace. The image inputs are our
code-drawn sketches (`src/sketch.py`) and our own renders.

**Engine and detail pass.** The engine is z-image turbo. The detail pass is RealESRGAN ×4 to 2352 × 1344, then a
re-render at denoise 0.25 to 0.30 (`src/gen.py`, copied from round 2).

1. **The plate** (`run1.sh` to `run3.sh`, six renders):
   - Sketch img2img, with no creature in the sketch.
   - The tower kept growing above the claw's place until the words put its top on the horizon and the strength
     came down.
   - **Pick: `p6`** at 0.46.
   - The creature sketch was then moved 24 px up so the claw lands on p6's tower top. `sketches/v1/` keeps the
     sketch p6 was painted from.
2. **The creature** (`run4.sh` to `run6.sh`, seven renders):
   - `prep.py` pastes the sketch into the plate inside the creature's silhouette.
   - `gen.py mouth` repaints only inside that mask.
   - **Pick: `b1`** at 0.62, with the v2 words: no "armour", and the hide described as a weathered cliff.
3. **One-time repairs on b1.** Because every layer is shared, a repair made here holds in all five stages:
   - The near wing: a masked repaint (`run7.sh`, wing part) turned a pipe-like rod into feathers. **Kept.**
   - The cheek loop and cog: three repaints (`run7.sh` cheek part, `run8.sh`, `run9.sh`) each grew new wires,
     cords or pearls. **All dropped.** Those spots, and a strap the wing repaint left, were mended instead with
     the painting's **own** nearby scales (`repair.py mend`: two clones and a local grey-out).
   - The snout tip's warm band was greyed.
   - The throat was smoothed from its own colours (`repair.py throat`).
4. **The deck** is dressed once on the plate (`dress.py`, positions moved for p6):
   - "SALVAGE DREAM" and "CID" in our own type (Chakra Petch, OFL).
   - The dial ring reads FEHT PMACC OUI, "Wind bless you" in the Al Bhed letter swap written in Latin letters.
     The script's own glyphs are not copied. The swap table is not in `research/` yet, so this is **our estimate**.
5. **The rig** (`rig.py layers`, shut angle 26, fitted by eye) builds the five stages.
6. **The frames and the sheet** come from one headless Playwright run (`render.mjs all`, `PYREFLY_BROWSER=gpu`) of
   `frame.html` (round 2's stand-in HUD) and `sheet.html`.

**GPU (Bailey, 2026-09-27: "resume local art generation dont lag out my computer too bad though"):**
- ComfyUI was shared with the FF7 job.
- `gen.py` submitted only while nothing was pending (at most one prompt running), one prompt at a time, with batch
  size 1.
- ComfyUI was never restarted.
- 18 jobs ran in all: 6 plates, 7 creatures, 4 repairs and 1 method test (test B). **No render came out black.**
- Python image work was single-process. No dev server was started.

## Faults left (an agent's look)

- **Stage 0 still shows teeth.** The jaws meet, but the interlocked fangs and a thin red gum line show. Hiding the
  teeth completely would need the upper fangs moved onto the skull layer.
- **The hide reads more like rounded river stones** than cliff rock.
- **Small white glints** are sprinkled over the head.
- **The far wing's root sits behind the shoulder**, so it reads less clearly than the near wing's root. On desktop
  the turn-order column covers most of that wing.
- **The arm** from the chest to the tower top **is short**.
- **A faint dark line** stays on the shoulder where the strap was greyed out.

## Questions for Bailey

1. Does the jaw-on-a-hinge clock read, from shut to fully open?
2. Is this the head, or should it move further from a whale, or further from stone?

After a pick:
1. Record liked, disliked, must remain, must change and undecided in the tile's `reaction` (rule 15).
2. Repair only the static layers named above. Each repair is made once.
3. Paint the approach (turns 1 to 3), Gaze and defeat states as further layers or light states on the same rig.

## Candidates

Full size, raw, with provenance (`.prov.json` for every render):
`D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3/`
- `method-test/`: test A (`rig-s0..4.png`) and test B (`b-s2-040.*`, `b-mask*.png`)
- `sketches/`: `sketch-plate`, `sketch-sin`, `sketch-shut`, `rig.json`, `v1/`, and `rigtest/` (the rig run on the
  sketches)
- `plate/p1..p6.{base,full}.png`
- `sin/a1, a2, b1..b5.{base,full}.png`, `comp-sin.png`, `mask-sin*.png`
- `fix/`: repair masks and renders, `b1-w.png` (the wing kept), `b1-wm.png` (mended), `b1-final.png` (the throat
  smoothed)
- `final/`: `plate-dressed.png`, `stage-0..4.jpg`, and `rig/` (layers `L0`–`L4`, `stage-0..4.png`, `rig-out.json`)

## Re-render (from the repo root; `src/` scripts, GPU rules above)

```
python src/sketch.py <cand>/sketches                          # sketches + rig.json
src/run1.sh; src/run2.sh; src/run3.sh                         # plates (ComfyUI)
python src/prep.py <cand>/plate/p6 <cand>/sketches <cand>/sin
src/run4.sh; src/run5.sh; src/run6.sh                         # creature (ComfyUI)
python src/repair.py mask wing <cand>/fix; src/run7.sh        # wing repair (its cheek half was dropped)
python src/repair.py mend <cand>/fix/b1-w.png <cand>/fix/b1-wm.png
python src/repair.py throat <cand>/fix/b1-wm.png <cand>/sketches/rig.json <cand>/fix/b1-final.png
python src/dress.py <cand>/plate/p6.full.png <cand>/final/plate-dressed.png
python src/rig.py layers <cand>/plate/p6.full.png <cand>/fix/b1-final.png <cand>/sketches/rig.json <cand>/final/rig 14 26 <cand>/final/plate-dressed.png <cand>/sin/mask-sin-full.png
python src/images.py
PYREFLY_BROWSER=gpu node src/render.mjs all
```

Here `<cand>` is the candidates folder and `src/` is this folder's `src/`. `run8.sh` and `run9.sh` are the dropped
cheek repairs, kept for the record. `method_test.py` is the method check.
