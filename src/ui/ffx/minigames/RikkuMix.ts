import type { ItemId, MinigameResult } from '../../../battle/common/types.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { claimCancel, releaseCancel, releaseCancelAfterPress } from '../cancelClaim.ts';
import { arr, escapeHtml, keepRowInView, MinigameCancelled, num, str } from './params.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';

interface Ingredient {
  itemId: ItemId;
  name: string;
  count: number;
}

/**
 * The engine's bag as rows, never throwing (hotfix 24). The engine sends
 * `ingredients: { itemId, name, count }` (`battle/ffx/pickerParams.ts`); before
 * that it sent only `inventory` (no names), and this overlay read nothing and
 * opened empty. An entry with no item id or none in the bag is left out. FFX only.
 */
function ingredientRows(v: unknown): Ingredient[] {
  const rows: Ingredient[] = [];
  for (const raw of arr<unknown>(v, [])) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = raw as Record<string, unknown>;
    const itemId = str(entry['itemId'], '');
    const count = num(entry['count'], 0);
    if (itemId && count > 0) rows.push({ itemId, name: str(entry['name'], itemId), count });
  }
  return rows;
}

/**
 * Rikku — Mix [visual-bible §3.11.5], restyled onto Ink & Gold's
 * `.ig-minigame` shell ("Other minigame overlays ... follow the Swordplay
 * slab pattern") with a local two-slot picker body (not mocked, composed
 * from the same paper/ink/gold tokens): two items are consumed and one
 * result fires from an unordered-pair recipe lookup. No timer, no failure
 * state — every pair yields *something* (or `resultAbilityId: null` for an
 * unknown pair, "Mix failed!").
 */
export function openRikkuMix(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const ingredients = ingredientRows(params['ingredients'] ?? params['inventory']);
  const rawRecipes = params['recipes'];
  const recipes = (rawRecipes && typeof rawRecipes === 'object' ? rawRecipes : {}) as Record<string, string>;
  const rawNames = params['recipeNames'];
  const recipeNames = (rawNames && typeof rawNames === 'object' ? rawNames : {}) as Record<string, string>;

  const overlay = new OverdriveOverlay();
  root.appendChild(overlay.el);
  overlay.open({ title: 'Mix', mechanic: 'Mix', instruction: 'choose two ingredients' });
  overlay.bodyEl.innerHTML = `
    <div class="ffx-mg-list" data-role="list"></div>
    <div class="ffx-mg-slots">
      <div class="ffx-mg-slot" data-role="slot-a">SLOT A</div>
      <div class="ffx-mg-slot" data-role="slot-b">SLOT B</div>
    </div>
    <div class="ffx-mg-preview" data-role="preview"></div>`;
  const listEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="list"]')!;
  const slotAEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="slot-a"]')!;
  const slotBEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="slot-b"]')!;
  const previewEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="preview"]')!;

  return new Promise<MinigameResult>((resolve, reject) => {
    let cursor = 0;
    let slotA: string | null = null;
    let slotB: string | null = null;
    let settled = false;

    const remaining = (itemId: string): number => {
      const base = ingredients.find((i) => i.itemId === itemId)?.count ?? 0;
      const used = [slotA, slotB].filter((s) => s === itemId).length;
      return base - used;
    };

    const renderList = (): void => {
      listEl.innerHTML = ingredients
        .map((ing, i) => {
          const left = remaining(ing.itemId);
          const cls = ['ffx-mg-list__row', i === cursor ? 'ffx-mg-list__row--selected' : ''].filter(Boolean).join(' ');
          return `<div class="${cls}">${escapeHtml(ing.name)}<span class="ffx-mg-list__qty">x${Math.max(0, left)}</span></div>`;
        })
        .join('');
      keepRowInView(listEl, cursor); // hotfix 24: an item past the fourth row stays in sight
    };

    const nameOf = (itemId: string | null): string => (itemId ? (ingredients.find((i) => i.itemId === itemId)?.name ?? itemId) : '');

    const renderSlots = (): void => {
      slotAEl.textContent = nameOf(slotA) || 'SLOT A';
      slotAEl.classList.toggle('ffx-mg-slot--filled', slotA !== null);
      slotBEl.textContent = nameOf(slotB) || 'SLOT B';
      slotBEl.classList.toggle('ffx-mg-slot--filled', slotB !== null);
      if (slotA && slotB) {
        const key = [slotA, slotB].sort().join('|');
        const resultId = recipes[key] ?? null;
        previewEl.textContent = resultId ? (recipeNames[key] ?? resultId) : '? ? ?';
      } else {
        previewEl.textContent = '';
      }
    };

    const finish = async (resultAbilityId: string | null): Promise<void> => {
      if (settled) return;
      settled = true;
      watcher.detach();
      releaseCancel();
      await overlay.flashSuccess();
      await overlay.close();
      resolve({
        kind: 'rikku-mix',
        mix: { ingredients: [slotA as ItemId, slotB as ItemId], resultAbilityId },
      });
    };

    /** Back out with both slots empty. See `MinigameCancelled` in `params.ts`. */
    const cancel = async (): Promise<void> => {
      if (settled) return;
      settled = true;
      watcher.detach();
      releaseCancelAfterPress();
      await overlay.close();
      reject(new MinigameCancelled('rikku-mix'));
    };

    const watcher = new RawInputWatcher((b) => {
      if (settled) return;
      // Nothing held and nothing to hold: cancel is the way out rather than a
      // no-op, so an empty pouch cannot strand the overlay on the field.
      if (b === 'cancel' && slotA === null && slotB === null) {
        void cancel();
        return;
      }
      if (!ingredients.length) {
        if (b === 'confirm') void cancel();
        return;
      }
      if (b === 'up') cursor = (cursor - 1 + ingredients.length) % ingredients.length;
      else if (b === 'down') cursor = (cursor + 1) % ingredients.length;
      else if (b === 'confirm') {
        const ing = ingredients[cursor];
        if (!ing || remaining(ing.itemId) <= 0) return;
        if (slotA === null) slotA = ing.itemId;
        else if (slotB === null) {
          slotB = ing.itemId;
          renderList();
          renderSlots();
          const key = [slotA, slotB].sort().join('|');
          void finish(recipes[key] ?? null);
          return;
        }
      } else if (b === 'cancel') {
        if (slotB !== null) slotB = null;
        else if (slotA !== null) slotA = null;
      }
      renderList();
      renderSlots();
    });

    renderList();
    renderSlots();
    watcher.attach();
    // Esc is this overlay's back button now, so the pause menu must not also
    // answer the same press (`src/ui/ffx/cancelClaim.ts`).
    claimCancel();
  });
}
