/**
 * The intended line for **Seymour + Anima, Macalania Temple** — the FFX
 * tutorial chapter.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Every rule below cites
 * `research/ffx-seymour-anima-macalania.md` §7, which is a table of strategies
 * a *published guide* actually recommends, not heuristics that happen to win.
 *
 * A tactic sees the live state and the rows the engine offered; it never
 * invents a command, only chooses among legal ones, and returns `null` to fall
 * through to the generic ladder in `BattlePresenterStrategies.ts`.
 *
 * ---
 *
 * ## The line, act by act
 *
 * **Act one — the Guardians are a support problem, not a damage problem.**
 * Their Thunder/Blizzard is ~110–140 against Seymour's ~715, and the number
 * that matters is the other one: **every hit on a Guardian triggers a 1,000 HP
 * Auto-Potion counter until you Steal**, so at this party's Strength a Guardian
 * out-heals four consecutive attacks (§6.2). So:
 * 1. **Steal from each Guardian once** (§7 row 1). Two turns, and it removes
 *    2,000+ HP of healing from the boss — the cleanest possible demonstration
 *    of why a non-damage command matters.
 * 2. **Petrify them** (§7 row 2). A petrified monster always shatters. It costs
 *    the overkill AP and it is worth it, because they cannot be out-damaged.
 * 3. **Poison Seymour** (§7 row 8) for 600 a turn — 10 % of his bar, the
 *    largest proportional poison in any chapter this project has researched.
 *    Poison Fang lands at chance 254, straight through his resistance byte of
 *    40. This only pays once the Guardians are **dead**: Steal does *not*
 *    disable their Remedy (§2.3), so stealing alone leaves the poison cured.
 *
 * **Act two — an aeon, because Pain cannot kill one.** Pain's 100 % Death rider
 * fails against the hidden Aeon Ribbon, so the same action that kills a party
 * member merely hurts an aeon (§4.3, §5.1). The party's whole job is to keep
 * *something* on the field that Anima cannot delete:
 * 4. **Summon** (§7 row 11), fullest gauge first, so the aeon can Overdrive on
 *    or near arrival.
 * 5. **Shield before Oblivion** (§7 row 12): ÷4 damage, and the telegraph is her
 *    own gauge, which the HUD already shows.
 * 6. **Save the Overdrive for a Boost turn** (§7 row 14). She hands the player a
 *    ×1.5 window every other turn; landing Diamond Dust off-Boost costs a third
 *    of that damage.
 *
 * **Act three — the finale the whole fight has been teaching.** One Multi- hit
 * is close to lethal on the mages and there are two a turn (§6.4). The answer
 * is the published element order:
 * 7. **Pre-cast the matching Nul** (§7 row 5) on his *next* element, which
 *    `macalaniaNextElement` reads straight off the engine's own cycle counter.
 * 8. **Shell** what the Nul cannot cover. Our `nulfrost` and friends ship as
 *    `single-ally`, so one cast protects one member against a spell that picks
 *    a random one — see the note on {@link nulRow}.
 *
 * ## What this line deliberately does **not** do
 *
 * - It never aims magic at a Guardian while it still has potions: a Lulu
 *   Blizzara into a full-pouch Guardian feeds the 1,000 HP counter under the
 *   owner-approved "any damage" reading of C-11.
 * - It never tries to finish Seymour in act one. He is clamped to 5,999 a hit
 *   and floored at 1 HP until the summon; spending turns on him past 3,000 is
 *   spending them on nothing.
 */

import { type Tactic, aim, activeParty, cheerUp, has, hpFraction, revive, row } from './common.ts';
import {
  ANIMA_ID,
  SEYMOUR_MACALANIA_ID,
  act,
  aeonLine,
  bestSummon,
  livingGuardians,
  nextElement,
  nulRow,
  shellRow,
  unrobbedGuardian,
} from './seymour-anima-macalania-helpers.ts';

export { SEYMOUR_MACALANIA_ID };

export const seymourAnimaMacalania: Tactic = (actorId, commands, engine) => {
  const s = engine.state();
  const actor = s.combatants[actorId];
  if (!actor) return null;

  if (actor.side === 'aeon') return aeonLine(commands, engine, actorId);

  const phase = act(engine);
  const party = activeParty(engine);
  const living = party.filter((c) => c.alive);

  // 0. **Act two is an aeon duel, and the summon outranks everything.**
  //
  //    This sits above the revive for a measured reason. Pain carries a 100 %
  //    Death rider, so on a party member it is not damage, it is a kill — and
  //    a party that answers a kill with a Phoenix Down is trading one turn for
  //    one turn against a boss with 18,000 HP. A summon takes the whole party
  //    off-stage with frozen counters, so the KO'd member stops mattering
  //    until the aeon leaves, and what stands in their place is the one thing
  //    Pain cannot kill [§4.3, §5.1, §7 row 11].
  //
  //    Measured before this branch existed (seeds 1-8, everything else held
  //    still): **zero summons in the whole of act two** on every seed, because
  //    Yuna is the only summoner and the revive and Nul rules above had her
  //    spending every turn. One win in eight, and the wins that came close
  //    stalled with Anima on ~1,700.
  //    **Act three too, and for a sourced reason.** §7 row 16 / C-5: a Shiva
  //    Overdrive banked out of act two deletes Seymour's second bar, because
  //    the gauge persists through a dismissal and is only zeroed by a KO
  //    [ffx-combat-core §6.5]. The engine does that for free. An aeon in act
  //    three is also the only body in the party that survives a Multi- turn
  //    intact, and while it holds the field the party's counters are frozen.
  if (phase >= 2 && s.aeonId === null) {
    const summon = bestSummon(commands, engine);
    if (summon) return summon;
  }

  // 1. Somebody is on the floor. Pain KOs outright, so this fires often.
  const up = revive(commands, party);
  if (up) return up;

  // 2. §5.5 — the Trigger Command, once each. Tidus +10 Strength, Yuna and
  //    Wakka +10 Magic Defense [verified: 2 sources]. Worth roughly 6-8 % off
  //    every -ra hit; the right size for a tutorial, a visible reward for
  //    reading rather than a solved fight.
  const talk = row(commands, ['Talk']);
  if (talk && phase === 1) return aim(talk);

  // 2b. §7 row 7 — **Magic Break Seymour**, which is act three's real answer.
  //     Two hits of ~1,700 a turn against 850-1,900 HP bars is the difficulty
  //     spike of the encounter (§6.4), and the Breaks are how a guide answers
  //     it: Auron's Magic Break lands at 50/101 against his resistance byte of
  //     50, and **Banishing Blade applies all four at chance 254**, which
  //     bypasses that resistance entirely [§1.3, verified: 2 sources].
  //
  //     Auron is on the bench by design — §8 puts Tidus / Yuna / Rikku on the
  //     field because two of the three Talk lines and every one of Steal, the
  //     Nul spells and the summon live there — so §7 row 7 costs a Switch. The
  //     incoming member takes the turn that is happening right now, so the
  //     switch is never made on **Yuna's** turn: she is the only summoner and
  //     the only Nul caster, and trading her for a second attacker loses more
  //     than the Breaks win.
  if (phase === 3) {
    const seymour = s.combatants[SEYMOUR_MACALANIA_ID];
    if (seymour && !has(seymour, 'magic-break')) {
      const breaks = row(commands, ['Banishing Blade', 'Magic Break'], SEYMOUR_MACALANIA_ID);
      if (breaks) return aim(breaks, SEYMOUR_MACALANIA_ID);
      if (actorId !== 'yuna') {
        const auron = commands.find((c) => c.enabled && c.command.kind === 'switch' && c.label === 'Auron');
        if (auron) return aim(auron);
      }
    }
  }

  // 2c. **Shell outranks the Nul in act three**, and only in act three.
  //
  //     One Shell halves *every* element for its whole duration; one Nul stops
  //     *one* hit of *one* element on *one* member, because our Nul rows ship
  //     `single-ally` (see {@link nulRow}). In acts one and three Yuna is the
  //     only caster of both, so the order between them is the whole of what
  //     she does — and at two hits a turn the halving is worth more than the
  //     nullification it displaces. In act one, where a single -ra hit is
  //     survivable, the Nul keeps priority because zero beats half.
  if (phase === 3) {
    const shell = shellRow(commands, engine);
    if (shell) return shell;
  }

  // 2d. §7 row 10 — **Haste the party**, and §6 of every chapter's tactic —
  //     Cheer. Both are act-one work and both are still on the board in act
  //     three, which is the point: act one is the only stretch of this fight
  //     with turns to spare, because a -ra hit is ~715 against bars of
  //     850-1,265 while a Multi- hit is ~1,700 with two a turn (§6.1, §6.4).
  //
  //     This is what the act-one turns are *for*. Measured: act one collapses
  //     to seven decisions once the Guardians are gone and a Poison Fang has
  //     taken 2,000 off a 6,000 bar, and a party that arrives in act three
  //     that early arrives with nothing banked.
  if (phase === 1) {
    const hasted = living.filter((c) => has(c, 'haste'));
    if (hasted.length < living.length) {
      const slowest = living.filter((c) => !has(c, 'haste'))[0];
      const haste = row(commands, ['Haste'], slowest?.id);
      if (haste && slowest) return aim(haste, slowest.id);
    }
    const cheer = cheerUp(commands, actor, living);
    if (cheer) return cheer;
  }

  // 3. §7 row 5 — pre-cast the matching Nul on his published next element.
  //    This is the chapter's lesson and it is cheap: 2 MP against Yuna's 180.
  //
  //    **Acts one and three only.** In act two Seymour's only scheduled action
  //    is a zero-hit no-op and Anima's Pain is non-elemental, so there is no
  //    elemental hit to null — measured, Yuna spent four of act two's fifteen
  //    turns casting NulBlaze at a boss that was not going to cast anything.
  if (phase !== 2) {
    const nul = nulRow(commands, engine, nextElement(engine));
    if (nul) return nul;
  }

  // 4. Cure somebody who is one hit from dead. The thresholds are deliberately
  //    high because a single hit is a large fraction of these bars: a -ra spell
  //    is ~715 against 850-1,265 HP in act one, and a Multi- hit is ~1,700 with
  //    two a turn in act three (§6.1, §6.4). "Below half" is already inside
  //    lethal range in both.
  const hurt = living.filter((c) => hpFraction(c) < (phase === 3 ? 0.65 : 0.45)).sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (hurt) {
    const heal = row(commands, ['X-Potion', 'Cura', 'Hi-Potion', 'Cure', 'Potion'], hurt.id);
    if (heal) return aim(heal, hurt.id);
  }

  if (phase === 1) {
    const guardians = livingGuardians(engine);

    // 5. §7 row 1 — Steal once from each Guardian. Auto-Potion out-heals four
    //    consecutive attacks until this happens, so it comes before damage.
    const robbable = unrobbedGuardian(engine);
    if (robbable) {
      const steal = row(commands, ['Steal'], robbable);
      if (steal) return aim(steal, robbable);
    }

    // 6. §7 row 2 — Petrify them. A petrified monster always shatters, and
    //    they cannot be out-damaged through 1,000 HP counters.
    if (guardians.length > 0) {
      const petrify = row(commands, ['Petrify Grenade', 'Stone Breath']);
      if (petrify) return aim(petrify, guardians[0]);
    }

    // 7. §7 row 8 — Poison him for 600 a turn, but only once the Guardians are
    //    dead: Steal does **not** disable their Remedy (§2.3, §14 row 1), so
    //    poisoning a Seymour with living Guardians buys one cured turn.
    const seymour = s.combatants[SEYMOUR_MACALANIA_ID];
    if (guardians.length === 0 && seymour && !has(seymour, 'poison')) {
      const fang = row(commands, ['Poison Fang'], SEYMOUR_MACALANIA_ID);
      if (fang) return aim(fang, SEYMOUR_MACALANIA_ID);
    }

    // 8. Otherwise swing. While a Guardian stands, Cover sends a physical at
    //    Seymour onto the Guardian anyway, which is the point of the mechanic.
    const target = guardians[0] ?? SEYMOUR_MACALANIA_ID;
    const attack = commands.find((c) => c.enabled && c.command.kind === 'attack');
    return attack ? aim(attack, target) : null;
  }

  // 9b. A party Overdrive, spent on the boss standing opposite. Tidus opens at
  //     42 % and Rikku at 37 % (§8.6), so these come up once or twice a fight
  //     and are worth more than the swing they replace.
  const partyTarget = phase === 2 ? ANIMA_ID : SEYMOUR_MACALANIA_ID;
  const od = commands.find(
    (c) => c.enabled && c.command.kind === 'overdrive' && c.label !== 'Grand Summon' && c.validTargets.includes(partyTarget),
  );
  if (od) return aim(od, partyTarget);

  // 10. Damage. Seymour is Magic Defense 25 and Shelled from the opening, so
  //     physical is the honest line for this party; Anima is Defense 0 **and**
  //     Magic Defense 0, so anything lands on her.
  const target = phase === 2 ? ANIMA_ID : SEYMOUR_MACALANIA_ID;
  const spell = row(commands, ['Blizzara', 'Thundara', 'Watera', 'Fira'], target);
  if (phase === 2 && spell) return aim(spell, target);
  const attack = commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(target));
  if (attack) return aim(attack, target);

  const anyAttack = commands.find((c) => c.enabled && c.command.kind === 'attack');
  return anyAttack ? aim(anyAttack) : null;
};

export default seymourAnimaMacalania;
