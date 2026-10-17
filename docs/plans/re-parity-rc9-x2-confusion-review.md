# Paper preflight: RE parity RC9, lane X2-H, Confusion's own pick (FFX-2 only)

> `critic/RUBRIC.md` section 4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths src/battle/ffx2/engine.ts,src/battle/ffx2/kernel/confusion-pick.ts,src/battle/ffx2/resolve.ts`
> classes this as **DEEP** (FFX-2 ATB engine is a shared system). Written 2026-10-15 before the code, by the lane's agent.
>
> **Owner's words:** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please" (wiring plan question Q12: wire the proven kernels, FFX-2 lanes after the live measurements);
> 2026-10-13 "keep going please all of this reverse engineering needs to be incorporated into our game"; 2026-10-15 "keep going please full speed ahead".

## 1. Game case (AGENTS.md rule 14)

**FFX-2 only.** FFX has its own Confuse status on its own CTB engine (`src/battle/ffx`), a different routine in a different exe; nothing here touches `src/battle/ffx`, `src/data/ffx` or `src/audio`.
The note that names the row is `FFX2-G06` (difference 5: "Confusion's own pick is not modelled; a confused girl keeps her menu"); the wiring plan addendum calls it lane X2-H, row XH1, gated on
emulating the pick first because the row rested on a reading.

## 2. The gate (done before any engine code)

The pick (live `0x00649350`, the autopilot the ATB process asks every step of a character in state 7) was run for real in the Unicorn harness (the live machine code of FFX-2.exe, the random
generator hooked and logged) over random battle worlds, and compared with an independent model written from the disassembly alone. Result: **20,000 worlds, 0 mismatches** on the return value, every draw
(stream, order, count), the queued command, target mask and all-targets byte, the item reservation and the queue count; a sensitivity pass of 28 deliberate faults in the model is caught by 27 (the 28th, a
`Chr+0x0` test that the set builder makes unreachable, is an equivalent mutant). The reading in the note ("first draw modulo the candidates, a second modulo the usable sub-entries, a third for the
all-targets bit") is right; the note was incomplete on the target pick, which is now emulated too (`0x0063f920`, `0x0063fc60` and what they call).

## 3. What changes in play

A Confused girl is no longer asked for a command. At her ready moment the game's pick chooses one of the commands of her main window that carry the Confusion bit (in practice her Attack, a few direct skills,
and the Item command when the party holds something), one draw of her own stream; an item is one more draw; the target is one draw of stream 4 among everyone in the battle (the Attack row's 0x20 bit takes both
sides, herself included) or, for a multiple-target row, one draw of stream 5 for a side. She heals the enemy with a Potion and hits her own party exactly as often as the game does.
A Confused **monster** keeps running its script: who fills a monster's command lists is unread (open item), so nothing is guessed.

## 4. Risks and how they are bounded

| Risk | Bound |
|---|---|
| A Confused girl stalls the battle (nothing to pick) | the pick returns nothing, the girl stays idle with the recovery she has and asks again next step, as the game's state 0 does; a test pins it (Songstress with an empty stock) |
| An old status path assumed a girl is always a menu | five sites follow `isConfusedGirl` (the ATB hand-off, `awaitsPlayerInput`, `heldStillPending`, `settleGauges`, `nextDecision`); the engine test closes a menu when Confusion lands and checks the Active clock path |
| An all-side item or row aimed at the other team has no home in our targeting | `exactTargets` now means exactly the units named that can be hit (same pool for the one earlier user, the Paragon copy); the engine test pins the multiple-target items (the Megalixir and the curtains) aimed at either half |
| The goldens move | measured: the three goldens and `den-of-woe-carry` are byte-identical (see the handoff); the shipped line's Confusion frequency is measured at 12 and 500 seeds |
| Rollback | `constants.ts#CONFUSION_PICK = false` restores the pre-RC9 rule (a Confused girl keeps her menu) |

## 5. What the deep review should look at

1. A real Confused girl on Chapter XIII: her turn arrives with no menu, her action banner reads as a normal action, the log shows her hitting a friend when the draw says so.
2. The Active and Wait clock paths agree (no menu is offered, no clock is held for her).
3. No screen, overlay or text is added or changed: a Confused girl simply acts; the HUD already draws a Berserked girl's actions the same way. Screen work, if any is wanted (a "Confused" word on the banner), is the release driver's.
