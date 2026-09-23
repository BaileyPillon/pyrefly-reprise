# Leblanc LoRA round 2: independent judge (2026-09-23)

FFX-2 only (Chapter 6 boss art; no game file, no shared tool; AGENTS.md hard
rule 14). This is an **independent** pass on the producing pass's report
`round2.md`. Nothing was rendered, re-rolled, installed or moved in `public/art/`.
The producer self-judged the picks 7, 6, 7, 6.

**Verdict: FAIL against a bar of 7.** Attack 6, cast 6, hurt 6, ko 5. **Scale
passes:** in the running battle the head reads as one size in all five states.
Every round-1 defect a judge named is fixed: the boots are open-toe in every
state, the open fan is red and silver, both hurt legs are there, and the fan no
longer comes back to the mouth. Two new defects come with this round. The
**obi** has drifted in all four states: it is a navy or near-black band on
attack and ko, a narrow pink band with extra tassels on cast, and it has no
knot or tassel on hurt. A **white strand now crosses the attack eye**. Two
defects were named before and are still open: the ko head lies pillowed on the
hand, which reads as sleep, and the ko boots are indigo. Keep all four installed
as CANDIDATES. None is approved.

## How it was judged

- Anchor: the installed `public/art/characters/leblanc/idle.png` (591x1118,
  seed 609757527, sha256 `4fea45f9...094b`), not scored.
- Scored (sha256 of the installed PNG):
  `attack.png` = `attack.r2.3`, seed 61603 (`2a6514e2...afab`);
  `cast.png` = `cast.r2.2`, 61702 (`49d3c55f...0d66`);
  `hurt.png` = `hurt.r2.2`, 61802 (`8cb428c7...9861`);
  `ko.png` = `ko.r2.1`, 61901 (`0c938e2d...77a3`). All four sidecars say
  `status: CANDIDATE`, `method: lora-r2+openpose`, `step: 1000`.
- Each state was flattened on grey and viewed whole, at native 1:1 (head,
  choker and heart, obi/knot/tassel, fan, legs, boots) and at 2x to 3x where a
  mark was small, side by side with the same regions of idle. The round-1 picks
  this round replaced (`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-lora-r2/leblanc/replaced/`)
  were viewed the same way for the comparison.
- The criteria are the round-3 list (hair, face and eyes, skin, robe/obi/dress
  with the choker, heart, fan, boots, style) plus anatomy and "pose reads as its
  state". Each is scored 0 to 10 against idle. **A state's score is its lowest
  criterion.** The bar is 7.
- **In battle:** I looked at `ingame-after-{idle,attack,cast,hurt,ko-clear}.png`
  and `ingame-after-heads.jpg`, and checked `heads.json` against the PNGs. The
  bob widths I read (idle about 190 px, hurt about 210 px) agree with its
  189 and 207.
- Approved art: `docs/target/approved-hashes.json` has sha256 `3c5af02f...c15c`
  and no Leblanc entry. `D:/Tools/pyrefly-lora/tools/verify-approved.mjs` gave
  ok 115, mismatched 0, missing 0 before and after this pass.

## Scores

| State | Hair | Face/eyes | Skin | Robe/obi/dress/choker | Heart | Fan | Boots | Style | Anatomy | Pose reads as state | **Score** | Round 1 (judge / redo self) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| attack (`r2.3`) | **6** | **6** | 8 | **6** | 8 | 7 | 8 | 7 | 7 | 8 | **6** | 6 / 7 |
| cast (`r2.2`) | 7 | 8 | 8 | **6** | 8 | 8 | 8 | 7 | 8 | 8 | **6** | 6 / 7 |
| hurt (`r2.2`) | 8 | 8 | 8 | **6** | 8 | 7 | 8 | 7 | 7 | **6** | **6** | 5 / 7 |
| ko (`r2.1`) | 8 | 7 | 8 | **6** | 8 | 7 | **5** | 7 | 7 | **6** | **5** | 6 / 7 |

The round-1 column gives the independent judge's score for the v3 picks, then
the painter's own score for the redo picks (`../poses/redo.md`) that this round
replaced. The redo scores were never checked independently.

### attack: 6

- **Hair and face (6).** A white highlight strand runs across the near eye
  like a bandage, and a black lock sits over the eye socket beneath it. At 1:1
  and at 3x only a sliver of the iris shows, and it reads as grey rather than
  idle's purple. The dark cheek and jaw patch was repainted as a thin shade,
  so round 1's hair patch is fixed, but this strand replaces it.
- **Obi and choker (6).** The obi is a dark navy band with one thin crimson
  stripe. Idle's obi is a wide crimson sash with gold edges. The knot and the
  purple tassel are right. The choker is lavender with white scribbles, not
  idle's row of studs. The robe lining is a saturated blue. Idle's is lavender,
  with blue only in the dress's back panel.
- **What works.** A wide planted lunge on both feet. The closed black fan leads
  at arm's length toward the party, and the far hand rests on the hip (pose 8).
  The boots are open-toe lavender lace-ups (8). The heart is right. The fan's
  edge highlights are blue and gold, where idle's ribs are pale grey (7). The
  feet turn out to both sides, so this is a straddle more than a lunge, but it
  is anatomically possible (7).

### cast: 6

- **Obi (6).** A narrow pink and red band with a purple stripe replaces idle's
  wide crimson obi. The knot has **two** tassels, and a third pink cord with a
  bead hangs from the robe at her side. Idle has one tassel with a round
  medallion.
- **Choker (inside the 6).** A plain lavender band with one stud and a black
  strap running off to the right. Idle's choker has a row of studs.
- **What works.** The fan is open overhead with a red leaf, black guards and
  pale silver-white ribs, which is research §10.1's red and silver, as the brief
  asks (hard rule 6, 8). The face is clean, with purple eyes looking up at the
  fan (8). The nape shade is heavier than idle's but no longer reads as a hole
  (hair 7). The boots are open-toe (8), and the pose reads as a spell being
  raised (8). Round 1's lavender leaf and jaw mass are fixed.

### hurt: 6

- **Obi (6).** Crimson and wide, as in idle, but the knot and the purple tassel
  are gone. In their place is a small metal clip. The hand is left of the obi,
  so it does not hide the knot as `round2.md` says: the knot is not painted.
  Round 1's `hurt.v4.5` had both.
- **Pose (6).** One eye shut, knitted brows and a pout: at 1:1 it is a good
  wince. But the body barely leans, and she stands on two planted boots with a
  hand at the hip. In battle (`ingame-after-hurt.png`) the face blooms out and
  the silhouette reads as a sassy stance or a wink. From Leblanc, a wink reads
  as flirting, not as being hit. Round 1's `hurt.v4.5` leaned back clearly off
  balance.
- **What works.** Both legs and two open-toe boots, so round 1's missing leg is
  fixed (anatomy 7; the far leg is very long from the low camera). The choker
  has studs, and the heart and face match idle (8). The fan tassel is gone, but
  a small black cord hangs below the grip (fan 7).

### ko: 5

- **Boots (5).** Deep indigo where idle's boots are lavender, and the toes are
  soft smears at 2x. **The cut-out touches the canvas's right edge.** The sidecar
  width is 1197 and there is no 16 px margin. On the last column, rows 283 to
  314 are opaque: the outline of the lower boot's toe and a purple streak are
  cut flat.
- **Pose (6).** The cheek lies on the hand that holds the fan, and the face is
  calm. It reads as asleep, not knocked out. Round 1's judge named "a little like
  sleep", and the brief's negatives named "head on arm, sleeping". That makes
  this the second review to leave it open.
- **Obi (6).** Near-black with a thin red stripe. Idle's obi is crimson. The
  tassel's medallion is painted as a pale bead with a face, which reads as a
  skull, and blue geometric marks sit on the white dress.
- **What works.** Flat on her side, eyes closed, a studded choker (studs as
  white dots), the heart, the blonde bob and the black fan (7 to 8). There is no
  painted ground shadow.

## Scale in the running battle: PASS

The sidecar `scale` values are attack 0.90, cast 1.16, hurt 0.92 and ko 0.95. In
the engine the head measures between 100.1 and 100.5 percent of idle's. On
screen it measures between 99.8 and 102.9 percent, every state within 5 percent
(`ingame-after.json`). I looked at the in-battle crops: the heads read as one
size across the five states, the attack lunge is shorter but not smaller in the
face, and cast's raised arm does not shrink her. Round 1 (`ingame-r1-*.png`)
had no sidecar scales. Three things seen in battle are staging or lighting
issues, not art, and belong to their owners:

1. In attack, cast, hurt and ko the presenter's state lighting blooms her hair,
   face and dress to near white. The face cannot be read at game size in any
   action state (`ingame-after-heads.jpg`). This hides every face score above,
   so it matters more than any paint defect here.
2. The ko head reaches into Logos's slot and sits behind him. Round 1 did the
   same.
3. The ko toe clip (above) is 16 px of canvas. At game size it is under
   3 screen pixels, but it is an art defect and should be fixed in the cut-out.

## Compared with round 1

- **Fixed:** open-toe boots in all four states (round 1: two of four closed).
  Cast's open fan is red and silver (round 1: an unsourced lavender, then a red
  and white candidate that waited on Bailey). Hurt has both legs (round 1: one).
  The fan no longer comes back at the mouth in unseen poses. The step test shows
  this, and no pick has it. The attack strike leads with the fan on planted
  feet. There are no painted ground shadows. The attack hair and jaw patch
  became a thin shade.
- **New in round 2:** the obi drifts in every state. Round 1's picks all had
  idle's wide crimson obi, with knot and tassel on attack, cast and hurt.
  Adding the round-1 poses to the dataset did not hold the obi. The masked
  repaints never touched it, so it comes from the renders. Attack also gained
  the white strand over the eye.
- **Unchanged:** the ko head on the hand (sleep) and the ko boots' deep colour.
  Round 1's redo note had the same colour on attack.
- **Net:** the scores match round 1 (6, 6, 6, 5 against 6, 6, 5, 6). The round-1
  defects are fixed, but the obi problem is new. Against the painter's redo
  scores of 7, this round is not an improvement on any state.

## Redo (options for Bailey; each is a local repair, not a re-roll)

Hard rule 15: on ko, this is the second review to leave the "sleep" read open.
A written method check comes before a third try there. The obi and the attack
eye strand are first findings.

- **All four, obi:** a masked repaint of the obi band on LoRA r2 with
  `wide crimson obi, gold trim` and `navy, black, pink` in the negative. On
  hurt, add the knot and tassel. On cast, remove the second tassel and the side
  cord. Low denoise, the same seed family.
- **attack:** a masked repaint of the near eye (remove the white strand, give
  the iris its purple) and of the choker (a row of studs).
- **cast:** the choker only, after the obi. The pose and fan stay.
- **hurt:** either skip the obi repair and switch back to round 1's `hurt.v4.5`,
  erasing its fan tassel (it has the lean, the knot and both legs), or
  re-render the v4 skeleton with a stronger backward lean. The r2.2 frame's
  pose will not read as hurt at game size.
- **ko:** method check first. The skeleton still puts the head at the hand, so
  move the fan hand's wrist away from the head in `lying_r2`, or pick a frame
  with the arm flung out. Then give the cut-out its margin back (re-cut from
  the raw frame with padding) and do a masked recolour of the boots toward
  idle's lavender.

## Files

- `judge-sheet.jpg` (built by `judge-sheet.py`, 3421x2150, about 0.8 MB). The
  top row is idle whole plus 1:1 head, obi, boot, fan and in battle. Then one
  row per state: the round-1 pick it replaced, the round-2 pick whole, 1:1 crops
  of the regions scored below 7 (and one that passed), and the in-battle crop.
- Producer's pass: `round2.md`, `sheet.jpg`, `picks.json`, `ingame-after-*.png`,
  `heads.json`.
