/**
 * The gamepad, in one place (release 61, the conference demo: "A gamepad (Recommended)", decision 169; **both games**, input plumbing).
 *
 * Every reader of `navigator.getGamepads()` in the build (the unified `Input`, the HUD's `RawInputWatcher`, the strategy guide, the move advisor, the
 * enemy-move slab) used to carry its own copy of the button numbers, its own dead zone and its own repeat times. They agreed by luck. This module is the
 * one table they all read, and it is pure: no DOM, no `navigator`, so a test can drive it with numbers.
 *
 * ## The layout (the W3C "standard" mapping, which Chrome and Edge give an Xbox pad, a DualShock 4, a DualSense and a Switch Pro pad alike)
 *
 * | Index | Xbox | PlayStation | Game use (battle) |
 * |-------|------|-------------|-------------------|
 * | 0 | A | Cross | confirm |
 * | 1 | B | Circle | back / cancel |
 * | 2 | X | Square | the strategy guide (`G`); Bushido's Square |
 * | 3 | Y | Triangle | FFX: Defend at the command menu; FFX-2: the enemy-move slab (`E`); hides the pause chrome |
 * | 4 / 5 | LB / RB | L1 / R1 | FFX: party swap; pause: previous / next tab; RB held: fast-forward |
 * | 6 | LT | L2 | the enemy-move slab's MORE (hold: `J`) |
 * | 7 | RT | R2 | the best-move card (`N`) |
 * | 8 | Back / View | Select / Share | free in a fight: the booth's demo reset is Back + Start held |
 * | 9 | Start / Menu | Options | pause |
 * | 10 / 11 | LS / RS (press) | L3 / R3 | FFX: R3 is the enemy-move slab (`E`); L3 folds the enemy plate (`I`) |
 * | 12-15 | d-pad up / down / left / right | the same | move |
 *
 * The left stick moves like the d-pad ({@link stickDirection}); the right stick scrolls the strategy guide (axes 2 and 3).
 *
 * A pad that does not report `mapping === 'standard'` (an old generic pad on Firefox) is read through the same indices; it is the same guess the build
 * always made, and the one thing a real pad in Bailey's hands still has to confirm.
 */

/** Standard-mapping button indices, named for an Xbox pad. */
export const PAD = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  BACK: 8,
  START: 9,
  LS: 10,
  RS: 11,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
} as const;

/** The four ways a stick or d-pad can point a menu. */
export type PadDirection = 'up' | 'down' | 'left' | 'right';

// ----------------------------------------------------------------- the stick

/**
 * A stick must be pushed this far (its length, 0 to 1) to start a direction. An Xbox stick at rest wanders under 0.15 and a worn one under 0.3,
 * so 0.5 never fires by itself and is still a short push.
 */
export const STICK_ENGAGE = 0.5;

/**
 * Once a direction is held, it lasts until the stick falls under this. The gap between {@link STICK_ENGAGE} and this is what stops a stick resting near the
 * threshold from flickering press, release, press: three moves for one push, the "double move" a thumb on the edge of a dead zone used to make.
 */
export const STICK_RELEASE = 0.3;

/** A held direction changes axis only when the other axis is this many times longer, so a thumb rolling off a corner does not send a stray move. */
export const STICK_AXIS_BIAS = 1.3;

/**
 * The direction a stick points a menu, or null at rest.
 *
 * One direction at a time (the longer axis wins, with {@link STICK_AXIS_BIAS} in favour of the axis already held): a diagonal push used to count as two
 * (down AND right), which moved a cursor twice. `held` is what this returned last frame for the same stick; the caller owns that state.
 * `y` is the browser's: negative is up.
 */
export function stickDirection(x: number, y: number, held: PadDirection | null): PadDirection | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (Math.hypot(x, y) < (held ? STICK_RELEASE : STICK_ENGAGE)) return null;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  let horizontal: boolean;
  if (held === 'left' || held === 'right') horizontal = !(ay > ax * STICK_AXIS_BIAS);
  else if (held === 'up' || held === 'down') horizontal = ax > ay * STICK_AXIS_BIAS;
  else horizontal = ax >= ay;
  return horizontal ? (x < 0 ? 'left' : 'right') : y < 0 ? 'up' : 'down';
}

// -------------------------------------------------------------------- repeat

/** A held direction repeats after this long ... */
export const PAD_REPEAT_DELAY_MS = 350;
/** ... and then this often. Slow enough that a 60 Hz frame cannot read two steps in one press of a stick or d-pad. */
export const PAD_REPEAT_INTERVAL_MS = 115;

// -------------------------------------------------------------------- family

/** Whose button names a pad's glyphs use. */
export type PadFamily = 'xbox' | 'playstation' | 'nintendo';

/**
 * Which family a pad belongs to, from `Gamepad.id`. Chrome writes `Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)` for a DualShock 4,
 * `DualSense Wireless Controller (...0ce6)` for a DualSense, `Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e ...)` for an Xbox pad and
 * `Pro Controller (... Vendor: 057e ...)` for a Switch pad; Firefox writes `054c-09cc-Wireless Controller`. Anything it does not know is an Xbox pad, whose
 * letters are the most common labels on a PC.
 */
export function padFamilyOf(id: string | null | undefined): PadFamily {
  const s = (id ?? '').toLowerCase();
  if (/xbox|xinput|045e/.test(s)) return 'xbox';
  if (/054c|dualshock|dualsense|playstation|\bps[345]\b|wireless controller/.test(s)) return 'playstation';
  if (/057e|nintendo|pro controller|joy-?con|switch/.test(s)) return 'nintendo';
  return 'xbox';
}

// ------------------------------------------------------------------- glyphs

/**
 * The names a hint can ask for. They are the build's historical words (the hint tables said `Cross`, `Circle`, `Square`, `Triangle`, `L1`, `R2` long before there was a glyph
 * to draw), kept so every `gamepad:` string in the build is already a token; {@link padTokenOf} reads those strings.
 */
export type PadToken =
  | 'cross'
  | 'circle'
  | 'square'
  | 'triangle'
  | 'l1'
  | 'r1'
  | 'l2'
  | 'r2'
  | 'select'
  | 'start'
  | 'dpad'
  | 'dpad-v'
  | 'dpad-h'
  | 'lstick'
  | 'rstick'
  | 'l3'
  | 'r3';

/** The text a glyph shows for each family (what the CSS puts on the button, and what a text-only place such as a subtitle prints). */
export const PAD_LABELS: Readonly<Record<PadFamily, Readonly<Record<PadToken, string>>>> = {
  xbox: {
    cross: 'A',
    circle: 'B',
    square: 'X',
    triangle: 'Y',
    l1: 'LB',
    r1: 'RB',
    l2: 'LT',
    r2: 'RT',
    select: 'Back',
    start: 'Start',
    dpad: 'D-pad',
    'dpad-v': 'D-pad',
    'dpad-h': 'D-pad',
    lstick: 'L-Stick',
    rstick: 'R-Stick',
    l3: 'LS',
    r3: 'RS',
  },
  playstation: {
    cross: '✕',
    circle: '○',
    square: '□',
    triangle: '△',
    l1: 'L1',
    r1: 'R1',
    l2: 'L2',
    r2: 'R2',
    select: 'Share',
    start: 'Options',
    dpad: 'D-pad',
    'dpad-v': 'D-pad',
    'dpad-h': 'D-pad',
    lstick: 'L-Stick',
    rstick: 'R-Stick',
    l3: 'L3',
    r3: 'R3',
  },
  nintendo: {
    // The bottom face button is B on a Switch pad: the standard mapping's index 0 is the bottom one everywhere.
    cross: 'B',
    circle: 'A',
    square: 'Y',
    triangle: 'X',
    l1: 'L',
    r1: 'R',
    l2: 'ZL',
    r2: 'ZR',
    select: '−',
    start: '+',
    dpad: 'D-pad',
    'dpad-v': 'D-pad',
    'dpad-h': 'D-pad',
    lstick: 'L-Stick',
    rstick: 'R-Stick',
    l3: 'L3',
    r3: 'R3',
  },
};

/** The spoken name of a token for a family, for `aria-label` and the title attribute. */
export function padWord(token: PadToken, family: PadFamily = 'xbox'): string {
  const label = PAD_LABELS[family][token];
  if (family === 'playstation') {
    if (token === 'cross') return 'Cross';
    if (token === 'circle') return 'Circle';
    if (token === 'square') return 'Square';
    if (token === 'triangle') return 'Triangle';
  }
  if (token === 'start') return family === 'xbox' ? 'Menu button' : label;
  if (token === 'select') return family === 'xbox' ? 'View button' : label;
  return label;
}

/** Spellings the build used for a button before the glyphs; all of them lower-case, spaces and dashes folded. */
const TOKEN_WORDS: ReadonlyArray<readonly [string, PadToken]> = [
  ['cross', 'cross'],
  ['circle', 'circle'],
  ['square', 'square'],
  ['triangle', 'triangle'],
  ['l1', 'l1'],
  ['r1', 'r1'],
  ['l2', 'l2'],
  ['r2', 'r2'],
  ['select', 'select'],
  ['back', 'select'],
  ['start', 'start'],
  ['d-pad', 'dpad'],
  ['dpad', 'dpad'],
  ['dpad-v', 'dpad-v'],
  ['dpad-h', 'dpad-h'],
  ['lstick', 'lstick'],
  ['rstick', 'rstick'],
  ['l-stick', 'lstick'],
  ['r-stick', 'rstick'],
  ['l3', 'l3'],
  ['r3', 'r3'],
];

/** The token a legacy hint word names (`Cross`, `R-Stick`, `L1`), or null for any other text. */
export function padTokenOf(word: string): PadToken | null {
  const w = word.trim().toLowerCase();
  for (const [text, token] of TOKEN_WORDS) if (w === text) return token;
  return null;
}
