# FFX-2 reachable dressphere poses (art5): independent 1:1 judge (decision sheet 2026-09-25, item 11)

**Game case (rule 14): FFX-2 only.** These are paintings of the FFX-2 girls' dresspheres. They show
only in the FFX-2 chapters where a girl wears that dressphere or spherechanges into it: IV, V/XI, VI
and XIII.

**Who judged:** a sub-agent that made none of these paintings, 2026-09-25. The maker's picks are in
`../verdicts.json` (commit 8979b312).

**Bailey's words**, 2026-09-25 about 11:00 EDT, verbatim: *"I'll go with all your recommendations"*.
Item 11's recommendation is B: item 10's path for every reachable slot, the slots one link from a
start first. Berserker and Samurai wait.

**These are a judge's verdicts, not Bailey's approval.** Nothing was installed in `public/art/`.
Nothing went into `docs/target/approved-hashes.json`. Bailey names each slot from the sheets. A slot
the judge failed stays empty.

## Which slots, in what order

**How reach was measured:** by running the data, not by reading it (hard rule 3).
- The script is `docs/concepts/art5/judge/reach.mts`, run with plain `node`.
- It loads today's builds for IV, V/XI, VI and XIII (the Trema kit option).
- It fills each grid's nodes the way `src/battle/ffx2/setup.ts` `gridNodeContents` does.
- It walks each grid's real links with `adjacentNodes` from `src/battle/ffx2/garment-grids.ts`, the
  same links `spherechange.ts` checks.

**Tiers, in the order judged:**
- **Tier 0: worn at a chapter's start.**
  - rikku-dark-knight (IV, V/XI)
  - paine-warrior (IV, VI)
  - rikku-thief (VI)
  - yuna-gunner (VI)

  These are even more visible than one-link slots.
- **Tier 1: one link from a start.**
  - yuna-gunner, yuna-black-mage, rikku-gunner, rikku-black-mage, paine-gunner (IV, V/XI)
  - paine-black-mage (IV)
  - rikku-black-mage, rikku-white-mage, paine-white-mage, yuna-songstress (VI)
  - rikku-gunner, rikku-white-mage, paine-white-mage, yuna-songstress, paine-warrior (XIII)
- **Tier 2: two or more links.**
  - yuna-warrior
- **Out of reach, so they wait (sheet item 11):** rikku-berserker and paine-samurai, 12 slots. Not judged.
- **Maker's pick null:** rikku-dark-knight victory failed twice for the maker, so there was nothing to
  judge.

That leaves **62 maker picks** judged. Adding the empty Dark Knight victory gives the sheet's 63 slots.

## Method

The method is the Chapter XIII judge's
(`docs/concepts/chapters/trema/poses/judge/JUDGE.md`):
- the same rubric: `docs/concepts/chapters/gippal/production/JUDGE.md`, eight categories, pass at a
  mean of 7.0;
- the same 1:1 composites over a split grey and navy ground;
- the same border-alpha check;
- the same head-match `scale` (idle eye-line-to-chin divided by the pick's);
- the same scale gate: stature at scale 0.75 to 1.30 when upright, at least 0.60 in a lunge.

The tools, `looks.txt`, `measure.json` and `judge.json` are in this folder.

## Scores (bar 7.0), tier order

| Pick | Id | Anat | Hands | Cost | Seams | Edges | Fin | Game | Overall | Scale | Stature | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| paine-warrior/attack c2 | 5.5 | 7.5 | 7 | 5.5 | 8 | 8 | 7.5 | 6.5 | **6.94** | - | - | FAIL |
| paine-warrior/cast c4 | 6 | 7 | 6.5 | 5 | 7.5 | 5 | 7 | 6.5 | **6.31** | - | - | FAIL |
| paine-warrior/hurt c4 | 5.5 | 7 | 6.5 | 4.5 | 8 | 7.5 | 7.5 | 6 | **6.56** | - | - | FAIL |
| paine-warrior/item c3 | 6 | 7 | 7 | 5 | 8 | 8 | 7.5 | 6.5 | **6.88** | - | - | FAIL |
| paine-warrior/ko c3 | 6 | 7 | 6.5 | 5.5 | 7.5 | 4.5 | 5 | 6 | **6.00** | - | - | FAIL |
| paine-warrior/victory c3 | 6.5 | 7.5 | 7 | 6.5 | 8 | 8 | 7.5 | 7.5 | **7.31** | 1.24 | 0.95 | PASS |
| rikku-dark-knight/ko c7 | 7 | 6.5 | 7 | 6.5 | 7.5 | 4.5 | 6.5 | 7 | **6.56** | - | - | FAIL |
| rikku-thief/attack c3 | 6 | 7 | 6.5 | 5 | 7.5 | 6 | 7 | 6.5 | **6.44** | - | - | FAIL |
| rikku-thief/cast c3 | 6 | 7 | 6.5 | 5 | 7.5 | 5.5 | 7 | 6.5 | **6.38** | - | - | FAIL |
| rikku-thief/hurt c6 | 6.5 | 6.5 | 6 | 6 | 7.5 | 7 | 6.5 | 7 | **6.62** | - | - | FAIL |
| rikku-thief/item c3 | 7.5 | 7.5 | 7 | 6.5 | 8 | 8 | 7.5 | 7.5 | **7.44** | 1.85 | 1.49 | FAIL |
| rikku-thief/ko c3 | 7 | 7.5 | 7 | 6.5 | 8 | 8 | 7.5 | 7 | **7.31** | 1.31 | - | PASS |
| rikku-thief/victory c1 | 7 | 7.5 | 7 | 6.5 | 8 | 8 | 7.5 | 7.5 | **7.38** | 2.0 | 1.67 | FAIL |
| yuna-gunner/item c4 | 8 | 7.5 | 7 | 6 | 8 | 8 | 7.5 | 7.5 | **7.44** | 1.09 | 0.87 | PASS |
| paine-black-mage/attack c2 | 6.5 | 7 | 7 | 6 | 8 | 8 | 7.5 | 7.5 | **7.19** | 0.93 | 0.68 | PASS |
| paine-black-mage/cast c1 | 7 | 7.5 | 7 | 6.5 | 8 | 8 | 7.5 | 7.5 | **7.38** | 1.0 | 0.8 | PASS |
| paine-black-mage/hurt c1 | 5 | 6.5 | 6.5 | 5.5 | 8 | 7.5 | 7 | 6 | **6.50** | - | - | FAIL |
| paine-black-mage/item c4 | 7 | 7.5 | 7 | 6.5 | 8 | 8 | 7.5 | 6.5 | **7.25** | 0.95 | 0.79 | PASS |
| paine-black-mage/ko c4 | 6.5 | 7 | 7 | 6 | 7.5 | 5 | 7 | 7 | **6.62** | - | - | FAIL |
| paine-black-mage/victory c4 | 6.5 | 7.5 | 7 | 6.5 | 8 | 8 | 7.5 | 7.5 | **7.31** | 1.14 | 0.96 | PASS |
| paine-gunner/attack c1 | 5.5 | 6.5 | 6.5 | 5 | 8 | 8 | 7 | 6 | **6.56** | - | - | FAIL |
| paine-gunner/cast c2 | 6 | 7.5 | 7 | 5 | 8 | 8 | 7.5 | 6.5 | **6.94** | - | - | FAIL |
| paine-gunner/hurt c2 | 5 | 6.5 | 6 | 5 | 8 | 8 | 7 | 5.5 | **6.38** | - | - | FAIL |
| paine-gunner/item c2 | 5.5 | 7.5 | 7 | 5.5 | 8 | 8 | 7.5 | 6.5 | **6.94** | - | - | FAIL |
| paine-gunner/ko c2 | 5.5 | 6.5 | 6.5 | 5 | 8 | 5.5 | 7 | 6.5 | **6.31** | - | - | FAIL |
| paine-gunner/victory c3 | 5.5 | 7.5 | 7 | 5.5 | 8 | 8 | 7.5 | 6.5 | **6.94** | - | - | FAIL |
| paine-white-mage/attack c2 | 6.5 | 7 | 7 | 5.5 | 8 | 8 | 7.5 | 7.5 | **7.12** | 0.71 | 0.51 | FAIL |
| paine-white-mage/cast c4 | 5.5 | 7 | 7 | 5 | 7.5 | 7.5 | 6.5 | 7 | **6.62** | - | - | FAIL |
| paine-white-mage/hurt c3 | 5 | 5.5 | 6.5 | 5.5 | 8 | 8 | 7 | 5.5 | **6.38** | - | - | FAIL |
| paine-white-mage/item c1 | 5.5 | 7.5 | 7 | 5 | 8 | 7.5 | 7.5 | 6 | **6.75** | - | - | FAIL |
| paine-white-mage/ko c4 | 6 | 7 | 7 | 5 | 8 | 8 | 7.5 | 7 | **6.94** | - | - | FAIL |
| paine-white-mage/victory c3 | 5.5 | 7.5 | 7 | 5 | 8 | 8 | 7.5 | 6.5 | **6.88** | - | - | FAIL |
| rikku-black-mage/attack c4 | 7 | 7.5 | 7 | 6.5 | 8 | 8 | 7.5 | 7.5 | **7.38** | 1.52 | 1.09 | PASS |
| rikku-black-mage/cast c4 | 6.5 | 7 | 6.5 | 6 | 8 | 7.5 | 7.5 | 7 | **7.00** | 1.23 | 1.0 | PASS |
| rikku-black-mage/hurt c2 | 6 | 6.5 | 6 | 5.5 | 7 | 7 | 6.5 | 6 | **6.31** | - | - | FAIL |
| rikku-black-mage/item c4 | 6.5 | 7 | 6.5 | 5.5 | 6.5 | 7.5 | 7 | 6.5 | **6.62** | - | - | FAIL |
| rikku-black-mage/ko c3 | 7 | 7 | 7 | 6.5 | 6.5 | 8 | 7 | 6.5 | **6.94** | - | - | FAIL |
| rikku-black-mage/victory c3 | 6.5 | 7 | 6.5 | 6 | 6.5 | 8 | 7.5 | 6.5 | **6.81** | - | - | FAIL |
| rikku-gunner/attack c2 | 6 | 5 | 7 | 6 | 8 | 8 | 7.5 | 5 | **6.56** | - | - | FAIL |
| rikku-gunner/cast c1 | 7 | 7.5 | 7 | 6.5 | 8 | 8 | 7.5 | 7.5 | **7.38** | 0.99 | 0.81 | PASS |
| rikku-gunner/hurt c4 | 5.5 | 6 | 6 | 5.5 | 8 | 7.5 | 7 | 5.5 | **6.38** | - | - | FAIL |
| rikku-gunner/item c2 | 6.5 | 7 | 6.5 | 5.5 | 8 | 8 | 7.5 | 6.5 | **6.94** | - | - | FAIL |
| rikku-gunner/ko c3 | 6 | 5.5 | 6.5 | 6 | 7.5 | 7.5 | 7 | 6 | **6.50** | - | - | FAIL |
| rikku-gunner/victory c3 | 7 | 7 | 6.5 | 6 | 8 | 8 | 7.5 | 7 | **7.12** | 0.99 | 0.82 | PASS |
| rikku-white-mage/attack c1 | 7 | 7.5 | 7 | 6.5 | 8 | 8 | 7.5 | 7.5 | **7.38** | 1.13 | 0.9 | PASS |
| rikku-white-mage/cast c4 | 7 | 7 | 6 | 6 | 5.5 | 8 | 7.5 | 6.5 | **6.69** | - | - | FAIL |
| rikku-white-mage/hurt c4 | 6.5 | 7 | 7 | 6 | 8 | 8 | 7.5 | 5.5 | **6.94** | - | - | FAIL |
| rikku-white-mage/item c3 | 6.5 | 6.5 | 6.5 | 5.5 | 6.5 | 8 | 7 | 6.5 | **6.62** | - | - | FAIL |
| rikku-white-mage/ko c3 | 6 | 6.5 | 6.5 | 6 | 7.5 | 7.5 | 5.5 | 6.5 | **6.50** | - | - | FAIL |
| rikku-white-mage/victory c3 | 7 | 7 | 6.5 | 6 | 5.5 | 7.5 | 7.5 | 6.5 | **6.69** | - | - | FAIL |
| yuna-black-mage/item c4 | 7 | 7 | 6.5 | 6.5 | 8 | 8 | 7.5 | 7 | **7.19** | 1.66 | 1.29 | PASS |
| yuna-songstress/cast c4 | 5 | 7.5 | 7 | 6.5 | 8 | 8 | 6 | 7 | **6.88** | - | - | FAIL |
| yuna-songstress/hurt c2 | 6.5 | 7.5 | 7 | 5.5 | 8 | 5 | 7.5 | 7 | **6.75** | - | - | FAIL |
| yuna-songstress/item c2 | 7 | 7.5 | 7 | 6 | 8 | 8 | 7.5 | 7.5 | **7.31** | 1.38 | 1.04 | PASS |
| yuna-songstress/ko c1 | 6.5 | 6 | 7 | 6.5 | 8 | 8 | 6 | 7 | **6.88** | - | - | FAIL |
| yuna-songstress/victory c1 | 6.5 | 7.5 | 7 | 5 | 8 | 8 | 7.5 | 6 | **6.94** | - | - | FAIL |
| yuna-warrior/attack c4 | 5.5 | 6.5 | 6 | 5 | 6.5 | 5 | 7 | 6 | **5.94** | - | - | FAIL |
| yuna-warrior/cast c3 | 5 | 7.5 | 7 | 5.5 | 8 | 8 | 7.5 | 7 | **6.94** | - | - | FAIL |
| yuna-warrior/hurt c2 | 5 | 6.5 | 6 | 5 | 7 | 8 | 7 | 6 | **6.31** | - | - | FAIL |
| yuna-warrior/item c2 | 5 | 7 | 6.5 | 5.5 | 8 | 8 | 7.5 | 5.5 | **6.62** | - | - | FAIL |
| yuna-warrior/ko c2 | 5.5 | 7 | 7 | 5 | 8 | 8 | 7 | 6.5 | **6.75** | - | - | FAIL |
| yuna-warrior/victory c2 | 7 | 7.5 | 6.5 | 6.5 | 7 | 8 | 7.5 | 7 | **7.12** | 1.36 | 1.0 | PASS |

**Result: 15 of 62 pass.** 18 cleared the score bar; the scale gate then failed 3 of them.

**Tier 0 (worn at a start):** 3 pass of 14.
- paine-warrior victory
- yuna-gunner item
- rikku-thief ko

**Tier 1 (one link):** 11 pass of 42.
- paine-black-mage: attack, cast, item, victory
- rikku-black-mage: attack, cast
- rikku-gunner: cast, victory
- rikku-white-mage: attack
- yuna-black-mage: item
- yuna-songstress: item

**Tier 2:** 1 pass of 6.
- yuna-warrior victory

**No pass at all:** rikku-dark-knight (ko), paine-gunner (0 of 6) and paine-white-mage (0 of 6).

**The scale gate** failed these three, each above the score bar:
- **rikku-thief item and victory.** The shipped Thief idle is drawn with a head about 1.9x the size
  of every other Rikku (eye to chin 85 px, against about 45 for the picks). A head match gives scale
  1.85 and 2.00, and she would stand 1.5 to 1.7 times the idle. The fault is the idle's proportions
  as much as the picks'. Question 1 below.
- **paine-white-mage attack.** The pick's head is 1.4x the idle's, so at the head-match scale of 0.71
  her lunge stands 0.51 of the idle.

**Faults that ran through the batch:**
- **Paine's costumes drift toward red.** This is the Gunner's red corset and red boots, and the
  Warrior's red boots and red jacket. Her swept crest also comes out as an exploded spiky mane.
- **The White Mage turns into the classic Final Fantasy robe.** Both girls get a zigzag hem, and the
  idle's own crescent, capelet and lattice are lost.
- **Staffs come apart.** A staff head floats with no shaft, or two shafts do not meet: Rikku's Black
  Mage item, hurt, ko and victory, and her White Mage cast and victory.
- **Guns turn into toy blasters or disappear.**
- **Hurt poses read as a stumble, a bow or a banner lift, not a hit.** None of the hurt picks pass.

## Per pick, worst named first

### paine-warrior (IV, VI start; XIII one link)

- **attack cand-2: FAIL (6.94).** the hair is an exploded spiky mane about twice the idle's swept crest; the thigh boots are bright red (idle: black with red straps), confirmed; the sword is a plain red blade on a blue katana grip with a round guard (idle: red ornate longsword, winged crossguard). At game size the red legs and the mane change her silhouette.
- **cast cand-4: FAIL (6.31).** a detached red blade fragment floats beside her left hip (the hilt in her hand has no blade attached; another red blade shows behind her thigh); one boot red, the other black; hair short and spiky with a purple band, not the swept crest; figure ~0.8 of idle height.
- **item cand-3: FAIL (6.88).** bottle held out reads; but one boot bright red and one black, a red shoulder cape the idle does not have, the sword is a silver-blue blade with a red grip (idle: red ornate longsword), hair short and spiky; figure ~0.75 of idle height.
- **hurt cand-4: FAIL (6.56).** leaning back, one eye shut, the hurt reads weakly; both thigh boots and the jacket are red (idle: black jacket, black boots), a thin rapier with a blue grip, spiky short hair; a pale blue cast-shadow blob painted at her feet; figure ~0.65 of idle height.
- **ko cand-3: FAIL (6.00).** on her side, head right, eyes shut; but a rainbow floor streak (cyan, red, yellow) is painted under the whole body and runs off the left canvas edge; the sword blade is rainbow-coloured; red boot feet; spiky blue-white hair.
- **victory cand-3: PASS (7.31, scale 1.24).** sword over the shoulder, hand on hip, smirk; boots black with red straps (close to the idle; red soles and toe caps); jacket navy with red sleeve panels (idle: black leather); hair spikier than the idle's swept crest; the sword is a red-to-white blade on a blue hilt with jewelled guard (idle: red ornate longsword).

### rikku-dark-knight (IV, V/XI start)

- **ko cand-7: FAIL (6.56).** face, braid and navy armour read as her, eyes shut, head right; but painted content touches the left, right and bottom canvas edges (the boots are cut off at the left edge, hair cut at the bottom), four small brown fragments float above her, the sword under her legs is a flat blue shape with white slits through it, and a bare thigh shows between skirt and greave (the idle is fully covered).

### rikku-thief (VI start)

- **attack cand-3: FAIL (6.44).** the two daggers merged into one double-ended red-bladed pole weapon held in both hands; a blue-and-orange piece floats detached beside her hair at the upper left; legs red-orange (idle: bare), confirmed; pale green sleeves (idle: puffy blue sleeves with yellow bows); boots blue with orange feathers (idle: blue-white sock boots, green soles).
- **cast cand-3: FAIL (6.38).** one dagger raised, reads as a cast; but the boot soles are cut by the bottom canvas edge, the second dagger is gone (a long blue streamer hangs there instead), no puffy blue sleeves (small white cuffs), red-orange legs.
- **item cand-3: FAIL (7.44).** **scale gate: at the head-match scale 1.85 she stands 1.49 of the idle (allowed 0.75 to 1.30).** bare legs, puffy blue-white sleeves with yellow bows, yellow top, red scarf, green skirt, belt pouches; bottle held out toward the enemy; no dagger in either hand; boots blue with a white star (idle: blue-white sock boots, green soles). SCALE NOTE: the Thief idle leans toward the camera, so its head is foreshortened large; a head match overstates this upright pose (see scale table).
- **hurt cand-6: FAIL (6.62).** head thrown back, one eye shut, the recoil reads; but a blue fork-shaped object dangles from her braid at the left, the dagger in the right hand sprouts orange flame blades, the puffy sleeves are gone, and the torso twist reads as a bend at the hip more than a hit.
- **ko cand-3: PASS (7.31, scale 1.31).** down on her front, head right and raised on her arms, eyes shut; bare legs, green skirt, yellow top, red scarf, bandana and braids; the sleeves are small cuffs, not the puffy blue ones; white-blue sneakers. Reads as down, though the raised head is closer to resting than fallen.
- **victory cand-1: FAIL (7.38).** **scale gate: at the head-match scale 2.00 she stands 1.67 of the idle (allowed 0.75 to 1.30).** one dagger raised high, grin, bare legs, bandana, braids, red scarf; the raised blade is a long thin orange spike (longer than the idle's daggers); the second dagger is gone; light-blue half sleeves, not the puffy ones; blue boots.

### yuna-gunner (VI start; IV, V/XI one link)

- **item cand-4: PASS (7.44, scale 1.09).** the idle's face, heterochromia on the same sides (green screen-left, sourced), earring, white halter, pink hood, obi, yellow arm ribbon, blue skirt; the round bottle is held out toward the enemy; NO pistol in either hand (both gone, not only the second), and the knee-high lace-up boots came out as ankle boots; figure ~0.8 of idle height.

### paine-black-mage (IV one link)

- **attack cand-2: PASS (7.19, scale 0.93).** hat (purple, red crown band, buckle), silver bob, red eyes, fishnet sleeve all hold; the staff thrust reads; the fitted slit gown billows into a huge lavender skirt; the staff is a blue rod with a red orb in a crescent (idle: red and silver claw-headed staff); pink neck scarf.
- **cast cand-1: PASS (7.38, scale 1.00).** staff raised high, reads as a cast; hat, slit gown, belt, black lace sleeves hold; the hair picks up a purple-blue tint; the hat has no buckle badge; the staff is an ornate gold-and-blue rod with an eye orb (idle: red claw-headed staff).
- **item cand-4: PASS (7.25, scale 0.95).** hat, silver bob, red eyes, pink off-shoulder ruffle, belt hold; the bottle is small and held low at the hip, so the item action reads weakly at game size; the gown is closed (idle: high slit); ornate eye-orb staff (idle: red claw staff).
- **hurt cand-1: FAIL (6.50).** a round, cute wincing face with a big head on a short body (not the idle's stern Paine); the hat turned red with a huge red ribbon (idle: purple hat, red band); a long double-pointed staff with a black cord loop; full puffy dress; the recoil barely reads.
- **ko cand-4: FAIL (6.62).** lying on her front, head right, eyes shut, hat on; but the staff shaft is cut flat by the left canvas edge and a dark painted shadow wedge under the hat brim runs to the right edge; the hat is blue with red gems (idle: lavender with a red band and buckle).
- **victory cand-4: PASS (7.31, scale 1.14).** hand on hip, staff planted, slight smile; the hat is a flat wide purple brim with a red cone crown (idle: lavender hat, red band, buckle); lavender-tinted hair; closed gown; the staff's gold claw head is the nearest to the idle's staff of any Black Mage frame.

### paine-gunner (IV, V/XI one link)

- **attack cand-1: FAIL (6.56).** the pistols are chunky orange toy blasters (idle: red-and-black revolvers) and they point in opposite directions, one at screen-left away from the enemy; red boots (idle: black knee boots); an exploded spiky mane (idle: swept crest); red top.
- **cast cand-2: FAIL (6.94).** pistol raised reads; but the torso reads red (a red frilled corset; idle: black off-shoulder jacket with a red panel), the raised gun is a yellow-and-black toy shape with a flame-coloured nozzle, the holstered one is yellow; spiky white hair (idle: swept crest); figure ~0.8 of idle height.
- **item cand-2: FAIL (6.94).** bottle held out reads; but the torso is a red corset with a white halter (idle: black jacket, red panel), the other hand holds a gold-and-red object that is not a pistol, and the hair is a spiky mane.
- **hurt cand-2: FAIL (6.38).** doubles over forward rather than reeling back; the pistols are blue bundled tubes like brooms (no gun shapes); red-and-black one-piece top (idle: black jacket); spiky mane; a blue shadow smear under the right boot.
- **ko cand-2: FAIL (6.31).** lying, head right, eyes shut; but the boot toe touches the left canvas edge, the boots are red, an orange toy blaster lies across her hip, and the hair is a spiky mane.
- **victory cand-3: FAIL (6.94).** pistol raised, smile; the same drift as the rest of the set: red corset torso, boots red down the front, spiky mane; the lowered pistol is a small orange stub.

### paine-white-mage (V/XI, VI, XIII one link)

- **attack cand-2: FAIL (7.12).** **scale gate: at the head-match scale 0.71 she stands 0.51 of the idle (allowed 0.60 to 1.30).** hood, silver hair, red eyes, crescent staff (gold, the idle's is red-orange) and the lunging swing read; the robe became the classic white-mage cape with a pink zigzag hem, and the idle's gold chest crescent, purple capelet, orange hem panels and lattice are gone; bare legs where the idle robe reaches the ankles.
- **cast cand-4: FAIL (6.62).** the staff raised high reads, and the crescent head is close to the idle's; but at 1:1 the face is half covered by a red smear from the hood lining (one eye shows), the robe turned into an orange-and-white zigzag cape with a thigh slit, and two red tassels hang from the staff head.
- **item cand-1: FAIL (6.75).** a soft, doll-like face (not the idle's stern Paine); the robe is the classic white-mage robe with an orange zigzag hem (the idle's chest crescent, capelet, lattice panels and belts are gone); the bottle hangs low at her side so the item action does not read at game size; a painted black cast shadow under the feet.
- **hurt cand-3: FAIL (6.38).** a tiny head on a very long robe (the head is about a third smaller than the body asks for), the staff held up like a banner so the hurt does not read; the staff head is a giant gold horn; a soft cute face.
- **ko cand-4: FAIL (6.94).** lying on her side, head right, eyes shut, hood on, staff under the hand: reads as down; but the robe is the classic white-mage robe with red zigzag cuffs and hem (none of the idle's crescent, capelet, belts or lattice), and the staff head is a small gold star disc, not the crescent.
- **victory cand-3: FAIL (6.88).** staff on the shoulder, hand on hip, smile; the staff head is a huge gold spiked sunburst (idle: the red-and-gold crescent), about a fifth of the whole frame; the classic white-mage robe with orange zigzag hem; soft smiling face.

### rikku-black-mage (IV, V/XI, VI one link)

- **attack cand-4: PASS (7.38, scale 1.52).** hat with the star badge, purple leotard, fishnet sleeves, belts and pouches, pink leg warmers, orange claw-headed staff: the idle's kit; the staff swing toward the enemy reads; the hair is much longer and flows to the waist (idle: shoulder length with braids); a charm with a red tassel hangs off the staff head.
- **cast cand-4: PASS (7.00, scale 1.23).** staff raised, hat, leotard, belts, pink leg warmers; the hair runs to her knees with a pale translucent streamer behind (idle: shoulder length); no fishnet sleeves; the staff head is an open gold ring with a blue orb.
- **item cand-4: FAIL (6.62).** the bottle held up reads; but the staff does not line up: its head floats behind her hat with no hand on it, and the lower shaft in her other hand runs at a different angle, so it reads as two broken staffs; the leg warmers came out blue-purple (idle: pink); hair to the waist.
- **hurt cand-2: FAIL (6.31).** the hat flew off and stands upright behind her like a giant purple shell, with a gold ring (the staff head, with a white hole) floating above it; the staff is split in two (a head up top, a lower shaft angled down at the right); wince face reads.
- **ko cand-3: FAIL (6.94).** lying on her side, head right on her hand, eyes shut: the face and kit read (hat, fishnet, pink leg warmers); but the staff head stands straight up out of the hat with no shaft or hand, a spike rising from her head at game size, and the pose reads as asleep more than fallen.
- **victory cand-3: FAIL (6.81).** grin, hand on hip, hat, leotard, pink leg warmers read; but the staff is broken again: its head sits above the hat brim at the right with no hand on it, and the lower shaft comes out at her left hip at an angle that does not meet it; a white half-sleeve replaces the fishnet on one arm.

### rikku-gunner (IV, V/XI, XIII one link)

- **attack cand-2: FAIL (6.56).** both pistols aimed at the enemy, bandana, braids, pink scarf, white crop top, denim shorts: her kit; but the proportions are not the idle's: the head is about 2x the idle's (eye-to-chin 85 px vs 43) on a body about 1.1x as tall, so no single scale matches both, and at game size the switch from idle would pop a big-headed figure; the pistols are chunky toy blasters (idle: long blue pistols).
- **cast cand-1: PASS (7.38, scale 0.99).** pistol raised high, the other at her hip, bandana, braids, pink scarf, white crop top, belts, denim shorts: her kit reads; the pistols are red and short (idle: long blue); the scarf flares into a long pink streamer; no white arm wraps on the raised arm's partner.
- **item cand-2: FAIL (6.94).** bottle held out reads; but the other hand holds a brown wooden mug-like holster, not a pistol (no pistol anywhere); the top is an orange vest with a green bra (idle: white crop top); the scarf is a knee-length pink shawl; one leg orange, one bare.
- **hurt cand-4: FAIL (6.38).** seen from behind, bent over, face mostly hidden by hair (one eye); the pistol is a spiked blue mace-like blaster; a painted cast shadow between the boots; the hurt reads as a stumble away, not a hit.
- **ko cand-3: FAIL (6.50).** down, eyes shut, pistol by her hand; but the head is about 1.8x the idle's (the same proportion drift as her attack), she props herself up upright on one arm like resting, and a flat cyan puddle is painted under her.
- **victory cand-3: PASS (7.12, scale 0.99).** finger raised high, grin, the one pistol held low; bandana, braids, pink scarf, crop top, denim shorts; an orange vest over the top and blue leg-warmer boots (idle: tall blue boots with gold buckles); the raised hand holds no pistol.

### rikku-white-mage (VI, XIII one link)

- **attack cand-1: PASS (7.38, scale 1.13).** the staff swung down toward the enemy, two hands on it; bandana, braids, red scarf, white coat with blue lining, green belt, white apron skirt, blue boots; a pink-and-white cape tail flares far to the left and two red ribbons stream up from her hair; the staff head is an orange claw (idle: orange spade head with a crescent).
- **cast cand-4: FAIL (6.69).** the staff floats beside her: neither hand holds it (the raised hand is open and empty, the other hangs at her side), with a loose yellow bell hanging off its shaft; the idle's white coat is gone (a small capelet and a purple-orange train instead); her kit otherwise reads.
- **item cand-3: FAIL (6.62).** bottle held up reads; but the staff is a short gold mace pointing backward and a red whip-like loop curls from it behind her legs like a tail; the coat became a flame-coloured train; the figure is small (~0.74 of the idle).
- **hurt cand-4: FAIL (6.94).** the wince face reads at 1:1, but the staff is thrust straight up with its head high above her, so at game size the frame reads as a cheer or a cast, not a hit; the coat's sleeves carry red zigzags the idle does not have.
- **ko cand-3: FAIL (6.50).** at 1:1 the face is garbled: one eye open, stray red strokes across the cheek and brow, the bandana and hair run into each other; a flat cyan puddle is painted under her; the staff head is a small orange hook.
- **victory cand-3: FAIL (6.69).** grin and hand on hip read; but she has two staffs: one over her shoulder with a gold-and-green head at the top left, and a second blue-and-orange shaft standing at her right hip down to the floor; a painted blue shadow streak under the boots.

### yuna-black-mage (IV, V/XI one link)

- **item cand-4: PASS (7.19, scale 1.66).** blue witch hat with the pink flower, heterochromia on the idle's sides (green screen-left), white top, orange obi, blue-to-pink pleated skirt with the slit, blue boots; the bottle is held up at the right; the staff is a gold bell-head with three long tassels (idle: gold ring head), held across the back; the flower is pink-lotus rather than the idle's pink bow with a teal rose.

### yuna-songstress (VI, XIII one link)

- **cast cand-4: FAIL (6.88).** microphone raised, hand on hip, her kit reads (white top, orange obi, blue skirt, pink-and-blue sash, pink thighhighs, brown boots); but at 1:1 the far eye is a red swirl scribble, not an eye (no blue eye at all), and the earrings are big blue hoops (idle: teal drops).
- **item cand-2: PASS (7.31, scale 1.38).** bottle held up toward the enemy, hand on hip, smile; heterochromia present (green screen-left, sourced; the idle's is swapped), teal drop earrings, obi, blue skirt, pink thighhighs; the sash grows into a floor-length blue-and-navy train, the top is pale blue (idle: white), boots red-brown and short (idle: tall tan); orange gloves.
- **hurt cand-2: FAIL (6.75).** head back, one eye shut, hand at the chest: the hurt reads; but the sash train is cut straight by the right canvas edge, the boots came out black (idle: tall tan), the earrings pink balls (idle: teal drops), the obi is an orange pouch.
- **ko cand-1: FAIL (6.88).** the body reads as down (on her side, head right on her arm, the mic by her hand, her kit); but at 1:1 the face is muddled: a half-open blue eye sits right beside the ear, the other eye is a closed arc high on the brow, and a blue band cuts across the hair.
- **victory cand-1: FAIL (6.94).** both arms up, open smile, heterochromia present: a cheerful read; but she holds a microphone in EACH hand (the idle has one), the sash train is gone (a big pink bow on the obi instead), the boots are lace-up ankle-to-knee browns, and the figure is short (~0.75 of the idle).

### yuna-warrior (IV, V/XI, XIII, two or more links)

- **attack cand-4: FAIL (5.94).** two swords (one in each hand, the idle has one), the right blade is cut by the right canvas edge, a huge red hood-cape billows up behind her head (idle: small red hood down, collar), no kimono sleeves or long skirt (a short blue skirt).
- **cast cand-3: FAIL (6.94).** arm up, sword held low: the cast reads; but one eye is red (red screen-left, green screen-right: no blue eye), the kimono sleeves are gone, the skirt is a short pink-white wrap (idle: long blue skirt), and the sword crossguard and grip are cut by the painted sleeve line.
- **item cand-2: FAIL (6.62).** the red hood is worn UP (idle: down), confirmed; both eyes green (no heterochromia); two bottles hang low at her hip so the item action does not read at game size; the sword is held point-down like a cane; a small figure (~0.72 of the idle).
- **hurt cand-2: FAIL (6.31).** head back, the recoil reads; but the red hood is up, the sword is a yellow blade held upside down by the tip-end with no hand on the grip, the skirt and sleeves are gone (navy tights, a pink tail), and the figure is small (~0.62 of the idle).
- **ko cand-2: FAIL (6.75).** on her side, head right, eyes shut: reads as down; but the red hood is up, no sword anywhere, the long skirt, kimono sleeves and obi flower are gone (blue tights, a short navy frill).
- **victory cand-2: PASS (7.12, scale 1.36).** hood DOWN as in the idle, heterochromia present, teal bead earrings, pink kimono sleeves, obi, long blue skirt, calm smile, hand on hip; but the sword is a plain blue blade rising from behind her back with no hilt or hand showing (the idle's ornate cyan blade with the gold guard is not reproduced), and the obi flower is missing.

## Scale sidecars (passes only)

**Where the files are:** `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-judge-poses/<id>/<slot>.png`,
with `<slot>.json` beside it. The sidecar holds `scale`, `scaleNote`, the render settings, `status`
CANDIDATE and the sha256.

| Slot | Idle eye-chin px | Pick eye-chin px | `scale` | Stature at scale |
|---|---|---|---|---|
| paine-warrior/victory | 54.6 | 44.0 | 1.24 | 0.95 |
| rikku-thief/ko | 85.1 | 65.1 | 1.31 | prone |
| yuna-gunner/item | 65.0 | 59.5 | 1.09 | 0.87 |
| paine-black-mage/attack | 44.1 | 47.5 | 0.93 | 0.68 (lunge) |
| paine-black-mage/cast | 44.1 | 44.2 | 1.00 | 0.80 |
| paine-black-mage/item | 44.1 | 46.5 | 0.95 | 0.79 |
| paine-black-mage/victory | 44.1 | 38.7 | 1.14 | 0.96 |
| rikku-black-mage/attack | 58.6 | 38.5 | 1.52 | 1.09 (lunge) |
| rikku-black-mage/cast | 58.6 | 47.7 | 1.23 | 1.00 |
| rikku-gunner/cast | 43.1 | 43.7 | 0.99 | 0.81 |
| rikku-gunner/victory | 43.1 | 43.3 | 0.99 | 0.82 |
| rikku-white-mage/attack | 59.0 | 52.0 | 1.13 | 0.90 (lunge) |
| yuna-black-mage/item | 59.0 | 35.5 | 1.66 | 1.29 |
| yuna-songstress/item | 60.5 | 44.0 | 1.38 | 1.04 |
| yuna-warrior/victory | 57.5 | 42.3 | 1.36 | 1.00 |

Two passes sit near the edges of the gate, and the sheets show both at game size:
- **yuna-black-mage/item at 1.29.** She comes out taller than her idle.
- **paine-black-mage cast and item at about 0.80.** They come out a little shorter.

## Sheets for Bailey (one per girl)

The sheets are `sheet-yuna.jpg`, `sheet-rikku.jpg` and `sheet-paine.jpg`, in this folder. Each one
lists the dresspheres in tier order: the ones worn at a start first, then one link, then more than
one link.

**What each dressphere block shows:**
- the shipped idle and every pass at 1:1, with the judge's look above each frame;
- a game-size strip: the idle standing 240 px, and each pose at its sidecar `scale` on one ground line.

The failed picks are at the bottom, small, each with its reason.

## Questions for Bailey (not built)

1. **Rikku's Thief idle is drawn with a much larger head than her pose paintings.** A head-matched
   pose therefore stands 1.5 to 1.7 times the idle. Either her poses stay empty, or the idle is
   re-derived to match. Rikku wears the Thief at the start of Chapter VI. Her ko passes (scale 1.31).
2. **Two shipped idles have Yuna's eyes on the off-source sides.** The Songstress and Dark Knight
   idles put blue on screen-left, and the source puts green there
   (`research/visual-bible.md` §Yuna). Most passing picks follow the source, so a pose swap flips her
   eye colours.
3. **Most empty slots stay empty after this judge.** Should a second render round go to the tier 0
   and tier 1 slots only? The hurt slots have not passed for any girl. That would be new work, so
   it needs a yes first.

## Before any install (Bailey decides)

Bailey names slots from the sheets. A name approves that slot only. The install then goes in this
order:
1. Copy `<slot>.png` and `<slot>.json` from the judge-poses folder into `public/art/characters/<id>/`.
2. Run `npm run art:manifest`.
3. Check the pose in a real fight in a chapter that reaches it.
4. Add the hash to `approved-hashes.json` only when Bailey says so.
