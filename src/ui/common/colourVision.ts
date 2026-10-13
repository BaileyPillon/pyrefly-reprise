/**
 * COLOUR VISION (ACCESSIBILITY tab, PR-0032; Bailey, 2026-10-12, "OPT-B with NO-KEYS", answered with
 * "I'll go with all of your recommendations"): the colours the two modes change, as data.
 * Pure: no DOM, no `three`. `docs/handoff/r44-access.md` carries the numbers behind it.
 *
 * The setting is scoped to the FOUR groups whose colours collapse under a simulation of colour
 * blindness (Machado, Oliveira and Fernandes 2009, full severity; CIEDE2000 distance between the two
 * closest members of a group; under 12 is easy to confuse). The other seven groups the round measured
 * shrink but stay readable, or already carry a word, so they are left exactly as they are:
 *
 * | group      | what it is                                        | game  | closest pair today (type)   | second cue, any mode but OFF            |
 * |------------|---------------------------------------------------|-------|-----------------------------|-----------------------------------------|
 * | `tints`    | Berserk and Curse tint on the painted fighter     | FFX   | 2.9 Berserk/Curse (protan)  | the status's initial over the head (B, C) |
 * | `target`   | targeting bracket and plate: enemy, ally, self    | FFX   | 6.2 ally/self (tritan)      | a diamond, a plus or a ring on the corners |
 * | `numerals` | the heal and MP damage numbers                    | both  | 8.2 heal/MP (tritan)        | `+` on a heal (already printed), `MP` on an MP number |
 * | `gates`    | Garment Grid gates: Spherechange wheel, grid pips | FFX-2 | 8.9 green/yellow (protan)   | the gate's letter R, G, B or Y          |
 *
 * Two modes, by what the player cannot tell apart: RED-GREEN (protanopia and deuteranopia) moves the
 * pairs that rely on red against green onto blue against orange (Okabe-Ito where a hue had to move);
 * BLUE-YELLOW (tritanopia) moves the pairs that rely on blue against green onto red against cyan. A
 * colour a mode does not need to move stays today's. OFF is today: no attribute, no variable, no mark.
 *
 * The same table feeds the three places a colour lives: the CSS variables `applyComfort` writes on
 * `<html>` ({@link cvdVars}, read by `colour-vision.css`), the painted-figure tint
 * (`statusFigureTint.ts`) and the SVG and inline colours of the Spherechange wheel and flourish
 * ({@link cvdColour}). `tests/unit/colour-vision.test.ts` re-runs the simulation on every group in every
 * mode and fails if a mode leaves a pair closer than its claim.
 */

import type { ColourVision } from '../../app/saveAccess.ts';
import { isColourVision } from '../../app/saveAccess.ts';

/** The two modes that change something; `off` is a no-op everywhere. */
export type CvdMode = Exclude<ColourVision, 'off'>;
export type CvdGroup = 'tints' | 'target' | 'numerals' | 'gates';

/** AGENTS.md rule 14: which game each group belongs to, from where its colour lives in the code. */
export const CVD_GAME: Readonly<Record<CvdGroup, 'ffx' | 'ffx2' | 'both'>> = Object.freeze({
  tints: 'ffx', // `statusLooks.ts` FFX table (FFX-2's Curse is a grey darkening, and FFX-2 has no Berserk look)
  target: 'ffx', // `ffx-hud.css` `.ffxhud .ffx-target*`; FFX-2's reticle and plates have their own chrome
  numerals: 'both', // `damage-numbers.css`: both games' numerals come out of one `DamageNumbers`
  gates: 'ffx2', // the Garment Grid: Spherechange wheel, flourish and the party-prep grid pips
});

/** Today's colours, as the code has them. Keyed the way the group's own code keys them. */
export const CVD_TODAY = {
  /** `statusLooks.ts` FFX_LOOKS: tint colours (0xRRGGBB). Zombie never moves: it has its own green and its smoke. */
  tints: { zombie: '#a6e39a', berserk: '#ff9a86', curse: '#c9a77c' },
  /** `ffx-hud.css` `.ffx-target--*` and `.ffx-target__plate--*`: the three marks of visual-bible 3.5. */
  target: { enemy: '#f2c21e', ally: '#7ee8b0', self: '#8fd0f0' },
  /** `damage-numbers.css`: the bottom of each numeral's gradient (what the figure mostly reads as); `mpHi` is MP's top. */
  numerals: { damage: '#d8dee8', crit: '#f2c21e', heal: '#3fa870', mp: '#3a8fd0', miss: '#8fa4bc', mpHi: '#8fd0f0' },
  /** `SpherechangeWheel.ts` and `SpherechangeFlourish.ts` GATE_HEX, §4.5.2's four-colour gate set. */
  gates: { red: '#d0343c', green: '#4fb05e', blue: '#3a78be', yellow: '#e3b94a' },
} as const;

type Today = typeof CVD_TODAY;
type Overrides = { readonly [G in CvdGroup]?: { readonly [K in keyof Today[G]]?: string } };

/**
 * What each mode changes, and only that. Hex values are proposals picked from the Okabe-Ito set where a
 * hue had to move, and scored with the same simulation (`tests/unit/colour-vision.test.ts` re-runs it).
 */
export const CVD_OVERRIDES: Readonly<Record<CvdMode, Overrides>> = Object.freeze({
  // Protanopia and deuteranopia: red against green is gone, so those pairs move onto blue against orange.
  'red-green': {
    tints: { berserk: '#c46bb5', curse: '#5e5648' }, // the red tint becomes magenta; the murky brown, a dark umber
    target: { ally: '#56b4e9', self: '#f4f1e8' }, // ally mint becomes sky blue; self (sky) becomes paper so the two stay apart
    gates: { red: '#d55e00', green: '#009e73', blue: '#0072b2', yellow: '#f0e442' }, // the Okabe-Ito four
  },
  // Tritanopia: blue against green is gone, so those pairs move onto red against cyan.
  'blue-yellow': {
    tints: { curse: '#5e5648' },
    target: { self: '#f4f1e8' },
    numerals: { mp: '#b48cf0', mpHi: '#d9c6f8' }, // MP turns violet; heal stays green
    gates: { green: '#00a6a6', blue: '#7a4fd0' },
  },
});

/** The colour of `key` in `group` under `mode`: today's unless the mode moves it. */
export function cvdColour<G extends CvdGroup>(group: G, key: keyof Today[G] & string, mode: ColourVision): string {
  if (isColourVision(mode) && mode !== 'off') {
    const moved = (CVD_OVERRIDES[mode][group] as Record<string, string> | undefined)?.[key];
    if (moved) return moved;
  }
  return CVD_TODAY[group][key] as string;
}

/**
 * For a caller that keeps its own constant (the Spherechange wheel's `GATE_HEX`, in any hex case): OFF hands back
 * `today` untouched, so nothing it draws changes by a character; so does a mode for a colour it does not move. A mode
 * hands back its own colour only for the colours it moves.
 */
export function cvdOr<G extends CvdGroup>(group: G, key: keyof Today[G] & string, mode: ColourVision, today: string): string {
  if (!isColourVision(mode) || mode === 'off') return today;
  return (CVD_OVERRIDES[mode][group] as Record<string, string> | undefined)?.[key] ?? today;
}

/** `#rrggbb` to `0xrrggbb`. */
export const hexToInt = (hex: string): number => parseInt(hex.slice(1), 16);

/** The painted-figure tint (`PaintedActor.setTint`) of a status under `mode`; `undefined` for a status the group does not own. */
export function cvdTint(status: string, mode: ColourVision): number | undefined {
  if (status !== 'berserk' && status !== 'curse') return undefined;
  return hexToInt(cvdColour('tints', status, mode));
}

/** The CSS custom properties `applyComfort` writes on `<html>` while a mode is on (every one, so a rule never needs a fallback). */
export function cvdVars(mode: ColourVision): Record<string, string> {
  if (mode === 'off' || !isColourVision(mode)) return {};
  return {
    '--cvd-target-enemy': cvdColour('target', 'enemy', mode),
    '--cvd-target-ally': cvdColour('target', 'ally', mode),
    '--cvd-target-self': cvdColour('target', 'self', mode),
    '--cvd-mp-hi': cvdColour('numerals', 'mpHi', mode),
    '--cvd-mp-lo': cvdColour('numerals', 'mp', mode),
    '--cvd-gate-r': cvdColour('gates', 'red', mode),
    '--cvd-gate-g': cvdColour('gates', 'green', mode),
    '--cvd-gate-b': cvdColour('gates', 'blue', mode),
    '--cvd-gate-y': cvdColour('gates', 'yellow', mode),
  };
}

/** The initial a status shows over the fighter's head under a mode (the second cue beside the tint), or null. FFX only. */
export function cvdInitial(status: string): 'B' | 'C' | null {
  return status === 'berserk' ? 'B' : status === 'curse' ? 'C' : null;
}

/** The letter printed on a gate (`red` is R, `green` G, `blue` B, `yellow` Y). */
export function gateLetter(gate: string): string {
  return gate.charAt(0).toUpperCase();
}
