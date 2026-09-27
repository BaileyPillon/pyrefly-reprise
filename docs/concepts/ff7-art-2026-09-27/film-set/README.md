# FF7 art: the full Film set (Cloud, Barret, Guard Scorpion, backdrop), 2026-09-27

**Candidates only. Nothing is installed in `public/art/` and nothing is wired.** Game case: **FF7 only**
(the hidden, experimental Guard Scorpion fight at the No. 1 Reactor core). Nothing in FFX or FFX-2
changed; the board and the main save are untouched. The picks below are **an agent's look**.

Why: Bailey, 2026-09-27, "I'll go with all of your recommendations", which picked art direction 3,
"Film" (`../hifi/`), with its one fault fixed first: the green/cyan rim baked onto the BACK edge of
Cloud and Barret. The staging stands as set before that: the party is on the LEFT facing screen-right,
and Guard Scorpion is on the RIGHT facing screen-left ("not mirrored just literally switch sides").
A figure facing screen-right shows its RIGHT side. So Barret's gun-arm (his right arm) is the near
arm, and Cloud's single pauldron (left shoulder) is on the far side. **Nothing is mirrored**; every
sidecar says `mirrored: false`.

This README is the state after the **repair round** (same day): a judge LOOKed at the first set and failed
16 poses (Cloud's idle and all seven of his other poses; Barret's aim, fire, squat, punch and hurt; Guard
Scorpion's recoil). Every one was repaired or remade, and every result was LOOKed at before it was picked.
What each fault was and what was done is under "The repair round" below.

## Look at these first (phone-readable, each under 1 MB)

| File | What |
|---|---|
| `01-frame-idle-1600.jpg`, `01-frame-idle-390.jpg` | The idle set on the Film reactor core, desk and phone (scene only, no HUD) |
| `02-frame-action-1600.jpg`, `02-frame-action-390.jpg` | The action moment: Cloud's strike, Barret firing, Guard Scorpion with the tail raised |
| `11-frame-hit-1600.jpg`, `11-frame-hit-390.jpg` | The hit moment: Cloud's follow-through, Barret aiming, Guard Scorpion recoiling |
| `03-cloud.jpg` | Cloud's 8 picks, on one scale |
| `04-barret.jpg` | Barret's 6 picks, on one scale |
| `05-guard-scorpion.jpg` | Guard Scorpion's picks (the recoil in both tail forms), on one scale |
| `12-repair-cloud.jpg` | **The repair round, Cloud**: the first set's pick beside this round's, per pose |
| `13-repair-barret-gs.jpg` | **The repair round, Barret and Guard Scorpion**, the same way |
| `06-backdrop.jpg` | The backdrop pick, and the glyph-like mark painted out (unchanged this round) |
| `07-faults-fixed.jpg` | The judge's first Film faults: the hi-fi pick against this set |
| `08`, `09`, `10-renders-*.jpg` | Every render of the first round (full frames), with the first round's picks framed |
| `14`, `15-renders-repair-*.jpg` | Every render and local repair of the repair round, with this round's picks framed |

The frames were composed by the hi-fi round's own `../hifi/scripts/compose.py` (film grade), with
per-frame heights in `layout/` computed so each subject keeps one scale (`frame-idle.json`,
`frame-action2.json`, `frame-hit.json`).

## Recommended file per pose

All paths are under `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/`. Each cut-out has a
`.json` sidecar next to it with these fields:

- `subject`, `facing` (`right` for the party, `left` for Guard Scorpion) and `mirrored: false`.
- `baselineY` (the lowest opaque row: the feet, or the legs' contact line) and `anchorX` (the centre of
  the bottom 6 % of the figure).
- `scaleToIdle` and the size.
- The provenance (engine, seed, reference, prompt) and **every** post-process step, in order.
- Both cut-out reports: the pipeline guard and the strict one-component check (`recheck`), re-run on the
  final file.

**Every pick passes both checks** (no detached piece of 24 px or more, no halo on dark).

### Cloud (facing screen-right)

| Pose | Recommended file | Scale to idle | What this round changed |
|---|---|---|---|
| Idle | `cloud/idle/cut-p4x.png` | 1 | From `cut-p4w`: the slate/olive band outside the ink on the back of the near leg and boot became ink (`inkback.py`); the studio-grey shell by the pauldron spikes, on the far arm and round the hair was trimmed (`trim.py`); the "KWUO" scribble on the boot strap was repainted as plain stitched leather (`patch2.py`, seed 790002) |
| Attack: wind-up | `cloud/windup/cut-g.png` | 1.11 | From the first pick `p6`. Its only visible arm comes from under the pauldron, so that arm is his LEFT: its white band became the brown glove cuff (his right wrist is hidden behind it, which is canon). The dome pauldron came off and **the idle's own pauldron** was grafted on (`graft.py`). Blade and sweater green tint neutralised, skin matched to the idle, blade cut by a traced outline |
| Attack: strike | `cloud/strike/cut-r.png` | 1.02 | The pauldron repainted against the idle's (image 2), with its spike; the strap under it re-coloured from red to his straps' brown (`recolor.py`); the back rim on the near trouser cuff and boot inked; the grey fringe behind the head trimmed |
| Attack: follow-through | `cloud/follow/cut-y2.png` | 1 | The second white band (far wrist) became the glove cuff; the pauldron came off and the idle's was grafted on; the shirt edge and arm under it blended; the dark blob by the chin is gone with the trim |
| Victory: fist pump | `cloud/fistpump/cut-b2.png` | 0.99 | The extra white band round the near upper arm became bare skin; the pink band on the far wrist became skin down to the glove cuff; the scribble on the boot cuff was painted out |
| Victory: one-hand sword spin | `cloud/spin/cut-k.png` | 1 | **Remade.** An edit of the fist pump (so it has the idle's costume): the raised near fist, with the white band, holds the Buster Sword up, the broad blade angled over his head mid-twirl; the far hand is empty with only the glove cuff. The idle's pauldron was grafted on, the knit re-matched to the idle's indigo, the grey blade cut by a traced outline. The spin itself is motion for code |
| Victory: sword onto his back | `cloud/back/cut-y2.png` | 0.99 | A white SOLDIER band added on the raised near (right) wrist; the four-spike disc pauldron came off and the idle's was grafted on; the studio grey between arm and blade trimmed |
| Hurt flinch | `cloud/hurt/cut-z2.png` | 0.99 | The four-spike disc pauldron came off and the idle's was grafted on (so idle and hurt no longer pop); the grey smudge round the spikes trimmed; the scratch marks on the blade painted out |

### Barret (facing screen-right; gun-arm grafted on the near RIGHT arm, the left hand a hand)

| Pose | Recommended file | Scale to idle | What this round changed |
|---|---|---|---|
| Idle | `barret/idle/cut-p1.png` | 1 | Unchanged (it passed) |
| Attack: aim | `barret/aim/cut-k.png` | 1 | The canvas was extended and the clipped near boot completed (sole and heel), cut by colour key on a flattened background (`extend.py`, `patch2.py`, `flatbg.py`, `keycut.py`) and matched to the far boot's leather; the face scars taken off (expression kept); the skin matched to the idle; the mint rim on the back of the arm and vest inked (outer edge `derim.py` + `inkback.py`, inner edge `degreen.py` ink) |
| Attack: fire | `barret/fire/cut-k.png` | 1 | The same repairs on the fire render. Aim and fire are the same stance with a different face; the muzzle flash is drawn by code |
| Victory: squat | `barret/squat/cut-t2.png` | 0.85 | The gatling repainted as **the idle's** (four barrels in the stepped cylinder; the box magazine gone), from a crop of the idle as image 2; the extra steel band on the near upper arm became skin; the box seams on the arm and trousers blended; a stray curl off the top muzzle erased; the faint back rim inked |
| Victory: air punch | `barret/punch/cut-y2.png` | 0.99 | The seven-barrel cluster repainted as the idle's gatling; the elbow join made crisp; the back rim inked |
| Hurt flinch | `barret/hurt/cut-y1.png` | 0.99 | The two guns repainted as **one** idle gatling; the red stains the repaint left on the vest taken off; the back rim inked |

### Guard Scorpion (painted facing screen-LEFT, never flipped)

| Pose | Recommended file | Scale | Notes |
|---|---|---|---|
| Idle, tail lowered | `gs/idle/cut-tj.png` | 1 | Unchanged: the tail-raised pick, pixel for pixel, with only the tail repainted |
| Tail raised (laser lens) | `gs/raised/cut-p1s.png` | 1 | Unchanged |
| Hit / recoil, tail raised | `gs/recoil/cut-r12.png` | 1 | **Remade as an edit of `raised/cut-p1s`** (`recoil.py`), so it is the same machine: the whole body tilted 12 degrees about the rear foot, head end up and front legs off the floor; the sensor eye flared white-hot; the tail lens flickered dim. `pivotInOutput` in the sidecar is where the rear foot lands, so the game can keep it planted |
| Hit / recoil, tail lowered | `gs/recoil/cut-l12.png` | 1 | The same edit of `idle/cut-tj`, for a hit taken in the tail-down form |

The first recoil (`cut-p1s`, a separate painting that lost the dome, the visor and moved the eye) is retired.

### Backdrop

| Pick | Notes |
|---|---|
| `core/p1b.full.png` (2304 x 1296) | Unchanged: the hi-fi Film core (`../hifi/`, seed 733002) with two glyph-like marks painted out |

## Written source of each victory pose

FF Wiki, "Final Fantasy VII victory poses" (text only, read 2026-09-27, as cited in
`../../ff7-options-2026-09-27/README.md`, the accepted D1 option):

- **Cloud** "pumps his fist twice, spins his sword in one hand, places it on his back". These map to
  `fistpump`, `spin` and `back`.
- **Barret** "squats, stands and punches the air with his normal hand, looping". These map to
  `squat` and `punch`, with the left hand, because the right arm is the gun.

The attack keys follow the accepted B1 blocking (`../../ff7-options-2026-09-27/sheet-5-B-attack-motion.jpg`),
turned to face right. Canon costume points come from `research/ff7-battle-staging.md` (FF Wiki "Barret
Wallace": "a mechanical gun grafted in place of his right arm") and the hi-fi round's prompts. Guard Scorpion
follows `research/ff7-guard-scorpion.md` (the Raise Tail and Drop Tail forms).

## The repair round

### What the judge failed, and how it was handled

| Pose | Fault (the judge) | Handled by |
|---|---|---|
| cloud/idle | slate/olive band on the back of the near leg and boot; "KWUO" on the boot strap; grey smudge by the spike and on the far arm | `inkback.py`, `patch2.py` (strap), `trim.py` |
| cloud/windup | the band on the arm from under the pauldron; red forearm; green front; dome pauldron | band to glove cuff; pauldron off + idle's grafted; `skinmatch.py`, `degreen.py` |
| cloud/strike | olive rim on the back of the cuff and boot; grey halo behind the head; round pauldron | `inkback.py`, `trim.py`, pauldron repaint against the idle's, `recolor.py` (strap) |
| cloud/follow | band on both wrists; background blob by the face; pauldron without spike | far band to cuff; `trim.py`; pauldron off + idle's grafted |
| cloud/fistpump | band on the upper arm; pink band on the far wrist; boot scribble | three local repaints |
| cloud/spin | wrench-like weapon; a shoulder carry; no strap; odd pauldron; green tint | remade as an edit of the fist pump; idle's pauldron grafted; `matchto.py` |
| cloud/back | no white band; four-spike disc; grey wedge | band added; pauldron off + idle's grafted; `trim.py` |
| cloud/hurt | four-spike disc; grey smudge; blade scratches | pauldron off + idle's grafted; `trim.py`; blade repaint |
| barret/aim, fire | mint back rim; feet clipped; scars and browner skin; aim weakly different | outer and inner rim inked; boot completed; scars off; `skinmatch.py`. The pose is unchanged (see limits) |
| barret/squat | 5-6 barrels and a magazine; extra upper-arm band; faint rim | gatling repainted as the idle's; band off; rim inked |
| barret/punch | seven barrels; pale green rim | gatling repainted as the idle's; rim inked |
| barret/hurt | two guns, about nine barrels; green rim | one idle gatling; rim inked |
| gs/recoil | not the same machine; no tilt | an edit of the raised (and idle) pick: tilt + eye flare + lens flicker |

### What did not work (LOOKed at, not picked; all on sheets 14 and 15)

- **Fresh renders on the fixed idle** (Cloud wind-up `r1-r2`, spin `ra1-rb2`; Barret aim `r1-r2`): bands on both
  wrists, a second pauldron, a pauldron on the near shoulder, a hand-held gun, a belt with a buckle.
- **Edits of the idle into the new pose** (Cloud `e1-e2`, Barret aim `e1-e2`): the proportions drifted (head-fit
  0.81 and 0.87 of the idle's head) and Barret's aim became a hand-held gun with new hair.
- **Edits of a close pose** worked for the spin (`f2`, from the fist pump) but not for the wind-up (`f1-f2`, from
  the sword-on-back pose: a second blade, the band on the far arm), so the wind-up is the first pick repaired.
- **A pauldron repaint with the idle's pauldron as image 2** worked on the strike but kept the pose's own disc on
  the back and the hurt, so those (and the follow, wind-up and spin) got the **graft**: the old plate taken off by a
  local repaint, then the idle's own plate pasted from `cloud/idle/cut-p4x.png` along a hand-traced outline, scaled
  by 1/scaleToIdle, and the arm under it blended.
- **The first gatling repaints** (`p6x1`, `p3x1`, `p4a1`) grew a bright red bare forearm; the second try started the
  box below the elbow rings and said there is no forearm skin.
- The first aim/fire face box was misplaced (it drew a faint face in the empty background); redone at the face.

### New tools (all in `scripts/`, all on our own renders, nothing mirrored)

- `patch2.py`: `patch.py` plus identity references (crops of our own idle as images 2..), an optional colour
  match of the repaint to the source (`MATCH=1`), and a prov chain for the output.
- `trim.py`: clears the studio-grey shell the cut kept outside the ink outline (reachable from outside, near the
  studio colour stored under the transparent pixels).
- `inkback.py`: a slate/olive/mint band outside the ink on edges that do not face screen-right becomes ink.
- `degreen.py`: green tint off named parts (to grey, to the part's own hue, or to ink for an unlit inner edge).
- `graft.py`: the idle's pauldron onto a pose (see above).
- `skinmatch.py`, `matchto.py`, `regionmatch.py`, `recolor.py`: colour matches to the idle or to the same material.
- `extend.py`, `flatbg.py`, `keycut.py`: more canvas under clipped feet, a flat studio grey around the repaint, and
  a colour-key (or hand-traced, `POLY`) cut where both rembg models fail (a grey blade on the grey studio).
- `erase.py`: clears alpha in named boxes (a stray curl off a muzzle, a smear left of an elbow).
- `recoil.py`: Guard Scorpion's recoil as a tilt of its own pick, with the eye flare and lens flicker.
- `finish2.sh`: cut2 (or keycut), defloor, trim, derim, inkback, degreen, skinmatch, scale, the sidecar
  (`merge-steps.py`) and both checks on the final file (`../hifi/scripts/recheck.mjs`).
- `poses2.py`: the repair-round prompts (bands named by the shoulder their arm hangs from, a thin rim only,
  Barret's idle face, a taller canvas). Runners: `run-rep-*.sh`.

About 107 GPU jobs this round: 18 full renders or edits and about 89 local repaints (two seeds each). ComfyUI was
shared: a job was submitted only while fewer than 3 prompts were pending, ComfyUI was never restarted, and there were
no black frames. **Nothing was downloaded, and nothing was installed.**

## Method (the first round, unchanged)

- **Engine**: FLUX.2 Klein 9B in edit mode (`scripts/gen2.py`), the Film method from `../hifi/README.md`, with our
  own Film renders as ReferenceLatents. There is no retail image, no IP-Adapter and no trace. Every render is a base
  render at about 1536 px, then RealESRGAN x4 and a low-denoise re-render.
- **Cut-outs**: `scripts/cut2.mjs` (the per-pixel max of isnet-anime and isnet-general-use, non-background holes
  filled), then defringe and both checks.
- **One scale per subject (the idle's)**: stature for upright poses, `scripts/headfit.py` for crouches, lunges and
  swords overhead, and a same-scale lineup read by eye. The factors are in the tables and in each sidecar.
- **Guard Scorpion idle on the raised body**: `lowertail.py`, `tailgraft.py`, `patch.py` (see the first round's notes
  in git history of this file).

## Known limits (for the next step)

- **Spin scale**: the edit drew the body a little longer and the head a little smaller than the fist pump it came
  from (head-fit 1.087, stature about 0.95). It is placed at 1.0, so the head is about 8 % smaller and the body
  about 5 % taller than the idle's. The wind-up uses its head-fit, 1.11 (the first round used 1.06).
- **Wind-up**: his right wrist (the band) is hidden behind the left forearm, so no band shows; the forearm's
  shadow is still redder than the idle's skin shadow.
- **Aim**: the pose is still the first round's (the gun at chest height against the idle's waist height, a set jaw);
  new aim renders all broke identity. Code can add the difference in play (a raise tween, a sight glint).
- **Aim and fire boots**: the completed near boot's rolled trouser cuff is a little paler than the trousers.
- **Barret's face**: the aim and fire faces are now unscarred like the idle's; the squat, punch and hurt still
  have small cheek scars (the judge did not flag them). One face patch each would match them.
- **Barret's barrels**: the idle shows four; the repaired squat, punch and hurt show four in the 2 x 2 cluster from
  most angles (the punch's end view shows the cluster's rim). The aim and fire keep the first round's four.
- **Pauldron**: the grafted plate is the idle's own pixels, so it is the same shape and size everywhere; on the
  twisted follow-through and the raised wind-up it keeps the idle's angle.
- The sword spin, hit flash, knock-back and victory hold are motion for code (options B1 and D1). Music stays
  silent until Bailey hears the sketch.
