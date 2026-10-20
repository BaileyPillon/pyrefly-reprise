/**
 * Demo looks: the page's switch state, read once from the address (`?look=`, `?lookq=`, `?lookdebug=`) and changed at run time by the live keys (`F6` looks, `F7`
 * quality, `F8` subtle / bold) and `__pyrefly.look`. No DOM, no `three`. A look is a dev flag: with no `look` key in the address nothing here is armed and the renderer never builds
 * the rig. Both games.
 */
import type { GradeRecipe } from './LookGrades.ts';
import { LOOK_QUALITIES, nextLook, nextQuality, parseLook, type LookDebug, type LookName, type LookQuality, type LookStrength } from './LookConfig.ts';

export interface LookStateShape {
  /** The address carried a `look` key: the rig exists and the live keys are armed. */
  armed: boolean;
  name: LookName | null;
  quality: LookQuality;
  debug: LookDebug;
  /** `?lookstrength=bold` (F8 flips it live): the conference strength of hd2d and cinematic. */
  strength: LookStrength;
  /** `?lookdrift=1`: the backdrop's slow idle drift is allowed. */
  drift: boolean;
  /** A command menu is open (polled by `debug/lookApi.ts`): the drift stands still while the player chooses. */
  commandOpen: boolean;
  /** A live override of the grade recipe for tuning and captures (`__pyrefly.look.recipe`): null = the tables'. */
  recipe: Partial<GradeRecipe> | null;
  /** Bumped on every change, so the rig knows to reconfigure. */
  version: number;
  /** A per-look number override for captures and tuning (`__pyrefly.look.param`). */
  tweaks: Record<string, number>;
}

export const lookState: LookStateShape = (() => {
  const r = parseLook(typeof location === 'undefined' ? '' : location.search);
  return { armed: r.armed, name: r.name, quality: r.quality, debug: r.debug, strength: r.strength, drift: r.drift, commandOpen: false, recipe: null, version: 1, tweaks: {} };
})();

/** True when the renderer should build the rig now: the address armed it, or a look was switched on later. */
export function lookWanted(): boolean {
  return lookState.armed || lookState.name !== null;
}

export function setLookName(name: LookName | null): void {
  lookState.name = name;
  lookState.armed = true;
  lookState.version++;
}

export function setLookQuality(q: LookQuality): void {
  if (!(LOOK_QUALITIES as readonly string[]).includes(q)) return;
  lookState.quality = q;
  lookState.version++;
}

export function setLookStrength(s: LookStrength): void {
  lookState.strength = s === 'bold' ? 'bold' : 'subtle';
  lookState.version++;
}

export function setLookRecipe(p: Partial<GradeRecipe> | null): void {
  lookState.recipe = p && Object.keys(p).length ? p : null;
  lookState.version++;
}

export function setLookDebug(d: LookDebug): void {
  lookState.debug = d;
  lookState.version++;
}

export function setLookTweak(name: string, v: number | null): void {
  if (v === null) delete lookState.tweaks[name];
  else if (Number.isFinite(v)) lookState.tweaks[name] = v;
  lookState.version++;
}

/** Install the live keys once: `F6` cycles off / hd2d / cinematic / anime, `F7` cycles the quality. Only while the address armed the rig. */
export function installLookKeys(target: Pick<Window, 'addEventListener'>): void {
  if (!lookState.armed) return;
  target.addEventListener('keydown', (ev) => {
    const e = ev as KeyboardEvent;
    if (e.key === 'F6') {
      setLookName(nextLook(lookState.name));
      e.preventDefault();
    } else if (e.key === 'F7') {
      setLookQuality(nextQuality(lookState.quality));
      e.preventDefault();
    } else if (e.key === 'F8') {
      setLookStrength(lookState.strength === 'bold' ? 'subtle' : 'bold');
      e.preventDefault();
    }
  });
}
