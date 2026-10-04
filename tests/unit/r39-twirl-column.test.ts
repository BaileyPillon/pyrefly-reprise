// @vitest-environment jsdom
/**
 * Round 21, PR-0334 (FFX-2 only; only FFX-2 has a spherechange): the flourish's white light column opened on the change's first frame while
 * the painted twirl keys that replace it showed only after they and the new outfit had loaded, so on a network the column stood at full
 * white over the girl for hundreds of ms, a hard-edged slab in 7 of 7 changes. The document now wears `mix-twirl` from the first frame
 * (synchronously) while a change has keys; if the keys do not come, the column is given back and replayed from its start.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setArtManifest, parseArtManifest } from '../../src/engine/ArtManifest.ts';

const loaded = vi.hoisted(() => ({ mode: 'ready' as 'ready' | 'never', texture: () => ({ dispose: () => undefined }) }));
vi.mock('../../src/engine/PaintedArt.ts', () => ({
  artUrl: (p: string) => p,
  softSilhouette: () => null,
  prewarmPainted: () => Promise.resolve(true),
  tryLoadMeta: () => Promise.resolve({ baselineY: 700, scale: 1, width: 600, height: 800 }),
  loadPainted: () => (loaded.mode === 'never' ? new Promise(() => undefined) : Promise.resolve({ texture: loaded.texture(), meta: { width: 600, height: 800, baselineY: 700, scale: 1 }, placeholder: false, url: 'k' })),
}));

import { LATE_MS, TwirlSlot } from '../../src/engine/fx/mix/twirl.ts';
import { giveBackColumn, HIDE_CLASS, hideColumn, showColumn } from '../../src/engine/fx/mix/twirlColumn.ts';

const MANIFEST = {
  subjects: {
    'rikku-thief': { states: ['idle', 'twirl-start', 'twirl-going'] },
    'rikku-gunner': { states: ['idle', 'twirl-mid'] },
    'rikku-white-mage': { states: ['idle', 'twirl-forming', 'twirl-end'] },
    'rikku-plain': { states: ['idle'] },
  },
};

type Fig = {
  name: string;
  poseUrls: Record<string, string>;
  slots: { mesh: object; pose: string; fade: number }[];
  active: number;
  poses: Map<string, unknown>;
  loadPoses: (poses: Record<string, string>, initial?: string) => Promise<void>;
  flash: ReturnType<typeof vi.fn>;
  applyPose: ReturnType<typeof vi.fn>;
  syncOpacity: () => void;
};

function girl(): Fig {
  return {
    name: 'rikku',
    poseUrls: { idle: '/art/characters/rikku-thief/idle.png' },
    slots: [{ mesh: {}, pose: 'idle', fade: 1 }, { mesh: {}, pose: 'idle', fade: 0 }],
    active: 0,
    poses: new Map([['idle', { texture: { dispose: () => undefined } }]]),
    loadPoses: () => Promise.resolve(),
    flash: vi.fn(),
    applyPose: vi.fn(),
    syncOpacity: () => undefined,
  };
}

function slotWith(fig: Fig): TwirlSlot {
  const t = new TwirlSlot();
  t.on = true;
  t.eager = false;
  t.watch(fig as unknown as Parameters<TwirlSlot['watch']>[0]);
  return t;
}

const to = (id: string): Record<string, string> => ({ idle: `/art/characters/${id}/idle.png` });
const flush = async (n = 12): Promise<void> => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

beforeEach(() => {
  document.documentElement.classList.remove(HIDE_CLASS);
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  setArtManifest(parseArtManifest(MANIFEST));
  loaded.mode = 'ready';
});
afterEach(() => {
  vi.useRealTimers();
  setArtManifest(null);
});

describe('the white column is hidden from the first frame when the change has keys (PR-0334)', () => {
  it('adds the class synchronously, before any load is awaited', () => {
    const fig = girl();
    const t = slotWith(fig);
    void fig.loadPoses(to('rikku-white-mage'));
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(true); // in the same tick as the call
    expect(document.getElementById('mix-twirl-style')?.textContent).toContain('.ffx2sf__column{opacity:0 !important}');
    t.dispose();
  });

  it('does not hide it for a change that has no keys at all (today\'s flourish plays as designed)', () => {
    setArtManifest(parseArtManifest({ subjects: { 'rikku-thief': { states: ['idle'] }, 'rikku-plain': { states: ['idle'] } } }));
    const fig = girl();
    const t = slotWith(fig);
    void fig.loadPoses(to('rikku-plain'));
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(false);
    t.dispose();
  });

  it('does not touch the column when the mix is off (twirl.on false) or the subject did not change', () => {
    const fig = girl();
    const t = slotWith(fig);
    t.on = false;
    void fig.loadPoses(to('rikku-white-mage'));
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(false);
    t.on = true;
    void fig.loadPoses(to('rikku-thief')); // the same subject again (a re-load)
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(false);
    t.dispose();
  });

  it('keeps it hidden through the play and shows it again when the last key is done', async () => {
    const fig = girl();
    const t = slotWith(fig);
    void fig.loadPoses(to('rikku-white-mage'));
    await flush();
    expect(t.stats.played).toBe(1);
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(true);
    for (let i = 0; i < 80 && document.documentElement.classList.contains(HIDE_CLASS); i++) t.update(1 / 60);
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(false); // finish() puts it back
    t.dispose();
  });

  it('gives the column back, replayed from its start, when the keys are late (today\'s flourish plays)', async () => {
    vi.useFakeTimers();
    loaded.mode = 'never';
    const fig = girl();
    const flashed = fig.flash;
    const t = slotWith(fig);
    // a flourish for this girl, one column, 150 ms into its 800 ms animation
    const el = document.createElement('div');
    el.className = 'ffx2sf';
    el.dataset['who'] = 'rikku';
    const col = document.createElement('div');
    col.className = 'ffx2sf__column';
    (col as unknown as { getAnimations: () => unknown[] }).getAnimations = () => [{ animationName: 'ffx2sf-column', currentTime: 150 }];
    el.appendChild(col);
    document.body.appendChild(el);
    void fig.loadPoses(to('rikku-white-mage'));
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(true);
    await vi.advanceTimersByTimeAsync(LATE_MS + 5);
    expect(t.stats.late).toBe(1);
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(false);
    expect(flashed).toHaveBeenCalledWith(0xffffff, 420, 1); // the white flash the keys had replaced
    expect(col.style.getPropertyValue('--sf-ms')).toBe('650ms'); // replayed over what the flourish has left (800 - 150)
    expect(col.style.animation).toBe(''); // the restart wrote 'none' and put it back
    t.dispose();
  });

  it('a load that never ends cannot hide a later change\'s column for ever', async () => {
    vi.useFakeTimers();
    loaded.mode = 'never';
    const fig = girl();
    const t = slotWith(fig);
    void fig.loadPoses(to('rikku-white-mage'));
    await vi.advanceTimersByTimeAsync(LATE_MS + 5);
    hideColumn(); // as if a second change began
    await vi.advanceTimersByTimeAsync(3100);
    t.dispose();
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(false);
  });
});

describe('giveBackColumn / hideColumn / showColumn', () => {
  it('toggles the class and writes the style once', () => {
    hideColumn();
    hideColumn();
    expect(document.querySelectorAll('#mix-twirl-style').length).toBe(1);
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(true);
    showColumn();
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(false);
  });

  it('leaves a column alone that has under 250 ms of its flourish left (it ends as it is) and one of another girl', () => {
    const mk = (who: string, now: number): HTMLElement => {
      const el = document.createElement('div');
      el.className = 'ffx2sf';
      el.dataset['who'] = who;
      const col = document.createElement('div');
      col.className = 'ffx2sf__column';
      (col as unknown as { getAnimations: () => unknown[] }).getAnimations = () => [{ animationName: 'ffx2sf-column', currentTime: now }];
      el.appendChild(col);
      document.body.appendChild(el);
      return col;
    };
    const late = mk('yuna', 700);
    const other = mk('paine', 100);
    giveBackColumn('yuna');
    expect(late.style.getPropertyValue('--sf-ms')).toBe('');
    expect(other.style.getPropertyValue('--sf-ms')).toBe('');
  });
});
