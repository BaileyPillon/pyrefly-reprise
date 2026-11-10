/**
 * Who is in a Special right now, which ids are its parts, and whether the main body fell inside it (FFX-2 only: the three Special dresspheres exist only
 * in FFX-2; the tracker is pure, has no port and no clock, and nothing calls it while the switch `specialDressUp` is OFF).
 *
 * It is fed the engine's events one at a time by the presenter (step C2) and answers the beat an event starts: `'enter'` on a `spherechange` that carries `special`,
 * `'exit'` or `'fall'` on the `spherechange` that takes her out. The fall is known from the STREAM, never from an `alive` flag read at the end of a burst, because a
 * burst can hold a later blow that knocks her out in her old dress: `ko{main}` sets `fell`, a `revive` of the main (Auto-Life brings her back) clears it, and the
 * `spherechange` out reads it.
 *
 * Order of the three ids: `[main, right part, left part]`. `FORMS[special].pods[0]` is the RIGHT part and `pods[1]` the LEFT (the engine types them `podLeft` and `podRight`
 * the other way round, `special/enter.ts`; the tracker never reads those names). `victory` and `defeat` change nothing: the engine ends a form silently at the battle's end
 * (`settleForms(..., atEnd)`) and emits no event, so a defeat with every part down starts no beat.
 */

import type { BattleEvent, BattleState, CombatantId } from '../battle/common/types.ts';
import { FORMS, isSpecialDress, type SpecialId } from '../battle/ffx2/special/forms.ts';

export { SPECIAL_ART_IDS, isSpecialArtId } from './SpecialArtIds.ts';

export type FormRole = 'main' | 'right' | 'left';
/** The beat an event starts: a Special entered, left by choice, or left because the main body fell with a part still standing; `null` for every other event. */
export type FormBeat = 'enter' | 'exit' | 'fall' | null;

export interface FormState {
  readonly girl: CombatantId;
  readonly special: SpecialId;
  /** main, right part, left part. */
  readonly ids: readonly [CombatantId, CombatantId, CombatantId];
  /** The other two girls, off the field while the form is up. */
  readonly parked: readonly CombatantId[];
  /** The main body was knocked out inside the form and has not been revived. */
  fell: boolean;
}

export interface FormTracker {
  /** Feed one event. `state` (the engine's state at the end of the burst) names the parked girls; absent, they are the girls who are not `event.who`. */
  see(e: BattleEvent, state?: BattleState | null): FormBeat;
  /** The form a girl is in, or `undefined`. */
  form(girl: CombatantId): FormState | undefined;
  /** The form a combatant id belongs to (main, right part or left part) and its role there. */
  of(id: CombatantId): { form: FormState; role: FormRole } | undefined;
  /** True for the right and left parts only, never the main. */
  isPart(id: CombatantId): boolean;
  /** Forget everything (a new link of a chain). */
  reset(): void;
}

const GIRLS: readonly string[] = ['yuna', 'rikku', 'paine'];

/** The art subject a Special is drawn from: `yuna-floral-fallal`. */
export const specialArtId = (girl: string, special: SpecialId): string => `${girl}-${special}`;
/** The first-time id the coach state remembers for a girl's Special: `special-yuna-floral-fallal`. */
export const specialSeenId = (girl: string, special: SpecialId): string => `special-${girl}-${special}`;

/** The girls the engine parked (`aiMemory.sdspParked`). `aiMemory` is on the engine's unit, not on the contract union, hence the cast. */
function parkedIn(state: BattleState, who: CombatantId): CombatantId[] {
  const out: CombatantId[] = [];
  for (const id of Object.keys(state.combatants)) {
    const memory = (state.combatants[id] as { aiMemory?: Record<string, unknown> } | undefined)?.aiMemory;
    if (id !== who && memory?.['sdspParked'] === true) out.push(id);
  }
  return out;
}

export function createFormTracker(): FormTracker {
  const forms = new Map<CombatantId, FormState>();
  const owner = new Map<CombatantId, { form: FormState; role: FormRole }>();

  const drop = (girl: CombatantId): void => {
    const form = forms.get(girl);
    if (!form) return;
    forms.delete(girl);
    for (const id of form.ids) owner.delete(id);
  };

  const create = (who: CombatantId, special: SpecialId, state: BattleState | null | undefined): void => {
    drop(who);
    const def = FORMS[special];
    const ids = [who, def.pods[0].id, def.pods[1].id] as const;
    const form: FormState = { girl: who, special, ids, parked: state ? parkedIn(state, who) : GIRLS.filter((g) => g !== who), fell: false };
    forms.set(who, form);
    owner.set(ids[0], { form, role: 'main' });
    owner.set(ids[1], { form, role: 'right' });
    owner.set(ids[2], { form, role: 'left' });
  };

  return {
    see(e, state) {
      switch (e.type) {
        case 'spherechange': {
          if (e.special !== undefined) {
            create(e.who, e.special, state);
            return 'enter';
          }
          if (!isSpecialDress(e.from)) return null; // an ordinary change
          const fell = forms.get(e.who)?.fell === true;
          drop(e.who);
          return fell ? 'fall' : 'exit'; // no known form reads as an exit
        }
        case 'ko': {
          const hit = owner.get(e.targetId);
          if (hit?.role === 'main') hit.form.fell = true;
          return null;
        }
        case 'revive': {
          const hit = owner.get(e.targetId);
          if (hit?.role === 'main') hit.form.fell = false;
          return null;
        }
        default:
          return null;
      }
    },
    form: (girl) => forms.get(girl),
    of: (id) => owner.get(id),
    isPart: (id) => {
      const role = owner.get(id)?.role;
      return role === 'right' || role === 'left';
    },
    reset() {
      forms.clear();
      owner.clear();
    },
  };
}
