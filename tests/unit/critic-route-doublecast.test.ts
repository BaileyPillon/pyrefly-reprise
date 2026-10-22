/**
 * Lulu's Doublecast on the review route (CHK-022, Chapter III; the release 58 focused review): `critic/runner/lib/route-doublecast.mjs`.
 *
 * The card names both casts, `"Doublecast: Firaga + Firaga"`; the Doublecast list's rows are the spell names alone. The route used to look for one row containing the card's whole text after
 * the colon (`firaga + firaga`), found none, and after two failures turned every later Doublecast into an Attack: in the review's Chapter III run (`braskas-final-aeon-win-2a1777281/run.json`)
 * `dcFail` was 2, `doublecast` held two records of `[{ found: 'Doublecast' }, { k: 0, spell: null }]`, and 84 of the 368 picks wanted a Doublecast and pressed Attack (the boss stood at about half HP
 * when the party fell, on live r57 too). The card text, the Special rows and the recorded steps below are that run's.
 *
 * Game case: FFX only (only the FFX engine publishes a wrapper row, `wrappedLabel` in src/engine/tactics/advisor.ts); the route's other picks are shared plumbing and are unchanged.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { containsSpellRow, doublecastCasts, isSpellRow, playDoublecast } from '../../critic/runner/lib/route-doublecast.mjs';

/** The card and the menus of the recorded run (run.json: `misses[0].want`, `.subRows`). */
const CARD = { label: 'Doublecast: Firaga + Firaga', target: "Braska's Final Aeon", menu: 'Special' };
const TOP = ['Attack', 'Special', 'Black Magic', 'Item', 'Switch'];
const SPECIAL = ['Focus', 'Doublecast', 'Scan']; // as recorded
/** Lulu's Black Magic, Firaga listed before Fira on purpose: a contains-match for "fira" would take the wrong row. */
const BLACK = ['Fire', 'Thunder', 'Water', 'Blizzard', 'Firaga', 'Fira', 'Thundaga', 'Aero'];

/** The menu as the HUD walks it: top list, Special, then two rounds of the Black Magic list and a target step each (src/ui/ffx/DoublecastFlow.ts). `choose` takes the first row that matches. */
function fakeMenu(over: { black?: string[] } = {}) {
  const log: string[] = [];
  let state: 'top' | 'special' | 'spell1' | 'target1' | 'spell2' | 'target2' | 'done' = 'top';
  const rows = (): string[] => ({ top: TOP, special: SPECIAL, spell1: over.black ?? BLACK, target1: [], spell2: over.black ?? BLACK, target2: [], done: [] }[state]);
  const chooser = {
    async choose(pred: (label: string) => boolean): Promise<string | null> {
      const hit = rows().find((r) => pred(r)) ?? null;
      log.push(`${state}:${hit ?? 'none'}`);
      if (!hit) return null;
      if (state === 'top' && hit === 'Special') state = 'special';
      else if (state === 'special' && hit === 'Doublecast') state = 'spell1';
      else if (state === 'spell1') state = 'target1';
      else if (state === 'spell2') state = 'target2';
      return hit;
    },
  };
  const targets: Array<string | null> = [];
  const confirmTarget = async (name: string | null): Promise<void> => {
    targets.push(name);
    if (state === 'target1') state = 'spell2';
    else if (state === 'target2') state = 'done';
  };
  const menuStillOpen = async (): Promise<boolean> => state !== 'done';
  return { chooser, confirmTarget, menuStillOpen, targets, log, state: () => state };
}

const run = (card: typeof CARD, menu = fakeMenu()) => playDoublecast({ chooser: menu.chooser, adv: card, confirmTarget: menu.confirmTarget, menuStillOpen: menu.menuStillOpen, wait: async () => undefined, turn: 48, phase: 'command:lulu' });

describe('the casts a Doublecast card names', () => {
  it('reads both, in order, from the card the advisor prints', () => {
    expect(doublecastCasts('Doublecast: Firaga + Firaga')).toEqual(['firaga', 'firaga']);
    expect(doublecastCasts('Doublecast: Fira + Blizzard')).toEqual(['fira', 'blizzard']);
    expect(doublecastCasts('  doublecast :  Thundaga+Aero ')).toEqual(['thundaga', 'aero']);
  });

  it('casts a card that names one spell twice, and reads nothing from a card that is not a Doublecast or names no spell', () => {
    expect(doublecastCasts('Doublecast: Firaga')).toEqual(['firaga', 'firaga']);
    expect(doublecastCasts('Attack')).toEqual([]);
    expect(doublecastCasts('Doublecast')).toEqual([]);
    expect(doublecastCasts(null)).toEqual([]);
  });

  it('matches a row by its name first and by containing it only as the second try', () => {
    expect(['Firaga', 'Fira'].filter(isSpellRow('fira'))).toEqual(['Fira']);
    expect(['Firaga', 'Fira'].filter(containsSpellRow('fira'))).toEqual(['Firaga', 'Fira']);
  });
});

describe('the route\'s Doublecast, against the recorded card and menus', () => {
  it('(the defect) release 58\'s route, verbatim, on the recorded card and menus, makes the recorded steps: Doublecast found, then no spell', async () => {
    const menu = fakeMenu();
    const spell = (CARD.label.split(':')[1] ?? '').trim().toLowerCase(); // route-fight.mjs at 2a1777281
    const steps: Array<{ found?: string | null; k?: number; spell?: string | null }> = [];
    if (await menu.chooser.choose((l) => /^special$/i.test(l))) {
      const h = await menu.chooser.choose((l) => /^doublecast/i.test(l));
      steps.push({ found: h });
      for (let k = 0; h && k < 2; k++) {
        const sp = spell ? await menu.chooser.choose((l) => l.toLowerCase().includes(spell)) : null;
        steps.push({ k, spell: sp });
        if (!sp) break;
      }
    }
    expect(spell).toBe('firaga + firaga');
    expect(steps).toEqual([{ found: 'Doublecast' }, { k: 0, spell: null }]); // the review's run.json `doublecast[0].steps`, twice, and then dcFail 2
    expect(menu.state()).toBe('spell1'); // it stood in the spell list with nothing pressed and backed out
  });

  it('plays the card: Special, Doublecast, Firaga and its target, Firaga and its target, and the HUD has its command', async () => {
    const menu = fakeMenu();
    const dc = await run(CARD, menu);
    expect(dc.casts).toEqual(['firaga', 'firaga']);
    expect(dc.steps).toEqual([{ found: 'Doublecast' }, { k: 0, spell: 'Firaga' }, { k: 1, spell: 'Firaga' }]);
    expect(menu.targets).toEqual([CARD.target, CARD.target]);
    expect(menu.state()).toBe('done');
  });

  it('plays two different spells in the order the card names them, taking the exact row (Fira, not Firaga that is listed first)', async () => {
    const menu = fakeMenu();
    const dc = await run({ label: 'Doublecast: Fira + Blizzard', target: 'Yu Pagoda', menu: 'Special' }, menu);
    expect(dc.steps).toEqual([{ found: 'Doublecast' }, { k: 0, spell: 'Fira' }, { k: 1, spell: 'Blizzard' }]);
    expect(menu.targets).toEqual(['Yu Pagoda', 'Yu Pagoda']);
    expect(menu.state()).toBe('done');
  });

  it('falls back to a row that merely contains the spell\'s name (a label carrying a cost) when no row is exactly it', async () => {
    const menu = fakeMenu({ black: ['Fire 4', 'Firaga 12', 'Blizzard 6'] });
    const dc = await run(CARD, menu);
    expect(dc.steps.filter((s) => s.spell).map((s) => s.spell)).toEqual(['Firaga 12', 'Firaga 12']);
    expect(menu.state()).toBe('done');
  });

  it('records a failure the route can count when the spell is not in the list: no spell, no target pressed, the record the caller\'s dcFail reads', async () => {
    const menu = fakeMenu({ black: ['Fire', 'Blizzard'] });
    const dc = await run(CARD, menu);
    expect(dc.steps).toEqual([{ found: 'Doublecast' }, { k: 0, spell: null }]);
    expect(dc.steps.some((s) => s.spell)).toBe(false);
    expect(menu.targets).toEqual([]);
  });

  it('does nothing for a card that is not a Doublecast, and stops when Special has no Doublecast', async () => {
    const menu = fakeMenu();
    const none = await run({ label: 'Cure', target: 'Tidus', menu: 'White Magic' }, menu);
    expect(none.steps).toEqual([]);
    expect(menu.log).toEqual([]);
    const noDc = fakeMenu();
    const special = ['Focus', 'Scan'];
    const chooser = { choose: async (p: (l: string) => boolean) => (noDc.state() === 'top' ? noDc.chooser.choose(p) : special.find((r) => p(r)) ?? null) };
    const dc = await playDoublecast({ chooser, adv: CARD, confirmTarget: noDc.confirmTarget, menuStillOpen: noDc.menuStillOpen, wait: async () => undefined, turn: 1, phase: 'command:lulu' });
    expect(dc.steps).toEqual([{ found: null }]);
  });
});

describe('route-fight.mjs plays it through that module', () => {
  it('imports playDoublecast, and no longer searches the card\'s whole text for a row', () => {
    const src = readFileSync(resolve(__dirname, '..', '..', 'critic/runner/lib/route-fight.mjs'), 'utf8');
    expect(src).toContain("import { playDoublecast } from './route-doublecast.mjs';");
    expect(src).toMatch(/await playDoublecast\(\{ chooser, adv,/);
    expect(src).not.toMatch(/adv\.label\.split\(':'\)/);
  });
});
