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
 * The two giants' chapters (I and III) start their fights with the strategy guide **folded** to its `G` chip and the full card standing in the guide's place (r3943-int, Bailey's "A2" of 2026-10-09; FFX only):
 * the card and its `N` chip, which parks beside the `G` chip, are asked to be clear of the `G` chip, the scroll chip and the PAUSE chip at every shape (the first picture of this, A2 as the options sheet
 * built it, stood on the `G` chip in all six frames), `G` opens the guide and the card is then the one-row tip, and `G` again folds it back to the card where it was. The designed card is asked again
 * at the **next decision**: still the card, **where it was** (the same left and bottom edge: a card that dropped to a box above the command stack at a decision whose actor has a shorter stack was seen once).
 * The tip's own placement (the one-row bar) is asked at the next decision with the guide open, as before: still one row, and where it was; the camera is still gliding to the menu shot for the first seconds
 * of a decision, and a tip solved against the fighters mid-glide stood in the bottom right for the whole decision at some turns.
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

/** Chapters I and III: the guide starts folded and the full card stands in its place (`SceneStaging.guideFolded`). */
const FOLDED_GUIDE = ['seymour-flux', 'braskas-final-aeon'] as const;

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
  chipBox: Box | null;
  chipText: string;
  /** The guide's sheet is up (not hidden). */
  guideUp: boolean;
  /** The player's saved answer for the guide (`Settings.guideVisible`), null when the snapshot does not carry it. */
  guideSetting: boolean | null;
  /** The card and every element in it, in the card's own pixels (`advisor-zone.spec.ts`'s measure: nothing may be taller than its own box). Empty while the card is away. */
  overflow: Array<{ tag: string; scrollH: number; clientH: number }>;
  text: string;
  panels: Record<string, Box | null>;
  /** Party and enemy rects as the HUD hands them to the solver, in viewport px. */
  fighters: Array<{ side: 'party' | 'enemy'; box: Box }>;
  /** The same, with the enemies where the camera's shot comes to rest: what the one-row tip is solved against (a floating enemy's live box swings 11 grid px either way of it). */
  restFighters: Array<{ side: 'party' | 'enemy'; box: Box }>;
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
      enemySpriteRectsAtRest(): B[];
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
      chipBox: up(chip) ? boxOf(chip) : null,
      chipText: chip?.innerText.replace(/\s+/g, ' ').trim() ?? '',
      guideUp: up(document.querySelector<HTMLElement>('.sgd__panel')),
      overflow: up(card)
        ? [card!, ...Array.from(card!.querySelectorAll<HTMLElement>('*'))].map((el) => ({ tag: `${el.tagName.toLowerCase()}.${el.className || '-'}`, scrollH: el.scrollHeight, clientH: el.clientHeight }))
        : [],
      guideSetting: ((w.__pyrefly as unknown as { snapshotState(): { save?: { settings?: Record<string, unknown> } } }).snapshotState().save?.settings?.['guideVisible'] as boolean | undefined) ?? null,
      text: card?.innerText.replace(/\s+/g, ' ').trim() ?? '',
      panels,
      fighters: [
        ...ffx.partySpriteRects().map((r) => ({ side: 'party' as const, box: toViewport(r) })),
        ...ffx.enemySpriteRects().map((r) => ({ side: 'enemy' as const, box: toViewport(r) })),
      ],
      restFighters: [
        ...ffx.partySpriteRects().map((r) => ({ side: 'party' as const, box: toViewport(r) })),
        ...ffx.enemySpriteRectsAtRest().map((r) => ({ side: 'enemy' as const, box: toViewport(r) })),
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

/**
 * Chapters I and III at the first menu (the guide folded, the full card in its place): the guide is folded, the card is the card and not the tip, and **neither the card nor the `N` chip stands
 * on the `G` chip, the scroll chip or the PAUSE chip** (the first picture of this stood on the `G` chip in all six frames, 17 to 100 percent of it), nor does the chip stand on the card.
 */
function clearOfTheGuideChip(p: Probe, where: string): void {
  expect(p.guideUp, `${where}: the guide starts folded to its chip`).toBe(false);
  expect(p.zone, `${where}: and the full card stands in its place, not the tip`).not.toBe('tip');
  expect(p.panels['.sgd__toggle'], `${where}: the G chip is on the screen`).not.toBeNull();
  expect(p.chipBox, `${where}: and so is the N chip`).not.toBeNull();
  for (const sel of TIP_CHIPS) {
    const box = p.panels[sel];
    if (!box) continue;
    expect(overlap(p.cardBox!, box), `${where}: the card must not stand on ${sel}`).toBe(false);
    expect(overlap(p.chipBox!, box), `${where}: the N chip must not stand on ${sel}`).toBe(false);
  }
  expect(overlap(p.chipBox!, p.cardBox!), `${where}: the N chip must not stand on the card`).toBe(false);
  // The rail is 66 to 70 grid px tall: whatever the card prints fits it (`MoveAdvisor.fitCard`), and nothing in it is cut off at the foot, by the measure `advisor-zone.spec.ts` holds every card to.
  for (const el of p.overflow) expect(el.scrollH, `${where}: ${el.tag} is clipped vertically (scrollHeight ${el.scrollH}, clientHeight ${el.clientH})`).toBeLessThanOrEqual(el.clientH + 1);
}

/** The one-row tip is one row (18 grid px at most) and stands clear of every panel, fighter and chip, its `N` badge included. */
function tipIsClear(p: Probe, where: string): void {
  expect(p.zone, `${where}: the tip`).toBe('tip');
  expect(p.cardBox!.bottom - p.cardBox!.top, `${where}: one row`).toBeLessThanOrEqual(18 * p.scale + 1);
  expect(p.chipUp, `${where}: with its chip`).toBe(true);
  for (const [sel, box] of Object.entries(p.panels)) if (box) expect(overlap(p.cardBox!, box), `${where}: the tip must not touch ${sel}`).toBe(false);
  // Against the fighters where the shot comes to rest: that is what the tip is solved against (`enemiesAtRest`); a floating enemy's live box swings past it by a few grid px at the top of its hover.
  for (const [i, f] of p.restFighters.entries()) expect(overlap(p.cardBox!, f.box), `${where}: the tip must not touch ${f.side} ${i} (at rest)`).toBe(false);
  for (const sel of TIP_CHIPS) {
    const box = p.panels[sel];
    if (box) expect(overlap(p.chipBox!, box), `${where}: the N chip must not stand on ${sel}`).toBe(false);
  }
}

/** The card's layout-box left edge: the bounding box's left is the painted bottom-left corner, which the shear (`--ig-skew`, 0.212557) moves left by half the card's height times the skew, and the height is the text it holds. */
const layoutLeft = (b: Box): number => b.left + (0.212557 * (b.bottom - b.top)) / 2;

/** Where the card stands, to compare two decisions: its left edge and its bottom edge (both to a grid px), and the chip. The right edge follows the room beside it, which differs by a few grid px with where the party stands. */
function sameStand(a: Probe, b: Probe, where: string): void {
  expect(Math.abs(layoutLeft(a.cardBox!) - layoutLeft(b.cardBox!)), `${where}: the card's left edge is where it was`).toBeLessThanOrEqual(a.scale + 1);
  expect(Math.abs(a.cardBox!.bottom - b.cardBox!.bottom), `${where}: and its bottom edge`).toBeLessThanOrEqual(a.scale + 1);
  expect(Math.abs(a.chipBox!.left - b.chipBox!.left), `${where}: and the N chip's left edge`).toBeLessThanOrEqual(a.scale + 1);
  expect(Math.abs(a.chipBox!.top - b.chipBox!.top), `${where}: and its top edge`).toBeLessThanOrEqual(a.scale + 1);
}

/** A few frames of the engine's own clock, then a moment for the HUD's placement to land. */
async function settleFrames(page: Page): Promise<void> {
  await page.waitForTimeout(900);
  await page.evaluate(async () => {
    const api = (window as unknown as { __pyrefly: { frame(): Promise<void> } }).__pyrefly;
    for (let i = 0; i < 60; i++) await api.frame();
  });
  await page.waitForTimeout(500);
}

for (const shape of SHAPES) {
  test.describe(`the advisor card at ${shape.width}x${shape.height}`, () => {
    test.use({ viewport: shape });

    for (const chapter of CHAPTERS) {
      test(`${chapter}: the card and its chip are up at the first menu, clear of every panel and fighter, and N puts it away and brings it back${(FOLDED_GUIDE as readonly string[]).includes(chapter) ? '; the guide starts folded, G opens it (the card is the tip) and G folds it again (the card is where it was)' : ''}`, async ({ page }) => {
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
        if ((FOLDED_GUIDE as readonly string[]).includes(chapter)) {
          clearOfTheGuideChip(p, where);
          expect(p.guideSetting, `${where}: the folded start is not the player's answer: the saved preference is still on (nothing was written)`).not.toBe(false);
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

        if ((FOLDED_GUIDE as readonly string[]).includes(chapter)) {
          // G opens the guide and the card is the one-row tip while it is open; G again and the card is where it was, the G chip clear throughout.
          await page.keyboard.press('KeyG');
          await settleFrames(page);
          const open = await probe(page);
          expect(open.guideUp, `${where}: G opens the guide`).toBe(true);
          expect(open.cardUp, `${where}: the card is still up`).toBe(true);
          tipIsClear(open, `${where}, guide open`);
          await page.keyboard.press('KeyG');
          await settleFrames(page);
          const again = await probe(page);
          expect(again.guideUp, `${where}: G folds the guide again`).toBe(false);
          expect(again.zone, `${where}: and the card is the card again`).toBe(p.zone);
          clearOfTheGuideChip(again, `${where}, folded again`);
          sameStand(p, again, `${where}, folded again`);
        }

        expect(errors, 'no page errors').toEqual([]);
      });
    }

    // The two giants' chapters start with the guide folded and the full card in its place: at the NEXT decision it is the card again, where it was, with the N chip beside the G chip; and with the guide
    // then OPENED (G) the card is the one-row tip (`advisorTip.ts`), which at the decision after must be the same row, not the full card's rows squeezed into it, and where it was.
    for (const chapter of FOLDED_GUIDE) {
      test(`${chapter}: at the next decision the card is up again, still the card, where it was, and the G chip is clear; with the guide opened the tip is still one row and where it was`, async ({ page }) => {
        test.setTimeout(900_000);
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        await openFirstMenu(page, chapter);
        await page.evaluate(() => (window as unknown as { __pyrefly: { setBattleSpeed(s: string): boolean } }).__pyrefly.setBattleSpeed('fast'));
        const where = `${chapter} at ${shape.width}x${shape.height}`;
        const first = await probe(page);
        expect(first.cardUp, `${where}: the card is up at the first menu`).toBe(true);
        clearOfTheGuideChip(first, `${where}, first menu`);
        expect(await nextDecision(page), `${where}: a turn passed`).toBe(true);
        const next = await probe(page);
        expect(next.cardUp, `${where}: the card is up at the next decision`).toBe(true);
        expect(next.chipUp, `${where}: and its chip`).toBe(true);
        expect(next.zone, `${where}: placed, not left on its own anchor`).not.toBe('free');
        if (next.zone === 'tip') {
          // The card did not fit the guide's rail even printed bare at this decision (a long board note, at the 4:3 type floor): a card cut off at its foot hides the move, so the HUD measured it and the tip stands in
          // for the decision (`FFXBattleHud.guardFoldedCard`). It is the folded guide's tip all the same: one row, and clear of the G chip.
          expect(next.guideUp, `${where}: the guide is still folded`).toBe(false);
          tipIsClear(next, `${where}, next decision (the card did not fit the rail)`);
        } else {
          clearOfTheGuideChip(next, `${where}, next decision`);
          sameStand(first, next, `${where}, next decision`);
          for (const [sel, box] of Object.entries(next.panels)) {
            if (box && !(TIP_CHIPS as readonly string[]).includes(sel)) expect(overlap(next.cardBox!, box), `${where}: the card must not touch ${sel}`).toBe(false);
          }
          for (const [i, f] of next.fighters.entries()) expect(overlap(next.cardBox!, f.box), `${where}: the card must not touch ${f.side} ${i}`).toBe(false);
        }

        // The guide opened with G: the tip, at this decision and at the one after it.
        await page.keyboard.press('KeyG');
        await settleFrames(page);
        const opened = await probe(page);
        expect(opened.guideUp, `${where}: the guide is open`).toBe(true);
        expect(opened.zone, `${where}: and the card is the tip`).toBe('tip');
        expect(await nextDecision(page), `${where}: another turn passed`).toBe(true);
        const later = await probe(page);
        expect(later.guideUp, `${where}: the guide is still open`).toBe(true);
        expect(later.cardUp, `${where}: the card is up at the decision after`).toBe(true);
        expect(later.chipUp, `${where}: and its chip`).toBe(true);
        expect(later.zone, `${where}: placed, not left on its own anchor`).not.toBe('free');
        if (later.zone === 'tip') {
          const rowPx = later.cardBox!.bottom - later.cardBox!.top;
          expect(rowPx, `${where}: the tip is one row (18 grid px at most, ${(18 * later.scale).toFixed(0)} px here), not the full card's rows (${rowPx.toFixed(0)} px)`).toBeLessThanOrEqual(18 * later.scale + 1);
          // And it is where it was: the camera is still gliding to the menu shot for the first seconds of a decision, and a tip solved against the fighters mid-glide stood in the bottom right
          // for the whole decision (the placement is held), a bar the eye has to find again at every turn. It is solved against the fighters where the shot comes to rest (`enemiesAtRest`).
          if (opened.zone === 'tip') {
            const slack = 2 * later.scale;
            expect(Math.abs(later.cardBox!.left - opened.cardBox!.left), `${where}: the tip's left edge is where it was at the decision before`).toBeLessThanOrEqual(slack);
            expect(Math.abs(later.cardBox!.top - opened.cardBox!.top), `${where}: and its top edge`).toBeLessThanOrEqual(slack);
          }
        }
        expect(errors, 'no page errors').toEqual([]);
      });
    }
  });
}
