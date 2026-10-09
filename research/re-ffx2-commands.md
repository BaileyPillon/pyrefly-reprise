# FFX-2 command records and monster rows: the game's own tables, and how our abilities and enemies map to them

**Game case: FFX-2 only.** FFX has its own tables in its own exe (`research/re-ffx-commands.md`). Part of the `re-parity` track
([docs/plans/re-parity.md](../docs/plans/re-parity.md)), batch W3 (the FFX-2 hit, critical, damage, status and theft kernels wired into
the engine; [docs/handoff/re-parity-w3.md](../docs/handoff/re-parity-w3.md)). Drafted 2026-10-09.

**Source note (applies to every statement below unless a line says otherwise):** the battle kernel tables of the Steam HD Remaster,
build 25501027 (`FFX-2.exe` SHA-256 6EA7F142...CD69): `item.bin` (68 rows), `command.bin` (554), `monmagic.bin` (568), `monster.bin`
(370) and `monster2.bin` (370, the Oversoul version of the monsters), read field by field with the earlier lane's readers
(`D:\Tools\rea\tools\ffx2-abil.mjs`, `ffx2-monster.mjs`) from the extracted archive. Everything is written in our own words and numbers
only: no game code and no game text is reproduced here (a row's name is the name the data layer already uses for the same ability).

| This note | Where it lives in the repo |
|---|---|
| §1 the rows and their layout | `tests/fixtures/parity/ffx2/command_rows.json` (the 205 rows the seven chapters can reach, numbers only) |
| §2 how an ability was matched to a row | `src/data/ffx2/command-records/` (240 abilities), `src/battle/ffx2/fallback-records.ts` (44), `src/battle/ffx2/adapt/attack-records.ts` (the party's Attack) |
| §3 the table, ability to row | `tests/unit/data-ffx2-command-records.test.ts` pins every record against the fixture |
| §4 where our numbers differ from the game's | `tests/fixtures/parity/ffx2/ability_differences.json`, pinned by the same test |
| §5 the overrides that wait for Bailey | the same test (`OVERRIDES`) |
| §6 the party's Attack, row by dressphere | `adapt/attack-records.ts` |
| §7 the monster rows, what they corrected, the rows by fight and the audit against the game's command lists | `src/data/ffx2/monster-records/`, `tests/fixtures/parity/ffx2/monster_rows.json` (with each monster's command list), `monster_differences.json`, `tests/unit/data-ffx2-monster-records.test.ts` |
| §8 AGENTS.md rule 5 against the rows | `tests/unit/data-ffx2-command-records.test.ts` |
| §9 inputs the rows do not carry | `src/battle/ffx2/adapt/` |

## 1. The rows, and how they were read

A command row is the in-memory command record the exe's functions read (`Cmd+0xNN`), so the kernels' inputs are read straight off
the table. The rows of `command.bin` and `monmagic.bin` (ids 0x3000 + n and 0x4000 + n) and of `item.bin` (0x2000 + n) share one
layout:

| Offset | Meaning | Read by |
|---|---|---|
| 0x0e | sub-menu category (1 Black Magic, 2 White Magic) | the Booster auto-ability (§9: the engine models no auto-ability but Break Damage Limit) |
| 0x10 (u32) | target flags: 0x40 can target the dead, 0x80 can target all, 0x400 skips the `Chr+0x5ac` test | the target gate, the all-target halving |
| 0x14 (u32) | misc flags: bits 3 to 5 the **accuracy formula** (0 never rolls), 0x40 Darkness applies, 0x80 reflectable, 0x100 absorbs, 0x200 steals an item, 0x1000 / 0x2000 Delay (weak / strong), 0x4000 spreads its hits over random targets, 0x10000 uses the character's properties, 0x40000 needs a dead target, 0x4000000 Bribe | the hit kernel, the damage orchestrator |
| 0x1c (u32) | damage flags: bits 0 and 1 the damage type (1 physical, 2 magical), 0x4 can crit, 0x8 the crit chance is the row's own byte, 0x10 heals, 0x20 cleanses, 0x40 caps at 9999, 0x80 caps at 99999, 0x100 steals gil | the critical kernel, the pipeline, Pilfer Gil |
| 0x27 | damage classes (1 HP, 2 MP, 4 ATB) | which pools a hit touches |
| 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e | damage formula, crit byte, accuracy byte, power, hits per target, shatter chance, element bits | base damage, hit, critical |
| 0x2f, 0x47, 0x5f (24 bytes each) | the group 1 status chance bytes, the group 2 chance bytes, the group 2 amounts (a timed status's duration, a stage's signed step) | the status kernels |
| 0x78 (u16) | species-killer mask | the pipeline |

A **monster row** (`monster.bin`, `monster2.bin`) adds what an enemy is: level and the stat bytes, the Accuracy stat (+0x16), the
special-flag word (+0x1a: bit 0 immune to the percent formulas, bit 1 hit reactions do not slow it, bit 6 immune to ATB damage, bit 9
immune to Bribe), the status resist bytes (+0x20 group 1, +0x38 group 2; 255 immune), the element bytes, the species mask (+0x9a),
the resist byte of the level-to-the-sixth formula (+0xc4), the item-steal chance byte (+0xab), the figure Pilfer Gil takes (+0xa4),
the steal items (+0xb4), the two Bribe slots (+0xbc) and the list of commands the monster uses (its own Attack among them).

Checks made on the read:

- The kernels' own tests (`parity-ffx2-*.test.ts`) run the game's functions on rows built from these layouts; the stat-group-1 and
  group-2 slot order, the accuracy formula bits and the damage-flag bits are the ones the exe tests (`research/re-ffx2-hit-status.md`
  sections 2 to 4, `research/re-ffx2-damage.md` section 2).
- The data layer's authored numbers (FAQs, SinirothX) differ from the row on 116 of the 284 abilities that carry a record, in at least
  one field the kernels read (§4); the rows win in the engine and every difference is listed.

## 2. How an ability was matched to a row

An ability was matched to the row of the same name in the table its category lives in (items to `item.bin`, party skills to
`command.bin`, enemy actions to `monmagic.bin` and the `command.bin` rows the monsters borrow), preferring the row whose formula,
power, hit count, element and MP cost agree with the ability's own ("exact": 39 abilities). Where the name alone leaves one row it is
that row ("name": 37). For an enemy action the row is looked up in the owning monster's own command list in `monster.bin`
("name, in the monster's command list": 124), which settles every name that appears more than once in `monmagic.bin`. The rest were
settled by hand against the monster's command list or the chapter's research note ("manual": 83, plus Russian Roulette below), each
with its reason in the table of section 3. 18 abilities of ours have no row because they are not commands (a passive auto-ability, a
menu marker, a script counter); they are listed in `NO_COMMAND_RECORD` with the reason, and the engine derives the row from the
ability's own fields for them and for any ability that is not in the seven chapters' reach (`adapt/command.ts deriveRecord`).

Three entries are deliberately not the plain row, and all three wait for Bailey (section 5).

**Russian Roulette** is five rows (0x40e9, 0x40ea, 0x40eb, 0x40ee, 0x40ef), each carrying one status chance (Death 30, Curse 100,
Silence 100, Petrify 30, Poison 100); the script picks one at random per cast (1 in 5) and queues it. The record carries them as
`pickOne`, the engine draws the pick once per cast before the hit determination and runs the chosen row.

**The three Triple Attacks** (Shiva, Baralai) are the game's Chain Attack row (0x4100) queued three times by the script; the ability
is one action with three hits, so the record carries `hits: 3`.

**The generic Attack** is not one row: the girls' Attack is a command per family of dresspheres, a monster's is its own row (§6, §7).
## 3. The table, ability to row

Every ability the seven chapters can reach, with the row it runs on. "Chapters" are the chapters whose build teaches the ability or
whose enemies use it (`bahamut` IV, `vegnagun-shuyin` V, `leblanc` VI, `fallen-aeons` XI, `trema` XIII, `den-of-woe` XV, `ixion-djose`
XVI). A record's fields are exactly the row's, word for word; the data test pins that for every line below, apart from the overrides
of section 5.

### Items (item.bin, 0x2000 + n)

| Our id | Row | Game row name | Matched by | Chapters |
|---|---|---|---|---|
| `x2-item-potion` | 0x2000 | Potion | name | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, den-of-woe, ixion-djose |
| `x2-item-hi-potion` | 0x2001 | Hi,Potion | name | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, den-of-woe, ixion-djose |
| `x2-item-x-potion` | 0x2002 | X,Potion | name | vegnagun-shuyin, fallen-aeons, den-of-woe |
| `x2-item-mega-potion` | 0x2003 | Mega,Potion | name | vegnagun-shuyin, fallen-aeons, trema, den-of-woe, ixion-djose |
| `x2-item-ether` | 0x2004 | Ether | name | bahamut, leblanc, ixion-djose |
| `x2-item-turbo-ether` | 0x2005 | Turbo Ether | name | vegnagun-shuyin, fallen-aeons, den-of-woe |
| `x2-item-phoenix-down` | 0x2006 | Phoenix Down | name | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, den-of-woe, ixion-djose |
| `x2-item-mega-phoenix` | 0x2007 | Mega Phoenix | name | vegnagun-shuyin, fallen-aeons, den-of-woe |
| `x2-item-elixir` | 0x2008 | Elixir | name | vegnagun-shuyin, fallen-aeons, den-of-woe |
| `x2-item-megalixir` | 0x2009 | Megalixir | name | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-item-antidote` | 0x200a | Antidote | name | leblanc |
| `x2-item-soft` | 0x200b | Soft | name | leblanc |
| `x2-item-eye-drops` | 0x200c | Eye Drops | name | leblanc |
| `x2-item-echo-screen` | 0x200d | Echo Screen | name | leblanc |
| `x2-item-holy-water` | 0x200e | Holy Water | name | bahamut, leblanc, ixion-djose |
| `x2-item-remedy` | 0x200f | Remedy | name | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, trema, den-of-woe, ixion-djose |
| `x2-item-grenade` | 0x2011 | Grenade | name | leblanc |
| `x2-item-chocobo-feather` | 0x202f | Chocobo Feather | name | vegnagun-shuyin, fallen-aeons, den-of-woe |
| `x2-item-lunar-curtain` | 0x2031 | Lunar Curtain | name | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, trema, den-of-woe, ixion-djose |
| `x2-item-light-curtain` | 0x2032 | Light Curtain | name | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, trema, den-of-woe, ixion-djose |
| `x2-item-soul-spring` | 0x2037 | Soul Spring | name | trema |
| `x2-item-stamina-tonic` | 0x203b | Stamina Tonic | name | trema |
| `x2-item-three-stars` | 0x203e | Three Stars | name | trema |
| `x2-item-hero-drink` | 0x203f | Hero Drink | name | den-of-woe |

### Party abilities (command.bin, 0x3000 + n)

| Our id | Row | Game row name | Matched by | Chapters |
|---|---|---|---|---|
| `x2-gunner-trigger-happy` | 0x3032 | Trigger Happy | name | leblanc, trema |
| `x2-gunner-potshot` | 0x3033 | Potshot | exact | trema |
| `x2-gunner-cheap-shot` | 0x3034 | Cheap Shot | exact | leblanc, trema |
| `x2-gunner-enchanted-ammo` | 0x3035 | Enchanted Ammo | exact | trema |
| `x2-gunner-target-mp` | 0x3036 | Target MP | exact | trema |
| `x2-gunner-quarter-pounder` | 0x3037 | Quarter Pounder | name | trema |
| `x2-gunner-on-the-level` | 0x3038 | On the Level | name | trema |
| `x2-gunner-burst-shot` | 0x3039 | Burst Shot | exact | trema |
| `x2-gunner-table-turner` | 0x303a | Table,turner | name | trema |
| `x2-gunner-scattershot` | 0x303b | Scattershot | exact | trema |
| `x2-gunner-scatterburst` | 0x303c | Scatterburst | exact | trema |
| `x2-gun-mage-white-wind` | 0x304c | White Wind | name | vegnagun-shuyin, fallen-aeons, den-of-woe |
| `x2-gun-mage-mighty-guard` | 0x304e | Mighty Guard | exact | vegnagun-shuyin, fallen-aeons, den-of-woe |
| `x2-alchemist-mix` | 0x3058 | Mix | exact | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-alchemist-stash-potion` | 0x3059 | Potion | the Alchemist Stash block (category 11 | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-alchemist-stash-hi-potion` | 0x305a | Hi,Potion | Stash block | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-alchemist-stash-mega-potion` | 0x305b | Mega,Potion | Stash block | trema |
| `x2-alchemist-stash-x-potion` | 0x305c | X,Potion | Stash block | trema |
| `x2-alchemist-stash-remedy` | 0x305d | Remedy | Stash block | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-alchemist-stash-phoenix-down` | 0x305f | Phoenix Down | Stash block | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-alchemist-stash-ether` | 0x3061 | Ether | Stash block | trema |
| `x2-alchemist-stash-elixir` | 0x3062 | Elixir | Stash block | trema |
| `x2-warrior-sentinel` | 0x3064 | Sentinel | exact | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, den-of-woe, ixion-djose |
| `x2-warrior-power-break` | 0x3065 | Power Break | exact | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, den-of-woe, ixion-djose |
| `x2-warrior-armor-break` | 0x3066 | Armor Break | exact | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, den-of-woe, ixion-djose |
| `x2-warrior-magic-break` | 0x3067 | Magic Break | exact | bahamut, leblanc, ixion-djose |
| `x2-warrior-mental-break` | 0x3068 | Mental Break | exact | bahamut, leblanc, ixion-djose |
| `x2-dark-knight-darkness` | 0x307f | Darkness | name | bahamut, vegnagun-shuyin, fallen-aeons, trema, den-of-woe, ixion-djose |
| `x2-dark-knight-charon` | 0x3080 | Charon | name | bahamut, vegnagun-shuyin, fallen-aeons, trema, den-of-woe, ixion-djose |
| `x2-dark-knight-drain` | 0x3081 | Drain | exact | bahamut, vegnagun-shuyin, fallen-aeons, trema, den-of-woe, ixion-djose |
| `x2-dark-knight-demi` | 0x3082 | Demi | exact | bahamut, vegnagun-shuyin, fallen-aeons, trema, den-of-woe, ixion-djose |
| `x2-dark-knight-confuse` | 0x3083 | Confuse | exact | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-dark-knight-break` | 0x3084 | Break | exact | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-dark-knight-bio` | 0x3085 | Bio | exact | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-dark-knight-doom` | 0x3086 | Doom | exact | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-dark-knight-death` | 0x3087 | Death | Death, MP 24 (the other Death rows are MP 0 | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-dark-knight-black-sky` | 0x3088 | Black Sky | Black Sky, MP 80 | vegnagun-shuyin, fallen-aeons, trema, den-of-woe |
| `x2-songstress-darkness-dance` | 0x3093 | Darkness Dance | exact | leblanc |
| `x2-songstress-perfect-pitch` | 0x30a1 | Perfect Pitch | exact | leblanc |
| `x2-black-mage-fire` | 0x30a5 | Fire | exact | leblanc |
| `x2-black-mage-fira` | 0x30a9 | Fira | exact | leblanc |
| `x2-black-mage-blizzara` | 0x30aa | Blizzara | exact | leblanc |
| `x2-black-mage-thundara` | 0x30ab | Thundara | exact | leblanc |
| `x2-black-mage-watera` | 0x30ac | Watera | exact | leblanc |
| `x2-white-mage-pray` | 0x30b1 | Pray | exact | vegnagun-shuyin, fallen-aeons, den-of-woe, ixion-djose |
| `x2-white-mage-vigor` | 0x30b2 | Vigor | name | bahamut, vegnagun-shuyin, fallen-aeons, den-of-woe, ixion-djose |
| `x2-white-mage-cure` | 0x30b3 | Cure | exact | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, den-of-woe, ixion-djose |
| `x2-white-mage-cura` | 0x30b4 | Cura | exact | bahamut, vegnagun-shuyin, fallen-aeons, den-of-woe, ixion-djose |
| `x2-white-mage-curaga` | 0x30b5 | Curaga | exact | vegnagun-shuyin, fallen-aeons, den-of-woe, ixion-djose |
| `x2-white-mage-regen` | 0x30b6 | Regen | exact | vegnagun-shuyin, fallen-aeons, den-of-woe |
| `x2-white-mage-esuna` | 0x30b7 | Esuna | exact | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, den-of-woe, ixion-djose |
| `x2-white-mage-dispel` | 0x30b8 | Dispel | exact | bahamut, vegnagun-shuyin, leblanc, fallen-aeons, den-of-woe, ixion-djose |
| `x2-white-mage-life` | 0x30b9 | Life | name | vegnagun-shuyin, fallen-aeons, den-of-woe, ixion-djose |
| `x2-white-mage-full-life` | 0x30ba | Full,Life | name | vegnagun-shuyin, fallen-aeons, den-of-woe |
| `x2-white-mage-shell` | 0x30bb | Shell | exact | bahamut, vegnagun-shuyin, fallen-aeons, den-of-woe, ixion-djose |
| `x2-white-mage-protect` | 0x30bc | Protect | exact | bahamut, vegnagun-shuyin, fallen-aeons, den-of-woe, ixion-djose |
| `x2-white-mage-reflect` | 0x30bd | Reflect | exact | vegnagun-shuyin, fallen-aeons, den-of-woe |
| `x2-white-mage-full-cure` | 0x30be | Full,Cure | name | vegnagun-shuyin, fallen-aeons, den-of-woe |
| `x2-thief-steal` | 0x30bf | Steal | exact | leblanc |
| `x2-thief-pilfer-gil` | 0x30c0 | Pilfer Gil | name | leblanc |
| `x2-gun-mage-scan` | 0x3142 | Scan | exact | vegnagun-shuyin, fallen-aeons, den-of-woe |

### Enemy actions (monmagic.bin, 0x4000 + n, and the command.bin rows the monsters borrow)

| Our id | Row | Game row name | Matched by | Chapters |
|---|---|---|---|---|
| `paragon-os-demi` | 0x3082 | Demi |  | trema:paragon |
| `trema-demi` | 0x3082 | Demi | Demi from the command table (Trema note section 7 | trema:trema |
| `x2-cindy-demi` | 0x3082 | Demi | name, in the monster's command list | fallen-aeons:cindy |
| `x2-redoubt-left-demi` | 0x3082 | Demi | name, in the monster's command list | vegnagun-shuyin:redoubt-l |
| `x2-bulwark-left-break` | 0x3084 | Break | name, in the monster's command list | vegnagun-shuyin:bulwark-l |
| `x2-redoubt-right-break` | 0x3084 | Break | name, in the monster's command list | vegnagun-shuyin:redoubt-r |
| `x2-vegnagun-leg-break` | 0x3084 | Break | name, in the monster's command list | vegnagun-shuyin:vegnagun-leg |
| `x2-bulwark-left-bio` | 0x3085 | Bio | name, in the monster's command list | vegnagun-shuyin:bulwark-l |
| `x2-bulwark-left-doom` | 0x3086 | Doom | name, in the monster's command list | vegnagun-shuyin:bulwark-l |
| `x2-vegnagun-leg-berserk` | 0x3089 | Berserk | name, in the monster's command list | vegnagun-shuyin:vegnagun-leg |
| `paragon-os-firaga` | 0x30ad | Firaga | Oversoul list: 0x30ad Firaga | trema:paragon |
| `paragon-os-blizzaga` | 0x30ae | Blizzaga |  | trema:paragon |
| `paragon-os-thundaga` | 0x30af | Thundaga |  | trema:paragon |
| `paragon-os-waterga` | 0x30b0 | Waterga |  | trema:paragon |
| `x2-node-cura` | 0x30b4 | Cura | name, in the monster's command list | vegnagun-shuyin:node-a, vegnagun-shuyin:node-b, vegnagun-shuyin:node-c |
| `x2-bulwark-right-regen` | 0x30b6 | Regen | name, in the monster's command list | vegnagun-shuyin:bulwark-r |
| `x2-cindy-regen` | 0x30b6 | Regen | name, in the monster's command list | fallen-aeons:cindy |
| `x2-den-baralai-regen` | 0x30b6 | Regen | name, in the monster's command list | den-of-woe:shade-baralai |
| `x2-node-regen` | 0x30b6 | Regen | name, in the monster's command list | vegnagun-shuyin:node-a, vegnagun-shuyin:node-b, vegnagun-shuyin:node-c |
| `paragon-os-dispel` | 0x30b8 | Dispel |  | trema:paragon |
| `x2-bulwark-left-dispel` | 0x30b8 | Dispel | name, in the monster's command list | vegnagun-shuyin:bulwark-l |
| `x2-redoubt-left-dispel` | 0x30b8 | Dispel | name, in the monster's command list | vegnagun-shuyin:redoubt-l |
| `x2-bulwark-right-shell` | 0x30bb | Shell | name, in the monster's command list | vegnagun-shuyin:bulwark-r |
| `x2-node-shell` | 0x30bb | Shell | name, in the monster's command list | vegnagun-shuyin:node-a, vegnagun-shuyin:node-b, vegnagun-shuyin:node-c |
| `x2-bulwark-right-protect` | 0x30bc | Protect | name, in the monster's command list | vegnagun-shuyin:bulwark-r |
| `x2-node-protect` | 0x30bc | Protect | name, in the monster's command list | vegnagun-shuyin:node-a, vegnagun-shuyin:node-b, vegnagun-shuyin:node-c |
| `trema-flare` | 0x3170 | Flare | name, in the monster's command list | trema:trema |
| `paragon-os-ultima` | 0x3171 | Ultima |  | trema:paragon |
| `trema-ultima` | 0x3171 | Ultima | name, in the monster's command list | trema:trema |
| `paragon-os-holy` | 0x3172 | Holy |  | trema:paragon |
| `x2-redoubt-right-blind` | 0x3178 | Blind | name, in the monster's command list | vegnagun-shuyin:redoubt-r |
| `x2-goon-strike` | 0x4000 | Attack | the goons' Attack | leblanc:dr-goon |
| `x2-shiva-kick` | 0x4000 | Attack | Shiva's plain Attack | fallen-aeons:x2-shiva |
| `paragon-os-judgement` | 0x4038 | Judgment | Judgment | trema:paragon |
| `x2-cindy-absorb` | 0x4040 | Absorb | name, in the monster's command list | fallen-aeons:cindy |
| `x2-den-baralai-absorb` | 0x4040 | Absorb | name, in the monster's command list | den-of-woe:shade-baralai |
| `x2-vegnagun-leg-absorb` | 0x4040 | Absorb | name, in the monster's command list | vegnagun-shuyin:vegnagun-leg |
| `x2-bahamut-curse` | 0x4046 | Curse | name, in the monster's command list | bahamut:bahamut |
| `x2-redoubt-full-life` | 0x4069 | Full,Life | name, in the monster's command list | vegnagun-shuyin:redoubt-r, vegnagun-shuyin:redoubt-l |
| `x2-vegnagun-core-full-life` | 0x4069 | Full,Life | name, in the monster's command list | vegnagun-shuyin:vegnagun-body |
| `x2-redoubt-left-slow` | 0x406c | Slow | name, in the monster's command list | vegnagun-shuyin:redoubt-l |
| `x2-vegnagun-leg-slow` | 0x406c | Slow | name, in the monster's command list | vegnagun-shuyin:vegnagun-leg |
| `x2-leblanc-osmose` | 0x406d | Osmose | name, in the monster's command list | leblanc:leblanc |
| `x2-den-baralai-silence` | 0x4071 | Silence | name, in the monster's command list | den-of-woe:shade-baralai |
| `x2-cindy-not-so-mighty-guard` | 0x4086 | Not,So,Mighty Guard | name, in the monster's command list | fallen-aeons:cindy |
| `x2-den-baralai-not-so-mighty-guard` | 0x4086 | Not,So,Mighty Guard | name, in the monster's command list | den-of-woe:shade-baralai |
| `x2-leblanc-not-so-mighty-guard` | 0x4086 | Not,So,Mighty Guard | name, in the monster's command list | leblanc:leblanc |
| `x2-leblanc-white-wind` | 0x4087 | White Wind | name, in the monster's command list | leblanc:leblanc |
| `x2-cindy-white-highwind` | 0x4088 | White Highwind | name, in the monster's command list | fallen-aeons:cindy |
| `x2-ixion-aerospark` | 0x4096 | Aerospark | name, in the monster's command list | ixion-djose:x2-ixion |
| `x2-ixion-thors-hammer` | 0x4097 | Thor<41>s Hammer | name, in the monster's command list | ixion-djose:x2-ixion |
| `x2-ixion-recharge` | 0x4098 | Recharge | name, in the monster's command list | ixion-djose:x2-ixion |
| `x2-shiva-heavenly-strike` | 0x4099 | Heavenly Strike | name, in the monster's command list | fallen-aeons:x2-shiva |
| `x2-shiva-diamond-dust` | 0x409a | Diamond Dust | name, in the monster's command list | fallen-aeons:x2-shiva |
| `x2-bahamut-impulse` | 0x409b | Impulse | name, in the monster's command list | bahamut:bahamut |
| `x2-bahamut-mega-flare` | 0x409c | Mega Flare | name, in the monster's command list (override) | bahamut:bahamut |
| `x2-anima-stare` | 0x409d | Anima Attack | Anima Attack | fallen-aeons:x2-anima |
| `x2-anima-pain` | 0x409e | Pain | name, in the monster's command list | fallen-aeons:x2-anima |
| `x2-anima-oblivion` | 0x409f | Oblivion | name, in the monster's command list | fallen-aeons:x2-anima |
| `x2-sandy-razzia` | 0x40a6 | Razzia | name, in the monster's command list | fallen-aeons:sandy |
| `x2-cindy-camisade` | 0x40a7 | Camisade | name, in the monster's command list | fallen-aeons:cindy |
| `x2-mindy-passado` | 0x40a8 | Passado | name, in the monster's command list | fallen-aeons:mindy |
| `x2-magus-delta-attack` | 0x40a9 | Delta Attack | name | fallen-aeons:sandy, fallen-aeons:cindy, fallen-aeons:mindy |
| `trema-dying-star` | 0x40d1 | Dying Star | name, in the monster's command list | trema:trema |
| `trema-falling-leaf` | 0x40d2 | Falling Leaf | name, in the monster's command list | trema:trema |
| `trema-thundering-wave` | 0x40d3 | Thundering Wave | name, in the monster's command list | trema:trema |
| `trema-beguiling-mire` | 0x40d4 | Beguiling Mire | name, in the monster's command list | trema:trema |
| `trema-waning-moon` | 0x40d5 | Waning Moon | name, in the monster's command list | trema:trema |
| `trema-choking-mist` | 0x40d6 | Choking Mist | name, in the monster's command list | trema:trema |
| `x2-ormi-supercollider` | 0x40e5 | Supercollider | name, in the monster's command list | leblanc:ormi-entrance, leblanc:ormi-logos-room, leblanc:ormi |
| `x2-ormi-huggles` | 0x40e6 | Huggles | name, in the monster's command list | leblanc:ormi-entrance, leblanc:ormi-logos-room, leblanc:ormi |
| `x2-logos-double-shot` | 0x40e7 | 1H Pistol | 1H Pistol | leblanc:logos-room, leblanc:logos |
| `x2-logos-hail-of-bullets` | 0x40e8 | Hail of Bullets | Act III row | leblanc:logos-room, leblanc:logos |
| `paragon-genesis` | 0x40ec | Genesis | name, in the monster's command list | trema:paragon |
| `paragon-big-bang` | 0x40ed | Big Bang | name, in the monster's command list | trema:paragon |
| `x2-leblanc-mach-fan` | 0x40f4 | Mach Fan | name, in the monster's command list | leblanc:leblanc |
| `x2-leblanc-love-tap` | 0x40f5 | Love Tap | name, in the monster's command list | leblanc:leblanc |
| `x2-nll-1` | 0x40f6 | No Love Lost | No Love Lost part 1 | leblanc:leblanc |
| `x2-nll-2` | 0x40f7 | None | part 2 | leblanc:leblanc |
| `x2-nll-3` | 0x40f8 | None | part 3 | leblanc:leblanc |
| `x2-ormi-concussive-blast` | 0x40fb | Concussive Blast | Act III row (Act I's is Concussive Shock 0x40fa, power 4 | leblanc:ormi-entrance, leblanc:ormi-logos-room, leblanc:ormi |
| `x2-den-gippal-flash-bomb` | 0x40fd | Flash Bomb | name, in the monster's command list | den-of-woe:shade-gippal |
| `x2-leblanc-flash-bomb` | 0x40fd | Flash Bomb | name, in the monster's command list | leblanc:leblanc |
| `x2-den-gippal-hush-grenade` | 0x40fe | Hush Grenade | name, in the monster's command list | den-of-woe:shade-gippal |
| `x2-leblanc-hush-grenade` | 0x40fe | Hush Grenade | name, in the monster's command list | leblanc:leblanc |
| `x2-den-baralai-triple-attack` | 0x4100 | Chain Attack | Chain Attack, queued three times by the script (override) | den-of-woe:shade-baralai |
| `x2-shiva-triple-attack` | 0x4100 | Chain Attack | Chain Attack, queued three times by the script (override) | fallen-aeons:x2-shiva |
| `x2-den-baralai-glint` | 0x4101 | Glint | name, in the monster's command list | den-of-woe:shade-baralai |
| `x2-den-baralai-looming-glacier` | 0x4102 | Looming Glacier | name, in the monster's command list | den-of-woe:shade-baralai |
| `x2-den-baralai-drill-shot` | 0x4103 | Drill Shot | name, in the monster's command list | den-of-woe:shade-baralai |
| `x2-den-gippal-potion-plus` | 0x4104 | Potion Plus | name, in the monster's command list | den-of-woe:shade-gippal |
| `x2-den-gippal-mortar` | 0x4112 | Mortar | name, in the monster's command list | den-of-woe:shade-gippal |
| `x2-den-gippal-grinder` | 0x4113 | Grinder | name, in the monster's command list | den-of-woe:shade-gippal |
| `x2-den-gippal-bullseye` | 0x4114 | Bullseye | name, in the monster's command list | den-of-woe:shade-gippal |
| `x2-den-nooj-rippling-chroma` | 0x4115 | Rippling Chroma | name, in the monster's command list | den-of-woe:shade-nooj |
| `x2-den-nooj-greedy-aura` | 0x4116 | Greedy Aura | name, in the monster's command list | den-of-woe:shade-nooj |
| `x2-den-nooj-lightfall` | 0x4117 | Lightfall | name, in the monster's command list | den-of-woe:shade-nooj |
| `x2-shuyin-spin-cut` | 0x4118 | Spin Cut | name, in the monster's command list | vegnagun-shuyin:shuyin |
| `x2-shuyin-run-and-slash` | 0x4119 | Hit <40> Run | the game calls it Hit & Run | vegnagun-shuyin:shuyin |
| `x2-shuyin-force-rain` | 0x411a | Force Rain | name, in the monster's command list | vegnagun-shuyin:shuyin |
| `x2-shuyin-terror-of-zanarkand` | 0x411b | Terror of Zanarkand | name, in the monster's command list | vegnagun-shuyin:shuyin |
| `trema-meteor` | 0x4128 | Meteor | name, in the monster's command list | trema:trema |
| `x2-vegnagun-noli-me-tangere` | 0x412f | Noli Me Tangere | name, in the monster's command list | vegnagun-shuyin:vegnagun-tail |
| `x2-vegnagun-tail-beam` | 0x4130 | Tail Beam | name, in the monster's command list | vegnagun-shuyin:vegnagun-tail |
| `x2-vegnagun-vita-brevis` | 0x4131 | Vita Brevis | name, in the monster's command list | vegnagun-shuyin:vegnagun-leg |
| `x2-node-missile` | 0x4132 | Missile | name, in the monster's command list | vegnagun-shuyin:node-a, vegnagun-shuyin:node-b, vegnagun-shuyin:node-c |
| `x2-node-dies-irae` | 0x4133 | Dies Irae | name, in the monster's command list | vegnagun-shuyin:node-a, vegnagun-shuyin:node-b, vegnagun-shuyin:node-c |
| `x2-bulwark-hostile-activity-detected` | 0x4134 | Hostile activity detected. | name, in the monster's command list | vegnagun-shuyin:bulwark-r, vegnagun-shuyin:bulwark-l |
| `x2-bulwark-physical-attack-detected` | 0x4136 | Physical attack detected. | name, in the monster's command list | vegnagun-shuyin:bulwark-r, vegnagun-shuyin:bulwark-l |
| `x2-bulwark-magical-attack-detected` | 0x4137 | Magical attack detected. | name, in the monster's command list | vegnagun-shuyin:bulwark-r, vegnagun-shuyin:bulwark-l |
| `x2-vegnagun-memento-mori` | 0x413a | Memento Mori | name, in the monster's command list | vegnagun-shuyin:vegnagun-body |
| `x2-vegnagun-charge-core` | 0x413b | Charge Core | name, in the monster's command list | vegnagun-shuyin:vegnagun-body |
| `x2-vegnagun-pallida-mors` | 0x413d | Pallida Mors | name, in the monster's command list | vegnagun-shuyin:vegnagun-head |
| `x2-redoubt-right-lacrimosa` | 0x413e | Lacrimosa | name, in the monster's command list | vegnagun-shuyin:redoubt-r |
| `x2-redoubt-left-lacrimosa` | 0x413f | Lacrimosa | name, in the monster's command list | vegnagun-shuyin:redoubt-l |
| `x2-vegnagun-odi-et-amo` | 0x4140 | Odi et Amo | name, in the monster's command list | vegnagun-shuyin:vegnagun-head |
| `x2-vegnagun-mors-certa` | 0x4141 | Mors Certa | name, in the monster's command list | vegnagun-shuyin:vegnagun-head |
| `x2-vegnagun-nemo-ante-mortem-beatus` | 0x4142 | Nemo Ante Mortem Beatus | name, in the monster's command list | vegnagun-shuyin:vegnagun-head |
| `x2-vegnagun-acta-est-fabula` | 0x4144 | Acta Est Fabula | name, in the monster's command list | vegnagun-shuyin:vegnagun-head |
| `paragon-os-final-impact` | 0x41c4 | Final Impact |  | trema:paragon |
| `paragon-os-attack` | 0x4000 | Attack | the Oversoul's own list (monster2.bin row 152 names 0x4000; the other bosses' Attack is 0x41da, the same words but for two bits the engine does not read) | trema:paragon |
| `x2-bahamut-attack` | 0x41da | Attack | name, in the monster's command list | bahamut:bahamut |
| `x2-den-baralai-attack` | 0x41da | Attack | name, in the monster's command list | den-of-woe:shade-baralai |
| `x2-den-gippal-attack` | 0x41da | Attack | Gippal's plain Attack (the game names it Attack; ours Kick | den-of-woe:shade-gippal |
| `x2-ixion-attack` | 0x41da | Attack | name, in the monster's command list | ixion-djose:x2-ixion |
| `x2-leblanc-fan-slap` | 0x41da | Attack | Leblanc's plain Attack | leblanc:fem-goon, leblanc:leblanc |
| `x2-ormi-shield-bash` | 0x41da | Attack | Ormi's plain Attack | leblanc:ormi-entrance, leblanc:ormi-logos-room, leblanc:ormi |
| `x2-sandy-attack` | 0x41da | Attack | Sandy's Attack | fallen-aeons:sandy |
| `x2-shuyin-attack` | 0x41da | Attack | name, in the monster's command list | vegnagun-shuyin:shuyin |
| `x2-den-nooj-attack` | 0x41e8 | Attack | Nooj's Attack (byte 95, crit 10 | den-of-woe:shade-nooj |
| `x2-fem-goon-fire` | 0x41e9 | Fire | name, in the monster's command list | leblanc:fem-goon |
| `x2-fem-goon-blizzard` | 0x41ea | Blizzard | name, in the monster's command list | leblanc:fem-goon |
| `x2-fem-goon-thunder` | 0x41eb | Thunder | name, in the monster's command list | leblanc:fem-goon |
| `x2-fem-goon-water` | 0x41ec | Water | name, in the monster's command list | leblanc:fem-goon |
| `x2-fem-goon-fira` | 0x41ed | Fira | name, in the monster's command list | leblanc:fem-goon |
| `x2-leblanc-fira` | 0x41ed | Fira | name, in the monster's command list | leblanc:leblanc |
| `x2-fem-goon-blizzara` | 0x41ee | Blizzara | name, in the monster's command list | leblanc:fem-goon |
| `x2-leblanc-blizzara` | 0x41ee | Blizzara | name, in the monster's command list | leblanc:leblanc |
| `x2-fem-goon-thundara` | 0x41ef | Thundara | name, in the monster's command list | leblanc:fem-goon |
| `x2-ixion-thundara` | 0x41ef | Thundara | name, in the monster's command list | ixion-djose:x2-ixion |
| `x2-leblanc-thundara` | 0x41ef | Thundara | name, in the monster's command list | leblanc:leblanc |
| `x2-fem-goon-watera` | 0x41f0 | Watera | name, in the monster's command list | leblanc:fem-goon |
| `x2-leblanc-watera` | 0x41f0 | Watera | name, in the monster's command list | leblanc:leblanc |
| `x2-mindy-firaga` | 0x41f1 | Firaga | name, in the monster's command list | fallen-aeons:mindy |
| `x2-node-firaga` | 0x41f1 | Firaga | name, in the monster's command list | vegnagun-shuyin:node-a, vegnagun-shuyin:node-b, vegnagun-shuyin:node-c |
| `x2-mindy-blizzaga` | 0x41f2 | Blizzaga | name, in the monster's command list | fallen-aeons:mindy |
| `x2-node-blizzaga` | 0x41f2 | Blizzaga | name, in the monster's command list | vegnagun-shuyin:node-a, vegnagun-shuyin:node-b, vegnagun-shuyin:node-c |
| `x2-shiva-blizzaga` | 0x41f2 | Blizzaga | name, in the monster's command list | fallen-aeons:x2-shiva |
| `x2-mindy-thundaga` | 0x41f3 | Thundaga | name, in the monster's command list | fallen-aeons:mindy |
| `x2-node-thundaga` | 0x41f3 | Thundaga | name, in the monster's command list | vegnagun-shuyin:node-a, vegnagun-shuyin:node-b, vegnagun-shuyin:node-c |
| `x2-mindy-waterga` | 0x41f4 | Waterga | name, in the monster's command list | fallen-aeons:mindy |
| `x2-node-waterga` | 0x41f4 | Waterga | name, in the monster's command list | vegnagun-shuyin:node-a, vegnagun-shuyin:node-b, vegnagun-shuyin:node-c |
| `x2-node-flare` | 0x41fa | Flare | name, in the monster's command list | vegnagun-shuyin:node-a, vegnagun-shuyin:node-b, vegnagun-shuyin:node-c |
| `x2-redoubt-right-flare` | 0x41fa | Flare | name, in the monster's command list | vegnagun-shuyin:redoubt-r |

### The engine's fallback table (`abilities-core.ts`, `abilities-vegnagun.ts`, `abilities-shuyin.ts`)

| Our id | Row | Game row name | Matched by | Chapters |
|---|---|---|---|---|
| `demi` | 0x3082 | Demi | the monster's own command list | engine table |
| `leg-break` | 0x3084 | Break | the monster's own command list | engine table |
| `bulwark-bio` | 0x3085 | Bio | the monster's own command list | engine table |
| `bulwark-doom` | 0x3086 | Doom | the monster's own command list | engine table |
| `leg-berserk` | 0x3089 | Berserk | the monster's own command list | engine table |
| `cura` | 0x30b4 | Cura | the monster's own command list | engine table |
| `node-regen` | 0x30b6 | Regen | the monster's own command list | engine table |
| `dispel` | 0x30b8 | Dispel | the monster's own command list | engine table |
| `node-shell` | 0x30bb | Shell | the monster's own command list | engine table |
| `node-protect` | 0x30bc | Protect | the monster's own command list | engine table |
| `blind` | 0x3178 | Blind | the monster's own command list | engine table |
| `leg-absorb` | 0x4040 | Absorb | the monster's own command list | engine table |
| `bahamut-curse` | 0x4046 | Curse | the monster's own command list | engine table |
| `full-life` | 0x4069 | Full,Life | the monster's own command list | engine table |
| `leg-slow` | 0x406c | Slow | the monster's own command list | engine table |
| `impulse` | 0x409b | Impulse | the monster's own command list | engine table |
| `mega-flare` | 0x409c | Mega Flare | HELD at power 24 (the game row says 14; Bailey decides (override) | engine table |
| `spin-cut` | 0x4118 | Spin Cut | the monster's own command list | engine table |
| `run-and-slash` | 0x4119 | Hit <40> Run | the monster's own command list | engine table |
| `force-rain` | 0x411a | Force Rain | the monster's own command list | engine table |
| `terror-of-zanarkand` | 0x411b | Terror of Zanarkand | the monster's own command list | engine table |
| `noli-me-tangere` | 0x412f | Noli Me Tangere | the monster's own command list | engine table |
| `tail-beam` | 0x4130 | Tail Beam | the monster's own command list | engine table |
| `vita-brevis` | 0x4131 | Vita Brevis | the monster's own command list | engine table |
| `missile` | 0x4132 | Missile | the monster's own command list | engine table |
| `dies-irae` | 0x4133 | Dies Irae | the monster's own command list | engine table |
| `hostile-activity-detected` | 0x4134 | Hostile activity detected. | the monster's own command list | engine table |
| `physical-attack-detected` | 0x4136 | Physical attack detected. | the monster's own command list | engine table |
| `magical-attack-detected` | 0x4137 | Magical attack detected. | the monster's own command list | engine table |
| `memento-mori` | 0x413a | Memento Mori | the monster's own command list | engine table |
| `charge-core` | 0x413b | Charge Core | the monster's own command list | engine table |
| `pallida-mors` | 0x413d | Pallida Mors | the monster's own command list | engine table |
| `lacrimosa-r` | 0x413e | Lacrimosa | the monster's own command list | engine table |
| `lacrimosa-l` | 0x413f | Lacrimosa | the monster's own command list | engine table |
| `odi-et-amo` | 0x4140 | Odi et Amo | the monster's own command list | engine table |
| `mors-certa` | 0x4141 | Mors Certa | the monster's own command list | engine table |
| `nemo-ante-mortem-beatus` | 0x4142 | Nemo Ante Mortem Beatus | the monster's own command list | engine table |
| `acta-est-fabula` | 0x4144 | Acta Est Fabula | the monster's own command list | engine table |
| `shuyin-attack` | 0x41da | Attack | the monster's own command list | engine table |
| `firaga` | 0x41f1 | Firaga | the monster's own command list | engine table |
| `blizzaga` | 0x41f2 | Blizzaga | the monster's own command list | engine table |
| `thundaga` | 0x41f3 | Thundaga | the monster's own command list | engine table |
| `waterga` | 0x41f4 | Waterga | the monster's own command list | engine table |
| `flare` | 0x41fa | Flare | the monster's own command list | engine table |


## 4. Where our numbers differ from the game's

The engine now runs every ability on its row, so wherever an ability's own number differs from its row, the row's is what plays. The
list is a fixture (`tests/fixtures/parity/ffx2/ability_differences.json`) and the data test fails when it changes, so a new or fixed
difference has to be seen. "Ours" is what the ability's own fields would have given (`adapt/command.ts deriveRecord`). Nothing in it
was retuned: it is the game's answer, listed so that Bailey can see which of our authored figures the exe contradicts.

The kinds, and how many abilities each touches:

- **rolls accuracy** on 40: 39 abilities our data rolled that the game never rolls, and one the other way, the Dark Knight's Death,
  which the game rolls and rule 5 holds (section 8). Two more, the Grenade and Soul Spring, rolled in the old engine (it rolled any
  damaging item) and the game's rows do not; the derived reading has every item skip the roll (67 of the 68 item rows have accuracy
  formula 0), so they are not in the list but they changed.
- **power** on 32: the Fem-Goons' and Leblanc's spells are one lower than the FAQs, and the Stash and the item effects (Elixir, X-Potion,
  Phoenix Down...) carried a placeholder of 0 or 1 in our data.
- **damage type** on 25: Impulse, Stare, White Wind, Osmose and the Paragon's Big Bang and Genesis are typed magical in ours and untyped
  in the row (Shell does not halve them); twelve moves our data left untyped the row types **physical**, among them Noli Me Tangere,
  Supercollider, Drill Shot, Quarter Pounder and the Grenade, so Protect and the Defend clamp now apply to them; four untyped in ours
  are magical in the row (Demi, Cura on a Node, two of the Bulwarks' detectors); Camisade and Terror of Zanarkand are physical in ours
  and untyped in the row; Vita Brevis is magical in ours and physical in the row.
- **can crit** on 10 (six we allowed that the row does not, four the other way); **damage formula** on 7; **hits** on 2 (Trigger Happy
  counts its presses, Hail of Bullets is three shots); **element** on 1 (Quarter Pounder carries none).
- **the damage limit** on 13: eleven moves our data says break the 9,999 limit (Mega Flare, Tail Beam, Noli Me Tangere, Vita Brevis,
  Memento Mori, Nemo Ante Mortem Beatus, Dying Star, Final Impact, Lightfall, Aerospark, Ixion's Attack) have no 99,999 bit in their row,
  where the limit is also the attacker's own Break Damage Limit word; the monster rows read so far give a monster no such word, so the
  cast's authored flag stands in for it and they still break the limit (section 9). Genesis and Judgement force 99,999 where ours did not.
  The difference shows only when a number passes 9,999 (the Oversoul test gives a girl 80,000 HP to see Final Impact do it).
- **status chance bytes and cleanse sets** on 23 abilities (75 entries; timed amounts are not compared). The ones that matter: Life, Full Life, the
  Phoenix Downs, the Redoubts' and the Core's Full Life and Acta Est Fabula are cleanse rows for Death in the game (ours revived by the engine's
  own rule: the same result); every Dispel (the White Mage's, the Bulwark's, the Redoubt's, the Paragon's) and the Paragon's Genesis also
  strip Damage 9999 and Always Critical;
  the Dark Knight's Death carries a chance byte of 254 (ours 18); Russian Roulette's five rows carry one status each (Death 30,
  Curse 100, Silence 100, Petrify 30, Poison 100) where ours listed six at 254; the Leg's Berserk is 255 (it lands through a resist of 255; ours
  was 75) and raises STR a step; Anima's Pain and Love Tap are 255 where ours were 254; Flash Bomb and
  Hush Grenade are 50, not 40; White Wind and White Highwind cure fewer statuses than ours listed; and the **Paragon's Attack carries no
  Itchy** in the row (the FAQs say it causes it).
- **no damage in ours, a damage class in the row** on 8: the three Ethers' MP, Delta Attack's HP, Looming Glacier's MP fraction, the
  Chocobo Feather's ATB, and the ATB part of the Leg's and the Left Redoubt's Slow (the kernels compute it and its draw is taken;
  applying it to the gauge is batch W4's).

Five of them change how a chapter plays and are worth reading first:

- **Delta Attack** (0x40a9) is the "leave 1 HP" formula on the HP class alone; the wiki's "and MP to 0" is not in the row.
- **Darkness** (the Dark Knight's, 0x307f) and **Supercollider** (Ormi's, 0x40e5) never roll accuracy in the game; the engine rolled both.
- **Russian Roulette** is five rows, one picked per cast, with Death and Petrify at a chance of 30 (section 2).
- **No Love Lost** is the piercing physical formula (0x40f6, 0x40f7) and a 6/16 fraction of current HP (0x40f8), not constants.
- **Noli Me Tangere** (the Tail's 1,250) is the fixed formula without variance, typed **physical**, so it is exactly 1,250 and Protect
  halves it (the research read it as a randomised constant that nothing reduces).

| Ability | Ours -> the game's row |
|---|---|
| `paragon-big-bang` | damage type magical -> neither |
| `paragon-genesis` | damage type magical -> neither; damage limit: the row forces 99,999, ours did not; status: the row adds Damage 9999 at 254; status: the row adds Always Critical at 254 |
| `paragon-os-attack` | status: ours has Itchy at 254, the row does not |
| `paragon-os-dispel` | status: the row adds Damage 9999 at 254; status: the row adds Always Critical at 254 |
| `paragon-os-final-impact` | damage type neither -> physical; damage limit: ours breaks 99,999, the row does not force it (the cast's flag still breaks it) |
| `paragon-os-judgement` | damage limit: the row forces 99,999, ours did not |
| `trema-beguiling-mire` | power 4 -> 5 |
| `trema-dying-star` | damage limit: ours breaks 99,999, the row does not force it (the cast's flag still breaks it) |
| `trema-waning-moon` | power 0 -> 5; damage type neither -> physical; can crit: ours no, game yes |
| `x2-alchemist-stash-elixir` | power 1 -> 16 |
| `x2-alchemist-stash-ether` | ours deals no damage; the game's row has damage class 2, formula 5, power 2 |
| `x2-alchemist-stash-phoenix-down` | power 0 -> 4; status: the row adds Death at 254; cleanse mode: ours no, game yes |
| `x2-alchemist-stash-x-potion` | power 1 -> 16 |
| `x2-anima-pain` | status: STR chance 254 -> 255; status: MAG chance 254 -> 255; status: DEF chance 254 -> 255; status: MDEF chance 254 -> 255; status: Accuracy chance 254 -> 255; status: Evasion chance 254 -> 255 |
| `x2-anima-stare` | damage type magical -> neither |
| `x2-bahamut-impulse` | damage type magical -> neither |
| `x2-bahamut-mega-flare` | damage limit: ours breaks 99,999, the row does not force it (the cast's flag still breaks it) |
| `x2-bulwark-hostile-activity-detected` | damage type neither -> magical; rolls accuracy: ours yes, game no |
| `x2-bulwark-left-dispel` | status: the row adds Damage 9999 at 254; status: the row adds Always Critical at 254 |
| `x2-bulwark-magical-attack-detected` | damage type neither -> magical; rolls accuracy: ours yes, game no |
| `x2-bulwark-physical-attack-detected` | damage type neither -> physical; rolls accuracy: ours yes, game no |
| `x2-cindy-camisade` | damage type physical -> neither; rolls accuracy: ours yes, game no; can crit: ours yes, game no |
| `x2-cindy-demi` | damage type neither -> magical |
| `x2-cindy-white-highwind` | status: ours has Curse at 254, the row does not; status: ours has Itchy at 254, the row does not; status: ours has Slow at 254, the row does not; status: ours has Stop at 254, the row does not; status: ours has Luck at 254, the row does not |
| `x2-dark-knight-black-sky` | damage formula 9 -> 0 |
| `x2-dark-knight-charon` | rolls accuracy: ours yes, game no |
| `x2-dark-knight-darkness` | rolls accuracy: ours yes, game no |
| `x2-dark-knight-death` | rolls accuracy: ours no, game yes; status: Death chance 18 -> 254 |
| `x2-den-baralai-drill-shot` | damage type neither -> physical |
| `x2-den-baralai-glint` | rolls accuracy: ours yes, game no |
| `x2-den-baralai-looming-glacier` | ours deals no damage; the game's row has damage class 2, formula 7, power 16 |
| `x2-den-baralai-triple-attack` | rolls accuracy: ours yes, game no; can crit: ours yes, game no |
| `x2-den-gippal-grinder` | rolls accuracy: ours yes, game no |
| `x2-den-gippal-mortar` | rolls accuracy: ours yes, game no |
| `x2-den-gippal-potion-plus` | damage formula 8 -> 5 |
| `x2-den-nooj-lightfall` | damage limit: ours breaks 99,999, the row does not force it (the cast's flag still breaks it) |
| `x2-fem-goon-blizzara` | power 13 -> 12 |
| `x2-fem-goon-blizzard` | power 8 -> 7 |
| `x2-fem-goon-fira` | power 13 -> 12 |
| `x2-fem-goon-fire` | power 8 -> 7 |
| `x2-fem-goon-thundara` | power 13 -> 12 |
| `x2-fem-goon-thunder` | power 8 -> 7 |
| `x2-fem-goon-water` | power 8 -> 7 |
| `x2-fem-goon-watera` | power 13 -> 12 |
| `x2-gun-mage-white-wind` | power 0 -> 6; damage type magical -> neither |
| `x2-gunner-on-the-level` | damage formula 0 -> 18 |
| `x2-gunner-quarter-pounder` | element gravity -> none; damage type neither -> physical; can crit: ours no, game yes |
| `x2-gunner-table-turner` | damage formula 0 -> 20 |
| `x2-gunner-target-mp` | damage type neither -> physical; can crit: ours no, game yes |
| `x2-gunner-trigger-happy` | hits 1 -> 60; rolls accuracy: ours yes, game no |
| `x2-item-chocobo-feather` | ours deals no damage; the game's row has damage class 4, formula 4, power 8 |
| `x2-item-elixir` | power 1 -> 16 |
| `x2-item-ether` | ours deals no damage; the game's row has damage class 2, formula 5, power 2 |
| `x2-item-grenade` | damage type neither -> physical; can crit: ours yes, game no |
| `x2-item-mega-phoenix` | power 1 -> 4; status: the row adds Death at 254; cleanse mode: ours no, game yes |
| `x2-item-megalixir` | power 1 -> 16 |
| `x2-item-phoenix-down` | power 0 -> 4; status: the row adds Death at 254; cleanse mode: ours no, game yes |
| `x2-item-turbo-ether` | ours deals no damage; the game's row has damage class 2, formula 5, power 10 |
| `x2-item-x-potion` | power 1 -> 16 |
| `x2-ixion-aerospark` | damage limit: ours breaks 99,999, the row does not force it (the cast's flag still breaks it) |
| `x2-ixion-attack` | damage limit: ours breaks 99,999, the row does not force it (the cast's flag still breaks it) |
| `x2-leblanc-blizzara` | power 13 -> 12 |
| `x2-leblanc-fira` | power 13 -> 12 |
| `x2-leblanc-flash-bomb` | status: Darkness chance 40 -> 50 |
| `x2-leblanc-hush-grenade` | status: Silence chance 40 -> 50 |
| `x2-leblanc-love-tap` | status: Haste chance 254 -> 255 |
| `x2-leblanc-osmose` | damage formula 2 -> 4; power 8 -> 3; damage type magical -> neither |
| `x2-leblanc-thundara` | power 13 -> 12 |
| `x2-leblanc-watera` | power 13 -> 12 |
| `x2-leblanc-white-wind` | status: ours has Petrify at 254, the row does not; status: ours has Curse at 254, the row does not; status: ours has EXP 0 at 254, the row does not; status: ours has Itchy at 254, the row does not; status: ours has Slow at 254, the row does not; status: ours has Stop at 254, the row does not; status: ours has STR at 254, the row does not; status: ours has MAG at 254, the row does not; status: ours has DEF at 254, the row does not; status: ours has MDEF at 254, the row does not; status: ours has Accuracy at 254, the row does not; status: ours has Evasion at 254, the row does not; status: ours has Luck at 254, the row does not |
| `x2-logos-double-shot` | power 16 -> 8 |
| `x2-logos-hail-of-bullets` | hits 1 -> 3; damage type neither -> physical |
| `x2-logos-russian-roulette` | status: Death chance 254 -> 30; status: ours has Petrify at 254, the row does not; status: ours has Silence at 254, the row does not; status: ours has Poison at 254, the row does not; status: ours has Curse at 254, the row does not; status: ours has Eject at 254, the row does not |
| `x2-magus-delta-attack` | ours deals no damage; the game's row has damage class 1, formula 10, power 1 |
| `x2-mindy-passado` | damage type neither -> physical |
| `x2-node-blizzaga` | rolls accuracy: ours yes, game no |
| `x2-node-cura` | damage type neither -> magical |
| `x2-node-dies-irae` | rolls accuracy: ours yes, game no |
| `x2-node-firaga` | rolls accuracy: ours yes, game no |
| `x2-node-flare` | rolls accuracy: ours yes, game no |
| `x2-node-missile` | rolls accuracy: ours yes, game no |
| `x2-node-thundaga` | rolls accuracy: ours yes, game no |
| `x2-node-waterga` | rolls accuracy: ours yes, game no |
| `x2-ormi-huggles` | rolls accuracy: ours yes, game no |
| `x2-ormi-supercollider` | damage type neither -> physical; rolls accuracy: ours yes, game no; can crit: ours no, game yes |
| `x2-redoubt-full-life` | power 1 -> 16; status: the row adds Death at 254; status: the row adds Sleep at 254; status: the row adds Silence at 254; status: the row adds Darkness at 254; status: the row adds Poison at 254; status: the row adds Confusion at 254; status: the row adds Berserk at 254; cleanse mode: ours no, game yes |
| `x2-redoubt-left-demi` | rolls accuracy: ours yes, game no |
| `x2-redoubt-left-dispel` | status: the row adds Damage 9999 at 254; status: the row adds Always Critical at 254 |
| `x2-redoubt-left-lacrimosa` | damage type neither -> physical; rolls accuracy: ours yes, game no |
| `x2-redoubt-left-slow` | ours deals no damage; the game's row has damage class 4, formula 4, power 16 |
| `x2-redoubt-right-flare` | rolls accuracy: ours yes, game no |
| `x2-redoubt-right-lacrimosa` | rolls accuracy: ours yes, game no |
| `x2-shiva-triple-attack` | rolls accuracy: ours yes, game no; can crit: ours yes, game no |
| `x2-shuyin-force-rain` | rolls accuracy: ours yes, game no |
| `x2-shuyin-run-and-slash` | rolls accuracy: ours yes, game no |
| `x2-shuyin-spin-cut` | rolls accuracy: ours yes, game no; can crit: ours yes, game no |
| `x2-shuyin-terror-of-zanarkand` | damage type physical -> neither; rolls accuracy: ours yes, game no; can crit: ours yes, game no |
| `x2-thief-pilfer-gil` | damage formula 12 -> 0; rolls accuracy: ours yes, game no |
| `x2-vegnagun-acta-est-fabula` | power 1 -> 16; status: the row adds Death at 254; cleanse mode: ours no, game yes |
| `x2-vegnagun-core-full-life` | power 1 -> 16; status: the row adds Death at 254; status: the row adds Sleep at 254; status: the row adds Silence at 254; status: the row adds Darkness at 254; status: the row adds Poison at 254; status: the row adds Confusion at 254; status: the row adds Berserk at 254; cleanse mode: ours no, game yes |
| `x2-vegnagun-leg-absorb` | rolls accuracy: ours yes, game no |
| `x2-vegnagun-leg-berserk` | status: Berserk chance 75 -> 255; status: the row adds STR at 254 |
| `x2-vegnagun-leg-slow` | ours deals no damage; the game's row has damage class 4, formula 4, power 16 |
| `x2-vegnagun-memento-mori` | rolls accuracy: ours yes, game no; damage limit: ours breaks 99,999, the row does not force it (the cast's flag still breaks it) |
| `x2-vegnagun-mors-certa` | rolls accuracy: ours yes, game no |
| `x2-vegnagun-nemo-ante-mortem-beatus` | rolls accuracy: ours yes, game no; damage limit: ours breaks 99,999, the row does not force it (the cast's flag still breaks it) |
| `x2-vegnagun-noli-me-tangere` | damage formula 8 -> 5; damage type neither -> physical; rolls accuracy: ours yes, game no; damage limit: ours breaks 99,999, the row does not force it (the cast's flag still breaks it) |
| `x2-vegnagun-odi-et-amo` | rolls accuracy: ours yes, game no |
| `x2-vegnagun-pallida-mors` | rolls accuracy: ours yes, game no |
| `x2-vegnagun-tail-beam` | rolls accuracy: ours yes, game no; damage limit: ours breaks 99,999, the row does not force it (the cast's flag still breaks it) |
| `x2-vegnagun-vita-brevis` | damage type magical -> physical; rolls accuracy: ours yes, game no; damage limit: ours breaks 99,999, the row does not force it (the cast's flag still breaks it) |
| `x2-white-mage-dispel` | status: the row adds Damage 9999 at 254; status: the row adds Always Critical at 254 |
| `x2-white-mage-full-cure` | power 1 -> 16 |
| `x2-white-mage-full-life` | power 1 -> 16; status: the row adds Death at 254; cleanse mode: ours no, game yes |
| `x2-white-mage-life` | power 1 -> 8; status: the row adds Death at 254; cleanse mode: ours no, game yes |
| `x2-white-mage-vigor` | power 1 -> 8 |

## 5. The overrides: the rows that are not the plain row (each waits for Bailey)

| Ability | Row says | The record carries | Why |
|---|---|---|---|
| `x2-bahamut-mega-flare`, `mega-flare` | power 14 (0x409c) | power 24 | `docs/plans/re-parity-ai-review.md` section 3: Mega Flare's power waits for Bailey (the AI batch decides it). The authored 24 stays until then; nothing was retuned. |
| `x2-shiva-triple-attack`, `x2-den-baralai-triple-attack` | one Chain Attack (0x4100) | 3 hits | the script queues the row three times; the ability is one action |
| `x2-logos-russian-roulette` | five rows (0x40e9, 0x40ea, 0x40eb, 0x40ee, 0x40ef) | the first row plus `pickOne` of all five | the script picks one row per cast; section 2 |

## 6. The party's Attack, row by dressphere

The engine has one generic `attack` ability. The game has a separate Attack command per family of dresspheres (command.bin rows
0x302c to 0x3031 and 0x312f). They share one rule (accuracy formula 2: the user's own Accuracy stat; physical; can crit on the Luck
gap; power 16; Darkness applies; shatter 50) and differ in only three places: the Thief's two hits of power 8 (0x302e), Machina
Maw's row (0x312f: no Darkness bit, a shatter byte of 100) and the ranged dresspheres' extra target flag 0x400 (0x302c). The pairing of
a dressphere to its row is the dressphere's own Attack command (`research/re-ffx2-dressphere.md` section 1.3):

| Row | Dresspheres |
|---|---|
| 0x302c | Gunner, Gun Mage, Alchemist, Lady Luck, Black Mage, White Mage, Psychic |
| 0x302d | the melee dresspheres, and the default for a dressphere not listed |
| 0x302e | Thief (two hits of power 8) |
| 0x302f | Trainer |
| 0x3030 | Floral Fallal |
| 0x3031 | Full Throttle |
| 0x312f | Machina Maw |

`resolveCommand` (`adapt/command.ts`) picks the row from the dressphere the girl wears at the moment of the attack.


## 7. The monster rows

All 32 enemies and parts of the seven chapters have a row (`monster.bin`; the Oversoul Paragon, the version the shipped Chapter XIII
fights, is in `monster2.bin`). `attachMonsterRecords` lays each on its `EnemyDef` where the group is defined and corrects, in place,
the authored fields the kernels read:

- **Accuracy.** Every row says 95. The enemy data carried 0 ("absent from the record": the FAQs print none) and the engine invented a
  baseline of 104 for it. Accuracy formula 2 (the plain Attack of every monster, and Ormi's Shield Bash) reads this stat.
- **The status resist bytes.** For every status the engine has a slot for, the row's byte replaces the authored one (a byte of 0 removes
  it). A stat stage's Up and Down share one slot, so a resisted stage resists both. The engine's hidden Delay effect and Action-cancel have
  no slot and keep what was authored.
- **The special-flag word** (immune to the percent formulas, to Delay, to Bribe) and **the species mask**: the kernels read them from the
  row; the authored `immunityFlags` stay as data.
- **The item-steal chance byte** (replaces the `/255` figure derived from the authored percentage) and **the figure Pilfer Gil takes**.

Not taken: level, HP and the stat bytes (section 7.2), the element bytes, the steal items and the Bribe slots (the item ids are the
game's, the engine's `rewards` carry ours).

### 7.0 The rows by fight, and the audit against the game's command lists

The game gives a move of the same name a different row in different fights, and a monster's own command list says which. Where our one ability
stands for two rows, `FFX2MonsterRecord.commands` (ability id to row) names the row that monster runs in place of the ability's own, and the
resolver reads it first (`adapt/command.ts resolveCommand`). Three monsters carry one:

- **Ormi in the first room** runs Concussive Shock (0x40fa, power 4), not the Blast (0x40fb, power 6) our ability stands for; the last room's Ormi runs
  the Blast. The second room's Ormi has no Concussive move at all in the game's list (below).
- **The Left Bulwark** answers on its own three rows (0x4135, 0x4138, 0x4139); the Right Bulwark's are 0x4134, 0x4136 and 0x4137. They differ only in
  the target word of the physical reaction (the Left's may target the dead).
- **The Fem-Goon** runs 0x4000 for its Attack (Leblanc's is 0x41da); the two rows are the same words in everything the kernels read.

`monster_rows.json` carries each monster's command list, and `tests/unit/data-ffx2-monster-records.test.ts` checks that the row every enemy ability
runs on is in its monster's list, except ten named entries (the sisters' joint Delta Attack twice, Trema's Demi, three Oversoul phase moves, Nooj's Attack,
Shiva's Kick, Logos' Hail of Bullets in the second room and Ormi's Concussive move there): a script may issue a command that is not in the list, and
for the last four our data gives a monster a move the game does not (the AI batches decide). The audit found three mistakes in the first
mapping (the Oversoul's Attack, the Left Bulwark, Ormi's Shock), all fixed.

### 7.1 What the rows corrected in the enemy data

| Enemy | Corrections (authored -> the row) |
|---|---|
| `ffx2-bahamut/bahamut` (Bahamut) | Auto-Life and Itchy resisted (255); acc 0->95 |
| `vegnagun-tail/vegnagun-tail` (Vegnagun) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct50->128 |
| `vegnagun-leg/vegnagun-leg` (Vegnagun) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct50->128 |
| `vegnagun-leg/node-a` (Node A) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct50->128 |
| `vegnagun-leg/node-b` (Node B) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct50->128 |
| `vegnagun-leg/node-c` (Node C) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct50->128 |
| `vegnagun-body/vegnagun-body` (Vegnagun) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct50->128 |
| `vegnagun-body/bulwark-r` (Right Bulwark) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct50->128 |
| `vegnagun-body/bulwark-l` (Left Bulwark) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct50->128 |
| `vegnagun-head/vegnagun-head` (Vegnagun) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct50->128 |
| `vegnagun-head/redoubt-r` (Right Redoubt) | Auto-Life and Itchy resisted (255); acc 0->95 |
| `vegnagun-head/redoubt-l` (Left Redoubt) | Auto-Life and Itchy resisted (255); acc 0->95 |
| `shuyin/shuyin` (Shuyin) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct12.5->32 |
| `ffx2-leblanc-entrance/ormi-entrance` (Ormi) | Auto-Life and Itchy resisted (255); resist changed: poison 30->10; acc 0->95; pilfer gil 0->560 |
| `ffx2-leblanc-entrance/dr-goon` (Dr. Goon) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct75->255; pilfer gil 0->160 |
| `ffx2-leblanc-entrance/fem-goon` (Fem-Goon) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct75->255; pilfer gil 0->200 |
| `ffx2-leblanc-logos-room/logos-room` (Logos) | Auto-Life and Itchy resisted (255); resist removed: sleep(255); acc 0->95; pilfer gil 0->580 |
| `ffx2-leblanc-logos-room/ormi-logos-room` (Ormi) | Auto-Life and Itchy resisted (255); resist removed: sleep(255); resist changed: poison 30->20; acc 0->95; pilfer gil 0->580 |
| `ffx2-leblanc-last-room/leblanc` (Leblanc) | resists the STR, DEF and Accuracy stages, up and down (255; the authored list had STR Down, DEF Down and Luck Down); Auto-Life and Itchy resisted (255); acc 0->95 |
| `ffx2-leblanc-last-room/logos` (Logos) | Auto-Life and Itchy resisted (255); acc 0->95 |
| `ffx2-leblanc-last-room/ormi` (Ormi) | Auto-Life and Itchy resisted (255); acc 0->95 |
| `ffx2-road-shiva/x2-shiva` (Shiva) | Auto-Life and Itchy resisted (255); acc 0->95 |
| `ffx2-road-magus-sisters/sandy` (Sandy) | Auto-Life and Itchy resisted (255); resist removed: reflect(255); acc 0->95; steal byte pct50->128 |
| `ffx2-road-magus-sisters/cindy` (Cindy) | Auto-Life and Itchy resisted (255); resist removed: reflect(255); acc 0->95; steal byte pct50->128 |
| `ffx2-road-magus-sisters/mindy` (Mindy) | Auto-Life and Itchy resisted (255); resist removed: reflect(255); acc 0->95; steal byte pct50->128 |
| `ffx2-road-anima/x2-anima` (Anima) | Auto-Life and Itchy resisted (255); resist removed: reflect(255); acc 0->95 |
| `ffx2-cloister-paragon-oversoul/paragon` (Paragon) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte 31->32 |
| `ffx2-cloister-trema/trema` (Trema) | Auto-Life and Itchy resisted (255); resist removed: reflect(255); acc 0->95 |
| `ffx2-den-baralai/shade-baralai` (Baralai) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct50->128 |
| `ffx2-den-gippal/shade-gippal` (Gippal) | Auto-Life and Itchy resisted (255); acc 0->95 |
| `ffx2-den-nooj/shade-nooj` (Nooj) | Auto-Life and Itchy resisted (255); acc 0->95; steal byte pct50->128 |
| `ffx2-djose-ixion/x2-ixion` (Ixion) | Auto-Life and Itchy resisted (255); acc 0->95 |

### 7.2 Stat differences left alone, and the three flags the row decides

The stat bytes, levels and HP stay as authored (never retuned); the differences are listed so Bailey can see them. The three flags are
read from the row's special word by the kernels (`adapt/words.ts specialWord`), so the row decides them: percent-immune (formulas 4 and 7
fail against it), Delay-immune and Bribe-immune; the authored `immunityFlags` list stays as data.

| Enemy | Authored -> the row |
|---|---|
| `ffx2-bahamut/bahamut` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `vegnagun-tail/vegnagun-tail` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `vegnagun-leg/vegnagun-leg` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `vegnagun-leg/node-a` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `vegnagun-leg/node-b` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `vegnagun-leg/node-c` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `vegnagun-body/vegnagun-body` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `vegnagun-body/bulwark-r` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `vegnagun-body/bulwark-l` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `vegnagun-head/vegnagun-head` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `vegnagun-head/redoubt-r` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `vegnagun-head/redoubt-l` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `shuyin/shuyin` | percent-immune false->true; delay-immune false->true; bribe-immune false->true |
| `ffx2-leblanc-entrance/ormi-entrance` | str 53->80; mag 26->20; agi 42->63 |
| `ffx2-leblanc-entrance/dr-goon` | level 17->14; str 20->35; def 30->6; mdef 10->6; agi 40->56 |
| `ffx2-leblanc-entrance/fem-goon` | level 17->16; str 12->26; def 20->5; mag 30->8; mdef 20->10; luck 3->4; agi 45->62 |
| `ffx2-leblanc-logos-room/logos-room` | str 17->16; mag 28->26; mdef 18->14; agi 49->90 |
| `ffx2-leblanc-logos-room/ormi-logos-room` | str 53->64; mag 26->24; agi 42->63 |
| `ffx2-road-shiva/x2-shiva` | agi 119->124; delay-immune false->true; bribe-immune false->true |
| `ffx2-road-magus-sisters/sandy` | delay-immune false->true; bribe-immune false->true |
| `ffx2-road-magus-sisters/cindy` | delay-immune false->true; bribe-immune false->true |
| `ffx2-road-magus-sisters/mindy` | delay-immune false->true; bribe-immune false->true |
| `ffx2-road-anima/x2-anima` | delay-immune false->true; bribe-immune false->true |
| `ffx2-cloister-paragon-oversoul/paragon` | delay-immune false->true; bribe-immune false->true |
| `ffx2-cloister-trema/trema` | agi 129->128; delay-immune false->true; bribe-immune false->true |
| `ffx2-den-baralai/shade-baralai` | delay-immune false->true; bribe-immune false->true |
| `ffx2-den-gippal/shade-gippal` | delay-immune false->true; bribe-immune false->true |
| `ffx2-den-nooj/shade-nooj` | delay-immune false->true; bribe-immune false->true |
| `ffx2-djose-ixion/x2-ixion` | delay-immune false->true; bribe-immune false->true |

## 8. AGENTS.md rule 5 (magic never rolls) against the rows

The game rolls accuracy for a few magical rows (6 of the 217 damaging magical rows in the tables); the engine's rule is that magic
always hits, kept by `ruleFive` in `adapt/command.ts resolveCommand` (a magical row whose accuracy formula is not 0 is read as formula
0 unless the ability opts back in with `canMiss: true`). Two of the six are reachable in the seven chapters:

| Row | Ability | Accuracy formula | What the engine does | Chapters |
|---|---|---|---|---|
| 0x3035 | `x2-gunner-enchanted-ammo` | 2 (the shooter's own Accuracy) | rolls: its `canMiss: true` is the one sourced exception (`ffx2-combat-core` §2.9) and the row agrees | XIII (Trema's kit) |
| 0x3087 | `x2-dark-knight-death` | 4 (the instant-effect chance from the two levels, the power 18 and the target's Death resist) | **held at never rolls**; the Death chance byte (254) and the resist decide, as before | V, XI, XIII, XV |

For Death the game's formula-4 chance is `(draw & 0x7f) + q > 128` with `q` falling with the square of the target's resist: against a
non-immune enemy near the caster's level it lands about half the time, not always. Every boss of the seven chapters has a Death resist
of 255, so the difference is never seen in them; it is listed because rule 5 holds the roll back, and Bailey decides if it should not.

No physical row is held: every reachable physical row rolls the formula the game gives it (the test `holds no physical row`). 41 of our
abilities rolled and the game's row does not (section 4); that is the game's answer and it is followed.

## 9. Inputs the rows do not carry, and how each is settled

The kernels read more than a row holds (stat bytes, stages, status words, the facing and hit-reaction state of a character). The table
of every kernel input with the engine fact it comes from, and the constant it is when the engine has no such fact, is
[docs/handoff/re-parity-w3.md](../docs/handoff/re-parity-w3.md) section 1. In short:

- Level, Strength, Magic, Defense, Magic Defense, Luck, Evasion and Accuracy of a **girl** come from our dressphere stat tables
  (`src/battle/ffx2/dressphere-stats.ts`) with her accessories; `research/re-ffx2-dressphere.md` §5 (D1) measures where those tables differ
  from the game's own stat builder (a separate batch).
- The engine models **no auto-ability** except Break Damage Limit (a Garment Grid gate or an accessory). The Booster, Medicine, Element
  Master and Non-Element Master words are 0 and the weapon element is 0 (`research/re-ffx2-dressphere.md` §4 lists the game's
  auto-abilities; the accessories of `accessories.ts` are stat-only, plus the immunities `kit.ts` sets).
- **Back attack** (the physical x2 when the target is struck from behind) needs the angle between the target's facing and the attacker.
  The engine has no facing, so the kernel's flag is always false: **never a back attack**.
- **Hit reaction.** The game forces a hit on a target that is reacting to the last hit and resets the chain counter when the reaction ends.
  The engine has no reaction state; its chain window (2 s, 3 s after a critical) stands in for both, and is the closest faithful source
  (open item in the handoff).
- **Records and flags the code does not pin** (formulas 0xd, 0x16 and 0x17's save-record fields, `Chr+0x5ac`, the action-state mask of
  the status functions) are 0; no reachable row uses those formulas, and a 0 never blocks a target or a status.
- **Break Damage Limit for a monster.** The cap is 99,999 when the attacker's `Chr+0x652` bit 0 is set or the row forces it (bit 0x80 of
  its damage flags), else 9,999. A girl gets the bit from a Garment Grid gate or an accessory (`ResolveContext.breaksDamageLimit`). The
  monster rows read so far carry no such word, and eleven moves the FAQs say break the limit have no 0x80 in their row (section 4), so
  the cast's authored `always-break-damage-limit` flag stands in for the attacker's word (`resolve-strike.ts`): the numbers the old engine
  gave, none invented. If the monster layout turns out to carry the word, that source replaces the flag.
