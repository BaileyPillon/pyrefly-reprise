/**
 * THE RE-CUT BOSSES' OWN MASK, and the bold pass's one contact ellipse per boss (lane "boss-matte", 2026-10-23, review round: majors 1 and 3; `look/pro/BossClean.ts` has the rest of the switch).
 *
 * The pro arena draws two screen-space rims of its own (`LookMainShader` LOOK_CINE, `LookBoldShader` step 5): a bright ring along every figure's lit edge, in the room's key colour, over the figure mask (the frame's
 * alpha). Zeroing a figure's own rim cells (`BossClean.ts`) leaves both, so on a re-cut boss they still drew a pale line. The first answer was boxes (the boss's posed bounds, minus every other figure's padded
 * rest box); a rectangle is not a figure, so wherever another figure's box overlapped the boss's edge the rim came back (review: Bahamut's tail beside Paine, Seymour's boot beside Mortiorchis).
 *
 * Now the shaders get a MASK: a half-size render target in which every tracked painted figure is drawn flat, R = 1 for a re-cut boss and 0 for any other figure, A = 1 where a figure is. It is drawn the way the
 * frame draws the figures (the same meshes, the same camera, the same painter's order; `Scene.overrideMaterial` with a flat material that reads each mesh's own `map` and `opacity` in `onBeforeRender`, and a
 * camera layer so nothing but the figures is drawn), so at any pixel it says WHICH figure is in front. A rim pixel that belongs to a boss draws no rim; the party's, Mortiorchis's and everyone else's stay.
 *
 * Nothing is drawn while the switch is off or no boss is on screen (`on` false; the shaders' `bossMaskOn` is 0 and they draw today's rim). The mask is a normal texture uniform (null until the first draw), so the
 * main look pass without the bold pass (`?look=cinematic`, subtle strength) never sees an array to flatten (review major 3). Both games (shared plumbing); only the two bosses of `BossClean.ts` are ever flagged.
 */
import { Color, DoubleSide, LinearFilter, Mesh, MeshBasicMaterial, NoBlending, NoColorSpace, PerspectiveCamera, PlaneGeometry, RGBAFormat, Scene, ShaderMaterial, UnsignedByteType, Vector3, Vector4, WebGLRenderTarget, type Camera, type Object3D, type Texture, type WebGLRenderer } from 'three';
import { lin } from '../LookRoom.ts';
import { BossClean, bossCleanOn, footFit, isCleanBossArt, type FootActor } from './BossClean.ts';

/** The camera layer the mask pass draws (no other code in the game uses layers). */
export const MASK_LAYER = 6;
/** Alpha the flat figure needs to count as drawn (the frame's own cut is about 0.02; the fringe is read by the shaders' taps). */
const ALPHA_CUT = 0.35;
/** The mask's size against the frame (a half-size target: the shaders' taps read 2.5 frame px round a rim pixel). */
const SIZE = 0.5;
/** The boss's floor pool against its contact ellipse: how much wider and deeper, and how strong ([ours], tuned on the Chapter IV floor at 2560 x 1440). */
const POOL_REACH = { x: 1.5, y: 2.2 };
const POOL_GAIN = 0.95;

interface Tracked {
  slot: Mesh;
  actor: Object3D;
}
type Cell<T> = { value: T };
interface MaskUniforms {
  tBossMask: Cell<Texture | null>;
  bossMaskOn: Cell<number>;
}

const FLAT = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D map;
    uniform float opacity;
    uniform float uBoss;
    varying vec2 vUv;
    void main() {
      if (texture2D(map, vUv).a * opacity < ${ALPHA_CUT.toFixed(2)}) discard;
      gl_FragColor = vec4(uBoss, 0.0, 0.0, 1.0);
    }
  `,
};

/**
 * The share of a rim pixel that belongs to a boss, from the mask's samples (the pixel's own and the ring round it): the boss's R over everything drawn there. Pure; the shaders' `bossShare` is this maths.
 * 0 with nothing drawn round the pixel (a figure the mask does not know keeps today's rim).
 */
export function bossShare(samples: ReadonlyArray<{ r: number; a: number }>): number {
  let b = 0;
  let o = 0;
  for (const s of samples) {
    b += s.r;
    o += s.a - s.r;
  }
  return b / Math.max(b + o, 1e-3);
}

function makeTarget(w: number, h: number): WebGLRenderTarget {
  const t = new WebGLRenderTarget(w, h, { format: RGBAFormat, type: UnsignedByteType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false, stencilBuffer: false, generateMipmaps: false });
  t.texture.colorSpace = NoColorSpace;
  t.texture.name = 'bossMask';
  return t;
}

const shownMesh = (o: Object3D): boolean => {
  for (let n: Object3D | null = o; n; n = n.parent) if (!n.visible) return false;
  return true;
};

export class BossMask {
  /** True while the mask holds a boss this frame (the shaders' `bossMaskOn`). */
  on = false;
  readonly stats = { draws: 0, meshes: 0, bosses: 0, w: 0, h: 0 };
  private target: WebGLRenderTarget | null = null;
  private readonly flat = new ShaderMaterial({
    ...FLAT,
    uniforms: { map: { value: null as Texture | null }, opacity: { value: 1 }, uBoss: { value: 0 } },
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
    transparent: false,
    side: DoubleSide, // a plane may be mirrored
  });
  private active = false;
  private failed = false;
  private warmed = false;
  private readonly hooked = new WeakSet<Mesh>();
  private readonly flag = new Map<Mesh, number>();
  private readonly clear = new Color();
  /** The re-cut boss's contact ellipse on the frame (centre, half width, half depth: the bold pass's `uFigA` row), set by the pass's figure loop while a lowered boss is drawn. */
  readonly foot = new Vector4();

  /**
   * A pool of the room's key colour on the floor under the boss, in the pass's pool arrays (one past the effects' pools; the last slot when all are taken). The arena's grade lifts its blacks (the floor is 66
   * of 255 and the darkest a shadow reaches is about 48), so a shadow alone moves the floor by under two levels on average (measured, frozen A/B); light round it gives the shadow something to read against.
   * The pass's shader adds it at `pc.w * (0.16 + 2.4 * floor)`, not over a figure. Nothing with the mask off.
   */
  pool(PA: Vector4[], PC: Vector4[], taken: number, key: readonly [number, number, number]): void {
    if (!this.on || this.foot.z <= 0) return;
    const i = Math.min(taken, PA.length - 1);
    const c = lin([key[0], key[1], key[2]]);
    PA[i]!.set(this.foot.x, this.foot.y, this.foot.z * POOL_REACH.x, this.foot.w * POOL_REACH.y);
    PC[i]!.set(c[0], c[1], c[2], POOL_GAIN);
  }

  /** Draw the mask for this frame (or note that there is nothing to draw). Called by the bold pass after its figure loop, before the composer renders. */
  render(renderer: WebGLRenderer, scene: Scene, camera: Camera, tracked: Iterable<Tracked>, W: number, H: number): void {
    this.flag.clear();
    this.stats.bosses = 0;
    this.on = false;
    if (!bossCleanOn()) return; // the switch is off, or this is not Chapter I or IV: nothing is hooked, nothing is drawn
    let bosses = 0;
    const bossActors = new Set<Object3D>();
    const note = (slot: Mesh, boss: number): void => {
      const u = (slot.material as ShaderMaterial | undefined)?.uniforms;
      if (!u || !u['map']) return;
      if (boss && ((u['opacity']?.value as number | undefined) ?? 1) > 0.05 && shownMesh(slot)) bosses++;
      this.flag.set(slot, boss);
      if (!this.hooked.has(slot)) this.hook(slot);
    };
    for (const t of tracked) {
      const art = (t.actor.userData['bossClean'] as { artId?: string } | undefined)?.artId;
      const boss = art !== undefined && bossCleanOn(art) ? 1 : 0;
      if (boss) bossActors.add(t.actor);
      else note(t.slot, 0);
    }
    // a boss's own meshes are read from the actor, not from the pass's list (which is rescanned twice a second): a pose piece or a crossfade ghost built this frame is on the mask this frame
    for (const actor of bossActors) actor.traverse((o) => { if ((o as Mesh).isMesh) note(o as Mesh, 1); });
    this.stats.meshes = this.flag.size;
    this.stats.bosses = bosses;
    this.on = bosses > 0;
    if (!this.on) return;
    const w = Math.max(2, Math.round(W * SIZE));
    const h = Math.max(2, Math.round(H * SIZE));
    if (!this.target) this.target = makeTarget(w, h);
    else if (this.target.width !== w || this.target.height !== h) this.target.setSize(w, h);
    this.stats.w = w;
    this.stats.h = h;
    this.draw(renderer, scene, camera, this.target);
    this.stats.draws++;
  }

  /** Compile the flat material's program now (the battle screen's warm-up, before the first frame) so the first boss frame does not pay for it: one plane into a 2 x 2 target, same target options as the real one. Once, and only with the switch on. */
  warm(renderer: WebGLRenderer): void {
    if (this.warmed || !bossCleanOn()) return;
    this.warmed = true;
    try {
      const scene = new Scene();
      const cam = new PerspectiveCamera();
      cam.layers.set(MASK_LAYER);
      const plane = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial());
      plane.layers.enable(MASK_LAYER);
      plane.position.z = -2;
      scene.add(plane);
      const t = makeTarget(2, 2);
      this.draw(renderer, scene, cam, t);
      t.dispose();
      plane.geometry.dispose();
      (plane.material as MeshBasicMaterial).dispose();
    } catch {
      /* a failed warm-up costs the first frame its compile, nothing else */
    }
  }

  /** One flat draw of the figures (the layer) into `target`, every renderer and scene setting put back. */
  private draw(renderer: WebGLRenderer, scene: Scene, camera: Camera, target: WebGLRenderTarget): void {
    const prev = {
      target: renderer.getRenderTarget(),
      auto: renderer.autoClear,
      shadow: renderer.shadowMap.enabled,
      bg: scene.background,
      override: scene.overrideMaterial,
      layers: camera.layers.mask,
      alpha: renderer.getClearAlpha(),
      color: renderer.getClearColor(this.clear).getHex(),
    };
    try {
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.autoClear = false;
      renderer.clear(true, false, false);
      renderer.shadowMap.enabled = false;
      scene.background = null;
      scene.overrideMaterial = this.flat;
      camera.layers.set(MASK_LAYER);
      this.active = true;
      renderer.render(scene, camera);
    } finally {
      this.active = false;
      camera.layers.mask = prev.layers;
      scene.overrideMaterial = prev.override;
      scene.background = prev.bg;
      renderer.shadowMap.enabled = prev.shadow;
      renderer.autoClear = prev.auto;
      renderer.setClearColor(prev.color, prev.alpha);
      renderer.setRenderTarget(prev.target);
    }
  }

  /** The bold pass's one call per frame, after its figure loop: draw the mask, hand it to the pass's uniforms, and start the next frame's `bossFigure` asks again. */
  frame(renderer: WebGLRenderer, scene: Scene, camera: Camera, tracked: Iterable<Tracked>, W: number, H: number, u: Record<string, { value: unknown }>): void {
    try {
      this.render(renderer, scene, camera, tracked, W, H);
    } catch (e) {
      this.on = false; // a failed mask draw is no reason to lose the frame: the rim comes back, the settings were restored in `render`'s finally
      if (!this.failed) console.warn('boss mask: the draw failed, the rim stays on the boss', e);
      this.failed = true;
    }
    this.copyTo(u);
    drawn.clear();
  }

  /** The mask into a look pass's uniforms. Safe with no mask drawn yet (a null texture and a 0). */
  copyTo(u: Record<string, { value: unknown }>): void {
    const c = u as unknown as Partial<MaskUniforms>;
    if (!c.tBossMask || !c.bossMaskOn) return;
    c.tBossMask.value = this.target?.texture ?? null;
    c.bossMaskOn.value = this.on && this.target ? 1 : 0;
  }

  /** Put a mesh on the mask's layer and let it feed the flat material its own map and opacity while the mask is drawn (its own hooks belong to the frame and are not run). Once per mesh. */
  private hook(mesh: Mesh): void {
    this.hooked.add(mesh);
    mesh.layers.enable(MASK_LAYER);
    const before = mesh.onBeforeRender;
    const me = this; // eslint-disable-line @typescript-eslint/no-this-alias
    mesh.onBeforeRender = function (this: Mesh, ...a: Parameters<Mesh['onBeforeRender']>): void {
      if (!me.active) {
        before.apply(this, a);
        return;
      }
      const u = (this.material as ShaderMaterial).uniforms;
      const f = me.flat.uniforms;
      f['map']!.value = u['map']?.value ?? null;
      f['opacity']!.value = u['opacity']?.value ?? 1;
      f['uBoss']!.value = me.flag.get(this) ?? 0;
      me.flat.uniformsNeedUpdate = true;
    };
  }

  dispose(): void {
    this.target?.dispose();
    this.target = null;
    this.flat.dispose();
    this.on = false;
  }
}

const drawn = new Set<Object3D>();
const quad: [Vector3, Vector3, Vector3, Vector3] = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];

/**
 * The bold pass draws a contact ellipse and a reflection for every tracked painted mesh, and a rigged boss is one mesh per PART (Seymour six, Bahamut five), each standing on the columns of its own lowest
 * rows. For a re-cut boss the pass asks here: `null` when this actor is not a re-cut boss now (today's code runs); `'skip'` for the second and later parts of a boss already drawn this frame (no contact, no
 * reflection of their own); else the floor point under the WHOLE figure's footprint (the controller's `foot`, the pose's row of `BOSS_FEET`, from the painting's content box in world x) and the ellipse's half width.
 */
export function bossFigure(actor: Object3D): 'skip' | { cx: number; rx: number; tall: number; drop: number } | null {
  const c = actor.userData['bossClean'] as BossClean | undefined;
  if (!c || !isCleanBossArt(c.artId) || !bossCleanOn(c.artId)) return null;
  if (drawn.has(actor)) return 'skip';
  drawn.add(actor);
  const q = (actor as FootActor).contentQuad(quad);
  return { ...footFit(q[0].x, q[1].x, c.foot), tall: c.foot.tall, drop: c.foot.drop };
}
