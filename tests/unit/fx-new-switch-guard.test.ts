/**
 * The new spell effects' switch, frame-time guard, weapon table and ids (motion pass, lane "fx"; Bailey 2026-10-22). Pure: no GPU, no page.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { parseFxQuery } from '../../src/engine/fx/EyeCandy.ts';
import { FX_DEMO_CHAPTERS, fxModeFromSearch, fxNewOn, inFxDemoChapter, setFxChapter, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { ABSOLUTE_MS, CALM_MIN, FALLBACK_BUDGET_MS, FxPerfGuard, HOLD, RATIO, RECOVER, SCALE_STEPS, STALL_MS, THIN_LEVELS, WINDOW, trimmedMean } from '../../src/engine/spellfx/FxPerfGuard.ts';
import { sparkKindFor } from '../../src/engine/spellfx/SparkWeapon.ts';
import { ABILITY_FX, BUFF_FX_IDS, FRESH_ONLY_FX, SPELL_FX_IDS } from '../../src/engine/spellfx/SpellFxRegistry.ts';
import { resolveAbilityFx } from '../../src/engine/spellfx/SpellFxLookup.ts';

afterEach(() => {
  setFxMode(null);
  setFxChapter(undefined);
});

describe('the new effects switch', () => {
  it('is off with no page, with ?pack=off and in a unit test, and whatever the chapter; since r64 an address with no pack word takes the conference default', () => {
    expect(fxModeFromSearch(undefined)).toBe('today');
    expect(fxModeFromSearch('?pack=off')).toBe('today');
    expect(fxModeFromSearch('')).toBe('new'); // r64 (item 200b)
    expect(fxModeFromSearch('?pack=other')).toBe('new'); // an unknown pack word names nothing: the default decides
    setFxMode(null);
    setFxChapter('seymour-flux');
    expect(fxNewOn()).toBe(false); // no page address under vitest: today
  });

  it('?fx=new and the shared ?pack=demo turn it on; ?fx=today wins over the pack; a list is read word by word', () => {
    expect(fxModeFromSearch('?fx=new')).toBe('new');
    expect(fxModeFromSearch('?pack=demo')).toBe('new');
    expect(fxModeFromSearch('?pack=demo&fx=today')).toBe('today');
    expect(fxModeFromSearch('?fx=new,b')).toBe('new');
    expect(fxModeFromSearch('?fx=b,today&pack=demo')).toBe('today');
    expect(fxModeFromSearch('?pack=off&FX=NEW')).toBe('today'); // keys are exact; values are not case-sensitive:
    expect(fxModeFromSearch('?fx=NEW')).toBe('new');
    expect(fxModeFromSearch('?pack=off&fx=a')).toBe('today');
  });

  it('the eye-candy parser of the same key ignores the two new words', () => {
    const plain = parseFxQuery('');
    expect(parseFxQuery('?fx=new').on).toEqual(plain.on); // an unknown word names nothing: option D, as with no key
    expect(parseFxQuery('?fx=new').named).toBe(false);
    expect(parseFxQuery('?fx=today').named).toBe(false);
    const both = parseFxQuery('?fx=new,b');
    expect(both.named).toBe(true);
    expect(both.on).toEqual({ a: false, b: true, c: false });
  });

  it('plays only in the two demo chapters, only when switched on', () => {
    expect(Object.keys(FX_DEMO_CHAPTERS).sort()).toEqual(['ffx2-bahamut', 'seymour-flux']);
    expect(FX_DEMO_CHAPTERS['seymour-flux']).toBe('ffx');
    expect(FX_DEMO_CHAPTERS['ffx2-bahamut']).toBe('ffx2');
    expect(inFxDemoChapter('seymour-flux')).toBe(true);
    expect(inFxDemoChapter('ffx2-bahamut')).toBe(true);
    expect(inFxDemoChapter('evrae')).toBe(false);
    expect(inFxDemoChapter(undefined)).toBe(false);
    setFxMode('new');
    expect(fxNewOn()).toBe(false); // no chapter named
    setFxChapter('seymour-flux');
    expect(fxNewOn()).toBe(true);
    setFxChapter('ffx2-bahamut');
    expect(fxNewOn()).toBe(true);
    setFxChapter('some-other-chapter');
    expect(fxNewOn()).toBe(false);
    setFxChapter('seymour-flux');
    setFxMode('today');
    expect(fxNewOn()).toBe(false);
  });
});

describe('the frame-time guard', () => {
  /** A guard that has seen a calm display at `ms` per frame. */
  const calm = (ms: number): FxPerfGuard => {
    const g = new FxPerfGuard();
    for (let i = 0; i < CALM_MIN + 6; i++) g.frame(ms, false);
    return g;
  };
  const busy = (g: FxPerfGuard, ms: number, n: number): number => {
    let changes = 0;
    for (let i = 0; i < n; i++) if (g.frame(ms, true)) changes++;
    return changes;
  };

  it('learns the display\'s calm interval and holds busy frames to it (120 Hz and 60 Hz)', () => {
    const g120 = calm(1000 / 120);
    expect(g120.calmMs).toBeCloseTo(8.33, 1);
    expect(g120.budgetMs).toBeCloseTo(Math.max((1000 / 120) * RATIO, 1000 / 120 + ABSOLUTE_MS), 2);
    const g60 = calm(1000 / 60);
    expect(g60.budgetMs).toBeGreaterThan(g120.budgetMs);
    expect(new FxPerfGuard().calmMs).toBeNull();
    expect(new FxPerfGuard().budgetMs).toBe(FALLBACK_BUDGET_MS);
  });

  it('does nothing while the frames keep the display\'s rate', () => {
    const g = calm(1000 / 120);
    expect(busy(g, 1000 / 120, WINDOW * 6)).toBe(0);
    expect(g.level).toBe(0);
    expect(g.scaleStep).toBe(0);
    expect(g.share).toEqual({ particles: 1, trails: 1 });
  });

  it('thins the particles and trails first, one level a window, then asks for the 3D scale, twice at most', () => {
    const g = calm(1000 / 120);
    const slow = 1000 / 70; // 70 fps on a 120 Hz screen
    let steps = 0;
    const seen: Array<{ level: number; scale: number }> = [];
    for (let i = 0; i < (WINDOW + HOLD) * 12; i++) {
      if (g.frame(slow, true)) {
        steps++;
        seen.push({ level: g.level, scale: g.scaleStep });
      }
    }
    expect(seen).toEqual([
      { level: 1, scale: 0 },
      { level: 2, scale: 0 },
      { level: 2, scale: 1 },
      { level: 2, scale: 2 },
    ]);
    expect(steps).toBe(4);
    expect(g.share).toEqual(THIN_LEVELS[2]);
    expect(g.share.trails).toBe(0);
    expect(g.scaleFactor).toBe(SCALE_STEPS[2]);
    expect(g.scaleFactor).toBeLessThan(1);
    expect(g.scaleFactor).toBeGreaterThanOrEqual(0.8); // "slightly"
    // nothing more to give: it stays there
    expect(busy(g, slow, WINDOW * 8)).toBe(0);
  });

  it('a 60 Hz display is held to 60 Hz, not to 120', () => {
    const g = calm(1000 / 60);
    expect(busy(g, 1000 / 60, WINDOW * 5)).toBe(0);
    expect(busy(g, 1000 / 40, (WINDOW + HOLD) * 3)).toBeGreaterThan(0);
  });

  it('a hitch or a stall is not a reading', () => {
    const g = calm(1000 / 120);
    for (let w = 0; w < 6; w++) {
      for (let i = 0; i < WINDOW; i++) g.frame(i % 24 === 0 ? 90 : 1000 / 120, true); // two 90 ms hitches in 48 frames: the top tenth is left out
    }
    expect(g.level).toBe(0);
    expect(g.frame(STALL_MS + 1, true)).toBe(false);
    expect(g.frame(NaN, true)).toBe(false);
    expect(trimmedMean([1, 1, 1, 1, 1, 1, 1, 1, 1, 100])).toBe(1);
  });

  it('gives the particles back one level at a time once the frames are calm again, but keeps the scale', () => {
    const g = calm(1000 / 120);
    const slow = 1000 / 70;
    busy(g, slow, (WINDOW + HOLD) * 12);
    expect(g.level).toBe(2);
    expect(g.scaleStep).toBe(2);
    busy(g, 1000 / 120, WINDOW + RECOVER * 2 + 20);
    expect(g.level).toBe(0);
    expect(g.scaleStep).toBe(2);
  });

  it('without a calm baseline it falls back to a tolerant budget; reset clears the scale only when told to', () => {
    const g = new FxPerfGuard();
    expect(busy(g, 12, WINDOW * 3)).toBe(0);
    expect(busy(g, 30, (WINDOW + HOLD) * 2)).toBeGreaterThan(0);
    g.reset();
    expect(g.level).toBe(0);
    const h = calm(1000 / 120);
    busy(h, 1000 / 70, (WINDOW + HOLD) * 12);
    expect(h.scaleStep).toBe(2);
    h.reset();
    expect(h.scaleStep).toBe(2);
    h.reset(true);
    expect(h.scaleStep).toBe(0);
  });

  it('reports its stand for the debug API', () => {
    const g = calm(1000 / 120);
    const s = g.stats();
    expect(s).toMatchObject({ level: 0, scaleStep: 0, steps: 0 });
    expect(s.calmMs).toBeCloseTo(8.33, 1);
  });
});

describe('which weapon a striker swings (for the hit sparks)', () => {
  it('FFX reads the character\'s weaponType; FFX-2 the dressphere worn, else the girl\'s own', () => {
    expect(sparkKindFor('ffx', 'tidus')).toBe('sword');
    expect(sparkKindFor('ffx', 'kimahri')).toBe('spear');
    expect(sparkKindFor('ffx', 'yuna')).toBe('staff');
    expect(sparkKindFor('ffx', 'auron')).toBe('katana');
    expect(sparkKindFor('ffx', 'wakka')).toBe('blitzball');
    expect(sparkKindFor('ffx', 'lulu')).toBe('doll');
    expect(sparkKindFor('ffx2', 'yuna')).toBe('gun');
    expect(sparkKindFor('ffx2', 'rikku')).toBe('dagger');
    expect(sparkKindFor('ffx2', 'paine')).toBe('greatsword');
    expect(sparkKindFor('ffx2', 'rikku', 'gunner')).toBe('gun');
    expect(sparkKindFor('ffx2', 'paine', 'warrior')).toBe('greatsword');
  });

  it('anyone not on the tables is the generic hit, and an FFX id never resolves in FFX-2', () => {
    expect(sparkKindFor('ffx', 'seymour-flux')).toBe('generic');
    expect(sparkKindFor('ffx2', 'bahamut')).toBe('generic');
    expect(sparkKindFor('ffx2', 'tidus')).toBe('generic');
    expect(sparkKindFor('ffx', undefined)).toBe('generic');
    expect(sparkKindFor('ff7', 'tidus')).toBe('generic');
  });
});

describe('the buff spells\' ids with the switch off (review m4)', () => {
  it('resolve exactly as they did before the buffs existed: FFX Haste is a heal (Cure), every other buff row is the bloom', () => {
    setFxMode('today');
    setFxChapter('seymour-flux');
    expect(resolveAbilityFx('haste', 'ffx')).toBe('cure');
    expect(resolveAbilityFx('hastega', 'ffx')).toBe('cure');
    for (const id of ['shell', 'protect', 'reflect', 'dispel']) expect(resolveAbilityFx(id, 'ffx')).toBe('bloom');
    for (const id of ['x2-shared-haste', 'x2-shared-hastega', 'x2-white-mage-shell', 'x2-white-mage-protect', 'x2-white-mage-reflect', 'x2-white-mage-dispel']) expect(resolveAbilityFx(id, 'ffx2')).toBe('bloom');
    setFxMode('new'); // in a chapter that is not a demo chapter the switch is off too
    setFxChapter('evrae');
    expect(resolveAbilityFx('haste', 'ffx')).toBe('cure');
  });
});

describe('the buff spells\' ids', () => {
  it('Haste, Shell, Protect, Reflect and Dispel have effect ids in both games and are new-only', () => {
    for (const id of BUFF_FX_IDS) {
      expect(SPELL_FX_IDS).toContain(id);
      expect(FRESH_ONLY_FX.has(id)).toBe(true);
    }
    setFxMode('new');
    setFxChapter('seymour-flux');
    expect(resolveAbilityFx('haste', 'ffx')).toBe('haste');
    expect(resolveAbilityFx('hastega', 'ffx')).toBe('haste');
    expect(resolveAbilityFx('shell', 'ffx')).toBe('shell');
    expect(resolveAbilityFx('protect', 'ffx')).toBe('protect');
    expect(resolveAbilityFx('reflect', 'ffx')).toBe('reflect');
    expect(resolveAbilityFx('dispel', 'ffx')).toBe('dispel');
    expect(resolveAbilityFx('x2-white-mage-shell', 'ffx2')).toBe('shell');
    expect(resolveAbilityFx('x2-white-mage-protect', 'ffx2')).toBe('protect');
    expect(resolveAbilityFx('x2-shared-haste', 'ffx2')).toBe('haste');
    expect(resolveAbilityFx('x2-white-mage-dispel', 'ffx2')).toBe('dispel');
    // the table names only buffs for these, and nothing else changed
    expect(resolveAbilityFx('cure', 'ffx')).toBe('cure');
    expect(resolveAbilityFx('attack', 'ffx')).toBe('hit');
    expect(Object.values(ABILITY_FX).filter((v) => FRESH_ONLY_FX.has(v)).length).toBe(12);
  });
});
