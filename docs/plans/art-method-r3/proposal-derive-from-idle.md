# Art method check r3, proposal: derive the poses from the idle, do not repaint them

Paper only (2026-09-23). Nothing was rendered, trained, queued, downloaded or installed
for this file; `public/art`, `docs/target/approved-hashes.json`, `src/` and `tests/`
were only read. The numbers below were measured on the files on disk with small PIL
scripts, or read from the committed round-2 reports and judge passes.

**Which game (AGENTS.md hard rule 14).** The method and its tools are shared plumbing,
so they apply to **both** games. The subjects it is applied to are per game: chapter 6
(Leblanc, Ormi, Logos, Dr. Goon and Fem-Goon) is **FFX-2 only**. Chapters 7 (Macalania:
Seymour, the Guado Guardians, Anima) and 8 (Evrae) are **FFX only**. The pilot is FFX-2
(Leblanc).

**Why this check is owed (hard rule 15).** Two rounds left the same issues open:

| Subject | Round 1 (judged) | Round 2 (judged 2026-09-23) | Still open |
|---|---|---|---|
| Leblanc | 6 / 6 / 5 / 6 | 6 / 6 / 6 / 5 (`0c46fc2`) | the obi (a navy or pink band where idle has a wide crimson sash), the choker studs, a white strand over the attack eye, the ko boot colour, the ko "asleep on the hand" read (second review) |
| Logos | 6 / 6 / 5 / 5 | 6 / **7** / 6 / 5 (`5ed7a7a`) | the disc emblem, helmet shading and crown, snub or missing revolvers, both guns blued, sash knot, hurt and ko bodies at 80 and 77 % of idle's height |
| Ormi | 5 / 7 / 4 / 4 | 6 / 5 / 5 / 4 (`c71b595`) | cloth lightness 0.55 against idle's 0.21, flat cel finish, shield rim and studs, hem diamonds, the topknot tassel (third review), the shield missing on ko |

The order is attack / cast / hurt / ko. The bar is 7 on every criterion at 1:1.

---

## 1. Root causes, with evidence

The first method check (`docs/plans/leblanc-art-method-check.md`) fixed the causes it
found: the identity text described the wrong costume, the adapter only saw the middle
of the body, and the framing words fought the pose. Round 2 added an identity LoRA and
OpenPose. It fixed every defect a judge had named, and new defects of the same kind
appeared. What is left is structural, not a missing word or weight.

### 1.1 Every state is a new sample, so every detail is drawn again

Each state is sampled from conditioning: words, a LoRA at 0.75 to 0.85, and IP-Adapter
at 0.3. Nothing in that stack holds the idle's pixels. It holds a distribution that
contains the idle. The large, frequent features (blonde bob, white dress, purple robe,
Logos's dome, Ormi's bald head) are in that distribution and come back every time. The
small, specific features are not held, and they are exactly what failed at 1:1: the
obi's width and hue, a row of choker studs, a scalloped radial disc, one blued and one
silver revolver, a red studded shield band, a diamond hem, a topknot tassel. Each render
draws them again from a prior that has several plausible versions.

Evidence: the Leblanc r2 judge found the obi drifted in **all four** states, in three
different ways (navy on attack and ko, a narrow pink band on cast, no knot on hurt).
Round 1's picks had held it. The Ormi judge found the topknot tassel missing in three of
four states for the third review running, "the r2 LoRA drew it at the step pick in the
idle pose, but not in these frames".

### 1.2 The LoRA learned from its own drift

Round 2 grew the Leblanc dataset from 11 to 29 samples an epoch. It added 8 crops of
round-1 pose renders (`round2.md` §1), and Logos's grew from 16 to 21 the same way. Those
renders were chosen because they scored 6 or more, which also means they were off-model
somewhere. The judge: "Adding the round-1 poses to the dataset did not hold the obi."
With a dataset of about a dozen true images, every extra generated image pulls the
identity away from the idle.

### 1.3 The finish and value are the sampler's, not the idle's

Ormi's purple cloth has a median lightness of 0.21 in idle. It is 0.24 / **0.55** /
0.27 / 0.41 in round 2 (judge's measurement). "One finish" held across the round-2 set,
but it was the sampler's flat cel finish, not idle's painterly one. The idle was painted
by an earlier recipe (method F, before any LoRA), so any fresh sample from the LoRA
recipe differs in finish, whatever the words say.

### 1.4 Proportions drift, and a single sidecar scale cannot fix both head and body

Logos r2 hurt and ko draw the head 15 to 25 % larger relative to the body than idle
does. With the heads matched in battle, the bodies stand at 80 % and 77 % of idle's
height (Logos judge, "Scale in a running battle"). The skeleton and the checkpoint's
priors set the proportions, and the sidecar `scale` can match only one measure.

### 1.5 A local repair invents again inside its mask

Masked repaints were the right tool, but each one draws from the same prior. The
disc paste repainted at 0.55 "turned the disc into a lens" (Logos judge). The ko
badge erase left "a blurred rainbow smear" and a straight cut (Ormi judge). Each round
fixes the named defect and adds a new one somewhere else, which is the stall rule 15
describes.

### 1.6 What the premise gets right, and one caveat

The only pixels guaranteed to be on model are the idle's. The pilot-2 method E result
already points this way: a crude PIL puppet of idle, repainted whole at denoise 0.6 to
0.7, gave "the most on-model costume of the whole pilot (robe, white dress, bare legs,
open-toe boots, platinum hair)", but "the pose collapsed back to the paste"
(`pilot2/pilot2.md`, rows E1 to E4). E failed because the **whole frame** went back
through the sampler at a high denoise with no LoRA. The sampler then pulled the
silhouette back toward a standing figure, and the words turned the obi gold. This
proposal keeps what E got right (the idle's pixels) and removes what failed (a
whole-frame re-sample). The pose comes from geometry, and the sampler touches only small
masks.

**Caveat on the anchor.** None of the three chapter-6 idles has an entry in
`docs/target/approved-hashes.json`: the Leblanc set was withdrawn in `573ea00`. The
Logos idle's sidecar says `status: CANDIDATE`; it is the round-3 idle with a repainted
hand. Bailey's words (D-027, "AMAZING ... exactly the kind of quality i expect") praised
the Leblanc **close-up** renders' quality, not this idle file. Under this method, every
flaw in the idle is copied into every state. That makes the set consistent, but not
correct. So step 0 of the method is that Bailey locks each idle, and the open hard-rule-6
questions are answered once, at the idle: Leblanc's black closed fan against research
§10.1's red and silver, Ormi's heartless shield against §10.1's heart, and Logos's
invented radial disc.

---

## 2. How the engine shows a pose (what the painting must do)

Read from `src/engine/PaintedActor.ts`, `BattlePresenterBeats.ts` and
`BattlePresenterEvents.ts`, and from the round-2 in-battle captures
(`lora/leblanc/round2/ingame-after.json`, `lora/logos/round2/ingame-after.json`):

- **Size.** At 1600x900 on the chapter-6 `enemy` camera, Leblanc's idle is **158 CSS px
  tall** (82 px wide), and Logos's is 156 px. One screen pixel covers about **7 texels**
  (`screenPxPerTexel` 0.145 and 0.138). The head is 22 to 25 screen px across. The
  action punch-in (`moments.actionOpen`, `MOMENT_PUSH.action`) enlarges this a little.
- **Swap.** `setPose` crossfades between two planes in **120 ms** (`crossfadeMs`
  default). Every pose shares idle's pixel scale (`computePoseScale`), times the sidecar
  `scale`.
- **attack** runs from `action-start` to `action-end`: `actionStart` 380 ms or `windUp`
  220 ms, then the hits (`perHit` 190, `damage` 240), then `settle` 200. That is roughly
  0.8 to 1.2 s on screen. The engine adds its own `lunge(1.4, 440)` and
  `squash(260, 0.45)`.
- **cast**: 380 ms plus the effect, with a `flash(0x9fd8ff, 560)`.
- **hurt** is a **340 ms** flinch (`recoil` → `flinch`) with a warm tint and a
  knock-back of 0.28. Then the pose goes back to what it was.
- **ko, for an enemy** (all of chapters 6 to 8 are enemies): `ko()` calls
  `dissolveTo(1, 620)`. The `ko` pose is set, the fall starts (300 ms, a 0.3 rad tilt,
  a small drop), and the pyrefly dissolve begins about 155 ms later and runs to the end
  of the 620 ms. **An enemy's ko painting is on screen for well under a second, while
  it dissolves.** A party member's ko is held.
- The pose chain `ko → hurt → idle` (`BattlePresenterActors.ts:259`) means a subject
  with no ko painting falls in its hurt painting.

What this means for the method: the engine already supplies the motion (lunge, squash,
knock-back, fall). The painting has to supply a silhouette that reads as the state
within about 1 s at 160 px, and a face and costume that are the idle's. Because the two
planes share their pixels, a derived pose also crossfades as **one figure moving** rather
than two paintings swapping, and the costume never changes during the 120 ms fade.

---

## 3. The method: derive (a cut-out rig of the idle), fill only what the pose reveals

Name: **method R (rig)**. Four layers of work, cheapest first. The sampler only ever
paints inside masks that the provenance map records.

### Step 0: lock the anchor (no GPU)

- Bailey confirms each subject's idle as its anchor, and answers the hard-rule-6
  questions once (fan colour, shield heart, disc). Only on his word does the idle's
  sha256 go into `approved-hashes.json`.
- Run `D:/Tools/pyrefly-lora/tools/verify-approved.mjs` before and after every pass,
  as the r2 passes did.

### Step 1: cut the idle into parts (SAM 2.1, about 1 GPU minute or CPU)

- **Tool:** `D:/Tools/sam2/sam2.1_hiera_small.pt`, using the prompt pattern of
  `tools/gen/rig-sam.py`: positive points on the part, negative points on its
  neighbours, a box, and ComfyUI's embedded python. SAM small needs about 0.6 GB and
  falls back to the CPU when the card is busy. Each mask is snapped to the ink with
  `rig-lib.py`'s `geodesic_labels`, and the rig-sam edge score picks raw or snapped per
  part.
- **Parts:** one layer per rigid or near-rigid piece, each with a z-order and a pivot.
  Joint positions are read at 2x on `tools/gen/yaw-keys-sheet.py grid`.
  - *Leblanc:* head and hair; choker and neck; torso (dress, heart, obi with its knot,
    tassel and medallion as one layer); near upper arm, forearm, and hand with the
    closed fan (one rigid piece); far arm; each wide sleeve; the robe's back panel,
    left drape and right drape; each thigh, shin and boot.
  - *Logos:* helmet and head; torso (strap, lens, disc, sash); each upper arm,
    forearm, and fist with its revolver (rigid: the blued one and the silver one stay
    themselves); each sleeve; the robe skirt and sash tail; the hakama; each wrapped
    shin and slide.
  - *Ormi:* head, topknot and tassel; the shield (one rigid prop, idle's own rim,
    studs, red band and sunburst); the crossed arms as one layer; the torso and sash;
    the hakama skirt with its diamond hem; the feet.
- **Check:** recompose every part in z-order. The result must equal the idle to the
  pixel (MAD 0, the living-portrait rest-pose test).

### Step 2: paint what lies underneath, once, on the rest canvas (the only large generated areas)

When a part moves it uncovers something the idle never painted: the chin and choker
under Leblanc's fan hand, the dress under her forearm, the robe lining behind a sleeve
that swings, the back of Ormi's robe where the shield hung, his chest under the crossed
arms. For each part:

1. **Plan** the region from the pose table (step 3): the union of the areas that part
   uncovers in any state, as `tools/gen/rig-fill.py plan` does from the rig's
   displacement envelope.
2. **Pre-fill** with a push-pull of the layer's own visible pixels, so the sampler starts
   from the right colours.
3. **Masked repaint:** Animagine XL 4.0 Opt with the subject's r2 LoRA
   (`leblanc-x2-r2` step 1000 at 0.6 to 0.75; `logos-x2-r2`; `ormi-x2-r2`), IP-Adapter
   plus (`ip-adapter-plus_sdxl_vit-h`, CLIP-ViT-H) on idle square-padded plus a head
   crop at 0.3, with the window 0 to 1, because a low denoise runs only the tail of the
   schedule. It uses `VAEEncode` + `SetLatentNoiseMask` at 0.55 to 0.9 and then
   `ImageCompositeMasked`, so nothing outside the mask changes. This is the graph of
   `docs/concepts/chapters/leblanc/lora/leblanc/poses/repaint.mjs`. The words name only
   what the mask shows ("white fabric", "purple robe lining"), never the whole costume,
   so they cannot move anything else.
4. **Merge** with `rig-fill.py merge`'s tone correction: the low-frequency drift against
   the ring just outside the mask is measured and removed.
5. These fills become permanent **under-layers** of the rig, judged once at 1:1 and
   reused by every state. One fill serves attack, cast and hurt.

### Step 3: pose by geometry (no GPU)

- A pose is a table of joint angles and translations per state, authored against the
  round-2 OpenPose skeletons (`poses/skeletons/r2/`, which already encode what the judges
  asked for: the fan leading the strike, both legs kept on hurt, the wrist away from the
  head on ko).
- **Rigid parts** (head, fan hand, revolvers, helmet, shield, boots) are rotated and
  translated whole, so their pixels are the idle's, resampled once.
- **Soft parts** (sleeves, robe drapes, hakama) are deformed with an as-rigid-as-possible
  triangle mesh. The tools are scipy `Delaunay` plus a per-triangle affine, as in
  `rig-lora-init.py` and the renderer, or scikit-image 0.26 `PiecewiseAffineTransform`;
  both are in ComfyUI's embedded python. OpenCV is available in
  `D:/Tools/sd-scripts/.venv` if dense flow is needed (`rig-flow.py`). Secondary
  motion is a small trailing bend: a sleeve lags its arm by 5 to 10 degrees, and a hem
  swings against the lean.
- **Resampling at 1:1 quality:** warp on a 2x Lanczos canvas and come back down once, so
  no part is resampled twice. The check is that the Laplacian variance (sharpness) of
  each moved part stays within 10 % of the same part in idle. **No RealESRGAN:** an
  upscaler repaints texture, which is the drift this method removes.
- **Composite** in z-order, then give the cut-out its 16 px margin. `cutout-guard` must
  pass; the round-2 Leblanc ko cut-out touched the canvas edge.
- **Amplitude budget for pure warp:** every rotation stays in the picture plane, with at
  most about 35 degrees at a limb joint and 20 degrees at the waist. The battle camera
  sees these figures side-on and the party is screen-left, so a strike toward the party
  **is** a picture-plane motion. That is this method's sweet spot.

### Step 4: small generated patches (seams, face, props)

- **Joint seams:** one masked repaint per joint (shoulder, elbow, waist, hip), each mask
  at most 64 px across, at denoise 0.35 to 0.45 with the same graph as step 2. Four
  candidates, picked at 2x.
- **Face:** attack and cast keep idle's face untouched. A smirking Leblanc strike is in
  character, and an untouched face cannot grow a strand over the eye. Hurt and ko need
  shut eyes and a wince. These use the living-portrait patch method that worked on
  Yuna's plate: `rig-lids2.py` and the `rig-v41fix.py mouth` idea, with eyes and mouth
  masked separately at 0.45 to 0.5, and the whole repainted patch kept, not features cut
  out of it. (`D:/Tools/tha4` could pose the idle's own face without diffusion, but its
  model weights are not on this machine: `data/tha4/` holds only `placeholder.txt`, and
  a download needs Bailey's yes. The pilot does not need it.)
- **Props that are not in the idle** are painted **once** as standalone rigid sprites,
  judged once, and reused. The main case is Leblanc's open fan for cast. Its colour is a
  hard-rule-6 decision first: idle's black, research's red and silver, or Bailey's
  concept pick B, "fan fully open, warm magenta".

### Step 5: the hybrid, where warping cannot reach (part transplant)

Some states cannot come from the idle by warping (section 5): a figure lying flat, a big
wind-up, anything turned in depth. There the geometry comes from a render and the
identity comes from the idle:

1. **Geometry:** a LoRA r2 plus xinsir OpenPose SDXL render (the round-2 recipe
   unchanged), chosen **only for pose and proportion**. Proportion is checked
   automatically: crown-to-sash and sash-to-sole against idle within 8 %. That catches
   the Logos 77 % body.
2. **Transplant** the idle's own rigid identity parts, SAM-cut in step 1, onto the
   render: head, choker, obi with knot and tassel, boots, fan, helmet, disc, revolvers,
   shield, topknot and tassel. Each is fitted to the render's matching part with 4 to 6
   hand-placed points, using a similarity transform for rigid parts and a thin-plate
   spline for the obi along a curved waist, then pasted. These are almost exactly the
   parts every judge failed.
3. **Grade** the render's cloth to idle's palette inside each SAM region: a Lab
   histogram match per region (robe, dress, hakama), measured against idle's same
   region. This is the Ormi 0.55 → 0.21 fix, as a measurement rather than a prompt.
4. **Seams** at 0.35 to 0.45 as in step 4, plus a hair-tip pass on a head that lies
   down, so the bob falls toward the floor.

The provenance map (step 6) shows the hybrid's generated share honestly. It will be
far higher than a pure warp's.

### Step 6: provenance and measurement (no GPU)

Every output ships with a **provenance map**: grey where the pixel is idle's unchanged,
blue where it is idle's pixel warped, amber where it is a step-2 under-layer fill,
magenta where it is a step-4 or step-5 patch or render. Saved per state beside the
sidecar. Measured:

- the share of opaque pixels that are idle's (grey plus blue);
- per named region (obi, choker, boots, fan, helmet, disc, shield band, hem, cloth):
  the mean CIEDE2000 against idle's same region, and the median cloth lightness;
- the head chord and body height against idle. A pure-warp state keeps idle's pixel
  scale by construction, so its sidecar `scale` is 1.0 and head and body match together.
- sharpness per moved part (step 3).

Then the existing in-battle capture, `lora/<subject>/round2/ingame.mjs`
(`PYREFLY_BROWSER=gpu`, its own Vite port in 5400 to 5990), and an **independent**
1:1 judge.

---

## 4. Why it keeps identity

- **Most pixels are the idle's pixels,** not a sample conditioned on it. The obi, the
  choker studs, the disc, the revolver finishes, the shield band and the hem diamonds
  cannot drift where they are copied, because nothing was drawn there. Every round-2
  defect listed at the top sits on a part that the pure-warp states copy.
- **Scale and proportion are exact,** because a warp moves pixels without redrawing the
  figure. Head and body cannot disagree (1.4).
- **Finish and value are exact:** idle's own brushwork, lightness 0.21 (1.3).
- **The sampler is confined** to masks the provenance map records. A defect it adds is
  local, visible on the map, and repaired by re-rolling one small mask.
- **No self-training loop:** no generated image goes into a dataset (1.2).
- **The costume cannot change between states,** so the 120 ms crossfade shows one figure
  moving.

---

## 5. Where it fails (honestly), and what the hybrid does there

| Case | Why pure warp fails | What to do |
|---|---|---|
| **KO lying flat** (all subjects) | Laying a standing painting down rotates its gravity with it: Leblanc's robe hangs "down" toward her feet, not onto the floor, her bob sticks out sideways, and boots drawn in front view stand up. The idle is seen at eye level from the front; a body on the floor is seen from above at an angle. Nothing in idle shows that view. | **Hybrid** (step 5): render the geometry, transplant the rigid parts, grade the cloth. **Or Bailey's choice** of a different KO concept. For an enemy the ko painting shows for under 1 s inside the dissolve (section 2), so "fall in the hurt painting and dissolve" (the engine's `ko → hurt` fallback, no ko file) or a derived knee-buckle slump are real options. These are options for Bailey, not decisions. |
| **Big wind-up; an arm raised high with a hanging sleeve** (Logos's two-gun aim, Ormi's raised fist) | A wide kimono sleeve hangs from the forearm. Raise the arm and the cloth should fall a new way, but a warped sleeve reads as a stiff tube. Uncrossing Ormi's arms uncovers his whole chest and belly. | **Hybrid, locally:** the sleeve is a step-2 fill with the **warped idle sleeve as its init** at denoise 0.55 to 0.7. Texture and colour come from idle, the drape from the sampler. The chest is an under-layer fill. The generated share goes up; the map shows by how much. |
| **Foreshortening or turning in depth** (an arm pointing at the camera; Ormi's shield turned face-on) | The idle sees Ormi's shield about 73 degrees off face-on: roughly 180 x 630 px, an axis ratio near 0.3. Turning it face-on stretches its pixels about 3.5 times across, which smears the studs and the sunburst. | Do not turn it. Carry the shield forward at idle's angle, rim leading, which suits a bash. Or turn it partway (a stretch of 1.5x at most) and repaint the face at 0.4, using the stretched shield as init. Poses that need the camera-facing depth of an arm get the hybrid. |
| **Lighting on a big rotation** | The shading is baked in. Rotate a forearm 90 degrees and its shadow side ends up on top. | Keep limb rotations within about 35 degrees (step 3). Beyond that, one relight pass over that part only, at denoise 0.25 to 0.3, flagged magenta on the map. |
| **A pose that reads weak** (the "pose reads as its state" criterion) | The pose table is limited in amplitude, and pilot 2's crude puppet read as "standing with the fan held out". | Author the pose against the r2 skeletons, which already read as the state, and leave the motion to the engine's lunge, squash and knock-back. **The pilot tests exactly this** (attack in battle). |
| **The idle itself is off-canon** (1.6) | Derivation copies whatever the idle has. | Answer it once, at the idle (step 0), and every state follows. |
| **No idle yet** (Dr. Goon, Fem-Goon: procedural silhouettes) | There is nothing to derive from. | First paint an idle with the D-027 close-up recipe and get Bailey's yes, then derive. |

---

## 6. Risks

1. **The paper-puppet look.** Hinged joints, cloth that does not respond, a figure that
   reads as a cut-out at 1:1. This is the main risk, and the pilot's kill criterion 1.
2. **Seams at 1:1.** Each joint and each transplant has an edge; the judge will look at
   2x. The living-portrait v4 work shows the risk is real ("faint seams where the repaint
   met the key") and that it is fixable (v4.1).
3. **Softness from resampling.** Mitigated by the 2x canvas, a single resample and the
   sharpness check.
4. **Large generated shares in the hybrid states.** A transplant onto a render inherits
   the render's cloth and anatomy. Ormi's ko with no shield, and Logos's ko with one leg,
   were render faults, so the proportion check and a pose pick come first.
5. **Anchor faults propagate** (1.6). If Bailey later changes an idle, every state is
   derived again. That costs CPU, plus the fills whose regions changed.
6. **Authoring time.** A rig per subject is a few hours of an agent's careful work
   (masks, pivots, pose tables) before any GPU is used. It costs less GPU than a render
   round and more of an agent's context. It is reused for every state and for any
   future state (victory, defend).
7. **A shared GPU.** One RTX 5070 Ti with 16 GB, shared with other agents. Every render
   is one prompt at a time behind the shared ComfyUI queue. ComfyUI is never restarted
   from here, and `gpu-train.lock` is not needed because nothing is trained.

---

## 7. Pilot: one subject, two states, at most 60 GPU minutes

**Subject: Leblanc.** Her bar is the one Bailey named. Her attack is a picture-plane
strike, the method's best case, and her ko is the state that two reviews have left
failing. **States: attack (pure derive) and ko (hybrid transplant).** Between them they
test both halves of the method. Hurt is a smaller version of attack (a 15 to 20 degree
lean plus the face patch). If attack passes, hurt follows; if attack fails, hurt is the
fallback use. Cast waits for the open-fan decision.

Workspace: `docs/concepts/chapters/leblanc/derive/pilot/` for scripts, sheets and the
report. Scratch goes to `D:/Tools/pyrefly-lora/leblanc/derive/` (not committed).
Installs go to `public/art/characters/leblanc/{attack,ko}.png` only as `status:
CANDIDATE`, backed up the way `install-r2.mjs` does it, and only after the 1:1 sheet has
been looked at.

| # | Step | Tools | GPU min (est.) |
|---|---|---|---|
| P0 | verify-approved before; GPU gate (ComfyUI queue empty for 3 minutes) | `verify-approved.mjs`, `lora-train.mjs gate` logic | 0 |
| P1 | SAM part masks of `leblanc/idle.png` (591x1118) and the joint table; rest recompose = idle, MAD 0 | `rig-sam.py` pattern, SAM 2.1 small | 1 |
| P2 | Under-layer fills for attack: (a) chin, jaw and the front of the choker under the fan hand; (b) the dress and heart edge under the forearm; (c) the robe lining the near sleeve uncovers; (d) the dress panel between the legs for a 12-degree stance widening. 4 candidates each at 0.6 to 0.9 | repaint graph (`poses/repaint.mjs`), LoRA r2 step 1000, IP-Adapter at 0.3 | 8 |
| P3 | Attack pose: shoulder up and forward, elbow extended so the closed fan leads at arm's length toward the party (the r2 attack skeleton's arm line), waist forward 10 to 12 degrees, head forward 5 degrees, legs spread 12 degrees each, sleeves trailing, face unchanged; composite on a 2x canvas | numpy/scipy/scikit-image | 0 |
| P4 | Attack seams (shoulder, elbow, waist, two hips), 4 candidates each at 0.35 to 0.45 | repaint graph | 5 |
| P5 | Ko geometry: 6 LoRA r2 + OpenPose renders of `lying_r2` with the fan wrist moved away from the head (the r2 judge's redo), picked for pose and proportion only (crown-to-sash and sash-to-sole within 8 % of idle's) | round-2 `render.mjs --set r2` | 6 |
| P6 | Ko transplant: idle's head (rotated to the render's angle), choker, obi with knot, tassel and medallion (thin-plate spline along the waist), both boots, the closed fan; Lab grade of the robe and dress toward idle's regions | PIL, scipy | 0 |
| P7 | Ko patches: shut eyes and a slack mouth (eyes and mouth masked separately), hair tips toward the floor, the transplant seams (about 6), 4 candidates each | repaint graph | 12 |
| P8 | Provenance maps, region CIEDE2000, sharpness, 1:1 sheet; install as CANDIDATE; in-battle capture | PIL; `round2/ingame.mjs` (the browser uses the GPU for seconds only) | 1 |
| | **Estimated total** | | **about 33** |
| | **Hard cap:** stop at 60 GPU minutes (summed ComfyUI execution time from the history API), and report what exists | | **60** |

Nothing is trained or downloaded. Only existing models are used: the Animagine XL 4.0 Opt
checkpoint, the `leblanc-x2-r2` LoRA, IP-Adapter plus with CLIP-ViT-H, the xinsir OpenPose
SDXL ControlNet, and SAM 2.1 small.

---

## 8. Success criteria a 1:1 judge can check

**PASS (the method is proven for that half):** an independent judge scores each state
against `leblanc/idle.png` on the round-3 criteria plus anatomy and "pose reads as its
state" (as in `lora/leblanc/round2/judge.md`), and **every criterion is 7 or more**.
In particular, at native 1:1 and 2x:

1. The obi is idle's wide crimson sash with gold edges, one knot, one lavender tassel and
   the round medallion; region CIEDE2000 against idle is 3 or less (attack) and 6 or
   less (ko).
2. The choker has idle's row of studs. There is no white strand over either eye, and the
   open eye's iris is idle's purple (attack).
3. The boots are idle's lavender open-toe lace-ups, with pixels traceable to idle on the
   provenance map. The cut-out has its 16 px margin on every side.
4. The fan is idle's closed black fan with pale ribs.
5. No seam or hinge is visible at any joint or transplant edge at 2x (the judge crops
   each one), and the sharpness of each moved part is within 10 % of idle's.
6. **attack** reads as a strike, not a fan held out: at 1:1 and in the in-battle capture
   at 1600x900, with the engine's lunge running.
7. **ko** reads as knocked out, not asleep: the head is not on the hand, and an arm is
   flung. Crown-to-sash and sash-to-sole are within 8 % of idle's.
8. Machine checks: the share of opaque pixels that are idle's pixels (grey plus blue on
   the map) is at least **80 % for attack** and at least **40 % for ko**; the sidecar
   `scale` for attack is 1.0; head size in battle is within 5 % of idle's for both.

**KILL (the method, or one half of it, is dropped):**

- **Pure derive is killed** for large motions if attack scores below 7 on style,
  anatomy or pose **because of the derivation**: hinges, a stiff sleeve, softness, or a
  weak read in battle. It is killed only if one seam pass does not fix it. It would then
  be kept only for hurt-sized motions.
- **The hybrid is killed** if the transplanted parts still read as pasted after one seam
  pass (perspective mismatch on the head or boots, or a visible edge at 2x). If it is
  killed, the KO options go to Bailey (section 5, first row).
- If both pass, the method goes to Ormi and Logos. If either is killed, rule 15 applies
  again: a written note, not a third round.

---

## 9. Which subjects of chapters 6 to 8 it covers

| Chapter / subject (game) | attack | cast | hurt | ko | Precondition |
|---|---|---|---|---|---|
| 6 Leblanc (FFX-2) | derive | derive plus the open-fan prop, painted once | derive, with a face patch | hybrid, or Bailey's KO option | idle locked; fan colour decided |
| 6 Logos (FFX-2) | hybrid (both arms raised: sleeves) | **keep r2 cast** (judged 7) | derive: a lean back, both revolvers as idle's own props, which gives the full body height | hybrid: two revolvers, helmet and disc transplanted | the idle is a repaired CANDIDATE: lock it |
| 6 Ormi (FFX-2) | derive: the shield carried forward as a rigid prop at idle's angle, a lean forward | hybrid (arm uncrossed; chest fill) | derive: a lean back with the arms kept crossed, a wince patch, the shield on his back showing idle's face | hybrid, with the shield's rim showing under him | idle locked; heart decided |
| 6 Dr. Goon, Fem-Goon (FFX-2) | after an idle | after an idle | after an idle | after an idle | no idle exists: paint one, Bailey approves it |
| 7 Seymour, Macalania (FFX) | derive | derive | derive | hybrid | the idle is a CANDIDATE (judged 4 to 6): it must pass first, or derive copies its faults |
| 7 Guado Guardian (FFX) | derive | derive | derive | hybrid | idle CANDIDATE (judged 6): must pass first |
| 7 Anima (FFX) | reuses an approved aeon painting: out of scope | | | | |
| 8 Evrae (FFX) | **derive, and well suited to it**: a strike of the head along the neck is a spline-driven mesh bend of `idle-near` (judged 8), with the head rigid | (breath-charge exists, judged 6: re-derive from idle-near) | derive (a recoil along the neck) | hybrid (the coil sinking) | idle-near locked |

---

## 10. What Bailey would see

After the pilot, one sheet and one short clip, in the style of the round-2 judge sheets:

- **Top row:** Leblanc idle, the derived attack and the hybrid ko, whole, at idle's pixel
  scale. Beside them, round 2's attack and ko for comparison.
- **1:1 crops** of the face, choker, obi and tassel, boots and fan for idle and for each
  state, side by side. On the attack row the obi and boots crops should be
  indistinguishable from idle's, because they are idle's pixels.
- **The provenance map** of each state, which shows at a glance how much is idle's (grey
  and blue), fill (amber) and generated (magenta).
- **In battle** at 1600x900: the idle → attack swap and the ko fall into the dissolve.
  A 2-second capture of the swap shows the crossfade as one figure moving.
- **The questions for him,** which are his to answer: lock these idles as the anchors;
  the open fan's colour (black, red and silver, or warm magenta); for an enemy KO that
  shows for under a second inside the dissolve, a flat-lying hybrid, a derived slump, or
  a fall in the hurt painting.

Nothing is approved or added to `approved-hashes.json` without his word.

---

## Sources read

`docs/plans/leblanc-art-method-check.md`; `docs/concepts/chapters/leblanc/pilot2/pilot2.md`
(method E); `lora/{leblanc,logos,ormi}/round2/round2.md`, `judge.md` (commits `0c46fc2`,
`5ed7a7a`, `c71b595`), `sheet.jpg` (looked at), `ingame-after.json`; memory
`art-pose-recipe-lessons-2026-09-21.md`; `docs/ART-PIPELINE.md` (inpainting, KO
orientation); `tools/gen/cast.json` (the leblanc, ormi and logos rows);
`src/engine/PaintedActor.ts` (`setPose`, `applyPose`, `flinch`, `dissolveTo`, fall tilt),
`BattlePresenterBeats.ts` (`actionStart`, `ko`), `BattlePresenterEvents.ts` (`TIMING`);
`docs/handoff/living-portrait-v4.md`, `prototype-v2/README.md`,
`tools/gen/rig-{sam,lora-init,lib,v4lib,flow,fill,underfill}.py`,
`tools/gen/lora-repaint.mjs`, `lora/leblanc/poses/repaint.mjs`;
`docs/target/decisions.json` D-027; `docs/target/targets.json` (Leblanc picks). Tools
listed on this machine: `D:/Tools` (sam2, sd-scripts, tha4 with no model weights,
pyrefly-lora); `D:/Tools/ComfyUI/ComfyUI/models` (Animagine XL 4.0 Opt; LoRAs leblanc,
logos, ormi and yuna-x2; xinsir OpenPose SDXL; IP-Adapter plus ViT-H; CLIP-ViT-H;
RealESRGAN x4plus; Wan 2.1 FLF2V 14B fp8 and Wan 2.2 TI2V 5B; Flux 2 Klein 9B; z-image
and Krea 2 turbo). The video and edit models are left out of this method on purpose:
each regenerates the whole frame, which is the drift in 1.1.
