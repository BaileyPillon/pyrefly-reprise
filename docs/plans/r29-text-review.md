# r29-text paper preflight (rule 15)

Branch `r29-text` from main c9c1c295, 2026-09-28. `node tools/critic-plan.mjs --paths ...` classes the change
as **deep** (`src/story/dsl.ts`, `src/story/runner/CutsceneRunner.ts` = scene runner; `resultsMath.ts`,
`MoveAdvisor.ts` = global layout). Defect fixes for critic round 15 only; no new screen, setting row or gameplay
(rules 9 and 10). Every item is a wording, a tag or a hidden line that restores the documented intent.

## What each change touches, what could break, how it is checked

| Issue | Game case (rule 14) | Change | Risk | Check |
|---|---|---|---|---|
| PR-0234 hit chip + reason | both (the card is shared; Talk/Orders are FFX, the chip rule is game-free) | `MoveAdvisor.statsHtml` prints `always hits` only when the row's estimate is damage; `advisor.tacticSuggestion` swaps the fallback reason for the chapter guide's own hint, else "The chapter's own line" | a damage row still shows the chip; a can-miss row still shows N% | unit test on the card HTML and on Ch X / VIII / XIV first cards; a headless first-menu screenshot |
| PR-0235 Darkness cost | FFX-2 only (Dark Knight; `research/ffx2-combat-core.md` Darkness row, verified 2 sources); the warning path is shared but only Darkness reaches it | `scoreOutcome` warning names the payer and the % of max HP from the simulation's own `hpDelta` | a Zombie-heal warning must keep its own text (it is set first) | unit test on a Darkness board |
| PR-0239 rail vs card | FFX-2 only (ATB has a menu open while a command charges, `ffx2-combat-core.md` 1.1) | `guide-inflight.healInbound`: the rail defers when the line's pick is a heal and a heal (party-wide, or same target) is charging or held | hides NEXT slightly more often on FFX-2; FFX has nothing in flight so it is untouched | unit test with an engine board, plus FFX no-op |
| PR-0241 no AP reason | FFX only (`ffx-combat-core.md` 10.1: KO'd, petrified or switched out on the first turn earn nothing); FFX-2 rows carry EXP for the party so are not touched | `buildMemberRows` sets `noAward`; desktop row appends it to the detail line, the phone chip prints a short tag | phone chip width (390 px); 'OUT' vs the exact state (the result cannot tell KO from petrify) | unit test on rows; 1600x900 and 390x844 screenshots |
| PR-0230 coda caption | FFX-2 only (Chapter V) | additive optional `place` on the existing `backdrop()` step (and its port); the coda sets "The Farplane Glen" (`ffx2-vegnagun-shuyin.md` 9.4, 0.4; writing-bible E5-CODA rule 5) | shared contract (`dsl.ts`); logged in CONTRACT-CHANGES; an unimplemented port ignores it | unit test on the builder, the runner, the eyebrow and the script; the Shuyin scene keeps the chamber caption (untouched) |
| PR-0231 Auron callout | FFX only (Chapter III, CTB) | one line of text: "It hits all of us. Keep everyone up." (Blade Blitz hits the whole party, `ffx-bfa-yu-yevon.md` row 137) | none | script test |
| PR-0161 Farplane voices | FFX-2 only (Chapter V; FFX ids inside an FFX-2 chapter are voices, `fieldedSpeakers.ts`) | `DialogueBox` takes the game; an FFX voice id in an FFX-2 box gets the plate FARPLANE and a faded portrait class | FFX Jecht/Braska/Auron lines must keep 'Final Aeon' / 'High Summoner' | box unit test in both games |
| PR-0058 role plates | FFX-2 only (Shinra, Brother, Buddy are FFX-2 crew) | three entries in `SPEAKER_ROLES`: GULLWINGS; no portrait added (rule 8) | Brother's FFX Evrae lines use id `brother`, not `brother-x2`, so they stay bare | test |

## Method note

Nothing here re-tunes a boss or a number. The advisor edits stay small (the fallback constant, one helper, one
extra `ctx` field) so branch `advisor-v4` merges; `src/engine/tactics/advisor-v4/` and `src/app/advisorV4/` are not touched.
