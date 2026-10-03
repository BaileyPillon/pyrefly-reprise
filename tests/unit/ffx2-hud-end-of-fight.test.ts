// @vitest-environment jsdom
/**
 * **No FFX-2 action banner outlives the last blow** (BR-BANNER-END-OF-FIGHT, FFX-2 only; ported from branch
 * claude/cranky-lederberg-7f9e9b 5126f7a31, whose FFX half is on main as F5, 50849814c).
 *
 * FFX-2's message line and telegraph hide on 2.2 / 2.4 s wall-clock holds, which the presenter's beats outrun
 * under fast playback: Chapter IV seed 9 kept Bahamut's "5" countdown up through the deciding KO and into the
 * victory beat. The rule (`src/ui/ffx2/fightDecided.ts`): a `ko` played while the engine's live state already
 * carries the result is the last blow landing, and it and the `victory` / `defeat` beat take every banner down.
 * An ordinary KO takes nothing down, and an escape (`defeat` with outcome `escape`) keeps its holds but not its menu.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BattleEvent, BattleResult, Command, Decision } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import * as ffx2Data from '../../src/data/ffx2/index.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { fightDecidedBy } from '../../src/ui/ffx2/fightDecided.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

const text = (el: Element): string => el.textContent?.replace(/\s+/g, ' ').trim() ?? '';

/** Every banner on screen: the message line and the telegraph (both `.ig-banner`). */
function bannersUp(root: ParentNode): string[] {
  const up: string[] = [];
  for (const el of root.querySelectorAll<HTMLElement>('.ig-banner')) if (!el.hidden) up.push(text(el));
  return up;
}

const decided = (outcome: BattleResult['outcome']): BattleResult => ({ outcome, turns: 4 }) as unknown as BattleResult;

let root: HTMLElement;
afterEach(() => {
  root?.remove();
  vi.useRealTimers();
});
function newRoot(): HTMLElement {
  root = document.createElement('div');
  document.body.appendChild(root);
  return root;
}

describe('fightDecidedBy (FFX-2)', () => {
  const state = makeFakeBattleState();
  const ko: BattleEvent = { seq: 1, type: 'ko', targetId: 'bahamut' };
  it('is the end beat itself, or a KO once the live state carries the result', () => {
    expect(fightDecidedBy({ seq: 1, type: 'victory', result: decided('victory') }, null)).toBe(true);
    expect(fightDecidedBy({ seq: 1, type: 'defeat', result: decided('defeat') }, state)).toBe(true);
    expect(fightDecidedBy({ seq: 1, type: 'defeat', result: decided('escape') }, state)).toBe(false); // over, not beaten
    expect(fightDecidedBy(ko, state)).toBe(false);
    expect(fightDecidedBy(ko, { ...state, result: decided('victory') })).toBe(true);
    expect(fightDecidedBy({ seq: 1, type: 'message', text: 'x', kind: 'ability' }, { ...state, result: decided('victory') })).toBe(false);
    expect(fightDecidedBy(ko, null)).toBe(false);
  });
});

/** Chapter IV with the shipped line, driven headlessly to its end. */
function chapter4(seed: number): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  const group = ffx2Data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('ffx2-bahamut missing');
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}
/** The same fallback as `helpers/ffx2ChapterDrive.ts`, for a turn the line has no opinion on. */
function fallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  return { ...row.command, targets: row.validTargets.slice(0, 1) } as Command;
}
function playToTheEnd(engine: FFX2Engine): void {
  for (let i = 0; i < 30_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'player-input') engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d));
  }
  throw new Error('Chapter IV did not end');
}

describe('FFX2BattleHud: the countdown and the message line go with the deciding KO (FFX-2, Chapter IV seed 9)', () => {
  it('holds them through an ordinary KO, then takes both down at the real final KO and at victory', () => {
    vi.useFakeTimers(); // the 2.2 / 2.4 s holds never run out under the test
    // The ending, read off a finished run of the same seed.
    const finished = chapter4(9);
    playToTheEnd(finished);
    const log = finished.state().log;
    const end = log.findIndex((e) => e.type === 'victory');
    const countdown = log.slice(0, end).filter((e) => e.type === 'charge').at(-1);
    const finalKo = log.slice(0, end).filter((e) => e.type === 'ko').at(-1);
    // Bahamut's Mega Flare countdown is the last banner line the engine prints before the end.
    expect(countdown).toMatchObject({ type: 'charge', enemyId: 'bahamut' });
    expect(finalKo).toMatchObject({ type: 'ko', targetId: 'bahamut' });

    const view = newRoot();
    const hud = new FFX2BattleHud();
    hud.mount(view);
    const engine = chapter4(9);
    hud.sync(engine.state(), { elapsedMs: 0, bars: [] }); // the live state, as the presenter hands it over
    void hud.onEvent(countdown!);
    void hud.onEvent({ seq: 0, type: 'message', text: 'Nothing was stolen!', kind: 'system' });
    void hud.onEvent({ seq: 0, type: 'ko', targetId: 'paine' }); // the fight goes on
    expect(bannersUp(view)).toHaveLength(2);

    playToTheEnd(engine); // the final burst is resolved: the live state carries the result before it plays
    expect(engine.state().log).toHaveLength(log.length);
    void hud.onEvent(finalKo!);
    expect(bannersUp(view)).toEqual([]);
    void hud.onEvent(log[end]!);
    expect(bannersUp(view)).toEqual([]);
    hud.unmount();
  });

  it('takes a defeat the same way, and an escape keeps its line until its hold runs out', () => {
    vi.useFakeTimers();
    const view = newRoot();
    const hud = new FFX2BattleHud();
    hud.mount(view);
    hud.sync(chapter4(9).state(), { elapsedMs: 0, bars: [] });
    void hud.onEvent({ seq: 1, type: 'message', text: 'Bahamut uses Mega Flare', kind: 'ability' });
    expect(bannersUp(view)).toHaveLength(1);
    void hud.onEvent({ seq: 2, type: 'defeat', result: decided('escape') });
    expect(bannersUp(view), 'an escape is over, not beaten: the line keeps its hold').toHaveLength(1);
    void hud.onEvent({ seq: 3, type: 'defeat', result: decided('defeat') });
    expect(bannersUp(view)).toEqual([]);
    hud.unmount();
  });
});
