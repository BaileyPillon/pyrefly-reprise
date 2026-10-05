import type { Box } from './geometry.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING: what the pinned HUD covers, read from the DOM (ported from
 * option C's prototype, `fx/max/c/clearance.ts` and `phoneFill.ts`). The framing keeps the party and
 * every boss part clear of these while a command menu is open, desktop and phone.
 *
 * Counted: the HUD's opaque panels as laid out (both HUDs, the phone's tiles and command buttons, the
 * turn-order rail, the party stats, the guide). Not counted: the cinematic bars and slabs, the phone's
 * top shade and the top fade of its panel (a gradient the feet show through today), the first-run coach
 * mark, and the cards that place themselves after the camera and so follow any master: the desktop
 * enemy-intent slab, the moves card, the Sensor card (it opens on a reveal and folds itself after 7 s) and a
 * turn's sliding cut-in. On the PHONE the
 * intent strip is a fixed strip across the top, so it counts there (the judges' Ch I phone finding:
 * Flux's head under the intent strip).
 *
 * Both games (shared plumbing); FF7 never binds the mix.
 */

const SKIP = /pf-mom|phud-shade|phud-panel|coach-mark|candyc|mad__|ffx-sensor|ig-cutin__(?!info)|fxc-splash/;
const SKIP_DESKTOP = /eint__/;

/** Is the upright-phone battle HUD up? */
export function phoneBattle(): boolean {
  return typeof document !== 'undefined' && !!document.documentElement.dataset['phoneBattle'];
}

/** Is a command menu up (an input beat)? Both HUDs' command lists, as laid out. */
export function menuOpen(): boolean {
  if (typeof document === 'undefined') return false;
  for (const el of document.querySelectorAll<HTMLElement>('.ffx-cmd-area, .ffx2hud__command')) {
    if (el.hidden || el.closest('[hidden]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 20 && el.querySelector('.ig-cmd, [role="menuitem"], button, li')) return true;
  }
  return false;
}

/** The HUD's opaque panels as laid out now (viewport CSS px). */
export function hudPanels(canvas: HTMLElement | null): Box[] {
  const out: { el: Element; b: Box }[] = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const phone = phoneBattle();
  for (const e of document.querySelectorAll('body *')) {
    if (canvas && (e === canvas || e.contains(canvas))) continue;
    const cl = typeof e.className === 'string' ? e.className : '';
    if (SKIP.test(cl) || (!phone && SKIP_DESKTOP.test(cl))) continue;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) continue;
    if (cs.backgroundColor === 'rgba(0, 0, 0, 0)' && cs.backgroundImage === 'none') continue;
    const r = e.getBoundingClientRect();
    const a = r.width * r.height;
    if (a < 3000 || a > 0.5 * vw * vh || r.height > 0.8 * vh || r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue;
    let p = e.parentElement;
    let nested = false;
    while (p && !nested) {
      nested = out.some((x) => x.el === p);
      p = p.parentElement;
    }
    if (!nested) out.push({ el: e, b: { l: r.left, r: r.right, t: r.top, b: r.bottom } });
  }
  // The columns read as one block (the turn rail's names and portraits, the command list's buttons, the
  // party rows): a figure in the gaps between their tiles is still behind the rail to the eye.
  for (const el of document.querySelectorAll<HTMLElement>(SOLID)) {
    if (el.hidden || el.closest('[hidden]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 20 && r.height > 20 && r.bottom > 0 && r.top < vh) out.push({ el, b: { l: r.left, r: r.right, t: r.top, b: r.bottom } });
  }
  return out.map((x) => x.b);
}

const SOLID = '.ig-ctb, .ffx-cmd-area, .ffx2hud__command, .ig-stat-list';

/**
 * The panels a menu will show, before the first menu has opened (the battle-start moment hides the HUD,
 * so the first master is planned blind otherwise and would have to cut at the first menu). Viewport
 * fractions measured on release 35 at 1600x900 (desktop) and offsets from the bottom at 390x844 (phone);
 * the live check at each menu's opening replaces them with what is really laid out.
 */
export function predictedPanels(game: 'ffx' | 'ffx2', vw: number, vh: number, phone: boolean): Box[] {
  const f = (l: number, t: number, r: number, b: number): Box => ({ l: l * vw, t: t * vh, r: r * vw, b: b * vh });
  if (phone) {
    const out: Box[] = [
      { l: 8, t: vh - 358, r: vw - 8, b: vh - 296 }, // the party tiles
      { l: 8, t: vh - 234, r: vw - 8, b: vh - 50 }, // the command buttons
      { l: 10, t: 60, r: vw - 10, b: 130 }, // the intent strip
      { l: 10, t: 10, r: Math.min(vw - 10, 324), b: 64 }, // the turn order (FFX) or the boss HP (FFX-2)
    ];
    return out;
  }
  // The panels every menu shows (command list, party stats, turn rail or boss bar, the help line). The
  // guide's card is left out (its height changes with what it says) and so is FFX's Sensor card (up only
  // in some fights): the live check at the first menu counts both, and re-plans at the next action.
  if (game === 'ffx2') return [f(0.774, 0.464, 0.985, 0.677), f(0.721, 0.722, 0.989, 0.972), f(0.03, 0.114, 0.41, 0.167), f(0.078, 0, 1, 0.048)];
  return [f(0.043, 0.494, 0.344, 0.929), f(0.044, 0.374, 0.301, 0.428), f(0.8275, 0.138, 0.969, 0.557), f(0.624, 0.718, 0.969, 0.967)];
}

/**
 * Desktop: the band the NEXT BEST MOVE card docks in (FFX: `FFXBattleHud.placeAdvisor`, the card comes
 * down when no rectangle clear of the panels and the fighters holds it; FFX-2: its fenced band at the bottom). A boss part may not fill more
 * of it than today, so a colossus never pushes the advisor off the first menu (the judges' Evrae frame).
 */
export function advisorReserve(game: 'ffx' | 'ffx2', vw: number, vh: number, phone: boolean): Box | null {
  if (phone) return null;
  // FFX docks the card in the top band; FFX-2 between the guide and the party rows at the bottom (the
  // mix's first Bahamut frame put Paine's feet under it).
  return game === 'ffx' ? { l: 0.26 * vw, t: 0.06 * vh, r: 0.62 * vw, b: 0.3 * vh } : { l: 0.48 * vw, t: 0.75 * vh, r: 0.71 * vw, b: 0.93 * vh };
}

/**
 * FFX's Sensor card as laid out at rest (round 19, PR-0312): pinned on the 640x360 stage at grid 430,166, 119 x 88, in the lane the
 * enemies stand in. The card opens on a reveal and folds itself, so the framing counts its place (not the DOM) for a colossus
 * fight: under the larger boss it covered 34.5 % of Natus (2000x1012). FFX only; null on the phone and in FFX-2 (the boss strip).
 */
export function sensorSlab(game: 'ffx' | 'ffx2', vw: number, vh: number, phone: boolean): Box | null {
  if (game !== 'ffx' || phone) return null;
  const s = Math.min(vw / 640, vh / 360);
  const ox = (vw - 640 * s) / 2;
  const oy = (vh - 360 * s) / 2;
  return { l: ox + 430 * s, r: ox + 549 * s, t: oy + 166 * s, b: oy + 254 * s };
}

/** The canvas's field: size, the viewport's slice of it, and viewport panels moved into field px. */
export function fieldOf(canvas: HTMLElement, panels: readonly Box[]): { W: number; H: number; view: Box; panels: Box[] } {
  const r = canvas.getBoundingClientRect();
  const W = r.width || window.innerWidth;
  const H = r.height || window.innerHeight;
  const view: Box = { l: Math.max(0, -r.left), r: Math.min(W, window.innerWidth - r.left), t: Math.max(0, -r.top), b: Math.min(H, window.innerHeight - r.top) };
  return { W, H, view, panels: panels.map((p) => ({ l: p.l - r.left, r: p.r - r.left, t: p.t - r.top, b: p.b - r.top })) };
}

/** The battle canvas. */
export function battleCanvas(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.querySelector<HTMLElement>('#game canvas, canvas');
}

let menuPanels: Box[] = [];
let menuKey = '';

/** Remember the panels of an open menu (per layout), so a plan before the next menu keeps clear of it. */
export function noteMenuPanels(panels: readonly Box[], key: string): void {
  if (key !== menuKey) menuPanels = [];
  menuKey = key;
  for (const p of panels) if (!menuPanels.some((q) => q.l <= p.l + 2 && q.r >= p.r - 2 && q.t <= p.t + 2 && q.b >= p.b - 2)) menuPanels.push(p);
}

export function rememberedMenuPanels(key: string): Box[] {
  return key === menuKey ? menuPanels : [];
}

/** Forget the remembered panels (a new battle). */
export function forgetMenuPanels(): void {
  menuPanels = [];
  menuKey = '';
}

/**
 * The area (canvas CSS px) the colossus composition fills: on desktop the stage between the command
 * column and the turn rail, above the party rows; on the upright phone the band above its panel. It is
 * fixed, never read from the HUD as laid out: the battle-start moment collapses the HUD, so a rectangle
 * read from it gave the first plan one composition and every re-plan another (Natus and Bahamut were
 * re-composed two and three times in their first minute). The clearance fit answers to the real panels.
 */
export function hudFree(W: number, H: number): Box {
  if (phoneBattle()) return { l: W * 0.02, r: W * 0.98, t: H * 0.1, b: Math.min(H, window.innerHeight - 324) };
  return { l: W * 0.3, r: W * 0.85, t: H * 0.08, b: H * 0.72 };
}
