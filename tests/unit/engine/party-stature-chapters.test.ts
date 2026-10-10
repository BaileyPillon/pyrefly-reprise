/**
 * **The party-stature rule against the real chapters** (`src/engine/PartyStature.ts` with each chapter's own scene slots and party build).
 *
 * `stage-party-stature.test.ts` drives the stage with made-up slots; this one reads what the game ships: the registry's chapters, the
 * party each chapter fields, and the slots of the scene each stands in. It holds that
 *
 * - the eleven FFX chapters (I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII) are the only ones the rule reaches, by the chapter's own
 *   `game`; every FFX-2 chapter (IV, V, VI, XI, XIII, XV, XVI), the hidden Leblanc experiment and the hidden FF7 one get exactly the
 *   height their scene gave them before this change, whoever stands in them (FFX-2's Yuna and Rikku share two ids with FFX's);
 * - in an FFX chapter every hero stands at his scene's party height times the table's ratio, so Tidus stands at the party height itself and
 *   Kimahri's painting is 30 percent over his (his body 21 percent), with one exception: a scene that names a hero's height keeps it (Chapter XIV's Yuna), and no other FFX
 *   scene names a hero.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';

import type { FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { CHARACTER_IDS } from '../../../src/data/ffx/ids.ts';
import { FFX_PARTY_STATURE } from '../../../src/data/ffx/party-stature.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, type Chapter } from '../../../src/data/encounters.ts';
import { figureHeight, partyStature, setStatureOff } from '../../../src/engine/PartyStature.ts';
import { getScene } from '../../../src/scenes/index.ts';

const FFX_CHAPTERS = [
  'seymour-flux', // I
  'yunalesca', // II
  'braskas-final-aeon', // III
  'seymour-anima-macalania', // VII
  'evrae-airship', // VIII
  'yojimbo-cavern', // IX
  'seymour-natus', // X
  'seymour-omnis', // XII
  'isaaru-via-purifico', // XIV
  'sin-fins-core', // XVII
  'sin-face', // XVIII
] as const;

const ALL: readonly Chapter[] = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS];

/** Every id a chapter's party may field: the build's members (FFX: the bench too; FFX-2: the girls). */
function membersOf(c: Chapter): string[] {
  const build = c.buildRef as { members?: Array<{ id: string }> };
  return (build.members ?? []).map((m) => m.id);
}

function slotsOf(c: Chapter): { partyHeight: number; figureHeights: Readonly<Record<string, number>> } {
  const entry = getScene(c.sceneKey);
  expect(entry, `${c.id}'s scene "${c.sceneKey}" is registered`).toBeDefined();
  return { partyHeight: entry!.slots.partyHeight ?? 1.82, figureHeights: entry!.slots.figureHeights ?? {} };
}

describe('party stature against the shipped chapters', () => {
  setStatureOff(false);

  it('reaches exactly the eleven FFX chapters, by the chapter\'s own game', () => {
    expect(CHAPTERS.filter((c) => c.game === 'ffx').map((c) => c.id).sort()).toEqual([...FFX_CHAPTERS].sort());
    for (const c of ALL.filter((x) => x.game !== 'ffx')) expect(['ffx2', 'ff7'], c.id).toContain(c.game);
    expect(CHAPTERS.filter((c) => c.game === 'ffx2')).toHaveLength(7);
  });

  it('stands every hero of an FFX chapter at his scene\'s party height times his ratio, Tidus at the party height itself', () => {
    for (const id of FFX_CHAPTERS) {
      const c = ALL.find((x) => x.id === id)!;
      const { partyHeight, figureHeights } = slotsOf(c);
      const build = c.buildRef as FFXPartyBuild;
      expect(build.members.length, id).toBeGreaterThanOrEqual(1); // seven in most, six where Yuna is away (Chapter VIII), Yuna alone in Chapter XIV
      for (const hero of membersOf(c)) {
        expect(CHARACTER_IDS as readonly string[], `${id} fields ${hero}`).toContain(hero);
        const f = figureHeight({ shared: partyHeight, own: figureHeights[hero], stature: partyStature(c.game, 'party', hero) });
        const named = figureHeights[hero];
        expect(f.height, `${id} ${hero}`).toBe(named ?? partyHeight * FFX_PARTY_STATURE[hero as keyof typeof FFX_PARTY_STATURE].ratio);
        if (hero === 'tidus') expect(f.height, `${id} tidus`).toBe(partyHeight);
      }
    }
  });

  it("puts Kimahri's painting 30 percent over Tidus's (his body 21 percent) and Yuna 9 percent under him in every FFX chapter whose scene does not name them", () => {
    for (const id of FFX_CHAPTERS) {
      const c = ALL.find((x) => x.id === id)!;
      const { partyHeight, figureHeights } = slotsOf(c);
      const h = (hero: string): number => figureHeight({ shared: partyHeight, own: figureHeights[hero], stature: partyStature(c.game, 'party', hero) }).height;
      if (!figureHeights['kimahri']) expect(h('kimahri') / h('tidus'), `${id} kimahri`).toBeCloseTo(1.304, 12);
      if (!figureHeights['yuna']) expect(h('yuna') / h('tidus'), `${id} yuna`).toBeCloseTo(0.911, 12);
    }
  });

  it('names no hero in any FFX scene but Chapter XIV\'s Yuna (the one scene whose party height is a hero\'s own)', () => {
    for (const id of FFX_CHAPTERS) {
      const named = Object.keys(slotsOf(ALL.find((x) => x.id === id)!).figureHeights).filter((k) => (CHARACTER_IDS as readonly string[]).includes(k));
      expect(named, id).toEqual(id === 'isaaru-via-purifico' ? ['yuna'] : []);
    }
    // ... and in Chapter XIV the scene's party height is Yuna's own, so naming her changes nothing there.
    const via = slotsOf(ALL.find((x) => x.id === 'isaaru-via-purifico')!);
    expect(via.figureHeights['yuna']).toBe(via.partyHeight);
  });

  it('leaves every FFX-2 chapter, the Leblanc experiment and the FF7 experiment at exactly the height their scene gave', () => {
    const others = ALL.filter((c) => !(FFX_CHAPTERS as readonly string[]).includes(c.id));
    expect(others.length).toBeGreaterThanOrEqual(9); // seven FFX-2, the hidden Leblanc, the hidden FF7
    for (const c of others) {
      const { partyHeight, figureHeights } = slotsOf(c);
      // Whoever the party fields, and also every FFX hero id (the same ids FFX-2 shares, and ones it does not): none is scaled.
      for (const id of [...membersOf(c), ...CHARACTER_IDS]) {
        expect(partyStature(c.game, 'party', id), `${c.id} ${id}`).toBe(1);
        const f = figureHeight({ shared: partyHeight, own: figureHeights[id], stature: partyStature(c.game, 'party', id) });
        expect(f.height, `${c.id} ${id}`).toBe(figureHeights[id] ?? partyHeight);
        expect(f.ringScale, `${c.id} ${id}`).toBe(figureHeights[id] === undefined ? 1 : figureHeights[id]! / partyHeight);
      }
    }
  });
});
