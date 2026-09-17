/**
 * FFX-2 damage / heal / miss numerals.
 *
 * FFX-2 battles shipped with **no numerals at all**: `BattleScreen` only builds
 * a `DamageNumbersPort` when `ui/common` has registered a factory or when there
 * is no HUD (`BattlePresenterFallbacks.uiPortsRegistered()`), and nothing
 * registers one — so with a HUD mounted the presenter's `damageNumbers` port is
 * `null` and the figure was simply never drawn. `docs/CONTRACT-CHANGES.md`
 * decision 12 settles where it belongs: the HUD mounted for a battle owns its
 * numerals, and both games share the one implementation in
 * `src/ui/common/DamageNumbers.ts`. The FFX side adapts it in
 * `src/ui/ffx/DamageNumbers.ts`; this is the FFX-2 adapter.
 *
 * It supplies only what is FFX-2-specific: the letterbox scale (§3.6's sizes
 * are quoted on the 640x360 grid and this layer is unscaled, so without it a
 * plain hit draws at 16 real pixels), and which HUD slabs a numeral must not
 * land inside — the party panel, the command stack and the boss strip are all
 * opaque ink.
 *
 * Shared module, other owner: `src/ui/common/DamageNumbers.ts` was refactored
 * by another agent while this landed, and everything this file touches
 * (`DamageNumbersOptions`, `mount`/`unmount`/`clear`, `spawnEvent`, `update`)
 * is confined here, so if that API moves again this is the only place to fix.
 *
 * Motion is driven from `HudPort.update(dt)`, not from a `requestAnimationFrame`
 * of its own, so numerals freeze with the rest of the game when `App.stop()`
 * pauses the loop for a screenshot — the same reason `FFXBattleHud` does it.
 */

import { DamageNumbers, type NumeralAnchor } from '../common/DamageNumbers.ts';
import type { NumeralRect } from '../common/damageLadder.ts';
import type { BattleEvent, CombatantId } from '../../battle/common/types.ts';

/** The projector `HudPort.setProjector` hands the HUD. */
export type Projector = (
  id: CombatantId,
  anchor?: NumeralAnchor,
) => { x: number; y: number } | null;

/**
 * Opaque FFX-2 HUD slabs a numeral has to dodge. Queried live rather than
 * cached: the command stack grows a level at a time, the boss strip grows a
 * row when a part appears, and the telegraph banner comes and goes.
 */
const PANEL_SELECTORS = [
  '.ig-stat-list',
  '.ffx2hud__command',
  '.ig-cmd-stack',
  '.ffx2hud__enemies',
  '.ffx2hud__telegraph',
] as const;

export interface DamageLayerOptions {
  /** The `.ffx2hud` root, for the panel query and the letterbox scale. */
  host: HTMLElement;
  /** HUD-grid -> viewport multiplier, read every frame. */
  scale: () => number;
}

/** Mounts the shared numerals into the HUD's unscaled overlay. */
export class DamageLayer {
  private numbers: DamageNumbers | null = null;
  private project: Projector = () => null;
  private host: HTMLElement | null = null;

  mount(root: HTMLElement, opts: DamageLayerOptions): void {
    if (this.numbers) return;
    this.host = opts.host;
    this.numbers = new DamageNumbers({
      root,
      className: 'ffx2-numerals-layer',
      // `'chest'` is the anchor `HudPort.setProjector` documents for numerals:
      // a figure's head point puts the numeral above her hair, where it reads
      // as belonging to whatever is behind her rather than to her.
      anchor: 'chest',
      project: (id, anchor) => this.project(id, anchor),
      scale: opts.scale,
      avoid: () => this.panelRects(),
    });
    this.numbers.mount();
  }

  unmount(): void {
    this.numbers?.unmount();
    this.numbers = null;
    this.host = null;
  }

  clear(): void {
    this.numbers?.clear();
  }

  setProjector(project: Projector): void {
    this.project = project;
  }

  /**
   * Spawn the numeral for one event, if that event has one.
   *
   * `spawnEvent` already knows the two contract details that are easy to get
   * backwards — a `heals` action arrives as a **`damage` event with a negative
   * amount** (there is no separate heal event for damage-formula healing), and
   * `affinity: 'absorb'` outranks the sign so an absorbed hit prints
   * `ABSORBED` rather than a green heal figure — so the event goes through
   * untranslated. Returns the numeral element, or `null` for an event that
   * draws nothing.
   */
  onEvent(event: BattleEvent): HTMLElement | null {
    return this.numbers?.spawnEvent(event as Parameters<DamageNumbers['spawnEvent']>[0]) ?? null;
  }

  /** @param dt seconds, from `HudPort.update`. */
  update(dt: number): void {
    this.numbers?.update(dt);
  }

  /** In-flight numerals, for tests and the debug API. */
  get count(): number {
    return this.numbers?.count ?? 0;
  }

  private panelRects(): NumeralRect[] {
    if (!this.host) return [];
    const out: NumeralRect[] = [];
    for (const selector of PANEL_SELECTORS) {
      for (const el of this.host.querySelectorAll<HTMLElement>(selector)) {
        if (el.hidden || el.offsetParent === null) continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        out.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      }
    }
    return out;
  }
}
