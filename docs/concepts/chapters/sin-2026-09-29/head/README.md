# Sin's head, options for the morning pick: C repaired, and A head-on (FFX only, 2026-09-29)

Bailey, 2026-09-28 ~22:00 EDT: "all your recommendations", then "please work on implementing all remaining chapters
that we decided upon". For Sin's head that means: finish the recommended option C (round 3's layered rig) with its
repair list, and paint one head-on alternative from option A.

**These are options, not approved art.** Nothing is installed in `public/art/`, nothing is wired, and nothing is on the
end-state board (rule 9). The recommendation is an agent's look; Bailey picks.

**Game case: FFX only** (rule 14). Link IV, Overdrive Sin, is fought from the *Fahrenheit*'s deck above Bevelle, with
CTB turn order and a turn clock that ends in a scripted Game Over. FFX-2 has no counterpart (`research/ffx-sin.md` §0.3).

This folder is the head part of `../options.html`, the morning sheet. `section.html` is the head section, embedded into
that page as it is. `frames/` holds the full-size frames.

## The two options

| | Look | Clock | Recommendation |
|---|---|---|---|
| **C, repaired** | Round 3's three-quarter head, whale-like and scaled, turned to the ship, with purple-tipped feathered wings and the claw on the white tower | The lower jaw turns about its hinge. Stage 0 is shut; stages 1 to 3 open; stage 4 is fully open | **Recommended**: the most faithful to the words, and it is the head Bailey saw in round 3, now with its four faults fixed |
| A, head-on | Option A's face square to the ship, wings spread wide, the claw on the tower | The lower jaw moves straight up: our stand-in for a turn seen from the front | The runner-up if Bailey wants the face square to the camera |

Both are layered rigs. Each head is painted once with the mouth fully open and cut into layers (plate, throat, jaw,
top, deck), and only the jaw moves. So the five stages are the same creature, pixel for pixel, outside the jaw's path.

## C: the repair list (each fix made once, so it holds in every stage)

| Fault (round 1 and round 3 lists) | Fix | How |
|---|---|---|
| **The stage-4 tusk**: a pair of oversized curved fangs and a dark machine-like ring at the chin | A row of even small teeth, a rounded chin | Our own paint-over of a 272 × 155 crop, blended by a masked pass at 0.42 (`repair.py tusk-*`). The interior streaks the pass left were smoothed from the interior's own pixels |
| **The back of the mouth never shut**: a violet strip of mouth interior sat under the painted upper lip, in the static top layer, from the snout to the hinge | At stage 0, one dark seam with the fangs over it | The painted lip sits 15 to 20 px above our sketch's line. At stage 0 only, the violet pixels in that band are darkened to a neutral shadow seam (`repair.py lip-seam`). In the engine this is a static mask shown while the mouth is shut |
| **The pale teeth fringe**: lower teeth showed under the top row at stage 0 | Gone | The turned jaw is clipped under the skull's lower edge, found per column (`clip.png`) |
| **The chin sliver**: a faint outline of the open jaw's underside stayed in the top layer, and the jaw's edge carried sky pixels | Gone | Nothing static may sit more than a fang's length below the upper lip in front of the hinge. The jaw's soft edge is recoloured from its own opaque pixels |
| Also (round 3's own list): small white glints over the head | Gone | Small bright specks on the creature are replaced by their surroundings; the eye and the teeth are excluded (`repair.py glints`) |

Stages 1 to 4 use round 3's angles unchanged: 19.5, 13, 6.5 and 0 degrees turned back. Stage 0 uses 26.

## Faults left (an agent's look)

- **C:**
  - The hide reads more like rounded river stones than cliff rock.
  - The far wing's root sits behind the shoulder, and on desktop the turn-order column covers most of that wing.
  - The repaired chin is a little square up close.
  - The stage-0 seam is a painted-over shadow line. It reads as shut at frame size, but it is flatter than the rest.
- **A:**
  - It reads more like a stone boulder than a whale.
  - The straight-up jaw flattens the face at stage 0.
  - The small eyes sit at the edges.
  - On desktop the right wing and the claw sit under the turn-order column.
  - A thin soft fringe shows under the lifted jaw at stage 2.

## Two questions for Bailey

1. C or A, or a mix? A pick approves only what you name.
2. Does the dark seam read as shut enough at stage 0?

After a pick:
1. Record liked, disliked, must remain, must change and undecided in the tile's `reaction` (rule 15).
2. Paint the approach (turns 1 to 3), Gaze and defeat as light states or layers on the same rig.

## How it was made (rule 8: original art only)

- **Written sources only:**
  - `research/ffx-sin.md` §5.4, §9.1, §9.3.
  - FF Wiki text, read through the MediaWiki API as text on 2026-09-28/29: "Sin (Final Fantasy X)" Appearance (whale-like
    body, clawed arms, scales, feathery wing-like protrusions that are purple at the tips), and "Sin (head)", revid
    4004207 (three turns of approach, then nine turns of the mouth opening).
  - No character, game or franchise name for the creature appears in any prompt.
- **No retail image anywhere.** None was used as input, reference or IP-Adapter. The image inputs are our code-drawn
  sketches (`src/sketch.py`, which draws head A) and our own paintings (round 3's master `b1-final` and plate `p6`).
- **Engine:** z-image turbo (round 3's `gen.py`, with a new `patch` mode for small crops painted at full detail).
- **Our estimates:** which turns each stage covers; the jaw angles and lift; A's eye count (no source gives one); the
  deck lettering and dial (round 3's).
- **The frames:**
  - The HUD numbers follow round 3: Giga-Graviton on turn 13 is our default (S-1: 12 or 13).
  - The party is the Garden of Pain line-up with Yuna's Tetra Ring back (S-29, `dreams-end.ts`, every stat cell `[estimate]`).
  - The current values, the clock position and the Gaze counter are illustrative.

### Every render, with its verdict (GPU: 14 jobs, none black)

ComfyUI was down after the PC restarted at about 23:24 EDT. It was started through the scheduled task `PyreflyComfyUI`
and never restarted after that. Every job was submitted only while fewer than 3 prompts were queued in total, one at a
time, batch size 1.

| Job | Strength | Verdict |
|---|---|---|
| `head-c/tusk-1` | 0.62 | Kept a big central fang, and the chin became pebbles with sparkles. Dropped |
| `head-c/tusk-2` | 0.74 | The same, more pebbles. Dropped |
| `head-c/tusk-3` | 0.42 on our paint-over | Even teeth, but our seam line ran on into the sky, and the chin was square. Dropped |
| `head-c/tusk-4` | 0.52 on our paint-over | Rockier, the same line. Dropped |
| **`head-c/tusk-5`** | **0.42 on our paint-over, pass 3** | **Even teeth, a rounded chin. Kept** (then the interior smoothed) |
| `head-c/tusk-6` | 0.48 | The interior turned to cobbles. Dropped |
| `head-c/rig/lip-1`, `lip-2` | 0.55, 0.66 | Painted an open slit with gums on both jaws: the model follows the open structure. Dropped for the deterministic seam |
| `head-a/a1`, `a2`, `a3` | 0.60, 0.66, 0.62 | A chubby plush-toy face with a cartoon grin, small, not colossal. Dropped |
| **`head-a/v2/a4`** | **0.62, v2 sketch and words** | **A cracked-stone face, organic, wings and claw right. Kept** |
| `head-a/v2/a5` | 0.70 | Machine studs and gold rivets. Dropped |
| `backdrop/bg1-a` | 0.50, SDXL, from the approved Evrae plate | A backdrop test made before the work was split; the backdrop is the other agent's section |

**Candidates** (full size, raw, each with `.prov.json`) are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin/`:
- `head-c/`:
  - `tusk-*`
  - `b1-c1` (tusk pasted), `b1-c1s` (interior smoothed), `b1-c2` (glints)
  - `rig/`: layers `L0`–`L4`, `clip.png`, `L2s-shut-seam.png`, `stage-0..4`, `rig-out.json`
- `head-a/`:
  - `a1..a3`, `v2/a4..a5`, `a4-g` (glints)
  - `rig/`: layers, `stage-0..4`, `rig-out.json`

## Re-render (from this folder's `src/`; the GPU rules above apply)

```
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin; R3=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3
python repair.py tusk-prep $R3/fix/b1-final.png $C/head-c $R3/plate/p6.full.png; ./run1.sh
python repair.py tusk-sketch $C/head-c; ./run2.sh; ./run3.sh                    # pass 3's tusk-5 is the pick
python repair.py tusk-paste $R3/fix/b1-final.png $C/head-c/tusk-5.png $C/head-c/b1-c1.png
python repair.py tusk-smooth $C/head-c/b1-c1.png $C/head-c/b1-c1s.png
python repair.py glints $C/head-c/b1-c1s.png $R3/plate/p6.full.png $C/head-c/b1-c2.png $R3/sketches/rig.json
python repair.py rig $R3/plate/p6.full.png $C/head-c/b1-c2.png $R3/sketches/rig.json $C/head-c/rig $R3/final/plate-dressed.png $R3/sin/mask-sin-full.png 26
python repair.py lip-seam $C/head-c/rig $R3/sketches/rig.json                   # (run4.sh = the dropped lip patches)
python sketch.py head-a $R3/plate/p6.base.png $C/head-a/v2; ./run6.sh           # (run5.sh = pass 1, v1 sketch)
python repair.py glints $C/head-a/v2/a4.full.png $R3/plate/p6.full.png $C/head-a/a4-g.png
python rig_a.py layers $R3/plate/p6.full.png $C/head-a/a4-g.png $C/head-a/v2/geometry-a.json $C/head-a/rig $R3/final/plate-dressed.png $C/head-a/v2/mask-a-full.png $R3/sketches/rig.json
PYREFLY_BROWSER=gpu node render.mjs frames C; PYREFLY_BROWSER=gpu node render.mjs frames A   # from the repo root, with the path
python images.py mouths C; python images.py mouths A; python images.py repairs; python section.py
```
