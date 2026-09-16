// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { mountFFX2PartyPrep } from '../../src/ui/ffx2/PartyPrep.ts';
import type { FFX2MemberBuild, FFX2PartyBuild } from '../../src/battle/common/types.ts';

function member(id: string, name: string, current: string, owned: string[]): FFX2MemberBuild {
  return {
    id,
    name,
    spriteKey: id,
    portraitKey: id,
    level: 20,
    currentDressphere: current,
    owned,
    garmentGrid: { id: 'g1', nodePosition: 0, passedGates: [], wornThisBattle: [current] },
    abilitiesLearned: {},
    accessories: [],
  };
}

function buildFixture(): FFX2PartyBuild {
  return {
    game: 'ffx2',
    members: [
      member('yuna', 'Yuna', 'gunner', ['gunner', 'white-mage']),
      member('rikku', 'Rikku', 'thief', ['thief', 'alchemist']),
      member('paine', 'Paine', 'warrior', ['warrior', 'dark-knight']),
    ],
    inventory: [{ itemId: 'potion', count: 5 }],
    gil: 12345,
  };
}

function click(el: Element | null): void {
  if (!el) throw new Error('element not found');
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('mountFFX2PartyPrep', () => {
  let root: HTMLElement;
  let build: FFX2PartyBuild;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    build = buildFixture();
  });

  it('shows the first member’s owned dresspheres by default', () => {
    mountFFX2PartyPrep(root, build, () => {});
    const labels = [...root.querySelectorAll('[data-dressphere]')].map((e) => e.getAttribute('data-dressphere'));
    expect(labels).toEqual(['gunner', 'white-mage']);
  });

  it('reassigns the current dressphere and reports the mutated build', () => {
    let reported: FFX2PartyBuild | null = null;
    mountFFX2PartyPrep(root, build, (b) => {
      reported = b;
    });
    click(root.querySelector('[data-dressphere="white-mage"]'));
    expect(build.members[0]!.currentDressphere).toBe('white-mage');
    expect(reported).toBe(build);
  });

  it('switches members via the member list', () => {
    mountFFX2PartyPrep(root, build, () => {});
    click(root.querySelector('[data-member="1"]')); // Rikku
    const labels = [...root.querySelectorAll('[data-dressphere]')].map((e) => e.getAttribute('data-dressphere'));
    expect(labels).toEqual(['thief', 'alchemist']);
  });

  it('cycles an accessory slot through the placeholder catalog', () => {
    let calls = 0;
    mountFFX2PartyPrep(root, build, () => {
      calls++;
    });
    click(root.querySelector('[data-tab="accessories"]'));
    click(root.querySelector('[data-accessory-slot="0"]'));
    expect(build.members[0]!.accessories).toEqual(['ribbon']);
    expect(calls).toBe(1);
  });

  it('lists inventory read-only under the Items tab', () => {
    mountFFX2PartyPrep(root, build, () => {});
    click(root.querySelector('[data-tab="items"]'));
    expect(root.textContent).toContain('potion');
    expect(root.textContent).toContain('x5');
  });

  it('unmount() removes the panel from the DOM', () => {
    const handle = mountFFX2PartyPrep(root, build, () => {});
    handle.unmount();
    expect(root.querySelector('.ffx2prep')).toBeNull();
  });
});
