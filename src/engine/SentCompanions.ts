/**
 * **A part that leaves with the fiend it belongs to** (VP-1001-28, FFX only).
 *
 * Seymour Flux and Mortiorchis are one fused silhouette: "a robed, multi-limbed
 * upper body rising out of a mechanical body ... one creature"
 * (`research/ffx-seymour-flux.md` §5, line ~1104). The mount has no death state
 * of its own while he fights (§2.2, its `'returns'` departure), and when he is
 * beaten "he dissolves into pyreflies and vanishes" (the post-battle table,
 * row 9). Release 33 dissolved Seymour and left the mount fully opaque and idle
 * through the victory camera (1.01 s to 2.52 s in the critic's strip).
 *
 * The table names the parts sent with their master; `sendCompanions` dissolves
 * each one still on the stage a beat after the master starts to go, the same
 * pyrefly dissolve, and takes it off the field. Presentation only (no engine
 * state, no RNG); ports only, like the other beat modules.
 *
 * Game case: FFX only. The one entry is Chapter I's; the Natus/Mortibody pair
 * (Chapter X) is not listed, because its research does not say how Mortibody
 * leaves (`research/ffx-seymour-natus-highbridge.md` N-10 leaves the end in
 * words open).
 */
import type { CombatantId } from '../battle/common/types.ts';
import { settled, type EventCtx } from './BattlePresenterEvents.ts';

/** Who is sent together with whom. Keyed by the master's combatant id. */
export const SENT_WITH: Readonly<Partial<Record<CombatantId, readonly CombatantId[]>>> = {
  'seymour-flux': ['mortiorchis'],
};

/** The beat between the master starting to go and each part following, ms at timeScale 1. */
export const COMPANION_STAGGER_MS = 200;

/**
 * Dissolve every listed companion of `id` that is still on the stage, staggered,
 * then remove it. Resolves when the last one is gone (or at once when there is
 * none). `dissolveMs` and `colour` are the master's own dissolve, so the pair
 * read as one departure.
 */
export async function sendCompanions(
  ctx: EventCtx,
  id: CombatantId,
  dissolveMs: number,
  colour: number,
  dissolve: (other: CombatantId) => void = () => {},
): Promise<void> {
  const parts = (SENT_WITH[id] ?? []).filter((other) => ctx.stage.actor(other));
  await Promise.all(
    parts.map(async (other, i) => {
      await ctx.sleep(COMPANION_STAGGER_MS * (i + 1));
      const a = ctx.stage.actor(other);
      if (!a) return;
      dissolve(other);
      await settled(ctx, a.dissolveTo(1, dissolveMs, colour), dissolveMs);
      ctx.stage.removeCombatant(other);
    }),
  );
}
