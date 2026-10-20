/**
 * DEMO MOTION, part 2 on the REAL rig files (`?motion=demo`; decision 153a; both games, shared plumbing): `D:/pyrefly-art-rigs/bahamut-x` (the expressive-2 lane's Bahamut: the head and both wings swap to
 * `attack` and `hurt` variants), `lulu-v2` (a front-view upper body shown from hidden, five parts hidden, an `od-fury` variant) and `lulu` (format v1: no state ever changes). Textures are stand-ins (a
 * distinct `Texture` per file name) so the real part lists, keys, states and meshes run through `RigActor` without an image; the whole file is skipped on a machine without the art mirror.
 *
 * For every key of every rig: from the idle, the pose is asked for and played to its end at 60 fps; every part whose state changes must cross-fade (a ghost holding the old image while it goes out,
 * the new image coming up), no frame may show more than two looks of one part, the pair must cover the part (at least 0.96) the whole way, and the figure must end in exactly the key's state with
 * nothing left fading. A v1 rig must never fade at all.
 */
import { existsSync, readFileSync } from 'node:fs';
import { Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setDemoMotion } from '../../../src/engine/motion/DemoMotion.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
const { compileStates, sameState } = await import('../../../src/engine/rig/RigPartState.ts');
type Mesh = import('three').Mesh;
type Mat = import('three').ShaderMaterial;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;
type RigDataT = import('../../../src/engine/rig/RigData.ts').RigData;

const ROOT = 'D:/pyrefly-art-rigs';
const RIGS = ['bahamut-x', 'lulu-v2', 'lulu'] as const;

afterEach(() => setDemoMotion(null));

const opac = (m: Mesh): number => (m.material as Mat).uniforms['opacity']!.value as number;

async function build(folder: string): Promise<{ actor: RigActorT; data: RigDataT; maps: Map<string, Texture> }> {
  const r = readRig(JSON.parse(readFileSync(`${ROOT}/${folder}/rig.json`, 'utf8')));
  if (!r.ok) throw new Error(r.reason);
  const maps = new Map<string, Texture>();
  const actor = await RigActor.createRigged(
    { name: r.data.name, worldHeight: 1.82, side: 'party', shadow: false },
    {
      data: r.data,
      base: `/art/rigs/${r.data.name}`,
      idlePainting: { texture: new Texture(), meta: { width: r.data.image.w, height: r.data.image.h, baselineY: r.data.baselineY }, placeholder: false, url: `/art/characters/${r.data.name}/idle.png` },
      loadTexture: async (url) => {
        const t = new Texture();
        maps.set(url.split('/').pop()!.replace(/\.webp$/, '.png'), t);
        return t;
      },
    },
  );
  return { actor, data: r.data, maps };
}

describe.skipIf(!RIGS.every((n) => existsSync(`${ROOT}/${n}/rig.json`)))('the real rigs', () => {
  for (const folder of RIGS) {
    describe(folder, () => {
      it('every key, from the idle, with the switch on: its part changes cross-fade and it ends in exactly its state', async () => {
        setDemoMotion(true);
        const probe = await build(folder);
        const states = compileStates(probe.data);
        const idle = states.get('idle')!;
        probe.actor.dispose();
        let fadedKeys = 0;
        let fadedParts = 0;
        for (const key of probe.data.keys.keys()) {
          if (key === 'idle') continue;
          const { actor, data, maps } = await build(folder);
          const target = states.get(key)!;
          const changed = [...target].map((v, i) => (v !== idle[i] ? i : -1)).filter((i) => i >= 0);
          actor.setPose(key);
          const sawGhost = new Set<string>();
          let worstCover = 1;
          for (let f = 0; f < 90; f++) {
            actor.update(1 / 60);
            const kids = actor.figure.plane.children as Mesh[];
            for (const p of data.parts) {
              const main = kids.find((c) => c.name === p.name)!;
              const g = kids.find((c) => c.name === `${p.name}~ghost`);
              if (g?.visible) {
                sawGhost.add(p.name);
                // never more than two looks of a part: the main mesh and its ghost
                expect(kids.filter((c) => c.visible && (c.name === p.name || c.name === `${p.name}~ghost`)).length).toBeLessThanOrEqual(2);
                if (main.visible) worstCover = Math.min(worstCover, 1 - (1 - opac(main)) * (1 - opac(g)));
              }
            }
          }
          expect(actor.figure.fading, `${folder} ${key}: nothing left fading`).toBe(false);
          expect(sameState(actor.figure.partState(), target), `${folder} ${key}: ends in the key's state`).toBe(true);
          for (const i of changed) {
            const part = data.parts[i]!;
            const wasShown = idle[i] !== -2;
            if (wasShown) expect(sawGhost.has(part.name), `${folder} ${key}: ${part.name} leaves a ghost`).toBe(true);
          }
          expect(worstCover).toBeGreaterThanOrEqual(0.96 - 1e-6);
          if (changed.length) {
            fadedKeys++;
            fadedParts += changed.length;
          }
          // the ghost kept the OLD image: for a part that went from its own image to a variant, the ghost's map was the part's own file
          for (const i of changed) {
            const part = data.parts[i]!;
            if (idle[i] === -1 && target[i]! >= 0) {
              expect(maps.has(part.png), `${folder}: ${part.png} was loaded`).toBe(true);
            }
          }
          actor.dispose();
        }
        if (folder === 'lulu') expect(fadedKeys).toBe(0); // format v1: no state ever changes
        else expect(fadedKeys).toBeGreaterThan(0);
        console.log(`[rig-fade-real] ${folder}: ${fadedKeys} of ${probe.data.keys.size - 1} keys change a part, ${fadedParts} part changes in all`);
      });

      it('with the switch off nothing ever fades or ghosts', async () => {
        setDemoMotion(false);
        const probe = await build(folder);
        for (const key of probe.data.keys.keys()) {
          if (key === 'idle') continue;
          probe.actor.setPose(key);
          for (let f = 0; f < 60; f++) {
            probe.actor.update(1 / 60);
            expect(probe.actor.figure.fading).toBe(false);
          }
          probe.actor.setPose('idle');
          for (let f = 0; f < 60; f++) probe.actor.update(1 / 60);
        }
        expect((probe.actor.figure.plane.children as Mesh[]).some((c) => c.name.endsWith('~ghost'))).toBe(false);
        probe.actor.dispose();
      });
    });
  }
});
