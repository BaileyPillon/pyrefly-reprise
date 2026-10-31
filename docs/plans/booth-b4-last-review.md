# Paper preflight: the booth treatment reaches the last five listed chapters (Evrae, Sin's face, the Mirror Aeons chapter, Ixion at Djose; Sin's Fins and Core stays out)

> The paper preflight AGENTS.md rule 15 asks for before a change `tools/critic-plan.mjs` classes as deep. It follows the list `docs/plans/booth-leblanc-review.md` section 4 and the rows `docs/plans/booth-ffx-b3b-review.md` section 4 added (does a foe stay on the field, who can be fielded, is the boss a giant). Written before the build, kept after it; where the build found something the paper missed, the last section says so.

```
node tools/critic-plan.mjs --paths src/engine/motion/DemoGate.ts,src/engine/motion/PieceHolds.ts,src/engine/motion/PieceHoldsLast.ts,src/engine/look/LookConfig.ts,src/engine/look/LookGrades.ts,src/engine/look/LookGradesBold.ts,src/engine/look/LookBoldConfig.ts,src/engine/look/pro/ProGrade.ts,src/engine/look/pro/ProGradeFfxLast.ts,src/engine/look/pro/RimFigures.ts
  review:       DEEP (a FOCUSED review of the production candidate before the deploy; the deep review on the live build, which this build owes)
  because:      a deep review is still owed from 6321b2578
  systems:      effects, lighting and sprites
  games:        both (shared plumbing); Chapters VIII, XVIII and 27 are FFX only, Chapter XVI FFX-2 only
  checks:       CHK-008 013 016 017 020 021 026 027
  static:       pose-census (needs public/art)
```

## 1. What the change is

Four lines in `DemoGate.TREATED_CHAPTERS` (`evrae-airship`, `sin-face`, `mirror-aeons` FFX; `ffx2-ixion-djose` FFX-2; `since: 'r71'`), their written holds in one new data file (`PieceHoldsLast.ts`, spread into `PIECE_HOLDS`), the look rows for the two deck rooms only (`CHAPTER_LOOKS`, `ROOM_LOOKS`, `BOLD_ROOMS`, `ROOM_BOLD`, two arena rows in `ProGradeFfxLast.ts`) and two rim flags. No switch module and no gate function changes. Chapter XVII is decided out, in `NOT_YET`.

## 2. What is NEW in these chapters that the chapters treated so far never had (each is a place the treatment can break)

| # | the chapter differs by | the piece it can break | where it is read |
|---|---|---|---|
| 1 | **the deck is the range director's**: it replaces the scene's `idle`, `action` and `enemy` rigs with NEAR's and FAR's and refits NEAR to the window's shape (VIII, XVII, XVIII) | the directed camera laid over a camera the scene already authors | `cam` held in all three; the lift job reads the shots at both ranges |
| 2 | **non-standard pose sets**: Evrae's `idle-near`, `idle-far`, `breath-charge`; Sin's face `idle` and `stage-0` to `stage-4` with no attack, hurt or ko painting | curves, the smear's head registration, the ending's freeze on a foe with no ko painting | the pieces that name a pose, read in the handoff section 4; the real chains' freeze and title on the right foe |
| 3 | **chapter-specific standing HUD panels**: Sin's clock column and Gaze pill (XVIII), the Fin plate (XVII), the order widget's chip (VIII) | the F1 slab (the r70 majors of IX and XII were this class) | the F1 zones from the real stylesheets against each panel (`booth-b4-last-classes`), the instrument validated on IX's gauge first |
| 4 | **plates of very different brightness**: 0.373 and 0.388 (the deck), 0.659 (Sin's flight), 0.600 (the Mirror's road), 0.265 (Ixion's) against the Farplane's 0.628 that clipped | the bold look clipping a bright plate to white (V and XI) | the plates' means and the engine's LUT beside Chapters I and II; the over-240 share at the first menu is a job |
| 5 | **two plates under one room key** (the Mirror Aeons chapter), the grade applied once at the scene's entry | one room row cannot grade a daylight road and a cavern | `hd2d`, `arena` and `card` held with the picture of the problem |
| 6 | **a provisional plate** (Ixion) and a **swap exception** (Sin's face, Ixion) | rows graded on a painting that will change; the smear planner's cuts by the side door (Chapter II's lesson) | `hd2d`, `arena` and `cam` held for Ixion; `booth-hold-guard` for the smear |
| 7 | **a foe that sinks, a foe that falls away, a mouth clock that ends in a scripted Game Over** (Evrae, the Fins, Sin's face) | the freeze's ring where the chest was; the defeat card for a scripted loss | the real chains of the shipped fights; the ring's origin is a job |
| 8 | **a two-link chain with a plate swap under a white pulse** (Mirror) and a **one-link chain with a long story close** (Ixion) | a title or a sunk HUD at the seam (the Leblanc critical, C1); a mark left over into the post scene | `booth-b4-last-chain` (two links); the post scene's start is a job |
| 9 | **seven fieldable FFX members** (VIII six, XVIII and 27 seven) and **FFX-2 grids offering Gunner and Thief** | the moments' KO cut past the smear cap | `moments` held in all four |
| 10 | **translucent and pale-fringed art** (Ixion +28.7 with 58 percent partly transparent; Overdrive Sin +15.5; Evrae -2.4) | the screen-space rim as a second glow or a visible fringe | Evrae and Sin flagged rim-off; the re-cut candidates named, not built |

## 3. What would make this wrong, and what answers it

- A mark of the ending at a seam: rows 7 and 8 (the real chains, shipped HP).
- A booth-pair frame that moves: the shared matrix (`booth-treated-switches`) and `booth-b2-off-words` over every joined chapter.
- A table of the wrong game: `booth-b4-last-wiring` (each game's mount, makeup and cue) and the registry test.
- A plate that clips: row 4; the two rooms with rows are the two under 0.4; the others hold the look.
- A panel over a card or a foe: row 3, offline for the standing panels, a job for the rest.

## 4. What the build found that the paper missed

- **The Fin plate sits on the F1 turn strip** (row 3 expected a risk, not a 51-grid-px overlap): Chapter XVII is out. The instrument reads release 70's IX gauge as the overlap the r70 run saw, so the number is not an artefact.
- **The grade LUT alone does not clip even the Farplane's plate** (mean 0.557, nothing over 0.92): the r70 halo came from the bold pass, so the plate's mean is the offline proxy and the over-240 share at the first menu a job (row 4 reworded).
- **Evrae's shipped fight, Sin's face and Ixion all win on seed 1 and the Mirror pair on seed 2**, so the chains run on the shipped HP, not on a weakened foe.
