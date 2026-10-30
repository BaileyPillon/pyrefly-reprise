# Paper preflight: the booth treatment reaches Chapters V, XV and XI (Vegnagun and Shuyin, the Den of Woe, the Fallen Aeons), FFX-2 only

> The paper preflight AGENTS.md rule 15 asks for before a change `tools/critic-plan.mjs` classes as deep. Written 2026-10-30 as the rows were built (the code-reading in section 2 came first and is what put the follower camera behind a hold in Chapter V); it answers the questions `booth-leblanc-review.md` section 4 left for the next chapter that joins. Docs only.

```
node tools/critic-plan.mjs --paths src/engine/motion/DemoGate.ts,src/engine/look/pro/ProGrade.ts,src/engine/procam/ProAutoStage.ts,src/engine/look/pro/RimFigures.ts,src/engine/look/LookGrades.ts
  review:       DEEP (focused before deploy; the deep review on the live build)
  because:      3 substantial checkpoints since the last deep review
  systems:      effects, lighting and sprites
  games:        both (shared plumbing); the three chapters are FFX-2 only
  checks:       CHK-008 013 016 017 020 021 026 027
```

## 1. What the change is

Three lines in `DemoGate.TREATED_CHAPTERS` (`ffx2-vegnagun-shuyin`, `ffx2-den-of-woe`, `ffx2-fallen-aeons`), the holds in `PIECE_HOLDS`, and the data rows each room needs: the HD-2D look and its bold grade (both looks), the room's bold facts, the pro arena with its cone, the follower stage, the rim-off foes. No gate code changes: the 14 switch modules already ask `isTreatedChapter(id, piece)`. See [booth-ffx2-b2](../handoff/booth-ffx2-b2.md).

## 2. The questions, answered per chapter (each is a place the treatment can break)

| # | question | V Vegnagun and Shuyin | XV Den of Woe | XI Fallen Aeons |
|---|---|---|---|---|
| 1 | chains? how many links on one presenter and one layer | **5** (tail, leg, body, head, Shuyin) | 3 (one shade a link) | 3 (Shiva, the Sisters, Anima) |
| 2 | victory kind | `hold` (`research/ffx-vs-ffx2-presentation.md` 2.2: no pose after Shuyin), as Chapter IV | `pose` (the FFX-2 cheer; held for Rikku Dark Knight's 3,400 ms, the longest decoded clip in the party) | `pose`, same |
| 3 | dresses with a decoded real-clip row | Yuna White Mage and Rikku Dark Knight yes, **Paine Dark Knight none** (house curves) | same | same |
| 4 | foes that yield or dissolve | parts of a machine (machina: the presentation table 3.2 says no pyreflies, and they end at a seam anyway); Shuyin fades away with Lenne ("gentle", 3.2 and 10.4), **so the freeze on his last blow is a job (J7)** | pyrefly illusions that disperse | possessed aeons (pyreflies); Anima defeated and recalled |
| 5 | **a camera of its own** | **YES: links 1 to 4 play the approved colossus staging (D-228, fov 40, parts 9.7 to 12.6 girls tall (D-600; the table's scale 4.3 to 5.6 on the stage's 4.1 default boss height), "no single frame contains it"); the follower's never-crop fit would undo it** (measured: each part alone is 1.24 to 1.94 times over the follower's safe rectangle). **Held: `cam`.** | the shared Farplane-family rig | the shared Farplane-family rig, **and a script's cut to a rig of its own: Shiva's KO cuts to `road-links`, the shot whose plate B the Road draws only while the camera stands on it (D-119). The first pass of this row missed it (review M1, 2026-10-30): the follower now stands down on that rig (`ProAutoStage.SCRIPTED_RIGS`, `booth-ffx2-b2-seam.test.ts`; job J15)** |
| 6 | maps that exist unshipped, and are they current | parts, Shuyin, the `farplane` depth: yes, current (36 work files and the plate byte-identical r59 to r64), 22.1 MB, held on B3a | none (GPU) | the three Sisters yes (4.2 MB), `x2-shiva` and `x2-anima` GPU; held |
| 7 | showpiece blow and who decides it | Memento Mori (the Core, after three Charge Core turns) and Nemo Ante Mortem Beatus: a tone and a shot are a mockup decision (rule 9): **held `breath`** | Nooj's Lightfall is the one candidate: **held `breath`** | Diamond Dust, Delta Attack, Oblivion: three tones: **held `breath`** |
| 8 | what the research says about the air | pyreflies (white-gold motes rising) and our petals: the scene already draws them, so **no embers** | pyreflies in a cave, the plate paints its own motes: **no embers** | the Road is the Farplane's stone, water and flowers; possessed by pyreflies: **no embers** |
| 9 | the plate's shape | pastel luminous plate (mean luminance 0.63, the booth rooms 0.18): the arena grade is a dusk, not a night; the burst lands at 0.93 of the idle frame's height (0.84 under the colossus master) | dark cave, two floor domes at or past the frame's edges: the arena cone is a soft pooled glow | the same sky as V, a dark platform; the burst is above the frame |
| 10 | a hidden twin | none (no hidden chapter plays these combatant ids) | none | none |
| 11 | ids shared with an FFX chapter | none | none | `sandy`, `cindy`, `mindy` are also FFX aeon ids (a figure on the aeon side is tagged as party by the rim code, never as an enemy); the hidden Last Summoning plays them and is never treated |

## 3. What would make this wrong, and what answers it

- A follower fighting a camera the story set: the colossus frame (below) and, found by the review, the Shiva seam's plate B. Ask of every treated chapter with a follower: does a mid-battle script cut to a rig the scene reads by position? (`SCRIPTED_RIGS` is the table; today one row.)
- A follower fighting the colossus frame: answered by the hold (and its numbers pinned in `booth-ffx2-b2-rows.test.ts`); the lift is one line once the follower stands down while `VegnagunColossus.active`.
- A mark of one link outliving its beat: the leading risk of a five-link chain; answered by the real chains in `booth-ffx2-b2-chain.test.ts` (5, 3, 3 links, one clear per later link, the one title last, the HUD in at every link's start), and by job J2.
- A table of the wrong game: the cheer reads the chapter's own game's table (the test pins 3,400 ms for XV and XI).
- The booth pair: every hunk answers true first; job J9 proves the pixels.
- Bytes: the HD-2D look pulls the three girls' lit maps (already shipped) into a chapter that was over B3a before it; disclosed in the handoff, not cured here.
- A hot-pink flower field or a black platform in the arena grade: the offline still (`docs/screenshots/booth-ffx2-b2-plate-grade.png`) is the evidence; J5 is the browser still beside Chapter IV (rule 9).

## 4. Order of work for the FFX lane and the batch after

Answer the eleven rows above for each new chapter before building; row 5 (a camera of its own) was the one that mattered here, and FFX Chapters II (the colossus master pulled past the dome plate, PR-0307), VIII (Evrae's deck camera) and XVII to XVIII (Sin's deck camera, `keepsToday`) will ask it too.
