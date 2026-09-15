/**
 * Sprite template — copy this file, rename it, and start drawing.
 *
 *   cp src/sprites/TEMPLATE.ts src/sprites/characters/yuna.ts
 *   node tools/render-sprite.mjs src/sprites/characters/yuna.ts --all --grid
 *
 * Rules that keep the loader happy:
 *   - type-only imports (`import type { ... }`), nothing else
 *   - export the definition (default and/or named)
 *   - no runtime dependency on the DOM
 */

import type { Frame, ShapeOp, SpriteDef } from './format.ts';

const palette = {
  o: '#161225', // outline — dark, but tinted toward the material, never pure black
  p: '#96543a', // skin outline
  s: '#f2c9a0', // skin
  S: '#cf9368', // skin shade
  c: '#4a7fd0', // main garment
  C: '#2d538f', // main garment shade
  d: '#2b2f45', // trousers / boots
  m: '#d8dbe6', // metal / trim
};

/** Pieces you will reuse across poses live in named frames. */
const body: ShapeOp[] = [
  { op: 'rect', x: 20, y: 40, w: 4, h: 14, color: 'd', outline: 'o' }, // legs
  { op: 'rect', x: 25, y: 40, w: 4, h: 14, color: 'd', outline: 'o' },
  { op: 'poly', points: [[19, 22], [29, 22], [30, 38], [18, 38]], color: 'c', outline: 'o' }, // torso
  { op: 'ellipse', cx: 24, cy: 14, rx: 5, ry: 5, color: 's', outline: 'p' }, // head
];

const named: Record<string, Frame> = {
  body: { ops: body, overlays: [{ x: 21, y: 13, rows: ['.o.o.', '.....', '..o..'] }] },
};

export const template: SpriteDef = {
  name: 'template',
  size: [48, 64],
  anchor: [24, 60],
  description: 'Copy me.',
  palette,
  outline: 'o',
  shading: { light: 'top-right', strength: 0.25 },
  fps: 5,
  scale: 8,
  defaultState: 'idle',
  frames: named,
  stateOptions: { hurt: { loop: false, next: 'idle' }, ko: { loop: false } },
  states: {
    // Reuse the base pose and move it a pixel: that is the whole trick.
    idle: [
      { base: 'body', duration: 520 },
      { base: [{ frame: 'body', offset: [0, -1] }], duration: 460 },
    ],
    ready: [{ base: 'body' }],
    hurt: [{ base: [{ frame: 'body', offset: [-2, 1] }] }],
    ko: [{ base: [{ frame: 'body', offset: [0, 6] }] }],
  },
};

export default template;
