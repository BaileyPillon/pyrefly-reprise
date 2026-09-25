/**
 * **The `'dismissed'` departure: an aeon recalled, not killed.** FFX only
 * (AGENTS.md rule 14): Lady Ginnem's Yojimbo and Daigoro, Chapter IX, the
 * Cavern of the Stolen Fayth. No FFX-2 subject uses it.
 *
 * Bailey's pick, D-076 (2026-09-24, "I'll go with your recommendations for
 * all"): "Both recalled together like Anima's scripted departure, labelled our
 * own reading (no source describes the exit); Lady Ginnem stays on the field
 * until Yuna sends her in the post-battle scene."
 *
 * **Our reading, not a sourced fact.** The decision sheet
 * (`docs/concepts/chapters/yojimbo/decisions/README.md`, "decision-exit.png")
 * records: "Yojimbo himself: no source describes how he leaves. Neither
 * *Yojimbo (Final Fantasy X boss)* (revid 3980332) nor *Cavern of the Stolen
 * Fayth* (revid 4034145) nor *Aeon (Final Fantasy X)* (revid 4029264) says so.
 * The recall below is our reading of the aeon class, labelled as such." The
 * class it reads from is Anima's row in `research/ffx-vs-ffx2-presentation.md`
 * §3.2: "present the departure as a recall, not a death" ("Do NOT: dissolve
 * her into pyreflies; play a death throe"). Daigoro goes with him because he is
 * "always appearing at the aeon's side" (FF Wiki *Daigoro*, revid 3782948).
 *
 * **The motion is the sheet's**, the one Bailey picked (`gen_crops.py`
 * `x-pair-dismissed.png`): the idles only, opacity 1 → 0.5 → 0.12 while the
 * pair rises 35 → 70 px of a 760 px Yojimbo (2.55 world units, INSTALLED.md),
 * no pyrefly burst, no painting beyond the idle. Here the idle first dims where
 * it stands, then rises and fades out; {@link RECALL_RISE} carries the sheet's
 * line on to alpha 0. The timings are presentation choices, not game data.
 *
 * **Ginnem is not in here.** She is a non-combatant with no KO
 * (`yojimbo-rules.ts#markYojimboRuntime`), so no departure ever touches her:
 * she stays on the field, untargetable, through the victory. Her sending is the
 * post scene's (the story track), not the presenter's.
 *
 * Same rules as the other beat modules (AGENTS.md hard rule 1): no `three`, no
 * DOM, ports only.
 */

import type { CombatantId } from '../battle/common/types.ts';
import type { ActorHandle, Point3 } from './BattlePresenterPorts.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';

/**
 * Who leaves with a recalled figure. Keyed by the recalled figure's combatant
 * id. Daigoro (`src/data/ffx/enemies/yojimbo.ts` `DAIGORO_ID`) has no KO of his
 * own, so without this row he would stand on after his master had gone.
 */
export const RECALL_COMPANIONS: Readonly<Partial<Record<CombatantId, readonly CombatantId[]>>> = {
  // FFX, Chapter IX: D-076, our reading (see the module note).
  yojimbo: ['daigoro'],
};

/** The recall, in milliseconds at timeScale 1: the dim where it stands, then the rise. */
export const RECALL_MS = { dim: 360, rise: 1300 } as const;
/** How dim the idle gets before it rises (brightness multiplier). */
export const RECALL_DIM = 0.55;
/**
 * How far the pair rises, world units: the sheet's 70 px of a 760 px, 2.55 u
 * Yojimbo at alpha 0.12 (0.235 u), carried on to alpha 0.
 */
export const RECALL_RISE = 0.27;
/** Steps the dim is quantised to, as the yield's dim is. */
const DIM_STEPS = 6;

/** The departure's one shared deadline (`BattlePresenterDepartures.ts#budget`). */
export interface RecallBudget {
  guard(p: void | Promise<void>): Promise<void>;
  sleep(ms: number): Promise<void>;
}

const at = (p: Point3): Point3 => ({ x: p.x, y: p.y, z: p.z });

/** Everyone who leaves in `id`'s recall, the figure itself first; unstaged ones are skipped. */
export function recallGroup(
  ctx: EventCtx,
  id: CombatantId,
  actor: ActorHandle | undefined,
): Array<[CombatantId, ActorHandle]> {
  const group: Array<[CombatantId, ActorHandle]> = actor ? [[id, actor]] : [];
  for (const other of RECALL_COMPANIONS[id] ?? []) {
    const a = ctx.stage.actor(other);
    if (a) group.push([other, a]);
  }
  return group;
}

/**
 * Recall `id` and its companions together: each stands in its idle, dims, then
 * rises and fades out. The companions are taken off the field here; the caller
 * removes `id` itself, as for every `'removed'` departure. With `id` itself not
 * staged, the companions still go.
 */
export async function recall(
  ctx: EventCtx,
  id: CombatantId,
  actor: ActorHandle | undefined,
  b: RecallBudget,
): Promise<void> {
  const group = recallGroup(ctx, id, actor);
  for (const [, a] of group) a.setPose('idle', { force: true });
  for (let i = 1; i <= DIM_STEPS; i++) {
    const v = 1 - (1 - RECALL_DIM) * (i / DIM_STEPS);
    for (const [, a] of group) a.setBrightness(v);
    await b.sleep(RECALL_MS.dim / DIM_STEPS);
  }
  await Promise.all(
    group.map(([, a]) => {
      const from = at(a.position);
      return Promise.all([
        b.guard(a.moveTo({ x: from.x, y: from.y + RECALL_RISE, z: from.z }, RECALL_MS.rise)),
        b.guard(a.fadeTo(0, RECALL_MS.rise)),
      ]);
    }),
  );
  for (const [other] of group) if (other !== id) ctx.stage.removeCombatant(other);
}
