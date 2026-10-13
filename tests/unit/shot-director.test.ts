/**
 * **The shot-director seam** (`src/engine/ShotDirector.ts`, `BattleMoments.ts`): an optional per-scene camera plan, asked at each of the ten beats, inert until a scene publishes one.
 *
 * Driven through the real `BattleMoments` and a scripted fight (`helpers/shotScript.ts`) that meets all ten beats and logs every camera move, actor move and piece of chrome in order. What it pins:
 *
 * 1. **With no director, the calls `BattleMoments` makes are unchanged.** `GOLDEN_NORMAL` and `GOLDEN_SKIP` below were recorded from the code as it was BEFORE the seam existed (the same script, run on
 *    the unmodified `BattleMoments`), at normal and at skip speed, and are compared beat by beat.
 * 2. **The stub declines every beat** (`src/engine/ffxcam/stubDirector.ts`, what the hidden Fayth chapter's scene publishes): it is asked at all ten, and the log is the golden one, so the chapter plays
 *    Chapter VIII's camera.
 * 3. **A director that takes one beat stops `BattleMoments`' own camera moves for that beat and only that beat**: for each of the ten, the log is the golden one minus exactly that beat's camera calls
 *    (the chrome, the walk on, the sounds and the bookkeeping stay `BattleMoments`'), at normal and at skip speed.
 * 4. **What a director is told**: the acting combatant and its side, the action, its kind and ability, the targets, the hit, the camera port, the speed.
 * 5. **Answers**: a promise is waited for; a rejected promise, a handler that throws, and (for the synchronous `impact`) a promise all count as declined.
 *
 * Game case: shared plumbing (both). The FFX chapter that publishes a director is pinned in `chapters/exp-fayth-scene.test.ts`.
 */
import { describe, expect, it } from 'vitest';

import { BattleMoments } from '../../src/engine/BattleMoments.ts';
import type { ShotBeat, ShotDirector } from '../../src/engine/ShotDirector.ts';
import { STUB_SHOT_DIRECTOR } from '../../src/engine/ffxcam/stubDirector.ts';
import { noSleep } from './helpers/FakeStage.ts';
import { DirectedStage, playScript, withoutCamera, type BeatSlice } from './helpers/shotScript.ts';

const BEATS: readonly ShotBeat[] = ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory'];

/** The script's calls as `BattleMoments` made them before the seam existed (recorded on the unmodified code, 2026-10-10). Slices are in script order. */
const GOLDEN_NORMAL: Array<[string, string[]]> = [
  ['battleStart', ['camera!:intro', 'hud:false', 'moveTo:tidus', 'fade=1:tidus', 'moveTo:tidus', 'moveTo:yuna', 'fade=1:yuna', 'moveTo:yuna', 'camera:idle', 'cue:boss-roar', 'camera:push=0.12', 'slab:reveal:Yunalesca', 'camera:enemy', 'camera:release', 'camera:idle', 'hud:true']],
  ['actionOpen', ['camera:party', 'camera:push=0.06']],
  ['impact', ['camera!:enemy', 'camera:punch', 'camera:roll=-4']],
  ['actionClose', ['camera:release', 'camera:idle']],
  ['actionOpen#2', ['camera:party', 'camera:push=0.06']],
  ['turnStart', ['camera:release', 'camera:idle']],
  ['overdriveStart', ['cue:overdrive-full', 'letterbox:on', 'camera:party', 'camera:push=0.14', 'slab:overdrive:Blitz Ace']],
  ['overdriveEnd', ['letterbox:off', 'camera:release']],
  ['telegraph', ['vignette:on@132', 'camera:push=0.14', 'camera:enemy', 'slab:telegraph:Mega Flare']],
  ['actionOpen#3', ['camera:party', 'camera:push=0.06']],
  ['actionClose#2', ['vignette:off', 'camera:release', 'camera:release', 'camera:idle']],
  ['formChange', ['camera:push=0.12', 'camera:enemy']],
  ['formChangeEnd', ['camera:release', 'camera:release', 'camera:idle']],
  ['victory', ['camera:release', 'camera:victory']],
];

/** The same script at `'skip'`: every rig change a hard snap, no chrome at all. */
const GOLDEN_SKIP: Array<[string, string[]]> = [
  ['battleStart', ['camera!:intro', 'camera!:idle']],
  ['actionOpen', ['camera!:party']],
  ['impact', []],
  ['actionClose', ['camera:release', 'camera!:idle']],
  ['actionOpen#2', ['camera!:party']],
  ['turnStart', ['camera:release', 'camera!:idle']],
  ['overdriveStart', ['camera!:party']],
  ['overdriveEnd', []],
  ['telegraph', []],
  ['actionOpen#3', ['camera!:party']],
  ['actionClose#2', ['camera:release', 'camera!:idle']],
  ['formChange', []],
  ['formChangeEnd', []],
  ['victory', ['camera!:victory']],
];

const pairs = (slices: readonly BeatSlice[]): Array<[string, string[]]> => slices.map((s) => [s.beat, s.calls]);
const clone = (golden: Array<[string, string[]]>): BeatSlice[] => golden.map(([beat, calls]) => ({ beat, calls: [...calls] }));

/** Wrap a director so the beats it is asked about are recorded. */
function watching(inner: ShotDirector): { director: ShotDirector; asked: ShotBeat[] } {
  const asked: ShotBeat[] = [];
  const director: Record<string, unknown> = {};
  for (const beat of BEATS) {
    const handler = inner[beat] as ((ctx: unknown) => unknown) | undefined;
    if (handler) director[beat] = (ctx: unknown): unknown => (asked.push(beat), handler.call(inner, ctx));
  }
  return { director: director as ShotDirector, asked };
}

/** A director whose only handler is `beat`'s, and it takes it. */
const takes = (beat: ShotBeat): ShotDirector => ({ [beat]: () => true }) as unknown as ShotDirector;

describe('with no director, BattleMoments makes the calls it always made', () => {
  it('normal speed: every beat of the script, call for call, as recorded before the seam', async () => {
    expect(pairs((await playScript()).slices)).toEqual(GOLDEN_NORMAL);
  });

  it('skip speed: the same, every rig change a snap and no chrome', async () => {
    expect(pairs((await playScript({ speed: 'skip' })).slices)).toEqual(GOLDEN_SKIP);
  });
});

describe('the stub director (the hidden Fayth chapter\'s)', () => {
  it('has a handler for each of the ten beats, and every one declines', () => {
    expect(Object.keys(STUB_SHOT_DIRECTOR).sort()).toEqual([...BEATS].sort());
    for (const beat of BEATS) expect((STUB_SHOT_DIRECTOR[beat] as () => unknown)(), beat).toBe(false);
  });

  it('is asked at all ten beats and changes no call, at normal and at skip speed', async () => {
    // At skip an Overdrive never opens (BattleMoments raises no chrome and holds nothing), so its end is never reached and never asked: as before the seam.
    for (const [speed, golden, beats] of [['normal', GOLDEN_NORMAL, BEATS], ['skip', GOLDEN_SKIP, BEATS.filter((b) => b !== 'overdriveEnd')]] as const) {
      const { director, asked } = watching(STUB_SHOT_DIRECTOR);
      expect(pairs((await playScript({ director, speed })).slices), speed).toEqual(golden);
      expect([...new Set(asked)].sort(), speed).toEqual([...beats].sort());
    }
  });
});

describe('a director that takes one beat', () => {
  /** Which slices of the script belong to each beat (a beat the script meets more than once, and the end of a held shot that follows its opening). */
  const SLICES_OF: Record<ShotBeat, string[]> = {
    battleStart: ['battleStart'], // the party still walks on, the HUD still hides and returns, the roar and the plate still play
    turnStart: ['turnStart'],
    actionOpen: ['actionOpen', 'actionOpen#2', 'actionOpen#3'],
    impact: ['impact'],
    actionClose: ['actionClose', 'actionClose#2'], // the telegraph's vignette still comes down, with no release of ours
    overdriveStart: ['overdriveStart'], // the stinger, the letterbox and the slab still play
    overdriveEnd: ['overdriveEnd'], // the letterbox still comes down
    telegraph: ['telegraph'], // the vignette and the slab still play
    formChange: ['formChange', 'formChangeEnd'], // the hold it took is not released, and the form settles by itself
    victory: ['victory'],
  };

  /** What the golden log becomes when only `beat` is taken: the camera calls of that beat's slices leave, and nothing else. */
  function expectedWhenTaking(beat: ShotBeat, golden: Array<[string, string[]]>, speed: 'normal' | 'skip'): BeatSlice[] {
    const slices = clone(golden);
    for (const s of slices) if (SLICES_OF[beat].includes(s.beat)) s.calls = withoutCamera(s.calls);
    if (beat === 'telegraph' && speed === 'normal') {
      // The zoom it never took is not released when the action closes; that close's own return to idle stays.
      const close = slices.find((x) => x.beat === 'actionClose#2')!;
      close.calls.splice(close.calls.indexOf('camera:release'), 1);
    }
    return slices;
  }

  for (const speed of ['normal', 'skip'] as const) {
    for (const beat of BEATS) {
      it(`${beat} at ${speed} speed: BattleMoments makes none of its own camera moves for it, and every other beat is exactly as before`, async () => {
        const run = await playScript({ director: takes(beat), speed });
        expect(pairs(run.slices)).toEqual(pairs(expectedWhenTaking(beat, speed === 'normal' ? GOLDEN_NORMAL : GOLDEN_SKIP, speed)));
      });
    }
  }

  it('declining (false) is the same as having no handler for the beat', async () => {
    const declining: ShotDirector = { turnStart: () => false, impact: () => false, actionClose: () => Promise.resolve(false) };
    expect(pairs((await playScript({ director: declining })).slices)).toEqual(GOLDEN_NORMAL);
  });
});

describe('what a director is told', () => {
  it('the acting combatant and its side, the action and its kind, the targets, the hit, the camera port, the speed', async () => {
    const seen: Array<{ beat: ShotBeat; ctx: Record<string, unknown> }> = [];
    const recorder: Record<string, unknown> = {};
    for (const beat of BEATS) recorder[beat] = (ctx: Record<string, unknown>): boolean => (seen.push({ beat, ctx: { ...ctx, ms100: (ctx['ms'] as (n: number) => number)(100) } }), false);
    const run = await playScript({ director: recorder as ShotDirector });
    const of = (beat: ShotBeat, n = 0): Record<string, unknown> => seen.filter((s) => s.beat === beat)[n]!.ctx;
    const tidus = { id: 'tidus', side: 'party' };
    const boss = { id: 'yunalesca', side: 'enemy' };

    expect(seen.map((s) => s.beat)).toEqual(['battleStart', 'actionOpen', 'impact', 'actionClose', 'actionOpen', 'turnStart', 'overdriveStart', 'overdriveEnd', 'telegraph', 'actionOpen', 'actionClose', 'formChange', 'victory']);
    for (const { beat, ctx } of seen) {
      expect(ctx['camera'], `${beat}: the presenter's own camera port`).toBe(run.stage.camera);
      expect([ctx['speed'], ctx['skipping']], beat).toEqual(['normal', false]);
      expect(ctx['ms100'], beat).toBe(run.moments.ms(100));
    }
    expect(of('battleStart')).toMatchObject({ partyIds: ['tidus', 'yuna'], boss, bossName: 'Yunalesca' });
    expect(of('actionOpen')).toMatchObject({ actor: tidus, targets: [boss], action: { kind: 'attack', abilityId: 'attack', commandKind: 'attack' } });
    expect(of('actionOpen', 1)).toMatchObject({ actor: { id: 'yuna', side: 'party' }, action: { kind: 'cast', abilityId: 'fire', commandKind: 'ability' } });
    expect(of('impact')).toMatchObject({ actor: tidus, target: boss, hitIndex: 0, heavy: true, action: { kind: 'attack', abilityId: 'attack' } });
    expect(of('actionClose')).toMatchObject({ actor: tidus, action: { kind: 'attack' } });
    expect(of('turnStart')).toMatchObject({ actor: tidus });
    expect(of('overdriveStart')).toMatchObject({ actor: tidus, targets: [boss], action: { kind: 'overdrive', name: 'Blitz Ace', abilityId: 'blitz-ace', commandKind: 'overdrive' } });
    expect(of('overdriveEnd')).toMatchObject({ actor: tidus, action: { kind: 'overdrive', name: 'Blitz Ace' } });
    expect(of('telegraph')).toMatchObject({ enemy: boss, stage: 2, name: 'Mega Flare' });
    expect(of('formChange')).toMatchObject({ enemy: boss });
    expect(Object.keys(of('victory')).sort()).toEqual(['camera', 'ms', 'ms100', 'skipping', 'speed']);
  });

  it('at skip speed it says so, and its durations collapse with the speed', async () => {
    const seen: Array<Record<string, unknown>> = [];
    const run = await playScript({
      speed: 'skip',
      director: { actionOpen: (ctx) => (seen.push({ skipping: ctx.skipping, speed: ctx.speed, ms: ctx.ms(300) }), false) },
    });
    expect(seen[0]).toEqual({ skipping: true, speed: 'skip', ms: run.moments.ms(300) });
  });
});

describe('answers', () => {
  /** A stage and a moments with the director, and a turn left to settle (a cast's shot is up). */
  async function ready(director: ShotDirector) {
    const stage = new DirectedStage(['tidus', 'yuna'], ['yunalesca']);
    stage.shotDirector = director;
    const moments = new BattleMoments({ stage, sleep: noSleep, speed: () => 'normal' });
    await moments.actionOpen('yuna', 'cast', ['yunalesca']);
    stage.calls.length = 0;
    return { stage, moments };
  }
  const settle = async (): Promise<void> => {
    for (let i = 0; i < 6; i++) await Promise.resolve();
  };

  it('a promise answer is waited for before the beat goes on; true takes the beat, false lets BattleMoments play its own', async () => {
    for (const [answer, calls] of [[true, []], [false, ['camera:release', 'camera:idle']]] as const) {
      let resolve!: (v: boolean) => void;
      const gate = new Promise<boolean>((r) => (resolve = r));
      const { stage, moments } = await ready({ turnStart: () => gate });
      let done = false;
      const beat = moments.turnStart('tidus').then(() => void (done = true));
      await settle();
      expect(done, 'the beat waits for the director').toBe(false);
      expect(stage.calls, 'and moves nothing meanwhile').toEqual([]);
      resolve(answer);
      await beat;
      expect(stage.calls, `after ${answer}`).toEqual(calls);
    }
  });

  it('a rejected promise and a handler that throws count as declined: the shot is played, the battle goes on', async () => {
    for (const director of [{ turnStart: () => Promise.reject(new Error('director down')) }, { turnStart: (): boolean => { throw new Error('director down'); } }] as ShotDirector[]) {
      const { stage, moments } = await ready(director);
      await moments.turnStart('tidus');
      expect(stage.calls).toEqual(['camera:release', 'camera:idle']);
    }
  });

  it('impact is synchronous: only true takes it, a promise (a mistyped director) is ignored, a throw plays the shot', async () => {
    for (const [director, cut] of [
      [{ impact: () => true }, 0],
      [{ impact: () => Promise.resolve(true) as unknown as boolean }, 1],
      [{ impact: (): boolean => { throw new Error('director down'); } }, 1],
      [{ impact: () => false }, 1],
    ] as Array<[ShotDirector, number]>) {
      const { stage, moments } = await ready(director);
      moments.impact('yunalesca', { hitIndex: 0 });
      expect(stage.calls.filter((c) => c === 'camera!:enemy'), JSON.stringify(Object.keys(director))).toHaveLength(cut);
    }
  });

  it('every hit asks, the later hits of a multi-hit action too, though BattleMoments itself cuts once', async () => {
    const hits: number[] = [];
    const { stage, moments } = await ready({ impact: (ctx) => (hits.push(ctx.hitIndex), false) });
    for (const hitIndex of [0, 1, 2]) moments.impact('yunalesca', { hitIndex });
    expect(hits).toEqual([0, 1, 2]);
    expect(stage.calls.filter((c) => c === 'camera!:enemy')).toHaveLength(1);
  });
});
