# Logos LoRA + OpenPose poses: independent judge pass (2026-09-23)

FFX-2 only (Chapter 6, Chateau Leblanc art; Logos exists only in FFX-2; no shared tool,
game file or FFX chapter changed, AGENTS.md hard rule 14). This pass was run by a
different agent from the one that painted and installed the poses (`poses/judge.md`,
commit `d455885`). **I made no new renders, and nothing was installed, edited or
approved.** `docs/target/approved-hashes.json` (sha256 `3c5af02f...c15c`, no Logos entry)
lists 115 files. `D:/Tools/pyrefly-lora/tools/verify-approved.mjs` reported 115 ok and
0 mismatched when this pass ran.

I judged the installed files: `public/art/characters/logos/{attack,cast,hurt,ko}.png`
(sha256 `e02bfd94...`, `62500a56...`, `a416bc08...`, `7a588c8b...`) against the anchor
`idle.png` (`64a43dc9...`). I read each whole at native size on flat grey, plus 2x
nearest-neighbour crops of the helmet, face, emblem and hands. **Sheet:**
`judge-sheet.jpg` (`python judge-sheet.py`). The top row is the idle. Below it there is
one row per state: the whole cutout, scaled, then **native 1:1 crops (no resampling)**
of every region scored below 7. No score comes from a thumbnail or from the painter's
sheets.

## Criteria

These are the round-3 judge's criteria (`../../sets/logos/round3/judge.md`), each scored
0 to 10 against the idle at 1:1: hair, face, skin, **helmet** (one design in every
state), outfit, marks (emblem, strap, accessories), weapon (two single-barrel revolvers,
held), style and framing, and whether the pose reads as its state. **The score is the
worst criterion. Pass is 7.** The pose readings come from research
`ffx2-leblanc-syndicate.md` 10.1: Double Shot is two aimed shots, and Russian Roulette
is one deliberate shot.

## Scores

| State | Pick | Hair | Face | Skin | Helmet | Outfit | Marks | Weapon | Style / framing | Pose as state | **Score** | Painter | Round 3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| attack | `96101` | 8 | 8 | 8 | 8 | 7 | **6** | 7 | 8 | 8 | **6** | 7 | 4 |
| cast | `96201` | 8 | 8 | 7 | 8 | 7 | 7 | **6** | 8 | 8 | **6** | 6 | 4 |
| hurt | `96303.r2` | 8 | **5** | 7 | 6 | 6 | 7 | 6 | 7 | 6 | **5** | 6 | 4 |
| ko | `96402.r2` | 8 | 6 | 7 | **5** | 7 | 6 | 7 | 7 | 9 | **5** | 6 | 3 |

**No state reaches 7, so the set fails on all 4 states.** I score attack, hurt and ko
one point below the painter and cast the same, which is the same direction as the
earlier independent passes.

## What the LoRA changed (compared with round 3)

- **Worst scores rose from 4 / 4 / 4 / 3 to 6 / 6 / 5 / 5.** Across the four states,
  26 of 36 criteria now score 7 or more; in round 3, 19 did. The lowest single score is
  now 5; in round 3 it was 3.
- **The headgear no longer changes between states.** That was the named failure of
  three passes, and it is fixed. Attack and cast wear the idle's dome: ribbed sides, the
  side plate with its slots, and a short visor (helmet 8). Hurt wears the same dome, but
  the front carries an invented wing-shaped engraving (6). Ko's dome is the idle's shape
  seen from above, but a band of glyph-like engraving runs across it and reads as
  lettering at 1:1 (5). No state has a slotted visor, cage, grille, brim or crest; round
  3's cast (slotted visor) and ko (cage and grille) did.
- **The emblem is where it belongs.** Every state puts a white disc on the shoulder that
  faces the viewer, with the idle's black strap and a ring. Round 3 had a claw guard, a
  gold chest badge, a grey spiral and a grey wheel. The disc's pattern and the ring
  still drift (details below).
- **The costume holds.** The robe fades to violet, the sash is purple, the hakama is
  slate or navy (round 3's was light grey in every state), the wraps are white and the
  sandals are black slides. Skin is one pale tone throughout, and no hand is tan.
- **The weapons are right.** Every state has exactly two single-barrel revolvers. Round
  3's ko had a double-barrelled gun with a hooked grip; that is gone.
- **Framing is fixed.** No cutout touches its edge: 0 opaque pixels on all four borders
  of every file. Round 3's attack coat tail was cut off along 376 rows.
- **What did not change is the reason the set still fails.** The LoRA fixed drift
  across the whole figure. What remains is small and local, and two of the defects come
  from the one idle painting the LoRA was trained on (next section).

## Per-state findings (1:1)

**attack 96101 (6; marks).** Both revolvers point straight at the party at two heights.
The torso leans forward, the face is serious and the robe swings back: it reads as
Double Shot at a glance (pose 8). The helmet is the idle's (8), and the skin is
consistent.

- **Marks 6.** The shoulder disc is a fine **crosshatched mesh**, like a microphone
  grille, inside a grey rim. The idle's disc is a **radial** sunburst. The strap is black
  and the ring has a brass edge, both right.
- The painter wrote "white radial disc" for this file; at 1:1 it is not radial.
- Weapon 7: the upper revolver is held properly in a black grip. The lower hand wraps
  its fingers over the frame with a brown grip showing below the fist. It reads as held,
  but loosely.
- Outfit 7: the stance is a stride rather than a deep lunge (this is a pose note). A
  lilac sash tail with a small gold tip hangs at the front; the idle's hangs at the back.
- Head about 147 px, against the idle's 145, so scale 1.0 is right.

**cast 96201 (6; weapon).** A revolver is raised barrel-up beside the helmet, there is
a faint smirk, and the other revolver is held low: it reads as the deliberate
Russian Roulette moment (pose 8). This is the closest helmet to the idle in the set
(8). The disc is radial, the strap black, and there is a ring (marks 7). The ring is a
grey lens, not the idle's brass-rimmed ring.

- **Weapon 6.** The low revolver hangs from one finger through the trigger guard, while
  the fist closes on a grey stub. This is **the idle's own defect**, copied from the
  single training painting (the round-3 judge scored the idle's weapon 5 for it).
- The raised revolver's cylinder is a little mushy at 1:1, but it reads.
- Outfit 7: there are two lilac ribbons, one on each side; the idle has one, at the
  back.
- The scale override of 0.9 matches the head measurement (about 160 px against 145).

**hurt 96303.r2 (5; face).** The torso and head are thrown back and the arms flung
apart, with a revolver in each hand. The far hand wears the idle's black fingerless
glove, a good detail.

- **Face 5.** The head is tipped back so far that the hair and the visor hide the face.
  What shows at 1:1 is a blank white profile: no eye, and a small dark smudge at the
  chin where the mouth should be. There is no wince or clenched teeth, and nothing on
  the face says "hit". Round 3's hurt showed clenched teeth.
- Pose 6: the legs are in an even walking stride with both feet flat on the floor. At
  battle size it reads as a dramatic stagger or a spin more than a hard hit.
- Helmet 6: it is the same dome, with a pointed visor and the invented wing engraving on
  the front.
- Outfit 6: the robe covers the hakama almost to the ankle and darkens to navy at the
  hem, with no violet fade (the violet is only on the two ribbons).
- Weapon 6: the near hand lays its fingers over the frame instead of around the grip.
- Marks 7: radial disc, black strap; the ring is black with no brass edge.

**ko 96402.r2 (5; helmet).** He lies on his back with his head toward the party, eyes
shut and the helmet on. Two single-barrel revolvers lie on the floor, one by the head
and one by the hand. It reads as KO (pose 9), and the weapons are correct (7; the grips
are brown wood where the idle's are dark).

- **Helmet 5.** The dome is the idle's shape seen from above, with a thick rim and a
  band of engraving whose marks look like letters. In round 3 the same judge scored
  attack helmet 5 for "same family, different surface", and this is that case. At 1:1
  there is also a dark grey oval on the cheek below the eye: the jaw strap drawn as a
  lens (face 6).
- Marks 6: the radial disc is on the near shoulder and correct. But a brass ring sits on
  top of the sash, where the idle has none (the idle's ring belongs on the strap), and a
  grey roundel with an orange flame pendant sits on the chest. That roundel is close to
  the idle's front clasp and does not count against the score by itself.
- Style 7: the cutout keeps a hard black floor shadow along the robe and under the feet.
  Round 3's ko had a softer baked shadow too, so this is not new, but the harder edge
  may double up with the stage's own shadow.
- The helmet spans about 205 px along the body, close to the idle's 185 px front to
  back, so scale 1.0 is plausible. Neither this nor any other state has been seen in a
  running battle.

## Redo (local fixes, not re-rolls)

These were the fourth pass on Logos and the first with a LoRA. The defects left are
local, so **another full-figure batch is the wrong tool**: a fresh whole-body render
re-rolls every region that already passes.

1. **attack: the emblem.** Replace the mesh disc with the idle's radial disc. Either
   paste the idle's own disc, warped to fit, or do a masked repaint of that box only,
   using the idle's emblem crop as the reference. With that fixed, every attack
   criterion would score 7 or more.
2. **cast: the low hand.** Masked repaint of the fist and the gun so the hand grips the
   revolver. The better fix is at the source: repair the same defect in the idle first
   (the idle is still a round-3 CANDIDATE), then retrain, so the LoRA stops learning it.
3. **hurt: the face.** Masked repaint of the face at higher denoise, with the head a
   little less far back so the profile shows, and a pained expression with clenched
   teeth. Optionally, a near-hand grip fix.
4. **ko: the helmet surface.** Masked repaint of the engraved band so it matches the
   idle's ribbed dome, using the idle's head crop as the reference. Remove the ring on
   the sash, and recolour the cheek oval to the thin grey jaw strap.
5. **A second LoRA round:** add the passing frames (attack after fix 1, and ko) to the
   dataset so the LoRA has seen more than one pose. Only if Bailey approves any of them
   as training data.

Ormi and Leblanc were not judged in this pass.

## Hard rule 6, still open

The shape of the Syndicate logo is unsourced; research 10.1 says only "the Syndicate
logo on both shoulders". The radial disc is the idle's invention, and the drift between
radial and mesh shows the model has no fixed design to hold. The chin protector and the
purple helmet tie strip that research names are not in the idle, and no pick shows
them.
