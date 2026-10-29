import './phone-enemy-line.css';
import { escapeHtml } from './html.ts';
import type { IntentTargetView, IntentView } from './EnemyIntent.ts';

/**
 * THE PHONE'S ENEMY-MOVE LINE, two rows (lane a11y-text, 2026-10-29; release 67 gap check item 5; BOTH games, the upright phone only).
 *
 * Release 67 clamped the line under the rail to two lines (backlog 57). The text was still one run, in this order: who and when, the move, the certainty badge, the status chip, then the damage figures. On the longest lines
 * (Chapter I's "SEYMOUR FLUX 3RD IN QUEUE Lance of Atrophy SCRIPTED ZOMBIE 99% TIDUS 707-799 / YUNA 746-842 / KIMAHRI 698-788", 85 characters laid out on three to four lines at 390 x 844) the clamp cut the FIGURES, which are
 * the part a player acts on, and a party-wide move showed only its first target's number.
 *
 * Now the line is exactly two rows and the figures own the second one:
 *
 *   row 1  who and when (short: NEXT, 2ND), the move, the certainty badge, the status chip (FFX only: it is FFX's body that ever carried one, `phoneDensityOf`)
 *   row 2  one figure per character: the name and the engine's range (707–799; KO when it is lethal, +80–120 when it heals; the point figure when the engine has no range); a rolled victim reads "random:" and is separated by "/"
 *
 * Neither row wraps. When a row is wider than the line, `fitPhoneLine` takes the least useful piece off, one at a time, until it fits (rows 1: the SCRIPTED badge, the timing, the enemy's name, the status chip, then the move
 * name gets an ellipsis; row 2: the names shorten to three letters, then the range falls back to the point figure, then the list becomes a count and a spread, then the last figure gets an ellipsis). The measuring is real layout (`scrollWidth` against `clientWidth`), so it
 * only runs in a browser; the unit tests drive it with a fake measure. `phone-enemy-line.css` hides every rung until its class is on.
 *
 * The desktop slab, a phone held sideways and every other density are untouched: this body is built only when `<html>` carries `data-phone-battle` (`EnemyIntentPanel.densityNow` answers 'phone' for FFX-2 and 'phone-brief' for FFX).
 */

const PHONE_ATTR = 'data-phone-battle';

/** True on the upright phone, where the battle HUD is laid out in flow (`phoneBattle.ts` sets the attribute on <html>). */
export function phoneLineOn(): boolean {
  return typeof document !== 'undefined' && document.documentElement.hasAttribute(PHONE_ATTR);
}

/**
 * The density the panel draws at: the mount's own (`'full'`, FFX-2 at 100; `'brief'`, FFX and FFX-2 at TEXT SIZE 115 / 130), or on the upright phone the phone line of the panel's GAME. The two phone densities keep the games
 * apart (AGENTS.md rule 14; review minor 3): only FFX's body ever carried the status chip beside the move (`briefStatusChip`; FFX-2's desktop body prints a Statuses block instead, which the phone sheet hides, and its
 * 'brief' density at the larger text sizes is the desktop solver's), so FFX-2's phone line does not gain a chip it never had, at any text size.
 */
export type PanelDensity = 'full' | 'brief' | 'phone' | 'phone-brief';
export const phoneDensityOf = (base: 'full' | 'brief', game: string): PanelDensity => (phoneLineOn() ? (game === 'ffx' ? 'phone-brief' : 'phone') : base);

const ordinal = (n: number): string => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

/** "NEXT" or the place in the forecast ("3RD"): the same rule as the desktop's `timingText`, said short. */
export function phoneTiming(view: Pick<IntentView, 'actsNext' | 'turnsAway'>): string {
  return view.actsNext || view.turnsAway <= 0 ? 'next' : ordinal(view.turnsAway + 1);
}

const num = (n: number): string => Math.abs(Math.round(n)).toLocaleString('en-US');

/** One character's figure on the line. */
export interface PhoneFigure {
  name: string;
  /** Three characters, for the narrow rung (see {@link shortNames}). */
  short: string;
  /** "753", "KO", "+120", or '' for a candidate a status-only move may land on. */
  amount: string;
  /** The engine's range for a damage or heal figure whose minimum and maximum differ ("707–799", "+80–120"), else ''. The band is what the desktop slab prints; the narrow rung falls back to {@link amount}. */
  band: string;
  kind: 'damage' | 'lethal' | 'heal' | 'candidate';
}

/**
 * Three-character names for the narrow rung. The first three letters, unless two names would read the same ("Yu Pagoda A" and "Yu Pagoda B" are both "Yu "): then the colliding names take the first letter of each word
 * (YPA, YPB), and failing that their last three characters. Trimmed, so a name with a space in its third place is not left with a trailing blank.
 */
export function shortNames(names: readonly string[]): string[] {
  const first = names.map((n) => n.slice(0, 3).trim());
  const clash = (list: readonly string[], i: number): boolean => list.some((o, j) => j !== i && o === list[i]);
  const initials = names.map((n) => n.split(/\s+/).filter(Boolean).map((w) => w[0]!).join('').slice(0, 3));
  return first.map((f, i) => {
    if (!clash(first, i)) return f;
    if (!clash(initials, i) && initials[i]!.length > 1) return initials[i]!;
    return names[i]!.slice(-3).trim();
  });
}

/** The figures the line carries, and whether the victim is rolled (every candidate, one of them is hit) or each of these is hit. */
export function phoneFigures(view: Pick<IntentView, 'estimate' | 'randomTarget'>): { random: boolean; rows: PhoneFigure[]; lo: number; hi: number } {
  const rolled = view.randomTarget && view.randomTarget.rows.length > 1 ? view.randomTarget : null;
  const source: readonly IntentTargetView[] = rolled ? rolled.rows : (view.estimate?.perTarget ?? []).filter((t) => t.amount !== 0);
  const harms = rolled ? rolled.rows.some((t) => t.amount !== 0) : true;
  const shorts = shortNames(source.map((t) => t.targetName));
  const rows = source.map<PhoneFigure>((t, i) => {
    const heals = t.amount < 0;
    const kind = !harms ? 'candidate' : t.lethal ? 'lethal' : heals ? 'heal' : 'damage';
    const amount = kind === 'candidate' ? '' : kind === 'lethal' ? 'KO' : `${heals ? '+' : ''}${num(t.amount)}`;
    const [lo, hi] = [Math.abs(t.min), Math.abs(t.max)].sort((x, y) => x - y); // a heal's bounds may be negative: the smaller magnitude first
    const band = (kind === 'damage' || kind === 'heal') && t.min !== t.max ? `${heals ? '+' : ''}${num(lo)}–${num(hi)}` : '';
    return { name: t.targetName, short: shorts[i]!, amount, band, kind };
  });
  const amounts = source.map((t) => Math.abs(t.amount)).filter((n) => n > 0);
  return { random: rolled !== null, rows, lo: amounts.length ? Math.min(...amounts) : 0, hi: amounts.length ? Math.max(...amounts) : 0 };
}

function figuresHtml(view: IntentView): string {
  const { random, rows, lo, hi } = phoneFigures(view);
  if (rows.length === 0) return '';
  const items = rows
    .map(
      (r) =>
        `<span class="eint__fig eint__fig--${r.kind}${r.band ? ' eint__fig--ranged' : ''}"><span class="eint__fn">${escapeHtml(r.name)}</span><span class="eint__f3">${escapeHtml(r.short)}</span>` +
        (r.band ? ` <b class="eint__fb">${r.band}</b>` : '') +
        (r.amount ? ` <b class="eint__fa">${r.amount}</b>` : '') +
        '</span>',
    )
    .join('');
  const spread = hi > 0 ? (lo === hi ? num(hi) : `${num(lo)}–${num(hi)}`) : '';
  const sum = `<span class="eint__sum">${random ? 'random: ' : ''}${rows.length} targets${spread ? ` · ${spread}` : ''}</span>`;
  return `<div class="eint__r eint__r2${random ? ' eint__r2--random' : ''}">${items}${sum}</div>`;
}

/**
 * The line's body at the phone's density: ONE wrapper (the phone sheet makes every direct child of the body inline, so the two rows live inside it) holding the two rows. `conf`, `chip` and `move` are the pieces the shared
 * builder already made (`confidenceHtml`, `briefStatusChip`, the move name with its citations taken out), so the words are the desktop's.
 */
export function phoneBodyHtml(view: IntentView, conf: string, chip: string, move: string): string {
  const timing = phoneTiming(view);
  const r1 =
    `<div class="eint__r eint__r1">` +
    `<span class="eint__enemy"><span class="eint__nm">${escapeHtml(view.enemyName)}</span><i class="eint__tm">${escapeHtml(timing)}</i></span>` +
    `<span class="eint__move"><span class="eint__label">${move}</span></span>${conf}${chip}</div>`;
  return `<div class="eint__phone">${r1}${figuresHtml(view)}</div>`;
}

// ------------------------------------------------------------------------------------------ the fit

/** What row 1 gives up, in order: the badge that says "certain", the timing, the enemy's name, the status chip, then the move name is let go to an ellipsis. */
export const ROW1_RUNGS: readonly string[] = ['p-cf', 'p-tm', 'p-nm', 'p-ch', 'p-el'];
/**
 * What row 2 gives up, in order: the names shorten to three letters, the band falls back to the point figure (a player asking "does 760 HP die" needs the band, so it outlasts the full names), the list becomes a count and
 * a spread, then the last figure is let go to an ellipsis.
 */
export const ROW2_RUNGS: readonly string[] = ['p-sh', 'p-pt', 'p-sm', 'p-el2'];
/** What each rung acts on: a rung whose piece is not on this line (an uncertain badge is never dropped, a move may carry no chip) is skipped, not counted. */
const RUNG_TARGET: Readonly<Record<string, string>> = {
  'p-cf': '.eint__conf--scripted', 'p-tm': '.eint__tm', 'p-nm': '.eint__nm', 'p-ch': '.eint__status-chip', 'p-el': '.eint__move',
  'p-sh': '.eint__f3', 'p-pt': '.eint__fb', 'p-sm': '.eint__sum', 'p-el2': '.eint__fig',
};

/** Is this row wider than the line it sits in? Real layout: `scrollWidth` against `clientWidth` (0 and 0 while the panel is not drawn, which is "no"). */
export function rowOverflows(row: HTMLElement): boolean {
  return row.scrollWidth > row.clientWidth + 1;
}

/**
 * Take the least useful pieces off until each row fits the line: every rung class is cleared, then added one at a time, in order, while the row still overflows. Returns the rung classes that ended up on the wrapper.
 * `overflows` is the measure (real layout by default; the tests pass their own, because jsdom has no layout). Does nothing when the body is not the phone's.
 */
export function fitPhoneLine(body: HTMLElement, overflows: (row: HTMLElement) => boolean = rowOverflows): string[] {
  const wrap = body.querySelector<HTMLElement>(':scope > .eint__phone');
  if (!wrap) return [];
  for (const c of [...ROW1_RUNGS, ...ROW2_RUNGS]) wrap.classList.remove(c);
  const applied: string[] = [];
  for (const [selector, rungs] of [['.eint__r1', ROW1_RUNGS], ['.eint__r2', ROW2_RUNGS]] as const) {
    const row = wrap.querySelector<HTMLElement>(`:scope > ${selector}`);
    if (!row) continue;
    for (const rung of rungs) {
      if (!overflows(row)) break;
      if (!row.querySelector(RUNG_TARGET[rung]!)) continue;
      wrap.classList.add(rung);
      applied.push(rung);
    }
  }
  return applied;
}

/**
 * Keep the fit current for one body: fit again whenever its content is replaced, and whenever its panel changes size (it is drawn after being hidden, or the window narrows or widens). The observers are the browser's;
 * a runtime without them (jsdom, a very old browser) simply never fits, and the CSS floor (`overflow: hidden` on both rows) still holds the two-row shape.
 */
export function attachPhoneFit(body: HTMLElement): void {
  if (typeof MutationObserver === 'undefined') return;
  let sized = false;
  let busy = false;
  const run = (): void => {
    if (busy || !phoneLineOn()) return; // off the upright phone there is no wrapper to fit
    busy = true;
    try {
      fitPhoneLine(body);
    } finally {
      busy = false;
    }
  };
  const watchPanel = (): void => {
    const panel = body.parentElement;
    if (sized || !panel || typeof ResizeObserver === 'undefined') return;
    sized = true;
    new ResizeObserver(run).observe(panel);
  };
  new MutationObserver(() => {
    watchPanel();
    run();
  }).observe(body, { childList: true });
  // A face that finishes loading after the first fit (Chakra Petch 700 is wider than the fallback it replaces) changes the widths without a rewrite or a resize: fit again once the faces that are loading have arrived.
  // One promise, no listener to take off: the HUD builds a panel for every fight.
  if (typeof document !== 'undefined' && document.fonts?.status === 'loading') void document.fonts.ready.then(run);
}
