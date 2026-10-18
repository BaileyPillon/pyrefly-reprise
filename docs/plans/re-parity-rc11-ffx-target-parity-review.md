# Paper preflight: RE parity RC11, lane "FFX target parity": the target step opens where the game opens it, and where it opens, it starts where the game starts

> `critic/RUBRIC.md` section 4, AGENTS.md rule 15: paper only, written before the first line of code. `node tools/critic-plan.mjs --paths src/battle/ffx/commands.ts,src/ui/ffx/CommandMenu.ts,src/ui/ffx/loneTarget.ts,src/battle/common/types.ts` classes this **DEEP** (FFX CTB engine, FFX HUD and the shared combat core are shared systems).
>
> **Owner's words.** 2026-10-08 "It needs to be a 1:1 parity." 2026-10-17 "keep going please all of this reverse engineering needs to be incorporated into our game" and "keep going full speed. im going to bed."; for Isaaru's duels "Match the game (Recommended)". 2026-10-09, on menus: "Yes, match the game", with before and after screenshots first. Only Isaaru's duels were decided, so every change to what a player sees or may do is **behind ONE switch, default OFF, measured, shown in screenshots and put to Bailey once as a decision table**. Nothing in this lane turns anything on.
>
> **Verdict: PROCEED, switch OFF.** Branch `re-parity-rc11-ffx-target-parity`, from `origin/re-parity-rc11-ffx-ch3-roster` (`354706148`: r54 + the script-lock lane + `MENU_DRAW_PARITY` + the Chapter III roster lane; their switches OFF). Nothing deploys without the release driver. Written 2026-10-18 by the lane (a Sonnet sub-agent of the RE parity session).

## 1. Game case (AGENTS.md rule 14)

**FFX only.** The rules are in `FFX.exe` (Steam build 25501027), research note `FFX-G11e` (the target step), with `FFX-G11` / `FFX-G11b` (the resolver, the formation sweep) and `FFX-G07` (the executor). FFX-2 has its own menu code and none of these addresses apply; `src/battle/ffx2`, `src/ui/ffx2` and `src/audio` are not touched; `ffx2-atb-golden` and `ff7-golden` stay byte-identical.

## 2. What the game does (G11e, with its labels)

1. **The target step is never skipped for a candidate count** [R][E]. A pick the resolver answers 0xFE pushes a target level (0x89A330 -> 0x89A860 -> builder 0x89ABD0) that tests no count; the per-frame cursor handler (0x89D390) waits for the confirm key. So one valid foe, one valid ally, a self-only command with the step bit and a group command over one side all open a cursor and wait.
2. **Self-only commands with the step bit** (record target word bit 0 set, mode bits 2-3 = 3: Guard, Sentinel, Copycat, the aeon Shield and Boost, the Magus Sisters' orders...) open a cursor on the user and wait [R][E runs A7, A8]. Records without the bit commit at once (the aeon entries of the Summon list, the Magus Sisters entry 0x30FF, 0x3100, 0x3134, 0x313D), and the Defend hot key (0x78FB80) bypasses the resolver.
3. **Where the cursor opens** [R][E]: record bit 1 clear = ally side first, set = foe side first. Ally-first single: the user's own entry. Foe-first: index 0 of the foe array (candidates in list order: the battle's party and monster order). A record that may target the dead, single mode, with some dead ally on the list: the first dead ally in list order (0x89A58F-0x89A5FF).
4. **No "no target" rule at the menu or the step** [R][E]: a revive with nobody KO'd is a normal row; the dead bit ADDS the dead to the candidates, the cursor opens on the user, the pick commits, the revive does nothing to a living target and the cost is spent (FFX-G02 P6 [E]). Reach is not part of the candidate set (overwritten with all ones at 0x89841F): an out-of-reach foe is a candidate and the executor drops it (0x791FA0; message 0x300E, no cost; whether the turn stays open is *inferred* in G07 3.10, and the message text was not read).
5. **Side switch** (record bit 5): a foe-first single command may be switched to the ally side and an ally-first one to the foe side, by the side-switch keys, when the other side has candidates (0x89D390; the key bits and the placement 0x8990F0 were not read).
6. **An opener always opens its list when the list is not empty, even with one entry** (G11e section 6 row 11; the resolver returns the list number, G11 4.1).

## 3. What the engine and HUD do today, and the plan per item (r54 = 354706148)

Every item is a member of `TARGET_STEP_PARITY.skip`-able list so Bailey can take them one at a time. The switch lives in `src/battle/ffx/target-step-parity.ts` (pure, no DOM; `on: false`, `skip: []`).

| # | Game | Today | Built with the switch on | Game case |
|---|---|---|---|---|
| t1 `selfStep` | the step bit opens a cursor on the user | `loneTarget.ts:18,23` keeps `self` rows `auto`: Guard, Sentinel, the aeon Shield and Boost commit at once | the row carries `targetStep` (cursor on the user); the HUD waits for a confirm. The Defend hot key and the aeon entries commit at once as before. Talk: see below | FFX only |
| t2 `overdriveStep` | the party Overdrives, the reels and the Gems have the step bit with the group mode and foe side first: the cursor opens for one foe | `loneTarget.ts:18` keeps `random-enemy` rows `auto`: a lone foe commits at once (two or more already ask) | a `random-enemy` row with the step bit carries `targetStep` over its foes; one foe opens a one-candidate cursor | FFX only |
| t3 `cursorStart` / `cursorStartFoe` | ally-first: the user; dead-allowed with a KO'd ally: the first KO'd ally in party order; foe-first: index 0 of the foe list | `aim.ts:13-18, 95-111`, `TargetCursor.ts:231-241`: the leftmost on screen of a pool "heals, buffs, revives, else foe" (an FF convention, unsourced) | `targetStep.start` replaces the opening choice (the ally and revive cases under `cursorStart`; the foe case under `cursorStartFoe`) | FFX only |
| t4 `revive` | a revive with nobody KO'd is a normal row, cursor on the user, commit, no effect, cost spent | already enabled and a no-effect hit (`targeting.ts:142-151`, `hit-apply.ts:195-201`); the cursor opens on the leftmost ally | covered by t3's start (the user) and pinned by tests (cost spent, no effect). "Out of reach" is NOT built (see section 5) | FFX only |
| t5 `sideSwitch` | Attack, the spells and the items may switch side | the engine lists one side (`validTargets`) | `targetStep.switchTo` (the other side); the HUD switches with L1/R1 in the target step; the engine already applies a named target of the other side (`aimOf` default branch). **Strategies, the advisor and the coach read `validTargets` only and never see `switchTo`** | FFX only |
| t6 `openerOne` | a one-entry opener opens its list | `chooseTop` runs a one-entry group at once (the "OVERDRIVE -- READY" shortcut) | the groups that are openers in the game (Skill, Special, Black, White, Summon, Overdrive, Item) open; the Switch group already does; the `aeon` group is not an opener and keeps its shortcut | FFX only |
| t7 `copycat` | Copycat is self-only with the step bit | `single-any` (`special-rikku.ts`): the player picks any combatant | the row is `self` with a cursor on the user. No shipped chapter has Copycat (survey: 159 distinct rows over 16 chapters, none) | FFX only |

**Talk.** G11e names "Talk's inner command" among the self-only ids; that is G11's misreading that G11b corrected (0x3123 is Yojimbo's Pay opener, 0x3122 its gil entry). Talk is **0x3105**, record word 0x93 (read from the install's `command.bin` by G04): step bit, foe side first, single mode, switch bit clear. So in the game Talk opens a **foe** cursor, not a self one. Built under `selfStep` as the same family ("the step bit opens a cursor"): the trigger row carries a `targetStep` over the targetable foes, the cursor opens on index 0, and the trigger is submitted with the chosen foe (the Talk handlers read no target: checked before building).

## 4. Design

- **One additive contract field**, `AvailableCommand.targetStep?: { candidates; start; switchTo? }`, set by the engine only while the switch is on. The engine decides (legality stays in the engine, the UI never re-derives it); the HUD only reads it. `docs/CONTRACT-CHANGES.md` entry (types.ts is a CONTRACTS file).
- **One table of the game's target words** (`src/battle/ffx/kernel/target-words.ts`, record id -> the u16 at record offset 0x1A; numbers only, from the install's tables as read by G04 and the same ids as `data/ffx/command-records`), plus a pure decoder. The words are not put on `FFXCommandRecord`: `tests/unit/data-ffx-command-records.test.ts` pins that type against a fixture.
- **Engine**: new `target-step-parity.ts` (switch, `targetStepFor`) called from `commands.ts#rowFor`, the item rows and `aeon-commands.ts` (the Sisters' orders); about 15 lines in `commands.ts` (336 now). **HUD**: `loneTarget.ts#ffxTargetMode` reads `targetStep`; `CommandMenu.ts` (already over 400, so no logic grows there) gets three one-line calls into a new `targetStepUi.ts` (start id, the L1/R1 switch, the one-entry rule). `setup.ts` (399) is not touched.
- **Layering** (rule 1): the engine part imports no DOM; `ui/ffx/loneTarget.ts` imports the pure switch module from `battle/ffx/`, as `CommandMenuLogic.ts` already does for `MENU_DRAW_PARITY`.

## 5. What is not built, and why

- **"Out of reach" is not un-greyed.** The execution path is read (G07 3.8-3.10): the target is dropped, nothing starts, MP and items are not paid, message 0x300E. But the message text was never read, "the turn stays open" is *inferred*, and the CTB delay of an action that did not go through is a separate path (G05). Per the brief: list it for a live check. A genuinely empty set ("No target": no targetable foe) is latent: no shipped chapter produces it at a player turn.
- **Dismiss (0x3056, mode 2), Flee (0x3018, mode 1 on the party), Escape (0x3003, mode 3) and Evrae's orders (0x3106-0x3108, foe first)** also carry the step bit, but they come through the trigger-list key, whose PC path was not traced (G11e open item 5). Found, listed in the handoff as open items, not built.
- **Mode 1/2 grouping** (Chr+0x504, G11e open item 1) is unread: a group command over several foes keeps the existing "all" / "choose" cursor.
- **Yojimbo's Pay** (0x3123/0x3122): a gil requester, not read; untouched.

## 6. Proof plan

- **Switch OFF = 354706148**: 12 seeds x the 16 FFX chapters on the shipped line (`setupForChapter`, the chain loop, `intendedStrategy`), base overlaid in-process from `git show` (no worktree add, no copy, no archive; the xa6 / ch3-roster method): outcome, links, party turns, engine turns, KOs, a digest of every link's event log, a digest of every menu and a digest of every target decision (`ffxTargetMode` and the cursor start per row). The four goldens and the pins pass.
- **Switch ON**: the same plays; event logs, outcomes and turns identical (strategies read `validTargets`); menus and target decisions differ, counted per item (the items one at a time through `skip`) and per chapter.
- **Tests per item**, engine (the model of the game written from G11e with no import from the engine) and HUD (jsdom, real `KeyboardEvent`s on the real `CommandMenu`), off and on; a mutation pass on the new logic; `tsc`; `node tools/orphans.mjs` (26 expected); no source file over 400 lines.
- **Screenshots** (headless, real HUD): before / after for t1 (Guard's self cursor), t3 (the revive cursor on the first KO'd ally) and t4 (a revive with nobody KO'd).

## 7. Time box and fallback

150 minutes plus any HOLD_HEAVY. If short: t1, t3 (ally and revive), t6 and t4's revive, with their proofs; the rest (t2, t5, t7, the foe start) stay listed as built-or-not in the handoff.
