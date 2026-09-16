import type { FFXMemberBuild, FFXPartyBuild, OverdriveModeId } from '../../../battle/common/types.ts';
import { escapeHtml } from '../minigames/params.ts';

export type DetailTab = 'stats' | 'sphere-grid' | 'equipment' | 'items' | 'overdrive';

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'stats', label: 'STATS' },
  { id: 'sphere-grid', label: 'SPHERE GRID' },
  { id: 'equipment', label: 'EQUIPMENT' },
  { id: 'items', label: 'ITEMS' },
  { id: 'overdrive', label: 'OVERDRIVE' },
];

const STAT_ROWS: Array<{ key: keyof FFXMemberBuild['stats']; label: string; max: number }> = [
  { key: 'hp', label: 'HP', max: 9999 },
  { key: 'mp', label: 'MP', max: 999 },
  { key: 'str', label: 'Strength', max: 255 },
  { key: 'def', label: 'Defense', max: 255 },
  { key: 'mag', label: 'Magic', max: 255 },
  { key: 'mdef', label: 'Magic Def', max: 255 },
  { key: 'agi', label: 'Agility', max: 255 },
  { key: 'luck', label: 'Luck', max: 255 },
  { key: 'eva', label: 'Evasion', max: 255 },
  { key: 'acc', label: 'Accuracy', max: 255 },
];

/**
 * The right-hand detail panel [visual-bible §5.4], `x176 y12 w452 h248`, four
 * of its five tabs (Sphere Grid gets its own canvas widget, `SphereGridView`,
 * mounted at the same rect and toggled by the caller). STATS mirrors the
 * spec's two-column layout; EQUIPMENT and ITEMS are read-only viewers — the
 * party build carries no spare-equipment pool to re-gear from, only what is
 * already worn; OVERDRIVE is the one interactive tab, letting the player pick
 * any of the character's `unlockedModes`.
 */
export class DetailPanel {
  readonly el: HTMLElement;
  private tab: DetailTab = 'stats';
  private member: FFXMemberBuild | null = null;
  private build: FFXPartyBuild | null = null;
  private onModeChange: ((memberId: string, mode: OverdriveModeId) => void) | null = null;
  private onTabChange: ((tab: DetailTab) => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffxhud-win ffxprep-detail';
    this.el.innerHTML = `<div class="ffxprep-tabs" data-role="tabs"></div><div class="ffxprep-detail__body" data-role="body"></div>`;
    this.el.querySelector('[data-role="tabs"]')!.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]');
      if (el?.dataset['tab']) this.setTab(el.dataset['tab'] as DetailTab);
    });
  }

  setOnModeChange(cb: (memberId: string, mode: OverdriveModeId) => void): void {
    this.onModeChange = cb;
  }

  /** Called whenever the active tab changes, so the caller can show/hide `SphereGridView`. */
  setOnTabChange(cb: (tab: DetailTab) => void): void {
    this.onTabChange = cb;
  }

  get activeTab(): DetailTab {
    return this.tab;
  }

  show(member: FFXMemberBuild, build: FFXPartyBuild): void {
    this.member = member;
    this.build = build;
    this.render();
  }

  private setTab(tab: DetailTab): void {
    this.tab = tab;
    this.onTabChange?.(tab);
    this.render();
  }

  private render(): void {
    const tabsEl = this.el.querySelector<HTMLElement>('[data-role="tabs"]')!;
    tabsEl.innerHTML = TABS.map(
      (t) => `<span class="ffxprep-tab ${t.id === this.tab ? 'ffxprep-tab--active' : ''}" data-tab="${t.id}">${t.label}</span>`,
    ).join('');

    const bodyEl = this.el.querySelector<HTMLElement>('[data-role="body"]')!;
    if (!this.member || !this.build) {
      bodyEl.innerHTML = '';
      return;
    }
    if (this.tab === 'sphere-grid') {
      bodyEl.innerHTML = '';
      return;
    }
    bodyEl.innerHTML =
      this.tab === 'stats'
        ? this.statsHtml(this.member)
        : this.tab === 'equipment'
          ? this.equipmentHtml(this.member)
          : this.tab === 'items'
            ? this.itemsHtml(this.build)
            : this.overdriveHtml(this.member);
    if (this.tab === 'overdrive') this.wireOverdrive(bodyEl, this.member);
  }

  private statsHtml(m: FFXMemberBuild): string {
    const rows = STAT_ROWS.map(({ key, label, max }) => {
      const value = m.stats[key];
      const pct = Math.max(0, Math.min(100, (value / max) * 100));
      return `<div class="ffxprep-stat-row">
        <span class="ffxprep-stat-row__label">${label}</span>
        <span class="ffxprep-stat-row__bar"><i style="width:${pct}%"></i></span>
        <span class="ffxprep-stat-row__value">${value}</span>
      </div>`;
    }).join('');
    return `<div class="ffxprep-stats">${rows}</div>`;
  }

  private equipmentHtml(m: FFXMemberBuild): string {
    const gear = (label: string, def: FFXMemberBuild['equipment']['weapon']): string => `
      <div><b>${label}: ${escapeHtml(def.name)}</b></div>
      <div class="ffxprep-chips">${
        def.autoAbilities.length
          ? def.autoAbilities.map((a) => `<span class="ffxprep-chip">${escapeHtml(a)}</span>`).join('')
          : '<span class="ffxprep-chip">—</span>'
      }</div>`;
    return `${gear('Weapon', m.equipment.weapon)}${gear('Armor', m.equipment.armor)}
      <div class="ffxprep-mode-desc">Overdrive: ${escapeHtml(m.overdrive.mode)}</div>`;
  }

  private itemsHtml(build: FFXPartyBuild): string {
    if (!build.inventory.length) return `<div class="ffxprep-mode-desc">No items.</div>`;
    return build.inventory
      .map((entry) => `<div class="ffxprep-list-row"><span>${escapeHtml(entry.itemId)}</span><span class="ffxprep-list-row__qty">x${entry.count}</span></div>`)
      .join('');
  }

  private overdriveHtml(m: FFXMemberBuild): string {
    const rows = m.overdrive.unlockedModes
      .map(
        (mode) =>
          `<div class="ffxprep-list-row ${mode === m.overdrive.mode ? 'ffxprep-list-row--selected' : ''}" data-mode="${mode}">
            <span>${escapeHtml(mode)}</span>${mode === m.overdrive.mode ? '<span class="ffxprep-list-row__qty">EQUIPPED</span>' : ''}
          </div>`,
      )
      .join('');
    return `${rows}<div class="ffxprep-mode-desc">Current: <b>${escapeHtml(m.overdrive.mode)}</b></div>`;
  }

  private wireOverdrive(bodyEl: HTMLElement, m: FFXMemberBuild): void {
    bodyEl.querySelectorAll<HTMLElement>('[data-mode]').forEach((row) => {
      row.addEventListener('click', () => {
        const mode = row.dataset['mode'] as OverdriveModeId;
        this.onModeChange?.(m.id, mode);
      });
    });
  }
}
