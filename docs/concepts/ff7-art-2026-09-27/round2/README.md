# FF7 art, round 2: party faces left, Barret with his gun-arm on the right arm, bulkier Guard Scorpion with a laser tail (2026-09-27)

**These are candidates, not approved art.** Nothing is installed in `public/art/`. The picks below
are **an agent's look**; Bailey picks. Game case: **FF7 only** (the hidden, experimental Guard
Scorpion encounter at the No. 1 Reactor core, `research/ff7-guard-scorpion.md`).

Why round 2 exists: Bailey, 2026-09-27, "full speed ahead please. godspeed. ill go with all your
recommendations." (recorded in `../README.md` and D-240). The four recommendations he accepted
were: Barret is never mirrored and has his gun-arm on his right arm; the art follows FF7's own
battle staging; Cloud is repainted if that staging flips his facing, with the pauldron kept on his
left shoulder; and Guard Scorpion gets a laser-emitter tail tip and a bulkier, boss-sized body.

## The staging these renders follow (from `research/ff7-battle-staging.md`, commit 7dc45c56)

- The party stands on the **right** and faces **left**. Guard Scorpion is on the **left** and faces
  **right** (§2 and §3.3, `[verified: 2 informal sources]` for the side; the facing is `[derived]`).
- A figure facing screen-left shows its **left** side to the camera (§6.3, geometry). So Cloud's
  left pauldron is on the **near** shoulder, and Barret's right gun-arm is on the **far** arm. The
  gun-arm is posed pointing forward, toward the enemy, so it clears his body.
- Correction to round 1: `../README.md` said a right-facing Cloud had his left pauldron on the
  near side. That is the wrong way round (§6.3), so round 1 `cloud/idle.1` shows the pauldron on
  his **right** shoulder. It is superseded here anyway, since the party now faces left.

## Recommended per subject (an agent's look)

Full-size cut-outs, raw renders and sidecars (seed, prompt, negative, denoise, cut-out report) are in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7/<subject>/round2/`. The repair round's are in `<subject>/round2-repair/`.

| Subject | Pick | Seed | Denoise | Runner-up | Caveat |
|---|---|---|---|---|---|
| Guard Scorpion, tail lowered | `guard-scorpion/round2/idle-a.2` | 603731043 | 0.80 | `pilot-idle` (seed 1690310347) | The eye is yellow-green, while the raised pick's eye is cyan. Only four of the six legs show (the far legs are hidden), which was also true of round 1's `idle-a.3` |
| Guard Scorpion, tail raised | **repair:** `guard-scorpion/round2-repair/cut-raised-r.a.2` | inpaint seed 7202 on `idle-a.2` (seed 603731043) | 0.70 (masked, tail only) | `cut-raised-r.b.3` (seed 7303, 0.74) | Same machine as `idle-a.2` by construction: only the tail was repainted. The emitter is a red finned barrel with a cyan lens, aimed at the party. Replaces round 2 `raised-a.1`, which the canon judge failed |
| Barret | **repair:** `barret/round2-repair/idle-r2.1` | 160852785 (`v4-d.1`), then hair inpaint seed 8301 | 0.85, hair 0.60 | `recut-v4-c.2` (seed 1195932527, 0.83) | A grey metal band is slung diagonally across the hips, under a dark metal band at the waist. The vest armholes have a pale fleece trim, which is not canon. Replaces round 2 `idle-c.2`, which the canon judge failed |
| Cloud | `cloud/round2/turn-a.2` | 840006496 | 0.80 | `turn-a.1` (seed 840006495) | The white wrist wrap is on his left forearm, next to the gear armlet. Canon puts the SOLDIER band on his **right** wrist |
| Backdrop | round 1 `reactor-core/core.1` (unchanged, accepted pick) | 383424147 | | | |

`05-composite-1600.jpg` and `06-composite-phone-390.jpg` show the picks together on `core.1`, with
the boss on the left and the party on the right. The `-tail-raised` pair shows the same scene with
the tail raised. After the repair round, both pairs were rebuilt with the repaired picks (`idle-r2.1`, `cut-raised-r.a.2`). Both are rough, with no HUD, and the scale and placement are guesses. The boss is
drawn larger than the party so it reads as boss-sized.

## Per subject: what was checked, what is canon, and the sources

### Guard Scorpion (sheets `01`, `02`)

- **Method.** This is the round 1 method that worked. Our own flat-colour layout sketch is drawn in
  code by `scripts/gs-r2-sketch.py` and sent through `tools/gen/comfy.mjs boss --img2img` at 0.80 to
  0.84. Round 2 changes the sketch in three ways. The chassis is taller and longer, with a bigger
  head and shorter, thicker legs. The tail tip is a squat barrel housing with a large round lens
  that aims forward, with no blade. The disc on the back and the twin rifles are kept from
  `idle-a.3` / `raised-a.2` as the identity base. The negative adds `stinger, blade, spike, claw,
  hook, sickle`. All nine renders passed the cut-out check. `idle-b.1` (a gripper tip) and
  `idle-b.2` (a hose tail) are rejects.
- **Facing right, and the one flip in this round.** The design is bilaterally symmetric: twin
  rifles, one centred eye and a centred tail. So the **flat sketch** was drawn head-left and then
  flipped before img2img. **No painting was mirrored.** Every render was painted facing right.
- **Canon used** (FF Wiki via the MediaWiki API, 2026-09-27, as cited in `../README.md`): *Guard
  Scorpion* series page, "a heavily armed guard robot that resembles a scorpion ... six legs and a
  long tail"; *Guard Scorpion (Final Fantasy VII)*, with two forms (tail lowered and tail raised)
  and Tail Laser as its counter while the tail is up. The attack names Rifle, Scorpion Tail and
  Tail Laser are in `research/ff7-guard-scorpion.md` §4. The red colour comes from the FFBE text
  "red monstrosity". Everything else is **our design, not canon**: the lens emitter's shape and
  cyan glow, the eye colour, the disc on the back and the proportions `[unsourced: design choice]`.

### Barret (sheet `03`)

- **Method.** Our own sketch (`scripts/party-r2-sketch.py`, `barret2.png`) shows him in
  three-quarter view facing left. The far (right) arm points forward toward the left edge, with the
  gun grafted in place of the forearm and no right hand. The near (left) arm has a clenched fist,
  metal bands and the skull tattoo on the shoulder. The sketch goes through `comfy.mjs character
  --facing left --img2img`. I ran three pilots at 0.80, 0.83 and 0.86 and looked at each one.
  **0.86 is out**: `pilot-086` grafted the gun onto the arm whose shoulder carries the skull,
  which is the left arm, Dyne's side. The main batch then ran at 0.80 to 0.82. A second pass banned
  `weapon on back, gun on back`, because `idle-a.2`, `idle-a.3` and `idle-c.1` grew a second gun
  standing up behind the head. `idle-b.1` holds a rifle in its hand, and `idle-b.2` has no gun at
  all. Every candidate on the sheet was checked for **which arm** carries the gun, not which side
  of the picture it is on.
- **Never mirrored.** No Barret image was flipped at any stage.
- **Canon used** (FF Wiki *Barret Wallace*, revid 4042820, Appearance, read 2026-09-27; original
  FF7 look, not the Remake): heavy-set, muscular, dark-skinned. "His right arm ... has been
  replaced with his weapon, the gun-arm". Several bands of metal around his waist. A skull tattoo
  on his **left** shoulder. A hi-top fade. A thick beard. Two dog tags. Three scars on the right
  cheek (the far side, so they are not visible). A silver hoop earring in his left ear. A dirty
  brown vest, green pants, large brown boots, and bands of metal on his remaining arm. The Remake
  adds sunglasses, so `sunglasses` is in the negative. The gun-arm side is `[verified: 2 independent
  sources]` in `research/ff7-battle-staging.md` §6.1 (FF Wiki; Wikipedia, "His right hand is
  replaced with a prosthetic gatling gun"). His starting weapon, the Gatling Gun, is in
  `research/ff7-guard-scorpion.md` §8.3.

### Cloud (sheet `04`)

- **Method.** Same sketch-then-img2img method (`cloud2.png`, then `cloud2t.png`), `--facing left`.
  The first batch (`pilot-082`, `idle-a.*`, `idle-b.*`) came back nearly frontal. The pauldron was
  on his left shoulder in each case, but they barely read as facing left. The turned sketch
  `cloud2t.png` has a narrower torso, the face in profile toward the left and the boots pointing
  left. With `looking to the side` it gave `turn-a.*` / `turn-b.*`, which read clearly as
  three-quarter left. `idle-a.3` is the frontal one where all three chiral details appear right (pauldron
  left, gear armlet on the left forearm, band on the right wrist), if Bailey prefers a frontal
  stance.
- **Never mirrored.** Round 1 `idle.1` was not flipped. Every Cloud here is a new painting.
- **Canon used** (FF Wiki *Cloud Strife*, revid 4045701, Appearance, read 2026-09-27): spiky blond
  hair and blue eyes. A large broadsword, the Buster Sword. Indigo pants, a sleeveless shirt and a
  belt. Brown boots. Gauntlets, with "a pauldron over his left shoulder", and "a SOLDIER band on his
  right wrist". A gear-like armlet on his left forearm. A silver earring in his left ear. The
  pauldron side is `[single source]`, `research/ff7-battle-staging.md` §6.2.

## Repair round (2026-09-27): Barret and Guard Scorpion's tail-raised form

An adversarial canon judge failed two round 2 picks, Barret `idle-c.2` and Guard Scorpion `raised-a.1`.
The other picks passed and are unchanged: Guard Scorpion `idle-a.2`, Cloud `turn-a.2` and backdrop `core.1`.
Only those two subjects were repainted. I looked at every result (sheets `09`, `10`, `11`).

### Guard Scorpion, tail raised: `guard-scorpion/round2-repair/cut-raised-r.a.2` (sheet `09`)

- **What failed.** `raised-a.1` read as a different robot from `idle-a.2`. It had a rounded capsule
  shell, a red disc, pillar legs with cone feet and a cyan eye. Every other round 2 raised render
  had the same problem.
- **Method (the judge's suggestion).** The raised form is seeded from `idle-a.2`'s own raw render.
  `scripts/repair/gs-raised-paintover.py` erases the lowered tail. It then paints a rough raised
  tail in `idle-a.2`'s own colours: red armour blocks on black joints, and at the tip the same red
  housing with a cyan lens, plus fins and a dark muzzle shroud. It also writes a mask that covers
  only the old and new tail. `scripts/repair/run-gs-raised.sh` runs `tools/gen/inpaint.mjs --latent`
  on that mask, so the shell, the black box on the back, the legs, the red feet, the yellow-green
  eye and the twin rifles are **pixel-identical** to `idle-a.2`. That covers "same machine" and the
  bulky, boss-sized body, since it is the idle's own body.
- **Tail tip.** It is a laser emitter: a red cylindrical barrel with cooling ribs and a cyan lens
  in a steel muzzle ring, aimed forward and down toward the party. There is no blade, stinger or
  spike, and `stinger, blade, spike, claw, hook, sickle` are negatives. Two pilots came first.
  In `pilot-062` the emitter was a black box, which reads as a camera. `pilot-075` had cyan rings
  on the joints, which are not on the idle's tail. The prompt was then tuned, giving six
  candidates. Runner-up `cut-raised-r.b.3` has a clear red-and-steel barrel with a blue lens.
  `r.b.2` (black camera-like housing) and `r.a.1` (green lens) are weaker.
- **Canon.** Unchanged from above: two forms, and Tail Laser while the tail is up. The emitter's
  shape is `[unsourced: design choice]`. The boss faces right, and nothing is mirrored.

### Barret: `barret/round2-repair/idle-r2.1` (sheet `10`)

- **What failed in `idle-c.2`, and what the pick shows now.** Each line gives the failure, then the fix.
  - Detached chip: gone. The pick has 1 component (see the cut-out check below).
  - Mohawk: now a **hi-top fade**, a tall flat top with the sides faded short.
  - Glove, and no arm bands: now a **bare left fist** with **metal bands on the left forearm**.
  - Leather belt: now **metal bands at the waist**. See the disclosure below.
  - Dog tags not visible: **two dog tags** now show on a chain over a **bare chest**. There is no
    shirt and no collar.
  - Brown plank: gone.
  - Ribbed cannon: now a **multi-barrel gatling**, a ring of barrels with a clamp ring and a muzzle
    face.
  - Nearly frontal: now a **three-quarter view facing left**, with the head turned left and both
    boots pointing left.
  - Inked comic style: now a softer painted shading closer to Cloud's and the Scorpion's. It is
    still anime cel, not the FFX paintings' finish.
- **Chirality, checked on the pick.** The gun-arm is the far arm. It is his **RIGHT** arm (image
  left, since he shows his left side), grafted at the forearm with no right hand. The skull tattoo
  is on the near, image-right shoulder, which is his **LEFT**. The hoop earring is in the near
  (**left**) ear. The pick was **never mirrored**, and no Barret image was flipped at any stage.
- **Method.** I drew a new shaded sketch (`scripts/repair/barret-r2b-sketch.py`), in two steps:
  - v3 (`barret3.png`): every part has a soft light-to-shadow gradient instead of a flat fill.
    The sketch has every canon detail, a turned torso, a three-quarter face and a six-bore
    gatling.
  - v4 (`barret4.png`): the head is scaled to 0.8 and the barrels are longer. The v3 pilots came
    back big-headed, and their stacked rings read as a dumbbell.

  The prompt weights now go through `--emphasis`. In round 2 they were in `--tags`, which escapes
  parentheses, so `(gun arm:1.3)` carried no weight. `--facingPhrase` drops round 2's `(looking at
  viewer:1.2)`, which kept the eyes on the camera. The render is `comfy.mjs character --facing left
  --img2img barret4.png`, run by `scripts/repair/run-barret.sh`, at 0.80, 0.83 and 0.85: 12
  renders. Text-to-image (`t2i-a.*`) had a softer style, but all three **held** a huge gun
  instead of wearing a grafted one, so it was dropped. A blur-and-refine second pass (`ref2-*`, 0.55 to 0.65, on `pilot-082` and `idle-r.a.3`) softened the shading a little but kept the v3 proportions, so it was dropped too. The v4 pick `v4-d.1` (seed 160852785,
  0.85) had every chiral and canon detail except its hair, which was a low flat-top. A masked
  inpaint on the crown only (`scripts/repair/barret-hair-paintover.py`, `run-barret-hair.sh`, seed
  8301, 0.60) raised it into a hi-top fade. The first try, with the block drawn 90 px tall, came
  out hat-tall. The face, body and gun are outside that mask.
- **Disclosed, not fixed.**
  - A grey metal band is slung diagonally across the hips. It is metal, not the failed brown
    plank, but canon only says "several bands of metal around his waist".
  - The vest armholes have a pale fleece trim.
  - The hair is a flat black mass with little texture.
  - The three scars on his right cheek are on the far side, so they do not show (canon).
  - Runner-up `recut-v4-c.2` has a taller hi-top, a front-facing gaze and one wide metal waist
    band, but no forearm bands.
- **Canon.** The same FF Wiki revid 4042820 and Wikipedia text as in the Barret section above.

### The cut-out check, tightened

`scripts/repair/cutout-check.mjs` runs the pipeline's own guard. It also runs a strict check: any
opaque piece other than the largest one, with 24 px or more at alpha 8 or above and 8-connected,
fails. The guard's `touchesLargest` compares bounding boxes, and that is how `idle-c.2`'s 648 px
chip passed. Results:
- Every repair pick and runner-up passes both checks, with 1 component each. That covers
  `idle-r2.1`, `idle-r2.3`, `recut-v4-d.1`, `recut-v4-c.2`, `recut-v4-b.2` and the six
  `cut-raised-r.*`.
- The kept picks, `idle-a.2` and `turn-a.2`, also have 1 component each.
- Round 2 `idle-c.2` has 2 components, so it fails.

## Rule checks

- Rule 8: no retail image, model, sprite or screenshot was used as input, reference, IP-Adapter
  source or trace. Every img2img source is one of our own code-drawn sketches
  (`07-layout-sketches.jpg`). The prompts carry the same character-name tags as round 1. In the repair round,
  every source is our own: the code-drawn `barret3`/`barret4` sketches and paintovers on our own renders
  (`idle-a.2.raw`, `v4-d.1.raw`), shown in `11-repair-sketches.jpg`. No IP-Adapter reference was used.
- Rule 12: ComfyUI was never restarted. Prompts were submitted only while fewer than 2 were
  pending. I looked at every render, and there were no black frames. This also holds for the repair round (41 renders and inpaints).
- `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: 0 mismatched, 0 missing.
  `approved-hashes.json` and `judge-locked-hashes.json` were not touched. Nothing is in `public/art/`.

## Files

- `01-guard-scorpion-idle.jpg`, `02-guard-scorpion-raised.jpg`, `03-barret.jpg`, `04-cloud.jpg`: candidate sheets (each under 1 MB, at most 1790 px tall)
- `05-composite-1600.jpg`, `06-composite-phone-390.jpg` (+ `-tail-raised` versions): the picks on `core.1`
- `07-layout-sketches.jpg`: our original layout sketches (Guard Scorpion low and raised; Barret; Cloud first and turned)
- `09-repair-guard-scorpion-raised.jpg`, `10-repair-barret.jpg`, `11-repair-sketches.jpg`: the repair round's sheets (each under 1 MB, at most 1252 px tall); the repair round rebuilt `05`/`06` with the repaired picks
- `scripts/repair/`: `gs-raised-paintover.py`, `run-gs-raised.sh`, `barret-r2b-sketch.py`, `run-barret.sh`, `barret-hair-paintover.py`, `run-barret-hair.sh`, `cutout-check.mjs`
- `scripts/`: `gs-r2-sketch.py`, `party-r2-sketch.py` (the sketches), `common.sh` (every prompt and negative), `run-r2-pilot.sh`, `run-r2-main.sh`, `run-r2-second.sh` (the batches in order), `sheet.py`, `composite-r2.py`
