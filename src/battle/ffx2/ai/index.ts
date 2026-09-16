/**
 * AI script registry, keyed by `EnemyFields.aiScriptId`.
 *
 * The ids are the ones the FFX-2 data files already ship
 * (`src/data/ffx2/enemies/*.ts`): `ffx2-bahamut`, `vegnagun-tail`,
 * `vegnagun-leg`, `vegnagun-node`, `vegnagun-body`, `vegnagun-bulwark`,
 * `vegnagun-head`, `vegnagun-redoubt`, `shuyin`.
 *
 * An enemy whose script id is unknown falls back to `idleScript`, which spends
 * its turn doing nothing rather than throwing — a half-transcribed data file
 * should degrade into a boring fight, not a crash.
 */

import type { AiScript } from '../internal.ts';
import { bahamutScript } from './bahamut.ts';
import { shuyinScript } from './shuyin.ts';
import { vegnagunLegScript, vegnagunNodeScript, vegnagunTailScript } from './vegnagun.ts';
import { vegnagunBodyScript, vegnagunBulwarkScript } from './vegnagun-body.ts';
import { vegnagunHeadScript, vegnagunRedoubtScript } from './vegnagun-head.ts';

/** Spends the turn and does nothing. */
export const idleScript: AiScript = {
  id: 'idle',
  decide: () => null,
};

/** Attacks a random living opponent every turn. Useful for data-file stubs. */
export const basicAttackScript: AiScript = {
  id: 'basic-attack',
  decide(ctx) {
    const party = ctx.party();
    if (party.length === 0) return null;
    return { kind: 'ability', id: 'attack', targets: [ctx.rng.pick(party).id] };
  },
};

const SCRIPTS: readonly AiScript[] = [
  bahamutScript,
  vegnagunTailScript,
  vegnagunLegScript,
  vegnagunNodeScript,
  vegnagunBodyScript,
  vegnagunBulwarkScript,
  vegnagunHeadScript,
  vegnagunRedoubtScript,
  shuyinScript,
  idleScript,
  basicAttackScript,
];

const BY_ID = new Map<string, AiScript>(SCRIPTS.map((s) => [s.id, s]));

/** Look up a script, falling back to `idleScript`. */
export function aiScriptFor(id: string | undefined): AiScript {
  if (!id) return idleScript;
  return BY_ID.get(id) ?? idleScript;
}

/** Register or override a script — for data agents and tests. */
export function registerAiScript(script: AiScript): void {
  BY_ID.set(script.id, script);
}

/** Every registered id, for the debug API. */
export function aiScriptIds(): string[] {
  return [...BY_ID.keys()];
}

export {
  bahamutScript,
  shuyinScript,
  vegnagunBodyScript,
  vegnagunBulwarkScript,
  vegnagunHeadScript,
  vegnagunLegScript,
  vegnagunNodeScript,
  vegnagunRedoubtScript,
  vegnagunTailScript,
};
