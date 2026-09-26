/**
 * The battle HUD on an upright phone: option B, "compact rail" (Bailey,
 * 2026-09-25: "I'll go with all your recommendations"; target
 * `docs/concepts/layout/phone-battle-hud/sheet.jpg` row B, `frames/B-*.jpg`,
 * preflight `docs/plans/phone-battle-hud-review.md`).
 *
 * Game case (AGENTS.md rule 14): **both**. This file is the shared plumbing;
 * each game keeps its own canon in its own module and stylesheet
 * (`ui/ffx/phoneHud.ts`: the CTB order on the rail; `ui/ffx2/phoneHud.ts`: no
 * turn list, the boss gauge on the rail and the ATB on every chip,
 * `research/ffx-vs-ffx2-presentation.md` §4.2 and §9 row 3).
 *
 * The layout is CSS, keyed on `html[data-phone-battle]`. Only this module sets
 * that attribute, and only while a battle HUD is mounted in a window that
 * matches {@link PHONE_BATTLE_QUERY}, so no desktop size can match a phone rule.
 * What it does besides:
 *
 *  - **The field.** `phone-battle.css` cuts `#game` to the field rectangle; the
 *    renderer measures its container and the presenter projects through the
 *    canvas rect, so one `resize` event is all the engine needs to follow.
 *  - **The chrome the desktop HUD has no element for:** the panel behind the
 *    thumb zone, GUIDE, the footer line, and the target step's card and
 *    Back / Confirm bar. Back and Confirm send Escape and Enter through
 *    `window`, the path a key press takes (`app/Input.ts` listens there in the
 *    capture phase, every HUD menu below it), so there is one way to confirm.
 *  - **The target step.** A figure on the field is already a tap target (the
 *    bracket's own click, `TargetCursor`); a swipe across the field steps the
 *    cursor with the arrow keys.
 */

import './phone-battle.css';
import './phone-battle-parts.css';
import type { GameId } from '../../battle/common/types.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import { createPhoneField, type PhoneField } from './phoneFraming.ts';
import { confirmLabel, sendKey, targetHint, type PhoneTextReader } from './phoneBattleText.ts';

export { confirmLabel, readGroup, sendKey, targetHint, textOf } from './phoneBattleText.ts';
export type { PhoneBattleText, PhoneTextReader } from './phoneBattleText.ts';

/** An upright phone. 600 is the party-prep phone breakpoint; a phone held sideways keeps today's HUD. */
export const PHONE_BATTLE_QUERY = '(max-width: 599px) and (orientation: portrait)';

/** How often the footer, the target card and the step are re-read, in ms. */
const REFRESH_MS = 120;

/** A horizontal swipe shorter than this is a tap, not a step. */
const SWIPE_PX = 40;

export interface PhoneBattle {
  /** Whether the phone layout is on right now. */
  readonly active: boolean;
  /** Re-read the HUD now (tests; the timer does it otherwise). */
  refresh(): void;
  destroy(): void;
}

/**
 * Where the field's slide sits by default, as the aspect of the frame it
 * shows (`phoneFraming.ts`): FFX centred on the window (0), FFX-2 the sheet's
 * left-anchored 0.93 frame (`frames/B-ffx2-*.jpg`).
 */
export const HOME_ASPECT: Record<GameId, number> = { ffx: 0, ffx2: 0.93 };

/** Extras a game's half passes in; both optional (tests pass neither). */
export interface PhoneBattleOptions {
  /** Picks the field's slide at each command menu (`phoneFraming.ts`). */
  field?: PhoneField;
  /** A list that pages by its cursor, not by scrolling: a vertical drag on it steps the cursor a row. */
  dragList?: string;
}

/** A vertical drag this long steps the list one row (two tiles) on. */
const ROW_PX = 48;

function make(tag: string, className: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  return el;
}

function tapButton(className: string, label: string, onTap: () => void): HTMLButtonElement {
  const b = make('button', className) as HTMLButtonElement;
  b.type = 'button';
  b.textContent = label;
  // A tapped <button> keeps focus, and a later Enter would click it again.
  b.addEventListener('mousedown', (e) => e.preventDefault());
  b.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onTap();
  });
  return b;
}

/**
 * Put the phone layout on a mounted battle HUD. `hud` is the HUD's root
 * (`.ffxhud` / `.ffx2hud`); `read` pulls the words the chrome prints.
 */
export function installPhoneBattle(
  hud: HTMLElement,
  game: GameId,
  read: PhoneTextReader,
  opts: PhoneBattleOptions = {},
): PhoneBattle {
  const doc = hud.ownerDocument;
  const win = doc.defaultView ?? window;
  const html = doc.documentElement;
  const mq = win.matchMedia?.(PHONE_BATTLE_QUERY) ?? null;

  // ------------------------------------------------------------ the chrome
  const panel = make('div', 'phud-panel');
  const shade = make('div', 'phud-shade');
  const foot = make('div', 'phud-foot');
  const footWho = make('b', 'phud-foot__who');
  const footHelp = make('span', 'phud-foot__help');
  foot.append(footWho, footHelp);
  const guide = tapButton('phud-guide', 'Guide', () => toggleGuide());
  const card = make('div', 'phud-card');
  // A background, not an <img>: the portrait module crops every face <img> it finds.
  const cardFace = make('span', 'phud-card__face');
  const cardName = make('b', 'phud-card__name');
  const cardHp = make('span', 'phud-card__hp');
  const cardNote = make('span', 'phud-card__note');
  const cardText = make('div', 'phud-card__text');
  cardText.append(cardName, cardHp);
  card.append(cardFace, cardText, cardNote);
  const target = make('div', 'phud-target');
  const hint = make('p', 'phud-target__hint');
  const bar = make('div', 'phud-target__bar');
  const back = tapButton('phud-target__back', 'Back', () => sendKey('Escape', win));
  const confirm = tapButton('phud-target__go', 'Confirm', () => sendKey('Enter', win));
  bar.append(back, confirm);
  target.append(hint, bar);
  const chrome = [panel, shade, foot, guide, card, target];
  // The panel and the shade go under everything the HUD draws.
  hud.prepend(panel, shade);
  hud.append(foot, guide, card, target);

  function toggleGuide(): void {
    const open = hud.dataset['phoneGuide'] === 'open';
    if (!open) {
      // The guide's own switch is the player's saved preference: turn it on
      // only if it is off, and leave it on when the sheet closes.
      const off = hud.querySelector('.sgd--off .sgd__toggle');
      if (off instanceof HTMLElement) off.click();
    }
    hud.dataset['phoneGuide'] = open ? 'closed' : 'open';
    guide.classList.toggle('phud-guide--on', !open);
  }

  // A tap on the advisor's line is the advisor's own switch (the sheet: "the
  // advisor line itself is the toggle"; the floating HIDE MOVES tab is gone).
  const onAdvisorTap = (e: Event): void => {
    if (!active) return;
    const line = (e.target as HTMLElement | null)?.closest('.mad__card');
    if (!line || !hud.contains(line)) return;
    hud.querySelector<HTMLElement>('.mad__toggle')?.click();
  };
  hud.addEventListener('click', onAdvisorTap);

  // ------------------------------------------------------------ the swipe
  // On `window`: the field is the canvas under the HUD, and the HUD's layers
  // let pointer events through to it.
  let swipeX: number | null = null;
  let swipeY = 0;
  // The list drag: a finger dragged up over a paged list brings on the rows below.
  let dragY: number | null = null;
  const onTouchStart = (e: TouchEvent): void => {
    const t = e.touches[0];
    const aiming = hud.dataset['phoneStep'] === 'target' && hud.dataset['phoneGroup'] !== 'on';
    swipeX = active && aiming && t ? t.clientX : null;
    swipeY = t?.clientY ?? 0;
    const onList = !!opts.dragList && !!(e.target as Element | null)?.closest?.(opts.dragList);
    dragY = active && t && onList && hud.dataset['phoneStep'] === 'menu' ? t.clientY : null;
  };
  const onTouchMove = (e: TouchEvent): void => {
    const t = e.touches[0];
    if (dragY === null || !t) return;
    const dy = t.clientY - dragY;
    if (Math.abs(dy) < ROW_PX) return;
    dragY += Math.sign(dy) * ROW_PX;
    const key = dy < 0 ? 'ArrowDown' : 'ArrowUp';
    sendKey(key, win);
    sendKey(key, win);
  };
  const onTouchEnd = (e: TouchEvent): void => {
    dragY = null;
    const t = e.changedTouches[0];
    const from = swipeX;
    swipeX = null;
    if (from === null || !t) return;
    const dx = t.clientX - from;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(t.clientY - swipeY) > Math.abs(dx)) return;
    // A carousel: a swipe to the left brings on the next one to the right.
    sendKey(dx < 0 ? 'ArrowRight' : 'ArrowLeft', win);
  };
  win.addEventListener('touchstart', onTouchStart, { passive: true });
  win.addEventListener('touchmove', onTouchMove, { passive: true });
  win.addEventListener('touchend', onTouchEnd, { passive: true });

  // -------------------------------------------------------- the mode switch
  let active = false;
  let opened = false;
  let last = '';
  let under = '';
  // The enemy-move line hangs under the rail, which grows with the enemy count
  // (Chapter VI: three boss gauges; the line had covered the second), and the
  // banners and Yojimbo's gauge under the line, which runs to three lines.
  const placeUnderRail = (): void => {
    const bottomOf = (sel: string): number => {
      const el = hud.querySelector<HTMLElement>(sel);
      return el ? Math.round(el.getBoundingClientRect().bottom) : 0;
    };
    const rail = bottomOf(game === 'ffx' ? '.ig-ctb' : '.ffx2hud__enemies');
    if (rail <= 0) return;
    // A chapter panel marked `data-phone-under-rail` (Chapter XII's disc strip) takes the line's slot.
    const line = Math.max(rail, bottomOf('.eint:not(.eint--off) .eint__panel'), bottomOf('.eint--off .eint__toggle'), bottomOf('[data-phone-under-rail]'));
    const next = `${rail}/${line}`;
    if (next === under) return;
    under = next;
    html.style.setProperty('--phud-rail-bottom', `${rail}px`);
    html.style.setProperty('--phud-line-bottom', `${line}px`);
  };
  const apply = (): void => {
    const on = mq?.matches === true;
    if (on === active) return;
    active = on;
    if (on) html.dataset['phoneBattle'] = game;
    else delete html.dataset['phoneBattle'];
    opts.field?.reset();
    last = '';
    // The renderer, the HUD's letterbox and every solver follow the window's resize.
    win.dispatchEvent(new Event('resize'));
    if (on) refresh();
  };

  const refresh = (): void => {
    if (!active) return;
    // FFX folds the enemy-move read-out at every battle start and does not
    // save the switch (`FFXBattleHud`'s `readVisible: () => false`); the
    // sheet's rail has the line under it, so the phone opens it once. FFX-2's
    // switch is the player's saved preference and is left alone.
    if (!opened && game === 'ffx') {
      const folded = hud.querySelector<HTMLElement>('.eint--off .eint__toggle');
      if (folded) {
        opened = true;
        folded.click();
      }
    }
    const text = read(hud);
    // The field's slide (`phoneFraming.ts`): with a menu up, the party and the
    // boss; while aiming at one figure, that figure first.
    const aimed = hud.querySelector<HTMLElement>('.ffx-targeting .ffx-target[data-target-id]:not(.ffx-target--dim)');
    if (text.targeting && !text.group && aimed?.dataset['targetId']) opts.field?.frame(HOME_ASPECT[game], [aimed.dataset['targetId']]);
    else if (!text.targeting && hud.querySelector('.ig-cmd')) opts.field?.frame(HOME_ASPECT[game]);
    placeUnderRail();
    const key = JSON.stringify(text);
    if (key === last) return;
    last = key;
    hud.dataset['phoneStep'] = text.targeting ? 'target' : 'menu';
    hud.dataset['phoneGroup'] = text.targeting && text.group ? 'on' : 'off';
    hud.classList.toggle('phud--sensor', text.targeting && text.sensor);
    footWho.textContent = text.actor;
    footHelp.textContent = text.help;
    foot.classList.toggle('phud-foot--empty', !text.actor && !text.help);
    cardName.textContent = text.target;
    cardHp.textContent = text.targetHp;
    cardNote.textContent = [text.command, text.help].filter(Boolean).join(' · ');
    cardFace.style.backgroundImage = text.targetFace ? `url("${text.targetFace}")` : '';
    cardFace.hidden = !text.targetFace;
    hint.textContent = targetHint(game, text.ally, text.group === true);
    confirm.textContent = confirmLabel(text);
  };

  mq?.addEventListener?.('change', apply);
  const timer = win.setInterval(refresh, REFRESH_MS);
  apply();

  return {
    get active() {
      return active;
    },
    refresh,
    destroy(): void {
      win.clearInterval(timer);
      mq?.removeEventListener?.('change', apply);
      hud.removeEventListener('click', onAdvisorTap);
      win.removeEventListener('touchstart', onTouchStart);
      win.removeEventListener('touchmove', onTouchMove);
      win.removeEventListener('touchend', onTouchEnd);
      for (const el of chrome) el.remove();
      delete hud.dataset['phoneStep'];
      delete hud.dataset['phoneGuide'];
      delete hud.dataset['phoneGroup'];
      html.style.removeProperty('--phud-rail-bottom');
      html.style.removeProperty('--phud-line-bottom');
      opts.field?.reset();
      hud.classList.remove('phud--sensor');
      if (active && html.dataset['phoneBattle'] === game) {
        delete html.dataset['phoneBattle'];
        win.dispatchEvent(new Event('resize'));
      }
      active = false;
    },
  };
}

/**
 * Wrap a battle HUD so its own `mount` / `unmount` put the phone layout on and
 * take it off. The HUD's files are not touched (both are past the 400-line
 * house rule); `BattleScreenWiring.createHud` is the one call site.
 */
export function withPhoneLayout<T extends HudPort>(hud: T, install: (el: HTMLElement, field: PhoneField) => PhoneBattle): T {
  const mount = hud.mount.bind(hud);
  const unmount = hud.unmount.bind(hud);
  let phone: PhoneBattle | null = null;
  // What the field's slide is picked from (`phoneFraming.ts`): the figures'
  // boxes, who is on the field, and whose menu is up. Read, never changed.
  // (Each guarded: test doubles implement only part of the port.)
  const field = createPhoneField();
  const { sync, chooseCommand, setTargetingPort, setVisible } = hud;
  if (sync) {
    hud.sync = (state, preview): void => {
      field.setState(state);
      sync.call(hud, state, preview);
    };
  }
  if (chooseCommand) {
    hud.chooseCommand = (actorId, commands, previewRank) => {
      field.setActor(actorId);
      return chooseCommand.call(hud, actorId, commands, previewRank);
    };
  }
  if (setTargetingPort) {
    hud.setTargetingPort = (port): void => {
      field.setRects((id) => port.rect(id));
      setTargetingPort.call(hud, port);
    };
  }
  // A mid-battle cutscene hides the HUD: the field goes back to its default slide.
  if (setVisible) {
    hud.setVisible = (visible: boolean): void => {
      if (!visible) field.reset();
      setVisible.call(hud, visible);
    };
  }
  hud.mount = (root: HTMLElement): void => {
    mount(root);
    const el = root.querySelector<HTMLElement>(':scope > [data-role$="hud"]');
    if (el && !phone) phone = install(el, field);
  };
  hud.unmount = (): void => {
    phone?.destroy();
    phone = null;
    unmount();
  };
  return hud;
}
