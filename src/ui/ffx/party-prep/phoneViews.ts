/**
 * PR-0295, PREP-A: the phone page of the four FFX prep tabs that are not CHAPTER or SPHERE GRID (FFX only; FFX-2's
 * own four are `src/ui/ffx2/party-prep/phoneViews.ts`). Each view is a pure function of the build the panel already
 * holds, so the phone page can never print a number the desktop sheet does not: the same `effectiveStats()` rows, the
 * same `autoAbilityLabel()` names, the same `itemLabel()` registry lookup. Nothing here is invented game data.
 *
 * The panels (`panels.ts`) draw their desktop markup unchanged and add the view's markup in a hidden host beside it;
 * the stylesheet decides which one a window shows (`prep-phone-sections.css`, `prep-phone-parts.css`).
 */

import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { effectiveStats, type EffectiveStatKey, type EffectiveStatRow } from '../../../battle/ffx/effectiveStats.ts';
import { escapeHtml } from '../../common/html.ts';
import { partyRole } from '../../common/party-roles.ts';
import {
  emptyHtml,
  itemRowHtml,
  noteHtml,
  sectionHtml,
  slotRowHtml,
  statRowHtml,
  whoHtml,
} from '../../common/prepPhoneKit.ts';
import { isOpen } from '../../common/prepPhoneFold.ts';
import { itemLabel } from '../../common/resultsMath.ts';
import { autoAbilityLabel } from './autoAbilityLabels.ts';
import { MODE_BLURB, OVERDRIVE_NAME, modeLabel } from './overdriveText.ts';

/** What the page remembers of each section: open or folded, by key (`prepPhoneFold.readOpen`). */
export type OpenState = ReadonlyMap<string, boolean>;

/** The line under the Stats page; the same words as the desktop sheet's (a test holds the two together). */
export const STATS_NOTE = 'Equipment grants auto-abilities, not stat points: HP/MP +% raise the pool, the rest apply in the damage chain.';

/**
 * Where a row's equipment percentage lands, as words: a pool bonus already moved the number beside it, a damage or
 * mitigation bonus is a step of the damage chain that never touches the stat [ffx-combat-core §9, §2.4].
 */
export function statBonusText(row: EffectiveStatRow): string {
  if (row.bonusPercent === 0) return '';
  if (row.kind === 'mitigation') return `−${row.bonusPercent}% taken`;
  return `+${row.bonusPercent}%${row.kind === 'damage' ? ' dmg' : ''}`;
}

/** The member's name line: name, S.Lv and the archetype tag the party slots print. */
export function ffxWhoHtml(m: FFXMemberBuild): string {
  return whoHtml({ name: m.name, levelLabel: 'S.LV', level: m.sphereGrid.sLv, role: partyRole(m.id) });
}

// ------------------------------------------------------------------- Stats

const SHORT: Record<EffectiveStatKey, string> = {
  maxHp: 'HP',
  maxMp: 'MP',
  str: 'STR',
  def: 'DEF',
  mag: 'MAG',
  mdef: 'MDEF',
  agi: 'AGI',
  luck: 'LUCK',
  eva: 'EVA',
  acc: 'ACC',
};

/** The ten stats in four groups; the first two open, the last two folded to a line of their numbers. */
const STAT_GROUPS: ReadonlyArray<{ key: string; label: string; keys: readonly EffectiveStatKey[]; open: boolean }> = [
  { key: 'pool', label: 'HP · MP', keys: ['maxHp', 'maxMp'], open: true },
  { key: 'attack', label: 'ATTACK', keys: ['str', 'mag'], open: true },
  { key: 'defense', label: 'DEFENSE', keys: ['def', 'mdef'], open: false },
  { key: 'speed', label: 'SPEED & AIM', keys: ['agi', 'luck', 'eva', 'acc'], open: false },
];

/** The Stats tab: HP and MP, attack, defense, speed and aim as folding sections, then the note on what gear does. */
export function ffxStatsPhoneHtml(member: FFXMemberBuild, open: OpenState): string {
  const { byKey } = effectiveStats(member);
  const sections = STAT_GROUPS.map((g) =>
    sectionHtml({
      key: g.key,
      label: g.label,
      digest: g.keys.map((k) => `${SHORT[k]} ${byKey[k].effective}`).join(' · '),
      open: isOpen(open, g.key, g.open),
      body: g.keys
        .map((k) => {
          const r = byKey[k];
          return statRowHtml({
            label: r.label.toUpperCase(),
            ...(r.effective !== r.base ? { base: r.base } : {}),
            value: r.effective,
            bonus: statBonusText(r),
          });
        })
        .join(''),
    }),
  ).join('');
  return ffxWhoHtml(member) + sections + noteHtml(STATS_NOTE);
}

// --------------------------------------------------------------- Equipment

/** The percentage families of `AutoAbilityId` (`strength-10`, `magic-def-5`, `hp-30`) and the stat row each one feeds. */
const FAMILY_ROW: Record<string, EffectiveStatKey> = {
  strength: 'str',
  magic: 'mag',
  defense: 'def',
  'magic-def': 'mdef',
  hp: 'maxHp',
  mp: 'maxMp',
};

/** What one auto-ability does for the wearer, from the same rows the Stats tab prints; undefined when it touches no stat. */
export function slotEffectText(byKey: Record<EffectiveStatKey, EffectiveStatRow>, abilityId: string): string | undefined {
  const m = /^(strength|magic-def|magic|defense|hp|mp)-(\d+)$/.exec(abilityId);
  const key = m ? FAMILY_ROW[m[1]!] : undefined;
  if (!m || !key) return undefined;
  const row = byKey[key];
  if (row.kind === 'pool') return `${SHORT[key]} ${row.base} → ${row.effective}`;
  return `${SHORT[key]} ${row.effective} · ${row.kind === 'mitigation' ? `−${m[2]}% taken` : `+${m[2]}% dmg`}`;
}

/** The Equipment tab: the weapon and the armour as two sections, each with every slot drawn, filled or empty. */
export function ffxEquipmentPhoneHtml(member: FFXMemberBuild, open: OpenState): string {
  const { byKey } = effectiveStats(member);
  const piece = (key: string, label: string, def: FFXMemberBuild['equipment']['weapon']): string => {
    const filled = def.autoAbilities.map((id) => ({ name: autoAbilityLabel(id), effect: slotEffectText(byKey, id) }));
    const empty = Math.max(0, def.slots - filled.length);
    return sectionHtml({
      key,
      label,
      aside: `${filled.length} OF ${Math.max(def.slots, filled.length)} SLOTS`,
      title: def.name,
      digest: filled.length ? filled.map((f) => f.name).join(' · ') : 'No abilities',
      open: isOpen(open, key, true),
      body:
        filled.map((f) => slotRowHtml({ label: f.name, filled: true, ...(f.effect ? { effect: f.effect } : {}) })).join('') +
        Array.from({ length: empty }, () => slotRowHtml({ label: 'empty', filled: false })).join(''),
    });
  };
  return ffxWhoHtml(member) + piece('weapon', 'WEAPON', member.equipment.weapon) + piece('armor', 'ARMOR', member.equipment.armor);
}

// ------------------------------------------------------------------- Items

/** The Items tab: the party bag, one section, one row a kind. Party-wide, so no name line. */
export function ffxItemsPhoneHtml(build: FFXPartyBuild | null, open: OpenState): string {
  if (!build || !build.inventory.length) return emptyHtml('No items.');
  const kinds = build.inventory.length;
  const total = build.inventory.reduce((n, e) => n + e.count, 0);
  return sectionHtml({
    key: 'items',
    label: 'ITEMS',
    aside: `${kinds} KIND${kinds === 1 ? '' : 'S'}`,
    digest: `${total} IN THE BAG`,
    open: isOpen(open, 'items', true),
    body: build.inventory.map((e) => itemRowHtml(itemLabel(e.itemId), e.count)).join(''),
  });
}

// --------------------------------------------------------------- Overdrive

/** The Overdrive tab: the move's name, and one tappable row per unlocked mode with the equipped one marked. */
export function ffxOverdrivePhoneHtml(member: FFXMemberBuild, open: OpenState): string {
  const mode = member.overdrive.mode;
  const rows = member.overdrive.unlockedModes
    .map((m) => {
      const on = m === mode;
      return (
        `<div class="prph-mode${on ? ' is-sel' : ''}" role="button" tabindex="0" aria-pressed="${on ? 'true' : 'false'}" data-mode="${escapeHtml(m)}">` +
        `<span class="prph-mode__name">${escapeHtml(modeLabel(m))}</span>${on ? '<span class="prph-mode__tag">EQUIPPED</span>' : ''}</div>`
      );
    })
    .join('');
  const blurb = MODE_BLURB[mode] ?? '';
  const n = member.overdrive.unlockedModes.length;
  return (
    ffxWhoHtml(member) +
    sectionHtml({
      key: 'overdrive',
      label: 'OVERDRIVE',
      aside: `${n} MODE${n === 1 ? '' : 'S'}`,
      title: OVERDRIVE_NAME[member.id] ?? 'Overdrive',
      digest: `${modeLabel(mode)} equipped`,
      open: isOpen(open, 'overdrive', true),
      body: `<div class="prph-modes">${rows}</div>${blurb ? `<p class="prph-blurb">${escapeHtml(blurb)}</p>` : ''}`,
    })
  );
}
