/**
 * The actions of Yaibal and Lucil in the hidden chapter "The Youth League Tournament" (`monster.bin` rows 183 and 184). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: **the game's own rows** (`research/re-ffx2-youth-league-tournament.md` §5.1, §5.2 and §6), which `../command-records/youth-league.ts` lays on these abilities by id; the fields here are the ability's
 * own reading, pinned against the rows by `tests/unit/chapters/youth-league-data.test.ts`. Yaibal's Attack is the League's (`YL_ABILITY.attack`, row 0x4000).
 *
 * - **Yaibal** (`m183`): the "Sorry" grenade (0x40fc: the whole party, 468 to 529 a girl), and two thrown items he aims at the GIRLS: a **Phoenix Down** (0x2006: 25 percent of her maximum HP and the Death cure, on a
 *   KO'd Yuna) and a **Hi-Potion** (0x2001: a fixed 1,000, on Yuna below a quarter). That an enemy command mends the opposing side is the one engine fact this chapter checks (preflight E1;
 *   `tests/unit/chapters/youth-league-engine.test.ts`): the rows carry the heal and the Death cure, and the aim is the script's.
 * - **Lucil** (`m184`): Attack (0x41da), **Harbinger** (0x40ff: damage and Doom at 254 with the counter 4), a Hi-Potion on herself, the Lunar and Light Curtain (Shell and Protect on her side), the four Gems (six hits of
 *   power 2 each, one element each) and the Gold Hourglass (Slow at 100 on the party). Every throw is an enemy ability row, the way `x2-leblanc-flash-bomb` is: no item mechanism.
 *
 * **Hit rule** (hard rule 5): `canMiss` is `true` for the two plain Attacks' accuracy formula 2 and `false` for every other row (accuracy formula 0), set explicitly.
 * Confidence: [verified: the game's own table, decoded by a script and pinned by `tests/unit/chapters/youth-league-data.test.ts`].
 */

import type { AbilityDef, ElementId } from '../../../battle/common/types.ts';
import { base, YL_ABILITY } from './youth-league-abilities-base.ts';

/** One Gem: six hits of power 2 spread over random girls, shatter 70; always hits. */
function gem(id: string, name: string, element: ElementId): AbilityDef {
  return {
    ...base,
    id,
    name,
    power: 2, // item rows 0x201b, 0x201e, 0x2021, 0x2024: formula 8, power 2, SIX hits, elemental, shatter 70
    hits: 6,
    formula: 'multiple',
    damageType: 'other',
    element: [element],
    targeting: 'random-enemy',
    extra: { flat: 50 },
    messageTemplate: `Lucil throws a ${name}`,
  };
}

export const yaibalAbilities: AbilityDef[] = [
  {
    ...base,
    id: YL_ABILITY.sorry,
    name: 'Sorry!',
    power: 10, // row 0x40fc: formula 8, power 10, the party; always hits (a monster-command row, not an item row)
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    extra: { flat: 50 },
    messageTemplate: 'Yaibal throws a grenade at all of you',
  },
  {
    ...base,
    id: YL_ABILITY.phoenixDown,
    name: 'Phoenix Down',
    power: 4, // item row 0x2006: formula 7, power 4 = 25 percent of her maximum HP, with the Death cure at 254: a revive, aimed at a fallen girl
    formula: 'percent-total',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['heals', 'can-target-dead', 'never-break-damage-limit'],
    messageTemplate: 'Yaibal uses a Phoenix Down on {target}',
  },
  {
    ...base,
    id: YL_ABILITY.yaibalHiPotion,
    name: 'Hi-Potion',
    power: 20, // item row 0x2001: formula 5, power 20 = a fixed 1,000 on the girl he is looking after
    formula: 'fixed-no-variance',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['heals', 'never-break-damage-limit'],
    messageTemplate: 'Yaibal uses a Hi-Potion on {target}',
  },
];

export const lucilAbilities: AbilityDef[] = [
  {
    ...base,
    id: YL_ABILITY.lucilAttack,
    name: 'Attack',
    power: 16, // row 0x41da: formula 0, power 16, crit byte 5, shatter 10; accuracy formula 2 (the "no-cancel" Attack)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'Lucil attacks {target}',
  },
  {
    ...base,
    id: YL_ABILITY.harbinger,
    name: 'Harbinger',
    mpCost: 6, // [row 0x40ff]
    power: 16, // formula 0, power 16, crit byte 15, shatter 10; always hits; Doom at 254 with the counter 4
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    statusEffects: [{ status: 'doom', chance: 254, duration: 4 }],
    messageTemplate: 'Lucil uses Harbinger on {target}',
  },
  {
    ...base,
    id: YL_ABILITY.lucilHiPotion,
    name: 'Hi-Potion',
    power: 20, // item row 0x2001: a fixed 1,000, on herself, below a quarter of her HP, at most twice a fight
    formula: 'fixed-no-variance',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    flags: ['heals', 'never-break-damage-limit'],
    messageTemplate: 'Lucil uses a Hi-Potion',
  },
  {
    ...base,
    id: YL_ABILITY.lunarCurtain,
    name: 'Lunar Curtain',
    power: 0, // item row 0x2031: Shell at 254 (counter 100) on her side
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    statusEffects: [{ status: 'shell', chance: 254, duration: 100 }],
    messageTemplate: 'Lucil uses a Lunar Curtain',
  },
  {
    ...base,
    id: YL_ABILITY.lightCurtain,
    name: 'Light Curtain',
    power: 0, // item row 0x2032: Protect at 254 (counter 100) on her side
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    statusEffects: [{ status: 'protect', chance: 254, duration: 100 }],
    messageTemplate: 'Lucil uses a Light Curtain',
  },
  gem(YL_ABILITY.fireGem, 'Fire Gem', 'fire'),
  gem(YL_ABILITY.iceGem, 'Ice Gem', 'ice'),
  gem(YL_ABILITY.lightningGem, 'Lightning Gem', 'lightning'),
  gem(YL_ABILITY.waterGem, 'Water Gem', 'water'),
  {
    ...base,
    id: YL_ABILITY.goldHourglass,
    name: 'Gold Hourglass',
    power: 16, // item row 0x202b: the party, the ATB class (formula 4, power 16), Slow at 100 (counter 100)
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    statusEffects: [{ status: 'slow', chance: 100, duration: 100 }],
    messageTemplate: 'Lucil uses a Gold Hourglass',
  },
];
