// @vitest-environment jsdom
/**
 * r44-thumbs (both games: one shared board): the rail's strips paint a small copy of each card's two paintings, and the full picture loads
 * when it is shown. This file pins the board's half: which paintings the strips use (the strip list is the board's own, recomputed here), what
 * the markup asks for (a card the small copy, a plate the full picture), the fallback to the full picture if a small copy cannot be loaded, and
 * the plates fetched ahead of the cursor so a press finds the next plate there.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const asked: Array<{ urls: readonly string[]; lane: string | undefined }> = [];
vi.mock('../../src/app/imageWarm.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/app/imageWarm.ts')>();
  return {
    ...real,
    warmImages: (urls: readonly string[], lane?: Parameters<typeof real.warmImages>[1]) => {
      asked.push({ urls: [...urls], lane });
      return real.warmImages(urls, lane);
    },
  };
});

import strip from '../../src/data/art/strip-art.json';
import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { PLATE_AHEAD, aheadCards, cursorOrder, plateAheadFrom, pressesFrom, reachFrom } from '../../src/app/screens/frontend/boardAhead.ts';
import { cardHtml, heroHtml, railHtml } from '../../src/app/screens/frontend/chapterCards.ts';
import { buildChapterTiles, groupChapterTiles, type ChapterTile } from '../../src/app/screens/frontend/chapterGrid.ts';
import { LAZY_FULL, LAZY_PLACEHOLDER, LAZY_SRC, heroPlates, mountLazyPlates } from '../../src/app/screens/frontend/lazyPlates.ts';
import { compositionFor, plateArtHtml } from '../../src/app/screens/frontend/chapterPlates.ts';
import { platesAhead, platesAheadByCard } from '../../src/app/screens/frontendWarm.ts';
import { resetImageWarm, warmQueueState } from '../../src/app/imageWarm.ts';
import { resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';
import { setShippedArt, setThumbArt } from '../../src/engine/ArtShipped.ts';
import { artUrl } from '../../src/engine/PaintedArt.ts';

const save = { isCleared: () => false, chapter: () => ({ bestTimeMs: null }) };
const tiles = (): ChapterTile[] => buildChapterTiles(save as never);

/** The map a production build inserts (`tools/art-thumbs.mjs`): a WebP for a scene, a PNG for a boss. */
const thumbMap = (): Record<string, string> =>
  Object.fromEntries(strip.masters.map((m) => [m, m.replace(/\.png$/, m.startsWith('art/backdrops/') ? '.thumb.webp' : '.thumb.png')]));
const SMALL = /\.thumb\.(?:webp|png)(?=["?#]|$)/;

afterEach(() => {
  setThumbArt(undefined);
  setShippedArt(undefined);
  resetArtManifest();
  resetImageWarm();
  vi.unstubAllGlobals();
});

describe('the strip list is the board\'s own', () => {
  it('names exactly the scene and the boss painting that every card of the board paints, and no other', () => {
    const wanted = new Set<string>();
    for (const t of tiles()) {
      if (t.sceneKey) wanted.add(`art/backdrops/${t.sceneKey}.png`);
      for (const layer of compositionFor(t).layers) if (layer.card) wanted.add(`art/characters/${layer.key}/idle.png`);
    }
    expect([...strip.masters].sort(), 'a chapter or a card placement changed: update src/data/art/strip-art.json').toEqual([...wanted].sort());
    expect(strip.masters).toHaveLength(36);
  });

  it('is sorted, and every master it names is a file of public/art where the art is there', () => {
    expect([...strip.masters]).toEqual([...strip.masters].sort());
    const art = join(process.cwd(), 'public', 'art');
    if (!existsSync(art)) return; // a checkout without the art (it is gitignored): nothing to look at
    for (const m of strip.masters) expect(existsSync(join(process.cwd(), 'public', m)), m).toBe(true);
  });
});

describe('what the markup asks for', () => {
  /** The values of an attribute over a piece of markup, in order. */
  const values = (html: string, attr: string): string[] => [...html.matchAll(new RegExp(`${attr}="([^"]*)"`, 'g'))].map((m) => m[1]!);

  it('a card asks for the small copy of each painting and names the full one behind it; the plate asks for the full picture', () => {
    setThumbArt(thumbMap());
    setShippedArt(['art/backdrops/via-infinito.png']);
    const trema = tiles().find((t) => t.id === 'ffx2-trema')!;
    const card = plateArtHtml(trema, 'card');
    expect(card).toContain(`${LAZY_SRC}="${artUrl('art/backdrops/via-infinito.png').replace('.webp', '.thumb.webp')}"`);
    expect(card).toContain(`${LAZY_FULL}="${artUrl('art/backdrops/via-infinito.png')}"`);
    expect(card).toContain(`${LAZY_SRC}="/art/characters/trema/idle.thumb.png"`);
    expect(card).toContain(`${LAZY_FULL}="/art/characters/trema/idle.png"`);
    expect(card).not.toContain(LAZY_PLACEHOLDER); // a strip is the small copy already
    const hero = plateArtHtml(trema, 'hero');
    expect(values(hero, LAZY_SRC)).toEqual([artUrl('art/backdrops/via-infinito.png'), '/art/characters/trema/idle.png']); // what the plate fetches is the full picture, nothing else
    expect(hero).not.toContain(LAZY_FULL);
  });

  it('a plate shows the small copy of each painting at once, right under its full picture, until that is up', () => {
    setThumbArt(thumbMap());
    setShippedArt(['art/backdrops/via-infinito.png']);
    const trema = tiles().find((t) => t.id === 'ffx2-trema')!;
    const hero = plateArtHtml(trema, 'hero');
    const imgs = [...hero.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    expect(imgs).toHaveLength(4); // [small scene] [scene] [small boss] [boss]
    expect(imgs.map((i) => i.includes(LAZY_PLACEHOLDER))).toEqual([true, false, true, false]);
    expect(imgs[0]).toContain(`src="${artUrl('art/backdrops/via-infinito.png').replace('.webp', '.thumb.webp')}"`);
    expect(imgs[0]).not.toContain(LAZY_SRC);
    expect(imgs[2]).toContain('src="/art/characters/trema/idle.thumb.png"');
    // The small copy sits exactly where the full picture will: same classes and the same placement.
    const style = (img: string): string => /style="([^"]*)"/.exec(img)![1]!;
    expect(style(imgs[0]!)).toBe(style(imgs[1]!));
    expect(style(imgs[2]!)).toBe(style(imgs[3]!));
    expect(imgs[0]).toContain('class="cs-art__scene cs-art__ph"');
    expect(imgs[2]).toContain('class="cs-art__boss cs-art__ph"');
  });

  it('the whole rail is small copies, one scene and one boss a card, and no plate of the board fetches one', () => {
    setThumbArt(thumbMap());
    const all = tiles();
    const rail = railHtml(groupChapterTiles(all), all, 0);
    const imgs = [...rail.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    expect(imgs).toHaveLength(36);
    for (const img of imgs) {
      expect(img).toMatch(SMALL);
      expect(img).toContain(LAZY_FULL);
    }
    all.forEach((t, i) => {
      const hero = heroHtml(t, i);
      for (const url of values(hero, LAZY_SRC)) expect(url, t.id).not.toMatch(SMALL);
      // A small copy sits under each picture the strips have one of (a layer only the plate shows, Mortiorchis behind Seymour, has none).
      const withSmallCopy = values(hero, LAZY_SRC).filter((u) => (strip.masters as readonly string[]).includes(u.replace(/^\//, ''))).length;
      expect(hero.split(LAZY_PLACEHOLDER).length - 1, `${t.id} has a small copy under each of its pictures`).toBe(withSmallCopy);
      expect(withSmallCopy, t.id).toBeGreaterThan(0);
      expect(cardHtml(t, i, false), t.id).toMatch(SMALL);
    });
  });

  it('without thumbnails in the build the card and the plate are the pictures they were before r44: the full URL, no placeholder, nothing to fall back to', () => {
    for (const map of [undefined, null]) {
      setThumbArt(map);
      const trema = tiles().find((t) => t.id === 'ffx2-trema')!;
      for (const where of ['card', 'hero'] as const) {
        const html = plateArtHtml(trema, where);
        expect(html).not.toMatch(SMALL);
        expect(html).not.toContain(LAZY_FULL);
        expect(html).not.toContain(LAZY_PLACEHOLDER);
        expect(html).toContain(`${LAZY_SRC}="${artUrl('art/backdrops/via-infinito.png')}"`);
      }
    }
  });
});

describe('a strip never goes blank for a thumbnail that failed (the fallback to the full picture)', () => {
  interface Fake {
    src: string;
    settle: (ok: boolean) => void;
  }
  let started: Fake[] = [];
  const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

  beforeEach(() => {
    resetImageWarm();
    setArtManifest(null);
    started = [];
    class FakeImage {
      decoding = '';
      private _src = '';
      private done: ((ok: boolean) => void) | null = null;
      get src(): string {
        return this._src;
      }
      set src(v: string) {
        this._src = v;
        if (!v) this.done?.(false);
      }
      removeAttribute(name: string): void {
        if (name === 'src') this.src = '';
      }
      decode(): Promise<void> {
        const src = this._src;
        return new Promise<void>((resolve, reject) => {
          this.done = (ok) => (ok ? resolve() : reject(new Error('no')));
          started.push({ src, settle: (ok) => this.done?.(ok) });
        });
      }
    }
    vi.stubGlobal('Image', FakeImage);
  });

  const stripOf = (): { root: HTMLElement; scene: HTMLImageElement; boss: HTMLImageElement } => {
    const trema = tiles().find((t) => t.id === 'ffx2-trema')!;
    const root = document.createElement('div');
    root.innerHTML = `<div data-action="fe-card-0">${plateArtHtml(trema, 'card')}</div>`;
    return { root, scene: root.querySelector<HTMLImageElement>('.cs-art__scene')!, boss: root.querySelector<HTMLImageElement>('.cs-art__boss')! };
  };
  const settle = (suffix: string, ok: boolean): void => started.find((s) => s.src.endsWith(suffix))!.settle(ok);

  it('a thumbnail that loads is what the strip shows, and the full picture is never asked for', async () => {
    setThumbArt(thumbMap());
    const { root, scene, boss } = stripOf();
    mountLazyPlates(root, 0);
    await tick();
    settle('via-infinito.thumb.webp', true);
    settle('trema/idle.thumb.png', true);
    await tick();
    await tick();
    expect(scene.getAttribute('src')).toMatch(/via-infinito\.thumb\.webp$/);
    expect(boss.getAttribute('src')).toMatch(/trema\/idle\.thumb\.png$/);
    expect(scene.hasAttribute(LAZY_FULL)).toBe(false);
    expect(started.map((s) => s.src).some((u) => !SMALL.test(u))).toBe(false);
  });

  it('a thumbnail that fails to load (a 404, a file that will not decode) sends the strip to the full picture', async () => {
    setThumbArt(thumbMap());
    const { root, scene, boss } = stripOf();
    mountLazyPlates(root, 0);
    await tick();
    settle('via-infinito.thumb.webp', false);
    settle('trema/idle.thumb.png', false);
    await tick();
    await tick();
    // Nothing is shown yet; the full pictures are asked for in the idle lane.
    expect(scene.getAttribute('src')).toBeNull();
    expect(started.some((s) => s.src.endsWith('via-infinito.png'))).toBe(true);
    expect(started.some((s) => s.src.endsWith('trema/idle.png'))).toBe(true);
    expect(warmQueueState().loading.idle).toBeGreaterThan(0);
    settle('via-infinito.png', true);
    settle('trema/idle.png', true);
    await tick();
    await tick();
    expect(scene.getAttribute('src')).toBe(artUrl('art/backdrops/via-infinito.png'));
    expect(boss.getAttribute('src')).toBe('/art/characters/trema/idle.png');
    expect(scene.hasAttribute(LAZY_SRC)).toBe(false);
    expect(scene.hasAttribute(LAZY_FULL)).toBe(false);
  });

  it('a plate takes its small copy away when the full picture is up, and keeps it when the full picture is not there', async () => {
    setThumbArt(thumbMap());
    const trema = tiles().find((t) => t.id === 'ffx2-trema')!;
    const part = document.createElement('div');
    document.body.appendChild(part); // the board puts a picture up only while it is on the page
    part.innerHTML = heroHtml(trema, 0);
    const slots = (): string[] => [...part.querySelectorAll('.cs-art > img')].map((i) => (i.hasAttribute(LAZY_PLACEHOLDER) ? 'small' : i.hasAttribute(LAZY_SRC) ? 'waiting' : 'full'));
    expect(slots()).toEqual(['small', 'waiting', 'small', 'waiting']);
    heroPlates()([part], null, null);
    await tick();
    expect(slots()).toEqual(['small', 'waiting', 'small', 'waiting']); // asked for, not here yet: the plate is soft, not empty
    settle('via-infinito.png', true);
    await tick();
    await tick();
    expect(slots()).toEqual(['full', 'small', 'waiting']); // the scene is up and its small copy gone; the boss still shows its own
    settle('trema/idle.png', true);
    await tick();
    await tick();
    expect(slots()).toEqual(['full', 'full']); // the plate is the plate it always was
    expect(part.querySelector('.cs-art__scene')!.getAttribute('src')).toBe(artUrl('art/backdrops/via-infinito.png'));
    part.remove();
  });

  it('a plate whose full picture is judged absent keeps the small copy (soft, not empty)', async () => {
    setThumbArt(thumbMap());
    setArtManifest({ version: 1, generatedAt: 't', subjects: {}, portraits: [], backdrops: [], pause: [], pause2x: [], title: [], title2x: [] }); // no such backdrop on disk
    const trema = tiles().find((t) => t.id === 'ffx2-trema')!;
    const part = document.createElement('div');
    document.body.appendChild(part);
    part.innerHTML = heroPlatesMarkup(trema);
    heroPlates()([part], null, null);
    await tick();
    await tick();
    const scene = [...part.querySelectorAll('.cs-art__scene')];
    expect(scene).toHaveLength(1); // the full scene removed itself; the small copy stays
    expect(scene[0]!.hasAttribute(LAZY_PLACEHOLDER)).toBe(true);
    part.remove();
  });

  it('a strip whose thumbnail AND full picture are both gone removes itself, as a missing strip always did', async () => {
    setThumbArt(thumbMap());
    setArtManifest({ version: 1, generatedAt: 't', subjects: {}, portraits: [], backdrops: [], pause: [], pause2x: [], title: [], title2x: [] }); // the manifest knows no such backdrop
    const { root } = stripOf();
    mountLazyPlates(root, 0);
    await tick();
    await tick();
    // The thumbnail is not in the manifest's judgement (null: cannot say), so it is asked for; it fails; the full picture is judged absent.
    settle('via-infinito.thumb.webp', false);
    await tick();
    await tick();
    expect(root.querySelector('.cs-art__scene')).toBeNull();
  });
});

/** The plate of a tile, as the board builds it. */
const heroPlatesMarkup = (tile: ChapterTile): string => heroHtml(tile, 0);

describe('the cursor, and the plates fetched ahead of it', () => {
  it('counts the presses to every card (left or right, wrapping; one for the first card of the other game) and ranks equals: on, the other game, back', () => {
    const all = tiles();
    const p = pressesFrom(all, 0);
    expect(p.get(1)).toBe(1);
    expect(p.get(all.length - 1)).toBe(1); // the cursor wraps
    expect(p.get(11)).toBe(1); // up or down: the first card of X-2 (11 FFX cards come first)
    expect(p.get(2)).toBe(2);
    expect(p.get(all.length - 2)).toBe(2);
    expect(p.get(6)).toBe(6);
    expect(p.has(0)).toBe(false);
    expect(reachFrom(all, 0).get(1)).toEqual({ presses: 1, rank: 0 });
    expect(reachFrom(all, 0).get(11)).toEqual({ presses: 1, rank: 1 });
    expect(reachFrom(all, 0).get(17)).toEqual({ presses: 1, rank: 2 });
    expect(cursorOrder(all, 0).slice(0, 5)).toEqual([1, 11, 17, 2, 16]);
    // From the middle of a game the card on is first, then the other game, then the card behind.
    expect(cursorOrder(all, 5).slice(0, 5)).toEqual([6, 11, 4, 7, 3]);
    expect(aheadCards(all, 0, 2)).toEqual([1, 11, 17, 2, 16]);
    expect(aheadCards(all, 0, 1)).toEqual([1, 11, 17]);
    expect(aheadCards(all, 0, 0)).toEqual([]);
    expect(aheadCards(all, 5, 1)).toEqual([6, 11, 4]);
    expect(aheadCards(all, 5, 2)).toEqual([6, 11, 4, 7, 3]);
    // The default reach is one press: the next card, the other game's first, the one behind.
    expect(PLATE_AHEAD).toBe(1);
    expect(aheadCards(all, 5)).toEqual([6, 11, 4]);
  });

  it('skips a COMING card: the cursor never lands on it, so its plate is never fetched', () => {
    const base = tiles();
    const some = [base[0]!, { ...base[1]!, playable: false }, base[2]!, base[3]!];
    expect(pressesFrom(some, 0).has(1)).toBe(false);
    expect(aheadCards(some, 0, 1).includes(1)).toBe(false);
    expect(aheadCards(some, 0, 1)[0]).toBe(2); // the next playable card is one press on
  });

  it('reads the reach from the address (?ahead=N for the measurements), and ignores nonsense', () => {
    expect(plateAheadFrom('')).toBe(PLATE_AHEAD);
    expect(plateAheadFrom('?ahead=0')).toBe(0);
    expect(plateAheadFrom('?coach=off&ahead=4')).toBe(4);
    expect(plateAheadFrom('?ahead=-1')).toBe(PLATE_AHEAD);
    expect(plateAheadFrom('?ahead=10')).toBe(PLATE_AHEAD);
    expect(plateAheadFrom('?ahead=two')).toBe(PLATE_AHEAD);
    expect(plateAheadFrom('?ahead=')).toBe(PLATE_AHEAD);
    expect(plateAheadFrom('?ahead=3', 1)).toBe(3);
    expect(plateAheadFrom('?x=1', 3)).toBe(3);
  });

  it('fetches the full plates of the cards a press away, the next card first, and of no other card', () => {
    setThumbArt(thumbMap());
    const all = tiles();
    const sceneOf = (i: number): string => artUrl(`art/backdrops/${all[i]!.sceneKey}.png`);
    const urls = platesAhead(all, 0);
    for (const i of aheadCards(all, 0)) expect(urls, all[i]!.id).toContain(sceneOf(i));
    expect(urls[0]).toBe(sceneOf(1)); // the next card's scene leads
    for (const i of [0, 2, 4, 6, 8, 9, 14, 16]) expect(urls, all[i]!.id).not.toContain(sceneOf(i)); // the selected card's own plate is loaded when it is shown; the rest are not near
    expect(urls.some((u) => SMALL.test(u))).toBe(false); // a plate is always the full picture
    expect(platesAhead(all, 0, 0)).toEqual([]);
    expect(platesAhead(all, 0, 2)).toContain(sceneOf(2));
    // One list a card, the next card's first: the board gives that list a lane of its own.
    const byCard = platesAheadByCard(all, 0);
    expect(byCard).toHaveLength(3);
    expect(byCard[0]).toContain(sceneOf(1));
    expect(byCard.flat()).toEqual(urls);
  });
});

describe('the board warms the plates ahead as the cursor moves', () => {
  let screen: ChapterSelectScreen | null = null;
  let input: Input | null = null;
  let root: HTMLElement | null = null;
  let now = 0;
  const frame = (): void => {
    now += 250;
    screen!.handleInput(input!.update(now));
    input!.endFrame();
  };
  const key = (code: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
    frame();
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
  };

  beforeEach(() => {
    window.localStorage.clear();
    asked.length = 0;
    now = 0;
    root = document.createElement('div');
    document.body.appendChild(root);
    input = new Input({ pointerRoot: root });
    input.attach();
    forgetBoardChapter();
    screen = new ChapterSelectScreen();
    screen.root = root;
    screen.app = { save: new SaveStore(), fade: () => Promise.resolve() } as unknown as ChapterSelectScreen['app'];
    setThumbArt(thumbMap());
  });
  afterEach(() => {
    screen?.exit();
    input?.detach();
    root?.remove();
    screen = input = root = null;
  });

  it('asks for the plates of the cards a press away when it opens (all of them in the idle lane), and again after each move, the next card ahead of the idle queue', () => {
    screen!.enter();
    const all = tiles();
    const sceneOf = (i: number): string => artUrl(`art/backdrops/${all[i]!.sceneKey}.png`);
    const plateCalls = (): Array<{ urls: readonly string[]; lane: string | undefined }> => asked.filter((a) => a.urls.some((u) => !SMALL.test(u) && u.includes('art/backdrops/')));
    const opening = plateCalls();
    expect(opening.length).toBeGreaterThan(0);
    // Nobody has pressed anything: the whole window waits its turn, so the first paint's own set and the music have the pipe.
    expect(opening.find((a) => a.urls.includes(sceneOf(1)))?.lane).toBe('idle');
    expect(opening.find((a) => a.urls.includes(sceneOf(11)))?.lane).toBe('idle'); // the other game's first card
    expect(new Set(opening.flatMap((a) => a.urls)).has(sceneOf(8))).toBe(false);
    asked.length = 0;
    for (let i = 0; i < 6; i++) key('ArrowRight'); // the cursor is on card 6 now
    expect(screen!.snapshot()['selectedIndex']).toBe(6);
    const after = new Set(plateCalls().flatMap((a) => a.urls));
    expect(after.has(sceneOf(7))).toBe(true); // the next card, one press on from where the cursor stands
    expect(after.has(sceneOf(11))).toBe(true); // and the other game's first card, one press away
    expect(after.has(sceneOf(8))).toBe(false); // two presses on is still not asked for
    expect(after.has(sceneOf(14))).toBe(false); // a far card is not asked for
    // A hand is on the keys: the card it reaches for next goes ahead of the idle queue (every other card's faces), the rest waits in it.
    expect(plateCalls().find((a) => a.urls.includes(sceneOf(7)))?.lane).toBe('normal');
    expect(plateCalls().find((a) => a.urls.includes(sceneOf(11)))?.lane).toBe('idle');
  });

  it('paints the rail with the small copies and the plate with the full picture, in the mounted board', () => {
    screen!.enter();
    const strips = [...root!.querySelectorAll<HTMLImageElement>('.fe-rail img')];
    expect(strips).toHaveLength(36);
    for (const img of strips) expect(img.getAttribute('src') ?? img.getAttribute(LAZY_SRC) ?? '').toMatch(SMALL);
    const plate = [...root!.querySelectorAll<HTMLImageElement>('.fe-hero img')];
    expect(plate.length).toBeGreaterThan(0);
    // What the plate fetches is the full picture; what it shows meanwhile is the strip's own small copy.
    for (const img of plate) {
      if (img.hasAttribute(LAZY_PLACEHOLDER)) expect(img.getAttribute('src')).toMatch(SMALL);
      else expect(img.getAttribute('src') ?? img.getAttribute(LAZY_SRC) ?? '').not.toMatch(SMALL);
    }
    // (jsdom has no image pipeline, so the board puts every full picture up at once and the small copies under them are already gone.)
  });
});
