/**
 * Lane boss-matte (2026-10-23): the re-cut bosses' code half (`engine/look/pro/BossClean.ts`): the switch, the two art ids, the rim that is zero only while a boss part draws, the shadow fitted under the footprint.
 * Game case: Bahamut FFX-2 only, Seymour Flux FFX only; the plumbing is shared.
 */
import { Mesh, Object3D, Vector3, Vector4 } from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { RimOffBoxes, bossFigure } from '../../../src/engine/look/pro/BossRimOff.ts';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import {
  BOSS_CLEAN_ARTS,
  BOSS_FEET,
  BossClean,
  attachBossClean,
  bossCleanCard,
  bossCleanFromSearch,
  bossCleanOn,
  footFit,
  isCleanBossArt,
  setBossClean,
  tickBossClean,
  type FootActor,
} from '../../../src/engine/look/pro/BossClean.ts';

afterEach(() => {
  setBossClean(null);
  setDemoChapter(undefined);
});

/** A mesh whose material carries the painted shader's rim cells, as a rig part's does. */
function partMesh(rim = 0.8, bounce = 0.3, relight = { value: 0.5 }): Mesh {
  const m = new Mesh();
  (m as unknown as { material: unknown }).material = { uniforms: { rimStrength: { value: rim }, bounceStrength: { value: bounce }, relightRimAmt: relight } };
  return m;
}
const cells = (m: Mesh) => (m as unknown as { material: { uniforms: Record<string, { value: number }> } }).material.uniforms;
/** What three does around a draw: before, (the uniforms are read), after. Returns the cells as the draw saw them. */
function draw(m: Mesh): { rim: number; bounce: number; relight: number } {
  m.onBeforeRender(null as never, null as never, null as never, null as never, null as never, null as never);
  const u = cells(m);
  const seen = { rim: u['rimStrength']!.value, bounce: u['bounceStrength']!.value, relight: u['relightRimAmt']!.value };
  m.onAfterRender(null as never, null as never, null as never, null as never, null as never, null as never);
  return seen;
}

function bossActor(art: string): { actor: FootActor; part: Mesh; shadow: Mesh; ring: Mesh } {
  const actor = new Object3D() as unknown as FootActor & { contentQuad: FootActor['contentQuad'] };
  const part = partMesh();
  const shadow = new Mesh();
  shadow.name = 'contact-shadow';
  const ring = new Mesh();
  ring.name = 'turn-ring';
  actor.add(part, shadow, ring);
  actor.shadow = shadow;
  actor.contentQuad = (out) => {
    const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    q[0].set(10, 0, 0); // the painting's left edge, world x
    q[1].set(14, 0, 0); // its right edge
    q[2].set(14, 5, 0);
    q[3].set(10, 5, 0);
    return q;
  };
  actor.position.set(12, 0, 0);
  attachBossClean(actor, art, 'enemy');
  return { actor, part, shadow, ring };
}

describe('the switch', () => {
  it('is off by default and on with ?boss=clean or ?pack=demo; ?boss=today wins over the pack', () => {
    expect(bossCleanFromSearch(undefined)).toBe('today');
    expect(bossCleanFromSearch('')).toBe('today');
    expect(bossCleanFromSearch('?boss=clean')).toBe('clean');
    expect(bossCleanFromSearch('?demo=1&pack=demo')).toBe('clean');
    expect(bossCleanFromSearch('?pack=demo&boss=today')).toBe('today');
    expect(bossCleanFromSearch('?pack=other')).toBe('today');
  });

  it('plays only in Chapter I and Chapter IV, and only for the two bosses', () => {
    setBossClean('clean');
    expect(bossCleanOn('ffx2-bahamut')).toBe(false); // no chapter named
    setDemoChapter('ffx2-bahamut');
    expect(bossCleanOn('ffx2-bahamut')).toBe(true);
    expect(bossCleanOn('seymour-flux-body')).toBe(true);
    expect(bossCleanOn('yuna')).toBe(false);
    expect(bossCleanOn()).toBe(true); // the boss card asks without an id
    setDemoChapter('yunalesca');
    expect(bossCleanOn('ffx2-bahamut')).toBe(false);
    setDemoChapter('seymour-flux');
    setBossClean('today');
    expect(bossCleanOn('seymour-flux-body')).toBe(false);
  });

  it('the boss card takes the clean cut-out for the two bosses whenever the switch is on', () => {
    setBossClean('clean');
    expect(bossCleanCard('ffx2-bahamut')).toBe(true);
    expect(bossCleanCard('seymour-flux-body')).toBe(true);
    expect(bossCleanCard('yunalesca-1')).toBe(false);
    expect(bossCleanCard(undefined)).toBe(false);
    setBossClean('today');
    expect(bossCleanCard('ffx2-bahamut')).toBe(false);
  });

  it('names exactly the two bosses, each with its game and a footprint row', () => {
    expect(Object.keys(BOSS_CLEAN_ARTS).sort()).toEqual(['ffx2-bahamut', 'seymour-flux-body']);
    expect(BOSS_CLEAN_ARTS['ffx2-bahamut']).toBe('ffx2');
    expect(BOSS_CLEAN_ARTS['seymour-flux-body']).toBe('ffx');
    for (const k of Object.keys(BOSS_CLEAN_ARTS)) {
      expect(BOSS_FEET[k]).toBeDefined();
      expect(BOSS_FEET[k]!.cx).toBeGreaterThan(0);
      expect(BOSS_FEET[k]!.cx).toBeLessThan(1);
    }
    expect(isCleanBossArt('ffx2-bahamut')).toBe(true);
    expect(isCleanBossArt('x2-ixion')).toBe(false);
    expect(isCleanBossArt(undefined)).toBe(false);
  });

  it('attaches a controller to an enemy of those art ids only', () => {
    expect(attachBossClean(new Object3D(), 'ffx2-bahamut', 'enemy')).toBeInstanceOf(BossClean);
    expect(attachBossClean(new Object3D(), 'seymour-flux-body', 'enemy')).toBeInstanceOf(BossClean);
    expect(attachBossClean(new Object3D(), 'ffx2-bahamut', 'party')).toBeNull();
    expect(attachBossClean(new Object3D(), 'kimahri', 'enemy')).toBeNull();
  });
});

describe('the rim is zero only while a boss part draws', () => {
  it('zeroes the rim, the bounce and the relight rim for the draw and puts every number back after it', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const { actor, part } = bossActor('ffx2-bahamut');
    tickBossClean(actor);
    const seen = draw(part);
    expect(seen).toEqual({ rim: 0, bounce: 0, relight: 0 });
    const u = cells(part);
    expect([u['rimStrength']!.value, u['bounceStrength']!.value, u['relightRimAmt']!.value]).toEqual([0.8, 0.3, 0.5]);
  });

  it('leaves the party alone: the shared relight cell is back to its value for the next mesh', () => {
    setBossClean('clean');
    setDemoChapter('seymour-flux');
    const shared = { value: 0.5 };
    const boss = bossActor('seymour-flux-body');
    cells(boss.part)['relightRimAmt'] = shared;
    tickBossClean(boss.actor);
    const partyMesh = partMesh(0.7, 0.2, shared);
    draw(boss.part);
    expect(draw(partyMesh)).toEqual({ rim: 0.7, bounce: 0.2, relight: 0.5 }); // never patched: draws with its own numbers
    expect(shared.value).toBe(0.5);
  });

  it('draws as today with the switch off, or outside the two chapters, or after a chapter change', () => {
    setBossClean('today');
    setDemoChapter('ffx2-bahamut');
    const { actor, part } = bossActor('ffx2-bahamut');
    tickBossClean(actor);
    expect(draw(part)).toEqual({ rim: 0.8, bounce: 0.3, relight: 0.5 });
    setBossClean('clean');
    expect(draw(part)).toEqual({ rim: 0, bounce: 0, relight: 0 });
    setDemoChapter('yunalesca');
    expect(draw(part)).toEqual({ rim: 0.8, bounce: 0.3, relight: 0.5 });
  });

  it('patches a part once however often it scans', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const { actor, part } = bossActor('ffx2-bahamut');
    const c = actor.userData['bossClean'] as BossClean;
    for (let i = 0; i < 61; i++) c.tick(actor);
    const patched = part.onBeforeRender;
    for (let i = 0; i < 61; i++) c.tick(actor);
    expect(part.onBeforeRender).toBe(patched);
    expect(draw(part)).toEqual({ rim: 0, bounce: 0, relight: 0 });
  });
});

describe('the shadow sits under the footprint', () => {
  it('footFit puts the centre at cx of the painting width and the half width at hw of it', () => {
    const f = footFit(10, 14, { cx: 0.38, hw: 0.25, squash: 0.5 });
    expect(f.cx).toBeCloseTo(11.52, 6);
    expect(f.rx).toBeCloseTo(1, 6);
    const m = footFit(14, 10, { cx: 0.38, hw: 0.25, squash: 0.5 }); // a mirrored figure: the painting's left edge is the right one
    expect(m.cx).toBeCloseTo(12.48, 6);
    expect(m.rx).toBeCloseTo(1, 6);
  });

  it('moves the shadow and the ring to the footprint and sizes them, only while the switch plays', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const { actor, shadow, ring } = bossActor('ffx2-bahamut');
    tickBossClean(actor);
    const foot = BOSS_FEET['ffx2-bahamut']!;
    const w = 4;
    expect(shadow.position.x).toBeCloseTo(10 + foot.cx * w - 12, 6); // local to the actor at x 12
    expect(shadow.scale.x).toBeCloseTo(foot.hw * w, 6);
    expect(shadow.scale.y).toBeCloseTo(foot.hw * w * foot.squash, 6);
    expect(ring.position.x).toBeCloseTo(shadow.position.x, 6);
    expect(ring.scale.x).toBeGreaterThan(shadow.scale.x);
    // off: nothing is written
    setBossClean('today');
    shadow.position.x = 99;
    shadow.scale.set(7, 7, 1);
    tickBossClean(actor);
    expect(shadow.position.x).toBe(99);
    expect(shadow.scale.x).toBe(7);
  });

  it('divides by the actor group scale (a planned stature)', () => {
    setBossClean('clean');
    setDemoChapter('seymour-flux');
    const { actor, shadow } = bossActor('seymour-flux-body');
    actor.scale.setScalar(2);
    tickBossClean(actor);
    const foot = BOSS_FEET['seymour-flux-body']!;
    expect(shadow.scale.x).toBeCloseTo((foot.hw * 4) / 2, 6);
    expect(shadow.position.x).toBeCloseTo((10 + foot.cx * 4 - 12) / 2, 6);
  });
});

describe('the bold pass rim is off inside a re-cut boss box, and only there', () => {
  const uniforms = (): Record<string, { value: unknown }> => ({ uRimBoss: { value: [] }, uRimOther: { value: [] }, rimBossN: { value: 0 }, rimOtherN: { value: 0 } });
  const box = (a: number, b: number, c: number, d: number): Vector4 => new Vector4(a, b, c, d);

  it('names the boss box and every other figure box, so a party member in front keeps her rim', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const boss = new Object3D();
    attachBossClean(boss, 'ffx2-bahamut', 'enemy');
    const party = new Object3D();
    const u = uniforms();
    const r = new RimOffBoxes();
    r.actors.push(party, boss, party);
    r.update(u, [box(0, 0, 0.2, 0.5), box(0.3, 0.1, 0.9, 0.9), box(0.1, 0, 0.4, 0.4)], 3);
    expect(u['rimBossN']!.value).toBe(1);
    expect(u['rimOtherN']!.value).toBe(2);
    expect((u['uRimBoss']!.value as Vector4[])[0]!.toArray()).toEqual([0.3, 0.1, 0.9, 0.9]);
    expect((u['uRimOther']!.value as Vector4[])[1]!.toArray()).toEqual([0.1, 0, 0.4, 0.4]);
  });

  it('a rigged boss is one tracked mesh per part: its boxes are one union box, never other figures', () => {
    setBossClean('clean');
    setDemoChapter('seymour-flux');
    const boss = new Object3D();
    attachBossClean(boss, 'seymour-flux-body', 'enemy');
    const party = new Object3D();
    const u = uniforms();
    const r = new RimOffBoxes();
    r.actors.push(boss, boss, party, boss);
    r.update(u, [box(0.5, 0.2, 0.6, 0.4), box(0.55, 0.1, 0.8, 0.5), box(0.1, 0.1, 0.3, 0.6), box(0.7, 0.3, 0.9, 0.9)], 4);
    expect(u['rimBossN']!.value).toBe(1);
    expect(u['rimOtherN']!.value).toBe(1);
    expect((u['uRimBoss']!.value as Vector4[])[0]!.toArray()).toEqual([0.5, 0.1, 0.9, 0.9]);
    expect((u['uRimOther']!.value as Vector4[])[0]!.toArray()).toEqual([0.1, 0.1, 0.3, 0.6]);
  });

  it('sends nothing while the switch is off, or outside the two chapters', () => {
    const boss = new Object3D();
    attachBossClean(boss, 'seymour-flux-body', 'enemy');
    const u = uniforms();
    const r = new RimOffBoxes();
    r.actors.push(boss);
    setBossClean('today');
    setDemoChapter('seymour-flux');
    r.update(u, [box(0, 0, 1, 1)], 1);
    expect([u['rimBossN']!.value, u['rimOtherN']!.value]).toEqual([0, 0]);
    setBossClean('clean');
    setDemoChapter('yunalesca');
    r.update(u, [box(0, 0, 1, 1)], 1);
    expect([u['rimBossN']!.value, u['rimOtherN']!.value]).toEqual([0, 0]);
  });
});

describe('the bold pass draws one contact ellipse for a rigged boss', () => {
  it('gives the first part the footprint under the whole figure, the other parts nothing, and the party nothing special', () => {
    setBossClean('clean');
    setDemoChapter('seymour-flux');
    const { actor } = bossActor('seymour-flux-body');
    const foot = BOSS_FEET['seymour-flux-body']!;
    const first = bossFigure(actor);
    expect(first).not.toBeNull();
    expect(first).not.toBe('skip');
    if (first && first !== 'skip') {
      expect(first.cx).toBeCloseTo(10 + foot.cx * 4, 6);
      expect(first.rx).toBeCloseTo(foot.hw * 4, 6);
    }
    expect(bossFigure(actor)).toBe('skip'); // the second part of the same boss, the same frame
    new RimOffBoxes().update({ uRimBoss: { value: [] }, uRimOther: { value: [] }, rimBossN: { value: 0 }, rimOtherN: { value: 0 } }, [], 0); // the frame ends: the next one starts again
    expect(bossFigure(actor)).not.toBe('skip');
    new RimOffBoxes().update({ uRimBoss: { value: [] }, uRimOther: { value: [] }, rimBossN: { value: 0 }, rimOtherN: { value: 0 } }, [], 0);
    expect(bossFigure(new Object3D())).toBeNull(); // a party member: today's code
  });

  it('is the old code while the switch is off or outside the two chapters', () => {
    const { actor } = bossActor('ffx2-bahamut');
    setBossClean('today');
    setDemoChapter('ffx2-bahamut');
    expect(bossFigure(actor)).toBeNull();
    setBossClean('clean');
    setDemoChapter('yunalesca');
    expect(bossFigure(actor)).toBeNull();
  });
});
