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
 * it renders as a single top-level row (this is how Trigger Happy and
 * Spherechange show up directly, per `visual-bible.md` §4.7's
 * "Attack · Trigger Happy · Gunplay · Item" example); a category with more
 * than one command renders as one row that opens a submenu listing them. A
 * submenu can now be long (once the dressphere ability tables are wired up),
 * so the stack itself scrolls — see `.ffx2hud__command`'s `max-height` in
 * `ffx2-hud.css` — rather than clipping silently.
 */
import type { AtbSnapshot, AvailableCommand, Command, CombatantId, TurnPreview } from '../../battle/common/types.ts';

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

export interface CommandMenuDeps {
  /** The command window's content element (already positioned/styled). */
  container: HTMLElement;
  /** Full-viewport overlay for target reticles, in the same space `project` returns. */
  targetLayer: HTMLElement;
  commands: AvailableCommand[];
  previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot;
  project: (id: CombatantId) => { x: number; y: number } | null;
  /** Fed the live preview every time the highlighted row changes. */
  onPreview: (preview: TurnPreview[] | AtbSnapshot) => void;
  actorName: string;
}

/** Every variant of {@link Command} carries a `targets` array; fill it in without an `as any`. */
function withTargets(command: Command, targets: CombatantId[]): Command {
  switch (command.kind) {
    case 'attack':
    case 'ability':
    case 'item':
    case 'overdrive':
    case 'trigger':
      return { ...command, targets };
    case 'summon':
    case 'dismiss':
    case 'switch':
    case 'spherechange':
    case 'escape':
    case 'defend':
      return { ...command, targets: [] };
  }
}

/** Groups by category (in first-seen order), except Spherechange rows, which are always their own row at their own position (see {@link isSpherechange}). A category that only ever gets one item collapses to a plain leaf row. */
function groupRows(commands: AvailableCommand[]): Row[] {
  const rows: Row[] = [];
  const groupIndex = new Map<string, number>();
  for (const c of commands) {
    if (isSpherechange(c)) {
      rows.push({ leaf: c });
      continue;
    }
    const idx = groupIndex.get(c.category);
    if (idx === undefined) {
      groupIndex.set(c.category, rows.length);
      rows.push({ group: c.category, items: [c] });
    } else {
      const row = rows[idx];
      if (row && 'group' in row) row.items.push(c);
    }
  }
  return rows.map((row) => ('group' in row && row.items.length === 1 ? { leaf: row.items[0]! } : row));
}

const KEY_CONFIRM = new Set(['Enter', 'Space', 'NumpadEnter', 'KeyZ']);
const KEY_CANCEL = new Set(['Escape', 'KeyX', 'Backspace']);

/** The ink cursor triangle, FFX-2's mirror (points left, trails the label — see the module comment). */
const CURSOR_SVG =
  '<svg class="ig-cmd__cursor" viewBox="0 0 12 16" aria-hidden="true"><path d="M11 1 L1 8 L11 15 Z" fill="#0B0A12"/></svg>';

/** `.ig-reticle`'s four corners plus a name plate carrying the target id (no display-name lookup here). */
function reticleHtml(id: string): string {
  return `
    <div class="ig-reticle__corner ig-reticle__corner--tl"></div>
    <div class="ig-reticle__corner ig-reticle__corner--tr"></div>
    <div class="ig-reticle__corner ig-reticle__corner--bl"></div>
    <div class="ig-reticle__corner ig-reticle__corner--br"></div>
    <div class="ig-reticle__name"><span class="ig-reticle__name-text">${id}</span></div>
  `;
}

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
    let targetIds: CombatantId[] = [];
    let targetIdx = 0;

    const cleanup = (): void => {
      window.removeEventListener('keydown', onKey);
      deps.container.removeEventListener('click', onClick);
      deps.targetLayer.removeEventListener('click', onTargetClick);
      deps.container.innerHTML = '';
      deps.targetLayer.innerHTML = '';
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

    function rowClasses(selected: boolean, c: AvailableCommand): string {
      return [
        'ig-cmd',
        selected ? 'ig-cmd--selected' : '',
        c.enabled ? '' : 'ig-cmd--disabled',
        isSpherechange(c) ? 'ig-cmd--overdrive' : '',
      ]
        .filter(Boolean)
        .join(' ');
    }

    function leafRowHtml(c: AvailableCommand, i: number, selected: boolean): string {
      const cursor = selected ? CURSOR_SVG : '';
      const mp = c.mpCost > 0 ? `<span class="ffx2cmd__mp">${c.mpCost}</span>` : '';
      const reason = !c.enabled && c.disabledReason ? `<span class="ffx2cmd__reason">${c.disabledReason}</span>` : '';
      return `<div class="${rowClasses(selected, c)}" data-idx="${i}" style="margin-right: calc(var(--ig-cascade-step) * ${i})"><span class="ffx2cmd__label">${c.label}</span>${reason}${mp}${cursor}</div>`;
    }

    function renderTop(): void {
      view = 'top';
      const rows = topRows
        .map((row, i) => {
          const selected = i === topIdx;
          if ('leaf' in row) return leafRowHtml(row.leaf, i, selected);
          const cursor = selected ? CURSOR_SVG : '';
          const label = CATEGORY_LABELS[row.group] ?? row.group;
          const cls = ['ig-cmd', selected ? 'ig-cmd--selected' : ''].filter(Boolean).join(' ');
          return `<div class="${cls}" data-idx="${i}" style="margin-right: calc(var(--ig-cascade-step) * ${i})"><span class="ffx2cmd__label">${label}</span><span class="ffx2cmd__arrow">&#9666;</span>${cursor}</div>`;
        })
        .join('');
      deps.container.innerHTML = `<div class="ig-cmd-stack">${rows}</div>`;
      emitPreview();
    }

    function renderSub(title: string): void {
      view = 'sub';
      subCategory = title;
      const rows = subItems.map((c, i) => leafRowHtml(c, i, i === subIdx)).join('');
      deps.container.innerHTML = `<div class="ffx2cmd__title">${title}</div><div class="ig-cmd-stack">${rows}</div>`;
      emitPreview();
    }

    function renderTargets(): void {
      view = 'target';
      deps.targetLayer.innerHTML = targetIds
        .map((id, i) => {
          const pos = deps.project(id);
          const selected = i === targetIdx ? ' ig-reticle--selected' : '';
          if (pos) {
            return `<div class="ig-reticle${selected}" data-idx="${i}" style="left:${pos.x}px;top:${pos.y}px">${reticleHtml(id)}</div>`;
          }
          // No projected position (headless/test): fall back to a stacked list.
          return `<div class="ig-reticle ig-reticle--list${selected}" data-idx="${i}" style="left:16px;top:${16 + i * 24}px">${id}</div>`;
        })
        .join('');
    }

    function openGroup(items: AvailableCommand[], label: string): void {
      subItems = items;
      subIdx = 0;
      renderSub(label);
    }

    function chooseLeaf(c: AvailableCommand): void {
      if (!c.enabled) return;
      if (c.validTargets.length === 0) {
        finish(c, []);
        return;
      }
      pending = c;
      targetIds = c.validTargets;
      targetIdx = 0;
      renderTargets();
    }

    const onTargetClick = (e: MouseEvent): void => {
      if (view !== 'target') return;
      const el = (e.target as HTMLElement).closest('[data-idx]');
      if (!el) return;
      targetIdx = Number(el.getAttribute('data-idx'));
      const id = targetIds[targetIdx];
      if (pending && id) finish(pending, [id]);
    };

    const onClick = (e: MouseEvent): void => {
      const el = (e.target as HTMLElement).closest('[data-idx]');
      if (!el) return;
      const idx = Number(el.getAttribute('data-idx'));
      if (view === 'top') {
        topIdx = idx;
        const row = topRows[idx];
        if (!row) return;
        if ('leaf' in row) chooseLeaf(row.leaf);
        else openGroup(row.items, CATEGORY_LABELS[row.group] ?? row.group);
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
          else openGroup(row.items, CATEGORY_LABELS[row.group] ?? row.group);
        } else if (view === 'sub') {
          const c = subItems[subIdx];
          if (c) chooseLeaf(c);
        } else if (view === 'target') {
          const id = targetIds[targetIdx];
          if (pending && id) finish(pending, [id]);
        }
        return;
      }
      if (KEY_CANCEL.has(e.code)) {
        e.preventDefault();
        if (view === 'target') renderSub(subCategory);
        else if (view === 'sub') renderTop();
        return;
      }
      const list = view === 'top' ? topRows.length : view === 'sub' ? subItems.length : targetIds.length;
      if (!list) return;
      if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') {
        e.preventDefault();
        if (view === 'top') { topIdx = (topIdx - 1 + list) % list; renderTop(); }
        else if (view === 'sub') { subIdx = (subIdx - 1 + list) % list; renderSub(subCategory); }
        else { targetIdx = (targetIdx - 1 + list) % list; renderTargets(); }
      } else if (e.code === 'ArrowDown' || e.code === 'ArrowRight') {
        e.preventDefault();
        if (view === 'top') { topIdx = (topIdx + 1) % list; renderTop(); }
        else if (view === 'sub') { subIdx = (subIdx + 1) % list; renderSub(subCategory); }
        else { targetIdx = (targetIdx + 1) % list; renderTargets(); }
      }
    };

    deps.container.addEventListener('click', onClick);
    deps.targetLayer.addEventListener('click', onTargetClick);
    window.addEventListener('keydown', onKey);
    renderTop();
  });
}
