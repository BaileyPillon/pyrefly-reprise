/**
 * CAMERA LAB: the flag and the live switches.
 *
 * - `?camera=lab` (or the lab bundle's entry, which sets {@link FORCE_KEY} before the game
 *   boots) opens the lab panel instead of the title. Without it {@link cameraLabRequested} is
 *   false, nothing in `src/engine/lab/` or `src/ui/lab/` is constructed, and the game is today's.
 * - The panel arms the next battle ({@link armLabBattle}); "Play today's version" starts the
 *   same chapter with the lab disarmed.
 * - The switches persist per browser as a convenience only: every storage call is guarded,
 *   so a page whose storage throws still runs with the defaults.
 *
 * No `three`, no DOM beyond `location` and `localStorage`, both read defensively.
 */

import { DEFAULT_LAB_SWITCHES, type LabChapterId, type LabSwitches } from './LabTypes.ts';

/** The lab bundle's entry sets this on `globalThis` before `main.ts` runs. */
export const FORCE_KEY = '__pyreflyCameraLab';
const STORE_KEY = 'pyrefly-camera-lab:v1';

let requested: boolean | null = null;

/** True when this page load is the camera lab (`?camera=lab`, or the lab bundle). */
export function cameraLabRequested(): boolean {
  if (requested !== null) return requested;
  let on = false;
  try {
    on = (globalThis as Record<string, unknown>)[FORCE_KEY] === true;
    if (!on) on = new URLSearchParams(globalThis.location?.search ?? '').get('camera') === 'lab';
  } catch {
    on = false;
  }
  requested = on;
  return on;
}

/** Tests only: forget the cached answer. */
export function resetCameraLabFlag(): void {
  requested = null;
}

type Listener = (sw: Readonly<LabSwitches>) => void;

interface Stored {
  chapter?: string;
  switches?: Partial<LabSwitches>;
}

function readStore(): Stored {
  try {
    const raw = globalThis.localStorage?.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : {};
  } catch {
    return {};
  }
}

function writeStore(s: Stored): void {
  try {
    globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* storage is a convenience: a throwing store keeps the defaults */
  }
}

function clean(sw: Partial<LabSwitches> | undefined): LabSwitches {
  const d = DEFAULT_LAB_SWITCHES;
  return {
    style: sw?.style === 'clair' || sw?.style === 'persona' ? sw.style : d.style,
    views: typeof sw?.views === 'boolean' ? sw.views : d.views,
    menuAtHero: typeof sw?.menuAtHero === 'boolean' ? sw.menuAtHero : d.menuAtHero,
    targetCut: typeof sw?.targetCut === 'boolean' ? sw.targetCut : d.targetCut,
  };
}

/** The lab's state for this page: the chapter picked, the switches, and whether the next battle is a lab battle. */
class LabSessionStore {
  private sw: LabSwitches;
  chapter: LabChapterId;
  /** Set by the panel's START, cleared by "Play today's version". */
  private armed: LabChapterId | null = null;
  private readonly listeners = new Set<Listener>();

  constructor() {
    const s = readStore();
    this.sw = clean(s.switches);
    this.chapter = s.chapter === 'ffx2-bahamut' ? 'ffx2-bahamut' : 'seymour-flux';
  }

  get switches(): Readonly<LabSwitches> {
    return this.sw;
  }

  set(patch: Partial<LabSwitches>): void {
    this.sw = clean({ ...this.sw, ...patch });
    this.save();
    for (const l of this.listeners) {
      try {
        l(this.sw);
      } catch (err) {
        console.warn('[camera-lab] switch listener threw', err);
      }
    }
  }

  setChapter(id: LabChapterId): void {
    this.chapter = id;
    this.save();
  }

  onChange(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  arm(id: LabChapterId | null): void {
    this.armed = id;
  }

  /** Is the battle about to start for `chapterId` a lab battle? */
  armedFor(chapterId: string): boolean {
    return cameraLabRequested() && this.armed === chapterId;
  }

  private save(): void {
    writeStore({ chapter: this.chapter, switches: this.sw });
  }
}

let store: LabSessionStore | null = null;

/** The page's lab session (constructed on first use, which only the lab's own code makes). */
export function labSession(): LabSessionStore {
  return (store ??= new LabSessionStore());
}

/** Arm (or, with null, disarm) the next battle for the lab. */
export function armLabBattle(id: LabChapterId | null): void {
  labSession().arm(id);
}

/**
 * The battle screen's one question: is this battle a lab battle? False without the flag, and
 * then nothing of the lab is built (the session is not even constructed).
 */
export function cameraLabForBattle(chapterId: string): boolean {
  if (!cameraLabRequested()) return false;
  return labSession().armedFor(chapterId);
}
