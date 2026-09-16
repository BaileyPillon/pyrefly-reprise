import type { MinigameKind, MinigameResult } from '../../../battle/common/types.ts';
import { openAuronSequence } from './AuronSequence.ts';
import { openKimahriRage } from './KimahriRage.ts';
import { openLuluFury } from './LuluFury.ts';
import { openRikkuMix } from './RikkuMix.ts';
import { openTidusTiming } from './TidusTiming.ts';
import { openWakkaReels } from './WakkaReels.ts';
import { openYunaGrandSummon } from './YunaGrandSummon.ts';

export { openAuronSequence, openKimahriRage, openLuluFury, openRikkuMix, openTidusTiming, openWakkaReels, openYunaGrandSummon };

/**
 * `HudPort.openMinigame`'s dispatcher: routes an engine `minigame-request` to
 * the right overlay. `gunner-trigger` and `ladyluck-reels` are FFX-2 kinds
 * (owned by `src/ui/ffx2/`) and are rejected here rather than silently no-op'd.
 */
export function openMinigame(root: HTMLElement, kind: MinigameKind, params: Record<string, unknown>): Promise<MinigameResult> {
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
