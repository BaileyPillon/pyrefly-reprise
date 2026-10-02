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
 * - the comfort flags: REDUCE MOTION stills the breathing; both held shots keep playing, because a held shot
 *   already is one static cut to the shot and one cut back and never moves (`heldShots.ts`, the approved page's
 *   `ON · CUT`); a KO collapse becomes a cut (which the KO module decides), the fog's drift stops (which the fog
 *   decides) and the FFX-2 twirl keys, which animate, do not play (`twirlKeysOn`). The tiers: the phone tier
 *   drops the bokeh depth of field (today's tilt-shift stays) and swaps SMAA for FXAA; LOW EFFECTS also drops
 *   the fog and the post AA (the defringe stays: it costs a uniform). `deviceNote` says what the device does to
 *   each part, for the EYE CANDY page to show.
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

/**
 * The device the game runs on: the tier (LOW EFFECTS, or a screen whose short side is under 600 px) and the
 * upright phone battle layout (`hudPanels.phoneBattle`: a phone held upright shows a slice of a wider field that
 * the HUD slides between beats).
 */
export interface Device {
  tier: FxTier;
  phone: boolean;
  /**
   * Is this fight a colossus fight, one CHAPTER FRAMING would scale and re-compose where the window allows it (`fightFacts`)?
   * Null or left out: not known (no battle bound), which reads as yes. A fight with no colossus loses nothing to a phone held upright.
   */
  colossus?: boolean | null;
}

/**
 * What the live mix knows of the fight on screen that the device rules need and the EYE CANDY page cannot ask the camera for.
 * `MaxMix` writes it every frame and clears it when the battle ends; the page reads it into its `Device`.
 */
export const fightFacts: { colossus: boolean | null } = { colossus: null };

/** A part the device closes (`off`) or trims (`less`), and why: LOW EFFECTS, or a phone screen. */
export interface DeviceNote {
  limit: 'off' | 'less';
  why: 'low' | 'phone';
}

/**
 * What the device does to a part, whatever the player's switches say (the switch keeps its saved value; the
 * EYE CANDY page reads this to say `OFF HERE` or `LESS HERE`, and the mix reads it to hold the shots on the
 * phone). Null: the part plays in full here. The reasons (README of the options round and `mix-build.md`):
 *
 * - DEPTH OF FIELD plays on the full tier only: the phone and LOW EFFECTS keep today's tilt-shift;
 * - FOG is off under LOW EFFECTS;
 * - SMOOTH EDGES keeps only the defringe under LOW EFFECTS (no SMAA or FXAA pass; the phone's FXAA is still a pass);
 * - on a phone held upright the held shots are off (a framing for one slice crops its subject in the next) and
 *   CHAPTER FRAMING gives up the colossus master and BOSS SCALE (the phone keeps today's rig and its own fit,
 *   the menu clearance and the lens shift stay): `less` only in a colossus fight, where there is a boss to scale.
 */
export function deviceNote(part: MixPart, d: Device): DeviceNote | null {
  switch (part) {
    case 'depthOfField':
      return d.tier === 'full' ? null : { limit: 'off', why: d.tier === 'low' ? 'low' : 'phone' };
    case 'fog':
      return d.tier === 'low' ? { limit: 'off', why: 'low' } : null;
    case 'smoothEdges':
      return d.tier === 'low' ? { limit: 'less', why: 'low' } : null;
    case 'chapterFraming':
      return d.phone && d.colossus !== false ? { limit: 'less', why: 'phone' } : null;
    case 'overdriveShot':
    case 'dressphereShot':
      return d.phone ? { limit: 'off', why: 'phone' } : null;
    default:
      return null;
  }
}

/** Does the device close this part outright (a `less` part still plays)? */
export function deviceCloses(part: MixPart, d: Device): boolean {
  return deviceNote(part, d)?.limit === 'off';
}

/**
 * Does this part play under these switches? Pure. The tier closes DEPTH OF FIELD and FOG here; the upright
 * phone layout, which only the DOM knows, closes the held shots in `MaxMix` (through `deviceCloses`), so the
 * Overdrive banner rule, which is part of OVERDRIVE SHOT but moves nothing in the scene, runs there as it does on
 * a desktop window.
 */
export function partOn(part: MixPart, e: GateEnv): boolean {
  const look = PART_LOOK[part];
  if (!e.look(look) || !e.on(LOOK_KEY[look]) || !e.on(part)) return false;
  if (deviceCloses(part, { tier: e.tier, phone: false })) return false;
  switch (part) {
    case 'breathing':
      return !e.reduceMotion;
    case 'overdriveShot':
      return e.game === 'ffx';
    case 'dressphereShot':
      return e.game === 'ffx2';
    default:
      return true;
  }
}

/**
 * The FFX-2 twirl keys (`twirl.ts`) play with DRESSPHERE SHOT, but never under REDUCE MOTION: the twirl is a
 * motion, and the shot's one cut is all REDUCE MOTION keeps (today's flourish is already a cut under it).
 */
export function twirlKeysOn(e: GateEnv): boolean {
  return partOn('dressphereShot', e) && !e.reduceMotion;
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
