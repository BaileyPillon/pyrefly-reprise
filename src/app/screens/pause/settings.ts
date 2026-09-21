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
import type { SaveStore } from '../../SaveData.ts';
import { TEXT_SPEEDS, VOLUME_STEP } from '../PauseScreenPanels.ts';

const clamp01 = (v: number): number => Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;

/** True when the id named a setting and it was written. */
export function adjustSetting(save: SaveStore, id: string, dir: 1 | -1): boolean {
  const settings = save.settings;
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
    case 'textSpeed': {
      const i = TEXT_SPEEDS.indexOf(settings.textSpeed as (typeof TEXT_SPEEDS)[number]);
      const next = TEXT_SPEEDS[Math.min(TEXT_SPEEDS.length - 1, Math.max(0, (i < 0 ? 2 : i) + dir))];
      save.setSettings({ textSpeed: next ?? 1 });
      return true;
    }
    case 'ffx2Atb':
      save.setSettings({ ffx2Atb: settings.ffx2Atb === 'active' ? 'wait' : 'active' });
      return true;
    case 'guideVisible':
      save.setSettings({ guideVisible: !settings.guideVisible });
      return true;
    default:
      return false;
  }
}
