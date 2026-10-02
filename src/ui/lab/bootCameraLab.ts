/**
 * CAMERA LAB: the page's flow when `?camera=lab` is on (or the lab bundle). `main.ts` calls this
 * instead of pushing the title, through a dynamic import, so a normal page never loads it.
 *
 * The panel resolves a pick; the chapter then plays through the game's own flow
 * (`App.runChapter`, cutscenes and prep skipped; the swirl, the battle-start card, the results),
 * with the lab armed for START and disarmed for PLAY TODAY'S VERSION; then the panel again.
 */

import type { App } from '../../app/App.ts';
import { armLabBattle } from '../../engine/lab/LabSession.ts';
import { CameraLabScreen } from './CameraLabScreen.ts';

export async function bootCameraLab(app: App): Promise<void> {
  app.register('camera-lab', () => {
    const screen = new CameraLabScreen();
    void screen.done.then(async (pick) => {
      if (!pick || app.current !== screen) return;
      armLabBattle(pick.mode === 'lab' ? pick.chapter : null);
      try {
        await app.runChapter(pick.chapter, { skipCutscenes: true, skipPrep: true });
      } catch (err) {
        console.warn('[camera-lab] the chapter run failed', err);
      } finally {
        armLabBattle(null);
      }
      await app.goto('camera-lab');
    });
    return screen;
  });
  await app.goto('camera-lab');
}
