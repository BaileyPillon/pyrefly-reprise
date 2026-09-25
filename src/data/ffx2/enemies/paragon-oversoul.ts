/**
 * Chapter XIII, link 1, **option 1 (TR7 b): Oversoul Paragon**, built and **switched OFF**.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Bailey picked TR7 = Normal; this form needs his
 * word (`docs/plans/trema-options-2026-09-25.md`, option 1). The chapter reaches it only through
 * `TREMA_PARAGON_FORM = 'oversoul'` in `src/data/chapter-ffx2-trema.ts`. Source:
 * `research/ffx2-trema.md` §12.2 (SinirothX FAQ 31807's dump: stats, actions, DCs and AI, a
 * **single-source** script whose *behaviour* is verified by 3 sources: waits until hit, copies
 * spells, often misses; "easier" per every guide).
 *
 * **Stats** `[SinirothX; HP, EXP, AP, gil verified: 4 sources (§3.2); Agility also on the wiki]`:
 * Lv 99, HP 210,000, MP 9,999, Str 244, Mag 244, Def 88, MDef 89, Eva 0, Luck 16, Acc 0, Agi 244,
 * Thinking Period 0; the normal form's immunities. The trigger (ten Weapon kills) is not modelled:
 * the option *is* the Oversouled encounter.
 *
 * **Every gap §12.2 lists is a named `[estimate]` in {@link OVERSOUL_ESTIMATES}**, each set to the
 * reading that does **not** make the fight easier, except where the research already rules
 * (thresholds: "use SinirothX as §0.1 ranks it") and where a source's numbers settle the script's
 * reading (`lowHpActsEveryTurn`: Split's "four or five of its turns", `[derived]`).
 */

import type { AbilityDef, EnemyDef } from '../../../battle/common/types.ts';
import { CLOISTER_BOSS_IMMUNITY, paragon } from './paragon.ts';
// The estimate parameters live beside the script that reads most of them (the battle layer imports
// no data); the rows below read the ones about abilities.
import { OVERSOUL_ESTIMATES } from '../../../battle/ffx2/ai/paragon-oversoul.ts';

export { OVERSOUL_ESTIMATES };

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0, // "all abilities cost 0 MP" while Oversouled (wiki *Oversoul*, §12.2)
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
};

const magic = { ...base, formula: 'magic' as const, damageType: 'magical' as const, canMiss: false };

/** An -aga spell: DC 21, one element, on all characters [SinirothX; Split, zero_six "VS all chrs"]. */
function aga(id: string, name: string, element: 'fire' | 'ice' | 'lightning' | 'water'): AbilityDef {
  return {
    ...magic,
    id,
    name,
    power: 21,
    element: [element],
    targeting: OVERSOUL_ESTIMATES.agaOnAll ? 'all-enemies' : 'single-enemy',
    messageTemplate: `Paragon casts ${name}`,
  };
}

/** Oversoul Paragon's own actions (§12.2 "Actions, Oversoul"). Genesis and Big Bang are the normal form's rows. */
export const paragonOversoulAbilities: AbilityDef[] = [
  {
    ...base,
    id: 'paragon-os-attack',
    name: 'Attack',
    category: 'attack',
    power: 16, // DC 16, physical, one target [SinirothX]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    // Itchy: OVERSOUL_ESTIMATES.attackItchy (wiki; SinirothX lists none).
    statusEffects: OVERSOUL_ESTIMATES.attackItchy ? [{ status: 'itchy', chance: 255, duration: 0 }] : [],
    flags: ['crit-eligible'],
    // It rolls: "often misses" [verified: 3 sources]; the flat rate is OVERSOUL_ESTIMATES.physicalHitPercent.
    accuracy: OVERSOUL_ESTIMATES.physicalHitPercent,
    messageTemplate: 'Paragon attacks {target}',
  },
  {
    ...magic,
    id: 'paragon-os-judgement',
    name: 'Judgement',
    power: 22, // one target, magic, DC 22 [SinirothX]
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: 'Paragon casts Judgement',
  },
  {
    ...base,
    id: 'paragon-os-final-impact',
    name: 'Final Impact',
    // "1/8 of max HP and MP, 14 times, fractional, can break damage limit" [SinirothX].
    power: 2, // 2/16 = 1/8 of max HP (`formulas.ts` percent-total)
    formula: 'percent-total',
    damageType: OVERSOUL_ESTIMATES.finalImpactReducible ? 'physical' : 'other',
    element: ['none'],
    targeting: 'random-enemy',
    hits: OVERSOUL_ESTIMATES.finalImpactHits,
    flags: ['always-break-damage-limit'],
    extra: { mpFractionOfMax: 2 }, // and 1/8 of max MP a hit (`aeon-effects.ts#applyMpFraction`)
    canMiss: false,
    messageTemplate: 'Paragon unleashes Final Impact',
  },
  {
    ...magic,
    id: 'paragon-os-demi',
    name: 'Demi',
    power: 4, // all, 1/4 of current HP, Gravity [SinirothX]
    formula: 'percent-current',
    element: ['gravity'],
    targeting: 'all-enemies',
    messageTemplate: 'Paragon casts Demi',
  },
  aga('paragon-os-firaga', 'Firaga', 'fire'),
  aga('paragon-os-blizzaga', 'Blizzaga', 'ice'),
  aga('paragon-os-thundaga', 'Thundaga', 'lightning'),
  aga('paragon-os-waterga', 'Waterga', 'water'),
  {
    ...magic,
    id: 'paragon-os-holy',
    name: 'Holy',
    power: 12, // one target, DC 12 x 8 [SinirothX]
    element: ['holy'],
    targeting: 'single-enemy',
    hits: 8,
    messageTemplate: 'Paragon casts Holy',
  },
  {
    ...magic,
    id: 'paragon-os-ultima',
    name: 'Ultima',
    power: 70, // all, DC 70 [SinirothX]
    element: ['none'],
    targeting: 'all-enemies',
    messageTemplate: 'Paragon casts Ultima',
  },
  {
    ...base,
    id: 'paragon-os-dispel',
    name: 'Dispel',
    // On all: Auto-Life, Shell, Protect, Reflect, Regen, Haste and Spellspring [SinirothX]. An
    // accessory's auto-status (Auto-Wall) stays, as it does against Genesis (`setup.ts`).
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    removesStatuses: ['auto-life', 'shell', 'protect', 'reflect', 'regen', 'haste', 'spellspring'],
    flags: ['removes-statuses'],
    canMiss: false,
    messageTemplate: 'Paragon casts Dispel',
  },
];

/** Oversoul Paragon (§12.2). Everything not listed is the normal form's (immunities, element, sprite). */
export const paragonOversoul: EnemyDef = {
  ...paragon,
  id: 'paragon',
  name: 'Paragon',
  stats: {
    hp: 210000, // [verified: 4 sources]
    mp: 9999,
    maxHp: 210000,
    maxMp: 9999,
    str: 244, // [SinirothX]
    mag: 244, // [SinirothX] (T-6 settled, §12.1)
    def: 88, // [SinirothX; one observation, NightMare185's Warrior Attack]
    mdef: 89, // [SinirothX]
    agi: 244, // [SinirothX + wiki]
    eva: 0, // [SinirothX]
    luck: 16, // [SinirothX]
    acc: 0, // [SinirothX]
  },
  hp: 210000,
  mp: 9999,
  immunities: CLOISTER_BOSS_IMMUNITY, // "the same immunities as the normal form" [SinirothX]
  forms: [{ name: 'Paragon', spriteKey: 'paragon', hp: 210000 }],
  aiScriptId: 'paragon-oversoul',
  rewards: {
    ...paragon.rewards,
    ap: 2, // EXP / AP / gil [verified: 4 sources]
    apOverkill: 2,
    gil: 8000,
    stolenGil: 6800, // T-11 minor: SinirothX + wiki 6,800 (zero_six 4,500)
    exp: 13000,
    drops: [{ itemId: 'x2-dark-matter', count: 1 }], // Dark Matter / Dark Matter x2 [SinirothX, wiki, GamerGuides, zero_six]
    steal: {
      ...paragon.rewards.steal!,
      stealRate: 31, // Supreme Gem / x2 at 12 % [SinirothX + wiki]; 31 from 12 % on the 128 = 50 % scale, `[derived]`
    },
  },
  abilityIds: [
    'paragon-os-attack', 'paragon-os-judgement', 'paragon-genesis', 'paragon-big-bang', 'paragon-os-final-impact',
    'paragon-os-demi', 'paragon-os-firaga', 'paragon-os-blizzaga', 'paragon-os-thundaga', 'paragon-os-waterga',
    'paragon-os-holy', 'paragon-os-ultima', 'paragon-os-dispel',
  ],
  // Our words over §12.2 (it waits, then answers in kind); not a game line.
  sensorText: 'It does nothing until you touch it. Then it gives back exactly what it was given.',
};
