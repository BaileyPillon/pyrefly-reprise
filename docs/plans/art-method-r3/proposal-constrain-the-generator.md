# Art method check r3, proposal: constrain the generator, region by region

**Case:** FFX-2 first (Chapter 6: Leblanc, Ormi, Logos). The method is per-subject
art tooling and applies to both games (the chapter 7 and 8 subjects below; any FFX
subject with an approved idle). No shared tool, game file or `public/art/` file is
touched by this proposal. **Paper only:** written 2026-09-23 from the round-2 reports,
the three independent judge reports (`0c46fc2`, `5ed7a7a`, `c71b595`), the round-1
method check, the pilot-2 judge, the render and repaint scripts, the engine, and
colour measurements of the installed files (section 1.2, M4). Nothing was queued,
trained or downloaded.

**Hard rule 15.** Two rounds (the identity LoRA r1 and r2) left the same class of
defect open: small costume regions and region colours drift away from the approved
idle in every pose state. This document is the written method check owed before a
third round. It proposes one method and a pilot of at most 60 GPU minutes that
would prove it or kill it.

**The premise (this proposal's angle).** A painted pose needs a generator: the
pose, the silhouette, the folds and the light on the big surfaces have to be drawn
fresh. The generator is not the problem. The problem is that everything else
(obi, choker, emblem, shield band, cloth value, finish) is currently also left to
the generator, steered only by words and one weak global reference. The proposal
takes those regions away from it, one by one, and says where each region's truth
comes from instead.

---

## 1. Root causes, with evidence

### 1.1 What drifted (the judges' words, round 2)

| Subject | Drift named at 1:1 | States |
|---|---|---|
| Leblanc | obi: navy band (attack, ko), narrow pink band with two tassels and a side cord (cast), crimson but no knot or tassel (hurt); idle's is a wide crimson sash, gold edges, one knot, one tassel with a round medallion | all four |
| Leblanc | choker: lavender band with scribbles or one stud; idle has a row of studs | attack, cast |
| Leblanc | white highlight strand across the near eye, iris grey not purple | attack |
| Leblanc | boots deep indigo (idle: lavender), toe clipped by the canvas edge | ko |
| Leblanc | head pillowed on the fan hand, reads as sleep (second review) | ko |
| Logos | shoulder disc: a grey lens with a starburst glint (after a paste repainted at 0.55), not idle's white radial rosette; strap lens missing | attack |
| Logos | helmet: back half shaded near black (hurt); slatted crown panel, a lens on the helmet (ko) | hurt, ko |
| Logos | revolvers: both blued (idle: one blued, one silver), a snub-nose, one gun missing (ko) | attack, ko |
| Logos | head 15 to 25 percent large relative to the body; one leg (ko) | hurt, ko |
| Ormi | purple cloth median lightness 0.55 (cast) against idle's 0.21; flatter cel finish in all four | all four, cast worst |
| Ormi | shield: plain gold rim, no red studded band; back view (hurt); absent (ko) | all four |
| Ormi | hem: gold squares, no hem on the back leg, lemon bow sash | attack, hurt, ko |
| Ormi | topknot tassel missing | attack, cast, hurt |

Pose-reading faults are in the same reports (Leblanc hurt too mild, Leblanc ko
asleep, Logos hurt reads as firing, Logos ko one leg) are handled by the skeleton
and the automatic gate (section 2, step 1) and named as a limit in section 4, risk 5; they
are not region drift.

### 1.2 Four mechanisms behind the region drift

**M1. The detail is smaller than the latent can hold, so no conditioning reaches it.**
SDXL draws in a latent 8 times smaller than the image. Measured on the installed
idles at 1:1 (the cutouts are 1:1 crops of the 832x1216 generation frame):

| Detail | Size at 1:1 | Latent cells |
|---|---|---|
| Leblanc obi band (height) | about 45 px (y 325 to 370 of `leblanc/idle.png`) | about 5.6 |
| Leblanc choker (height) | about 15 px | about 2 |
| Leblanc choker stud | 3 to 4 px | under 1 |
| Logos shoulder disc (diameter) | about 50 px | about 6 |
| Logos strap lens | about 35 px | about 4 |
| Ormi shield red band (width) / stud | about 40 px / 6 to 8 px | 5 / under 1 |

Anything under about 2 cells is invented by the VAE decoder and the prior, not by
the prompt, the LoRA or the IP-Adapter. Evidence: the Logos judge found the disc
"repaint at 0.55 is what turned the disc into a lens": a correct paste of idle's
pixels, repainted at native resolution, was redrawn as the checkpoint's idea of a
round shiny thing. Leblanc's studs, Ormi's studs and Ormi's diamond hem are the
same case. The round-2 masked repaints (`poses/repaint.mjs`) all ran at native
832x1216 resolution with no reference: they are the right tool at the wrong scale.

**M2. Colour words bind to the wrong object in a long tag list.** The pose prompt
carries one global identity block of about 30 tags with 9 colour words
(`render.mjs` `IDENTITY`: `... crimson obi, purple tassel, purple kimono, ...`).
CLIP does not bind attributes to nouns reliably; the colour lands on whichever
nearby object the sampler is drawing. Evidence from this project, not theory:
pilot 2 (`pilot2/pilot2.md` point 2) showed `gold sash ornament` turning the obi
gold "in nearly every final candidate", and at an IP-Adapter weight of 0.3 to 0.4
"the words decide" (`pilot2/judge.md`). Round 2 put `crimson obi` between
`highleg` and `purple tassel, purple kimono`: the obi came back navy, purple-pink
and pink, and cast grew a second tassel. The same list carries `purple eyes` into
closed-eye states, which pilot 2's re-identify pass painted onto eyelids.

**M3. The identity LoRA knows the costume only in the idle's pose, and r2 saw
the idle half as often.** Every idle view in the Leblanc dataset is one pose
(`dataset.md`, `dataset-r2.md`). The step test shows the consequence: at every
r2 step the idle pose reproduces obi, knot, tassel, choker and boots at 1:1, while
an unseen pose drifts (a kneel with the trigger alone went blue or lilac-haired).
Round 2 then diluted the idle: r1 was 1500 steps on 21 samples an epoch (about
1,430 idle-sample steps); r2 was picked at step 1000 on 29 samples (about 690).
Round 1's picks kept idle's crimson obi in all four states; round 2's lost it in
all four, and the judge rules out the repaints ("the masked repaints never touched
it, so it comes from the renders"). Adding pose images did not teach the obi in
new poses; it thinned the one place the obi was taught.

**M4. Region colour and finish are never measured, so nothing pulls them back.**
The pipeline has no numeric check of any region against idle. Measured now on the
installed files (purple = hue 238 to 306, saturation above 0.25, the Ormi judge's
definition; median over the figure's opaque pixels):

| File | purple L median | saturation median | note |
|---|---|---|---|
| ormi idle | 0.21 | 0.62 | anchor |
| ormi attack / cast / hurt / ko (r2) | 0.23 / **0.55** / 0.26 / 0.41 | 0.83 / 0.84 / 0.65 / 0.82 | cast and ko far off; three of four oversaturated |
| ormi attack / cast (r1, replaced) | 0.27 / 0.30 | 0.46 / 0.47 | the judge's "idle's finish" |
| leblanc idle | 0.64 | 0.49 | anchor |
| leblanc attack / cast / hurt / ko (r2) | 0.81 / 0.82 / 0.82 / **0.40** | 0.64 / 0.53 / 0.56 / 0.65 | robe paler in three, darker in ko (the indigo boots and robe) |
| leblanc attack / cast / hurt / ko (r1, replaced) | 0.52 / 0.56 / 0.55 / 0.61 | 0.47 / 0.41 / 0.50 / 0.50 | closer to idle on both |

The drift is per frame and large (Ormi cast 0.55 against 0.21), so it is not a
style-tag choice (idle was rendered with the same `STYLE_TAGS`); it is what one
seed of LoRA r2 plus OpenPose happened to paint. A number this large is easy to
measure and easy to correct deterministically; nobody measured it before the
judge did. Round 2's Ormi LoRA was trained with cel-shaded pose images at repeats
1 (`ormi/round2/dataset-r2.md`), which is the likeliest source of the flatter,
higher-saturation finish the judge saw across the whole set.

### 1.3 Levers judged by the evidence (what not to repeat)

| Lever | Evidence | Verdict |
|---|---|---|
| More or longer negatives | ko negatives already said `head on arm, sleeping, pillow, hand under head`; Logos `NEG_R2` already named `grille`; both came back | no: negatives do not bind to regions either (M2) |
| Hunting the global IP-Adapter weight | 0.35 to 0.45 no difference (pilot 1); above about 0.5 burns colour and dissolves lines (ART-PIPELINE section 3) | no |
| Higher-rank identity LoRA | Leblanc is dim 32, Ormi and Logos dim 16; all three drift the same way | no evidence it helps; not in this method |
| Growing the LoRA dataset with pose outputs | r2 did exactly that; the obi got worse (M3); Ormi inherited cel finish | no; if a LoRA is retrained, it goes back to idle-heavy |
| Whole-figure re-identify repaint | pilot 2 method D: every face worse, purple on eyelids | no |
| Native-resolution masked repaint of a small detail | Logos disc became a lens at 0.55 | only for seams, never for the detail itself |
| Paste of idle's pixels | pilot 2 method E: "keeps idle's colours, pattern and boots better than anything else tried", but pulls the whole figure back to idle's pose at 0.6 to 0.7 | yes, but only per region, after the pose exists |
| Region masks with SAM 2.1 | the living-portrait rig already masks and snaps parts of an approved painting to its ink (`tools/gen/rig-sam.py`, `rig-lib.py` geodesic snap) | yes: the plumbing exists |

---

## 2. The method: "region locks" (R3-L)

The generator keeps what only it can do: the pose, silhouette, folds and light on
large surfaces. Every named region gets a **lock**, and each lock says where that
region's truth comes from. Five locks, applied in a fixed order. All nodes are
ComfyUI core or `ComfyUI_IPAdapter_plus` (installed); all image work outside
ComfyUI is PIL and numpy in `D:/Tools/ComfyUI/python_embeded/python.exe -s`.
Per-subject scripts live under `docs/concepts/chapters/leblanc/r3/<subject>/`;
`tools/gen/comfy.mjs` and `poses/repaint.mjs` are not modified.

### Step 0. The region atlas of the idle (CPU or under 1 GB GPU, once per subject)

- Run SAM 2.1 hiera-small (`D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt`,
  the loader from `tools/gen/rig-sam.py`) on the approved idle with hand-placed
  point and box prompts, one mask per named region, snapped to the painting's ink
  with `rig-lib.py`'s geodesic labels. Leblanc: hair, face, eyes, choker, heart,
  white dress, obi band, obi knot and tassel, robe outer, robe lining, cuffs, fan,
  boots (two), legs. Logos: helmet, face, hair, disc, strap and lens, robe, sash,
  hakama, wraps, slides, revolver blued, revolver silver, gloves. Ormi: head,
  topknot and tassel, face, sleeves, kimono, sash, teal curtain, hakama, hem band,
  shield face, shield band, sandals.
- For each region store: the mask; its 1:1 crop; a square-padded crop for the
  IP-Adapter (so CLIP-Vision's 224 centre crop sees all of it, the fix of the
  round-1 method check section 2.2); Lab statistics (L quantiles 5/25/50/75/95,
  a* and b* mean and spread); and for rigid details (studs strip, obi knot and
  medallion, heart, closed fan, Logos disc, strap lens, both revolvers, Ormi shield
  face and band, topknot tassel, a hem tile) a cut-out with alpha.
- Output `atlas/<subject>/regions.json` + PNGs. This is the only source of truth
  for everything below; words describe regions, never replace them.

### Step 1. Generate the pose with region-bound conditioning (locks M2 and part of M3)

Same base as round 2 (Animagine XL 4.0 Opt, the subject's LoRA, xinsir OpenPose,
28 steps, cfg 6, euler_ancestral), with three changes:

1. **Region masks from the skeleton.** The OpenPose skeleton is already drawn per
   state with idle's bone lengths (`skeletons.py`, `draw-poses-r2.py`). From its
   keypoints, derive soft masks (Gaussian feather 24 px) for the regions the
   generator will draw: the waist band (between the hips and a point a quarter of
   the way up to the neck), the neck (keypoint 1 up to the nose), the head, each
   hand (a disc at each wrist), each foot (a box at each ankle), and for Ormi the
   shield disc (the skeleton places it). Masks are generous: they say "the obi is
   somewhere here", not its outline.
2. **Regional prompting with core nodes.** The global prompt keeps trigger, view,
   pose tags, framing and style, plus only the large-surface identity words (hair
   colour and cut, white dress, purple robe off the shoulders, bare legs). Each
   region's words move into its own `CLIPTextEncode` -> `ConditioningSetMask`
   (strength 1.0, `set_cond_area: default`) combined with `ConditioningCombine`,
   before `ControlNetApplyAdvanced`. Leblanc waist: `wide crimson obi, gold trim,
   obijime, single tassel`; neck: `studded choker, purple choker`; feet:
   `lavender lace-up ankle boots, open-toe boots, toes`. No colour word appears in
   more than one region, and no region word appears in the global prompt or in the
   negative (the negative loses `gold obi`, `red fan` and every other region noun;
   region negatives go with their region). Closed-eye states drop `purple eyes`.
3. **Regional IP-Adapter.** Keep round 2's global reference (square idle + head
   crop, concat, 0.3, ease in, 0.2 to 0.6). Chain one more `IPAdapterAdvanced` per
   locked mid-size region, each with that region's square crop from the atlas as
   its image and the skeleton-derived mask as `attn_mask`, weight 0.5, ease in,
   start 0.2, end 0.8. The window starts at 0.2 for the reason ART-PIPELINE gives
   (composition is decided in the first steps; start 0 captures the pose) and runs
   later than the global one because the region's surface is decided late. At most
   three regional adapters per render (obi, neck-and-head, feet for Leblanc) to keep
   VRAM near round 2's.
4. **ko skeleton for Leblanc.** `lying_r2` flings the fan arm "past the head along
   the ground", so the cheek lands on it: the sleep read is the skeleton's. The
   r3 ko keeps the arm out and away (angled down toward the hip side), with no limb
   keypoint within one head height of keypoint 0; the canvas is 1216x832 with a
   32 px margin to every keypoint's extremity.

6 seeds per state. **Automatic gate before any human looks** (numpy on the
cut-out, with SAM masks from step 2): head-to-body ratio within 8 percent of idle's
(the Logos judge's finding that no single scale fits both), one figure, the
expected number of weapons (connected components of the weapon colour near the
wrists), cut-out margin at least 16 px, the round-2 cut-out guard. Rejects are
logged, not looked at.

### Step 2. Masks on the generated frame (SAM 2.1)

Prompt SAM on the kept frame with points derived from the skeleton (the waist
mask centre for the obi, keypoint 1 for the choker, the ankles for the boots) and
snap to ink as the rig does. These masks are the exact outlines the next locks
work inside. A region SAM cannot find (IoU with its skeleton mask under 0.3) marks
the frame "region missing", which is itself a reject for that region.

### Step 3. Colour-statistics lock (M4), deterministic, 0 GPU

Inside each region mask, match the frame's Lab distribution to idle's same
region: L by quantile mapping (monotone, so the painted shading order is kept),
a* and b* by mean and spread. Clamp the correction (L shift at most 0.35, chroma
scale 0.6 to 1.4) and feather 4 px at mask edges. Figure-wide, clamp the median
saturation to idle's plus or minus 0.05. This is the lever for Ormi's 0.55 cloth,
Leblanc's indigo ko boots and robe, Logos's dark hurt dome and Logos's second
revolver (silver, not blued). Numbers are written to the frame's sidecar before
and after.

### Step 4. Finish lock (the Ormi flatness), one low-denoise pass

Whole-figure img2img at denoise 0.2 (28 steps, so 5 or 6 real steps), same LoRA
and OpenPose, and the idle square as reference through `IPAdapterAdvanced` with
`weight_type: "style transfer"` (installed; for SDXL this node applies a "style transfer" reference to
one attention layer only, index 6 in its layer map, so the pose is not captured) at 0.6, start 0, end 1.
Round 2's LoRA r1 is used here for Ormi if the pilot shows r2's cel bias survives.
The step exists because the Ormi judge's redo item 2 asks for exactly this
("an img2img pass at 0.15 to 0.25 denoise with idle as the IP-Adapter style
reference at a higher weight than 0.3") and nobody has run it. It runs **before**
step 5 so it cannot smear transplanted details.

### Step 5. Detail locks at a resolution the latent can hold (M1)

Two tools, chosen per region by size:

- **Crop-upscale regional repaint** (mid-size regions: obi band, face and eye,
  boots, hem, Logos helmet, Ormi topknot): crop the region's box plus 25 percent
  margin, scale it so its short side is 1024 (the obi becomes about 45 latent
  cells tall instead of 5.6), `VAEEncode` + `SetLatentNoiseMask` (the SAM mask,
  feathered) at denoise 0.35 to 0.45, the LoRA, the region's words only, and the
  region's own atlas crop as `IPAdapterAdvanced` reference at 0.6 (the burn that
  ruins a whole figure at 0.6 is, here, the region taking its reference's colour,
  which is the goal; the pilot measures line damage). Scale back with Lanczos,
  `ImageCompositeMasked` inside the mask only. 4 seeds per region; pick by the
  lowest region distance to idle (step 6 metric), then by eye.
- **Transplant** (rigid details under about 6 latent cells: choker studs strip,
  obi knot and medallion, heart, the closed fan, Logos disc and strap lens, both
  revolvers when the pose shows them whole, Ormi shield face and band, Ormi hem
  tile, topknot tassel): warp the atlas cut-out onto the frame. Correspondences
  from SAM outlines (fit a similarity or homography that maximises mask IoU; the
  shield is an ellipse-to-ellipse homography), bent where needed with the rig's
  per-triangle warp (`rig-v4lib.py`), then colour-matched to the local light by
  step 3's L mapping on a ring around it. **The transplant's interior is never
  repainted.** Only a seam ring (mask dilated 10 px minus eroded 4 px) is repainted
  by the crop-upscale tool at denoise 0.3. This is the Logos judge's redo item 1
  made into a rule.

### Step 6. Measure, then cut out, then judge

- Per region: Lab distance (CIEDE2000 between region medians) to idle's region,
  the shading-order check (Spearman correlation of L inside the region before and
  after steps 3 to 5, at least 0.8), and a seam energy check (mean gradient on
  each seam ring at most 1.5 times the gradient on a ring 12 px outside it).
- Pose kept: silhouette IoU between the step-1 frame and the final frame at least
  0.97 (the locks must not move the pose).
- Then the existing cut-out (rembg isnet-anime), the 16 px margin, the scale
  sidecar measured by head size **and** body length (the Logos judge's item 4),
  and the black-frame check.
- Then the independent 1:1 judge, bar 7 on every criterion, then the in-battle
  capture (`ingame.mjs`). Only then a sheet for Bailey.

---

## 3. Why it keeps identity

1. **The identity is in idle's pixels, not in any words.** Leblanc's approved idle
   was rendered from a prose prompt describing a different costume (stockings, a
   red-and-silver fan, a tasselled collar; `leblanc/idle.json`); what Bailey called
   "AMAZING" is what that seed happened to paint. No prompt can reproduce it, so
   the method stops asking words to carry the costume. Every locked region's
   reference is a crop of idle.
2. **Each region gets its own words and its own reference,** so a colour cannot
   drift onto the obi from the kimono (M2), and the reference for the obi is the
   obi, seen large, not a 224 px thumbnail of a whole figure in which the obi is
   6 px tall.
3. **Small details are copied, not redrawn** (M1). The studs, the disc and the
   shield band come out of the idle bit for bit; only their edges are painted.
4. **Colour is measured and set,** not hoped for (M4). An Ormi robe at 0.55 cannot
   leave step 3 at 0.55.
5. **The generator still draws the pose,** so the new silhouettes, folds and light
   stay painted rather than cut and pasted (pilot 2's method E failed exactly
   because the paste also carried idle's pose). The locks run after the pose
   exists and are checked not to move it (silhouette IoU).
6. **Nothing global runs after the details land.** The only whole-figure pass
   (step 4) runs before them.

---

## 4. Risks

1. **Regional IP-Adapter burn.** A 0.5 to 0.6 reference on a small, nearly single
   colour crop may dissolve lines inside the region (ART-PIPELINE's burn finding
   was global). Mitigation: the crop-upscale repaint is where the heavy reference
   runs, at 1024, and the pilot measures line damage (gradient energy inside the
   region against idle's). If step 1's regional adapters add nothing measurable,
   they are dropped and step 5 carries the load.
2. **Skeleton masks are wrong when the render leaves the skeleton.** OpenPose at
   0.6 to 0.9 lets the body wander. Mitigation: step-1 masks are generous and only
   bias conditioning; the exact work (steps 3 and 5) uses SAM on the actual frame.
3. **Transplants look pasted.** Idle's light comes from one side; a lunge may be
   lit from another. The ring colour match and seam repaint may not be enough on
   a large rigid part (Ormi's shield face). If the judge sees a sticker at 1:1,
   the shield goes to crop-upscale repaint with the shield crop as reference
   instead of a transplant.
4. **Foreshortened or hidden details.** A ko seen from the side hides most of the
   obi; a warped studs strip on a turned neck can bend wrongly. Transplant only
   what the frame shows (SAM mask coverage above 60 percent of the idle region's
   area after the fitted warp); otherwise crop-upscale repaint only.
5. **The method does not fix pose reading.** Leblanc hurt too mild, Logos hurt
   reads as firing, Logos ko with one leg and short legs: these come from the
   skeleton and the seed. The r3 levers there are skeleton geometry (ko arm away
   from the head, a harder hurt lean) and the automatic gate (head-to-body ratio,
   limb count); if a pose still reads wrong, the region locks cannot save it.
6. **Hard rule 6 is propagated, not solved.** Transplants copy idle's inventions:
   Logos's radial disc (the Syndicate logo shape is unsourced), Ormi's heartless
   shield (research 10.1 says the shield carries the heart), Leblanc's black closed
   fan. Consistency with idle is the bar; the canon questions stay Bailey's.
7. **Judged at 1:1, seen at about one seventh.** At 1600x900 Leblanc's idle is
   about 158 CSS px tall and her head about 25 px (`ingame-after.json`:
   0.145 screen px per texel); a choker stud is under one screen pixel, and hurt
   is on screen for about 340 ms (`PaintedActor.flinch`). The bar is still 1:1
   (Bailey judges close-ups), but the presenter's action-state bloom, which washes
   hair and face near white in every action state, costs more at game size than
   any paint defect here. It is a presenter issue (PR-0097 family), not art.
8. **Cost and the shared GPU.** Per state about 8 to 12 GPU minutes when it
   works; 12 Chapter 6 states is about two GPU hours plus judging. One prompt at a
   time behind the shared queue; ComfyUI is never restarted while a job is queued.
9. **Seed luck inside step 1 does not go away.** The gate removes the worst frames
   automatically, but a state may need two batches of six.

---

## 5. The pilot (at most 60 GPU minutes, one subject, two states)

**Subject: Leblanc. States: attack and ko.** Why: Leblanc is the subject whose
idle Bailey praised in his own words, so her bar is the clearest; her failures
are the smallest regions (obi, choker, eye, boots), the direct test of M1 to M3;
attack is the most frequent action state; ko is held on screen for the rest of the
fight and carries the second-review sleep read and the indigo boots.

**Two arms, so the pilot also says which half of the method matters.**

- **Arm A, locks on round 2's frames (steps 0, 2 to 6 only).** Start from the raw
  frames of the installed picks (`attack.r2.3`, seed 61603; `ko.r2.1`, 61901, in
  `D:/Tools/pyrefly-lora/leblanc/poses/`). If A alone reaches the bar on the
  region criteria, the generator does not need changing and every existing
  candidate across chapters 6 to 8 can be repaired this way.
- **Arm B, the full method (steps 0 to 6).** New renders with regional
  conditioning and regional adapters, the new ko skeleton, 6 seeds per state,
  then the same locks on the two best per state that pass the gate.

| Work | GPU minutes (at round 2's measured 17.5 s per full render, about 9 s per repaint, on a shared card) |
|---|---|
| Step 0 atlas + step 2 masks (SAM small, about 0.6 GB) | 2 |
| Arm A: step 4 (4 seeds x 2 states) | 2 |
| Arm A: step 5 (attack: obi, eye, choker ring, fan ring; ko: obi, boots x2, choker ring; 4 seeds each at 1024) | 8 |
| Arm B: step 1 (6 seeds x 2 states, about 25 s each with the extra adapters) | 5 |
| Arm B: steps 4 and 5 on the 2 best per state | 16 |
| Re-runs, one extra batch if the gate rejects all six | 12 |
| **Total planned / cap** | **45 / 60** |

Step 3 and step 6 are CPU. No training. No download: every model named is on
disk (`animagine-xl-4.0-opt`, `leblanc-x2-r2` and `leblanc-x2`,
`xinsir-controlnet-openpose-sdxl-1.0`, `ip-adapter-plus_sdxl_vit-h`,
`CLIP-ViT-H-14-laion2B-s32B-b79K`, `sam2.1_hiera_small.pt`, `RealESRGAN_x4plus`
if an atlas crop needs upscaling). The pilot writes to
`docs/concepts/chapters/leblanc/r3/leblanc/` and to
`D:/Tools/pyrefly-lora/leblanc/r3/`; it installs nothing and approves nothing.

### Success criteria (a 1:1 judge can check each one)

The pilot **proves** the method if, for the best frame of **both** states in
either arm, an independent judge (not the painter) scores every criterion of the
round-2 rubric at 7 or more against idle at 1:1, and these specific checks hold:

1. **Obi:** a wide crimson band with gold edges, one knot, one tassel ending in
   the round medallion; no navy, black or pink band; no second tassel or side
   cord. Obi region median within CIEDE2000 8 of idle's obi.
2. **Choker:** a row of at least 5 distinct studs visible at 2x.
3. **Face (attack):** no light strand crossing the near eye; the visible iris is
   purple.
4. **Boots (ko and attack):** lavender, boot region median within CIEDE2000 8 of
   idle's boots; open toes; no toe touching the cut-out edge (16 px margin).
5. **ko reads as knocked out, not asleep:** the cheek is not on the hand or arm
   (at least one head height between the face and the nearest hand).
6. **No visible seams** at 2x around any transplant (the judge looks), and every
   seam ring passes the gradient check (section 2, step 6).
7. **The locks did not move the pose:** silhouette IoU at least 0.97 between the
   step-1 frame and the final frame; the pose still reads as its state.
8. **In battle:** head within 5 percent of idle's on screen, as round 2 measured.

The pilot **kills** the method if the best frame of either state still scores 6
or below on obi, choker, boots or colour after the locks (the criteria the method
exists for), or if transplants read as pasted at 1:1 in both states. It **splits**
the verdict if region criteria pass and only pose criteria fail: then the locks
are adopted and the pose question goes back to the skeleton work. Arm A passing
alone means step 1's changes are dropped (cheaper everywhere).

---

## 6. What it covers in chapters 6 to 8

| Chapter | Subject | Covered? |
|---|---|---|
| 6 | Leblanc attack, cast, hurt, ko | yes, the pilot subject |
| 6 | Logos attack, hurt, ko (cast already at 7) | yes: disc and lens transplant, helmet value lock, revolver transplant and count gate; ko also needs the skeleton and body-length gate (risk 5) |
| 6 | Ormi attack, cast, hurt, ko | yes: cloth value lock and finish lock are the main levers; shield face and band transplant; hem tile transplant; topknot tassel transplant. Ormi's round-1 cast (judged 7) is a valid Arm A input |
| 6 | Dr. Goon, Fem-Goon | **no.** They have no painted idle to lock to. They need an end-state options round and Bailey's pick of an idle first (AGENTS.md rule 9); after that, the method applies |
| 7 | Seymour (Macalania), Guado Guardian | **after their idles pass.** Their pose sets exist, but the idles were judged 4 to 6 and 6 and are not approved; the locks copy the anchor, so the anchor must be at the bar first. The Guardian idle is near-monochrome (it trips the whole-figure reference guard); region crops do not have that problem, so the method suits it better than round 2's recipe did |
| 7 | Anima | nothing to do: reuses an approved aeon painting |
| 8 | Evrae hurt, ko, breath-charge, and the missing attack | **partly.** Evrae's idle-near (8) and idle-far (7) passed the independent judge and are the anchor. OpenPose has no dragon skeleton, so step 1's pose comes from a sketch or puppet init by img2img (as the Evrae redo did); steps 0 and 2 to 6 apply unchanged (region colour for the teal body and fins, transplants for the head crest and fin tips). The attack painting is a new state and gets the same stack |

Across both games: any FFX subject with an approved idle can use the same steps;
the regions and words are per subject, as hard rule 14 asks.

---

## 7. What Bailey would see

One sheet per state (attack, ko), nothing installed: **idle | round 2's installed
pick | the Arm A result | the Arm B result**, whole, then 1:1 rows of face and
eyes, choker, obi, boots and fan with idle's crop first, each labelled with its
measured distance to idle; below it the same frames captured in the running
Chapter 6 battle. With it, a three-line note: which arm won, what the independent
judge scored, and the recommended next step (roll the method out to Leblanc's
other two states, then Logos and Ormi, or stop). If the pilot fails, Bailey sees
the same sheet and a plain statement that constraining the generator did not
close the gap, so the next proposal is a different family (for example animating
the approved idle rather than repainting it), not a fourth round of this one.

## 8. Files

- This proposal: `docs/plans/art-method-r3/proposal-constrain-the-generator.md`.
- Evidence read: `docs/plans/leblanc-art-method-check.md`;
  `docs/concepts/chapters/leblanc/pilot2/{pilot2,judge}.md`;
  `docs/concepts/chapters/leblanc/lora/{leblanc,logos,ormi}/round2/{round2,judge}.md`
  and `sheet.jpg`; `.../lora/leblanc/dataset-r2.md`;
  `.../lora/leblanc/poses/{render,repaint}.mjs`, `skeletons.py`;
  `docs/ART-PIPELINE.md` sections 1 and 3; `public/art/characters/{leblanc,ormi,logos}/idle.json`;
  `src/engine/PaintedActor.ts` (`setPose`, `flinch`), `BattlePresenterEvents.ts`
  (`TIMING`); `tools/gen/rig-sam.py`; `docs/handoff/living-portrait-v4.md`;
  `ComfyUI_IPAdapter_plus/IPAdapterPlus.py` (`attn_mask`, `style transfer`).
- The measurements in section 1.2 (M4) were taken with a scratch numpy script on the
  installed PNGs and the round-1 backups in
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/<subject>/replaced/`
  (not committed).
