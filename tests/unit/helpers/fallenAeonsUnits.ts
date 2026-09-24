/**
 * Shared unit fixtures for the Chapter XI (fallen aeons, FFX-2) test files:
 * the shipped ability table, a resolve context, a party at set HP and MP, and
 * the three Sisters on their shared script. **FFX-2 only.** Test-only.
 */

import type { AbilityDef } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { abilityRegistryFrom } from '../../../src/battle/ffx2/index.ts';
import type { ResolveContext } from '../../../src/battle/ffx2/resolve.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import type { AiContext, EventDraft, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { sandy } from '../../../src/data/ffx2/enemies/magus-sisters.ts';

export const REGISTRY = abilityRegistryFrom(Object.values(data.ABILITIES));

export function ability(id: string): AbilityDef {
  const found = REGISTRY.get(id);
  if (!found) throw new Error(`${id} missing from the shipped ability table`);
  return found;
}

export function ctxFor(units: Ffx2Unit[], seed = 1): { ctx: ResolveContext; events: EventDraft[] } {
  const events: EventDraft[] = [];
  return {
    ctx: { units, abilities: REGISTRY, rng: new SeededRng(seed), emit: (e) => events.push(e), breaksDamageLimit: () => false },
    events,
  };
}

export function girlsAt(hp: number, mp: number): Ffx2Unit[] {
  return ['yuna', 'rikku', 'paine'].map((id, i) => {
    const u = aiUnit(id, 'party', 5000, i);
    u.hp = hp;
    u.mp = mp;
    return u;
  });
}

/** A context for one sister, sharing units, rng and flags with the others. */
export function sisterCtx(base: AiContext, self: Ffx2Unit): AiContext {
  return { ...base, self };
}

export function sisterUnits(): { sandy: Ffx2Unit; cindy: Ffx2Unit; mindy: Ffx2Unit } {
  const s = aiUnit('sandy', 'enemy', 10330, 0);
  const c = aiUnit('cindy', 'enemy', 12240, 1);
  const m = aiUnit('mindy', 'enemy', 9788, 2);
  for (const u of [s, c, m]) u.enemy = { aiScriptId: 'magus-sisters', formIndex: 0, forms: [], rewards: sandy.rewards };
  return { sandy: s, cindy: c, mindy: m };
}
