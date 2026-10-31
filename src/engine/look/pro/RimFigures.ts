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
  // Chapter II (`yunalesca`, FFX only; release 69, `booth-ffx-yunalesca`): Lady Yunalesca, all three forms (one combatant, three paintings: `yunalesca-1/2/3`, swapped in place at each form change). NO `BOSS_CLEAN_ARTS` or `BOSS_FEET` rows,
  // for three measured reasons (`docs/handoff/booth-ffx-yunalesca.md` section 3): (1) the bottom-band footprints of forms 1 and 2 (hw 0.12 to 0.41 of the silhouette's width) are narrower than the engine's own pool for them, so a row would SHRINK their
  // shadow, and form 3's band is the edge of its canvas (the coils run off the painting), not a footprint; (2) `BossClean` keys its controller by the art id the figure was BUILT with, and a form change swaps the painting under it (`setArt`), so
  // per-form rows would need that plumbing changed first; (3) no pale matte fringe is indicated (edge minus ring luminance -17.2, +6.3, -17.9 against the booth bosses' +1.5 and +7.7 after their re-cut), so no re-cut art. She is flagged here, by combatant id,
  // like Leblanc's cast: no screen-space rim, so the frame shares the party's clean edge.
  yunalesca: 'ffx',
  // Batch 3b (`booth-ffx-b3b`, FFX only; the same rule and the same switch; the measures are in `docs/handoff/booth-ffx-b3b.md` section 3): NO `BOSS_CLEAN_ARTS` or `BOSS_FEET` row for any of them. The bottom-band footprints sit under or inside the engine's own pool for the figure
  // (row over pool 0.4 to 1.07 for the standing aeons, Shiva's lying KO 1.18 and Valefor's 0.10, Omnis 0.66 to 0.71, the Pagodas 0.11 to 0.66, Yu Yevon 0.46 to 1.04: a row would mostly SHRINK the shadow), Braska's Final Aeon swings between 0.25 and 1.48 across poses and changes painting at his form change (`BossClean` keys the art id the figure was
  // built with and does not follow `setArt`), and no pale matte fringe is proven (edge minus ring luminance +1.7 and -7.8 for the aeon's two forms, +7.6 the Pagoda, -7.0 Yu Yevon, -1.7 to +12.3 the aeons, -19.5 Isaaru; Omnis reads +24.8, a candidate for a re-cut that this branch does not build: no art is written; the
  // three Isaaru aeons read +47 to +56 with 25 to 31 percent of their pixels partly transparent, the translucent glows of the Shiva and Anima case, no re-cut). Chapter III: Braska's Final Aeon, the two Yu Pagodas, Yu Yevon and every possessed aeon the chain can stage (the five of the default roster and Anima, Yojimbo and the Magus Sisters
  // when Yuna owns them): the aeons are the party's own paintings, whose side draws no rim, so a possessed one must not draw the pale line its mirror does not. Chapter XII: Seymour Omnis (the four Mortiphasm discs are figure-less anchors, no actor to tag). Chapter XIV: Isaaru and his three aeons (Grothia, Pterya and Spathi are repaints of Ifrit,
  // Valefor and Bahamut, the party's own side's).
  'braskas-final-aeon': 'ffx',
  'yu-pagoda-left': 'ffx',
  'yu-pagoda-right': 'ffx',
  'yu-yevon': 'ffx',
  'possessed-valefor': 'ffx',
  'possessed-ifrit': 'ffx',
  'possessed-ixion': 'ffx',
  'possessed-shiva': 'ffx',
  'possessed-bahamut': 'ffx',
  'possessed-anima': 'ffx',
  'possessed-yojimbo': 'ffx',
  'possessed-cindy': 'ffx',
  'possessed-sandy': 'ffx',
  'possessed-mindy': 'ffx',
  'seymour-omnis': 'ffx',
  isaaru: 'ffx',
  grothia: 'ffx',
  pterya: 'ffx',
  spathi: 'ffx',
  leblanc: 'ffx2',
  logos: 'ffx2',
  'logos-room': 'ffx2',
  ormi: 'ffx2',
  'ormi-logos-room': 'ffx2',
  'ormi-entrance': 'ffx2',
  'dr-goon': 'ffx2',
  'fem-goon': 'ffx2',
  // Batch 2 (`booth-ffx2-b2`, FFX-2 only; the same rule, the same switch, and no `BOSS_FEET` row for any of them: `docs/handoff/booth-ffx2-b2.md` has the measured footprints, which sit under the anchor or inside the engine's own pool, so a row would shrink the shadow;
  // the colossus parts have their own contact shadow, `scenes/farplane-colossus-shadow.ts`). Chapter V: the four Vegnagun parts (machines; the figure-less Bulwarks, Redoubts and Nodes have no actor to tag). Chapter XI: Shiva, the three Sisters and Anima (`scenes/road-to-the-farplane.ts`
  // ROAD_IDS; Shiva's and Anima's paintings are soft glows all round, so a rim on top would be a second glow).
  // NOT LISTED, on purpose, and kept with their rim: **Shuyin** (the research asks for "a 10 to 20 percent alpha with an additive rim so he reads as a projection made of pyreflies", `research/ffx2-vegnagun-shuyin.md` section 10.2) and **the three shades of the Den**
  // (`shade-baralai`, `shade-gippal`, `shade-nooj`: pyrefly illusions. Measured on the shipped idle paintings (review of 2026-10-30, `docs/handoff/booth-ffx2-b2.md` section 2): NOT near-black but pale, glowing and translucent, mean luminance 0.64, 0.57 and 0.49
  // over the pixels above alpha 0.5, with 46 to 59 percent of the pixels partly transparent: the Shiva and Anima case. They keep the rim only because it is release 68's and nothing has shown it reads wrong; the fault to expect is a second glow on a glowing figure.)
  // Lifts when job J7 of `docs/handoff/booth-b2.md` (the shade with the rim ON against OFF; J4 of `booth-ffx2-b2.md`) or its J5 (Shuyin's frame; J7 of `booth-ffx2-b2.md`) shows a clean edge reads better: the fix is their ids added to this table.
  'vegnagun-tail': 'ffx2',
  'vegnagun-leg': 'ffx2',
  'vegnagun-body': 'ffx2',
  'vegnagun-head': 'ffx2',
  'x2-shiva': 'ffx2',
  sandy: 'ffx2',
  cindy: 'ffx2',
  mindy: 'ffx2',
  'x2-anima': 'ffx2',
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
