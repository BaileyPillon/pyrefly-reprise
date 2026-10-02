// @vitest-environment jsdom
/**
 * Release 35 interface lane. U1 (VP-1001-32/33/36, both games): the splash marks `<html>` for its lifetime and the
 * stylesheet fades the panels that print through the band. U2 (PR-0290, FFX-2 only): the phone cure hint names the
 * same cures as the desktop one.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { OverdriveSplashLayer, SPLASH_LIVE_CLASS } from '../../src/ui/common/transitions/OverdriveSplashLayer.ts';
import { cureHint } from '../../src/ui/common/statusWords.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS = readFileSync(join(ROOT, 'src/ui/common/transitions/overdrive-splash.css'), 'utf8');

afterEach(() => {
  document.documentElement.classList.remove(SPLASH_LIVE_CLASS);
  document.body.innerHTML = '';
});

describe('the splash fades the HUD panels that print through it (U1)', () => {
  it('marks <html> from play() until the splash ends, and an early stop clears it', async () => {
    const layer = new OverdriveSplashLayer(document.body, 'ffx');
    expect(document.documentElement.classList.contains(SPLASH_LIVE_CLASS)).toBe(false);
    const done = layer.play({ art: null, name: 'Mega Flare', at: null, mode: 'full', staticLines: false, holdMs: 700, from: 'right' });
    expect(document.documentElement.classList.contains(SPLASH_LIVE_CLASS)).toBe(true);
    layer.stop();
    await done;
    expect(document.documentElement.classList.contains(SPLASH_LIVE_CLASS)).toBe(false);
    layer.dispose();
  });

  it('a second play() keeps the mark on and dispose() clears it', () => {
    const layer = new OverdriveSplashLayer(document.body, 'ffx2');
    void layer.play({ art: null, name: 'Aerospark', at: null, mode: 'repeat', staticLines: false, holdMs: 500, from: 'right' });
    void layer.play({ art: null, name: 'Aerospark', at: null, mode: 'repeat', staticLines: false, holdMs: 500, from: 'right' });
    expect(document.documentElement.classList.contains(SPLASH_LIVE_CLASS)).toBe(true);
    layer.dispose();
    expect(document.documentElement.classList.contains(SPLASH_LIVE_CLASS)).toBe(false);
  });

  it('the stylesheet fades the turn order, cards, Sin clock, status smoke and CHARGING slab with opacity only', () => {
    const rule = CSS.match(/html\.fxc-splash-live :is\(([^)]*)\)\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    const [, list, body] = rule!;
    for (const sel of ['.ig-ctb', '.ffx-sensor', '.eint', '.sgd', '.mad', '.ffx-sinhud > *', '.ffx-zg', '.ffx2hud__command', '.stm-layer', '.pf-mom__slab', '.coach-mark']) {
      expect(list).toContain(sel);
    }
    expect(body).toMatch(/opacity:\s*0\s*!important/);
    expect(body).not.toMatch(/transform|top:|left:|display|visibility/);
  });
});

describe('the FFX-2 phone cure hint lists the whole cure table (U2, PR-0290)', () => {
  it('Curse and Silence short forms name every cure the full card does', () => {
    const curse = cureHint('ffx2', 'curse', 'Paine', 'paine')!;
    expect(curse.short).toMatch(/Holy Water.*Esuna.*Remedy/);
    const silence = cureHint('ffx2', 'silence', 'Rikku', 'rikku')!;
    expect(silence.short).toMatch(/Echo Screen.*Esuna.*Remedy/);
  });

  it('FFX keeps its own short Curse hint (Esuna and Remedy do not cure it there)', () => {
    expect(cureHint('ffx', 'curse', 'Tidus', 'tidus')!.short).not.toMatch(/Esuna|Remedy/);
  });
});
