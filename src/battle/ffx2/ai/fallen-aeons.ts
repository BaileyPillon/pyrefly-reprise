/**
 * Shiva and Anima on the Road to the Farplane (Chapter XI), and the action
 * counter (AC) every fallen aeon shares. **FFX-2 only** [AGENTS.md rule 14].
 *
 * "Action Count" is the FFX-2 aeons' hidden counter: it rises on the boss's own
 * actions and when it is attacked, and fires the aeon's Overdrive at 100
 * [ffx2-fallen-aeons §4, `[verified: 2 sources]`]. It is **not** FFX's Overdrive
 * gauge, and it has no HUD (hidden in the game; plan §4.2 "Not needed").
 *
 * **What "attacked" means (FA8, a sourced `[conflict]`).** The wiki words the
 * trigger three ways: Cindy and Mindy "targeted by a character"; Sandy and
 * Anima "receives damage"; Shiva "receiving an attack" (plan Review R1). Bailey
 * took the plan's recommendation, **a: every hostile action aimed at her, hit or
 * miss** (`engineHooks.ts#notifyEnemiesTargeted`), labelled `[conflict]`. The
 * other reading, landed damage only, stays one flag away for the bench:
 * `state.flags.fallenAeonsAcTrigger = 'damaged'`.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';

/** AI memory key for the action counter. */
export const AC = 'ac';
/** The Overdrive threshold, every aeon [§4]. */
export const AC_OVERDRIVE = 100;

/** The flag the bench flips to measure FA8 b. */
export const AC_TRIGGER_FLAG = 'fallenAeonsAcTrigger';

export function acOf(unit: Ffx2Unit): number {
  return mem(unit, AC);
}

export function bumpAc(unit: Ffx2Unit, by: number): void {
  setMem(unit, AC, mem(unit, AC) + by);
}

function readsDamaged(ctx: AiContext): boolean {
  return ctx.flags[AC_TRIGGER_FLAG] === 'damaged';
}

/** "+5 when attacked", under whichever FA8 reading is in force. */
export function attackedHooks(by: number): Pick<AiScript, 'onTargeted' | 'onDamaged'> {
  return {
    onTargeted(ctx) {
      if (!readsDamaged(ctx)) bumpAc(ctx.self, by);
    },
    onDamaged(ctx, _source, amount) {
      if (readsDamaged(ctx) && amount > 0) bumpAc(ctx.self, by);
    },
  };
}

/** A random living party member, or nobody. */
export function randomGirl(ctx: AiContext): string[] {
  const party = ctx.party();
  return party.length > 0 ? [ctx.rng.pick(party).id] : [];
}

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/**
 * Shiva [§4.1, `[verified: 2 sources — SinirothX, wiki AI dump, identical]`]:
 *
 * ```
 * AC 0–64:   1/2 Normal Attack, 1/4 Blizzaga, 1/4 Heavenly Strike
 * AC 65–99:  1/2 Blizzaga, 1/4 Triple Attack, 1/4 Heavenly Strike
 * AC >= 100: AC = 0, Diamond Dust
 * AC += 3 when she uses any attack except Diamond Dust; AC += 5 when she is attacked
 * ```
 */
export const x2ShivaScript: AiScript = {
  id: 'x2-shiva',
  decide(ctx) {
    const self = ctx.self;
    if (acOf(self) >= AC_OVERDRIVE) {
      setMem(self, AC, 0);
      return use('x2-shiva-diamond-dust', []);
    }
    const roll = ctx.rng.int(0, 3); // quarters
    let id: string;
    if (acOf(self) < 65) {
      id = roll <= 1 ? 'x2-shiva-kick' : roll === 2 ? 'x2-shiva-blizzaga' : 'x2-shiva-heavenly-strike';
    } else {
      id = roll <= 1 ? 'x2-shiva-blizzaga' : roll === 2 ? 'x2-shiva-triple-attack' : 'x2-shiva-heavenly-strike';
    }
    bumpAc(self, 3);
    return use(id, id === 'x2-shiva-triple-attack' ? [] : randomGirl(ctx));
  },
  ...attackedHooks(5),
};

/**
 * Anima [§4.3, `[verified: 2 sources — SinirothX, wiki AI dump]`]:
 *
 * ```
 * 4/5 Normal Attack (random target), 1/5 Pain (random target)
 * AC += 5 when she attacks or is attacked
 * AC >= 100: AC = 0, Oblivion
 * ```
 *
 * Oblivion itself adds nothing: it resets the counter, as Diamond Dust does for
 * Shiva. The sources do not say either way; `[estimate]`.
 */
export const x2AnimaScript: AiScript = {
  id: 'x2-anima',
  decide(ctx) {
    const self = ctx.self;
    if (acOf(self) >= AC_OVERDRIVE) {
      setMem(self, AC, 0);
      return use('x2-anima-oblivion', []);
    }
    const id = ctx.rng.int(0, 4) < 4 ? 'x2-anima-stare' : 'x2-anima-pain';
    bumpAc(self, 5);
    return use(id, randomGirl(ctx));
  },
  ...attackedHooks(5),
};
