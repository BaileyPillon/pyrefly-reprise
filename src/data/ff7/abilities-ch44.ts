/**
 * The FF7 actions chapter 44 (Jenova LIFE at the Forgotten Capital) adds to the Guard Scorpion slice: the higher
 * spell tiers and the new families the party's Materia grant, Limit Levels 2 and 3, the two new item effects, and
 * Jenova LIFE's own four actions.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Units are `battle/ff7/defs.ts`'s (power in sixteenths of Base for
 * Physical and Magical). Sections cited: "jl" is `research/ff7-jenova-life.md` (chapter 44's note), "LE formulas"
 * and "LE party" are the Lifestream Encore research docs (`formulas.md`, `party.md`), whose spell, Limit and
 * Materia tables are Fergusson's Party Mechanics read secondhand: every spell and Limit row below is `[single
 * source]` until the guide itself is read (jl §11 question 5), and `tests/unit/ff7-jenova-life-data.test.ts`
 * pins each number.
 */

import type { Ff7AbilityDef } from '../../battle/ff7/defs.ts';
import type { Ff7Ch44LimitId, Ff7Ch44SpellId, Ff7JenovaAbilityId } from './ids.ts';

// ---------------------------------------------------------------------------
// Spells [LE formulas §6.1: single source, from Fergusson PM §2.6]
// ---------------------------------------------------------------------------

const SPELL_CITE = 'LE formulas §6.1 [single source: Fergusson PM §2.6 via Lifestream Encore]';

/** An attack spell: Magical, MAt% 100, one target that may toggle to all (the menu offers one), reflectable. */
function attackSpell(id: Ff7Ch44SpellId, name: string, element: 'fire' | 'ice' | 'lightning' | 'earth', power: number, mpCost: number): Ff7AbilityDef {
  return {
    id, name, kind: 'magic', formula: 'magical', power, hit: { kind: 'magical', matPct: 100 }, mpCost,
    targeting: 'one-opponent', canToggleAll: true, element: [element], reflectable: true, cite: SPELL_CITE,
  };
}

/** A status spell on one ally: it never misses (MAt% auto), reflectable [LE formulas §6.1, §6.6]. */
function buffSpell(id: Ff7Ch44SpellId, name: string, mpCost: number, add: 'barrier' | 'mbarrier' | 'regen'): Ff7AbilityDef {
  return {
    id, name, kind: 'magic', formula: 'none', power: 0, canMiss: false, mpCost, targeting: 'one-ally', canToggleAll: true,
    element: [], reflectable: true, status: { add: [add] }, cite: `${SPELL_CITE}; reflectable LE formulas §6.6 [single source]`,
  };
}

/** Fire/Ice/Bolt: 1/2x, 1 1/4x, 4x Base at 4, 22, 52 MP; Quake: 11/16x, 1 1/2x, 4 3/8x at 6, 28, 68 MP. */
export const FF7_CH44_SPELLS: Readonly<Record<Ff7Ch44SpellId, Ff7AbilityDef>> = {
  bolt2: attackSpell('bolt2', 'Bolt2', 'lightning', 20, 22),
  bolt3: attackSpell('bolt3', 'Bolt3', 'lightning', 64, 52),
  ice2: attackSpell('ice2', 'Ice2', 'ice', 20, 22),
  ice3: attackSpell('ice3', 'Ice3', 'ice', 64, 52),
  fire: attackSpell('fire', 'Fire', 'fire', 8, 4),
  fire2: attackSpell('fire2', 'Fire2', 'fire', 20, 22),
  fire3: attackSpell('fire3', 'Fire3', 'fire', 64, 52),
  quake: attackSpell('quake', 'Quake', 'earth', 11, 6),
  quake2: attackSpell('quake2', 'Quake2', 'earth', 24, 28),
  quake3: attackSpell('quake3', 'Quake3', 'earth', 70, 68),
  // Cure2: Base + 770 (Power 35, 22 * 35), MAt% 255, 24 MP, Restorative, reflectable.
  cure2: {
    id: 'cure2', name: 'Cure2', kind: 'magic', formula: 'cure', power: 35, hit: { kind: 'magical', matPct: 255 }, mpCost: 24,
    targeting: 'one-ally', canToggleAll: true, element: ['restorative'], reflectable: true, cite: SPELL_CITE,
  },
  regen: buffSpell('regen', 'Regen', 30, 'regen'),
  barrier: buffSpell('barrier', 'Barrier', 16, 'barrier'),
  mbarrier: buffSpell('mbarrier', 'MBarrier', 24, 'mbarrier'),
};

// ---------------------------------------------------------------------------
// Limit Levels 2 and 3 [LE party §9 from Fergusson PM §3.3: single source]
// ---------------------------------------------------------------------------

/** A Limit Break: Physical, PAt% 255, Long Range (the Level 1 pair are; the rest follow them, [estimate]), no element. */
function limit(id: Ff7Ch44LimitId, name: string, powers: readonly number[], extra: Partial<Ff7AbilityDef>, note: string): Ff7AbilityDef {
  return {
    id, name, kind: 'limit', formula: 'physical', power: powers[0] ?? 0, ...(powers.length > 1 ? { hits: powers } : {}),
    hit: { kind: 'physical', atPct: 255 }, mpCost: 0, targeting: 'one-opponent', element: [], longRange: true, ...extra,
    cite: `LE party §9 [single source: Fergusson PM §3.3]; ${note}; Long Range for the Level 2 and 3 moves [estimate: the guide lists it for Level 1 and Tifa's chain only]`,
  };
}

export const FF7_CH44_LIMITS: Readonly<Record<Ff7Ch44LimitId, Ff7AbilityDef>> = {
  // Cloud L2-1: 3 1/2x (56), one enemy; with one enemy on screen it counts as a magical attack [LE party §9.1, single source for the clause].
  'blade-beam': limit('blade-beam', 'Blade Beam', [56], { countersAsMagical: true }, 'Blade Beam 3 1/2x'),
  // Cloud L2-2: 4 3/8x (70), one enemy.
  climhazzard: limit('climhazzard', 'Climhazzard', [70], {}, 'Climhazzard 4 3/8x'),
  // Barret L3-1: 2 3/16x (35), every enemy, an automatic critical.
  'satellite-beam': limit('satellite-beam', 'Satellite Beam', [35], { targeting: 'all-opponents', crit: 'auto' }, 'Satellite Beam 2 3/16x, all enemies, auto-critical'),
  // Barret L3-2: 18 hits of 1/2x (8) at random enemies (one enemy here, so all 18 land on it; the random pick is not built).
  angermax: limit('angermax', 'Angermax', Array.from({ length: 18 }, () => 8), { targeting: 'all-opponents' }, 'Angermax 18 x 1/2x at random enemies'),
  // Tifa L3: the whole chain Beat Rush 1 1/4x, Somersault 1 3/8x, Waterkick 1 1/2x, Meteodrive 1 5/8x, Dolphin Blow 1 3/4x,
  // every reel a "Hit" (no mini-game, jl pick J7), each at a random enemy (one here).
  'dolphin-blow': limit('dolphin-blow', 'Dolphin Blow', [20, 22, 24, 26, 28], { targeting: 'all-opponents' }, 'Tifa chain 1 1/4x to 1 3/4x, five hits, reels all Hit [LE party §10.3 calls the reel layouts invented]'),
};

// ---------------------------------------------------------------------------
// Items [LE party §7 inventory; the Hi-Potion row is PM §5, unread: jl §11 question 5]
// ---------------------------------------------------------------------------

/** Hi-Potion: Fixed 500 HP (Power 25 x 20), one ally, never misses [estimate, as Potion]. */
export const HI_POTION_EFFECT: Ff7AbilityDef = {
  id: 'item:hi-potion', name: 'Hi-Potion', kind: 'item', formula: 'fixed', power: 25, canMiss: false, mpCost: 0,
  targeting: 'one-ally', element: [], heals: true,
  cite: 'LE party §7 [single source: 500 HP, Fergusson PM §5 unread, jl §11]; Fixed = Power * 20 core §4.4; never misses [estimate]',
};

// ---------------------------------------------------------------------------
// Jenova LIFE [jl §4]. Every attack is the Magical formula; her MAt% is 100 (jl §6: Hit% 130 against a Lv 38 target).
// ---------------------------------------------------------------------------

function jl(def: Omit<Ff7AbilityDef, 'kind'> & { id: Ff7JenovaAbilityId }): Ff7AbilityDef {
  return { kind: 'enemy', ...def };
}

export const FF7_JENOVA_ABILITIES: Readonly<Record<Ff7JenovaAbilityId, Ff7AbilityDef>> = {
  // 7/8x (14), 8 MP, one opponent, Water and Shout. MP: 2 sources (the Guard Scorpion lane's reading of Fergusson EM, and the wiki's
  // attack list); power: 3 sources. The earlier research read 0 MP (a missing field): corrected, jl §8 item 1.
  'blue-light': jl({
    id: 'blue-light', name: 'Blue Light', formula: 'magical', power: 14, hit: { kind: 'magical', matPct: 100 }, mpCost: 8,
    targeting: 'one-opponent', element: ['water', 'shout'], reflectable: false,
    cite: 'jl §4 [verified: 3 sources for the power; 2 for the 8 MP]; Shout [single source: Fergusson EM via the 09-27 plan]; reflectable flag not listed by Gamer Corner [estimate: false]',
  }),
  // 1x (16), 12 MP, one opponent, Water.
  'blue-flame': jl({
    id: 'blue-flame', name: 'Blue Flame', formula: 'magical', power: 16, hit: { kind: 'magical', matPct: 100 }, mpCost: 12,
    targeting: 'one-opponent', element: ['water'], reflectable: false,
    cite: 'jl §4 [verified: 3 sources]; reflectable flag not listed by Gamer Corner [estimate: false]',
  }),
  // 3 1/4x (52), 34 MP, all opponents, Water, reflectable; it cannot toggle yet its printed 850 on a Def 140 target includes the 2/3 split.
  aqualung: jl({
    id: 'aqualung', name: 'Aqualung', formula: 'magical', power: 52, hit: { kind: 'magical', matPct: 100 }, mpCost: 34,
    targeting: 'all-opponents', element: ['water'], reflectable: true, splitsOnMulti: true,
    cite: 'jl §4 [verified: 3 sources]; the split: Gamer Corner prints 850 on a Def 140 target [verified: 2 sources], jl §4',
  }),
  // Reflect on herself, 30 MP; the status the party's spells then bounce off. Not reflectable itself [LE formulas §6.6].
  'jenova-reflect': jl({
    id: 'jenova-reflect', name: 'Reflect', formula: 'none', power: 0, canMiss: false, mpCost: 30, targeting: 'self', element: [],
    reflectable: false, status: { add: ['reflect'] }, cite: 'jl §4 [verified: 3 sources: Gamer Corner, LE, the 09-27 plan]',
  }),
};
