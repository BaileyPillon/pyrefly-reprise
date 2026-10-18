# Paper preflight — RE parity RC11, FFX command-menu draw parity (opener rows, Overdrive, Summon list, blocked rows, Talk, the cursor)

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: paper only, written before the first line of code. `node tools/critic-plan.mjs --paths src/battle/ffx/commands.ts,src/ui/ffx/CommandMenu.ts,src/ui/ffx/CommandMenuLogic.ts,src/battle/ffx/ai/index.ts` classes this **DEEP** (FFX CTB engine and FFX HUD are shared systems).
>
> **Owner's words.** 2026-10-08 "It needs to be a 1:1 parity." 2026-10-17 "keep going please all of this reverse engineering needs to be incorporated into our game"; for Isaaru's duels "Match the game (Recommended)"; 2026-10-09 on earlier menu parity "Yes, match the game", with before and after screenshots shown first. Only Isaaru's duels were decided, so **everything here is a visible change and goes behind ONE switch, `MENU_DRAW_PARITY`, default OFF**, with before/after screenshots and a decision table for Bailey. Nothing turns it on.
>
> **Verdict: PROCEED, switch OFF.** Branch `re-parity-rc11-ffx-menu-parity`, from `origin/re-parity-r54` (`94012a68d`) plus the script-command-locks lane merged (`418ca7ac9`). Nothing deploys without the release driver.

Written 2026-10-18 by the lane (a Sonnet sub-agent of the RE parity session).

## 1. Game case (AGENTS.md rule 14)

**FFX only.** The rules are in `FFX.exe` (Steam build 25501027): the row resolver 0x0089ACA0, the draw loop 0x008A49B0 and the list-input handler 0x0089C900 (`FFX-G11`), and the formation sweep (`FFX-G11b`). FFX-2 has its own menu code (`src/ui/ffx2`, `src/battle/ffx2`), which is not touched; `ffx2-atb-golden` and `ff7-golden` stay byte-identical. FFX chapters only (1 to 3 and the FFX chapter list); the HUD files are all under `src/ui/ffx`, which FFX-2 does not import.

## 2. What the game does (the rules, with their evidence)

| Item | The game's rule | Evidence |
|---|---|---|
| a. Opener rows | Black, White, Skill, Special and Doublecast carry no Silence bit and no MP cost; the resolver returns the list number, so the row is drawn normally and opens onto a list whose entries are refused (-2). Hidden only for an empty type-8 list (-4), grey for an empty type-0x10 list (-3). | G11 sections 1.4, 4, 5 [R], [E] |
| b. Curse + full gauge | The Overdrive records refuse (-2) on Curse or an unfilled gauge; the Overdrive key still opens (0x78F700 counts gauge, not Curse), so the rows are drawn with the flag, not left out. | G11 4.1, 9 row 5 [R] |
| c. Summon list | The list builder (0x00785410 case 5) adds every aeon that exists in the battle (Chr+0x10) and passes `pp_BtlIsAeon`; it never reads the availability byte, HP or the recovery count. The draw loop (call at 0x008A6708, test at 0x008A6712) resolves each entry and skips only -4 (and the padding id 0xFF); the class-0 test 0x0079A080 (HP above 0, byte +0xDD4 set, +0xDCD clear, +0x6D8 clear) answers unavailable, the resolver -1, and the row is drawn with the flag. A KO'd, recovering or script-locked aeon is **drawn greyed, not skipped**. | read in Ghidra this lane [R]; G11 4, 9 row 13 |
| d. Blocked Escape, Flee, Switch | A formation that sets the command's disabled bit leaves the row in the list; the resolver answers -1; the row is drawn with the flag and a confirm plays the refusal cue; the original prints no reason. All 38 chapter formations set Escape and Flee; `kino03_10` (Chapter XXI fight 2) sets Switch for every slot, `mtgz01_10` (Chapter XXV) for Kimahri's. | G11b sections 3, 4, tables 1 and 2 [R] |
| e. Talk | Talk is command 0x3105 (not 0x3123, which is Yojimbo's Pay opener: G11b section 8). It is added to a character's trigger list by four formation scripts only: `mtgz02_00` (Chapter I: Yuna, Kimahri), `mcyt06_00` (VII: Tidus, Yuna, Wakka), `stbv01_10` (X: Tidus, Yuna, Auron), `sins06_00` (III part 1 and the first Last Summoning link: Tidus). No other formation or monster script names it, so in every other fight the row does not exist. | G11b section 5, table 3 [R] |
| f. The cursor | The list-input handler 0x0089C900 steps the cursor index (list+0x42) at 0x0089CB10 (up) and 0x0089CB2D (down), wraps and clamps it at 0x0089CB35 to 0x0089CBBD, and calls the resolver for the **row under the cursor only on a confirm** (0x0089CC7E); a negative result plays cue 3 and returns (0x0089CCF5). No resolver call, and so no skip of a negative row, sits between the key and the new index. | read in Ghidra this lane [R] |

Confirmed from the decompile, so item f is built (the brief said not to build it if the cursor skips; it does not).

## 3. What the engine and the HUD do today (the differences)

- a: `CommandMenuLogic.ts:233` (`rowEnabled`: a group is enabled only if some entry is), `CommandMenu.ts:528` (a top row with nothing enabled shakes), `:637` (the Doublecast wrapper likewise). Silenced Lulu, or any caster at 0 MP, cannot open her Black Magic list. Chapters 2, 3, 27 (Silence), any chapter at 0 MP.
- b: `overdrive.ts:71-76` `overdriveReady` and `commands.ts:156` build the Overdrive rows only when the gauge is full and the actor is not Cursed. Chapters 2 and 3.
- c: `commands.ts:189-207` skips an aeon that is not available (KO'd, recovering) and keeps only a locked one (mirror lock, "Taken by Yu Yevon"). Every chapter with Yuna and aeons.
- d: `commands.ts:293` has no Escape row when `canEscape` is false; `:142-145` greys Flee with "Can't escape"; `:262` builds no Switch row when `noSwitch` is set (Sinspawn Gui's fight 2), and Chapter XXV has no bench at all, so no Switch group.
- e: `gagazet.ts:64` lists Talk on Tidus (a row greyed "Nothing left to say"), `zanarkand.ts:53` on Tidus in Chapter II; `dreams-end.ts` lists it on Tidus for the whole Chapter III chain, so the Yu Yevon link and the five possessed links show a greyed Talk the game never adds [to be confirmed by the engine run]. Chapter XIV's Yuna has a greyed Talk (r54 left it with its older reason).
- f: `CommandMenu.ts:499, :568` (`moveTop`, `moveSub`) skip a greyed row; a confirm on one is already refused with a shake.
- Not touched, and listed so nobody thinks it was forgotten: **"No target" and "Out of reach" greying** (`commands.ts:78-86`, and the item rows). The game's resolver has no target test, but what its target cursor does with an empty set is unread (G11 open question 3), so it needs a live check.

## 4. The switch and the build (small commits, one per item)

1. **Step 0 (a build, with the merge).** With `SCRIPT_COMMAND_DISABLES` on, a possessed copy's own aeon stays on Yuna's Summon list, **greyed with no reason** (the script's byte only; `commandRefused` still refuses it), and in Grand Summon's picker as a greyed entry; the hiding the lane built is replaced by the draw the game does (c, above). The reason text "Taken by Yu Yevon" is not reused (`engine/tactics/lookup.ts#onLastSummoningBoard` keys on it).
2. `src/battle/ffx/menu-draw-parity.ts` (new, pure, no DOM, about 40 lines): `MENU_DRAW_PARITY = { on: false, skip: [] }`, `menuParity(item)` (true when the switch is on and the item is not skipped), `setMenuDrawParity(on, skip?)` returning the restore function (the boss-data lane's pattern). One switch; the item names let Bailey take the rows one at a time without a second switch.
3. Engine rows, all inside `availableCommands` (the same `AvailableCommand` shape; `enabled: false`, no `disabledReason`, as r54's greyed rows): b (Overdrive rows built for a Cursed actor with a full gauge), c (every aeon in the roster is a row; a row that is not summonable is greyed), d (Escape built greyed when `canEscape` is false, Flee loses its reason, Switch rows built greyed when `noSwitch` is set, plus one greyed placeholder row for Chapter XXV's Kimahri, whose group gains `lineUp.noSwitch`; legality is unchanged: `execute.ts` still refuses what it refused, `escape.ts` is untouched), e (the Talk handler gains `offered`, false in a fight whose formation never adds Talk; the row is not built).
4. HUD, `src/ui/ffx` (FFX only): a (`rowEnabled` is true for an opener group, so it opens; a one-entry opener whose only entry is greyed opens its list instead of resolving that entry; the Doublecast wrapper opens onto its grey spells), f (`moveTop` and `moveSub` rest on greyed rows; a confirm on one shakes **and plays the existing `error` cue** of the FFX menu set, `src/audio/sfxV2/cues.ts`; the battle menu plays no sound of any kind today, so the call is new and wrapped so a missing audio context costs a sound, never the menu).
5. Tests per item (a model of the game's rule, then the engine/HUD with the switch off and on), a mutation pass on the new logic.

## 5. Acceptance

- Switch off: ffx-engine-golden, ffx2-atb-golden, ff7-golden, last-summoning-iii-pin and every menu are identical to r54 + the lock lane (16 FFX chapters x 12 seeds: outcome, turns, event log and the menu digest).
- Switch on: outcomes, turns and **event logs** identical to switch off in every play (only the menus differ); the chapters whose menus move are listed with the number of plays.
- tsc clean; `node tools/orphans.mjs` stays at 26; the FFX HUD and ui tests I touch pass; every source file stays under 400 lines (`src/battle/ffx/setup.ts` is at 399 and is not touched).
- One before/after screenshot pair per item at 1600x900, in the real HUD.

## 6. Risks

- **Auto-battle and the advisor read `AvailableCommand[]`.** Extra greyed rows (Escape, Switch, Summon, Overdrive, Talk gone) must not become choices. They carry `enabled: false` and the strategies filter on it; the event-log identity with the switch on is the proof, and a play that moved would stop the lane.
- **A one-entry opener resolving straight.** `chooseTop` resolves a group with one entry without opening it; with openers always enabled it would submit a greyed entry. The HUD change guards it, and a test pins it.
- **Hidden Last Summoning board detection** (`onLastSummoningBoard`) reads the "Taken by Yu Yevon" reason on a Summon row; greyed KO'd rows carry no reason, so they cannot make Chapter III look like the board, and the Last Summoning's own rows are unchanged.
- **The grey palette is a reading** (G11 open question 2), not a watched screen; the refusal cue is the game's index 3 by name, unheard. Both are in the handoff's open items.
- **Time.** If short: a, d, e and their proofs first.
