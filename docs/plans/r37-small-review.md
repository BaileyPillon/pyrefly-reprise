# Paper preflight: r37-small, the approved small items lane

Paper preflight under AGENTS.md rule 15 and `critic/RUBRIC.md` §4, written 2026-10-03 by a
Sonnet sub-agent of the driver session, before the final gates. Branch `r37-small`, from
`origin/main` `d154486c`. Not deployed.

`node tools/critic-plan.mjs --paths <the 20 changed src and research files>` says **DEEP**,
**after** the deploy (before the deploy: a **focused** review of the production candidate),
obligations live + focused + deep, checks CHK-001 to CHK-010, CHK-015 to CHK-017, CHK-019 to
CHK-023 and CHK-B1, targets audio, fight, pause, phone, presentation, "+ audit every changed
data value against research/". Why: `AudioManager.ts` (audio routing), `results.ts` (FFX CTB
engine), `lineCardPlacement.ts`, `pause-eye-candy.css` and `phoneFraming.ts` (global layout) and
the unclassified `src/ui/coach/`. **No item is save-data class**: `SaveData.ts`, the save schema,
the migration and settings persistence are untouched (the coach seen-set is a free-form string
array; `ALL_COACH_IDS` only feeds the old-save veteran migration), so nothing goes to a
`r37-small-savedata` branch.

Bailey's words behind each item are in `D:/Tools/pyrefly-scratch/2026-10-03/backlog/backlog.json`
and quoted in `docs/handoff/r37-small.md`: D-216 and D-248, D-247, D-249 (Q12) are item-specific
yeses; the rest are class A defect repairs under "Focus on meeting all score thresholds
iteratively. Godspeed. I have plenty of usage." (2026-09-26).

## Game case per item (rule 14)

FFX only: the Chapter XII disc line, Chapter III's 0.6 card, PR-0324, PR-0258, the Kimahri horn
note. FFX-2 only: the Chapter XI KO framing weight, the FFX-2 end-of-fight sweep, the Chapter V
Bulwark record. Both: the title cue (shared plumbing, the title is game-less) and the EYE CANDY
page copy and contrast (one shared page).

## What could go wrong, and what guards it

1. **Disc line (coach).** It could fire in the wrong chapter or twice, or steal the first menu's
   confirm. `topRowDiscTurn` is `null` unless the board carries `omnis.discs` (Chapter XII only);
   the mark is in the seen-set after one showing; it is raised after the HUD has been handed the
   menu, in the same turn, and `CoachMark`'s capture-phase confirm takes the press exactly as the
   other FFX lines do. Browser, real keys: it fired at the second menu (Wakka's, top row Attack to
   Mortiphasm A), one Enter dismissed it, and the next disc row did not repeat it. Unit: Chapter I,
   coaching off and an empty card stay silent.
2. **Chapter III 0.6 card.** A larger-than-needed change of the card for other beats. The override
   is a name set (`bfa-talk`), read in `beginBeat`; every other beat and every phone is the old
   pick. Browser: 0.6 at 1280x720, 1600x900 and 2000x1012.
3. **Title cue.** A cue that never plays, or one that delays the screen. The wait is not awaited by
   `advance()`, it is capped at 1.2 s, and the first sprite alone is waited for. Measured: no delay
   plays from the sprite at 0.88 s; a 300 ms delay plays from the sprite at 1.26 s; 900 ms and 5 s
   delays play nothing, never the synth. The synth-only build still plays its synth.
4. **EYE CANDY page.** Longer value strings overflowing a phone row, and the contrast tint
   flattening the hierarchy. Browser at 1600x900 and 390x844: no overflow, dim and OFF text 3.1:1 or
   better measured from the screenshot's own pixels (worst case the phone over Yuna's bright
   painting, 3.1; desktop 3.6).
5. **PR-0324 and PR-0258 (FFX data and text).** PR-0258 moves FFX rewards and so the engine
   goldens. The multiplier is sourced twice (`research/ffx-vs-ffx2-presentation.md` §9, and each
   chapter's drop row); it draws no RNG; with it stubbed to 1 the golden file is 18 of 18 on the
   old values, and with it on exactly Anima's two digests move (the line overkills a Guardian),
   re-pinned with that reason. Gil, steals and equipment are untouched.
6. **Chapter XI framing.** A KO weight leaking to other chapters. The scope is the road's own
   enemy ids on an FFX-2 board; tests show Chapter IV, Chapter V and an FFX board keep the party
   weight. Browser: at 390x844 and 360x780 the Shiva framing already shows every figure, so the
   slide did not move (before equals after); the effect shows only when they do not fit. Honest
   limit: unit-proven, not shown moving in a browser.
7. **FFX-2 end of fight and Bulwarks.** The sweep must not hide a line the player is reading
   (an escape keeps its line and loses only its menu), and the record change must not change a
   fight. Test red with the sweep off, green with it on; browser Chapter IV seed 9 at fast
   playback: "Bahamut 5" was up at the deciding KO before, down after. Bulwarks: 40 chains
   byte-identical old against new, 40 of 40, on main's engine.

## What the focused review should look at

The five perceivable items on the production candidate at 1600x900 and 390x844: Chapter XII's
first Wakka menu (the line, one confirm, no repeat), Chapter III's Talk beat card, a fresh-profile
title press (audio debug `sfxLog[0]` is `via sprite` or empty, never `synth`), the EYE CANDY page
after ALL OFF, and FFX-2 Chapter IV seed 9's victory beat. CHK-001 should clear on the title cue.

## Rollback

Each item is its own commit on `r37-small`; none depends on another. The riskiest to revert
alone is PR-0258 (re-pin the Anima goldens back with it).
