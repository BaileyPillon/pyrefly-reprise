import type { MinigameResult } from '../../../battle/common/types.ts';
import { RawInputWatcher } from '../rawInput.ts';
import { resolveReelStop, resolveReels } from './logic.ts';
import { OverdriveOverlay } from './OverdriveOverlay.ts';
import { arr, num, str } from './params.ts';

type ReelSet = 'attack' | 'element' | 'status' | 'aurochs';

const DEFAULT_STRIPS: Record<ReelSet, string[]> = {
  element: ['fire', 'ice', 'water', 'thunder'],
  attack: ['1', '2'],
  status: ['skull', 'arrow', 'timer'],
  aurochs: ['aurochs-1', 'aurochs-2', 'aurochs-3'],
};

/**
 * Wakka — Slots [visual-bible §3.11.3], restyled onto Ink & Gold's
 * `.ig-minigame__bar--reel`/`__reel` ("Other minigame overlays ... follow
 * the Swordplay slab pattern"): three reels, a 20 000 ms timer, the player
 * stops each reel (left to right) with confirm. If the timer expires with
 * reels still spinning, they stop instantly and randomly.
 */
export function openWakkaReels(root: HTMLElement, params: Record<string, unknown>): Promise<MinigameResult> {
  const timerMs = num(params['timerMs'], 20000);
  const msPerSymbol = num(params['msPerSymbol'], 90);
  const reelSet = (str(params['reelSet'], 'element') as ReelSet) ?? 'element';
  const name = str(params['name'], 'Slots');
  const reelStripsParam = params['reelStrips'] as unknown[] | undefined;
  const fallbackStrip = DEFAULT_STRIPS[reelSet] ?? DEFAULT_STRIPS.element;
  const strips: [string[], string[], string[]] = [
    arr<string>(reelStripsParam?.[0], fallbackStrip),
    arr<string>(reelStripsParam?.[1], fallbackStrip),
    arr<string>(reelStripsParam?.[2], fallbackStrip),
  ];

  const overlay = new OverdriveOverlay();
  root.appendChild(overlay.el);
  overlay.open({ title: name, mechanic: `${reelSet} reels`, instruction: 'stop each reel', timerMs, showBonus: true });
  overlay.bodyEl.innerHTML = `
    <div class="ig-minigame__bar ig-minigame__bar--reel" data-role="reels">
      <div class="ig-minigame__reel ffx-mg-reel--spinning" data-role="reel-0">?</div>
      <div class="ig-minigame__reel ffx-mg-reel--spinning" data-role="reel-1">?</div>
      <div class="ig-minigame__reel ffx-mg-reel--spinning" data-role="reel-2">?</div>
    </div>
    <div class="ffx-mg-preview" data-role="result"></div>`;
  const reelEls = [0, 1, 2].map((i) => overlay.bodyEl.querySelector<HTMLElement>(`[data-role="reel-${i}"]`)!);
  const resultEl = overlay.bodyEl.querySelector<HTMLElement>('[data-role="result"]')!;

  return new Promise<MinigameResult>((resolve) => {
    const stopped: Array<string | null> = [null, null, null];
    let settled = false;

    const stopReel = (i: number, atMs: number): void => {
      if (stopped[i] !== null) return;
      const symbol = resolveReelStop(strips[i]!, atMs, msPerSymbol);
      stopped[i] = symbol;
      const el = reelEls[i]!;
      el.classList.remove('ffx-mg-reel--spinning');
      el.textContent = symbolGlyph(symbol);
      if (stopped.every((s) => s !== null)) void finish();
    };

    const watcher = new RawInputWatcher((b) => {
      if (b !== 'confirm' || settled) return;
      const nextIndex = stopped.findIndex((s) => s === null);
      if (nextIndex >= 0) stopReel(nextIndex, overlay.elapsedMs());
    });

    const finish = async (): Promise<void> => {
      if (settled) return;
      settled = true;
      watcher.detach();
      const symbols = stopped.map((s) => s ?? '') as [string, string, string];
      const elapsedMs = overlay.elapsedMs();
      const reels = resolveReels(symbols, elapsedMs, timerMs, reelSet);
      if (reels.threeOfAKind) reelEls.forEach((el) => el.classList.add('ig-minigame__reel--win'));
      resultEl.textContent = reels.threeOfAKind ? 'JACKPOT!' : symbols.some((s) => s === symbols[0]) ? 'PAIR' : 'MISS';
      await (reels.threeOfAKind ? overlay.flashSuccess() : overlay.flashFail());
      await overlay.close();
      resolve({ kind: 'wakka-reels', reels });
    };

    overlay.startTimer(timerMs, () => {
      const atMs = overlay.elapsedMs();
      for (let i = 0; i < 3; i++) stopReel(i, atMs);
    });
    watcher.attach();
  });
}

function symbolGlyph(symbol: string): string {
  if (symbol === 'fire') return '\u{1F525}';
  if (symbol === 'ice') return '❄';
  if (symbol === 'water') return '\u{1F4A7}';
  if (symbol === 'thunder') return '⚡';
  if (symbol === 'skull') return '☠';
  if (symbol === 'arrow') return '↓';
  if (symbol === 'timer') return '⌛';
  return symbol || '?';
}
