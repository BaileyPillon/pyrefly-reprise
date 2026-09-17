/**
 * Chapter 2 — Lady Yunalesca, three chained forms [research/ffx-yunalesca.md].
 *
 * This is the file to edit for Chapter 2 and nothing else; the shared reading
 * helpers live in `./common.ts` and the registry in `./index.ts`.
 *
 * **Form I** counters every action that lands on her: a physical hit with
 * Blind, a spell with Silence, anything else with Sleep, all at chance 100
 * (§5.1). Darkness drops physical accuracy to base/10, so a party that just
 * swings blinds itself out of the fight — the measured naive run landed 18
 * hits against 21 misses and lost. Two sourced answers, in the order the
 * research ranks them:
 *
 * 1. **Reflect on the actives** bounces all three counters back onto her, and
 *    she is immune to all three: "This is the canonical Form-I answer" (§5.1,
 *    §10.4). Dispelling Slap strips it again, so it is re-applied as needed.
 * 2. Otherwise **cure Darkness** on whoever is about to swing.
 *
 * **Forms II and III** invert the obvious play. Hellbiter zombifies the party,
 * and Form III opens with a 100-chance Mega Death that kills every active
 * member who is *not* Zombie (§5.3). "Do **not** blanket-cure Zombie" (§10.1):
 * Zombie is the armour, and it is also the only thing that stops Hellbiter
 * coming back (at three Zombies her Form II Hellbiter chance is exactly 0,
 * §5.2). Her own Cura/Curaga are what damage a Zombie, so this tactic never
 * heals one with a spell or a potion either.
 *
 * The line those two facts force, and that this tactic plays, is §10.2's
 * **Holy Water rhythm**: a Zombie that has been worn down is cured *one at a
 * time*, healed to full on the next turn, and left for Hellbiter to re-zombify
 * — never the last Zombie, and never within `TRANSITION_MARGIN` of a form
 * falling, because the next form's entry action lands before anyone can react.
 *
 * Two more rules carry the later forms, both of them §10.1 and §10.6 made
 * actionable rather than heuristics:
 *
 *   * **Form II is not killed while the party is unarmed.** Inside the last
 *     `ARM_MARGIN` of the form, if any living active is missing Zombie, nobody
 *     swings — the party Defends and waits for the next Hellbiter. Zombie Ward
 *     puts Hellbiter's chance-100 Zombie at ~49.5% a head, so arriving at the
 *     transformation unarmed is ordinary, and the entry Mega Death resolves
 *     before anybody can react to it.
 *   * **Every aeon is held for Form III**, fired as a *named* Grand Summon
 *     while Yuna's gauge allows, and spaced by the repairs above rather than by
 *     a health gate. Her human cycle is frozen while an aeon stands, and the
 *     five Overdrives are about 40,000 of Form III's 60,000.
 *
 * **What this tactic does not achieve.** Measured against the shipped build it
 * wins 392 of 400 contiguous seeds. The defect that used to cap it much lower —
 * every party-switch row the engine offered was disabled, so four of the seven
 * members could never enter the battle — is fixed in `src/battle/ffx/commands.ts`
 * and written up in `tests/unit/ffx-engine-followups.test.ts`. This tactic
 * still does not switch; see the note on the free switch below. The remaining
 * losses are Confuse: it is never cleared by physical damage despite the status
 * data saying it is, so one Mind Blast that catches all three actives is
 * usually the run [`tests/unit/strategy-chapter2.test.ts`].
 */

import type { AvailableCommand, Command, CombatantId, FFXCombatant } from '../../battle/common/types.ts';
import {
  type Tactic,
  activeParty,
  aim,
  cheerUp,
  has,
  hasAeonLeft,
  holdOverdrive,
  hpFraction,
  revive,
  row,
} from './common.ts';

/**
 * Yunalesca HP left, below which a form is "about to fall".
 *
 * Two of Auron's cheered swings. Used as the no-more-experiments line: no
 * Zombie is cured this close to a transformation, because the entry Hellbiter
 * (I→II) and the entry **Mega Death** (II→III) fire on the transformation turn
 * itself, before any party member acts [§5.2, §5.3].
 */
const TRANSITION_MARGIN = 7_000;

/**
 * Form II HP above which the Holy Water rhythm is still allowed to run.
 *
 * Curing a Zombie in Form II drops her to two Zombies, which only re-opens
 * Hellbiter on 30% of her turns (§5.2's table), so the wait for the armour to
 * come back is several of her turns even now that no one wears Zombie Ward.
 * Stopping this far out leaves that wait inside Form II instead of spending it
 * standing in front of the II→III entry Mega Death.
 */
const FORM_II_CURE_FLOOR = 15_000;

/**
 * Form II HP inside which the party stops swinging until it is re-zombified.
 *
 * About one Auron swing plus a Tidus swing, so the hold costs at most the two
 * turns that would have ended the form anyway [§10.1, §5.3].
 */
const ARM_MARGIN = 6_000;

/** Below this fraction a Zombie is one Curaga (~4,400, §4.4) from dying. */
const ZOMBIE_TOPUP_III = 0.4;

/** Form II's threat is Cura (~1,400), so the cure budget is spent later there. */
const ZOMBIE_TOPUP_II = 0.72;

/** Below this fraction a non-Zombie is healed. Raised near a transformation. */
const HURT = 0.45;

/** The boss id this tactic is registered under. */
export const YUNALESCA_ID: CombatantId = 'yunalesca';

export const yunalesca: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const boss = state.combatants['yunalesca'] as FFXCombatant | undefined;
  if (!boss || !boss.alive) return null;
  const form = boss.enemy?.formIndex ?? 0;
  const party = activeParty(engine);
  const actor = state.combatants[actorId];
  if (!actor) return null;

  const living = party.filter((c) => c.alive);
  // The supporter is whoever carries Curaga or Reflect this turn — Yuna in the
  // shipped build. Everyone else is an attacker, and attackers never spend a
  // turn on a 200-HP Potion: the measured run lost a third of its player turns
  // that way and 22 KOs with it.
  // Checked on the row's *presence*, not `enabled`: a supporter out of MP is
  // still the supporter, and her job that turn is to refill.
  const supporter = commands.some((c) => c.label === 'Curaga' || c.label === 'Reflect');

  // There is deliberately **no** "out of MP, drink an Ether" rule. An Ether is
  // an item carrying the `heals` flag and `extra.restoresPool: 'mp'`, and
  // nothing in the engine reads `restoresPool` — so an Ether restores *HP*, and
  // on a Zombie it is applied as damage instead [formulas.ts step 14]. The
  // measured runs spent three and four consecutive Yuna turns on Ethers that
  // moved her MP by zero. Yuna's 290 MP is a **fixed budget** for the whole
  // battle, which is why every rule below that can reach for an item does. Her
  // one refill is Yunalesca's own Osmose: it is flagged `drains-mp`, and a
  // drain reverses on a Zombie (§7.1), so every Osmose in the Form III aeon
  // cycle refills a zombified Yuna to full.

  const supporterAlive = living.some((c) => c.id === 'yuna');

  // Revive: the supporter always; an attacker only when the supporter is down.
  if (supporter || !supporterAlive) {
    const raised = revive(commands, party);
    if (raised) return raised;
  }

  // NOTE — the free switch **is** available now, and this tactic still does not
  // take it. `SwitchCommand` hands the current turn to the incoming member at
  // no cost (ffx-combat-core §1.7), which would let the supporter's slot hold
  // Yuna only on the turns that need her and a striker (Wakka ~1,400 a swing
  // against Yunalesca's Defense, versus Yuna's ~170) on the rest. Until this
  // round every switch row the engine offered was disabled — `commands.ts`
  // gated it on `isAlive(bench)`, and `isAlive` folds in `onField`, which no
  // reserve member can satisfy — so the line could not be played at all. That
  // is fixed, and the line is still **not** played here, deliberately: the
  // measured 392/400 above is the line the research documents, every rule below
  // is tuned against the three actives it names, and a switch rota is a new
  // tactic to be measured on its own rather than a free win to be assumed.
  // A tactic only picks rows the engine says are legal, and this one never
  // picks a switch row; see `tests/unit/strategy-chapter2.test.ts` for the
  // seeds that pin the current line.

  if (form === 0) {
    // Form I is a damage race against Absorb, which drains exactly half the
    // target's max HP and heals her the same, with no variance (§4.5). Breaks
    // are all wasted turns — resistance 255 on every one (§2.5).

    if (supporter) {
      // 1. Keep the party above Absorb's reach: it kills anyone whose current
      //    HP is at or below half their max. Near the transformation the bar
      //    rises to 100%: Form II opens with Hellbiter and from then on nobody
      //    can be healed while they are Zombie, so every point of HP the party
      //    carries across is a point it keeps for two whole forms (§5.2).
      const line = boss.hp <= TRANSITION_MARGIN ? 0.999 : HURT;
      const hurt = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
      if (hurt && hpFraction(hurt) < line) {
        // A reflected ally cannot be healed with a spell: Cura and Curaga
        // bounce off Reflect and heal *her* ~1,400 / ~4,400 (§8). Items do not
        // bounce. Casting Curaga through our own Reflect was measured healing
        // her 69,011 in one Form I — more than twice her whole HP bar.
        //    The **Mega-Potion** is a legal fallback here and *only* here:
        //    nobody is Zombie yet in Form I, and a Mega-Potion into a zombified
        //    party is a party wipe (§11.4). X-Potion leads because Form I is
        //    where Absorb takes half a max-HP bar at a time and a full heal is
        //    worth the turn.
        const items = ['X-Potion', 'Hi-Potion', 'Mega-Potion'];
        const heal = has(hurt, 'reflect')
          ? row(commands, items, hurt.id)
          : row(commands, ['Curaga', 'Cura', ...items], hurt.id);
        if (heal) return aim(heal, hurt.id);
      }
      // 2. Reflect the attackers so her counters bounce back onto her, and she
      //    is immune to all three (§5.1, §10.4). The supporter's own actions
      //    target allies, which never provoke a counter, so she needs none.
      //    Dispelling Slap strips it, so this re-applies as needed.
      const bare = living.find((c) => c.id !== actorId && !has(c, 'reflect'));
      const reflect = bare && row(commands, ['Reflect'], bare.id);
      if (reflect && bare) return aim(reflect, bare.id);
      // 3. Nothing left to support: **Defend**, do not swing.
      //
      //    Her staff is worth ~140 a hit against Yunalesca's Defense of 50 —
      //    a twentieth of Auron's swing — and every landed hit enters her
      //    `onHit` (§5.1), so the whole return on those turns is one more
      //    counter aimed at the one active who is *not* carrying Reflect
      //    (step 2 reflects the two attackers, never the caster herself).
      //    Defend halves the physical damage she takes until her next turn and
      //    provokes nothing at all, which is what actually matters here: the
      //    supporter has to cross into Form II alive and near full, because
      //    from Form II on she is Zombie and nobody can heal her.
      //    Measured over 400 seeds: 150 wins with Defend against 131 with the
      //    swing, and the same +9/200 on an independent seed range.
      //
      //    Her Grand Summon is held for Form III, where an aeon Overdrive on
      //    arrival is worth most (§10.6).
      //
      //    **Not Shell**, and that is measured. Shell halves magical damage
      //    (§4.2) and her Form III Curaga on a Zombie is magical, so shelling
      //    the party looks like the answer to the one attack that reliably
      //    kills. It loses: 20 wins in 48 seeds without it against 15 with.
      //    Two reasons, and the second is the encounter's own joke. Dispelling
      //    Slap strips Shell from whoever just hit her, so on an attacker it is
      //    a treadmill that drained Yuna's fixed 290 MP inside Form II. And on
      //    Yuna it only half-saves her: shelled, the Curaga leaves her alive on
      //    a few hundred HP that nobody can heal because she is Zombie, where
      //    dying to it and taking a Phoenix Down puts her back at half her max.
      //    In Forms II and III surviving a hit is worth less than dying to it.
      const guardI = row(commands, ['Defend']);
      if (guardI) return aim(guardI, actorId);
      return holdOverdrive(commands, boss.id);
    }

    // 4. Attackers: Haste the party once — more swings between Absorbs is the
    //    whole race. Dispelling Slap strips it from one member at a time.
    if (living.some((c) => !has(c, 'haste'))) {
      const haste = row(commands, ['Hastega']);
      if (haste) return aim(haste);
    }
    const odF1 = bestOverdrive(commands, boss.id);
    if (odF1) return odF1;
    const cheer = cheerUp(commands, actor, living);
    if (cheer) return cheer;
    // 5. A blind attacker without Reflect cures itself before swinging.
    //    Eye Drops, never Remedy: Remedy also strips Zombie (§7.1) and the
    //    four of them are the second half of the Form II/III cure budget.
    if (has(actor, 'darkness') && !has(actor, 'reflect')) {
      const cure = row(commands, ['Eye Drops'], actorId);
      if (cure) return aim(cure, actorId);
    }
    return null; // Overdrive, then attack: the generic rules do that.
  }

  // ------------------------------------------------------------ Forms II/III
  //
  // Zombie is armour (§10.1). Never blanket-cure it, never heal a Zombie,
  // never let the last one go.
  const raised = revive(commands, party);
  if (raised) return raised;

  const zombies = living.filter((c) => has(c, 'zombie'));
  const nearTransition = boss.hp <= TRANSITION_MARGIN;

  // **Do not kill Form II while the party is unarmed.** This is §10.1's lesson
  // turned into a rule the tactic can act on: the II->III transformation turn
  // runs Metamorphosis 2 and a 100-chance Mega Death together, before any party
  // member acts (§5.3), and Mega Death kills every active who is not Zombie.
  //
  // The party wears Zombie Ward from Mt. Gagazet (resistance 50, so Hellbiter's
  // chance-100 Zombie lands ~49.5% a head, §5.1), which means arriving at the
  // transition with nobody zombified is an ordinary outcome, not a freak one —
  // measured, it wiped the active three at the Form III entry on 4 of 24 seeds
  // with Form III untouched at 60,000.
  //
  // So inside the last `ARM_MARGIN` of Form II, if fewer than two actives carry
  // Zombie, nobody swings: the party Defends and waits for the next Hellbiter
  // to put the armour back on. At 0-1 Zombies her Hellbiter chance is 90%/60%
  // (§5.2's table), so the wait is one or two of her turns. The rule needs two
  // living members to stall — with one left there is no time to spend.
  //
  // The hold also checks that the party *can* be armed: a member wearing
  // Zombieproof has `immunities.zombie` at 255 and Hellbiter will never arm
  // them (equipment.ts folds Proofs and Wards into the resistance bytes at
  // battle start), so waiting for a party that is entirely Zombieproof would
  // be waiting forever. That party is the §10.1 failure the encounter exists
  // to punish, and it must walk into Mega Death, not stall in front of it.
  const armed = zombies.length > 0 && zombies.length >= living.length;
  const armable = living.some((c) => ((c.immunities as Record<string, number | undefined>)['zombie'] ?? 0) < 255);
  const holdBlow = form === 1 && boss.hp <= ARM_MARGIN && !armed && armable && living.length >= 2;
  const stall = holdBlow ? row(commands, ['Defend']) : undefined;

  if (!supporter) {
    // Attackers in the later forms.
    //
    // Haste is **not** maintained here, and that is measured, not assumed.
    // Her counter is Dispelling Slap, which strips Haste from whoever just hit
    // her — 49% of eligible hits in Form II and *every* eligible hit in Form
    // III (§5.2, §5.3) — and KO clears it too. A standing repair rule turned
    // Tidus into a full-time Haste caster whenever Auron was dying in a loop,
    // and the party stopped attacking altogether: Form I ended with Yunalesca
    // back at her full 24,000.

    // A **confused supporter** is the one thing an attacker must drop
    // everything for. Mind Blast confuses at chance 50 per member (§3), a
    // confused character is resolved by the engine and never reaches this
    // tactic [execute.ts `actsAutomatically`], and Esuna — the cure that does
    // not strip Zombie — is Yuna's alone. So when Yuna is the confused one
    // nobody can cure anybody, and the measured seed-1 loss is exactly that:
    // Mind Blast caught all three, eight consecutive party turns were spent
    // swinging at each other, and Yunalesca healed her way back out of reach.
    //
    // The only cure an attacker carries is a Remedy, which also strips her
    // Zombie (§7.1). That is accepted deliberately, under the same guard the
    // Holy Water rhythm uses: one member at a time, never the last Zombie. She
    // is then the member the next Mega Death kills, and a Phoenix Down brings
    // her back — a known, one-item cost, against a spiral that ends the run.
    const confusedSupporter = living.find((c) => c.id === 'yuna' && has(c, 'confuse'));
    if (confusedSupporter && zombies.length >= (has(confusedSupporter, 'zombie') ? 2 : 1)) {
      const remedy = row(commands, ['Remedy'], confusedSupporter.id);
      if (remedy) return aim(remedy, confusedSupporter.id);
    }

    if (stall) return aim(stall, actorId);

    // Spend a ready Overdrive, and spend the **right** one. The generic rule
    // takes whichever Overdrive row the engine offers first, which is Auron's
    // Dragon Fang (DmgCon 17, §5.5 row 1). Shooting Star is row 2 at DmgCon 24
    // — and 27 against an Eject-immune target, which Yunalesca is
    // (`eject: 255`), because the ability's immune row is the stronger one.
    // Same idea for Tidus: Spiral Cut is one hit of DmgCon 32, where Slice and
    // Dice is six hits of 6 and every hit pays her Defense of 50 separately.
    const od = bestOverdrive(commands, boss.id);
    if (od) return od;

    // Cheer, in every form. Stopping it in Form III was tried and is clearly
    // wrong: KO clears the stacks, so the party fights Form III uncheered, and
    // measured that costs about a third of its damage — Auron 1,728 a swing
    // instead of 2,450, Tidus 900 instead of 1,430. `cheerUp`'s own two gates
    // are what stop the revive loop re-running the whole ladder.
    const cheer = cheerUp(commands, actor, living);
    if (cheer) return cheer;
    return null;
  }

  // 1. Her Regen on a Zombie is periodic HP **loss** (§7.1, §10.5) — Dispel it.
  //
  //    In Form III this runs before the summon at step 6: while an aeon is on
  //    the field no party member gets a turn, so a Regen ticking on a 190-HP
  //    Zombie is an execution the party cannot answer. That is exactly how seed
  //    1 lost Yuna, and with her the rest of the summons, mid-aeon.
  if (form === 2) {
    const ticking = zombies.find((c) => has(c, 'regen'));
    const dispelTick = ticking && row(commands, ['Dispel'], ticking.id);
    if (dispelTick && ticking) return aim(dispelTick, ticking.id);
  }

  // 2. Regen on *her* comes off next. Measured: once Form I's Reflect carries
  //    over, her own Regen bounces onto her (§8) and on a 48,000-HP body each
  //    tick dwarfs the party's damage — ~88k of her 92k Form II healing on
  //    seed 42. §10.5 names dispelling it as a must-work tactic.
  if (has(boss, 'regen')) {
    const dispelBoss = row(commands, ['Dispel'], boss.id);
    if (dispelBoss) return aim(dispelBoss, boss.id);
  }

  // 3. Then the Reflect that caused it. Form I's counter-defence is a
  //    liability from Form II on: her Cura and Regen bounce onto her instead
  //    of landing on the party (§8), and "the wiki explicitly recommends
  //    dispelling Reflect before the Form-II transition".
  const reflected = living.find((c) => has(c, 'reflect'));
  const dispelReflect = reflected && row(commands, ['Dispel'], reflected.id);
  if (dispelReflect && reflected) return aim(dispelReflect, reflected.id);

  // 4. The §10.2 Holy Water rhythm, and the heal that is its whole point.
  //
  //    A Zombie cannot be healed, so in Forms II and III every party member is
  //    on a one-way slide: she casts Cura (~1,400) or Curaga (~4,400) on a
  //    random Zombie almost every turn — §5.2's table says that at three
  //    Zombies her Form II Hellbiter chance is exactly 0, so *every* Form II
  //    turn of hers is a heal-turn. Curing one member, healing it to full, and
  //    letting the next Hellbiter re-zombify it is the only way to put HP back
  //    on the board. Measured without it: Auron entered Form III on 969 of
  //    4,400 and the fight was over four of her turns later.
  //
  //    Guards, in the order §10.2 states them:
  //    - never the **last** Zombie: Form II leaves one standing, Form III two,
  //      because there a Mega Death is never more than five of her turns away
  //      and the cured member has to be able to be Phoenix Downed back;
  //    - never inside the transformation window — `FORM_II_CURE_FLOOR` leaves
  //      Hellbiter enough of Form II to put the armour back on, and
  //      `TRANSITION_MARGIN` stops it outright, because the II→III entry Mega
  //      Death resolves before any party member acts (§5.3);
  //    - Holy Water first, Remedy only once the Holy Waters are gone — the same
  //      cure (§7.1), and there are only four of each.
  //
  //    The rhythm pauses in Form III while an aeon can still be put on the
  //    field, because a summon is worth more than two turns of repairs there.
  //
  //    There is deliberately **no** emergency override for a nearly-dead
  //    Zombie. It was tried: curing whoever fell under a quarter of their HP,
  //    whatever else was due. It loses. The cure is the armour, and the member
  //    it saves from the next Mind Blast is the member the next Mega Death
  //    kills — seed 20260916 went from 17,377 HP left to 46,158 with that rule
  //    in. A worn Zombie is left worn; when it falls, a Phoenix Down brings it
  //    back at half max HP and still zombified, which is the sustain here.
  //    In Form III the rhythm stays **behind** the aeons (`!hasAeonLeft`), and
  //    that ordering is measured, not assumed. Letting it run between summons
  //    was tried: with the Holy Waters already spent in Form II the only cure
  //    left is a Remedy, a Remedy strips Confuse *and* Zombie together, so the
  //    rhythm re-triggered on the member it had just cured and took every one
  //    of Yuna's turns. Seed 20260916 never summoned at all and Form III
  //    stalled at 26,345. The cheap repairs — revive, Esuna, Dispel — do run
  //    between summons; they are steps 0, 1-3 and 7 above.
  const worn = [...zombies].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  const spare = form === 1 ? 2 : 3; // living Zombies that must remain after a cure
  const routine = worn !== undefined && (form === 1
    ? boss.hp > FORM_II_CURE_FLOOR && hpFraction(worn) < ZOMBIE_TOPUP_II
    : state.aeonId === null && !hasAeonLeft(commands) && !nearTransition
      && hpFraction(worn) < ZOMBIE_TOPUP_III);
  if (worn && zombies.length >= spare && routine) {
    const cure = row(commands, ['Holy Water', 'Remedy'], worn.id);
    if (cure) return aim(cure, worn.id);
  }

  // 5. Heal the living who are **not** Zombie — which, after step 4, is the
  //    member just cured. Heal it all the way: the point of spending the cure
  //    was the HP, and Hellbiter will take the Zombie back for free. Curaga
  //    first; the five X-Potions are the reserve for when her MP is gone.
  const hurt = living
    .filter((c) => !has(c, 'zombie') && hpFraction(c) < 0.95)
    .sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (hurt) {
    // A reflected one takes items only (§8).
    const heal = has(hurt, 'reflect')
      ? row(commands, ['X-Potion', 'Hi-Potion', 'Mega-Potion'], hurt.id)
      : row(commands, ['Curaga', 'X-Potion', 'Cura', 'Hi-Potion'], hurt.id);
    if (heal) return aim(heal, hurt.id);
  }

  // 6. Aeons (§10.6). Summoning in Form II is a net loss — her aeon branch is
  //    Absorb/Hellbiter and Absorb feeds her half the aeon's max HP a time
  //    (§5.2) — so every aeon is saved for Form III, where each one is a
  //    stretch of turns in which her human cycle is **frozen**: no Mega Death,
  //    no Curaga on a Zombie, and the party's HP sits almost untouched while
  //    the aeon trades hits. Measured: the five aeons are worth about 40,000 of
  //    Form III's 60,000, and without them Form III stalls at 17,000.
  //
  //    "Almost": her aeon-branch Mind Blast still targets the whole party
  //    (§5.3, record 246), so the repairs above come first — a member under a
  //    Mind Blast's worth of HP when the aeon goes out is a member who dies in
  //    a window in which nobody can revive them.
  //
  //    Grand Summon first, and named: it arrives with a full temporary gauge,
  //    so the aeon Overdrives on turn one instead of turn three, before her
  //    aeon-cycle Mind Blast lands the Curse that would block it (§10.6). The
  //    engine's default minigame outcome names no aeon at all, so the choice
  //    has to be made here or the Overdrive is spent on nothing.
  //
  //    **The aeons are spaced, not dumped** — but by the repairs above, not by
  //    a health gate on the summon itself. Steps 1-5 come first, so a turn
  //    that has a Confuse to cure, a Regen to strip or a cure-and-heal to run
  //    spends itself there and the next aeon waits a turn. An explicit
  //    "party must be above X% to summon" gate was tried and is *much* worse:
  //    in Form III every active is Zombie, the only repair is one of the three
  //    remaining Holy Waters/Remedies, and once those are gone the gate never
  //    opens again — measured, it left five aeons unspent and Form III at
  //    26,000-51,000 HP on four of eight seeds. Hoisting it the other way, to
  //    directly after the revive and ahead of every repair, is worse again:
  //    the aeons then go out on top of a worn party, and five of eight seeds
  //    lost with 1,000-15,800 left.
  if (form === 2 && state.aeonId === null) {
    const summon = nextAeon(commands);
    if (summon) return summon;
  }

  // 7. Confusion (Mind Blast, chance 50 a member, §3) makes a member swing at a
  //    random target on either side — measured at 1,064 into Auron. A confused
  //    member is resolved by the engine, not by this tactic, so it is a turn
  //    the party simply does not get.
  //
  //    Cured with **Esuna**, never a Remedy: Remedy strips Zombie too (§7.1),
  //    and Esuna does not (§7.1, "Not cured by: Esuna").
  //
  //    It stays *after* the summon, and that ordering was re-measured this
  //    round. Moving it above step 6 looks right and is not: while an aeon
  //    holds the field no party member takes a turn at all, so a confused
  //    member costs nothing until the aeon falls, and every Esuna spent ahead
  //    of a summon is a summon postponed. Measured with it in front: seed 1
  //    got two of its five aeons out and Form III stalled at 31,091.
  const confused = living.find((c) => has(c, 'confuse'));
  if (confused) {
    const esuna = row(commands, ['Esuna'], confused.id);
    if (esuna) return aim(esuna, confused.id);
  }

  // 8. Last, the Form II Regen treadmill. She re-casts Regen on about half her
  //    heal turns (§5.2), and answering every one of them cost the supporter
  //    fifteen Form II turns that the Holy Water rhythm needed more.
  const regenZombie = zombies.find((c) => has(c, 'regen'));
  const dispelOff = regenZombie && row(commands, ['Dispel'], regenZombie.id);
  if (dispelOff && regenZombie) return aim(dispelOff, regenZombie.id);

  if (stall) return aim(stall, actorId);

  // 9. The supporter **never swings**, in either of the later forms. Her
  //    Attack is worth ~170 against Yunalesca's Defense of 50, and every
  //    landed hit draws a Dispelling Slap counter — on half her eligible hits
  //    in Form II and on *every* one in Form III (§5.2, §5.3) — that costs her
  //    ~250 and strips whatever buff she is carrying. She cannot be healed
  //    while she is Zombie, so that is a trade she can never win back. Defend
  //    halves the physical damage until her next turn and provokes nothing
  //    (§5.1's list of actions that never enter `onHit`).
  //
  //    Measured across 400 seeds, extending this from Form III alone to both
  //    later forms is worth +5 wins, on top of the +19 the same rule is worth
  //    in Form I.
  const guard = row(commands, ['Defend']);
  if (guard) return aim(guard, actorId);

  // The supporter never falls through to the generic Overdrive rule: her only
  // Overdrive is Grand Summon, which step 6 fires with an aeon named. Left to
  // the generic rule it resolves with the engine's default minigame outcome —
  // an empty aeon id — and the gauge is spent on nothing.
  return holdOverdrive(commands, boss.id);
};

/**
 * The strongest Overdrive this actor can spend, by the research's own DmgCon
 * table [§5.5 for Auron, §5.4 for Tidus], most damaging first.
 *
 * Grand Summon is deliberately absent: it is the supporter's, and `nextAeon`
 * spends it with an aeon named.
 */
const OVERDRIVE_ORDER = ['Shooting Star', 'Dragon Fang', 'Spiral Cut', 'Slice and Dice'];

function bestOverdrive(commands: AvailableCommand[], bossId: CombatantId): Command | null {
  const r = row(commands, OVERDRIVE_ORDER, bossId);
  if (!r || r.command.kind !== 'overdrive') return null;
  return aim(r, bossId);
}

/**
 * The next aeon to put on the field, as a **named** Grand Summon when Yuna's
 * own gauge is up [§10.6, §10.9].
 *
 * Grand Summon hands the aeon a full temporary gauge, so it Overdrives on
 * arrival instead of on its third turn — ahead of the aeon-cycle Mind Blast
 * that Curses it and blocks the Overdrive outright. The engine's default
 * minigame outcome names no aeon, so the choice has to be made here or the
 * gauge is spent on nothing.
 *
 * **Shiva leads, Bahamut brings up the rear**, and the order is worth about as
 * much as any other single rule here (+48 wins in 400 seeds against the old
 * Bahamut-first list). Two things set it:
 *
 *   * What an aeon is *worth* is its Overdrive minus the HP Yunalesca takes
 *     back off it. She kills an aeon with two Absorbs of half its max HP and
 *     heals herself the same (§4.5, §10.6), so each aeon refunds her exactly
 *     its own max HP — measured, 9,060 across the five, to the point. Net:
 *     Shiva 9,999 − 1,596, Valefor 7,745 − 1,341, Ifrit 7,943 − 1,797,
 *     Ixion 7,641 − 1,787, Bahamut 7,009 − 2,542. Bahamut is the *worst* of
 *     the five here, not the best: the biggest body on the smallest Overdrive.
 *   * The first aeon is the one Yuna's gauge is actually up for, so it is the
 *     one that gets the Grand Summon and therefore Overdrives on arrival
 *     instead of on its third turn. Shiva's Diamond Dust is the largest of the
 *     five (it reaches the 9,999 cap), so it is the one worth guaranteeing.
 *
 * The three in the middle are within noise of each other; the order below is
 * the one measured best over 1,600 seeds.
 */
function nextAeon(commands: AvailableCommand[]): Command | null {
  const summon = row(commands, ['Shiva', 'Ixion', 'Ifrit', 'Valefor', 'Bahamut']);
  if (!summon || summon.command.kind !== 'summon') return null;
  const grand = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.label === 'Grand Summon');
  if (grand) {
    return {
      ...grand.command,
      targets: [],
      extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId: summon.command.id } },
    } as Command;
  }
  return aim(summon);
}
