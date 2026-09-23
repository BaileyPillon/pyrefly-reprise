/**
 * **Evrae falls out of the sky, down through the cloud layer, gone.**
 *
 * Game case: FFX only [AGENTS.md rule 14]; Bailey's D-031 ("yes Evrae falls out
 * of the sky"), `research/ffx-evrae-airship.md` §12.5 beat 8 (line 889).
 *
 * The presenter plays the fall itself (`src/engine/BattlePresenterDepartures.ts`,
 * the `'falls-away'` departure): a lurch, then a drop down and away past the
 * deck's edge. The cloud layer it falls through belongs to the location, so it
 * is this: a cumulus bank hung just in front of Evrae, sorted among the painted
 * actors (their `renderOrder`, 10) so it covers Evrae and never the party, and
 * depth-tested, so the deck and the rail stay in front of it. It is invisible while Evrae
 * holds its spot; with the drop it fades in and climbs over the rail line,
 * closing over the falling shape; once the actor has left the field it
 * thins away where it stands.
 *
 * The range director ticks it with Evrae's actor and the current range's spot
 * ({@link FallVeil.update}); it reads positions only, so no event wiring and no
 * shared contract change. Clouds are B's lit cloud colour (`EVRAE_DAYLIGHT`).
 */

import {
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  NoColorSpace,
  PlaneGeometry,
  RepeatWrapping,
  type Group,
  type Object3D,
} from 'three';
import { rng } from '../engine/ProceduralArt.ts';
import { EVRAE_DAYLIGHT } from './evrae-airship-daylight.ts';

/** How far below its spot (world units) Evrae has to be before the veil is fully up. */
export const FALL_VEIL_FULL_DROP = 1.8;
/** Veil opacity at full drop. */
export const FALL_VEIL_PEAK = 1;
/** Sheet size, world units, and how far in front of Evrae and below its spot it hangs. */
const SIZE = { w: 13, h: 7.5 } as const;
const HANG = { dz: 1.4, dyFrom: -3.4, rise: 4.4 } as const;

/** 0..1: how far into the veil a drop of `drop` world units is. Pure, for the test. */
export function fallVeilAmount(drop: number): number {
  const t = Math.max(0, Math.min(1, (drop - 0.25) / FALL_VEIL_FULL_DROP));
  return t * t * (3 - 2 * t);
}

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

const hex = (c: number): [number, number, number] => [(c >> 16) & 255, (c >> 8) & 255, c & 255];

/**
 * A cumulus bank in B's colours: dense overlapping puffs, lit peach-white on
 * top (`cloudLit`) shading to B's cloud-in-shadow blue (`cloudShade`) below.
 * Tiles in x (puffs wrap), so it can drift with the wind.
 */
function bankCanvas(seed: number): HTMLCanvasElement {
  const W = 512;
  const H = 256;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const rand = rng(seed);
  const lit = hex(EVRAE_DAYLIGHT.cloudLit);
  const shade = hex(EVRAE_DAYLIGHT.cloudShade);
  for (let i = 0; i < 260; i++) {
    const y = H * (0.22 + Math.pow(rand(), 0.7) * 0.72);
    const x = rand() * W;
    const r = 18 + rand() * 46 * (y / H);
    const k = Math.min(1, Math.max(0, (y / H - 0.2) / 0.75));
    const col = lit.map((l, j) => Math.round(l + (shade[j]! - l) * k * 0.5));
    const a = 0.3 + rand() * 0.35;
    for (const dx of [0, -W, W]) {
      const g = ctx.createRadialGradient(x + dx, y - r * 0.25, 0, x + dx, y, r);
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`);
      g.addColorStop(0.7, `rgba(${col[0]},${col[1]},${col[2]},${a * 0.6})`);
      g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + dx, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return c;
}

/** Top edge feathered, body solid-ish, bottom feathered: alphaMap (green channel). */
function veilMaskCanvas(): HTMLCanvasElement {
  const c = canvas(64, 256);
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#000');
  g.addColorStop(0.3, '#fff');
  g.addColorStop(0.8, '#fff');
  g.addColorStop(1, '#000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  const gx = ctx.createLinearGradient(0, 0, 64, 0);
  gx.addColorStop(0, 'rgba(0,0,0,1)');
  gx.addColorStop(0.18, 'rgba(0,0,0,0)');
  gx.addColorStop(0.82, 'rgba(0,0,0,0)');
  gx.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = gx;
  ctx.fillRect(0, 0, 64, 256);
  return c;
}

export class FallVeil {
  readonly mesh: Mesh;
  private readonly mat: MeshBasicMaterial;
  private tex: CanvasTexture | null = null;
  private mask: CanvasTexture | null = null;
  private opacity = 0;

  constructor(parent: Group) {
    this.mat = new MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new Mesh(new PlaneGeometry(SIZE.w, SIZE.h), this.mat);
    this.mesh.name = 'evrae-fall-veil';
    // The painted actors' own renderOrder (10): three.js then sorts it among
    // them back to front, so it draws over Evrae (behind it) and under the
    // party (in front of it). A higher order drew the cloud over Rikku.
    this.mesh.renderOrder = 10;
    this.mesh.visible = false;
    parent.add(this.mesh);
  }

  /**
   * @param dt seconds
   * @param actor Evrae's actor, or null
   * @param spot the current range's spot for Evrae
   * @param holding true while a range shift is moving the actor (never a fall)
   */
  update(dt: number, actor: Object3D | null, spot: readonly [number, number, number], holding: boolean): void {
    const onField = !!actor && !!actor.parent;
    const drop = onField && !holding ? spot[1] - actor!.position.y : 0;
    const want = onField ? fallVeilAmount(drop) * FALL_VEIL_PEAK : 0;
    // Up with the drop at once; thins away over about a second once Evrae is gone.
    this.opacity = want >= this.opacity ? want : Math.max(want, this.opacity - dt * 0.9);
    this.mat.opacity = this.opacity;
    this.mesh.visible = this.opacity > 0.002 && this.paint();
    if (!this.mesh.visible) return;
    // The bank rises as the shape sinks, so it climbs over the rail line and
    // closes over Evrae instead of waiting below the deck's edge.
    const amount = fallVeilAmount(drop);
    if (actor && onField) {
      this.mesh.position.set(actor.position.x, spot[1] + HANG.dyFrom + amount * HANG.rise, actor.position.z + HANG.dz);
    }
    // The ship is still flying: the bank drifts with the air (`evrae-airship-sky.ts`).
    this.tex!.offset.x = (this.tex!.offset.x + dt * 0.05) % 1;
  }

  /**
   * Paint the bank the first time it is needed (canvases need a DOM, which the
   * director's headless tests do not have). False if it cannot be painted.
   */
  private paint(): boolean {
    if (this.tex) return true;
    if (typeof document === 'undefined') return false;
    // Authored pixels, like the plate (`showPlateAsPainted`): no sRGB decode.
    this.tex = new CanvasTexture(bankCanvas(97));
    this.tex.colorSpace = NoColorSpace;
    this.tex.wrapS = RepeatWrapping;
    this.mask = new CanvasTexture(veilMaskCanvas());
    this.mat.map = this.tex;
    this.mat.alphaMap = this.mask;
    this.mat.needsUpdate = true;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
    this.tex?.dispose();
    this.mask?.dispose();
  }
}
