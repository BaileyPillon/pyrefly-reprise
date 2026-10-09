# FFX versus FFX-2 battle code: which functions are relatives and which are not

**Game case: both, as a comparison; every row names the case for our engine.** Each game has its own function for every mechanic below,
in its own exe, and each is proven on its own (`research/re-ffx-*.md`, `research/re-ffx2-*.md`). This note says which pairs are close
relatives, so that shared plumbing is written once and nothing that differs is shared by mistake. Part of the `re-parity` track
([docs/plans/re-parity.md](../docs/plans/re-parity.md)). Drafted 2026-10-08.

**Source note (applies to every statement below unless a line says otherwise):** FFX.exe and FFX-2.exe, Steam build 25501027 of the HD
Remaster, 32-bit executables (image base 0x00400000). FFX.exe SHA-256 0537B2A1...686D, FFX-2.exe SHA-256 6EA7F142...CD69. Every address
is a virtual address in the exe it belongs to (the pair column gives the FFX address first and the FFX-2 address second; the FFX-2 ones are
in the live Steam file, and the analysis lane's older copy of that exe has the same code 0x20 to 0x30 higher in the battle range). Compared with rea 6.0.0 (local start-up-deadline patch) on Ghidra 12.1.4: rea imports each exe in
its own session, builds a dossier per function (decompiled text, assembly, calls, references, basic blocks, data flow) and compares two
dossiers. Everything is written in our own words: no game code and no game text is reproduced here.

## 1. How to read the verdicts

rea's `compare_functions` is built to diff two versions of one function, so it reports "changed" in 7 of its 8 dimensions for every pair
here (the eighth, comments, is empty on both sides). It cannot say how close two functions are. The labels below are read from rea's
dossiers: the share of pseudocode lines that are equal once local names are masked, the shape of the basic-block graph, the instruction
and p-code operation mix, and the constants each side uses. The label describes the decisive computation, not the wrapper around it.

* **shared skeleton**: the same control-flow shape and operations; the games differ in constants, field offsets or one operation.
* **changed**: the same role and some common pieces or constants, but a different algorithm or very different surroundings.
* **unrelated**: the same role only.

rea decompiles with the same Ghidra decompiler as the analysis lane, so this is a structural comparison, not a second independent reading;
the formulas themselves are in the per-game notes, which were proven by running the real code.

## 2. The pairs

| Pair (FFX VA / FFX-2 VA) | Verdict | What both do | What differs | Case for our engine |
|---|---|---|---|---|
| **Generator draw** 0x007988f0 / 0x0061e270 | shared skeleton | 68 independent 32-bit streams. A draw multiplies the stream's state by its own constant, folds in a second constant, adds the sign-extended high half to the shifted-up low half, stores that and returns its low 31 bits. One basic block, no calls. | The folding step: FFX exclusive-ors a 16-bit word; FFX-2 multiplies by five more and adds the 16-bit word plus one. The constant tables are near copies (32 of 68 multipliers equal, 35 off by exactly one, one off by 15; 42 of the 68 second words equal, 26 off by one), so neither game's tables can stand in for the other. | FFX only / FFX-2 only: a kernel and a table set each. Stream count and output width are shared plumbing. |
| **Which stream a roll uses** 0x0078d210 / 0x0061adb0 | shared skeleton | Purpose 0, 1, 2 select the base, base + 16, base + 32; party slots use slot + 20; the stream is the attacker's. | Monsters: slot + 8 (8 slots, ids 0x14 to 0x1b) in FFX, slot + 13 (16 slots, ids 0xf to 0x1e) in FFX-2. FFX gives every aeon one shared stream (27); FFX-2 has no aeon class. FFX-2's critical and damage code compute the mapping inline instead of calling the selector. | FFX only / FFX-2 only. |
| **Hit check** 0x0078a890 / 0x00641500 | unrelated beyond the role | Result 0 hit, 1 miss, 2 no effect. A 3-bit accuracy-formula selector in a command flag word, formula 0 meaning "always hits". The ordinary formulas roll modulo 101 against a threshold built from Luck and evasion. Darkness cuts the accuracy term, Evade & Counter forces a miss on physical commands, sleeping and petrified targets are always hit. | FFX: a 511-byte test per hit and target, a 9-entry accuracy table, Aim and Reflex stacks worth 10 points each, Darkness divides by 10. FFX-2: a 1,638-byte pass over the whole action (31 target slots, one result per target, planned strikes, random-target spread, forced outcomes), five-point stage terms, Darkness divides by 4, plus instant-effect, Bribe (floating point) and level-to-the-sixth formulas. FFX runs it inside the per-hit pipeline; FFX-2 decides it before the damage step (command start and the action hit event call it) and the damage orchestrator does not. | FFX only / FFX-2 only. |
| **Critical hit** 0x00789690 / 0x00617210 | shared skeleton | A "can crit" bit of the command gates it (no draw otherwise). One draw from the attacker's purpose-0 stream; a chance built from the two Luck values; critical when the roll is below it, or when an always-critical state or a debug switch forces it; the damage doubles and flag 0x100 is set. | Roll modulo 101 (FFX) against 100 (FFX-2). FFX adds Luck and Jinx stacks (one point each) and a command or weapon bonus; FFX-2 adds five times the Luck-stage difference, or a fixed chance byte named by the command. The flag bits and structure fields differ. | FFX only / FFX-2 only. |
| **Base damage** 0x00789bf0 / 0x0061b910 | changed | The variance factor is drawn first, from the attacker's purpose-0 stream, before the formula switch and for every formula: 240 to 271 out of 256, or 256 when variance is off. A switch on the command's formula byte. Heal commands negate. Fixed-power formulas (power x 50, power x 9999) and percent-of-pool formulas (pool x power / 16) exist in both. | The curves. FFX cubes (stat + stack), shifts and adds 30, with a quadratic defence term over 730 and 15-step stacks. FFX-2 weights by level, uses (270 - defence) / 255 and 12-step stages. The formula numbers differ (FFX 1 to 0x17, FFX-2 0 to 0x18). FFX 1 to 9 match FFX-2 0 to 8 in role, one place lower (the physical, magic and healing curves have different arithmetic; the fixed-power and percent-of-pool ones agree); from 0xa on the tables diverge and the same number means something else. | Formulas and ids FFX only / FFX-2 only. The variance rule: both. |
| **Elemental affinity** 0x0078a360 / 0x00618780 | shared skeleton (the nearest pair) | The same ladder over eight element bits and four per-element masks on the target: any weakness applies and ends the step; else one neutral bit leaves the hit unchanged; else a resisted bit halves; else a nulled bit gives 0; else an absorbed bit negates. 168 basic blocks each; 88 percent of the pseudocode lines are equal once local names are masked. | The weak multiplier: x3/2 per matching bit, truncating each time, in FFX; x2 in FFX-2. The four masks sit at different places in the character structure. | Ladder order: both. Multiplier and byte positions: FFX only / FFX-2 only. |
| **One strike, one target** (FFX per-hit 0x0078e630 / FFX-2 per-target 0x006172c0) | changed | Both assemble one target's result for one strike: variance, critical, element, Shell and Protect halving, heal sign, status rolls, the 9,999 / 99,999 limit, and three damage pools (HP, MP and CTB or ATB). | FFX has three layers (per action, per target, per hit); the per-hit function runs the hit check and calls about 34 distinct helpers, one per modifier step, and Steal and Pilfer Gil run once per action. FFX-2 has one 3.9 KB function with the modifiers inlined (chain multiplier, back attack, species killers, aid scale, item doublers, all-target halving), the hit already decided, and Steal and Pilfer Gil inside. | FFX only / FFX-2 only. |
| **Status infliction** 0x0078ae00 / 0x00619230 and 0x00619700 | changed | Per status a chance byte and a resistance byte; one purpose-2 draw per status with a non-zero chance (none for a cleansing command); roll modulo 101; 255 always lands, 254 lands unless immune, resistance 255 is immune; Petrify clears the others; a petrified target can be shattered. | FFX: lands when the roll is below chance minus resistance, Threaten has its own rule, 25 regular statuses in one function plus a separate extra-status function. FFX-2: below chance plus five times (attacker level minus target level) minus resistance, two group functions (on/off flags; timed and staged statuses). | FFX only / FFX-2 only. |
| **Steal** 0x0078b760 / 0x00619c10 | shared skeleton (the core roll) | Success is a draw from fixed stream 10, modulo 255, below the target's chance byte; the rare slot is a draw from fixed stream 11 with the low byte below 32 (one in eight), when the rare slot is filled. | FFX halves the chance after each success (minimum 1), raises the rare threshold for two user bits, and updates the inventory and counters itself, once per action. FFX-2 returns the item in a per-target result, has two command ids that force success or the rare slot, and clears the chance in a separate apply step (one steal per enemy). | Roll constants: both. Chance upkeep: FFX only (halve) / FFX-2 only (once). |
| **Pilfer Gil** 0x0078b920 / 0x00619d10 | shared skeleton | The same test and the same amount: ((second draw modulo 101 + 100) x figure / 200) x chance / 255. | FFX's figure is a byte multiplied by 100, with signed arithmetic, and the chance is halved after a success. FFX-2's figure is a full amount, with unsigned arithmetic, no draw at all when there is nothing to take, and the chance is cleared by the apply step. | Formula: both. Figure width and chance upkeep: FFX only / FFX-2 only. |
| **Turn speed** 0x007909c0 / 0x006349f0 | unrelated | Turn timing starts from the character's speed stat, and Haste and Slow change it. | FFX looks Agility up in a table of tick costs held in a data file; Haste halves a delay and Slow doubles it. FFX-2 starts from the configured base speed (70, 95 or 120): Haste x21/20, Slow /2, zero when asleep, petrified or stopped, halved while charging or in a hit reaction. | FFX only (CTB) / FFX-2 only (ATB). |
| **Turn order** 0x00790fb0 / 0x00634b10 | unrelated | Counters count down until a character is ready. | FFX runs one global pass a frame: a sorted ready list whose first entry acts; when nobody is ready every counter drops one point per tick. FFX-2 keeps a gauge state machine per character (idle, recover, think, ready) behind its own clock gates, with a ready list served lowest counter first. | FFX only / FFX-2 only. |

Extra, found on the way:

| Pair | Verdict | What both do | What differs | Case |
|---|---|---|---|---|
| **Seeding** 0x00798890 / 0x0061e1b0 | the same algorithm | One byte from the clock (eight bytes xor-folded, plus 1) times (a seed word + 1) gives k. A side word from k is stored and never read. A linear-congruential generator with the same two constants fills the 68 states, each masked to 31 bits. | FFX starts the generator from k, takes one step and throws it away; FFX-2 writes the result of that step straight into its constants. For the same k both games fill the same 68 starting states. Only the clock reader and the addresses differ. | Both. |

## 3. What this means for the kernels

* **Never share:** the generator's folding step and tables, the stream map, the hit check, the critical rule, the base-damage curves and
  their numbering, the pipeline order, the status landing test, the speed and scheduler code.
* **Safe to share (shared plumbing, case both):** the 68-step seeding fill, the variance rule, the ladder order of the element step (with
  the multiplier and the byte positions as per-game parameters), the stream-10 and stream-11 steal roll constants and the Pilfer Gil
  amount shape (with figure width and chance upkeep per game).
* **Formula ids are not portable.** A damage formula number from one game's command table must never be read through the other game's
  formula switch.
* Below this level the two games share an engineering style and a family of small functions (the element ladder, the steal roll, the
  seeding), not an implementation.

## 4. Findings against the per-game notes

No number in `re-ffx-*.md` or `re-ffx2-*.md` was contradicted: the generator tables (all 68 + 68 FFX values, the FFX-2 checksums), the
accuracy table, the formula tables, the element ladders, the status landing tests, the steal and Pilfer Gil formulas, the speeds and the
scheduler's conditions were read again in rea's pseudocode, constants and data reads and agree. Three things to know:

* **The near-copy tables.** `re-ffx2-hit-status.md` says "many entries agree, some differ by one" about the two multiplier tables; the counts
  are in the generator row above (35 of 68 differ by exactly one).
* **A mode-0 consumer is missing from the purpose lists.** The FFX stream selector has ten callers; `re-ffx-rng-hit.md` section 2 names
  nine of them and not the tenth, a monster-placement shuffle at battle start (0x007842f0) that spends several purpose-0 draws on the
  monsters' streams 28 to 35 for every group of two or more linked monsters (one draw per member from the group leader's stream, then one
  per follower from its own). The FFX-2 counterparts (live 0x0060a8c0 and 0x0060acc0, two "formation shuffle" callers)
  are in the anchor map but not in `re-ffx2-hit-status.md` section 1.1. This matters for draw-exact replay of a fight whose monsters share a
  parent, because the shuffle advances their streams before the first roll; whether any of the five chapters has such a group was not checked.
* **Bit numbers versus masks.** `re-ffx2-hit-status.md` names the critical-hit gate "bit 4" and the fixed-chance flag "bit 8" where the code
  tests the masks 0x04 and 0x08 (bit numbers 2 and 3, as `re-ffx-rng-hit.md` writes "bit 2 (0x04)"). The kernels are right; a reader who
  takes "bit 4" as `1 << 4` would test the heal flag.

## 5. Limits

Static comparison only: nothing was run for this note (the formulas in the per-game notes were proven by emulation). rea decompiles with
the same Ghidra decompiler as the analysis lane, so it confirms structure and constants but is not a second independent reading, and its
`build_call_path` confirmed every call chain used above that exists but cannot say that a path does not exist. rea reads the exe image, so anything
that lives in a data file (the CTB base table, the ATB speed constants, the command rows) is outside this comparison. The private report
with the numbers behind each verdict, rea's session times and its failure modes is kept outside the repo with the raw outputs, because
those contain decompiled text.
