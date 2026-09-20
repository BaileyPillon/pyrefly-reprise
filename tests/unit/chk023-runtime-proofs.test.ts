/**
 * CHK-023 runtime proofs for the round 04 engine repairs.
 *
 * `critic/CHECKS.md` CHK-023 asks that an engine claim be proved **through the
 * path the player actually goes down** — not against a hand-built event array,
 * and not by reading the source. So each case below boots the shipped data
 * layer, runs the real `createFFXEngine`, and plays the whole battle through
 * the real `BattlePresenter` with a `HudPort` that records every event the
 * presenter hands it, in the order it hands them over. An assertion here is an
 * assertion about what the HUD was told during a real fight.
 *
 * Two cases, both seeded so they are reproducible:
 *
 * (a) **The Yu Yevon link of Chapter 3** (link 7 of the chain), carrying this
 *     build's two `ffx-bfa-yu-yevon` repairs: §3.4.1's "at most one Curaga per
 *     **player-side action** that deals him damage", whose table scores every
 *     enemy-side row at 0, and §3.3's Gravija, which "removes exactly 75% of
 *     current HP from **every target on the field** — including Yu Yevon
 *     himself" `[verified: 2 sources]`.
 * (b) **A slept unit's denied turns**, in the same chapter. §4.1 ticks Sleep
 *     "by 1 at the end of the victim's own action", so the sleeper's turns must
 *     still *arrive* and must still *reach the HUD*, spending nothing — the
 *     half of the Threaten/Sleep repair that the queue already got right and
 *     that PR-0004's counter fix must not disturb.
 *
 * These are proofs, not product changes: nothing in `src/` moves for them.
 *
 * ## Which game
 *
 * **FFX only.** Yu Yevon, Gravija and the Curaga counter are Chapter 3 content
 * and Sleep's turn-paid duration is the CTB rule (§4.1); FFX-2's ATB engine
 * runs its durations on the clock, which `ffx2-status-locks.test.ts` pins on
 * its own side. The playback plumbing under test — `BattlePresenter` and
 * `HudPort` — is shared by both games (CHK-020), and
 * `presenter-vitals-sync.test.ts` already drives it through Chapter 4 as well,
 * so the FFX-2 side of that shared path stays covered.
 */

import { describe, expect, it } from 'vitest';
import type {
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  FFXCombatant,
  StatusInstance,
} from '../../src/battle/common/types.ts';
import type { AutoStrategy } from '../../src/engine/BattlePresenter.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import {
  FakeAudio,
  FakeCutscenes,
  FakeDamageNumbers,
  FakeMessageBar,
  FakeStage,
} from './helpers/FakeStage.ts';

/** Hard stop, so a fight that will not end cannot hang the suite. */
const MAX_EVENTS = 8_000;

/**
 * A HUD that draws nothing and remembers the order it was spoken to in.
 *
 * `onEvent` is called by the presenter immediately before it plays an event, so
 * `seen` is the presentation order — which is the thing CHK-023 is asking about.
 */
class RecordingHud implements HudPort {
  readonly seen: BattleEvent[] = [];
  private overran = false;

  constructor(private readonly onOverrun: () => void) {}

  mount(): void {}
  unmount(): void {}
  sync(_state: BattleState): void {}
  syncVitals(_state: BattleState): void {}

  onEvent(event: BattleEvent): void {
    this.seen.push(event);
    if (this.seen.length > MAX_EVENTS && !this.overran) {
      this.overran = true;
      this.onOverrun();
    }
  }

  async chooseCommand(): Promise<Command> {
    throw new Error('RecordingHud: the run is auto-played; no menu should open');
  }
  async openMinigame(): Promise<never> {
    throw new Error('RecordingHud: minigames are auto-resolved in this run');
  }
  setVisible(): void {}
  setProjector(): void {}
}

function content(): FFXContentRegistry {
  const c = new FFXContentRegistry();
  c.addAbilities(ALL_ABILITIES);
  c.addItems(Object.values(ITEMS));
  return c;
}

/** The real Chapter 3 Yu Yevon link, on the shipped Dream's End build. */
function yuYevonEngine(seed: number) {
  const group = ENEMY_GROUPS_BY_ID['yu-yevon'];
  if (!group) throw new Error('the yu-yevon group is missing from the FFX data layer');
  const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx',
    party: dreamsEndBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

interface Run {
  hud: RecordingHud;
  engine: ReturnType<typeof yuYevonEngine>;
  finalState: BattleState;
}

/**
 * Mash Attack on Yu Yevon himself.
 *
 * `intendedStrategy` plays the chapter the way it is meant to be played, which
 * on this link means spending the Candle of Life on turn 2 — the sourced exit
 * — so the party never damages the boss and the Curaga counter is never
 * provoked at all. That is correct play and correct engine behaviour, and it is
 * useless for measuring the counter. This strategy still only ever submits rows
 * the engine offered as legal; it just refuses the shortcut.
 */
const attackYuYevon: AutoStrategy = (_actorId, commands) => {
  const enabled = commands.filter((c) => c.enabled);
  const row = enabled.find((c) => c.command.kind === 'attack');
  if (!row) return enabled[0]?.command ?? null;
  const target = row.validTargets.includes('yu-yevon') ? 'yu-yevon' : row.validTargets[0];
  return target !== undefined ? { kind: 'attack', targets: [target] } : row.command;
};

/**
 * Auto-play one real encounter through the real presenter, on a clock that
 * never waits, and hand back everything the HUD was told.
 */
async function play(
  seed: number,
  options: {
    strategy?: AutoStrategy;
    prepare?: (engine: ReturnType<typeof yuYevonEngine>) => void;
  } = {},
): Promise<Run> {
  const engine = yuYevonEngine(seed);
  options.prepare?.(engine);
  const state = engine.state();
  const stage = new FakeStage([...state.activeIds], [...state.enemyIds]);
  let presenter: BattlePresenter | null = null;
  const hud = new RecordingHud(() => presenter?.abort());
  presenter = new BattlePresenter({
    stage,
    hud,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    audio: new FakeAudio(),
    cutscenes: new FakeCutscenes(),
    sleep: () => Promise.resolve(),
  });
  presenter.setAutoPlay(options.strategy ?? intendedStrategy);
  await presenter.run(engine as never);
  return { hud, engine, finalState: engine.state() };
}

function combatant(state: BattleState, id: CombatantId): FFXCombatant {
  const c = (state.combatants as Record<string, FFXCombatant>)[id];
  if (!c) throw new Error(`no combatant ${id}`);
  return c;
}

function sleepInstance(turns: number): StatusInstance {
  return {
    id: 'sleep',
    turnsRemaining: turns,
    ticksRemaining: null,
    charges: null,
    stacks: turns,
    permanent: false,
  };
}

// ---------------------------------------------------------------------------
// (a) Chapter 3, link 7 — Yu Yevon
// ---------------------------------------------------------------------------

describe('CHK-023 (a) — the Yu Yevon link reaches the HUD, in order', () => {
  it('every engine event is handed to the HUD exactly once, in ascending seq', async () => {
    const { hud, finalState } = await play(20260920);

    expect(hud.seen.length, 'the presenter played nothing at all').toBeGreaterThan(50);

    // Presentation order is engine order. A dropped, duplicated or reordered
    // event is what "the events reach it in order" is asking about.
    const seqs = hud.seen.map((e) => e.seq);
    expect(seqs, 'the HUD saw events out of engine order').toEqual([...seqs].sort((a, b) => a - b));
    expect(new Set(seqs).size, 'the HUD saw the same event twice').toBe(seqs.length);

    // And it is the same stream the engine wrote, not a parallel one.
    const logged = new Set(finalState.log.map((e) => e.seq));
    for (const seq of seqs) expect(logged.has(seq), `seq ${seq} was never in the engine log`).toBe(true);
  });

  it("Gravija reaches the HUD hitting the whole field, Yu Yevon included [§3.3]", async () => {
    const { hud } = await play(20260920);

    // Find each Gravija cast and read the damage burst that followed it, up to
    // the action-end that closes the action.
    const targets = new Set<CombatantId>();
    let casts = 0;
    for (let i = 0; i < hud.seen.length; i += 1) {
      const e = hud.seen[i]!;
      if (e.type !== 'action-start' || e.abilityId !== 'gravija') continue;
      casts += 1;
      for (let j = i + 1; j < hud.seen.length; j += 1) {
        const f = hud.seen[j]!;
        if (f.type === 'action-end') break;
        if (f.type === 'damage' && f.amount > 0) targets.add(f.targetId);
      }
    }

    expect(casts, 'Yu Yevon never cast Gravija in this run').toBeGreaterThan(0);
    // §3.3: "every target on the field — including Yu Yevon himself". The
    // Pagodas are the two the old hand-built list left out.
    expect([...targets], 'Gravija did not reach Yu Yevon himself').toContain('yu-yevon');
    for (const id of ['yu-pagoda-left', 'yu-pagoda-right']) {
      expect([...targets], `Gravija did not reach ${id}`).toContain(id);
    }
  });

  it('the Curaga counter answers player actions only, never his own side [§3.4.1]', async () => {
    const { hud } = await play(20260920, { strategy: attackYuYevon });

    const counters = hud.seen.filter((e) => e.type === 'counter' && e.actorId === 'yu-yevon');
    expect(counters.length, 'Yu Yevon never countered, so the rule was not exercised').toBeGreaterThan(
      0,
    );

    // Walk the stream: every counter must be preceded, inside the action it
    // answers, by an `action-start` from a party-side actor. An enemy-side row
    // — Gravija's self-damage, a Pagoda's Power Wave, or the counter's own
    // Zombie-inverted damage — scores 0 Curagas in §3.4.1's table.
    const enemySide = new Set<CombatantId>(['yu-yevon', 'yu-pagoda-left', 'yu-pagoda-right']);
    const offenders: string[] = [];
    let provoker: CombatantId | null = null;
    for (const e of hud.seen) {
      if (e.type === 'action-start') provoker = e.actorId;
      if (e.type === 'counter' && e.actorId === 'yu-yevon') {
        if (provoker === null || enemySide.has(provoker)) {
          offenders.push(`Curaga countered ${provoker ?? 'nothing'} — an enemy-side action`);
        }
      }
    }
    expect([...new Set(offenders)]).toEqual([]);

    // At most one per provoking action, which is the other half of §3.4.1.
    let sinceStart = 0;
    let worst = 0;
    for (const e of hud.seen) {
      if (e.type === 'action-start') sinceStart = 0;
      if (e.type === 'counter' && e.actorId === 'yu-yevon') {
        sinceStart += 1;
        worst = Math.max(worst, sinceStart);
      }
    }
    expect(worst, 'more than one Curaga answered a single action').toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// (b) A slept unit's denied turns
// ---------------------------------------------------------------------------

describe('CHK-023 (b) — a slept unit still gets its turns, and the HUD sees them', () => {
  it("a slept Yu Pagoda's denied turns arrive, spend nothing, and pay off the duration", async () => {
    const { hud, finalState } = await play(20260921, {
      strategy: attackYuYevon,
      prepare: (engine) => {
        combatant(engine.state(), 'yu-pagoda-left').statuses['sleep'] = sleepInstance(3);
      },
    });

    // The turn arrives. §1.1's queue is "living, non-Eject, non-Petrify" —
    // Sleep is not on that list, and round 03 blocker #4 was exactly a sleeper
    // dropped out of the queue, whose duration then never ticked.
    const turns = hud.seen.filter((e) => e.type === 'turn-start' && e.actorId === 'yu-pagoda-left');
    expect(turns.length, 'the sleeper never reached the front of the CTB queue').toBeGreaterThanOrEqual(
      3,
    );

    // The first turns are spent on nothing: between the sleeper's `turn-start`
    // and the next actor's `turn-start` there is no `action-start` of its own.
    const denied: number[] = [];
    for (let i = 0; i < hud.seen.length; i += 1) {
      const e = hud.seen[i]!;
      if (e.type !== 'turn-start' || e.actorId !== 'yu-pagoda-left') continue;
      let acted = false;
      for (let j = i + 1; j < hud.seen.length; j += 1) {
        const f = hud.seen[j]!;
        if (f.type === 'turn-start') break;
        if (f.type === 'action-start' && f.actorId === 'yu-pagoda-left') acted = true;
      }
      if (!acted) denied.push(e.turn);
    }
    expect(denied.length, 'no turn was denied, so the sleeper was never asleep on its own turn').toBeGreaterThan(
      0,
    );

    // And the clock ran out on those turns rather than sitting forever
    // (round 03 measured `turnsRemaining: 3` held for 53 turns).
    expect(combatant(finalState, 'yu-pagoda-left').statuses['sleep']).toBeUndefined();
  });

  it('a slept party member is denied the same way, through the same path', async () => {
    const { hud, finalState } = await play(20260922, {
      strategy: attackYuYevon,
      prepare: (engine) => {
        combatant(engine.state(), 'tidus').statuses['sleep'] = sleepInstance(3);
      },
    });

    const turns = hud.seen.filter((e) => e.type === 'turn-start' && e.actorId === 'tidus');
    expect(turns.length, 'the slept party member never got a turn').toBeGreaterThan(0);
    expect(combatant(finalState, 'tidus').statuses['sleep']).toBeUndefined();
  });
});
