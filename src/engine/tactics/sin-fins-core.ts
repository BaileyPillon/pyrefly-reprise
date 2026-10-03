/**
 * The intended line for **Chapter XVII, "Sin: the Fins and the Core"**: the Left Fin, the Right Fin, then
 * Sinspawn Genais with Sin's Core, on one party state.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3]. Every rule cites
 * `research/ffx-sin.md` §8, the table of strategies published guides recommend.
 *
 * A tactic sees the live state and the rows the engine offered; it never invents a command, only chooses
 * among legal ones, and returns `null` to fall through to "swing" (`BattlePresenterStrategies.ts`).
 *
 * ## The Fins (links 1 and 2)
 *
 * 1. **Revive, cure, heal** (`./sin-common.ts#sinCare`). Gravija leaves a quarter; heal before the next swing.
 * 2. **Pull back when the core charges** (§8 row 2, [verified: 2 sources]), **unless Cid's forecast turn comes
 *    after the Fin's**: the dodge is a race between two CTB counters (§5.1.2), and an order that lands after
 *    the Gravija only spends a turn. This is plan R9: the move advisor's core does not read `sin.fin.charged`,
 *    so the rule lives here.
 * 3. **Close in, Armor Break and Mental Break, pull back** (§8 row 1, [verified: 3 sources]): the Fins open
 *    FAR (S-8), so the first order is Close in, the Breaks go on at NEAR, and the ship goes back out.
 * 4. **Protect the centre, Haste one** (§8 row 3, [single source: wiki]): the near Negation chance counts
 *    Haste, Shell and Reflect on the party and Protect on the end members, so the setup is exactly that.
 *    Cast at FAR, where Negation cannot strip it (§5.1.3).
 * 5. **Wakka and Lulu from range** (§8 row 1): at FAR only they reach; a member who cannot reach hands the turn
 *    to one of them from the bench, or banks it.
 *
 * ## Sinspawn Genais and the Core (link 3)
 *
 * 6. **Genais first, with physicals, until it shells** (§8 row 4, [verified: 3 sources]): magic at Genais out
 *    of its shell draws Waterga on the caster (§5.3.1 item 2), and magic at the Core is absorbed while Genais
 *    lives (item 7). **Then Fire and Piercing into the shell** (Genais is weak to Fire, §2.2). Every member of
 *    the preset has Piercing (§7.2), so Armored does not stop them.
 * 7. **Then the Core**: Armor Break and Mental Break, and everything at it (§3.3; §8 row 6 is the other kill
 *    order, the Core while Genais stands, which the bench measures rather than this line).
 *
 * **Not built here, named:** the Silence Grenade answer to Waterga (§8 row 4) is not in the preset's bag, and
 * Wakka's Silence Buster lasts one turn (§2.3); shielding an aeon through the Core's Gravija (§8 row 5) and the
 * Reflect line against the Core's counters (row 7) are left to the bench's variants (plan §5).
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import {
  SIN_CORE_ID,
  SIN_FIN_CHARGED,
  SIN_FIN_IDS,
  SIN_GENAIS_ID,
  SIN_GENAIS_SHELLED,
  SIN_LEFT_FIN_ID,
  SIN_RIGHT_FIN_ID,
} from '../../battle/ffx/ai/sin-ids.ts';
import { type Tactic, activeParty, aim, has, revive, row } from './common.ts';
import {
  SIN_ORDER_OWNERS,
  cidActsFirst,
  flagTrue,
  foe,
  logCount,
  orderQueued,
  orderRow,
  rangeOf,
  sinCare,
  sinHarmless,
  swingAt,
} from './sin-common.ts';

/** Every boss id Chapter XVII fields, in link order (the guide's `bossIds` are the same four). */
export const SIN_FINS_CORE_BOSS_IDS: readonly CombatantId[] = [SIN_LEFT_FIN_ID, SIN_RIGHT_FIN_ID, SIN_GENAIS_ID, SIN_CORE_ID];

/** §4: the members whose swings cross the gap at FAR (Wakka's ranged weapon, Lulu's Blk Magic). */
const REACH: readonly CombatantId[] = ['wakka', 'lulu'];

/**
 * **AUTHORED, the bench's sensible line** (`tests/unit/helpers/sinFinsPolicies.ts`: MAX_TRIPS, MENTAL_TRIES, BREAK_MP):
 * at most two Close in trips per Fin, at most two Mental Break casts per Fin, and a Break costs 12 MP. The Fin's
 * Negation counter strips the Breaks again, so a line that walks the ship in and out until both Breaks stick spends
 * the whole bag and every MP on the Fins (round 19: 8 trips a Fin on the card against the bench's 2).
 */
const MAX_TRIPS = 2;
const MENTAL_TRIES = 2;
const BREAK_MP = 12;
/** What a dry Auron drinks to afford a Break (the carried seam leaves him at 4 to 16 MP, `docs/plans/sin-fins-core-bench.md`). */
const MP_DRINKS = ['Ether', 'Turbo Ether', 'Elixir'] as const;

/** Armor Break, then Mental Break (twice at most), on `target` when it still lacks them; a dry Auron drinks first. */
function breaks(commands: AvailableCommand[], target: AnyCombatant, engine: BattleEngine, actor: AnyCombatant | undefined): Command | null {
  const mentalCasts = logCount(engine.state(), (e) => e.abilityId === 'mental-break');
  for (const [label, status] of [['Armor Break', 'armor-break'], ['Mental Break', 'mental-break']] as const) {
    if (has(target, status)) continue;
    if (status === 'mental-break' && mentalCasts >= MENTAL_TRIES) continue;
    const r = row(commands, [label], target.id);
    if (r) return aim(r, target.id);
    if (actor?.id === 'auron' && actor.mp < BREAK_MP) {
      const drink = row(commands, MP_DRINKS, actor.id);
      if (drink) return aim(drink, actor.id);
    }
  }
  return null;
}

/** §8 row 3: Protect on the centre member, Haste on one (a reach first). */
function negationSafeSetup(commands: AvailableCommand[], engine: BattleEngine, living: AnyCombatant[]): Command | null {
  const centreId = engine.state().activeIds[1];
  const centre = living.find((c) => c.id === centreId);
  if (centre && !has(centre, 'protect')) {
    const r = row(commands, ['Protect'], centre.id);
    if (r) return aim(r, centre.id);
  }
  if (!living.some((c) => has(c, 'haste'))) {
    const pick = living.find((c) => REACH.includes(c.id)) ?? living[0];
    const r = pick ? row(commands, ['Haste'], pick.id) : undefined;
    if (r && pick) return aim(r, pick.id);
  }
  return null;
}

/** At FAR, a member who reaches nothing trades places with a benched reach (a switch costs no turn). */
function benchReach(commands: AvailableCommand[], party: AnyCombatant[], actorId: CombatantId, tripNeeded: boolean): Command | null {
  if (REACH.includes(actorId)) return null;
  // Yuna and Auron stay while a trip for the Breaks is still to be made (Auron owns them, Yuna keeps the party up on the
  // way in); once the trips are made, or Armor Break is on, the bench's sensible line plays Tidus, Wakka and Lulu at FAR
  // (`sinFinsPolicies.ts#wanted`), which is the only damage that crosses the gap.
  if ((actorId === 'yuna' || actorId === 'auron') && tripNeeded) return null;
  // Somebody must stay who can give Cid an order.
  const ownerStays = party.some((c) => c.alive && c.id !== actorId && SIN_ORDER_OWNERS.includes(c.id));
  if (SIN_ORDER_OWNERS.includes(actorId) && !ownerStays) return null;
  const r = commands.find(
    (c) => c.enabled && c.command.kind === 'switch' && REACH.some((id) => c.label.toLowerCase() === id),
  );
  return r ? r.command : null;
}

function finTurn(
  actorId: CombatantId,
  commands: AvailableCommand[],
  engine: BattleEngine,
  party: AnyCombatant[],
  living: AnyCombatant[],
  fin: AnyCombatant,
): Command | null {
  const range = rangeOf(engine);
  const owner = SIN_ORDER_OWNERS.includes(actorId);
  const queued = orderQueued(engine);
  const charged = flagTrue(engine, SIN_FIN_CHARGED);
  const trips = logCount(engine.state(), (e) => e.command.kind === 'trigger' && e.command.id === 'close-in');
  const armored = has(fin, 'armor-break');
  // Done breaking: Armor Break on, and Mental Break on or tried twice (the sensible line's `brokenBoth`).
  const broken = armored && (has(fin, 'mental-break') || logCount(engine.state(), (e) => e.abilityId === 'mental-break') >= MENTAL_TRIES);
  const tripNeeded = !armored && trips < MAX_TRIPS;

  // 2. The core is charging and the ship is close: pull back, if Cid can still fly it first.
  if (charged && range === 'near' && owner && !queued) {
    const pull = orderRow(commands, 'pull-back');
    if (pull && cidActsFirst(engine, fin.id, aim(pull))) return aim(pull);
  }
  // 3. Close in to Break, Break, then back out.
  if (range === 'far' && !charged && tripNeeded && owner && !queued) {
    const close = orderRow(commands, 'close-in');
    if (close) return aim(close);
  }
  if (range !== 'far') {
    const brk = breaks(commands, fin, engine, party.find((c) => c.id === actorId));
    if (brk) return brk;
  }
  if (range === 'near' && broken && !charged && owner && !queued) {
    const pull = orderRow(commands, 'pull-back');
    if (pull) return aim(pull);
  }
  // 4. The Negation-safe setup, at FAR.
  if (range === 'far') {
    const setup = negationSafeSetup(commands, engine, living);
    if (setup) return setup;
  }
  // 5. Swing with whatever reaches; at FAR, hand the turn to a reach, or bank it.
  const swing = swingAt(commands, fin.id);
  if (swing) return swing;
  return (range === 'far' ? benchReach(commands, party, actorId, tripNeeded) : null) ?? sinHarmless(commands, living);
}

/**
 * Link 3's front row, the bench's sensible line (`sinFinsPolicies.ts#wanted`): Tidus, Auron and Yuna while Genais is
 * out and for the Core; Tidus, Yuna and Lulu while it is shelled (only Lulu's Fire answers the shell, rule 6b). A member who
 * is not wanted trades places with a wanted one on the bench (a switch costs no turn).
 */
function swapForPhase(commands: AvailableCommand[], engine: BattleEngine, actorId: CombatantId, shelled: boolean, genaisUp: boolean): Command | null {
  const want: readonly CombatantId[] = genaisUp && shelled ? ['tidus', 'yuna', 'lulu'] : ['tidus', 'auron', 'yuna'];
  if (want.includes(actorId)) return null;
  const s = engine.state();
  const missing = want.find((id) => !s.activeIds.includes(id) && s.reserveIds.includes(id) && s.combatants[id]?.alive === true);
  if (!missing) return null;
  const r = commands.find((c) => c.enabled && c.command.kind === 'switch' && c.label.toLowerCase() === missing);
  return r ? r.command : null;
}

function genaisCoreTurn(commands: AvailableCommand[], engine: BattleEngine, living: AnyCombatant[], party: AnyCombatant[], actorId: CombatantId): Command | null {
  const genais = foe(engine, SIN_GENAIS_ID);
  const core = foe(engine, SIN_CORE_ID);
  const moved = swapForPhase(commands, engine, actorId, flagTrue(engine, SIN_GENAIS_SHELLED), genais !== undefined);
  if (moved) return moved;
  if (genais) {
    const shelled = flagTrue(engine, SIN_GENAIS_SHELLED);
    if (shelled) {
      // 6b. Fire and Piercing into the shell (Fire weakness, §2.2; Armored is no wall to Piercing, §7.2).
      const fire = row(commands, ['Firaga', 'Fira', 'Fire'], genais.id);
      if (fire) return aim(fire, genais.id);
      const swing = swingAt(commands, genais.id, { magic: false });
      if (swing) return swing;
    } else {
      // 6a. Physicals only while it is out: a spell at it draws Waterga on the caster.
      const swing = swingAt(commands, genais.id, { magic: false });
      if (swing) return swing;
    }
    return sinHarmless(commands, living);
  }
  if (core) {
    const brk = breaks(commands, core, engine, party.find((c) => c.id === actorId));
    if (brk) return brk;
    const swing = swingAt(commands, core.id);
    if (swing) return swing;
  }
  return sinHarmless(commands, living);
}

export const sinFinsCore: Tactic = (actorId, commands, engine) => {
  const party = activeParty(engine);
  if (!party.some((c) => c.id === actorId)) return null;
  const living = party.filter((c) => c.alive);

  // 1. Revive, cure, heal.
  const up = revive(commands, party);
  if (up) return up;
  const care = sinCare(commands, living);
  if (care) return care;

  const fin = SIN_FIN_IDS.map((id) => foe(engine, id)).find((c): c is AnyCombatant => c !== undefined);
  if (fin) return finTurn(actorId, commands, engine, party, living, fin);
  return genaisCoreTurn(commands, engine, living, party, actorId);
};

export default sinFinsCore;
