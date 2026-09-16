import './ui/common/fonts.css';
import { App } from './app/App.ts';
import { audio } from './audio/index.ts';
import { DemoScene } from './app/screens/DemoScene.ts';
import { TitleScreen } from './app/screens/TitleScreen.ts';
import { BattleScreen } from './app/screens/BattleScreen.ts';
import { PartyPrepScreen } from './app/screens/PartyPrepScreen.ts';
import { CutsceneScreen } from './app/screens/CutsceneScreen.ts';
import { ResultsScreen } from './app/screens/ResultsScreen.ts';
import { makeChapterSelect } from './app/screens/BattleScreenFlow.ts';
import { CHAPTERS } from './data/encounters.ts';
import { installDebugApi, markReady } from './debug/api.ts';
import { FFXHudDemoScreen } from './ui/ffx/FFXHudDemoScreen.ts';
// Side-effect only: registers the FFX party-prep panel with PartyPrepScreen.
import './ui/ffx/party-prep/index.ts';
// Side-effect only: registers ChapterSelectScreen/CutsceneScreen/ResultsScreen
// with BattleScreenFlow's GameFlow (see that module's doc comment).
import './ui/common/registerFlowScreens.ts';

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
  app.register('ffx-hud-demo', () => new FFXHudDemoScreen());

  // The chapter flow. `goto('chapter-select')` enters it and keeps it running:
  // the screen resolves with a chapter id, the flow plays it, and we come back
  // here. `app.startFlow()` is the same thing from inside a screen.
  app.register('chapter-select', () => {
    const screen = makeChapterSelect();
    void screen.done.then(async (id) => {
      // A screen also settles its promise when it is torn down. If something
      // else has already navigated away, this is that teardown and not the
      // player's choice — acting on it would shove the title screen back under
      // whatever just opened.
      if (app.current !== screen) return;
      if (!id) {
        await app.goto('title');
        return;
      }
      await app.runChapter(id, {});
      await app.goto('chapter-select');
    });
    return screen;
  });

  // Direct entries, so the screenshot tool and e2e can land on a screen without
  // walking the whole flow. All default to chapter 1.
  app.register('party-prep', () => new PartyPrepScreen({ chapter: CHAPTERS[0]! }));
  app.register('battle', () => new BattleScreen({ chapter: CHAPTERS[0]!, seed: 1 }));
  // The FFX-2 side of prep, which has no registered panel, so it shows the
  // shell's own Ink & Gold frame rather than a panel's full-screen menu.
  app.register(
    'party-prep-ffx2',
    () => new PartyPrepScreen({ chapter: CHAPTERS.find((c) => c.game === 'ffx2') ?? CHAPTERS[0]! }),
  );
  app.register('cutscene', () => new CutsceneScreen({ chapterId: CHAPTERS[0]!.id }));
  app.register('results', () =>
    new ResultsScreen({
      chapterId: CHAPTERS[0]!.id,
      result: {
        outcome: 'victory',
        turns: 12,
        elapsedTicks: 4200,
        elapsedMs: 128_000,
        ap: 36,
        exp: 0,
        gil: 1200,
        drops: [{ itemId: 'phoenix-down', count: 2 }],
        overkilled: ['mortiorchis'],
        sphereLevelsGained: { tidus: 1, yuna: 0, auron: 1 },
      },
    }),
  );

  // The Chapter 4 variant: same screen with the flourish suppressed
  // [writing-bible 5.4]. Registered so it can be screenshot like any other.
  app.register('results-silent', () =>
    new ResultsScreen({
      chapterId: 'ffx2-bahamut',
      result: {
        outcome: 'victory',
        turns: 18,
        elapsedTicks: 9600,
        elapsedMs: 214_000,
        ap: 0,
        exp: 540,
        gil: 780,
        drops: [],
        overkilled: [],
        sphereLevelsGained: {},
        levelsGained: { 'yuna-x2': 1, 'rikku-x2': 1, paine: 1 },
      },
    }),
  );

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
