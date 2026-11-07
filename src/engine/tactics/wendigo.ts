/**
 * The hidden Wendigo chapter (Wendigo and its two Guado Guardians on frozen Lake Macalania; **FFX only** [AGENTS.md rule 14]): the line the fight is played with. It is registered under the FFX game in `./lookup.ts`, so an FFX-2
 * board never reaches it, and it returns `null` (a swing) when Wendigo is not on the field.
 *
 * ## Why the card needed it
 *
 * Plain blows lose this fight (the careless and the plain lines of `tests/unit/chapters/wendigo-bench.test.ts` win 0 of 100): Wendigo's punch kills a full-HP member, and its Guardians keep it that way. This is the line the
 * bench calls the **advisor** (`tests/unit/helpers/wendigoBot.ts`), moved into the game so that the card, the strategy guide's NEXT line and the auto-battler all play it. **Nothing in the fight is tuned**: the numbers are the
 * game's (`research/re-ffx-wendigo-lake-macalania.md`, "RE n" below).
 *
 * ## The line, and where each rule comes from
 *
 * 1. **Keep the party up** (the skeleton): Phoenix Down on a fallen member; Esuna (or the item that cures it) for Berserk, Confuse, Silence and Darkness (the Guardians Berserk the party while Wendigo's arms are up, RE 4.4);
 *    Cura or Cure, or a potion when the caster cannot, for anyone under 55 percent of his HP.
 * 2. **Rikku opens with a Petrify Grenade** (the bag holds four; it reaches both Guardians, whose Petrify byte is 25: RE 1.3): a petrified Guardian casts no Berserk, no Eye Drops, drinks no potion and casts no last shield
 *    (RE 4.4; GameFAQs: "unless through Petrification"). **Where the grenade is spent or has missed, she Steals from each Guardian that is still up**: a stolen-from Guardian drinks no potion, and (GameFAQs) uses no Eye Drops.
 * 3. **Tidus makes way for Auron, whose Power Break halves every blow Wendigo throws** (all four Breaks land on it: RE 1.1), **and Rikku, once her opening is done, for Wakka, whose Dark Attack blinds it** (a rolled
 *    punch then misses about nine times in ten; the Double Punch and the Counter Punch never miss, so Darkness is the second lever, not the first: RE 6). A character who comes in acts at once.
 * 4. **Yuna puts Protect on each member** (a physical blow halves again; with Power Break a punch is 408 to 503 and the Double Punch 612 to 755, so a member lives through one: RE 6).
 * 5. **With Wendigo's arms up and no aeon out, nobody swings** (a physical hit is answered by the Counter Punch, RE 4.3; an aeon on the field silences it): the others Defend until they come down, three Wendigo turns.
 * 6. Anything else swings: at a Guardian still up first (the Steal has ended its potion), else at Wendigo.
 *
 * Measured on the real engine over seeds 1 to 200 with the shipped front line (Tidus, Yuna, Rikku; Auron and Wakka on the bench): see `docs/handoff/ch-wendigo.md`. The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { LAKE_GUARDIAN_IDS, WENDIGO_FLAGS, WENDIGO_ID } from '../../data/ffx/wendigo-ids.ts'; // a module with no imports of its own
import { type Tactic, has } from './common.ts';

/** Wendigo's combatant id (`src/data/ffx/wendigo-ids.ts`), the one `tacticFor` keys this encounter on. */
export const WENDIGO_BOSS_IDS: readonly CombatantId[] = [WENDIGO_ID];

/** A member needs a heal when the next ordinary blow could be the last: under 55 percent of his maximum. */
const HEAL_UNDER = 0.55;
const HEAL_ITEMS = ['x-potion', 'hi-potion', 'potion'] as const;

const alive = (c: FFXCombatant): boolean => c.alive && c.hp > 0 && !c.removed;

/** The enabled row of `kind`/`id` that can name `target`, aimed at it; null when it is not offered. */
function pick(commands: readonly AvailableCommand[], kind: Command['kind'], id: string | undefined, target?: CombatantId): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : [] } as Command) : null;
}

/** The switch row that brings `inId` onto the field for `outId`, when it is offered. */
function switchFor(commands: readonly AvailableCommand[], outId: CombatantId, inId: CombatantId): Command | null {
  const r = commands.find((c) => {
    if (!c.enabled || c.command.kind !== 'switch') return false;
    const extra = (c.command as { extra?: { outId?: string; inId?: string } }).extra;
    return extra?.outId === outId && extra.inId === inId;
  });
  return r ? r.command : null;
}

/** Has a Steal been tried on this Guardian? (A player remembers his own turn; the log is the same fact.) One try each: a miss is not repeated. */
function stealTried(engine: BattleEngine, id: CombatantId): boolean {
  const log = engine.state().log as ReadonlyArray<{ type: string; abilityId?: string; targets?: readonly string[] }>;
  return log.some((e) => e.type === 'action-start' && e.abilityId === 'steal' && (e.targets ?? []).includes(id));
}

/** Rule 1: stand a fallen member up, cure what stops a person acting, heal the hurt. */
function care(commands: readonly AvailableCommand[], party: readonly FFXCombatant[], me: FFXCombatant | undefined): Command | null {
  const down = party.find((c) => !alive(c));
  if (down) return pick(commands, 'item', 'phoenix-down', down.id) ?? pick(commands, 'ability', 'life', down.id);
  const canCast = me !== undefined && !has(me, 'silence');
  for (const c of party) {
    if (alive(c) && (has(c, 'berserk') || has(c, 'confuse') || has(c, 'silence') || has(c, 'darkness'))) {
      const cure = (canCast && pick(commands, 'ability', 'esuna', c.id)) || pick(commands, 'item', 'remedy', c.id);
      if (cure) return cure;
    }
  }
  const hurt = party.filter((c) => alive(c) && c.hp < c.stats.maxHp * HEAL_UNDER).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (hurt) {
    const heal = (canCast && (pick(commands, 'ability', 'cura', hurt.id) ?? pick(commands, 'ability', 'cure', hurt.id))) || HEAL_ITEMS.map((i) => pick(commands, 'item', i, hurt.id)).find((c) => c !== null) || null;
    if (heal) return heal;
  }
  return null;
}

export const wendigoLine: Tactic = (actorId, commands, engine: BattleEngine) => {
  const state = engine.state();
  const wendigo = state.combatants[WENDIGO_ID] as FFXCombatant | undefined;
  if (wendigo === undefined || !alive(wendigo)) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (me === undefined || me.side !== 'party') return null;
  const front = state.activeIds.map((id) => state.combatants[id] as FFXCombatant | undefined).filter((c): c is FFXCombatant => c !== undefined);
  const bench = state.reserveIds.map((id) => state.combatants[id] as FFXCombatant | undefined).filter((c): c is FFXCombatant => c !== undefined && c.alive && c.hp > 0);

  // 1. Keep the party up.
  const tended = care(commands, front, me);
  if (tended) return tended;

  const party = front.filter(alive);
  const inFront = (id: string): boolean => party.some((c) => c.id === id);
  const onBench = (id: string): boolean => bench.some((c) => c.id === id);
  const armsUp = state.flags[WENDIGO_FLAGS.arms] === true;
  const aeonOut = Boolean(state.aeonId);
  const canCast = !has(me, 'silence');
  const guardians = LAKE_GUARDIAN_IDS.map((id) => state.combatants[id] as FFXCombatant | undefined).filter((g): g is FFXCombatant => g !== undefined && alive(g) && !has(g, 'petrify'));
  const needBreak = !has(wendigo, 'power-break') && (inFront('auron') || onBench('auron'));
  const needBlind = !has(wendigo, 'darkness') && (inFront('wakka') || onBench('wakka'));
  const waiting = armsUp && !aeonOut;

  // 2. Rikku opens: a Petrify Grenade (it reaches both Guardians), else a Steal from each that is still up.
  if (actorId === 'rikku') {
    for (const g of guardians) {
      const grenade = pick(commands, 'item', 'petrify-grenade', g.id);
      if (grenade) return grenade;
      const steal = pick(commands, 'ability', 'steal', g.id);
      if (steal && !stealTried(engine, g.id)) return steal;
    }
  }
  // 3. The two fighters make way: Tidus for Auron (Power Break), Rikku, once her opening is done, for Wakka (Dark Attack).
  if (needBreak && !inFront('auron') && actorId === 'tidus') {
    const sw = switchFor(commands, actorId, 'auron');
    if (sw) return sw;
  }
  if (needBlind && !inFront('wakka') && (actorId === 'rikku' || (actorId === 'tidus' && !(needBreak && !inFront('auron'))))) {
    const done = actorId !== 'rikku' || guardians.length === 0;
    if (done) {
      const sw = switchFor(commands, actorId, 'wakka');
      if (sw) return sw;
    }
  }
  if (actorId === 'auron' && needBreak && !waiting) {
    const brk = pick(commands, 'ability', 'power-break', WENDIGO_ID);
    if (brk) return brk;
  }
  if (actorId === 'wakka' && needBlind && !waiting) {
    const dark = pick(commands, 'ability', 'dark-attack', WENDIGO_ID);
    if (dark) return dark;
  }
  // 4. Yuna: Protect on each member.
  if (actorId === 'yuna' && canCast) {
    const open = party.find((c) => !has(c, 'protect'));
    const cast = open ? pick(commands, 'ability', 'protect', open.id) : null;
    if (cast) return cast;
  }
  // 5. The stance: with the arms up and no aeon out, nobody swings.
  if (waiting && actorId !== 'yuna') return pick(commands, 'defend', undefined);
  // 6. Swing: at a Guardian still up first, else at Wendigo.
  const target = guardians[0] ?? wendigo;
  return pick(commands, 'attack', undefined, target.id) ?? pick(commands, 'attack', undefined, WENDIGO_ID);
};

export default wendigoLine;
