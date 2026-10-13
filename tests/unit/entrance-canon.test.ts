/**
 * Whose entrance is made of pyreflies (`src/engine/entrance/entranceCanon.ts`).
 *
 * `research/ffx-vs-ffx2-presentation.md` §3.1 and §3.2: fiends, the unsent and aeons are made of pyreflies (they gather); machina are "not spirits. No pyreflies" and living
 * humans "lose and the scene continues. Nothing dissolves" (they fade). The way in follows the way out: the figures the departures table sends off by `'yields'` or `'body'`
 * are people. Game case: both (the rule is the same in the two games; the ids are each their own game's).
 */
import { describe, expect, it } from 'vitest';
import { DEPARTURE_KINDS } from '../../src/engine/BattlePresenterDepartures.ts';
import { NEVER_PYREFLIES } from '../../src/engine/pyreflyCanon.ts';
import { MACHINA_IDS, MACHINA_ID_PREFIXES, SCENE_STAGED_ENTRANCE, entranceBodyOf, isPlainBody, sceneStagesEntrance } from '../../src/engine/entrance/entranceCanon.ts';

describe('who is not made of pyreflies', () => {
  it("the living (FFX-2's Leblanc, Logos, Ormi and the goons; FFX's Guado Guardians and the living Seymour) fade", () => {
    for (const id of ['leblanc', 'logos', 'ormi', 'ormi-entrance', 'ormi-logos-room', 'logos-room', 'dr-goon', 'fem-goon', 'guado-guardian-a', 'guado-guardian-b', 'seymour-macalania']) {
      expect(entranceBodyOf(id), id).toBe('plain');
    }
  });

  it("machina (FFX-2's Vegnagun and its parts) fade; so does the Fahrenheit's pilot, a person", () => {
    for (const id of ['vegnagun-tail', 'vegnagun-leg', 'vegnagun-body', 'vegnagun-head', ...MACHINA_IDS]) expect(entranceBodyOf(id), id).toBe('plain');
    expect([...MACHINA_IDS].sort()).toEqual(['bulwark-l', 'bulwark-r', 'node-a', 'node-b', 'node-c', 'redoubt-l', 'redoubt-r']);
    expect(MACHINA_ID_PREFIXES).toEqual(['vegnagun']);
    expect(entranceBodyOf('cid')).toBe('plain');
  });

  it('every figure the departures table sends off as a person, and every id the stage never dissolves, is plain: one table for the way out and the way in', () => {
    for (const [id, kind] of Object.entries(DEPARTURE_KINDS)) if (kind === 'yields' || kind === 'body') expect(isPlainBody(id), id).toBe(true);
    for (const id of NEVER_PYREFLIES) expect(isPlainBody(id), id).toBe(true);
  });
});

describe('who gathers', () => {
  it('fiends, the unsent and the aeons of both games gather: the three named by round 25 (Anima at the Fallen Aeons seam, Overdrive Sin, Paragon) and the rest of the bosses', () => {
    const gather = [
      // FFX-2
      'x2-anima', 'x2-shiva', 'sandy', 'cindy', 'mindy', 'paragon', 'trema', 'bahamut', 'x2-ixion', 'shuyin', 'shade-baralai', 'shade-gippal', 'shade-nooj', 'x2-experiment', 'x2-experiment-prototype',
      // FFX
      'overdrive-sin', 'left-fin', 'right-fin', 'sin-core', 'sinspawn-genais', 'sinspawn-gui', 'seymour-flux', 'mortiorchis', 'yunalesca', 'braskas-final-aeon', 'yu-yevon', 'possessed-valefor', 'evrae',
      'yojimbo', 'ginnem', 'daigoro', 'seymour-natus', 'mortibody', 'seymour-omnis', 'mortiphasm-1', 'isaaru', 'grothia', 'yu-pagoda-left',
    ];
    for (const id of gather) expect(entranceBodyOf(id), id).toBe('pyrefly');
  });

  it('a figure the table has never heard of gathers (the rule names who does not)', () => {
    expect(entranceBodyOf('a-new-fiend')).toBe('pyrefly');
  });
});

describe('whose scene stages the entrance', () => {
  it("Chapter IX's night-sakura arrival (D-072) is Yojimbo's and Daigoro's own: the stage holds neither", () => {
    expect([...SCENE_STAGED_ENTRANCE].sort()).toEqual(['daigoro', 'yojimbo']);
    expect(sceneStagesEntrance('yojimbo')).toBe(true);
    expect(sceneStagesEntrance('ginnem')).toBe(false); // the scene's arrival never touches Lady Ginnem: she gathers
    expect(sceneStagesEntrance('paragon')).toBe(false);
  });
});
