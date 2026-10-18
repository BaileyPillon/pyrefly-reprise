# Paper preflight — RE parity RC10, FFX monster scripts that call `setCommandDisabled` (follows the Isaaru-commands lane)

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths src/battle/ffx/formation-commands.ts,src/battle/ffx/aeons.ts,src/battle/ffx/aeon-duel.ts,src/battle/ffx/adapt/aeon-party.ts,src/data/ffx/enemies/braskas-final-aeon.ts,src/battle/common/types.ts,src/battle/ffx/engine.ts`
> classes this as **DEEP** (FFX CTB engine, FFX game data and the shared combat core are shared systems).
>
> **Owner's words.** 2026-10-08 "It needs to be a 1:1 parity." 2026-10-17, about Isaaru's duels only: "Match the game (Recommended)". That decision covered only Isaaru's duels, so every other script lock is built **behind a switch that defaults OFF**, measured, and put to Bailey.
>
> **Verdict: PROCEED, switch OFF.** With the switch off no battle changes by a byte (proved by the 12-seed digests of every FFX chapter against the base, and by the goldens). Branch `re-parity-rc10-ffx-script-command-locks`, built on `re-parity-rc10-ffx-isaaru-commands` (`fc74d1240`), whose `formation-commands.ts` it extends. Nothing deploys without the release driver.

Written 2026-10-18 by the lane (a Sonnet sub-agent of the RE parity session), before the first commit of code.

## 1. Game case (AGENTS.md rule 14)

**FFX only.** The calls are in FFX monster scripts (`m101` ... `m256`, read from the install's own files; handler `FFX.exe` 0x007A6EF0, setter 0x0079B470, the aeon gate 0x0079A080). FFX-2 has its own exe and script machine and none of it is read. `src/battle/ffx2`, `src/data/ffx2` and `src/audio` are untouched; `ffx2-atb-golden` and `ff7-golden` stay byte-identical.

## 2. What the data read found

A raw scan of all 361 monster files for script call 0x703B (the same style as the formation scan: the three constants pushed before the call) finds exactly **18 files** and 1, 2, 6, 12 or 33 calls each, equal to the saved-disassembly name search: m101 Tros, m109 Geosgaeno, m123 Negator, m163 to m169 (the possessed Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo), m178 to m180 (the Magus Sisters), m211, m251 to m253 and m256 (Mimics).
A scan of the formation chunk (8 monster slots) of all **863** battle files, for which fight holds each of the 18 monsters, shows that **only the possessed aeons and the Sisters are fought by a shipped chapter** (`sins07_00` to `sins07_07`: Chapter III and the hidden Chapter 28). Tros (`cdsp07_00`), Geosgaeno (`bjyt02_01`, `_02`), Negator (`maca02_00`), m211 (`bika02_11` to `_13`, `genk16_00` to `_02`, `omeg00_12` to `_16`, `omeg01_06`) and the Mimics (`omeg00_13` to `_16`) are in no formation of our chapters. They are listed in the handoff, not built.

The ten reached scripts each make **one** call, in their init hook (before the first turn): `setCommandDisabled(1, <8 to 17>, 0)`: an id below 0x1000, flag 0. The setter's other branch (0x0079B470, `id >> 12 == 0`) writes the flag into the byte at +0xDD4 of the aeon's own character (`pp_BtlGetChr(id)`; the actor argument is not read). 0x0079A080 (the summon menu's gate, `aeonUnavailable` in `kernel/aeon-party.ts`) reads that byte: **0 makes the aeon unusable**. So each possessed copy takes its own aeon away from Yuna for its whole battle (Valefor 8, Ifrit 9, Ixion 10, Shiva 11, Bahamut 12, Anima 13, Yojimbo 14, Cindy 15, Sandy 16, Mindy 17).

## 3. What the engine does today (read before building)

- **The hidden Last Summoning (Chapter 28): already modelled.** Every link's group carries `lockedAeons` for every aeon given up so far, its own included, with the words "Taken by Yu Yevon" (`data/ffx/enemies/last-summoning-chain.ts` `locksFor`). The engine greys the Summon row. Nothing to build; the switch must not touch it (it would hide a row that row greys).
- **Chapter III (the fixed seven links: Final Aeon, the five possessed aeons, Yu Yevon): not modelled.** `possessedAeonBattle` sets no lock, so with her own Valefor standing Yuna's Summon row for it is enabled against the possessed Valefor (the tests below build exactly that board; a probe of the shipped line shows no Summon rows at all in the five possession links, for the reason in the next sentence). The shipped line spends all five aeons on Braska's Final Aeon, and an aeon KO'd there carries its recovery count (8 to 24 battles) through the rest of the chain, so the lock would take away something the line does not have; that is measured, not assumed.
- The other nine scripts' calls (mid-fight toggles of Escape, Flee, Talk-like triggers, magic and Attack) belong to fights no chapter fights.

## 4. What changes (small)

1. `EnemyGroupDef.scriptCommandDisables?: readonly FormationCommandOff[]` (contract file, additive, `docs/CONTRACT-CHANGES.md`): the same row as `commandDisables` (the game's command id and who) but from a **monster's script**, so a separate switch can hold it. A row with a command below 0x1000 is the aeon-availability branch.
2. `battle/ffx/formation-commands.ts` (extended, was 123 lines): the switch `SCRIPT_COMMAND_DISABLES` (an object with `on: false` and a setter that returns the restore function, the boss-data lane's pattern, so a test and the bench can flip it); `applyFormationCommandDisables` reads `scriptCommandDisables` only while it is on (a command id of 0x3xxx sets the same flags the formation's rows set; an id below 0x1000 sets the aeon's flag); `aeonScriptOff`; `commandRefused` also refuses a submitted Summon (or a Grand Summon that names the aeon) of an aeon that is off.
3. `aeons.ts#availableAeons` and `aeon-duel.ts#grandSummonChoices` leave the aeon out; `adapt/aeon-party.ts#aeonSummonable` takes the byte (`avail`) the kernel gate already models, instead of the constant 1. The Summon row of an off aeon is **not built** (hidden, as Isaaru's rows are: the driver's choice, labelled so; greyed would need words).
4. `data/ffx/enemies/possessed-script-locks.ts` (new, numbers only) and one line in `braskas-final-aeon.ts#possessedAeonBattle`: the ten ids. The Last Summoning builds its groups on its own and carries none of this, so it is byte-identical in both switch states.
5. Tests: a fixture of the raw scan; a model of the game (the setter's two branches) replayed on the scan; the data; the engine with the switch off (nothing set: the old menu, byte-identical) and on (the row gone, the command refused, the turn kept open, Grand Summon's picker without it, a fork sees the same); a synthetic group for the 0x3xxx path; a mutation pass.
6. Mid-fight toggles (the Tros, Geosgaeno, Negator, m211 and Mimic calls) are **not built**: none is reached, so there is no trigger machinery to add. The flags live in `state.flags`, so a later trigger only has to set and clear the same keys.

## 5. Acceptance

- Switch off: every FFX chapter at 12 seeds is byte-identical to the base (event log digests); the 18 goldens, `ffx-engine-fork`, `last-summoning-iii-pin`, the Last Summoning tests, `ffx2-atb-golden` and `ff7-golden` pass unchanged.
- Switch on: each possessed link's own aeon is absent from Yuna's Summon rows and from Grand Summon's choices and a submitted Summon of it is refused; every other aeon is as before; the Last Summoning is identical to switch off.
- Measured on the on state: 12 seeds of every FFX chapter; 500 seeds of Chapter III on the bench's two drivers (the shipped line and the advisor's card-follower) plus a reserve line that keeps its aeons for the possession links (the only route on which the lock can bite); first-try wins before and after, with the cause in player words.

## 6. Risks

- **Chapter III is Bailey's, and D-651 keeps its chain unchanged** (the hidden chapter's lane). The lock is therefore OFF and goes to him.
- The game also removes the **earlier** aeons by the possession-order event (`sins0700`), not by a script command; Chapter III has no such removal. That is a different mechanism (a party change by an event) and is **not** in this switch. It is reported as an open item with its cost, not built.
- `braskas-final-aeon.ts` is already over 400 lines (521); the data goes in a new file and the file gains one line.
