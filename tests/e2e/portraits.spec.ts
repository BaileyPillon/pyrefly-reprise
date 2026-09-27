/**
 * Portraits under the production base path.
 *
 * This suite exists because of a bug that **only** showed up on the deployed
 * site (https://baileypillon.github.io/pyrefly-reprise/): the FFX CTB queue
 * rendered ink monograms — `T`, `K`, `Y` — where Tidus, Kimahri and Yuna's
 * faces belong, while Seymour Flux and Mortiorchis showed real crops.
 *
 * Two things make that class of bug invisible to the rest of the suite:
 *
 * 1. **The base path.** Every art URL is built by `engine/PaintedArt.ts`'s
 *    `artUrl()`, which prefixes `import.meta.env.BASE_URL` — `/` in dev,
 *    `/pyrefly-reprise/` in a production build. A hand-written `/art/...`
 *    string works perfectly at `npm run dev` and 404s on Pages. Playwright
 *    runs against `vite preview`, which serves the *built* bundle under the
 *    production base (see `playwright.config.ts`), so this file is the only
 *    place that exercises the shipped URLs.
 * 2. **Stacking, not loading.** The actual cause here was neither: the PNGs
 *    loaded fine and the monogram was simply painted *on top of* them, because
 *    the fallback `<span>` was positioned and the portrait `<img>` was not
 *    (`ui/ffx/portraits.ts`). So asserting "the image 200s" is not enough —
 *    these tests assert the portrait layer actually wins its tile.
 *
 * Every test also fails on any 4xx/5xx for an `art/` request, which is the
 * cheap, screen-agnostic half of the base-path guard.
 */

import { expect, test, type Page, type Response } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import './support/pyrefly-window.ts';
import type { ChapterId } from '../../src/data/encounters.ts';

/**
 * `src/ui/common/face-crops.json`'s `fx`/`fy`, read directly off disk rather
 * than through `ui/common/portrait.ts`'s own import of it: that file is built
 * for Vite, whose bundler resolves a bare `.json` import for it; Playwright's
 * Node-ESM loader for *this* file cannot ("needs an import attribute of
 * 'type: json'"), and the rest of `portrait.ts` (DOM listeners guarded by
 * `typeof document`) is more than this file needs anyway. The two fallbacks
 * mirror `DEFAULT_CROP`/`GENERIC_BODY_CROP` there; kept in sync by
 * `tests/unit/ui-portrait-face-crop.test.ts`, which reads the same JSON and
 * every id `portraitImgHtml`/`bodyFaceImgHtml` can emit.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const FACE_CROPS = JSON.parse(
  readFileSync(join(HERE, '..', '..', 'src', 'ui', 'common', 'face-crops.json'), 'utf8'),
) as { portraits: Record<string, { fx: number; fy: number }>; bodies: Record<string, { fx: number; fy: number }> };
const DEFAULT_CROP = { fx: 0.5, fy: 0.295 };
const GENERIC_BODY_CROP = { fx: 0.5, fy: 0.15 };
function portraitCrop(id: string): { fx: number; fy: number } {
  return FACE_CROPS.portraits[id] ?? DEFAULT_CROP;
}
function bodyCrop(id: string): { fx: number; fy: number } {
  return FACE_CROPS.bodies[id] ?? GENERIC_BODY_CROP;
}

/** One portrait/crop layer inside a chip, as read back out of the DOM. */
interface Layer {
  tag: string;
  src: string | null;
  /** `naturalWidth`: 0 until the bytes land, and 0 forever on a 404. */
  natural: number;
  z: number;
  width: number;
  height: number;
}

interface Row {
  actor: string;
  layers: Layer[];
  /** The monogram `<span>`, which must lose to a loaded portrait above it. */
  fallbackZ: number | null;
  fallbackText: string;
}

/** Art requests that came back 4xx/5xx — a base-path mistake's signature. */
function watchArt404s(page: Page): string[] {
  const bad: string[] = [];
  page.on('response', (res: Response) => {
    const url = res.url();
    if (res.status() >= 400 && /\/art\//.test(url)) bad.push(`${res.status()} ${url}`);
  });
  return bad;
}

async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30_000 });
}

/**
 * Switch screens and wait for its art to be requested and settled.
 *
 * Two bounded waits rather than one long frame pump. `__pyrefly.frames()`
 * rides the app's own rAF loop, so a stalled loop would hang the whole suite
 * instead of failing a test — hence the race. And a frame *count* is the wrong
 * thing to wait on anyway: what these tests need is the network, so the second
 * wait is on the images themselves. `complete` goes true on a 404 as well as a
 * 200, which is exactly right here: it means "the browser is done with this
 * URL", and whether it came back with pixels is what the assertions are for.
 */
async function show(page: Page, screen: string): Promise<void> {
  const ok = await page.evaluate((s) => window.__pyrefly!.goto(s), screen);
  expect(ok, `__pyrefly.goto("${screen}") must resolve to a registered screen`).toBe(true);

  await page.evaluate(
    () =>
      Promise.race([
        window.__pyrefly!.frames(12),
        new Promise<void>((resolve) => setTimeout(resolve, 8_000)),
      ]) as Promise<unknown>,
  );

  await page
    .waitForFunction(
      () => {
        const art = [...document.querySelectorAll('img')].filter((i) => /\/art\//.test(i.src));
        return art.length > 0 && art.every((i) => i.complete);
      },
      null,
      { timeout: 20_000 },
    )
    // A screen that genuinely paints no art must still reach its assertions
    // with a real message, not die here on a bare timeout.
    .catch(() => undefined);
}

/**
 * Raise the FFX battle HUD and wait for it to have real geometry.
 *
 * `goto('battle')` stages the encounter but leaves the HUD down: FFX's own
 * opening (`engine/BattleMoments.ts` `battleStart`) keeps the CTB list and
 * command window off-screen for the party slide and boss reveal, and only
 * raises them on the way out — and a `goto()` straight to the screen never
 * runs that opening, so `FFXBattleHud.el.hidden` stays `true` indefinitely.
 * A hidden ancestor gives every tile a 0x0 box, which is indistinguishable
 * from a portrait that failed to paint if you only read `getBoundingClientRect`.
 *
 * `trigger('hud:on')` is `BattleScreen`'s own debug hook for exactly this
 * (`BattleScreen.trigger`), so this stays a test of the portrait chips rather
 * than of the opening cinematic — which is `bp1-moments`' territory and, under
 * SwiftShader, minutes of animation before a single tile is legible.
 */
async function raiseHud(page: Page): Promise<void> {
  const ok = await page.evaluate(() => window.__pyrefly!.trigger('hud:on'));
  expect(ok, 'the battle screen must accept the "hud:on" debug trigger').toBe(true);
  await page.evaluate(() => window.__pyrefly!.frames(4));
  await page.waitForFunction(
    () => {
      const hud = document.querySelector<HTMLElement>('.ffxhud');
      if (!hud || hud.hidden) return false;
      const rows = [...hud.querySelectorAll('.ig-ctb__row')];
      return rows.length > 1 && rows.every((r) => r.getBoundingClientRect().width > 0);
    },
    null,
    { timeout: 15_000 },
  );
}

/**
 * Raise the FFX-2 battle HUD's party window and wait for its rows to have
 * real geometry — the same "hud:on" hook {@link raiseHud} uses, checked
 * against `.ffx2hud__party`'s own row markup (`ui/ffx2/PartyRows.ts`)
 * instead of the FFX CTB list's.
 */
async function raiseFfx2Party(page: Page): Promise<void> {
  const ok = await page.evaluate(() => window.__pyrefly!.trigger('hud:on'));
  expect(ok, 'the battle screen must accept the "hud:on" debug trigger').toBe(true);
  await page.evaluate(() => window.__pyrefly!.frames(4));
  await page.waitForFunction(
    () => {
      const rows = [...document.querySelectorAll<HTMLElement>('.ffx2hud__party [data-actor-id]')];
      return rows.length > 0 && rows.every((r) => r.getBoundingClientRect().width > 0);
    },
    null,
    { timeout: 15_000 },
  );
}

/** One chip's DOM read-back: its tile box, its layers and its fallback monogram. */
interface Chip {
  actor: string;
  tile: { width: number; height: number };
  layers: Array<Layer & { id: string | null; body: boolean; style: string; naturalH: number }>;
  fallbackZ: number | null;
  fallbackText: string;
}

/**
 * Every chip under `rowSelector`, reading each row's `data-actor`/
 * `data-actor-id`, the face tile inside it (`faceSelector`, or the row itself
 * when there is none), its `<img>` layers and its fallback monogram
 * (`fallbackSelector`). Shared between the FFX CTB list and the FFX-2 party
 * window, whose markup differs but whose shape (a monogram floor under
 * stacked portrait layers, `ui/common/portrait.ts`) does not.
 */
async function collectChips(
  page: Page,
  rowSelector: string,
  faceSelector: string | null,
  fallbackSelector: string,
): Promise<Chip[]> {
  return page.evaluate(
    ({ rowSelector, faceSelector, fallbackSelector }) => {
      return [...document.querySelectorAll<HTMLElement>(rowSelector)].map((row) => {
        const face = (faceSelector ? row.querySelector<HTMLElement>(faceSelector) : null) ?? row;
        const tile = face.getBoundingClientRect();
        const fb = row.querySelector<HTMLElement>(fallbackSelector);
        return {
          actor: row.dataset['actor'] ?? row.dataset['actorId'] ?? '?',
          tile: { width: tile.width, height: tile.height },
          layers: [...face.querySelectorAll('img')].map((img) => {
            const box = img.getBoundingClientRect();
            return {
              id: img.getAttribute('data-face-crop'),
              body: img.hasAttribute('data-face-body'),
              tag: img.tagName,
              src: img.getAttribute('src'),
              natural: img.naturalWidth,
              naturalH: img.naturalHeight,
              z: Number(getComputedStyle(img).zIndex) || 0,
              width: box.width,
              height: box.height,
              style: img.getAttribute('style') ?? '',
            };
          }),
          fallbackZ: fb ? Number(getComputedStyle(fb).zIndex) || 0 : null,
          fallbackText: fb?.textContent ?? '',
        };
      });
    },
    { rowSelector, faceSelector, fallbackSelector },
  );
}

/** One `prop:N%` declaration out of an inline `style` attribute. */
function parsePct(style: string, prop: string): number | null {
  const m = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*(-?[\\d.]+)%`).exec(style);
  return m ? Number(m[1]) : null;
}

/**
 * Whether a chip's measured head point — {@link portraitCrop}/{@link
 * bodyCrop}'s `fx`/`fy` for this layer's id — lands inside the tile it is
 * cropped into, given the tile's box and the layer's own inline placement.
 *
 * `cropStyle` (`ui/common/portrait.ts`) guarantees the *image* always covers
 * the tile (its clamp forbids empty page at any edge); this checks the
 * stronger thing PR-0014 is actually about — that the **subject**, not just
 * some part of the file, is what ends up on screen. `null` when the layer
 * carries no id (nothing to look up) or the tile has not been measured yet.
 */
function headInsideTile(layer: Chip['layers'][number], tile: Chip['tile']): boolean | null {
  if (!layer.id || tile.width <= 0 || tile.height <= 0 || !layer.natural || !layer.naturalH) return null;
  const crop = layer.body ? bodyCrop(layer.id) : portraitCrop(layer.id);
  const leftPct = parsePct(layer.style, 'left');
  const topPct = parsePct(layer.style, 'top');
  const widthPct = parsePct(layer.style, 'width');
  if (leftPct === null || topPct === null || widthPct === null) return null;
  const imgW = tile.width * (widthPct / 100);
  const imgH = imgW * (layer.naturalH / layer.natural);
  const imgLeft = tile.width * (leftPct / 100);
  const imgTop = tile.height * (topPct / 100);
  const headX = imgLeft + imgW * crop.fx;
  const headY = imgTop + imgH * crop.fy;
  const eps = 0.5;
  return headX >= -eps && headX <= tile.width + eps && headY >= -eps && headY <= tile.height + eps;
}

/**
 * Assert the shared shape every chip in {@link collectChips} owes: a real
 * painted layer, loaded, occupying real screen space, outranking its
 * monogram, and showing its actual head rather than some other part of the
 * file (PR-0014).
 */
function assertChip(chip: Chip, chapter: string): void {
  expect(chip.layers.length, `${chapter}/${chip.actor}: no painted layer at all, only "${chip.fallbackText}"`).toBeGreaterThan(0);
  for (const layer of chip.layers) {
    expect(layer.natural, `${chapter}/${chip.actor}: ${layer.src} did not load`).toBeGreaterThan(0);
    expect(
      Math.min(layer.width, layer.height),
      `${chapter}/${chip.actor}: ${layer.src} loaded but occupies a 0x0 box`,
    ).toBeGreaterThan(0);
    const inside = headInsideTile(layer, chip.tile);
    if (inside !== null) {
      expect(inside, `${chapter}/${chip.actor}: ${layer.src}'s measured head lands outside the visible tile`).toBe(true);
    }
  }
  const loaded = chip.layers.filter((l) => l.natural > 0 && l.width > 0 && l.height > 0);
  expect(loaded.length, `${chapter}/${chip.actor}: shows no painted art, only "${chip.fallbackText}"`).toBeGreaterThan(0);
  if (chip.fallbackZ !== null) {
    const top = Math.max(...loaded.map((l) => l.z));
    expect(top, `${chapter}/${chip.actor}: a loaded portrait must paint above the monogram`).toBeGreaterThan(chip.fallbackZ);
  }
}

/**
 * Read every `<img>` in the document (or under `selector`) with its loaded
 * size, so a test can say "these all resolved" without caring which screen
 * put them there.
 */
async function imagesUnder(page: Page, selector: string): Promise<Array<{ src: string; natural: number }>> {
  return page.evaluate((sel) => {
    const root = sel ? document.querySelector(sel) : document.body;
    if (!root) return [];
    return [...root.querySelectorAll('img')].map((img) => ({
      src: img.getAttribute('src') ?? '',
      natural: img.naturalWidth,
    }));
  }, selector);
}

/**
 * The base every shipped URL must carry. Taken from the config's `baseURL`
 * rather than hard-coded, so a `BASE_PATH=/` build (a user page or a custom
 * domain) tests itself correctly instead of failing on a literal.
 */
function basePathOf(baseURL: string | undefined): string {
  return new URL(baseURL ?? 'http://127.0.0.1/').pathname;
}

test.describe('art URLs respect the production base', () => {
  test('the FFX CTB queue shows a real portrait for every party member and enemy', async ({ page, baseURL }) => {
    // Staging a real encounter under SwiftShader costs tens of seconds before
    // a single tile exists to look at; the default 90s leaves no margin on a
    // loaded machine, and a portrait test that goes red because the GPU was
    // busy teaches everyone to re-run instead of to read.
    test.slow();
    const base = basePathOf(baseURL);
    const art404s = watchArt404s(page);

    await boot(page);
    await show(page, 'battle');
    await raiseHud(page);

    const rows: Row[] = await page.evaluate(() => {
      const list = document.querySelector('[data-role="ctb-list"]');
      if (!list) return [];
      return [...list.querySelectorAll('.ig-ctb__row')].map((row) => {
        const fb = row.querySelector<HTMLElement>('.ffx-portrait-fallback');
        return {
          actor: (row as HTMLElement).dataset['actor'] ?? '?',
          layers: [...row.querySelectorAll('img')].map((img) => {
            const box = img.getBoundingClientRect();
            return {
              tag: img.tagName,
              src: img.getAttribute('src'),
              natural: img.naturalWidth,
              z: Number(getComputedStyle(img).zIndex) || 0,
              width: box.width,
              height: box.height,
            };
          }),
          fallbackZ: fb ? Number(getComputedStyle(fb).zIndex) || 0 : null,
          fallbackText: fb?.textContent ?? '',
        };
      });
    });

    expect(rows.length, 'the CTB queue renders its rows in a staged battle').toBeGreaterThan(1);
    // The reported bug was party-side, so make sure the party is actually in
    // this sample rather than passing on a queue of nothing but bosses.
    expect(rows.some((r) => ['tidus', 'yuna', 'kimahri'].includes(r.actor))).toBe(true);
    expect(rows.some((r) => !['tidus', 'yuna', 'kimahri', 'wakka', 'lulu', 'auron', 'rikku'].includes(r.actor))).toBe(true);

    for (const row of rows) {
      // Three failures that look identical in a screenshot, told apart here:
      // no layer was ever emitted (the renderer never resolved an id), a layer
      // was emitted and 404'd (a base-path mistake), or it loaded and is not
      // being painted (the stacking bug, or a collapsed ancestor).
      expect(
        row.layers.length,
        `${row.actor}: the tile has no painted layer at all, only the "${row.fallbackText}" monogram`,
      ).toBeGreaterThan(0);

      for (const layer of row.layers) {
        expect(layer.src ?? '', `${row.actor}: every art URL is built under the deployed base`).toContain(`${base}art/`);
        expect(layer.natural, `${row.actor}: ${layer.src} did not load`).toBeGreaterThan(0);
        expect(
          Math.min(layer.width, layer.height),
          `${row.actor}: ${layer.src} loaded but occupies a 0x0 box — a hidden or collapsed ancestor, not a bad URL`,
        ).toBeGreaterThan(0);
      }

      const loaded = row.layers.filter((l) => l.natural > 0 && l.width > 0 && l.height > 0);
      expect(loaded.length, `${row.actor}: the tile must show painted art, not the "${row.fallbackText}" monogram`).toBeGreaterThan(0);

      // The stacking half: the monogram is the floor of the chip, so every
      // painted layer above it has to out-rank it. This is what regressed.
      if (row.fallbackZ !== null) {
        const top = Math.max(...loaded.map((l) => l.z));
        expect(top, `${row.actor}: a loaded portrait must paint above the monogram`).toBeGreaterThan(row.fallbackZ);
      }
    }

    expect(art404s, `art requests that failed: ${art404s.join(' | ')}`).toEqual([]);
  });

  test('the party status window, results, chapter select, party prep and cutscene portraits all resolve', async ({
    page,
    baseURL,
  }) => {
    test.slow();
    const base = basePathOf(baseURL);
    const art404s = watchArt404s(page);

    await boot(page);

    // `battle` covers the party status window's `.ig-stat__face` chips and the
    // command menu's; the other four are the screens that build portrait or
    // backdrop URLs of their own (`ui/common/portrait.ts`, `PaintedArt.ts`).
    for (const screen of ['battle', 'chapter-select', 'party-prep', 'results', 'cutscene']) {
      await show(page, screen);
      // The FFX HUD starts down (see `raiseHud`), and a hidden subtree's
      // computed `background-image` is still readable — but its `<img>` chips
      // only get a box once it is up, so raise it here too and check the same
      // screen the player sees.
      if (screen === 'battle') await raiseHud(page);

      const imgs = await imagesUnder(page, '');
      const art = imgs.filter((i) => /\/art\//.test(i.src));
      expect(art.length, `${screen}: expected at least one painted image`).toBeGreaterThan(0);

      for (const img of art) {
        expect(img.src, `${screen}: "${img.src}" ignores the deployed base "${base}"`).toContain(`${base}art/`);
        expect(img.natural, `${screen}: "${img.src}" did not load`).toBeGreaterThan(0);
      }

      // CSS backgrounds (chapter-select and party-prep wash, title painting)
      // are built by the same helper and 404 just as silently.
      const bgs: string[] = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('*')]
          .map((el) => getComputedStyle(el).backgroundImage)
          .filter((v) => v && v !== 'none' && v.includes('/art/')),
      );
      for (const bg of bgs) {
        expect(bg, `${screen}: a background image ignores the deployed base "${base}"`).toContain(`${base}art/`);
      }
    }

    expect(art404s, `art requests that failed: ${art404s.join(' | ')}`).toEqual([]);
  });

  /**
   * PR-0014: the roster of every one of the five shipped chapters, not just
   * whichever one `goto('battle')` defaults to, each chip's head actually on
   * screen (not merely some part of its file), and Paine — who has no
   * `portraits/paine.png` painting of her own on the FFX side of this check —
   * shown as the same face wherever the game draws her.
   */
  test('every chip in all five chapters shows a real, on-screen head, and Paine is one face everywhere', async ({
    page,
    baseURL,
  }) => {
    test.slow();
    const base = basePathOf(baseURL);
    const art404s = watchArt404s(page);
    await boot(page);

    const CHAPTERS: Array<{ id: ChapterId; game: 'ffx' | 'ffx2' }> = [
      { id: 'seymour-flux', game: 'ffx' },
      { id: 'yunalesca', game: 'ffx' },
      { id: 'braskas-final-aeon', game: 'ffx' },
      { id: 'ffx2-bahamut', game: 'ffx2' },
      { id: 'ffx2-vegnagun-shuyin', game: 'ffx2' },
    ];

    let paineBattleSrc: string | null = null;

    for (const { id, game } of CHAPTERS) {
      await page.evaluate(() => window.__pyrefly!.setSeed(1));
      void page
        .evaluate(
          (cid) => window.__pyrefly!.gotoChapter(cid as ChapterId, { skipCutscenes: true, skipPrep: true, speed: 'skip' }),
          id,
        )
        .catch(() => undefined);
      await page.waitForFunction(() => window.__pyrefly!.screen() === 'battle', null, { timeout: 60_000 });

      let chips: Chip[];
      if (game === 'ffx') {
        await raiseHud(page);
        chips = await collectChips(page, '[data-role="ctb-list"] .ig-ctb__row', '.ig-ctb__tile', '.ffx-portrait-fallback');
      } else {
        await raiseFfx2Party(page);
        chips = await collectChips(page, '.ffx2hud__party [data-actor-id]', '.ffx2stat__face', '.ffx2stat__mono');
      }

      expect(chips.length, `${id}: no chips rendered at all`).toBeGreaterThan(0);
      const activeIds = await page.evaluate(() => window.__pyrefly!.battleState()?.activeIds ?? []);
      expect(activeIds.length, `${id}: no live party to check`).toBeGreaterThan(0);
      for (const memberId of activeIds) {
        expect(chips.some((c) => c.actor === memberId), `${id}: ${memberId} has no chip in the roster sweep`).toBe(true);
      }

      for (const chip of chips) {
        for (const layer of chip.layers) {
          expect(layer.src ?? '', `${id}/${chip.actor}: every art URL is built under the deployed base`).toContain(
            `${base}art/`,
          );
        }
        assertChip(chip, id);
      }

      if (id === 'ffx2-bahamut') {
        const paine = chips.find((c) => c.actor === 'paine');
        const top = paine?.layers.filter((l) => l.natural > 0).sort((a, b) => b.z - a.z)[0];
        paineBattleSrc = top?.src ?? null;
        expect(paineBattleSrc, 'ffx2-bahamut: Paine\'s battle chip must resolve to some painted layer').not.toBeNull();
      }
    }

    // Paine's face is the same file in the results row and the prep roster —
    // both build their chip through the same `ui/common/portrait.ts` stack,
    // so a real regression here is a different id winning on one screen and
    // not the other, not merely a different crop of the same file.
    for (const screen of ['results', 'party-prep']) {
      await show(page, screen);
      // Every `data-face-crop` this screen drew for a "paine*" id (her plain
      // portrait, or the dressphere body layer under it) — not scoped by a
      // wrapping `data-actor`, because neither screen's roster row carries
      // one; the layer's own id is unambiguous.
      const paineSrc = await page.evaluate(() => {
        const layers = [...document.querySelectorAll<HTMLImageElement>('img[data-face-crop]')]
          .filter((img) => /^paine(-|$)/.test(img.getAttribute('data-face-crop') ?? ''))
          .filter((img) => img.naturalWidth > 0)
          .sort((a, b) => (Number(getComputedStyle(b).zIndex) || 0) - (Number(getComputedStyle(a).zIndex) || 0));
        return layers[0]?.getAttribute('src') ?? null;
      });
      if (paineSrc && paineBattleSrc) {
        expect(paineSrc, `${screen}: Paine's chip is a different image than the battle row's`).toBe(paineBattleSrc);
      }
    }

    expect(art404s, `art requests that failed: ${art404s.join(' | ')}`).toEqual([]);
  });
});
