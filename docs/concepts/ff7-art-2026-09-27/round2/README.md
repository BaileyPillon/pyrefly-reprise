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
`D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7/<subject>/round2/`.

| Subject | Pick | Seed | Denoise | Runner-up | Caveat |
|---|---|---|---|---|---|
| Guard Scorpion, tail lowered | `guard-scorpion/round2/idle-a.2` | 603731043 | 0.80 | `pilot-idle` (seed 1690310347) | The eye is yellow-green, while the raised pick's eye is cyan. Only four of the six legs show (the far legs are hidden), which was also true of round 1's `idle-a.3` |
| Guard Scorpion, tail raised | `guard-scorpion/round2/raised-a.1` | 250647136 | 0.82 | `pilot-raised` (seed 343433927; its yellow eye matches `idle-a.2`, but the emitter looks like a dark camera housing) | Eye colour differs from the idle pick (see above). The tail is up and the emitter aims forward and down over the body |
| Barret | `barret/round2/idle-c.2` | 39601542 | 0.82 | `pilot-083` (seed 1632986181, denoise 0.83) | A cream shirt collar shows under the vest. The original has none (the Remake adds a black tank). The gun reads as a ribbed cannon, not clearly a multi-barrel gatling |
| Cloud | `cloud/round2/turn-a.2` | 840006496 | 0.80 | `turn-a.1` (seed 840006495) | The white wrist wrap is on his left forearm, next to the gear armlet. Canon puts the SOLDIER band on his **right** wrist |
| Backdrop | round 1 `reactor-core/core.1` (unchanged, accepted pick) | 383424147 | | | |

`05-composite-1600.jpg` and `06-composite-phone-390.jpg` show the picks together on `core.1`, with
the boss on the left and the party on the right. The `-tail-raised` pair shows the same scene with
`raised-a.1`. Both are rough, with no HUD, and the scale and placement are guesses. The boss is
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

## Rule checks

- Rule 8: no retail image, model, sprite or screenshot was used as input, reference, IP-Adapter
  source or trace. Every img2img source is one of our own code-drawn sketches
  (`07-layout-sketches.jpg`). The prompts carry the same character-name tags as round 1.
- Rule 12: ComfyUI was never restarted. Prompts were submitted only while fewer than 2 were
  pending. I looked at every render, and there were no black frames.
- `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: 0 mismatched, 0 missing.
  `approved-hashes.json` and `judge-locked-hashes.json` were not touched. Nothing is in `public/art/`.

## Files

- `01-guard-scorpion-idle.jpg`, `02-guard-scorpion-raised.jpg`, `03-barret.jpg`, `04-cloud.jpg`: candidate sheets (each under 1 MB, at most 1790 px tall)
- `05-composite-1600.jpg`, `06-composite-phone-390.jpg` (+ `-tail-raised` versions): the picks on `core.1`
- `07-layout-sketches.jpg`: our original layout sketches (Guard Scorpion low and raised; Barret; Cloud first and turned)
- `scripts/`: `gs-r2-sketch.py`, `party-r2-sketch.py` (the sketches), `common.sh` (every prompt and negative), `run-r2-pilot.sh`, `run-r2-main.sh`, `run-r2-second.sh` (the batches in order), `sheet.py`, `composite-r2.py`
