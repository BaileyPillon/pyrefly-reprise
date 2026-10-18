// @vitest-environment jsdom
/**
 * **Doublecast as two picks, by real keys** (FFX only; Option A "Second round", decision queue item 103, delegated; the engine lane is
 * `docs/handoff/re-parity-rc10-ffx-doublecast.md`, the HUD's is `docs/handoff/doublecast-hud.md`).
 *
 * PR-0125 made Special > Doublecast ask for a spell and then that spell's own target (before it, the row's self-only `validTargets` read as a finished aim and Firaga
 * went twice on Lulu). The game composes it as two such pairs: the list comes back for the second cast, with the first cast's price held against it, and the second
 * target commits both. Driven through the real `CommandMenu` with real `KeyboardEvent`s on the real command list the FFX engine offers Lulu in Chapter III; the command
 * that comes out is submitted back to that engine and the log is read.
 *
 * Two runs: the natural one (One MP Cost, every spell 1 MP, nothing can grey) and the disclosed edit the mockups used (One MP Cost stripped, MP chosen, so the costs are the
 * engine's real ones: Fire 4, Fira 8, Firaga 16).
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { AnyCombatant, CombatantId } from '../../src/battle/common/types.ts';
import type { DoublecastPick } from '../../src/battle/ffx/doublecast.ts';
import { aimAt, greyedLabels, key, openMenu, openRoundOne, pick, selectedLabel, visibleLabels, walkTo, type Harness } from './helpers/doublecastMenuRig.ts';

const PAGODA_A = 'yu-pagoda-left';
const PAGODA_B = 'yu-pagoda-right';
const BOSS = 'braskas-final-aeon';

const lulu = (h: Harness): AnyCombatant & { mp: number } => h.engine.state().combatants['lulu'] as AnyCombatant & { mp: number };

/** Every row of the open list with whether it is greyed, found by walking the cursor down the whole list. */
function collectRows(): Map<string, boolean> {
  const seen = new Map<string, boolean>();
  const take = (): void => {
    for (const row of document.querySelectorAll('.ig-cmd')) seen.set(row.querySelector('.ffx-cmd__label')?.textContent ?? '', row.classList.contains('ig-cmd--disabled'));
  };
  take();
  for (let i = 0; i < 20; i++) {
    key('ArrowDown');
    take();
  }
  return seen;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('round 1: the Black Magic list, headed 1 of 2', () => {
  it('Special > Doublecast shows the list, not a finished cast', async () => {
    const h = openMenu();
    walkTo('Special');
    key('Enter');
    expect(h.menu.breadcrumbEl.textContent).toBe('Special');
    walkTo('Doublecast');
    key('Enter');
    await Promise.resolve();
    expect(h.resolved(), 'the Doublecast row used to close the menu with targets [lulu]').toBeNull();
    expect(h.menu.stackEl.hidden).toBe(false);
    expect(h.menu.breadcrumbEl.hidden).toBe(false);
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast · 1 of 2');
    const labels = visibleLabels();
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) expect(['Fire', 'Fira', 'Firaga', 'Blizzard', 'Blizzara', 'Blizzaga', 'Thunder', 'Thundara', 'Thundaga', 'Water', 'Watera', 'Waterga', 'Bio']).toContain(l);
    // No payer claim, no total: what Doublecast is, then the highlighted spell's own effect.
    expect(h.help()).toMatch(/^Doublecast: two spells in one turn/);
    expect(h.help()).not.toMatch(/pays its own MP/);
  });

  it('the first spell opens its own target step, with its spell and price on the slab', () => {
    const h = openMenu({ mp: 20 });
    openRoundOne();
    walkTo('Fira');
    key('Enter');
    expect(h.selection()?.mode).toBe('single');
    expect(new Set(h.engine.state().enemyIds).has(h.aimed()!)).toBe(true);
    expect(h.aimed()).not.toBe('lulu');
    expect(h.rich()).toMatchObject({ chip: '1', head: 'Fira · 8 MP' });
    expect(h.rich()?.line2).toEqual(['Pick a target for the first cast.']);
    expect(h.rich()?.phone).toEqual({ at: 'step', n: '1', text: 'Cast 1 of 2 · Fira · 8 MP' });
  });
});

describe('round 2: the list comes back with the first cast held against it', () => {
  it('confirming the first target submits nothing: the list returns, 2 of 2, the cursor on the spell just used', async () => {
    const h = openMenu({ mp: 20 });
    openRoundOne();
    pick(h, 'Fira', PAGODA_A);
    await Promise.resolve();
    expect(h.resolved(), 'one pick is not a Doublecast').toBeNull();
    expect(h.selection()).toBeNull(); // the target step is over
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast · 2 of 2');
    expect(selectedLabel()).toBe('Fira');
    // The slab holds cast 1 over what is left; the plain sentence is what a reader of the slab gets.
    expect(h.rich()).toMatchObject({ chip: '1', head: 'Fira › Yu Pagoda A', mp: '8 MP' });
    expect(h.rich()?.line2).toEqual([{ num: '12 MP' }, ' left. Choose the second cast.']);
    expect(h.help()).toBe('1 Fira › Yu Pagoda A, 8 MP. 12 MP left. Choose the second cast.');
    expect(h.rich()?.phone).toEqual({ at: 'foot', text: '12 MP left after Fira. Choose the second cast.' });
    // The HUD is told what to draw: the lock chip's target, and the MP preview "20 -8 -> 12".
    expect(h.views.at(-1)).toEqual({ round: 2, actorId: 'lulu', firstTargetId: PAGODA_A, firstLabel: 'Fira', pending: { mp: 20, spent: 8, left: 12 } });
  });

  it('rows the MP left cannot pay are greyed, from the engine\'s own verdict, and keep their prices', () => {
    const h = openMenu({ mp: 20 });
    openRoundOne();
    pick(h, 'Fira', PAGODA_A);
    const verdicts = new Map(h.engine.doublecastPicks('lulu', 'fira').map((p) => [p.name, !p.second!.enabled]));
    const seen = collectRows();
    expect(seen.size).toBeGreaterThanOrEqual(10);
    for (const [label, greyed] of seen) expect(greyed, `${label} is greyed iff the engine says its second pick is not offered`).toBe(verdicts.get(label));
    expect(seen.get('Firaga')).toBe(true); // 8 + 16 > 20
    expect(seen.get('Fire')).toBe(false);
    expect(seen.get('Fira')).toBe(false); // repeating the first spell is legal when it fits
    for (const row of document.querySelectorAll('.ig-cmd--disabled')) expect(row.querySelector('.ffx-cmd__badge--mp')?.textContent, 'a greyed row keeps its price').toMatch(/^\d+MP$/);
  });

  it('the second target submits both casts: each its own spell and its own target, and the engine plays them in order', async () => {
    const h = openMenu({ mp: 20 });
    openRoundOne();
    pick(h, 'Fira', PAGODA_A);
    walkTo('Blizzard');
    key('Enter');
    expect(h.selection()?.mode).toBe('single');
    expect(h.rich()).toMatchObject({ chip: '2', head: 'Blizzard · 4 MP' });
    expect(h.rich()?.line2).toEqual(['Pick its target. ', { num: '8 MP' }, ' left after.']);
    expect(h.rich()?.phone).toEqual({ at: 'step', n: '2', text: 'Cast 2 · after 1 Fira › Yu Pagoda A' });
    expect(h.aimed(), 'the cursor opens on cast 1\'s target: the same again is one press').toBe(PAGODA_A);
    aimAt(h, PAGODA_B);
    key('Enter');
    const cmd = await h.done;
    expect(cmd).toEqual({ kind: 'ability', id: 'doublecast', targets: [], casts: [{ id: 'fira', targets: [PAGODA_A] }, { id: 'blizzard', targets: [PAGODA_B] }] });
    expect(h.views.at(-1)).toBeNull(); // the chrome is cleared with the menu

    const before = lulu(h).mp;
    const events = h.engine.submit(cmd) as unknown as Array<Record<string, unknown>>;
    const starts = events.filter((e) => e['type'] === 'action-start') as unknown as Array<{ abilityName: string; targets: string[] }>;
    expect(starts.map((s) => [s.abilityName, s.targets])).toEqual([['Doublecast: Fira', [PAGODA_A]], ['Doublecast: Blizzard', [PAGODA_B]]]);
    expect(events.filter((e) => e['type'] === 'damage' && e['sourceId'] === 'lulu').map((e) => e['targetId'])).toEqual([PAGODA_A, PAGODA_B]);
    expect(before - lulu(h).mp, 'Fira 8 then Blizzard 4, each at its own price').toBe(12);
  });

  it('the natural Chapter III run (One MP Cost): nothing greys, 1 MP each, and the same spell twice is one bracket', async () => {
    const h = openMenu();
    openRoundOne();
    const mp = lulu(h).mp;
    pick(h, 'Firaga', BOSS);
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast · 2 of 2');
    expect(greyedLabels()).toEqual([]);
    expect(selectedLabel()).toBe('Firaga');
    expect(h.views.at(-1)).toMatchObject({ pending: { mp, spent: 1, left: mp - 1 } });
    key('Enter'); // Firaga again
    expect(h.aimed()).toBe(BOSS);
    key('Enter');
    const cmd = await h.done;
    expect(cmd).toEqual({ kind: 'ability', id: 'doublecast', targets: [], casts: [{ id: 'firaga', targets: [BOSS] }, { id: 'firaga', targets: [BOSS] }] });
    const events = h.engine.submit(cmd) as unknown as Array<Record<string, unknown>>;
    expect(events.filter((e) => e['type'] === 'action-start')).toHaveLength(1);
    expect(events.filter((e) => e['type'] === 'damage' && e['sourceId'] === 'lulu').map((e) => e['targetId'])).toEqual([BOSS, BOSS]);
    expect(mp - lulu(h).mp).toBe(2);
  });
});

describe('the cursor in round 2 (fix a)', () => {
  it('lands on the nearest offered row when the spell just used is greyed', () => {
    const h = openMenu({ mp: 30 });
    openRoundOne();
    pick(h, 'Firaga', BOSS); // 16 held, 14 left: Firaga (16) is no longer offered
    expect(h.engine.doublecastPicks('lulu', 'firaga').find((p) => p.id === 'firaga')!.second!.enabled).toBe(false);
    expect(selectedLabel(), 'Fira, the nearest offered row above').toBe('Fira');
    expect(greyedLabels()).toContain('Firaga');
  });
});

describe('Esc steps back one stage at a time (and a tap on the title does the same)', () => {
  it('target 2 > list 2 > target 1 (cast 1 kept, the cursor on its old target) > list 1 > the Special list', () => {
    const h = openMenu({ mp: 20 });
    openRoundOne();
    pick(h, 'Fira', PAGODA_B);
    walkTo('Blizzard');
    key('Enter');
    expect(h.selection()?.mode).toBe('single');
    const cancelsBefore = h.cancels();
    key('Escape'); // target 2 > list 2
    expect(h.selection()).toBeNull();
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast · 2 of 2');
    expect(selectedLabel()).toBe('Blizzard');
    expect(h.cancels(), 'Esc out of a target step clears the Sensor chip').toBe(cancelsBefore + 1);
    key('Escape'); // list 2 > target 1
    expect(h.selection()?.mode).toBe('single');
    expect(h.aimed(), 'cast 1 is re-aimed from where it was').toBe(PAGODA_B);
    expect(h.rich()).toMatchObject({ chip: '1', head: 'Fira · 8 MP' });
    expect(h.views.at(-1), 'the lock chip and the MP preview are gone').toBeNull();
    key('Escape'); // target 1 > list 1
    expect(h.selection()).toBeNull();
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast · 1 of 2');
    expect(selectedLabel()).toBe('Fira');
    key('Escape'); // list 1 > the Special list
    expect(h.menu.breadcrumbEl.textContent).toBe('Special');
    expect(selectedLabel()).toBe('Doublecast');
    // And forward again still works after backing all the way out.
    key('Enter');
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast · 1 of 2');
  });

  it('a tap on the list title is Back inside a Doublecast (a phone has no Esc)', () => {
    const h = openMenu({ mp: 20 });
    openRoundOne();
    pick(h, 'Fira', PAGODA_A);
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast · 2 of 2');
    h.menu.breadcrumbEl.click();
    expect(h.selection()?.mode).toBe('single'); // cast 1's target step
    key('Escape');
    h.menu.breadcrumbEl.click();
    expect(h.menu.breadcrumbEl.textContent).toBe('Special');
    h.menu.breadcrumbEl.click(); // outside a Doublecast the title is not a button
    expect(h.menu.breadcrumbEl.textContent).toBe('Special');
  });

  it('re-aiming cast 1 replaces it: the new pick, not the old one, is submitted', async () => {
    const h = openMenu({ mp: 20 });
    openRoundOne();
    pick(h, 'Fira', PAGODA_A);
    key('Escape'); // > target 1
    aimAt(h, PAGODA_B);
    key('Enter'); // cast 1 is now Fira at B; list 2 again
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast · 2 of 2');
    walkTo('Fire');
    key('Enter');
    key('Enter');
    const cmd = await h.done;
    expect((cmd as { casts: Array<{ id: string; targets: string[] }> }).casts).toEqual([{ id: 'fira', targets: [PAGODA_B] }, { id: 'fire', targets: [PAGODA_B] }]);
  });
});

describe('the dead end: no second spell is offered', () => {
  it('every row stays greyed, nothing is committed, the slab says so and names Esc, and Back works', async () => {
    const h = openMenu({ mp: 10 });
    openRoundOne();
    pick(h, 'Fira', PAGODA_A); // 8 held, 2 left: nothing in the list costs 2 or less
    await Promise.resolve();
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast · 2 of 2');
    expect(h.engine.doublecastPicks('lulu', 'fira').some((p) => p.second!.enabled)).toBe(false);
    const seen = collectRows();
    expect([...seen.values()].every(Boolean), 'every row is greyed').toBe(true);
    expect(h.help()).toMatch(/No second spell fits\. Esc goes back\./);
    expect(h.rich()?.phone).toEqual({ at: 'foot', text: 'No second spell fits. Tap the title to go back.' });
    key('Enter'); // a greyed row cannot be chosen
    key('Enter');
    await Promise.resolve();
    expect(h.resolved(), 'the menu never commits a single cast by itself').toBeNull();
    expect(h.selection()).toBeNull();
    key('Escape'); // Back: cast 1's target step
    expect(h.selection()?.mode).toBe('single');
    key('Escape');
    key('Escape');
    expect(h.menu.breadcrumbEl.textContent).toBe('Special');
  });
});

describe('the HUD hands the menu the engine\'s verdicts; the menu re-derives no cost rule', () => {
  const stub = (second: (id: string) => boolean, pendingMp: number, mpAfter: number) => (_actorId: CombatantId, firstId?: string): DoublecastPick[] =>
    ['fire', 'fira', 'firaga', 'blizzard', 'blizzara', 'blizzaga', 'thunder', 'thundara', 'thundaga', 'water', 'watera', 'waterga', 'bio'].map((id) => ({
      id,
      name: id[0]!.toUpperCase() + id.slice(1),
      mpCost: 1,
      first: { enabled: true },
      ...(firstId ? { second: { enabled: second(id), ...(second(id) ? {} : { reason: 'Not enough MP' as const }), pendingMp, mpAfter } } : {}),
    }));

  it('rich: a stub that offers only Fire is believed (300 MP, 1 MP spells: arithmetic would offer all of them)', () => {
    const h = openMenu({ picks: stub((id) => id === 'fire', 999, -5) });
    openRoundOne();
    pick(h, 'Fira', PAGODA_A);
    const seen = collectRows();
    expect(seen.get('Fire')).toBe(false);
    for (const [label, greyed] of seen) if (label !== 'Fire') expect(greyed, label).toBe(true);
    // The numbers on the card are the stub's pending MP, not a price the UI looked up.
    expect(h.views.at(-1)).toMatchObject({ pending: { spent: 999 } });
  });

  it('a stub that offers every row is believed too (MP 20, Firaga first: 16 + 16 > 20, yet the engine said yes)', () => {
    const h = openMenu({ mp: 20, picks: stub(() => true, 16, 4) });
    openRoundOne();
    pick(h, 'Firaga', BOSS);
    expect(greyedLabels()).toEqual([]);
    expect(h.views.at(-1)).toMatchObject({ pending: { mp: 20, spent: 16, left: 4 } });
  });

  it('with no picker (a mock screen, a fixture) both rounds play with the rows exactly as the engine offered them', async () => {
    const h = openMenu({ mp: 20, picks: false });
    openRoundOne();
    pick(h, 'Firaga', BOSS);
    expect(greyedLabels()).toEqual([]); // nothing is invented
    expect(h.views.at(-1)).toMatchObject({ pending: { mp: 20, spent: 16, left: 4 } }); // the row's own published price
    key('Enter');
    key('Enter');
    expect((await h.done) as unknown).toMatchObject({ id: 'doublecast', casts: [{ id: 'firaga' }, { id: 'firaga' }] });
  });
});
