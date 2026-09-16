/**
 * Late binding for the modules other agents are writing right now.
 *
 * `src/battle/ffx`, `src/battle/ffx2`, `src/story/runner` and the two HUDs land
 * on their own schedules. A static `import` of a file that does not exist fails
 * the whole build, so instead we use Vite's `import.meta.glob`, which resolves
 * at build time to **only the files that actually exist** and returns lazy
 * loaders. Nothing is imported until a battle asks for it, and the day an agent
 * lands their module it is picked up with no edit here.
 *
 * Each `find*` returns `null` when the module is not there yet; the caller
 * degrades (scripted fake engine, no HUD, skipped cutscene) instead of throwing.
 */

import type {
  BattleEngine,
  BattleSetup,
  GameId,
} from '../../battle/common/types.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import { FFXEngine } from '../../battle/ffx/index.ts';
import { FFX2Engine } from '../../battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from './BattleScreenContent.ts';

type Loader = () => Promise<Record<string, unknown>>;

/** Every module under `src/ui/<game>/`. */
const uiModules = import.meta.glob('../../ui/*/*.ts') as Record<string, Loader>;

/** Duck-type: does this object implement {@link HudPort}? */
function isHud(v: unknown): v is HudPort {
  const o = v as Partial<HudPort> | null;
  return (
    !!o &&
    typeof o.mount === 'function' &&
    typeof o.sync === 'function' &&
    typeof o.chooseCommand === 'function'
  );
}

/**
 * Try every export of a module as a factory, a class, or an instance, and
 * return the first one that quacks right.
 */
function instantiate<T>(mod: Record<string, unknown>, accept: (v: unknown) => v is T): T | null {
  // Prefer explicitly-named factories before trying the classes.
  const preferred = Object.keys(mod).filter((k) => /^(create|make|new|default)/i.test(k));
  const keys = [...new Set([...preferred, ...Object.keys(mod)])];

  for (const key of keys) {
    const exported = mod[key];
    if (accept(exported)) return exported;
    if (typeof exported !== 'function') continue;
    // Only call things shaped like a factory or a class. Calling every
    // exported helper with no arguments would be a fine way to trip a
    // neighbouring agent's module over on import.
    if (!/^(create|make|new|default)/i.test(key) && !/^[A-Z]/.test(key)) continue;
    // A plain factory.
    try {
      const made = (exported as () => unknown)();
      if (accept(made)) return made;
    } catch {
      /* not a zero-arg factory; try it as a constructor */
    }
    try {
      const made = new (exported as new () => unknown)();
      if (accept(made)) return made;
    } catch {
      /* not a zero-arg constructor either; move on */
    }
  }
  return null;
}

function modulesUnder(all: Record<string, Loader>, dir: string): Loader[] {
  return Object.entries(all)
    .filter(([path]) => path.includes(`/${dir}/`))
    .sort(([a], [b]) => score(b) - score(a) || a.localeCompare(b))
    .map(([, load]) => load);
}

/** Look at the likeliest filenames first: `index`, then `*engine*`, then rest. */
function score(path: string): number {
  const file = path.slice(path.lastIndexOf('/') + 1).toLowerCase();
  if (file === 'index.ts') return 3;
  if (file.includes('engine')) return 2;
  if (file.includes('battle') || file.includes('hud')) return 1;
  return 0;
}

// ---------------------------------------------------------------- engines

/**
 * A fresh engine for a game, with its content registries populated.
 *
 * Both engines are real modules now, so this is a plain construction rather
 * than the duck-typed probing the HUDs still need. The
 * {@link registerBattleContent} call is the important half: without it the FFX
 * engine resolves against its four structural `CORE_ABILITIES` and nothing
 * else, so no spell, item or Overdrive exists and a boss can only auto-attack.
 */
export async function createEngine(game: GameId, setup: BattleSetup): Promise<BattleEngine | null> {
  await registerBattleContent();
  // A used engine holds a finished battle's state, so every battle gets its own.
  const engine: BattleEngine =
    game === 'ffx' ? new FFXEngine() : new FFX2Engine(ffx2EngineOptions());
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/**
 * True once a real engine exists for `game`.
 *
 * Both do, always — kept because the e2e specs gate their skip messages on it
 * and because a future game would slot in here.
 */
export async function hasEngine(game: GameId): Promise<boolean> {
  await registerBattleContent();
  return game === 'ffx' || game === 'ffx2';
}

// -------------------------------------------------------------------- HUD

/** The HUD for a game, or `null` while `src/ui/<game>` is being written. */
export async function findHud(game: GameId): Promise<HudPort | null> {
  const dir = game === 'ffx' ? 'ffx' : 'ffx2';
  for (const load of modulesUnder(uiModules, dir)) {
    let mod: Record<string, unknown>;
    try {
      mod = await load();
    } catch (err) {
      console.warn(`[wiring] a module under ui/${dir} failed to load`, err);
      continue;
    }
    const hud = instantiate(mod, isHud);
    if (hud) return hud;
  }
  return null;
}

// --------------------------------------------------------- cutscene runner

/**
 * Mid-battle cutscenes are built per battle, not discovered.
 *
 * `CutsceneRunner` needs a `CutscenePorts` bundle bound to the live field, so
 * only the battle screen can construct one — see `BattleScreenCutscenes.ts`.
 * Nothing here has to probe for it, and `wiringReport()` can state plainly
 * that a runner is available.
 */
export { createMidBattleCutscenes } from './BattleScreenCutscenes.ts';
export type { MidBattleCutscenes } from './BattleScreenCutscenes.ts';

/**
 * What is wired up right now. Surfaced by `__pyrefly.wiring()`.
 *
 * The **counts** are the point. An engine can be present and a battle can look
 * fine while every ability table is unregistered — which is exactly the state
 * this project shipped in until the content wiring landed — and a boolean
 * cannot tell you that. `abilitiesFfx: 0` can.
 */
export async function wiringReport(): Promise<Record<string, boolean | number | string>> {
  const content = await registerBattleContent();
  return {
    engineFfx: true,
    engineFfx2: true,
    hudFfx: (await findHud('ffx')) !== null,
    hudFfx2: (await findHud('ffx2')) !== null,
    cutsceneRunner: true,
    ...content,
  };
}
