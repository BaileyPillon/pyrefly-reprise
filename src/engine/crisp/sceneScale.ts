/**
 * How many times wider than the drawing buffer the scene pass is drawn (1 = as always; `CrispRig` sets it while a supersampled rung is
 * on, `CrispConfig.ts`). Anything in the scene pass that is measured in screen pixels (a point sprite's size) multiplies by it, and the
 * backdrop's mip-biased depth of field adds `log2` of it, so supersampling sharpens the frame without changing the approved look.
 * A shared cell, because the readers are scattered (`BattleScreen`, the point emitters, `BackdropFocus`).
 */
let current = 1;
const listeners = new Set<() => void>();

export function sceneScale(): number {
  return current;
}

export function setSceneScale(v: number): void {
  const next = Number.isFinite(v) && v >= 1 ? v : 1;
  if (Math.abs(next - current) < 1e-6) return;
  current = next;
  for (const cb of listeners) cb();
}

/** Be told when the scene scale changes (the battle re-reads its point-sprite pixel scale). Returns the unsubscribe. */
export function onSceneScale(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** The texture levels a supersampled scene pass samples finer than the plain pass (0 at scale 1). */
export function sceneLod(): number {
  return Math.log2(current);
}

/** The uniform cell the backdrop's focus shader reads (`fx/a/BackdropFocus.ts`); `CrispRig` keeps it equal to {@link sceneLod}. */
export const ssLodCell = { value: 0 };
