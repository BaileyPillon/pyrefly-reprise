# Trema line-up battle poses: method check (rule 15)

2026-09-25, written before any render. **FFX-2 only**: Chapter XIII's line-up (TR10,
`docs/plans/chapter-trema-review.md`): Yuna Dark Knight, Paine Dark Knight, Rikku Alchemist.
Candidates only; nothing is installed into `public/art/`, nothing goes into
`docs/target/approved-hashes.json` (rule 9).

## 0. What the game reads, and what is empty

- `src/engine/BattlePresenterArt.ts` `PARTY_POSES` = idle, ready, attack, cast, item, hurt, ko,
  victory, defend, looked up under `public/art/characters/<girl>-<dressphere>/<pose>.png`
  (`artIdFor`: an FFX-2 girl's art id is `<id>-<dresspheres.current>`), and only for poses that
  `public/art/manifest.json` lists (numbered candidates are never listed).
- When a slot is empty, `POSE_FALLBACKS` walks down to something that exists: attack -> ready ->
  idle, cast -> attack -> idle, item -> cast -> idle, hurt -> idle, ko -> hurt -> idle,
  defend -> ready -> idle, victory -> idle. So today all three girls show the idle for
  everything, and a KO'd girl is her idle laid down by `setPose('ko')`.
- Which pose a command shows (`poseForCommand`, `BattlePresenterEvents.ts`): Attack ->
  attack; any ability (Darkness, Arcana, the Alchemist's Stash and Mix), spherechange -> cast;
  Items -> item; Defend -> defend; the acting turn -> ready; damage -> hurt; KO -> ko;
  the win -> victory.
- On disk: `yuna-dark-knight` and `rikku-alchemist` hold `idle.png` only; `paine-dark-knight`
  holds `idle.png` plus the `idle-a.1..4` breathing frames. Every other slot is empty.
- Decisions that limit slots: D-034 (Chapter VI option A) and D-045 (Chapter VII) limit
  **enemy** subjects to idle plus one cast; no decision limits a party member's slots.
- **Rendered: attack, cast, hurt, ko, victory** (the five every shipped FFX-2 dressphere set
  carries: `yuna-gunner`, `yuna-black-mage`), then **item** as the second priority (Trema's
  kit has Megalixir, Curtains and Remedy, TR11). **Not rendered: ready and defend.** The game
  reads them, but no party member in either game has one (the manifest comment in
  `ArtManifest.ts` says so), `ready` is the idle plus the presenter's forward lean and turn
  ring, and painting them for these three only would make the Trema line-up the one set
  that behaves differently. Named in the README as a question, not built.

## 1. What failed before (art round 4 part 2, 2026-09-21)

Read from `docs/concepts/art4/README.md` Part 2 on branch
`claude/affectionate-goldstine-a4a2c6` (commit f94d01b, tooling `_gen-worklist.mjs`,
`_pose-overrides.json`, `_render-remaining.mjs`, `_qc-candidates.py`, `_make-sheets.mjs`;
read, not modified).

1. **v1 (cast.json verbatim): Bailey said the renders "look very wrong".** Two causes, found in
   the sidecars: effect words in the pose and identity tags (`dark aura`, `dynamic pose`,
   `action pose`, `glowing magic circle`, `sparks`) sprayed swirls and slash trails that
   rembg kept, so every `yuna-dark-knight/{attack,cast,hurt}` cutout was the whole
   832x1216 canvas; and cast.json's identity (`black armor, horned helmet, dark aura`)
   disagrees with the approved idle (`indigo armor ... crescent helmet, pink thigh covers`),
   so the prompt fought its own reference.
2. **v2 (identity from the idle's sidecar, body-only natural-language pose templates, an
   effects negative) fixed the swirls but not the pose.** Pilot of 5: `yuna-dark-knight/attack`
   did not read as an attack (she leaned on a planted sword: `greatsword raised overhead
   with both hands` did not land on this tag-trained checkpoint), the crescent helm was
   missing in all nine dark-knight candidates, two attacks carried a giant white slab of a
   sword.
3. Things learnt since, elsewhere in the repo, that also apply here:
   - `docs/plans/art-method-r3/METHOD-CHECK.md` (Chapter VI) section 1: CLIP-Vision
     **centre-crops a square**, so a tall 832x1216 idle given as `--ref` loses the head and the
     feet; the fix was the idle square-padded on white plus a head crop, batched and concat
     (`tools/gen/lora-leblanc.mjs`, `docs/concepts/chapters/leblanc/lora/leblanc/poses/render.mjs`).
     `tools/gen/comfy.mjs` `stageImage` still does not pad, so v2's refs were cropped.
   - The same chapter's LoRA + **OpenPose** rounds: the xinsir OpenPose SDXL ControlNet
     (installed, `models/controlnet/xinsir-controlnet-openpose-sdxl-1.0.safetensors`) holds a
     pose that words alone do not; at strength 0.6 to 0.7 words can still override it, at
     0.75 to 0.9 it holds the legs; a skeleton drawn too wide in the shoulders turns the
     body frontal.
   - Colour words bind to the wrong noun in a long identity block (C2): keep the identity
     short and the idle's own words.

## 2. What is different now

| Failure | This round |
| --- | --- |
| Effect words spray swirls | Pose tags are **body-only Danbooru tags**; no aura, magic, glow, spark, slash, motion or dynamic-pose word anywhere; `SPRITE_NEGATIVE` (which carries `EFFECTS_NEGATIVE`) plus `magic circle, glowing weapon, fire, lightning, dark aura` in every negative. |
| Stale cast.json identity | Identity is **each shipped idle's own sidecar prompt**, with its effect and pose words stripped and anything the idle picture does not show dropped (Paine's sidecar says `horned helmet, dark aura`; her idle shows no helmet at all, so both leave, `helmet, horns` go to the negative). |
| Natural-language poses ignored | The pose is **drawn**: one OpenPose COCO-18 skeleton per slot (`skeletons.py`), at the idle's own pixel scale, body facing screen-right three-quarter (the party contract, ART-PIPELINE section 2a), ko prone head-right on 1216x832. The words only name the pose in tags. |
| The reference never showed the face | IP-Adapter is **forced on** (no colour-spread guard in this graph) with two images, batched and concat: the idle **square-padded on white** and a **square head crop** of the idle. Weight 0.3, ease in, 0.2 to 0.6, K+V (the pipeline's R2 defaults; start above 0 so the skeleton lays out the pose first). |
| Nobody looked before the batch | **QC gate**: black-frame check (an all-black frame stops the whole run, no re-roll), `tools/gen/cutout-guard.mjs` on every cutout (full-frame, detached blob, white blob), then **a look at 1:1 beside the idle** before anything else is rendered. The pilot is 4 candidates of one slot (`yuna-dark-knight/attack`, the slot that failed twice); only if they read as the same girl in the same dressphere does the run go on. |
| Two failures on one slot | If the pilot fails, the next step is this file updated with why, not a third blind batch. |

No LoRA exists for these dresspheres (`models/loras` has `yuna-x2`, Yuna's default Gunner
outfit, which would pull the costume toward the Gunner), and training one is out of scope.

## 3. The recipe

Graph (core ComfyUI nodes plus the installed IP-Adapter node): Animagine XL 4.0 Opt ->
IPAdapterAdvanced (the two refs above) -> KSampler (28 steps, cfg 6, euler_ancestral,
normal); the prompts through ControlNetApplyAdvanced (xinsir OpenPose, strength 0.65 to 0.85,
0 to 1). Prompt: `1girl, solo, <character tag>, <pose tags>, <idle identity>, three-quarter
view, looking at viewer, full body, simple background, white background, <style>, <quality>`.
Output: `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu4/trema-poses/<girl>/<pose>/`
(`cand-N.raw.png`, `cand-N.png` cutout, `cand-N.json` sidecar with every setting).
Driver: `render.mjs`; one shared ComfyUI, never more than 3 prompts pending, never restarted.

## 4. Pilot 1 result and the next step (written before pilot 2)

`yuna-dark-knight/attack`, 4 candidates, OpenPose 0.65 / 0.75 / 0.85 / 0.75, IP-Adapter 0.3.
Looked at 1:1 beside the idle.

- **Fixed:** the pose. All four are a two-handed forward lunge toward screen-right, the
  thing v1 and v2 never got; no swirls, no slash trails, no kept white background; the face
  reads as Yuna (brown bob, heterochromia).
- **Not fixed, so the pilot FAILS the "same girl, same dressphere" bar:** the teal helm is gone
  or replaced by an invented crown; the dark-blue gold-engraved greatsword became a pink blade,
  a crescent axe or a cyan sword; the white cape and pink skirt tail grew into huge wings or
  ribbons that fill the frame (cand-1 and cand-2 are full-canvas cutouts, the guard rejects
  both). Heads come out about 1.3x the idle's pixel scale.
- **Why:** identity words were the idle's sidecar words, which describe the costume in terms
  the checkpoint does not bind to the idle's actual look (`crescent helmet`, `pink thigh
  covers`), and at 0.3 the adapter is too weak to carry the helm and the sword by itself.
- **Pilot 2 (one variable per arm, same seeds, OpenPose 0.75 to 0.85):** A2 = identity read
  off the idle picture (`teal helmet, blue crest, white capelet, gold sash, blue pleated skirt,
  pink thighhighs, dark blue greatsword, gold engraving, red sword grip`) with wings, feathers,
  scythe, axe, pink sword and huge ribbons negated, adapter 0.3; B = A2 plus the adapter at
  0.5 to 0.8; C = A2 plus the adapter at 0.65 linear to 0.85 (the old default, safe from pose
  capture here because the skeleton holds the pose). If no arm reads as her, stop this girl and
  report rather than rolling more.

### Pilot 2 result

- **A2 (idle-read words, adapter 0.3) and B (same words, adapter 0.5 to 0.8) both read as Yuna
  in her Dark Knight dressphere**: teal helm, white cape and capelet, gold sash, blue pleated
  skirt, pink thighhighs, blue armoured boots, a dark-blue greatsword in A2 cand-2 and cand-3.
  B holds the palette a little closer. Still wrong: one frame sprays red-orange flame shapes
  (the guard passes it), one sword turns thin and light blue, the capes flare to the frame edge.
- **C (0.65 linear) fails** the way ART-PIPELINE section 3 predicts: colour burn and a swirl ring
  around the figure in every frame. Not used.
- Heads were still about 1.3x the idle's pixel scale.
- **Production recipe from here:** B (adapter 0.5, ease in, 0.2 to 0.8) with the idle-read
  identity (`identity2` in render.mjs, written the same way for Paine and Rikku off their idle
  pictures), `flames, fire trail, swirl, splash` added to every negative, and the skeletons
  shrunk to 0.8 about the ground line (0.85 for ko) so the head lands at the idle's size.

### Pilot 3 (production recipe, 4 frames) result

Heads now match the idle's scale. Identity holds (helm, flower, cape, sash, skirt, thighhighs,
boots). Wrong: adding `huge ... broad blade` to the sword words made the blade a slab that
covers a third of the frame and turned it gold or silver; one frame has a swirl ring. Those
two words are removed again (back to pilot 2's `dark blue greatsword, gold engraving, red
sword grip`); the recipe is otherwise kept and the run goes on to Yuna's other slots, then
Paine and Rikku, each slot looked at before the sheets.

## 5. Second tries (rule 15), written before rendering them

After the full r2 pass (4 frames a slot, 6 for attack), looked at 1:1:

- **Rikku:** every slot reads as her Alchemist (bandana, red scarf, yellow top, suspenders,
  green skirt, orange legs, blue boots with green cuffs, the purple flask). No second try.
- **Yuna hurt failed twice** (r2: a sword pillar filling the frame, one split sword; r3 with
  the sword named small and the weighted word removed: detached helm pieces, flowers and
  blades floating off the figure, or a figure that is standing, not hurt). **Stopped**: no third
  try. The slot stays empty and the engine keeps showing the idle under its flinch, flash and
  shake (the same answer D-034 gave Chapter VI's bosses).
- **Paine cast, item and hurt failed once**: every frame carries two weapons (a sword plus a
  spear, a scythe or a second sword) or a sword so big it fills the frame. **Cause:** four
  sword words in her identity (`huge greatsword, silver blade edge, copper engraved blade,
  winged crossguard`) plus a sword in the pose tags read as more than one weapon.
  **Second try (arm r3):** `dual wielding, two weapons, spear, scythe, polearm, staff, second
  sword` negated for both Dark Knights; for cast, item and hurt only, the weighted sword word
  leaves the identity and the pose says `(single weapon:1.2), one hand holding sword` (variant 2
  in render.mjs). Yuna's item gets the same second try (r2's item frames grew an extra armoured
  figure, a sunburst and an archway). If a slot fails this second try it stops, as Yuna's hurt did.

### Arm r4 (Yuna's helm), result

The helm reads as a teal cap in most r2 frames. r4 raised the helm words
(`(teal helmet:1.35), (blue crest on helmet:1.2), (helmet covering hair top:1.1)`) on attack,
cast and victory, 6 frames each: the crest shows more often, but the heavier words brought back
clutter (floating flowers, arcs, rings, extra props) in cast and did not make a better attack or
victory than r2's picks. r4 is kept on disk and not recommended; the helm stays a named defect.

## 6. Totals

185 renders on the shared ComfyUI (every one has a `cand-N.json` sidecar under the candidates
folder), never more than 3 prompts pending, no black frame, ComfyUI never restarted.
