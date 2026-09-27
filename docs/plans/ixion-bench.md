# Ixion at Djose — the human-pace bench (FFX-2 only)

**2026-09-27, branch `chapter-ixion`.** Printed by `tests/unit/chapters/ixion-bench.test.ts` (200 seeds a row),
lines in `tests/unit/helpers/ixionDrive.ts`. Measure, never tune: **no boss number moved** (AGENTS.md rule 6).

**Game case: FFX-2 only** [rule 14]: ATB, the Wait split, dresspheres, the fallen aeons' action counter.

## How it is measured

- **Human pace** = the live default, **Wait split**, 1.5 s a menu: 0.5 s on the top-level list with the clock
  running, 1.0 s inside a submenu (held). The model the Chapter XI and XIII benches use. **Bench** = zero
  decision time.
- **The party** = `src/data/ffx2/builds/djose.ts`: Yuna White Mage Lv 32, Rikku and Paine Dark Knight Lv 33 / 34
  (levels **our estimate**, research IX-14; dresspheres per research §5, Split_Infinity's "two Dark Knights and
  a White Mage").
- **sensible** (the guides' clear, research §4.5): Darkness from both Dark Knights (a Hi-Potion under 25 %); the
  White Mage revives, keeps Shell and Protect up, cures, and **answers the tell**: once the "Recharge" line is up
  and the Hammer has not come, Shell first, then everyone topped up (Mega-Potion or Pray for two or more under
  70 %, Curaga under 90 %).
- **naive**: Darkness; the White Mage revives, cures a girl under 40 % and otherwise Prays. No Shell, no Protect,
  the tell ignored.
- Columns: Ixion turns and party turns are `action-start`s per fight; "Fights with a Hammer" counts fights that
  saw at least one Thor's Hammer; every Hammer lands (`canMiss: false`, hard rule 5) on every living girl; "Hammers
  that KO'd" counts Hammers after which at least one girl was down; "Losses (after a Hammer)" counts the losses
  whose last Ixion action was the Hammer.

## Results (200 seeds a row)

| Line | Mode | Wins | Rate | Avg min | Ixion turns | Party turns | Hammers / fight | Fights with a Hammer | Hammers that KO'd | Losses (after a Hammer) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **sensible**, action time OFF (as built) | bench, D=0 | 5/200 | 2.5 % | 0.98 | 30.95 | 17.09 | 1.70 | 181/200 | 114 | 195 (20) |
| **sensible**, action time OFF (as built) | human, Wait split | 2/200 | 1.0 % | 0.88 | 28.14 | 13.77 | 1.55 | 190/200 | 140 | 198 (32) |
| **naive**, action time OFF (as built) | bench, D=0 | 0/200 | 0.0 % | 0.59 | 17.97 | 11.06 | 0.98 | 187/200 | 157 | 200 (50) |
| **naive**, action time OFF (as built) | human, Wait split | 0/200 | 0.0 % | 0.59 | 17.87 | 9.76 | 1.00 | 186/200 | 174 | 200 (60) |
| **sensible**, action time ON, 3 s (the switch) | bench, D=0 | 197/200 | 98.5 % | 2.06 | 23.79 | 35.67 | 1.65 | 200/200 | 10 | 3 (0) |
| **sensible**, action time ON, 3 s (the switch) | human, Wait split | **191/200** | **95.5 %** | 2.39 | 28.82 | 37.97 | 2.02 | 200/200 | 30 | 9 (1) |
| **naive**, action time ON, 3 s (the switch) | bench, D=0 | 90/200 | 45.0 % | 1.89 | 22.23 | 31.50 | 1.61 | 200/200 | 177 | 110 (33) |
| **naive**, action time ON, 3 s (the switch) | human, Wait split | **48/200** | **24.0 %** | 1.84 | 22.57 | 27.95 | 1.61 | 200/200 | 180 | 152 (40) |
| sensible; OPTION F-8 other reading: 2/3 : 1/3 (wiki) | human, switch OFF | 3/200 | 1.5 % | 0.81 | 26.02 | 12.31 | 1.36 | 180/200 | 115 | 197 (27) |
| sensible; OPTION F-8 other reading: 2/3 : 1/3 (wiki) | human, switch ON | 190/200 | 95.0 % | 2.41 | 29.09 | 38.06 | 2.02 | 200/200 | 30 | 10 (4) |
| sensible; OPTION Q4 / FA8 b: landed damage only feeds the counter | human, switch OFF | 2/200 | 1.0 % | 0.92 | 29.23 | 14.39 | 1.54 | 186/200 | 134 | 198 (33) |
| sensible; OPTION Q4 / FA8 b: landed damage only feeds the counter | human, switch ON | 194/200 | 97.0 % | 2.37 | 28.58 | 37.63 | 1.77 | 200/200 | 22 | 6 (1) |
| sensible; OPTION preset at the band's floor, Lv 30 / 30 / 30 | human, switch OFF | 2/200 | 1.0 % | 0.81 | 25.87 | 12.29 | 1.38 | 189/200 | 125 | 198 (37) |
| sensible; OPTION preset at the band's floor, Lv 30 / 30 / 30 | human, switch ON | 169/200 | 84.5 % | 3.31 | 41.09 | 49.74 | 2.96 | 200/200 | 76 | 31 (13) |
| sensible; OPTION preset at the band's top, Lv 36 / 36 / 36 | human, switch OFF | 11/200 | 5.5 % | 0.91 | 28.84 | 14.61 | 1.54 | 191/200 | 124 | 189 (24) |
| sensible; OPTION preset at the band's top, Lv 36 / 36 / 36 | human, switch ON | 199/200 | 99.5 % | 1.99 | 24.00 | 32.44 | 1.64 | 200/200 | 8 | 1 (0) |
| sensible; OPTION action time 1.5 s | human, switch OFF | 180/200 | 90.0 % | 2.21 | 39.71 | 38.88 | 2.58 | 200/200 | 33 | 20 (7) |
| naive; OPTION action time 1.5 s | human, switch OFF | 11/200 | 5.5 % | 1.36 | 23.95 | 23.41 | 1.58 | 200/200 | 183 | 189 (46) |

## What it says

1. **As built (action time off), the fight is almost unwinnable: 2 of 200 at human pace on the sensible line,
   0 of 200 naive.** The cause is speed, not damage: Ixion (Agility 138) takes about two actions for every one
   the Dark Knights take (28 against 14 per fight), so his 5/8 Aerosparks and Attacks outrun any healing and the
   fight is over in under a minute. It is the same finding Chapters XI (the Road) and XIII (Cloister 100) made,
   which Bailey answered there with 3 s of action time on those links only (a sourced rule `[verified: 2 sources]`
   whose length is unsourced, `research/ffx2-trema.md` §12.4).
2. **With the same switch on (3 s), the sensible line wins 191/200 (95.5 %) at human pace and the naive line
   48/200 (24 %)**: the fight teaches its answer. The gap is the tell: on the sensible line 30 Hammers of about
   404 left a girl down; on the naive line 180 of about 322.
3. **How often Thor's Hammer lands:** with the switch on, **every** fight sees it (200/200), **2.0 a fight** at
   human pace on the sensible line (1.6 naive). Off, 1.6 a fight in 190 of 200 fights, and it is usually the blow
   after which the party has no one left standing to heal.
4. **The open readings barely move it** (switch on, human pace): F-8's wiki split 95.0 %, FA8 b 97.0 %. The
   research's level band matters more: Lv 30 across 84.5 %, Lv 36 across 99.5 %.
5. The switch is `DJOSE_ACTION_TIME_ON` in `src/data/ffx2/enemies/ixion-djose.ts`, **off**, pinned by the bench.
   **Turning it on is Bailey's call.** The recommendation, labelled our estimate: on, at the same 3 s the Road and
   the Cloister ship, because it is the measured difference between a fight nobody wins and one that rewards
   reading the Recharge line.

## Not measured, and why

- **Thunder Spawn** (the wiki's grid) and **IX-2 b** (a Lightning Thor's Hammer the grid would absorb): the
  engine does not read a Garment Grid's `elementEater` (Lightning Eater, Fire Eater, ...): the field is written
  in `src/data/ffx2/garment-grids/early.ts` and read by nothing (checked in a probe: Thundara hit a Thunder Spawn
  girl for the same damage). No shipped build wears an Eater grid. Reported as a finding, not fixed here (combat
  core; its own review).
- **Water** (his weakness): the preset carries no Water ability (the guides that use it bring a Black Mage or
  Warrior, research §4.5). The Water weakness itself is in the data and tested.
