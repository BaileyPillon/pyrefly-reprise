/**
 * FF7 battle HUD colours and type metrics, as data (FF7 only).
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Nothing here is read by the FFX
 * or FFX-2 HUDs; the CSS tokens that mirror these live under `.ff7hud` in
 * `ff7-hud.css`. Every value cites `docs/plans/ff7-hud-faithful-a-spec.md`
 * ("spec §x") with its tag; `[estimate]` means our estimate, and it shows as
 * such in `docs/handoff/ff7-hud.md`.
 *
 * `WindowColour`, `RGB` and the default come from Bailey's own Lifestream
 * Encore (`D:\FF7\src\ui\types.ts`, `OG_WINDOW_COLOUR`), ported to strict TS;
 * the values agree with spec §3.1 `[verified: 3 sources, PS1]`.
 */

/** One colour channel triple, 0–255. */
export type RGB = readonly [r: number, g: number, b: number];

/** FF7's four-corner window gradient: each corner its own colour (Config "Window color"). */
export interface WindowColour {
  topLeft: RGB;
  topRight: RGB;
  bottomLeft: RGB;
  bottomRight: RGB;
}

/** The PlayStation default, blue only: TL 176, TR 128, BL 80, BR 32 [spec §3.1, verified: 3 sources, PS1]. */
export const FF7_WINDOW_COLOUR: WindowColour = {
  topLeft: [0, 0, 176],
  topRight: [0, 0, 128],
  bottomLeft: [0, 0, 80],
  bottomRight: [0, 0, 32],
};

/**
 * The Limit-technique window: magenta at the top left to red at the bottom right
 * [spec §3.1, single source, JPEG still]; TR and BL are the midpoint, our estimate.
 */
export const FF7_LIMIT_WINDOW_COLOUR: WindowColour = {
  topLeft: [0xb0, 0x4a, 0x98],
  topRight: [0xa8, 0x44, 0x80],
  bottomLeft: [0xa8, 0x44, 0x80],
  bottomRight: [0xa3, 0x3d, 0x4b],
};

/** `#rrggbb` for an {@link RGB}. */
export function hex(c: RGB): string {
  return `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The frame bevel, outside to inside [spec §3.1, measured]: the sides, and the
 * top and bottom edges. Drawn as inset rings, never a texture (rule 8).
 */
export const FRAME_SIDE = ['#6C6C6C', '#939393', '#B7B7B7', '#9C9C9C', '#575757', '#272727'] as const;
export const FRAME_TOP = ['#C6C6C6', '#D0D0D0', '#949494', '#585858', '#333333'] as const;

/** Text colours [spec §3.3, §5.5]. */
export const TEXT = {
  /** Party window body text [measured]. */
  body: '#E7E7E7',
  /** Commands and messages [measured]. */
  command: '#FFFFFF',
  /** A command you cannot use [measured; S1 "displayed in grey"]. */
  off: '#6B6B6B',
  /** HP at or below 1/4 of max [verified: 2 sources]; this yellow is our estimate. */
  low: '#F8F070',
  /** Header caps [measured]. */
  header: '#ACACAC',
  /** Header outline [measured]. */
  headerEdge: '#181818',
  /** The 1 u drop shadow [measured]. */
  shadow: '#222222',
  /** Recovery numerals: green [verified]; this green is our estimate [spec §5.10]. */
  heal: '#80F080',
} as const;

/** A cylinder-shaded fill: shade, base, highlight [spec §3.4, §5.7]. */
export type Cylinder = readonly [shade: string, base: string, highlight: string];

/** Gauge fills [spec §3.4]; `limitMint` / `limitPeach` shade and highlight are our estimate (base measured). */
export const CYL = {
  track: ['#181818', '#6B6B6B', '#7B7B7B'],
  limit: ['#86476A', '#DE9CC0', '#FFD0E8'],
  fury: ['#962D2F', '#E67B7D', '#FFCDCD'],
  sadness: ['#2D2E9B', '#7678D9', '#D1D2FF'],
  limitMint: ['#6E9A70', '#C2F6C4', '#EEFFEE'],
  limitPeach: ['#8E6038', '#EDB682', '#FFE2C4'],
  time: ['#51857A', '#9FD8BA', '#BCF1D1'],
  timeFull: ['#94955A', '#F1EE9D', '#FDF9BD'],
  barrier: ['#A85858', '#D46464', '#DCCCCC'],
  mbarrier: ['#A88058', '#D49C64', '#DCD4CC'],
} as const satisfies Record<string, Cylinder>;

export type CylinderKey = keyof typeof CYL;

/** Shade at 0 %, base at 25 %, highlight at 40 %, base at 60 %, shade at 100 % [spec §5.7]. */
export function cylinder([sh, base, hi]: Cylinder): string {
  return `linear-gradient(${sh} 0%,${base} 25%,${hi} 40%,${base} 60%,${sh} 100%)`;
}

/** HP and MP lines: the filled part shows the whole-field gradient; the lost part dark red [spec §3.4, measured]. */
export const LINE = { hp: '#4774E4,#CDC4DE', mp: '#67C2D1,#C3C7BF', lost: '#2D0908' } as const;

/**
 * "Limit" in slot 1 cycles colour letter by letter: each letter its own order
 * through the same eight colours [spec §3.5, single source: the FF wiki's
 * animation; the order read off it for the A+ target]. The hex values are our
 * rough sampling; the step (100 ms) is the spec's reading, unverified in game.
 */
const LC = { G: '#60F080', Y: '#F0F000', Gy: '#707070', R: '#D80000', C: '#00F0F0', W: '#F0F0F0', B: '#0060B8', M: '#F000F0' } as const;
type LcKey = keyof typeof LC;
const LIMIT_TABLE: ReadonlyArray<readonly LcKey[]> = [
  ['G', 'Y', 'Gy', 'R', 'C', 'W', 'B', 'M'], // L
  ['M', 'C', 'W', 'B', 'G', 'Y', 'Gy', 'R'], // i
  ['R', 'G', 'Y', 'Gy', 'M', 'C', 'W', 'B'], // m
  ['B', 'M', 'C', 'W', 'R', 'G', 'Y', 'Gy'], // i
  ['Gy', 'R', 'G', 'Y', 'B', 'M', 'C', 'W'], // t
];
/** Milliseconds per step of the "Limit" letter colours [spec §3.5; unverified]. */
export const LIMIT_STEP_MS = 100;
/** Full-gauge blink period, mint to peach and back [spec §5.7: 4 Hz, our estimate]. */
export const LIMIT_BLINK_MS = 250;

/** The five letter colours of "Limit" at `phase` (any integer). */
export function limitLetterColours(phase: number): string[] {
  const p = ((phase % 8) + 8) % 8;
  return LIMIT_TABLE.map((row) => LC[row[p] as LcKey]);
}

/** The ready triangle [spec §3.5, `#F7E30D` verified: S1 + still]; the two shade faces are our drawing. */
export const TRIANGLE = { face: '#F7E30D', side: '#BFA800', top: '#FFF27A' } as const;

/**
 * M PLUS Rounded 1c 500 (OFL, self-hosted in `public/fonts/ff7/`), measured on
 * the A+ type sheet (`docs/concepts/ff7-hud-2026-09-27/a-plus/checks.json`):
 * cap 0.73 em, ascent 1.075, descent 0.32; digit pitch 0.86 of the cap (FF7
 * stills 0.86 to 0.90), "Cloud" 3.66 caps (stills about 3.8). The body face is
 * never the retail font or a fan trace of it (rule 8).
 */
export const BODY_FONT = {
  family: "'M PLUS Rounded 1c', 'Nunito', sans-serif",
  weight: 500,
  cap: 0.73,
  ascent: 1.075,
  descent: 0.32,
} as const;

/** Where the baseline falls below the top of a `line-height: 1` box, in ems. */
export const BASELINE_FROM_TOP = (1 - (BODY_FONT.ascent + BODY_FONT.descent)) / 2 + BODY_FONT.ascent;
