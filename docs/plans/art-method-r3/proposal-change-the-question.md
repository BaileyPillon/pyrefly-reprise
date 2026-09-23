# Art method check r3, proposal: change the question (ship fewer paintings)

Paper only (2026-09-23). Nothing was rendered, trained, queued, downloaded or installed
for this file. `public/art`, `docs/target/approved-hashes.json`, `src/` and `tests/` were
only read. The numbers come from three places: the committed round-2 reports and judge
passes (`0c46fc2`, `5ed7a7a`, `c71b595`); small PIL scripts run on the installed PNGs; and
the real battle engines, run headless from a scratch vitest file outside the repo (hard
rule 3: proved by running the engine, not by grepping). Section 1.1 gives the recipe.

**Which game (hard rule 14).** The state map and the method are shared plumbing, so they
apply to **both** games. The subjects are per game. Chapter 6 (Leblanc, Logos, Ormi,
Dr. Goon, Fem-Goon) is **FFX-2 only**. Chapters 7 (Macalania: Seymour, the Guado Guardians,
Anima) and 8 (Evrae) are **FFX only**. The pilot is FFX-2 (Leblanc).

**Why this check is owed (hard rule 15).** Two rounds, a LoRA and OpenPose and masked
repaints, left the same family of defect open. Judged at 1:1, in the order attack / cast /
hurt / ko: Leblanc went from 6/6/5/6 to 6/6/6/5, Logos from 6/6/5/5 to 6/7/6/5, and Ormi
from 5/7/4/4 to 6/5/5/4. Each round fixed the named defects, and new ones of the same kind
appeared. The sibling proposals `proposal-derive-from-idle.md` and
`proposal-constrain-the-generator.md` ask how to paint the four states better. This one
asks which of the four states the game actually needs as paintings.

---

## 0. The answer in one paragraph

The game shows very little of what we have been painting. **No Chapter 6 to 8 subject ever
shows its `attack` painting**, because every enemy action reaches the presenter as an
`ability` and is drawn with `cast`. Across 100 simulated battles, 1,699 enemy-side actions
used `cast` and none used `attack`. The `hurt` painting is on screen for 0.36 s per hit, under a
0.2 s warm flash, at about a seventh of its painted size. The lying-down `ko` painting is the
wrong picture for the three Syndicate members and the Guado Guardians: the research says they
are "beaten, still standing", not dead. So: **ship one new painting per subject, the
signature-move `cast`, judged at 1:1 as now.** Derive `hurt` from the approved idle, either
with no new file at all or as a rig bake of the idle's own pixels. Ship no `attack` and no
lying `ko` for the trio. Two of the three Chapter 6 hero paintings already exist at 7: Logos's
round-2 cast, and Ormi's round-1 `cast.960106`. The third, Leblanc's cast, is a 6 with two
local defects (obi, choker). The pilot repairs it by moving the idle's own obi and choker
pixels into it, and bakes a hurt from the idle. Both are for Bailey's eyes before anything
more is painted.

---

## 1. How the game shows each state (measured)

### 1.1 Which pose each action uses, from the engines

`BattlePresenterBeats.actionStart` picks the pose with `poseForCommand(event.command.kind)`
(`src/engine/BattlePresenterEvents.ts:392`): `attack` and `overdrive` give the `attack` pose,
and `ability`, `summon` and `spherechange` give `cast`. The only other caller of
`setPose('attack')` is the `counter` event (a 280 ms lunge, `BattlePresenterEvents.ts:317`).

The Syndicate AI returns `kind: 'ability'` for everything, including the plain attack
(`src/battle/ffx2/ai/leblanc-syndicate.ts:38`: `{ kind: 'ability', id: 'attack', ... }`). The
FFX AI returns `ability` whenever the id is a known ability (`src/battle/ffx/ai/types.ts:70`).
To prove it rather than read it, I ran the real engines headless: `FFX2Engine` over the whole
three-act Chateau chain with the shipped tactic line (`ffx2Leblanc`), seeds 1 to 20, which is
60 battles; and the FFX engine on `seymour-anima-macalania` with the shipped tactic, and on
`evrae-airship` with `intendedStrategy`, seeds 1 to 20 each. I mapped every enemy
`action-start` through the presenter's own `poseForCommand` and counted every `counter`,
positive `damage` and `ko`.

| Subject (chapter, game) | Actions drawn as `cast` | Actions drawn as `attack` | Counters (`attack` for 280 ms) | Hits (`hurt`) | KOs |
|---|---|---|---|---|---|
| Leblanc (6, FFX-2) | 236 | **0** | 0 | 231 | 20 |
| Ormi, all three acts (6, FFX-2) | 142 | **0** | 0 | 517 | 60 |
| Logos, acts II and III (6, FFX-2) | 58 | **0** | 0 | 217 | 40 |
| Dr. Goon / Fem-Goon (6, FFX-2) | 25 | **0** | 0 | 40 | 40 |
| Seymour (7, FFX) | 522 | **0** | 0 | 386 | 18 |
| Guado Guardians (7, FFX) | 37 | **0** | 3 | 6 | see note |
| Evrae (8, FFX) | 208 | **0** | 86 | 1,444 | 20 |
| Anima (7, FFX; reuses the approved aeon set) | 411 | **0** | 0 | 247 | 19 |
| Cid's ship (8, FFX; enemy side in the engine, no painting) | 60 | **0** | 0 | 0 | 0 |

Totals: **1,699 enemy-side actions, 0 drawn with `attack`.** 89 counters draw `attack` for 280 ms.
Evrae's counters are its self-Haste (`evrae-counters.ts:78`), so those 89 amount to about
25 s spread over 40 battles. When no `attack.png` exists, the engine already falls back
`attack → ready → idle` (`POSE_FALLBACKS`, `BattlePresenterActors.ts:252`), so a counter
shows the idle with the existing lunge.

(Note: the guardians took only 6 damage events and logged no `ko` event in these runs. I did
not trace why; it does not change their pose counts.)

**Consequence:** the three installed `attack.png` candidates in Chapter 6 (6, 6 and 6 at 1:1)
are never on screen, and Evrae's missing attack painting is not a gap.

### 1.2 How long, how big, under what light

| State | When | On screen for | What is on top of it (code) |
|---|---|---|---|
| idle | everything else | most of the fight | breathing, sway |
| cast | every action | `actionStart` 380 ms + `castHold` 420 ms framed on the caster, then the cut to the target. The FFX-2 charge path emits `action-start` when the charge begins (`src/battle/ffx2/execute.ts:161`), so the pose also holds through a charge bar | cyan flash `0x9fd8ff`, 560 ms at 0.45; the action rig is 5 % closer, plus a 6 % push |
| hurt | every hit | `flinch(360)`: 120 ms crossfade in, 360 ms held, then back | warm flash `0xffd0c0` 200 ms at 0.8 (white at 1.0 on a crit), warm tint, shake 0.1, elastic knock-back |
| ko (enemy) | once | fall 300 ms, then a pyrefly dissolve over the rest of `TIMING.ko` (620 ms) | dissolve shader |

Size in a running battle at 1600x900 (`ingame-after.json` of the Leblanc and Logos round-2
passes): Leblanc's idle is 158 px tall and 82 px wide on screen, and her head is **25 px**.
The painting is drawn at **0.13 to 0.17 screen px per painted px**, so about a seventh of its
size (0.19 at most in the action rig). Measured on `leblanc/idle.png`, the crimson obi is
31 to 44 px tall, which is **5 to 6 screen px**. The choker studs are under 8 px, which is
**under one screen px**. The Leblanc judge found the same thing by eye: in every action state
"the presenter's state lighting blooms her hair, face and dress to near white. The face
cannot be read at game size" (`lora/leblanc/round2/judge.md`, "Scale in the running battle",
item 1).

So in play, the colour masses (obi hue, cloth value, helmet value), the silhouette props
(two revolvers, a shield) and the pose read. The things that failed 1:1 most often (studs, the
disc emblem, hem diamonds, the tassel medallion) do not. **This does not lower the bar.** A
painting that ships is judged at 1:1, as now. It is the reason to ship fewer of them.

### 1.3 What FFX and FFX-2 do (research)

- **Departures** (`research/ffx-vs-ffx2-presentation.md` §3.2 to 3.3): Leblanc, Logos and
  Ormi are "living humans", and the table lists "dissolve, kill, or KO-animate them" as the
  wrong thing to build. The proposed `Departure` type gives the trio and the Guado Guardians
  `'yields'`, "beaten, still standing". Seymour at Macalania is `'body'` (he falls and stays
  fallen). Evrae is `'falls-away'` (it leaves the frame downward, alive). Anima is
  `'dismissed'`. In Chapter 6's story, Ormi and then Ormi and Logos "lose and flee", and
  Leblanc, beaten, hands over the sphere (`research/ffx2-leblanc-syndicate.md` §9, beats 8, 10
  and 13). **A lying-down KO painting is the wrong picture for four of the six Chapter 6 to 7
  humans.** The engine does not implement departure kinds yet (no `departure` anywhere in
  `src/engine` or `src/data`); today every enemy KO is the fall and the pyrefly dissolve.
- **Signature moves** (`ffx2-leblanc-syndicate.md` §10.1, *Poses*): Leblanc's fan "opens for
  Sonic Fan / Mach Fan" and "she snaps it shut on Love Tap". Logos: Double Shot, Hail of
  Bullets, and Russian Roulette's single deliberate shot. Ormi: Shield Bash's straight shove,
  Supercollider, Huggles. The research names **no** hurt or defeat animation for any of them,
  and it does not count how many distinct animations a boss has. I do not guess one.
- **Bailey's own pick** (`docs/target/targets.json`, the Leblanc tile's `mustChange`):
  "Leblanc: B (fan fully open, warm magenta), not the screen pose A or the snapped-shut pose
  C". That is her `cast` state: the one pose Bailey named for Leblanc is the one the game shows
  on every one of her actions.

---

## 2. Root causes of the two failed rounds (with evidence)

1. **Every state repaints every pixel, so small parts are drawn again each time.** At
   832x1216 the SDXL latent is 104x152. Leblanc's head is about 21 latent px, the obi 4 to 6,
   and a choker stud under 1. Details smaller than a few latent px come back from the model's
   prior each time, and neither the LoRA nor IP-Adapter at 0.3 to 0.4 holds them. Measured as
   the share of a state's opaque pixels whose colour is more than ΔE 10 (Lab) from every idle
   colour (6,000 sampled pixels per state against 2,000 sampled idle colours; the idle
   against itself is the noise floor):

   | | idle vs itself | attack | cast | hurt | ko |
   |---|---|---|---|---|---|
   | Leblanc | 0.3 % | 7.3 % | 4.7 % | 1.1 % | 2.3 % |
   | Logos | 0.5 % | 1.4 % | 3.9 % | 1.7 % | 2.5 % |
   | Ormi | 0.6 % | 21.4 % | 14.5 % | 9.1 % | 14.4 % |

   Every repainted state has invented colours that the idle does not have: Ormi's lavender
   cloth, Leblanc's navy obi, Logos's pink glint.
2. **Each fix moves the drift somewhere else.** Round 1 held the obi and lost the boots. Round
   2 fixed the boots, the fan, the legs and the fan-at-mouth, and the obi drifted in all four
   states (`lora/leblanc/round2/judge.md`, "Compared with round 1"). The net scores did not
   move. With four fresh samples per subject, one of about eight small parts is always wrong
   somewhere.
3. **The poses farthest from idle fail the most.** KO is the lowest-scoring state for all
   three subjects (5, 5, 4). It is also where proportions break: KO Logos's body is 77 % of
   the idle's height with the head matched (`lora/logos/round2/judge.md`), and KO Ormi loses
   his shield. For the trio it is also the state the research says should not be a corpse
   (1.3).
4. **We asked for states the game never shows.** Attack (1.1) cost a quarter of every round's
   renders, repairs and judging, and it is never on screen.
5. **The anchor is not locked.** `approved-hashes.json` has no entry for Leblanc, Logos or
   Ormi. Logos's idle sidecar says `CANDIDATE`. Everything derived from an idle inherits
   whatever Bailey later decides about that idle.

---

## 3. The proposal: a state map, then one method per row

### 3.1 The state map

| State | Ships as | Why |
|---|---|---|
| idle | the approved painting (Bailey locks it first) | the anchor; most of the fight |
| **cast** | **one hero painting per subject, 1:1 bar 7 on every criterion** | every action (1.1); about 1 s each, held through charge bars; Bailey named it for Leblanc |
| hurt | **derived from idle**: either (a) no file (the engine's fallback `hurt → idle` plus the flinch it already plays), or (b) a rig bake of the idle's own pixels, judged at 1:1 like any painting | 0.36 s under a flash at 25 px heads; the pose has to read, the details cannot |
| attack | **not shipped** | never drawn (0 of 1,699 actions); counters fall back to idle plus the lunge |
| ko, trio + guardians + goons | **not shipped**: the engine fallback `ko → hurt → idle`, until Bailey decides the `'yields'` departure | the research says they end standing (1.3) |
| ko, Seymour (`'body'`) | the one optional second painting, only if Bailey wants the fallen body shown | a once-per-chapter beat |
| ko, Evrae (`'falls-away'`) | not a painting: motion of the existing plate out of frame | it leaves alive |

The chapters 6 to 8 ask goes from about 34 pose paintings (4 each for Leblanc, Logos, Ormi,
Seymour and the Guardians, Evrae's four, two goons times five) to **5 hero casts, Evrae's
breath-charge, 2 goon idles and at most one Seymour KO**. The hurts are baked or omitted.

### 3.2 Method A, the hero cast: pick the nearest pass, then transplant idle pixels

1. **Pick the base.** Logos: the installed round-2 `cast.png` (independent 7, `5ed7a7a`).
   Ormi: round 1's `cast.960106` (independent 7; the `c71b595` judge recommends restoring it;
   backup `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/ormi/replaced/`).
   Leblanc: the installed `cast.png` = `cast.r2.2` (6: obi and choker only; fan 8, face 8,
   pose 8).
2. **Mask the defect and its twin in idle.** Use SAM 2.1 hiera-small
   (`D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt`, loaded the way `tools/gen/rig-sam.py`
   does in ComfyUI's embedded python, on the CPU if the card has under 2 GB free). Prompt it
   with points and boxes, then snap the edge to the ink as `rig-lib` does. For Leblanc these
   are the obi band with its knot and single tassel, and the choker. The masks are made in
   both `cast.png` and `idle.png`.
3. **Warp the idle's part onto the cast's geometry.** Hand-place 6 to 10 landmarks per part
   (obi corners, knot centre, tassel tip, choker ends). Then run a piecewise-affine warp (the
   Delaunay and `cv2.remap` code of `tools/gen/rig-flow.py`, run with
   `D:/Tools/sd-scripts/.venv/Scripts/python.exe`, the only python here with OpenCV).
4. **Composite, then repaint only the seam.** Use a feathered paste (3 to 6 px). Then a masked
   repaint of **only an 8 to 12 px band around the paste**, with the graph of
   `tools/gen/lora-repaint.mjs`: Animagine XL 4.0 Opt, the subject's r2 LoRA at 0.8, the idle
   through IP-Adapter at 0.3, and `SetLatentNoiseMask`. Denoise 0.25 to 0.35, 4 candidates.
   The pilot uses a copy with the LoRA as a flag, so the shared tool is untouched. Then paste
   the warped idle interior back over the result, so the transplanted part is the idle's
   pixels exactly and the model only ever owns the seam.
5. **Check objectively, then judge at 1:1.** Pixels outside mask plus band are unchanged (MAD
   0). The repaired region's invented-colour share is at or under 1 %. Then the usual
   independent 1:1 judge, bar 7 on every criterion, and the driver looks.

### 3.3 Method B, the derived hurt: the control first, the bake only if it reads better

- **(a) Zero-file control.** Do not ship `hurt.png`. The engine then shows the idle through
  its existing flinch: the `hurt` posture (lean −0.03, crouch 0.02, tilt 0.03), the warm flash
  and tint, the shake and the elastic knock-back. Identity is the approved idle by
  construction. The only question is whether it reads as a hit.
- **(b) Rig bake of the idle** (the same tools as the living portrait, whose rest frame is
  "the plate to the pixel (MAD 0.0000)", `docs/handoff/living-portrait-v4.md`):
  1. SAM 2.1 part masks on idle: head and hair, torso and dress, near arm with the fan, far
     arm, both legs, both sleeves.
  2. Joint rotations as landmark moves on idle's canvas: upper body back 10 to 14° about the
     hips, head back 8 to 12° with a tilt, the fan arm swung 20 to 30° down toward the
     stomach. Then the piecewise-affine warp (`rig-flow.py`'s Delaunay and remap), with
     overlapping triangles at the joints.
  3. Revealed holes are filled with `rig-fill.py` / `rig-underfill.py` (neighbour clone), then
     a masked seam and hole repaint (as in A.4, denoise 0.3 to 0.45) that covers **at most
     10 % of the opaque area**.
  4. Face: a closed-eye wince, painted with the LoRA into an eye box only, as
     `tools/gen/rig-lids2.py` did for Yuna. Denoise 0.5 to 0.6, 4 candidates; optionally a
     clenched mouth patch.
  5. Output: the warped idle alpha is the cut-out, `baselineY` is idle's, and the sidecar scale
     is 1.0, because it is the same pixel scale as idle by construction. Logos's hurt body at
     80 % of idle's height cannot happen.
- Ship (b) only if, at game size, it reads as a hit **better than (a)**, and it passes 1:1.
  Otherwise ship nothing and keep (a).

### 3.4 What is not in this method (separate decisions, each needs a yes; hard rule 10)

- **Departure kinds** (`'yields'`, `'body'`, `'falls-away'`, `'dismissed'`) are a presenter
  change for both games, and a deep review after the deploy. Without them, a trio KO with no
  `ko.png` is the hurt (or idle) plane tipping about 10° as it dissolves into pyreflies. That
  is the same lore error as today's candidate dissolving, only with the approved face.
- **Per-ability poses** (Fan Slap, Double Shot or Shield Bash drawn as `attack`) would make
  `attack` visible, and each would then be a second hero painting. That means more paintings
  and more risk, and it is an idea for Bailey, not part of this method.
- **Removing the installed candidates** from `public/art` (`attack`, `ko`, and `hurt` if (a)
  wins) is the driver's install step after Bailey's pick, with the backup first.

---

## 4. Why it keeps identity

It keeps the idle's pixels instead of asking a sampler to remember them. In Method A the
defective part is replaced by the idle's own pixels, resampled once through a warp, and the
model draws only a band of about 10 px with idle pixels on both sides. The context carries
the colour, and the paste is re-applied afterwards. In Method B(b), at least 90 % of the opaque
pixels are idle's, moved by a warp. The model fills holes and seams and paints the closed eyes
inside a box. In B(a) there are no new pixels at all. The earlier evidence points the same
way. Pilot 2's method E (a pasted idle puppet) "keeps the costume ... better than anything
else tried". It failed only because the whole figure was denoised at 0.6 to 0.7, which pulled
the pose back to the idle (`pilot2/pilot2.md` point 4); here nothing outside the masks is
denoised. The living-portrait v4.1 repaints changed "0.005 to 0.033 levels" outside the
repainted eye box. The invented-colour check measures this with a number instead of an
impression.

---

## 5. Risks

1. **A bent idle reads as a paper cut-out.** Wide sleeves and robes do not bend like rigid
   parts, and a 14° lean can look like a tilted card. Limit the angles; the pilot kills it if a
   seam or a stretch shows at 1:1.
2. **The transplanted obi looks flat.** Idle's obi is seen near frontal and cast's at a
   slightly different angle with the arm raised. The warp handles scale and shear, not new
   folds. The judge's "style" and "anatomy" criteria catch it.
3. **The hurt pose is too weak.** A derived hurt may score "pose reads as its state" 6 at 1:1.
   Then the control (a) is the fallback, with no file to judge. The trade is a milder flinch
   against a correct costume.
4. **Bailey wants more pose variety.** A 2026 showpiece may want visibly different attack
   paintings. This is exactly the design question. The proposal says what is dropped and why,
   and 6.3 gives him the options.
5. **The KO stays a lore error** until the departure decision (3.4), whatever the art does.
6. **Shared GPU.** SAM runs on the CPU when the card is busy. Repaints are about 9 to 15 s
   each, one prompt at a time behind the `/queue` check. No training.
7. **The anchors are not locked.** If Bailey rejects an idle, its derived states go with it.
   Step 0 is his lock.
8. **Hard rule 6 stays open.** The research gives a red-and-silver fan and thigh-high
   stockings; the idle has a dark closed fan and bare legs, and the cast's open fan is red and
   silver. Leblanc's two paintings would disagree on the fan, as today. That is Bailey's call.
9. **A stale test.** Chapter art tests (`tests/unit/chapters/leblanc-art.test.ts`,
   `chapters-6-7-8-enemy-sprite-manifest.test.ts`) may expect all five files. Dropping files
   may need a test change, which is the driver's, with the install.

---

## 6. Pilot: Leblanc, two states, at most 60 GPU minutes

**Subject:** Leblanc (FFX-2): the hardest identity, and the one Bailey called the bar.
**States:** `cast` (Method A: repair `cast.r2.2`'s obi, knot and tassel, and its choker from
idle's pixels) and `hurt` (Method B: control (a) against bake (b)). Together they test both
halves of the proposal. Output goes to `docs/concepts/chapters/leblanc/r3-question/`. Nothing
is installed, and candidates stay outside `public/art`.

| Step | GPU minutes (estimate) |
|---|---|
| SAM 2.1 small masks: idle (6 parts), cast (obi, choker) | 2 (0 on CPU) |
| Warps and composites (CPU, OpenCV) | 0 |
| Cast seam repaints: obi band 2 denoise × 4 cands, choker 4 cands | 3 |
| Hurt seam and hole repaints: 2 passes × 4 cands | 2 |
| Hurt eye wince: 2 variants × 4 cands; mouth 4 cands | 3 |
| One re-run of everything after the first look | 10 |
| In-battle captures at 1600x900, GPU browser (not ComfyUI) | 2 |
| **Total planned / cap** | **about 22 / 60** |

The captures are the running battle through `window.__pyrefly` with the candidate files swapped
in from a scratch copy, like the existing `ingame.mjs` scripts: idle, cast, the mid-flinch
frame of (a) and of (b), all at the same camera.

## 7. Success criteria (a 1:1 judge can check each one)

**Cast (repaired `cast.r2.2`)**
1. Robe/obi/dress/choker at least **7**: a wide crimson sash with gold edges, one knot, one
   purple tassel with its round medallion, and a row of studs on the choker. Every other
   criterion no lower than in `0c46fc2` (fan 8, face 8, pose 8, boots 8, heart 8), so the worst
   is at least 7.
2. Outside the repair masks plus the 12 px band, the file equals `cast.r2.2` (MAD 0).
3. Inside the obi and choker masks, the invented-colour share is **at most 1.0 %** (today the
   whole cast is 4.7 %).
4. No visible seam at 1:1 or at 2x on the band (one named seam fails it).

**Hurt (bake (b) against control (a))**
5. (b) at 1:1: every criterion at least **7** against idle, including "pose reads as hurt"
   (hit, recoil, eyes shut) and anatomy (no stretched sleeve, no broken wrist).
6. (b) invented-colour share **at most 1.0 %** over the whole figure (round 2's hurt is 1.1 %,
   its attack 7.3 %); the repainted area at most **10 %** of the opaque pixels; the head chord
   **100 ± 2 %** of idle's; standing height at least 95 % of idle's for a 10 to 14° lean.
7. At game size (the mid-flinch capture), the driver judges (b) against (a) side by side:
   "reads as a hit, not a wink or a sass". (b) ships only if it reads better than (a). If they
   read the same, (a) wins (no file).

**Kill.** If, after the one re-run, the repaired cast's obi or choker is still at 6, or the
seam band re-invents the part (colour share over 1 % inside the mask), Method A is dead for
local repairs. Then the hero cast has to come from a fresh render judged as now, and I say so.
If (b) fails 5 or 6, the bake is dead, and hurt ships as (a), no file. Either way the state
map (3.1) stands on its own: it needs no GPU and cuts the work.

## 8. What it covers, chapters 6 to 8

| Chapter (game) | Subject | Paintings under this proposal | Derived or dropped |
|---|---|---|---|
| 6 (FFX-2) | Leblanc | idle (lock), **cast** (the pilot's repair) | hurt (a or b); no attack; ko → yields |
| 6 (FFX-2) | Logos | idle (lock; still `CANDIDATE`), **cast = round 2, judged 7** | same |
| 6 (FFX-2) | Ormi | idle (lock), **cast = round 1 `960106`, judged 7** | same |
| 6 (FFX-2) | Dr. Goon, Fem-Goon | **one idle each** (new anchors; options round first, hard rule 9) | cast = idle plus the engine's flash, or one hero cast each if Bailey asks; hurt (a) |
| 7 (FFX) | Seymour (human) | idle (lock; `CANDIDATE`), **cast** (his elemental spells, 522 actions, all `cast`) | hurt (a or b); ko: optional one painting (`'body'`) |
| 7 (FFX) | Guado Guardians | idle (lock; `CANDIDATE`), **cast** | hurt; ko → yields |
| 7 (FFX) | Anima | none new (the approved aeon set) | `'dismissed'` departure |
| 8 (FFX) | Evrae | idle / idle-near / idle-far (lock), **breath-charge** (its telegraph) | hurt (a or b), shown about 72 times a fight; no attack (counters are its Haste); ko → falls-away motion |

## 9. What Bailey would see

**First, one decision page** (target against build, as his rule asks), with three options per
subject shown at game size (the 1600x900 battle crop) and at 1:1:

- **A, fewest paintings (this proposal).** His approved idle for most of the fight. On each of
  her moves, Leblanc's fan-open painting, the pose he picked, for about a second. On each hit,
  the idle itself: a 0.36 s recoil, bent back with the eyes shut if (b) wins, under the warm
  flash. No attack painting (it is never shown). At defeat, the trio stays standing and
  beaten, if he says yes to the departure change.
- **B, A plus attack paintings,** with a presenter change so that physical specials (Fan Slap,
  Double Shot, Shield Bash) show them: more variety, and more paintings to bring to 7.
- **C, engine only:** no new paintings beyond the idle. Every state is the idle with motion,
  tint and flash.

**Then the pilot sheet:** Leblanc's idle; the repaired cast next to `cast.r2.2`, with 1:1 crops
of the obi, knot, tassel and choker; the baked hurt next to the idle, with 1:1 crops of the
face, joints and seams; and the two in-battle mid-flinch frames, (a) and (b), side by side.
The judge's scores go under each.

**What he will not see:** any new attack or KO painting for the trio, and any change to the
approved idle's pixels.

**The questions he answers** (liked / disliked / must remain / must change / undecided go in
the tile's `reaction`; hard rule 15): A, B or C; the departure kinds, yes or no; and whether
Leblanc's two paintings may disagree on the fan colour (hard rule 6).
