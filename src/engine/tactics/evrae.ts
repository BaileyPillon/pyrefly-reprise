/**
 * The intended line for **Evrae, on the deck of the *Fahrenheit***.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Every rule below cites
 * `research/ffx-evrae-airship.md` §8, which is a table of strategies published
 * guides actually recommend, not heuristics that happen to win.
 *
 * A tactic sees the live state and the rows the engine offered; it never
 * invents a command, only chooses among legal ones, and returns `null` to fall
 * through to the generic ladder in `BattlePresenterStrategies.ts`.
 *
 * ---
 *
 * ## The thesis, and why it is hard to encode
 *
 * **The turn you do not spend is the turn that does the most damage.** A good
 * party turn in phase 1 is worth 350-900; Cid's volley is worth ~2,400 and
 * costs no party turn at all (§7.4). The arithmetic says: pull back, let Cid
 * work, and come in only to do something a ranged character cannot.
 *
 * And then §4.5 takes the answer away. In phase 2, **targeting Evrae at all
 * while the ship is away makes it Swoop and close**, so the Poison Breath dodge
 * fails *because you attacked*. The correct play, at the one moment it matters
 * most, is **to do nothing, visibly, on purpose** — which is rule 2 below and
 * the single hardest thing in this file to encode, because every auto-battler
 * ever written wants to fill a turn.
 *
 * ## The line, in priority order
 *
 * 1. **Revive, then un-petrify, then heal — all three with the same command.**
 *    The Al Bhed Potion is rank 2, party-wide, exactly 1,000 HP, and cures
 *    Poison, Silence **and Petrification** (§6.4). With no Yuna there is no
 *    other heal, and a petrified member is one Swooping Scythe from being
 *    permanently gone, bench slot and all (§3.3 note 3). **"Rikku is not
 *    optional in this chapter."**
 * 2. **While a breath is charged and the ship is away: do not touch it.**
 *    §4.5. Buff or heal instead (`./evrae-quiet.ts`). This is the rule the chapter exists for.
 * 3. **Dodge the breath.** Inhale seen at NEAR, no order queued, and an order
 *    owner has the turn → pull back. The dodge is a **race between two CTB
 *    counters**, not a button: Cid has to get a turn between the Inhale and the
 *    breath, and in the Haste phase he often will not.
 * 4. **Stay out through phase 1.** FAR is the only state Cid can fire from, and
 *    Photon Spray costs a third of what the NEAR cycle does (§7.2). Phase 2 is
 *    excluded: once Swooping Scythe is live every attack drags the ship back,
 *    so re-ordering it out would spend every order owner's turn on a boolean
 *    the next attack undoes.
 * 5. **Rotate the bench three times**, and each rotation is one switch and no
 *    turn: **Lulu in for reach** while the bar is high, **Rikku back** for the
 *    Reflect window, **Auron in** once Reflect is up. The middle step is the
 *    one that is not obvious, and the last step is forced — see the comments
 *    at the rules themselves.
 * 6. **Slow while it is still un-Hasted** (§6.3). Recovery 30 → 60 and +100 %
 *    of the pending counter — close to a doubled action economy. Cast
 *    **before** Reflect, and never into a Reflected Evrae.
 * 7. **Reflect on Evrae** as the bar nears 1/3 (§6.5, C-14). It denies the
 *    self-Haste *and* converts it: the bounce lands on a random living party
 *    member. One cast, and it lasts the battle.
 * 8. **Dark Buster, then Power Break** (§6.1, §6.2). Between them they blunt
 *    two of the four NEAR-cycle turns and halve what is left. Note the
 *    asymmetry §6.1 insists on: Darkness blanks **Attack** and does **not**
 *    blank Swooping Scythe.
 * 9. **Cheer, then Haste, at range** (§8 row 3, §4.3), because the FAR state is
 *    the setup zone, not a dead zone.
 * 10. **Swing with whatever reaches** — Lulu's Blk Magic and Wakka's blitzball,
 *    and at NEAR everything.
 *
 * ## What this line deliberately does **not** do
 *
 * - It never aims an **elemental spell at an elemental weakness**, because
 *   there is not one: all four are halved and holy is neutral (§1.2). The
 *   `-ra` tier is picked on base power alone.
 * - It never casts a **reflectable** row at a Reflected Evrae. §6.5 names the
 *   cost of the Reflect line as "Lulu's spells bouncing back onto your own
 *   party", and measured it is the largest single source of self-inflicted
 *   damage in this chapter — 5,312 in one battle, more than Evrae's own melee
 *   dealt in the same fight.
 * - It never spends a turn on **Bio, Demi, Poison Fang, Silence, Sleep,
 *   Petrify, Zombie, Death, Berserk, Provoke, Magic Break, Armor Break, Eject
 *   or Bribe** — §6.6's list of things that do nothing to this monster.
 * - It never **Steals** at range and never uses an offensive item at range;
 *   neither reaches (§4.3), and the engine will not offer them.
 *
 * ## Measured, and short of the bar
 *
 * **21 of 40 contiguous seeds, 52.5 %.** §9's target is 90 %. The number is
 * reported rather than engineered, and **no boss number was touched**
 * [AGENTS.md hard rule 6; `memory/boss-side-fix-needs-measured-options`]. The
 * tuning history and the measured cause are in
 * `docs/handoff/chapter-evrae-engine.md` and in
 * `tests/unit/strategy-evrae.test.ts`.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, aim, activeParty, has, hpFraction, revive, row, stacksOf } from './common.ts';
import { benchReach, harmlessTurn } from './evrae-quiet.ts';

/** The boss combatant id `tacticFor` keys this encounter on. */
export const EVRAE_ID = 'evrae';

/** §4.2 [verified: 3 sources] — Tidus and Rikku, and only them. */
const ORDER_OWNERS: readonly CombatantId[] = ['tidus', 'rikku'];

/** Mirrors `battle/ffx/ai/evrae-rules.ts`; the tactic reads only published state. */
const F_RANGE = 'airship.range';
const F_ORDER = 'airship.order';
const F_BREATH = 'airship.breathCharged';
const F_PHASE = 'airship.phase';

/**
 * **AUTHORED, and measured.** Heal when the weakest active is below this, or
 * the moment anybody is petrified.
 *
 * It is high on purpose. Poison Breath is ~1,500 to all three at once and the
 * Al Bhed Potion restores exactly 1,000 (§6.4, §7.2), so a member at 60 % of a
 * 1,265 bar is already dead to the next breath. Measured at 0.45 the line
 * healed nine times in a hundred-turn fight and lost the fights it lost in
 * phase 2 with Evrae under 9,000; the threshold is the difference between
 * "healing" and "reviving".
 */
const HEAL_AT = 0.55;

/**
 * …and heal pre-emptively when **two** actives are worn down, not just when one
 * is spiking.
 *
 * Measured, and the reason it is not higher: at 0.78 the line spent sixteen of
 * thirty-four turns on Al Bhed Potions and lost with Evrae still on 16,941. A
 * 1,000 HP party heal against a 1,500 HP party hit is a losing trade unless it
 * is buying a turn that would otherwise be a death.
 */
const HEAL_PARTY_AT = 0.55;

/**
 * §6.5 — put Reflect up before the bar reaches 1/3 (10,667 of 32,000 = 0.333),
 * and not a turn earlier, because Reflect closes down {@link Slow}.
 *
 * Measured: the window has to be wide. At 0.45 the reflecting character was
 * often already on the bench when it opened and the self-Haste landed on every
 * seed that reached phase 2.
 */
const REFLECT_AT = 0.55;

function flagStr(engine: BattleEngine, key: string): string {
  const v = engine.state().flags[key];
  return typeof v === 'string' ? v : '';
}

function flagNum(engine: BattleEngine, key: string, fallback: number): number {
  const v = engine.state().flags[key];
  return typeof v === 'number' ? v : fallback;
}

function flagBool(engine: BattleEngine, key: string): boolean {
  return engine.state().flags[key] === true;
}

function isFar(engine: BattleEngine): boolean {
  return flagStr(engine, F_RANGE) === 'far';
}

function orderQueued(engine: BattleEngine): boolean {
  const v = flagStr(engine, F_ORDER);
  return v === 'far' || v === 'near';
}

/** A Trigger Command row, found by the command it submits rather than its label. */
function orderRow(commands: AvailableCommand[], id: string): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === 'trigger' && c.command.id === id);
}

function evraeOf(engine: BattleEngine): AnyCombatant | undefined {
  return engine.state().combatants[EVRAE_ID];
}

/** The party heal, and the only one this chapter has [§6.4]. */
function alBhedPotion(commands: AvailableCommand[]): Command | null {
  const r = row(commands, ['Al Bhed Potion', 'X-Potion', 'Mega-Potion', 'Hi-Potion', 'Potion']);
  return r ? aim(r) : null;
}

export const evrae: Tactic = (actorId, commands, engine) => {
  const party = activeParty(engine);
  const actor = party.find((c) => c.id === actorId);
  if (!actor) return null;
  const living = party.filter((c) => c.alive);
  const boss = evraeOf(engine);
  if (!boss) return null;

  const far = isFar(engine);
  const charged = flagBool(engine, F_BREATH);
  const phase = flagNum(engine, F_PHASE, 1);
  const isOwner = ORDER_OWNERS.includes(actorId);

  // 1. Revive, un-petrify, heal. One command does all three.
  const reviveCmd = revive(commands, party);
  if (reviveCmd) return reviveCmd;

  const petrified = living.some((c) => has(c, 'petrify'));
  const hurt = living.some((c) => hpFraction(c) < HEAL_AT);
  const worn = living.length >= 2 && living.filter((c) => hpFraction(c) < HEAL_PARTY_AT).length >= 2;
  if (petrified || hurt || worn) {
    const heal = alBhedPotion(commands);
    if (heal) return heal;
  }

  // 2. **Do nothing, on purpose.** A charged breath plus a pulled-back ship is
  //    a dodge in progress; naming Evrae now makes it Swoop, close, and breathe
  //    [§4.5, the best rule in the encounter].
  if (charged && far) {
    const quiet = harmlessTurn(commands, living);
    if (quiet) return quiet;
  }

  // 3. Dodge the breath: it is charging and we are still in range of it.
  if (charged && !far && !orderQueued(engine) && isOwner) {
    const pull = orderRow(commands, 'pull-back');
    if (pull) return aim(pull);
  }

  // 4. Stay out. The opening move of the whole fight is pulling back [§8 row 1,
  //    Jegged's first instruction], and FAR stays the right side of the sky for
  //    the whole of phase 1: it is the only state Cid can work from, and Photon
  //    Spray (~824 spread across three) is a third of what the NEAR cycle costs.
  //
  //    **Phase 2 is excluded on purpose.** Once Swooping Scythe is live, every
  //    attack drags the fight back to NEAR (§5.5), so re-ordering the ship out
  //    each time would spend an order owner's every turn on a boolean that the
  //    next attack undoes. In phase 2 the only order worth a turn is rule 3's
  //    dodge.
  if (!far && !orderQueued(engine) && isOwner && phase === 1) {
    const pull = orderRow(commands, 'pull-back');
    if (pull) return aim(pull);
  }

  // 5. Bring the reach on. Lulu's Blk Magic is the party's second reach and,
  //    halved and all, it out-damages every physical row that crosses the gap
  //    (§7.4: an `-ra` at MAG 32 is ~578 after the x0.5, against Wakka's ~360).
  //    §3.1 of the preflight: "the fight expects her to be swapped in at FAR",
  //    and a switch costs no turn — the incoming member takes the one happening
  //    now [ffx-combat-core §1.7]. Rikku is the one who leaves: her Steal and
  //    her offensive items do not reach anyway, and the Al Bhed Potions are an
  //    item, usable by anybody.
  //
  //    **Gated on Reflect being up**, and that gate is the whole of a measured
  //    regression: Rikku is the only member who owns Reflect, so switching her
  //    out before she has cast it means the 1/3-HP self-Haste lands on every
  //    seed that reaches phase 2. Measured without the gate: 1 win in 40.
  //
  //    **Reflect and Lulu are mutually exclusive, and the research says so.**
  //    §6.5's Reflect line costs "Lulu's spells bouncing back onto your own
  //    party", and measured that is not a figure of speech: with her casting
  //    into a Reflected Evrae the party took **5,312** damage from its own
  //    Watera on one seed and 4,367 on another, which is more than Evrae's
  //    melee dealt in the same battle. So the bench rotates in three steps,
  //    each of them one switch and none of them a turn (the incoming member
  //    takes the turn happening now [ffx-combat-core §1.7]):
  //
  //    **(a) Lulu, for reach, while the bar is still high.** Halved and all,
  //    an `-ra` at MAG 32 is ~578 against Wakka's ~360 (§7.4), and she is the
  //    only other thing that crosses the gap.
  if (
    far &&
    actorId === 'rikku' &&
    !has(boss, 'reflect') &&
    hpFraction(boss) >= REFLECT_AT &&
    !party.some((c) => c.id === 'lulu')
  ) {
    const bench = commands.find((c) => c.enabled && c.command.kind === 'switch' && c.label === 'Lulu');
    if (bench) return bench.command;
  }

  //    **(b) Rikku back, for the Reflect window.** She is the only member who
  //    owns Reflect (§9.4), so she has to be on the field when the bar
  //    approaches 1/3 or the self-Haste lands unopposed. Measured with her
  //    still benched: 1 win in 40.
  if (
    actorId === 'lulu' &&
    !has(boss, 'reflect') &&
    hpFraction(boss) < REFLECT_AT &&
    !party.some((c) => c.id === 'rikku')
  ) {
    const bench = commands.find((c) => c.enabled && c.command.kind === 'switch' && c.label === 'Rikku');
    if (bench) return bench.command;
  }

  //    **(c) Auron, once Reflect is up.** Lulu's reach has just been turned
  //    off by our own buff, her 700 HP bar is a member Poison Breath kills in
  //    two (§9.3), and Auron has been on the bench the whole time with 2,000
  //    HP, the strongest swing in the party and **Power Break**, which halves
  //    both Attack *and* Swooping Scythe (§6.2, verified: 2 sources).
  if (actorId === 'lulu' && has(boss, 'reflect') && !party.some((c) => c.id === 'auron')) {
    const bench = commands.find((c) => c.enabled && c.command.kind === 'switch' && c.label === 'Auron');
    if (bench) return bench.command;
  }

  // 6. Slow, while it is still worth a turn [§6.3 — recovery 30 -> 60 and
  //    +100 % of the pending counter, close to a doubled action economy].
  //    **Cast before Reflect, and never into a Reflected Evrae**: Slow is
  //    `reflectable`, so with Reflect up it would land on our own party. The
  //    order of these two rules is not cosmetic — it is the only window in
  //    which the fight's headline lever can be pulled at all.
  if (phase === 1 && !has(boss, 'slow') && !has(boss, 'reflect') && hpFraction(boss) >= REFLECT_AT) {
    const slow = row(commands, ['Slow'], EVRAE_ID);
    if (slow) return aim(slow, EVRAE_ID);
  }

  // 7. Reflect, once, as the bar approaches 1/3 [§6.5, C-14]. It denies the
  //    self-Haste *and* converts it: the bounce lands on a random living party
  //    member. Cast late, because it closes rule 6 down — but never so late
  //    that the caster is no longer on the field.
  if (phase === 1 && !has(boss, 'reflect') && hpFraction(boss) < REFLECT_AT) {
    const reflect = row(commands, ['Reflect'], EVRAE_ID);
    if (reflect) return aim(reflect, EVRAE_ID);
  }

  // 8. Blunt the melee. Only worth the turns while the melee can actually
  //    happen, i.e. while the ship is close. Darkness blanks **Attack** and
  //    does **not** blank Swooping Scythe (§6.1); Power Break halves both
  //    (§6.2).
  if (!far) {
    if (!has(boss, 'darkness')) {
      const dark = row(commands, ['Dark Buster', 'Dark Attack'], EVRAE_ID);
      if (dark) return aim(dark, EVRAE_ID);
    }
    if (!has(boss, 'power-break')) {
      const brk = row(commands, ['Power Break'], EVRAE_ID);
      if (brk) return aim(brk, EVRAE_ID);
    }
  }

  // 9. Bank the range turns. §4.3: "**Cheer, Focus and every buff still work at
  //    FAR.** So the FAR state is not a dead zone — it is the *setup* zone."
  //    Haste on the one character who can swing from out here is worth more
  //    than any single swing of Tidus's own, which does not reach at all.
  if (stacksOf(actor, 'cheer') < 5) {
    const cheer = row(commands, ['Cheer']);
    if (cheer) return aim(cheer);
  }
  const unhasted = living.find((c) => !has(c, 'haste') && (c.id === 'wakka' || c.id === 'lulu'))
    ?? living.find((c) => !has(c, 'haste'));
  if (unhasted) {
    const haste = row(commands, ['Haste'], unhasted.id);
    if (haste) return aim(haste, unhasted.id);
  }

  // 10. Swing with whatever reaches. At FAR that is Lulu's Blk Magic and
  //     Wakka's blitzball and nothing else; the engine has already disabled the
  //     rest with 'Out of reach'. **No elemental spell is ever aimed at an
  //     elemental weakness here, because there is not one** — all four are
  //     halved (§1.2) — so the `-ra` tier is picked purely on base power.
  //     **Never into a Reflected Evrae.** Every Blk Magic row is `reflectable`,
  //     so a spell cast at a boss the party itself buffed lands on the party —
  //     §6.5 names this as the price of the Reflect line, and it is the single
  //     largest measured source of self-inflicted damage in this chapter.
  if (!has(boss, 'reflect')) {
    const spell = row(
      commands,
      ['Watera', 'Thundara', 'Blizzara', 'Fira', 'Water', 'Thunder', 'Blizzard', 'Fire'],
      EVRAE_ID,
    );
    if (spell) return aim(spell, EVRAE_ID);
  }
  const overdrive = commands.find(
    (c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes(EVRAE_ID),
  );
  if (overdrive) return aim(overdrive, EVRAE_ID);
  const attack = commands.find(
    (c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(EVRAE_ID),
  );
  if (attack) return aim(attack, EVRAE_ID);

  const lancet = row(commands, ['Lancet'], EVRAE_ID); // §4.3: the third reach, not reflectable
  if (lancet) return aim(lancet, EVRAE_ID);
  // Nothing of ours reaches: hand the turn to a reach, or bank it (`./evrae-quiet.ts`).
  return (far ? benchReach(commands, party, actorId, boss) : null) ?? harmlessTurn(commands, living);
};

export default evrae;
