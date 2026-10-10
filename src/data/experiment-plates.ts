/**
 * Which painting the Experiment's fight stands in front of. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The scene key is the plate's own key (as Chapter XVI's is), so the cutscene screen, the party prep wash and the board card, which all draw
 * `backdrops/<sceneKey>.png`, find the same painting as the battle does. The plate is a NEW file under a new name (`backdrops/ffx2-experiment-grounds*`), never a
 * replacement of an approved painting.
 *
 * **PROVISIONAL.** Until the overnight art run's grounds plate is installed, the file is a real copy of Chapter XVI's Chamber plate (Djose Temple, the Machine Faction's
 * lamps, cables and crates), installed under this name so the swap is the file and nothing else; `scenes/experiment-grounds.ts` frames it as that plate is framed. The
 * handoff `docs/handoff/ch-experiment.md` says which of the two is in the tree.
 */

/** The scene key and the plate: the Machine Faction's grounds at Djose Temple. */
export const EXPERIMENT_GROUNDS_PLATE = 'ffx2-experiment-grounds';
