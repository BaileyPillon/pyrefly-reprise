/**
 * A-3's card for one chapter (both games): the approved battle-start card's
 * options, read from the chapter record and from the opening state the
 * preload has already built (`battlePreload.battleCardInfo`), for
 * `transitions/loadingCard.ts` to raise over the entry transition's ink while
 * a cold battle loads. Nothing to name yet (the preload has not opened the
 * fight): no card, the ink as before.
 */

import type { Chapter } from '../../data/encounters.ts';
import { loadingCardWait, type CoverWait } from '../../ui/common/transitions/loadingCard.ts';
import { battleCardInfo } from './battlePreload.ts';

export function entryCardWait(root: HTMLElement, chapter: Chapter): CoverWait {
  return loadingCardWait(root, () => {
    const info = battleCardInfo(chapter.id);
    if (!info) return null;
    return {
      chapterNumber: chapter.number,
      ...(chapter.experimental ? { experimental: true as const } : {}),
      location: chapter.location,
      bossName: info.bossName,
      subline: chapter.subtitle,
      artKey: info.artKey,
      backdropKey: chapter.sceneKey,
      party: info.party,
      game: chapter.game,
    };
  });
}
