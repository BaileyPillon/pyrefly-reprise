import type { AnyCombatant, CombatantId, FFXCombatant } from '../../battle/common/types.ts';
import { aeonChipHtml, portraitChipHtml, tintFor, wirePortraitFallbacks } from './portraits.ts';
import { captionHtml, ffxPlateIconsHtml } from '../common/statusRows.ts';
import { zombieWarnOn } from './zombieWarnOptions.ts';
import '../common/pro-markers.css';
import { makePartyGhost, memberKey, membershipChanged, playPartySwap, reduceMotionNow, swapTiming } from './partySwap.ts'; // r64-fixes: the cards ease when the list changes who is on it (the aeon's summon and dismissal), F1 HUD only
import { proMarkersOn, rowMark, rowMarkClass, rowMarkHtml, rowMarkStyle } from '../common/proMarkers.ts'; // lane pro-look: the low-HP pulse, the KO pill

/**
 * FFX Critical (SOS): HP below half of max, where the digits turn yellow (research/ffx-combat-core.md V8 and
 * section 4.2, "HP < 50 % of max"). The painted low-HP slouch (`ui/common/restPoses.ts`) reads the same number.
 */
export const FFX_HP_YELLOW_BELOW = 0.5;

/**
 * Party status, restyled onto Ink & Gold's `.ig-stat-list`/`.ig-stat`
 * (`src/ui/inkgold/slabs.css`, spec "Components" > "Party status"): right
 * 52,54 @1440, rows cascading 16px right-to-left, acting row in gold with a
 * `.94` ink background, Overdrive gauge as a 120x8 gold-fill bar.
 */
export class PartyStatusWindow {
  readonly el: HTMLElement;
  private readonly prevHp = new Map<CombatantId, number>();
  /**
   * Last frame's Overdrive gauge per member, so the row can say the one thing
   * the bar could not: **it just filled**.
   *
   * Round 02 #37 — "Kimahri's gauge was visibly full in Chapter 1 with no
   * flash, no label, no chip and no sound hook". A bar that is 53 grid px of
   * gold at 99% and 53 grid px of gold at 100% carries no event, and the whole
   * value of the gauge is the moment it crosses.
   */
  private readonly prevGauge = new Map<CombatantId, number>();
  /** Who the list showed at the last render (`partySwap.memberKey`), to tell a swap of the whole list from a change of numbers. */
  private lastMembers: string | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ig-stat-list';
    this.el.dataset['role'] = 'party-status';
  }

  render(activeIds: CombatantId[], combatants: Record<CombatantId, AnyCombatant>, actingId: CombatantId | null): void {
    const rows = activeIds.map((id, i) => this.rowHtml(id, combatants[id], i, id === actingId));
    // r63-play (the overnight fix of the skeptic's m1, FFX; Chapter I): every render replaces the rows, and a replaced row is born at its final height, so a render that landed while the F1 HUD's slim cards
    // were on their way back (a menu opening, a hit's numbers) snapped them up to 90 px in one frame. Each new row now starts from the height its old one had and eases from there, as the rest do.
    const f1 = this.el.closest('.hud-f1') !== null;
    const before = f1 ? this.heights() : null;
    // r64-fixes (FFX, Chapter I; the F1 HUD): a change of who is on the list (an aeon in, an aeon out) is eased with the HUD's own step-back motion, the old cards leaving as a ghost.
    const members = memberKey(activeIds);
    const swap = f1 && membershipChanged(this.lastMembers, members, this.el.querySelectorAll('.ig-stat').length);
    this.lastMembers = members;
    const ghost = swap ? makePartyGhost(this.el) : null;
    this.el.innerHTML = rows.join('');
    wirePortraitFallbacks(this.el);
    if (swap) playPartySwap(this.el, ghost, swapTiming(this.el, reduceMotionNow()));
    else if (before && before.size) this.carryHeights(before);
  }

  /** Each row's used height now (mid-transition included), in the row's own units, by actor. */
  private heights(): Map<string, number> {
    const out = new Map<string, number>();
    for (const row of this.el.querySelectorAll<HTMLElement>('.ig-stat')) {
      const h = parseFloat(getComputedStyle(row).height);
      if (Number.isFinite(h) && row.dataset['actor']) out.set(row.dataset['actor'], h);
    }
    return out;
  }

  /** The new rows start at the old rows' height and let the stylesheet's height transition carry them to where they belong. */
  private carryHeights(before: Map<string, number>): void {
    for (const row of this.el.querySelectorAll<HTMLElement>('.ig-stat')) {
      const from = before.get(row.dataset['actor'] ?? '');
      if (from === undefined) continue;
      const to = parseFloat(getComputedStyle(row).height);
      if (!Number.isFinite(to) || Math.abs(from - to) < 1) continue;
      row.style.transition = 'none';
      row.style.height = `${from}px`;
      void row.offsetHeight; // the old height is the style the transition starts from
      row.style.transition = '';
      row.style.height = '';
    }
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

    // The Overdrive gauge: a label so it is not an unexplained second bar, a
    // READY state so full is legible at a glance, and a one-shot flash on the
    // render that crosses 100 so the fill is an event [round-02 #37]. The
    // flash class is written on that render only — every later render draws
    // the steady READY state, so the animation cannot loop.
    const ready = gauge >= 100 && c.alive;
    const prevG = this.prevGauge.get(id);
    const justFilled = ready && prevG !== undefined && prevG < 100;
    this.prevGauge.set(id, gauge);
    const odCls = ['ig-stat__od', 'ffx-stat__od', ready ? 'ffx-stat__od--ready' : '', justFilled ? 'ffx-stat__od--filled' : '']
      .filter(Boolean)
      .join(' ');
    const odLabel = ready ? 'Overdrive' : 'OD';

    const hpValueCls = ['ig-stat__value', !c.alive ? 'ffx-stat__value--ko' : hpFrac <= 0.125 ? 'ffx-stat__value--danger' : hpFrac < FFX_HP_YELLOW_BELOW ? 'ffx-stat__value--crit' : '']
      .filter(Boolean)
      .join(' ');
    const proMark = proMarkersOn() ? rowMark('ffx', c.hp, maxHp, c.alive) : null; // lane pro-look: null (nothing) with the piece off, the default
    const rowCls =
      ['ig-stat', acting ? 'ig-stat--acting' : '', !c.alive ? 'ffx-stat--ko' : '', hurt ? 'ffx-stat--hurt' : '']
        .filter(Boolean)
        .join(' ') + rowMarkClass(proMark);

    // Status display O2/O3 (Bailey's pick, 2026-09-29): round medallions under the Overdrive gauge,
    // most alarming first (the old single-colour pips are replaced), and a caption where a status
    // takes the command away ("ASLEEP"). `ui/common/statusRows.ts`.
    // Option "word" (off; `zombieWarnOptions.ts`): the status spelled out after the icons.
    const word = c.alive && c.statuses['zombie'] && zombieWarnOn('word') ? '<em class="ffx-stat__zombie">Zombie</em>' : '';
    const statusHtml = ffxPlateIconsHtml(c, word) + captionHtml('ffx', c);

    // The aeon's row while it is out (PR-0181) wears the turn list's aeon chip, not a letter (FOC24-02, CHK-012).
    const face = c.side === 'aeon' ? aeonChipHtml(c.spriteKey ?? id, c.name, c.portraitKey) : portraitChipHtml(c.portraitKey, c.name, tintFor('party'));
    return `<div class="${rowCls}" style="margin-right:calc(var(--ig-stat-step) * ${i})${rowMarkStyle(proMark)}" data-actor="${id}">
      <span class="ig-stat__face">${face}${rowMarkHtml(proMark)}</span>
      <span class="ig-stat__name">${escapeHtml(c.name)}</span>
      <span class="${hpValueCls}">${c.hp}<small>/${maxHp}</small></span>
      <span class="ig-stat__value ig-stat__value--mp">${c.mp}<small>/${maxMp}</small></span>
      <span class="${odCls}" title="Overdrive ${Math.round(gauge)}%"><i style="width:${gauge}%"></i><em>${odLabel}</em></span>
      ${statusHtml}
    </div>`;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
