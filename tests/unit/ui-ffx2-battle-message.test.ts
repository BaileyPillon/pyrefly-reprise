// @vitest-environment jsdom
/**
 * PR-0143 (round 11): the FFX-2 HUD draws the engine's `message` events.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. FFX's HUD already had its
 * banner (`FFXBattleHud.setMessage`); the FFX-2 HUD dropped every message, so
 * Steal and Pilfer Gil worked and said nothing. The engine half is proved by
 * running the real FFX-2 engine (Chapter VI, Act I and Act III, as
 * `ffx2-steal.test.ts` does) and feeding its own event log to the HUD.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BattleEvent, Command } from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_ACT_I, LEBLANC_ACT_III } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { BANNER_GAP, BANNER_TOP, MESSAGE_HOLD_MS, bannerSlot, messageParts } from '../../src/ui/ffx2/battleMessage.ts';

function engineFor(groupId: string, seed: number): FFX2Engine {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
    atbMode: 'wait',
  });
  const group = data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`no group ${groupId}`);
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: chateauBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

/** Advance to Rikku's menu (everyone else Defends), submit `abilityId`, return the events it produced. */
function rikkuDoes(engine: FFX2Engine, abilityId: string, targetId: string): BattleEvent[] {
  for (let i = 0; i < 5000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error('battle ended first');
    if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
    if (d.kind !== 'player-input') continue;
    if (d.actorId !== 'rikku') { engine.submit({ kind: 'defend', targets: [] }); continue; }
    const row = d.commands.find((c) => 'id' in c.command && c.command.id === abilityId);
    if (!row || !row.enabled) throw new Error(`${abilityId} not offered`);
    const from = engine.state().log.length;
    engine.submit({ ...row.command, targets: [targetId] } as Command);
    return engine.state().log.slice(from);
  }
  throw new Error('Rikku never got a turn');
}

function banner(root: HTMLElement): HTMLElement {
  const el = root.querySelector<HTMLElement>('[data-role="battle-message"]');
  if (!el) throw new Error('no message banner mounted');
  return el;
}
const nameOf = (root: HTMLElement): string => banner(root).querySelector('[data-role="name"]')!.textContent ?? '';
const chipOf = (root: HTMLElement): string => banner(root).querySelector('[data-role="chip"]')!.textContent ?? '';

describe('messageParts (FFX-2 banner reading order)', () => {
  it('puts the actor in the name slot and trims an exact restated name', () => {
    expect(messageParts('Rikku stole Budget Grenade!', 'Rikku')).toEqual({ name: 'Rikku', chip: 'stole Budget Grenade!' });
    expect(messageParts('Rikku pilfered 1,500 gil!', 'Rikku')).toEqual({ name: 'Rikku', chip: 'pilfered 1,500 gil!' });
  });
  it('keeps the whole line when it does not start with the actor', () => {
    expect(messageParts('Nothing was stolen!', 'Rikku')).toEqual({ name: 'Rikku', chip: 'Nothing was stolen!' });
    expect(messageParts('Ormi has no gil to take', 'Rikku')).toEqual({ name: 'Rikku', chip: 'Ormi has no gil to take' });
    // "Rikkuu" is not "Rikku " — no partial-word trim.
    expect(messageParts('Rikkuu waves', 'Rikku').chip).toBe('Rikkuu waves');
    expect(messageParts('Not linked', '')).toEqual({ name: '', chip: 'Not linked' });
  });
});

describe('FFX2BattleHud draws battle messages (PR-0143)', () => {
  let root: HTMLElement;
  let hud: FFX2BattleHud;

  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement('div');
    document.body.appendChild(root);
    hud = new FFX2BattleHud();
    hud.mount(root);
  });
  afterEach(() => {
    hud.unmount();
    root.remove();
    vi.useRealTimers();
  });

  it('mounts one hidden banner, an .ig-banner right after the telegraph, outside the party rows and the help band', () => {
    const el = banner(root);
    expect(el.hidden).toBe(true);
    expect(el.classList.contains('ig-banner')).toBe(true);
    expect(el.previousElementSibling?.classList.contains('ffx2hud__telegraph')).toBe(true);
    expect(el.closest('.ffx2hud__party')).toBeNull();
    expect(el.closest('.ffx2-cmd-info')).toBeNull();
    expect(root.querySelectorAll('[data-role="battle-message"]')).toHaveLength(1);
  });

  it('shows the real engine\'s Steal line on the Dr. Goon, named for Rikku, and never blocks playback', () => {
    let shown = false;
    for (let seed = 1; seed <= 20 && !shown; seed++) {
      const engine = engineFor(LEBLANC_ACT_I, seed);
      hud.sync(engine.state(), { elapsedMs: 0, bars: [] });
      const events = rikkuDoes(engine, 'x2-thief-steal', 'dr-goon');
      const msg = events.find((e) => e.type === 'message');
      expect(msg).toBeDefined();
      for (const e of events) expect(hud.onEvent(e)).toBeUndefined(); // no promise: FFX-2's clock never waits on it
      expect(banner(root).hidden).toBe(false);
      expect(nameOf(root)).toBe('Rikku');
      if (msg?.type === 'message' && /^Rikku stole /.test(msg.text)) {
        expect(chipOf(root)).toMatch(/^stole (Budget Grenade|Grenade)!$/);
        expect(`${nameOf(root)} ${chipOf(root)}`).toBe(msg.text);
        shown = true;
      } else {
        expect(chipOf(root)).toBe('Nothing was stolen!');
      }
    }
    expect(shown).toBe(true);
  });

  it('shows Pilfer Gil\'s amount from the real engine (Leblanc, 1,500 gil)', () => {
    const engine = engineFor(LEBLANC_ACT_III, 3);
    hud.sync(engine.state(), { elapsedMs: 0, bars: [] });
    const leblanc = engine.state().enemyIds.find((id) => engine.state().combatants[id]?.name === 'Leblanc')!;
    for (const e of rikkuDoes(engine, 'x2-thief-pilfer-gil', leblanc)) void hud.onEvent(e);
    expect(nameOf(root)).toBe('Rikku');
    expect(chipOf(root)).toBe('pilfered 1,500 gil!');
  });

  it('hides after the hold, and a new line restarts it', () => {
    void hud.onEvent({ seq: 1, type: 'message', text: 'Not linked', kind: 'system' });
    expect(banner(root).hidden).toBe(false);
    expect(nameOf(root)).toBe('');
    expect(banner(root).querySelector<HTMLElement>('[data-role="name"]')!.hidden).toBe(true);
    vi.advanceTimersByTime(MESSAGE_HOLD_MS - 100);
    void hud.onEvent({ seq: 2, type: 'message', text: 'Nothing was stolen!', kind: 'system' });
    vi.advanceTimersByTime(MESSAGE_HOLD_MS - 100);
    expect(banner(root).hidden).toBe(false);
    expect(chipOf(root)).toBe('Nothing was stolen!');
    vi.advanceTimersByTime(200);
    expect(banner(root).hidden).toBe(true);
  });

  it('leaves the charge telegraph standing when a message arrives', () => {
    void hud.onEvent({ seq: 1, type: 'charge', enemyId: 'bahamut', name: 'Mega Flare', turnsLeft: 1, stage: 1 });
    void hud.onEvent({ seq: 2, type: 'message', text: 'Nothing was stolen!', kind: 'system' });
    expect(root.querySelector<HTMLElement>('.ffx2hud__telegraph')!.hidden).toBe(false);
    expect(root.querySelector('.ffx2hud__telegraph')!.textContent).toContain('Mega Flare');
    expect(banner(root).hidden).toBe(false);
  });

  it('removes the banner on unmount', () => {
    hud.unmount();
    expect(root.querySelector('[data-role="battle-message"]')).toBeNull();
    hud.mount(root); // afterEach unmounts again
  });
});

describe('bannerSlot: the banner finds its own free spot (round 11 repair)', () => {
  // A 200 x 32 banner at the approved slot: right-anchored (right edge 618.67), top 17.78.
  const box = { left: 418.67, top: BANNER_TOP, right: 618.67, bottom: BANNER_TOP + 32 };

  it('keeps the approved slot when nothing is there', () => {
    expect(bannerSlot({ box, obstacles: [] })).toEqual({ anchor: 'right', top: BANNER_TOP });
  });

  it('steps under the telegraph, then under the intent slab, in the right-hand column', () => {
    const telegraph = { left: 480, top: 17.78, right: 618.67, bottom: 49.78 };
    expect(bannerSlot({ box, obstacles: [telegraph] })).toEqual({ anchor: 'right', top: 49.78 + BANNER_GAP });
    // Ch. IV measured: the slab at viewport 1186,75-1561,396 on a 2.5x stage.
    const slab = { left: 474.4, top: 30, right: 624.4, bottom: 158.4 };
    expect(bannerSlot({ box, obstacles: [telegraph, slab] })).toEqual({ anchor: 'right', top: 158.4 + BANNER_GAP });
  });

  it('tries the left-hand column when the right one is full, and gives up (null) when both are', () => {
    const rightColumn = { left: 400, top: 0, right: 640, bottom: 360 };
    expect(bannerSlot({ box, obstacles: [rightColumn] })).toEqual({ anchor: 'left', top: BANNER_TOP });
    expect(bannerSlot({ box, obstacles: [rightColumn, { left: 0, top: 0, right: 250, bottom: 360 }] })).toBeNull();
  });
});

describe('nothing yields to the banner; the banner yields (round 11 repair)', () => {
  const SCALE = 2.5;
  const px = (g: { left: number; top: number; right: number; bottom: number }): DOMRect =>
    ({
      left: g.left * SCALE,
      top: g.top * SCALE,
      right: g.right * SCALE,
      bottom: g.bottom * SCALE,
      width: (g.right - g.left) * SCALE,
      height: (g.bottom - g.top) * SCALE,
      x: g.left * SCALE,
      y: g.top * SCALE,
      toJSON: () => ({}),
    }) as DOMRect;
  const fake = (el: Element, g: { left: number; top: number; right: number; bottom: number } | null): void => {
    el.getBoundingClientRect = () => px(g ?? { left: 0, top: 0, right: 0, bottom: 0 });
  };
  let root: HTMLElement;
  let hud: FFX2BattleHud;
  let slab: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    root = document.createElement('div');
    document.body.appendChild(root);
    hud = new FFX2BattleHud();
    hud.mount(root);
    const el = banner(root);
    fake(el.parentElement!, { left: 0, top: 0, right: 640, bottom: 360 });
    // The banner's box follows its inline top/left, 200 x 32 on the grid.
    el.getBoundingClientRect = () => {
      const top = el.style.top ? parseFloat(el.style.top) : BANNER_TOP;
      const left = el.style.left ? parseFloat(el.style.left) : 640 - 21.33 - 200;
      return el.hidden ? px({ left: 0, top: 0, right: 0, bottom: 0 }) : px({ left, top, right: left + 200, bottom: top + 32 });
    };
    // The intent slab where ch. IV measured it (top-right, under the band).
    slab = document.createElement('div');
    slab.className = 'eint__panel';
    fake(slab, { left: 474.4, top: 30, right: 624.4, bottom: 158.4 });
    root.querySelector('.ffx2hud__overlay')!.appendChild(slab);
  });
  afterEach(() => {
    hud.unmount();
    root.remove();
    vi.useRealTimers();
  });

  it('never enters the intent slab\'s board, so the slab does not move when a line shows or hides', async () => {
    const { boardRects } = await import('../../src/ui/ffx2/intentBoard.ts');
    const before = boardRects(root, { scale: SCALE, chipReach: 12 });
    void hud.onEvent({ seq: 1, type: 'message', text: 'Rikku pilfered 2,200 gil!', kind: 'system' });
    expect(banner(root).hidden).toBe(false);
    expect(boardRects(root, { scale: SCALE, chipReach: 12 })).toEqual(before);
    void hud.onEvent({ seq: 2, type: 'message', text: 'Not linked', kind: 'system' });
    expect(boardRects(root, { scale: SCALE, chipReach: 12 })).toEqual(before);
  });

  it('steps under the slab instead of hiding behind it, with the slab left where it was', () => {
    void hud.onEvent({ seq: 1, type: 'message', text: 'Rikku pilfered 2,200 gil!', kind: 'system' });
    const el = banner(root);
    expect(el.style.top).toBe(`${158.4 + BANNER_GAP}px`);
    expect(el.dataset['slot']).toBe('right@161');
    expect(slab.getBoundingClientRect().top).toBe(30 * SCALE);
  });

  it('hides (never hops) when the next girl\'s command menu lands on it, and stays up for a chain chip', async () => {
    void hud.onEvent({ seq: 1, type: 'message', text: 'Rikku stole Grenade!', kind: 'system' });
    const el = banner(root);
    const chip = document.createElement('div');
    chip.className = 'ffx2-chain-chip';
    fake(chip, { left: 420, top: 160, right: 500, bottom: 175 });
    root.querySelector('.ffx2hud__overlay')!.appendChild(chip);
    vi.advanceTimersByTime(50);
    expect(el.hidden).toBe(false);
    const top = el.style.top;
    const command = root.querySelector<HTMLElement>('.ffx2hud__command')!;
    fake(command, { left: 450, top: 140, right: 628, bottom: 243 });
    command.hidden = false;
    // Before any frame: the `hidden` flip itself is watched, so the menu is never painted over the line.
    await Promise.resolve();
    expect(el.hidden).toBe(true);
    expect(el.style.top).toBe(top);
    expect(el.dataset['yielded']).toContain('ffx2hud__command');
  });

  it('keeps the approved slot when no spot is free, and only a newcomer ends the line', () => {
    fake(slab, { left: 0, top: 0, right: 640, bottom: 360 });
    void hud.onEvent({ seq: 1, type: 'message', text: 'Nothing was stolen!', kind: 'system' });
    const el = banner(root);
    expect(el.dataset['slot']).toBe('approved');
    vi.advanceTimersByTime(50);
    expect(el.hidden).toBe(false);
    const plate = document.createElement('div');
    plate.className = 'ffx2-aplate';
    fake(plate, { left: 540, top: 22, right: 618, bottom: 39 });
    root.querySelector('.ffx2hud')!.appendChild(plate);
    vi.advanceTimersByTime(50);
    expect(el.hidden).toBe(true);
  });
});
