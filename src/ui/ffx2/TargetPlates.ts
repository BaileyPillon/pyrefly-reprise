import './target-plates.css';
import type { BattleState, CombatantId, FFX2Combatant } from '../../battle/common/types.ts';
import type { CursorSelection } from '../ffx/TargetCursor.ts';
import { dressphereLabel } from './dressphereIcons.ts';
import {
  hintBarDrop,
  hintPlacement,
  plateMode,
  plateRow,
  toGrid,
  type GridRect,
  type PlacedPlate,
  type PlateMode,
} from './targetPlateGeometry.ts';

/**
 * The three plates the approved Targeting s3 tile draws while an FFX-2 target
 * cursor is live, and that the build lacked (critic round 10, PR-0150):
 *
 * - **TARGET plate**: `TARGET`, the target's name, and a `PART` tag when the
 *   target is a destructible part (`flags.isPart`: Vegnagun's Nodes, Bulwarks
 *   and Redoubts). A multi-target command names its whole side instead.
 * - **actor plate**: the girl whose command it is, and the dressphere she is
 *   wearing (`GUNNER`), the special dressphere's name while she is in one.
 * - **controls hint**: `ENTER CONFIRM`, `← → CHANGE TARGET`, `ESC BACK` — the
 *   middle key dropped when there is nothing to step to (one candidate, or a
 *   command that hits every candidate at once).
 *
 * The names are the combatants' own data names, never a label made up here
 * (AGENTS.md rule 6): the tile's "Vegnagun — Head" is concept text, and every
 * Vegnagun link's boss is named "Vegnagun" in `src/data/ffx2/enemies/`.
 *
 * FFX-2 only (AGENTS.md rule 14): nothing on the FFX side mounts this.
 * Placement is `targetPlateGeometry.ts`.
 */

/**
 * Grid units added to every measured width. `offsetWidth` rounds to a whole
 * unit, and a name box even 0.4 short of its text ellipsizes: "Paine" came out
 * "Pai..." at 1280x720 on a plate sized to its own rounded measure.
 */
const SLACK = 2;

/** What the plates say for one selection. */
export interface TargetPlateText {
  target: { name: string; tag: string | null };
  actor: { name: string; job: string } | null;
  /** True when the arrows step the cursor (single mode, more than one candidate). */
  canStep: boolean;
}

/** The plates' text for a live selection. Pure, for the tests. */
export function targetPlateText(
  sel: CursorSelection,
  candidates: number,
  state: BattleState | null,
  actorId: CombatantId | null,
): TargetPlateText {
  const combatants = state?.combatants ?? {};
  let target: TargetPlateText['target'];
  if (sel.mode === 'all') {
    target = { name: sel.kind === 'enemy' ? 'All enemies' : 'All allies', tag: null };
  } else {
    const id = sel.activeId ?? sel.ids[0] ?? null;
    const c = id ? combatants[id] : undefined;
    target = { name: c?.name ?? id ?? '', tag: c?.flags?.isPart ? 'PART' : null };
  }
  const who = actorId ? (combatants[actorId] as FFX2Combatant | undefined) : undefined;
  const dress = who?.dresspheres?.special?.id ?? who?.dresspheres?.current ?? null;
  const actor = who ? { name: who.name, job: dress ? dressphereLabel(dress).toUpperCase() : '' } : null;
  return { target, actor, canStep: sel.mode === 'single' && candidates > 1 };
}

/** What the HUD hands over each frame so the plates can be placed. */
export interface PlateLayoutInput {
  /** The stage's letterbox scale and top edge in viewport px. */
  scale: number;
  stageY: number;
  /** Rects on the stage grid of what shares the plates' rows. */
  chip: GridRect | null;
  command: GridRect | null;
  telegraph: GridRect | null;
  /** The help band's bottom on the grid (stage mode), or 0. */
  bandBottom: number;
  /** The help band's height in grid units while it sits in the bar above the stage, or 0. */
  bandBarHeight: number;
  /** The party column's leftmost row edge on the grid. */
  partyLeft: number | null;
  /** The field cursor's name plates and group label on the grid: the hint moves off them. */
  field: GridRect[];
  /** The grid y of the viewport's bottom edge (how far the bar under a portrait stage reaches). */
  viewBottom: number;
}

/** The live DOM the HUD owns, from which {@link plateInputFromDom} reads one frame's {@link PlateLayoutInput}. */
export interface PlateSources {
  /** The HUD root's viewport rect, and the stage's offset inside it and scale (`FFX2BattleHud.layout`). */
  host: DOMRect;
  stageX: number;
  stageY: number;
  scale: number;
  chip: HTMLElement | null;
  command: HTMLElement | null;
  telegraph: HTMLElement | null;
  /** The PR-0012 help band, and its height on the grid while it sits on the stage. */
  band: HTMLElement | null;
  bandGridHeight: number;
  /** The party column fence (`style.left` = the column's leftmost row edge on the grid). */
  partyFence: HTMLElement | null;
  /** The reticle overlay the field cursor draws its name plates on. */
  overlay: HTMLElement;
}

/** Where the plates' neighbours are this frame, on the stage grid. */
export function plateInputFromDom(src: PlateSources): PlateLayoutInput {
  const x = src.host.left + src.stageX;
  const y = src.host.top + src.stageY;
  const grid = (el: Element | null): GridRect | null => toGrid(el?.getBoundingClientRect(), x, y, src.scale);
  const bandShown = !!src.band && !src.band.hidden;
  const bandInBar = bandShown && src.band!.classList.contains('ffx2-cmd-info--bar');
  const partyLeft = parseFloat(src.partyFence?.style.left ?? '');
  const field: GridRect[] = [];
  for (const el of src.overlay.querySelectorAll('.ffx-target__plate, .ffx-target__all')) {
    const r = grid(el);
    if (r) field.push(r);
  }
  return {
    scale: src.scale,
    stageY: y,
    chip: grid(src.chip),
    command: grid(src.command),
    telegraph: grid(src.telegraph),
    bandBottom: bandShown && !bandInBar ? src.bandGridHeight : 0,
    bandBarHeight: bandInBar ? src.band!.getBoundingClientRect().height / src.scale : 0,
    partyLeft: Number.isFinite(partyLeft) ? partyLeft : null,
    field,
    viewBottom: (src.host.height - src.stageY) / src.scale,
  };
}

/** Mounts the plates into the FFX-2 HUD's stage and keeps them placed. */
export class TargetPlates {
  readonly row: HTMLElement;
  readonly target: HTMLElement;
  readonly actor: HTMLElement;
  readonly hint: HTMLElement;
  private shown = false;
  /** Natural widths in grid units, measured once per content change. */
  private natural = { target: 0, actor: 0, hint: 0 };
  private mode: PlateMode = { mode: 'stage', zoom: 1 };
  /** How far the bar hint has dropped during this target select (`hintBarDrop`'s `from`). */
  private barDrop = 0;

  constructor() {
    this.row = document.createElement('div');
    this.row.className = 'ffx2-tplates';
    this.row.hidden = true;
    this.target = document.createElement('div');
    this.target.className = 'ffx2-tplate';
    this.target.dataset['role'] = 'target-plate';
    this.target.innerHTML =
      '<span class="ffx2-tplate__label">TARGET</span><span class="ffx2-tplate__name"></span><span class="ffx2-tplate__tag" hidden></span>';
    this.actor = document.createElement('div');
    this.actor.className = 'ffx2-aplate';
    this.actor.dataset['role'] = 'actor-plate';
    this.actor.innerHTML = '<span class="ffx2-aplate__name"></span><span class="ffx2-aplate__job"></span>';
    this.row.append(this.target, this.actor);
    this.hint = document.createElement('div');
    this.hint.className = 'ffx2-ctlhint';
    this.hint.dataset['role'] = 'controls-hint';
    this.hint.hidden = true;
  }

  mount(stage: HTMLElement): void {
    stage.append(this.row, this.hint);
  }

  unmount(): void {
    this.row.remove();
    this.hint.remove();
  }

  get visible(): boolean {
    return this.shown;
  }

  /** Paint the text for a live selection. Placement follows on the next {@link layout}. */
  show(text: TargetPlateText): void {
    if (!this.shown) this.barDrop = 0;
    this.shown = true;
    this.target.querySelector('.ffx2-tplate__name')!.textContent = text.target.name;
    const tag = this.target.querySelector<HTMLElement>('.ffx2-tplate__tag')!;
    tag.hidden = !text.target.tag;
    tag.textContent = text.target.tag ?? '';
    this.actor.hidden = !text.actor;
    this.actor.querySelector('.ffx2-aplate__name')!.textContent = text.actor?.name ?? '';
    const job = this.actor.querySelector<HTMLElement>('.ffx2-aplate__job')!;
    job.textContent = text.actor?.job ?? '';
    job.hidden = !text.actor?.job;
    const keys: Array<[string, string]> = [['ENTER', 'CONFIRM']];
    if (text.canStep) keys.push(['← →', 'CHANGE TARGET']);
    keys.push(['ESC', 'BACK']);
    this.hint.replaceChildren(
      ...keys.map(([k, what]) => {
        const span = document.createElement('span');
        span.className = 'ffx2-ctlhint__key';
        const b = document.createElement('b');
        b.textContent = k;
        span.append(b, ` ${what}`);
        return span;
      }),
    );
    this.row.hidden = false;
    this.hint.hidden = false;
    this.measure();
  }

  hide(): void {
    this.shown = false;
    this.row.hidden = true;
    this.hint.hidden = true;
  }

  /** Natural widths, with every placement constraint lifted. */
  private measure(): void {
    for (const el of [this.target, this.actor, this.hint]) {
      el.style.width = '';
      el.style.left = '';
      el.classList.remove('ffx2-tplate--off');
    }
    this.row.classList.add('ffx2-tplates--measure');
    this.hint.classList.add('ffx2-ctlhint--measure');
    this.natural = {
      target: this.target.offsetWidth + SLACK,
      actor: this.actor.hidden ? 0 : this.actor.offsetWidth + SLACK,
      hint: this.hint.offsetWidth + SLACK,
    };
    this.row.classList.remove('ffx2-tplates--measure');
    this.hint.classList.remove('ffx2-ctlhint--measure');
  }

  /**
   * Keep the natural widths true after the first measure: the serif italic
   * face is fetched the first time a plate uses it, so a width measured on the
   * fallback face truncated "Node A" to "Node..." once the real face arrived.
   * A laid-out plate's full width is its box plus whatever its ellipsized name
   * is hiding; a plate that is off keeps its last measure.
   */
  private refreshNatural(): void {
    const full = (plate: HTMLElement, name: string, last: number): number => {
      if (plate.offsetWidth <= 0) return last;
      const text = plate.querySelector<HTMLElement>(name);
      const hidden = text ? text.scrollWidth - text.clientWidth : 0;
      return hidden > 0 ? plate.offsetWidth + hidden + SLACK : last;
    };
    this.natural = {
      target: full(this.target, '.ffx2-tplate__name', this.natural.target),
      actor: this.actor.hidden ? 0 : full(this.actor, '.ffx2-aplate__name', this.natural.actor),
      hint: this.hint.scrollWidth > this.hint.clientWidth ? this.hint.scrollWidth + SLACK : this.natural.hint,
    };
  }

  /** Place the plates for this frame. A plate with no free room is hidden, never drawn over the chrome. */
  layout(input: PlateLayoutInput): void {
    if (!this.shown) return;
    this.mode = plateMode({ scale: input.scale, stageY: input.stageY });
    const bar = this.mode.mode === 'bar';
    for (const el of [this.row, this.hint]) {
      el.classList.toggle(el === this.row ? 'ffx2-tplates--bar' : 'ffx2-ctlhint--bar', bar);
      el.style.setProperty('--tp-zoom', this.mode.zoom.toFixed(4));
    }
    if (bar) {
      // In the bar the row stacks above the help band; the CSS lays the plates out.
      this.row.style.setProperty('--tp-above', `${(input.bandBarHeight + 2).toFixed(2)}px`);
      for (const el of [this.target, this.actor, this.hint]) {
        el.style.left = '';
        el.style.top = '';
        el.style.width = '';
        el.classList.remove('ffx2-tplate--off');
      }
      // The hint drops down the bar past any field name plate docked there
      // (a figure standing low on the stage), or hides if the bar runs out.
      this.hint.style.setProperty('--tp-drop', '0px');
      const height = this.hint.offsetHeight * this.mode.zoom;
      let drop = hintBarDrop({ height, viewBottom: input.viewBottom, field: input.field, from: this.barDrop });
      // Out of bar below the settled spot: try again from the top of the bar before hiding.
      if (drop === null && this.barDrop > 0) drop = hintBarDrop({ height, viewBottom: input.viewBottom, field: input.field });
      this.hint.classList.toggle('ffx2-tplate--off', drop === null);
      if (drop !== null) {
        this.barDrop = drop;
        this.hint.style.setProperty('--tp-drop', `${drop.toFixed(2)}px`);
      }
      return;
    }
    this.refreshNatural();
    const row = plateRow({
      chip: input.chip,
      command: input.command,
      telegraph: input.telegraph,
      bandBottom: input.bandBottom,
      targetW: this.natural.target,
      actorW: this.natural.actor,
    });
    place(this.target, row.target);
    place(this.actor, this.actor.hidden ? null : row.actor);
    this.hint.style.removeProperty('--tp-drop');
    place(this.hint, hintPlacement({ width: this.natural.hint, partyLeft: input.partyLeft, field: input.field }));
  }
}

function place(el: HTMLElement, at: PlacedPlate | null): void {
  el.classList.toggle('ffx2-tplate--off', !at);
  if (!at) return;
  el.style.left = `${at.left.toFixed(2)}px`;
  el.style.top = `${at.top.toFixed(2)}px`;
  el.style.width = `${at.width.toFixed(2)}px`;
}
