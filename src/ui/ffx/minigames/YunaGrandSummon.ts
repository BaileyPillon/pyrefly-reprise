import type { MinigameResult } from '../../../battle/common/types.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { claimCancel, releaseCancel, releaseCancelAfterPress } from '../cancelClaim.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { arr, escapeHtml, keepRowInView, MinigameCancelled, num, str } from './params.ts';

interface AeonEntry {
  id: string;
  name: string;
  /** The aeon's own stored gauge, 0-100 — separate from the temporary full gauge Grand Summon grants. */
  storedGauge: number;
}

/**
 * The engine's `aeons` param as rows, never throwing (hotfix 24). The engine
 * sends `{ id, name, storedGauge }` (`battle/ffx/pickerParams.ts`); a bare id is
 * shown by its id, and an entry with no id is left out, because a picker that
 * throws hands the choice to the engine's default roll. FFX only.
 */
function aeonRows(v: unknown): AeonEntry[] {
  const rows: AeonEntry[] = [];
  for (const raw of arr<unknown>(v, [])) {
    const entry = typeof raw === 'string' ? { id: raw } : raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
    const id = entry && typeof entry['id'] === 'string' && entry['id'] ? entry['id'] : null;
    if (!entry || !id) continue;
    rows.push({ id, name: str(entry['name'], id), storedGauge: num(entry['storedGauge'], 0) });
  }
  return rows;
}

/**
 * Yuna — Grand Summon [visual-bible §3.11.6]: pick any owned aeon; it arrives
 * with a full temporary gauge and its own stored gauge is untouched, so an
 * aeon already at 100 can fire two Overdrives back to back. Flag that case
 * with a `x2` chip — it is the entire reason Grand Summon exists.
 */
export function openYunaGrandSummon(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const aeons = aeonRows(params['aeons']);

  const overlay = new OverdriveOverlay();
  root.appendChild(overlay.el);
  overlay.open({
    title: 'Grand Summon',
    mechanic: 'Grand Summon',
    instruction: aeons.length ? 'aeon arrives with a full overdrive' : 'no aeon available · cancel to go back',
  });
  overlay.bodyEl.innerHTML = `<div class="ffx-mg-list" data-role="list"></div>`;
  const listEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="list"]')!;

  return new Promise<MinigameResult>((resolve, reject) => {
    let cursor = 0;
    let settled = false;

    const render = (): void => {
      listEl.innerHTML = aeons.length
        ? aeons
            .map((a, i) => {
              const cls = ['ffx-mg-list__row', i === cursor ? 'ffx-mg-list__row--selected' : ''].filter(Boolean).join(' ');
              const doubleChip = a.storedGauge >= 100 ? '<span class="ffx-mg-list__qty">×2</span>' : '';
              return `<div class="${cls}">${escapeHtml(a.name)}${doubleChip}<span class="ffx-mg-list__gauge"><i style="width:${Math.max(0, Math.min(100, a.storedGauge))}%"></i></span></div>`;
            })
            .join('')
        : `<div class="ffx-mg-list__empty">No aeon is available to summon.</div>`;
      keepRowInView(listEl, cursor); // the 5th aeon (Bahamut) sits below the list's four visible rows
    };

    const finish = async (aeonId: string): Promise<void> => {
      if (settled) return;
      settled = true;
      watcher.detach();
      releaseCancel();
      await overlay.flashSuccess();
      await overlay.close();
      resolve({ kind: 'yuna-grand-summon', grandSummon: { aeonId } });
    };

    /** Back out. See `MinigameCancelled` — the overlay always leaves the field. */
    const cancel = async (): Promise<void> => {
      if (settled) return;
      settled = true;
      watcher.detach();
      releaseCancelAfterPress();
      await overlay.close();
      reject(new MinigameCancelled('yuna-grand-summon'));
    };

    const watcher = new RawInputWatcher((b) => {
      if (settled) return;
      if (b === 'cancel') {
        void cancel();
        return;
      }
      if (!aeons.length) {
        if (b === 'confirm') void cancel();
        return;
      }
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
    // Esc is this overlay's back button now, so the pause menu must not also
    // answer the same press (`src/ui/ffx/cancelClaim.ts`).
    claimCancel();
  });
}
