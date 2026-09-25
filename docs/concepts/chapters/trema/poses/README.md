# Chapter XIII line-up: battle-pose candidates (FFX-2 only)

> **Judged 2026-09-25 (decision sheet item 10):** an independent 1:1 judge passed 7 of these 15 picks and wrote a head-match `scale` for each. Scores, reasons and Bailey's sheets: [judge/JUDGE.md](judge/JUDGE.md). The table below is the maker's own look; the judge's verdicts supersede it. Still nothing installed.

2026-09-25, GPU batch 4. Trema's approved line-up (TR10, `docs/plans/chapter-trema-review.md`):
Yuna and Paine as Dark Knights, Rikku as Alchemist. Before this they had an idle and nothing else.
**Everything here is a CANDIDATE: nothing is installed in `public/art/`, nothing went into
`docs/target/approved-hashes.json`, and nothing is approved until Bailey names it (rule 9).**
FFX-2 only: these are the FFX-2 dressphere paintings of Chapter XIII's party (they also show
wherever else these dresspheres appear, Chapters V and XI).

- Method check (rule 15), pilots and second tries: [METHOD.md](METHOD.md).
- Sheets, one per girl: the shipped idle beside every candidate at one pixel scale, the cutout
  guard's word and my own look under each frame, and a strip of the recommended frames at game
  size: [sheet-yuna-dark-knight.jpg](sheet-yuna-dark-knight.jpg),
  [sheet-paine-dark-knight.jpg](sheet-paine-dark-knight.jpg),
  [sheet-rikku-alchemist.jpg](sheet-rikku-alchemist.jpg). Looks and picks: [verdicts.json](verdicts.json).
- Files: `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu4/trema-poses/<girl>/<pose>/<arm>/cand-N.png`
  (cutout), `.raw.png` (render), `.json` (every setting, seed, guard result). Refs (the idles
  square-padded, head crops) in `refs/` there. Tools: `skeletons.py`, `render.mjs`, `make-sheets.py`.

## What the game reads

`PARTY_POSES` (`src/engine/BattlePresenterArt.ts`): idle, ready, attack, cast, item, hurt, ko,
victory, defend. An empty slot falls back (`POSE_FALLBACKS`) to one that exists, ending at the
idle; `hurt` and `ko` also get the presenter's own flinch and fall. Painted here: attack, cast,
item, hurt, ko, victory. **Not painted: ready and defend**: no party member in either game has
them, `ready` is the idle plus the lean and the turn ring. Question for Bailey, not built.

## Recommendation per slot

| Girl | Slot | Pick | One line |
|---|---|---|---|
| Yuna DK | attack | r2 cand-6 | PASS: two-handed lunge, dark-blue gold-engraved greatsword; alt r2 cand-8 |
| Yuna DK | cast | r2 cand-3 | PASS, weak helm: arm raised, sword point-down; alt r2 cand-5 |
| Yuna DK | item | none | FAIL twice: leave empty, falls back to cast |
| Yuna DK | hurt | none | FAIL twice: leave empty, idle under the flinch |
| Yuna DK | ko | r2 cand-1 | PASS: on her side, head toward the enemy, eyes shut |
| Yuna DK | victory | r2 cand-2 | PASS: sword over the shoulder, hand on hip |
| Paine DK | attack | r3 cand-6 | PASS: lunge, copper-engraved blade nearest the idle's sword; alt r3 cand-2 |
| Paine DK | cast | r3 cand-2 | PASS on the second try: arm raised, one sword held low |
| Paine DK | item | r3 cand-3 | PASS on the second try: bottle held out, one sword at her side |
| Paine DK | hurt | none | FAIL twice: leave empty, idle under the flinch |
| Paine DK | ko | r2 cand-1 | PASS: on her side, head toward the enemy, eyes shut |
| Paine DK | victory | r2 cand-5 | PASS, wrong weapon: the blade reads as a poleaxe; alt r3 cand-3 |
| Rikku Alch | attack | r2 cand-5 | PASS: a throw toward the enemy, flask in hand |
| Rikku Alch | cast | r2 cand-1 | PASS: flask held high, hand on hip (Stash, Mix) |
| Rikku Alch | item | r2 cand-3 | PASS: flask held out |
| Rikku Alch | hurt | r2 cand-3 | PASS: thrown back, hand at the chest |
| Rikku Alch | ko | r2 cand-4 | PASS: on her side, head toward the enemy, eyes shut |
| Rikku Alch | victory | r2 cand-4 | PASS: both fists up, a grin |

"PASS" means my own look at 1:1 beside the idle: the same girl in the same dressphere, the pose
reads, and the cutout is clean. It is not an independent judge's score and not Bailey's pick.

## What still looks wrong

- **Scale.** The skeletons are drawn at 0.8 of the idle so the heads land near the idle's size.
  They are close for Yuna, but several Rikku and Paine frames come out 0.75 to 0.85 of the idle's
  height (see the game-size strips). At install, each pick needs a sidecar `scale` (the
  `PaintedScale` override) set so the head matches the idle.
- **Yuna's helm** reads as a teal cap in most frames, not the idle's crested helm. Raising the
  helm words (arm r4) did not fix it and brought back clutter. Her eye colours come out swapped
  against the idle in attack cand-6 (green on screen-left).
- **Paine**: her capes come out bright red where the idle's is dark with red lining. No frame
  reproduces the idle's exact sword (bronze engraved slab, winged guard). The victory weapon is a
  poleaxe.
- **Rikku**: the long orange and yellow leg strips of the idle are mostly missing.
- **Swords and capes** are the main failure: about a third of the Dark Knight frames fill the
  canvas with cape or blade, or sprout a second weapon. The cutout guard catches the full-frame
  ones. It does **not** catch swirl rings, arches, halos or detached pieces: those need eyes.
- **Facing**: every frame faces screen-right, as the skeleton says. None needs `flip.py`.

## Before any install (Bailey decides)

1. Pick or reject per slot from the sheets. A pick approves only the slot Bailey names.
2. Only then: copy the pick to `public/art/characters/<girl>/<pose>.png` with its sidecar,
   set `scale`, run `npm run art:manifest`, check it in a real fight, and add its hash to
   `approved-hashes.json` only on Bailey's word.
