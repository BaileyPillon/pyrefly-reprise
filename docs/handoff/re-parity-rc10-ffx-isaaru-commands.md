# Re-parity RC10, lane "FFX Isaaru commands": Yuna's menu in the three aeon duels is the game's own (Summon and Grand Summon)

Status: **built, tested and committed on branch `re-parity-rc10-ffx-isaaru-commands` (from `re-parity-rc10-ffx-formation-flags`, `842b27c8b`); pushed to `origin/re-parity-rc10-ffx-isaaru-commands`; not merged to main, not deployed, not live** (2026-10-18).
**Game case: FFX only** (AGENTS.md rule 14). The calls are in FFX's formation scripts (`bvyt09_10`, `_11`, `_12`; handler `FFX.exe` 0x007A6EF0, setter 0x0079B470, menu gate 0x0079A5B0); FFX-2 has its own exe and script machine and none of it is read here.
`src/battle/ffx2`, `src/data/ffx2` and `src/audio` are untouched; `ffx2-atb-golden` and `ff7-golden` are unchanged. No boss number and no party number was changed or added.
Paper preflight: `docs/plans/re-parity-rc10-ffx-isaaru-commands-review.md` (`critic-plan` classes the change DEEP; committed first). Contract entry: `docs/CONTRACT-CHANGES.md` (2026-10-18, `EnemyGroupDef.commandDisables`).

Bailey's words that govern the lane: 2026-10-17, asked whether Isaaru's three aeon duels should match the game: **"Match the game (Recommended)"**; the standing order 2026-10-08 "It needs to be a 1:1 parity."
They supersede his earlier adopted estimates `D-147/B6` and `D-147/B7` (section 8).

Commits (small, each ending with the Co-Authored-By line): `c41d2d7bb` the paper preflight; `468319f2d` the contract, data and engine; `1504f5251` the tests and the fixture; `c77bcb09c` the test split under 400 lines and the comment updates; the commit that adds this note.

## 1. The data (read first)

Re-read from the saved disassemblies (`D:\Tools\ffx-parity\ai\ffx-evrae-yojimbo-isaaru-sin\dis\btl-bvyt09_1x.txt`), then **independently re-scanned from the install's own battle files** with a new scan (script call 0x703B, the three constants pushed before each call) over all 863 battle files: 120 files call it.
Each of `bvyt09_10`, `_11`, `_12` runs the same twelve `setCommandDisabled(who, command, flag)` calls in its entry function (`w0.f0`), before the first turn:

| Calls | Who (the script's actor spec) | Command ids | What the game does |
|---|---|---|---|
| 3, flag 1 | everyone (-23: every slot that is not a monster) | 0x3002 Switch, 0x3003 Escape, 0x3018 Flee | the handler (0x007A6EF0) expands the spec to slots and calls the setter (0x0079B470) on each; for an id 0x3xxx the setter sets the command's bit in the actor's disabled bitmap (Chr+0x690, all clear when the character is created, 0x0079B4F0); the menu gate 0x0079A5B0 reads the bit and the command is unusable |
| 8, flag 1 | Yuna (slot 1) | 0x3000 Attack, 0x3001 Item, 0x3004 Weapon, 0x3005 Armor, 0x3113 Skill, 0x3114 Special, 0x3115 Black Magic, 0x3116 White Magic | the same |
| 1, flag 0 | Yuna's slot, ids 9 / 8 / 12 | below 0x1000: the setter's other branch writes the aeon's availability byte | the mirror lock `lockedAeons` already carries (Ifrit in link 1, Valefor in link 2, Bahamut in link 3) |

Nothing disables Summon, Grand Summon (her Overdrive) or Dismiss (0x3056). So **Yuna's menu in the contest is Summon and Grand Summon.**

Scan of the 38 formation files our chapters fight (`tests/fixtures/parity/ffx/formation_commands.json`, numbers and file names only):

- Of the 15 battle files in the whole game that switch off an action command in their entry function (Attack, Item, Skill, Special, a magic), **only Isaaru's three are formations of our chapters** (the other twelve are Belgemine's duels and two other fights: `bjyt04_01`, `lmyt01_00` to `_07`, `genk00_40`, `mihn00_60`, `nagi00_40`).
- The other 35 chapter formations switch off **Escape and Flee** only (the boss fights that cannot be fled), and **Switch too in two**: `kino03_10` (Sinspawn Gui's second fight, every slot) and `mtgz01_10` (Biran and Yenke, Kimahri's slot). The engine already carries all of those: `canEscape: false`, `lineUp.noSwitch`, a Kimahri-alone line-up. So nothing outside Chapter XIV needed a change.
- After the entry function the scripts only toggle Talk (0x3105), in two files (`mcyt06_00`, `sins06_00`): a mid-battle event, not wired here (section 7).

## 2. What was built

| Where | Change |
|---|---|
| `src/battle/common/types.ts` (contract, additive) | `FormationCommandOff { who: 'everyone' \| CombatantId; command: number }` and `EnemyGroupDef.commandDisables?: readonly FormationCommandOff[]` |
| `src/data/ffx/enemies/isaaru.ts` | `ISAARU_COMMAND_DISABLES` (eleven rows: the game's command ids as numbers, `'everyone'` or `'yuna'`) on the three groups |
| `src/battle/ffx/formation-commands.ts` (new, 123 lines) | the switch `FORMATION_COMMAND_DISABLES`; the lists copied into `state.flags` at set-up (so a fork and the advisor's dry runs see them); `menuCommandOf` (the game command a row or submitted command belongs to); `commandOff`, `commandRefused`, `withoutDisabledRows` |
| `src/battle/ffx/commands.ts` | `availableCommands` is now the last step over the old builder: rows of a switched-off command are **not offered** to that actor (hidden, as Defend is) |
| `src/battle/ffx/engine.ts#submit` | a command that belongs to a switched-off command is refused: no event, the turn kept open, no message |
| `src/battle/ffx/setup.ts` | one call |

**Which row belongs to which command** (`menuCommandOf`): an Attack row is 0x3000, an Item row 0x3001, a Switch row 0x3002, an Escape row 0x3003, the Flee row (the Escape command in `party` mode) 0x3018, and an ability row the command of its category: Skill 0x3113, Special 0x3114, Black Magic 0x3115, White Magic 0x3116. Summon, Grand Summon (every `overdrive` row), Dismiss, Defend (its own flag, last lane) and the trigger rows belong to none.
Weapon (0x3004) and Armor (0x3005) are the original's equipment swaps in battle, which this engine has no row for, so those two disables take nothing away (a test runs every ability of the game through the mapping). Yuna's Skill and Special are both off, so how our `special` category splits between the game's Skill and Special lists does not change her menu.

**Why the refusal is in `submit()` and not in the executor.** The game's disabled bit is a *menu* gate. An Auto-Potion, a counter or a Berserk turn runs through `executeCommand`, not through the menu; refusing there would break them. `submit()` is the player's door.
(A Berserk, Confused or Provoked Yuna in the contest still gets the forced Attack through `runTurn`, where the older B6 duel rule `aeon-duel.ts` already refuses it and puts the turn back to the menu. This lane did not change that.)

The `aeon-duel.ts` rules stay and still do their work: the mirror lock, the loss when no aeon is left, the AP, the "Only an aeon can fight an aeon" refusal for a party member the list does not name, and the greyed Talk row. With the switch off (or the field taken off a group) the menu is exactly the old one (tests build both).

## 3. Proofs

| File | What it proves |
|---|---|
| `tests/unit/parity-ffx-isaaru-commands.test.ts` (model and data) | **an independent model of the game** (the handler's slot expansion incl. -23 and -21, the setter's set / clear / availability byte, the bitmap starting clear, worked by hand) replayed on the entry function of the **38** formation files: exactly `bvyt09_10` to `_12` end with Yuna's eight commands plus the three off, every other non-monster slot with the three, monsters with none, Dismiss never; the twelfth call is the mirror lock (aeon slots 9, 8, 12 = Ifrit, Valefor, Bahamut = the engine's `lockedAeons`); no other chapter formation switches off anything but Escape and Flee (Switch in exactly `kino03_10` and `mtgz01_10`); after the entry function only Talk is toggled (two files); the whole-game list. **The data:** `commandDisables` on exactly the three Isaaru groups and on no other group of the game (the groups built on demand included), and each group's list equals the model's |
| `tests/unit/parity-ffx-isaaru-commands-engine.test.ts` (engine and pure rule) | in each of the three links Yuna's first menu holds only Summon rows, Grand Summon and the greyed Talk row; Attack, an item, White Magic, Special, Scan, Switch, Escape and Flee submitted each return no event and she is asked again; the aeon's menu is untouched (Attack, abilities, Dismiss) and Dismiss works; a fork sees the same; with the field taken off the group her whole menu is back and Cura works; **a bigger party in the same battle** (the Highbridge party with its bench, `canEscape` on, a Flee row) loses Switch, Escape and Flee for everyone while Tidus keeps Attack and items; the 14 other FFX chapters carry no list and offer Attack; the pure mapping for every kind and every category (including `skill`, which no FFX ability uses), "everyone" never a monster, the switch on |
| `tests/fixtures/parity/ffx/formation_commands.json` | the scan the model replays (command ids, actor specs, flags, script offsets and the function each sits in; no script text) |
| `tests/unit/chapters/isaaru-duel.test.ts`, `isaaru-engine.test.ts`, `helpers/isaaruUnits.ts`, `trigger-commands.test.ts` | updated, with the cause written at each place (section 5) |
| existing | `ffx-engine-golden` (**nothing re-pinned**), `ffx-engine-fork`, `data-ffx-command-records`, `parity-ffx-engine-aeons`, `parity-ffx-formation-flags`, `re-parity-menus`, `re-parity-ai-isaaru`, `isaaru-bench` (200 seeds), `isaaru-tactic-bench` (200 seeds), the Yojimbo, Sin and Mirror Aeons tests: green |

**Mutation pass: 18 mutants of the production code and the data, each putting one rule back wrong; all 18 caught** (`M01` the switch off, `M02` the copy never reading the group, `M03` "everyone" ignored, `M04` a named actor ignored, `M05` a monster switched off too, `M06` an Attack row filed under Item, `M07` a White Magic row under Special, `M08` Flee read as Escape, `M09` the menu keeping every row, `M10` `submit()` not refusing, `M11` link 3 without the list, `M12` Attack missing from the list, `M13` Item for everyone instead of Yuna, `M14` a Summon row filed under Special, `M15` the quick-test flag never set, `M16` an aeon exempt, `M17` Dismiss filed under Escape, `M18` another chapter's group given a switched-off Attack). The raw log is kept outside the repository (`D:\Tools\ffx-parity\rc10\ffx-isaaru-commands\`).

`npx tsc --noEmit` is clean (apart from other lanes' untracked `zz-` scratch files). `formation-commands.ts` is 123 lines; `commands.ts` 308, `engine.ts` 379, `setup.ts` 397, `isaaru.ts` 351; the two new test files 221 and 250. `node tools/orphans.mjs`: `formation-commands.ts` is reached from `setup.ts`, `commands.ts` and `engine.ts`; the 26 orphans are the same as before the lane.

## 4. Measurement

Before = the base `842b27c8b` (measured in this worktree before the first engine edit); after = the tip of the branch. Same scratch lab as the last lane (`D:\Tools\ffx-parity\rc10\ffx-isaaru-commands\`; nothing of it is committed): every FFX chapter's shipped line (the app's chain loop, `setupForChapter`, `intendedStrategy`, `autoResolveMinigames` on), one row per seed (outcome, links won, party turns, engine turns, party KOs) plus a **digest of every link's full event log**.

**Every FFX chapter, 12 seeds: 180 of 180 seed runs identical, event for event** (wins, party turns and KOs equal in every row, as in the last lane's table: Seymour Flux 12, Yunalesca 12, Braska 11, Macalania 12, Evrae 12, Yojimbo 11, Natus 11, Omnis 11, **Isaaru 11**, Sin fins 11, Sin face 12, Gui 12, Biran and Yenke 12, Mirror Aeons 8, hidden Fayth 12; Isaaru 37.6 party turns, 3 KOs, before and after). Every chapter but XIV is identical by construction too (no group but Isaaru's carries the field); Chapter XIV is identical as measured.

**Chapter XIV, 500 seeds, both drivers** (before = the base, after = the tip; a driver's "nothing to say" is answered with the first Summon, else an Attack, else Defend):

| Driver | wins before / after | party turns before / after | seeds whose event log moved | Yuna's commands before / after | times the driver had nothing to say |
|---|---|---|---|---|---|
| the bench's own (`isaaruTactic`, `runChain`, the screen's carry) | 452 / 452 | 84.39 / 84.39 | **0 of 500** | 2,425 Summon + 500 Grand Summon / the same | 0 / 0 |
| the app's (`intendedStrategy`) | 452 / 452 | 38.17 / 38.17 | **0 of 500** | 2,425 Summon + 500 Grand Summon / the same | 0 / 0 |

**Cause of "nothing moves", in player words:** the game's rule takes away Yuna's Attack, her heals and Nul spells, Pray and Scan, and her items. Neither line ever used any of them in the contest: across the 500 seeds each, Yuna took 2,925 turns and every one was a Summon or the Grand Summon. In the old menu she was offered, per turn, an Attack, ten White Magic rows, two Special rows and eleven items next to the Summons; the new menu offers the Summons, Grand Summon and the greyed Talk row, and both lines pick from the Summons exactly as before. The Defend lane found the same shape for Defend. There is no mover, so no ablation was needed.
A **player** who healed Yuna, used a Phoenix Down or a potion between aeons, cast Pray, or waited out an aeon's death with Cura would be moved, and that is the game's own rule; it is not measured here because no shipped line plays that way.

`ffx-engine-golden` (18 of 18) is unchanged: **nothing was re-pinned**. `ffx2-atb-golden` and `ff7-golden` are untouched (no `ffx2` or FF7 file changed).

## 5. The tests and helpers that used Cura, Pray, Defend or items for Yuna's turn

Each change carries its cause in the test.

- **`helpers/isaaruUnits.ts#pass(d)`**: Yuna passes by summoning the first aeon her menu offers (it was Cura on herself; before that Defend). Cause: the three scripts leave her only Summon and Grand Summon; there is no way for her to wait. An aeon passes by attacking its foe (it has no Defend, last lane). A Yuna with nothing to summon throws, so a test cannot silently pass by an illegal command.
- **`isaaru-duel.test.ts`**: "Yuna's Attack, Talk, Scan and Grenade are greyed...; heals, Nul spells, Pray stay open" became "Yuna's menu is Summon and Grand Summon, Talk keeps its older greyed row, nothing else exists" (the old assertions inverted: Cura, Pray, items, Attack are *absent*). "A submitted Attack is refused with ONLY_AN_AEON" became "every command the script switched off is refused: no event, the turn stays open" (five commands). "No aeon left to summon is a defeat" no longer drives Cura: Yuna never gets a menu (`nextInput` is `null`), which is the same rule seen from the front. "Yuna's KO is a defeat" now KOs her directly: the old route (Grothia attacking a Yuna who passed with Cura) is closed because she must summon at her first turn.
- **`isaaru-engine.test.ts`**: Grothia: "Summon first, Yuna alone: his Yuna attack, then Hellfire" is now "Summon first, Yuna must summon, then Hellfire" (the Yuna-alone branch of his script is not reachable at the start of a link any more; it is covered by `re-parity-ai-isaaru.test.ts`, which tests the script on a board with no aeon out). Pterya: the first Yuna turn summons instead of passing. Spathi: "Yuna alone, Mega Flare lands on her: a defeat" is now "one free aeon, no Shield: the count runs, Mega Flare takes it, nothing is left to summon, a defeat" (the state with a Yuna alone when Mega Flare lands is not one play reaches).
- **`trigger-commands.test.ts`**: the audit walker used Defend to move the clock. In the contest Defend was already refused (last lane) and now so is everything of Yuna's but Summon, so the walker stood on Yuna's first turn for ever and audited five rows (the test wants more than 12). Cause: the walker's pass. It now passes by Summon (Yuna) or Attack (an aeon) where Defend is switched off, and by Defend everywhere else (unchanged).

Final targeted run (69 files: every test file that names Isaaru, the three goldens, `ffx-engine-fork`, `data-ffx-command-records`, `parity-ffx-engine-aeons`, `re-parity-menus`, `parity-ffx-formation-flags`; not the full suite): **67 files pass, 2 fail, 4 tests, all art-only.** `ffx-engine-golden` 18 of 18, `ffx2-atb-golden` 6 of 6 and `ff7-golden` 3 of 3 pass unchanged.
Art-only failures every worktree has (no `public/art`): `isaaru-ship` 3 (the pause card with hero plate B, the factory on the installed plate, every enemy on its installed painting), `cutscene-story-poses` 1 (the figure table from the staged sidecar). None is touched by this lane.

## 6. Disclosures in player words

- **Chapter XIV, Isaaru's contest of aeons (all three fights): Yuna's command window now holds only Summon and Overdrive (Grand Summon)** (and the greyed Talk row it had). She can no longer attack, cast Cura or a Nul spell, use Pray or Scan, or use an item, between her aeons. The game's own script for each duel switches those commands off for her (and Switch, Escape and Flee for everyone, which this fight already did by its set-up). The Defend tab is gone as well, from the last lane.
- **Her aeons are untouched:** their Attack, abilities, Shield, Overdrive and Dismiss are as they were.
- **What it means for play:** Yuna cannot wait out a turn any more. When her aeon falls she summons the next one at once (or loses the duel if there is none), and the contest cannot be stretched by healing her (the plan's B11 stalemate rule is now the game's own rule).
- **Nothing else changed in play.** Fifteen FFX chapters at 12 seeds each, and Chapter XIV at 500 seeds with two different lines, play out identically, event for event, because the suggested line never uses anything of Yuna's but her summons in that chapter.
- **Read, not run.** The rule is read from the game's code and its scripts (the handler, the setter, the menu gate); the game was not run and no menu was watched, per the standing rules.

## 7. CHANGELOG paragraph (for the release driver; this lane does not write CHANGELOG.md)

FFX only, Chapter XIV: in Isaaru's three aeon duels (Grothia, Pterya, Spathi) Yuna's menu is now the game's own: Summon and Grand Summon. The duel's own script switches off her Attack, Item, Weapon, Armor, Skill, Special, Black Magic and White Magic (and Switch, Escape and Flee for everyone), so she can no longer attack, heal, cast Nul spells, use Pray or Scan, or use items between aeons; the rows are not shown. Her aeons' menus are unchanged. This replaces our earlier estimate (her attacks greyed, everything else open). Nothing else about the duels changed: twelve seeds of every FFX chapter and 500 seeds of Chapter XIV play out the same, event for event, because the suggested line only ever summons in that chapter. Read from the game's code and scripts, not run.

## 8. Superseded decisions

- **`D-147/B6` ("Yuna's own commands": adopted as recommended, a, labelled our estimate: her foe-aimed rows greyed with "Only an aeon can fight an aeon", the rest open, the mirror-locked aeon greyed with its reason).** Superseded for Yuna's menu by Bailey's 2026-10-17 "Match the game": her Attack, Item, Skill, Special and both magics are not offered at all. **Still standing from B6:** the mirror-locked aeon greyed with its reason (the game's own lock), and the greyed Talk row (the scripts do not touch Talk; section 9).
- **`D-147/B7` ("Items": adopted as recommended, a, attack items greyed under B6 = a; the aeon has no Items row, an estimate that the game's menus confirm for every FFX battle).** Superseded for Yuna: the Item command is switched off, so no item row, attack or healing, is offered; the bag is still carried from link to link. **Still standing:** an aeon has no Items row.
- The release driver records the supersession in `DECISIONS.md`; this lane does not write it.

## 9. Visible text, for the release driver (not edited)

1. **`src/data/guides/ffx-isaaru.ts`, line 37, the first rule's `text`:** "Only an aeon can fight his aeons, and never the same one: while he has Ifrit out, yours will not come. **Yuna can summon, heal herself and use items, nothing else.**" The last sentence is no longer true: Yuna can summon (Summon and Grand Summon), nothing else. Its `cite` (line 39) names "B6 (our estimate for the greyed rows)", which no longer describes the menu.
2. Nothing else says so: the other lines about the contest (the guide's other rules and hints, `src/data/guides/docs/ffx-isaaru.ts`, the chapter blurb "Yuna stands alone, and only her aeons can answer his", the story script) were read and stay true. The hint "Summon the aeon the sources suggest for this link. Its mirror stays greyed" is true (the locked Summon row is still greyed).
3. Stale **code comments** (not visible), updated in this lane: `aeon-duel.ts`'s header, `via-purifico.ts`'s B7 line, the Isaaru tactic's header.

## 10. Presentation items for the release driver

1. **Hidden or greyed.** Whether the original greys a disabled command's row or leaves it out of the window is unread UI code (the menu gate returns "disabled" to the caller; what the caller draws was not read). The engine **hides** them, as it hides Defend, so Yuna's window is "Talk (greyed), Overdrive, Summon". To show them greyed instead, `withoutDisabledRows` would set `enabled: false` and a `disabledReason` rather than filter, and that reason needs words, which are the driver's. No UI file changed and no word was added.
2. **The refusal cue.** A hidden row cannot be pressed, so there is no press to refuse. If the driver greys the rows instead, the original's error cue (the same one as for Defend, inferred) would be the sound to play on a press.
3. **The Talk row.** It is the one thing left of the older B6 rule on Yuna's menu. The scripts never touch Talk (0x3105) in these files, so the game neither switches it off nor on there; whether Talk is on Yuna's list in the original at that point depends on her command list, not read here. It stays greyed as it was; the driver may want it gone (one line in `aeon-duel.ts`) or to keep it.

## 11. Open items and findings on the way

- **The Talk row** (section 10): unresolved, left as it was.
- **Monster scripts call `setCommandDisabled` mid-fight too** (found by the name search; not scanned in this lane): `m101`, `m109`, `m123`, `m163` to `m169`, `m178` to `m180`, `m211`, `m251` to `m253`, `m256`. They toggle Escape, Flee, 0x3028, 0x3104 and Attack for named slots at moments of the fight. Which of our bosses these are and what they switch off is a row for the gap scan.
- **Weapon and Armor** in battle: the engine has no row for them. If a chapter ever fields a Weapon / Armor swap, `GAME_COMMAND.weapon` and `.armor` are already the ids.
- **Skill and Special**: our `special` category holds both of the game's lists (no FFX ability uses `skill`). Irrelevant to Yuna here (both are off); if a later formation switches one off for another character, the split would have to be read from the ability records.
- **A Berserk, Confused or Provoked Yuna** in the contest: unchanged (the duel's older refusal puts the turn back to the menu); not measured.
- Ghidra (:8089, :8090) was not needed: every read is from the saved decompile (`ffx/work/all`) and disassembly dumps.
