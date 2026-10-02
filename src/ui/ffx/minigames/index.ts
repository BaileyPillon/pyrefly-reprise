import type { MinigameKind, MinigameResult } from '../../../battle/common/types.ts';
import { openAuronSequence } from './AuronSequence.ts';
import { openKimahriRage } from './KimahriRage.ts';
import { openLuluFury } from './LuluFury.ts';
import { openRikkuMix } from './RikkuMix.ts';
import { openTidusTiming } from './TidusTiming.ts';
import { openWakkaReels } from './WakkaReels.ts';
import { openYunaGrandSummon } from './YunaGrandSummon.ts';
import { ABILITIES } from '../../../data/ffx/index.ts';

export { openAuronSequence, openKimahriRage, openLuluFury, openRikkuMix, openTidusTiming, openWakkaReels, openYunaGrandSummon };

/**
 * `HudPort.openMinigame`'s dispatcher: routes an engine `minigame-request` to
 * the right overlay. `gunner-trigger` and `ladyluck-reels` are FFX-2 kinds
 * (owned by `src/ui/ffx2/`) and are rejected here rather than silently no-op'd.
 */
export function openMinigame(root: HTMLElement, kind: MinigameKind, rawParams: Record<string, unknown>): Promise<MinigameResult> {
  const params = withAbilityName(rawParams);
  switch (kind) {
    case 'tidus-timing':
      return openTidusTiming(root, params);
    case 'auron-sequence':
      return openAuronSequence(root, params);
    case 'wakka-reels':
      return openWakkaReels(root, params);
    case 'lulu-fury':
      return openLuluFury(root, params);
    case 'rikku-mix':
      return openRikkuMix(root, params);
    case 'kimahri-rage':
      return openKimahriRage(root, params);
    case 'yuna-grand-summon':
      return openYunaGrandSummon(root, params);
    case 'gunner-trigger':
    case 'ladyluck-reels':
      return Promise.reject(new Error(`${kind} is an FFX-2 minigame; src/ui/ffx2/ owns it.`));
    default:
      return Promise.reject(new Error(`Unknown minigame kind: ${String(kind)}`));
  }
}

/**
 * VP-1001-16 (FFX only): the engine's `minigame-request` carries the chosen
 * Overdrive's `abilityId` but no `name`, so Swordplay, Bushido and Slots showed
 * their hard-coded fallbacks ('Slice & Dice' over a chosen Spiral Cut). The
 * title comes from the ability data here, on the UI side, so the engine event
 * (a shared contract) is unchanged. An explicit `name` still wins.
 */
export function withAbilityName(params: Record<string, unknown>): Record<string, unknown> {
  if (typeof params['name'] === 'string' && params['name'] !== '') return params;
  const id = params['abilityId'];
  const name = typeof id === 'string' ? ABILITIES[id]?.name : undefined;
  return name ? { ...params, name } : params;
}
