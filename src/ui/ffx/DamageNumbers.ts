import type { BattleEvent, BattleState, CombatantId } from '../../battle/common/types.ts';
import { DamageNumbers as SharedDamageNumbers, type NumeralAnchor } from '../common/DamageNumbers.ts';
import type { NumeralRect } from '../common/damageLadder.ts';
import { DoomCounters } from './DoomCounters.ts';
import { CHAPTER_PANEL_SELECTORS } from './hudAvoidSelectors.ts';

export type Projector = (
  id: CombatantId,
  anchor?: NumeralAnchor,
) => { x: number; y: number } | null;
export type SideResolver = (id: CombatantId) => 'party' | 'enemy' | 'aeon' | null;

/**
 * HUD panels a numeral must never disappear behind: the command stack (which
 * the trigger prompt also draws itself as) and its description card, the CTB
 * column, the party-status list, the sensor read-out, and the strategy guide's
 * left rail. Queried live rather than cached because the stack grows and
 * shrinks a level at a time, and skipped while hidden (`[hidden]` collapses
 * them, so `offsetParent` reads null).
 *
 * The guide is listed by its two solid children, `.sgd__panel` and
 * `.sgd__toggle`, and **not** by `.sgd`: that wrapper is `inset: 0`
 * `pointer-events: none` over the whole stage, so listing it would tell the
 * layer the entire field is chrome. The panel is ~24% of the grid's width,
 * which is over `safeAreaFrom`'s 22% edge cap, so it is dodged as a floating
 * slab rather than carved out of the safe rect — the right treatment for a
 * panel the player toggles off with `G`, and the same one the command stack
 * gets. Without it a party member standing on the left prints straight across
 * the guide's text: `docs/screenshots/r2/r2-overdrive-multihit.png` as first
 * recaptured, where Yuna's `761` landed on the RULES row.
 *
 * The telegraph banner is deliberately absent: it is a transient band across
 * the middle of the field, and dodging it would shove every numeral on screen
 * at exactly the moment the boss is winding up.
 */
const PANEL_SELECTORS = [
  '.ig-cmd-stack',
  '.ffx-cmd-info',
  '.ffx-cmd-breadcrumb',
  '.ig-ctb',
  '.ig-stat-list',
  '.ffx-sensor',
  '.sgd__panel',
  '.sgd__toggle',
  // The cure-hint card in the guide column's slot (R38: it stood inside `.sgd__panel`, which numerals dodge, before).
  '.sgd__slot > .sthint',
  // The move advisor and the enemy-intent slab, added for the same reason the
  // guide is here: both are opaque ink panels a player can have up while a
  // numeral lands, and both ship **on** by default. The advisor's card sits in
  // the bottom band a party member's numerals rise through, and the intent slab
  // hangs directly over the boss, which is where an enemy's numerals spawn —
  // between them they were the last two panels a numeral could vanish into.
  // Listed by their solid children, never by `.mad` / `.eint`, which are
  // `inset: 0` wrappers: listing those would tell the layer the whole field is
  // chrome (the note above `.sgd` explains what that costs).
  '.mad__card',
  '.mad__toggle',
  '.eint__panel',
  '.eint__toggle',
  // Yojimbo's Zanmato panel and banner (FFX, Chapter IX only). The banner goes
  // up on the very hit that fills the gauge, so that hit's numeral printed
  // across its subtitle until these were listed (`hudAvoidSelectors.ts`).
  // Chapter XII's disc strip and intent line likewise.
  ...CHAPTER_PANEL_SELECTORS,
] as const;

/**
 * Panels whose own box is not the whole of what they draw (r64-fixes, FFX only: Chapter I; both HUDs). The F1 turn strip's box (`.ig-ctb`, 178 px tall at 2560 x 1440) holds the portraits; the names hang
 * below it and the status chips below those, to 356 px, and its heading stands above it (measured on the served r63-play build: box 88 to 266, everything in it 53 to 356). A numeral dodged only the box, so
 * a foe at the top right printed its "970" across the names and ran off the right edge (the skeptic's m6). These panels are dodged by the union of their own box and every drawn descendant's.
 */
const FOOTPRINT_PANELS: ReadonlySet<string> = new Set(['.ig-ctb']);

/** The box of `el` and of everything drawn inside it, in viewport px (a descendant with no box, hidden or display none, adds nothing). */
export function footprintOf(el: HTMLElement): NumeralRect {
  const own = el.getBoundingClientRect();
  let left = own.left;
  let top = own.top;
  let right = own.right;
  let bottom = own.bottom;
  for (const d of el.querySelectorAll<HTMLElement>('*')) {
    const r = d.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (r.left < left) left = r.left;
    if (r.top < top) top = r.top;
    if (r.right > right) right = r.right;
    if (r.bottom > bottom) bottom = r.bottom;
  }
  return { left, top, right, bottom };
}

/**
 * The FFX HUD's damage numerals.
 *
 * A thin adapter over the shared `src/ui/common/DamageNumbers.ts` — the single
 * implementation per `docs/CONTRACT-CHANGES.md` decision 12, which the FFX-2
 * HUD mounts the same way. This class only supplies the three things that are
 * FFX-specific: where the HUD's opaque slabs are, what the letterbox scale is,
 * and the frame tick.
 *
 * It replaces the Ink & Gold ink-splash numeral (`.ig-damage`) this HUD used
 * to draw. That numeral was ~170px of black polygon hung off the *top of the
 * head* with its box anchored at the glyph's top-left, so it read as a blot in
 * empty air next to the party and, for anyone standing behind the command
 * menu, printed straight across the ATTACK row
 * (`docs/screenshots/46-attack.png`, `47`, `48`). Numerals now spawn at the
 * target's chest, re-project every frame, bounce FFX-style, ladder on
 * multi-hit, and slide clear of any HUD panel they would land inside.
 *
 * Ticking: `update(dt)` is driven by the battle screen's frame loop when the
 * HUD is wired into one, which keeps numerals frozen with everything else
 * while a screenshot is taken. Standalone hosts (the HUD demo screen, unit
 * tests) never call it, so the first spawn starts an internal rAF loop that
 * shuts itself off the moment a real `update` arrives.
 */
export class DamageNumbers {
  readonly el: HTMLElement;
  /**
   * Doom's countdown over each doomed head (`DoomCounters.ts`): the field's
   * other numeral, so it rides this layer's projector, letterbox scale, frame
   * tick and panel list rather than growing `FFXBattleHud.ts` a second copy.
   */
  readonly doom: DoomCounters;
  private readonly core: SharedDamageNumbers;
  private projector: Projector | null = null;
  private sideOf: SideResolver | null = null;
  private raf = 0;
  private lastRafMs = 0;
  private externallyTicked = false;

  constructor() {
    this.core = new SharedDamageNumbers({
      className: 'ffx-numerals-layer',
      anchor: 'chest',
      project: (id, anchor) => this.projector?.(id, anchor) ?? null,
      scale: () => this.hudScale(),
      avoid: () => this.panelRects(),
    });
    this.el = this.core.el;
    this.doom = new DoomCounters({
      project: () => this.projector,
      scale: () => this.hudScale(),
      avoid: () => this.panelRects(),
    });
    this.el.appendChild(this.doom.el);
  }

  setProjector(project: Projector): void {
    this.projector = project;
  }

  /**
   * Kept for API compatibility with the ink-splash numerals this replaces,
   * which inverted their splash for a party target. The FFX numeral style is
   * the same white-on-outline glyph whichever side is struck, so nothing reads
   * this today; it stays so `FFXBattleHud` need not change and so a later
   * side-specific tint has somewhere to hang.
   */
  setSideResolver(sideOf: SideResolver): void {
    this.sideOf = sideOf;
  }

  /** The most recent side resolver, for subclasses/tests. */
  protected sideFor(id: CombatantId): 'party' | 'enemy' | 'aeon' | null {
    return this.sideOf?.(id) ?? null;
  }

  /**
   * Spawns a numeral for a damage/heal/miss/mp event; no-ops for every other event type.
   *
   * **A miss whose reason is `'immune'` prints IMMUNE, not MISS** (release 57, R56-003 of the Release 56 focused review; **FFX only**). The engine
   * emits that miss for a status move the target is wholly immune to (Slow on Seymour Flux, Shell on a Pagoda: `immune-status-miss.ts`), a revival that
   * cannot stand its target up, and Scan on a foe that refuses it; the shared `spawnEvent` reads only `hit: false` and so drew all three as a plain MISS.
   * IMMUNE here is the same numeral a hit on an immune affinity draws (`damageLadder`'s `immune` kind: 12 px, 700 ms), so the two read alike.
   * Every other miss reason (`evaded`, `nullified`, `wrong-state`) is unchanged.
   */
  spawn(event: BattleEvent): void {
    const spawned =
      event.type === 'miss' && event.reason === 'immune'
        ? this.core.spawn({ target: event.targetId, affinity: 'immune' })
        : this.core.spawnEvent(event as Parameters<SharedDamageNumbers['spawnEvent']>[0]);
    if (spawned) this.startRafFallback();
  }

  /** Every battle event, for the numbers that are not a hit: Doom's count. */
  watch(event: BattleEvent): void {
    this.doom.onEvent(event);
  }

  /** A full engine sync: Doom's counts reconciled with the state (and cleared once there is a result). */
  syncState(state: BattleState): void {
    this.doom.sync(state);
  }

  /** Per-frame tick from the battle screen. */
  update(dt: number): void {
    this.externallyTicked = true;
    this.stopRafFallback();
    this.core.update(dt);
    this.doom.update();
  }

  clear(): void {
    this.core.clear();
    this.doom.clear();
    this.stopRafFallback();
  }

  get count(): number {
    return this.core.count;
  }

  // ------------------------------------------------------------------ private

  /**
   * The letterbox scale `FFXBattleHud.layout()` applies to the 640x360 grid.
   * §3.6's numeral sizes are quoted on that grid, and this layer is unscaled,
   * so without it a plain hit would draw at 16 real pixels.
   */
  private hudScale(): number {
    const host = this.el.parentElement?.closest<HTMLElement>('.ffxhud') ?? this.el.parentElement;
    const rect = host?.getBoundingClientRect();
    const w = rect?.width || window.innerWidth;
    const h = rect?.height || window.innerHeight;
    if (!w || !h) return 1;
    return Math.min(w / 640, h / 360);
  }

  private panelRects(): NumeralRect[] {
    const host = this.el.parentElement?.closest<HTMLElement>('.ffxhud');
    if (!host) return [];
    const out: NumeralRect[] = [];
    for (const selector of PANEL_SELECTORS) {
      for (const el of host.querySelectorAll<HTMLElement>(selector)) {
        if (el.hidden || el.offsetParent === null) continue;
        const r = FOOTPRINT_PANELS.has(selector) ? footprintOf(el) : el.getBoundingClientRect();
        if (r.right - r.left <= 0 || r.bottom - r.top <= 0) continue;
        out.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      }
    }
    return out;
  }

  private startRafFallback(): void {
    if (this.externallyTicked || this.raf !== 0 || typeof requestAnimationFrame !== 'function') return;
    this.lastRafMs = 0;
    const step = (now: number): void => {
      this.raf = 0;
      const dt = this.lastRafMs ? Math.min(0.1, (now - this.lastRafMs) / 1000) : 1 / 60;
      this.lastRafMs = now;
      this.core.update(dt);
      if (this.core.count > 0 && !this.externallyTicked) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  private stopRafFallback(): void {
    if (this.raf === 0) return;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}
