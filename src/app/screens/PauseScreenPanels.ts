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

import type { GameId } from '../../battle/common/types.ts';
import type { Settings } from '../SaveData.ts';
import { fxSummary } from '../fxParts.ts';
import { TEXT_SIZES, textSizeLabel } from '../saveComfort.ts';
import { CHAPTER_SELECT_LABELS, TITLE_ART_LABELS, chapterSelectMusicOf, titleArtOf } from '../saveFrontend.ts';
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
 * Volume, text speed, the three comfort rows of accessibility A2 (TEXT SIZE,
 * REDUCE MOTION, LOW EFFECTS; D-285, `docs/concepts/r29-options/options.html`
 * frame A2: under TEXT SPEED, TEXT SIZE nudged with Left / Right like it), the
 * FFX-2 Active/Wait toggle, and whether the strategy guide starts visible.
 * Under LOW EFFECTS, EYE CANDY (D-317, option A: Bailey, 2026-10-02, "all your recommendations,
 * godspeed"), where eye-candy D's three look rows were: one row that opens the EYE CANDY page
 * (`pause/eyeCandyPage.ts`) and reads ALL ON, ALL OFF or `n OF 11` for `game` (`fxParts.ts`); the
 * pause drops it in FF7, which draws no eye candy.
 * `skipSeenCutscenes` stays off the menu. Last, TITLE SCREEN and CHAPTER MUSIC (39.5, `saveFrontend.ts`): the two front-end
 * choices Bailey asked to be selectable, each stepping through its list and wrapping.
 */
export function optionRows(settings: Readonly<Settings>, game: GameId = 'ffx'): OptionRow[] {
  const pct = (v: number): string => `${Math.round(v * 100)}`;
  return [
    { id: 'masterVolume', label: 'MASTER VOLUME', value: pct(settings.masterVolume), ratio: settings.masterVolume },
    { id: 'musicVolume', label: 'MUSIC', value: pct(settings.musicVolume), ratio: settings.musicVolume },
    { id: 'sfxVolume', label: 'SOUND EFFECTS', value: pct(settings.sfxVolume), ratio: settings.sfxVolume },
    // The recorded voice-over (FFX chapters; `optionsColumns` drops both rows where a game has none, rule 14): a level, and a mute.
    { id: 'voiceVolume', label: 'VOICE', value: pct(settings.voiceVolume), ratio: settings.voiceVolume },
    { id: 'voiceOn', label: 'VOICE-OVER', value: settings.voiceOn ? 'ON' : 'OFF', ratio: null },
    {
      id: 'textSpeed',
      label: 'TEXT SPEED',
      value: `${settings.textSpeed}x`,
      ratio: (settings.textSpeed - TEXT_SPEED_MIN) / (TEXT_SPEED_MAX - TEXT_SPEED_MIN),
    },
    {
      id: 'textSize',
      label: 'TEXT SIZE',
      value: textSizeLabel(settings.textSize),
      ratio: Math.max(0, TEXT_SIZES.indexOf(settings.textSize)) / (TEXT_SIZES.length - 1),
    },
    { id: 'reduceMotion', label: 'REDUCE MOTION', value: settings.reduceMotion ? 'ON' : 'OFF', ratio: null },
    { id: 'lowEffects', label: 'LOW EFFECTS', value: settings.lowEffects ? 'ON' : 'OFF', ratio: null },
    { id: 'eyeCandy', label: 'EYE CANDY', value: fxSummary(settings, game), ratio: null },
    { id: 'ffx2Atb', label: 'X-2 BATTLE', value: settings.ffx2Atb === 'wait' ? 'WAIT' : 'ACTIVE', ratio: null },
    { id: 'guideVisible', label: 'STRATEGY GUIDE', value: settings.guideVisible ? 'ON' : 'OFF', ratio: null },
    // 39.5 (Bailey, 2026-10-07; both games): which title screen is drawn, and which chapter-select track plays on the board.
    { id: 'titleArt', label: 'TITLE SCREEN', value: TITLE_ART_LABELS[titleArtOf(settings.titleArt)], ratio: null },
    { id: 'chapterSelectMusic', label: 'CHAPTER MUSIC', value: CHAPTER_SELECT_LABELS[chapterSelectMusicOf(settings.chapterSelectMusic)], ratio: null },
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
