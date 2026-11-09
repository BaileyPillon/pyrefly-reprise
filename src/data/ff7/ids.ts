/**
 * FF7 string-literal id unions (the hidden FF7 experiments: Guard Scorpion, and chapter 44, Jenova LIFE).
 *
 * **Contract file**, like `data/ffx/ids.ts` and `data/ffx2/ids.ts`: a typo in an
 * id is a compile error. Only the slices' ids live here: the No. 1 Reactor core
 * at the Sector 1 bombing mission, and the altar of the Forgotten Capital. Sources: `research/ff7-battle-core.md`
 * ("core"), `research/ff7-guard-scorpion.md` ("gs"), `research/ff7-jenova-life.md` ("jl").
 * Chapter 44 only adds members to these unions (additive).
 *
 * Game case (AGENTS.md rule 14): **FF7 only.**
 */

/** Cloud and Barret at the Guard Scorpion [gs §10, verified: 2 sources]; Tifa joins them at Jenova LIFE (chapter 44; the preset is [estimate], jl §9). */
export type Ff7CharacterId = 'cloud' | 'barret' | 'tifa';

/** The bosses: the Guard Scorpion [gs §1] and Jenova LIFE at the Forgotten Capital (chapter 44, jl §3). */
export type Ff7EnemyId = 'guard-scorpion' | 'jenova-life';

/** Jenova LIFE's four actions [jl §4, verified: 3 sources each]. */
export type Ff7JenovaAbilityId = 'blue-light' | 'blue-flame' | 'aqualung' | 'jenova-reflect';

/** The boss's abilities [gs §4, verified: 2 to 3 sources each; jl §4]. */
export type Ff7EnemyAbilityId = 'search-scope' | 'rifle' | 'scorpion-tail' | 'tail-laser' | 'raise-tail' | 'drop-tail' | Ff7JenovaAbilityId;

/** The higher tiers and the new families the Forgotten Capital party carries (chapter 44; LE formulas 6.1, single source). */
export type Ff7Ch44SpellId =
  | 'bolt2' | 'bolt3' | 'ice2' | 'ice3' | 'fire' | 'fire2' | 'fire3' | 'quake' | 'quake2' | 'quake3'
  | 'cure2' | 'regen' | 'barrier' | 'mbarrier';

/** The party's Magic at the fight, from its Materia [core §8.4]. */
export type Ff7SpellId = 'bolt' | 'ice' | 'cure' | Ff7Ch44SpellId;

/** Limit Levels 2 and 3 [core §7.3 and PM §3.3 via LE party 9]: Tifa's whole chain is one entry, named for its finisher. */
export type Ff7Ch44LimitId = 'blade-beam' | 'climhazzard' | 'satellite-beam' | 'angermax' | 'dolphin-blow';

/** Limit moves [core §7.3]. */
export type Ff7LimitId = 'braver' | 'big-shot' | Ff7Ch44LimitId;

/** The Materia owned at the fights [core §8.2]. */
export type Ff7MateriaId = 'lightning' | 'ice' | 'restore' | 'fire' | 'earth' | 'barrier';

/** Items reachable before the fights [core §8.6], and the bosses' drops [gs §12, jl §3]. */
export type Ff7ItemId = 'potion' | 'phoenix-down' | 'assault-gun' | 'hi-potion' | 'wizard-bracelet';

/** Equipment worn at the fights [gs §8.3, jl §9]. */
export type Ff7EquipmentId =
  | 'buster-sword' | 'gatling-gun' | 'bronze-bangle'
  | 'murasame' | 'diamond-knuckle' | 'heavy-vulcan' | 'diamond-bangle' | 'gold-armlet' | 'power-wrist' | 'talisman' | 'wizard-bracelet';

/** Every FF7 combatant id in the slices. */
export type Ff7CombatantId = Ff7CharacterId | Ff7EnemyId;
