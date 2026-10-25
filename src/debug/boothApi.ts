/**
 * `window.__pyrefly.booth(mode?)`, `.boothOn()`, `.boothCard(kind)` and `.boothAttractNow()`: the booth screens' switch and doors for captures and checks (lane "booth", decision 188b; `app/demo/boothSwitch.ts`).
 *
 * `booth()` returns `'new'` or `'today'` (from `?booth=new` / `?pack=demo`, default today); `booth('new' | 'today')` sets it live. `boothOn()` is the answer in the page's mode (the cards also need demo mode).
 * `boothCard('end' | 'attract')` goes to the standalone card (`app/demo/BoothCardScreen.ts`, the same screen `?card=end` opens). `boothAttractNow()` puts the attract card over the title now, as the 60 s idle does,
 * and returns whether it was shown (false off the title, or when the card is already up).
 */
import type { App } from '../app/App.ts';
import { AttractCard } from '../app/demo/boothAttract.ts';
import { boothMode, boothNewOn, setBoothMode, type BoothCard, type BoothMode } from '../app/demo/boothSwitch.ts';

export function installBoothDebug(api: Record<string, unknown>, app: App): void {
  let card: AttractCard | null = null;
  api['booth'] = (mode?: BoothMode): BoothMode => {
    if (mode === 'new' || mode === 'today') setBoothMode(mode);
    return boothMode();
  };
  api['boothOn'] = (): boolean => boothNewOn();
  api['boothCard'] = (kind: BoothCard): Promise<boolean> => app.goto(kind === 'end' ? 'booth-end' : 'booth-attract');
  api['boothAttractNow'] = (): boolean => {
    if (card?.up) return false;
    card = new AttractCard(app.uiRoot);
    card.show();
    return true;
  };
}
