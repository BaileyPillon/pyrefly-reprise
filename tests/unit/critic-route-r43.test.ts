/**
 * Round 25 (critic tooling, lane r43-critic-tools): three faults of the capture route, held to synthetic screens and rosters.
 *   - PR-0397: the stock route resolved "Yuna" to Yunalesca and aimed Chapter II's Phoenix Downs at the boss (15, 11 and 8 times in three lost runs).
 *   - PR-0433: the 15-minute budget ended fights that were still progressing (Chapters II, III and XVII).
 *   - PR-0450 (d): the capture route carried a continuity probe whose numbers disagreed with the dedicated harness's on a loaded host.
 * `critic/runner/lib/route-pure.mjs` holds the rules; these are their cases. Nothing opens a browser.
 *
 * Game case: shared critic plumbing (both games). PR-0397 fired in FFX Chapter II (party id `yuna`, boss `yunalesca`) and the rule is the same for FFX-2 rows;
 * PR-0433's three chapters are FFX (II, III, XVII) and the older Chapter XIII entry is FFX-2.
 */
import fs from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';
import {
  CONTINUITY_BUDGET_MS, DEFAULT_BUDGET_MS, LONG_FIGHT_BUDGET_MS, LONG_FIGHT_MS, budgetFor, continuityBudgetFor, inlineProbeRefusal, letterTagMap, resolveTargetId, slugOf,
} from '../../critic/runner/lib/route-pure.mjs';

const ROOT = resolve(__dirname, '..', '..');
const read = (rel: string): string => fs.readFileSync(resolve(ROOT, rel), 'utf8');
const NONE = { enemyIds: [] as string[], names: {} as Record<string, string> };

describe('PR-0397: a party member\'s name is the id that spells it, never the first id that starts with it (FFX Chapter II)', () => {
  // The Chapter II screen: Lady Yunalesca is the one enemy. The roster names every combatant but lists only the enemy in `enemyIds`, so "Yuna" never reaches the display-name step.
  const roster = { enemyIds: ['yunalesca'], names: { yunalesca: 'Yunalesca', tidus: 'Tidus', auron: 'Auron', wakka: 'Wakka', lulu: 'Lulu', yuna: 'Yuna', kimahri: 'Kimahri' } };
  const bossFirst = ['yunalesca', 'tidus', 'auron', 'yuna', 'lulu'];
  const partyFirst = ['tidus', 'auron', 'yuna', 'lulu', 'yunalesca'];

  it('the stock rule of rounds 24 and 25 is what aimed Phoenix Down at the boss: the first id that starts with "yuna" is "yunalesca"', () => {
    const stock = (domIds: string[]): string | null => { const slug = slugOf('Yuna'); return domIds.find((id) => id.startsWith(slug) || slug.startsWith(id)) ?? null; };
    expect(stock(bossFirst)).toBe('yunalesca');
    expect(stock(partyFirst)).toBe('yuna'); // right only by the luck of the order on screen
  });

  it('"Yuna" is the party member whatever order the reticles come in, and "Yunalesca" is still the boss', () => {
    for (const dom of [bossFirst, partyFirst, [...bossFirst].reverse()]) {
      expect(resolveTargetId('Yuna', roster, dom), dom.join(',')).toBe('yuna');
      expect(resolveTargetId('Yunalesca', roster, dom), dom.join(',')).toBe('yunalesca');
    }
  });

  it('the exact id wins even when ids that merely begin with it come first, wherever the exact one sits in the list', () => {
    expect(resolveTargetId('Rikku', NONE, ['rikku-clone', 'rikku-2', 'rikku'])).toBe('rikku');
    expect(resolveTargetId('Rikku', NONE, ['rikku', 'rikku-clone'])).toBe('rikku');
  });

  it('a name that two different ids fit, with no exact id, is unresolved (null) and not the first of them', () => {
    expect(resolveTargetId('Sin', NONE, ['sin-fin-left', 'sin-fin-right', 'sin-core'])).toBeNull();
    expect(resolveTargetId('Yu', NONE, ['yuna', 'yunalesca'])).toBeNull();
  });

  it('counts an id once however many elements on screen carry it (a reticle and a plate)', () => {
    expect(resolveTargetId('Sin Fin', NONE, ['sin-fin-left', 'sin-fin-left'])).toBe('sin-fin-left');
    expect(resolveTargetId('Sin Fin Left', NONE, ['sin-fin-left', 'sin-fin-left', 'sin-fin-right'])).toBe('sin-fin-left');
  });

  it('keeps the older meaning of the prefix match when exactly one id fits, in both directions', () => {
    expect(resolveTargetId('Mortiphasm Spawn', NONE, ['mortiphasm', 'seymour-omnis'])).toBe('mortiphasm'); // the slug starts with the id
    expect(resolveTargetId('Yu Pagoda', NONE, ['yu-pagoda-left', 'yu-yevon'])).toBe('yu-pagoda-left'); // the id starts with the slug
  });

  it('an id that is empty or not text never matches, so a stray empty data-target-id cannot capture every name', () => {
    expect(resolveTargetId('Yuna', NONE, ['', 'tidus'])).toBeNull();
    expect(resolveTargetId('Yuna', NONE, ['', 'yuna'])).toBe('yuna');
    expect(resolveTargetId('Yuna', NONE, [undefined as unknown as string, 'yuna'])).toBe('yuna');
  });

  it('leaves every earlier answer alone: display names, trailing letters, the not-on-screen rule and an empty name', () => {
    const pagodas = ['yu-pagoda-left', 'yu-pagoda-right', 'yu-yevon'];
    const bfa = { enemyIds: pagodas, names: { 'yu-pagoda-left': 'Yu Pagoda', 'yu-pagoda-right': 'Yu Pagoda', 'yu-yevon': 'Yu Yevon' } };
    expect(letterTagMap(pagodas, (id) => bfa.names[id as keyof typeof bfa.names]).get('yu-pagoda-right')).toBe('B');
    expect(resolveTargetId('Yu Pagoda A', bfa, pagodas)).toBe('yu-pagoda-left');
    expect(resolveTargetId('Yu Pagoda B', bfa, pagodas)).toBe('yu-pagoda-right');
    expect(resolveTargetId('Yu Yevon', bfa, pagodas)).toBe('yu-yevon');
    expect(resolveTargetId('Yu Pagoda B', bfa, ['yu-pagoda-left', 'yu-yevon'])).toBeNull(); // the named pagoda is not a choice: never a neighbour
    expect(resolveTargetId('', roster, bossFirst)).toBeNull();
  });
});

describe('PR-0433: the fights that run past 15 minutes have a budget of their own (FFX Chapters II, III and XVII; FFX-2 Chapter XIII)', () => {
  const LONG = ['yunalesca', 'braskas-final-aeon', 'sin-fins-core'];

  it('Chapter II, Chapter III and Chapter XVII get 50 minutes without --budget, and Chapter XIII keeps its 100 (PR-0353)', () => {
    expect(LONG_FIGHT_MS).toBe(3000000);
    for (const id of LONG) expect(budgetFor(id, undefined), id).toBe(3000000);
    expect(budgetFor('ffx2-trema', undefined)).toBe(6000000);
    expect(Object.keys(LONG_FIGHT_BUDGET_MS).sort()).toEqual(['braskas-final-aeon', 'ffx2-trema', 'sin-fins-core', 'yunalesca']);
  });

  it('is above the longest win measured on an idle host (Chapter III, 32 minutes) and above the old cap that ended all three', () => {
    for (const id of LONG) {
      expect(budgetFor(id, undefined), id).toBeGreaterThan(32 * 60000);
      expect(budgetFor(id, undefined), id).toBeGreaterThan(DEFAULT_BUDGET_MS);
    }
  });

  it('every other chapter keeps the 15-minute default, and an explicit --budget wins over the table', () => {
    for (const id of CHAPTER_IDS) if (!(id in LONG_FIGHT_BUDGET_MS)) expect(budgetFor(id, undefined), id).toBe(DEFAULT_BUDGET_MS);
    expect(budgetFor('yunalesca', '1200000')).toBe(1200000);
    expect(budgetFor('braskas-final-aeon', 600000)).toBe(600000);
  });

  it('names only chapters that exist on the board, with the game the finding named (a typo would silently leave a long fight on the default)', () => {
    for (const id of Object.keys(LONG_FIGHT_BUDGET_MS)) {
      expect(CHAPTER_IDS as readonly string[], id).toContain(id);
      expect(getChapter(id), id).toBeDefined();
    }
    for (const id of LONG) expect(getChapter(id)!.game, id).toBe('ffx');
    expect(getChapter('ffx2-trema')!.game).toBe('ffx2');
  });

  it('the dedicated continuity harness gives a chapter the longer of its own 30 minutes and the chapter\'s long-fight budget, and an explicit --budget still wins', () => {
    expect(CONTINUITY_BUDGET_MS).toBe(1800000);
    expect(continuityBudgetFor('seymour-flux', undefined)).toBe(1800000);
    expect(continuityBudgetFor('braskas-final-aeon', undefined)).toBe(3000000); // round 25: 1,733 s of battle inside a 1,800 s cap
    expect(continuityBudgetFor('yunalesca', '')).toBe(3000000);
    expect(continuityBudgetFor('ffx2-trema', undefined)).toBe(6000000);
    expect(continuityBudgetFor('braskas-final-aeon', '900000')).toBe(900000);
  });

  it('continuity.mjs passes the route that budget, and route.mjs still reads its own through budgetFor', () => {
    const cont = read('critic/runner/lib/continuity.mjs');
    expect(cont).toMatch(/budget: continuityBudgetFor\(chapter, args\.budget\)/);
    expect(cont).not.toMatch(/budget: args\.budget \?\? DEFAULT_BUDGET_MS/);
    expect(read('critic/runner/lib/route.mjs')).toMatch(/budgetFor\(id, args\.budget\)/);
  });
});

describe('PR-0450 (d): the continuity probe is not part of a capture route', () => {
  it('stops a route started with --continuity unless the dedicated harness started it, and names the command to run instead', () => {
    const refusal = inlineProbeRefusal({ continuity: true }, {});
    expect(refusal).toMatch(/only for continuity\.mjs/);
    expect(refusal).toMatch(/PYREFLY_BROWSER=gpu node critic\/runner\/lib\/continuity\.mjs --base=<url>/);
    expect(inlineProbeRefusal({ continuity: true }, { CONT_DEDICATED: '0' })).toMatch(/only for continuity\.mjs/);
    expect(inlineProbeRefusal({ continuity: true }, { CONT_DEDICATED: '1' })).toBeNull();
  });

  it('leaves a route without the flag alone', () => {
    expect(inlineProbeRefusal({}, {})).toBeNull();
    expect(inlineProbeRefusal({ continuity: false }, {})).toBeNull();
    expect(inlineProbeRefusal(undefined, undefined)).toBeNull();
  });

  it('route.mjs asks before it opens a browser, and continuity.mjs marks the route it starts', () => {
    const route = read('critic/runner/lib/route.mjs');
    expect(route).toMatch(/inlineProbeRefusal\(args, process\.env\)/);
    expect(route.indexOf('inlineProbeRefusal(args, process.env)')).toBeLessThan(route.indexOf('await openRoute('));
    expect(read('critic/runner/lib/continuity.mjs')).toMatch(/env: \{ \.\.\.process\.env, CONT_DEDICATED: '1' \}/);
  });

  it('the multi-target capture says what the HUD showed, with the advisor card\'s words only as a note (PR-0450 c)', () => {
    const fight = read('critic/runner/lib/route-fight.mjs');
    expect(fight).toMatch(/multi-target selection read from the HUD: \$\{tg\.lit\} of \$\{tg\.n\} reticles lit \(the advisor card named/);
    expect(fight).not.toMatch(/`multi-target selection \(\$\{adv\?\.label\} -> \$\{adv\?\.target\}\)`/);
  });
});
