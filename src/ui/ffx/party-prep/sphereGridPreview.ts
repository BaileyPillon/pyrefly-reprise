/**
 * The selected node's preview and WALK AND ACTIVATE, for the Sphere Grid tab's
 * option B (Bailey's pick D-295, `docs/concepts/fb-0929/sphere/option-b-layout.jpg`):
 * a card that names the node, what it gives (`STR 31 -> 33`), the sphere it
 * takes (`Power 12 -> 11`), the whole walk's S.Lv and what is left after, and
 * one button that does every step.
 *
 * **Game case: FFX only.** The Sphere Grid is FFX's levelling board
 * [research/visual-bible.md §5.4, research/ffx-combat-core.md §10].
 *
 * No second copy of the rules. {@link walkAndActivate} is only
 * {@link SphereGridModel.moveTo} once per step of {@link routeTo}'s walk and then
 * {@link SphereGridModel.activate} on the node the character stands on (or on
 * the closed lock beside it, as a click already does): the next-door
 * activation question stays exactly as the tab answers it today. It is all or
 * nothing: if any call is refused, the snapshot taken first is put back.
 *
 * The preview is the same call run **dry**: snapshot, walk and activate, read
 * what changed, restore (`restoreGrid`, the exact restore AUTO-LEARN's UNDO
 * uses). So the card's numbers are, by construction, what pressing the button
 * does.
 */

import type { StatBlock } from '../../../battle/common/types.ts';
import { restoreGrid, snapshotGrid } from './sphereGridAutoLearn.ts';
import { NODE_BY_ID, sphereItemId, sphereLabel, statField, type GridNode } from './sphereGridData.ts';
import type { GridActionResult, SphereGridModel } from './sphereGridModel.ts';
import { routeTo, type RouteStep } from './sphereGridRoute.ts';

/** What the button will do. `none`: nothing to do from here (the card says why). */
export type PreviewAction = 'walk-activate' | 'activate' | 'open' | 'walk' | 'none';

export interface NodePreview {
  nodeId: number;
  /** The grid's own name for the node: `"Strength +2"`, `"Lv. 2 Lock"`, `"Hastega"`. */
  title: string;
  action: PreviewAction;
  /** False when the button is off; `reason` then says why. */
  ok: boolean;
  reason: string;
  steps: RouteStep[];
  /** S.Lv the walk takes (activation itself takes a sphere, not S.Lv). */
  sLvCost: number;
  sLvBefore: number;
  sLvAfter: number;
  /** The sphere the node takes, and the pouch before and after; null when none is spent. */
  sphere: { family: string; label: string; before: number; after: number } | null;
  /** The stat the node raises, before and after (`STR 31 -> 33`, `MAX HP 2420 -> 2620`). */
  change: { label: string; before: number; after: number } | null;
  /** The ability the node teaches, when that is what it does. */
  learns: string | null;
}

const STAT_LABEL: Partial<Record<keyof StatBlock, string>> = {
  str: 'STR',
  def: 'DEF',
  mag: 'MAG',
  mdef: 'MDF',
  agi: 'AGI',
  acc: 'ACC',
  eva: 'EVA',
  luck: 'LCK',
  maxHp: 'MAX HP',
  maxMp: 'MAX MP',
};

/** Short family name for the card: `Power`, `Lv.2 Key`. */
export function sphereShort(family: string): string {
  return sphereLabel(family).replace(/ Sphere$/, '');
}

/** What acting on `node` means from where the character stands, before any price is checked. */
function intent(model: SphereGridModel, memberId: string, node: GridNode): { action: PreviewAction; reason: string } {
  const grid = model.gridFor(memberId)!;
  const here = grid.position === node.id;
  if (node.kind === 'lock' && !model.unlocked.has(node.id)) return { action: 'open', reason: '' };
  const spent = node.kind === 'empty' || node.kind === 'lock' || grid.activated.has(node.id);
  if (spent) {
    if (here) return { action: 'none', reason: grid.activated.has(node.id) ? 'Already activated.' : `${grid.name} stands here.` };
    return { action: 'walk', reason: '' };
  }
  if (model.spheresHeld(node.sphere) < 1) {
    const label = node.sphere ? sphereLabel(node.sphere) : 'sphere';
    if (here) return { action: 'none', reason: `No ${label} left.` };
    // Walking there is still a move the player can make; the card says the sphere is missing.
    return { action: 'walk', reason: `No ${label} left: this only walks there.` };
  }
  return { action: here ? 'activate' : 'walk-activate', reason: '' };
}

/**
 * Walk to `nodeId` and act on it, through the model's own calls only. With
 * `dry`, everything is put back afterwards and only the preview is returned.
 */
function run(model: SphereGridModel, memberId: string, nodeId: number, dry: boolean): { preview: NodePreview; result: GridActionResult } {
  const node = NODE_BY_ID.get(nodeId);
  const member = model.memberBuild(memberId);
  const grid = model.gridFor(memberId);
  const empty: NodePreview = {
    nodeId,
    title: node?.name ?? '',
    action: 'none',
    ok: false,
    reason: 'No such node.',
    steps: [],
    sLvCost: 0,
    sLvBefore: member?.sphereGrid.sLv ?? 0,
    sLvAfter: member?.sphereGrid.sLv ?? 0,
    sphere: null,
    change: null,
    learns: null,
  };
  if (!node || !member || !grid) return { preview: empty, result: { ok: false, message: empty.reason } };

  const { action, reason } = intent(model, memberId, node);
  const route = action === 'none' ? { steps: [], sLv: 0 } : routeTo(model, memberId, nodeId);
  const sLvBefore = member.sphereGrid.sLv;
  const base: NodePreview = { ...empty, action, reason, sLvBefore, sLvAfter: sLvBefore };
  if (action === 'none') return { preview: base, result: { ok: false, message: reason } };
  if (!route) {
    const why = 'No open path: a closed lock is in the way.';
    return { preview: { ...base, ok: false, reason: why }, result: { ok: false, message: why } };
  }
  const preview: NodePreview = { ...base, steps: route.steps, sLvCost: route.sLv, sLvAfter: sLvBefore - route.sLv };
  if (route.sLv > sLvBefore) {
    const why = `Needs ${route.sLv} S.Lv; ${member.name} has ${sLvBefore}.`;
    return { preview: { ...preview, ok: false, reason: why }, result: { ok: false, message: why } };
  }

  const snap = snapshotGrid(model, memberId)!;
  const field = statField(node.stat);
  const statBefore = field ? member.stats[field] : 0;
  const itemId = sphereItemId(node.sphere);
  const heldBefore = itemId ? (model.build.sphereInventory[itemId] ?? 0) : 0;

  let last: GridActionResult = { ok: true, message: '' };
  for (const step of route.steps) {
    last = model.moveTo(memberId, step.node);
    if (!last.ok) break;
  }
  const acts = action === 'walk-activate' || action === 'activate' || action === 'open';
  if (last.ok && acts) last = model.activate(memberId, nodeId);

  const heldAfter = itemId ? (model.build.sphereInventory[itemId] ?? 0) : 0;
  const done: NodePreview = {
    ...preview,
    ok: last.ok,
    reason: last.ok ? preview.reason : last.message,
    sLvAfter: member.sphereGrid.sLv,
    sphere: node.sphere && heldAfter !== heldBefore ? { family: node.sphere, label: sphereShort(node.sphere), before: heldBefore, after: heldAfter } : null,
    change:
      field && acts && member.stats[field] !== statBefore
        ? { label: STAT_LABEL[field] ?? field.toUpperCase(), before: statBefore, after: member.stats[field] }
        : null,
    learns: node.kind === 'ability' && acts ? node.name : null,
  };
  if (dry || !last.ok) restoreGrid(model, snap);
  const where = node.kind === 'lock' ? `beside the ${node.name}` : `to ${node.name}`;
  const n = route.steps.length;
  const message = !last.ok
    ? last.message
    : n > 1
      ? `${member.name} walks ${n} steps ${where} (${route.sLv} S.Lv). ${acts ? last.message : `S.Lv ${member.sphereGrid.sLv}.`}`
      : last.message;
  return { preview: done, result: { ok: last.ok, message } };
}

/** What WALK AND ACTIVATE on `nodeId` would do, without doing it (the build is left exactly as it was). */
export function previewNode(model: SphereGridModel, memberId: string, nodeId: number): NodePreview {
  return run(model, memberId, nodeId, true).preview;
}

/** Walk every step to `nodeId` and act on it, or change nothing at all. */
export function walkAndActivate(model: SphereGridModel, memberId: string, nodeId: number): GridActionResult & { preview: NodePreview } {
  const { preview, result } = run(model, memberId, nodeId, false);
  return { ...result, preview };
}
