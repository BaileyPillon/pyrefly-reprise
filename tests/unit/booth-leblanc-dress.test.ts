/**
 * THE REAL CLIPS FOLLOW THE DRESS, NOT THE GIRL (release 69, branch `booth-leblanc`; FFX-2 only; B7 of the booth inventory). `REAL_MOTION.ffx2` was decoded for three dresses (Yuna White Mage c018, Rikku Dark Knight c033, Paine Warrior
 * c051: Chapter IV's), but `realKeyOf` matched by the girl's name, so widening `?curves=real-snappy` to Chapter VI would have driven Yuna Gunner and Rikku Thief with the White Mage's and the Dark Knight's clips. In a chapter the treatment
 * joined beyond the booth pair a girl matches only in a dress the table has; Chapter IV (and a unit test with no chapter) keeps the prefix rule, byte for byte.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { REAL_DRESS_ROWS, realKeyOf, realRowOf, realStrikeProfile } from '../../src/engine/motion/RealMotion.ts';
import { REAL_MOTION } from '../../src/data/motion/realMotion.ts';

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
});

describe('the real clips follow the dress, not the girl (FFX-2; B7)', () => {
  it('Chapter IV is byte for byte release 68: the girl\'s name picks the row, in any dress, and with no chapter named', () => {
    for (const scope of ['pack', 'all'] as const) {
      setTreatedScope(scope);
      for (const chapter of ['ffx2-bahamut', undefined]) {
        setDemoChapter(chapter);
        for (const art of ['yuna-white-mage', 'yuna-gunner', 'yuna-dark-knight', 'rikku-dark-knight', 'rikku-thief', 'paine-warrior', 'paine-dark-knight']) {
          expect(realRowOf('ffx2', art), `${scope} ${chapter} ${art}`).toBe(REAL_MOTION.ffx2[realKeyOf(art, 'ffx2')!]);
        }
        expect(realRowOf('ffx2', 'ffx2-bahamut')).toBe(REAL_MOTION.ffx2['bahamut']);
      }
    }
    expect(realKeyOf('yuna-gunner', 'ffx2')).toBe('yuna');
    expect(realKeyOf('rikku-thief', 'ffx2')).toBe('rikku');
  });

  it('in Leblanc (scope all) only the three dresses the rows were decoded for match: Paine Warrior plays hers, Yuna Gunner and Rikku Thief play the house curves', () => {
    setTreatedScope('all');
    setDemoChapter('ffx2-leblanc');
    expect(realRowOf('ffx2', 'paine-warrior')).toBe(REAL_MOTION.ffx2['paine']);
    expect(realRowOf('ffx2', 'yuna-gunner')).toBeUndefined();
    expect(realRowOf('ffx2', 'rikku-thief')).toBeUndefined();
    expect(realRowOf('ffx2', 'yuna-white-mage')).toBe(REAL_MOTION.ffx2['yuna']);
    expect(realRowOf('ffx2', 'rikku-dark-knight')).toBe(REAL_MOTION.ffx2['rikku']);
    expect(realRowOf('ffx2', 'paine-dark-knight')).toBeUndefined(); // Chapters V, XI, XIII, XV, XVI wear it: a dress with no row waits for one
    expect(realStrikeProfile('ffx2', 'yuna-gunner', 'snappy')).toBeUndefined();
    expect(realStrikeProfile('ffx2', 'paine-warrior', 'snappy')).toBeDefined();
    expect(Object.keys(REAL_DRESS_ROWS).sort()).toEqual(['paine-warrior', 'rikku-dark-knight', 'yuna-white-mage']);
  });

  it('under `?treated=pack` (release 68) Leblanc is not a treated chapter, so nothing in the real rows reads differently there either', () => {
    setTreatedScope('pack');
    setDemoChapter('ffx2-leblanc');
    expect(realRowOf('ffx2', 'yuna-gunner')).toBe(REAL_MOTION.ffx2['yuna']); // the legacy prefix rule: today's, and the curves are off in her chapter so no row is read
  });

  it('FFX rows and the bosses are untouched by the strict rule', () => {
    setTreatedScope('all');
    setDemoChapter('ffx2-leblanc');
    expect(realRowOf('ffx', 'tidus')).toBe(REAL_MOTION.ffx['tidus']);
    expect(realRowOf('ffx', 'seymour-flux-body')).toBe(REAL_MOTION.ffx['seymourFlux']);
    expect(realKeyOf('ffx2-bahamut', 'ffx2', true)).toBe('bahamut');
    expect(realKeyOf(undefined, 'ffx2', true)).toBeUndefined();
  });
});
