// @vitest-environment jsdom
/**
 * **Doublecast as two picks: what the HUD draws around it** (FFX only; Option A "Second round", decision queue item 103, delegated).
 *
 * The real `FFXBattleHud` wrapped by `withDoublecastHud`, the real FFX engine's picker, real key presses, on Chapter III's Lulu: the slab's two lines (a numeral chip,
 * the spell and where it went, the MP in the numeral face), the MP preview on her card ("20 -8 -> 12") that survives the party window rebuilding its rows, the gold lock
 * chip on cast 1's target, the Sensor chip that no longer stands over the list after an Esc, the phone's reader of the slab, the greyed phone tile's reason line, and the
 * engine's picker seam.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { AnyCombatant, CombatantId } from '../../src/battle/common/types.ts';
import { doublecastPicks } from '../../src/battle/ffx/doublecast.ts';
import type { TargetingPort } from '../../src/engine/HudPort.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { withDoublecastHud } from '../../src/ui/ffx/DoublecastHud.ts';
import { SensorPanel } from '../../src/ui/ffx/SensorPanel.ts';
import { readFfxPhone } from '../../src/ui/ffx/phoneHud.ts';
import { rowsHtml, subRowVM } from '../../src/ui/ffx/commandMenuRows.ts';
import { wrappedGroup } from '../../src/ui/ffx/CommandMenuLogic.ts';
import { key, lulusTurn, walkTo } from './helpers/doublecastMenuRig.ts';

const PAGODA_A = 'yu-pagoda-left';
const PAGODA_B = 'yu-pagoda-right';
const BOSS = 'braskas-final-aeon';

afterEach(() => {
  document.body.innerHTML = '';
});

/** Boxes of the three fiends in the menu camera pose: A's top-left is clear, B stands mostly behind the boss. */
const BOXES: Record<string, { x: number; y: number; w: number; h: number }> = {
  [PAGODA_A]: { x: 571, y: 152, w: 238, h: 366 },
  [BOSS]: { x: 793, y: 42, w: 569, h: 556 },
  [PAGODA_B]: { x: 1132, y: 124, w: 241, h: 392 }, // the boss's box covers all of B's but 11 px
};

function rig(mp: number | undefined = 20): { hud: ReturnType<typeof wrapped>['hud']; root: HTMLElement; engine: ReturnType<typeof lulusTurn>['engine']; done: Promise<unknown> } {
  const { engine, commands } = lulusTurn(mp === undefined ? {} : { mp });
  const root = document.createElement('div');
  root.style.cssText = 'width:1600px;height:900px';
  document.body.append(root);
  const { hud } = wrapped(engine);
  hud.mount(root);
  const port: TargetingPort = { rect: (id) => BOXES[id] ?? null, select: () => undefined, xray: () => undefined, visibility: () => 1, setPanels: () => undefined };
  hud.setTargetingPort?.(port);
  hud.sync?.(engine.state(), engine.predictTurnOrder(10));
  const done = hud.chooseCommand('lulu', commands, () => []);
  return { hud, root, engine, done };
}

function wrapped(engine: ReturnType<typeof lulusTurn>['engine']): { hud: FFXBattleHud } {
  const hud = withDoublecastHud(new FFXBattleHud(), (actorId, firstId) => engine.doublecastPicks(actorId, firstId));
  return { hud };
}

const text = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
const slab = (root: HTMLElement): HTMLElement => root.querySelector<HTMLElement>('.ffx-cmd-info [data-role="text"]')!;
const mpOf = (root: HTMLElement): HTMLElement => root.querySelector<HTMLElement>('.ig-stat[data-actor="lulu"] .ig-stat__value--mp')!;

function toRoundTwo(): ReturnType<typeof rig> {
  const r = rig(20);
  walkTo('Special');
  key('Enter');
  walkTo('Doublecast');
  key('Enter');
  walkTo('Fira');
  key('Enter');
  key('Enter'); // the first target the cursor opens on
  return r;
}

describe('the slab, the MP preview and the lock chip in round 2', () => {
  it('writes the two lines, the MP preview and the lock chip', () => {
    const { root } = toRoundTwo();
    const help = slab(root).querySelector('.ffx-dc-help');
    expect(help, 'the slab holds the two-line form').not.toBeNull();
    expect(text(help?.querySelector('.ffx-dc-n'))).toBe('1');
    expect(text(help?.querySelector('.ffx-dc-t'))).toMatch(/^Fira › Yu Pagoda/);
    expect(text(help?.querySelector('.ffx-dc-mp'))).toBe('8 MP');
    expect(text(help?.querySelector('.ffx-dc-h2'))).toBe('12 MP left. Choose the second cast.');
    expect(help?.querySelector('.ffx-dc-h2 b')?.textContent, 'the MP number is in the numeral face').toBe('12 MP');
    // The MP preview on Lulu's card.
    expect(text(mpOf(root).querySelector('.ffx-stat__pend'))).toBe('20−8→ 12');
    // The gold lock chip, on cast 1's target, inside the overlay.
    const lock = root.querySelector<HTMLElement>('.ffxhud__overlay .ffx-dc-lock');
    expect(lock, 'the lock chip').not.toBeNull();
    expect(lock!.hidden).toBe(false);
    expect(text(lock)).toBe('1Fira');
    expect(parseFloat(lock!.style.left)).toBeGreaterThanOrEqual(BOXES[PAGODA_A]!.x);
    expect(parseFloat(lock!.style.top)).toBeGreaterThanOrEqual(BOXES[PAGODA_A]!.y);
  });

  it('the MP preview survives the party window rebuilding its rows (the next frame puts it back)', () => {
    const { hud, root, engine } = toRoundTwo();
    expect(mpOf(root).querySelector('.ffx-stat__pend')).not.toBeNull();
    hud.sync?.(engine.state(), engine.predictTurnOrder(10)); // a sync rebuilds the party rows
    expect(mpOf(root).querySelector('.ffx-stat__pend')).toBeNull();
    hud.update?.(0.016);
    expect(mpOf(root).querySelectorAll('.ffx-stat__pend')).toHaveLength(1);
    hud.update?.(0.016);
    expect(mpOf(root).querySelectorAll('.ffx-stat__pend'), 'once, not once per frame').toHaveLength(1);
  });

  it('a plain help line replaces the two lines, and Esc takes every extra off the card and the field', () => {
    const { root } = toRoundTwo();
    walkTo('Blizzard');
    key('Enter'); // round 2's target step: the lock chip stays, the slab names cast 2
    expect(text(slab(root).querySelector('.ffx-dc-n'))).toBe('2');
    expect(text(slab(root).querySelector('.ffx-dc-h2'))).toBe('Pick its target. 8 MP left after.');
    expect(root.querySelector('.ffx-dc-lock')).not.toBeNull();
    key('Escape'); // > list 2
    key('Escape'); // > target 1: cast 1 is being re-aimed, nothing is locked
    expect(root.querySelector('.ffx-dc-lock'), 'no lock chip while cast 1 is being re-aimed').toBeNull();
    expect(root.querySelector('.ffx-stat__pend')).toBeNull();
    key('Escape'); // > list 1: plain help again
    expect(slab(root).querySelector('.ffx-dc-help')).toBeNull();
    expect(text(slab(root))).toMatch(/^Doublecast: two spells in one turn/);
  });

  it('the final target clears the chrome, and the command is the two picks', async () => {
    const { root, done } = toRoundTwo();
    walkTo('Blizzard');
    key('Enter');
    key('Enter');
    expect(await done).toMatchObject({ kind: 'ability', id: 'doublecast', casts: [{ id: 'fira' }, { id: 'blizzard' }] });
    expect(root.querySelector('.ffx-dc-lock')).toBeNull();
    expect(root.querySelector('.ffx-stat__pend')).toBeNull();
  });

  it('the lock chip on Yu Pagoda B stays off the boss (fix d)', () => {
    const { root } = rig(20);
    walkTo('Special');
    key('Enter');
    walkTo('Doublecast');
    key('Enter');
    walkTo('Fira');
    key('Enter');
    key('ArrowRight'); // the cursor steps to the next fiend on screen; keep stepping until it is on B
    for (let i = 0; i < 4 && !root.querySelector(`.ffx-target[data-target-id="${PAGODA_B}"]:not(.ffx-target--dim)`); i++) key('ArrowRight');
    key('Enter'); // cast 1 at B
    const lock = root.querySelector<HTMLElement>('.ffx-dc-lock')!;
    const x = parseFloat(lock.style.left);
    const y = parseFloat(lock.style.top);
    const box = BOXES[PAGODA_B]!;
    // The box is all but covered by the boss's, so the chip is not at B's top-left (the boss's torso): it is on B's own box, away from that corner.
    expect([x, y], "not at the top-left of the box, which is the boss torso").not.toEqual([box.x + 2, box.y + 2]);
    expect(x).toBeGreaterThanOrEqual(box.x - 45);
    expect(x).toBeLessThanOrEqual(box.x + box.w);
    expect(y).toBeGreaterThan(box.y + 100);
    expect(y).toBeLessThan(box.y + box.h - 100);
  });
});

describe('Esc out of a target step clears the Sensor chip (fix c; it did not before, in any chapter)', () => {
  it('through the HUD: aim at a Yu Pagoda, Esc, and the folded "I YU PAGODA" chip is gone', () => {
    const { hud } = rig(20);
    walkTo('Attack');
    key('Enter'); // Attack opens its target step
    const plate = hud.enemyPlate.el;
    expect(plate.hidden, 'the aim opened the plate').toBe(false);
    key('Escape');
    expect(plate.hidden, 'Esc takes the plate and its chip off the field').toBe(true);
  });

  it('a plate the aim opened goes; a Sensor reveal and a plate the player opened by hand do not', () => {
    const target = { id: 'e1', name: 'Yu Pagoda', hp: 10, stats: { maxHp: 10 }, statuses: {}, affinities: {}, flags: {}, immunityFlags: [] } as unknown as AnyCombatant;
    const aimed = new SensorPanel();
    aimed.focus(target, true);
    expect(aimed.el.hidden).toBe(false);
    aimed.aimCancelled();
    expect(aimed.el.hidden).toBe(true);
    const scanned = new SensorPanel();
    scanned.show(target);
    scanned.aimCancelled();
    expect(scanned.el.hidden, 'a reveal keeps its own lifetime').toBe(false);
    const pinned = new SensorPanel();
    pinned.focus(target);
    pinned.toggle(); // folded
    pinned.toggle(); // opened by hand
    pinned.aimCancelled();
    expect(pinned.el.hidden, 'a plate the player opened stays').toBe(false);
  });
});

describe('the phone reads the slab (and a greyed tile says why)', () => {
  it('a list step: the footer takes the phone sentence; a target step: the strip does, and the footer is empty', () => {
    const { root } = toRoundTwo();
    const hud = root.querySelector<HTMLElement>('.ffxhud')!;
    expect(readFfxPhone(hud)).toMatchObject({ help: '12 MP left after Fira. Choose the second cast.', targeting: false });
    expect(readFfxPhone(hud).step).toBeUndefined();
    walkTo('Blizzard');
    key('Enter');
    const t = readFfxPhone(hud);
    expect(t.help).toBe('');
    expect(t.step).toEqual({ n: '2', text: 'Cast 2 · after 1 Fira › Yu Pagoda A' });
  });

  it('a greyed row gets a reason line (shown on a phone tile only), a row that is fine does not', () => {
    const { commands } = lulusTurn({ mp: 20 });
    const wrapper = commands.find((c) => c.wrapsCategory)!;
    const group = wrappedGroup(wrapper, commands)!;
    const grey = group.items.map((c) => (c.label === 'Firaga' ? { ...c, enabled: false, disabledReason: 'Not enough MP' } : c));
    const html = rowsHtml(grey.map((c) => subRowVM(c, group, {} as Record<CombatantId, AnyCombatant>)), 0, grey.length, 0);
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    const rows = [...doc.querySelectorAll('.ig-cmd')];
    expect(rows.filter((r) => r.querySelector('.ffx-cmd__reason'))).toHaveLength(1);
    expect(text(rows.find((r) => r.classList.contains('ig-cmd--disabled'))?.querySelector('.ffx-cmd__reason'))).toBe('Not enough MP');
  });
});

describe('the engine\'s picker seam', () => {
  it('FFXEngine.doublecastPicks is the module\'s picker on the live context, and nothing for an unknown actor', () => {
    const { engine } = lulusTurn({ mp: 20 });
    const ctx = (engine as unknown as { ctx: Parameters<typeof doublecastPicks>[0] }).ctx;
    const actor = engine.state().combatants['lulu'] as unknown as Parameters<typeof doublecastPicks>[1];
    expect(engine.doublecastPicks('lulu', 'fira')).toEqual(doublecastPicks(ctx, actor, 'fira'));
    expect(engine.doublecastPicks('lulu')).toEqual(doublecastPicks(ctx, actor));
    expect(engine.doublecastPicks('nobody', 'fira')).toEqual([]);
  });

  it('is read-only: asking changes nothing (no MP, no stream drawn)', () => {
    const { engine } = lulusTurn({ mp: 20 });
    const before = JSON.stringify(engine.state());
    for (const id of ['fire', 'fira', 'firaga']) engine.doublecastPicks('lulu', id);
    expect(JSON.stringify(engine.state())).toBe(before);
  });

  it('is wired: createHud binds it for an FFX engine (the engine is the picker\'s only source)', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/app/screens/BattleScreenWiring.ts'), 'utf8');
    expect(src).toMatch(/withDoublecastHud\([\s\S]*engine instanceof FFXEngine \? \(actorId, firstId\) => engine\.doublecastPicks\(actorId, firstId\) : null\)/);
  });
});
