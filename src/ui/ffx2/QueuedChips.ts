import './queued-chip.css';
import type { BattleState, Command, CombatantId } from '../../battle/common/types.ts';
import { ABILITIES, ITEMS } from '../../data/ffx2/index.ts';

/**
 * PR-0104 (FFX-2 only; rule-15 method check `docs/plans/pr-0104-method-check.md`): a girl's confirmed command
 * is acknowledged **at the confirm**.
 *
 * Under FFX-2's ATB a confirmed spell charges on the purple bar while the next girl's menu opens. For the whole
 * charge (about 2.3 s for Shell) the screen showed a cast pose and nothing that said *which* command, because the
 * name's first appearance is the effect tag at the action's first event [critic rounds 17 to 19: no frame from 0 to
 * 2.2 s shows "Shell"]. The engine already holds the queued command (`AtbState.charging.commandRef`, set at the
 * submit, cleared when the action starts), and the HUD receives that state on every `sync`; this draws its name in
 * a chip over the girl's head until the action starts. Presentation only: no timing, cut-in, ATB or engine change
 * (rule 1: DOM only, nothing is imported from `three`).
 *
 * Game case: **FFX-2 only** [AGENTS.md rule 14]: only the ATB opens a menu while another command charges
 * [research/ffx2-combat-core.md section 1.1]; FFX's CTB resolves a command before the next turn opens.
 *
 * The text is the ability's or item's own name from `src/data/ffx2` (the label the menu printed), so nothing is
 * invented (rule 6). A chip is drawn for an ability, an item and a basic attack; a Spherechange, which costs the
 * whole turn without a charge, gets none.
 */

type Project = (id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => { x: number; y: number } | null;

export interface QueuedChipDeps {
  project: Project;
}

/** The chip's text for a queued command, or `null` when the command is not one that charges under a name. */
export function queuedLabel(command: Command): string | null {
  switch (command.kind) {
    case 'ability':
      return ABILITIES[command.id]?.name ?? null;
    case 'item':
      return ITEMS[command.id]?.name ?? null;
    case 'attack':
      return 'Attack';
    default:
      return null;
  }
}

/** Every living girl whose command is on the charge bar now, with the chip text. Pure. */
export function queuedCommands(state: Readonly<BattleState> | null): Array<{ id: CombatantId; label: string }> {
  if (!state || state.game !== 'ffx2' || state.result) return [];
  const out: Array<{ id: CombatantId; label: string }> = [];
  for (const id of Object.keys(state.combatants)) {
    const c = state.combatants[id] as { side?: string; alive?: boolean; removed?: boolean; atb?: { charging?: { commandRef?: Command } | null } } | undefined;
    if (!c || c.side !== 'party' || c.alive === false || c.removed) continue;
    const command = c.atb?.charging?.commandRef;
    const label = command ? queuedLabel(command) : null;
    if (label) out.push({ id, label });
  }
  return out;
}

/** Real px kept between a chip and the window's edge. */
const EDGE = 8;
/** Real px between the chip's foot and the head point it hangs above. */
const GAP = 10;

export class QueuedChips {
  private overlay: HTMLElement | null = null;
  private deps: QueuedChipDeps | null = null;
  private readonly chips = new Map<CombatantId, { el: HTMLElement; label: string }>();

  mount(overlay: HTMLElement, deps: QueuedChipDeps): void {
    this.overlay = overlay;
    this.deps = deps;
  }

  /** Once per engine sync: which chips exist. */
  sync(state: Readonly<BattleState> | null): void {
    const overlay = this.overlay;
    if (!overlay) return;
    const now = new Map(queuedCommands(state).map((q) => [q.id, q.label]));
    for (const [id, chip] of this.chips) {
      if (now.has(id)) continue;
      chip.el.remove();
      this.chips.delete(id);
    }
    for (const [id, label] of now) {
      const have = this.chips.get(id);
      if (have && have.label === label) continue;
      have?.el.remove();
      const el = document.createElement('div');
      el.className = 'ffx2-qchip';
      el.dataset['role'] = 'queued-chip';
      el.dataset['actor'] = id;
      el.innerHTML = `<span></span>`;
      (el.firstElementChild as HTMLElement).textContent = label;
      overlay.appendChild(el);
      this.chips.set(id, { el, label });
      // Next frame, so the first paint is at the right place and the fade starts from 0.
      requestAnimationFrame(() => el.classList.add('ffx2-qchip--in'));
    }
    this.update();
  }

  /** Per frame: keep each chip over its girl's head (the figure moves with the camera). */
  update(): void {
    const overlay = this.overlay;
    const deps = this.deps;
    if (!overlay || !deps || this.chips.size === 0) return;
    const host = overlay.getBoundingClientRect();
    const vw = host.width || window.innerWidth;
    for (const [id, chip] of this.chips) {
      const head = deps.project(id, 'head');
      if (!head) {
        chip.el.style.visibility = 'hidden';
        continue;
      }
      chip.el.style.visibility = '';
      const w = chip.el.offsetWidth || 0;
      const x = Math.max(EDGE + w / 2, Math.min(vw - EDGE - w / 2, head.x - host.left));
      const y = Math.max(EDGE + (chip.el.offsetHeight || 0), head.y - host.top - GAP);
      const left = `${Math.round(x)}px`;
      const top = `${Math.round(y)}px`;
      if (chip.el.style.left !== left) chip.el.style.left = left;
      if (chip.el.style.top !== top) chip.el.style.top = top;
    }
  }

  unmount(): void {
    for (const chip of this.chips.values()) chip.el.remove();
    this.chips.clear();
    this.overlay = null;
    this.deps = null;
  }
}
