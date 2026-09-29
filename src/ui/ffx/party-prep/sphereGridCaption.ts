/**
 * The words the Sphere Grid tab prints about a node: the ivory caption's
 * action line (what Enter or a click will do, and what it costs) and the
 * canvas tooltip's three lines. Pure, so both can be tested without a canvas;
 * the panel and the view only lay them out.
 *
 * FFX only: the Sphere Grid is FFX's levelling board (FFX-2 uses dresspheres
 * and the Garment Grid) [research/visual-bible.md §5.4].
 *
 * fb-0929 (a friend's playtest, "i don't get the sphere grid, feels buggy"):
 * - a travelled step was priced "1/4 S.Lv" and then took a whole S.Lv;
 * - an opened lock and an activated node still priced a sphere in the tooltip;
 * - after a click the caption said only "Enter", though the documented
 *   contract (docs/handoff/polish-sphere-grid.md) is that a second click on
 *   the selected node does the same thing.
 */

import type { SphereGridModel } from './sphereGridModel.ts';
import { statTag, type GridNode } from './sphereGridData.ts';

/** What a step onto `node` costs this character, in words that match what `moveTo` then takes. */
function moveCostText(model: SphereGridModel, memberId: string, node: GridNode): string {
  const travelled = model.gridFor(memberId)?.visited.has(node.id) === true;
  if (!travelled) return '1 S.Lv';
  if (model.moveCost(memberId, node.id) === 1) return '1 S.Lv, covers 4 travelled steps';
  const paid = model.paidSteps(memberId);
  return `no S.Lv: ${paid} travelled step${paid === 1 ? '' : 's'} already paid`;
}

/**
 * What acting on `node` does for this character, as the caption's last
 * clause. `atCursor` is true for the node the keyboard cursor (or the last
 * click) sits on, where Enter and a second click both act; a node the
 * pointer is only passing over says what a click would do.
 */
export function actionLine(model: SphereGridModel, memberId: string, node: GridNode, atCursor: boolean): string {
  const check = model.canActivate(memberId, node.id);
  const grid = model.gridFor(memberId);
  const verb = atCursor ? 'Enter or click' : 'Click';
  if (check.ok) return node.kind === 'lock' ? `${verb} opens it` : `${verb} activates it`;
  if (grid && grid.position !== node.id && model.reachable(memberId).includes(node.id)) {
    return `${verb} moves here (${moveCostText(model, memberId, node)})`;
  }
  return check.reason;
}

/** The canvas tooltip: title, what the node gives, and what it costs. */
export interface TooltipLines {
  title: string;
  sub: string;
  cost: string;
  /** True when the cost line should read as a warning (the pouch cannot pay). */
  short: boolean;
}

export function tooltipLines(model: SphereGridModel, memberId: string, node: GridNode): TooltipLines {
  if (node.kind === 'lock' && model.unlocked.has(node.id)) {
    // "A removed lock becomes an empty node" [ffx-combat-core §10.1].
    return { title: `Opened ${node.name}`, sub: 'Path only', cost: 'Opened for everyone', short: false };
  }
  const sub =
    node.kind === 'empty'
      ? 'Path only'
      : node.kind === 'stat'
        ? `+${node.value} ${statTag(node.stat)}`
        : node.kind === 'lock'
          ? 'Blocks the path'
          : 'Learns an ability';
  if (node.kind !== 'lock' && model.gridFor(memberId)?.activated.has(node.id) === true) {
    return { title: node.name, sub, cost: 'Activated', short: false };
  }
  const cost = node.sphere
    ? `${node.sphere.startsWith('key') ? `Lv.${node.sphere.slice(3)} Key` : node.sphere.replace(/^\w/, (c) => c.toUpperCase())} Sphere`
    : 'No sphere';
  const held = model.spheresHeld(node.sphere);
  return {
    title: node.name,
    sub,
    cost: node.sphere ? `${cost} — ${held} held` : cost,
    short: node.sphere !== null && held < 1,
  };
}
