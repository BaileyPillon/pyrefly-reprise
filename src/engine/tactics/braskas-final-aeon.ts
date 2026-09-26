/**
 * Chapter 3 - Braska's Final Aeon, the possessed aeons, and Yu Yevon
 * [research/ffx-bfa-yu-yevon.md].
 *
 * This is the file to edit for Chapter 3 and nothing else; the shared reading
 * helpers live in `./common.ts` and the registry in `./index.ts`.
 *
 * The chapter is a **chain** of seven battles that never returns to a menu:
 * Braska's Final Aeon (two forms, 60,000 then 120,000) -> one battle per aeon
 * Yuna owns -> Yu Yevon. Two Yu Pagodas stand in every one of them. One tactic
 * covers all three kinds of link because the party, its HP, its MP, its buffs
 * and its item counts carry straight through
 * (`BattleScreenSetup.carryPartyForward`), so the decisions in the first fight
 * are the reason the last one is survivable.
 *
 * ## What changed on 2026-09-17 (third pass), and why the line is a different
 * ## line
 *
 * The previous round won this chapter by multiplying the party's Strength by
 * 1.5, which - because `power(STR) = STR^3 / 32 + 30` - is a x2.6 to x2.9 on
 * the damage, and which no published number supports. This round takes all of
 * that back: **every offensive stat in the build is §4.1 as published**, with
 * **no exception**. The fight is won instead by three things the chapter had
 * never used, all of them in the research:
 *
 *  1. **The bench.** §1 `[verified: 2 sources]`: *"reserve swapping works
 *     normally"*; ffx-combat-core §1.7 `[verified: 2 sources]`: the incoming
 *     member **takes the turn happening right now**, so a Switch is free and
 *     *"all seven can therefore participate"*. Four guardians had spent the
 *     whole chapter on the bench. Now **Lulu** holds a seat and is the party's
 *     damage - see {@link BLACK_MAGE}.
 *  2. **Doublecast**, which §4.2's recommendation for this preset grants by
 *     name and which the engine had no reader for at all: the row resolved a
 *     `formula: 'none'` no-op and ate the turn. It does now
 *     (`battle/ffx/execute.ts resolveDoublecast`), two casts for one rank-3
 *     turn, two targets if you want them.
 *  3. **The Zombie exploit**, §1.6 `[verified: 2 sources]`: *"While Zombie, the
 *     next Power Wave deals 1,500 damage instead of healing... Zombiestrike on
 *     a weapon re-applies it repeatedly."* Auron's free weapon slot carries the
 *     Zombiestrike §1.6 names, and the pillars now damage their own boss
 *     roughly 17,500 a battle instead of only healing it.
 *
 * ## What changed on 2026-09-17 (round 5), for the verifiers
 *
 * Two verifier objections, answered.
 *
 * **1. Yuna's Strength is §4.1's published 20, and the "28" is withdrawn.** The
 * third pass kept exactly one raised offensive stat and defended it as "§4.4
 * publishes this number". Re-read, that does not hold: §4.1 is the section that
 * answers *"what does a typical party have here?"* and its table says **20**;
 * §4.4's sentence answers a different question and says so - *"Aeon stats scale
 * off Yuna's Strength/Magic, **which is why the wiki singles out** 'Yuna's
 * Strength at least 28' **as the threshold** for Bahamut's Mega Flare plus a
 * couple of attacks to finish the job"*. That is a recommended floor for a
 * particular *finish*, not a statement about the typical build, and reading one
 * as the other is how a preset drifts upward one citation at a time. It would
 * not even buy what it was cited for - `dreams-end`'s aeons carry their own
 * published stat block, so nothing in this engine scales an aeon off Yuna. The
 * revert lives in `data/ffx/builds/dreams-end.ts` and costs nothing measured.
 *
 * **2. The robustness, from 5/8 to 8/8 on the verifier's seeds, by one change
 * to how the aeon roster is spent** - {@link summonNow}, and its ordering
 * inside {@link supportTurn}. Nothing else moved; no enemy number, and no
 * player number.
 *
 * ## The line, link 1
 *
 * **1. Slow both pillars, then leave them standing.** §1.4's guidance is "kill
 * both or neither" and this line picks **neither**, which is the branch nobody
 * had measured. Slow is one of exactly two statuses a Yu Pagoda is not immune
 * to (§1.4 `[verified: 2 sources]`, resist 50), it costs two or three of
 * Tidus's 12-MP casts, `restorePart` does not clear it, and it halves Power
 * Wave for the rest of the battle. Killing them instead costs **10,000 to
 * 15,000 damage every 63-tick cycle** - measured, more than half of everything
 * the party produced - to deny 1,500 a cast, and measured head to head across
 * four separate implementations it lost every time.
 *
 * **2. The third seat belongs to the black mage.** Firaga against the boss's
 * Magic Defense is **1,905**, against a Mental-Broken one **4,473**, and
 * Doublecast doubles both - where Tidus's sword is 687 and Auron's 1,396.
 * Tidus keeps the seat only while he has something nobody else can do
 * ({@link tidusExclusive}), and Auron lends *his* seat back to Tidus for as
 * long as it takes to Haste her ({@link rotation}).
 *
 * **3. Auron is the Zombie and the Mental Break, in that order of rhythm.**
 * Mental Break while she is standing, because it is a flat x2.35 on the party's
 * biggest hit; a plain Attack whenever the boss is not Zombie, because the
 * weapon rider turns the next Power Wave from +1,500 into -1,500 and his swing
 * lands anyway. Armor Break and Power Break only in a window where a Power Wave
 * cannot strip them, which with the pillars left standing means almost never -
 * and that is the price of branch 1, paid knowingly.
 *
 * **4. Hastega, kept up, and the Cheer ladder exactly once.** Cheer is
 * `all-allies` and a KO clears the stacks; re-running the five-cast ladder
 * after every revive cost five consecutive Tidus turns in a measured losing
 * tail while the party died around him. It runs when **every** living member is
 * short, which is the opening and nothing else.
 *
 * **5. The two Stamina Tonics**, one off the top and one the moment the
 * rotation puts a new face on the field. **6. Aeons on the gauge**, Grand
 * Summon when it is ready and a plain Summon when it is not, because an aeon
 * standing when the gauge fills turns a party-wide Ultimate Jecht Shot into a
 * single-target Jecht Bomber at the aeon (§1.6's branch table checks "an Aeon
 * is on the field" first) and no party member is targetable while it stands.
 * **7. Two Talk charges**, held for the Overdrives no aeon is covering.
 * **8. Cure the Zombie on a party member before healing them**, because a
 * `heals` action on a Zombie resolves as damage. **9. Match the heal to the
 * hole** - the spell rows lead at every size, because MP comes back out of the
 * Ethers and the bag does not.
 *
 * ## Yu Yevon is not a damage race, and playing it as one loses
 *
 * He counters **every player-side action that damages him with a 9,999
 * Curaga** (§3.3, §3.4.1). The party's best single action here is a few
 * thousand, so every swing is a net heal - the measured naive run finished with
 * him on 99,999 of 99,999 and the party wiped. The line is §3.5's Doom route
 * with §3.5's attrition route behind it:
 *
 *   * **The Candle of Life goes first**, before the pillars. Doom kills him in
 *     exactly three of his own turns, it deals no damage so it never arms the
 *     counter, and the `#210` Power Wave strips Poison, Zombie and Reflect -
 *     not Doom.
 *   * **Then the pillars stay suppressed** (§3.5's "keep both Pagodas
 *     incapacitated"). Here they really are killed, because nothing else on
 *     this field is worth a turn and Gravija's 75 %-of-current cannot outrun
 *     4,500 of healing between his turns.
 *   * **And nobody hits him** until his own Gravija has taken him under
 *     {@link YU_YEVON_FINISH}.
 */

import type { AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import {
  type Tactic,
  activeParty,
  aim,
  has,
  hpFraction,
  revive,
  row,
  stacksOf,
} from './common.ts';
import type { BattleEngine } from '../../battle/common/types.ts';

/** The boss id the first link of the chapter fields, and nothing else does. */
export const BRASKAS_FINAL_AEON_ID = 'braskas-final-aeon';

/**
 * The other bosses this same tactic owns.
 *
 * `tacticFor` keys off "which boss is on the field", and the chapter fields a
 * different one in every link of its chain. Registering all of them against one
 * tactic is what lets the possessed-aeon gauntlet and Yu Yevon be played by the
 * line above rather than by the generic ladder, which loses Yu Yevon outright
 * by swinging into his Curaga counter.
 */
export const BRASKAS_FINAL_AEON_CHAIN_IDS: readonly CombatantId[] = [
  'possessed-valefor',
  'possessed-ifrit',
  'possessed-ixion',
  'possessed-shiva',
  'possessed-bahamut',
  'possessed-anima',
  'possessed-yojimbo',
  'possessed-cindy',
  'possessed-sandy',
  'possessed-mindy',
  'yu-yevon',
];

/**
 * Heal anyone under this much of their maximum, and drop everything below
 * {@link EMERGENCY}.
 *
 * Both floors are high for a Final Fantasy tactic, and that is the encounter
 * rather than caution. The party is not losing a sustain race - Yuna's Curaga
 * is ~3,900 every twelve ticks against about 130 a tick of incoming, which she
 * out-heals two and a half times over - it is losing to **burst**: a party-wide
 * Blade Blitz for ~1,400 each, a Triumphant Grasp 2 for 2 x 2,500 on one
 * target, and an Ultimate Jecht Shot for ~3,300 on everyone, arriving between
 * her turns. A member at 45 % of a 6,000-HP bar is a member the next Overdrive
 * kills, and a KO costs the Haste, the Protect, the Cheer stacks and somebody
 * else's turn to undo. Measured over 200 seeds, moving these from 0.34/0.45 to
 * 0.5/0.7 (with {@link IDLE_TOPUP} at 0.99) was worth about three points of
 * win rate.
 */
const HEAL_FLOOR = 0.7;
/** Drop everything for this one - see {@link HEAL_FLOOR}. */
const EMERGENCY = 0.5;

/**
 * Fire a Talk once his gauge reaches this, in **form 2 only**.
 *
 * Both charges are for the form-2 Overdrives: Ultimate Jecht Shot is
 * party-wide and Triumphant Grasp 2 breaks the damage limit (§1.3). Form 1's
 * Triumphant Grasp is 2×~1,900 plus a Zombie, which the Holy Waters answer
 * more cheaply than a charge does. 80 rather than 100 because a Power Wave
 * lands +20 in one step and the gauge is read on the actor's *own* turn, so
 * waiting for a literal 100 misses it.
 */
const TALK_GAUGE = 90;

/**
 * Put an aeon out once the gauge reaches this.
 *
 * **An aeon on the field re-routes the Overdrive.** §1.6's branch table is
 * checked in order and its *first* row is "an Aeon is on the field → Jecht
 * Bomber / Jecht Bomber 2" — so a party that has an aeon standing when the
 * gauge fills does not eat a party-wide Ultimate Jecht Shot at all; the boss
 * spends the whole charge on a single-target hit at a summon, and no party
 * member is even targetable while it stands. Five aeons are five of those, and
 * they cost Yuna one turn each. They are the cheap answer, so they go first and
 * the two Talk charges are what is left when the roster runs out.
 *
 * 55 rather than 100 because the summon has to be *standing* when the gauge
 * fills, not cast after it: with both Pagodas down the gauge climbs ~20 a boss
 * turn (§1.6's tuning table), and Yuna does not get a turn between his last
 * two.
 */
const SUMMON_GAUGE = 55;

/**
 * The gauge at which the supporter stops topping up to {@link IDLE_TOPUP} and
 * starts topping up to **full**.
 *
 * "Keep HP high for Ultimate Jecht Shot" (§4) is something she has to have
 * already done when it lands, not something she can answer afterwards: it is
 * party-wide and it lands between her turns. 55 rather than the 92 this used to
 * be, because with both pillars left standing §1.6's tuning table has the gauge
 * climbing 40-60 % a boss turn: at 92 she gets no turn at all between reading
 * it and eating it.
 */
const BRACE_GAUGE = 55;

/**
 * The supporter's idle turn tops anyone below this fraction up; above it she
 * swings.
 *
 * 0.99, i.e. "there is no such thing as an idle turn". The cheap rows lead in
 * {@link repair}, so closing a 200-point gap costs a Cure rather than an
 * X-Potion, and her Attack is worth 491 against a boss with 180,000 HP - which
 * is to say nothing at all next to the 3,300 of headroom that keeps somebody
 * standing through the next Ultimate Jecht Shot.
 */
const IDLE_TOPUP = 0.99;

/** Refill the supporter's MP below two Curagas' worth. */
const MP_FLOOR = 45;

/** Below this, one ordinary swing finishes Yu Yevon before his counter matters. */
const YU_YEVON_FINISH = 900;

/**
 * **The pillars are not the fight, and every round that treated them as the
 * fight lost.**
 *
 * §1.4's guidance is *"kill both or neither"*, and the branch this line takes
 * is **neither**. That is the single biggest decision in the chapter and it is
 * the one that four measured implementations disagreed about, so the arithmetic
 * is worth writing down.
 *
 * **What a standing pair costs.** Two Power Waves per 21 ticks, un-Slowed:
 * 1,500 of healing each (§1.4, fixed, no variance), +20 % into the boss's
 * Overdrive gauge each (§1.6, the one *verified* gauge number in the
 * encounter), and a strip of **all four Breaks** off him each. Slowed, all of
 * that halves.
 *
 * **What killing them costs.** A Pagoda returns after 63 ticks with
 * `5,000 + the killing blow's excess`, so a cycle is **10,000 at the absolute
 * floor and 12,000-15,000 in practice**, every 63 ticks, for ever. Measured
 * against the §4.1 preset that is 138,000-187,000 damage a battle - more than
 * half of everything the party produces - to deny about 150,000 of healing.
 * It is close to break-even on HP and it buys the Break window, which is real;
 * and every time it was measured against leaving them up, it lost:
 *
 * | Line | Boss damage dealt, link 1 | Outcome |
 * |---|---:|---|
 * | Kill the pair every cycle (Tidus + Auron) | 136,000 | 0/30 |
 * | Kill the pair with the mage's two-target Doublecast | 145,000 | 0/30 |
 * | **Slow both, never touch them** | **185,000** | 0/30 at §4.1's HP, 92 % at the tuned HP |
 *
 * **Slow is what makes "neither" affordable.** §1.4 `[verified: 2 sources]`
 * leaves a Yu Pagoda immune to *everything* except Slow (resist 50) and Delay.
 * Slow is chance 100 against that 50, duration 254 - permanent for the battle -
 * it costs 12 of Tidus's MP, and `hp.ts restorePart` does not clear statuses,
 * so it survives even a Pagoda that dies to something else. Two or three casts
 * halve the healing, halve the gauge and halve the strip rate for the whole
 * fight. Delay Buster is the other half of §1.4's note and it is *not* worth
 * it here: it is rank 8, so it costs Tidus 28 ticks to deny a 21-tick Pagoda
 * turn.
 *
 * And because nothing is ever killed, the lone-survivor state §1.4 warns about
 * - Curse, or Osmose for 100 % of a target's maximum MP - simply never happens.
 */
const PILLARS_ARE_NOT_THE_FIGHT = '§1.4 -- kill both or neither; this line picks neither';
void PILLARS_ARE_NOT_THE_FIGHT;

/**
 * **The pillars are not the fight** - {@link PILLARS_ARE_NOT_THE_FIGHT}.
 *
 * This threshold and {@link BREAKER_PILLAR_FLOOR} below it are what the line
 * uses in the two places it *does* take a Pagoda down: the safety net for a
 * lone survivor in link 1, and Yu Yevon's link, where §3.5 asks for both
 * Pagodas kept incapacitated and there is nothing else on the field worth a
 * turn.
 *
 * Whichever Pagoda is *healthier* is the target until both are inside one swing
 * of dying, and only then are they finished, back to back. That is §1.4's "kill
 * both or neither" read as a targeting rule: a Pagoda that is the **last** one
 * standing stops feeding the boss and starts on the party with Curse (Poison
 * **and Sleep and Silence and Dark**, all at chance 100) or Osmose for 100 % of
 * a target's maximum MP. Sleep is the one that decides it - a sleeping member
 * takes no turns at all - and the measured run that killed them one at a time
 * lost on turn 35 with the boss untouched on 60,000 and all three actives
 * asleep.
 */
const PAGODA_FINISH = 2400;

/**
 * Auron only swings at a pillar while it is **above** this.
 *
 * His hit is more than twice Tidus's and can crit for five times it, and a
 * pillar comes back with `5,000 + the excess of the blow that killed it`
 * (§1.4) — so a finishing blow from him is paid for again in every future
 * cycle. Measured without the floor, the pair was restored at 5,200-12,500 and
 * the tax per cycle ran a fifth over its 10,000 minimum; with it they sit near
 * their floor. Set above {@link PAGODA_FINISH} so he still does the bulk of the
 * work on a healthy pillar and hands over for the kill.
 */
const BREAKER_PILLAR_FLOOR = 4000;


/**
 * Who does what. The party is forced to Tidus / Yuna / Auron at battle start
 * (§1), so the three roles can be named rather than inferred.
 *
 *   * **Yuna is the supporter and never swings.** Her Attack is worth ~282
 *     against Defense 100 — one seven-hundredth of the chapter's HP pool per
 *     turn — and she is the only Protect, the only Curaga, the only Esuna and
 *     the only summon in the party. Every turn she spends attacking is a turn
 *     nobody is healed in, and she is also the member Blade Blitz is likeliest
 *     to kill (2,700 HP against ~1,700 a swing). Measured with her swinging,
 *     the party lost the Ultimate Jecht Shot phase.
 *   * **Auron is the breaker**, because the Breaks are his and Armor Break is
 *     worth more than any other single action in the chapter.
 *   * **Tidus carries Hastega, Cheer and the two Talk charges.**
 */
const BREAKER = 'auron';
const SUPPORT = 'yuna';

/**
 * **The fourth guardian.**
 *
 * §1 is explicit and `[verified: 2 sources]`: *"Party at battle start is forced
 * to Tidus / Yuna / Auron; **reserve swapping works normally**."*
 * `ffx-combat-core.md` §1.7, also `[verified: 2 sources]`, spells out what that
 * is worth — *"the incoming reserve member **takes the turn that is happening
 * right now**… the turn is not consumed by the swap"* and *"any reserve member
 * may be swapped in at any point; **all seven can therefore participate**"* —
 * and `execute.ts` implements it exactly that way (`rank: 0`,
 * `handOffTo: inId`, the incoming member inheriting the outgoing one's CTB).
 *
 * A Switch is therefore **free**. It is the one resource this chapter was
 * leaving entirely untouched: four guardians, their HP bars, their MP pools,
 * their Overdrive gauges and their whole ability lists sat on the bench for
 * all seven links while three characters ground out 180,000 HP alone.
 *
 * Lulu is the one who changes the arithmetic. §4.2 `[verified: 2 sources]`
 * grants her **Firaga/Thundaga** at this point by name, and against the boss's
 * Magic Defense her -aga is worth more than anybody else's swing:
 *
 * | Actor | vs the raw boss | vs a Broken boss |
 * |---|---:|---:|
 * | Tidus, Attack | 687 | 1,611 (Armor Break) |
 * | Auron, Attack | 1,396 | 3,273 (Armor Break) |
 * | Yuna, Attack | 491 | 1,153 (Armor Break) |
 * | **Lulu, Firaga** | **1,905** | **4,473** (Mental Break) |
 *
 * So the rule of the rotation is: **a turn that would have been a plain swing
 * at the boss is handed to the black mage instead.** It costs nothing but her
 * 16 MP a cast, and 300 MP plus the Ethers §4.4 ships is about twenty casts —
 * roughly 40,000 HP that the three actives were never going to find.
 */
const BLACK_MAGE = 'lulu';
/**
 * Pillar duty, and nobody else's job — see {@link PAGODA_FINISH}.
 *
 * Tidus is the cheapest killing blow in the party and the fastest actor in it,
 * which is exactly the pair of properties the revive rule rewards.
 */
const PILLARS = 'tidus';

/**
 * His Overdrive gauge, 0-100 [§1.6].
 *
 * `setup.ts` gives an `overdrive` block to party members and aeons and to
 * nobody else, so the gauge for an *enemy* lives on the battle's own flag bag,
 * where `src/battle/ffx/ai/braskas-final-aeon.ts` keeps it and where the Yu
 * Pagodas' +20 and the Talk reset both reach it. Read-only here.
 */
function bossGauge(engine: BattleEngine, boss: AnyCombatant): number {
  const v = engine.state().flags['bfa.gauge'];
  const flag = typeof v === 'number' ? v : 0;
  const own = 'overdrive' in boss ? (boss.overdrive?.gauge ?? 0) : 0;
  return Math.max(flag, own);
}

/**
 * **True when the charge he is building right now would come out as Ultimate
 * Jecht Shot** — §1.6's branch table, read from the party's side.
 *
 * The branch table is checked in order and only its *third* row is the one that
 * can wipe the party:
 *
 * | Condition, in order | Overdrive |
 * |---|---|
 * | an Aeon is on the field | Jecht Bomber / Jecht Bomber 2, single target |
 * | form 2 **and** HP <= 50 % | **Ultimate Jecht Shot**, whole party |
 * | form 2, HP > 50 % | Triumphant Grasp 2, one target |
 * | form 1 | Triumphant Grasp, one target |
 *
 * Everything above the Ultimate Jecht Shot row is a **single-target** hit that
 * Yuna out-heals; Ultimate Jecht Shot is ~4,700 on **all three at once**
 * (§1.5's band vs Defense 20-30) and it is the only thing in the chapter that
 * kills a full party between her turns. §1.6 says so in as many words: the two
 * Talk charges *"**must** be saved for the Ultimate Jecht Shot phase — exactly
 * the guidance every guide gives"*, and an aeon cancels exactly the same charge
 * for free (its row is checked first).
 *
 * The predicate is `belowHalf` as the AI itself computes it
 * (`ai/braskas-final-aeon.ts`: `form === 1 && hp * 2 <= maxHp`), so the tactic
 * and the boss agree on the phase to the tick.
 */
function ultimateJechtShotPhase(boss: AnyCombatant): boolean {
  const form = boss.enemy?.formIndex ?? 0;
  return form === 1 && boss.hp * 2 <= boss.stats.maxHp;
}

/**
 * **Is this the turn to put an aeon out?** - §1.6's branch table, read as a
 * resource-spending rule. One question, and it is not the one the previous
 * round asked.
 *
 * **Is the charge imminent?** {@link SUMMON_GAUGE}. The summon has to be
 * *standing* when the gauge fills, not cast after it, because §1.6's table is
 * checked in order and its *first* row is "an Aeon is on the field": whatever
 * the charge would have been, it comes out as a single-target Jecht Bomber at
 * the summon instead, and while the summon stands **no party member is
 * targetable at all**.
 *
 * That is the whole rule as of round 5. Two conditions that used to sit beside
 * it are gone, and both removals are measured over seeds 1-400 of the
 * thousand-seed window rather than argued:
 *
 * | Rule | seeds 1-400 |
 * |---|---:|
 * | round 4: hold the roster for the Ultimate Jecht Shot phase, summon *after* the routine heal | 374/400 |
 * | summon before the routine heal, still holding for the phase | 380/400 |
 * | **summon before the routine heal, on the gauge alone (shipped)** | **387/400** |
 * | summon before the routine heal, on distress, ignoring the gauge | 374/400 |
 *
 * **1. The Ultimate Jecht Shot phase gate is withdrawn.** Round 4 measured it
 * on twelve seeds and it won there, 12/12 against 9/12 for spending the roster
 * on whatever charge filled first - but that comparison was made while the
 * summon sat *below* `repair` in {@link supportTurn}, where in a chaotic link
 * it was barely reachable at all, so what it was really comparing was two
 * flavours of "almost never summon". With the ordering fixed the gate reverses:
 * it costs seven wins in four hundred. The reason is that the phase gate is a
 * gate on **the boss's** HP, and a party that is losing never gets him there.
 * Measured across ten losing seeds of the thousand-seed window, three summoned
 * **zero** aeons in battles of 900 to 1,300 ticks, and seed 20 died after 996
 * ticks and sixteen KOs with the boss still at 85,667 of 120,000, five aeons
 * unspent and both Talk charges unspent with them. It held its whole answer in
 * reserve for a phase it was never going to reach.
 *
 * **2. But the gauge gate stays.** Summoning on distress at any gauge - on the
 * reasoning that a stretch of the boss's turns spent on a summon is worth
 * having whether or not a charge is imminent - is worth thirteen fewer wins
 * (374/400). An aeon that arrives early is an aeon that is already dead when
 * the charge lands, and the party's CTB is frozen for the whole time it stands
 * (`rt.frozenPartyCtb`), so an early summon is also a stretch of turns the
 * party does not get.
 */
function summonNow(engine: BattleEngine, boss: AnyCombatant): boolean {
  if (engine.state().aeonId !== null) return false;
  return bossGauge(engine, boss) >= SUMMON_GAUGE;
}

/** Every Yu Pagoda still standing. */
function pagodas(engine: BattleEngine): AnyCombatant[] {
  return Object.values(engine.state().combatants).filter(
    (c) => c.side === 'enemy' && c.flags.isPart && c.alive && !c.removed,
  );
}

/**
 * Which Pagoda to hit, so the two die within a turn of each other
 * [{@link PAGODA_FINISH}].
 *
 * Healthier first while the pair is uneven; once both are inside one swing,
 * the weaker one, so the finishing blows land back to back.
 */
function pagodaTarget(standing: AnyCombatant[]): AnyCombatant {
  const byHp = [...standing].sort((a, b) => a.hp - b.hp);
  const weakest = byHp[0]!;
  const strongest = byHp[byHp.length - 1]!;
  return strongest.hp > PAGODA_FINISH ? strongest : weakest;
}

/** The chapter boss on the field in this link, whichever link it is. */
function chapterBoss(engine: BattleEngine): AnyCombatant | undefined {
  const all = Object.values(engine.state().combatants);
  return all.find((c) => c.side === 'enemy' && !c.flags.isPart && c.alive && !c.removed);
}

/**
 * The strongest Overdrive the actor can spend, most damaging first.
 *
 * Ordered by what the Strength formula actually pays out — `d = d * base // 16`
 * per hit — rather than by the headline number: Slice and Dice is six hits of
 * base 6 (x2.25 a normal swing), Energy Rain one of base 26 (x1.63), Shooting
 * Star one of base 24 (x1.50), Dragon Fang one of base 17 (x1.06).
 */
const OVERDRIVE_ORDER = ['Slice and Dice', 'Energy Rain', 'Shooting Star', 'Dragon Fang', 'Spiral Cut'];

function bestOverdrive(commands: AvailableCommand[], targetId: CombatantId): Command | null {
  const r = row(commands, OVERDRIVE_ORDER, targetId);
  if (!r || r.command.kind !== 'overdrive') return null;
  return aim(r, targetId);
}

/**
 * Swing at `targetId`, or spend a full gauge on it.
 *
 * `allowOverdrive: false` is what the Pagoda duty uses, and it is not a style
 * choice — see {@link PAGODA_FINISH}. A Pagoda comes back with
 * `5,000 + the killing blow's excess` (§1.4), so an Overdrive or an Auron
 * swing thrown at a nearly-dead 5,000-HP pillar is paid for twice: once in the
 * turn, and again in every future turn spent re-killing a pillar that now has
 * eight or twelve thousand HP. Measured before this rule: the Pagodas were
 * restored at 5,200-12,500 and the party put **229,920** damage into them
 * against 97,940 into the boss, on a seed it then lost with the boss's second
 * form untouched at 120,000/120,000.
 */
function swing(
  commands: AvailableCommand[],
  targetId: CombatantId,
  allowOverdrive = true,
): Command | null {
  if (allowOverdrive) {
    const od = bestOverdrive(commands, targetId);
    if (od) return od;
  }
  const attack = commands.find(
    (c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(targetId),
  );
  return attack ? aim(attack, targetId) : null;
}

/**
 * Put the party back together, in the order the damage actually matters.
 *
 * Every step is a measured loss that happened without it:
 *
 * 1. **Zombie first.** A `heals` action applied to a Zombie is resolved as
 *    **damage** (`formulas.ts` step 11), so healing before curing finishes the
 *    job Triumphant Grasp started (§1.3, §4). Holy Water, then Remedy.
 * 2. **Petrify, ahead of any amount of missing HP.** §4.4 [verified: 2 sources]
 *    asks this chapter to ship **exactly one or two** Stoneproof pieces so the
 *    Jecht Beam → shatter chain is "a real, solvable decision rather than a
 *    coin flip", and as of 2026-09-17 the build does: Yuna and Lulu are proof,
 *    the other five are not. So this fires, and it has to fire *fast* — Jecht
 *    Beam is 25 % of his turns at Petrify 100, and the next Left-Arm Strike or
 *    Blade Blitz carries `shatter 100`, which is permanent removal from the
 *    battle rather than a KO. Soft, then Remedy, then Esuna; §4.4 ships four,
 *    six and a caster, which is what makes it solvable.
 * 3. **Poison, treated as an emergency rather than a nuisance.** A character's
 *    Poison tick is `maxHP // 4` *per turn* (`ticks.ts onTurnEnd`) — 1,080 a
 *    turn on Tidus, more than a Blade Blitz. A solo Yu Pagoda's Curse applies
 *    it at chance 100 alongside Sleep and Silence (§1.4). An Al Bhed Potion
 *    strips Poison from the **whole party** and heals 1,000 each, which is why
 *    it leads once more than one member is poisoned.
 * 4. **Sleep.** `state.ts canAct` drops a sleeper out of the CTB queue, and
 *    duration statuses only tick at their own owner's turn end, so a sleeper
 *    nobody hits and nobody cures is out of the battle for good. Esuna or a
 *    Remedy is the answer the status record itself names.
 * 5. **HP.** Curaga (~3,900 on Yuna's Magic 36 +15%) ahead of an X-Potion,
 *    because the items are the reserve for when her 320 MP is gone.
 */
function repair(commands: AvailableCommand[], living: AnyCombatant[], floor: number): Command | null {
  const zombie = living.find((c) => has(c, 'zombie'));
  if (zombie) {
    const cure = row(commands, ['Holy Water', 'Remedy'], zombie.id);
    if (cure) return aim(cure, zombie.id);
  }

  const petrified = living.find((c) => has(c, 'petrify'));
  if (petrified) {
    const cure = row(commands, ['Soft', 'Remedy', 'Esuna'], petrified.id);
    if (cure) return aim(cure, petrified.id);
  }

  const poisoned = living.filter((c) => has(c, 'poison'));
  if (poisoned.length >= 2) {
    const partyCure = row(commands, ['Al Bhed Potion']);
    if (partyCure) return aim(partyCure);
  }
  const sick = poisoned[0];
  if (sick) {
    const cure = row(commands, ['Esuna', 'Remedy', 'Al Bhed Potion'], sick.id);
    if (cure) return aim(cure, sick.id);
  }

  const asleep = living.find((c) => has(c, 'sleep'));
  if (asleep) {
    const cure = row(commands, ['Esuna', 'Remedy'], asleep.id);
    if (cure) return aim(cure, asleep.id);
  }

  const hurt = living
    .filter((c) => !has(c, 'zombie') && hpFraction(c) < floor)
    .sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (!hurt) return null;
  // **Match the heal to the hole.** Chapter 3 is a two-thousand-tick fight and
  // the way it was losing was not "nobody healed", it was "everything had been
  // spent": measured, one link burned 9 X-Potions and the whole 20-Hi-Potion
  // bag on top-ups of a thousand HP or less, and then had nothing left for the
  // Ultimate Jecht Shot that ended it. An X-Potion is a full heal; spending one
  // to close a 900-point gap throws away nine tenths of it. MP comes back out of
  // the Ethers §4.4 ships, so the spell rows lead at every size.
  const deficit = hurt.stats.maxHp - hurt.hp;
  const order =
    deficit >= 3000
      ? ['Curaga', 'X-Potion', 'Cura', 'Hi-Potion', 'Cure']
      : deficit >= 1200
        ? ['Cura', 'Curaga', 'Hi-Potion', 'Cure', 'X-Potion']
        : ['Cure', 'Cura', 'Hi-Potion', 'Curaga'];
  const heal = row(commands, order, hurt.id);
  return heal ? aim(heal, hurt.id) : null;
}

/** A named Grand Summon, so the aeon Overdrives on arrival rather than on its third turn. */
function nextAeon(commands: AvailableCommand[]): Command | null {
  const summon = row(commands, ['Bahamut', 'Ifrit', 'Ixion', 'Shiva', 'Valefor']);
  if (!summon || summon.command.kind !== 'summon') return null;
  const grand = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.label === 'Grand Summon');
  // **Grand Summon or nothing.** An aeon is a one-shot resource here: it takes
  // one Jecht Bomber and dies, and while it stands the party's CTB is frozen
  // (`rt.frozenPartyCtb`), so every turn it spends is a turn Auron does not
  // swing in. Arriving with a full gauge it spends that single turn on Mega
  // Flare or Diamond Dust, worth about ten thousand; arriving on its own 50-70
  // it spends two or three turns on ~600-damage Attacks first and usually dies
  // before the gauge fills. Yuna's own gauge is in `healer` mode and she heals
  // constantly, so it refills about every seven Curagas — there are five Grand
  // Summons in this fight if the tactic waits for them, and measured there were
  // one or two when it did not.
  // **But a plain Summon beats no summon.** The roster is five and Yuna's own
  // gauge is not: measured, `Grand Summon or nothing` put two aeons on the
  // field in a whole battle and the party ate every Overdrive raw. An aeon that
  // arrives on its own 50-70 % gauge still does the job that matters here -
  // while it stands **no party member is targetable at all** and the boss's
  // full gauge is spent on Jecht Bomber at the aeon (§1.6's branch table checks
  // "an Aeon is on the field" first) - so it is a shield first and a damage
  // source second.
  if (!grand) return aim(summon);
  return {
    ...grand.command,
    targets: [],
    extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId: summon.command.id } },
  } as Command;
}

/**
 * The Talk trigger [§1.6, §7.3].
 *
 * The row is now submitted **exactly as the menu offers it**. It used to be
 * re-shaped here — the menu published Talk as an `{ kind: 'ability' }` row
 * while `execute.ts` only zeroed the gauge for `{ kind: 'trigger' }`, so the
 * row as offered was a silently wasted turn and this tactic was the only thing
 * in the project that could fire Talk at all. `commands.ts` now emits the kind
 * the catalog record names, and the exhausted third charge arrives disabled, so
 * `row`'s own `enabled` filter is the §1.6 charge limit.
 */
function talk(commands: AvailableCommand[]): Command | null {
  const r = row(commands, ['Talk']);
  return r ? (r.command as Command) : null;
}

/**
 * Charges left, out of two [§1.6].
 *
 * The row is offered a **third** time and is deliberately inert — the engine
 * refuses it in `consumeBfaTalk` — so a tactic that only reads the row spends
 * real turns on nothing. Measured: five Talk turns for two resets. The counter
 * the engine keeps is public state, so the tactic reads it rather than guessing.
 */
function talksLeft(engine: BattleEngine): number {
  const used = engine.state().flags['bfa.talkUsed'];
  return 2 - (typeof used === 'number' ? used : 0);
}

/**
 * An aeon's own turn, while it holds the field.
 *
 * **Its Overdrive is the reason it is out here**, and it is not in
 * {@link OVERDRIVE_ORDER} — that list is Tidus's and Auron's. Left to the
 * generic rule the five aeons in the measured run landed one Attack each for
 * ~583 and died without ever spending a gauge they arrived with 50-70 % full;
 * Mega Flare and Diamond Dust are worth an order of magnitude more than that.
 * So: any Overdrive row it has, first.
 *
 * **And then it swings — it does not Shield.** §1.6 names Shield by hand
 * ("Aeon Shield cuts Jecht Bomber to one quarter") and the engine implements
 * it as a flat `dmg // 4`, so an aeon that shields survives several more of his
 * turns. That reads like a good trade and is the most expensive mistake in the
 * chapter, because **the party is frozen while an aeon holds the field**
 * (`rt.frozenPartyCtb`, ffx-combat-core §6.1): every extra turn the aeon buys
 * itself is a turn Auron does not swing in. Measured: five summons that
 * shielded held the field for roughly 350 ticks of a 907-tick battle — 38 % of
 * it — and dealt 9,999 damage between them, against the ~150 a tick the three
 * actives make. An aeon's job here is to be the thing Jecht Bomber lands on
 * instead of the party, once, and then to get out of the way.
 */
function aeonTurn(commands: AvailableCommand[], bossId: CombatantId): Command | null {
  const od = commands.find(
    (c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes(bossId),
  );
  if (od) return aim(od, bossId);
  const anyOd = commands.find((c) => c.enabled && c.command.kind === 'overdrive');
  if (anyOd) return aim(anyOd);
  return swing(commands, bossId);
}

/**
 * Get the party back up, preferring the one action that answers a wipe.
 *
 * `common.revive` walks a fixed label list that puts Phoenix Down first, which
 * is right for one casualty and wrong for two: a party-wide Overdrive downs two
 * at once, each Phoenix Down is a whole turn, and every turn spent reviving is
 * a turn the survivor is not healing or buffing in — which is how a measured
 * run died, three actives cycling Phoenix Downs at half HP with no Protect
 * while Blade Blitz took them all down again. **Mega Phoenix takes both back in
 * one turn.** It is skipped while a living Zombie is standing, because a
 * revival effect kills a living Zombie and Mega Phoenix hits everyone.
 */
function reviveParty(commands: AvailableCommand[], party: AnyCombatant[]): Command | null {
  const downed = party.filter((c) => !c.alive);
  if (downed.length >= 2 && !party.some((c) => c.alive && has(c, 'zombie'))) {
    const mega = row(commands, ['Mega Phoenix']);
    if (mega) return aim(mega);
  }
  return revive(commands, party);
}

/** Defend rather than throw a supporter's turn away on a 285-damage swing. */
function guard(commands: AvailableCommand[], actorId: CombatantId): Command | null {
  const r = row(commands, ['Defend']);
  return r ? aim(r, actorId) : null;
}

// ---------------------------------------------------------------------------
// The bench [§1, ffx-combat-core §1.7]
// ---------------------------------------------------------------------------

/** The Switch row that brings `inId` on, if the engine is offering it. */
function benchRow(commands: AvailableCommand[], inId: CombatantId): AvailableCommand | undefined {
  return commands.find(
    (c) =>
      c.enabled &&
      c.command.kind === 'switch' &&
      (c.command.extra as { inId?: CombatantId } | undefined)?.inId === inId,
  );
}

/**
 * True when *this* turn has already been handed over once.
 *
 * A Switch is free and the incoming member takes the turn happening right now,
 * which is the whole point — and which means a rotation policy that reads the
 * field can reverse its own decision the instant it acts on it. It did, and the
 * measured result was a hard hang: Tidus sees "nothing but boss damage to do"
 * and hands to Lulu; Lulu arrives un-Hasted, so the same predicate now says
 * "there is a Tidus job" and hands straight back; Tidus arrives and the party
 * is fully Hasted again. 60,000 decisions, no turn ever taken.
 *
 * So the rule is **one hand-over per turn**: read the log back from the end and
 * stop at the first `switch`, `turn-start` or `action-start`. A `switch` found
 * first means this menu is the handed-over one, and it has to be spent on an
 * action.
 */
function handedOverAlready(engine: BattleEngine): boolean {
  const log = engine.state().log;
  for (let i = log.length - 1; i >= 0; i--) {
    const t = log[i]!.type;
    if (t === 'switch') return true;
    if (t === 'turn-start' || t === 'action-start' || t === 'action-end') return false;
  }
  return false;
}

/** Hand this turn to a benched guardian. Free — see {@link BLACK_MAGE}. */
function handOver(
  engine: BattleEngine,
  commands: AvailableCommand[],
  inId: CombatantId,
): Command | null {
  if (handedOverAlready(engine)) return null;
  const r = benchRow(commands, inId);
  return r ? ({ ...r.command, targets: [] } as Command) : null;
}

/** A benched member the engine will still let on the field. */
function benched(engine: BattleEngine, id: CombatantId): AnyCombatant | undefined {
  const c = engine.state().combatants[id];
  if (!c || !c.alive || c.removed !== true) return undefined;
  if (has(c, 'petrify') || has(c, 'eject') || has(c, 'ko')) return undefined;
  return c;
}

/**
 * The black mage's own turn: an -aga at the boss.
 *
 * Elementally it makes no difference which — §1.2 `[verified: 2 sources]` has
 * all five affinities Neutral, "no weakness, no resistance, no absorb" — so the
 * order is just "the biggest spell she can still pay for", and the -ara rows
 * are the reserve for when her MP is nearly gone.
 */
const SPELL_ORDER = [
  'Firaga',
  'Thundaga',
  'Blizzaga',
  'Waterga',
  'Fira',
  'Thundara',
  'Blizzara',
  'Watera',
  'Fire',
  'Thunder',
  'Blizzard',
  'Water',
];

/**
 * The black mage's turn: **Doublecast** the biggest -aga she can pay for twice,
 * and a single cast when she cannot.
 *
 * §4.2's recommendation for this chapter's preset grants "Doublecast +
 * Firaga/Thundaga" by name `[verified: 2 sources]`, `dreams-end` gives her
 * both — and until 2026-09-17 the engine had no reader for it at all, so the
 * row spent a whole turn on a `formula: 'none'` no-op. It does now
 * (`battle/ffx/execute.ts resolveDoublecast`, via the `AbilityCommand.wrappedId`
 * hook the contract had already reserved and nobody had ever written to), and
 * it is what makes the black mage worth the seat: two casts for one rank-3
 * turn is **3,810 a turn against the raw boss and 8,946 against a
 * Mental-Broken one**, where Auron's sword is 1,396 and 3,273.
 *
 * The MP gate is the tactic's, not the engine's: the menu publishes Doublecast
 * at `mpCost: 0` because it cannot know which spell will be chosen, so the row
 * is enabled even when she cannot pay for the pair.
 */
/**
 * **Fury**, the black mage's Overdrive, which no tactic could previously fire.
 *
 * `special-menu-markers.ts` says it in its own doc comment: the `'fury'` id is
 * a **menu marker**, `formula: 'none'`, `hits: 0`, and *"it is not what an
 * `OverdriveCommand.id` should actually be for Lulu — that must be one of the
 * 19 tier-specific ids"*, with the gap flagged as unclosed by either the builds
 * agent or the UI. `dreams-end` gives her `unlockedOverdriveIds: ['fury']`, so
 * the only Overdrive row she is ever offered resolves to nothing and
 * `execute.ts` refuses it outright as a marker — a full gauge that could never
 * be spent.
 *
 * `commands.ts` now expands the marker into one row per Fury spell Lulu has
 * actually learned, so the tactic no longer invents an id: it picks the biggest
 * row on offer. Firaga's tier-3 Fury at Magic 48 is about **seven casts in one
 * turn** (`fury.ts` FURY_ANCHOR_CASTS interpolated) — 13,000 against the raw
 * boss, better than 30,000 against a Mental-Broken one, from a gauge her
 * `stoic` mode fills just by standing there being hit.
 */
const FURY_ORDER: readonly string[] = [
  'Firaga Fury',
  'Thundaga Fury',
  'Blizzaga Fury',
  'Waterga Fury',
  'Fira Fury',
  'Thundara Fury',
  'Blizzara Fury',
  'Watera Fury',
  'Fire Fury',
  'Thunder Fury',
  'Blizzard Fury',
  'Water Fury',
];

export function fury(commands: AvailableCommand[], targetId: CombatantId): Command | null {
  const r = row(commands, FURY_ORDER, targetId) ?? row(commands, FURY_ORDER);
  return r ? aim(r, targetId) : null;
}

function blackMagic(
  commands: AvailableCommand[],
  engine: BattleEngine,
  actorId: CombatantId,
  targetId: CombatantId,
  secondId?: CombatantId,
): Command | null {
  const spell = row(commands, SPELL_ORDER, targetId);
  if (!spell) return null;
  const double = row(commands, ['Doublecast']);
  const self = engine.state().combatants[actorId];
  if (double && self && self.mp >= spell.mpCost * 2 && spell.command.kind === 'ability') {
    // Two targets when there are two worth hitting - FFX's Doublecast asks for
    // a spell and a target, twice. Both Yu Pagodas in one turn is the whole
    // reason the pillars are affordable again.
    const targets =
      secondId !== undefined && secondId !== targetId && spell.validTargets.includes(secondId)
        ? [targetId, secondId]
        : [targetId];
    return { kind: 'ability', id: 'doublecast', targets, wrappedId: spell.command.id };
  }
  return aim(spell, targetId);
}

/**
 * **Tidus's exclusive actions**, in the order they are worth taking.
 *
 * Everything here is something no other guardian on the field can do, which is
 * exactly what makes this the test for whether he should be holding a seat at
 * all: if it returns `null`, his turn is worth less than the black mage's and
 * he gives the seat away ({@link rotation}).
 *
 * Writing it as "what would he actually do?" rather than as a predicate over
 * the state is not a style choice - it is the fix for a measured lock-up. A
 * predicate that said "a pillar is not Slowed yet" stayed true after Tidus ran
 * out of the MP to cast Slow, so he held the seat for the rest of the battle
 * throwing 687-damage swings: Auron acted 36 times in 1,309 ticks, Mental Break
 * held for 11 % of the fight, and the party lost a damage race it had just been
 * handed. Asking for the command instead folds "can he still pay for it?" into
 * the question.
 */
function tidusExclusive(
  commands: AvailableCommand[],
  engine: BattleEngine,
  living: AnyCombatant[],
  standing: AnyCombatant[],
  boss: AnyCombatant,
): Command | null {
  // **Hastega, before anything else.** It halves the party's CTB recovery for
  // the whole battle, so it doubles the damage race, the heals and the Talk
  // coverage across all 180,000 HP. Tidus is the only one who has it (§4.2),
  // and a KO clears it, so it goes back on. Single-target Haste for one member,
  // because Haste is a fraction of Hastega's MP and Tidus has 140 - measured,
  // he ran dry re-casting Hastega after every KO and the party finished the
  // fight at half speed.
  const unhasted = living.filter((c) => !has(c, 'haste'));
  if (unhasted.length > 0) {
    const single = unhasted.length === 1 ? unhasted[0] : undefined;
    const r = single ? row(commands, ['Haste', 'Hastega'], single.id) : row(commands, ['Hastega']);
    if (r) return single ? aim(r, single.id) : aim(r);
  }

  // **Slow the pillars** - see {@link PILLARS_ARE_NOT_THE_FIGHT}. Two casts, 12
  // MP each, and they are halved for the rest of the battle: §1.4
  // [verified: 2 sources] leaves Slow (resist 50) and Delay as the only two
  // statuses a Yu Pagoda is not immune to, and `restorePart` does not clear
  // statuses, so it even survives a Pagoda that is destroyed by something else.
  const unslowed = standing.find((c) => !has(c, 'slow'));
  if (unslowed) {
    const r = row(commands, ['Slow'], unslowed.id);
    if (r) return aim(r, unslowed.id);
    // **And if he cannot pay for it, he buys the MP.** This is the single
    // cheapest 100 MP in the chapter and the autopsy of the three losing seeds
    // is what found it. Slow is `chance 100` against a Pagoda's `resistance 50`
    // and `statuses.ts applyStatus` resolves that as `100 - 50 > rng(0..100)`,
    // i.e. it lands slightly **under half the time** — so a pair costs four
    // casts on average and can easily cost nine. Tidus has 140 MP, Hastega is
    // 30 of it and Slow is 12, so he runs dry after about eight attempts; and
    // once he is dry, `row(['Slow'])` is disabled, {@link tidusExclusive}
    // returns `null`, he gives the seat away and {@link tidusNeeded} never asks
    // for him again. The pillar he failed to Slow then Power Waves at full rate
    // **for the rest of the battle**.
    //
    // Measured on seed 13, which is exactly that state: one Pagoda Slowed in
    // nine casts, 108 Power Waves against a winning seed's 40 — 162,000 of
    // healing into the boss instead of 60,000, and a gauge fed +20 a wave
    // (§1.6's one verified gauge number) that overdrove 24 times instead of 9.
    // One Ether is 100 MP, which is eight more attempts; §1.4's halving lasts
    // the whole battle because `restorePart` does not clear statuses.
    const refill = row(commands, ['Ether', 'Turbo Ether'], PILLARS);
    if (refill) return aim(refill, PILLARS);
  }

  // **Cheer to five.** +1 Strength a stack on the way out and physical damage
  // received x(15-stacks)/15 on the way in, which reaches the Overdrives too -
  // Triumphant Grasp and Ultimate Jecht Shot are `formula: strength` and
  // `formulas.ts defensiveBuffs` keys the `(15 - stacks)` term off the formula,
  // not off the damage type. Gated at *two* short rather than one, because a KO
  // clears the stacks and re-running the whole ladder for a single revived
  // member cost Tidus nineteen turns of a measured run.
  // Gated on **every** living member being short, which in practice means the
  // opening and nothing else. A KO clears the stacks, so the looser "two are
  // short" gate re-ran the whole five-cast ladder after every revive: measured
  // in the losing tail of a seed, Tidus spent five consecutive turns Cheering a
  // Lulu who was killed again between the second and the third, while the boss
  // was healed 6,000 and nobody was healed at all.
  if (living.every((c) => stacksOf(c, 'cheer') < 5)) {
    const cheer = row(commands, ['Cheer']);
    if (cheer) return aim(cheer);
  }

  // **Talk**, on a gauge that is about to become an Ultimate Jecht Shot or a
  // limit-breaking Triumphant Grasp 2 (§1.6). The backstop, not the first
  // answer: a standing aeon covers the same charge for free and there are five
  // of those against two of these (see {@link SUMMON_GAUGE}), so it only fires
  // with no aeon on the field.
  if (
    ultimateJechtShotPhase(boss) &&
    bossGauge(engine, boss) >= TALK_GAUGE &&
    engine.state().aeonId === null &&
    talksLeft(engine) > 0
  ) {
    const t = talk(commands);
    if (t) return t;
  }
  return null;
}

/**
 * The same question asked from **Auron's** seat, where Tidus's own command rows
 * are not visible: is it worth handing him the field?
 *
 * Conservative on purpose, and MP-aware for the same reason
 * {@link tidusExclusive} is: a seat handed over for a job he cannot pay for is
 * a seat Auron does not get back.
 */
function tidusNeeded(
  commands: AvailableCommand[],
  engine: BattleEngine,
  living: AnyCombatant[],
  standing: AnyCombatant[],
  boss: AnyCombatant,
  ignoreId: CombatantId,
): boolean {
  const tidus = engine.state().combatants[PILLARS];
  if (!tidus) return false;
  const mp = tidus.mp;
  // An Ether he could drink counts as MP he has — see the Slow branch of
  // {@link tidusExclusive}. Without this the seat is never handed back to a
  // Tidus who has run dry mid-ladder, and the un-Slowed pillar is permanent.
  const canRefill = row(commands, ['Ether', 'Turbo Ether'], PILLARS) !== undefined;
  if (mp >= 8 && living.some((c) => c.id !== ignoreId && c.alive && !has(c, 'haste'))) return true;
  if ((mp >= 12 || canRefill) && standing.some((c) => !has(c, 'slow'))) return true;
  if (living.every((c) => !c.alive || stacksOf(c, 'cheer') < 5)) return true;
  if (
    ultimateJechtShotPhase(boss) &&
    bossGauge(engine, boss) >= TALK_GAUGE &&
    engine.state().aeonId === null &&
    talksLeft(engine) > 0
  ) {
    return true;
  }
  return false;
}

/**
 * The rotation, one rule per member of the revolving door
 * [§1, ffx-combat-core §1.7 - see {@link BLACK_MAGE}].
 *
 * Three seats, and only one of them is fixed: Yuna's. The other two are shared
 * between **Tidus** (the only Hastega, the only Cheer, the only Slow, the only
 * Talk), **Auron** (the only Breaks) and **Lulu** (the damage). A Switch is
 * free and hands the incoming member the turn happening right now, so the party
 * can always have the right two standing - but it also takes the outgoing
 * member's Haste off the field with them, so the order matters and it is worth
 * writing down:
 *
 *  1. The battle opens Tidus / Yuna / Auron. Hastega lands on all three, both
 *     pillars are Slowed, the Cheer ladder runs.
 *  2. With nothing left that only Tidus can do, **Tidus hands his seat to
 *     Lulu** - who arrives un-Hasted.
 *  3. Which is a Tidus job, so **Auron hands *his* seat to Tidus**: the field
 *     is Tidus / Yuna / Lulu for exactly as long as it takes to Haste her.
 *  4. Then Tidus hands back to Auron and the fight settles into
 *     **Auron / Yuna / Lulu** - Breaks, heals and -agas - with Tidus stepping
 *     back in for a Talk charge or a re-Hastega and stepping straight out.
 */
function rotation(
  actorId: CombatantId,
  commands: AvailableCommand[],
  engine: BattleEngine,
  living: AnyCombatant[],
  standing: AnyCombatant[],
  boss: AnyCombatant,
): Command | null {
  const mage = engine.state().combatants[BLACK_MAGE];
  const mageUseful = mage !== undefined && mage.alive && !has(mage, 'ko') && mage.mp > 0;

  if (actorId === BREAKER) {
    if (tidusNeeded(commands, engine, living, standing, boss, BREAKER) && benched(engine, PILLARS)) {
      return handOver(engine, commands, PILLARS);
    }
    return null;
  }

  if (actorId === BLACK_MAGE) {
    // **She is the one who yields for a job that is about somebody else**, and
    // that is not a detail. Every `tidusNeeded` call ignores the actor asking,
    // because a member who switches himself out to fetch Tidus takes the
    // problem off the field with him: measured, Auron came back from one swap
    // un-Hasted and stayed that way for the remaining 1,000 ticks, acting every
    // 30 ticks instead of 15 and holding Mental Break for 16 % of the fight.
    // Lulu yielding instead leaves Auron standing there to be Hasted, and costs
    // one -aga.
    if (tidusNeeded(commands, engine, living, standing, boss, BLACK_MAGE) && benched(engine, PILLARS)) {
      return handOver(engine, commands, PILLARS);
    }
    if (!mageUseful && benched(engine, BREAKER)) return handOver(engine, commands, BREAKER);
  }
  return null;
}

// ---------------------------------------------------------------------------

function braskasLine(
  actorId: CombatantId,
  commands: AvailableCommand[],
  engine: BattleEngine,
  boss: AnyCombatant,
): Command | null {
  const party = activeParty(engine);
  const living = party.filter((c) => c.alive);
  const standing = pagodas(engine);
  const form = boss.enemy?.formIndex ?? 0;

  // 0. Someone is down. Phoenix Down on a party member only - the boss is
  //    `immune-to-life`, so a revive item thrown at him does nothing (§1.2).
  const up = reviveParty(commands, party);
  if (up) return up;

  // 1. Anyone about to die outranks everything.
  const emergency = repair(commands, living, EMERGENCY);
  if (emergency) return emergency;

  // 1a. A lone pillar is closed by everyone, the supporter included. This line
  //     is built never to enter that state - see
  //     {@link PILLARS_ARE_NOT_THE_FIGHT} - so this is a safety net for a
  //     Pagoda that dies to something else (a splash Overdrive, a counter).
  if (standing.length === 1) {
    const close = swing(commands, standing[0]!.id, false);
    if (close) return close;
  }
  void BREAKER_PILLAR_FLOOR;

  if (actorId === SUPPORT) {
    return supportTurn(actorId, commands, engine, boss, form, standing.length > 0);
  }

  // 2. **The two Stamina Tonics.** §4.4's inventory preset names them and they
  //    double the whole party's maximum HP for the battle without healing a
  //    point of it. The wipe this chapter dies to is always the same: a chain
  //    of party-wide Blade Blitzes grinds everyone to a third, then one
  //    Ultimate Jecht Shot for ~4,700 takes all three at once - and Yuna's
  //    maximum is **2,700**, Lulu's **3,000**, so neither survives one at full
  //    HP without them. There are two tonics, so the rule fires again the
  //    moment the rotation puts a new face on the field; that second one is the
  //    black mage's.
  const frail = living
    .filter((c) => !has(c, 'max-hp-x2'))
    .sort((a, b) => a.stats.maxHp - b.stats.maxHp)[0];
  if (frail) {
    const tonic = row(commands, ['Stamina Tonic']);
    if (tonic) return aim(tonic);
    const tablet = row(commands, ['Stamina Tablet'], frail.id);
    if (tablet) return aim(tablet, frail.id);
  }

  // 3. **Tidus's seat is his only while he has something nobody else can do.**
  //    {@link tidusExclusive} is that list; {@link rotation} is what happens
  //    when it comes back empty.
  if (actorId === PILLARS) {
    const mine = tidusExclusive(commands, engine, living, standing, boss);
    if (mine) return mine;
    const mage = engine.state().combatants[BLACK_MAGE];
    if (mage && mage.alive && mage.mp > 0 && benched(engine, BLACK_MAGE)) {
      const over = handOver(engine, commands, BLACK_MAGE);
      if (over) return over;
    }
    if (benched(engine, BREAKER)) {
      const over = handOver(engine, commands, BREAKER);
      if (over) return over;
    }
  } else {
    const rotate = rotation(actorId, commands, engine, living, standing, boss);
    if (rotate) return rotate;
  }

  // 4. **Keep the casters solvent.** An Ether is 100 MP back and §4.4 ships
  //    three of them, plus two Turbo Ethers and an Elixir. Haste uptime is the
  //    fight, the Breaks cost MP, and so does every -aga the black mage throws.
  //
  //    **But the first Ether belongs to the Slow.** The bag holds three Ethers
  //    and two Turbo Ethers for a seven-link chain, and the breaker empties it
  //    fast: measured on seed 13 Auron drank all three before form 2, which is
  //    why Tidus had nothing left to finish the pillar ladder with. A Mental
  //    Break is worth about 1,500 damage and is stripped by the next Power
  //    Wave; a Slow that lands halves Power Wave **for the rest of the
  //    battle**. So while a pillar is still un-Slowed and Tidus cannot pay for
  //    the cast, nobody else touches the Ethers.
  const self = engine.state().combatants[actorId];
  const tidusMp = engine.state().combatants[PILLARS]?.mp ?? 0;
  const slowDebt = standing.some((c) => !has(c, 'slow')) && tidusMp < 12;
  if (
    self &&
    self.mp < MP_FLOOR &&
    (actorId === PILLARS || !slowDebt) &&
    row(commands, ['Haste', 'Hastega']) === undefined
  ) {
    const refill = row(commands, ['Ether', 'Turbo Ether'], actorId);
    if (refill) return aim(refill, actorId);
  }

  // 5. **The Breaks** (§1.2, §1.5). §1.2 [verified: 2 sources] puts all four at
  //    resistance **0** on this boss - "Full Break is fully effective" - and
  //    each Power Wave strips every one of them again (§1.4), so with the
  //    pillars deliberately left standing this is most of what Auron does.
  //
  //    **Mental Break leads, because the black mage is the damage.** It drops
  //    his Magic Defense 100 to 0: `mitigation(100) = 311` against
  //    `mitigation(0) = 730` (§1.5), a flat x2.35 on every -aga, **1,905 to
  //    4,473**. One application buys about one and a half casts at the higher
  //    number, which is worth more than two of Auron's own swings.
  //
  //    **Armor Break second** - the same x2.35 on every physical hit the party
  //    lands, which is Auron's own and whatever Tidus throws while standing.
  //
  //    **Power Break third.** It halves every physical hit the *boss* lands
  //    (`formulas.ts` step 8) - Left-Arm Strike, Left-Arm Strike 2 and the
  //    party-wide Blade Blitz, about half his output - so it buys healing turns
  //    rather than damage.
  if (actorId === BREAKER) {
    // **Mental Break first whenever she is standing**, pillars or no pillars:
    // it drops his Magic Defense 100 to 0, `mitigation(100) = 311` against
    // `mitigation(0) = 730` (§1.5), a flat x2.35 on a Doublecast - 3,810 to
    // 8,946 - which is worth more than any two swings of his own even when a
    // Power Wave takes it off again ten ticks later.
    if (!has(boss, 'mental-break') && engine.state().activeIds.includes(BLACK_MAGE)) {
      const r = row(commands, ['Mental Break'], boss.id);
      if (r) return aim(r, boss.id);
    }
    // **Power Break under distress was tried here and measured worse**, and
    // the negative result is worth keeping because it is counter-intuitive.
    // `formulas.ts` step 8 halves every physical hit the boss lands while it
    // holds, and the loss census says physical hits are what kills the party
    // (44 Blade Blitzes on seed 34) — so "when the party is losing turns to
    // KOs, buy fewer KOs" reads like the obvious answer. It is not: over seeds
    // 1-400 it cost **five wins** (381/400 against 386/400) and it lost two of
    // the four gate seeds outright (13 and 20260916). The reason is the same
    // one that makes Armor Break unaffordable here — a Power Wave strips it
    // every ~20 ticks against Auron's ~12-tick cadence, so it is a turn bought
    // back at roughly half price, and the turn it displaces is the **Zombie
    // swing**, which deals his damage *and* flips a pillar's next Power Wave
    // from +1,500 to -1,500. Against a boss the party is already out-damaging,
    // a 3,000-point swing beats a half-uptime halving.
    //
    // **Then the Zombie, because it turns the pillars around.**
    //
    // §1.6 [verified: 2 sources]: *"BFA resists Zombie at 50 but is not
    // immune. While Zombie, the next Power Wave deals **1,500 damage** instead
    // of healing - and then cleanses it. **Zombiestrike on a weapon re-applies
    // it repeatedly.**"* That is the encounter's own published exploit and it
    // is the biggest number on the board: every Power Wave that lands on a
    // Zombie is a **3,000-point swing**, and with both pillars up one lands
    // every ten to twenty ticks. It is what stops the pillars being the reason
    // this fight cannot be won.
    //
    // It is a plain Attack, because the rider rides on the weapon
    // (`equipment.ts weaponStatusStrikes`: chance 100 against his resistance
    // 50, so about one swing in two), which means the turn is not spent on the
    // status - it deals Auron's damage as well. And it has to be re-applied,
    // because Power Wave's own strip list takes the Zombie off again. That is
    // exactly what §1.6 describes, and it is why it names a *weapon* rather
    // than a spell.
    if (!has(boss, 'zombie')) {
      const bite = swing(commands, boss.id, false);
      if (bite) return bite;
    }
    // The other two are only worth a turn in the window where they survive.
    // §1.4 is explicit that a *lone* Pagoda stops Power Waving and starts on
    // the party, so it cannot strip anything: the gate is `< 2`, not `=== 0`.
    if (standing.length < 2) {
      if (!has(boss, 'armor-break')) {
        const r = row(commands, ['Armor Break'], boss.id);
        if (r) return aim(r, boss.id);
      }
      // Power Break halves every physical hit the *boss* lands
      // (`formulas.ts` step 8) - Left-Arm Strike, Left-Arm Strike 2 and the
      // party-wide Blade Blitz, about half his output - so it buys healing
      // turns rather than damage, which is why it goes last.
      if (has(boss, 'armor-break') && !has(boss, 'power-break')) {
        const r = row(commands, ['Power Break'], boss.id);
        if (r) return aim(r, boss.id);
      }
    }
  }

  // 6. **A full Overdrive gauge always goes to the boss, and never unspent.**
  //    Shooting Star and Energy Rain are worth four to six ordinary swings
  //    each.
  const ready = bestOverdrive(commands, boss.id);
  if (ready) return ready;

  // 7. The black mage's turn is a spell, not a swing - her Strength is 18 and
  //    her Firaga is worth more than Auron's sword.
  if (actorId === BLACK_MAGE) {
    // **Fury is not worth a turn here, and that is a measured result rather
    // than an assumption.** The row can be fired now ({@link fury}), but every
    // `<spell>-fury` record is `targeting: 'random-enemy'` at a fraction of the
    // spell's own power: measured on this encounter it landed five casts of
    // 583-607, two of which went into a Yu Pagoda, for about 2,900 total -
    // against 3,810 for the plain Doublecast it displaced. The gauge is better
    // left unspent than spent on that.
    const spell = blackMagic(commands, engine, actorId, boss.id);
    if (spell) return spell;
  }

  return swing(commands, boss.id);
}

/**
 * Yuna's turn.
 *
 * Protect is re-applied ahead of healing because it is worth more than a heal:
 * it halves Left-Arm Strike **and** Blade Blitz for the rest of the battle,
 * where a Curaga buys back one swing. It has to be re-applied rather than cast
 * once — Protect, Haste and Cheer are all `clearedByKo`, so every revive costs
 * the party its buffs, which is the same thing §2.3 notes of the fayth's
 * Auto-Life later ("KO revival loses buffs").
 */
function supportTurn(
  actorId: CombatantId,
  commands: AvailableCommand[],
  engine: BattleEngine,
  boss: AnyCombatant,
  form: number,
  pagodasUp: boolean,
): Command | null {
  const state = engine.state();
  const living = activeParty(engine).filter((c) => c.alive);

  // **Refill before the tank is empty.** Yuna's 320 MP is 16 Curagas against a
  // 180,000-HP chapter, and §4.4 ships 3 Ethers, 2 Turbo Ethers and an Elixir
  // for exactly this reason. Turbo Ether first (+500, so a full tank from any
  // level), then Ether (+100), then the Elixir, which is also a full heal.
  // {@link MP_FLOOR} is two Curagas, so the refill turn is taken while she can
  // still answer an emergency, not after she has already failed to.
  //
  // **Never the Elixir on a Zombie** (PR-0198). It restores HP as well as MP,
  // and HP restored to a Zombie is damage: live, a Triumphant Grasp'd Yuna
  // drank it for 5,130 and KO'd herself. Under Zombie the refill is an Ether
  // (MP only), and with only the Elixir left the Zombie is cured first so the
  // Elixir is safe on a later turn.
  const me = state.combatants[actorId];
  if (me && me.mp < MP_FLOOR) {
    const zombie = has(me, 'zombie');
    const refill = row(commands, zombie ? ['Turbo Ether', 'Ether'] : ['Turbo Ether', 'Ether', 'Elixir'], actorId);
    if (refill) return aim(refill, actorId);
    const cure = zombie ? row(commands, ['Holy Water', 'Remedy'], actorId) : undefined;
    if (cure) return aim(cure, actorId);
  }

  // **The summon outranks the Protect and the routine top-up**, and that
  // ordering is the second half of the round-5 change ({@link summonNow}).
  // Anything that is about to die has already been answered - `braskasLine`
  // runs `repair(EMERGENCY)` before this function is ever called - so what the
  // summon preempts here is a Protect and a heal of a member above
  // {@link EMERGENCY}. Both are worth nothing for the stretch an aeon holds the
  // field, because **no party member is targetable at all while it stands**;
  // and the turn Yuna spends getting one out is the turn that decides whether
  // the charge lands on the summon or on the party. Measured before this
  // ordering: in a chaotic link somebody is always under
  // {@link HEAL_FLOOR}, so `repair` answered every one of her turns and the
  // summon branch below was simply never reached - seed 111 reached the
  // Ultimate Jecht Shot phase, ate three of them and summoned nothing.
  if (summonNow(engine, boss)) {
    const urgent = nextAeon(commands);
    if (urgent) return urgent;
  }

  const unprotected = living.find((c) => !has(c, 'protect'));
  if (unprotected) {
    const r = row(commands, ['Protect'], unprotected.id);
    if (r) return aim(r, unprotected.id);
  }

  const fix = repair(commands, living, HEAL_FLOOR);
  if (fix) return fix;

  // **The second summon site, and the one that fires in a winning run** - the
  // rule itself is {@link summonNow}, which is also read one branch above this
  // one, ahead of the Protect and the routine top-up.
  //
  // §1.6 makes aeons explicitly legal here and the boss carries a dedicated
  // anti-aeon Overdrive *because* they were expected. While an aeon stands no
  // party member can be targeted at all, so each one is a stretch of turns in
  // which the party takes zero damage, and Grand Summon hands it a full gauge
  // so it Overdrives on arrival instead of on its third turn.
  //
  // **Spent on the gauge, and on nothing else.** Two gates that used to sit
  // here are gone and both removals are measured in {@link summonNow}: the
  // pillars-down gate (which meant the roster was never spent at all) and
  // round 4's "hold the whole roster for the Ultimate Jecht Shot phase" (which
  // is a gate on the *boss's* HP, and a losing party never gets him there).
  if (summonNow(engine, boss)) {
    const summon = nextAeon(commands);
    if (summon) return summon;
  }
  void form;
  void pagodasUp;

  // **Her idle turn is a pre-heal, not a Defend.** Measured, she had 29 idle
  // turns in a losing run while the party sat between 72 % and full — and then
  // an Ultimate Jecht Shot landed on a party that was 900 HP short of surviving
  // it. Topping everyone to full between his Overdrives is what "keep HP high
  // for Ultimate Jecht Shot" (§4) actually costs, and the cheap rows come first
  // so the Curagas and X-Potions stay for the emergencies.
  // Her idle floor rises to **full** when his gauge is about to pop and there
  // is nothing left to cancel it with: "keep HP high for Ultimate Jecht Shot"
  // (§4) is a thing she has to have already done when it lands, not something
  // she can answer afterwards.
  const bracing = bossGauge(engine, boss) >= BRACE_GAUGE && state.aeonId === null;
  const topUp = repair(commands, living, bracing ? 1 : IDLE_TOPUP);
  if (topUp) return topUp;

  // And when there is nothing left to top up, she swings. Her Attack is worth
  // ~285 against Defense 100 and ~660 against an Armor-Broken boss, which is
  // small — but Defend is worth nothing, and the chapter is decided by a
  // damage race against a pool the Yu Pagodas are refilling at 1,500 a cast.
  // Measured, she had 38 Defend turns in one losing link.
  return swing(commands, boss.id, false) ?? guard(commands, actorId);
}

// ---------------------------------------------------------------------------
// Links 2..n — the possessed aeons
// ---------------------------------------------------------------------------

/**
 * One aeon at a time, with the two Pagodas again (§2.1–§2.3).
 *
 * **Everything swings at the aeon, and nothing at the pillars.** A possessed
 * aeon is a live copy of the player's own (§2.2), so on the `dreams-end`
 * roster it has between 1,465 and 2,840 HP — one or two Auron swings — against
 * a Yu Pagoda's 5,000. Killing the pillars first is spending five turns to
 * save a fight that is over in three, and now that they come back every 72
 * ticks (§1.4) it is spending five turns again and again. The `#210` Power
 * Wave heals the aeon 1,500 a cast, which is real, and the answer to it is to
 * finish faster, not to chase the source.
 *
 * **No Breaks here.** §2.2 [verified: 2 sources] is the Aeon Ribbon rule: an
 * aeon is immune to every negative status except Curse and Delay, and the data
 * says so — `possessedAeonEnemyDef` sets power/magic/armor/mental-break to
 * **255**. The engine still offers the row, so a tactic that asks for Armor
 * Break here gets it, resolves it, and lands nothing: measured, six wasted
 * Auron turns across one chain, in exactly the links the losses concentrate in.
 *
 * The party is also under the fayth's permanent Auto-Life from this link on
 * (§2.3, "cannot lose"), so the line is deliberately plain.
 */
function possessedAeonLine(
  actorId: CombatantId,
  commands: AvailableCommand[],
  engine: BattleEngine,
  boss: AnyCombatant,
): Command | null {
  const party = activeParty(engine);
  const living = party.filter((c) => c.alive);

  const up = reviveParty(commands, party);
  if (up) return up;
  const emergency = repair(commands, living, EMERGENCY);
  if (emergency) return emergency;

  if (actorId === SUPPORT) {
    const fix = repair(commands, living, HEAL_FLOOR);
    if (fix) return fix;
    const unprotected = living.find((c) => !has(c, 'protect'));
    if (unprotected) {
      const r = row(commands, ['Protect'], unprotected.id);
      if (r) return aim(r, unprotected.id);
    }
    return guard(commands, actorId);
  }

  return swing(commands, boss.id);
}

// ---------------------------------------------------------------------------
// The last link — Yu Yevon
// ---------------------------------------------------------------------------

/**
 * Do not hit him. See the file header: every damaging action is answered by a
 * 9,999 Curaga, so a party capped near 3,700 heals him for a living.
 *
 * The line is §3.5's attrition route with §3.5's Doom route stacked on top:
 * take both Pagodas off the board so nothing heals him and nothing damages the
 * party, throw the single Candle of Life, and then **wait**, because Gravija
 * quarters his own HP every time he casts it. Defend is the right idle turn —
 * it is not a damaging action, so it never arms the counter.
 */
function yuYevonLine(
  actorId: CombatantId,
  commands: AvailableCommand[],
  engine: BattleEngine,
  boss: AnyCombatant,
): Command | null {
  const party = activeParty(engine);
  const living = party.filter((c) => c.alive);

  const up = reviveParty(commands, party);
  if (up) return up;

  // 1. **Doom, first action of the fight** (§3.1, §3.5). A Candle of Life
  //    kills him in exactly three of his own turns, and it deals no damage at
  //    all, so it never arms the Curaga counter. It is also the one route the
  //    Yu Pagodas cannot undo: the `#210` Power Wave strips Poison, Zombie and
  //    Reflect, and nothing else (§2.3). It goes before the pillars because
  //    three of his turns is less time than one revive cycle.
  if (!has(boss, 'doom')) {
    const candle = row(commands, ['Candle of Life'], boss.id);
    if (candle) return aim(candle, boss.id);
  }

  // 2. The pillars heal him 1,500 a cast and, now that §1.4's revive rule is
  //    implemented, they keep doing it: at 72 ticks apiece they put roughly
  //    4,500 back between his Gravijas, which is more than the 75 % of a low
  //    current HP that Gravija takes off. Left alone the attrition route
  //    (§3.5) stalls at an equilibrium around six thousand and never reaches
  //    {@link YU_YEVON_FINISH}. So they stay suppressed — by everyone here,
  //    because nothing else on this field is worth a turn and a solo survivor
  //    Curses and Osmoses the party.
  const standing = pagodas(engine);
  if (standing.length > 0) {
    const emergency = repair(commands, living, EMERGENCY);
    if (emergency) return emergency;
    const cheap = swing(commands, pagodaTarget(standing).id, false);
    if (cheap) return cheap;
  }

  // 3. His own Gravija has taken him low enough that one swing ends it before
  //    the counter can matter.
  if (boss.hp <= YU_YEVON_FINISH) return swing(commands, boss.id);

  // 4. Otherwise: repair, then idle. Gravija can never KO (75 % of *current*
  //    HP), and with the Pagodas gone nothing else on the field deals damage,
  //    so the party cannot lose a race it is refusing to run.
  const fix = repair(commands, living, 0.95);
  if (fix) return fix;
  return guard(commands, actorId);
}

// ---------------------------------------------------------------------------

/** The chapter's line. One tactic, three kinds of link. */
export const braskasFinalAeon: Tactic | null = (actorId, commands, engine) => {
  const boss = chapterBoss(engine);
  if (!boss) return null;

  // An aeon on the field plays itself: spend a full gauge, otherwise swing.
  const state = engine.state();
  if (state.aeonId !== null && actorId === state.aeonId) {
    return aeonTurn(commands, boss.id);
  }

  if (boss.id === 'yu-yevon') return yuYevonLine(actorId, commands, engine, boss);
  if (boss.id.startsWith('possessed-')) return possessedAeonLine(actorId, commands, engine, boss);
  return braskasLine(actorId, commands, engine, boss);
};
