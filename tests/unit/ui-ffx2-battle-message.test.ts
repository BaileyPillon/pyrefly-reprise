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
import { MESSAGE_HOLD_MS, messageParts } from '../../src/ui/ffx2/battleMessage.ts';
import { plateInputFromDom } from '../../src/ui/ffx2/TargetPlates.ts';

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

describe('the target plates treat the telegraph and the message banner as one box', () => {
  const rectEl = (r: { left: number; top: number; right: number; bottom: number } | null): HTMLElement => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () =>
      (r
        ? { ...r, width: r.right - r.left, height: r.bottom - r.top, x: r.left, y: r.top, toJSON: () => ({}) }
        : { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    return el;
  };
  const base = {
    host: { left: 0, top: 0, width: 640, height: 360, right: 640, bottom: 360, x: 0, y: 0, toJSON: () => ({}) } as DOMRect,
    stageX: 0, stageY: 0, scale: 1, chip: null, command: null, band: null, bandGridHeight: 17.33, partyFence: null,
    overlay: document.createElement('div'),
  };

  it('unions the two when both are up', () => {
    const input = plateInputFromDom({
      ...base,
      telegraph: rectEl({ left: 500, top: 18, right: 619, bottom: 50 }),
      message: rectEl({ left: 400, top: 53, right: 619, bottom: 85 }),
    });
    expect(input.telegraph).toEqual({ left: 400, top: 18, right: 619, bottom: 85 });
  });

  it('uses the message alone when no telegraph is up, and nothing when neither is', () => {
    const msgOnly = plateInputFromDom({ ...base, telegraph: rectEl(null), message: rectEl({ left: 400, top: 18, right: 619, bottom: 50 }) });
    expect(msgOnly.telegraph).toEqual({ left: 400, top: 18, right: 619, bottom: 50 });
    expect(plateInputFromDom({ ...base, telegraph: rectEl(null), message: rectEl(null) }).telegraph).toBeNull();
  });
});

describe('the enemy-intent slab steers around the message banner', () => {
  it('lists the banner with the plates\' margin and the E HIDE chip\'s reach below it', async () => {
    const { boardRects } = await import('../../src/ui/ffx2/intentBoard.ts');
    const root = document.createElement('div');
    const el = document.createElement('div');
    el.className = 'ig-banner ffx2hud__message';
    el.getBoundingClientRect = () => ({ left: 1127, top: 44, right: 1555, bottom: 122, width: 428, height: 78, x: 1127, y: 44, toJSON: () => ({}) }) as DOMRect;
    root.append(el);
    const rects = boardRects(root, { scale: 2.5, chipReach: 12 });
    // pad = 3 grid units x 2.5; below = pad + chip reach.
    expect(rects).toEqual([{ left: 1119.5, top: 36.5, right: 1562.5, bottom: 141.5 }]);
  });
});
