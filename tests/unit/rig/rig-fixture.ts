/**
 * A small synthetic rig for the rig engine's tests (`src/engine/rig/`): a 400 x 800 painting, eleven bones (a root on the floor, pelvis, chest, head, two legs of two
 * bones, an arm, a two-bone tail), six parts, five keys and a motion block. Soles on row 770, baseline 780. Keys are in RADIANS, the motion block in degrees.
 */
import { RIG_VERSION, type RigFile } from '../../../src/data/art/rigTypes.ts';
import { readRig, type RigData } from '../../../src/engine/rig/RigData.ts';

export function makeRigFile(over: Partial<RigFile> = {}): RigFile {
  const bones = [
    { name: 'root', parent: -1, x: 200, y: 780 },
    { name: 'pelvis', parent: 0, x: 200, y: 450 },
    { name: 'chest', parent: 1, x: 200, y: 300 },
    { name: 'head', parent: 2, x: 200, y: 180 },
    { name: 'thighN', parent: 1, x: 180, y: 460 },
    { name: 'shinN', parent: 4, x: 180, y: 620 },
    { name: 'thighF', parent: 1, x: 220, y: 460 },
    { name: 'shinF', parent: 6, x: 220, y: 620 },
    { name: 'arm', parent: 2, x: 150, y: 300 },
    { name: 'tail0', parent: 1, x: 120, y: 460 },
    { name: 'tail1', parent: 9, x: 80, y: 560 },
  ];
  const legQuad = (x: number): { box: [number, number, number, number] } => ({ box: [x, 450, 40, 330] });
  return {
    version: RIG_VERSION,
    name: 'testfig',
    scale: 2,
    image: { w: 400, h: 800 },
    baselineY: 780,
    costume: { painting: 'characters/testfig/idle', pose: 'idle', sha: 'a'.repeat(64) },
    bones,
    parts: [
      { name: 'tail', order: 0, png: 'tail.png', rim: 'tail.rim.png', box: [60, 450, 80, 150], bone: 'tail0' },
      { name: 'legF', order: 1, png: 'legF.png', rim: 'legF.rim.png', ...legQuad(200), bone: 'thighF' },
      {
        name: 'body',
        order: 2,
        png: 'body.png',
        rim: 'body.rim.png',
        box: [140, 250, 120, 250],
        verts: [140, 250, 260, 250, 140, 375, 260, 375, 140, 500, 260, 500],
        triangles: [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4],
        // [b0, w0, b1, w1] a vertex: chest at the top, blending into the pelvis at the bottom
        weights: [2, 1, -1, 0, 2, 1, -1, 0, 2, 0.5, 1, 0.5, 2, 0.5, 1, 0.5, 1, 1, -1, 0, 1, 1, -1, 0],
      },
      { name: 'legN', order: 3, png: 'legN.png', rim: 'legN.rim.png', ...legQuad(160), bone: 'thighN' },
      { name: 'arm', order: 4, png: 'arm.png', box: [110, 280, 60, 220], bone: 'arm', rimEverywhere: true },
      { name: 'head', order: 5, png: 'head.png', rim: 'head.rim.png', box: [150, 110, 100, 140], bone: 'head' },
    ],
    landmarks: {
      head: { bone: 'head', x: 200, y: 160 },
      feet: { bone: 'shinN', x: 180, y: 770 },
      footN: { bone: 'shinN', x: 180, y: 770 },
      footF: { bone: 'shinF', x: 220, y: 770 },
      hand: { bone: 'arm', x: 150, y: 500 },
    },
    keys: {
      idle: { bones: {}, source: 'characters/testfig/idle' },
      ready: {
        bones: { pelvis: { rot: 0.05 }, chest: { rot: 0.1 }, thighN: { rot: -0.05 }, thighF: { rot: -0.05 } },
        source: 'characters/testfig/ready',
      },
      attack: {
        bones: { pelvis: { rot: 0.1 }, chest: { rot: 0.3 }, head: { rot: 0.2 }, arm: { rot: -1.2 }, thighN: { rot: -0.1 }, thighF: { rot: -0.1 } },
        source: 'characters/testfig/attack',
        ms: 140,
        layers: { head: 1.5, arm: 6 }, // the head drops behind the body and the arm comes over the head in this pose
      },
      hurt: {
        bones: { pelvis: { rot: -0.08 }, chest: { rot: -0.25 }, head: { rot: -0.3 }, thighN: { rot: 0.08 }, thighF: { rot: 0.08 } },
        source: 'characters/testfig/hurt',
      },
      ko: { bones: {}, root: { rot: 1.4, dy: -20 }, source: 'characters/testfig/ko', planted: false },
    },
    motion: {
      chains: [{ bones: ['tail0', 'tail1'], follow: 'pelvis', f: 2.2, z: 0.4, fFalloff: 0.88, hang: 0.22, limit: 60, drag: [1.4, 2] }],
      idle: { hz: 0.5, bones: { chest: { rot: 1.5, phase: -1.2 }, head: { rot: 0.8, phase: -1.8 } } },
    },
    gate: { status: 'ok', at: '2026-10-17T12:00:00Z', by: 'test' },
    ...over,
  };
}

export function makeRig(over: Partial<RigFile> = {}): RigData {
  const r = readRig(makeRigFile(over));
  if (!r.ok) throw new Error(`fixture rig does not read: ${r.reason}`);
  return r.data;
}
