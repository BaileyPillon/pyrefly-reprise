/**
 * Release 67, round 30's PR-0546 (the driver's call under Bailey's delegation, 2026-10-28; BOTH games, Chapter I FFX and Chapter IV FFX-2, where the pro staging's defeat card is on): the card names what felled the
 * party ("Felled by <move>") at EVERY battle speed. Before, `noteFoeMove` and `stageFall` asked for the staging port first and there is none at SKIP speed, so 7 of 7 losses read at SKIP (the harness's speed) showed
 * "The party has fallen" although the log names the killing move.
 *
 * Through the real presenter. What stays as it was: at SKIP the staging itself is still off (no cue reaches the layer, today's black flash plays); with the switch at today's, in another chapter or with the ending
 * piece taken back there is no note (no pro card); only a FOE's move is named.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import { setStagingMode, setStagingPieceOff } from '../../../src/engine/pro/staging/StagingSwitch.ts';
import { takeDefeatNote } from '../../../src/engine/pro/staging/DefeatNote.ts';
import type { BreathCue, EndingCue, OpeningCue, StagingPort } from '../../../src/engine/pro/staging/StagingPort.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from '../helpers/FakeStage.ts';

type Seq<T> = T extends unknown ? Omit<T, 'seq'> : never;
type Speed = 'normal' | 'fast' | 'skip';

class Port implements StagingPort {
  readonly log: string[] = [];
  breath(c: BreathCue): void {
    this.log.push(`breath:${c.kind}`);
  }
  ending(c: EndingCue): void {
    this.log.push(`ending:${c.kind}`);
  }
  opening(c: OpeningCue): void {
    this.log.push(`opening:${c.kind}`);
  }
  clear(): void {
    this.log.push('clear');
  }
}

const dmg = (target: string, source: string): Seq<BattleEvent> =>
  ({ type: 'damage', targetId: target, sourceId: source, amount: 900, element: 'none', crit: false, hitIndex: 0, hitCount: 1 }) as Seq<BattleEvent>;

/** One move: the action begins (named, or unnamed when `name` is undefined), one blow lands, the action ends. */
const move = (actor: string, id: string, name: string | undefined, target: string): Array<Seq<BattleEvent>> => [
  { type: 'action-start', actorId: actor, command: { kind: 'ability' } as never, abilityId: id, ...(name === undefined ? {} : { abilityName: name }), targets: [target] } as Seq<BattleEvent>,
  dmg(target, actor),
  { type: 'action-end', actorId: actor },
];
const defeat = { type: 'defeat', result: {} as never } as never;

function rig(game: 'ffx' | 'ffx2', opts: { speed?: Speed; layer?: boolean } = {}) {
  const ffx2 = game === 'ffx2';
  const stage = new FakeStage(ffx2 ? ['yuna', 'rikku', 'paine'] : ['tidus', 'yuna', 'kimahri'], ffx2 ? ['bahamut'] : ['seymour-flux', 'mortiorchis']);
  const port = new Port();
  const presenter = new BattlePresenter({
    stage,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    sleep: () => Promise.resolve(),
    ...(opts.layer === false ? {} : { staging: port }),
    ...(ffx2 ? { game: 'ffx2' as const, victoryPose: 'hold' as const } : {}),
  });
  (stage as unknown as { fx: unknown }).fx = { enabled: () => true, freeze: () => undefined, hit: () => ({ freezeMs: 0, shook: false }) };
  if (opts.speed) presenter.setSpeed(opts.speed);
  return { stage, port, play: (events: Array<Seq<BattleEvent>>) => presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent)) };
}

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
  setStagingMode('pro');
  setDemoChapter('seymour-flux');
  takeDefeatNote();
});
afterEach(() => {
  setStagingMode(null);
  setStagingPieceOff(null);
  setDemoChapter(undefined);
  setPaceGame('other');
  takeDefeatNote();
});

describe('the defeat card names its cause at every battle speed', () => {
  for (const speed of ['normal', 'fast', 'skip'] as const) {
    it(`FFX, Chapter I at ${speed}: Mortiorchis's last move is named${speed === 'skip' ? ', and the staging itself stays off (no cue, today\'s black flash)' : ', with the dim and the caption as before'}`, async () => {
      const r = rig('ffx', { speed });
      await r.play([...move('seymour-flux', 'lance-of-atrophy', 'Lance of Atrophy', 'tidus'), ...move('mortiorchis', 'cross-cleave', 'Cross Cleave', 'yuna'), defeat]);
      expect(takeDefeatNote()).toEqual({ cause: 'Cross Cleave' });
      if (speed === 'skip') {
        expect(r.port.log).toEqual([]);
        expect(r.stage.calls).toContain('screenFlash');
      } else {
        expect(r.port.log.at(-1)).toBe('ending:fall');
        expect(r.stage.calls).not.toContain('screenFlash');
      }
    });

    it(`FFX-2, Chapter IV at ${speed}: Bahamut's last move is named`, async () => {
      setDemoChapter('ffx2-bahamut');
      setPaceGame('ffx2');
      const r = rig('ffx2', { speed });
      await r.play([...move('bahamut', 'impulse', 'Impulse', 'rikku'), ...move('bahamut', 'mega-flare', 'Mega Flare', 'paine'), defeat]);
      expect(takeDefeatNote()).toEqual({ cause: 'Mega Flare' });
      expect(r.port.log.includes('ending:fall')).toBe(speed !== 'skip');
    });
  }

  it('with no layer mounted (the card is still the flow\'s) the cause is still written, at SKIP too', async () => {
    const r = rig('ffx', { speed: 'skip', layer: false });
    await r.play([...move('mortiorchis', 'total-annihilation', 'Total Annihilation', 'tidus'), defeat]);
    expect(takeDefeatNote()).toEqual({ cause: 'Total Annihilation' });
  });

  it('a fight whose foe never named a move writes an empty note: the card says the party has fallen, as before', async () => {
    const r = rig('ffx', { speed: 'skip' });
    await r.play([...move('mortiorchis', 'attack', undefined, 'tidus'), defeat]);
    expect(takeDefeatNote()).toEqual({});
  });

  it('only a foe\'s move is named, never the party\'s own', async () => {
    const r = rig('ffx', { speed: 'skip' });
    await r.play([...move('tidus', 'blitz', 'Blitz Ace', 'seymour-flux'), defeat]);
    expect(takeDefeatNote()).toEqual({});
  });

  it('the staging at today\'s, the ending piece taken back, or another chapter: no note (there is no pro card), at every speed', async () => {
    const events = [...move('mortiorchis', 'cross-cleave', 'Cross Cleave', 'yuna'), defeat];
    for (const speed of ['normal', 'skip'] as const) {
      setStagingMode('today');
      await rig('ffx', { speed }).play(events);
      expect(takeDefeatNote()).toBeNull();
      setStagingMode('pro');
      setStagingPieceOff('ending');
      await rig('ffx', { speed }).play(events);
      expect(takeDefeatNote()).toBeNull();
      setStagingPieceOff(null);
      setDemoChapter('yunalesca');
      await rig('ffx', { speed }).play(events);
      expect(takeDefeatNote()).toBeNull();
      setDemoChapter('seymour-flux');
    }
  });

  it('a note is taken once: a later fight starts with none', async () => {
    await rig('ffx', { speed: 'skip' }).play([...move('mortiorchis', 'cross-cleave', 'Cross Cleave', 'yuna'), defeat]);
    expect(takeDefeatNote()).toEqual({ cause: 'Cross Cleave' });
    expect(takeDefeatNote()).toBeNull();
  });
});
