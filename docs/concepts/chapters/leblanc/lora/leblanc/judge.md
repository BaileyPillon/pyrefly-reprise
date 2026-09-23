# Leblanc LoRA + OpenPose poses: independent judge (2026-09-23)

FFX-2 only (Chapter 6 boss art; no game file, no shared tool; AGENTS.md hard
rule 14). This is an **independent** pass. Nothing was rendered, re-rolled,
installed or moved in `public/art/`. The producing pass's report is
`poses/poses.md`; it self-judged every pick at 6.

**Verdict: FAIL against a bar of 7.** Attack 6, cast 6, ko 6, hurt 5. That
is still a step change: round 3 (`../../sets/leblanc/round3/judge.md`) scored
every state 4. The costume problem that five prompt-only methods never fixed
is solved by the LoRA. What is left are local defects: one missing leg, one
folded leg, boot toes, one invented fan leaf and small paint marks. None of
them is an identity failure. Keep all four installed as CANDIDATES. None is
approved.

## How it was judged

- Anchor: the installed `public/art/characters/leblanc/idle.png` (591x1118,
  seed 609757527), not scored.
- Scored: the four installed states `attack.png` (v3.3, seed 61103),
  `cast.png` (v3.6, 61206), `hurt.png` (v3.1, 61301) and `ko.png` (v3.2,
  61402).
- Each state was flattened on grey and viewed whole and at native 1:1 (head,
  choker and heart, fan, obi, robe, legs, boots), side by side with the same
  regions of idle. I also looked at the other v3 frames for hurt
  (`D:/Tools/pyrefly-lora/leblanc/poses/_look-hurt.v3.jpg`) to see whether
  the defect comes from the pick or from the method.
- Criteria: the round-3 list (hair, face and eyes, skin, robe and obi and
  dress, heart, fan, boots, style) plus "pose reads as its state". I split
  out anatomy where a limb is wrong. Each criterion is scored 0 to 10
  against idle, and **a state's score is its lowest criterion**. The bar
  is 7.
- Approved art: `docs/target/approved-hashes.json` has no Leblanc entry.
  `D:/Tools/pyrefly-lora/tools/verify-approved.mjs` gave ok 115, mismatched 0,
  missing 0 both before and after this pass.

## Scores

| State | Hair | Face/eyes | Skin | Robe/obi/dress | Heart | Fan | Boots | Style | Anatomy | Pose reads as state | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| attack (`attack.v3.3`) | 8 | 8 | 8 | **6** | 8 | 8 | **6** | 7 | **6** | 7 | **6** |
| cast (`cast.v3.6`) | **6** | **6** | 8 | 8 | **6** | **6** | 9 | 7 | 8 | 7 | **6** |
| hurt (`hurt.v3.1`) | 8 | 8 | 8 | 8 | 7 | 8 | 7 | 7 | **5** | 8 | **5** |
| ko (`ko.v3.2`) | 8 | **6** | 8 | 8 | 8 | **6** | **6** | **6** | 8 | 7 | **6** |

### attack: 6 (round 3: 4)

- **Costume (6).** This is idle's costume: the white halter dress, the
  crimson obi with its knot and purple tassel, the purple robe off both
  shoulders with its diamond pattern, the studded purple choker and a flat
  red heart. But behind her the robe flares into four stiff petal-shaped
  lobes. At game size they read as wings or a cape, not the heavy drape
  idle has.
- **Anatomy (6).** The near leg is folded: a thigh runs forward to the knee,
  but no shin shows, and the boot sits against the underside of the thigh
  with its heel spike pointing up and back. Neither foot touches the ground,
  so this is a mid-air leap, not the planted lunge that `poses.md`
  describes.
- **Boots (6).** Closed-toe lace-up heels. Idle's boots are open-toe.
- **Pose (7).** The closed black fan leads, the arm is extended toward
  screen-left and the brows are drawn in. It reads as a fan strike, which
  fixes round 3's worst problem on this state (the fan trailed behind).
- Hair is idle's warm blonde, the eyes are purple and the heart and fan
  match (8). There is a small stroke on the near cheek at 1:1.

### cast: 6 (round 3: 4)

- **Fan (6).** The fan is open for the first time. Its guards and ribs are
  black, but the leaf is **lavender**, and that colour has no source. Idle
  only ever shows the fan closed, and research §10.1 says the fan is red and
  silver. This is a hard rule 6 question for Bailey, not something to fix by
  guessing.
- **Face and hair (6).** A black mass sits under the jaw: the dark underside
  of the far hair, painted as a solid patch. At 1:1 it reads as a hole or a
  beard, and a black lock also crosses the near eye. Idle's hair has only a
  thin dark shade at the nape.
- **Heart (6).** The heart is notched by a white nick and sits a little
  crooked. **Choker:** a plain lavender band with no studs.
- **Pose (7).** The fan arm is raised, the fan is open overhead and she
  looks up. This fixes round 3's backbend, which read as being blown
  backwards. It reads as a flourish or signal before a spell rather than a
  spell being released, but it is clearly not a hurt frame.
- The boots are the best of any state: open-toe lavender lace-ups that match
  idle (9). The robe, obi, tassel and dress match idle (8).

### hurt: 5 (round 3: 4)

- **Anatomy (5).** Only one leg exists. The robe hem ends about 120 px above
  the ground line and the space below it is empty, so the far leg ends in
  the air. The producer noted it as "hidden behind the robe (6)", but at 1:1
  there is no room for it to be hidden. At game size she stands on one
  open-toe boot.
- **Pose (8).** Head thrown back, clenched teeth, the near eye shut and the
  far eye rolled up, a hand on the stomach. It reads as being hit, the
  clearest Leblanc hurt so far.
- The costume is idle's, with the white dress and its long back panel (8).
  The fan is black and closed and matches idle (8). The choker is studded.
  The heart shows but is cut by the collar edge (7).
- **This is a pick problem, not a method problem.** `hurt.v3.5` has the same
  lean back and hand on the stomach, and both legs and both boots are there.

### ko: 6 (round 3: 4)

- **Face (6).** Both eyes are closed and there is no wink or smirk, which
  fixes round 3's worst defect. At 1:1 there is a white smear on the cheek
  and a small orange nick at the corner of the mouth.
- **Fan (6).** Black ribs, but the guard is pale tan wood. Idle's fan is
  black.
- **Boots (6).** Closed-toe lace-ups.
- **Style (6).** A hard black ground shadow is painted under the body and
  boots, and the cutout kept it. The engine draws its own shadow, so the
  two will double up.
- **Pose (7).** On her side with the head to screen-left and the head
  resting on the arm. It reads as down, though a little like sleep.
- The costume, heart, choker and warm blonde hair match idle (8).

## What the LoRA changed (against round 3)

1. **Garments: fixed in all four states.** Round 3's common failure was a
   different costume (a closed kimono, red or pink lining, checkerboard
   panels) that no prompt or IP-Adapter weight could move. With the LoRA,
   every state wears idle's open robe off the shoulders over the white high
   cut halter, the crimson obi with its knot and purple tassel, the diamond
   pattern and the studded choker. Robe and obi went from 4 to 8 in cast,
   hurt and ko, and to 6 in attack only because of the flaring lobes.
2. **Hair: fixed.** Idle's warm blonde in all four states (round 3 drew ash
   in three). The producer's word fix (`blonde hair`, not
   `platinum blonde hair`) was needed as well as the LoRA.
3. **Heart: fixed.** A flat red heart in all four (round 3 had a tattoo
   outline, a missing heart and one placed too high).
4. **Fan: black in 3 of 4** (round 3: 1 of 4). Ko's guard is tan, and
   cast's open leaf is an unsourced lavender.
5. **Pose: fixed by the skeleton.** Attack leads with the fan, cast raises
   its arm with no backbend, and ko has closed eyes with no wink. OpenPose
   put the limbs where the words never could.
6. **Still left:** limb defects that come with ControlNet (a missing leg, a
   folded leg with no shin), boot toes on 2 of 4 states, and small paint
   marks. These are local problems, not identity ones.

## Redo (per state; options for Bailey, not work to start)

This is the first LoRA pass, so the hard-rule-15 stagnation count restarts
with this method. A redo is a pick-and-repair round, not a new method:

- **hurt:** switch the pick to `hurt.v3.5` (both legs, the same wince and
  hand on the stomach) after a 1:1 check of its face and fan. Otherwise
  re-render the hurt skeleton with the far foot placed visibly in front of
  the robe hem.
- **attack:** keep the strike. Re-render with a skeleton that plants the
  rear foot on the ground and shows the front shin, so there is no folded
  leg, and add `wings, cape` to the negative to stop the robe lobes. The
  open-toe boots could also be fixed with a feet-only masked repaint (the
  same LoRA and words, low denoise).
- **cast:** Bailey should pick the open-fan leaf colour: black like idle's
  ribs, or the research's red and silver (hard rule 6). Then do a masked
  repaint of the leaf, the dark patch under the jaw and the heart. The pose
  stays.
- **ko:** a masked repaint of the fan guard to black and of the boots to
  open-toe, a clean-up of the cheek smear and mouth nick, and removal of
  the painted ground shadow from the cutout (an alpha clean-up, no
  re-render).

With those fixes each state is plausibly at 7 or above. The deciding
criteria are anatomy (hurt, attack) and one sourcing question (the cast fan).

## Files

- `judge-sheet.jpg`: this pass's sheet (built by `judge-sheet.py`). The top
  row is idle whole plus 1:1 head, fan and boot. Then one row per state: the
  whole figure scaled, and 1:1 crops of every region scored below 7.
- `poses/poses.md`, `poses/sheet.jpg` and `poses/candidates.jpg`: the
  producing pass.
