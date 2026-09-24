/**
 * The Leblanc Syndicate — painted art actually resolves in the real chapter.
 *
 * **Verifier finding, fixed here (fix pass, 2026-09-22):** every Leblanc-side
 * enemy record carried `spriteKey: 'ffx2-<name>'`, an unnecessary game
 * prefix. `BattlePresenterArt.artIdFor()` lets a set `spriteKey` win over the
 * bare combatant id with no override table entry, and the art track only
 * ever installed files at the **un-prefixed** paths
 * `public/art/characters/{leblanc,ormi,logos}/*.png` — so every requested
 * texture URL (`art/characters/ffx2-ormi/idle.png`, etc.) 404'd (a 200
 * SPA-fallback `index.html` on the dev server, a real 404 on the built site)
 * and the presenter never left its procedural placeholder, in any of the
 * three acts. `bahamut` genuinely needs the `ffx2-` prefix (it collides with
 * an FFX id) and has real files under **both** `bahamut/` and
 * `ffx2-bahamut/`; Vegnagun's Chapter 5 spriteKeys are correctly un-prefixed
 * and match their folders exactly — the pattern Leblanc should have followed.
 *
 * This test builds **real combatants from the real engine** (`FFX2Engine`,
 * the shipped `data.ENEMY_GROUPS_BY_ID` for all three acts) rather than
 * hand-built fixtures, runs them through the real presentation-layer
 * `artIdFor()`, and asserts the resolved art id has a real painted `idle.png`
 * on disk — the exact class of gap hard rule 4 ("built but wired to
 * nothing") exists to catch, on the art side rather than the module-import
 * side. It fails before the fix (every `ffx2-*` id has no folder) and passes
 * after (every id matches an installed one).
 *
 * **Update, 2026-09-24 (D-047):** Dr. Goon and Fem-Goon shipped their
 * approved painted idles (`docs/target/decisions.json` D-047; installed as
 * `public/art/characters/ffx2-{dr,fem}-goon/idle.png`, locked in
 * `approved-hashes.json`'s `chapter:leblanc-goons:2026-09-24` set). The
 * second test below used to pin the opposite — that they fell back to the
 * procedural placeholder — and now pins that both resolve real installed art.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14] — Leblanc, Ormi and Logos are
 * FFX-2-only characters; this is not shared plumbing.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { FFX2Engine, abilityRegistryFrom, dressphereRegistryFrom, garmentGridRegistryFrom, itemRegistryFrom } from '../../../src/battle/ffx2/index.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_ACT_I, LEBLANC_CHAIN_ORDER } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { artIdFor } from '../../../src/engine/BattlePresenterArt.ts';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function engineOptions() {
  return {
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false as const,
  };
}

/** Does `public/art/characters/<artId>/idle.png` actually exist on disk? */
function hasInstalledIdleArt(artId: string): boolean {
  return existsSync(join(REPO_ROOT, 'public', 'art', 'characters', artId, 'idle.png'));
}

/** Real, painted enemies this chapter ships — see `docs/concepts/chapters/leblanc/production.md`. */
const PAINTED_ENEMY_IDS = new Set(['leblanc', 'logos', 'ormi', 'ormi-entrance', 'ormi-logos-room', 'logos-room']);

describe('Leblanc Syndicate — painted art resolves in every act', () => {
  it('every real engine combatant for Leblanc/Ormi/Logos resolves an installed idle painting', () => {
    const engine = new FFX2Engine(engineOptions());
    const seen = new Set<string>();
    for (const actId of LEBLANC_CHAIN_ORDER) {
      const group = data.ENEMY_GROUPS_BY_ID[actId];
      if (!group) throw new Error(actId);
      engine.setSeed(7);
      engine.init({ game: 'ffx2', party: chateauBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: false });

      for (const c of Object.values(engine.state().combatants)) {
        if (c.side !== 'enemy') continue;
        if (!PAINTED_ENEMY_IDS.has(c.id)) continue; // Dr. Goon / Fem-Goon: checked separately below (D-047).
        seen.add(c.id);

        const artId = artIdFor(c);
        expect(artId.startsWith('ffx2-'), `${actId}/${c.id} resolved art id "${artId}" still carries the unnecessary game prefix`).toBe(false);
        expect(hasInstalledIdleArt(artId), `${actId}/${c.id} resolved art id "${artId}" has no public/art/characters/${artId}/idle.png on disk`).toBe(true);
      }
    }
    // Sanity: the assertions above did fire for all six painted identities,
    // not zero of them because a combatant id changed out from under this test.
    expect([...seen].sort()).toEqual([...PAINTED_ENEMY_IDS].sort());
  });

  it('Dr. Goon and Fem-Goon resolve their approved idle art (D-047)', () => {
    const engine = new FFX2Engine(engineOptions());
    const group = data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_I];
    if (!group) throw new Error(LEBLANC_ACT_I);
    engine.init({ game: 'ffx2', party: chateauBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: false });
    const seen = new Set<string>();
    for (const c of Object.values(engine.state().combatants)) {
      if (c.id !== 'dr-goon' && c.id !== 'fem-goon') continue;
      seen.add(c.id);
      const artId = artIdFor(c);
      expect(hasInstalledIdleArt(artId), `${c.id} resolved art id "${artId}" has no installed idle.png`).toBe(true);
    }
    // Sanity: both goons were actually present and checked, not zero of them
    // because a combatant id changed out from under this test.
    expect(seen).toEqual(new Set(['dr-goon', 'fem-goon']));
  });
});
