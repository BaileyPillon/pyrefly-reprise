/**
 * The hidden Mirror Aeons chapter (the Dark Magus Sisters, then Dark Yojimbo; **FFX only** [AGENTS.md rule 14]): the line the fight is played with. Registered under the FFX game in `./lookup.ts`, so an FFX-2
 * board never reaches it; it returns `null` (the generic ladder) when no Dark Aeon is on the field.
 *
 * ## The line, and where each rule comes from
 *
 * It is the **intended** line of `tests/unit/chapters/mirror-aeons-bench.test.ts` and `docs/plans/ch-mirror-aeons-bench.md`, which measure it on the real engine (the Dark aeons' scripts are
 * `battle/ffx/ai/dark-aeons.ts`; Yuna's Yojimbo and Magus Sisters are the reverse-engineering session's lane FFX-K). Nothing in the fight is tuned: the enemy numbers are the game's
 * (`research/re-ffx-dark-aeons.md`), the party is an `[estimate]` preset (`data/ffx/builds/mirror-aeons.ts`), and each number below was set by what the bench measured, one rule at a time. In the order they are asked:
 *
 * 1. **An aeon goes in when the big move is next** (Yuna only, no aeon out; it comes before everything, healing included, because it is the one thing that cannot wait). The big moves are Dark Yojimbo's Zanmato
 *    and the trio's Delta Attack. Every guide says the same (Jegged Sisters and Yojimbo; GamerGuides; StrategyWiki): an aeon takes the blow, because Auto-Life does not, and every one of those moves removes Auto-Life
 *    besides (RE note 6.2).
 *    - **Zanmato** (`SHIELD_AT_GAUGE`): his gauge climbs by the tier's step each turn of his and by 2 for every action of the party's that reaches him, and a hasted party lands about six in one of his turns, so the
 *      aeon goes in when the gauge is within one round of full, not on the full gauge (the largest gap in the bench: on a full gauge alone the line loses a quarter of Act II). **Yojimbo goes first**: the mirror, and
 *      his blows are the weakest an aeon has, so nothing is lost by sending him; then the story aeons, then the Sisters.
 *    - **Delta Attack** (`deltaThisRound`): the three scripts run in the order Mindy, Sandy, Cindy and the trio test is checked on each turn (RE note 5.2), so the forecast runs the round on the gauges as they stand.
 *      The shield is **Yuna's own Sisters**: Mindy and Sandy act before Cindy in every round and each of their moves kills a lone aeon, so only three bodies in one summon are still standing when the Delta Attack lands.
 *      A lone Sister's full gauge is a Mega Graviton, which no aeon or member dies of, so it is no reason to summon.
 * 2. **Revive the fallen, then heal under 60 percent** (`HEAL_UNDER`). Yuna heals with her spells (Curaga restores a whole 9,999 for 20 MP; the bag is for the others, and only in an emergency, `ITEM_HEAL_UNDER`):
 *    a member already hurt is the one a Mega Graviton or a Wakizashi finishes (the bench: 45 percent loses a fifth of the chain that 60 percent keeps).
 * 3. **Auto-Life on whoever lacks it** (Yuna): a second life against every blow that does not strip it (StrategyWiki: cast Haste and Auto-Life first).
 * 4. **Cheer to five stacks against Dark Yojimbo** (Tidus, `CHEER_STACKS`): a third off every physical blow, which is what lets a 9,999-HP member live through a Wakizashi (11,000 and more without it, 7,800 with it).
 *    Not against the Sisters: it costs five actions that the pair's race cannot spare (the bench: it loses Act I).
 * 5. **A blade goes to Cindy, then Sandy; a spell goes to Mindy, then Sandy, then Cindy.** Dark Mindy's Evasion is 240 (RE section 2): **the engine lands 0 of 55 physical blows of this party on her, about 80
 *    percent on Sandy (Evasion 100) and every one on Cindy (Evasion 0)**, measured on the preset on 2026-10-15; a spell, an Overdrive or an aeon's special never misses. So Tidus swings at Cindy and Sandy (Quick Hit,
 *    Jegged Yojimbo and GamerGuides), and **Lulu's Ultima or Flare takes Mindy first** (GamerGuides and StrategyWiki both send a mage; about 40 percent stronger than a blade because the sisters' Magic Defense is lower
 *    than their Defense). In Act II the target is Dark Yojimbo (the dog cannot be targeted).
 * 6. **An aeon on the field is a shield, not an attacker.** While the big move is still next the aeon stays and answers its own turn (an Overdrive or a special when it has one; Yojimbo is paid, `PAY_GIL`; the Sisters
 *    Combine when the menu offers it, the one thing it can do besides leave); once the danger has passed it goes home **at once**, because the party is parked behind an aeon and a Break Damage Limit blow of the party's
 *    is worth many of an aeon's plain attack (capped at 9,999).
 *
 * The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { type Tactic, aim, has, hpFraction, revive, row, stacksOf } from './common.ts';

/** The four Dark Aeons (`src/data/ffx/mirror-aeons-ids.ts`). */
export const MIRROR_AEONS_BOSS_IDS: readonly CombatantId[] = ['dark-cindy', 'dark-sandy', 'dark-mindy', 'dark-yojimbo'];
/** The order for a blade (Attack, Quick Hit): Cindy, then Sandy, then Mindy last (see rule 5); Dark Yojimbo is the only target in Act II. */
const BLADE_ORDER: readonly CombatantId[] = ['dark-cindy', 'dark-sandy', 'dark-mindy', 'dark-yojimbo'];
/** The order for a spell, an Overdrive or an aeon's special (none of them misses): Mindy first, the smallest pool and the one a blade cannot touch, then Sandy, then Cindy. */
const MAGIC_ORDER: readonly CombatantId[] = ['dark-mindy', 'dark-sandy', 'dark-cindy', 'dark-yojimbo'];
/** Lulu's spells, the strongest first. */
const SPELLS: readonly string[] = ['Ultima', 'Flare', 'Thundaga', 'Firaga', 'Blizzaga', 'Waterga'];
/** Which aeon to send in against the trio's Delta Attack (rule 1): Yuna's own Sisters, three bodies in one summon, the only shield that is still standing when Cindy acts. */
const FODDER_VS_TRIO: readonly string[] = ['Cindy', 'Bahamut', 'Shiva', 'Ixion', 'Ifrit', 'Valefor', 'Yojimbo'];
/**
 * Which aeon to send in against Zanmato (rule 1), the first on offer winning: Yojimbo, the mirror (his blows are the weakest an aeon has, capped at 9,999, so nothing is lost), then the story aeons, the cheapest first,
 * and the Sisters last: three bodies in one summon, whose menu has no attack of its own (Combine powers or Dismiss: `battle/ffx/aeon-commands.ts`).
 */
const FODDER_VS_ZANMATO: readonly string[] = ['Yojimbo', 'Valefor', 'Ifrit', 'Ixion', 'Shiva', 'Bahamut', 'Cindy'];
/** The same without the mirror first: the story aeons, then Yojimbo, then the Sisters (the bench's comparison line only). */
const FODDER_VS_ZANMATO_LAST: readonly string[] = ['Valefor', 'Ifrit', 'Ixion', 'Shiva', 'Bahamut', 'Yojimbo', 'Cindy'];

/** The gil Yojimbo is paid each time he acts: the game's motivation from it is `4 x (floor(log2) - 2)`, so this is `4 x 14 = 56`, and more than the roll's gain is not worth the gil (`battle/ffx/kernel/yojimbo.ts#gilMotivation`). */
export const PAY_GIL = 100_000;
/** Dark Yojimbo's gauge at which an aeon goes in (rule 1): within one round of full. Measured: 100 loses a quarter of Act II, 94 to 82 all keep it. */
export const SHIELD_AT_GAUGE = 88;
/** A party member is healed under this share of his HP (rule 2). Measured: 45 percent against 60 is 73 against 93 percent on the chain. */
export const HEAL_UNDER = 0.6;
/** A member who is not Yuna uses an item only under this share of his HP, or when Yuna cannot heal (rule 2). */
export const ITEM_HEAL_UNDER = 0.25;
/** Cheer stacks Tidus builds against Dark Yojimbo before anything else but the shield and the healing (rule 4). */
export const CHEER_STACKS = 5;
/** An Overdrive gauge at this value is the next turn's big move (RE note 4.2 and 5.2). */
const FULL_GAUGE = 100;

/**
 * The line's rules as numbers and switches, so the bench can take one away at a time and print what each is worth (`docs/plans/ch-mirror-aeons-bench.md`, "the line's own rules"). The shipped line is
 * {@link SHIPPED_LINE}; nothing in the game reads anything else.
 */
export interface LineOptions {
  /** Dark Yojimbo's gauge at which an aeon goes in (rule 1). */
  readonly shieldAt: number;
  /** A member is healed under this share of his HP (rule 2). */
  readonly healUnder: number;
  /** A member who is not Yuna uses an item only under this share of his HP, or when Yuna cannot heal (rule 2). */
  readonly itemHealUnder: number;
  /** Yuna heals with her spells (Curaga and the others) rather than from the bag (rule 2). */
  readonly spellHeal: boolean;
  /** Yuna puts Auto-Life on whoever lacks it (rule 3). */
  readonly lifeUpkeep: boolean;
  /** Cheer stacks Tidus builds against Dark Yojimbo (rule 4); 0 is none. */
  readonly cheerStacks: number;
  /** Yojimbo is the first aeon sent in against Zanmato (rule 1); otherwise the story aeons go first and he follows them. */
  readonly yojimboFirst: boolean;
}

/** The shipped line: every constant above, every rule on. */
export const SHIPPED_LINE: LineOptions = {
  shieldAt: SHIELD_AT_GAUGE,
  healUnder: HEAL_UNDER,
  itemHealUnder: ITEM_HEAL_UNDER,
  spellHeal: true,
  lifeUpkeep: true,
  cheerStacks: CHEER_STACKS,
  yojimboFirst: true,
};

/** The ability ids of the engine's own commands for the player's Yojimbo and Magus Sisters (`battle/ffx/aeon-commands.ts`). */
const PAY_ABILITY_ID = 'yojimbo-pay';
const COMBINE_ABILITY_ID = 'sister-order-combine';
const SISTER_IDS: readonly CombatantId[] = ['cindy', 'sandy', 'mindy'];

const living = (engine: BattleEngine, id: CombatantId): FFXCombatant | undefined => {
  const c = engine.state().combatants[id] as FFXCombatant | undefined;
  return c !== undefined && c.alive && c.hp > 0 && !c.removed ? c : undefined;
};

/** The first enabled row of a kind that can name `target` (or any), unaimed. */
function pickKind(commands: readonly AvailableCommand[], kind: Command['kind'], target?: CombatantId): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === kind && (target === undefined || c.validTargets.includes(target)));
}

/** The enabled ability row with this id (the engine's Pay and order rows carry no target). */
const abilityRow = (commands: readonly AvailableCommand[], id: string): AvailableCommand | undefined =>
  commands.find((c) => c.enabled && c.command.kind === 'ability' && c.command.id === id);

/**
 * Would Cindy's turn this coming round be the Delta Attack? The three scripts in their order (Mindy, Sandy, Cindy: RE note 5.2 and 1.1), the gauges as they stand: a Sister whose gauge is 100 with the trio not ready
 * throws Mega Graviton and drops to 0, any other adds 20, and Cindy throws the Delta Attack when all three are alive and every gauge is 100 at her turn. The coin changes no gauge, so this is exact.
 */
export function deltaThisRound(sisters: readonly FFXCombatant[]): boolean {
  const by = (id: string): FFXCombatant | undefined => sisters.find((f) => f.id === id);
  const mindy = by('dark-mindy');
  const sandy = by('dark-sandy');
  const cindy = by('dark-cindy');
  if (mindy === undefined || sandy === undefined || cindy === undefined) return false; // a dead Sister ends the Delta Attack for good
  const g = { mindy: mindy.overdrive?.gauge ?? 0, sandy: sandy.overdrive?.gauge ?? 0, cindy: cindy.overdrive?.gauge ?? 0 };
  const ready = (): boolean => g.mindy >= FULL_GAUGE && g.sandy >= FULL_GAUGE && g.cindy >= FULL_GAUGE;
  for (const who of ['mindy', 'sandy'] as const) {
    if (ready()) g[who] = Math.min(100, g[who] + 20);
    else if (g[who] >= FULL_GAUGE) g[who] = 0;
    else g[who] = Math.min(100, g[who] + 20);
  }
  return ready();
}

/** The big move that is next, if any (RE note 4.2 and 5.2): Dark Yojimbo's gauge within a round of full is Zanmato; the trio's Delta Attack is forecast from the gauges; a lone full gauge is a Mega Graviton, no shield needed. */
export function bigMoveNext(foes: readonly FFXCombatant[], shieldAt: number = SHIELD_AT_GAUGE): 'zanmato' | 'delta' | null {
  const yojimbo = foes.find((f) => f.id === 'dark-yojimbo');
  if (yojimbo !== undefined) return (yojimbo.overdrive?.gauge ?? 0) >= shieldAt ? 'zanmato' : null;
  const sisters = foes.filter((f) => f.id === 'dark-cindy' || f.id === 'dark-sandy' || f.id === 'dark-mindy');
  return sisters.length === 3 && deltaThisRound(sisters) ? 'delta' : null;
}

/** An aeon's turn (rule 6): the shield answers its own turn while the danger stands and leaves once it has passed. */
function aeonTurn(me: FFXCombatant, commands: readonly AvailableCommand[], afraid: boolean, magicAt: CombatantId | undefined, bladeAt: CombatantId | undefined): Command | null {
  const home = pickKind(commands, 'dismiss');

  // The Magus Sisters: Combine powers is the one thing their menu can do besides leave.
  if (SISTER_IDS.includes(me.id)) {
    const combine = abilityRow(commands, COMBINE_ABILITY_ID);
    if (combine) return { ...combine.command, targets: [] } as Command;
    return home ? aim(home) : null;
  }
  // Yojimbo is paid; his menu is Pay and Dismiss.
  const pay = abilityRow(commands, PAY_ABILITY_ID);
  if (pay) {
    if (!afraid && home) return aim(home);
    return { ...pay.command, targets: [], gilSpent: PAY_GIL } as Command;
  }

  // A story aeon: gone as soon as the danger has passed.
  if (!afraid && home) return aim(home);
  const od = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && (magicAt === undefined || c.validTargets.includes(magicAt)));
  if (od) return aim(od, magicAt);
  const special = commands.find((c) => c.enabled && c.command.kind === 'ability' && c.category === 'aeon' && !['Shield', 'Boost', 'Dismiss', 'Nul-All'].includes(c.label) && (magicAt === undefined || c.validTargets.includes(magicAt)));
  if (special) return aim(special, magicAt);
  const swing = pickKind(commands, 'attack', bladeAt);
  return swing ? aim(swing, bladeAt) : home ? aim(home) : null;
}

/** The line with `line`'s rules (the shipped one is {@link mirrorAeons}). */
export const lineWith = (line: LineOptions): Tactic => (actorId, commands, engine) => {
  const state = engine.state();
  const foes = MIRROR_AEONS_BOSS_IDS.map((id) => living(engine, id)).filter((c): c is FFXCombatant => c !== undefined);
  if (foes.length === 0) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (!me) return null;
  const firstOf = (order: readonly CombatantId[]): CombatantId | undefined => order.find((id) => foes.some((f) => f.id === id));
  const bladeAt = firstOf(BLADE_ORDER);
  const magicAt = firstOf(MAGIC_ORDER);
  const aeonOut = state.aeonId !== null;

  // 6. An aeon on the field is a shield.
  if (me.side === 'aeon') return aeonTurn(me, commands, bigMoveNext(foes, line.shieldAt) !== null, magicAt, bladeAt);

  // 1. Yuna sends an aeon in when the big move is next (before anything else: it is the one thing that cannot wait).
  const big = bigMoveNext(foes, line.shieldAt);
  if (me.id === 'yuna' && !aeonOut && big !== null) {
    for (const name of big === 'delta' ? FODDER_VS_TRIO : line.yojimboFirst ? FODDER_VS_ZANMATO : FODDER_VS_ZANMATO_LAST) {
      const summon = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === name);
      if (summon) return aim(summon);
    }
  }

  // 2. The fallen first, then the hurt: Yuna's spells, and an item from the others only in an emergency or when she cannot.
  const party = state.activeIds.map((id) => state.combatants[id]).filter((c): c is FFXCombatant => c !== undefined && c.side === 'party');
  const rescue = revive(commands, party);
  if (rescue) return rescue;
  const hurt = party.filter((c) => c.alive && hpFraction(c) < line.healUnder).sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (hurt && !aeonOut) {
    const yunaStands = party.some((c) => c.id === 'yuna' && c.alive);
    if (me.id === 'yuna' && line.spellHeal) {
      const spell = row(commands, hpFraction(hurt) < 0.5 ? ['Curaga', 'Cura', 'Cure'] : ['Cura', 'Cure', 'Curaga'], hurt.id);
      if (spell) return aim(spell, hurt.id);
    } else if (!yunaStands || !line.spellHeal || hpFraction(hurt) < line.itemHealUnder) {
      const potion = row(commands, ['X-Potion', 'Hi-Potion', 'Potion'], hurt.id);
      if (potion) return aim(potion, hurt.id);
    }
  }

  // 3. Auto-Life on whoever lacks it (Yuna).
  if (line.lifeUpkeep && me.id === 'yuna' && !aeonOut) {
    const bare = party.find((c) => c.alive && !has(c, 'auto-life'));
    if (bare) {
      const life = row(commands, ['Auto-Life'], bare.id);
      if (life) return aim(life, bare.id);
    }
  }
  // 4. Cheer to five stacks against Dark Yojimbo (Tidus).
  if (line.cheerStacks > 0 && me.id === 'tidus' && !aeonOut && foes.some((f) => f.id === 'dark-yojimbo') && stacksOf(me, 'cheer') < line.cheerStacks) {
    const cheer = row(commands, ['Cheer']);
    if (cheer) return aim(cheer, me.id);
  }

  // 5. A spell for whoever has one (it never misses: Mindy first), Quick Hit or a plain Attack for the rest (Cindy, then Sandy).
  const spell = row(commands, SPELLS, magicAt);
  if (spell) return aim(spell, magicAt);
  const quick = row(commands, ['Quick Hit'], bladeAt);
  if (quick) return aim(quick, bladeAt);
  const swing = pickKind(commands, 'attack', bladeAt);
  return swing ? aim(swing, bladeAt) : null;
};

/** The shipped line, registered for the chapter (`./index.ts`). */
export const mirrorAeons: Tactic = lineWith(SHIPPED_LINE);

export default mirrorAeons;
