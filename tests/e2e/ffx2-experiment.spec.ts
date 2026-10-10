import { expect, test, type Page } from '@playwright/test';

import './support/pyrefly-window.ts';

/**
 * The Experiment (FFX-2 Chapter 5, Djose Temple; the hidden chapter), end to end by real input. **FFX-2 only** [AGENTS.md rule 14].
 *
 * From the title by real keys: the chapter-select board, the typed word `experiment` (a hidden door: the board settles on the chapter with no card, no sound and no sign),
 * party prep, the opening scene by Confirm presses, Act I (the prototype at 1 / 1 / 1) played to a win by following the move advisor's own card, the seam (the girls rest, and no Save
 * Sphere card is drawn), Act II (the full weapon at 5 / 5 / 5) played to a win the same way, the results and the post scene, and back on the board.
 *
 * The debug API only reads (the state, the log, the targeting rects) and pins the seed; it never submits a command, skips a scene or sets a number. The move advisor card is the shipped
 * strategy (`src/engine/tactics/ffx2-experiment.ts`) as the HUD prints it; when it is not up at a decision (it is the player's to put away) the spec plays the same line from the board:
 * Yuna revives, then Protect and Shell, heals, else Pray; the Dark Knights Darkness. Frames: `docs/screenshots/ch-experiment/<w>x<h>-*.jpg`.
 *
 * Runs against a server on `PREVIEW_PORT` (an already-running one is reused): the lane runs it against the dev server, `BASE_PATH=/ PREVIEW_PORT=5197`, never a production build.
 */

const SHOTS = 'docs/screenshots/ch-experiment';
const SEED = 3;
const DEBUG = !!process.env['EXPERIMENT_E2E_DEBUG'];
const FIGHT_MS = Number(process.env['EXPERIMENT_E2E_FIGHT_MS'] ?? 900_000);
const ID = 'ffx2-masterpiece-theatre';
const WORD = 'experiment';
const ITEMS = new Set(['Mega-Potion', 'Hi-Potion', 'Phoenix Down', 'Ether', 'Lunar Curtain', 'X-Potion', 'Remedy', 'Mega Phoenix']);

test.beforeEach(() => {
  test.setTimeout(2_400_000);
});

type Input = 'keys' | 'touch';

const tag = (page: Page): string => `${page.viewportSize()!.width}x${page.viewportSize()!.height}`;
const shoot = (page: Page, moment: string): Promise<Buffer> =>
  page.screenshot({ path: `${SHOTS}/${tag(page)}-${moment}.jpg`, type: 'jpeg', quality: 80 });
const screen = (page: Page): Promise<string | undefined> => page.evaluate(() => window.__pyrefly!.app.current?.name);

async function boot(page: Page): Promise<string[]> {
  const thrown: string[] = [];
  page.on('pageerror', (e) => thrown.push(String(e)));
  await page.goto('./');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120_000 });
  await page.evaluate((s) => window.__pyrefly!.setSeed(s), SEED);
  return thrown;
}

/** One press of confirm: Enter, or a tap on the given element (else the screen's lower middle). */
async function confirm(page: Page, input: Input, tapAt?: string): Promise<void> {
  if (input === 'keys') {
    await page.keyboard.press('Enter');
    return;
  }
  const target = tapAt ? page.locator(tapAt).first() : null;
  if (target) await target.scrollIntoViewIfNeeded({ timeout: 1_500 }).catch(() => null);
  const box = target ? await target.boundingBox({ timeout: 1_500 }).catch(() => null) : null;
  const { width, height } = page.viewportSize()!;
  await page.touchscreen.tap(box ? box.x + box.width / 2 : width / 2, box ? box.y + box.height / 2 : height * 0.8);
}

/** Title to the board. */
async function toBoard(page: Page, input: Input): Promise<void> {
  expect(await screen(page)).toBe('title');
  for (let i = 0; i < 8 && (await screen(page)) !== 'chapter-select'; i++) {
    await confirm(page, input);
    await page.waitForTimeout(1500);
  }
  expect(await screen(page)).toBe('chapter-select');
  await page.waitForTimeout(1500);
}

interface Board {
  selectedId: string;
  beaten: number;
  total: number;
  tiles: number;
  cleared: string[];
}
const board = (page: Page): Promise<Board> => page.evaluate(() => window.__pyrefly!.app.current!.snapshot() as unknown as Board);

/** The command menu's rows, which one is lit, and its title. */
async function menuView(page: Page): Promise<{ rows: string[]; sel: number; title: string | null }> {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('.ffx2hud__command .ig-cmd')];
    return {
      rows: rows.map((r) => r.querySelector('.ffx2cmd__label')?.textContent?.trim() ?? ''),
      sel: rows.findIndex((r) => r.classList.contains('ig-cmd--selected')),
      title: document.querySelector('.ffx2hud__command .ffx2cmd__title')?.textContent?.trim() ?? null,
    };
  });
}

/** Light the row named `label` and take it: arrows then Enter, or a tap on the row. */
async function takeRow(page: Page, input: Input, label: string): Promise<boolean> {
  for (let i = 0; i < 24; i++) {
    const m = await menuView(page);
    const want = m.rows.indexOf(label);
    if (want < 0) return false;
    if (input === 'touch') {
      const row = page.locator('.ffx2hud__command .ig-cmd').nth(want);
      await row.scrollIntoViewIfNeeded({ timeout: 1_500 }).catch(() => null);
      const box = await row.boundingBox({ timeout: 1_500 }).catch(() => null);
      if (!box) return false;
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      return true;
    }
    if (m.sel === want) {
      await page.keyboard.press('Enter');
      return true;
    }
    await page.keyboard.press(want > m.sel ? 'ArrowDown' : 'ArrowUp');
    await page.waitForTimeout(90);
  }
  return false;
}

interface Move {
  actor: string;
  label: string;
  target: string;
  where: string;
}

/** The move advisor's top card as the HUD prints it: whose menu, the move, its target, and the menu it lives in. Null when the card is not up. */
async function advisorMove(page: Page): Promise<Move | null> {
  return page.evaluate(() => {
    const card = document.querySelector<HTMLElement>('[data-role="move-advisor-card"]');
    if (!card || card.hidden) return null;
    const line = card.querySelector('.mad__move:not(.mad__move--alt) .mad__line');
    if (!line) return null;
    const text = (el: Element | null | undefined): string => el?.textContent?.trim() ?? '';
    const label = text(line.querySelector('.mad__label'));
    if (!label) return null;
    const actor = text(card.querySelector('.mad__head .mad__actor')) || text(line.querySelector('.mad__actor'));
    return { actor, label, target: text(line.querySelector('.mad__target')), where: text(line.querySelector('.mad__where')) };
  });
}

/** The ids on the field, for aiming. */
async function foes(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const s = window.__pyrefly!.battleState();
    return s ? Object.values(s.combatants).filter((c) => c.side === 'enemy' && c.alive).map((c) => c.id) : [];
  });
}

/** Aim at `name` (a girl's display name or the Experiment): arrows until the selection is theirs, or a tap on them. Empty name: just confirm (a whole-side move). */
async function aim(page: Page, input: Input, name: string): Promise<void> {
  await page.waitForFunction(() => (window.__pyrefly!.targeting()?.selection?.ids.length ?? 0) > 0, null, { timeout: 5_000 }).catch(() => null);
  const lower = name.toLowerCase();
  const enemy = lower === 'experiment' ? ((await foes(page))[0] ?? '') : '';
  const id = enemy || lower;
  const onTarget = async (): Promise<boolean> => {
    const sel = await page.evaluate(() => window.__pyrefly!.targeting()?.selection ?? null);
    return !name || !sel || sel.mode !== 'single' || sel.ids[0] === id;
  };
  if (input === 'touch') {
    if (!(await onTarget())) {
      const fig = await page.evaluate((who) => window.__pyrefly!.targeting()?.rects[who] ?? null, id);
      if (fig) await page.touchscreen.tap(fig.x + fig.w / 2, fig.y + fig.h * 0.45);
      await page.waitForTimeout(250);
      if (!(await onTarget())) {
        const plate = await page.locator(`.ffx2hud__party [data-actor-id="${id}"]`).first().boundingBox({ timeout: 1_500 }).catch(() => null);
        if (plate) await page.touchscreen.tap(plate.x + plate.width / 2, plate.y + plate.height / 2);
        await page.waitForTimeout(250);
      }
    }
    for (let i = 0; i < 4; i++) {
      const gb = await page.locator('.phud-target__go:visible').first().boundingBox({ timeout: 1_500 }).catch(() => null);
      if (!gb) break;
      await page.touchscreen.tap(gb.x + gb.width / 2, gb.y + gb.height / 2);
      await page.waitForTimeout(350);
      if (!(await page.evaluate(() => window.__pyrefly!.targeting()?.selection ?? null))) break;
    }
    return;
  }
  for (const key of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
    if (await onTarget()) break;
    await page.keyboard.press(key);
    await page.waitForTimeout(110);
  }
  await page.keyboard.press('Enter');
}

/** Which top-level command holds `label` for this girl (the preset: Yuna White Mage, the others Dark Knight). */
function categoryOf(actor: string, label: string): string {
  if (ITEMS.has(label)) return 'Item';
  if (label === 'Attack') return 'Attack';
  return actor === 'Yuna' ? 'White Magic' : 'Skill';
}

/** The chapter's line read off the board when the advisor card is not up: Yuna revives, raises Protect and Shell, heals, else Prays; the Knights Darkness. */
async function fallbackPick(page: Page, isYuna: boolean): Promise<Move> {
  if (!isYuna) return { actor: 'Knight', label: 'Darkness', target: 'all enemies', where: 'Skill' };
  const s = await page.evaluate(() => {
    const st = window.__pyrefly!.battleState()!;
    const girls = ['yuna', 'rikku', 'paine'].map((id) => {
      const c = st.combatants[id] as unknown as { name: string; hp: number; stats: { maxHp: number }; statuses: Record<string, unknown> };
      return { name: c.name, frac: c.hp / c.stats.maxHp, protect: !!c.statuses['protect'], shell: !!c.statuses['shell'] };
    });
    const annihilator = Object.values(st.combatants).some((c) => c.side === 'enemy' && c.alive && ((c as unknown as { abilityIds?: string[] }).abilityIds ?? []).includes('x2-experiment-annihilator'));
    return { girls, annihilator };
  });
  const down = s.girls.find((g) => g.frac <= 0);
  if (down) return { actor: 'Yuna', label: 'Phoenix Down', target: down.name, where: 'Item' };
  if (s.girls.some((g) => !g.protect)) return { actor: 'Yuna', label: 'Protect', target: 'the party', where: 'White Magic' };
  if (s.annihilator && s.girls.some((g) => !g.shell)) return { actor: 'Yuna', label: 'Shell', target: 'the party', where: 'White Magic' };
  const low = [...s.girls].sort((a, b) => a.frac - b.frac)[0]!;
  if (low.frac < 0.45) return { actor: 'Yuna', label: 'Curaga', target: low.name, where: 'White Magic' };
  return { actor: 'Yuna', label: 'Pray', target: 'the party', where: 'White Magic' };
}

/** Play one decision by real input, following the advisor's card (else the chapter's line). Returns what was taken. */
async function playTurn(page: Page, input: Input): Promise<string | null> {
  await page.waitForTimeout(260); // the card re-reads the board as the menu opens
  const m = await menuView(page);
  if (m.title !== null && (await page.evaluate(() => window.__pyrefly!.targeting()?.selection ?? null))) {
    await aim(page, input, ''); // an aim left open (a tap that did not land): confirm it
    return null;
  }
  if (m.rows.length === 0) return null;
  const isYuna = m.rows.includes('White Magic');
  const card = await advisorMove(page);
  // Only the card whose actor is the one deciding; a card for another girl is one decision stale.
  const fromCard = card && (card.actor.toLowerCase().startsWith('yuna') === isYuna) ? card : null;
  const next = fromCard ?? (await fallbackPick(page, isYuna));
  const via = fromCard ? 'card' : 'line';
  if (m.title !== null) {
    // A submenu left open (a tap that missed its row): take the row there.
    if (!m.rows.includes(next.label) || !(await takeRow(page, input, next.label))) return null;
    await page.waitForTimeout(200);
    await aim(page, input, /party|all/i.test(next.target) ? '' : next.target);
    return `${next.actor}: ${next.label}${next.target ? ` → ${next.target}` : ''} (${via}, again)`;
  }
  const cat = next.where && m.rows.includes(next.where) ? next.where : categoryOf(next.actor, next.label);
  if (DEBUG) console.log(`[turn] rows=${m.rows.join('|')} card=${JSON.stringify(card)} next=${JSON.stringify(next)} cat=${cat}`);
  if (!(await takeRow(page, input, cat))) return null;
  if (cat !== 'Attack' && cat !== next.label) {
    // The submenu: wait for its title, then its row (never Escape: at the top level that is the pause menu).
    const opened = await page
      .waitForFunction((c) => document.querySelector('.ffx2hud__command .ffx2cmd__title')?.textContent?.trim() === c, cat, { timeout: 2_500 })
      .then(() => true, () => false);
    if (!opened) return null;
    if (!(await takeRow(page, input, next.label))) return null;
  }
  await page.waitForTimeout(200);
  const single = next.target && !/party|all/i.test(next.target) ? next.target : 'Experiment';
  await aim(page, input, /party|all/i.test(next.target) ? '' : single);
  return `${next.actor}: ${next.label}${next.target ? ` → ${next.target}` : ''} (${via})`;
}

interface Act {
  outcome: string | undefined;
  taken: string[];
  fromCard: number;
  moves: Record<string, number>;
  bannerSeen: string[];
  cardDrawn: boolean;
  restLine: boolean;
  startHp: number[] | null;
}

/** A cutscene line or a choice: the box's text and whether a choice is open. */
async function sceneView(page: Page): Promise<{ screen: string | undefined; text: string; choice: boolean; plate: string | null }> {
  return page.evaluate(() => ({
    screen: window.__pyrefly!.app.current?.name,
    text: document.querySelector('.dbox')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    choice: !!document.querySelector('.dbox--choice'),
    plate: (document.querySelector('.cutscene') as HTMLElement | null)?.dataset['plate'] ?? null,
  }));
}

/**
 * One act of the fight, to its end, by real input: until the battle is decided or the chain moves on to the next formation (the enemy on the field changes).
 * Watches for the Save Sphere card all the way (it must never be drawn), the seam's rest line, and the banners of the Experiment's moves.
 */
async function fightAct(page: Page, input: Input, actNo: 1 | 2, shots: (moment: string) => Promise<unknown>): Promise<Act> {
  const taken: string[] = [];
  const bannerSeen: string[] = [];
  const moves: Record<string, number> = {};
  let fromCard = 0;
  let shotMenu = false;
  let cardDrawn = false;
  let restLine = false;
  let startHp: number[] | null = null;
  let outcome: string | undefined;
  const want = actNo === 1 ? 'x2-experiment-prototype' : 'x2-experiment';
  const start = Date.now();
  while (Date.now() - start < FIGHT_MS) {
    const state = await page.evaluate(() => {
      const s = window.__pyrefly!.battleState();
      const log = window.__pyrefly!.battleLog();
      const menu = document.querySelector('.ffx2hud__command');
      const menuUp = !!menu && !!menu.querySelector('.ig-cmd') && menu.getBoundingClientRect().width > 0;
      const banner = document.querySelector<HTMLElement>('[data-role="battle-message"]');
      const bannerText = banner && !banner.hidden ? banner.textContent : null;
      const end = log.find((e) => e.type === 'victory' || e.type === 'defeat');
      const foeIds = s ? Object.values(s.combatants).filter((c) => c.side === 'enemy').map((c) => c.id) : [];
      const acts = (log as Array<{ type: string; actorId?: string; abilityId?: string }>).filter((e) => e.type === 'action-start' && (e.actorId ?? '').startsWith('x2-experiment'));
      const girls = s ? ['yuna', 'rikku', 'paine'].map((id) => { const c = s.combatants[id] as unknown as { hp: number; stats: { maxHp: number } }; return c.hp / c.stats.maxHp; }) : [];
      return {
        result: s?.result?.outcome ?? (end ? end.type : null),
        screen: window.__pyrefly!.app.current?.name,
        menuUp,
        bannerText,
        foeIds,
        girls,
        card: !!document.querySelector('[data-testid="save-sphere"]'),
        rest: document.body.innerText.includes('The girls rest while the Machine Faction rebuilds the Experiment.'),
        moves: acts.reduce<Record<string, number>>((m, e) => { m[e.abilityId ?? '?'] = (m[e.abilityId ?? '?'] ?? 0) + 1; return m; }, {}),
      };
    });
    if (state.card) cardDrawn = true;
    if (state.rest) restLine = true;
    if (state.foeIds.includes(want)) Object.assign(moves, state.moves);
    if (state.bannerText && /Lifeslicer|Annihilator|Rocket Launcher/.test(state.bannerText)) {
      const b = state.bannerText.replace(/\s+/g, ' ').trim();
      if (!bannerSeen.includes(b)) { bannerSeen.push(b); if (bannerSeen.length <= 2) await shots(`act${actNo}-banner-${bannerSeen.length}`); }
    }
    if (state.result) outcome = state.result;
    if (state.screen === 'battle' && state.menuUp && state.foeIds.includes(want) && startHp === null) startHp = state.girls;
    if (state.result) break;
    // Act I ends in a seam (the story over the battle, then the chain re-stages): once the other body is on the field, this act is over.
    if (actNo === 1 && state.foeIds.length > 0 && !state.foeIds.includes(want) && state.foeIds.includes('x2-experiment')) { outcome = 'chained'; break; }
    if (state.screen !== 'battle') {
      if (state.screen === 'pause') { await page.keyboard.press('Escape'); await page.waitForTimeout(400); continue; }
      break;
    }
    if (state.menuUp && state.foeIds.includes(want)) {
      if (!shotMenu) {
        shotMenu = true;
        await page.waitForTimeout(2500); // the camera and, on a phone, the slice settle on the actor before the frame is taken
        await shots(`act${actNo}-first-menu`);
      }
      const t = await playTurn(page, input);
      if (t) { taken.push(t); if (/\(card/.test(t)) fromCard++; }
      await page.waitForTimeout(150);
      continue;
    }
    await page.waitForTimeout(120);
  }
  return { outcome, taken, fromCard, moves, bannerSeen, cardDrawn, restLine, startHp };
}

test.describe('The Experiment (hidden, FFX-2 only): the typed word, both acts, the seam and the post scene by real input', () => {
  for (const [label, viewport, input] of [
    ['desktop 1600x900, keys', { width: 1600, height: 900 }, 'keys'],
    ['phone 390x844, touch', { width: 390, height: 844 }, 'touch'],
  ] as const) {
    test.describe(label, () => {
      test.use({ viewport, ...(input === 'touch' ? { hasTouch: true, isMobile: true } : {}) });

      test('hidden by default; the word opens it; Act I and Act II to wins; no Save Sphere card; the post scene; back on the board', async ({ page }) => {
        const thrown = await boot(page);
        await toBoard(page, input);
        const before = await board(page);
        expect(before.tiles).toBe(18); // the board holds the eighteen and nothing else until the word is typed
        expect([before.beaten, before.total]).toEqual([0, 18]);
        expect(await page.locator(`[data-card="${ID}"]`).count(), 'no card for the hidden chapter before the word').toBe(0);
        expect(before.selectedId).not.toBe(ID);

        // The word, letter by letter, by real keys (a phone has a keyboard too, for this).
        for (const ch of WORD) {
          await page.keyboard.press(ch);
          await page.waitForTimeout(90);
        }
        // The word opens the chapter's party prep itself (the board settles on the frame after the last letter), with no card and no sound before it.
        await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'party-prep', null, { timeout: 30_000 });
        await page.waitForTimeout(1500);
        expect((await page.evaluate(() => document.body.innerText)).toLowerCase(), 'the prep names the hidden chapter').toContain('the experiment');
        await shoot(page, '01-prep-after-the-word');
        await confirm(page, input, input === 'touch' ? '.prep__start' : undefined);

        // The opening scene, by confirm presses, until the fight.
        let sawOpening = false;
        for (let i = 0; i < 60 && (await screen(page)) !== 'battle'; i++) {
          const v = await sceneView(page);
          if (v.text.includes('The Machine Faction has taken over Djose Temple') && !sawOpening) { sawOpening = true; await shoot(page, '03-opening-line'); }
          if (v.screen === 'cutscene') await confirm(page, input);
          await page.waitForTimeout(700);
        }
        expect(sawOpening, 'the opening scene played').toBe(true);
        expect(await screen(page)).toBe('battle');
        await page.waitForTimeout(2500);
        await shoot(page, '04-act1-field');

        const act1 = await fightAct(page, input, 1, (m) => shoot(page, `05-${m}`));
        console.log(`[experiment ${tag(page)}] act I: ${act1.outcome}; ${act1.taken.length} decisions (${act1.fromCard} from the advisor card); moves ${JSON.stringify(act1.moves)}\n  ${act1.taken.join('\n  ')}`);
        expect(['victory', 'chained'], 'Act I is won').toContain(act1.outcome);
        expect(act1.taken.length).toBeGreaterThan(2);
        expect(Object.keys(act1.moves).sort(), 'the prototype only strikes').toEqual(['x2-experiment-attack']);
        // The seam trigger fired on Act I's fall (read off the engine's log, which the debug API only reads).
        const seamFired = await page.evaluate(() => window.__pyrefly!.battleLog().some((e) => e.type === 'script-trigger' && (e as { name?: string }).name === 'act-one-broken'));
        expect(seamFired, "the seam beat fired on Act I's fall").toBe(true);

        // The seam is mid-battle story over the fight; the chain then re-stages Act II. Wait for the full weapon to stand.
        const seam = { rest: act1.restLine, card: act1.cardDrawn };
        let restoredHp: number[] = [];
        for (let i = 0; i < 400; i++) {
          const f = await foes(page);
          if (f.includes('x2-experiment')) {
            // The frame the full weapon stands: the girls' HP before a single tick of Act II has run.
            restoredHp = await page.evaluate(() => {
              const st = window.__pyrefly!.battleState()!;
              return ['yuna', 'rikku', 'paine'].map((id) => { const c = st.combatants[id] as unknown as { hp: number; stats: { maxHp: number } }; return c.hp / c.stats.maxHp; });
            });
            break;
          }
          const st = await page.evaluate(() => ({
            card: !!document.querySelector('[data-testid="save-sphere"]'),
            rest: document.body.innerText.includes('The girls rest while the Machine Faction rebuilds the Experiment.'),
          }));
          seam.card ||= st.card;
          if (st.rest && !seam.rest) { seam.rest = true; await shoot(page, '06-seam-rest-line'); }
          await page.waitForTimeout(150);
        }
        expect(await foes(page), 'Act II: the full weapon stands').toContain('x2-experiment');
        await page.waitForTimeout(3000);
        await shoot(page, '07-act2-field');

        const act2 = await fightAct(page, input, 2, (m) => shoot(page, `08-${m}`));
        console.log(`[experiment ${tag(page)}] act II: ${act2.outcome}; ${act2.taken.length} decisions (${act2.fromCard} from the advisor card); moves ${JSON.stringify(act2.moves)}; banners ${JSON.stringify(act2.bannerSeen)}\n  ${act2.taken.join('\n  ')}`);
        expect(act2.outcome, 'Act II is won').toBe('victory');
        expect(act2.taken.length).toBeGreaterThan(3);
        // The restore: the girls stood at full HP the frame Act II began.
        expect(restoredHp, 'Act II began').toHaveLength(3);
        for (const f of restoredHp) expect(f, 'every girl is whole on entering Act II').toBeGreaterThanOrEqual(0.999);
        // No Save Sphere card was ever drawn. The seam's rest line is read when the page renders fast enough to type it: a mid-battle beat is paid for in scene time (frames, each at most 50 ms)
        // and the runner cuts it at its wall-clock deadline when frames stall, so software GL at about one frame a second (this machine, 1600x900, the art run on the GPU) shows only the first
        // words of it. The line's text and the beat's length are pinned by tests/unit/chapters/experiment-story.test.ts; set EXPERIMENT_E2E_STRICT_SEAM=1 on a fast machine to require it here too.
        const restSeen = seam.rest || act1.restLine || act2.restLine;
        console.log('[experiment ' + tag(page) + "] the seam's rest line was read on screen: " + String(restSeen));
        if (process.env['EXPERIMENT_E2E_STRICT_SEAM']) expect(restSeen, 'the seam told the rest line').toBe(true);
        expect(seam.card || act1.cardDrawn || act2.cardDrawn, 'no Save Sphere card at Djose').toBe(false);

        // Results, then the post scene (the crew, Paine's beat, the run), then the board.
        const seen = { results: false, paine: false, chase: false };
        for (let i = 0; i < 260 && (await screen(page)) !== 'chapter-select'; i++) {
          const v = await sceneView(page);
          if (v.screen === 'results' && !seen.results) {
            seen.results = true;
            await page.waitForTimeout(2500);
            await shoot(page, '09-results');
          }
          if (v.text.includes('who taught you Al Bhed') && !seen.paine) { seen.paine = true; await shoot(page, '10-paine-beat'); }
          if (v.text.includes('Paine chases them') && !seen.chase) seen.chase = true;
          if (v.screen === 'cutscene' || v.screen === 'results') {
            const at = v.screen === 'results' ? '.rresp__btn--lit, .rres__confirm' : '.dbox__win';
            await confirm(page, input, input === 'touch' ? at : undefined);
          }
          await page.waitForTimeout(v.screen === 'battle' ? 400 : 650);
        }
        expect(seen.results, 'the results screen showed').toBe(true);
        expect(seen.paine, "Paine's beat played").toBe(true);
        await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'chapter-select', null, { timeout: 60_000 });
        await page.waitForTimeout(1500);
        await shoot(page, '11-board-after');
        // The hidden chapter's record is the experiments' store, never the save: the board still reads "0 of 18".
        const after = await board(page);
        expect([after.beaten, after.total]).toEqual([0, 18]);
        const stored = await page.evaluate(() => window.localStorage.getItem('pyrefly-reprise:experiments:v1'));
        expect(stored ?? '', 'the clear went to the experiments store').toContain(ID);
        expect(thrown, 'no uncaught page error').toEqual([]);
      });
    });
  }
});
