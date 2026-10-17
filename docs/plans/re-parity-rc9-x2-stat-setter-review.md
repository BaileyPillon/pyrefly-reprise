# Paper preflight: RE parity RC9, lane X2-E, the script stat setter's effects (FFX-2 only)

> `critic/RUBRIC.md` section 4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths src/battle/ffx2/resolve-hp.ts,src/battle/ffx2/kernel/stat-setter.ts,src/battle/ffx2/setup.ts,src/battle/ffx2/ai/vegnagun-body.ts`
> classes this as **DEEP** (FFX-2 ATB engine is a shared system). Written 2026-10-16 by the lane's agent while the lane was built, before the first commit.
>
> **Owner's words:** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please" (wiring plan question Q12: FFX-2 lanes after the live measurements);
> 2026-10-13 "keep going please all of this reverse engineering needs to be incorporated into our game"; 2026-10-15 "keep going full speed ahead". The plan marks the lane "Bailey first: no".

## 1. Game case (AGENTS.md rule 14)

**FFX-2 only.** The stat setter is a function of `FFX-2.exe` (live `0x639400`) with FFX-2's own stat ids (365 of them); FFX has its own setter and its own ids, none of which was read. Nothing here touches `src/battle/ffx`, `src/data/ffx`
or `src/audio`. The note is `FFX2-G05`; the plan's lane is X2-E (rows XE1 to XE6) after X2-A.

## 2. What the lane builds and what it leaves out (the plan said: build every row that does not depend on X2-A's unmeasured parts)

| Row | Decision | Why |
|---|---|---|
| (kernel) `kernel/stat-setter.ts` | **built** | the setter body for the 42 stat ids the 36 compiled boss packages write, id 198 (no case) and the three group specs they use; the three helper ids (204, 209, 329) are declined with an error |
| XE4 the Vegnagun Core's death entry | **built** | the Core's death entry sets both Bulwarks to 0 hit points with no knock-out; no timing fact needed (the entry is a request that runs after the action in flight, read from the code) |
| XE5 death patterns | **built** | every boss script writes one at init; 0 is raisable, any other value leaves the battle at its KO and blocks Auto-Life; the table is keyed by the monster row |
| XE1 Ormi and Logos invincible in the combo | **left out** | needs (a) the combo's length in logic steps (X2-A rows XA6 and XA1: the engine gives Chapter VI no action time) and (b) the live read of `Chr+0x449` during No Love Lost (G05 open question 1: does anything refresh the one-count byte, does the combo stop the status clocks) |
| XE2 Leblanc's Agility 254 then 53 | **left out** | the three parts cost 0 ATB and 0 charge, so Agility changes no recovery or cast; the only readers inside the window are a KO's gauge (XE3) and an unproven animation speed; it needs the same window length (XA6) |
| XE3 the Act III revives | **left out** | the same window; plus X2-C's reward roll (G05 open question 2: a revived-then-killed monster rolls twice) and a ko-then-revive for the `yields` departure (D-035) that no screen has been asked to play |
| XE6 Hero/Miracle Drink Mix figure | **left out** | belongs to X2-G (the Alchemist's Mix, 53 result rows); the engine has no Mix; the item row's 20 counts already match |

## 3. The proof plan (done in this order)

1. **Kernel against the game's own answers.** The note's layer-1 log (207,552 real-setter vectors, 0 mismatches against the independent port) holds, for each id, the count, the changed bytes and the routines asked for. The worlds were not kept; they are regenerated from the job's
   seed in pure Python and the port reproduces all 24,288 logged vectors of the 44 ids checked (the ported ids, 198 and 3), so the regenerated worlds are the harness's. 4,209 vectors (three group specs, 23 values, one or four worlds) become the fixture. Layer 1 drew species words at random, so none of its species
   groups matched a slot; the group-mask builder (live `0x6117b0`) is therefore run for real in the emulator harness over worlds with matching species (3,120 calls, 0 mismatches against the port) and exported as its own fixture.
2. **Engine against an independent oracle** written from the compiled calls of the packages (`stat_setter_usage.json`, 891 calls), importing no kernel or adapter code.
3. **A mutation pass** over the kernel and the wiring (33 faults).
4. **Measurement**: 12 seeds on every FFX-2 chapter and 500 on Chapters V and VI against `origin/r50-release`, event log by event log, with causes; the Active line at 1.5 s of decision time too (the goldens' second arm).

## 4. Risks and how they are bounded

| Risk | Bound |
|---|---|
| The Core's entry changes the Chapter V fight | it acts only on a Bulwark that stands when the Core falls; on the intended line both are down (490 of 490 seeds), so the fight is the same event for event; on the Active line 9 of 300 Chapter V seeds differ (none of 200 in IV or in VI), all still won; one golden hash is re-pinned with its cause in the file |
| The entry runs at the wrong moment | it is a request (the entry runner queues a record on the script thread, read from the code), so it runs after the action that killed the Core has applied every result; an all-enemy move's later hits on the Bulwarks land as before (pinned) |
| A death pattern changes who can be targeted or revived | only a fallen monster with a pattern other than 0 stops being a target of anything; the Bulwarks and Redoubts (the monsters the scripts revive) are pattern 0; every shipped line is unchanged (144 fights equal at 12 seeds) |
| A monster the note did not read gets a wrong pattern | it gets none (0 as before): Valefor at Besaid, Yojimbo, Daigoro, Angra Mainyu, Zarich, Tawrich and the Fiend Arena Trema (whose package holds two actors that write 1 and 2) are left out, and a test says which |
| The 400-line rule | `engine-core.ts` 399, `internal.ts` 396; the new files are 66 to 264 lines |
| Merge with the other RC9 lanes | `resolve-hp.ts`, `internal.ts` and `engine-core.ts` are also touched by X2-C (kill rewards) and X2-H (Confusion); measured with `git merge-tree` in the handoff |

## 5. What the deep review should look at

1. A Chapter V run on the Active clock (`driveChapter5(seed, 1500)`): after the Core falls, a standing Bulwark is at 0 HP and the next hit knocks it out (seeds 8, 16, 28, 80, 83, 100, 130, 264, 273 of 300).
2. That nothing on screen changed: no event type, no field of the shared contract and no presenter file is touched; the HUD shows a part at 0 HP as it shows any unit at 0.
3. The rows left out, in the handoff, each with the exact fact it waits for.
