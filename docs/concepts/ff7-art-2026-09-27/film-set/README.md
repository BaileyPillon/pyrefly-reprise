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

## Look at these first (phone-readable, each under 1 MB)

| File | What |
|---|---|
| `01-frame-idle-1600.jpg`, `01-frame-idle-390.jpg` | The idle set on the Film reactor core, desk and phone (scene only, no HUD) |
| `02-frame-action-1600.jpg`, `02-frame-action-390.jpg` | The action moment: Cloud's strike, Barret firing, Guard Scorpion with the tail raised |
| `03-cloud.jpg` | Cloud's 8 picks, on one scale |
| `04-barret.jpg` | Barret's 6 picks, on one scale |
| `05-guard-scorpion.jpg` | Guard Scorpion's 3 picks, on one scale |
| `06-backdrop.jpg` | The backdrop pick, and the glyph-like mark painted out |
| `07-faults-fixed.jpg` | The judge's Film faults: the hi-fi pick against this set |
| `08`, `09`, `10-renders-*.jpg` | Every render of the round (full frames), with the picks framed |

The two frames were composed by the hi-fi round's own `../hifi/scripts/compose.py` (film grade), with
per-frame heights in `layout/` so each subject keeps one scale.

## Recommended file per pose

All paths are under `D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/`. Each cut-out has a
`.json` sidecar next to it with these fields:

- `subject`, `facing` (`right` for the party, `left` for Guard Scorpion) and `mirrored: false`.
- `baselineY` (the lowest opaque row: the feet, or the legs' contact line) and `anchorX` (the centre of
  the bottom 6 % of the figure).
- `scaleToIdle` and the size.
- The provenance (engine, seed, reference, prompt) and every post-process step.
- Both cut-out reports: the pipeline guard and the strict one-component check.

**Every pick passes both checks** (one component, no halo on dark), re-run on the final file.

### Cloud (facing screen-right)

| Pose | Recommended file | Scale to idle | Notes |
|---|---|---|---|
| Idle | `cloud/idle/cut-p4w.png` | 1 | The approved hi-fi Film pick (seed 730012). The metal cuff on the far wrist became the brown glove cuff. The back-edge rim is off |
| Attack: wind-up | `cloud/windup/cut-p6.png` | 1.06 | Sword raised back over the shoulder, both hands on the grip |
| Attack: strike | `cloud/strike/cut-p1w.png` | 1.02 | A lunge with the blade level to the right. The earlier pick `p2` drew three hands on the grip, so the pick moved to `p1`, where the second white band on the far wrist became the glove cuff (a long cuff) |
| Attack: follow-through | `cloud/follow/cut-p2.png` | 1 | The blade swung down past his right side |
| Victory: fist pump | `cloud/fistpump/cut-p2w.png` | 0.99 | The near (right) fist is raised. The far-wrist band was repaired |
| Victory: one-hand sword spin | `cloud/spin/cut-p3w.png` | 1.1 | The sword is held up in one hand, turning. A still image cannot show the spin itself, which is motion for code (a rotation tween) |
| Victory: sword onto his back | `cloud/back/cut-p2w.png` | 0.99 | The blade is laid back over the shoulder. The far-wrist band was repaired |
| Hurt flinch | `cloud/hurt/cut-p3w.png` | 0.99 | A grimace, arms pulled in. The far-wrist band was repaired |

### Barret (facing screen-right; gun-arm grafted on the near RIGHT arm, the left hand a hand)

| Pose | Recommended file | Scale to idle | Notes |
|---|---|---|---|
| Idle | `barret/idle/cut-p1.png` | 1 | Re-rendered from the hi-fi Film pick: three steel bands round the waist and no belt buckle. The pale back-edge rim was taken off (`derim.py` pale pass) |
| Attack: aim | `barret/aim/cut-p8.png` | 1 | This is the fire pick with the mouth closed, so aim and fire share one body |
| Attack: fire | `barret/fire/cut-p2.png` | 1 | The same stance, shouting. The muzzle flash is drawn by code |
| Victory: squat | `barret/squat/cut-p4.png` | 0.85 | Crouched and grinning |
| Victory: air punch | `barret/punch/cut-p6.png` | 0.99 | His normal (left) hand punches the air, and the gun-arm hangs at his near side |
| Hurt flinch | `barret/hurt/cut-p3.png` | 0.99 | Left hand to his chest, teeth set |

### Guard Scorpion (painted facing screen-LEFT, never flipped)

| Pose | Recommended file | Scale | Notes |
|---|---|---|---|
| Idle, tail lowered | `gs/idle/cut-tj.png` | 1 | **The tail-raised pick, pixel for pixel, with only the tail repainted**, so the game can swap idle and raised without the body changing. See the method below |
| Tail raised (laser lens) | `gs/raised/cut-p1s.png` | 1 | The same machine: red riveted shell with rust scuffs, six legs, twin rifles, sensor eye, back disc, segmented tail with a cyan emitter lens |
| Hit / recoil | `gs/recoil/cut-p1s.png` | 1 | A shell plate knocked up, legs braced. Its body fits the raised body at 1.01 (a similarity fit), so it is on the same scale |

### Backdrop

| Pick | Notes |
|---|---|
| `core/p1b.full.png` (2304 x 1296) | The hi-fi Film core (`../hifi/`, seed 733002). Two glyph-like marks were painted out: a small framed sign on the left wall (`core/p1.full.png`) and the mark on a pipe clamp at lower left (`p1b`, seed 770011). The rest was looked at in two half-frame crops, and no other marks were found |

## Written source of each victory pose

FF Wiki, "Final Fantasy VII victory poses" (text only, read 2026-09-27, as cited in
`../../ff7-options-2026-09-27/README.md`, the accepted D1 option):

- **Cloud** "pumps his fist twice, spins his sword in one hand, places it on his back". These map to
  `fistpump`, `spin` and `back`.
- **Barret** "squats, stands and punches the air with his normal hand, looping". These map to
  `squat` and `punch`, with the left hand, because the right arm is the gun.

The attack keys follow the accepted B1 blocking (`../../ff7-options-2026-09-27/sheet-5-B-attack-motion.jpg`),
turned to face right. Cloud has a wind-up, a strike and a follow-through. Barret has an aim and a fire.
Canon costume points come from `research/ff7-battle-staging.md` (FF Wiki "Barret Wallace": "a
mechanical gun grafted in place of his right arm") and the hi-fi round's prompts. Guard Scorpion
follows `research/ff7-guard-scorpion.md`: the Raise Tail and Drop Tail forms, so the set has an idle
with the tail down and a pose with the tail up.

## The Film faults, fixed

The judge found four faults in the Film picks. Here is what was done about each (`07-faults-fixed.jpg`).

1. **The green/cyan rim on the BACK edge of Cloud and Barret.** `scripts/derim.py` works on every
   party pick. On edges that face screen-left, it replaces the rim hue with the colour further inside,
   darkened to a shadowed edge. There are three passes:
   - the green rim;
   - a new teal pass: green and blue both well above red;
   - a new pale pass for Barret (`PALE=1`), because his rim is a pale grey-green that the hue test missed.

   A rim on the edges facing the core (screen-right) is kept, since that one is lit correctly. Every
   pose prompt also asks for no rim on the left edges.
2. **Cloud's far-wrist metal cuff** (canon: only the white SOLDIER band, on his RIGHT wrist). The idle
   and five poses got a local repair (`scripts/patch.py`): the far-wrist cuff or second band became
   the brown glove cuff. The white band stays on the near wrist.
3. **Barret's belt buckle** (canon: metal bands round the waist). His idle was re-rendered with three
   steel bands and no buckle. The squat, punch and hurt were drawn from that idle. The fire was drawn
   from the hi-fi pick with the same bands in its prompt, and the aim is an edit of the fire. All six
   show the bands and no buckle.
4. **Guard Scorpion's floor-shadow patch.** `scripts/cut2.py` has three new options:
   - `FLOORBAND`: clears the flat dark floor band below its top edge, and its anti-aliased threads;
   - `SHADEBOX`: clears the studio grey inside boxes;
   - `CLEARBOX`: clears one stray edge line on the recoil pose.

   The values are in each sidecar's `cutParams`. The party's soft contact shadow round the boots is
   taken off by `scripts/defloor.py`. It clears only grey that can be reached from outside without
   crossing an ink line, so the dark soles and the steel blade stay. The game draws its own contact
   shadow.

## Method

- **Engine**: FLUX.2 Klein 9B in edit mode (`scripts/gen2.py`), the Film method from `../hifi/README.md`.
  The references are our own Film renders as ReferenceLatents: the Film idle picks, then our own pose
  picks. There is no retail image, no IP-Adapter and no trace. The prompts are written from canon text
  (`scripts/poses.py`). Every render is a base render at about 1536 px, then the same detail pass as
  the hi-fi round: RealESRGAN x4, then a low-denoise re-render.
- **Pilot 2, LOOK, keep the best.** Every pose had two pilots, and each render was read as an image.
  Where both pilots failed a canon point, more tries or a local repair followed. Examples: two swords
  in the spin, a hand-held gun in the aim, a band on both wrists, a floating lens. The runners are
  `scripts/run-*.sh`, and the prompt changes are recorded in `scripts/_edit_poses*.py`. **91 renders
  in all** (Cloud 41, Barret 28, Guard Scorpion 20, core 2). Every one is on sheets 08 to 10.
- **Guard Scorpion idle on the raised body.** A full-frame "lower the tail" edit repainted the body as
  well; in `idle/p3`, `p3t`, `q781001` and `q781011` the body is cleaner, loses its rust, or the tail
  stays up. So the idle is built on the raised pick itself:
  1. `scripts/lowertail.py` edits a crop around the tail, and Klein draws a low tail.
  2. `scripts/tailgraft.py` grafts only that new tail onto the raised pick. It uses a similarity fit
     on the shared rear hip and leg, clears the old raised tail to the source's own studio grey, and
     re-bases the lens glow on it.
  3. `scripts/patch.py` repaints the tail root (seed 782011), so the tail passes cleanly behind the
     rear hub.
- **Cut-outs**: `scripts/finish.sh` runs `scripts/cut2.mjs`. That is the round 2 `final-cut.mjs` with
  the cut from `cut2.py`: the per-pixel max of isnet-anime and isnet-general-use, with non-background
  holes filled, so grey steel on the grey studio stays whole. It is followed by defringe and both
  checks. `scripts/refinish.sh` re-finishes a pick from its checked raw cut-out: `defloor.py`, then
  `derim.py`, then `scale.py`, then `../hifi/scripts/recheck.mjs`, which runs both checks again on
  the final file.
- **One scale per subject (the idle's).** Poses were resampled to their idle's scale, using three
  checks:
  - stature (hair top to baseline) for upright poses;
  - `scripts/headfit.py`, a registration of the head onto the idle's head, for a crouch, a lunge or a
    sword overhead;
  - a same-scale lineup read by eye (boots and head).

  The factors are in the tables above and in each sidecar (`scaleToIdle`). Stature and head size
  disagree by up to about 5 % on the crouched poses, so treat those factors as within about 5 %.
- **GPU**: ComfyUI was shared. A job was submitted only while fewer than 3 prompts were pending
  (`gen2.py`), with one runner at a time behind a lock file. ComfyUI was never restarted, and there
  were no black frames. **Nothing was downloaded, and nothing was installed.**

## Known limits (for the next step)

- Barret's gatling shows four barrels in the idle, aim and fire, and six or seven in the squat, punch
  and hurt. A code-drawn muzzle flash covers the fire frame. An idle-matched repaint of the barrel
  cluster is possible if Bailey wants them identical.
- Cloud's pauldron has a small spike in the idle and hurt poses (inherited from the approved hi-fi pick).
- The strike's repaired far-wrist cuff is a longer leather cuff than on the other poses.
- The sword spin is one still. The spin itself is motion for code (a rotation tween), as are the hit
  flash, the knock-back and the victory hold (options B1 and D1).
- Music stays silent, as Bailey decided, until Bailey hears the sketch.
