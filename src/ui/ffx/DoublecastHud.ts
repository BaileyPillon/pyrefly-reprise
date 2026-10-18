/**
 * **Doublecast as two picks: what the HUD draws around it** (FFX only; Option A "Second round", decision queue item 103, delegated).
 *
 * `CommandMenu` (through `DoublecastFlow`) says what is happening; this draws it, in the shipped chrome and tokens, on the elements the HUD already has:
 *
 * - the help slab's two lines (a gold numeral chip, the spell and where it went, then the MP in the numeral face), written into the slab's own text element;
 * - the gold lock chip on cast 1's target while the second round is open ("1 FIRA" on Yu Pagoda A), in the overlay, placed from the target's silhouette box
 *   and kept clear of the other fiends (`doublecastLock.ts`), following it every frame;
 * - the MP preview on the caster's card, "20 -8 -> 12", re-added every frame while it is up (the party window rebuilds its rows on a sync);
 * - the engine's picker, handed to the menu (`FFXEngine.doublecastPicks`), and the Sensor chip's clearing on a cancelled aim.
 *
 * It is a wrapper like `withSinHud` and `withOmnisReadout`: `FFXBattleHud.ts` is over the 400-line house limit and does not grow. Inert outside a Doublecast: nothing
 * is created until a second round opens.
 */

import './doublecast-hud.css';
import type { CombatantId } from '../../battle/common/types.ts';
import type { HudPort, TargetingPort } from '../../engine/HudPort.ts';
import type { CommandMenu } from './CommandMenu.ts';
import type { SensorPanel } from './SensorPanel.ts';
import { escapeHtml } from './commandMenuRows.ts';
import type { CommandMenuPort } from './DoublecastFlow.ts';
import type { DoublecastPicksSource, DoublecastView } from './doublecastModel.ts';
import type { DoublecastHelp } from './doublecastText.ts';
import { placeLockChip, type Box } from './doublecastLock.ts';

/** The HUD panels the lock chip keeps off: the turn list's rows (its own box is narrower than its right-aligned rows), the party window, the command stack, the help slab. */
const PANELS = ['.ig-ctb__row', '.ig-stat-list', '.ffx-cmd-area', '.ffx-cmd-info'];

/** The stage's grid width: the stage scale is its box over this. */
const STAGE_W = 640;

/** The parts of the FFX HUD this reaches. */
interface FfxHudShape extends HudPort {
  readonly el: HTMLElement;
  readonly menu: CommandMenu;
  readonly enemyPlate: SensorPanel;
}

export class DoublecastHud {
  readonly port: CommandMenuPort;
  private view: DoublecastView | null = null;
  private lock: HTMLElement | null = null;
  private placed = '';
  private enemies: readonly CombatantId[] = [];
  private rect: ((id: CombatantId) => Box | null) | null = null;

  constructor(
    private readonly root: () => HTMLElement,
    plate: () => SensorPanel,
    picks: DoublecastPicksSource | null,
  ) {
    this.port = { ...(picks ? { picks } : {}), help: (h) => this.renderHelp(h), view: (v) => this.setView(v), aimCancelled: () => plate().aimCancelled() };
  }

  setTargeting(port: TargetingPort | null): void {
    this.rect = port ? (id) => port.rect(id) : null;
  }

  setEnemies(ids: readonly CombatantId[]): void {
    this.enemies = ids;
  }

  /** The slab's two lines, over the plain sentence `setHelp` has just written (a plain `setHelp` later replaces them). */
  private renderHelp(h: DoublecastHelp): void {
    const el = this.root().querySelector<HTMLElement>('.ffx-cmd-info [data-role="text"]');
    if (!el) return;
    const line2 = h.line2.map((p) => (typeof p === 'string' ? escapeHtml(p) : `<b>${escapeHtml(p.num)}</b>`)).join('');
    const mp = h.mp ? `<span class="ffx-dc-mp">${escapeHtml(h.mp)}</span>` : '';
    el.innerHTML =
      `<div class="ffx-dc-help" data-phone-at="${h.phone.at}" data-phone-n="${h.phone.n ?? ''}" data-phone-text="${escapeHtml(h.phone.text)}">` +
      `<div class="ffx-dc-h1"><span class="ffx-dc-n"><b>${h.chip}</b></span><span class="ffx-dc-t">${escapeHtml(h.head)}</span>${mp}</div>` +
      `<div class="ffx-dc-h2">${line2}</div></div>`;
  }

  private setView(view: DoublecastView | null): void {
    this.view = view;
    if (!view) return this.clear();
    this.placed = '';
    const host = this.root().querySelector<HTMLElement>('.ffxhud__overlay');
    if (host && !this.lock) {
      this.lock = this.root().ownerDocument.createElement('div');
      this.lock.className = 'ffx-dc-lock';
      host.append(this.lock);
    }
    if (this.lock) this.lock.innerHTML = `<span class="ffx-dc-n"><b>1</b></span><span class="ffx-dc-lt"><i>${escapeHtml(view.firstLabel)}</i></span>`;
    this.update();
  }

  /** Per frame while a second round is up: the MP preview is still on the card, the lock chip is still on the figure. */
  update(): void {
    const v = this.view;
    if (!v) return;
    const mp = this.root().querySelector<HTMLElement>(`.ig-stat[data-actor="${v.actorId.replace(/"/g, '')}"] .ig-stat__value--mp`);
    if (mp && v.pending && !mp.querySelector('.ffx-stat__pend')) {
      mp.insertAdjacentHTML('beforeend', `<span class="ffx-stat__pend"><s>${v.pending.mp}</s><span>&minus;${v.pending.spent}</span><span>&rarr; ${v.pending.left}</span></span>`);
    }
    this.placeLock(v);
  }

  private placeLock(v: DoublecastView): void {
    const el = this.lock;
    const target = v.firstTargetId ? this.rect?.(v.firstTargetId) : null;
    if (!el) return;
    el.hidden = !target;
    if (!target) return;
    const root = this.root();
    const stage = root.querySelector<HTMLElement>('.ffxhud__stage');
    const k = Math.round(((stage?.getBoundingClientRect().width ?? STAGE_W * 2.5) / STAGE_W) * 100) / 100;
    const here = root.getBoundingClientRect();
    const others = this.enemies.filter((id) => id !== v.firstTargetId).flatMap((id) => this.rect?.(id) ?? []);
    const panels = [...root.querySelectorAll<HTMLElement>(PANELS.join(','))].flatMap((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 ? [{ x: r.x - here.x, y: r.y - here.y, w: r.width, h: r.height }] : [];
    });
    const at = placeLockChip(target, others, { w: el.offsetWidth || 90, h: el.offsetHeight || 32 }, { w: here.width || Infinity, h: here.height || Infinity }, panels); // no layout (a test): nothing to keep it inside
    const key = `${k}/${Math.round(at.x)}/${Math.round(at.y)}`;
    if (key === this.placed) return;
    this.placed = key;
    el.style.setProperty('--dc-k', String(k));
    el.style.left = `${at.x}px`;
    el.style.top = `${at.y}px`;
  }

  /** Take everything this drew off the field and the card. */
  clear(): void {
    this.view = null;
    this.lock?.remove();
    this.lock = null;
    this.root().querySelectorAll('.ffx-stat__pend').forEach((n) => n.remove());
  }
}

/**
 * Tap an FFX HUD for the Doublecast chrome, the way `withSinHud` does: the instance's own `unmount`, `sync`, `setTargetingPort` and `update` are wrapped and the same
 * object returned. `picks` is the engine's picker (`BattleScreenWiring.createHud` binds `FFXEngine.doublecastPicks`); without one the menu plays both rounds with the
 * rows as the engine offered them.
 */
export function withDoublecastHud<T extends FfxHudShape>(hud: T, picks: DoublecastPicksSource | null = null): T {
  const dc = new DoublecastHud(() => hud.el, () => hud.enemyPlate, picks);
  hud.menu.setPort(dc.port);
  const unmount = hud.unmount.bind(hud);
  hud.unmount = (): void => {
    dc.clear();
    unmount();
  };
  const sync = hud.sync?.bind(hud);
  if (sync) {
    hud.sync = (state, preview): void => {
      dc.setEnemies(state.enemyIds);
      sync(state, preview);
    };
  }
  const setTargetingPort = hud.setTargetingPort?.bind(hud);
  if (setTargetingPort) {
    hud.setTargetingPort = (port): void => {
      dc.setTargeting(port);
      setTargetingPort(port);
    };
  }
  const update = hud.update?.bind(hud);
  hud.update = (dt: number): void => {
    dc.update();
    update?.(dt);
  };
  return hud;
}
