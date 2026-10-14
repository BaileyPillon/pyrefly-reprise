# FFX command availability: the MP cost, the Silence gate, the cost check and the range filter when a command starts, and Flee (what the game code does)

**Game case: FFX only.** FFX-2 has its own exe, its own executor and its own gates; none of these addresses, offsets or tables apply to it.
Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)), release candidate 7, lane L-CMD.
Condensed 2026-10-13 from the private working note FFX-G07 (written 2026-10-11 by the decompilation lane, second pass, revised after the method check).

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D (the HD
Remaster's 32-bit executable, image base 0x00400000; every "VA" below is a virtual address in that image) and the install's own kernel tables
(`command.bin`, `monmagic1.bin`, `monmagic2.bin`, `item.bin`), read for numbers only. Everything is written in our own words: no game code and no game text is
reproduced here. The game was never run.

Labels: **emulated** (N vectors, 0 mismatches) = the game's own machine code was run in an x86-32 emulator on generated inputs and an independent model
written from the disassembly agreed on every output and every changed field; **read** = read in the decompiler or disassembler or scanned in the install's data,
not run; **inferred** = follows from read facts but nothing ran it. A statement under "Open" is never used as a fact.

| This note | Kernel (pure TypeScript) | Tests |
|---|---|---|
| §1 MP cost, usability gate, cost check | `src/battle/ffx/kernel/command-gate.ts` | `tests/unit/parity-ffx-command-gate.test.ts` |
| §3 range and dead-target filter | `src/battle/ffx/kernel/command-range.ts` | the same file |
| §4 the executor's failure path | `src/battle/ffx/command-start.ts` (engine seam) | `tests/unit/parity-ffx-engine-command.test.ts` |
| §5 Escape and Flee | `src/battle/ffx/escape.ts` | the same file |

## 0. Functions

| Address | Role | Proof |
|---|---|---|
| 0x0078cf70 | MP cost of a command record for a character | emulated, 29,569 vectors |
| 0x0078c690 | usability gate: Overdrive, Curse, Silence, MP; returns the cost or -1 | emulated, 40,000 crafted vectors and 7,832 on the real records |
| 0x0078ab20 | cost check when a sub-action starts; fills the pending-cost bytes | emulated, 40,001 vectors |
| 0x00791fa0 | range and dead-target filter | emulated, 30,000 vectors |
| 0x00799690 | command reach (0 to 3) | emulated (already ported: `kernel/legal-set.ts#commandReach`) |
| 0x00792210 | action executor: starts one sub-action per call; its failure path | emulated with its callees replaced, 12,000 scenarios |
| 0x0078a780 | single Escape roll | emulated (already ported: `kernel/rolls.ts#escapeRoll`) |
| 0x007ada60 | Flee loop over the active party | emulated, 20,000 vectors |

## 1. MP cost, usability gate and cost check

**MP cost (emulated).** Start from the record's MP byte, or 0 when the character's zero-cost flag is set. Half MP (auto-ability word A bit 0x4000) halves the cost **rounding
up**. One MP Cost (bit 0x8000) replaces any non-zero base by 1 and wins over Half. Magic Booster (bit 0x40) on a record whose category byte is 1 or 2 (Black or White Magic)
doubles the cost and takes Half's round-up away. Spellspring (bit 4 of the buff byte) makes the result 0 after everything else.

| Ability (MP) | none | Half | One | Booster | Booster + Half | Booster + One | Half + One | Half + One + Booster |
|---|---|---|---|---|---|---|---|---|
| Fire (4) | 4 | 2 | 1 | 8 | 4 | **2** | 1 | 2 |
| Esuna (5) | 5 | **3** | | 10 | 5 | | | |
| Scan (1) | 1 | **1** | 1 | 2 | 1 | | | |

Holy (85) under Half costs 43, Auto-Life (97) 49, Ultima (90) 45 under Half and 180 under the Booster, Mug (10, a Skill) 5 under Half, 10 under the Booster (it only boosts categories 1 and 2) and 1 under One MP.

**Usability gate (emulated).** A record is usable for a character when all three hold:
1. a record with a non-zero Overdrive-cost byte needs the gauge at least its maximum (both bytes of the character) and the Curse bit (0x400) of the extra-status word clear (the free-Overdrive debug switch waives it);
2. a record with bit 0x20000 of its flag word needs the Silence counter to be 0;
3. the MP cost plus the "pending" MP the caller passes is at most the character's current MP (signed 32 bits). A monster (character id 0x14 to 0x1b) and the free-MP debug switch force both to 0. A negative MP refuses even a free command.

The answer is the cost, or -1. The three tests are independent; the order does not change the result.

**Silence is a flag on the record, not a category.** 67 of the 979 records carry bit 0x20000: all 22 White Magic and all 19 Black Magic records of the command table (ids 0x302b to 0x3053;
Scan, Esuna, Life, Regen, Holy, Auto-Life, Osmose and Ultima among them) and 26 monster-table records. **Summon (0x3117), Grand Summon (0x3118), Doublecast (0x3029), every Overdrive including Fury, every Skill,
Special, item and aeon command are not Silence-gated.** The Summon list's own entries use a static record with no flag. (Emulated on every real record; named cases for Summon, Grand Summon, Fury and Doublecast.)

**Cost check when a sub-action starts (emulated).** The executor runs it at the start of every sub-action. It asks the usability gate with no pending MP and accepts only if the cost is 0 or more and at most the current MP **and** the record's
Overdrive cost is at most the gauge value itself (so the gauge must really hold 100, or 20 for an aeon, not just its own maximum). On acceptance it records the MP and Overdrive cost the action will pay; on a refusal it leaves them alone.

## 2. Where the repo's data stands

The repo's ability data matches the game's table for the MP byte, the category byte and the flag word of every ability with a command-table record except **Entrust** (ours 0, the game's record 8) and the aeons' **Nul-All** (ours 0, the game's 4) —
checked 2026-10-13 against the install's `command.bin` for all 246 abilities that carry a command-table record. No ability's category byte or flag word differs. The monster tables carry no MP (a monster pays none).

## 3. Range and dead-target filter (emulated)

The filter walks the sub-action's target mask once. A target whose signed distance byte is above the command's reach, and that is not the user, is counted as out of reach and dropped; else a target that is dead is dropped unless the command's target word has bit 6
("may target the dead"); everything else is kept, and the kept mask is written back. **Nothing replaces a dropped target.** The function returns 0 only for a strict command (a record with a hit-count byte, the item-steal flag or the gil-steal flag) when nothing was
kept. The sub-action does not start when the filter returns 0, or when the mask named someone and nobody is kept; an empty mask starts. (The animation and focus requests the function makes for each kept target are presentation.)

## 4. A sub-action that does not start (emulated, 12,000 scenarios)

It fizzles quietly. MP and Overdrive are not paid (the pending bytes are cleared) and every item the entry names is returned to the bag. A message is shown in only three cases: message 0x300E (the out-of-range message) when at least one target was out of reach and the
action is not AI-requested — and then, when the user owns the head turn entry, the entry is removed and the turn stays open for the user (*inferred* from the flags the path sets and clears); 0x3017 when the Mix-resolved flag is set; 0x3016 when the Copycat preparation failed.
A dead target alone fizzles with no message and no animation. An entry that is not removed is closed by the end-of-action routine, which applies the CTB recovery of whatever rank the action carries (*inferred* to be the scheduler's reset value 3 for a failure at this first gate:
the CTB-delay paragraph of FFX-G05 says the amount "is not established"; `research/re-ffx-ctb-status.md` section 14.4 gives the reset).

## 5. Escape and Flee

**Escape (0x3003)** is rolled inside the command with one draw from the escaper's own mode-0 stream (party slot + 20, every aeon 27, monster slot + 28); it succeeds when the low byte of the draw is below 191, or always when the battle's escape flag is 2,
never when it is 1; the draw is spent in every case. A success runs the Coward hook for the escaper. (Already in `kernel/rolls.ts`.)

**Flee (0x3018)** has no roll and no gate of its own. The command walks the seven-slot active party list and, **for each listed character that is in the battle, not dead and not Petrified**, runs the Coward hook, advances its position and starts the leave animation.
A dead, Petrified or absent character is skipped by the loop; the end-of-action routine then marks all 18 party slots as out of the battle. (Emulated, 20,000 vectors.)

## 6. Not built here (open in the source note)

Who pays the first Doublecast cast's MP (the visible code overwrites the pending cost at each cast's check and pays one cost per entry unless an effect script pays the first), how the menu composes a Doublecast entry (two picked spells, each with its own target),
Quick Pockets and Copycat sequencing (their cost check branch), the text of messages 0x300E, 0x3016 and 0x3017, which formations disable Escape or Flee, and whether any menu code outside the usability gate blocks Summon under Silence (none was found; an in-game check on the Steam copy
would close it).
