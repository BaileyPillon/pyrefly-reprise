/**
 * What the battle screen hands the stage for the B1 spell effects: the game's
 * skin, the renderer overlay they draw through, and the quality tier read from
 * the settings each frame (low effects or reduced motion keep today's bloom; a
 * phone-sized viewport gets the lighter tier).
 *
 * The flash rules stay at their defaults until the REDUCE FLASHES setting
 * exists (accessibility batch); that batch passes `flash` here.
 */

import type { Renderer } from '../../engine/Renderer.ts';
import type { StageSpellFxOptions } from '../../engine/spellfx/stageSpellFx.ts';
import { DEFAULT_FLASH_PARAMS, REDUCED_FLASH_PARAMS, resolveFxQuality, type FxQuality } from '../../engine/spellfx/SpellFxParams.ts';
import type { SpellFxLayer } from '../../engine/spellfx/SpellFxLayer.ts';
import { SPEED_RATE } from '../../engine/spellfx/SpellFxSpecials.ts';
import type { PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';
import { readSetting } from '../SaveData.ts';
import type { GameId } from '../../battle/common/types.ts';
import { ffxFamily } from '../../battle/common/game.ts';

export function battleSpellFx(
  game: GameId,
  renderer: Renderer,
  speed?: () => PlaybackSpeed | undefined,
): Pick<StageSpellFxOptions, 'game' | 'overlay' | 'quality' | 'rate'> {
  // FF7's spell effects wait for their options round (rule 9): no overlay, so the layer draws nothing,
  // never FFX's or FFX-2's skin; the stage's plain impact still lands (FF7 only).
  if (game === 'ff7') return {};
  return {
    game: ffxFamily(game, 'battleSpellFx'),
    // The effect clock follows the presenter's playback speed (held fast-forward).
    rate: () => SPEED_RATE(speed?.() ?? 'normal'),
    overlay: (draw) => renderer.addOverlay(draw),
    quality: () =>
      resolveFxQuality({
        lowEffects: readSetting('lowEffects') === true,
        reduceMotion: readSetting('reduceMotion') === true,
        width: window.innerWidth,
        height: window.innerHeight,
      }),
  };
}

/**
 * `__pyrefly.trigger(...)` for captures and checks only, never a player path:
 * - `spellfx:<effect>:<combatant id>` plays one effect on a combatant now;
 * - `spellfx:<effect>:<combatant id>:<seconds>` holds it at that local time;
 * - `spellfx:megaflare:<caster>+<target>,<target>:<seconds>` plays a group effect from the caster;
 * - `spellfx:clear` removes every effect; `spellfx:quality:<full|phone|low|auto>` forces a tier;
 * - `spellfx:flash:<reduced|default|auto>` forces the flash rules.
 * The capture labels every frame it forces.
 */
export function spellFxTrigger(name: string, layer: SpellFxLayer | undefined): boolean | null {
  if (!name.startsWith('spellfx:')) return null;
  if (!layer) return false;
  const [, id, target, at] = name.split(':');
  if (id === 'clear') {
    layer.clear();
    return true;
  }
  if (id === 'flash') {
    layer.flashOverride = target === 'reduced' ? REDUCED_FLASH_PARAMS : target === 'default' ? DEFAULT_FLASH_PARAMS : null;
    return true;
  }
  if (id === 'quality') {
    const tier = target as FxQuality | 'auto';
    if (!['full', 'phone', 'low', 'auto'].includes(tier)) return false;
    layer.qualityOverride = tier === 'auto' ? null : tier;
    return true;
  }
  const [from, group] = (target ?? '').split('+');
  const holdAt = at === undefined ? undefined : Number(at);
  return !!(id && from && layer.play(id, from, holdAt, group ? group.split(',') : []));
}
