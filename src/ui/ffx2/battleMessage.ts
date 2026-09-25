import './battle-message.css';
import type { BattleEvent, BattleState, CombatantId } from '../../battle/common/types.ts';

/**
 * PR-0143 (round 11, FFX-2 only): the FFX-2 HUD's battle-message banner.
 *
 * The FFX-2 engine emits `message` events — "Rikku stole Budget Grenade!",
 * "Nothing was stolen!", "Rikku pilfered 1,500 gil!", "Ormi has no gil to
 * take", "Paine is Berserk — no command is available; the turn passes.",
 * "Not linked" (`src/battle/ffx2/steal.ts`, `engineHooks.ts`,
 * `spherechange.ts`) — and nothing drew them: the presenter's message bar is
 * `null` whenever a HUD is mounted (`BattleScreen.ts`, no factory is
 * registered) and `FFX2BattleHud.onEvent` had no `message` case. The player
 * learned what Rikku stole only by opening Items.
 *
 * **How it looks.** The approved FFX-2 battle tile
 * (`docs/screenshots/mockups/A-ffx2-battle.jpg`) has exactly one slot for a
 * line of battle text: the paper `.ig-banner`, right-anchored under
 * `.ig--ffx2` with the pink accent, which this HUD already uses for the charge
 * telegraph. The message is that banner. It sits at the banner's own top
 * (17.78 on the grid), just under the PR-0012 help band's row (0..17.33), and
 * top-right — the party column is bottom-right, so it never covers the rows
 * or the band.
 *
 * **It yields; nothing yields to it** (round 11 verifier: the first build
 * listed it on the intent slab's board, so the slab dropped 78 px each time a
 * line showed, jumped back when it hid, and teleported to the bottom-left when
 * the next menu slid in under it). The slab, the chain chip and the target
 * plates are standing furniture or the player's own input and never react to
 * the banner. The slab also paints over the stage, so the banner has to keep
 * off it. When a line arrives the banner picks its own free spot
 * ({@link bannerSlot}): the approved slot, else lower in the right-hand column
 * (under the telegraph, under the slab), else the same scan in the left-hand
 * column, else the approved slot anyway. While it is up it watches the board
 * each frame, and when something that was not there at show time lands on it
 * (the next girl's command menu, the target plates, the slab re-solving, a
 * telegraph) it hides rather than hopping. FFX's banner likewise clears when
 * the next decision opens (`FFXBattleHud.clearTransientOverlays`).
 * `research/ffx-vs-ffx2-presentation.md` does not document where FFX-2 prints
 * battle messages, so the placement follows the approved tile, not canon.
 *
 * **Reading order.** As FFX's banner does (`FFXBattleHud.setMessage`): the
 * acting girl's name in serif italic (tracked from `action-start`, never
 * parsed out of the text), then the rest of the line in the chip, with an
 * exact `"<name> "` prefix trimmed so "Rikku stole Budget Grenade!" reads
 * "Rikku · STOLE BUDGET GRENADE!" and not "Rikku · RIKKU STOLE…".
 *
 * It never blocks playback: the presenter already holds `TIMING.message`
 * after every message event, and FFX-2's clock must not wait on the HUD.
 */

/** How long a message stays up after the last one, in ms. */
export const MESSAGE_HOLD_MS = 2200;

export interface MessageParts {
  /** The acting character's name, or `''` when no action has started yet. */
  name: string;
  /** The line itself, without a restated `"<name> "` prefix. */
  chip: string;
}

/** Split one message into the banner's name and chip. Pure. */
export function messageParts(text: string, actorName: string): MessageParts {
  const name = actorName.trim();
  const chip = name && text.startsWith(`${name} `) ? text.slice(name.length + 1) : text;
  return { name, chip };
}

/** A rectangle on the 640x360 stage grid. */
export interface BannerRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The grid, and the approved banner's own top (`slabs.css`: `.ig-banner { top: 17.78px }`). */
const GRID_W = 640;
const GRID_H = 360;
export const BANNER_TOP = 17.78;
/** Clearance kept between the banner and anything it steps off, in grid units. */
export const BANNER_GAP = 3;

/**
 * What the banner keeps off, whether it was up when the line arrived or came up
 * after: the HUD's panels, the help band, the intent slab and its `E HIDE` chip,
 * and the PR-0150 target plates.
 */
const WATCH_SELECTORS = [
  '.ffx2hud__telegraph',
  '.ffx2hud__enemies',
  '.ffx2hud__party',
  '.ffx2hud__command',
  '.ffx2-cmd-info',
  '.ffx2-atbmode',
  '.mad__card',
  '.mad__toggle',
  '.sgd__panel',
  '.sgd__toggle',
  '.eint__panel',
  '.eint__toggle',
  '.ffx2-tplate',
  '.ffx2-aplate',
  '.ffx2-ctlhint',
] as const;
/** Kept off when the line arrives, but a 1.4 s chain chip landing later does not end the line. */
const PLACE_ONLY_SELECTORS = ['.ffx2-chain-chip'] as const;

function overlaps(a: BannerRect, b: BannerRect, gap = 0): boolean {
  return a.left - gap < b.right && a.right + gap > b.left && a.top - gap < b.bottom && a.bottom + gap > b.top;
}

export interface SlotInput {
  /** The banner's box at the approved slot (right-anchored, top {@link BANNER_TOP}), on the grid. */
  box: BannerRect;
  /** What it must not cover, on the grid. */
  obstacles: readonly BannerRect[];
}

export interface BannerSlot {
  anchor: 'right' | 'left';
  top: number;
}

/**
 * Where the banner goes, as a pure function of its box and the board. `null`
 * means no free spot: the caller keeps the approved slot.
 *
 * Each column is scanned downwards from the approved top: whenever the box
 * meets something, it steps to just under the lowest thing it met, until it is
 * clear or would leave the grid. The right-hand column is the approved one; the
 * left-hand one mirrors it about the grid's centre, which is where `.ig-banner`
 * sits by default (`slabs.css`, the FFX anchor).
 */
export function bannerSlot(input: SlotInput): BannerSlot | null {
  const { box, obstacles } = input;
  const h = box.bottom - box.top;
  const columns: Array<{ anchor: BannerSlot['anchor']; left: number; right: number }> = [
    { anchor: 'right', left: box.left, right: box.right },
    { anchor: 'left', left: GRID_W - box.right, right: GRID_W - box.left },
  ];
  for (const col of columns) {
    let top = BANNER_TOP;
    while (top + h <= GRID_H - BANNER_GAP) {
      const rect = { left: col.left, right: col.right, top, bottom: top + h };
      const hits = obstacles.filter((o) => overlaps(rect, o, BANNER_GAP));
      if (hits.length === 0) return { anchor: col.anchor, top };
      top = Math.max(...hits.map((o) => o.bottom)) + BANNER_GAP;
    }
  }
  return null;
}

interface StageFrame {
  left: number;
  top: number;
  scale: number;
}

/** A viewport rect on the stage grid. */
function toGrid(r: DOMRect, frame: StageFrame): BannerRect {
  return {
    left: (r.left - frame.left) / frame.scale,
    top: (r.top - frame.top) / frame.scale,
    right: (r.right - frame.left) / frame.scale,
    bottom: (r.bottom - frame.top) / frame.scale,
  };
}

/** The banner element and its hold timer. The HUD owns the stage it lives on. */
export class BattleMessageBanner {
  private el: HTMLElement | null = null;
  /** The HUD's root: it holds the stage and the overlay the intent slab lives on. */
  private root: HTMLElement | null = null;
  private actorId: CombatantId | null = null;
  private hideTimer = 0;
  private watchFrame = 0;
  private observer: MutationObserver | null = null;
  /** What was already under the banner when it arrived (only when no spot was free): it does not end the line. */
  private readonly tolerated = new Set<Element>();

  /** Mount right after the telegraph; `root` is where the board it keeps off lives. */
  mount(telegraph: HTMLElement, root: HTMLElement): void {
    const el = document.createElement('div');
    el.className = 'ig-banner ffx2hud__message';
    el.dataset['role'] = 'battle-message';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.hidden = true;
    el.innerHTML = '<span class="ig-banner__name" data-role="name"></span><span class="ig-banner__chip" data-role="chip"></span>';
    telegraph.after(el);
    this.el = el;
    this.root = root;
  }

  /** The banner element, for tests; `null` before mount. */
  get element(): HTMLElement | null {
    return this.el;
  }

  /** `action-start` tracks the speaker; `message` shows the line. Everything else is ignored. */
  onEvent(event: BattleEvent, state: BattleState | null): void {
    if (event.type === 'action-start') {
      this.actorId = event.actorId;
      return;
    }
    if (event.type !== 'message') return;
    const name = this.actorId ? (state?.combatants[this.actorId]?.name ?? '') : '';
    this.show(messageParts(event.text, name));
  }

  show(parts: MessageParts): void {
    const el = this.el;
    if (!el) return;
    const nameEl = el.querySelector<HTMLElement>('[data-role="name"]')!;
    const chipEl = el.querySelector<HTMLElement>('[data-role="chip"]')!;
    nameEl.textContent = parts.name;
    nameEl.hidden = !parts.name;
    chipEl.textContent = parts.chip;
    chipEl.hidden = parts.chip.length === 0;
    el.hidden = false;
    delete el.dataset['yielded'];
    this.place();
    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => this.hide(), MESSAGE_HOLD_MS);
    this.watch();
  }

  hide(): void {
    window.clearTimeout(this.hideTimer);
    this.unwatch();
    if (this.el) this.el.hidden = true;
  }

  dispose(): void {
    this.hide();
    this.el?.remove();
    this.el = null;
    this.root = null;
    this.actorId = null;
  }

  /** The stage's viewport origin and letterbox scale, or `null` while it is not laid out. */
  private stageFrame(): StageFrame | null {
    const r = this.el?.parentElement?.getBoundingClientRect();
    if (!r || r.width <= 0 || r.height <= 0) return null;
    return { left: r.left, top: r.top, scale: r.width / GRID_W };
  }

  /** The banner's own box on the grid as laid out now, or `null`. */
  private ownRect(frame: StageFrame): BannerRect | null {
    const r = this.el?.getBoundingClientRect();
    return r && r.width > 0 && r.height > 0 ? toGrid(r, frame) : null;
  }

  /** Every laid-out box under the HUD root matching `selectors`, on the grid. */
  private board(selectors: readonly string[], frame: StageFrame): Array<{ el: Element; rect: BannerRect }> {
    const out: Array<{ el: Element; rect: BannerRect }> = [];
    if (!this.root) return out;
    for (const el of this.root.querySelectorAll(selectors.join(','))) {
      if (el === this.el) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) out.push({ el, rect: toGrid(r, frame) });
    }
    return out;
  }

  /** Measure at the approved slot, then move to the first free one ({@link bannerSlot}). */
  private place(): void {
    const el = this.el!;
    el.style.removeProperty('top');
    el.style.removeProperty('left');
    el.style.removeProperty('right');
    el.dataset['slot'] = 'approved';
    this.tolerated.clear();
    const frame = this.stageFrame();
    const box = frame && this.ownRect(frame);
    if (!frame || !box) return;
    const found = this.board([...WATCH_SELECTORS, ...PLACE_ONLY_SELECTORS], frame);
    const slot = bannerSlot({ box, obstacles: found.map((f) => f.rect) });
    if (!slot) {
      // Nowhere free: keep the approved slot, and let what is already there stay.
      for (const f of found) if (overlaps(box, f.rect)) this.tolerated.add(f.el);
      return;
    }
    el.style.top = `${slot.top}px`;
    if (slot.anchor === 'left') {
      el.style.left = '21.33px';
      el.style.right = 'auto';
    }
    el.dataset['slot'] = `${slot.anchor}@${Math.round(slot.top)}`;
  }

  /**
   * While up: hide as soon as a box that was not there at show time lands on the
   * banner. Checked every frame (the slab and the plates move by style) and, so
   * the next girl's menu is never painted over it, synchronously whenever
   * anything under the HUD root flips `hidden` (the menu, the plates, the
   * telegraph and the slab are all shown that way).
   */
  private watch(): void {
    this.unwatch();
    if (this.root && typeof MutationObserver === 'function') {
      this.observer ??= new MutationObserver(() => void this.check());
      this.observer.observe(this.root, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    }
    if (typeof window.requestAnimationFrame !== 'function') return;
    const tick = (): void => {
      this.watchFrame = 0;
      if (this.check()) this.watchFrame = window.requestAnimationFrame(tick);
    };
    this.watchFrame = window.requestAnimationFrame(tick);
  }

  private unwatch(): void {
    if (this.watchFrame) window.cancelAnimationFrame(this.watchFrame);
    this.watchFrame = 0;
    this.observer?.disconnect();
  }

  /** One look at the board; hides the banner if a newcomer covers it. `true` while it stays up. */
  private check(): boolean {
    const el = this.el;
    if (!el || el.hidden) return false;
    const frame = this.stageFrame();
    const own = frame && this.ownRect(frame);
    if (!frame || !own) return true;
    for (const f of this.board(WATCH_SELECTORS, frame)) {
      if (this.tolerated.has(f.el) || !overlaps(own, f.rect)) continue;
      el.dataset['yielded'] = String((f.el as HTMLElement).className || f.el.tagName);
      this.hide();
      return false;
    }
    return true;
  }
}
