import '../inkgold/index.ts';
import './spherechange-wheel.css';
import { installInkGoldStyles } from '../inkgold/index.ts';
import type { GarmentGridState, GateColour, SpherechangeCommand } from '../../battle/common/types.ts';
import { dressphereLabel } from './dressphereIcons.ts';

/**
 * The Garment Grid's own node/link graph. `GarmentGridState` (in
 * `battle/common/types.ts`) only carries the *live* position and history —
 * the graph shape itself belongs to a grid record in `data/ffx2/garment-grids`
 * (owned by the data agents, and not yet written), so this presentation-layer
 * type is the wheel's input contract for that data until it lands. A data
 * agent's grid record should be trivially mappable to this shape.
 */
export interface GarmentGridLinkDef {
  from: number;
  to: number;
  gate?: GateColour;
  /** e.g. `"Firestrike (this battle)"` — §4.5.4's "GRANTS:" line. */
  gateEffectLabel?: string;
}
export interface GarmentGridDef {
  id: string;
  name: string;
  /** 2-6 entries; `dressphereId: null` is an empty node (`+` glyph, §4.5.2). */
  nodes: Array<{ dressphereId: string | null }>;
  links: GarmentGridLinkDef[];
}

export interface SpherechangeDeps {
  /** Mount point; sized to the viewport (the overlay covers the whole battle screen). */
  root: HTMLElement;
  grid: GarmentGridDef;
  state: GarmentGridState;
  actorName: string;
  /** Special dressphere this grid unlocks, if any — enables the R1 pill (§4.5.3). */
  specialDressphereId?: 'floral-fallal' | 'machina-maw' | 'full-throttle';
  onCancel: () => void;
}

/** Not part of Ink & Gold's shared palette (gameplay-semantic, not chrome) — visual-bible §4.5.2. */
const GATE_HEX: Record<GateColour, string> = {
  red: '#D0343C',
  green: '#4FB05E',
  blue: '#3A78BE',
  yellow: '#E3B94A',
};

/** The graph's own coordinate frame, shared 1:1 by the SVG viewBox and the node divs' inline `left`/`top` (see `.ffx2sc__graph` in spherechange-wheel.css) — no separate scaling step, so the two never drift apart. */
const GRAPH_W = 272;
const GRAPH_H = 150;
const CX = 136;
const CY = 75;
const RADIUS = 55;

function neighboursOf(links: GarmentGridLinkDef[], node: number): Array<{ node: number; link: GarmentGridLinkDef }> {
  const out: Array<{ node: number; link: GarmentGridLinkDef }> = [];
  for (const link of links) {
    if (link.from === node) out.push({ node: link.to, link });
    else if (link.to === node) out.push({ node: link.from, link });
  }
  return out;
}

function nodePos(i: number, n: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return { x: CX + RADIUS * Math.cos(angle), y: CY + RADIUS * Math.sin(angle) };
}

function linkTravelled(state: GarmentGridState, link: GarmentGridLinkDef): boolean {
  // A link "counts" as travelled once its gate has been passed this battle —
  // the closest we can get without the engine tracking edge history directly.
  if (link.gate) return state.passedGates.includes(link.gate);
  return false;
}

const KEY_CONFIRM = new Set(['Enter', 'Space', 'NumpadEnter', 'KeyZ']);
const KEY_CANCEL = new Set(['Escape', 'KeyX', 'Backspace']);

/**
 * Opens the full Garment Grid overlay: an Ink & Gold slab (pink `.ig--ffx2`
 * variant) holding the node/link graph — no exact FFX-2 mock exists for this
 * screen (only battle chrome was approved), so it composes the shared tokens
 * (paper panel, ink text, pink accent, Cormorant Garamond headings) rather
 * than quoting spec pixel values, and keeps the bespoke gate/node-graph SVG
 * this component owns. Resolves with the chosen `SpherechangeCommand`, or
 * never if cancelled (caller awaits a race with its own cancel handling).
 */
export function openSpherechangeWheel(deps: SpherechangeDeps): Promise<SpherechangeCommand> {
  return new Promise<SpherechangeCommand>((resolve) => {
    installInkGoldStyles();
    const { grid, state } = deps;
    const reachable = neighboursOf(grid.links, state.nodePosition);
    let selIdx = 0;

    const el = document.createElement('div');
    el.className = 'ig ig--ffx2 ffx2sc';
    deps.root.appendChild(el);

    const allFilled = grid.nodes.every((n) => n.dressphereId !== null);
    const allWorn = grid.nodes.every((n) => n.dressphereId !== null && state.wornThisBattle.includes(n.dressphereId));
    const sdspEligible = Boolean(deps.specialDressphereId) && allFilled && allWorn;

    const cleanup = (): void => {
      window.removeEventListener('keydown', onKey);
      el.remove();
    };

    const commit = (toNode: number, link: GarmentGridLinkDef | null): void => {
      const dressphereId = grid.nodes[toNode]?.dressphereId;
      if (!dressphereId) return;
      cleanup();
      resolve({
        kind: 'spherechange',
        targets: [],
        extra: {
          toDressphere: dressphereId,
          toNode,
          gatesCrossed: link?.gate ? [link.gate] : [],
        },
      });
    };

    const commitSpecial = (): void => {
      if (!sdspEligible || !deps.specialDressphereId) return;
      cleanup();
      resolve({
        kind: 'spherechange',
        targets: [],
        extra: {
          toDressphere: deps.specialDressphereId,
          toNode: state.nodePosition,
          gatesCrossed: [],
          specialDressUp: true,
        },
      });
    };

    const cancel = (): void => {
      cleanup();
      deps.onCancel();
    };

    function svgLinks(): string {
      return grid.links
        .map((link) => {
          const a = nodePos(link.from, grid.nodes.length);
          const b = nodePos(link.to, grid.nodes.length);
          const travelled = linkTravelled(state, link);
          const cls = travelled ? 'ffx2sc__link ffx2sc__link--travelled' : 'ffx2sc__link';
          const orb = link.gate
            ? `<circle class="ffx2sc__gate" cx="${(a.x + b.x) / 2}" cy="${(a.y + b.y) / 2}" r="7" fill="${GATE_HEX[link.gate]}"></circle>`
            : '';
          return `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line>${orb}`;
        })
        .join('');
    }

    function nodeTileHtml(dressphereId: string | null, state_: 'worn' | 'reachable' | 'unreachable' | 'empty'): string {
      if (!dressphereId) return `<span class="ffx2sc__tile ffx2sc__tile--empty">+</span>`;
      const letter = dressphereId.charAt(0).toUpperCase();
      return `<span class="ffx2sc__tile ffx2sc__tile--${state_}">${letter}</span>`;
    }

    function nodesHtml(): string {
      return grid.nodes
        .map((node, i) => {
          const pos = nodePos(i, grid.nodes.length);
          const isCurrent = i === state.nodePosition;
          const reach = reachable.find((r) => r.node === i);
          const isSelected = reach && reachable.indexOf(reach) === selIdx;
          const tileState = isCurrent ? 'worn' : reach ? 'reachable' : 'unreachable';
          const dim = !isCurrent && !reach ? ' ffx2sc__node--unreachable' : '';
          return `<div class="ffx2sc__node${isSelected ? ' ffx2sc__node--sel' : ''}${dim}"
            style="left:${pos.x}px;top:${pos.y}px" data-node="${i}">${nodeTileHtml(node.dressphereId, tileState)}</div>`;
        })
        .join('');
    }

    function detailHtml(): string {
      const target = reachable[selIdx];
      if (!target) return '<div class="ffx2sc__detail ffx2sc__detail--dim">No reachable dressphere.</div>';
      const id = grid.nodes[target.node]?.dressphereId;
      if (!id) return '<div class="ffx2sc__detail ffx2sc__detail--dim">Empty node.</div>';
      const gateLine = target.link.gate
        ? `<div class="ffx2sc__gate-line" style="color:${GATE_HEX[target.link.gate]}">GRANTS: ${target.link.gateEffectLabel ?? dressphereLabel(target.link.gate)}</div>`
        : '';
      return `<div class="ffx2sc__detail">
        <div class="ffx2sc__detail-name">${dressphereLabel(id)}</div>
        ${gateLine}
      </div>`;
    }

    function render(): void {
      const pill = sdspEligible
        ? `<div class="ffx2sc__sdsp" data-action="sdsp">R1&nbsp; SPECIAL DRESS UP</div>`
        : '';
      el.innerHTML = `
        <div class="ig-slab ffx2sc__panel">
          <div class="ig-slab__content ffx2sc__content">
            <div class="ffx2sc__title">GARMENT GRID <span class="ffx2sc__gridname">${grid.name.toUpperCase()}</span></div>
            <div class="ffx2sc__graph">
              <svg class="ffx2sc__svg" viewBox="0 0 ${GRAPH_W} ${GRAPH_H}">${svgLinks()}</svg>
              ${nodesHtml()}
            </div>
            ${pill}
            ${detailHtml()}
            <div class="ffx2sc__cost">${deps.actorName} &mdash; THIS CHANGE COSTS YOUR TURN</div>
          </div>
        </div>`;
      el.querySelector('[data-action="sdsp"]')?.addEventListener('click', commitSpecial);
      el.querySelectorAll<HTMLElement>('.ffx2sc__node').forEach((nodeEl) => {
        nodeEl.addEventListener('click', () => {
          const idx = Number(nodeEl.dataset['node']);
          const r = reachable.find((x) => x.node === idx);
          if (r) commit(r.node, r.link);
        });
      });
    }

    const onKey = (e: KeyboardEvent): void => {
      if (KEY_CANCEL.has(e.code)) {
        e.preventDefault();
        cancel();
        return;
      }
      if (KEY_CONFIRM.has(e.code)) {
        e.preventDefault();
        const r = reachable[selIdx];
        if (r) commit(r.node, r.link);
        return;
      }
      if ((e.code === 'KeyR' || e.code === 'PageDown') && sdspEligible) {
        e.preventDefault();
        commitSpecial();
        return;
      }
      if (!reachable.length) return;
      if (['ArrowUp', 'ArrowLeft'].includes(e.code)) {
        e.preventDefault();
        selIdx = (selIdx - 1 + reachable.length) % reachable.length;
        render();
      } else if (['ArrowDown', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
        selIdx = (selIdx + 1) % reachable.length;
        render();
      }
    };
    window.addEventListener('keydown', onKey);
    render();
  });
}
