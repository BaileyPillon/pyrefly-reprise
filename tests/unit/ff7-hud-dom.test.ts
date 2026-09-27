// @vitest-environment jsdom
/**
 * The FF7 battle HUD through its real port (`HudPort`), driven by the
 * deterministic fixture with real key and click events: the band, the command
 * window, the Wait level, the target step, messages, damage numerals, the
 * Limit gauge and "Limit" in slot 1, the TIME gauge. Plus the scope check:
 * nothing under `src/ui/ff7/` reaches into an FFX or FFX-2 HUD, and its CSS
 * never leaves `.ff7hud` (rule 14, spec §7 item 17). Game case: FF7 only.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Command } from '../../src/battle/common/types.ts';
import { Ff7BattleHud } from '../../src/ui/ff7/Ff7BattleHud.ts';
import { Ff7HudFixture, HINT_LINES } from '../../src/ui/ff7/ff7HudFixture.ts';
import { messageSeconds } from '../../src/ui/ff7/Ff7HelpLine.ts';
import { limitLetterColours } from '../../src/ui/ff7/ff7Tokens.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
}

function tap(el: Element | null): void {
  expect(el, 'tap target').not.toBeNull();
  el!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

let host: HTMLDivElement;
let hud: Ff7BattleHud;
let fx: Ff7HudFixture;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  fx = new Ff7HudFixture();
  hud = new Ff7BattleHud({ size: () => ({ w: 1600, h: 900 }), itemCount: (id) => fx.items[id] });
  hud.mount(host);
  const at: Record<string, { x: number; y: number }> = { 'guard-scorpion': { x: 560, y: 470 }, cloud: { x: 1000, y: 470 }, barret: { x: 1150, y: 470 } };
  hud.setProjector((id) => at[id] ?? null);
  hud.sync(fx.state(), fx.gauges());
});

afterEach(() => {
  hud.unmount();
  host.remove();
});

const q = (sel: string): HTMLElement | null => hud.root.querySelector(sel);
const texts = (sel: string): string[] => [...hud.root.querySelectorAll(sel)].map((e) => e.textContent ?? '');

describe('the band', () => {
  it('shows NAME and BARRIER on the left, HP, MP, LIMIT and TIME once on the right, and no enemy name', () => {
    expect(texts('[data-win="names"] .ff7-hdr')).toEqual(['NAME', 'BARRIER']);
    expect(texts('[data-win="status"] .ff7-hdr')).toEqual(['HP', 'MP', 'LIMIT', 'TIME']);
    expect(texts('.ff7-name')).toEqual(['Cloud', 'Barret']);
    expect(hud.root.textContent).not.toMatch(/Guard Scorpion|ENEMY/);
  });

  it('prints HP as cur/ max and MP as the current value only', () => {
    expect(texts('.ff7-hp')).toEqual(['279', '150']);
    expect(texts('.ff7-hpmax')).toEqual(['316', '317']);
    expect(texts('.ff7-mp')).toEqual(['57', '43']);
  });

  it('turns HP yellow at or below a quarter of max', () => {
    fx.fighters['barret']!.hp = 79; // 317 / 4 = 79.25
    hud.syncVitals(fx.state());
    const [cloud, barret] = [...hud.root.querySelectorAll<HTMLElement>('.ff7-hp')];
    expect(cloud!.style.color).not.toBe(barret!.style.color);
    expect(hud.inspect().rows[1]!.hpLow).toBe(true);
  });

  it('moves the TIME gauge from syncGauges alone, and marks a full bar', () => {
    const fill = (): string => (q('[data-id="barret"] .ff7-time')?.nextElementSibling?.nextElementSibling as HTMLElement | null)?.style.width ?? '';
    const before = fill();
    fx.tick(0.5);
    hud.syncGauges(fx.gauges());
    expect(fill()).not.toBe(before);
    expect(q('[data-id="cloud"] .ff7-time')?.classList.contains('is-full')).toBe(true);
  });
});

describe('the command window, by real keys', () => {
  it('opens on Attack with the ready triangle over Cloud; Magic, then Esc, then Attack on the boss', async () => {
    const levels: string[] = [];
    hud.onMenuLevel((l) => levels.push(l));
    const chosen = hud.chooseCommand('cloud', fx.commands('cloud'));
    expect(texts('.ff7-slot')).toEqual(['Attack', 'Magic', 'Item']);
    expect(hud.inspect().ready).toBe('cloud');
    expect(q('[data-ready="cloud"]')).not.toBeNull();
    key('ArrowDown');
    key('Enter');
    expect(hud.inspect().menu?.view).toBe('magic');
    expect(texts('[data-win="magic"] .ff7-row-label')).toEqual(['Ice', 'Bolt']);
    expect(q('[data-win="mp-needed"]')?.textContent).toContain('57');
    key('Escape');
    key('ArrowUp');
    key('Enter');
    expect(hud.inspect().menu?.view).toBe('target');
    expect(q('.ff7-cur--target[data-target="guard-scorpion"]')).not.toBeNull();
    key('Enter');
    await expect(chosen).resolves.toEqual({ kind: 'attack', targets: ['guard-scorpion'] } satisfies Command);
    expect(levels).toContain('deep');
    expect(levels[levels.length - 1]).toBe('top');
    expect(hud.inspect().ready).toBeNull();
    expect(q('[data-win="command"]')).toBeNull();
  });

  it('a tap chooses a row, a tap on a figure aims, a second tap confirms', async () => {
    const chosen = hud.chooseCommand('cloud', fx.commands('cloud'));
    tap(q('.ff7-hit[data-slot="3"]'));
    expect(hud.inspect().menu?.view).toBe('item');
    expect(texts('[data-win="item"] .ff7-row-label')).toEqual(['Potion', 'Phoenix Down']);
    tap(q('.ff7-hit[data-row="0"]'));
    tap(q('.ff7-hit--target[data-target="barret"]'));
    tap(q('.ff7-hit--target[data-target="barret"]'));
    await expect(chosen).resolves.toEqual({ kind: 'item', id: 'potion', targets: ['barret'] });
  });

  it('H shows the help window, closeCommandMenu abandons the promise and clears the window', () => {
    void hud.chooseCommand('cloud', fx.commands('cloud'));
    key('KeyH');
    expect(hud.inspect().message).toBe('Attack');
    hud.closeCommandMenu();
    expect(q('[data-win="command"]')).toBeNull();
    expect(hud.inspect().menu).toBeNull();
  });
});

describe('what the battle tells it', () => {
  it('queues messages one at a time and closes the window after the last', () => {
    for (const text of HINT_LINES) hud.onEvent({ seq: 0, type: 'message', text, kind: 'story' });
    expect(q('.ff7-msg')?.textContent).toBe(HINT_LINES[0]);
    hud.update(messageSeconds(HINT_LINES[0]) + 0.01);
    expect(q('.ff7-msg')?.textContent).toBe(HINT_LINES[1]);
    hud.update(10);
    hud.update(10);
    expect(q('[data-win="message"]')).toBeNull();
  });

  it('plays the Tail Laser: the name up top, two numerals, a full Limit that blinks, then "Limit" in slot 1', async () => {
    const chosen = hud.chooseCommand('cloud', fx.commands('cloud'));
    key('Enter');
    key('Enter');
    const cmd = await chosen;
    for (const e of fx.respond('cloud', cmd)) {
      hud.onEvent(e);
      if (e.type === 'damage') hud.syncVitals(fx.state());
    }
    expect(hud.inspect().message).toBe('Tail Laser');
    expect([...hud.root.querySelectorAll('.ff7-dmg')].map((e) => (e as HTMLElement).dataset['value'])).toEqual(['21', '74', '73']);
    expect(texts('.ff7-hp')).toEqual(['205', '77']);
    expect(hud.inspect().rows[0]!.limitReady).toBe(true);
    const full = (): string => q('[data-id="cloud"] .ff7-limit')?.nextElementSibling?.nextElementSibling?.getAttribute('style') ?? '';
    const a = full();
    hud.update(0.26);
    expect(full()).not.toBe(a); // mint <-> peach
    hud.update(1);
    expect(hud.root.querySelectorAll('.ff7-dmg').length).toBe(0);

    hud.sync(fx.state(), fx.gauges());
    void hud.chooseCommand('cloud', fx.commands('cloud'));
    const letters = (): string[] => [...hud.root.querySelectorAll<HTMLElement>('.ff7-slot[data-slot="0"] span')].map((s) => s.style.color);
    expect(texts('.ff7-slot')[0]).toBe('Limit');
    const first = letters();
    expect(first).toHaveLength(5);
    hud.update(0.1);
    expect(letters()).not.toEqual(first);
    expect(limitLetterColours(0)).not.toEqual(limitLetterColours(1));
    key('Enter');
    expect(q('[data-win="limit"]')?.textContent).toContain('LIMIT LEVEL 1');
    expect(q('[data-win="limit"]')?.textContent).toContain('Braver');
  });

  it('prints green for recovery and Miss for a whiff', () => {
    hud.onEvent({ seq: 1, type: 'damage', targetId: 'cloud', amount: -100, element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    hud.onEvent({ seq: 2, type: 'miss', targetId: 'guard-scorpion', sourceId: 'cloud', reason: 'evaded' });
    const nums = [...hud.root.querySelectorAll<HTMLElement>('.ff7-dmg')];
    expect(nums[0]!.innerHTML).toContain('#80F080');
    expect(nums[1]!.textContent).toBe('Miss');
  });
});

describe('scope (FF7 only)', () => {
  const dir = join(ROOT, 'src', 'ui', 'ff7');
  const files = readdirSync(dir);

  it('imports no FFX, FFX-2, Ink & Gold or coach module except the shared Esc claim', () => {
    for (const f of files.filter((n) => n.endsWith('.ts'))) {
      const src = readFileSync(join(dir, f), 'utf8');
      const bad = [...src.matchAll(/from '(\.\.\/(?:ffx|ffx2|inkgold|coach)\/[^']+)'/g)].map((m) => m[1]).filter((p) => p !== '../ffx/cancelClaim.ts');
      expect(bad, f).toEqual([]);
    }
  });

  it('keeps every CSS rule under .ff7hud', () => {
    const css = readFileSync(join(dir, 'ff7-hud.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors = [...css.matchAll(/(^|})\s*([^{}@][^{}]*)\{/g)].map((m) => m[2]!.trim()).filter((s) => !/^(\d+%|from|to)$/.test(s) && !s.startsWith('@'));
    expect(selectors.length).toBeGreaterThan(5);
    for (const s of selectors) for (const part of s.split(',')) expect(part.trim(), s).toMatch(/^\.ff7hud\b/);
  });

  it('keeps every file under 400 lines (house rule 7)', () => {
    for (const f of files) expect(readFileSync(join(dir, f), 'utf8').split('\n').length, f).toBeLessThan(400);
  });
});
