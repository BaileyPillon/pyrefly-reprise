// @vitest-environment jsdom
/**
 * The DOM half of a moment: the battle-start swirl and the overlay that carries
 * the letterbox, the name slab and the heartbeat vignette.
 *
 * The things worth pinning down here are the ones a screenshot cannot show:
 * that the swirl holds the frame **covered** until the screen it is hiding has
 * finished loading, that a slab cancels the one before it instead of stacking,
 * and that the vignette's throb period is derived from a bpm rather than
 * hard-coded — which is what keeps it in time with the HUD's screen border.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildSwirl, playBattleSwirl, resolveSwirlOptions, DEFAULT_SWIRL_MS } from '../../src/ui/common/transitions/swirl.ts';
import { MomentOverlay } from '../../src/ui/common/transitions/MomentOverlay.ts';
import { TELEGRAPH_BPM } from '../../src/ui/ffx/TelegraphBanner.ts';

const CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/common/transitions/transitions.css'),
  'utf8',
);

function mockReducedMotion(matches: boolean): void {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

// ------------------------------------------------------------------- swirl

describe('battle-start swirl', () => {
  it('builds two counter-rotating blades and one gold seam', () => {
    const el = buildSwirl(document, { durationMs: 800 });
    expect(el.querySelectorAll('.pf-swirl__blade')).toHaveLength(2);
    expect(el.querySelector('.pf-swirl__blade--a')).toBeTruthy();
    expect(el.querySelector('.pf-swirl__blade--b')).toBeTruthy();
    expect(el.querySelectorAll('.pf-swirl__ring')).toHaveLength(1);
    expect(el.style.getPropertyValue('--pf-swirl-ms')).toBe('800ms');
  });

  it('defaults to the Ink & Gold ink and accent', () => {
    const o = resolveSwirlOptions();
    expect(o.durationMs).toBe(DEFAULT_SWIRL_MS);
    expect(o.ink).toBe('#0b0a12');
    expect(o.gold).toBe('#e3b94a');
  });

  it('takes the instant path under reduced motion, and still fires onCover', async () => {
    mockReducedMotion(true);
    expect(resolveSwirlOptions().instant).toBe(true);

    const root = document.createElement('div');
    document.body.appendChild(root);
    const seen: string[] = [];
    await playBattleSwirl(root, { onCover: () => void seen.push('cover') });
    expect(seen).toEqual(['cover']);
    expect(root.querySelector('.pf-swirl')).toBeNull();
  });

  it('holds the frame covered until the screen swap settles', async () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.appendChild(root);

    let finishSwap = (): void => {};
    const swap = new Promise<void>((resolve) => {
      finishSwap = resolve;
    });
    let done = false;
    const playing = playBattleSwirl(root, { durationMs: 600, onCover: () => swap }).then(() => {
      done = true;
    });

    // Halfway: covered, and every layer frozen on the covering pose rather
    // than unwinding over a screen that has not loaded yet.
    await vi.advanceTimersByTimeAsync(300);
    const blade = root.querySelector<HTMLElement>('.pf-swirl__blade')!;
    expect(blade.style.animationPlayState).toBe('paused');

    // Far past the swirl's own duration, still covered.
    await vi.advanceTimersByTimeAsync(5000);
    expect(done).toBe(false);
    expect(root.querySelector('.pf-swirl')).not.toBeNull();

    finishSwap();
    await vi.advanceTimersByTimeAsync(0);
    expect(blade.style.animationPlayState).toBe('running');
    await vi.advanceTimersByTimeAsync(300);
    await playing;
    expect(done).toBe(true);
    expect(root.querySelector('.pf-swirl')).toBeNull();
  });

  it('still unwinds when the swap it is covering fails', async () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const playing = playBattleSwirl(root, {
      durationMs: 200,
      onCover: () => Promise.reject(new Error('scene missing')),
    });
    await vi.advanceTimersByTimeAsync(400);
    await expect(playing).resolves.toBeUndefined();
    expect(root.querySelector('.pf-swirl')).toBeNull();
  });
});

// ----------------------------------------------------------------- overlay

describe('moment overlay', () => {
  function mount(): { root: HTMLElement; overlay: MomentOverlay } {
    const root = document.createElement('div');
    document.body.appendChild(root);
    return { root, overlay: new MomentOverlay(root) };
  }

  it('mounts one layer per moment piece', () => {
    const { root } = mount();
    expect(root.querySelectorAll('.pf-mom')).toHaveLength(1);
    expect(root.querySelectorAll('.pf-mom__bar')).toHaveLength(2);
    expect(root.querySelectorAll('.pf-mom__slab')).toHaveLength(1);
    expect(root.querySelectorAll('.pf-mom__vig')).toHaveLength(1);
  });

  it('drives the letterbox off a data attribute, not inline geometry', async () => {
    const { overlay } = mount();
    await overlay.letterbox(true, 0);
    expect(overlay.el.dataset['letterbox']).toBe('1');
    await overlay.letterbox(false, 0);
    expect(overlay.el.dataset['letterbox']).toBe('0');
  });

  it('names the Overdrive on a gold slab and the charge on a red one', async () => {
    const { overlay } = mount();
    await overlay.nameSlab({ title: 'Blitz Ace', subtitle: 'OVERDRIVE', kind: 'overdrive', holdMs: 0 });
    const slab = overlay.el.querySelector('.pf-mom__slab')!;
    expect(slab.classList.contains('pf-mom__slab--overdrive')).toBe(true);
    expect(slab.querySelector('.pf-mom__slab-title')!.textContent).toBe('Blitz Ace');
    expect(slab.querySelector('.pf-mom__slab-sub')!.textContent).toBe('OVERDRIVE');

    await overlay.nameSlab({ title: 'Mega Death', kind: 'telegraph', holdMs: 0 });
    expect(slab.classList.contains('pf-mom__slab--telegraph')).toBe(true);
    // A telegraph names its own state when the caller gives no subtitle.
    expect(slab.querySelector('.pf-mom__slab-sub')!.textContent).toBe('CHARGING');
  });

  it('a second slab replaces the first instead of stacking on it', async () => {
    vi.useFakeTimers();
    const { overlay } = mount();
    const first = overlay.nameSlab({ title: 'Yunalesca', kind: 'reveal', holdMs: 4000 });
    await vi.advanceTimersByTimeAsync(100);
    void overlay.nameSlab({ title: 'Mega Death', kind: 'telegraph', holdMs: 400 });

    expect(overlay.el.querySelectorAll('.pf-mom__slab')).toHaveLength(1);
    expect(overlay.el.querySelector('.pf-mom__slab-title')!.textContent).toBe('Mega Death');

    // The replaced slab's hold was cancelled, so its promise never settles —
    // which is fine, and is why `BattleMoments` never awaits two at once.
    await vi.advanceTimersByTimeAsync(5000);
    expect(overlay.el.querySelector('.pf-mom__slab')!.getAttribute('data-on')).toBe('0');
    void first;
  });

  it('derives the heartbeat period from bpm, in time with the HUD border', () => {
    const { overlay } = mount();
    const vig = overlay.el.querySelector<HTMLElement>('.pf-mom__vig')!;

    overlay.vignette(true, { bpm: TELEGRAPH_BPM[2] });
    expect(vig.dataset['on']).toBe('1');
    expect(vig.style.getPropertyValue('--pf-vig-ms')).toBe(`${Math.round(60000 / 132)}ms`);

    overlay.vignette(true, { bpm: TELEGRAPH_BPM[1] });
    expect(vig.style.getPropertyValue('--pf-vig-ms')).toBe(`${Math.round(60000 / 84)}ms`);

    overlay.vignette(false);
    expect(vig.dataset['on']).toBe('0');
  });

  it('clamps an absurd bpm rather than producing a zero-length animation', () => {
    const { overlay } = mount();
    const vig = overlay.el.querySelector<HTMLElement>('.pf-mom__vig')!;
    overlay.vignette(true, { bpm: 100_000 });
    expect(vig.style.getPropertyValue('--pf-vig-ms')).toBe(`${Math.round(60000 / 220)}ms`);
  });

  it('clear() drops every layer but leaves the overlay usable', async () => {
    const { root, overlay } = mount();
    await overlay.letterbox(true, 0);
    overlay.vignette(true);
    overlay.clear();
    expect(overlay.el.dataset['letterbox']).toBe('0');
    expect(root.querySelector('.pf-mom')).not.toBeNull();

    await overlay.letterbox(true, 0);
    expect(overlay.el.dataset['letterbox']).toBe('1');
  });

  it('dispose() unmounts, and every call after it is inert', async () => {
    const { root, overlay } = mount();
    overlay.dispose();
    expect(root.querySelector('.pf-mom')).toBeNull();
    await overlay.letterbox(true, 300);
    overlay.vignette(true);
    expect(overlay.el.dataset['letterbox']).toBe('0');
  });
});

// --------------------------------------------------------------------- css

describe('transitions.css', () => {
  it('reads its palette from the Ink & Gold tokens, with the spec values as fallbacks', () => {
    expect(CSS).toContain('var(--ig-accent, #e3b94a)');
    expect(CSS).toContain('var(--ig-paper, #f4f1e8)');
    // Slab geometry is the system's: skew the box, counter-skew the content.
    expect(CSS).toContain('skewX(var(--ig-skew, -12deg))');
    expect(CSS).toContain('skewX(var(--ig-skew-inverse, 12deg))');
  });

  it('keeps every moving part out of the way of reduced motion', () => {
    const reduced = CSS.slice(CSS.indexOf('prefers-reduced-motion'));
    for (const selector of ['.pf-swirl__blade', '.pf-mom__bar', '.pf-mom__slab', '.pf-beat']) {
      expect(reduced).toContain(selector);
    }
  });

  it('does not touch the HUD grid or any other agent’s selectors', () => {
    // Every rule in this file is either a swirl, a moment layer or the shared
    // beat; nothing here may reach into `.ffxhud` or the 640x360 stage.
    expect(CSS).not.toContain('.ffxhud');
    expect(CSS).not.toContain('.lb-stage');
  });
});
