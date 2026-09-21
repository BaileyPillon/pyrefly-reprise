/**
 * The OPTIONS rows the pause screen draws, as data.
 *
 * Split out of `PauseScreen.ts` for the same reason `PartyPrepContent.ts` is
 * split out of `PartyPrepScreen.ts`: none of it touches screen state, so the
 * copy and the numbers can be asserted on without mounting anything.
 *
 * The party cards and the PARTY tab that used to live here are gone: the
 * remake dissolves them into one tab per member (`pause/tabs.ts`,
 * `pause/meters.ts`) — see `docs/concepts/pause-until-dawn/options.json`,
 * `preservedFunctions`, for where every one of their rows went.
 */

import type { Settings } from '../SaveData.ts';
import { escapeHtml } from '../../ui/common/html.ts';

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
