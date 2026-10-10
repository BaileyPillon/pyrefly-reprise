/**
 * The Leblanc Syndicate's real statures: how tall each fiend of Chapter VI stands, next to the girls, in the game's own models.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Nothing here is read by an FFX chapter; the hidden experimental Leblanc chapter
 * (`data/chapter-exp-leblanc.ts`) plays Chapter VI's three acts by reference and so reads the same table.
 *
 * Source: `research/ffx2-leblanc-syndicate.md` §20 (the method, the table and what was not found). In short: the height of each
 * model is the vertical extent of its bind-pose mesh bounds in the FFX-2 HD Remaster's model files (Steam build 25501027), hair and
 * topknot included, which is good to about 5 percent. The game's monster records name the models (`model` 0x1081 is `m129`, and so
 * on); the girls' own models are `c056` to `c070`. A height is only ever used as a **ratio to the girls' mean**, which is what the
 * stage needs: its party figures stand at one world height (`partyHeight`) and every fiend stands at that height times its ratio.
 *
 * Confidence: `[single source: own measurement]`, as §20.2 tags the table: one reader and one build of the HD files, good to about 5 percent
 * (§20.3). A ratio here is "a head taller than the girls", not an exact figure.
 *
 * What was **not** found in the files (so nothing here claims it): an engine scale for these five models (the formation table's
 * per-monster size column reads 100, unscaled, for each of them), where each side stands in a battle, and the battle camera. The
 * distances and the camera of this game's stage are ours (`scenes/leblanc-last-room.ts`), and the table carries no stand position.
 *
 * Presentation data, not battle data: no engine reads it (hard rule 1), and no stat, hit or damage rule depends on it.
 */

/** One HD model and its bind-pose mesh height, in the model files' own units. */
export interface ModelStature {
  /** The model's folder in the HD files: `c0nn` a player-side model, `m1nn` a monster's. */
  readonly model: string;
  /** The bind-pose bounds' height, hair and topknot included (about 5 percent). */
  readonly height: number;
}

/**
 * The thirteen usable FFX-2 girl models, `c056` to `c070` (`c060` is a 44-unit mesh that is not a body and `c067` has no mesh, so both are left out).
 * Which model is which girl in which dressphere was not mapped; the table stands for "the girls", at 16.3 to 17.7.
 */
export const GIRL_MODEL_STATURES: readonly ModelStature[] = [
  { model: 'c056', height: 17.12 },
  { model: 'c057', height: 17.648 },
  { model: 'c058', height: 17.13 },
  { model: 'c059', height: 17.697 },
  { model: 'c061', height: 16.263 },
  { model: 'c062', height: 17.222 },
  { model: 'c063', height: 16.598 },
  { model: 'c064', height: 16.263 },
  { model: 'c065', height: 17.222 },
  { model: 'c066', height: 16.598 },
  { model: 'c068', height: 16.464 },
  { model: 'c069', height: 17.433 },
  { model: 'c070', height: 17.127 },
];

/** The five Syndicate models, by the monster records that name them (`research/ffx2-leblanc-syndicate.md` §20). */
export type SyndicateModelId = 'm129' | 'm130' | 'm131' | 'm135' | 'm138';

export const SYNDICATE_MODEL_STATURES: Readonly<Record<SyndicateModelId, ModelStature & { readonly name: string }>> = {
  m129: { model: 'm129', name: 'Ormi', height: 19.557 },
  m130: { model: 'm130', name: 'Logos', height: 21.418 },
  m131: { model: 'm131', name: 'Leblanc', height: 17.822 },
  m135: { model: 'm135', name: 'Dr. Goon', height: 18.691 },
  m138: { model: 'm138', name: 'Fem-Goon', height: 17.081 },
};

/**
 * Which model each combatant of Chapter VI draws on, by combatant id (`data/ffx2/enemies/leblanc-syndicate*.ts`): Act I is Ormi and
 * the two goons, Act II Logos and Ormi, Act III Leblanc, Logos and Ormi. The three Ormi records and the two Logos records are
 * one model each (the monster table's `model` field is 0x1081 for all of Ormi's records and 0x1082 for all of Logos's).
 */
export const SYNDICATE_COMBATANT_MODEL: Readonly<Record<string, SyndicateModelId>> = {
  'ormi-entrance': 'm129', // Act I
  'dr-goon': 'm135', // Act I
  'fem-goon': 'm138', // Act I
  'logos-room': 'm130', // Act II
  'ormi-logos-room': 'm129', // Act II
  leblanc: 'm131', // Act III
  logos: 'm130', // Act III
  ormi: 'm129', // Act III
};

/** The girls' mean model height (16.98 model units): the stage's party figure stands for it. */
export function girlsMeanModelHeight(): number {
  return GIRL_MODEL_STATURES.reduce((sum, g) => sum + g.height, 0) / GIRL_MODEL_STATURES.length;
}

/** A Syndicate model's height over the girls' mean: Ormi 1.15, Logos 1.26, Leblanc 1.05, Dr. Goon 1.10, Fem-Goon 1.01. */
export function statureOverGirls(model: SyndicateModelId): number {
  return SYNDICATE_MODEL_STATURES[model].height / girlsMeanModelHeight();
}

/**
 * The world height each Syndicate combatant stands at on a stage whose girls stand `partyHeight` tall: `partyHeight` times the
 * model's ratio to the girls, to the millimetre. It is a `SceneStaging.figureHeights` table, keyed by combatant id, and it takes the
 * place of the stage's own rule for a fiend that has none of its own (a boss at the scene's boss height, any other fiend at 0.7 of it).
 */
export function syndicateFigureHeights(partyHeight: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, model] of Object.entries(SYNDICATE_COMBATANT_MODEL)) out[id] = Math.round(partyHeight * statureOverGirls(model) * 1000) / 1000;
  return out;
}
