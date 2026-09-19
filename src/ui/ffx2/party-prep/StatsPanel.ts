/**
 * The FFX-2 Stats tab.
 *
 * Its own file because `panels.ts` crossed the project's 400-line cap with it
 * inside; it reads the same build and composes the same `.x2prep-*` classes.
 */

import type { FFX2MemberBuild, FFX2PartyBuild } from '../../../battle/common/types.ts';
import type { PrepPanel, PrepPanelContext } from '../../../app/screens/PartyPrepScreen.ts';
import { dressphereStats } from '../../../battle/ffx2/dressphere-stats.ts';
import { dressphereAbbr, dressphereColour, dressphereLabel } from '../dressphereIcons.ts';
import './party-prep.css';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function ffx2Build(ctx: PrepPanelContext): FFX2PartyBuild | null {
  return ctx.chapter.buildRef.game === 'ffx2' ? ctx.chapter.buildRef : null;
}

/**
 * The Stats tab — the parity gap the critic's ranked issue 40 named
 * ("FFX-2 prep has four tabs to FFX's six"), and the one FFX tab that X-2
 * genuinely has too.
 *
 * The other two are correctly absent and stay absent: X-2 has **no Overdrive
 * modes**, and it has **no weapons or armour** — the dressphere *is* the
 * equipment and accessories are the only slots, which the Accessories tab
 * already covers. Adding an EQUIPMENT or OVERDRIVE tab to an X-2 chapter would
 * be FFX leaking into a game that does not have them.
 *
 * What this tab is *for* is the single most important stat fact in X-2
 * ([ffx2-combat-core §5.1], and the header of `battle/ffx2/dressphere-stats.ts`):
 * **a girl's stats are a function of (dressphere x level) only.** Yuna, Rikku
 * and Paine are identical in the same dressphere at the same level. A player
 * coming from FFX will assume the opposite — that the character has stats and
 * the outfit is cosmetic — and nothing in the game has ever told them
 * otherwise. So the tab prints her worn block *and* what every dressphere she
 * owns would give her, which is the same comparison §4.5.4's detail strip puts
 * on the Garment Grid, and it makes the rule self-evident.
 *
 * Read-only, like every tab here, and every number comes from the engine's own
 * `dressphereStats()` — nothing is recomputed in the UI.
 */
const STAT_ROWS: ReadonlyArray<{ key: 'maxHp' | 'maxMp' | 'str' | 'mag' | 'def' | 'mdef' | 'agi' | 'acc' | 'eva' | 'luck'; label: string }> = [
  { key: 'maxHp', label: 'HP' },
  { key: 'maxMp', label: 'MP' },
  { key: 'str', label: 'STR' },
  { key: 'mag', label: 'MAG' },
  { key: 'def', label: 'DEF' },
  { key: 'mdef', label: 'MDEF' },
  { key: 'agi', label: 'AGI' },
  { key: 'acc', label: 'ACC' },
  { key: 'eva', label: 'EVA' },
  { key: 'luck', label: 'LUCK' },
];

/** The delta chip against the worn dressphere, in §4.5.4's up/down colours. */
function deltaChip(delta: number): string {
  if (delta === 0) return '<span class="x2prep-delta x2prep-delta--same">&mdash;</span>';
  const cls = delta > 0 ? 'x2prep-delta--up' : 'x2prep-delta--down';
  return `<span class="x2prep-delta ${cls}">${delta > 0 ? '&#9650;' : '&#9660;'}${Math.abs(delta)}</span>`;
}

export function makeStatsPanel(): PrepPanel {
  let build: FFX2PartyBuild | null = null;
  let bodyEl: HTMLElement | null = null;

  const render = (memberId: string): void => {
    const member: FFX2MemberBuild | undefined = build?.members.find((m) => m.id === memberId);
    if (!bodyEl || !member) return;
    const worn = member.currentDressphere;
    const wornStats = dressphereStats(worn, member.level);

    const rows = STAT_ROWS.map(
      (r) => `<div class="x2prep-stat">
        <span class="x2prep-stat__k">${r.label}</span>
        <span class="x2prep-stat__v">${wornStats[r.key]}</span>
      </div>`,
    ).join('');

    // Every dressphere she owns, against the one she is wearing. Sorted the way
    // the build lists them so the order is stable between visits.
    const others = member.owned.filter((id) => id !== worn);
    const compare = others
      .map((id) => {
        const st = dressphereStats(id, member.level);
        const cells = STAT_ROWS.map((r) => `<span class="x2prep-cmp__cell">${deltaChip(st[r.key] - wornStats[r.key])}</span>`).join('');
        return `<div class="x2prep-cmp__row">
          <span class="x2prep-cmp__name" style="--ffx2-job:${dressphereColour(id)}"><i>${dressphereAbbr(id)}</i>${escapeHtml(dressphereLabel(id))}</span>
          ${cells}
        </div>`;
      })
      .join('');
    const head = STAT_ROWS.map((r) => `<span class="x2prep-cmp__cell">${r.label}</span>`).join('');

    bodyEl.innerHTML = `
      <div class="x2prep-line"><b>${escapeHtml(member.name)}</b> Lv ${member.level} &middot; wearing ${escapeHtml(dressphereLabel(worn))}</div>
      <div class="x2prep-stats">${rows}</div>
      ${others.length ? `<div class="x2prep-cmp"><div class="x2prep-cmp__row x2prep-cmp__row--head"><span class="x2prep-cmp__name"></span>${head}</div>${compare}</div>` : ''}
      <div class="x2prep-note x2prep-foot">The dressphere and the level are the stats &mdash; all three girls are identical in the same sphere.</div>`;
  };

  return {
    id: 'stats',
    label: 'Stats',
    game: 'ffx2',
    // After Dresspheres, which is X-2's identity tab, and before Accessories.
    order: 10,
    fullScreen: false,
    mount(root, ctx: PrepPanelContext) {
      build = ffx2Build(ctx);
      // `--stack`: full-width rows, not `.x2prep`'s two columns — see the CSS.
      root.innerHTML = '<div class="x2prep x2prep--stack"></div>';
      bodyEl = root.querySelector('.x2prep');
      render(ctx.memberId);
    },
    unmount() {
      build = null;
      bodyEl = null;
    },
    selectMember: render,
  };
}
