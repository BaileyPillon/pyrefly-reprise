/**
 * **Earth Eater's engine guard** (FFX only; the hidden Gauntlet chapter's act 4; review fix F1 of 2026-11-10): its down-state answer is a Flare it casts at itself, which its own Reflect sends onto the party. The bytes
 * (`research/re-ffx-monster-arena-creations.md` 3.4) have no `isCounterattackAllowed` test and the sources do not say what the game does once the Reflect is gone, so the script cuts the one loop that cannot be meant: a hit
 * it deals to **itself** (the Flare that nothing bounces) joins the running total and asks for nothing. Every hit by anyone else is answered exactly as before (`gauntlet-earth-eater.test.ts` pins that).
 */
import { describe, expect, it } from 'vitest';

import { resolveAbility } from '../../../src/battle/ffx/abilities.ts';
import { peekReactions } from '../../../src/battle/ffx/ai/hooks.ts';
import { EATER_DOWN, EATER_TOTAL, earthEaterOnHit } from '../../../src/battle/ffx/ai/gauntlet-earth-eater.ts';
import { EATER_DOWN_FLAG, EATER_TOTAL_FLAG, GAUNTLET_IDS, GAUNTLET_ROWS as ROW } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import { type Fake, bossOf, fakeArena, rowOf } from '../helpers/gauntletFake.ts';
import { actor, ctxOf, flags, newEngine, nextInput } from '../helpers/gauntletDrive.ts';

const EE = GAUNTLET_IDS.earthEater;

/** A fake battle with Earth Eater lying (Armored off, down, the total at 0). */
const lying = (): Fake => {
  const f = fakeArena({ boss: EE });
  rtOf(f.ctx, EE).ai[EATER_DOWN] = 1;
  rtOf(f.ctx, EE).ai[EATER_TOTAL] = 0;
  return f;
};
const hitBy = (f: Fake, attacker: string, lastDamage: number): void => {
  const self = bossOf(f, EE);
  earthEaterOnHit(f.ctx, self, { def: {} as never, user: bossOf(f, attacker) }, { hpBefore: 1000, lostHp: true, lastDamage, affectsHp: true });
};
const queuedRows = (f: Fake): string[] => peekReactions(f.ctx).flatMap((r) => (r.kind === 'command' ? [rowOf(r.command)] : []));

describe('down: a hit it dealt to itself asks for nothing, a hit by anyone else is answered (the fake context)', () => {
  it('its own blow joins the total and queues no Flare, a party member\'s blow after it queues the one Flare', () => {
    const f = lying();
    hitBy(f, EE, 2_500);
    expect(queuedRows(f)).toEqual([]);
    expect(f.ctx.state.flags[EATER_TOTAL_FLAG]).toBe(2_500);
    hitBy(f, 'm0', 1_000);
    expect(queuedRows(f)).toEqual([ROW.flare]);
    expect(f.ctx.state.flags[EATER_TOTAL_FLAG]).toBe(3_500);
  });

  it('inside a reaction the party\'s hit is still answered (the bytes have no gate), only the self-hit is cut', () => {
    const f = fakeArena({ boss: EE, inReaction: true });
    rtOf(f.ctx, EE).ai[EATER_DOWN] = 1;
    hitBy(f, 'm1', 1_000);
    expect(queuedRows(f)).toEqual([ROW.flare]);
    const g = fakeArena({ boss: EE, inReaction: true });
    rtOf(g.ctx, EE).ai[EATER_DOWN] = 1;
    hitBy(g, EE, 1_000);
    expect(queuedRows(g)).toEqual([]);
  });
});

describe('the real engine: Yuna\'s Dispel takes the Reflect, one blow on the lying Earth Eater costs it one Flare, not a chain of 64', () => {
  it('Dispel, knock it down, one plain blow: exactly one Flare of its own, a hit on itself once, never a second answer', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const engine = newEngine(seed, 'earth-eater');
      const ctx = ctxOf(engine);
      const eater = actor(engine, EE);
      const dispel = ctx.content.ability('dispel')!;
      resolveAbility(ctx, actor(engine, 'yuna'), dispel, [EE]);
      expect((eater.statuses as Record<string, unknown>)['reflect'], `seed ${seed}: the Dispel took the Reflect`).toBeUndefined();
      rtOf(ctx, EE).ai[EATER_DOWN] = 1;
      flags(engine)[EATER_DOWN_FLAG] = true;
      eater.immunityFlags = [];
      const d = nextInput(engine);
      const swing = d.commands.find((c) => c.enabled && c.command.kind === 'attack')!;
      const mine = engine.state().log.length;
      engine.submit({ ...swing.command, targets: [EE] } as never);
      nextInput(engine);
      const events = engine.state().log.slice(mine);
      const flares = events.filter((e) => e.type === 'counter' && e.actorId === EE && e.abilityId === ROW.flare && e.cause === 'script');
      const onItself = events.filter((e) => e.type === 'damage' && e.sourceId === EE && e.targetId === EE && e.amount > 0);
      const blows = events.filter((e) => e.type === 'damage' && e.targetId === EE && e.sourceId !== EE && e.amount > 0).length;
      expect(blows, `seed ${seed}: the blow landed`).toBeGreaterThan(0);
      expect(flares.length, `seed ${seed}: one Flare per party blow`).toBeLessThanOrEqual(blows);
      expect(flares.length, `seed ${seed}`).toBeGreaterThan(0);
      expect(onItself.length, `seed ${seed}: it hit itself once per Flare, no chain`).toBeLessThanOrEqual(flares.length);
      expect(eater.hp, `seed ${seed}: nowhere near the 556,000 the chain cost`).toBeGreaterThan(eater.stats.maxHp - 200_000);
    }
  });

  it('with its Reflect on (the shipped case) nothing changes: the Flare is bounced onto the party and never onto itself', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const engine = newEngine(seed, 'earth-eater');
      const ctx = ctxOf(engine);
      const eater = actor(engine, EE);
      rtOf(ctx, EE).ai[EATER_DOWN] = 1;
      flags(engine)[EATER_DOWN_FLAG] = true;
      eater.immunityFlags = [];
      const d = nextInput(engine);
      const swing = d.commands.find((c) => c.enabled && c.command.kind === 'attack')!;
      const mine = engine.state().log.length;
      engine.submit({ ...swing.command, targets: [EE] } as never);
      nextInput(engine);
      const events = engine.state().log.slice(mine);
      expect(events.filter((e) => e.type === 'counter' && e.actorId === EE && e.abilityId === ROW.flare).length, `seed ${seed}`).toBe(1);
      expect(events.some((e) => e.type === 'damage' && e.sourceId === EE && e.targetId === EE), `seed ${seed}`).toBe(false);
    }
  });
});
