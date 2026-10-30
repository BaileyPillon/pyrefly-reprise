/**
 * WHICH FIGURES DRAW NO SCREEN-SPACE RIM (r63-play, 2026-10-23; the driver's extras for tonight's playtest; both games for the plumbing, each row says its game).
 *
 * The pro arena draws two rims of its own in screen space (`LookMainShader` LOOK_CINE, `LookBoldShader` step 5): a ring along each figure's lit edge, in the room's key colour. The boss re-cut lane switched them off on
 * the two re-cut bosses by drawing a mask (`BossMask.ts`: R = 1 where the figure in front draws no rim). This file says WHO is in that mask, beyond the two bosses:
 *
 * - **A boss's companion** (Chapter I, FFX only): Mortiorchis, the creature Seymour Flux sends; it is part of the boss fight and stood beside the re-cut boss with the pale rim still on it. It is flagged like the
 *   boss, under the same switch (`?boss=clean` / `?pack=demo`). Its painting is NOT re-cut tonight.
 * - **The party** (both games), when `?partyrim=off` / the playtest key `'` says so (`PartyRimSwitch.ts`): the party's rim off in the same way. r64 (item 200e): OFF is now the default in the two demo chapters, `?partyrim=on` (or `?pack=off`) brings today's rim back.
 *   Aeons stand on the party's side and take the same switch. The engine's own rim light on the figures (their `*.rim.png`) is not part of this; it is the pre-pro baseline and is not touched.
 *
 * A figure is tagged once, as the stage builds it (`tagRimFigure`); the mask asks `rimSkipOf` each frame. Pure but for `three` types and the two switches.
 */
import type { Object3D } from 'three';
import { bossCleanOn } from './BossClean.ts';
import { partyRimOff } from './PartyRimSwitch.ts';

export type RimClass = 'party' | 'companion';

/** Combatant ids that are part of a boss fight and draw no screen-space rim with the boss re-cut on, with the game each is (rule 14). */
export const RIM_COMPANIONS: Readonly<Record<string, 'ffx' | 'ffx2'>> = Object.freeze({
  mortiorchis: 'ffx', // Chapter I, Seymour Flux's companion (`SentCompanions.ts`)
});

/**
 * The foes of a chapter the treatment has joined whose art is NOT re-cut, and which draw no screen-space rim there, so that the whole frame shares the party's clean edge (release 69, `booth-leblanc`, both games for the
 * plumbing; each row says its game). Chapter VI (`ffx2-leblanc`, FFX-2 only): the three of the Syndicate and the goons, by combatant id (`data/ffx2/enemies/leblanc-syndicate-acts.ts`). They are flagged like a boss's companion,
 * under the same switch, and only while a treated chapter that does not hold the boss piece is running (`bossCleanOn()`), so the hidden experimental chapter, which plays the same ids, keeps its rim. They have no
 * `BOSS_FEET` row on purpose: the figures stand at human size with their feet at the anchor (the measured bottom-band footprint is 0.07 to 0.26 of the silhouette's width, narrower than the engine's own pool, so a row
 * would SHRINK their shadow), so their shadow and ring stay the engine's own. `docs/handoff/booth-leblanc.md` has the measurement.
 */
export const TREATED_RIM_FOES: Readonly<Record<string, 'ffx' | 'ffx2'>> = Object.freeze({
  leblanc: 'ffx2',
  logos: 'ffx2',
  'logos-room': 'ffx2',
  ormi: 'ffx2',
  'ormi-logos-room': 'ffx2',
  'ormi-entrance': 'ffx2',
  'dr-goon': 'ffx2',
  'fem-goon': 'ffx2',
});

/** The stage's one call as it builds a figure: remember whether it is the party's (or an aeon's), a boss's companion, or a foe of a treated chapter that draws no rim. */
export function tagRimFigure(actor: Object3D, combatantId: string, side: string): void {
  if (side === 'party' || side === 'aeon') actor.userData['rimClass'] = 'party' satisfies RimClass;
  else if (Object.prototype.hasOwnProperty.call(RIM_COMPANIONS, combatantId) || Object.prototype.hasOwnProperty.call(TREATED_RIM_FOES, combatantId)) actor.userData['rimClass'] = 'companion' satisfies RimClass;
}

/** Does this figure draw no screen-space rim now? A re-cut boss, a boss's companion with the re-cut on, or a party figure with the party rim off. */
export function rimSkipOf(actor: Object3D): boolean {
  const art = (actor.userData['bossClean'] as { artId?: string } | undefined)?.artId;
  if (art !== undefined && bossCleanOn(art)) return true;
  const cls = actor.userData['rimClass'] as RimClass | undefined;
  return (cls === 'companion' && bossCleanOn()) || (cls === 'party' && partyRimOff());
}
