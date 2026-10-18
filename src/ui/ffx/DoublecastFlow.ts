/**
 * **Doublecast as two picks: the menu's flow** (FFX only; Option A "Second round", decision queue item 103, delegated).
 *
 * `CommandMenu` keeps the stack, the cursor and the target step; this class keeps the one thing that used to be a loose `wrap` field inside it: an open
 * Doublecast, which round it is on, what was picked first, and what to draw around it. The rules are in `doublecastModel.ts` (pure) and the words in
 * `doublecastText.ts`; this file only connects them to the menu and to the HUD's {@link CommandMenuPort}.
 *
 * The flow, from the approved frames (`D:/Tools/pyrefly-scratch/2026-10-18/doublecast/A-*.png`):
 *
 * 1. Special > Doublecast opens the Black Magic list, headed "Doublecast · 1 of 2"; a spell opens its own target step.
 * 2. Confirming that target does **not** submit: the same list comes back, headed "Doublecast · 2 of 2", cast 1 chipped onto its target, the MP it holds shown on
 *    the caster's card, and every row the engine says the MP left cannot pay greyed (`doublecastPicks().second.enabled`; this file decides nothing).
 * 3. A second spell opens its target step; confirming that one submits `{ id: 'doublecast', casts: [first, second] }` (`AbilityCommand.casts`).
 * 4. Esc steps back one stage at a time: target 2 to list 2, list 2 to target 1 (cast 1 kept, the cursor on its old target), target 1 to list 1, list 1 to the Special list.
 *
 * Dead end: when no row is offered in round 2 the list stays on screen greyed, the slab says so and names Esc (a tap on the title on a phone), and the menu never commits
 * a single cast by itself. What the *game* does there is not in the sources (`docs/handoff/doublecast-hud.md`, open item 1).
 */

import type { AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import type { TopGroupRow } from './CommandMenuLogic.ts';
import { escapeHtml } from './commandMenuRows.ts';
import { startPreference } from './targetStepUi.ts';
import { aimLabel, doublecastCommand, lockFirst, openWrap, pendingMp, unlockFirst, type DoublecastPicksSource, type DoublecastView, type DoublecastWrap } from './doublecastModel.ts';
import { doublecastCrumb, doublecastHelp, doublecastLeadHelp, type DoublecastHelp } from './doublecastText.ts';

/**
 * What the HUD hands the command menu beyond the decision itself (`withDoublecastHud`, `DoublecastHud.ts`). Every member is optional: a menu with none, as
 * in the mock screens and the unit fixtures, plays the two rounds with the rows exactly as the engine offered them and draws nothing around them.
 */
export interface CommandMenuPort {
  /** The engine's picker (`FFXEngine.doublecastPicks`): round 2's verdicts. */
  picks?: DoublecastPicksSource;
  /** The slab's two lines for a step of a Doublecast (the plain sentence has already gone through `setHelp`). */
  help?: (help: DoublecastHelp) => void;
  /** What to draw around a Doublecast in its second round (the lock chip on cast 1's target, the MP preview on the card); `null` clears it. */
  view?: (view: DoublecastView | null) => void;
  /** The aim ended without a command (Esc out of a target step, or cast 1's target confirmed): the enemy plate the aim opened goes, chip and all. */
  aimCancelled?: () => void;
}

/** The decision a flow step is made from (a slice of `CommandMenuOpenOptions`). */
export interface FlowEnv {
  actorId: CombatantId;
  commands: readonly AvailableCommand[];
  combatants: Record<CombatantId, AnyCombatant>;
  letterTagOf?: (id: CombatantId) => string | undefined;
}

export class DoublecastFlow {
  private wrap: DoublecastWrap | null = null;
  private env: FlowEnv | null = null;
  port: CommandMenuPort | null = null;

  /** The decision the next steps are made from (the menu binds each one as it opens). */
  bind(env: FlowEnv): void {
    this.env = env;
  }

  get active(): boolean {
    return this.wrap !== null;
  }

  /** 0 when none is open. */
  get round(): 0 | 1 | 2 {
    return this.wrap?.round ?? 0;
  }

  /** The list on screen (round 1 as offered, round 2 with the engine's verdicts), or `null`. */
  get group(): TopGroupRow | null {
    return this.wrap?.group ?? null;
  }

  /** The Doublecast row itself: the command the turn is charged at (rank 3). */
  get wrapper(): AvailableCommand | null {
    return this.wrap?.wrapper ?? null;
  }

  /** Forget everything and clear what was drawn. Idempotent. */
  reset(): void {
    if (this.wrap) this.port?.view?.(null);
    this.wrap = null;
  }

  /** Open round 1 from the Doublecast row, or say there is nothing to cast (`null`). */
  open(wrapper: AvailableCommand, back: 'top' | 'sub', backIndex: number, opensOnGrey = false): TopGroupRow | null {
    this.wrap = this.env ? openWrap(wrapper, this.env.commands, back, backIndex, opensOnGrey) : null;
    return this.wrap?.group ?? null;
  }

  /** The list's header. */
  crumb(): string {
    return this.wrap ? doublecastCrumb(this.wrap) : '';
  }

  /**
   * The phone's second line in the list header, replacing the page count (round 2 only): cast 1 and where it goes, `<chip> Fira › Yu Pagoda A`.
   * Empty in round 1 (the page count stays).
   */
  summaryHtml(): string {
    const first = this.wrap?.round === 2 ? this.wrap.first : null;
    const env = this.env;
    if (!first || !env) return '';
    const where = aimLabel(first.targets, env.combatants, env.letterTagOf);
    return `<span class="ffx-dc-n"><b>1</b></span><span class="ffx-dc-sum">${escapeHtml(where ? `${first.cmd.label} \u203a ${where}` : first.cmd.label)}</span>`;
  }

  /** Whether `cmd` is a row of the list on screen (so its targets belong to this Doublecast). */
  owns(cmd: AvailableCommand): boolean {
    return !!this.wrap && this.wrap.group.items.includes(cmd);
  }

  /** Where the target step's cursor opens: cast 1's target for cast 2 ("the same again" is one press), cast 1's old target when it is re-aimed; the row's own preference otherwise. */
  prefer(cmd: AvailableCommand): readonly CombatantId[] | undefined {
    const wrap = this.wrap;
    if (!wrap || !this.owns(cmd)) return startPreference(cmd);
    const first = wrap.first?.targets.filter((t) => cmd.validTargets.includes(t));
    return first?.length ? first : startPreference(cmd);
  }

  /**
   * A spell and its target are chosen. Round 1: lock it and bring round 2's list back (the list index to land on is returned, `-1` when the pick is not
   * this Doublecast's). Round 2: nothing to lock, the command is returned by {@link finish}.
   */
  lock(cmd: AvailableCommand, targets: CombatantId[]): number {
    const wrap = this.wrap;
    if (!wrap || !this.env || wrap.round !== 1 || !this.owns(cmd)) return -1;
    const picks = this.port?.picks?.(this.env.actorId, cmd.command.kind === 'ability' ? cmd.command.id : '') ?? null;
    const next = lockFirst(wrap, { cmd, targets }, picks);
    this.wrap = next.wrap;
    this.port?.aimCancelled?.(); // the plate cast 1's aim opened must not stand over round 2's list
    this.publish();
    return next.index;
  }

  /** Esc from round 2's list: cast 1's target step again (spell kept, cursor on its old target), or `null` outside round 2. */
  unlock(): { cmd: AvailableCommand; prefer: CombatantId[] } | null {
    const wrap = this.wrap;
    const back = wrap ? unlockFirst(wrap) : null;
    if (!back) return null;
    this.wrap = back.wrap;
    this.publish();
    return { cmd: back.cmd, prefer: back.prefer };
  }

  /** Esc from round 1's list: close the Doublecast and say where the menu goes back to. */
  close(): { back: 'top' | 'sub'; backIndex: number } | null {
    const wrap = this.wrap;
    if (!wrap) return null;
    this.reset();
    return { back: wrap.back, backIndex: wrap.backIndex };
  }

  /** The target of round 2 is chosen: the one command both casts make, or `null` when this is not the end of the flow. */
  finish(cmd: AvailableCommand, targets: CombatantId[]): Command | null {
    const wrap = this.wrap;
    return wrap && wrap.round === 2 && this.owns(cmd) ? doublecastCommand(wrap, cmd, targets) : null;
  }

  /**
   * The help for a step: sets the plain sentence through `setHelp`, then offers the two-line form to the HUD. Round 1's list is the one plain line
   * (what Doublecast is, then the highlighted spell's own effect, `rowHelp`).
   */
  help(at: 'list' | 'target', cmd: AvailableCommand | null, rowHelp: string, setHelp: (text: string) => void): void {
    const wrap = this.wrap;
    const env = this.env;
    if (!wrap || !env) return;
    const rich = doublecastHelp(wrap, at, cmd, env.combatants[env.actorId], { combatants: env.combatants, ...(env.letterTagOf ? { tagOf: env.letterTagOf } : {}) });
    if (!rich) return setHelp(doublecastLeadHelp(wrap.wrapper, rowHelp));
    setHelp(rich.plain);
    this.port?.help?.(rich);
  }

  /** Tell the HUD what to draw around round 2 (or that there is nothing to draw). */
  private publish(): void {
    const wrap = this.wrap;
    const env = this.env;
    const first = wrap?.round === 2 ? wrap.first : null;
    if (!wrap || !env || !first) return this.port?.view?.(null);
    this.port?.view?.({
      round: 2,
      actorId: env.actorId,
      firstTargetId: first.targets[0] ?? null,
      firstLabel: first.cmd.label,
      pending: pendingMp(wrap, env.combatants[env.actorId]),
    });
  }
}
