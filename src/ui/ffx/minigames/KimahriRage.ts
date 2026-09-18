import type { AbilityId, MinigameResult } from '../../../battle/common/types.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { setMenuOwnsCancel } from '../../common/menuCancel.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { arr, escapeHtml, MinigameCancelled } from './params.ts';

interface RageEntry {
  id: AbilityId;
  name: string;
  /** The enemy this Rage was Lancet-ed from — the only place the game teaches the mechanic [visual-bible §3.11.7]. */
  fromEnemy?: string;
}

/**
 * Kimahri — Ronso Rage [visual-bible §3.11.7]: no timed input, a plain
 * ability list of every Rage learned via Lancet.
 */
export function openKimahriRage(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const rages = arr<RageEntry>(params['rages'], []);

  const overlay = new OverdriveOverlay();
  root.appendChild(overlay.el);
  overlay.open({
    title: 'Ronso Rage',
    mechanic: 'Ronso Rage',
    // An empty list is a real board state — Kimahri has Lancet-ed nothing yet —
    // and the instruction is the only thing that says so, plus how to get out.
    instruction: rages.length ? 'choose a rage' : 'no rage learned · cancel to go back',
  });
  overlay.bodyEl.innerHTML = `<div class="ffx-mg-list" data-role="list"></div>`;
  const listEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="list"]')!;

  return new Promise<MinigameResult>((resolve, reject) => {
    let cursor = 0;
    let settled = false;

    const render = (): void => {
      listEl.innerHTML = rages.length
        ? rages
            .map((r, i) => {
              const cls = ['ffx-mg-list__row', i === cursor ? 'ffx-mg-list__row--selected' : ''].filter(Boolean).join(' ');
              const suffix = r.fromEnemy ? `<span class="ffx-mg-list__qty">${escapeHtml(r.fromEnemy)}</span>` : '';
              return `<div class="${cls}">${escapeHtml(r.name)}${suffix}</div>`;
            })
            .join('')
        : `<div class="ffx-mg-list__empty">Kimahri has learned no Rage yet — Lancet one first.</div>`;
    };

    const finish = async (rageId: AbilityId): Promise<void> => {
      if (settled) return;
      settled = true;
      watcher.detach();
      setMenuOwnsCancel(false);
      await overlay.flashSuccess();
      await overlay.close();
      resolve({ kind: 'kimahri-rage', rage: { rageId } });
    };

    /** Back out. See `MinigameCancelled`: the overlay always leaves the field. */
    const cancel = async (): Promise<void> => {
      if (settled) return;
      settled = true;
      watcher.detach();
      setMenuOwnsCancel(false);
      await overlay.close();
      reject(new MinigameCancelled('kimahri-rage'));
    };

    const watcher = new RawInputWatcher((b) => {
      if (settled) return;
      if (b === 'cancel') {
        void cancel();
        return;
      }
      // Nothing to pick: confirm is a way out too, so the overlay can never
      // become a wall the player cannot get past.
      if (!rages.length) {
        if (b === 'confirm') void cancel();
        return;
      }
      if (b === 'up') cursor = (cursor - 1 + rages.length) % rages.length;
      else if (b === 'down') cursor = (cursor + 1) % rages.length;
      else if (b === 'confirm') {
        const r = rages[cursor];
        if (r) void finish(r.id);
        return;
      }
      render();
    });

    render();
    watcher.attach();
    // Esc is this overlay's back button now, so the pause menu must not also
    // answer the same press (`src/ui/common/menuCancel.ts`).
    setMenuOwnsCancel(true);
  });
}
