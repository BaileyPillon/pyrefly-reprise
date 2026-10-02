import { eyeCandyOn, type EyeCandyKey } from '../eyeCandyFlags.ts';
import { eyeCandy, type FxOption, type FxTier } from '../EyeCandy.ts';

/**
 * The MAX mix (D-316, Bailey 2026-10-01: "all your recommendations, godspeed"): which of its nine parts
 * plays, frame by frame. Every part answers three switches, all default ON (D-297):
 *
 * - its own EYE CANDY row (`eyeCandyOn('<part>')`, the seam the settings page installs, D-317);
 * - its look, both as the settings page reports it (`eyeCandyOn('<look>')`) and as main reads the
 *   existing OPTIONS row today (`eyeCandy.enabled(a | b | c)`, so `?fx=off` and a look switched off
 *   stop its parts): CINEMA LIGHT (option a) owns DEPTH OF FIELD, FOG and SMOOTH EDGES; LIVING
 *   PAINTINGS (b) owns BREATHING and KO COLLAPSE; BATTLE SPECTACLE (c) owns CHAPTER FRAMING,
 *   OVERDRIVE SHOT, DRESSPHERE SHOT and SPLASH ART;
 * - the comfort flags: REDUCE MOTION stills the breathing and drops both held shots (a KO collapse
 *   becomes a cut, which the KO module decides; the fog's drift stops, which the fog decides), and the
 *   tiers: the phone tier drops the bokeh depth of field (today's tilt-shift stays) and swaps SMAA for
 *   FXAA; LOW EFFECTS also drops the fog and the post AA (the defringe stays: it costs a uniform).
 *
 * Game case (rule 14): OVERDRIVE SHOT is FFX only and DRESSPHERE SHOT FFX-2 only (each game shows 11
 * of the 12 rows, D-317); everything else is both. FF7 never binds the mix.
 *
 * Pure apart from reading the two switch modules: no DOM, no `three`.
 */

export type MixPart = 'depthOfField' | 'fog' | 'smoothEdges' | 'breathing' | 'koCollapse' | 'chapterFraming' | 'overdriveShot' | 'dressphereShot' | 'splashArt';

export const MIX_PARTS: readonly MixPart[] = ['depthOfField', 'fog', 'smoothEdges', 'breathing', 'koCollapse', 'chapterFraming', 'overdriveShot', 'dressphereShot', 'splashArt'];

/** The look each part belongs to (eye candy D's option letter). */
export const PART_LOOK: Readonly<Record<MixPart, FxOption>> = {
  depthOfField: 'a', fog: 'a', smoothEdges: 'a',
  breathing: 'b', koCollapse: 'b',
  chapterFraming: 'c', overdriveShot: 'c', dressphereShot: 'c', splashArt: 'c',
};

export const LOOK_KEY: Readonly<Record<FxOption, EyeCandyKey>> = { a: 'cinemaLight', b: 'livingPaintings', c: 'battleSpectacle' };

export type MixGame = 'ffx' | 'ffx2';

export interface GateEnv {
  game: MixGame;
  tier: FxTier;
  reduceMotion: boolean;
  /** The look as main reads it today (`eyeCandy.enabled`). */
  look: (o: FxOption) => boolean;
  /** The EYE CANDY seam (`eyeCandyOn`). */
  on: (k: EyeCandyKey) => boolean;
}

/** Does this part play under these switches? Pure. */
export function partOn(part: MixPart, e: GateEnv): boolean {
  const look = PART_LOOK[part];
  if (!e.look(look) || !e.on(LOOK_KEY[look]) || !e.on(part)) return false;
  switch (part) {
    case 'depthOfField':
      return e.tier === 'full';
    case 'fog':
      return e.tier !== 'low';
    case 'breathing':
      return !e.reduceMotion;
    case 'overdriveShot':
      return e.game === 'ffx' && !e.reduceMotion;
    case 'dressphereShot':
      return e.game === 'ffx2' && !e.reduceMotion;
    default:
      return true;
  }
}

/** SMOOTH EDGES' post pass for a tier: SMAA on the full tier, FXAA on the phone, none under LOW EFFECTS. */
export function aaKind(tier: FxTier): 'smaa' | 'fxaa' | null {
  return tier === 'full' ? 'smaa' : tier === 'phone' ? 'fxaa' : null;
}

/** The live environment (main's eye candy state plus the seam). */
export function liveGates(game: MixGame): GateEnv {
  return { game, tier: eyeCandy.tier, reduceMotion: eyeCandy.reduceMotion, look: (o) => eyeCandy.enabled(o), on: (k) => eyeCandyOn(k) };
}

/** Every part's state at once (snapshots, tests). */
export function partsOn(e: GateEnv): Record<MixPart, boolean> {
  const out = {} as Record<MixPart, boolean>;
  for (const p of MIX_PARTS) out[p] = partOn(p, e);
  return out;
}
