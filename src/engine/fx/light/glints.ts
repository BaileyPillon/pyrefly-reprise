/**
 * Figure lighting MOCKUPS (`lightFlags.ts`): the hand-placed stars on blades, staves, gems and gold. Placed by eye on each
 * painting at 10 percent grid lines, for the poses of the two mockup chapters only; a pose with no entry draws its edge glints
 * (the shader's own) and no star. An automatic finder was tried and was right on metal about 40 percent of the time (white robes,
 * hair and snow all peak), so the stars are placed, not found.
 *
 * Key `<art id>/<pose file>`; each point `[u, v, size]`: u right and v UP from the bottom of the painting (the texture's own
 * uv), size as a fraction of the figure's world height (the star's reach on each arm is about that long).
 */
export type GlintPoint = readonly [u: number, v: number, size: number];

export const GLINTS: Record<string, readonly GlintPoint[]> = {
  // FFX, Chapter I
  'tidus/idle': [[0.66, 0.795, 0.09], [0.05, 0.255, 0.07], [0.38, 0.56, 0.06]],
  'tidus/ready': [[0.415, 0.545, 0.07], [0.057, 0.705, 0.05], [0.84, 0.375, 0.07], [0.975, 0.335, 0.06]],
  'tidus/attack': [[0.965, 0.225, 0.08], [0.62, 0.43, 0.06], [0.2, 0.8, 0.06]],
  'yuna/idle': [[0.15, 0.83, 0.08], [0.945, 0.35, 0.055]],
  'yuna/attack': [[0.18, 0.955, 0.08], [0.89, 0.625, 0.05]],
  'kimahri/idle': [[0.93, 0.1, 0.07], [0.65, 0.845, 0.04]],
  'mortiorchis/idle': [[0.475, 0.885, 0.09], [0.45, 0.7, 0.06], [0.33, 0.255, 0.07], [0.645, 0.68, 0.06]],
  // FFX-2, Chapter IV
  'yuna-white-mage/idle': [[0.2, 0.45, 0.08], [0.8, 0.93, 0.05]],
  'rikku-dark-knight/idle': [[0.82, 0.74, 0.08], [0.7, 0.36, 0.07], [0.88, 0.94, 0.05]],
  'paine-warrior/idle': [[0.78, 0.6, 0.06], [0.69, 0.1, 0.05]],
  'ffx2-bahamut/idle': [[0.208, 0.857, 0.09], [0.648, 0.836, 0.08], [0.45, 0.865, 0.05]],
  'ffx2-bahamut/attack': [[0.11, 0.815, 0.09], [0.49, 0.915, 0.1], [0.325, 0.855, 0.05]],
};
