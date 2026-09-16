// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { openSpherechangeWheel, type GarmentGridDef } from '../../src/ui/ffx2/SpherechangeWheel.ts';
import type { GarmentGridState } from '../../src/battle/common/types.ts';

function click(el: Element | null): void {
  if (!el) throw new Error('element not found');
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

// A 3-node triangle: gunner(0) -[red gate]- thief(1) -[no gate]- warrior(2) -[no gate]- gunner(0).
const GRID: GarmentGridDef = {
  id: 'triangle',
  name: 'Triangle Grid',
  nodes: [{ dressphereId: 'gunner' }, { dressphereId: 'thief' }, { dressphereId: 'warrior' }],
  links: [
    { from: 0, to: 1, gate: 'red', gateEffectLabel: 'Firestrike (this battle)' },
    { from: 1, to: 2 },
    { from: 2, to: 0 },
  ],
};

describe('Spherechange Garment Grid wheel', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  it('resolves a SpherechangeCommand with the gate crossed when a reachable node is picked', async () => {
    const state: GarmentGridState = { id: 'triangle', nodePosition: 0, passedGates: [], wornThisBattle: ['gunner'] };
    const promise = openSpherechangeWheel({ root, grid: GRID, state, actorName: 'Yuna', onCancel: () => {} });

    // From node 0 (gunner), node 1 (thief) is reachable via the red-gated link.
    click(root.querySelector('[data-node="1"]'));
    const command = await promise;
    expect(command).toEqual({
      kind: 'spherechange',
      targets: [],
      extra: { toDressphere: 'thief', toNode: 1, gatesCrossed: ['red'] },
    });
  });

  it('does not resolve when an unreachable node is clicked', async () => {
    // A 4-node square so node 2 is not adjacent to node 0.
    const square: GarmentGridDef = {
      id: 'square',
      name: 'Square Grid',
      nodes: [{ dressphereId: 'gunner' }, { dressphereId: 'thief' }, { dressphereId: 'warrior' }, { dressphereId: 'white-mage' }],
      links: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 0 },
      ],
    };
    const state: GarmentGridState = { id: 'square', nodePosition: 0, passedGates: [], wornThisBattle: [] };
    let resolved = false;
    void openSpherechangeWheel({ root, grid: square, state, actorName: 'Yuna', onCancel: () => {} }).then(() => {
      resolved = true;
    });

    click(root.querySelector('[data-node="2"]')); // opposite corner, not adjacent
    await Promise.resolve();
    expect(resolved).toBe(false);
  });

  it('calls onCancel on Escape without resolving', async () => {
    const state: GarmentGridState = { id: 'triangle', nodePosition: 0, passedGates: [], wornThisBattle: [] };
    let cancelled = false;
    let resolved = false;
    void openSpherechangeWheel({
      root,
      grid: GRID,
      state,
      actorName: 'Yuna',
      onCancel: () => {
        cancelled = true;
      },
    }).then(() => {
      resolved = true;
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
    await Promise.resolve();
    expect(cancelled).toBe(true);
    expect(resolved).toBe(false);
    expect(root.querySelector('.ffx2sc')).toBeNull();
  });

  it('offers Special Dress Up only once every node is filled and worn this battle', async () => {
    const eligible: GarmentGridState = { id: 'triangle', nodePosition: 0, passedGates: ['red'], wornThisBattle: ['gunner', 'thief', 'warrior'] };
    void openSpherechangeWheel({
      root,
      grid: GRID,
      state: eligible,
      actorName: 'Yuna',
      specialDressphereId: 'floral-fallal',
      onCancel: () => {},
    });
    expect(root.querySelector('[data-action="sdsp"]')).not.toBeNull();

    root.innerHTML = '';
    const notEligible: GarmentGridState = { id: 'triangle', nodePosition: 0, passedGates: [], wornThisBattle: ['gunner'] };
    void openSpherechangeWheel({
      root,
      grid: GRID,
      state: notEligible,
      actorName: 'Yuna',
      specialDressphereId: 'floral-fallal',
      onCancel: () => {},
    });
    expect(root.querySelector('[data-action="sdsp"]')).toBeNull();
  });

  it('resolves a Special Dress Up command when the pill is confirmed', async () => {
    const eligible: GarmentGridState = { id: 'triangle', nodePosition: 0, passedGates: ['red'], wornThisBattle: ['gunner', 'thief', 'warrior'] };
    const promise = openSpherechangeWheel({
      root,
      grid: GRID,
      state: eligible,
      actorName: 'Yuna',
      specialDressphereId: 'floral-fallal',
      onCancel: () => {},
    });
    click(root.querySelector('[data-action="sdsp"]'));
    const command = await promise;
    expect(command.extra.specialDressUp).toBe(true);
    expect(command.extra.toDressphere).toBe('floral-fallal');
  });
});
