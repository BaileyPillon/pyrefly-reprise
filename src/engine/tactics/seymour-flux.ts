/**
 * Chapter 1 — Seymour Flux and the Mortiorchis, on Mt. Gagazet
 * [research/ffx-seymour-flux.md].
 *
 * This is the file to edit for Chapter 1 and nothing else; the shared reading
 * helpers live in `./common.ts` and the registry in `./index.ts`.
 *
 * **Kill Seymour, not the mount.** The generic strategy aims at a part before
 * the boss it props up (`BattlePresenterStrategies.ts` `bestEnemyTarget`),
 * which is right in three of the five chapters and catastrophically wrong here.
 * Mortiorchis's max HP floors at 1,000 and it revives from every kill for ever
 * (§2.2's correction box), so it is an unbounded, diminishing damage tap —
 * 4,000 / 3,000 / 2,000 / 1,000 / 1,000 … drained out of Seymour — and never a
 * way to remove the adds. Measured with the generic line: four seeds, four
 * wipes, Seymour on a full 70,000 every time and only the mount dented. Every
 * rule below aims at Seymour and only ever touches the mount when nothing
 * legal can reach the host.
 *
 * ## The line, and why it is shaped like this
 *
 * The encounter is a **turn-economy problem wearing a damage problem's
 * clothes**. Both enemy actors are Agility 38 (§1.1, §2) and they act
 * back-to-back, so the party frequently gets no window at all between
 * Seymour's action and the mount's — which is what makes §4.2's cycle so
 * vicious: Lance of Atrophy, Full-Life, Lance of Atrophy, Full-Life, **Dispel,
 * Cross Cleave**, with the strip and the party-wide hit landing with nothing in
 * between. There is no reacting to that pairing. Everything has to already be
 * true when it lands.
 *
 * What has to already be true:
 *
 * 1. **Poison, on turn one** (§6 rows 5-6, which says "Bio on Seymour, **turn
 *    one**"). 2% of 70,000 is 1,400 a turn, flat, for ever; he never removes it
 *    and it does not trigger his HP-threshold reactions (§4.3). Over a fight
 *    this long it is the largest single line in the party's damage budget.
 *    Lulu's Bio is the canonical source and she is on the bench in this preset,
 *    so the actives use the **Poison Fang** §6 row 6 names instead.
 * 2. **Haste** (§6 row 10). `ctb × 8/16` roughly doubles the party's share of
 *    the clock, and it is the CTB margin the Holy Water rhythm needs to beat
 *    the mount's Full-Life. Measured without a repair rule, the party took 27.8
 *    turns to the enemy's 27.9 over forty seeds — a flat 1:1 — because KO
 *    clears Haste and this fight kills somebody every cycle.
 * 3. **Protect, and Cheer to five** (§6 rows 12-13). Cross Cleave is ~2,400 on
 *    all three (§5.2) against preset HP of 2,420 / 1,500 / 2,310 (§7.3,
 *    §7.7.2), so unmitigated it is a wipe from full health. Protect halves it;
 *    Cheer's *defensive* half — physical damage received × (15 − stacks)/15,
 *    §5.5 — takes another third off and stacks with it. §6 row 12 is the only
 *    entry in the whole strategy table the research calls a route rather than a
 *    tool: "**Cheer ×5 + Auron attacking, under Hastega.** The wiki's
 *    explicitly 'minimal items/equipment' route."
 * 4. **Everyone near full.** Because Dispel→Cross Cleave cannot be answered,
 *    the only defence for the member it picks is that they were full when it
 *    landed. §7.8's party-heal stock is what pays for that: seventeen Al Bhed
 *    Potions (1,000 a head), four Mega-Potions (2,000) and four Healing Waters
 *    (**full HP, party-wide**) are the largest resource the preset owns.
 *
 * And the answers that are reactive rather than standing:
 *
 * 5. **Aeons, as soon as they are available, in both phases** (§6 row 15,
 *    §4.4.2). A summon is a shield before it is a burst: while an aeon holds
 *    the field the party is off-stage with frozen counters and Seymour's answer
 *    is a zero-damage Banish, so one party turn buys two enemy turns of nothing
 *    and the poison keeps ticking. It is the single largest rule in this file
 *    — see step 3 for the measurements.
 * 6. **Holy Water the moment Zombie lands** (§6 row 4). Lance of Atrophy is
 *    Zombie at chance 100 — halved to ~50% by the three Zombie Wards §7.7.2
 *    buys — and the mount's next turn is Full-Life, which on a living Zombie is
 *    100% of max HP as damage plus a guaranteed Death (§3.3). Cured first, the
 *    Full-Life whiffs outright on a living non-Zombie.
 *
 * ## The three canon strategies this tactic deliberately does not play
 *
 *  * **Provoke** — both actors are Provoke-immune at 255 (§6 row 19). The row
 *    is offered every turn and is a wasted turn.
 *  * **Breaks / Threaten** — Flux is immune to all four Breaks (§6 row 20).
 *    Piercing is the only way past Defense 40, and Auron's katana and Kimahri's
 *    spear already have it.
 *  * **Delay Attack / Delay Buster** — actively harmful (§6 row 21): both
 *    actors are `immune-to-delay`, so the delay fails *and* counters with
 *    party-wide Slowga. Tidus is offered both rows every turn; this tactic
 *    never picks either.
 */

import type {
  AnyCombatant,
  AvailableCommand,
  Command,
  CombatantId,
  FFXCombatant,
} from '../../battle/common/types.ts';
import {
  type Tactic,
  activeParty,
  aim,
  cheerUp,
  has,
  hpFraction,
  revive,
  row,
  stacksOf,
} from './common.ts';

/** The boss id this encounter fields, and nothing else does. */
export const SEYMOUR_FLUX_ID: CombatantId = 'seymour-flux';

/** The mount. It has no death state; see §2.2. */
const MOUNT_ID: CombatantId = 'mortiorchis';

/**
 * Cross Cleave's damage, rounded up — the number phase 1 is survived against.
 *
 * §5.2 gives 2,299–2,596 at Defense 20 and 2,388–2,697 at Defense 15; measured
 * in this engine the hits run 2,316–2,617.
 */
const CROSS_CLEAVE = 3_200;

/**
 * Total Annihilation's five hits, rounded up — the number phase 2 is survived
 * against. §5.2: 3,300–4,145 across the party by Magic Defense, "halve if Shell
 * is up (→ ~1,900–2,000, survivable by most of the party)".
 */
const TOTAL_ANNIHILATION = 4_300;


/**
 * Party HP missing, in total, at which a party-wide item beats a single heal.
 *
 * Roughly one Al Bhed Potion's worth across three members. Set low on purpose:
 * §7.8's stock is worth about a hundred thousand HP and the fight only costs
 * ~4,000 a cycle once Protect and Cheer are up, so the binding constraint is
 * turns, not items — and a turn that tops the whole party up is the cheapest
 * insurance against a Dispel→Cross Cleave that cannot be answered.
 */
const PARTY_HOLE = 1_500;

/** Below this fraction a member is topped up once the emergencies are over. */
const TOPPED_UP = 0.85;

/**
 * Aeons kept off the field until he crosses 50% [§6 row 15, §4.4.2].
 *
 * Measured over four forty-seed windows (1, 41, 101, 1001): 0 held = 91 wins
 * of 160, 1 = 96, **2 = 100**, 3 = 56. See the summon rule for why the curve
 * has a peak rather than a slope.
 */
const AEONS_HELD_FOR_PHASE_2 = 2;

export const seymourFlux: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const boss = state.combatants[SEYMOUR_FLUX_ID] as FFXCombatant | undefined;
  if (!boss || !boss.alive) return null;
  const actor = state.combatants[actorId];
  if (!actor) return null;

  const party = activeParty(engine);

  // **Both actors, or this is not the encounter.** §2.2 is categorical:
  // "Mortiorchis has no death state at all in this encounter. It is never
  // removed from the enemy party, never becomes untargetable, and its slot is
  // never vacated." A board that fields the host and no mount is therefore not
  // the Mt. Gagazet formation, and every rule below — the Full-Life answer,
  // the Cross Cleave readiness, §4.2's cycle — would be reasoning about a fight
  // that is not happening.
  //
  // The guard is load-bearing, not decoration. `tacticFor` keys on the host id
  // alone, and `tests/unit/helpers/FakeEngine.ts` fields a lone `seymour-flux`
  // dummy as the generic ladder's fixture, so without this the Chapter 1 tactic
  // hijacks `presenter-playback.test.ts`. Returning `null` would not help
  // either: `intendedStrategy` reads a registered tactic's `null` as "swing"
  // and skips the generic revive/heal ladder outright, which is exactly what
  // that fixture is asserting. So the guard plays those generic rules itself.
  if (!state.combatants[MOUNT_ID]) return generic(commands, party, boss.id);

  // **An aeon on the field plays none of the party's rules.** §4.5 gives it
  // exactly one turn before Banish and §6 row 15 says what that turn is for, so
  // every ladder below — the Zombie cure, the wards, the Cheer, the repairs —
  // is a turn it does not have. It is also the only *present* friendly actor
  // while the party is off-stage with frozen counters (`aeons.ts freezeParty`),
  // so reading `living` at all would have it answering a board it is not
  // standing on: measured before this branch, the summons spent their single
  // turn on a thrown Fire Gem every time (see `strike`).
  if (actor.side === 'aeon') {
    return strike(commands, actor, boss.id) ?? strike(commands, actor, MOUNT_ID);
  }

  const living = party.filter((c) => c.alive);
  const phase2 = boss.hp * 2 < boss.stats.maxHp;
  const zombies = living.filter((c) => has(c, 'zombie'));
  /** Phase 1's big hit is physical and Protect halves it; phase 2's is magical. */
  const ward = phase2 ? 'shell' : 'protect';

  /**
   * Whether this member survives the next party-wide hit of the current phase.
   *
   * Phase 2 runs Flare and the charge ladder and nothing else (§4.4), so Cross
   * Cleave stops being the threat the moment he crosses 50% and Total
   * Annihilation takes over. Cheer's defensive half is physical-only (§5.5), so
   * it counts against the first and not the second.
   */
  const survives = (c: AnyCombatant): boolean => {
    const cheered = phase2 ? 1 : (15 - stacksOf(c, 'cheer')) / 15;
    const incoming = (phase2 ? TOTAL_ANNIHILATION : CROSS_CLEAVE) * cheered;
    return c.hp > (has(c, ward) ? incoming / 2 : incoming);
  };

  const bare = living.filter((c) => !has(c, ward));
  const hole = living.reduce((sum, c) => sum + (c.stats.maxHp - c.hp), 0);
  const exposed = living.filter((c) => !survives(c));

  // ----------------------------------------------- 1. the Zombie combo, first
  //
  // §6 row 4, the most time-critical rule in the fight, and the reason it sits
  // **above the revive**: this is prevention, the revive is repair, and the two
  // cost the same single turn. Cure before the mount's turn and its Full-Life
  // whiffs outright on a living non-Zombie (`misses-if-target-alive`, §3.3) —
  // one party turn for one enemy turn. Let it land and the same party turn buys
  // a Phoenix Down that brings the member back at half HP **still zombified**
  // (Zombie survives KO here on purpose: `statuses.ts SURVIVES_KO`, following
  // ffx-yunalesca §15.2 #29 over ffx-combat-core §4.2's summary column), so the
  // cure still has to be paid for afterwards and the trade becomes two party
  // turns for one of theirs.
  //
  // Holy Water first, Remedy only once the seven Holy Waters are gone; they are
  // the same cure (ffx-combat-core §4.2) and §7.8 stocks seven and three.
  // Esuna is deliberately absent: "Esuna explicitly does NOT cure Zombie"
  // (`src/data/ffx/statuses/core.ts`, `notCuredBy`).
  //
  // Curing also unblocks every heal on the board — a `heals` effect on a living
  // Zombie is applied as damage — so one zombified member freezes the party
  // potion at step 3 for all three. The healthiest Zombie is cured first: it
  // has the most HP for Full-Life to take, and the worn one is the cheaper
  // Phoenix Down.
  const zombie = [...zombies].sort((a, b) => hpFraction(b) - hpFraction(a))[0];
  if (zombie) {
    const cure = row(commands, ['Holy Water', 'Remedy'], zombie.id);
    if (cure) return aim(cure, zombie.id);
  }

  // ------------------------------------------------- 2. the turn-one openers
  //
  // Two actions whose value is proportional to the number of enemy turns still
  // ahead of them, which makes them worth more now than any repair. Gated on
  // the true opening state — *nobody* hasted, no poison on the board — so they
  // fire once rather than competing with the ladder every turn; the standing
  // repairs for both live at step 6.
  //
  // They stand down at one living member: with two of three gone there is no
  // party left to buff and the revive is the only move that matters.
  if (living.length >= 2) {
    if (!living.some((c) => has(c, 'haste'))) {
      const opener = row(commands, ['Hastega']);
      if (opener) return aim(opener);
      // Hastega is Tidus's and Haste is his and Yuna's (§7.4). With neither on
      // the field the acting member hands the turn to Tidus instead of
      // shrugging: a switch costs nothing (ffx-combat-core §1.7; `execute.ts`
      // returns `rank: 0, handOffTo`), so he casts it with the turn he is
      // handed.
      const bench = swapIn(commands, 'Tidus');
      if (bench) return bench;
    }
    // Mighty Guard is an opener too, and it outranks the poison. Kimahri is
    // the slowest of the actives at Agility 18 (§7.3) and §4.2's first Cross
    // Cleave is only six enemy actions away, so the one turn he gets before it
    // has to be the Overdrive — measured, with the Fang in front of it he
    // spent that turn throwing it and the party wiped on turn 9 with Seymour
    // untouched at 65,325. Protect *and* Shell on all three, for one turn and
    // no resource, off a gauge the canonical route arrives with full
    // (§7.9.2's Lancet rule).
    if (bare.length >= 2) {
      const mg = row(commands, ['Mighty Guard']);
      if (mg) return aim(mg, actorId);
    }
    if (!has(boss, 'poison')) {
      // Poison Fang applies Poison at chance 254, which skips his resistance
      // byte of 90 outright (`statuses.ts rollStatus` returns true on 254
      // before resistance is read), so one item buys the whole battle.
      const fang = row(commands, ['Poison Fang'], boss.id);
      if (fang) return aim(fang, boss.id);
    }
  }

  // ----------------------------------------------------------------- 3. aeons
  //
  // §6 row 15 / §4.4.2: "if the player summons an aeon, Mortiorchis postpones
  // Total Annihilation until Seymour banishes the aeon. The charge is held, not
  // lost." The aeon then gets **exactly one turn** before Banish (§4.5).
  //
  // What that adds up to is the single most valuable rule in this file, and it
  // is a *defensive* one. While an aeon holds the field it is the only present
  // friendly actor and the party is off-stage with its CTB counters frozen
  // (ffx-combat-core §6.1, `aeons.ts freezeParty`), so a summon costs one party
  // turn and buys: the aeon's action, Seymour's Banish turn — which deals no
  // damage at all (§3.1, base damage 0) — and whatever the mount spends on the
  // aeon instead of the party, all while the poison keeps ticking 1,400 a turn
  // off Seymour. One party turn for two enemy turns of nothing.
  //
  // So they are spent **as they come up, in both phases**, not banked for the
  // Total Annihilation stall. That ordering is measured and the margin is not
  // small: with the summon left at the bottom of the ladder the line won 56 of
  // 100 seeds, moved above the readiness repairs it won 66, and moved above the
  // revive as it is here, 67-73 across four windows. Banking them for phase 2
  // was tried at reserves of one, two and three aeons and lost every time (48%,
  // 60%, 40%), and gating phase-1 summons on the party already being in trouble
  // was worse still (38%) — by the time it is in trouble the shield is late.
  //
  // Bahamut leads: the only aeon in this chapter with native Break Damage
  // Limit, Mega Flare is the largest single damage event the preset can produce
  // (§5.7), and §7.9.2 starts him at a full gauge "on purpose" for that reason.
  // Valefor is the other full one and follows him.
  //
  // **Two are held back for phase 2**, and that is the one thing about this
  // rule that changed. §6 row 15 is written about phase 2 by name — "Summon
  // every aeon with a full Overdrive gauge **in phase 2**" — and §4.4.2 says
  // why: a summon is the only thing in the party's hands that *postpones*
  // Total Annihilation, and Total Annihilation does not exist until he crosses
  // 50%. Spending all five in phase 1 left the charge ladder unanswerable.
  //
  // The size of the reserve is measured, not chosen. Holding **none** (the
  // previous rule) wins 91 of 160 seeds, one 96, **two 100**, three 56 — the
  // curve turns over sharply, because phase 1 needs the stall too and a party
  // that banks its shield dies before it can spend it. Two is the reserve that
  // pays for both halves of the fight, and it is what makes the phase-2 burst
  // above land at the moment the research says a player spends it.
  const held = boss.hp * 2 < boss.stats.maxHp ? 0 : AEONS_HELD_FOR_PHASE_2;
  const summonable = commands.filter((c) => c.enabled && c.command.kind === 'summon').length;
  if (state.aeonId === null && summonable > held) {
    const summon = nextAeon(commands);
    if (summon) return summon;
  }

  // **Talk**, the §4.7 Trigger Command: Kimahri **+10 Strength** ("a ~60%
  // damage swing at these stat levels") and Yuna **+10 Magic Defense", which
  // §5.2 shows materially reduces Total Annihilation on her. One turn each,
  // once each; the engine disables the row afterwards, so it cannot loop, and
  // §4.7 scopes the bonus to the battle.
  //
  // Two gates, both measured. It is **last of the openers**, behind Mighty
  // Guard, Hastega and the Fang: run ahead of those it took the turns they
  // need and the party wiped in phase 1 with Seymour untouched on 70,000 —
  // the same failure the Fang caused when it was ordered ahead of the
  // Overdrive. And it is only taken while the party is warded and nobody is
  // one hit from dying, because a permanent bonus is worth having only if
  // there is a party left to spend it on. §4.7 calls it a *start of the
  // fight* action, so it also stops once he is under 75% and counter-casting.
  //
  // Worth +4 wins in forty seeds (19 -> 23) — the largest single rule added
  // in this pass.
  if (bare.length === 0 && exposed.length === 0) {
    const say = row(commands, ['Talk']);
    if (say) return aim(say, actorId);
  }

  // ---------------------------------------------------------------- 4. revive
  //
  // Thirty Phoenix Downs (§7.8) against a combo that costs the enemy two turns
  // every time it fires. Single-target raises only while a living Zombie is on
  // the field — Mega Phoenix is a `heals` effect and would kill it.
  //
  // **A zombified body is left on the floor — unless it is Yuna or Tidus.**
  //
  // Raising a zombified member hands the mount's next Full-Life the same
  // guaranteed kill again, for the same one enemy turn, for ever: Zombie
  // survives KO here, so they come back at half HP still wearing it. Left down
  // they are not a legal Full-Life target at all — the script picks from
  // *living* zombified members (§4.8) — so the mount wastes the turn instead.
  // Measured, that one rule took the party from 3.0 deaths a run to 1.5 and the
  // line from 48% to 56% of a hundred seeds.
  //
  // The exception is the two members whose absence removes a whole system
  // rather than a body. **Yuna is the only summoner**, so a Yuna on the floor
  // means no aeons at all — and the aeons are this line's best rule (step 3);
  // measured, seed 1 lost her on the second enemy action, fought the next
  // thirty-five turns two-handed with no summon ever cast, and died with Seymour
  // on 54,702. **Tidus is the only Hastega**, and Haste is the party's share of
  // the clock. Raising those two regardless was worth +6 wins in 100 seeds and
  // is what turns seed 1 from a loss into an 82-turn win.
  const downed = party.filter((c) => !c.alive && !c.removed);
  if (downed.length > 0) {
    const pick =
      downed.find((c) => !has(c, 'zombie')) ??
      downed.find((c) => c.id === 'yuna' || c.id === 'tidus') ??
      (living.length <= 1 ? downed[0] : undefined);
    const labels = zombies.length > 0
      ? ['Phoenix Down', 'Life']
      : ['Phoenix Down', 'Life', 'Mega Phoenix'];
    const raise = pick && row(commands, labels, pick.id);
    if (raise && pick) return aim(raise, pick.id);
  }

  // --------------------------------------------- 5. be ready for the big hit
  //
  // §4.2 puts a party-wide **Dispel** on step 4 and **Cross Cleave** on step 5,
  // and the research calls the pairing "deliberately vicious — the party is
  // stripped of Protect *immediately before* the only big physical hit in phase
  // 1". At Agility 38 apiece the two actors routinely take those two steps
  // back-to-back, so there is no turn in between to react in: the answer has to
  // be standing before the Dispel, which is what this whole step is for.
  //
  // In order of how much each option buys per turn spent:
  //
  //  1. **Mighty Guard** (§6 row 13) — Protect *and* Shell on all three at
  //     once, no MP and no item, off a gauge the canonical route arrives with
  //     full (§7.9.2: Lancet-learning an Overdrive fills the meter and Kimahri
  //     learns this one off Biran Ronso minutes earlier). Kimahri is Stoic, so
  //     every hit he survives puts a fifth to a third of the next one back.
  //  2. **A party potion.** Seventeen Al Bhed Potions, four Mega-Potions and
  //     four Healing Waters (§7.8); the Healing Waters are `percent-total` at
  //     DmgCon 16, i.e. a full party heal, and are kept for the deep holes.
  //     Guarded on nobody being a living Zombie, because a `heals` item on one
  //     is damage and a party Mega-Potion into a zombified party is a wipe.
  //  3. **The ward** on the member short of it — Yuna's Protect (12 MP of her
  //     270) or Shell, then the six Light and six Lunar Curtains (§7.8) once
  //     her MP is spent.
  //  4. **A single heal** on whoever is lowest.
  if (bare.length >= 2) {
    const mg = row(commands, ['Mighty Guard']);
    if (mg) return aim(mg, actorId);
  }
  if (hole >= PARTY_HOLE && zombies.length === 0) {
    const items =
      hole > 5_000
        ? ['Healing Water', 'Mega-Potion', 'Al Bhed Potion']
        : hole > 2_800
          ? ['Mega-Potion', 'Al Bhed Potion', 'Healing Water']
          : ['Al Bhed Potion', 'Mega-Potion', 'Healing Water'];
    const potion = row(commands, items);
    if (potion) return aim(potion, actorId);
  }
  const bareOne = bare[0];
  if (bareOne) {
    const put = phase2
      ? row(commands, ['Shell', 'Lunar Curtain'], bareOne.id)
      : row(commands, ['Protect', 'Light Curtain'], bareOne.id);
    if (put) return aim(put, bareOne.id);
    // Protect and Shell are Yuna's and the curtains are only six deep each.
    // With both gone from the field the acting member hands her the turn; the
    // switch costs nothing and step 8 hands the slot back to Auron as soon as
    // she has nothing left to support.
    const bench = swapIn(commands, 'Yuna');
    if (bench) return bench;
  }
  const worst = (exposed.length > 0 ? exposed : living)
    .filter((c) => !has(c, 'zombie') && hpFraction(c) < TOPPED_UP)
    .sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (worst) {
    const heal = row(commands, ['Curaga', 'X-Potion', 'Cura', 'Hi-Potion', 'Cure'], worst.id);
    if (heal) return aim(heal, worst.id);
  }

  // ------------------------------------- 5a. take his Reflect off, in phase 2
  //
  // §6 row 8 and §5.3, and this is the "new home above step 6" step 7's comment
  // has promised since the phase-2 loop was fixed and never actually had — the
  // only Dispel rung in the file sat *below* the Cheer ladder, which in a fight
  // that re-runs its repairs every cycle is most of the way to never.
  //
  // It is worth a turn only once §4.4.1's loop is running, which is exactly
  // what phase 2 is. Flare is always cast at Self and his Reflect is the only
  // thing deciding who eats it (§3.3), so one Dispel buys three things at once:
  // the ~2,000 party-wide bounce does not happen, the next Flare resolves on
  // him for ~1,734 (§5.3), and he spends a further turn recasting Reflect.
  // Measured, moving it here is worth 4 wins in 160 seeds.
  //
  // Phase 1 is untouched: his Protect (§6 row 9) is still left alone, for the
  // reason step 7 gives — this party's damage is mostly `damageType: 'other'`
  // and his Protect never touches it.
  if (phase2 && has(boss, 'reflect')) {
    const strip = row(commands, ['Dispel'], boss.id);
    if (strip) return aim(strip, boss.id);
  }

  // ------------------------------------------- 5b. shut phase 2 off: Silence
  //
  // §6 row 7, and it is the largest rule in phase 2: **"Silence Buster /
  // Silence Attack (Wakka) — 50% resist. Silences shut off Flare, Reflect,
  // Dispel and Protect, wasting his turn each time."** §2's status table agrees
  // (`Silence | 50 | Landable`), and §4.4.1's loop is nothing *but* Flare and
  // Reflect — so a landed Silence does not reduce phase 2, it deletes it, and
  // the Mortiorchis's charge ladder becomes the only thing left to survive.
  //
  // This rule exists because phase 2 only started running. §4.4.1's loop was
  // deadlocked (one Flare, then "Seymour waits" for ever), so there was nothing
  // to silence and the two Silence rows were dead weight; with the loop running
  // as canon the fight gains a repeating ~2,000 party-wide bounce and needs its
  // canonical answer. Measured over forty seeds, the fixed loop alone cost four
  // wins and this rule takes them back.
  //
  // Wakka owns both rows (§7.4) and this preset benches him, so the first turn
  // buys the swap — which costs nothing (ffx-combat-core §1.7). It sits below
  // the Zombie cure, the revive, the aeons and the readiness block, because
  // none of those can be deferred a turn and this one can.
  if (phase2 && !has(boss, 'silence')) {
    const gag = row(commands, ['Silence Buster', 'Silence Attack'], boss.id);
    if (gag) return aim(gag, boss.id);
    // **No swap for it.** Wakka owns both rows (§7.4) and this preset benches
    // him, but a switch is rank 0 and hands the turn straight to the incoming
    // member (ffx-combat-core §1.7) — so a rule that pulls Wakka in while step
    // 5 pulls Yuna in for the wards ping-pongs the same turn between them for
    // ever. Measured: the forty-seed sweep stopped terminating. The rows are
    // taken when they are on the board and never bought with a swap.
  }

  // ------------------------------------------------------ 6. standing repairs
  //
  // Haste leaks away one revive at a time — KO clears it, and this fight kills
  // a member every cycle or two. The single Haste (MP 8, rank 4) patches one;
  // Hastega (MP 30, rank 6) only earns its recovery when two or more are bare.
  const slow = living.filter((c) => !has(c, 'haste'));
  if (slow.length > 0) {
    const many = slow.length >= 2 ? row(commands, ['Hastega']) : undefined;
    if (many) return aim(many);
    const one = slow[0];
    const single = one && row(commands, ['Haste'], one.id);
    if (single && one) return aim(single, one.id);
  }

  // The Cheer ladder, §6 row 12. Below every repair, and that ordering is
  // measured: run from the top of the ladder the five casts came out while
  // members were sitting on half a bar with no Protect, and seed 4 wiped to the
  // first Cross Cleave of the fight with the ladder half-built. `cheerUp`'s own
  // two gates stop it re-running each time a member dies and comes back.
  const cheer = cheerUp(commands, actor, living);
  if (cheer) return cheer;

  // ------------------------------------------- 7. take his own buffs off him
  //
  // §6 rows 8 and 9, and they are two different bargains:
  //
  //  * **Dispel his Reflect** (row 8) and "his next Flare detonates on himself
  //    (~1,734) and he burns two more turns recasting". §3.3 is why: Flare is
  //    always cast at *Self* and the Reflect status is the only thing deciding
  //    who eats it, so stripping it turns his biggest phase-2 action into
  //    self-harm plus a wasted turn. §5.3 prices the loop outright — "a
  //    Dispel-and-poison loop alone is a real (slow) win condition".
  //  * **Dispel his Protect** (row 9), which he counters onto himself the
  //    moment he crosses 75% (§4.3) and which halves every physical the party
  //    has left.
  //
  // **Only the Reflect is worth the turn here, and that is measured.** Row 9
  // looks like the better of the two and is not, because this party's damage is
  // mostly *not* physical: `formulas.ts` applies Protect at step 5 to
  // `damageType: 'physical'` alone, and the Gems and Grenades the strike ladder
  // throws are `damageType: 'other'`, so his Protect never touches them. Taking
  // it off is a turn spent widening Auron's swing and nothing else, and he
  // re-counters it the next time he is hit; measured, stripping both cost the
  // party 6,000 of its own damage a run and dropped 66 wins to 54 in 100 seeds.
  // Stripping the Reflect alone used to measure level (73 against 74 in 200
  // seeds) and is now **the phase-2 rule**, because the thing it answers only
  // started happening: his §4.4.1 loop was deadlocked — one Flare for the whole
  // of phase 2 and then nothing but "Seymour waits" — so there was no bounce to
  // prevent and Dispel really was a spare turn. With the loop running as §4.4.1
  // describes it (Flare -> wait -> Flare) the same turn now buys three things at
  // once: it stops a ~2,000 party-wide bounce, it turns the next Flare into
  // ~1,734 of his own HP, and it costs him a further turn recasting. See its
  // new home above step 6.
  //
  // (It is left here as well, below the Cheer ladder, for the case where the
  // repairs above ran first and the Reflect is still up.)
  if (has(boss, 'reflect')) {
    const strip = row(commands, ['Dispel'], boss.id);
    if (strip) return aim(strip, boss.id);
  }

  // ----------------------------------------------------------- 8. hit the boss
  //
  // Nothing above fired, so this turn was going to be a plain swing — which is
  // where **Auron** belongs. §7.7.2 arms him for this fight by name (the
  // Blessed Bracer and its free Zombie Ward is one of the two Wantz pieces the
  // preset buys: "Two of them (Yuna, Auron) come free with Wantz's stock") and
  // then leaves him on the bench, and §6 row 12 puts him in the one line the
  // research calls a route: "Cheer ×5 + **Auron attacking**, under Hastega."
  // Three numbers make the hand-off free money:
  //
  //  * His katana is Piercing at Strength 40, which §5.6 prices at **2,030 a
  //    swing** against Defense 40, where Kimahri's pierced spear pays ~870 and
  //    Yuna's staff ~170. Measured over forty seeds before this rule, the whole
  //    party's swings were worth 3,249 of Seymour's 70,000.
  //  * 3,410 HP (§7.3) makes him the only one of the seven who does not die to
  //    an unprotected Cross Cleave, on a board where the strip cannot be
  //    answered.
  //  * He carries a **Zombie Ward** and Kimahri does not (§7.7.2 gives exactly
  //    three, to Tidus, Yuna and Auron), so every turn Kimahri spends on the
  //    field is a Lance of Atrophy that zombifies at full chance instead of
  //    half. Measured, Kimahri alone was taking four Full-Life deaths a run and
  //    the party was spending its whole clock raising, curing and re-warding
  //    him.
  //
  // So Kimahri's job here is his one Overdrive and then the bench, and Yuna's
  // is everything above this line. The swap costs nothing (ffx-combat-core
  // §1.7), and it is reversible for nothing too: step 0 pulls Tidus back for
  // Hastega and step 3 pulls Yuna back for Protect, each with the turn they are
  // handed.

  if (actorId === 'kimahri' && !row(commands, ['Mighty Guard'])) {
    const auron = swapIn(commands, 'Auron');
    if (auron) return auron;
  }

  // The explicit target is the whole point of the file. Returning `null` here
  // would hand the turn to the generic `overdriveOrAttack`, whose
  // `bestEnemyTarget` prefers a part — the losing line this encounter exists to
  // punish.
  return strike(commands, actor, boss.id) ?? strike(commands, actor, MOUNT_ID);
};

/**
 * `BattlePresenterStrategies.ts`'s generic ladder, for a board this tactic is
 * registered against but does not recognise: revive, heal anyone critical,
 * spend a ready Overdrive, otherwise swing. Same order and the same
 * `HEAL_THRESHOLD` as the generic rules it stands in for.
 */
function generic(
  commands: AvailableCommand[],
  party: AnyCombatant[],
  bossId: CombatantId,
): Command | null {
  const raised = revive(commands, party);
  if (raised) return raised;
  const hurt = party
    .filter((c) => c.alive && !has(c, 'zombie') && hpFraction(c) < 0.45)
    .sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (hurt) {
    const heal = row(commands, ['Curaga', 'Cura', 'Cure', 'X-Potion', 'Hi-Potion', 'Potion'], hurt.id);
    if (heal) return aim(heal, hurt.id);
  }
  const od = commands.find(
    (c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes(bossId),
  );
  if (od) return aim(od, bossId);
  const attack = commands.find(
    (c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(bossId),
  );
  return attack ? aim(attack, bossId) : null;
}

/**
 * Put a bench member on the field, if the engine is offering that row.
 *
 * A switch is FFX's cheapest action: "the incoming member **takes the turn that
 * is happening right now**, so it charges nothing" (ffx-combat-core §1.7;
 * `execute.ts` returns `rank: 0, handOffTo`). Swapping is therefore not a turn
 * spent, it is a turn re-aimed at whichever of the seven carries the tool this
 * one needs — which is how FFX's party system is played.
 */
function swapIn(commands: AvailableCommand[], name: string): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === 'switch' && c.label === name);
  return r ? (r.command as Command) : null;
}

/**
 * The best row this actor has for hitting `targetId`, Overdrive first.
 *
 * A character whose swing is worth less than a thrown item throws the item.
 * §7.8's typical inventory carries ten of each of the four Gems, seventeen
 * Grenades and four Frag Grenades, all `fixed`-formula and `ignores-armored`,
 * so they pay their full face value against Defense 40 where Tidus's sword pays
 * 646 and Yuna's staff ~170 (§5.6). §1.2 is what makes the Gems usable at all
 * here: every element on both actors is Neutral — "there is no elemental puzzle
 * in this fight" — so the four are interchangeable and none is resisted. Auron
 * and Kimahri swing instead; Piercing is worth 2,030 and 873 a hit and costs
 * nothing.
 */
function strike(commands: AvailableCommand[], actor: AnyCombatant, targetId: CombatantId): Command | null {
  // **An aeon's one turn is its Overdrive.** §4.5: "the aeon gets exactly one
  // turn to act before it is banished", and §5.7 prices that turn — Energy
  // Blast 13,485, Mega Flare 12,946, Thor's Hammer and Diamond Dust 10,788,
  // Hellfire 10,429, Energy Ray 9,889, all on the Special Magic formula that
  // "ignores Magic Defense entirely", capped at 9,999 for every aeon but
  // Bahamut. §5.7's closing line calls a full sweep of them "the shape of the
  // intended 'phase 2 burst' win".
  //
  // It was not happening. This ladder knew three Overdrive labels and all three
  // were the *party's* (Dragon Fang, Spiral Cut, Jump), so every summon fell
  // through to the thrown-item rung and spent its single turn on a **Fire
  // Gem**. Measured over forty seeds before this branch: 35 Bahamut summons, 35
  // Fire Gems thrown by Bahamut, **zero Mega Flares** — the largest single
  // damage event the preset owns, cast never.
  //
  // Below the Overdrive the order is measured rather than assumed. §7.9.2 sends
  // only Valefor and Bahamut in with a full gauge; Ifrit, Ixion and Shiva
  // arrive at 75 / 60 / 50 and have no Overdrive row to take. For them a
  // thrown Gem — `fixed` formula, `ignores-armored`, paying full face value
  // against Defense 40 (§7.8, §5.6) — beats their Special, because Meteor
  // Strike, Aerospark and Heavenly Strike are Strength-formula power 16-17 and
  // compute to a few hundred against that Defense. Putting the Specials ahead
  // of the Gems cost 6 wins in 160 seeds when it was measured.
  if (actor.side === 'aeon') {
    const burst = row(
      commands,
      ['Energy Blast', 'Mega Flare', "Thor's Hammer", 'Diamond Dust', 'Hellfire', 'Energy Ray'],
      targetId,
    );
    if (burst) return aim(burst, targetId);
    const thrown = row(
      commands,
      ['Fire Gem', 'Ice Gem', 'Lightning Gem', 'Water Gem', 'Frag Grenade', 'Grenade'],
      targetId,
    );
    if (thrown) return aim(thrown, targetId);
    const special = row(commands, ['Impulse', 'Meteor Strike', 'Aerospark', 'Heavenly Strike'], targetId);
    if (special) return aim(special, targetId);
    const swing = commands.find(
      (c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(targetId),
    );
    return swing ? aim(swing, targetId) : null;
  }

  // Overdrives first, strongest available. Auron's Dragon Fang is the largest
  // the actives carry and he is Stoic, so the hits he survives keep paying for
  // it (§7.9.1's `damageReceived x 30 / maxHP`); §7.9.2 starts him at 70% "he
  // is the one the preset expects to open with Dragon Fang".
  const od = row(commands, ['Dragon Fang', 'Spiral Cut', 'Jump'], targetId);
  if (od) return aim(od, targetId);
  if (actor.id !== 'auron' && actor.id !== 'kimahri') {
    const thrown = row(
      commands,
      ['Fire Gem', 'Ice Gem', 'Lightning Gem', 'Water Gem', 'Frag Grenade', 'Grenade'],
      targetId,
    );
    if (thrown) return aim(thrown, targetId);
  }
  const attack = commands.find(
    (c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(targetId),
  );
  return attack ? aim(attack, targetId) : null;
}

/**
 * The next aeon to put on the field, as a **named** Grand Summon when Yuna's
 * own gauge is up [§4.5, §7.9.2].
 *
 * Grand Summon hands the aeon a full temporary gauge, so it Overdrives on the
 * one turn Banish leaves it instead of never; an aeon summoned with an empty
 * gauge is a pure stall. The engine's default minigame outcome names no aeon at
 * all, so the choice has to be made here or the gauge is spent on nothing.
 */
function nextAeon(commands: AvailableCommand[]): Command | null {
  const summon = row(commands, ['Bahamut', 'Valefor', 'Ifrit', 'Ixion', 'Shiva']);
  if (!summon || summon.command.kind !== 'summon') return null;
  const grand = commands.find(
    (c) => c.enabled && c.command.kind === 'overdrive' && c.label === 'Grand Summon',
  );
  if (grand) {
    return {
      ...grand.command,
      targets: [],
      extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId: summon.command.id } },
    } as Command;
  }
  return aim(summon);
}
