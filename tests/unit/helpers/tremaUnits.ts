/**
 * Chapter XIII (FFX-2) test fixtures: a real engine at either link, and an AI context over
 * its live units, so an AI script or a resolver call is run against the shipped records
 * [hard rule 3]. **FFX-2 only.**
 */

import type { BattleSetup } from '../../../src/battle/common/types.ts';
import { FFX2Engine, abilityRegistryFrom } from '../../../src/battle/ffx2/index.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { aiContextFor } from '../../../src/battle/ffx2/engineHooks.ts';
import type { AiContext, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import type { ResolveContext } from '../../../src/battle/ffx2/resolve.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import { CLOISTER_PARAGON, CLOISTER_TREMA } from '../../../src/data/ffx2/enemies/trema.ts';
import { group } from './tremaDrive.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

/** An emitted event, loosely typed for assertions. */
export type EventDraftLike = { type: string; [key: string]: unknown };

export const ABILITY_REGISTRY = abilityRegistryFrom(Object.values(data.ABILITIES));

export interface Board {
  engine: FFX2Engine;
  units: Ffx2Unit[];
  unit(id: string): Ffx2Unit;
  events: EventDraftLike[];
  ctx(selfId: string, seed?: number): AiContext;
  resolveCtx(seed?: number): ResolveContext;
}

/** A fresh engine at Paragon's (`'paragon'`) or Trema's (`'trema'`) link, Active ATB, from the preset; `groupId` fields an option's formation instead. */
export function board(link: 'paragon' | 'trema', seed = 1, groupId?: string): Board {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'active' }));
  const setup: BattleSetup = {
    game: 'ffx2', party: viaInfinitoBuild, enemies: group(groupId ?? (link === 'paragon' ? CLOISTER_PARAGON : CLOISTER_TREMA)),
    triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  const units = Object.values(engine.state().combatants) as unknown as Ffx2Unit[];
  const events: EventDraftLike[] = [];
  const emit = (e: unknown) => { events.push(e as EventDraftLike); };
  const unit = (id: string): Ffx2Unit => {
    const u = units.find((x) => x.id === id);
    if (!u) throw new Error(`no unit ${id}`);
    return u;
  };
  return {
    engine,
    units,
    unit,
    events,
    ctx: (selfId, s = seed) => aiContextFor(unit(selfId), units, new SeededRng(s), engine.state() as never, ABILITY_REGISTRY, emit),
    resolveCtx: (s = seed) => ({ units, abilities: ABILITY_REGISTRY, rng: new SeededRng(s), emit, breaksDamageLimit: () => false }),
  };
}
