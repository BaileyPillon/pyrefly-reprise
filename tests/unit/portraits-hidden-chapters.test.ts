/**
 * The big-move portrait rule (`engine/BigMoves.ts`, `BigMoveCutIn.ts`; Bailey, 2026-11-07: "A: only on big moves") checked against the hidden chapters 33 to 43 on the r77 integration branch, with the REAL engine and the REAL presenter
 * (FakeStage and a recording moments port; nothing else is faked). What is real and what is injected is said at each test.
 *
 * - **FFX, the Omega Ruins (chapter 43), real engine events:** the endgame party plays the Ultima Weapon fight under a player that spends every Overdrive and calls Yuna's aeon the moment it is offered (a measurement rig: the foe
 *   and the front line cannot fall, the gauges are full). Every party Overdrive, every summon and the aeon's own Overdrive shows the portrait named for the move; nothing else does (not a turn, not a spell, not a swing). A fiend of the
 *   chapter playing an Overdrive or a summon (an INJECTED action-start on the chapter's own Weapon, by its own id: its real script plays none) shows none.
 * - **FFX-2, the Youth League Tournament (chapter 42):** a whole real fight (turns, attacks, spells, an ordinary dress change, the League's fiends) shows no portrait. The Special Dress Up is INJECTED, as the engine's own `spherechange`
 *   event with `special`: the real engine cannot make one today (the Spherechange wheel is wired nowhere in a battle, the engine builds no parts for a Special, and it refuses the wheel's own command on a registered grid with "Not linked":
 *   `docs/handoff/r77-integration.md`, third pass). A fiend playing a girl's finisher (a Sword Dance from a League fighter) shows none; the girl's own part playing it shows hers.
 * - **Yuna's Ballad (chapter 40), FFX-2:** the possessed Rikku and Paine are fiends: a Vajra or a Sword Dance in their hands shows no portrait, though the ability's owner is Rikku or Paine (the side decides, not the name).
 *
 * Game case: FFX and FFX-2, each its own list (rule 14); the plumbing is shared. A hidden chapter is a chapter like any other to the rule: the lists name moves, not chapters.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, BattleEvent, BattleState, Command } from '../../src/battle/common/types.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { MomentsPort } from '../../src/engine/BattlePresenterPorts.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { setPortraitMode } from '../../src/engine/CutInMode.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';
import { TurnCutInBeat } from '../../src/engine/TurnCutIn.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage, noSleep } from './helpers/FakeStage.ts';
import * as ruins from './helpers/omegaRuinsDrive.ts';
import { openAct, foesOf, fightersOf } from './helpers/youthLeagueDrive.ts';
import { openDuel, bossOf } from './helpers/yunasBalladDrive.ts';
import { EXPERIMENT_CHAPTERS } from '../../src/data/encounters.ts';

type Req = Parameters<NonNullable<MomentsPort['turnCutIn']>>[0];
type Seq<T> = T extends unknown ? Omit<T, 'seq'> : never;

beforeEach(() => {
  setPace('steady');
});
afterEach(() => {
  setPortraitMode(null);
  setPaceGame('other');
});

/** The real presenter on the real engine's party and fiends, with a moments port that records every portrait slab. */
function present(game: 'ffx' | 'ffx2', engine: BattleEngine) {
  const state = engine.state();
  const stage = new FakeStage(
    state.activeIds.filter((id) => state.combatants[id]?.side !== 'enemy'),
    [...state.enemyIds],
  );
  const cutIns: Req[] = [];
  const slabs: string[] = [];
  const moments: MomentsPort = {
    letterbox: async () => {},
    nameSlab: async (o) => {
      slabs.push(o.title);
    },
    vignette: () => {},
    clear: () => {},
    turnCutIn: async (req) => {
      cutIns.push(req);
    },
  };
  const presenter = new BattlePresenter({
    stage,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    moments,
    sleep: noSleep,
    ...(game === 'ffx2' ? { game: 'ffx2' as const, victoryPose: 'hold' as const } : {}),
  });
  (presenter as unknown as { liveState: BattleState }).liveState = state;
  const play = (events: Array<Seq<BattleEvent>>): Promise<unknown> => presenter.play(events.map((e, i) => ({ ...e, seq: 1000 + i }) as BattleEvent));
  return { presenter, stage, cutIns, slabs, play };
}

const starts = (engine: BattleEngine): Array<Extract<BattleEvent, { type: 'action-start' }>> =>
  (engine.state().log as readonly BattleEvent[]).filter((e): e is Extract<BattleEvent, { type: 'action-start' }> => e.type === 'action-start');

// ----------------------------------------------------------------------------------------------- FFX, chapter 43

/** Tidus's Overdrive twice, Yuna's aeon the first time she can call one, the aeon's own Overdrive; then the run is over. A measurement rig: the foe and the front line cannot fall, the gauges are full. */
function runRuins(): { engine: BattleEngine; r: ReturnType<typeof present> } {
  const engine = ruins.newEngine(7);
  const foe = ruins.foeOf(engine);
  foe.stats.maxHp = 9_999_999;
  foe.hp = foe.stats.maxHp;
  const r = present('ffx', engine);
  const full = (): void => {
    for (const c of Object.values(engine.state().combatants)) if (c.side !== 'enemy' && 'overdrive' in c && c.overdrive) (c as { overdrive: { gauge: number } }).overdrive.gauge = 100;
  };
  full(); // the gauges are full from the first menu, and refilled at every pick so the next turn of the same member has its Overdrive again
  r.presenter.setAutoPlay((actorId, commands, e) => {
    ruins.invincible(e);
    full();
    const mine = starts(e);
    const aeonOds = mine.filter((s) => s.command.kind === 'overdrive' && e.state().combatants[s.actorId]?.side === 'aeon').length;
    if (aeonOds >= 2 && mine.some((s) => s.actorId === 'tidus' && s.command.kind === 'overdrive') && mine.some((s) => s.command.kind === 'summon')) {
      r.presenter.abort(); // every kind has been played, the aeon's twice: the run is over (and the pick that follows is a Defend, which is no big move)
      return { kind: 'defend', targets: [] };
    }
    const row = (kind: string): AvailableCommand | undefined => commands.find((c) => c.enabled && c.command.kind === kind && c.label !== 'Grand Summon');
    const pick = (c: AvailableCommand | undefined): Command | null => (c ? ({ ...c.command, targets: c.command.kind === 'summon' ? [] : [foe.id] } as Command) : null);
    return (actorId === 'yuna' ? pick(row('summon')) : null) ?? pick(row('overdrive')) ?? intendedStrategy(actorId, commands, e);
  });
  return { engine, r };
}

describe('FFX, the Omega Ruins (chapter 43): the endgame party through the real engine and the real presenter', () => {
  it('every party Overdrive, summon and aeon Overdrive shows the portrait named for the move; nothing else does, and a fiend never does', async () => {
    setPaceGame('ffx');
    const { engine, r } = runRuins();
    const outcome = await r.presenter.run(engine);
    expect(outcome.kind).toBe('aborted'); // the strategy ends the run once every kind of big move has been played

    const state = engine.state();
    const big = starts(engine).filter((s) => ['overdrive', 'summon'].includes(s.command.kind));
    const partyBig = big.filter((s) => state.combatants[s.actorId]?.side !== 'enemy');
    expect(partyBig.filter((s) => s.command.kind === 'overdrive' && s.actorId === 'tidus').length, 'Tidus played his Overdrive').toBeGreaterThanOrEqual(1);
    expect(partyBig.some((s) => s.command.kind === 'summon'), 'a summon was played').toBe(true);
    expect(partyBig.some((s) => state.combatants[s.actorId]?.side === 'aeon'), 'an aeon played its own Overdrive').toBe(true);

    // one slab per party big move, in order, each of them a move's slab (never a turn's)
    expect(r.cutIns).toHaveLength(partyBig.length);
    expect(r.cutIns.every((c) => c.move !== undefined && c.game === 'ffx' && c.side === 'left')).toBe(true);
    partyBig.forEach((s, i) => {
      const who = state.combatants[s.actorId]!.name.toUpperCase();
      expect(r.cutIns[i]!.actorId, `slab ${i}`).toBe(s.actorId);
      expect(r.cutIns[i]!.label, `slab ${i}`).toBe(`${who} · ${s.command.kind === 'summon' ? 'SUMMON' : 'OVERDRIVE'}`);
    });
    // a summon names the aeon (over the summoner's portrait); an aeon's own Overdrive is the aeon's portrait
    const summon = partyBig.findIndex((s) => s.command.kind === 'summon');
    expect(r.cutIns[summon]!.actorId).toBe('yuna');
    expect(r.cutIns[summon]!.move!.title).toBe(state.combatants[(partyBig[summon]!.command as { id: string }).id]!.name);
    expect(r.cutIns.some((c) => state.combatants[c.actorId]?.side === 'aeon'), 'an aeon showed its own portrait').toBe(true);

    // the first slam of a member is full, the rest are flashes
    const seen = new Set<string>();
    for (const c of r.cutIns) {
      expect(c.quick, `${c.actorId} (${c.label})`).toBe(seen.has(c.actorId));
      seen.add(c.actorId);
    }
    // nobody on the fiend's side ever showed one
    for (const c of r.cutIns) expect(state.combatants[c.actorId]?.side, c.actorId).not.toBe('enemy');
    // the Overdrive's own name slab stood aside for the portrait (one moment, not stacked)
    expect(r.slabs.filter((t) => partyBig.some((s) => s.abilityName === t))).toEqual([]);
  });

  it('a fiend of the chapter using an Overdrive, a summon or a girl-owned finisher shows no portrait (the side decides)', async () => {
    setPaceGame('ffx');
    const engine = ruins.newEngine(7);
    const r = present('ffx', engine);
    const foe = engine.state().enemyIds[0]!;
    const party = engine.state().activeIds[0]!;
    await r.play([
      { type: 'action-start', actorId: foe, command: { kind: 'overdrive', id: 'x', targets: [party] } as never, abilityId: 'x', abilityName: 'Chapter Fiend Overdrive', targets: [party] },
      { type: 'action-end', actorId: foe },
      { type: 'action-start', actorId: foe, command: { kind: 'summon', id: 'valefor', targets: [] } as never, abilityName: 'Summon', targets: [] },
      { type: 'action-end', actorId: foe },
    ]);
    expect(r.cutIns).toEqual([]);
  });

  it('a turn start in the chapter shows no portrait by default, and the old turn slab is only under ?portraits=turns', async () => {
    setPaceGame('ffx');
    const engine = ruins.newEngine(7);
    const calls: Req[] = [];
    const moments: MomentsPort = { letterbox: async () => {}, nameSlab: async () => {}, vignette: () => {}, clear: () => {}, turnCutIn: async (q) => void calls.push(q) };
    const beat = new TurnCutInBeat({ moments, speed: () => 'normal' });
    for (const id of engine.state().activeIds) await beat.play(engine.state(), id);
    expect(calls).toEqual([]);
    setPortraitMode('turns');
    await new TurnCutInBeat({ moments, speed: () => 'normal' }).play(engine.state(), 'tidus');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.move).toBeUndefined();
  });
});

// ----------------------------------------------------------------------------------------------- FFX-2, chapters 42 and 40

describe('FFX-2, the Youth League Tournament (chapter 42): the girls through the real engine and the real presenter', () => {
  it("the real fight (turns, attacks, spells, an ordinary dress change, the League's fiends) shows no portrait; a Special Dress Up, as the engine reports it, shows the girl's", async () => {
    setPaceGame('ffx2');
    const engine = openAct(0, 3, { immortal: true });
    const r = present('ffx2', engine);
    let yunaTurns = 0;
    r.presenter.setAutoPlay((actorId, commands, e) => {
      if (actorId === 'yuna' && ++yunaTurns === 2) {
        const plain = commands.find((c) => c.enabled && c.command.kind === 'spherechange');
        if (plain) return plain.command; // an ordinary dress change, which the portrait rule leaves alone
      }
      return intendedStrategy(actorId, commands, e);
    });
    const outcome = await r.presenter.run(engine);
    expect(outcome.kind).toBe('victory');
    const log = engine.state().log as readonly BattleEvent[];
    const changes = log.filter((e): e is Extract<BattleEvent, { type: 'spherechange' }> => e.type === 'spherechange');
    expect(changes.some((c) => c.who === 'yuna' && c.special === undefined), 'Yuna made an ordinary change').toBe(true);
    expect(starts(engine).some((s) => engine.state().combatants[s.actorId]?.side === 'enemy'), 'the League acted').toBe(true);
    expect(starts(engine).some((s) => s.command.kind === 'attack' || s.command.kind === 'ability'), 'the girls acted').toBe(true);
    expect(r.cutIns, 'a whole fight, no portrait').toEqual([]);

    // Special Dress Up: the engine's own event for it carries `special`; each girl's slab names her dressphere, the first in full and a repeat as a flash
    const dress: Record<string, string> = { yuna: 'floral-fallal', rikku: 'machina-maw', paine: 'full-throttle' };
    const change = (who: string): Seq<BattleEvent> => ({ type: 'spherechange', who, from: 'gunner', to: dress[who]!, gatesCrossed: [], special: dress[who] }) as never;
    await r.play([change('yuna'), change('rikku'), change('paine'), change('yuna')]);
    expect(r.cutIns.map((c) => c.label)).toEqual(['YUNA · SPECIAL DRESS UP', 'RIKKU · SPECIAL DRESS UP', 'PAINE · SPECIAL DRESS UP', 'YUNA · SPECIAL DRESS UP']);
    expect(r.cutIns.map((c) => c.move?.title)).toEqual(['Floral Fallal', 'Machina Maw', 'Full Throttle', 'Floral Fallal']);
    expect(r.cutIns.map((c) => c.quick)).toEqual([false, false, false, true]);
    expect(r.cutIns.every((c) => c.game === 'ffx2' && c.side === 'left')).toBe(true);
  });


  it('a fiend of the chapter playing a girl\'s finisher shows no portrait, and the girls\' own finishers show theirs', async () => {
    setPaceGame('ffx2');
    const engine = openAct(0, 3);
    const r = present('ffx2', engine);
    const foe = fightersOf(0)[0]!;
    expect(foesOf(engine).map((f) => f.id)).toContain(foe);
    const finisher = (actorId: string, id: string, name: string): Array<Seq<BattleEvent>> => [
      { type: 'action-start', actorId, command: { kind: 'ability', id, targets: ['yuna'] } as never, abilityId: id, abilityName: name, targets: ['yuna'] },
      { type: 'action-end', actorId },
    ];
    await r.play([...finisher(foe, 'x2-full-throttle-sword-dance', 'Sword Dance'), ...finisher(foe, 'x2-machina-maw-vajra', 'Vajra'), ...finisher(foe, 'x2-floral-fallal-great-whirl', 'Great Whirl')]);
    expect(r.cutIns).toEqual([]);
    // the same move from a girl's part (the part is staged as her party member) shows hers
    r.stage.addCombatant('full-throttle-main', { artId: 'paine', side: 'party', slot: 0 });
    (engine.state().combatants as Record<string, unknown>)['full-throttle-main'] = { id: 'full-throttle-main', name: 'Full Throttle', side: 'party' };
    await r.play(finisher('full-throttle-main', 'x2-full-throttle-sword-dance', 'Sword Dance'));
    expect(r.cutIns).toHaveLength(1);
    expect(r.cutIns[0]).toMatchObject({ actorId: 'paine', label: 'PAINE · SPECIAL', game: 'ffx2', move: { title: 'Sword Dance' } });
  });
});

describe("FFX-2, Yuna's Ballad (chapter 40): the possessed Rikku and Paine are fiends", () => {
  it.each([0, 1] as const)('duel %i: the fiend playing the finisher its name owns shows no portrait, though the ability is Rikku\'s or Paine\'s', async (duel) => {
    setPaceGame('ffx2');
    const engine = openDuel(duel, 2);
    const r = present('ffx2', engine);
    const boss = bossOf(duel);
    expect(engine.state().combatants[boss]?.side).toBe('enemy');
    const fin = (id: string, name: string): Array<Seq<BattleEvent>> => [
      { type: 'action-start', actorId: boss, command: { kind: 'ability', id, targets: ['yuna'] } as never, abilityId: id, abilityName: name, targets: ['yuna'] },
      { type: 'action-end', actorId: boss },
    ];
    await r.play([...fin('x2-machina-maw-vajra', 'Vajra'), ...fin('x2-full-throttle-sword-dance', 'Sword Dance')]);
    expect(r.cutIns).toEqual([]);
    // and the change into a special dressphere reported for the fiend's own id is a fiend's too
    await r.play([{ type: 'spherechange', who: boss, from: 'gunner', to: 'machina-maw', gatesCrossed: [], special: 'machina-maw' } as never]);
    expect(r.cutIns).toEqual([]);
  });
});

// ----------------------------------------------------------------------------------------------- every new hidden chapter (33 to 43)

describe('the eleven new hidden chapters (33 to 43): who can ever be named on a slab', () => {
  const NEW = EXPERIMENT_CHAPTERS.filter((c) => c.number >= 33 && c.number <= 43);
  const FFX_CAST = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'];
  const FFX2_CAST = ['yuna', 'rikku', 'paine'];

  it('the set is the eleven the program plan numbers, each in the game its record says', () => {
    expect(NEW.map((c) => [c.number, c.game] as const).sort((a, b) => a[0] - b[0])).toEqual(
      [[33, 'ffx2'], [34, 'ffx'], [35, 'ffx'], [36, 'ffx'], [37, 'ffx2'], [38, 'ffx2'], [39, 'ffx'], [40, 'ffx2'], [41, 'ffx'], [42, 'ffx2'], [43, 'ffx']],
    );
  });

  const AEONS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'cindy', 'sandy', 'mindy'];

  it.each(NEW.map((c) => [c.number, c.id] as const))("chapter %i (%s): the party is the game's own cast, and no fiend of the chapter bears a cast member's or an aeon's id", (_n, id) => {
    const chapter = NEW.find((c) => c.id === id)!;
    const cast = chapter.game === 'ffx' ? FFX_CAST : FFX2_CAST;
    expect(chapter.buildRef.game).toBe(chapter.game);
    for (const m of (chapter.buildRef as { members: Array<{ id: string }> }).members) expect(cast, `${id}: ${m.id}`).toContain(m.id);
    // the portrait is looked up by the actor's id, and the side decides who may have one: a fiend that wore a cast member's id would be a fiend with her portrait
    const group = chapter.enemyGroupRef;
    for (const e of [...group.enemies, ...(group.parts ?? [])]) expect([...FFX_CAST, ...FFX2_CAST, ...AEONS], `${id}: ${e.id}`).not.toContain(e.id);
  });
});
