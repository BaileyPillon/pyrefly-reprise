// @vitest-environment jsdom
/**
 * r63-play (2026-10-23, the driver's extras for tonight's playtest): which figures draw no screen-space rim (`engine/look/pro/RimFigures.ts`, `PartyRimSwitch.ts`).
 *
 *  - Chapter I, FFX only: Mortiorchis (Seymour Flux's companion) is flagged in the rim mask like the boss, under the boss re-cut's own switch; its painting is not re-cut.
 *  - Both games: the party (and any aeon) is flagged when `?partyrim=off` / the playtest key `'` says so; DEFAULT ON (today's rim, which Bailey has not decided); the master key and `?pro=off` leave it alone.
 */
import { Color, Mesh, Object3D, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Texture, type WebGLRenderer } from 'three';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { BossMask, MASK_LAYER } from '../../../src/engine/look/pro/BossMask.ts';
import { attachBossClean, setBossClean } from '../../../src/engine/look/pro/BossClean.ts';
import { partyRimFromSearch, partyRimMode, partyRimOff, setPartyRim } from '../../../src/engine/look/pro/PartyRimSwitch.ts';
import { RIM_COMPANIONS, rimSkipOf, tagRimFigure } from '../../../src/engine/look/pro/RimFigures.ts';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import { EXTRA_KEYS, SWITCHES, flipAll, legendRows, switchOfCode } from '../../../src/app/demo/switchboardModel.ts';

afterEach(() => {
  setBossClean(null);
  setPartyRim(null);
  setDemoChapter(undefined);
});

interface Seen {
  figure: Mesh;
  boss: number;
}

/** A fake renderer that runs each mesh's hook the way three does under the override material, and records which flag each figure drew with. */
function fakeRenderer(seen: Seen[]) {
  const r = {
    autoClear: true,
    shadowMap: { enabled: true },
    getRenderTarget: () => null,
    setRenderTarget: () => undefined,
    getClearAlpha: () => 1,
    getClearColor: (c: Color) => c.setHex(0),
    setClearColor: () => undefined,
    clear: () => undefined,
    render: (scene: Scene, camera: PerspectiveCamera) => {
      const flat = scene.overrideMaterial as ShaderMaterial;
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh || !m.layers.test(camera.layers)) return;
        m.onBeforeRender(r as unknown as WebGLRenderer, scene, camera, m.geometry, flat as never, null as never);
        seen.push({ figure: m, boss: flat.uniforms['uBoss']!.value as number });
      });
    },
  };
  return r as unknown as WebGLRenderer;
}
const figure = (): Mesh => new Mesh(new PlaneGeometry(1, 1), new ShaderMaterial({ uniforms: { map: { value: new Texture() }, opacity: { value: 1 } } }));

/** A fight's four figures as the stage builds them: Bahamut-style boss controller aside, the party girl, an aeon, Mortiorchis, and an ordinary foe. */
function field() {
  const party = new Object3D();
  const aeon = new Object3D();
  const companion = new Object3D();
  const foe = new Object3D();
  tagRimFigure(party, 'tidus', 'party');
  tagRimFigure(aeon, 'ifrit', 'aeon');
  tagRimFigure(companion, 'mortiorchis', 'enemy');
  tagRimFigure(foe, 'guado-guard', 'enemy');
  const meshes = { party: figure(), aeon: figure(), companion: figure(), foe: figure() };
  party.add(meshes.party);
  aeon.add(meshes.aeon);
  companion.add(meshes.companion);
  foe.add(meshes.foe);
  const scene = new Scene();
  scene.add(party, aeon, companion, foe);
  const tracked = [
    { slot: meshes.party, actor: party },
    { slot: meshes.aeon, actor: aeon },
    { slot: meshes.companion, actor: companion },
    { slot: meshes.foe, actor: foe },
  ];
  return { scene, tracked, meshes, actors: { party, aeon, companion, foe } };
}
const flagsOf = (seen: Seen[], meshes: Record<string, Mesh>) => Object.fromEntries(Object.entries(meshes).map(([k, m]) => [k, seen.find((s) => s.figure === m)?.boss ?? null]));

describe('the party rim switch', () => {
  it('is OFF by default since r64 (item 200e; the conference pack), ON (the old rim) with no page, with ?pack=off or with ?partyrim=on', () => {
    expect(partyRimFromSearch(undefined)).toBe('on'); // no page at all (a unit test): the rim as it was
    expect(partyRimFromSearch('?pack=off')).toBe('on');
    expect(partyRimFromSearch('')).toBe('off');
    expect(partyRimFromSearch('?pack=demo')).toBe('off');
    expect(partyRimFromSearch('?demo=1&pack=demo&switchboard=1&pro=off')).toBe('off'); // ?pro=off does not touch it
    expect(partyRimFromSearch('?partyrim=off')).toBe('off');
    expect(partyRimFromSearch('?pack=off&partyrim=off')).toBe('off');
    expect(partyRimFromSearch('?pack=demo&PartyRim=ON')).toBe('off'); // the key is spelt lower case; its value is not case sensitive
    expect(partyRimFromSearch('?partyrim=ON')).toBe('on');
    expect(partyRimFromSearch('?partyrim=on')).toBe('on');
    expect(partyRimFromSearch('?pack=demo&partyrim=on')).toBe('on');
    expect(partyRimFromSearch('?partyrim=maybe')).toBe('off'); // an unknown word names nothing: the default decides
    expect(partyRimFromSearch('?pack=off&partyrim=maybe')).toBe('on');
  });

  it('plays only in Chapter I and Chapter IV', () => {
    setPartyRim('off');
    expect(partyRimOff()).toBe(false); // no demo chapter named
    setDemoChapter('yunalesca');
    expect(partyRimOff()).toBe(false);
    setDemoChapter('seymour-flux');
    expect(partyRimOff()).toBe(true);
    setDemoChapter('ffx2-bahamut');
    expect(partyRimOff()).toBe(true);
    setPartyRim('on');
    expect(partyRimOff()).toBe(false);
    setPartyRim(null);
    expect(partyRimMode()).toBe('off'); // no address word in the test page: r64's default
  });
});

describe('who is tagged, and who draws no rim', () => {
  it('tags the party and aeons, and Mortiorchis as a companion (FFX only); an ordinary foe and the bosses (their own controller) are not tagged', () => {
    const { actors } = field();
    expect(actors.party.userData['rimClass']).toBe('party');
    expect(actors.aeon.userData['rimClass']).toBe('party');
    expect(actors.companion.userData['rimClass']).toBe('companion');
    expect(actors.foe.userData['rimClass']).toBeUndefined();
    expect(RIM_COMPANIONS).toEqual({ mortiorchis: 'ffx' });
    const boss = new Object3D();
    tagRimFigure(boss, 'ffx2-bahamut', 'enemy');
    expect(boss.userData['rimClass']).toBeUndefined();
  });

  it('the truth table: the companion follows the boss re-cut, the party follows its own switch, a foe never', () => {
    const { actors } = field();
    setDemoChapter('seymour-flux');
    setBossClean('today');
    setPartyRim('on');
    expect(Object.values(actors).map(rimSkipOf)).toEqual([false, false, false, false]);
    setBossClean('clean');
    expect([actors.party, actors.aeon, actors.companion, actors.foe].map(rimSkipOf)).toEqual([false, false, true, false]);
    setPartyRim('off');
    expect([actors.party, actors.aeon, actors.companion, actors.foe].map(rimSkipOf)).toEqual([true, true, true, false]);
    setBossClean('today'); // the boss re-cut off: Mortiorchis draws its rim as today, the party still follows its own switch
    expect([actors.party, actors.aeon, actors.companion, actors.foe].map(rimSkipOf)).toEqual([true, true, false, false]);
    setDemoChapter('yunalesca'); // outside the two demo chapters nothing is skipped
    expect([actors.party, actors.aeon, actors.companion, actors.foe].map(rimSkipOf)).toEqual([false, false, false, false]);
  });

  it('a re-cut boss is skipped as before', () => {
    setDemoChapter('ffx2-bahamut');
    setBossClean('clean');
    const boss = new Object3D();
    attachBossClean(boss, 'ffx2-bahamut', 'enemy');
    expect(rimSkipOf(boss)).toBe(true);
  });
});

describe('the rim mask carries them', () => {
  it('Chapter I with the boss re-cut on and the party rim ON (`?partyrim=on`, the old default): Mortiorchis is flagged like the boss, the party, the aeon and an ordinary foe are not', () => {
    setDemoChapter('seymour-flux');
    setPartyRim('on');
    setBossClean('clean');
    const f = field();
    const boss = new Object3D();
    attachBossClean(boss, 'seymour-flux-body', 'enemy');
    const bossMesh = figure();
    boss.add(bossMesh);
    f.scene.add(boss);
    const seen: Seen[] = [];
    const mask = new BossMask();
    const u = { tBossMask: { value: null as unknown }, bossMaskOn: { value: 0 } };
    mask.frame(fakeRenderer(seen), f.scene, new PerspectiveCamera(), [...f.tracked, { slot: bossMesh, actor: boss }], 1600, 900, u);
    expect(flagsOf(seen, { ...f.meshes, boss: bossMesh })).toEqual({ party: 0, aeon: 0, companion: 1, foe: 0, boss: 1 });
    expect(u.bossMaskOn.value).toBe(1);
    mask.dispose();
  });

  it('the party rim OFF flags the party and the aeon too, whatever the boss switch says; the foe stays as it was', () => {
    setDemoChapter('ffx2-bahamut');
    setPartyRim('off');
    for (const boss of ['clean', 'today'] as const) {
      setBossClean(boss);
      const f = field();
      const seen: Seen[] = [];
      const mask = new BossMask();
      const u = { tBossMask: { value: null as unknown }, bossMaskOn: { value: 0 } };
      mask.frame(fakeRenderer(seen), f.scene, new PerspectiveCamera(), f.tracked, 1600, 900, u);
      expect(flagsOf(seen, f.meshes), boss).toEqual({ party: 1, aeon: 1, companion: boss === 'clean' ? 1 : 0, foe: 0 });
      expect(u.bossMaskOn.value, boss).toBe(1); // the mask is drawn for the party alone, with the boss re-cut off
      expect(mask.stats.draws, boss).toBe(1);
      mask.dispose();
    }
  });

  it('draws nothing at all when the boss re-cut is off and the party rim is on: today\'s frame', () => {
    setDemoChapter('seymour-flux');
    setBossClean('today');
    setPartyRim('on');
    const f = field();
    const seen: Seen[] = [];
    const mask = new BossMask();
    const u = { tBossMask: { value: null as unknown }, bossMaskOn: { value: 1 } };
    mask.frame(fakeRenderer(seen), f.scene, new PerspectiveCamera(), f.tracked, 1600, 900, u);
    expect(seen).toEqual([]);
    expect(mask.on).toBe(false);
    expect(mask.stats.draws).toBe(0);
    expect(u.bossMaskOn.value).toBe(0);
    for (const m of Object.values(f.meshes)) expect(m.layers.isEnabled(MASK_LAYER)).toBe(false); // nothing is hooked
    mask.dispose();
  });

  it('a party figure flagged for the mask is read from its actor, so a part the pass has not scanned yet is on it the frame it appears', () => {
    setDemoChapter('seymour-flux');
    setBossClean('today');
    setPartyRim('off');
    const f = field();
    const late = figure(); // a rig piece built this frame: the pass list does not hold it yet
    f.actors.party.add(late);
    const seen: Seen[] = [];
    const mask = new BossMask();
    mask.frame(fakeRenderer(seen), f.scene, new PerspectiveCamera(), f.tracked, 1600, 900, {});
    expect(seen.find((s) => s.figure === late)?.boss).toBe(1);
    mask.dispose();
  });
});

describe('the playtest key', () => {
  const lane = SWITCHES.find((s) => s.key === "'")!;

  it('is the apostrophe, named "party rim" in the legend, flips only the party rim, and is no "new" piece (the master key leaves it alone)', () => {
    expect(lane.name).toBe('party rim');
    expect(switchOfCode('Quote')?.name).toBe('party rim');
    expect(lane.set).toBeUndefined();
    expect(lane.isNew()).toBe(false);
    setPartyRim('on');
    expect(lane.read()).toBe('on');
    expect(lane.flip!()).toBe('off');
    expect(partyRimMode()).toBe('off');
    expect(lane.isNew()).toBe(false);
    flipAll();
    expect(partyRimMode()).toBe('off'); // the master did not touch it
    flipAll();
    expect(partyRimMode()).toBe('off');
    expect(lane.flip!()).toBe('on');
  });

  it('is in the legend in plain words, with a key no other piece and no game key uses', () => {
    const row = legendRows().find((r) => r.key === "'")!;
    expect(row.name).toBe('party rim');
    expect(row.plain).toMatch(/party/i);
    expect(row.plain).toMatch(/aeons/i);
    expect(row.plain.length).toBeGreaterThan(40);
    const keys = SWITCHES.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(SWITCHES.map((s) => s.code)).size).toBe(keys.length);
    expect(EXTRA_KEYS.map((e) => e.key)).not.toContain("'");
    const input = readFileSync('src/app/Input.ts', 'utf8');
    expect(input).not.toContain('Quote:');
    expect(input).not.toContain("'Quote'");
    expect(EXTRA_KEYS.find((e) => e.key === '0')!.plain).toMatch(/not the party rim/);
  });
});
