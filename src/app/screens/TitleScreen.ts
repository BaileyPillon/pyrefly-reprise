import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { audio } from '../../audio/index.ts';
import { installInkGoldStyles, playWipe } from '../../ui/inkgold/index.ts';

/**
 * Title card in the approved "Ink & Gold" presentation
 * (docs/handoff/presentation-ink-and-gold.md; mockup docs/screenshots/mockups/
 * A-title.jpg, reference source docs/handoff/ink-and-gold/Title.dc.html).
 *
 * Everything visual comes from `src/ui/inkgold` — this screen only composes
 * the classes, supplies the copy and the painting, and owns the transition
 * out. Authored on the same 640x360 logical grid the HUD uses (§ "Mockups are
 * authored at 1440x810 ... divide every px by 2.25"), letterbox-scaled with a
 * single transform exactly as `src/ui/ffx/HudMock.ts` does.
 */
export class TitleScreen extends Screen {
  readonly name = 'title';
  private advancing = false;
  private stage: HTMLElement | null = null;
  private readonly onResize = (): void => this.layout();

  override enter(): void {
    installInkGoldStyles();
    this.root.className = 'screen ig-title-screen';
    this.root.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:#0B0A12;';

    const stage = document.createElement('div');
    stage.className = 'ig';
    stage.style.cssText =
      'position:absolute;left:0;top:0;width:640px;height:360px;transform-origin:0 0;pointer-events:auto;';
    stage.innerHTML = this.markup();
    this.root.appendChild(stage);
    this.stage = stage;

    window.addEventListener('resize', this.onResize, { passive: true });
    this.layout();

    void audio.playMusic('title', { fade: 1.6 }).catch(() => {
      /* audio stays locked until the first gesture; AudioManager queues it */
    });
    void this.app.fade('clear', 700);
  }

  override exit(): void {
    window.removeEventListener('resize', this.onResize);
    this.stage = null;
  }

  private markup(): string {
    const painting = artUrl('art/backdrops/title.png');
    return `
      <div class="ig-title">
        <img alt="" src="${painting}"
             style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"
             onerror="this.style.display='none'">
        <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,10,18,0.55) 0%,rgba(11,10,18,0) 55%);"></div>
        <div class="ig-surface">
          <div class="ig-surface__grain"></div>
          <div class="ig-surface__vignette"></div>
        </div>

        <div class="ig-title__slab"></div>
        <div class="ig-title__stripe"></div>

        <div class="ig-title__content">
          <div class="ig-title__eyebrow">AN UNOFFICIAL FAN TRIBUTE</div>
          <div class="ig-title__name">Pyrefly</div>
          <div class="ig-title__name ig-title__name--second">Reprise</div>
          <div class="ig-title__rule"></div>
          <div class="ig-title__chip" data-action="confirm" role="button" tabindex="0">
            <svg viewBox="0 0 10 14" width="4.44" height="6.22" aria-hidden="true">
              <path d="M1 1 L9 7 L1 13 Z" fill="currentColor"></path>
            </svg>PRESS ENTER
          </div>
        </div>

        <div class="ig-title__caption">FIVE ENCOUNTERS &middot; FINAL FANTASY X AND X-2</div>
        <div class="ig-hint-chip ig-title__hint">
          <b>ARROWS / WASD</b> MOVE &nbsp;&middot;&nbsp; <b>ENTER</b> CONFIRM &nbsp;&middot;&nbsp; <b>ESC</b> CANCEL
        </div>
      </div>
    `;
  }

  /** Letterbox the 640x360 grid into whatever the viewport is. */
  private layout(): void {
    if (!this.stage) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = Math.min(w / 640, h / 360);
    const x = (w - 640 * scale) / 2;
    const y = (h - 360 * scale) / 2;
    this.stage.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
  }

  override handleInput(input: InputSnapshot): void {
    if (this.advancing) return;
    if (input.justPressed('confirm') || input.justPressed('start')) return void this.advance();
    if (input.actions.includes('confirm')) void this.advance();
  }

  /**
   * Spec "Motion & camera": every screen change is the diagonal ivory wipe.
   * The chapter loop is started at full cover so the wipe clears onto chapter
   * select rather than back onto the title.
   */
  private async advance(): Promise<void> {
    if (this.advancing) return;
    this.advancing = true;
    audio.playSfx('battle-start');
    await playWipe(this.app.uiRoot, {
      onCover: () => {
        void this.app.startFlow();
      },
    });
  }

  override trigger(name: string): boolean {
    if (name !== 'confirm' && name !== 'start') return false;
    void this.advance();
    return true;
  }

  override snapshot(): Record<string, unknown> {
    return { advancing: this.advancing, skin: 'ink-and-gold' };
  }
}
