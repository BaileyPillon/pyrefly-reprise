/**
 * The one switch in front of the hidden FF7 experiment.
 *
 * `FF7_EXPERIMENT_READY` stays **false** until the FF7 engine (`src/battle/ff7/`)
 * and Bailey's picked HUD (option A, made more faithful) exist. While it is
 * false the secret door on chapter select does nothing visible and
 * `__pyrefly.gotoChapter('ff7-guard-scorpion')` lands in an inert holding state
 * (`BattleScreenExperiment.ts`); flipping it to true routes both to the FF7 flow.
 *
 * Game case: FF7 only.
 */

/** Flip to `true` when the FF7 engine and HUD land. */
export const FF7_EXPERIMENT_READY: boolean = false;

let override: boolean | null = null;

/** Whether the FF7 flow is open: the constant, unless a test overrode it. */
export function ff7ExperimentReady(): boolean {
  return override ?? FF7_EXPERIMENT_READY;
}

/** Tests only: force the switch (`null` restores the constant). */
export function setFf7ExperimentReadyForTests(value: boolean | null): void {
  override = value;
}
