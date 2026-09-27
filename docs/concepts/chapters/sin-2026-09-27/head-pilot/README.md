# Overdrive Sin's head: painted pilot, four options (FFX only, 2026-09-27)

Bailey, 2026-09-27: "all your recommendations". For Sin, that means concept A (the whole assault) reached
through concept B, and the first step of that is **a painted pilot of Sin's head**. This folder is that
pilot. **These are options, not approved art.** Nothing is installed in `public/art/`, nothing is wired,
and nothing is listed on the end-state board (rule 9). The picks and the recommendation are an agent's
look. Bailey picks.

**Game case: FFX only** (rule 14). Link IV, Overdrive Sin, is fought from the *Fahrenheit*'s deck over
Bevelle. It has CTB turn order, aeons, and a turn clock that ends in a scripted Game Over. None of this has
an FFX-2 counterpart (`research/ffx-sin.md` §0.3).

## Read on a phone, in this order

| File | What |
|---|---|
| `part-1.jpg` | The four options in one line each, the recommendation, and two questions for Bailey |
| `part-2.jpg` to `part-5.jpg` | Options A to D: the 1600 × 900 frame, the 390 × 844 phone frame, strengths and faults. Part 4 (C) adds the mouth-stage strip |
| `part-6.jpg` | Method, sources, our layout sketches, and every render of the round with its verdict |
| `frames/frame-<A-D>-1600.jpg`, `frames/frame-<A-D>-390.jpg` | The rough battle frames at full size (the phone frame is rendered at 2x) |
| `frames/paintings.jpg`, `stages-C.jpg`, `renders.jpg`, `sketches.jpg` | The picked paintings uncropped, C's clock, all 15 renders, the sketches |
| `src/` | Everything that made this. See "Re-render" below |

Each part is a 1080-px-wide JPEG under 1 MB.

## The options

| | Look | Pick | Clock (the mouth) | Faults |
|---|---|---|---|---|
| A | Dusk leviathan, head-on, wings spread, sunset | `A/p2` | The best read: a wide violet grin in the middle of the frame | Six eyes (no source gives a count). More demon than whale. The city behind the rail glows like lava |
| B | The maw fills the sky, an extreme close-up | `B/p5` | The biggest band, but no face | No eyes, so Gaze has no face to come from. The deck became a trestle. Five renders to get one |
| **C** | **Three-quarter on the tower, the whale-like head turned towards the ship, golden hour** | **`C/p2`** | **A jaw drop, shown in five stages derived from the one painting** | No wings. The tower under it is unclear. On desktop the CTB column covers the back of the jaw |
| D | Backlit silhouette against the setting sun | `D/p3` | A violet grin and red eyes as the only lights | A thin vertical beam through the head needs painting out. The scales are lost in the silhouette |

## Recommendation: C (an agent's look)

- **Most faithful to the written description.** It is whale-like and scaled, and it reads as a colossus over
  the white city.
- **It passed the clock test.** Sin's mouth opens in stages until fully open (§9.3, wiki gallery,
  `[single source]`). The lower jaw was cut out, turned about its hinge and healed, which gave five stages
  (0 shut to 4 fully open). Only the jaw area, about 10 % of the picture, took new pixels (see
  `frames/stages-C.jpg`), so the creature stays one creature across the clock. This is the same in-place
  method as Evrae's breath.
- **Add the wings in production.** The sources say Sin sprouts wings and props itself on a tower before
  this fight (§9.1, Auronlu). C has neither clearly, and A and D do.
- **A is the runner-up** if Bailey wants the face square to the camera.
- **Proposals that need a yes (rule 10, our estimate):**
  - Use B's crop as a camera push for the last turns instead of a new painting.
  - Use D's backlight as the Gaze or defeat lighting state of the pick.

**Faults of the C stages**, left for one repair pass on the pick:
- In stages 0 and 1 the turned jaw leaves a pale fringe of teeth under the top row.
- Stage 0 keeps a sliver under the chin.
- The back of the mouth never fully shuts.
- Stage 4 grew a small tusk at the tip.

## Two questions for Bailey

1. Pick a look, or mix them. Say what you like in each; a pick approves only what you name.
2. Are the wings a must?

After the pick:
1. Record liked, disliked, must remain, must change and undecided in the tile's `reaction` (rule 15).
2. One repair pass on the pick.
3. Paint the other head states: approach far, mid and near, Gaze and defeat.
4. Bench link IV at human speed with the Garden of Pain party.

## What the frames show (rough, not the HUD build)

- **The painting**, full frame. The party stands on the painted deck: Tidus, Yuna and Auron, the Garden of
  Pain opening line-up Bailey picked, as our own idle sprites.
- **A stand-in for the FFX HUD** in the game's own fonts, laid out like the desktop and phone builds
  (`docs/screenshots/phone-battle-hud/`).
- **Numbers** from `research/ffx-sin.md` with their tags:
  - Sin's turns 1 to 3 are "Drawn to Sin." (5 sources). Turns 4 to 12 are in reach.
  - Giga-Graviton comes on turn 13. That is **our default; S-1 is open (12 or 13)** and needs a Steam check
    only Bailey can schedule.
  - Gaze comes after six targetings.
  - The head is Armored, so a plain hit lands at a third.
- **HP and MP maxima** come from `src/data/ffx/builds/dreams-end.ts`: the Garden of Pain party with Yuna's
  Tetra Ring back, which is S-29, our estimate. Every stat cell there is `[estimate]`.
- **The current values**, the clock at Sin's turn 7 and "mouth stage 2 of 3" are illustrative.
- **Sin's turn-order icon** is a crop of the same painting.

## How it was made (rule 8: original art only)

- **Written sources only:**
  - `research/ffx-sin.md` §9.1 and §9.3.
  - The FF Wiki article *Sin (Final Fantasy X)*, Appearance section, revid 4045228, read as text through
    the MediaWiki API on 2026-09-27. It gives a whale-like body, clawed arms, scales, part of a city carried
    near the back of the head, and feathery wing-like protrusions that are purple at the tips.
  - No character tag for Sin was used in any prompt.
- **No retail image anywhere.** None was used as input, reference or IP-Adapter. The only image input is
  our own flat-colour layout sketches, drawn in code (`src/sketch.py`, `frames/sketches.jpg`).
- **Pipeline.** `src/gen.py` is copied from the FF7 hi-fi round. The checkpoint is animagine-xl-4.0-opt,
  the one behind the installed FFX paintings, with the Evrae deck's backdrop words. Each render is sketch
  img2img at 0.70 to 0.82, then a RealESRGAN x4 detail pass re-rendered at 1.75x (2352 × 1344) with
  denoise 0.35.
- **Five passes**, each after looking at the last (`src/run1.sh` to `src/run5.sh`). Every render has a
  `.prov.json` with its seed, strengths, prompt and source sketch.
- **GPU.** ComfyUI was shared with the FF7 job. Prompts were submitted only while fewer than 3 were pending,
  ComfyUI was never restarted, and no render came out black.
- **Candidates** (full size, raw, provenance) are in
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/`:
  - `<A-D>/p<n>.{base,full}.png` and `.prov.json`
  - `sketches/`
  - `C/stages/C-m<k>.{edit,mask,base,full}.png`, plus the blended `C-m<k>.png`

## Re-render (from the repo root)

```
python docs/concepts/chapters/sin-2026-09-27/head-pilot/src/sketch.py <out_dir> all 2    # sketches
python docs/concepts/chapters/sin-2026-09-27/head-pilot/src/images.py                     # supporting images
node docs/concepts/chapters/sin-2026-09-27/head-pilot/src/render.mjs A B C D              # frames (picks.json)
node docs/concepts/chapters/sin-2026-09-27/head-pilot/src/render.mjs sheets               # part-1..6.jpg
```

The renders themselves are `src/run1.sh` to `src/run5.sh`. They need ComfyUI and follow the GPU rules
above. The mouth stages come from `src/stages.py edit`, then the heal in `run4.sh` and `run5.sh`, then
`src/stages.py blend`.
