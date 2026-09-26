# Pose round 2 (FFX-2 only): Round 2 results

**Agent looks and agent judge, not Bailey.** Nothing installed to `public/art`; nothing
committed changes `docs/target/approved-hashes.json` or `judge-locked-hashes.json`.
This section is generated from `looks.json` (try a and try b, the "agent look" pass)
and `judge2.json` (the agent judge's scored pass against the round 1 rubric, mean >= 7.0
to pass); see `make-sheets2.py results` for the per-girl `sheet2-<id>.jpg` picture sheets.

Counts across the 55 worklist slots: **21 PASS** (judge or, where not yet judged, the
looker's PASS), **15 FAIL**, **7 STOPPED** (failed try b, rule 15: no third try),
**12 not looked at yet** (all six `paine-gunner` and all six `paine-white-mage` slots).

## Per-girl, for Bailey

- **Yuna:** dark knight (3/3 looked, not yet judged, all weak PASS on the look) is ready
  for a judge pass. Songstress and warrior (9 slots, all judged): 5 PASS
  (songstress cast/ko/victory, warrior hurt) and 4 FAIL (songstress hurt, warrior
  attack/cast/item, warrior ko) stay on the idle; every fail is close (6.7-6.9) with a
  named, fixable residual (see the table). No Yuna slot is stopped except
  dark-knight/victory (both tries painted whole armoured knights or a floating helm).
- **Rikku:** 21/21 slots looked, 15 judged. 8 PASS on the judge (alchemist attack,
  black-mage ko, gunner attack/item/ko, white-mage cast, thief item), the rest stay on
  the idle. 7 slots are STOPPED under rule 15 (all 5 thief slots but item, plus
  black-mage item and hurt) and do not get a third try. The scale-gate finding needs
  Bailey's answer to JUDGE.md Question 1 (the idle's head is drawn about 1.9x the size
  of every other Rikku pose) before spending more tries on the thief slots that are
  still open on content once the gate closes.
- **Paine:** dark knight (3/3) and warrior/item and black-mage/ko (5 slots) are agent-look
  PASS, not yet judged. Warrior attack/cast/hurt/ko and black-mage/hurt (5 slots) FAIL
  on the look and stay on the idle. Gunner and white-mage (12 slots) have not been
  looked at yet.

## Slot table

| slot | status | pick | judge score | residuals (short) |
|---|---|---|---|---|
| yuna-dark-knight/cast | PASS (agent look, not yet judged) | cand-4.png | not judged yet | PASS, weak: cand-4 (open hand raised, sword low in the other hand, crested teal helm, blue bodice, cape); cand-1 and cand-2 raise the SWORD in the raised hand; far leg armoured blue, near leg pink thi |
| yuna-dark-knight/ko | PASS (agent look, not yet judged) | cand-3.png | not judged yet | PASS, weak: cand-3 (down on her side, head right, eyes shut, crested helm, pink thighhighs, sword beside her); midriff bare and one boot missing; rendered on the 1216x832 ko canvas before the switch t |
| yuna-dark-knight/victory | STOPPED |  |  | FAIL twice, STOPPED (rule 15): try b's weighted armour words painted whole armoured knights around her (cand 6-8) or a detached helm and giant pauldrons (cand 5); the slot stays empty |
| paine-dark-knight/cast | PASS (agent look, not yet judged) | cand-2.png | not judged yet | PASS: cand-2 (open hand raised, red sword low, black plate, dark cape with red lining, swept silver hair); cand-1 also reads. The sword is slimmer than the idle's slab |
| paine-dark-knight/ko | PASS (agent look, not yet judged) | cand-1.png | not judged yet | PASS: cand-1 (down on her side, head right, eyes shut, black armour, red sash, sword beside her, clear of every edge). cand 2-4 came out as close-ups that fill the 1344x768 frame (ko framing words add |
| paine-dark-knight/victory | PASS (agent look, not yet judged) | cand-1.png | not judged yet | PASS: cand-1 or cand-2 (hand on hip, sword planted point-down, black plate, dark cape, no poleaxe, no ponytail); cand-3 red cape, cand-4 a blue blade |
| rikku-alchemist/attack | PASS | cand-4.png | PASS 7.12 | Flask thrust toward the enemy reads at game size. Worst: costume (only one flame strip left, at the hip, idle has them down both legs; boots blue with black flaps not green cuffs; a large brown satche |
| rikku-alchemist/ko | FAIL | cand-3.png | FAIL 6.81: game read | Cheek pillowed on her forearm reads as asleep rather than fallen; flame strips spread under her as an orange-yellow mat, flask a pink blob at the chest. |
| paine-warrior/attack | FAIL |  |  | FAIL: No candidate both reads as an attack and carries the named ornate red longsword; two of four touch the edges. |
| paine-warrior/cast | FAIL |  |  | FAIL: The named fix (a single sword, not floating) fails: the sword floats (c1), multiplies (c2) or is raised in the cast hand (c3, c4). |
| paine-warrior/item | PASS (agent look, not yet judged) | cand-4.png | not judged yet | PASS, weak: cand-4 (cand-4 meets every named fix (bottle at chest height, black boots and jacket, no cape, no silver blade). Residuals: the sword is oversized and stands behind her without a grip, the |
| paine-warrior/hurt | FAIL |  |  | FAIL: Three of four are edge rejects with extra blades; c1 has a floating sword plus a sheath and a second hilt (the rubric's extra-weapon fault). |
| paine-warrior/ko | FAIL |  |  | FAIL: All four are guard rejects on the edges (the named fault is not fixed); the sword grows past the canvas every time. |
| rikku-dark-knight/ko | FAIL |  | FAIL (all try-a candidates guard-rejected for touching the canvas edge; try b cand-8 later passed the look, see looks.json) | Judge pass covered the try-a set only; try-a had no candidate to score because every frame touched an edge. See the looker's try-b PASS on cand-8 in looks.json (not separately re-judged in this pass). |
| rikku-thief/attack | STOPPED |  |  | FAIL (stops, rule 15): the head fix took (c7 is inside the gate) and the facing is fixed, but the only candidate with both loses the bandana, the puffy sleeves and the green skirt; c6 keeps more of he |
| rikku-thief/cast | STOPPED |  |  | FAIL (stops, rule 15): the head factor now works (c5-c7 inside the gate), but the other named fixes do not land: no candidate has the short curved second dagger, the puffy sleeves or bare tan legs wit |
| rikku-thief/hurt | STOPPED |  |  | FAIL (stops, rule 15): the guard rejected all four; the big-head/from-above words turned every render into a canvas-filling close-up, and two of them have a second head. |
| rikku-thief/item | PASS | cand-8.png | PASS (narrow, try b) | The Thief item scale gate now passes numerically after try b, but the eye spacing and hair mane keep the head reading larger than the idle at game size. |
| rikku-thief/victory | STOPPED |  |  | FAIL (stops, rule 15): the scale gate is fixed (c5 and c7 about 1.0), but c5 swaps the dagger for a large hook and c7 brings back a rainbow streamer; neither has the idle's two small daggers. |
| paine-black-mage/hurt | FAIL |  |  | FAIL: Three of four filled the canvas; c3's staff is the wrong weapon and is held up like a banner, which reads as a cheer rather than a hit. Lower the staff, weight the claw staff, shrink the hat. |
| paine-black-mage/ko | PASS (agent look, not yet judged) | cand-1.png | not judged yet | PASS: cand-1 (cand-1 fixes all three named faults (staff inside the frame, no shadow, hat purple not blue). Residuals: the hat brim is red underneath, and the staff head is a claw hook rather than the |
| paine-gunner/attack | not looked at |  |  |  |
| paine-gunner/cast | not looked at |  |  |  |
| paine-gunner/item | not looked at |  |  |  |
| paine-gunner/hurt | not looked at |  |  |  |
| paine-gunner/ko | not looked at |  |  |  |
| paine-gunner/victory | not looked at |  |  |  |
| paine-white-mage/attack | not looked at |  |  |  |
| paine-white-mage/cast | not looked at |  |  |  |
| paine-white-mage/item | not looked at |  |  |  |
| paine-white-mage/hurt | not looked at |  |  |  |
| paine-white-mage/ko | not looked at |  |  |  |
| paine-white-mage/victory | not looked at |  |  |  |
| rikku-black-mage/item | STOPPED |  |  | FAIL (stops, rule 15): the hair fix landed (c6, c8), but the same gap as try a is still there: no candidate combines one gripped staff with a bottle at chest height; c6 has the bottle but an unheld st |
| rikku-black-mage/hurt | STOPPED |  |  | FAIL (stops, rule 15): framing is fixed (three full-body, guard-ok frames, no second head), but the named faults come back: the staff splits in two (c6), the hat is gone (c5), or the staff is raised ( |
| rikku-black-mage/ko | PASS | cand-4.png | PASS 7.12 | Face-down, eyes shut, hat on, fishnet sleeve, pink warmer; staff lies flat beside her with the orange claw head clear, the fall reads. Worst: anatomy (only one lower leg reads at 2x, torso short). |
| rikku-black-mage/victory | FAIL | cand-2.png | FAIL 6.94: game read | Reads at game size as the idle's stance with a grin; the swap barely registers as a victory. Staff a thin rod with a small plain hook head ending at her knee (idle: an ornate orange head, planted); st |
| rikku-gunner/attack | PASS | cand-4.png | PASS 7.12 | Two blue-gold pistols stacked and aimed at the enemy, normal head, kit reads (bandana, braids, pink scarf, crop top, denim shorts, camo sleeve). Worst: costume (baggy blue leg warmers replace the idle |
| rikku-gunner/item | PASS | cand-4.png | PASS 7.38 | The best Rikku frame in the batch: green bulb bottle held out by the neck, blue pistol gripped low, white crop top, short pink scarf, tall pale-blue boots. Worst: costume (a large lavender satchel wit |
| rikku-gunner/hurt | FAIL | cand-3.png | FAIL 6.81: hands | At 3x the screen-left hand is missing (barrel grows straight out of the cuff past a sliver of skin); the other hand clasps a blue cylinder with no grip or trigger (both guns read as tubes, round 1's g |
| rikku-gunner/ko | PASS | cand-3.png | PASS 7.06 (narrow) | Clean face, eyes shut; tall blue buckled boots, denim shorts, camo sleeve match the idle; head now about 1.2x the idle's (round 1 was 1.8x). Worst: game read (head rests on the forearm like a nap, no  |
| rikku-white-mage/cast | PASS | cand-3.png | PASS 7.25 | Raised hand really grips one upright staff (fingers wrap it at 2x); cast reads clearly at game size. Worst: costume (white coat flares into a wide orange-pink-purple cape, the spade head is heart-cut  |
| rikku-white-mage/item | FAIL | cand-1.png | FAIL 6.81: hands | At 3x the flask hand is a malformed pale blob with wedge fingers under the flask; the flask hangs from the staff rather than being held out. |
| rikku-white-mage/hurt | PASS (agent look, not yet judged) | cand-4.png | not judged yet | PASS, weak: cand-4 (No longer a cheer: the staff is not thrust straight up and there are no zigzag sleeves. The only candidate the guard passed. Residuals: the staff tip still rises above her head, th |
| rikku-white-mage/ko | PASS (agent look, not yet judged) | cand-5.png | not judged yet | PASS: cand-5 (the two named faults, the knee-up leg and the wrong staff head, are both fixed: legs together and down, and the crescent-cut spade staff lying beside her head.) |
| rikku-white-mage/victory | PASS (agent look, not yet judged) | cand-1.png | not judged yet | PASS, weak: cand-1 (One staff, not over the shoulder, and no blue shadow streak. Residuals: the staff has a plain spear head (idle: orange spade), her hand near the shaft is not clearly gripping it, a |
| yuna-songstress/cast | PASS | cand-2.png | PASS 7.31 | Raised microphone and hand-on-hip read clearly at battle size; clean face, teal drop earrings, heterochromia, open smile. Worst: hands (2x muddle of orange/white strokes on the raised fist). Costume r |
| yuna-songstress/hurt | FAIL | cand-6.png | FAIL 6.69: costume (5.5), the sash became a gown train | Tall brown knee boots from try b landed, face clean (one eye shut, mouth open), teal drop earring. The sash grew into a floor-length train fanning on both sides, reading as a slit ball gown; frame 823 |
| yuna-songstress/ko | PASS | cand-1.png | PASS 7.00 (exactly on the bar) | Reads as down at any size; clean face (eyes shut, gloved hand under the chin), mic by the other hand, pink thighhighs, no wrong prop. Worst: edges (a pale blue/pink floor smear under the boots and a f |
| yuna-songstress/victory | PASS | cand-6.png | PASS 7.38 | Best face of the batch: eye colours on the idle's own sides, auburn hair, teal drop earrings, open grin; one mic and one open hand read as a clear cheer. Worst: costume (legs orange/red-orange to the  |
| yuna-warrior/attack | FAIL | cand-8.png | FAIL 6.75: costume (5) | Good face (determined look, heterochromia on the idle's sides, hood down), one sword clear of the edges. Skirt is a full flared bell skirt not the idle's long straight slit skirt; bare legs and navy l |
| yuna-warrior/cast | FAIL | cand-1.png | FAIL 6.94: identity (6), no heterochromia | Raised-arm cast reads, sword held low with the crossguard clear. Both eyes are the same teal (no heterochromia; the maker's note it was 'not clear at this size' was wrong, it is absent). Earrings dark |
| yuna-warrior/item | FAIL | cand-1.png | FAIL 6.94: hands (6), the sword is not held | Bottle held out at chest height reads well, hood down. The 'sword hand' the maker described is actually open and empty, pointing down; the hilt rests unheld at her hip against the obi, so the sword is |
| yuna-warrior/hurt | PASS | cand-7.png | PASS 7.19 | Real recoil (torso and head thrown back, one eye shut, mouth open, free arm flung out); kimono sleeves and long blue skirt hold, boots mismatched tan/brown as in the idle; sword continuous and gripped |
| yuna-warrior/ko | FAIL | cand-2.png | FAIL 6.88: edges (6.5), pink floor streaks | Lies on her side, eyes shut, hood down, sword beside her not under her, clear of every edge. A pink smear under the torso and a detached pink streak below the grip. Sword has no crossguard (a gold bow |
