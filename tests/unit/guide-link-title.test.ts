import { describe, expect, it } from 'vitest';
import type { BattleSetup } from '../../src/battle/common/types.ts';
import { viaInfinitoBuild } from '../../src/data/ffx2/builds/via-infinito.ts';
import { CLOISTER_PARAGON_OVERSOUL } from '../../src/data/ffx2/enemies/trema-options.ts';
import { CLOISTER_TREMA } from '../../src/data/ffx2/enemies/trema.ts';
import { FFX2_TREMA_GUIDE, tremaGuideFor } from '../../src/data/guides/ffx2-trema.ts';
import { GUIDES } from '../../src/data/guides/index.ts';
import { TREMA_SHAPE_ALONE } from '../../src/data/trema-shape.ts';
import { buildGuideView } from '../../src/engine/tactics/guide.ts';
import { guideTitle } from '../../src/engine/tactics/lookup.ts';
import { group, newEngine } from './helpers/tremaDrive.ts';

/**
 * FOC16-06 (release 16 focused review, `critic/reviews/fc7f1a20-focused.md`): the
 * strategy guide's headline said "Trema" through the whole Paragon fight.
 * Game case: the mechanism (`ChapterGuide.linkTitles`, `guideTitle`) is shared
 * plumbing, both games; the only chapter that names its links is Chapter XIII,
 * FFX-2 only. Proven on the real FFX-2 engine, not on a hand-made record.
 */
function titleOn(groupId: string): string | undefined {
  const engine = newEngine();
  const setup: BattleSetup = {
    game: 'ffx2',
    party: viaInfinitoBuild,
    enemies: group(groupId),
    triggers: [],
    seed: 7,
    condition: 'normal',
    canEscape: false,
  };
  engine.setSeed(7);
  engine.init(setup);
  return buildGuideView(engine.state(), null)?.title;
}

describe('the guide headline names the link that stands (FOC16-06)', () => {
  it('Chapter XIII: "Paragon" over the Oversoul Paragon link, "Trema" over Trema', () => {
    expect(titleOn(CLOISTER_PARAGON_OVERSOUL)).toBe('Paragon');
    expect(titleOn(CLOISTER_TREMA)).toBe('Trema');
  });

  it('after the kill link, a fallen or removed Paragon left in the record does not keep the headline', () => {
    const guide = FFX2_TREMA_GUIDE;
    const foe = (id: string, hp: number, removed = false) => ({ id, side: 'enemy', hp, removed });
    expect(guideTitle({ combatants: { paragon: foe('paragon', 0), trema: foe('trema', 999_999) } } as never, guide)).toBe('Trema');
    expect(guideTitle({ combatants: { paragon: foe('paragon', 5, true), trema: foe('trema', 9) } } as never, guide)).toBe('Trema');
    expect(guideTitle({ combatants: { paragon: foe('paragon', 5) } } as never, guide)).toBe('Paragon');
  });

  it('a chapter with no link titles keeps its title, and Trema alone has none', () => {
    expect(tremaGuideFor(TREMA_SHAPE_ALONE).linkTitles).toBeUndefined();
    for (const g of GUIDES) {
      if (g.linkTitles) continue;
      const state = { combatants: Object.fromEntries(g.bossIds.map((id) => [id, { id, side: 'enemy', hp: 1, removed: false }])) };
      expect(guideTitle(state as never, g)).toBe(g.title);
    }
    // + Chapter XIV (FFX only): the panel names the aeon of the standing link.
    // Plus Chapter XI (FFX-2, unlisted): Shiva, the Magus Sisters, Anima.
    // Plus Chapter XV (FFX-2, unlisted): Baralai, Gippal, Nooj.
    expect(GUIDES.filter((g) => g.linkTitles).map((g) => g.id)).toEqual(['ffx2-trema', 'ffx2-fallen-aeons', 'ffx2-den-of-woe', 'isaaru-via-purifico']);
  });
});
