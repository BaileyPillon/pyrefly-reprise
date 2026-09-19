/**
 * The advisor card fits the box the HUD gives it — at four viewport sizes.
 *
 * ## Why this file exists
 *
 * `ffx/hudSafeZones.ts` shipped a zone 24 grid px tall for a card whose
 * shortest possible rendering is 31, and the card is written to scroll with no
 * scrollbar and a mask fade, so a player holding a controller got a headline
 * and the top half of one line of glyphs. Every unit test in the repo was green
 * on that build, because they all assert *arithmetic* and *ownership* — what
 * the zone computes and what the card is allowed to say — and none of them ever
 * asked the browser whether the thing rendered.
 *
 * The other half of why it was missed: **the project's tests never set more
 * than one viewport size.** `playwright.config.ts` pins 1600x900 and every spec
 * inherits it. The FFX HUD letterboxes a 640x360 authoring grid, so its
 * geometry is viewport-*independent* by construction — which is exactly the
 * assumption that deserves a test rather than a comment, since the one thing
 * that does change with the viewport is the scale the card's own pixels are
 * measured in, and a `getBoundingClientRect` assertion that passes at one scale
 * can pass at every scale while the paint is wrong at all of them.
 *
 * So this spec asserts, per viewport and per chapter, in the card's **own**
 * pixels:
 *
 * 1. `scrollHeight <= clientHeight + 1` on the card *and on every element
 *    inside it* — nothing is cut off, at any depth;
 * 2. the card's box does not move for 60 consecutive frames inside one
 *    decision — the placement is held, not re-solved per frame;
 * 3. the card overlaps no party sprite and none of the seven panels it is
 *    allowed nowhere near.
 *
 * Run it against a production build: `npx vite build && npx playwright test
 * tests/e2e/advisor-zone.spec.ts`.
 */

import { mkdirSync } from 'node:fs';
import process from 'node:process';
import { expect, test, type Page } from '@playwright/test';

/**
 * `ADVISOR_SHOTS=docs/screenshots/fix3/advisor-zone` writes a full frame and a
 * card close-up for every state this spec measures. Off by default: the
 * assertions are the test, the pictures are for a human deciding whether the
 * thing *reads*, which no assertion can answer.
 */
const SHOTS = process.env['ADVISOR_SHOTS'] ?? null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

/** The four the gate round was reported at, plus the small one the card ships in. */
const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1600, height: 900 },
  { width: 2000, height: 1000 },
  { width: 2560, height: 1440 },
] as const;

/** The three FFX chapters. Chapters 4 and 5 are FFX-2 and use a different HUD. */
const CHAPTERS = ['seymour-flux', 'yunalesca', 'braskas-final-aeon'] as const;

/** Panels the advisor card may not touch. */
const PANELS = [
  '.ig-cmd-stack',
  '.ffx-cmd-info',
  '.ig-stat-list',
  '.ig-ctb',
  '.eint__panel',
  '.ffx-sensor',
  '.sgd__panel',
] as const;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** A painted shape: four corners in viewport px, in order round the shape. */
type Quad = Array<{ x: number; y: number }>;

interface Probe {
  present: boolean;
  /** The advisor has no advice at all, so its whole root is hidden. */
  silent: boolean;
  /** Card hidden because the HUD declined the zone; the chip is then the panel. */
  declined: boolean;
  zone: string | null;
  /** Card and every descendant, in the card's own pixels. */
  overflow: Array<{ tag: string; scrollH: number; clientH: number; scrollW: number; clientW: number }>;
  card: Quad | null;
  panels: Record<string, Quad | null>;
  /** The card's bounding box, only for framing a close-up screenshot. */
  clip: Box | null;
  sprites: Quad[];
  text: string;
  chip: Quad | null;
  /** Engine log length, so "four turns" can be shown to be four turns. */
  logLen: number;
}

/**
 * Do two painted shapes overlap? Separating-axis test on two convex quads.
 *
 * Bounding boxes cannot answer this here and the two ways they get it wrong
 * both bit this spec on its first run:
 *
 * - **Skew.** Every Ink & Gold slab carries `--ig-skew`
 *   (`matrix(1, 0, -0.2126, 1, 0, 0)`), so a 90px-tall card's bottom-left
 *   corner juts ~9.6px left of its layout box while its top-left corner juts
 *   the same distance right. Chapter 1's card and Kimahri's rect have clear air
 *   between the painted shapes and boxes that overlap by 3.6px.
 * - **Offset parents.** `.ig-cmd-stack` is a child of `.ffx-cmd-area`, so its
 *   `offsetLeft` is measured from that panel rather than from the stage, and
 *   reading it as stage coordinates put the command stack 30 grid px left of
 *   where it is painted.
 *
 * So every shape here is rebuilt from the element's bounding box and its own
 * computed `transform` — see `quadOf`, which also explains why not
 * `getBoxQuads`.
 */
function overlapsQuad(a: Quad, b: Quad): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]!;
      const q = poly[(i + 1) % poly.length]!;
      // Outward normal of this edge.
      const nx = -(q.y - p.y);
      const ny = q.x - p.x;
      let aMin = Infinity;
      let aMax = -Infinity;
      let bMin = Infinity;
      let bMax = -Infinity;
      for (const v of a) {
        const d = v.x * nx + v.y * ny;
        aMin = Math.min(aMin, d);
        aMax = Math.max(aMax, d);
      }
      for (const v of b) {
        const d = v.x * nx + v.y * ny;
        bMin = Math.min(bMin, d);
        bMax = Math.max(bMax, d);
      }
      // A gap on any axis means the shapes are apart. A shared edge is not an
      // overlap, hence the strict comparison.
      if (aMax <= bMin || bMax <= aMin) return false;
    }
  }
  return true;
}

/** Wait for a real, open command menu — the state the report was made in. */
async function waitForMenu(page: Page): Promise<void> {
  // The software renderer takes its time on the first frame of a battle.
  await page.waitForFunction(() => document.querySelector('.ig-cmd-stack [data-ui-action]') !== null, null, {
    timeout: 240_000,
  });
  await page.evaluate(async () => {
    const api = (window as unknown as { __pyrefly: { frame(): Promise<void> } }).__pyrefly;
    for (let i = 0; i < 20; i++) await api.frame();
  });
}

async function probe(page: Page): Promise<Probe> {
  return page.evaluate((panelSelectors: readonly string[]) => {
    const w = window as unknown as {
      __pyrefly: { battle(): { hud: unknown } | null; battleLog(): unknown[] };
    };
    const logLen = w.__pyrefly.battleLog().length;
    const hud = w.__pyrefly.battle()?.hud as
      | { el: HTMLElement; partySpriteRects(): Box[]; hudScale?: () => number }
      | undefined;
    interface Box {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }
    type Quad = Array<{ x: number; y: number }>;
    const root = document.querySelector<HTMLElement>('[data-role="move-advisor"]');
    const card = document.querySelector<HTMLElement>('[data-role="move-advisor-card"]');
    const chip = document.querySelector<HTMLElement>('[data-role="move-advisor-toggle"]');
    if (!hud || !root || !card) {
      return {
        present: false,
        silent: true,
        declined: false,
        zone: null,
        overflow: [],
        card: null,
        panels: {},
        clip: null,
        sprites: [],
        text: '',
        chip: null,
        logLen,
      };
    }

    const host = hud.el.getBoundingClientRect();
    const scale = Math.min(host.width / 640, host.height / 360);
    const ox = host.left + (host.width - 640 * scale) / 2;
    const oy = host.top + (host.height - 360 * scale) / 2;

    /**
     * Where an element is actually painted, in viewport px.
     *
     * Built from the two things the browser will answer honestly:
     * `getBoundingClientRect`, which is the axis-aligned box **around** the
     * painted shape with every ancestor transform already applied, and the
     * element's own computed `transform`, which says how much of that box is
     * the shear. For `skewX` with factor `k` the parallelogram is the bounding
     * box with its top edge pushed `k * height` right and its bottom edge the
     * same distance left; for an unskewed element it is the box itself.
     *
     * Not `getBoxQuads` — it would answer this directly and it does not exist
     * in the Chromium Playwright drives here, and it fails by returning
     * `undefined`, which a `??` fallback turns silently into the bounding box
     * this whole function exists to avoid.
     *
     * Not `offsetLeft` either: `.ig-cmd-stack` is a child of `.ffx-cmd-area`,
     * so its offsets are measured from that panel rather than from the stage.
     */
    const quadOf = (el: HTMLElement): Quad => {
      const b = el.getBoundingClientRect();
      const m = /^matrix\(([^)]+)\)$/.exec(getComputedStyle(el).transform);
      const k = m ? -(Number(m[1]!.split(',')[2]) || 0) : 0;
      const dx = k * b.height;
      return [
        { x: b.left + dx, y: b.top },
        { x: b.right, y: b.top },
        { x: b.right - dx, y: b.bottom },
        { x: b.left, y: b.bottom },
      ];
    };
    const rectQuad = (b: Box): Quad => [
      { x: b.left, y: b.top },
      { x: b.right, y: b.top },
      { x: b.right, y: b.bottom },
      { x: b.left, y: b.bottom },
    ];
    const visible = (el: HTMLElement | null): boolean =>
      el !== null && !el.hidden && el.offsetWidth > 0 && el.offsetHeight > 0;

    // Three different states, and conflating the last two cost this spec a run:
    //  - `silent`: the advisor has nothing to say, so `MoveAdvisor.render` hides
    //    its whole root. Chapter 1's third decision is an Overdrive prompt.
    //  - `declined`: the HUD found no box the card fits in and took the card
    //    down on purpose. The chip is then the panel, and must still be placed.
    //  - neither: the card is up and everything below applies.
    const silent = root.hidden || root.offsetWidth <= 0;
    const declined = !silent && (root.dataset['zone'] === 'none' || card.hidden);
    const overflow: Array<{ tag: string; scrollH: number; clientH: number; scrollW: number; clientW: number }> = [];
    if (!declined) {
      for (const el of [card, ...Array.from(card.querySelectorAll<HTMLElement>('*'))]) {
        overflow.push({
          tag: `${el.tagName.toLowerCase()}.${el.className || '-'}`,
          scrollH: el.scrollHeight,
          clientH: el.clientHeight,
          scrollW: el.scrollWidth,
          clientW: el.clientWidth,
        });
      }
    }

    const panels: Record<string, Quad | null> = {};
    for (const sel of panelSelectors) {
      const el = document.querySelector<HTMLElement>(sel);
      panels[sel] = visible(el) ? quadOf(el!) : null;
    }

    const sprites = hud.partySpriteRects().map((r) =>
      rectQuad({
        left: ox + r.left * scale,
        top: oy + r.top * scale,
        right: ox + r.right * scale,
        bottom: oy + r.bottom * scale,
      }),
    );

    const b = card.getBoundingClientRect();
    return {
      present: true,
      silent,
      declined,
      zone: root.dataset['zone'] ?? null,
      overflow,
      card: declined ? null : quadOf(card),
      panels,
      clip: declined ? null : { left: b.left, top: b.top, right: b.right, bottom: b.bottom },
      sprites,
      text: card.innerText.replace(/\s+/g, ' ').trim(),
      chip: visible(chip) ? quadOf(chip!) : null,
      logLen,
    };
  }, PANELS);
}

/** The card's box across 60 consecutive rendered frames. */
async function boxOverFrames(page: Page, n: number): Promise<string[]> {
  return page.evaluate(async (count: number) => {
    const api = (window as unknown as { __pyrefly: { frame(): Promise<void> } }).__pyrefly;
    const card = document.querySelector<HTMLElement>('[data-role="move-advisor-card"]')!;
    const seen: string[] = [];
    for (let i = 0; i < count; i++) {
      await api.frame();
      seen.push(
        [card.offsetLeft, card.offsetTop, card.offsetWidth, card.offsetHeight, card.style.maxHeight].join(),
      );
    }
    return seen;
  }, n);
}

/**
 * The frame, and the card blown up large enough to read every glyph.
 *
 * The close-up is captured at `deviceScaleFactor` 3 through a clip rather than
 * by scaling the PNG afterwards, so what lands on disk is the renderer's own
 * output at three times the size rather than an interpolation of a small one.
 */
async function capture(page: Page, name: string, card: Box | null, full: boolean): Promise<void> {
  if (!SHOTS) return;
  // The whole frame only where it is worth its cost: reading a SwiftShader
  // canvas back at 2560x1440 takes longer than the turn that produced it.
  if (full) await page.screenshot({ path: `${SHOTS}/${name}.png`, animations: 'disabled' });
  if (!card) return;
  const pad = 14;
  await page.screenshot({
    path: `${SHOTS}/${name}-card.png`,
    animations: 'disabled',
    clip: {
      x: Math.max(0, card.left - pad),
      y: Math.max(0, card.top - pad * 2),
      width: card.right - card.left + pad * 2,
      height: card.bottom - card.top + pad * 3,
    },
    scale: 'css',
  });
}

/**
 * Take the highlighted command and wait for the **next** decision to open.
 *
 * One `Enter` is not a turn: the top row is ATTACK, which opens the target
 * cursor, and a second `Enter` is what submits it. The proof that a turn really
 * passed is the engine's own log growing — comparing the card's text would pass
 * happily on a board where the same move is suggested twice, which is most
 * boards, and that is how a "four turns" matrix can measure one turn four
 * times.
 */
async function nextDecision(page: Page): Promise<boolean> {
  const logBefore = await page.evaluate(
    () => (window as unknown as { __pyrefly: { battleLog(): unknown[] } }).__pyrefly.battleLog().length,
  );
  for (let press = 0; press < 3; press++) {
    await page.keyboard.press('Enter');
    try {
      await page.waitForFunction(
        (n: number) =>
          (window as unknown as { __pyrefly: { battleLog(): unknown[] } }).__pyrefly.battleLog().length > n,
        logBefore,
        { timeout: 15_000 },
      );
      break;
    } catch {
      // The press opened a target cursor or a submenu instead of submitting.
      // Press again; the cursor confirms on the second one.
      if (press === 2) return false;
    }
  }
  try {
    await waitForMenu(page);
  } catch {
    return false;
  }
  return true;
}

for (const vp of VIEWPORTS) {
  test.describe(`advisor card at ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const chapter of CHAPTERS) {
      test(`${chapter}: fits its box, holds still and clears every panel`, async ({ page }) => {
        // Generous: on a software renderer 2560x1440 is four times the pixels
        // of 720p, and every canvas read-back for a screenshot is paid twice.
        test.setTimeout(900_000);
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(String(e)));

        await page.goto('./');
        await page.waitForFunction(() => (window as unknown as { __pyreflyReady?: boolean }).__pyreflyReady === true, {
          timeout: 120_000,
        });
        await page.evaluate((id: string) => {
          const api = (window as unknown as {
            __pyrefly: { setSeed(n: number): void; gotoChapter(id: string, o: object): Promise<unknown> };
          }).__pyrefly;
          api.setSeed(1);
          void api.gotoChapter(id, { skipCutscenes: true, skipPrep: true });
        }, chapter);
        await waitForMenu(page);
        // Playback speed only: the HUD is laid out on a 640x360 grid and its
        // geometry does not know what the clock is doing. Without it each
        // enemy turn plays out in real time on a software renderer and the
        // four decisions this test walks take the better part of ten minutes.
        await page.evaluate(() =>
          (window as unknown as { __pyrefly: { setBattleSpeed(s: string): boolean } }).__pyrefly.setBattleSpeed(
            'fast',
          ),
        );

        // The first player turn, then three more decisions.
        let lastLog = -1;
        for (let turn = 0; turn < 4; turn++) {
          const p = await probe(page);
          if (!p.present) {
            // The encounter finished inside the four decisions this test walks
            // — Chapter 1 at `fast` can be over in three. That is a shorter
            // battle, not a missing advisor, so it ends the walk rather than
            // failing it; what has been measured so far still counts.
            const screen = await page.evaluate(() =>
              (window as unknown as { __pyrefly: { screen(): string } }).__pyrefly.screen(),
            );
            expect(
              { chapter, turn, screen },
              `${chapter} turn ${turn}: the advisor is mounted, or the battle is over`,
            ).toMatchObject({ screen: expect.not.stringMatching(/^battle$/) as unknown as string });
            break;
          }
          expect(p.logLen, `${chapter} turn ${turn} is a new turn, not the same one again`).toBeGreaterThan(lastLog);
          lastLog = p.logLen;
          // Nothing to say is not this spec's business; it is the advisor's.
          if (p.silent) {
            if (turn < 3 && !(await nextDecision(page))) break;
            continue;
          }

          if (!p.declined) {
            // 1. Nothing clipped, measured in the card's own pixels.
            for (const el of p.overflow) {
              expect(
                { chapter, turn, el: el.tag, scrollH: el.scrollH, clientH: el.clientH },
                'no element of the card is taller than its own box',
              ).toMatchObject({ scrollH: expect.any(Number) as number });
              expect(el.scrollH, `${chapter} turn ${turn}: ${el.tag} is clipped vertically`).toBeLessThanOrEqual(
                el.clientH + 1,
              );
            }
            expect(p.text.length, `${chapter} turn ${turn}: the card says something`).toBeGreaterThan(0);

            // 3. Clear of every panel, and of every party sprite.
            for (const [sel, shape] of Object.entries(p.panels)) {
              if (!shape) continue;
              expect(
                { chapter, turn, panel: sel, hit: overlapsQuad(p.card!, shape) },
                `the card must not touch ${sel}`,
              ).toMatchObject({ hit: false });
            }
            for (const [i, s] of p.sprites.entries()) {
              expect(
                { chapter, turn, sprite: i, hit: overlapsQuad(p.card!, s) },
                'the card must not touch a party sprite',
              ).toMatchObject({ hit: false });
            }
          } else {
            // A declined card still leaves a chip, and the chip is placed.
            expect(p.chip, `${chapter} turn ${turn}: the chip survives a declined zone`).not.toBeNull();
            for (const [i, s] of p.sprites.entries()) {
              expect(
                { chapter, turn, sprite: i, hit: overlapsQuad(p.chip!, s) },
                'the chip must not sit on a party sprite',
              ).toMatchObject({ hit: false });
            }
          }

          // 2. The placement is held for the decision: 60 frames, one box.
          //
          // After a settling window, because two different things write this
          // box. `placeAdvisor` writes the placement, which is what this spec
          // is about and which must not move at all; `MoveAdvisor.fitCard`
          // writes the card's *height* by walking its density ladder down until
          // the content fits, which takes a frame or two at the top of a
          // decision and is monotone, so it converges and then stops. Measuring
          // from frame zero would count that convergence as the card moving.
          if (!p.declined) {
            await page.evaluate(async () => {
              const api = (window as unknown as { __pyrefly: { frame(): Promise<void> } }).__pyrefly;
              for (let i = 0; i < 20; i++) await api.frame();
            });
            const boxes = await boxOverFrames(page, 60);
            expect(
              new Set(boxes).size,
              `${chapter} turn ${turn}: the card moved within one decision — ` +
                `left,top,width,height,max-height over 60 frames: ${[...new Set(boxes)].join(' | ')}`,
            ).toBe(1);
          }

          await capture(
            page,
            `${chapter}-${vp.width}x${vp.height}-t${turn}${p.declined ? '-declined' : ''}`,
            p.clip,
            turn === 0 || p.declined,
          );

          if (turn < 3 && !(await nextDecision(page))) break;
        }

        expect(errors, 'no page errors').toEqual([]);
      });
    }
  });
}
