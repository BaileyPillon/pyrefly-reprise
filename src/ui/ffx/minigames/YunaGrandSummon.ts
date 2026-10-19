import type { MinigameResult } from '../../../battle/common/types.ts';
import { menuParity } from '../../../battle/ffx/menu-draw-parity.ts';
import { isCoarsePointer } from '../../common/ControlsHint.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { claimCancel, releaseCancel, releaseCancelAfterPress } from '../cancelClaim.ts';
import { playRefusal } from '../refusalCue.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { arr, escapeHtml, keepRowInView, MinigameCancelled, num, str } from './params.ts';

interface AeonEntry {
  id: string;
  name: string;
  /** The aeon's own stored gauge, 0-100 — separate from the temporary full gauge Grand Summon grants. */
  storedGauge: number;
  /** False for an aeon the fight's script has taken away (`battle/ffx/pickerParams.ts`, off by default): drawn greyed, the cursor rests on it, a confirm is refused. */
  enabled: boolean;
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
    rows.push({ id, name: str(entry['name'], id), storedGauge: num(entry['storedGauge'], 0), enabled: entry['enabled'] !== false });
  }
  return rows;
}

/**
 * Yuna — Grand Summon [visual-bible §3.11.6]: pick any owned aeon; it arrives
 * with a full temporary gauge and its own stored gauge is untouched, so an
 * aeon already at 100 can fire two Overdrives back to back. Flag that case
 * with a `x2` chip — it is the entire reason Grand Summon exists.
 *
 * Input (FFX only; PR-0467 and LV55-2, release 56): a key or a pad button, as ever; a tap or a click on a row
 * moves the cursor there and confirms it, as a tap on a command-menu row does; a tap on the title goes back, as
 * a tap on a Doublecast list's title does (a phone has no Esc). A confirm on a greyed aeon (the fight has taken
 * it away, or it is knocked out) shakes the list, as a refused command-menu row does, and plays the menu set's
 * `error` cue only while menu draw parity item f is on (`refuse` below; the switch stays off as shipped).
 */
export function openYunaGrandSummon(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const aeons = aeonRows(params['aeons']);

  const overlay = new OverdriveOverlay();
  root.appendChild(overlay.el);
  const touch = isCoarsePointer(); // a finger has no Esc: the caption says the title is the way back
  overlay.open({
    title: 'Grand Summon',
    mechanic: 'Grand Summon',
    instruction: aeons.some((a) => a.enabled)
      ? `aeon arrives with a full overdrive${touch ? ' · tap the title to go back' : ''}`
      : `no aeon available · ${touch ? 'tap the title' : 'cancel'} to go back`,
  });
  overlay.bodyEl.innerHTML = `<div class="ffx-mg-list" data-role="list"></div>`;
  const listEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="list"]')!;
  const titleEl = overlay.el.querySelector<HTMLElement>('[data-role="title"]');
  overlay.el.classList.add('ffx-mg--pick'); // the rows and the title take a finger or a click (`overdrive-minigames.css`); the rest of the slab keeps the layer's `none`

  return new Promise<MinigameResult>((resolve, reject) => {
    let cursor = Math.max(0, aeons.findIndex((a) => a.enabled)); // opens on the first aeon that can be called
    let settled = false;

    const render = (): void => {
      listEl.innerHTML = aeons.length
        ? aeons
            .map((a, i) => {
              const cls = ['ffx-mg-list__row', i === cursor ? 'ffx-mg-list__row--selected' : '', a.enabled ? '' : 'ffx-mg-list__row--disabled'].filter(Boolean).join(' ');
              const doubleChip = a.storedGauge >= 100 ? '<span class="ffx-mg-list__qty">×2</span>' : '';
              return `<div class="${cls}" data-pick="${i}">${escapeHtml(a.name)}${doubleChip}<span class="ffx-mg-list__gauge" role="img" aria-label="${escapeHtml(a.name)} overdrive gauge ${Math.round(Math.max(0, Math.min(100, a.storedGauge)))} percent" title="Overdrive gauge ${Math.round(Math.max(0, Math.min(100, a.storedGauge)))}%"><i style="width:${Math.max(0, Math.min(100, a.storedGauge))}%"></i></span></div>`;
            })
            .join('')
        : `<div class="ffx-mg-list__empty">No aeon is available to summon.</div>`;
      keepRowInView(listEl, cursor); // the 5th aeon (Bahamut) sits below the list's four visible rows
    };

    /** A confirm on a greyed aeon: the list shakes (as a refused command-menu row does) and the cue plays only under parity item f. */
    const refuse = (): void => {
      listEl.classList.remove('ffx-mg-list--shake');
      void listEl.offsetWidth; // restart the animation on a second refusal
      listEl.classList.add('ffx-mg-list--shake');
      if (menuParity('cursor')) playRefusal();
    };

    /** Confirm the aeon under the cursor: a live one is called, a greyed one is refused and nothing else happens. */
    const confirmCursor = (): void => {
      const a = aeons[cursor];
      if (a?.enabled) void finish(a.id);
      else refuse();
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
        confirmCursor();
        return;
      }
      render();
    });

    // A tap or a click on a row: the cursor goes there and the row is confirmed, as a tap on a command-menu row does.
    const onRowTap = (e: Event): void => {
      if (settled) return;
      const row = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-pick]');
      const i = Number(row?.dataset['pick']);
      if (!row || !Number.isInteger(i) || !aeons[i]) return;
      cursor = i;
      render();
      confirmCursor();
    };
    // A tap on the title is Back (a phone has no Esc); with nothing to pick it is the same exit the confirm key takes.
    const onTitleTap = (): void => {
      if (!settled) void cancel();
    };
    listEl.addEventListener('click', onRowTap);
    titleEl?.addEventListener('click', onTitleTap);

    render();
    watcher.attach();
    // Esc is this overlay's back button now, so the pause menu must not also
    // answer the same press (`src/ui/ffx/cancelClaim.ts`).
    claimCancel();
  });
}
