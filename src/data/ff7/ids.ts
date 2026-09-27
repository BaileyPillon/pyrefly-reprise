/**
 * FF7 string-literal id unions (the hidden Guard Scorpion experiment).
 *
 * **Contract file**, like `data/ffx/ids.ts` and `data/ffx2/ids.ts`: a typo in an
 * id is a compile error. Only the slice's ids live here: the No. 1 Reactor core
 * at the Sector 1 bombing mission. Sources: `research/ff7-battle-core.md`
 * ("core"), `research/ff7-guard-scorpion.md` ("gs").
 *
 * Game case (AGENTS.md rule 14): **FF7 only.**
 */

/** Cloud and Barret, the only two at the fight [gs §10, verified: 2 sources]. */
export type Ff7CharacterId = 'cloud' | 'barret';

/** The boss [gs §1]. */
export type Ff7EnemyId = 'guard-scorpion';

/** The boss's abilities [gs §4, verified: 2 to 3 sources each]. */
export type Ff7EnemyAbilityId = 'search-scope' | 'rifle' | 'scorpion-tail' | 'tail-laser' | 'raise-tail' | 'drop-tail';

/** The party's Magic at the fight, from its Materia [core §8.4]. */
export type Ff7SpellId = 'bolt' | 'ice' | 'cure';

/** Limit Level 1 moves [core §7.3]. */
export type Ff7LimitId = 'braver' | 'big-shot';

/** The Materia owned at the fight [core §8.2]. */
export type Ff7MateriaId = 'lightning' | 'ice' | 'restore';

/** Items reachable before the fight [core §8.6], and the boss's drop [gs §12]. */
export type Ff7ItemId = 'potion' | 'phoenix-down' | 'assault-gun';

/** Equipment worn at the fight [gs §8.3]. */
export type Ff7EquipmentId = 'buster-sword' | 'gatling-gun' | 'bronze-bangle';

/** Every FF7 combatant id in the slice. */
export type Ff7CombatantId = Ff7CharacterId | Ff7EnemyId;
