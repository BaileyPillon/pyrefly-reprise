/**
 * Test 7 of the FFX-2 Special look (step C2; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2; the candidates of every other combatant are pinned
 * by `special-c2-pins.test.ts`): which art ids the stage and the preload ask for.
 *
 * Held here: the art id of each main is `yuna-floral-fallal`, `rikku-machina-maw`, `paine-full-throttle` and her list holds no stale `spriteKey` (G9); a part is asked for nothing (G7: `[]`, never the
 * doubled `<id>-<id>`), and a stub staged without a manifest sends no request that names a part; the preload's `ownedSpecialArtIds` names each Special a girl owns and nothing else.
 *
 * Removal: drop the `specialArtCandidates` line of `artCandidatesFor` and the part and stale-key cases fail.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AnyCombatant } from '../../src/battle/common/types.ts';
import { FORMS } from '../../src/battle/ffx2/special/forms.ts';
import { artCandidatesFor, artIdFor, resolveArt } from '../../src/engine/BattlePresenterArt.ts';
import { ownedSpecialArtIds, specialArtCandidates } from '../../src/engine/SpecialArt.ts';
import { FORM_GIRLS } from './helpers/specialFormState.ts';

const girl = (id: string, special: string, spriteKey = `${id}-white-mage`): AnyCombatant =>
  ({ id, side: 'party', spriteKey, flags: {}, level: 30, dresspheres: { current: special, owned: ['white-mage', special] } }) as unknown as AnyCombatant;
const pod = (id: string): AnyCombatant => ({ id, side: 'party', spriteKey: id, flags: {}, level: 30 }) as unknown as AnyCombatant;

afterEach(() => vi.unstubAllGlobals());

describe('the main body of a Special', () => {
  it.each(FORM_GIRLS)('$girl asks for $girl-$special and nothing else (no stale White Mage entry), bare and in a namespace', ({ girl: id, special }) => {
    const c = girl(id, special);
    expect(artIdFor(c)).toBe(`${id}-${special}`);
    expect(artCandidatesFor(c)).toEqual([`${id}-${special}`]);
    expect(artCandidatesFor(c, 'exp-leblanc')).toEqual([`exp-leblanc-${id}-${special}`]);
    expect(specialArtCandidates(c, artIdFor(c))).toEqual([`${id}-${special}`]);
  });

  it('a girl in an ordinary dress is untouched: the helper answers null, so the caller keeps today\'s list', () => {
    const c = girl('yuna', 'gunner', 'yuna-gunner');
    expect(specialArtCandidates(c, artIdFor(c))).toBeNull();
    expect(artCandidatesFor(c)).toEqual(['yuna-gunner', 'yuna-gunner', 'yuna']);
  });
});

describe('the six parts', () => {
  const ids = Object.values(FORMS).flatMap((f) => f.pods.map((p) => p.id));

  it('are six distinct pods, each asked for nothing (never the doubled id)', () => {
    expect(new Set(ids).size).toBe(6);
    for (const id of ids) {
      expect(artCandidatesFor(pod(id)), id).toEqual([]);
      expect(artCandidatesFor(pod(id), 'exp-leblanc'), id).toEqual([]);
    }
  });

  it('send no request that names a part, with a manifest or with none (a stub\'s probes are never made)', async () => {
    const requested: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      requested.push(String(url));
      return new Response(null, { status: 404 });
    }));
    for (const id of ids) await resolveArt(artCandidatesFor(pod(id)), 'party');
    expect(requested.filter((u) => ids.some((id) => u.includes(id)))).toEqual([]);
    expect(requested).toEqual([]);
  });
});

describe('the preload\'s list', () => {
  it('names each Special a girl owns, in her namespace, and nothing for anyone else or for a part', () => {
    for (const { girl: id, special } of FORM_GIRLS) {
      const owner = { ...girl(id, 'white-mage'), dresspheres: { current: 'white-mage', owned: ['white-mage', special] } } as unknown as AnyCombatant;
      expect(ownedSpecialArtIds(owner)).toEqual([`${id}-${special}`]);
      expect(ownedSpecialArtIds(owner, 'exp-leblanc')).toEqual([`exp-leblanc-${id}-${special}`]);
    }
    const none = { ...girl('yuna', 'white-mage'), dresspheres: { current: 'white-mage', owned: ['white-mage'] } } as unknown as AnyCombatant;
    expect(ownedSpecialArtIds(none)).toEqual([]);
    expect(ownedSpecialArtIds(pod('floral-fallal-right-pistil'))).toEqual([]);
    expect(ownedSpecialArtIds({ id: 'tidus', side: 'party', flags: {} } as unknown as AnyCombatant)).toEqual([]);
  });
});
