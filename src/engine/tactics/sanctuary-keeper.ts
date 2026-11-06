/**
 * The hidden Sanctuary Keeper chapter (the beast on the Mt. Gagazet summit; **FFX only** [AGENTS.md rule 14]): the line the fight is played with. It is registered under the FFX game in `./lookup.ts`, so an
 * FFX-2 board never reaches it, and it returns `null` (a swing) when the Keeper is not on the field.
 *
 * ## Why the card needed it
 *
 * Plain blows cannot win this fight (the careless and the plain lines of `tests/unit/chapters/sanctuary-keeper-bench.test.ts` win 0 of 200): the Keeper heals about 9,999 twice every six turns. Until this line existed
 * the first menu's NEXT BEST MOVE card named "Attack", the one line that loses (the release review's M1). This is the line the bench calls the **advisor** (`tests/unit/helpers/sanctuaryBot.ts`), moved into the game
 * so that the card, the strategy guide's NEXT line and the auto-battler all play it. **Nothing in the fight is tuned**: the numbers are the game's (`research/re-ffx-sanctuary-keeper.md`, "RE n" below).
 *
 * ## The line, and where each rule comes from
 *
 * 1. **Keep the party up** (the skeleton): Phoenix Down on a fallen member; Echo Screen for Yuna's Silence; Esuna (or the item that cures it) for Confuse, Darkness and Silence, which Photon Wings rolls on every
 *    member (RE 5: Confuse 25, Sleep 50, Silence 50, Darkness 50 percent); Curaga, or a potion when the caster cannot, for anyone under 70 percent of his HP (Mana Breath does 2,500 to 3,600: RE 5).
 * 2. **Tidus: Hastega** when two or more of the line are not hasted (the Tail Sweep takes Haste off and pushes every next turn back: RE 4.3); **a Poison Fang** when nobody can cast Bio and the Keeper is not poisoned.
 * 3. **Yuna: Reflect on the Keeper, after the poison.** A Reflect on it bounces every spell the party casts at it, Bio included (the target builder sends a reflectable spell at a Reflect holder back to its caster), so
 *    the order is Bio (or the Fang), then Reflect. With both on it, its own Curaga mends the party and its Esuna cures the party, and the Poison ticks 2,000 a Keeper turn with nothing to cure it (RE 4.2, the support
 *    turns' override priority: Regen, Esuna, Protect, Reflect). Then **Dispel on a party member who holds Reflect once the Keeper is under half**: under half the Keeper aims its support spell at a Reflect holder to
 *    bounce it onto itself (RE 4.2, the Reflect trick). Then **Shell** on each member before the breath, then **Protect**.
 * 4. **Lulu: Bio** while the Keeper is not poisoned. **Auron: Armor Break** while it is not broken (the damage is his; with the Keeper Reflected its Protect answer bounces back to the party).
 * 5. Anything else swings (`null`): the plain Attack, or an Overdrive ready, as the generic ladder does after a tactic that has no opinion.
 *
 * Measured on the real engine over seeds 1 to 200 with the shipped front line (Tidus, Yuna, Auron): 138 wins (69 percent), against 0 for the plain Attack. The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { SANCTUARY_KEEPER_ID } from '../../data/ffx/sanctuary-keeper-ids.ts'; // a module with no imports of its own
import { type Tactic, has } from './common.ts';

/** The Keeper's combatant id (`src/data/ffx/sanctuary-keeper-ids.ts`), the one `tacticFor` keys this encounter on. */
export const SANCTUARY_KEEPER_BOSS_IDS: readonly CombatantId[] = [SANCTUARY_KEEPER_ID];

/** A member needs a heal when the next ordinary blow could be the last: under 70 percent of his maximum. */
const HEAL_UNDER = 0.7;
const HEAL_ITEMS = ['mega-potion', 'x-potion', 'hi-potion'] as const;

const alive = (c: FFXCombatant): boolean => c.alive && c.hp > 0 && !c.removed;

/** The enabled row of `kind`/`id` that can name `target`, aimed at it; null when it is not offered. */
function pick(commands: readonly AvailableCommand[], kind: Command['kind'], id: string | undefined, target?: CombatantId): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : [] } as Command) : null;
}

/** Rule 1: stand a fallen member up, cure what stops a person acting, heal the hurt. */
function care(commands: readonly AvailableCommand[], party: readonly FFXCombatant[], me: FFXCombatant | undefined): Command | null {
  const down = party.find((c) => !alive(c));
  if (down) return pick(commands, 'item', 'phoenix-down', down.id);
  for (const c of party) {
    if (has(c, 'silence') && c.id === 'yuna') {
      const cure = pick(commands, 'item', 'echo-screen', c.id);
      if (cure) return cure;
    }
  }
  const canCast = me !== undefined && !has(me, 'silence');
  for (const c of party) {
    if (!alive(c)) continue;
    if (has(c, 'confuse') || has(c, 'darkness') || has(c, 'silence')) {
      const cure = (canCast && pick(commands, 'ability', 'esuna', c.id)) || pick(commands, 'item', has(c, 'silence') ? 'echo-screen' : has(c, 'darkness') ? 'eye-drops' : 'remedy', c.id);
      if (cure) return cure;
    }
  }
  const hurt = party.filter((c) => alive(c) && c.hp < c.stats.maxHp * HEAL_UNDER).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (hurt) {
    const heal = (canCast && pick(commands, 'ability', 'curaga', hurt.id)) || HEAL_ITEMS.map((i) => pick(commands, 'item', i, hurt.id)).find((c) => c !== null) || null;
    if (heal) return heal;
  }
  return null;
}

export const sanctuaryKeeper: Tactic = (actorId, commands, engine: BattleEngine) => {
  const state = engine.state();
  const keeper = state.combatants[SANCTUARY_KEEPER_ID] as FFXCombatant | undefined;
  if (keeper === undefined || !alive(keeper)) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (me === undefined || me.side !== 'party') return null;
  const front = state.activeIds.map((id) => state.combatants[id] as FFXCombatant | undefined).filter((c): c is FFXCombatant => c !== undefined);

  // 1. Keep the party up.
  const tended = care(commands, front, me);
  if (tended) return tended;

  const party = front.filter(alive);
  const canCast = !has(me, 'silence');
  const underHalf = keeper.hp < keeper.stats.maxHp / 2;

  if (actorId === 'tidus') {
    // 2. Hastega again once the sweep has stripped it; a Poison Fang when nobody in front can cast Bio.
    if (canCast && party.filter((c) => !has(c, 'haste')).length >= 2) {
      const cast = pick(commands, 'ability', 'hastega', 'tidus');
      if (cast) return cast;
    }
    if (!party.some((c) => c.id === 'lulu') && !has(keeper, 'poison')) {
      const fang = pick(commands, 'item', 'poison-fang', keeper.id);
      if (fang) return fang;
    }
  }
  if (actorId === 'yuna' && canCast) {
    // 3. Reflect AFTER the poison: a reflected Bio bounces back on its caster. Poison is "coming" when Lulu (not silenced) or Tidus (the Fang) is in front.
    const poisoner = party.some((c) => c.id === 'lulu' && !has(c, 'silence')) || party.some((c) => c.id === 'tidus');
    if (!has(keeper, 'reflect') && (has(keeper, 'poison') || !poisoner)) {
      const cast = pick(commands, 'ability', 'reflect', keeper.id);
      if (cast) return cast;
    }
    if (underHalf && has(keeper, 'reflect')) {
      const holder = party.find((c) => has(c, 'reflect'));
      const dispel = holder ? pick(commands, 'ability', 'dispel', holder.id) : null;
      if (dispel) return dispel;
    }
    const bare = party.find((c) => !has(c, 'shell'));
    const shell = bare ? pick(commands, 'ability', 'shell', bare.id) : null;
    if (shell) return shell;
    const open = party.find((c) => !has(c, 'protect'));
    const protect = open ? pick(commands, 'ability', 'protect', open.id) : null;
    if (protect) return protect;
  }
  // 4. Lulu: Bio while it is clean. Auron: Armor Break while it is whole.
  if (actorId === 'lulu' && canCast && !has(keeper, 'poison')) {
    const bio = pick(commands, 'ability', 'bio', keeper.id);
    if (bio) return bio;
  }
  if (actorId === 'auron' && !has(keeper, 'armor-break')) {
    const brk = pick(commands, 'ability', 'armor-break', keeper.id);
    if (brk) return brk;
  }
  // 5. Swing.
  return null;
};

export default sanctuaryKeeper;
