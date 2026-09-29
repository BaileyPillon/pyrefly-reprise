/**
 * The Sphere Grid's **rules**, on top of `sphereGridData.ts`'s loader.
 *
 * `src/data/ffx/sphere-grid/` is data only — there is no engine module that
 * walks it — so the movement/activation rules the tab needs live here, in the
 * UI's own folder, rather than as edits to the data files (which belong to
 * the data agents).
 *
 * What it does to the build
 * -------------------------
 * The model writes straight through to the live `FFXPartyBuild` the chapter
 * will be fought with, because that is what "the Sphere Grid tab works" has
 * to mean:
 *
 * - moving spends `member.sphereGrid.sLv` and moves `.position`;
 * - activating a stat node adds its value to `member.stats` (and lifts
 *   `hp`/`mp` with `maxHp`/`maxMp` so the field card below never shows a
 *   pool above its own maximum), spends one sphere from the party pouch,
 *   and records the node in `member.sphereGrid.activatedNodeIds`;
 * - activating an ability node appends the matching `AbilityId` to
 *   `member.learnedAbilityIds` when the grid's display name resolves against
 *   `ALL_ABILITIES`;
 * - opening a lock is global (every character sees it open), matching FFX.
 *
 * Costs [battle/common/types.ts `SphereGridState.sLv`]: one S.Lv per step
 * onto a node this character has not stood on, and one S.Lv per **four**
 * steps back along a path it has already travelled — tracked as quarter
 * steps so the cheap moves really are cheap rather than silently free.
 *
 * Hydration [estimate]: the shipped builds carry placeholder positions
 * (`'tidus-sphere-30'`) and empty `activatedNodeIds`, so a member whose
 * position is not a real node id is seeded from `standard-routes.json` —
 * that file's own `status` field calls itself a proposed coherent ordinary
 * route, which is exactly the right fidelity for a prep screen. Stats are
 * **not** replayed from the route: the build's stat block already reflects
 * the character's progress (see the build files' own `[estimate]` notes),
 * so replaying would double-count.
 */

import type { AbilityId, FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { effectivePool } from '../../../battle/ffx/effectiveStats.ts';
import { ALL_ABILITIES } from '../../../data/ffx/index.ts';
import {
  NODE_BY_ID,
  neighboursOf,
  routeFor,
  sphereItemId,
  statField,
  statTag,
  type GridNode,
} from './sphereGridData.ts';

/** Display name -> `AbilityId`, for the grid's `"Delay Buster"`-style names. */
const ABILITY_ID_BY_NAME: ReadonlyMap<string, AbilityId> = new Map(
  ALL_ABILITIES.filter((a) => a.game === 'ffx').map((a) => [a.name.toLowerCase(), a.id]),
);

/**
 * A pouch to spend when the chapter ships an empty one [estimate].
 *
 * Every shipped build has `sphereInventory: {}` — Gagazet's even says so
 * ("assumed fully spent building the stat blocks above"). An empty pouch
 * makes activation permanently impossible and the tab a picture rather than
 * a screen, so when the party has nothing at all the panel hands it a small
 * documented pouch of its own. It is seeded here, in the UI, and never
 * written into `src/data/ffx/builds/**`.
 */
const STARTER_POUCH: Readonly<Record<string, number>> = {
  'power-sphere': 12,
  'speed-sphere': 8,
  'mana-sphere': 8,
  'ability-sphere': 4,
  'fortune-sphere': 1,
  'lv-1-key-sphere': 4,
  'lv-2-key-sphere': 2,
  'lv-3-key-sphere': 1,
  'lv-4-key-sphere': 1,
};

/**
 * What the grid knows that the build has no field for (opened locks, the
 * ground each character has walked, the travelled steps already paid for, and
 * whether the pouch is the starter estimate), kept per build for the life of
 * the page. Leaving party prep and coming back mounts a new panel and a new
 * model on the same build object; before this, every lock the player had
 * opened closed again while its key sphere stayed spent, and an emptied pouch
 * was refilled (fb-0929). Keyed weakly, so a structured clone starts clean.
 */
interface GridSession {
  unlocked: Set<number>;
  walked: Map<string, { visited: Set<number>; quarterSteps: number }>;
  pouchIsEstimated: boolean;
}
const SESSIONS = new WeakMap<FFXPartyBuild, GridSession>();

/** Every stat but the two pools stops at 255 [ffx-combat-core §10.1 "Caps"]. */
const STAT_CAP = 255;

/** Per-character working state, kept alongside the build it writes through to. */
export interface MemberGrid {
  memberId: string;
  name: string;
  /** Node id the character stands on. */
  position: number;
  /** Nodes this character has activated. */
  activated: Set<number>;
  /** Nodes this character has stood on — cheap to walk back over. */
  visited: Set<number>;
  /** Quarter-steps banked toward the next S.Lv spent on travelled ground, 0–3. */
  quarterSteps: number;
  /** The tint this character's activated nodes and position chip carry. */
  tint: string;
}

/** What an attempted move/activation did, for the caption line under the grid. */
export interface GridActionResult {
  ok: boolean;
  /** One short sentence, already in sentence case. */
  message: string;
}

/**
 * Per-character tint for activated nodes and position chips. One hue each,
 * picked to stay legible on the `#08101E` starfield and not to collide with
 * the stat palette's own greens and oranges at chip size.
 */
const CHARACTER_TINT: Record<string, string> = {
  tidus: '#5fc8ff',
  yuna: '#ffd9e8',
  auron: '#e06a4a',
  kimahri: '#6fd8c0',
  wakka: '#ff9a3c',
  lulu: '#b07cff',
  rikku: '#b6e84a',
};
const DEFAULT_TINT = '#f2c21e';

export function characterTint(id: string): string {
  return CHARACTER_TINT[id] ?? DEFAULT_TINT;
}

/** Parse a `SphereGridState.position` that is already a real node id. */
function asNodeId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && NODE_BY_ID.has(n) ? n : null;
}

export class SphereGridModel {
  readonly build: FFXPartyBuild;
  /** Lock nodes opened by anyone — lock removal is global in FFX. */
  readonly unlocked: Set<number>;
  private readonly grids = new Map<string, MemberGrid>();
  /** Set when {@link STARTER_POUCH} was seeded, so the UI can say so. */
  readonly pouchIsEstimated: boolean;
  private readonly session: GridSession;

  constructor(build: FFXPartyBuild) {
    this.build = build;
    const earlier = SESSIONS.get(build);
    if (earlier) {
      // A later visit to party prep: the pouch is whatever the earlier visit
      // left, even empty, and is never topped up by the starter estimate again.
      this.session = earlier;
      this.unlocked = earlier.unlocked;
      this.pouchIsEstimated = earlier.pouchIsEstimated;
      for (const member of build.members) this.grids.set(member.id, this.hydrate(member));
      return;
    }

    const partyHas = Object.values(build.sphereInventory).some((n) => n > 0);
    const membersHave = build.members.some((m) => Object.values(m.sphereGrid.spheres).some((n) => n > 0));
    this.pouchIsEstimated = !partyHas && !membersHave;
    this.unlocked = new Set<number>();
    this.session = { unlocked: this.unlocked, walked: new Map(), pouchIsEstimated: this.pouchIsEstimated };
    SESSIONS.set(build, this.session);
    if (this.pouchIsEstimated) Object.assign(build.sphereInventory, STARTER_POUCH);
    else if (!partyHas) {
      // A chapter that put the spheres on the members instead: fold them into
      // the party pouch this panel spends from, so both shapes work.
      for (const m of build.members) {
        for (const [id, n] of Object.entries(m.sphereGrid.spheres)) {
          build.sphereInventory[id] = (build.sphereInventory[id] ?? 0) + n;
        }
      }
    }

    for (const member of build.members) this.grids.set(member.id, this.hydrate(member));
  }

  /** Seed one member's working state from the build, falling back to the route. */
  private hydrate(member: FFXMemberBuild): MemberGrid {
    const state = member.sphereGrid;
    const route = routeFor(member.id);
    const fromBuild = asNodeId(state.position);
    const activatedFromBuild = state.activatedNodeIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && NODE_BY_ID.has(id));

    const position = fromBuild ?? route?.position ?? route?.startNode ?? 0;
    const activated = new Set(
      fromBuild !== null && activatedFromBuild.length > 0 ? activatedFromBuild : (route?.activated ?? []),
    );
    // Travelled ground is cheap to re-cross, so the walk that got the
    // character here counts even on a second visit to the screen, when the
    // build's own `activatedNodeIds` is the more recent record.
    // The session keeps one set per character across visits, so ground walked
    // on an earlier visit stays cheap to re-cross.
    const walked = this.session.walked.get(member.id) ?? { visited: new Set<number>(), quarterSteps: 0 };
    this.session.walked.set(member.id, walked);
    for (const id of [...activated, ...(route?.visited ?? []), position]) walked.visited.add(id);
    for (const id of route?.unlocked ?? []) this.unlocked.add(id);

    // Write the resolved ids back so the placeholder strings stop travelling
    // with the build (`snapshotState()`, the battle setup, every later read).
    state.position = String(position);
    state.activatedNodeIds = [...activated].map(String);

    return {
      memberId: member.id,
      name: member.name,
      position,
      activated,
      visited: walked.visited,
      quarterSteps: walked.quarterSteps,
      tint: characterTint(member.id),
    };
  }

  gridFor(memberId: string): MemberGrid | null {
    return this.grids.get(memberId) ?? null;
  }

  /** Every member's working state, for drawing the other six position chips. */
  all(): readonly MemberGrid[] {
    return [...this.grids.values()];
  }

  memberBuild(memberId: string): FFXMemberBuild | null {
    return this.build.members.find((m) => m.id === memberId) ?? null;
  }

  /** How many of a sphere family the party pouch holds. */
  spheresHeld(family: string | null): number {
    const id = sphereItemId(family);
    return id ? (this.build.sphereInventory[id] ?? 0) : 0;
  }

  // ------------------------------------------------------------- movement

  /** A lock node blocks the path for everyone until it is opened. */
  private blocked(node: GridNode): boolean {
    return node.kind === 'lock' && !this.unlocked.has(node.id);
  }

  /** Nodes the character can step onto right now. */
  reachable(memberId: string): readonly number[] {
    const grid = this.grids.get(memberId);
    if (!grid) return [];
    return neighboursOf(grid.position).filter((id) => {
      const node = NODE_BY_ID.get(id);
      return node !== undefined && !this.blocked(node);
    });
  }

  /**
   * S.Lv a step onto `nodeId` spends **now**: 1 onto new ground; on travelled
   * ground 1 for the first of four steps and 0 for the three it paid for.
   * It used to answer 0.25 for every travelled step, so the caption promised
   * "1/4 S.Lv" and the step then took a whole one (fb-0929).
   */
  moveCost(memberId: string, nodeId: number): number {
    const grid = this.grids.get(memberId);
    if (!grid?.visited.has(nodeId)) return 1;
    return grid.quarterSteps > 0 ? 0 : 1;
  }

  /** Travelled steps the last S.Lv spent on travelled ground still covers, 0–3. */
  paidSteps(memberId: string): number {
    return this.grids.get(memberId)?.quarterSteps ?? 0;
  }

  moveTo(memberId: string, nodeId: number): GridActionResult {
    const grid = this.grids.get(memberId);
    const member = this.memberBuild(memberId);
    const node = NODE_BY_ID.get(nodeId);
    if (!grid || !member || !node) return { ok: false, message: 'No such node.' };
    if (nodeId === grid.position) return { ok: false, message: `${grid.name} is already here.` };
    if (!neighboursOf(grid.position).includes(nodeId)) return { ok: false, message: 'Not linked to this node.' };
    if (this.blocked(node)) return { ok: false, message: `Lv.${node.lockLevel ?? '?'} Lock — open it first.` };

    const travelled = grid.visited.has(nodeId);
    if (travelled) {
      // Four steps over ground already walked cost one S.Lv between them.
      if (grid.quarterSteps === 0) {
        if (member.sphereGrid.sLv < 1) return { ok: false, message: 'Not enough S.Lv to move.' };
        member.sphereGrid.sLv -= 1;
        grid.quarterSteps = 3;
      } else grid.quarterSteps -= 1;
    } else {
      if (member.sphereGrid.sLv < 1) return { ok: false, message: 'Not enough S.Lv to move.' };
      member.sphereGrid.sLv -= 1;
    }

    grid.position = nodeId;
    grid.visited.add(nodeId);
    const walked = this.session.walked.get(memberId);
    if (walked) walked.quarterSteps = grid.quarterSteps;
    member.sphereGrid.position = String(nodeId);
    return {
      ok: true,
      message: `${grid.name} moves to ${node.kind === 'lock' ? `the opened ${node.name}` : node.name}. S.Lv ${member.sphereGrid.sLv}${travelled ? ' (travelled path)' : ''}.`,
    };
  }

  // ----------------------------------------------------------- activation

  /**
   * Which node `confirm` acts on: the one the character stands on, or an
   * adjacent lock (FFX opens a lock from the node beside it, not from on top
   * of it — you cannot stand on a closed lock).
   */
  canActivate(memberId: string, nodeId: number): { ok: boolean; reason: string } {
    const grid = this.grids.get(memberId);
    const node = NODE_BY_ID.get(nodeId);
    if (!grid || !node) return { ok: false, reason: 'No such node.' };

    if (node.kind === 'lock') {
      if (this.unlocked.has(nodeId)) return { ok: false, reason: 'Already open.' };
      if (!neighboursOf(grid.position).includes(nodeId)) return { ok: false, reason: 'Stand beside the lock to open it.' };
    } else {
      if (nodeId !== grid.position) return { ok: false, reason: 'Move onto the node first.' };
      if (node.kind === 'empty') return { ok: false, reason: 'Empty nodes hold nothing.' };
      if (grid.activated.has(nodeId)) return { ok: false, reason: 'Already activated.' };
    }
    if (this.spheresHeld(node.sphere) < 1) {
      const label = node.sphere ? sphereItemId(node.sphere) : null;
      return { ok: false, reason: `No ${label?.replace(/-/g, ' ') ?? 'sphere'} left.` };
    }
    return { ok: true, reason: '' };
  }

  activate(memberId: string, nodeId: number): GridActionResult {
    const check = this.canActivate(memberId, nodeId);
    if (!check.ok) return { ok: false, message: check.reason };

    const grid = this.grids.get(memberId)!;
    const member = this.memberBuild(memberId)!;
    const node = NODE_BY_ID.get(nodeId)!;
    const itemId = sphereItemId(node.sphere)!;
    this.build.sphereInventory[itemId] = (this.build.sphereInventory[itemId] ?? 0) - 1;

    if (node.kind === 'lock') {
      this.unlocked.add(nodeId);
      return { ok: true, message: `Lv.${node.lockLevel ?? '?'} Lock opened — the path is clear for everyone.` };
    }

    grid.activated.add(nodeId);
    member.sphereGrid.activatedNodeIds = [...grid.activated].map(String);

    const field = statField(node.stat);
    if (node.kind === 'stat' && field) {
      if (field === 'maxHp' || field === 'maxMp') {
        // A pool node raises the *base* pool and the maximum follows §9's
        // `baseHP * (100 + HP%) // 100`, like every other reader of it
        // (effectiveStats.ts). Adding the node to the maximum alone left the
        // STATS tab's base unmoved and gave Tidus 2620 for 2640 (fb-0929).
        const pool = field === 'maxHp' ? 'hp' : 'mp';
        const before = member.stats[field];
        member.stats[pool] += node.value;
        member.stats[field] = effectivePool(member, pool);
        // Keep the current pool with its maximum, so the shell's field card and
        // the battle both start the character whole rather than capped below it.
        member[pool] += member.stats[field] - before;
        return { ok: true, message: `${node.name} activated — ${member.name}'s max ${pool.toUpperCase()} is now ${member.stats[field]}.` };
      }
      member.stats[field] = Math.min(STAT_CAP, member.stats[field] + node.value);
      return { ok: true, message: `${node.name} activated — ${member.name}'s ${statTag(node.stat)} is now ${member.stats[field]}.` };
    }

    if (node.kind === 'ability') {
      const id = ABILITY_ID_BY_NAME.get(node.name.toLowerCase());
      if (id && !member.learnedAbilityIds.includes(id)) member.learnedAbilityIds.push(id);
      return {
        ok: true,
        message: id
          ? `${member.name} learns ${node.name}.`
          : `${node.name} activated (not in this project's ability tables).`,
      };
    }
    return { ok: true, message: `${node.name} activated.` };
  }
}
