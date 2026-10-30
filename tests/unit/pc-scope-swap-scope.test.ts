/**
 * MF-22, the wide scope (lane pc-scope, 2026-10-28; flipped to the default in release 68; `motion/SwapSwitch.ts`; both games, per chapter): `?swapscope=pack|wide|all` says in which chapters the stance (`?stance`) and
 * cause (`?swapcause`) looks play. `pack` is release 67's reach (Chapter I and Chapter IV), `wide` is all nineteen chapters but the three named exceptions (Yunalesca, Sin's face, Ixion XVI; Evrae left the list in release 69), `all` is all
 * nineteen with no exception (the measuring word). The default is `wide` since release 68, and these tests are what pin that and the exception list; going back is one line.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { setCurvesChapter } from '../../src/engine/motion/CurvesSwitch.ts';
import { DEMO_CHAPTERS } from '../../src/engine/motion/DemoGate.ts';
import {
  COVERED,
  SCOPE_DEFAULT,
  SCOPE_EXCEPTIONS,
  STANCE_DEFAULT,
  SWAP_CLASSES,
  WIDE_CHAPTERS,
  chapterInScope,
  menuKeepsIdle,
  scopeExcepted,
  scopeFromSearch,
  setCauseMode,
  setStanceMode,
  setSwapScope,
  stanceNow,
  swapHow,
  swapScope,
  swapsInScope,
  windUpOnIdle,
  type SwapScope,
} from '../../src/engine/motion/SwapSwitch.ts';
import { installSmearDebug } from '../../src/debug/smearApi.ts';
import { setCutAnchorMode } from '../../src/engine/motion/CutAnchor.ts';

afterEach(() => {
  setCurvesChapter(undefined);
  setCauseMode(null, null);
  setStanceMode(null);
  setSwapScope(null);
  setCutAnchorMode(null);
});

const IDS = CHAPTERS.map((c) => c.id);
const PACK = Object.keys(DEMO_CHAPTERS);
const EXCEPTED = Object.keys(SCOPE_EXCEPTIONS);

describe('the word', () => {
  it('the default is wide since release 68 (the pin: MF-22 flipped after the browser measurement of all nineteen chapters); an address that names nothing it knows reads wide', () => {
    expect(SCOPE_DEFAULT).toBe('wide');
    expect(scopeFromSearch('')).toBe('wide');
    expect(scopeFromSearch('?swapscope=banana')).toBe('wide');
    expect(scopeFromSearch('?swapscope=')).toBe('wide');
    expect(scopeFromSearch('?pack=demo')).toBe('wide');
  });

  it('?swapscope=pack and =today bring release 67\'s reach back, per address', () => {
    expect(scopeFromSearch('?swapscope=pack')).toBe('pack');
    expect(scopeFromSearch('?swapscope=today')).toBe('pack');
    expect(scopeFromSearch('?swapscope=PACK')).toBe('pack');
  });

  it('?swapscope=wide, =all and =pack name their scopes; =today is pack; the value is not case sensitive', () => {
    expect(scopeFromSearch('?swapscope=wide')).toBe('wide');
    expect(scopeFromSearch('?swapscope=all')).toBe('all');
    expect(scopeFromSearch('?swapscope=ALL')).toBe('all');
    expect(scopeFromSearch('?swapscope=pack')).toBe('pack');
    expect(scopeFromSearch('?swapscope=today')).toBe('pack');
  });

  it('with the pack off (?pack=off, a phone or a tablet reads the same), or no page, every word reads pack: release 62\'s look', () => {
    expect(scopeFromSearch('?pack=off&swapscope=all')).toBe('pack');
    expect(scopeFromSearch('?pack=off&swapscope=wide')).toBe('pack');
    expect(scopeFromSearch('?pack=today&swapscope=wide')).toBe('pack');
    expect(scopeFromSearch(undefined)).toBe('pack');
  });

  it('?pack=demo forces the pack on, so the wide words read on any screen', () => {
    expect(scopeFromSearch('?pack=demo&swapscope=wide')).toBe('wide');
    expect(scopeFromSearch('?pack=demo&swapscope=all')).toBe('all');
  });
});

describe('the exceptions are named, real and justified', () => {
  it('there are nineteen chapters, the two pack chapters are among them, and WIDE_CHAPTERS is exactly the listed ones (a twentieth fails here until it is decided)', () => {
    expect(IDS).toHaveLength(19);
    for (const p of PACK) expect(IDS).toContain(p);
    expect([...WIDE_CHAPTERS].sort()).toEqual([...IDS].sort());
    expect(new Set(WIDE_CHAPTERS).size).toBe(WIDE_CHAPTERS.length);
  });

  it('every exception is a chapter that exists, never a pack chapter, and carries a written reason that says what lifts it', () => {
    for (const id of EXCEPTED) {
      expect(IDS, id).toContain(id);
      expect(PACK, id).not.toContain(id);
      const why = SCOPE_EXCEPTIONS[id]!;
      expect(why.length, id).toBeGreaterThan(80);
      expect(why, id).toMatch(/Lifts when/);
      expect(scopeExcepted(id)).toBe(true);
    }
    expect(scopeExcepted('seymour-flux')).toBe(false);
    expect(scopeExcepted(undefined)).toBe(false);
  });

  it('Yunalesca is an exception, for the reason the rules-on run gave (25 swap jerks of 40 px or more against 9) and the wide run of release 68 (63 planned cuts over 120 px)', () => {
    expect(EXCEPTED).toContain('yunalesca');
    expect(SCOPE_EXCEPTIONS['yunalesca']).toMatch(/25/);
    expect(SCOPE_EXCEPTIONS['yunalesca']).toMatch(/cutanchor/);
    expect(SCOPE_EXCEPTIONS['yunalesca']).toMatch(/63 planned cuts over 120 px/);
  });

  it('release 69 names exactly three exceptions, two FFX and one FFX-2 (Sin\'s face, Yunalesca; Ixion XVI), each with the number that put it out and what lifts it; Evrae left the list (release 69)', () => {
    expect([...EXCEPTED].sort()).toEqual(['ffx2-ixion-djose', 'sin-face', 'yunalesca']);
    expect(EXCEPTED).not.toContain('evrae-airship');
    expect(scopeExcepted('evrae-airship')).toBe(false);
    expect(SCOPE_EXCEPTIONS['sin-face']).toMatch(/FFX, Sin/);
    expect(SCOPE_EXCEPTIONS['sin-face']).toMatch(/224 px/);
    expect(SCOPE_EXCEPTIONS['ffx2-ixion-djose']).toMatch(/FFX-2, Ixion/);
    expect(SCOPE_EXCEPTIONS['ffx2-ixion-djose']).toMatch(/146 px/);
    for (const id of EXCEPTED) {
      expect(SCOPE_EXCEPTIONS[id], id).toMatch(/release 68/);
      expect(SCOPE_EXCEPTIONS[id], id).toMatch(/Lifts when/);
    }
  });
});

describe('chapterInScope, for all nineteen chapters', () => {
  it('pack: only Chapter I and Chapter IV', () => {
    expect(IDS.filter((id) => chapterInScope(id, 'pack'))).toEqual(['seymour-flux', 'ffx2-bahamut']);
  });

  it('wide: every chapter but the three exceptions (sixteen of the nineteen, Evrae among them since release 69), the pack chapters always', () => {
    const inside = IDS.filter((id) => chapterInScope(id, 'wide'));
    expect(inside).toHaveLength(16);
    expect(inside).toContain('evrae-airship');
    expect(inside).toHaveLength(19 - EXCEPTED.length);
    expect(IDS.filter((id) => !chapterInScope(id, 'wide')).sort()).toEqual([...EXCEPTED].sort());
    for (const p of PACK) expect(chapterInScope(p, 'wide')).toBe(true);
  });

  it('all: every chapter, the exceptions too (the measuring word)', () => {
    expect(IDS.filter((id) => chapterInScope(id, 'all'))).toEqual(IDS);
  });

  it('no chapter named: only all (a unit test with no battle), never wide or pack', () => {
    expect(chapterInScope(undefined, 'all')).toBe(true);
    expect(chapterInScope(undefined, 'wide')).toBe(false);
    expect(chapterInScope(undefined, 'pack')).toBe(false);
    // a hidden or experimental chapter is not one of the nineteen: wide leaves it alone, only the measuring word reaches it
    for (const hidden of ['fayth', 'windwaker', 'exp-leblanc', 'no-such-chapter']) {
      expect(chapterInScope(hidden, 'wide'), hidden).toBe(false);
      expect(chapterInScope(hidden, 'pack'), hidden).toBe(false);
      expect(chapterInScope(hidden, 'all'), hidden).toBe(true);
    }
  });
});

describe('through the live switches, in each of the nineteen chapters', () => {
  const live = (id: string, scope: SwapScope): { stance: string; keepsIdle: boolean; windUp: boolean; contact: string; recover: string; inScope: boolean } => {
    setCurvesChapter(id);
    setSwapScope(scope);
    setStanceMode('v1a');
    setCauseMode('pick');
    return { stance: stanceNow(), keepsIdle: menuKeepsIdle(), windUp: windUpOnIdle(), contact: swapHow('contact'), recover: swapHow('recover'), inScope: swapsInScope() };
  };

  it('scope pack: the two picks play in the pack chapters and release 66\'s look everywhere else', () => {
    for (const id of IDS) {
      const r = live(id, 'pack');
      if (PACK.includes(id)) {
        expect(r, id).toMatchObject({ stance: 'v1a', keepsIdle: true, windUp: false, contact: 'cut', recover: 'blend3', inScope: true });
      } else {
        expect(r, id).toMatchObject({ stance: 'today', keepsIdle: false, windUp: false, contact: 'today', recover: 'today', inScope: false });
      }
    }
  });

  it('scope wide: the picks play in all nineteen but the exceptions; an exception is release 67\'s look', () => {
    let played = 0;
    for (const id of IDS) {
      const r = live(id, 'wide');
      if (EXCEPTED.includes(id)) {
        expect(r, id).toMatchObject({ stance: 'today', keepsIdle: false, contact: 'today', recover: 'today', inScope: false });
      } else {
        played++;
        expect(r, id).toMatchObject({ stance: STANCE_DEFAULT, keepsIdle: true, contact: 'cut', recover: 'blend3', inScope: true });
      }
    }
    expect(played).toBe(19 - EXCEPTED.length);
  });

  it('scope all: the picks play in every one of the nineteen, the exceptions included', () => {
    for (const id of IDS) expect(live(id, 'all'), id).toMatchObject({ stance: STANCE_DEFAULT, keepsIdle: true, contact: 'cut', recover: 'blend3', inScope: true });
  });

  it('the covered classes are cut and the rest blended in every chapter that plays them: one rule for all nineteen', () => {
    for (const id of IDS.filter((x) => !EXCEPTED.includes(x))) {
      live(id, 'wide');
      for (const c of SWAP_CLASSES) expect(swapHow(c), `${id} ${c}`).toBe(COVERED.has(c) ? 'cut' : 'blend3');
    }
  });

  it('the explicit words still turn a chapter back: stance today and cause today are release 66\'s look in any scope', () => {
    for (const id of IDS) {
      setCurvesChapter(id);
      setSwapScope('all');
      setStanceMode('today');
      setCauseMode('today');
      expect(menuKeepsIdle(), id).toBe(false);
      expect(swapHow('contact'), id).toBe('today');
    }
  });
});

describe('the debug reader', () => {
  it('swapSwitch({ scope, cutAnchor }) forces both and says the scope, the exceptions and the anchor word', () => {
    const api: Record<string, unknown> = {};
    installSmearDebug(api);
    const swapSwitch = api['swapSwitch'] as (set?: { scope?: SwapScope; cutAnchor?: 'today' | 'on' | 'moving' }) => { scope: string; scopeExceptions: string[]; cutAnchor: string };
    const three = ['yunalesca', 'sin-face', 'ffx2-ixion-djose'];
    expect(swapSwitch()).toMatchObject({ scope: swapScope(), scopeExceptions: three });
    expect(swapSwitch({ scope: 'wide', cutAnchor: 'on' })).toMatchObject({ scope: 'wide', scopeExceptions: three, cutAnchor: 'on' });
    expect(swapSwitch({ scope: 'all' })).toMatchObject({ scope: 'all', cutAnchor: 'on' });
  });
});
