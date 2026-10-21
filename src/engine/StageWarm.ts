/**
 * R61 booth fix 2 (PR-0481, the round 27 deep review of live r60; Bailey's conference demo): pay a first battle's once-per-page costs BEFORE the battle, not inside its entry.
 *
 * Measured on the dev server in headless GPU Chromium, real keys from party prep (`D:/Tools/pyrefly-scratch/2026-10-21/r61-booth/runs/hitch-*.json`; a CPU profile of
 * each frame gap, with and without the HD-2D look, so the look is not the cause): the first battle of a page load freezes the page three times under the entry's swirl, 0.7 to
 * 1.1 s each. The first of them, 0.93 to 1.1 s in Chapter I (0.45 s in Chapter IV), is two things `BattleScreen.enter` does once per page and nothing about the chapter:
 *
 * - **`probeBrowser()`** (`StageProbe.ts`, called by the `TextureStager`'s constructor): the browser's verdict on the staged upload is taken in a throwaway second WebGL2 context,
 *   and `getContext` alone is 664 to 785 ms of main thread there (ANGLE builds a whole second D3D11 context). The verdict is cached for the page, so every later battle is free.
 * - **`fxAtlasTexture()`** (`spellfx/FxAtlas.ts`): the spell effects' 1 MB atlas is computed pixel by pixel in JavaScript on first use, 120 to 140 ms; also cached for the page.
 *
 * Both are pure of the chapter, so they run when a chapter is confirmed on the board (`GameFlow.runChapter`: the party prep, a static menu, is what is on screen) and, in demo mode, a
 * few seconds after boot (the title stands for a long time on a booth), whichever comes first. A second call does nothing. Nothing here changes what a battle draws or when: the
 * stager is told the verdict a moment earlier, and the atlas is the same pixels. What this does NOT touch, and why, is in `docs/handoff/r61-booth.md`.
 *
 * Game case: both (shared presentation plumbing; the cost is the same in Chapter I FFX and Chapter IV FFX-2).
 */

import { stagedUploads } from './ArtDevice.ts';
import { fxAtlasTexture } from './spellfx/FxAtlas.ts';
import { probeBrowser } from './StageProbe.ts';

/** The gap between the two jobs, so one block of main thread is not both (the probe is the long one). */
const ATLAS_AFTER_MS = 900;

let started = false;

/** Start the once-per-page warm (idempotent). Never throws and never waits: the work is the page's own, done early. */
export function warmBattleStage(): void {
  if (started) return;
  started = true;
  try {
    if (stagedUploads()) void probeBrowser();
  } catch {
    /* a browser that cannot probe reads as "no staged upload", as before */
  }
  if (typeof setTimeout !== 'function') return;
  setTimeout(() => {
    try {
      fxAtlasTexture();
    } catch {
      /* the battle builds it itself, as before */
    }
  }, ATLAS_AFTER_MS);
}

/** Forget that the warm ran (tests only). */
export function resetStageWarm(): void {
  started = false;
}
