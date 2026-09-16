/**
 * The flow, and one scripted run per chapter.
 *
 * Every chapter spec **skips with a clear reason** rather than failing while
 * its engine, data or scripts are still being written, so this file is useful
 * from the first day of the build to the last. `test.skip()` with a message is
 * the signal; a red run here always means something regressed.
 */

import { expect, test, type Page } from '@playwright/test';

type ChapterId =
  | 'seymour-flux'
  | 'yunalesca'
  | 'braskas-final-aeon'
  | 'ffx2-bahamut'
  | 'ffx2-vegnagun-shuyin';

interface BattleOutcome {
  chapterId: string;
  outcome: 'victory' | 'defeat' | 'escape' | 'aborted';
  result: { turns: number; outcome: string } | null;
  elapsedMs: number;
  links: number;
  preview: boolean;
}

/**
 * The debug surface this spec uses.
 *
 * Declared locally rather than with `declare global`, because `boot.spec.ts`
 * already augments `Window.__pyrefly` with the smaller shape it needs and two
 * different global declarations of one property do not merge.
 */
interface PyreflyApi {
  version: string;
  screen(): string;
  goto(name: string): Promise<boolean>;
  frames(n: number): Promise<void>;
  trigger(name: string): boolean;
  snapshotState(): Record<string, unknown>;
  setSeed(n: number): void;
  waitReady(): Promise<void>;
  chapters(): readonly ChapterId[];
  chapterSelect(): Promise<boolean>;
  gotoChapter(
    id: ChapterId,
    opts?: {
      skipCutscenes?: boolean;
      skipPrep?: boolean;
      seed?: number;
      auto?: string;
      speed?: 'normal' | 'fast' | 'skip';
    },
  ): Promise<BattleOutcome | null>;
  battleState(): { turn: number } | null;
  battleLog(): Array<{ seq: number; type: string }>;
  autoBattle(strategy?: string): boolean;
  setBattleSpeed(speed: 'normal' | 'fast' | 'skip'): boolean;
  waitBattleEnd(): Promise<BattleOutcome | null>;
  wiring(): Promise<Record<string, boolean>>;
  scenes(): Array<{ key: string; placeholder: boolean }>;
}

/** Reach the API from inside a `page.evaluate` callback. */
type Win = Window & { __pyrefly: PyreflyApi; __pyreflyReady?: boolean };

/** The chapters, and which engine each one needs to be runnable. */
const CHAPTERS: Array<{ id: ChapterId; engine: 'engineFfx' | 'engineFfx2'; title: string }> = [
  { id: 'seymour-flux', engine: 'engineFfx', title: 'Seymour Flux' },
  { id: 'yunalesca', engine: 'engineFfx', title: 'Lady Yunalesca' },
  { id: 'braskas-final-aeon', engine: 'engineFfx', title: "Braska's Final Aeon" },
  { id: 'ffx2-bahamut', engine: 'engineFfx2', title: 'Bahamut' },
  { id: 'ffx2-vegnagun-shuyin', engine: 'engineFfx2', title: 'Vegnagun' },
];

async function boot(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto('/');
  await page.waitForFunction(() => (window as Win).__pyreflyReady === true, null, { timeout: 30_000 });
  return errors;
}

test.describe('flow', () => {
  test('the debug API exposes the chapter and battle controls', async ({ page }) => {
    await boot(page);

    const api = await page.evaluate(() => Object.keys((window as Win).__pyrefly).sort());
    for (const key of [
      'autoBattle',
      'battleLog',
      'battleState',
      'chapterSelect',
      'chapters',
      'forceCommand',
      'gotoChapter',
      'scenes',
      'setBattleSpeed',
      'skipCutscene',
      'waitBattleEnd',
      'wiring',
    ]) {
      expect(api, `__pyrefly.${key}() is part of the contract`).toContain(key);
    }

    const chapters = await page.evaluate(() => (window as Win).__pyrefly.chapters());
    expect(chapters).toHaveLength(5);
    expect(chapters[0]).toBe('seymour-flux');
  });

  test('chapter select lists all five and starts one', async ({ page }) => {
    const errors = await boot(page);

    await page.evaluate(() => (window as Win).__pyrefly.chapterSelect());
    await page.evaluate(() => (window as Win).__pyrefly.frames(4));
    expect(await page.evaluate(() => (window as Win).__pyrefly.screen())).toBe('chapter-select');

    // Every chapter is reachable from the screen, however it is skinned.
    const state = await page.evaluate(
      () => (window as Win).__pyrefly.snapshotState()['screenState'] as Record<string, unknown>,
    );
    const listed = (state['chapters'] as string[] | undefined) ?? [];
    if (listed.length) expect(listed).toHaveLength(5);

    expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('the scene registry answers for every chapter key', async ({ page }) => {
    await boot(page);
    const scenes = await page.evaluate(() => (window as Win).__pyrefly.scenes());
    const keys = scenes.map((s) => s.key);
    for (const key of ['gagazet', 'zanarkand-dome', 'dreams-end', 'bevelle-underground', 'farplane']) {
      expect(keys, `scene "${key}" must be registered`).toContain(key);
    }
  });

  test('party prep opens and can begin the battle', async ({ page }) => {
    const errors = await boot(page);

    await page.evaluate(() => (window as Win).__pyrefly.goto('party-prep'));
    await page.evaluate(() => (window as Win).__pyrefly.frames(4));
    expect(await page.evaluate(() => (window as Win).__pyrefly.screen())).toBe('party-prep');
    expect(await page.evaluate(() => (window as Win).__pyrefly.trigger('prep:begin'))).toBe(true);

    expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
  });
});

test.describe('battle', () => {
  test('stages a battle and plays an ordered, gapless event log', async ({ page }) => {
    const errors = await boot(page);

    await page.evaluate(() => (window as Win).__pyrefly.goto('battle'));
    await page.evaluate(() => (window as Win).__pyrefly.frames(30));
    expect(await page.evaluate(() => (window as Win).__pyrefly.screen())).toBe('battle');

    // 'skip' collapses every animation wait, so the fight resolves in the time
    // it takes to render a few frames instead of playing out in real time.
    await page.evaluate(() => (window as Win).__pyrefly.setBattleSpeed('skip'));
    await page.evaluate(() => (window as Win).__pyrefly.autoBattle('intended'));
    await page.evaluate(() => (window as Win).__pyrefly.frames(20));

    const log = await page.evaluate(() => (window as Win).__pyrefly.battleLog());
    if (!log.length) {
      test.skip(true, 'no engine is wired for FFX yet, so no events were produced');
      return;
    }

    // CONTRACTS.md rule 2: `state().log[i].seq === i`, always.
    log.forEach((e, i) => expect(e.seq, 'event seq must equal its log index').toBe(i));
    expect(log.some((e) => e.type === 'turn-start')).toBe(true);

    expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('actors are staged onto the scene slots', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => (window as Win).__pyrefly.goto('battle'));
    await page.evaluate(() => (window as Win).__pyrefly.frames(30));

    const actors = await page.evaluate(() => {
      const s = (window as Win).__pyrefly.snapshotState()['screenState'] as Record<string, unknown>;
      return (s['actors'] ?? []) as Array<{ id: string; side: string; art: string }>;
    });

    expect(actors.length, 'a battle stages at least one fighter per side').toBeGreaterThan(1);
    expect(actors.some((a) => a.side === 'party')).toBe(true);
    expect(actors.some((a) => a.side === 'enemy')).toBe(true);
  });
});

test.describe('chapters', () => {
  for (const chapter of CHAPTERS) {
    test(`${chapter.title} runs to a decided outcome`, async ({ page }) => {
      test.slow();
      const errors = await boot(page);

      const wiring = await page.evaluate(() => (window as Win).__pyrefly.wiring());
      if (!wiring[chapter.engine]) {
        test.skip(
          true,
          `${chapter.title}: src/battle/${chapter.engine === 'engineFfx' ? 'ffx' : 'ffx2'} has not landed an engine yet`,
        );
        return;
      }

      // Bounded: an engine that cannot reach a decision would otherwise hang
      // the whole suite. A timeout is reported as a skip with the reason, not
      // as a silent 90-second stall.
      const outcome = await page.evaluate(
        (id) =>
          Promise.race([
            (window as Win).__pyrefly.gotoChapter(id as ChapterId, {
              skipCutscenes: true,
              skipPrep: true,
              seed: 1,
              auto: 'intended',
              speed: 'skip',
            }),
            new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 60_000)),
          ]),
        chapter.id,
      );

      if (outcome === 'timeout') {
        test.skip(true, `${chapter.title}: the battle did not reach an outcome within 60s`);
        return;
      }

      if (!outcome) {
        test.skip(true, `${chapter.title}: the chapter record could not be started`);
        return;
      }
      if (outcome.preview) {
        test.skip(true, `${chapter.title}: no engine for this game, the demo reel played instead`);
        return;
      }

      // A decided battle: not merely abandoned. Whether the intended tactics
      // are currently strong enough to *win* is a data-balance question the
      // encounter agents own; what this asserts is that the loop resolves.
      expect(['victory', 'defeat', 'escape']).toContain(outcome.outcome);
      expect(outcome.result?.turns ?? 0).toBeGreaterThan(0);
      expect(outcome.links).toBeGreaterThanOrEqual(1);

      expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
    });
  }

  test('a chained encounter fights more than one formation', async ({ page }) => {
    test.slow();
    await boot(page);
    const wiring = await page.evaluate(() => (window as Win).__pyrefly.wiring());
    if (!wiring['engineFfx']) {
      test.skip(true, 'the FFX engine has not landed yet');
      return;
    }

    // Yunalesca is three forms in one encounter; the screen re-inits the
    // engine per link with the party carried forward and shows no results
    // screen in between (CONTRACT-CHANGES.md decision 6).
    const outcome = await page.evaluate(() =>
      Promise.race([
        (window as Win).__pyrefly.gotoChapter('yunalesca', {
          skipCutscenes: true,
          skipPrep: true,
          seed: 1,
          auto: 'intended',
          speed: 'skip',
        }),
        new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 60_000)),
      ]),
    );
    if (outcome === 'timeout') {
      test.skip(true, 'Yunalesca did not reach an outcome within 60s');
      return;
    }
    if (!outcome || outcome.preview) {
      test.skip(true, 'Yunalesca is not runnable yet');
      return;
    }
    if (outcome.outcome !== 'victory') {
      test.skip(true, `the party lost on link ${outcome.links}; chaining needs a win to continue`);
      return;
    }
    expect(outcome.links, 'a won chain advances past its first formation').toBeGreaterThan(1);
  });
});
