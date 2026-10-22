/**
 * FFX-2's ability name slab (motion pass, lane "fx", step 3; Bailey 2026-10-22: Overdrives and big moves "Each game's own intro"; `engine/spellfx/FxSwitch.ts`). **FFX-2 only** (Chapter IV, with the new
 * effects on; FFX has its own top banner).
 *
 * Sourced (`docs/handoff/motion-fx-reference.md` section 3.2, Square Enix JP's FFX-2 battle short, V4): the move's name sits in a small dark slab with a gold border above the acting girl's head and
 * the slab follows the girl while the effect plays; FFX's top banner is not used. What is [ours]: the colours, the type, how long it stays (it stays while the action does, at least `MIN_HOLD_MS`
 * and at most `MAX_HOLD_MS`; the footage shows it for the length of the effect, 1 to 2 s), and which commands it names (a plain attack, defend, an item and a dress change do not get one; Bahamut's plain Attack is an `ability` command with the id `attack` and gets none either).
 * The paper banner at the top right (`battleMessage.ts`, the approved tile) is left as it is; whether the slab should replace it is a question for Bailey.
 *
 * It lives on the HUD's unscaled overlay in viewport pixels, like the damage numerals and the chain counter, and takes its size from the letterbox scale. The timing is pure ({@link slabState}) so
 * it can be tested without a DOM.
 */
import './name-slab.css';
import type { BattleEvent, CombatantId } from '../../battle/common/types.ts';
import { fxPieceOn } from '../../engine/spellfx/FxSwitch.ts';

export const MIN_HOLD_MS = 1400;
export const MAX_HOLD_MS = 3200;
export const OUT_MS = 240;

/** Which commands get a slab. */
export const SLAB_COMMANDS: ReadonlySet<string> = new Set(['ability', 'overdrive', 'summon', 'trigger']);

/** The generic Attack, whichever way the engine names it (a foe's plain blow is an `ability` command with the id `attack`): it gets no slab (review m5). */
export function isPlainAttack(event: Extract<BattleEvent, { type: 'action-start' }>): boolean {
  return event.abilityId === 'attack' || (event.command as { id?: string }).id === 'attack';
}

export type SlabState = 'in' | 'hold' | 'out' | 'gone';

/** Where a slab is in its life, `age` ms after it started and `endedAt` ms (age at which its action ended, or null while it is still running). Pure. */
export function slabState(age: number, endedAt: number | null): SlabState {
  const held = Math.min(MAX_HOLD_MS, Math.max(MIN_HOLD_MS, endedAt ?? 0));
  const until = endedAt === null ? MAX_HOLD_MS : held;
  if (age < 140) return 'in';
  if (age < until) return 'hold';
  return age < until + OUT_MS ? 'out' : 'gone';
}

export interface NameSlabDeps {
  overlay(): HTMLElement | null;
  scale(): number;
  /** The girl's head point in overlay pixels, or null when she is off the field. */
  head(id: CombatantId): { x: number; y: number } | null;
}

interface Live {
  el: HTMLElement;
  who: CombatantId;
  age: number;
  endedAt: number | null;
}

export class AbilityNameSlab {
  private readonly live: Live[] = [];

  constructor(private readonly deps: NameSlabDeps) {}

  /** An `action-start` event: raise a slab over the girl when the command is one that gets it. */
  start(event: Extract<BattleEvent, { type: 'action-start' }>): void {
    if (!fxPieceOn('slab') || !event.abilityName || !SLAB_COMMANDS.has(event.command.kind) || isPlainAttack(event)) return;
    const overlay = this.deps.overlay();
    if (!overlay) return;
    for (const s of this.live) if (s.who === event.actorId) s.endedAt = s.age; // a new move of the same girl retires her last slab
    const el = overlay.ownerDocument.createElement('div');
    el.className = 'ffx2ns';
    el.dataset['state'] = 'in';
    el.dataset['who'] = event.actorId;
    el.textContent = event.abilityName;
    overlay.appendChild(el);
    this.live.push({ el, who: event.actorId, age: 0, endedAt: null });
    this.place(this.live[this.live.length - 1]!);
  }

  /** An `action-end` event: the slab of that girl may go once it has been up long enough. */
  end(who: CombatantId | undefined): void {
    for (const s of this.live) if ((who === undefined || s.who === who) && s.endedAt === null) s.endedAt = s.age;
  }

  /** Every frame: follow the girl, advance the clock, retire the finished. */
  update(dt: number): void {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const s = this.live[i]!;
      s.age += dt * 1000;
      const st = slabState(s.age, s.endedAt);
      if (st === 'gone') {
        s.el.remove();
        this.live.splice(i, 1);
        continue;
      }
      s.el.dataset['state'] = st;
      this.place(s);
    }
  }

  private place(s: Live): void {
    const p = this.deps.head(s.who);
    if (!p) return;
    const scale = this.deps.scale() || 1;
    s.el.style.setProperty('--ns-scale', String(scale));
    s.el.style.left = `${p.x}px`;
    s.el.style.top = `${p.y - 14 * scale}px`;
  }

  get count(): number {
    return this.live.length;
  }

  dispose(): void {
    for (const s of this.live) s.el.remove();
    this.live.length = 0;
  }
}
