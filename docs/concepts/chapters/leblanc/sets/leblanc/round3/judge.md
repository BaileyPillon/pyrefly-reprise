# Leblanc round 3: independent set judge (2026-09-22)

FFX-2 only (Chapter 6 boss art; no game file, no shared tool; AGENTS.md hard
rule 14). This is an **independent** pass: nothing was rendered, re-rolled,
installed or moved in `public/art/`. The producing pass's own report (it
self-judged every pick at 5) is `production.md` in this folder.

**Verdict: FAIL. Every installed state scores 4, against a bar of 7. There is
no winner.** The new attack, hurt and cast are still the best Leblanc
candidates made so far, so keeping them installed as CANDIDATES is right. But
method F with corrected words did not reach the bar, and neither has any
earlier method. Hard rule 15 applies here: this was the fifth Leblanc pose
attempt. Queue no more Leblanc renders until Bailey has seen `judge-sheet.jpg`
and picked a method.

## How it was judged

- Anchor: the installed `public/art/characters/leblanc/idle.png` (591x1118,
  seed 609757527). It is not scored.
- Scored: the four installed battle states `attack.png`, `hurt.png`,
  `cast.png` and `ko.png`. Ko was left alone in round 3 and still carries its
  redo-2 self-score of 7. It is scored here because the brief says "every
  installed state".
- Crops were viewed at native pixels, 1:1 against idle: head, torso and obi,
  fan, and feet. `judge-sheet.jpg` (JPEG q85) has one row per state: the
  whole figure scaled, then head, body and one detail at 1:1. The producer's
  `sheet.jpg` was checked too, but it has no ko row. The three files that
  round 3 replaced were also looked at, from
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-22-leblanc/leblanc/replaced-2026-09-22/`.
- Criteria: the pilot judge's list (hair, face and eyes, skin, robe and obi
  and dress, heart, fan, boots, style), plus "pose reads as its state". Each
  criterion is scored 0 to 10 against idle. **A state's score is its lowest
  criterion.** The bar is 7.
- Approved art: `docs/target/approved-hashes.json` has 115 files and no
  Leblanc entry. All 115 matched their recorded sha256 before this pass and
  again after it.

## Scores

| State | Hair | Face/eyes | Skin | Robe/obi/dress | Heart | Fan | Boots | Style | Pose reads as state | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|
| attack (`attack.22101`) | 6 | 8 | 8 | **4** | 5 | 6 | 7 | 7 | 6 | **4** |
| hurt (`hurt.b.22303.f3`) | 6 | 8 | 7 | **4** | 5 | **4** | 6 | 6 | 7 | **4** |
| cast (`cast.b.22501`) | 6 | 7 | 8 | **4** | 6 | 5 | 5 | 7 | **4** | **4** |
| ko (seed 9613, unchanged) | 7 | 5 | 7 | **4** | 8 | **4** | **4** | 6 | **4** | **4** |

### attack: 4 (the producer said 5)

- **Robe (4).** Idle wears an open overcoat slipped off both shoulders over a
  white high-cut halter dress; the dress is the main mass of the figure.
  Attack draws something else: a closed purple kimono wrapped over a small
  white halter bib, with a wide red collar band (idle's robe edge is white),
  **black-and-white checkerboard panels on both sleeves**, and a striped teal
  cuff. The obi is crimson (the word fix worked), but it is a saturated red
  with gold edge bands, where idle's is a dusty crimson with a gold knot.
  Taken together this is a different costume, not one drifted detail, so it
  scores 4, not 5.
- **Heart (5).** A black-outlined heart tattoo; idle's is a flat red heart.
- **Hair (6).** Ash or silver platinum; idle is a warm pale blonde. The same
  drift shows on hurt and cast. Of the four states, only ko keeps idle's warm
  blonde.
- **Pose (6).** A real lunge with the weight forward, which is the best
  attack body so far. But the empty hand leads and the fan trails behind the
  body, so it reads as a dash or a wind-up rather than a strike landing.
- **Fan (6).** Black ribs with tan guards and a purple tassel. This is the
  closest fan to idle's in any round.
- Face, eyes and skin are good: a serious brow, purple eyes, pale skin. The
  boots are open-toe lace-up heels, darker indigo than idle's lavender (7).

### hurt: 4 (the producer said 5)

- **Robe (4).** The robe is closed at the hip and hangs to the ankle like a
  long skirt, fading to pink at the hem. It has a red collar band and two
  black riveted straps on the sleeve. Idle's white dress shows only in the
  thigh slit.
- **Fan (4).** A closed fan with **pale wood** guards. Idle's fan is black,
  so this is a plain colour miss, not a shade drift.
- **Heart (5).** Not visible from this angle, so the identity mark is gone.
- **Boots (6).** The feet repaint worked: an open-toe lace-up heel. At 1:1
  the boot is glossier and harder-edged than the rest of the figure, with a
  black flared collar and a white strap at the top. The rear foot is only a
  heel with a stray pink edge.
- **Pose (7).** A closed-eye wince, a small open mouth and a hand on the
  stomach, leaning back. This is the first Leblanc hurt, in any round, that
  reads as being hit.

### cast: 4 (the producer said 5)

- **Pose (4).** An extreme backbend: head thrown back looking up, the free
  arm hanging down behind her, and the closed fan held flat at the hip like a
  baton. The prompt asked for "arm up, raised hand, open fan", and none of
  that landed. At game size this reads as being blown backwards (a hurt or
  knockback), not as casting. The producer scored this 6; at 1:1 it is the
  worst criterion on this frame.
- **Robe (4).** A pink shoulder drape and pink lining, plus a bulky red obi
  panel with a hanging maroon tail.
- **Boots (5).** Dark indigo mid-calf lace-ups with grey turned-down cuffs;
  idle's are lavender ankle boots.
- **Fan (5).** Closed and grey, the right size, but not black and not open.
- Heart (6): a small red heart, sitting high near the collarbone.

### ko: 4 (the self-score in `../judge.md` redo 2 is 7)

- **Pose (4).** At 1:1 her right eye is **open**, with a purple iris
  showing, and she is **smiling**: a wink while lying on her side. That reads
  as lounging or playing dead, not knocked out. The redo-2 note says "eyes
  closed"; the pixels disagree.
- **Robe (4).** A closed purple robe with no white dress, a strip of fishnet
  at the waist, and a red-and-gold striped obi.
- **Fan (4).** Red and pink (research colours, not idle's black).
- **Boots (4).** Closed-toe heeled ankle boots with chain anklets.
- The heart is a flat red heart on the sternum (8) and the hair is idle's
  warm blonde (7). The line work is heavier and higher-contrast than idle's
  (style 6). The bent leg's thigh and shin mass reads oddly at 1:1.

## Were the replacements an improvement?

Yes. The replaced candidates are worse on the same criteria. The old attack
has black thigh-highs, red heels and a white-and-gold fan. The old hurt has a
blue-grey skin cast, a closed ankle-length robe and a grimace that reads as a
leer. The old cast has a closed full-length robe with no white dress and a
lavender fan. The new frames bring back the white halter, the crimson obi,
bare legs and open-toe boots. They lose idle's warm hair colour, which the
old frames had. Keeping the new frames installed as CANDIDATES is right;
none of them is approved.

## What the four states have in common

1. **Different garments.** Idle is an open overcoat off both shoulders, a
   white high-cut dress, a crimson obi with a gold knot, and white-edged robe
   lining. Every pose state draws a closed or wrapped kimono with red or pink
   lining, or a red collar band. This has held through five methods (A, A at
   0.4, the redo, F, F with corrected words) and two word sets. IP-Adapter at
   0.4 from 0.2 to 0.6, with the reference cropped square, does not carry the
   silhouette of the outfit into a new pose.
2. **Fan colour.** Black appears in 1 of the 4 states.
3. **Hair.** The corrected "platinum blonde" words cooled the hair to ash in
   all three new frames.
4. **Pose tags land only partly.** The body follows the words (attack
   lunges, hurt winces), but the hands and the fan do not: the fan trails on
   attack, cast has no raised arm, and ko has an open eye.

## Redo: stop and show Bailey (hard rule 15)

Queue no sixth word or seed pass. A method check already exists
(`docs/plans/leblanc-art-method-check.md`), and round 3 was the attempt it
planned. The pilot 2 judge said to stop and show Bailey if this run also
failed. It failed at 4. So the next step is a method choice for Bailey,
presented with this sheet. These are options, not work to start (hard rule
10):

- **(a) Keep the candidates and repair colours in image space.** Mask by
  colour, not by box: recolour the red and pink lining to white and the fan
  to black with a hue mask or a region-masked repaint. This fixes the colour
  criteria (lining, fan, hair tint). It cannot fix the wrong garment
  silhouette or cast's pose, so at best it lifts attack and hurt to about 5
  or 6.
- **(b) Pose the idle itself.** Img2img from idle with a pose ControlNet
  (openpose or depth from a posed reference), at a denoise high enough to
  move the limbs. Pilot method B (img2img without pose control) copied idle's
  pose; a pose ControlNet is the missing piece. Adding the ControlNet node
  needs a check that the model is already on disk (hard rule 11: nothing is
  downloaded without a yes).
- **(c) Accept a rig.** Animate the approved idle as a 2D puppet, as the
  living-portrait rig v2 did, instead of painting new pose frames. Identity
  is then exact by construction, and the cost is less dramatic poses.
- **(d) Hard rule 6 question, still open.** Research
  (`research/ffx2-leblanc-syndicate.md` §10.1) describes stockings, a
  red-and-silver fan and a triangle pattern; idle has none of these. If
  Bailey moves the anchor toward the research, the ko fan (red) and the old
  stockings stop being misses, and the idle would be re-rendered first.

**Per-state redo if work resumes:** attack should strike with the fan
leading, and needs idle's open overcoat, white lining, flat red heart and
warm hair. Hurt keeps this pose and wince, but needs a black fan, the open
robe and the heart visible. Cast is a full redo: arm raised, fan open, no
backbend. Ko is a full redo: both eyes closed, no smile, the white dress and
open-toe boots.

## Files

- `judge-sheet.jpg`: this pass's sheet (idle, attack, hurt, cast, ko; whole
  figure plus 1:1 head, body and detail crops).
- `production.md`: the producing pass's report (moved here from this file's
  path; content unchanged apart from its title line).
- `sheet.jpg`: the producing pass's sheet (no ko row).
