/**
 * Nudging one setting from the OPTIONS tab.
 *
 * Lifted out of the screen unchanged in behaviour: volumes and text speed
 * step, the toggles flip whichever way you push them (which is what makes
 * Confirm work on them as well as Left/Right), and every write goes through
 * `SaveStore.setSettings` **and** through `AudioManager` where the mixer needs
 * telling — a volume the player can see but not hear would be a worse bug than
 * no options menu at all.
 *
 * Keyed by row id rather than by index, because the remade screen walks one
 * flattened list across two columns and an index would mean something
 * different in each.
 */

import { audio } from '../../../audio/index.ts';
import { voice } from '../../../audio/voice/index.ts';
import type { GameId } from '../../../battle/common/types.ts';
import type { SaveStore } from '../../SaveData.ts';
import { isFxLookField } from '../../fxLooks.ts';
import { fxLookOnPatch, isFxSwitchField } from '../../fxParts.ts';
import { stepTextSize, wrapTextSize } from '../../saveComfort.ts';
import { TEXT_SPEEDS, VOLUME_STEP } from '../PauseScreenPanels.ts';

/** FFX-2's Config ATB speeds, slowest first (`research/ffx2-combat-core.md` §1.2). */
export const ATB_SPEEDS = ['slow', 'normal', 'fast'] as const;

const clamp01 =(v: number): number => Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;

/**
 * True when the id named a setting and it was written. `game` is the page the player is on (the EYE CANDY page passes
 * its own): it decides which parts of a look are in view when the look is turned ON.
 */
export function adjustSetting(save: SaveStore, id: string, dir: 1 | -1, press = false, game?: GameId): boolean {
  const settings = save.settings;
  if (isFxSwitchField(id)) {
    // The EYE CANDY page's twelve switches (three looks, nine parts; D-317) flip like REDUCE MOTION, each on
    // its own: a look never rewrites its parts, with one exception (judgment call L of round 21, PR-0329): a look
    // turned ON while every part under it is OFF brings its parts back ON (`fxLookOnPatch`). Same stored fields.
    // `applyComfort` switches the look and the seam live on the write.
    const turningOn = settings[id] === false;
    save.setSettings(turningOn && isFxLookField(id) ? fxLookOnPatch(settings, id, game) : { [id]: turningOn });
    return true;
  }
  switch (id) {
    case 'masterVolume': {
      const value = clamp01(settings.masterVolume + dir * VOLUME_STEP);
      save.setSettings({ masterVolume: value });
      audio.setMasterVolume(value);
      return true;
    }
    case 'musicVolume': {
      const value = clamp01(settings.musicVolume + dir * VOLUME_STEP);
      save.setSettings({ musicVolume: value });
      audio.setMusicVolume(value);
      return true;
    }
    case 'sfxVolume': {
      const value = clamp01(settings.sfxVolume + dir * VOLUME_STEP);
      save.setSettings({ sfxVolume: value });
      audio.setSfxVolume(value);
      return true;
    }
    case 'voiceVolume': {
      const value = clamp01(settings.voiceVolume + dir * VOLUME_STEP);
      save.setSettings({ voiceVolume: value });
      audio.setVoiceVolume(value);
      if (value === 0) voice.stop(); // a VOICE of 0 is text only: a line already speaking stops with it
      return true;
    }
    case 'voiceOn': {
      // VOICE-OVER flips whichever way you push it (Confirm works on it as on the other toggles); off stops a line already speaking.
      const on = !settings.voiceOn;
      save.setSettings({ voiceOn: on });
      audio.setVoiceOn(on);
      if (!on) voice.stop();
      return true;
    }
    case 'textSpeed': {
      const i = TEXT_SPEEDS.indexOf(settings.textSpeed as (typeof TEXT_SPEEDS)[number]);
      const next = TEXT_SPEEDS[Math.min(TEXT_SPEEDS.length - 1, Math.max(0, (i < 0 ? 2 : i) + dir))];
      save.setSettings({ textSpeed: next ?? 1 });
      return true;
    }
    case 'textSize':
      // D-285 (A2): Left / Right step and clamp at 100 and 130 %, as TEXT SPEED does. Confirm and a
      // tap step up and wrap back to 100 %, so a touch-only phone is never stuck at the top size.
      save.setSettings({ textSize: press ? wrapTextSize(settings.textSize) : stepTextSize(settings.textSize, dir) });
      return true;
    case 'reduceMotion':
      save.setSettings({ reduceMotion: !settings.reduceMotion });
      return true;
    case 'lowEffects':
      save.setSettings({ lowEffects: !settings.lowEffects });
      return true;
    case 'ffx2Atb':
      save.setSettings({ ffx2Atb: settings.ffx2Atb === 'active' ? 'wait' : 'active' });
      return true;
    case 'ffx2AtbSpeed': {
      // FFX-2's Config ATB speed (§1.2). Steps and wraps, so Confirm (dir 1)
      // is never a dead press on it; the engine is re-told when the pause
      // closes (`BattleScreenWiring.applyAtbSpeed`).
      const i = ATB_SPEEDS.indexOf(settings.ffx2AtbSpeed ?? 'normal');
      const next = ATB_SPEEDS[(i + dir + ATB_SPEEDS.length) % ATB_SPEEDS.length] ?? 'normal';
      save.setSettings({ ffx2AtbSpeed: next });
      return true;
    }
    case 'guideVisible':
      save.setSettings({ guideVisible: !settings.guideVisible });
      return true;
    default:
      return false;
  }
}
