# Paper preflight: FFX-2 action time per command (re-parity lane X2-A, row XA6, slice A)

> `critic/RUBRIC.md` section 4, AGENTS.md rule 15: paper only, written before the code is committed.
> `node tools/critic-plan.mjs --paths src/battle/ffx2/action-span.ts,src/battle/ffx2/kernel/action-span.ts,src/data/ffx2/action-frames.ts,src/battle/ffx2/execute.ts,src/battle/ffx2/action-time.ts,src/battle/ffx2/reaction.ts`
> classes this as **DEEP** (FFX-2 ATB engine, FFX-2 game data).
>
> **Owner's words:** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-18 "keep going full speed". The house rule for any change that moves how a
> whole game plays: build it behind a switch defaulted OFF, measure it, then ask Bailey once. **This lane builds and measures; it does not turn the switch on.**
>
> **Game case (AGENTS.md rule 14): FFX-2 only.** FFX is CTB and has no per-actor motion machines, no effect modules and no action-executing flag
> (note FFX2-G11 line 3). Nothing here touches an FFX file; `ffx-engine-golden` and `ff7-golden` must stay byte-identical.
>
> **Verdict: PROCEED**, behind one switch (`ACTION_TIME_PER_COMMAND`, OFF), under the conditions in section 5.

## 1. What changes

Today an FFX-2 command takes no time unless a switch says so (`ACTION_TIME_ALL_FFX2` is off; Chapters XI, XIII, XVI, the hidden Tourist Trap, Angra Mainyu
and Valefor formations carry a flat 3 s; `action-time.ts` carries a flat 1.5 s estimate). The game's own scripts say a command takes the time of its
animations: a physical command is the idle break, the run-up and the attack clip up to the hit; a charge kind is the effect module's timeline from the
release (note FFX2-G11 section 2). Slice A replaces the flat figures with a span per command, through the existing executing countdown
(`execute.ts#finishAction`, `gauge.executing`), behind ONE new switch.

| Piece | File | Size |
|---|---|---|
| Numbers: frame tables of 54 girl and 36 monster motion sets, motion-type bits, run numbers, 488 command rows' class and effect, 3 measured effect lengths | `src/data/ffx2/action-frames.ts` (new, generated, numbers only) | 221 lines |
| Maths: span of a physical command and of a charge kind from body, ratio, class | `src/battle/ffx2/kernel/action-span.ts` (new, pure) | about 150 lines |
| Adapter: body of a unit, class of a command, precedence of the switches, measurement knobs | `src/battle/ffx2/action-span.ts` (new) | about 200 lines |
| Wiring | `execute.ts#finishAction` takes the played command; `action-time.ts` gains the constant; `reaction.ts` exports `ratioOf` | a few lines |

`engine-core.ts` and `internal.ts` sit at 399 lines and are not touched. No contract file changes shape (`Ffx2EngineOptions.actionTimeSeconds` is kept and
still wins), so no CONTRACT-CHANGES entry is needed beyond a note that the per-command switch exists.

## 2. What it must not do

- **Switch OFF is the base, byte for byte.** `actionStepsFor` returns `actionTimeSteps(...)` unchanged when the switch is off. Proof: every FFX-2 chapter at 12 seeds
  compared against the base commit (event logs identical), `ffx2-atb-golden` unchanged, plus the repo's own pinned tests.
- No random number is drawn: the idle break is the expectation (half a clip), not a script draw, so every stream stays where it was.
- No boss or party number is changed. Spans lengthen turns; difficulty will move; the lane measures and reports, never retunes.
- Slice B1 (the global executing flag that freezes group-2 counters) and B2 (moving hits to their real steps) are NOT in this slice.

## 3. Where the risk is

1. **The effect length is the biggest term and the least known.** Three effects are measured (Fire 75, Umbral Gaze 94, Strength Up 84 steps, release to completion);
   every other effect takes a class default (75 for a girl's cast, 94 for an enemy's). Labelled estimate in data and handoff. A live stopwatch session
   (note FFX2-G11 section 7 item 5) replaces it.
2. **The run-up** has no readable duration (the movement driver's profile was not read). The span uses the macro's run speed as field units a second, the
   median girl-to-monster distance of the 35 scenes (52.4 units) and no acceleration or turning: a lower bound. Labelled estimate.
3. **Haste on an effect is unknown.** The clip terms halve; the effect term does not. Labelled.
4. **Formations with a flat 3 s** (six of them) are superseded when the switch is on. This is a design choice recorded for Bailey; a measurement arm keeps the flat
   value to show what each choice costs.
5. **Double counting.** The measured effect totals run from the release to the completion and so include the measured body's own start gate; the span adds
   no gate term. A monster's idle break before the command (or at the gate, class 0x1F) is outside the measured window and is added.

## 4. How it is proved

- Hand checks of the maths for three girls and three bosses from the data's own numbers (kernel tests).
- A mutation pass of about 12 faults in the kernel and adapter, each caught.
- Switch-off equivalence: 12 seeds of every FFX-2 chapter, event logs against the base commit; the golden suite file; the existing action-time tests.
- Switch-on measurement, the main deliverable: every FFX-2 chapter at 500 seeds at three paces (human Wait split, Active, bench), first-try wins and minutes
  a fight before and after, causes in player words; ablation at 200 seeds, human pace: physical spans only, cast spans only.

## 5. Conditions

Switch OFF in the commit; `tsc` clean; the targeted vitest files for what is touched pass; `node tools/orphans.mjs` shows the new modules imported; every
estimate labelled in the data, the code and the handoff; a CHANGELOG paragraph is offered in the handoff for the case Bailey turns it on (lanes never write
CHANGELOG.md, NOW.md, ACTIONS or DECISIONS).
