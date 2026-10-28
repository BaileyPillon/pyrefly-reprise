/**
 * The fake page the in-page probe tests run against (`critic-continuity-probe.test.ts`, `critic-continuity-probe-v3.test.ts`): `window.__pyrefly.app` with a battle screen whose stage holds one painted
 * actor with two planes, a camera, a canvas and a battle log. The real engine cannot be built here (it needs WebGL); what the probe reads off it is pinned in `critic-continuity-contract.test.ts`.
 * Moved out of the probe test (pc-residues review, house rule 7: no source file over 400 lines). Game case: both (shared critic plumbing).
 */
import { createProbe } from '../../critic/runner/lib/continuity-probe.mjs';
import type { ProbeConfig } from '../../critic/runner/lib/continuity-probe.mjs';

export const CFG: ProbeConfig = { ringScale: 0.6, ringFrames: 16, maxStrips: 50, cellHeight: 120, encodePerFrame: 2, jpegQuality: 0.7, recentFrames: 14, jerkCandidatePx: 28, jerkCandidateRatio: 3, candidateWindow: 8, beforeFrames: 6, afterFrames: 6, cutPx: 120 };

/** Screen (x, y down) = (world x, 900 - world y): a camera that looks straight at a 1600x900 canvas, y up in the world. */
export const PROJ = [1 / 800, 0, 0, 0, 0, 1 / 450, 0, 0, 0, 0, 1, 0, -1, -1, 0, 1];
export const IDENT = (): number[] => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export interface Rig {
  probe: ReturnType<typeof createProbe>;
  actor: { slots: any[]; active: number; _alpha: number; poseUrls: Record<string, string>; matrixWorld: { elements: number[] } };
  app: { screens: any[]; nextFrame(): Promise<void> };
  camera: { matrixWorldInverse: { elements: number[] } };
  log: { type: string; [key: string]: unknown }[];
  screen: { fieldShown: boolean; name: string };
  step(dtMs?: number): Promise<void>;
  place(slot: number, x: number, y: number, w: number, h: number): void;
  encoded: number;
}

export function rig(over: Partial<ProbeConfig> = {}): Rig {
  let now = 1000;
  const waiters: (() => void)[] = [];
  const log: Rig['log'] = [];
  const state = { encoded: 0 };
  const mesh = () => ({ visible: true, matrixWorld: { elements: IDENT() } });
  const slot = (pose: string, fade: number) => ({ pose, fade, meta: { width: 800, height: 1000 }, mesh: mesh() });
  const actor = {
    visible: true, showFigure: true, _alpha: 1, active: 0,
    slots: [slot('idle', 1), slot('attack', 0)],
    poseUrls: { idle: '/art/characters/hero/idle.png', attack: '/art/characters/hero/attack.png' } as Record<string, string>,
    matrixWorld: { elements: IDENT() },
  };
  const place = (i: number, x: number, y: number, w: number, h: number): void => { actor.slots[i]!.mesh.matrixWorld.elements = [w, 0, 0, 0, 0, h, 0, 0, 0, 0, 1, 0, x, y, 0, 1]; };
  place(0, 400, 500, 200, 400);
  place(1, 400, 500, 200, 400);
  actor.matrixWorld.elements[12] = 400;
  actor.matrixWorld.elements[13] = 100;
  const camera = { projectionMatrix: { elements: PROJ }, matrixWorldInverse: { elements: IDENT() } };
  const canvas = { width: 1600, height: 900, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) };
  const screen = { name: 'battle', fieldShown: true, stage: { actors: new Map([['hero', { actor, side: 'party', kind: 'party', artId: 'hero' }]]), opts: { camera, canvas } } };
  const app = { screens: [screen], nextFrame: () => new Promise<void>((resolve) => waiters.push(resolve)) };
  const win = { __pyrefly: { app, battleState: () => ({ log }) } };
  const doc = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: () => undefined }), toDataURL: () => { state.encoded++; return 'data:image/jpeg;base64,QUJD'; } }) };
  const probe = createProbe({ ...CFG, ...over }, { window: win, document: doc, performance: { now: () => now } });
  const step = async (dt = 16.7): Promise<void> => { now += dt; for (const w of waiters.splice(0)) w(); await new Promise((r) => setTimeout(r, 0)); };
  return { probe, actor, app, camera, log, screen, step, place, get encoded() { return state.encoded; } };
}

export const fades = (r: Rig, a: number, b: number): void => { r.actor.slots[0].fade = a; r.actor.slots[1].fade = b; };
