/**
 * *Is standing this ally back up worth the turn, and is it safe right now?*
 *
 * Split out of `./advisor.ts` because it is the one part of the card's scoring
 * that has to read the **board** rather than one previewed outcome. The scorer
 * next door prices an action from the simulation's own report; a revive cannot
 * be priced that way, because what a revive is worth is almost entirely *who is
 * on the floor* and *what happens to them the moment they stand up*.
 *
 * ## The bug this file exists to fix
 *
 * The advisor used to price every revive at a flat 3,000 against ~2,000 for an
 * ordinary boss hit and 20,000 for a kill, so offence won on every board — and
 * Chapter 1's card cheerfully recommended a thrown item at Seymour Flux with
 * Yuna face-down at 0/1500 and no summoner, no Cure, no Esuna and no Protect
 * left in the party [Bailey, live build 88e5b64]. The flat number is replaced
 * by four readings:
 *
 * 1. **What the party loses while they are down.** Not a hand-written role
 *    table: the fallen member's own `learnedAbilityIds` are compared against
 *    the living ones', and every {@link KEYSTONE_FAMILIES} family that nobody
 *    still standing can cover is counted. With Yuna down in Chapter 1 that is
 *    revival, healing, cleansing and warding — four whole systems — while a
 *    downed Wakka costs the party nothing it cannot do without.
 * 2. **Her role**, from `src/ui/common/party-roles.ts`. The ability lists
 *    cannot see the one thing that matters most in an FFX boss fight: Yuna is
 *    the *only* member who can put an aeon on the field, and the summon rows
 *    are gated on her id inside `battle/ffx/commands.ts` rather than on
 *    anything she has learned.
 * 3. **How far the party has already collapsed.** Two down is not twice one
 *    down — it is the turn before a wipe.
 * 4. **Whether the revive survives contact.** A Phoenix Down into a telegraphed
 *    Lance of Atrophy, into Total Annihilation landing this turn, or onto a
 *    body that is still a Zombie, is a turn spent handing the boss a second
 *    free kill. {@link reviveRisk} says so and {@link waitSentence} tells the
 *    player, in one sentence, when to spend it instead.
 *
 * Whether *this* actor can revive at all is not decided here: the advisor only
 * ever prices rows the acting character was actually offered, so a Phoenix Down
 * with none in stock, or a Life the actor has not learned or cannot pay for,
 * never reaches this file.
 *
 * Pure, DOM-free and game-agnostic — FFX-2 has no `learnedAbilityIds` and falls
 * through to the base value plus the collapse and safety readings.
 */

import type { AnyCombatant, BattleState, CombatantId } from '../../battle/common/types.ts';
import { PARTY_ROLES } from '../../ui/common/party-roles.ts';

// ----------------------------------------------------------------- the knobs

/** Standing anybody back up, before the board is read. */
export const REVIVE_BASE = 2_500;
/** Per {@link KEYSTONE_FAMILIES} family the party cannot cover while they are down. */
export const KEYSTONE_VALUE = 1_200;
/** Per *additional* ally already on the floor. */
export const COLLAPSE_VALUE = 2_000;
/** Only one member of the active party is still standing. */
export const LAST_STANDING_VALUE = 3_000;
/**
 * What is left of a revive that walks straight into a re-kill.
 *
 * Not zero: the raise still happens, and a board can be desperate enough that
 * one turn of a third body is worth it. Small enough that any ordinary attack
 * outranks it, which is the point — the card should be saying *wait*.
 */
export const UNSAFE_REVIVE_FACTOR = 0.15;

/** What a role is worth beyond its ability list. See the file header, reading 2. */
const ROLE_VALUE: Partial<Record<string, number>> = {
  // The only member `commands.ts` will offer a Summon row to. With her down
  // the chapter's largest rule — "aeons as they come up, in both phases",
  // `seymour-flux.ts` step 3 — is simply not playable.
  Summoner: 2_500,
  'White Mage': 1_500,
  'Black Mage': 800,
};

/**
 * The ability families a party actually misses, by id.
 *
 * Deliberately *learned* abilities only. Kimahri knows White Wind and Mighty
 * Guard, which would otherwise read as "the party still has healing and
 * warding" — but both are Ronso Rages off a one-shot Overdrive gauge, not
 * something he can press on the turn the healer goes down.
 */
export const KEYSTONE_FAMILIES: Readonly<Record<string, readonly string[]>> = {
  revival: ['life', 'full-life', 'auto-life', 'arise'],
  healing: ['cure', 'cura', 'curaga', 'curaja', 'pray'],
  cleansing: ['esuna', 'dispel'],
  warding: ['protect', 'shell', 'reflect', 'nulblaze', 'nulfrost', 'nulshock', 'nultide'],
  hasting: ['haste', 'hastega'],
};

/** Enemy moves that make a revive this turn worse than no revive at all. */
const RE_KILL_MOVES = /lance of atrophy|full-life|total annihilation|mega death|death/i;
const RE_KILL_IDS = new Set(['lance-of-atrophy', 'full-life', 'total-annihilation', 'mega-death', 'death']);

// -------------------------------------------------------------- the forecast

/**
 * What the advisor needs from an enemy-intent forecast.
 *
 * A structural subset of `ui/common/EnemyIntent.ts`'s `IntentView`, which both
 * engines' `intent()` already returns — so a HUD can hand its existing source
 * straight to `AdvisorOptions.intent` without an adapter, and the advisor stays
 * pure and keeps compiling with nothing wired at all.
 */
export interface AdvisorIntent {
  enemyName: string;
  moveName: string;
  abilityId?: string | null;
  actsNext: boolean;
  turnsAway: number;
  estimate?: {
    perTarget: ReadonlyArray<{ targetId: CombatantId; lethal: boolean; amount: number }>;
  } | null;
  charge?: { name: string; turnsLeft: number } | null;
}

/** Why a revive should wait, or `null` when it is safe to spend the turn. */
export interface ReviveRisk {
  /** `'aimed'` — the next action kills them again; `'sweep'` — a party-wide payload is landing. */
  kind: 'aimed' | 'sweep' | 'zombie';
  /** One plain sentence for the card. No citation, no jargon. */
  sentence: string;
}

// ------------------------------------------------------------------ reading

function has(c: AnyCombatant | undefined, status: string): boolean {
  return c !== undefined && (c.statuses as Record<string, unknown>)[status] !== undefined;
}

/** Ability ids this member can press of their own accord. */
function learned(c: AnyCombatant | undefined): string[] {
  const ids = (c as { learnedAbilityIds?: readonly string[] } | undefined)?.learnedAbilityIds;
  return Array.isArray(ids) ? ids.map(String) : [];
}

function partyIds(state: Readonly<BattleState>): CombatantId[] {
  return [...state.activeIds, ...state.reserveIds];
}

/** Active members who are still standing. */
export function livingActives(state: Readonly<BattleState>): AnyCombatant[] {
  return state.activeIds
    .map((id) => state.combatants[id])
    .filter((c): c is AnyCombatant => c !== undefined && c.alive);
}

/** Active members on the floor and still raisable. */
export function downedActives(state: Readonly<BattleState>): AnyCombatant[] {
  return state.activeIds
    .map((id) => state.combatants[id])
    .filter((c): c is AnyCombatant => c !== undefined && !c.alive && c.removed !== true);
}

/**
 * The {@link KEYSTONE_FAMILIES} nobody still standing can cover while `fallenId`
 * is down — the concrete answer to "what did the party just lose".
 */
export function capabilityLoss(state: Readonly<BattleState>, fallenId: CombatantId): string[] {
  const fallenKnows = new Set(learned(state.combatants[fallenId]));
  if (fallenKnows.size === 0) return [];
  const coverable = new Set<string>();
  for (const id of partyIds(state)) {
    if (id === fallenId) continue;
    const c = state.combatants[id];
    if (!c || !c.alive) continue;
    for (const ability of learned(c)) coverable.add(ability);
  }
  const lost: string[] = [];
  for (const [family, ids] of Object.entries(KEYSTONE_FAMILIES)) {
    if (!ids.some((id) => fallenKnows.has(id))) continue;
    if (ids.some((id) => coverable.has(id))) continue;
    lost.push(family);
  }
  return lost;
}

// ------------------------------------------------------------------- safety

/**
 * Why raising `fallenId` right now is a wasted turn, or `null`.
 *
 * Three readings, cheapest first, and none of them needs the live engine:
 *
 *  * **Still a Zombie.** Zombie survives KO in this engine on purpose
 *    (`battle/ffx/statuses.ts` `SURVIVES_KO`), so a raised body comes back
 *    still wearing it, and a living Zombie is exactly what the Mortiorchis's
 *    Full-Life is looking for — 100% of max HP as damage plus a guaranteed
 *    Death [ffx-seymour-flux §3.3, §4.8]. `seymour-flux.ts` step 4 leaves that
 *    body on the floor for the same reason.
 *  * **A payload landing this turn.** A charge counter at zero or one is the
 *    Total Annihilation / Mega Flare case: the raise resolves, the sweep lands,
 *    they are back on the floor having cost a turn.
 *  * **The forecast has them in its sights.** Supplied by the HUD when it has
 *    one; the advisor asks for nothing when it does not.
 */
export function reviveRisk(
  state: Readonly<BattleState>,
  fallenId: CombatantId,
  intent: AdvisorIntent | null = null,
): ReviveRisk | null {
  const fallen = state.combatants[fallenId];
  const who = fallen?.name ?? 'them';

  if (has(fallen, 'zombie')) {
    return {
      kind: 'zombie',
      sentence: `${who} is still a Zombie, so raising ${who} now just hands the next Full-Life a free kill — cure the Zombie first`,
    };
  }

  const sweep = imminentCharge(state);
  if (sweep) {
    return {
      kind: 'sweep',
      sentence: `${sweep} lands before ${who} could act — take the hit first, then raise ${who} with the turn after it`,
    };
  }

  if (intent && (intent.actsNext || intent.turnsAway <= 0)) {
    const aimed = intent.estimate?.perTarget.find((t) => t.targetId === fallenId);
    const reKill =
      RE_KILL_IDS.has(String(intent.abilityId ?? '')) || RE_KILL_MOVES.test(intent.moveName);
    if (aimed?.lethal === true || reKill) {
      return {
        kind: 'aimed',
        sentence: `${intent.enemyName} uses ${intent.moveName} next and ${who} would go straight back down — raise ${who} once it has landed`,
      };
    }
  }
  return null;
}

/** The name of a party-wide payload landing this turn or the next, if any. */
function imminentCharge(state: Readonly<BattleState>): string | null {
  let name: string | null = null;
  let seq = -1;
  for (const e of state.log) {
    if (e.type !== 'charge') continue;
    const enemy = state.combatants[e.enemyId];
    if (!enemy || !enemy.alive) continue;
    if (e.turnsLeft > 1) continue;
    if (e.seq > seq) {
      seq = e.seq;
      name = e.name;
    }
  }
  // A counter that ran out long ago has already fired; `guide.ts` uses the same
  // window for the same reason.
  return seq >= 0 && state.log.length - seq <= 14 ? name : null;
}

/** {@link reviveRisk}'s sentence, ready for the card. */
export function waitSentence(risk: ReviveRisk): string {
  return risk.sentence;
}

// ------------------------------------------------------------------ pricing

/**
 * What standing `fallenId` up is worth on this board, in the scorer's units.
 *
 * Calibrated against the two numbers either side of it in `advisor.ts`: an
 * ordinary boss hit in these chapters scores ~600-2,600, and finishing the boss
 * scores `BOSS_KILL_VALUE` 20,000. A revive therefore has to land *above* every
 * plain swing and *below* a kill, which is what the constants at the top of
 * this file are set to. Chapter 1 with Yuna down: 2,500 base + four lost
 * families (4,800) + Summoner (2,500) = 9,800, against 2,600 for the best thing
 * Tidus can throw — so the ranking finally says what the player already knew.
 */
export function reviveValue(
  state: Readonly<BattleState>,
  fallenId: CombatantId,
  intent: AdvisorIntent | null = null,
): number {
  const fallen = state.combatants[fallenId];
  if (!fallen) return 0;

  let value = REVIVE_BASE;
  value += capabilityLoss(state, fallenId).length * KEYSTONE_VALUE;
  value += ROLE_VALUE[PARTY_ROLES[String(fallenId)] ?? ''] ?? 0;

  const down = downedActives(state).length;
  if (down > 1) value += (down - 1) * COLLAPSE_VALUE;
  if (livingActives(state).length <= 1) value += LAST_STANDING_VALUE;

  if (reviveRisk(state, fallenId, intent)) value = Math.round(value * UNSAFE_REVIVE_FACTOR);
  return value;
}

/**
 * One plain sentence on why this ally is the one to stand up.
 *
 * Written from {@link capabilityLoss} rather than from a role noun, so it is
 * true of whatever party the chapter actually fielded: "Yuna is the only one
 * who can heal, cure or revive" is a claim about this board, not a label.
 */
export function reviveReason(state: Readonly<BattleState>, fallenId: CombatantId): string {
  const who = state.combatants[fallenId]?.name ?? 'them';
  const lost = capabilityLoss(state, fallenId);
  const words: Partial<Record<string, string>> = {
    revival: 'revive',
    healing: 'heal',
    cleansing: 'cure status',
    warding: 'put Protect or Shell up',
    hasting: 'cast Haste',
  };
  const role = PARTY_ROLES[String(fallenId)];
  const all = lost.map((f) => words[f] ?? f);
  if (role === 'Summoner') all.unshift('call an aeon');
  // The card is 226px wide at its widest. Three clauses is the point at which
  // the sentence stops being read and starts being scrolled past.
  const list = all.slice(0, 3);
  if (list.length === 0) {
    return downedActives(state).length > 1
      ? `Two of the three are down — ${who} first`
      : `Stands ${who} back up`;
  }
  const phrase =
    list.length === 1
      ? list[0]!
      : `${list.slice(0, -1).join(', ')} or ${list[list.length - 1]!}`;
  return `${who} is the only one left who can ${phrase} — stand ${who} up`;
}
