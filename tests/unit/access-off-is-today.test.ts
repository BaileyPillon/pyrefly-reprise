// @vitest-environment jsdom
/**
 * With REDUCE FLASHES and COLOUR VISION both OFF (their defaults) nothing changes (PR-0032): not a pixel, not a number, not a stylesheet rule.
 * This file pins that across the build, in one place; each feature's own file pins its own side (`flash-*.test.ts`, `colour-vision.test.ts`).
 *
 * What "nothing" means here:
 *  - the shipped defaults of every old setting are the ones they were, and the two new ones are off;
 *  - `<html>` carries no `data-reduce-flashes`, no `data-colour-vision` and no `--cvd-*` variable, so no rule of the two new stylesheets can match;
 *  - every selector of the two new stylesheets is scoped under those attributes (the only unscoped one, `.stm--initial`, styles a mark that exists
 *    only while a mode is on);
 *  - the flash rules the code already had (SpellFxParams, the eye-candy env, the phase lighting) read OFF;
 *  - the numbers the presenter, the stage and the cutscene stage use today are the numbers they use.
 *
 * Game case: both (shared plumbing).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { SaveStore, defaultSettings } from '../../src/app/SaveData.ts';
import { applyComfort } from '../../src/app/applyComfort.ts';
import { makeFxEnv } from '../../src/app/fxEnv.ts';
import { readColourVision, readReduceFlashes } from '../../src/app/accessFlags.ts';
import { battleFlashParams } from '../../src/app/screens/battleSpellFx.ts';
import { SAVE_SPHERE_TIMING } from '../../src/app/screens/SaveSphereCard.ts';
import { CUTSCENE_FLASH_PEAK } from '../../src/engine/flashRules.ts';
import { DEFAULT_FLASH_PARAMS } from '../../src/engine/spellfx/SpellFxParams.ts';
import { cvdVars } from '../../src/ui/common/colourVision.ts';

const read = (p: string): string => readFileSync(resolve(__dirname, '..', '..', p), 'utf8');
const mem = (): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> => ({ getItem: () => null, setItem: () => undefined, removeItem: () => undefined });
const html = (): HTMLElement => document.documentElement;

afterEach(() => {
  applyComfort({});
});

describe('the shipped defaults', () => {
  it('every old setting keeps its default; the two new ones are off', () => {
    const d = defaultSettings();
    expect({ ...d, reduceMotion: false }).toMatchObject({
      masterVolume: 0.8,
      musicVolume: 0.7,
      textSpeed: 1,
      skipSeenCutscenes: false,
      lowEffects: false,
      textSize: 1,
      guideVisible: true,
      advisorVisible: true,
      intentVisible: true,
      ffx2Atb: 'wait',
      pausePanelsHidden: false,
      battleHelp: true,
      reduceFlashes: false,
      colourVision: 'off',
    });
  });
});

describe('<html>', () => {
  it('a fresh save puts exactly what it always put on <html>: the text size, nothing of the two new settings', () => {
    applyComfort({});
    new SaveStore('off-is-today', mem());
    for (const k of Object.keys(html().dataset)) expect(['textSize', 'textSizeWide', 'reduceMotion'], k).toContain(k);
    expect(html().hasAttribute('data-reduce-flashes')).toBe(false);
    expect(html().hasAttribute('data-colour-vision')).toBe(false);
    for (const name of Object.keys(cvdVars('red-green'))) expect(html().style.getPropertyValue(name), name).toBe('');
    expect(html().getAttribute('style') ?? '').not.toContain('--cvd');
  });

  it('turning both on and off again leaves <html> as it was', () => {
    applyComfort({ textSize: 1 });
    const before = [html().getAttribute('style'), JSON.stringify({ ...html().dataset })];
    applyComfort({ textSize: 1, reduceFlashes: true, colourVision: 'blue-yellow' });
    expect(html().hasAttribute('data-reduce-flashes')).toBe(true);
    applyComfort({ textSize: 1, reduceFlashes: false, colourVision: 'off' });
    expect([html().getAttribute('style'), JSON.stringify({ ...html().dataset })]).toEqual(before);
  });
});

describe('the code reads OFF', () => {
  it('the live readers answer false and off', () => {
    new SaveStore('off-readers', mem());
    expect(readReduceFlashes()).toBe(false);
    expect(readColourVision()).toBe('off');
  });

  it('the eye-candy env\'s REDUCE FLASHES (which sets the impact frame, the lens flare, the spell moments, the splash and the arena lighting) is false', () => {
    new SaveStore('off-env', mem());
    expect(makeFxEnv(() => 0, () => ({ width: 1600, height: 900 }))().reduceFlashes).toBe(false);
  });

  it('the spell effects get today\'s flashes, the very frozen object', () => {
    new SaveStore('off-spell', mem());
    expect(battleFlashParams()).toBe(DEFAULT_FLASH_PARAMS);
    expect(DEFAULT_FLASH_PARAMS).toEqual({ washCap: 1, whiteWashTo: null, oneWashPerAction: false, actorCap: 1, singleBolt: false });
  });
});

describe('the numbers the build uses today are the numbers it uses', () => {
  it('the cutscene flash starts at 70 %, the Save Sphere\'s beats are 520 / 1700 / 620 ms', () => {
    expect(CUTSCENE_FLASH_PEAK).toBe(0.7);
    expect(SAVE_SPHERE_TIMING).toEqual({ washIn: 520, hold: 1700, washOut: 620 });
  });

  it('the stylesheets the softer rules replace still carry today\'s numbers (the new rules sit beside them, never inside them)', () => {
    expect(read('src/ui/ffx/ffx-hud.css')).toMatch(/\.ffx-stat--hurt \{ animation: ffx-hurt-flash 0\.3s ease; \}/);
    expect(read('src/ui/ffx2/ffx2-hud.css')).toMatch(/animation: ffx2-hit-flash 0\.2s ease-out;/);
    expect(read('src/ui/ffx/minigames/overdrive-minigames.css')).toMatch(/\.ffx-mg--success \{ animation: ffx-mg-flash-success 0\.24s ease; \}/);
    expect(read('src/ui/common/damage-numbers.css')).toMatch(/\.dnum--mp \{\s*background: linear-gradient\(180deg, #8fd0f0 0%, #3a8fd0 100%\);/);
    expect(read('src/ui/ffx2/party-prep/party-prep.css')).toMatch(/\.x2prep-gate--green \{\s*background: #75913a;/);
  });
});

describe('the two new stylesheets match nothing while both settings are off', () => {
  /** Every selector (not keyframe stops, not at-rules) of a stylesheet, one per comma. */
  function selectorsOf(css: string): string[] {
    const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
    /** A selector list split on its top-level commas only (`:is(.a, .b)` stays whole). */
    const split = (list: string): string[] => {
      const out: string[] = [];
      let depth = 0;
      let cur = '';
      for (const ch of list) {
        if (ch === '(' || ch === '[') depth++;
        if (ch === ')' || ch === ']') depth--;
        if (ch === ',' && depth === 0) {
          out.push(cur.trim());
          cur = '';
        } else cur += ch;
      }
      out.push(cur.trim());
      return out;
    };
    return [...bare.matchAll(/(?:^|\})\s*([^{}@\s][^{}]*)\{/g)]
      .map((m) => m[1]!.trim())
      .filter((s) => !/^[\d%,.\s]+$/.test(s) && !/^(from|to)$/.test(s))
      .flatMap(split)
      .filter(Boolean);
  }

  it('comfort-flashes.css: every selector is under html[data-reduce-flashes] (the gauge also under REDUCE MOTION, which already did this for its own rules)', () => {
    const sels = selectorsOf(read('src/ui/common/comfort-flashes.css'));
    expect(sels.length).toBeGreaterThan(10);
    for (const s of sels) expect(s, s).toMatch(/^html\[data-reduce-(flashes|motion)\] /);
  });

  it('colour-vision.css: every selector is under html[data-colour-vision], except the mark that only exists under a mode', () => {
    const sels = selectorsOf(read('src/ui/common/colour-vision.css'));
    expect(sels.length).toBeGreaterThan(20);
    for (const s of sels) {
      if (/^\.stm--initial/.test(s)) continue; // the B and C over a head: StatusMarks draws them only while a mode is on
      expect(s, s).toMatch(/^html\[data-colour-vision\] /);
    }
  });
});
