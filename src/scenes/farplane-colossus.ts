import type { Object3D } from 'three';
import type { BattleCamera, CameraRig } from '../engine/BattleCamera.ts';
import type { PartAnchor, PartAnchors } from '../engine/PartAnchors.ts';
import { PHONE_BATTLE_QUERY } from '../ui/common/phoneBattle.ts';
import { findFigure } from './cavern-stolen-fayth-cast.ts';
import { FARPLANE_STAGING } from './farplane-parts.ts';
import { ColossusContactShadow } from './farplane-colossus-shadow.ts';

// ---------------------------------------------------------------------------
// Vegnagun as a colossus: option A, part-scale staging (FFX-2 only)
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. Chapter V's four Vegnagun links
// have no FFX counterpart; no other chapter stages these combatant ids, and on
// any other field (Chapter XI's placeholder Shiva, Shuyin at link 5) this
// module leaves the Farplane exactly as it was.
//
// On whose word: Bailey, 2026-09-26 ~19:30 EDT, "i'll go with all your
// recommendations, i love it.", answering the B3 options round
// (`docs/concepts/vegnagun-colossus-2026-09-26/README.md`, recommendation A).
// Source for the direction: `research/visual-bible.md` §1.18 ("no single camera
// frame ever contains it; the player fights a leg that fills the screen, then a
// tail, then a chest, then a cannon-headed skull"; an art-direction note) and
// `research/ffx2-vegnagun-shuyin.md` (link order, "Nodes hang far overhead").
//
// What option A is. Each link's part is pinned and sized from its own table
// (4.3 to 6.3 times a girl's height at 1600x900), a low master camera looks up
// at it (fov 40 in place of today's level fov-32 `idle`), the boss push (the
// `enemy` rig, which the reveal and every enemy action move to) goes up the part
// instead of into the girls' backs, and the Farplane backdrop grows 1.8 times
// and rises 6 so its horizon stays behind the part. The girls stand where they
// stand today; the camera makes them small at lower left. An upright phone has
// its own table so the part stays on screen at every link.
//
// Every number below is the option's own mock value (its README, "Mock values",
// and `mock-scripts/drive.mjs.txt`), eyeballed for the mock in the running
// renderer, with one correction: the build matches the approved frames, not the
// listed x of the two parts the mock did not pin. The mock's console set the tail
// to x -5.0 and the head to x 13.5, but the stage re-solved both unpinned figures'
// x after that (the leg and body were pinned already and stayed put), so the
// frames Bailey approved show the tail at x 9.74 and the head at x 0.33 on a
// desktop, 0.79 and -4.32 on a phone. Those were solved here from the mock's own
// capture report (projected rects, and the Redoubt rings' world points), and the
// leg and body solved back to their listed values within 0.05, which checks the
// method. Staging, not game data.

/** The four links, in the sourced chain order. */
export type ColossusLink = 'tail' | 'leg' | 'body' | 'head';
export const COLOSSUS_LINK_ORDER: readonly ColossusLink[] = ['tail', 'leg', 'body', 'head'];

/** The combatant id each link's part is staged under (`src/data/ffx2/enemies/vegnagun-*.ts`). */
export const COLOSSUS_LINK_IDS: Readonly<Record<ColossusLink, string>> = {
  tail: 'vegnagun-tail',
  leg: 'vegnagun-leg',
  body: 'vegnagun-body',
  head: 'vegnagun-head',
};

/** Who takes the field after the machine (link 5): the Farplane goes back to today's framing for him. */
export const COLOSSUS_OFF_IDS: readonly string[] = ['shuyin'];

/**
 * The world height every part had when the mock scaled it: the stage's default
 * boss height (`resolveSceneHeights`, the Farplane publishes no `enemyHeight`;
 * measured 4.1 on all four links at 1600x900). A part's height is this times
 * its table's scale, exactly what the mock's uniform `scale.set(s)` drew.
 */
export const COLOSSUS_PART_BASE_HEIGHT = 4.1;

export interface ColossusPart {
  /** World feet point, pinned (`SceneStaging.enemySpots`). */
  readonly spot: [number, number, number];
  /** Times {@link COLOSSUS_PART_BASE_HEIGHT}. */
  readonly scale: number;
  /** Drawn mirrored (the head, so the barrel points down at the girls). */
  readonly mirror: boolean;
}

export interface ColossusTable {
  readonly parts: Readonly<Record<ColossusLink, ColossusPart>>;
  /** The low master camera, replacing `idle` while a part is staged. */
  readonly idle: CameraRig & { position: [number, number, number]; lookAt: [number, number, number] };
  /** The push up the part, replacing `enemy` while a part is staged. */
  readonly push: CameraRig & { position: [number, number, number]; lookAt: [number, number, number] };
}

export const COLOSSUS_TABLES: Readonly<{ desktop: ColossusTable; phone: ColossusTable }> = {
  desktop: {
    parts: {
      tail: { spot: [9.74, -1.4, -17], scale: 5.6, mirror: false },
      leg: { spot: [3.2, 0, -12], scale: 5.5, mirror: false },
      body: { spot: [-4.6, 0, -16], scale: 4.3, mirror: false },
      head: { spot: [0.33, 1.6, -15], scale: 4.8, mirror: true },
    },
    idle: { position: [1.2, 1.15, 14.5], lookAt: [1.8, 3.4, -4], fov: 40, sway: 0.6 },
    push: { position: [1.35, 1.0, 12.0], lookAt: [1.9, 3.9, -4], fov: 40, sway: 0.6 },
  },
  phone: {
    parts: {
      tail: { spot: [0.79, -0.6, -17], scale: 3.9, mirror: false },
      leg: { spot: [0.6, 0, -12], scale: 4.6, mirror: false },
      body: { spot: [-4.6, 0, -16], scale: 2.7, mirror: false },
      head: { spot: [-4.32, 1.2, -15], scale: 3.6, mirror: true },
    },
    idle: { position: [1.9, 1.15, 14.5], lookAt: [2.5, 3.6, -4], fov: 40, sway: 0.6 },
    push: { position: [2.0, 1.0, 12.2], lookAt: [2.6, 4.1, -4], fov: 40, sway: 0.6 },
  },
};

/** The backdrop meshes that grow with the machine, and by how much (the mock's `bg(1.8, 6)`). */
export const COLOSSUS_BACKDROP = {
  names: ['backdrop-painting', 'backdrop-layer-0', 'backdrop-layer-1', 'farplane-haze', 'mist-0', 'mist-1'],
  scale: 1.8,
  lift: 6,
} as const;

/** The part rings draw over the paintings (the mock's `ringsOver(true)`; `PartRings` uses 7). */
const RING_ORDER_OVER = 11;
const RING_PREFIX = 'part-ring:';

/**
 * The figure-less parts re-anchored for the colossus (the mock's `anchor()` and
 * `ringScale()` calls). Nodes hang far higher over the scaled leg. The Bulwark
 * rings stand upright on the body's feet (y 700 of the 1213x827 painting): at
 * 4.3 times a flat ring on the floor line was a sliver. Each ring grows with
 * its part, and with it the target bracket and the selection accent, which
 * the stage sizes from the same radius (`StageAnchors.anchoredRingRadius`).
 */
function colossusAnchors(t: ColossusTable): PartAnchors {
  const out: Record<string, PartAnchor> = {};
  for (const [id, a] of Object.entries(FARPLANE_STAGING.partAnchors)) {
    if (a.mode === 'overhead') {
      out[id] = a;
      continue;
    }
    const k = id.startsWith('bulwark') ? t.parts.body.scale : t.parts.head.scale;
    const bulwark = id.startsWith('bulwark');
    out[id] = {
      ...a,
      ...(bulwark ? { px: [a.px[0], 700] as [number, number] } : {}),
      ring: { radius: a.ring.radius * k, ground: bulwark ? false : a.ring.ground },
    };
  }
  out['node-a'] = { mode: 'overhead', offset: [6, 40, -4] };
  out['node-b'] = { mode: 'overhead', offset: [10, 46, 0] };
  out['node-c'] = { mode: 'overhead', offset: [6, 40, 4] };
  return out;
}

/** The staging switches the Farplane publishes under option A. */
export interface ColossusStaging {
  readonly partAnchors: PartAnchors;
  readonly enemySpots: Readonly<Record<string, [number, number, number]>>;
  readonly figureHeights: Readonly<Record<string, number>>;
  readonly holdParty: true;
}

/** Today's Farplane staging with each Vegnagun part pinned, sized and re-anchored from `phone`'s table. */
export function colossusStaging(phone: boolean): ColossusStaging {
  const t = phone ? COLOSSUS_TABLES.phone : COLOSSUS_TABLES.desktop;
  const enemySpots: Record<string, [number, number, number]> = { ...FARPLANE_STAGING.enemySpots };
  const figureHeights: Record<string, number> = {};
  for (const link of COLOSSUS_LINK_ORDER) {
    const id = COLOSSUS_LINK_IDS[link];
    enemySpots[id] = [...t.parts[link].spot];
    figureHeights[id] = COLOSSUS_PART_BASE_HEIGHT * t.parts[link].scale;
  }
  return { partAnchors: colossusAnchors(t), enemySpots, figureHeights, holdParty: true };
}

/** The latest Vegnagun link in chain order with its part staged under `root`, or null. */
export function colossusLinkOf(root: Object3D | null): ColossusLink | null {
  for (let i = COLOSSUS_LINK_ORDER.length - 1; i >= 0; i--) {
    const link = COLOSSUS_LINK_ORDER[i]!;
    if (findFigure(root, COLOSSUS_LINK_IDS[link])) return link;
  }
  return null;
}

/** True when the phone battle HUD takes this window. Read once, when the scene is built (as the Road does). */
export function colossusOnPhone(
  win: { matchMedia?: Window['matchMedia'] } | undefined = typeof window === 'undefined' ? undefined : window,
): boolean {
  return win?.matchMedia?.(PHONE_BATTLE_QUERY).matches === true;
}

/** The camera move when the staging switches under an idle camera, ms. */
const RETARGET_MS = 600;

/**
 * Keeps the Farplane on option A's framing while a Vegnagun part is staged:
 * the `idle` and `enemy` rigs, the grown backdrop, the head's mirror and the
 * rings drawn over the paintings. Between two links (one part gone, the next
 * not yet staged) it holds; when Shuyin takes the field it gives back today's
 * rigs and backdrop exactly.
 */
export class VegnagunColossus {
  readonly staging: ColossusStaging;
  private readonly table: ColossusTable;
  private camera: BattleCamera | null = null;
  private on = false;
  private readonly backdropOrig = new Map<Object3D, { sx: number; sy: number; y: number }>();
  /** PR-0072: the part's contact shadow, where it meets the plain on screen. */
  private readonly contact: ColossusContactShadow;

  constructor(
    private readonly today: Readonly<Record<string, CameraRig>>,
    private readonly group: Object3D,
    phone: boolean,
  ) {
    this.table = phone ? COLOSSUS_TABLES.phone : COLOSSUS_TABLES.desktop;
    this.staging = colossusStaging(phone);
    this.contact = new ColossusContactShadow(group);
  }

  /** The battle camera to drive, or null to let go of it. */
  bind(camera: BattleCamera | null): void {
    this.camera = camera;
    if (camera && this.on) this.setRigs(true);
  }

  /** True while the colossus framing is on. */
  get active(): boolean {
    return this.on;
  }

  /** Call every frame with the three.js scene the stage parents its figures in. */
  update(root: Object3D | null): void {
    const link = colossusLinkOf(root);
    if (link && !this.on) this.switchTo(true);
    else if (!link && this.on && COLOSSUS_OFF_IDS.some((id) => findFigure(root, id))) this.switchTo(false);
    if (!this.on || !root) return;
    const head = findFigure(root, COLOSSUS_LINK_IDS.head);
    if (head && this.table.parts.head.mirror && head.scale.x > 0) head.scale.x = -head.scale.x;
    this.contact.update(root, this.camera?.camera ?? null);
    for (const child of root.children) {
      if (child.name.startsWith(RING_PREFIX) && child.renderOrder < RING_ORDER_OVER) child.renderOrder = RING_ORDER_OVER;
    }
  }

  private switchTo(on: boolean): void {
    this.on = on;
    if (!on) this.contact.hide();
    this.setRigs(on);
    this.setBackdrop(on);
  }

  private setRigs(on: boolean): void {
    const cam = this.camera;
    if (!cam) return;
    const idle = on ? this.table.idle : this.today['idle'];
    const enemy = on ? this.table.push : this.today['enemy'];
    if (idle) cam.addRig('idle', idle);
    if (enemy) cam.addRig('enemy', enemy);
    if (cam.rigName === 'idle') void cam.moveTo('idle', RETARGET_MS, 'cubicInOut');
  }

  private setBackdrop(on: boolean): void {
    const names: readonly string[] = COLOSSUS_BACKDROP.names;
    this.group.traverse((n) => {
      if (!names.includes(n.name)) return;
      let o = this.backdropOrig.get(n);
      if (!o) {
        o = { sx: n.scale.x, sy: n.scale.y, y: n.position.y };
        this.backdropOrig.set(n, o);
      }
      const k = on ? COLOSSUS_BACKDROP.scale : 1;
      n.scale.x = o.sx * k;
      n.scale.y = o.sy * k;
      n.position.y = o.y + (on ? COLOSSUS_BACKDROP.lift : 0);
    });
  }
}
