# Paper preflight: RE parity RC10, lane FFX-N rows N2 and N3 (Doublecast as two picks; the MP is paid at each cast)

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths src/battle/ffx/doublecast.ts,src/battle/ffx/execute.ts,src/battle/common/types.ts`
> classes this as **DEEP** (the FFX CTB engine is a shared system; the combat core's contract file).
>
> **Owner's words.** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-17 "keep going full speed". Decisions adopted: Q20 (the live check of Lulu's Doublecast MP),
> Q21 ("Doublecast as two separate picks (each its own spell and target), the game's composition", yes after Q20, with a mockup of the pick flow first). The wiring plan marks
> lane FFX-N **Bailey first: yes** for the pick flow (a mockup, rule 9): that is the HUD picker, the release driver's job. This lane is the engine half only.
>
> **Verdict: PROCEED** on branch `re-parity-rc10-ffx-doublecast`, cut from `origin/r52-rc` (`3c92b60cc`). Nothing deploys without Bailey's word.

Written 2026-10-17 by the lane (a Sonnet sub-agent of the RE parity session).

## 1. Game case (AGENTS.md rule 14)

**FFX only.** Doublecast is Lulu's FFX command (record 0x3029; chapters 1 to 3 and the later FFX chapters that give her the spells). FFX-2 has no Doublecast; its engine, data and
the FF7 engine are not touched, so `ffx2-atb-golden` and `ff7-golden` must stay byte-identical. The one shared file is `src/battle/common/types.ts` (an optional field, additive).

## 2. The fact the lane stands on (measured, not read)

`D:/Tools/ffx-parity/live/2026-10-17-live-session-4.md`, Case 1, hypothesis H-B, **[M]**: Lulu (Half MP) chose Doublecast, then Fire, then Firaga. The pending MP read 2 and MP went 452 -> 450 at
the first cast; the pending MP then read 8 and MP went 450 -> 442 at the second cast, about 4.6 s later. **Each cast is paid at its own cost check, at its own cost.** This closes FFX-G07
finding 13 / open question 1 (the note could not tell who pays the first cast; the effect scripts were never read).

## 3. What the engine does today (read from the code, then proved by a test before any change)

- `doublecast.ts#resolveDoublecast` resolves **one** spell, named by `AbilityCommand.wrappedId`, twice: each cast gets its own `costGate` (Silence, MP) and `aimGate` (range
  filter), pays `mpCostFor(actor, spell)` through `applyMpDelta` and resolves. So the **timing and the amount are already the game's** for a pair of the same spell: the first cost is paid before the
  first hit, the second after the first cast's hits and before the second cast's, each from the MP that is left. Chapter XVIII's line (D-694; `engine/tactics/sin-face.ts`) submits Firaga twice and its
  own MP rule is `mp >= 2 x Firaga`, which is exactly that arithmetic: **it relies on nothing the lane changes.**
- What it cannot do is the game's composition: two **different** spells, each with its own target. The shape `{ id: 'doublecast', wrappedId, targets }` carries one spell; a second target is read only as
  "cast two goes to the second id".

## 4. What changes

1. **N2, the engine's real model.** `AbilityCommand` gains an optional `casts` (two `{ id, targets }` picks: spell 1 and target 1, spell 2 and target 2). `resolveDoublecast` reads the two casts. The
   existing shape (`wrappedId` + `targets`) stays valid through an **adapter** that produces the same two casts (the old aim rules, including the self-placeholder net and its one engine-side draw, are kept
   draw for draw). A pair of the same spell is event-for-event the log it was.
2. **N3, the MP.** Each cast prices **its own spell** with the modifiers the engine models (Half, One, Magic Booster, Spellspring), at its own cost check. With two spells that is the only change in
   effect: Fire then Firaga pays 4 then 16, or 2 then 8 under Half MP. A second spell that the MP left cannot pay does not start and pays nothing (the sub-action rule of RC7), as the game's cost check.
3. **Presentation.** A pair of two **different** spells opens a second `action-end` / `action-start` bracket for the second spell (like the Omnis volley), so the presenter plays the second spell's own effect;
   a pair of one spell keeps the single bracket it had.
4. **For the HUD** (the driver's mockup-first job): an engine-side pure function for the second pick's rows with the first cast's cost as pending MP (the game's menu-side gate, 0x89ACA0 with the pending
   MP byte), and the list of what the picker needs from the engine in the handoff. No UI file is touched.

## 5. Acceptance

1. A test against an **independent oracle** (the existing `helpers/ffxCommandRig.ts`, which imports nothing from the kernels): Fire then Firaga with Half MP pays 2 then 8 (452 -> 450 -> 442), 4 then 16 without;
   the payments sit at the right place in the event log (before the first hit; after the first cast's hits and before the second's); a second spell the leftover MP cannot pay does not start; the order of
   two spells matters for that; every modifier; Silence; a target the first cast killed.
2. The adapter is equal to the two-pick form for the same spell, on many boards and seeds (event for event).
3. A mutation pass of about 12 faults in the production code, each caught.
4. Goldens: `ffx-engine-golden`, `ffx2-atb-golden`, `ff7-golden`. Expected unmoved: the shipped lines Doublecast the same spell twice, which the adapter keeps byte for byte. Any pin that moves is re-pinned once, with the cause.
5. Measurement: 12 seeds of every FFX chapter and 500 of every chapter whose line Doublecasts, base against tip, whole event logs; FFX has no decision-time pace (it is CTB), so the shipped line is the pace.
6. `tsc` clean, every source file under 400 lines, `node tools/orphans.mjs` clean, `docs/CONTRACT-CHANGES.md` entry.

## 6. Risks

- **A visible change in a shipped chapter.** None expected (see section 3); the measurement is the proof, not the expectation. If a log moves, the first differing event is named and the cause written.
- **The contract field.** `casts` is optional; nothing reads it but `doublecast.ts`. A caller that sends both `casts` and `wrappedId` is read by `casts`.
- **The second bracket.** Only a mixed pair opens it; no shipped line submits one, so no existing log changes. The presenter was not run (the lane never runs the game or the build); the volley is the precedent.
- **The pick flow is not built here.** The HUD still submits one spell twice; the two-pick HUD waits for Bailey's yes on a mockup (rule 9).
- **Merge hot spots**: `doublecast.ts`, `execute.ts` (one call line), `types.ts` (`AbilityCommand`), `docs/CONTRACT-CHANGES.md`.
