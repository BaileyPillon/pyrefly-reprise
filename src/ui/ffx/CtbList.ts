import type { AnyCombatant, CombatantId, StatusId, TurnPreview } from '../../battle/common/types.ts';
import { portraitChipHtml, resolvePortraitKey, tintFor, wirePortraitFallbacks } from './portraits.ts';

/** Ink & Gold spec: "CTB queue ... Six rows visible" (presentation-ink-and-gold.md "Components"). */
const VISIBLE_ROWS = 6;

/**
 * Font sizes `fitNames` may give a queue name plate, largest first, in the
 * 640x360 grid's own px.
 *
 * 5.6 is the legibility floor `ffx-hud.css` sets for a HUD label (14 device px
 * at 1600x900) and is what every name in the five chapters actually renders at
 * — the ladder exists for a name a later encounter brings that is one
 * unbreakable word wider than the 48px cap. 4.9 is 12 device px, below the
 * floor but still a readable plate, and a long name at 12px beats the same name
 * ellipsised to "Seymour F…".
 */
const NAME_SIZES = [5.6, 5.2, 4.9] as const;

/** Most lines a name plate may wrap to before `fitNames` steps the size down. */
const NAME_MAX_LINES = 3;

/** Vertical padding on `.ig-ctb__name`, both edges together (`ffx-hud.css`). */
const NAME_PAD_Y = 3.2;

/** `line-height` on `.ig-ctb__name` (`ffx-hud.css`). */
const NAME_LINE_HEIGHT = 1.16;

/** Not part of the Ink & Gold component set (no accent may compete with gold);
 * kept as small functional state dots so Overdrive-ready and a boss's charge
 * stage stay legible, using the same amber/red pair the FFX visual-bible used. */
const CHARGE_DOT: Record<1 | 2, string> = { 1: '#f2a33a', 2: '#e8412e' };

const STATUS_DOT_COLOR: Partial<Record<StatusId, string>> = {
  haste: '#7ee8b0',
  slow: '#b48fe0',
  protect: '#9fc4e8',
  shell: '#c8a0f0',
  reflect: '#ffe08a',
  regen: '#8be8b0',
  poison: '#a8d84a',
  silence: '#c8c8c8',
  darkness: '#8e8e9e',
  sleep: '#9fc4e8',
  zombie: '#a8c48a',
  berserk: '#f28a6a',
  petrify: '#b4ae9e',
  curse: '#c04ac0',
  'auto-life': '#fff0a8',
  doom: '#c7343c',
};

/**
 * The CTB / Act List, restyled onto Ink & Gold's `.ig-ctb` component
 * (`src/ui/inkgold/slabs.css`, spec "Components" > "CTB queue"): right
 * 44,112 @1440, 46px tiles cascading -8px further left per row, the current
 * actor's tile scaled up with a gold glow. Re-sorting is the renderer's only
 * job; `TurnPreview[]` from `predictTurnOrder()` already arrives sorted
 * ascending by `tickValue`.
 */
export class CtbList {
  readonly el: HTMLElement;

  /**
   * The size {@link fitNames} settled on for a given name, so the measuring
   * only happens once per name instead of on every render.
   *
   * The queue re-renders on every `sync` *and* on every `previewRank` while the
   * player moves the cursor, which is several times a second; measuring
   * `scrollHeight` forces a layout each time. The cast of a battle is a handful
   * of names and a name's fit depends on nothing but the name, so one
   * measurement each is all that is ever needed. The map is per-list, so a new
   * battle (a new `CtbList`) measures afresh.
   */
  private readonly fittedSizes = new Map<string, number>();

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ig-ctb';
    this.el.dataset['role'] = 'ctb-list';
  }

  render(preview: TurnPreview[], combatants: Record<CombatantId, AnyCombatant>): void {
    const rows = preview.slice(0, VISIBLE_ROWS).map((row, i) => this.rowHtml(row, i, combatants));
    this.el.innerHTML = rows.join('');
    wirePortraitFallbacks(this.el);
    this.fitNames();
  }

  /**
   * Fit every name plate inside the 48px cap without ellipsis.
   *
   * The plate wraps (`ffx-hud.css` sets `white-space: normal`), so the only
   * thing that can still overflow is a name whose *longest single word* is
   * wider than the cap, or one that needs more than {@link NAME_MAX_LINES}.
   * Both are answered by stepping the font down {@link NAME_SIZES} until the
   * measured `scrollHeight`/`scrollWidth` fit, and the smallest rung is used if
   * none do — a slightly small plate still reads, a clipped one does not.
   *
   * jsdom reports 0 for every box, so the loop takes the first rung there and
   * the plate renders at full size, which is what the unit tests assert.
   */
  private fitNames(): void {
    for (const el of this.el.querySelectorAll<HTMLElement>('.ig-ctb__name')) {
      const name = el.textContent ?? '';
      const cached = this.fittedSizes.get(name);
      if (cached !== undefined) {
        el.style.setProperty('--ffx-ctb-name-size', `${cached}px`);
        continue;
      }
      let chosen = NAME_SIZES[NAME_SIZES.length - 1]!;
      for (const size of NAME_SIZES) {
        el.style.setProperty('--ffx-ctb-name-size', `${size}px`);
        const maxHeight = NAME_PAD_Y + size * NAME_LINE_HEIGHT * NAME_MAX_LINES + 0.5;
        if (el.scrollHeight <= maxHeight && el.scrollWidth <= el.clientWidth + 0.5) {
          chosen = size;
          break;
        }
      }
      el.style.setProperty('--ffx-ctb-name-size', `${chosen}px`);
      this.fittedSizes.set(name, chosen);
    }
  }

  private rowHtml(row: TurnPreview, i: number, combatants: Record<CombatantId, AnyCombatant>): string {
    const current = i === 0;
    const combatant = combatants[row.actorId];
    const name = combatant?.name ?? row.actorId;
    const side = row.isParty ? 'party' : 'enemy';
    const tileCls = ['ig-ctb__tile', !row.isParty ? 'ig-ctb__tile--enemy' : '', current ? 'ig-ctb__tile--now' : ''].filter(Boolean).join(' ');
    // Enemy `TurnPreview` rows never carry `portraitKey` (`EnemyDef` has no
    // such field) — the letter tag was the only identity the tile showed.
    // Resolve one here: try the dedicated `portraits/<id>.png` first
    // (`resolvePortraitKey` covers the one id/file mismatch, Seymour Flux),
    // then fall to a crop of the enemy's own idle painting via `bodyId`
    // (`combatant.spriteKey`, since a multi-form boss's idle art is keyed by
    // form — `yunalesca-1`/`-2`/`-3` — not by its one shared fight id).
    const face = row.isParty
      ? portraitChipHtml(row.portraitKey, name, tintFor(side))
      : portraitChipHtml(row.portraitKey ?? resolvePortraitKey(row.actorId), name, tintFor(side), combatant?.spriteKey ?? row.actorId);
    const tag = row.letterTag ? `<span class="ig-ctb__tag">${escapeHtml(row.letterTag)}</span>` : '';
    const od = row.overdriveReady
      ? `<span class="ffx-ctb-od" title="Overdrive ready"></span>`
      : '';
    const charge = row.chargeStage
      ? `<span class="ffx-ctb-charge" style="background:${CHARGE_DOT[row.chargeStage]}" title="Charging"></span>`
      : '';
    const statuses = row.statusIcons.slice(0, 3);
    const statusHtml = statuses.length
      ? `<span class="ffx-ctb-statuses">${statuses
          .map((s) => `<i style="background:${STATUS_DOT_COLOR[s] ?? '#8fa4bc'}" title="${escapeHtml(s)}"></i>`)
          .join('')}</span>`
      : '';
    return `<div class="ig-ctb__row" style="transform:translateX(calc(var(--ig-ctb-step) * ${i}))" data-actor="${escapeHtml(row.actorId)}">
      <span class="ig-ctb__name">${escapeHtml(name)}</span>
      <span class="${tileCls}">${face}${tag}${od}${charge}${statusHtml}</span>
    </div>`;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
