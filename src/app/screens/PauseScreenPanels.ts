/**
 * The markup `PauseScreen` draws into its frame: the bottom party cards, the
 * PARTY tab's character close-ups, and the OPTIONS rows.
 *
 * Split out of `PauseScreen.ts` for the same reason `PartyPrepContent.ts` is
 * split out of `PartyPrepScreen.ts` — none of it touches screen state. Every
 * function here is a pure `data -> HTML` transform, which keeps the screen
 * itself about input and lifecycle, and lets the copy and the numbers be
 * asserted on without mounting anything.
 */

import type { AnyCombatant, BattleState, CombatantId } from '../../battle/common/types.ts';
import type { Settings } from '../SaveData.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { faceImgHtml } from '../../ui/common/portrait.ts';

/**
 * Where a character's pause-screen close-up lives.
 *
 * The brief's `public/art/pause/<id>.png` — an expressive, painted portrait
 * framed much tighter than the CTB face. None of these exist yet (art
 * generation is deferred and local, per `docs/handoff/pause-screen.md`), so
 * every consumer pairs this with a `data-fallback` pointing at the shipped
 * portrait and calls `wireImageFallbacks`.
 */
export function pauseArtUrl(id: string): string {
  return artUrl(`art/pause/${id}.png`);
}

/** The shipped portrait, which every close-up falls back to. */
export function portraitFallbackUrl(id: string): string {
  return artUrl(`art/portraits/${id}.png`);
}

/** A combatant's Overdrive gauge, 0–100, or null when it has none. */
export function overdriveGauge(c: AnyCombatant | undefined): number | null {
  if (!c || !('overdrive' in c) || !c.overdrive) return null;
  return Math.max(0, Math.min(100, c.overdrive.gauge));
}

/**
 * The character's initial, drawn *behind* the portrait.
 *
 * `faceImgHtml` carries `onerror="this.remove()"`, so a member with no
 * `portraits/<id>.png` leaves an empty tile — and three of the FFX-2 portraits
 * currently ship as all-black renders, which looks identical to an empty tile.
 * A letter underneath means the card still says who it is either way. Same
 * device as `PartyPrepContent.faceHtml`, which is where the pattern comes from.
 */
function initialHtml(name: string): string {
  return `<span>${escapeHtml(name.charAt(0).toUpperCase())}</span>`;
}

function bar(className: string, ratio: number): string {
  const pct = (Math.max(0, Math.min(1, ratio)) * 100).toFixed(1);
  return `<span class="${className}"><span class="${className}-fill" style="width:${pct}%"></span></span>`;
}

/**
 * The live party cards along the bottom of the pause frame.
 *
 * Reads the *active* slots rather than the whole roster: these are the three
 * who are standing on the field right now, and their numbers are the ones the
 * player paused to look at. A KO'd member keeps their card and gets a class,
 * because a missing card would read as "who was the third one again".
 */
export function partyCardsHtml(state: Readonly<BattleState> | null): string {
  if (!state) return '';
  return state.activeIds
    .map((id: CombatantId) => {
      const c = state.combatants[id];
      if (!c) return '';
      const od = overdriveGauge(c);
      const maxHp = Math.max(1, c.stats.maxHp);
      const maxMp = Math.max(1, c.stats.maxMp);
      return `
      <div class="pause__card${c.alive ? '' : ' pause__card--ko'}">
        <div class="pause__card-face">${initialHtml(c.name)}${faceImgHtml(c.id, '')}</div>
        <div class="pause__card-body">
          <div class="pause__card-name">${escapeHtml(c.name)}</div>
          <div class="pause__card-nums">
            <span class="pause__card-hp">${c.hp}<i>/${c.stats.maxHp}</i></span>
            <span class="pause__card-mp">${c.mp}<i>/${c.stats.maxMp}</i></span>
          </div>
          ${bar('pause__card-bar', c.hp / maxHp)}
          ${bar('pause__card-bar pause__card-bar--mp', c.mp / maxMp)}
        </div>
        ${
          od === null
            ? ''
            : `<div class="pause__card-od"><span class="pause__card-od-label">OD</span>${bar(
                'pause__card-odbar',
                od / 100,
              )}</div>`
        }
      </div>`;
    })
    .join('');
}

/**
 * The PARTY tab: one close-up per active member with the numbers the prep
 * menu would show, so a player can check a build without leaving the fight.
 *
 * FFX prints `S.LV` (the Sphere Grid level that is this game's progression)
 * and the two equipment slots; FFX-2 has neither, so it prints `LV` and the
 * worn dressphere instead. Neither branch invents a row the other game does
 * not have — an empty `EQUIPMENT --` would be a lie about FFX-2's rules.
 */
export function partyTabHtml(state: Readonly<BattleState> | null): string {
  if (!state) return '<div class="pause__empty">No party on the field.</div>';
  const cards = state.activeIds
    .map((id) => {
      const c = state.combatants[id];
      if (!c) return '';
      const rows: Array<[string, string]> = [];

      // `AnyCombatant` is a union with no tag of its own, so the shape is the
      // discriminator: only an `FFXCombatant` has `sphereGrid`/`equipment`/
      // `overdrive`, and only an `FFX2Combatant` has `level`/`dresspheres`.
      if ('sphereGrid' in c && c.sphereGrid) rows.push(['S.LV', String(c.sphereGrid.sLv)]);
      else if ('level' in c) rows.push(['LV', String(c.level)]);

      rows.push(['HP', `${c.hp} / ${c.stats.maxHp}`]);
      rows.push(['MP', `${c.mp} / ${c.stats.maxMp}`]);
      rows.push(['STR', String(c.stats.str)], ['MAG', String(c.stats.mag)]);
      rows.push(['DEF', String(c.stats.def)], ['AGI', String(c.stats.agi)]);

      if ('equipment' in c && c.equipment) {
        rows.push(['WEAPON', c.equipment.weapon.name], ['ARMOR', c.equipment.armor.name]);
      }
      if ('overdrive' in c && c.overdrive) {
        rows.push(['OVERDRIVE', c.overdrive.mode.replace(/-/g, ' ')]);
      }
      if ('dresspheres' in c && c.dresspheres) {
        rows.push(['DRESSPHERE', c.dresspheres.current.replace(/-/g, ' ')]);
      }

      const statuses = Object.keys(c.statuses);
      return `
      <div class="pause__member">
        <img class="pause__member-art" alt="" src="${pauseArtUrl(c.id)}" data-fallback="${portraitFallbackUrl(c.id)}">
        <div class="pause__member-info">
          <div class="pause__member-name">${escapeHtml(c.name)}</div>
          <div class="pause__member-rows">
            ${rows
              .map(
                ([k, v]) =>
                  `<div class="pause__member-row"><span class="pause__member-k">${escapeHtml(
                    k,
                  )}</span><span class="pause__member-v">${escapeHtml(v.toUpperCase())}</span></div>`,
              )
              .join('')}
          </div>
          ${
            statuses.length
              ? `<div class="pause__member-statuses">${statuses
                  .map((s) => `<span class="pause__status">${escapeHtml(s.toUpperCase())}</span>`)
                  .join('')}</div>`
              : ''
          }
        </div>
      </div>`;
    })
    .join('');
  return `<div class="pause__members">${cards}</div>`;
}

// ------------------------------------------------------------------ options

/** One adjustable setting on the OPTIONS tab. */
export interface OptionRow {
  id: string;
  label: string;
  /** What the row currently reads. */
  value: string;
  /** 0..1 for the rows that draw a meter; null for the word-valued ones. */
  ratio: number | null;
}

/** Volume steps. Ten notches is what a player can actually aim at with a d-pad. */
export const VOLUME_STEP = 0.1;
/** Text speed runs 0.5x (slow) to 2x (fast) in quarter steps. */
export const TEXT_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
/**
 * Ends of {@link TEXT_SPEEDS}, named so the meter maths needs no index.
 *
 * Spelled out rather than read off the array: `noUncheckedIndexedAccess` makes
 * every index a `T | undefined`, and a literal that the array's own type pins
 * is both honest and checkable — if someone reorders `TEXT_SPEEDS` the
 * assertion below stops compiling.
 */
export const TEXT_SPEED_MIN: (typeof TEXT_SPEEDS)[0] = 0.5;
export const TEXT_SPEED_MAX: (typeof TEXT_SPEEDS)[5] = 2;

/**
 * The OPTIONS rows, read out of the live {@link Settings}.
 *
 * Exactly the four groups the brief asks for — volume, text speed, the FFX-2
 * Active/Wait toggle, and whether the strategy guide starts visible — and
 * nothing else. `SaveData.Settings` carries more than this (`lowEffects`,
 * `reduceMotion`, `skipSeenCutscenes`); those belong to a settings screen, not
 * to a menu the player opened mid-fight.
 */
export function optionRows(settings: Readonly<Settings>): OptionRow[] {
  const pct = (v: number): string => `${Math.round(v * 100)}`;
  return [
    { id: 'masterVolume', label: 'MASTER VOLUME', value: pct(settings.masterVolume), ratio: settings.masterVolume },
    { id: 'musicVolume', label: 'MUSIC', value: pct(settings.musicVolume), ratio: settings.musicVolume },
    { id: 'sfxVolume', label: 'SOUND EFFECTS', value: pct(settings.sfxVolume), ratio: settings.sfxVolume },
    {
      id: 'textSpeed',
      label: 'TEXT SPEED',
      value: `${settings.textSpeed}x`,
      ratio: (settings.textSpeed - TEXT_SPEED_MIN) / (TEXT_SPEED_MAX - TEXT_SPEED_MIN),
    },
    { id: 'ffx2Atb', label: 'X-2 BATTLE', value: settings.ffx2Atb === 'wait' ? 'WAIT' : 'ACTIVE', ratio: null },
    { id: 'guideVisible', label: 'STRATEGY GUIDE', value: settings.guideVisible ? 'ON' : 'OFF', ratio: null },
  ];
}

export function optionsTabHtml(settings: Readonly<Settings>, selected: number): string {
  const rows = optionRows(settings)
    .map((row, i) => {
      const meter =
        row.ratio === null
          ? ''
          : `<span class="pause__opt-meter"><span class="pause__opt-meter-fill" style="width:${(
              Math.max(0, Math.min(1, row.ratio)) * 100
            ).toFixed(1)}%"></span></span>`;
      return `<div class="pause__opt${i === selected ? ' pause__opt--sel' : ''}" data-action="pause:opt:${escapeHtml(
        row.id,
      )}" role="button" tabindex="0">
        <span class="pause__opt-k">${escapeHtml(row.label)}</span>
        ${meter}
        <span class="pause__opt-v">${escapeHtml(row.value)}</span>
      </div>`;
    })
    .join('');
  return `<div class="pause__head"><span class="pause__head-label">OPTIONS</span></div>
    <div class="pause__opts">${rows}</div>
    <div class="pause__opt-hint"><b>&#9664; &#9654;</b> ADJUST &nbsp;&middot;&nbsp; <b>ESC</b> BACK TO MENU</div>`;
}
