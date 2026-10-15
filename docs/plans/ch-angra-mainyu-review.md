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
6. **A seeded sample over the shared pool, reshuffled by the new rows**: it happened. `parity-ffx2-rng-streams` draws 400 actions from every rowed command, and his 13 stand-in rows moved the draw until it held no Steal, so the steal role and its mutant went unchecked (found by the full suite). Its old pool now draws exactly as before and his rows are sampled on their own; the FFX lane's two parity suites were handled the same way for Biran's and Yenke's rows.
7. **A shared readout reading his signature move wrong**: it happened. The browser run showed the move preview printing Perdition's Flame at about half its real hit (the per-hit row divided an aimed volley back, and a volley that kills its aim stops at her HP). Fixed for FFX-2 (one hit estimated per candidate, as the row's own contract says), pinned by a test that fails on the old code; the FFX twin is a follow-up. **The fix reaches other chapters' readouts**: every FFX-2 enemy volley of random hits (Trema's Meteor, the Paragon's Final Impact, Vegnagun's Odi Et Amo and Dies Irae, Shuyin's Run & Slash, Anima's Oblivion, Leblanc's No Love Lost, the Experiment's Rocket Launchers) now prints one hit per girl; no battle changes. The focused review should look at those slabs.

## 3. Reviews owed

A **focused review of the production candidate** before any deploy, then the **deep review on the live build**. Not run in this session: "deploy + review owed" in NOW.md.

## 4. Verdict

Build as built, hidden; ship only through the focused review; list only after the RE session and Bailey's word. Handoff: [ch-angra-mainyu](../handoff/ch-angra-mainyu.md).
