/**
 * THE TWO LANES OF BATCH 2, EACH HOLDING FOR THE OTHER'S CHAPTERS (release 70, the merge `booth-b2` of `booth-ffx2-b2` and `booth-ffx-yunalesca`; both games, shared plumbing; tests only).
 *
 * Each lane changed a piece of shared plumbing and proved it only against its own game's chapters. After the merge each must hold for the other's:
 *
 *  1. the FFX lane's `stageFreeze` guard (a `ko` followed by the SAME foe's `form-change` in the burst is not the last blow) against every FFX-2 chapter with links and parts: the FFX-2 engine emits no `form-change` in any of
 *     them (so the guard can never fire there), and the killing blow of the last link still freezes exactly once, after the last link has begun and before the one title;
 *  2. the FFX-2 lane's `SCRIPTED_RIGS` follower stand-down against the FFX chapters: no FFX chapter is named in the table, none of their scripts cuts to a rig it names, and the real follower on Chapter I's frame moves the same
 *     with the optional `scripted` host answering as the table answers for it as it does with no such host (the code path before the lane);
 *  3. the FFX lane's `booth-hold-guard` (a treated chapter that is also a swap-scope exception holds `smear`) across all seven treated chapters, and the converse: a treated chapter that is NOT an exception plays the smear's rules.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import type { BattleEngine, BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import { TREATED_CHAPTERS, setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { setStagingMode } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { emptyEnd } from '../../src/engine/pro/staging/EndingPlan.ts';
import type { BreathCue, EndingCue, OpeningCue, StagingPort } from '../../src/engine/pro/staging/StagingPort.ts';
import { SCOPE_EXCEPTIONS, scopeExcepted, setSwapScope, swapsInScope } from '../../src/engine/motion/SwapSwitch.ts';
import { setSmearStyle, smearOn } from '../../src/engine/motion/SmearSwitch.ts';
import { setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { SCRIPTED_RIGS, autoCameraFor, scriptedShot } from '../../src/engine/procam/ProAutoStage.ts';
import { ProFollower, type Member } from '../../src/engine/procam/ProFollower.ts';
import type { Pose } from '../../src/engine/procam/ProTypes.ts';
import { FakeAudio, FakeStage } from './helpers/FakeStage.ts';
import { setCappedAutoPlay } from './helpers/presenterCap.ts';
import { findWeakGroup, weakChapter } from './helpers/weakChain.ts';

const FFX_TREATED = Object.keys(TREATED_CHAPTERS).filter((id) => TREATED_CHAPTERS[id]!.game === 'ffx');
const FFX2_TREATED = Object.keys(TREATED_CHAPTERS).filter((id) => TREATED_CHAPTERS[id]!.game === 'ffx2');

afterEach(() => {
  setTreatedScope(null);
  setStagingMode(null);
  setDemoChapter(undefined);
  setSmearStyle(null);
  setCurvesMode(null);
  setSwapScope(null);
});

// ------------------------------------------------------------------------------------------------ 1. stageFreeze vs the FFX-2 chains

/** A staging port that records the cues in order (the shape of the lanes' own recording ports). */
class LogPort implements StagingPort {
  readonly log: string[] = [];
  marks = emptyEnd();
  breath(_cue: BreathCue): void {
    this.log.push('breath');
  }
  opening(_cue: OpeningCue): void {
    this.log.push('opening');
  }
  ending(cue: EndingCue): void {
    this.log.push(`ending:${cue.kind}`);
  }
  clear(): void {
    this.log.push('clear');
  }
  hud(): number {
    return 1;
  }
}

/** The FFX-2 chapters with links and parts: Leblanc (Acts), Chapter V (five links of parts), Chapter XV (three shades), Chapter XI (three links), Chapter XIII (Paragon, then Trema); Chapter IV, the booth's, is one link of one foe. */
const CHAINS = [
  { id: 'ffx2-bahamut', links: 1 },
  { id: 'ffx2-leblanc', links: 3 },
  { id: 'ffx2-vegnagun-shuyin', links: 5 },
  { id: 'ffx2-den-of-woe', links: 3 },
  { id: 'ffx2-fallen-aeons', links: 3 },
  { id: 'ffx2-trema', links: 2, weak: true }, // batch 3: Paragon, then Trema (two links; the FFX-2 engine has no form change in either). Its real fight is half an hour of Dark Knights (999,999 HP), so the chain runs with every foe at 1 HP (`helpers/weakChain.ts`)
] as const;

describe("the FFX lane's stageFreeze guard, in the FFX-2 chapters with links and parts", () => {
  beforeEach(() => {
    setTreatedScope('all');
    setStagingMode('pro');
  });

  it.each(CHAINS)('$id: the real chain emits no form-change, and the last blow of the last link freezes once, between the last link start and the one title', async (row) => {
    const { id, links } = row;
    const weak = 'weak' in row;
    setDemoChapter(id);
    const real = getChapter(id)!;
    const chapter = weak ? weakChapter(real) : real;
    expect(chapter.game).toBe('ffx2');
    const setup = setupForChapter(chapter, 1);
    await registerBattleContent();
    const engine: BattleEngine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
    engine.setSeed(setup.seed);
    engine.init(setup);
    const port = new LogPort();
    const stage = new FakeStage(setup.party.members.map((m) => m.id), chapter.enemyGroupRef.enemies.map((e) => e.id));
    const presenter = new BattlePresenter({ stage, audio: new FakeAudio(), sleep: () => Promise.resolve(), staging: port });
    presenter.setSpeed('normal');
    setCappedAutoPlay(presenter, intendedStrategy);
    // every event the engines hand the presenter, read at the one door it takes them through
    const seen: BattleEvent[] = [];
    const play = presenter.play.bind(presenter);
    presenter.play = (events: readonly BattleEvent[], ...rest: unknown[]) => {
      seen.push(...events);
      return (play as (e: readonly BattleEvent[], ...r: unknown[]) => ReturnType<typeof play>)(events, ...rest);
    };
    // each link's foes stand on the field the way the real stage stands them (a stub that stages nothing would leave every later link's killing blow with no figure to freeze on)
    const restage = async (state: BattleState): Promise<void> => {
      for (const known of [...stage.actors.keys()]) stage.removeCombatant(known);
      for (const [slot, pid] of state.activeIds.entries()) await stage.addCombatant(pid, { artId: pid, side: 'party', slot });
      for (const [slot, eid] of state.enemyIds.entries()) await stage.addCombatant(eid, { artId: eid, side: 'enemy', slot });
    };
    const result = await runEncounterChain({
      chapter, presenter, engine, stage: { stage: restage }, group: chapter.enemyGroupRef, setup, seed: 1, findGroup: weak ? findWeakGroup : findEnemyGroup, audio: new FakeAudio(),
      onLink: ({ links: n }) => port.log.push(`link:${n}`),
    });
    expect(result.links).toBe(links);
    expect(result.outcome.kind).toBe('victory');
    // the guard reads `form-change`; the FFX-2 engine has none to emit in any of these chapters, so the guard can never fire here
    expect(seen.filter((e) => e.type === 'form-change'), `${id}: form-change events`).toEqual([]);
    expect(seen.filter((e) => e.type === 'ko').length, `${id}: the fight really knocked foes out`).toBeGreaterThan(0);
    // and the freeze is still there: once, after the last link began, before the one title
    const at = (s: string): number => port.log.indexOf(s);
    expect(port.log.filter((e) => e === 'ending:freeze'), `${id}: freezes in ${port.log.join(',')}`).toHaveLength(1);
    expect(at('ending:freeze')).toBeGreaterThan(at(`link:${links}`));
    expect(at('ending:freeze')).toBeLessThan(at('ending:title'));
    expect(port.log.filter((e) => e === 'ending:title')).toHaveLength(1);
  }, 180_000);

  it('the chains above cover every treated FFX-2 chapter (a chapter that joins the list is added to CHAINS or this fails)', () => {
    expect(CHAINS.map((c) => c.id).sort()).toEqual([...FFX2_TREATED].sort());
  });
});

// ------------------------------------------------------------------------------------------------ 2. SCRIPTED_RIGS vs the FFX chapters

/** Every `{ type: 'camera', rig }` step anywhere inside a chapter's scripts (the pre and post scripts, the mid-battle ones). */
function cameraCuts(node: unknown, into: Set<string> = new Set()): Set<string> {
  if (Array.isArray(node)) for (const n of node) cameraCuts(n, into);
  else if (node !== null && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (o['type'] === 'camera' && typeof o['rig'] === 'string') into.add(o['rig']);
    for (const v of Object.values(o)) cameraCuts(v, into);
  }
  return into;
}

describe("the FFX-2 lane's SCRIPTED_RIGS, against the FFX chapters", () => {
  it('names FFX-2 chapters only (rule 14: the Road of Chapter XI is the one scene that draws a plate by the camera position)', () => {
    for (const id of Object.keys(SCRIPTED_RIGS)) expect(TREATED_CHAPTERS[id]?.game, id).toBe('ffx2');
  });

  it.each(FFX_TREATED)('%s: none of its scripts cuts to a rig the table names for any chapter, and the stand-down answers false for every rig it cuts to', (id) => {
    const rigs = cameraCuts(getChapter(id)!.scriptsRef);
    expect(rigs.size, `${id} cuts to some rig`).toBeGreaterThan(0);
    const named = new Set(Object.values(SCRIPTED_RIGS).flat());
    for (const rig of rigs) {
      expect(named.has(rig), `${id} cuts to ${rig}`).toBe(false);
      expect(scriptedShot(id, rig), `${id} ${rig}`).toBe(false);
    }
    for (const rig of named) expect(scriptedShot(id, rig), `${id} on a rig another chapter's script cuts to`).toBe(false); // the table is keyed by chapter
  });

  it('the converse: the one chapter the table names does cut to the rig it names', () => {
    for (const [id, names] of Object.entries(SCRIPTED_RIGS)) {
      const rigs = cameraCuts(getChapter(id)!.scriptsRef);
      for (const n of names) expect(rigs.has(n), `${id} cuts to ${n}`).toBe(true);
    }
  });

  it("the real follower on Chapter I's frame moves exactly as it did before the lane when the host answers `scripted` the way the table answers for an FFX chapter", () => {
    type V3 = [number, number, number];
    const members: Member[] = [
      { id: 'tidus', feet: [-2.2, 0, 1.2] as V3, height: 1.82 },
      { id: 'yuna', feet: [-1.3, 0, 0.1] as V3, height: 1.7 },
      { id: 'auron', feet: [-0.4, 0, -1.2] as V3, height: 1.9 },
      { id: 'seymour', feet: [2.0, 0, -4.2] as V3, height: 3.2 },
    ];
    const base: Pose = { pos: [0.2, 2.4, 9.4], look: [-1.0, 2.0, -1.2], fov: 32, roll: 0 };
    const rigAt = (i: number): string => (i % 240 < 120 ? 'idle' : 'action'); // the rigs Chapter I's scripts cut between
    const run = (scripted: boolean): number[][] => {
      let i = 0;
      const host = {
        members: () => members,
        held: () => i % 300 > 250, // a command menu opens now and then
        still: () => false,
        fitK: () => 1,
        ...(scripted ? { scripted: () => scriptedShot('seymour-flux', rigAt(i)) } : {}),
      };
      const f = new ProFollower(host, autoCameraFor('seymour-flux'));
      const out: number[][] = [];
      for (; i < 60 * 12; i++) {
        const p = f.step(1 / 60, base);
        out.push([...p.pos, ...p.look, p.fov]);
      }
      return out;
    };
    expect(run(true)).toEqual(run(false));
  });
});

// ------------------------------------------------------------------------------------------------ 3. the hold guard across all seven

describe('the hold guard, across every treated chapter of both lanes', () => {
  it('every treated chapter that a swap-scope exception names holds `smear` with the exception named; every other one holds none and its smear plays', () => {
    setTreatedScope('all');
    setSwapScope('wide'); // the page's default (`SCOPE_DEFAULT`): under node there is no page, and the scope would read `pack`
    setCurvesMode('real-snappy');
    setSmearStyle('paint');
    for (const id of Object.keys(TREATED_CHAPTERS)) {
      setDemoChapter(id);
      if (scopeExcepted(id)) {
        expect(Object.prototype.hasOwnProperty.call(SCOPE_EXCEPTIONS, id), id).toBe(true);
        expect(treatedHold(id, 'smear'), `${id} is treated and a swap-scope exception: it must hold 'smear'`).toMatch(/SCOPE_EXCEPTIONS/);
        expect(swapsInScope(), id).toBe(false);
        expect(smearOn(), id).toBe(false);
      } else {
        expect(treatedHold(id, 'smear'), `${id} is no exception: nothing holds its smear`).toBeUndefined();
        expect(swapsInScope(), id).toBe(true);
        expect(smearOn(), id).toBe(true);
      }
    }
  });

  it('is not vacuous: both games are on the list, and the exceptions on it today are Chapter II alone', () => {
    expect(FFX_TREATED.length).toBeGreaterThan(0);
    expect(FFX2_TREATED.length).toBeGreaterThan(0);
    expect(Object.keys(TREATED_CHAPTERS).filter((id) => scopeExcepted(id))).toEqual(['yunalesca']);
  });
});
