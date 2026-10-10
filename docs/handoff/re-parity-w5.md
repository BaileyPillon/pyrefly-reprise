# Re-parity W5: the FFX Overdrive gauge, the aeons and Steal follow the game's code

Status: **built, committed and pushed on branch `re-parity-w5` (the full suite did not finish and one seed pin, advisor-note, is open: sections 8 and 9) (from `origin/re-parity-w2` `919f2c78`, 2026-10-10); not merged into another branch, not deployed.** Track `re-parity`
([plan](../plans/re-parity.md), [paper preflight](../plans/re-parity-review.md)). Owner: Bailey. **Game case: FFX only** (AGENTS.md rule 14). FFX-2 and FF7 import none of the modules this
batch touched; `ffx2-atb-golden` and `ff7-golden` pass unchanged, and no file under `src/battle/ffx2` or `src/data/ffx2` changed.

Bailey: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-09 "Your findings need to be implemented into live builds as the decompilation work progresses."; 2026-10-10 "ok keep going please" and,
after a restart, "resume work please". A first W5 agent was stopped by an app restart with 16 modified and 5 new files uncommitted; this note continues that work (nothing was started over).

Commits (all on `re-parity-w5`; the last one is this note's own):

| Commit | What |
|---|---|
| `79e053bc` | FFX Steal rolls the game's byte through the proven steal kernel: 255 halved after each success and never below 1, a Mug that missed still draws its roll (FFX only; game-code parity) |
| `80af7f7b` | FFX Overdrive gauge follows the game's hooks, an aeon's bar is 20 points wide, Shield zeroes and Boost doubles on anyone, aeons wear the gear the game gives them (FFX only; game-code parity) |
| `05955aa0` | FFX aeons: nobody's counter moves when an aeon comes or goes (the summoner keeps the recovery of her Summon), a wiped aeon stays away its own number of battles, counted by each battle's save (FFX only; game-code parity) |
| `ba76d164` | FFXEngine.init keeps the events a battle's build announces until the engine holds its context, so a link that opens with a member under half HP no longer throws (FFX only) |
| `3ffb2907` | Engine-level parity tests for the FFX gauge, Steal and aeons; ffx-engine-golden re-baselined once ("game-code parity"), every moved link explained; Macalania A-8 re-pinned (FFX only) |
| `6b3ba890` | The gauge parity test reaches Rook and Dancer (two mutants of the outcome hook survived a narrower sample); the aeons' chain test gets its own timeout (FFX only) |
| `c9192b45` | Handoff for re-parity W5 and its notes: the status of each difference row, the CONTRACT-CHANGES entry, and the corrections to the notes that gave an aeon an equipment crit bonus of 0 and a wiped aeon 3 battles (FFX only; records only) |
| (this commit) | The final text of this note: the full-suite state and the open items it leaves (FFX only; records only) |

## What the engine does now

* **The Overdrive gauge is the game's** (`gauge.ts` over `kernel/overdrive.ts`, `overdrive-hooks.ts`, `overdrive-cost.ts`, all proven against FFX.exe). Every hit record runs the game's hook
  before its HP changes (Stoic `hp*30/maxHP+1`, Comrade `*20`, Healer `min(heal, missing HP)*16/maxHP+1`, Warrior `min(hp*10/ref+1, 16)`, an aeon hit by a monster `base*18/maxHP+1`, an aeon hitting
  one `((hp*16)/ref)/10+1`): the division comes first, the `+1` is added to the quotient, so a hit of any size gives at least 1. The outcome hook runs after the HP changed (Dancer, Rook, and Tactician
  and Victim from the status step's count of harmful statuses). A KO runs the death hook (Avenger, Slayer, Hero), a turn start the turn hook (Ally, Sufferer, Daredevil, Loner), a win Victor for
  every member in the battle, dead or not, a party flee Coward. **Shield zeroes and Boost doubles the gain of any character**, not only an aeon; Curse, a dead or Petrified character take nothing;
  Double, Triple and SOS Overdrive, Hot Spurs and Eccentrick go through the same add.
* **An aeon's bar is 20 points wide** in the game; the engine keeps it in percent (0 to 100, a point is 5) so the HUD, the builds and the chain carry are unchanged, and the kernels see `gauge / 5`.
  A Grand Summon holds the aeon's gauge at its maximum and the stored one comes back when the cost is paid.
* **Aeons and the party** (`adapt/aeon-party.ts` over `kernel/aeon-party.ts`, `battle-save.ts`): nobody's counter moves when an aeon comes or goes, so **the summoner keeps the recovery her Summon
  cost** (the old thaw put every counter back as it was before the Summon: a Yuna at Agility 20 was charged 30 and acted at once after the aeon left); whoever a leaver provoked is released and a
  Threaten pair a leaver was an end of is broken; the aeon acts next. **A wiped aeon stays away its own number of battles** (Valefor 8, Ifrit 12, Ixion 20, Shiva 20, Bahamut 24, Anima 24, Yojimbo 24,
  each Magus Sister 30; the wipe starts the count one higher and the battle's own save counts it down once, `engine-end.ts` -> `settleAeonRecovery`), at full HP and MP when it reaches 0; the chain
  carry (`BattleScreenSetup.ts#carryFfx`) takes the count to the next link.
* **An aeon wears the gear the game gives it** (`aeon-gear.ts`): critical bonus 6 (the earlier note said 0), Pierce on nine of ten (not Valefor), Break Damage Limit on Bahamut, Anima and the Magus
  Sisters, Break HP and MP Limit on all.
* **Steal rolls the game's byte** (`adapt/steal.ts` over `kernel/steal-rewards.ts#stealItem`): a table that says 100 percent is the byte 255 and the chance after `n` successes is 255, 127, 63, 31, 15,
  7, 3, 1, 1, ... (never 0; the old percent roll reached 0 at the eighth steal). The success roll is the first draw `% 255`, the rarity roll the second, only after a success (`& 0xff` below 0x20, 0x80
  with Pickpocket, always with Master Thief). A Mug that missed draws the roll and the miss cancels the steal.
* **One crash fixed on the way** (`engine.ts#init`): a battle that opens with a member under half HP (a chain's later link, no heal between) threw `init(setup) has not been called`, because
  `buildBattle` announces the member's Critical status before the engine holds its context. The engine now keeps what the build announces and logs it once the context exists. Found by
  `chapters/isaaru-bench` (the roster-order line, roughly one chain in seven of 200 seeds) once this batch changed how the chain plays out; the cause of the throw is older than this batch (the base's own runs never opened a link with a member under half HP and no Critical status); `tests/unit/ffx-engine-init-critical.test.ts`.

## 1. Every kernel input and its engine source

An input the engine cannot supply is an error, never a default. "Constant" means the game's value, with the reason.

**The gauge world** (`adapt/od-world.ts#odFieldOf`, rebuilt for each hook call from the engine's combatants and written back by `commitOd`, which emits the `overdrive-gauge` events the engine always emitted)

| Input | Engine source |
|---|---|
| slot | `adapt/slots.ts#slotOf` (party 0 to 6, aeons 8 to 0x11, monsters `0x14 +` formation index); a combatant with no slot (a unit test's made-up id) takes no part in the hooks |
| mode | the party member's `overdrive.mode` as the game's number (the 17 modes, in the order of a save record); every aeon is the game's mode 0x13 (the engine's placeholder `stoic` is not read); a monster 0xff (an enemy script writes its own gauge, `overdrive.ts#setGauge`) |
| gauge, maximum | party member: `gauge` and 100; aeon: `gauge / 5` and 20; a held Grand Summon gauge reads as the maximum with the stored one saved beside it |
| learning counters | all `0xffff` ("never counts"): the engine's builds name one mode per member and have no learning (research note O7) |
| reference damage | `kernel/overdrive.ts#odRefDamage(Strength, Magic)` (the engine's `estimatedDamage` is the same number: 7,225 of 7,225 pairs) |
| permanent, Sleep, Silence, Darkness, Slow, extra word | `permWord`, `counterOf`, `extraWord` (Shield 0x40, Boost 0x80, Curse 0x400, Doom) |
| buff flags | `buffByte` (Hot Spurs 0x20, Eccentrick 0x40) |
| auto-ability word B | Double 1, Triple 2, SOS 4, Overdrive to AP 8 from the gear (`adapt/words.ts#autoWordB`), plus an aeon's fixed gear (0x600, or 0xe00) |
| in battle, dead, Petrified, gets turns | on the field now (the aeon alone while one is out, the active party otherwise, the enemies on the field); the engine's KO; `petrify`; on the field and not an orders-only actor |
| HP, maximum HP | `c.hp`, `c.stats.maxHp` (the hook runs before the hit's HP is applied, so a Healer reads the HP still missing) |
| the hit | `HitReport.amounts[0]` (the signed HP change), `HitReport.base` (the record's un-varied base damage, byte `+0x1c`), `chargesOverdrive` (`Cmd+0x1c` bit 24; derived for an ability with no record: anything but an item or an Overdrive), `outcomeByte` (record byte 3), the status step's result counter 7 |
| level, AP curve | the member's Sphere Level and the row 2, 0, 5, 22,000 of all seven (only the Overdrive-to-AP path reads them; the engine has no AP ledger for it) |

**The party world** (`adapt/aeon-party.ts#fieldOf`): the active list is `state.activeIds` as slots (seven wide, `0xff` empty); the in-battle bytes come from the field (`friendlies`, `enemies`) and the
parked copy from the party while an aeon is out; HP, dead, Petrified, the counter and its base (`rtOf`), the permanent word with the Provoke and Threaten bits from the statuses, the provoker (the
`provoke` status's `sourceId` as a slot), the two Threaten link bytes (the `threaten` status's `sourceId` on the target, the user's link byte pointing back), the gauge fields (as above), the
recovery counter (`reviveCountdown`), its record value (`aeon-gear.ts`). Constants: the party order table is the identity (the engine has none), "can be summoned" is 1. **A Threaten pair is one to
one in the game** (the user has a single link byte): a user who threatened two monsters at once (the engine allows it) releases the one its link byte names and the other at its own turn start.

**Steal** (`adapt/steal.ts`): the chance byte is the enemy's `steal.stealRate` when the record carries it, else `round(baseChance * 255 / 100)` (every shipped FFX boss table says 100); the thief's
auto-ability word has Pickpocket 0x80 and Master Thief 0x100; the quantities are the table's counts (at least 1); the item ids are stand-ins the kernel only tests for "is an item"; the count of
earlier steals is `rtOf(...).stealCount`; the missed-hit count is 1 for a Mug that missed. One engine draw per kernel draw: `int(0, 254)` for stream 10, `int(0, 255)` for stream 11.

## 2. Difference rows (`research/re-ffx-overdrive-steal-aeons.md` section 5): what changed

The status of every row, with its proof, is the table in that note's section 5.1. In short: **wired** O1 to O5, O6 (SOS), S1, S2 (Mug), A2, A3, A4; **identical** O8, S5, A1, A5, A9; **not built** (rule 10: no
shipped chapter uses them) S3 and S4 (Pilfer Gil, Nab Gil, Bribe), R1 to R4 (item drops, Gillionaire, Double and Triple AP, gear drops), A6 and A7 (the Magus Sisters); **unreachable** R5; O7 unchanged; the
AP award of Overdrive to AP is not wired. Corrections to the other notes: `research/re-ffx-commands.md` section 5 and the W1 handoff said an aeon's equipment crit bonus is 0 (it is 6);
`research/ffx-combat-core.md` kept "3 battles" for a wiped aeon (a superseded note now points at the game's counts).

## 3. Engine code replaced and deleted

`overdrive.ts` 311 lines (was 472): the gain functions (`onDamageTaken`, `onDamageDealt`, `onHealDealt`, `onFlatTrigger`, `onTurnStartGauge`, `payVictorGauge`), the gain table, `AEON_FILL_MULT`, the
status lists `TACTICIAN_STATUSES` and `VICTIM_STATUSES` are gone; `addGauge` and `spendOverdrive` keep their signatures and call `gauge.ts`. `aeons.ts`: `freezeParty`, `thawParty`,
`AEON_REVIVE_BATTLES` (the authored 3) and the dead `aeonEntryDelay` are gone. `steal.ts`: the percent halving and the 0..99 roll are gone. `docs/CONTRACT-CHANGES.md` has the entry.

## 4. Tests

New, all engine-level (the engine's own paths against the kernels or against the rules of the research note written out again, with nothing imported from `adapt/` by the oracles):

| File | What it proves |
|---|---|
| `parity-ffx-engine-gauge.test.ts` (8 tests) | the gauge add on 600 generated characters (party and aeon; Shield, Boost, Curse, KO, Petrify, Hot Spurs, Eccentrick, Double, Triple, SOS, Overdrive to AP); 1,200 real actions through `resolveAbility` (a party member hitting a monster, an aeon hitting one, a monster hitting a party member and an aeon, a Healer healing) with the same draws: the gauge of every character equals the kernels' hook by hook; 800 fields for the turn, death, victory and escape hooks; Entrust; the cost of an Overdrive and a Grand Summon's held gauge; every `overdrive-gauge` event starts from the gauge as it stood |
| `parity-ffx-engine-steal.test.ts` (5) | the byte schedule 255, 127, 63, 31, 15, 7, 3, 1, 1, 1 (a roll equal to the chance fails and changes nothing, one below it succeeds and counts); 500 generated steals (draws, item, count, Pickpocket, Master Thief, Mug that missed, `stealRate`) against the rules |
| `parity-ffx-engine-aeons.test.ts` (9) | the aeons' fixed gear (critical bonus 6, Pierce, Break Damage Limit, Break HP and MP Limit; an aeon's Attack crits at `Luck - target Luck + 6`); the recovery count of every aeon, wiped and settled battle by battle to full HP and MP; the count carried to the next link; 300 generated fields (counters, provokes, Threaten pairs, the aeon acts next, Grand Summon held gauge); a whole engine on Chapter XIV (Yuna still pays for the Summon after the aeon is dismissed); 40 seeds of the whole chain (no link ends on the raw wipe count) |
| `ffx-engine-init-critical.test.ts` (2) | a battle that opens with a member under half HP does not throw and logs his Critical status |

Changed: `ffx-aeons.test.ts` (the thaw test now pins the game's rule: the party's counters do not move; a new test pins the summoner's recovery; the Banish test reads the recovery count),
`chapters/macalania-engine.test.ts` (A-8 seed 1 -> 2, reason and the seeds that satisfy it in the comment), `ffx-engine-golden.test.ts` (section 6). The strings of the Overdrive modes in
`src/data/ffx/overdrives/modes.ts` and three comments in `types.ts` say the game's integer forms.

### Mutation checks (a mutant is one exact-string edit of the source; the named test files must fail; each file was restored byte for byte and its SHA-1 checked)

**31 mutants** (G1 to G13 on the gauge, S1 to S4 on Steal, A1 to A13 on the aeons and their gear, E1 on the engine's init), run by a scratch script outside the repo (`D:\Tools\ffx-parity\rc2-w5\mutants-result.json`, `mutants-result-2.json`).
**31 caught, 0 survive**: 29 were caught by the first sample; two (G11 and G12, the outcome hook after a landed hit and after a missed hit) survived it because Rook and Dancer need a blow turned aside by Shell or Protect and a blow that
misses, so the enemy-hits-party situations now lean to those two modes (commit `6b3ba890`) and both are caught. (The message of `6b3ba890` says 29 mutants and 27 caught: the counts are 31 and 29.)

| # | Edit (file) | What it breaks | Result |
|---|---|---|---|
| G1 | `adapt/od-world.ts` | an aeon's bar is 100 wide like a party member's (unit 1) | CAUGHT (3 tests fail); restored by checksum: yes |
| G2 | `adapt/od-world.ts` | Shield, Boost and Curse not shown to the gauge add | CAUGHT (4 tests fail); restored by checksum: yes |
| G3 | `adapt/od-world.ts` | Hot Spurs and Eccentrick not shown to the gauge add | CAUGHT (1 tests fail); restored by checksum: yes |
| G4 | `adapt/od-world.ts` | a parked party counts as in the battle while an aeon is out | CAUGHT (2 tests fail); restored by checksum: yes |
| G5 | `adapt/od-world.ts` | the HP the Healer reads is always full (counts the whole heal) | CAUGHT (3 tests fail); restored by checksum: yes |
| G6 | `adapt/od-world.ts` | a KO'd character is not dead to the gauge | CAUGHT (3 tests fail); restored by checksum: yes |
| G7 | `adapt/od-world.ts` | the kernel's points are not scaled back to the engine's percent | CAUGHT (3 tests fail); restored by checksum: yes |
| G8 | `gauge.ts` | every hit charges the Warrior (the command's Overdrive bit ignored) | CAUGHT (1 tests fail); restored by checksum: yes |
| G9 | `gauge.ts` | the aeon's gain reads the damage dealt instead of the record's base | CAUGHT (1 tests fail); restored by checksum: yes |
| G10 | `gauge.ts` | the turn hook does nothing | CAUGHT (1 tests fail); restored by checksum: yes |
| G11 | `hit-apply.ts` | the outcome hook after a landed hit is not run | first run SURVIVED (the sample rarely reached Rook and Dancer); after the sample was widened: CAUGHT (1 tests fail); restored by checksum: yes |
| G12 | `hit-apply.ts` | a missed hit does not run the outcome hook (Dancer) | first run SURVIVED (the sample rarely reached Rook and Dancer); after the sample was widened: CAUGHT (1 tests fail); restored by checksum: yes |
| G13 | `hp.ts` | the death hook is not run by a KO | CAUGHT (1 tests fail); restored by checksum: yes |
| S1 | `adapt/steal.ts` | the halved chance may reach 0 (the old schedule's floor) | CAUGHT (1 tests fail); restored by checksum: yes |
| S2 | `steal.ts` | the success roll is drawn 0..99 again | CAUGHT (2 tests fail); restored by checksum: yes |
| S3 | `steal.ts` | a Mug that missed still reports 'Nothing was stolen' | CAUGHT (1 tests fail); restored by checksum: yes |
| S4 | `adapt/steal.ts` | a table's percent is taken as the byte (100, not 255) | CAUGHT (3 tests fail); restored by checksum: yes |
| A1 | `aeon-gear.ts` | Valefor's recovery is 3 again | CAUGHT (1 tests fail); restored by checksum: yes |
| A2 | `aeon-gear.ts` | Ifrit has no critical bonus | CAUGHT (2 tests fail); restored by checksum: yes |
| A3 | `aeon-gear.ts` | Valefor wears Pierce | CAUGHT (1 tests fail); restored by checksum: yes |
| A4 | `aeon-gear.ts` | Bahamut has no Break Damage Limit | CAUGHT (1 tests fail); restored by checksum: yes |
| A5 | `aeons.ts` | the summoned aeon does not act next | CAUGHT (2 tests fail); restored by checksum: yes |
| A6 | `adapt/aeon-party.ts` | a battle's save does not count the recovery down | CAUGHT (3 tests fail); restored by checksum: yes |
| A7 | `aeons.ts` | a wipe starts the old authored count of 3 | CAUGHT (3 tests fail); restored by checksum: yes |
| A8 | `aeons.ts` | a summon does not release what the leavers provoked | CAUGHT (1 tests fail); restored by checksum: yes |
| A9 | `src/app/screens/BattleScreenSetup.ts` | the chain carry drops the recovery count | CAUGHT (1 tests fail); restored by checksum: yes |
| A10 | `engine-end.ts` | the end of a battle does not settle the aeons' recovery | CAUGHT (1 tests fail); restored by checksum: yes |
| A11 | `equipment.ts` | an aeon's equipment crit is 0 again | CAUGHT (3 tests fail); restored by checksum: yes |
| A12 | `adapt/words.ts` | an aeon's gear word A (Pierce) is not shown to the damage kernels | CAUGHT (1 tests fail); restored by checksum: yes |
| A13 | `adapt/words.ts` | an aeon's gear word B (Break Damage Limit) is not shown to the damage kernels | CAUGHT (1 tests fail); restored by checksum: yes |
| E1 | `engine.ts` | events raised while a battle is built throw again | CAUGHT (1 tests fail); restored by checksum: yes |

## 5. Goldens

`ffx-engine-golden`: all 18 digests move (the old values are `919f2c78`'s, in git history). Every link's log was compared event by event, sequence numbers ignored, against the same line run on
`919f2c78` (which reproduces the old table to the digit): **Braska's link 2 (seeds 1 and 7) is identical** and keeps its digest; the 32 other links move, and every one for a named reason:

| Reason | Logs |
|---|---|
| (a) only `overdrive-gauge` events differ (their values and counts are the game's; nothing the party or the boss does changed) | evrae-airship#1 and #7, seymour-omnis#1 and #7, yojimbo-cavern#7, braskas-final-aeon#1 and #7 links 3 and 4 |
| (b) the first other difference is the turn after an aeon leaves: the summoner keeps her Summon recovery (row A3), so a party member acts where Yuna did | seymour-flux#1 and #7, seymour-natus#1 and #7, seymour-anima-macalania#1, yojimbo-cavern#1, isaaru-via-purifico#1 and #7 link 1, braskas-final-aeon#1 and #7 link 1 |
| (c) the first other difference is a choice the gauge decides (rows O1 to O3): an aeon is without the Overdrive it had (Mega Flare, Hellfire become Attack; Sonic Wings for Energy Ray), Auron has his earlier | isaaru-via-purifico#1 and #7 links 2 and 3, seymour-anima-macalania#7, yunalesca#1 and #7 |
| (d) a chain follows from the differences of its earlier links (HP, MP and gauges are carried; a member carried under half HP opens the next link with Critical) | braskas-final-aeon#1 and #7 links 5 to 7 |

One outcome moves: isaaru-via-purifico#1 link 3 defeat -> victory; the other 17 keep theirs. One seed is one sample (section 7 has the rates). `ffx2-atb-golden` and `ff7-golden` unchanged (both run on the final tree: 2 files, 9 tests pass); no file with `ffx2` in its path changed in this branch.

## 6. Hand-kept mirrors and unwired kernels

* `ffx/estimate.ts` (`statusOdds`) and `engine/tactics/advisor-roll.ts` model status odds and the roll policy; neither computes a gauge gain, a steal chance or a recovery count, and the advisor's forecasts
  run the real engine on a clone, so they are in step. Nothing hand-kept mirrors the gauge: the Overdrive-mode strings in `data/ffx/overdrives/modes.ts` were the only text, now corrected.
  `rt.frozenPartyCtb` and `rt.aeonStoredGauge` (runtime fields nobody reads any more) are left in place; the copies in `intent.ts` and `simulate.ts` still carry them. Stale text left (guides are
  Bailey's wording): the Chapter IX card says Yuna summons "so Zanmato hits the aeon", which is still true, but it also relies on her acting at once afterwards, which is not.
* `node tools/orphans.mjs`: 1,462 modules, 44 orphaned = the 18 unwired FFX-2 kernels + 24 from `origin/main` + **2 FFX kernels: `kernel/drops.ts` and `kernel/gear-drop.ts`** (item drops, Gillionaire, gear drops:
  rows R1 to R4, not built, rule 10; the per-boss loot records were never read). `kernel/aeon-stats.ts` is reached through `battle-save.ts` and **is not called by the engine**: the authored aeon rows
  already equal its output in 300 of 300 numbers (`parity-ffx-aeon-stats.test.ts`), the Sphere Grid bonus record and a battle counter do not exist in the engine. `kernel/ap-award.ts` is reached
  through the gauge kernel for Overdrive to AP only.

## 7. Measurement (the shipped `intendedStrategy`, whole chain, deterministic)

Harness: `tests/unit/ffx-parity-measure.test.ts` (the shipped `intendedStrategy` through each FFX chapter's whole chain). **Before = `919f2c78`** (the W2 base: its own 500-seed run, `D:\Tools\ffx-parity\rc2-w2\ffx-500-final.json`, and its 12-seed run
`ffx-12-merged.json`); **after = this branch**. "sd" is the standard deviation of the difference of two samples of 500 (real = beyond 3, borderline = 2 to 3). The last four columns are ablations: the branch with
**one row put back** by a temporary edit (restored byte for byte, SHA-1 checked), run on the same 500 seeds. "A3 back" = the old freeze and thaw of the party's counters when an aeon comes and goes (row A3, the summoner's
recovery); "A3+A4 back" adds the aeons' gear off (row A4); "aeon gauge off" and "party gauge off" switch the game's gain hooks off for aeons or for the party (a bound on how much the gauge matters, not the old numbers).
A dash is a run that was not needed.

**500 seeds** (wins of 500):

| Chapter | before | after | change | sd | party turns before -> after | party KOs before -> after | A3 back | A3+A4 back | A3 back, aeon gauge off | A3 back, party gauge off |
|---|---|---|---|---|---|---|---|---|---|---|
| I Seymour Flux | 499 | 493 | -6 | -2.1 borderline | 48.8 -> 48.4 | 0.5 -> 1.1 | 499 | - | - | - |
| II Yunalesca | 494 | 469 | -25 | -4.2 **real** | 164.5 -> 158.1 | 12.7 -> 13.2 | 487 | 486 | 481 | 492 |
| III Braska's Final Aeon | 478 | 475 | -3 | -0.4 | 244.1 -> 239.0 | 5.5 -> 5.5 | 474 | - | - | - |
| VII Anima and Macalania | 456 | 488 | +32 | +4.4 **real** | 59.4 -> 55.7 | 5.2 -> 4.6 | 469 | 469 | 490 | 466 |
| VIII Evrae | 490 | 489 | -1 | -0.2 | 72.4 -> 72.3 | 0.8 -> 0.8 | 489 | - | - | - |
| **IX Yojimbo** | 488 | **307** | **-181** | **-14.2 real** | 74.1 -> 67.9 | 4.8 -> 5.3 | **488** | - | - | - |
| X Seymour Natus | 302 | 342 | +40 | +2.6 borderline | 56.7 -> 51.7 | 5.4 -> 5.5 | 302 | 302 | - | - |
| XII Seymour Omnis | 423 | 423 | 0 | 0.0 | 102.7 -> 102.7 | 1.3 -> 1.3 | 423 | - | - | - |
| XIV Isaaru (3 links) | 431 | 440 | +9 | +0.8 | 28.7 -> 38.0 | 2.7 -> 3.0 | 464 | 464 | 15 | 464 |
| XVII Sin: Fins and Core | 446 | 434 | -12 | -1.2 | 330.0 -> 327.4 | 2.7 -> 2.8 | 434 | 434 | 434 | 453 |
| XVIII Sin: Face (the line is being reworked by another lane; reported only) | 7 | 6 | -1 | -0.3 | 57.3 -> 57.1 | 2.9 -> 2.9 | 6 | - | - | - |

**12 seeds** (wins of 12, before -> after; party turns; party KOs): I 12 -> 12 (48.6 -> 49.9; 0.4 -> 1.3), II 11 -> 12 (156.2 -> 163.5; 12.2 -> 14.6), III 11 -> 12 (228.2 -> 220.8; 6.3 -> 5.0), VII 12 -> 12 (61.2 -> 54.4; 4.8 -> 4.3),
VIII 11 -> 11 (71.9; 1.0), **IX 11 -> 6** (75.4 -> 67.8; 5.4 -> 5.7), X 9 -> 10 (58.3 -> 51.2; 5.6 -> 4.8), XII 10 -> 10 (99.2; 1.3), XIV 11 -> 11 (28.8 -> 38.8; 2.6 -> 3.0), XVII 10 -> 9 (328.1 -> 334.9; 2.8 -> 5.2), XVIII 0 -> 0.
The only row beyond the sampling band of 12 seeds is Chapter IX.

**Causes, by chapter** (every number is from the table above):

* **IX Yojimbo, 488 -> 307 of 500 (97.6 -> 61.4 percent): one row, A3, the summoner keeps the recovery of her Summon.** With A3 put back the branch wins 488, exactly the base number, and the party turns and KOs equal the base's. The shipped
  line (`engine/tactics/yojimbo-cavern.ts`) summons an aeon once his gauge reads 80 so that Zanmato hits the aeon, and the old thaw gave Yuna her counter from before the Summon, so she acted again at once to heal and revive; the game
  charges her the rank-3 recovery of the Summon (30 at Agility 20), so the party and Yojimbo's next turns come first. Neither the boss nor the party was touched; the line was built on the erased recovery (decision 1).
* **X Seymour Natus, 302 -> 342 (+2.6 sd, borderline), I Seymour Flux, 499 -> 493 (-2.1 sd): row A3 alone** (302 and 499 with A3 put back, the base numbers). Seymour Banishes the summoned aeon in both fights.
* **VII Anima and Macalania, 456 -> 488 (+4.4 sd): A3 is +19 (469 -> 488), the rest +13 (456 -> 469, 1.9 sd) is the gauge.** The aeons' gear changes nothing (469 with it off). With the aeons' gauge gains off the chapter wins 490, with the party's off 466:
  the Overdrives of Yuna's aeons are worth about 20 wins either way, so the +13 belongs to rows O1 and O3.
* **II Yunalesca, 494 -> 469 (-4.2 sd): A3 is -18 (487 -> 469), the rest -7 (494 -> 487, 1.1 sd) is noise** (the gear changes nothing: 486; the gauge switches span 481 to 492).
* **XIV Isaaru, 431 -> 440 (+0.8 sd, noise) hides two real effects that cancel: A3 is -24 (464 -> 440) and the aeons' gauge (row O3) is +33 (431 -> 464).** The duel is decided by aeon Overdrives (with the aeons' gain hooks off the chain wins 15 of 500); the game's gains
  (a 20-point bar, `((hp*16)/ref)/10+1` for a hit dealt, `base*18/maxHP+1` for a hit taken) give the aeons their Overdrive on other turns than the old five-times-the-percent did. The logs say the same (golden section 5, reason c: Mega Flare and Hellfire become Attack in links 2 and 3 on both seeds).
* **XVII Sin: Fins and Core, 446 -> 434 (-1.2 sd, noise):** not A3 (434), not the gear (434), not the aeons' gauge (434); with the party's gauge hooks off 453, so the party's side (rows O1, O2: the +1 and the Healer's missing HP). Inside the sampling band.
* III (-3), VIII (-1), XII (0) and XVIII (-1): noise. XII and VIII use no aeon; their logs differ only in gauge events.
* **The aeons' gear (row A4) moves no chapter** (A3+A4 back equals A3 back to within 1 win in every chapter run); the recovery counts (A2) were not ablated (inside a battle an aeon that fell was already gone, and a chain's carried HP of 0 kept it away before, so by construction they change no shipped chapter).
* Steal (S1) was not ablated: in the golden logs only Chapter VII's line steals (twice a fight on both seeds), and the first steal is certain under both schedules, so the schedule can differ only on a second steal (127/255 against 50 percent).

## 8. Full suite

One run of the whole unit suite (`--testTimeout=60000 --maxWorkers=4`, log `D:\Tools\ffx-parity\rc2-w5\fullsuite.log`) was started on the committed tree at 14:12 EDT. **The machine was saturated by other agents' runs (16 cores at 100 percent, about 90 node
processes) and the suite ran at 4 to 14 files a minute: **it had not finished when this note was written, and the lane stops at the push deadline**.** What it had reported: **409 of 1,016 files** (383 passed, 2 skipped, 24 failed).
The 21 art-only files this worktree always has (no `public/art`) are all among the failures and are the only ones expected: `ui-portrait-face-crop`, `trema-ship-content`, `art-ref-defaults`, `pause-remake`, `isaaru-ship`, `den-of-woe-ship-content`, `chapter-meta-seymour-anima-macalania`,
`chapter-meta-evrae`, `natus-ship-scene`, `natus-ship-content`, `leblanc-art`, `fallen-aeons-ship-content`, `chapter-meta-ffx2-leblanc`, `cutscene-story-poses`, `fallen-aeons-ship-scene`, `den-of-woe-ship-scene`, and five that fail on import for the missing `public/art/manifest.json`
(`party-face-manifest`, `chapters/yojimbo-content`, `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta`). **The three other failures so far:**

* `advisor-note` ("still says when to spend a revive it is holding back"): an existence check of a rare sentence (not traced to a regression of the advisor, but not shown to be none either). Its existence check reads the first twenty decisions of Chapter I seed 108 for the sentence "then raise"; the pin has moved with every
  batch that moved the draws (2026-09-19, 2026-10-09 AI-Seymour, 2026-10-10 W2). On this branch none of the seeds 1 to 700 shows the sentence (a scan, 20 decisions a seed). Four more scans, seeds 701 to 2300, finished with no hit either: **0 of 2,300 seeds** show it in their first twenty decisions (the base showed it on 3 of the first 700), so a re-pin to another seed is not available and the existence check needs another design (open item 10).
  **Open (see open item 10).** The rest of that file passes.
* `chapters/sin-fins-core-bench` ("the sensible line never leaves a dry Auron Defending"): a timeout under the load (60 s); run alone it passes (4 passed, 2 skipped).
* `live-url-follows-host` (one of 14 failed in the suite): nothing to do with a battle; run alone it passes (14 of 14), so it was the load too.

Evidence that does not depend on that run: `tsc --noEmit` clean; the 13 targeted files (the new engine-level tests, `ffx-aeons`, `ffx-engine-golden`, `chapters/macalania-engine`, `chapters/isaaru-bench`, the kernel files `parity-ffx-overdrive`, `parity-ffx-aeon-party`, `parity-ffx-steal-rewards`, `parity-ffx-aeon-stats`) pass, 174 tests;
and an earlier run of the **305 test files that mention aeons, Overdrive or Steal** (2026-10-10 13:07, the first W5 agent's tree plus the golden still on the old table): its only non-art failures were the golden (re-baselined since), `macalania-engine` A-8 (re-pinned since) and `isaaru-bench` (the `init` crash, fixed since; it passes).
The 12-seed measurement was re-run on the committed source and is byte-identical to the one measured before the commits.

## 9. Open items

1. **Chapter IX's line was designed around the bug** (decision 1 below). The shipped tactic summons an aeon "in front of Zanmato" and Yuna then acts at once; the game charges her the Summon's recovery.
2. **Overdrive to AP is not wired**: the gauge add converts the gain to AP in the kernel, but the engine has no AP ledger for it (the gauge stays still, as the game's does). No shipped build wears it.
3. **Not built, rule 10 (no shipped chapter uses them)**: Pilfer Gil, Nab Gil, Bribe (the data comment in `special-rikku.ts` still forgets the gil already paid), item drops with the game's two slots and the
   overkill list, Gillionaire, Double and Triple AP, gear drops; the Magus Sisters (three aeons at once, the joint Delta Attack, the revive of a fallen sister on dismiss).
4. **Per-boss loot records** (gil, AP, drop slots, steal chance and items) were never read; every FFX boss table still says "100 percent" for the byte 255.
5. **The Rook gain on a Reflect bounce** (`hit-apply.ts`: the reflecting target runs the outcome hook as a hit that a Shell, Protect or Nul turned aside) was read from the exe (VA 0x00789030) by the
   first W5 agent and was not re-verified here: the Ghidra servers were not running. No shipped build uses Rook.
6. **A Threaten user who threatened two monsters** (the engine allows it, the game's link byte holds one): the second monster's status ends at its own turn start, not at the summon.
7. **Revival's gauge gain**: Phoenix Down and Life run the Healer hook with the record's HP amount (the engine's restore of half the maximum HP when the record computes 0 is not shown to the hook).
8. **`frozenPartyCtb` and `aeonStoredGauge`** are dead runtime fields (section 6).
9. **No browser check** (no UI file changed; the worktree has no `public/art`): what a player sees is the Overdrive bars filling at other rates and an aeon's bar in steps of 5 percent (unchanged).
10. **`advisor-note.test.ts` ("still says when to spend a revive it is holding back") fails and a re-pin is not available** (section 8): its existence check reads Chapter I seed 108 for the sentence "then raise" in the first twenty decisions; on this branch **none of the seeds 1 to 2,300 shows it** (the base showed it on 3 of the first 700; the party falls more often now, 1.1 KOs a battle against 0.5, so the cause is not fewer bodies on the floor, and it was not traced). Either the existence check walks more decisions or reads a hand-built board, or the cause is found first (is the "party-wide payload next" reading now different when a summoned aeon stands in front of the party? the Banish is the first thing that happens in that fight). The rest of that file passes. Scratch for the scans: `D:Toolsfx-parityc2-w5advscan*.log`.
11. **The rest of the full suite** (section 8) was not finished; run it once on a quiet machine: `node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --testTimeout=60000 --maxWorkers=4`.

## 10. Decisions for Bailey

1. **Chapter IX's difficulty (the one real mover).** The game charges Yuna the full recovery of her Summon after the aeon leaves; our shipped Yojimbo line was built on the erased recovery and falls from 488 to 307 of 500
   (97.6 to 61.4 percent). Options: (A) **keep the game's rule and rework Chapter IX's own line and party preset in a separate batch**, the way Chapter XVIII is being reworked (boss numbers untouched, every value sourced; the line can
   keep the aeon in front of Zanmato but must pay for the Summon: heal before it, or summon earlier); (B) keep the game's rule and accept 61 percent for now; (C) put the old freeze and thaw back for the summoner only, which is not
   the game and is not recommended. **Recommendation: A.** Nothing was retuned.
2. **The same rule moves three other chapters** (Chapter VII +19, X +40, II -18 of 500 attributable to it; XIV -24 offset by the aeon gauge's +33). Nothing to decide unless you want those rates reviewed; they follow the game.
3. **Not built, rule 10** (no shipped chapter uses them): Pilfer Gil, Nab Gil, Bribe; the game's item drops (two slots, the overkill list), Gillionaire, Double and Triple AP, gear drops; the Magus Sisters. Build any of them? (Each needs a chapter that uses it; the per-boss
   loot records would need one more decompile pass first.)
4. **Overdrive to AP** converts the gain to AP in the game; the engine has no AP ledger for it, so the gauge only stays still. No build wears it. Say if a chapter ever should.
5. **Release note.** The crash fix in `FFXEngine.init` (a link that opens with a member under half HP) is a latent crash on the release line today (not seen in the base's own 500-seed runs, but reachable on any chain whose party arrives under half HP without the Critical status carried); it is worth carrying even if the rest waits.

## How to re-run

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/parity-ffx-engine-gauge.test.ts tests/unit/parity-ffx-engine-steal.test.ts tests/unit/parity-ffx-engine-aeons.test.ts tests/unit/ffx-engine-init-critical.test.ts tests/unit/ffx-aeons.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/parity-ffx-overdrive.test.ts tests/unit/parity-ffx-aeon-party.test.ts tests/unit/parity-ffx-steal-rewards.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_OUT=out12.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/ffx-parity-measure.test.ts                                            # 12 seeds, about 25 s
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=out500.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --testTimeout=3000000 tests/unit/ffx-parity-measure.test.ts   # 500 seeds, about 13 minutes
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_CHAPTERS=sin-face PYREFLY_MEASURE_OUT=ch18.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --testTimeout=3000000 tests/unit/ffx-parity-measure.test.ts   # one chapter
node tools/orphans.mjs
```

The base table is `D:\Tools\ffx-parity\rc2-w2\ffx-500-final.json` (919f2c78, seeds 1-500) and `ffx-12-merged.json`; this branch's tables are `D:\Tools\ffx-parity\rc2-w5\ffx-500-w5-a.json` and `ffx-12-w5.json`; the
ablation tables are `abl-*.json` in the same folder, and the base and W5 per-link logs (34 files each) are `logs-old` and `logs-new`.

NOW.md, CHANGELOG.md, ACTIONS and DECISIONS are left to the main session.

## What the player sees (plain words, for the CHANGELOG entry of the release that carries this)

**FFX, every chapter (W5): the Overdrive bars, the aeons and Steal follow the game.** Every hit now adds at least one point to an Overdrive bar and the game works the rest out by dividing first, a healer's bar counts only the hit points actually restored, Shield stops a bar from
filling and Boost doubles it on anyone, and an aeon's bar is a short one of twenty that fills in steps of five percent with the game's own gains. When an aeon leaves, Yuna still owes the recovery of her Summon, so she no longer acts the instant it goes. A fallen aeon stays
away as long as the game keeps it away (Valefor 8 battles, Ifrit 12, Ixion and Shiva 20, Bahamut, Anima and Yojimbo 24, each Magus Sister 30) and returns at full health. Aeons wear the gear the game gives them: a little more chance to land a critical hit, Pierce on all but
Valefor, and Bahamut, Anima and the Magus Sisters can pass the damage limit. Stealing uses the game's odds: each steal from a monster is about half as likely as the one before but never impossible. **Chapter IX (Yojimbo) is much harder**: Yuna can no longer summon an aeon in
front of Zanmato and heal in the same breath, and the shipped line wins 307 of 500 seeds where it won 488. Chapters VII and X are somewhat easier and Chapter II somewhat harder for the same reason; the other chapters stay inside the sampling band. A battle that begins with a
hurt party member no longer stops the game.
