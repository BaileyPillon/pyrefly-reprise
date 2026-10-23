/**
 * The pro staging through the real presenter (lane "pro-staging"; both games, Chapter I FFX and Chapter IV FFX-2 only): which cues reach the layer's port, in which order, for which move, and none at all with the
 * switch at today's. The pure plan and the switch are in `pro-staging.test.ts`; the layer's DOM is checked in a real browser (the lane's evidence folder).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import { setStagingMode, setStagingPieceOff } from '../../../src/engine/pro/staging/StagingSwitch.ts';
import { takeDefeatNote } from '../../../src/engine/pro/staging/DefeatNote.ts';
import { FREEZE_HOLD_MS } from '../../../src/engine/pro/staging/EndingPlan.ts';
import type { BreathCue, EndingCue, OpeningCue, StagingPort } from '../../../src/engine/pro/staging/StagingPort.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from '../helpers/FakeStage.ts';
import { stageLift, stageTell, stagingPort } from '../../../src/engine/BattlePresenterStaging.ts';

type Seq<T> = T extends unknown ? Omit<T, 'seq'> : never;

class Port implements StagingPort {
  readonly log: string[] = [];
  readonly breaths: BreathCue[] = [];
  readonly endings: EndingCue[] = [];
  readonly openings: OpeningCue[] = [];
  breath(c: BreathCue): void {
    this.breaths.push(c);
    this.log.push(`breath:${c.kind}`);
  }
  ending(c: EndingCue): void {
    this.endings.push(c);
    this.log.push(`ending:${c.kind}`);
  }
  opening(c: OpeningCue): void {
    this.openings.push(c);
    this.log.push(`opening:${c.kind}`);
  }
  clear(): void {
    this.log.push('clear');
  }
}

const dmg = (target: string, hit: number, count: number, source?: string, amount = 500): Seq<BattleEvent> =>
  ({ type: 'damage', targetId: target, ...(source === undefined ? {} : { sourceId: source }), amount, element: 'none', crit: false, hitIndex: hit, hitCount: count }) as Seq<BattleEvent>;

function rig(opts: { party?: string[]; foes?: string[]; chapter?: string; staging?: boolean; speed?: 'normal' | 'fast' | 'skip'; moreLinks?: boolean; reduceMotion?: boolean; menuOpen?: () => boolean } = {}) {
  const party = opts.party ?? ['tidus', 'yuna', 'kimahri'];
  const foes = opts.foes ?? ['seymour-flux', 'mortiorchis'];
  const stage = new FakeStage(party, foes);
  stage.vfx.land = (_at, o) => (o.deco ? 0 : 1200); // the effect says it lands in 1.2 s
  const port = new Port();
  const holds: number[] = [];
  const presenter = new BattlePresenter({
    stage,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    sleep: () => Promise.resolve(),
    ...(opts.staging === false ? {} : { staging: port }),
    ...(opts.chapter === 'ffx2-bahamut' ? { game: 'ffx2' as const, victoryPose: 'hold' as const } : {}),
    ...(opts.reduceMotion ? { moments: { letterbox: async () => undefined, nameSlab: async () => undefined, vignette: () => undefined, clear: () => undefined, reduceMotion: () => true } as never } : {}),
  });
  if (opts.menuOpen) {
    const c = (presenter as unknown as { ctx: { menuOpen?: () => boolean; moments: { shots: { ffx2Framing: boolean } } } }).ctx;
    c.menuOpen = opts.menuOpen;
    c.moments.shots.ffx2Framing = true; // what the presenter sets when it is attached to FFX-2's ATB engine (`KeySlots.isFfx2`)
  }
  (stage as unknown as { fx: unknown }).fx = { enabled: () => true, freeze: (ms: number) => holds.push(ms), hit: () => ({ freezeMs: 0, shook: false }) };
  if (opts.speed) presenter.setSpeed(opts.speed);
  if (opts.moreLinks) (presenter as unknown as { ctx: { moreLinks?: boolean } }).ctx.moreLinks = true;
  return { stage, port, holds, play: (events: Array<Seq<BattleEvent>>) => presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent)) };
}

const move = (actor: string, id: string, name: string, hits: number, targets: string[]): Array<Seq<BattleEvent>> => [
  { type: 'action-start', actorId: actor, command: { kind: 'ability' } as never, abilityId: id, abilityName: name, targets },
  ...targets.slice(0, hits).map((t, i) => dmg(t, i, hits, actor)),
  { type: 'action-end', actorId: actor },
];

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
  setStagingMode('pro');
  setDemoChapter('seymour-flux');
});
afterEach(() => {
  setStagingMode(null);
  setStagingPieceOff(null);
  setDemoChapter(undefined);
  setPaceGame('other');
  takeDefeatNote();
});

describe('the held breath through the presenter', () => {
  it('Total Annihilation (FFX): mark at the move, tell with the effect\'s lead-in, blow on the mark, lift at the end', async () => {
    const r = rig();
    await r.play(move('mortiorchis', 'total-annihilation', 'Total Annihilation', 3, ['tidus', 'yuna', 'kimahri']));
    expect(r.port.log).toEqual(['breath:mark', 'breath:tell', 'breath:blow', 'breath:lift']);
    const [mark, tell, blow] = r.port.breaths;
    expect(mark).toMatchObject({ kind: 'mark', move: 'total-annihilation', game: 'ffx', name: 'Total Annihilation', attacker: 'mortiorchis' });
    expect((mark as unknown as { party: string[] }).party).toEqual(['tidus', 'yuna', 'kimahri']);
    expect(tell).toMatchObject({ kind: 'tell', msToBlow: 1100, attacker: 'mortiorchis' }); // FFX tells from the move's own start (the effect says only 0.26 s after the first damage)
    expect(blow).toMatchObject({ kind: 'blow', move: 'total-annihilation' });
  });

  it('the blow and the tell come once for the whole move, not once per hit', async () => {
    const r = rig();
    await r.play(move('mortiorchis', 'total-annihilation', 'Total Annihilation', 3, ['tidus', 'yuna', 'kimahri']));
    expect(r.port.log.filter((l) => l === 'breath:tell')).toHaveLength(1);
    expect(r.port.log.filter((l) => l === 'breath:blow')).toHaveLength(1);
  });

  it('Mega Flare (FFX-2): the same four cues, game ffx2, Bahamut the attacker', async () => {
    setDemoChapter('ffx2-bahamut');
    setPaceGame('ffx2');
    const r = rig({ party: ['yuna', 'rikku', 'paine'], foes: ['bahamut'], chapter: 'ffx2-bahamut' });
    await r.play(move('bahamut', 'mega-flare', 'Mega Flare', 3, ['yuna', 'rikku', 'paine']));
    expect(r.port.log).toEqual(['breath:mark', 'breath:tell', 'breath:blow', 'breath:lift']);
    expect(r.port.breaths[0]).toMatchObject({ move: 'mega-flare', game: 'ffx2', attacker: 'bahamut' });
  });

  it('FFX-2 (D-357): the held breath hands the layer a probe that answers whether a command menu is open NOW, following the presenter own flag', async () => {
    setDemoChapter('ffx2-bahamut');
    setPaceGame('ffx2');
    let open = true;
    const probes: Array<() => boolean> = [];
    const r = rig({ party: ['yuna', 'rikku', 'paine'], foes: ['bahamut'], chapter: 'ffx2-bahamut', menuOpen: () => open });
    (r.port as unknown as { setMenuProbe: (p: () => boolean) => void }).setMenuProbe = (p) => probes.push(p);
    await r.play(move('bahamut', 'mega-flare', 'Mega Flare', 3, ['yuna', 'rikku', 'paine']));
    expect(probes.length).toBeGreaterThan(0);
    expect(probes[0]!()).toBe(true);
    open = false;
    expect(probes[0]!()).toBe(false);
    expect(r.port.breaths.find((b) => b.kind === 'tell')).toMatchObject({ menu: true }); // asked as the tell began, with the menu open
  });

  it('a group move whose blows each count their own first hit (one per girl) still tells once, and blows once', async () => {
    setDemoChapter('ffx2-bahamut');
    setPaceGame('ffx2');
    const r = rig({ party: ['yuna', 'rikku', 'paine'], foes: ['bahamut'], chapter: 'ffx2-bahamut' });
    await r.play([
      { type: 'action-start', actorId: 'bahamut', command: { kind: 'ability' } as never, abilityId: 'mega-flare', abilityName: 'Mega Flare', targets: ['yuna', 'rikku', 'paine'] },
      dmg('yuna', 0, 1, 'bahamut'),
      dmg('rikku', 0, 1, 'bahamut'),
      dmg('paine', 0, 1, 'bahamut'),
      { type: 'action-end', actorId: 'bahamut' },
    ]);
    expect(r.port.log).toEqual(['breath:mark', 'breath:tell', 'breath:blow', 'breath:lift']);
  });

  it('game case: Mega Flare in FFX and Total Annihilation in FFX-2 stage nothing (the aeon Bahamut shares the id in FFX)', async () => {
    const ffx = rig({ foes: ['bahamut'] });
    await ffx.play(move('bahamut', 'mega-flare', 'Mega Flare', 1, ['tidus']));
    expect(ffx.port.log).toEqual([]);
    setDemoChapter('ffx2-bahamut');
    const ffx2 = rig({ party: ['yuna'], foes: ['bahamut'], chapter: 'ffx2-bahamut' });
    await ffx2.play(move('bahamut', 'total-annihilation', 'Total Annihilation', 1, ['yuna']));
    expect(ffx2.port.log).toEqual([]);
  });

  it('other boss moves, and the party\'s own moves, stage nothing', async () => {
    const r = rig();
    await r.play(move('mortiorchis', 'cross-cleave', 'Cross Cleave', 2, ['tidus', 'yuna']));
    await r.play(move('tidus', 'total-annihilation', 'Total Annihilation', 1, ['mortiorchis']));
    expect(r.port.log).toEqual([]);
  });

  it('FFX\'s ladder marks the move at "imminent" (stage 2), a turn ahead; stage 1 marks nothing', async () => {
    const r = rig();
    await r.play([{ type: 'charge', enemyId: 'mortiorchis', name: 'Auto-Attack Mode', stage: 1, turnsLeft: 1 } as never]); // the engine's own captions (`seymour-flux-rules.ts#announceCharge`)
    expect(r.port.log).toEqual([]);
    await r.play([{ type: 'charge', enemyId: 'mortiorchis', name: 'Ready To Annihilate', stage: 2, turnsLeft: 0 } as never]);
    expect(r.port.log).toEqual(['breath:mark']);
    // and the move itself, when it comes, does not mark twice
    await r.play(move('mortiorchis', 'total-annihilation', 'Total Annihilation', 1, ['tidus']));
    expect(r.port.log).toEqual(['breath:mark', 'breath:tell', 'breath:blow', 'breath:lift']);
  });

  it('FFX-2: the countdown marks Mega Flare from the number 2 (stage 2); 5, 4 and 3 mark nothing', async () => {
    setDemoChapter('ffx2-bahamut');
    setPaceGame('ffx2');
    const r = rig({ party: ['yuna', 'rikku', 'paine'], foes: ['bahamut'], chapter: 'ffx2-bahamut' });
    await r.play([{ type: 'charge', enemyId: 'bahamut', name: '3', stage: 1, turnsLeft: 2 } as never]);
    expect(r.port.log).toEqual([]);
    await r.play([{ type: 'charge', enemyId: 'bahamut', name: '2', stage: 2, turnsLeft: 1 } as never]);
    expect(r.port.log).toEqual(['breath:mark']);
    expect(r.port.breaths[0]).toMatchObject({ move: 'mega-flare', game: 'ffx2', attacker: 'bahamut' });
  });

  it('FFX-2: the boss acts between the countdown numbers and the marker waits through those; only the staged move own end lifts it (the first browser run lifted at the first Impulse)', async () => {
    setDemoChapter('ffx2-bahamut');
    setPaceGame('ffx2');
    const r = rig({ party: ['yuna', 'rikku', 'paine'], foes: ['bahamut'], chapter: 'ffx2-bahamut' });
    await r.play([{ type: 'charge', enemyId: 'bahamut', name: '2', stage: 2, turnsLeft: 1 } as never]);
    await r.play(move('bahamut', 'impulse', 'Impulse', 3, ['yuna', 'rikku', 'paine']));
    expect(r.port.log).toEqual(['breath:mark']); // Impulse began and ended: no tell, no blow, no lift
    await r.play(move('bahamut', 'mega-flare', 'Mega Flare', 3, ['yuna', 'rikku', 'paine']));
    expect(r.port.log).toEqual(['breath:mark', 'breath:tell', 'breath:blow', 'breath:lift']);
  });

  it('a boss that falls takes its marker with it', async () => {
    const r = rig();
    await r.play([{ type: 'charge', enemyId: 'mortiorchis', name: 'Ready To Annihilate', stage: 2, turnsLeft: 0 } as never, { type: 'ko', targetId: 'mortiorchis' } as never]);
    expect(r.port.log.slice(0, 2)).toEqual(['breath:mark', 'breath:lift']);
  });

  it('with the switch at today\'s, or the piece taken back, or no layer, or at skip speed: no cue', async () => {
    const events = move('mortiorchis', 'total-annihilation', 'Total Annihilation', 2, ['tidus', 'yuna']);
    setStagingMode('today');
    const off = rig();
    await off.play(events);
    expect(off.port.log).toEqual([]);
    setStagingMode('pro');
    setStagingPieceOff('breath');
    const piece = rig();
    await piece.play(events);
    expect(piece.port.log).toEqual([]);
    setStagingPieceOff(null);
    const none = rig({ staging: false });
    await expect(none.play(events)).resolves.toBeDefined();
    const skip = rig({ speed: 'skip' });
    await skip.play(events);
    expect(skip.port.log).toEqual([]);
  });

  it('a minimal context with no deps (the older presenter tests build one) stages nothing and does not throw', () => {
    const bare = { stage: new FakeStage(), speed: () => 'normal' } as never;
    expect(stagingPort(bare, 'breath')).toBeNull();
    expect(() => stageLift(bare, 'mortiorchis')).not.toThrow();
    expect(() => stageTell(bare, { type: 'damage', targetId: 'tidus', hitIndex: 0 } as never, { serial: 1, actorId: 'mortiorchis', abilityId: 'total-annihilation', targets: [] }, 900)).not.toThrow();
  });

  it('outside the two demo chapters nothing is staged', async () => {
    setDemoChapter('braskas-final-aeon');
    const r = rig();
    await r.play(move('mortiorchis', 'total-annihilation', 'Total Annihilation', 2, ['tidus', 'yuna']));
    expect(r.port.log).toEqual([]);
  });

  it('the cue carries the playback speed\'s factor and the tell is in real time', async () => {
    const r = rig({ speed: 'fast' });
    await r.play(move('mortiorchis', 'total-annihilation', 'Total Annihilation', 1, ['tidus']));
    const tell = r.port.breaths.find((b) => b.kind === 'tell') as Extract<BreathCue, { kind: 'tell' }>;
    expect(tell.scale).toBeCloseTo(0.32, 5);
    expect(tell.msToBlow).toBeCloseTo(1100 * 0.32, 5);
  });
});

describe('the ending through the presenter', () => {
  const finish = (): Array<Seq<BattleEvent>> => [dmg('seymour-flux', 0, 1, 'tidus', 9999), { type: 'ko', targetId: 'seymour-flux' } as never, { type: 'victory', result: {} as never } as never];

  it('the last blow freezes the frame: a freeze cue, the field held half a second, then the title at the cheer', async () => {
    const r = rig();
    await r.play(finish());
    expect(r.port.log).toEqual(['ending:freeze', 'ending:title']);
    expect(r.port.endings[0]).toMatchObject({ kind: 'freeze', boss: 'seymour-flux', holdMs: FREEZE_HOLD_MS });
    expect(r.holds).toEqual([FREEZE_HOLD_MS]);
    expect(r.port.endings[1]).toMatchObject({ kind: 'title', boss: 'seymour-flux' });
  });

  it('the last foe is read from the field too: FFX-2 ATB emits the victory from a later tick, so the killing blow burst has none after it', async () => {
    setDemoChapter('ffx2-bahamut');
    setPaceGame('ffx2');
    const r = rig({ party: ['yuna', 'rikku', 'paine'], foes: ['bahamut'], chapter: 'ffx2-bahamut' });
    await r.play([dmg('bahamut', 0, 1, 'yuna', 9999), { type: 'ko', targetId: 'bahamut' } as never]); // no victory in this burst
    expect(r.port.log).toEqual(['ending:freeze']);
  });

  it('a foe that is not the last holds nothing, and a chain that goes on holds nothing', async () => {
    const r = rig();
    await r.play([dmg('mortiorchis', 0, 1, 'tidus', 9999), { type: 'ko', targetId: 'mortiorchis' } as never]);
    expect(r.port.log).toEqual([]);
    const chained = rig({ moreLinks: true });
    await chained.play(finish());
    expect(chained.port.log.includes('ending:freeze')).toBe(false);
  });

  it('REDUCE MOTION holds nothing (the freeze is one of the four things it turns off) but the flash still opens the beat', async () => {
    // a moments port that reports REDUCE MOTION
    const stage = new FakeStage(['tidus'], ['seymour-flux']);
    const port = new Port();
    const p = new BattlePresenter({
      stage,
      damageNumbers: new FakeDamageNumbers(),
      messageBar: new FakeMessageBar(),
      sleep: () => Promise.resolve(),
      staging: port,
      moments: { letterbox: async () => undefined, nameSlab: async () => undefined, vignette: () => undefined, clear: () => undefined, reduceMotion: () => true } as never,
    });
    await p.play(finish().map((e, i) => ({ ...e, seq: i }) as BattleEvent));
    expect(port.endings[0]).toMatchObject({ kind: 'freeze', holdMs: 0, calm: true });
  });

  it('FFX-2 Chapter IV: the title is quiet, the stand-down is at least 2.4 s and the silent pull-back follows (no pose, no fanfare is staged)', async () => {
    setDemoChapter('ffx2-bahamut');
    const r = rig({ party: ['yuna', 'rikku', 'paine'], foes: ['bahamut'], chapter: 'ffx2-bahamut' });
    await r.play([dmg('bahamut', 0, 1, 'yuna', 9999), { type: 'ko', targetId: 'bahamut' } as never, { type: 'victory', result: {} as never } as never]);
    expect(r.port.log[0]).toBe('ending:freeze');
    expect(r.port.log).toContain('ending:title');
    expect(r.port.endings[0]).toMatchObject({ game: 'ffx2' });
  });

  it('FFX-2 Chapter IV: the silent pull-back plays, and under REDUCE MOTION it does not (no camera push, no bars); the title and the quiet hold stay', async () => {
    setDemoChapter('ffx2-bahamut');
    const events = [dmg('bahamut', 0, 1, 'yuna', 9999), { type: 'ko', targetId: 'bahamut' } as never, { type: 'victory', result: {} as never } as never];
    const normal = rig({ party: ['yuna', 'rikku', 'paine'], foes: ['bahamut'], chapter: 'ffx2-bahamut' });
    await normal.play(events);
    await new Promise((r) => setTimeout(r, 5));
    expect(normal.port.log).toContain('ending:pullback');
    const calm = rig({ party: ['yuna', 'rikku', 'paine'], foes: ['bahamut'], chapter: 'ffx2-bahamut', reduceMotion: true });
    await calm.play(events);
    await new Promise((r) => setTimeout(r, 5));
    expect(calm.port.log).toContain('ending:title');
    expect(calm.port.log).not.toContain('ending:pullback');
  });

  it('the last member falls: the dim and the caption, no black flash, and the foe\'s move named for the card', async () => {
    const r = rig();
    await r.play([...move('mortiorchis', 'total-annihilation', 'Total Annihilation', 1, ['tidus']), { type: 'defeat', result: {} as never } as never]);
    expect(r.port.log.at(-1)).toBe('ending:fall');
    expect(r.stage.calls).not.toContain('screenFlash');
    expect(takeDefeatNote()).toEqual({ cause: 'Total Annihilation' });
  });

  it('with the staging off the defeat flashes black as it always did and the victory has no freeze or title', async () => {
    setStagingMode('today');
    const r = rig();
    await r.play([{ type: 'defeat', result: {} as never } as never]);
    expect(r.stage.calls).toContain('screenFlash');
    expect(r.port.log).toEqual([]);
  });
});

describe('the openings through the presenter', () => {
  it('an FFX Overdrive hands the opening to the staging: a cue with the caster and the move\'s name', async () => {
    const r = rig({ foes: ['seymour-flux'] });
    await r.play([{ type: 'action-start', actorId: 'tidus', command: { kind: 'overdrive' } as never, abilityId: 'slice-and-dice', abilityName: 'Slice & Dice', targets: ['seymour-flux'] }, { type: 'action-end', actorId: 'tidus' }]);
    expect(r.port.openings).toHaveLength(1);
    expect(r.port.openings[0]).toMatchObject({ kind: 'overdrive', actor: 'tidus', name: 'Slice & Dice', game: 'ffx' });
  });

  it('the Overdrive\'s banner slab and bars are not drawn while the staging has the opening, and are when it has not', async () => {
    const calls: string[] = [];
    const moments = { letterbox: async (on: boolean) => void calls.push(`bars:${on}`), nameSlab: async (o: { kind: string }) => void calls.push(`slab:${o.kind}`), vignette: () => undefined, clear: () => undefined };
    const ev = [{ type: 'action-start', actorId: 'tidus', command: { kind: 'overdrive' } as never, abilityId: 'slice-and-dice', abilityName: 'Slice & Dice', targets: ['seymour-flux'] }, { type: 'action-end', actorId: 'tidus' }] as Array<Seq<BattleEvent>>;
    const run = async (mode: 'pro' | 'today'): Promise<void> => {
      setStagingMode(mode);
      const stage = new FakeStage(['tidus'], ['seymour-flux']);
      const p = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: () => Promise.resolve(), staging: new Port(), moments: moments as never });
      await p.play(ev.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
    };
    await run('pro');
    expect(calls.includes('slab:overdrive')).toBe(false);
    expect(calls.includes('bars:true')).toBe(false);
    calls.length = 0;
    await run('today');
    expect(calls.includes('slab:overdrive')).toBe(true);
    expect(calls.includes('bars:true')).toBe(true);
  });

  it('FFX-2: a dress change tells the layer (the HUD\'s own flourish keeps its painted twirl); FFX has none', async () => {
    setDemoChapter('ffx2-bahamut');
    setPaceGame('ffx2');
    const r = rig({ party: ['yuna'], foes: ['bahamut'], chapter: 'ffx2-bahamut' });
    await r.play([{ type: 'spherechange', who: 'yuna', from: 'white-mage', to: 'gunner', gatesCrossed: ['green'] } as never]);
    expect(r.port.openings).toHaveLength(1);
    expect(r.port.openings[0]).toMatchObject({ kind: 'change', actor: 'yuna', dress: 'gunner', gate: 'green', game: 'ffx2' });
  });
});
