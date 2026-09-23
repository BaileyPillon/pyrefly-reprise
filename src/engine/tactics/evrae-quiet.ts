/**
 * **The turn that does not name Evrae** — the harmless turn of the intended
 * line in `./evrae.ts`, split out for the house 400-line rule.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Chapter 8 is FFX's CTB fight on
 * the deck of the *Fahrenheit*; nothing here is read by an FFX-2 chapter.
 *
 * ## Why this is its own ladder
 *
 * The line needs a quiet turn in two places: rule 2 (a breath is charged and
 * the ship is away, so naming Evrae makes it Swoop and breathe anyway,
 * `research/ffx-evrae-airship.md` §4.5) and the tail of the line (nothing this
 * actor owns reaches at FAR, §4.3). It used to end in **Defend** — and FFX's
 * command window has no Defend entry (`./advisor-menu.ts#pressable`), so the
 * move advisor dropped the line's pick and put its best simulated row on the
 * card instead: most often an early Reflect on Evrae, a Close in, or a swing
 * at a charged Evrae in phase 2, which is the very trap §4.5 describes
 * (`docs/plans/chapter-evrae-finish.md` item a).
 *
 * The research names what a player does with a range turn instead, §4.3:
 * "**Cheer, Focus and every buff still work at FAR.** So the FAR state is not
 * a dead zone — it is the *setup* zone. Tidus stacking Cheer, **Rikku queueing
 * an Al Bhed Potion** […] those all happen at range." So the ladder is every
 * buff that is still worth a stack, then Haste on an ally (§8 row 3), then a
 * heal from the item bag (§6.4, §8 row 2), and only then the engine's Defend,
 * which stays as the last resort for a board where nothing on the menu does
 * anything at all.
 */

import type { AnyCombatant, AvailableCommand, Command } from '../../battle/common/types.ts';
import { aim, has, hpFraction, row, stacksOf } from './common.ts';

/** The engine's stack cap for Cheer, Focus and Aim [ffx-combat-core §2.9]. */
const MAX_STACKS = 5;

/**
 * **AUTHORED, and measured** (`critic/bench/evrae`). A quiet turn spends the
 * party heal only when it is worth one of the 22 in the bag: two members worn,
 * or anybody Poisoned or Petrified (the Al Bhed Potion cures both, §6.4).
 * Below this, a single worn member gets the single-target potion.
 */
const QUIET_PARTY_HEAL_AT = 0.8;

/** Self-stacking party buffs, in the order §4.3 and §8 row 3 name them. */
const STACKING: ReadonlyArray<readonly [label: string, status: string]> = [
  ['Cheer', 'cheer'],
  ['Focus', 'focus'],
  ['Aim', 'aim'],
];

/**
 * All three are party-wide, so a stack is worth a turn while **anybody** on the
 * field is short of the cap — a member just switched in arrives with none.
 */
function stackingBuff(commands: AvailableCommand[], living: AnyCombatant[]): Command | null {
  for (const [label, status] of STACKING) {
    const short = living.filter((c) => stacksOf(c, status) < MAX_STACKS);
    if (short.length === 0) continue;
    const r = row(commands, [label]);
    if (!r) continue;
    // Name a member who is still short of the cap: `aim` alone takes the first
    // valid target, which can already hold five stacks while a member just
    // switched in holds none (tests/unit/chapters/evrae-advisor.test.ts).
    // The buff is party-wide, so a short member outside the row's target list
    // still gains the stack; only then does the row keep its default target.
    const target = short.find((c) => r.validTargets.includes(c.id));
    return target ? aim(r, target.id) : aim(r);
  }
  return null;
}

function hasteAlly(commands: AvailableCommand[], living: AnyCombatant[]): Command | null {
  const unhasted = living.filter((c) => !has(c, 'haste'));
  // The reach first: Wakka and Lulu are the only swings that cross the gap (§4.3).
  const pick = unhasted.find((c) => c.id === 'wakka' || c.id === 'lulu') ?? unhasted[0];
  if (!pick) return null;
  const r = row(commands, ['Haste'], pick.id);
  return r ? aim(r, pick.id) : null;
}

function healFromBag(commands: AvailableCommand[], living: AnyCombatant[]): Command | null {
  const ailing = living.some((c) => has(c, 'poison') || has(c, 'petrify'));
  const worn = living.filter((c) => hpFraction(c) < QUIET_PARTY_HEAL_AT).length >= 2;
  if (ailing || worn) {
    const party = row(commands, ['Al Bhed Potion']);
    if (party) return aim(party);
  }
  const low = [...living].filter((c) => c.hp < c.stats.maxHp).sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (!low) return null;
  const single = row(commands, ['Hi-Potion', 'Potion'], low.id);
  return single ? aim(single, low.id) : null;
}

/**
 * Something to spend a turn on that does **not** name Evrae [§4.5], and that
 * is on FFX's command window. `null` only when the menu has nothing at all.
 */
export function harmlessTurn(commands: AvailableCommand[], living: AnyCombatant[]): Command | null {
  if (living.length > 0) {
    const buff = stackingBuff(commands, living) ?? hasteAlly(commands, living) ?? healFromBag(commands, living);
    if (buff) return buff;
  }
  const defend = commands.find((c) => c.enabled && c.command.kind === 'defend');
  return defend ? defend.command : null;
}

/** §4.2 [verified: 3 sources] — Tidus and Rikku own the orders; one stays on the field. */
const ORDER_OWNERS: readonly string[] = ['tidus', 'rikku'];

/**
 * **Nothing this actor owns reaches: bring on somebody who does** — before
 * the quiet ladder, at the tail of the line only (never on rule 2's charged
 * turn, where the incoming member would take the turn with a reaching row).
 *
 * §4.3 [verified: 2 sources] names the three reaches at FAR — Lulu's Blk
 * Magic, Wakka's blitzball and **Kimahri's Lancet** — and Lancet is not
 * `reflectable`, so unlike Lulu it still lands once Reflect is up on Evrae. A
 * switch costs no turn: the incoming member takes the one happening now
 * [ffx-combat-core §1.7]. Two guards: an order owner always stays on the field
 * (rule 3's dodge needs one), and Rikku leaves only once her Reflect is up
 * (she is the only member who owns it, §9.4).
 */
export function benchReach(
  commands: AvailableCommand[],
  party: AnyCombatant[],
  actorId: string,
  boss: AnyCombatant,
): Command | null {
  if (!ORDER_OWNERS.includes(actorId)) return null;
  if (actorId === 'rikku' && !has(boss, 'reflect')) return null;
  const ownerStays = party.some((c) => c.alive && c.id !== actorId && ORDER_OWNERS.includes(c.id));
  if (!ownerStays) return null;
  const r = commands.find((c) => c.enabled && c.command.kind === 'switch' && c.label === 'Kimahri');
  return r ? r.command : null;
}
