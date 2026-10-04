import './defend-control.css';
import type { AvailableCommand } from '../../battle/common/types.ts';
import { commandHelpText } from './commandHelp.ts';
import { namesKeys, type DeviceState } from './minigames/overlayInput.ts';

/**
 * FFX's Defend control: the original game's own button, named on the screen (release 39; **FFX only**).
 *
 * ## What the sources say
 *
 * In the original FFX, Defend is not a row in the command list. It is the **Triangle** button, pressed at the
 * command menu: "Defend (Triangle or Sentinel)" is how SinirothX's *Stat Mechanics FAQ* writes it, two GameFAQs
 * board threads answer a player who cannot find "the defend button" with "press triangle", and a third is titled
 * "press Triangle to defend" (`research/ffx-defend-input-2026-10-04.md`, `[verified: 4 GameFAQs sources]`; the HD
 * Remaster is not separately checked). The build used to leave it unreachable: `buildTopRows` drops the engine's `defend` row on purpose
 * (`CommandMenuLogic.ts`: "reached by an affordance"), and no affordance existed, so a first-time player could not
 * Defend at all ("How do I use defend? That's not clear to me", Bailey, 2026-10-04). Triangle was bound to the
 * party swap instead, which the sources give to **L1** (`research/visual-bible.md` §3.3, GameFAQs A_I_e_x).
 *
 * ## What the player sees (Bailey's pick, 2026-10-04: "I'll go with all of your recommendations")
 *
 * A small tab under the command window, in the HUD's own key-chip idiom (the `G HIDE GUIDE` tab): it names the
 * control for the device in use, exactly as Trigger Happy and the Bushido chips do (`minigames/overlayInput.ts`):
 *
 * | Input    | The tab reads          | Press                                                  |
 * |----------|------------------------|--------------------------------------------------------|
 * | keyboard | `Q  △  DEFEND`         | `Q` (or Shift): `rawInput.KEY_MAP` gives both `triangle` |
 * | gamepad  | `△  DEFEND`            | Triangle, standard button 3                            |
 * | mouse    | `Q  △  DEFEND`         | a click on the tab                                     |
 * | touch    | `DEFEND`, a 40 px target | a tap on the tab                                     |
 *
 * It is on screen whenever the engine offers Defend and the menu is at its top level (the original's Triangle works
 * there, and a submenu or a target step is the player in the middle of choosing something else).
 *
 * ## What it runs
 *
 * The engine's own `defend` command, untouched (`battle/ffx/commands.ts` emits it with `enabled`, `execute.ts`
 * applies the `defend` status for a turn). The move advisor still never offers it (`engine/tactics/advisor-menu.ts`
 * `onTheMenu`, unchanged): this is a control the player reaches for, not a row the card names.
 */

/** The Defend command the engine offers this actor, when it is usable now; `null` when there is none or it is greyed out. */
export function defendCommandOf(commands: readonly AvailableCommand[]): AvailableCommand | null {
  return commands.find((c) => c.command.kind === 'defend' && c.enabled) ?? null;
}

/** What the tab prints and says for a device. */
export interface DefendFace {
  /** The gold key cap: the key on a keyboard or a mouse, the symbol on a pad, none on a finger. */
  key: string;
  /** The PlayStation symbol shown small beside the key (keyboard and mouse only). */
  sym: string;
  /** The word on the tab. */
  label: string;
  /** The accessible name. */
  aria: string;
}

export function defendFace(d: DeviceState): DefendFace {
  if (d.device === 'gamepad') return { key: '△', sym: '', label: 'Defend', aria: 'Defend, Triangle' };
  if (namesKeys(d)) return { key: 'Q', sym: '△', label: 'Defend', aria: 'Defend, key Q' };
  return { key: '', sym: '', label: 'Defend', aria: 'Defend' };
}

/**
 * The tab itself: a button-like element the menu shows under the stack and a tap or a click presses.
 *
 * Its three parts (the key, the symbol, the word) are built once and only have their text changed: a press that
 * switches the device (a finger on a laptop that was last used with the keyboard) changes the words between the
 * pointer going down and coming up, and a browser does not send the `click` to a button whose pressed child was
 * thrown away and rebuilt in between.
 */
export class DefendTag {
  readonly el: HTMLElement;
  private readonly keyEl: HTMLElement;
  private readonly symEl: HTMLElement;
  private readonly labelEl: HTMLElement;
  private cmd: AvailableCommand | null = null;
  private device: DeviceState = { device: 'keyboard', pointerKind: 'mouse' };

  constructor(onPress: () => void) {
    const el = document.createElement('div');
    el.className = 'ffx-cmd-defend';
    el.dataset['role'] = 'defend-tag';
    el.setAttribute('role', 'button');
    el.hidden = true;
    this.keyEl = document.createElement('b');
    this.keyEl.className = 'ffx-cmd-defend__key';
    this.symEl = document.createElement('i');
    this.symEl.className = 'ffx-cmd-defend__sym';
    this.labelEl = document.createElement('span');
    this.labelEl.className = 'ffx-cmd-defend__label';
    el.append(this.keyEl, this.symEl, this.labelEl);
    // `click`, not `pointerdown`: the pause swallows clicks inside the battle root (`rawInput.setRawInputSuspended`),
    // so a tap on this tab cannot spend a turn under the pause the way two clicks once did on Evrae's orders.
    el.addEventListener('click', (e) => {
      e.preventDefault();
      onPress();
    });
    this.el = el;
  }

  /** Whether the tab is up. */
  get shown(): boolean {
    return !this.el.hidden;
  }

  /** The command it runs, or null when there is none. */
  get command(): AvailableCommand | null {
    return this.cmd;
  }

  /** Offer (or stop offering) Defend for the open decision. The tab shows only while `visible` and a command exists. */
  set(cmd: AvailableCommand | null, visible: boolean, device: DeviceState): void {
    this.cmd = cmd;
    this.device = device;
    const show = !!cmd && visible;
    this.el.hidden = !show;
    if (!show) return;
    this.render();
    this.el.title = commandHelpText(cmd!);
  }

  /** The player switched device: the words follow. */
  setDevice(device: DeviceState): void {
    if (device.device === this.device.device && device.pointerKind === this.device.pointerKind) return;
    this.device = device;
    if (!this.el.hidden) this.render();
  }

  private render(): void {
    const f = defendFace(this.device);
    this.el.dataset['input'] = this.device.device;
    this.el.setAttribute('aria-label', f.aria);
    this.keyEl.textContent = f.key;
    this.keyEl.hidden = !f.key;
    this.symEl.textContent = f.sym;
    this.symEl.hidden = !f.sym;
    this.labelEl.textContent = f.label;
  }
}
