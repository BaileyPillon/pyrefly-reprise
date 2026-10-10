/**
 * The game's own command records for the FFX **player** abilities: White and Black Magic, Skills and Specials, the
 * eight character Overdrives, the Mixes and the aeons' own commands (record ids 0x3000 + n, the command table).
 * Re-parity W1; FFX only.
 *
 * Source: the game's battle kernel tables, FFX Steam HD build 25501027 (command.bin, 320 records), read field by
 * field (research/re-ffx-commands.md section 1); numbers only, no game code. Which record each ability is, and how
 * sure the match is, is the table of research/re-ffx-commands.md section 3.
 */

import type { FFXCommandRecord } from '../../../battle/common/types.ts';

export const COMMAND_RECORDS_PLAYER: Readonly<Record<string, FFXCommandRecord>> = {
  'requiem': { id: 0x30e3, type: 4, flagsMisc: 0x4001006, flagsDamage: 0xe, damageClass: 1 }, // Requiem (Seymour's Overdrive; no pierce bit on the command, but his staff's Piercing exempts everything he casts from Armored, kernel/modifiers.ts#armoredMod; research/re-ffx-ai-gui.md section 7.4)
  'cure': { id: 0x302b, type: 2, flagsMisc: 0x15130087, flagsDamage: 0x12, damageClass: 1 }, // Cure
  'cura': { id: 0x302c, type: 2, flagsMisc: 0x15030087, flagsDamage: 0x12, damageClass: 1 }, // Cura
  'curaga': { id: 0x302d, type: 2, flagsMisc: 0x15230087, flagsDamage: 0x12, damageClass: 1 }, // Curaga
  'esuna': { id: 0x3033, type: 2, flagsMisc: 0x15130086, flagsDamage: 0x32, damageClass: 0 }, // Esuna
  'dispel': { id: 0x303d, type: 2, flagsMisc: 0x15030006, flagsDamage: 0x32, damageClass: 0 }, // Dispel
  'life': { id: 0x3034, type: 2, flagsMisc: 0x15830086, flagsDamage: 0x32, damageClass: 1 }, // Life
  'full-life-spell': { id: 0x3035, type: 2, flagsMisc: 0x15a30086, flagsDamage: 0x32, damageClass: 1 }, // Full Life
  'auto-life': { id: 0x3040, type: 2, flagsMisc: 0x15230006, flagsDamage: 0x2, damageClass: 0 }, // Auto Life
  'regen': { id: 0x303e, type: 2, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 0 }, // Regen
  'holy': { id: 0x303f, type: 2, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Holy
  'protect': { id: 0x303b, type: 2, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 0 }, // Protect
  'shell': { id: 0x303a, type: 2, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 0 }, // Shell
  'reflect': { id: 0x303c, type: 2, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 0 }, // Reflect
  'nulblaze': { id: 0x302f, type: 2, flagsMisc: 0x15130086, flagsDamage: 0x2, damageClass: 0 }, // NulBlaze
  'nulfrost': { id: 0x302e, type: 2, flagsMisc: 0x15130086, flagsDamage: 0x2, damageClass: 0 }, // NulFrost
  'nulshock': { id: 0x3030, type: 2, flagsMisc: 0x15130086, flagsDamage: 0x2, damageClass: 0 }, // NulShock
  'nultide': { id: 0x3031, type: 2, flagsMisc: 0x15130086, flagsDamage: 0x2, damageClass: 0 }, // NulTide
  'haste': { id: 0x3036, type: 2, flagsMisc: 0x15030086, flagsDamage: 0x12, damageClass: 4 }, // Haste
  'hastega': { id: 0x3037, type: 2, flagsMisc: 0x15030086, flagsDamage: 0x12, damageClass: 4 }, // Hastega
  'slow': { id: 0x3038, type: 2, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 4 }, // Slow
  'slowga': { id: 0x3039, type: 2, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 4 }, // Slowga
  'fire': { id: 0x3042, type: 1, flagsMisc: 0x15130086, flagsDamage: 0x2, damageClass: 1 }, // Fire
  'blizzard': { id: 0x3041, type: 1, flagsMisc: 0x15130086, flagsDamage: 0x2, damageClass: 1 }, // Blizzard
  'thunder': { id: 0x3043, type: 1, flagsMisc: 0x15130086, flagsDamage: 0x2, damageClass: 1 }, // Thunder
  'water': { id: 0x3044, type: 1, flagsMisc: 0x15130086, flagsDamage: 0x2, damageClass: 1 }, // Water
  'fira': { id: 0x3045, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Fira
  'blizzara': { id: 0x3046, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Blizzara
  'thundara': { id: 0x3047, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Thundara
  'watera': { id: 0x3048, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Watera
  'firaga': { id: 0x3049, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Firaga
  'blizzaga': { id: 0x304a, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Blizzaga
  'thundaga': { id: 0x304b, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Thundaga
  'waterga': { id: 0x304c, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Waterga
  'bio': { id: 0x304d, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 0 }, // Bio
  'demi': { id: 0x304e, type: 1, flagsMisc: 0x15230006, flagsDamage: 0x2, damageClass: 1 }, // Demi
  'death': { id: 0x304f, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 0 }, // Death (picked by hand)
  'drain': { id: 0x3050, type: 1, flagsMisc: 0x15030186, flagsDamage: 0x2, damageClass: 1 }, // Drain
  'osmose-spell': { id: 0x3051, type: 1, flagsMisc: 0x15030186, flagsDamage: 0x2, damageClass: 2 }, // Osmose
  'flare': { id: 0x3052, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Flare
  'ultima': { id: 0x3053, type: 1, flagsMisc: 0x15230006, flagsDamage: 0x2, damageClass: 1 }, // Ultima
  'cheer': { id: 0x301a, type: 14, flagsMisc: 0x15100006, flagsDamage: 0x0, damageClass: 0 }, // Cheer
  'aim': { id: 0x301b, type: 14, flagsMisc: 0x15100006, flagsDamage: 0x0, damageClass: 0 }, // Aim
  'focus': { id: 0x301c, type: 14, flagsMisc: 0x15100006, flagsDamage: 0x0, damageClass: 0 }, // Focus
  'reflex': { id: 0x301d, type: 14, flagsMisc: 0x15100006, flagsDamage: 0x0, damageClass: 0 }, // Reflex
  'luck': { id: 0x301e, type: 14, flagsMisc: 0x15100006, flagsDamage: 0x0, damageClass: 0 }, // Luck
  'jinx': { id: 0x301f, type: 14, flagsMisc: 0x15100006, flagsDamage: 0x0, damageClass: 0 }, // Jinx
  'pray': { id: 0x3019, type: 14, flagsMisc: 0x15100006, flagsDamage: 0x10, damageClass: 1 }, // Pray
  'entrust': { id: 0x3027, type: 14, flagsMisc: 0x16100006, flagsDamage: 0x0, damageClass: 0 }, // Entrust
  'guard': { id: 0x3022, type: 14, flagsMisc: 0x11100006, flagsDamage: 0x0, damageClass: 0 }, // Guard
  'sentinel': { id: 0x3023, type: 14, flagsMisc: 0x11100006, flagsDamage: 0x0, damageClass: 0 }, // Sentinel
  'provoke': { id: 0x3026, type: 14, flagsMisc: 0x15000006, flagsDamage: 0x0, damageClass: 0 }, // Provoke
  'threaten': { id: 0x3025, type: 14, flagsMisc: 0x15000006, flagsDamage: 0x0, damageClass: 0 }, // Threaten
  'scan': { id: 0x3032, type: 2, flagsMisc: 0x15130086, flagsDamage: 0x2, damageClass: 0 }, // Scan
  'lancet': { id: 0x3020, type: 14, flagsMisc: 0x15110106, flagsDamage: 0x0, damageClass: 3 }, // Lancet (our numbers differ: section 4)
  'spare-change': { id: 0x3024, type: 21, flagsMisc: 0x15110006, flagsDamage: 0x40, damageClass: 1 }, // Spare Change
  'steal': { id: 0x3016, type: 14, flagsMisc: 0x10000206, flagsDamage: 0x0, damageClass: 0 }, // Steal
  'mug': { id: 0x3014, type: 3, flagsMisc: 0x1104025e, flagsDamage: 0xd, damageClass: 1 }, // Mug
  'bribe': { id: 0x302a, type: 21, flagsMisc: 0x94010006, flagsDamage: 0x0, damageClass: 0 }, // Bribe
  'pilfer-gil': { id: 0x3058, type: 14, flagsMisc: 0x10000006, flagsDamage: 0x100, damageClass: 0 }, // Pilfer Gil
  'nab-gil': { id: 0x305e, type: 3, flagsMisc: 0x1104005e, flagsDamage: 0x10d, damageClass: 1 }, // Nab Gil
  'quick-pockets': { id: 0x305f, type: 6, flagsMisc: 0x10000002, flagsDamage: 0x0, damageClass: 0 }, // Quick Pockets
  'copycat': { id: 0x3028, type: 14, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0 }, // Copycat
  'doublecast': { id: 0x3029, type: 1, flagsMisc: 0x10000006, flagsDamage: 0x0, damageClass: 0 }, // Doublecast
  'use': { id: 0x3017, type: 17, flagsMisc: 0x10000006, flagsDamage: 0x0, damageClass: 0 }, // Use
  'sleep-attack': { id: 0x3008, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Sleep Attack
  'silence-attack': { id: 0x3009, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Silence Attack
  'dark-attack': { id: 0x300a, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Dark Attack
  'zombie-attack': { id: 0x300b, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Zombie Attack
  'sleep-buster': { id: 0x300c, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Sleep Buster
  'silence-buster': { id: 0x300d, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Silence Buster
  'dark-buster': { id: 0x300e, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Dark Buster
  'triple-foul': { id: 0x300f, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Triple Foul
  'delay-attack': { id: 0x3006, type: 3, flagsMisc: 0x1504205e, flagsDamage: 0xd, damageClass: 1 }, // Delay Attack
  'delay-buster': { id: 0x3007, type: 3, flagsMisc: 0x1504405e, flagsDamage: 0xd, damageClass: 1 }, // Delay Buster
  'power-break': { id: 0x3010, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Power Break
  'magic-break': { id: 0x3011, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Magic Break
  'armor-break': { id: 0x3012, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Armor Break
  'mental-break': { id: 0x3013, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Mental Break
  'full-break': { id: 0x3059, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Full Break
  'quick-hit': { id: 0x3015, type: 3, flagsMisc: 0x1104005e, flagsDamage: 0xd, damageClass: 1 }, // Quick Hit
  'extract-power': { id: 0x305a, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Extract Power
  'extract-mana': { id: 0x305b, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Extract Mana
  'extract-speed': { id: 0x305c, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Extract Speed
  'extract-ability': { id: 0x305d, type: 3, flagsMisc: 0x1504005e, flagsDamage: 0xd, damageClass: 1 }, // Extract Ability
  'spiral-cut': { id: 0x3060, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Spiral Cut
  'slice-and-dice': { id: 0x3061, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x4, damageClass: 1 }, // Slice & Dice
  'energy-rain': { id: 0x3062, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Energy Rain
  'blitz-ace': { id: 0x3063, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Blitz Ace
  'dragon-fang': { id: 0x3065, type: 4, flagsMisc: 0x4013006, flagsDamage: 0x4, damageClass: 1 }, // Dragon Fang
  'shooting-star': { id: 0x3064, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Shooting Star
  'banishing-blade': { id: 0x3066, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Banishing Blade
  'tornado': { id: 0x3067, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Tornado (our numbers differ: section 4)
  'element-reels': { id: 0x3074, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 1 }, // Element Reels
  'attack-reels': { id: 0x3075, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 1 }, // Attack Reels (picked by hand)
  'status-reels': { id: 0x3076, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 1 }, // Status Reels
  'aurochs-reels': { id: 0x3077, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 1 }, // Aurochs Reels
  'fire-shot': { id: 0x30ef, type: 4, flagsMisc: 0x11002, flagsDamage: 0x0, damageClass: 1 }, // Fire Shot (same fields as 0x30f0)
  'ice-shot': { id: 0x30f1, type: 4, flagsMisc: 0x11002, flagsDamage: 0x0, damageClass: 1 }, // Ice Shot (same fields as 0x30f2)
  'water-shot': { id: 0x30f3, type: 4, flagsMisc: 0x11002, flagsDamage: 0x0, damageClass: 1 }, // Water Shot (same fields as 0x30f4)
  'thunder-shot': { id: 0x30f5, type: 4, flagsMisc: 0x11002, flagsDamage: 0x0, damageClass: 1 }, // Thunder Shot (same fields as 0x30f6)
  'havoc-shot': { id: 0x30f7, type: 4, flagsMisc: 0x11002, flagsDamage: 0x0, damageClass: 1 }, // Havoc Shot (same fields as 0x30f8)
  'break-shot': { id: 0x30fb, type: 4, flagsMisc: 0x11002, flagsDamage: 0x0, damageClass: 1 }, // Break Shot (same fields as 0x30fc)
  'time-shot': { id: 0x30f9, type: 4, flagsMisc: 0x13002, flagsDamage: 0x0, damageClass: 1 }, // Time Shot (same fields as 0x30fa)
  'aurochs-shot': { id: 0x30fd, type: 4, flagsMisc: 0x11002, flagsDamage: 0x0, damageClass: 1 }, // Aurochs Shot
  'power-shot': { id: 0x30fe, type: 4, flagsMisc: 0x11002, flagsDamage: 0x0, damageClass: 1 }, // Power Shot
  'attack-reels-hit': { id: 0x312e, type: 4, flagsMisc: 0x19002, flagsDamage: 0x0, damageClass: 1 }, // Attack Reels (picked by hand)
  'fire-fury': { id: 0x3079, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x0, damageClass: 1 }, // Fire Fury
  'blizzard-fury': { id: 0x3078, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x0, damageClass: 1 }, // Blizzard Fury
  'thunder-fury': { id: 0x307a, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x0, damageClass: 1 }, // Thunder Fury
  'water-fury': { id: 0x307b, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x0, damageClass: 1 }, // Water Fury
  'fira-fury': { id: 0x307c, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x0, damageClass: 1 }, // Fira Fury
  'blizzara-fury': { id: 0x307d, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x0, damageClass: 1 }, // Blizzara Fury
  'thundara-fury': { id: 0x307e, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x0, damageClass: 1 }, // Thundara Fury
  'watera-fury': { id: 0x307f, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x0, damageClass: 1 }, // Watera Fury
  'firaga-fury': { id: 0x3080, type: 4, flagsMisc: 0x4219006, flagsDamage: 0x0, damageClass: 1 }, // Firaga Fury
  'blizzaga-fury': { id: 0x3081, type: 4, flagsMisc: 0x4219006, flagsDamage: 0x0, damageClass: 1 }, // Blizzaga Fury
  'thundaga-fury': { id: 0x3082, type: 4, flagsMisc: 0x4219006, flagsDamage: 0x0, damageClass: 1 }, // Thundaga Fury
  'waterga-fury': { id: 0x3083, type: 4, flagsMisc: 0x4219006, flagsDamage: 0x0, damageClass: 1 }, // Waterga Fury
  'bio-fury': { id: 0x3084, type: 4, flagsMisc: 0x4219006, flagsDamage: 0x0, damageClass: 0 }, // Bio Fury
  'demi-fury': { id: 0x3085, type: 4, flagsMisc: 0x4211006, flagsDamage: 0x0, damageClass: 1 }, // Demi Fury
  'death-fury': { id: 0x3086, type: 4, flagsMisc: 0x4219006, flagsDamage: 0x0, damageClass: 0 }, // Death Fury
  'drain-fury': { id: 0x3087, type: 4, flagsMisc: 0x4019106, flagsDamage: 0x0, damageClass: 1 }, // Drain Fury
  'osmose-fury': { id: 0x3088, type: 4, flagsMisc: 0x4019106, flagsDamage: 0x0, damageClass: 2 }, // Osmose Fury
  'flare-fury': { id: 0x3089, type: 4, flagsMisc: 0x4219006, flagsDamage: 0x0, damageClass: 1 }, // Flare Fury
  'ultima-fury': { id: 0x308a, type: 4, flagsMisc: 0x4211006, flagsDamage: 0x0, damageClass: 1 }, // Ultima Fury
  'jump': { id: 0x3068, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Jump
  'fire-breath': { id: 0x3069, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Fire Breath
  'seed-cannon': { id: 0x306a, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Seed Cannon
  'self-destruct': { id: 0x306b, type: 4, flagsMisc: 0x4411006, flagsDamage: 0x4, damageClass: 1 }, // Self Destruct
  'thrust-kick': { id: 0x306c, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Thrust Kick
  'stone-breath': { id: 0x306d, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 0 }, // Stone Breath
  'aqua-breath': { id: 0x306e, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Aqua Breath
  'doom': { id: 0x306f, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Doom
  'white-wind': { id: 0x3070, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x10, damageClass: 1 }, // White Wind
  'bad-breath': { id: 0x3071, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Bad Breath
  'mighty-guard': { id: 0x3072, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Mighty Guard
  'nova': { id: 0x3073, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Nova
  'grand-summon': { id: 0x3118, type: 5, flagsMisc: 0x4001002, flagsDamage: 0x0, damageClass: 0 }, // Grand Summon
  'flee': { id: 0x3018, type: 14, flagsMisc: 0x18000006, flagsDamage: 0x0, damageClass: 0 }, // Flee
  'talk': { id: 0x3105, type: 0, flagsMisc: 0x81006, flagsDamage: 0x0, damageClass: 0 }, // Talk
  'fury': { id: 0x311d, type: 4, flagsMisc: 0x4001002, flagsDamage: 0x0, damageClass: 0 }, // Fury
  'pull-back': { id: 0x3107, type: 0, flagsMisc: 0x81006, flagsDamage: 0x0, damageClass: 0 }, // Pull back
  'valefor-attack': { id: 0x30cb, type: 0, flagsMisc: 0x501002a, flagsDamage: 0xd, damageClass: 1 }, // Attack (picked by hand)
  'sonic-wings': { id: 0x30cc, type: 0, flagsMisc: 0x5012006, flagsDamage: 0xd, damageClass: 1 }, // Sonic Wings
  'energy-ray': { id: 0x30ce, type: 0, flagsMisc: 0x44011006, flagsDamage: 0x0, damageClass: 1 }, // Energy Ray
  'energy-blast': { id: 0x30cd, type: 0, flagsMisc: 0x44011006, flagsDamage: 0x0, damageClass: 1 }, // Energy Blast
  'ifrit-attack': { id: 0x30cf, type: 0, flagsMisc: 0x1010032, flagsDamage: 0xd, damageClass: 1 }, // Attack (picked by hand)
  'meteor-strike': { id: 0x30d0, type: 0, flagsMisc: 0x5010006, flagsDamage: 0xc, damageClass: 1 }, // Meteor Strike
  'hellfire': { id: 0x30d1, type: 0, flagsMisc: 0x44011006, flagsDamage: 0x0, damageClass: 1 }, // Hellfire
  'ixion-attack': { id: 0x30d2, type: 0, flagsMisc: 0x1010032, flagsDamage: 0xd, damageClass: 1 }, // Attack (picked by hand)
  'aerospark': { id: 0x30d3, type: 0, flagsMisc: 0x5010006, flagsDamage: 0x2d, damageClass: 1 }, // Aerospark
  'thors-hammer': { id: 0x30d4, type: 0, flagsMisc: 0x44011006, flagsDamage: 0x0, damageClass: 1 }, // Thor's Hammer
  'shiva-attack': { id: 0x30d5, type: 0, flagsMisc: 0x101002a, flagsDamage: 0xd, damageClass: 1 }, // Attack (picked by hand)
  'heavenly-strike': { id: 0x30d6, type: 0, flagsMisc: 0x5010006, flagsDamage: 0xd, damageClass: 1 }, // Heavenly Strike
  'diamond-dust': { id: 0x30d7, type: 0, flagsMisc: 0x44011006, flagsDamage: 0x0, damageClass: 1 }, // Diamond Dust
  'bahamut-attack': { id: 0x30d8, type: 0, flagsMisc: 0x1010032, flagsDamage: 0xd, damageClass: 1 }, // Attack (picked by hand)
  'impulse': { id: 0x30d9, type: 0, flagsMisc: 0x5010006, flagsDamage: 0xd, damageClass: 1 }, // Impulse
  'mega-flare': { id: 0x30da, type: 0, flagsMisc: 0x44011006, flagsDamage: 0x0, damageClass: 1 }, // Mega Flare
  'anima-attack': { id: 0x30db, type: 0, flagsMisc: 0x1010032, flagsDamage: 0xd, damageClass: 1 }, // Attack (picked by hand)
  'pain': { id: 0x30dc, type: 0, flagsMisc: 0x4010006, flagsDamage: 0x2, damageClass: 1 }, // Pain
  'oblivion': { id: 0x30dd, type: 0, flagsMisc: 0x44011006, flagsDamage: 0x0, damageClass: 1 }, // Oblivion
  'daigoro': { id: 0x30de, type: 0, flagsMisc: 0x10006, flagsDamage: 0xd, damageClass: 1 }, // Daigoro
  'kozuka': { id: 0x30df, type: 0, flagsMisc: 0x4010006, flagsDamage: 0xd, damageClass: 1 }, // Kozuka
  'wakizashi-single': { id: 0x30e0, type: 0, flagsMisc: 0x4010006, flagsDamage: 0xd, damageClass: 1 }, // Wakizashi (same fields as 0x30e1)
  'wakizashi-multi': { id: 0x30e0, type: 0, flagsMisc: 0x4010006, flagsDamage: 0xd, damageClass: 1 }, // Wakizashi (same fields as 0x30e1)
  'zanmato': { id: 0x30e2, type: 0, flagsMisc: 0x44010006, flagsDamage: 0x0, damageClass: 0 }, // Zanmato
  'cindy-attack': { id: 0x30e4, type: 0, flagsMisc: 0x10006, flagsDamage: 0xd, damageClass: 1 }, // Attack (picked by hand)
  'sandy-attack': { id: 0x30e6, type: 0, flagsMisc: 0x10006, flagsDamage: 0xd, damageClass: 1 }, // Attack (picked by hand)
  'mindy-attack': { id: 0x30e8, type: 0, flagsMisc: 0x10006, flagsDamage: 0xd, damageClass: 1 }, // Attack (picked by hand)
  'camisade': { id: 0x30e5, type: 0, flagsMisc: 0x4010006, flagsDamage: 0xd, damageClass: 1 }, // Camisade
  'razzia': { id: 0x30e7, type: 0, flagsMisc: 0x4010006, flagsDamage: 0xd, damageClass: 1 }, // Razzia
  'passado': { id: 0x30e9, type: 0, flagsMisc: 0x4010006, flagsDamage: 0xd, damageClass: 1 }, // Passado
  'nul-all-aeon': { id: 0x312d, type: 0, flagsMisc: 0x4010006, flagsDamage: 0x0, damageClass: 0 }, // NulAll (picked by hand)
  'delta-attack': { id: 0x30ea, type: 0, flagsMisc: 0x44011006, flagsDamage: 0xc, damageClass: 1 }, // Delta Attack
  'shield': { id: 0x3054, type: 0, flagsMisc: 0x806, flagsDamage: 0x0, damageClass: 0 }, // Shield
  'boost': { id: 0x3055, type: 0, flagsMisc: 0x806, flagsDamage: 0x0, damageClass: 0 }, // Boost
  'dismiss': { id: 0x3056, type: 0, flagsMisc: 0x806, flagsDamage: 0x0, damageClass: 0 }, // Dismiss (picked by hand)
  'mix': { id: 0x311e, type: 20, flagsMisc: 0x4011002, flagsDamage: 0x0, damageClass: 0 }, // Mix
  'mix-ultra-potion': { id: 0x30ac, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x10, damageClass: 1 }, // Ultra Potion
  'mix-panacea': { id: 0x30ad, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x20, damageClass: 0 }, // Panacea
  'mix-ultra-cure': { id: 0x30ae, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x30, damageClass: 1 }, // Ultra Cure
  'mix-mega-phoenix': { id: 0x30af, type: 4, flagsMisc: 0x4811006, flagsDamage: 0x70, damageClass: 1 }, // Mega Phoenix
  'mix-final-phoenix': { id: 0x30b0, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x30, damageClass: 1 }, // Final Phoenix
  'mix-elixir': { id: 0x30b1, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x50, damageClass: 3 }, // Elixir
  'mix-megalixir': { id: 0x30b2, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x50, damageClass: 3 }, // Megalixir
  'mix-super-elixir': { id: 0x30b3, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x30, damageClass: 3 }, // Super Elixir
  'mix-final-elixir': { id: 0x30b4, type: 4, flagsMisc: 0x4011006, flagsDamage: 0xb0, damageClass: 3 }, // Final Elixir
  'mix-nul-all': { id: 0x30b5, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // NulAll (picked by hand)
  'mix-mega-nul-all': { id: 0x30b6, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Mega NulAll
  'mix-hyper-nul-all': { id: 0x30b7, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Hyper NulAll
  'mix-ultra-nul-all': { id: 0x30b8, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Ultra NulAll
  'mix-mighty-wall': { id: 0x30b9, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Mighty Wall
  'mix-mighty-g': { id: 0x30ba, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Mighty G
  'mix-super-mighty-g': { id: 0x30bb, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Super Mighty G
  'mix-hyper-mighty-g': { id: 0x30bc, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Hyper Mighty G
  'mix-vitality': { id: 0x30bd, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Vitality
  'mix-mega-vitality': { id: 0x30be, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Mega Vitality
  'mix-hyper-vitality': { id: 0x30bf, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Hyper Vitality
  'mix-mana': { id: 0x30c0, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Mana
  'mix-mega-mana': { id: 0x30c1, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Mega Mana
  'mix-hyper-mana': { id: 0x30c2, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Hyper Mana
  'mix-freedom': { id: 0x30c3, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Freedom
  'mix-freedom-x': { id: 0x30c4, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Freedom X
  'mix-quartet-of-9': { id: 0x30c5, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Quartet of 9
  'mix-trio-of-9999': { id: 0x30c6, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Trio of 9999
  'mix-hero-drink': { id: 0x30c7, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Hero Drink
  'mix-miracle-drink': { id: 0x30c8, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Miracle Drink
  'mix-hot-spurs': { id: 0x30c9, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Hot Spurs
  'mix-eccentrick': { id: 0x30ca, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 0 }, // Eccentrick
  'mix-grenade': { id: 0x308b, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Grenade
  'mix-frag-grenade': { id: 0x308c, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Frag Grenade
  'mix-potato-masher': { id: 0x308e, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Potato Masher
  'mix-cluster-bomb': { id: 0x308f, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Cluster Bomb
  'mix-tallboy': { id: 0x3090, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Tallboy
  'mix-chaos-grenade': { id: 0x3094, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x4, damageClass: 1 }, // Chaos Grenade
  'mix-firestorm': { id: 0x3096, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x0, damageClass: 1 }, // Firestorm
  'mix-abaddon-flame': { id: 0x3099, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x0, damageClass: 1 }, // Abaddon Flame
  'mix-burning-soul': { id: 0x3097, type: 4, flagsMisc: 0x4019006, flagsDamage: 0x0, damageClass: 1 }, // Burning Soul
  'mix-nega-burst': { id: 0x30a9, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 1 }, // Nega Burst
  'mix-black-hole': { id: 0x30aa, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x0, damageClass: 1 }, // Black Hole
  'mix-sunburst': { id: 0x30ab, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x80, damageClass: 1 }, // Sunburst
};
