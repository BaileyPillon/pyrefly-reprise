/** Small, defensive readers for the loosely-typed `Record<string, unknown>` minigame params. */

export function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function str(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.length ? v : fallback;
}

export function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

export function arr<T>(v: unknown, fallback: T[]): T[] {
  return Array.isArray(v) ? (v as T[]) : fallback;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/**
 * The rejection a picker overlay backs out with.
 *
 * `MinigameResult` (`battle/common/types.ts`) has no "cancelled" member and is
 * not this track's to widen, so an abandoned pick is signalled the one way the
 * presenter already understands: the promise rejects, `askMinigame`
 * (`engine/BattlePresenterUtil.ts`) catches it and the command is re-submitted
 * bare. That is the same path a thrown overlay has always taken, so nothing
 * about the engine's handling is new here.
 *
 * It exists because an untimed picker with an **empty list** — Kimahri with no
 * Rage learned, Yuna with no aeon, Rikku with under two ingredients — had no
 * exit at all: the input watcher returned early on every button, the promise
 * never settled, and the overlay's title slab stayed on the field for the rest
 * of the fight, printed over the Sensor card and the `G GUIDE` chip. That is
 * the "stale Ronso Rage banner" in `docs/handoff/fix3-ffx-hud.md`.
 */
export class MinigameCancelled extends Error {
  constructor(kind: string) {
    super(`${kind}: the player backed out of the picker`);
    this.name = 'MinigameCancelled';
  }
}
