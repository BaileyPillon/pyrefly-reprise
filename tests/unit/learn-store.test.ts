import { describe, expect, it } from 'vitest';
import { defineSpecimen } from '../../learn/shared/model.ts';
import type { Piece, PieceCard, Specimen } from '../../learn/shared/model.ts';
import { createStore, initialExplorerState, reduce, visiblePieces } from '../../learn/shared/store.ts';
import type { ExplorerState } from '../../learn/shared/store.ts';

function card(): PieceCard {
  return {
    eyebrow: 'Structure',
    body: 'A placeholder part for testing.',
    claimKind: 'System overview',
    facts: [],
    cite: 'fixture-source §1',
    tabs: [],
  };
}

function piece(id: string, systemId: string): Piece {
  return {
    id,
    systemId,
    name: `Piece ${id}`,
    kind: 'painting',
    size: 10,
    home: { x: 0, y: 0, z: 0 },
    burst: { x: 5, y: 5, z: 5 },
    card: card(),
  };
}

function fixtureSpecimen(): Specimen {
  return defineSpecimen({
    id: 'fixture',
    title: 'Fixture Specimen',
    eyebrow: 'TEST',
    factsLine: '3 pieces · fixture',
    game: 'ffx',
    systems: [
      { id: 'system-a', name: 'System A', colour: '#111', count: 2 },
      { id: 'system-b', name: 'System B', colour: '#222', count: 1 },
    ],
    pieces: [piece('p1', 'system-a'), piece('p2', 'system-a'), piece('p3', 'system-b')],
  });
}

describe('reduce: setExplode', () => {
  it('clamps above 1 down to 1', () => {
    const next = reduce(initialExplorerState, { type: 'setExplode', explode: 1.4 });
    expect(next.explode).toBe(1);
  });

  it('clamps below 0 up to 0', () => {
    const next = reduce(initialExplorerState, { type: 'setExplode', explode: -0.2 });
    expect(next.explode).toBe(0);
  });

  it('passes an in-range value through unchanged', () => {
    const next = reduce(initialExplorerState, { type: 'setExplode', explode: 0.42 });
    expect(next.explode).toBe(0.42);
  });
});

describe('reduce: escape', () => {
  it('clears isolation first when both isolation and selection are set', () => {
    const isolated = reduce(initialExplorerState, { type: 'isolate', pieceId: 'p1' });
    expect(isolated.isolatedId).toBe('p1');
    expect(isolated.selectedId).toBe('p1');

    const afterFirstEscape = reduce(isolated, { type: 'escape' });
    expect(afterFirstEscape.isolatedId).toBeNull();
    expect(afterFirstEscape.selectedId).toBe('p1');
  });

  it('clears the selection on the next escape once isolation is gone', () => {
    const selectedOnly: ExplorerState = { ...initialExplorerState, selectedId: 'p1' };
    const next = reduce(selectedOnly, { type: 'escape' });
    expect(next.selectedId).toBeNull();
    expect(next.isolatedId).toBeNull();
  });

  it('is a no-op that returns the same state when nothing is selected or isolated', () => {
    const next = reduce(initialExplorerState, { type: 'escape' });
    expect(next).toBe(initialExplorerState);
  });
});

describe('reduce: select un-hides the piece\'s system', () => {
  it('removes the piece\'s system from hiddenSystems', () => {
    const hidden: ExplorerState = { ...initialExplorerState, hiddenSystems: new Set(['system-a', 'system-b']) };
    const next = reduce(hidden, { type: 'select', pieceId: 'p1', systemId: 'system-a' });
    expect(next.hiddenSystems.has('system-a')).toBe(false);
    expect(next.hiddenSystems.has('system-b')).toBe(true);
    expect(next.selectedId).toBe('p1');
  });

  it('leaves hiddenSystems untouched when the system was already visible', () => {
    const next = reduce(initialExplorerState, { type: 'select', pieceId: 'p1', systemId: 'system-a' });
    expect(next.hiddenSystems.size).toBe(0);
  });
});

describe('reduce: selection and isolation', () => {
  it('clearSelection only clears the selection', () => {
    const isolated = reduce(initialExplorerState, { type: 'isolate', pieceId: 'p1' });
    const next = reduce(isolated, { type: 'clearSelection' });
    expect(next.selectedId).toBeNull();
    expect(next.isolatedId).toBe('p1');
  });

  it('showEverything only clears isolation, keeping the selection', () => {
    const isolated = reduce(initialExplorerState, { type: 'isolate', pieceId: 'p1' });
    const next = reduce(isolated, { type: 'showEverything' });
    expect(next.isolatedId).toBeNull();
    expect(next.selectedId).toBe('p1');
  });
});

describe('reduce: system visibility actions', () => {
  it('toggleSystem hides then shows the same system', () => {
    const hidden = reduce(initialExplorerState, { type: 'toggleSystem', systemId: 'system-a' });
    expect(hidden.hiddenSystems.has('system-a')).toBe(true);

    const shown = reduce(hidden, { type: 'toggleSystem', systemId: 'system-a' });
    expect(shown.hiddenSystems.has('system-a')).toBe(false);
  });

  it('showOnly hides every system not in the preset', () => {
    const next = reduce(initialExplorerState, {
      type: 'showOnly',
      allSystemIds: ['system-a', 'system-b', 'system-c'],
      visibleSystemIds: ['system-b'],
    });
    expect([...next.hiddenSystems].sort()).toEqual(['system-a', 'system-c']);
  });

  it('hideAll hides every given system', () => {
    const next = reduce(initialExplorerState, { type: 'hideAll', allSystemIds: ['system-a', 'system-b'] });
    expect([...next.hiddenSystems].sort()).toEqual(['system-a', 'system-b']);
  });

  it('showAll clears every hidden system', () => {
    const hidden: ExplorerState = { ...initialExplorerState, hiddenSystems: new Set(['system-a']) };
    const next = reduce(hidden, { type: 'showAll' });
    expect(next.hiddenSystems.size).toBe(0);
  });
});

describe('reduce: misc actions', () => {
  it('setQuery replaces the query', () => {
    expect(reduce(initialExplorerState, { type: 'setQuery', query: 'oblique' }).query).toBe('oblique');
  });

  it('setView replaces the view', () => {
    expect(reduce(initialExplorerState, { type: 'setView', view: 'back' }).view).toBe('back');
  });

  it('toggleLabels flips the flag both ways', () => {
    const off = reduce(initialExplorerState, { type: 'toggleLabels' });
    expect(off.labels).toBe(!initialExplorerState.labels);
    const on = reduce(off, { type: 'toggleLabels' });
    expect(on.labels).toBe(initialExplorerState.labels);
  });

  it('reset returns to the initial state from a fully dirty one', () => {
    const dirty: ExplorerState = {
      explode: 0.9,
      selectedId: 'p1',
      isolatedId: 'p1',
      hiddenSystems: new Set(['system-a']),
      query: 'oblique',
      view: 'back',
      labels: false,
    };
    expect(reduce(dirty, { type: 'reset' })).toEqual(initialExplorerState);
  });
});

describe('createStore', () => {
  it('starts at the given initial state', () => {
    const store = createStore(initialExplorerState);
    expect(store.getState()).toEqual(initialExplorerState);
  });

  it('applies the reducer on dispatch and notifies subscribers', () => {
    const store = createStore(initialExplorerState);
    let notifications = 0;
    store.subscribe(() => {
      notifications += 1;
    });

    store.dispatch({ type: 'setExplode', explode: 0.5 });

    expect(store.getState().explode).toBe(0.5);
    expect(notifications).toBe(1);
  });

  it('stops notifying after unsubscribe', () => {
    const store = createStore(initialExplorerState);
    let notifications = 0;
    const unsubscribe = store.subscribe(() => {
      notifications += 1;
    });
    unsubscribe();

    store.dispatch({ type: 'toggleLabels' });

    expect(notifications).toBe(0);
  });
});

describe('visiblePieces', () => {
  it('drops pieces whose system is hidden', () => {
    const specimen = fixtureSpecimen();
    const state: ExplorerState = { ...initialExplorerState, hiddenSystems: new Set(['system-b']) };
    expect(visiblePieces(specimen, state).map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('returns only the isolated piece, ignoring hiddenSystems entirely', () => {
    const specimen = fixtureSpecimen();
    const state: ExplorerState = {
      ...initialExplorerState,
      isolatedId: 'p3',
      hiddenSystems: new Set(['system-a']),
    };
    expect(visiblePieces(specimen, state).map((p) => p.id)).toEqual(['p3']);
  });

  it('returns every piece when nothing is hidden or isolated', () => {
    const specimen = fixtureSpecimen();
    expect(visiblePieces(specimen, initialExplorerState).map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
  });
});
