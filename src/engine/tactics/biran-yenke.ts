/**
 * The hidden Biran and Yenke chapter (Kimahri alone against the two Ronso at the Mountain Gate of Mt. Gagazet; **FFX only** [AGENTS.md rule 14]): the line the fight is played with
 * (`data/ffx/builds/kimahri-trial.ts`; the fight's numbers are the game's own, `research/re-ffx-biran-yenke.md` "RE section n"; Kimahri's are Chapter I's preset).
 * Registered under the FFX game in `./lookup.ts`, so an FFX-2 board never reaches it; it returns `null` (the generic ladder) when neither brother is on the field.
 *
 * ## The line, and where each rule comes from
 *
 * It is the **intended** line of `tests/unit/chapters/biran-yenke-bench.test.ts`, which measures it on the real engine (the bench prints the figures; **nothing in the fight is tuned**: the numbers are the game's).
 * Rule for rule:
 *
 * 1. **Keep Kimahri up.** He is alone, and the two brothers hit for a third of his HP and more (Bulldoze, Fire and Aqua Breath: RE section 6): a Potion, Hi-Potion or X-Potion for what is missing once he is under
 *    45 percent.
 * 2. **Spend a Rage the moment the gauge allows it** (every Rage costs the whole gauge, and a new one fills it: RE section 7). Both brothers standing: **Fire Breath or Aqua Breath**, which hit them both
 *    and ignore Magic Defense (RE section 7, the Rage rows: formula 15), else **Thrust Kick**, else **Jump**. Never Self-Destruct (it ejects Kimahri, who is alone), Doom (a twenty-turn counter), Stone Breath
 *    (both are immune to Petrify: RE section 2) or Mighty Guard and White Wind (they cover allies). A Rage is not Kimahri's plain Attack, so it never makes the other brother stand guard (RE section 5.6).
 * 3. **Lancet whoever still has something to teach**, Biran first: one Rage a cast, the first he does not know (RE section 7); Mighty Guard and White Wind only once that brother has called his own at half
 *    HP (the `ronso.gate.<brother>` flag). **Learn Biran's Rages before Yenke falls**: a Berserk Biran never offers Mighty Guard (the note), or anything (Jegged), so Yenke is the second to go.
 * 4. **The plain Attack only when the brothers are apart** (the `ronso.sameSide` flag is 0): together, a plain Attack on one makes the other stand guard and lands for next to nothing (RE section 5.6, the
 *    probe on the engine: 8 against 435); Lancet, which is not physical, is the filler while the gauge fills. Damage goes to **Biran until he has called his Rage** (so his Mighty Guard can be learned while Yenke
 *    still stands), then to **Yenke**.
 *
 * The tactic only picks among the rows the engine offers.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { RAGE_LESSONS } from '../../battle/ffx/ronso-rage.ts';
import { type Tactic, aim, row } from './common.ts';

/** The two brothers (`src/data/ffx/biran-yenke-ids.ts`). */
export const BIRAN_YENKE_BOSS_IDS: readonly CombatantId[] = ['biran-ronso', 'yenke-ronso'];
const BIRAN: CombatantId = 'biran-ronso';
const YENKE: CombatantId = 'yenke-ronso';
/** `src/battle/ffx/ai/biran-yenke-rules.ts`: 1 while both brothers stand on the same side. */
const SAME_SIDE_FLAG = 'ronso.sameSide';
const GATE_FLAG_PREFIX = 'ronso.gate.';

/** Kimahri is hurt enough to heal under this share of his HP. */
const HEAL_UNDER = 0.45;
/** What each potion is worth a turn for: a Potion (200) when this much is missing, a Hi-Potion (1,000) when this much, an X-Potion (2,000 in the data) when this much. */
const POTION_WORTH = 250;
const HI_POTION_WORTH = 700;
const X_POTION_WORTH = 1500;

const living = (engine: BattleEngine, id: CombatantId): FFXCombatant | undefined => {
  const c = engine.state().combatants[id] as FFXCombatant | undefined;
  return c !== undefined && c.alive && c.hp > 0 && !c.removed ? c : undefined;
};

function pick(commands: readonly AvailableCommand[], kind: Command['kind'], id?: string, target?: CombatantId): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
}

/** Rule 1: a potion for what is missing. */
function heal(commands: AvailableCommand[], me: FFXCombatant): Command | null {
  if (me.hp / me.stats.maxHp >= HEAL_UNDER) return null;
  const missing = me.stats.maxHp - me.hp;
  const labels = missing > X_POTION_WORTH ? ['X-Potion', 'Hi-Potion', 'Potion'] : missing > HI_POTION_WORTH ? ['Hi-Potion', 'Potion'] : missing > POTION_WORTH ? ['Potion'] : [];
  const r = row(commands, labels, me.id);
  return r ? aim(r, me.id) : null;
}

/** True when `brother` can still teach Kimahri something this very turn: a Rage he lacks whose gate (his own half-HP Rage) is open. */
function hasOpenLesson(engine: BattleEngine, me: FFXCombatant, brother: FFXCombatant): boolean {
  const known = new Set(me.overdrive?.unlockedOverdriveIds ?? []);
  const gate = engine.state().flags[`${GATE_FLAG_PREFIX}${brother.id}`] === 1;
  return (RAGE_LESSONS[brother.id] ?? []).some((l) => !known.has(l.rage) && (!l.afterQueued || gate));
}

/** Rule 2: the Rage to spend. */
function rage(commands: AvailableCommand[], both: boolean, aimAt: CombatantId): Command | null {
  const breaths = both ? ['fire-breath', 'aqua-breath'] : [];
  for (const id of [...breaths, 'thrust-kick', 'jump']) {
    const r = pick(commands, 'overdrive', id);
    if (r) return aim(r, aimAt);
  }
  return null;
}

export const biranYenke: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const biran = living(engine, BIRAN);
  const yenke = living(engine, YENKE);
  if (biran === undefined && yenke === undefined) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (!me || me.side !== 'party') return null;

  // 1. Keep Kimahri up.
  const care = heal(commands, me);
  if (care) return care;

  const both = biran !== undefined && yenke !== undefined;
  const known = new Set(me.overdrive?.unlockedOverdriveIds ?? []);
  // The brother to hurt: Biran until he has called his Rage (or has none to call, or Yenke is already down), then Yenke.
  const biranCalled = state.flags[`${GATE_FLAG_PREFIX}${BIRAN}`] === 1 || known.has('mighty-guard');
  const aimAt: CombatantId = both ? (biranCalled ? YENKE : BIRAN) : (biran ?? yenke)!.id;

  // 2. A Rage the moment the gauge allows it.
  const spend = rage(commands, both, aimAt);
  if (spend) return spend;

  // 3. Lancet whoever can teach: Biran first (his Rages before Yenke falls).
  for (const brother of [biran, yenke]) {
    if (brother !== undefined && hasOpenLesson(engine, me, brother)) {
      const lancet = pick(commands, 'ability', 'lancet', brother.id);
      if (lancet) return aim(lancet, brother.id);
    }
  }

  // 4. A plain Attack only while the brothers are apart; together, Lancet is the filler (not physical, so nobody stands guard).
  const together = both && state.flags[SAME_SIDE_FLAG] !== 0;
  if (!together) {
    const swing = pick(commands, 'attack', undefined, aimAt);
    if (swing) return aim(swing, aimAt);
  }
  const filler = pick(commands, 'ability', 'lancet', aimAt);
  if (filler) return aim(filler, aimAt);
  const swing = pick(commands, 'attack');
  return swing ? aim(swing, aimAt) : null;
};

export default biranYenke;
