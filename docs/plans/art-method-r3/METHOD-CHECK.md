# Art method check r3: the chosen method, the pilot and Bailey's options

Paper only, 2026-09-23. Nothing was rendered, trained, queued or downloaded. `public/art`,
`approved-hashes.json`, `src/` and `tests/` were only read. Inputs: the three proposals in
this folder, two independent judges (both rank the same way: change-the-question 7.6 / 7.8,
derive-from-idle 6.3 / 6.5, region locks 5.9 / 5.8), the round-2 judge passes (`0c46fc2`
Leblanc, `5ed7a7a` Logos, `c71b595` Ormi), `docs/plans/leblanc-art-method-check.md`, the
round-2 sheets (looked at), and the engine. I re-checked the load-bearing claims myself:
`poseForCommand` (`src/engine/BattlePresenterEvents.ts:392`) maps only `attack`/`overdrive`
to the attack pose; the Syndicate AI returns `kind: 'ability'`; FFX `use()`
(`src/battle/ffx/ai/types.ts:70`) falls back to `attack` only for an unregistered id; an enemy
`ko()` is `dissolveTo(1, TIMING.ko = 620)` then `removeCombatant`
(`BattlePresenterBeats.ts:127-140`); `POSE_FALLBACKS` covers a missing attack or ko
(`BattlePresenterActors.ts:252`); Ormi's round-1 `cast.png` (seed 960106) is in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/ormi/replaced/`; SAM 2.1 small is at
`D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt` (not `D:/Tools/sam2/` as one proposal says).

**Which game (hard rule 14).** The method and the state map are shared plumbing: **both**
games. Subjects are per game: chapter 6 (Leblanc, Logos, Ormi, Dr. Goon, Fem-Goon) is
**FFX-2 only**; chapters 7 (Seymour, Guado Guardians, Anima) and 8 (Evrae) are **FFX only**.
The pilot is FFX-2 (Leblanc).

## 1. Root causes of the round-1 and round-2 drift

Round 1's causes were found and fixed by the first method check: identity words described a
costume the idle does not wear, CLIP-Vision's centre crop never saw the face, the framing
words fought the pose. Round 2 (identity LoRA + xinsir OpenPose + masked repaints) fixed
every named defect and grew new ones of the same kind (Leblanc 6/6/5/6 -> 6/6/6/5, Logos
6/6/5/5 -> 6/7/6/5, Ormi 5/7/4/4 -> 6/5/5/4; order attack/cast/hurt/ko). What is left is
structural:

| # | Cause | Evidence |
|---|---|---|
| C1 | **Every state repaints every pixel, and the failing details are smaller than the latent can hold.** At 832x1216 the SDXL latent is 104x152. | Leblanc obi about 5.6 latent cells tall, choker about 2, a stud under 1; Logos disc about 6; Ormi shield band 5, stud under 1. These are exactly the parts the judges failed. Leblanc's obi drifted in all four r2 states in three different ways (navy, narrow pink with a second tassel, no knot). |
| C2 | **Colour words bind to the wrong noun** in a 30-tag identity block. | Pilot 2: `gold sash ornament` turned the obi gold "in nearly every final candidate"; r2 put `crimson obi` next to `purple tassel, purple kimono` and got navy and pink bands. |
| C3 | **The LoRA learned from its own drift and saw the idle less.** | R2 added round-1 pose renders (all off-model somewhere) to the datasets; Leblanc idle-sample steps fell from about 1,430 to about 690. The judge: adding the round-1 poses "did not hold the obi". Ormi's r2 set inherited a flat cel finish from cel-shaded pose images. |
| C4 | **Region colour and finish were never measured**, so nothing pulled them back. | Ormi purple median lightness: idle 0.21, r2 0.23 / **0.55** / 0.26 / 0.41, r1 0.27 / 0.30. Leblanc robe 0.64 in idle, 0.81 to 0.82 in three r2 states, 0.40 in ko (indigo boots). |
| C5 | **A masked repair invents again inside its own mask.** | The Logos disc paste repainted at 0.55 "turned the disc into a lens"; the Ormi ko badge erase left a rainbow smear. |
| C6 | **Proportions come from the skeleton and prior, and one sidecar scale cannot fix head and body.** | Logos hurt and ko bodies at 80 and 77 % of idle's height with the heads matched. |
| C7 | **We painted states the game does not show.** | 0 of 1,699 enemy actions across 100 simulated chapter 6 to 8 battles use the attack pose (engine run, proposal-change-the-question §1.1; code re-checked above). An enemy ko shows for under 620 ms inside the pyrefly dissolve. Attack was a quarter of every round's work. For the trio and the Guardians a lying KO is also the wrong picture (`research/ffx-vs-ffx2-presentation.md` §3.2-3.3: "beaten, still standing"). |
| C8 | **The anchors are not locked.** | `approved-hashes.json` has no entry for Leblanc, Logos or Ormi; Logos, Seymour and Guardian idles are `status: CANDIDATE`. Anything derived inherits whatever Bailey later decides about the idle. |

The common thread of C1 to C6: the only pixels guaranteed on model are the idle's, and every
round asked a sampler to remember them. The method below copies them instead, and paints only
where the game needs a new picture.

## 2. The chosen method: "state map + idle-pixel repair"

The judges' winner (change the question) is the frame. Grafted from region locks (R3-L): the
SAM region atlas, the Lab quantile colour lock, crop-upscale for the seam band, the automatic
pre-judge gate and the per-region CIEDE2000 and seam-gradient checks. Grafted from
derive-from-idle (method R): the provenance map, sidecar scale 1.0 by construction, the rig
bake for hurt, and (shelved) the hybrid transplant and Evrae's neck-spline derive.
**Dropped:** R3-L arm B (regional conditioning and regional IP-Adapters: costliest, least
tested, still a seed lottery); R's pure-derive attack; any whole-frame video or edit model
(Wan, Klein), which regenerate every pixel (C1).

**Step 0, anchors (no GPU, Bailey).** Bailey locks each idle; only on his word does its sha256
go into `approved-hashes.json`. The hard-rule-6 questions are answered once, at the idle:
Leblanc's fan (idle black and closed; research red and silver; the concept pick B "fan fully
open, warm magenta"), Ormi's shield heart (research has it, idle has none, r1 cast.960106 has
one), Logos's radial disc (unsourced). Run `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`
before and after every pass.

**Step 1, the state map (no GPU, Bailey decides; section 4).** Recommended default A:

| State | Ships as |
|---|---|
| idle | the locked painting |
| cast | **one hero painting per subject**, 1:1 bar 7 on every criterion (every enemy action; about 0.8 s plus any charge bar) |
| hurt | derived from the idle: (a) no file (the engine's `hurt -> idle` fallback plus its flinch, flash, shake), or (b) a rig bake of the idle's own pixels, shipped only if it reads better than (a) |
| attack | not shipped (never drawn; counters fall back to idle plus the 280 ms lunge) |
| ko, trio, Guardians, goons | not shipped (falls back to hurt or idle) until the departure decision |
| ko, Seymour (`'body'`) | optional, one hybrid painting, only if Bailey wants the fallen body |
| ko, Evrae (`'falls-away'`) | motion of the existing plate, not a painting |

**Step 2, the hero cast: nearest pass + idle-pixel transplant.**
1. *Base.* Logos: installed r2 `cast.png` (independent 7). Ormi: restore r1 `cast.960106`
   from the backup (independent 7; the `c71b595` judge recommends it). Leblanc: installed
   `cast.png` = `cast.r2.2` (6 on obi and choker only; fan, face, pose 8).
2. *Region atlas.* SAM 2.1 hiera-small with point and box prompts, loaded as in
   `tools/gen/rig-sam.py` (ComfyUI embedded python; CPU if the card has under 2 GB free),
   edges snapped to the ink with `rig-lib.py` `geodesic_labels`. Masks on idle and on the
   base: for Leblanc the obi band, knot, tassel with medallion, choker. Store each region's
   mask, 1:1 crop and Lab quantiles (L 5/25/50/75/95, a* b* mean and spread).
3. *Warp.* 6 to 10 hand-placed landmarks per part (band corners, knot centre, tassel tip,
   choker ends); piecewise-affine warp with the Delaunay + `cv2.remap` code of
   `tools/gen/rig-flow.py` (run with `D:/Tools/sd-scripts/.venv/Scripts/python.exe`, the
   only python here with OpenCV); thin-plate bend along a curved waist via `rig-v4lib.py`.
   Warp on a 2x Lanczos canvas and come down once.
4. *Light match.* Lab quantile lock of the transplant to the base's local light, measured on
   a ring just outside the mask (monotone L mapping, L shift at most 0.35, chroma 0.6 to 1.4).
5. *Seam only.* Feathered paste (3 to 6 px). Repaint **only** the band mask dilated 10 px
   minus eroded 4 px, on a crop of the region plus 25 % margin upscaled to a 1024 short side
   (so the obi is about 45 latent cells, not 5.6). Graph: a pilot copy of
   `tools/gen/lora-repaint.mjs` (the shared tool is untouched): Animagine XL 4.0 Opt,
   `leblanc-x2-r2` at 0.8, `ip-adapter-plus_sdxl_vit-h` on idle square-padded + head crop at
   0.3, `VAEEncode` + `SetLatentNoiseMask`, denoise 0.25 to 0.35, 4 seeds, words naming only
   what the band shows. Lanczos back, `ImageCompositeMasked` in the band only.
6. *Re-paste the interior* so the part is the idle's pixels exactly; the model owns only the
   seam.
7. *Gates, then the judge.* MAD 0 outside mask + band; per-region CIEDE2000 of medians
   against idle; seam gradient on the ring at most 1.5x the ring 12 px outside; invented-colour
   share (pixels more than dE 10 from every idle colour) at most 1 % in the region; automatic
   pre-judge gate (head-to-body within 8 % of idle, weapon count, 16 px cut-out margin, the
   existing cut-out guard). Provenance map per file (grey idle unchanged, blue idle warped,
   amber fill, magenta generated). Then an independent 1:1 judge, then the driver looks, then
   the in-battle capture.

**Step 3, the derived hurt.** Control (a): no file. Bake (b): SAM part masks of idle (head
and hair, torso, near arm with fan, far arm, sleeves, legs); joint rotations as landmark moves
(upper body back 10 to 14 degrees about the hips, head back 8 to 12, fan arm down 20 to 30);
the same warp; revealed holes pre-filled with `tools/gen/rig-fill.py` / `rig-underfill.py`
and repainted with the step-2 graph at 0.3 to 0.45 over at most 10 % of the opaque area; a
closed-eye wince painted into an eye box only, as `tools/gen/rig-lids2.py` did for Yuna
(0.5 to 0.6, 4 seeds). `baselineY` is idle's and the sidecar `scale` is 1.0 by construction
(C6 cannot happen).

**On the shelf (only if Bailey picks B or wants a Seymour body KO):** R3-L arm A on the
existing r2 attack frames (Lab lock + rigid-part transplants, no new render); R's hybrid
(render for geometry, transplant idle's rigid parts, Lab-grade the cloth) for a lying KO;
R's neck-spline bend of Evrae's `idle-near` (judged 8) for any Evrae pose.

## 3. The pilot: Leblanc, cast (repair) and hurt (control vs bake)

Leblanc because Bailey named her bar and her failures are the smallest regions. Cast tests
the transplant; hurt tests the derive against doing nothing. Scripts and sheets go to
`docs/concepts/chapters/leblanc/r3-method/`, scratch to `D:/Tools/pyrefly-lora/leblanc/r3/`.
Nothing installed or approved. Precondition: step 0 answered, or at least the Leblanc idle
provisionally named the anchor by Bailey (otherwise the pilot measures against a moving
target).

| # | Command-level step | GPU min |
|---|---|---|
| P0 | `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`; GPU gate: `GET http://127.0.0.1:8188/queue` empty for 3 minutes; one prompt at a time; never restart ComfyUI | 0 |
| P1 | `D:/Tools/ComfyUI/python_embeded/python.exe -s r3-method/atlas.py` (new, patterned on `rig-sam.py`): SAM masks for idle (obi, knot, tassel, choker + six rig parts) and `cast.r2.2` (obi, knot, tassel, choker); Lab stats to `atlas.json` | 2 (0 on CPU) |
| P2 | `D:/Tools/sd-scripts/.venv/Scripts/python.exe r3-method/transplant.py --landmarks cast-landmarks.json` (warp as `rig-flow.py`, Lab ring lock, feathered paste) | 0 |
| P3 | `node r3-method/seam-repaint.mjs --region obi,choker --crop-upscale 1024 --lora leblanc-x2-r2:0.8 --ip 0.3 --denoise 0.25,0.35 --seeds 4` (copy of `lora-repaint.mjs`), then interior re-paste | 3 |
| P4 | `python r3-method/hurt-bake.py --pose hurt.json` (warp, `rig-fill.py` plan/merge), then `seam-repaint.mjs` on joints and holes (2 passes x 4 seeds), then the eye wince (2 variants x 4 seeds) | 5 |
| P5 | `python r3-method/gates.py`: MAD, CIEDE2000, seam gradient, invented-colour share, head chord, height, provenance maps; 1:1 sheet | 0 |
| P6 | one re-run of P3 and P4 after the first look | 10 |
| P7 | in-battle capture at 1600x900: a copy of `lora/leblanc/round2/ingame.mjs`, `PYREFLY_BROWSER=gpu`, own Vite port in 5400 to 5990, candidates swapped from a scratch copy: idle, cast, mid-flinch of (a) and (b) | 2 |
| | **Planned / hard cap** (summed ComfyUI execution time from the history API) | **22 / 60** |

**Pass, judged by an independent judge at 1:1 and 2x against `leblanc/idle.png`, bar 7:**
1. Cast obi and choker at least 7: a wide crimson sash with gold edges, one knot, one purple
   tassel with its round medallion, a row of at least 5 studs; every other criterion no lower
   than in `0c46fc2` (fan, face, pose 8).
2. Cast outside mask + band equals `cast.r2.2` (MAD 0); obi and choker region median within
   CIEDE2000 3 of idle's; invented-colour share at most 1 % in the region (today 4.7 % over
   the whole cast); no seam the judge can name at 2x; seam gradient check passes.
3. Hurt (b) at least 7 on every criterion including "reads as hurt" (recoil, eyes shut) and
   anatomy (no stretched sleeve, no broken wrist); idle share (grey + blue) at least 90 %;
   head chord 100 +/- 2 % of idle's; standing height at least 95 %.
4. At game size the driver compares (a) and (b) side by side: (b) ships only if it reads more
   clearly as a hit; a tie goes to (a).

**Kill:** after the one re-run, obi or choker still at 6, or the band re-invents the part
(region invented-colour share over 1 %): the local transplant is dead, and a hero cast then
has to come from a fresh render judged as now; that is a written rule-15 note, not a fourth
render round. (b) failing 3: the bake is dead and hurt ships as (a). A visible hinge or
paper-card look at 1:1 kills (b) even if the scores pass. 60 GPU minutes reached: stop and
report what exists. The state map in step 1 stands whatever the pilot shows.

## 4. Bailey's options (end state first)

These are design choices, not the agent's (hard rules 9 and 10). Bailey sees one decision
page before the rollout: each option shown **at game size in a 1600x900 battle frame and at
1:1**, built from files that already exist (idle, r2 and r1 candidates, the pilot output), so
it needs no new rendering. His reaction goes into the tile's `reaction` (liked / disliked /
must remain / must change / undecided); guesses stay under `inferred`.

**Decision 1, how many paintings each boss gets**
- **A. Fewest paintings (recommended).** In play: Leblanc stands in her approved idle, fan at
  her lips. Each time she acts, she snaps into the fan-open cast painting for about a second
  under the cyan flash, then the camera cuts to the target. Each hit: the idle itself recoils
  for 0.36 s under the warm flash (eyes shut and bent back, if the bake wins). Same for Logos
  (guns up) and Ormi (the shield). Nothing else changes on screen, because attack is never
  shown today. Cost: the smallest; three of the five chapter 6 casts are one repair away.
- **B. A plus attack paintings.** A presenter change sends physical specials (Fan Slap,
  Double Shot, Shield Bash) to an attack pose, so each boss shows two distinct action
  paintings. More variety for a showpiece; about 1.5 to 2 extra GPU hours and one more
  painting per subject to bring to 7.
- **C. Engine only.** No painting beyond the idle: every action and hit is the idle with the
  engine's lunge, flash, tint and shake. Identity is perfect; the fights read as less
  animated.
- **D. A with rig motion instead of a hurt painting.** Cast is painted; hurt is a short warp
  animation of the idle's own pixels (the living-portrait rig), not a still. Most alive, most
  authoring time, and the rig's seams are the known risk.

**Decision 2, how the humans leave** (a presenter change for both games; needs a yes)
- **Today:** every enemy falls and dissolves into pyreflies in 620 ms. The research says this
  is wrong for Leblanc, Logos, Ormi and the Guardians ("living humans").
- **Yields:** the beaten figure stays standing in its hurt (or idle) plane, dims, and steps
  back out of frame; Seymour at Macalania falls and stays down (`'body'`); Evrae drops out of
  frame alive (`'falls-away'`); Anima is dismissed.
- **Painted KO:** keep a lying painting for everyone (the current direction), which costs the
  most and contradicts the research for four subjects.

**Decision 3, the anchors:** lock these idles (yes / no each), and the fan colour, Ormi's
heart and Logos's disc (step 0). The chosen method copies whatever the idle has.

## 5. Order and GPU hours if the pilot passes

Estimates at round 2's measured 17.5 s per render and about 9 s per repaint on the shared
card, with one re-run each. Anchors and Bailey's picks come first in every chapter.

| Order | Work (game) | GPU hours |
|---|---|---|
| 1 | Pilot (FFX-2) | 0.4 (cap 1.0) |
| 2 | **Chapter 6 (FFX-2):** restore Ormi `cast.960106` and keep Logos r2 cast (both re-judged against the locked idles, 0 GPU); Leblanc cast = pilot output; hurts for Logos and Ormi (bake or none); remove attack and ko files after Bailey's pick, backup first | 0.4 |
| 3 | **Goons idle options round (FFX-2)** in parallel: 2 to 4 idle options each with the D-027 close-up recipe, Bailey picks, then one hero cast each or none (option A allows cast = idle) | 0.6 to 1.0 |
| 4 | **Chapter 8 (FFX), before 7** because Evrae's anchor already passes (idle-near 8, idle-far 7): repair the breath-charge (judged 6) with the Lab lock + transplant, or re-derive it from idle-near by neck spline; hurt bake; no attack (its counters are Haste); ko as falls-away motion (presenter, no GPU) | 0.5 to 0.8 |
| 5 | **Chapter 7 (FFX):** Seymour and Guardian idles must reach the bar first (judged 4 to 6 and 6): an idle options round, Bailey picks; then one hero cast each (repair the installed candidate if a judge puts it at 6 or more, else a fresh render + repair); hurts; optional Seymour body KO by R's hybrid; Anima reuses the approved aeon set | 2.0 to 2.5 |
| | **Total, option A** | **about 4 to 5** |
| | Option B adds (attack by R3-L arm A on r2 frames, fresh renders + repair for chapter 7) | +1.5 to 2 |

For comparison, region locks alone costed about 2 GPU hours for chapter 6's 12 states.

## 6. What stays unknown

- Whether a warped obi reads flat on a cast whose arm and torso angle differ from the idle's
  (the warp handles scale and shear, not new folds). The judge's style and anatomy criteria
  decide; nobody has tried it.
- Whether the zero-file hurt reads as a hit at all, and whether a 10 to 14 degree bake reads
  as a hurt pose or as a tilted card. The pilot measures both.
- Whether Seymour's and the Guardians' idles can reach the bar, and what the goons look like:
  no pose method helps until those anchors exist. This, not the pose method, gates chapter 7
  and the goons.
- The Guardians logged no `ko` in the simulated runs (untraced), and a Confused or Berserk
  enemy reaches `kind: 'attack'` through `src/battle/ffx/ai/index.ts:241`: it draws the idle
  with the lunge via the fallback. Not a blocker, not measured.
- Bailey's answers to the fan colour, heart and disc (hard rule 6), and whether a showpiece
  wants attack variety (option B).
- The presenter's action-state bloom washes Leblanc's face near white at game size (the
  `0c46fc2` judge; PR-0097 family). It costs more in play than any paint defect here and is
  outside this method.
- Chapter art tests (`tests/unit/chapters/leblanc-art.test.ts`,
  `chapters-6-7-8-enemy-sprite-manifest.test.ts`) may expect all five pose files; dropping
  files may need a test change at install time (the driver's).
- GPU contention on the shared card, and whether the one re-run is enough. The 60-minute cap
  bounds the pilot, not the rollout.
