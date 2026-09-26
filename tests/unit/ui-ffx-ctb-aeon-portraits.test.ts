// @vitest-environment jsdom
/**
 * PR-0176 and FOC18-02 (FFX only): every turn-order tile shows a painted face.
 *
 * Round 13 saw Bahamut's tiles in Chapter X and Valefor's in Chapter XIV as
 * letter chips ("B", "V"): an aeon's combatant carries no `portraitKey`, so its
 * party-side row asked for no portrait at all although
 * `portraits/bahamut.png` and `valefor.png` ship. And Mortibody's chip showed
 * its "M" monogram through its own translucent painting. The fixes: an aeon row
 * falls back to its own portrait (following `resolvePortraitKey`, so the
 * unapproved navy Yojimbo painting stays out, D-054) and its idle painting,
 * and a chip hides its monogram once a painting has loaded.
 */
import { describe, expect, it } from 'vitest';
import type { AnyCombatant, CombatantId, TurnPreview } from '../../src/battle/common/types.ts';
import { CtbList } from '../../src/ui/ffx/CtbList.ts';
import { portraitChipHtml, tintFor, wirePortraitFallbacks } from '../../src/ui/ffx/portraits.ts';

function row(actorId: string, isParty: boolean, extra: Partial<TurnPreview> = {}): TurnPreview {
  return { actorId, tickValue: 0, index: 0, isParty, statusIcons: [], overdriveReady: false, ...extra } as TurnPreview;
}

function combatant(id: string, side: 'party' | 'aeon' | 'enemy', spriteKey = id, name = id): AnyCombatant {
  return { id, name, side, spriteKey } as unknown as AnyCombatant;
}

function srcsFor(list: CtbList, actor: string): string[] {
  const tile = list.el.querySelector(`[data-actor="${actor}"]`);
  return [...(tile?.querySelectorAll('img') ?? [])].map((img) => img.getAttribute('src') ?? '');
}

describe('aeon turn-order tiles use the aeon painting (PR-0176)', () => {
  it('Bahamut and Valefor rows ask for portraits/<aeon>.png and the idle crop', () => {
    const list = new CtbList();
    const combatants = {
      bahamut: combatant('bahamut', 'aeon', 'bahamut', 'Bahamut'),
      valefor: combatant('valefor', 'aeon', 'valefor', 'Valefor'),
    } as Record<CombatantId, AnyCombatant>;
    list.render([row('bahamut', true), row('valefor', true)], combatants);
    expect(srcsFor(list, 'bahamut').some((s) => s.endsWith('art/portraits/bahamut.png'))).toBe(true);
    expect(srcsFor(list, 'bahamut').some((s) => s.endsWith('art/characters/bahamut/idle.png'))).toBe(true);
    expect(srcsFor(list, 'valefor').some((s) => s.endsWith('art/portraits/valefor.png'))).toBe(true);
  });

  it("never gives Yuna's Yojimbo the unapproved navy portrait (D-054)", () => {
    const list = new CtbList();
    list.render([row('yojimbo', true)], { yojimbo: combatant('yojimbo', 'aeon', 'yojimbo', 'Yojimbo') } as Record<CombatantId, AnyCombatant>);
    expect(srcsFor(list, 'yojimbo').some((s) => s.endsWith('art/portraits/yojimbo.png'))).toBe(false);
    expect(srcsFor(list, 'yojimbo').some((s) => s.endsWith('art/characters/yojimbo/idle.png'))).toBe(false);
  });

  it('a party member with its own portraitKey is unchanged', () => {
    const list = new CtbList();
    list.render([row('tidus', true, { portraitKey: 'tidus' } as Partial<TurnPreview>)], {
      tidus: combatant('tidus', 'party', 'tidus', 'Tidus'),
    } as Record<CombatantId, AnyCombatant>);
    const srcs = srcsFor(list, 'tidus');
    expect(srcs).toHaveLength(1);
    expect(srcs[0]!.endsWith('art/portraits/tidus.png')).toBe(true);
  });
});

describe('a loaded painting hides the monogram (FOC18-02, Mortibody)', () => {
  it('hides the letter once any painting layer has loaded', () => {
    const host = document.createElement('div');
    host.innerHTML = portraitChipHtml(undefined, 'Mortibody', tintFor('enemy'), 'mortibody');
    wirePortraitFallbacks(host);
    const letter = host.querySelector<HTMLElement>('.ffx-portrait-fallback')!;
    expect(letter.style.visibility).not.toBe('hidden');
    host.querySelector('img')!.dispatchEvent(new Event('load'));
    expect(letter.style.visibility).toBe('hidden');
  });

  it('keeps the letter when every painting fails', () => {
    const host = document.createElement('div');
    host.innerHTML = portraitChipHtml('nobody', 'Nobody', tintFor('enemy'), 'nobody');
    wirePortraitFallbacks(host);
    for (const img of [...host.querySelectorAll('img')]) img.dispatchEvent(new Event('error'));
    const letter = host.querySelector<HTMLElement>('.ffx-portrait-fallback')!;
    expect(host.querySelectorAll('img')).toHaveLength(0);
    expect(letter.style.visibility).not.toBe('hidden');
  });
});
