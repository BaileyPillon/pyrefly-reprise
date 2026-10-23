/**
 * THE BOSS RE-CUT (conference demo, lane "boss-matte"; Bailey 2026-10-23 ~10:15, "Yes, re-cut both": Bahamut, Chapter IV, and Seymour Flux, Chapter I; the pick of the rank-2 mockup, option A "Clean cut-out").
 * Bailey's standing rule: "I kind of want to take the ffx/ffx-2 that I know and love and put an expedition 33 kind of spin on it"; the bar is Expedition 33 and Hades, "really professional like an indie game with a capital I".
 *
 * Two halves. The ART half is the re-cut itself (the 2x masters, the rig parts and the pose pieces of both bosses: no pale fringe in colour or alpha, torso and pin holes closed, loose strips gone, bays closed,
 * a smooth outline; `docs/handoff/boss-matte.md`). The CODE half is this file: with the art clean, the engine's own outline light would still draw a glowing rim along the new edge, and the shadow would
 * still sit under the actor's anchor rather than under the figure. So, for the two bosses only:
 *
 * - **no rim light**: the rim (`rimStrength`), the ground bounce (`bounceStrength`) and the HD-2D look's relight rim (`relightRimAmt`, one cell shared by every figure) are zero while the boss's own parts draw
 *   (`onBeforeRender` / `onAfterRender` on each part's mesh, so the party keeps its rim; nothing is written outside the draw and nothing is left changed after it);
 * - **the shadow and the turn ring sit under the figure's real footprint** (Bahamut: under the tail coil, which is not under its anchor; Seymour: under the hem and the boot, touching him): centred and sized
 *   from where the painting's bottom band lies in its content box (`BOSS_FEET`, measured from the clean idle masters), not at the actor's origin.
 *
 * **Switch** (default OFF, like every piece of the pro look): `?boss=clean`, or the shared `?pack=demo` (`?boss=today` wins over the pack, for A/B captures); only in Chapter I and Chapter IV
 * (`motion/DemoGate.ts`) and only for these two figures. Console: `__pyrefly.bossClean('clean' | 'today' | null)` (`debug/proApi.ts`). With the switch off nothing is scanned, patched or written (a part is patched the first frame the switch is on).
 *
 * Game case (AGENTS.md rule 14): Bahamut is FFX-2 only, Seymour Flux FFX only; this plumbing is the same for both, so the shared code is "both" and each table row says its game.
 * Pure but for `three` (the meshes it patches) and the address of the page.
 */
import { CanvasTexture, Vector3, type Mesh, type MeshBasicMaterial, type Object3D, type Texture } from 'three';
import { demoChapter, isDemoChapter, packDemo, queryWord } from '../../motion/DemoGate.ts';

export type BossCleanMode = 'clean' | 'today';

/** The art ids this piece covers, with the game each one is (rule 14). */
export const BOSS_CLEAN_ARTS: Readonly<Record<string, 'ffx' | 'ffx2'>> = Object.freeze({
  'ffx2-bahamut': 'ffx2', // Chapter IV
  'seymour-flux-body': 'ffx', // Chapter I
});

/**
 * Where the figure's ground footprint lies in its painting, as fractions of the silhouette's width: `cx` the centre of the lowest band, `hw` its half width. [ours], measured from the CLEAN idle masters
 * (the bottom 300 px of Bahamut's 2048 px master: the tail coil lies there; the bottom 160 px of Seymour's 2422 px master: the boot and the hem), 5th to 95th percentile of the band's alpha.
 * `squash` is the shadow ellipse's depth against its width; `boost` multiplies the engine shadow's opacity (1 = the actor's own): the arena floor is dark and the camera low, so a boss that stands far from it
 * (Bahamut: 6 world units wide at 80 px each, a shadow 18 px deep) needs a rounder and a darker shadow to read as standing on it (review major 4).
 */
export interface BossFoot {
  cx: number;
  hw: number;
  squash: number;
  boost: number;
  /** The bold pass's ellipse for this boss: its depth times `tall`, its centre `drop` of its original depth lower on the frame (a boss that stands far back on a low camera has a shadow that sits behind its own lowest edge). 1 and 0 = as it was. */
  tall: number;
  drop: number;
  /** The engine shadow's centre moves toward the camera by this many half widths of itself (0 = under the figure's plane): a plane painted from the front hides the back half of a flat ellipse centred on its foot line. */
  front: number;
}
export const BOSS_FEET: Readonly<Record<string, BossFoot>> = Object.freeze({
  'ffx2-bahamut': { cx: 0.385, hw: 0.251, squash: 1.2, boost: 1.6, tall: 1.4, drop: 0.6, front: 1.0 }, // a pool deeper than the engine's 0.5 and 1.0 half widths toward the camera, so it lies under the tail's lowest edge and not behind it, on a plateau texture (measured: the engine's blob lit 40 percent of its ellipse, a flat ellipse on the foot line showed 18 px of itself, and the bold pass's contact shadow moved the floor by under 2 levels); the bold ellipse likewise 1.4 taller and 0.6 of its depth lower
  'seymour-flux-body': { cx: 0.429, hw: 0.227, squash: 0.5, boost: 1, tall: 1, drop: 0, front: 0 }, // his shadow already reads (a 0.5 ellipse under the boot)
});

/**
 * The same footprint for each pose's own painting (review minor 1: the content box changes with the pose, so one fraction slid the shadow on every swap; Seymour's attack lunge has its boot at 0.577 of the
 * box, not 0.429). [ours], measured from the re-cut 2x masters of each pose the way the idle row was (`feet.py`: the lowest 300 px / 160 px band of the silhouette at alpha 127, 5th to 95th percentile).
 * A pose with no row (the KO's later frames, a name this table does not know) uses the idle's.
 */
export const BOSS_FEET_POSES: Readonly<Record<string, Readonly<Record<string, { cx: number; hw: number }>>>> = Object.freeze({
  'ffx2-bahamut': {
    idle: { cx: 0.385, hw: 0.251 },
    attack: { cx: 0.427, hw: 0.235 },
    cast: { cx: 0.406, hw: 0.271 },
    hurt: { cx: 0.358, hw: 0.238 },
    telegraph: { cx: 0.4, hw: 0.225 },
    ko: { cx: 0.561, hw: 0.228 },
  },
  'seymour-flux-body': {
    idle: { cx: 0.429, hw: 0.227 },
    attack: { cx: 0.577, hw: 0.169 },
    cast: { cx: 0.385, hw: 0.222 },
    hurt: { cx: 0.305, hw: 0.215 },
    telegraph: { cx: 0.385, hw: 0.17 },
    ko: { cx: 0.455, hw: 0.245 },
  },
});

/** The footprint row of a pose name (`'attack'`, `'ko.2'`, ...): its own row, else the idle's. Pure. */
export function footForPose(artId: string, pose: string | undefined): BossFoot {
  const base = BOSS_FEET[artId];
  if (!base) throw new Error(`footForPose: ${artId} is not a re-cut boss`);
  const row = pose === undefined ? undefined : BOSS_FEET_POSES[artId]?.[pose.split('.')[0]!];
  return row ? { ...row, squash: base.squash, boost: base.boost, tall: base.tall, drop: base.drop, front: base.front } : base;
}

/** `?boss=clean|today` and `?pack=demo` (pure): `today` unless `boss=clean`, or `pack=demo` with no `boss=today`. */
export function bossCleanFromSearch(search: string | undefined): BossCleanMode {
  if (search === undefined) return 'today';
  const w = queryWord(search, 'boss');
  if (w === 'today') return 'today';
  return w === 'clean' || packDemo(search) ? 'clean' : 'today';
}

let mode: BossCleanMode | null = null;
const here = (): string | undefined => (globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));

/** The switch as the page asked for it. Read once. */
export function bossCleanMode(): BossCleanMode {
  if (mode === null) mode = bossCleanFromSearch(here());
  return mode;
}

/** Tests and `__pyrefly.bossClean(...)`: force the switch (`null` reads the address again). */
export function setBossClean(value: BossCleanMode | null): void {
  mode = value;
}

/** Is this art id one of the two re-cut bosses? */
export function isCleanBossArt(artId: string | undefined): boolean {
  return artId !== undefined && Object.prototype.hasOwnProperty.call(BOSS_CLEAN_ARTS, artId);
}

/** True when the re-cut plays now for this figure: switched on, in a demo chapter, one of the two bosses (no id: any of them, for the boss card). */
export function bossCleanOn(artId?: string): boolean {
  if (bossCleanMode() !== 'clean' || !isDemoChapter(demoChapter())) return false;
  return artId === undefined ? true : isCleanBossArt(artId);
}

/** The boss card's cut-out: the switch is on and this is one of the two bosses (the card names its boss, so no chapter is asked: the two art ids are drawn only in their own chapters). */
export function bossCleanCard(artKey: string | undefined): boolean {
  return bossCleanMode() === 'clean' && isCleanBossArt(artKey);
}

/** The shadow's centre and half width in world x, from the content box's two painting-frame edges in world x (the quad's left and right corners): pure. */
export function footFit(xLeft: number, xRight: number, foot: BossFoot): { cx: number; rx: number } {
  const w = xRight - xLeft; // negative when the figure is mirrored: the left edge of the painting is then the right one on screen, and the maths stays the same
  return { cx: xLeft + foot.cx * w, rx: Math.abs(foot.hw * w) };
}

type Cell = { value: number };
interface PaintedUniforms {
  rimStrength?: Cell;
  bounceStrength?: Cell;
  relightRimAmt?: Cell;
}
type Patched = Mesh & { userData: { __bossClean?: true } };

/** The shared relight rim cell is one object for every figure: remembered once, restored after each boss part draws. */
const saved = { rim: 0, bounce: 0, relight: 0, depth: 0 };

/** What an actor must offer for the shadow fit (`PaintedActor` does: `shadow`, `contentQuad`, `position`, the named children). */
export interface FootActor extends Object3D {
  shadow: Mesh | null;
  contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]): [Vector3, Vector3, Vector3, Vector3];
}

/** What an actor may offer besides the shadow fit's needs: its current pose name, and the turn ring's base radius (`PaintedActor`: `pose`, a private `ringBaseRadius` the ring's own pulse is measured against). */
interface PoseActor {
  pose?: string;
  ringBaseRadius?: number;
}

/**
 * The boss's shadow texture: the engine's own blob falls off fast (alpha 0.95 at the centre, 0.6 at 0.3 of the radius, 0.2 at 0.62), so only about 40 percent of the ellipse reads (measured: a white additive
 * shadow lit 195 of its 503 px). A boss that stands far from the camera on a dark floor needs the dark to reach most of the ellipse: a plateau that stays dark to 0.45 of the radius and falls to nothing at the rim.
 * Null where there is no canvas (tests): the engine's blob then stays.
 */
let plateau: Texture | null | undefined;
function plateauBlob(): Texture | null {
  if (plateau !== undefined) return plateau;
  plateau = null;
  if (typeof document === 'undefined') return null;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    if (!x) return null;
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [at, a] of [[0, 0.95], [0.45, 0.9], [0.7, 0.5], [0.88, 0.14], [1, 0]] as const) g.addColorStop(at, `rgba(255,255,255,${a})`);
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    plateau = new CanvasTexture(c);
  } catch {
    plateau = null;
  }
  return plateau;
}

/** The turn ring's depth against its width: the actor's own (`PaintedActor`: 0.46) times the 0.92 the first round used. */
const RING_SQUASH = 0.46 * 0.92;

/** How fast the footprint eases between two poses' rows (seconds, time constant): a swap slides the shadow over about a tenth of a second instead of snapping it. */
const FOOT_TAU = 0.09;

/** One boss's controller, kept in the actor's `userData` by the stage. */
export class BossClean {
  private readonly quad: [Vector3, Vector3, Vector3, Vector3] = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  private readonly v = new Vector3();
  /** The footprint now: the current pose's row, eased from the last one (`BossMask.ts#bossFigure` reads it for the bold pass's ellipse). */
  readonly foot: BossFoot;
  private lastT = -1;
  private ringOwn = 1;
  private ringWritten = -1;
  private shadowWritten = -1;
  private origMap: Texture | null = null;
  private swapped = false;
  private shifted = false;

  constructor(readonly artId: string) {
    this.foot = { ...footForPose(artId, undefined) };
  }

  /** Called once per frame after the actor's own update: while the switch is on, patch any part that has appeared, then fit the shadow and the ring. With it off nothing is scanned, patched or written. */
  tick(actor: FootActor): void {
    if (!bossCleanOn(this.artId)) {
      this.release(actor);
      return;
    }
    // every frame: a rig builds a pose piece's mesh the first time a pose is asked for, and a piece drawn once unpatched shows its rim for that frame (about 60 objects, a few microseconds)
    actor.traverse((o) => this.patch(o as Patched));
    this.fit(actor);
  }

  /** The switch went off after it was on: the shadow takes back its own texture and its place (the actor rewrites its x, scale and opacity every frame; its z and map it does not). */
  private release(actor: FootActor): void {
    const sh = actor.shadow;
    if (!sh || !(this.swapped || this.shifted)) return;
    const m = sh.material as MeshBasicMaterial;
    if (this.origMap && m.map !== this.origMap) m.map = this.origMap;
    sh.position.z = 0;
    this.swapped = this.shifted = false;
  }

  private patch(m: Patched): void {
    const mat = (m as unknown as { material?: { uniforms?: PaintedUniforms } }).material;
    const u = mat?.uniforms;
    if (!u || !u.rimStrength || m.userData.__bossClean) return;
    m.userData.__bossClean = true;
    const art = this.artId;
    const before = m.onBeforeRender.bind(m);
    const after = m.onAfterRender.bind(m);
    m.onBeforeRender = (...a: Parameters<Mesh['onBeforeRender']>): void => {
      if (bossCleanOn(art)) {
        saved.rim = u.rimStrength!.value;
        saved.bounce = u.bounceStrength?.value ?? 0;
        saved.relight = u.relightRimAmt?.value ?? 0;
        saved.depth++;
        u.rimStrength!.value = 0;
        if (u.bounceStrength) u.bounceStrength.value = 0;
        if (u.relightRimAmt) u.relightRimAmt.value = 0;
      }
      before(...a);
    };
    m.onAfterRender = (...a: Parameters<Mesh['onAfterRender']>): void => {
      after(...a);
      if (saved.depth > 0) {
        saved.depth--;
        u.rimStrength!.value = saved.rim;
        if (u.bounceStrength) u.bounceStrength.value = saved.bounce;
        if (u.relightRimAmt) u.relightRimAmt.value = saved.relight;
      }
    };
  }

  /** Ease the footprint toward the pose's row (the first call snaps; `dt` is the seconds since the last one). */
  private easeFoot(pose: string | undefined, now: number): void {
    const to = footForPose(this.artId, pose);
    const dt = this.lastT < 0 ? 1e9 : Math.max(0, Math.min(0.25, now - this.lastT));
    this.lastT = now;
    const k = 1 - Math.exp(-dt / FOOT_TAU);
    this.foot.cx += (to.cx - this.foot.cx) * k;
    this.foot.hw += (to.hw - this.foot.hw) * k;
    this.foot.squash = to.squash;
    this.foot.boost = to.boost;
    this.foot.tall = to.tall;
    this.foot.drop = to.drop;
    this.foot.front = to.front;
  }

  private plateauShadow(shadow: Mesh): void {
    const m = shadow.material as MeshBasicMaterial | undefined;
    const p = plateauBlob();
    if (!m || !m.map || !p) return;
    this.origMap ??= m.map;
    if (m.map !== p) m.map = p;
    this.swapped = true;
  }

  /** The engine shadow's opacity times `boost`, once per write of the actor's own (the actor sets it every frame; a value this fit wrote and the actor has not rewritten is left as it is: nothing compounds). */
  private boostShadow(shadow: Mesh, boost: number): void {
    const m = shadow.material as { opacity?: number } | undefined;
    if (!m || typeof m.opacity !== 'number' || boost === 1) return;
    if (m.opacity === this.shadowWritten) return;
    m.opacity = Math.min(0.92, m.opacity * boost);
    this.shadowWritten = m.opacity;
  }

  /** Put the contact shadow (and the turn ring) under the figure's footprint: the centre and the width from the content quad and the pose's row, the depth from the table; the ring keeps its own pulse and ease-in. */
  private fit(actor: FootActor & PoseActor): void {
    this.easeFoot(actor.pose, (globalThis.performance?.now() ?? 0) / 1000);
    const foot = this.foot;
    actor.updateWorldMatrix(true, false);
    const q = actor.contentQuad(this.quad);
    const fit = footFit(q[0].x, q[1].x, foot);
    actor.getWorldPosition(this.v);
    const originX = this.v.x;
    const sx = Math.abs(actor.getWorldScale(this.v).x) || 1; // the group is a plain uniform scale under the scene root
    for (const o of [actor.shadow, actor.getObjectByName('turn-ring') ?? null]) {
      if (!o) continue;
      const ring = o.name === 'turn-ring';
      // the actor's own ring factor (its ease-in 0.93..1 and the 2.5 percent pulse) is its scale over its base radius: kept, not written over. A scale this fit wrote last frame and the actor has not
      // rewritten since (a hidden ring) is not the actor's: the last factor stands, so nothing feeds back.
      if (ring) {
        if (o.scale.x !== this.ringWritten) this.ringOwn = typeof actor.ringBaseRadius === 'number' && actor.ringBaseRadius > 1e-4 ? o.scale.x / actor.ringBaseRadius : 1;
      }
      const rx = (fit.rx * (ring ? 1.12 * this.ringOwn : 1)) / sx;
      o.position.x = (fit.cx - originX) / sx;
      o.scale.set(rx, rx * (ring ? RING_SQUASH : foot.squash), 1); // the turn ring stays the flat ellipse the actor draws, whatever depth the shadow takes
      if (ring) this.ringWritten = o.scale.x;
      else {
        this.boostShadow(o as Mesh, foot.boost);
        o.position.z = (fit.rx * foot.front) / sx;
        this.shifted = true;
        this.plateauShadow(o as Mesh);
      }
    }
  }
}

/** The stage's one call as it builds a figure: a controller for a re-cut boss (an enemy of one of the two art ids), else null. The meshes are patched and the shadow fitted only while the switch is on. */
export function attachBossClean(actor: Object3D, artId: string, side: string): BossClean | null {
  if (side === 'party' || !isCleanBossArt(artId)) return null;
  const c = new BossClean(artId);
  actor.userData['bossClean'] = c;
  return c;
}

/** The stage's per-frame call: tick the actor's controller, if it has one. */
export function tickBossClean(actor: Object3D): void {
  const c = actor.userData['bossClean'] as BossClean | undefined;
  if (c) c.tick(actor as FootActor);
}
