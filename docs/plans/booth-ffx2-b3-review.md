# Paper preflight: the booth treatment reaches Chapter XIII (Trema, Cloister 100 of the Via Infinito), FFX-2 only

> The paper preflight AGENTS.md rule 15 asks for before a change `tools/critic-plan.mjs` classes as deep. Written 2026-10-30 as the rows were built (the code-reading in section 2 came first, and rows 5 and 12 are what put the directed camera and the knock-out's cut behind holds); it answers the questions `booth-leblanc-review.md` section 4 and `booth-ffx2-b2-review.md` section 2 left for the next chapter that joins, and adds the four defect classes the first two batches' jobs found (a script cutting a rig over the follower, a retarget cropping a figure, a knock-out cut over the cap, a form change cueing a freeze). Docs only.

```
node tools/critic-plan.mjs --paths src/engine/motion/DemoGate.ts,src/engine/look/pro/ProGrade.ts,src/engine/procam/ProAutoStage.ts,src/engine/look/pro/RimFigures.ts,src/engine/look/LookGrades.ts
  review:       DEEP (focused before deploy; the deep review on the live build)
  games:        both (shared plumbing); the chapter is FFX-2 only
```

## 1. What the change is

One line in `DemoGate.TREATED_CHAPTERS` (`ffx2-trema`, FFX-2, `since: 'r71'`), three holds in `PIECE_HOLDS` (`cam`, `breath`, `moments`), and the data rows the room needs: the HD-2D look and its bold grade (both looks), the room's bold facts, the pro arena with its cone, the follower stage and its stand-down on the kill link's rig (both dormant behind the `cam` hold), the rim-off foes. No gate code changes: the 14 switch modules already ask `isTreatedChapter(id, piece)`. See `docs/handoff/booth-ffx2-b3.md`.

## 2. The questions, answered for Chapter XIII (each is a place the treatment can break)

| # | question | Chapter XIII |
|---|---|---|
| 1 | chains? how many links on one presenter and one layer | **2** (Oversoul Paragon, then Trema) |
| 2 | victory kind | `hold` (`research/ffx-vs-ffx2-presentation.md` 2.2 and `ffx2-trema.md` section 13: no pose after a Via Infinito special boss on a first defeat): the quiet title and the silent pull-back, no cheer |
| 3 | dresses with a decoded real-clip row | **none of the three**: Yuna Dark Knight, Rikku Alchemist and Paine Dark Knight; the dress guard keeps the White Mage, Dark Knight (Rikku) and Warrior rows off them (house curves) |
| 4 | foes that yield, dissolve or stay | **both are `'held'`** (beaten and left standing, dimmed): Paragon is broken by the old man of the kill link, Trema answers Yuna and fades in the post scene (`research/ffx2-trema.md` section 2 steps 2 and 4). The freeze on Trema's last blow is therefore a job (J4) |
| 5 | **a camera of its own** | **YES, twice.** (a) Paragon's giants frame (`fx/mix/giants.ts`, D-316): the follower's fit sits on its cap and Paragon's cast painting passes the frame's top by three times what the approved frame costs: **held `cam`**. (b) The kill link cuts the camera to `trema-link`, and the scene starts the old man's entrance only while the camera is within 1.2 of that rig: `SCRIPTED_RIGS` row built and pinned (dormant behind the hold) |
| 6 | maps that exist unshipped, and are they current | **none exist**: Yuna Dark Knight (16 poses), Rikku Alchemist (16), Paragon (4), Trema (4) and the room are GPU, the driver only; Paine Dark Knight's ship. The girls are lit by one of three, and the room has no depth map |
| 7 | showpiece blow and who decides it | Trema's Meteor (twice) and Ultima, Oversoul Paragon's Final Impact: three tones, a mockup decision (rule 9): **held `breath`** |
| 8 | what the research says about the air | "Pyreflies and Yevon flags are everywhere" (a single source) and the canon table marks the room `attested`: **no embers** (flags and pyreflies, no fire); the stage adds its own lens band |
| 9 | the plate's shape | the Bevelle plate repainted: Chapter IV's plane, idle rig and party slots, so the booth rows' geometry carries over; the skylight is above the frame at the idle rig, so the cone starts at the top edge |
| 10 | a hidden twin | none (no hidden chapter plays `paragon` or `trema`) |
| 11 | ids shared with an FFX chapter | none |
| 12 | a knock-out cut the harness would not excuse (new since batch 2) | **the three dresses' KO bodies are longer than the longest the harness has passed** (0.900, 0.896, 0.918 of the idle height against Chapter IV Rikku Dark Knight's 0.859, read 0.48 against the cap 0.5): **held `moments`** |
| 13 | a form change that could cue a freeze (new) | none: the FFX-2 engine emits no `form-change` in the real chain (the test reads every event) |
| 14 | a swap-scope exception that must hold `smear` (new) | none: `ffx2-trema` is on the wide list, not an exception, so the smear plays |

## 3. What would make this wrong, and what answers it

- A follower fighting a camera the story set: the kill link's `trema-link` rig (row 5b). Answered at the follower with the real classes (0 of 480 frames within the beat's radius without the stand-down, 480 of 480 with it; the camera closest 2.18 and 2.58) and held behind `cam` today.
- A follower fighting the approved giants frame (row 5a): answered by the hold; the numbers are pinned in `booth-ffx2-b3-rows.test.ts` so the lift is a decision against figures, not a feeling.
- A mark of one link outliving its beat: the real two-link chain in `booth-ffx2-b3-chain.test.ts` (one clear, the freeze once, the one title last, the HUD in at both links' start).
- A knock-out cut over the cap: held; job J7 reads each girl's cut.
- A freeze on a man who is about to speak: the ending stays on (the booth's own piece), job J4 reads it, the fallback is one row.
- The booth pair: every hunk answers true first; job J9 proves the pixels.
- Tests that used a chapter as an untreated control: `booth-b2-off-words` used Chapter XIII as the FFX-2 control; it now reads the hidden `ffx2-valefor-besaid`, which never joins (the swap scope is compared by its own list, not against the control).

## 4. Order of work for the batch after

Answer rows 1 to 14 for each new chapter before building; rows 5, 12 and 4 were the ones that mattered here. FFX Chapter III (Braska's Final Aeon, a form boss) will ask row 13 for real.
