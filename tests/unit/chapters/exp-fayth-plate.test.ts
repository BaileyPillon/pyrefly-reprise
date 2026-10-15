// @vitest-environment jsdom
/**
 * **The hidden Fayth chapter asks only for paintings that exist** (FOC46-04, `critic/reviews/ca9fd0b4-focused.json`; **FFX only**, AGENTS.md rule 14).
 *
 * The scene key `exp-fayth-deck` names the scene (a factory in the registry), not a file: the party prep's wash, the pre-battle scene's backdrop, the battle preload and the battle-start card all read
 * `art/backdrops/<scene key>.png`, and no such painting was ever made (the review saw the prep as a flat navy page and a failed request in the console for every visitor who typed the word). The chapter
 * stands on Chapter VIII's deck, so its painting is Chapter VIII's, **by reference**: `EXP_FAYTH_PLATE` is that file's stem, `plateKeyOfScene` (`src/data/art/scenePlate.ts`) turns the scene key into it at every
 * lookup that builds a backdrop path from a chapter's scene key, and no art file was copied or made.
 *
 * Pins: the plate is Chapter VIII's (the same stem as its `sceneKey` and as the deck scene's own plate), every other scene key still names its own file, and each place the chapter asks for a painting asks
 * for that one: the prep's wash (the real screen, mounted), the pre-battle scene's backdrop and its preload list, the battle preload's plate, and the card's `backdropKey` (a source guard on the two screens that
 * pass it, since both need a battle to run). Where the art is on disk, the manifest lists the file; nothing in the chapter's own flow names the scene key as a file.
 *
 * Game case: FFX only (the deck is Chapter VIII's, an FFX chapter's).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { PartyPrepScreen } from '../../../src/app/screens/PartyPrepScreen.ts';
import { plateUrlFor } from '../../../src/app/screens/battlePreload.ts';
import { sceneArtUrls, stageScene } from '../../../src/app/screens/sceneArt.ts';
import { plateKeyOfScene } from '../../../src/data/art/scenePlate.ts';
import { CHAPTERS, EVRAE_AIRSHIP, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { EXP_FAYTH_ID, EXP_FAYTH_PLATE, EXP_FAYTH_SCENE } from '../../../src/data/ffx/exp-fayth-ids.ts';
import { EVRAE_DECK_PLATE } from '../../../src/scenes/evrae-airship-deck.ts';

const chapter = getChapter(EXP_FAYTH_ID)!;
const DECK_FILE = 'art/backdrops/evrae-airship-deck.png';
const MISSING = 'exp-fayth-deck';

const ROOT = resolve(__dirname, '..', '..', '..'); // (a URL built in this jsdom environment is jsdom's, which `fs` does not take)
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');

describe('the plate is Chapter VIII\'s, by reference', () => {
  it('is the file stem of Chapter VIII\'s scene and of the deck scene\'s own plate, and the scene key is not a file', () => {
    expect(EXP_FAYTH_PLATE).toBe(EVRAE_AIRSHIP.sceneKey);
    expect(EXP_FAYTH_PLATE).toBe(EVRAE_DECK_PLATE);
    expect(EXP_FAYTH_SCENE).toBe(MISSING);
    expect(plateKeyOfScene(EXP_FAYTH_SCENE)).toBe(EXP_FAYTH_PLATE);
    expect(chapter.sceneKey).toBe(EXP_FAYTH_SCENE); // the scene registry still finds the chapter's own scene by it
  });

  it('every other scene key still names its own painting (the alias is one row), and a missing key stays missing', () => {
    for (const c of [...CHAPTERS, ...EXPERIMENT_CHAPTERS]) {
      if (c.sceneKey === EXP_FAYTH_SCENE) continue;
      expect(plateKeyOfScene(c.sceneKey), c.id).toBe(c.sceneKey);
    }
    expect(plateKeyOfScene(undefined)).toBeUndefined();
    expect(plateKeyOfScene('')).toBe('');
    expect(plateKeyOfScene('constructor')).toBe('constructor'); // a plain table lookup would answer with Object's own member
  });
});

describe('every place the chapter asks for a painting asks for the deck', () => {
  it('the party prep\'s wash (the real screen, mounted)', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const prep = new PartyPrepScreen({ chapter });
    prep.root = root;
    prep.app = { fade: () => Promise.resolve() } as unknown as PartyPrepScreen['app'];
    prep.enter();
    const wash = root.querySelector<HTMLElement>('.prep__wash')!;
    expect(wash.getAttribute('style')).toContain(DECK_FILE);
    expect(root.innerHTML).not.toContain(MISSING);
  });

  it('the pre-battle scene: its backdrop goes up on the screen, and the preload\'s list names the deck first and never the scene key', () => {
    const root = document.createElement('div');
    stageScene(root, chapter.scriptsRef.pre, chapter.sceneKey, true, () => false); // no image pipeline here: the decoded backdrop is applied at once
    expect(root.style.backgroundImage).toContain(DECK_FILE);
    const urls = sceneArtUrls(chapter.scriptsRef.pre, chapter.sceneKey);
    expect(urls.first[0]).toContain(DECK_FILE);
    for (const u of [...urls.first, ...urls.rest]) expect(u).not.toContain(MISSING);
  });

  it('the battle preload\'s plate', () => {
    expect(plateUrlFor(chapter.sceneKey)).toContain(DECK_FILE);
    expect(plateUrlFor('gagazet')).toContain('art/backdrops/gagazet.png'); // an ordinary chapter: as before
  });

  it('the battle-start card\'s backdrop (the card on the entry transition and the one over the battle): both screens pass the plate key, never the scene key', () => {
    for (const file of ['src/app/screens/BattleScreen.ts', 'src/app/screens/entryCard.ts']) {
      const src = read(file);
      expect(src, file).toContain('backdropKey: plateKeyOfScene(chapter.sceneKey)');
      expect(src, file).not.toMatch(/backdropKey:\s*chapter\.sceneKey/);
    }
  });

  it('nothing the chapter\'s own flow builds a painting path from is the scene key itself: the two lookups that read a scene key (the prep and the scene\'s backdrop) go through the helper', () => {
    for (const file of ['src/app/screens/PartyPrepScreen.ts', 'src/app/screens/sceneArt.ts']) {
      const src = read(file);
      expect(src, file).toContain('plateKeyOfScene(');
      expect(src, file).not.toMatch(/art\/backdrops\/\$\{(this\.chapter\.)?sceneKey\}/);
    }
  });
});

describe('against the art on this disk', () => {
  const manifestPath = resolve(ROOT, 'public', 'art', 'manifest.json');
  const onDisk = existsSync(manifestPath);

  it.skipIf(!onDisk)('the art manifest lists the deck painting, so the chapter\'s every request is for a file that ships', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { backdrops: string[] };
    expect(manifest.backdrops).toContain(EXP_FAYTH_PLATE);
    expect(manifest.backdrops).toContain(EVRAE_AIRSHIP.sceneKey); // Chapter VIII's own: the same file
  });
});
