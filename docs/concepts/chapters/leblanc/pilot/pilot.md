# Leblanc identity-consistency pilot (2026-09-21)

FFX-2 only (art pipeline scoped to the Leblanc Syndicate chapter; not shared
plumbing — AGENTS.md hard rule 14). Owner of this pilot's files:
`docs/concepts/chapters/leblanc/pilot/**`, the `leblanc`/`ormi`/`logos` rows in
`tools/gen/cast.json`. Nothing under `public/art/` was touched or re-rendered;
this pilot answers a method question, it does not ship new sprites.

## The problem

The installed `public/art/characters/leblanc/{idle,attack,cast,hurt}.png` read
as four different women: idle is a short blonde bob in a pinkish-purple robe
with a heart mark and a fan; attack drifts to long hair and a red kimono; cast
drifts to a hair bun; hurt drifts to long waves. Per
`docs/concepts/chapters/leblanc/production.md` and the `leblanc` row's own
notes in `tools/gen/cast.json`, the cause is that `idle.png` measures 43% one
colour, which trips `comfy.mjs`'s monochrome-reference guard — every other
state silently rendered **without** `--ref` at all, so each state was drawn
from the identity tags alone with no pixel anchor.

Identity anchor for this pilot: `public/art/characters/leblanc/idle.png`
(on-model against the picked concept
`docs/concepts/chapters/leblanc/renders/leblanc-b.png`) and its sidecar
`idle.json`. Identity block used for every render below (verbatim,
`docs/concepts/chapters/leblanc/pilot/identity.txt`):

> 1girl, leblanc (ff10-2), final fantasy x-2, safe, solo, round face, large
> purple eyes, short blonde hair falling to the chin with side-swept bangs, a
> pinkish-purple furisode-style robe left open at the chest revealing a red
> heart-shaped syndicate mark on her sternum, the robe patterned all over in
> blue and white triangles and swirls, a high curved tasselled collar standing
> up around her neck, long furisode sleeves with the cuffs separated from the
> sleeve ends by a band of white crisscrossed material, the robe cut away
> baring her right thigh, thigh-high stockings the same pinkish-purple as the
> robe, purple ankle boots with a low heel, holding a large red-and-silver
> folding fan, confident smirk, half-lidded eyes, (blue and white triangle
> pattern robe:1.35), (heart mark on chest:1.2), (red and silver fan:1.2)

Pose tags are body-only Danbooru-style tags (per the memory of the last pose
batches — natural-language pose phrases do not land on this checkpoint):

| Pose | Tags |
| --- | --- |
| attack | `fighting stance, holding fan, outstretched arm, leaning forward, open mouth, looking at viewer` |
| cast | `arm up, holding fan, raised hand, standing, looking up, open mouth` |
| hurt | `wince, one eye closed, leaning back, arm across chest, holding fan, open mouth` |

`tools/gen/comfy.mjs` already has an image-to-image path (`--img2img`,
`--denoise`) and a reference-adapter path (`--ref`, `--forceRef`, `--refWeight`,
`--refStart`, `--refEnd`, `--refWeightType`) — no new `tools/gen/img2img.mjs`
was needed.

## Method A — text2img + forceRef

`--forceRef` off the idle PNG at `refWeight` 0.35 and 0.45 (ease-in,
`refStart` 0.2, `refEnd` 0.6), full identity block + emphasis + pose tags,
batch 2 per call (4 candidates per pose per weight... i.e. 4 candidates total
per pose across the two weights). Commands (`docs/concepts/chapters/leblanc/pilot/run-pilot.sh A`,
one call shown per pose/weight — the script loops all three poses):

```
node tools/gen/comfy.mjs character --name leblanc --facing left --composition full \
  --size 832x1216 --batch 2 --pose attack \
  --tags "$(cat docs/concepts/chapters/leblanc/pilot/identity.txt)" \
  --emphasis '(short blonde bob:1.3), (blue and white triangle pattern robe:1.25), (heart mark on chest:1.2)' \
  --poseTags "fighting stance, holding fan, outstretched arm, leaning forward, open mouth, looking at viewer" \
  --ref public/art/characters/leblanc/idle.png --forceRef \
  --refWeight 0.35 --refStart 0.2 --refEnd 0.6 --refWeightType "ease in" \
  --seed 7101 --out docs/concepts/chapters/leblanc/pilot/renders/a035-attack.png
```

(repeated for `cast`/`hurt` with their own pose tags and seeds 7201/7301, and
again at `--refWeight 0.45`, tag `a045`). Files: `renders/a035-{attack,cast,hurt}.{1,2}.png`,
`renders/a045-{attack,cast,hurt}.{1,2}.png` (12 + 12 = 24 images, 4 candidates
per pose).

## Method B — image-to-image

`--img2img` off a reconstructed init frame (`renders/idle-init.png`, built by
`renders/make-init.py`/`pilot/make-init.py` by pasting the shipped idle cutout
back at its recorded `cropBox` onto a full white 832x1216 canvas — feeding the
tight cutout directly would blow the figure up to fill the frame edge to edge
and trip the cut-out coverage guard on framing alone) at `denoise` 0.55 and
0.65, same identity block and pose tags:

```
node tools/gen/comfy.mjs character --name leblanc --facing left --composition full \
  --size 832x1216 --batch 2 --pose attack \
  --tags "$(cat docs/concepts/chapters/leblanc/pilot/identity.txt)" \
  --emphasis '(short blonde bob:1.3), (blue and white triangle pattern robe:1.25), (heart mark on chest:1.2)' \
  --poseTags "fighting stance, holding fan, outstretched arm, leaning forward, open mouth, looking at viewer" \
  --img2img docs/concepts/chapters/leblanc/pilot/idle-init.png --denoise 0.55 \
  --seed 7101 --out docs/concepts/chapters/leblanc/pilot/renders/b055-attack.png
```

Files: `renders/b055-{attack,cast,hurt}.{1,2}.png`, `renders/b065-{attack,cast,hurt}.{1,2}.png`
(24 images, 4 candidates per pose).

## Method C — one reference-sheet generation

A single wide (1344x768) generation per candidate, asked for `multiple views,
reference sheet, same character, three views, full body, character sheet`
plus **all three** pose tags at once, so the checkpoint draws attack, cast and
hurt of one woman in a single denoise — identity shared by construction
instead of by adapter. This cannot go through `comfy.mjs character` unmodified:
`SPRITE_NEGATIVE` bans `multiple views, multiple girls, 2girls` outright (the
pipeline's documented failure mode 2, `docs/ART-PIPELINE.md` §6) and the
cutout guard rejects a multi-figure frame. `docs/concepts/chapters/leblanc/pilot/sheet-c.mjs`
builds the same workflow through `comfy.mjs`'s exported builders
(`characterWorkflow`, `BASE_NEGATIVE`, `STYLE_TAGS`, `QUALITY_TAGS`,
`escapeTags`) and posts it directly, with only the multi-figure bans lifted
from the negative (everything else — quality, anatomy, the motion-line ban —
stays):

```
node docs/concepts/chapters/leblanc/pilot/sheet-c.mjs sheets
```

Output: `renders/c-sheet.{1,2,3,4}.png`, seeds 7401-7404, 4 candidates.
`sheet-c.mjs` only implements the `sheets` mode; the planned `refine <n>`
step (split into figures, re-denoise per pose by method B at `denoise 0.4`)
was **not run** — see verdict below for why.

## The sheet

`docs/concepts/chapters/leblanc/pilot/sheet.png`
(built by `docs/concepts/chapters/leblanc/pilot/build-sheet.mjs`, run as
`node docs/concepts/chapters/leblanc/pilot/build-sheet.mjs`): one block per
pose (attack, cast, hurt), each block a WHOLE row (idle anchor, then every
candidate whole — methods A and B fit-inside a fixed cell, method C's whole
1344x768 sheet fit-inside the same cell, so it appears small and wide) and a
FACE row (a proportional top-22%-of-height strip of the same source image,
resized to a fixed cell — not a per-image face detector, because the three
methods produce different canvas sizes and cutout crop boxes and a single
fixed pixel box cannot land on the face for all of them). For method C the
face strip necessarily shows more than one face at once, since one C
candidate is a multi-figure sheet, not a single pose.

I looked at the assembled sheet at full size, then at eight of the individual
1:1 source PNGs (idle; a035/a045-attack.1; b055/b065-attack.1; a035/a045-cast.1;
b055-cast.1; a035/a045-hurt.1 and .2; b055-hurt.1; c-sheet.1; c-sheet.3) to
confirm what the thumbnails show before writing this up.

## What I saw, method by method

**A — text2img + forceRef (0.35 and 0.45, ease-in 0.2-0.6).** The only method
that actually draws a different pose. Attack candidates lean forward with the
fan thrown out to one side — a real fighting silhouette, not idle's calm
stance. Cast candidates raise the fan overhead/to the side with a more
dramatic stance. Hair (blonde bob), the heart mark's position on the chest,
the purple/white palette and the ankle boots carry over recognizably in 6 of
the 8 attack/cast candidates. Two of the four hurt candidates
(`a035-hurt.2`, `a045-hurt.2`) drifted the outer robe to solid navy/black and
added an unrequested circular mandala/halo graphic behind her — not present
in idle and not asked for by any tag, so it reads as a checkpoint bias for
this specific pose-tag combination rather than a `--ref`/weight problem
(`--forceRef` was on for all of them). The other two hurt candidates
(`a035-hurt.1`, `a045-hurt.1`) keep the purple argyle robe. 0.35 vs 0.45
refWeight: no consistent identity difference at this sample size — 0.45 reads
marginally stiffer/closer to idle's own standing angle, inside noise.

**B — img2img (0.55 and 0.65) off the reconstructed idle frame.** Identity
retention is the best of the three methods by a wide margin — hair, the
argyle robe pattern, the heart mark, the boots and the fan are close to
pixel-faithful to idle in all 12 renders, because the model is repainting
idle's own pixels rather than drawing fresh. It also **fails the brief**:
every attack/cast/hurt candidate at both denoise levels reads as a near-copy
of idle's own standing/fan-at-chin pose. 0.65 loosens it slightly (cast shows
a partial arm raise and a wink) but hurt at 0.65 is still nearly
indistinguishable from idle's composition. This method optimizes identity by
declining to change the picture — not usable for state art that has to look
different from idle.

**C — one reference-sheet generation (4 candidates, not refined further).**
Within a single sheet the three poses do share one face and hairstyle by
construction (hair colour and the heart mark hold across all three figures in
every sheet) — the multi-pose coherence this method is supposed to buy is
real. But the **costume itself is not stable seed to seed**: `c-sheet.1`
renders a blue/white checkered outer robe over a solid-blue underdress;
`c-sheet.3` renders a red/white checkered robe with dark thigh-high stockings
and a garbled fake logo/watermark text hallucinating at the bottom edge (a
known SDXL failure mode, not something in any tag); none of the four lands on
idle's actual plain-purple argyle robe over a white underdress. The `same
character` / `reference sheet` framing appears to pull the checkpoint toward
a different, generically-trained "character sheet" costume style rather than
reproducing idle's own colours. Because no candidate's costume was close
enough to be worth trusting as a base, the planned per-figure split + method-B
refine at `denoise 0.4` was not run — refining an already off-model base
would not answer the identity question, and running it anyway after the
costume test had already failed would be a third variant of a method already
disqualified on the property being tested (pace rule, AGENTS.md hard rule
15: two failed attempts before a method check, not a third roll of the same
approach).

## Verdict

No single method delivers both properties — on-model costume AND a genuinely
different pose — at once. **Recommended base recipe for the real
attack/cast/hurt re-renders: method A**, `--forceRef --refWeight 0.35
--refStart 0.2 --refEnd 0.6 --refWeightType "ease in"`, best-of-N per state
exactly as the rest of this chapter's art was judged, explicitly re-rolling
away from the navy-robe/halo failure mode seen on 2 of 4 hurt seeds rather
than accepting it. This recipe is now recorded on the `attack`/`cast`/`hurt`
states of the `leblanc` row in `tools/gen/cast.json` (with a note on the hurt
failure mode); `ko` is untouched since this pilot didn't test a prone
composition. Method B is not recommended for state art — it defeats the
purpose — but is worth a follow-up experiment as a light last-mile touch-up
(very low denoise, ~0.15-0.2, not tested here) applied *after* picking an A
candidate, to sand down small colour drift without erasing the pose; that is
a new experiment, not something this pilot ran. Method C is not recommended
as a generator for shippable Leblanc pixels (costume too seed-unstable); a
future retry would want a shorter, more literal Danbooru-tag identity block
in place of the current hand-written prose block, since the prose block was
written for single-figure generation and may not be what the "reference
sheet" checkpoint prior expects — also not tested here.

`logos/idle.png` has the same monochrome-guard situation as `leblanc/idle.png`
(62% one colour, per its `cast.json` notes) but was **not** pilot-tested;
its `cast.json` entry now carries an advisory note pointing here rather than
copying Leblanc's numbers untested. `ormi/idle.png` shows no such flag in its
existing notes, so it was left alone entirely.

## Not done here

- The installed `public/art/characters/leblanc/{attack,cast,hurt}.png` were
  **not** re-rendered with method A's recipe — this pilot answers the method
  question only, per its own brief. Re-rendering the installed sprites (best
  of N per state, judged and installed) is a separate follow-up task.
- Method C's `refine <sheetIndex>` split-and-refine step (planned in
  `sheet-c.mjs`'s own docstring) was not implemented or run, for the reason
  given above.
- `ormi` and `logos` were not pilot-tested; only `leblanc`'s `cast.json` rows
  carry a tested recipe change.
