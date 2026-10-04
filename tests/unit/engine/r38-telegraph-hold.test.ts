/**
 * Release 38 keys (FFX only, presentation only): the boss telegraph HOLD for Seymour Flux's Lance of Atrophy and
 * Braska's Final Aeon's Ultimate Jecht Shot (D-355), and the Overdrive key FAMILY alias (`odFamilyOf`, D-357:
 * Lulu's Fury). Fixture paintings only: nothing here reads `public/art`. Every painted case is compared with the
 * same move played with no painting, so what the hold adds is read off exactly (a prefix, nothing else changes).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { resetArtManifest } from '../../../src/engine/ArtManifest.ts';
import { actionEnd, actionStart, damage } from '../../../src/engine/BattlePresenterBeats.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';
import { odFamilyOf, odPoseFor } from '../../../src/engine/KeySlots.ts';
import { TELEGRAPH_HOLD_MS, holdsTelegraph } from '../../../src/engine/TelegraphHold.ts';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { ABILITIES as FFX_ABILITIES } from '../../../src/data/ffx/index.ts';
import { ABILITIES as FFX2_ABILITIES } from '../../../src/data/ffx2/index.ts';
import { FF7_ABILITIES } from '../../../src/data/ff7/abilities.ts';

afterEach(() => resetArtManifest());

// ---------------------------------------------------------------------------------------------- a rig

interface Rig {
  ctx: EventCtx;
  /** Every pose swap, glow, telegraph moment, wait and shot opening, in the order the beats asked for them. */
  order: string[];
  waits: number[];
}

/**
 * A ctx around the real beats: a stage that paints `own` poses for the enemy ids, records every `setPose`
 * (`!` = immediate) and `flash`, and a moments port that records `telegraph` and `actionOpen`.
 */
function rig(o: { own: string[]; fx?: boolean; ffx2?: boolean; reduce?: boolean; speed?: 'normal' | 'fast' | 'skip'; ff7?: boolean; enemies?: string[] }): Rig {
  const order: string[] = [];
  const waits: number[] = [];
  const enemies = new Set(o.enemies ?? ['seymour-flux', 'braskas-final-aeon', 'mortiorchis', 'seymour-omnis']);
  const actorFor = (id: string) =>
    new Proxy(
      {
        setPose: (p: string, opts?: { immediate?: boolean }) => order.push(`pose:${id}:${p}${opts?.immediate ? '!' : ''}`),
        flash: (color: number) => order.push(`flash:${id}:${color.toString(16)}`),
        // a lunge reaches its apex at once, so the contact beat runs without timers
        lunge: async (_d?: number, _ms?: number, contact?: { reached: () => void; hold: Promise<unknown> }) => {
          contact?.reached();
          await contact?.hold;
        },
      } as Record<string, unknown>,
      { get: (t, k: string) => (k in t ? t[k] : () => Promise.resolve()) },
    );
  const stage = {
    actor: actorFor,
    sideOf: (id: string) => (enemies.has(id) ? 'enemy' : 'party'),
    paints: (id: string, p: string) => enemies.has(id) && o.own.includes(p),
    vfx: { impact: async () => undefined, screenFlash: () => undefined },
    camera: { shake: () => undefined },
    ...(o.fx === false ? {} : { fx: { enabled: () => true } }),
  };
  const moments = {
    reducedMotion: o.reduce === true,
    shots: { ffx2Framing: o.ffx2 === true },
    overdriveStart: async () => undefined,
    actionOpen: async () => void order.push('actionOpen'),
    actionClose: async () => undefined,
    telegraph: async (id: string, stage: number, name: string) => void order.push(`telegraph:${id}:${stage}:${name}`),
    telegraphEnd: async () => void order.push('telegraphEnd'),
    impact: () => undefined,
  };
  const ctx = {
    stage,
    moments,
    deps: { actionMotion: o.ff7 ? { open: async () => undefined, close: async () => undefined } : null, abilityFacts: null, messageBar: null },
    sleep: async (ms: number) => {
      waits.push(ms);
      order.push(`sleep:${ms}`);
    },
    speed: () => o.speed ?? 'normal',
    actingId: null,
    pendingArrivals: [],
    menuOpen: () => false,
  } as unknown as EventCtx;
  return { ctx, order, waits };
}

const start = (actorId: string, abilityId: string, name: string, targets: string[] = ['tidus']): Extract<BattleEvent, { type: 'action-start' }> =>
  ({ type: 'action-start', actorId, command: { kind: 'ability', id: abilityId, targets }, abilityId, abilityName: name, targets }) as unknown as Extract<BattleEvent, { type: 'action-start' }>;
const hit = (sourceId: string, targetId = 'tidus'): Extract<BattleEvent, { type: 'damage' }> =>
  ({ type: 'damage', targetId, sourceId, amount: 900, crit: false, hitIndex: 0, hitCount: 1, affinity: 'neutral' }) as unknown as Extract<BattleEvent, { type: 'damage' }>;

/** One whole move through the real beats. */
async function playMove(r: Rig, actor: string, ability: string, name: string): Promise<void> {
  await actionStart(r.ctx, start(actor, ability, name));
  await damage(r.ctx, hit(actor));
  await actionEnd(r.ctx);
}

const FLUX = ['seymour-flux', 'lance-of-atrophy', 'Lance of Atrophy'] as const;
const BFA = ['braskas-final-aeon', 'ultimate-jecht-shot', 'Ultimate Jecht Shot'] as const;
const GLOW = 'flash:%:ffc46b';
const hold = (id: string, name: string, reduce = false): string[] =>
  reduce
    ? [`pose:${id}:telegraph!`, `sleep:${TELEGRAPH_HOLD_MS}`]
    : [`pose:${id}:telegraph`, GLOW.replace('%', id), `telegraph:${id}:1:${name}`, `sleep:${TELEGRAPH_HOLD_MS}`, 'telegraphEnd'];

// ---------------------------------------------------------------------------------------------- the table

describe('telegraph hold: the table names two moves and nothing else', () => {
  it('Seymour Flux holds Lance of Atrophy, Braska\'s Final Aeon holds Ultimate Jecht Shot', () => {
    expect(holdsTelegraph('seymour-flux', 'lance-of-atrophy')).toBe(true);
    expect(holdsTelegraph('braskas-final-aeon', 'ultimate-jecht-shot')).toBe(true);
    expect(TELEGRAPH_HOLD_MS).toBe(950);
  });
  it('no other move of those bosses, no other boss, no stray key', () => {
    for (const [boss, ability] of [
      ['seymour-flux', 'cross-cleave'], ['seymour-flux', 'total-annihilation'], ['seymour-flux', 'flare-self'], ['seymour-flux', 'attack'],
      ['braskas-final-aeon', 'jecht-beam'], ['braskas-final-aeon', 'triumphant-grasp-2'], ['braskas-final-aeon', 'jecht-bomber'],
      ['mortiorchis', 'lance-of-atrophy'], ['seymour-omnis', 'ultimate-jecht-shot'], ['seymour-omnis', 'lance-of-atrophy'],
      ['yunalesca', 'mega-death'], ['evrae', 'photon-spray'], ['ffx2-trema', 'trema-meteor'],
      ['constructor', 'lance-of-atrophy'], ['__proto__', 'x'], ['toString', 'toString'],
    ] as const) expect(holdsTelegraph(boss, ability)).toBe(false);
    expect(holdsTelegraph('seymour-flux', undefined)).toBe(false);
  });
});

// -------------------------------------------------------------------------------- no painting, no change

describe('telegraph hold: no painting, the look off, or a move off the table is today\'s move exactly', () => {
  for (const [boss, ability, name] of [FLUX, BFA]) {
    it(`${boss}: no telegraph painting plays the same swaps and waits as a build without the hold`, async () => {
      const none = rig({ own: [] });
      await playMove(none, boss, ability, name);
      expect(none.order.some((e) => e.includes('telegraph'))).toBe(false);
      expect(none.waits).not.toContain(TELEGRAPH_HOLD_MS);
      // The same ability by a boss with a painting but off the table: also exactly the no-painting play.
      const offTable = rig({ own: ['telegraph'] });
      await playMove(offTable, 'mortiorchis', ability, name);
      const offNone = rig({ own: [] });
      await playMove(offNone, 'mortiorchis', ability, name);
      expect(offTable.order).toEqual(offNone.order);
    });
    it(`${boss}: BATTLE SPECTACLE off, a painting that exists is never shown and adds no wait`, async () => {
      const base = rig({ own: [], fx: false });
      await playMove(base, boss, ability, name);
      const off = rig({ own: ['telegraph'], fx: false });
      await playMove(off, boss, ability, name);
      expect(off.order).toEqual(base.order);
    });
    it(`${boss}: playback speed skip holds nothing`, async () => {
      const base = rig({ own: [], speed: 'skip' });
      await playMove(base, boss, ability, name);
      const skip = rig({ own: ['telegraph'], speed: 'skip' });
      await playMove(skip, boss, ability, name);
      expect(skip.order).toEqual(base.order);
    });
  }
  it('an off-table move of a boss that has the painting plays as before (Seymour\'s Cross Cleave, Braska\'s Jecht Beam)', async () => {
    for (const [boss, ability, name] of [['seymour-flux', 'cross-cleave', 'Cross Cleave'], ['braskas-final-aeon', 'jecht-beam', 'Jecht Beam']] as const) {
      const base = rig({ own: [] });
      await playMove(base, boss, ability, name);
      const painted = rig({ own: ['telegraph'] });
      await playMove(painted, boss, ability, name);
      expect(painted.order).toEqual(base.order);
    }
  });
});

// --------------------------------------------------------------------------------------- the painted hold

describe('telegraph hold: the painting is up for 950 ms before the strike, and only that is added', () => {
  for (const [boss, ability, name] of [FLUX, BFA]) {
    it(`${boss}: the telegraph painting, the glow and the zoom first, then one 950 ms wait, the zoom closed, then the move exactly as before`, async () => {
      const base = rig({ own: [] });
      await playMove(base, boss, ability, name);
      const r = rig({ own: ['telegraph'] });
      await playMove(r, boss, ability, name);
      expect(r.order.slice(0, 5)).toEqual(hold(boss, name));
      expect(r.order.slice(5)).toEqual(base.order); // a pure prefix: the move itself is untouched
      expect(r.waits[0]).toBe(TELEGRAPH_HOLD_MS);
      expect(r.waits.slice(1)).toEqual(base.waits);
    });
    it(`${boss}: the painting is replaced by the move's own pose at the strike, and the boss ends at idle`, async () => {
      const r = rig({ own: ['telegraph'] });
      await playMove(r, boss, ability, name);
      const poses = r.order.filter((e) => e.startsWith(`pose:${boss}:`));
      expect(poses).toEqual([`pose:${boss}:telegraph`, `pose:${boss}:cast`, `pose:${boss}:idle`]);
      expect(r.order.indexOf('actionOpen')).toBeGreaterThan(r.order.indexOf(`sleep:${TELEGRAPH_HOLD_MS}`)); // the shot opens after the hold
      // The zoom and the heartbeat end with the hold, not with the move: left open, `actionClose` would wait on their camera
      // release (measured 0.74 s) and the hold would cost twice its length.
      expect(r.order.indexOf('telegraphEnd')).toBeGreaterThan(r.order.indexOf(`sleep:${TELEGRAPH_HOLD_MS}`));
      expect(r.order.indexOf('telegraphEnd')).toBeLessThan(r.order.indexOf('actionOpen'));
      expect(r.order.filter((e) => e === 'telegraphEnd').length).toBe(1);
    });
    it(`${boss}, REDUCE MOTION: the same pause as a single cut, no glow, no zoom`, async () => {
      const base = rig({ own: [], reduce: true });
      await playMove(base, boss, ability, name);
      const r = rig({ own: ['telegraph'], reduce: true });
      await playMove(r, boss, ability, name);
      expect(r.order.slice(0, 2)).toEqual(hold(boss, name, true));
      expect(r.order.slice(2)).toEqual(base.order);
      expect(r.order.some((e) => e.startsWith('telegraph:') || e === 'telegraphEnd' || e.startsWith(`flash:${boss}:ffc46b`))).toBe(false);
      // REDUCE MOTION never changes how long a beat waits: the same 950 ms as without it.
      const normal = rig({ own: ['telegraph'] });
      await playMove(normal, boss, ability, name);
      expect(r.waits[0]).toBe(normal.waits[0]);
    });
    it(`${boss}: FFX only (an FFX-2 battle's framing or FF7's runner holds nothing), and only for an enemy`, async () => {
      for (const o of [{ ffx2: true }, { ff7: true }]) {
        const base = rig({ own: [], ...o });
        await playMove(base, boss, ability, name);
        const painted = rig({ own: ['telegraph'], ...o });
        await playMove(painted, boss, ability, name);
        expect(painted.order).toEqual(base.order);
      }
      const asParty = rig({ own: ['telegraph'], enemies: [] }); // the same id as a party member: no hold
      await playMove(asParty, boss, ability, name);
      expect(asParty.order.some((e) => e.startsWith(`pose:${boss}:telegraph`))).toBe(false);
    });
  }
  it('fast playback scales the wait (the rig records the authored ms; the presenter\'s sleep applies the speed)', async () => {
    const r = rig({ own: ['telegraph'], speed: 'fast' });
    await playMove(r, ...FLUX);
    expect(r.waits[0]).toBe(TELEGRAPH_HOLD_MS);
  });
});

// ------------------------------------------------------------------------------------------ the family alias

describe('odFamilyOf: one key painting for a family of ability ids (FFX only)', () => {
  const ids = (reg: Record<string, unknown>): string[] => Object.keys(reg);
  const members = (reg: Record<string, unknown>): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    for (const id of ids(reg)) for (const f of odFamilyOf(id)) (out[f] ??= []).push(id);
    return out;
  };
  it('Lulu\'s Fury: all 19 `<spell>-fury` ids resolve to `fury`, so `od-fury.png` serves them all', () => {
    const fam = members(FFX_ABILITIES as Record<string, unknown>);
    expect(fam['fury']?.slice().sort()).toEqual(
      ['fire', 'blizzard', 'thunder', 'water', 'fira', 'blizzara', 'thundara', 'watera', 'firaga', 'blizzaga', 'thundaga', 'waterga', 'bio', 'demi', 'death', 'drain', 'osmose', 'flare', 'ultima'].map((s) => `${s}-fury`).sort(),
    );
    expect(odFamilyOf('firaga-fury')).toEqual(['fury']);
  });
  it('Rikku\'s Mix: all 43 `mix-*` ids resolve to `mix`', () => {
    const fam = members(FFX_ABILITIES as Record<string, unknown>);
    expect(fam['mix']?.length).toBe(43);
    expect(fam['mix']?.every((id) => id.startsWith('mix-'))).toBe(true);
  });
  it('nothing else in FFX resolves to a family, and nothing in FFX-2 or FF7 does', () => {
    expect(Object.keys(members(FFX_ABILITIES as Record<string, unknown>)).sort()).toEqual(['fury', 'mix']);
    expect(members(FFX2_ABILITIES as Record<string, unknown>)).toEqual({});
    expect(members(FF7_ABILITIES as Record<string, unknown>)).toEqual({});
  });
  it('the exact-id Overdrives resolve by their own name and are not aliased (Spiral Cut, Dragon Fang, Grand Summon, every Ronso Rage, Wakka\'s reels)', () => {
    for (const id of ['spiral-cut', 'slice-and-dice', 'energy-rain', 'blitz-ace', 'dragon-fang', 'shooting-star', 'banishing-blade', 'tornado', 'grand-summon',
      'jump', 'fire-breath', 'stone-breath', 'nova', 'element-reels', 'fire-shot', 'attack-reels', 'x2-black-mage-fire', 'fury', 'mix', 'firaga', 'attack']) {
      expect(odFamilyOf(id)).toEqual([]);
    }
  });
});

// ----------------------------------------------------------------- the family alias in the Overdrive key slot

describe('Lulu\'s Fury key: the family painting plays as the move\'s own key (FFX)', () => {
  const od = (ability: string) =>
    ({ type: 'action-start', actorId: 'lulu', command: { kind: 'overdrive', id: ability, targets: ['boss'] }, abilityId: ability, abilityName: ability, targets: ['boss'] }) as unknown as Extract<BattleEvent, { type: 'action-start' }>;
  const keyRig = (own: string[], reduce = false): Rig & { calls: string[] } => {
    const r = rig({ own: [], reduce, enemies: ['boss'] });
    const calls: string[] = [];
    const stage = r.ctx.stage as unknown as { actor: (id: string) => unknown; paints: (id: string, p: string) => boolean };
    stage.actor = (id: string) =>
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
    stage.paints = (id: string, p: string) => id === 'lulu' && own.includes(p);
    return Object.assign(r, { calls });
  };
  const play = async (r: Rig, ability: string): Promise<void> => {
    await actionStart(r.ctx, od(ability));
    await damage(r.ctx, hit('lulu', 'boss'));
    await actionEnd(r.ctx);
  };
  it('with `od-fury` painted, every Fury shows it from the opening of the move and ends at idle', async () => {
    for (const spell of ['fire', 'firaga', 'ultima', 'demi']) {
      const r = keyRig([odPoseFor('fury')]);
      await play(r, `${spell}-fury`);
      expect(r.calls).toEqual(['lulu:od-fury', 'lulu:idle']);
    }
  });
  it('REDUCE MOTION: the family key is the same single cut', async () => {
    const r = keyRig([odPoseFor('fury')], true);
    await play(r, 'thundara-fury');
    expect(r.calls).toEqual(['lulu:od-fury!', 'lulu:idle']);
  });
  it('a move\'s own painting wins over its family\'s', async () => {
    const r = keyRig([odPoseFor('fury'), odPoseFor('firaga-fury')]);
    await play(r, 'firaga-fury');
    expect(r.calls).toEqual(['lulu:od-firaga-fury', 'lulu:idle']);
  });
  it('without a painting (today), a Fury plays exactly as before: no key, no wait added', async () => {
    const none = keyRig([]);
    await play(none, 'fire-fury');
    expect(none.calls.some((c) => c.includes('od-'))).toBe(false);
    const painted = keyRig([odPoseFor('fury')]);
    await play(painted, 'fire-fury');
    expect(painted.waits.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(none.waits.reduce((a, b) => a + b, 0));
  });
  it('another figure never uses Lulu\'s family painting', async () => {
    const r = keyRig([odPoseFor('fury')]);
    await actionStart(r.ctx, { ...od('fire-fury'), actorId: 'wakka' } as Extract<BattleEvent, { type: 'action-start' }>);
    expect(r.calls.some((c) => c.includes('od-'))).toBe(false);
  });
});
