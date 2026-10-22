/**
 * Demo looks, the DEPTH STAGE: the room's wind, as one small shared cell. `LookStage` writes it once a frame while the stage runs (`gust` 0..1, the clock multiplier `speed` and the opacity
 * multiplier `thicken` the weather reads); every consumer (the scene's snow bands, option B's flakes, streaks and haze) multiplies by it. With the stage off, or a room with no recipe, the
 * cell stands at its calm values (`speed` 1, `thicken` 1, `gust` 0), so a consumer's arithmetic is the same as it was before this existed: `dt * 1` and `opacity * 1` change nothing. Both games.
 */
export interface StageWindCell {
  /** 0 (calm) to 1 (the peak of a gust). */
  gust: number;
  /** The multiplier on the weather's clock rate (1 = real time). */
  speed: number;
  /** The multiplier on the streaks' and the mist's opacity (1 = as authored). */
  thicken: number;
  /** The multiplier on the moon's light shafts (more snow and mist in the air throws more of the light: 1 = as authored). */
  shaft: number;
  /** The share of the weather's particles and mist sheets the quality tier keeps (1 = all of them): the snow bands, option B's flakes and its haze read it. */
  density: number;
}

export const stageWind: StageWindCell = { gust: 0, speed: 1, thicken: 1, shaft: 1, density: 1 };

export function setStageWind(gust: number, speed: number, thicken: number, shaft = 1, density = 1): void {
  stageWind.gust = gust;
  stageWind.speed = speed;
  stageWind.thicken = thicken;
  stageWind.shaft = shaft;
  stageWind.density = density;
}

/** Back to calm: the stage is off. */
export function calmStageWind(): void {
  setStageWind(0, 1, 1, 1, 1);
}
