# Pose round 2 (FFX-2 only): Round 2 results

**Agent looks and agent judge, not Bailey.** Nothing installed to `public/art`; nothing
committed changes `docs/target/approved-hashes.json` or `judge-locked-hashes.json`.
This section is generated from `looks.json` (try a and try b, the "agent look" pass)
and `judge2.json` (the agent judge's scored pass against the round 1 rubric, mean >= 7.0
to pass); see `make-sheets2.py results` for the per-girl `sheet2-<id>.jpg` picture sheets,
and `round2-ready.jpg` for every judge-PASS pick beside its idle in one overview image
(`make-sheets2.py ready`). The Paine Warrior method run's own sheet is `sheet3-paine-warrior.jpg`;
`sheet2-paine-warrior.jpg` still shows the pre-method picks.

Counts across the 55 worklist slots (this pass judged every slot the makers
passed): **23 judge PASS**, **23 judge FAIL** (the maker's own pick scored
below the 7.0 bar), **1 maker FAIL** (no candidate the maker judged worth a judge
pass), **8 STOPPED** (failed try b, rule 15: no third try; the Thief's attack and
cast failed a third, try c), **0 not looked at yet**. The five Paine Warrior slots
count by their method-run judge (pass "method" in `judge2.json`, 2026-09-26): attack
and cast PASS; item, hurt and ko FAIL. The five Rikku Thief slots count by the
body-height judge (pass "thief-body-gate", 2026-09-26, below): item, hurt and victory
PASS; attack and cast STOPPED.

**Rikku Thief, body-height gate (FFX-2 only; Bailey, 2026-09-26: "I'll go with all your
recommendations", item 4 = judge her poses by body height; JUDGE.md Question 1, answered).**
Every Thief candidate was re-judged against the full rubric with the new gate: round 2
try a (cand 1-4) and try b (5-8), round 1 (the 2026-09-25-gpu5 set, cand 1-8), and a new
try c of four renders per slot with no pass (cand 9-12: the try b fixes without the
big-head words, on a skeleton with a normal Rikku head, `skeletons-thief-c.py`,
`render-thief-c.mjs`). 12 GPU jobs, no black frame. Scores per candidate:
`judge2.json` "thiefBodyGate"; the picture: `sheet3-rikku-thief.jpg`.

| slot | pick | judge score | body scale | head at that scale |
|---|---|---|---|---|
| rikku-thief/attack | no pick (STOPPED) | best try c cand-10 6.94: a fan of three blades in one fist | - | - |
| rikku-thief/cast | no pick (STOPPED) | best try c cand-10 6.94 (pale, big blue sickles), cand-11 6.88 | - | - |
| rikku-thief/item | round 1 cand-3.png | PASS 7.38 | 1.24 | 0.67 of the idle's |
| rikku-thief/hurt | try c cand-11.png | PASS 7.06 (narrow) | 1.18 (bent, unfolded) | 0.56 |
| rikku-thief/victory | round 1 cand-3.png | PASS 7.44 | 1.21 | 0.56 |

**The try b item pick (cand-8) in `round2-ready.jpg` no longer passes:** pass 2 scored it
6.94, and at body scale its forced head is 0.94 of the idle's (gate 0.45 to 0.85). Under the
body-height gate the Thief item pick is round 1 cand-3. `round2-ready.jpg` was not redrawn.

## D-194 install list (driver, 2026-09-26): exactly these 20

Bailey approved "the 21 judged picks" as shown in `round2-ready.jpg` (sent to him ~06:50 EDT;
D-194). One of those 21, **rikku-thief/item try b cand-8, is WITHDRAWN**: under Bailey's own
D-195 (the Thief judged by body height) it fails (head 0.94 of the idle's at body scale, gate
0.45 to 0.85). So D-194 installs **these 20 and nothing else**; rikku-thief/item keeps the idle.
The three body-gate Thief picks in the table above (item round 1 cand-3, hurt try c cand-11,
victory round 1 cand-3) were never shown to Bailey: they are **not installed** until he picks
them from `sheet3-rikku-thief.jpg`.

| # | slot | candidate |
|---|---|---|
| 1 | paine-black-mage/ko | cand-1.png |
| 2 | paine-dark-knight/cast | cand-2.png |
| 3 | paine-dark-knight/ko | cand-1.png |
| 4 | paine-gunner/attack | cand-1.png |
| 5 | paine-gunner/item | cand-8.png (try b) |
| 6 | paine-gunner/victory | cand-4.png |
| 7 | paine-warrior/attack | method cand-7-comp.png (D:/Tools/pyrefly-art-backup/candidates/2026-09-26-method/paine-warrior/attack/) |
| 8 | paine-warrior/cast | method cand-8-comp.png (D:/Tools/pyrefly-art-backup/candidates/2026-09-26-method/paine-warrior/cast/) |
| 9 | paine-white-mage/cast | cand-2.png |
| 10 | rikku-alchemist/attack | cand-4.png |
| 11 | rikku-black-mage/ko | cand-4.png |
| 12 | rikku-gunner/attack | cand-4.png |
| 13 | rikku-gunner/item | cand-4.png |
| 14 | rikku-gunner/ko | cand-3.png |
| 15 | rikku-white-mage/cast | cand-3.png |
| 16 | rikku-white-mage/victory | cand-1.png |
| 17 | yuna-songstress/cast | cand-2.png |
| 18 | yuna-songstress/ko | cand-1.png |
| 19 | yuna-songstress/victory | cand-6.png (try b) |
| 20 | yuna-warrior/hurt | cand-7.png (try b) |

Round 2 candidates live under `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-day1/pose-round2/<slot>/`
unless the row names another folder. Scales: the head-matched scale the judge recorded in
`judge2.json` for each pick.

## Ready for Bailey's pick (judge PASS at 7.0 or above)

Agent looks and agent judge only — none of this is Bailey's call yet. Every row below
cleared the round 1 rubric's mean-of-8-categories bar at 7.0; "narrow" means within a few
hundredths of the bar and should be looked at again before it is trusted.

| slot | pick | judge score |
|---|---|---|
| paine-dark-knight/cast | cand-2.png | PASS 7.19 |
| paine-dark-knight/ko | cand-1.png | PASS 7.06 |
| paine-warrior/attack | method cand-7-comp.png | PASS 7.12 |
| paine-warrior/cast | method cand-8-comp.png | PASS 7.00 (exactly on the bar) |
| rikku-alchemist/attack | cand-4.png | PASS 7.12 |
| rikku-thief/item | round 1 cand-3.png (body-height gate; replaces try b cand-8) | PASS 7.38 |
| rikku-thief/hurt | try c cand-11.png (body-height gate) | PASS 7.06 (narrow) |
| rikku-thief/victory | round 1 cand-3.png (body-height gate) | PASS 7.44 |
| paine-black-mage/ko | cand-1.png | PASS 7.00 |
| paine-gunner/attack | cand-1.png | PASS 7.00 |
| paine-gunner/item | cand-8.png | PASS 7.25 |
| paine-gunner/victory | cand-4.png | PASS 7.38 |
| paine-white-mage/cast | cand-2.png | PASS 7.12 |
| rikku-black-mage/ko | cand-4.png | PASS 7.12 |
| rikku-gunner/attack | cand-4.png | PASS 7.12 |
| rikku-gunner/item | cand-4.png | PASS 7.38 |
| rikku-gunner/ko | cand-3.png | PASS 7.06 (narrow) |
| rikku-white-mage/cast | cand-3.png | PASS 7.25 |
| rikku-white-mage/victory | cand-1.png | PASS 7.06 |
| yuna-songstress/cast | cand-2.png | PASS 7.31 |
| yuna-songstress/ko | cand-1.png | PASS 7.00 (exactly on the bar) |
| yuna-songstress/victory | cand-6.png | PASS 7.38 |
| yuna-warrior/hurt | cand-7.png | PASS 7.19 |

## Open method questions

- **ANSWERED 2026-09-26 (Bailey: judge the Thief by body height; results above).** JUDGE.md
  Question 1 (the Rikku Thief head scale). The shipped Thief idle draws Rikku's
  head at about 1.9x the size of every other Rikku pose, so the round 1 head-match scale gate
  reads every otherwise-good Thief candidate as too tall. Round 2's thief slots (attack, cast,
  hurt, victory) all STOPPED under rule 15 without a scale ruling; only item passed the judge,
  narrowly, on a scale that still reads a little large at game size. This needs Bailey's answer
  before more tries are spent on the stopped Thief slots.
- **The Paine Warrior sword that floats or doubles.** Every one of Paine Warrior's 5 round 2
  slots (attack, cast, item, hurt, ko) failed with the same class of fault: the sword floats
  unheld beside or behind her, forks into two blades, or is held in the wrong (cast) hand,
  across both try a and, where it ran, try b. **Method run (2026-09-26, METHOD-CHECK.md, commit
  a3584d1d):** the maker rendered each body with no sword and pasted the idle's own sword into
  her hand. This fixed the floating and doubling on all five slots: each pick has exactly one
  sword. The judge passed attack (7.12) and cast (7.00). Item, hurt and ko still fail on the
  body (an elf ear, a malformed hand, the wrong kit), not on the sword.
  - **Sword size.** The pasted sword comes out at about 0.72 to 0.75 of the idle's sword on
    attack, cast and hurt once the head-match scale is applied, so it reads thin at battle size.
  - **Grip.** Where the hand should close around the grip, the composite shows a flat,
    unshaded red rod.

## Per-girl, for Bailey

### Yuna

- **yuna-dark-knight** (3 slots): 0 judge PASS, 2 judge FAIL, 0 maker FAIL, 1 STOPPED.
- **yuna-songstress** (4 slots): 3 judge PASS, 1 judge FAIL, 0 maker FAIL, 0 STOPPED.
- **yuna-warrior** (5 slots): 1 judge PASS, 4 judge FAIL, 0 maker FAIL, 0 STOPPED.
### Paine

- **paine-dark-knight** (3 slots): 2 judge PASS, 1 judge FAIL, 0 maker FAIL, 0 STOPPED.
- **paine-warrior** (5 slots): 2 judge PASS, 3 judge FAIL, 0 maker FAIL, 0 STOPPED (method run, 2026-09-26).
- **paine-black-mage** (2 slots): 1 judge PASS, 0 judge FAIL, 1 maker FAIL, 0 STOPPED.
- **paine-gunner** (6 slots): 3 judge PASS, 2 judge FAIL, 0 maker FAIL, 1 STOPPED.
- **paine-white-mage** (6 slots): 1 judge PASS, 3 judge FAIL, 0 maker FAIL, 2 STOPPED.
### Rikku

- **rikku-alchemist** (2 slots): 1 judge PASS, 1 judge FAIL, 0 maker FAIL, 0 STOPPED.
- **rikku-dark-knight** (1 slots): 0 judge PASS, 1 judge FAIL, 0 maker FAIL, 0 STOPPED.
- **rikku-thief** (5 slots): 3 judge PASS, 0 judge FAIL, 0 maker FAIL, 2 STOPPED (body-height gate, 2026-09-26).
- **rikku-black-mage** (4 slots): 1 judge PASS, 1 judge FAIL, 0 maker FAIL, 2 STOPPED.
- **rikku-gunner** (4 slots): 3 judge PASS, 1 judge FAIL, 0 maker FAIL, 0 STOPPED.
- **rikku-white-mage** (5 slots): 2 judge PASS, 3 judge FAIL, 0 maker FAIL, 0 STOPPED.

## Slot table

| slot | status | pick | judge score | residuals (short) |
|---|---|---|---|---|
| yuna-dark-knight/cast | judge FAIL | cand-4.png | FAIL 6.88 | Open hand raised, sword low: the cast reads. Worst: costume (5). The Dark Knight kit is mostly gone: no blue pauldrons or gauntlets, a gold corset panel over the bodice, one leg i… |
| yuna-dark-knight/ko | judge FAIL | cand-3.png | FAIL 6.69 | Down on her side, head right, eyes shut: reads as down. Worst: costume (5). No pauldrons and no armoured greaves (both feet in pink stockings, one with a black ankle cuff), a bare… |
| yuna-dark-knight/victory | STOPPED |  |  | FAIL twice, STOPPED (rule 15): try b's weighted armour words painted whole armoured knights around her (cand 6-8) or a detached helm and giant pauldrons (cand 5); the slot stays e… |
| paine-dark-knight/cast | judge PASS | cand-2.png | PASS 7.19 | Gauntlet raised open, sword low: the cast reads. Black spiked plate, dark cape with red lining and a red sash. The sword is a red-orange engraved blade: slimmer than the idle's sl… |
| paine-dark-knight/ko | judge PASS | cand-1.png | PASS 7.06 | On her side, head right, eyes shut, gauntlet under her head, black plate, red sash, clear of every edge: it reads as down. Worst: seams (6.5). The sword is two pieces that do not … |
| paine-dark-knight/victory | judge FAIL | cand-1.png | FAIL 6.88 | Hand on hip, smirk and heavy spiked plate: a victory stance. Worst: costume (5.5). The idle's greatsword is a short blade held low and nearly hidden, so at battle size she carries… |
| rikku-alchemist/attack | judge PASS | cand-4.png | PASS 7.12 | Flask thrust toward the enemy reads at game size. Worst: costume (only one flame strip left, at the hip, idle has them down both legs; boots blue with black flaps not green cuffs;… |
| rikku-alchemist/ko | judge FAIL | cand-3.png | FAIL 6.81: game read | Cheek pillowed on her forearm reads as asleep rather than fallen; flame strips spread under her as an orange-yellow mat, flask a pink blob at the chest. |
| paine-warrior/attack | judge PASS (method) | method cand-7-comp.png | PASS 7.12 | Two-handed thrust at the enemy, one sword (the idle's own). Worst: hands, costume and seams (6.5): a flat unshaded red rod between the fists, the sword about 0.75 of the idle's at game size, one red strap per boot. Head-match scale 1.21, lunge stature 0.85. |
| paine-warrior/cast | judge PASS (method) | method cand-8-comp.png | PASS 7.00 (exactly on the bar) | Open palm raised, sword trailing from the low fist; the crest is the closest to the idle's. Worst: costume (6): bare hands (no black elbow gloves), sheer thighhighs. Seam: the grip butts into a bare fist, and the sword is about 0.72 of the idle's. Scale 1.09, stature 0.83. |
| paine-warrior/item | judge FAIL (method) | method cand-4-comp.png | FAIL 6.81 | The method fixed the giant unheld blade: the sword rests point-down in her fist at the right size (0.94). Worst: identity (5.5): a pointed elf ear shows even at battle size, a bob instead of the crest, and blue-violet scaled hip pouches. The pass-2 entry for the earlier cand-4 (6.75) is kept in judge2.json. |
| paine-warrior/hurt | judge FAIL (method) | method cand-9-comp.png | FAIL 5.75 | Worst: hands (5): the sword hand is a malformed pale block and the pommel only touches it. Lavender hair, a red stroke down the neck, a hip pouch and glyphs on the boots. Planted upright, the sword reads as a cane with a wince, not a hit. |
| paine-warrior/ko | judge FAIL (method) | method cand-4-comp.png | FAIL 6.56 | On her back with the sword dropped by her open hand: one sword, reads as down. Worst: costume (5.5): many red studded straps, a white zigzag fringe for the corset, block heels. The face is hidden (only the underside of the jaw shows), and the plank-straight body reads as levitating. |
| rikku-dark-knight/ko | judge FAIL | cand-8 | FAIL (all try-a candidates guard-rejected for tou… | Judge pass covered the try-a set only; try-a had no candidate to score because every frame touched an edge. See the looker's try-b PASS on cand-8 in looks.json (not separately re-… |
| rikku-thief/attack | STOPPED (body gate) |  |  | Try c (no big-head forcing) failed too: best cand-10 6.94, the lunge at the enemy and a normal head land, but the near fist holds a fan of three blades. Third failure, rule 15. |
| rikku-thief/cast | STOPPED (body gate) |  |  | Try c failed too: cand-10 6.94 (pale skin, big blue sickles), cand-11 6.88 (a green smear under one eye). Third failure, rule 15. |
| rikku-thief/hurt | judge PASS (body gate) | try c cand-11.png | PASS 7.06 (narrow) | The recoil reads, one small dagger per hand, normal head (0.56 of the idle's at body scale 1.18). Worst: costume (5.5): orange forearm guards, ruffle cuffs not puffy sleeves, plain white boots. |
| rikku-thief/item | judge PASS (body gate) | round 1 cand-3.png | PASS 7.38 | Bottle held out, puffy sleeves with yellow bows, bare tan legs (head 0.67 at body scale 1.24). Worst: the low hand has no dagger, mismatched star boots. The try b cand-8 fails (6.94; head 0.94). |
| rikku-thief/victory | judge PASS (body gate) | round 1 cand-3.png | PASS 7.44 | Hand raised, grin, the idle's small orange dagger gripped low, puffy sleeves with bows (head 0.56 at body scale 1.21). Worst: lighter tan, one shin red-orange, mismatched boots. |
| paine-black-mage/hurt | maker FAIL |  |  | FAIL: Three of four filled the canvas; c3's staff is the wrong weapon and is held up like a banner, which reads as a cheer rather than a hit. Lower the staff, weight the claw staf… |
| paine-black-mage/ko | judge PASS | cand-1.png | PASS 7.00 | On her side, head right, eyes shut, a gloved hand on the staff lying the full width in front of her. The silver claw head with its red orb is close to the idle's claw staff. The f… |
| paine-gunner/attack | judge PASS | cand-1.png | PASS 7.00 | A lunge with both guns aimed at the enemy reads at battle size. Head-match scale 1.23, lunge stature 0.94. Worst: costume (5.5). A cropped black jacket over a red bra-like panel l… |
| paine-gunner/cast | judge FAIL | cand-1.png | FAIL 6.94 | Pistol raised high: the cast reads. Worst: costume (5.5). A white chest panel with a red splatter motif (idle: red panel on black). Heeled thigh boots with red bows (idle: knee bo… |
| paine-gunner/item | judge PASS | cand-8.png | PASS 7.25 | The pink flask is held out at chest height and a black handgun is held low at her side. The spiked silver crest is the nearest to the idle's in the set. Stern red eyes, black off-… |
| paine-gunner/hurt | STOPPED |  |  | FAIL (stops, rule 15): The b tweak (weighted lean-back, a handgun in each hand, black knee boots, cannon/scythe/red leg armour negated) did not land: the two guard-ok frames carry… |
| paine-gunner/ko | judge FAIL | cand-4.png | FAIL 6.88 | On her side, head right, eyes shut, clear of the edges; the black top, red belt and thigh straps are hers. Worst: costume (5.5): there is no gun anywhere in the frame (the idle ca… |
| paine-gunner/victory | judge PASS | cand-4.png | PASS 7.38 | The closest to the idle of any Paine gunner frame. A red revolver is raised, the second red revolver hangs low in the other hand, and she smiles. Black off-shoulder top with a red… |
| paine-white-mage/attack | STOPPED |  |  | FAIL (stops, rule 15): c6 and c7 no longer fill the canvas (stature not measured), but the other named fixes fail: every candidate still shows bare legs under the robe (the named … |
| paine-white-mage/cast | judge PASS | cand-2.png | PASS 7.12 | Open hand raised beside the staff head; the other hand grips the shaft. The cast reads, and she keeps the hood, the gold chest crescent, brown belts, orange hem panels and the dar… |
| paine-white-mage/item | STOPPED |  |  | FAIL (stops, rule 15): The b tweak cleared the scenery, discs and second staff of try a, but the slot's named fix, the bottle at chest height (weighted 1.3), is absent in all four… |
| paine-white-mage/hurt | judge FAIL | cand-4.png | FAIL 6.62 (scale gate) | Head thrown back, one eye shut: the recoil reads. Scale gate FAIL: the head is too big for the body. Eye to chin is about 50 px on an 754 px figure (idle: 35 on 1055), so at head-… |
| paine-white-mage/ko | judge FAIL | cand-1.png | FAIL 6.94 | On her front, head right, eyes shut, face clean, hood up, a gloved hand on the staff. Worst: costume (5.5). The crescent emblem moved from the chest to the hood, and there is no l… |
| paine-white-mage/victory | judge FAIL | cand-1.png | FAIL 6.94 (scale gate) | Hand on hip, calm smile, hood up, gold chest crescent, brown belt: a victory stance. Scale gate at the edge: eye to chin 36.5 px, so at head-match scale 0.96 she stands 0.74 of th… |
| rikku-black-mage/item | STOPPED |  |  | FAIL (stops, rule 15): the hair fix landed (c6, c8), but the same gap as try a is still there: no candidate combines one gripped staff with a bottle at chest height; c6 has the bo… |
| rikku-black-mage/hurt | STOPPED |  |  | FAIL (stops, rule 15): framing is fixed (three full-body, guard-ok frames, no second head), but the named faults come back: the staff splits in two (c6), the hat is gone (c5), or … |
| rikku-black-mage/ko | judge PASS | cand-4.png | PASS 7.12 | Face-down, eyes shut, hat on, fishnet sleeve, pink warmer; staff lies flat beside her with the orange claw head clear, the fall reads. Worst: anatomy (only one lower leg reads at … |
| rikku-black-mage/victory | judge FAIL | cand-2.png | FAIL 6.94: game read | Reads at game size as the idle's stance with a grin; the swap barely registers as a victory. Staff a thin rod with a small plain hook head ending at her knee (idle: an ornate oran… |
| rikku-gunner/attack | judge PASS | cand-4.png | PASS 7.12 | Two blue-gold pistols stacked and aimed at the enemy, normal head, kit reads (bandana, braids, pink scarf, crop top, denim shorts, camo sleeve). Worst: costume (baggy blue leg war… |
| rikku-gunner/item | judge PASS | cand-4.png | PASS 7.38 | The best Rikku frame in the batch: green bulb bottle held out by the neck, blue pistol gripped low, white crop top, short pink scarf, tall pale-blue boots. Worst: costume (a large… |
| rikku-gunner/hurt | judge FAIL | cand-3.png | FAIL 6.81: hands | At 3x the screen-left hand is missing (barrel grows straight out of the cuff past a sliver of skin); the other hand clasps a blue cylinder with no grip or trigger (both guns read … |
| rikku-gunner/ko | judge PASS | cand-3.png | PASS 7.06 (narrow) | Clean face, eyes shut; tall blue buckled boots, denim shorts, camo sleeve match the idle; head now about 1.2x the idle's (round 1 was 1.8x). Worst: game read (head rests on the fo… |
| rikku-white-mage/cast | judge PASS | cand-3.png | PASS 7.25 | Raised hand really grips one upright staff (fingers wrap it at 2x); cast reads clearly at game size. Worst: costume (white coat flares into a wide orange-pink-purple cape, the spa… |
| rikku-white-mage/item | judge FAIL | cand-1.png | FAIL 6.81: hands | At 3x the flask hand is a malformed pale blob with wedge fingers under the flask; the flask hangs from the staff rather than being held out. |
| rikku-white-mage/hurt | judge FAIL | cand-4.png | FAIL 6.88 | Wince (one eye shut, teeth set) and arms flung out: the hurt reads, moderately. Worst: costume (5.5). The staff is a thin blue spear with an orange arrowhead (idle: orange spade w… |
| rikku-white-mage/ko | judge FAIL | cand-5.png | FAIL 6.88 | On her side, head right, eyes shut, legs together, the staff lying from her feet to her head: the named faults are fixed. Worst: game read and costume (6.5 and 6). Her cheek rests… |
| rikku-white-mage/victory | judge PASS | cand-1.png | PASS 7.06 | Grin and hand on hip; the staff is planted and gripped loosely by the other gloved hand. Bandana, braids, red scarf, orange top, green belt, white apron skirt, and the white coat … |
| yuna-songstress/cast | judge PASS | cand-2.png | PASS 7.31 | Raised microphone and hand-on-hip read clearly at battle size; clean face, teal drop earrings, heterochromia, open smile. Worst: hands (2x muddle of orange/white strokes on the ra… |
| yuna-songstress/hurt | judge FAIL | cand-6.png | FAIL 6.69: costume (5.5), the sash became a gown … | Tall brown knee boots from try b landed, face clean (one eye shut, mouth open), teal drop earring. The sash grew into a floor-length train fanning on both sides, reading as a slit… |
| yuna-songstress/ko | judge PASS | cand-1.png | PASS 7.00 (exactly on the bar) | Reads as down at any size; clean face (eyes shut, gloved hand under the chin), mic by the other hand, pink thighhighs, no wrong prop. Worst: edges (a pale blue/pink floor smear un… |
| yuna-songstress/victory | judge PASS | cand-6.png | PASS 7.38 | Best face of the batch: eye colours on the idle's own sides, auburn hair, teal drop earrings, open grin; one mic and one open hand read as a clear cheer. Worst: costume (legs oran… |
| yuna-warrior/attack | judge FAIL | cand-8.png | FAIL 6.75: costume (5) | Good face (determined look, heterochromia on the idle's sides, hood down), one sword clear of the edges. Skirt is a full flared bell skirt not the idle's long straight slit skirt;… |
| yuna-warrior/cast | judge FAIL | cand-1.png | FAIL 6.94: identity (6), no heterochromia | Raised-arm cast reads, sword held low with the crossguard clear. Both eyes are the same teal (no heterochromia; the maker's note it was 'not clear at this size' was wrong, it is a… |
| yuna-warrior/item | judge FAIL | cand-1.png | FAIL 6.94: hands (6), the sword is not held | Bottle held out at chest height reads well, hood down. The 'sword hand' the maker described is actually open and empty, pointing down; the hilt rests unheld at her hip against the… |
| yuna-warrior/hurt | judge PASS | cand-7.png | PASS 7.19 | Real recoil (torso and head thrown back, one eye shut, mouth open, free arm flung out); kimono sleeves and long blue skirt hold, boots mismatched tan/brown as in the idle; sword c… |
| yuna-warrior/ko | judge FAIL | cand-2.png | FAIL 6.88: edges (6.5), pink floor streaks | Lies on her side, eyes shut, hood down, sword beside her not under her, clear of every edge. A pink smear under the torso and a detached pink streak below the grip. Sword has no c… |
