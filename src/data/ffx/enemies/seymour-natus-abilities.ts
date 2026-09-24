/**
 * Boss-only `AbilityDef`s for **Seymour Natus** (`m126`, bestiary #116) and
 * **Mortibody** (`m127`, #117), the Highbridge of Bevelle — Chapter X.
 *
 * Every row is read off `research/ffx-seymour-natus-highbridge.md` §3, the
 * decompiled action rows, cross-checked against the FF Wiki enemy-ability
 * table (revid 4008011, re-fetched by the preflight's review and found to
 * match) `[verified: 2 sources]` unless a row says otherwise.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. FFX-2 has no Natus, no
 * Mortibody and no Highbridge boss (research §0.3); nothing here is imported by
 * `src/battle/ffx2/**` or `src/data/ffx2/**`.
 *
 * ## Rows reused by id, not copied
 *
 * - **Banish** (6:80) is Chapter I's `banish` record: the same row, Eject with
 *   the aeon's immunity removed first, never reflectable (§3.1).
 * - **Protect** (3:59, "Counter → self") is the shared player `protect`, as
 *   Chapter I's threshold Protect is.
 *
 * ## Rows NOT shipped (research §3, N-7)
 *
 * Natus's menu-only **Reflect** (6:95), Mortibody's menu-only **Attack**
 * (6:93) and the dummied **Magic Re-Enabled** (6:104): in the menu lists, in
 * no script, in no source. Not built.
 *
 * ## What the research leaves open, and what each row does about it
 *
 * - **MP cost** is not in §3. It is also never read: the engine charges an
 *   enemy no MP (`abilities.ts#mpCostFor`). Every row says `mpCost: 0`.
 * - **Accuracy.** Magic and every Overdrive always hit [AGENTS.md hard
 *   rule 5]; the engine reads only `canMiss === false`, so it is set on every
 *   magical and every no-damage row. Shattering Claw is the one physical row
 *   and carries its decompiled accuracy byte (100), so it rolls.
 * - **Rank** is decompiled (3 on every row, 5 on Flare) — §3.1, §3.2.
 * - **Party-wide spells and Reflect.** The research's single-source line
 *   "Mortibody's tier-1 spell on an all-Reflect party bounces back onto
 *   Mortibody" (§4.3) is **not** reproduced: the shared engine rule is that a
 *   party-wide spell never bounces (`statuses.ts#bouncesOffReflect`), and
 *   changing it would change every chapter. Recorded, not built.
 */

import type { AbilityDef, FFXStatusId } from '../../../battle/common/types.ts';

/** Ids, mirrored by `src/battle/ffx/ai/seymour-natus-rules.ts` (the tests pin them equal). */
export const NATUS_MULTI_FIRA = 'natus-multi-fira';
export const NATUS_MULTI_BLIZZARA = 'natus-multi-blizzara';
export const NATUS_MULTI_THUNDARA = 'natus-multi-thundara';
export const NATUS_MULTI_WATERA = 'natus-multi-watera';
export const NATUS_BREAK = 'natus-break';
export const NATUS_FLARE = 'natus-flare';
export const MORTIBODY_FIRE = 'mortibody-fire';
export const MORTIBODY_BLIZZARD = 'mortibody-blizzard';
export const MORTIBODY_THUNDER = 'mortibody-thunder';
export const MORTIBODY_WATER = 'mortibody-water';
export const MORTIBODY_SHATTERING_CLAW = 'mortibody-shattering-claw';
export const MORTIBODY_DESPERADO = 'mortibody-desperado';
export const MORTIBODY_CURA = 'mortibody-cura';

type Element4 = 'fire' | 'ice' | 'lightning' | 'water';

// ---------------------------------------------------------------------------
// Seymour Natus (m126) — §3.1 [decompiled]
// ---------------------------------------------------------------------------

/**
 * Rows **6:171 / 173 / 175 / 177** with their "2nd hit" twins 6:172 / 174 /
 * 176 / 178: Magic, **DC 36**, two party members, magical, rank 3,
 * reflectable [§3.1 decompiled + wiki "36", "Two allies"].
 *
 * One record with `hits: 2`, the Chapter VII precedent
 * (`seymour-anima-macalania-abilities.ts`, "Act three's two hits are one
 * record"): the engine re-picks the target per hit for `random-enemy`.
 *
 * **The two targets are two different members if possible** — the wiki Natus
 * page, "targeting two different party members if possible" `[single source]`,
 * which the preflight's review found (it corrected B7: this part is sourced,
 * not Bailey's call). `extra.distinctTargetsPerHit` makes the second pick
 * avoid the first when anyone else is standing (`targeting.ts#nextHitTargets`),
 * and falls back to the same member when nobody is. Chapter VII's Multi-ra has
 * no such key and keeps its two independent picks (Macalania C-3).
 *
 * No shatter byte is printed for these rows (§3.1), so none is shipped.
 */
function multiRa(id: string, name: string, element: Element4): AbilityDef {
  return {
    id,
    name,
    game: 'ffx',
    category: 'enemy',
    mpCost: 0, // unread — see the file header
    rank: 3, // §3.1 [decompiled]
    power: 36, // §3.1 [verified: 2 sources]
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'random-enemy',
    hits: 2, // the row and its "2nd hit" twin, as one record
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable'],
    canReflect: true,
    canMiss: false,
    extra: { distinctTargetsPerHit: true },
    messageTemplate: `{user} casts ${name}`,
  };
}

export const natusMultiFira = multiRa(NATUS_MULTI_FIRA, 'Multi-Fira', 'fire');
export const natusMultiBlizzara = multiRa(NATUS_MULTI_BLIZZARA, 'Multi-Blizzara', 'ice');
export const natusMultiThundara = multiRa(NATUS_MULTI_THUNDARA, 'Multi-Thundara', 'lightning');
export const natusMultiWatera = multiRa(NATUS_MULTI_WATERA, 'Multi-Watera', 'water');

/**
 * Row **6:79**, Break: one random character, **Petrify at chance 254**
 * (cannot miss short of immunity), no damage, type Other, rank 3,
 * **reflectable** [§3.1 decompiled + wiki "Petrification: Infinite", "Can be
 * reflected", verified: 2 sources]. Reflected onto Natus it misses: he is
 * Petrify-immune (255) [§1.3, §4.3].
 */
export const natusBreak: AbilityDef = {
  id: NATUS_BREAK,
  name: 'Break',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.1 [decompiled]
  power: 0, // no damage [§3.1]
  formula: 'none',
  damageType: 'other', // §3.1 "Other"
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [{ status: 'petrify', chance: 254, duration: 254 }], // §3.1 [decompiled]
  removesStatuses: [],
  flags: ['reflectable'],
  canReflect: true,
  canMiss: false,
  messageTemplate: '{user} casts Break',
};

/**
 * Row **3:82**, Flare: one random character, Magic **DC 60** (not Flux's 80),
 * non-elemental, **rank 5** (the wiki's "delays his next turn"), reflectable,
 * shatter 10 [§3.1 decompiled + wiki, verified: 2 sources]. §3.3's table
 * reproduces the sources' "up to 2,500" at Magic Defense 5 `[derived]`.
 *
 * Its own record, not the player's `flare`: that one is `single-enemy` and
 * `crit-eligible`, and Chapter I's `flare-self` is DC 80 at Self.
 */
export const natusFlare: AbilityDef = {
  id: NATUS_FLARE,
  name: 'Flare',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 5, // §3.1 [decompiled]
  power: 60, // §3.1 [verified: 2 sources]
  formula: 'magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['reflectable', 'shatter'],
  shatterChance: 10, // §3.1 [decompiled]
  canReflect: true,
  canMiss: false,
  messageTemplate: '{user} casts Flare',
};

// ---------------------------------------------------------------------------
// Mortibody (m127) — §3.2 [decompiled]
// ---------------------------------------------------------------------------

/**
 * Rows **6:57 / 58 / 59 / 60**: Fire / Blizzard / Thunder / Water on the
 * **whole party**, Magic **DC 16**, rank 3, reflectable, **shatter 10**
 * [§3.2 decompiled + wiki "Mortibody 16", "All allies: Mortibody only",
 * verified: 2 sources]. The first half of the combo (§4.1).
 */
function tierOne(id: string, name: string, element: Element4): AbilityDef {
  return {
    id,
    name,
    game: 'ffx',
    category: 'enemy',
    mpCost: 0,
    rank: 3, // §3.2 [decompiled]
    power: 16, // §3.2 [verified: 2 sources]
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'shatter'],
    shatterChance: 10, // §3.2 [decompiled]
    canReflect: true,
    canMiss: false,
    messageTemplate: `{user} casts ${name}`,
  };
}

export const mortibodyFire = tierOne(MORTIBODY_FIRE, 'Fire', 'fire');
export const mortibodyBlizzard = tierOne(MORTIBODY_BLIZZARD, 'Blizzard', 'ice');
export const mortibodyThunder = tierOne(MORTIBODY_THUNDER, 'Thunder', 'lightning');
export const mortibodyWater = tierOne(MORTIBODY_WATER, 'Water', 'water');

/**
 * Row **6:118**, Shattering Claw: one **random** character (GameFAQs: "not
 * necessarily" the petrified one), Strength **DC 16**, physical, accuracy
 * **100**, **shatter 90 %**, `can_target_dead` [§3.2 decompiled + wiki "16",
 * "100", "90 % PDR", verified: 2 sources].
 *
 * The damage is small (§3.3: ~300 at party Defense 10-30); the 90 % on a
 * petrified target is the whole threat, and it is Chapter VIII's shipped
 * shatter path (`abilities.ts`, `hp.ts#ejectActor('shatter')`): the slot is
 * lost for the battle and no Switch refills it.
 *
 * `can-target-dead` is carried for fidelity; the `random-enemy` resolver picks
 * among the living, so it changes nothing today.
 */
export const mortibodyShatteringClaw: AbilityDef = {
  id: MORTIBODY_SHATTERING_CLAW,
  name: 'Shattering Claw',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.2 [decompiled]
  power: 16, // §3.2 [verified: 2 sources]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['shatter', 'can-target-dead'],
  shatterChance: 90, // §3.2 [verified: 2 sources]
  accuracy: 100, // §3.2 [decompiled]
  messageTemplate: '{user} uses Shattering Claw',
};

/** §3.2: the statuses Desperado strips [decompiled + wiki, the same list]. */
export const DESPERADO_STRIPS: readonly FFXStatusId[] = [
  'shell',
  'protect',
  'reflect',
  'nultide',
  'nulblaze',
  'nulshock',
  'nulfrost',
  'regen',
  'haste',
];

/**
 * Row **6:94**, Desperado: the whole party, **Fixed** DmgCon 10 = 500 × the
 * variance roll = **468-529**, type Other (Shell does not apply), rank 3,
 * and it strips Shell, Protect, Reflect, the four Nul spells, Regen and Haste
 * [§3.2 decompiled + wiki (same 468-529, same list), verified: 2 sources].
 *
 * **When** it fires is the AI's rule, not this row's: Mortibody's next action
 * once all three active members are Hasted [§4.3, verified: 3 sources] —
 * `ai/seymour-natus-rules.ts#desperadoDue`.
 */
export const mortibodyDesperado: AbilityDef = {
  id: MORTIBODY_DESPERADO,
  name: 'Desperado',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.2 [decompiled]
  power: 10, // §3.2 [decompiled] — `fixed`: 10 × 50 × (240..271) / 256 = 468..529
  formula: 'fixed',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [...DESPERADO_STRIPS],
  flags: ['removes-statuses'],
  canMiss: false,
  messageTemplate: '{user} uses Desperado',
};

/**
 * Row **3:44**, Cura on slot M1 = **Natus**: Healing DC **40**, magical,
 * rank 3, **reflectable** [§3.2 decompiled + wiki, verified: 2 sources].
 * §3.3: 1,200 (1,125-1,270) at Magic 20.
 *
 * Its own record rather than the player's `cura`: that row is
 * `crit-eligible`, and §3.2 prints no crit byte for this one. A Reflect on
 * Natus bounces it to a party member (research §6.3 strategy 5,
 * `targeting.ts#reflectBounceTarget`).
 */
export const mortibodyCura: AbilityDef = {
  id: MORTIBODY_CURA,
  name: 'Cura',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.2 [decompiled]
  power: 40, // §3.2 [verified: 2 sources]
  formula: 'healing',
  damageType: 'magical',
  element: ['none'],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['heals', 'reflectable'],
  canReflect: true,
  canMiss: false,
  messageTemplate: '{user} casts Cura',
};

/** Every row this file ships, keyed by id, for `src/data/ffx/index.ts`. */
export const SEYMOUR_NATUS_ABILITIES: Record<string, AbilityDef> = {
  [natusMultiFira.id]: natusMultiFira,
  [natusMultiBlizzara.id]: natusMultiBlizzara,
  [natusMultiThundara.id]: natusMultiThundara,
  [natusMultiWatera.id]: natusMultiWatera,
  [natusBreak.id]: natusBreak,
  [natusFlare.id]: natusFlare,
  [mortibodyFire.id]: mortibodyFire,
  [mortibodyBlizzard.id]: mortibodyBlizzard,
  [mortibodyThunder.id]: mortibodyThunder,
  [mortibodyWater.id]: mortibodyWater,
  [mortibodyShatteringClaw.id]: mortibodyShatteringClaw,
  [mortibodyDesperado.id]: mortibodyDesperado,
  [mortibodyCura.id]: mortibodyCura,
};

export default SEYMOUR_NATUS_ABILITIES;
