/**
 * Every FF7 action in the Guard Scorpion slice: the Attack command, the spells the
 * party's Materia grants, the two Level-1 Limits, the item effects and the boss's
 * abilities.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Units are `battle/ff7/defs.ts`'s
 * (power in sixteenths of Base for Physical and Magical). Every record carries its
 * research section and tag in `cite` (`tests/unit/ff7-data-cites.test.ts` checks
 * it); "core" is `research/ff7-battle-core.md`, "gs" is `research/ff7-guard-scorpion.md`.
 */

import type { Ff7AbilityDef } from '../../battle/ff7/defs.ts';
import type { Ff7EnemyAbilityId, Ff7LimitId, Ff7SpellId } from './ids.ts';

// ---------------------------------------------------------------------------
// Party commands
// ---------------------------------------------------------------------------

/**
 * Attack: Physical, Power 16 (1x Base), the weapon's At%, element and Long Range
 * [core §9, single source: wiki battle system; Power core §4.1: "16 = 1x Base"].
 */
export const ATTACK: Ff7AbilityDef = {
  id: 'attack',
  name: 'Attack',
  kind: 'attack',
  formula: 'physical',
  power: 16,
  hit: { kind: 'physical', atPct: 'weapon' },
  mpCost: 0,
  targeting: 'one-opponent',
  element: 'weapon',
  longRange: 'weapon',
  cite: 'core §9 [single source: wiki battle system]; Power 16 core §4.1 [verified: 2 sources]',
};

// ---------------------------------------------------------------------------
// Spells [core §8.4, single source: Fergusson PM §2.6]
// ---------------------------------------------------------------------------

/** Bolt: Magical, 1/2x Base (8), MAt% 100, 4 MP, one or all, Lightning, reflectable. */
const BOLT: Ff7AbilityDef = {
  id: 'bolt',
  name: 'Bolt',
  kind: 'magic',
  formula: 'magical',
  power: 8,
  hit: { kind: 'magical', matPct: 100 },
  mpCost: 4,
  targeting: 'one-opponent',
  canToggleAll: true,
  element: ['lightning'],
  reflectable: true,
  cite: 'core §8.4 [single source: Fergusson PM §2.6]',
};

/** Ice: Magical, 1/2x Base (8), MAt% 100, 4 MP, one or all, Ice, reflectable. */
const ICE: Ff7AbilityDef = {
  id: 'ice',
  name: 'Ice',
  kind: 'magic',
  formula: 'magical',
  power: 8,
  hit: { kind: 'magical', matPct: 100 },
  mpCost: 4,
  targeting: 'one-opponent',
  canToggleAll: true,
  element: ['ice'],
  reflectable: true,
  cite: 'core §8.4 [single source: Fergusson PM §2.6]',
};

/** Cure: Cure formula, Base + 110 (Power 5), MAt% 255, 5 MP, one or all, Restorative, reflectable. */
const CURE: Ff7AbilityDef = {
  id: 'cure',
  name: 'Cure',
  kind: 'magic',
  formula: 'cure',
  power: 5,
  hit: { kind: 'magical', matPct: 255 },
  mpCost: 5,
  targeting: 'one-ally',
  canToggleAll: true,
  element: ['restorative'],
  reflectable: true,
  cite: 'core §8.4 [single source: Fergusson PM §2.6]',
};

export const FF7_SPELLS: Readonly<Record<Ff7SpellId, Ff7AbilityDef>> = { bolt: BOLT, ice: ICE, cure: CURE };

// ---------------------------------------------------------------------------
// Limit Level 1 [core §7.3, single source: Fergusson PM §3.3.1, §3.3.2]
// ---------------------------------------------------------------------------

/** Braver (Cloud L1-1): Physical, Long Range, 3x Base (48), PAt% 255, one enemy, no element. */
const BRAVER: Ff7AbilityDef = {
  id: 'braver',
  name: 'Braver',
  kind: 'limit',
  formula: 'physical',
  power: 48,
  hit: { kind: 'physical', atPct: 255 },
  mpCost: 0,
  targeting: 'one-opponent',
  element: [],
  longRange: true,
  cite: 'core §7.3 [single source: Fergusson PM §3.3.1]',
};

/** Big Shot (Barret L1-1): Physical, Long Range, 3 1/4x Base (52), PAt% 255, one enemy, no element. */
const BIG_SHOT: Ff7AbilityDef = {
  id: 'big-shot',
  name: 'Big Shot',
  kind: 'limit',
  formula: 'physical',
  power: 52,
  hit: { kind: 'physical', atPct: 255 },
  mpCost: 0,
  targeting: 'one-opponent',
  element: [],
  longRange: true,
  cite: 'core §7.3 [single source: Fergusson PM §3.3.2]',
};

export const FF7_LIMITS: Readonly<Record<Ff7LimitId, Ff7AbilityDef>> = { braver: BRAVER, 'big-shot': BIG_SHOT };

// ---------------------------------------------------------------------------
// Item effects [core §8.6, single source: Fergusson PM §5]
// ---------------------------------------------------------------------------

/**
 * Potion: Fixed 100 HP (Power 5 x 20, core §4.4), one ally. It never misses
 * [estimate: the research gives no hit rule for items on allies]; its element is not
 * in the research, so it heals through `heals`, not a Restorative element.
 */
const POTION_EFFECT: Ff7AbilityDef = {
  id: 'item:potion',
  name: 'Potion',
  kind: 'item',
  formula: 'fixed',
  power: 5,
  canMiss: false,
  mpCost: 0,
  targeting: 'one-ally',
  element: [],
  heals: true,
  cite: 'core §8.6 [single source: Fergusson PM §5]; Fixed = Power * 20 core §4.4; never misses [estimate]',
};

/** Phoenix Down: revives, restoring Max HP / 4; one ally. Never misses [estimate, as Potion]. */
const PHOENIX_DOWN_EFFECT: Ff7AbilityDef = {
  id: 'item:phoenix-down',
  name: 'Phoenix Down',
  kind: 'item',
  formula: 'none',
  power: 0,
  canMiss: false,
  mpCost: 0,
  targeting: 'one-ally',
  element: [],
  revive: { hpDivisor: 4 },
  cite: 'core §8.6 [single source: Fergusson PM §5]; never misses [estimate]',
};

export const FF7_ITEM_EFFECTS: Readonly<Record<string, Ff7AbilityDef>> = {
  [POTION_EFFECT.id]: POTION_EFFECT,
  [PHOENIX_DOWN_EFFECT.id]: PHOENIX_DOWN_EFFECT,
};

// ---------------------------------------------------------------------------
// Guard Scorpion [gs §4]. The boss has 0 MP [gs §2.1], so every cost is 0 [derived].
// None is Long Range [gs §4, single source: Fergusson EM lists "Physical Attack", not "Physical LR Attack"].
// ---------------------------------------------------------------------------

function enemy(def: Omit<Ff7AbilityDef, 'kind' | 'mpCost'> & { id: Ff7EnemyAbilityId }): Ff7AbilityDef {
  return { kind: 'enemy', mpCost: 0, ...def };
}

export const FF7_ENEMY_ABILITIES: Readonly<Record<Ff7EnemyAbilityId, Ff7AbilityDef>> = {
  // No damage, no effect; always hits; picks the next target [gs §4, verified: 3 sources].
  'search-scope': enemy({
    id: 'search-scope', name: 'Search Scope', formula: 'none', power: 0, canMiss: false,
    targeting: 'one-opponent', element: [], lockOn: 'Locked On Target', // the printed line [gs §4, verified: 2 sources]
    cite: 'gs §4 [verified: 3 sources]',
  }),
  // Physical, 1x Base (16), PAt% 100, one, Shoot [gs §4, verified: 2 sources].
  rifle: enemy({
    id: 'rifle', name: 'Rifle', formula: 'physical', power: 16, hit: { kind: 'physical', atPct: 100 },
    targeting: 'one-opponent', element: ['shoot'], longRange: false, cite: 'gs §4 [verified: 2 sources]',
  }),
  // Physical, 1 3/4x Base (28), PAt% 95, one, Shoot [gs §4, verified: 2 sources].
  'scorpion-tail': enemy({
    id: 'scorpion-tail', name: 'Scorpion Tail', formula: 'physical', power: 28, hit: { kind: 'physical', atPct: 95 },
    targeting: 'one-opponent', element: ['shoot'], longRange: false, cite: 'gs §4 [verified: 2 sources]',
  }),
  // Physical, 3x Base (48), PAt% 120, all opponents, Shoot; only as the tail-up counter [gs §4, verified: 3 sources].
  'tail-laser': enemy({
    id: 'tail-laser', name: 'Tail Laser', formula: 'physical', power: 48, hit: { kind: 'physical', atPct: 120 },
    targeting: 'all-opponents', element: ['shoot'], longRange: false, counterOnly: true,
    cite: 'gs §4 [verified: 3 sources]',
  }),
  // Form change and animation, no effect [gs §4, verified: 2 sources]; forms per gs §2.1, §5.1.
  'raise-tail': enemy({
    id: 'raise-tail', name: 'Raise Tail', formula: 'none', power: 0, canMiss: false,
    targeting: 'self', element: [], toForm: 1, cite: 'gs §4, §5.1 [verified: 2 sources]',
  }),
  'drop-tail': enemy({
    id: 'drop-tail', name: 'Drop Tail', formula: 'none', power: 0, canMiss: false,
    targeting: 'self', element: [], toForm: 0, cite: 'gs §4, §5.1 [verified: 2 sources]',
  }),
};

/** Every FF7 action by id. */
export const FF7_ABILITIES: Readonly<Record<string, Ff7AbilityDef>> = {
  [ATTACK.id]: ATTACK,
  ...FF7_SPELLS,
  ...FF7_LIMITS,
  ...FF7_ITEM_EFFECTS,
  ...FF7_ENEMY_ABILITIES,
};
