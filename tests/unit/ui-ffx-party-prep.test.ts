// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mountFFXPartyPrep, type PartyPrepHandle } from '../../src/ui/ffx/party-prep/PartyPrep.ts';
import { makeFakePartyBuild } from '../../src/ui/ffx/testFixtures.ts';

let handle: PartyPrepHandle | null = null;
afterEach(() => {
  handle?.unmount();
  handle = null;
  document.body.innerHTML = '';
});

function mount(): { root: HTMLElement; build: ReturnType<typeof makeFakePartyBuild>; onDone: (b: unknown) => void; calls: unknown[] } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const build = makeFakePartyBuild();
  const calls: unknown[] = [];
  const onDone = (b: unknown): void => {
    calls.push(b);
  };
  handle = mountFFXPartyPrep(root, build, onDone);
  return { root, build, onDone, calls };
}

describe('mountFFXPartyPrep', () => {
  it('renders one roster row per member and one slot per active id', () => {
    const { root, build } = mount();
    const rosterRows = root.querySelectorAll('[data-member]');
    expect(rosterRows.length).toBe(build.members.length);

    const slots = root.querySelectorAll('.ffxprep-active__slot');
    expect(slots.length).toBe(3);
    expect(root.textContent).toContain('Tidus');
  });

  it('selecting a roster member shows their stats in the detail panel', () => {
    const { root } = mount();
    const auronRow = root.querySelector('[data-member="auron"]') as HTMLElement;
    auronRow.click();
    const body = root.querySelector('.ffxprep-detail__body')!;
    expect(body.textContent).toContain('Strength');
  });

  it('the Overdrive tab lists unlocked modes and picking one updates the build', () => {
    const { root, build } = mount();
    const tidusRow = root.querySelector('[data-member="tidus"]') as HTMLElement;
    tidusRow.click();

    const overdriveTab = [...root.querySelectorAll('.ffxprep-tab')].find((t) => t.textContent === 'OVERDRIVE') as HTMLElement;
    overdriveTab.click();

    const rows = root.querySelectorAll('[data-mode]');
    expect(rows.length).toBeGreaterThan(0);
    const comrade = [...rows].find((r) => r.getAttribute('data-mode') === 'comrade') as HTMLElement;
    expect(comrade).toBeDefined();
    comrade.click();

    const tidus = build.members.find((m) => m.id === 'tidus')!;
    expect(tidus.overdrive.mode).toBe('comrade');
  });

  it('the Sphere Grid tab swaps the detail panel for the canvas viewer', () => {
    const { root } = mount();
    const gridTab = [...root.querySelectorAll('.ffxprep-tab')].find((t) => t.textContent === 'SPHERE GRID') as HTMLElement;
    gridTab.click();

    const detail = root.querySelector('.ffxprep-detail') as HTMLElement;
    const grid = root.querySelector('.ffxprep-grid') as HTMLElement;
    expect(detail.hidden).toBe(true);
    expect(grid.hidden).toBe(false);
    expect(grid.querySelector('canvas')).not.toBeNull();
  });

  it('assigning a reserve member into an active slot updates activeSlots', () => {
    const { root, build } = mount();
    // Put a 4th member on the bench for this test, then assign them into slot 0.
    build.members.push({ ...build.members[0]!, id: 'wakka', name: 'Wakka' });
    handle?.unmount();
    const fresh = mountFFXPartyPrep(root, build, () => {});
    handle = fresh;

    const wakkaRow = root.querySelector('[data-member="wakka"]') as HTMLElement;
    wakkaRow.click();
    const slot0 = root.querySelector('[data-slot="0"]') as HTMLElement;
    slot0.click();

    expect(build.activeSlots[0]).toBe('wakka');
  });

  it('START BATTLE is enabled with three filled slots and calls onDone with the build', () => {
    const { root, build, calls } = mount();
    const startEl = root.querySelector('.ffxprep-start') as HTMLElement;
    expect(startEl.hasAttribute('disabled')).toBe(false);
    startEl.click();
    expect(calls).toEqual([build]);
  });
});
