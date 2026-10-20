/**
 * The presenter's half of the item gesture (`BattlePresenterItem.ts`, wired in `BattlePresenterBeats.actionStart`), one look per game:
 * FFX: an item use is an orb of light tossed to the ally (a glow around the user) and no flask. Every FFX party member, an ally, the user, a KO'd ally (Phoenix Down), a group, a foe; the wait is only what the orb needs.
 * FFX-2: a quick small white-blue spark tossed to the ally (only a burst on the user), the pose and the wait unchanged; no orb.
 * FF7 keeps today's item painting and spell effect.
 *
 * Game case: FFX from `research/re-ffx-party-motion-timing.md` section 6 (label [M], the Steam copy read frame by frame); FFX-2 from the RE session's live check of the real FFX-2 (label [M], driver decision 147).
 * Each branch is tested against the other game's deps.
 */
import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { TIMING } from '../../src/engine/BattlePresenterEvents.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { PresenterDeps } from '../../src/engine/BattlePresenterPorts.ts';
import { FFX_ITEM_HANDS, ITEM_ORB, ITEM_SPARK } from '../../src/engine/ItemGestureTable.ts';
import { presenterGameDeps } from '../../src/app/screens/BattleScreenGameDeps.ts';
import { FakeStage } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;
const PARTY = ['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku'];

interface Harness {
  stage: FakeStage;
  sleeps: number[];
  tosses: string[];
  glows: string[];
  /** The spell layer's `land` calls (`ability@target`), and the colour of every flash on each target. */
  lands: string[];
  flashes: string[];
  play(events: Array<Unsequenced<BattleEvent>>): Promise<unknown>;
}

/** A stage that answers the item gesture the way `PaintedStage` does (the flask-free pose, the light), and records what the presenter asked of it. */
function harness(deps: Partial<PresenterDeps> = { itemGesture: 'orb' }, o: { stance?: (id: string) => string | undefined; reduce?: boolean } = {}): Harness {
  const stage = new FakeStage(PARTY, ['seymour-flux']);
  const tosses: string[] = [];
  const glows: string[] = [];
  const hasGesture = deps.itemGesture === 'orb' || deps.itemGesture === 'spark';
  if (hasGesture) {
    if (deps.itemGesture === 'orb') (stage as unknown as { itemStance: (id: string) => string | undefined }).itemStance = o.stance ?? ((id) => FFX_ITEM_HANDS[id]?.pose ?? 'idle'); // FFX-2's stage has none: the pose is the one it always had
    const vfx = stage.vfx as unknown as Record<string, unknown>;
    vfx['itemToss'] = (from: string, to: readonly string[], opt: { formMs: number; flightMs: number; tone: string; style?: string }): void => {
      tosses.push(`${from}>${to.join('+')}:${opt.formMs}:${opt.flightMs}:${opt.tone}${opt.style ? `:${opt.style}` : ''}`);
    };
    vfx['itemGlow'] = (at: string, opt: { formMs: number; style?: string }): void => {
      glows.push(`${at}:${opt.formMs}${opt.style ? `:${opt.style}` : ''}`);
    };
  }
  const lands: string[] = [];
  const flashes: string[] = [];
  (stage.vfx as unknown as Record<string, unknown>)['land'] = (at: string, opt: { abilityId?: string }): number => {
    lands.push(`${opt.abilityId ?? '?'}@${at}`);
    return 300;
  };
  for (const [id, actor] of stage.actors) (actor as unknown as { flash: (c?: number) => void }).flash = (c?: number): void => void flashes.push(`${id}:${c === undefined ? '' : c.toString(16)}`);
  const sleeps: number[] = [];
  const moments = o.reduce ? ({ reduceMotion: () => true } as never) : undefined;
  const presenter = new BattlePresenter({
    stage,
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
    ...(moments ? { moments } : {}),
    ...deps,
  });
  return {
    stage,
    sleeps,
    tosses,
    glows,
    lands,
    flashes,
    play: (events) => presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent)),
  };
}

const use = (actorId: string, targets: string[], id = 'potion'): Unsequenced<BattleEvent> =>
  ({ type: 'action-start', actorId, command: { kind: 'item', id, targets }, abilityId: id, targets }) as never;
const end = (actorId: string): Unsequenced<BattleEvent> => ({ type: 'action-end', actorId });
const heal = (targetId: string, amount = -400): Unsequenced<BattleEvent> =>
  ({ type: 'damage', targetId, amount, element: 'none', crit: false, hitIndex: 0, hitCount: 1 }) as never;
const poses = (stage: FakeStage, id: string): string[] => stage.calls.filter((c) => c.startsWith('pose=') && c.endsWith(`:${id}`)).map((c) => c.slice(5, c.indexOf(':')));

describe('an item on an ally in an FFX chapter: the orb', () => {
  for (const user of PARTY) {
    it(`${user} forms an orb over the hand and tosses it to the ally: the flask-free pose, never the flask painting`, async () => {
      const ally = user === 'yuna' ? 'tidus' : 'yuna';
      const h = harness();
      await h.play([use(user, [ally]), heal(ally), end(user)]);
      expect(h.tosses).toEqual([`${user}>${ally}:${ITEM_ORB.formMs}:${ITEM_ORB.flightMs}:heal`]);
      expect(h.glows).toEqual([]);
      const expected = FFX_ITEM_HANDS[user]!.pose;
      expect(poses(h.stage, user)[0]).toBe(expected);
      if (expected === 'idle') expect(poses(h.stage, user)).not.toContain('item'); // the painting that holds the flask is not shown
    });
  }
  it('waits exactly what the orb needs (form + flight) where today\'s item waited 380 ms, and the heal lands after it', async () => {
    const h = harness();
    await h.play([use('tidus', ['yuna'])]);
    expect(h.sleeps).toContain(ITEM_ORB.formMs + ITEM_ORB.flightMs);
    expect(h.sleeps).not.toContain(TIMING.actionStart);
    expect(ITEM_ORB.formMs + ITEM_ORB.flightMs).toBe(720);
  });
  it('Phoenix Down on a KO\'d ally tosses at the body on the ground', async () => {
    const h = harness();
    await h.play([{ type: 'ko', targetId: 'yuna' }, use('tidus', ['yuna'], 'phoenix-down'), { type: 'revive', targetId: 'yuna', hp: 1937, cause: 'phoenix-down' } as never, end('tidus')]);
    expect(h.tosses).toEqual([`tidus>yuna:${ITEM_ORB.formMs}:${ITEM_ORB.flightMs}:heal`]);
    expect(poses(h.stage, 'yuna')).toContain('ko');
    expect(poses(h.stage, 'yuna').at(-1)).toBe('idle'); // revived
  });
  it('a group item (Mega-Phoenix, an Elixir on the party) tosses at all of them at once', async () => {
    const h = harness();
    await h.play([use('auron', ['tidus', 'yuna', 'lulu'], 'mega-phoenix'), end('auron')]);
    expect(h.tosses).toEqual([`auron>tidus+yuna+lulu:${ITEM_ORB.formMs}:${ITEM_ORB.flightMs}:heal`]);
  });
  it('an item thrown at a foe is the same toss in an amber tone (the foe case is not sourced; it is the same swing)', async () => {
    const h = harness();
    await h.play([use('wakka', ['seymour-flux'], 'grenade'), end('wakka')]);
    expect(h.tosses).toEqual([`wakka>seymour-flux:${ITEM_ORB.formMs}:${ITEM_ORB.flightMs}:foe`]);
  });
});

describe('an item on the user in an FFX chapter: the glow', () => {
  it('a glow forms at the hand and rises around the user; no orb flies; the action waits its own 520 ms', async () => {
    const h = harness();
    await h.play([use('yuna', ['yuna']), heal('yuna'), end('yuna')]);
    expect(h.glows).toEqual([`yuna:${ITEM_ORB.selfFormMs}`]);
    expect(h.tosses).toEqual([]);
    expect(h.sleeps).toContain(ITEM_ORB.selfWaitMs);
    expect(poses(h.stage, 'yuna')[0]).toBe('item'); // Yuna's own painting holds no flask
  });
  it('every party member can use an item on themself', async () => {
    for (const user of PARTY) {
      const h = harness();
      await h.play([use(user, [user]), end(user)]);
      expect(h.glows, user).toEqual([`${user}:${ITEM_ORB.selfFormMs}`]);
    }
  });
});

describe('an item in an FFX-2 chapter: a quick small white-blue spark, no orb', () => {
  const FFX2 = { itemGesture: 'spark' as const };
  it('on an ally a small spark is tossed in half the orb\'s flight, with the pose and the wait unchanged (nothing is added to FFX-2\'s timing)', async () => {
    const h = harness(FFX2);
    await h.play([use('yuna', ['rikku']), heal('rikku'), end('yuna')]);
    expect(h.tosses).toEqual([`yuna>rikku:${ITEM_SPARK.formMs}:${ITEM_SPARK.flightMs}:heal:spark`]);
    expect(h.glows).toEqual([]);
    expect(ITEM_SPARK.flightMs).toBe(ITEM_ORB.flightMs / 2);
    expect(poses(h.stage, 'yuna')[0]).toBe('item'); // the pose it always had (a dressphere's falls to its idle painting, D-179)
    expect(h.sleeps).toContain(TIMING.actionStart);
    expect(h.sleeps).not.toContain(ITEM_ORB.formMs + ITEM_ORB.flightMs);
  });
  it('on the user it is only the burst: no orb toss, no rising glow', async () => {
    const h = harness(FFX2);
    await h.play([use('lulu', ['lulu']), end('lulu')]);
    expect(h.glows).toEqual([`lulu:${ITEM_SPARK.selfFormMs}:spark`]);
    expect(h.tosses).toEqual([]);
    expect(h.sleeps).toContain(TIMING.actionStart);
    expect(h.sleeps).not.toContain(ITEM_ORB.selfWaitMs);
  });
  it('a group item bursts on all of them and a foe is hit by the same small spark', async () => {
    const h = harness(FFX2);
    await h.play([use('yuna', ['yuna', 'rikku', 'lulu'], 'mega-phoenix'), end('yuna'), use('rikku', ['seymour-flux'], 'grenade'), end('rikku')]);
    expect(h.tosses[0]).toBe(`yuna>yuna+rikku+lulu:${ITEM_SPARK.formMs}:${ITEM_SPARK.flightMs}:heal:spark`);
    expect(h.tosses[1]).toBe(`rikku>seymour-flux:${ITEM_SPARK.formMs}:${ITEM_SPARK.flightMs}:foe:spark`);
  });
  it('the spell layer draws nothing for an FFX-2 item (the burst is its picture) and the heal flash is white-blue; a spell in FFX-2 and an item in FFX keep the heal effect', async () => {
    const h = harness(FFX2);
    await h.play([use('yuna', ['rikku']), heal('rikku'), end('yuna')]);
    expect(h.lands).toEqual([]);
    expect(h.flashes).toContain('rikku:cfe9ff');
    expect(h.flashes).not.toContain('rikku:9dffc4');
    const spell = harness(FFX2);
    await spell.play([{ type: 'action-start', actorId: 'yuna', command: { kind: 'ability', id: 'cure', targets: ['rikku'] }, abilityId: 'cure', targets: ['rikku'] } as never, heal('rikku'), end('yuna')]);
    expect(spell.lands).toEqual(['cure@rikku']); // a spell is untouched
    expect(spell.flashes).toContain('rikku:9dffc4');
    const ffx = harness({ itemGesture: 'orb' });
    await ffx.play([use('tidus', ['yuna']), heal('yuna'), end('tidus')]);
    expect(ffx.lands).toEqual(['potion@yuna']); // FFX keeps the heal effect after its orb
    expect(ffx.flashes).toContain('yuna:9dffc4');
  });
  it('REDUCE MOTION and skip speed draw nothing', async () => {
    const h = harness(FFX2, { reduce: true });
    await h.play([use('yuna', ['rikku']), end('yuna')]);
    expect(h.tosses).toEqual([]);
    const stage = new FakeStage(PARTY, ['seymour-flux']);
    const asked: string[] = [];
    (stage.vfx as unknown as Record<string, unknown>)['itemToss'] = (): void => void asked.push('toss');
    const presenter = new BattlePresenter({ stage, sleep: () => Promise.resolve(), itemGesture: 'spark' });
    presenter.setSpeed('skip');
    await presenter.play([use('yuna', ['rikku']), end('yuna')].map((e, i) => ({ ...e, seq: i }) as BattleEvent));
    expect(asked).toEqual([]);
  });
  it('an FFX figure\'s orb and an FFX-2 figure\'s spark never cross: each branch answers only its own game\'s deps', async () => {
    const orb = harness({ itemGesture: 'orb' });
    await orb.play([use('yuna', ['rikku']), end('yuna')]);
    expect(orb.tosses.every((t) => !t.endsWith(':spark'))).toBe(true);
    const spark = harness(FFX2);
    await spark.play([use('yuna', ['rikku']), end('yuna')]);
    expect(spark.tosses.every((t) => t.endsWith(':spark'))).toBe(true);
  });
});

describe('where the gesture does not apply', () => {
  it('FF7 (no itemGesture in the deps) keeps the item painting and the old 380 ms wait', async () => {
    const h = harness({});
    await h.play([use('tidus', ['yuna']), heal('yuna'), end('tidus')]);
    expect(poses(h.stage, 'tidus')[0]).toBe('item');
    expect(h.tosses).toEqual([]);
    expect(h.sleeps).toContain(TIMING.actionStart);
  });
  it('the chapter deps gate it: an FFX chapter says orb, an FFX-2 chapter says spark, FF7 says nothing', () => {
    expect(presenterGameDeps('ffx', null).itemGesture).toBe('orb');
    expect(presenterGameDeps('ffx2', null).itemGesture).toBe('spark');
    expect(presenterGameDeps('ff7', null).itemGesture).toBeUndefined();
  });
  it('a stage that has no hand for the figure (no itemStance answer) draws the item painting as before', async () => {
    const h = harness({ itemGesture: 'orb' }, { stance: () => undefined });
    await h.play([use('tidus', ['yuna']), end('tidus')]);
    expect(poses(h.stage, 'tidus')[0]).toBe('item');
    expect(h.tosses).toEqual([]);
    expect(h.sleeps).toContain(TIMING.actionStart);
  });
  it('REDUCE MOTION: the flask-free pose and the usual wait, no flying light', async () => {
    const h = harness({ itemGesture: 'orb' }, { reduce: true });
    await h.play([use('tidus', ['yuna']), end('tidus')]);
    expect(poses(h.stage, 'tidus')[0]).toBe('idle');
    expect(h.tosses).toEqual([]);
    expect(h.sleeps).toContain(TIMING.actionStart);
  });
  it('at skip speed the stance changes and nothing is drawn', async () => {
    const stage = new FakeStage(PARTY, ['seymour-flux']);
    const asked: string[] = [];
    (stage as unknown as { itemStance: () => string }).itemStance = () => 'idle';
    (stage.vfx as unknown as Record<string, unknown>)['itemToss'] = (): void => void asked.push('toss');
    const presenter = new BattlePresenter({ stage, sleep: () => Promise.resolve(), itemGesture: 'orb' });
    presenter.setSpeed('skip');
    await presenter.play([use('tidus', ['yuna']), end('tidus')].map((e, i) => ({ ...e, seq: i }) as BattleEvent));
    expect(asked).toEqual([]);
  });
  it('an enemy\'s command never plays the party gesture, and an attack is untouched', async () => {
    const h = harness();
    await h.play([use('seymour-flux', ['seymour-flux']), end('seymour-flux')]);
    expect(h.tosses).toEqual([]);
    expect(h.glows).toEqual([]);
    const a = harness();
    await a.play([{ type: 'action-start', actorId: 'tidus', command: { kind: 'attack', targets: ['seymour-flux'] }, targets: ['seymour-flux'] } as never, end('tidus')]);
    expect(a.tosses).toEqual([]);
    expect(poses(a.stage, 'tidus')[0]).not.toBe('idle');
  });
  it('an action that is not an item (a spell) keeps its cast pose and its wait', async () => {
    const h = harness();
    await h.play([{ type: 'action-start', actorId: 'lulu', command: { kind: 'ability', id: 'fire', targets: ['seymour-flux'] }, abilityId: 'fire', targets: ['seymour-flux'] } as never, end('lulu')]);
    expect(poses(h.stage, 'lulu')[0]).toBe('cast');
    expect(h.tosses).toEqual([]);
  });
});
