/**
 * Which parts a pose shows, and with which image (format v2, 2026-10-18; both games; pure TypeScript: no `three`, no DOM).
 *
 * A key's state is a **pure function of the key and the file**: no inheritance from the key before it. A part the key does not name is in its DEFAULT state (shown with its own image, or hidden
 * if the part is `hidden`); a part it names is shown (unless `show: false`) with the variant `image` names (absent = its own image). `idle` names none: it is the rest, and the costume painting
 * is the rest state drawn.
 *
 * The state flips **halfway through the move into the key** ({@link partStateAt}), exactly where `RigKey.layers` does: below progress 0.5 the figure still shows the state of the key it left, from
 * 0.5 the state of the key it moves to. The rig gate does the same (`tools/rig/rig-pose.mjs#stateAt`); `tests/unit/rig/rig-v2-agree.test.ts` feeds both the same vectors so they cannot disagree.
 *
 * A state is one `Int16Array`, a number a part in `RigData.parts` order: {@link HIDDEN}, {@link OWN} (the part's own image), or the index of a variant in the part's `variants`.
 */
import type { RigKey } from '../../data/art/rigTypes.ts';
import type { RigData } from './RigData.ts';

/** The part is not drawn (and not skinned). */
export const HIDDEN = -2;
/** The part is drawn with its own image. */
export const OWN = -1;

/** The move into a key flips the state at this progress. */
export const STATE_FLIP = 0.5;

type PartsOf = Pick<RigData, 'parts'>;

/** The rest state: every part shown with its own image except the ones that are `hidden`. */
export function restState(data: PartsOf): Int16Array {
  const out = new Int16Array(data.parts.length);
  data.parts.forEach((p, i) => {
    out[i] = p.hidden ? HIDDEN : OWN;
  });
  return out;
}

/** The state a key describes. Assumes the key was read by `readRig` (every named part and variant exists). */
export function keyState(data: PartsOf, key: Pick<RigKey, 'parts'> | undefined): Int16Array {
  const out = restState(data);
  const named = key?.parts;
  if (!named) return out;
  data.parts.forEach((p, i) => {
    const e = named[p.name];
    if (!e) return;
    if (e.show === false) out[i] = HIDDEN;
    else out[i] = e.image === undefined ? OWN : p.variants.findIndex((v) => v.name === e.image);
  });
  return out;
}

/** Every key's state, compiled once. */
export function compileStates(data: RigData): Map<string, Int16Array> {
  const out = new Map<string, Int16Array>();
  for (const [name, key] of data.keys) out.set(name, keyState(data, key));
  return out;
}

/** The state `progress` of the way through the move from the key whose state is `from` into the key whose state is `to`: `from` below 0.5, `to` from 0.5. Returns one of the two arrays, not a copy. */
export function partStateAt(from: Int16Array, to: Int16Array, progress: number): Int16Array {
  return progress >= STATE_FLIP ? to : from;
}

export function sameState(a: Int16Array, b: Int16Array): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** A state as the gate states it (`{ <part>: { shown, image } }`, `image` null for the part's own): the form the shared test compares. */
export function describeState(data: PartsOf, s: Int16Array): Record<string, { shown: boolean; image: string | null }> {
  const out: Record<string, { shown: boolean; image: string | null }> = {};
  data.parts.forEach((p, i) => {
    const v = s[i]!;
    out[p.name] = { shown: v !== HIDDEN, image: v >= 0 ? (p.variants[v]?.name ?? null) : null };
  });
  return out;
}
