# Re-parity W5: the FFX Overdrive gauge, the aeons and Steal follow the game's code

Status: **finished, committed and pushed on branch `re-parity-w5` (from `origin/re-parity-w2` `919f2c78`, 2026-10-10 to 11): the gauge, Steal and aeons batch (sections 1 to 7), Bailey's Chapter IX answer (the line reworked, section 11), the advisor-note pin traced and settled (section 11.1) and the final suite and 500-seed table (sections 8 and 11.5); not merged into another branch, not deployed.** Track `re-parity`
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
| `2bcc6af1`, `e5ab3a7e` | The first agent's closing notes: the suite state at its push deadline and what the seed scans showed (FFX only; records only) |
| `7a6db80d` | **Chapter IX (Yojimbo): Yuna calls the aeon when his gauge reads 96, before any revive or heal**, now that the summoner keeps her Summon's recovery (Bailey's pick "Keep 1:1, rework our line"); the tactic, its guide rule and hint, the bench's mirror, the golden for yojimbo-cavern#1, `re-parity-w5-yojimbo-line.test.ts` (FFX only) |
| `1d94781e` | advisor-note: the timing sentence's existence check reads seed 184's first 34 decisions and the sentence is pinned on a board built from a real opening; the cause of the lost pin is row A3 (FFX only; tests) |
| the commits after `1d94781e` (this session, W5-FINISH) | the Chapter IX candidate ladder as a committed measurement harness (`re-parity-w5-yojimbo-ladder.test.ts`), the dated updates in the two Jegged notes, the tactic's final ladder numbers, and this note (sections 8, 9, 10, 11 and the changelog paragraph rewritten) (FFX only) |

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

**This is the first W5 measurement, taken before Chapter IX's line was reworked (its "after" is the line that shipped at `919f2c78`, which the game's rule broke).** Section 11.5 repeats the 500-seed run on the final tree: every row below is
identical to the seed except Chapter IX, which reads 495 of 500 with the reworked line. Read this section for the causes of the other chapters' moves; read 11.5 for the final numbers.

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

**Final run (2026-10-11, W5-FINISH): one run of the whole unit suite on the committed tree, `--maxWorkers=4 --testTimeout=120000`, log `D:\Tools\ffx-parity\rc3-w5b\fullsuite.log`: 1,022 files; 992 passed, 9 skipped, 21 failed; 15,196 tests passed, 181 failed, 103 skipped, 1 todo.**
**The 21 failed files are the 21 art-only files this worktree always has (no `public/art`) and nothing else**, the same set the first agent listed: `ui-portrait-face-crop` (145 of its 152 tests), `trema-ship-content`, `art-ref-defaults`, `pause-remake` (it names `/art/backdrops/gagazet.png`, "does not resolve under public/"),
`chapters/isaaru-ship`, `chapters/den-of-woe-ship-content`, `chapter-meta-seymour-anima-macalania`, `chapter-meta-evrae`, `chapters/natus-ship-scene`, `chapters/natus-ship-content`, `chapters/leblanc-art`, `chapters/fallen-aeons-ship-content`, `chapter-meta-ffx2-leblanc`, `cutscene-story-poses`,
`chapters/fallen-aeons-ship-scene`, `chapters/den-of-woe-ship-scene`, and the five that fail on import for the missing `public/art/manifest.json` (`party-face-manifest`, `chapters/yojimbo-content`, `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta`). Not fixed, by rule.

What the first agent's partial run (409 of 1,016 files, a saturated machine) had left open now passes: `advisor-note` (27 of 27, section 11.1), `chapters/sin-fins-core-bench` (6 tests, 2 skipped) and `live-url-follows-host` (14 of 14) were load timeouts and a pin, not defects. In the same run: `ffx-engine-golden` 18 of 18 (one digest re-baselined for Chapter IX's line,
section 11.4; the first W5 re-baseline is section 5), `ffx2-atb-golden` 6 of 6 and `ff7-golden` 3 of 3 **unchanged**, `chapters/yojimbo-bench` 3 of 3 (intended line 196 of 200), `re-parity-w5-yojimbo-line` 4 of 4, and the new ladder harness is skipped without `PYREFLY_MEASURE=1` (9 skipped files in all).

Other checks on the final tree: `tsc --noEmit` clean; `node tools/orphans.mjs`: 1,462 modules, 44 orphaned, the same 44 as before this lane (the 18 unwired FFX-2 kernels, 24 from `origin/main`, the 2 FFX kernels `drops.ts` and `gear-drop.ts`); no source file over 400 lines was added (the new file is a test).

Evidence that does not depend on the full run: the 13 targeted W5 files (the new engine-level tests, `ffx-aeons`, `ffx-engine-golden`, `chapters/macalania-engine`, `chapters/isaaru-bench`, the kernel files `parity-ffx-overdrive`, `parity-ffx-aeon-party`, `parity-ffx-steal-rewards`, `parity-ffx-aeon-stats`) passed, 174 tests, before the Chapter IX work; and the nine Chapter IX files
(`re-parity-w5-yojimbo-line`, `chapters/yojimbo-bench`, `-engine`, `-repair`, `-secret-objective`, `-callouts`, `re-parity-ai-yojimbo`, `presenter-recall-yojimbo`, `ffx-engine-golden`) passed alone, 113 tests, on 2026-10-11 01:59.

## 9. Open items

1. **Chapter IX's line was designed around the bug: DONE (section 11).** Bailey chose "Keep 1:1, rework our line"; the line now calls the aeon at gauge 96, first among Yuna's choices, and wins 495 of 500 (491 on the holdout). Open there: the 96 is derived and measured (a plateau of 94 to 98), not a source's number.
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
10. **`advisor-note.test.ts`: DONE (section 11.1).** The cause is row A3 (the old thaw put back alone restores the sentence on 6 of seeds 1 to 700); the advisor did not change; the sentence is still reached under the game's rules (seed 184, decision 30). The existence check reads that seed's first 34 decisions and two new tests pin the card on a hand-built board.
    Still open: the seed walk is a draw and will need a re-pin again after the next batch that moves the draws (the board tests are the stable pin).
11. **The full suite: DONE (section 8).** One run, `--maxWorkers=4`, on the committed tree.
12. **Chapter IX candidates D and E (Protect, Haste) are not shipped** (section 11.3): they win 500 of 500 but add casts no source asks for, and Haste makes the fight a stomp. They stay in the committed harness (`re-parity-w5-yojimbo-ladder.test.ts`).

## 10. Decisions for Bailey

1. **Chapter IX's difficulty: ANSWERED by Bailey, built (section 11).** The game charges Yuna the full recovery of her Summon after the aeon leaves; the old Yojimbo line fell from 488 to 307 of 500. His pick: "Keep 1:1, rework our line (Recommended)". Done: the line calls the aeon at gauge 96, before any revive or heal;
   495 of 500 (99.0 percent), holdout 491 (98.2 percent), 12 of 12; Yojimbo, his odds, the party and row A3 untouched. Nothing for him to decide unless he wants the candidates D and E (item 5 below).
1a. **The 96.** It is the best rung of a measured ladder and a number derived from the game's script (Zanmato fires on a turn that starts at 100; his turn adds 2), not a source's: no guide gives a gauge to summon at. The plateau is 94 to 98 (470 to 495 of 500). If he prefers the principled CTB-forecast version (485 and 483), it is one change (candidate B).
1b. **Is 99 percent the right difficulty?** Before W5 the chapter won 488 of 500 (97.6 percent); the reworked line is the same to within the sampling band and a little easier at the margin. Nothing was tuned toward a rate. If he wants it harder or easier, the party preset is the lever, and that is his call.
2. **The same rule moves three other chapters** (Chapter VII +19, X +40, II -18 of 500 attributable to it; XIV -24 offset by the aeon gauge's +33). Nothing to decide unless you want those rates reviewed; they follow the game.
3. **Not built, rule 10** (no shipped chapter uses them): Pilfer Gil, Nab Gil, Bribe; the game's item drops (two slots, the overkill list), Gillionaire, Double and Triple AP, gear drops; the Magus Sisters. Build any of them? (Each needs a chapter that uses it; the per-boss
   loot records would need one more decompile pass first.)
4. **Overdrive to AP** converts the gain to AP in the game; the engine has no AP ledger for it, so the gauge only stays still. No build wears it. Say if a chapter ever should.
5. **Release note.** The crash fix in `FFXEngine.init` (a link that opens with a member under half HP) is a latent crash on the release line today (not seen in the base's own 500-seed runs, but reachable on any chain whose party arrives under half HP without the Critical status carried); it is worth carrying even if the rest waits.
6. **advisor-note's seed walk (section 11.1)** is still a draw (seed 184, 34 decisions) and has been re-pinned six times; the two board tests beside it do not depend on a draw. Keep re-pinning it after each batch that moves the draws, or retire the walk once the RNG-streams batch lands and leave the board tests as the pin? Recommendation: keep it until that batch, then retire it if it moves.

## 11. W5-FINISH (2026-10-11): the advisor-note pin, Chapter IX's line, the final suite and table

Bailey's answer of 2026-10-10 about 17:00 EDT to the main session (his question and pick, verbatim): "The Overdrive/aeon batch (W5) is built. One game rule in it, 'the summoner keeps her Summon's recovery when an aeon leaves', drops Chapter IX (Yojimbo)
from 488 to 307 wins in 500. Our suggested line summons an aeon right before Zanmato and relied on the old, wrong reset. What should happen?" -- **"Keep 1:1, rework our line (Recommended)"**, whose description reads: "Ship the game's rule, then rework our
Chapter IX strategy line, as with Chapter XVIII. Yojimbo's numbers stay real." This section is that rework. **Game case: FFX only** (Chapter IX is FFX's CTB fight; the FFX-2 Yojimbo is a different fight). Yojimbo's script, odds, enemy data, row A3 and the party preset are untouched.

### 11.1 advisor-note: why the sentence vanished, and where it stands now

The check "still says when to spend a revive it is holding back" (`tests/unit/advisor-note.test.ts`) looks for one sentence of the move advisor's card in Chapter I (Seymour Flux): "Ready To Annihilate lands first - take the hit, then raise Tidus". It found it on 0 of 2,300 seeds after this batch.
Traced with the engine (hard rule 3), not by reading code:

* **The row is A3 and nothing else.** Putting the old thaw back alone (the summoner's recovery erased, every other W5 row on) restores the sentence on 6 of seeds 1 to 700 (108, 110, 277, 306, 325, 615, each at decision 18; the base `919f2c78` showed it on 3 of the first 700); the game's rule shows it on **0 of 2,300** in the first twenty decisions
  (`D:\Tools\ffx-parity\rc3-w5\gated-a3back-1-700.txt`, `D:\Tools\ffx-parity\rc2-w5\advscan-*.log`).
* **How, on seed 108** (`D:\Tools\ffx-parity\rc3-w5\trace108-now.txt` against `trace108-a3back.txt`, decision by decision with the card's note): both runs are the same for four decisions. At the fifth, with the old thaw Yuna acts again at once after Bahamut leaves (she calls Valefor and then Ifrit back to back); with the game's rule she
  is charged her Summon's recovery and Tidus acts. Seymour's second cycle then starts one decision earlier (17, not 18), and **Tidus is on the floor at the payload's turn only in the old run**. The sentence needs two things at once: the payload's `charge` event ("Ready To Annihilate") in the log, and a body on the floor who is not a Zombie
  (the card's Zombie reading comes first by design; Kimahri is a Zombie on the floor in this seed all along). Row A3 changes who acts after an aeon leaves, so it changes who is down when the payload comes.
* **The advisor did not change, and it is not broken.** Its threshold, its reading of the log and its sentence are as they were; the engine's run of the fight is what moved. The sentence is **still reachable under the game's rules**: over seeds 1 to 400 and sixty decisions it appears once, on **seed 184 at its 30th decision** (`gated-now-1-400.txt`), and the test passes on that seed today.
  So there was nothing to fix in the advisor and nothing to delete; two things were done to the test (commit `1d94781e`):
  1. the existence check now reads **seed 184's first 34 decisions** (it was seed 108's first 20) and still asserts the note appears and that no decision in the walk breaks the advisor's rule;
  2. the same behaviour is pinned **on a board that depends on no draw**: a real opening decision of Chapter I (real party, menus and log), cloned, one member who is neither the actor nor Yuna put on the floor, the log made to carry the payload's `charge` event; the card must say "take the hit, then raise <name>", and on the same board without the charge it must not. Two tests, up to eight seeds' openings each.
* **A caution that stays open:** the walk on seed 184 is still a draw. It has been re-pinned after every batch that moved the draws (six times now); the next such batch (for example the RNG-streams batch) will probably move it again. The hand-built board is the stable pin; if the walk moves again, re-pin it from a scan in the same way or retire it in favour of the board.
  I re-ran `advisor-note.test.ts` on this tree (27 of 27 pass). I did not repeat the 700-seed and 2,300-seed scans (each is 20 to 30 minutes on this machine); I read the saved traces and logs and checked the facts above against them.

### 11.2 Chapter IX: the diagnosis, on real seeds

Chapter IX on the first W5 tree: **307 of 500** (488 at `919f2c78`; with row A3 put back alone 488 again, so the whole drop is that one row). The old line: Lulu casts Fira, the others defend, Yuna revives, then heals anyone under
45 percent, and **only when she has neither to do** calls an aeon once his gauge reads 80 or more. Traces of seeds 2 and 4 with that line (turn by turn: the party's HP, his gauge, who acted, every attack he made; `D:\Tools\ffx-parity\rc3-w5b\trace6.base.trace.txt`) show the two shapes of a loss:

* **Seed 4 (wins at `919f2c78`, loses now): the aeon falls before Zanmato and Yuna is still in her recovery.** Yuna calls Bahamut at gauge 83. He stands through five of Yojimbo's turns (gauge 83 to 93; the hits on him are 419, 408, 1,371, 386 and 1,387, about 4,000 in all) and falls to a Wakizashi at 93. Ten of his turns lie between a gauge of 80 and
  Zanmato, and an aeon does not last them. In the old engine Yuna then acted at once and called the next one; in the game she is charged the Summon's recovery, so her next turn comes **eight party turns after the Summon**, at gauge 98, with Yuna at 42 percent HP: the old order puts the Cura first, and Zanmato meets an open party with Yojimbo at 2,475 HP.
* **Seed 2 (loses at `919f2c78` too): the summon is never reached.** From gauge 80 on, every turn of Yuna's goes to a Cura or a Phoenix Down (gauge 80, 87, 89, 99); the summon is the last item of her list, and Zanmato meets an open party with Yojimbo at 412 HP. This shape was already in the base; the new rule makes the first shape common.
* **The tally over 500 seeds (the old line on the first W5 tree)**: 193 losses, and **all 193 have a Zanmato on an open party**; per seed 1.0 summons, 0.9 aeons that fell (0.3 of them to Zanmato itself, so 0.6 before it), 0.2 re-summons, 0.3 Zanmatos absorbed by an aeon against 0.4 that met an open party. 5.3 party KOs and 67.9 party turns a fight.
* So the fault is the line's: it chose a gauge (80, research 4.1's "heightened" band, which is the band of his odds and not the clock of Zanmato) that is too early for an aeon that cannot be replaced, and it ranked the summon below the heal and the revive. Nothing about the boss was wrong.

### 11.3 The candidates (all lines of ours; all measured on this tree: 12 seeds, 500 seeds (1 to 500) and the holdout (501 to 1000))

Every row plays Chapter IX from `setupForChapter` with the stated Yuna line (Lulu, Kimahri and the aeon as before). The harness is committed: `tests/unit/re-parity-w5-yojimbo-ladder.test.ts`, run with `PYREFLY_MEASURE=1` (section 11.7). It reproduces the scratch lab that produced the first numbers seed for seed (the per-seed strings of all 14 lines at 12 seeds are equal; `old`, `t96` and `shipped` at 500 and at the
holdout equal the lab's 307, 495 and 304, 491), and its `shipped` line (the real `intendedStrategy`) equals `t96` seed for seed at 12, 500 and the holdout. "Open Zanmato" is a loss whose Zanmato met no aeon.

| Candidate | 12 | 500 | holdout | party turns | party KOs | losses with an open Zanmato (of losses), 500 |
|---|---:|---:|---:|---:|---:|---:|
| **old: the aeon at 80, after the revive and the heal** (the line as it was) | 6 | 307 | 304 | 67.9 | 5.3 | 193 of 193 |
| **A. the aeon at 96, first among Yuna's choices (SHIPPED)** | **12** | **495** | **491** | 67.8 | 4.0 | 5 of 5 |
| B. the aeon by the CTB forecast: from gauge 90, on the first Yuna turn after which Zanmato would come before her next one | 12 | 485 | 483 | 67.7 | 4.1 | 15 of 15 |
| C. the aeon at 96, but after the revive and the heal (the old order) | 11 | 441 | 442 | 66.6 | 4.0 | 59 of 59 |
| D. A, and Yuna casts Protect on Lulu, Yuna, Kimahri while she has nothing else to do | 12 | 500 | 500 | 63.8 | 0.7 | 0 |
| E. A, and Yuna casts Haste on Lulu while she lacks it | 12 | 500 | 500 | 40.5 | 1.2 | 0 |

The threshold ladder of A's rule (the aeon at that gauge or above, first among her choices):

| Gauge | 90 | 92 | 94 | 95 | **96** | 97 | 98 | 99 | 100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 12 seeds | 9 | 10 | 12 | 12 | **12** | 12 | 12 | 12 | 11 |
| 500 seeds | 352 | 427 | 480 | 491 | **495** | 483 | 479 | 462 | 458 |
| holdout | 366 | 411 | 470 | 479 | **491** | 482 | 480 | 465 | 455 |

Reading it:

* **The order matters as much as the gauge.** Calling the same 96 after the heal (C) wins 441, first wins 495: the window is one Yuna turn wide and a Cura spent in it leaves the party in front of Zanmato (seed 2's shape).
* **The gauge has a window, not a cliff.** While an aeon stands only the aeon and Yojimbo act, so the gauge climbs 2 a turn: from 96 Zanmato is two ordinary turns away (96, 98, 100, then Zanmato), well inside what Bahamut lasts; from 90 it is five, which is about what he lasts (on the rungs 90 and 92, 0.2 and 0.1 aeons a seed fall before Zanmato, against none on 96); from 99 or 100 Yuna's turn often does not
  fall in the window at all (38 and 42 of the losses are open Zanmatos). The rungs 94 to 98 win 470 to 495 of 500 across both ranges. **96 is the best rung in both ranges, and the margin over its neighbours (95 is 491 and 479; 97 is 483 and 482) is about the width of the sampling band, so read it as "the plateau is 94 to 98", not "96 is exact".**
* **B, the principled version, loses to the plain rung** (485 and 483): the forecast adds his 2 and Lulu's 3 only, and it summons as early as 90 when Yuna's own next turn would be too late, which is the early side of the window. It is more code, and the plain rung asks the player nothing more than reading a number on the gauge widget.
* **D and E are not shipped.** They win every seed, but they add casts of ours that no source asks for (Jegged has no battle advice for this fight; the research asks for a race, spells and an aeon), and Haste halves the fight (40 party turns), which turns the chapter into a stomp. The aim is a fair, winnable chapter, not a perfect one. They stay in the harness as the upper bound of what the party can do.
* **A is the smallest change that fixes both shapes of a loss**: one threshold and one place in a list. Before W5 the chapter won 488 of 500 (97.6 percent); the reworked line wins 495 and 491 (99.0 and 98.2 percent): the same difficulty to within the sampling band, a little easier at the margin, with 4.0 party KOs a fight against 4.8.

### 11.4 What ships (the tactic, the card, the guide, the bench)

* `src/engine/tactics/yojimbo-cavern.ts`: Yuna's first choice is an aeon (Bahamut first, then Ifrit, Ixion, Shiva, Valefor) when his gauge reads 96 or more; then revive, heal under 45 percent, Doom if the menu has it, Lulu's Fira, everyone else defends; an aeon on the field defends. `SUMMON_AT_GAUGE = 96`. The header says which parts are sourced and which are derived.
* **Sources for each step**: the aeon in front of Zanmato is strategy 3 of `research/ffx-yojimbo.md` 5.3 (wiki and GameFAQs, verified 2 sources; Jegged's one battle sentence is "use Yuna's Aeons"); Zanmato on a turn that starts at 100, +2 on his own turn and +3 on each action aimed at him are the game's script
  (`research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` 3.2 and 3.3, `research/ffx-yojimbo.md` 4.1); the Summon's recovery is `research/re-ffx-overdrive-steal-aeons.md` 4.7 and row A3. **The number 96 itself is derived and measured, not a source's**: no guide gives a gauge to summon at (Jegged does not mention the gauge at all; the wiki and GameFAQs notes say only to put
  an aeon in front of Zanmato; a web search on 2026-10-11 found the same general advice and no timing). It is our adaptation, and the guide cites the script, not a guide. That is why the plateau is reported above.
* **The advisor card** reads the guide: `src/data/guides/yojimbo-cavern.ts`. Rule 4 (was "Once his gauge is high, put an aeon in front of him. Zanmato then hits the aeon, not the party.") now reads: "Call the aeon late. At 100 he uses Zanmato and an aeon in front of him takes it in place of the party, but until then every attack he makes lands on the aeon, so Yuna calls one only when his gauge reaches 96. She waits a long time afterwards, so have the party healed before then." (short: "Gauge 96: call an aeon to take Zanmato"; cite `ffx-yojimbo 3.3, 4.1, 5.3 row 3`, and the Summon's cost `re-ffx-overdrive-steal-aeons 4.7`). The Summon hint now says "His gauge is at 96 or more, a turn and a cast from full: an aeon on the field takes Zanmato in place of the party". The walkthrough page and the chapter card say only "have an aeon out by then" and stay true.
  The two Jegged notes (`research/jegged-encounter-guides-ffx-a.md`, `-b.md`) carry a dated update that the line moved from 80 to 96 and why.
* `tests/unit/chapters/yojimbo-bench.test.ts` mirrors the line (196 of 200 on its 200 seeds, 98.0 percent); `tests/unit/re-parity-w5-yojimbo-line.test.ts` pins the order (95 raises, 96 and above summon, a body on the floor does not hold it back), the new line against the old line frozen in the test (24 seeds), and the guide's words.
* **`ffx-engine-golden`: one digest moved because of this line, `yojimbo-cavern#1` 7681d4e3 -> 28996218** (the logs of the old and new line are identical for 519 events; at event 520 the old line calls Bahamut at gauge 93 and the new one defends; the new line never summons on this seed because Yojimbo falls before 96, and both are victories, 577 and 560 events). `yojimbo-cavern#7` keeps its digest (neither line summons), and no other
  chapter's line changed. `ffx2-atb-golden` and `ff7-golden` are unchanged (section 11.6). Evidence: `D:\Tools\ffx-parity\rc3-w5\ch9-golden-diff.txt`.

### 11.5 The final tree, 500 seeds and 12 seeds, every FFX chapter (the shipped `intendedStrategy`, the whole chain)

Before = `919f2c78` (`D:\Tools\ffx-parity\rc2-w2\ffx-500-final.json`, `ffx-12-merged.json`); after = this branch's tip (`D:\Tools\ffx-parity\rc3-w5b\ffx-500-final.json`, `ffx-12-final.json`). "sd" is the standard deviation of the difference of two samples of 500 (real = beyond 3, borderline = 2 to 3). **Every row except Chapter IX is identical, seed for seed and in its turn
and KO means, to the first W5 run of section 7** (checked mechanically: the per-seed strings and the means are equal), so the causes of section 7 stand and are not repeated in full here.

| Chapter | 500 seeds: before -> after | change | sd | party turns before -> after | party KOs before -> after | 12 seeds before -> after | cause (section 7) |
|---|---|---:|---:|---|---|---|---|
| I Seymour Flux | 499 -> 493 | -6 | -2.1 borderline | 48.8 -> 48.4 | 0.5 -> 1.1 | 12 -> 12 | row A3 alone (Seymour Banishes the summoned aeon) |
| II Yunalesca | 494 -> 469 | -25 | -4.2 **real** | 164.5 -> 158.1 | 12.7 -> 13.2 | 11 -> 12 | row A3 -18, the rest noise |
| III Braska's Final Aeon | 478 -> 475 | -3 | -0.4 | 244.1 -> 239.0 | 5.5 -> 5.5 | 11 -> 12 | noise |
| VII Anima and Macalania | 456 -> 488 | +32 | +4.4 **real** | 59.4 -> 55.7 | 5.2 -> 4.6 | 12 -> 12 | row A3 +19, the aeons' Overdrive gains +13 |
| VIII Evrae | 490 -> 489 | -1 | -0.2 | 72.4 -> 72.3 | 0.8 -> 0.8 | 11 -> 11 | noise (no aeon; only gauge events differ) |
| **IX Yojimbo** | **488 -> 495** | **+7** | +1.7 | 74.1 -> 67.8 | 4.8 -> 4.0 | 11 -> 12 | **row A3 took it to 307; the reworked line brings it to 495** (11.2 to 11.4) |
| X Seymour Natus | 302 -> 342 | +40 | +2.6 borderline | 56.7 -> 51.7 | 5.4 -> 5.5 | 9 -> 10 | row A3 alone |
| XII Seymour Omnis | 423 -> 423 | 0 | 0.0 | 102.7 -> 102.7 | 1.3 -> 1.3 | 10 -> 10 | none (no aeon) |
| XIV Isaaru (3 links) | 431 -> 440 | +9 | +0.8 | 28.7 -> 38.0 | 2.7 -> 3.0 | 11 -> 11 | two real effects that cancel: A3 -24, the aeons' gauge +33 |
| XVII Sin: Fins and Core | 446 -> 434 | -12 | -1.2 | 330.0 -> 327.4 | 2.7 -> 2.8 | 10 -> 9 | noise (the party's gauge side) |
| XVIII Sin: Face (reworked on `re-parity-ch18`; reported only) | 7 -> 6 | -1 | -0.3 | 57.3 -> 57.1 | 2.9 -> 2.9 | 0 -> 0 | noise; the line is the other branch's |

The 12-seed row of Chapter IX (12 of 12, 67.5 party turns, 3.8 KOs) equals the committed ladder's `shipped` line at 12 seeds. The holdout of the real line (501 to 1000) reads 491.

### 11.6 The final suite and the other checks

One run of the whole unit suite, once, at the end, on the committed tree: **992 of 1,022 files pass, 9 are skipped (the env-gated measurement harnesses), and the 21 that fail are exactly the 21 art-only files** (no `public/art` in a worktree). The list, the counts and what else was checked (tsc, orphans, the three goldens, the Chapter IX files) are section 8.
`ffx-engine-golden` moved one digest, `yojimbo-cavern#1`, because of the line (explained in 11.4); `ffx2-atb-golden` and `ff7-golden` did not move. The measurement of every FFX chapter on the final tree, 500 and 12 seeds, is 11.5 above.

### 11.7 Re-running the Chapter IX candidates

```
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500   PYREFLY_YOJIMBO_LINES=old,t96,queue,t96late,t96Protect,t96Haste PYREFLY_MEASURE_OUT=ch9-500.json  node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 --testTimeout=3000000 tests/unit/re-parity-w5-yojimbo-ladder.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=501-1000 PYREFLY_YOJIMBO_LINES=old,t96,shipped                          PYREFLY_MEASURE_OUT=ch9-hold.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 --testTimeout=3000000 tests/unit/re-parity-w5-yojimbo-ladder.test.ts
```

Each line takes about 2 to 6 minutes for 500 seeds on a quiet machine. The tables of this section are in `D:\Tools\ffx-parity\rc3-w5b\` (`cand-12`, `cand-500`, `cand-hold`, `ladder-test-*`, `ffx-500-final.json`, `ffx-12-final.json`) and, for the rungs measured earlier by the first agent, `D:\Tools\ffx-parity\rc3-w5\ch9-*.log`; the scratch lab that produced them first is in `D:\Tools\ffx-parity\rc3-w5\lab\` (outside the repository).


## How to re-run

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/parity-ffx-engine-gauge.test.ts tests/unit/parity-ffx-engine-steal.test.ts tests/unit/parity-ffx-engine-aeons.test.ts tests/unit/ffx-engine-init-critical.test.ts tests/unit/ffx-aeons.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/parity-ffx-overdrive.test.ts tests/unit/parity-ffx-aeon-party.test.ts tests/unit/parity-ffx-steal-rewards.test.ts tests/unit/re-parity-w5-yojimbo-line.test.ts tests/unit/chapters/yojimbo-bench.test.ts tests/unit/advisor-note.test.ts
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
Valefor, and Bahamut, Anima and the Magus Sisters can pass the damage limit. Stealing uses the game's odds: each steal from a monster is about half as likely as the one before but never impossible. **Chapter IX (Yojimbo) is as hard as it was, but plays differently**: Yuna can no longer summon an aeon in front of Zanmato and heal in the same breath, because the Summon now costs her the recovery the game gives it. The advice for the fight changed to match: call the aeon late, when his gauge reaches 96, and have the party healed first; the guide and the advisor card say so. The reworked line wins 495 of 500 test fights (the old line, with the new rule, would have won 307; before the rule it won 488). Chapters VII and X are somewhat easier and Chapter II somewhat harder for the same reason; the other chapters stay inside the sampling band. A battle that begins with a
hurt party member no longer stops the game.
