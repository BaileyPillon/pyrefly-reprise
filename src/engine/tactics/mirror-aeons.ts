/**
 * The hidden Mirror Aeons chapter (the Dark Magus Sisters, then Dark Yojimbo; **FFX only** [AGENTS.md rule 14]): the line the fight is played with. Registered under the FFX game in `./lookup.ts`, so an FFX-2
 * board never reaches it; it returns `null` (the generic ladder) when no Dark Aeon is on the field.
 *
 * ## The line, and where each rule comes from
 *
 * It is the **intended** line of `tests/unit/chapters/mirror-aeons-bench.test.ts`, which measures it on the real engine once the Dark aeons' scripts and Yuna's Yojimbo and Sisters exist (nothing in the
 * fight is tuned: the enemy numbers are the game's, `research/re-ffx-yojimbo-sisters-feasibility.md` "RE section n"; the party is an `[estimate]` preset, `data/ffx/builds/mirror-aeons.ts`). Rule for rule:
 *
 * 1. **Revive the fallen, then heal under 45 percent.** The party carries Phoenix Downs and X-Potions (the preset's bag) and Auto-Phoenix; the sisters' and Yojimbo's multi-hit moves leave members low
 *    (`research/ffx-mirror-aeons.md` sections 2 and 3).
 * 2. **Send an aeon in when a Dark Aeon's gauge is full** (Yuna only, no aeon out). Every guide says the same: the joint Delta Attack, Mega Graviton and Zanmato are answered by an aeon taking the blow, because
 *    Auto-Life does not (Jegged Sisters and Yojimbo; GamerGuides; StrategyWiki). The sisters start the trio full (RE section 4.2), so Yuna's first turn is the summon. The aeon is the sturdiest one on offer
 *    (the order below follows the preset's own hit points: Cindy, Sandy, Mindy, Yojimbo, then the story aeons). Until the reverse-engineering session wires the Sisters as one summon, a lone Cindy is the fodder.
 * 3. **An aeon on the field attacks**: its Overdrive when it has one, else its special, else its attack; it is dismissed once the danger has passed and it is under a third of its strength, so it comes back
 *    for the next one.
 * 4. **A blade goes to Cindy, then Sandy; a spell goes to Mindy, then Sandy, then Cindy.** Dark Mindy's Evasion is 240 (RE section 2): **the engine lands 0 of 55 physical blows of this party on her, about 80
 *    percent on Sandy (Evasion 100) and every one on Cindy (Evasion 0)**, measured on the preset in 2026-10-15 (`docs/handoff/ch-mirror-aeons.md`); a spell, an Overdrive or an aeon's special never misses. So Tidus
 *    swings at Cindy and Sandy (Quick Hit, Jegged Yojimbo and GamerGuides), and **Lulu's Ultima or Flare takes Mindy first** (GamerGuides and StrategyWiki both send a mage: Doublecast Flare or Ultima, about 40
 *    percent stronger than a blade because the sisters' Magic Defense is lower than their Defense). In Act II the target is Dark Yojimbo (the dog cannot be targeted).
 *
 * The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { type Tactic, aim, hpFraction, revive, row } from './common.ts';

/** The four Dark Aeons (`src/data/ffx/mirror-aeons-ids.ts`). */
export const MIRROR_AEONS_BOSS_IDS: readonly CombatantId[] = ['dark-cindy', 'dark-sandy', 'dark-mindy', 'dark-yojimbo'];
/** The order for a blade (Attack, Quick Hit): Cindy, then Sandy, then Mindy last (see rule 4); Dark Yojimbo is the only target in Act II. */
const BLADE_ORDER: readonly CombatantId[] = ['dark-cindy', 'dark-sandy', 'dark-mindy', 'dark-yojimbo'];
/** The order for a spell, an Overdrive or an aeon's special (none of them misses): Mindy first, the smallest pool and the one a blade cannot touch, then Sandy, then Cindy. */
const MAGIC_ORDER: readonly CombatantId[] = ['dark-mindy', 'dark-sandy', 'dark-cindy', 'dark-yojimbo'];
/** Lulu's spells, the strongest first. */
const SPELLS: readonly string[] = ['Ultima', 'Flare', 'Thundaga', 'Firaga', 'Blizzaga', 'Waterga'];
/** Which aeon to send in as the blow's target: the sturdiest first (the preset's own hit points). */
const FODDER_ORDER: readonly string[] = ['Cindy', 'Sandy', 'Mindy', 'Yojimbo', 'Bahamut', 'Shiva', 'Ixion', 'Ifrit', 'Valefor'];

/** A party member is hurt enough to heal under this share of his HP. */
const HEAL_UNDER = 0.45;
/** A summoned aeon under this share of its HP goes home once the danger has passed. */
const DISMISS_UNDER = 0.34;
/** An Overdrive gauge at this value is the next turn's big move (RE sections 4.1 and 4.2). */
const FULL_GAUGE = 100;

const living = (engine: BattleEngine, id: CombatantId): FFXCombatant | undefined => {
  const c = engine.state().combatants[id] as FFXCombatant | undefined;
  return c !== undefined && c.alive && c.hp > 0 && !c.removed ? c : undefined;
};

/** The first enabled row of a kind that can name `target` (or any), unaimed. */
function pickKind(commands: readonly AvailableCommand[], kind: Command['kind'], target?: CombatantId): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === kind && (target === undefined || c.validTargets.includes(target)));
}

/** True when a Dark Aeon's next move is its big one (a full gauge). */
function danger(foes: readonly FFXCombatant[]): boolean {
  return foes.some((f) => (f.overdrive?.gauge ?? 0) >= FULL_GAUGE);
}

export const mirrorAeons: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const foes = MIRROR_AEONS_BOSS_IDS.map((id) => living(engine, id)).filter((c): c is FFXCombatant => c !== undefined);
  if (foes.length === 0) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (!me) return null;
  const firstOf = (order: readonly CombatantId[]): CombatantId | undefined => order.find((id) => foes.some((f) => f.id === id));
  const bladeAt = firstOf(BLADE_ORDER);
  const magicAt = firstOf(MAGIC_ORDER);
  const aeonOut = state.aeonId !== null;

  // 3. An aeon on the field attacks, and goes home when the blow has passed and it is low.
  if (me.side === 'aeon') {
    if (!danger(foes) && hpFraction(me) < DISMISS_UNDER) {
      const home = pickKind(commands, 'dismiss');
      if (home) return aim(home);
    }
    const od = row(commands, ['Delta Attack', 'Zanmato'], magicAt) ?? commands.find((c) => c.enabled && c.command.kind === 'overdrive' && (magicAt === undefined || c.validTargets.includes(magicAt)));
    if (od) return aim(od, magicAt);
    const special = commands.find((c) => c.enabled && c.command.kind === 'ability' && c.category === 'aeon' && !['Shield', 'Boost', 'Dismiss', 'Nul-All'].includes(c.label) && (magicAt === undefined || c.validTargets.includes(magicAt)));
    if (special) return aim(special, magicAt);
    const swing = pickKind(commands, 'attack', bladeAt);
    return swing ? aim(swing, bladeAt) : null;
  }

  // 1. The fallen first, then the hurt.
  const party = state.activeIds.map((id) => state.combatants[id]).filter((c): c is FFXCombatant => c !== undefined && c.side === 'party');
  const rescue = revive(commands, party);
  if (rescue) return rescue;
  const hurt = party.filter((c) => c.alive && hpFraction(c) < HEAL_UNDER).sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (hurt && !aeonOut) {
    const potion = row(commands, ['X-Potion', 'Hi-Potion', 'Potion'], hurt.id);
    if (potion) return aim(potion, hurt.id);
  }

  // 2. Yuna sends an aeon in when the big move is next.
  if (me.id === 'yuna' && !aeonOut && danger(foes)) {
    for (const name of FODDER_ORDER) {
      const summon = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === name);
      if (summon) return aim(summon);
    }
  }

  // 4. A spell for whoever has one (it never misses: Mindy first), Quick Hit or a plain Attack for the rest (Cindy, then Sandy).
  const spell = row(commands, SPELLS, magicAt);
  if (spell) return aim(spell, magicAt);
  const quick = row(commands, ['Quick Hit'], bladeAt);
  if (quick) return aim(quick, bladeAt);
  const swing = pickKind(commands, 'attack', bladeAt);
  return swing ? aim(swing, bladeAt) : null;
};

export default mirrorAeons;
