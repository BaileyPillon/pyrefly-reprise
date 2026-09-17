import type { Camera, Scene } from 'three';
import { Screen } from '../../app/Screen.ts';
import type { InputSnapshot } from '../../app/Input.ts';
import type { MinigameKind } from '../../battle/common/types.ts';
import { FFXBattleHud } from './FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeCommands, makeFakeTurnPreview } from './testFixtures.ts';

const STYLE_ID = 'ffx-hud-demo-style';
const CSS = `
.ffx-hud-demo { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 30%, #1a2740 0%, #050912 75%); }
.ffx-hud-demo__label {
  position: absolute; left: 24px; top: 20px; font-family: var(--font-display);
  font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(216,232,255,0.55);
}
`;

/**
 * A live, data-bound stand-in for a battle screen: mounts the real
 * `FFXBattleHud` against the fake fixtures in `testFixtures.ts`, so the HUD
 * can be screenshotted and iterated on before any battle engine or 3D scene
 * exists. Registered as `'ffx-hud-demo'`.
 *
 * Party-prep no longer has a demo mode here: it composes into
 * `PartyPrepScreen`'s own Ink & Gold frame now (`src/ui/ffx/party-prep/
 * index.ts`), so the real `'party-prep'` screen (registered in `main.ts`) is
 * the thing to screenshot for it, not a synthetic stand-in.
 *
 * Beats (`window.__pyrefly.trigger(name)`):
 * | Name | Effect |
 * |---|---|
 * | `command:open` | opens the command menu (default on enter) |
 * | `telegraph` | fires a stage-2 charge telegraph banner |
 * | `minigame:<kind>` | opens that Overdrive minigame overlay |
 */
export class FFXHudDemoScreen extends Screen {
  readonly name = 'ffx-hud-demo';

  private hud: FFXBattleHud | null = null;
  private label: HTMLElement | null = null;

  override enter(): void {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    this.root.className = 'screen ffx-hud-demo';
    this.label = document.createElement('div');
    this.label.className = 'ffx-hud-demo__label';
    this.label.textContent = 'FFX HUD — fixture data';
    this.root.appendChild(this.label);
    this.showBattle();
  }

  override exit(): void {
    this.hud?.unmount();
    this.hud = null;
  }

  private showBattle(): void {
    const hud = new FFXBattleHud();
    this.hud = hud;
    hud.mount(this.root);
    hud.setVisible(true);
    hud.setProjector((id) => FAKE_POSITIONS[id] ?? { x: 800, y: 450 });
    const state = makeFakeBattleState();
    hud.sync(state, makeFakeTurnPreview());
    // Populates the .ig-banner (name tracked from turn-start, "ATTACK" left
    // in the chip once the tracked name is trimmed off the message text) so
    // the demo shows the banner as designed instead of an empty slab.
    hud.onEvent({ seq: 0, type: 'turn-start', actorId: 'tidus', turn: 1, elapsedTicks: 0 });
    hud.onEvent({ seq: 1, type: 'message', text: 'Tidus ATTACK', kind: 'ability' });
    void hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
  }

  override handleInput(input: InputSnapshot): void {
    if (input.justPressed('cancel')) void this.app.goto('title');
  }

  override trigger(name: string): boolean {
    if (name === 'command:open') {
      void this.hud?.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
      return true;
    }
    if (name === 'telegraph') {
      this.hud?.onEvent({ seq: 0, type: 'charge', enemyId: 'mortiorchis', name: 'Ready To Annihilate', turnsLeft: 0, stage: 2 });
      return true;
    }
    if (name.startsWith('minigame:')) {
      const kind = name.slice('minigame:'.length);
      void this.hud?.openMinigame(kind as MinigameKind, MINIGAME_DEMO_PARAMS[kind] ?? {});
      return true;
    }
    return false;
  }

  override render(): { scene: Scene; camera: Camera } | null {
    return null;
  }

  override snapshot(): Record<string, unknown> {
    return { mode: 'battle' };
  }
}

/** Fixed screen-space positions standing in for the presenter's real projector. */
const FAKE_POSITIONS: Record<string, { x: number; y: number }> = {
  tidus: { x: 420, y: 560 },
  yuna: { x: 520, y: 590 },
  auron: { x: 620, y: 570 },
  'seymour-flux': { x: 980, y: 320 },
  mortiorchis: { x: 1180, y: 300 },
};

const MINIGAME_DEMO_PARAMS: Record<string, Record<string, unknown>> = {
  'tidus-timing': { name: 'Slice & Dice', timerMs: 3000, zoneHalfWidth: 22, speedPxPerSec: 340 },
  'auron-sequence': { name: 'Dragon Fang', timerMs: 4000, sequence: ['down', 'left', 'up', 'right', 'l1', 'r1', 'cancel', 'confirm'] },
  'wakka-reels': { name: 'Element Reels', timerMs: 20000, reelSet: 'element' },
  'lulu-fury': { spellName: 'Fira', timerMs: 4000, magic: 22 },
  'rikku-mix': {
    ingredients: [
      { itemId: 'potion', name: 'Potion', count: 8 },
      { itemId: 'hi-potion', name: 'Hi-Potion', count: 4 },
    ],
    recipes: { 'hi-potion|potion': 'mega-potion' },
  },
  'kimahri-rage': { rages: [{ id: 'fire-breath', name: 'Fire Breath', fromEnemy: 'Bomb' }] },
  'yuna-grand-summon': { aeons: [{ id: 'valefor', name: 'Valefor', storedGauge: 100 }] },
};
