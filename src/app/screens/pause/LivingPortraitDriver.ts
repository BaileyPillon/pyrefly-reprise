/**
 * The living portrait on the Until Dawn pause (D-021, D-143 feel A2 "measured", D-320 the painted parts, D-321 the
 * eyes follow the highlight): a {@link PortraitDriver} that composites the picked face parts over each pause plate.
 *
 * For every plate the stage mounts, the driver builds one `div` that is the plate's twin (the same class list and the
 * same inline box, re-synced from the plate every frame, so it gets the same grade, push-in, cross-fade and slide mask)
 * and puts one small canvas in it at the parts' box, in percent of the plate. Nothing but the parts is ever drawn, and
 * at rest nothing is: with the driver off, or a plate without parts, the screen is today's static plate, pixel for pixel.
 *
 * The clock is {@link faceWeightsAt} from the moment the face comes up; the eyes lead the input on a 50 ms critically
 * damped spring toward the look {@link lookToward} computes from `setGaze` (a point in the frame); the fixation never
 * quite stops ({@link drift}). The iris moves in whole part pixels, so a moved iris is as sharp as the plate's own.
 * Kimahri blinks the near eye only, both Rikkus keep the wink and Auron's eyes do not move: those are the manifest's
 * `blink` and `gaze` lists, not code.
 *
 * `enabled()` is the caller's (LIVING PAINTINGS on, REDUCE MOTION off) and is read every frame, so flipping either on
 * the EYE CANDY page takes the face back to the static plate at once.
 *
 * Game case: both (shared plumbing; the parts and the manifest are per plate). No engine state, no RNG (rule 1).
 */

import type { PortraitDriver } from './PortraitStage.ts';
import { drift, faceWeightsAt, springStep } from './livingTimeline.ts';
import { glanceSide, irisOffset, lookToward, type Point } from './livingGaze.ts';
import { drawFace, FACE_REST, stateKey, type Ctx2D, type FaceState, type RenderLayer, type Scratch } from './livingRender.ts';
import { boxOf, loadPartsManifest, loadPlateImages, type Eye, type PlateParts, type Scale } from './livingParts.ts';
import '../../../ui/common/pause-living.css';

/** The eyes' spring: the A2 clip's 0.05 s. */
const EYE_TAU = 0.05;
/** Face and frame are re-measured this often (frames): the plate re-frames on a resize. */
const REMEASURE = 20;
/** A blink on request: the A2 close, shut and open times. */
const BLINK_NOW = { close: 0.05, shut: 0.033, open: 0.066 } as const;

export interface LivingDeps {
  /** LIVING PAINTINGS on and REDUCE MOTION off, answered fresh each frame. */
  enabled: () => boolean;
  /** Which part scale to draw: the phone and LOW EFFECTS tiers take the 1x parts. */
  scale: () => Scale;
  now?: () => number;
  raf?: (cb: () => void) => number;
  caf?: (id: number) => void;
}

interface Layer {
  plateId: string;
  img: HTMLImageElement;
  t0: number;
  wrap: HTMLDivElement | null;
  ctx: Ctx2D | null;
  render: RenderLayer | null;
  spec: PlateParts | null;
  /** The plate's inline style as last copied to the twin. */
  css: string;
  last: string;
  lastT: number;
  pos: Point;
  vel: Point;
  face: Point;
  look: Point;
  side: number;
  drawn: boolean;
  dead: boolean;
}

export class LivingPortraitDriver implements PortraitDriver {
  private readonly deps: LivingDeps;
  private layer: Layer | null = null;
  private leaving: Layer[] = [];
  private point: Point = { x: 0, y: 0 };
  private expression = 'neutral';
  private blinkAt = -1;
  private raf = 0;
  private frames = 0;
  private disposed = false;

  constructor(deps: LivingDeps) {
    this.deps = deps;
  }

  private now(): number {
    return this.deps.now ? this.deps.now() : typeof performance === 'undefined' ? Date.now() : performance.now();
  }

  mount(plate: HTMLImageElement, plateId: string): void {
    if (this.disposed) return;
    if (this.layer) this.leaving.push(this.layer); // the old plate's twin stays up while it fades, then goes
    this.layer = null;
    this.kick();
    if (plate.dataset['art'] === 'fallback' || plate.dataset['art'] === 'missing') return;
    const t = this.now();
    const layer: Layer = {
      plateId, img: plate, t0: t, wrap: null, ctx: null, render: null, spec: null, css: '', last: '', lastT: t,
      pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, face: { x: 0, y: 0 }, look: { x: 0, y: 0 }, side: 1, drawn: false, dead: false,
    };
    this.layer = layer;
    void this.build(layer);
  }

  private async build(layer: Layer): Promise<void> {
    const found = await loadPartsManifest();
    const spec = found?.manifest.plates[layer.plateId];
    if (!found || !spec || layer.dead) return;
    const scale = this.deps.scale();
    const images = await loadPlateImages(found.root, layer.plateId, spec, scale);
    if (!images || layer.dead || this.disposed || !layer.img.isConnected) return;
    const origin = scale === '2x' ? spec.canvas2x : spec.canvas1x;
    const [mw, mh] = found.manifest.master;
    const k = scale === '2x' ? 1 : 2; // master px per part px
    const doc = layer.img.ownerDocument;
    const wrap = doc.createElement('div');
    wrap.className = layer.img.className;
    wrap.style.cssText = layer.img.style.cssText;
    layer.css = layer.img.style.cssText;
    wrap.setAttribute('aria-hidden', 'true');
    wrap.dataset['living'] = layer.plateId;
    const canvas = doc.createElement('canvas');
    canvas.width = origin[2];
    canvas.height = origin[3];
    const pct = (v: number, of: number): string => `${((v * k) / of) * 100}%`;
    canvas.style.cssText = `left:${pct(origin[0], mw)};top:${pct(origin[1], mh)};width:${pct(origin[2], mw)};height:${pct(origin[3], mh)}`;
    wrap.appendChild(canvas);
    layer.img.after(wrap);
    const scratch = new Map<Eye, Scratch>();
    layer.wrap = wrap;
    layer.ctx = canvas.getContext('2d') as Ctx2D | null;
    layer.spec = spec;
    layer.render = {
      spec, scale, origin, images,
      scratch: (eye, w, h) => {
        const hit = scratch.get(eye);
        if (hit) return hit;
        const c = doc.createElement('canvas');
        c.width = w;
        c.height = h;
        const cx = c.getContext('2d') as Ctx2D | null;
        if (!cx) return null;
        const made = { canvas: c, ctx: cx };
        scratch.set(eye, made);
        return made;
      },
    };
    // Same animation clock as the plate it twins, when the browser can say what that is.
    const theirs = typeof layer.img.getAnimations === 'function' ? layer.img.getAnimations() : [];
    if (typeof wrap.getAnimations === 'function') {
      wrap.getAnimations().forEach((a, i) => {
        const t = theirs[i]?.currentTime;
        if (t != null) a.currentTime = t;
      });
    }
    this.measure(layer);
    wrap.dataset['ready'] = 'true';
    this.kick();
  }

  setGaze(x: number, y: number): void {
    this.point = { x, y };
    if (this.layer) this.measure(this.layer);
  }

  /** One blink, now (the A2 close, shut and open), whatever the loop is doing. */
  blink(): void {
    this.blinkAt = this.now();
  }

  /** The A2 rig has one loop; the name is remembered for the snapshot and nothing else changes. */
  setExpression(name: string): void {
    this.expression = name;
  }

  /** Face centre and frame, measured: the look and the side of the glance follow from them. */
  private measure(layer: Layer): void {
    const wrap = layer.wrap;
    const spec = layer.spec;
    if (!wrap || !spec) return;
    const r = wrap.getBoundingClientRect();
    const frame = (wrap.parentElement ?? wrap).getBoundingClientRect();
    if (!(r.width > 0) || !(frame.width > 0) || !(frame.height > 0)) return;
    const eyes = spec.gaze.length ? spec.gaze : spec.blink;
    const boxes = eyes.map((e) => spec.parts[`eye${e}-socket`] ?? spec.parts[`lid${e}-closed`]).filter((p) => !!p);
    const cx = boxes.length ? boxes.reduce((a, p) => a + boxOf(p!, '2x')[0] + boxOf(p!, '2x')[2] / 2, 0) / boxes.length : 1344;
    const cy = boxes.length ? boxes.reduce((a, p) => a + boxOf(p!, '2x')[1] + boxOf(p!, '2x')[3] / 2, 0) / boxes.length : 768;
    const sx = r.left + (cx / 2688) * r.width;
    const sy = r.top + (cy / 1536) * r.height;
    layer.face = { x: ((sx - frame.left) / frame.width) * 2 - 1, y: ((sy - frame.top) / frame.height) * 2 - 1 };
    layer.look = lookToward(this.point, layer.face);
    layer.side = glanceSide(layer.look, layer.face);
  }

  private kick(): void {
    if (this.raf || this.disposed) return;
    const raf = this.deps.raf ?? (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null);
    if (!raf) return;
    this.raf = raf(() => {
      this.raf = 0;
      this.tick();
    });
  }

  /** The twin follows the plate: its class list (entering, leaving, slid, capped) and its box. */
  private follow(layer: Layer): void {
    const wrap = layer.wrap;
    if (!wrap) return;
    if (wrap.className !== layer.img.className) wrap.className = layer.img.className;
    const css = layer.img.style.cssText;
    if (css !== layer.css) {
      layer.css = css;
      wrap.style.cssText = css;
    }
  }

  private tick(): void {
    if (this.disposed) return;
    this.frames++;
    for (const old of [...this.leaving]) {
      this.follow(old);
      if (!old.img.isConnected) {
        old.dead = true;
        old.wrap?.remove();
        this.leaving = this.leaving.filter((l) => l !== old);
      }
    }
    const layer = this.layer;
    if (layer?.wrap && layer.render && layer.ctx) {
      this.follow(layer);
      if (this.frames % REMEASURE === 0) this.measure(layer);
      this.step(layer);
    }
    if (layer?.wrap || this.leaving.length) this.kick();
  }

  /** One frame of one layer. */
  private step(layer: Layer): void {
    const spec = layer.spec!;
    const now = this.now();
    const t = (now - layer.t0) / 1000;
    const dt = Math.min(0.05, Math.max(0.001, (now - layer.lastT) / 1000));
    layer.lastT = now;
    let state: FaceState = FACE_REST;
    if (this.deps.enabled()) {
      const w = faceWeightsAt(t);
      if (this.blinkAt >= 0) {
        const f = (now - this.blinkAt) / 1000;
        const { close, shut, open } = BLINK_NOW;
        if (f > close + shut + open) this.blinkAt = -1;
        else w.aperture = Math.min(w.aperture, f < close ? 1 - f / close : f < close + shut ? 0 : (f - close - shut) / open);
      }
      const target = irisOffset(layer.look, w.glance, layer.side, spec.gazeScale);
      const d = drift(t);
      const sx = springStep(layer.pos.x, layer.vel.x, target.x + d.x * spec.gazeScale, EYE_TAU, dt);
      const sy = springStep(layer.pos.y, layer.vel.y, target.y + d.y * spec.gazeScale, EYE_TAU, dt);
      layer.pos = { x: sx.pos, y: sy.pos };
      layer.vel = { x: sx.vel, y: sy.vel };
      const k = layer.render!.scale === '2x' ? 1 : 0.5;
      const q = (v: number): number => Math.round(v * k) / k; // whole part pixels: as sharp as the plate
      const moves = spec.gaze.length > 0;
      state = { smile: w.smile, press: w.press, aperture: w.aperture, iris: moves ? { x: q(sx.pos), y: q(sy.pos) } : { x: 0, y: 0 } };
    }
    const key = stateKey(state);
    if (key === layer.last) return;
    layer.last = key;
    layer.drawn = drawFace(layer.ctx!, layer.render!, state);
    layer.wrap!.dataset['state'] = key;
  }

  /** For tests and the capture scripts. */
  snapshot(): Record<string, unknown> {
    const l = this.layer;
    return {
      plate: l?.plateId ?? null,
      ready: !!l?.wrap,
      drawn: l?.drawn ?? false,
      key: l?.last ?? '',
      look: l?.look ?? null,
      iris: l?.pos ?? null,
      expression: this.expression,
      leaving: this.leaving.length,
      frames: this.frames,
    };
  }

  dispose(): void {
    this.disposed = true;
    const caf = this.deps.caf ?? (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : null);
    if (this.raf && caf) caf(this.raf);
    this.raf = 0;
    for (const l of [this.layer, ...this.leaving]) {
      if (!l) continue;
      l.dead = true;
      l.wrap?.remove();
    }
    this.layer = null;
    this.leaving = [];
  }
}
