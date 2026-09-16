import type { AnyCombatant, CombatantId, FFXCombatant, StatusId } from '../../battle/common/types.ts';
import { portraitChipHtml, tintFor, wirePortraitFallbacks } from './portraits.ts';

/**
 * Party status, restyled onto Ink & Gold's `.ig-stat-list`/`.ig-stat`
 * (`src/ui/inkgold/slabs.css`, spec "Components" > "Party status"): right
 * 52,54 @1440, rows cascading 16px right-to-left, acting row in gold with a
 * `.94` ink background, Overdrive gauge as a 120x8 gold-fill bar.
 */
export class PartyStatusWindow {
  readonly el: HTMLElement;
  private readonly prevHp = new Map<CombatantId, number>();

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ig-stat-list';
    this.el.dataset['role'] = 'party-status';
  }

  render(activeIds: CombatantId[], combatants: Record<CombatantId, AnyCombatant>, actingId: CombatantId | null): void {
    const rows = activeIds.map((id, i) => this.rowHtml(id, combatants[id], i, id === actingId));
    this.el.innerHTML = rows.join('');
    wirePortraitFallbacks(this.el);
  }

  private rowHtml(id: CombatantId, c: AnyCombatant | undefined, i: number, acting: boolean): string {
    if (!c) return '';
    const ffx = c as FFXCombatant;
    const maxHp = c.stats.maxHp || 1;
    const maxMp = c.stats.maxMp || 1;
    const hpFrac = c.hp / maxHp;
    const gauge = Math.max(0, Math.min(100, ffx.overdrive?.gauge ?? 0));

    const prev = this.prevHp.get(id);
    const hurt = prev !== undefined && c.hp < prev;
    this.prevHp.set(id, c.hp);

    const hpValueCls = ['ig-stat__value', !c.alive ? 'ffx-stat__value--ko' : hpFrac <= 0.125 ? 'ffx-stat__value--danger' : hpFrac < 0.5 ? 'ffx-stat__value--crit' : '']
      .filter(Boolean)
      .join(' ');
    const rowCls = ['ig-stat', acting ? 'ig-stat--acting' : '', !c.alive ? 'ffx-stat--ko' : '', hurt ? 'ffx-stat--hurt' : '']
      .filter(Boolean)
      .join(' ');

    const statuses = activeStatusIds(c).slice(0, 6);
    const statusHtml = statuses.length ? `<span class="ffx-stat__statuses">${statuses.map((s) => `<i title="${s}"></i>`).join('')}</span>` : '';

    return `<div class="${rowCls}" style="margin-right:calc(var(--ig-stat-step) * ${i})" data-actor="${id}">
      <span class="ig-stat__face">${portraitChipHtml(c.portraitKey, c.name, tintFor('party'))}</span>
      <span class="ig-stat__name">${escapeHtml(c.name)}</span>
      <span class="${hpValueCls}">${c.hp}<small>/${maxHp}</small></span>
      <span class="ig-stat__value ig-stat__value--mp">${c.mp}<small>/${maxMp}</small></span>
      <span class="ig-stat__od"><i style="width:${gauge}%"></i></span>
      ${statusHtml}
    </div>`;
  }
}

function activeStatusIds(c: AnyCombatant): StatusId[] {
  return (Object.keys(c.statuses) as StatusId[]).filter((k) => c.statuses[k] !== undefined && k !== 'ko');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
