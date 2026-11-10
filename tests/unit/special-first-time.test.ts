/**
 * Test 8, the pure half, of the FFX-2 Special look (step A; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2): which entry plays, full or short.
 *
 * The game plays a Special in full the first time that girl enters it and the short effect after; our rule is per save and per girl, remembered in the save's existing `seenCoach` list
 * under `special-<girl>-<special>` and reached through ONE optional member of the presenter's dependencies (`PresenterDeps.specialSeen`), so the presenter imports nothing from `app/` or `ui/`.
 * The id is written when the full sequence has finished (step C2), so an interrupted first change does not count.
 *
 * Removal: make `entryKind` always answer 'full' and the second-entry case fails; add an `import` of `../ui/` to a presenter file and the source scan fails.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { entryKind, type HoldPolicy } from '../../src/engine/SpecialBeatPlans.ts';
import { specialSeenId } from '../../src/engine/SpecialFormTracker.ts';
import { FORM_GIRLS } from './helpers/specialFormState.ts';

const ENGINE = resolve(__dirname, '..', '..', 'src', 'engine');

/** A port as the battle screen will hand it: a set behind `has` and `mark`. */
function port() {
  const ids = new Set<string>();
  return { ids, has: (id: string) => ids.has(id), mark: (id: string) => void ids.add(id) };
}

describe('entryKind with the port', () => {
  it('is full the first time, and short after the id is marked (per girl)', () => {
    const seen = port();
    const id = specialSeenId('yuna', 'floral-fallal');
    expect(id).toBe('special-yuna-floral-fallal');
    expect(entryKind(seen, 'yuna', 'floral-fallal')).toBe('full');
    seen.mark(id);
    expect(entryKind(seen, 'yuna', 'floral-fallal')).toBe('short');
    for (const g of FORM_GIRLS.filter((x) => x.girl !== 'yuna')) expect(entryKind(seen, g.girl, g.special), g.girl).toBe('full');
  });

  it('with the port absent is always full, and nothing throws', () => {
    for (const g of FORM_GIRLS) {
      expect(entryKind(undefined, g.girl, g.special)).toBe('full');
      expect(entryKind(null, g.girl, g.special)).toBe('full');
    }
  });

  it("the hold policy is a switch: 'short-always' is short with the port present or absent; 'per-save' (the default) behaves as the two cases above", () => {
    const seen = port();
    const policies: HoldPolicy[] = ['per-save', 'short-always'];
    for (const hold of policies) {
      const unseen = entryKind(seen, 'rikku', 'machina-maw', hold);
      const absent = entryKind(undefined, 'rikku', 'machina-maw', hold);
      expect(unseen).toBe(hold === 'short-always' ? 'short' : 'full');
      expect(absent).toBe(hold === 'short-always' ? 'short' : 'full');
    }
    expect(entryKind(seen, 'rikku', 'machina-maw')).toBe(entryKind(seen, 'rikku', 'machina-maw', 'per-save'));
  });
});

/** The imports of a source text that reach into `app/` or `ui/` (static, re-exported or dynamic). */
function reachesOut(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/^\s*(?:import|export)\b[^;]*?from\s+'(\.\.\/(?:app|ui)\/[^']*)'/gm)) out.push(m[1] as string);
  for (const m of text.matchAll(/\bimport\(\s*'(\.\.\/(?:app|ui)\/[^']*)'\s*\)/g)) out.push(m[1] as string);
  return out;
}

describe('the presenter files import nothing from app/ or ui/', () => {
  const NEW_FILES = ['SpecialArtIds.ts', 'SpecialFormTracker.ts', 'SpecialBeatPlans.ts', 'SpecialReactions.ts', 'SpecialPartyHold.ts'];
  const presenterFiles = readdirSync(ENGINE).filter((f) => /^BattlePresenter.*\.ts$/.test(f));

  it('the scan sees an import, a multi-line import, a re-export and a dynamic import into app/ or ui/, and not one into data/ or a comment', () => {
    expect(reachesOut("import { x } from '../ui/coach/coachState.ts';")).toEqual(['../ui/coach/coachState.ts']);
    expect(reachesOut("import type {\n  A,\n} from '../app/SaveData.ts';")).toEqual(['../app/SaveData.ts']);
    expect(reachesOut("export { y } from '../ui/common/z.ts';")).toEqual(['../ui/common/z.ts']);
    expect(reachesOut("const m = await import('../app/screens/x.ts');")).toEqual(['../app/screens/x.ts']);
    expect(reachesOut("import { a } from '../data/art/artNamespace.ts'; // see ../ui/ for the screen")).toEqual([]);
  });

  it('scans the presenter files and the new Special files (and lists what it read)', () => {
    const read = [...presenterFiles, ...NEW_FILES];
    expect(presenterFiles.length).toBeGreaterThan(10);
    expect(read).toEqual(expect.arrayContaining(['BattlePresenter.ts', 'BattlePresenterPorts.ts', 'SpecialFormTracker.ts']));
    const offenders: string[] = [];
    for (const f of read) {
      for (const target of reachesOut(readFileSync(resolve(ENGINE, f), 'utf8'))) offenders.push(`${f} imports ${target}`);
    }
    console.info(`[special-first-time] source scan read ${read.length} files: ${read.join(', ')}`);
    expect(offenders).toEqual([]);
  });
});
