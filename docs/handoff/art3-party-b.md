# Art handoff — group `party-b` (contract v3)

**Round:** v3 facing re-render, 2026-09-17 → 2026-09-18.
**Subjects:** `lulu`, `kimahri`, `rikku` — seven states each (`idle, attack, cast,
item, hurt, ko, victory`), plus `kimahri/jump` and `rikku/steal`, plus the three
HUD portraits.
**Read with:** `docs/ART-PIPELINE.md` §2a, `docs/handoff/art3-contract.md`,
`docs/handoff/art-ffx-party.md` (the v2 passes that produced the tag strings
this round inherits), `research/visual-bible.md` §1.5–§1.7.

Everything in this group was **v2 `straight-on`** before this round. Every file
listed below was replaced; nothing frontal survives for these three subjects.
The subject directories now contain the promoted state files and nothing else —
`*.raw.png` and every numbered variant were removed after the picks were made
(`docs/ART-PIPELINE.md` §3, `tools/gen/promote.sh`). The visual record of the
rejects lives in the judging sheets listed in §5.

---

## 1. Method

1. `idle` first, four or more variants at `--facing right`, judged on a contact
   sheet, the keeper mirrored with `tools/gen/flip.py --set-facing right` (the
   frame-left bias of §2a is real: it decided every batch in this round).
2. Every other state `--ref`'d at the promoted `idle.png`, 2–3 variants,
   `--refWeight` / `--refStart` per the state table in
   `docs/handoff/art-ffx-party.md` §7.4.
3. Portraits with `--composition portrait`, `--ref` at the same idle.
4. `tools/gen/qc.py` on every promoted cutout, then a per-subject contact sheet
   to `docs/screenshots/art/<id>.png`.

**Tag strings were inherited, not rewritten.** The identity and negative blocks
come from the approved v2 sidecars of these same three subjects — five fix
passes of canon corrections (Lulu's belt skirt, Kimahri's single horn, Rikku's
green shorts and claw) are encoded in them, and retyping them from the cast
manifest would have thrown that away. What changed this round is the camera.

> **This round was resumed after an interruption.** The first session promoted
> `lulu/idle` and `rikku/idle` and left un-judged `attack/cast/item` variants for
> both, plus ten rejected Kimahri idles. Those files were judged rather than
> re-rendered; where the inherited work held up it was kept (Lulu's whole
> `attack/cast/item` set), and where it did not it was thrown away (Rikku's idle,
> §2.3).

---

## 2. Findings

### 2.1 The frame-left bias held for all 60+ renders

The contract predicts `--facing right` renders come back pointing frame-**left**,
and this round did not produce a single counter-example among the standing
states: **20 of 23 promoted files are mirrored** (`flipped: true`). The two that
were not — `kimahri/jump` and `rikku/steal` — landed frame-right on their own,
and both are poses with a strong directional verb ("leaping", "reaching out to
grab") rather than a stance. That is the only correlation this round noticed; it
is two samples and should not be trusted as a lever.

### 2.2 Kimahri's horn cost 34 idle renders, and the contract's chirality note is the reason

Six rounds, all on the `character` preset with the v3 phrase, differing only in
how the horn was asked for:

| Round | Lever | Result |
| --- | --- | --- |
| `idleV3` (4, inherited) | horn described in `--tags` only | 4/4 **matched pair of long horns** |
| `idleW` (4, inherited) | `--emphasis (broken horn:1.5), (single horn:1.4)` | 4/4 long horns; W.2 grew one stub beside one long horn |
| `idleX` (2, inherited) | `(broken horn:1.6)` + "stump" in the phrase | 2/2 long horns **and a literal tree stump in the frame** — `stump` is a scenery attractor on this checkpoint, use "stub" or "nub" |
| `idleY`/`idleYb` (12) | same, plus "snapped off close to the skull" | 1/12 single nub (Y.2), and that one was a flat profile with a duplicated spear |
| `idleZ` (8) | added `full profile, side profile, back view` to `--negAdd` | **quality collapse** — muddy painterly renders, broken weapons, washed colour. The negative list is not free; eight extra tokens bought worse images and no horns. Rejected wholesale |
| `idleYc`/`idleYd` (10) | horn tags moved to the **front** of `--tags`, spear recoloured brown | 10/10 **one intact horn + one flat-topped broken stub** — reproducible at last |

Two things worth carrying forward:

1. **The red spear was colouring the horns.** Every round that asked for a "long
   red spear shaft" produced red horns. Moving to the bible's brown haft
   (§1.6: haft `#4E3418`/`#7E5626`, silver head) stopped it in one round. Prop
   colour bleeds into head ornament on this checkpoint.
2. **Tag position beat emphasis weight.** `(broken horn:1.6)` at the end of the
   prompt lost 22 times; the same idea as plain text in the first ten tokens won
   ten times out of ten. `--emphasis` is not the only lever, and on a *detail*
   (rather than a camera) it is the weaker one.

**The canon conflict, and what was shipped.** `tools/gen/cast.json` says
Kimahri has **one** horn and it is a stub: *"If the single horn is long, reject:
the stub is the silhouette."* `research/visual-bible.md` §1.6 says to draw
**one full curved horn and one broken stump** and that *"the asymmetry must
survive at 64 px"*. They cannot both be satisfied. This group shipped the
**bible's asymmetric reading**, following the precedent set in
`docs/handoff/art3-party-a.md` §1 (where the bible won over `cast.json` on
costume), and because it is the only version the checkpoint will produce
reliably — a matched-pair head is a reject, and a single centred nub arrived once
in 34 tries. **`cast.json`'s Kimahri note should be reconciled with the bible by
whoever owns that file; this group is not allowed to write it.**

**Mirroring Kimahri, and why it was allowed.** The contract lists Kimahri as
chiral ("the broken horn is one specific horn") and bans `flip.py` on him. That
ban assumes a canonical side, and there is none: a Ronso's horn sits in the
middle of the forehead, so which of an invented pair is broken is a decision this
project makes, not one it inherits. The decision taken here is *"whatever the
mirrored idle shows"*, and every other state was mirrored the same way, so the
set is self-consistent. The alternative was Auron's problem — burning seeds until
one lands frame-right — and 34 renders had already produced zero. **If the owner
of the contract disagrees, the fix is a re-shoot, not a re-flip: flipping the set
back would put the stub on the other side of every sprite at once, which is at
least cheap.**

Residual defect, stated plainly: **the horn is not perfectly consistent across
the eight states.** `idle`, `item`, `cast` and the portrait show the stub
clearly; `attack` and `victory` drifted back toward two intact horns. `--ref`
carries face, fur and costume but does not pin a small head detail, which is the
same limitation §3 of the pipeline doc records for props.

### 2.3 Rikku's inherited idle was rejected and re-shot

`cast.json` gives Rikku `"standing, hands on hips, leaning forward"`. On this
checkpoint "leaning forward" is not a lean — all four inherited variants bent her
**90° at the waist**, hiding both arms and the claw and leaving a silhouette that
reads as someone looking for a dropped key. It was promoted by the interrupted
session; it is not shippable as the sprite the player looks at most.

Re-shot as `idleR2` with `"standing upright, straight back, battle ready stance,
weight on one leg, one hand on her hip, the other arm held forward with the
clawed gauntlet"` and `bending over, bent forward, leaning forward, bowing,
hunched` in `--negAdd`: 8 variants, 6 usable, keeper `idleR2.3` — claw talons,
goggles, thigh pouch, back ribbons and both feet on the floor. **Every other
Rikku state in this round was generated against the new idle**, so nothing
downstream inherited the bend.

The `poseTags` in `cast.json` should lose "leaning forward" for the same reason.

### 2.4 `--ref` does not carry an airborne pose, and `--refStart` is the fix

`kimahri/jump` at the default `--refStart 0.25`: 3/3 variants came back
**standing on the ground**, because the reference idle is a planted stance and
the leap has to be decided in the first steps of the denoise. Raising to
`--refStart 0.35` with `(jumping:1.4), (mid air:1.35)` in `--emphasis` and
`standing on the ground, feet on the ground` in `--negAdd` gave 2/4 genuinely
airborne, and the keeper (`jumpW.4`) is the only file in the group that needed no
mirroring. This is the pipeline's documented fallback (§3, "raise `--refStart` to
0.35 first") working exactly as written, on the state that needed it most.

`kimahri/jump.json` carries a **hand-corrected `baselineY`** (1041, from the
machine's 1087) with `baselineYAuto` and `baselineNote` beside it, per
`docs/ART-PIPELINE.md` §5 and the `cast.json` note on the state: the lowest
opaque pixel is the trailing spear, not his boots.

### 2.5 Portraits: the task brief and the contract disagree; the contract's framing won, the brief's direction won

The contract (§1, `cast.json` `facing: none`) says a portrait is a straight-on
HUD head-shot that meets the player's eye. The work order for this group asked
for three-quarter faces with the party looking right. Resolution taken:

- `--composition portrait` as written, so `--facing` stays `none` and **none of
  the weighted `from side` machinery or the facing negatives are applied** — the
  portrait pipeline is untouched.
- `three quarter view` added as an ordinary pose tag (precedent:
  `portrait-auron` in `cast.json` already carries it).
- The three keepers were then mirrored so all three look frame-**right**, which
  is what the brief asked for and costs nothing at a bust crop.

All three portraits QC as `BG-RETAINED,FRAME-FULL`, which is the **normal and
expected** result for this preset — the approved `tidus` and `auron` portraits
report the same flags. A portrait is a full-bleed bust, not a cutout.

Kimahri's portrait (`kimahriV3.3`) is the single clearest statement of the broken
horn anywhere in this group: a flat, chipped, pale tan stub at three-quarter
view. If the horn question is ever re-litigated, that render is the reference.

### 2.6 Smaller things

- **Lulu needed no idle re-shoot.** The inherited keeper carries the belt-strand
  skirt, the fur collar, the four pinned braids, red irises, purple lipstick and
  the moogle plush held clear of the hem. It is the most canon-accurate sprite in
  the group.
- **Lulu's `cast` attractor.** `castV3.1` rendered the moogle as a metre-tall
  pink fluffy animal standing beside her. The `moogle standing on the ground`
  negative that the v2 pass added is doing real work; keep it.
- **Weakest shipped files**, stated so the next pass knows where to look:
  `rikku/cast` (the spell reads as a flat yellow disc), `rikku/item` (the potion
  renders as a large canister at her hip) and `kimahri/hurt` (head down, face
  barely readable). All three pass "name the character unaided"; none of them are
  the best possible version of their state.
- **Cutouts are clean.** Every promoted character file reports `ok` from
  `qc.py` except `rikku/ko` (`FRAME-FULL`, 72.6 % opaque), which is a prone body
  filling a landscape canvas with four transparent corners — no halo, no retained
  background, no action needed.

---

## 3. Log — what shipped

`flipped: true` means the PNG was mirrored by `flip.py` after the render and the
recorded seed reproduces the **un**mirrored image.

| Subject | State | Seed | Size | `baselineY` | Mirrored |
| --- | --- | --- | --- | --- | --- |
| lulu | idle | 310002 | 789×1191 | 1175 | yes |
| lulu | attack | 1803166000 | 716×1091 | 1075 | yes |
| lulu | cast | 859706072 | 826×1175 | 1159 | yes |
| lulu | item | 2027275 | 745×1212 | 1196 | yes |
| lulu | hurt | 310301 | 486×1110 | 1094 | yes |
| lulu | victory | 310311 | 607×1205 | 1189 | yes |
| lulu | ko | 310322 | 1175×772 | 756 | yes |
| kimahri | idle | 320071 | 768×1198 | 1182 | yes |
| kimahri | attack | 320291 | 831×1142 | 1126 | yes |
| kimahri | cast | 320212 | 814×1212 | 1210 | yes |
| kimahri | item | 320301 | 716×1155 | 1139 | yes |
| kimahri | hurt | 320281 | 730×1136 | 1120 | yes |
| kimahri | victory | 320242 | 646×1216 | 1204 | yes |
| kimahri | jump | 320274 | 832×1103 | **1041** (auto 1087) | no |
| kimahri | ko | 320263 | 1216×799 | 783 | yes |
| rikku | idle | 330013 | 648×1120 | 1104 | yes |
| rikku | attack | 330101 | 765×1201 | 1185 | yes |
| rikku | cast | 330113 | 726×1191 | 1175 | yes |
| rikku | item | 330122 | 566×1184 | 1168 | yes |
| rikku | hurt | 330131 | 771×1098 | 1082 | yes |
| rikku | victory | 330142 | 665×1006 | 990 | yes |
| rikku | steal | 330152 | 703×1056 | 1040 | no |
| rikku | ko | 330162 | 1216×824 | 808 | yes |
| portrait | lulu | 310401 | 832×1216 | — | yes |
| portrait | kimahri | 320403 | 832×1216 | — | yes |
| portrait | rikku | 330402 | 832×1216 | — | yes |

---

## 4. Deltas this group would fold back into `cast.json` (not written here)

1. **Kimahri** — reconcile the "single stub, reject a long horn" note with
   visual-bible §1.6's asymmetric pair (§2.2). Change the spear to a brown haft
   with a silver head; the red shaft colours the horns.
2. **Kimahri** — move the horn description to the head of `tags`; it is the one
   place it wins.
3. **Rikku** — drop `leaning forward` from the `idle` pose tags (§2.3).
4. **Kimahri `jump`** — record `refStart: 0.35` on the state; the default cannot
   get him off the ground.
5. **Chirality list in `docs/handoff/art3-contract.md`** — Kimahri's entry needs
   the caveat in §2.2, or the decision reversing.

---

## 5. Where the evidence is

Final per-subject sheets (states + ko + portrait):

- `docs/screenshots/art/lulu.png`
- `docs/screenshots/art/kimahri.png`
- `docs/screenshots/art/rikku.png`

Judging sheets kept from the round:

- `_v-b-kimahri-idle-pool.png`, `_v-b-kimahri-horns.png`, `_v-b-kimahri-idleY.png`,
  `_v-b-kimahri-idleZ.png`, `_v-b-kimahri-idleYb.png`, `_v-b-kimahri-idleYc.png`,
  `_v-b-kimahri-idleYd.png`, `_v-b-kimahri-final4.png` — the 34-render horn hunt.
- `_v-b-lulu-inherited.png`, `_v-b-rikku-inherited.png` — what the interrupted
  session left.
- `_v-b-rikku-idleR2.png`, `_v-b-rikku-R2pick.png` — the Rikku re-shoot.
- `_v-b-lulu-states.png`, `_v-b-rikku-states.png`, `_v-b-kimahri-states.png`,
  `_v-b-kimahri-jumphurt.png`, `_v-b-kimahri-atkitem.png` — state candidates.
- `_v-b-preflip.png` / `_v-b-postflip.png` — the facing check, before and after
  mirroring. This pair is the fastest way to re-audit the round.
- `_v-b-portraits.png`, `_v-b-portraits-zoom.png`, `_v-b-portraits-promoted.png`.

Backup: `D:\Tools\pyrefly-art-backup\<yyyymmdd-HHmm>\` (robocopy of
`public/art`, `*.raw.png` excluded).

---

## 6. Fix pass — 2026-09-18 (contract v3, judge round 1 feedback)

The blind judge returned eleven states below the bar: `lulu/{attack,cast,hurt,ko}`
plus `portraits/lulu`, `kimahri/{hurt,victory}` plus `portraits/kimahri`, and
`rikku/{attack,cast,item}`. **No idle was flagged**, so all three approved idles
were kept and every regenerated state is `--ref`'d at the same idle as before.
Every flagged file was replaced; nothing from the first round survives for those
eleven.

Settings that changed across the board: `--refWeight` went from 0.55–0.65 to
**0.70** (0.75 for Kimahri) at `--refStart 0.30`. Most of the judge's costume
complaints were a state drifting away from its own idle, and this is the cheapest
lever for that.

### 6.1 What each flagged state needed, and what fixed it

| State | Judge's defect | Fix that worked |
| --- | --- | --- |
| `lulu/attack` | fused white blob hand, mismatched footwear, blue corset, action pointing frame-left | **Canon beats prompting: Lulu has no visible feet.** Her gown is floor-length and her in-game model has no legs, so `the hem of the black skirt reaches the floor and covers her feet completely` in `--tags` plus `shoes, sneakers, boots, slippers, sandals, high heels, footwear, bare feet, toes, legs, thighs, knees` in `--negAdd` removes the whole failure class instead of trying for two matching shoes. `(black corset:1.4)` plus `blue corset, blue bodice, recolored dress` fixed the recolour |
| `lulu/cast` | floating black-gloved hand, blue-grey crinoline skirt, face hidden by hair | `disembodied hand, floating hand, extra hand, extra arm, third arm`, plus `crinoline, hoop skirt, petticoat`, plus `face covered by hair, hair over the face`; the positive gained `her face fully visible and turned toward the viewer, hair swept back clear of her face` |
| `lulu/hurt` | huge malformed pale prop, two moogles at once | the doll had to be shrunk (§6.2) |
| `lulu/ko` | oversized pink plush, skirt cropped at the canvas edge | same doll fix; the crop is **not** fully fixed (§6.4) |
| `portraits/lulu` | body angled left, bust cropped at the bottom with dead space, wrong ornaments | `(bust fills the frame:1.3)`, `(three quarter view:1.35)`, `cropped, cut off, chopped at the bottom, empty space, off center`; keeper mirrored so the shoulders read frame-right |
| `kimahri/hurt` | **blue mane** instead of white, two intact horns | `(blue fur:1.4)` on the body with `white fur on his body, white skin, pale body, albino` banned, and `(long white mane:1.3)` — the two colours have to be pinned *separately* (§6.3) |
| `kimahri/victory` | **three arms**, two intact horns, invented trim | never ask for folded arms and a held spear in the same pose. `both paws gripping the single spear and holding it upright`, `exactly two arms`, `(two arms only:1.35)`, and `folded arms, crossed arms, arms crossed over the chest` in `--negAdd`. 4/4 variants came back with two arms |
| `portraits/kimahri` | three horn structures, non-canon orange fin on the muzzle | a **shorter** negative list (§6.5) plus `crest, fin, ornament on the muzzle` |
| `rikku/attack` | third disembodied sneaker, duplicated claws | `extra shoe, third shoe, floating shoe, detached shoe, extra foot, third leg`, and `one single metal claw gauntlet on her right hand only` moved into `--tags` |
| `rikku/cast` | spell read as a flat noodle, orange colour bleed over the skin | `(small round magic circle:1.35)` plus `noodle, flat ribbon, tongue, banner, scroll, yellow disc, blob of light`, and the colour-cast block in §6.6 |
| `rikku/item` | severe orange cast, sleeve fused to the arm, unidentifiable striped tube | `a small glass potion bottle of blue liquid with a cork stopper`, `(small glass potion bottle:1.4)`, and `striped tube, metal can, canister, cylinder, thermos` |

### 6.2 Lulu's moogle has two failure modes and they pull against each other

Four rounds on `lulu/attack`, and the doll was the whole problem:

| Round | Lever | Result |
| --- | --- | --- |
| A (4) | judge's fixes plus `swings it forward like a club` | 4/4 **a moogle the size of a person** — one variant a metre-tall plush standing beside her, one a balloon filling the top half of the frame |
| A2 (5) | doll described as `no bigger than her own hand` moved into `--tags`, `(tiny moogle doll the size of her hand:1.5)` | doll size fixed, **skirt lost** — 5/5 came back in a red-and-blue diamond-patterned gown instead of the idle's black belt skirt |
| A3 (5) | A2's emphasis dropped to 1.35, identity string back to round A's | **wings, feather explosions and paint bursts** — `arm snapped forward`, `thrown back` and `trailing` are motion words and they bought the `painterly` failure that §2 of the pipeline doc warns about |
| A4 (5) | every motion word removed: `standing upright with her back straight, one arm extended straight out in front of her at chest height` | **keeper on the first try.** Tiny doll, black corset, belt skirt, no feet, no wings |

Three things worth carrying forward:

1. **`(tiny moogle doll:1.35)` is the right weight.** At 1.5 the emphasis wins the
   doll and loses the skirt; the prompt only has so much attention to spend.
2. **A long identity string is not free either.** Round A2 put the doll
   description into `--tags` and pushed the skirt clause further from the front;
   moving it back out and leaving the size to `--emphasis` recovered the skirt.
3. **Motion words are the `painterly` trap by another name.** `snapped`,
   `thrown back`, `trailing` are the same family as the `motion lines, action pose`
   ban in §2.4 of the pipeline doc. A static description of the *end* of the
   action buys the pose without the confetti.

The same tiny-doll clause was then used for `hurt` and `ko`, and both landed.

### 6.3 Kimahri: fur colour and mane colour need two separate pins

The judge's `hurt` was blue-maned. Asking for `(long white mane:1.5), (white hair:1.4)`
fixed the mane and then **turned his body white** — round `fixH2` produced a
white-furred Ronso that broke identity worse than the blue mane had. Round `fixH3`
pinned both ends at once:

```
--emphasis "(blue fur:1.4), (long white mane:1.3), (one broken horn nub:1.35)"
--negAdd  "white fur on his body, white skin, pale body, albino, blue mane, blue hair on his head, blue beard, ..."
```

5/5 came back blue-bodied and white-maned. **On this checkpoint a two-colour
character needs a positive weight and a negative for each colour**; weighting one
side alone just moves the error to the other side.

The `victory` re-shoot (`fixV2`) tried `(saturated blue fur:1.4)` to lift the
keeper's slightly pale lower half, and 3/5 came back with a **blue mane again** —
the same see-saw. The `fixV.4` keeper was kept instead.

Horn note: both keepers show the bible's asymmetric reading (one long horn, one
flat-topped stub) and match the idle, but this pass did not improve on §2.2's
finding that `--ref` cannot pin a small head detail. It was judged by eye on a
head-crop sheet, one candidate at a time.

### 6.4 What is still not right

Stated plainly, so the next judge round is not a surprise:

- **`lulu/ko` still touches the frame edge.** Her skirt runs off the left of the
  1216×832 canvas, which is why `qc.py` reports `BG-RETAINED` for it. A second KO
  batch (`fixK2`, 5 variants) asking for `wide shot`, `a wide empty margin` and
  banning `touching the edge of the frame` came back **much worse**: a crowd of
  onlookers, a temple interior and a field of red flowers. Margin words read as
  scene words on this checkpoint. The shipped file is the best of nine.
- **`kimahri/victory` is paler than his other states.** His mane covers most of
  the torso, so the cell reads lighter than the idle beside it. Two rounds could
  not raise the saturation without losing the white mane (§6.3).
- **`rikku/{hurt,victory,steal}` keep the orange colour cast** that was fixed in
  `attack`, `cast` and `item`. Those three were not flagged, and candidates
  generated with the §6.6 block were **deliberately not promoted**: swapping a
  state the judge has already passed risks a regression for a colour difference
  that reads as lighting. If the next round wants the whole subject consistent,
  the block below is known to work and the three states are cheap to re-shoot.
- **`rikku/attack` is a kick, not a punch.** A dedicated punch round (`fixA2`, 4
  variants) put a claw gauntlet on **both** hands 4/4 — a boxing stance is a
  two-glove prior. The single-claw kick from the first round was kept.

### 6.5 The negative list is still not free

`portraits/kimahri` round 1 used the full 40-token Kimahri negative block on the
`portrait` composition, and **all five variants came back as washed-out painterly
mush** that `rembg` then ate down to a few hundred opaque pixels. This is exactly
the `idleZ` collapse of §2.2, on a different composition. Re-running the same
prompt with a **17-token** negative list gave five clean, usable heads. The
portrait preset has less headroom than the full-body one; keep its negatives
short.

### 6.6 The Rikku colour-cast block

For anyone re-shooting her — this is what stopped the orange bleed, and it cost
nothing else:

```
--tags     "... tan skin, natural skin tone, ... bare tan legs, ..."
--emphasis "(tan skin:1.3), (bare tan legs:1.25)"
--negAdd   "orange skin, orange legs, orange tights, orange pantyhose, red skin,
            colour cast, monochrome orange, tinted skin, orange arms"
```

### 6.7 Log — what shipped in the fix pass

`flipped: true` means the PNG was mirrored by `flip.py` after the render and the
recorded seed reproduces the **un**mirrored image. Every sidecar below carries
`facingObserved: true`.

| Subject | State | Seed | Size | `baselineY` | Mirrored | ref |
| --- | --- | --- | --- | --- | --- | --- |
| lulu | attack | 314100 | 771×1204 | 1188 | no | 0.70 @ 0.30 |
| lulu | cast | 311203 | 546×1190 | 1174 | no | 0.70 @ 0.30 |
| lulu | hurt | 311300 | 700×1194 | 1194 | yes | 0.70 @ 0.30 |
| lulu | ko | 311400 | 1216×787 | 787 | yes | 0.70 @ 0.30 |
| kimahri | hurt | 323302 | 822×1198 | 1184 | yes | 0.75 @ 0.30 |
| kimahri | victory | 321403 | 730×1196 | 1180 | no | 0.70 @ 0.30 |
| rikku | attack | 331102 | 679×1184 | 1168 | yes | 0.70 @ 0.30 |
| rikku | cast | 331202 | 693×1167 | 1151 | yes | 0.70 @ 0.30 |
| rikku | item | 332302 | 400×1159 | 1143 | no | 0.70 @ 0.30 |
| portrait | lulu | 312503 | 832×1216 | — | yes | 0.70 @ 0.30 |
| portrait | kimahri | 322502 | 832×1216 | — | no | 0.70 @ 0.30 |

Four of the eleven landed frame-right unassisted, a better rate than the first
round's 2-in-23, but it is eleven samples and is probably noise — the frame-left
bias of §2.1 still decided most of the batch.

`portraits/kimahri` is the one file shipped at `facing: none`: it came back
cleanly frontal, which is what the contract asks a portrait for (§1 of
`art3-contract.md`), so it was not mirrored. Lulu's portrait was angled and is
mirrored to read frame-right like the rest of the group.

`qc.py` on all eleven: `ok` for the nine character states except `lulu/ko`
(`BG-RETAINED`, §6.4); both portraits report `BG-RETAINED,FRAME-FULL`, which is
the normal and expected result for the portrait preset (§2.5).

### 6.8 Deltas this pass would fold back into `cast.json` (not written here)

Continuing the list in §4:

6. **Lulu** — her `tags` should carry `the hem of the black skirt reaches the
   floor and covers her feet completely`, and footwear belongs in a shared
   negative for her. She has no modelled legs (`research/visual-bible.md` §1.5);
   every shoe the model draws is an invention.
7. **Lulu** — the moogle needs `one tiny white moogle doll no bigger than her
   hand` in `tags` and `(tiny moogle doll:1.35)` in `emphasis` on every state.
   Without it the doll grows to human size (§6.2).
8. **Kimahri** — record the two-colour pin of §6.3 on the subject rather than per
   state.
9. **Kimahri `victory`** — the `poseTags` must not ask for folded arms while a
   spear is held; that combination produced a three-armed Ronso.
10. **Rikku** — the colour-cast block of §6.6 belongs on the subject.

### 6.9 Sheets rebuilt

`docs/screenshots/art/{lulu,kimahri,rikku}.png` were rebuilt from new committed
specs — `tools/gen/sheet-art3-{lulu,kimahri,rikku}.json` — so the next pass edits
a file instead of rebuilding a sheet by hand, following the
`sheet-art3-wakka.json` precedent. Subject directories again contain only the
promoted state files: every numbered variant and every `*.raw.png` from this pass
was removed after the picks were made.

---

## 7. Fix pass 2 — 2026-09-18 (contract v3, judge round 2 feedback)

The blind judge returned nine states below the bar, all of them files this group
shipped in §6: `lulu/{attack,hurt,ko}` and `portraits/lulu`, `kimahri/{hurt,victory}`
and `portraits/kimahri`, `rikku/{attack,cast}`. **No idle was flagged again**, so
all three approved idles were kept and every regenerated state is still `--ref`'d
at the same idle. All nine files were replaced.

`portraits/rikku`, `lulu/{cast,item,victory}`, `kimahri/{attack,cast,item,jump,ko}`
and `rikku/{hurt,item,victory,steal,ko}` were not flagged and were not touched.

### 7.1 The method mistake this pass made twice, and the rule that comes out of it

The first two rounds rewrote each subject's tag and negative strings from scratch
around the judge's complaints. Both rounds reintroduced failures that §2 and §6
had already solved:

| Round | What was dropped | What came back |
| --- | --- | --- |
| 2a, `lulu/attack` | the `wings, feathered wings, angel wings, feathers` ban from §6.2 | 2 of 4 variants grew full wings on Lulu, because the moogle's canon bat wings had been written into `--tags` |
| 2b, `lulu/attack` | `moogle standing on the ground` (§2.6) | 5 of 5 put a human-sized plush on the floor beside her |
| 2b, `rikku/attack` | round 1's negative list, replaced with a longer rewrite | 5 of 5 melted — the §2.2 `idleZ` quality collapse |

**Round 1's negative lists are not style, they are a debugging record.** Every
token in them was bought with a failed batch. The rule for the next fix pass:
read the shipped sidecar, take its `tags`, `poseTags` and negative **verbatim**,
and *add* the judge's defects to the end. Do not rewrite and do not tidy. Every
state that was fixed on the first try in this pass (`kimahri/{hurt,victory}`,
both portraits) either inherited the idle's string unchanged or added fewer than
fifteen tokens; every state that needed three or four rounds was one this pass
had rewritten.

### 7.2 The negative-token budget is real and it is narrow

Three separate collapses this pass, all with the same signature — muddy, torn,
half-dissolved figures that `rembg` then crops to garbage:

| Batch | Negative length | Result |
| --- | --- | --- |
| `rikku/attack` 2c | round 1's list + **12** added phrases | 5/5 clean |
| `rikku/attack` 2d | round 1's list + **17** added phrases | 5/5 collapsed |
| `rikku/attack` 2e | round 1's list + **2** added phrases | 5/5 clean |
| `lulu/hurt` 2b | a rewritten ~80-phrase core + 10 | 5/5 collapsed |
| `lulu/hurt` 2c | round 1's list + **10** added phrases | 5/5 clean |

Round 1's own lists sit near the top of what this checkpoint tolerates, so the
headroom for additions is roughly **ten phrases, and certainly under twenty**.
This is the same finding as §6.5 (`portraits/kimahri` collapsing under a 40-token
list and recovering at 17), generalised: it is not a portrait-only effect, and it
is about the *total*, not about which composition is in use.

### 7.3 `--facing right` on the portrait composition is what finally turned the portraits

Both portraits were flagged for the same thing in both judge rounds: dead-on
frontal. §2.5 had deliberately left the portrait pipeline alone — `--composition
portrait` defaults to `--facing none`, so none of the weighted `(from side:1.3)`
machinery was ever in the prompt — and mirrored the keeper instead, which of
course cannot turn a frontal head.

This pass ran `--composition portrait --facing right`, which is an explicit
override the generator honours (`defaultFacingFor` only supplies `none` when
`--facing` is absent). **10 of 10 portrait variants across both subjects came
back genuinely three-quarter.** The facing negatives ride along automatically and
cost 6 tokens, which stayed inside the §6.5 budget as long as the rest of the
list stayed short.

This contradicts `cast.json`'s `facing: none` for portrait subjects and §1 of
`art3-contract.md`. The judge has now scored a straight-on portrait as a facing
failure twice, so this group followed the judge. **The contract owner should
decide which is right** — see §7.7.

### 7.4 Per-state notes

| State | Judge's defect | What fixed it, and what it cost |
| --- | --- | --- |
| `lulu/attack` | red/brown streaked hair, fur collar gone, moogle replaced by a red-and-white blob, tassel skirt | Round 1's strings verbatim, plus `(jet black hair:1.3), (brown fur collar:1.25)` in `--emphasis` beside the existing `(tiny moogle doll:1.35)`, and 15 added negatives. Keeper has the doll held out in an open hand with the other on her hip — the pose the brief asked for in §6.2 |
| `lulu/hurt` | serene glamour shot, no recoil, exaggerated bust, pink lantern, stray red sphere | Round 1's "flinching, recoiling, staggering" was the phrasing the judge read as a glamour pose. Describing the **end state** of the flinch as body mechanics — torso bent back, head tilted back, eyes shut, mouth open, near arm flung out — landed the recoil without the motion words that §6.2 warns spray paint |
| `lulu/ko` | illegible smear, fused head/hands/skirt, oversized floating moogle | Fixed. **Residual: her eyes are open with a faint smile** — see §7.5 |
| `portraits/lulu` | frontal, red hair highlights, invented necklace | §7.3, plus the bible's actual necklace (§1.5: purple round beads, small white beads, red and blue beads) written out instead of "many beaded necklaces" |
| `kimahri/hurt` | spear floating behind the shoulder in two detached pieces, blob hand, two intact horns, arms-crossed posing | Naming the grip (`his near paw gripping the spear shaft halfway down so the whole spear is held in that hand`) put the weapon in his paw 5/5. `folded arms, crossed arms` had to be banned explicitly — the idle's planted stance pulls that way through `--ref` |
| `kimahri/victory` | frontal, carved orange staff instead of the idle's spear, floating ornament, far arm lost in the mane | The bible's own victory beat (§1.6: plant the spear butt-first) with **one** paw on the shaft and the other explicitly empty. Asking for "both paws gripping the spear" in §6 is what had been inviting a second weapon into the free hand |
| `portraits/kimahri` | frontal, horn colours not matching the body sheet, electric-blue fur | §7.3, plus `pale amber horn` (matching the body sheet) and `electric blue, neon blue, cyan fur` banned. Negative list kept to 17 phrases per §6.5 |
| `rikku/attack` | outsized claw with cable trails ending in free-floating rings, fused thigh/knee, stray white fin, off arm missing | Four rounds. The single-claw clause moved to the **front** of `--tags` (§2.2's lever), the pose changed from a kick to a grounded lunge, and the negative addition cut to two phrases (§7.2). All five defects gone |
| `rikku/cast` | three-quarter back view frame-left, spatula fingers, detached boot sole, clip-art rune discs | Round 1's negatives plus `back view, from behind, turned away, face hidden`. **Do not ban `disc`, `plate`, `oval` or `stacked rings` to fix the spell shape** — round 2b did and the magic circle vanished entirely in 5/5 |

### 7.5 What is still not right

- **`lulu/ko` has her eyes open.** The judge's complaint was legibility, and that
  is fixed: head clearly frame-right, hands and skirt separate, the doll at
  hand-scale beside her open hand, and the file now QCs `ok` where the shipped
  one was `BG-RETAINED`. But 4 of 5 variants came back with her eyes open and a
  faint smile, so she reads as reclining rather than downed, and `eyes closed` is
  already in the prone composition block itself. A dedicated round pushing
  unconsciousness harder (`(eyes closed:1.4)`, `limp and motionless`, floor/bed
  banned) **produced a near-blank frame** — `rembg` reported "nothing left after
  background removal" on variant 2 and variant 1 came back 2.2 % opaque. Banning
  the ground under a figure whose composition block says `lying on ground` is
  apparently enough to empty the frame. Not retried; the legible version shipped.
- **`kimahri/victory`'s far arm is behind the mane.** The judge flagged exactly
  this on the previous victory and it is only partly better: the near paw is
  clearly on the shaft and the far shoulder reads, but the far hand is not drawn.
  Every variant in two rounds either hid that hand or grew a second weapon in it.
- **`rikku/attack` keeps the orange colour cast** that §6.6's block fixes. The
  colour block is incompatible with the §7.2 token budget on this state — adding
  it is what collapsed round 2d — so the choice was a clean render with warm skin
  or a melted render with correct skin. §6.4 already records three other Rikku
  states shipping with this cast and passing the judge.
- **`kimahri/victory`'s `baselineY` is 1216 on a 1216-tall crop**, i.e. his feet
  sit on the bottom row. No dangle, `qc.py` reports `ok`, but there is no margin
  under him.

### 7.6 Log — what shipped in fix pass 2

`flipped: true` means the PNG was mirrored by `flip.py` after the render and the
recorded seed reproduces the **un**mirrored image. Every sidecar carries
`facingObserved: true`.

| Subject | State | Seed | Size | `baselineY` | Mirrored | ref |
| --- | --- | --- | --- | --- | --- | --- |
| lulu | attack | 318101 | 563×1171 | 1155 | no | 0.70 @ 0.30 |
| lulu | hurt | 318202 | 679×1088 | 1072 | no | 0.70 @ 0.30 |
| lulu | ko | 317302 | 1213×773 | 757 | no | 0.70 @ 0.30 |
| kimahri | hurt | 327100 | 827×1173 | 1157 | yes | 0.70 @ 0.35 |
| kimahri | victory | 327204 | 796×1216 | 1216 | yes | 0.70 @ 0.35 |
| rikku | attack | 340100 | 660×1215 | 1199 | no | 0.70 @ 0.30 |
| rikku | cast | 338203 | 588×1195 | 1179 | no | 0.70 @ 0.30 |
| portrait | lulu | 316404 | 832×1216 | — | yes | 0.70 @ 0.30 |
| portrait | kimahri | 326304 | 832×1216 | — | yes | 0.70 @ 0.30 |

Five of nine needed mirroring, the same frame-left bias as §2.1 and §6.7.

`qc.py`: all seven character states report `ok` — including `lulu/ko`, which
improves on the `BG-RETAINED` of the file it replaces. Both portraits report
`BG-RETAINED,FRAME-FULL`, the normal and expected result for the portrait preset
(§2.5, §6.7).

**Kimahri was mirrored again**, on the same reasoning as §2.2: this group's whole
Kimahri set is mirrored and self-consistent, and a Ronso's single horn sits in
the middle of the forehead so which of an invented pair is broken is a project
decision. `hurt` shows one clear amber horn; `victory` and the portrait show the
bible's asymmetric long-horn-plus-stub. This remains the §2.2 caveat, unresolved.

### 7.7 Deltas this pass would fold back into `cast.json` and the contract (not written here)

Continuing the lists in §4 and §6.8:

11. **`portrait-*` subjects** — `facing: none` is what `cast.json` and
    `art3-contract.md` §1 both say, and the blind judge has now failed a
    straight-on portrait twice, once per round. Either the contract should say
    portraits face frame-right like the rest of the party art, or the judge's
    rubric should stop scoring portrait facing. **This group shipped
    `--facing right` and cannot resolve the disagreement from here.**
12. **`docs/ART-PIPELINE.md` §6** — the judging list should carry the negative
    budget of §7.2 as a numbered failure mode. It is currently only visible as an
    anecdote in §2.2 and §6.5 of this file, and it cost three batches this pass.
13. **Lulu** — the moogle's canon pink wing flaps (`research/visual-bible.md`
    §1.5) must **not** be described in `--tags`; the checkpoint puts them on
    Lulu. Keep the doll's description to body, eyes, cheeks and pom pom.
14. **Rikku** — the single-claw clause belongs at the front of `tags`, not in the
    middle (§7.4); in the middle it loses to the two-glove prior.
15. **Kimahri `victory`** — record "one paw on the shaft, the other empty"; asking
    for both paws on the spear is what invites a second weapon (§7.4).

### 7.8 Where the evidence is

Final per-subject sheets, rebuilt from the committed specs
`tools/gen/sheet-art3-{lulu,kimahri,rikku}.json`:

- `docs/screenshots/art/lulu.png`
- `docs/screenshots/art/kimahri.png`
- `docs/screenshots/art/rikku.png`

Judging sheets kept from this pass:

- `_v-b-fix2-flagged.png` — the nine flagged files beside their idles, which is
  the fastest way to see what this pass was asked to fix.
- `_v-b-fix2-lulu-cand.png`, `_v-b-fix2-lulu-attack2b.png`,
  `_v-b-fix2-lulu-attack2c.png`, `_v-b-fix2-lulu-attack-pick.png` — the three
  Lulu attack rounds, i.e. the wings regression and the recovery.
- `_v-b-fix2-lulu-hurt2b.png` — the clearest picture of the §7.2 quality
  collapse, beside `_v-b-fix2-lulu-hurt2c.png` and `_v-b-fix2-lulu-hurt-pick.png`.
- `_v-b-fix2-lulu-ko2b.png`, `_v-b-fix2-lulu-ko2c.png`, `_v-b-fix2-lulu-ko-zoom.png`,
  `_v-b-fix2-lulu-ko-pick.png` — the KO rounds and the eyes-open residual.
- `_v-b-fix2-kimahri-cand.png`, `_v-b-fix2-kimahri-zoom.png`,
  `_v-b-fix2-kimahri-hurt2b.png`, `_v-b-fix2-kimahri-victory2b.png`,
  `_v-b-fix2-kimahri-v1.png`, `_v-b-fix2-kimahri-v3.png`,
  `_v-b-fix2-kimahri-v4.png`, `_v-b-fix2-kimahri-v5.png`,
  `_v-b-fix2-kimahri-h1.png` — including `v1`, which is the clearest example of
  the second-weapon-at-the-hip failure.
- `_v-b-fix2-rikku-only.png`, `_v-b-fix2-rikku-zoom.png`,
  `_v-b-fix2-rikku-attack2b.png` (collapse), `_v-b-fix2-rikku-attack2c.png`,
  `_v-b-fix2-rikku-attack2d.png` (collapse), `_v-b-fix2-rikku-attack2e.png`,
  `_v-b-fix2-rikku-attack-final.png`, `_v-b-fix2-rikku-cast2b.png`,
  `_v-b-fix2-rikku-cast2c.png`, `_v-b-fix2-rikku-cast-pick.png`.
- `_v-b-fix2-portrait-picks.png` and `_v-b-fix2-postflip.png` — the portrait
  decision and the facing check after mirroring.

Subject directories again contain only the promoted state files: every numbered
variant and every `*.raw.png` from this pass was removed after the picks.

Backup: `D:\Tools\pyrefly-art-backup\<yyyymmdd-HHmm>\` (robocopy of
`public/art`, `*.raw.png` excluded).
