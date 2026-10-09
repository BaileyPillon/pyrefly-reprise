# FFX command records: the game's own table, and how our abilities map to it

**Game case: FFX only.** FFX-2 has its own tables in its own exe. Part of the `re-parity` track
([docs/plans/re-parity.md](../docs/plans/re-parity.md)), batch W1 (the FFX hit, critical and damage kernels wired into the
engine; [docs/handoff/re-parity-w1.md](../docs/handoff/re-parity-w1.md)). Drafted 2026-10-08.

**Source note (applies to every statement below unless a line says otherwise):** the battle kernel tables of the Steam
HD Remaster, build 25501027 (`FFX.exe` SHA-256 0537B2A1...686D): `item.bin`, `command.bin`, `monmagic1.bin` and
`monmagic2.bin`, read with the earlier lane's VBF reader (`D:\Tools\rea\tools\ffx-names.mjs`). Everything is written in
our own words and numbers only: no game code and no game text is reproduced here (a record's name is the name the data
layer already uses for the same ability).

| This note | Where it lives in the repo |
|---|---|
| §1 the records and their layout | `tests/fixtures/parity/ffx/command_records.json` (all 979 records, numbers only) |
| §2 how an ability was matched to a record | `src/data/ffx/command-records/` (the five fields attached to each ability) |
| §3 the table, ability to record | `tests/unit/data-ffx-command-records.test.ts` pins it against the fixture |
| §4 where our numbers and flags differ from the game's | the same test pins the number list |
| §5 inputs the records do not carry | `src/battle/ffx/equipment.ts`, `tests/unit/data-ffx-command-records.test.ts` |
| §6 an enemy's plain Attack | `EnemyDef.plainAttack`, `src/data/ffx/command-records/enemies.ts` |

## 1. The records, and how they were read

979 records in four tables, each indexed from its own base: items 112 (ids 0x2000 + n), commands 320 (0x3000 + n), monster
magic 1 300 (0x4000 + n), monster magic 2 247 (0x6000 + n). A record is 96 bytes (items, commands) or 92 (monster magic);
these are the same offsets as the in-memory command record the exe's functions read (`Cmd+0xNN`), so the kernels'
inputs are read straight off the table:

| Offset | Meaning | Used by |
|---|---|---|
| 0x17 | command type: 0 attack and skills, 1 black magic, 2 white magic, 4 the Overdrive family | Magic Booster boosts 1 and 2 |
| 0x1c (u32) | flag word 1: bits 3 to 5 the accuracy formula (0 always hits), 6 Darkness applies, 7 reflectable, 8 absorb (drain sign), 13 Delay Attack, 14 Delay Buster, 16 pierces Armored, 18 uses the weapon, 23 no effect on the living | hit check, modifier chain, Delay |
| 0x20 (u16) | flag word 2: bits 0 and 1 the damage type (1 physical, 2 magical), 2 can crit, 3 crit bonus from equipment, 4 heals, 5 cleanses, 6 cap 9999, 7 cap 99999 | critical check, modifier chain, cap |
| 0x23 | damage classes: 1 HP, 2 MP, 4 CTB | which pools a hit touches |
| 0x27 | crit bonus byte | critical check |
| 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d | formula, accuracy byte, power, hits, shatter chance, element | base damage, hit check |

Checks made on the read:

- The Japanese PC copy of each table (the tool reads that one) and the US PC copy are **byte-identical from offset 0x10
  on in all 979 records**; only the text offsets in the header differ.
- The anchor lane's dump `D:\Tools\ffx-parity\ffx\data\command-accuracy.tsv` (979 rows, made from the exe's own struct
  layout) agrees with this read on accuracy formula, accuracy byte, Darkness bit, reflectable bit, formula, power,
  damage class, hits and the can-crit bit: **0 differences in 979 rows**.
- The data layer's own game-row citations (for example "row 4:92", Pterya's attack on Yuna, which is 0x405c) land on the
  record this note matches, in all 16 rows checked.

## 2. How an ability was matched to a record

An ability is matched to the record of the same name whose fields agree with its own (formula, power, element, hits,
accuracy byte, shatter chance, and the crit, Darkness, heal and cap flags), preferring the table its category lives in
(items to the item table, boss abilities to the monster tables, the rest to the command table) and, for a boss ability,
a record in that monster's own command list. Where several records of one name tie, a hand pick follows the order the
game keeps its records in (the six aeons' Attack records and the Magus Sisters' are in aeon order; the monster-side aeon
commands 0x60d3 to 0x60e6 are in the player aeons' order). A tie between records whose type byte, both flag words and
damage classes are identical changes nothing the kernels read, so the lowest id is kept and the others are listed.

- exact: 326
- name: 78
- manual: 24
- tie-identical: 23
- no-record: 3

("exact" is formula, power and element all equal; "same name" is the record of that name nearest to ours, either because
the ability deals no damage and ours is written as formula `none` while the game's is formula 3 or 6 with power 0, or
because our number differs from the game's, listed in §4; "tie, same fields" is a tie between records the kernels
cannot tell apart; "by hand" is a pick made from the record order.)

Three abilities have no record because they are ours and the game has no command by that name: `close-in` (an Evrae
chapter Trigger Command), `mac-seymour-idle` (a scripted idle line) and `omnis-volley` (the engine's wrapper around
Seymour Omnis's four disc spells, which have their own records).

## 3. The table, ability to record

| Ability | Record | Match |
|---|---|---|
| `cure` | 0x302b | exact |
| `cura` | 0x302c | exact |
| `curaga` | 0x302d | exact |
| `esuna` | 0x3033 | same name, our numbers differ or are not damage |
| `dispel` | 0x303d | same name, our numbers differ or are not damage |
| `life` | 0x3034 | exact |
| `full-life-spell` | 0x3035 | exact |
| `auto-life` | 0x3040 | same name, our numbers differ or are not damage |
| `regen` | 0x303e | same name, our numbers differ or are not damage |
| `holy` | 0x303f | exact |
| `protect` | 0x303b | same name, our numbers differ or are not damage |
| `shell` | 0x303a | same name, our numbers differ or are not damage |
| `reflect` | 0x303c | same name, our numbers differ or are not damage |
| `nulblaze` | 0x302f | same name, our numbers differ or are not damage |
| `nulfrost` | 0x302e | same name, our numbers differ or are not damage |
| `nulshock` | 0x3030 | same name, our numbers differ or are not damage |
| `nultide` | 0x3031 | same name, our numbers differ or are not damage |
| `haste` | 0x3036 | exact |
| `hastega` | 0x3037 | exact |
| `slow` | 0x3038 | exact |
| `slowga` | 0x3039 | exact |
| `fire` | 0x3042 | exact |
| `blizzard` | 0x3041 | exact |
| `thunder` | 0x3043 | exact |
| `water` | 0x3044 | exact |
| `fira` | 0x3045 | exact |
| `blizzara` | 0x3046 | exact |
| `thundara` | 0x3047 | exact |
| `watera` | 0x3048 | exact |
| `firaga` | 0x3049 | exact |
| `blizzaga` | 0x304a | exact |
| `thundaga` | 0x304b | exact |
| `waterga` | 0x304c | exact |
| `bio` | 0x304d | exact |
| `demi` | 0x304e | exact |
| `death` | 0x304f | by hand |
| `drain` | 0x3050 | exact |
| `osmose-spell` | 0x3051 | exact |
| `flare` | 0x3052 | exact |
| `ultima` | 0x3053 | exact |
| `cheer` | 0x301a | exact |
| `aim` | 0x301b | exact |
| `focus` | 0x301c | exact |
| `reflex` | 0x301d | exact |
| `luck` | 0x301e | exact |
| `jinx` | 0x301f | exact |
| `pray` | 0x3019 | exact |
| `entrust` | 0x3027 | exact |
| `guard` | 0x3022 | exact |
| `sentinel` | 0x3023 | exact |
| `provoke` | 0x3026 | exact |
| `threaten` | 0x3025 | exact |
| `scan` | 0x3032 | same name, our numbers differ or are not damage |
| `lancet` | 0x3020 | same name, our numbers differ or are not damage |
| `spare-change` | 0x3024 | exact |
| `steal` | 0x3016 | exact |
| `mug` | 0x3014 | exact |
| `bribe` | 0x302a | exact |
| `pilfer-gil` | 0x3058 | exact |
| `nab-gil` | 0x305e | exact |
| `quick-pockets` | 0x305f | exact |
| `copycat` | 0x3028 | exact |
| `doublecast` | 0x3029 | exact |
| `use` | 0x3017 | exact |
| `sleep-attack` | 0x3008 | exact |
| `silence-attack` | 0x3009 | exact |
| `dark-attack` | 0x300a | exact |
| `zombie-attack` | 0x300b | exact |
| `sleep-buster` | 0x300c | exact |
| `silence-buster` | 0x300d | exact |
| `dark-buster` | 0x300e | exact |
| `triple-foul` | 0x300f | exact |
| `delay-attack` | 0x3006 | exact |
| `delay-buster` | 0x3007 | exact |
| `power-break` | 0x3010 | exact |
| `magic-break` | 0x3011 | exact |
| `armor-break` | 0x3012 | exact |
| `mental-break` | 0x3013 | exact |
| `full-break` | 0x3059 | exact |
| `quick-hit` | 0x3015 | exact |
| `extract-power` | 0x305a | exact |
| `extract-mana` | 0x305b | exact |
| `extract-speed` | 0x305c | exact |
| `extract-ability` | 0x305d | exact |
| `spiral-cut` | 0x3060 | exact |
| `slice-and-dice` | 0x3061 | exact |
| `energy-rain` | 0x3062 | exact |
| `blitz-ace` | 0x3063 | exact |
| `dragon-fang` | 0x3065 | exact |
| `shooting-star` | 0x3064 | exact |
| `banishing-blade` | 0x3066 | exact |
| `tornado` | 0x3067 | same name, our numbers differ or are not damage |
| `element-reels` | 0x3074 | same name, our numbers differ or are not damage |
| `attack-reels` | 0x3075 | by hand |
| `status-reels` | 0x3076 | same name, our numbers differ or are not damage |
| `aurochs-reels` | 0x3077 | same name, our numbers differ or are not damage |
| `fire-shot` | 0x30ef | tie, same fields (also 0x30f0) |
| `ice-shot` | 0x30f1 | tie, same fields (also 0x30f2) |
| `water-shot` | 0x30f3 | tie, same fields (also 0x30f4) |
| `thunder-shot` | 0x30f5 | tie, same fields (also 0x30f6) |
| `havoc-shot` | 0x30f7 | tie, same fields (also 0x30f8) |
| `break-shot` | 0x30fb | tie, same fields (also 0x30fc) |
| `time-shot` | 0x30f9 | tie, same fields (also 0x30fa) |
| `aurochs-shot` | 0x30fd | exact |
| `power-shot` | 0x30fe | exact |
| `attack-reels-hit` | 0x312e | by hand |
| `fire-fury` | 0x3079 | exact |
| `blizzard-fury` | 0x3078 | exact |
| `thunder-fury` | 0x307a | exact |
| `water-fury` | 0x307b | exact |
| `fira-fury` | 0x307c | exact |
| `blizzara-fury` | 0x307d | exact |
| `thundara-fury` | 0x307e | exact |
| `watera-fury` | 0x307f | exact |
| `firaga-fury` | 0x3080 | exact |
| `blizzaga-fury` | 0x3081 | exact |
| `thundaga-fury` | 0x3082 | exact |
| `waterga-fury` | 0x3083 | exact |
| `bio-fury` | 0x3084 | exact |
| `demi-fury` | 0x3085 | exact |
| `death-fury` | 0x3086 | exact |
| `drain-fury` | 0x3087 | exact |
| `osmose-fury` | 0x3088 | exact |
| `flare-fury` | 0x3089 | exact |
| `ultima-fury` | 0x308a | exact |
| `jump` | 0x3068 | exact |
| `fire-breath` | 0x3069 | exact |
| `seed-cannon` | 0x306a | exact |
| `self-destruct` | 0x306b | exact |
| `thrust-kick` | 0x306c | exact |
| `stone-breath` | 0x306d | exact |
| `aqua-breath` | 0x306e | exact |
| `doom` | 0x306f | exact |
| `white-wind` | 0x3070 | exact |
| `bad-breath` | 0x3071 | exact |
| `mighty-guard` | 0x3072 | exact |
| `nova` | 0x3073 | exact |
| `grand-summon` | 0x3118 | exact |
| `flee` | 0x3018 | exact |
| `talk` | 0x3105 | exact |
| `fury` | 0x311d | exact |
| `pull-back` | 0x3107 | exact |
| `close-in` | none | an Evrae chapter Trigger Command (ours): no game record |
| `valefor-attack` | 0x30cb | by hand |
| `sonic-wings` | 0x30cc | exact |
| `energy-ray` | 0x30ce | exact |
| `energy-blast` | 0x30cd | exact |
| `ifrit-attack` | 0x30cf | by hand |
| `meteor-strike` | 0x30d0 | exact |
| `hellfire` | 0x30d1 | exact |
| `ixion-attack` | 0x30d2 | by hand |
| `aerospark` | 0x30d3 | exact |
| `thors-hammer` | 0x30d4 | exact |
| `shiva-attack` | 0x30d5 | by hand |
| `heavenly-strike` | 0x30d6 | exact |
| `diamond-dust` | 0x30d7 | exact |
| `bahamut-attack` | 0x30d8 | by hand |
| `impulse` | 0x30d9 | exact |
| `mega-flare` | 0x30da | exact |
| `anima-attack` | 0x30db | by hand |
| `pain` | 0x30dc | exact |
| `oblivion` | 0x30dd | exact |
| `daigoro` | 0x30de | exact |
| `kozuka` | 0x30df | exact |
| `wakizashi-single` | 0x30e0 | tie, same fields (also 0x30e1) |
| `wakizashi-multi` | 0x30e0 | tie, same fields (also 0x30e1) |
| `zanmato` | 0x30e2 | same name, our numbers differ or are not damage |
| `cindy-attack` | 0x30e4 | by hand |
| `sandy-attack` | 0x30e6 | by hand |
| `mindy-attack` | 0x30e8 | by hand |
| `camisade` | 0x30e5 | exact |
| `razzia` | 0x30e7 | exact |
| `passado` | 0x30e9 | exact |
| `nul-all-aeon` | 0x312d | by hand |
| `delta-attack` | 0x30ea | exact |
| `shield` | 0x3054 | exact |
| `boost` | 0x3055 | exact |
| `dismiss` | 0x3056 | by hand |
| `mix` | 0x311e | exact |
| `mix-ultra-potion` | 0x30ac | exact |
| `mix-panacea` | 0x30ad | same name, our numbers differ or are not damage |
| `mix-ultra-cure` | 0x30ae | exact |
| `mix-mega-phoenix` | 0x30af | exact |
| `mix-final-phoenix` | 0x30b0 | exact |
| `mix-elixir` | 0x30b1 | exact |
| `mix-megalixir` | 0x30b2 | exact |
| `mix-super-elixir` | 0x30b3 | exact |
| `mix-final-elixir` | 0x30b4 | exact |
| `mix-nul-all` | 0x30b5 | by hand |
| `mix-mega-nul-all` | 0x30b6 | same name, our numbers differ or are not damage |
| `mix-hyper-nul-all` | 0x30b7 | same name, our numbers differ or are not damage |
| `mix-ultra-nul-all` | 0x30b8 | same name, our numbers differ or are not damage |
| `mix-mighty-wall` | 0x30b9 | same name, our numbers differ or are not damage |
| `mix-mighty-g` | 0x30ba | same name, our numbers differ or are not damage |
| `mix-super-mighty-g` | 0x30bb | same name, our numbers differ or are not damage |
| `mix-hyper-mighty-g` | 0x30bc | same name, our numbers differ or are not damage |
| `mix-vitality` | 0x30bd | same name, our numbers differ or are not damage |
| `mix-mega-vitality` | 0x30be | same name, our numbers differ or are not damage |
| `mix-hyper-vitality` | 0x30bf | same name, our numbers differ or are not damage |
| `mix-mana` | 0x30c0 | same name, our numbers differ or are not damage |
| `mix-mega-mana` | 0x30c1 | same name, our numbers differ or are not damage |
| `mix-hyper-mana` | 0x30c2 | same name, our numbers differ or are not damage |
| `mix-freedom` | 0x30c3 | same name, our numbers differ or are not damage |
| `mix-freedom-x` | 0x30c4 | same name, our numbers differ or are not damage |
| `mix-quartet-of-9` | 0x30c5 | same name, our numbers differ or are not damage |
| `mix-trio-of-9999` | 0x30c6 | same name, our numbers differ or are not damage |
| `mix-hero-drink` | 0x30c7 | same name, our numbers differ or are not damage |
| `mix-miracle-drink` | 0x30c8 | same name, our numbers differ or are not damage |
| `mix-hot-spurs` | 0x30c9 | same name, our numbers differ or are not damage |
| `mix-eccentrick` | 0x30ca | same name, our numbers differ or are not damage |
| `mix-grenade` | 0x308b | exact |
| `mix-frag-grenade` | 0x308c | exact |
| `mix-potato-masher` | 0x308e | exact |
| `mix-cluster-bomb` | 0x308f | exact |
| `mix-tallboy` | 0x3090 | exact |
| `mix-chaos-grenade` | 0x3094 | exact |
| `mix-firestorm` | 0x3096 | exact |
| `mix-abaddon-flame` | 0x3099 | exact |
| `mix-burning-soul` | 0x3097 | exact |
| `mix-nega-burst` | 0x30a9 | exact |
| `mix-black-hole` | 0x30aa | exact |
| `mix-sunburst` | 0x30ab | exact |
| `potion` | 0x2000 | exact |
| `hi-potion` | 0x2001 | exact |
| `x-potion` | 0x2002 | exact |
| `mega-potion` | 0x2003 | exact |
| `ether` | 0x2004 | exact |
| `turbo-ether` | 0x2005 | exact |
| `elixir` | 0x2008 | exact |
| `megalixir` | 0x2009 | exact |
| `phoenix-down` | 0x2006 | exact |
| `mega-phoenix` | 0x2007 | exact |
| `al-bhed-potion` | 0x2014 | exact |
| `healing-water` | 0x2015 | exact |
| `tetra-elemental` | 0x2016 | exact |
| `antidote` | 0x200a | same name, our numbers differ or are not damage |
| `soft` | 0x200b | same name, our numbers differ or are not damage |
| `eye-drops` | 0x200c | same name, our numbers differ or are not damage |
| `echo-screen` | 0x200d | same name, our numbers differ or are not damage |
| `holy-water` | 0x200e | same name, our numbers differ or are not damage |
| `remedy` | 0x200f | same name, our numbers differ or are not damage |
| `chocobo-feather` | 0x2036 | exact |
| `chocobo-wing` | 0x2037 | exact |
| `lunar-curtain` | 0x2038 | same name, our numbers differ or are not damage |
| `light-curtain` | 0x2039 | same name, our numbers differ or are not damage |
| `star-curtain` | 0x203a | same name, our numbers differ or are not damage |
| `healing-spring` | 0x203b | same name, our numbers differ or are not damage |
| `stamina-tablet` | 0x2040 | exact |
| `mana-tablet` | 0x2041 | exact |
| `twin-stars` | 0x2042 | exact |
| `stamina-tonic` | 0x2043 | exact |
| `mana-tonic` | 0x2044 | exact |
| `three-stars` | 0x2045 | exact |
| `candle-of-life` | 0x2030 | exact |
| `power-distiller` | 0x2010 | same name, our numbers differ or are not damage |
| `mana-distiller` | 0x2011 | same name, our numbers differ or are not damage |
| `speed-distiller` | 0x2012 | same name, our numbers differ or are not damage |
| `ability-distiller` | 0x2013 | same name, our numbers differ or are not damage |
| `grenade` | 0x2023 | exact |
| `frag-grenade` | 0x2024 | exact |
| `sleeping-powder` | 0x2025 | exact |
| `dream-powder` | 0x2026 | exact |
| `silence-grenade` | 0x2027 | exact |
| `smoke-bomb` | 0x2028 | exact |
| `petrify-grenade` | 0x2031 | exact |
| `poison-fang` | 0x202d | exact |
| `antarctic-wind` | 0x2017 | exact |
| `bomb-fragment` | 0x201a | exact |
| `electro-marble` | 0x201d | exact |
| `fish-scale` | 0x2020 | exact |
| `arctic-wind` | 0x2018 | exact |
| `bomb-core` | 0x201b | exact |
| `lightning-marble` | 0x201e | exact |
| `dragon-scale` | 0x2021 | exact |
| `ice-gem` | 0x2019 | exact |
| `fire-gem` | 0x201c | exact |
| `lightning-gem` | 0x201f | exact |
| `water-gem` | 0x2022 | exact |
| `shadow-gem` | 0x2029 | exact |
| `shining-gem` | 0x202a | exact |
| `blessed-gem` | 0x202b | exact |
| `supreme-gem` | 0x202c | exact |
| `purifying-salt` | 0x203f | exact |
| `silver-hourglass` | 0x202e | exact |
| `gold-hourglass` | 0x202f | exact |
| `farplane-shadow` | 0x2032 | exact |
| `farplane-wind` | 0x2033 | exact |
| `mana-spring` | 0x203c | exact |
| `stamina-spring` | 0x203d | exact |
| `soul-spring` | 0x203e | exact |
| `dark-matter` | 0x2035 | exact |
| `hp-sphere` | 0x2055 | exact |
| `return-sphere` | 0x2060 | exact |
| `mp-sphere` | 0x2056 | exact |
| `ability-sphere` | 0x2049 | exact |
| `blk-magic-sphere` | 0x204f | exact |
| `special-sphere` | 0x204c | exact |
| `lv-3-key-sphere` | 0x2053 | exact |
| `lv-4-key-sphere` | 0x2054 | exact |
| `lance-of-atrophy` | 0x6078 | exact |
| `full-life` | 0x60f5 | exact |
| `cross-cleave` | 0x6074 | exact |
| `total-annihilation` | 0x6075 | exact |
| `flare-self` | 0x6079 | exact |
| `banish` | 0x6050 | same name, our numbers differ or are not damage |
| `mortibsorption` | 0x60a9 | exact |
| `slowga-counter` | 0x608d | exact |
| `dispelling-slap` | 0x607c | exact |
| `absorb` | 0x606d | exact |
| `osmose` | 0x607a | exact |
| `hellbiter` | 0x6080 | exact |
| `mind-blast` | 0x6081 | exact |
| `mind-blast-aeon` | 0x6081 | exact |
| `mega-death` | 0x6082 | same name, our numbers differ or are not damage |
| `blind-counter` | 0x6070 | same name, our numbers differ or are not damage |
| `silence-counter` | 0x606e | same name, our numbers differ or are not damage |
| `sleep-counter` | 0x6071 | same name, our numbers differ or are not damage |
| `metamorphosis-1` | 0x607e | tie, same fields (also 0x607f) |
| `metamorphosis-2` | 0x607e | tie, same fields (also 0x607f) |
| `left-arm-strike` | 0x60c6 | exact |
| `left-arm-strike-2` | 0x60c7 | by hand |
| `jecht-beam` | 0x6084 | tie, same fields (also 0x608a) |
| `triumphant-grasp` | 0x6085 | exact |
| `triumphant-grasp-2` | 0x60c9 | exact |
| `jecht-bomber` | 0x6087 | by hand |
| `jecht-bomber-2` | 0x60c8 | exact |
| `draws-sword` | 0x6088 | exact |
| `blade-blitz` | 0x6089 | exact |
| `ultimate-jecht-shot` | 0x6086 | exact |
| `power-wave-bfa` | 0x608b | tie, same fields (also 0x60d2) |
| `power-wave-aeon` | 0x608b | tie, same fields (also 0x60d2) |
| `yu-pagoda-curse` | 0x607b | exact |
| `gravija` | 0x6083 | exact |
| `yu-yevon-command-254` | 0x60f4 | exact |
| `possessed-valefor-sonic-wings` | 0x60d3 | by hand |
| `possessed-valefor-energy-ray` | 0x60d5 | exact |
| `possessed-valefor-energy-blast` | 0x60d4 | same name, our numbers differ or are not damage |
| `possessed-ifrit-meteor-strike` | 0x60d6 | same name, our numbers differ or are not damage |
| `possessed-ifrit-hellfire` | 0x60d7 | same name, our numbers differ or are not damage |
| `possessed-ixion-aerospark` | 0x60d8 | by hand |
| `possessed-ixion-thors-hammer` | 0x60d9 | same name, our numbers differ or are not damage |
| `possessed-shiva-heavenly-strike` | 0x60da | by hand |
| `possessed-shiva-diamond-dust` | 0x60db | same name, our numbers differ or are not damage |
| `possessed-bahamut-impulse` | 0x60dc | by hand |
| `possessed-bahamut-mega-flare` | 0x60dd | by hand |
| `possessed-anima-pain` | 0x60de | same name, our numbers differ or are not damage |
| `possessed-anima-oblivion` | 0x60df | same name, our numbers differ or are not damage |
| `possessed-yojimbo-daigoro` | 0x40b1 | by hand |
| `possessed-yojimbo-zanmato` | 0x60e2 | same name, our numbers differ or are not damage |
| `possessed-cindy-camisade` | 0x60e3 | same name, our numbers differ or are not damage |
| `possessed-cindy-delta-attack` | 0x60e6 | same name, our numbers differ or are not damage |
| `possessed-sandy-razzia` | 0x60e4 | same name, our numbers differ or are not damage |
| `possessed-mindy-passado` | 0x60e5 | exact |
| `mac-blizzara` | 0x3046 | exact |
| `mac-thundara` | 0x3047 | exact |
| `mac-watera` | 0x3048 | exact |
| `mac-fira` | 0x3045 | exact |
| `mac-blizzaga` | 0x304a | exact |
| `mac-thundaga` | 0x304b | exact |
| `mac-waterga` | 0x304c | exact |
| `mac-firaga` | 0x3049 | exact |
| `mac-multi-blizzara` | 0x60ad | exact |
| `mac-multi-thundara` | 0x60af | exact |
| `mac-multi-watera` | 0x60b1 | exact |
| `mac-multi-fira` | 0x60ab | exact |
| `mac-seymour-idle` | none | a scripted idle line of the Macalania Seymour (ours): no game record |
| `guardian-blizzard` | 0x603a | same name, our numbers differ or are not damage |
| `guardian-thunder` | 0x603b | same name, our numbers differ or are not damage |
| `guardian-auto-potion` | 0x4010 | exact |
| `guardian-hi-potion` | 0x603e | exact |
| `guardian-remedy` | 0x6040 | same name, our numbers differ or are not damage |
| `guardian-remedy-self` | 0x6040 | same name, our numbers differ or are not damage |
| `guardian-shremedy` | 0x6041 | same name, our numbers differ or are not damage |
| `anima-boost` | 0x3055 | exact |
| `anima-pain-boss` | 0x60de | exact |
| `anima-oblivion` | 0x60df | exact |
| `evrae-attack` | 0x407f | tie, same fields (also 0x4098, 0x409b, 0x409d, 0x409f) |
| `evrae-swooping-scythe` | 0x605b | exact |
| `evrae-poison-breath` | 0x6061 | exact |
| `evrae-stone-gaze` | 0x4038 | tie, same fields (also 0x40a9) |
| `evrae-photon-spray` | 0x6063 | exact |
| `evrae-inhale` | 0x6064 | exact |
| `evrae-out-of-breath-range` | 0x6065 | exact |
| `evrae-haste` | 0x3036 | exact |
| `cid-guided-missiles` | 0x6073 | exact |
| `yojimbo-daigoro` | 0x4086 | exact |
| `yojimbo-kozuka` | 0x4082 | exact |
| `yojimbo-wakizashi` | 0x4083 | exact |
| `yojimbo-zanmato` | 0x4085 | exact |
| `daigoro-attack` | 0x40b1 | exact |
| `natus-multi-fira` | 0x60ab | exact |
| `natus-multi-blizzara` | 0x60ad | exact |
| `natus-multi-thundara` | 0x60af | exact |
| `natus-multi-watera` | 0x60b1 | exact |
| `natus-break` | 0x604f | same name, our numbers differ or are not damage |
| `natus-flare` | 0x6079 | same name, our numbers differ or are not damage |
| `mortibody-fire` | 0x6039 | exact |
| `mortibody-blizzard` | 0x603a | exact |
| `mortibody-thunder` | 0x603b | exact |
| `mortibody-water` | 0x603c | exact |
| `mortibody-shattering-claw` | 0x6076 | exact |
| `mortibody-desperado` | 0x605e | exact |
| `mortibody-cura` | 0x302c | exact |
| `omnis-fira` | 0x3045 | exact |
| `omnis-blizzara` | 0x3046 | exact |
| `omnis-thundara` | 0x3047 | exact |
| `omnis-watera` | 0x3048 | exact |
| `omnis-firaga` | 0x3049 | exact |
| `omnis-blizzaga` | 0x304a | exact |
| `omnis-thundaga` | 0x304b | exact |
| `omnis-waterga` | 0x304c | exact |
| `omnis-dispel` | 0x303d | same name, our numbers differ or are not damage |
| `omnis-ultima` | 0x60f0 | exact |
| `omnis-volley` | none | the engine's volley wrapper for Seymour Omnis's four disc spells (ours): the four spells have their own records |
| `grothia-attack` | 0x4000 | exact |
| `grothia-attack-yuna` | 0x407f | by hand |
| `grothia-fira` | 0x3045 | exact |
| `grothia-hellfire` | 0x405e | tie, same fields (also 0x40e6) |
| `pterya-attack` | 0x4000 | exact |
| `pterya-attack-yuna` | 0x405c | exact |
| `pterya-sonic-wings` | 0x405d | exact |
| `pterya-energy-ray` | 0x403d | exact |
| `spathi-countdown` | 0x6028 | exact |
| `spathi-mega-flare` | 0x405f | exact |
| `overdrive-sin-drawn` | 0x6029 | exact |
| `overdrive-sin-gaze-petrify` | 0x609d | tie, same fields (also 0x609e, 0x609f) |
| `overdrive-sin-gaze-confuse` | 0x609d | tie, same fields (also 0x609e, 0x609f) |
| `overdrive-sin-gaze-zombie` | 0x609d | tie, same fields (also 0x609e, 0x609f) |
| `overdrive-sin-gaze-aeon` | 0x60a0 | exact |
| `overdrive-sin-giga-graviton` | 0x609c | exact |
| `sin-fin-ram` | 0x6092 | exact |
| `sin-fin-smack` | 0x6093 | exact |
| `sin-fin-gravija` | 0x6090 | tie, same fields (also 0x6094, 0x60b6) |
| `sin-fin-gravija-far` | 0x60a6 | exact |
| `sin-fin-negation` | 0x6091 | tie, same fields (also 0x60a7, 0x60b7, 0x60c5) |
| `sin-fin-negation-far` | 0x6091 | tie, same fields (also 0x60a7, 0x60b7, 0x60c5) |
| `sin-fin-gathers` | 0x60c4 | exact |
| `sin-motionless` | 0x60bc | exact |
| `sin-genais-venom` | 0x6097 | exact |
| `sin-genais-thrashing` | 0x6098 | exact |
| `sin-genais-sigh` | 0x6096 | exact |
| `sin-genais-waterga` | 0x304c | exact |
| `sin-genais-cura` | 0x302c | exact |
| `sin-genais-shell-in` | 0x609a | exact |
| `sin-genais-shell-out` | 0x6099 | exact |
| `sin-magic-absorbed` | 0x609b | exact |
| `sin-core-inactive` | 0x60bd | exact |
| `sin-core-gathers` | 0x60c4 | exact |
| `sin-core-gravija` | 0x6094 | exact |
| `sin-core-negation` | 0x60c5 | exact |
| `sin-core-fire` | 0x6039 | exact |
| `sin-core-blizzard` | 0x603a | exact |
| `sin-core-thunder` | 0x603b | exact |
| `sin-core-water` | 0x603c | exact |

## 4. Where our data differs from the game's

### 4.1 Numbers our abilities carry themselves

The wiring keeps every number the ability data already carries (formula, power, element, hits, accuracy byte, crit byte)
and does not retune one (Bailey's rule). The rows below are where those numbers differ from the record's; each is a
sourced decision for Bailey. `tests/unit/data-ffx-command-records.test.ts` pins this list, so fixing or adding a
difference must change it on purpose.

| Ability | Field | Ours | Game's |
|---|---|---:|---:|
| `lancet` | formula | 4 | 3 |
| `blitz-ace` | hits | 8 | 9 |
| `tornado` | power | 20 | 15 |
| `attack-reels-hit` | hits | 12 | 1 |
| `lance-of-atrophy` | accuracy | 255 | 120 |
| `cross-cleave` | accuracy | 100 | 0 |
| `mortibsorption` | accuracy | 255 | 0 |
| `dispelling-slap` | accuracy | 255 | 0 |
| `hellbiter` | accuracy | 255 | 100 |
| `left-arm-strike` | accuracy | 100 | 0 |
| `left-arm-strike-2` | accuracy | 100 | 0 |
| `jecht-beam` | accuracy | 255 | 0 |
| `jecht-bomber` | accuracy | 255 | 0 |
| `jecht-bomber-2` | accuracy | 255 | 0 |
| `ultimate-jecht-shot` | accuracy | 255 | 0 |
| `possessed-valefor-sonic-wings` | power | 28 | 16 |
| `possessed-valefor-energy-blast` | power | 75 | 48 |
| `possessed-ifrit-meteor-strike` | power | 29 | 17 |
| `possessed-ifrit-hellfire` | element | 0 | 1 |
| `possessed-ixion-aerospark` | power | 30 | 16 |
| `possessed-ixion-thors-hammer` | element | 0 | 4 |
| `possessed-shiva-heavenly-strike` | power | 30 | 17 |
| `possessed-shiva-diamond-dust` | element | 0 | 2 |
| `possessed-bahamut-impulse` | power | 36 | 16 |
| `possessed-bahamut-mega-flare` | power | 72 | 65 |
| `possessed-anima-pain` | power | 20 | 28 |
| `possessed-anima-oblivion` | formula | 15 | 1 |
| `possessed-yojimbo-daigoro` | power | 10 | 20 |
| `possessed-yojimbo-daigoro` | critBonus | 0 | 20 |
| `possessed-cindy-camisade` | power | 30 | 21 |
| `possessed-cindy-delta-attack` | power | 65 | 10 |
| `possessed-cindy-delta-attack` | hits | 1 | 6 |
| `possessed-sandy-razzia` | power | 28 | 21 |
| `mac-multi-blizzara` | hits | 2 | 1 |
| `mac-multi-thundara` | hits | 2 | 1 |
| `mac-multi-watera` | hits | 2 | 1 |
| `mac-multi-fira` | hits | 2 | 1 |
| `guardian-blizzard` | power | 12 | 16 |
| `guardian-thunder` | power | 12 | 16 |
| `natus-multi-fira` | hits | 2 | 1 |
| `natus-multi-blizzara` | hits | 2 | 1 |
| `natus-multi-thundara` | hits | 2 | 1 |
| `natus-multi-watera` | hits | 2 | 1 |
| `natus-flare` | power | 60 | 80 |

Notes on the rows: an accuracy row only matters when the record's accuracy formula is 1 or 2 (a monster attack that rolls
against the target's Evasion); with formula 0 the game rolls nothing and the byte is unread (Cross Cleave, Jecht Beam,
Jecht Bomber, Left Arm Strike, Mortibsorption, Dispelling Slap, Ultimate Jecht Shot). Cross Cleave's 100 in our data is
marked `[estimate]` in `seymour-flux-abilities.ts`; the record is the sourced answer. The "possessed" rows are the
monster-side aeon commands of Chapter 3's gauntlet (record order 0x60d3 to 0x60e6); the record's powers are the game's own
for those commands, and ours agree on Energy Ray, Hellfire, Thor's Hammer and Diamond Dust and differ on the rest.

### 4.2 Flags: the record's words are the kernels' inputs

The type byte, both flag words and the damage classes come from the record for every ability that has one. They differ
from the flags the engine read before in these ways (the count is of abilities; a flag the ability data lacks and the
record has, or the reverse; the "heals" and "damage type" differences are the curing, status and CTB commands (Esuna, Remedy, Haste, Slow, Shell...), which deal no HP damage, and the type bits are read only by steps of the HP damage chain):

| What | Abilities that differ |
|---|---:|
| can crit | 53 |
| pierces Armored | 159 |
| damage type | 22 |
| heals | 11 |
| reflectable | 9 |
| damage class (HP 1, MP 2, CTB 4) | 15 |
| weak delay (Delay Attack) | 3 |
| crit bonus from equipment | 42 |
| accuracy formula | 31 |
| always breaks the limit (cap 99999) | 5 |
| never breaks the limit (cap 9999) | 51 |
| strong delay (Delay Buster) | 1 |
| affected by Darkness | 4 |

The largest effects, each now the game's answer: **no spell can crit** (the can-crit bit is clear on every White and
Black Magic record; the data marked 38 abilities `crit-eligible` that the game does not); **nearly every spell and
Overdrive pierces Armored** (bit 16: 149 abilities carry it in the game that the data had not flagged);
**an aeon's or boss's special takes the equipment's crit bonus** (bit 3, 42 abilities); **the Mixes and the
spheres do not carry the "never breaks the limit" bit** (the data had it on 48); **31 abilities have
a different accuracy formula than the old rule gave them** (the aeon specials and the Magus Sisters' attacks always hit;
the six aeon Attack records use the user's Accuracy times 2.5 or 1.5, which the data carried as dead `extra` fields).

## 5. Inputs the records do not carry, and how each is settled

Two inputs of the damage pipeline sit outside the command record. Both were checked in the live exe's code on 2026-10-08
(Ghidra, FFX.exe build 25501027; the 1,614 functions of the battle module, VA 0x780000 to 0x7c0000, were searched for the offsets):

- **The user's equipment crit bonus (`Chr+0x5d8`) is 0 for every monster.** `pp_BtlInitChr` zero-fills the whole 0x1ec-byte
  block that starts at `Chr+0x540` and its monster branch writes only `Chr+0x5d9` onward; the one function that ever writes
  `Chr+0x5d8` is the party-stats function (VA 0x0079c5f0), which zeroes it and adds the two equipped items' crit bytes. So a
  command with the equipment-bonus bit (flag word 2, bit 3) gives a monster no bonus at all, whatever its own crit byte says:
  Daigoro's attack (record 0x40b1, flag word 2 = 0xd, crit byte 20) has only the Luck terms, and the wiring supplies 0
  for every enemy and aeon (`src/battle/ffx/equipment.ts#equipmentCrit` returns 0 for a combatant with no equipment). The
  old engine read the byte instead, so that attack lost its 17% critical rate (a measured change, in the handoff).
- **The weapon command is Strength 16 for everyone.** `Chr+0x5c1` (the weapon formula) and `Chr+0x5c7` (its power) are set
  to 1 and 0x10 by the party-stats function and by the monster branch of `pp_BtlInitChr` alike, so a command that takes
  its formula and power from the weapon (record bit 18, 23 commands) always runs Strength 16, which is what the ability data
  carries; `tests/unit/data-ffx-command-records.test.ts` pins it.

Still open:

- Delay Attack and Delay Buster (bits 13 and 14) stay with the turn queue until batch W2: the wiring clears those bits
  from the word the kernels read, so no delay is charged twice. The records' delay bits differ from the data's
  `weak-delay` and `strong-delay` flags on 4 abilities (see §4.2).
- Formula 0x16 (a save-record counter, two monster commands) is in no ability of ours.
- The six aeon Attack records (0x30cb to 0x30db: accuracy formulas 5 and 6, powers 14 and 16) are attached to the
  `*-attack` abilities of the aeon files, but the engine has one generic `attack` command for every actor and an aeon's
  plain Attack runs on the party's record (0x3000), as it did before the wiring. Routing it to the aeon's own record is a
  separate, game-visible change (Valefor's and Shiva's Attack would drop from power 16 to 14) and is left for Bailey.

## 6. An enemy's plain Attack

The engine has one generic `attack` command, and its record is the party's (0x3000: accuracy formula 3, which reads the
user's Accuracy stat). A monster never attacks with that record; it has a monster-side one with an accuracy byte of its
own (the ordinary monsters' Attack, 0x4000, is formula 2 on a byte of 90 and can crit by equipment, which for a monster
is nothing). Where the game says which record an enemy of ours uses, the enemy carries it (`EnemyDef.plainAttack`):

| Enemy | Record | Source |
|---|---|---|
| the five possessed aeons (Valefor, Ifrit, Ixion, Shiva, Bahamut) | monster magic 2, 0x6000 Attack: formula 1, power 16, accuracy formula 2 on a byte of 90, physical, cannot crit, no shatter | `research/re-ffx-ai-yunalesca-bfa.md` section 5.5 ("else Attack 0x6000") and the record itself |

Any other enemy that attacks with the generic command (a confused boss, an enemy whose script is not registered) keeps the
reading the engine had before the wiring, derived from the ability's flags: it always hits and can crit. No sourced record is
attached to those, so none is invented. In the shipped chapters only the possessed aeons use it.
