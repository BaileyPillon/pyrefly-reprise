/**
 * Figure lighting MOCKUPS (`lightFlags.ts`): each room's own light, as data, confirmed by eye against the painting at 1600x900.
 *
 * A key is a light source seen IN the painting: where it sits on the backdrop (`at`: x right, y DOWN, both 0 to 1 of the image),
 * its colour, how strongly it lights the figures (`w`, 0 to 1) and how much of its direction faces the viewer (`front`, 0.3 to
 * 0.6: a moon behind the cliffs still models a figure from its side; the figure's own painted light stays the front light).
 * The driver picks the two keys that matter most for each figure (nearest and strongest), so a hall with a lamp on each side
 * lights the girl on the left from the left lamp.
 *
 * Only the two rooms of the mockup chapters are confirmed by hand. Any other room falls back to a key found in the backdrop's
 * own blurred colour field (`backdropField.ts`), which is plausible but not checked.
 */

export interface RoomKey {
  at: readonly [number, number];
  col: number;
  w: number;
  front: number;
}

export interface RoomLight {
  keys: readonly RoomKey[];
  /** The shadow side's hue (the room's ambient). */
  ambient: number;
  /** Look 3's gradient: the room's colour at the head and at the feet. */
  sky: number;
  bounce: number;
  /** Look 3's glow behind each figure, 0 to 1: how much of the room's light comes from behind. */
  halo: number;
  /** How far the wrap reaches into the figure and how bright it is, 1 = the default. */
  wrap: number;
}

export const ROOMS: Record<string, RoomLight> = {
  // FFX Chapter I: a cold moon upper left and behind the cliffs (c5e9ff, from the left), blue sky, snow bounce.
  gagazet: {
    keys: [
      { at: [0.22, 0.15], col: 0xc5e9ff, w: 1.0, front: 0.42 },
      { at: [0.5, 1.15], col: 0x8fb8ff, w: 0.35, front: 0.55 },
    ],
    ambient: 0x2f5fb8,
    sky: 0xc9e6ff,
    bounce: 0x9cc8ff,
    halo: 0.9,
    wrap: 1.0,
  },
  // FFX-2 Chapter IV: a cold skylight over the hall, warm orange lamp columns left and right, the hall's wheel in the middle.
  'bevelle-underground': {
    keys: [
      { at: [0.5, 0.0], col: 0xbcd7ff, w: 0.85, front: 0.5 },
      { at: [0.04, 0.55], col: 0xffa24e, w: 1.0, front: 0.4 },
      { at: [0.96, 0.55], col: 0xffa24e, w: 1.0, front: 0.4 },
      { at: [0.49, 0.5], col: 0xffa85e, w: 0.6, front: 0.35 },
    ],
    ambient: 0x37508f,
    sky: 0xc4d6ff,
    bounce: 0xff9b55,
    halo: 0.55,
    wrap: 1.0,
  },
};
