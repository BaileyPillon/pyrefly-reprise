# Paper preflight — RE parity RC10, FFX Isaaru's disabled commands (follows the formation-flags lane)

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths src/battle/common/types.ts,src/battle/ffx/commands.ts,src/battle/ffx/engine.ts,src/battle/ffx/setup.ts,src/battle/ffx/formation-commands.ts,src/data/ffx/enemies/isaaru.ts`
> classes this as **DEEP** (FFX CTB engine and the shared combat core are shared systems; FFX game data).
>
> **Owner's words.** 2026-10-17 (Bailey, asked whether Isaaru's three aeon duels should match the game): "Match the game (Recommended)"; the standing order 2026-10-08 "It needs to be a 1:1 parity."
> This supersedes his earlier adopted estimates `D-147` B6 (Yuna's foe-aimed rows greyed, everything else open) and B7 (the bag stays open), both labelled our estimates.
>
> **Verdict: PROCEED.** The game's own scripts say what the menu is; the engine's menu was an estimate. Branch `re-parity-rc10-ffx-isaaru-commands`, built on `re-parity-rc10-ffx-formation-flags` (`842b27c8b`): both touch the same three Isaaru groups. Nothing deploys without the release driver.

Written 2026-10-18 by the lane (a Sonnet sub-agent of the RE parity session), before the first commit of code.

## 1. Game case (AGENTS.md rule 14)

**FFX only.** The calls are in FFX's formation scripts (`bvyt09_10`, `_11`, `_12`, read from the install's own files and the saved disassembly; the handler is `FFX.exe` 0x007A6EF0, the setter 0x0079B470, the menu gate 0x0079A5B0). FFX-2 has its own exe and script machine; `src/battle/ffx2`, `src/data/ffx2` and `src/audio` are untouched, so `ffx2-atb-golden` and `ff7-golden` stay byte for byte.

## 2. What the data read found

Each of the three files runs the same twelve `setCommandDisabled(who, command, flag)` calls in its entry function, before the first turn:

| Calls | Who | Command ids | What the game does |
|---|---|---|---|
| 3 | everyone (spec -23: every slot that is not a monster) | 0x3002 Switch, 0x3003 Escape, 0x3018 Flee | sets the command's bit in the actor's disabled bitmap (Chr+0x690); the menu gate treats a set bit as unusable |
| 8 | Yuna (slot 1) | 0x3000 Attack, 0x3001 Item, 0x3004 Weapon, 0x3005 Armor, 0x3113 Skill, 0x3114 Special, 0x3115 Black Magic, 0x3116 White Magic | the same |
| 1 | Yuna's slot, flag 0, ids 9 / 8 / 12 | below 0x1000: the other branch of the setter, the aeon's availability byte | the mirror lock `lockedAeons` already carries (Ifrit, Valefor, Bahamut) |

Nothing disables Summon, Grand Summon (her Overdrive) or Dismiss (0x3056). The bitmap starts all clear at character creation (0x0079B4F0). A scan of all 38 formation files our chapters fight (a new fixture, independent of the saved disassembly) shows no other formation switches off an action command: the other 35 switch off Escape and Flee (Switch too in `kino03_10` and `mtgz01_10`), which `canEscape`, `lineUp.noSwitch` and a Kimahri-alone line-up already carry. After the entry function only Talk (0x3105) is toggled, in two files.

## 3. What changes

1. `EnemyGroupDef.commandDisables?: readonly FormationCommandOff[]` (a contract file, additive; `docs/CONTRACT-CHANGES.md`), `{ who: 'everyone' | combatantId, command: number }`, numbers only. Set on the three Isaaru groups (one shared constant).
2. `battle/ffx/formation-commands.ts` (new): the one switch `FORMATION_COMMAND_DISABLES`; the lists copied into `state.flags` at set-up (so a fork and the advisor's dry runs see them); the mapping of a row to the game command (kind, then ability category: Skill / Special / Black Magic / White Magic); three pure functions.
3. `commands.ts`: the last step of `availableCommands` drops the rows of a switched-off command for that actor (**hidden**, as Defend is; greyed would need a reason in words, which is the release driver's). `engine.ts#submit`: a command that belongs to a switched-off command is refused with the turn kept open and no message. `setup.ts`: one call.
4. **Where the refusal sits, and why.** In `submit()`, not in `executeCommand`: the game's disabled bit is a *menu* gate, so an Auto-Potion, a counter or a Berserk turn (all run through `executeCommand`) must not be refused. This keeps those as they are.
5. The Isaaru tests that used Cura or Attack for Yuna's turn pass with a Summon; the test helper `pass` is rewritten and the cause is written in each place (Yuna cannot wait out a turn; the "Yuna alone" branch of the boss script is covered by `re-parity-ai-isaaru.test.ts`).

Visible: Yuna's command window in the contest shows Summon and Overdrive (Grand Summon) and the older greyed Talk row; no new word, no new asset, no UI file changed. The guide line that says "Yuna can summon, heal herself and use items" becomes untrue and is listed for the release driver, not edited.

## 4. Acceptance cases

1. An independent model of the game (the handler's slot expansion, the setter's set / clear, the bitmap starting clear) replayed on the entry function of the 38 chapter formations says exactly three end with Yuna's eight commands off; the data's list for each of the three groups equals the model's.
2. Engine, three links: Yuna's first menu is only Summon rows, Grand Summon and the greyed Talk; each switched-off command, submitted, returns no event and she is asked again; the aeon's menu is untouched and Dismiss works; a fork sees the same; with the field taken off, her whole menu is back.
3. A bigger party in the same battle: Switch, Escape and Flee are gone for everyone, while Attack and Item stay with every member but Yuna.
4. The other 14 FFX chapters: no list in the state, Attack on the first menu; **12 seeds of every FFX chapter byte-identical before and after**, except Chapter XIV, whose moves are reported with their cause.
5. A mutation pass of about twelve faults, all caught.
6. `ffx-engine-golden` unchanged, or re-pinned only with its cause; `ffx2-atb-golden` and `ff7-golden` unchanged; `tsc` clean; files under 400 lines; `node tools/orphans.mjs` shows no new orphan.

## 5. Risks

- **Yuna cannot pass.** With no aeon out her only legal acts are Summon and Grand Summon. A bench, test or script that waited with Cura, Pray or an item now has nothing to submit but a Summon. The shipped tactic and the app's strategy already summon; the 500-seed measurement says whether any run changes.
- **Talk.** The older B6 rule still greys Yuna's Talk row; the game's scripts never touch Talk (0x3105) in these files and the default of that command in the fight was not read. Left as it was, listed.
- **Weapon and Armor** (0x3004, 0x3005) are the original's equipment swaps in battle, which this engine has no row for: the two disables take nothing away.
- **Hide or grey** is unread UI code. Rows are hidden (as Defend is); the release driver may choose to show them greyed, which needs a reason in words.
- A step the engine never takes on its own: a Berserk, Confused or Provoked Yuna in the contest still gets the forced Attack through `runTurn`, where the older B6 duel rule already refuses it and puts the turn back to the menu; this lane does not change that.
