/**
 * The hidden Biran and Yenke chapter (Kimahri alone at the gate of Mt. Gagazet; **FFX only** [AGENTS.md rule 14]): the line the duel is beaten with on the gate preset
 * (`data/ffx/builds/gagazet-gate.ts`; Kimahri's numbers are an estimate, the Ronso's are written from his, `research/ffx-biran-yenke.md` "§n"). Registered under the FFX game in
 * `./lookup.ts`; it returns `null` (the generic ladder) when the duel is not on.
 *
 * ## The line, and where each rule comes from
 *
 * It is the **intended** line of `tests/unit/chapters/biran-yenke-bench.test.ts` (the bench prints its figures). It is built on the chapter's lesson: **take their Rages first**.
 *
 * 1. **Keep Kimahri up.** He is alone (the formation's forced party, §0.4): a Hi-Potion when much is missing, a Potion when less, under {@link HEAL_UNDER} of his HP; White Wind
 *    instead once he has learned it and his gauge is full.
 * 2. **Spend a full gauge.** Every Rage learned by Lancet fills it (§4.5), so the gauge is the fight's engine: an area breath (Aqua Breath, then Fire Breath) while both Ronso stand, a
 *    single blow (Thrust Kick, Jump, Seed Cannon) on one. Never Self-Destruct (it ejects him: the battle would end without a winner, §4.6), never Stone Breath (both are immune to
 *    Petrify, §2.3), never Doom (a 20-turn count).
 * 3. **Lancet whoever can still teach** (§4.5): the first Rage of his list Kimahri does not know; Yenke first, for the breaths.
 * 4. **Keep the lessons alive.** Mighty Guard and White Wind can be learned only after the Ronso has cast it, and he casts it once, below a quarter of his HP (§4.2): a Ronso under half
 *    who has not cast his yet is only Lanceted (a Lancet cannot take him from a quarter to nothing), and an area breath waits while one such Ronso is within its reach. **Yenke is kept
 *    alive the same way until Biran has cast Mighty Guard**: Yenke's fall sends Biran berserk, and a berserk Biran never casts it (§4.3).
 * 5. **Physical blows only while they stand apart.** Side by side each covers the other, so an Attack lands on the wrong Ronso at half (§4.4); after a Bulldoze, the Attack is
 *    Kimahri's strongest turn without a full gauge.
 * 6. Otherwise, Lancet: it drains, so it is never a wasted turn.
 *
 * The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, Command, CombatantId, FFXCombatant } from '../../battle/common/types.ts';
import { type Tactic, aim } from './common.ts';
import { BIRAN_ID, BIRAN_TEACHES, YENKE_ID, YENKE_TEACHES, rageToTeach, together, usedRageFlag } from '../../battle/ffx/ai/biran-yenke-rules.ts';

/** The duel's two Ronso, mirrored from `src/data/ffx/biran-yenke-ids.ts`: Biran first, the formation's boss (the line Lancets Yenke first, rule 3). */
export const BIRAN_YENKE_BOSS_IDS: readonly CombatantId[] = [BIRAN_ID, YENKE_ID];
const KIMAHRI: CombatantId = 'kimahri';

/** Heal Kimahri under this share of his HP: one round of both Ronso can take about a third of the preset's (a Bulldoze critical and a breath). */
export const HEAL_UNDER = 0.5;
/** A Hi-Potion (1,000 HP) is worth the turn when this much is missing; a Potion (200) when this much. */
const HI_POTION_WORTH = 700;
const POTION_WORTH = 250;
/** A Ronso who has not cast his Rage yet is spared all but Lancet under this share of his HP (rule 4). */
const LESSON_GUARD = 0.5;
/** An area breath can take this much from a Ronso (Aqua Breath's top roll with a critical, on the preset: the bench's measure, rounded up). */
export const BREATH_REACH = 1_300;

/** A Lancet can take this much (the bench's largest Lancet on the preset, rounded up): a teacher this low who still owes two Rages is left for a turn (rule 3). */
export const LANCET_REACH = 150;

/** The area Rages, strongest first; the single-target ones, strongest first. */
const AREA_RAGES = ['aqua-breath', 'fire-breath'] as const;
const SINGLE_RAGES = ['thrust-kick', 'jump', 'seed-cannon'] as const;

const living = (engine: BattleEngine, id: CombatantId): FFXCombatant | undefined => {
  const c = engine.state().combatants[id] as FFXCombatant | undefined;
  return c && c.alive && c.hp > 0 && !c.removed ? c : undefined;
};

/** The first enabled row of `kind` (and `id`) that can name `target` (when given). */
function pick(commands: readonly AvailableCommand[], kind: Command['kind'], id?: string, target?: CombatantId): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
}

/** True while this Ronso's own Rage (Mighty Guard, White Wind) is still uncast: it can be learned only after he casts it (§4.2). */
function lessonPending(engine: BattleEngine, r: FFXCombatant): boolean {
  return engine.state().flags[usedRageFlag(r.id)] !== true;
}

/** How many Rages of this Ronso's list Kimahri does not know yet, cast or not (§4.5). */
function owed(engine: BattleEngine, r: FFXCombatant): number {
  const known = (engine.state().combatants[KIMAHRI] as FFXCombatant | undefined)?.overdrive?.unlockedOverdriveIds ?? [];
  const list = r.id === BIRAN_ID ? BIRAN_TEACHES : YENKE_TEACHES;
  return list.filter((rage) => !known.includes(rage)).length;
}

/** True while this Ronso still has a Rage Kimahri does not know. */
function owesLesson(engine: BattleEngine, r: FFXCombatant): boolean {
  return owed(engine, r) > 0;
}

/**
 * Rule 4: this Ronso must not fall yet: he still owes Kimahri a Rage (his own Mighty Guard or White Wind included, before and after he casts it), or he is Yenke and Biran has not
 * cast Mighty Guard yet (Yenke's fall would send Biran berserk, and a berserk Biran never casts it, §4.3).
 */
function keptAlive(engine: BattleEngine, r: FFXCombatant): boolean {
  if (owesLesson(engine, r)) return true;
  if (r.id !== YENKE_ID) return false;
  const biran = living(engine, BIRAN_ID);
  return biran !== undefined && lessonPending(engine, biran);
}

/** Rule 4: a Ronso under half who must not fall yet: only Lancet touches him. */
function spared(engine: BattleEngine, r: FFXCombatant): boolean {
  return keptAlive(engine, r) && r.hp < r.stats.maxHp * LESSON_GUARD;
}

/** Rule 1: keep Kimahri up. */
function upkeep(commands: readonly AvailableCommand[], me: FFXCombatant): Command | null {
  if (me.hp >= me.stats.maxHp * HEAL_UNDER) return null;
  const wind = pick(commands, 'overdrive', 'white-wind');
  if (wind) return aim(wind, me.id);
  const missing = me.stats.maxHp - me.hp;
  const item = (missing > HI_POTION_WORTH ? pick(commands, 'item', 'hi-potion', me.id) : undefined) ?? (missing > POTION_WORTH ? pick(commands, 'item', 'potion', me.id) : undefined);
  return item ? aim(item, me.id) : null;
}

/** Rule 2: a full gauge, spent where it does the most and harms no lesson. */
function spendGauge(commands: readonly AvailableCommand[], engine: BattleEngine, ronso: readonly FFXCombatant[]): Command | null {
  if (!pick(commands, 'overdrive')) return null;
  const breathSafe = ronso.length === 2 && ronso.every((r) => !(keptAlive(engine, r) && r.hp <= BREATH_REACH));
  if (breathSafe) {
    for (const id of AREA_RAGES) {
      const breath = pick(commands, 'overdrive', id);
      if (breath) return aim(breath, ronso[0]?.id);
    }
  }
  const mark = ronso.filter((r) => !spared(engine, r)).sort((a, b) => a.hp - b.hp)[0];
  if (!mark) return null;
  for (const id of SINGLE_RAGES) {
    const blow = pick(commands, 'overdrive', id, mark.id);
    if (blow) return aim(blow, mark.id);
  }
  if (ronso.length === 1 && !spared(engine, mark)) {
    for (const id of AREA_RAGES) {
      const breath = pick(commands, 'overdrive', id);
      if (breath) return aim(breath, mark.id);
    }
  }
  return null;
}

export const biranYenke: Tactic = (actorId, commands, engine) => {
  if (actorId !== KIMAHRI) return null;
  const state = engine.state();
  const me = state.combatants[KIMAHRI] as FFXCombatant | undefined;
  const ronso = [living(engine, YENKE_ID), living(engine, BIRAN_ID)].filter((c): c is FFXCombatant => c !== undefined);
  if (!me || ronso.length === 0) return null;

  // 1. Keep Kimahri up.
  const care = upkeep(commands, me);
  if (care) return care;

  // 2. A full gauge.
  const rage = spendGauge(commands, engine, ronso);
  if (rage) return rage;

  // 3. Lancet whoever can still teach (Yenke first), but not a teacher the Lancet would finish while he owes another Rage after this one.
  const known = me.overdrive?.unlockedOverdriveIds ?? [];
  for (const r of ronso) {
    if (rageToTeach({ state }, r, known) === null) continue;
    if (r.hp <= LANCET_REACH && owed(engine, r) > 1) continue;
    const lancet = pick(commands, 'ability', 'lancet', r.id);
    if (lancet) return aim(lancet, r.id);
  }

  // 5. Apart: Attack the weakest Ronso whose lesson is not pending under half.
  if (!together({ state })) {
    const mark = ronso.filter((r) => !spared(engine, r)).sort((a, b) => a.hp - b.hp)[0];
    const swing = mark ? pick(commands, 'attack', undefined, mark.id) : undefined;
    if (mark && swing) return aim(swing, mark.id);
  }

  // 6. Lancet: the Ronso with the most HP (it drains, never a wasted turn); one who owes two Rages and would fall to it only when there is no other.
  const most = [...ronso].sort((a, b) => b.hp - a.hp).find((r) => !(r.hp <= LANCET_REACH && owed(engine, r) > 1)) ?? [...ronso].sort((a, b) => b.hp - a.hp)[0];
  const lancet = most ? pick(commands, 'ability', 'lancet', most.id) : undefined;
  return lancet && most ? aim(lancet, most.id) : null;
};
