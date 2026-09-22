# Leblanc pilot 2: methods D, E and F on hurt and attack (2026-09-22)

FFX-2 only (Chapter 6 art recipe, AGENTS.md hard rule 14; no shared tool was
changed). The method check that planned this pilot, written before any render:
`docs/plans/leblanc-art-method-check.md`. **Every image here is a CANDIDATE.**
Nothing was installed under `public/art/`, nothing was added to
`docs/target/approved-hashes.json`, and the 115 approved files there hash the
same before and after this run.

**Sheet:** `sheet.jpg` (per state: idle at left, then every candidate whole,
a row of 1:1 face crops and a row of 1:1 costume crops, native pixels).
`sheet-d-stages.jpg` puts D's stage 1 next to its stage 2 for every candidate.
Built by `build-sheet.py`. I judged from the 1:1 rows and from the gridded
full-size cutouts, not from the thumbnails.

## What every method shared (method check §3)

- **Identity block written from idle's pixels** (`identity-idle.txt`, and the
  emphasis in `emphasis.txt`): white halter dress, red obi with tassel, purple
  kimono off the shoulders, bare legs, lace-up open-toe ankle boots, purple
  choker, black folding fan. The old block described a different costume
  (thigh-highs, a red-and-silver fan, no white dress), which the checkpoint
  drew every time.
- **Per-state framing**: the sprite framing without `standing` and without
  `(looking at viewer:1.2)`, which fought the recoil and the strike.
- **Negatives**: `smile, smirk, grin, wink, seductive smile, happy, dancing`
  (plus `looking at viewer` for hurt, `fan dance` for attack) and the costume
  drifts (`thighhighs, stockings, closed robe, long dress, red fan, pink fan`).
- **Danbooru pose tags, no effect words** (the lint stripped nothing):
  - hurt: `leaning back, off balance, wince, closed eyes, pained expression,
    clenched teeth, v-shaped eyebrows, hand on own stomach, head tilt, arm at
    side, holding closed fan` + `(closed eyes:1.25), (pained expression:1.2),
    (leaning back:1.2)`
  - attack: `lunging, leaning forward, one leg forward, arm extended forward,
    swinging, holding folding fan, serious, v-shaped eyebrows, looking ahead,
    closed mouth` + `(lunging:1.25), (leaning forward:1.2), (serious:1.15)`
- Animagine XL 4.0, 832x1216, 28 steps, cfg 6, euler_ancestral. Seeds: hurt
  22301 to 22304, attack 22101 to 22104 (the same four seeds for D stage 1 and
  F, so the two isolate the reference framing).

## Exact commands (repo root)

```bash
PY=D:/Tools/ComfyUI/python_embeded/python.exe
$PY -s docs/concepts/chapters/leblanc/pilot2/make-refs.py        # refs/idle-square.png, idle-head.png, idle-init.png
S=docs/concepts/chapters/leblanc/pilot2/run-pilot2.mjs
node $S f hurt;  node $S f attack                                 # method F
node $S d1 hurt; node $S d1 attack                                # method D stage 1
node $S d2 hurt 1 190,40,140,160;  node $S d2 hurt 2 280,40,170,170
node $S d2 hurt 3 240,50,170,160;  node $S d2 hurt 4 270,30,160,170
node $S d2 attack 1 40,20,210,180; node $S d2 attack 2 340,100,190,190
node $S d2 attack 3 440,190,190,200; node $S d2 attack 4 100,10,170,190   # D stage 2 (head boxes in raw-frame pixels)
$PY -s docs/concepts/chapters/leblanc/pilot2/tools2.py puppet hurt
$PY -s docs/concepts/chapters/leblanc/pilot2/tools2.py puppet attack   # method E init frames
node $S e hurt;  node $S e attack                                 # method E
$PY -s docs/concepts/chapters/leblanc/pilot2/build-sheet.py       # sheet.jpg, sheet-d-stages.jpg
```

`run-pilot2.mjs` builds its graphs from `tools/gen/comfy.mjs`'s exports
(`characterWorkflow`, `stageImage`, `cutout`, `lintSpritePrompt`, the style,
quality and negative blocks) and posts them itself. It does not call
`tools/gen/inpaint.mjs`: that tool hard-codes Yuna's identity block (imported
from `yaw-keys.mjs`) and uses `VAEEncodeForInpaint`, which greys the masked
pixels and is built for denoise 1.0, so D's stage 2 is the same native-node
idea done with `VAEEncode` + `SetLatentNoiseMask` + `ImageCompositeMasked`.
Every render wrote `renders/<tag>.raw.png` (kept local), `renders/<tag>.png`
(rembg cutout) and `renders/<tag>.json` (prompt, negative, seed, reference
settings, crop box, seconds). All 40 renders took 13 to 59 s each on the shared
queue; no black frame.

| Method | What it did |
|---|---|
| **D** (pose, then re-identify) | Stage 1: method A (the tall idle as IP-Adapter reference, forced past the monochrome guard, 0.35, ease in, 0.2 to 0.6) with the shared fixes. Stage 2a: the figure's silhouette (non-white, holes filled, dilated 12 px, feathered 6) repainted at denoise 0.4 with both square references at 0.55, window 0 to 1. Stage 2b: a head box at denoise 0.5 with the head reference at 0.6. |
| **E** (puppet img2img) | `tools2.py puppet`: idle's cutout on its own 832x1216 frame, the fan hand cut off, the upper body rotated 20 degrees at the waist (back for hurt, forward for attack), the head snapped back 16 degrees and the eyes and mouth painted shut for hurt, the front arm swung up with the fan for attack; then img2img at denoise 0.6 (cands 1, 2) and 0.7 (cands 3, 4), no reference. |
| **F** (a reference the adapter can see) | Method A with the shared fixes, but the reference is a batch of two squares (idle padded to a square, and a square head-and-fan crop), concat, 0.4, ease in, 0.2 to 0.6. |

## Honest read (worst criterion, bar 7, against idle at 1:1)

**Nothing clears 7. No candidate should be installed.** But the pilot answers
the method question, and one finding changes the recipe.

| Candidate | Worst | Why |
|---|---|---|
| **F4 attack** (best attack) | **6** | A real strike for the first time: wide lunge, weight forward, v-brows, the fan driven out, and the fan is idle's black one. Off: hair a warmer gold than idle's platinum, a lace bra top under the halter, gold obi, closed-toe boots. |
| F1 / F2 attack, D1 / D2 attack | 4 to 5 | Strong strikes (F1 and D1 lunge, F2 and D2 a leaping slash) but an orange or a gold baton-like fan, warmer skin, gold-brown hair. |
| F3 / D3 attack | 2 | A second heart on the shoulder. |
| D4 attack | 5 | Same pose as F4 but stage 2 painted a purple streak across the hair over the eye. |
| E1 to E4 attack | 2 | The most on-model costume of the whole pilot (robe, white dress, bare legs, open-toe boots, platinum hair, calm face), but the pose collapsed back to the paste: a woman standing with a fan held out, not a strike. |
| **F2 hurt** (best hurt pose) | **5** | Reads as hit: head thrown back, eyes shut, mouth open, hand at the stomach. Off: gold obi, magenta robe lining, closed-toe boots. |
| **E4 hurt** (best hurt costume) | **5** | Idle's robe, dress and bare legs; eyes shut, frown, hand clutching the stomach, head back; reads as winded more than struck. Off: gold obi, the heart drawn as a large flat sticker, the fan barely readable. |
| E1 to E3 hurt | 4 to 5 | Same costume win; a stoop with a pained face, no fan (E1) or a fan floating at the left (E3). |
| F3 hurt | 5 | A wince with a hand on the stomach; gold and magenta obi. |
| F4 / D4 hurt | 4 | Head back with the fan at the mouth: reads as a swoon, not a hit. |
| D2 / D3 hurt | 4 | Stage 2 painted pink and purple smears on the eyelids and cheek. |
| F1 / D1 hurt | 0 | Two figures and a floating plank: seed 22301 does this under both reference setups, so it is the seed and the prompt, not the reference. |

## What the pilot showed

1. **The words were the lever.** With the same seeds, D's stage 1 (the tall
   reference method A always used) and F (the square references) are almost
   the same pictures. At 0.35 to 0.4 on an ease-in window the adapter nudges
   and the text decides. The idle-truth identity block and the per-state
   framing are what turned attack from a fan flourish into a strike, put the
   white halter dress and the off-shoulder robe back, and took the coy smile
   out of hurt. The square reference (the §2.2 fix) is correct but is not what
   moved the result.
2. **What still drifts is still in the words.** "gold sash ornament" turns
   the obi gold in nearly every final candidate; "boots" without enough
   weight gives closed-toe heeled boots; "red heart mark" gives a flat sticker.
   Each is a prompt fix (`crimson obi`, drop `gold`; weight `open-toe lace-up
   ankle boots`; describe the heart as a small painted mark), not a method.
3. **D's re-identify pass is not worth its cost as built.** It pulled the hair
   toward idle's platinum, but at 0.55 to 0.6 over the whole window with
   `purple eyes` in the text it painted purple on closed eyelids and cheeks
   (hurt) and streaked the hair (attack). A lower weight (about 0.35), denoise
   0.3 and dropping `purple eyes` for closed-eye states is the version worth
   one more look; it was not run here.
4. **E keeps the costume, not the pose.** The paste carries idle's colours,
   pattern and boots better than anything else tried, but at 0.6 to 0.7 the
   model pulls the figure back to the paste's silhouette. A crude puppet is
   enough for a recoil (head back, closed eyes survive), not for a lunge.
5. **The attack figures fill the frame.** D and F attack cutouts come back
   832 px wide (the robe runs off the canvas) and their heads are about 250 px
   against idle's 190, so the sprite would need a wider canvas or a
   zoom-out tag and a scale check before install.

## Recommendation for the next attempt (for the driver; not run here)

**F text + E costume.** Keep F's prompt with the three prompt fixes in point 2,
render attack and hurt txt2img as F does (pose comes from the words), and use
E only where the pose is small (hurt): a stronger puppet (legs and torso, not
just the head) at 0.7. Then a light masked re-identify (0.35, denoise 0.3, no
`purple eyes` for shut eyes) as the last step only if the face drifts. Judge
the same way, bar 7, and show Bailey F4 attack and F2 / E4 hurt next to idle
as the current best, below bar.

**Open for Bailey (hard rule 6):** the research (`research/ffx2-leblanc-syndicate.md`
§10.1) gives Leblanc thigh-high stockings, a red-and-silver fan and a
blue-and-white triangle pattern; the idle he saw has bare legs, a black fan and
a plain robe. The pilot follows the idle as the brief says; whether the idle
should move to the canon is his call.

## Files

- `identity-idle.txt`, `emphasis.txt`: the idle-truth identity block
- `make-refs.py`, `refs/`: the square references and the init frame
- `run-pilot2.mjs`: methods D, E, F; `tools2.py`: masks, puppet, black-frame check
- `renders/`: cutouts and sidecars (`d1-*`, `d2-*`, `e-*`, `f-*`, the puppet
  inits `e-*-init.png`); raw frames, masks and the stage-2a intermediates stay
  local (`renders/.gitignore`) and are backed up with everything else in
  `D:/Tools/pyrefly-art-backup/candidates/leblanc-pilot2-2026-09-22/`
- `build-sheet.py`, `sheet.jpg`, `sheet-d-stages.jpg`
