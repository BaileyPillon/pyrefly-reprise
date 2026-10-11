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
import { FFX2Engine, STEPS_PER_SECOND } from '../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/index.ts';
import { bahamutSetup } from '../../src/battle/ffx2/fixtures.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import { atbTicks, baseRequired } from '../../src/battle/ffx2/gauges.ts';
import { BAHAMUT_POLLS_PER_COUNTDOWN_STEP, SPEAK_COMMAND_ATB_COST } from '../../src/battle/ffx2/constants.ts';
import type { AtbSpeed } from '../../src/battle/ffx2/clock.ts';
import type { BattleEvent, BattleSetup } from '../../src/battle/common/types.ts';
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
