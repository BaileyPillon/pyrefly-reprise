/**
 * Release 37 slots (both games, presentation only): the Overdrive / Special key painting (`od-<abilityId>`) and
 * the boss telegraph painting (`telegraph`). Fixture paintings only: nothing here reads `public/art`. The slots
 * stay empty without art, so every case first proves the baseline (no painting: today's exact pose and wait
 * sequence), then the painted behaviour per game, REDUCE MOTION and the FFX-2 menu rule.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { ENEMY_POSES, characterUrl, resolvePoseMap } from '../../../src/engine/BattlePresenterArt.ts';
import { actionEnd, actionStart, charge, damage } from '../../../src/engine/BattlePresenterBeats.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';
import { paintedPoses } from '../../../src/engine/EnemyActionPose.ts';
import { odPoseFor } from '../../../src/engine/KeySlots.ts';
import type { BattleEvent } from '../../../src/battle/common/types.ts';

afterEach(() => resetArtManifest());

const manifest = (subjects: Record<string, { states: string[] }>) =>
  parseArtManifest({ version: 1, subjects: Object.fromEntries(Object.entries(subjects).map(([id, s]) => [id, { portrait: false, ...s }])) });

// ---------------------------------------------------------------------------------------- the pose map

describe('slots: the pose map', () => {
  it('telegraph is an enemy pose that falls back to the idle, so no painting changes nothing', async () => {
    expect(ENEMY_POSES).toContain('telegraph');
    setArtManifest(manifest({ mortiorchis: { states: ['idle', 'attack'] } }));
    const poses = await resolvePoseMap('mortiorchis', 'enemy');
    expect(poses['telegraph']).toBe(characterUrl('mortiorchis', 'idle'));
    expect([...paintedPoses('mortiorchis', poses, characterUrl)].sort()).toEqual(['attack', 'idle']);
    expect(Object.keys(poses).filter((p) => p.startsWith('od-'))).toEqual([]);
  });
  it('a painted telegraph and each od-<ability> state the manifest lists are the figure\'s own paintings', async () => {
    setArtManifest(manifest({ 'bahamut': { states: ['idle', 'telegraph', 'od-megaflare'] }, 'yuna-gunner': { states: ['idle', 'attack', 'od-trigger-happy', 'od-other'] } }));
    const boss = await resolvePoseMap('bahamut', 'enemy');
    expect(paintedPoses('bahamut', boss, characterUrl).has('telegraph')).toBe(true);
    expect(boss['od-megaflare']).toBe(characterUrl('bahamut', 'od-megaflare'));
    const girl = await resolvePoseMap('yuna-gunner', 'party');
    expect(girl[odPoseFor('trigger-happy')]).toBe(characterUrl('yuna-gunner', 'od-trigger-happy'));
    expect(paintedPoses('yuna-gunner', girl, characterUrl).has('od-other')).toBe(true);
    expect(girl['telegraph']).toBeUndefined(); // a party figure has no telegraph slot
  });
  it('an od painting never changes what any standard pose resolves to', async () => {
    const base = { states: ['idle', 'attack', 'ready', 'follow'] };
    setArtManifest(manifest({ tidus: base }));
    const without = await resolvePoseMap('tidus', 'party');
    setArtManifest(manifest({ tidus: { states: [...base.states, 'od-swordplay'] } }));
    const withOd = await resolvePoseMap('tidus', 'party');
    const { 'od-swordplay': own, ...rest } = withOd;
    expect(own).toBe(characterUrl('tidus', 'od-swordplay'));
    expect(rest).toEqual(without);
  });
});

// ----------------------------------------------------------------------------------------- the beats

interface Rig {
  ctx: EventCtx;
  calls: string[];
  waits: number[];
  menu: { open: boolean };
  game: { ffx2: boolean };
}

/**
 * A ctx around the real beats: a stage that paints `own` poses for everyone, records every `setPose`, and a
 * lunge that reaches its apex at once (so the contact beat runs without timers).
 */
function rig(o: { own: string[]; fx?: boolean; ffx2?: boolean; reduce?: boolean; menu?: boolean }): Rig {
  const calls: string[] = [];
  const waits: number[] = [];
  const menu = { open: o.menu === true };
  const game = { ffx2: o.ffx2 === true };
  const actorFor = (id: string) =>
    new Proxy(
      {
        setPose: (p: string, opts?: { immediate?: boolean }) => calls.push(`${id}:${p}${opts?.immediate ? '!' : ''}`),
        lunge: async (_d?: number, _ms?: number, contact?: { reached: () => void; hold: Promise<unknown> }) => {
          contact?.reached();
          await contact?.hold;
        },
      } as Record<string, unknown>,
      { get: (t, k: string) => (k in t ? t[k] : () => Promise.resolve()) },
    );
  const stage = {
    actor: actorFor,
    sideOf: (id: string) => (id === 'boss' ? 'enemy' : 'party'),
    paints: (_id: string, p: string) => o.own.includes(p),
    vfx: { impact: async () => undefined, screenFlash: () => undefined },
    camera: { shake: () => undefined },
    ...(o.fx === false ? {} : { fx: { enabled: () => true } }),
  };
  const moments = {
    reducedMotion: o.reduce === true,
    shots: {
      get ffx2Framing() {
        return game.ffx2;
      },
    },
    overdriveStart: async () => undefined,
    actionOpen: async () => undefined,
    actionClose: async () => undefined,
    telegraph: async () => undefined,
    impact: () => undefined,
  };
  const ctx = {
    stage,
    moments,
    deps: { actionMotion: null, abilityFacts: null, messageBar: null },
    sleep: async (ms: number) => void waits.push(ms),
    speed: () => 'normal',
    actingId: null,
    pendingArrivals: [],
    menuOpen: () => menu.open,
  } as unknown as EventCtx;
  return { ctx, calls, waits, menu, game };
}

const start = (actorId: string, abilityId: string, kind: 'overdrive' | 'ability' | 'attack' = 'overdrive'): BattleEvent =>
  ({ type: 'action-start', actorId, command: { kind, id: abilityId, targets: ['boss'] }, abilityId, abilityName: abilityId, targets: ['boss'] }) as unknown as BattleEvent;
const hit = (sourceId: string): BattleEvent =>
  ({ type: 'damage', targetId: 'boss', sourceId, amount: 900, crit: false, hitIndex: 0, hitCount: 1, affinity: 'neutral' }) as unknown as BattleEvent;

/** Play one whole move through the real beats and return what was set and how long it waited. */
async function playMove(r: Rig, actor: string, ability: string, kind: 'overdrive' | 'ability' | 'attack' = 'overdrive'): Promise<void> {
  await actionStart(r.ctx, start(actor, ability, kind) as Extract<BattleEvent, { type: 'action-start' }>);
  await damage(r.ctx, hit(actor) as Extract<BattleEvent, { type: 'damage' }>);
  await actionEnd(r.ctx);
}

const OD = odPoseFor('swordplay');

describe('slots: no painting, no change (both games)', () => {
  for (const ffx2 of [false, true]) {
    it(`${ffx2 ? 'FFX-2' : 'FFX'}: a move with no key painting plays the same poses and waits as with the look off`, async () => {
      const painted = rig({ own: ['ready', 'follow'], ffx2 });
      await playMove(painted, 'tidus', 'swordplay');
      const off = rig({ own: ['ready', 'follow'], ffx2, fx: false });
      await playMove(off, 'tidus', 'swordplay');
      expect(painted.calls).toEqual(off.calls);
      expect(painted.waits).toEqual(off.waits);
      expect(painted.calls.some((c) => c.includes('od-'))).toBe(false);
    });
  }
  it('the look off: a painting that exists is never shown, and adds no wait', async () => {
    const base = rig({ own: ['ready'], fx: false });
    await playMove(base, 'tidus', 'swordplay');
    const off = rig({ own: ['ready', OD], fx: false });
    await playMove(off, 'tidus', 'swordplay');
    expect(off.calls).toEqual(base.calls);
    expect(off.waits).toEqual(base.waits);
  });
});

describe('slots: the Overdrive key painting', () => {
  it('FFX: the held shot and the strike are on it from the action open; no wind-up, impact or follow-through over it', async () => {
    const r = rig({ own: ['ready', 'follow', OD] });
    await playMove(r, 'tidus', 'swordplay');
    expect(r.calls).toEqual([`tidus:${OD}`, 'tidus:idle']);
  });
  it('FFX: it adds no wait to the action', async () => {
    const plain = rig({ own: ['ready', 'follow'] });
    await playMove(plain, 'tidus', 'swordplay');
    const keyed = rig({ own: ['ready', 'follow', OD] });
    await playMove(keyed, 'tidus', 'swordplay');
    expect(keyed.waits.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(plain.waits.reduce((a, b) => a + b, 0));
  });
  it('FFX, REDUCE MOTION: a single cut (immediate), once', async () => {
    const r = rig({ own: [OD], reduce: true });
    await playMove(r, 'tidus', 'swordplay');
    expect(r.calls).toEqual([`tidus:${OD}!`, 'tidus:idle']);
  });
  it('FFX: another figure\'s key painting is never used for this one, and a different move keeps its own look', async () => {
    const r = rig({ own: [OD] });
    await playMove(r, 'tidus', 'other-move');
    expect(r.calls.some((c) => c.includes('od-'))).toBe(false);
  });
  it('FFX-2: the wind-up leads, the key painting goes up at the apex (the first blow) instead of the impact painting', async () => {
    const r = rig({ own: ['ready', OD], ffx2: true });
    await playMove(r, 'tidus', 'swordplay', 'attack');
    expect(r.calls).toEqual(['tidus:ready', `tidus:${OD}`, 'tidus:idle']);
  });
  it('FFX-2: a spell with no lunge gets it at the first blow, and never before', async () => {
    const r = rig({ own: [OD], ffx2: true });
    await actionStart(r.ctx, start('rikku', 'swordplay', 'ability') as Extract<BattleEvent, { type: 'action-start' }>);
    expect(r.calls.some((c) => c.includes('od-'))).toBe(false);
    await damage(r.ctx, hit('rikku') as Extract<BattleEvent, { type: 'damage' }>);
    expect(r.calls).toContain(`rikku:${OD}`);
    await damage(r.ctx, hit('rikku') as Extract<BattleEvent, { type: 'damage' }>); // a second hit does not swap again
    expect(r.calls.filter((c) => c.includes('od-')).length).toBe(1);
    await actionEnd(r.ctx);
    expect(r.calls.at(-1)).toBe('rikku:idle');
  });
  it('FFX-2: it adds no wait to the action (the gauges keep filling)', async () => {
    const plain = rig({ own: ['ready'], ffx2: true });
    await playMove(plain, 'tidus', 'swordplay', 'ability');
    const keyed = rig({ own: ['ready', OD], ffx2: true });
    await playMove(keyed, 'tidus', 'swordplay', 'ability');
    expect(keyed.waits).toEqual(plain.waits);
  });
  it('FFX-2, REDUCE MOTION: a single cut at the apex', async () => {
    const r = rig({ own: [OD], ffx2: true, reduce: true });
    await playMove(r, 'tidus', 'swordplay', 'ability');
    expect(r.calls).toEqual(['tidus:cast', `tidus:${OD}!`, 'tidus:idle']);
  });
  it('FFX-2: never while a command menu is open (at the open, or at the apex); the move plays as today', async () => {
    const base = rig({ own: ['ready', 'follow'], ffx2: true });
    await playMove(base, 'tidus', 'swordplay', 'ability');
    const openAtStart = rig({ own: ['ready', 'follow', OD], ffx2: true, menu: true });
    await playMove(openAtStart, 'tidus', 'swordplay', 'ability');
    expect(openAtStart.calls).toEqual(base.calls);
    const opensLater = rig({ own: ['ready', 'follow', OD], ffx2: true });
    await actionStart(opensLater.ctx, start('tidus', 'swordplay', 'ability') as Extract<BattleEvent, { type: 'action-start' }>);
    opensLater.menu.open = true; // a girl's menu opens while the move is in the air
    await damage(opensLater.ctx, hit('tidus') as Extract<BattleEvent, { type: 'damage' }>);
    await actionEnd(opensLater.ctx);
    expect(opensLater.calls.some((c) => c.includes('od-'))).toBe(false);
  });
  it('FFX with a menu flag set: the menu rule is FFX-2 only', async () => {
    const r = rig({ own: [OD], menu: true });
    await playMove(r, 'tidus', 'swordplay');
    expect(r.calls).toEqual([`tidus:${OD}`, 'tidus:idle']);
  });
});

const charged = (stage: 1 | 2 = 2): Extract<BattleEvent, { type: 'charge' }> =>
  ({ type: 'charge', enemyId: 'boss', name: 'Mega Flare', stage }) as unknown as Extract<BattleEvent, { type: 'charge' }>;

describe('slots: the boss telegraph painting', () => {
  it('no painting, or the look off: the beat is exactly today\'s', async () => {
    const none = rig({ own: [] });
    await charge(none.ctx, charged());
    const off = rig({ own: ['telegraph'], fx: false });
    await charge(off.ctx, charged());
    expect(none.calls).toEqual([]);
    expect(off.calls).toEqual([]);
    expect(off.waits).toEqual(none.waits);
  });
  for (const ffx2 of [false, true]) {
    it(`${ffx2 ? 'FFX-2' : 'FFX'}: the painting is up for the telegraph beat, then the boss is back to idle; no added wait`, async () => {
      const plain = rig({ own: [], ffx2 });
      await charge(plain.ctx, charged());
      const r = rig({ own: ['telegraph'], ffx2 });
      await charge(r.ctx, charged());
      expect(r.calls).toEqual(['boss:telegraph', 'boss:idle']);
      expect(r.waits).toEqual(plain.waits);
    });
  }
  it('inside the boss\'s own action the painting stays for the rest of it, and action-end puts the boss at idle', async () => {
    const r = rig({ own: ['telegraph'] });
    r.ctx.actingId = 'boss';
    await charge(r.ctx, charged(1));
    expect(r.calls).toEqual(['boss:telegraph']);
    await actionEnd(r.ctx);
    expect(r.calls).toEqual(['boss:telegraph', 'boss:idle']);
  });
  it('REDUCE MOTION: a single cut', async () => {
    const r = rig({ own: ['telegraph'], reduce: true });
    await charge(r.ctx, charged());
    expect(r.calls[0]).toBe('boss:telegraph!');
  });
  it('FFX-2: never while a command menu is open (PR-0094: Shuyin\'s telegraph can open mid-menu); FFX unaffected', async () => {
    const x2 = rig({ own: ['telegraph'], ffx2: true, menu: true });
    await charge(x2.ctx, charged());
    expect(x2.calls).toEqual([]);
    const x1 = rig({ own: ['telegraph'], menu: true });
    await charge(x1.ctx, charged());
    expect(x1.calls).toEqual(['boss:telegraph', 'boss:idle']);
  });
});
