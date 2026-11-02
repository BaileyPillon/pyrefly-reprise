/**
 * **The beat tap and Bahamut's wind-up** (`src/engine/yrp3d/beats.ts`; the hidden 3D Bahamut chapter, FFX-2 only; Bailey, 2026-10-22: "apply the real game bahamut animations to the ai meshy model", the live attack to start
 * at its first part). Pure types and a fake clock, no renderer. What it pins:
 *
 * 1. **The tap changes nothing**: the inner director's answers come back as they were (a plain boolean, a promise, no handler at all), `impact` and `actionClose` are reported when asked and `actionOpen` once the answer has
 *    come, and a listener that throws costs the report and never the beat.
 * 2. **The wind-up**: an `attack` by an id in `windupFor` is told `open` at once with the lunge's lead plus the wind-up the listener says it needs, and the director's answer (so the presenter's lunge) is held for that long;
 *    an attack by anyone else, a cast, a skipped fight, a listener with no wind-up (a model with no clips) and a wind-up of 0 are not held; a wind-up is cut to {@link WINDUP_MAX}; a bad number is no wind-up.
 * 3. **The data**: the wind-up the real Bahamut clip plan asks for (his two entry parts at the fastest speed against the lunge's lead) is about 0.94 s, and a girl asks for none.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import type { ActionShot, ActorShot, ImpactShot, ShotAnswer, ShotDirector } from '../../../src/engine/ShotDirector.ts';
import { LUNGE_MS, WINDUP_MAX, tapDirector, type BeatListener } from '../../../src/engine/yrp3d/beats.ts';
import { plansFromNames } from '../../../src/engine/yrp3d/clipMap.ts';
import { ATTACK_SPEED_MAX, ClipSequencer } from '../../../src/engine/yrp3d/clipSequencer.ts';

const BAHAMUT: Record<string, number> = {
  APPEAR_00: 1.5, DMG1: 1.7, ATTACK1_00: 1.43, ATTACK1_01: 1.2, ATTACK1_02: 0.77, ATTACK1_03: 0.83, MAGIC2_00: 1.33, MAGIC2_01: 0.63, MAGIC2_02: 2.3,
};
const YUNA: Record<string, number> = { APPEAR_00: 1, DMG1: 1, ATTACK1_00: 0.43, ATTACK1_01: 0.03, ATTACK1_02: 0.8, MAGIC2_00: 0.63, MAGIC2_01: 0.37, MAGIC2_02: 1.47 };
const seq = (d: Record<string, number>): ClipSequencer => new ClipSequencer(plansFromNames(Object.keys(d)), d, 'x');

/** The lunge's lead at the test's speed (the ctx doubles every time, so a use of `ms` shows). */
const LEAD = (LUNGE_MS * 2 * ATTACK_IMPACT) / 1000;

const subject = (id: string) => ({ id, side: id === 'bahamut' ? ('enemy' as const) : ('party' as const) });
const ctxOf = (actor: string, kind: string, over: Partial<ActionShot> = {}): ActionShot =>
  ({ camera: {} as never, speed: 'normal', skipping: false, ms: (b: number) => b * 2, actor: subject(actor), targets: [subject('yuna')], action: { kind }, ...over }) as ActionShot;

interface Told {
  opens: Array<{ id: string; kind: string; lead: number }>;
  impacts: string[];
  closes: string[];
}
const listener = (windup?: (id: string, kind: string, lead: number) => number): { l: BeatListener; told: Told } => {
  const told: Told = { opens: [], impacts: [], closes: [] };
  const l: BeatListener = {
    open: (id, kind, lead) => void told.opens.push({ id, kind, lead }),
    impact: (id) => void told.impacts.push(id),
    close: (id) => void told.closes.push(id),
    ...(windup ? { windup } : {}),
  };
  return { l, told };
};
const BOSS = new Set(['bahamut']);
const open = (d: ShotDirector, c: ActionShot): ShotAnswer => (d.actionOpen as (c: ActionShot) => ShotAnswer)(c);

beforeEach(() => void vi.useFakeTimers());
afterEach(() => void vi.useRealTimers());

describe('the tap changes nothing', () => {
  it('answers false with no inner handler, and reports an opening at once with the lunge\'s lead', () => {
    const { l, told } = listener();
    const d = tapDirector(undefined, l);
    expect(open(d, ctxOf('yuna', 'attack'))).toBe(false);
    expect(told.opens).toEqual([{ id: 'yuna', kind: 'attack', lead: LEAD }]);
  });

  it('gives back the inner answer (a boolean as it is) and waits for a promised one before telling the listener', async () => {
    const { l, told } = listener();
    const sync = tapDirector({ actionOpen: () => true }, l);
    expect(open(sync, ctxOf('yuna', 'cast'))).toBe(true);
    expect(told.opens).toHaveLength(1);
    let release: (v: boolean) => void = () => undefined;
    const slow = tapDirector({ actionOpen: () => new Promise<boolean>((r) => (release = r)) }, l);
    const answer = open(slow, ctxOf('bahamut', 'cast'));
    expect(answer).toBeInstanceOf(Promise);
    expect(told.opens).toHaveLength(1); // not yet: the camera is still on its way
    release(true);
    await expect(answer).resolves.toBe(true);
    expect(told.opens).toHaveLength(2);
    expect(told.opens[1]).toEqual({ id: 'bahamut', kind: 'cast', lead: LEAD }); // a number is the lead, never the promise's boolean
  });

  it('reports impact and close as they are asked, and a listener that throws costs the report, never the beat', () => {
    const { l, told } = listener();
    const d = tapDirector({}, l);
    (d.impact as (c: ImpactShot) => boolean)({ ...ctxOf('yuna', 'attack'), target: subject('bahamut'), hitIndex: 0, heavy: false } as ImpactShot);
    (d.actionClose as (c: ActorShot) => ShotAnswer)(ctxOf('yuna', 'attack'));
    expect([told.impacts, told.closes]).toEqual([['yuna'], ['yuna']]);
    const bad = tapDirector({ actionOpen: () => true }, {
      open: () => {
        throw new Error('listener');
      },
      windup: () => {
        throw new Error('listener');
      },
    }, BOSS);
    expect(open(bad, ctxOf('bahamut', 'attack'))).toBe(true); // no wind-up from a listener that throws, and the answer stands
  });
});

describe('the wind-up', () => {
  it('holds a Bahamut attack for the wind-up the listener asks for, tells the clip at once with that much more lead, and then answers as the inner director did', async () => {
    const { l, told } = listener(() => 0.9);
    const d = tapDirector({ actionOpen: () => false }, l, BOSS);
    const answer = open(d, ctxOf('bahamut', 'attack'));
    expect(told.opens).toEqual([{ id: 'bahamut', kind: 'attack', lead: LEAD + 0.9 }]); // the rear-up starts now
    expect(answer).toBeInstanceOf(Promise);
    let done = false;
    void (answer as Promise<boolean>).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(890);
    expect(done).toBe(false); // the lunge has not started
    await vi.advanceTimersByTimeAsync(20);
    expect(done).toBe(true);
    await expect(answer).resolves.toBe(false);
    expect(told.opens).toHaveLength(1); // told once, not again when the wait ends
  });

  it('passes the wind-up the actor, the kind and the lunge\'s lead to ask with, and holds an inner director\'s promised answer as well', async () => {
    const asked: Array<[string, string, number]> = [];
    const { l } = listener((id, kind, lead) => (asked.push([id, kind, lead]), 0.5));
    const d = tapDirector({ actionOpen: () => Promise.resolve(true) }, l, BOSS);
    const answer = open(d, ctxOf('bahamut', 'attack')) as Promise<boolean>;
    expect(asked).toEqual([['bahamut', 'attack', LEAD]]);
    await vi.advanceTimersByTimeAsync(600);
    await expect(answer).resolves.toBe(true);
  });

  it('does not hold anyone else, nor a cast, nor a skipped fight, nor a model with no wind-up, nor a wind-up of 0', () => {
    const asks = vi.fn(() => 0.9);
    const { l, told } = listener(asks);
    const d = tapDirector({}, l, BOSS);
    expect(open(d, ctxOf('yuna', 'attack'))).toBe(false); // a girl is not in the set
    expect(open(d, ctxOf('bahamut', 'cast'))).toBe(false); // a cast has its own hold
    expect(open(d, ctxOf('bahamut', 'attack', { skipping: true }))).toBe(false); // 'skip' resolves a fight in milliseconds
    expect(asks).not.toHaveBeenCalledWith('yuna', expect.anything(), expect.anything());
    expect(told.opens.map((o) => o.lead)).toEqual([LEAD, LEAD, LEAD]);
    const none = listener(() => 0);
    expect(open(tapDirector({}, none.l, BOSS), ctxOf('bahamut', 'attack'))).toBe(false);
    const noClips = listener(); // no `windup` on the listener: a skin whose boss is a capsule
    expect(open(tapDirector({}, noClips.l, BOSS), ctxOf('bahamut', 'attack'))).toBe(false);
    expect(noClips.told.opens[0]!.lead).toBe(LEAD);
  });

  it('cuts a wind-up to WINDUP_MAX, and a number that is not one is no wind-up', async () => {
    const big = listener(() => 9);
    const answer = open(tapDirector({}, big.l, BOSS), ctxOf('bahamut', 'attack')) as Promise<boolean>;
    expect(big.told.opens[0]!.lead).toBeCloseTo(LEAD + WINDUP_MAX, 9);
    let done = false;
    void answer.then(() => (done = true));
    await vi.advanceTimersByTimeAsync(WINDUP_MAX * 1000 + 10);
    expect(done).toBe(true);
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -2]) {
      const t = listener(() => bad);
      expect(open(tapDirector({}, t.l, BOSS), ctxOf('bahamut', 'attack'))).toBe(false); // answered at once, the lunge is not held
      expect(t.told.opens[0]!.lead).toBe(LEAD);
    }
  });
});

describe('the wind-up the real clip plans ask for', () => {
  it('is about 0.94 s for Bahamut (his two entry parts, 2.63 s, at the fastest speed, against the lunge\'s 0.26 s of lead) and nothing for a girl, a cast, or a lead that already fits', () => {
    const lead = (LUNGE_MS * ATTACK_IMPACT) / 1000;
    expect(seq(BAHAMUT).windup('attack', lead)).toBeCloseTo((1.43 + 1.2) / ATTACK_SPEED_MAX - lead, 6);
    expect(seq(BAHAMUT).windup('attack', lead)).toBeGreaterThan(0.9);
    expect(seq(BAHAMUT).windup('attack', lead)).toBeLessThan(WINDUP_MAX);
    expect(seq(YUNA).windup('attack', lead)).toBe(0);
    expect(seq(BAHAMUT).windup('cast', lead)).toBe(0);
    expect(seq(BAHAMUT).windup('attack', 2)).toBe(0);
  });

  it('puts the live attack on its first part: told the lunge\'s lead plus the wind-up, the sequencer starts at the top of ATTACK1_00, at the top speed, and the end of the entry is on the blow; told the lunge\'s lead alone it is cut to ATTACK1_01', () => {
    const lead = (LUNGE_MS * ATTACK_IMPACT) / 1000;
    const wind = seq(BAHAMUT).windup('attack', lead);
    const asked = seq(BAHAMUT).open('attack', lead + wind)!;
    expect([asked.clip, asked.from]).toEqual(['ATTACK1_00', 0]);
    expect(asked.speed).toBeCloseTo(ATTACK_SPEED_MAX, 6);
    const cut = seq(BAHAMUT).open('attack', lead)!;
    expect(cut.clip).toBe('ATTACK1_01'); // what the live attack did before: the rear-up was skipped
  });
});
