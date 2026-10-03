# r37-sin-advisor: paper preflight (RUBRIC section 8, `critic-plan` class DEEP after deploy)

Branch `r37-sin-advisor`, worktree `D:/pyrefly-r29-harness`, from `origin/main` c69de96a. 2026-10-03.
**Game case (AGENTS.md rule 14):** the advisor change is **FFX only** (Chapters XVII and XVIII; the files are
`src/engine/tactics/sin-fins-core.ts` and `sin-common.ts`, which only the FFX Sin tactics import, and the FFX-only
`lookup.ts` keys them by game first). The harness change is **both** (shared critic plumbing); the two overlays it
types, Bushido and Swordplay, are FFX only.

## What `critic-plan --paths` says, and why that is the right class

`review: DEEP, before deploy: FOCUSED, after deploy: live verification then the DEEP review (this build owes it)`;
systems "move advisor and enemy intent"; not the save-data class (no `SaveData.ts`, no schema, no settings
persistence), so there is no `-savedata` branch. The shipped files are 3 (`evrae-quiet.ts`, `sin-common.ts`,
`sin-fins-core.ts`); the harness, tests and docs have no product effect.

## What changes for the player

Only the text and row of the NEXT BEST MOVE card (and the strategy panel's NEXT line) on Chapter XVII. The tactic is
the card's top row on every Fins and Genais/Core turn (`advisor.ts` keeps the line on top unless a challenger proves
`saves-from-lethal`), so changing the tactic changes the card. No boss number, no game data, no engine rule, no card
wording changed. Chapter XVIII's tactic (`sin-face.ts`) is not touched.

## The change, and the sourced reason for each part

1. **Heal at the sensible line's lines** (`sin-common.ts#sinCare`): a party heal (Curaga or Pray, Yuna only) when two
   living actives are under 50 % (was 60 %); a single potion on the weakest under 40 % (was 45 %); the bag's Al Bhed
   Potion only as the last resort for that weakest member (it was the first party heal for anyone). Source: the bench's
   sensible line (`tests/unit/helpers/sinFinsPolicies.ts#upkeep`: 0.5 spells, 0.4 items), which is research
   `ffx-sin.md` section 8 played as written. Thresholds are AUTHORED, as they were.
2. **At most two Close in trips and two Mental Break casts per Fin**, and "done breaking" is Armor Break on plus Mental
   Break on or tried twice (`sin-fins-core.ts`; the log counts them). Source: the sensible line's MAX_TRIPS and
   MENTAL_TRIES (research section 8 row 1: Close in, Break, pull back). The old rule walked the ship in and out until both
   Breaks stuck, which the Fin's Negation strips again: 8 trips a Fin on the card against 2 on the line.
3. **At FAR after the trips, Tidus, Wakka and Lulu** (`benchReach`): Auron and Yuna make way for the reach (a switch
   costs no turn). Source: section 4 (only Wakka, Lulu and long-range rows reach at FAR) and the sensible line's `wanted`.
4. **A dry Auron drinks an Ether** for his Break (`breaks`), the carried-seam defect found on 2026-09-29
   (`docs/plans/sin-fins-core-bench.md`).
5. **Link 3's front row** (`swapForPhase`): Tidus, Auron, Yuna while Genais is out and for the Core; Tidus, Yuna, Lulu
   while it is shelled (research section 8 row 4: only Fire answers the shell). The sensible line's `wanted`.
6. **A quiet turn spends no bag heal** (`sinHarmless`): a Cheer stack, a Haste, a spare Potion, then Defend. The
   Evrae ladder it replaces (`harmlessTurn`) drank a Hi-Potion for any scratch and an Al Bhed Potion for two members under 80 %.
   `evrae-quiet.ts` only gained three `export`s; Evrae's own behaviour is byte-for-byte the same.

## What could go wrong, and what proves it did not

| Risk | Check |
|---|---|
| Another FFX chapter's card changes | Nothing outside the two Sin files calls `sinCare`/`sinHarmless`; `tests/unit/tactics-lookup.test.ts` (60) and the `evrae-*` tests stay green; XVIII's tactic is not edited |
| A stall (a loop that never hits) | the first draft stalled 12 of 40 chains (6 on link 1, 6 on link 2: Auron kept in front at FAR with no trips left); `benchReach` now lets Auron and Yuna leave once no trip is owed. The bench prints `escape` as its own cause: 0 in the final 200 |
| The line only wins because it is easier | it is the same boss and the same engine; nothing in `src/battle` or `src/data` moved; the sensible line's own numbers are re-run beside it |
| Overfit to the bench's 200 seeds | the build seeds 1 to 200 were used to find causes, the final read is the same 200 plus the worker-path run of the game's own v4 card; seeds 201 to 400 are run as a held-out set (see the handoff) |
| The card text says something the line no longer does | the guide rules for `sin-fins-core` (`src/data/guides/`) name Close in, Break, pull back and Cheer/Haste at range, which still hold; no rule text changed |

## What is NOT claimed

The chapter does not reach the project's 90 % bar as one chain on this change (the Genais Sigh wipes at link 3 are the
largest remaining cause); S-12 (Negation) and the carried bag are Bailey's open levers, not touched. D-282 (Sin's
difficulty) is only proposed, nothing here retunes Sin or any boss.
