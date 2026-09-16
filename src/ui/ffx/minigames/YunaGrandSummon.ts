import type { MinigameResult } from '../../../battle/common/types.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { arr, escapeHtml } from './params.ts';

interface AeonEntry {
  id: string;
  name: string;
  /** The aeon's own stored gauge, 0-100 — separate from the temporary full gauge Grand Summon grants. */
  storedGauge: number;
}

/**
 * Yuna — Grand Summon [visual-bible §3.11.6]: pick any owned aeon; it arrives
 * with a full temporary gauge and its own stored gauge is untouched, so an
 * aeon already at 100 can fire two Overdrives back to back. Flag that case
 * with a `x2` chip — it is the entire reason Grand Summon exists.
 */
export function openYunaGrandSummon(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const aeons = arr<AeonEntry>(params['aeons'], []);

  const overlay = new OverdriveOverlay();
  root.appendChild(overlay.el);
  overlay.open({ title: 'Grand Summon', mechanic: 'Grand Summon', instruction: 'aeon arrives with a full overdrive' });
  overlay.bodyEl.innerHTML = `<div class="ffx-mg-list" data-role="list"></div>`;
  const listEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="list"]')!;

  return new Promise<MinigameResult>((resolve) => {
    let cursor = 0;
    let settled = false;

    const render = (): void => {
      listEl.innerHTML = aeons
        .map((a, i) => {
          const cls = ['ffx-mg-list__row', i === cursor ? 'ffx-mg-list__row--selected' : ''].filter(Boolean).join(' ');
          const doubleChip = a.storedGauge >= 100 ? '<span class="ffx-mg-list__qty">×2</span>' : '';
          return `<div class="${cls}">${escapeHtml(a.name)}${doubleChip}<span class="ffx-mg-list__gauge"><i style="width:${Math.max(0, Math.min(100, a.storedGauge))}%"></i></span></div>`;
        })
        .join('');
    };

    const finish = async (aeonId: string): Promise<void> => {
      if (settled) return;
      settled = true;
      watcher.detach();
      await overlay.flashSuccess();
      await overlay.close();
      resolve({ kind: 'yuna-grand-summon', grandSummon: { aeonId } });
    };

    const watcher = new RawInputWatcher((b) => {
      if (settled || !aeons.length) return;
      if (b === 'up') cursor = (cursor - 1 + aeons.length) % aeons.length;
      else if (b === 'down') cursor = (cursor + 1) % aeons.length;
      else if (b === 'confirm') {
        const a = aeons[cursor];
        if (a) void finish(a.id);
        return;
      }
      render();
    });

    render();
    watcher.attach();
  });
}
