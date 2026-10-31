# Paper preflight: the booth treatment reaches Chapters III, XII and XIV (Braska's Final Aeon, Seymour Omnis, Isaaru), FFX only

> The paper preflight AGENTS.md rule 15 asks for before a change `tools/critic-plan.mjs` classes as deep. It follows the list `docs/plans/booth-leblanc-review.md` section 4 left for "the next chapter that joins" (does it chain, which victory kind, which dresses have rows, do its foes yield, which maps exist, what is its showpiece and who decides it, what does the research say about its air, what is its plate's shape, does it have a hidden twin) and the rows `booth-ffx-yunalesca-review.md` added (does one foe change its painting inside the fight; is the chapter in `SwapSwitch.SCOPE_EXCEPTIONS`; how much slack does its plate have for a directed camera; do the boss footprints exceed the engine's own pool). Written during the build, 2026-10-30, from reading the code and running the real engine; docs only.

```
node tools/critic-plan.mjs --paths src/engine/motion/DemoGate.ts,src/engine/look/LookConfig.ts,src/engine/look/LookGrades.ts,src/engine/look/LookGradesBold.ts,src/engine/look/LookBoldConfig.ts,src/engine/look/pro/ProGrade.ts,src/engine/look/pro/ProGradeFfx.ts,src/engine/look/pro/RimFigures.ts
  review:       DEEP (a FOCUSED review of the production candidate before the deploy; the deep review on the live build)
  because:      3 substantial checkpoints since the last deep review
  systems:      effects, lighting and sprites
  games:        both (shared plumbing); the three chapters themselves are FFX only
  checks:       CHK-008 013 016 017 020 021 026 027
  static:       pose-census (needs public/art)
```

## 1. What the change is

Three lines in `DemoGate.TREATED_CHAPTERS` (`braskas-final-aeon`, `seymour-omnis`, `isaaru-via-purifico`, `ffx`, `r71`), three one-piece holds in `PIECE_HOLDS` (`breath`), the look rows (`CHAPTER_LOOKS`, `ROOM_LOOKS`, `BOLD_ROOMS`, `ROOM_BOLD`) and the arena rows (`PRO_ARENA`, in `ProGradeFfx.ts`) for `dreams-end`, `garden-of-pain` and `via-purifico`, and 19 ids in `RimFigures.TREATED_RIM_FOES`. No switch module and no shared plumbing function changes. See [booth-ffx-b3b](../handoff/booth-ffx-b3b.md).

## 2. What is NEW in these three chapters that the chapters treated so far never had (each one is a place the treatment can break)

| # | the chapter differs by | the piece it can break | where it is pinned |
|---|---|---|---|
| 1 | **seven chained links on one presenter and one layer** (III), three (XIV): every `victory()` beat runs at a seam | the ending piece: a title, a HUD-out or a freeze left standing for the next link (the Leblanc critical, C1) | `booth-ffx-b3b-chain` runs the REAL chains with each link's foes staged on the fake stage (the stub of the earlier chain tests hides the freeze in every later link): no ending cue before the last link, one clear per later link, the HUD at 1.0 at every start |
| 2 | **one foe changes its painting inside link 1** (Braska's Final Aeon, `-1` to `-2`) | a freeze or a title at a form change | the same real chain with `setArt` hooked; `stageFreeze`'s `form-change` guard (batch 2) |
| 3 | **a foe that stays on the field** (XIV: Isaaru is untargetable, has no turn, never a victory condition, and stands when his aeon falls) | the freeze at the last blow and the ribbon: which foe is "first", whether a last foe exists | the real chain: the freeze fires once at Spathi's last blow; the ribbon names Isaaru (slot 0) at every link, with no bar (Scan-immune), the chapter's own title |
| 4 | **a one-girl party** under the FFX HUD (XIV) and **aeons as the only actors** | the party plates, the turn strip, the command block, the director's shots (the real shots are heroes') | job J1 (the HUD read), J2 (the camera); `characterOf` already hands an aeon the default hero's shot, as Chapter I's aeons get it |
| 5 | **giants** (III: the aeon at 6.919 units, the Pagodas 5.7 and 6.3, behind him) | the directed camera's never-crop fit (capped at 1.8 times back), the boss mask, the shadow | the offline read of the real shot code on the live stage against Chapter I (`booth-ffx-b3b-classes`); no `BOSS_FEET` rows (measured) |
| 6 | **five foes under one ribbon and card** (XII: Omnis and four disc parts) | which foe the ribbon names; markers on parts that never die | the real chain's `headlineEnemy` read (Omnis; parts are skipped); the discs are figure-less anchors, so no rim to flag |
| 7 | **plates of three shapes**: Dream's End and the Garden 80 wide at z -50 (slack), the Via 40 wide at z -20 (Macalania's solve, the tightest) | the directed camera's real shots laid on the stage | `cam-sim-tmp.mjs` (the real code, relative to Chapter I); job J2 reads the Via first |
| 8 | **a foe whose art is translucent** (XIV's three aeons: 25 to 31 percent partly transparent) and **one with a pale fringe** (Omnis +24.8) | the screen-space rim as a second glow; a visible matte edge | flagged rim-off by combatant id (the Shiva and Anima rule and the mirror of the party's own aeons); no re-cut is built (art write); J1 (b) |
| 9 | **a reserve party the KO cut can reach** (III and XII field seven; Rikku, Kimahri, Wakka and Lulu step further at the hurt-to-KO cut than the passing Dark Knight) | the moments piece's KO hard cut past the smear cap (the Leblanc Rikku Thief) | the offline estimate calibrated on the three measured FFX-2 dresses (`booth-ffx-b3b-classes`): the active parties pass, the reserve is the approved Chapter I's own; J5 reads each |
| 10 | **sourced showpieces with no staging** (Ultimate Jecht Shot, Ultima, Spathi's Countdown and Mega Flare) | the held breath and `HEADLINE_BLOWS` (a tone and a sound are picks) | the breath is held in each, candidates named (rule 9, rule 6); `bigMoveOf` stages Mega Flare for FFX-2 only |
| 11 | **no swap exception** (none of the three is in `SCOPE_EXCEPTIONS`) | the smear, stance and cause picks (Chapter II's lesson) | `booth-ffx-b3b-rows` (the scope lists) and the shared `booth-hold-guard`: no `smear` hold is owed |
| 12 | **the listed record is not the shipped one** (XII and XIV register a placeholder scene; the ship layer sets `garden-of-pain` and `via-purifico`) | tests that read the raw record and the rows keyed by the wrong room | every test reads `getChapter(id)`; `booth-ffx-b3b-rows` pins the scene key per chapter |

## 3. What would make this wrong, and what answers it

- A mark of the ending at a seam or a form change: rows 1 to 3 (the real chains).
- A booth-pair frame that moves: the shared matrix (`booth-treated-switches`), `booth-b2-off-words` over every joined chapter, and job J10 against release 70.
- A table of the wrong game: `booth-ffx-b3b-switches` (FFX's HUD, profile, staging, fx and pass games) and the registry test.
- A directed shot that shows a plate's edge or crops the caster: row 7, the held piece falls back to today's rig, one row.
- The knock-out's cut past the smear cap: row 9, one row.

## 4. Order of work (for the next chapter that joins)

Add rows 3, 4, 5 and 9 to the list in `booth-leblanc-review.md` section 2: does a foe stay on the field after the last one falls; how many party members can the chapter field and which dresses or figures step furthest at the KO cut; is the boss a giant the fit cannot hold inside 1.8 times back; is the listed record the shipped one.
