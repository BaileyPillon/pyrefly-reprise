/**
 * What the battle screen hands the stage for the B1 spell effects: the game's
 * skin, the renderer overlay they draw through, and the quality tier read from
 * the settings each frame (low effects or reduced motion keep today's bloom; a
 * phone-sized viewport gets the lighter tier).
 *
 * The flash rules follow REDUCE FLASHES (PR-0032): off is {@link DEFAULT_FLASH_PARAMS}, today's flashes; on is
 * {@link REDUCED_FLASH_PARAMS} (washes and glows capped at 35 %, white turns ivory, one wash per action, Thunder once).
 */

import type { Renderer } from '../../engine/Renderer.ts';
import type { StageSpellFxOptions } from '../../engine/spellfx/stageSpellFx.ts';
import { DEFAULT_FLASH_PARAMS, REDUCED_FLASH_PARAMS, resolveFxQuality, type FlashParams, type FxQuality } from '../../engine/spellfx/SpellFxParams.ts';
import type { SpellFxLayer } from '../../engine/spellfx/SpellFxLayer.ts';
import { SPEED_RATE } from '../../engine/spellfx/SpellFxSpecials.ts';
import type { BattleStage, PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';
import { ff7SpellFxOptions } from './battleFf7Fx.ts';
import { readSetting } from '../SaveData.ts';
import { readReduceFlashes } from '../accessFlags.ts';
import type { AnyCombatant, BattleState, GameId } from '../../battle/common/types.ts';
import { sparkKindFor } from '../../engine/spellfx/SparkWeapon.ts';
import { ffxFamily } from '../../battle/common/game.ts';

/** The spell effects' flash rules for the setting as it is now (the layer asks every frame, so a change in the pause applies on resume). */
export function battleFlashParams(): Readonly<FlashParams> {
  return readReduceFlashes() ? REDUCED_FLASH_PARAMS : DEFAULT_FLASH_PARAMS;
}

/**
 * The weapon a combatant swings, for the new effects' hit sparks (motion pass, lane "fx"): FFX's `weaponType` per character, or the dressphere an FFX-2 girl wears now
 * (`engine/spellfx/SparkWeapon.ts`, from the recorded SFX set's tables). A foe is the generic hit.
 */
export function weaponOfCombatant(game: GameId, state: () => BattleState | null, id: string): string | null {
  if (game !== 'ffx' && game !== 'ffx2') return null;
  const c = state()?.combatants[id] as (AnyCombatant & { dresspheres?: { current?: string } }) | undefined;
  if (c?.side !== 'party') return null;
  return sparkKindFor(game, id, c.dresspheres?.current);
}

export function battleSpellFx(
  game: GameId,
  renderer: Renderer,
  speed?: () => PlaybackSpeed | undefined,
  stage: () => BattleStage | null = () => null,
  chapterId?: string,
  state: () => BattleState | null = () => null,
): Pick<StageSpellFxOptions, 'game' | 'overlay' | 'quality' | 'rate' | 'flash' | 'onLand' | 'chapterId' | 'weaponOf' | 'scaleCut'> {
  // FF7: its own effects (D-260 Spectacle on A3 plus), never FFX's or FFX-2's skin (FF7 only).
  if (game === 'ff7') {
    const { director: _director, ...ff7 } = ff7SpellFxOptions(renderer, speed, stage);
    return ff7;
  }
  return {
    game: ffxFamily(game, 'battleSpellFx'),
    // The effect clock follows the presenter's playback speed (held fast-forward).
    rate: () => SPEED_RATE(speed?.() ?? 'normal'),
    flash: battleFlashParams, // PR-0032: REDUCE FLASHES, read every frame
    ...(chapterId ? { chapterId } : {}), // the new effects play in Chapters I and IV only, and only when switched on (`?fx=new` or `?pack=demo`; `engine/spellfx/FxSwitch.ts`)
    weaponOf: (id: string) => weaponOfCombatant(game, state, id),
    scaleCut: (factor: number) => renderer.crisp.setScaleCut(factor), // the frame-time guard's last step: the supersampled scene a little smaller (`engine/spellfx/FxPerfGuard.ts`)
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
  const [, id, target, at, variant] = name.split(':'); // the new effects: `spellfx:hit:<target>+<striker>:0.3:sword`, `spellfx:cure:<target>:0.5:phoenix`
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
  const holdAt = at === undefined || at === '' ? undefined : Number(at);
  return !!(id && from && layer.play(id, from, holdAt, group ? group.split(',') : [], variant ?? ''));
}
