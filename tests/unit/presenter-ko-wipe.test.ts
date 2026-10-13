/**
 * **A status the KO wipe takes in the action that landed it plays no beat.** Re-parity RC5 (lane FFX-D, FFX only) runs the game's death
 * check after the target's LAST hit and takes the dying character's statuses in the same instant, so a status that lands on a target who
 * dies in that action now arrives as a `status-add` and, a few events later, a `status-remove` with reason `ko` (145 pairs over 440
 * seeded FFX runs, 12 before RC5). Played as events each add was a flash, a cue, a message line, an icon and 220 ms, each removal 88 ms:
 * Chapter III's Curse on a party member the death check takes played five pairs, about 1.5 s, before the revive. `BattlePresenterKoWipe.ts` names those
 * events for the burst and `BattlePresenter.playBurst` skips them.
 *
 * What this pins: (1) the pair is silent: the burst plays exactly as if the pair were not in it, on the stage, the cues, the HUD, the
 * waits and the party rows; (2) an add with no `ko` removal still plays, whatever else removes it; (3) a status that lands on a target
 * who dies in a LATER action (or turn, or burst) still plays, because it was on screen for a stretch; (4) five pairs take exactly
 * 5 x (220 + 88) ms less; plus the rule's edges as a table. Game case: **both** (shared presenter plumbing, CHK-020); today only
 * FFX's death check emits the pair. The real engine's Chapter III case is `presenter-ko-wipe-chapter3.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { TIMING } from '../../src/engine/BattlePresenterEvents.ts';
import { koWipedStatuses } from '../../src/engine/BattlePresenterKoWipe.ts';
import type { BattleEvent, BattleState, CombatantId, StatusId, StatusInstance } from '../../src/battle/common/types.ts';
import { FakeAudio, FakeDamageNumbers, FakeHud, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;
type Ev = Unsequenced<BattleEvent>;
type Reason = Extract<BattleEvent, { type: 'status-remove' }>['reason'];

const instance = (id: StatusId): StatusInstance => ({ id, turnsRemaining: 3, ticksRemaining: null, charges: null, stacks: 0, permanent: false });
const added = (targetId: CombatantId, status: StatusId): Ev => ({ type: 'status-add', targetId, status, instance: instance(status) });
const removed = (targetId: CombatantId, status: StatusId, reason: Reason = 'ko'): Ev => ({ type: 'status-remove', targetId, status, reason });
const start = (actorId: CombatantId, targets: CombatantId[]): Ev => ({ type: 'action-start', actorId, command: { kind: 'attack', targets }, targets });
const end = (actorId: CombatantId): Ev => ({ type: 'action-end', actorId });
const turn = (actorId: CombatantId): Ev => ({ type: 'turn-start', actorId, turn: 1, elapsedTicks: 0 });
const blow = (targetId: CombatantId): Ev => ({ type: 'damage', targetId, amount: 3000, element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
const koed = (targetId: CombatantId): Ev => ({ type: 'ko', targetId });

/** Chapter III's Curse: the five statuses it lands on one party member. */
const CURSE: StatusId[] = ['poison', 'sleep', 'silence', 'darkness', 'curse'];
/** What one pair costs when it plays: the add's wait and the removal's. */
const PAIR_MS = TIMING.status + TIMING.status * 0.4;

/** A party row's view of Tidus: the HUD double hears every event and every row the presenter hands it. */
class RowsHud extends FakeHud {
  readonly rows: Array<{ statuses: StatusId[]; alive: boolean }> = [];
  syncVitals(state: BattleState): void {
    const tidus = state.combatants['tidus'];
    if (tidus) this.rows.push({ statuses: Object.keys(tidus.statuses) as StatusId[], alive: tidus.alive });
  }
  get heard(): string[] {
    return this.events.map((e) => e.type === 'status-add' || e.type === 'status-remove' ? `${e.type}:${e.targetId}:${e.status}` : e.type);
  }
}

/** The engine's state, as far as a row draws it: Tidus alive at full HP with `held` on him. */
function engineWith(held: StatusId[] = []): { state: () => BattleState } {
  const tidus = { id: 'tidus', hp: 5000, mp: 100, alive: true, stats: { maxHp: 5000, maxMp: 100 }, statuses: Object.fromEntries(held.map((s) => [s, instance(s)])) };
  return { state: () => ({ combatants: { tidus }, log: [] }) as unknown as BattleState };
}

function setup(opts: { held?: StatusId[] } = {}) {
  const stage = new FakeStage(['tidus', 'yuna'], ['yu-pagoda']);
  const audio = new FakeAudio();
  const hud = new RowsHud();
  const slept: number[] = [];
  const presenter = new BattlePresenter({
    stage,
    audio,
    hud,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    sleep: async (ms) => void slept.push(ms),
  });
  presenter.syncHud(engineWith(opts.held) as never); // seeds the rows the burst rolls forward
  let seq = 0;
  const play = (events: Ev[]): Promise<unknown> => presenter.play(events.map((e) => ({ ...e, seq: seq++ }) as BattleEvent));
  const total = (): number => slept.reduce((a, b) => a + b, 0);
  return { presenter, stage, audio, hud, slept, play, total };
}

/** The action that kills Tidus: the blow, then whatever the engine emits for the wipe, then the KO. */
const killing = (...between: Ev[]): Ev[] => [start('yu-pagoda', ['tidus']), blow('tidus'), ...between, koed('tidus'), end('yu-pagoda')];
/** The same action with Tidus surviving the blow. */
const surviving = (...between: Ev[]): Ev[] => [start('yu-pagoda', ['tidus']), blow('tidus'), ...between, end('yu-pagoda')];

describe('(1) the pair is silent', () => {
  it('plays exactly as if the two events were not in the burst: stage, cues, HUD, waits and rows', async () => {
    const withPair = setup();
    await withPair.play(killing(added('tidus', 'curse'), removed('tidus', 'curse')));
    const without = setup();
    await without.play(killing());

    expect(withPair.stage.calls).toEqual(without.stage.calls);
    expect(withPair.audio.cues).toEqual(without.audio.cues);
    expect(withPair.slept).toEqual(without.slept);
    expect(withPair.hud.heard).toEqual(without.hud.heard); // no message line, no Doom counter, no tint: the HUD is not told
    expect(withPair.hud.rows).toEqual(without.hud.rows); // and no icon on the party row, not even for a frame
  });

  it('is not a silent loss: the trace still holds both events, in order, at no cost', async () => {
    const { presenter, play } = setup();
    await play(killing(added('tidus', 'curse'), removed('tidus', 'curse')));
    expect(presenter.trace.map((t) => t.type)).toEqual(['action-start', 'damage', 'status-add', 'status-remove', 'ko', 'action-end']);
    expect(presenter.trace.filter((t) => t.type.startsWith('status-')).map((t) => t.ms)).toEqual([0, 0]);
  });

  it('is what the same burst plays when the removal is anything but a KO wipe (the control that makes the check bite)', async () => {
    const wiped = setup();
    await wiped.play(killing(added('tidus', 'curse'), removed('tidus', 'curse')));
    const cured = setup();
    await cured.play(killing(added('tidus', 'curse'), removed('tidus', 'curse', 'cured')));

    expect(cured.total() - wiped.total()).toBeCloseTo(PAIR_MS, 6);
    expect(cured.audio.cues.length).toBe(wiped.audio.cues.length + 1);
    expect(cured.stage.calls.filter((c) => c === 'flash:tidus').length).toBe(wiped.stage.calls.filter((c) => c === 'flash:tidus').length + 1);
    expect(cured.hud.heard).toContain('status-add:tidus:curse');
    expect(cured.hud.rows.some((r) => r.statuses.includes('curse'))).toBe(true);
  });

  it('holds for a target that is not killed but answered by Auto-Life (the wipe, then a revive, and no ko)', async () => {
    const withPair = setup();
    const revive: Ev = { type: 'revive', targetId: 'tidus', hp: 1250, cause: 'fayth' };
    await withPair.play([start('yu-pagoda', ['tidus']), blow('tidus'), added('tidus', 'curse'), removed('tidus', 'curse'), revive, end('yu-pagoda')]);
    const without = setup();
    await without.play([start('yu-pagoda', ['tidus']), blow('tidus'), revive, end('yu-pagoda')]);
    expect(withPair.stage.calls).toEqual(without.stage.calls);
    expect(withPair.slept).toEqual(without.slept);
    expect(withPair.hud.heard).toEqual(without.hud.heard);
  });

  it('leaves the party rows right at the wipe even when the status was already on Tidus before the action', async () => {
    // A refreshed status is a landing the player never saw, but the row HAS been showing it: it has to leave with the wipe.
    const { hud, play } = setup({ held: ['poison'] });
    await play(killing(added('tidus', 'poison'), removed('tidus', 'poison')));
    expect(hud.heard).not.toContain('status-add:tidus:poison');
    expect(hud.heard).not.toContain('status-remove:tidus:poison');
    const last = hud.rows[hud.rows.length - 1]!;
    expect(last.statuses).not.toContain('poison');
    expect(last.alive).toBe(false);
  });

  it('keeps the pair silent when other events sit between the add and its wipe', async () => {
    const withPair = setup();
    await withPair.play(killing(added('tidus', 'curse'), { type: 'message', text: 'Cursed', kind: 'system' }, { type: 'wait', ms: 120 }, removed('tidus', 'curse')));
    const without = setup();
    await without.play(killing({ type: 'message', text: 'Cursed', kind: 'system' }, { type: 'wait', ms: 120 }));
    expect(withPair.stage.calls).toEqual(without.stage.calls);
    expect(withPair.slept).toEqual(without.slept);
  });
});

describe('(2) an add with no KO removal still plays', () => {
  it('a status landing on a target who survives plays its flash, cue, message hand-off and 220 ms', async () => {
    const landed = setup();
    await landed.play(surviving(added('tidus', 'curse')));
    const bare = setup();
    await bare.play(surviving());

    expect(landed.total() - bare.total()).toBeCloseTo(TIMING.status, 6);
    expect(landed.audio.cues.length).toBe(bare.audio.cues.length + 1);
    expect(landed.stage.calls.filter((c) => c === 'flash:tidus').length).toBe(bare.stage.calls.filter((c) => c === 'flash:tidus').length + 1);
    expect(landed.hud.heard).toContain('status-add:tidus:curse');
    expect(landed.hud.rows.some((r) => r.statuses.includes('curse'))).toBe(true);
  });

  it.each(['expired', 'cured', 'dispelled', 'consumed', 'overwritten'] as const)('an add the status is taken from for "%s" plays both beats', async (reason) => {
    const played = setup();
    await played.play(surviving(added('tidus', 'sleep'), removed('tidus', 'sleep', reason)));
    const bare = setup();
    await bare.play(surviving());

    expect(played.total() - bare.total()).toBeCloseTo(PAIR_MS, 6);
    expect(played.hud.heard).toEqual(expect.arrayContaining(['status-add:tidus:sleep', 'status-remove:tidus:sleep']));
  });

  it('a KO that wipes a DIFFERENT status does not silence an add', async () => {
    const played = setup();
    await played.play(killing(added('tidus', 'curse'), removed('tidus', 'protect')));
    const bare = setup();
    await bare.play(killing(removed('tidus', 'protect')));
    expect(played.total() - bare.total()).toBeCloseTo(TIMING.status, 6);
    expect(played.hud.heard).toContain('status-add:tidus:curse');
  });

  it('a wipe of a status that was on the target BEFORE the action keeps its own 88 ms beat', async () => {
    const played = setup({ held: ['protect'] });
    await played.play(killing(removed('tidus', 'protect')));
    const bare = setup({ held: ['protect'] });
    await bare.play(killing());
    expect(played.total() - bare.total()).toBeCloseTo(TIMING.status * 0.4, 6);
    expect(played.hud.heard).toContain('status-remove:tidus:protect');
  });

  it('a status landing on the target AFTER the wipe (the KO answered, then a new status) still plays', async () => {
    // The shape of Chapter III's revive: the wipe takes the five, the revive puts Tidus on his feet, and Critical lands on the revived HP.
    const revive: Ev = { type: 'revive', targetId: 'tidus', hp: 1250, cause: 'fayth' };
    const played = setup();
    await played.play([start('yu-pagoda', ['tidus']), blow('tidus'), added('tidus', 'curse'), removed('tidus', 'curse'), revive, added('tidus', 'critical'), end('yu-pagoda')]);
    const bare = setup();
    await bare.play([start('yu-pagoda', ['tidus']), blow('tidus'), revive, end('yu-pagoda')]);
    expect(played.total() - bare.total()).toBeCloseTo(TIMING.status, 6);
    expect(played.hud.heard).toContain('status-add:tidus:critical');
    expect(played.hud.heard).not.toContain('status-add:tidus:curse');
  });
});

describe('(3) a status that lands on a target who dies in a LATER action still plays', () => {
  it('in the next action of the same burst', async () => {
    const later = setup();
    await later.play([
      start('yu-pagoda', ['tidus']), added('tidus', 'poison'), end('yu-pagoda'),
      start('yuna', ['tidus']), blow('tidus'), removed('tidus', 'poison'), koed('tidus'), end('yuna'),
    ]);
    const bare = setup();
    await bare.play([
      start('yu-pagoda', ['tidus']), end('yu-pagoda'),
      start('yuna', ['tidus']), blow('tidus'), koed('tidus'), end('yuna'),
    ]);
    // the add plays (220), and so does the removal (88): neither belongs to the action that wiped it
    expect(later.total() - bare.total()).toBeCloseTo(PAIR_MS, 6);
    expect(later.hud.heard).toEqual(expect.arrayContaining(['status-add:tidus:poison', 'status-remove:tidus:poison']));
  });

  it('after a turn boundary (the shape of Yunalesca\'s Zombie and Regen: Cheer lands, the next turn\'s tick kills)', async () => {
    const later = setup();
    await later.play([
      start('yuna', ['tidus']), added('tidus', 'cheer'), end('yuna'),
      turn('tidus'), blow('tidus'), removed('tidus', 'cheer'), koed('tidus'),
    ]);
    const bare = setup();
    await bare.play([start('yuna', ['tidus']), end('yuna'), turn('tidus'), blow('tidus'), koed('tidus')]);
    expect(later.total() - bare.total()).toBeCloseTo(PAIR_MS, 6);
    expect(later.hud.rows.some((r) => r.statuses.includes('cheer'))).toBe(true); // it showed on the row while it was on him
  });

  it('after the action ended, before the next one starts (a poison tick that follows the action)', async () => {
    const later = setup();
    await later.play([start('yu-pagoda', ['yu-pagoda']), added('yu-pagoda', 'reflect'), end('yu-pagoda'), blow('yu-pagoda'), removed('yu-pagoda', 'reflect'), koed('yu-pagoda')]);
    const bare = setup();
    await bare.play([start('yu-pagoda', ['yu-pagoda']), end('yu-pagoda'), blow('yu-pagoda'), koed('yu-pagoda')]);
    expect(later.total() - bare.total()).toBeCloseTo(PAIR_MS, 6);
  });

  it('in the next burst (the add and the wipe are different play() calls)', async () => {
    const { play, hud, total } = setup();
    await play(surviving(added('tidus', 'sleep')));
    const afterFirst = total();
    await play(killing(removed('tidus', 'sleep')));
    expect(hud.heard).toEqual(expect.arrayContaining(['status-add:tidus:sleep', 'status-remove:tidus:sleep']));
    expect(afterFirst).toBeGreaterThanOrEqual(TIMING.status);
  });
});

describe('(4) five pairs take exactly five pairs\' waits off the action', () => {
  const curse = (reason: Reason): Ev[] => killing(...CURSE.map((s) => added('tidus', s)), ...CURSE.map((s) => removed('tidus', s, reason)));

  it('is 5 x (220 + 88) ms, about 1.5 s, and the action then takes as long as one with no Curse at all', async () => {
    const quiet = setup();
    await quiet.play(curse('ko'));
    const played = setup();
    await played.play(curse('cured')); // the same burst with its removals read as cures: every beat plays, as the wipe's did before the fix
    const bare = setup();
    await bare.play(killing());

    const saved = played.total() - quiet.total();
    expect(saved).toBeCloseTo(5 * PAIR_MS, 6);
    expect(saved).toBeGreaterThan(1500);
    expect(saved).toBeLessThan(1600);
    expect(quiet.total()).toBeCloseTo(bare.total(), 6);
    expect(quiet.audio.cues).toEqual(bare.audio.cues);
    expect(quiet.hud.rows).toEqual(bare.hud.rows);
  });

  it('shrinks with the playback speed like every other wait (it is the same sleeps that are gone)', async () => {
    for (const speed of ['fast', 'skip'] as const) {
      const quiet = setup();
      quiet.presenter.setSpeed(speed);
      await quiet.play(curse('ko'));
      const played = setup();
      played.presenter.setSpeed(speed);
      await played.play(curse('cured'));
      const scale = speed === 'fast' ? 0.32 : 0;
      expect(played.total() - quiet.total()).toBeCloseTo(5 * PAIR_MS * scale, 6);
    }
  });
});

describe('koWipedStatuses: the rule and its edges', () => {
  /** A case's events as the presenter receives them (numbered), and the indices the rule names. */
  const numbered = (events: Ev[]): BattleEvent[] => events.map((e, i) => ({ ...e, seq: i }) as BattleEvent);
  const quiet = (events: Ev[]): number[] => [...koWipedStatuses(numbered(events))].sort((a, b) => a - b);

  it('an empty burst, and a burst with no status events, name nothing', () => {
    expect(quiet([])).toEqual([]);
    expect(quiet(killing())).toEqual([]);
  });

  it('names the add and the wipe of one pair', () => {
    expect(quiet(killing(added('tidus', 'curse'), removed('tidus', 'curse')))).toEqual([2, 3]);
  });

  it('names all five pairs of a Curse (ten events) and nothing else', () => {
    const events = killing(...CURSE.map((s) => added('tidus', s)), ...CURSE.map((s) => removed('tidus', s)));
    expect(quiet(events)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('pairs by target AND status: another target, or another status, is not the same landing', () => {
    expect(quiet(killing(added('yuna', 'curse'), removed('tidus', 'curse')))).toEqual([]);
    expect(quiet(killing(added('tidus', 'poison'), removed('tidus', 'curse')))).toEqual([]);
  });

  it('names only wipes (reason ko): any other reason is a status the player watched come and go', () => {
    for (const reason of ['expired', 'cured', 'dispelled', 'consumed', 'overwritten'] as const) {
      expect(quiet(surviving(added('tidus', 'sleep'), removed('tidus', 'sleep', reason)))).toEqual([]);
    }
  });

  it('a wipe with no add before it in the action is not a pair (the status predates the action)', () => {
    expect(quiet(killing(removed('tidus', 'protect')))).toEqual([]);
  });

  it('stops at the action: an add before an action-start, an action-end or a turn-start is never paired with a wipe after it', () => {
    for (const boundary of [start('x', []), end('x'), turn('x')]) {
      expect(quiet([added('tidus', 'cheer'), boundary, removed('tidus', 'cheer')])).toEqual([]);
    }
  });

  it('a second add after another removal pairs with the wipe; the first add, which that removal ended, does not', () => {
    const events = surviving(added('tidus', 'sleep'), removed('tidus', 'sleep', 'cured'), added('tidus', 'sleep'), removed('tidus', 'sleep'));
    expect(quiet(events)).toEqual([4, 5]);
  });

  it('two adds in a row (a refresh) and one wipe: both adds are the status the wipe takes', () => {
    expect(quiet(killing(added('tidus', 'poison'), added('tidus', 'poison'), removed('tidus', 'poison')))).toEqual([2, 3, 4]);
  });

  it('two actions in one burst are windowed apart: only the second one\'s pair is named', () => {
    const events: Ev[] = [
      start('a', ['tidus']), added('tidus', 'sleep'), end('a'),
      start('b', ['tidus']), added('tidus', 'curse'), removed('tidus', 'curse'), removed('tidus', 'sleep'), end('b'),
    ];
    expect(quiet(events)).toEqual([4, 5]);
  });

  it('does not look at which status it is: Critical follows the same rule if it ever pairs (RC5\'s engine lands none ahead of the wipe)', () => {
    expect(quiet(killing(added('tidus', 'critical'), removed('tidus', 'critical')))).toEqual([2, 3]);
  });

  it('does not touch the events it is given', () => {
    const events = numbered(killing(added('tidus', 'curse'), removed('tidus', 'curse')));
    const before = JSON.stringify(events);
    koWipedStatuses(events);
    expect(JSON.stringify(events)).toBe(before);
  });
});
