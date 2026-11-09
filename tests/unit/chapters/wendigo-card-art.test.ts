// @vitest-environment jsdom
/**
 * LIVE-78-1 (the release 78 live check, `critic/reviews/cc0fea14a-live.md`): the hidden Wendigo chapter (FFX only, number 49, the 3D Meshy lake) asked the server
 * for `art/characters/wendigo/idle.png` twice on load, a 404 on the live site each time. Wendigo has no 2D painting (its body is a 3D model, `engine/lake3d/`), and the
 * boss card set its background to that file unconditionally: once on the loading card over the entry and once on the battle's own card, both `BattleStartBanner`.
 *
 * The fix is the rule every other painted-art loader already keeps: the art manifest (`engine/ArtManifest.ts`) says what the build holds, and a file it says is not
 * there is not asked for. No manifest yet, or none (an old deploy, a bare server, a test), keeps the old behaviour: ask. The preload puts the manifest in before the
 * first card goes up. Game case: the card is shared plumbing and the guard is inert wherever the painting ships; the one card that reproduced it is FFX's (Wendigo).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../../src/data/encounters.ts';
import { artNamespaceOfScene, inArtNamespace } from '../../../src/data/art/artNamespace.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { BattleStartBanner } from '../../../src/ui/common/BattleStartBanner.ts';
import { WENDIGO_CHAPTER_ID, WENDIGO_SPRITE } from '../../../src/data/ffx/wendigo-ids.ts';

/** A build that holds Tidus's painting and nothing of Wendigo's (as the live build did). */
const MANIFEST_WITHOUT_WENDIGO = parseArtManifest({
  version: 1,
  generatedAt: '2026-11-09T00:00:00.000Z',
  subjects: {
    tidus: { states: ['idle'], portrait: true },
  },
  portraits: ['tidus'],
  backdrops: ['wendigo-lake'],
  pause: [],
});
const MANIFEST_WITH_WENDIGO = parseArtManifest({
  version: 1,
  generatedAt: '2026-11-09T00:00:00.000Z',
  subjects: { tidus: { states: ['idle'], portrait: true }, wendigo: { states: ['idle'], portrait: false } },
  portraits: ['tidus'],
  backdrops: ['wendigo-lake'],
  pause: [],
});

afterEach(() => {
  resetArtManifest();
  document.body.innerHTML = '';
});

/** The art key the card is given for a chapter, built the way `BattleScreenCard` and `battlePreload` build it. */
function cardArtKey(chapterId: string): string {
  const chapter = getChapter(chapterId as never);
  if (!chapter) throw new Error(`no chapter ${chapterId}`);
  const group = chapter.enemyGroupRef;
  const boss = group.enemies.find((e) => e.id === group.bossId) ?? group.enemies[0]!;
  expect(boss, 'the group has a boss').toBeDefined();
  return inArtNamespace(artNamespaceOfScene(chapter.sceneKey), boss.spriteKey || boss.id);
}

/** The boss painting the card's art element was given, or '' when it was given none. */
function cardBackground(artKey: string): string {
  const banner = new BattleStartBanner({ root: document.body, bossName: 'Wendigo', game: 'ffx', artKey });
  void banner.show();
  const art = banner.el.querySelector('.bstart__art') as HTMLElement;
  expect(art, 'the card has its art element').not.toBeNull();
  const out = art.style.backgroundImage;
  banner.dismiss();
  return out;
}

describe('the Wendigo chapter (FFX only) has a 3D boss and no 2D painting to ask for', () => {
  it('is an FFX hidden chapter whose boss card is keyed by the sprite id `wendigo`', () => {
    const chapter = getChapter(WENDIGO_CHAPTER_ID);
    expect(chapter?.game).toBe('ffx');
    expect(chapter?.number).toBe(49);
    expect(cardArtKey(WENDIGO_CHAPTER_ID)).toBe(WENDIGO_SPRITE);
  });

  it('a build whose manifest does not list the painting: the card asks for no `art/characters/wendigo/idle.png` (the 404 twice)', () => {
    setArtManifest(MANIFEST_WITHOUT_WENDIGO);
    expect(cardBackground(cardArtKey(WENDIGO_CHAPTER_ID))).toBe('');
  });

  it('a build whose manifest lists the painting: the card draws it (the guard hides nothing that ships)', () => {
    setArtManifest(MANIFEST_WITH_WENDIGO);
    expect(cardBackground(cardArtKey(WENDIGO_CHAPTER_ID))).toContain('art/characters/wendigo/idle.png');
  });

  it('no manifest (an old deploy, a bare server, the manifest not in yet): the card asks, as it always did', () => {
    setArtManifest(null);
    expect(cardBackground(cardArtKey(WENDIGO_CHAPTER_ID))).toContain('art/characters/wendigo/idle.png');
  });

  it('every other boss that has its painting is untouched: Seymour Flux (Chapter I) still gets his card art', () => {
    const key = cardArtKey('seymour-flux');
    setArtManifest(parseArtManifest({ version: 1, generatedAt: '2026-11-09T00:00:00.000Z', subjects: { [key]: { states: ['idle'], portrait: true } }, portraits: [], backdrops: [], pause: [] }));
    expect(cardBackground(key)).toContain(`art/characters/${key}/idle.png`);
  });
});

describe('the preload puts the manifest in before the first card goes up', () => {
  it('`battlePreload.ts` awaits `loadArtManifest()` ahead of the `cardInfo.set` that the loading card reads', () => {
    const text = readFileSync(join(process.cwd(), 'src/app/screens/battlePreload.ts'), 'utf8');
    const awaited = text.indexOf('await loadArtManifest();');
    const set = text.indexOf('cardInfo.set(chapter.id');
    expect(awaited).toBeGreaterThan(0);
    expect(set).toBeGreaterThan(awaited);
  });
});
