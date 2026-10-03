/**
 * The EYE CANDY page the OPTIONS tab's EYE CANDY row opens (D-317: Bailey, 2026-10-02 ~01:15 EDT,
 * "all your recommendations, godspeed", option A; approved frames
 * `docs/concepts/eye-candy-settings-2026-10-02/a*.jpg`).
 *
 * Built like the credits panel (`creditsPanel.ts`, D-305): it takes the place of the two OPTIONS
 * columns and the prompts, and leaves the tab strip, the brand line, the painting and (on a desktop
 * window) the objective line where they were. ALL LOOKS on top, then the three looks, each with its
 * parts indented under it, one help line for the focused switch, and its own `Esc BACK` prompt.
 *
 * Input (`PauseOverlays.pageInput` hands it the frame): Up / Down walk one flat list, column one then
 * column two, wrapping; Left, Right and Confirm flip the focused switch; on ALL LOOKS, Left is ALL OFF,
 * Right is ALL ON and Confirm flips between ALL ON and not; a click or tap flips the row it lands on.
 * Every write goes through `SaveStore.setSettings`, so the looks and the `eyeCandyFlags.ts` seam follow
 * at once. A look turned off keeps its parts' own values, drawn dim (`fxParts.ts`). REDUCE MOTION is
 * shown, never written: a part it holds still or makes a cut reads `ON · STILL` or `ON · CUT`. So is the
 * device (release 36): a part the tier or a phone held upright closes reads `ON · OFF HERE`, one it trims
 * `ON · LESS HERE` (`deviceNote`, the rule the mix plays by), and the help line says why; the saved value,
 * the count and the seam never change with the device.
 *
 * Game case: both; OVERDRIVE SHOT is listed only in an FFX chapter and DRESSPHERE SHOT only in an
 * FFX-2 chapter (11 switches each). The accents are the pause's own `--pu-accent`: gold under FFX,
 * pyre pink under FFX-2 (`.ig--ffx2`).
 */

import { audio } from '../../../audio/index.ts';
import type { GameId } from '../../../battle/common/types.ts';
import type { InputSnapshot } from '../../Input.ts';
import type { SaveStore } from '../../SaveData.ts';
import { escapeHtml } from '../../../ui/common/html.ts';
import { eyeCandy } from '../../../engine/fx/EyeCandy.ts';
import { deviceNote, fightFacts, type Device, type DeviceNote, type MixPart } from '../../../engine/fx/mix/gates.ts';
import { phoneBattle } from '../../../engine/fx/mix/hudPanels.ts';
import {
  FX_PARTS,
  fxAllOffPatch,
  fxAllOnPatch,
  fxAllState,
  fxCount,
  fxOwnValue,
  fxStoppedByLook,
  fxSwitchesFor,
  fxSwitchOn,
  isFxSwitchField,
  type FxSwitchGame,
  type FxSwitchRow,
} from '../../fxParts.ts';
import { adjustSetting } from './settings.ts';
import '../../../ui/common/pause-eye-candy.css';

/** The root class that swaps the OPTIONS columns and prompts for the page. */
export const EYE_CANDY_OPEN_CLASS = 'pause--ec';
/** The `data-action` of the page's `Esc BACK` prompt. */
export const EYE_CANDY_CLOSE_ACTION = 'pause:ec:close';
/** The `data-action` prefix of a row: a click or tap flips it. */
export const EYE_CANDY_ROW_ACTION = 'pause:ec:row:';
/** The ALL LOOKS row's id. */
export const EYE_CANDY_ALL = 'fxAll';

/** One help line per switch: what it does, and what REDUCE MOTION makes of it (`STILL` or `CUT`). */
const HELP: Readonly<Record<string, { body: string; rm?: 'STILL' | 'CUT' }>> = {
  fxAll: { body: 'ALL ON or ALL OFF in one press. Every look and part below still has its own switch.' },
  fxLight: { body: 'The golden hour in FFX, the pink hour in FFX-2: colour grade, glow and light shafts. The parts under it only work while it is ON.' },
  fxDof: { body: 'Aims the soft focus band at your fighters, set for each chapter’s camera. Off: the scene keeps its own band.' },
  fxFog: { body: 'Thin haze between your party and the big enemies, so they look far away. Off: clear air.' },
  fxEdges: { body: 'Cleaner outlines on every fighter: no jagged steps and no pale fringe around the paint.' },
  fxLiving: { body: 'Scenery that moves: depth, weather, lamplight and a slow drift of the camera. The parts under it only work while it is ON.' },
  fxBreath: { body: 'Fighters breathe at rest: shoulders rise and fall and nothing else moves. REDUCE MOTION holds them still.', rm: 'STILL' },
  fxKo: { body: 'A knocked-out fighter buckles and sinks before the KO painting shows. REDUCE MOTION makes it a cut.', rm: 'CUT' },
  fxSpectacle: { body: 'Impact frames, spell light and the splash cut-ins. The parts under it only work while it is ON.' },
  fxFraming: { body: 'A camera placed for each chapter: low and wide for the giants, clear of the menus. Off: the standard battle camera.' },
  fxHero: { body: 'While you enter an Overdrive, the camera holds a close shot of the fighter, then cuts back. REDUCE MOTION keeps one cut.', rm: 'CUT' },
  fxSphere: { body: 'On a dressphere change the camera cuts to a held close shot of the girl, then cuts back. REDUCE MOTION keeps one cut.', rm: 'CUT' },
  fxSplash: { body: 'Painted art on the aeon and Special splash cut-ins. Off: the plain splash.' },
};

/** What the device does to a switch, in the row's word (`ON · OFF HERE`, `ON · LESS HERE`). */
const LIMIT_WORD: Readonly<Record<DeviceNote['limit'], string>> = { off: 'OFF HERE', less: 'LESS HERE' };

/** The same, with its reason, under the help line: per switch, then why (LOW EFFECTS, or a phone screen). */
const DEVICE_WHY: Readonly<Record<string, Partial<Record<DeviceNote['why'], string>>>> = {
  fxDof: { phone: 'Off on a phone screen.', low: 'Off under LOW EFFECTS.' },
  fxFog: { low: 'Off under LOW EFFECTS.' },
  fxEdges: { low: 'LOW EFFECTS keeps only the fringe fix, not the outline pass.' },
  fxFraming: { phone: 'On a phone held upright the bosses keep their usual size; the rest still works.' },
  fxHero: { phone: 'Off on a phone held upright: it shows a slice of the picture, so the camera stays wide.' },
  fxSphere: { phone: 'Off on a phone held upright: it shows a slice of the picture, so the camera stays wide.' },
};

/** The device as the mix sees it: the live tier (LOW EFFECTS, or a small screen), the upright phone layout, and whether the fight has a colossus. */
const liveDevice = (): Device => ({ tier: eyeCandy.tier, phone: phoneBattle(), colossus: fightFacts.colossus });

const GAME_LINE: Readonly<Record<FxSwitchGame, string>> = { both: 'Both games.', ffx: 'FFX only.', ffx2: 'FFX-2 only.' };

export interface EyeCandyPageDeps {
  save: SaveStore;
  /** Whose chapter this is: it decides OVERDRIVE SHOT (FFX) or DRESSPHERE SHOT (FFX-2). */
  game: GameId;
  /** REDUCE MOTION as the fx read it (the OPTIONS row or the OS): shown on the page, never written. */
  reduceMotion: () => boolean;
  /** The device as the mix sees it (tests inject one): shown on the page, never written. Default: the live one. */
  device?: () => Device;
}

export class EyeCandyPage {
  private readonly root: HTMLElement;
  private readonly deps: EyeCandyPageDeps;
  private readonly layer: HTMLElement;
  private readonly switches: FxSwitchRow[];
  /** The row ids in walking order: ALL LOOKS, then each look and its parts. */
  private readonly order: string[];
  private at: string = EYE_CANDY_ALL;
  /** The device as of the last draw (`render` reads it afresh each time). */
  private dev: Device = { tier: 'full', phone: false };

  /** @param root the pause view's root: the element the `pause--*` classes live on. */
  constructor(root: HTMLElement, deps: EyeCandyPageDeps) {
    this.root = root;
    this.deps = deps;
    this.switches = fxSwitchesFor(deps.game);
    this.order = [EYE_CANDY_ALL, ...this.switches.map((s) => s.field)];
    const host = root.querySelector<HTMLElement>('[data-role="ui"]') ?? root;
    this.layer = document.createElement('div');
    this.layer.className = 'pause__ec-layer';
    this.layer.dataset['role'] = 'eye-candy';
    this.layer.innerHTML = this.frameHtml();
    host.appendChild(this.layer);
    this.scroller?.addEventListener('scroll', this.onScroll, { passive: true });
    root.classList.add(EYE_CANDY_OPEN_CLASS);
    this.render();
  }

  private get scroller(): HTMLElement | null {
    return this.layer.querySelector<HTMLElement>('[data-role="ec-scroll"]');
  }

  /** The selected row's id. */
  get row(): string {
    return this.at;
  }

  /** One frame of input that the page owns (moves, flips, taps). Closing is the caller's. */
  input(input: InputSnapshot): void {
    for (const a of input.actions) {
      if (!a.startsWith(EYE_CANDY_ROW_ACTION)) continue;
      const id = a.slice(EYE_CANDY_ROW_ACTION.length);
      if (!this.order.includes(id)) continue;
      this.at = id;
      this.flip(id, 1, true);
    }
    if (input.justPressed('down')) this.move(1);
    if (input.justPressed('up')) this.move(-1);
    if (input.justPressed('right')) this.flip(this.at, 1, false);
    if (input.justPressed('left')) this.flip(this.at, -1, false);
    if (input.justPressed('confirm')) this.flip(this.at, 1, true);
  }

  private move(dir: 1 | -1): void {
    const i = Math.max(0, this.order.indexOf(this.at));
    this.at = this.order[(i + dir + this.order.length) % this.order.length] ?? EYE_CANDY_ALL;
    audio.playSfx('cursor-move');
    this.render();
  }

  /** @param press Confirm or a tap, not an arrow. */
  private flip(id: string, dir: 1 | -1, press: boolean): void {
    const save = this.deps.save;
    if (id === EYE_CANDY_ALL) {
      const allOn = fxAllState(save.settings, this.deps.game) === 'ALL ON';
      save.setSettings((press ? !allOn : dir === 1) ? fxAllOnPatch() : fxAllOffPatch());
    } else if (!isFxSwitchField(id) || !adjustSetting(save, id, dir, press)) {
      return;
    }
    audio.playSfx('cursor-move');
    this.render();
  }

  // ---------------------------------------------------------------- markup

  private frameHtml(): string {
    const help = (where: string): string =>
      `<div class="pause__ec-help pause__ec-help--${where}" data-role="ec-help-${where}">` +
      '<span class="pause__ec-help-t"></span><span class="pause__ec-help-b"></span><span class="pause__ec-help-g"></span></div>';
    return (
      `<section class="pause__ec" role="dialog" aria-label="Eye candy">` +
      `<h3 class="pause__ec-h" data-role="ec-head"></h3>` +
      `<div class="pause__ec-scroll" data-role="ec-scroll">` +
      `<div class="pause__ec-cols"><div class="pause__ec-col" data-ec-col="1"></div>` +
      `<div class="pause__ec-col" data-ec-col="2"><div data-role="ec-col2"></div>${help('desk')}</div></div></div>` +
      `${help('phone')}</section>` +
      `<div class="pause__back pause__ec-back" data-action="${EYE_CANDY_CLOSE_ACTION}" role="button" tabindex="0">` +
      `<span class="pause__key">Esc</span>Back</div>` +
      `<div class="pause__hide pause__ec-hint" aria-hidden="true">` +
      `<span class="pause__ec-hint-desk">Up / Down&nbsp;&nbsp;move&nbsp;&nbsp;&middot;&nbsp;&nbsp;Left / Right&nbsp;&nbsp;flip</span>` +
      `<span class="pause__ec-hint-phone">Tap a row to flip it</span></div>`
    );
  }

  /** `quiet`: the small note after the value (`STILL`, `CUT`, `OFF HERE`, `LESS HERE`); `limit`: the device's, for the row's data attribute. */
  private rowHtml(id: string, label: string, value: string, cls: string[], aria: string, quiet = '', limit = ''): string {
    const sel = id === this.at;
    if (sel) cls.push('pause__row--sel');
    return (
      `<div class="pause__row pause__row--word pause__row--cmd pause__ec-row ${cls.join(' ')}" data-row="${escapeHtml(id)}"` +
      ` data-action="${EYE_CANDY_ROW_ACTION}${escapeHtml(id)}" ${aria} tabindex="${sel ? 0 : -1}">` +
      `<span class="pause__k">${escapeHtml(label)}</span>` +
      `<span class="pause__v">${escapeHtml(value)}${quiet ? `<em${limit ? ` data-limit="${limit}"` : ''}>&middot; ${escapeHtml(quiet)}</em>` : ''}</span></div>`
    );
  }

  /**
   * What the device does to a part right now, when it would otherwise play: a part turned OFF, or whose look is
   * OFF, plays nothing anyway and shows no note (as REDUCE MOTION's notes).
   */
  private limitOf(field: string): DeviceNote | null {
    const part = FX_PARTS.find((p) => p.field === field);
    if (!part || !fxSwitchOn(this.deps.save.settings, part.field)) return null;
    return deviceNote(part.key as MixPart, this.dev);
  }

  private switchHtml(s: FxSwitchRow): string {
    const settings = this.deps.save.settings;
    const own = fxOwnValue(settings, s.field);
    const dim = fxStoppedByLook(settings, s.field);
    const cls = [s.kind === 'look' ? 'pause__ec-row--look' : 'pause__ec-row--part'];
    if (!own) cls.push('pause__ec-row--off');
    if (dim) cls.push('pause__ec-row--dim');
    const rm = HELP[s.field]?.rm;
    // The device outranks REDUCE MOTION: a shot closed on a phone is not "one cut", it is not there.
    const limit = this.limitOf(s.field);
    // PR-0322: a part that is ON but whose look is OFF plays nothing, so its row says so instead of a bare ON.
    const quiet = limit ? LIMIT_WORD[limit.limit] : dim && own ? 'LOOK OFF' : rm && own && !dim && this.deps.reduceMotion() ? rm : '';
    return this.rowHtml(s.field, s.label, own ? 'ON' : 'OFF', cls, `role="switch" aria-checked="${own}"`, quiet, limit?.limit ?? '');
  }

  private allHtml(): string {
    const state = fxAllState(this.deps.save.settings, this.deps.game);
    const cls = ['pause__ec-row--all', 'pause__ec-row--look'];
    if (state === 'ALL OFF') cls.push('pause__ec-row--off');
    const checked = state === 'ALL ON' ? 'true' : state === 'ALL OFF' ? 'false' : 'mixed';
    return this.rowHtml(EYE_CANDY_ALL, 'ALL LOOKS', state, cls, `role="checkbox" aria-checked="${checked}"`);
  }

  /** Redraw the rows, the count and the help line from the live settings; the cursor keeps its place. */
  render(): void {
    const settings = this.deps.save.settings;
    this.dev = (this.deps.device ?? liveDevice)();
    const looks = this.switches.filter((s) => s.kind === 'look');
    const group = (look: string): string => this.switches.filter((s) => s.look === look).map((s) => this.switchHtml(s)).join('');
    const col1 = this.layer.querySelector<HTMLElement>('[data-ec-col="1"]');
    const col2 = this.layer.querySelector<HTMLElement>('[data-role="ec-col2"]');
    // Column one: ALL LOOKS, a hairline, CINEMA LIGHT and LIVING PAINTINGS; column two: BATTLE SPECTACLE.
    if (col1) col1.innerHTML = this.allHtml() + '<div class="pause__ec-rule" aria-hidden="true"></div>' + looks.slice(0, 2).map((l) => group(l.field)).join('');
    if (col2) col2.innerHTML = looks.slice(2).map((l) => group(l.field)).join('');
    const { on, of } = fxCount(settings, this.deps.game);
    const head = this.layer.querySelector<HTMLElement>('[data-role="ec-head"]');
    if (head) {
      head.innerHTML =
        `Eye candy<b>${on} of ${of} on</b>` + (this.deps.reduceMotion() ? '<b class="pause__ec-rm">Reduce motion is on</b>' : '');
    }
    this.renderHelp();
    const sel = this.layer.querySelector<HTMLElement>('.pause__row--sel');
    // Focus follows the cursor, for a screen reader and a Tab key, as the credits panel's list does.
    sel?.focus({ preventScroll: true });
    sel?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: this.deps.reduceMotion() ? 'auto' : 'smooth' });
    this.onScroll();
  }

  private renderHelp(): void {
    const help = HELP[this.at] ?? { body: '' };
    const s = this.switches.find((r) => r.field === this.at);
    const title = s ? s.label : 'ALL LOOKS';
    const game = GAME_LINE[s ? s.game : 'both'];
    // While the row carries a device note, its reason closes the body, in the accent (as REDUCE MOTION IS ON does).
    const limit = this.limitOf(this.at);
    const why = limit ? DEVICE_WHY[this.at]?.[limit.why] : undefined;
    for (const where of ['desk', 'phone']) {
      const el = this.layer.querySelector<HTMLElement>(`[data-role="ec-help-${where}"]`);
      if (!el) continue;
      el.querySelector('.pause__ec-help-t')!.textContent = title;
      const body = el.querySelector('.pause__ec-help-b')!;
      body.textContent = help.body;
      if (why) {
        const em = document.createElement('em');
        em.className = 'pause__ec-help-d';
        em.textContent = why;
        body.append(em);
      }
      el.querySelector('.pause__ec-help-g')!.textContent = game;
    }
  }

  /** The fades say which way there is more, when a short window makes the list scroll. */
  private readonly onScroll = (): void => {
    const s = this.scroller;
    if (!s) return;
    const max = s.scrollHeight - s.clientHeight;
    this.layer.classList.toggle('pause__ec-layer--above', s.scrollTop > 1);
    this.layer.classList.toggle('pause__ec-layer--below', max - s.scrollTop > 1);
  };

  /** What the page shows, for the debug API and the tests. */
  snapshot(): Record<string, unknown> {
    const settings = this.deps.save.settings;
    return {
      open: true,
      game: this.deps.game,
      row: this.at,
      all: fxAllState(settings, this.deps.game),
      count: fxCount(settings, this.deps.game),
      rows: this.switches.map((s) => ({ id: s.field, own: fxOwnValue(settings, s.field), on: fxSwitchOn(settings, s.field), limit: this.limitOf(s.field)?.limit ?? null })),
      reduceMotion: this.deps.reduceMotion(),
      device: this.dev,
    };
  }

  dispose(): void {
    this.scroller?.removeEventListener('scroll', this.onScroll);
    this.layer.remove();
    this.root.classList.remove(EYE_CANDY_OPEN_CLASS);
  }
}
