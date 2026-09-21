/**
 * Boss-only `AbilityDef`s for **Seymour + two Guado Guardians + Anima**
 * (Macalania Temple antechamber).
 *
 * **Game case: FFX only.** Every row below is read off
 * `research/ffx-seymour-anima-macalania.md` §4, an FFX-only encounter fought
 * with the FFX CTB engine. Nothing here is imported by `src/battle/ffx2/**`
 * or `src/data/ffx2/**` and the FFX-2 engine gets no equivalent
 * [AGENTS.md rule 14].
 *
 * Ownership note, same rule as `seymour-flux-abilities.ts`: an action that is
 * literally the record a player could cast (Shell, Protect) is **not** here —
 * it is referenced by id from the shared catalog. Everything below is
 * enemy-exclusive.
 *
 * ---
 *
 * ## `anima-pain-boss` is NOT `pain` — read this before touching either row
 *
 * `Pain` is **two different decompiled actions** with different DmgCon values
 * [§4.3, §13 row 8 — recorded as a **blocker** in the research's own list]:
 *
 * | Which | Action row | DmgCon | Damage at MAG 20 |
 * |---|---|---:|---|
 * | **This boss** — Seymour's Anima (`m125`) | monmagic2 **#222** | **28** | **459–518** |
 * | **Yuna's Anima** — the player's aeon | monmagic2 **#220** | **20** | 328–370 |
 *
 * Both are right for their own row. `src/data/ffx/aeons/abilities-optional.ts`
 * already ships the player-aeon row as `pain` at power 20; sharing one record
 * would ship this boss at ~70 % of canon damage *or* the player's aeon at
 * ~140 %. `tests/unit/chapters/macalania-engine.test.ts` pins
 * `anima-pain-boss.power === 28` and asserts it differs from `pain.power`.
 *
 * ## Act three's two hits are one record
 *
 * The decompile carries `Multi-X` **and** `Multi-X 2nd Hit` as separate rows.
 * The engine's `resolveAbility` re-resolves targets *per hit* for a
 * `random-enemy` action and consumes Nul charges *inside* the hit loop, so a
 * single record with `hits: 2` gives exactly what §12 **C-3** recommends —
 * two independent random picks, and one Nul charge absorbs one hit — with no
 * engine change at all. One record, two hits.
 *
 * ## Accuracy
 *
 * Magic and every Overdrive always hit [AGENTS.md hard rule 5]; the engine
 * reads only `canMiss === false`, so it is set explicitly on every magical
 * and every no-damage row here, exactly as `seymour-flux-abilities.ts` does
 * (its ACCURACY EDIT note carries the evidence:
 * `research/ffx-yunalesca.md` §7.2 + `research/ffx-bfa-yu-yevon.md` §1.3).
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Seymour (m124) — §4.1 [decompiled]
// ---------------------------------------------------------------------------

/** One `-ra` step of the fixed ice → lightning → water → fire cycle [§4.1, §5.2]. */
function raSpell(id: string, name: string, element: 'ice' | 'lightning' | 'water' | 'fire'): AbilityDef {
  return {
    id,
    name,
    game: 'ffx',
    category: 'enemy',
    mpCost: 8, // §4.1 [decompiled]
    rank: 3, // [estimate] — rank byte not in the decompiled excerpt; FFX enemy default
    power: 24, // §4.1 [decompiled] base 24
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'random-enemy', // §4.1 [decompiled] "Random Character"
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored', 'reflectable', 'shatter'],
    shatterChance: 10, // §4.1 [decompiled] "shatter 10"
    canReflect: true,
    canMiss: false,
    messageTemplate: `{user} casts ${name}`,
  };
}

/** The `-ga` tier, used **only against a summoned aeon** — even one that absorbs it [§4.1, §5.2]. */
function gaSpell(id: string, name: string, element: 'ice' | 'lightning' | 'water' | 'fire'): AbilityDef {
  return {
    ...raSpell(id, name, element),
    mpCost: 16, // §4.1 [decompiled]
    power: 42, // §4.1 [decompiled]
  };
}

/**
 * Act three only. Base 36, **two hits**, and deliberately **not**
 * `ignores-armored` — the Multi- variants are the only non-physical damage in
 * the game that is not Piercing [§4.1, single source: wiki]. No gameplay
 * consequence (characters cannot be Armored) but it is a real authored quirk.
 */
function multiSpell(id: string, name: string, element: 'ice' | 'lightning' | 'water' | 'fire'): AbilityDef {
  return {
    id,
    name,
    game: 'ffx',
    category: 'enemy',
    mpCost: 8,
    rank: 3, // [estimate]
    power: 36, // §4.1 [decompiled]
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'random-enemy',
    hits: 2, // the `Multi-X` + `Multi-X 2nd Hit` pair, as one record — see the file header
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable'],
    canReflect: true,
    canMiss: false,
    messageTemplate: `{user} casts ${name}`,
  };
}

export const macBlizzara = raSpell('mac-blizzara', 'Blizzara', 'ice');
export const macThundara = raSpell('mac-thundara', 'Thundara', 'lightning');
export const macWatera = raSpell('mac-watera', 'Watera', 'water');
export const macFira = raSpell('mac-fira', 'Fira', 'fire');

export const macBlizzaga = gaSpell('mac-blizzaga', 'Blizzaga', 'ice');
export const macThundaga = gaSpell('mac-thundaga', 'Thundaga', 'lightning');
export const macWaterga = gaSpell('mac-waterga', 'Waterga', 'water');
export const macFiraga = gaSpell('mac-firaga', 'Firaga', 'fire');

export const macMultiBlizzara = multiSpell('mac-multi-blizzara', 'Multi-Blizzara', 'ice');
export const macMultiThundara = multiSpell('mac-multi-thundara', 'Multi-Thundara', 'lightning');
export const macMultiWatera = multiSpell('mac-multi-watera', 'Multi-Watera', 'water');
export const macMultiFira = multiSpell('mac-multi-fira', 'Multi-Fira', 'fire');

/**
 * "Special 1" — Seymour's only scheduled action while Anima is on the field:
 * a zero-hit no-op aimed at her slot [§4.1 `[decompiled]`, §5.3].
 */
export const macSeymourIdle: AbilityDef = {
  id: 'mac-seymour-idle',
  name: 'Wait',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 0,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} watches',
};

// ---------------------------------------------------------------------------
// Guado Guardian (m141) — §4.2 [decompiled]
// ---------------------------------------------------------------------------

function guardianSpell(id: string, name: string, element: 'ice' | 'lightning'): AbilityDef {
  return {
    id,
    name,
    game: 'ffx',
    category: 'enemy',
    mpCost: 4, // §4.2 [decompiled]
    rank: 3, // [estimate]
    power: 12, // §4.2 [decompiled]
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'random-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'shatter'],
    shatterChance: 10, // §4.2 [decompiled]
    canReflect: true,
    canMiss: false,
    messageTemplate: `{user} casts ${name}`,
  };
}

export const guardianBlizzard = guardianSpell('guardian-blizzard', 'Blizzard', 'ice');
export const guardianThunder = guardianSpell('guardian-thunder', 'Thunder', 'lightning');

/**
 * The **counter**, not a turn: fires on being damaged and restores a flat
 * 1,000 HP (`fixed-no-variance`, base 20 → `20 × 50`) [§4.2, §2.3].
 *
 * Disabled by one **successful** Steal, which the engine gives for free —
 * `ActorRuntime.stealCount > 0` is `!hasPotions` [§2.4].
 *
 * **Trigger scope is an owner-approved assumption, not canon** (C-11): the
 * wiki contradicts itself on one page ("whenever they take damage" vs
 * "whenever they are hit with a physical attack"). We ship **any damage**
 * behind `AUTO_POTION_ON_ANY_DAMAGE` in
 * `src/battle/ffx/ai/seymour-anima-macalania.ts`; the other branch is one
 * line away.
 */
export const guardianAutoPotion: AbilityDef = {
  id: 'guardian-auto-potion',
  name: 'Auto-Potion',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 20, // §4.2 [decompiled] 20 x 50 = 1,000 HP
  formula: 'fixed-no-variance',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['heals', 'is-counter'],
  canMiss: false,
  messageTemplate: '{user} uses Auto-Potion',
};

/** Hi-Potion on Seymour: +1,000 HP and it **spends the Guardian's turn** [§4.2, §2.3]. */
export const guardianHiPotion: AbilityDef = {
  id: 'guardian-hi-potion',
  name: 'Hi-Potion',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 20, // §4.2 [decompiled]
  formula: 'fixed-no-variance',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['heals'],
  canMiss: false,
  messageTemplate: '{user} uses Hi-Potion on {target}',
};

/** §4.2 [decompiled] — the cleanse list is the decompiled Remedy list, verbatim. */
const REMEDY_CURES = [
  'petrify',
  'poison',
  'confuse',
  'berserk',
  'sleep',
  'silence',
  'darkness',
  'slow',
] as const;

/**
 * Remedy on Seymour — the poison answer.
 *
 * **Neither Remedy branch is gated on the potion supply** [§2.3, §14 row 1,
 * verified: 2 sources]. Steal removes Auto-Potion and Hi-Potion-on-Seymour and
 * nothing else; gating Remedy too would silently double the poison route's
 * value and make the fight materially easier than canon.
 */
export const guardianRemedy: AbilityDef = {
  id: 'guardian-remedy',
  name: 'Remedy',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: [...REMEDY_CURES],
  flags: ['removes-statuses'],
  canMiss: false,
  messageTemplate: '{user} uses Remedy on {target}',
};

/** The same record aimed at itself — a Silenced or Poisoned Guardian cures itself [§4.2]. */
export const guardianRemedySelf: AbilityDef = {
  ...guardianRemedy,
  id: 'guardian-remedy-self',
  targeting: 'self',
  messageTemplate: '{user} uses Remedy',
};

/**
 * Shremedy — a thrown item-shaped attack: **no damage, Confusion at 50 %**
 * [§4.2 decompiled].
 *
 * There is **no Confuse Ward anywhere in this stretch of the game** (§8.7), so
 * the player has to eat it and cure it. That constraint is what stops the
 * Guardians being filler.
 */
export const guardianShremedy: AbilityDef = {
  id: 'guardian-shremedy',
  name: 'Shremedy',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [{ status: 'confuse', chance: 50, duration: 3 }], // §4.2 [decompiled] "Confuse @ 50"
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} throws Shremedy at {target}',
};

// ---------------------------------------------------------------------------
// Anima (m125) — §4.3 [decompiled]
// ---------------------------------------------------------------------------

/**
 * Boost — she takes ×1.5 damage and healing until her next turn [§3.4].
 *
 * The duration is carried by the engine's own "until the user's next turn"
 * rule (`statuses.ts#clearUntilNextTurnStatuses`, which drops `boost` at the
 * *start* of the holder's next turn), so the byte here is a long one rather
 * than a turn count.
 *
 * **Boost does not accelerate her gauge**, and the engine already gets that
 * right without a special case: `overdrive.ts#addGauge` applies Boost's ×1.5
 * only for `side === 'aeon'`, and she is `side === 'enemy'`. Do not "fix" it.
 */
export const animaBoost: AbilityDef = {
  id: 'anima-boost',
  name: 'Boost',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 1,
  statusEffects: [{ status: 'boost', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} uses Boost',
};

/**
 * **The boss's Pain — monmagic2 #222, DmgCon 28.** See the file header.
 *
 * Special Magic ignores the target's Magic Defense entirely, so the damage is
 * flat across the whole party: **459–518, never more, never less**, before
 * Shell. The rider is a **100 % Death flag**, so on a party member it is not
 * "500 damage", it is a kill.
 *
 * On an aeon it is 500 damage and nothing else — and that needs **no engine
 * exception**: aeons carry the hidden Aeon Ribbon, which
 * `src/battle/ffx/setup.ts#AEON_INNATE_IMMUNITIES` already implements as
 * `ko: 255`. That single asymmetry is the entire reason act two is an aeon
 * duel [§4.3, §5.1, verified: 2 sources].
 */
export const animaPainBoss: AbilityDef = {
  id: 'anima-pain-boss',
  name: 'Pain',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 28, // §4.3 [decompiled] monmagic2 #222 — NOT the aeon `pain` row's 20
  formula: 'special-magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [{ status: 'ko', chance: 100, duration: 0 }], // §4.3 Death @ 100 %
  removesStatuses: [],
  flags: ['ignores-armored'],
  canMiss: false,
  extra: { notPlayerAeonPain: 'monmagic2 #222 (DmgCon 28); the aeon row `pain` is #220 (DmgCon 20)' },
  messageTemplate: '{user} uses Pain on {target}',
};

/**
 * Oblivion, her Overdrive — **16 separate hits** in the INT/PAL/HD build,
 * which is this project's declared baseline; power 4 per hit against the
 * original NA build's single 75 [§4.3, verified: 2 sources].
 *
 * Mitigated by the target's Defense. Unshielded it kills the whole party
 * outright at this story point (~1,750–1,950 total); Shielded, Shiva eats it
 * for ~440 and keeps going (§6.3). That comparison is the whole lesson of the
 * aeon sub-command menu.
 */
export const animaOblivion: AbilityDef = {
  id: 'anima-oblivion',
  name: 'Oblivion',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 4, // §4.3 [decompiled] INT/PAL 16-hit version
  formula: 'strength',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 16, // §4.3 [decompiled] `n_of_hits = 16`
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'always-break-damage-limit'],
  breaksDamageLimit: true,
  canMiss: false, // every Overdrive always hits [AGENTS.md hard rule 5]
  messageTemplate: '{user} uses Oblivion',
};

/**
 * Every ability this encounter owns, keyed by id.
 *
 * **Deliberately absent:** the decompiled `Summon Anima` (6/181) and
 * `Seymour dismisses Anima!` (6/81) rows. Both are zero-hit script markers
 * with no damage, no status and no target, and the engine stages both act
 * transitions from `ai/seymour-anima-macalania.ts` as engine events — shipping
 * two `AbilityDef`s nothing selects would be data wired to nothing
 * [AGENTS.md hard rule 4].
 *
 * **Also deliberately absent:** Anima's three dummied Sleep / Silence /
 * Darkness physical variants. They exist in the data and are never scripted
 * [§4.4]; the research says in as many words: do not implement them.
 */
export const SEYMOUR_ANIMA_MACALANIA_ABILITIES: Record<string, AbilityDef> = {
  [macBlizzara.id]: macBlizzara,
  [macThundara.id]: macThundara,
  [macWatera.id]: macWatera,
  [macFira.id]: macFira,
  [macBlizzaga.id]: macBlizzaga,
  [macThundaga.id]: macThundaga,
  [macWaterga.id]: macWaterga,
  [macFiraga.id]: macFiraga,
  [macMultiBlizzara.id]: macMultiBlizzara,
  [macMultiThundara.id]: macMultiThundara,
  [macMultiWatera.id]: macMultiWatera,
  [macMultiFira.id]: macMultiFira,
  [macSeymourIdle.id]: macSeymourIdle,
  [guardianBlizzard.id]: guardianBlizzard,
  [guardianThunder.id]: guardianThunder,
  [guardianAutoPotion.id]: guardianAutoPotion,
  [guardianHiPotion.id]: guardianHiPotion,
  [guardianRemedy.id]: guardianRemedy,
  [guardianRemedySelf.id]: guardianRemedySelf,
  [guardianShremedy.id]: guardianShremedy,
  [animaBoost.id]: animaBoost,
  [animaPainBoss.id]: animaPainBoss,
  [animaOblivion.id]: animaOblivion,
};

export default SEYMOUR_ANIMA_MACALANIA_ABILITIES;
