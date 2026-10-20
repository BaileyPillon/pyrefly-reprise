/**
 * Demo looks: the page's switch state, read once from the address (`?look=`, `?lookq=`, `?lookdebug=`) and changed at run time by the live keys (`F6` looks, `F7`
 * quality, `F8` subtle / bold) and `__pyrefly.look`. No DOM, no `three`. A look is a dev flag: with no `look` key in the address nothing here is armed and the renderer never builds
 * the rig. Both games.
 */
import type { GradeRecipe } from './LookGrades.ts';
import { LOOK_QUALITIES, chapterLook, nextLook, nextQuality, parseLook, type LookDebug, type LookName, type LookQuality, type LookStrength } from './LookConfig.ts';

export interface LookStateShape {
  /** The address carried a `look` key: the rig exists and the live keys are armed. (Release 60: also true while an automatic chapter look is on, so the figures bind their maps.) */
  armed: boolean;
  /** Release 60: no `look` key in the address and nobody has set a look by hand since: each chapter plays its own default look ({@link applyChapterLook}). */
  auto: boolean;
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
  return { armed: r.armed, auto: r.auto, name: r.name, quality: r.quality, debug: r.debug, strength: r.strength, drift: r.drift, commandOpen: false, recipe: null, version: 1, tweaks: {} };
})();

/** True when the renderer should build the rig now: the address armed it, or a look was switched on later. */
export function lookWanted(): boolean {
  return lookState.armed || lookState.name !== null;
}

export function setLookName(name: LookName | null): void {
  lookState.name = name;
  lookState.armed = true;
  lookState.auto = false; // a look set by hand (the console, a key) is the player's word for the rest of the page
  lookState.version++;
}

/**
 * Release 60: the battle screen tells the look which chapter it is about to draw, before the figures load. With no `look` key in the address (and nothing set by hand) a chapter that has a default
 * ({@link chapterLook}: hd2d at bold strength in Chapters I and IV) turns it on, and every other chapter turns it off, so only those two chapters change. With a `look` key the address already chose and
 * this does nothing. Not armed means no relight define and no rig work: a chapter without a default draws as it did.
 */
export function applyChapterLook(chapterId: string | undefined): void {
  if (!lookState.auto) return;
  const d = chapterLook(chapterId);
  const name = d?.name ?? null;
  const strength = d?.strength ?? 'subtle';
  const armed = d !== null;
  if (lookState.name === name && lookState.strength === strength && lookState.armed === armed) return;
  lookState.name = name;
  lookState.strength = strength;
  lookState.armed = armed;
  lookState.version++;
}

export function setLookQuality(q: LookQuality): void {
  if (!(LOOK_QUALITIES as readonly string[]).includes(q)) return;
  lookState.quality = q;
  lookState.version++;
}

export function setLookStrength(s: LookStrength): void {
  lookState.auto = false;
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
