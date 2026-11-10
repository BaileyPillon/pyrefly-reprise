/**
 * R-16 of the FFX-2 Special look (step C2; game case: both games, a source scan): a part's handle and the main's hit-gated figure are what `PaintedStage.actor` answers while a form is up, so
 * every site that asks the stage for an actor must go through it. `.actors.get(` (the stage's own map, the real figure and the stubs) is read only inside `BattlePresenterStage.ts`, the
 * stage-adjacent files that are handed the stage's map, and `SpecialStaging.ts`. Any other file that asks for a figure goes through `stage.actor(`.
 *
 * Removal: add `.actors.get(` to a presenter file and the scan fails.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '..', '..', 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|mts)$/.test(name)) out.push(p);
  }
  return out;
}

/** Files that may read the stage's own actor map: the stage, the registry that is handed it, and the helpers the stage passes its map to. */
const ALLOWED = new Set(['engine/BattlePresenterStage.ts', 'engine/SpecialStaging.ts', 'engine/StageRelax.ts']); // StageRelax reads its own `RelaxField.actors` (positions of the figures the stage lent it), never a reaction

describe('who reads the stage\'s own actor map', () => {
  const files = walk(SRC).map((f) => ({ rel: f.slice(SRC.length + 1).replace(/\\/g, '/'), text: readFileSync(f, 'utf8') }));

  it('`.actors.get(` appears only in the stage and the registry, plus the named stage-adjacent readers', () => {
    // `battle/` has its own `actors` maps (the engines'); the stage's is read from `engine/`, `app/` and `ui/`
    const readers = files.filter((f) => /^(engine|app|ui)\//.test(f.rel) && /\.actors\.get\(/.test(f.text)).map((f) => f.rel).filter((r) => !ALLOWED.has(r));
    expect(readers, 'a file outside the stage reads the stage\'s own map instead of stage.actor(').toEqual([]);
  });

  it('the presenter and the beats ask the stage for an actor through `stage.actor(` and never through the map', () => {
    const presenter = files.filter((f) => /^engine\/BattlePresenter(?!Stage)/.test(f.rel) || /^engine\/(motion|fx)\//.test(f.rel));
    expect(presenter.length).toBeGreaterThan(20);
    for (const f of presenter) expect(f.text, f.rel).not.toMatch(/\.actors\.get\(/);
    const sites = presenter.reduce((n, f) => n + (f.text.match(/stage\.actor\(/g)?.length ?? 0), 0);
    expect(sites).toBeGreaterThan(30);
  });
});
