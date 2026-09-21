/**
 * Shapes for the shared explorer engine's specimens: the boss/turn/frame that
 * one of the three learning sites takes apart, and the pieces it is made of.
 *
 * A `Piece` without a source is worse than no piece at all (AGENTS.md hard
 * rule 6: never invent game data), so a `PieceCard`'s `cite` is required, not
 * optional, and `definePiece` / `defineSpecimen` refuse to build one without
 * it. `System.count` is likewise never hand-typed: a typed count drifts from
 * the pieces the moment someone edits one without the other, so it is always
 * computed from the pieces themselves (`withCounts`), and `defineSpecimen`
 * throws if a caller supplies one that disagrees.
 */

/** A point in the stage's 3D space (CSS transform units, not pixels). */
export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Which game a specimen belongs to. Every specimen is one or the other, never both (AGENTS.md hard rule 14). */
export type GameId = 'ffx' | 'ffx2';

/** The one accent per context: Yevon gold for FFX, pyre pink for FFX-2 (`docs/handoff/presentation-ink-and-gold.md`). */
export type Accent = 'gold' | 'pink';

/** Derives the specimen's accent from its game. There is no other way to pick one — never set an accent by hand. */
export function accentForGame(game: GameId): Accent {
  return game === 'ffx' ? 'gold' : 'pink';
}

/**
 * One cited section of a tab's body, e.g. one guide note with its own `cite`
 * (`learn/atlas/guide-notes.ts`). A `heading` names the section only where the
 * source itself has a natural one (a watch entry's own name, a phase note's
 * own label) — never invented (AGENTS.md hard rule 6).
 */
export interface TabSection {
  readonly heading?: string;
  readonly text: string;
  readonly cite: string;
}

/**
 * One tab of a piece's detail card, e.g. Model X Studio's "Overview" / "How
 * it works". A tab either writes its content straight into `body`, or breaks
 * it into per-sentence `sections` that each carry their own `cite` — a tab
 * built from several guide sentences uses `sections` so every sentence keeps
 * its own citation, rather than one tab-wide citation covering several
 * claims. A tab may use either, or both (`body` may be `''` when `sections`
 * carries the whole content).
 */
export interface PieceCardTab {
  readonly id: string;
  readonly label: string;
  readonly body: string;
  readonly sections?: readonly TabSection[];
}

/**
 * The right-hand detail card shown when a piece is selected
 * (`docs/concepts/atlas/REFERENCE.md` item 5).
 *
 * `cite` is the one field every card must carry: a claim about the game with
 * no source is a bug, not a placeholder to fill in later.
 */
/** One cell of a card's fact row, e.g. `{ label: 'Research reference', value: 'ffx2-vegnagun-shuyin §3.3' }`. */
export interface PieceFact {
  readonly label: string;
  readonly value: string;
}

export interface PieceCard {
  readonly eyebrow: string;
  readonly body: string;
  readonly claimKind: string;
  readonly facts: readonly PieceFact[];
  readonly cite: string;
  readonly tabs: readonly PieceCardTab[];
  /** e.g. "Illustrative" where the geometry or claim is not verified. Omit when nothing needs flagging. */
  readonly honesty?: string;
}

/** How a piece is rendered on stage: a painted cutout, a flat card, or a small tile (inventory-only pieces). */
export type PieceKind = 'painting' | 'card' | 'tile';

/**
 * A piece's **authored** placement on stage, ported from an approved frame
 * (`docs/concepts/atlas/a-boss-atlas/*.html`) rather than derived from
 * `size`. Set it whenever a frame says how big a painted cutout is and which
 * way it faces; leave it off and the stage falls back to the generic
 * `size`-derived cell.
 *
 * Stage units are the design canvas's own pixels (1600 x 900, the size every
 * approved frame was authored at), so a value can be copied straight out of a
 * frame's inline style. Positions are relative to the stage origin.
 *
 * **Anchoring.** A piece that carries a `stage` is anchored by its **top-left
 * corner**: `home`/`burst` are that corner. The frames record `left`, `top`
 * and `width` and no heights, so a top-left anchor reproduces them exactly
 * while a centre anchor would need each painting's aspect ratio guessed. A
 * piece with no `stage` keeps the shared default and is centred on its point.
 */
export interface PieceStage {
  /** On-stage width at `home`, in stage units. Height follows the art's own aspect unless {@link height} says otherwise. */
  readonly width: number;
  /** Explicit on-stage height, for a piece whose box is not set by an image (a laid-out card). */
  readonly height?: number;
  /** On-stage width once pulled apart, when the approved frame draws the piece at a different size there. Defaults to {@link width}. */
  readonly burstWidth?: number;
  /** Mirror the art horizontally, as the frame's `.part.flip` does. */
  readonly flipX?: boolean;
  /** Paint order, low to high — the frame's `z-index`. Also the stage's depth cue (nearer = longer paper shadow, farthest = faded). */
  readonly layer?: number;
}

/** One part of a specimen: a boss's head, one turn's action, one frame's layer. */
export interface Piece {
  readonly id: string;
  readonly systemId: string;
  readonly name: string;
  readonly kind: PieceKind;
  /** Path under `public/art/`, when this piece has painted art. */
  readonly art?: string;
  /** Relative linear size, used only to order pieces largest-first and to scale inventory cells (`pack.ts`). */
  readonly size: number;
  /** Resting position at `explode` 0. */
  readonly home: Vec3;
  /** Pulled-apart position around `explode` 0.6 (`layout.ts`). */
  readonly burst: Vec3;
  /** Authored on-stage box, when an approved frame gives one. See {@link PieceStage} — it also changes the anchor to the top-left corner. */
  readonly stage?: PieceStage;
  /**
   * The piece this one hangs off: the part that owns this ability, the form
   * that shrugs off this status. The stage threads a child to its parent,
   * fans the children out around it, and counts the ones it had no room for
   * ("+ N more at 100%"). Must name a piece of the same specimen.
   */
  readonly parentId?: string;
  /** A short pin label drawn on the piece at `explode` 0 — site A's battle order, "1".."5". */
  readonly badge?: string;
  readonly card: PieceCard;
}

/** A group of pieces shown together in the systems panel (`docs/concepts/atlas/REFERENCE.md` item 3). */
export interface System {
  readonly id: string;
  readonly name: string;
  readonly colour: string;
  /** Number of pieces in this system. Always computed by `withCounts`, never typed by hand. */
  readonly count: number;
}

/** A `System` as a data author writes it — `count` is derived, so there is nothing to get wrong here. */
export type SystemInput = Omit<System, 'count'>;

/**
 * One row of a specimen's idle card — site A's chain of battles, in order:
 * `label` "Tail", `sub` "Level 41", `value` "34,200 HP". Every field is a
 * string the data layer formatted from real data; the card never computes.
 */
export interface SpecimenIdleRow {
  readonly label: string;
  readonly value: string;
  /** A quieter second line under `label`. Omit when the source has nothing to put there. */
  readonly sub?: string;
}

/**
 * What the detail card shows with **nothing selected** — the approved frame's
 * "THE CHAIN · NOTHING SELECTED" (`a1-assembled.html`): the specimen's
 * structure in one read, rather than a generic summary. Rows are numbered by
 * their order here, matching each piece's own `badge`.
 */
export interface SpecimenIdle {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly rows: readonly SpecimenIdleRow[];
  readonly note?: string;
  readonly cite: string;
}

/** The specimen a site puts on the stage: a boss chapter, a battle turn, a game frame. */
export interface Specimen {
  readonly id: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly factsLine: string;
  readonly game: GameId;
  readonly systems: readonly System[];
  readonly pieces: readonly Piece[];
  /** The nothing-selected card. A specimen without one falls back to the plain summary (`card.ts`). */
  readonly idle?: SpecimenIdle;
}

/** What `defineSpecimen` accepts: systems already carry their (author-supplied) counts, checked against the pieces. */
export interface SpecimenInput {
  readonly id: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly factsLine: string;
  readonly game: GameId;
  readonly systems: readonly System[];
  readonly pieces: readonly Piece[];
  readonly idle?: SpecimenIdle;
}

/** Fills in `System.count` from the pieces, so a data module never has to type or maintain one by hand. */
export function withCounts(systems: readonly SystemInput[], pieces: readonly Piece[]): System[] {
  return systems.map((system) => ({
    ...system,
    count: pieces.filter((piece) => piece.systemId === system.id).length,
  }));
}

function assertCite(pieceId: string, card: PieceCard): void {
  if (card.cite.trim().length === 0) {
    throw new Error(`piece "${pieceId}" has a PieceCard with an empty cite`);
  }
}

/**
 * Validates and returns one piece. The only rule a single piece can be
 * checked against in isolation is that its card cites a source; everything
 * else (does its system exist, is its id unique) needs the whole specimen,
 * so those checks live in {@link defineSpecimen}.
 */
export function definePiece(piece: Piece): Piece {
  assertCite(piece.id, piece.card);
  return piece;
}

/**
 * Validates and returns a specimen. Throws on the mistakes that would
 * otherwise surface much later as a blank card or a silently-wrong count:
 * an empty `cite`, a piece naming a system that was never declared, a piece
 * whose `parentId` names no piece of this specimen (the stage would thread it
 * to nothing and silently drop it from every "+ N more" count), a repeated
 * piece or system id, or a `System.count` that disagrees with the pieces that
 * actually name it (use {@link withCounts} so this never happens).
 */
export function defineSpecimen(input: SpecimenInput): Specimen {
  const systemIds = new Set<string>();
  for (const system of input.systems) {
    if (systemIds.has(system.id)) {
      throw new Error(`defineSpecimen("${input.id}"): duplicate system id "${system.id}"`);
    }
    systemIds.add(system.id);
  }

  const pieceIds = new Set<string>();
  for (const piece of input.pieces) {
    if (pieceIds.has(piece.id)) {
      throw new Error(`defineSpecimen("${input.id}"): duplicate piece id "${piece.id}"`);
    }
    pieceIds.add(piece.id);

    if (!systemIds.has(piece.systemId)) {
      throw new Error(
        `defineSpecimen("${input.id}"): piece "${piece.id}" names unknown system "${piece.systemId}"`,
      );
    }

    assertCite(piece.id, piece.card);
  }

  for (const piece of input.pieces) {
    if (piece.parentId !== undefined && !pieceIds.has(piece.parentId)) {
      throw new Error(
        `defineSpecimen("${input.id}"): piece "${piece.id}" names unknown parent "${piece.parentId}"`,
      );
    }
    if (piece.parentId === piece.id) {
      throw new Error(`defineSpecimen("${input.id}"): piece "${piece.id}" is its own parent`);
    }
  }

  for (const system of input.systems) {
    const actual = input.pieces.filter((piece) => piece.systemId === system.id).length;
    if (system.count !== actual) {
      throw new Error(
        `defineSpecimen("${input.id}"): system "${system.id}" declares count ${system.count} but has ${actual} piece(s)`,
      );
    }
  }

  return {
    id: input.id,
    title: input.title,
    eyebrow: input.eyebrow,
    factsLine: input.factsLine,
    game: input.game,
    systems: input.systems,
    pieces: input.pieces,
    ...(input.idle !== undefined ? { idle: input.idle } : {}),
  };
}
