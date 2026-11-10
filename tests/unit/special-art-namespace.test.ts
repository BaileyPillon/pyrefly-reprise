/**
 * The Special's art rule, and the art the experimental Leblanc chapter does not have yet (FFX-2 only: the three Special dresspheres exist only in FFX-2; `specialDressUp` is OFF in every build).
 *
 * A girl in her Special asks for her Special's painting ONLY, never her stale sprite key (SPEC-C2, `engine/SpecialArt.ts#specialArtCandidates`): a Special wears no node's dress, and her old key
 * (`yuna-white-mage`) would draw the old dress under the Special's name. Inside the art namespace of the experimental chapter (`exp-leblanc`, `data/art/artNamespace.ts`) the one id is namespaced. A
 * part of a Special is figure-less and is never asked for an art id. Every ordinary figure keeps the three-id list it always had.
 *
 * The last case states the art gap as data. It was found by the review fix pass 2 and recorded as OP-38 in `docs/handoff/ffx2-specials.md`: no idle painting of any Special exists today, in the plain
 * namespace or in `exp-leblanc`, so the `specialDressUp` switch may not go on for any chapter until Stage 2 installs the paintings (namespaced for the experimental chapter) or `SpecialArt` gets a
 * namespace fallback. That list must SHRINK as Stage 2 installs paintings, and the switch stays OFF while it is not empty.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { AnyCombatant } from '../../src/battle/common/types.ts';
import { FORMS, GIRL_SPECIAL, isSpecialDress } from '../../src/battle/ffx2/special/forms.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { artCandidatesFor, artIdFor } from '../../src/engine/BattlePresenterArt.ts';
import { parseArtManifest } from '../../src/engine/ArtManifest.ts';
import { ownedSpecialArtIds } from '../../src/engine/SpecialArt.ts';
import { SPECIAL_ART_IDS } from '../../src/engine/SpecialArtIds.ts';
// The tooling half of the namespace (plain JS), as tests/unit/exp-leblanc.test.ts reads it.
import { NAMESPACE } from '../../tools/exp-art-lib.mjs';

const REPO = join(__dirname, '..', '..');
const ART = join(REPO, 'public', 'art');
const HAVE_ART = existsSync(join(ART, 'manifest.json')) && existsSync(join(ART, 'characters', 'yuna-gunner', 'idle.png'));

const ns = NAMESPACE as string;

/** A girl as the stage meets her: her id, her build sprite key and the dressphere she wears. */
function girlIn(memberId: string, dressphere: string): AnyCombatant {
  const m = chateauBuild.members.find((x) => x.id === memberId)!;
  return { id: m.id, name: m.name, side: 'party', spriteKey: m.spriteKey, dresspheres: { current: dressphere, owned: m.owned } } as unknown as AnyCombatant;
}

const owners = chateauBuild.members.filter((m) => GIRL_SPECIAL[m.id] !== undefined && m.owned.includes(GIRL_SPECIAL[m.id] as string));
const specialArt = (girl: string): string => `${girl}-${GIRL_SPECIAL[girl]}`;

describe('the chapter this file reads: Chapter VI\'s build, which the experimental chapter plays', () => {
  it('has girls who own their Specials, and every Special id is a Special dress', () => {
    expect(owners.map((m) => m.id)).toEqual(['yuna', 'rikku']);
    for (const m of owners) expect(isSpecialDress(GIRL_SPECIAL[m.id]), m.id).toBe(true);
  });
});

describe('a girl in her Special asks for her Special\'s painting only', () => {
  for (const m of owners) {
    it(`${m.id} in ${GIRL_SPECIAL[m.id]}: exactly [${specialArt(m.id)}], and inside the namespace exactly [${ns}-${specialArt(m.id)}]`, () => {
      const c = girlIn(m.id, GIRL_SPECIAL[m.id] as string);
      expect(artIdFor(c)).toBe(specialArt(m.id));
      expect(artCandidatesFor(c)).toEqual([specialArt(m.id)]);
      expect(artCandidatesFor(c, ns)).toEqual([`${ns}-${specialArt(m.id)}`]);
      // never her stale sprite key, which would draw the old dress under the Special's name
      expect(artCandidatesFor(c)).not.toContain(m.spriteKey);
      expect(artCandidatesFor(c, ns)).not.toContain(`${ns}-${m.spriteKey}`);
      expect(SPECIAL_ART_IDS.has(specialArt(m.id))).toBe(true);
    });
  }

  it('the answer holds for each of the three Specials (Paine\'s too, though Chapter VI\'s build does not list it)', () => {
    for (const [girl, special] of Object.entries(GIRL_SPECIAL)) {
      const c = { id: girl, name: girl, side: 'party', spriteKey: `${girl}-white-mage`, dresspheres: { current: special } } as unknown as AnyCombatant;
      expect(artCandidatesFor(c), girl).toEqual([`${girl}-${special}`]);
      expect(artCandidatesFor(c, ns), girl).toEqual([`${ns}-${girl}-${special}`]);
    }
  });
});

describe('a part of a Special is never asked for an art id', () => {
  for (const form of Object.values(FORMS)) {
    for (const pod of form.pods) {
      it(`${pod.id} (${pod.name} of ${form.name}) gets [] with and without the namespace`, () => {
        const c = { id: pod.id, name: pod.name, side: 'party', spriteKey: pod.id, dresspheres: { current: pod.id } } as unknown as AnyCombatant;
        expect(artCandidatesFor(c)).toEqual([]);
        expect(artCandidatesFor(c, ns)).toEqual([]);
      });
    }
  }
});

describe('an ordinary girl keeps the three-id list she always had', () => {
  for (const m of chateauBuild.members) {
    for (const dress of new Set([m.currentDressphere, ...m.owned].filter((d) => !isSpecialDress(d)))) {
      it(`${m.id} in ${dress}`, () => {
        const c = girlIn(m.id, dress);
        expect(artCandidatesFor(c)).toEqual([`${m.id}-${dress}`, m.spriteKey, m.id]);
        expect(artCandidatesFor(c, ns)).toEqual([`${ns}-${m.id}-${dress}`, `${ns}-${m.spriteKey}`, `${ns}-${m.id}`]);
      });
    }
  }
});

describe('the preload asks for the art of the Specials a girl owns, and of nobody else', () => {
  it('names each owner\'s Special painting, inside the namespace when there is one; a girl without one gets none', () => {
    for (const m of owners) {
      const c = girlIn(m.id, m.currentDressphere);
      expect(ownedSpecialArtIds(c)).toEqual([specialArt(m.id)]);
      expect(ownedSpecialArtIds(c, ns)).toEqual([`${ns}-${specialArt(m.id)}`]);
    }
    const paine = girlIn('paine', 'gunner'); // Chapter VI's build lists no Full Throttle for her
    expect(ownedSpecialArtIds(paine)).toEqual([]);
    expect(ownedSpecialArtIds(paine, ns)).toEqual([]);
  });
});

describe('the art gap, as data', () => {
  // This list must SHRINK when Stage 2 installs the Special paintings (and the namespaced ones for the experimental chapter). The switch may not go on for a chapter whose Special paintings are
  // missing: the girl would be drawn as nothing (OP-38 in docs/handoff/ffx2-specials.md).
  it.skipIf(!HAVE_ART)('lists exactly the Special art ids (plain and namespaced) that have no idle painting in the real manifest today', () => {
    const manifest = parseArtManifest(JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8')))!;
    const ids = [...SPECIAL_ART_IDS].sort().flatMap((id) => [id, `${ns}-${id}`]);
    const missing = ids.filter((id) => !manifest.subjects[id]?.states.includes('idle'));
    expect(missing).toEqual([
      'paine-full-throttle', 'exp-leblanc-paine-full-throttle',
      'rikku-machina-maw', 'exp-leblanc-rikku-machina-maw',
      'yuna-floral-fallal', 'exp-leblanc-yuna-floral-fallal',
    ]);
    // and the manifest holds no subject of those names at all, in any namespace
    expect(Object.keys(manifest.subjects).filter((id) => /floral-fallal|machina-maw|full-throttle/.test(id))).toEqual([]);
  });
});
