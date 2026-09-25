/**
 * Chapter IX's exit (FFX only, AGENTS.md rule 14; Bailey D-076): when Yojimbo
 * is beaten he and Daigoro are recalled together (the idles dim and rise, no
 * pyreflies; our reading, no source gives his exit), and Lady Ginnem stays on
 * the field until the post scene sends her.
 */

import { describe, expect, it, vi } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { departureKindOf, departureMs, departurePoses } from '../../src/engine/BattlePresenterDepartures.ts';
import { RECALL_COMPANIONS, RECALL_DIM, RECALL_MS, RECALL_RISE } from '../../src/engine/BattlePresenterRecall.ts';
import { ACTOR_ANIM_GRACE_MS } from '../../src/engine/BattlePresenterEvents.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

const CAVERN = ['yojimbo', 'daigoro', 'ginnem'];

function setup(sleep: (ms: number) => Promise<void> = noSleep) {
  const stage = new FakeStage(['lulu', 'kimahri', 'yuna'], CAVERN);
  const presenter = new BattlePresenter({ stage, sleep });
  const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> =>
    presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { stage, play };
}

const WIN: Array<Unsequenced<BattleEvent>> = [
  { type: 'ko', targetId: 'yojimbo' },
  { type: 'victory' } as Unsequenced<BattleEvent>,
];

describe('Chapter IX: Yojimbo and Daigoro are recalled, Ginnem stays', () => {
  it('names Yojimbo dismissed, Daigoro as his companion, and gives Ginnem and Daigoro no kind of their own', () => {
    expect(departureKindOf('yojimbo')).toBe('dismissed');
    expect(RECALL_COMPANIONS['yojimbo']).toEqual(['daigoro']);
    expect(departureKindOf('daigoro')).toBe('dissolve');
    expect(departureKindOf('ginnem')).toBe('dissolve');
    // Braska's Final Aeon's possessed Yojimbo is another subject and keeps the send.
    expect(departureKindOf('possessed-yojimbo')).toBe('dissolve');
  });

  it('recalls the pair: idle, dimmed, risen and faded; never dissolved; both removed; Ginnem untouched', async () => {
    const { stage, play } = setup();
    const moves: Record<string, { y: number }> = {};
    const brights: Record<string, number[]> = {};
    for (const id of ['yojimbo', 'daigoro']) {
      const a = stage.actors.get(id)!;
      brights[id] = [];
      (a as unknown as { setBrightness(v: number): void }).setBrightness = (v: number) => {
        brights[id]!.push(v);
      };
      const moveTo = a.moveTo.bind(a);
      a.moveTo = ((to: { y: number }) => {
        moves[id] = to;
        return moveTo();
      }) as typeof a.moveTo;
    }
    await play(WIN);
    for (const id of ['yojimbo', 'daigoro']) {
      expect(stage.calls).toContain(`pose=idle:${id}`);
      expect(stage.calls).toContain(`moveTo:${id}`);
      expect(stage.calls).toContain(`fade=0:${id}`);
      expect(stage.calls).toContain(`remove:${id}`);
      expect(stage.calls.some((c) => c.startsWith('dissolve') && c.endsWith(`:${id}`))).toBe(false);
      expect(stage.calls).not.toContain(`pose=ko:${id}`);
      expect(moves[id]!.y).toBeCloseTo(RECALL_RISE, 5); // FakeStage stands everyone at the origin
      expect(brights[id]!.at(-1)).toBeCloseTo(RECALL_DIM, 5);
    }
    expect(stage.calls.filter((c) => c.endsWith(':ginnem'))).toEqual([]);
    expect(stage.staged()).toContain('ginnem');
    expect(stage.staged()).not.toContain('yojimbo');
    expect(stage.staged()).not.toContain('daigoro');
    expect(stage.calls).toContain('pose=victory:yuna');
    // The victory comes after both have gone.
    const victoryAt = stage.calls.indexOf('pose=victory:yuna');
    expect(stage.calls.indexOf('remove:yojimbo')).toBeLessThan(victoryAt);
    expect(stage.calls.indexOf('remove:daigoro')).toBeLessThan(victoryAt);
  });

  it('still recalls Yojimbo alone when Daigoro is not staged', async () => {
    const stage = new FakeStage(['yuna'], ['yojimbo', 'ginnem']);
    const presenter = new BattlePresenter({ stage, sleep: noSleep });
    await presenter.play(WIN.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
    expect(stage.calls).toContain('remove:yojimbo');
    expect(stage.calls).toContain('pose=victory:yuna');
  });

  it('never fetches or draws a ko painting for Yojimbo', () => {
    const poses = { idle: 'i.png', cast: 'c.png', ko: 'k.png' };
    expect(departurePoses('yojimbo', poses)).toEqual({ idle: 'i.png', cast: 'c.png', ko: 'i.png' });
  });

  it('a hung recall holds the victory no longer than its length plus one grace', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    let now = 0;
    const due: Array<{ at: number; go: () => void }> = [];
    const sleep = (ms: number): Promise<void> => new Promise((go) => due.push({ at: now + Math.max(0, ms), go }));
    const { stage, play } = setup(sleep);
    const never = (): Promise<void> => new Promise(() => {});
    for (const id of ['yojimbo', 'daigoro']) {
      const a = stage.actors.get(id)!;
      a.moveTo = never;
      a.fadeTo = never;
    }
    let finished = false;
    void play(WIN).then(() => (finished = true));
    let at = -1;
    for (let i = 0; i < 10_000 && at < 0 && !finished; i++) {
      await new Promise<void>((r) => setImmediate(r));
      if (stage.calls.includes('pose=victory:yuna')) {
        at = now;
        break;
      }
      if (due.length === 0) continue;
      due.sort((a, b) => a.at - b.at);
      const next = due.shift()!;
      now = next.at;
      next.go();
    }
    expect(departureMs('dismissed')).toBe(RECALL_MS.dim + RECALL_MS.rise);
    expect(at).toBeGreaterThanOrEqual(0);
    expect(at).toBeLessThanOrEqual(departureMs('dismissed') + ACTOR_ANIM_GRACE_MS);
    expect(stage.calls).toContain('remove:yojimbo');
  });
});
