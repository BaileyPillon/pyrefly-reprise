# Art quality pilot — why today's renders are a step down

**Question (Bailey, 2026-09-21):** *"some of the art work still looks significantly
lower quality than before. it's not black or misrendered per say but it's a huge
downgrade in quality."*

This is the answer, measured by rendering rather than by opinion. Nothing here is
installed, wired or shipped. `sheet.png` is the picture to judge from: three
subjects, one row per recipe, and in every cell the whole figure small **plus the
face and the torso/hands at 1:1 (unscaled, native pixels)**, with the approved
quality bar in the first column. At a 180 px thumbnail these recipes look alike;
at 1:1 they do not, which is the whole reason the sheet is built this way.

- `sheet.png` — 2758 × 5188. Read it at 100 %.
- `renders/<subject>/<recipe>.<seed>.png` + `.json` — every render and its full sidecar.

---

## 0. Environment checks, before anything was rendered

| Check | Result |
| --- | --- |
| ComfyUI answers on `127.0.0.1:8188` | yes, v0.35.0, queue empty (no other agent's job displaced) |
| `checkpoints/animagine-xl-4.0-opt.safetensors` | `6327eca9…b847ac` — **matches** ART-PIPELINE §9 |
| `ipadapter/ip-adapter-plus_sdxl_vit-h.safetensors` | `3f5062b8…00e658` — **matches** §9 |
| `clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors` | `6ca9667d…07b030` — **matches** §9 |
| Black-frame test | 25 renders, **zero** black frames; `D:\Tools\comfy-logs\black-frames.log` unchanged since 2026-09-19 |

**So this is not the 2026-09-18 corrupt-weights incident and not the 2026-09-19
CLIP-Vision bit rot.** The weights on disk today are the publisher's. The GPU is
healthy. The downgrade is in the **recipe**, and it is reproducible.

Pose prompts in this pilot describe the body only — no aura, glow, energy, slash,
motion lines, dynamic pose, action pose or attacking.

---

## 1. The recipe diff: approved paintings vs today's renders

Compared: `public/art/characters/{lulu,tidus,yuna}/idle.json` (approved, 2026-09-18)
against `docs/concepts/art4/lulu/attack/cand-*.json` and
`public/art/characters/guado-guardian/*.json` (today).

| Ingredient | Approved idles (2026-09-18) | Today's renders (2026-09-21) | Same? |
| --- | --- | --- | --- |
| Checkpoint | `animagine-xl-4.0-opt` | `animagine-xl-4.0-opt` | same |
| Canvas | 832 × 1216 | 832 × 1216 | same |
| Steps / CFG | 28 / 6 | 28 / 6 | same |
| Sampler / scheduler | `euler_ancestral` / `normal` | `euler_ancestral` / `normal` | same |
| VAE | the checkpoint's own (no external VAE in the graph) | the checkpoint's own | same |
| Style block | `official art, cel shading, soft shading, vibrant colors, rim lighting, colorful, detailed` | identical | same |
| Quality block | `masterpiece, high score, great score, absurdres` | identical | same |
| Facing phrase | `(from side:1.3), three-quarter view, body facing …, (looking at viewer:1.2)` | **identical** | same |
| Framing block | `full body, standing, feet visible, …` (`composition: full`) | **`full body, centered, imposing, …` (`composition: boss`) on every non-idle state of `guado-guardian`, on all of `seymour-macalania`, and on the Leblanc/Ormi/Logos concepts** | **DIFFERENT** |
| Identity tags | long, specific, written for that character (Lulu's runs 11 lines: *"wide floor length skirt made of many stacked horizontal black leather belts with metal buckles…"*) | the **short generic block from `tools/gen/cast.json`**: *"black hair, braid, hair ornament, red eyes, lipstick, black dress, belt skirt, corset, fur trim, detached sleeves, large breasts, moogle, holding doll"* | **DIFFERENT** |
| IP-Adapter | **none.** No `ref` / `ipadapter` key in any approved idle sidecar | `ip-adapter-plus_sdxl_vit-h`, **weight 0.65**, start 0.25, end 0.85, `linear`, `K+V` | **DIFFERENT** |
| Negative — shared block | `BASE_NEGATIVE` + `paint splatter, ink splash, colorful background, abstract background` | same **plus** the new `EFFECTS_NEGATIVE` (`aura, glow, energy, magic, sparks, particles, smoke, slash effect, motion lines, speed lines, afterimage, debris, extra weapon, floating objects`) — an **uncommitted** working-tree change to `comfy.mjs` | different (but see H5: harmless) |
| Negative — per-subject | long, hand-written, targeted at that costume's known failures | shorter, generic | different in degree |
| Post-process | rembg `isnet-anime`, 16 px margin | same, plus a new cut-out sanity guard | same + a guard |
| Cut-out | alpha crop, `baselineY` = lowest opaque row | same | same |

**Scale of the change.** Of the 184 sidecars rendered on 2026-09-21 across
`public/art/` and `docs/concepts/`, **132 (72 %) carry an IP-Adapter reference,
123 of them at weight 0.65.** Of the sidecars that landed in
`public/art/characters/` today, **24 of 26 carry a reference** and **15 use the
`boss` framing block on a humanoid.**

---

## 2. What each hypothesis actually showed

Recipes, all else held constant (same prompt, same two seeds, same sampler):

| Recipe | What it is |
| --- | --- |
| **R1-oldneg** | the approved recipe exactly as the approved sidecars record it — text-to-image, no IP-Adapter, and the **approved-era negative** (no `EFFECTS_NEGATIVE`) |
| **R1** | the same, but with today's `EFFECTS_NEGATIVE` folded in, i.e. what `comfy.mjs` produces right now with no `--ref` |
| **R0-staletags** | R1 with the short `cast.json` identity block instead of the approved idle's own long one |
| **R4-noweightfacing** | R1 with the facing phrase **unweighted** (`three-quarter view, body facing right, looking at viewer`) |
| **R2** | R1 + a **light** reference: weight **0.30**, start **0.2**, end **0.6**, `ease in`, `K+V` |
| **R3** | **today's recipe unchanged**: weight 0.65, start 0.25, end 0.85, `linear`, `K+V` — the control |

### H1 — "the IP-Adapter reference at 0.65 burns colour and coarsens line." **CONFIRMED, and it is the main cause.**

The cleanest proof needed no new render at all. `guado-guardian/idle.png` (20:57:38) and
`guado-guardian/attack.1.png` (20:58:41) were made **sixty-three seconds apart
today, from the same identity block and the same style contract**, on weights
this pilot has since re-verified against the publisher hashes. The idle has no
reference; the
attack has one at 0.65. The idle is crisp cel shading, flat fills, clean outlines
and a readable face. The attack has **no head in frame at all**, the outlines have
dissolved into smeared cream-and-teal vertical streaks, and the cel shading is
gone. That is exactly the "not black, not misrendered, just much worse" Bailey
described.

The pilot reproduces it on demand:

- **Two of the six R3 renders were thrown out by the cut-out sanity guard**
  (`lulu/R3` seed 700101, `guado-guardian/R3` seed 700200 — both in
  `D:\Tools\comfy-logs\cutout-quarantine\`). **Zero** R1, R1-oldneg or R2 renders
  were. The quarantined Guado render carries the same cream-and-teal vertical
  streaking as today's broken `attack.1.png`: a signature, not a coincidence.
- Where R3 *does* survive, it still costs line quality. On Leblanc — the easiest
  of the three subjects — R3's hair reads soft and airbrushed at 1:1 against the
  bar's clean bob, the fan gains a hazy fringe, and the flat robe fills break into
  gradients. R2 at the same seed is indistinguishable from the bar in line
  quality.
- On Lulu, R3 also drags the reference's **palette** across the costume: the
  black corset and belt skirt come back as blue and grey-purple panels. This is
  the "material bleed" ART-PIPELINE §3 already documents, arriving at `refEnd
  0.85` rather than being cured by it.

**The severity scales with how extreme the reference's palette is.** Lulu's idle
is nearly all black and the Guado's is a single ochre; both referenced badly.
Leblanc's picked concept is a balanced purple/pink/gold image and referenced
gracefully. That is a usable production rule, below.

### H2 — "the weighted facing tags `(from side:1.3)` and `(looking at viewer:1.2)` cost detail." **REJECTED.**

Refuted twice. First on paper: the approved `lulu/idle.json`, `tidus/idle.json`
and `yuna/idle.json` prompts **already contain the weighted facing phrase,
verbatim**. It is not new, so it cannot be what changed. Then by rendering:
`R4-noweightfacing` (same seeds, weights removed) produced **one render the
cut-out guard rejected outright and one that is no sharper than R1**
(lapvar 3714 vs R1's 3835/4819). Unweighting the facing phrase buys nothing and
costs the facing contract. Leave §2a alone.

### H3 — "stale or over-long identity tags fight the image." **CONFIRMED as a second, independent cause.**

`tools/gen/cast.json`'s Lulu row is a 16-tag generic block. The approved
`lulu/idle.png` was rendered from an 11-line, hand-written description that spells
out the belt skirt buckle by buckle. Today's `art4` Lulu renders used the
`cast.json` block. Rendered side by side at the same seeds,
`R0-staletags` loses the costume completely: the stacked leather belt skirt
becomes a lace-trimmed gown with a lilac hem, the moogle becomes a balloon-sized
head floating behind her shoulder, and cowboy boots appear. The face is also
visibly muddier at 1:1 than R1's at the same seed.

This is **not** "fewer tags render worse in general" — it is that the specific
description *is* the art direction, and `cast.json` no longer carries what the
approved paintings were actually made from. `cast.json` is stale against the
approved idles' own prompts.

### H4 — "pose words (now banned) were the rest." **PARTLY. A real cause, already fixed, and not what Bailey is looking at.**

`dynamic pose` is present in today's `art4/lulu/attack` prompts and is the exact
failure `EFFECTS_BANNED_TOKENS` was added for this morning. The lint now strips
it. But the broken `guado-guardian` states carry **no** banned pose word and are
wrecked anyway, and this pilot's pose phrases are body-only throughout. So the
ban was right and is already in place; it does not explain the renders still on
disk.

### H5 — new: "the effects negative added this morning is flattening the art." **REJECTED.** *(tested because it was the only other same-day change)*

`comfy.mjs` now appends 14 negative terms — including `glow`, `energy`, `magic`
and `smoke` — to every sprite, and `rim lighting` and `vibrant colors` sit in the
positive style block, so it was worth checking whether the two fight. They do
not. R1 and R1-oldneg at identical seeds are the same picture to within candidate
variance, on all three subjects (leblanc lapvar 2577/2268 vs 2439/2473; lulu
4819/3835 vs 3900/3050). The new guard is safe to keep.

### A sixth thing, not in the brief, that is also wrong

Every non-idle `guado-guardian` state and **all** of `seymour-macalania` were
rendered with `--composition boss`, whose framing block is `full body, centered,
imposing` — it has **no `standing, feet visible`**. Both are ordinary bipeds who
stand on a floor. ART-PIPELINE §3 is explicit that the boss block exists for
things that "float, coil, or fill the frame" and that `standing, feet visible` is
wrong *for those*, not for a robed man holding a staff. This is why those renders
are doubled over and cropped through the head. It is a one-word fix per cast row
and independent of the reference problem.

---

## 3. Numeric aids

Measured on the opaque pixels only. Laplacian variance ≈ edge/line energy; colour
count = distinct colours after quantising to 5 bits per channel; saturation is the
mean of `(max−min)/max`. **Do not over-trust these** — n is 2 per cell, they do
not know what a face is, and a render can be numerically sharp and artistically
wrong (today's `art4` Lulu scores *higher* lapvar than the approved idle it is a
downgrade from). They are here because two of the three signals line up with what
the eye sees.

| Subject | Recipe | lapvar | colours | sat |
| --- | --- | --- | --- | --- |
| Lulu | **BAR** (approved idle) | 4161 | 3333 | 0.358 |
| Lulu | R1-oldneg | 3900 / 3050 | 4389 / 5887 | 0.262 / 0.317 |
| Lulu | R1 | 4819 / 3835 | 5358 / 3688 | 0.285 / 0.283 |
| Lulu | R0-staletags | 3456 / 3087 | 5968 / 9399 | 0.249 / 0.309 |
| Lulu | R4-noweightfacing | — / 3714 | — / 5562 | — / 0.349 |
| Lulu | R2 | 4422 / 3813 | 4412 / 4039 | 0.301 / 0.352 |
| Lulu | **R3** | 6078 / *rejected* | **6401** | **0.474** |
| Guado | **BAR** | 2854 | 6265 | 0.418 |
| Guado | R1-oldneg | 1462 / 1629 | 10407 / 8778 | 0.486 / 0.530 |
| Guado | R1 | 1877 / 1888 | 12565 / 10363 | 0.473 / 0.555 |
| Guado | **R2** | **2306** / 1682 | **8190** / 10042 | **0.419** / 0.514 |
| Guado | R3 | *rejected* / 2240 | 6880 | 0.428 |
| Leblanc | **BAR** (picked concept) | 1911 | 5776 | 0.486 |
| Leblanc | R1-oldneg | 2439 / 2473 | 6569 / 5532 | 0.453 / 0.418 |
| Leblanc | R1 | 2577 / 2268 | 5837 / 5239 | 0.427 / 0.421 |
| Leblanc | R2 | 3038 / 2584 | 7561 / 5684 | 0.422 / 0.458 |
| Leblanc | **R3** | 2718 / 2925 | **10166 / 9819** | 0.417 / 0.441 |

Two signals worth naming. **Leblanc R3 has nearly twice the bar's colour count**
(10166/9819 vs 5776) at the same figure — that is the flat cel fills breaking into
gradients, which is what "softer, airbrushed" looks like as a number. And **Lulu
R3's saturation jumps to 0.474 against the bar's 0.358** — the reference's palette
arriving with the face, exactly as ART-PIPELINE §3 warns. The lapvar column is the
least trustworthy of the three: gradient mush and fine linework both raise it.

---

## 4. Which recipe wins, per subject — having looked at the sheet myself

- **Lulu (attack).** **R1-oldneg / R1** win on costume, **R2** wins on overall
  craft, and I would take **R2 seed 700101**. The belt skirt survives, the single
  moogle is the right size, the face is clean at 1:1. **R3 loses:** it recolours
  the corset blue and the skirt grey-purple, thickens the eye make-up into a
  smear, and lost a seed to the cut-out guard. R0-staletags is the worst cell on
  the whole sheet and is what today's `art4` Lulu was actually made from.
  Honest caveat: none of my six Lulu cells match the approved idle's *richness* —
  the bar's purple-black cel shading on the skirt is better than anything the
  attack pose gave me at these two seeds. That is candidate variance, and it is
  what `--batch 3` and judging exist for; it is not a recipe difference, because
  R1 and R1-oldneg both show it.
- **Guado Guardian (idle).** **R2 wins, clearly and on both the eye and the
  numbers** — it is the only recipe that pulls the ochre robe back toward the
  bar's flat fills instead of the rainbow vertical striping both no-reference
  arms produced, and its lapvar/colours/saturation are the closest of any cell to
  the bar. **R3 lost one of two seeds to the guard** and the survivor is the
  washed pastel look. Note against myself: R1/R1-oldneg striping shows this
  subject's *prompt* is also fragile at these seeds, independent of the adapter —
  the robe needs a flat-colour phrase, not more weight.
- **Leblanc (idle).** **R1 and R2 tie for first; the bar is matched.** Take R2 for
  consistency with her picked concept, R1 if there is no reference worth using.
  **R3 is third**: still shippable, but at 1:1 the hair is airbrushed and the robe
  gradients, and its colour count is double the bar's. Leblanc is the case that
  shows 0.65 is not *always* catastrophic — her reference is a balanced image —
  which is precisely why the failure has looked intermittent.

**Recommended production recipe** (not built, not installed — it needs Bailey's yes):

1. **Drop the reference weight from 0.65 to 0.30**, `start 0.2`, `end 0.6`,
   `ease in`, `K+V`. It buys the identity consistency `--ref` exists for and
   stops the palette and the surfaces coming with it.
2. **Never reference off a near-monochrome idle at any weight above ~0.3.** Lulu
   (all black) and the Guado Guardian (single ochre) are the two that failed;
   Leblanc (balanced) did not. If an idle is near-monochrome, render the state
   unreferenced and judge it on costume instead.
3. **Re-sync `tools/gen/cast.json` identity tags from the approved sidecars' own
   prompts** before rendering another state. Today the work order is poorer than
   the paintings it is supposed to reproduce.
4. **Fix the framing on humanoids**: `composition: full`, not `boss`, for
   `guado-guardian` and `seymour-macalania`.
5. Keep the pose lint and `EFFECTS_NEGATIVE` — they cost nothing and H4 was real.
6. Direction stays a post step (`flip.py`), per §2a. Nothing here touches the
   facing contract; H2 says leave it alone.

**What this implies for the art on disk** (a decision for Bailey, not for me):
the referenced states rendered today at 0.65 — chiefly `guado-guardian`'s
attack/cast/hurt/ko and `seymour-macalania` — are the ones to re-render first.
Nothing has been withdrawn, moved or deleted by this pilot.

---

## Reproducing

Scratch drivers (agent scratch, `tools/zz-*.tmp.*`, not committed):
`zz-art-pilot.tmp.mjs` (the 22 CLI renders), `zz-art-pilot-oldneg.tmp.mjs` +
`-run.tmp.mjs` (the six approved-era-negative renders, which need comfy.mjs's
exported `characterWorkflow` because the CLI can no longer emit that negative),
`zz-art-pilot-sheet.tmp.py` + `zz-art-pilot-spec.tmp.json` (the sheet).
Every render's full prompt, negative, seed and reference settings are in its own
`.json` beside it.

**Game-aware (AGENTS.md rule 14): BOTH.** The generator, the style contract and
the reference settings are shared plumbing behind every chapter's art, FFX and
FFX-2 alike — this pilot's three subjects are deliberately two FFX and one FFX-2,
and the failure reproduces on both. `critic/CHECKS.md` CHK-020.
