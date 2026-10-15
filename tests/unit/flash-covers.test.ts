// @vitest-environment jsdom
/**
 * REDUCE FLASHES on the two covers and the flashes around them (PR-0032; sources 16 and 17 of `flash-sources.test.ts`):
 *
 *  16. The Save Sphere wash (FFX-2, Chapter XI): today 74 % pale lilac-white over the whole frame, 520 ms in, 1.7 s hold, 620 ms out, and the sphere
 *      pulses. The next link is staged UNDER it, so it is a cover: with the setting on it stays opaque but is ivory at 35 % brightness, the beat
 *      lengths are the same, and the pulse stops.
 *  17. Cutscene flashes (both games): white or cream, 140 ms to 1.2 s, in the scripts. Today 70 % at the step's colour; with the setting on 35 % in
 *      ivory, and the two long whites (the Shuyin cannon's 900 ms, Sinspawn Gui's 1200 ms over a scene swap) are covers: opaque, dim, same length.
 *
 * Game case: 16 FFX-2 only; 17 both.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { SaveStore } from '../../src/app/SaveData.ts';
import { CutsceneStage } from '../../src/app/screens/CutsceneStage.ts';
import { SAVE_SPHERE_SOFT_CLASS, SAVE_SPHERE_TIMING, playSaveSphereCard } from '../../src/app/screens/SaveSphereCard.ts';
import { COVER_MS, DIM_IVORY, FLASH_PEAK_CAP, IVORY, cutsceneFlash } from '../../src/engine/flashRules.ts';

const mem = (): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k) };
};
const css = (p: string): string => readFileSync(resolve(__dirname, '..', '..', p), 'utf8');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('16. Save Sphere wash (FFX-2, Chapter XI)', () => {
  /** What the card looks like while the swap runs under it. */
  async function underTheWash(on: boolean): Promise<{ classes: string[]; cover: string }> {
    new SaveStore('cover-' + String(on), mem()).setSettings({ reduceFlashes: on });
    const root = document.createElement('div');
    document.body.appendChild(root);
    let seen = { classes: [] as string[], cover: '' };
    await playSaveSphereCard({
      root,
      sleep: () => Promise.resolve(),
      swap: async () => {
        const el = root.querySelector<HTMLElement>('.ssphere')!;
        seen = { classes: [...el.classList], cover: el.style.getPropertyValue('--ssphere-cover') };
      },
    });
    return seen;
  }

  it('off: the card is today\'s, with no soft class and no cover colour', async () => {
    const seen = await underTheWash(false);
    expect(seen.classes).not.toContain(SAVE_SPHERE_SOFT_CLASS);
    expect(seen.cover).toBe('');
  });

  it('on: the card wears the soft class and carries the dim ivory cover', async () => {
    const seen = await underTheWash(true);
    expect(seen.classes).toContain(SAVE_SPHERE_SOFT_CLASS);
    expect(seen.cover.toLowerCase()).toBe(DIM_IVORY.toLowerCase());
  });

  it('the beat lengths are today\'s (520 ms in, 1.7 s hold, 620 ms out): only the colour and the pulse change', () => {
    expect(SAVE_SPHERE_TIMING).toEqual({ washIn: 520, hold: 1700, washOut: 620 });
  });

  it('the stylesheet: today\'s wash is pale lilac-white at 74 % and the sphere pulses; the soft class makes the wash the opaque dim ivory and stops the pulse', () => {
    const sheet = css('src/app/screens/save-sphere-card.css');
    expect(sheet).toMatch(/background: rgba\(246, 240, 250, 0\.74\);/);
    expect(sheet).toMatch(/animation: ssphere-pulse 1600ms ease-in-out 620ms infinite alternate;/);
    expect(sheet).toMatch(/\.ssphere--soft \.ssphere__wash \{\s*background: var\(--ssphere-cover, #59544b\);\s*\}/i);
    expect(sheet).toMatch(/\.ssphere--soft\.ssphere--in \.ssphere__orb \{\s*animation: none;\s*\}/);
    expect('#59544b').toBe(DIM_IVORY.toLowerCase());
    // the wash it replaces is a cover over a 74 % lilac-white frame: the dim ivory is far under that brightness
    const dim = parseInt(DIM_IVORY.slice(1, 3), 16);
    expect(dim / 255).toBeLessThanOrEqual(FLASH_PEAK_CAP);
  });
});

describe('17. Cutscene flashes (both games)', () => {
  function stageOn(on: boolean): { flash: (colour: string | undefined, ms: number) => { background: string; opacity: string } } {
    new SaveStore('cutscene-' + String(on), mem()).setSettings({ reduceFlashes: on });
    const root = document.createElement('div');
    document.body.appendChild(root);
    const stage = new CutsceneStage(root, { wait: () => Promise.resolve() });
    stage.mount();
    return {
      flash: (colour, ms) => {
        void stage.flash(colour, ms);
        const el = root.querySelector<HTMLElement>('.cutscene__flash')!;
        return { background: el.style.background, opacity: el.style.opacity };
      },
    };
  }

  it('off: the step\'s colour (white by default) at 70 %, exactly today\'s', () => {
    const s = stageOn(false);
    expect(s.flash(undefined, 160)).toMatchObject({ opacity: '0.7' });
    expect(s.flash(undefined, 160).background).toMatch(/^(#ffffff|rgb\(255, 255, 255\))/);
    expect(s.flash('#fff1b8', 200).background).toMatch(/^(#fff1b8|rgb\(255, 241, 184\))/);
    expect(s.flash('#ffffff', 1200)).toMatchObject({ opacity: '0.7' });
  });

  it('on: a short white flash is ivory at 35 %; cream keeps its colour at 35 %', () => {
    const s = stageOn(true);
    const white = s.flash(undefined, 160);
    expect(white.opacity).toBe('0.35');
    expect(white.background).toMatch(/^(#fff1d6|rgb\(255, 241, 214\))/i);
    expect(s.flash('#fff1b8', 200)).toMatchObject({ opacity: '0.35' });
    expect(s.flash('#fff1b8', 200).background).toMatch(/^(#fff1b8|rgb\(255, 241, 184\))/);
  });

  it('on: the Shuyin cannon\'s 900 ms and Gui\'s 1200 ms whites are covers: opaque, dim ivory, never white', () => {
    const s = stageOn(true);
    for (const ms of [900, 1200]) {
      const f = s.flash('#ffffff', ms);
      expect(f.opacity, `${ms} ms`).toBe('1');
      expect(f.background, `${ms} ms`).toMatch(new RegExp(`^(${DIM_IVORY}|rgb\\(89, 84, 75\\))`, 'i'));
    }
  });

  it('every flash step in every shipped script, softened: none is a full-strength white frame, and the long whites are covers', () => {
    const scripts = import.meta.glob('../../src/story/scripts/*.ts', { eager: true }) as Record<string, Record<string, unknown>>;
    const steps: Array<{ ms: number; color?: string; file: string }> = [];
    const walk = (node: unknown, file: string): void => {
      if (Array.isArray(node)) return node.forEach((n) => walk(n, file));
      if (node && typeof node === 'object') {
        const o = node as Record<string, unknown>;
        if (o['type'] === 'flash' && typeof o['ms'] === 'number') steps.push({ ms: o['ms'], ...(typeof o['color'] === 'string' ? { color: o['color'] } : {}), file });
        for (const v of Object.values(o)) walk(v, file);
      }
    };
    for (const [file, mod] of Object.entries(scripts)) walk(mod, file.split('/').pop()!);
    expect(steps.length, 'the shipped scripts flash').toBeGreaterThanOrEqual(12);
    const files = new Set(steps.map((s) => s.file.replace('.ts', '')));
    for (const f of ['evrae-airship', 'ffx2-vegnagun-shuyin', 'seymour-anima-macalania', 'seymour-natus', 'yojimbo-cavern', 'sinspawn-gui', 'sin-fins-core', 'ffx2-experiment', 'ffx2-ixion-djose']) {
      expect(files.has(f), `${f} flashes (the round's nine scripts)`).toBe(true);
    }
    for (const s of steps) {
      const today = cutsceneFlash(s.color, s.ms, false);
      const soft = cutsceneFlash(s.color, s.ms, true);
      expect(today.peak, `${s.file} ${s.ms} ms today`).toBe(0.7);
      if (s.ms >= COVER_MS && (s.color === undefined || s.color === '#ffffff')) {
        expect(soft, `${s.file} ${s.ms} ms is a cover`).toEqual({ background: DIM_IVORY, peak: 1 });
      } else {
        expect(soft.peak, `${s.file} ${s.ms} ms`).toBe(FLASH_PEAK_CAP);
        expect(soft.background.toLowerCase(), `${s.file} ${s.ms} ms is never pure white`).not.toBe('#ffffff');
      }
    }
    // a script is exported twice (named and default), so its steps are walked twice: count each once
    const longest = [...new Set(steps.filter((s) => s.ms >= 900).map((s) => `${s.file}:${s.ms}`))].sort();
    expect(longest).toEqual(['ffx2-vegnagun-shuyin.ts:900', 'sinspawn-gui.ts:1200']);
    expect(IVORY.toLowerCase()).toBe('#fff1d6');
  });
});
