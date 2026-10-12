/**
 * **RC3: the boss-AI timer rows on the logic-step clock** (FFX-2 only; re-parity W4 + the AI lanes a, b and c, merged).
 *
 * The AI lanes counted their timers in the engine's old turns and listed them "for the W4 merge" (`docs/handoff/re-parity-ai-ffx2-a.md`,
 * `-b.md`, `-c.md`, the timer-row tables). Once the clock is the game's logic step (29.97 a second), a script that counts polls counts
 * steps, so each row is a number of steps, run here through the real engine:
 *
 * - **Bahamut's Mega Flare countdown (row B3)**: 750 polls. The first poll after the second Impulse says nothing, the windows come at polls
 *   150, 300, 450 and 600 and the cast at 750: 149 steps, then 150 each. Slow, Haste, the Config speed and a fallen girl do not move it.
 * - **A voice poll (rows T1, L1, C1, H, S2)** is the game's speak command, ATB cost 60: the recovery is 60 x 10000 / (AGI + 1), not the
 *   standard gauge's 70.
 * - **The Head's init Agility (row H3)**: 110 before the first gauge, not the table's 36.
 *
 * (The Oversoul's idle limit, row O2, is pinned in `parity-ffx2-ai-oversoul.test.ts`; the Sisters' Regen counter, Ixion's action time and
 * the thinking time are W4's and pinned by its files; this file says which rows RC3 converted.)
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine, STEPS_PER_SECOND, secondsToSteps } from '../../src/battle/ffx2/index.ts';
import { FFX2_COMMAND_RECORDS } from '../../src/data/ffx2/command-records/index.ts';
import { DJOSE_ACTION_TIME_SECONDS } from '../../src/data/ffx2/enemies/ixion-djose.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/index.ts';
import { bahamutSetup } from '../../src/battle/ffx2/fixtures.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import { atbTicks, baseRequired } from '../../src/battle/ffx2/gauges.ts';
import { BAHAMUT_POLLS_PER_COUNTDOWN_STEP, SPEAK_COMMAND_ATB_COST } from '../../src/battle/ffx2/constants.ts';
import type { AtbSpeed } from '../../src/battle/ffx2/clock.ts';
import type { BattleEvent, BattleSetup, Decision } from '../../src/battle/common/types.ts';
import { OVERSOUL_IDLE_LIMIT_STEPS } from '../../src/battle/ffx2/ai/paragon-oversoul.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';
import * as ffx2Data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';

type Turn = { actorId: string; at: number; seq: number };

/** Play Chapter IV with the party defending until Bahamut's Mega Flare starts; return his turns, in steps, and every event. */
function bahamutToMegaFlare(seed: number, opts: { speed?: AtbSpeed; haste?: boolean; downGirl?: boolean } = {}): { turns: Turn[]; events: BattleEvent[]; engine: FFX2Engine } {
  const engine = new FFX2Engine({ minigames: false, ...(opts.speed ? { atbSpeed: opts.speed } : {}) });
  engine.init(bahamutSetup(seed));
  const bahamut = engine.state().combatants['bahamut'] as Ffx2Unit;
  if (opts.haste) applyStatus(bahamut, { status: 'haste', duration: 125 } as never);
  if (opts.downGirl) {
    const paine = engine.state().combatants['paine'] as Ffx2Unit;
    paine.hp = 0;
    paine.alive = false;
  }
  const events: BattleEvent[] = [];
  const turns: Turn[] = [];
  for (let i = 0; i < 20000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') { events.push(...engine.tick(d.nextEventMs)); continue; }
    if (d.kind === 'resolved') { events.push(...d.events); continue; }
    events.push(...engine.submit({ kind: 'defend', targets: [] }));
    if (events.some((e) => e.type === 'action-start' && e.abilityId === 'mega-flare')) break;
  }
  for (const e of events) {
    if (e.type === 'turn-start' && e.actorId === 'bahamut') turns.push({ actorId: e.actorId, at: e.elapsedTicks, seq: e.seq });
  }
  return { turns, events, engine };
}

/** Bahamut's turns from the first countdown poll to the cast: the turns after the second Impulse of the first cycle. */
function countdownTurns(events: readonly BattleEvent[], turns: readonly Turn[]): Turn[] {
  const impulses = events.filter((e) => e.type === 'action-start' && e.actorId === 'bahamut' && e.abilityId === 'impulse');
  const second = impulses[1];
  const flare = events.find((e) => e.type === 'action-start' && e.abilityId === 'mega-flare');
  if (!second || !flare) throw new Error('the fight did not reach the first Mega Flare');
  return turns.filter((t) => t.seq > second.seq && t.seq <= flare.seq);
}

describe('Bahamut\'s Mega Flare countdown is 750 polls = 750 logic steps (row B3, on the logic-step clock)', () => {
  for (const [label, opts] of [
    ['at Normal', {}],
    ['at Slow', { speed: 'slow' as AtbSpeed }],
    ['at Fast', { speed: 'fast' as AtbSpeed }],
    ['with Bahamut Hasted', { haste: true }],
    ['with a girl down', { downGirl: true }],
  ] as const) {
    it(`${label}: the first poll is silent, the 5 shows 149 steps on and then every 150 steps, and the cast comes at poll 750`, () => {
      const { events, turns } = bahamutToMegaFlare(8, opts);
      const countdown = countdownTurns(events, turns);
      // Six polls: the silent first one, the windows 5, 4, 3 and 2, and the cast.
      expect(countdown).toHaveLength(6);
      const gaps = countdown.slice(1).map((t, i) => t.at - countdown[i]!.at);
      expect(gaps).toEqual([BAHAMUT_POLLS_PER_COUNTDOWN_STEP - 1, 150, 150, 150, 150]);
      // From poll 1 to the cast: 749 steps = the game's 750th poll.
      expect(countdown[5]!.at - countdown[0]!.at).toBe(5 * BAHAMUT_POLLS_PER_COUNTDOWN_STEP - 1);
      // The numbers shown are 5, 4, 3, 2 then the 1 with the cast (no 0).
      const shown = events.filter((e) => e.type === 'charge' && e.enemyId === 'bahamut').map((e) => (e as { name: string }).name);
      expect(shown.slice(0, 5)).toEqual(['5', '4', '3', '2', '1']);
    });
  }

  it('is 25.03 seconds of game time at 29.97 steps a second (750 polls, 0.033367 s each)', () => {
    expect((5 * BAHAMUT_POLLS_PER_COUNTDOWN_STEP) / STEPS_PER_SECOND).toBeCloseTo(25.03, 1);
  });

  it('adds no thinking time: a fallen girl makes no countdown poll longer (thinking is a command\'s end, a wait is not one)', () => {
    const up = countdownTurns(...(() => { const r = bahamutToMegaFlare(8); return [r.events, r.turns] as const; })());
    const down = countdownTurns(...(() => { const r = bahamutToMegaFlare(8, { downGirl: true }); return [r.events, r.turns] as const; })());
    expect(down.slice(1).map((t, i) => t.at - down[i]!.at)).toEqual(up.slice(1).map((t, i) => t.at - up[i]!.at));
  });
});

describe('a voice poll recovers by the speak command\'s ATB cost, 60, not the standard 70 (the timer rows of re-parity-ai-ffx2-a)', () => {
  const first = ffx2Data.ENEMY_GROUPS_BY_ID[VEGNAGUN_CHAIN_ORDER[0]!]!;

  function runToFirstPoll(group: BattleSetup['enemies'], enemyId: string, seed: number): Ffx2Unit {
    const engine = new FFX2Engine({ minigames: false });
    engine.init({ game: 'ffx2', party: farplaneBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
    const unit = engine.state().combatants[enemyId] as Ffx2Unit;
    for (let i = 0; i < 4000; i++) {
      const before = engine.state().log.filter((e) => e.type === 'turn-start' && e.actorId === enemyId).length;
      if (before > 0) break;
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') { engine.tick(d.nextEventMs); continue; }
      if (d.kind === 'resolved') continue;
      engine.submit({ kind: 'defend', targets: [] });
    }
    return unit;
  }

  it('the Tail\'s first poll is a voice line (Braska): its recovery is 60 x 10000 / (AGI + 1)', () => {
    const tail = runToFirstPoll(first, 'vegnagun-tail', 3);
    expect(SPEAK_COMMAND_ATB_COST).toBe(60);
    expect(tail.gauge.recoveryMax).toBe(atbTicks(SPEAK_COMMAND_ATB_COST, tail.stats.agi));
    expect(tail.gauge.recoveryMax).toBeLessThan(atbTicks(70, tail.stats.agi));
  });
});

describe('the Vegnagun Head\'s init writes Agility 110 before the first gauge (row H3)', () => {
  it('the Head enters the fight on 110, not the table\'s 36, and its bar is the length of 110', () => {
    const head = ffx2Data.ENEMY_GROUPS_BY_ID[VEGNAGUN_CHAIN_ORDER[3]!]!;
    const engine = new FFX2Engine({ minigames: false });
    engine.init({ game: 'ffx2', party: farplaneBuild, enemies: head, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    const unit = engine.state().combatants['vegnagun-head'] as Ffx2Unit;
    expect(unit.stats.agi).toBe(110);
    expect(unit.atb.required).toBe(baseRequired(110));
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------
// Idle waits that an event cuts short (ai/idle.ts WAKE_ON_RESULT, WAKE_ON_ALIVE_CHANGE): the game polls a waiting monster every step
// ---------------------------------------------------------------------------------------------------------------------------------

describe('a waiting boss is polled on the step after the event it waits for (the game polls every step; the engine waits for the event)', () => {
  type Input = Extract<Decision, { kind: 'player-input' }>;
  const attackRow = (d: Input, targetId: string) => d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(targetId));
  /** The step each `turn-start` of `actorId` was logged at (an enemy's turn runs inside tick(), so the whole log is read, not one call's events). */
  const turnSteps = (engine: FFX2Engine, actorId: string): number[] =>
    engine.state().log.filter((e) => e.type === 'turn-start' && e.actorId === actorId).map((e) => (e as { elapsedTicks: number }).elapsedTicks);

  function chapterXIII(): FFX2Engine {
    const chapter = CHAPTERS.find((c) => c.id === 'ffx2-trema')!;
    const setup = setupForChapter(chapter, 3);
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine.setSeed(setup.seed);
    engine.init(setup);
    return engine;
  }

  it('the Oversoul Paragon waits out 1,201 steps untouched (the 1,201st idle poll of the script) and acts then', () => {
    const engine = chapterXIII();
    for (let i = 0; i < 30000 && turnSteps(engine, 'paragon').length < 2; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
      if (d.kind === 'resolved') continue;
      engine.submit({ kind: 'defend', targets: [] }); // nobody touches him
    }
    const turns = turnSteps(engine, 'paragon');
    expect(turns.length).toBeGreaterThanOrEqual(2);
    expect(turns[1]! - turns[0]!, 'from his first poll to the idle action').toBe(OVERSOUL_IDLE_LIMIT_STEPS);
  });

  it('a hit on the waiting Oversoul makes him ready on the very next logic step; his answer waits only for the chain window the hit opens on him', () => {
    const engine = chapterXIII();
    const paragon = engine.state().combatants['paragon'] as Ffx2Unit;
    let hitAt = -1;
    let window = 0;
    let readyAt = -1;
    let answerAt = -1;
    for (let i = 0; i < 30000 && answerAt < 0; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); }
      else if (d.kind === 'player-input') {
        const row = hitAt < 0 && paragon.gauge.idleWait === true ? attackRow(d, 'paragon') : undefined;
        if (row) {
          hitAt = engine.state().ticks;
          engine.submit({ ...row.command, targets: ['paragon'] } as never);
          window = paragon.chainWindowTicks; // the hit opens a chain window on the target: it cannot start its own action until it closes (the game's chain rule)
        } else {
          engine.submit({ kind: 'defend', targets: [] });
        }
      }
      if (hitAt >= 0 && readyAt < 0 && paragon.gauge.state === 5) readyAt = engine.state().ticks;
      if (hitAt >= 0) answerAt = turnSteps(engine, 'paragon').find((s) => s > hitAt) ?? -1;
    }
    expect(hitAt, 'a girl hit him while he waited').toBeGreaterThan(0);
    expect(readyAt - hitAt, 'the game finds his script waiting on the next step, and so does the engine (not at the end of a recovery)').toBe(1);
    expect(window, 'a hit opens a chain window on him').toBeGreaterThan(0);
    expect(answerAt - hitAt, 'and he answers as soon as the window lets him start an action').toBeLessThanOrEqual(window + 1);
  });

  it('the surviving Redoubt raises its fallen twin on the step after the fall (row R4: the game polls an idle Redoubt every step)', () => {
    const head = ffx2Data.ENEMY_GROUPS_BY_ID[VEGNAGUN_CHAIN_ORDER[3]!]!;
    const engine = new FFX2Engine({ minigames: false });
    engine.init({ game: 'ffx2', party: farplaneBuild, enemies: head, triggers: [], seed: 5, condition: 'normal', canEscape: false });
    const left = engine.state().combatants['redoubt-l'] as Ffx2Unit;
    const right = engine.state().combatants['redoubt-r'] as Ffx2Unit;
    left.hp = 1; // one Attack finishes the Left Redoubt
    let fellAt = -1;
    let rightTurn = -1;
    for (let i = 0; i < 20000 && rightTurn < 0; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); }
      else if (d.kind === 'player-input') {
        const row = fellAt < 0 && left.alive && right.gauge.idleWait === true ? attackRow(d, 'redoubt-l') : undefined;
        if (row) {
          const events = engine.submit({ ...row.command, targets: ['redoubt-l'] } as never);
          if (events.some((e) => e.type === 'ko' && e.targetId === 'redoubt-l')) fellAt = engine.state().ticks;
        } else {
          engine.submit({ kind: 'defend', targets: [] });
        }
      }
      if (fellAt >= 0) rightTurn = turnSteps(engine, 'redoubt-r').find((s) => s > fellAt) ?? -1;
    }
    expect(fellAt, 'the Left Redoubt fell while its twin waited').toBeGreaterThan(0);
    expect(rightTurn - fellAt, 'the Right Redoubt is polled one logic step after the fall').toBe(1);
    const log = engine.state().log;
    const poll = log.findIndex((e) => e.type === 'turn-start' && e.actorId === 'redoubt-r' && (e as { elapsedTicks: number }).elapsedTicks === rightTurn);
    const next = log.slice(poll).find((e) => e.type === 'action-start' && e.actorId === 'redoubt-r');
    expect((next as { abilityId?: string } | undefined)?.abilityId, 'and its poll is the Full-Life on the twin').toBe('full-life');
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------
// Timer rows that W4's engine already puts on the logic step: pinned here once, against the AI lanes' own tables
// ---------------------------------------------------------------------------------------------------------------------------------

describe('the AI lanes\' timer rows that re-parity W4\'s clock answers (pinned against the lanes\' tables)', () => {
  it('Cindy\'s Regen carries the game\'s counter 50 (lane b, row M7): four ticks, about 790 steps = 26.4 s', () => {
    const regen = ffx2Data.ABILITIES['x2-cindy-regen']!;
    const application = regen.statusEffects.find((s) => s.status === 'regen')!;
    expect(application.duration).toBe(50);
    const unit = { statuses: {}, stats: { maxHp: 1000 } } as unknown as Ffx2Unit;
    const instance = applyStatus(unit, application)!;
    expect(instance.counter).toBe(50);
    // A counter is lost every 1,500 units of the owner's active speed; 95 units a step at Normal: 50 x 1,500 / 95 = 789.5, so 790 steps.
    expect(Math.ceil((50 * 1500) / 95)).toBe(790);
    expect(790 / STEPS_PER_SECOND).toBeCloseTo(26.36, 1);
  });

  it('Ixion\'s action time is the 3 s of D-269 = 90 polls (lane c, "Ixion\'s action time"): the formation says seconds, the engine converts to steps', () => {
    expect(secondsToSteps(DJOSE_ACTION_TIME_SECONDS)).toBe(90);
    expect(ffx2Data.ENEMY_GROUPS_BY_ID['ffx2-djose-ixion']!.actionTimeSeconds).toBe(DJOSE_ACTION_TIME_SECONDS);
  });

  it('a monster move\'s charge and rest are its row\'s costs over (AGI + 1): lane c\'s table (Baralai Glint 17,699 units, Attack 8,849; Ixion Thor\'s Hammer 7,194 rest) and lane b\'s (Cindy Guard 174 steps)', () => {
    const baralaiAgi = 112;
    expect(atbTicks(FFX2_COMMAND_RECORDS['x2-den-baralai-glint']!.costCast!, baralaiAgi)).toBe(17_699);
    expect(atbTicks(100, baralaiAgi)).toBe(8_849); // Attack: costAtb 100
    expect(Math.ceil(atbTicks(100, 138) / 95)).toBe(76); // Ixion Attack rest: 7,194 units = 76 steps
    expect(Math.ceil(atbTicks(FFX2_COMMAND_RECORDS['x2-cindy-not-so-mighty-guard']!.costCast!, 53) / 95) > 0).toBe(true);
  });
});
