/**
 * The portrait only on a big move (Bailey, 2026-11-06: "when character portraits pop in and fill the left half of the screen its not really making sense to me why they pop up when they do it just seems kind of random";
 * his pick on 2026-11-07: "A: only on big moves"). Both games, each with its own list (`engine/BigMoves.ts`); the turn start shows no portrait; `?portraits=turns` is the old behaviour, `?portraits=off` none.
 *
 * Proved here: the switch, the two lists (and that each leaks nothing into the other game), the beat (the first slam in full, the repeat a flash, per member; nothing for a fiend, at SKIP, over an open FFX-2 menu, or in the
 * other modes), the slab's own text, and the real presenter: an FFX Overdrive's portrait takes the place of its name slab and of the splash, the staged opening's small name stands aside, FFX-2's Sword Dance gets the portrait
 * and no turn does.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState, Command } from '../../src/battle/common/types.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { MomentsPort } from '../../src/engine/BattlePresenterPorts.ts';
import { BigMoveBeat, CUT_IN_QUICK_HOLD_MS, type BigMoveDeps } from '../../src/engine/BigMoveCutIn.ts';
import { bigMoveOf, dressUpMoveOf, type ActionFacts } from '../../src/engine/BigMoves.ts';
import { portraitMode, portraitModeFromSearch, setPortraitMode } from '../../src/engine/CutInMode.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { setStagingMode, setStagingPieceOff } from '../../src/engine/pro/staging/StagingSwitch.ts';
import type { OpeningCue, StagingPort } from '../../src/engine/pro/staging/StagingPort.ts';
import { CUT_IN_HOLD_MS, TurnCutInBeat } from '../../src/engine/TurnCutIn.ts';
import { titleFit } from '../../src/ui/inkgold/cutin.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

type Req = Parameters<NonNullable<MomentsPort['turnCutIn']>>[0];
type ActionStart = Extract<BattleEvent, { type: 'action-start' }>;
type Seq<T> = T extends unknown ? Omit<T, 'seq'> : never; // Omit over a union would keep only the fields every member has

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
});
afterEach(() => {
  setPortraitMode(null);
  setStagingMode(null);
  setStagingPieceOff(null);
  setDemoChapter(undefined);
  setPaceGame('other');
});

// ----------------------------------------------------------------------------------------------- fixtures

const ffxState = (): BattleState =>
  ({
    game: 'ffx',
    activeIds: ['tidus', 'yuna', 'kimahri'],
    enemyIds: ['seymour-flux'],
    combatants: {
      tidus: { id: 'tidus', name: 'Tidus' },
      yuna: { id: 'yuna', name: 'Yuna' },
      kimahri: { id: 'kimahri', name: 'Kimahri' },
      valefor: { id: 'valefor', name: 'Valefor' },
      'seymour-flux': { id: 'seymour-flux', name: 'Seymour Flux' },
    },
  }) as unknown as BattleState;

const ffx2State = (): BattleState =>
  ({
    game: 'ffx2',
    activeIds: ['yuna', 'rikku', 'paine'],
    enemyIds: ['bahamut'],
    combatants: {
      yuna: { id: 'yuna', name: 'Yuna' },
      rikku: { id: 'rikku', name: 'Rikku' },
      paine: { id: 'paine', name: 'Paine' },
      'full-throttle-main': { id: 'full-throttle-main', name: 'Full Throttle' },
      bahamut: { id: 'bahamut', name: 'Bahamut' },
    },
  }) as unknown as BattleState;

const start = (actorId: string, command: Partial<Command> & { kind: Command['kind'] }, abilityId?: string, abilityName?: string): ActionStart =>
  ({ type: 'action-start', seq: 1, actorId, command: { targets: [], ...command } as Command, ...(abilityId ? { abilityId } : {}), ...(abilityName ? { abilityName } : {}), targets: [] }) as ActionStart;

const facts = (game: 'ffx' | 'ffx2', actorId: string, command: Partial<Command> & { kind: Command['kind'] }, abilityId?: string, abilityName?: string, actorName?: string): ActionFacts => ({
  game,
  command: { targets: [], ...command } as Command,
  abilityId,
  abilityName,
  actorId,
  actorName: actorName ?? actorId,
});

function port(calls: Req[]): MomentsPort {
  return {
    letterbox: async () => {},
    nameSlab: async () => {},
    vignette: () => {},
    clear: () => {},
    turnCutIn: async (req) => {
      calls.push(req);
    },
  };
}

function beat(calls: Req[], over: Partial<BigMoveDeps> & { state?: () => BattleState | null } = {}): BigMoveBeat {
  return new BigMoveBeat({
    moments: port(calls),
    speed: () => 'normal',
    state: () => ffxState(),
    sideOf: (id) => (id === 'seymour-flux' || id === 'bahamut' ? 'enemy' : 'party'),
    ...over,
  });
}

// ----------------------------------------------------------------------------------------------- the switch

describe('the switch (?portraits=)', () => {
  it('big is the default; turns is the old behaviour and off is none; anything else is big', () => {
    expect(portraitMode()).toBe('big');
    expect(portraitModeFromSearch(undefined)).toBe('big');
    expect(portraitModeFromSearch('')).toBe('big');
    expect(portraitModeFromSearch('?portraits=turns')).toBe('turns');
    expect(portraitModeFromSearch('?portraits=OFF&look=pro')).toBe('off');
    expect(portraitModeFromSearch('?portraits=big')).toBe('big');
    expect(portraitModeFromSearch('?portraits=every')).toBe('big');
  });

  it('a turn start shows no portrait by default, in either game: the old beat plays only under ?portraits=turns', async () => {
    for (const state of [ffxState(), ffx2State()]) {
      const calls: Req[] = [];
      const old = new TurnCutInBeat({ moments: port(calls), speed: () => 'normal' });
      await old.play(state, state.activeIds[0]!);
      await old.play(state, state.activeIds[1]!);
      expect(calls).toEqual([]);
    }
    setPortraitMode('turns');
    const calls: Req[] = [];
    await new TurnCutInBeat({ moments: port(calls), speed: () => 'normal' }).play(ffxState(), 'tidus');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ actorId: 'tidus', label: 'CTB 1 OF 3', holdMs: CUT_IN_HOLD_MS });
    expect(calls[0]!.move).toBeUndefined(); // the turn's own slab: "YOUR TURN", not a move
  });
});

// ----------------------------------------------------------------------------------------------- the lists

describe("FFX's big moves: Overdrives, summons and aeons' Overdrives (research ffx-vs-ffx2-presentation sections 6 and 7)", () => {
  it("a character's Overdrive names the move over the member's portrait", () => {
    const m = bigMoveOf(facts('ffx', 'tidus', { kind: 'overdrive', id: 'slice-and-dice' } as never, 'slice-and-dice', 'Slice & Dice', 'Tidus'));
    expect(m).toEqual({ kind: 'overdrive', portraitId: 'tidus', who: 'Tidus', title: 'Slice & Dice', tag: 'TIDUS · OVERDRIVE' });
  });

  it("an aeon's Overdrive is the same kind of moment, with the aeon's own portrait", () => {
    const m = bigMoveOf(facts('ffx', 'valefor', { kind: 'overdrive', id: 'energy-ray' } as never, 'energy-ray', 'Energy Ray', 'Valefor'));
    expect(m).toMatchObject({ kind: 'overdrive', portraitId: 'valefor', title: 'Energy Ray', tag: 'VALEFOR · OVERDRIVE' });
  });

  it("a summon shows the summoner's portrait and names the aeon", () => {
    const m = bigMoveOf({ ...facts('ffx', 'yuna', { kind: 'summon', id: 'valefor' } as never, undefined, 'Summon', 'Yuna'), aeonName: 'Valefor' });
    expect(m).toEqual({ kind: 'summon', portraitId: 'yuna', who: 'Yuna', title: 'Valefor', tag: 'YUNA · SUMMON' });
  });

  it('nothing else is big: attack, skills, magic, items, defend, escape, switch', () => {
    const others: Array<Partial<Command> & { kind: Command['kind'] }> = [
      { kind: 'attack' },
      { kind: 'ability', id: 'cure' } as never,
      { kind: 'item', id: 'potion' } as never,
      { kind: 'defend' },
      { kind: 'escape' },
      { kind: 'dismiss' },
      { kind: 'switch', extra: { outId: 'a', inId: 'b' } } as never,
    ];
    for (const c of others) expect(bigMoveOf(facts('ffx', 'tidus', c, 'cure', 'Cure'))).toBeNull();
  });

  it("FFX's list does not take FFX-2's moves: Sword Dance is not big in FFX, and a special dress up is not a thing there", () => {
    expect(bigMoveOf(facts('ffx', 'paine', { kind: 'ability', id: 'x2-full-throttle-sword-dance' } as never, 'x2-full-throttle-sword-dance', 'Sword Dance'))).toBeNull();
    expect(bigMoveOf(facts('ffx', 'paine', { kind: 'spherechange', extra: { toDressphere: 'full-throttle', toNode: 0, gatesCrossed: [], specialDressUp: true } } as never))).toBeNull();
  });
});

describe("FFX-2's big moves: the special dresspheres' change and their three finishers, and nothing more (the narrowest sourced list)", () => {
  const finishers: Array<[string, string, string, string]> = [
    ['x2-floral-fallal-great-whirl', 'Great Whirl', 'yuna', 'Yuna'],
    ['x2-machina-maw-vajra', 'Vajra', 'rikku', 'Rikku'],
    ['x2-full-throttle-sword-dance', 'Sword Dance', 'paine', 'Paine'],
  ];

  it.each(finishers)("%s: the owner's portrait, not the part's, and the move's name", (id, name, owner, ownerName) => {
    const m = bigMoveOf(facts('ffx2', `${id.split('-').slice(1, -1).join('-')}-main`, { kind: 'ability', id } as never, id, name));
    expect(m).toEqual({ kind: 'special', portraitId: owner, who: ownerName, title: name, tag: `${ownerName.toUpperCase()} · SPECIAL` });
  });

  it('the change into a special dressphere (Special Dress Up) is big, named for the dressphere, over the girl who changed: it rides the spherechange event, which the engine emits with no action-start', () => {
    expect(dressUpMoveOf('ffx2', { id: 'paine', name: 'Paine' }, 'full-throttle', 'full-throttle')).toEqual({ kind: 'special', portraitId: 'paine', who: 'Paine', title: 'Full Throttle', tag: 'PAINE · SPECIAL DRESS UP' });
    expect(dressUpMoveOf('ffx2', { id: 'yuna', name: 'Yuna' }, 'floral-fallal', 'floral-fallal')?.title).toBe('Floral Fallal');
    expect(dressUpMoveOf('ffx2', { id: 'yuna', name: 'Yuna' }, 'gunner', undefined)).toBeNull(); // an ordinary change carries no `special`
    expect(dressUpMoveOf('ffx', { id: 'yuna', name: 'Yuna' }, 'floral-fallal', 'floral-fallal')).toBeNull(); // FFX has no dress change
    expect(dressUpMoveOf(undefined, { id: 'yuna', name: 'Yuna' }, 'floral-fallal', 'floral-fallal')).toBeNull();
    // and an action-start that names a spherechange command (which the engine never emits) is nothing either way
    const c = { kind: 'spherechange', extra: { toDressphere: 'full-throttle', toNode: 3, gatesCrossed: [], specialDressUp: true } } as never;
    expect(bigMoveOf(facts('ffx2', 'paine', c, undefined, undefined, 'Paine'))).toBeNull();
  });

  it('an ordinary dress change, Trigger Happy, Lady Luck, a special part\'s ordinary moves and an enemy\'s Mega Flare are not (the open question, not guesses)', () => {
    const change = { kind: 'spherechange', extra: { toDressphere: 'gunner', toNode: 1, gatesCrossed: [] } } as never;
    expect(bigMoveOf(facts('ffx2', 'yuna', change))).toBeNull();
    for (const id of ['x2-gunner-trigger-happy', 'x2-lady-luck-four-dice', 'x2-full-throttle-fright', 'x2-floral-fallal-flare-whirl', 'mega-flare', 'x2-mascot-moogle-beam']) {
      expect(bigMoveOf(facts('ffx2', 'paine', { kind: 'ability', id } as never, id, id))).toBeNull();
    }
    expect(bigMoveOf(facts('ffx2', 'paine', { kind: 'attack' }))).toBeNull();
  });

  it("FFX-2 has no Overdrive and no summon: those kinds are nothing here", () => {
    expect(bigMoveOf(facts('ffx2', 'yuna', { kind: 'overdrive', id: 'swordplay' } as never, 'swordplay', 'Swordplay'))).toBeNull();
    expect(bigMoveOf(facts('ffx2', 'yuna', { kind: 'summon', id: 'valefor' } as never, undefined, 'Summon'))).toBeNull();
  });

  it('FF7 and an unknown game: never', () => {
    const f = facts('ffx', 'tidus', { kind: 'overdrive', id: 'x' } as never);
    expect(bigMoveOf({ ...f, game: 'ff7' })).toBeNull();
    expect(bigMoveOf({ ...f, game: undefined })).toBeNull();
  });
});

// ----------------------------------------------------------------------------------------------- the beat

describe('BigMoveBeat: the first slam in full, a repeat a flash, per member', () => {
  const od = (who: string): ActionStart => start(who, { kind: 'overdrive', id: 'swordplay' } as never, 'swordplay', 'Swordplay');

  it('the first big move of a member is the full slam, the next a quick flash; another member is full again', () => {
    const calls: Req[] = [];
    const b = beat(calls);
    const first = b.decide(od('tidus'))!;
    const second = b.decide(od('tidus'))!;
    const other = b.decide(od('yuna'))!;
    expect(first).toMatchObject({ actorId: 'tidus', game: 'ffx', side: 'left', holdMs: CUT_IN_HOLD_MS, quick: false, label: 'TIDUS · OVERDRIVE' });
    expect(first.move).toEqual({ title: 'Swordplay', tag: 'TIDUS · OVERDRIVE' });
    expect(second).toMatchObject({ actorId: 'tidus', holdMs: CUT_IN_QUICK_HOLD_MS, quick: true });
    expect(other).toMatchObject({ actorId: 'yuna', holdMs: CUT_IN_HOLD_MS, quick: false });
    expect(CUT_IN_QUICK_HOLD_MS).toBeLessThan(CUT_IN_HOLD_MS / 3);
  });

  it('keyed per member, not per move: a summon after an Overdrive is the same member\'s flash', () => {
    const b = beat([]);
    expect(b.decide(start('yuna', { kind: 'overdrive', id: 'grand-summon' } as never, 'grand-summon', 'Grand Summon'))!.quick).toBe(false);
    expect(b.decide(start('yuna', { kind: 'summon', id: 'valefor' } as never, undefined, 'Summon'))).toMatchObject({ quick: true, move: { title: 'Valefor', tag: 'YUNA · SUMMON' } });
  });

  it('a new battle forgets: reset brings the full slam back', () => {
    const b = beat([]);
    b.decide(od('tidus'));
    b.reset();
    expect(b.decide(od('tidus'))!.quick).toBe(false);
  });

  it('the hold scales with the playback speed, and SKIP shows nothing (nobody is watching)', () => {
    const fast = beat([], { speed: () => 'fast' });
    expect(fast.decide(od('tidus'))!.holdMs).toBeLessThan(CUT_IN_HOLD_MS);
    expect(beat([], { speed: () => 'skip' }).decide(od('tidus'))).toBeNull();
  });

  it('an ordinary action earns none, and does not use up the member\'s full slam', () => {
    const b = beat([]);
    expect(b.decide(start('tidus', { kind: 'attack' }))).toBeNull();
    expect(b.decide(start('tidus', { kind: 'ability', id: 'cure' } as never, 'cure', 'Cure'))).toBeNull();
    expect(b.decide(od('tidus'))!.quick).toBe(false);
  });

  it('a fiend\'s big move gets no portrait (it has its own banner, the held breath and the telegraph)', () => {
    const b = beat([]);
    expect(b.decide(start('seymour-flux', { kind: 'overdrive', id: 'x' } as never, 'x', 'Total Annihilation'))).toBeNull();
  });

  it('nothing in the other modes, without a port, without a state, or over an open FFX-2 menu (D-357)', () => {
    setPortraitMode('turns');
    expect(beat([]).decide(od('tidus'))).toBeNull();
    setPortraitMode('off');
    expect(beat([]).decide(od('tidus'))).toBeNull();
    setPortraitMode(null);
    expect(new BigMoveBeat({ moments: null, speed: () => 'normal', state: () => ffxState(), sideOf: () => 'party' }).decide(od('tidus'))).toBeNull();
    expect(beat([], { state: () => null }).decide(od('tidus'))).toBeNull();
    const sword = start('full-throttle-main', { kind: 'ability', id: 'x2-full-throttle-sword-dance' } as never, 'x2-full-throttle-sword-dance', 'Sword Dance');
    let open = true;
    const b2 = beat([], { state: () => ffx2State(), menuOpen: () => open });
    expect(b2.decide(sword)).toBeNull();
    open = false;
    expect(b2.decide(sword)).toMatchObject({ actorId: 'paine', game: 'ffx2', label: 'PAINE · SPECIAL', move: { title: 'Sword Dance' } });
  });

  it('FFX-2: Special Dress Up is the full slam for the girl, a flash on a second one, nothing for an ordinary change, over an open menu, or in FFX', () => {
    const change = (who: string, to: string, special?: string): Extract<BattleEvent, { type: 'spherechange' }> =>
      ({ type: 'spherechange', seq: 1, who, from: 'white-mage', to, gatesCrossed: [], ...(special ? { special } : {}) }) as Extract<BattleEvent, { type: 'spherechange' }>;
    let open = false;
    const b = beat([], { state: () => ffx2State(), menuOpen: () => open });
    expect(b.decideDressUp(change('yuna', 'floral-fallal', 'floral-fallal'))).toMatchObject({ actorId: 'yuna', game: 'ffx2', label: 'YUNA · SPECIAL DRESS UP', quick: false, holdMs: CUT_IN_HOLD_MS, move: { title: 'Floral Fallal' } });
    expect(b.decideDressUp(change('yuna', 'floral-fallal', 'floral-fallal'))).toMatchObject({ quick: true, holdMs: CUT_IN_QUICK_HOLD_MS });
    expect(b.decideDressUp(change('rikku', 'gunner'))).toBeNull();
    open = true;
    expect(b.decideDressUp(change('paine', 'full-throttle', 'full-throttle'))).toBeNull(); // D-357
    expect(beat([], { state: () => ffxState() }).decideDressUp(change('yuna', 'floral-fallal', 'floral-fallal'))).toBeNull();
    setPortraitMode('turns');
    expect(beat([], { state: () => ffx2State() }).decideDressUp(change('yuna', 'floral-fallal', 'floral-fallal'))).toBeNull();
  });

  it('an FFX menu is never a reason to hold it back (that rule is FFX-2\'s)', () => {
    expect(beat([], { menuOpen: () => true }).decide(od('tidus'))).not.toBeNull();
  });
});

describe("the slab sets a long move's name to fit", () => {
  it('up to 9 characters at full size, then in proportion, never under half (the first guess; the measured width then decides in a real browser)', () => {
    expect(titleFit('Swordplay')).toBe(1);
    expect(titleFit('Slice & Dice')).toBeCloseTo(9 / 12, 5);
    expect(titleFit('Magus Sisters Delta Attack')).toBe(0.5); // 9 / 26 is under half: clamped
  });
});

// ----------------------------------------------------------------------------------------------- the real presenter

class Staging implements StagingPort {
  readonly openings: OpeningCue[] = [];
  breath(): void {}
  ending(): void {}
  opening(c: OpeningCue): void {
    this.openings.push(c);
  }
  clear(): void {}
}

function rig(game: 'ffx' | 'ffx2', opts: { staging?: Staging } = {}) {
  const ffx2 = game === 'ffx2';
  const stage = new FakeStage(ffx2 ? ['yuna', 'rikku', 'paine', 'full-throttle-main'] : ['tidus', 'yuna', 'kimahri'], ffx2 ? ['bahamut'] : ['seymour-flux']);
  const log: string[] = [];
  const cutIns: Req[] = [];
  const slabs: Array<{ title: string; subtitle?: string | undefined }> = [];
  const moments: MomentsPort = {
    letterbox: async (on) => {
      log.push(`letterbox:${on}`);
    },
    nameSlab: async (o) => {
      slabs.push({ title: o.title, subtitle: o.subtitle });
      log.push(`nameSlab:${o.title}`);
    },
    vignette: () => {},
    clear: () => {},
    turnCutIn: async (req) => {
      cutIns.push(req);
      log.push(`cutIn:${req.move?.title ?? 'turn'}`);
    },
  };
  const splashes: Array<{ name: string; splash?: boolean | undefined }> = [];
  (stage as unknown as { fx: unknown }).fx = {
    enabled: () => true,
    actionOpen: async (o: { name: string; splash?: boolean }) => {
      splashes.push({ name: o.name, splash: o.splash });
      log.push(`splash:${o.splash === false ? 'off' : 'on'}`);
    },
    hit: () => ({ freezeMs: 0, shook: false }),
  };
  const presenter = new BattlePresenter({
    stage,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    moments,
    sleep: () => Promise.resolve(),
    ...(opts.staging ? { staging: opts.staging } : {}),
    ...(ffx2 ? { game: 'ffx2' as const, victoryPose: 'hold' as const } : {}),
  });
  (presenter as unknown as { liveState: BattleState }).liveState = ffx2 ? ffx2State() : ffxState();
  const play = (events: Array<Seq<BattleEvent>>): Promise<unknown> => presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { stage, log, cutIns, slabs, splashes, play };
}

const odEvents = (actor: string, targets: string[]): Array<Seq<BattleEvent>> => [
  { type: 'action-start', actorId: actor, command: { kind: 'overdrive', id: 'swordplay', targets } as never, abilityId: 'swordplay', abilityName: 'Swordplay', targets },
  { type: 'action-end', actorId: actor },
];

describe('through the real presenter', () => {
  it("an FFX Overdrive: the portrait names the move; the name slab and the splash stand aside; the letterbox still frames it", async () => {
    const r = rig('ffx');
    await r.play(odEvents('tidus', ['seymour-flux']));
    expect(r.cutIns).toHaveLength(1);
    expect(r.cutIns[0]).toMatchObject({ actorId: 'tidus', game: 'ffx', label: 'TIDUS · OVERDRIVE', quick: false, move: { title: 'Swordplay', tag: 'TIDUS · OVERDRIVE' } });
    expect(r.slabs).toEqual([]); // the portrait names the move once
    expect(r.splashes).toEqual([{ name: 'Swordplay', splash: false }]); // the port still hears of the move, with no splash
    expect(r.log).toContain('letterbox:true'); // the bars still frame it (the portrait starts with the action, over them as they slide in) ...
    expect(r.log.indexOf('cutIn:Swordplay')).toBeLessThan(r.log.indexOf('letterbox:false')); // ... and come down only after it
    expect(r.log).toContain('letterbox:false');
  });

  it('the second Overdrive of the same member is the quick flash', async () => {
    const r = rig('ffx');
    await r.play(odEvents('tidus', ['seymour-flux']));
    await r.play(odEvents('tidus', ['seymour-flux']));
    expect(r.cutIns.map((c) => c.quick)).toEqual([false, true]);
  });

  it('with ?portraits=turns the Overdrive is exactly as it was: its name slab and its splash, no portrait', async () => {
    setPortraitMode('turns');
    const r = rig('ffx');
    await r.play(odEvents('tidus', ['seymour-flux']));
    expect(r.cutIns).toEqual([]);
    expect(r.slabs).toEqual([{ title: 'Swordplay', subtitle: 'OVERDRIVE' }]);
    expect(r.splashes).toEqual([{ name: 'Swordplay', splash: undefined }]);
  });

  it('the pro staging\'s opening plays on with its small name standing aside while the portrait names the move', async () => {
    setStagingMode('pro');
    setDemoChapter('seymour-flux');
    const staging = new Staging();
    const r = rig('ffx', { staging });
    await r.play(odEvents('tidus', ['seymour-flux']));
    expect(r.cutIns).toHaveLength(1);
    expect(staging.openings).toHaveLength(1);
    expect(staging.openings[0]).toMatchObject({ kind: 'overdrive', actor: 'tidus', name: 'Swordplay', named: false });
    expect(r.slabs).toEqual([]);
    expect(r.splashes).toEqual([]); // the staged opening already took the splash's place
  });

  it("the staged opening keeps its name when no portrait plays (?portraits=turns, off)", async () => {
    setStagingMode('pro');
    setDemoChapter('seymour-flux');
    setPortraitMode('off');
    const staging = new Staging();
    const r = rig('ffx', { staging });
    await r.play(odEvents('tidus', ['seymour-flux']));
    expect(staging.openings[0]).toMatchObject({ kind: 'overdrive', name: 'Swordplay' });
    expect(staging.openings[0]).not.toHaveProperty('named');
    expect(r.cutIns).toEqual([]);
  });

  it('an ordinary attack, a spell and a fiend\'s move bring no portrait', async () => {
    const r = rig('ffx');
    await r.play([
      { type: 'action-start', actorId: 'tidus', command: { kind: 'attack', targets: ['seymour-flux'] } as never, targets: ['seymour-flux'] },
      { type: 'action-end', actorId: 'tidus' },
      { type: 'action-start', actorId: 'yuna', command: { kind: 'ability', id: 'cure', targets: ['tidus'] } as never, abilityId: 'cure', abilityName: 'Cure', targets: ['tidus'] },
      { type: 'action-end', actorId: 'yuna' },
      { type: 'action-start', actorId: 'seymour-flux', command: { kind: 'ability', id: 'lance', targets: ['tidus'] } as never, abilityId: 'lance', abilityName: 'Lance of Atrophy', targets: ['tidus'] },
      { type: 'action-end', actorId: 'seymour-flux' },
    ]);
    expect(r.cutIns).toEqual([]);
  });

  it("FFX-2: Paine's Sword Dance (her special dressphere's finisher) shows her portrait, not the part's, with no name slab and no splash", async () => {
    setPaceGame('ffx2');
    const r = rig('ffx2');
    await r.play([
      { type: 'action-start', actorId: 'full-throttle-main', command: { kind: 'ability', id: 'x2-full-throttle-sword-dance', targets: ['bahamut'] } as never, abilityId: 'x2-full-throttle-sword-dance', abilityName: 'Sword Dance', targets: ['bahamut'] },
      { type: 'action-end', actorId: 'full-throttle-main' },
    ]);
    expect(r.cutIns).toHaveLength(1);
    expect(r.cutIns[0]).toMatchObject({ actorId: 'paine', game: 'ffx2', label: 'PAINE · SPECIAL', move: { title: 'Sword Dance', tag: 'PAINE · SPECIAL' } });
    expect(r.slabs).toEqual([]);
  });

  it("FFX-2: the engine's spherechange event for a special dress shows the girl's portrait and the dress's name; an ordinary change shows none", async () => {
    setPaceGame('ffx2');
    const r = rig('ffx2');
    const change = (to: string, special?: string): Seq<BattleEvent> =>
      ({ type: 'spherechange', who: 'yuna', from: 'white-mage', to, gatesCrossed: [], ...(special ? { special } : {}) }) as never;
    await r.play([change('gunner'), change('floral-fallal', 'floral-fallal')]);
    expect(r.cutIns).toHaveLength(1);
    expect(r.cutIns[0]).toMatchObject({ actorId: 'yuna', game: 'ffx2', label: 'YUNA · SPECIAL DRESS UP', quick: false, move: { title: 'Floral Fallal', tag: 'YUNA · SPECIAL DRESS UP' } });
  });

  it("FFX-2: a girl's ordinary Attack and a Mega Flare from Bahamut bring no portrait", async () => {
    setPaceGame('ffx2');
    const r = rig('ffx2');
    await r.play([
      { type: 'action-start', actorId: 'yuna', command: { kind: 'attack', targets: ['bahamut'] } as never, targets: ['bahamut'] },
      { type: 'action-end', actorId: 'yuna' },
      { type: 'action-start', actorId: 'bahamut', command: { kind: 'ability', id: 'mega-flare', targets: ['yuna'] } as never, abilityId: 'mega-flare', abilityName: 'Mega Flare', targets: ['yuna'] },
      { type: 'action-end', actorId: 'bahamut' },
    ]);
    expect(r.cutIns).toEqual([]);
  });
});
