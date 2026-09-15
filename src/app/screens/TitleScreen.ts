import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { DemoScene } from './DemoScene.ts';

const STYLE_ID = 'title-screen-style';

const CSS = `
.title-screen {
  display: grid;
  place-items: center;
  text-align: center;
  background:
    radial-gradient(120% 90% at 50% 18%, rgba(28, 58, 108, 0.55), transparent 62%),
    radial-gradient(80% 60% at 50% 100%, rgba(10, 22, 44, 0.9), transparent 70%),
    #04060b;
}
.title-screen__inner { pointer-events: auto; }
.title-screen__mark {
  font-family: var(--font-display);
  font-size: clamp(34px, 7.2vw, 78px);
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin: 0;
  color: #f2f7ff;
  text-shadow:
    0 0 26px rgba(125, 255, 200, 0.28),
    0 0 70px rgba(70, 140, 220, 0.35),
    0 2px 0 rgba(0, 0, 0, 0.6);
}
.title-screen__rule {
  width: min(60vw, 520px);
  height: 1px;
  margin: 22px auto 18px;
  background: linear-gradient(90deg, transparent, rgba(180, 220, 255, 0.65), transparent);
}
.title-screen__sub {
  margin: 0 0 46px;
  font-size: clamp(10px, 1.3vw, 13px);
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: #8fa8c9;
}
.title-screen__prompt {
  display: inline-block;
  padding: 10px 26px;
  border: 1px solid rgba(160, 200, 255, 0.35);
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(22, 46, 92, 0.75), rgba(6, 12, 26, 0.85));
  font-size: 13px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: #dfeaff;
  cursor: pointer;
  animation: title-pulse 1.9s ease-in-out infinite;
}
.title-screen__prompt:hover { border-color: rgba(200, 235, 255, 0.7); }
.title-screen__hint {
  margin-top: 26px;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: #6c819d;
}
@keyframes title-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
@media (prefers-reduced-motion: reduce) {
  .title-screen__prompt { animation: none; }
}
`;

/**
 * Placeholder title card. The real one gets art, a music cue and a chapter
 * list; for now it proves the screen stack, input and fade all work.
 */
export class TitleScreen extends Screen {
  readonly name = 'title';
  private advancing = false;

  override enter(): void {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    this.root.className = 'screen title-screen';
    this.root.innerHTML = `
      <div class="title-screen__inner">
        <h1 class="title-screen__mark">Pyrefly Reprise</h1>
        <div class="title-screen__rule"></div>
        <p class="title-screen__sub">An unofficial fan tribute</p>
        <div class="title-screen__prompt" data-action="confirm" role="button" tabindex="0">
          Press Enter
        </div>
        <p class="title-screen__hint">Arrows / WASD &middot; Enter confirm &middot; Esc cancel</p>
      </div>
    `;
    void this.app.fade('clear', 700);
  }

  override handleInput(input: InputSnapshot): void {
    if (this.advancing) return;
    if (input.justPressed('confirm') || input.justPressed('start')) return void this.advance();
    if (input.actions.includes('confirm')) void this.advance();
  }

  private async advance(): Promise<void> {
    if (this.advancing) return;
    this.advancing = true;
    await this.app.fade('opaque', 320);
    await this.app.replace(new DemoScene());
  }

  override snapshot(): Record<string, unknown> {
    return { advancing: this.advancing };
  }
}
