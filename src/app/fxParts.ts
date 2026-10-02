/**
 * The nine parts of the EYE CANDY page (D-317: Bailey, 2026-10-02 ~01:15 EDT, "all your
 * recommendations, godspeed", option A; D-297, 2026-09-29: "in the settings I want to be able to turn
 * each one off. Default will be on."). Each part belongs to one of eye-candy D's three looks
 * (`fxLooks.ts`), and the look is its master:
 *
 * - a look turned OFF stops its parts; each part keeps its own value (the page draws it dim);
 * - a part turned OFF stays OFF when its look comes back;
 * - a save written before the parts existed (releases 33 to 35 store the three looks and none of the
 *   parts) takes each new part from its look on upgrade, so a player who had a look OFF keeps the new
 *   parts OFF too ("players who had a look off keep the new parts off"). The rule fires only while a
 *   part has no stored boolean, so it runs once and never re-decides; `SAVE_VERSION` stays 1.
 *
 * REDUCE MOTION is never folded in: the switches keep their values and each play site holds its
 * motion still or makes it a cut (D-317, "REDUCE MOTION still wins").
 *
 * The seam the looks read (`engine/fx/eyeCandyFlags.ts`) gets a provider built here, installed by
 * `applyComfort` at boot and on every settings write: a look key answers the look, a part key answers
 * look AND part.
 *
 * Pure: no DOM, no `three`. Game case: both; OVERDRIVE SHOT is FFX only and DRESSPHERE SHOT FFX-2
 * only, so each game shows 11 of the 12 switches; FF7 draws no eye candy and shows none.
 */

import type { GameId } from '../battle/common/types.ts';
import type { EyeCandyKey } from '../engine/fx/eyeCandyFlags.ts';
import { FX_LOOK_ROWS, type FxLookField, type FxLookSettings } from './fxLooks.ts';

export interface FxPartSettings {
  /** DEPTH OF FIELD, a part of CINEMA LIGHT. */
  fxDof: boolean;
  /** FOG, a part of CINEMA LIGHT. */
  fxFog: boolean;
  /** SMOOTH EDGES (SMAA on the figure layer and the defringe), a part of CINEMA LIGHT. */
  fxEdges: boolean;
  /** BREATHING, a part of LIVING PAINTINGS. */
  fxBreath: boolean;
  /** KO COLLAPSE, a part of LIVING PAINTINGS. */
  fxKo: boolean;
  /** CHAPTER FRAMING, a part of BATTLE SPECTACLE. */
  fxFraming: boolean;
  /** OVERDRIVE SHOT, a part of BATTLE SPECTACLE. FFX only. */
  fxHero: boolean;
  /** DRESSPHERE SHOT, a part of BATTLE SPECTACLE. FFX-2 only. */
  fxSphere: boolean;
  /** SPLASH ART, a part of BATTLE SPECTACLE. */
  fxSplash: boolean;
}

export type FxPartField = keyof FxPartSettings;
/** One of the twelve saved switches: a look or a part. */
export type FxSwitchField = FxLookField | FxPartField;
/** Which game draws a switch; the other game's page leaves its row out. */
export type FxSwitchGame = 'both' | 'ffx' | 'ffx2';

export interface FxPart {
  field: FxPartField;
  /** The look that is this part's master. */
  look: FxLookField;
  /** Its key on the `eyeCandyFlags.ts` seam. */
  key: EyeCandyKey;
  label: string;
  game: FxSwitchGame;
}

/** The nine parts, grouped under their looks in page order. */
export const FX_PARTS: readonly FxPart[] = [
  { field: 'fxDof', look: 'fxLight', key: 'depthOfField', label: 'DEPTH OF FIELD', game: 'both' },
  { field: 'fxFog', look: 'fxLight', key: 'fog', label: 'FOG', game: 'both' },
  { field: 'fxEdges', look: 'fxLight', key: 'smoothEdges', label: 'SMOOTH EDGES', game: 'both' },
  { field: 'fxBreath', look: 'fxLiving', key: 'breathing', label: 'BREATHING', game: 'both' },
  { field: 'fxKo', look: 'fxLiving', key: 'koCollapse', label: 'KO COLLAPSE', game: 'both' },
  { field: 'fxFraming', look: 'fxSpectacle', key: 'chapterFraming', label: 'CHAPTER FRAMING', game: 'both' },
  { field: 'fxHero', look: 'fxSpectacle', key: 'overdriveShot', label: 'OVERDRIVE SHOT', game: 'ffx' },
  { field: 'fxSphere', look: 'fxSpectacle', key: 'dressphereShot', label: 'DRESSPHERE SHOT', game: 'ffx2' },
  { field: 'fxSplash', look: 'fxSpectacle', key: 'splashArt', label: 'SPLASH ART', game: 'both' },
];

/** The twelve saved switches: the three looks, then the nine parts. */
export const FX_SWITCH_FIELDS: readonly FxSwitchField[] = [...FX_LOOK_ROWS.map((r) => r.field), ...FX_PARTS.map((p) => p.field)];

/** Every key of the `eyeCandyFlags.ts` seam, in the same order. */
export const EYE_CANDY_KEYS: readonly EyeCandyKey[] = [...FX_LOOK_ROWS.map((r) => r.key), ...FX_PARTS.map((p) => p.key)];

/** Every part on: a new profile. */
export function defaultFxParts(): FxPartSettings {
  return { fxDof: true, fxFog: true, fxEdges: true, fxBreath: true, fxKo: true, fxFraming: true, fxHero: true, fxSphere: true, fxSplash: true };
}

export function isFxPartField(id: string): id is FxPartField {
  return FX_PARTS.some((p) => p.field === id);
}

/** True for any of the twelve switch ids (a look or a part). */
export function isFxSwitchField(id: string): id is FxSwitchField {
  return isFxPartField(id) || FX_LOOK_ROWS.some((r) => r.field === id);
}

type SwitchValues = Readonly<Partial<Record<FxSwitchField, unknown>>>;

/**
 * The upgrade (D-317), in place on `settings` (already merged over the defaults, its looks already
 * coerced by `migrateFxLooks`). `raw` is the stored blob's own settings: a part it holds as a boolean
 * is kept; a part it lacks (a save from release 35 or older) or holds as anything else (CHK-024) takes
 * its look's value, so a look the player had OFF brings its new parts in OFF.
 */
export function migrateFxParts(settings: Partial<Record<FxSwitchField, unknown>>, raw: unknown): void {
  const stored = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  for (const p of FX_PARTS) {
    const v = stored[p.field];
    settings[p.field] = typeof v === 'boolean' ? v : settings[p.look] !== false;
  }
}

/** A switch's own stored value; anything but an explicit `false` reads as ON. */
export function fxOwnValue(settings: SwitchValues, field: FxSwitchField): boolean {
  return settings[field] !== false;
}

const partOf = (field: FxSwitchField): FxPart | undefined => FX_PARTS.find((p) => p.field === field);

/** True while a switch plays: a look by its own value, a part only while its look is ON as well. */
export function fxSwitchOn(settings: SwitchValues, field: FxSwitchField): boolean {
  const part = partOf(field);
  return fxOwnValue(settings, field) && (!part || fxOwnValue(settings, part.look));
}

/** True when the switch's look is OFF: the part keeps its own value and is drawn dim. */
export function fxStoppedByLook(settings: SwitchValues, field: FxSwitchField): boolean {
  const part = partOf(field);
  return !!part && !fxOwnValue(settings, part.look);
}

/** The settings field behind a seam key. */
export function fxFieldOfKey(key: EyeCandyKey): FxSwitchField | undefined {
  return FX_LOOK_ROWS.find((r) => r.key === key)?.field ?? FX_PARTS.find((p) => p.key === key)?.field;
}

/**
 * The seam's provider for these settings (`setEyeCandyProvider`): a look key answers the look, a part key
 * answers look AND part; a key it does not know answers ON (the seam's own default). The twelve values
 * are copied now, so a later write to the settings object reaches the seam only through the next install.
 */
export function eyeCandyProviderFor(settings: SwitchValues): (key: EyeCandyKey) => boolean {
  const own: Partial<Record<FxSwitchField, boolean>> = {};
  for (const f of FX_SWITCH_FIELDS) own[f] = fxOwnValue(settings, f);
  return (key) => {
    const field = fxFieldOfKey(key);
    return field === undefined || fxSwitchOn(own, field);
  };
}

/** One switch as the EYE CANDY page lists it. */
export interface FxSwitchRow {
  field: FxSwitchField;
  label: string;
  /** A look (the master of the parts listed under it) or one of its parts. */
  kind: 'look' | 'part';
  look: FxLookField;
  game: FxSwitchGame;
}

/** The switches one game's page shows, each look followed by its parts: 11 for FFX and FFX-2, none for FF7. */
export function fxSwitchesFor(game: GameId): FxSwitchRow[] {
  if (game === 'ff7') return [];
  const rows: FxSwitchRow[] = [];
  for (const look of FX_LOOK_ROWS) {
    rows.push({ field: look.field, label: look.label, kind: 'look', look: look.field, game: 'both' });
    for (const p of FX_PARTS) {
      if (p.look === look.field && (p.game === 'both' || p.game === game)) {
        rows.push({ field: p.field, label: p.label, kind: 'part', look: p.look, game: p.game });
      }
    }
  }
  return rows;
}

/** How many of one game's switches play right now, of how many it shows. */
export function fxCount(settings: SwitchValues, game: GameId): { on: number; of: number } {
  const rows = fxSwitchesFor(game);
  return { on: rows.filter((r) => fxSwitchOn(settings, r.field)).length, of: rows.length };
}

export type FxAllState = 'ALL ON' | 'ALL OFF' | 'MIXED';

/** The ALL LOOKS row: every switch playing, none, or some. */
export function fxAllState(settings: SwitchValues, game: GameId): FxAllState {
  const { on, of } = fxCount(settings, game);
  return on === of ? 'ALL ON' : on === 0 ? 'ALL OFF' : 'MIXED';
}

/** The OPTIONS tab's EYE CANDY row: ALL ON, ALL OFF or `n OF 11`. */
export function fxSummary(settings: SwitchValues, game: GameId): string {
  const state = fxAllState(settings, game);
  if (state !== 'MIXED') return state;
  const { on, of } = fxCount(settings, game);
  return `${on} OF ${of}`;
}

/** ALL ON: every look and every part, both games' shots included. */
export function fxAllOnPatch(): FxLookSettings & FxPartSettings {
  return { fxLight: true, fxLiving: true, fxSpectacle: true, ...defaultFxParts() };
}

/** ALL OFF: the three looks, which stop every part; each part keeps its own value for when its look returns. */
export function fxAllOffPatch(): FxLookSettings {
  return { fxLight: false, fxLiving: false, fxSpectacle: false };
}
