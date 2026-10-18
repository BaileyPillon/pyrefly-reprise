# FFX battle entry and exit: the start-type roll, the monster load and the placement shuffle, and the Victory Overdrive hook (what the game code does)

**Game case: FFX only.** FFX-2 has its own exe, its own start-up and its own battle end (FFX2-G10); none of these addresses, offsets or tables apply to it.
Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)), release candidate 8, lane FFX-L (battle entry); the Wakizashi id of lane FFX-K slice K3 is in section 4.
Condensed 2026-10-15 from the private working note FFX-G10 (written 2026-10-11 by the decompilation lane, second pass, revised after the method check).

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D (the HD
Remaster's 32-bit executable, image base 0x00400000; every "VA" below is a virtual address in that image) and the install's own formation files
(the eight monster words of each, read for numbers only). Everything is written in our own words: no game code and no game text is reproduced here. The game was never run.

Labels: **emulated** (N vectors, 0 mismatches) = the game's own machine code was run in an x86-32 emulator on generated inputs and an independent model written from the
disassembly agreed on every output; **traced** = the real code was run with its callees hooked and recorded; **read** = read in the decompiler or disassembler or scanned
in the install's data, not run; **inferred** = follows from read facts but nothing ran it. A statement under "Open" is never used as a fact.

| This note | Kernel (pure TypeScript) | Engine seam | Tests |
|---|---|---|---|
| section 1, the start-type roll | `src/battle/ffx/kernel/rolls.ts#rollStartType` (ported earlier, 2026-10-08) | `src/battle/ffx/adapt/entry.ts#spendEntryDraws` | `tests/unit/parity-ffx-entry.test.ts`, `parity-ffx-engine-entry.test.ts` |
| section 2, the link rule and the placement shuffle | `src/battle/ffx/kernel/placement-shuffle.ts` | the same | the same |
| section 3, Victory Overdrive on every result | `src/battle/ffx/kernel/overdrive-hooks.ts#odOnVictory` (ported with the gauge lane) | `src/battle/ffx/results.ts` -> `gauge.ts#gaugeOnVictory` | `tests/unit/parity-ffx-engine-entry.test.ts` |

## 0. Functions

| Address | Role | Proof |
|---|---|---|
| 0x0078d090 | start-type roll (argument 0x20) | emulated, 589,824 vectors |
| 0x00783020 | battle manager, a phase machine; phase 10 rolls the start type and then starts the formation script group | the order of the calls: traced, 4,000 runs |
| 0x00783680, 0x00783990, 0x00783b00 | monster load: the link rule (one file request per distinct word, equal later words become followers) | emulated, 20,000 scenarios |
| 0x00784070 | after the last monster loaded: init the monster chrs, start the monster script group, run the shuffle, run the opening counters, clamp HP and MP | emulated |
| 0x007842f0 | placement shuffle for linked monsters | emulated, 20,000 scenarios and the 28 real formation files, 0 mismatches |
| 0x007928d0 | battle-end status (0 going on; 1 party gone; 2 or 4 monsters gone; 3 nobody in battle; the stored override) | emulated, 60,000 vectors |
| 0x007917d0 | end-of-battle state machine (a presentation sequencer: it draws nothing) | traced, 35 scenarios (7 flag words by results 1 to 5) |
| 0x007b1540 | Victory Overdrive hook | traced (called in all 35 scenarios); body read |
| 0x007b1590 | the gauge add the hook uses | read |

## 1. The start-type roll (0x0078d090)

**One draw of stream 1 in every battle, scripted or not** (emulated). `r` is the low byte of the draw. When any character in the battle (chr ids 0 to 0x11, in-battle
byte set) wears Initiative, `r` is lowered by 33 as a signed number. The result is **ambush** (2) if `r >= 255 - 32`, else **preemptive** (1) if `r < 32`, else **normal** (0).
Over the 256 low bytes: 191 normal, 32 preemptive, 33 ambush; with Initiative 191 normal, 65 preemptive, no ambush. The result goes to the start-type byte.

**Where it sits** (traced): the battle manager's phase 10 rolls it first and then starts the formation script group. The start-type byte has three writers: the roll, the debug
override that follows it (a byte no script of the game sets) and the script call `SetAmbushState(n)` of a formation or monster script. Its only two readers
are the opening-counter initialiser (type 1: party counters 0, monsters at their base; type 2: the reverse; any other number acts as normal and spends the 26 draws)
and the intro scene at phase 0x15. The formation script group is created in phase 10, after the roll, and its first update runs before the monster load can finish
(read; the Atel tick order was not run), so a formation's write lands before both readers. **All 26 FFX chapter formations write 3 or 0, both of which mean a normal start**
(read, from the formation scripts), so the roll is spent and overwritten in every chapter battle. No formation of the game writes 1 or 2; three monster scripts do write 2
(after the opening counters, so they can change only the intro).

**The engine:** `BattleSetup.condition` stays the engine's start type (every chapter is a normal start). The roll is spent and discarded, so that stream 1 stands where the
game's does (its other user, the random-encounter group choice, has no chapter). One draw, `value & 0xff`, on stream 1, before the placement shuffle and the opening counters.

## 2. The monster load and the placement shuffle (0x00783680, 0x007842f0)

**The link rule (emulated).** A formation has eight monster slots (chr ids 0x14 to 0x1b), each a 16-bit monster word or 0xFFFF (empty). A word names a monster file only when
its class nibble (bits 12 to 15) is 0 or 1; the file id is then its low 12 bits. Any other class, or a file id of 0, has no file: the slot is skipped (it stays a leader with no
data). For each other slot in order: when an **earlier** slot holds exactly the same word and has data, the slot becomes a **follower of the first such slot** (its parent is
that slot's chr id, it asks for no file of its own); otherwise a file is requested (one request per distinct word, in slot order) and the slot is a leader (parent = itself).

**The shuffle (emulated).** For each used leader `c` in ascending chr id, with `n = 1 +` the number of its followers: when `n >= 2`,
(a) **n draws on the purpose-0 stream of `c`** (stream `c + 8`, that is 28 to 35), each giving `(value & 3) + 8 * k` for `k = 0 .. n-1`; then (b) for each slot `u` from `c`
upward whose parent is `c`, the leader first, **one draw on `u`'s own stream** (`u + 8`): `idx = value mod (the number of entries still unassigned)`, the slot's stored position
(`Chr+0x424`, script property 233, `stat_appear_count`) takes that entry and the entry is removed. **2n draws per group**, all before the opening counters, leaders in ascending
chr id. The stored position is read by **no script of the game** (1,224 monster and formation scripts scanned), so its only effect is the draws.

**Which FFX chapter formations have a group** (read from the formation files; the draws emulated on the real words): exactly three chapter battles, in four formation files.

| Chapter (battle) | Formation file | Monster words, slots 0 to 7 | Linked | Streams drawn, in order |
|---|---|---|---|---|
| VII, Seymour with two Guado Guardians | `mcyt06_00` | 108d 107c 108d 107d | slots 0 and 2 | 28, 28, 28, 30 |
| XII, Seymour Omnis with four Mortiphasm discs | `sins03_00` | 1083 106a 106a 106a 106a | slots 1 to 4 | 29, 29, 29, 29, 29, 30, 31, 32 |
| the hidden Gui chapter, fight 1 and fight 2 | `kino02_00`, `kino03_10` (the same words) | 1075 10a0 10a1 10a1 | slots 2 and 3 (the arms) | 30, 30, 30, 31 |

The other 22 chapter formation files (and the two neighbouring files the harness also ran) have no repeated word and draw nothing. Over the whole game 205 of 851 non-empty
formation files repeat a word; none of the others is a chapter battle.

**The engine:** the slot of an engine enemy is its index in `BattleState.enemyIds` (the enemies, then the parts), which is the game's slot order in these three battles
(`tests/unit/parity-ffx-engine-entry.test.ts` pins the order). The draws move the monsters' own streams (28 to 35) **before** the opening counters, so the monsters' opening
counters, and every later roll on those streams (damage variance, the critical roll, Escape), are dealt again from the new position: a new deal of the same odds, no rule
changes. The stored position is discarded.

## 3. The end of a battle: Victory Overdrive runs for every result (0x007917d0, 0x007b1540)

The state machine's phase 0x1d, in order: the result is stored; every character's per-action flags are reset; the HUD flags are cleared; the end-type signal; the formation's
end-scene hook (when flag-word bit 16 is clear, or on a game over); **Victory Overdrive (0x007b1540), called for every result 1 to 5, not only a victory** (traced); the
victory poses (victory only). The end-of-battle party save (HP, MP and Overdrive of the 18 slots into the roster records, 0x00785fc0) runs later, in the teardown, so the gain is saved (read).

**The hook (read; the call order traced).** For each party slot 0 to 6 that is in the battle, dead or not: one is counted, the mode-11 (Victor) learning counter is advanced, and
a character whose Overdrive mode is Victor gets +20 through the gauge add (0x007b1590). The gauge add gives **nothing to a Cursed, dead or Petrified character**, applies the
Double, Triple and other gauge multipliers, and returns at once when a byte the note did not decode is non-zero. The hook **does not look at the result**.

Results: 1 party gone, 2 or 4 monsters gone, 3 nobody left in the battle, 5 a script's `endBattle` (6 is a path the note did not decode). **The engine's three endings:** `victory`
is the game's 2 or 4; `defeat` is 1; `escape` is the engine's ending for a party that has left (every active member ejected, which is where Escape and Flee lead) and for the stalemate guard (Yu Yevon: no game
counterpart, an engine ending); `defeat` also covers a lost aeon duel, a scripted Game Over and a field where nobody can act. The engine runs the hook for all three endings. In the engine the Victor learning counters are all "never counts" (the builds name one mode
per member), so the only visible effect is the +20 for a Victor-mode survivor, who is in the battle only when the party is not wiped: an escape or the stalemate. Wakka wears
Victor in Chapter II (`zanarkand.ts`) and Chapter III (`dreams-end.ts`).

## 4. Lane FFX-K slice K3: the all-target Wakizashi is command 0x30E1

Yojimbo's command roll names the Wakizashi on one target `0x30E0` and the Wakizashi on all targets `0x30E1` (FFX-G08, emulated: 57,839 vectors of the roll). The two records carry the same
fields (type 0, misc word 0x4010006, damage word 0xd, damage class 1, shatter 100, rank 3), so the id is the only difference. `src/data/ffx/command-records/player.ts` listed
`wakizashi-multi` with `0x30E0`; it carries `0x30E1` now. No code branches on the two ids by value (searched `src/`; the reach-0 set and the formula-byte overrides name neither), so no
behaviour moves.

## 5. Open (not used as a fact; nothing here is built)

- The random-encounter step roll (0x00780d10) and its tables: every chapter is a scripted boss fight; there are no random encounters.
- The battle-to-field hand-off, the results (spoils) panel and where a battle's item stacks are banked (FFX-G10 sections 3.4 and 3.6): lane FFX-M, which needs Bailey's yes.
- Whether the Atel tick runs before the monster-file completion (section 1): read, not run; every chapter formation writes a normal start either way, so nothing in play depends on it.
- What path sets result 6 (section 3).
