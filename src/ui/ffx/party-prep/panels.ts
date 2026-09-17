import type { FFXMemberBuild, FFXPartyBuild, OverdriveModeId } from '../../../battle/common/types.ts';
import type { EffectiveStatRow } from '../../../battle/ffx/effectiveStats.ts';
import { effectiveStats } from '../../../battle/ffx/effectiveStats.ts';
import type { PrepPanel, PrepPanelContext } from '../../../app/screens/PartyPrepScreen.ts';

/**
 * The Party / Equipment / Items / Overdrive-modes tabs: four small composing
 * `PrepPanel`s (`fullScreen: false`) that draw only into the shell's ivory
 * sheet body — `PartyPrepScreen` owns the backdrop, roster column, tab strip,
 * active-party slots and START BATTLE button (`docs/screenshots/
 * 35-inkgold-party-prep.png`, `src/ui/common/party-prep.css`). Each panel
 * reads `--ig-*` custom properties for colour/type rather than declaring any
 * bare `.ig-*` selector of its own [CONTRACT-CHANGES decision 10].
 *
 * `mount()` fires once per party-prep *visit* (a fresh `PartyPrepScreen` per
 * chapter re-mounts every panel), so each factory captures the build fresh
 * at `mount()` rather than taking one at module-load time; `selectMember`
 * only ever receives an id, so that captured build is what turns it back
 * into an `FFXMemberBuild`.
 */

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function ffxBuild(ctx: PrepPanelContext): FFXPartyBuild | null {
  return ctx.chapter.buildRef.game === 'ffx' ? ctx.chapter.buildRef : null;
}

// ------------------------------------------------------------------- Party

/**
 * The chip that says where a row's equipment percentage actually lands.
 *
 * `effectiveStats` hands back a `kind` precisely so this layer doesn't have
 * to know §9's rules: a `pool` bonus already moved the number to its left
 * (so the chip is just the percentage), while `damage`/`mitigation` bonuses
 * are damage-chain steps that never touch the stat, and say so
 * [ffx-combat-core §9, §2.4].
 */
function bonusChip(row: EffectiveStatRow): string {
  if (row.bonusPercent === 0) return '';
  const text =
    row.kind === 'mitigation'
      ? `&minus;${row.bonusPercent}% taken`
      : `+${row.bonusPercent}%${row.kind === 'damage' ? ' dmg' : ''}`;
  return `<span class="ffxprep-stat__bonus">${text}</span>`;
}

/**
 * The Stats tab: the selected member's full stat block, two columns, with
 * equipment folded in by `effectiveStats()` [ffx-combat-core §9].
 *
 * The tab does not compute any of this itself — `docs/CONTRACTS.md`'s
 * layering rule keeps stat maths in `src/battle/ffx` — it renders the pure
 * `EffectiveStatRow`s that module exports (the "revisit if `src/battle/ffx`
 * ever exports a pure `effectiveStats(member)`" this comment used to carry).
 *
 * What that buys the display: HP/MP show `base -> effective` because the
 * `hp-N`/`mp-N` families genuinely raise the pool, while Strength / Magic /
 * Defense / Magic Def show their *unchanged* Sphere Grid value next to the
 * percentage, because §9 is explicit that Strength +10 % "does not raise the
 * Strength stat". Printing an invented "effective Strength" would be wrong
 * by a wide margin — the `strength` POWER term is cubic (§2.2), so 31 -> 34
 * reads as roughly +31 % damage, not the +10 % the gear grants.
 */
export function makeStatsPanel(): PrepPanel {
  let build: FFXPartyBuild | null = null;
  let gridEl: HTMLElement | null = null;

  const render = (memberId: string): void => {
    const member = build?.members.find((m) => m.id === memberId);
    if (!gridEl || !member) return;
    gridEl.innerHTML = effectiveStats(member)
      .rows.map((row) => {
        const raised = row.effective !== row.base;
        return `
        <div class="ffxprep-stat${row.bonusPercent > 0 ? ' ffxprep-stat--boosted' : ''}">
          <span class="ffxprep-stat__k">${row.label.toUpperCase()}</span>
          <span class="ffxprep-stat__vs">${
            raised ? `<span class="ffxprep-stat__base">${row.base}</span>` : ''
          }<span class="ffxprep-stat__v">${row.effective}</span>${bonusChip(row)}</span>
        </div>`;
      })
      .join('');
  };

  return {
    id: 'stats',
    label: 'Stats',
    game: 'ffx',
    order: 0,
    fullScreen: false,
    mount(root, ctx: PrepPanelContext) {
      build = ffxBuild(ctx);
      // The legend sits outside the 2-column grid so it spans full width and
      // doesn't shift the grid's own `:nth-last-child` border-stripping rule.
      root.innerHTML =
        '<div class="ffxprep-stats"></div>' +
        '<div class="ffxprep-stats__note">Equipment grants auto-abilities, not stat points: HP/MP&thinsp;+% raise the pool, the rest apply in the damage chain.</div>';
      gridEl = root.querySelector('.ffxprep-stats');
      render(ctx.memberId);
    },
    unmount() {
      build = null;
      gridEl = null;
    },
    selectMember: render,
  };
}

// --------------------------------------------------------------- Equipment

/** The Equipment tab: weapon/armor names and their auto-ability chips. Read-only — an FFXPartyBuild carries no spare-gear pool to re-equip from, only what is already worn. */
export function makeEquipmentPanel(): PrepPanel {
  let build: FFXPartyBuild | null = null;
  let bodyEl: HTMLElement | null = null;

  const render = (memberId: string): void => {
    const member = build?.members.find((m) => m.id === memberId);
    if (!bodyEl || !member) return;
    const gear = (label: string, def: FFXMemberBuild['equipment']['weapon']): string => `
      <div class="ffxprep-gear">
        <div class="ffxprep-gear__name"><b>${label}</b> ${escapeHtml(def.name)}</div>
        <div class="ffxprep-chips">${
          def.autoAbilities.length
            ? def.autoAbilities.map((a) => `<span class="ffxprep-chip">${escapeHtml(a)}</span>`).join('')
            : '<span class="ffxprep-chip ffxprep-chip--empty">—</span>'
        }</div>
      </div>`;
    bodyEl.innerHTML = gear('Weapon', member.equipment.weapon) + gear('Armor', member.equipment.armor);
  };

  return {
    id: 'equipment',
    label: 'Equipment',
    game: 'ffx',
    order: 20,
    fullScreen: false,
    mount(root, ctx: PrepPanelContext) {
      build = ffxBuild(ctx);
      root.innerHTML = '<div class="ffxprep-equipment"></div>';
      bodyEl = root.querySelector('.ffxprep-equipment');
      render(ctx.memberId);
    },
    unmount() {
      build = null;
      bodyEl = null;
    },
    selectMember: render,
  };
}

// ------------------------------------------------------------------- Items

/** The Items tab: party-wide inventory counts — not per-member, so it ignores `selectMember`. */
export function makeItemsPanel(): PrepPanel {
  return {
    id: 'items',
    label: 'Items',
    game: 'ffx',
    order: 30,
    fullScreen: false,
    mount(root, ctx: PrepPanelContext) {
      const build = ffxBuild(ctx);
      if (!build || !build.inventory.length) {
        root.innerHTML = '<div class="ffxprep-empty">No items.</div>';
        return;
      }
      root.innerHTML = `<div class="ffxprep-items">${build.inventory
        .map((entry) => `<div class="ffxprep-item-row"><span>${escapeHtml(entry.itemId)}</span><span class="ffxprep-item-row__qty">×${entry.count}</span></div>`)
        .join('')}</div>`;
    },
  };
}

// --------------------------------------------------------------- Overdrive

/**
 * Static per-character Overdrive move name (visual-bible §5.4's STATS tab:
 * "the character's Overdrive name ... all verified from the wiki
 * infoboxes"). A display label only — Lulu's is the `'fury'` menu marker
 * that expands into her learned `<spell>-fury` ids at battle time
 * [CONTRACT-CHANGES decision 9], never something this tab could derive from
 * `unlockedOverdriveIds` (which for her is 19 spell-tier ids, not one name).
 */
const OVERDRIVE_NAME: Record<string, string> = {
  tidus: 'Swordplay',
  yuna: 'Grand Summon',
  auron: 'Bushido',
  wakka: 'Slots',
  lulu: 'Fury',
  kimahri: 'Ronso Rage',
  rikku: 'Mix',
};

const MODE_BLURB: Partial<Record<OverdriveModeId, string>> = {
  stoic: 'Charges from damage taken.',
  warrior: 'Charges from damage dealt.',
  comrade: "Charges when an ally takes damage.",
  healer: 'Charges from healing allies.',
  tactician: 'Charges from inflicting a status.',
  victim: 'Charges from being inflicted with a status.',
  dancer: 'Charges from evading an attack.',
  avenger: "Charges when an ally is KO'd.",
  slayer: 'Charges from a kill.',
  hero: 'Charges from a big kill.',
  rook: 'Charges from blocking damage.',
  victor: 'Charges just from winning.',
  coward: 'Charges from escaping.',
  ally: "Charges at the start of the user's turn.",
  sufferer: 'Charges each turn while afflicted.',
  daredevil: 'Charges each turn while in Critical.',
  loner: 'Charges each turn while fighting alone.',
};

/** The Overdrive tab: the character's Overdrive move name, plus mode selection. */
export function makeOverdrivePanel(): PrepPanel {
  let build: FFXPartyBuild | null = null;
  let bodyEl: HTMLElement | null = null;
  let currentMemberId = '';

  const render = (memberId: string): void => {
    currentMemberId = memberId;
    const member = build?.members.find((m) => m.id === memberId);
    if (!bodyEl || !member) return;
    const moveName = OVERDRIVE_NAME[member.id] ?? 'Overdrive';
    const rows = member.overdrive.unlockedModes
      .map((mode) => {
        const selected = mode === member.overdrive.mode;
        return `<div class="ffxprep-mode-row${selected ? ' ffxprep-mode-row--selected' : ''}" data-mode="${mode}">
          <span class="ffxprep-mode-row__name">${escapeHtml(mode)}</span>
          ${selected ? '<span class="ffxprep-mode-row__tag">EQUIPPED</span>' : ''}
        </div>`;
      })
      .join('');
    bodyEl.innerHTML = `
      <div class="ffxprep-od-name"><b>${escapeHtml(moveName)}</b></div>
      <div class="ffxprep-mode-list">${rows}</div>
      <div class="ffxprep-mode-blurb">${escapeHtml(MODE_BLURB[member.overdrive.mode] ?? '')}</div>
    `;
    bodyEl.querySelectorAll<HTMLElement>('[data-mode]').forEach((row) => {
      row.addEventListener('click', () => {
        const mode = row.dataset['mode'] as OverdriveModeId;
        if (member.overdrive.unlockedModes.includes(mode)) member.overdrive.mode = mode;
        render(currentMemberId);
      });
    });
  };

  return {
    id: 'overdrive',
    label: 'Overdrive',
    game: 'ffx',
    order: 40,
    fullScreen: false,
    mount(root, ctx: PrepPanelContext) {
      build = ffxBuild(ctx);
      root.innerHTML = '<div class="ffxprep-overdrive"></div>';
      bodyEl = root.querySelector('.ffxprep-overdrive');
      render(ctx.memberId);
    },
    unmount() {
      build = null;
      bodyEl = null;
    },
    selectMember: render,
  };
}
