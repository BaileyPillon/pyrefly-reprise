// @vitest-environment jsdom
/**
 * r29 (PR-0221, PR-0240, PR-0222, PR-0224): the order images load in, and what
 * is never requested. Both games (shared loading), plus the FF7 swirl's hold
 * (FF7 only) and the FFX-2 fallen-pose filter.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  demoteWarm,
  holdIdleLane,
  resetImageWarm,
  warmImage,
  warmQueueState,
} from '../../src/app/imageWarm.ts';
import { resetArtManifest, setArtManifest, type ArtManifest } from '../../src/engine/ArtManifest.ts';
import { mountLazyPlates, LAZY_SRC, deferSrcs } from '../../src/app/screens/frontend/lazyPlates.ts';
import { plateArtHtml } from '../../src/app/screens/frontend/chapterPlates.ts';
import { sceneArtUrls } from '../../src/app/screens/sceneArt.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { wedgeFallenArt } from '../../src/ui/common/victoryLine.ts';
import { playFf7Swirl } from '../../src/ui/ff7/ff7Swirl.ts';
import { narrate, say } from '../../src/story/dsl.ts';

/** A fake image pipeline: every decode waits until the test settles it. */
interface Fake {
  src: string;
  settle: (ok: boolean) => void;
}
let started: Fake[] = [];

function installFakeImage(): void {
  class FakeImage {
    decoding = '';
    private _src = '';
    private done: ((ok: boolean) => void) | null = null;
    get src(): string {
      return this._src;
    }
    set src(v: string) {
      this._src = v;
      // Dropping the source cancels the load (`imageWarm.yieldIdle`).
      if (!v) this.done?.(false);
    }
    removeAttribute(name: string): void {
      if (name === 'src') this.src = '';
    }
    decode(): Promise<void> {
      const src = this._src;
      return new Promise<void>((resolve, reject) => {
        this.done = (ok) => (ok ? resolve() : reject(new Error('no')));
        started.push({ src, settle: (ok) => this.done?.(ok) });
      });
    }
  }
  vi.stubGlobal('Image', FakeImage);
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
const loadingNow = (): string[] => started.map((s) => s.src);

beforeEach(() => {
  resetImageWarm();
  setArtManifest(null);
  started = [];
  installFakeImage();
});
afterEach(() => {
  vi.unstubAllGlobals();
  resetImageWarm();
  resetArtManifest();
});

describe('imageWarm lanes', () => {
  it('an idle load waits while anything more urgent is waiting or loading', async () => {
    void warmImage('idle-1.png', 'idle');
    void warmImage('urgent-1.png', 'urgent');
    await tick();
    // The idle load (asked first) was cancelled the moment something urgent queued.
    expect(warmQueueState().loading).toMatchObject({ urgent: 1, idle: 0 });
    started.find((s) => s.src === 'urgent-1.png')!.settle(true);
    await tick();
    await tick();
    expect(warmQueueState().loading).toMatchObject({ urgent: 0, idle: 1 });
    expect(loadingNow().at(-1)).toBe('idle-1.png');
  });

  it('idle loads run two at a time at most', async () => {
    for (const u of ['a', 'b', 'c', 'd']) void warmImage(`${u}.png`, 'idle');
    await tick();
    expect(warmQueueState().loading.idle).toBe(2);
    expect(warmQueueState().waiting.idle).toBe(2);
  });

  it('a hold cancels the idle loads in flight and requeues them; release resumes them', async () => {
    const strip = warmImage('strip.png', 'idle');
    await tick();
    expect(loadingNow()).toEqual(['strip.png']);
    const release = holdIdleLane();
    await tick();
    expect(warmQueueState()).toMatchObject({ loading: { idle: 0 }, waiting: { idle: 1 }, holds: 1 });
    release();
    await tick();
    expect(loadingNow()).toEqual(['strip.png', 'strip.png']);
    started[1]!.settle(true);
    // The cancelled first attempt never settled the promise false.
    expect(await strip).toBe(true);
  });

  it('asking again at a higher lane promotes a waiting load past the idle ones', async () => {
    const release = holdIdleLane();
    void warmImage('x.png', 'idle');
    void warmImage('y.png', 'idle');
    await tick();
    expect(loadingNow()).toEqual([]);
    void warmImage('y.png', 'urgent');
    await tick();
    expect(loadingNow()).toEqual(['y.png']);
    release();
  });

  it('demoting a plate the cursor left lets the new plate have the pipe', async () => {
    void warmImage('old-hero.png', 'urgent');
    await tick();
    demoteWarm(['old-hero.png']);
    void warmImage('new-hero.png', 'urgent');
    await tick();
    // The old plate was cancelled (now an idle load, and something urgent is waiting).
    expect(warmQueueState().loading).toMatchObject({ urgent: 1, idle: 0 });
    expect(loadingNow().at(-1)).toBe('new-hero.png');
  });
});

describe('the board rail strips (PR-0221)', () => {
  const tile = { id: 'seymour-flux', sceneKey: 'gagazet', silhouetteKeys: [], title: 'Seymour Flux' } as never;

  it('a rail card and the hero ask for nothing until loaded (data-lazy-src, no src)', () => {
    for (const where of ['card', 'hero'] as const) {
      const html = plateArtHtml(tile, where);
      expect(html).toContain(`${LAZY_SRC}="`);
      expect(html).not.toMatch(/\ssrc="/);
    }
    expect(deferSrcs('<img class="a" src="x.png" alt="">')).toBe(`<img class="a" ${LAZY_SRC}="x.png" alt="">`);
  });

  it('strips go up only once decoded, the cards nearest the cursor first, in the idle lane', async () => {
    const root = document.createElement('div');
    root.innerHTML = [0, 1, 2, 3]
      .map((i) => `<div data-action="fe-card-${i}"><img ${LAZY_SRC}="art/backdrops/p${i}.png"></div>`)
      .join('');
    const order = mountLazyPlates(root, 2);
    expect(order.map((u) => u.match(/p(\d)/)![1])).toEqual(['2', '1', '3', '0']);
    await tick();
    expect(warmQueueState().loading.idle).toBe(2);
    const img2 = root.querySelector<HTMLImageElement>('[data-action="fe-card-2"] img')!;
    expect(img2.getAttribute('src')).toBeNull();
    started.find((s) => s.src.endsWith('p2.png'))!.settle(true);
    await tick();
    await tick();
    expect(img2.getAttribute('src')).toMatch(/p2\.png$/);
  });
});

describe('the pre-battle scene (PR-0221)', () => {
  it('opens on the backdrop and the first speaker; the narrator asks for nothing', () => {
    const { first, rest } = sceneArtUrls([narrate('Deep under Bevelle.'), say('rikku-x2' as never, 'Creepy.'), say('yuna-x2' as never, 'Hm.'), say('rikku-x2' as never, 'Again.')], 'bevelle-underground');
    expect(first.map((u) => u.replace(/^.*art\//, ''))).toEqual(['backdrops/bevelle-underground.png', 'portraits/rikku-x2.png']);
    expect(rest.map((u) => u.replace(/^.*art\//, ''))).toEqual(['portraits/yuna-x2.png']);
  });

  it('every shipped pre-battle scene names at least its backdrop', () => {
    for (const id of ['seymour-flux', 'ffx2-bahamut', 'ffx2-ixion-djose']) {
      const ch = getChapter(id as never)!;
      expect(sceneArtUrls(ch.scriptsRef?.pre, ch.sceneKey).first[0]).toMatch(/art\/backdrops\//);
    }
  });
});

describe('PR-0224: the fallen pose asks only for art on disk (FFX-2)', () => {
  const manifest = (states: Record<string, string[]>): ArtManifest => ({
    version: 1, generatedAt: 't', portraits: [], backdrops: [], pause: [], pause2x: [], title: [], title2x: [],
    subjects: Object.fromEntries(Object.entries(states).map(([id, s]) => [id, { states: s, portrait: false }])),
  });

  it('Trema: Dark Knight Yuna has no hurt or ko painting, so her own idle stands in; nothing 404s', () => {
    setArtManifest(manifest({ 'yuna-dark-knight': ['attack', 'idle'] }));
    const trema = getChapter('ffx2-trema' as never)!;
    const [first, second] = wedgeFallenArt(trema, 'yuna');
    expect(first).toMatch(/characters\/yuna-[a-z-]+\/idle\.png$/);
    expect(second).toBe('');
  });

  it('a dressphere with hurt and ko keeps the pair; with nothing on disk, no figure', () => {
    setArtManifest(manifest({ 'yuna-gunner': ['hurt', 'idle', 'ko'] }));
    const six = getChapter('ffx2-vegnagun-shuyin' as never)!;
    const pair = wedgeFallenArt(six, 'yuna');
    if (pair[0].includes('yuna-gunner')) expect(pair).toEqual(['art/characters/yuna-gunner/hurt.png', 'art/characters/yuna-gunner/ko.png']);
    setArtManifest(manifest({}));
    expect(wedgeFallenArt(six, 'yuna')).toEqual(['', '']);
  });
});

describe('PR-0222: the FF7 swirl holds the twisted board while the art loads (FF7 only)', () => {
  it('does not cut to black or swap until the hold settles', async () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 1));
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    vi.useFakeTimers({ toFake: ['setTimeout', 'performance'] });
    try {
      const root = document.createElement('div');
      document.body.appendChild(root);
      let loaded!: () => void;
      const hold = new Promise<void>((r) => (loaded = r));
      const onCover = vi.fn(async () => undefined);
      const done = playFf7Swirl(root, { onCover, hold });
      await vi.advanceTimersByTimeAsync(5000);
      expect(onCover).not.toHaveBeenCalled();
      expect(document.documentElement.dataset['ff7Swirl']).toBe('hold');
      loaded();
      await vi.advanceTimersByTimeAsync(2000);
      await done;
      expect(onCover).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
