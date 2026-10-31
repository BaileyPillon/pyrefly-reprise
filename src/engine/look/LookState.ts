/**
 * Demo looks: the page's switch state, read once from the address (`?look=`, `?lookq=`, `?lookdebug=`) and changed at run time by the live keys (`F6` looks, `F7`
 * quality, `F8` subtle / bold) and `__pyrefly.look`. No DOM, no `three`. A look is a dev flag: with no `look` key in the address nothing here is armed and the renderer never builds
 * the rig. Both games.
 */
import type { GradeRecipe } from './LookGrades.ts';
import { onProChange, proArenaFor } from './pro/ProSwitch.ts';
import { setSkyRunning } from './pro/SkyGrade.ts';
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
  /** Lane pro-look: the chapter's look is the PRO arena (`look/pro/ProGrade.ts`, "Cinematic contrast"): cinematic at bold strength with the room's pro grade. Set only by {@link applyChapterLook}; false everywhere else, and false again the moment anything sets a look by hand. */
  pro: boolean;
}

export const lookState: LookStateShape = (() => {
  const r = parseLook(typeof location === 'undefined' ? '' : location.search);
  return { armed: r.armed, auto: r.auto, name: r.name, quality: r.quality, debug: r.debug, strength: r.strength, drift: r.drift, commandOpen: false, recipe: null, version: 1, tweaks: {}, pro: false };
})();

/** True when the renderer should build the rig now: the address armed it, or a look was switched on later. */
export function lookWanted(): boolean {
  return lookState.armed || lookState.name !== null;
}

export function setLookName(name: LookName | null): void {
  lookState.name = name;
  lookState.pro = false;
  lookState.armed = true;
  lookState.auto = false; // a look set by hand (the console, a key) is the player's word for the rest of the page
  lookState.version++;
}

/**
 * Release 60: the battle screen tells the look which chapter it is about to draw, before the figures load. With no `look` key in the address (and nothing set by hand) a chapter that has a default
 * ({@link chapterLook}: hd2d at bold strength in Chapters I and IV) turns it on, and every other chapter turns it off, so only those two chapters change. With a `look` key the address already chose and
 * this does nothing. Not armed means no relight define and no rig work: a chapter without a default draws as it did.
 *
 * Release 61 (Bailey, 2026-10-21; the OPTIONS row VISUAL STYLE, `app/saveVisualStyle.ts`): `style` is the player's choice. `'classic'` takes the chapters' defaults away, so every chapter draws today's frame, as `?look=off`
 * does; `'hd2d'` (the default) is release 60's behaviour. An address `look` key still wins: it makes `lookState.auto` false, and this returns before it reads `style`. Both games.
 */
export function applyChapterLook(chapterId: string | undefined, style: 'hd2d' | 'classic' = 'hd2d'): void {
  lastChapter = { id: chapterId, style };
  if (!lookState.auto) return;
  setSkyRunning(style === 'classic' ? undefined : chapterId); // the measuring word's patch of the Farplane rooms applies only while Chapter V or XI is the chapter and the player's style allows a look (`pro/SkyGrade.ts`)
  let d = style === 'classic' ? null : chapterLook(chapterId);
  // lane pro-look: the PRO arena ("Cinematic contrast", both demo chapters, each graded from its own painting) takes the chapter's place: cinematic at bold strength with the room's pro grade.
  // Not under CLASSIC (the player's word), not in any other chapter, not when the address chose a look; off by default (`look/pro/ProSwitch.ts`).
  const pro = d !== null && proArenaFor(chapterId);
  if (pro) d = { name: 'cinematic', strength: 'bold' };
  const name = d?.name ?? null;
  const strength = d?.strength ?? 'subtle';
  const armed = d !== null;
  if (lookState.name === name && lookState.strength === strength && lookState.armed === armed && lookState.pro === pro) return;
  lookState.name = name;
  lookState.strength = strength;
  lookState.armed = armed;
  lookState.pro = pro;
  lookState.version++;
}

let lastChapter: { id: string | undefined; style: 'hd2d' | 'classic' } | null = null;

/** The pro switch flipped at run time (the switchboard, the console): read the chapter's look again, as the battle did when it set up. */
export function reapplyChapterLook(): void {
  if (lastChapter) applyChapterLook(lastChapter.id, lastChapter.style);
}
onProChange(reapplyChapterLook);

export function setLookQuality(q: LookQuality): void {
  if (!(LOOK_QUALITIES as readonly string[]).includes(q)) return;
  lookState.quality = q;
  lookState.version++;
}

export function setLookStrength(s: LookStrength): void {
  lookState.auto = false;
  lookState.pro = false;
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
