/**
 * **The offering screen** of the hidden Last Summoning (FFX only): the new screen between two links of the chain where Yu Yevon reaches for one of the player's aeons and the player says which. Built to the approved
 * frame `frame-2b-offering-menu.png` (Bailey's delegated pick, 2026-10-15; rule 9: a new screen has its target before it has code), in the Ink and Gold chrome (`./offering.css`).
 *
 * A DOM overlay on the battle screen's root, drawn over the whole field (nothing of the fight is on screen while he chooses). **The model is pure** (`./offeringModel.ts`: the cards, which are held, which is focused, the
 * move and the give) **and the words are ours** (`./offeringText.ts`); this file only draws them and listens. Input is the screen's own: `BattleScreen.handleInput` forwards the frame's snapshot
 * (the keyboard's arrows, A, D, W, S, Enter, Space and Z and the pad's d-pad and cross all arrive as `left`, `right`, `up`, `down`, `confirm`, `app/Input.ts`), and a tap or a click focuses a card and a second tap
 * (or the GIVE button) gives it. A choice is final: there is no back and no skip.
 *
 * The beat of giving: the chosen card dims and takes its cross (the same as the cards already taken), a moment is held on it, the screen fades, and the chain goes on with the link of that aeon.
 * **Instant** (no DOM) for a run nobody watches (`speed: 'skip'`, the e2e and the critic): the first held aeon is given, so a headless run never parks here.
 */

import './offering.css';
import { artUrl } from '../../../engine/PaintedArt.ts';
import type { InputSnapshot } from '../../../app/Input.ts';
import { OFFERING_KEYS, type OfferingKey } from '../../../data/ffx/last-summoning-ids.ts';
import { type OfferingState, focusCard, isLast, openOffering, panelOf, pressOf } from './offeringModel.ts';
import { OFFERING_EYEBROW, OFFERING_HEAD, OFFERING_KEYS_LEGEND, OFFERING_NAMES, OFFERING_TAGS, panelHeadings } from './offeringText.ts';

export interface OfferingOptions {
  /** The battle screen's root; the overlay covers it. */
  root: HTMLElement;
  /** The aeons the party holds at all (all eight in the chapter's build). */
  owned: readonly OfferingKey[];
  /** The ones Yu Yevon already has. */
  taken: readonly OfferingKey[];
  /** The screen's clock (the pause gate), so the pause menu holds the beat too. */
  sleep?: (ms: number) => Promise<void>;
  /** `speed: 'skip'`: give the first held aeon and return, draw nothing. */
  instant?: boolean;
  /** True once the screen has been left: the overlay then takes itself down and resolves `undefined`. */
  cancelled?: () => boolean;
  /** REDUCE MOTION: no fade, no beat (the screen is information, so it still shows). */
  reduceMotion?: boolean;
  /** A sound hook (`menu-page` on a move, `menu-open` on the first draw, `menu-close` on the give). */
  sfx?: (name: 'menu-page' | 'menu-open' | 'menu-close') => void;
}

/** The beat lengths, ms; the fades match `./offering.css`. */
export const OFFERING_TIMING = { fadeIn: 520, give: 800, fadeOut: 460 } as const;

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The portrait file of an aeon (`public/art/portraits/<id>.png`: the single aeons have one; the Sisters have none and show their three paintings). **Yojimbo's is not used**: `portraits/yojimbo.png` is the navy bust D-054 says is not approved,
 * so his card is cut from his approved painting (`characters/yojimbo-cavern/idle.png`, `./offering.css` `.lscard__img--cutout`), the one Chapter IX and Yuna's own Yojimbo draw (r50.1).
 */
const portraitOf = (key: Exclude<OfferingKey, 'sisters'>): string => artUrl(`art/portraits/${key}.png`);
const idleOf = (id: string): string => artUrl(`art/characters/${id}/idle.png`);

/** One card's markup. */
function cardHtml(key: OfferingKey, name: string): string {
  const art =
    key === 'sisters'
      ? `<div class="lscard__trio" aria-hidden="true"><img alt="" src="${idleOf('cindy')}"><img alt="" src="${idleOf('sandy')}"><img alt="" src="${idleOf('mindy')}"></div>`
      : key === 'yojimbo'
        ? `<img class="lscard__img lscard__img--cutout" alt="" src="${idleOf('yojimbo-cavern')}">`
        : `<img class="lscard__img" alt="" src="${portraitOf(key)}">`;
  return `${art}<div class="lscard__shade"></div><div class="lscard__name">${name}</div><div class="lscard__tag"></div>`;
}

/** The overlay: build, show, listen, give. */
export class OfferingOverlay {
  private state: OfferingState | null;
  private el: HTMLElement | null = null;
  private resolve: ((key: OfferingKey | undefined) => void) | null = null;
  private giving = false;
  private poll: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly opts: OfferingOptions) {
    this.state = openOffering(opts.owned, opts.taken);
  }

  /** The overlay is up and taking input. */
  get visible(): boolean {
    return this.el !== null;
  }

  /** The focused card's key (for tests and the debug snapshot). */
  get focus(): OfferingKey | undefined {
    return this.state?.focus;
  }

  /** The root element while shown, for tests. */
  get element(): HTMLElement | null {
    return this.el;
  }

  /**
   * Show the screen and resolve with the aeon the player gave (or `undefined` when nothing is held, or the screen was left first). Always resolves.
   */
  async show(): Promise<OfferingKey | undefined> {
    const state = this.state;
    if (state === null) return undefined;
    if (this.opts.instant === true) return state.focus;
    const { root } = this.opts;
    const el = root.ownerDocument.createElement('div');
    el.className = 'ig lsoffer';
    el.dataset['testid'] = 'last-summoning-offering';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', OFFERING_HEAD.several.title);
    el.innerHTML = this.markup(state);
    el.style.setProperty('--lso-ground', `url(${artUrl('art/backdrops/dreams-end.png')})`);
    el.addEventListener('click', this.onClick);
    this.el = el;
    root.appendChild(el);
    this.draw();
    void el.offsetWidth; // one frame at opacity 0 first, so the fade has a start to run from
    el.classList.add('lsoffer--in');
    this.opts.sfx?.('menu-open');
    const sleep = this.opts.sleep ?? defaultSleep;
    if (this.opts.reduceMotion !== true) await sleep(OFFERING_TIMING.fadeIn);
    return new Promise<OfferingKey | undefined>((resolve) => {
      this.resolve = resolve;
      if (this.cancelled()) return this.teardown(undefined);
      this.poll = setInterval(() => {
        if (this.cancelled()) this.teardown(undefined);
      }, 150);
    });
  }

  private cancelled(): boolean {
    return this.opts.cancelled?.() === true;
  }

  /** The frame's snapshot: left, right, up and down move; confirm gives. */
  handleInput(input: InputSnapshot): void {
    if (this.el === null || this.state === null || this.giving) return;
    for (const button of ['left', 'right', 'up', 'down'] as const) {
      if (input.justPressed(button)) this.apply(pressOf(this.state, button));
    }
    if (input.consume('confirm')) this.apply(pressOf(this.state, 'confirm'));
  }

  /** A card or the GIVE button was tapped or clicked (the DOM's own listener; `data-offer-key`, `data-offer-give`). */
  private readonly onClick = (e: Event): void => {
    if (this.state === null || this.giving) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-offer-give]')) return void this.apply(pressOf(this.state, 'confirm'));
    const cardEl = target?.closest<HTMLElement>('[data-offer-key]');
    const key = cardEl?.dataset['offerKey'] as OfferingKey | undefined;
    if (key === undefined) return;
    if (key === this.state.focus) return void this.apply(pressOf(this.state, 'confirm'));
    const next = focusCard(this.state, key);
    if (next !== this.state) this.apply({ kind: 'move', state: next });
  };

  private apply(result: ReturnType<typeof pressOf>): void {
    if (this.state === null) return;
    if (result.kind === 'move') {
      if (result.state !== this.state) {
        this.state = result.state;
        this.opts.sfx?.('menu-page');
        this.draw();
      }
      return;
    }
    void this.give(result.key);
  }

  /** The give: the card takes its cross, a moment is held, the screen fades, and the chain goes on. */
  private async give(key: OfferingKey): Promise<void> {
    const el = this.el;
    if (el === null || this.giving) return;
    this.giving = true;
    this.opts.sfx?.('menu-close');
    el.querySelectorAll('.lscard--focus').forEach((c) => c.classList.add('lscard--giving'));
    const tag = el.querySelector<HTMLElement>('.lscard--giving .lscard__tag');
    if (tag) tag.textContent = OFFERING_TAGS.taken;
    const sleep = this.opts.sleep ?? defaultSleep;
    if (this.opts.reduceMotion !== true) await sleep(OFFERING_TIMING.give);
    el.classList.remove('lsoffer--in');
    el.classList.add('lsoffer--out');
    if (this.opts.reduceMotion !== true) await sleep(OFFERING_TIMING.fadeOut);
    this.teardown(key);
  }

  private teardown(key: OfferingKey | undefined): void {
    if (this.poll !== null) clearInterval(this.poll);
    this.poll = null;
    this.el?.remove();
    this.el = null;
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(key);
  }

  /** The static markup: the stage, the head, the cards (one per aeon the party holds), the panel and the keys strip. */
  private markup(state: OfferingState): string {
    const cards = state.cards
      .map((c) => `<li><button type="button" class="lscard" data-offer-key="${c.key}" aria-label="${OFFERING_NAMES[c.key]}">${cardHtml(c.key, OFFERING_NAMES[c.key])}</button></li>`)
      .join('');
    return (
      '<div class="lsoffer__ground"></div>' +
      '<div class="lsoffer__stage">' +
      `<div class="lsoffer__yevon"><img alt="" src="${idleOf('yu-yevon')}"></div>` +
      '<div class="lsoffer__head">' +
      `<div class="lsoffer__eyebrow">${OFFERING_EYEBROW}</div>` +
      '<h2 class="lsoffer__title"></h2>' +
      '<p class="lsoffer__sub"></p>' +
      '</div>' +
      `<ul class="lsoffer__row">${cards}</ul>` +
      '<div class="lsoffer__panel">' +
      '<div class="lsoffer__col"><div class="lsoffer__h" data-col="fought"></div><p class="lsoffer__p" data-col="fought-text"></p></div>' +
      '<div class="lsoffer__col"><div class="lsoffer__h" data-col="lose"></div><p class="lsoffer__p" data-col="lose-text"></p></div>' +
      '<div class="lsoffer__keys"><span class="lsoffer__legend"><span class="lsoffer__cap">◀▶</span> ' +
      `${OFFERING_KEYS_LEGEND.choose}</span> <button type="button" class="lsoffer__cap lsoffer__cap--give" data-offer-give>ENTER</button> <span class="lsoffer__legend">${OFFERING_KEYS_LEGEND.give}</span></div>` +
      '</div>' +
      '</div>'
    );
  }

  /** Re-draw what the state decides: the classes of the cards, their tags, the head and the panel. */
  private draw(): void {
    const el = this.el;
    const state = this.state;
    if (el === null || state === null) return;
    for (const card of state.cards) {
      const btn = el.querySelector<HTMLElement>(`[data-offer-key="${card.key}"]`);
      if (!btn) continue;
      const focus = card.key === state.focus;
      btn.className = `lscard${card.key === 'sisters' ? ' lscard--sisters' : ''}${card.state === 'taken' ? ' lscard--taken' : ''}${focus ? ' lscard--focus' : ''}`;
      btn.setAttribute('aria-pressed', focus ? 'true' : 'false');
      btn.tabIndex = card.state === 'held' ? 0 : -1;
      const tag = btn.querySelector<HTMLElement>('.lscard__tag');
      if (tag) tag.textContent = card.state === 'taken' ? OFFERING_TAGS.taken : focus ? OFFERING_TAGS.select : '';
    }
    const head = isLast(state) ? OFFERING_HEAD.last : OFFERING_HEAD.several;
    const set = (sel: string, text: string): void => {
      const node = el.querySelector(sel);
      if (node) node.textContent = text;
    };
    set('.lsoffer__title', head.title);
    set('.lsoffer__sub', head.sub);
    const heads = panelHeadings(state.focus);
    const panel = panelOf(state);
    set('[data-col="fought"]', heads.fought);
    set('[data-col="fought-text"]', panel.fought);
    set('[data-col="lose"]', heads.lose);
    set('[data-col="lose-text"]', panel.lose);
    el.setAttribute('aria-label', head.title);
  }
}

/** Every key the screen can show, in the game's order (re-exported for the tests and the chooser). */
export { OFFERING_KEYS };
