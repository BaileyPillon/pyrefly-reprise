/**
 * Which HUD rectangles actually cover the field.
 *
 * The formation and `window.__pyrefly.targeting()` both ask the HUD "what are
 * you standing on top of", and both were being lied to. Each HUD handed over
 * the *root* element of every panel, and two of those roots — the move
 * advisor's `.mad` and the strategy guide's `.sgd` (both
 * `position:absolute; inset:0`) — are full-viewport **transparent wrappers**
 * whose painted card is a small child. Measured live at 1600x900 they reported
 * 0,0,1600,900, so every combatant on the field came back as 100% covered:
 * `visibleInFrame` read **0.000 for Tidus standing in the open**, and
 * `BattlePresenterStage.relaxFormation` — which settles the lane against that
 * number — saw everyone below its threshold at once and could tell nothing
 * apart.
 *
 * The rule here is the one a player's eye uses: **a wrapper that paints
 * nothing hides nothing.** Walk each root; if the element itself paints
 * (a background colour with real alpha, a background image, a backdrop filter,
 * a visible border), its rectangle is the panel and the walk stops there.
 * Otherwise descend into its children and ask them. A transparent full-screen
 * wrapper therefore contributes its card, not the screen.
 *
 * GAME-AWARE (AGENTS.md rule 14): **both games.** This is shared measurement
 * plumbing behind a defect (critic CHK-020), so FFX and FFX-2 get the same
 * work — `FFXBattleHud.panelRects` and `FFX2BattleHud.panelRects` both call
 * it, and both now declare the advisor card and the guide rail.
 */

/** A HUD rectangle in viewport pixels. */
export interface PanelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Below this the element is treated as transparent. */
const ALPHA_FLOOR = 0.06;

/** How far into a wrapper to look for the thing that actually paints. */
const MAX_DEPTH = 4;

/** Smaller than this in either direction and it cannot hide a fighter. */
const MIN_SIDE = 8;

/** Does this element put ink on the screen, or is it only a box? */
function paints(cs: CSSStyleDeclaration): boolean {
  if (cs.backgroundImage && cs.backgroundImage !== 'none') return true;
  const bf = cs.backdropFilter || (cs as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter;
  if (bf && bf !== 'none') return true;
  if (alphaOf(cs.backgroundColor) >= ALPHA_FLOOR) return true;
  // A panel drawn as an outline only — the Ink & Gold rails.
  const bw = Math.max(
    parseFloat(cs.borderTopWidth) || 0,
    parseFloat(cs.borderRightWidth) || 0,
    parseFloat(cs.borderBottomWidth) || 0,
    parseFloat(cs.borderLeftWidth) || 0,
  );
  if (bw >= 1 && alphaOf(cs.borderTopColor) >= ALPHA_FLOOR) return true;
  return false;
}

/** Alpha of a computed colour string; 1 for an opaque keyword, 0 for none. */
function alphaOf(colour: string | null | undefined): number {
  if (!colour) return 0;
  const c = colour.trim().toLowerCase();
  if (c === 'transparent' || c === 'none' || c === 'rgba(0, 0, 0, 0)') return 0;
  const m = /^rgba?\(([^)]+)\)$/.exec(c);
  if (m) {
    const parts = m[1]!.split(/[,/]/).map((p) => parseFloat(p.trim()));
    return parts.length >= 4 ? (Number.isFinite(parts[3]!) ? parts[3]! : 1) : 1;
  }
  return 1;
}

function hidden(el: Element, cs: CSSStyleDeclaration): boolean {
  if ((el as HTMLElement).hidden) return true;
  if (cs.display === 'none' || cs.visibility === 'hidden') return true;
  const op = parseFloat(cs.opacity);
  return Number.isFinite(op) && op < 0.12;
}

function walk(el: Element | null | undefined, depth: number, out: PanelRect[]): void {
  if (!el || depth > MAX_DEPTH) return;
  const view = el.ownerDocument?.defaultView;
  if (!view) return;
  const cs = view.getComputedStyle(el);
  if (hidden(el, cs)) return;
  const r = el.getBoundingClientRect();
  if (r.width < MIN_SIDE || r.height < MIN_SIDE) return;
  if (paints(cs)) {
    out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
    return;
  }
  for (const child of Array.from(el.children)) walk(child, depth + 1, out);
}

/**
 * The painted rectangles of these HUD roots, wrappers resolved to their cards.
 *
 * Roots may be null or hidden; those are skipped. A root that paints nothing
 * and holds nothing painted contributes nothing at all, which is the correct
 * answer for a layout fence or an empty overlay.
 */
export function solidPanelRects(roots: ReadonlyArray<Element | null | undefined>): PanelRect[] {
  const out: PanelRect[] = [];
  for (const root of roots) walk(root, 0, out);
  return out;
}
