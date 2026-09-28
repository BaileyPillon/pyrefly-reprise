// @vitest-environment jsdom
/**
 * The DSL's `backdrop()` step (additive, 2026-09-27; shared plumbing, both games): the runner forwards it to the
 * port, a port that lacks it ignores it, and the cutscene screen's side crossfades the plate and ends on it, or cuts
 * at once when the scene is skipped. First user: Chapter XVI (FFX-2), the Abyss and the Bevelle Underground.
 */
import { describe, expect, it, vi } from 'vitest';
import { backdrop, say } from '../../src/story/dsl.ts';
import { CutsceneRunner, createNoopPorts } from '../../src/story/runner/CutsceneRunner.ts';
import { swapCutscenePlate } from '../../src/app/screens/cutscenePlate.ts';

describe('the backdrop step', () => {
  it('builds a plain step with a default crossfade', () => {
    expect(backdrop('bevelle-underground')).toEqual({ type: 'backdrop', key: 'bevelle-underground', ms: 900 });
    expect(backdrop('ffx2-abyss-standin', 0)).toEqual({ type: 'backdrop', key: 'ffx2-abyss-standin', ms: 0 });
  });

  it('reaches the port in order, and a port without it plays on', async () => {
    const calls: Array<[string, number]> = [];
    const runner = new CutsceneRunner(createNoopPorts({ backdrop: (key, ms) => void calls.push([key, ms]) }));
    await runner.run([backdrop('a', 300), say('none', 'Line.'), backdrop('b', 0)]);
    expect(calls).toEqual([['a', 300], ['b', 0]]);
    const plain = new CutsceneRunner(createNoopPorts());
    expect((await plain.run([backdrop('a'), say('none', 'Line.')])).type).toBe('end');
  });

  it('a skip releases a crossfade in flight', async () => {
    let release: () => void = () => {};
    const runner = new CutsceneRunner(createNoopPorts({ backdrop: () => new Promise<void>((r) => (release = r)) }));
    const done = runner.run([backdrop('slow', 4000)]);
    runner.skip();
    await expect(done).resolves.toMatchObject({ type: 'end' });
    release();
  });
});

describe('swapCutscenePlate (the cutscene screen side)', () => {
  it('cuts at once when ms is 0: the root carries the plate, no layer is left', async () => {
    const root = document.createElement('div');
    const eyebrow = root.appendChild(document.createElement('div'));
    eyebrow.className = 'cutscene__eyebrow';
    await swapCutscenePlate(root, 'bevelle-underground', 0, () => Promise.resolve());
    expect(eyebrow.hidden).toBe(true); // the chapter's place no longer applies
    expect(root.style.backgroundImage).toContain('art/backdrops/bevelle-underground.png');
    expect(root.dataset['plate']).toBe('bevelle-underground');
    expect(root.querySelector('.cutscene__plate')).toBeNull();
  });

  it('crossfades through a layer under everything else, then hands the plate to the root', async () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 1; });
    const root = document.createElement('div');
    root.appendChild(document.createElement('section')); // the stage, the box
    let wake: () => void = () => {};
    const swap = swapCutscenePlate(root, 'ffx2-abyss-standin', 900, () => new Promise<void>((r) => (wake = r)));
    const layer = root.querySelector<HTMLElement>('.cutscene__plate')!;
    expect(root.firstElementChild).toBe(layer);
    expect(layer.style.opacity).toBe('1');
    expect(layer.style.backgroundImage || layer.style.background).toContain('ffx2-abyss-standin');
    wake();
    await swap;
    expect(root.querySelector('.cutscene__plate')).toBeNull();
    expect(root.style.backgroundImage).toContain('ffx2-abyss-standin');
    vi.unstubAllGlobals();
  });
});
