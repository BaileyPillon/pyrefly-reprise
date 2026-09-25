/**
 * The words the phone battle HUD prints and the keys it sends (option B
 * "compact rail", Bailey 2026-09-25; `phoneBattle.ts` has the layout and the
 * sources). Game case: **both**; each game reads its own HUD in its own half
 * (`ui/ffx/phoneHud.ts`, `ui/ffx2/phoneHud.ts`).
 */

import type { GameId } from '../../battle/common/types.ts';

export interface PhoneBattleText {
  /** Whose turn it is, for the footer. */
  actor: string;
  /** The footer's second half: the selected command's help line. */
  help: string;
  /** The command being aimed, for the Confirm button and the card's note. */
  command: string;
  /** The combatant under the cursor (or "All enemies"). */
  target: string;
  /** Its HP line, when the HUD shows one. */
  targetHp: string;
  /** Its face, when the HUD has one on screen. */
  targetFace: string;
  /** Whether the target step is up. */
  targeting: boolean;
  /** Whether the step is aiming at the party. */
  ally: boolean;
  /** FFX: the Sensor card is up for this enemy and stands in for the target card. */
  sensor: boolean;
  /** The step aims at a whole side at once ("ALL ALLIES"): no single figure to switch to. */
  group?: boolean;
}

/** Reads what the chrome prints from the HUD's own DOM; one per game. */
export type PhoneTextReader = (hud: HTMLElement) => PhoneBattleText;

/** The label for the Confirm button: `Attack → Mortiorchis`, or `Confirm` with nothing to name. */
export function confirmLabel(text: Pick<PhoneBattleText, 'command' | 'target'>): string {
  const cmd = text.command.trim();
  const tgt = text.target.trim();
  if (cmd && tgt) return `${cmd} → ${tgt}`;
  return tgt ? `Confirm → ${tgt}` : 'Confirm';
}

/** The hint over the Back / Confirm bar. The sheet calls FFX-2's party "girls". */
export function targetHint(game: GameId, ally: boolean, group = false): string {
  if (group) return `${ally ? (game === 'ffx2' ? 'All three girls' : 'The whole party') : 'Every enemy'} at once · Confirm or Back`;
  const who = ally ? (game === 'ffx2' ? 'girl' : 'ally') : 'enemy';
  return `Tap another ${who} to switch · swipe ← →`;
}

/** Send a key through the path a real press takes. */
export function sendKey(code: string, win: Window = window): void {
  const key = code.startsWith('Arrow') || code === 'Enter' || code === 'Escape' ? code : code.replace(/^Key/, '').toLowerCase();
  win.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true, cancelable: true }));
  win.dispatchEvent(new KeyboardEvent('keyup', { code, key, bubbles: true, cancelable: true }));
}

/** Text of the first match, trimmed and on one line. */
export function textOf(root: ParentNode, selector: string): string {
  return (root.querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * A group aim ("ALL ALLIES", Pray, Mega-Potion, a -ga spell). Its brackets
 * carry no `data-target-id` (none of them can be picked alone, `TargetCursor`),
 * only `.ffx-target--group`, so the single-target test missed it and the
 * Back / Confirm bar never came up.
 */
export function readGroup(hud: ParentNode): { on: boolean; ally: boolean; name: string } {
  const first = hud.querySelector<HTMLElement>('.ffx-targeting .ffx-target--group');
  if (!first) return { on: false, ally: false, name: '' };
  const ally = !first.classList.contains('ffx-target--enemy');
  const label = textOf(hud, '.ffx-targeting .ffx-target__all span');
  const name = label ? label.charAt(0) + label.slice(1).toLowerCase() : ally ? 'All allies' : 'All enemies';
  return { on: true, ally, name };
}
