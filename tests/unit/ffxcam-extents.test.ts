/**
 * **The characters' camera extents, the FAR fit and the shot subjects** (`src/engine/ffxcam/extents.ts`, `farFit.ts`, `shotSubjects.ts`; FFX only). Synthetic data only (rule 8): the numbers in the file are made up.
 *
 * Pins: `extents.json` parses to a table by character number, and every malformed shape is refused with a reason (wrong format, no chars, a non-numeric key, a non-positive or missing height or width);
 * the FAR fit rewrites exactly the FAR look-at (a `refSetPos` with its three numbers) to the party's column at the script's height and leaves every other call, every other `refSetPos` and a short
 * argument list alone; the column is the mean of the party's x and z; the subjects of a beat are the actor and its targets for an action's own shot, the party (watched with Evrae) for the default
 * views, the scenes and no open action, and a figure that is not shown is nobody.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { EXTENTS_FORMAT, parseExtents } from '../../src/engine/ffxcam/extents.ts';
import { columnOf, farFit } from '../../src/engine/ffxcam/farFit.ts';
import { subjectsOf } from '../../src/engine/ffxcam/shotSubjects.ts';

describe('extents.json', () => {
  const good = { format: EXTENTS_FORMAT, chars: { '0': { name: 'tidus', height: 21, width: 7 }, '20': { height: 60, width: 90 } } };

  it('parses to a table by character number', () => {
    const r = parseExtents(good);
    expect('extents' in r && r.extents).toEqual({ '0': { height: 21, width: 7 }, '20': { height: 60, width: 90 } });
  });

  it('refuses every malformed shape with a reason', () => {
    const problem = (raw: unknown): string => ('problem' in parseExtents(raw) ? (parseExtents(raw) as { problem: string }).problem : '');
    expect(problem(null)).toMatch(/not an object/);
    expect(problem([])).toMatch(/not an object/);
    expect(problem({ format: 'nope', chars: {} })).toMatch(/format/);
    expect(problem({ format: EXTENTS_FORMAT })).toMatch(/chars/);
    expect(problem({ format: EXTENTS_FORMAT, chars: { tidus: { height: 21, width: 7 } } })).toMatch(/character number/);
    expect(problem({ format: EXTENTS_FORMAT, chars: { '0': { height: 0, width: 5 } } })).toMatch(/positive/);
    expect(problem({ format: EXTENTS_FORMAT, chars: { '0': { height: 21 } } })).toMatch(/width/);
    expect(problem({ format: EXTENTS_FORMAT, chars: { '0': { height: 21, width: Number.NaN } } })).toMatch(/positive/);
  });

  it('an empty table is a table', () => {
    const r = parseExtents({ format: EXTENTS_FORMAT, chars: {} });
    expect('extents' in r && Object.keys(r.extents)).toEqual([]);
  });
});

describe('the FAR fit', () => {
  const FAR: [number, number, number] = [87, -55, 55]; // a made-up look-at; the fit takes it as a parameter
  const party: Array<[number, number, number]> = [[-25, -35, 120], [-20, -35, 80], [-15, -35, 40]];
  const fit = farFit(FAR, party);

  it('turns the FAR look-at into the party\'s column at the script\'s height', () => {
    expect(fit('refSetPos', [87, -55, 55])).toEqual({ name: 'refSetPos', args: [-20, -55, 80] });
    expect(fit('refSetPos', [87.0004, -55, 55])).not.toBeNull(); // within a thousandth
  });

  it('leaves everything else alone', () => {
    expect(fit('refSetPos', [60, -55, 55])).toBeNull(); // another look-at (the scene's sweep)
    expect(fit('refSetPos', [87, -55, 56])).toBeNull();
    expect(fit('camSetPos', [87, -55, 55])).toBeNull(); // the eye is the eye
    expect(fit('camSetPolar', [87, -55, 55])).toBeNull();
    expect(fit('refSetPos', [87, -55])).toBeNull(); // too short to be one
  });

  it('the column is the mean of x and z at the given height', () => {
    expect(columnOf(party, -50)).toEqual([-20, -50, 80]);
    expect(columnOf([], 7)).toEqual([0, 7, 0]);
  });
});

describe('whom a shot is for', () => {
  const party = ['tidus', 'wakka', 'rikku'];
  const defaults = new Set(['default', 'scene']);
  const allShown = (): boolean => true;

  it('an action\'s own shot: the actor and its targets', () => {
    const s = subjectsOf({ actor: 'tidus', targets: ['evrae'] }, 'attack', defaults, party, 'evrae', allShown);
    expect(s).toEqual({ watch: ['tidus', 'evrae'], hold: ['tidus', 'evrae'], defaultRule: false, actorDrawn: true, who: 'tidus,evrae' });
  });

  it('the actor is not listed twice when it targets itself', () => {
    const s = subjectsOf({ actor: 'wakka', targets: ['wakka'] }, 'cast', defaults, party, 'evrae', allShown);
    expect(s.watch).toEqual(['wakka']);
  });

  it('the default views and the scenes: watch the party and Evrae, hold the party', () => {
    for (const program of ['default', 'scene']) {
      const s = subjectsOf({ actor: 'tidus', targets: ['evrae'] }, program, defaults, party, 'evrae', allShown);
      expect(s).toEqual({ watch: ['tidus', 'wakka', 'rikku', 'evrae'], hold: ['tidus', 'wakka', 'rikku'], defaultRule: true, actorDrawn: true, who: 'party' });
    }
  });

  it('no open action is the default rule whatever the program', () => {
    const s = subjectsOf(null, 'attack', defaults, party, 'evrae', allShown);
    expect(s.defaultRule).toBe(true);
    expect(s.hold).toEqual(party);
  });

  it('the name of who a shot is for does not change when a figure fades in or out', () => {
    const some = (id: string): boolean => id !== 'rikku';
    expect(subjectsOf(null, 'default', defaults, party, 'evrae', allShown).who).toBe(subjectsOf(null, 'default', defaults, party, 'evrae', some).who);
    expect(subjectsOf({ actor: 'tidus', targets: ['rikku'] }, 'cast', defaults, party, 'evrae', some).who).toBe('tidus,rikku');
  });

  it('a figure that is not shown is nobody', () => {
    const shown = (id: string): boolean => id !== 'evrae' && id !== 'cid';
    expect(subjectsOf(null, 'default', defaults, party, 'evrae', shown).watch).toEqual(party);
    // Cid is never drawn: a volley of his is watched through its targets
    expect(subjectsOf({ actor: 'cid', targets: party }, 'volley', defaults, party, 'evrae', shown).watch).toEqual(party);
    // nobody shown at all: nothing to watch, so the net stands down
    expect(subjectsOf({ actor: 'cid', targets: ['evrae'] }, 'volley', defaults, party, 'evrae', shown).watch).toEqual([]);
  });

  it('an action by a figure that is not drawn (Cid) says so: the net does not wait for its actor', () => {
    const shown = (id: string): boolean => id !== 'cid';
    const volley = subjectsOf({ actor: 'cid', targets: ['evrae'] }, 'volley', defaults, party, 'evrae', shown);
    expect(volley).toMatchObject({ watch: ['evrae'], hold: ['evrae'], defaultRule: false, actorDrawn: false, who: 'cid,evrae' });
    expect(subjectsOf({ actor: 'tidus', targets: ['evrae'] }, 'attack', defaults, party, 'evrae', shown).actorDrawn).toBe(true);
    expect(subjectsOf({ actor: 'cid', targets: ['evrae'] }, 'default', defaults, party, 'evrae', shown).actorDrawn).toBe(true); // a default view is nobody's shot
  });

  it('an unknown program id is an action\'s own shot', () => {
    expect(subjectsOf({ actor: 'tidus', targets: [] }, undefined, defaults, party, 'evrae', allShown).defaultRule).toBe(false);
  });
});
