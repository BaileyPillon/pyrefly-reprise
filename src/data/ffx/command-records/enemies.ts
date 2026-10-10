/**
 * The game's own command records for the FFX **boss** abilities (the `src/data/ffx/enemies/*-abilities.ts` files).
 * Record ids 0x4000 + n (monster magic 1), 0x6000 + n (monster magic 2), and 0x2000 / 0x3000 + n where a boss uses
 * a player command. Re-parity W1; FFX only.
 *
 * Source: the game's battle kernel tables, FFX Steam HD build 25501027 (monmagic1.bin 300 records, monmagic2.bin
 * 247 records, plus the command and item tables), read field by field (research/re-ffx-commands.md section 1);
 * numbers only, no game code. A "same name, other numbers" row is the record the ability is closest to when our
 * own number differs from the game's; the differences are listed in research/re-ffx-commands.md section 4.
 */

import type { FFXCommandRecord, FFXPlainAttack } from '../../../battle/common/types.ts';

/**
 * The possessed aeons' plain Attack: monster-magic-2 record 0x6000 "Attack" (accuracy formula 2 on a byte of 90, formula 1,
 * power 16, physical, cannot crit, no shatter). The aeons' scripts (m163 to m167, Valefor to Bahamut) attack with exactly this
 * command in the half of their turns where they do not use their special (research/re-ffx-ai-yunalesca-bfa.md section 5.5);
 * the party's own Attack record (0x3000) is the party's. research/re-ffx-commands.md section 6.
 */
export const POSSESSED_PLAIN_ATTACK: FFXPlainAttack = {
  record: { id: 0x6000, type: 0, flagsMisc: 0x52, flagsDamage: 0x1, damageClass: 1 },
  accuracy: 90,
  critBonus: 0,
};

export const COMMAND_RECORDS_ENEMIES: Readonly<Record<string, FFXCommandRecord>> = {
  'lance-of-atrophy': { id: 0x6078, type: 0, flagsMisc: 0x6, flagsDamage: 0x1, damageClass: 1 }, // Lance of Atrophy (our numbers differ: section 4)
  'full-life': { id: 0x60f5, type: 0, flagsMisc: 0x4800086, flagsDamage: 0x32, damageClass: 1 }, // Full Life
  'cross-cleave': { id: 0x6074, type: 0, flagsMisc: 0x4006, flagsDamage: 0x1, damageClass: 1 }, // Cross Cleave (our numbers differ: section 4)
  'total-annihilation': { id: 0x6075, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 1 }, // Total Annihilation
  'flare-self': { id: 0x6079, type: 0, flagsMisc: 0x30086, flagsDamage: 0x2, damageClass: 1 }, // Flare
  'banish': { id: 0x6050, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 0 }, // Banish
  'mortibsorption': { id: 0x60a9, type: 0, flagsMisc: 0x106, flagsDamage: 0x0, damageClass: 1 }, // Mortibsorption (our numbers differ: section 4)
  'slowga-counter': { id: 0x608d, type: 0, flagsMisc: 0x4000086, flagsDamage: 0x2, damageClass: 4 }, // Slowga
  'dispelling-slap': { id: 0x607c, type: 0, flagsMisc: 0x2, flagsDamage: 0x25, damageClass: 1 }, // Dispelling Slap (our numbers differ: section 4)
  'absorb': { id: 0x606d, type: 0, flagsMisc: 0x106, flagsDamage: 0x0, damageClass: 1 }, // Absorb
  'osmose': { id: 0x607a, type: 0, flagsMisc: 0x10106, flagsDamage: 0x2, damageClass: 2 }, // Osmose
  'hellbiter': { id: 0x6080, type: 0, flagsMisc: 0x6, flagsDamage: 0x1, damageClass: 1 }, // Hellbiter (our numbers differ: section 4)
  'mind-blast': { id: 0x6081, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 1 }, // Mind Blast
  'mind-blast-aeon': { id: 0x6081, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 1 }, // Mind Blast
  'mega-death': { id: 0x6082, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 0 }, // Mega Death
  'blind-counter': { id: 0x6070, type: 0, flagsMisc: 0x20086, flagsDamage: 0x0, damageClass: 0 }, // Blind
  'silence-counter': { id: 0x606e, type: 0, flagsMisc: 0x20086, flagsDamage: 0x0, damageClass: 0 }, // Silence
  'sleep-counter': { id: 0x6071, type: 0, flagsMisc: 0x20086, flagsDamage: 0x0, damageClass: 0 }, // Sleep
  'metamorphosis-1': { id: 0x607e, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Metamorphosis (same fields as 0x607f)
  'metamorphosis-2': { id: 0x607e, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Metamorphosis (same fields as 0x607f)
  'left-arm-strike': { id: 0x60c6, type: 0, flagsMisc: 0x2042, flagsDamage: 0x8d, damageClass: 1 }, // Left Arm Strike (our numbers differ: section 4)
  'left-arm-strike-2': { id: 0x60c7, type: 0, flagsMisc: 0x2042, flagsDamage: 0x8d, damageClass: 1 }, // Left Arm Strike 2 (picked by hand)
  'jecht-beam': { id: 0x6084, type: 0, flagsMisc: 0x6, flagsDamage: 0x6, damageClass: 1 }, // Jecht Beam (our numbers differ: section 4)
  'triumphant-grasp': { id: 0x6085, type: 0, flagsMisc: 0x6, flagsDamage: 0x44, damageClass: 1 }, // Triumphant Grasp
  'triumphant-grasp-2': { id: 0x60c9, type: 0, flagsMisc: 0x6, flagsDamage: 0x8c, damageClass: 1 }, // Triumphant Grasp
  'jecht-bomber': { id: 0x6087, type: 0, flagsMisc: 0x6, flagsDamage: 0x40, damageClass: 1 }, // Jecht Bomber (picked by hand)
  'jecht-bomber-2': { id: 0x60c8, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1 }, // Jecht Bomber (our numbers differ: section 4)
  'draws-sword': { id: 0x6088, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Draws sword.
  'blade-blitz': { id: 0x6089, type: 0, flagsMisc: 0x2052, flagsDamage: 0x41, damageClass: 1 }, // Blade Blitz
  'ultimate-jecht-shot': { id: 0x6086, type: 0, flagsMisc: 0x6, flagsDamage: 0x40, damageClass: 1 }, // Ultimate Jecht Shot (our numbers differ: section 4)
  'power-wave-bfa': { id: 0x608b, type: 0, flagsMisc: 0x6, flagsDamage: 0x30, damageClass: 1 }, // Power Wave (same fields as 0x60d2)
  'power-wave-aeon': { id: 0x608b, type: 0, flagsMisc: 0x6, flagsDamage: 0x30, damageClass: 1 }, // Power Wave (same fields as 0x60d2)
  'yu-pagoda-curse': { id: 0x607b, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 1 }, // Curse
  'gravija': { id: 0x6083, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 1 }, // Gravija
  'yu-yevon-command-254': { id: 0x60f4, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Command 254
  'possessed-valefor-sonic-wings': { id: 0x60d3, type: 0, flagsMisc: 0x5012006, flagsDamage: 0xd, damageClass: 1 }, // Sonic Wings (picked by hand)
  'possessed-valefor-energy-ray': { id: 0x60d5, type: 0, flagsMisc: 0x44010006, flagsDamage: 0x0, damageClass: 1 }, // Energy Ray
  'possessed-valefor-energy-blast': { id: 0x60d4, type: 0, flagsMisc: 0x44010006, flagsDamage: 0x0, damageClass: 1 }, // Energy Blast (our numbers differ: section 4)
  'possessed-ifrit-meteor-strike': { id: 0x60d6, type: 0, flagsMisc: 0x5010006, flagsDamage: 0xc, damageClass: 1 }, // Meteor Strike (our numbers differ: section 4)
  'possessed-ifrit-hellfire': { id: 0x60d7, type: 0, flagsMisc: 0x44010006, flagsDamage: 0x0, damageClass: 1 }, // Hellfire (our numbers differ: section 4)
  'possessed-ixion-aerospark': { id: 0x60d8, type: 0, flagsMisc: 0x5010006, flagsDamage: 0x2d, damageClass: 1 }, // Aerospark (picked by hand)
  'possessed-ixion-thors-hammer': { id: 0x60d9, type: 0, flagsMisc: 0x44010006, flagsDamage: 0x0, damageClass: 1 }, // Thor's Hammer (our numbers differ: section 4)
  'possessed-shiva-heavenly-strike': { id: 0x60da, type: 0, flagsMisc: 0x5014006, flagsDamage: 0xd, damageClass: 1 }, // Heavenly Strike (picked by hand)
  'possessed-shiva-diamond-dust': { id: 0x60db, type: 0, flagsMisc: 0x44010006, flagsDamage: 0x0, damageClass: 1 }, // Diamond Dust (our numbers differ: section 4)
  'possessed-bahamut-impulse': { id: 0x60dc, type: 0, flagsMisc: 0x5010006, flagsDamage: 0xd, damageClass: 1 }, // Impulse (picked by hand)
  'possessed-bahamut-mega-flare': { id: 0x60dd, type: 0, flagsMisc: 0x44010006, flagsDamage: 0x0, damageClass: 1 }, // Mega Flare (picked by hand)
  'possessed-anima-pain': { id: 0x60de, type: 0, flagsMisc: 0x4010006, flagsDamage: 0x2, damageClass: 1 }, // Pain (our numbers differ: section 4)
  'possessed-anima-oblivion': { id: 0x60df, type: 0, flagsMisc: 0x44010006, flagsDamage: 0x0, damageClass: 1 }, // Oblivion (our numbers differ: section 4)
  'possessed-yojimbo-daigoro': { id: 0x40b1, type: 0, flagsMisc: 0x6, flagsDamage: 0xd, damageClass: 1 }, // Daigoro (picked by hand)
  'possessed-yojimbo-zanmato': { id: 0x60e2, type: 0, flagsMisc: 0x44010006, flagsDamage: 0x0, damageClass: 1 }, // Zanmato
  'possessed-cindy-camisade': { id: 0x60e3, type: 0, flagsMisc: 0x4010006, flagsDamage: 0xd, damageClass: 1 }, // Camisade (our numbers differ: section 4)
  'possessed-cindy-delta-attack': { id: 0x60e6, type: 0, flagsMisc: 0x44010006, flagsDamage: 0xc, damageClass: 1 }, // Delta Attack (our numbers differ: section 4)
  'possessed-sandy-razzia': { id: 0x60e4, type: 0, flagsMisc: 0x4010006, flagsDamage: 0xd, damageClass: 1 }, // Razzia (our numbers differ: section 4)
  'possessed-mindy-passado': { id: 0x60e5, type: 0, flagsMisc: 0x4010006, flagsDamage: 0xd, damageClass: 1 }, // Passado
  'mac-blizzara': { id: 0x3046, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Blizzara
  'mac-thundara': { id: 0x3047, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Thundara
  'mac-watera': { id: 0x3048, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Watera
  'mac-fira': { id: 0x3045, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Fira
  'mac-blizzaga': { id: 0x304a, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Blizzaga
  'mac-thundaga': { id: 0x304b, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Thundaga
  'mac-waterga': { id: 0x304c, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Waterga
  'mac-firaga': { id: 0x3049, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Firaga
  'mac-multi-blizzara': { id: 0x60ad, type: 0, flagsMisc: 0x4020086, flagsDamage: 0x2, damageClass: 1 }, // Multi Blizzara
  'mac-multi-thundara': { id: 0x60af, type: 0, flagsMisc: 0x4020086, flagsDamage: 0x2, damageClass: 1 }, // Multi Thundara
  'mac-multi-watera': { id: 0x60b1, type: 0, flagsMisc: 0x4020086, flagsDamage: 0x2, damageClass: 1 }, // Multi Watera
  'mac-multi-fira': { id: 0x60ab, type: 0, flagsMisc: 0x4020086, flagsDamage: 0x2, damageClass: 1 }, // Multi Fira
  'guardian-blizzard': { id: 0x603a, type: 0, flagsMisc: 0x20086, flagsDamage: 0x2, damageClass: 1 }, // Blizzard (our numbers differ: section 4)
  'guardian-thunder': { id: 0x603b, type: 0, flagsMisc: 0x20086, flagsDamage: 0x2, damageClass: 1 }, // Thunder (our numbers differ: section 4)
  'guardian-auto-potion': { id: 0x4010, type: 0, flagsMisc: 0x6, flagsDamage: 0x10, damageClass: 1 }, // Auto Potion
  'guardian-hi-potion': { id: 0x603e, type: 0, flagsMisc: 0x6, flagsDamage: 0x10, damageClass: 1 }, // Hi Potion
  'guardian-remedy': { id: 0x6040, type: 0, flagsMisc: 0x6, flagsDamage: 0x32, damageClass: 0 }, // Remedy
  'guardian-remedy-self': { id: 0x6040, type: 0, flagsMisc: 0x6, flagsDamage: 0x32, damageClass: 0 }, // Remedy
  'guardian-shremedy': { id: 0x6041, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 0 }, // Shremedy
  'anima-boost': { id: 0x3055, type: 0, flagsMisc: 0x806, flagsDamage: 0x0, damageClass: 0 }, // Boost
  'anima-pain-boss': { id: 0x60de, type: 0, flagsMisc: 0x4010006, flagsDamage: 0x2, damageClass: 1 }, // Pain
  'anima-oblivion': { id: 0x60df, type: 0, flagsMisc: 0x44010006, flagsDamage: 0x0, damageClass: 1 }, // Oblivion
  'evrae-attack': { id: 0x407f, type: 0, flagsMisc: 0x52, flagsDamage: 0xd, damageClass: 1 }, // Attack (same fields as 0x4098, 0x409b, 0x409d, 0x409f)
  'evrae-swooping-scythe': { id: 0x605b, type: 0, flagsMisc: 0x16, flagsDamage: 0x1, damageClass: 1 }, // Swooping Scythe
  'evrae-poison-breath': { id: 0x6061, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 1 }, // Poison Breath
  'evrae-stone-gaze': { id: 0x4038, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0 }, // Stone Gaze (same fields as 0x40a9)
  'evrae-photon-spray': { id: 0x6063, type: 0, flagsMisc: 0x8006, flagsDamage: 0x2, damageClass: 1 }, // Photon Spray
  'evrae-inhale': { id: 0x6064, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Inhale
  'evrae-out-of-breath-range': { id: 0x6065, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0 }, // Out of breath range.
  'evrae-haste': { id: 0x3036, type: 2, flagsMisc: 0x15030086, flagsDamage: 0x12, damageClass: 4 }, // Haste
  'cid-guided-missiles': { id: 0x6073, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 1 }, // Guided Missiles
  'yojimbo-summon': { id: 0x4090, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Summon
  'yojimbo-daigoro': { id: 0x4086, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0 }, // Daigoro
  'yojimbo-kozuka': { id: 0x4082, type: 0, flagsMisc: 0x6, flagsDamage: 0x1, damageClass: 1 }, // Kozuka
  'yojimbo-wakizashi': { id: 0x4083, type: 0, flagsMisc: 0x6, flagsDamage: 0x1, damageClass: 1 }, // Wakizashi
  'yojimbo-zanmato': { id: 0x4085, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x0, damageClass: 1 }, // Zanmato
  'daigoro-attack': { id: 0x40b1, type: 0, flagsMisc: 0x6, flagsDamage: 0xd, damageClass: 1 }, // Daigoro
  'natus-multi-fira': { id: 0x60ab, type: 0, flagsMisc: 0x4020086, flagsDamage: 0x2, damageClass: 1 }, // Multi Fira
  'natus-multi-blizzara': { id: 0x60ad, type: 0, flagsMisc: 0x4020086, flagsDamage: 0x2, damageClass: 1 }, // Multi Blizzara
  'natus-multi-thundara': { id: 0x60af, type: 0, flagsMisc: 0x4020086, flagsDamage: 0x2, damageClass: 1 }, // Multi Thundara
  'natus-multi-watera': { id: 0x60b1, type: 0, flagsMisc: 0x4020086, flagsDamage: 0x2, damageClass: 1 }, // Multi Watera
  'natus-break': { id: 0x604f, type: 0, flagsMisc: 0x20086, flagsDamage: 0x0, damageClass: 0 }, // Break
  'natus-flare': { id: 0x6079, type: 0, flagsMisc: 0x30086, flagsDamage: 0x2, damageClass: 1 }, // Flare (our numbers differ: section 4)
  'mortibody-fire': { id: 0x6039, type: 0, flagsMisc: 0x20086, flagsDamage: 0x2, damageClass: 1 }, // Fire
  'mortibody-blizzard': { id: 0x603a, type: 0, flagsMisc: 0x20086, flagsDamage: 0x2, damageClass: 1 }, // Blizzard
  'mortibody-thunder': { id: 0x603b, type: 0, flagsMisc: 0x20086, flagsDamage: 0x2, damageClass: 1 }, // Thunder
  'mortibody-water': { id: 0x603c, type: 0, flagsMisc: 0x20086, flagsDamage: 0x2, damageClass: 1 }, // Water
  'mortibody-shattering-claw': { id: 0x6076, type: 0, flagsMisc: 0x16, flagsDamage: 0x1, damageClass: 1 }, // Shattering Claw
  'mortibody-desperado': { id: 0x605e, type: 0, flagsMisc: 0x6, flagsDamage: 0x20, damageClass: 1 }, // Desperado
  'mortibody-cura': { id: 0x302c, type: 2, flagsMisc: 0x15030087, flagsDamage: 0x12, damageClass: 1 }, // Cura
  'omnis-fira': { id: 0x3045, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Fira
  'omnis-blizzara': { id: 0x3046, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Blizzara
  'omnis-thundara': { id: 0x3047, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Thundara
  'omnis-watera': { id: 0x3048, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Watera
  'omnis-firaga': { id: 0x3049, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Firaga
  'omnis-blizzaga': { id: 0x304a, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Blizzaga
  'omnis-thundaga': { id: 0x304b, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Thundaga
  'omnis-waterga': { id: 0x304c, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Waterga
  'omnis-dispel': { id: 0x303d, type: 2, flagsMisc: 0x15030006, flagsDamage: 0x32, damageClass: 0 }, // Dispel
  'omnis-ultima': { id: 0x60f0, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 1 }, // Ultima
  'grothia-summon': { id: 0x408c, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Summon
  'pterya-summon': { id: 0x408b, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Summon
  'spathi-summon': { id: 0x408f, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Summon
  'grothia-attack': { id: 0x4000, type: 0, flagsMisc: 0x52, flagsDamage: 0xd, damageClass: 1 }, // Attack
  'grothia-attack-yuna': { id: 0x407f, type: 0, flagsMisc: 0x52, flagsDamage: 0xd, damageClass: 1 }, // Attack (picked by hand)
  'grothia-fira': { id: 0x3045, type: 1, flagsMisc: 0x15030086, flagsDamage: 0x2, damageClass: 1 }, // Fira
  'grothia-hellfire': { id: 0x405e, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x0, damageClass: 1 }, // Hellfire (same fields as 0x40e6)
  'pterya-attack': { id: 0x4000, type: 0, flagsMisc: 0x52, flagsDamage: 0xd, damageClass: 1 }, // Attack
  'pterya-attack-yuna': { id: 0x405c, type: 0, flagsMisc: 0x52, flagsDamage: 0xd, damageClass: 1 }, // Attack
  'pterya-sonic-wings': { id: 0x405d, type: 0, flagsMisc: 0x2006, flagsDamage: 0x1, damageClass: 1 }, // Sonic Wings
  'pterya-energy-ray': { id: 0x403d, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x2, damageClass: 1 }, // Energy Ray
  'spathi-countdown': { id: 0x6028, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Countdown
  'spathi-mega-flare': { id: 0x405f, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x0, damageClass: 1 }, // Mega Flare
  'overdrive-sin-drawn': { id: 0x6029, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0 }, // Drawn to Sin.
  'overdrive-sin-gaze-petrify': { id: 0x609d, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 1 }, // Gaze (same fields as 0x609e, 0x609f)
  'overdrive-sin-gaze-confuse': { id: 0x609d, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 1 }, // Gaze (same fields as 0x609e, 0x609f)
  'overdrive-sin-gaze-zombie': { id: 0x609d, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 1 }, // Gaze (same fields as 0x609e, 0x609f)
  'overdrive-sin-gaze-aeon': { id: 0x60a0, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 1 }, // Gaze
  'overdrive-sin-giga-graviton': { id: 0x609c, type: 0, flagsMisc: 0x6, flagsDamage: 0x82, damageClass: 1 }, // Giga Graviton
  'sin-fin-ram': { id: 0x6092, type: 0, flagsMisc: 0x4002, flagsDamage: 0x1, damageClass: 1 }, // Ram
  'sin-fin-smack': { id: 0x6093, type: 0, flagsMisc: 0x2, flagsDamage: 0x1, damageClass: 1 }, // Smack
  'sin-fin-gravija': { id: 0x6090, type: 0, flagsMisc: 0x6, flagsDamage: 0x82, damageClass: 1 }, // Gravija (same fields as 0x6094, 0x60b6)
  'sin-fin-gravija-far': { id: 0x60a6, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0 }, // Gravija
  'sin-fin-negation': { id: 0x6091, type: 0, flagsMisc: 0x6, flagsDamage: 0x22, damageClass: 0 }, // Negation (same fields as 0x60a7, 0x60b7, 0x60c5)
  'sin-fin-negation-far': { id: 0x6091, type: 0, flagsMisc: 0x6, flagsDamage: 0x22, damageClass: 0 }, // Negation (same fields as 0x60a7, 0x60b7, 0x60c5)
  'sin-fin-gathers': { id: 0x60c4, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0 }, // Core gathers energy.
  'sin-motionless': { id: 0x60bc, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0 }, // Sin remains motionless.
  'sin-genais-venom': { id: 0x6097, type: 0, flagsMisc: 0x6, flagsDamage: 0xd, damageClass: 1 }, // Venom
  'sin-genais-thrashing': { id: 0x6098, type: 0, flagsMisc: 0x6, flagsDamage: 0x5, damageClass: 1 }, // Thrashing
  'sin-genais-sigh': { id: 0x6096, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 1 }, // Sigh
  'sin-genais-waterga': { id: 0x304c, type: 1, flagsMisc: 0x15230086, flagsDamage: 0x2, damageClass: 1 }, // Waterga
  'sin-genais-cura': { id: 0x302c, type: 2, flagsMisc: 0x15030087, flagsDamage: 0x12, damageClass: 1 }, // Cura
  'sin-genais-shell-in': { id: 0x609a, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Enters shell.
  'sin-genais-shell-out': { id: 0x6099, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0 }, // Exits shell.
  'sin-magic-absorbed': { id: 0x609b, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0 }, // Magic absorbed.
  'sin-core-inactive': { id: 0x60bd, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0 }, // Core is inactive.
  'sin-core-gathers': { id: 0x60c4, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0 }, // Core gathers energy.
  'sin-core-gravija': { id: 0x6094, type: 0, flagsMisc: 0x6, flagsDamage: 0x82, damageClass: 1 }, // Gravija
  'sin-core-negation': { id: 0x60c5, type: 0, flagsMisc: 0x6, flagsDamage: 0x22, damageClass: 0 }, // Negation
  'sin-core-fire': { id: 0x6039, type: 0, flagsMisc: 0x20086, flagsDamage: 0x2, damageClass: 1 }, // Fire
  'sin-core-blizzard': { id: 0x603a, type: 0, flagsMisc: 0x20086, flagsDamage: 0x2, damageClass: 1 }, // Blizzard
  'sin-core-thunder': { id: 0x603b, type: 0, flagsMisc: 0x20086, flagsDamage: 0x2, damageClass: 1 }, // Thunder
  'sin-core-water': { id: 0x603c, type: 0, flagsMisc: 0x20086, flagsDamage: 0x2, damageClass: 1 }, // Water
};
