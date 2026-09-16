/**
 * Stand-in implementations of the presenter's DOM-side ports, plus the hook
 * `src/ui/common` uses to take them over.
 *
 * The battle is playable — and screenshot-able — before the UI agents land
 * their real damage numerals and message bar. When they do, they call
 * {@link setDamageNumbersFactory} / {@link setMessageBarFactory} once at module
 * load and every `BattleScreen` picks the real thing up on its next mount.
 * Neither side has to edit the other's files.
 *
 * ```ts
 * // src/ui/common/index.ts
 * import { setDamageNumbersFactory } from '../../engine/BattlePresenterFallbacks.ts';
 * setDamageNumbersFactory((root) => new DamageNumbers(root));
 * ```
 */

import type { MessageKind } from '../battle/common/types.ts';
import type { DamageNumbersPort, MessageBarPort } from './BattlePresenterPorts.ts';

type DamageNumbersFactory = (root: HTMLElement) => DamageNumbersPort;
type MessageBarFactory = (root: HTMLElement) => MessageBarPort;

let damageFactory: DamageNumbersFactory | null = null;
let messageFactory: MessageBarFactory | null = null;

/** Called by `ui/common` to supply the real numerals. */
export function setDamageNumbersFactory(factory: DamageNumbersFactory | null): void {
  damageFactory = factory;
}

/** Called by `ui/common` to supply the real message bar. */
export function setMessageBarFactory(factory: MessageBarFactory | null): void {
  messageFactory = factory;
}

/** True once `ui/common` has registered real implementations. */
export function uiPortsRegistered(): { damageNumbers: boolean; messageBar: boolean } {
  return { damageNumbers: damageFactory !== null, messageBar: messageFactory !== null };
}

/** The real numerals if `ui/common` registered some, else the fallback. */
export function createDamageNumbers(root: HTMLElement): DamageNumbersPort {
  return damageFactory ? damageFactory(root) : new FallbackDamageNumbers(root);
}

/** The real message bar if `ui/common` registered one, else the fallback. */
export function createMessageBar(root: HTMLElement): MessageBarPort {
  return messageFactory ? messageFactory(root) : new FallbackMessageBar(root);
}

const STYLE_ID = 'pyrefly-presenter-fallback-style';

const CSS = `
.pf-numerals { position: absolute; inset: 0; pointer-events: none; z-index: 30; }
.pf-num {
  position: fixed;
  transform: translate(-50%, -50%);
  font-family: var(--font-display, system-ui), system-ui, sans-serif;
  font-weight: 700;
  font-size: 30px;
  line-height: 1;
  letter-spacing: 0.02em;
  color: #fff;
  text-shadow: 0 2px 0 rgba(0,0,0,.65), 0 0 14px rgba(0,0,0,.55);
  will-change: transform, opacity;
  animation: pf-rise 900ms cubic-bezier(.2,.7,.3,1) forwards;
}
.pf-num--crit { font-size: 42px; color: #ffe89a; text-shadow: 0 2px 0 rgba(90,40,0,.7), 0 0 22px rgba(255,190,80,.7); }
.pf-num--heal { color: #9dffc4; text-shadow: 0 2px 0 rgba(0,50,25,.7), 0 0 18px rgba(80,255,170,.5); }
.pf-num--mp-heal, .pf-num--mp-damage { color: #bcd9ff; font-size: 24px; }
.pf-num--miss { color: #d8e4f7; font-size: 24px; letter-spacing: .16em; }
.pf-num--label { color: #d8e4f7; font-size: 22px; letter-spacing: .16em; }
@keyframes pf-rise {
  0%   { opacity: 0; transform: translate(-50%, -30%) scale(.6); }
  16%  { opacity: 1; transform: translate(-50%, -78%) scale(1.12); }
  32%  { transform: translate(-50%, -70%) scale(1); }
  74%  { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -128%) scale(.96); }
}
.pf-msgbar {
  position: absolute;
  left: 50%;
  top: 28px;
  transform: translateX(-50%);
  min-width: 260px;
  max-width: 62ch;
  padding: 9px 22px;
  text-align: center;
  border: 1px solid rgba(150, 195, 255, .26);
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(10,24,50,.82), rgba(3,7,16,.9));
  font-family: var(--font-display, system-ui), system-ui, sans-serif;
  font-size: 13px;
  letter-spacing: .1em;
  color: #e4eeff;
  opacity: 0;
  transition: opacity 160ms ease;
  pointer-events: none;
  z-index: 32;
}
.pf-msgbar[data-on="1"] { opacity: 1; }
.pf-msgbar[data-kind="telegraph"] { border-color: rgba(255,120,90,.55); color: #ffd9cc; }
.pf-msgbar[data-kind="story"] { border-color: rgba(190,160,255,.45); }
`;

function ensureStyle(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

/**
 * Rising numerals. Multi-hit actions stack up a diagonal ladder, which is what
 * makes a 12-hit Attack Reels readable instead of one blurred pile.
 */
export class FallbackDamageNumbers implements DamageNumbersPort {
  private readonly layer: HTMLElement;

  constructor(root: HTMLElement) {
    ensureStyle();
    this.layer = document.createElement('div');
    this.layer.className = 'pf-numerals';
    root.appendChild(this.layer);
  }

  show(n: Parameters<DamageNumbersPort['show']>[0]): void {
    const el = document.createElement('div');
    const kind = n.kind;
    el.className = `pf-num pf-num--${kind}${n.crit ? ' pf-num--crit' : ''}`;
    el.textContent =
      n.text ??
      (kind === 'mp-damage' || kind === 'mp-heal'
        ? `${Math.abs(n.amount ?? 0)} MP`
        : String(Math.abs(n.amount ?? 0)));

    // Ladder: each extra hit steps right and up so the stack stays legible.
    const i = n.hitIndex ?? 0;
    const count = n.hitCount ?? 1;
    const dx = count > 1 ? (i - (count - 1) / 2) * 26 : 0;
    const dy = count > 1 ? -i * 17 : 0;
    el.style.left = `${n.x + dx}px`;
    el.style.top = `${n.y + dy}px`;

    this.layer.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
    // Belt and braces: a backgrounded tab never fires animationend.
    window.setTimeout(() => el.remove(), 1600);
  }

  clear(): void {
    this.layer.replaceChildren();
  }

  dispose(): void {
    this.layer.remove();
  }
}

/** The battle banner: `"Seymour Flux uses Lance of Atrophy"`. */
export class FallbackMessageBar implements MessageBarPort {
  private readonly el: HTMLElement;
  private hideTimer = 0;

  constructor(root: HTMLElement) {
    ensureStyle();
    this.el = document.createElement('div');
    this.el.className = 'pf-msgbar';
    this.el.dataset['on'] = '0';
    root.appendChild(this.el);
  }

  show(text: string, kind: MessageKind, ms = 900): Promise<void> {
    window.clearTimeout(this.hideTimer);
    this.el.textContent = text;
    this.el.dataset['kind'] = kind;
    this.el.dataset['on'] = '1';
    return new Promise((resolve) => {
      this.hideTimer = window.setTimeout(() => {
        this.el.dataset['on'] = '0';
        resolve();
      }, ms);
    });
  }

  clear(): void {
    window.clearTimeout(this.hideTimer);
    this.el.dataset['on'] = '0';
    this.el.textContent = '';
  }

  dispose(): void {
    window.clearTimeout(this.hideTimer);
    this.el.remove();
  }
}
