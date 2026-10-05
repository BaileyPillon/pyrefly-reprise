import { boxesOf, bossCoverOf, overlapOf, type Field, type PartyRule } from './clearance.ts';
import { cameraAt, figOf, type Actor, type Fig, type Pose } from './geometry.ts';
import { hudFree } from './hudPanels.ts';
import { master, type MasterClass } from './masters.ts';
import type { Staging } from './staging.ts';

/**
 * CHAPTER FRAMING's colossus separation (moved out of `framing.ts` unchanged in release 39 so that file stays under 400 lines, rule 7).
 * Game case: both (the spread cap and the first spread are FFX-2's own wider values; `masters.ts` has the lens).
 */

/**
 * The colossus master with the party spread and the sides stepped apart (the judges' Evrae and Bahamut
 * findings): spread until nobody hides another more than the rule allows, and step the boss away until
 * no member stands inside its painted box, both as seen from the master.
 */
export function separateMaster(game: 'ffx' | 'ffx2', staging: Staging, actors: readonly Actor[], cls: MasterClass, base: Pose, field: Field, rule: PartyRule): Pose {
  const visible = (): { figs: Fig[] } => ({ figs: actors.filter((a) => a.visible).map(figOf) });
  const free = hudFree(field.W, field.H);
  const plan = (): Pose => master({ cls, game, base, figs: visible().figs, W: field.W, H: field.H, free });
  let m = plan();
  const cap = game === 'ffx2' ? 1.6 : 1.4;
  let spread = game === 'ffx2' ? 1.15 : 1;
  let apart = 0;
  // The step apart scales with the boss (Evrae stands far down the deck, so a step must be a big one).
  const bossH = Math.max(1, ...visible().figs.filter((f) => f.enemy).map((f) => f.h));
  const apartMax = 0.3 * bossH;
  for (let i = 0; i < 8; i++) {
    const { figs } = visible();
    const boxes = boxesOf(cameraAt(m, field.W / field.H), figs, field);
    const needSpread = overlapOf(boxes, figs, m.pos) > rule.overlapMax && spread < cap - 1e-6;
    const needApart = bossCoverOf(boxes, figs) > rule.bossCoverMax && apart < apartMax - 1e-6;
    if (!needSpread && !needApart && i > 0) break;
    if (needSpread) spread = Math.min(cap, spread + 0.08);
    if (needApart) apart = Math.min(apartMax, apart + apartMax / 6);
    staging.planSpread(actors, spread);
    for (const a of actors) {
      const p = staging.plan.get(a) ?? { k: 1, dx: 0 };
      if (a.facing < 0) p.dx = apart;
      else p.dx -= apart * 0.3;
      staging.plan.set(a, p);
    }
    staging.apply(actors, true);
    m = plan();
  }
  return m;
}
