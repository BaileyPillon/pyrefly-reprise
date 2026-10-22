/**
 * Which new effect a boss move, a charge beat, an Overdrive's opening or a dress change draws (motion pass, lane "fx", step 3; Bailey 2026-10-22: "spell effects ... PLUS the bosses' attacks ... Overdrives (with
 * 'Each game's own intro')", "Demo chapters first"; `FxSwitch.ts`). The tables below are read only while the new effects are on in a demo chapter (`SpellFxLayer.resolve`): with the switch off nothing here
 * is consulted and every ability resolves exactly as it did (`SpellFxLookup.resolveAbilityFx`).
 *
 * Game case (AGENTS.md rule 14): each table row is keyed by game and says in its comment which game's move it is. Chapter I's foes are FFX's (Seymour Flux and Mortiorchis), Chapter IV's foe is FFX-2's
 * (Bahamut); an FFX id never resolves in an FFX-2 chapter and the other way round. **No research file and no official video shows any of these moves** (`docs/handoff/motion-fx-reference.md` sections 2.6
 * and 3.5: every shape is [gap]); what the sources give is who is hit, how often, in what order and in what colour family (Curse darkens the model, the dark family's black spheres and violet lightning from
 * FFX-2's Darkness footage, the Total Annihilation charge ladder), and that is all the draw functions build on. Every shape is [ours] and is marked so in the draw files.
 *
 * Pure: no `three`, no DOM.
 */

import type { BuffFxId, FxGame } from './SpellFxRegistry.ts';

/**
 * The new-only ids of this step. `gather`, `odaura` and `dress` are not abilities: the presenter asks for them by the pseudo ability ids below when a boss charges, an Overdrive opens and a girl
 * changes dress.
 */
export type BossFxId =
  | 'atrophy' // Lance of Atrophy, FFX: Seymour Flux
  | 'fulllife' // Full-Life, FFX: Mortiorchis
  | 'cleave' // Cross Cleave, FFX: Mortiorchis
  | 'annihilate' // Total Annihilation, FFX: Mortiorchis
  | 'flare' // Flare, FFX: Seymour Flux
  | 'banish' // Banish, FFX: Seymour Flux
  | 'slowga' // Slowga (counter), FFX: Mortiorchis
  | 'drain' // Mortibsorption, FFX: Mortiorchis into Seymour Flux
  | 'curse' // Curse, FFX-2: Bahamut
  | 'impulse' // Impulse, FFX-2: Bahamut
  | 'gather' // a boss charging (FFX: the Total Annihilation ladder; FFX-2: Bahamut's countdown)
  | 'odaura' // an Overdrive's ready aura (FFX only: Chapter I)
  | 'jump' // Kimahri's Jump landing (FFX only)
  | 'dress' // a dress change's painted burst (FFX-2 only)
  | 'darkness'; // Rikku's Darkness (FFX-2 only: the one Chapter IV ability with a sourced shape)

export const BOSS_FX_IDS: readonly BossFxId[] = ['atrophy', 'fulllife', 'cleave', 'annihilate', 'flare', 'banish', 'slowga', 'drain', 'curse', 'impulse', 'gather', 'odaura', 'jump', 'dress', 'darkness'];

/** The pseudo ability ids the presenter lands for beats that are not an ability (`BattlePresenterBossFx.ts`). */
export const PSEUDO_FX = Object.freeze({ gather: 'fx:gather', odaura: 'fx:odaura', dress: 'fx:dress' } as const);

type Table = Readonly<Record<string, BossFxId | BuffFxId>>;

/**
 * Ability id to effect, per game. FFX-2's boss rows are keyed by both ids the engine can use: the data table's `x2-bahamut-*` and the engine's own fallback table's (`battle/ffx2/abilities-core.ts`:
 * `bahamut-curse`, `impulse`, `mega-flare`), because the script (`ai/bahamut.ts`) casts the fallback ids.
 */
export const BOSS_FX_TABLE: Readonly<Record<'ffx' | 'ffx2', Table>> = Object.freeze({
  ffx: Object.freeze({
    'lance-of-atrophy': 'atrophy',
    'full-life': 'fulllife',
    'cross-cleave': 'cleave',
    'total-annihilation': 'annihilate',
    'flare-self': 'flare',
    banish: 'banish',
    'slowga-counter': 'slowga',
    mortibsorption: 'drain',
    jump: 'jump', // Kimahri's Overdrive (`src/data/ffx/abilities/overdrive-kimahri-1.ts`)
    'mighty-guard': 'protect', // Kimahri's Overdrive: Protect, Shell and the four Nul statuses on the party (`overdrive-kimahri-2.ts`); it draws Protect's dome, once, on the first status
    [PSEUDO_FX.gather]: 'gather',
    [PSEUDO_FX.odaura]: 'odaura',
  }),
  ffx2: Object.freeze({
    'bahamut-curse': 'curse',
    'x2-bahamut-curse': 'curse',
    impulse: 'impulse',
    'x2-bahamut-impulse': 'impulse',
    'bahamut-countdown': 'gather',
    'x2-bahamut-countdown': 'gather',
    'x2-dark-knight-darkness': 'darkness',
    [PSEUDO_FX.gather]: 'gather',
    [PSEUDO_FX.dress]: 'dress',
  }),
});

/** The new-only effect this ability draws in this game, or null (then the ordinary lookup decides). */
export function bossFxFor(abilityId: string | undefined, game: FxGame): BossFxId | BuffFxId | null {
  if (!abilityId || (game !== 'ffx' && game !== 'ffx2')) return null;
  const table = BOSS_FX_TABLE[game];
  return Object.hasOwn(table, abilityId) ? table[abilityId]! : null;
}

/**
 * Effects that no damage event ever starts, because the move deals none (`battle/ffx/hit-apply.ts`: a `formula: 'none'` row emits no `damage`): their statuses start them
 * (`BattlePresenterBossFx.statusFxLanding`). The five buffs of step 2 belong here too: until this hook they were reachable only through the debug trigger.
 */
export const STATUS_DRAWN_FX: ReadonlySet<string> = new Set(['haste', 'shell', 'protect', 'reflect', 'dispel', 'banish', 'slowga', 'curse']);

/** Is this effect started by a status event rather than a damage event? */
export const drawnOnStatus = (fx: string | null | undefined): boolean => fx !== null && fx !== undefined && STATUS_DRAWN_FX.has(fx);

/** Which painted skin an Overdrive's ready aura wears, by the actor's id (`effects-painted-od.ts`). Only Tidus's aura is read from footage; the rest are neutral [ours]. */
export const OD_AURA_OF: Readonly<Record<string, string>> = Object.freeze({
  tidus: 'tidus',
  auron: 'auron',
});

/**
 * The light an effect throws on the figures near it (the demo look's spell light, `look/relight/RelightConfig.ts POINT_KINDS`, read through `spellTaps.notifyLand`): it knows today's ten effect ids and
 * lights anything else as the warm white bloom, which over a bright room reads as a white-out. Each new effect is lit as the existing kind nearest to its colour, so the relight file itself is not
 * touched: the dark attacks (which are not light) take the short warm flash of `hit` and no long pool on the floor, the sun is `fire`, Banish's gold lift `holy`, Slowga's blue-grey `water`. The charge, the aura and the dress change are decoration and ask for no light at all (`SpellFxLayer.decorate`).
 */
export const LIGHT_KIND: Readonly<Record<BossFxId, string>> = Object.freeze({
  atrophy: 'hit',
  fulllife: 'hit',
  cleave: 'hit',
  annihilate: 'hit',
  flare: 'fire',
  banish: 'holy',
  slowga: 'water',
  drain: 'hit',
  curse: 'hit',
  impulse: 'hit',
  gather: 'hit',
  odaura: 'hit',
  jump: 'hit',
  dress: 'hit',
  darkness: 'hit',
});

/** The effect id the spell light is asked for: the new ids as the kind above, every other id as itself (so with the new effects off nothing changes). */
export function lightKindOf<T extends string>(fx: T): T | string {
  return Object.hasOwn(LIGHT_KIND, fx) ? LIGHT_KIND[fx as BossFxId] : fx;
}
