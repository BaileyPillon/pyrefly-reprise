/**
 * Option C's emitters (eye-candy options round, 2026-09-29): what each blow, spell, Special,
 * sending and victory throws into the GPU pools. Kept apart from the controller
 * (`SpectacleFx.ts`) so each file stays readable.
 *
 * Game case: both, skinned per game from `SPECTACLE_TUNING`. FFX: round gold streaks, gold
 * rings, warm pyreflies. FFX-2: pink streaks with four-point glints, pink rings, the same
 * pyreflies (canon: fiends leave as pyreflies in both games) with a violet-pink edge.
 */

import { Vector3 } from 'three';
import type { SegmentPool, SpritePool } from './FxPools.ts';
import { boltPath, type P3 } from './Lightning.ts';
import type { GameTuning, SpectacleGame } from './SpectacleRules.ts';

type RGB = [number, number, number];

/** Element tints for the streaks (C3), linear and hot enough to bloom. */
export const ELEMENT_TINT: Record<string, RGB> = {
  fire: [1.8, 0.7, 0.15],
  ice: [0.7, 1.4, 1.9],
  thunder: [1.5, 1.4, 2.0],
  water: [0.4, 1.0, 1.9],
  holy: [1.9, 1.8, 1.3],
};

const rand = (a: number, b: number): number => a + Math.random() * (b - a);
const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const scale = (a: RGB, k: number): RGB => [a[0] * k, a[1] * k, a[2] * k];

export interface Pools {
  seg: SegmentPool;
  spr: SpritePool;
  /** Floor decals, depth-tested so the figures stand on them. */
  floor: SpritePool;
  /** Drawn before the figures: the shock rings sit behind the fighter they hit. */
  back: SpritePool;
  /** CSS px to drawing-buffer px. */
  px: number;
}

/** Every pool, for the controller's per-frame, clear and dispose loops. */
export function poolsOf(p: Pools): Array<SegmentPool | SpritePool> {
  return [p.seg, p.spr, p.floor, p.back];
}

/** C3: velocity-stretched streaks, one shock ring and a hot core flash at the blow. */
export function hitBurst(
  p: Pools,
  t: GameTuning,
  at: Vector3,
  height: number,
  o: { streaks: number; ring: boolean; element?: string | undefined; heavy: boolean; foot: Vector3 },
): void {
  const tint = o.element ? ELEMENT_TINT[o.element] : undefined;
  const core = tint ? mix(t.streakCore, tint, 0.55) : t.streakCore;
  const edge = tint ? mix(t.streakEdge, tint, 0.7) : t.streakEdge;
  const s = Math.max(0.6, Math.min(1.4, height / 2));
  for (let i = 0; i < o.streaks; i++) {
    const th = rand(0, Math.PI * 2);
    const up = rand(-0.35, 1);
    const sp = rand(4.5, 11) * s * (o.heavy ? 1.25 : 1);
    const dir: P3 = [Math.cos(th) * Math.sqrt(1 - up * up * 0.5), up, Math.sin(th) * 0.6];
    const vel: P3 = [dir[0] * sp, dir[1] * sp + 1.5 * s, dir[2] * sp];
    const hot = Math.random() < 0.35;
    p.seg.emit({
      start: [at.x, at.y, at.z],
      vel,
      life: rand(0.24, 0.46),
      trail: rand(0.06, 0.1),
      gravity: 9 * s,
      drag: 2.6,
      color: hot ? core : edge,
      widthPx: rand(3.5, o.heavy ? 8.5 : 6.5) * p.px,
    });
    if (t.stars && Math.random() < 0.4) {
      p.spr.emit({ pos: [at.x, at.y, at.z], vel, life: 0.34, gravity: 9 * s, drag: 2.6, color: scale(core, 0.9), size: 0.2 * s, shape: 'star', fadeFrom: 0.35 });
    }
  }
  // D must-fix 4: the core flash smaller and cooler, and the rings drawn behind the fighter (`back`) and
  // fainter, so the blow reads as light round the figure, never a disc over its face.
  p.spr.emit({ pos: [at.x, at.y, at.z], life: 0.1, color: scale(core, 0.3), size: 0.16 * s, sizeEnd: 0.45 * s, shape: 'glow', fadeFrom: 0.2 });
  p.spr.emit({ pos: [at.x, at.y, at.z], life: o.heavy ? 0.26 : 0.18, color: scale(core, o.heavy ? 0.42 : 0.3), size: 0.3 * s, sizeEnd: (o.heavy ? 1.1 : 0.75) * s, shape: 'star', fadeFrom: 0.3 });
  if (o.ring) {
    p.back.emit({ pos: [at.x, at.y, at.z], life: 0.34, color: scale(tint ?? t.ring, 0.6), size: 0.2 * s, sizeEnd: (o.heavy ? 2.2 : 1.5) * s, shape: 'ring', fadeFrom: 0.3 });
    p.back.emit({ pos: [at.x, at.y, at.z], life: 0.42, color: scale(tint ?? t.ring, 0.32), size: 0.3 * s, sizeEnd: (o.heavy ? 3.2 : 2.3) * s, shape: 'ring', fadeFrom: 0.25, delay: 0.05 });
    if (o.heavy) {
      p.floor.emit({ pos: [o.foot.x, o.foot.y + 0.03, o.foot.z], life: 0.5, color: scale(tint ?? t.ring, 0.9), size: 0.3 * s, sizeEnd: 3.4 * s, shape: 'ring', flat: true, fadeFrom: 0.3 });
    }
  }
}

/** C5 fire: embers lifting off the column. */
export function fireEmbers(p: Pools, foot: Vector3, height: number, n: number): void {
  n = Math.round(n * 1.5);
  for (let i = 0; i < n; i++) {
    const x = foot.x + rand(-0.3, 0.3) * height;
    const z = foot.z + rand(-0.2, 0.2) * height;
    p.seg.emit({
      start: [x, foot.y + rand(0.1, 0.6) * height, z],
      vel: [rand(-0.6, 0.6), rand(2.5, 5.5) * (height / 2), rand(-0.3, 0.3)],
      life: rand(0.5, 1.0),
      trail: 0.06,
      gravity: -1.2,
      drag: 1.2,
      color: Math.random() < 0.5 ? [1.9, 0.95, 0.2] : [1.5, 0.42, 0.06],
      widthPx: rand(1.6, 3.2) * p.px,
      delay: rand(0, 0.35),
    });
  }
  p.floor.emit({ pos: [foot.x, foot.y + 0.03, foot.z], life: 0.9, color: [1.1, 0.4, 0.08], size: 0.4 * height, sizeEnd: 1.3 * height, shape: 'glow', flat: true, fadeFrom: 0.4 });
}

/** C5 ice: the glints a shattering spike throws. */
export function iceGlints(p: Pools, tip: Vector3, big: boolean, stars: boolean): void {
  const n = big ? 5 : 3;
  for (let i = 0; i < n; i++) {
    const vel: P3 = [rand(-2.5, 2.5), rand(0.5, 3.5), rand(-1.5, 1.5)];
    p.spr.emit({ pos: [tip.x, tip.y, tip.z], vel, life: rand(0.35, 0.6), gravity: 6, drag: 1.5, color: [0.9, 1.5, 2.0], size: big ? 0.26 : 0.16, shape: stars || Math.random() < 0.5 ? 'star' : 'glow', fadeFrom: 0.3 });
    p.seg.emit({ start: [tip.x, tip.y, tip.z], vel: scale(vel, 1.4), life: 0.3, trail: 0.03, gravity: 7, drag: 2, color: [0.8, 1.4, 1.9], widthPx: 2 * p.px });
  }
}

/**
 * C5 lightning: a branching bolt from `from` to `to`, regenerated `passes` times every 50 ms
 * (the caller schedules the passes; this draws one). `lance` = Aerospark's thicker channel.
 */
export function boltPass(p: Pools, from: Vector3, to: Vector3, color: RGB, o: { branches: number; lance?: boolean; delay?: number }): void {
  const segs = boltPath([from.x, from.y, from.z], [to.x, to.y, to.z], { branches: o.branches, depth: o.lance ? 6 : 5, roughness: o.lance ? 0.22 : 0.3 });
  const w = o.lance ? 15 : 7.5;
  for (const s of segs) {
    p.seg.emit({
      start: s.a,
      end: s.b,
      life: 0.075,
      color: scale(mix(color, [1.6, 1.6, 1.6], s.weight * 0.5), 1.1 * (0.45 + s.weight * 0.6)),
      widthPx: Math.max(1.5, w * s.weight) * p.px,
      flicker: true,
      head: 0,
      ...(o.delay !== undefined ? { delay: o.delay } : {}),
    });
  }
  p.spr.emit({ pos: [to.x, to.y, to.z], life: 0.12, color: scale(color, 0.45), size: o.lance ? 0.8 : 0.4, sizeEnd: o.lance ? 1.5 : 0.9, shape: 'glow', fadeFrom: 0.3, ...(o.delay !== undefined ? { delay: o.delay } : {}) });
}

/** FFX Overdrive (Spiral Cut and the rest): gold ribbons wound round the target. */
export function goldRibbons(p: Pools, at: Vector3, height: number, n: number): void {
  const s = height / 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = rand(0.5, 1.1) * s;
    const start: P3 = [at.x + Math.cos(a) * r, at.y + rand(-0.9, 0.9) * s, at.z + Math.sin(a) * r * 0.6];
    const tang: P3 = [-Math.sin(a) * 9 * s, rand(1, 4) * s, Math.cos(a) * 5 * s];
    p.seg.emit({ start, vel: tang, life: rand(0.35, 0.6), trail: 0.12, drag: 1.4, gravity: 2, color: i % 3 ? [1.9, 1.4, 0.5] : [2.0, 1.9, 1.4], widthPx: rand(3, 6) * p.px, delay: rand(0, 0.12) });
  }
}

/** FFX-2 Mega Flare (Chapter IV): debris and a floor ring round the party; the shell is `ShockSpheres`. */
export function megaFlareBurst(p: Pools, centre: Vector3, foot: Vector3, radius: number): void {
  for (let i = 0; i < 90; i++) {
    const th = rand(0, Math.PI * 2);
    const sp = rand(5, 14);
    p.seg.emit({
      start: [centre.x + rand(-1, 1), centre.y + rand(-0.5, 0.8), centre.z + rand(-0.6, 0.6)],
      vel: [Math.cos(th) * sp, rand(2, 9), Math.sin(th) * sp * 0.6],
      life: rand(0.5, 0.95),
      trail: 0.07,
      gravity: 12,
      drag: 1.2,
      color: Math.random() < 0.5 ? [1.8, 0.7, 1.35] : [1.8, 1.45, 1.65],
      widthPx: rand(2.5, 6) * p.px,
    });
  }
  p.floor.emit({ pos: [foot.x, foot.y + 0.04, foot.z], life: 0.9, color: [1.6, 0.6, 1.2], size: 0.5, sizeEnd: radius * 2.2, shape: 'ring', flat: true, fadeFrom: 0.35 });
  p.floor.emit({ pos: [foot.x, foot.y + 0.03, foot.z], life: 1.1, color: [0.9, 0.3, 0.7], size: radius * 0.6, sizeEnd: radius * 1.8, shape: 'glow', flat: true, fadeFrom: 0.3 });
}

/**
 * C8: a sent fiend's light pillar, embers off the burn edge and a rising column of pyreflies.
 * `pillar` false on the phone tier.
 */
export function sendOff(p: Pools, game: SpectacleGame, foot: Vector3, height: number, width: number, o: { pillar: boolean; motes: number }): void {
  const edge: RGB = game === 'ffx' ? [1.8, 1.25, 0.45] : [1.55, 0.6, 1.55];
  if (o.pillar) {
    p.spr.emit({ pos: [foot.x, foot.y + height * 1.2, foot.z], life: 1.3, color: game === 'ffx' ? [0.95, 0.85, 0.55] : [0.9, 0.55, 0.95], alpha: 0.9, size: width * 0.8, sizeEnd: width * 1.1, aspect: 3.2, shape: 'pillar', fadeFrom: 0.45 });
  }
  for (let i = 0; i < 44; i++) {
    p.seg.emit({
      start: [foot.x + rand(-0.5, 0.5) * width, foot.y + rand(0.05, 1) * height, foot.z + rand(-0.2, 0.2)],
      vel: [rand(-0.8, 0.8), rand(1.5, 4), rand(-0.4, 0.4)],
      life: rand(0.5, 1.1),
      trail: 0.07,
      gravity: -1.5,
      drag: 1.1,
      color: edge,
      widthPx: rand(1.5, 3) * p.px,
      delay: rand(0, 0.8),
    });
  }
  for (let i = 0; i < o.motes; i++) {
    const star = game === 'ffx2' && i % 5 === 0;
    p.spr.emit({
      pos: [foot.x + rand(-0.45, 0.45) * width, foot.y + rand(0.1, 0.9) * height, foot.z + rand(-0.3, 0.3)],
      vel: [rand(-0.2, 0.2), rand(0.7, 1.6), rand(-0.1, 0.1)],
      life: rand(1.6, 2.6),
      gravity: -0.35,
      drag: 0.3,
      color: star ? [1.6, 0.7, 1.45] : Math.random() < 0.5 ? [0.85, 1.45, 1.1] : [1.45, 1.3, 0.8],
      size: star ? 0.22 : rand(0.1, 0.17),
      shape: star ? 'star' : 'glow',
      wobble: rand(0.15, 0.35),
      fadeFrom: 0.6,
      delay: rand(0, 1.0),
    });
  }
}

/** C9 (FFX-2): one sparkle sweep across the party at head height. */
export function sparkleSweep(p: Pools, from: Vector3, to: Vector3): void {
  for (let i = 0; i < 16; i++) {
    const k = i / 15;
    p.spr.emit({
      pos: [from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k + rand(-0.35, 0.5), from.z + (to.z - from.z) * k],
      life: 0.7,
      color: i % 2 ? [1.7, 0.8, 1.35] : [1.7, 1.6, 1.7],
      size: rand(0.18, 0.34),
      sizeEnd: 0.05,
      shape: 'star',
      delay: k * 0.6,
      fadeFrom: 0.3,
    });
  }
}
