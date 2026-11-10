/**
 * The cells of the Fiend Arena Superbosses bench (`fiendSuperbossBench.ts`), by name, with their seed counts, shared by the tool (`tools/fiend-superbosses-bench.mjs`, which prints the tables of the handoff and the
 * options sheet) and the test (`tests/unit/chapters/fiend-superbosses-bench.test.ts`, which pins the character of a few). **FFX-2 only.** Measure, never tune: no boss row is in any cell; a cell changes the party
 * or the line, and only as a rig the bench applies (LG4: none of them ships).
 *
 * Three groups:
 * - `base`: the shipped party (Chapter XIII's Lv 99 three, as built) on three lines, and on the two lines of the brief at the two human paces.
 * - `whatif`: LG4's what-ifs, each a change the preflight names: a Miracle Drink loop (Dark Matter in the bag; bench-only, there is no Mix row in Rikku's menu), Hero Drinks in the bag, Thunder-proof girls (a rig; no
 *   accessory sets an affinity), and, from stage 2's finding, a Ribbon (it stops every status Duo throws); `all` puts the loop, the Ribbon and Thunder-proofing together.
 * - `rig`: DIAGNOSTIC rigs that are not options anything could ship today (the opening covered; Invincible for good with the HP topped up): they say where the wall is, not how to take it down.
 *
 * Seeds: 200 at bench speed and 40 at each human pace (the Wait split at 1.5 s a menu, and the Active clock at 1.5 s), the brief's numbers; every cell is cheap (a fraction of a second a fight on an idle machine), so
 * none is cut.
 */

import type { Pace, Spec } from './fiendSuperbossBench.ts';

export const BENCH_SEEDS = 200;
export const HUMAN_SEEDS = 40;

export interface Cell extends Spec {
  name: string;
  group: 'base' | 'whatif' | 'rig';
  seeds: number;
}

const MD = { darkMatter: true } as const;

/** [id, line, kit, paces] of each family of cells; every family is played on both acts. */
const FAMILIES: ReadonlyArray<[Cell['group'], string, Spec['line'], Spec['kit'], readonly Pace[]]> = [
  ['base', 'advisor', 'advisor', {}, ['bench', 'split', 'active']],
  ['base', 'naive', 'naive', {}, ['bench', 'split', 'active']],
  ['base', 'darkness', 'darkness', {}, ['bench']],
  ['whatif', 'miracle', 'miracle', MD, ['bench', 'split', 'active']],
  ['whatif', 'hero', 'hero', { heroDrinks: 10 }, ['bench', 'split', 'active']],
  ['whatif', 'thunder', 'advisor', { thunder: true }, ['bench', 'split', 'active']],
  ['whatif', 'ribbon', 'advisor', { ribbon: true }, ['bench', 'split', 'active']],
  ['whatif', 'all', 'miracle', { ...MD, ribbon: true, thunder: true }, ['bench', 'split', 'active']],
  ['rig', 'cover15-miracle', 'miracle', { ...MD, cover: 15 }, ['bench']],
  ['rig', 'cover15-miracle-ribbon', 'miracle', { ...MD, cover: 15, ribbon: true, thunder: true }, ['bench']],
  ['rig', 'cover15-hero', 'hero', { heroDrinks: 10, cover: 15, ribbon: true }, ['bench']],
  ['rig', 'forever-advisor', 'advisor', { cover: Infinity, topUp: true }, ['bench']],
  ['rig', 'forever-darkness', 'darkness', { cover: Infinity, topUp: true }, ['bench']],
  ['rig', 'forever-advisor-ribbon', 'advisor', { cover: Infinity, topUp: true, ribbon: true }, ['bench']],
  ['rig', 'forever-darkness-ribbon', 'darkness', { cover: Infinity, topUp: true, ribbon: true }, ['bench']],
];

export const CELLS: readonly Cell[] = FAMILIES.flatMap(([group, id, line, kit, paces]) =>
  ([1, 2] as const).flatMap((act) =>
    paces.map((pace): Cell => ({ name: `${group}/${id}/act${act}/${pace}`, group, act, line, ...(kit ? { kit } : {}), pace, seeds: pace === 'bench' ? BENCH_SEEDS : HUMAN_SEEDS })),
  ),
);

export const cellNamed = (name: string): Cell => {
  const c = CELLS.find((x) => x.name === name);
  if (!c) throw new Error(`no bench cell named ${name}`);
  return c;
};
