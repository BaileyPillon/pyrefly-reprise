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

import type { AnyPartyBuild, FFX2PartyBuild, FFXPartyBuild } from '../../battle/common/types.ts';
import { Ff7NotHandledError } from '../../battle/common/game.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { partyFaceHtml, type PartyFaceMember } from '../../ui/common/partyFace.ts';
import { partyRole } from '../../ui/common/party-roles.ts';

type PartyBuild = FFXPartyBuild | FFX2PartyBuild;

/** Prep is FFX and FFX-2 only: the FF7 experiment has no prep screen (audit), so an FF7 build throws here. */
function prepBuild(build: AnyPartyBuild): PartyBuild {
  if (build.game === 'ff7') throw new Ff7NotHandledError('party prep (FF7 has no prep screen)');
  return build;
}

/**
 * A portrait cropped to the head with its initial underneath, so a missing
 * file still reads. The crop comes from `portrait.ts`, which is what keeps
 * seven separately-painted heads at one scale on one eye line.
 *
 * The lookup itself goes through {@link partyFaceHtml}, the same
 * dressphere/`-x2`-aware ladder the pause screen's party strip and the
 * battle HUD's rows already climb — this screen used to ask only
 * `portraits/<id>.png`, which is right for FFX but was the LIVE-A2-1 gap for
 * FFX-2: Rikku and Paine both had painted art one name over
 * (`docs/handoff/fix3-ffx2-hud-prep.md`).
 */
export function faceHtml(m: PartyFaceMember): string {
  return `<span>${escapeHtml(m.name.charAt(0).toUpperCase())}</span>${partyFaceHtml(m)}`;
}

/**
 * The roster column: every member the chapter lets the player look at. `artNamespace`: the chapter's art namespace
 * (`data/art/artNamespace.ts`, the experimental Leblanc chapter), so each face is the head of the namespaced painting.
 */
export function rosterHtml(anyBuild: AnyPartyBuild, selected: number, artNamespace?: string): string {
  const build = prepBuild(anyBuild);
  const levels =
    build.game === 'ffx'
      ? build.members.map((m) => `S.LV ${m.sphereGrid.sLv}`)
      : build.members.map((m) => `LV ${m.level}`);
  // Branched here, not read off `m` inside the shared `.map` below: `build`
  // narrows on `build.game`, but `build.members`' element type was already
  // fixed to the union the moment `.map` was called on it, so `m` never
  // narrows to `FFX2MemberBuild` no matter what is checked inside.
  const dresspheres: Array<string | undefined> =
    build.game === 'ffx2' ? build.members.map((m) => m.currentDressphere) : build.members.map(() => undefined);
  return build.members
    .map((m, i) => {
      // Each row steps 10px (1440 grid) further right than the one above.
      const indent = (i * 10) / 2.25;
      return `
          <div class="prep__member${i === selected ? ' prep__member--sel' : ''}"
               data-action="prep:member-${i}" role="button" tabindex="0"
               style="margin-left:${indent.toFixed(2)}px">
            <div class="prep__face">${faceHtml({ id: m.id, name: m.name, dressphere: dresspheres[i], ...(artNamespace ? { artNamespace } : {}) })}</div>
            <span class="prep__member-name">${escapeHtml(m.name)}</span>
            <span class="prep__member-lv">${levels[i] ?? ''}</span>
          </div>
        `;
    })
    .join('');
}

/** The three who actually walk in, along the bottom (`artNamespace` as in {@link rosterHtml}). */
export function slotsHtml(anyBuild: AnyPartyBuild, artNamespace?: string): string {
  const build = prepBuild(anyBuild);
  type Slot = { id: string; name: string; sub: string; role: string | undefined; dressphere?: string };
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
          dressphere: m.currentDressphere,
        }));

  return slots
    .map(
      (s) => `
          <div class="prep__slot">
            <div class="prep__face">${faceHtml({ id: s.id, name: s.name, dressphere: s.dressphere, ...(artNamespace ? { artNamespace } : {}) })}</div>
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
export function statSheetHtml(anyBuild: AnyPartyBuild, member: number): string {
  const build = prepBuild(anyBuild);
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
