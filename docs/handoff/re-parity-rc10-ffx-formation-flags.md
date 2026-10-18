# Re-parity RC10, lane "FFX formation-script flags" (gap scan S8): one flag wired, the rest read and listed

Status: **built, tested and committed on branch `re-parity-rc10-ffx-formation-flags` (from `origin/r52-rc`, `3c92b60cc`); pushed to `origin/re-parity-rc10-ffx-formation-flags`; not merged to main, not deployed, not live** (2026-10-17).
**Game case: FFX only** (AGENTS.md rule 14). The notes are `FFX-G06` (sections 4.1 to 4.4 and 8; FFX.exe Steam build 25501027), `FFX-G04` (the counter switch) and `FFX-G05` (the menu code); FFX-2 has its own exe and
script machine and none of it is read here. `src/battle/ffx2`, `src/data/ffx2` and `src/audio` are untouched; `ffx2-atb-golden` and `ff7-golden` are unchanged. No boss number and no party number was changed or added.
Paper preflight: `docs/plans/re-parity-rc10-ffx-formation-flags-review.md` (`critic-plan` classes the change DEEP). Contract entry: `docs/CONTRACT-CHANGES.md` (2026-10-17, `EnemyGroupDef.defendOff`).

Bailey's words that govern the lane: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-16 "keep going please all of this reverse engineering needs to be incorporated into our game"; 2026-10-17 "keep going full speed".

## 1. The data table (read first, read-only)

Each flag has a default that the battle set-up routine (VA 0x00781020, read) writes before the formation script runs; the scripts then call it. The scan of every formation file is in
`tests/fixtures/parity/ffx/formation_flags.json` (the constant pushed before each call, in code order, for the 38 formation files our FFX chapters fight, and for the whole game which files make each call).
The Ghidra servers (:8089, :8090) were not running, so every read below is from the saved decompile and disassembly dumps (`D:\Tools\ffx-parity\ffx\work\all`, `coverage\ffx\FFX-G05`, `FFX-G06`, the Evrae/Yojimbo/Isaaru/Sin lane's `dis\`).

| Flag | Default (set-up) | What it does in the game | Proof label | Formations of our chapters that set it | Our chapters affected | Wired |
|---|---|---|---|---|---|---|
| `setDefendingEnabled(0)` | 1 (read) | Stores the low byte of its argument in 0x0112CA00. The only reader (0x0078FB80) returns the character's "Defend command id" field while the byte is non-zero and 0 while it is zero. The four command-window handlers (0x0089C900, 0x0089CDE0, 0x008A22F0, 0x008A2690) call it when the Triangle bit is down: a non-zero id is queued as the character's command and the menu closes, a 0 plays sound cue 3 (the success branch plays cue 1; cue 3 is *inferred* to be the refusal buzz) and nothing else happens. So **the party's Defend control (the original's Triangle) does nothing for the whole battle** | setter *emulated* (3,000 vectors, 0 mismatches, FFX-G06 4.2); default, reader, the field's initialiser (0x0079B4F0: 0x3021, the Defend command, for a non-monster) and three of the four handlers *read* (decompile); the fourth is the same code at the same line | `bvyt09_10`, `_11`, `_12` | **Chapter XIV, Isaaru's contest of aeons, all three links** | **yes** |
| `btlSetCounterFlag(0)` | 1 (read: a 4-byte store at 0x0112CA0F) | Stores the low byte in 0x0112CA12. Read once, by the counter decider 0x0078C1D0: a 0 returns "no counter" for every hit of the battle. The engine's counter kernel already takes the byte (`switchOn`, constant 1, RC9) | setter *emulated* (3,000); reader *read* (FFX-G04 5.5) | none: the 11 files that call it are Belgemine's duels (`lmyt01_00` to `_07`, `genk00_40`, `mihn00_60`, `nagi00_40`) | none | no |
| `btlSetAnimaChainOff(1)` | 0 (read) | Stores the lowest bit in 0x0112CA06. One script call applies it (`btlExeAnimaChainOff`, called once, from the aeon setup script of `system_01`, to the player's Anima model, actor 13); the getter (`btlGetAnimaChainOff`) has no script caller. No arithmetic reads it. **A model look: the chains drawn on the player's Anima** | setter *emulated* (3,000); the apply and the lack of readers *read* (call census, `g7-triage.txt`); the visual meaning is *inferred* from the name and the callee (the model routine 0x0082AEA0) | 16 files: `mcyt06_00`, `sins03_00`, `ssbt00_00` to `ssbt03_00`, `sins06_00`, `sins07_00` to `_07`, `sins07_10` | Chapter VII (Macalania), XII (Omnis), XVII and XVIII (Sin), III (Braska's chain), the hidden Last Summoning; **no gameplay effect** | no (see section 3) |
| `btlSetRandPosFlag(0)` | **0** (read) | Stores the lowest bit in 0x0112BDED. All 847 callers in the game write 0, which is the set-up value, so the call never changes the byte. The consumers were not traced and need not be: nothing in the game writes it to 1 through a script | setter *emulated* (3,000); default *read*; the 847 constants *static scan* | all 38 | none possible | no |
| `btlSetEscape(2)` ("always") | 0 | Stores the low byte in 0x0112C9FF; the escape roll succeeds without its draw below 191 when the byte is 2 (FFX-G06 4.4, the roll is `rolls.ts#escapeRoll`, which already handles 0, 1 and 2) | setter *emulated*; roll *emulated* (re-parity W2) | none: `bvyt09_00` to `_06` and `klyt00_00` | none | no |
| `SetAmbushState(2)` in m065, m304 and m340 | the roll | A monster script's write lands after the opening counters (FFX-G10, *inferred*) and can only change the intro banner; unsettled | *read only*, order *inferred* | none: m340 is the Dark Yojimbo file, written 2 in tier 1 only (`nagi05_70`); the Mirror Aeons chapter fights `nagi05_71`. m065 and m304 are in no shipped formation | none | no |

Which of OUR chapters fight which formation file: the 26 chapter formations of `research/re-ffx-battle-entry.md` (Seymour Flux `mtgz02_00`, Macalania `mcyt06_00`, Natus `stbv01_10`, Omnis `sins03_00`, Evrae `hiku15_00`, Yojimbo `nagi05_10`, Isaaru `bvyt09_10` to `_12`, Sin `ssbt00_00` to `ssbt03_00`, Yunalesca `dome06_00`, Braska and the possession battles `sins06_00`, `sins07_00` to `_07`, `sins07_10`, Gui `kino02_00` and `kino03_10`),
plus Biran and Yenke `mtgz01_10` and the Dark Aeons pool (`nagi05_70` to `_74`, `kino00_70` to `kino05_71`; the Mirror Aeons chapter plays `kino01_72` and `nagi05_71`). 38 files in all. The hidden Last Summoning plays the `sins06`/`sins07` files; the hidden Fayth chapter plays `hiku15_00`.

## 2. What was wired: Defend off in Isaaru's three aeon battles

The rule: in `bvyt09_10`, `_11` and `_12` (Fist, Wing and Sword; our `isaaru-grothia`, `isaaru-pterya`, `isaaru-spathi`) the party and the aeons have no Defend. Written as one data field and two engine hooks behind one switch:

| Where | Change |
|---|---|
| `src/battle/common/types.ts` (contract, additive) | `EnemyGroupDef.defendOff?: boolean` |
| `src/data/ffx/enemies/isaaru.ts` | `defendOff: true` on the three groups |
| `src/battle/ffx/formation-flags.ts` (new, 57 lines) | the switch `FORMATION_DEFEND_OFF`, the `state.flags['formation.defendOff']` key copied at set-up, `defendOff`, `defendTakenFrom` (a party member or an aeon; an enemy has no menu), `defendRefused` |
| `src/battle/ffx/setup.ts` | one call after the aeon duel's set-up |
| `src/battle/ffx/commands.ts` | no `defend` row for a party member or an aeon while the key is set |
| `src/battle/ffx/execute.ts` | a submitted `defend` is refused, the turn kept open, **no message** (the words and the cue are presentation) |

The flag lives in `state.flags`, like the aeon duel's rules, so a fork (the move advisor's dry runs) and a rebuilt runtime see the same rule. With the switch off, or with the field taken off a group, a battle plays exactly as before (the tests build both).

What the player sees: the Defend tab under the command window (`ui/ffx/defendControl.ts`: "Q / Triangle  Defend") is drawn only while the engine offers an enabled `defend` row, so in these three fights it is not drawn, and pressing Q or Triangle does nothing. **No UI file changed and no word was added.**

## 3. What was not wired, and why

- **`btlSetCounterFlag(0)`:** no chapter reaches it (all 11 files are Belgemine's duels, `FFX-G04` 5.5). The kernel is ready: when a chapter ever fights one, add `EnemyGroupDef.counterOff` and read it in `adapt/counter.ts#kindInput` where `switchOn: 1` stands now.
- **`btlSetAnimaChainOff(1)`:** the sixteen formations are fought by six of our chapters (VII, XII, XVII, XVIII, III and the hidden Last Summoning), but the flag is the chains drawn on the player's Anima, nothing in a formula. Our one Anima painting (`characters/anima/`) has chains drawn on it and there is no unchained variant, so there is nothing for a hook to switch, and a field nothing reads would be built but wired to nothing (AGENTS.md hard rule 4). If Bailey wants it: one field on 16 groups and an unchained painting (new art: his yes first, the art rules).
- **`btlSetRandPosFlag(0)`:** it writes the value the set-up already wrote; there is nothing to wire.
- **Escape "always" (flag 2):** the 8 formations (`bvyt09_00` to `_06`, `klyt00_00`) are not fought by any chapter; the engine's `canEscape` stays a boolean and `rolls.ts#escapeRoll` already handles 2.
- **The start-type writes of m065, m304, m340:** unsettled in the notes, no shipped formation carries m065 or m304, and the Mirror Aeons chapter uses tier 2 of Dark Yojimbo (m340 writes 2 in tier 1 only). The engine takes the start condition as an input; nothing to wire.

## 4. Proofs

| File | What it proves |
|---|---|
| `tests/unit/parity-ffx-formation-flags.test.ts` (31 tests) | **the model of the game** (defaults from the set-up routine, the setters' byte and bit arithmetic worked by hand, the one reader returning 0x3021 or 0) replayed on the **38** formation files of our chapters: exactly `bvyt09_10`, `_11`, `_12` end with Defend off; every chapter formation ends with the counter flag at 1 and the random-position flag at 0; the Anima chain is on in 16; the whole-game counts the table quotes (23 + 7 files for Defend, 11 for counters, 31 for the chain, 8 for escape, 847 for the position flag, none of them a chapter formation where the table says so). **The data:** `defendOff` on exactly the three Isaaru groups and on no other group of the game (the groups the data builds on demand included: the Dark Aeons pool and the Last Summoning chain); each formation file is the link it is said to be (the mirror locks). **The engine:** in each of the three links Yuna's first menu has no Defend row, a submitted Defend returns no event and the same actor is asked again, an aeon's menu has none either, a fork sees the flag; with the field taken off the group Defend is back and works; **the other 14 FFX chapters' first menus all offer Defend** and carry no flag |
| `tests/fixtures/parity/ffx/formation_flags.json` | the scan the model replays (names, small integers and script offsets; no script text) |
| `tests/unit/chapters/isaaru-duel.test.ts`, `isaaru-engine.test.ts`, `helpers/isaaruUnits.ts` | six cases used Defend as their "pass"; they pass with `pass(d)` (Cura for Yuna, an Attack for an aeon). The duel's "Defend stays open" is now "there is no Defend row" |
| existing | `ffx-engine-golden` (18 of 18, **nothing re-pinned**), `ffx-engine-fork`, `trigger-commands`, `data-ffx-command-records`, `parity-ffx-engine-aeons`, `re-parity-menus`, the Yojimbo, Sin and Mirror Aeons engine tests all green; `isaaru-ship` has the 3 art-only failures every worktree has (no `public/art`) |

**Mutation pass: 13 mutants of the production code, each putting one rule back wrong; all 13 caught** (`M01` the switch off, `M02` the copy ignoring the group, `M03` the copy setting it for every group, `M04` an enemy losing Defend too, `M05` an aeon keeping Defend, `M06` the menu still listing Defend, `M07` the executor not refusing, `M08` the refusal taking every command, `M09` link 3 without the field, `M10` link 2 saying false, `M11` the read comparing with the wrong value, `M12` another chapter's group switched too, `M13` the menu never listing Defend anywhere).

`npx tsc --noEmit` is clean (apart from other lanes' untracked `zz-` scratch files). `formation-flags.ts` is 57 lines; `setup.ts` 395, `commands.ts` 302, `execute.ts` 377. `node tools/orphans.mjs`: `formation-flags.ts` is reached from `setup.ts`, `commands.ts` and `execute.ts`; no new orphan.

## 5. Measurement

Before = `origin/r52-rc` (`3c92b60cc`), measured in this worktree before the first engine edit; after = the tip of this branch. The shipped line of every FFX chapter (the app's chain loop, `setupForChapter`,
`intendedStrategy`, `autoResolveMinigames` on), 12 seeds each, one row per seed (outcome, links won, party turns, engine turns, party KOs) plus a **digest of every link's full event log**. The scratch lab
(`zz-ffxflags-measure.tmp.test.ts`, `zz-ffxflags-isaaru500.tmp.test.ts`, the scripts, the raw numbers) is kept outside the repository in `D:\Tools\ffx-parity\rc10\ffx-formation-flags\`; nothing of it is committed.

**Every FFX chapter, 12 seeds: 180 of 180 seed runs identical, event for event.**

| Chapter | wins b / a | party turns b / a | party KOs b / a | seeds identical (outcome, turns, KOs, event-log digest) |
|---|---|---|---|---|
| seymour-flux | 12 / 12 | 53.3 / 53.3 | 1.08 / 1.08 | 12 of 12 |
| yunalesca | 12 / 12 | 148.5 / 148.5 | 12 / 12 | 12 of 12 |
| braskas-final-aeon | 11 / 11 | 240.1 / 240.1 | 5.5 / 5.5 | 12 of 12 |
| seymour-anima-macalania | 12 / 12 | 54.2 / 54.2 | 4.75 / 4.75 | 12 of 12 |
| evrae-airship | 12 / 12 | 70.9 / 70.9 | 0.67 / 0.67 | 12 of 12 |
| yojimbo-cavern | 11 / 11 | 65.3 / 65.3 | 3.58 / 3.58 | 12 of 12 |
| seymour-natus | 11 / 11 | 35 / 35 | 2.42 / 2.42 | 12 of 12 |
| seymour-omnis | 11 / 11 | 91.5 / 91.5 | 0.75 / 0.75 | 12 of 12 |
| **isaaru-via-purifico** | 11 / 11 | 37.6 / 37.6 | 3 / 3 | 12 of 12 |
| sin-fins-core | 11 / 11 | 314.1 / 314.1 | 2.67 / 2.67 | 12 of 12 |
| sin-face | 12 / 12 | 45.5 / 45.5 | 0 / 0 | 12 of 12 |
| sinspawn-gui | 12 / 12 | 83.7 / 83.7 | 1.08 / 1.08 | 12 of 12 |
| biran-yenke (hidden) | 12 / 12 | 16.5 / 16.5 | 0 / 0 | 12 of 12 |
| mirror-aeons | 8 / 8 | 187 / 187 | 19.17 / 19.17 | 12 of 12 |
| exp-fayth (hidden) | 12 / 12 | 70.9 / 70.9 | 0.67 / 0.67 | 12 of 12 |

The hidden Last Summoning is not in the table: its chain starts at a placeholder that the offering screen replaces (`offersAeons: 'open'`), which the chain loop of the lab does not answer. It is covered structurally instead:
none of its groups (opener, every possession link, Yu Yevon's link) carries the field (a test), and none of its formations sets the flag (the fixture).

**Chapter XIV, 500 seeds, two drivers** (the "before" arm is the same branch with `defendOff` taken off the three groups, so the only difference between the arms is that field, and with it unset every code path is the base's):

| Driver | wins before / after | party turns before / after | seeds whose event log moved | outcome flips | times the driver had nothing to say (the old filler was Defend) |
|---|---|---|---|---|---|
| the bench's own (`isaaruTactic`, `runChain`, the screen's carry) | 452 / 452 | 84.39 / 84.39 | **0 of 500** | 0 | 0 in 1,000 chain runs |
| the app's (`intendedStrategy`) | 452 / 452 | 38.17 / 38.17 | **0 of 500** | 0 | 0 in 1,000 chain runs |

**Cause of "nothing moves", in player words:** the flag takes a menu row away, and neither line ever uses that row. The app's suggestion never offers Defend (`ui/ffx/defendControl.ts`: it is a control the player reaches for, not a row the advisor names), and the bench's
tactic always has something better in Chapter XIV (a summon, a Shield, a hit); its fallback, the only place a bench reached for Defend, fired in none of the 2,000 runs. There is no mover, so no ablation of a mover was needed. A **player** who used Defend to wait out
Grothia's Hellfire, Pterya's Energy Ray or Spathi's countdown would be moved, and that is the game's own rule; it is not measured here because no shipped line plays that way.

`ffx-engine-golden` (18 of 18) is unchanged: **nothing was re-pinned**. `ffx2-atb-golden` and `ff7-golden` are untouched (no `ffx2` or FF7 file changed).

The 12-seed "after" run and the 500-seed run started after `D:/Tools/ffx-parity/HOLD_HEAVY` cleared (18:54); the single-chapter 12-seed runs of Isaaru, Seymour Flux, Evrae and Biran and Yenke before that took seconds each.

## 6. Disclosures in player words

- **Chapter XIV, Isaaru's contest of aeons (all three fights): Yuna and the aeons can no longer Defend.** The little Defend tab under the command window (Q on the keyboard, Triangle on a pad) is not shown there, and pressing the key does nothing. The game's own script for the duel switches Defend off
  (in the original, Triangle at the command window there plays a refusal sound and nothing happens). Nothing is said on screen; no sound is played yet (section 8).
- **Nothing else changed in play.** Fifteen FFX chapters at 12 seeds each, and Chapter XIV at 500 seeds with two different lines, play out identically, event for event, because neither the move advisor's line nor the bench's line ever chooses Defend in that chapter.
  A player who waited with Defend in those duels now has to choose something else (Yuna still has her summons, Cura, Pray and the items; the game's script would take most of those away too, section 9).
- **Read, not run.** The rule is read from the game's code (the set-up value, the one reader, the field's initialiser and three of the four menu handlers); the game was not run and no menu was watched, per the standing rules.
- **Not built, and why** (section 3): counters off (no chapter fights the Belgemine duels), Anima's chains off (a drawing on the player's Anima; our painting has the chains drawn on and there is no unchained one), escape "always" (no chapter fights those eight formations), the random-position flag (it writes the value it already has) and the start-type writes of three monsters (unsettled, and none is in a shipped fight).

## 7. CHANGELOG paragraph (for the release driver; this lane does not write CHANGELOG.md)

FFX only, Chapter XIV: in Isaaru's three aeon duels (Grothia, Pterya, Spathi) Defend is off, as in the game: the duel's own script switches Defend off for the whole battle, so Yuna and the aeons have no Defend and the Defend tab under the command window (Q or Triangle) is not shown there
(in the original, Triangle at that window plays a refusal sound and does nothing; ours stays silent for now). Nothing else about the duels changed: twelve seeds of every FFX chapter and 500 seeds of Chapter XIV play out the same, event for event, because the suggested line never uses Defend in that chapter.
Read from the game's code, not run. The other flags the game's fight scripts set (counters off, Anima's chains off, escape always) are not fought by any chapter, or are only a drawing, and were not built.

## 8. Presentation items for the release driver (visible text, menu look and sound are the driver's)

1. **The refusal cue.** In the original, Triangle at the command window in these three fights plays a refusal cue (sound cue 3 of the menu code, inferred) and nothing else. Ours does nothing (the tab is simply not drawn; `CommandMenu.defend()` returns). Whether to play a cue, or to draw the tab greyed instead of leaving it out, is the driver's; it needs no engine change (a greyed tab would need a `defend` row with `enabled: false`; the engine could emit one if the driver wants it, and then a reason would need words).
2. **No words were added.** The refused Defend emits no message, unlike the duel's "Only an aeon can fight an aeon" refusals.
3. **Anima's chains** (section 3): an unchained painting for the player's Anima in the 16 formations is new art; nothing is built.

## 9. Open items and findings on the way

- **Yuna's menu in the contest (a new gap, not in the scan): the formation scripts of `bvyt09_10` to `_12` disable Attack, Item, Weapon, Armor, Black Magic, White Magic, Skill and Special for Yuna (actor 1) and Switch, Escape and Flee for everyone** (`setCommandDisabled`, read in the disassemblies, 12 calls in each file; `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 4.1 says "Yuna keeps only Summon"). The engine instead keeps Cura, Nul spells, Pray and the items open for her and greys only the foe-aimed rows ("Only an aeon can fight an aeon", plan B6 = a, labelled our estimate). It is a visible menu change (her rows would shrink to Summon and Grand Summon): the driver's call, and it changes how the chapter plays (a Yuna who can heal through a weak enemy is the stalemate the plan's B11 rule exists for).
- **Aeons and Defend in other battles.** The engine lists Defend for an aeon everywhere; the game's field for a character (0x0079B4F0) is 0x3021 unless a record flag (bit 2 of byte +0x10 of the character record) is set. Whether aeons carry that flag was not decoded, so nothing is said about other battles.
- **A bench or test whose fallback is `defend()` loops in Chapter XIV**, because the engine keeps asking. The shipped tactic and the app's line never needed the fallback in the 500 measured seeds each (section 5), but any new Isaaru test or bench must pass with `pass(d)`.
- **Counter flag, Anima chain, escape "always" and the start-type writes** are listed in section 3 with what to do if a chapter ever reaches them.
- Ghidra (:8089, :8090) was down for the whole lane; nothing needed a live query.
