/**
 * The edges of the Special form on the real FFX-2 engine (FFX-2 only; the `specialDressUp` switch is OFF in every build and ON here): who is out of the field, what the form puts on the main body
 * and takes off again, what the engine rebuilds when the form ends under a girl, how a second entry starts, and what is left when the battle ends in a form. The review of 2026-11-09 found each of
 * these missing from `ffx2-special-dress-up.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { bahamutGroup } from '../../src/data/ffx2/enemies/bahamut.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { garmentGridRegistryFrom } from '../../src/battle/ffx2/index.ts';
import { buildAutoLayer } from '../../src/battle/ffx2/adapt/auto-layer.ts';
import { ownerUnits, rewardOwnersOf } from '../../src/battle/ffx2/adapt/kill-rewards.ts';
import { SPECIAL_FORM_OWNER } from '../../src/battle/ffx2/special/enter.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import { carryPartyForward } from '../../src/app/screens/BattleScreenSetup.ts';
import type { FFX2Combatant, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import type { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { intoSpecial, logOf, nextInput, nodesOf, openSpecial, unit, walkTo, type Input } from './helpers/specialDrive.ts';

const grids = garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS));

const KO = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as never;

/** Chapter IV's party; Full Throttle is in Paine's bag as a rig (the build gives it to her in Chapter V). `yunaAccessories`: a rig that gives her accessories holding auto-abilities, so she has a layer. */
function chapterIV(yunaAccessories?: string[]): FFX2PartyBuild {
  const build = structuredClone(bevelleBuild);
  const paine = build.members[2]!;
  if (!paine.owned.includes('full-throttle')) paine.owned.push('full-throttle');
  if (yunaAccessories) build.members[0]!.accessories = yunaAccessories;
  return build;
}

const live = (engine: FFX2Engine, id: string): Ffx2Unit => unit(engine, id) as unknown as Ffx2Unit;
const sdspOf = (engine: FFX2Engine, id: string) => (live(engine, id) as unknown as { sdsp?: { returnTo?: string; parked?: string[] } }).sdsp;

/** A girl in her Special: the walk done and the Special Dress Up row picked. */
function inForm(girl: string, opts: { setup?: (engine: FFX2Engine) => void; build?: FFX2PartyBuild } = {}) {
  const engine = openSpecial({ build: opts.build ?? chapterIV(), group: bahamutGroup, seed: 1, immortal: true, ...(opts.setup ? { setup: opts.setup } : {}) });
  const walk = walkTo(engine, girl, { immortal: true });
  expect(walk.input, 'the walk reaches the offer').not.toBeNull();
  intoSpecial(engine, walk.input as Input);
  return engine;
}

/** The girl's one Change row inside the form (back to the dress she stood on), picked. */
function leave(engine: FFX2Engine, girl: string): void {
  const d = nextInput(engine) as Input;
  expect(d.actorId).toBe(girl);
  const back = d.commands.filter((c) => c.command.kind === 'spherechange');
  expect(back).toHaveLength(1);
  engine.submit(back[0]!.command);
}

/** Knock a unit out the way the engine's own rigs in these tests do (no second chance, so it is a fall). */
function fell(u: FFX2Combatant): void {
  u.hp = 0;
  u.alive = false;
  u.statuses['ko'] = KO;
}

function playUntilOver(engine: FFX2Engine): void {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
  }
  throw new Error('the battle did not end');
}

describe('a girl who is Ejected before the form', () => {
  it('is not the form\'s to park or to bring back: she is out of the field the whole time, and still Ejected for the rewards', () => {
    const eject = (engine: FFX2Engine): void => {
      const rikku = live(engine, 'rikku');
      rikku.removed = true;
      applyStatus(rikku, { status: 'eject', chance: 255, duration: 0 }, 'bahamut');
    };
    const engine = inForm('yuna', { setup: eject });
    expect(live(engine, 'rikku').removed).toBe(true);
    expect(live(engine, 'rikku').aiMemory?.['sdspParked'], 'she was not parked by the form').toBeUndefined();
    expect(live(engine, 'paine').aiMemory?.['sdspParked']).toBe(true);
    expect(sdspOf(engine, 'yuna')?.parked).toEqual(['paine']);

    leave(engine, 'yuna');
    expect(live(engine, 'rikku').removed, 'Rikku stays out of the field').toBe(true);
    expect(live(engine, 'rikku').statuses['eject']).toBeDefined();
    expect(live(engine, 'paine').removed, 'Paine, who the form parked, is back').toBe(false);
    const owners = rewardOwnersOf(ownerUnits(Object.values(engine.state().combatants) as unknown as Ffx2Unit[]));
    expect(owners[1]!.ejected, 'Rikku earns nothing: she was Ejected').toBe(true);
    expect(owners[2]!.ejected, 'Paine was out of the field, not Ejected').toBe(false);
  });
});

describe('the Auto-Life the form puts on the main body', () => {
  it('comes off when she leaves it, and the engine says so', () => {
    const engine = inForm('yuna');
    expect(live(engine, 'yuna').statuses['auto-life']?.sourceAbilityId).toBe(SPECIAL_FORM_OWNER);
    leave(engine, 'yuna');
    expect(live(engine, 'yuna').statuses['auto-life'], 'no free revive left behind').toBeUndefined();
    const removed = logOf(engine).filter((e) => e.type === 'status-remove' && e.targetId === 'yuna' && e.status === 'auto-life');
    expect(removed).toHaveLength(1);
  });

  it('comes off when the main body falls and the form ends under her', () => {
    const engine = inForm('rikku');
    const girl = live(engine, 'rikku');
    expect(girl.statuses['auto-life']?.sourceAbilityId).toBe(SPECIAL_FORM_OWNER);
    fell(girl); // a rig that leaves the Auto-Life in place, so the removal is what is read
    for (let i = 0; i < 40 && sdspOf(engine, 'rikku') !== undefined; i++) {
      const step = engine.nextDecision();
      if (step.kind === 'waiting') engine.tick(Math.max(1, step.nextEventMs));
    }
    expect(sdspOf(engine, 'rikku')).toBeUndefined();
    expect(girl.statuses['auto-life']).toBeUndefined();
  });

  it('replaces an Auto-Life she already held (the Ribbon ward sweeps it, as it does on any change into a ward of 255) and does not give it back', () => {
    const own = (engine: FFX2Engine): void => {
      expect(applyStatus(live(engine, 'paine'), { status: 'auto-life', chance: 255, duration: 0 }, 'paine', 'x2-some-accessory')).not.toBeNull();
    };
    const engine = inForm('paine', { setup: own });
    expect(live(engine, 'paine').statuses['auto-life']?.sourceAbilityId, 'her own was swept and the Auto-Life of the form is on').toBe(SPECIAL_FORM_OWNER);
    leave(engine, 'paine');
    expect(live(engine, 'paine').statuses['auto-life']).toBeUndefined();
  });

  it('never takes off an Auto-Life that has another source (one from the automatic layer, say) if that is what she holds when the form ends', () => {
    const engine = inForm('paine');
    const girl = live(engine, 'paine');
    girl.statuses['auto-life'] = { ...girl.statuses['auto-life']!, sourceAbilityId: 'auto-layer' }; // a rig: the one of the form was spent and the layer put its own on
    leave(engine, 'paine');
    expect(girl.statuses['auto-life']?.sourceAbilityId).toBe('auto-layer');
  });
});

describe('a fall ends the form and makes the girl\'s automatic statuses again', () => {
  it('her layer is the one a fresh build of the dress she is in gives, not the Special\'s', () => {
    const engine = inForm('yuna', { build: chapterIV(['regen-bangle', 'haste-bangle']) });
    const girl = live(engine, 'yuna');
    const before = [...(girl.autoLayer?.rows ?? [])];
    expect(before, 'in the form her accessories do nothing').toEqual([]);
    fell(girl);
    delete girl.statuses['auto-life'];
    for (let i = 0; i < 40 && sdspOf(engine, 'yuna') !== undefined; i++) {
      const step = engine.nextDecision();
      if (step.kind === 'waiting') engine.tick(Math.max(1, step.nextEventMs));
    }
    expect(sdspOf(engine, 'yuna')).toBeUndefined();
    const fresh = buildAutoLayer(girl, grids);
    expect(fresh, 'her old dress holds auto-abilities').not.toBeNull();
    expect(girl.autoLayer?.rows).toEqual(fresh?.rows);
    expect(girl.autoLayer?.rows.length ?? 0).toBeGreaterThan(0);
    expect(girl.autoLayer?.rows, 'the Special\'s own layer is gone').not.toEqual(before);
  });
});

describe('a second Special Dress Up', () => {
  it('starts from two new pods at full strength, however the first pair ended, and they get their turns (the engine steps a unit only if its slot order lists the object)', () => {
    const engine = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, immortal: true });
    const layout = nodesOf(engine, 'yuna');
    intoSpecial(engine, walkTo(engine, 'yuna', { immortal: true }).input as Input);
    const pods = ['floral-fallal-right-pistil', 'floral-fallal-left-pistil'];
    const first = pods.map((id) => live(engine, id));
    first[0]!.hp = 7;
    fell(first[1]!);
    leave(engine, 'yuna');
    for (const p of first) expect(p.removed, 'standing down').toBe(true);

    const again = walkTo(engine, 'yuna', { immortal: true, nodes: layout });
    expect(again.input, 'the walk starts over and reaches the offer again').not.toBeNull();
    intoSpecial(engine, again.input as Input);
    const second = pods.map((id) => live(engine, id));
    second.forEach((p, k) => {
      expect(p, 'made new in place: the slot order of the engine lists the object').toBe(first[k]);
      expect(p.hp).toBe(p.stats.maxHp);
      expect(p.atb.ticks, 'a fresh gauge').toBe(0);
      expect(p.alive && !p.removed).toBe(true);
      expect(p.aiMemory?.['sdspDormant']).toBeUndefined();
      expect(p.statuses['auto-life']).toBeDefined();
    });
    expect(engine.state().activeIds).toEqual(['yuna', ...pods]);
    expect(sdspOf(engine, 'yuna')?.parked).toEqual(['rikku', 'paine']);
    const actors = new Set<string>();
    for (let i = 0; i < 30 && actors.size < 3; i++) {
      const d = nextInput(engine) as Input;
      actors.add(d.actorId);
      engine.submit({ kind: 'defend', targets: [] });
    }
    expect([...actors].sort()).toEqual(['yuna', ...pods].sort());
  });
});

describe('the battle ends while a girl is in her Special', () => {
  it('a victory puts her back in the dress she stood on, with her pools by the ratio rule and nothing of the form carried across the seam', () => {
    const engine = inForm('yuna');
    const girl = live(engine, 'yuna');
    const returnTo = sdspOf(engine, 'yuna')!.returnTo!;
    girl.hp = Math.floor(girl.stats.maxHp / 3);
    const ratio = girl.hp / girl.stats.maxHp;
    fell(live(engine, 'bahamut'));
    playUntilOver(engine);
    expect(engine.state().result?.outcome).toBe('victory');

    expect(sdspOf(engine, 'yuna')).toBeUndefined();
    expect(girl.dresspheres!.current).toBe(returnTo);
    expect(girl.dresspheres!.special).toBeUndefined();
    expect(girl.hp / girl.stats.maxHp).toBeCloseTo(ratio, 2);
    expect(girl.statuses['auto-life']).toBeUndefined();
    expect(girl.immunities['eject']).not.toBe(255);
    expect(girl.accessories.length).toBeGreaterThan(0);
    expect(engine.state().activeIds).toEqual(['yuna', 'rikku', 'paine']);
    for (const g of ['rikku', 'paine']) expect(live(engine, g).removed).toBe(false);
    expect(live(engine, 'floral-fallal-right-pistil').removed).toBe(true);

    const carried = carryPartyForward(chapterIV(), engine.state(), true) as FFX2PartyBuild;
    const member = carried.members.find((m) => m.id === 'yuna')!;
    expect(member.statuses?.['auto-life']).toBeUndefined();
    expect(member.hp).toBe(girl.hp);
    expect(member.currentDressphere).toBe(returnTo);
  });

  it('a defeat (all three parts down) ends the form too: the girls are back in the field order and the pods are gone', () => {
    const engine = inForm('paine');
    for (const id of engine.state().activeIds) {
      const u = live(engine, id);
      delete u.statuses['auto-life'];
      fell(u);
    }
    playUntilOver(engine);
    expect(engine.state().result?.outcome).toBe('defeat');
    expect(sdspOf(engine, 'paine')).toBeUndefined();
    expect(engine.state().activeIds).toEqual(['yuna', 'rikku', 'paine']);
    expect(live(engine, 'full-throttle-right').removed).toBe(true);
    expect(live(engine, 'yuna').removed).toBe(false);
    expect(nodesOf(engine, 'paine').filter((d) => d !== null).length).toBeGreaterThan(0);
  });
});
