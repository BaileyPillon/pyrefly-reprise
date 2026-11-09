# FFX Shinryu (Monster Arena original creation, underwater): m283 and formation `zzzz02_83`, read from the game's own files

**Game case: FFX only.** Shinryu is a creature of the FFX Monster Arena (CTB, the FFX monster files, the swimmers' water rules). No FFX-2 number is used; the FFX-2 "Shinryu" does not exist as a row.
Written 2026-11-07 by a Sonnet sub-agent of the release driver (program plan row 48, `PLAN.md` of 2026-11-06, wave 4). **Treeless research: no repo file, no art, no engine or data file is changed; nothing deployed; the game was not run; no browser, no GPU; Ghidra was not reachable (nothing read from it).** Authority (relayed words, verbatim): 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-11-07 "ok keep going we have full usage here"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is a recommendation, "driver's call, his to overturn".

**What is in this note:** numbers and described behaviour read from the unpacked FFX archive (read only) by the wave-3 lane's tools: the Atel disassembler `dump.mjs`, the record reader `rec.mjs` (unchanged), a new run of the **real hook bytecode** in the earlier AI lanes' interpreter (`t-shinryu.mjs`, harness `sim2.mjs` unchanged) and arithmetic on the repo's kernels (`calc-48.mjs`). No dialogue, no script text, no byte dumps.

**Tags.** **[R]** read from a game file; **[H]** run on the real bytecode (`t-shinryu.out.txt`); **[I]** inferred; **[G]** a guide (Jegged); **unmapped** raw value, no meaning claimed (AGENTS.md rule 6).

## Summary for the driver

1. **Shinryu is small as a script and large as a number.** `m283` is one stat record (**2,000,000 HP**, 72 MP, STR 92, DEF 60, MAG 86, MDF 98, AGI 70, ACC 200) and a script of three moves: each turn a draw `% 3`: **Shining** (8 hits of power 9, magical, the whole front line), **Eraser** (a magical Petrify, 255 chance, on one living member; **Attack instead when only one member is alive**), or **Attack**; and **every hit that takes HP is answered by a counter Attack on the hitter**. [R, H]
2. **It is a swimmer fight.** The formation has the in-water flag set and the foot-sound id 16, the same as the Via Purifico's Evrae Altana: a landed Petrify on a party member is a shatter (the member leaves the fight, no cure), so **Eraser is a one-member kill every time it lands**; the guides say "Eraser ignores Ribbon and Stoneproof, the only way round it is to win quickly" (Jegged). Only **Tidus, Wakka and Rikku** can swim, so they are the party. [R for the flag and rule (row 36's note, §2.2), G for the party]
3. **No gameplay hides in the 19 KB formation script:** it is camera work (intro, per-actor angles) and character pose draws; it sets no flag and ends nothing. The plan's "177 KB" is the monster file's size, almost all of it motion data (its script is 478 bytes of code). [R: `btl-zzzz02_83.txt`, `m283.txt`]
4. **Statuses:** immune to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and **Slow**; Threaten lands (chance byte 0); the positive statuses (Shell, Protect, Reflect, the four Nuls, Regen, Haste) can be put on him; no element absorbed, resisted or weak; not Armored; immune to Scan, Sensor, Distill, Eject, delay (CTB), Bribe. [R]
5. **The numbers to beat it:** 2,000,000 HP is **21 hits at the 99,999 cap**; a plain weapon at STR 255 with Break Damage Limit does 304,000 to 343,000 before the cap, so **every hit is 99,999** and the hits needed are the same 21 for a Celestial weapon; without Break Damage Limit it is 9,999 a hit (201 hits). His own damage is small against an endgame party (Attack 656 to 741 against Defense 255) but **Eraser is not damage**. [calc: `calc-48.out.txt`]
6. **Winnability is a race, not a wall.** At the caps (Auto-Haste, AGI 255) the swimmers act about every 4 ticks each and Shinryu every 15: about 11 party actions per Shinryu action, so 21 hits take about two of his turns; each turn he rolls Eraser one time in three. The risk is a thin party, not the boss. [calc, I]
7. **The plan's "shares row 36's build and sewer plate" is half right:** the plate is shared (`via-purifico-flooded-*` / `baaj-waterway`, installed r76b); **the build is not**: row 36's swimmers sit at the Highbridge cells (a story point), Shinryu is an endgame fight (Jegged: "properly levelled characters with their strongest weapons are a necessity"). The party is the Penance preset's Tidus, Wakka and Rikku with their Celestial weapons (`penance.ts`, `celestial-weapons.ts`). [G, R]
8. **Size.** Research is done here. One monster, three moves, a counter; about 19 h against the plan's 30 (preflight section 9).

## 0. Result in one screen

| Field | Value [R: `rec-m283.out.txt`] |
|---|---|
| File / name | `m283` Shinryu |
| HP / MP / overkill threshold | 2,000,000 / 72 / 99,999 |
| STR / DEF / MAG / MDF / AGI / LCK / EVA / ACC | 92 / 60 / 86 / 98 / 70 / 15 / 0 / 200 |
| Elements | none absorbed, immune, resisted or weak |
| Flags | ImmuneFractional, ImmuneLife, ImmuneSensor, ImmuneScanAgain; ImmuneCTB, ImmuneBribe (not Armored, not ImmuneSlice, not ImmunePhysical, not ImmuneMagical, not ImmuneHP) |
| Status bytes | Death, Zombie, Petrify, Poison, Power/Magic/Armor/Mental Break, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow 255; Threaten, Shell, Protect, Reflect, NulTide/Blaze/Shock/Frost, Regen, Haste 0 |
| Extra immunities | Scan, Eject, Auto-Life (word 0x301); Distill not (the word reads 0x301) |
| Commands | Attack 0x40f0, Eraser 0x40f6, Shining 0x40bf |
| Loot | AP 50,000 (also on overkill); gil 0; drop Wings to Discovery x1 (rare: Dark Matter x1), overkill x2 each; steal Gambler's Spirit (common) / Three Stars (rare); gear drop chance 255 with 14 base slots (ability rows not read) |
| Arena price field | 15,000 (the Monster Arena capture reward table, unmapped here) |
| Death | "Fiend" dissipation (pyreflies) |
| Formation | `zzzz02_83` (area 603, zone 1, **stage 106**): Shinryu alone; block bytes voice 0, byte 1 = 0, **foot 16, in-water 1**; party start slots (30.4,0,-7.3), (0.06,0,-28.0), (-26.1,0,-11.5) [R: `pos-zzzz02_83.txt`] |

The two Jegged figures match the file: "HP 2,000,000 (99,999), AP 50,000 (50,000), Gil 0, no elemental weaknesses or resistances, immune to virtually all negative statuses; drops Wings to Discovery (common) and Dark Matter (rare); steals Gambler's Spirit and Three Stars". [G, R agree]

## 1. Where he is and what unlocks him

A Monster Arena **original creation**: unlocked by capturing **two of each of the three underwater fiends on Mt. Gagazet** (Achelous, Maelspike, Splasher) [G: Jegged]; fought in the arena as a swimmer battle, so the party is forced to Tidus, Wakka and Rikku [G]. His formation sits beside the other arena creations (`zzzz02_76` Nemesis, `_77`, `_79`, `_80`, `_82`, `_83`) and shares the zone 603 that the arena launches from; no field event package launches it (the scan of the wave-3 lane found none for the neighbours either). [R, I]

## 2. The script (one worker, 478 bytes of code) [R, H]

* **Start:** death animation "fiend", no hit-reaction animations, motion values; no stat is overwritten (the record stands), no counter variable but a toggle unused by the turn.
* **Each turn (the turn hook): a draw `% 3`:**
  * **0 = Shining** on the whole front line;
  * **1 = Eraser** on one living member if **more than one is alive**, else **Attack** on the living one;
  * **2 = Attack** on a living member.
  The split is exactly 1/3 each with two or three alive; with one alive: Shining 1/3, Attack 2/3. [H: `t-shinryu.out.txt`]
* **When he is hit (the hit hook): if the last hit took any HP, a counter Attack on the last attacker.** Zero-damage hits do not; no other condition (no physical-only test, no counter-allowed test, no cap per round). [R, H]
* The "count of living members" is the script's read of the front line's alive property compared with 1; the harness reads a group property as the sum over the group (a count); the engine's exact group read is **unmapped** (the earlier lane's comment says "single actor"); if it returned a bit mask the one-alive case could differ for Wakka or Rikku alone. Irrelevant for the build (the last-member case ends the battle).

## 3. The moves (kernel rows; `rec-m283.out.txt`)

| Move | Row | Class and formula | Power | Target | Status | Cap |
|---|---|---|---:|---|---|---|
| Attack | 0x40f0 | physical, formula 1; accuracy formula 0 (always hits as far as the row reads) | 16 | one | none; crit 10 | 99,999 |
| Eraser | 0x40f6 | magical, formula 3 | 0 (no damage) | one | **Petrify 255** | 99,999 flag set |
| Shining | 0x40bf | magical, formula 3 | 9 x 8 hits | the front line (self-only/enemy-side/multi class) | none | 9,999 |

## 4. Numbers against a party (`calc-48.out.txt`)

Two example parties: **CAPS** (the repo's endgame preset: HP 9,999, DEF and MDF 255, AGI 255) and **MID** (HP 5,000, DEF 60, MDF 50, AGI 40).

| Move | vs CAPS | vs MID |
|---|---:|---:|
| Attack / the counter | 656 to 741 (328 to 370 with Protect) | 14,298 to 16,145 (7,149 to 8,072 with Protect) |
| Shining, one hit of eight | 75 to 84 (37 to 42 with Shell) | 1,785 to 2,015 |
| Shining, all eight on one target | 600 to 672 | 14,280 to 16,120 |
| Eraser | Petrify 255: a shatter in this formation | the same |

Clock: Shinryu AGI 70 → tick speed 5, rank-3 action 15 (7 hasted, 30 slowed; he is Slow-immune); swimmers at the caps → 9 (4 hasted); a MID swimmer → 21 (10 hasted). The party's hits: a plain Attack at STR 255 with Break Damage Limit is 304,129 to 343,413 before the cap, so **99,999 each**; **21 hits** drop 2,000,000 HP. [calc; the formulas are the repo's kernels]

## 5. Engine and art facts (checked against `origin/main` 63813367c by reading)

* **Exists:** the swimmers' build (`swimmers.ts`, Highbridge cells; not suitable, see summary 7), the in-water Petrify-shatter rule and the three-swimmer line-up with Escape/Flee/Switch off (the Flooded Ways chapter, number 36, `flooded-ways*.ts`), the counter hook and the hit-gauge scripts of the Omega/Ultima/Nemesis note, the Celestial weapons (`celestial-weapons.ts`, Break Damage Limit built in), the Penance party (`penance.ts`), the chain-less single-link chapter shape (Valefor at Besaid, Sanctuary Keeper).
* **New (small):** the three-move script with its counter (about 40 lines), the monster record, one `EnemyGroupDef` flagged in-water, a Shinryu painting.
* **Art:** no Shinryu exists. Plates installed in r76b: `via-purifico-flooded-1`, `-2`, `-3` (the Via Purifico under water) and `baaj-waterway`; nothing deeper. **Stage 106** (the game's stage for this fight) is the sea stage shared with the S.S. Liki and the arena test set; not rendered.

## 6. Conflicts and unknowns

| # | Item | Decision |
|---:|---|---|
| C1 | PLAN: "177 KB script" | the file is 177 KB; the script is 478 bytes of code (the rest is motion data); the formation script is 19 KB of camera work |
| C2 | PLAN: "shares row 36's build" | no: endgame swimmers (summary 7) |
| U1 | The engine's group read of the alive property | see §2; irrelevant to the build |
| U2 | The gear drop's ability rows | not read; not modelled |
| U3 | Stage 106's look | the art lane |
| U4 | Whether the arena start gives the party a free first turn / Auto-Haste | not read; the build says "Normal start" |

## Working files of the research lane (kept in the lane's scratch folder, not in the repo)

`m283.txt`, `btl-zzzz02_83.txt`, `pos-zzzz02_83.txt`, `rec-m283.out.txt`, `t-shinryu.mjs` with `t-shinryu.out.txt`, `calc-48.mjs` with `calc-48.out.txt`, `web/jegged-shinryu.txt`.
