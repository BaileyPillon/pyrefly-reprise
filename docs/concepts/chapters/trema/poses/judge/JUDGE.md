# Chapter XIII line-up poses: independent 1:1 judge (decision sheet 2026-09-25, item 10)

**Game case (rule 14): FFX-2 only.** These are paintings of the Chapter XIII party's FFX-2
dresspheres (Yuna and Paine as Dark Knights, Rikku as Alchemist). They also show wherever those
dresspheres appear.

**Judge:** a sub-agent that made none of these paintings, 2026-09-25. The maker's picks are in
`../verdicts.json` (commit af6f40f2).

**Bailey's words**, 2026-09-25 about 11:00 EDT, verbatim: *"I'll go with all your recommendations"*.
Item 10's recommendation is B: an independent judge and the scale fix first, then a sheet for his picks.

**These are a judge's verdicts, not Bailey's approval.** Nothing was installed in `public/art/`, and
nothing went into `docs/target/approved-hashes.json`. Bailey names each slot from the sheets. A slot
the judge failed stays empty.

## Method

- **What was judged:** all 15 maker picks (Yuna 4, Paine 5, Rikku 6).
- **How each pick was shown:**
  - Beside the shipped idle at one pixel scale, with the idle at its native size.
  - Over a split ground of mid grey and dark navy, so a fringe shows on one of them.
  - 2x head crops of both, read on a 10 px grid.
- **Where the tools and data are:** `docs/concepts/art5/judge/`:
  - `judge_tools.py`, `build_judge.py` and `make_judge_sheets.py` (the tools);
  - `looks.txt` (the judge's look per pick);
  - `measure.json` (the head points);
  - `judge.json` (the result).
- **Rubric:** the eight categories of `docs/concepts/chapters/gippal/production/JUDGE.md`, each scored
  0 to 10. The categories are identity (to the shipped idle here), anatomy, hands, costume, seams,
  edges, finish and game read. A pick passes at a mean of 7.0 or more.
- **Border check:** the alpha of every canvas edge was measured. Painted content that touches an edge
  shows as a hard straight cut in the game.
- **Eye sides:** checked against `research/visual-bible.md` §Yuna. The source says her left eye is blue
  and her right eye green. On a figure facing the viewer, the green eye sits on screen-left.
- **Scale (the sidecar fix):**
  - `scale = idle eye-line-to-chin / pick eye-line-to-chin`. This is the `PaintedScale` pose override:
    the engine sizes every pose from the idle's pixels times `scale`, so the head matches the idle.
  - The points were read by eye off 2x crops, then drawn back on the crops to check them
    (`judge_tools.py marks`).
  - Expect about ±5%.
- **Scale gate:** at the head-match scale, the pick's stature against the idle (eye line to feet) must
  stay in a set range:
  - 0.75 to 1.30 for an upright pose;
  - at least 0.60 for a lunge.

  Outside that range the girl visibly grows or shrinks when the pose swaps in. No Chapter XIII pick
  tripped the gate.

## Scores (bar 7.0)

| Pick | Id | Anat | Hands | Cost | Seams | Edges | Fin | Game | Overall | Scale | Stature | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| yuna-dark-knight/attack c6 | 6.5 | 7.5 | 7 | 6 | 8 | 8 | 7.5 | 8 | **7.31** | 1.11 | 0.83 | PASS |
| yuna-dark-knight/cast c3 | 4.5 | 6.5 | 6 | 4 | 7 | 6 | 6.5 | 7 | **5.94** | - | - | FAIL |
| yuna-dark-knight/ko c1 | 6 | 7 | 6.5 | 5.5 | 7 | 6 | 6.5 | 7 | **6.44** | - | - | FAIL |
| yuna-dark-knight/victory c2 | 4.5 | 7 | 6.5 | 4.5 | 7.5 | 6 | 7 | 7 | **6.25** | - | - | FAIL |
| paine-dark-knight/attack c6 | 7 | 7.5 | 7 | 6.5 | 8 | 8 | 8 | 8 | **7.50** | 1.19 | 0.87 | PASS |
| paine-dark-knight/cast c2 | 6 | 7 | 6.5 | 5.5 | 8 | 7.5 | 7.5 | 6.5 | **6.81** | - | - | FAIL |
| paine-dark-knight/item c3 | 6 | 7.5 | 7 | 5.5 | 8 | 8 | 7.5 | 7 | **7.06** | 1.35 | 1.08 | PASS |
| paine-dark-knight/ko c1 | 6 | 6 | 6.5 | 6 | 8 | 4.5 | 7 | 6.5 | **6.31** | - | - | FAIL |
| paine-dark-knight/victory c5 | 5 | 7.5 | 7 | 5 | 8 | 8 | 7.5 | 6 | **6.75** | - | - | FAIL |
| rikku-alchemist/attack c5 | 6 | 7 | 6.5 | 5.5 | 8 | 8 | 7.5 | 5 | **6.69** | - | - | FAIL |
| rikku-alchemist/cast c1 | 7.5 | 7.5 | 7 | 6 | 8 | 8 | 7.5 | 7.5 | **7.38** | 0.96 | 0.89 | PASS |
| rikku-alchemist/item c3 | 7 | 7.5 | 7 | 6 | 8 | 8 | 7.5 | 7.5 | **7.31** | 1.46 | 1.10 | PASS |
| rikku-alchemist/hurt c3 | 7 | 6.5 | 6.5 | 6.5 | 8 | 8 | 7.5 | 7 | **7.12** | 1.30 | 0.89 | PASS |
| rikku-alchemist/ko c4 | 7 | 5.5 | 6.5 | 6.5 | 8 | 8 | 6.5 | 7 | **6.88** | - | - | FAIL |
| rikku-alchemist/victory c4 | 7 | 7 | 7 | 6 | 8 | 8 | 7.5 | 7.5 | **7.25** | 1.09 | 0.76 | PASS |

**Result: 7 of 15 pass.**
- Yuna: attack.
- Paine: attack and item.
- Rikku: cast, item, hurt and victory.

Stature is the pick's height against the idle once its scale is applied. 1.00 is the same height,
and a lunge stands lower.

## Per pick, worst named first

**yuna-dark-knight/attack cand-6: PASS (7.31), scale 1.11.** A two-handed lunge with the dark
greatsword. It reads at game size.
- **Worst:** the helm is a teal brimmed cap with no crest.
- The blade is much wider than the idle's, with a blue haft and tassel under the grip.
- **Eyes:** green is on screen-left, which is the sourced side. The shipped Dark Knight idle has them
  the other way round, so the idle is the one off source. The maker's "eyes swapped" note is true
  against the idle, not against Yuna.

**yuna-dark-knight/cast cand-3: FAIL (5.94).** She does not read as her Dark Knight.
- The sword is a giant curved slab, taller than she is, on a thin pole.
- Both eyes are cyan, so the heterochromia is lost.
- She wears an orange top with a bare midriff in place of the blue breastplate, and has no pauldrons
  or gauntlets.
- The stockings do not match: one red, one pink.
- The cutout left translucent pale-blue residue between her feet.

**yuna-dark-knight/ko cand-1: FAIL (6.44).** She lies on her sword, head toward the enemy, eyes shut.
- The helm has become a teal cowl with a flower on top.
- The pink thighhighs are mostly gone.
- A translucent wedge of blade shows under her legs (cutout residue).

**yuna-dark-knight/victory cand-2: FAIL (6.25).**
- The helm is a teal brimmed sun hat.
- Both eyes are green.
- She has no pauldrons and no gauntlets.
- One stocking is red.
- The top edge of the canvas cuts off the blade (border alpha 255).

**paine-dark-knight/attack cand-6: PASS (7.50), scale 1.19.** A lunge with the copper-engraved blade.
It is the best Dark Knight frame.
- **Worst:** the cape is bright red with a high red collar. The idle's cape is dark with a red lining.
- The long pole grip and the red tassel make the sword read a little like a glaive, and there is no
  winged guard.
- The hair is a swept bob with less of the idle's spiked crest.

**paine-dark-knight/cast cand-2: FAIL (6.81).**
- A bright red winged cape fills about 40% of the silhouette.
- A blue spiked piece beside her hip reads as a second weapon.
- The hair is a smooth bob with no crest.

**paine-dark-knight/item cand-3: PASS (7.06, narrow), scale 1.35.** The bottle held out reads.
- **Worst:** red skirt panels take over the lower half.
- The hair is a smooth bob with no crest.
- The blade is short and ornate, not the idle's slab.
- At native size she stands 0.70 of the idle. The scale brings her to 1.08.

**paine-dark-knight/ko cand-1: FAIL (6.31).**
- Painted content touches the left, right and bottom edges of the canvas.
- The blade runs off the bottom-right corner with a straight cut.
- Her legs are stacked into a heap of armour.

**paine-dark-knight/victory cand-5: FAIL (6.75).**
- The weapon is confirmed as a poleaxe: a red crescent axe head with a spear tip.
- She has a long silver ponytail, which Paine does not have.
- Sheer black tights show where the idle is armoured.

**rikku-alchemist/attack cand-5: FAIL (6.69).**
- **She lunges and throws toward screen-left, away from the enemy.** The party faces right.
- The leg strips are gone.
- The flask is a dripping orange bulb.

**rikku-alchemist/cast cand-1: PASS (7.38), scale 0.96.** The flask is held high with a hand on her
hip. It reads at game size.
- **Worst:** the idle's long orange and yellow leg strips are gone, replaced by orange tights.
- The boots are tall blue tubes. The idle's are short blue boots with green cuffs.

**rikku-alchemist/item cand-3: PASS (7.31), scale 1.46.** She holds a purple lab flask out toward the
enemy.
- **Worst:** the leg strips are cut down to two short flaps.
- She wears orange thighhighs and tall pale-blue heeled boots.

**rikku-alchemist/hurt cand-3: PASS (7.12, narrow), scale 1.30.** Her back is arched away, her head
thrown back and one eye shut.
- **Worst:** the flask floats free above her. It reads as flung, but it is a detached piece.
- The leg strips are gone.

**rikku-alchemist/ko cand-4: FAIL (6.88).** She reads as down.
- The legs are shapeless orange masses: the near thigh and hip merge into one blob.
- At 1:1, red streaks run down her forehead and cheek. They read as blood.

**rikku-alchemist/victory cand-4: PASS (7.25), scale 1.09.** Both fists up, with a grin.
- **Worst:** a short body under a normal-size head. At the head-match scale she stands 0.76 of the
  idle, the lowest that passes.
- The boots are baggy blue tubes.
- The leg strips are gone.

## Scale sidecars (passes only)

**Where the files are:** `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-judge-poses/<id>/<slot>.png`,
with `<slot>.json` beside it.

**What the sidecar holds:**
- `scale` and `scaleNote`;
- the render settings;
- `status` set to CANDIDATE;
- the sha256.

It is the file to copy into `public/art/characters/<id>/` if Bailey names the slot.

| Slot | Idle eye-chin px | Pick eye-chin px | `scale` | Stature at scale |
|---|---|---|---|---|
| yuna-dark-knight/attack | 50.0 | 45.1 | 1.11 | 0.83 (lunge) |
| paine-dark-knight/attack | 47.8 | 40.1 | 1.19 | 0.87 (lunge) |
| paine-dark-knight/item | 47.8 | 35.5 | 1.35 | 1.08 |
| rikku-alchemist/cast | 49.0 | 50.9 | 0.96 | 0.89 |
| rikku-alchemist/item | 49.0 | 33.6 | 1.46 | 1.10 |
| rikku-alchemist/hurt | 49.0 | 37.8 | 1.30 | 0.89 |
| rikku-alchemist/victory | 49.0 | 45.0 | 1.09 | 0.76 |

## Sheets for Bailey (one per girl)

The sheets are in this folder:
- `sheet-yuna-dark-knight.jpg`
- `sheet-paine-dark-knight.jpg`
- `sheet-rikku-alchemist.jpg`

Each sheet has three parts:
- **Top:** every pass at 1:1 beside the shipped idle, with the judge's look above it.
- **Game-size strip:** the idle standing at 240 px, and every pose at its sidecar `scale` on one
  ground line, sized the way `PaintedScale` sizes it. The strip shows that a head match does not give
  one stature. Rikku's cast stands a little shorter than her idle, and her item a little taller.
- **Bottom:** the failed picks, shown small, each with its reason.

## Empty after this judge

These slots stay as they are today: the idle, the flinch and `POSE_FALLBACKS`.
- **Yuna:** cast, item, hurt, ko and victory. Item and hurt had already failed twice for the maker.
- **Paine:** cast, hurt, ko and victory.
- **Rikku:** attack and ko.

Nothing was re-rendered: the brief was judge, scale and sheet only. Ready and defend stay unpainted
(sheet item 10: no party member in either game has them).

## Before any install (Bailey decides)

1. Bailey names slots from the sheets. Naming a slot approves that slot only.
2. Copy `<slot>.png` and `<slot>.json` from the judge-poses folder into `public/art/characters/<id>/`.
3. Run `npm run art:manifest`.
4. Check the pose in a real Chapter XIII fight.
5. Add the hash to `approved-hashes.json` only when Bailey says so.
