/**
 * The markup `PartyPrepScreen` draws into its Ink & Gold frame: the roster
 * column, the three field slots and the fallback stat sheet.
 *
 * Split out of `PartyPrepScreen.ts` (which was over 400 lines) because none of
 * it touches screen state — every function here is a pure `build -> HTML`
 * transform, which also makes the crop and the ledger testable without
 * mounting a screen. Class names, `data-action` names and row order are
 * unchanged from the approved board; the shell still owns the cursor.
 */

import type { FFX2PartyBuild, FFXPartyBuild } from '../../battle/common/types.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { faceImgHtml } from '../../ui/common/portrait.ts';
import { partyRole } from '../../ui/common/party-roles.ts';

type PartyBuild = FFXPartyBuild | FFX2PartyBuild;

/**
 * A portrait cropped to the head with its initial underneath, so a missing
 * file still reads. The crop comes from `portrait.ts`, which is what keeps
 * seven separately-painted heads at one scale on one eye line.
 */
export function faceHtml(id: string, name: string): string {
  return `<span>${escapeHtml(name.charAt(0).toUpperCase())}</span>${faceImgHtml(id, '')}`;
}

/** The roster column: every member the chapter lets the player look at. */
export function rosterHtml(build: PartyBuild, selected: number): string {
  const levels =
    build.game === 'ffx'
      ? build.members.map((m) => `S.LV ${m.sphereGrid.sLv}`)
      : build.members.map((m) => `LV ${m.level}`);
  return build.members
    .map((m, i) => {
      // Each row steps 10px (1440 grid) further right than the one above.
      const indent = (i * 10) / 2.25;
      return `
          <div class="prep__member${i === selected ? ' prep__member--sel' : ''}"
               data-action="prep:member-${i}" role="button" tabindex="0"
               style="margin-left:${indent.toFixed(2)}px">
            <div class="prep__face">${faceHtml(m.id, m.name)}</div>
            <span class="prep__member-name">${escapeHtml(m.name)}</span>
            <span class="prep__member-lv">${levels[i] ?? ''}</span>
          </div>
        `;
    })
    .join('');
}

/** The three who actually walk in, along the bottom. */
export function slotsHtml(build: PartyBuild): string {
  type Slot = { id: string; name: string; sub: string; role: string | undefined };
  const slots: Slot[] =
    build.game === 'ffx'
      ? build.activeSlots.flatMap((id) => {
          const m = build.members.find((x) => x.id === id);
          if (!m) return [];
          return [
            {
              id: m.id,
              name: m.name,
              sub: `HP ${m.hp}/${m.stats.maxHp} &middot; MP ${m.mp}/${m.stats.maxMp}`,
              role: partyRole(m.id),
            },
          ];
        })
      : // FFX-2 needs no archetype map: a girl's job is her dressphere.
        build.members.map((m) => ({
          id: m.id,
          name: m.name,
          sub: `LV ${m.level} &middot; ${m.owned.length} DRESSPHERES`,
          role: m.currentDressphere.replace(/-/g, ' '),
        }));

  return slots
    .map(
      (s) => `
          <div class="prep__slot">
            <div class="prep__face">${faceHtml(s.id, s.name)}</div>
            <div>
              <div class="prep__slot-name">${escapeHtml(s.name)}</div>
              <div class="prep__slot-sub">${s.sub}</div>
            </div>
            ${s.role ? `<div class="prep__slot-role">${escapeHtml(s.role.toUpperCase())}</div>` : ''}
          </div>
        `,
    )
    .join('');
}

/**
 * The selected member's sheet, two columns of key/value rows — what the
 * approved board shows when no panel has claimed the slab. FFX reads a
 * `StatBlock`; FFX-2 has none (stats there are a function of dressphere x
 * level), so it reports what a girl actually carries in.
 *
 * `[label, value, isWord?]` — `isWord` sets the value in the serif, for a
 * dressphere name rather than a number.
 */
export function statSheetHtml(build: PartyBuild, member: number): string {
  let rows: Array<[string, string, boolean?]>;

  if (build.game === 'ffx') {
    const m = build.members[member];
    if (!m) return '';
    const st = m.stats;
    rows = [
      ['HP', String(st.maxHp)],
      ['MP', String(st.maxMp)],
      ['STRENGTH', String(st.str)],
      ['DEFENSE', String(st.def)],
      ['MAGIC', String(st.mag)],
      ['MAGIC DEF', String(st.mdef)],
      ['AGILITY', String(st.agi)],
      ['LUCK', String(st.luck)],
      ['EVASION', String(st.eva)],
      ['ACCURACY', String(st.acc)],
    ];
  } else {
    const m = build.members[member];
    if (!m) return '';
    rows = [
      ['LEVEL', String(m.level)],
      ['DRESSPHERE', m.currentDressphere.replace(/-/g, ' '), true],
      ['HP', m.hp === undefined ? 'Full' : String(m.hp)],
      ['MP', m.mp === undefined ? 'Full' : String(m.mp)],
      ['DRESSPHERES', String(m.owned.length)],
      ['ACCESSORIES', String(m.accessories.length)],
    ];
  }

  // The grid fills row-major two at a time, so the final pair is the last
  // row of both columns; those close the block instead of ruling under it.
  return rows
    .map(([k, v, isWord], i) => {
      const last = i >= rows.length - 2 ? ' prep__stat--last' : '';
      const vClass = isWord === true ? 'prep__stat-v prep__stat-v--text' : 'prep__stat-v';
      return `<div class="prep__stat${last}">
            <span class="prep__stat-k">${k}</span>
            <span class="${vClass}">${escapeHtml(v.toUpperCase())}</span>
          </div>`;
    })
    .join('');
}
