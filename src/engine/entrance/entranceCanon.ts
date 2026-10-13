/**
 * **Whose entrance is made of pyreflies** (pure: no `three`, no DOM).
 *
 * E-PYRE is the gather of pyreflies into a body, so it is only right for a body that is made of them. `research/ffx-vs-ffx2-presentation.md` §3.1
 * gives the classes, the same in both games: fiends are spirits that use pyreflies to hold a shape; the **unsent** have their body **reconstructed**
 * by pyreflies (Seymour Flux, Yunalesca, Shuyin imprinted with despair); aeons are dreams of the fayth. **Machina** are machines, "not spirits. No
 * pyreflies", and **living humans** "lose and the scene continues. Nothing dissolves". §3.2 names who is which, and the departures table
 * (`BattlePresenterDepartures.ts`) already encodes it for the way out: the figures that leave by `'yields'` (Leblanc, Logos, Ormi, the Guado Guardians,
 * "living people who walk off") or `'body'` (the living Seymour of Macalania, who "dies and leaves a body") are people, and the goons are listed beside them
 * (`NEVER_PYREFLIES`). The way in follows the way out: whoever the game does not dissolve into pyreflies is not gathered out of them, and arrives with the
 * plain 300 ms fade (E-FADE, the fallback decision 61e names). Everyone else, which is every fiend, unsent and aeon, and the Sin of both chapters, gathers.
 *
 * It is the combatant that decides, never the room: the Fahrenheit's deck has "Open sky. Nothing pyrefly-like" for its air (`pyreflyCanon.ts`), and
 * Overdrive Sin gathers there all the same, because the pyreflies are his body, as the death's are (the stage releases a dissolving fiend's whatever the
 * scene's verdict); Bailey's pick was made on Sin on that deck. FF7 is not Spira (`pyreflyCanon.ts`, row `sector1-reactor`): the stage does not run this there.
 *
 * Game case: **both**. The rule is the same in the two games (§3.1, "Same" in every row but the aeons, which FFX-2 has only as the possessed ones); the ids
 * below are each their own game's.
 */

import type { CombatantId } from '../../battle/common/types.ts';
import { departureKindOf } from '../BattlePresenterDepartures.ts';
import { NEVER_PYREFLIES } from '../pyreflyCanon.ts';
import type { EntranceBody } from './entranceLook.ts';

/**
 * Machina, by the start of their combatant id: Vegnagun and its four parts (FFX-2, Chapter V; "Vegnagun and its parts are machina",
 * §3.1; the Farplane row of §3.2 lists pyreflies under "Do NOT" for them).
 */
export const MACHINA_ID_PREFIXES: readonly string[] = ['vegnagun'];

/**
 * Vegnagun's own parts, which stand on its painting by their scene's anchors and so have no figure of their own to bring in (`PartAnchors.ts`; D-044): the Leg's three
 * Nodes, the Body's two Bulwarks, the Head's two Redoubts. They are machina like the machine they are part of.
 */
export const MACHINA_IDS: ReadonlySet<CombatantId> = new Set(['node-a', 'node-b', 'node-c', 'bulwark-l', 'bulwark-r', 'redoubt-l', 'redoubt-r']);

/** The Fahrenheit's pilot, a living person (FFX Chapters VIII and XVII). The airship hook never draws him (`BattleScreenAirship.ts`), so he has no entrance; if he were drawn he would fade. */
export const PEOPLE_IDS: ReadonlySet<CombatantId> = new Set(['cid']);

/** The two departure kinds whose figures are living people (see the module note). */
const PEOPLE_DEPARTURES: ReadonlySet<string> = new Set(['yields', 'body']);

/** True for a figure whose body is not made of pyreflies: a living person or a machine. */
export function isPlainBody(id: CombatantId): boolean {
  return (
    NEVER_PYREFLIES.has(id) ||
    PEOPLE_IDS.has(id) ||
    MACHINA_IDS.has(id) ||
    PEOPLE_DEPARTURES.has(departureKindOf(id)) ||
    MACHINA_ID_PREFIXES.some((p) => id.startsWith(p))
  );
}

/**
 * Figures whose entrance their scene already stages, and stages better: Chapter IX's night-sakura arrival (D-072, `scenes/cavern-stolen-fayth.ts` `runArrival`) holds Yojimbo and Daigoro
 * off the field until the opening shot, then fades them in over the petals and walks Yojimbo out from the tree (`cavern-stolen-fayth-arrival.ts`). The stage leaves them to it: a second entrance
 * over the scene's would set their opacity against its own every frame. FFX only: Yojimbo is Chapter IX's.
 */
export const SCENE_STAGED_ENTRANCE: ReadonlySet<CombatantId> = new Set(['yojimbo', 'daigoro']);

export function sceneStagesEntrance(id: CombatantId): boolean {
  return SCENE_STAGED_ENTRANCE.has(id);
}

/** What an entrance of this figure is made of: `'pyrefly'` gathers (E-PYRE), `'plain'` fades (E-FADE). */
export function entranceBodyOf(id: CombatantId): EntranceBody {
  return isPlainBody(id) ? 'plain' : 'pyrefly';
}
