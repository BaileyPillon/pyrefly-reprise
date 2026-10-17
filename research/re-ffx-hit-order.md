# FFX battle: the order an action's hits are calculated and applied in, the recoil of Drain, and the rank (what the game code does)

**Game case: FFX only.** FFX-2 has its own strike resolver and its own timeline in its own exe; none of these addresses exist there.
Part of the `re-parity` track ([docs/plans/re-parity.md](../docs/plans/re-parity.md)), release candidate 10, lane "FFX hit order and recoil" (gap-scan rows S1, S2, S3).
Condensed 2026-10-17 from the private working note FFX-H01 (written 2026-10-13 by the decompilation lane; sections 3.4 to 3.7, 5 and 7 rows 1, 3, 5 and 7).

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D (the HD Remaster's 32-bit executable, image base 0x00400000; every address below is a virtual address in that image). Read in Ghidra, decompiler and disassembly.
Everything is written in our own words: no game code and no game text is reproduced here. The game was never run.

Labels: **emulated** (N vectors, 0 mismatches) = the game's own machine code was run in an x86-32 emulator and an independent model written from the disassembly agreed on every output; **scripted scenarios** = the same, on a list of cases counted by hand;
**read** = read in the decompiler or disassembler, not run; **inferred** = follows from read facts but nothing ran it. A statement under "Open" is never used as a fact.

| This note | Code | Tests |
|---|---|---|
| §1 calculation, §2 application | `src/battle/ffx/hit-order.ts`, `abilities.ts`, `hit-apply.ts` | `tests/unit/parity-ffx-hit-order.test.ts` |
| §3 the recoil | `src/battle/ffx/kernel/recoil.ts`, `hit-order.ts#applyRecoil` | `tests/unit/parity-ffx-recoil-rank.test.ts` |
| §4 the rank | `src/battle/ffx/kernel/ctb.ts#actionRank`, `state.ts#rankOf` | `parity-ffx-recoil-rank.test.ts`, `parity-ffx-ctb.test.ts` |

## 1. Calculation: the orchestrator (0x007892e0)

One call per sub-action. It visits the targeted slots in **ascending slot order** (party 0 to 7, aeons 8 to 0x11, monsters 0x14 and up), **one slot completely before the next**: every hit of the slot through the hit pipeline, then that slot's Steal draws (stream 10, then 11 on a success), then the next slot [emulated, 12,000 vectors, 7,816 with two or more targets, 0 order violations].
Nothing is applied yet. The user's own slot, when the command carries the absorb bit (Lancet, Drain, Osmose and the two Furies of those), is counted and skipped [emulated, 2,412 vectors]. The hit pipeline keeps three running sums that each hit reduces by its HP, MP and CTB amount.
The draws a hit takes are on the user's streams (hit check mode 1, variance and critical mode 0, statuses mode 2), so which hit gets which draw depends on this order.

## 2. Application: the results driver (0x0078d980) and the hit applier (0x0078f060)

One call of the driver visits every slot in the selection ascending and the applier applies **at most one hit per matching result record**. Call k therefore applies hit k of every target that has one. A target's death check runs in the call that applies its last hit (and again in each later call, a no-op once it is dead).
With equal hit counts both deaths fall in the last call, **lower slot first, and the lower slot's death handling (loot, Auto-Life, queue cancel) happens before the higher slot's last hit is subtracted** [scripted scenarios: 47, 32 with one target (1 to 16 hits, counter armed or not) and 15 with two ((2,5), (5,2), (1,16), (3,3), (4,1), armed on none, one or both);
0 mismatches against a model; the same order held when the records came from the real calculation, 8,000 vectors]. The counter queue is called once per armed target, in call 1, and clears the armed byte. The action-done call comes in the last call only.
The post-action pass (0x007911e0) flushes whatever is left with the all-slots selector, so rounds are the floor of the rule. **Open:** the animation scripts call the driver too, with a selector and flags they set; they were not read, so which frame a hit lands on, and whether some animation applies one target at a time, is not known.

## 3. The recoil record (0x0078a240 and the orchestrator's last steps)

A command with the absorb bit claims a result record on its **user** before the targets are visited. After the last slot: with the action-wide **landed-hit counter** (hits neither evaded nor nullified) above 0, one recoil record is appended with flag 0, carrying the three running sums; otherwise, if the user's own slot was targeted, it is appended with
flag 1 and an **empty class mask** (it changes nothing); otherwise it is cancelled [emulated, 30,000 and 12,000 vectors: the arguments and the call position]. The record is one pending hit on the user's slot, so it is applied in call 1, in slot order. **Open:** the record's own arithmetic (the class mask taken from the command's
class byte, the sign) was not compared; the engine heals what the targets lost and does nothing for a net loss.

## 4. The rank (0x007895b0)

The user's CTB rank is stored at the first calculation from the command ids of **entry 0** of the action: ids of 0xff are skipped, a set Copycat flag turns each id into 0x3028, the record found for an id replaces any earlier one, the scan stops after 0x3029 (Doublecast), 0x305f (Quick Pockets) or 0x311e (Mix), and the rank is the last record's rank byte, **3 when none was found or the byte is 0**
[emulated, 8,000 vectors, and every one of the 320 command rows, 1,920]. Every sub-action reads entry 0. The minigame result handler never writes it, so an Overdrive's recovery uses the menu command's rank whatever the grade.

## 5. What the engine does with this (RC10)

| Rule | Switch (`src/battle/ffx/hit-order.ts`) | Where |
|---|---|---|
| §1 ascending slot order of the calculation | `HIT_CALC_SLOT_ORDER` | `abilities.ts` (the target kernel returns ascending; the cheap path did not) |
| §2 events round by round; each death in the round of the target's last hit | `HIT_ORDER_ROUND_ROBIN` | `hit-order.ts#runInRounds`: the events of each hit are held when it is calculated and replayed in the application order |
| §3 one recoil, user's slot skipped | `DRAIN_RECOIL_ONE_RECORD` | `kernel/recoil.ts`, `hit-order.ts#applyRecoil`, `hit-apply.ts` |
| §4 the rank | (none) | `state.ts#rankOf` asks `actionRank`; equal to the plain rule for every ability |

Not modelled: HP and statuses are written at calculation time, not in the round (a lower slot's death handling sees the higher slot's last hits already written); the animation timeline; Auto-Med and Auto-Potion decided in round order. See the lane handoff, open items.
