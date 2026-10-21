// @vitest-environment jsdom
/**
 * RELEASE 62, PR-0487 (minor, FFX only): Auron's first-command tip is keyed by chapter.
 *
 * Release 61 replaced "He moves after you. Not before. Use it." with "He strikes first. Weather it, then hit back." (Bailey, decision 168c; true at Chapter I's first menu in 75 of 100 seeds). The coach
 * keys a line by mechanic, so the new line then showed at the first menu of every FFX chapter, and it is false in the chapters where the party opens (round 28's deep review). Now `turnOrderLine.ts`
 * names the chapters that show a line: Chapter I the new one, the chapters where the party opens in every seed the old one, every other chapter none.
 *
 * Game case: FFX only (Auron is FFX's voice; FFX-2's Rikku lines and the FFX-2 chapters are not touched and a test below says so).
 *
 * The truth of each line is read off the engine (hard rule 3): the first `player-input` decision of `setupForChapter(chapter, seed)`, and an `action-start` already in the log means an enemy acted first.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import type { AvailableCommand, BattleEvent, BattleState, Command, CombatantId, MinigameKind, MinigameResult, TurnPreview, AtbSnapshot } from '../../src/battle/common/types.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS } from '../../src/data/encounters.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { markForMenu, withCoach } from '../../src/ui/coach/CoachLayer.ts';
import { FFX_MARKS } from '../../src/ui/coach/coachCopy.ts';
import { resetCoach, setCoachingEnabled } from '../../src/ui/coach/coachState.ts';
import { TURN_ORDER_ENEMY_FIRST, TURN_ORDER_LINES, TURN_ORDER_PARTY_FIRST, turnOrderBodyFor } from '../../src/ui/coach/turnOrderLine.ts';

const everyChapter = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS];
const ffxChapters = everyChapter.filter((c) => c.game === 'ffx');

/** The chapters that show no line: neither line is true in every seed, or the brief leaves them without one (see `turnOrderLine.ts`). */
const NO_LINE = ['yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania', 'yojimbo-cavern', 'isaaru-via-purifico', 'sin-face', 'biran-yenke'];
const PARTY_FIRST = ['evrae-airship', 'seymour-natus', 'seymour-omnis', 'sin-fins-core', 'mirror-aeons', 'sinspawn-gui', 'exp-fayth', 'last-summoning'];

describe('which chapter shows which line', () => {
  it('Chapter I (seymour-flux) has the new line, Bailey\'s pick', () => {
    expect(turnOrderBodyFor('seymour-flux')).toBe('“He strikes first. Weather it, then hit back.”');
    expect(TURN_ORDER_ENEMY_FIRST).toBe(FFX_MARKS.find((m) => m.id === 'ffx-turn-order')!.body); // the deck's own body is still the new line
  });

  it('the chapters where the party opens in every seed have the line they had before release 61, word for word', () => {
    for (const id of PARTY_FIRST) expect(turnOrderBodyFor(id), id).toBe('“He moves after you. Not before. Use it.”');
    expect(TURN_ORDER_PARTY_FIRST).toBe('“He moves after you. Not before. Use it.”');
  });

  it('every other chapter has none', () => {
    for (const id of NO_LINE) expect(turnOrderBodyFor(id), id).toBeNull();
    expect(turnOrderBodyFor('ffx2-bahamut')).toBeNull();
    expect(turnOrderBodyFor('not-a-chapter')).toBeNull();
  });

  it('every FFX chapter is accounted for, so a new one forces a decision; every chapter named is a real FFX chapter', () => {
    const named = new Set([...Object.keys(TURN_ORDER_LINES), ...NO_LINE]);
    for (const c of ffxChapters) expect(named.has(c.id), `${c.id} (FFX) has no entry`).toBe(true);
    for (const id of named) expect(ffxChapters.some((c) => c.id === id), `${id} is not an FFX chapter`).toBe(true);
    expect(Object.keys(TURN_ORDER_LINES).sort()).toEqual(['seymour-flux', ...PARTY_FIRST].sort());
  });

  it('no FFX-2 chapter is keyed (game case: FFX only)', () => {
    for (const c of everyChapter.filter((x) => x.game !== 'ffx')) expect(TURN_ORDER_LINES[c.id], c.id).toBeUndefined();
  });
});

describe('the lines are true at the menu they appear at (the engine)', () => {
  const N = 20;
  let enemyFirst: Record<string, number>;

  beforeEach(async () => {
    if (enemyFirst) return;
    await registerBattleContent();
    enemyFirst = {};
    for (const id of [...Object.keys(TURN_ORDER_LINES), ...NO_LINE]) {
      const chapter = ffxChapters.find((c) => c.id === id)!;
      let n = 0;
      for (let seed = 1; seed <= N; seed++) {
        const setup = setupForChapter(chapter, seed);
        const engine = new FFXEngine({ autoResolveMinigames: true });
        engine.setSeed(setup.seed);
        engine.init(setup);
        for (let i = 0; i < 2000; i++) {
          const d = engine.nextDecision();
          if (d.kind === 'player-input') {
            if (engine.state().log.some((e: BattleEvent) => e.type === 'action-start')) n++;
            break;
          }
          if (d.kind === 'battle-over') break;
        }
      }
      enemyFirst[id] = n;
    }
  }, 60_000);

  it('the old line shows only where no enemy acts before the first menu, in any seed', () => {
    for (const id of PARTY_FIRST) expect(enemyFirst[id], `${id}: seeds (of ${N}) where an enemy acted first`).toBe(0);
  });

  it('the new line shows in Chapter I, where an enemy acts first in most seeds (Bailey\'s pick; not every seed: about 75 of 100)', () => {
    expect(enemyFirst['seymour-flux']!).toBeGreaterThan(N * 0.5);
  });

  it('the chapters left without a line are the mixed ones, or open with the enemy in every seed (the brief leaves those without one)', () => {
    for (const id of ['yunalesca', 'braskas-final-aeon']) {
      expect(enemyFirst[id]!, `${id}: mixed`).toBeGreaterThan(0);
    }
    expect(enemyFirst['yunalesca']!).toBeLessThan(N);
    for (const id of ['seymour-anima-macalania', 'yojimbo-cavern', 'isaaru-via-purifico', 'sin-face', 'biran-yenke']) expect(enemyFirst[id], `${id}: the enemy opens in every seed`).toBe(N);
  });
});

// ---------------------------------------------------------------------------- the wrapper

class SpyHud implements HudPort {
  menuOpened = 0;
  mount(): void {}
  unmount(): void {}
  sync(_s: BattleState, _p: TurnPreview[] | AtbSnapshot): void {}
  chooseCommand(): Promise<Command> {
    this.menuOpened += 1;
    return Promise.resolve({ kind: 'attack', actor: 'a' as CombatantId, targets: [] } as Command);
  }
  onEvent(_e: BattleEvent): void {}
  openMinigame(_k: MinigameKind, _p: Record<string, unknown>): Promise<MinigameResult> {
    return Promise.resolve({} as MinigameResult);
  }
  setVisible(): void {}
  setProjector(): void {}
}

function rows(kinds: Array<Command['kind']>): AvailableCommand[] {
  return kinds.map((kind) => ({ command: { kind, actor: 'a' as CombatantId, targets: [] } as Command, label: kind, category: 'attack', mpCost: 0, enabled: true, validTargets: [] }));
}

const preview = (): TurnPreview[] => [];
const markEl = (root: HTMLElement): HTMLElement | null => root.querySelector<HTMLElement>('[data-role="coach-mark"]');

describe('the coach at the first FFX command menu', () => {
  let root: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    root = document.createElement('div');
    document.body.appendChild(root);
    resetCoach();
    setCoachingEnabled(true);
  });

  const firstMenu = async (chapterId: string | undefined, kinds: Array<Command['kind']> = ['attack']): Promise<{ mark: string | null; menus: number }> => {
    const spy = new SpyHud();
    const hud = withCoach('ffx', spy, { reduceMotion: true, setTimer: () => 0, clearTimer: () => undefined, ...(chapterId !== undefined ? { chapterId } : {}) });
    hud.mount(root);
    await hud.chooseCommand('tidus' as CombatantId, rows(kinds), preview);
    const el = markEl(root);
    return { mark: el?.dataset['mark'] ?? null, menus: spy.menuOpened };
  };

  it('Chapter I: Auron says the new line', async () => {
    const r = await firstMenu('seymour-flux');
    expect(r.mark).toBe('ffx-turn-order');
    expect(markEl(root)!.textContent).toContain('He strikes first. Weather it, then hit back.');
    expect(markEl(root)!.textContent).not.toContain('He moves after you');
  });

  it('Evrae (the party opens): Auron says the line the first menu had before release 61', async () => {
    const r = await firstMenu('evrae-airship');
    expect(r.mark).toBe('ffx-turn-order');
    expect(markEl(root)!.textContent).toContain('He moves after you. Not before. Use it.');
    expect(markEl(root)!.textContent).not.toContain('He strikes first');
  });

  it('a chapter with no line shows no turn-order card, still opens the menu, and does not use the line up for a later chapter', async () => {
    const r = await firstMenu('yunalesca');
    expect(r.menus).toBe(1);
    expect(markEl(root)).toBeNull();
    // The next chapter's first menu still teaches (the line was never marked seen).
    const spy2 = new SpyHud();
    const hud2 = withCoach('ffx', spy2, { reduceMotion: true, setTimer: () => 0, clearTimer: () => undefined, chapterId: 'seymour-flux' });
    hud2.mount(root);
    await hud2.chooseCommand('tidus' as CombatantId, rows(['attack']), preview);
    expect(markEl(root)?.dataset['mark']).toBe('ffx-turn-order');
  });

  it('a chapter with no line still gets the other first-use lines (Overdrive) when they are due', () => {
    expect(markForMenu('ffx', rows(['attack', 'overdrive']), () => false, 'yunalesca')?.id).toBe('ffx-overdrive');
    expect(markForMenu('ffx', rows(['attack']), () => false, 'yunalesca')).toBeNull();
  });

  it('with no chapter given (a harness, a unit test) the deck is as before: the line shows, with the deck\'s own body', () => {
    expect(markForMenu('ffx', rows(['attack']), () => false)?.id).toBe('ffx-turn-order');
    expect(markForMenu('ffx', rows(['attack']), () => false)?.body).toBe(TURN_ORDER_ENEMY_FIRST);
  });

  it('FFX-2 is untouched: the chapter id never changes Rikku\'s gauge line', () => {
    expect(markForMenu('ffx2', rows(['attack']), () => false, 'ffx2-bahamut')?.id).toBe('ffx2-gauge');
    expect(markForMenu('ffx2', rows(['attack']), () => false)?.id).toBe('ffx2-gauge');
  });
});
