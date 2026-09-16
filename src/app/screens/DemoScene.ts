import type { Camera, Scene } from 'three';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { buildDemoScene, type PaintedScene } from '../../scenes/demo.ts';
import { HudMock } from '../../ui/ffx/HudMock.ts';
import { audio } from '../../audio/index.ts';

const STYLE_ID = 'demo-screen-style';

/** The track M toggles. Rendered on demand by the audio engine, no asset files. */
const MUSIC_TRACK = 'title';

const CSS = `
.demo-screen__hud {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 10px;
  padding: 7px 14px;
  border: 1px solid rgba(150, 195, 255, 0.2);
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(10, 24, 50, 0.6), rgba(3, 7, 16, 0.72));
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(198, 216, 242, 0.8);
  backdrop-filter: blur(2px);
  white-space: nowrap;
  z-index: 5;
}
.demo-screen__hud b { color: #9df0d2; font-weight: 500; }
.demo-screen__title {
  position: absolute;
  right: 24px;
  top: 20px;
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: rgba(216, 232, 255, 0.5);
  text-shadow: 0 0 18px rgba(120, 200, 255, 0.35);
  z-index: 5;
}
.demo-screen--hud-on .demo-screen__title { display: none; }
/* With the HUD up, the key legend moves into the empty sky at top-centre so it
   never sits on the party status window. */
.demo-screen--hud-on .demo-screen__hud { bottom: auto; top: 12px; opacity: 0.72; }
/* The chrome:off beat strips the dev furniture for a clean concept capture. */
.demo-screen--no-chrome .demo-screen__hud,
.demo-screen--no-chrome .demo-screen__title { display: none; }
`;

/**
 * The painted-2.5D reference screen: the Mt. Gagazet composition, the static
 * FFX HUD mock over it, and the keys that drive the action beats.
 *
 * | Key | Beat |
 * | --- | --- |
 * | Left / Right | cycle the camera rigs |
 * | Z | attack: lunge, slash arc, sparks, camera punch and shake |
 * | Q / Shift | cast |
 * | R | the party takes a hit |
 * | F | pyrefly dissolve on the boss |
 * | H | toggle the HUD mock |
 * | M | music |
 * | Esc | back to the title |
 *
 * `__pyrefly.trigger('chrome:off')` additionally hides the dev key legend and
 * the scene title, which is how `docs/screenshots/06-concept-battle.png` is
 * captured with nothing but the game in frame.
 */
export class DemoScene extends Screen {
  readonly name = 'demo';

  private diorama: PaintedScene | null = null;
  private hud: HudMock | null = null;
  private rigIndex = 0;
  private musicOn = false;
  private readonly rigOrder = ['idle', 'action', 'party', 'enemy', 'victory', 'intro'];
  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.code === 'KeyH') {
      e.preventDefault();
      this.setHudVisible(!(this.hud?.visible ?? false));
    }
  };

  override async enter(): Promise<void> {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    this.root.className = 'screen demo-screen demo-screen--hud-on';
    this.root.innerHTML = `
      <div class="demo-screen__title">Mt. Gagazet &mdash; the Prominence</div>
      <div class="demo-screen__hud">
        Rig <b data-role="rig">idle</b> &middot; &larr;/&rarr; rigs &middot; Z attack &middot;
        Q cast &middot; R hit &middot; F send &middot; H hud &middot;
        M music <b data-role="music">off</b> &middot; Esc title
      </div>
    `;

    const diorama = await buildDemoScene(this.app.renderer.camera);
    this.diorama = diorama;
    this.app.renderer.applyPalette(diorama.palette);
    this.syncPixelScale();

    this.hud = new HudMock({
      root: this.root,
      message: 'Tidus attacks!',
      caption: this.captionFor(diorama),
      visible: true,
    });
    this.hud.mount();

    window.addEventListener('keydown', this.onKey);
    void this.app.fade('clear', 700);
  }

  /** Spells out which figures are still stand-ins, for the concept shot. */
  private captionFor(d: PaintedScene): string {
    const r = d.assetReport;
    const missing: string[] = [];
    if (!r.backdrop) missing.push('backdrop');
    if (!r.tidusPoses.length) missing.push('tidus');
    if (!r.yuna) missing.push('yuna');
    if (!r.boss) missing.push('seymour flux');
    missing.push(...r.standIns.filter((s) => s !== 'yuna'));
    if (!missing.length) return 'Painted 2.5D &mdash; <b>all art final</b>';
    return `Painted 2.5D concept &mdash; stand-in art for <b>${missing.join(', ')}</b>`;
  }

  override exit(): void {
    window.removeEventListener('keydown', this.onKey);
    if (this.musicOn) audio.stopMusic(0.5);
    this.musicOn = false;
    this.hud?.unmount();
    this.hud = null;
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
      d.trigger('attack');
      audio.playSfx('sword-slash-1', { delay: 0.2, pan: 0.2 });
    }
    if (input.justPressed('triangle')) {
      d.trigger('cast');
      audio.playSfx('magic-charge', { volume: 0.8 });
    }
    if (input.justPressed('r1')) d.trigger('hurt');
    if (input.justPressed('l1')) d.trigger('ko');

    // 'select' is bound to M (and the pad's Select button).
    if (input.justPressed('select')) this.toggleMusic();
    if (input.justPressed('cancel')) {
      audio.playSfx('cancel');
      void this.toTitle();
    }
  }

  /**
   * Named beats for `window.__pyrefly.trigger()`, the screenshot tool and e2e.
   * Scene beats are delegated; `hud:*` is handled here.
   */
  override trigger(name: string): boolean {
    if (name === 'hud:on' || name === 'hud:off' || name === 'hud:toggle') {
      const next = name === 'hud:toggle' ? !(this.hud?.visible ?? false) : name === 'hud:on';
      this.setHudVisible(next);
      return true;
    }
    if (name === 'chrome:on' || name === 'chrome:off') {
      this.root.classList.toggle('demo-screen--no-chrome', name === 'chrome:off');
      return true;
    }
    if (name.startsWith('rig:')) {
      const rig = name.slice(4);
      if (!this.diorama?.battleCamera.rigNames.includes(rig)) return false;
      void this.diorama.battleCamera.moveTo(rig, 700);
      this.rigIndex = Math.max(0, this.rigOrder.indexOf(rig));
      this.setRigLabel(rig);
      return true;
    }
    return this.diorama?.trigger(name) ?? false;
  }

  private setHudVisible(v: boolean): void {
    this.hud?.setVisible(v);
    this.root.classList.toggle('demo-screen--hud-on', v);
  }

  private toggleMusic(): void {
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
    this.setRigLabel(rig);
  }

  private setRigLabel(rig: string): void {
    const label = this.root.querySelector('[data-role="rig"]');
    if (label) label.textContent = rig;
  }

  private async toTitle(): Promise<void> {
    await this.app.fade('opaque', 300);
    // Go through the registry rather than importing TitleScreen: TitleScreen
    // already imports this module, and a cycle would break the chunking.
    await this.app.goto('title');
  }

  /** Particle and spark sizes are authored at a 900px render height. */
  private syncPixelScale(): void {
    const h = this.app.renderer.domElement.height || 900;
    this.diorama?.setPixelScale(Math.max(0.5, h / 900));
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
      hud: this.hud?.visible ?? false,
      art: d?.assetReport ?? null,
      party: d?.party.map((p) => ({ name: p.name, pose: p.pose, placeholder: p.isPlaceholder })) ?? [],
      enemies:
        d?.enemies.map((e) => ({ name: e.name, pose: e.pose, placeholder: e.isPlaceholder })) ?? [],
    };
  }
}
