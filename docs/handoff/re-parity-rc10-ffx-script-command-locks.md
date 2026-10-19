# Re-parity RC10, lane "FFX script command locks": what the monster scripts' `setCommandDisabled` calls do, and the one lock our chapters reach

Status: **built, tested and committed on branch `re-parity-rc10-ffx-script-command-locks` (from `re-parity-rc10-ffx-isaaru-commands`, `fc74d1240`); pushed to `origin/re-parity-rc10-ffx-script-command-locks`; not merged to main, not deployed, not live** (2026-10-18). **The lock is behind the switch `SCRIPT_COMMAND_DISABLES`, which is OFF.** With it off no battle of the game changes by a byte (section 4). Bailey decides (section 6).
**Game case: FFX only** (AGENTS.md rule 14). The calls are in FFX's monster scripts (handler `FFX.exe` 0x007A6EF0, setter 0x0079B470, summon gate 0x0079A080); FFX-2 has its own exe and script machine and none of it is read here. `src/battle/ffx2`, `src/data/ffx2` and `src/audio` are untouched; `ffx2-atb-golden` and `ff7-golden` are unchanged. No boss number and no party number was changed or added.
Paper preflight: `docs/plans/re-parity-rc10-ffx-script-command-locks-review.md` (`critic-plan` classes the change DEEP; committed first). Contract entry: `docs/CONTRACT-CHANGES.md` (2026-10-18, `EnemyGroupDef.scriptCommandDisables`).

Bailey's words that govern the lane: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-17 "Match the game (Recommended)", **which covered only Isaaru's duels**. So every other script lock is built behind a switch that defaults OFF, measured, and put to him (section 6). Hidden rows (below) are the driver's choice, the same as Isaaru's.

Commits (each ends with the Co-Authored-By line): `dc82c3a73` the paper preflight; `29f29714e` the contract, data and engine; `6d510cc30` the tests and the fixture; the commit that adds this note.

## 1. The data (read first)

Two independent reads agree. (a) The saved disassemblies of all 361 FFX monster scripts (`D:\Tools\ffx-parity\ai\ffx-yunalesca-bfa\allmon`) name `setCommandDisabled` in exactly 18 files. (b) A raw scan of the install's own monster files for script call 0x703B (the three constants pushed before the call; the Isaaru lane's scan, pointed at `battle/mon`) finds the same 18 files with the same call counts, 81 calls in all. A third scan reads the formation chunk of all 863 battle files to say which fight holds each monster, and the formation fixture of the Isaaru lane maps those files to our chapters. All of it is `tests/fixtures/parity/ffx/monster_command_disables.json` (numbers and file names only, no script text).

Reading the table: *who* is the script's actor spec (a plain number is that slot: 0 Tidus, 1 Yuna, 4 Wakka, 5 Lulu, 6 Rikku; -23 every slot that is not a monster; -21 every slot); *flag 1* sets the command's bit in the actor's disabled bitmap (the menu gate 0x0079A5B0 then refuses it), *flag 0* clears it. An id **below 0x1000** is the setter's other branch: it stores the flag in the availability byte of that aeon's own character (+0xDD4; the actor argument is not read), and the summon gate (0x0079A080, `aeonUnavailable` in `kernel/aeon-party.ts`) says "cannot be summoned" when the byte is 0. Aeon ids: 8 Valefor, 9 Ifrit, 10 Ixion, 11 Shiva, 12 Bahamut, 13 Anima, 14 Yojimbo, 15 Cindy, 16 Sandy, 17 Mindy.

| Script | Monster | Call(s) | When it runs | Fought in (battle files) | Our chapters | What the engine does today |
|---|---|---|---|---|---|---|
| m163 | possessed Valefor | 1: `(1, 8, 0)` Valefor unavailable | **init, before the first turn** | `sins07_00` | **III**, Last Summoning (28) | III: nothing (Valefor stays on Yuna's list). 28: **already modelled** (below) |
| m164 | possessed Ifrit | 1: `(1, 9, 0)` | init | `sins07_01` | **III**, 28 | III: nothing. 28: modelled |
| m165 | possessed Ixion | 1: `(1, 10, 0)` | init | `sins07_02` | **III**, 28 | III: nothing. 28: modelled |
| m166 | possessed Shiva | 1: `(1, 11, 0)` | init | `sins07_03` | **III**, 28 | III: nothing. 28: modelled |
| m167 | possessed Bahamut | 1: `(1, 12, 0)` | init | `sins07_04` | **III**, 28 | III: nothing. 28: modelled |
| m168 | possessed Anima | 1: `(1, 13, 0)` | init | `sins07_05` | 28 only | modelled |
| m169 | possessed Yojimbo | 1: `(1, 14, 0)` | init | `sins07_06` | 28 only | modelled |
| m178 / m179 / m180 | possessed Cindy / Sandy / Mindy | 1 each: `(1, 15 / 16 / 17, 0)` | init | `sins07_07` (one battle, three bodies) | 28 only | modelled |
| m101 | Tros | 6: `0x3104` (a trigger-range command) flag 1 then flag 0 for Tidus and Rikku; `0x3000` Attack flag 0 for both | mid-fight: onTurn (two phase branches), onTargeted (after command 0x3101) | `cdsp07_00` | none | not modelled; no chapter fights it |
| m109 | Geosgaeno | 33: for the character his script holds out of the fight (the one it later gives back), Attack 0x3000, White Magic 0x3116, Black Magic 0x3115, Item 0x3001, Skill 0x3113, Special 0x3114, Weapon 0x3004, Armor 0x3005 and one of 0x3119 / 0x311C / 0x311E (Tidus / Wakka / Rikku): flag 1 when the hold starts, flag 0 when it ends | mid-fight: onTurn (start and end of the hold), onHit (end) | `bjyt02_01`, `bjyt02_02` | none | not modelled; no chapter fights it |
| m123 | Negator | 12: after his move 0x6023, flag 1 for Black Magic 0x3115, White Magic 0x3116 and 0x3029 (everyone, -21), 0x3117 and 0x3118 (Yuna), 0x311D (Lulu); the same six with flag 0 when he dies | mid-fight: onTargeted, onDeath | `maca02_00` | none | not modelled; no chapter fights it |
| m211 | (the record's name is "???") | 12: after command 0x3016, in four branches by battle number: 0x3028, Escape 0x3003 and Flee 0x3018 for everyone (-23), flag 1 | mid-fight: onHit | `bika02_11` to `_13`, `genk16_00` to `_02`, `omeg00_12` to `_16`, `omeg01_06` | none | not modelled; no chapter fights it |
| m251, m252, m253, m256 | Mimic (four records) | 2 each: Escape 0x3003 and Flee 0x3018, everyone (-23), flag 0 (re-enable) | mid-fight: onDeath | `omeg00_13`, `_14`, `_15`, `_16` | none | not modelled; no chapter fights them |

So of the 18 scripts, **ten are fought by a chapter of ours, and all ten make their one call at init**; the other eight are in fights no chapter fights and make theirs mid-fight (the Isaaru lane's "mid-fight" worry applies only to those eight, none reached, so **no mid-fight trigger machinery was built**; the flags live in `state.flags`, so a later trigger only has to set and clear the same keys).

**What the ten calls mean:** each possessed copy takes its own aeon away from Yuna for the whole battle (the game's other half of the possession, the party removal in the field event `sins0700`, is not a script command; section 9).

## 2. Already modelled, built, unreached

- **Already modelled (the hidden Last Summoning, Chapter 28):** every link's group locks every aeon given up so far, its own among them, with the words "Taken by Yu Yevon": `src/data/ffx/enemies/last-summoning-chain.ts` `locksFor` (line 36) and `lockedAeons: locksFor(order)` (line 82), applied by `battle/ffx/aeon-duel.ts#applyAeonDuelSetup` (line 56) and drawn greyed by `commands.ts` (line 201). The test `parity-ffx-script-command-locks.test.ts` checks that each link locks its own aeon (and the three Sisters together). The new field is **not** carried by those groups, so the Last Summoning is byte-identical with the switch on or off (tested).
- **Built, behind the switch, default OFF:** Chapter III's five possession links (`possessed-valefor` to `possessed-bahamut`). With the switch on, in a link the copy's own aeon is not on Yuna's Summon list (**the row is not built**, hidden like Isaaru's rows: the driver's choice), is not a Grand Summon choice, and a submitted Summon (or a Grand Summon naming it) is refused with the turn kept open. Every other aeon, and every other command, is as before.
- **Unreached, not built:** Tros, Geosgaeno, Negator, m211 and the four Mimics (eight scripts, 72 of the 81 calls). The generic path exists (a 0x3xxx row in `scriptCommandDisables` sets the same flags a formation row sets, shown by a synthetic group in the tests) but no shipped data uses it.

## 3. What was built

| Where | Change |
|---|---|
| `src/battle/common/types.ts` (contract, additive) | `EnemyGroupDef.scriptCommandDisables?: readonly FormationCommandOff[]` |
| `src/data/ffx/enemies/possessed-script-locks.ts` (new, 34 lines, numbers only) | the ten ids (`possessed-valefor` 8 ... `possessed-mindy` 17) and `possessedScriptDisables` |
| `src/data/ffx/enemies/braskas-final-aeon.ts` | one line in `possessedAeonBattle` (the five Chapter III links; the file was already over 400 lines) |
| `src/battle/ffx/formation-commands.ts` (123 to 182 lines) | the switch `SCRIPT_COMMAND_DISABLES` (`{ on: false }` and `setScriptCommandDisables(on)`, which returns the restore function: the boss-data lane's pattern); `applyFormationCommandDisables` reads the script rows only while it is on; `aeonScriptOff`; `commandRefused` also refuses a Summon or a Grand Summon that names an off aeon |
| `src/battle/ffx/aeons.ts`, `aeon-duel.ts`, `adapt/aeon-party.ts` | `availableAeons` and `grandSummonChoices` leave the aeon out; `aeonSummonable(aeon, available)` passes the byte to the kernel gate the engine already models (`avail`), instead of the constant 1 |

No other file changed. `node tools/orphans.mjs`: 26 orphans, the same as before the lane (the new data file is reached from `braskas-final-aeon.ts`).

## 4. Proofs

| File | What it proves |
|---|---|
| `tests/unit/parity-ffx-script-command-locks.test.ts` (9 tests) | the corpus (18 scripts, 81 calls, 361 monster files, 863 battle files); only the ten possessed bodies are held by one of our chapters (Chapter III the five mandatory aeons, the Last Summoning all ten), the other eight are in no formation of ours and call from a fight hook; **a model of the game** (the setter's aeon branch, the kernel's own gate) replayed on the ten init hooks leaves exactly one aeon at availability 0, the copy's own; the data equals the model; **exactly Chapter III's five links carry the field and no other group of the game does** (the groups built on demand included); the Last Summoning locks the same aeon with `lockedAeons` in every link and carries none of the field |
| `tests/unit/parity-ffx-script-command-locks-engine.test.ts` (10 tests) | **off:** the switch is false; in each link Yuna's list is all five aeons, enabled, and so is the Grand Summon picker; a link played with the field taken off is identical, event for event, to the shipped one. **On:** in each link the copy's aeon is off the Summon list and the picker and the other four are there; a submitted Summon of it returns no event and Yuna is asked again with the same list, another aeon still comes; a Grand Summon naming it is refused (pure rule); a fork sees the same; only that one row is gone; the Last Summoning's event logs are identical off and on and its row is still the greyed "Taken by Yu Yevon"; a synthetic 0x3xxx row removes Tidus's Attack, Yuna's White Magic and everyone's Item and refuses a submitted Attack |
| existing, run on the final tree | `ffx-engine-golden` (18 of 18), `ffx2-atb-golden`, `ff7-golden`, `ffx-engine-fork`, `data-ffx-command-records`, `parity-ffx-aeon-party`, `parity-ffx-engine-aeons`, `parity-ffx-engine-k-aeons` (and `-more`), `parity-ffx-formation-flags`, `parity-ffx-isaaru-commands` (and `-engine`), `re-parity-menus`, `last-summoning-iii-pin`, `last-summoning-chain`, `-taken-row`, `-flow`, `-chapter`, `possessed-aeons`, `isaaru-duel`, `summon-label-sisters`, `late-aeon-rows`, `strategy-braskas-final-aeon`: **25 files, 375 tests pass** |

**Mutation pass: 14 mutants of the production code and the data, each putting one rule back wrong; all 14 caught** (`M01` the switch ignored, so the rows are read while it is off; `M02` the aeon flag never set; `M03` `availableAeons` ignoring the byte; `M04` the kernel gate always reading the byte as 1; `M05` Grand Summon's picker keeping the aeon; `M06` a submitted Summon not refused; `M07` a Grand Summon naming the aeon not refused; `M08` possessed Ifrit carrying Valefor's id; `M09` the five links not carrying the field; `M10` the slot table off by one; `M11` a menu-command script row not raising the quick-test flag; `M12` the lock taking every aeon; `M13` the Last Summoning forgetting the link's own aeon; `M14` an aeon row read as a menu command). The suite passes before the first and after the last restore, and the working tree shows no change to a production file afterwards. The raw log is kept outside the repository (`D:\Tools\ffx-parity\rc10\ffx-script-command-locks\`).

`npx tsc --noEmit` is clean. The two new test files are 181 and 226 lines.

## 5. Measurement

Before = the base `fc74d1240` (and the lane's tip with the switch off, which equals it); after = the tip with the switch on. The scratch lab is kept outside the repository, never staged.

**Every FFX chapter, 12 seeds, the shipped line (the app's chain loop, `intendedStrategy`, minigames auto-resolved; 16 chapters: the 15 of the Isaaru lane plus the hidden Last Summoning in the offering's own order):**

- Switch **off** against the base: **192 of 192 seed runs identical, event for event** (a SHA-1 of every link's full event log; wins, party turns, engine turns and party KOs equal in every row).
- Switch **on** against the base: **192 of 192 identical** as well. Wins per chapter (12 seeds): Seymour Flux 12, Yunalesca 12, **Braska's Final Aeon (Chapter III) 11 / 11**, Macalania 12, Evrae 12, Yojimbo 11, Natus 11, Omnis 11, Isaaru 11, Sin fins 11, Sin face 12, Gui 12, Biran and Yenke 12, Mirror Aeons 8, hidden Fayth 12, Last Summoning 12; party turns and KOs unchanged in every row.

**Chapter III, 500 seeds (the mover, if any), on the bench's drivers (`aeon-hp-2-3-bench.test.ts`: the shipped `intendedStrategy` and the advisor's card-follower) and on two stress routes.** A seed is a first try of the whole seven-link chain. "Own aeon offered" is how many Yuna turns in a possession link had that link's own aeon on her Summon list, per seed.

| Route (driver) | Seeds | Wins off / on | Mean party turns off / on | Own aeon offered per seed, off / on | Own aeon used per seed, off / on | Seeds whose event log moved |
|---|---|---|---|---|---|---|
| shipped line (`intendedStrategy`) | 500 | 479 / 479 | 373.0 / 373.0 | 0 / 0 | 0 / 0 | **0** |
| shipped line, aeons held through the Final Aeon (reserve) | 500 | 462 / 462 | 360.1 / 360.1 | 22.8 / 0 | 0 / 0 | **0** |
| reserve + Yuna answers the copy with its own aeon (mirror) | 500 | 462 / 462 | 314.7 / 360.1 | 3.4 / 0 | 3.4 / 0 | 461 |
| card-follower (the advisor's top card), shipped route (the bench's own count, 200 seeds; about 5 s a seed) | 200 | 195 / 195 | 370.8 / 370.8 | 0 / 0 | 0 / 0 | **0** |

Every defeat of every row is in the first link (Braska's Final Aeon): 21 of 500 on the shipped line, 38 of 500 when the aeons are held back (the Final Aeon is harder without them). **No seed changes outcome in any row, and no seed loses a possession link either way.**

**Cause, in player words.**
- *The shipped line never meets the lock.* It spends all five aeons on Braska's Final Aeon, and an aeon knocked out there carries its recovery count (8 to 24 battles) through the rest of the chain, so in the five possession links Yuna has no aeon to summon, and the lock takes away nothing. Neither does the advisor's top card (its 200 shipped-route seeds are identical off and on); with the aeons held back and the own aeon on the list (22.8 Yuna turns a seed on the shipped line; 25.5 on the card at 20 seeds, switch off and on, 19 of 20 won both ways, 366.7 turns both), neither driver ever picks a summon in a possession link (0 summons a seed).
- *Only a player who answers a possessed aeon with the same aeon is moved,* and only in length: that route summons the matching aeon 3.4 times a seed (it is on the list in 461 of 500 seeds), wins the same 462 of 500, and with the lock it fights the same links without it: 45 more party turns a seed (314.7 to 360.1, +14 percent), because the summon is the fastest way to end a possession link. It does not lose a link it used to win.

So there is **no mover on any line we ship or bench**, and no ablation was needed.

## 6. Decision table for Bailey (the main session asks in the morning)

One row per chapter-visible lock. The switch is `SCRIPT_COMMAND_DISABLES.on` in `src/battle/ffx/formation-commands.ts`; the recommendation is a draft for the driver, not an order.

| # | Lock (the game's script) | Where a player sees it | What it changes (measured) | Recommendation |
|---|---|---|---|---|
| S1 | Possessed Valefor takes Valefor from Yuna (`m163`) | Chapter III, link 2 | Valefor is not on the Summon list or in Grand Summon's choices in that fight | **Match the game: turn on** (the same reasoning as Isaaru's "Match the game") |
| S2 | Possessed Ifrit takes Ifrit (`m164`) | Chapter III, link 3 | the same | as S1 |
| S3 | Possessed Ixion takes Ixion (`m165`) | Chapter III, link 4 | the same | as S1 |
| S4 | Possessed Shiva takes Shiva (`m166`) | Chapter III, link 5 | the same | as S1 |
| S5 | Possessed Bahamut takes Bahamut (`m167`) | Chapter III, link 6 | the same | as S1 |
| - | Anima, Yojimbo, the Sisters (`m168`, `m169`, `m178` to `m180`) | the hidden Last Summoning | **already in the build** ("Taken by Yu Yevon") | nothing to decide |
| - | Tros, Geosgaeno, Negator, m211, the Mimics | no chapter | not built | nothing to decide until a chapter fights them |

The five rows are one switch, so the real choices are: **(a) on** (all five), **(b) off** (what ships). Measured: no line we ship or bench moves, so turning it on costs no first-try win and no balance; the only visible change is for a player who answers a possessed aeon with its own. **Recommend (a)**, with two caveats the driver should weigh: (i) D-651 keeps Chapter III's chain unchanged "for now" (it was written for the hidden chapter's lane; it says "the game's rules apply inside each link", which this lock is); (ii) the rule is the script's half of the possession only (section 9): it does not remove the aeons given up in earlier links, so Chapter III's third link still lets Yuna summon the first link's Valefor unless the second half is also built (a separate decision).
Hidden or greyed (Isaaru's open item 1): the row is not built. Greying it needs a reason in words; **do not reuse "Taken by Yu Yevon"** for Chapter III, because `engine/tactics/lookup.ts#onLastSummoningBoard` uses that very string to tell the Last Summoning's board from Chapter III's.

## 7. CHANGELOG paragraph (for the case where the switch is turned on; this lane does not write CHANGELOG.md)

FFX only, Chapter III: in each of the five possessed-aeon fights (Valefor, Ifrit, Ixion, Shiva, Bahamut) Yuna can no longer summon the aeon that Yu Yevon has taken. The possessed aeon's own script switches that aeon off for the whole battle, so its name is no longer on her Summon list or among Grand Summon's choices; every other aeon is as before. Nothing else about the fights changed: sixteen FFX chapters at twelve seeds, and Chapter III at five hundred seeds on two drivers, play out the same, event for event, because the suggested line spends its aeons on Braska's Final Aeon; a player who answers a possessed aeon with the same aeon now needs about 14 percent more turns. Read from the game's code and scripts, not run.

## 8. Visible text (guide lines that would become false if the switch is turned on)

None found. Read: `src/data/guides/braskas-final-aeon.ts` (its Summon hint, line 127, "Summon freely: Yuna may summon throughout both forms", is about the Final Aeon, where nothing changes; line 132 "the possessed aeons mirror your own roster" stays true), `src/data/guides/docs/braskas-final-aeon.ts`, `src/engine/tactics/braskas-final-aeon.ts` (it reads the rows it is given; the row is absent), the chapter objectives and the story script (none says Yuna may summon the aeon she faces). The Last Summoning's words are unchanged. If the driver wants the player told why the aeon is missing, that is new text (presentation, section 10).

## 9. Open items and findings on the way

- **The other half of the possession.** The game also takes the *earlier* aeons out of the party with a field-event command in `sins0700` (a party removal, never undone; research/re-ffx-last-summoning.md section 2), which is not a script command lock and is not in this switch. The hidden Last Summoning models it ("Taken by Yu Yevon" for every aeon given up so far); Chapter III, a fixed chain, does not. It would be the same `lockedAeons` list on the later links. Not measured here: the shipped line has no aeon standing after the Final Aeon, so it would not move either. A separate decision for Bailey.
- **Hidden or greyed, and the words** (section 6). **The refusal cue**: nothing presses a hidden row.
- **Other menu edits by monster scripts**, not `setCommandDisabled` and not in this lane, found in the same read: `addCommand` / `removeCommand` on the party's menus by Evrae (m119), the two fins (m136, m137) and Cid (m149) for Tidus and Rikku (0x3106, 0x3107, 0x3108: the airship's range commands), and by Seymour (m124) removing Talk (0x3105) from slots 0, 1 and 4. Whether the engine's airship and Seymour menus already follow them is a row for the next gap scan.
- **Mid-fight toggles** of the eight unreached scripts (Tros, Geosgaeno, Negator, m211, Mimics): data table above; nothing to build until a chapter fights them.
- **The Talk row in Isaaru's duels** and the Isaaru lane's other open items are unchanged.
- Ghidra (:8089) was read-only, twice (the setter 0x0079B470 and the gate 0x0079A080), to confirm the polarity of the availability byte; both are consistent with the kernel module the engine already carries.
