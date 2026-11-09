/**
 * The lake's world (`src/engine/lake3d/` sky, shore, ice, snow, crystals, air, stage; FFX only): what can be read without a GPU. The numbers and the shader sources are pinned (a shader that names a uniform nobody sets draws
 * black, and one the code sets but the shader dropped is a silent no-op); the geometry and the seeded fields are built and measured; the stage builds, ticks and frees.
 */
import { Mesh, ShaderMaterial, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { SHAFTS, buildAir } from '../../../src/engine/lake3d/air.ts';
import { CLUSTERS, SHORE_SPIRES, buildCrystals, crystalGeometry, spires } from '../../../src/engine/lake3d/crystals.ts';
import { CALM, MirrorIce, shardField } from '../../../src/engine/lake3d/ice.ts';
import { ICE, ICE_FRAG, SHARD_VERT, WATER_FRAG } from '../../../src/engine/lake3d/iceShader.ts';
import { ARENA } from '../../../src/engine/lake3d/layout.ts';
import { LAKE_PALETTE, LOOK } from '../../../src/engine/lake3d/look.ts';
import { epilogueAt } from '../../../src/engine/lake3d/epilogue.ts';
import { buildShore, shoreHeight } from '../../../src/engine/lake3d/shore.ts';
import { AURORA, SKY, buildSky, skyDir } from '../../../src/engine/lake3d/sky.ts';
import { SNOW, buildSnow, snowSeeds } from '../../../src/engine/lake3d/snow.ts';
import { buildLakeStage } from '../../../src/engine/lake3d/stage.ts';

const uniformsIn = (src: string): string[] => [...src.matchAll(/uniform\s+\w+\s+(\w+)/g)].map((m) => m[1]!);

describe('the sky', () => {
  it('hangs the aurora in the north: azimuth 0 is -z, and the moon stands behind the enemies, low and to the left', () => {
    const north = skyDir(0, 30, new Vector3());
    expect(north.z).toBeLessThan(-0.8);
    expect(Math.abs(north.x)).toBeLessThan(1e-9);
    expect(skyDir(90, 0, new Vector3()).x).toBeCloseTo(1, 6);
    const moon = new Vector3(...SKY.moon.dir).normalize();
    expect(moon.z).toBeLessThan(-0.5);
    expect(moon.x).toBeLessThan(0);
    expect(moon.y).toBeGreaterThan(0.2);
    expect(moon.y).toBeLessThan(0.5);
  });

  it('has three curtains whose colours are bright greens and teals with violet and cyan tops, and a span that covers the enemies\' side', () => {
    expect(AURORA.curtains).toHaveLength(3);
    for (const c of AURORA.curtains) {
      expect(c.colour[1]).toBeGreaterThan(0.9);
      expect(c.height).toBeGreaterThan(0.3);
    }
    expect(AURORA.spanDeg).toBeGreaterThan(45);
  });

  it('builds a dome that follows the camera and sets every uniform its shader declares', () => {
    const sky = buildSky();
    const material = sky.mesh.material as ShaderMaterial;
    for (const u of uniformsIn(material.fragmentShader)) expect(Object.keys(material.uniforms), u).toContain(u);
    expect(material.side).toBe(1); // BackSide
    expect(material.depthTest).toBe(false);
    expect(sky.mesh.renderOrder).toBeLessThan(0);
    sky.update(12.5);
    expect(material.uniforms['uTime']!.value).toBe(12.5);
    const camera = { position: new Vector3(3, 4, 5) } as never;
    sky.mesh.onBeforeRender({} as never, {} as never, camera, {} as never, {} as never, {} as never);
    expect(sky.mesh.position.toArray()).toEqual([3, 4, 5]);
    sky.dispose();
  });

  it('keeps every smoothstep\'s edges in order (undefined when edge0 >= edge1)', () => {
    for (const src of [ICE_FRAG, SHARD_VERT, WATER_FRAG]) {
      for (const m of src.matchAll(/smoothstep\(\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,/g)) expect(Number(m[1]), m[0]).toBeLessThan(Number(m[2]));
    }
  });
});

describe('the shore', () => {
  it('is flat inside the ice\'s edge, rises past it, and is highest in the north and lowest behind the camera', () => {
    expect(shoreHeight(0, 0)).toBe(0);
    expect(shoreHeight(30, -20)).toBe(0);
    expect(shoreHeight(0, -(ARENA.iceRadius + 30))).toBeGreaterThan(0.5);
    let north = 0;
    let south = 0;
    for (let a = -0.5; a <= 0.5; a += 0.05) {
      north = Math.max(north, shoreHeight(Math.sin(a) * 250, -Math.cos(a) * 250));
      south = Math.max(south, shoreHeight(Math.sin(a) * 250, Math.cos(a) * 250));
    }
    expect(north).toBeGreaterThan(south * 1.5);
    expect(north).toBeGreaterThan(40);
    expect(south).toBeLessThan(north);
  });

  it('keeps the ground behind the camera low enough that no flight is ever blocked', () => {
    for (let a = 0; a < Math.PI * 2; a += 0.1) {
      const r = 60;
      const h = shoreHeight(Math.sin(a) * r, -Math.cos(a) * r);
      expect(h, `a ${a.toFixed(1)}`).toBeLessThan(14);
    }
  });

  it('builds a ring with upward normals and vertex colours', () => {
    const shore = buildShore(40, 12);
    const g = shore.mesh.geometry;
    expect(g.getAttribute('color').count).toBe(41 * 13);
    const n = g.getAttribute('normal');
    let up = 0;
    for (let i = 0; i < n.count; i++) if (n.getY(i) > 0) up++;
    expect(up / n.count).toBeGreaterThan(0.98);
    shore.dispose();
  });
});

describe('the ice', () => {
  it('declares the uniforms the code sets, and the twelve layers', () => {
    expect(ICE.layers).toBe(12);
    const ice = new MirrorIce('low');
    const u = (ice.mesh.material as ShaderMaterial).uniforms;
    for (const name of uniformsIn(ICE_FRAG)) expect(Object.keys(u), name).toContain(name);
    expect(ICE_FRAG).toMatch(/uniform float uLayer\[12\]/);
    ice.dispose();
  });

  it('draws the water and the shards only while a layer is going', () => {
    const ice = new MirrorIce('low');
    expect(ice.water.visible).toBe(false);
    expect(ice.shards.visible).toBe(false);
    ice.set(epilogueAt(0.3).ice);
    expect(ice.water.visible).toBe(false); // the ring of light and the cracks, no layer yet
    ice.set(epilogueAt(2).ice);
    expect(ice.water.visible).toBe(true);
    expect(ice.shards.visible).toBe(true);
    ice.set(CALM);
    expect(ice.water.visible).toBe(false);
    ice.dispose();
  });

  it('passes the epilogue\'s state to the shader', () => {
    const ice = new MirrorIce('low');
    ice.set({ pulse: 0.5, pulseR: 12, crack: 0.25, layers: Array.from({ length: 12 }, (_, i) => i / 11) });
    const u = (ice.mesh.material as ShaderMaterial).uniforms;
    expect([u['uPulse']!.value, u['uPulseR']!.value, u['uBreak']!.value]).toEqual([0.5, 12, 0.25]);
    expect(u['uLayer']!.value[11]).toBe(1);
    ice.dispose();
  });

  it('seeds the shard field the same each time, one band per layer, inside its band', () => {
    const a = shardField(12, 46, 42);
    const b = shardField(12, 46, 42);
    expect(Array.from(a.start.slice(0, 30))).toEqual(Array.from(b.start.slice(0, 30)));
    for (let band = 0; band < 12; band++) {
      const outer = 42 * (1 - band / 12);
      const inner = 42 * (1 - (band + 1) / 12);
      for (let k = 0; k < 46; k++) {
        const i = band * 46 + k;
        expect(a.band[i]).toBe(band);
        const r = Math.hypot(a.start[i * 3]!, a.start[i * 3 + 2]!);
        expect(r).toBeGreaterThanOrEqual(inner - 1e-4);
        expect(r).toBeLessThanOrEqual(outer + 1e-4);
        expect(a.rand[i * 4 + 3]!).toBeLessThanOrEqual(0.78);
      }
    }
  });
});

describe('the snow', () => {
  it('has seeded flakes, a box round the fight, and sets every uniform its shader declares', () => {
    expect(Array.from(snowSeeds(8))).toEqual(Array.from(snowSeeds(8)));
    expect(snowSeeds(100, 1)).not.toEqual(snowSeeds(100, 2));
    const snow = buildSnow(500);
    expect(snow.points.geometry.getAttribute('aSeed').count).toBe(500);
    const m = snow.points.material as ShaderMaterial;
    for (const u of uniformsIn(m.vertexShader + m.fragmentShader)) expect(Object.keys(m.uniforms), u).toContain(u);
    expect(SNOW.box[0]).toBeGreaterThan(40);
    expect(m.depthWrite).toBe(false);
    snow.update(3);
    expect(m.uniforms['uTime']!.value).toBe(3);
    snow.dispose();
  });
});

describe('the crystals', () => {
  it('stand in clusters and along the shore, never inside the fight, seeded', () => {
    const list = spires();
    expect(list.length).toBeGreaterThanOrEqual(30); // the shore only: the procedural clusters were taken out (the Meshy crystals stand in the field)
    expect(list.length).toBeLessThanOrEqual(CLUSTERS.reduce((n, c) => n + c.count, 0) + SHORE_SPIRES.count);
    for (const s of list) {
      expect(Math.hypot(s.pos[0] - 0.9, s.pos[2] + 1.6), 'the party\'s ground').toBeGreaterThan(6.2);
      expect(Math.hypot(s.pos[0] - 2.6, s.pos[2] + 5.8), 'Wendigo\'s ground').toBeGreaterThan(3.2);
      expect(s.height).toBeGreaterThan(0.3);
    }
    expect(spires(5)).toEqual(spires(5));
    expect(spires(5)).not.toEqual(spires(6));
  });

  it('is a six-sided prism with a pointed tip, flat-shaded', () => {
    const g = crystalGeometry();
    expect(g.index).toBeNull();
    const p = g.getAttribute('position');
    let top = 0;
    for (let i = 0; i < p.count; i++) top = Math.max(top, p.getY(i));
    expect(top).toBeCloseTo(1, 6);
    g.dispose();
  });

  it('builds one instanced mesh, one matrix and one tint each', () => {
    const c = buildCrystals(LOOK.key.toward, spires().slice(0, 12));
    expect(c.mesh.count).toBe(12);
    expect(c.mesh.instanceColor).not.toBeNull();
    const m = c.mesh.material as ShaderMaterial;
    for (const u of uniformsIn(m.fragmentShader)) expect(Object.keys(m.uniforms), u).toContain(u);
    c.dispose();
  });
});

describe('the air', () => {
  it('has four shafts on the slant of the moon\'s light, each a tall cylinder that sets every uniform its shader declares', () => {
    expect(SHAFTS).toHaveLength(4);
    const air = buildAir();
    const shafts = air.group.children.filter((c) => c.name.startsWith('lake-shaft'));
    expect(shafts).toHaveLength(4);
    for (const s of shafts) {
      const m = (s as Mesh).material as ShaderMaterial;
      for (const u of uniformsIn(m.fragmentShader)) expect(Object.keys(m.uniforms), u).toContain(u);
      expect(m.blending).toBe(2); // AdditiveBlending
    }
    for (const spec of SHAFTS) expect(spec.climb[1]).toBeGreaterThan(30);
    air.update(4);
    expect(((shafts[0] as Mesh).material as ShaderMaterial).uniforms['uTime']!.value).toBe(4);
    air.dispose();
  });
});

describe('the stage', () => {
  it('builds, ticks, takes the epilogue and frees everything it made', () => {
    const stage = buildLakeStage({ quality: 'low' });
    const names = stage.group.children.map((c) => c.name);
    for (const n of ['lake-sky', 'lake-shore', 'lake-ice', 'lake-crystals', 'lake-air', 'lake-snow', 'lake-key', 'lake-rim', 'lake-hemi']) expect(names, n).toContain(n);
    stage.update(1.5);
    stage.epilogue(epilogueAt(2.5));
    expect(stage.ice.water.visible).toBe(true);
    stage.dispose();
    expect(stage.group.children).toHaveLength(0);
  });

  it('lights the party from the lens\' side and the enemies from behind in the aurora\'s green', () => {
    expect(LOOK.key.toward[2]).toBeGreaterThan(0.3); // toward the camera (+z)
    expect(LOOK.rim.toward[2]).toBeLessThan(-0.5); // from behind the enemies
    expect(LOOK.rim.colour).toBe(0x74ffb8);
  });

  it('grades neutrally and encodes (gamma 2.2), with a bloom above any lit surface', () => {
    expect(LAKE_PALETTE.gamma).toEqual([2.2, 2.2, 2.2]);
    expect(LAKE_PALETTE.lift).toEqual([0, 0, 0]);
    expect(LAKE_PALETTE.bloomThreshold!).toBeGreaterThan(0.85);
    expect(LAKE_PALETTE.tiltMaxBlur).toBe(0);
  });
});
