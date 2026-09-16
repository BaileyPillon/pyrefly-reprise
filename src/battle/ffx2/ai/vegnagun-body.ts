/**
 * Vegnagun — Body / Core plus the two Bulwarks (battle 3)
 * [ffx2-vegnagun-shuyin §4.1, §3.3, §5.3].
 *
 * The Core is a three-turn charge into Memento Mori, and **killing a Bulwark
 * buys a turn** — the Core spends that turn reviving instead of charging. That
 * is the intended counterplay and it is not obvious from the scan text.
 *
 * The Bulwarks are the fight's whole identity: the Core keeps a one-slot attack
 * log, and the Bulwarks **answer in kind**. Hit it with a Protect-reducible
 * attack and you get the AoE "Physical attack detected"; with a
 * Shell-reducible one, "Magical attack detected"; with anything else (Darkness,
 * Charon, fixed or fractional player abilities) you get the single-target
 * buff-strip instead.
 *
 * Regression test to protect [§3, §1.2]: Memento Mori at ~1,000–1,130
 * party-wide is correct. ~1,440–1,630 means someone "fixed" the Core's
 * SinirothX Mag 42 / Def 98 against the wiki's transposed Mag 98 / Def 42.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { CORE_CHARGES_BEFORE_MEMENTO } from '../constants.ts';

const BULWARK_R = 'bulwark-r';
const BULWARK_L = 'bulwark-l';

/** The Core's one-slot attack log, parked on the shared encounter flags. */
const LOG_WHO = 'coreLogWho';
const LOG_CLASS = 'coreLogClass';

/** How a player ability is answered. §3.3 */
export type MitigationClass = 'protect-reducible' | 'shell-reducible' | 'none';

export function classifyAttack(damageType: string): MitigationClass {
  if (damageType === 'physical') return 'protect-reducible';
  if (damageType === 'magical') return 'shell-reducible';
  return 'none';
}

function findUnit(ctx: AiContext, id: string): Ffx2Unit | undefined {
  return ctx.units.find((u) => u.id === id);
}

export const vegnagunBodyScript: AiScript = {
  id: 'vegnagun-body',

  decide(ctx: AiContext): Command | null {
    const self = ctx.self;
    const charges = mem(self, 'actionCount');

    if (charges >= CORE_CHARGES_BEFORE_MEMENTO) {
      setMem(self, 'actionCount', 0);
      ctx.emit({ type: 'charge', enemyId: self.id, name: 'Memento Mori', turnsLeft: 0, stage: 2 });
      return { kind: 'ability', id: 'memento-mori', targets: [] };
    }

    // A downed Bulwark costs the Core its charge turn. §4.1
    const right = findUnit(ctx, BULWARK_R);
    const left = findUnit(ctx, BULWARK_L);
    if (right && !right.alive) return { kind: 'ability', id: 'full-life', targets: [right.id] };
    if (left && !left.alive) return { kind: 'ability', id: 'full-life', targets: [left.id] };

    setMem(self, 'actionCount', charges + 1);
    const turnsLeft = CORE_CHARGES_BEFORE_MEMENTO - (charges + 1);
    ctx.emit({
      type: 'charge',
      enemyId: self.id,
      name: 'Charge Core',
      turnsLeft,
      stage: turnsLeft <= 1 ? 2 : 1,
    });
    return { kind: 'ability', id: 'charge-core', targets: [] };
  },

  /** Every hit on the Core is logged for the Bulwarks to answer. §3.3 */
  onDamaged(ctx: AiContext, sourceId): void {
    if (!sourceId) return;
    ctx.flags[LOG_WHO] = sourceId;
    const last = ctx.flags['lastAttackClass'];
    ctx.flags[LOG_CLASS] = typeof last === 'string' ? last : 'none';
  },
};

/** Right Bulwark idles on buffs, Left on debuffs. §3.3 */
function idleAction(ctx: AiContext, isRight: boolean): Command | null {
  const core = findUnit(ctx, 'vegnagun-body');
  if (isRight) {
    const id = ctx.rng.pick(['node-regen', 'node-shell', 'node-protect']);
    return { kind: 'ability', id, targets: core ? [core.id] : [] };
  }
  const id = ctx.rng.pick(['leg-break', 'bulwark-bio', 'bulwark-doom', 'dispel']);
  const party = ctx.party();
  if (party.length === 0) return null;
  const single = id === 'bulwark-doom' || id === 'dispel';
  return { kind: 'ability', id, targets: single ? [ctx.rng.pick(party).id] : [] };
}

function bulwarkScript(id: string, isRight: boolean): AiScript {
  return {
    id,
    decide(ctx: AiContext): Command | null {
      const who = ctx.flags[LOG_WHO];
      const cls = ctx.flags[LOG_CLASS];
      if (typeof who !== 'string') return idleAction(ctx, isRight);

      // Copying the log to both Bulwarks clears it, so one strike is answered
      // once even though both arms read the same slot. §3.3
      delete ctx.flags[LOG_WHO];
      delete ctx.flags[LOG_CLASS];

      const attacker = ctx.party().find((p) => p.id === who);
      if (!attacker) return idleAction(ctx, isRight);

      if (cls === 'shell-reducible') {
        return { kind: 'ability', id: 'magical-attack-detected', targets: [attacker.id] };
      }
      if (cls === 'protect-reducible') {
        return { kind: 'ability', id: 'physical-attack-detected', targets: [attacker.id] };
      }
      return { kind: 'ability', id: 'hostile-activity-detected', targets: [attacker.id] };
    },
  };
}

export const vegnagunBulwarkRightScript = bulwarkScript('vegnagun-bulwark-r', true);
export const vegnagunBulwarkLeftScript = bulwarkScript('vegnagun-bulwark-l', false);

/** The data file ships one shared `aiScriptId`; slot decides which arm it is. */
export const vegnagunBulwarkScript: AiScript = {
  id: 'vegnagun-bulwark',
  decide(ctx: AiContext): Command | null {
    const isRight = ctx.self.id === BULWARK_R || ctx.self.slot % 2 === 1;
    return (isRight ? vegnagunBulwarkRightScript : vegnagunBulwarkLeftScript).decide(ctx);
  },
};
