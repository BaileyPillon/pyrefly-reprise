# Chapter VII unlock: art approval and the Petrify question (FFX only)

> **Answered 2026-09-25.** Bailey: "I'll go with all your recommendations".
> - **Update, 2026-09-25 ~18:30 EDT** (Bailey: "All your recommendations"): the pause plate is **A2**
>   (independent judge 7.4, `../pause-plate-redo/JUDGE-A2.md`), installed and locked as
>   `chapter:macalania-pause:2026-09-25`; the party layout is **B** (`MACALANIA_PARTY_LAYOUT = 'b'`). The
>   chapter stays locked until the scene cue is picked by ear.
> - Question 1: the five battle paintings and the backdrop are locked as set
>   `chapter:macalania:2026-09-25` in `docs/target/approved-hashes.json` (backup
>   `D:/Tools/pyrefly-art-backup/approved/2026-09-25-chapter-macalania/`).
> - The pause plate is being redone. Its options sheet is `pause-plate-redo.jpg`, and the work
>   is in `../pause-plate-redo/`. Nothing is installed yet.
> - Question 2: option A (a petrified Guardian shatters; an ordinary defeat yields). Recording
>   and building that answer belongs to another track, not the art track.
> - Anima's folder (idle, attack, overdrive, hurt, ko) is now locked as set
>   `chapter:macalania-anima:2026-09-25` (2026-09-25, ship pass; backup
>   `D:/Tools/pyrefly-art-backup/approved/2026-09-25-chapter-macalania-anima/`). The ko (judged 5)
>   is locked with the rest and is redone only on Bailey's word.
> - The pause-plate sheet now has a fifth row, **A2** (A with the judge's two notes fixed by pixel
>   edits), with its real pause capture. A2 is not judged yet. The unlock waits on this pick, on
>   the scene cue and on the party layout (`party-layout/sheet.jpg`: the FFX command stack covers
>   Yuna and Tidus at the first menu; options A, B recommended, C, measured live) (`src/data/chapter-macalania-ship.ts`; `docs/handoff/chapter-macalania.md`,
>   "Ship layer and unlock readiness"). The rehearsal with the lock removed in the page only is in
>   `rehearsal/`.
> - Hash provenance (correction, 2026-09-25): the sheet image `art-approval.jpg` shows no
>   hashes. The five character locks were checked against the 12-character hashes in the table
>   below. The backdrop had no hash listed when the sheet was made; its lock was taken from the
>   installed file (mtime 2026-09-22, older than the sheet of 09-24, so it is the painting the
>   sheet showed) and its first 12 characters are now in the table.

**Game case: FFX only.** Chapter VII (`seymour-anima-macalania`): human-form Seymour, the
Guado Guardians and Macalania Temple exist only in FFX. No FFX-2 chapter and no shared code is
touched.

The real-key playthrough (`../e2e/`, commit 06338dbc) found Chapter VII not ready to unlock.
Two answers from Bailey remain. Both sheets are built from files already on disk and from real
captures. Nothing was rendered, installed or repainted, and nothing was written to
`approved-hashes.json`, `src/`, `tests/` or `public/art`.

## Question 1: `art-approval.jpg`

**Approve all of these as final art, or name any to redo?**

| Painting (installed file) | sha256 (first 12) | Judge | Score (bar 7) |
|---|---|---|---|
| Seymour idle r3 (`characters/seymour-macalania/idle.png`) | edb8a4441722 | `../r3-JUDGE-2.md` §1 | 7 (in-game read 8) |
| Seymour cast, r3 plus the hand repair (`.../cast.png`) | 6f40f101a6d5 | `../r3-JUDGE-3.md`, judge 4 | 7 (was 5) |
| Seymour hurt r3 (`.../hurt.png`) | 5b16020259c5 | `../r3-JUDGE-3.md` §2 | 7 |
| Guado Guardian idle r3 (`characters/guado-guardian/idle.png`) | 963b58eee920 | `../r3-JUDGE-2.md` §3 | pixels 7, **in-game read 6** (robe bloom; the fix recommended is the renderer's bloom, not the art) |
| Guado Guardian cast, r3 plus the wrist repair (`.../cast.png`) | 9c7930fca598 | `../r3-JUDGE-3.md`, judge 4 | 7 (was 6) |
| Backdrop (`backdrops/macalania-temple.png`) | 1a83a9fcfc3d (added 2026-09-25 at lock time) | `../production/judge.md` | 7 |
| Pause plate (`pause/macalania.png`) | | `../production/judge.md` | **6** (background is a rooftop village, not the temple; the veins read as a cheek scar) |
| *Reference:* Anima idle (`characters/anima/idle.png`) | 9a91c5cf4545 | approved, D-108 | n/a |

None of the first seven is in `docs/target/approved-hashes.json`. No Guardian hurt painting ships:
judge 3 scored it a tie with none, so the engine falls back to the idle. No attack paintings ship
(D-045 option A).

**Recommendation:** approve the five battle paintings and the backdrop as final art. Redo the
pause plate: repaint only its background as the ice antechamber and soften the "scar", keeping the
face. Treat the Guardian's glow as a renderer bloom fix (src, the driver's), not a repaint.

**Anima note.** D-108 ("public/art/characters/anima/* is approved") also covers the two Anima
paintings made for this chapter on 2026-09-22: hurt (judged 7) and **ko (judged 5, reads as a lean,
not a collapse)**. Her hash is not recorded in `approved-hashes.json`; recording it is owed with
this approval. The sheet asks Bailey to name the ko if he wants it redone.

Each card shows the painting at 1:1 on navy (`img/*-1to1.png`, `object-fit: none`, so no scaling)
and the same actor at 1:1 in a real 1600x900 battle frame (`img/*-battle.png`). The three full
frames are `img/frame-{idle,cast,seymour-hurt}.jpg` and the pause capture is
`img/frame-pause-chapter.jpg`, from `capture.mjs`: own Vite on port 5720 (range 5720..5739,
`--strictPort`, HMR and watcher off through a scratch config), `PYREFLY_BROWSER=gpu`, seed 1,
`gotoChapter('seymour-anima-macalania', { skipCutscenes: true })`, `setPose(..., { immediate, force })`
for idle and cast, the engine's `recoil(340)` 8 frames in for Seymour's hurt, then `pause:open` and
three real E presses to reach the CHAPTER tab. 0 console errors and 0 HTTP errors; the server was
stopped by PID after each of the three runs. Renderer: GPU (ANGLE, D3D11). These captures have no
battle HUD because they were taken during the opening turn, before the first command menu. The HUD
frames are in `../e2e/`. Anima's battle crop comes from `../e2e/win-anima-arrival-10-t10994ms.jpg`.

## Question 2: `petrify-shatter.jpg`

**When Petrify Grenade hits a Guado Guardian, does it shatter or yield?**

The guide's hint reads: "a petrified monster shatters — it forfeits the overkill AP and it ends them in one throw"
(`src/data/guides/seymour-anima-macalania.ts`). The move advisor's first card is also Petrify
Grenade. D-046 said the Guardians **yield** when they are beaten. Research
(`research/ffx-seymour-anima-macalania.md` §2.2, `[verified: 2 sources]`): *"Kimahri's Stone
Breath and Rikku's Petrify Grenade both petrify, and a petrified monster always shatters ...
Shattering forfeits the overkill AP."* §7 row 2 lists this as an intended strategy. §10 row 10
calls it "A real trade-off, stated in numbers."

- **A (recommended): shatter for a petrified Guardian, yield for an ordinary defeat.** This is what
  FFX's mechanics do, and it is what the code does today. `BattlePresenterArrivals.ts#statusAdded`
  handles the shatter: a grey flash, the `petrify-shatter` cue, a shake, a 0.6 s dissolve toward
  stone, then removal. `BattlePresenterDepartures.ts` lists both Guardians as `'yields'`. The
  shatter frames are `../e2e/win-exit-guado-guardian-a-{1,2,3}`. The yield strip is D-046's mock
  (`../decisions/img/guardian-yields-*`), because the e2e run shattered both Guardians and never
  captured an ordinary-defeat yield.
- **B: always yield, even when petrified.** Off-canon. It needs a presenter change, and the guide's
  "shatters" line would have to be reworded.
- **C: remove Petrify Grenade (and Stone Breath) from the guide and the advisor.** The player can
  still throw one from Items (the preset carries them, §8.9), so C still needs A or B for that throw.
  It also drops one of the fight's intended lessons.

## Seen in the frames, not fixed (for the driver)

1. **The shatter barely reads as stone.** The Guardian is still in full colour at +14 ms and is gone
   by +608 ms. Making it read as stone would be a look change, so it needs options first (rule 9).
2. **The advisor prices Petrify Grenade at "4,000" and says "4000 damage"**, but the item does no
   damage (`src/data/ffx/items/offensive-1a.ts`, "all-enemies, no damage, applies Petrify"). The
   number is probably the two Guardians' 2,000 HP counted as damage. Not proved by running the
   advisor (hard rule 3).
3. The pause plate's facial veins read as a scar (production judge; shown on sheet 1).

## Files

`art-approval.html` / `.jpg` (1600x2115), `petrify-shatter.html` / `.jpg` (1600x900), `img/`
(crops and frames), `capture.mjs` (the in-battle capture). The pages are rendered with
`node docs/concepts/polish/_kit/shoot.mjs <page>.html <out>.png --w=1600 --h=<h>`.
