/**
 * The FFX-2 command window: top-level rows, ability/item submenus, and target
 * selection, resolving to a filled-in {@link Command}.
 *
 * Composes the shared Ink & Gold layer (`src/ui/inkgold/`, pink `.ig--ffx2`
 * variant): rows are `.ig-cmd` inside an `.ig-cmd-stack`, cascading via
 * `margin-right` (FFX-2 anchors its stack bottom-right and cascades further
 * right per row, mirroring FFX-1's bottom-left/cascade-left — see
 * `BattleFfx2.dc.html`), with the ink cursor triangle pointing left and
 * trailing the label (the FFX-2 mirror of `.ig-cmd__cursor`, per
 * `src/ui/inkgold/README.md`'s note on the two triangle paths). The
 * "Spherechange"-style always-costs-a-turn row borrows `.ig-cmd--overdrive`'s
 * ink/accent-border treatment, exactly as the approved mock does.
 *
 * Split out of `FFX2BattleHud` so each file stays under the project's 400-line
 * cap. Owns its own keyboard/click handling for the duration of one
 * `chooseCommand` call — the presenter loop is suspended on our promise, so
 * there is nothing else that should be reading input meanwhile.
 *
 * Grouping rule (there is no explicit "open a submenu" flag on
 * `AvailableCommand`, only `category`): a category with exactly one command in
 * it renders as a single top-level row (this is how Trigger Happy and Gunplay
 * show up directly, per `visual-bible.md` §4.7's
 * "Attack · Trigger Happy · Gunplay · Item" example); a category with more
 * than one command renders as one row that opens a submenu listing them. A
 * submenu can now be long (once the dressphere ability tables are wired up),
 * so the stack itself scrolls — see `.ffx2hud__command`'s `max-height` in
 * `ffx2-hud.css` — rather than clipping silently.
 *
 * The one exception is **Change**, which is always a submenu even at one
 * destination, because the game's command is "Change" and the outfit is
 * chosen inside it — see {@link CHANGE_LABEL}.
 */
import type { AtbSnapshot, AvailableCommand, Command, CombatantId, TurnPreview } from '../../battle/common/types.ts';
import { claimCancel, releaseCancel, releaseCancelAfterPress } from '../ffx/cancelClaim.ts';
// The target cursor is shared with FFX and wears its chrome: bracket, plate and ALL label are both games,
// only the mark differs; `setChrome('ffx2')` keeps FFX's hand out of an X-2 fight (AGENTS.md rule 14).
import { TargetCursor, type CursorSelection, type TargetEntry, type TargetRect } from '../ffx/TargetCursor.ts';
import { resolveTargetMode } from '../ffx/CommandMenuLogic.ts';
import { dressphereLabel } from './dressphereIcons.ts';
import { commandHelpText, groupHelpText } from './commandHelp.ts';
import { withTargets } from './withTargets.ts';
import { keepPlateDocked } from './plateRedock.ts';

const CATEGORY_LABELS: Record<string, string> = {
  attack: 'Attack',
  skill: 'Skill',
  special: 'Special',
  blackmagic: 'Black Magic',
  whitemagic: 'White Magic',
  summon: 'Summon',
  overdrive: 'Overdrive',
  aeon: 'Aeon',
  item: 'Item',
  dressphere: 'Dressphere',
  enemy: 'Enemy',
};

type Row = { leaf: AvailableCommand } | { group: string; items: AvailableCommand[] };

/**
 * Whether there is a row above or below the fold of a scrolled command window.
 *
 * `.ffx2hud__command` is `max-height: 220px; overflow-y: auto`, so a long
 * submenu scrolls — but nothing on screen said so. Measured by the pass-2
 * critic at both 1280x720 and 2560x1440, in both chapters: `Item` is 227 px
 * against a 220 px box, so "Light Curtain" sits below the fold; chapter 5's
 * `Skill` is 360 px and its `White Magic` 440 px, sixteen rows with more than
 * half of them off-screen including Full-Cure and the Lv. 2 / Lv. 3 rows. A
 * player has no way to know they exist.
 *
 * Pure so the thresholds can be asserted without a layout engine: jsdom reports
 * every scroll metric as 0, and `0 > 0 + 1` would be a test of nothing. The
 * 1 px slack absorbs sub-pixel rounding on fractional device pixel ratios,
 * where `scrollHeight` and `clientHeight` differ by a fraction on a box that
 * does not actually scroll.
 */
export function scrollAffordance(m: { scrollTop: number; scrollHeight: number; clientHeight: number }): {
  above: boolean;
  below: boolean;
} {
  const overflowing = m.scrollHeight > m.clientHeight + 1;
  if (!overflowing) return { above: false, below: false };
  return { above: m.scrollTop > 1, below: m.scrollTop + m.clientHeight < m.scrollHeight - 1 };
}

/**
 * Spherechange always costs the whole turn (§4.5), so — per the approved
 * mock — it gets its own top-level row with the special ink/accent-border
 * treatment (`.ig-cmd--overdrive`) no matter what `category` the engine
 * tags it with. `AbilityCategory` has no dedicated "spherechange" value, so
 * a data agent may reasonably file it under `'dressphere'` alongside real
 * dressphere skillset abilities (`ffx2-combat-core.md`'s job commands) —
 * keying this off `command.kind` instead of `category` keeps it correct
 * either way, including once the dressphere ability tables are wired up and
 * that category stops being a lone entry.
 */
function isSpherechange(c: AvailableCommand): boolean {
  return c.command.kind === 'spherechange';
}

/**
 * The synthetic category every spherechange row is filed under. `AbilityCategory`
 * is a closed union of bare words (`'attack'`, `'blackmagic'`, `'dressphere'`…),
 * so a double-underscore key cannot collide with a category coming off a real
 * ability.
 */
const CHANGE_GROUP = '__change';

/**
 * **FFX-2's command is "Change", and it is one row, not one row per outfit.**
 *
 * `battle/ffx2/targeting.ts` emits one `AvailableCommand` per *reachable* node
 * and labels each with the raw dressphere id it leads to, so before this the
 * FFX-2 command window read `Attack / Skill / gunner / black-mage / Item` —
 * two internal ids on a player-facing surface (critic round 02, ranked issue
 * 26; the live rows are in `docs/screenshots/fix3/critic-ffx2-hud-prep/
 * report-f.json`). It was also wrong about the game: in X-2 you press L1,
 * the Garment Grid opens, and you pick a destination *inside it*
 * (`research/visual-bible.md` §4.5.2) — the outfits are never top-level rows.
 *
 * So every spherechange collapses into one **Change** row that opens a
 * submenu of the reachable dresspheres by name, each carrying the
 * `GRANTS:` gate line §4.5.4 calls "the single most valuable line on the
 * screen". The full node graph in `SpherechangeWheel.ts` is what this row
 * *should* open; it cannot yet, because the grid's node contents live in
 * `Ffx2Engine.gridNodes` (private, and another track's file) and nothing
 * hands them to a HUD. See `docs/handoff/fix3-ffx2-hud-prep.md`.
 *
 * **FFX has no equivalent and gets none of this** — `ui/ffx/CommandMenu.ts`
 * is a separate component and is untouched.
 */
const CHANGE_LABEL = 'Change';

/** The destination outfit's real name: the command's own `extra`, never the engine's raw-id `label`. */
function spherechangeLabel(c: AvailableCommand): string {
  const cmd = c.command;
  if (cmd.kind !== 'spherechange') return c.label;
  return cmd.extra.specialDressUp ? `${dressphereLabel(cmd.extra.toDressphere)} (Special)` : dressphereLabel(cmd.extra.toDressphere);
}

/**
 * The name the help band prints for a leaf: the same name the row itself
 * shows. A Change row's engine `label` is the raw dressphere id
 * (`black-mage`), so it goes through {@link spherechangeLabel} exactly as
 * `leafRowHtml` does (PR-0012 repair, FFX-2 only).
 */
export function helpLabel(c: AvailableCommand): string {
  return isSpherechange(c) ? spherechangeLabel(c) : c.label;
}

/** `GRANTS: …` for a link that crosses a gate — §4.5.4's gate-preview line, carried by `targeting.ts` as `help`. */
function spherechangeHelp(c: AvailableCommand): string {
  const cmd = c.command;
  if (cmd.kind !== 'spherechange' || cmd.extra.gatesCrossed.length === 0) return '';
  return `GRANTS: ${cmd.extra.gatesCrossed.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(' + ')}`;
}

export interface CommandMenuDeps {
  /** The command window's content element (already positioned/styled). */
  container: HTMLElement;
  /** Full-viewport overlay for target reticles, in the same space `project` returns. */
  targetLayer: HTMLElement;
  commands: AvailableCommand[];
  previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot;
  project: (id: CombatantId) => { x: number; y: number } | null;
  /**
   * The target's painted silhouette, in CSS pixels — what the bracket is
   * scaled to. Optional: without it the cursor falls back to a box around
   * {@link CommandMenuDeps.project}'s point, which is what the HUD mock does.
   */
  projectRect?: (id: CombatantId) => { x: number; y: number; w: number; h: number } | null;
  /** HUD panels the field plate docks clear of, as FFX's cursor is given them (D-044: Left Bulwark's plate sat on the CHANGE row). */
  panels?: () => readonly TargetRect[];
  /** Display names, so a plate never prints a raw combatant id. */
  nameOf?: (id: CombatantId) => string;
  /** The letter that tells one identical fiend from another. */
  letterTagOf?: (id: CombatantId) => string | undefined;
  /** Which side a target is on, for the accent: pink/gold enemy, green ally. */
  kindOf?: (id: CombatantId) => 'enemy' | 'ally' | 'self';
  /**
   * Every change of selection, for the field's accent pool and quiet dim.
   * `candidates` is how many targets the pending command offers, so the
   * PR-0150 controls hint can drop "change target" when there is nothing to
   * step to (`TargetPlates.ts`).
   */
  onSelection?: (sel: CursorSelection | null, candidates: number) => void;
  /**
   * PR-0012: fed the highlighted row's label and help sentence every time the
   * selection changes; the FFX-2 HUD prints them in the top-of-screen slab
   * (D-040), gated on the Battle Help setting.
   */
  onHelp?: (label: string, text: string) => void;
  /** Fed the live preview every time the highlighted row changes. */
  onPreview: (preview: TurnPreview[] | AtbSnapshot) => void;
  actorName: string;
  /**
   * Handed a function that tears this menu down from outside, once it is open.
   *
   * **FFX-2 only, and new with Active ATB.** Under Wait nothing could happen to
   * the girl whose menu was open; now she can be KO'd, Stopped, Slept,
   * Petrified, chain-locked or Berserked mid-input, and the presenter closes
   * the menu rather than leaving one on screen that nobody can answer
   * (`HudPort.closeCommandMenu`). The returned promise is then simply
   * abandoned — what matters is that the cancel claim is released and the DOM
   * is cleared, or Esc belongs to a menu that is gone and the pause key stops
   * working. Calling it twice, or after the menu resolved, is a no-op.
   */
  onOpen?: (close: () => void) => void;
  /** The cursor's level at each view change: `'top'` list, `'deep'` submenu or target (Wait's split, ffx2-combat-core §1.5). */
  onLevel?: (level: 'top' | 'deep') => void;
}

/**
 * Groups by category (in first-seen order). A category that only ever gets one
 * item collapses to a plain leaf row — **except** the synthetic Change group,
 * which stays a submenu even with a single destination, because "Change" and
 * "Change into Thief" are different promises and only the first one is the
 * game's (see {@link CHANGE_LABEL}).
 */
function groupRows(commands: AvailableCommand[]): Row[] {
  const rows: Row[] = [];
  const groupIndex = new Map<string, number>();
  for (const c of commands) {
    const key = isSpherechange(c) ? CHANGE_GROUP : c.category;
    const idx = groupIndex.get(key);
    if (idx === undefined) {
      groupIndex.set(key, rows.length);
      rows.push({ group: key, items: [c] });
    } else {
      const row = rows[idx];
      if (row && 'group' in row) row.items.push(c);
    }
  }
  return rows.map((row) =>
    'group' in row && row.items.length === 1 && row.group !== CHANGE_GROUP ? { leaf: row.items[0]! } : row,
  );
}

/** A group row's player-facing title. */
function groupLabel(group: string): string {
  return group === CHANGE_GROUP ? CHANGE_LABEL : (CATEGORY_LABELS[group] ?? group);
}

const KEY_CONFIRM = new Set(['Enter', 'Space', 'NumpadEnter', 'KeyZ']);
const KEY_CANCEL = new Set(['Escape', 'KeyX', 'Backspace']);

/** The ink cursor triangle, FFX-2's mirror (points left, trails the label — see the module comment). */
const CURSOR_SVG =
  '<svg class="ig-cmd__cursor" viewBox="0 0 12 16" aria-hidden="true"><path d="M11 1 L1 8 L11 15 Z" fill="#0B0A12"/></svg>';

/** Opens the menu and resolves once the player has picked a command and (if needed) a target. */
export function openCommandMenu(deps: CommandMenuDeps): Promise<Command> {
  return new Promise<Command>((resolve) => {
    const topRows = groupRows(deps.commands);
    let view: 'top' | 'sub' | 'target' = 'top';
    let topIdx = 0;
    let subItems: AvailableCommand[] = [];
    let subCategory = '';
    let subIdx = 0;
    let pending: AvailableCommand | null = null;
    /**
     * Which view the pending command was picked in, and therefore where Esc
     * goes back to. Without it, every cancel out of target selection went to
     * `renderSub(subCategory)` — whether or not this command came through a
     * submenu.
     *
     * From a top-level leaf, `subItems`/`subCategory` still hold whatever
     * submenu was opened last, so Attack -> target -> Esc redrew the **Change**
     * submenu with the reticle still on the boss, and the next Enter spent the
     * whole turn on a spherechange the player never asked for (verified live:
     * `{"type":"spherechange","who":"paine","from":"warrior","to":"gunner"}`
     * after pressing Attack). With no submenu ever opened it was worse in a
     * quieter way: `subItems` was empty, so the cancel drew an empty command
     * window that swallowed every key (`if (!list) return`) until a second Esc.
     */
    let pendingFrom: 'top' | 'sub' = 'top';
    let targetIds: CombatantId[] = [];
    /**
     * FFX-2 wears its OWN chrome (AGENTS.md rule 14): a rotating six-petal
     * flower as the field reticle, never FFX's pointing hand. The bracket, the
     * name plate with its letter tag, the ALL-target label, the accent pool
     * and the quiet dim are shared with FFX, which is why this is the same
     * component with setChrome('ffx2') rather than a second implementation.
     * [research/visual-bible.md 4.2 / 4.7; ffx-vs-ffx2-presentation.md 9 row 2:
     * the two chromes must never be mixed.] It also replaces a plate that printed the raw id.
     */
    const cursor = new TargetCursor();
    cursor.setChrome('ffx2');
    cursor.setProjector((id) => {
      const r = deps.projectRect?.(id);
      if (r) return r;
      const pt = deps.project(id);
      return pt ? { x: pt.x, y: pt.y, w: 0, h: 0 } : null;
    });
    cursor.setOnSelection((sel) => deps.onSelection?.(sel, sel ? targetIds.length : 0));
    cursor.setOnClick((id) => {
      if (view === 'target' && pending) finish(pending, groupMode ? targetIds : [id]);
    });
    deps.targetLayer.append(cursor.el);
    keepPlateDocked(cursor, deps.panels, () => view === 'target');
    /** True while the chosen command hits every listed target. */
    let groupMode = false;
    /** One-shot, so an external close after the menu resolved does nothing. */
    let live = true;
    const cleanup = (): void => {
      if (!live) return;
      live = false;
      // The menu is gone; Esc belongs to nobody until the next one opens.
      releaseCancel();
      window.removeEventListener('keydown', onKey);
      deps.container.removeEventListener('click', onClick);
      deps.container.classList.remove('ffx2cmd--more-above', 'ffx2cmd--more-below');
      deps.container.innerHTML = '';
      deps.onHelp?.('', '');
      cursor.hide();
      cursor.dispose();
      cursor.el.remove();
    };

    const finish = (command: AvailableCommand, targets: CombatantId[]): void => {
      cleanup();
      resolve(withTargets(command.command, targets));
    };

    function currentLeaf(): AvailableCommand | null {
      if (view === 'top') {
        const row = topRows[topIdx];
        return row && 'leaf' in row ? row.leaf : null;
      }
      if (view === 'sub') return subItems[subIdx] ?? null;
      return null;
    }

    function emitPreview(): void {
      deps.onPreview(deps.previewRank(currentLeaf()));
    }

    /** PR-0012: the highlighted row's own label and sentence, or a group's opener — `commandHelp.ts` has the derivation. */
    function emitHelp(): void {
      if (!deps.onHelp) return;
      if (view === 'top') {
        const row = topRows[topIdx];
        if (!row) {
          deps.onHelp('', '');
          return;
        }
        if ('leaf' in row) {
          deps.onHelp(helpLabel(row.leaf), commandHelpText(row.leaf));
        } else {
          const label = groupLabel(row.group);
          deps.onHelp(label, groupHelpText(label, row.items));
        }
        return;
      }
      const leaf = subItems[subIdx];
      deps.onHelp(leaf ? helpLabel(leaf) : '', leaf ? commandHelpText(leaf) : '');
    }

    function rowClasses(selected: boolean, c: AvailableCommand, gate = false): string {
      return [
        'ig-cmd',
        selected ? 'ig-cmd--selected' : '',
        c.enabled ? '' : 'ig-cmd--disabled',
        isSpherechange(c) ? 'ig-cmd--overdrive' : '',
        // A row carrying a `GRANTS:` line is laid out differently — see
        // `.ffx2cmd--gate` in `ffx2-hud.css`.
        gate ? 'ffx2cmd--gate' : '',
      ]
        .filter(Boolean)
        .join(' ');
    }

    function leafRowHtml(c: AvailableCommand, i: number, selected: boolean): string {
      const cursor = selected ? CURSOR_SVG : '';
      const mp = c.mpCost > 0 ? `<span class="ffx2cmd__mp">${c.mpCost}</span>` : '';
      const reason = !c.enabled && c.disabledReason ? `<span class="ffx2cmd__reason">${c.disabledReason}</span>` : '';
      const change = isSpherechange(c);
      const label = change ? spherechangeLabel(c) : c.label;
      const grants = change ? spherechangeHelp(c) : '';
      const gate = grants ? `<span class="ffx2cmd__grants">${grants}</span>` : '';
      return `<div class="${rowClasses(selected, c, Boolean(grants))}" data-idx="${i}" style="margin-right: calc(var(--ig-cascade-step) * ${i})"><span class="ffx2cmd__label">${label}</span>${gate}${reason}${mp}${cursor}</div>`;
    }

    /** A category row. `.ig-cmd--overdrive` for Change, because §4.5 costs the whole turn. */
    function groupRowHtml(group: string, items: AvailableCommand[], i: number, selected: boolean): string {
      const cursor = selected ? CURSOR_SVG : '';
      const isChange = group === CHANGE_GROUP;
      // Cursed seals the Garment Grid entirely (`ffx2-combat-core.md` §Curse):
      // every destination comes back disabled, so the row says so once rather
      // than opening a submenu of dead ends.
      const enabled = items.some((c) => c.enabled);
      const reason = !enabled && items[0]?.disabledReason ? `<span class="ffx2cmd__reason">${items[0].disabledReason}</span>` : '';
      const cls = ['ig-cmd', selected ? 'ig-cmd--selected' : '', enabled ? '' : 'ig-cmd--disabled', isChange ? 'ig-cmd--overdrive' : '']
        .filter(Boolean)
        .join(' ');
      return `<div class="${cls}" data-idx="${i}" style="margin-right: calc(var(--ig-cascade-step) * ${i})"><span class="ffx2cmd__label">${groupLabel(group)}</span>${reason}<span class="ffx2cmd__arrow">&#9666;</span>${cursor}</div>`;
    }

    /**
     * `fromCancel` is the whole point of `ui/ffx/cancelClaim.ts`.
     *
     * At the top row Esc has nowhere to step back to, so it is free for the
     * pause menu. But the two halves run off different clocks: this menu is a
     * DOM `keydown` listener firing between frames, while
     * `BattleScreen.handleInput` polls `justPressed('cancel')` once per frame.
     * Releasing the claim the instant Esc steps out of a submenu means the
     * screen polls on the next frame, finds that same press still fresh as an
     * edge, is told Esc is free, and opens the pause. One tap backed out of
     * the submenu **and** paused the game.
     *
     * Measured live before the fix (`critic/scratch/fix3-ffx2/esc-probe.mjs`
     * against a dev server on 5748): Esc out of the Change submenu *and* out of
     * the Skill submenu both landed on `screen() === 'pause'`. The FFX track
     * hit this in fix-3 and built `cancelClaim.ts` for it
     * (`docs/handoff/fix3-ffx-hud.md`); FFX-2's menu never adopted it, so the
     * bug was still live on this side. It is the same module, not a copy —
     * one implementation, no drift.
     */
    /**
     * Keep the selection on screen and say so when the list runs past the box.
     *
     * Two halves of the same defect: the window scrolls, but the cursor was
     * never scrolled with it (arrow down past the 7th Item row and the cursor
     * left the frame), and nothing marked the fold. `--more-below` /
     * `--more-above` drive the Ink & Gold fade and chevron in `ffx2-hud.css`.
     *
     * `scrollIntoView` is absent in jsdom, hence the guard; the classes are
     * still correct there because {@link scrollAffordance} is measured, not
     * assumed.
     */
    function markFold(): void {
      const box = deps.container;
      const cursor = box.querySelector<HTMLElement>('.ig-cmd--selected');
      if (cursor && typeof cursor.scrollIntoView === 'function') cursor.scrollIntoView({ block: 'nearest' });
      const { above, below } = scrollAffordance(box);
      box.classList.toggle('ffx2cmd--more-above', above);
      box.classList.toggle('ffx2cmd--more-below', below);
      for (const old of box.querySelectorAll('.ffx2cmd__fold')) old.remove();
      // Sticky, so each mark rides the edge of the box rather than the end of
      // the list: a `::before`/`::after` on the scroller scrolls with content.
      for (const [on, where, glyph] of [
        [above, 'up', '▴'],
        [below, 'down', '▾'],
      ] as Array<[boolean, string, string]>) {
        if (!on) continue;
        const mark = document.createElement('div');
        mark.className = `ffx2cmd__fold ffx2cmd__fold--${where}`;
        mark.setAttribute('aria-hidden', 'true');
        mark.textContent = glyph;
        if (where === 'up') box.prepend(mark);
        else box.append(mark);
      }
    }

    function renderTop(fromCancel = false): void {
      view = 'top';
      deps.onLevel?.('top');
      if (fromCancel) releaseCancelAfterPress();
      else releaseCancel();
      const rows = topRows
        .map((row, i) => {
          const selected = i === topIdx;
          if ('leaf' in row) return leafRowHtml(row.leaf, i, selected);
          return groupRowHtml(row.group, row.items, i, selected);
        })
        .join('');
      deps.container.innerHTML = `<div class="ig-cmd-stack">${rows}</div>`;
      markFold();
      emitPreview();
      emitHelp();
    }

    function renderSub(title: string): void {
      view = 'sub';
      deps.onLevel?.('deep');
      claimCancel();
      subCategory = title;
      const rows = subItems.map((c, i) => leafRowHtml(c, i, i === subIdx)).join('');
      deps.container.innerHTML = `<div class="ffx2cmd__title">${title}</div><div class="ig-cmd-stack">${rows}</div>`;
      markFold();
      emitPreview();
      emitHelp();
    }

    /** One candidate, with the display name, the letter tag and the accent. */
    function entryFor(id: CombatantId): TargetEntry {
      const entry: TargetEntry = {
        id,
        // The plate used to print the raw combatant id -- `yu-pagoda-c` on a
        // player-facing surface. Names come from the HUD now.
        name: deps.nameOf?.(id) ?? id,
        kind: deps.kindOf?.(id) ?? 'enemy',
      };
      const tag = deps.letterTagOf?.(id);
      if (tag) entry.tag = tag;
      return entry;
    }

    function renderTargets(): void {
      view = 'target';
      deps.onLevel?.('deep');
      claimCancel();
      const entries = targetIds.map(entryFor);
      cursor.setPanels(deps.panels?.() ?? []);
      if (groupMode) cursor.showGroup(entries);
      // Opens on the engine's preferred side: most X-2 skills also list the girls.
      else cursor.showSingle(entries, 0, pending?.preferredTargets);
    }

    /** Opens a category. A group with nothing enabled in it (a Cursed Change) never opens. */
    function openGroup(items: AvailableCommand[], label: string): void {
      if (!items.some((c) => c.enabled)) return;
      subItems = items;
      subIdx = items.findIndex((c) => c.enabled);
      if (subIdx < 0) subIdx = 0;
      renderSub(label);
    }

    function chooseLeaf(c: AvailableCommand): void {
      if (!c.enabled) return;
      if (c.validTargets.length === 0) {
        finish(c, []);
        return;
      }
      pending = c;
      // Recorded here, while `view` is still the one the row was picked in —
      // `renderTargets()` is about to overwrite it. See `pendingFrom`.
      pendingFrom = view === 'sub' ? 'sub' : 'top';
      targetIds = c.validTargets;
      // A party-wide cure or an all-enemy spread hits everything it is legal
      // against; asking which one, and bracketing one of three, is the defect
      // Bailey photographed in FFX's Hastega. Shared logic, so both games.
      const mode = resolveTargetMode(c);
      groupMode = mode.mode === 'all';
      if (mode.mode === 'all') targetIds = mode.targets;
      renderTargets();
    }

    /**
     * Esc out of target selection: drop the reticles and the pending command,
     * and go back to the list the command was actually picked from.
     *
     * Clearing `targetLayer` is half the fix on its own — the old cancel left
     * the reticles drawn over the boss while it redrew the command window, so
     * the screen showed a menu and a live target at the same time, two mutually
     * exclusive states.
     */
    function cancelTargets(): void {
      // `hide()` publishes the null selection, which is what restores every
      // figure the quiet dim pushed toward grey.
      cursor.hide();
      pending = null;
      targetIds = [];
      groupMode = false;
      if (pendingFrom === 'sub' && subItems.length > 0) renderSub(subCategory);
      // `renderTop(true)` and not `renderTop()`: this is a cancel, and the
      // claim has to outlive the press that caused it or `BattleScreen` polls
      // the same Esc on the next frame and opens the pause menu on top.
      else renderTop(true);
    }

    const onClick = (e: MouseEvent): void => {
      const el = (e.target as HTMLElement).closest('[data-idx]');
      if (!el) return;
      const idx = Number(el.getAttribute('data-idx'));
      if (view === 'top') {
        topIdx = idx;
        const row = topRows[idx];
        if (!row) return;
        if ('leaf' in row) chooseLeaf(row.leaf);
        else openGroup(row.items, groupLabel(row.group));
      } else if (view === 'sub') {
        subIdx = idx;
        const c = subItems[idx];
        if (c) chooseLeaf(c);
      }
    };

    const onKey = (e: KeyboardEvent): void => {
      if (KEY_CONFIRM.has(e.code)) {
        e.preventDefault();
        if (view === 'top') {
          const row = topRows[topIdx];
          if (!row) return;
          if ('leaf' in row) chooseLeaf(row.leaf);
          else openGroup(row.items, groupLabel(row.group));
        } else if (view === 'sub') {
          const c = subItems[subIdx];
          if (c) chooseLeaf(c);
        } else if (view === 'target') {
          // A multi-target command confirms the whole set; a single one
          // confirms the id under the cursor.
          const chosen = groupMode ? targetIds : cursor.targetIds;
          if (pending && chosen.length) finish(pending, chosen);
        }
        return;
      }
      if (KEY_CANCEL.has(e.code)) {
        e.preventDefault();
        if (view === 'target') cancelTargets();
        else if (view === 'sub') renderTop(true);
        return;
      }
      const list = view === 'top' ? topRows.length : view === 'sub' ? subItems.length : targetIds.length;
      if (!list) return;
      if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') {
        e.preventDefault();
        if (view === 'top') { topIdx = (topIdx - 1 + list) % list; renderTop(); }
        else if (view === 'sub') { subIdx = (subIdx - 1 + list) % list; renderSub(subCategory); }
        // The cursor steps through the ON-SCREEN order, left to right, so
        // "left" means left however the engine happened to list the fiends.
        else if (!groupMode) cursor.step(-1);
      } else if (e.code === 'ArrowDown' || e.code === 'ArrowRight') {
        e.preventDefault();
        if (view === 'top') { topIdx = (topIdx + 1) % list; renderTop(); }
        else if (view === 'sub') { subIdx = (subIdx + 1) % list; renderSub(subCategory); }
        else if (!groupMode) cursor.step(1);
      }
    };

    deps.container.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    renderTop();
    // Active ATB: hand the caller the teardown. The promise stays unresolved
    // on purpose — an invalidated menu produced no command.
    deps.onOpen?.(cleanup);
  });
}
