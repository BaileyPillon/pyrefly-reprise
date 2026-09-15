import { App } from './app/App.ts';
import { audio } from './audio/index.ts';
import { DemoScene } from './app/screens/DemoScene.ts';
import { TitleScreen } from './app/screens/TitleScreen.ts';
import { installDebugApi, markReady } from './debug/api.ts';

/** Show a readable message instead of a black page if WebGL is unavailable. */
function fatal(message: string, detail?: unknown): void {
  // eslint-disable-next-line no-console
  console.error('[pyrefly]', message, detail ?? '');
  const ui = document.getElementById('ui');
  if (!ui) return;
  ui.innerHTML = `
    <div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:32px">
      <div style="max-width:42ch;color:#dbe6f7">
        <h1 style="font-family:var(--font-display);letter-spacing:.14em;text-transform:uppercase;font-size:20px">
          Pyrefly Reprise
        </h1>
        <p style="color:#9fb3cf;line-height:1.6">${message}</p>
      </div>
    </div>`;
  const fade = document.getElementById('fade');
  if (fade) fade.dataset['state'] = 'clear';
}

async function boot(): Promise<void> {
  document.getElementById('boot')?.remove();

  let app: App;
  try {
    app = new App();
  } catch (err) {
    fatal('This browser could not start WebGL 2. Try a recent Chrome, Edge or Firefox.', err);
    return;
  }

  // Browsers only allow an AudioContext from a user gesture; this arms the
  // first pointerdown/keydown to create it. Anything asked for before then is
  // queued by the AudioManager.
  audio.installUnlockListeners();

  app.register('title', () => new TitleScreen());
  app.register('demo', () => new DemoScene());

  installDebugApi(app);

  await app.push(new TitleScreen());
  app.start();

  // Ready once a real frame has been drawn, so screenshots never catch a blank.
  await app.nextFrame();
  await app.nextFrame();
  markReady();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void boot(), { once: true });
} else {
  void boot();
}
