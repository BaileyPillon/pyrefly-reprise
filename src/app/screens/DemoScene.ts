import type { Camera, Scene } from 'three';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { buildDemoScene, type DioramaScene } from '../../scenes/demo.ts';
import { audio } from '../../audio/index.ts';

const STYLE_ID = 'demo-screen-style';

/** The track M toggles. Rendered on demand by the audio engine, no asset files. */
const MUSIC_TRACK = 'title';

const CSS = `
.demo-screen__hud {
  position: absolute;
  left: 22px;
  bottom: 20px;
  padding: 10px 16px;
  border: 1px solid rgba(150, 195, 255, 0.28);
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(14, 34, 70, 0.72), rgba(4, 10, 22, 0.82));
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #c6d8f2;
  backdrop-filter: blur(2px);
}
.demo-screen__hud b { color: #9df0d2; font-weight: 500; }
.demo-screen__title {
  position: absolute;
  right: 24px;
  top: 20px;
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: rgba(216, 232, 255, 0.72);
  text-shadow: 0 0 18px rgba(120, 200, 255, 0.35);
}
`;

/**
 * Test bed for the HD-2D stack: the Gagazet-mood diorama, three placeholder
 * party sprites and a boss silhouette, with the camera rigs wired to the
 * left/right keys so the tweens are easy to eyeball.
 */
export class DemoScene extends Screen {
  readonly name = 'demo';

  private diorama: DioramaScene | null = null;
  private rigIndex = 0;
  private musicOn = false;
  private readonly rigOrder = ['idle', 'party', 'enemy', 'victory'];

  override enter(): void {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    this.diorama = buildDemoScene(this.app.renderer.camera);

    this.root.className = 'screen demo-screen';
    this.root.innerHTML = `
      <div class="demo-screen__title">Mt. Gagazet &mdash; trail</div>
      <div class="demo-screen__hud">
        Rig <b data-role="rig">idle</b> &middot; Left/Right cycle &middot; Z attack &middot;
        M music <b data-role="music">off</b> &middot; Esc title
      </div>
    `;
    void this.app.fade('clear', 600);
  }

  override exit(): void {
    if (this.musicOn) audio.stopMusic(0.5);
    this.musicOn = false;
    this.diorama?.dispose();
    this.diorama = null;
  }

  override handleInput(input: InputSnapshot): void {
    const d = this.diorama;
    if (!d) return;

    if (input.justPressed('right')) this.cycleRig(1);
    if (input.justPressed('left')) this.cycleRig(-1);

    if (input.justPressed('confirm')) {
      audio.playSfx('confirm');
      const hero = d.party[0];
      if (hero && hero.stateNames.includes('attack')) {
        hero.setState('attack', { restart: true, onComplete: () => hero.setState('idle') });
      }
      for (const a of d.party) a.flash('#bfe9ff', 220);
      d.enemies[0]?.shake(6, 320);
      audio.playSfx('sword-slash-1', { delay: 0.18, pan: 0.2 });
    }
    if (input.justPressed('triangle')) {
      d.enemies[0]?.flash('#9affd8', 260);
      audio.playSfx('magic-charge', { volume: 0.8 });
    }
    // 'select' is bound to M (and the pad's Select button).
    if (input.justPressed('select')) this.toggleMusic();
    if (input.justPressed('cancel')) {
      audio.playSfx('cancel');
      void this.toTitle();
    }
  }

  /**
   * Start or stop the title track. Safe to call before the AudioContext exists:
   * `installUnlockListeners()` (main.ts) unlocks on this very keypress, and
   * `playMusic` queues anything that arrives a tick early.
   */
  private toggleMusic(): void {
    // Tracks are synthesised on demand, which can take a second or two, so
    // `audio.currentMusic` is still null while the first render runs. Keep the
    // intent here instead; `stopMusic()` also cancels an in-flight render.
    this.musicOn = !this.musicOn;
    if (this.musicOn) void audio.playMusic(MUSIC_TRACK, { fade: 1.6 });
    else audio.stopMusic(0.6);
    const label = this.root.querySelector('[data-role="music"]');
    if (label) label.textContent = this.musicOn ? MUSIC_TRACK : 'off';
  }

  private cycleRig(dir: 1 | -1): void {
    const d = this.diorama;
    if (!d) return;
    audio.playSfx('cursor-move');
    this.rigIndex = (this.rigIndex + dir + this.rigOrder.length) % this.rigOrder.length;
    const rig = this.rigOrder[this.rigIndex]!;
    void d.battleCamera.moveTo(rig, 850);
    const label = this.root.querySelector('[data-role="rig"]');
    if (label) label.textContent = rig;
  }

  private async toTitle(): Promise<void> {
    await this.app.fade('opaque', 300);
    // Go through the registry rather than importing TitleScreen: TitleScreen
    // already imports this module, and a cycle would break the chunking.
    await this.app.goto('title');
  }

  override update(dt: number): void {
    this.diorama?.update(dt);
  }

  override render(): { scene: Scene; camera: Camera } | null {
    if (!this.diorama) return null;
    return { scene: this.diorama.scene, camera: this.app.renderer.camera };
  }

  override snapshot(): Record<string, unknown> {
    const d = this.diorama;
    return {
      rig: d?.battleCamera.rigName ?? null,
      party: d?.party.map((p) => ({ name: p.name, state: p.state })) ?? [],
      enemies: d?.enemies.map((e) => ({ name: e.name, state: e.state })) ?? [],
    };
  }
}
