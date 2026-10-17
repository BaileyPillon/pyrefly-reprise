# RE lane FFX-K: the player's Yojimbo and the Magus Sisters, the battle-engine half (FFX only)

Status: **built, tested, mutation-tested, proved same-seed identical and pushed on branch `re-parity-ffx-yojimbo-sisters`; not merged, not deployed, no screen** (2026-10-15). Cut from `origin/r49-rc` (`f939b87f`). **Game case: FFX only** (AGENTS.md rule 14; FFX-2 has no aeons in this sense and its Yojimbo is a mission boss with its own rules). **2026-10-15 night, two fast-forwards on top: section 10 (a landed Zanmato hits the whole group it picked, `afda2d451`) and section 11 (the Sisters' seven orders).**
Owner: Bailey. His words, as the brief quoted them: to the release driver, "keep going full speed ahead. we definitely need an awesome chapter built with yojimbo AND magus sisters that would be so awesome. the most epic encounter ever!!!!!!!!!"; to the RE session, "all of this reverse engineering needs to be incorporated into our game", and "Yes, plan a chapter" to "Should one of our chapters give the player FFX's own Yojimbo or the Magus Sisters?". The release driver builds the chapters (27 Dark Mirror, 28 The Last Summoning) and their screens; this lane is the engine half both need.
Plan: `D:\Tools\ffx-parity\coverage\wiring-plan-addendum-2026-10-13.md`, lane FFX-K, rows K1, K2 and K4. Note: `D:\Tools\ffx-parity\coverage\ffx\FFX-G08.md` sections 1 to 6 and 9. The Zanmato facts of section 2.4 and 3: `research/re-ffx-last-summoning.md` section 8 (branch `re-ffx-last-summoning`) and `research/re-ffx-dark-aeons.md` (branch `re-ffx-dark-aeons`).

## 0. The three states

| | Decompiled and proven in the harness | Wired into the engine | Live |
|---|---|---|---|
| The player's Yojimbo (K2) | yes: 144,839 emulator vectors in the note's group (137,839 of them are the three functions the kernel carries, replayed through it; the rest are the getters the engine reads from state) and 39,998 script VM runs, 0 mismatches | yes, for a build that owns him | **no**: no shipped build owns him |
| Zanmato against a foe's Zanmato byte (the monster penalty, the second pass) | yes: it is the same script; the Last Summoning note's tables are exact arithmetic on it, and this lane pins them cell by cell to the kernel (section 4) | yes (`adapt/yojimbo.ts` reads the highest byte over the monsters on the field) | **no** |
| The Magus Sisters: summon, wipe, Dismiss (K1) | yes (the party kernel, W5; this lane re-ran the note's vectors) | yes, for a build that owns all three | **no** |
| The Sisters' requester, standing order, motivation, menus, joint counters (K4) | yes: 183,000 emulator vectors, 9,000 VM runs, 4,000 joint-counter vectors, 60,000 requester vectors, 0 mismatches | yes | **no** |
| Combine powers: the count behind its menu row (property 282) | **read only** (note label [R]), not run | yes, marked [R] | **no** |
| The eight orders' handlers (section 11; Combine powers is event 18 of the sixteen and, since the Delta Attack fix of 2026-10-16, runs through the same interpreter as the other seven) | yes: the target search on the real code (24,000 vectors) and the sixteen handlers on the game's script VM (24,000 runs), 0 mismatches | yes, replayed and tested against an independent oracle | **no** |
| K5, the Dismiss as a queued action | [R] | **left out** (it waits for the record queue, FFX-F F4/F5) | no |

"Live" is no because nothing ships either aeon for the player. A chapter that owns them is the release driver's.

## 1. Commits

| Commit | What |
|---|---|
| `3c1543871` | The kernels `kernel/yojimbo.ts`, `kernel/sisters.ts`, `kernel/aeon-request.ts`; the replay helper; six fixtures; two test files |
| `05b77e62c` | The wiring: `adapt/yojimbo.ts`, `adapt/sisters.ts`, `adapt/aeon-party.ts` (group), `aeon-commands.ts`, the seams in `aeons.ts`, `state.ts`, `engine.ts`, `execute.ts`, `commands.ts`, `engine-end.ts`, `setup.ts`, `runtime.ts`, the carry in `BattleScreenSetup.ts`, the contract entry, the engine-level test and its oracle |
| `f081ec1a1` | One test strengthened (the first mutation pass left the "any aeon down" wipe alive) |
| `42dc0f547` | The finished mutation pass (its subject says "three new engine test files"; it is one kernel file and two engine files): the Zanmato facts pinned (`parity-ffx-yojimbo-zanmato.test.ts`), the second and third engine test files (`parity-ffx-engine-k-aeons-more.test.ts`, `-presenter.test.ts`) and the shared rig (`helpers/ffxKRig.ts`); four comments corrected (`zanmatoLevel` twice, the save-slot evidence for 128, a test-file reference); the contract entry updated. Tests and comments only: no behaviour changed |
| `a24774fab` | Comments in three test files corrected (a landed Zanmato ignores every resistance and kills a monster with Death resistance 255; found while running the suite's failures down) |
| the commit of this note | This file |

## 2. The engine API the chapter uses

### 2.1 How a build owns them

`FFXPartyBuild` (a contract file; entry in `docs/CONTRACT-CHANGES.md`) gains two optional fields. **The build lists the aeon in `aeons` (with its `AeonBuild` stat row: `AEON_CANONICAL_STATS` holds estimated rows for Yojimbo and the Sisters at three encounter points, Seymour Flux, Yunalesca and Braska's Final Aeon; `kernel/aeon-stats.ts` is the game's own builder from Yuna's stats and the battle count, proven but not wired as the source of a build's rows, so the chapter picks its rows) and gives the matching field, or `buildBattle` throws.** It also throws for a field without the aeon, for a bad value, and for a build that lists only some of the Sisters:

```ts
yojimbo: { compatibility: 0..255, hireAnswer: 0 | 1 | 2 }
sisters: { motivation: { cindy: 0..100, sandy: 0..100, mindy: 0..100 } }
```

- **`yojimbo.compatibility` is a REQUIRED build parameter with no default anywhere in `src/battle`** (a test fails the build without it). The game's image holds 0 and no initialiser was found (note, open question 1). **For the chapters' builds use 128, labelled "strongly indicated by a community save pack (not the owner's: 107 saves, downloaded 2026-09-26): slots 1-84 all read 128; 164 by slot 106; live confirmation pending"** (corrected 2026-10-17: these are a community pack, not the owner's; RE main session, 2026-10-15; the save offset is inferred from the note, and the live reading, where slot 106 should read 164, is what will confirm it). The community says 128 too. The chapter puts that label beside its value (its build file, its handoff) and keeps it until the live reading lands. **Update, 2026-10-17: the live reading landed. At boot, before any save was loaded, FFX itself writes compatibility 128 and hire answer 2, so 128 is the game's own starting value (read at boot, 2026-10-17), not an estimate, and 2 is the hire answer's; the image holds 0 because the game writes both at boot (the static image showed no initialiser for that reason).**
- `yojimbo.hireAnswer` is the reply the player gave in the recruitment haggle (0 the dearest start price, 1, 2 the cheapest); it scales the motivation Pay makes. The game's default, when he was never hired through that scene, is 0. The haggle itself (note 3.5, proven on the VM) is **not** in the engine; the chapter picks the answer.
- `sisters.motivation` is each sister's motivation at the start of the battle (`Chr+0x6e1`). **It is not in the note either**: the chapter's value is an estimate, and must be labelled one. A chain does not carry it (each link starts with the build's value; whether the game's survives into the next battle is unknown).
- The Sisters' **standing order** starts at 0 every battle (whether the game's survives into the next battle is the note's open question 6).
- The aeons' commands are looked up in the engine's content registry by id (`daigoro`, `kozuka`, `wakizashi-single`, `wakizashi-multi`, `zanmato`; `delta-attack`), so the registry must hold `ALL_ABILITIES` (the app's `registerBattleContent` does; the engine throws a plain error naming the missing record otherwise). The build's own `abilityIds` for these aeons are not read by the Pay or the orders.

### 2.2 The commands a screen sends (no new `Command` kind)

| What | Command |
|---|---|
| Pay | `{ kind: 'ability', id: 'yojimbo-pay', targets: [], gilSpent: N }`, N a whole number from 0 to the party's gil (paying ALL of it is allowed). `state.flags['yojimbo:gil']` is the gil the party has. N = 0 is the "pay nothing" branch. An N above the gil, negative or not whole is refused with a `message` event and the turn stays open |
| An order | `{ kind: 'ability', id: 'sister-order-<name>', targets: [] }` for an order the sister's menu offered this turn. The ids and our own labels are `ORDERS` in `src/battle/ffx/aeon-commands.ts` (`PAY_ABILITY_ID`, `ORDER_IDS`); all eight have handlers (section 11), an order the menu did not offer this turn is refused with a `message` |
| Dismiss | the ordinary `{ kind: 'dismiss', targets: [] }` (any sister's; Yojimbo's) |
| Summon | the ordinary `{ kind: 'summon', id: 'yojimbo' }`; for the Sisters `{ kind: 'summon', id: 'cindy' }`. **One Summon row stands for the three** (Cindy's row, offered only when all three can come, so none of them may still be recovering); any of the three ids summons all three, also by Grand Summon (the presenter file calls `summonAeon(ctx, 'yuna', 'mindy', true)`: all three come, each holding a full temporary gauge that Dismiss discards) |

### 2.3 What the menus are (`availableCommands`)

- **Yojimbo:** Pay (its `gilSpent: 0` is a template; the screen fills the payment) and Dismiss. These are the two commands the game's requester knows; whether the game's menu holds more is open question 3.
- **A sister:** the orders the game's menu builder offered at the start of her turn (its draws are on stream 18, taken once, in the note's order), then Dismiss. All eight orders have handlers (Combine powers, and since 2026-10-15 the other seven: section 11), so every offered row is enabled. A submitted order that was not offered this turn is refused with a `message` and the turn stays open. Combine powers is offered only when all three sisters have a full gauge, stand, are not Cursed, and can act (not Petrified, asleep, Confused, Berserk, Provoked, Threatened or ejected). Repeat is offered from the turn after she has given an order.
- Neither aeon is offered the ordinary Attack, spell, Shield, Boost or Item rows.

### 2.4 The Zanmato byte of a foe (what shapes Pay)

Pay's roll is shaped by the foes' **Zanmato byte** (a graded field of the monster record; 0 for most monsters). The data convention is `EnemyDef.zanmatoLevel` = **the byte plus 1** (the enemy files already write it so, "byte 3 -> level 4"); unset reads as byte 0. **L, the byte the roll uses, is the highest over every monster still on the field**: alive, fallen but not left, hidden or untargetable all count; a monster that has left the field (removed, ejected) does not. A stand-in or helper with byte 0 lowers nothing.

The bytes the two new chapters need (`research/re-ffx-last-summoning.md` 1.5 and `re-ffx-dark-aeons.md`), with the `zanmatoLevel` to write:

| Foe | Byte | `zanmatoLevel` |
|---|---:|---:|
| possessed Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo | 2 | 3 |
| possessed Cindy, Sandy, Mindy | 3 | 4 |
| Yu Pagodas (the data's `yuPagoda` already says it) | 4 | 5 |
| Yu Yevon | 4 | 5 |
| Braska's Final Aeon (the data's boss record already says it; the file holds 5, not the wiki's 6) | 5 | 6 |
| Dark Aeons, Dark Yojimbo and the Dark Sisters included | 4 | 5 |
| Penance and both arms | 5 | 6 |
| the dog, helper actors, the Sinscale stand-in | 0 | leave unset |

What it does (the note's section 8, pinned by `parity-ffx-yojimbo-zanmato.test.ts`): the motivation is divided by L + 1 (answers 0 and 1) or multiplied by 0.8 and divided by (L + 3) div 3 (answer 2); the first roll is trunc(V) + a draw of 0 to 63, and Zanmato is 80 and up, so the number of Zanmato draws out of 64 is `clamp(trunc(V) - 16, 0, 64)`; **if L is above 0 and the first roll is not Zanmato he rolls again with L taken as 0, and a Zanmato on that second roll becomes Wakizashi on all, so the second pass can never make a Zanmato and the whole chance is the first roll**. A free attack is never Zanmato against a group with a byte above 0. In words, for the chapters: **Chapter 27** (the Dark Aeons, byte 4, so L = 4): at the most a player can pay (the whole gil, compatibility 255) Zanmato is 12.5 percent for answer 1, 21.9 for answer 0, 50 for answer 2; a full gauge lifts that to 43.8, 53.1 and 81.3. **Chapter 28**: against Braska's Final Aeon L = 5, the best case is 6.25 percent for answer 1 (37.5 with a full gauge); in every possession link L = 4, because the two Pagodas stand beside the possessed aeon, so the same figures as Chapter 27 apply; against Yu Yevon also 4.

### 2.5 State and events the screens and the presenter see

- `state.aeonId` is the aeon out (Cindy for the trio); **`state.aeonIds`** (new, optional) is `['cindy', 'sandy', 'mindy']` while the Sisters are out and absent otherwise. `friendlies()` and every engine helper read all three. Each sister's `slot` is 0, 1, 2 while she is out. **The existing presenter and field rows read `aeonId` only**: staging three aeons, three rows and the order menu are the screens' work.
- `state.flags['yojimbo:compatibility']` and `['yojimbo:gil']` (set at battle start and after every change). `carryPartyForward` writes both into the next link's build, so a chain carries them (the hire answer rides with them).
- **Events** (read from a run of the engine, not from the code):
  - Summon: Yuna's `action-start` ('Summon'), then `summon` {aeonId, combatantId, ownerId}, then her `action-end`. For the Sisters there are three `summon` events inside that one pair, in the order Cindy, Sandy, Mindy.
  - Pay: `action-start` (Yojimbo, `abilityName: 'Pay'`) and `action-end`, then the chosen command's own events: `action-start` with `abilityId` `daigoro`, `kozuka`, `wakizashi-single`, `wakizashi-multi` or `zanmato`, its `damage` / `ko` events, `action-end`. A payment of 0 gives the Pay pair, then `action-start` ('Dismiss'), `dismiss` (reason `command`), `action-end`. A refused payment is one `message` event (kind `system`) and no action. There is no gil event: read the flag.
  - A free attack: only the chosen command's `action-start`, its effects and `action-end` (the turn is his, no menu opens, no Pay pair).
  - Combine powers: the asking sister's `action-start` (`abilityName: 'Combine for the Delta Attack'`), then Cindy's `action-start` (`abilityId: 'delta-attack'`), an `overdrive-gauge` (Cindy, cause `spent`), the `damage` events (six on EACH foe the Delta Attack reaches: Cindy's `action-start` `targets` is that whole group, the hits are numbered 0 to 6 x foes - 1 across them and `hitCount` is the whole action's), Cindy's `action-end`, an `overdrive-gauge` for Sandy and one for Mindy (cause `delta-attack`), and the asking sister's `action-end`. A Combine that finds nothing (no foe within the Delta Attack's reach, or her bar not full, or a Curse) or whose roll fails is the order's own start and end and nothing else.
  - Dismiss with the Sisters out: `action-start` ('Dismiss'), a `revive` (cause `dismiss`) and a `status-add` for each fallen sister, a `dismiss` (reason `command`) for each of the three, `action-end`.
  - The wipe (all three down): a `dismiss` (reason `ko`) for each of the three after the action that felled the last. Yojimbo knocked out while out is the ordinary `dismiss` (reason `ko`); his -10 has no event of its own.
  - The kernel's result carries his reaction byte (nod, headshake); the engine does not emit it (open item 11).
- **Draw streams:** `FfxStream.Yojimbo` = 17 (the turn-start test and the script's raw draw), `FfxStream.Magus` = 18; the target picks use 4 (a single target, only when there is a choice) and 5 (a group), as the Berserk and Confuse picks do; the hit's own rolls then come off the aeons' stream 27, as for any aeon.

## 3. The rules, in player words

**Yojimbo.** At the start of each of his turns the game draws once: with a compatibility of 128 he acts on his own in 32 turns of 256, at 255 in 63, and at 0 to 3 never; otherwise the menu opens. The own-turn (free attack) is Daigoro, Kozuka, Wakizashi on one, Wakizashi on all or Zanmato, chosen by a second draw and his compatibility (table 4.1 of the note: at 128 never Daigoro, at 255 mostly Zanmato). A free Zanmato becomes Wakizashi on all when the group has a Zanmato byte above 0.
**Pay** turns the gil into a number: 4 for every doubling of the payment from 8 gil, plus his compatibility div 10, scaled by the hire answer (answer 0: by the share of the gil that is paid, from 75 to 125 percent), and then by the foes' Zanmato byte (divided by the highest byte plus 1; answer 2: times 0.8, divided by (byte + 3) div 3), plus 20 if his gauge is full and he is not Cursed; one draw is added and the sum chooses the command (below 32 Daigoro, 32 to 47 Kozuka, 48 to 62 Wakizashi, 63 to 79 Wakizashi on all, 80 and up Zanmato). If a monster has a Zanmato byte and the first roll was not Zanmato he rolls again without the monster penalty, and a Zanmato then is Wakizashi on all: **a foe with a Zanmato byte makes Zanmato far harder, and a second roll can only ever give Wakizashi on all.** The payment is taken when the command goes through; the whole gauge is spent when the full-gauge bonus was taken. Compatibility moves with what he did: Daigoro -1 (Kozuka, 0, if it found no target), Kozuka 0, Wakizashi +1, Wakizashi on all +3, Zanmato +4; paying nothing -20 and he leaves; Dismiss as his first action -3; knocked out while he is out -10.
**The Sisters.** All three come together; the party waits off the field with its counters frozen. A fallen sister stays (she is skipped) until all three are down, which is the wipe: each is away for 30 battles. Dismiss stands a fallen sister up at 1 HP. At each sister's turn the menu offers free choice, repeat (from her second turn), the attack order (chance motivation + 50 for Cindy, + 150 for the others), her own spell or support order, Combine powers (only when all three have a full gauge, are alive, not Cursed and able to act) and Dismiss. **Combine powers** rolls 200 + motivation (always, from motivation 56 up); on success Cindy performs the Delta Attack for all three, whoever gave the order, the other two wait Agility-tick x 5 (Agility 40 is 35, Agility 100 is 20; Haste halves and Slow doubles a sister's wait), all three pay the bar, and the ordering sister gains 10 motivation; on failure she loses 10 and passes.

## 4. Tests

| File | What it proves |
|---|---|
| `tests/unit/parity-ffx-yojimbo.test.ts` (25) | hand-worked rules and the note's tables 4.1 to 4.4; replays of `yojimbo_natives.json`, `yojimbo_script.json`, `aeon_requests.json` |
| `tests/unit/parity-ffx-sisters.test.ts` (23) | hand-worked rules; replays of `sisters_natives.json`, `sisters_menu.json`, `joint_ctb.json` |
| `tests/unit/parity-ffx-yojimbo-zanmato.test.ts` (11) | **the Zanmato facts of the Last Summoning note, section 8, against the kernel**: the table 8.2 cell by cell (bytes 0 and 2 to 5, motivations 40 to 121, with and without a full gauge, as the FINAL command whatever the second draw is); `clamp(trunc(V) - 16, 0, 64)` for every motivation 0 to 121, every byte 0 to 7; the best-case table for the three hire answers; "possible from V0 = 17 x (L + 1)"; and **the second pass can never produce a Zanmato** (every answer, byte 1 to 5, gauge and motivation, all 64 second draws: a Zanmato there is Wakizashi on all, with L taken as 0 and the gauge bonus taken again) |
| `tests/unit/parity-ffx-engine-k-aeons.test.ts` (26) | the wiring: a **test build owning both** against a test enemy; the oracle `helpers/ffxKOracle.ts` is the note's prose written out again with no import of the kernels or adapters, and the engine's generator is tapped so the stream, number and order of draws are checked; the required parameters; the menus; free attack and Pay (command, gil, compatibility, gauge, second pass, hire answers); the three-aeon summon, wipe and Dismiss; the menu draws; Combine powers (win and lose branches, counters 35, 35, 20); a chain carry |
| `tests/unit/parity-ffx-engine-k-aeons-more.test.ts` (36) | the cases the first mutation pass found no test for: the monster penalty reads the **highest** byte over **every** monster on the field (a boss listed second, the highest of three, a fallen one still counts, one that left does not, level = byte + 1); a free attack keeps the compatibility it changes and is never Zanmato against a group with a byte; a Cursed Yojimbo gets no bonus; all the gil may be paid; the three hire answers over twelve seeds; Combine powers asked by each of the three sisters (Cindy still performs it, +10 for the asker only, Repeat offered afterwards), with Haste and Slow; the Combine gate for ten states; a recovering sister takes the Summon row away; the summon holds while any sister stands (four patterns); a wipe empties the gauges; the menu builder's "near death" |
| `tests/unit/parity-ffx-engine-k-aeons-presenter.test.ts` (11) | **what the presenter sees**: the events of a Pay (the Pay pair, then the command's own start, effects and end), of paying nothing, of a refused payment, of Yojimbo's Dismiss; the Sisters' three summons in order with owners and list positions 0, 1, 2; a Grand Summon naming any one of them (all three, gauges held, discarded on Dismiss); Dismiss with a fallen sister (revive first, one `dismiss` per sister); the wipe; Combine powers as events (the order, Cindy's Delta Attack, the three bars) and a failed roll as the order alone |
| `tests/unit/helpers/ffxKRig.ts`, `ffxKOracle.ts`, `ffxKReplay.ts` | the shared rig (taps the generator), the independent oracle (`freeAttack` now takes the group byte), the replay functions shared by the tests and the full-set runner |

The lane's six files, about 6 seconds: `npx vitest run tests/unit/parity-ffx-yojimbo.test.ts tests/unit/parity-ffx-sisters.test.ts tests/unit/parity-ffx-yojimbo-zanmato.test.ts tests/unit/parity-ffx-engine-k-aeons.test.ts tests/unit/parity-ffx-engine-k-aeons-more.test.ts tests/unit/parity-ffx-engine-k-aeons-presenter.test.ts` (132 tests; the three engine files each count the shared fixtures' one check, so 129 of their own); `npx tsc --noEmit` is clean; `node tools/orphans.mjs` lists no module of the lane (every one is reachable from `src/main.ts`). **The fixtures are stratified subsets** (about 2 MB in all) of runs of the game's own code. This lane re-ran the note's scripts with a dump (copies in `D:\Tools\ffx-parity\rc9\aeons\g08\`, seeds unchanged, so the counts equal the note's) and replayed **every** vector the kernels carry through them with the same helper (`D:\Tools\ffx-parity\rc9\aeons\replay_full.mjs`; re-run for this note on the committed kernels, 0.9 s): RollYojimboCommand 57,839; turn-start roll 60,000; compatibility add 20,000; the script on the VM 39,998 (20,000 + 6,666 x 3); the requester 60,000; RollMagusRandom 60,000; standing order 3,000; the two setters 20,000 each; positive-case test 30,000; after-action 50,000; the Sisters' menus 9,000; joint counters 4,000. **433,837 vectors, 0 mismatches.**
`parity-ffx-engine-aeons.test.ts` gained the (test-value) `yojimbo` parameter its build now needs.

## 5. The same-seed proof and the mutation result

**The same-seed proof.** Nothing ships either aeon for the player and the possessed (enemy) Yojimbo and Sisters of Chapter III use ordinary monster rules, so no existing chapter may move. **Proved:** 12 seeds (1 to 12) on **all 14 FFX chapters** (the 11 listed and the hidden Sinspawn Gui, Fayth and Biran and Yenke), each played by the chapter's own line through its whole chain exactly as `ffx-engine-golden` plays it: **168 chains, 294 links; the outcome, the turns, the KOs, the digest of every link's full event log and the digest of the generator's final stream states are byte-identical to `origin/r49-rc`** (288 victories and 6 defeats, the same ones). It was run on the lane before the wiring was committed and **again on the committed tree `42dc0f547`** for this note (the two lane outputs equal each other and the baseline under `cmp`). The runner is `D:\Tools\ffx-parity\rc9\aeons\zz-sameseed-proof.test.ts`, run once in an extract of `origin/r49-rc` and once in the lane tree (the outputs `proof-base.json` and `proof-lane.json` compare equal as bytes). `ffx-engine-golden`: 18 of 18.

**The mutation pass** (`D:\Tools\ffx-parity\rc9\aeons\mut\run.mjs` and `mutants.mjs`; scratch, not in the repo): each fault is ONE textual change to ONE source file, applied to the committed code; the lane's test files run; a fault is **killed** when any test fails; the file is then restored byte for byte from memory (and checked against a pristine copy; `git status` clean after every pass). The faults: the command roll's five bands and the 32-bit sum, the free-attack threshold (`<`, the divisor, the mask), the Pay doubling and every part of the motivation (the doubling, the 4 per step, the compatibility div 10, the three hire answers, the monster divisor, the full-gauge +20 and its Curse test, the six-bit draw), the second pass (the re-roll test, the reset of the byte, the Zanmato to Wakizashi conversion), every compatibility delta, the Dismiss -3, the wipe -10, the requester's ranges, the chance test, the standing order, both motivation setters, the after-action columns and clamps, the three menu builders' thresholds, the Combine gate (full gauge, Curse, Mindy), Combine's chance and +10 / -10, the joint counters (Haste and Slow, the actor, the mask, the rank, the agility), the adapters (stream, byte, payment, hire answer, gauge, Curse, the joint actor, Haste and Slow, the bar, parsed actions, near-death, the Combine gate's statuses), the three-aeon summon, Dismiss and wipe, and the seams (menus, executor, turn start, chain carry, setup).
- **First pass, the committed wiring before the new tests: 141 faults, 112 killed, 19 survived, 10 not applicable** (the ten were multi-line patterns in files with Windows line endings; the runner now writes them with the file's own endings). The 19 survivors were all in the adapters, where the first tests used one monster, one seed or one sister: the highest byte over several monsters (first monster only; a fallen one dropped; the data's level read as the byte), a Cursed Yojimbo, the gil read as the payment, the hire answer fixed at 1, a free attack's compatibility not stored, the joint counters' Haste, Slow and joint actor, Repeat after an order, "near death", the Combine gate's Curse, Confuse and fallen sister, Cindy's Summon row with one sister ready or recovering, all three in list position 1, and the gauges after a wipe. Each became a test.
- **Second pass, with the new kernel file and the second engine file (149 faults: the 141, the ten patterns now applicable, and eight added around what the first pass found: only Cindy looked at for the wipe, the aeons out read as Cindy alone, a monster that has left still counting, and the five clauses of the Combine gate's "can act"): 146 killed, 3 survived.** The three: `A18` and `A19` (below) and `D04`, all three Sisters in list position 1, which no test looked at.
- **Third pass, with the presenter file: `D04` killed, and seven faults added with the presenter's tests (a Grand Summon of the Sisters holds no gauge; only Cindy's summon event; only Cindy's dismiss event; the Pay's action-start missing; paying nothing shows no Dismiss; a sister's order with no action-start; a refusal that says nothing) all killed; `A18` and `A19` alive again.**
- **Result: 156 faults, 154 killed, 2 equivalent, 0 alive.** The two equivalent faults, `A18` (a fallen sister can still Combine: the adapter's `dead` clause dropped) and `A19` (an ejected sister can still Combine: its `onField` clause dropped), change code that `canAct` already makes redundant (`inTurnQueue` refuses a combatant that is dead, removed, KO'd or ejected); shown by a one-off exhaustive check over all 256 combinations of alive, removed and six statuses (`D:\Tools\ffx-parity\rc9\aeons\zz-k-equivalence.tmp.test.ts.txt`). The restore was checked after every pass: no `src` file differs from the commit except by the comment edits made on purpose, and every file equals its saved copy under `cmp`.
- **The new kernel file alone** (`parity-ffx-yojimbo-zanmato.test.ts`) kills all 20 faults aimed at the Zanmato facts: the five bands, the gil part (5 per doubling, from 4 gil, from 16 gil, a tripling), compatibility div 9, the three hire answers' factors and divisors, the monster divisor, the full-gauge +19 and the gauge test, the five-bit draw, the re-roll after a first-roll Zanmato, the second pass keeping the penalty, and the second-pass Zanmato staying Zanmato.
- Other equivalent faults were never put in the list, so they count neither as kills nor as survivors: the loop bound of the Pay doubling beyond 2^27 gil (no payment reaches it), the standing-order clear in Combine (nothing sets an order yet), the positive-case column for Combine (both columns hold the same pair), and the `turns` input of a Pay (the kernel's Pay and free attack never read it; only Dismiss does, with its own argument).

## 6. The suite

Run once on the committed tree `42dc0f547` (what came after adds only this note and a comment fix in three test files), in the sparse worktree, which has **no `public/art`** (the art is gitignored on main and lives on Bailey's disk): `node vitest.mjs run --maxWorkers=2`, 18:52 to 21:28 (2 h 35 min, against 1 h 52 min for the earlier run before the new tests, because at least five other full vitest runs of other sessions shared the machine and its 16 cores sat at 100 percent). Output `D:\Tools\ffx-parity\rc9\aeons\suite-final.out`; the failures sorted by `classify-suite.mjs` and `group-errors.mjs` in the same folder.

**1,271 test files on disk: 1,268 reported (1,225 passed, 28 failed, 15 skipped) and 3 never started. 19,675 tests: 19,355 passed, 196 failed, 123 skipped, 1 todo.** The lane's six files pass in it, as do `ffx-engine-golden` (18 of 18) and every other aeon, party, CTB, status, damage and chapter-engine file. Every failure is one of three kinds, and none is in anything the lane touched:

1. **Art that is not in this worktree: 182 failing tests in 17 files, and 5 more files that fail to load (22 files).** Each is an `ENOENT` or an `existsSync`, `artExists` or `hasInstalledIdleArt` check on a path under `public/art` (portraits, plates, `manifest.json`, idle paintings). The files, with their failing tests: ui-portrait-face-crop (145), art-ref-defaults (4), chapters/trema-ship-content (4), chapter-meta-evrae (3), chapter-meta-seymour-anima-macalania (3), pause-remake (3), chapters/den-of-woe-ship-content (3), chapters/isaaru-ship (3), chapter-meta-ffx2-leblanc (2), chapters/fallen-aeons-ship-content (2), chapters/leblanc-art (2), chapters/natus-ship-content (2), chapters/natus-ship-scene (2), cutscene-story-poses (1), chapters/den-of-woe-ship-scene (1), chapters/experiment-scene (1), chapters/fallen-aeons-ship-scene (1); and the five that cannot load the manifest or a sprite list: chapter-meta, party-face-manifest, chapters/chapters-6-7-8-enemy-sprite-manifest, chapters/leblanc-party-sprites, chapters/yojimbo-content. The earlier run on this tree (before the new tests) had every one of them too; no art test failed that did not fail there.
2. **14 timeouts at the 15 s limit, under that load:** advisor-floor (9 of its 22), advisor-menu, live-url-follows-host, strategy-chapter2, strategy-ffx2-bahamut, ui-ffx2-atbmode (one each). **All pass when run alone or given time:** advisor-floor, strategy-chapter2 and strategy-ffx2-bahamut together with `--testTimeout=180000`: 3 files, 54 tests passed; advisor-menu, live-url-follows-host (which also scans the repo, this note included, for the old GitHub address) and ui-ffx2-atbmode alone at the default limit: passed. To check that the lane does not slow the engine, four advisor-floor chapters (7, 9, 18, 2) were run alternately on the lane and on an extract of `origin/r49-rc`, twice each, with the long timeout: **91.4 s on the lane, 88.3 s on the baseline (ratio 1.035)**, while the same tree varied by up to 30 percent between its own two runs (chapter 7: 21.1 s and 16.2 s on the lane, 16.1 s and 20.9 s on the baseline). Run alone and at the default limit, advisor-floor timed out on the baseline too (chapter 3, 25 s); the earlier run before the new tests had five timeouts of its own (advisor-floor twice, strategy-chapter2, parity-ffx-engine-command, sin-fins-core-bench); the last two passed this time and other tests timed out instead: they come and go with the load.
3. **Three files whose test worker did not start** (the pool timed out waiting for it; "Errors 3", so they have no result lines): story-leblanc-kill-order, ffx-sensor-aim-fold, r391-pause-extension. Run alone: 4, 3 and 7 tests passed.

Not caused by the lane, and not hidden: the lane's own files never failed, in this run or in any run before it.

## 7. Open items

1. **BUILT (2026-10-15 night, section 11): the Sisters' other seven orders** (free choice, repeat, attack order, Cindy's spell and support orders, Sandy's support, Mindy's drain). The target search was decoded and proved on the game's own code and the sixteen handlers on its script VM (note Part 2), and the engine now carries them out. A chapter that owns the Sisters can build the gauges for Combine powers by playing orders; the starting motivation stays the build's estimate.
2. **Combine powers**: the handler (event 18) is now proved on the game's script VM (section 11); the count behind its menu row (property 282, the getter's decompile) is still read, not run. **Fixed 2026-10-16 (section 11.6):** the engine used to make two readings that the proven handler does not (roll BEFORE looking for a target, and aim the Delta Attack at one foe); Combine now runs through the proven interpreter, so it looks for a target and a full bar first (nothing found, no draw), then rolls, and the Delta Attack hits every foe the search stored, six hits on each. A failed Combine performs the rest command on herself, which is her last command, and passes the turn at rank 3 (the rest command `0x312C` has no record in our data). Open question 9 (a stale pair re-applied by Cindy's own finished action) is not modelled. Whether Cindy's own parsed-action count also rises when she performs a joint action another sister asked for is not known; the engine counts only the asker's.
3. **Unsourced numbers the chapter must label**: the Sisters' starting motivation; Yojimbo's starting compatibility (128 was strongly indicated by a community save pack, not the owner's; since 2026-10-17 it is the game's own starting value (read at boot, 2026-10-17), with the hire answer 2; section 2.1). Nothing else was invented.
4. **K5 (the Dismiss as a queued action) is left out**: [R] timing, waits for the record queue. The numbers it concerns (-3, the revive) already match.
5. **Group numbers.** The engine's monsters are all one group (`Chr+0x504` is not in our data), so a Wakizashi on all hits every monster the picker allows, and the free attack's "matching group" Zanmato check is read as the monsters in the target set the pick just stored (note open question 2). A formation with several groups needs the numbers in the enemy data.
6. **`zanmatoLevel` is the game's byte plus 1** (the data files' convention, section 2.4); an enemy with none counts as byte 0. Evrae's first record holds 3 with a comment that disagrees with the others, so a chapter that fights it with Yojimbo out must check it.
7. **FIXED (2026-10-15 night, section 10): a landed Zanmato killed only the FIRST target in the engine.** The `zanmato` row said `single-enemy`, so `aimOf` cut the pick's list to one entry (read from a run: two monsters, a certain Zanmato, one `ko` event; with three, still one). The row now carries `extra.groupTarget: true` and keeps the whole list, the pick sees BattleDistance, and the rule is replayed against the game's own runs. What stays true: a landed Zanmato kills even a monster with Death resistance 255 and whatever flags it carries (the Slice flag does nothing in this build), so a foe a chapter wants to survive it needs a rule of the chapter's own, not a resistance; the Yu Pagodas are "destroyed" by their own script and return, Braska's Final Aeon's first form resets to the second, and every other foe dies (section 10).
8. **The Pay record's own rank** and the Zanmato record's Overdrive cost are not in our data. The engine charges the chosen command's rank (3 for all five) and spends the gauge only by the full-gauge bonus.
9. **Banish with the Sisters out** dismisses all three as a wipe (unmodelled in the game's terms; no shipped chapter fights Seymour Flux with them). **Yojimbo Petrified while out** is not a wipe in the engine (event 11 covers KO and Petrify; `aeons.ts` sees only a KO), so the -10 is not taken for a Petrify.
10. **K3** (`wakizashi-multi` carries id `0x30E0`, the game's all-target Wakizashi is `0x30E1`) was not part of this lane and is untouched; no code branches on the ids by value.
11. The kernel's result carries Yojimbo's reaction byte (nod, headshake) but the engine does not emit it; a screen that wants the beat can read it from the events later.
12. The advisor (`engine/tactics`, `estimate.ts`, `intent.ts`) reads `state.aeonId` and knows nothing of the trio or of the free attack; the advisor's look-ahead for these builds is not built. Read from a run: `buildAdvisorView` builds its card without throwing on Yuna's turn with either aeon summonable and on Yojimbo's, Cindy's and Sandy's turns; for the two aeons it suggests Dismiss, because it knows no Pay or order rows. A chapter that shows the card should hide or reword it for these turns.
13. **The compatibility is a global in the game and persists between battles; this lane carries it through a chain only** (`state.flags`, `carryPartyForward`). Making it survive a session or a chapter change means storing it, and that is a save-data change (`src/app/SaveData.ts`), the one class the release rules still give a deep review before it goes public (AGENTS.md "Release"). The simplest chapter starts every battle from its stated value.

## 8. For the chapter

A build, in the shape the tests use (`tests/unit/helpers/ffxKRig.ts` has working ones for both aeons):

```ts
const build: FFXPartyBuild = {
  ...chapterBuild,
  aeons: [...chapterBuild.aeons, { id: 'yojimbo', name: 'Yojimbo', spriteKey: 'yojimbo', stats, hp: stats.maxHp, mp: 0, overdriveGauge: 0, abilityIds: [], overdriveIds: [] }],
  // 128: the game's own starting value (read at boot, 2026-10-17) (it was strongly indicated by a community save pack, not the owner's: slots 1-84 all read 128; 164 by slot 106)
  yojimbo: { compatibility: 128, hireAnswer: 1 },
  gil: 20_000,
};
// the Pay screen sends: { kind: 'ability', id: 'yojimbo-pay', targets: [], gilSpent: 4_096 }
```

1. Add `yojimbo` and/or the three Sisters to the build's `aeons` with the chapter's stat rows (section 2.1), give `yojimbo` and `sisters`, and label the compatibility (128: "strongly indicated by a community save pack, not the owner's (slots 1-84 all read 128; 164 by slot 106), live confirmation pending") and the motivation (an estimate).
2. Give each foe its `zanmatoLevel` (section 2.4): it decides how hard Zanmato is. The Pagodas and Braska's Final Aeon already carry it.
3. Screens: the Pay amount picker (0 to `state.flags['yojimbo:gil']`), the Sisters' order list from `availableCommands` (labels are ours), three aeons on the field, the summon and dismiss beats for three, the results screen's gil (the gil Pay spent is `build.gil - state.flags['yojimbo:gil']`).
4. For Yojimbo and for the Sisters the engine half is complete for a chapter since 2026-10-15 night: a landed Zanmato hits the whole group it picked (section 10) and all eight orders are carried out (section 11). What remains the chapter's: the starting compatibility and motivation (labelled estimates), the records of the possessed Yojimbo's and the Dark Yojimbo's own Zanmato (section 10.5), and the screens.
5. Mockups first (AGENTS.md rule 9): the Pay amount screen and the Sisters' order list are new screens.

## 9. CHANGELOG paragraph (FFX only; for the release driver to paste, not live)

- **FFX, the battle engine only (nothing in the game gives you either aeon yet, so no chapter changes and there is nothing to see):** the player's own **Yojimbo** and the **Magus Sisters** now play by the game's rules wherever a chapter hands them to the player. Yojimbo sometimes acts on his own at the start of a turn (32 turns in 256 at compatibility 128, 63 at 255) and otherwise offers Pay and Dismiss. Pay turns your gil into one roll (4 points for every doubling from 8 gil, plus his compatibility, plus 20 for a full Overdrive bar unless he is Cursed, scaled by what you answered when you hired him) that picks Daigoro, Kozuka, Wakizashi, Wakizashi on all or Zanmato, and his compatibility moves with what he did (Daigoro -1, Wakizashi +1, Wakizashi on all +3, Zanmato +4, paying nothing -20, a Dismiss before he has acted -3, being knocked out -10). A foe with a Zanmato rank divides that roll, and when the first roll is not a Zanmato the second can only ever give Wakizashi on all, so the whole chance of a Zanmato is the first roll; his free attack is never a Zanmato against such a foe. The three Sisters come as one Summon and stay until all three are down; each sister's turn opens with the game's order menu; Combine powers (all three bars full) rolls 200 plus her motivation once it has found a foe within reach, and on a win Cindy performs the Delta Attack for all three whoever asked, on every foe in reach at once for six hits each, and the others wait their turn by their Agility; Dismiss stands a fallen sister up at 1 HP. A landed Zanmato kills every foe of the group it picked, not the first only (section 10); the Sisters' other seven orders are carried out by the game's own search and candidate lists (section 11). Everything else is replayed against the game's own code (433,837 vectors, no mismatch). Yojimbo's starting compatibility (128, strongly indicated by a community save pack, not the owner's, live confirmation pending) and the Sisters' starting motivation (an estimate) are for the chapter to state. Every other FFX chapter plays move for move the same on twelve seeds each.

## 10. The player's Zanmato hits the whole group (2026-10-15, night; FFX only)

Status: **fixed, replayed against the game's own runs, mutation-tested, same-seed identical, pushed** on this branch as the commits after `d8fa5b69`. **Game case: FFX only** (the player's Yojimbo and the chapters that give him to the player are FFX; FFX-2 has no player Yojimbo and nothing here is read by `src/battle/ffx2/**`). Brief: the release driver, relaying Bailey's words of tonight: "We need to prioritize the dark Yojimbo and dark magnus sisters chapters over night. It needs to go live over night and not be hidden. It needs to be done and complete end-to-end." This fix gates chapter 27's difficulty bench and release. Source: `research/re-ffx-zanmato-and-orders.md` Part 1, final decode `f59c4592` on branch `re-ffx-zanmato-and-orders` (the game's own code in the harness: 16,384 full-cross vectors, 4,096 bit-flip pairs, 1,500 pick vectors, 0 mismatches). It closes open item 7 of section 7.

### 10.1 The rule, in player words

When Yojimbo's roll comes up Zanmato (a Pay or a free attack), the game looks at every enemy it can reach (in the battle, targetable, alive, at battle distance 1 or less), picks ONE group of them with one random draw and kills **every enemy of that group**. Every foe of chapters 27 and 28 is group 0, so that is all of them. It cannot miss, does no damage and has no "no effect": Death comes at chance 255, which lands whatever the Death resistance is (255 included), whether the foe is a Zombie, and whatever flags the monster carries (the Slice flag does nothing in this build, so a Dark Aeon's Slice immunity protects it from nothing). Each victim is knocked out (HP 0, every status gone); a monster leaves the battle; a foe that held Auto-Life loses it and is stood up at a quarter of its maximum HP, as after any death. The one exception to "Death lands" is a Petrified foe: the Death is refused and the row's shatter chance of 100 breaks the statue instead (a roll of 0 to 99 of 0 to 100). The Yu Pagodas are "destroyed" by their own script and return; Braska's Final Aeon's first form resets to his second; a possessed aeon just dies. After the Zanmato's group draw (stream 5, made whenever anyone is legal) the hit takes one status draw per victim.

### 10.2 What changed

- `src/data/ffx/aeons/abilities-optional.ts`: the `zanmato` row gains **`extra.groupTarget: true`**, the flag that makes the executor keep exactly the list a script named (`targeting.ts#aimOf`; the Mix, the possessed aeons' group specials and Yu Yevon's Gravija already use it). Before, the row said `single-enemy`, so `aimOf` cut the pick's list to its first entry and a Zanmato against two foes killed one (proved by running it before the change: 1, 2 and 3 foes, one `ko` each). `targeting` stays `single-enemy`. This is the change the note's final decode asks for, and the smaller of the two routes.
- `src/battle/ffx/adapt/target-world.ts` and `adapt/yojimbo.ts`: **the pick now sees BattleDistance.** The engine folds reach into Targetable as one bit (reach 0 or more), so a foe at battle distance 2 or 3 counted as in reach of a reach-1 command. `chainWorld` takes `withDistance` (default off, so every other caller is unchanged) and gives each slot its `battleDistance`; the pick of the player's Yojimbo asks for it, and the kernel's own test (`far > reach`, proven against the game's code) runs with the game's reach for his five commands (`YOJIMBO_COMMAND_B1A`: Daigoro 0, the others 1). No shipped data has a distance above 1 (Sinspawn Gui's head is 1) and no shipped chapter owns the aeon, so nothing that ships moves.
- `src/battle/ffx/adapt/streams.ts`: the stream registry gains the row for the player's Yojimbo's group commands (one stream-5 draw whenever the legal set is not empty, even with one group populated; none when it is empty; one status draw per target afterwards).
- `src/battle/ffx/ai/yu-pagoda.ts` (**one line, found by the chapter 28 test below**): a Death status that lands inside the hit (only the player's Zanmato can: the Pagodas' Death resistance is 255) already takes the Pagoda off the field, and the Pagoda's on-hit script then knocked it out a second time, so each Pagoda showed two `ko` and two `part-destroyed` events. The script now knocks it out only if it is still standing (an HP blow leaves the death check pending for the script, so that path is unchanged) and arms the return as before. The state was right all along (the return is armed once, with the pool of a full life); only the events were doubled. This also happened for a single-target Zanmato, so it is not caused by the group change.

### 10.3 Tests and proofs (nothing run in the browser: engine only; no full suite tonight)

| File | What it proves |
|---|---|
| `tests/unit/parity-ffx-engine-k-zanmato.test.ts` (21) | against an **independent oracle** (`helpers/ffxZanmatoOracle.ts`, the note's rule written again with no import of a kernel, adapter or the engine): a real Pay of the player's Yojimbo that buys a certain Zanmato (2^22 gil: a motivation of exactly 80), every draw of the generator tapped. 1, 2, 3, 4 and 8 foes in one group, each with Death resistance 255: all die, in slot order, the action's target list is the whole list, the streams are exactly `[17, 5, 59 x n]` (the script's roll, ONE group draw, one status draw each on the aeon status stream 27 + 32). Three Dark Aeons (every status byte of the dark-aeons note, Life, Sensor, Scan, CTB, Bribe, Doom, Eject and Auto-Life immune; Slice has no field here) die; Death resistance 0, 100, 254, 255 give the same result; **a paired differential**: the same seed with plain foes and with every immunity in place gives the same event log and the same draws (six seeds). Mixed states (living, Zombie, Doom, Scan, Zombie with Auto-Life). Auto-Life is stripped and revived at a quarter, one revive per holder. A Petrified foe takes a second status draw (the shatter roll) and breaks when it is below 100. **A foe at distance 2 or 3, an untargetable one, a hidden one and a dead one are left alone** (no event names them, no status draw), alone or beside one legal foe; with nobody legal there is no group draw, nothing is paid and the compatibility does not move. A free Zanmato at compatibility 255 is the same action. **Chapter 28's lines**: Braska's Final Aeon with his two Pagodas (the first form resets to the second, each Pagoda is destroyed once, its return armed with a full life's pool of 5,000) and a possession link (the possessed Yojimbo dies, the battle is won, each Pagoda destroyed once) |
| `tests/unit/parity-ffx-zanmato-vectors.test.ts` (6) | **the game's own runs**: `tests/fixtures/parity/ffx/zanmato_pick.json` (300 of the note's 1,500 pick vectors: the auto-target on command 0x30E2 with the bytes the game's lookup reads from its command record, 0xb7 and 0x04, over 1 to 8 monsters with groups, distances 0 to 3, Targetable and dead flags; the kernel the engine's pick uses AND the oracle both return the game's mask and take the game's draws; 268 vectors draw once on stream 5, 32 draw nothing; what the game then did: every member dead with HP 0, nobody else changed, Slice-flagged targets included) and `zanmato_outcomes.json` (50 of the 1,800 mixed-state vectors, 180 target outcomes, replayed through the whole engine: every target the game killed dies, the Auto-Life holders are the ones revived, one status draw per target) |
| the lane's six files | 132 tests, unchanged and green (no earlier test pinned "first target only"; the old behaviour was only described in item 7 of section 7, now rewritten) |
| the other 31 files that mention Zanmato (the Yojimbo chapter, the Pagoda, possessed-aeon and Sin AI, the command records, the gauge UI tests) | green except `chapters/yojimbo-content` (the sparse worktree has no `public/art/manifest.json`; unrelated); one statistical test of `chapters/yojimbo-engine` times out at the default 15 s when the machine is loaded and passes alone in 5 s |
| `ffx-engine-golden` (18), `ff7-golden` (3), `ffx2-atb-golden` (6) | green |
| `npx tsc --noEmit` | clean |

The fixtures were exported from the note's own harness scripts (`D:\Tools\ffx-parity\zanmato-orders\zworld.py` and the generators of `zan_vectors.py` and `zan_vectors2.py`, same seeds and draw order, every 5th pick vector and every 40th outcome vector; the game was never run); the exporter, the mutation runner and the odds scripts are in `D:\Tools\ffx-parity\rc9\aeons\zanmato-fix\`. **The status stream:** the note says the harness's status draws were on "stream 66"; that is a party-style slot's stream (the harness user's aeon flag was written as 1, not bit 2), and the fixture checks only that the game's hit took one draw per target on one stream. The engine's user is an aeon, so its status stream is the shared aeon stream 27 + 32 = 59 (proved against the game's stream function in `parity-ffx-rng`).

**Mutation pass: 17 hand-made faults on the new code, 16 killed, 1 equivalent.** The fixes undone (`groupTarget` removed, the command carrying only the first target, ids in descending order), the pick without BattleDistance (off, always 0, read one too far), the legal set's `far >= reach`, a second or a missing stream-5 draw, an empty set returning a non-empty mask, Targetable ignored in the pick, Zanmato's command byte single (0xb3) or reach 0 (0x37), the row hitting twice, and the Pagoda guard removed or inverted. The equivalent one: `canMiss: true` on the row changes nothing, because the engine reads `canMiss` only for an ability with no game record (`adapt/command.ts#derivedAccuracyFormula`) and this row has the game's own (accuracy formula 0: it never rolls), so no hit draw is made either way; the flag stays `false` as documentation.

**Same seed:** 12 seeds (1 to 12) on all 14 FFX chapters, each played by the chapter's own line through its whole chain exactly as `ffx-engine-golden` plays it: **168 chains, 294 links; the outcome, the turns, the KOs, the digest of every link's full event log and the digest of the generator's final stream states are byte-identical to `d8fa5b69`** (288 victories and 6 defeats, the same ones). Nothing ships the aeon for the player, so nothing could move; the proof says nothing did. (Runner: the lane's `zz-sameseed-proof` in `D:\Tools\ffx-parity\rc9\aeons\`, run once on `d8fa5b69` and once on this tree; the two outputs compare equal under `cmp`.)

### 10.4 BENCH NOTE (for the difficulty bench of chapter 27; keeping or removing this is Bailey's call, the faithful build keeps it)

Under the game's own rules **a landed player Zanmato ends a Dark Aeon fight at once**: the Dark Aeons die of it whatever their immunities. It is **rare**:

- **Never from a free attack** against a foe with a Zanmato byte above 0 (the script turns it into Wakizashi on all), and every Dark Aeon carries byte 4.
- **Per Pay**, against byte 4 (L = 4, `zanmatoLevel` 5), the chance is the number of the script's 64 six-bit draws whose first roll is Zanmato; **the second roll can never give one**. Exact, computed by running the kernel's own Pay on all 64 draws (and equal to the closed form `clamp(trunc(V) - 16, 0, 64)` in every cell):

Hire answer 1, per Pay, L = 4 (the payment is limited by the party's gil):

| payment (gil) | compat 128, no gauge | compat 128, full gauge | compat 255, no gauge | compat 255, full gauge |
|---|---|---|---|---|
| 1,000 | 0/64 (0.0%) | 12/64 (18.8%) | 0/64 (0.0%) | 14/64 (21.9%) |
| 10,000 | 0/64 (0.0%) | 15/64 (23.4%) | 0/64 (0.0%) | 17/64 (26.6%) |
| 100,000 | 0/64 (0.0%) | 17/64 (26.6%) | 0/64 (0.0%) | 20/64 (31.3%) |
| 1,000,000 | 0/64 (0.0%) | 20/64 (31.3%) | 2/64 (3.1%) | 22/64 (34.4%) |
| 9,999,999 | 3/64 (4.7%) | 23/64 (35.9%) | **5/64 (7.8%)** | 25/64 (39.1%) |
| 99,999,999 | 5/64 (7.8%) | 25/64 (39.1%) | 8/64 (12.5%) | 28/64 (43.8%) |

The extreme Pays by hire answer (the whole gil paid, compatibility 255, L = 4):

| gil paid | hire answer | no gauge | full gauge |
|---|---|---|---|
| 9,999,999 | 0 | 11/64 (17.2%) | 31/64 (48.4%) |
| 9,999,999 | 1 | 5/64 (7.8%) | 25/64 (39.1%) |
| 9,999,999 | 2 | 27/64 (42.2%) | 47/64 (73.4%) |
| 99,999,999 | 0 | 14/64 (21.9%) | 34/64 (53.1%) |
| 99,999,999 | 1 | 8/64 (12.5%) | 28/64 (43.8%) |
| 99,999,999 | 2 | 32/64 (50.0%) | 52/64 (81.3%) |

The same extreme Pay (99,999,999 gil, compatibility 255, hire answer 1) by the highest Zanmato byte on the field: byte 0, 64/64 (always); byte 2, 24/64 without a gauge and 44/64 with one; byte 3, 14 and 34; **byte 4, 8 and 28**; byte 5 (Braska's Final Aeon, chapter 28), 4 and 24. Without a full Overdrive gauge and with hire answer 1 no Zanmato is possible below a payment of 131,072 gil at compatibility 255 (L = 4); with a full gauge it is possible from any payment (+20 to the motivation, unless he is Cursed), and the whole gauge is spent. Answer 0 scales the motivation by the share of the gil that is paid (75 to 125 percent), answer 2 multiplies it by 0.8 and divides by (L + 3) div 3 instead of L + 1.

### 10.5 The two records left to the chapter lanes (not edited here)

1. **`possessed-yojimbo-zanmato`** (`src/data/ffx/enemies/braskas-final-aeon-abilities.ts`; chapter 28), the game's row **0x60E2** of the monster-magic-2 table: HP damage by the **fixed formula 6** (the engine's `fixed-no-variance`), **power 200** (200 x 50 = 10,000, cut to **9,999** per target by the damage chain; the row has no Break Damage Limit flag), 1 hit, damage kind "neither" (`damageType: 'other'`), accuracy formula 0 (never rolls: `canMiss: false`), target type group with reach 2 (keep `targeting: 'all-enemies'` and `extra.groupTarget: true` for the front line the script names), not reflectable, shatter 0, flag word 0x44010006, **no status at all** (no Death, no `ko` entry). One HP-variance draw is spent per target on the monster user's own stream (stream 28 for actor slot 20) although the value is ignored. Result: 9,999 on each front-line actor, unchanged by Protect, Shell, Defend, Sentinel or the target's stats; a target at 9,999 HP or less dies by the ordinary death check (an Auto-Life holder is revived). The ability today says formula `none`, power 0, targeting `all-enemies` and a `ko` status at chance 255: wrong on four counts. [note sections 1, 5 and 6 item 7]
2. **Dark Yojimbo's own Zanmato**, the game's row **0x410A** of the monster-magic-1 table (chapter 27; not 0x30E2): HP damage by the **Strength formula (formula 1)**, **power 250**, 1 hit, target type all with reach 2 (the whole front line; his script aims it), damage kind "neither", the **cap-99,999 flag**, the **cleansing flag with the extra-status mask Auto-Life (0x200)**, shatter 100, no status chance. It strips Auto-Life before the death check: at the Dark Yojimbo's Strength 244 against a Defense of 60 it dealt 99,999 to the front-liner tested, the hit record's extra word came out 0 and **no Auto-Life revive was queued** (all three variants dead): the chapter's permanent Auto-Life does not save anyone from it. [note sections 1, 5 and 6 item 5]

Also in the note's table and not touched: row 0x4085 (the Yojimbo of the Cavern of the Stolen Fayth, Chapter 9, `yojimbo-zanmato`): HP, formula 6, power 200, all with reach 2.

### 10.6 Unproved, and what the chapters should know

- **All foes are group 0.** The engine has no group number on a monster (`Chr+0x504` is not in our data), which is exactly chapters 27 and 28. A formation with several groups needs the numbers in the enemy data; the kernel's group pick is proven for several groups (the 300 pick vectors above include 86 with more than one group in play and 63 with more than one legal group) and the executor keeps whatever list the pick returns.
- **`wakizashi-multi` still aims itself** (`all-enemies` without `groupTarget`): it hits every living, targetable foe in the engine's reach instead of the pick's list. Today that is the same set (one group, distances 0 and 1); it differs only for a foe at distance 2 or 3, which no data has. A chapter that places one should give that row `extra.groupTarget: true` as well (one line, not done: out of this brief).
- **Auto-Life holders.** The engine, like its death check for any KO, strips the Auto-Life and stands the holder up at once at a quarter of its maximum HP; the game queues the revive (command 0x311F). Whether the game's queued revive reaches a monster that has already left the battle is not shown by the harness (it checks that the record is queued). No foe of chapters 27 and 28 holds Auto-Life (the Dark Aeons are immune to receiving it).
- **Petrified foes** are replayed by the engine test (second draw, shatter below 100) and by the note's four harness vectors; the roll of exactly 100 (the statue survives) is not forced in the engine.
- **Presenter events of a landed Zanmato** (for the driver): the Pay's `action-start` and `action-end`, then the Zanmato's `action-start` whose `targets` is the WHOLE list (ascending slot order), then per target in that order a `ko` (no `damage`, no `miss`); an Auto-Life holder shows a `status-remove` (Auto-Life), a `revive` (cause `auto-life`) and a `status-add` (Critical) instead of a `ko`; Braska's Final Aeon's first form shows a `form-change`; a Pagoda shows one `ko` and one `part-destroyed`; a Petrified foe shows a `status-add` for Eject and a `message`, no `ko`; the last foe's death is followed by `victory`; then `action-end`.

## 11. The Magus Sisters' seven orders (2026-10-15, night; FFX only)

Status: **built, replayed against the game's own code and script VM, tested against an independent oracle, mutation-tested, same-seed identical and pushed** on this branch as the commits after the Zanmato fix of section 10. **Game case: FFX only** (FFX-2 has no Magus Sisters and nothing here is read by `src/battle/ffx2/**`). Brief: the release driver, relaying Bailey's words of tonight ("We need to prioritize the dark Yojimbo and dark magnus sisters chapters over night. It needs to go live over night and not be hidden. It needs to be done and complete end-to-end."), through the RE main session. Source: `research/re-ffx-zanmato-and-orders.md` Part 2, final decode `f59c4592` on branch `re-ffx-zanmato-and-orders`: the target search ran on the real FFX.exe code (24,000 vectors, 0 mismatches) and the sixteen order handlers on the game's own script VM (24,000 runs, 0 mismatches against an independent model). It closes open item 1 of section 7 and changes the wording of items 2 and 3.

### 11.1 The orders, in player words

Every order of a sister is a fixed list of things to try, in order; each try is a **search** (can she use the command and pay its MP, then a roll against a chance made from her motivation M, then a pick among the targets that pass the order's test). The first try that passes is carried out; if none does she loses motivation (5; 1 after "Are you all right?"; 10 after a failed Combine powers) and **rests** ("Taking a break", no effect, a turn like any other). A roll of a negative chance always passes with no draw; a chance of 256 or more passes but the draw is still spent. The labels below are the game's names; our menu rows use our own wording (`ORDERS` in `aeon-commands.ts`).

- **"Do as you will."** (free choice) *Cindy*: Auto-Life on a sister without it (M + 50), Full-Life ((50 + M) div 2) then Life ((200 + M) div 2) on a fallen sister, Attack (M), Flare (M div 8), and then, half the time (a plain roll of 128), Firaga, Thundaga, Blizzaga, Waterga (M div 2 each). *Sandy*: Reflect on Cindy when Cindy has none (M + 200), else Razzia (128), else Attack with no roll. *Mindy*: when Cindy is alive and holds Reflect and no order stands, one spell, or two when a plain roll below M passes, **cast at Cindy so that it bounces onto the enemies** (Flare, else Bio then Death, else the eight elemental spells, else Drain; she remembers them); otherwise Passado (M + 100), else Attack (M + 100).
- **"One more time."** Offered from a sister's second action. A plain roll below M + 150 (Cindy) or M + 120 repeats her **last performed command** (the rest command counts): it stands as the order for **all three sisters** until the next order any of them takes, every roll of her old list then passes only for that command (no draw) except a negative chance, the two-argument gains are suppressed and the repeat's own pair applies (+2 gauge points and +4 motivation when the repeated action had an effect, 0 and -6 when it had none, Mindy -15), and she re-enters the chain of her last class; on a failed roll the order is cleared and a short chain runs (Cindy: Camisade, Attack; Sandy: Razzia, Attack; Mindy: Passado, Attack). Mindy's repeat replays her remembered pair of spells at Cindy, with no roll.
- **"Fight!"** *Cindy*: Camisade (20 + M), else Attack (150 + M). *Sandy*: Razzia (M + 50), else Attack (M + 180). *Mindy*: Passado (M + 30), else Attack (M + 180).
- **"Go, go!"** (Cindy only) Pray, aimed at the whole side, when she is hurt (the chance is her missing share of HP out of 256); Osmose when she is short of MP (the same, for MP); Attack (2M); then, on a plain roll below M div 2, Ultima (M - 80, which is negative below 80: chosen with no roll when she has the 90 MP), Flare, Drain, Blizzaga, Waterga, Thundaga, Firaga, Attack with no roll; then Camisade (M).
- **"Help each other!"** (Cindy only) Full-Life (M) and Life (150 + M) on a fallen sister, Auto-Life on a sister without it (50 + M), Cure, Cura, Curaga on the others who are hurt (M div 2), then Camisade (M).
- **"Defense!"** (Sandy only) Shell, Protect, Haste on a side that lacks it and has no Reflect (M + 50, M + 50, M), NulAll on a side missing a Nul (M + 50, aimed at the whole side), Cure, Cura, Curaga on the others who are hurt (M div 4, 6, 8), Razzia (M), Attack (M).
- **"Are you all right?"** (Mindy only) Lancet (M div 2), Drain by her missing HP, Osmose by her missing MP; with none taken she loses 1.
- **"Combine powers!"** Cindy's Delta Attack for all three, whichever sister asked. She first needs **a foe within the Delta Attack's reach (distance 0 or 1) and her own bar full and no Curse** (else there is no roll at all: she loses 10 motivation and rests); then a plain roll below 200 + M. A win: Cindy performs the Delta Attack on **every foe in reach at once, six hits on each** (the game's record is a group-type command), all three sisters pay the bar, the other two wait their turn by their Agility, and the asker gains 10 motivation; a miss costs 10 and she rests, which is her last command. Combine powers sets no last command on a win and no standing order is left by it (it clears the standing order first).

A sister with Reflect is never given Shell, Protect or Haste; a sister without it keeps being offered them until she has the status. After every action the gain pair of the try that was taken is applied (gauge in the aeon bar's points, motivation 0 to 100); the pair stays set, so two queued spells apply it twice.

### 11.2 What changed

- New kernels (pure, no DOM or three, deterministic): `kernel/sister-search.ts` (the target search: the candidate sets, the usable test, the roll with the standing order, the nine property tests, the pick, the stored group; the 33 command rows read from the install's own command table), `kernel/sister-chains.ts` (the chains **as data**, every number cited to the note's section 11 rows) and `kernel/sister-orders.ts` (the handler interpreter, in the VM's order).
- New adapter `adapt/sister-orders.ts`: builds the search's world from the engine's combatants (the Sisters out and the monsters), runs the handler to the end first (as the script event does), then carries out the commands it queued **in order, each as its own action through the ordinary executor** (so Reflect, Cover, the target builder, the hit pipeline and the death check apply to them), applies the gain pair after each action and keeps each sister's private variables in `SistersRuntime.memory` (last command, class, repeat flag, Mindy's stored pair of spells and its count). `adapt/sisters.ts` gains that memory, exports `magusChrOf`, `storeMagusChr` and `points`, and `BUILT_ORDERS` is all eight; `aeon-commands.ts` dispatches the orders to the adapter (all eight since 2026-10-16, Combine powers included). The standing order stays the **one global** of the existing kernel (`SistersRuntime.order`).
- One data flag: `nul-all-aeon` gains `extra.groupTarget: true`. The game's record 0x312D is a group-type command, but the data row said `single-ally`, so Sandy's "Defense!" would have given the four Nuls to ONE sister (found by the engine test, the same defect as the Zanmato's).
- **2026-10-16, the Delta Attack and Combine powers (section 11.6):** the `delta-attack` row follows the game's command record (group-type: `extra.groupTarget: true`, the numbers unchanged), and Combine powers is carried out by the same interpreter as the other seven orders (`combineOrder` is gone; `adapt/sisters.ts#jointAction` is the joint action it queues).
- Two earlier pins retired with their cause beside them (`parity-ffx-engine-k-aeons.test.ts`): "only Combine powers has a handler, every other row is disabled" and "the free choice is refused as not built".

### 11.3 The presenter's events for each order (for chapter 27)

Read from real runs (`parity-ffx-engine-k-orders*.test.ts` drive them; the lines below are from the engine's own log). **Every order has the same frame**, and an inner action is an ordinary action of the engine:

```
action-start   actorId = the sister, abilityName = our label of the order, NO abilityId, targets []   <- the order itself
  (0, 1 or 2 times, for each command she carries out:)
  mp-damage    a spell's MP is paid before its start (Camisade, Razzia, Passado, Attack and Pray cost none)
  action-start actorId = the sister, abilityId = the command's ability, targets = who it is aimed at   <- an inner action
    ...the command's own effect events...   and, when the aeon's own blow fills its bar: overdrive-gauge cause 'aeon-attack'
  action-end
  overdrive-gauge  who = the sister, cause 'sister-order'   <- the gain pair, applied after the action (absent when it changes nothing)
action-end                                                  <- the order's end
```

- **The rest command** is no action: only the order's `action-start` and `action-end`, nothing between (no inner action, no event). Her motivation drops by the loss (no `overdrive-gauge`: the rest pair has no gauge part). A presenter can show "takes a break" on an order whose start is followed directly by its end.
- **Fight! / Attack / Camisade / Razzia / Passado** (also the repeat of one): inner `action-start` (camisade, a foe), `damage` (the foe, a positive amount), `action-end`, then `overdrive-gauge` 'sister-order'. Passado is 15 `damage` events on one foe.
- **Free choice, Auto-Life**: `mp-damage`, inner `action-start` (auto-life, one sister), `status-add` (that sister, auto-life). **Full-Life or Life on a fallen sister**: `status-remove` (ko), `revive` (cause the spell's id).
- **Go, go!, Pray**: inner `action-start` (pray, targets = all three sisters), a `damage` event per sister **with a negative amount** (the engine reports a heal that runs through the damage chain as a negative `damage`), and `status-add` (critical) for one whose HP is low. **Osmose**: `mp-damage` (the foe), `mp-heal` (the sister).
- **Help each other!, Cure, Cura, Curaga**: `mp-damage`, inner `action-start` (the spell, one sister), `damage` with a negative amount.
- **Defense!, Shell, Protect, Haste**: `mp-damage`, inner `action-start` (the spell, one sister), `status-add` (the status). **NulAll**: inner `action-start` with `targets` = all three sisters and four `status-add` (nultide, nulblaze, nulshock, nulfrost) for each.
- **Are you all right?, Lancet**: inner `action-start` (lancet, a foe), `overdrive-gauge` 'aeon-attack', `mp-damage` (the foe), `damage` (the foe), `heal` (the sister). **Drain** is the same with HP; **Osmose** as above.
- **Mindy's Reflect combo and its replay by "One more time"**: TWO inner actions in a row, each `mp-damage`, `action-start` (the spell, **`targets` = [cindy]**), the effect events landing on the **enemies** (the Reflect bounce has no event of its own: the spell is aimed at Cindy and her Reflect sends it to a random enemy, one stream-6 draw), `action-end`, then `overdrive-gauge` 'sister-order' (the pair applies after each action, so a two-spell turn gains twice).
- **Combine powers** (the order's start, Cindy's Delta Attack as her own inner action with `targets` = every foe in reach and six `damage` events on each, the three bars, the order's end). With nothing to aim at, a bar that is not full, or a Curse, it is the rest turn above, and **no stream-18 draw is taken at all**.
- **"One more time"** has the label of the repeat order and then the frame of the command it repeats; a repeat that finds nothing to hit is the rest turn above.

### 11.4 Tests and proofs (no full suite tonight)

| File | What it proves |
|---|---|
| `tests/unit/parity-ffx-sister-orders.test.ts` (5) | **the game's own runs**: `tests/fixtures/parity/ffx/sister_search.json` (300 of the 24,000 search vectors on the real code: the usable mask, the roll, the picked slot, the stored mask and every draw's stream and place; the 33 command rows equal the records the game's lookup returned) and `sister_orders.json` (320 of the 24,000 VM runs, 20 of each of the sixteen events: the ordered log of rolls, searches, standing-order writes, gains, performs and the Delta Attack call, and the private variables afterwards); plus the ability ids the orders perform against the data's own command records and MP costs, and (since 2026-10-16) the Delta Attack row against its record 0x30EA: formula 1 (Strength), power 10, 6 hits, no element, the command row's group type, reach 1 and opposite side, and the group flag |
| `tests/unit/parity-ffx-engine-k-orders.test.ts` (20) and `-more.test.ts` (18) | **the engine against an independent oracle** (`helpers/ffxSisterOracle.ts`, the note's search and handlers written again as straight-line code, no import of a kernel or an adapter): each order of each sister swept over 16 to 60 seeds so every branch is reached (the commands carried out and their order, the draws on streams 18 and 4, the gains, the standing order, her private variables, the rest command and the loss); Silence; the Nuls; the dead; the Reflect combo bouncing onto the enemies with one stream-6 draw per spell; "One more time" (the four-argument pair, the suppressed two-argument gains, the failed roll, Mindy's replay); the standing order cleared by another sister's handler; the gates it opens and Ultima's negative chance; the clamps; the rest turn charged rank 3; a fuzz of 40 whole battles x 60 turns taking any order the menu offers, with HP and MP shaken, checking nothing throws, every action ends and the bars stay in range; and, since 2026-10-16, Combine powers in the proven handler's terms: the search BEFORE the roll (no foe within reach 1, none targetable, a bar one point short, a Curse: no draw on either stream, rest, -10), the order's one stream-18 draw and its stream-4 pick only among several foes, **the Delta Attack on 3 foes hits all 3 (six blows on each, the action's hits numbered 0 to 17)** and only the foes within reach are in the group |
| the lane's six files, the Zanmato files and the three goldens | green |
| `npx tsc --noEmit` | clean |

The fixtures were exported from the note's own proof scripts (`D:\Tools\ffx-parity\zanmato-orders\search_proof.py` and `handler_proof.py`, same seeds and draw order, every 80th search vector and every 75th handler run; the game was never run); the exporter and the mutation runner are in `D:\Tools\ffx-parity\rc9\aeons\zanmato-fix\`.

**Mutation pass: 36 hand-made faults on the new code, 36 killed.** In the search: the sides, the reach comparison, the dead filter, "without herself", the MP and gauge comparisons, Silence, the properties 242, 283 and 287, the pick without its stream-4 draw, the group expansion; in the handler: the gate's roll skipped under a standing order, the rest command not her last command, the gain written after the perform, the repeat storing no order, Mindy's count not reset, her replay setting a last command, the combo's roll inverted; in the data: a chance, Mindy's -15, the loss of 1, the order of two spells; in the adapter: the wrong stream for a roll or a pick, the last command or the end-of-action pair dropped, a group aimed at the picked slot, a fallen Cindy counted alive, the action not counted, the positive-case test dropped, BattleDistance, Silence, MP and Shell not seen; and NulAll losing its group flag. One fault survived the first pass (the group expansion with a single accepted slot) and was killed by a new assertion (NulAll's target list is the whole side when only one sister lacks a Nul).

**Mutation pass of 2026-10-16 (the Delta Attack row and Combine powers): 12 hand-made faults, 12 killed**, 10 of them by the two files that carry the new tests alone: the row without its group flag, the joint action aimed at the first foe only (in the adapter and again where Cindy is handed the targets), a passed Combine that never runs the joint action, the roll drawn before the usable test (the old order), BattleDistance ignored, the Delta Attack with reach 0, the pick on the wrong stream, a short bar or a Curse not stopping it; the other two (the turn charged the rest rank after the joint action; the other two sisters not paying the bar) by `parity-ffx-engine-k-aeons-more.test.ts`. The scratch runner and the list are in `D:\Tools\ffx-parity\rc9\aeons\zanmato-fix\mut\`.

**Same seed:** 12 seeds (1 to 12) on all 14 FFX chapters, each played by the chapter's own line through its whole chain exactly as `ffx-engine-golden` plays it: 168 chains, 294 links; the outcome, the turns, the KOs, the digest of every link's full event log and the digest of the generator's final stream states are **byte-identical to `4256d209a`** (and so to `afda2d451` and `d8fa5b69`), re-run after the Delta Attack fix of 2026-10-16. No shipped chapter owns the Sisters, so nothing could move; the proof says nothing did.

### 11.5 Labelled unproved, and what the chapter should know

- **The Sisters' starting motivation** is the build's estimate (`FFXPartyBuild.sisters.motivation`); the note finds no initialiser (section 17.2). The test values are 40. A chapter states its own and says it is an estimate.
- **The queue behaviour of Mindy's two spells** was not run on the game's code (section 17.3): the handler's searches are proved, what the executor does with the two queued spells is not. The engine carries them out in the order queued, each as its own action, applies the pair after each, and charges the turn the rank of the last action (the rest command is rank 3). A spell whose target vanished before it starts is a spent turn here.
- **The standing order and each sister's private variables across battles** (section 12 and 17.2): they start at 0 in every battle and are not carried by a chain. Whether the game's survive is unchecked.
- **"Had a real effect"**, which only "One more time" reads (the positive-case test's column), is the engine's reading: the HP or MP the action took from, or gave to, the other combatants (a status-only spell counts as no effect). The game's per-hit result numbers are not exposed by the engine.
- **Combine powers and the Delta Attack row are now the game's** (section 11.6). What stays unproved there: the joint action itself, the engine's run of the Delta Attack under Cindy (the executor, the hit pipeline and the death check), and the reading that the monsters of the engine are all one group (so "the group of the lowest foe" is every foe in reach).
- **The orders are unproved against the advisor and the HUD**: nothing in `engine/tactics` knows them (item 12 of section 7), and the sisters' motivation is not published in `state` (a screen that wants a meter has no API for it yet).
- Mindy's Reflect combo needs Cindy to hold Reflect; Sandy's free choice is what casts it (M + 200). A chapter that wants the combo on screen should start Cindy with Reflect or let Sandy cast it.

### 11.6 The Delta Attack hits every foe in reach, and Combine powers searches before it rolls (2026-10-16; FFX only; changes chapter 27's Act I)

Asked by the RE main session before the independent check: the player's `delta-attack` row was still `single-enemy`, six hits, marked `[estimate]`, while the game's record is group-type. **Game case: FFX only** (FFX-2's Magus Sisters have their own `x2-magus-delta-attack` rows, untouched).

- **The rule, in player words.** When Combine powers lands, Cindy's Delta Attack hits **every foe within its reach at once, six hits on each** (not one foe, as before), and Cindy, Sandy and Mindy pay their bars. In a chapter where the Sisters face the three Dark Sisters, a landed Combine hits all three Dark Sisters. A foe at distance 2 or 3 (the Delta Attack's reach is 1) is not in the group. A Combine that finds no foe in reach, or whose own bar is not full, or that is Cursed, draws nothing and the asker rests (-10).
- **The row follows the record** (`src/data/ffx/aeons/abilities-optional-2.ts`): the game's record 0x30EA gives formula 1 (Strength), power 10, 6 hits and no element (`tests/fixtures/parity/ffx/command_records.json`; `research/re-ffx-commands.md` section 3 "exact"; the row is in none of the section 4.1 differences, which `data-ffx-command-records.test.ts` pins), so those numbers are unchanged and **no longer carry an estimate** (nor does `canMiss: false`: the record's accuracy formula is 0, bits 3 to 5 of its flag word 0x44011006 are clear, so the game rolls no hit check). What was an `[estimate]` was the targeting: the game's command row (read from the install's own table, `kernel/sister-search.ts#COMMAND_ROWS`: `Cmd+0x1a` = 1175) is a group-type command, reach 1, aimed at the opposite side, Overdrive cost 20. The engine has no group-type targeting value, so the row keeps `single-enemy` for the places that read it and gains `extra.groupTarget: true`, the same flag the Zanmato, NulAll and the Mix use (`targeting.ts#aimOf` keeps the whole list the order names). The record has no reflect bit and its damage kind is neither physical nor magical (flags word 0xC), so a foe's Reflect does not bounce it and Cover (single-target physical rows only) does not apply.
- **Combine powers is now the proven handler.** Event 18 (`kernel/sister-orders.ts`, replayed against the game's script VM in `parity-ffx-sister-orders.test.ts`) searches the Delta Attack FIRST (`kernel/sister-search.ts`: a target in reach exists, her own bar is full, no Curse; any of them failing ends the search with no draw), then rolls 200 + M (one stream-18 draw), then picks (one stream-4 draw only among several foes) and stores the group. The engine's old `combineOrder` rolled first and aimed at one foe through the legal-set picker. **The draws are identical whenever the same foes are legal targets and the bar is full** (one stream-18 draw, one stream-4 draw only among several foes: the legal-set picker and the search's pick are the same draw, rank `value % foes`), so every earlier Combine test passes unchanged; they differ only where the old code drew a roll the game does not (nobody to aim at, a bar not full, a Curse) and for a foe at distance 2 or 3, which the old code did not cut. `combineOrder` is removed: `adapt/sister-orders.ts#sisterOrder` runs event 18 like the other seven and calls `adapt/sisters.ts#jointAction` (Cindy performs the Delta Attack at the stored group; her counter 0, the others' `HasteSlow(tick(Agility) x rank)`, all three pay the bar; the same code as before, moved) when the handler's `delta` call fires. `kernel/sisters.ts#combineEvent` (the note's first reading, roll first) is no longer called by the engine; it is kept only because `parity-ffx-sisters.test.ts` pins it, and says so.
- **Tests:** `parity-ffx-engine-k-orders-more.test.ts` gains four (the search before the roll; the draws; the Delta Attack on 3 foes hits all 3; only the foes within reach), `parity-ffx-sister-orders.test.ts` one (the row against its record). The lane's six files (132), the Zanmato and Sisters' orders files, the three goldens, the data tests and the FFX aeon, overdrive and party files pass; `npx tsc --noEmit` is clean; mutation and same-seed results are in section 11.4.
- **For chapter 27:** Act I (the player's Sisters against the three Dark Sisters) changes: the first landed Combine now strikes all three Dark Sisters for six hits each. The bench should be re-run if it measured Act I with the one-target Delta Attack.

## Appendix: the faults of the mutation pass

Ids: `Y` the Yojimbo kernel, `R` the requester, `S` the Sisters kernel, `J` the joint-counter kernel (`kernel/aeon-stats.ts`), `E` the Yojimbo adapter, `A` the Sisters adapter, `W` the wipe rule and the state seams, `D` the summon / Dismiss adapter and the party kernel's group functions, `C` the executor and menus, `N` the engine seams, `ST` the state helper. "Killed by" names the test files of the first failing tests the runner kept (up to three), not every file that fails. The runner and the list are scratch (`D:\Tools\ffx-parity\rc9\aeons\mut`); a fault is the one textual change named by its row.
| Fault | What it does | Result | Killed by (files of the first failing tests) |
|---|---|---|---|
| Y01 | command roll: Daigoro band ends at 32 (not 31) | killed | engine-more, yojimbo |
| Y02 | command roll: Kozuka band ends at 48 (not 47) | killed | engine-more, yojimbo |
| Y03 | command roll: Wakizashi band ends at 63 (not 62) | killed | engine-more, engine |
| Y04 | command roll: Zanmato from 81 (not 80) | killed | engine-more |
| Y05 | command roll: the sum is not a 32-bit add | killed | yojimbo |
| Y06 | free attack: <= instead of < | killed | engine-more, yojimbo |
| Y07 | free attack: compatibility div 5 (not 4) | killed | engine-more |
| Y08 | free attack: seven bits of the draw (not eight) | killed | engine-more |
| Y09 | turn start: every character but Yojimbo rolls | killed | engine-more |
| Y10 | Pay: 5 per doubling (not 4) | killed | engine-more |
| Y11 | Pay: a doubling counts at 4 gil (not 8) | killed | engine-more |
| Y12 | Pay: doublings counted from 16 gil | killed | engine-more |
| Y13 | Pay: a tripling, not a doubling | killed | engine-more |
| Y14 | Pay: compatibility div 9 (not 10) | killed | engine-more, zanmato |
| Y15 | Pay: answer 0 base 70 (not 75) | killed | engine-more, zanmato, yojimbo |
| Y16 | Pay: answer 0 share of the gil x40 (not x50) | killed | engine-more, zanmato |
| Y17 | Pay: answer 2 factor 0.9 (not 0.8) | killed | engine-more, zanmato, yojimbo |
| Y18 | Pay: answer 2 divisor (L + 2) div 3 | killed | engine-more, engine, zanmato |
| Y19 | Pay: the monster penalty divides by L + 2 | killed | engine-more |
| Y20 | Pay: the full-gauge bonus is 19 | killed | engine, zanmato |
| Y21 | Pay: the gauge must exceed its maximum | killed | engine-more, engine, zanmato |
| Y22 | Pay: Curse does not stop the full-gauge bonus | killed | engine-more, yojimbo |
| Y23 | Pay: five bits of the draw (not six) | killed | engine-more |
| Y24 | Pay: a first-roll Zanmato is rolled again | killed | engine-more |
| Y25 | Pay: the second pass keeps the monster penalty | killed | engine-more |
| Y26 | Pay: a second-pass Zanmato stays Zanmato | killed | engine-more |
| Y27 | Pay: a payment of 0 is not the pay-nothing branch | killed | engine, yojimbo |
| Y28 | Pay nothing: compatibility -19 (not -20) | killed | engine, yojimbo |
| Y39 | Pay: the never-ending state is not refused | killed | yojimbo |
| Y29a | delta: Daigoro 0 (not -1) | killed | yojimbo |
| Y29b | delta: Kozuka +1 (not 0) | killed | engine-more, engine, yojimbo |
| Y29c | delta: Wakizashi on one +2 (not +1) | killed | engine-more |
| Y29d | delta: Wakizashi on all +2 (not +3) | killed | engine-more |
| Y29e | delta: Zanmato +5 (not +4) | killed | engine-more, engine |
| Y30 | Daigoro with no target becomes Wakizashi (not Kozuka) | killed | yojimbo |
| Y31 | Zanmato group rule also applies to Pay | killed | engine-more |
| Y32 | Dismiss: costs 3 for his first TWO actions | killed | engine, yojimbo |
| Y33 | Dismiss as first action: -2 (not -3) | killed | engine, yojimbo |
| Y34 | wipe: -9 (not -10) | killed | engine, yojimbo |
| Y35 | compatibility: no upper clamp | killed | engine, yojimbo |
| Y36 | free attack command: compatibility div 5 (not 4) | killed | engine-more |
| Y37 | free attack command: five bits of the draw | killed | engine-more |
| R01 | requester: Mindy is not a Sister | killed | engine-more, yojimbo |
| R02 | requester: the last order (0x312B) is not an order | killed | yojimbo |
| R03 | requester: any source type is handled | killed | yojimbo |
| S01 | chance test: <= instead of < | killed | sisters |
| S02 | chance test: the order compares 16 bits of a | killed | sisters |
| S03 | chance test: threshold 0 counts as negative | killed | sisters |
| S04 | chance test: a standing order does not stop... draws only when a is 0 | killed | engine-more |
| S05 | motivation setter 2: written even while an order stands | killed | sisters |
| S06 | motivation setter 2: only the negative column | killed | engine-more |
| S07 | after-action: gauge columns swapped | killed | sisters |
| S08 | after-action: motivation clamp 99 | killed | sisters |
| S09 | after-action: gauge may exceed its maximum | killed | sisters |
| S10 | menu: Cindy attack order at motivation + 40 | killed | engine-more, sisters |
| S11 | menu: Sandy attack order at motivation + 140 | killed | sisters |
| S12 | menu: Mindy attack order at motivation + 100 | killed | engine-more |
| S13 | menu: Sandy skips her 128 roll when someone is low | killed | engine-more, sisters |
| S14 | menu: Mindy drain at HP under a third (not a quarter) | killed | sisters |
| S15 | menu: Mindy drain roll 190 (not 200) | killed | sisters |
| S16 | menu: Combine powers offered with two ready | killed | engine-more |
| S17 | menu: Repeat offered from the third turn | killed | engine-more |
| S18 | Combine gate: a FULL gauge is not enough | killed | engine-more |
| S19 | Combine gate: Curse does not matter | killed | engine-more, sisters |
| S20 | Combine gate: Mindy is not counted | killed | engine-more |
| S21 | Combine: chance is motivation (not 200 + motivation) | killed | engine-more |
| S22 | Combine: a failed roll still searches and may queue | killed | engine, sisters |
| S23 | Combine: +5 motivation (not +10) | killed | engine-more |
| S24 | Combine: -5 motivation on failure (not -10) | killed | sisters |
| J01 | joint counters: Haste and Slow swapped | killed | aeon-stats, engine-more |
| J02 | joint counters: the actor is not set to 0 | killed (first run in pass 2) | aeon-stats, engine-more |
| J03 | joint counters: the target mask is not handed on | killed | aeon-stats, sisters |
| J04 | joint counters: the actor is recomputed too | killed | aeon-stats, engine-more |
| J05 | joint counters: the actor's Agility used for the others | killed | aeon-stats, engine-more |
| J06 | joint counters: rank 1 for the others | killed | aeon-stats, engine-more |
| E01 | adapter: the script draws on the Sisters' stream | killed | engine-more |
| E02 | adapter: the payment is never taken | killed | engine-more, engine |
| E03 | adapter: the monsters' Zanmato byte is ignored | killed | engine-more |
| E04 | adapter: only the first monster's byte counts | killed after a new test | engine-more |
| E05 | adapter: a fallen monster that has not left stops counting | killed after a new test | engine-more |
| E06 | adapter: the data's level is read as the byte | killed after a new test | engine-more |
| E07 | adapter: the free attack's group byte is always 0 | killed | engine-more |
| E08 | adapter: the gauge never reads full | killed | engine-more, engine |
| E09 | adapter: Curse is never read | killed after a new test | engine-more |
| E10 | adapter: the party's gil read as the payment | killed after a new test | engine-more |
| E11 | adapter: the hire answer is always 1 | killed after a new test | engine-more |
| E12 | adapter: a free attack's compatibility is not stored | killed after a new test | engine-more |
| E13 | adapter: Pay's compatibility is not stored | killed | engine |
| E14 | adapter: the full-gauge bonus never spends the gauge | killed | engine-more, engine |
| E15 | adapter: paying nothing does not dismiss him | killed | engine |
| E16 | adapter: Dismiss never costs the first-action 3 | killed | engine |
| E17 | adapter: a Pay is not counted as a parsed action | killed | engine |
| E18 | adapter: a build that owns him needs no `yojimbo` parameter | killed | engine |
| A01 | adapter: the joint action's rank is 3 | killed | engine-more |
| A02 | adapter: every sister waits at Agility 40 | killed | engine-more |
| A03 | adapter: Haste is not read for the joint counters | killed after a new test | engine-more |
| A04 | adapter: Slow is not read for the joint counters | killed after a new test | engine-more |
| A05 | adapter: the ordering sister (not Cindy) is the joint actor | killed after a new test | engine-more |
| A06 | adapter: the joint counters are not written back | killed | engine-more |
| A07 | adapter: Cindy's own recovery is not charged | killed | engine-more |
| A08 | adapter: the other sisters do not pay the bar | killed | engine-more |
| A09 | adapter: the other sisters pay half the bar | killed | engine-more |
| A10 | adapter: a failed Combine still gains 10 | killed | engine |
| A11 | adapter: an order is not counted as a parsed action | killed after a new test | engine-more |
| A12 | adapter: the Sisters draw on Yojimbo's stream | killed | engine-more |
| A13 | adapter: the menu builder reads motivation 0 | killed | engine-more |
| A14 | adapter: "near death" is any damage | killed after a new test | engine-more |
| A15 | adapter: Combine powers always offered | killed | engine-more |
| A16 | adapter: Curse is not read for Combine powers | killed after a new test | engine-more |
| A17 | adapter: Confuse does not stop a sister Combining | killed after a new test | engine-more |
| A18 | adapter: a fallen sister can still Combine | equivalent | - |
| W01 | wipe: ANY aeon down ends the summon | killed | engine-more, engine |
| W02 | summon: Cindy comes alone | killed (first run in pass 2) | engine-more |
| W03 | dismiss: only Cindy leaves | killed (first run in pass 2) | engine-more, engine |
| W04 | summon list: three rows for the three | killed | engine-more, engine |
| W05 | wipe: Yojimbo's -10 dropped | killed | engine |
| D01 | summon list: Cindy's row with only one sister ready | killed after a new test | engine-more |
| D02 | summon: allowed with one sister still recovering | killed after a new test | engine-more |
| D03 | summon: only Cindy is listed as out | killed | engine-more |
| D04 | summon: all three in list position 1 | killed after a new test | presenter |
| D05 | dismiss: a fallen sister is not stood up | killed | engine-more, engine |
| D06 | wipe: no recovery count | killed | engine-more, engine |
| D07 | wipe: the gauges are not emptied | killed after a new test | engine-more |
| D08 | party kernel: a revive is never reported | killed | engine-more, engine |
| D09 | party kernel: the Dismiss never revives | killed (first run in pass 2) | engine-more, engine |
| D10 | party kernel: the wipe is never run for the group | killed (first run in pass 2) | engine-more, engine |
| C01 | executor: a fractional payment is accepted | killed | engine |
| C02 | executor: paying ALL the gil is refused | killed | engine-more |
| C03 | executor: a negative payment is accepted | killed | engine |
| C04 | executor: an order that was not offered is carried out | killed | engine |
| C05 | executor: an unbuilt order is carried out as Combine | killed | engine |
| C06 | menu: unbuilt orders look usable | killed | engine |
| C07 | menu: Yojimbo has no Dismiss row | killed | engine |
| N01 | seam: a sister's menu builder never runs | killed (first run in pass 2) | engine-more |
| N02 | seam: Yojimbo never takes a free attack | killed (first run in pass 2) | engine-more |
| N03 | seam: neither aeon has its own menu | killed (first run in pass 2) | engine-more |
| N04 | seam: neither aeon's command is carried out | killed (first run in pass 2) | engine-more |
| N05 | seam: a fallen aeon never hands the field back | killed | engine-more, engine |
| N06 | chain: the gil Pay spent is not carried | killed | engine |
| N07 | chain: the compatibility is not carried | killed | engine |
| N08 | setup: the Sisters' state is never built | killed (first run in pass 2) | engine-more |
| W06 | wipe: only Cindy is looked at | killed (added after pass 1) | engine-more |
| ST01 | state: the aeons out are only Cindy | killed (added after pass 1) | engine-more |
| E19 | adapter: a monster that has left the field still counts | killed (added after pass 1) | engine-more |
| A19 | adapter: an ejected sister can still Combine | equivalent | - |
| A20 | adapter: a sleeping or Petrified sister can still Combine | killed (added after pass 1) | engine-more |
| A21 | adapter: a Threatened sister can still Combine | killed (added after pass 1) | engine-more |
| A22 | adapter: a Provoked sister can still Combine | killed (added after pass 1) | engine-more |
| A23 | adapter: a Berserk sister can still Combine | killed (added after pass 1) | engine-more |
| D11 | summon: a Grand Summon of the Sisters holds no gauge | killed (added after pass 1) | presenter |
| D12 | summon: only Cindy's summon event is emitted | killed (added after pass 1) | presenter |
| D13 | dismiss: only Cindy's dismiss event is emitted | killed (added after pass 1) | presenter |
| C08 | events: the Pay's action-start is not emitted | killed (added after pass 1) | engine-more |
| C09 | events: paying nothing shows no Dismiss beat | killed (added after pass 1) | presenter |
| C10 | events: a sister's order has no action-start | killed (added after pass 1) | engine-more, presenter |
| C11 | events: a refusal says nothing | killed (added after pass 1) | presenter, engine |

156 faults: 154 killed, 2 equivalent (the code they change is redundant), 0 alive.
