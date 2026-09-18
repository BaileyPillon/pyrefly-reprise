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
