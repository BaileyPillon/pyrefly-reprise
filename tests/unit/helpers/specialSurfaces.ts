/**
 * What the always-visible surface tests of step D2 share (FFX-2 only: the three Special dresspheres exist only in FFX-2): the names of the three plates, the names of the girls a form
 * has parked away, and a walk of the REAL engine that stops at each plate's first menu so a surface can be read at that very moment (the state is live, so the reading is made
 * inside the callback). Test plumbing only.
 */

import type { AtbSnapshot, BattleState } from '../../../src/battle/common/types.ts';
import type { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { nextInput, unit, type Input } from './specialDrive.ts';
import { FORM_GIRLS, formUp, type FormGirlId } from './specialFormState.ts';

/** The name each girl is called by (the engine's own `name`). */
export const GIRL_NAME: Record<FormGirlId, string> = { yuna: 'Yuna', rikku: 'Rikku', paine: 'Paine' };

/** The names of the three plates of each Special, in the order main, right part, left part (the engine's own names; D1 pins the same table). */
export const PLATE_NAMES: Record<FormGirlId, readonly [string, string, string]> = {
  yuna: ['Yuna', 'Right Pistil', 'Left Pistil'],
  rikku: ['Rikku', 'Smasher-R', 'Crusher-L'],
  paine: ['Paine', 'Dextral Wing', 'Sinistral Wing'],
};

/** The two girls a form has parked away. */
export const awayOf = (girl: FormGirlId): FormGirlId[] => FORM_GIRLS.map((g) => g.girl).filter((g) => g !== girl);

/** Which of the away girls' names appear (as whole words) in the given texts: `[]` is the required result. */
export function namedAway(girl: FormGirlId, ...texts: Array<string | null | undefined>): string[] {
  const text = texts.filter((t): t is string => typeof t === 'string').join('\n');
  return awayOf(girl).map((g) => GIRL_NAME[g]).filter((name) => new RegExp(`\\b${name}\\b`).test(text));
}

/** An engine at one plate's menu: the live state, the gauge snapshot and the decision. */
export interface Moment {
  engine: FFX2Engine;
  state: BattleState;
  snapshot: AtbSnapshot;
  d: Input;
}

const momentOf = (engine: FFX2Engine, d: Input): Moment => ({ engine, state: engine.state() as BattleState, snapshot: engine.gaugeSnapshot(), d });

/**
 * A girl in her Special on the real engine, played with Defend until each of her three plates has had a menu once; `each` is called at that menu (read the state THEN: the engine goes on).
 * Returns the actor ids met, in order.
 */
export function walkPlates(girl: FormGirlId, each: (m: Moment) => void, opts: { seed?: number; mastered?: boolean } = {}): string[] {
  const up = formUp(girl, { seed: opts.seed ?? 1, mastered: opts.mastered ?? false });
  const plates = [...up.state.activeIds];
  const met: string[] = [];
  for (let i = 0; i < 200 && met.length < plates.length; i++) {
    const d = nextInput(up.engine);
    if (d === null) break;
    if (plates.includes(d.actorId) && !met.includes(d.actorId)) {
      met.push(d.actorId);
      each(momentOf(up.engine, d));
    }
    up.engine.submit({ kind: 'defend', targets: [] });
  }
  return met;
}

const REVIVE = /-(all-life|revival|reboot)$/;

/**
 * A menu at which one part is down and a Revival row can raise it: both parts are left at 1 HP with no protection, the foe's own actions do the rest (a rig of the measurement, never game
 * data). Null when the girl's ladders have no revive (Full Throttle's) or the seed never produces it.
 */
export function fallenPartMenu(girl: FormGirlId, seed = 1): { moment: Moment; fallen: string[]; revive: Input['commands'][number] } | null {
  const up = formUp(girl, { seed, mastered: true });
  for (const id of FORM_GIRLS.find((g) => g.girl === girl)!.parts) {
    const u = unit(up.engine, id);
    delete u.statuses['invincible'];
    u.hp = 1;
  }
  for (let i = 0; i < 200; i++) {
    const d = nextInput(up.engine);
    if (d === null) return null;
    const s = up.engine.state() as BattleState;
    const fallen = s.activeIds.filter((id) => !s.combatants[id]!.alive);
    const revive = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && REVIVE.test((c.command as { id: string }).id) && fallen.some((f) => c.validTargets.includes(f)));
    if (revive) return { moment: momentOf(up.engine, d), fallen, revive };
    up.engine.submit({ kind: 'defend', targets: [] });
  }
  return null;
}
