# Ixion at Djose: the Chamber and the Abyss, two painted options each (2026-09-27)

**These are options. Bailey has not picked one.** Nothing under `src/`, `tests/`, `critic/` or
`docs/target/` was touched, and `public/art/` was not touched either. The paintings are in the candidates folder (below).
They are for concept A "The Horn and the Hole" (D-265): the fight in the Chamber of the Fayth
with the hole in view, and the short Abyss cutscene after the fall. A pick approves only the
parts Bailey names (AGENTS.md rule 15).

**Game case (rule 14): FFX-2 only.** These are the Chapter 3 Djose Chamber and the Farplane Abyss. No FFX
chapter is affected.

**Original art only (rule 8).** Local ComfyUI, Animagine XL 4.0 Opt, the same graph and settings as
the house backdrops (`tools/gen/comfy.mjs backdrop`: 1344x768, 30 steps, cfg 6, euler_ancestral,
RealESRGAN 4x then 0.5, giving 2688x1536). The prompts come from the written descriptions only. No retail image was
viewed or used.

## Phone sheet (read in order; each part 1080 px wide, under 2000 px tall, under 1 MB)

1. `sheet/part-1-overview.jpg`: the four plates, the recommendation and the question
2. `sheet/part-2-c1.jpg`: Chamber C1 as a battle frame (desktop and phone) with notes
3. `sheet/part-3-c2.jpg`: Chamber C2
4. `sheet/part-4-a1.jpg`: Abyss A1 as a cutscene frame (desktop and phone)
5. `sheet/part-5-a2.jpg`: Abyss A2

Frames: `frames/<option>-1600.jpg` (1600x900) and `frames/<option>-phone-390.jpg` (390x844).
The battle frames use Ixion look B (`public/art/characters/x2-ixion/idle.png`, D-268) and the FFX-2
party from the concept rounds (Yuna White Mage, Rikku and Paine Dark Knight), with a greybox of the
FFX-2 HUD that shows positions only. The cutscene frames use Yuna Songstress (research 7.2 step 2) and
Shuyin (approved idle). The caption line shows position only: the Abyss dialogue is unsourced (IX-13)
and is written separately.

## The full-size plates (2688x1536 PNG, each with a JSON sidecar: seed, prompt, negative, settings, init)

Folder: `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ixion-scenes/`

| Option | File | Made from | What it shows |
|---|---|---|---|
| **C1 Storm-lit stone** | `chamber-c1.png` (= `raw-c1i60-9114.png`) | txt2img seed 9101, the hole painted in by `scripts/hole_init.py`, then img2img at 0.60 with seed 9114 | An eye-level stone nave. The statue is gone and a torn hole sits in the middle of the floor, with broken slabs around its lip. A thread of lightning falls into it. The palette is cold slate and violet. |
| **C2 The Faction's lamps** | `chamber-c2.png` (= `raw-c2v3i9223-9241.png`) | txt2img seed 9223 (option `c2v3`), the hole and three lamps painted in, then img2img at 0.55 with seed 9241 | A round chamber seen from a little above. The floor is torn open over a dark shaft with a pale glow far down, and amber lamp boxes stand on the stone. |
| **A1 White void** | `abyss-a1.png` (= `raw-a2-9411.png`) | txt2img seed 9411 (the `a2` prompt, which came back pale), with no hand work | A pale grey-white void. The floor is made of pale floating slabs, and large shards drift overhead. |
| **A2 Deep abyss** | `abyss-a2.png` (= `raw-a2i9413-9422.png`) | seed 9413 regraded to blue by hand, then img2img at 0.50 with seed 9422 | Deep blue, with pale light rising from below. There is one slab of stone to stand or kneel on, and crystal shards drift around it. |

Every other render in that folder (`raw-*.png` with its `-peek.jpg` and `.json`) is an unpicked
seed, kept for the record. The folder also holds `init-*.png` (the hand-laid inits) and `peek-*.jpg`
(the contact sheets I looked at). Nothing was deleted.

## What the sources say, and what is ours

- **The Chamber** (research `ffx2-ixion-djose.md` 6.1) `[verified: 3 sources]`:
  - The wiki's Djose Temple page gives "a deep hole in the middle of the Chamber of the Fayth where the fayth statue used to be".
  - The wiki's Chamber of the Fayth page says the statues were torn out and the tunnels lead to the Farplane.
  - FFExodus says the fayth had been "ripped out".
  - Machine Faction equipment sits in a trashed temple (FFExodus, bremen, Blackestmage) `[verified: 3 sources]`.
  - **Ours:** the room's shape (a nave for C1, a round room for C2), the lightning inside the Chamber (lightning is Djose's element, and the wiki describes the temple's lightning-held shell), and reading the Faction gear as lamps.
- **The Abyss** (research 7.2):
  - Yuna "falls through a white void" into a beautiful, strange place (step 1) `[verified: 4 sources]`.
  - Fog (step 3).
  - Shuyin goes "deeper into the Farplane" (step 8).
  - Yuna is alone and kneels (step 10).
  - The whistle's light leads her out (step 11).
  - **Ours:** the shards, the slabs, and A2's blue.
- The research warns that the Abyss must not read as the Chapter 5 Farplane, which is the lavender flower field in `public/art/backdrops/farplane.png`. Neither option does.

## How it was made, and what went wrong on the way

`scripts/render_scenes.py` is its own small ComfyUI client. It builds the same graph as
`comfy.mjs backdrop` and deliberately does not use `comfy.mjs`, because that script can restart ComfyUI
after a black frame, and this run was not allowed to restart the shared server. The script submits
only while the shared queue is empty. It stops on an all-black render; none came back black, and the
maximum RGB was 242 or higher on every render.

- The shipped house prompts use escaped parentheses (`\(...:1.3\)`), so their weights are literal text.
  The first round copied them, and two of the subjects failed:
  - no Chamber render had a hole;
  - the first C2 prompt came back as a bare warehouse;
  - the first A1 prompt came back dark;
  - the first A2 prompt came back as an open sky full of bubbles.
- The second round used real weights. It overshot:
  - C2 came back as a gothic cathedral with stained glass;
  - A1 came back as abstract white strokes, then as a snowy cliff.
- The checkpoint will not paint a hole in a floor from words. The hole is therefore laid in by hand on
  a good base render (`scripts/hole_init.py`: a jagged dark ellipse, a broken lip, rubble and mist), and
  an img2img pass then repaints it in the house finish:
  - at 0.50 the ring stays too clean;
  - at 0.60 it tears (C1);
  - on the round-chamber base (9105) the hole flattened into a dark mound in every pass.
- 48 renders in total, about 38 s each.

I looked at every render (contact sheets `peek-*.jpg` in the candidates folder), then at each plate
at 1344 px, then at every frame at full size.

## Recommendation: C1 (Storm-lit stone) with A1 (White void)

**C1:**
- It matches the finish of the shipped FFX-2 plates: eye-level and symmetric, like Via Infinito and the Bevelle Underground.
- On its dark stone, both the party and the violet Ixion read clearly.
- The lightning points at the hole, so the fall has its stage from the first frame of the fight.
- Weak spot: the hole is modest, and the floor fills only the bottom quarter of the picture. In the frame, Ixion stands at the hole's right rim so that the hole stays visible between him and the party.

**A1:**
- It is the sources' own "white void".
- It cannot be mistaken for the Chapter 5 Farplane.
- The drifting shards say that she fell into something broken.

**Second choices:**
- C2, if the hole must be unmistakable at phone size. It is the clearest stage for the fall, but its finish is plainer and its high angle differs from every other FFX-2 battle plate.
- A2, if the whistle beat needs a darker stage for its yellow light.

`[estimate]`: this recommendation is an agent's judgement, not a sourced fact.

**Provisional install, for the chapter build (rule 9):** until Bailey picks, the recommended pair can
go in under keys that say what they are, for example:
- `public/art/backdrops/djose-chamber.png`, copied from `chamber-c1.png`, keeping its sidecar;
- `public/art/backdrops/farplane-abyss.png`, copied from `abyss-a1.png`.

Each chapter reference then names the key in one place, so a swap to C2 or A2 is a one-line change
plus a file copy. Mark both as `OPTION (provisional, awaiting Bailey's pick)` in their sidecars.

## What Bailey is asked

One Chamber (C1 or C2) and one Abyss (A1 or A2), or a mix; name the parts you want.

## Rebuild

From the repo root:

```
python docs/concepts/chapters/ixion-djose-2026-09-27/scenes/scripts/render_scenes.py <option> <seed>... [--init <png> --denoise <d> --tag <t>]
python docs/concepts/chapters/ixion-djose-2026-09-27/scenes/scripts/hole_init.py <base.png> <out.png> <cx> <cy> <rx> <ry> [lamp x,y,h ...]
python docs/concepts/chapters/ixion-djose-2026-09-27/scenes/scripts/scenes_frames.py
python docs/concepts/chapters/ixion-djose-2026-09-27/scenes/scripts/scenes_sheet.py
```

The frame and sheet scripts reuse the concept round's `scripts/frames.py` and the look round's
`look/scripts/look_frames.py` and `look_sheet.py`. They read the local `public/art` paintings and the candidates folder.
