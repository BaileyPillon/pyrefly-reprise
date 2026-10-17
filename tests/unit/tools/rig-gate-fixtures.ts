/**
 * Fixtures for the rig gate's tests (the rig program; both games): a "puppet" built from rectangles whose paintings are drawn by SVG, so the gate's rasteriser is read
 * against a drawing it did not make. The puppet stands 330 px tall on a 400 x 500 canvas (ground row 450): legs, a torso, a head, and one arm of two tubes that bends at
 * the elbow. Its rig has five bones below the root (pelvis, chest, head, upperarm, forearm) and, when `cap` is on, a square cap over the elbow: the joint's underlap.
 *
 * Keys: `attack` (the arm raised, the chest leaning), `hurt` (the head thrown back), `item` (the forearm folded flat back on the upper arm: the one place two rigid tubes
 * that abut show NO gap, and half way there the biggest one). Each approved painting is the same pose drawn with every angle a few hundredths of a radian off, so a
 * good rig overlaps it by 0.9 or more and a bad one cannot hide behind identical pixels.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { loadModelInputs, type ModelInputs, type ModelRow } from '../../../tools/posescale/pose-model.mjs';
import { ROOT, must } from './pose-gate-fixtures.ts';

export { ROOT, must };

export const W = 400;
export const H = 500;
export const SUBJECT = 'zz-puppet';
export const HEAD_BOX: [number, number, number, number] = [0.4375, 0.24, 0.5625, 0.372]; // x 175..225, y 120..186

export const tempDir = (prefix: string): string => mkdtempSync(join(tmpdir(), prefix));

/** The angles of a pose: chest, head, upper arm and forearm, radians clockwise. */
export interface Angles { chest: number; head: number; upper: number; fore: number }
export const POSES: Record<string, Angles> = {
  idle: { chest: 0, head: 0, upper: 0, fore: 0 },
  attack: { chest: 0.1, head: 0.05, upper: -1.1, fore: -0.4 },
  hurt: { chest: -0.15, head: -0.35, upper: 0.3, fore: 0.5 },
  item: { chest: 0, head: 0, upper: 0, fore: Math.PI },
};
/** What the approved painting of each pose is off by, per angle, from the rig's key (a few hundredths of a radian). */
const PAINTER_WOBBLE: Angles = { chest: 0.02, head: -0.03, upper: 0.04, fore: -0.03 };

const SHOULDER = { x: 235, y: 200 };
const ELBOW = { x: 235, y: 270 };
const NECK = { x: 200, y: 182 };
const WAIST = { x: 200, y: 300 };

const deg = (r: number): number => Math.round(((r * 180) / Math.PI) * 1000) / 1000;

/** The puppet drawn as SVG at the given angles: legs, torso (with the head and the arm riding on it). */
export function puppetSvg(a: Angles): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect x="170" y="330" width="60" height="120" fill="#46506e"/>
  <g transform="rotate(${deg(a.chest)} ${WAIST.x} ${WAIST.y})">
    <rect x="160" y="180" width="80" height="155" fill="#7a3a2a"/>
    <g transform="rotate(${deg(a.head)} ${NECK.x} ${NECK.y})"><rect x="175" y="120" width="50" height="66" fill="#d9b48a"/></g>
    <g transform="rotate(${deg(a.upper)} ${SHOULDER.x} ${SHOULDER.y})">
      <rect x="223" y="200" width="24" height="82" fill="#b88a60"/>
      <g transform="rotate(${deg(a.fore)} ${ELBOW.x} ${ELBOW.y})"><rect x="223" y="258" width="24" height="82" fill="#b88a60"/><rect x="220" y="255" width="30" height="30" fill="#b88a60"/></g>
    </g>
  </g>
</svg>`;
}

export async function paintPuppet(art: string, pose: string, a: Angles): Promise<string> {
  const dir = join(art, 'characters', SUBJECT);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${pose}.png`);
  await sharp(Buffer.from(puppetSvg(a))).png().toFile(file);
  return file;
}

/** The art folder of the puppet: the idle and the three poses, each drawn off its key's angles by the painter's wobble. */
export async function paintPuppetArt(art: string): Promise<void> {
  for (const [pose, a] of Object.entries(POSES)) {
    const w = pose === 'idle' ? { chest: 0, head: 0, upper: 0, fore: 0 } : { chest: a.chest + PAINTER_WOBBLE.chest, head: a.head + PAINTER_WOBBLE.head, upper: a.upper + PAINTER_WOBBLE.upper, fore: a.fore + PAINTER_WOBBLE.fore };
    await paintPuppet(art, pose, w);
  }
}

export const puppetTable = (): Record<string, Record<string, ModelRow>> => ({
  [SUBJECT]: Object.fromEntries(Object.keys(POSES).map((p) => [p, { stanceX: 200, head: HEAD_BOX }])),
});

export const puppetInputs = (art: string, table = puppetTable()): Promise<ModelInputs> =>
  loadModelInputs({ root: ROOT, artDir: art, table, tableSource: {}, koScale: {}, records: { subjects: {} } });

// ------------------------------------------------------------------------------------------------ the rig

export interface PuppetRigOptions {
  /** The elbow cap part (the joint's underlap). */
  cap?: boolean;
  /** How far each arm tube runs past the elbow into the other's (px). */
  overlap?: number;
  /** Patch the rig before it is written (it may add parts with {@link addRectPart}). */
  patch?: (rig: RigJson, dir: string) => void | Promise<void>;
}
export type RigJson = Record<string, any>;

export interface Rect { name: string; x: number; y: number; w: number; h: number; bone: number; color: [number, number, number] }

/** A rectangle's mesh: a grid of `nx` by `ny` quads, two triangles each. */
function gridMesh(r: Rect, nx = 2, ny = 4): { verts: number[]; triangles: number[]; bones: number[]; weights: number[] } {
  const verts: number[] = [];
  const bones: number[] = [];
  const weights: number[] = [];
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      verts.push(r.x + (r.w * i) / nx, r.y + (r.h * j) / ny);
      bones.push(r.bone, -1);
      weights.push(1, 0);
    }
  }
  const triangles: number[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + 1;
      const c = a + nx + 1;
      const d = c + 1;
      triangles.push(a, b, c, b, d, c);
    }
  }
  return { verts, triangles, bones, weights };
}

/** Write one rectangle's PNG into `dir` and append its part (a grid mesh, rigid on `r.bone`) to `rig.parts`, last in the draw order. */
export async function addRectPart(dir: string, rig: { parts: RigJson[] }, r: Rect): Promise<void> {
  const buf = Buffer.alloc(r.w * r.h * 4);
  for (let i = 0; i < r.w * r.h; i++) { buf[i * 4] = r.color[0]; buf[i * 4 + 1] = r.color[1]; buf[i * 4 + 2] = r.color[2]; buf[i * 4 + 3] = 255; }
  await sharp(buf, { raw: { width: r.w, height: r.h, channels: 4 } }).png().toFile(join(dir, `${r.name}.png`));
  rig.parts.push({ name: r.name, order: rig.parts.length, png: `${r.name}.png`, box: [r.x, r.y, r.w, r.h], ...gridMesh(r) });
}

/** Write the puppet's rig (rig.json and its part PNGs) into `dir`; the costume is the art folder's idle. */
export async function writePuppetRig(dir: string, art: string, o: PuppetRigOptions = {}): Promise<RigJson> {
  mkdirSync(dir, { recursive: true });
  const ov = o.overlap ?? 12;
  const sha = createHash('sha256').update(readFileSync(join(art, 'characters', SUBJECT, 'idle.png'))).digest('hex');
  // bones: root 0, pelvis 1, chest 2, head 3, upperarm 4, forearm 5
  const bones = [
    { name: 'root', parent: -1, x: 200, y: 450 },
    { name: 'pelvis', parent: 0, x: 200, y: 335 },
    { name: 'chest', parent: 1, x: WAIST.x, y: WAIST.y },
    { name: 'head', parent: 2, x: NECK.x, y: NECK.y },
    { name: 'upperarm', parent: 2, x: SHOULDER.x, y: SHOULDER.y },
    { name: 'forearm', parent: 4, x: ELBOW.x, y: ELBOW.y },
  ];
  const rects: Rect[] = [
    { name: 'legs', x: 170, y: 330, w: 60, h: 120, bone: 1, color: [70, 80, 110] },
    { name: 'torso', x: 160, y: 180, w: 80, h: 155, bone: 2, color: [122, 58, 42] },
    { name: 'head', x: 175, y: 120, w: 50, h: 66, bone: 3, color: [217, 180, 138] },
    { name: 'upperarm', x: 223, y: 200, w: 24, h: 70 + ov, bone: 4, color: [184, 138, 96] },
    { name: 'forearm', x: 223, y: 270 - ov, w: 24, h: 70 + ov, bone: 5, color: [184, 138, 96] },
  ];
  if (o.cap) rects.push({ name: 'elbow', x: 220, y: 255, w: 30, h: 30, bone: 5, color: [184, 138, 96] });
  const parts: RigJson[] = [];
  for (const r of rects) await addRectPart(dir, { parts }, r);
  const keyOf = (pose: string, a: Angles): RigJson => ({
    bones: { chest: { rot: deg(a.chest) }, head: { rot: deg(a.head) }, upperarm: { rot: deg(a.upper) }, forearm: { rot: deg(a.fore) } },
    source: `art/characters/${SUBJECT}/${pose}.png`,
  });
  const keys: RigJson = { idle: { bones: {}, source: `art/characters/${SUBJECT}/idle.png` } };
  for (const [pose, a] of Object.entries(POSES)) if (pose !== 'idle') keys[pose] = keyOf(pose, a);
  const rig: RigJson = {
    version: 1, name: SUBJECT, scale: 1, image: { w: W, h: H }, baselineY: 450,
    costume: { painting: `art/characters/${SUBJECT}/idle.png`, sha: sha.slice(0, 16) },
    bones, parts,
    landmarks: { head: { bone: 3, x: 200, y: 150 }, feet: { bone: 0, x: 200, y: 450 } },
    keys,
  };
  await o.patch?.(rig, dir);
  writeFileSync(join(dir, 'rig.json'), JSON.stringify(rig));
  return rig;
}

/** A whole puppet world: an art folder, its inputs, a rig folder. */
export async function puppetWorld(o: PuppetRigOptions = {}): Promise<{ art: string; rig: string; inputs: ModelInputs }> {
  const art = tempDir('rig-art-');
  await paintPuppetArt(art);
  const rig = join(tempDir('rig-rig-'), SUBJECT);
  await writePuppetRig(rig, art, { cap: true, ...o });
  return { art, rig, inputs: await puppetInputs(art) };
}
