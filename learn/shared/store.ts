/**
 * The explorer's one state object and its pure reducer.
 *
 * No framework, no DOM: `shell.ts` (a DOM module, not this one) owns the only
 * `createStore` instance a site needs and wires it to the nine pattern
 * elements. Keeping `reduce` pure and free of specimen data means every rule
 * here — clamping, the Esc order, "selecting un-hides" — is testable without
 * a browser, a specimen fixture, or a DOM.
 *
 * Actions that would otherwise need the whole specimen to do their job
 * (mainly: "what are all the system ids") take that information as part of
 * the action payload instead of reaching for it themselves, so `reduce` never
 * imports `model.ts` for anything but the `Piece`/`Specimen` shapes used by
 * the `visiblePieces` selector below.
 */

import type { Piece, Specimen } from './model.ts';

/** The four camera positions of the view rail (`docs/concepts/atlas/REFERENCE.md` item 8). */
export type ViewName = 'threeQuarter' | 'front' | 'side' | 'back';

/** Everything the explorer's interaction needs to remember. */
export interface ExplorerState {
  /** 0 = assembled, 1 = every piece in its inventory slot. Always kept in [0, 1]. */
  readonly explode: number;
  readonly selectedId: string | null;
  readonly isolatedId: string | null;
  readonly hiddenSystems: ReadonlySet<string>;
  readonly query: string;
  readonly view: ViewName;
  readonly labels: boolean;
}

/** The state a fresh explorer (or a "reset") starts from. */
export const initialExplorerState: ExplorerState = {
  explode: 0,
  selectedId: null,
  isolatedId: null,
  hiddenSystems: new Set<string>(),
  query: '',
  view: 'threeQuarter',
  labels: true,
};

export type ExplorerAction =
  | { readonly type: 'setExplode'; readonly explode: number }
  /** `systemId` is the piece's own system, so selecting it can un-hide that system without a specimen lookup. */
  | { readonly type: 'select'; readonly pieceId: string; readonly systemId: string }
  | { readonly type: 'clearSelection' }
  | { readonly type: 'isolate'; readonly pieceId: string }
  | { readonly type: 'showEverything' }
  | { readonly type: 'toggleSystem'; readonly systemId: string }
  /** Preset tabs (Human Atlas's "All / Skeleton / Organs"): show exactly `visibleSystemIds` of `allSystemIds`. */
  | { readonly type: 'showOnly'; readonly allSystemIds: readonly string[]; readonly visibleSystemIds: readonly string[] }
  | { readonly type: 'hideAll'; readonly allSystemIds: readonly string[] }
  | { readonly type: 'showAll' }
  | { readonly type: 'setQuery'; readonly query: string }
  | { readonly type: 'setView'; readonly view: ViewName }
  | { readonly type: 'toggleLabels' }
  | { readonly type: 'reset' }
  /** Esc: clears isolation first if any is set, otherwise clears the selection. */
  | { readonly type: 'escape' };

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function withSystem(set: ReadonlySet<string>, systemId: string): ReadonlySet<string> {
  const next = new Set(set);
  next.add(systemId);
  return next;
}

function withoutSystem(set: ReadonlySet<string>, systemId: string): ReadonlySet<string> {
  const next = new Set(set);
  next.delete(systemId);
  return next;
}

/** The whole state transition table. No side effects, no specimen lookups, no framework. */
export function reduce(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case 'setExplode':
      return { ...state, explode: clamp01(action.explode) };

    case 'select':
      return {
        ...state,
        selectedId: action.pieceId,
        hiddenSystems: withoutSystem(state.hiddenSystems, action.systemId),
      };

    case 'clearSelection':
      return { ...state, selectedId: null };

    // Isolating a piece also selects it: the card stays open, its button reads "Show everything".
    case 'isolate':
      return { ...state, isolatedId: action.pieceId, selectedId: action.pieceId };

    case 'showEverything':
      return { ...state, isolatedId: null };

    case 'toggleSystem':
      return {
        ...state,
        hiddenSystems: state.hiddenSystems.has(action.systemId)
          ? withoutSystem(state.hiddenSystems, action.systemId)
          : withSystem(state.hiddenSystems, action.systemId),
      };

    case 'showOnly': {
      const visible = new Set(action.visibleSystemIds);
      return {
        ...state,
        hiddenSystems: new Set(action.allSystemIds.filter((id) => !visible.has(id))),
      };
    }

    case 'hideAll':
      return { ...state, hiddenSystems: new Set(action.allSystemIds) };

    case 'showAll':
      return { ...state, hiddenSystems: new Set<string>() };

    case 'setQuery':
      return { ...state, query: action.query };

    case 'setView':
      return { ...state, view: action.view };

    case 'toggleLabels':
      return { ...state, labels: !state.labels };

    case 'reset':
      return initialExplorerState;

    case 'escape':
      if (state.isolatedId !== null) {
        return { ...state, isolatedId: null };
      }
      if (state.selectedId !== null) {
        return { ...state, selectedId: null };
      }
      return state;
  }
}

/** A minimal pub/sub store: dispatch runs the reducer and notifies subscribers once. */
export interface Store {
  getState(): ExplorerState;
  dispatch(action: ExplorerAction): void;
  /** Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

export function createStore(initial: ExplorerState): Store {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    getState(): ExplorerState {
      return state;
    },
    dispatch(action: ExplorerAction): void {
      state = reduce(state, action);
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * The pieces a stage should draw right now: only the isolated piece when one
 * is set (isolation always wins, regardless of hidden systems), otherwise
 * every piece whose system is not hidden.
 */
export function visiblePieces(specimen: Specimen, state: ExplorerState): readonly Piece[] {
  if (state.isolatedId !== null) {
    return specimen.pieces.filter((piece) => piece.id === state.isolatedId);
  }
  return specimen.pieces.filter((piece) => !state.hiddenSystems.has(piece.systemId));
}
