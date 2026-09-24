import type { AnyCombatant, AtbSnapshot, AvailableCommand, Command, CombatantId, TurnPreview } from '../../battle/common/types.ts';
import {
  buildTopRows,
  computeMenuWindow,
  firstEnabledCmdIndex,
  firstEnabledIndex,
  reticleKind,
  resolveTargetMode,
  rowEnabled,
  switchRowIndex,
  wrapCommand,
  wrappedGroup,
  wrappedHelp,
  type TopGroupRow,
  type TopRow,
} from './CommandMenuLogic.ts';
import { commandHelpText } from './commandHelp.ts';
import type { CursorChrome, CursorSelection, RectProjector, TargetRect } from './TargetCursor.ts';
import { portraitChipHtml, tintFor, wirePortraitFallbacks } from './portraits.ts';
import { claimCancel, releaseCancel, releaseCancelAfterPress } from './cancelClaim.ts';
import { RawInputWatcher, wireClicks, type UiButton } from './rawInput.ts';
import { TargetCursor, type TargetEntry } from './TargetCursor.ts';
import { badgeHtml, CURSOR_SVG, escapeHtml, groupHelp, subRowVM, topRowVM, type RowVM } from './commandMenuRows.ts';

export { buildTopRows, computeMenuWindow, resolveTargetMode, switchTargetId } from './CommandMenuLogic.ts';
export type { MenuWindow, TargetResolution, TopDirectRow, TopGroupRow, TopRow } from './CommandMenuLogic.ts';

/** Ink & Gold sets no fixed panel height for `.ig-cmd-stack` (unlike the old
 * boxed FFX command window) -- with real ability lists now landing, a group
 * can run well past what the 640x360 stage can show at once, so only a
 * window of rows renders at a time (`computeMenuWindow`). */
const MAX_VISIBLE_ROWS = 6;
/**
 * Round 09 PR-0002 (carried, repaired round 10): the top-level stack covers
 * ~97-100% of Yuna's painted quad in Chapters 1 and 3 at `MAX_VISIBLE_ROWS`
 * (`tests/unit/ui-ffx-hud-safe-zones.test.ts`, "PR-0002" describe block, has
 * the measured numbers). A round-10 attempt capped the top-level list at 2
 * rows (`MAX_VISIBLE_TOP_ROWS`); the adversarial verifier for that round
 * measured the *same* stack in Chapter 3, live, as the cursor moved through
 * it (not only at rest) and found it still covers 34-44% of Yuna's quad —
 * over CHK-008's one-third bar — because the window's vertical anchor moves
 * with `topIndex`, not just its row count. It also cut the FFX command
 * stack from the approved 5-row Ink & Gold mock
 * (`docs/screenshots/mockups/A-ink-and-gold-battle.jpg`) to 2 rows, and no
 * options round or yes from Bailey was ever sought for that (AGENTS.md rule
 * 9). Both problems need a design pick — how many rows the approved stack is
 * allowed to show, and/or where slot 0 stands (round 09's other suggested
 * fix, "move party slot 0 right", is a hand-tuned 6-rig scene composition
 * change and is itself a rule-9 case) — so round 10 reverts to the
 * approved-mockup row count (`MAX_VISIBLE_ROWS`) rather than ship an
 * unapproved cut that does not even close the gap. Left for Bailey: see
 * `docs/handoff/fix10b-repair-command-menus.md`.
 */

export interface CommandMenuOpenOptions {
  actorId: CombatantId;
  commands: AvailableCommand[];
  previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot;
  combatants: Record<CombatantId, AnyCombatant>;
  setHelp: (text: string) => void;
  /**
   * The aim moved — the picker opened on a candidate, the player arrowed to
   * another, or the picker closed (`null`).
   *
   * The FFX HUD points its enemy plate at whoever this names, which is how
   * targeting gets a surface of its own and the help slab stops being hijacked
   * to print a bare name (round 02 #27, #28). Optional: the mock screens and
   * the unit fixtures pass nothing and nothing changes for them.
   */
  onTargetChange?: (id: CombatantId | null) => void;
  /**
   * The whole selection — every id the command is aimed at, whether the player
   * is cycling one or the cast hits all of them, and which accent it wears.
   *
   * Separate from {@link onTargetChange}, which names the *one* combatant the
   * enemy plate should describe. The field's accent pool and quiet dim, the
   * party rows and the turn-list tiles all need the full set, because a
   * party-wide Hastega lights three rows and rings three figures.
   */
  onSelection?: (sel: CursorSelection | null) => void;
  /**
   * The letter that tells one Yu Pagoda from the other — the `A`/`B`/`C` the
   * CTB tile shows. The HUD answers it from the turn preview it last
   * rendered, so the field plate and the queue tile can never disagree.
   */
  letterTagOf?: (id: CombatantId) => string | undefined;
  /**
   * A one-line preview for a buff or heal, when it is knowable: "already
   * Hasted", "HP full". Optional; nothing is shown when it answers nothing.
   */
  targetNoteOf?: (targetId: CombatantId, cmd: AvailableCommand) => string | undefined;
}

/**
 * Command stack, restyled onto Ink & Gold's `.ig-cmd-stack`/`.ig-cmd`
 * (`src/ui/inkgold/slabs.css`, spec "Components" > "Command stack"): a
 * single cascading ivory stack rather than the old two-panel top+submenu
 * layout -- the mockups (`A-ink-and-gold-battle.jpg`) show one list where
 * choosing a category (Skill, Magic...) replaces the stack's own contents,
 * not a second panel beside it. A group with exactly one enabled entry
 * (most characters' single Overdrive move) resolves straight from the top
 * level instead of opening a one-item stack, matching the mock's flat
 * "OVERDRIVE -- READY" row.
 */
export class CommandMenu {
  readonly stackEl: HTMLElement;
  readonly breadcrumbEl: HTMLElement;
  readonly targetCursor = new TargetCursor();

  private stateValue: 'top' | 'sub' | 'target' = 'top';

  /**
   * Accessor rather than a plain field so that **every** transition publishes
   * whether Esc currently belongs to this menu — `setMenuOwnsCancel`, which
   * `BattleScreen.canPauseOnCancel` reads to decide if Esc may open the pause.
   *
   * A field plus a call at each assignment would have missed one: `openTarget`
   * sets `'target'` and goes straight to the reticle without touching
   * `renderStack()`, so publishing from the renderer would have left Esc
   * looking free while the player was mid-targeting.
   *
   * Which *kind* of release this is matters — see `cancelClaim.ts`. A step back
   * to the top row that the player asked for with Esc has to keep the claim up
   * for the frame that press is still an edge in, or `BattleScreen` polls it a
   * moment later, finds Esc free, and opens the pause on the same tap.
   */
  private get state(): 'top' | 'sub' | 'target' {
    return this.stateValue;
  }

  private set state(value: 'top' | 'sub' | 'target') {
    this.stateValue = value;
    if (value !== 'top') claimCancel();
    else if (this.handlingCancel) releaseCancelAfterPress();
    else releaseCancel();
  }

  /** True only inside the cancel branch of a button handler; see `state`. */
  private handlingCancel = false;

  private suspended = false;
  private rows: TopRow[] = [];
  private topIndex = 0;
  private subIndex = 0;
  private preTargetState: 'top' | 'sub' = 'top';
  /**
   * The open second step of a wrapper row (FFX's Doublecast, PR-0125): the
   * list it opened, the row itself, and where Esc steps back to. `null`
   * everywhere else. It survives a target-step cancel (back to the spell list)
   * and nothing else.
   */
  private wrap: { wrapper: AvailableCommand; group: TopGroupRow; back: 'top' | 'sub'; backIndex: number } | null = null;
  private opts: CommandMenuOpenOptions | null = null;
  private resolve: ((cmd: Command) => void) | null = null;
  private readonly watcher = new RawInputWatcher((b) => this.onButton(b));
  private unwireClicks: (() => void) | null = null;

  constructor() {
    this.stackEl = document.createElement('div');
    this.stackEl.className = 'ig-cmd-stack';
    this.stackEl.hidden = true;
    this.breadcrumbEl = document.createElement('div');
    this.breadcrumbEl.className = 'ffx-cmd-breadcrumb';
    this.breadcrumbEl.hidden = true;
    // Clicking a reticle (any candidate, not only the keyboard-highlighted
    // one) selects it and confirms through the exact same path Enter does —
    // mouse and keyboard can never resolve a different Command this way.
    this.targetCursor.setOnClick((id) => this.tryConfirmTargetById(id));
    // **The one place a selection is published from.**
    //
    // It used to be published by hand at each call site, and `confirmTarget()`
    // — the single most-used interaction in the game — was the site that
    // forgot: Enter hid the cursor and finished the command without ever
    // saying the selection had ended, so the quiet dim stayed on the whole
    // party and on every other fiend for the rest of the fight, and
    // `__pyrefly.targeting().selection` went on naming a stale ally group
    // while the player aimed an enemy Attack. The cursor is the one object
    // that knows whether anything is aimed at; wiring the handler here means
    // every `show*`, every `step` and — crucially — every `hide()`, from
    // wherever it is called, reports the truth.
    //
    // GAME-AWARE (AGENTS.md rule 14): the defect was FFX only, because
    // `ui/ffx2/CommandMenu.ts` already wired this handler and its `cleanup()`
    // already reported the end. This is the FFX side adopting the same rule,
    // not a second implementation.
    this.targetCursor.setOnSelection((sel) => this.opts?.onSelection?.(sel));
    // PR-0019 (FFX only): a whole-party or whole-field row (Al Bhed Potion,
    // Cheer...) keeps its list open while the player confirms, so the "ALL
    // ALLIES" / "ALL ENEMIES" chip hangs off the row that was chosen instead
    // of floating level with whichever row sits at the party's head height.
    this.targetCursor.setGroupAnchorRow(() =>
      this.stackEl.hidden ? null : this.stackEl.querySelector<HTMLElement>('.ig-cmd--selected'),
    );
  }

  setProjector(project: RectProjector): void {
    this.targetCursor.setProjector(project);
  }

  /** FFX's hand, or FFX-2's flower. See {@link CursorChrome}. */
  setChrome(chrome: CursorChrome): void {
    this.targetCursor.setChrome(chrome);
  }

  /** The HUD's painted panels, so the name plate docks clear of the lists. */
  setPanels(panels: readonly TargetRect[]): void {
    this.targetCursor.setPanels(panels);
  }

  open(opts: CommandMenuOpenOptions): Promise<Command> {
    // A menu still pending here lost the `Promise.race` in
    // `BattlePresenter.chooseCommand` (an `autoBattle()` strategy answered for
    // the player) and its promise was abandoned. Drop its input hooks before
    // the new one attaches its own.
    if (this.resolve) {
      this.watcher.detach();
      this.unwireClicks?.();
      this.resolve = null;
    }
    // Whatever the abandoned menu was aiming at is over, and it has to be
    // reported to the HUD that opened *it* — so this runs before `opts` is
    // replaced. Without it a menu that lost the race left its dim on the field
    // and its ring under three allies while the next actor chose.
    this.endSelection();
    this.suspended = false;
    this.wrap = null;
    this.opts = opts;
    this.rows = buildTopRows(opts.commands);
    this.topIndex = firstEnabledIndex(this.rows);
    this.subIndex = 0;
    this.state = 'top';
    this.stackEl.hidden = false;
    this.watcher.attach();
    this.unwireClicks = wireClicks(this.stackEl, (action) => this.onAction(action));
    this.renderStack();
    this.updateHelpAndPreview();
    return new Promise<Command>((resolve) => {
      this.resolve = resolve;
    });
  }

  private finish(command: Command): void {
    this.suspended = false;
    this.wrap = null;
    // No menu is open any more, so Esc is nobody's back button until the next
    // one opens. Without this a decision taken from a submenu would leave the
    // flag true and Esc dead for the rest of the battle.
    releaseCancel();
    this.watcher.detach();
    this.unwireClicks?.();
    // Every surface targeting lit — the field's accent pool and quiet dim, the
    // party rows, the turn-list tiles, the enemy plate — goes out with the
    // decision. This is the line `confirmTarget()` was missing.
    this.endSelection();
    this.stackEl.hidden = true;
    this.breadcrumbEl.hidden = true;
    // The decision is over: the stack, its breadcrumb *and* its help line all
    // go with it. Leaving the help line up was how "Open the White Magic
    // menu." stayed on screen through the boss's answering attack
    // (docs/screenshots/47-boss-attack.png).
    this.opts?.setHelp('');
    this.opts?.previewRank(null);
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.(command);
  }

  /**
   * Close the menu from outside the decision it belongs to: the battle ended,
   * the HUD is being unmounted, a screen is tearing down.
   *
   * Deliberately *not* `suspend()`, which is reversible and leaves targeting
   * alone because the player is still mid-decision. This one ends the
   * selection, so nothing the cursor lit can outlive the fight. Idempotent.
   */
  close(): void {
    this.suspended = false;
    this.wrap = null;
    this.watcher.detach();
    this.unwireClicks?.();
    this.unwireClicks = null;
    this.endSelection();
    this.state = 'top';
    this.stackEl.hidden = true;
    this.breadcrumbEl.hidden = true;
    this.opts?.setHelp('');
    this.resolve = null;
  }

  /**
   * **The one way a selection ends.** Confirm, cancel, the menu finishing, the
   * menu being closed from outside, a menu abandoned because a strategy
   * answered for the player — all five routes come through here, which is what
   * makes "the dim never sticks" a property of the class rather than a rule
   * each call site has to remember.
   *
   * `hide()` publishes the `null` through the handler wired in the
   * constructor; the explicit call after it covers the case where the cursor
   * had nothing to hide and the surfaces are being reset anyway (a command
   * that needed no target at all).
   */
  private endSelection(): void {
    this.groupTargets = null;
    this.pendingCmd = null;
    this.targetCursor.hide();
    this.opts?.onSelection?.(null);
    this.opts?.onTargetChange?.(null);
  }

  // --------------------------------------------------------------- suspend

  /**
   * Take an open menu off screen because the decision it belongs to is no
   * longer the player's — an `action-start` is resolving, so either the
   * command was already submitted or a strategy answered for the player
   * (`BattlePresenter.chooseCommand` races the HUD promise against
   * `setAutoPlay`'s pick and simply abandons the loser). Before this, the
   * stack and its help line sat over the boss's answering attack
   * (docs/screenshots/47-boss-attack.png).
   *
   * Deliberately reversible rather than a teardown: the promise may still be
   * the one thing the presenter is waiting on, so the watcher stays attached
   * and the next button press brings the menu straight back instead of
   * deadlocking the fight. Targeting is left alone — a reticle on screen
   * means the player is mid-decision either way.
   */
  suspend(): void {
    if (!this.resolve || this.suspended || this.state === 'target') return;
    this.suspended = true;
    this.stackEl.hidden = true;
    this.breadcrumbEl.hidden = true;
    this.opts?.setHelp('');
  }

  private resume(): boolean {
    if (!this.suspended) return false;
    this.suspended = false;
    this.stackEl.hidden = false;
    this.breadcrumbEl.hidden = this.state !== 'sub';
    this.renderStack();
    this.updateHelpAndPreview();
    return true;
  }

  // ------------------------------------------------------------------- input

  private onButton(b: UiButton): void {
    if (this.resume()) return;
    // The flag is read by the `state` setter, which any of the three handlers
    // may trip. Set here rather than in each cancel branch so a branch added
    // later cannot forget it.
    this.handlingCancel = b === 'cancel';
    try {
      if (this.state === 'target') return this.onTargetButton(b);
      if (this.state === 'sub') return this.onSubButton(b);
      return this.onTopButton(b);
    } finally {
      this.handlingCancel = false;
    }
  }

  private onTopButton(b: UiButton): void {
    if (b === 'up' || b === 'down') {
      this.moveTop(b === 'up' ? -1 : 1);
    } else if (b === 'confirm') {
      this.chooseTop(this.topIndex);
    } else if (b === 'l1' || b === 'r1' || b === 'triangle') {
      // Party swap is its own affordance, not a verb in the list: L1/LB opens
      // it in FFX [visual-bible §3.3, "The Switch flow", verified], and the
      // roster strip's own marker is the triangle. Both jump straight to the
      // Switch row's reserve list; the row itself stays for mouse players.
      this.openSwitchList();
    }
  }

  private onSubButton(b: UiButton): void {
    const group = this.currentGroup();
    if (group?.kind !== 'group') return;
    if (b === 'up' || b === 'down') {
      this.moveSub(group, b === 'up' ? -1 : 1);
    } else if (b === 'confirm') {
      this.chooseSub(group, this.subIndex);
    } else if (b === 'cancel') {
      if (this.wrap) return this.closeWrap();
      this.state = 'top';
      this.breadcrumbEl.hidden = true;
      this.renderStack();
      this.updateHelpAndPreview();
    }
  }

  private onTargetButton(b: UiButton): void {
    if (b === 'left' || b === 'up') {
      // A step through the *on-screen* order, not through the engine's. Left
      // has to mean left, or cycling reads as the cursor jumping at random,
      // which is half of "not clear which enemy is being selected".
      this.targetCursor.step(-1);
      this.syncTargetSurfaces();
    } else if (b === 'right' || b === 'down') {
      this.targetCursor.step(1);
      this.syncTargetSurfaces();
    } else if (b === 'confirm') {
      this.confirmTarget();
    } else if (b === 'cancel') {
      // The same chokepoint confirm goes through — restoring every dimmed
      // figure on the field is the half of option B a player notices only when
      // it is missing, and it must not depend on which branch you left by.
      this.endSelection();
      this.state = this.preTargetState;
      this.renderStack();
      this.updateHelpAndPreview();
    }
  }

  // ------------------------------------------------------------------ top

  private moveTop(dir: 1 | -1): void {
    if (!this.rows.length) return;
    let i = this.topIndex;
    for (let n = 0; n < this.rows.length; n++) {
      i = (i + dir + this.rows.length) % this.rows.length;
      if (rowEnabled(this.rows[i]!)) break;
    }
    this.topIndex = i;
    this.renderStack();
    this.updateHelpAndPreview();
  }

  private onAction(action: string): void {
    const i = Number(action);
    if (Number.isNaN(i)) return;
    if (this.state === 'sub') {
      const group = this.currentGroup();
      if (group?.kind !== 'group') return;
      this.subIndex = i;
      this.renderStack();
      this.updateHelpAndPreview();
      this.chooseSub(group, i);
      return;
    }
    this.topIndex = i;
    this.renderStack();
    this.updateHelpAndPreview();
    this.chooseTop(i);
  }

  private chooseTop(i: number): void {
    const row = this.rows[i];
    if (!row) return;
    if (!rowEnabled(row)) return this.shake();
    if (row.kind === 'group') {
      // A single enabled choice needs no submenu hop -- matches the mock's
      // flat "OVERDRIVE -- READY" row (most characters have exactly one
      // usable Overdrive move). The reserve list is the exception: a swap
      // always shows who is coming in, even with one member benched.
      if (row.items.length === 1 && row.role !== 'switch') {
        this.resolveCommand(row.items[0]!);
        return;
      }
      this.openGroup(i, row);
      return;
    }
    this.resolveCommand(row.cmd);
  }

  private openGroup(i: number, row: TopGroupRow): void {
    this.topIndex = i;
    this.state = 'sub';
    this.subIndex = firstEnabledCmdIndex(row.items);
    this.breadcrumbEl.hidden = false;
    this.breadcrumbEl.textContent = row.label;
    this.renderStack();
    this.updateHelpAndPreview();
  }

  /** L1 / triangle from the top level: straight into the reserve list. */
  private openSwitchList(): void {
    const i = switchRowIndex(this.rows);
    const row = i >= 0 ? this.rows[i] : undefined;
    if (!row || row.kind !== 'group' || !rowEnabled(row)) return this.shake();
    this.openGroup(i, row);
  }

  // ------------------------------------------------------------------ sub

  private moveSub(group: TopGroupRow, dir: 1 | -1): void {
    let i = this.subIndex;
    for (let n = 0; n < group.items.length; n++) {
      i = (i + dir + group.items.length) % group.items.length;
      if (group.items[i]!.enabled) break;
    }
    this.subIndex = i;
    this.renderStack();
    this.updateHelpAndPreview();
  }

  private chooseSub(group: TopGroupRow, i: number): void {
    const cmd = group.items[i];
    if (!cmd) return;
    if (!cmd.enabled) return this.shake();
    this.resolveCommand(cmd);
  }

  // -------------------------------------------------------------- targeting

  private pendingCmd: AvailableCommand | null = null;
  /** Set while a multi-target command is awaiting confirmation. */
  private groupTargets: CombatantId[] | null = null;

  private resolveCommand(cmd: AvailableCommand): void {
    if (cmd.wrapsCategory && !this.wrap) return this.openWrap(cmd);
    const resolution = resolveTargetMode(cmd);
    if (resolution.mode === 'none' || resolution.mode === 'auto') {
      // Safe by construction: `resolution.targets` is `[]` for every command
      // kind whose own `Command.targets` type is the empty tuple (Defend,
      // Switch, Escape, Dismiss, Summon, Spherechange never offer >0
      // `validTargets`), so the runtime shape always matches `Command` even
      // though the generic spread below cannot express that statically.
      this.finish(this.commandFor(cmd, resolution.targets));
      return;
    }

    const ids = resolution.mode === 'all' ? resolution.targets : resolution.candidates;
    const entries = ids.map((id) => this.entryFor(id, cmd));
    this.pendingCmd = cmd;
    this.preTargetState = this.state === 'sub' ? 'sub' : 'top';
    this.state = 'target';

    if (resolution.mode === 'all') {
      // Hits everything: every target is ringed and flashes together under one
      // "ALL ALLIES" / "ALL ENEMIES" label, and there is nothing to cycle. The
      // player still confirms, so a party-wide cast can be backed out of — and
      // so the frame Bailey photographed now says what it is doing.
      this.groupTargets = ids;
      this.targetCursor.showGroup(entries);
      this.updateGroupHelp(entries);
      return;
    }

    this.groupTargets = null;
    // `showSingle` counts from the LEFT OF THE SCREEN, not into `entries`:
    // the engine's order is slot-then-id, and opening on "the first one it
    // listed" put the cursor on the aeon in the middle of the field while the
    // player's eye was at the left edge. A row that may also point at the
    // party opens on the side the engine prefers (`preferredTargets`).
    this.targetCursor.showSingle(entries, 0, cmd.preferredTargets);
    this.syncTargetSurfaces();
  }

  /**
   * A wrapper row's second step: its list replaces the stack exactly as a
   * submenu does, and the breadcrumb names the wrapper [PR-0125]. A list with
   * nothing castable in it shakes rather than opening.
   */
  private openWrap(wrapper: AvailableCommand): void {
    const group = wrappedGroup(wrapper, this.opts?.commands ?? []);
    if (!group || !group.items.some((c) => c.enabled)) return this.shake();
    this.wrap = { wrapper, group, back: this.state === 'sub' ? 'sub' : 'top', backIndex: this.subIndex };
    this.state = 'sub';
    this.subIndex = firstEnabledCmdIndex(group.items);
    this.breadcrumbEl.hidden = false;
    this.breadcrumbEl.textContent = group.label;
    this.renderStack();
    this.updateHelpAndPreview();
  }

  /** Esc from the wrapper's list: back to the list (or row) the wrapper was chosen from. */
  private closeWrap(): void {
    const wrap = this.wrap;
    if (!wrap) return;
    this.wrap = null;
    this.state = wrap.back;
    this.subIndex = wrap.backIndex;
    const from = this.rows[this.topIndex];
    this.breadcrumbEl.hidden = wrap.back !== 'sub';
    if (wrap.back === 'sub' && from?.kind === 'group') this.breadcrumbEl.textContent = from.label;
    this.renderStack();
    this.updateHelpAndPreview();
  }

  /** The list the `'sub'` state is showing: a wrapper's, or the chosen category's. */
  private currentGroup(): TopRow | undefined {
    return this.wrap?.group ?? this.rows[this.topIndex];
  }

  /** The command a chosen row submits, wrapped when it was picked inside a wrapper's list. */
  private commandFor(cmd: AvailableCommand, targets: CombatantId[]): Command {
    if (this.wrap && this.wrap.group.items.includes(cmd)) return wrapCommand(this.wrap.wrapper, cmd, targets);
    return { ...cmd.command, targets } as Command;
  }

  /** One candidate, with the letter tag and the note the HUD can answer for. */
  private entryFor(id: CombatantId, cmd: AvailableCommand): TargetEntry {
    const combatants = this.opts!.combatants;
    const entry: TargetEntry = {
      id,
      name: combatants[id]?.name ?? id,
      kind: reticleKind(id, this.opts!.actorId, combatants),
    };
    const tag = this.opts?.letterTagOf?.(id);
    if (tag) entry.tag = tag;
    const note = this.opts?.targetNoteOf?.(id, cmd);
    if (note) entry.note = note;
    return entry;
  }

  private confirmTarget(): void {
    const cmd = this.pendingCmd;
    if (!cmd) return;
    // A multi-target cast confirms the whole set; a single one confirms the id
    // under the cursor. Both go through this one path, so Enter, a click and a
    // CTB-tile click can never resolve a different Command.
    const targets = this.groupTargets ?? (this.targetCursor.activeTargetId ? [this.targetCursor.activeTargetId] : []);
    if (!targets.length) return;
    // `finish` ends the selection (`endSelection`). It used to be ended here,
    // by hand, with a bare `targetCursor.hide()` that nothing was listening
    // to — which is exactly how the dim came to outlive every confirmed
    // command in all three FFX chapters.
    this.finish(this.commandFor(cmd, targets));
  }

  /**
   * Keep the enemy plate, the party rows, the turn list and the field's accent
   * pool pointing at the same combatant — the four surfaces Bailey could not
   * read an answer off in the Chapter 3 frame.
   */
  private syncTargetSurfaces(): void {
    const sel = this.targetCursor.selection;
    // `onSelection` is published by the cursor itself (see the constructor),
    // so it is deliberately not called again here: each arrow key would
    // otherwise re-run the field's panel measurement twice.
    this.opts?.onTargetChange?.(sel?.activeId ?? null);
    this.updateTargetHelp();
  }

  /**
   * Lets another click surface (the CTB tile of the combatant being aimed
   * at) confirm a target through this same path, without exposing `state`/
   * `pendingCmd` to callers. A no-op — returns `false` — outside targeting or
   * for an id that isn't a current candidate.
   */
  tryConfirmTargetById(id: CombatantId): boolean {
    if (this.state !== 'target') return false;
    if (!this.targetCursor.setActiveById(id)) return false;
    this.confirmTarget();
    return true;
  }

  // ------------------------------------------------------------------ render

  private renderStack(): void {
    if (this.state === 'sub') {
      const group = this.currentGroup();
      if (group?.kind === 'group') {
        const combatants = this.opts?.combatants ?? {};
        this.renderRows(
          group.items.map((cmd) => subRowVM(cmd, group, combatants)),
          this.subIndex,
          MAX_VISIBLE_ROWS,
        );
        return;
      }
    }
    this.renderRows(this.rows.map(topRowVM), this.topIndex, MAX_VISIBLE_ROWS);
  }

  private renderRows(vms: RowVM[], selectedIndex: number, maxVisible: number): void {
    const { start, end } = computeMenuWindow(vms.length, selectedIndex, maxVisible);
    const rows = vms
      .slice(start, end)
      .map((vm, localI) => {
        const i = start + localI;
        const selected = i === selectedIndex;
        const cls = [
          'ig-cmd',
          selected ? 'ig-cmd--selected' : '',
          !vm.enabled ? 'ig-cmd--disabled' : '',
          vm.overdrive ? 'ig-cmd--overdrive' : '',
          vm.trigger ? 'ffx-cmd--trigger' : '',
          vm.portrait ? 'ffx-cmd--member' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const cursor = selected ? CURSOR_SVG : '';
        const face = vm.portrait
          ? `<span class="ffx-cmd__face">${portraitChipHtml(vm.portrait.key, vm.portrait.name, tintFor('party'))}</span>`
          : '';
        const chevron = vm.group ? '<span class="ffx-cmd__chev" aria-hidden="true">▸</span>' : '';
        return `<div class="${cls}" style="margin-left:calc(var(--ig-cascade-step) * ${localI})" data-ui-action="${i}">${cursor}${face}<span class="ffx-cmd__label">${escapeHtml(vm.label)}</span>${chevron}${badgeHtml(vm.badge)}</div>`;
      })
      .join('');
    // Out of flow (`ffx-hud.css`): the arrows never grow the stack, so the
    // breadcrumb above it stays clear of the help slab in every scroll state.
    const moreAbove = start > 0 ? '<div class="ffx-cmd-more ffx-cmd-more--up">▲</div>' : '';
    const moreBelow = end < vms.length ? '<div class="ffx-cmd-more ffx-cmd-more--down">▼</div>' : '';
    this.stackEl.innerHTML = moreAbove + rows + moreBelow;
    wirePortraitFallbacks(this.stackEl);
  }

  /**
   * The slab under the stack: **what the highlighted row does, before the
   * player commits to it.**
   *
   * Round 02 #27 found it empty on the row the menu opens on and on every leaf
   * ability, because `AvailableCommand.help` is written for items and nothing
   * else — see `commandHelp.ts` for why the sentence is derived from the move's
   * own record rather than authored.
   */
  private updateHelpAndPreview(): void {
    if (!this.opts) return;
    if (this.state === 'top') {
      const row = this.rows[this.topIndex];
      const cmd = row?.kind === 'direct' ? row.cmd : null;
      this.opts.setHelp(cmd ? commandHelpText(cmd) : row?.kind === 'group' ? groupHelp(row) : '');
      this.opts.previewRank(cmd);
      return;
    }
    if (this.state === 'sub') {
      const group = this.currentGroup();
      const cmd = group?.kind === 'group' ? group.items[this.subIndex] : null;
      const swap =
        group?.kind === 'group' && group.role === 'switch' && cmd
          ? `${cmd.label} takes this turn on entering the fight.`
          : null;
      const help = cmd ? (swap ?? commandHelpText(cmd)) : '';
      this.opts.setHelp(this.wrap && cmd ? wrappedHelp(this.wrap.wrapper, help) : help);
      // Inside a wrapper the turn is charged at the wrapper's rank, not the spell's.
      this.opts.previewRank(this.wrap ? this.wrap.wrapper : (cmd ?? null));
    }
  }

  /**
   * Aiming does **not** take the help slab over any more.
   *
   * It used to print the target's `sensorText`, or its bare name — so the one
   * surface that could have said what the command does spent the whole of
   * targeting saying "Mortiorchis" instead, and the player committed without
   * ever having read the move (#27). The target now has a surface of its own:
   * the HUD's enemy plate, pointed here through {@link
   * CommandMenuOpenOptions.onTargetChange}, which is also the panel that prints
   * whatever Sensor knows about it (#28). The slab holds the pending command's
   * own line for the whole of the aim.
   */
  /**
   * The help slab keeps describing the *command* while the player aims. The
   * target's own name is on the field plate and in the enemy plate now, so the
   * slab is no longer hijacked to print a bare name [round-02 #27, #28].
   */
  private updateTargetHelp(): void {
    if (!this.opts) return;
    const cmd = this.pendingCmd;
    if (!cmd) return;
    const help = commandHelpText(cmd);
    this.opts.setHelp(this.wrap ? wrappedHelp(this.wrap.wrapper, help) : help);
  }

  /**
   * The help line for a multi-target cast.
   *
   * It names the group rather than a combatant, because there is no one target
   * to name — the whole complaint about the Hastega frame was that nothing on
   * screen said the cast was party-wide.
   */
  private updateGroupHelp(entries: TargetEntry[]): void {
    if (!this.opts) return;
    const cmd = this.pendingCmd;
    const who = entries[0]?.kind === 'enemy' ? 'every enemy' : 'the whole party';
    const help = cmd ? commandHelpText(cmd) : '';
    // PR-0019 (round 09, both games — the composition is shared, this call
    // site is FFX's): the two clauses used to be joined with a bare space —
    // "Inflicts Cheer Hits the whole party" — which reads as one run-on
    // sentence with a word missing between "Cheer" and "Hits". `help` is
    // `describeAbility`'s output and never carries its own terminator (its
    // pieces are joined with " · ", never "."), so one goes on here rather
    // than upstream, where every other caller of `commandHelpText` still
    // wants the bare sentence.
    const terminatedHelp = help && !/[.!?]$/.test(help) ? `${help}.` : help;
    this.opts.setHelp(terminatedHelp ? `${terminatedHelp} Hits ${who}.` : `Hits ${who}.`);
    // `showGroup` already published the selection through the cursor's handler.
    // No single combatant is being aimed at, so the enemy plate has nothing to
    // describe; leaving the last one up would be a lie.
    this.opts.onTargetChange?.(null);
  }

  private shake(): void {
    this.stackEl.classList.remove('ffx-cmd-stack--shake');
    void this.stackEl.offsetWidth;
    this.stackEl.classList.add('ffx-cmd-stack--shake');
  }
}
