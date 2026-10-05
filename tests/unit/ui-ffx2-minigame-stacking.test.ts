// @vitest-environment jsdom
/**
 * FOC371-02 (focused review of f4244e1f, polish; FFX-2 only): on desktop the enemy-intent card still painted over the
 * Trigger Happy slab. Release 37.1 gave the slab `z-index: 15`, but the slab lived in `.ffx2hud__stage`, whose
 * `transform` makes it a stacking context of its own, while the intent layer (`.eint`, `z-index: 2`) is a sibling of
 * that stage on the overlay: a z-index inside a stacking context cannot out-rank anything outside it, so the card
 * covered the ring, the hit counter and half the bar in Chapter V at 1600x900 (2 of 4 windows; on the phone the stage
 * has no transform and the 15 did win). The minigame layer is now a grid layer BESIDE the stage (the way the plates
 * layer already is), transformed exactly like it, with the z-index that carries the order.
 *
 * What is pinned here: the layer's place in the DOM, that it follows the stage's transform on every layout, that both
 * overlays mount into it, the z-order against the layers it must beat (parsed from the sheets), and the phone rule.
 * The browser proof (elementsFromPoint at the slab's left, centre and right with the card parked over it, 1600x900,
 * 2000x1012 and 390x844, Chapters IV and V) is in docs/handoff/r38-polish.md.
 *
 * **Game case: FFX-2 only.** Trigger Happy and Lady Luck are X-2 abilities and this is the FFX-2 HUD's own layer; the FFX
 * HUD has its own minigame stacking (overdrive-minigames.css) and is untouched.
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';

const read = (path: string): string => readFileSync(path, 'utf8');

/** The `z-index` of the (last) rule whose selector is exactly `selector`, or `null` when it sets none. */
function zIndexOf(css: string, selector: string): number | null {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = new RegExp(`(?:^|[}\\s])${escaped}\\s*\\{([^}]*)\\}`, 'g');
  let z: number | null = null;
  for (const m of stripped.matchAll(rule)) {
    const found = /z-index:\s*(-?\d+)/.exec(m[1] ?? '');
    if (found) z = Number(found[1]);
  }
  return z;
}

let hud: FFX2BattleHud | null = null;
let root: HTMLElement;

function setViewport(w: number, h: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: w });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: h });
}

beforeEach(() => {
  setViewport(1600, 900);
  root = document.createElement('div');
  document.body.appendChild(root);
  hud = new FFX2BattleHud();
  hud.mount(root);
});
afterEach(() => {
  hud?.unmount();
  hud = null;
  document.body.innerHTML = '';
});

describe('the FFX-2 minigame layer sits beside the stage, in the same stacking context as the intent card', () => {
  it('is a direct child of the HUD root, not of the transformed stage, after the overlay and before the plates', () => {
    const layer = root.querySelector<HTMLElement>('.ffx2hud__minigame')!;
    expect(layer).not.toBeNull();
    expect(layer.parentElement?.classList.contains('ffx2hud')).toBe(true);
    expect(layer.closest('.ffx2hud__stage')).toBeNull();
    const kids = [...layer.parentElement!.children].map((c) => c.className);
    const at = (cls: string): number => kids.findIndex((k) => k.split(' ').includes(cls));
    expect(at('ffx2hud__stage')).toBeLessThan(at('ffx2hud__overlay'));
    expect(at('ffx2hud__overlay')).toBeLessThan(at('ffx2hud__minigame'));
    expect(at('ffx2hud__minigame')).toBeLessThan(at('ffx2hud__plates'));
    // The enemy-intent slab is on the overlay: the layer and the card are now siblings' descendants of one context.
    expect(root.querySelector('.ffx2hud__overlay .eint')).not.toBeNull();
  });

  it('follows the stage transform on every layout, so the slabs keep their 640x360 authored geometry', () => {
    const stage = root.querySelector<HTMLElement>('.ffx2hud__stage')!;
    const layer = root.querySelector<HTMLElement>('.ffx2hud__minigame')!;
    expect(stage.style.transform).toBe('translate(0.00px, 0.00px) scale(2.5000)');
    expect(layer.style.transform).toBe(stage.style.transform);
    setViewport(2000, 1012);
    window.dispatchEvent(new Event('resize'));
    expect(stage.style.transform).toMatch(/^translate\(.*\) scale\(2\.8111\)$/);
    expect(layer.style.transform).toBe(stage.style.transform);
    setViewport(1024, 768);
    window.dispatchEvent(new Event('resize'));
    expect(layer.style.transform).toBe(stage.style.transform);
    expect(layer.style.transform).toMatch(/scale\(1\.6000\)/);
  });

  it('Trigger Happy and Lady Luck both mount into the layer, outside the stage', async () => {
    const trigger = hud!.openMinigame('gunner-trigger', { windowMs: 40 });
    const slab = root.querySelector<HTMLElement>('.ffx2hud > .ffx2hud__minigame > .ffx2-trigger');
    expect(slab).not.toBeNull();
    expect(slab!.closest('.ffx2hud__stage')).toBeNull();
    await trigger;
    const reels = hud!.openMinigame('ladyluck-reels', { timerMs: 40 });
    const overlay = root.querySelector<HTMLElement>('.ffx2hud > .ffx2hud__minigame > .ffx2-reels');
    expect(overlay).not.toBeNull();
    expect(overlay!.closest('.ffx2hud__stage')).toBeNull();
    await reels;
  });

  it('the stage template no longer carries a minigame layer of its own', () => {
    expect(read('src/ui/ffx2/FFX2BattleHud.ts')).not.toMatch(/<div class="ffx2hud__minigame"><\/div>/);
    expect(root.querySelector('.ffx2hud__stage .ffx2hud__minigame')).toBeNull();
  });
});

describe('the layer is above every card it can sit on, and under the pause', () => {
  const eint = zIndexOf(read('src/ui/common/enemy-intent.css'), '.eint');
  const guide = zIndexOf(read('src/ui/common/strategy-guide.css'), '.sgd');
  const advisor = zIndexOf(read('src/ui/common/move-advisor.css'), '.mad');
  const phoneChip = zIndexOf(read('src/ui/common/phone-battle.css'), "html[data-phone-battle] .phud-guide");
  const phonePause = zIndexOf(read('src/ui/common/phone-battle.css'), "html[data-phone-battle] .battle-pause-chip");
  const layer = zIndexOf(read('src/ui/ffx2/minigames.css'), '.ffx2hud > .ffx2hud__minigame');

  it('reads the layers (a renamed selector fails here, not silently)', () => {
    expect([eint, guide, advisor, phoneChip, phonePause]).toEqual([2, 3, 4, 12, 40]);
    expect(layer).not.toBeNull();
  });

  it('is above the intent slab, the guide, the advisor and the phone guide chip, and below the pause chips', () => {
    for (const other of [eint, guide, advisor, phoneChip]) expect(layer!).toBeGreaterThan(other!);
    expect(layer!).toBeLessThan(phonePause!);
    expect(layer!).toBeLessThan(zIndexOf(read('src/ui/common/pause-chip.css'), '.battle-pause-chip')!);
  });

  it('the layer is the stage’s box: 640x360 from the top-left corner, with the stage’s transform origin', () => {
    const rule = /\.ffx2hud\s*>\s*\.ffx2hud__minigame\s*\{([^}]*)\}/.exec(read('src/ui/ffx2/minigames.css'))?.[1] ?? '';
    expect(rule).toMatch(/width:\s*640px/);
    expect(rule).toMatch(/height:\s*360px/);
    expect(rule).toMatch(/transform-origin:\s*0 0/);
    expect(rule).toMatch(/top:\s*0/);
    expect(rule).toMatch(/left:\s*0/);
  });

  it('on the phone the layer drops the letterbox transform exactly as the stage and the plates do', () => {
    const phone = read('src/ui/ffx2/phone-hud.css');
    const rule =
      /((?:html\[data-phone-battle='ffx2'\] \.ffx2hud__[a-z]+\s*,\s*)+html\[data-phone-battle='ffx2'\] \.ffx2hud__[a-z]+)\s*\{([^}]*)\}/.exec(phone);
    expect(rule?.[1]).toMatch(/\.ffx2hud__stage/);
    expect(rule?.[1]).toMatch(/\.ffx2hud__plates/);
    expect(rule?.[1]).toMatch(/\.ffx2hud__minigame/);
    expect(rule?.[2]).toMatch(/transform:\s*none\s*!important/);
    expect(rule?.[2]).toMatch(/width:\s*100%\s*!important/);
    expect(rule?.[2]).toMatch(/height:\s*100%\s*!important/);
  });
});
