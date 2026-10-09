/**
 * The NEXT BEST MOVE card is on screen at the first command menu of every FFX chapter, at the desktop shapes players use.
 *
 * ## Why this file exists (r3942-giants-ffx, FFX only)
 *
 * Bailey's giants (2026-10-08) made Seymour Flux 1.5 times and Braska's Final Aeon 1.7 times as tall as they were, with the Yu Pagodas behind him. The card's solver
 * (`src/ui/ffx/hudSafeZones.ts`) found no clear box on either frame, at any of the shapes it was asked about, and `FFXBattleHud.placeAdvisor` took the card down and the `N` chip with
 * it: no advice at all in two chapters on a default setting. The independent check caught it in 16 of 16 captures; the work had passed a typecheck, 931 unit files and its own captures, because
 * the lane's harness measured the figures and never asked whether the card was there. `advisor-zone.spec.ts` asks the right question (`expect(p.off).toBe(false)`: "the card was withheld")
 * but for three chapters at four sizes, four decisions each, which takes the better part of an hour; this is the one cheap question for **every** FFX chapter: after the first menu opens,
 * is the card up, in the frame, clear of every panel and of every fighter, with its chip, and does `N` put it away and bring it back.
 *
 * The three shapes are the common 16:9 desktop (1600x900), the common 16:10 laptop (1440x900) and the 4:3 window (1024x768), where the HUD's 640x360 stage is letterboxed
 * differently and the fight takes more of it. `advisorZone` and the one-row tip (`advisorTip.ts`) are pinned on measured boards of both chapters in
 * `tests/unit/ui-ffx-advisor-tip.test.ts`; nothing there can say what the browser draws.
 *
 * The two chapters whose card is the one-row tip are asked again at the **next decision**: the tip is still one row (not the full card's rows squeezed into it), and it is **where it was**. The camera is
 * still gliding to the menu shot for the first seconds of a decision, and a tip solved against the fighters mid-glide stood in the bottom right for the whole decision at some turns.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: FFX-2's HUD places its card by its own lane (`ffx2/advisorLane.ts`) and never takes it down.
 *
 * Run it against a production build: `npx vite build && npx playwright test tests/e2e/advisor-present.spec.ts`.
 */

import { expect, test, type Page } from '@playwright/test';

/** Every FFX chapter (`game: 'ffx'`; Chapters I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII). */
const CHAPTERS = [
  'seymour-flux',
  'yunalesca',
  'braskas-final-aeon',
  'seymour-anima-macalania',
  'evrae-airship',
  'yojimbo-cavern',
  'seymour-natus',
  'seymour-omnis',
  'isaaru-via-purifico',
  'sin-fins-core',
  'sin-face',
] as const;

const SHAPES = [
  { width: 1600, height: 900 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
] as const;

/** Panels the card may not touch (their boxes are painted shapes inside the box the browser reports, so a box test is the conservative one). */
const PANELS = ['.ig-cmd-stack', '.ffx-cmd-info', '.ig-stat-list', '.ig-ctb', '.eint__panel', '.ffx-sensor', '.sgd__panel'] as const;

/**
 * The small key chips along the top, which the one-row tip keeps off (`advisorTip.ts`, `keepOff`) and the designed card never has: at 1024x768 the designed card's box touches the guide's scroll chip by a few
 * px in Chapters VII, VIII, IX and XIV on the live build too (measured 2026-10-08; not this branch's, and not asked here), so they are checked for the tip alone.
 */
const TIP_CHIPS = ['.sgd__toggle', '.sgd__keys', '.battle-pause-chip'] as const;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface Probe {
  /** The card is in the DOM, not hidden, and painted with a box. */
  cardUp: boolean;
  cardBox: Box | null;
  zone: string | null;
  chipUp: boolean;
  chipText: string;
  text: string;
  panels: Record<string, Box | null>;
  /** Party and enemy rects as the HUD hands them to the solver, in viewport px. */
  fighters: Array<{ side: 'party' | 'enemy'; box: Box }>;
  viewport: { width: number; height: number };
  /** The HUD stage's scale: one grid px in viewport px. */
  scale: number;
}

async function openFirstMenu(page: Page, chapter: string): Promise<void> {
  await page.goto('./?coach=off');
  await page.waitForFunction(() => (window as unknown as { __pyreflyReady?: boolean }).__pyreflyReady === true, null, { timeout: 120_000 });
  await page.evaluate((id: string) => {
    const api = (window as unknown as {
      __pyrefly: { markCoachSeen(): void; setSeed(n: number): void; gotoChapter(id: string, o: object): Promise<unknown> };
    }).__pyrefly;
    api.markCoachSeen();
    api.setSeed(1);
    void api.gotoChapter(id, { skipCutscenes: true, skipPrep: true });
  }, chapter);
  await page.waitForFunction(() => document.querySelector('.ig-cmd-stack [data-ui-action]') !== null, null, { timeout: 240_000 });
  // The card is solved when the decision opens and fitted over the next frames; let the camera plan land too.
  await page.evaluate(async () => {
    const api = (window as unknown as { __pyrefly: { frame(): Promise<void> } }).__pyrefly;
    for (let i = 0; i < 90; i++) await api.frame();
  });
  await page.waitForTimeout(1500);
}

async function probe(page: Page): Promise<Probe> {
  return page.evaluate((panelSelectors: readonly string[]) => {
    interface B {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }
    const w = window as unknown as {
      __pyrefly: { battle(): { hud: unknown } | null };
    };
    const hud = w.__pyrefly.battle()?.hud as { inner?: unknown } | undefined;
    const ffx = ((hud?.inner ?? hud) as unknown) as {
      el: HTMLElement;
      hudScale(): number;
      partySpriteRects(): B[];
      enemySpriteRects(): B[];
    };
    const boxOf = (el: Element | null): B | null => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return b.width > 1 && b.height > 1 ? { left: b.left, top: b.top, right: b.right, bottom: b.bottom } : null;
    };
    const up = (el: HTMLElement | null): boolean => !!el && !el.hidden && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 4;
    const card = document.querySelector<HTMLElement>('[data-role="move-advisor-card"]');
    const chip = document.querySelector<HTMLElement>('[data-role="move-advisor-toggle"]');
    const root = document.querySelector<HTMLElement>('[data-role="move-advisor"]');
    const scale = ffx.hudScale();
    const host = ffx.el.getBoundingClientRect();
    const ox = host.left + (host.width - 640 * scale) / 2;
    const oy = host.top + (host.height - 360 * scale) / 2;
    const toViewport = (r: B): B => ({ left: ox + r.left * scale, top: oy + r.top * scale, right: ox + r.right * scale, bottom: oy + r.bottom * scale });
    const panels: Record<string, B | null> = {};
    for (const sel of panelSelectors) panels[sel] = up(document.querySelector<HTMLElement>(sel)) ? boxOf(document.querySelector(sel)) : null;
    return {
      cardUp: up(card),
      cardBox: up(card) ? boxOf(card) : null,
      zone: root?.dataset['zone'] ?? null,
      chipUp: up(chip),
      chipText: chip?.innerText.replace(/\s+/g, ' ').trim() ?? '',
      text: card?.innerText.replace(/\s+/g, ' ').trim() ?? '',
      panels,
      fighters: [
        ...ffx.partySpriteRects().map((r) => ({ side: 'party' as const, box: toViewport(r) })),
        ...ffx.enemySpriteRects().map((r) => ({ side: 'enemy' as const, box: toViewport(r) })),
      ],
      viewport: { width: innerWidth, height: innerHeight },
      scale,
    };
  }, [...PANELS, ...TIP_CHIPS]);
}

/**
 * Take the highlighted command (ATTACK, then its target) and wait for the **next** decision to open: the engine's own log growing is the proof that a turn passed
 * (`advisor-zone.spec.ts` explains why the card's text is not).
 */
async function nextDecision(page: Page): Promise<boolean> {
  const logLen = (): Promise<number> => page.evaluate(() => (window as unknown as { __pyrefly: { battleLog(): unknown[] } }).__pyrefly.battleLog().length);
  const before = await logLen();
  // Chapters I and III open on TALK, not ATTACK: step down to ATTACK, which is the second row in both.
  const row = await page.evaluate(() => document.querySelector('.ig-cmd--selected')?.textContent?.trim() ?? '');
  if (/^talk/i.test(row)) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
  }
  for (let press = 0; press < 3; press++) {
    await page.keyboard.press('Enter');
    try {
      await page.waitForFunction((n: number) => (window as unknown as { __pyrefly: { battleLog(): unknown[] } }).__pyrefly.battleLog().length > n, before, { timeout: 15_000 });
      break;
    } catch {
      if (press === 2) return false;
    }
  }
  try {
    // The engine's own "a command menu is awaited": the old menu's elements can stay on screen while the turn plays, and the advisor has no decision then.
    await page.waitForFunction(
      () => {
        const api = (window as unknown as { __pyrefly: { snapshotState(): { screenState?: { playback?: { awaitingMenu?: boolean } } } } }).__pyrefly;
        return api.snapshotState().screenState?.playback?.awaitingMenu === true && document.querySelector('.ig-cmd-stack [data-ui-action]') !== null;
      },
      null,
      { timeout: 120_000, polling: 250 },
    );
  } catch {
    return false;
  }
  await page.evaluate(async () => {
    const api = (window as unknown as { __pyrefly: { frame(): Promise<void> } }).__pyrefly;
    for (let i = 0; i < 60; i++) await api.frame();
  });
  await page.waitForTimeout(800);
  return true;
}

const overlap = (a: Box, b: Box): boolean => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;

for (const shape of SHAPES) {
  test.describe(`the advisor card at ${shape.width}x${shape.height}`, () => {
    test.use({ viewport: shape });

    for (const chapter of CHAPTERS) {
      test(`${chapter}: the card and its chip are up at the first menu, clear of every panel and fighter, and N puts it away and brings it back`, async ({ page }) => {
        test.setTimeout(420_000);
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        await openFirstMenu(page, chapter);

        const p = await probe(page);
        const where = `${chapter} at ${shape.width}x${shape.height}`;
        expect(p.cardUp, `${where}: the NEXT BEST MOVE card is on screen (zone ${p.zone})`).toBe(true);
        expect(p.chipUp, `${where}: its N chip is on screen`).toBe(true);
        expect(p.zone, `${where}: the card was placed in a zone the solver measured, not left on its own anchor`).not.toBe('free');
        expect(p.text.length, `${where}: the card says something`).toBeGreaterThan(8);
        const card = p.cardBox!;
        expect(card.left, `${where}: in the frame (left)`).toBeGreaterThanOrEqual(-1);
        expect(card.top, `${where}: in the frame (top)`).toBeGreaterThanOrEqual(-1);
        expect(card.right, `${where}: in the frame (right)`).toBeLessThanOrEqual(p.viewport.width + 1);
        expect(card.bottom, `${where}: in the frame (bottom)`).toBeLessThanOrEqual(p.viewport.height + 1);
        for (const [sel, box] of Object.entries(p.panels)) {
          if (box && (p.zone === 'tip' || !(TIP_CHIPS as readonly string[]).includes(sel))) expect(overlap(card, box), `${where}: the card must not touch ${sel}`).toBe(false);
        }
        for (const [i, f] of p.fighters.entries()) {
          expect(overlap(card, f.box), `${where}: the card must not touch ${f.side} ${i}`).toBe(false);
        }

        // N puts it away (the chip then offers it back) and brings it back to the same place.
        await page.keyboard.press('KeyN');
        await page.waitForTimeout(400);
        const away = await probe(page);
        expect(away.cardUp, `${where}: N puts the card away`).toBe(false);
        expect(away.chipUp, `${where}: the chip stays to offer it back`).toBe(true);
        expect(away.chipText.toLowerCase(), `${where}: and says so`).toContain('best move');
        await page.keyboard.press('KeyN');
        await page.waitForTimeout(400);
        const back = await probe(page);
        expect(back.cardUp, `${where}: N brings the card back`).toBe(true);
        expect(back.zone, `${where}: in the zone it had`).toBe(p.zone);

        expect(errors, 'no page errors').toEqual([]);
      });
    }

    // The two giants' chapters are the ones whose card is the one-row tip (`advisorTip.ts`): it must be the same row at the NEXT decision, not the full card's rows squeezed into it.
    for (const chapter of ['seymour-flux', 'braskas-final-aeon'] as const) {
      test(`${chapter}: at the next decision the card is up again, and a tip is still one row`, async ({ page }) => {
        test.setTimeout(600_000);
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        await openFirstMenu(page, chapter);
        await page.evaluate(() => (window as unknown as { __pyrefly: { setBattleSpeed(s: string): boolean } }).__pyrefly.setBattleSpeed('fast'));
        const where = `${chapter} at ${shape.width}x${shape.height}`;
        const first = await probe(page);
        expect(first.cardUp, `${where}: the card is up at the first menu`).toBe(true);
        expect(await nextDecision(page), `${where}: a turn passed`).toBe(true);
        const next = await probe(page);
        expect(next.cardUp, `${where}: the card is up at the next decision`).toBe(true);
        expect(next.chipUp, `${where}: and its chip`).toBe(true);
        expect(next.zone, `${where}: placed, not left on its own anchor`).not.toBe('free');
        if (next.zone === 'tip') {
          const rowPx = next.cardBox!.bottom - next.cardBox!.top;
          expect(rowPx, `${where}: the tip is one row (18 grid px at most, ${(18 * next.scale).toFixed(0)} px here), not the full card's rows (${rowPx.toFixed(0)} px)`).toBeLessThanOrEqual(18 * next.scale + 1);
          // And it is where it was: the camera is still gliding to the menu shot for the first seconds of a decision, and a tip solved against the fighters mid-glide stood in the bottom right
          // for the whole decision (the placement is held), a bar the eye has to find again at every turn. It is solved against the fighters where the shot comes to rest (`enemiesAtRest`).
          if (first.zone === 'tip') {
            const slack = 2 * next.scale;
            expect(Math.abs(next.cardBox!.left - first.cardBox!.left), `${where}: the tip's left edge is where it was at the first menu`).toBeLessThanOrEqual(slack);
            expect(Math.abs(next.cardBox!.top - first.cardBox!.top), `${where}: and its top edge`).toBeLessThanOrEqual(slack);
          }
        }
        expect(errors, 'no page errors').toEqual([]);
      });
    }
  });
}
