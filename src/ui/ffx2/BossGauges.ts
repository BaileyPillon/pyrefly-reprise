/**
 * The FFX-2 enemy gauge strip — boss name, HP bar, HP numerals and part bars.
 *
 * What shipped before was one bare `.ig-bosshp` per enemy: an unbacked pink bar
 * with the name floating next to it, no numerals ever, and every destructible
 * part drawn as a peer of its owner, so Vegnagun's body and its two Bulwarks
 * read as three separate bosses stacked in the corner.
 *
 * This draws the strip the way `research/visual-bible.md` §4 asks for it, in
 * Ink & Gold tokens rather than §4.2's own window chrome (the approved
 * `docs/handoff/ink-and-gold/BattleFfx2.dc.html` replaces that chrome wholesale
 * — see `docs/handoff/presentation-ink-and-gold.md`):
 *
 * - **Name** in the shared `.ig-bosshp__name` serif italic, on an ink panel so
 *   it survives a bright painted backdrop (the Farplane frame is pastel edge to
 *   edge, and paper-on-nothing vanished into it).
 * - **HP numerals** — `§4.3`'s `1240/1980` treatment, moved to the enemy row —
 *   but only once the fight has *earned* them. FFX-2 hides an enemy's HP until
 *   Scan/Sensor reveals it, so an unrevealed boss shows a `SCAN` hint in the
 *   numeral slot instead. The empty slot is then deliberate rather than missing.
 * - **Part bars** for Vegnagun's Bulwarks / Redoubts / Nodes: indented under
 *   their owner (`CombatantFlags.partOf`), at two thirds the track width, so
 *   the hierarchy — "kill the arms before you look it in the face" — is legible
 *   from the bar layout alone. A part with `hideHpBar` is omitted entirely, and
 *   a destroyed one holds its row with a `DOWN` tag rather than vanishing, so
 *   the rows below it do not jump.
 */

import type { AnyCombatant, AtbSnapshot, BattleState, CombatantId } from '../../battle/common/types.ts';

/** §4.3's critical threshold, applied to the enemy numerals. */
const CRITICAL = 0.33;

export interface ChargePip {
  stage: 1 | 2;
  name: string;
}

export interface BossGaugeOptions {
  /** Enemies whose HP numerals Scan/Sensor has revealed. */
  revealed: ReadonlySet<CombatantId>;
  /** Live charge telegraph per enemy, from the `charge` event. */
  charging: ReadonlyMap<CombatantId, ChargePip>;
}

function pct(hp: number, maxHp: number): number {
  return Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** `7 549/8 400`, or the `SCAN` hint while the enemy's HP is still a secret. */
function numeralsHtml(c: AnyCombatant, revealed: boolean): string {
  if (!revealed) return `<span class="ffx2boss__hint">SCAN</span>`;
  const crit = c.hp / Math.max(1, c.stats.maxHp) < CRITICAL ? ' ffx2boss__num--crit' : '';
  return `<span class="ffx2boss__num${crit}">${Math.max(0, c.hp)}<small>/${c.stats.maxHp}</small></span>`;
}

function trackHtml(fill: number): string {
  return `<div class="ig-bosshp__track"><div class="ig-bosshp__fill" style="width:${fill.toFixed(1)}%"></div></div>`;
}

function partRowHtml(c: AnyCombatant, revealed: boolean): string {
  const down = !c.alive || c.removed;
  const tag = down ? `<span class="ffx2boss__down">DOWN</span>` : numeralsHtml(c, revealed);
  return `<div class="ffx2boss__part${down ? ' ffx2boss__part--down' : ''}" data-actor-id="${c.id}">
    <span class="ffx2boss__partname">${escape(c.name)}</span>
    ${trackHtml(down ? 0 : pct(c.hp, c.stats.maxHp))}
    ${tag}
  </div>`;
}

/**
 * One `.ig-bosshp` block per top-level enemy, each carrying its own parts.
 *
 * Stacking is left to normal flow — the previous version positioned every row
 * absolutely from an inline `top: calc(17.78px + i * 26px)`, which could not
 * account for a row that grew a part list under it.
 */
export function enemyGaugesHtml(
  state: BattleState,
  _snapshot: AtbSnapshot,
  opts: BossGaugeOptions,
): string {
  const all = state.enemyIds
    .map((id) => state.combatants[id])
    .filter((c): c is AnyCombatant => !!c && !c.removed && !c.flags.hidden && !c.flags.hideHpBar);

  const parts = new Map<CombatantId, AnyCombatant[]>();
  for (const c of all) {
    const owner = c.flags.isPart ? c.flags.partOf : undefined;
    if (!owner) continue;
    const list = parts.get(owner) ?? [];
    list.push(c);
    parts.set(owner, list);
  }

  return all
    .filter((c) => !c.flags.isPart)
    .map((c) => {
      const charge = opts.charging.get(c.id);
      const pip = charge
        ? `<span class="ffx2enemy__pip ffx2enemy__pip--s${charge.stage}" title="${escape(charge.name)}"></span>`
        : '';
      const own = (parts.get(c.id) ?? [])
        .map((p) => partRowHtml(p, opts.revealed.has(p.id)))
        .join('');
      return `<div class="ig-bosshp" data-actor-id="${c.id}">
        <div class="ffx2boss__head">
          <div class="ig-bosshp__name">${escape(c.name)}</div>
          ${trackHtml(pct(c.hp, c.stats.maxHp))}
          ${numeralsHtml(c, opts.revealed.has(c.id))}${pip}
        </div>
        ${own ? `<div class="ffx2boss__parts">${own}</div>` : ''}
      </div>`;
    })
    .join('');
}
