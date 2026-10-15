# Paper preflight: Angra Mainyu, a new hidden FFX-2 chapter (branch `claude/vigilant-galileo-h6yf7j`)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). `node tools/critic-plan.mjs --paths ...` classes this work **DEEP** (the FFX-2 ATB engine's AI table, the chapter registry `encounters.ts`, a shared scene). **Written after the build, not before it**: the session built the chapter first and wrote this file at the end, which is the wrong order under rule 15; the reviews it plans are still owed.

**Authority:** Bailey, 2026-10-15, verbatim: "Implement the unimplemented chapters please." and "Implement the unimplemented chapters end-to-end please. It needs to be a finished product." (D-851, on D-536). **Game case: FFX-2 only.**

## 1. What changes for the chapters that already exist

| Shared piece | Change | Why it is inert elsewhere | Checked by |
|---|---|---|---|
| `battle/ffx2/ai/index.ts` | three scripts registered | a lookup by script id | `aiScriptFor` in the data test; every FFX-2 suite |
| `data/ffx2/enemies/index.ts`, `command-records/index.ts` | one group, 17 abilities, 13 stand-in rows (copies of rows other monsters carry) | new ids only; the copies are clones, never the shared objects | `angra-mainyu-data.test.ts`, `data-ffx2-command-records.test.ts` |
| `data/ffx2/items/held.ts` | the `ribbon` row | a new item id | `ffx2-steal-item-names.test.ts` |
| `scenes/experiment-grounds.ts` | his spot, height and the arms' anchors on the Experiment's plate | keyed by his ids; the Experiment fields none of them | `experiment-scene.test.ts` (updated: one more id on the spot) |
| `data/encounters.ts` | the unions and the number type | type-level only | `tsc`, `chapter-numbers.test.ts` |
| action time | 3 s on his one link | a field of his formation; `ACTION_TIME_ALL_FFX2` unchanged | `trema-options.test.ts` (the allow-list gains his link) |

## 2. Risks and how each is checked

1. **Invented data** (rule 6): no row of his was read. Every number is a source's (tagged with its count), a stand-in row of the game's own table (copied, so it cannot drift), or a stated estimate; the research says so in its first lines, and the handoff carries the verify list and the RE questions. **This chapter should not be listed before the RE session reads his rows.**
2. **The model not doing what the research says**: pinned on the real engine (`angra-mainyu-engine.test.ts`): the Flame's 3/16 and clock, Protect halving it, the guards and Darkness, the revive keeping the guard, Osmose, the arms never deciding the battle.
3. **Difficulty**: measured both ways for action time, never tuned; the bench guards only that the advisor beats the naive line and wins at bench speed more often than not.
4. **The Experiment's plate**: his figure shares the plate; the Experiment's own staging is unchanged (its scene test).
5. **A door that fires another door**: `angra` starts and ends with A; no other word starts or ends with A (`chapter-doors`, `angra-door`).

## 3. Reviews owed

A **focused review of the production candidate** before any deploy, then the **deep review on the live build**. Not run in this session: "deploy + review owed" in NOW.md.

## 4. Verdict

Build as built, hidden; ship only through the focused review; list only after the RE session and Bailey's word. Handoff: [ch-angra-mainyu](../handoff/ch-angra-mainyu.md).
