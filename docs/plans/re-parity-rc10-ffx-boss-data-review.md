# Paper preflight: RE parity RC10, lane FFX boss data (gap-scan rows S5 and S6)

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: `node tools/critic-plan.mjs --paths src/battle/ffx/boss-data-corrections.ts,src/battle/ffx/setup.ts` classes the change **DEEP** ("FFX CTB engine is a shared system").
> **Disclosed order:** the inert module (every switch off, `ec9d5fe87`) was committed before this page; it was written before anything was turned on or measured. Nothing in it can move a battle until a switch is flipped, which is the owner's word.
>
> **Owner's words** (as the brief quoted them): 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-16 "keep going please all of this reverse engineering needs to be incorporated into our game"; 2026-10-17 "keep going full speed". House rule: never tune boss numbers; build each sourced answer, measure it, ask him once.
> Source note: `D:\Tools\ffx-parity\coverage\ffx\FFX-H02.md` section 7 (private), gap scan `coverage\gap-scan-2026-10-17.md` section 3 rows S5, S6.
> **Verdict: PROCEED**, every switch off, branch `re-parity-rc10-ffx-boss-data` cut from `origin/r52-rc` (`3c92b60cc`). Nothing deploys without Bailey's word.

Written 2026-10-17 by the lane (a Sonnet sub-agent of the RE parity session).

## 1. Game case (AGENTS.md rule 14)

**FFX only.** The monster records, the character initialiser that clamps them (FFX.exe 0x0079b4f0) and every row below exist only in FFX; FFX-2 reads its monsters from another table. `src/battle/ffx2`, `src/data/ffx2`, `src/battle/ff7` are not touched; `ffx2-atb-golden` (6) and `ff7-golden` (3) must stay byte for byte.

## 2. What the data says (re-read for this lane from `FFX_Data.vbf` with our VBF reader: 361 records, 6,498 fields, 0 differences from the note's decode)

| Row | Record | Engine today |
|---|---|---|
| D1 | the character holds STR, DEF, MAG, MDEF, AGI, LCK, ACC at least 1 (EVA 0 stays) | 63 stat cells of 29 rows (MDEF 19, DEF 18, ACC 15, AGI 7, MAG 3, LCK 1) still copy a raw 0 (`setup.ts#enemyToCombatant`, `stats: { ...e.stats ... }`); the Gui, Cid and Mortiphasm rows already read 1 |
| D3 | Evrae's Zanmato byte 3 (level = byte + 1 = 4) | `evrae.ts:196` says 3; Mortibody, Ginnem, Isaaru carry no level where the record has 3, 4, 4 (found by this lane, same consumer) |
| D5 | steal chance byte 255 on every stealable boss | **already the game's** since W5: `adapt/steal.ts` reads 100 percent as the byte 255 and halves a byte (255, 127, 63 ...); quantities equal the record on all 22 stealable rows. Not built |
| D7 | Seymour Flux Slow byte 255 | `seymour-flux.ts` header ships Slow landable (a "copy/paste artefact" reading) |
| D8 | Evrae: Doom immunity bit clear, Doom start 30 | `evrae.ts:153` `doom: 255` (research conflict C-3 in `research/ffx-evrae-airship.md`, resolved by the researcher and the driver, not a decision of Bailey's; the row says "trust the decompile", yet the data followed the wiki for Doom immunity) |
| D9 | Life-immune flag on nine of our rows | absent on Evrae, overdrive Sin, Seymour (m124), both Fins, Genais, the Sin Core, both Pagodas |
| D10 | scan / auto-life / eject bits, Shell Protect Reflect and the four Nuls on the Pagodas, Auto-Life on Braska's Final Aeon, Percentage / Delay / Bribe flags and EVA 0 on Mortiphasm, no Curse bit on Pagodas and Mortiphasm, no sensor-immune flag on Yu Yevon | absent / present as listed in `boss-data-corrections.ts`. **Two visible changes** (the independent check, 2026-10-17): Scan on a Yu Pagoda stops working (the Pagoda record has f28 bit 4 and extra bit 0 set; today a Scan reveals it and the status lands, with D10 nothing is revealed and the status is refused, an immune miss; what bit 4 means is not read in FFX.exe), and Sensor on Yu Yevon, which today shows the plate "Immune to sensors." (D-221), reveals him (HP 99,999, MP 1) in Chapter III's last link and Chapter 28 |

**Dropped:** D5 (above); Regen 255 on Braska's Final Aeon and the Pagodas (the `immune-to-regen` flag already makes the Regen byte 255: `adapt/status.ts#resistBytesWith`); Yu Pagoda HP 65,535 (the game's init script writes 5,000: `research/re-ffx-ai-yunalesca-bfa.md` 4.1); Sinspawn Gui second fight "steal with no record" (the note mapped it to m118; the rematch is the same record m117, steal byte 255); Dark Daigoro (a stand-in row), the possessed aeons and the Dark Aeons (stats copied from the player or written by script); D2, D4, D6, D11 to D16 (no effect, closed, unreachable, or matching).

## 3. The change

`src/battle/ffx/boss-data-corrections.ts` (it lives in `src/battle/` because that tree imports nothing from `src/data/`): six switches `D1, D3, D7, D8, D9, D10`, all false, one table per switch keyed by our enemy ids; `applyBossDataCorrections(group)` is called once in `buildBattle` on the battle's own deep copy of the group, and returns before reading anything when no switch is on. The module rows in `src/data/ffx/enemies/**` are never edited. Contract files untouched (no `CONTRACT-CHANGES.md` entry needed).

## 4. Risks and how they are closed

| Risk | Closure |
|---|---|
| A switch off changes a battle | 12-seed event logs of every FFX chapter byte-identical to `origin/r52-rc` (180 of 180); `ffx-engine-golden`, `ffx2-atb-golden`, `ff7-golden` unchanged; a test that throws if the group is read |
| A table disagrees with the record | `tests/fixtures/ffx-boss-records.json` (32 records, numbers only); per-switch tests; a closure test: with every switch on, every mapped row equals its record on floored stats, 24 status bytes, 5 extra bits, 7 flags, Zanmato (residue listed with reasons) |
| A tested line never meets the row | measured: 12 seeds of every chapter and 500 seeds of every chapter a switch touches, one table per switch; the engine inputs (resistance bytes, extra word) are asserted so a switch is shown to do something even where the line never casts the command |
| Tests that are blind | a mutation pass of 10 faults over `boss-data-corrections.ts` |

## 5. Limits

Which of these the game's scripts overwrite at run time (a script write beats the record) is read only where an earlier lane read it (Cid AGI, Gui rematch, Pagoda HP, the possessed aeons). A row whose script was not read keeps the record's number, as the note does. The Curse bit (extra word bit 10) follows FFX-G04's naming.
