/**
 * What a chapter's authored scene paints, in the order it paints it (r29,
 * PR-0221): its backdrop, then each speaker's portrait in the order they first
 * speak, then any plate a `backdrop()` step swaps in.
 *
 * Read off the script itself, with the same rule `DialogueBox` uses for a line's
 * portrait (`step.portrait ?? step.who`, nothing for the narrator or `'none'`),
 * so the chapter preload and the cutscene screen warm exactly the files the
 * scene will ask for. A file the art manifest says is absent is skipped later,
 * by `imageWarm`.
 *
 * Game case: both (one cutscene screen for every chapter).
 */

import type { StoryScript } from '../../story/dsl.ts';
import { manifestKnowsAssetNow } from '../../engine/ArtManifest.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { untilWarm, warmImage, warmImages, type WarmLane } from '../imageWarm.ts';

/**
 * Longest the scene's first frame waits for its backdrop and first speaker
 * (PR-0221). The chapter preload has normally warmed both long before, so the
 * wait is nil. Measured cold over 25 Mbit/s with a player who skips prep in
 * 0.4 s, the first speaker's 1.4 MB portrait landed 4.2 s into the scene (it
 * shares the pipe with the prep screen's own paintings); on a slower link the
 * scene still starts after this, and the backdrop then goes up whole when it
 * lands (`whenDecoded`).
 */
export const SCENE_OPENING_CEILING_MS = 4000;

function hasPipeline(): boolean {
  return typeof Image !== 'undefined' && typeof Image.prototype.decode === 'function';
}

/**
 * Wait (bounded) for a scene's opening frame, or `null` when there is nothing
 * to wait on (no image pipeline: jsdom, a unit test), so the caller starts at once.
 */
export function sceneOpening(urls: readonly string[], ceilingMs = SCENE_OPENING_CEILING_MS): Promise<boolean> | null {
  if (!hasPipeline() || urls.length === 0) return null;
  return untilWarm(urls, ceilingMs, 'urgent');
}

/**
 * The cutscene screen's half (PR-0221): the backdrop goes up on `root` only
 * once decoded (never half-painted), every other speaker and plate is warmed
 * at `urgent`, and the returned promise is the bounded wait for the opening
 * frame (`null`: start at once, for a skipped scene or no image pipeline).
 */
export function stageScene(
  root: HTMLElement,
  script: StoryScript,
  sceneKey: string | undefined,
  skipped: boolean,
  gone: () => boolean,
): Promise<boolean> | null {
  const art = sceneArtUrls(script, sceneKey);
  const bg = sceneKey ? artUrl(`art/backdrops/${sceneKey}.png`) : null;
  // A `backdrop()` step that already swapped the plate wins over a late decode.
  if (bg) whenDecoded(bg, 'urgent', () => void (gone() || root.style.backgroundImage || (root.style.backgroundImage = `url(${bg})`)));
  if (hasPipeline()) void warmImages(art.rest, 'urgent');
  return skipped ? null : sceneOpening(art.first);
}

/**
 * Put a painting up only once it is decoded, so it never shows half-arrived
 * (the "half-painted" pre-scene backdrops of round 15). A file the manifest
 * says is absent is never applied; any other failure applies it anyway and the
 * browser does what it did before. With no image pipeline it applies at once.
 */
export function whenDecoded(url: string, lane: WarmLane, apply: () => void): void {
  if (!hasPipeline()) {
    apply();
    return;
  }
  void warmImage(url, lane).then((ok) => {
    if (ok || manifestKnowsAssetNow(url) !== false) apply();
  });
}

/** The URLs, most urgent first: `first` is the opening frame (backdrop and first speaker). */
export function sceneArtUrls(script: StoryScript | undefined, sceneKey: string | undefined): { first: string[]; rest: string[] } {
  const first: string[] = [];
  const rest: string[] = [];
  if (sceneKey) first.push(artUrl(`art/backdrops/${sceneKey}.png`));
  let speaker = false;
  for (const step of script ?? []) {
    if (step.type === 'say') {
      const id: string = step.portrait ?? step.who;
      if (!id || id === 'none' || id === 'narrator') continue;
      const url = artUrl(`art/portraits/${id}.png`);
      (speaker ? rest : first).push(url);
      speaker = true;
    } else if (step.type === 'backdrop') {
      rest.push(artUrl(`art/backdrops/${step.key}.png`));
    }
  }
  const seen = new Set(first);
  return { first: [...seen], rest: rest.filter((u) => !seen.has(u) && (seen.add(u), true)) };
}
