// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { PrepPanel, PrepPanelContext } from '../../src/app/screens/PartyPrepScreen.ts';
import { makeEquipmentPanel, makeItemsPanel, makeOverdrivePanel, makeStatsPanel } from '../../src/ui/ffx/party-prep/panels.ts';
import { makeSphereGridPanel } from '../../src/ui/ffx/party-prep/SphereGridPanel.ts';
import { makeFakePartyBuild } from '../../src/ui/ffx/testFixtures.ts';

/**
 * These five factories are `PrepPanel`s that compose into `PartyPrepScreen`'s
 * own Ink & Gold frame (roster, tabs, active slots, START BATTLE all belong
 * to that shell now — see `src/ui/ffx/party-prep/index.ts`'s header comment).
 * A panel only ever sees its own body container plus `{chapter, memberId}`,
 * so a fake `PrepPanelContext` with just `buildRef` set is enough to drive
 * `mount`/`selectMember` without a real `Chapter`.
 */
function fakeContext(build: ReturnType<typeof makeFakePartyBuild>, memberId: string): PrepPanelContext {
  return { chapter: { buildRef: build } as PrepPanelContext['chapter'], memberId };
}

let mountedPanel: PrepPanel | null = null;
afterEach(() => {
  mountedPanel?.unmount?.();
  mountedPanel = null;
  document.body.innerHTML = '';
});

function mountPanel(panel: PrepPanel, build: ReturnType<typeof makeFakePartyBuild>, memberId: string): HTMLElement {
  mountedPanel = panel;
  const root = document.createElement('div');
  document.body.appendChild(root);
  panel.mount(root, fakeContext(build, memberId));
  return root;
}

describe('every FFX prep panel composes into the shell (fullScreen: false)', () => {
  it.each([
    ['stats', makeStatsPanel],
    ['sphere-grid', makeSphereGridPanel],
    ['equipment', makeEquipmentPanel],
    ['items', makeItemsPanel],
    ['overdrive', makeOverdrivePanel],
  ] as const)('%s draws only its body, never a roster/tabs/START BATTLE of its own', (id, factory) => {
    const panel = factory();
    expect(panel.id).toBe(id);
    expect(panel.game).toBe('ffx');
    expect(panel.fullScreen).toBe(false);
    const root = mountPanel(panel, makeFakePartyBuild(), 'tidus');
    for (const owned of ['prep__roster', 'prep__tabs', 'prep__start', 'prep__slots']) {
      expect(root.querySelector(`.${owned}`)).toBeNull();
    }
  });
});

describe('Stats panel', () => {
  it('shows the given member\'s stat block and follows selectMember', () => {
    const build = makeFakePartyBuild();
    const panel = makeStatsPanel();
    const root = mountPanel(panel, build, 'tidus');
    expect(root.textContent).toContain('STRENGTH');
    expect(root.textContent).toContain(String(build.members.find((m) => m.id === 'tidus')!.stats.str));

    panel.selectMember?.('auron');
    expect(root.textContent).toContain(String(build.members.find((m) => m.id === 'auron')!.stats.str));
  });

  it("shows the equipped HP/MP (stats.maxHp/maxMp), matching PartyPrepScreen's own field card, not the base pool", () => {
    // Mirrors a real build (gagazet.ts): Glorious Shield's HP+10% is already
    // baked into maxHp by the data/engine layer, base and effective differ.
    const build = makeFakePartyBuild();
    const tidus = build.members.find((m) => m.id === 'tidus')!;
    tidus.stats = { ...tidus.stats, hp: 2200, maxHp: 2420, mp: 92, maxMp: 101 };
    // ...and the gear that produced them, so `effectiveStats()` agrees with
    // the authored fields (2200*110//100 = 2420, 92*110//100 = 101).
    tidus.equipment = {
      ...tidus.equipment,
      armor: { name: 'Glorious Shield', slots: 3, autoAbilities: ['hp-10', 'mp-10'] },
    };

    const root = mountPanel(makeStatsPanel(), build, 'tidus');
    const valueFor = (label: string): string => {
      const key = [...root.querySelectorAll('.ffxprep-stat__k')].find((k) => k.textContent?.trim() === label)!;
      return key.closest('.ffxprep-stat')!.querySelector('.ffxprep-stat__v')!.textContent!.trim();
    };

    // PartyPrepScreen.ts's field card reads `m.stats.maxHp`/`maxMp` too
    // (see its slotsHtml()) -- asserting against that same field is what
    // keeps this tab from silently drifting back to the base pool.
    expect(valueFor('HP')).toBe('2420');
    expect(valueFor('MP')).toBe('101');
  });

  it('reflects equipment instead of disclaiming it — the "aren\'t reflected yet" note is gone', () => {
    const build = makeFakePartyBuild();
    const root = mountPanel(makeStatsPanel(), build, 'tidus');
    expect(root.textContent).not.toContain('reflected yet');
    expect(root.textContent).not.toContain('base values');
    // Replaced by the legend that explains the chips [ffx-combat-core §9].
    expect(root.querySelector('.ffxprep-stats__note')!.textContent).toContain('auto-abilities, not stat points');
  });

  it('shows each §9 percentage next to its stat, and says where it lands', () => {
    // The shared fixture equips `strength-3` (weapon) and `defense-3` (armor).
    const build = makeFakePartyBuild();
    const root = mountPanel(makeStatsPanel(), build, 'tidus');
    const rowFor = (label: string): HTMLElement => {
      const key = [...root.querySelectorAll('.ffxprep-stat__k')].find((k) => k.textContent?.trim() === label.toUpperCase())!;
      return key.closest('.ffxprep-stat') as HTMLElement;
    };
    const bonus = (label: string): string => rowFor(label).querySelector('.ffxprep-stat__bonus')?.textContent?.trim() ?? '';

    // Strength +3% is step 8 of the damage chain, NOT a stat point: the
    // numeral must stay the Sphere Grid value [ffx-combat-core §9].
    expect(rowFor('Strength').querySelector('.ffxprep-stat__v')!.textContent).toBe(
      String(build.members.find((m) => m.id === 'tidus')!.stats.str),
    );
    expect(bonus('Strength')).toBe('+3% dmg');
    expect(bonus('Defense')).toBe('−3% taken');
    // No auto-ability in §9's table touches these four, so no chip at all.
    expect(bonus('Agility')).toBe('');
    expect(bonus('Luck')).toBe('');
  });

  it('shows the pre-equipment pool alongside the raised one, and only when they differ', () => {
    const build = makeFakePartyBuild();
    const tidus = build.members.find((m) => m.id === 'tidus')!;
    // Mirrors gagazet.ts: Glorious Shield's HP+10% on a 2200 base pool.
    tidus.stats = { ...tidus.stats, hp: 2200, maxHp: 2420 };
    tidus.equipment = {
      ...tidus.equipment,
      armor: { name: 'Glorious Shield', slots: 3, autoAbilities: ['hp-10'] },
    };

    const root = mountPanel(makeStatsPanel(), build, 'tidus');
    const hpRow = [...root.querySelectorAll('.ffxprep-stat__k')]
      .find((k) => k.textContent?.trim() === 'HP')!
      .closest('.ffxprep-stat')!;
    expect(hpRow.querySelector('.ffxprep-stat__base')!.textContent).toBe('2200');
    expect(hpRow.querySelector('.ffxprep-stat__v')!.textContent).toBe('2420');
    expect(hpRow.querySelector('.ffxprep-stat__bonus')!.textContent).toBe('+10%');

    // MP is untouched by this armour, so it prints one number, not "92 -> 92".
    const mpRow = [...root.querySelectorAll('.ffxprep-stat__k')]
      .find((k) => k.textContent?.trim() === 'MP')!
      .closest('.ffxprep-stat')!;
    expect(mpRow.querySelector('.ffxprep-stat__base')).toBeNull();
    expect(mpRow.querySelector('.ffxprep-stat__bonus')).toBeNull();
  });
});

describe('Sphere Grid panel', () => {
  it('mounts a canvas and does not throw on selectMember (jsdom has no 2D context)', () => {
    const build = makeFakePartyBuild();
    const panel = makeSphereGridPanel();
    const root = mountPanel(panel, build, 'tidus');
    expect(root.querySelector('canvas')).not.toBeNull();
    expect(() => panel.selectMember?.('yuna')).not.toThrow();
  });
});

describe('Equipment panel', () => {
  it('shows weapon and armor names with their auto-ability chips', () => {
    const build = makeFakePartyBuild();
    const root = mountPanel(makeEquipmentPanel(), build, 'tidus');
    const tidus = build.members.find((m) => m.id === 'tidus')!;
    expect(root.textContent).toContain(tidus.equipment.weapon.name);
    expect(root.textContent).toContain(tidus.equipment.armor.name);
    expect(root.querySelectorAll('.ffxprep-chip').length).toBeGreaterThan(0);
  });

  it('shows an empty-slot chip when a gear piece has no auto-abilities', () => {
    const build = makeFakePartyBuild();
    const tidus = build.members.find((m) => m.id === 'tidus')!;
    tidus.equipment.weapon.autoAbilities = [];
    const root = mountPanel(makeEquipmentPanel(), build, 'tidus');
    expect(root.querySelector('.ffxprep-chip--empty')).not.toBeNull();
  });
});

describe('Items panel', () => {
  it('lists inventory counts and ignores selectMember (party-wide, not per-member)', () => {
    const build = makeFakePartyBuild();
    const panel = makeItemsPanel();
    const root = mountPanel(panel, build, 'tidus');
    expect(root.textContent).toContain('potion');
    expect(root.textContent).toContain(`×${build.inventory.find((i) => i.itemId === 'potion')!.count}`);
    expect(panel.selectMember).toBeUndefined();
  });

  it('shows a placeholder when the inventory is empty', () => {
    const build = makeFakePartyBuild();
    build.inventory = [];
    const root = mountPanel(makeItemsPanel(), build, 'tidus');
    expect(root.textContent).toContain('No items');
  });
});

describe('Overdrive panel', () => {
  it("shows the character's Overdrive move name and marks the equipped mode", () => {
    const build = makeFakePartyBuild();
    const root = mountPanel(makeOverdrivePanel(), build, 'tidus');
    expect(root.textContent).toContain('Swordplay'); // static per-character name, not derived from ability ids
    const tidus = build.members.find((m) => m.id === 'tidus')!;
    const equippedRow = [...root.querySelectorAll('[data-mode]')].find((r) => r.getAttribute('data-mode') === tidus.overdrive.mode)!;
    expect(equippedRow.classList.contains('ffxprep-mode-row--selected')).toBe(true);
  });

  it('picking an unlocked mode updates the build and re-renders as equipped', () => {
    const build = makeFakePartyBuild();
    const tidus = build.members.find((m) => m.id === 'tidus')!;
    const root = mountPanel(makeOverdrivePanel(), build, 'tidus');

    const comrade = root.querySelector('[data-mode="comrade"]') as HTMLElement;
    expect(comrade).not.toBeNull();
    comrade.click();

    expect(tidus.overdrive.mode).toBe('comrade');
    expect(root.querySelector('[data-mode="comrade"]')!.classList.contains('ffxprep-mode-row--selected')).toBe(true);
  });

  it('follows selectMember to a different character', () => {
    const build = makeFakePartyBuild();
    const root = mountPanel(makeOverdrivePanel(), build, 'tidus');
    mountedPanel!.selectMember?.('yuna');
    expect(root.textContent).toContain('Grand Summon');
  });
});
