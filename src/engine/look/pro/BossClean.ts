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
 * (`motion/DemoGate.ts`) and only for these two figures. Console: `__pyrefly.bossClean('clean' | 'today' | null)` (`debug/proApi.ts`). With the switch off nothing is patched and no number is written.
 *
 * Game case (AGENTS.md rule 14): Bahamut is FFX-2 only, Seymour Flux FFX only; this plumbing is the same for both, so the shared code is "both" and each table row says its game.
 * Pure but for `three` (the meshes it patches) and the address of the page.
 */
import { Vector3, type Mesh, type Object3D } from 'three';
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
 * `squash` is the shadow ellipse's depth against its width.
 */
export interface BossFoot {
  cx: number;
  hw: number;
  squash: number;
}
export const BOSS_FEET: Readonly<Record<string, BossFoot>> = Object.freeze({
  'ffx2-bahamut': { cx: 0.38, hw: 0.251, squash: 0.5 },
  'seymour-flux-body': { cx: 0.443, hw: 0.227, squash: 0.5 },
});

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

/** One boss's controller, kept in the actor's `userData` by the stage. */
export class BossClean {
  private readonly quad: [Vector3, Vector3, Vector3, Vector3] = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  private readonly v = new Vector3();

  constructor(readonly artId: string) {}

  /** Called once per frame after the actor's own update: patch any part that has appeared, then fit the shadow and the ring. */
  tick(actor: FootActor): void {
    // every frame: a rig builds a pose piece's mesh the first time a pose is asked for, and a piece drawn once unpatched shows its rim for that frame (about 60 objects, a few microseconds)
    actor.traverse((o) => this.patch(o as Patched));
    if (bossCleanOn(this.artId)) this.fit(actor);
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

  /** Put the contact shadow (and the turn ring) under the figure's footprint: the centre and the width from the content quad, the depth from the table. */
  private fit(actor: FootActor): void {
    const foot = BOSS_FEET[this.artId];
    if (!foot) return;
    actor.updateWorldMatrix(true, false);
    const q = actor.contentQuad(this.quad);
    const fit = footFit(q[0].x, q[1].x, foot);
    actor.getWorldPosition(this.v);
    const originX = this.v.x;
    const sx = Math.abs(actor.getWorldScale(this.v).x) || 1; // the group is a plain uniform scale under the scene root
    for (const o of [actor.shadow, actor.getObjectByName('turn-ring') ?? null]) {
      if (!o) continue;
      const ring = o.name === 'turn-ring';
      const rx = (fit.rx * (ring ? 1.12 : 1)) / sx;
      o.position.x = (fit.cx - originX) / sx;
      o.scale.set(rx, rx * foot.squash * (ring ? 0.92 : 1), 1);
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
