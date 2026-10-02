/**
 * Release 35 art (both games, presentation only): the wind-up / follow-through key poses (D-313) and
 * the 2x art tier (D-315). Slot fallbacks, the tier's device rule, the 2x URL and manifest gates, and
 * the beat order around a hit.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildManifest } from '../../../tools/gen/manifest.mjs';
import { manifestKnowsAsset, parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { hiResUrl, pixelUrlFor, readTierEnv, setHiTier, wantsHiTier } from '../../../src/engine/ArtTier.ts';
import { PARTY_POSES, resolvePoseMap } from '../../../src/engine/BattlePresenterArt.ts';
import { paintedPoses } from '../../../src/engine/EnemyActionPose.ts';
import { characterUrl } from '../../../src/engine/BattlePresenterArt.ts';
import { armContact, meetContact } from '../../../src/engine/ContactBeat.ts';
import { FOLLOW_BEAT_MS, followThrough, impactAtApex, windUpLeads } from '../../../src/engine/KeyPoses.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';

afterEach(() => {
  resetArtManifest();
  setHiTier(null);
});

const manifest = (subjects: Record<string, { states: string[]; states2x?: string[] }>) =>
  parseArtManifest({ version: 1, subjects: Object.fromEntries(Object.entries(subjects).map(([id, s]) => [id, { portrait: false, ...s }])) });

describe('2x tier: the device rule', () => {
  it('a 1600x900 desktop at ratio 1 and a 1024-wide retina window take the masters', () => {
    expect(wantsHiTier({ phone: false, width: 1600, dpr: 1 })).toBe(true);
    expect(wantsHiTier({ phone: false, width: 1024, dpr: 2 })).toBe(true);
  });
  it('a narrow ratio-1 window and every phone stay on 1x', () => {
    expect(wantsHiTier({ phone: false, width: 1279, dpr: 1 })).toBe(false);
    expect(wantsHiTier({ phone: true, width: 390, dpr: 3 })).toBe(false);
    expect(wantsHiTier({ phone: true, width: 1400, dpr: 3 })).toBe(false);
  });
  it('reads the phone tier from the phone battle query or a coarse pointer on a small screen', () => {
    const mm = (hits: string[]) => (q: string) => ({ matches: hits.includes(q) });
    const upright = readTierEnv({ innerWidth: 390, devicePixelRatio: 3, screen: { width: 390, height: 844 }, matchMedia: mm(['(max-width: 599px) and (orientation: portrait)', '(pointer: coarse)']) });
    expect(upright.phone).toBe(true);
    const sideways = readTierEnv({ innerWidth: 844, devicePixelRatio: 3, screen: { width: 390, height: 844 }, matchMedia: mm(['(pointer: coarse)']) });
    expect(sideways.phone).toBe(true);
    expect(wantsHiTier(sideways)).toBe(false);
    const tablet = readTierEnv({ innerWidth: 1024, devicePixelRatio: 2, screen: { width: 1024, height: 1366 }, matchMedia: mm(['(pointer: coarse)']) });
    expect(tablet.phone).toBe(false);
    expect(wantsHiTier(tablet)).toBe(true);
    expect(readTierEnv({})).toEqual({ phone: false, width: 0, dpr: 1 });
  });
});

describe('2x tier: URLs and the manifest gate', () => {
  it('maps only a chosen character painting to its @2x file', () => {
    expect(hiResUrl('/pyrefly-reprise/art/characters/tidus/idle.png')).toBe('/pyrefly-reprise/art/characters/tidus/idle@2x.png');
    expect(hiResUrl('/art/characters/sin-left-fin/idle-far.png?v=1')).toBe('/art/characters/sin-left-fin/idle-far@2x.png?v=1');
    expect(hiResUrl('/art/characters/tidus/idle.2.png')).toBeNull();
    expect(hiResUrl('/art/backdrops/gagazet.png')).toBeNull();
  });
  it('the manifest knows a master only when it lists it beside the 1x state', async () => {
    setArtManifest(manifest({ tidus: { states: ['idle', 'attack'], states2x: ['idle', 'ghost'] }, auron: { states: ['idle'] } }));
    expect(await manifestKnowsAsset('/art/characters/tidus/idle@2x.png')).toBe(true);
    expect(await manifestKnowsAsset('/art/characters/tidus/attack@2x.png')).toBe(false);
    expect(await manifestKnowsAsset('/art/characters/tidus/ghost@2x.png')).toBe(false); // no 1x state: dropped at parse
    expect(await manifestKnowsAsset('/art/characters/auron/idle@2x.png')).toBe(false);
  });
  it('pixels come from the master on the 2x tier and from the 1x file otherwise', async () => {
    setArtManifest(manifest({ tidus: { states: ['idle', 'attack'], states2x: ['idle'] } }));
    setHiTier(true);
    expect(await pixelUrlFor('/art/characters/tidus/idle.png')).toBe('/art/characters/tidus/idle@2x.png');
    expect(await pixelUrlFor('/art/characters/tidus/attack.png')).toBe('/art/characters/tidus/attack.png');
    setHiTier(false);
    expect(await pixelUrlFor('/art/characters/tidus/idle.png')).toBe('/art/characters/tidus/idle.png');
  });
  it('the pose map keeps the 1x names, so every painted-pose test is unchanged', async () => {
    setArtManifest(manifest({ tidus: { states: ['idle', 'attack', 'ready', 'follow'], states2x: ['idle'] } }));
    setHiTier(true);
    const poses = await resolvePoseMap('tidus', 'party');
    expect(poses['idle']).toBe(characterUrl('tidus', 'idle'));
    expect([...paintedPoses('tidus', poses, characterUrl)].sort()).toEqual(['attack', 'follow', 'idle', 'ready']);
  });
});

describe('manifest generator: states2x', () => {
  it('lists a master only beside its 1x state', () => {
    const root = mkdtempSync(join(tmpdir(), 'pyrefly-r35-'));
    try {
      const dir = join(root, 'characters', 'evrae');
      mkdirSync(dir, { recursive: true });
      for (const f of ['idle', 'idle-far']) {
        writeFileSync(join(dir, `${f}.png`), 'x');
        writeFileSync(join(dir, `${f}.json`), '{}');
      }
      for (const f of ['idle@2x', 'idle-far@2x', 'hurt@2x']) writeFileSync(join(dir, `${f}.png`), 'x');
      const { manifest: m, warnings } = buildManifest(root, { now: 'T' });
      expect(m.subjects['evrae']?.states).toEqual(['idle', 'idle-far']);
      expect(m.subjects['evrae']?.states2x).toEqual(['idle', 'idle-far']);
      expect(warnings.join(' ')).not.toContain('@2x');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('key poses: slot fallbacks', () => {
  it('follow is a party pose that falls back to attack, then the wind-up, then idle', async () => {
    expect(PARTY_POSES).toContain('follow');
    setArtManifest(manifest({ wakka: { states: ['idle', 'attack'] }, 'rikku-dark-knight': { states: ['idle', 'ready', 'follow'] }, 'yuna-gunner': { states: ['idle', 'ready'] } }));
    expect((await resolvePoseMap('wakka', 'party'))['follow']).toBe(characterUrl('wakka', 'attack'));
    expect((await resolvePoseMap('wakka', 'party'))['ready']).toBe(characterUrl('wakka', 'idle'));
    const rdk = await resolvePoseMap('rikku-dark-knight', 'party');
    expect(rdk['attack']).toBe(characterUrl('rikku-dark-knight', 'ready')); // no attack painting: the wind-up strikes
    expect(rdk['follow']).toBe(characterUrl('rikku-dark-knight', 'follow'));
    expect(rdk['cast']).toBe(characterUrl('rikku-dark-knight', 'idle')); // D-179 unchanged for a dressphere
    expect((await resolvePoseMap('yuna-gunner', 'party'))['follow']).toBe(characterUrl('yuna-gunner', 'ready'));
  });
});

/** A ctx with a stage that paints `own` poses for `id` and records the poses set. */
function keyCtx(own: string[], reduce = false) {
  const set: string[] = [];
  const ctx = {
    sleep: (ms: number) => new Promise<void>((r) => setTimeout(r, Math.min(ms, 30))),
    moments: { reducedMotion: reduce },
    stage: { paints: (_id: string, p: string) => own.includes(p), actor: () => ({ setPose: (p: string) => set.push(p) }) },
  } as unknown as EventCtx;
  return { ctx, set };
}

describe('key poses: the beats', () => {
  it('an attack leads with a painted wind-up, and only then', () => {
    expect(windUpLeads(keyCtx(['ready']).ctx, 'tidus', 'attack')).toBe(true);
    expect(windUpLeads(keyCtx(['ready']).ctx, 'tidus', 'cast')).toBe(false);
    expect(windUpLeads(keyCtx([]).ctx, 'tidus', 'attack')).toBe(false);
    expect(windUpLeads(keyCtx(['ready'], true).ctx, 'tidus', 'attack')).toBe(false); // REDUCE MOTION: unchanged
  });
  it('the impact painting goes up at the apex, and never after the action ended', () => {
    const { ctx, set } = keyCtx(['ready']);
    let reached = 0;
    (ctx as { actingId: string | null }).actingId = 'tidus';
    const c = impactAtApex(ctx, 'tidus', { hold: Promise.resolve(), reached: () => reached++ });
    expect(set).toEqual([]);
    c.reached();
    expect(reached).toBe(1);
    expect(set).toEqual(['attack']);
    (ctx as { actingId: string | null }).actingId = null; // actionEnd ran before a late apex
    impactAtApex(ctx, 'tidus', { hold: Promise.resolve(), reached: () => reached++ }).reached();
    expect(reached).toBe(2);
    expect(set).toEqual(['attack']);
  });
  it('a painted follow-through goes up on the hit and holds the strike for its beat', async () => {
    const { ctx, set } = keyCtx(['ready', 'follow']);
    const c = armContact(ctx, 'tidus');
    c.reached();
    let released = false;
    void c.hold.then(() => (released = true));
    await meetContact(ctx, 'seymour-flux');
    expect(set).toEqual(['follow']);
    await new Promise((r) => setTimeout(r, 1));
    expect(released).toBe(false); // still at full reach for the beat
    await new Promise((r) => setTimeout(r, 60));
    expect(released).toBe(true);
    expect(FOLLOW_BEAT_MS).toBeGreaterThan(0);
  });
  it('no follow painting, or REDUCE MOTION: no swap and no extra hold', async () => {
    expect(followThrough(keyCtx(['ready']).ctx, 'tidus')).toBe(0);
    const { ctx, set } = keyCtx(['follow'], true);
    expect(followThrough(ctx, 'tidus')).toBe(0);
    expect(set).toEqual([]);
    const plain = keyCtx([]);
    const c = armContact(plain.ctx, 'tidus');
    c.reached();
    let released = false;
    void c.hold.then(() => (released = true));
    await meetContact(plain.ctx, 'seymour-flux');
    await new Promise((r) => setTimeout(r, 1));
    expect(released).toBe(true);
  });
});
