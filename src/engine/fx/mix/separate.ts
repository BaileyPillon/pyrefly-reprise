import { boxesOf, bossCoverOf, overlapOf, type Field, type PartyRule } from './clearance.ts';
import { cameraAt, subjectId, type Actor, type Fig, type Pose } from './geometry.ts';
import { hudFree } from './hudPanels.ts';
import { master, type MasterClass } from './masters.ts';
import type { Staging } from './staging.ts';

/**
 * The colossus master with the party spread and the sides stepped apart (the judges' Evrae and Bahamut findings; moved out of `framing.ts`, the
 * 400-line rule): spread until nobody hides another more than the rule allows, and step the boss away until no member stands inside its painted
 * box, both as seen from the master. The staging is written onto the figures as it goes (`Staging.plan`), and `framing.ts` puts them back.
 *
 * `pinned` (the chapter's table, `colossusPin.ts`): no search; the step apart is the table's (and the boss's own further step, for the fiend `lead`
 * matches), the party is not spread, the master is made once from the figures where that leaves them. The search stops at the edge of its limits (a share of a member under a card against the rule's), so two runs
 * of one fight took one step or two; the table does not.
 */
export function separate(
  game: 'ffx' | 'ffx2',
  staging: Staging,
  figsOf: () => Fig[],
  actors: readonly Actor[],
  cls: MasterClass,
  base: Pose,
  field: Field,
  rule: PartyRule,
  pinned: { apart: number; bossApart: number } | null = null,
  lead: RegExp | null = null,
): Pose {
  const free = hudFree(field.W, field.H);
  const plan = (): Pose => master({ cls, game, base, figs: figsOf(), W: field.W, H: field.H, free });
  const write = (spread: number, apart: number, extra = 0): void => {
    staging.planSpread(actors, spread);
    for (const a of actors) {
      const p = staging.plan.get(a) ?? { k: 1, dx: 0 };
      if (a.facing < 0) p.dx = apart + (lead?.test(subjectId(a)) ? extra : 0);
      else p.dx -= apart * 0.3;
      staging.plan.set(a, p);
    }
    staging.apply(actors, true);
  };
  let spread = game === 'ffx2' ? 1.15 : 1;
  if (pinned !== null) {
    write(spread, pinned.apart, pinned.bossApart);
    return plan();
  }
  let m = plan();
  const cap = game === 'ffx2' ? 1.6 : 1.4;
  let apart = 0;
  // The step apart scales with the boss (Evrae stands far down the deck, so a step must be a big one).
  const bossH = Math.max(1, ...figsOf().filter((f) => f.enemy).map((f) => f.h));
  const apartMax = 0.3 * bossH;
  for (let i = 0; i < 8; i++) {
    const figs = figsOf();
    const boxes = boxesOf(cameraAt(m, field.W / field.H), figs, field);
    const needSpread = overlapOf(boxes, figs, m.pos) > rule.overlapMax && spread < cap - 1e-6;
    const needApart = bossCoverOf(boxes, figs) > rule.bossCoverMax && apart < apartMax - 1e-6;
    if (!needSpread && !needApart && i > 0) break;
    if (needSpread) spread = Math.min(cap, spread + 0.08);
    if (needApart) apart = Math.min(apartMax, apart + apartMax / 6);
    write(spread, apart);
    m = plan();
  }
  return m;
}
