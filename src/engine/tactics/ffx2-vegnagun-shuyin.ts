/**
 * Chapter 5 - the Vegnagun chain and Shuyin [research/ffx2-vegnagun-shuyin.md].
 *
 * Five battles with no menu between them: Tail -> Leg + Nodes -> Body/Core +
 * Bulwarks -> Head + Redoubts -> Shuyin (§2). One party, one HP bar, one MP bar
 * and **one bag** carry all five, which is what makes this chapter a resource
 * problem rather than five damage races. Measured on the shipped build and the
 * real engine, with Darkness's HP cost and the Bulwarks' retaliation both live:
 * **580 of 600 contiguous chains won (96.7%)** - 194/200 from seed 1, 192/200
 * from 201, 194/200 from 1001.
 *
 * ## The line
 *
 * **§7.1's canonical clear: "Two Dark Knights spamming Darkness, one White Mage
 * or Alchemist healing" `[verified: 2 sources - FF Wiki + GamerGuides]`.**
 * Rikku and Paine are the Dark Knights, Yuna is the White Mage, exactly as
 * `src/data/ffx2/builds/farplane.ts` equips them off §6.3. The Dark Knights
 * open on **Black Sky** while their MP lasts and fall back to **Darkness**,
 * which is the whole offence for the four reasons §6.4/§7.1 give:
 *
 *   * it **ignores Defense**, so the Right Redoubt's Def 133 and Shuyin's
 *     Def 132 stop mattering;
 *   * it is **all-enemy**, so one action hits Head + both Redoubts, or
 *     Core + both Bulwarks - and in this engine an `all-enemies` action pays
 *     its **full** damage to each target rather than splitting it;
 *   * it is **long range**, so nothing in the chain is out of reach;
 *   * it costs **HP, not MP** - 12.5% of the user's own max HP (§6.4).
 *
 * That last line is the axis the whole file turns on now that the engine
 * actually charges it (see the defect list below). A Dark Knight pays about a
 * **twelfth of the party's whole HP bar every time she casts**, which over a
 * chain is 65,000-83,000 HP the healer has to find; while the cost was
 * silently free, the chapter could be won by spamming one row and never
 * thinking about the bag.
 *
 * Everything else here is about buying the most fight per turn, because the
 * party is **losing the action race**: the Tail runs Agility 115 and Shuyin 133
 * against a Dark Knight's 41, the worst in the game (§3.1, §3.5, §6.2, §7.4).
 * Haste is no answer - `[verified: 2 sources]` in ffx2-combat-core §1.2 puts it
 * at **x1.05**, not the x2 the FF Wiki spell table claims - so the party has to
 * win on what each action is worth, not on how many it gets.
 *
 * ## The rules, and the measurement behind each
 *
 * All figures below are chains won out of a contiguous window, measured with
 * the rest of the file held fixed at the time.
 *
 * **Black Sky before Darkness (511/600 -> 557/600, +7.7 points).** §6.4 lists
 * Black Sky in the Dark Knight's Arcana and the shipped build has both girls
 * knowing it. It is 80 MP, ten hits, all-enemies, and scales off **Strength**
 * (`special-magic`, ffx2-combat-core §3.8) - so it is the one action in the
 * chapter that converts the attackers' 224/229 MP, a pool they otherwise never
 * touch in five battles, into damage, and it costs **no HP** at the moment when
 * HP is the binding resource. Measured at about 2,750 a cast against Darkness's
 * 1,950, and the casts land early, which is where the chain was losing.
 *
 * **At the Leg, every swing is a single-target swing at the Leg (557 -> 576).**
 * §7.2's Leg row is "Ignore the Nodes' 300,000 HP; **all damage goes to the Leg
 * (18,220)**", and §3.2 gives the reason the all-enemy rows are wrong there:
 * the Nodes' colour machine advances "on (own turn resolves) **OR** (hit by any
 * attack)", and its GREEN face casts Cura, Regen, Shell and Protect **on the
 * Leg**. Darkness and Black Sky both hit all three Nodes, so spraying is
 * winding up the thing that heals the target - measured, a Leg fight that
 * sprays takes ten Curas and eight Regens and outlives fourteen Darknesses. The
 * Leg's own Def is **13** (§3.2), so a plain Attack loses almost nothing to
 * armour, costs no HP and leaves the Nodes asleep.
 *
 * **Revive with Life, then Full-Life, then Mega Phoenix, and only then a
 * Phoenix Down (158/200 -> 179/200, the single largest rule in the file).**
 * Phoenix Down stands a girl up on **25%** of her bar [ffx2-combat-core §5.5] -
 * less than one Tail Beam (5/16 = 31.25%, §3.1) - so a Phoenix Down revive at
 * the Tail or at Shuyin is a girl who dies again before her next turn. Measured
 * on the losing seeds, that is exactly what happened: twenty-five consecutive
 * Phoenix Downs at Shuyin and four Darknesses in the whole fight. Life is 50%
 * for 18 MP, Full-Life is 100% for 60, and Mega Phoenix is 50% to **every**
 * downed girl at once.
 *
 * **Only the White Mage heals anyone but herself.** §7.1's clear has three
 * slots: two attackers and **one** healer. Letting the Dark Knights throw the
 * emergency party heal as well measured **66/200** against 150/200 - the bag is
 * gone by the Leg. The Dark Knights drink for themselves and otherwise never
 * stop casting.
 *
 * **When two girls are one hit from death, spend a Megalixir (135/200 ->
 * 150/200).** "One hit from death" is a Tail Beam plus a Noli Me Tangere -
 * 5/16 of max HP plus 1,323 (§3.1). A Mega-Potion is 2,000 each and does not
 * clear that line; §6.8 stocks four Megalixirs and five Elixirs for precisely
 * the turn where the next enemy action ends the run.
 *
 * **Cure Petrify / Berserk / Stop / Slow / Silence / Confuse before healing.**
 * The Leg's Action1 is one-in-three Berserk / Break / Slow every time it fires
 * (§3.2, §5.2); the Left Bulwark adds Break, Bio and a 9-count Doom (§3.3);
 * Mors Certa lands 80% Silence + Darkness + Poison party-wide (§3.4). §6.8
 * stocks 10-20 Remedies and calls them "Mors Certa insurance". A berserked
 * White Mage cannot heal, and a petrified one is the run.
 *
 * **Buff only while at least two girls are missing it (154/200 -> 158/200).**
 * The Left Bulwark's Dispel and the Left Redoubt's are single-target, and
 * chasing every one of them cost eight curtain actions inside one Body fight.
 * Odi Et Amo and any party-wide strip still clear the quorum and still get
 * answered.
 *
 * **Protect first at the Leg and at Shuyin, Shell first everywhere else, and
 * nothing at all at the Tail (162/200 -> 166/200 for the Leg row alone).**
 * §7.2's Leg opener is literally "Buff to **Protect** + Haste on everyone", and
 * §3.2 says why: the Nodes' RED face is Missile and Dies Irae, both physical,
 * and they are the sustained damage in that fight. §7.2's Shuyin opener is
 * "**Light Curtain** (Protect) on all three + **Lunar Curtain** (Shell) on all
 * three", which is §1.2's "single most important implementation note" - every
 * Vegnagun part is magic-type or fractional and **Shuyin is almost entirely
 * physical**. The Tail row is "Buffs are near-useless... raw max HP is the only
 * defence", because Tail Beam is %-max-HP and Noli Me Tangere a flat constant.
 *
 * **A Dark Knight below 5/16 of her bar drinks instead of casting.** 5/16 is
 * one Tail Beam (§3.1): below it the next enemy action kills her outright, and
 * the party then spends two turns on a revive and a heal. Swept on the finished
 * line over 600 chains: 0.25 -> 569, **0.3125 -> 580**, 0.35 -> 574,
 * 0.40 -> 573, 0.45 -> 419 (at 0.45 she stops being an attacker and the Head's
 * cannon clock runs out).
 *
 * **Heal harder where survival is the problem and less where the clock is.**
 * `LINK_CRITICAL` is §7.2's own per-battle table turned into a number: the Tail
 * and the Leg are survival problems, the Head opens with "**Time limit**" and
 * "don't over-invest", and the Head's cannon clock (§4.2) ends the run whether
 * or not the party is healthy. One band for all five links measured 150/200
 * against 152/200 split, and the split is what let the Head band come down to
 * 0.6 without the Tail collapsing.
 *
 * ## Why the healer is Yuna, against §7.2's advice
 *
 * §5.5/§3.5: on the original PS2 release **Shuyin preferentially targets Yuna**
 * whenever she is alive, and `src/battle/ffx2/ai/shuyin.ts` ships that
 * behaviour. §7.2 draws the obvious conclusion - *"do not make Yuna the
 * healer"* - and this tactic does it anyway, because the shipped build has no
 * other healer. What it does instead is get Protect onto her before the first
 * Terror of Zanarkand, which turns 1,710-1,935 into 855-968 and leaves her
 * standing. That is §7.2's own bargain, taken from the other end.
 *
 * ## Defects this chapter surfaced, all fixed outside this file
 *
 * Every one is written up in `docs/CONTRACT-CHANGES.md` under the key
 * `ffx2-vegnagun-shuyin`. The first five were found in the previous round; the
 * last three are this round's, and the first two of those made the chapter
 * **harder**, not easier.
 *
 *   1. **The FFX-2 command menu had no Item row at all**
 *      (`src/battle/ffx2/targeting.ts`, `setup.ts`, `execute.ts`, `engine.ts`).
 *   2. **Revives and item heals landed at a sixteenth of their value**
 *      (`src/battle/ffx2/adapters.ts`).
 *   3. **A heal registered a Chain hit** (`src/battle/ffx2/resolve.ts`).
 *   4. **Accessories did nothing** (`src/battle/ffx2/accessories.ts`).
 *   5. **Darkness was typed `physical`**
 *      (`src/data/ffx2/abilities/dark-knight.ts`), so §3.3's retaliation
 *      answered it with the AoE instead of the single-target buff-strip.
 *   6. **Darkness's HP cost was never charged**
 *      (`src/battle/ffx2/resolve.ts`, `targeting.ts`). `extra.hpCostPercent`
 *      was written by the data layer and read by nobody, so §6.4's "12.5%
 *      (1/8) of user's max HP `[verified: 2 sources]`" - the ability's entire
 *      downside - was free. 65,000-83,000 unpaid HP per chain, and the line
 *      that used to win fell from 38/40 to 23/40 once it was charged.
 *   7. **`AiScript.onDamaged` was declared and never called**
 *      (`src/battle/ffx2/engine.ts`). Three canon mechanics were inert: §3.3's
 *      Core attack log, which is the only thing that makes the Bulwarks
 *      retaliate and which the research calls "the fight's whole identity";
 *      §3.2's Node colour machine, which advances when a Node is hit; and
 *      §3.4's Odi Et Amo hit counter.
 *   8. **Every MP restorative in X-2 was inert**
 *      (`src/battle/ffx2/resolve.ts`). `extra.restoresMp` (Ether 100, Turbo
 *      Ether 500) and `extra.alsoRestoresMp` (Elixir and Megalixir, "up to
 *      9999 HP **and 999 MP**", ffx2-combat-core §5.5) were written by the
 *      data layer and read by nobody.
 *
 * A ninth from last round - `validTargets` collapsing every single-target row
 * to one id - was fixed concurrently by the Chapter 4 agent.
 */

import type { AnyCombatant, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, aim, has, hpFraction, row } from './common.ts';

/** The boss id `index.ts` keys the *last* link on. */
export const FFX2_SHUYIN_ID: CombatantId = 'shuyin';

/**
 * Every boss this chapter fields, in chain order [§2, `ids.ts`
 * `VEGNAGUN_CHAIN_ORDER`]. The tactic has to be live in **all five** links, and
 * `tacticFor` keys on a boss id that is on the field, so all five are
 * registered — one id would leave four battles to the generic strategy.
 */
export const FFX2_VEGNAGUN_CHAIN_IDS: readonly CombatantId[] = [
  'vegnagun-tail',
  'vegnagun-leg',
  'vegnagun-body',
  'vegnagun-head',
  'shuyin',
];

/** The Darkness users, per §7.1/§6.3. Yuna is the White Mage. */
const DARK_KNIGHTS: readonly CombatantId[] = ['rikku', 'paine'];

/**
 * Darkness costs **12.5% of the user's own max HP** and the menu greys the row
 * out when she cannot pay [§6.4 `[verified: 2 sources]`]. Below this fraction
 * she drinks instead. The number is **5/16**, one Tail Beam (§3.1): a Dark
 * Knight never walks into an enemy turn that can kill her outright, because a
 * dead attacker costs the party two more turns (a revive and a heal) on top of
 * her own. Swept over 600 chains on the finished line: 0.25 -> 569,
 * **0.3125 -> 580**, 0.35 -> 574, 0.40 -> 573, 0.45 -> 419.
 */
const DARKNESS_HP_FLOOR = 0.3125;

/**
 * How many girls must be missing a buff before the healer spends a turn on it.
 *
 * The Left Bulwark's Dispel (§3.3) and the Left Redoubt's (§3.4) are
 * single-target, and chasing each one put **eight** curtain actions inside one
 * Body fight. A quorum of two answers the party-wide strips (Odi Et Amo,
 * §3.4) and ignores the single-target ones. Swept: 1 -> 154/200,
 * **2 -> 158/200**, 3 -> 154/200.
 */
const BUFF_QUORUM = 2;

/** Below this the healer drinks a Turbo Ether: Life is 18 MP, Full-Life 60. */
const MP_FLOOR = 60;

/**
 * The healer's bands, measured against what the chain actually hits for.
 *
 * Tail Beam alone is **5/16 (31.25%) of max HP** every time the Tail acts
 * (§3.1), and it acts about three times per girl at Agi 115 against the Dark
 * Knights' 41 (§3.1, §6.2) - so a girl who is merely "a bit hurt" is two enemy
 * turns from dead and the healer has one turn in three. That is why `CRITICAL`
 * sits high. `TOPUP_BAND` is generous for the same reason - the White Mage's
 * alternative is Pray, measured at 48 HP against a 5,862-HP bar.
 */
const TOPUP_BAND = 0.85;
const HURT = 0.7;
const CRITICAL = 0.75;

/**
 * Per-link override of `CRITICAL`, straight off §7.2's own per-battle table.
 *
 * The Tail row is a pure survival problem ("keep everyone above 1,323 HP so
 * Noli Me Tangere can't wipe") and the Leg is the same shape, while the Head
 * row opens with "**Time limit**" and "don't over-invest" — the Head's cannon
 * clock (§4.2) ends the run whether or not the party is healthy, so a turn
 * spent topping someone up there costs more than it does anywhere else. One
 * band for all five links measured 150/200 against 152/200 for the split, and
 * the split is what let the Head band come down to 0.6 without the Tail
 * collapsing.
 */
const LINK_CRITICAL: Readonly<Record<string, number>> = {
  'vegnagun-tail': 0.85,
  'vegnagun-leg': 0.85,
  'vegnagun-body': 0.7,
  'vegnagun-head': 0.6,
  shuyin: 0.8,
};

/**
 * The healing ladder, strongest first, in the order §6.8's inventory offers it.
 *
 * X-Potion is a full HP restore for one girl and the chapter carries 10-30 of
 * them (§6.8); Mega-Potion is 2,000 to the whole party; Hi-Potion is the
 * top-up [ffx2-combat-core §5.5]. Yuna's own Curaga/Cura sit at the bottom as
 * the fallback for a party that has drunk the bag dry — she has 206 MP and six
 * Turbo Ethers, so the spellbook is a reserve rather than a plan.
 */
const FULL_HEAL = ['X-Potion', 'Elixir', 'Megalixir', 'Curaga', 'Hi-Potion', 'Cura', 'Potion'];
/**
 * The routine answer to a party-wide hit. Mega-Potion before Megalixir, always:
 * both cover the whole party, the bag holds fifteen of the first and four of
 * the second, and putting the Megalixir first spent all four inside the **Tail**
 * fight (measured 153/200 against 155/200 the other way round).
 */
const PARTY_HEAL = ['Mega-Potion', 'Megalixir'];

/**
 * "One hit from death": a Tail Beam (5/16 of max HP) plus a Noli Me Tangere
 * (1,171-1,323, taken at its ceiling) — §3.1's two openers, and the shape every
 * other link repeats. A Mega-Potion is a flat 2,000 each and does **not** clear
 * that line for a 5,862-HP Dark Knight, so when two girls are inside it the
 * healer spends a Megalixir instead: §6.8 stocks four of them and five Elixirs
 * for exactly the turn where the next enemy action ends the run. Adding this
 * one rule measured **135/200 -> 150/200**.
 */
const TAIL_BEAM = 0.3125;
const NOLI = 1323;
const EMERGENCY_PARTY = ['Megalixir', 'Mega Phoenix', 'Mega-Potion'];
const TOPUP = ['Hi-Potion', 'Curaga', 'Potion', 'Cura', 'Cure'];

/**
 * Statuses worth a turn to lift, and what lifts them.
 *
 * Petrify and Berserk take the girl out of the fight outright; Slow halves her
 * ATB, which in a chapter the party is already losing the action race in
 * (§3.1: Tail Agi 115 against Dark Knight 41) is close to the same thing.
 * Silence only matters on the healer, and she is the one holding the Remedy.
 */
const DISABLING: readonly string[] = ['petrify', 'berserk', 'stop', 'slow', 'silence', 'confuse'];
const CURES = ['Remedy', 'Esuna'];

/**
 * Revival, **strongest first** — not cheapest first, which is the trap.
 *
 * Phoenix Down stands a girl up on **25%** of her bar [ffx2-combat-core §5.5],
 * and one Tail Beam is 31.25% (§3.1), so a Phoenix Down revive hands the boss a
 * free kill and the party a second revive to pay for. Life is 50% for 18 MP,
 * Full-Life 100% for 60, and Mega Phoenix 50% to **every** downed girl at once.
 * Reordering this list alone measured **158/200 -> 179/200**, the largest
 * single rule in the file.
 */
const RAISE_ONE = ['Life', 'Full-Life', 'Mega Phoenix', 'Phoenix Down'];
const RAISE_ALL = ['Mega Phoenix'];

/** Which link is on the field, by the boss that is standing. */
function linkOf(combatants: Readonly<Record<CombatantId, AnyCombatant>>): CombatantId | undefined {
  return FFX2_VEGNAGUN_CHAIN_IDS.find((id) => combatants[id] !== undefined);
}

/** The living, non-`removed` boss of this link — never a part. */
function bossOf(engine: Parameters<Tactic>[2]): AnyCombatant | undefined {
  const combatants = engine.state().combatants;
  const id = linkOf(combatants);
  return id ? combatants[id] : undefined;
}

/** A boss that can actually be hit right now (the Head hides in Phase A, §5.4). */
function targetable(c: AnyCombatant | undefined): boolean {
  return c !== undefined && c.alive && !c.removed && !c.flags.untargetable && !c.flags.hidden;
}

/** The lowest living girl by HP fraction. */
function weakest(party: AnyCombatant[]): AnyCombatant | undefined {
  const living = party.filter((c) => c.alive);
  if (living.length === 0) return undefined;
  return living.reduce((low, c) => (hpFraction(c) < hpFraction(low) ? c : low));
}

/**
 * The buff order for this link, and the rows that deliver it.
 *
 * Shell first where Vegnagun's own moveset is doing the damage, Protect first
 * at the Leg (the Nodes are physical) and against Shuyin (§1.2's magic-vs-
 * physical inversion), nothing at all at the Tail [§1.2, §7.2 — see the table
 * in the file header].
 * Each is named as an item *and* as the spell, so any girl can lay the buff on
 * with a curtain and Yuna only spends MP when the bag is empty: §7.2's Shuyin
 * opener is literally "**Light Curtain** (Protect) on all three + **Lunar
 * Curtain** (Shell) on all three", and §6.8 stocks 10-20 of each.
 */
const BUFFS: Readonly<Record<string, ReadonlyArray<{ status: string; rows: readonly string[] }>>> = {
  'vegnagun-tail': [],
  // §7.2's Leg opener is literally "Buff to **Protect** + Haste on everyone",
  // and §3.2 is why: the Nodes' RED face is Missile and Dies Irae, both
  // `physical`, and they are the sustained damage in the fight. Vita Brevis is
  // the magic half, so Shell still follows. Measured 162/200 -> 166/200.
  'vegnagun-leg': [
    { status: 'protect', rows: ['Light Curtain', 'Protect'] },
    { status: 'shell', rows: ['Lunar Curtain', 'Shell'] },
  ],
  shuyin: [
    { status: 'protect', rows: ['Light Curtain', 'Protect'] },
    { status: 'shell', rows: ['Lunar Curtain', 'Shell'] },
  ],
};
const VEGNAGUN_BUFFS: ReadonlyArray<{ status: string; rows: readonly string[] }> = [
  { status: 'shell', rows: ['Lunar Curtain', 'Shell'] },
  { status: 'protect', rows: ['Light Curtain', 'Protect'] },
];

function buffsFor(link: CombatantId | undefined): ReadonlyArray<{ status: string; rows: readonly string[] }> {
  if (link !== undefined && BUFFS[link] !== undefined) return BUFFS[link];
  return VEGNAGUN_BUFFS;
}

export const ffx2VegnagunShuyin: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const link = linkOf(state.combatants);
  const boss = bossOf(engine);
  if (!boss || !boss.alive) return null;

  const actor = state.combatants[actorId];
  if (!actor) return null;
  const party = activeParty(engine);
  const downed = party.filter((c) => !c.alive);
  const isDarkKnight = DARK_KNIGHTS.includes(actorId);

  // 1. Stand someone up, with the strongest revive on hand. Whoever's turn it
  //    is does this — a Dark Knight who holds her cast for one action is
  //    cheaper than a party fighting the rest of the chain two-handed [§7.1's
  //    three slots]. Restricting revival to the healer measured 161/200
  //    against 166/200, so it stays everyone's job.
  if (downed.length > 0) {
    if (downed.length > 1) {
      const all = row(commands, RAISE_ALL, downed[0]!.id);
      if (all) return aim(all, downed[0]!.id);
    }
    const one = row(commands, RAISE_ONE, downed[0]!.id);
    if (one) return aim(one, downed[0]!.id);
  }

  const low = weakest(party);

  // ---------------------------------------------------------------- healer
  //
  // **Only the White Mage heals anybody but herself**, and that is the single
  // most expensive thing this tactic gets right. §7.1's clear is "two Dark
  // Knights spamming Darkness, **one** White Mage or Alchemist healing", and
  // the measured cost of letting the Dark Knights help is exactly the fight:
  // on seed 42 with a shared heal step the Tail took **54 party actions of
  // which 37 were healing and only 17 were Darkness**, and it drained 20
  // X-Potions, 5 Elixirs and 4 Megalixirs — the whole premium bag — in the
  // first of five battles, so the Leg fell over for want of a heal. The Dark
  // Knights drink for themselves and otherwise never stop casting.
  if (!isDarkKnight) {
    // 3. This link's buffs, laid on once and re-laid after a *party-wide*
    //    strip. Odi Et Amo "strips Shell, Protect, Reflect, Regen, Haste…"
    //    (§3.4) and both Bulwarks and Redoubts carry a single-target Dispel
    //    (§3.3, §3.4) — chasing the single-target ones is a losing trade, so
    //    the gate is `BUFF_QUORUM`.
    for (const buff of buffsFor(link)) {
      const without = party.filter((c) => c.alive && !has(c, buff.status));
      if (without.length < BUFF_QUORUM) continue;
      const r = row(commands, buff.rows, without[0]!.id);
      if (r) return aim(r, without[0]!.id);
    }

    // 3b. Cure a status that takes a girl out of the fight.
    //
    // The Leg's Action1 is one-in-three **Berserk / Break (Petrify) / Slow**
    // every time it fires (§3.2, §5.2), the Left Bulwark adds Break and Bio and
    // a 9-count Doom (§3.3) and Mors Certa lands 80% Silence + Darkness +
    // Poison party-wide (§3.4). A petrified or berserked girl is out of the
    // fight, and a berserked **White Mage** is the run, so this sits above
    // healing: §6.8 stocks 10-20 Remedies for exactly this and calls them
    // "Mors Certa insurance". Poison and Darkness are not on the list — they
    // are unpleasant, not disabling, and a turn is worth more than either.
    for (const status of DISABLING) {
      const afflicted = party.find((c) => c.alive && has(c, status));
      if (!afflicted) continue;
      const cure = row(commands, CURES, afflicted.id);
      if (cure) return aim(cure, afflicted.id);
    }

    // 4. Heal, cheapest sufficient answer first, because §6.8's bag has to
    //    carry **five** battles: two girls one hit from death get the
    //    Megalixir; two merely hurt means a party-wide hit landed, so answer it
    //    party-wide; one girl in the red gets the full restore; anything above
    //    that is a top-up off the deep Potion/Hi-Potion stock.
    const critBand = (link !== undefined ? LINK_CRITICAL[link] : undefined) ?? CRITICAL;
    const hurt = party.filter((c) => c.alive && hpFraction(c) < HURT);
    const critical = party.filter((c) => c.alive && hpFraction(c) < critBand);
    const mortal = party.filter((c) => c.alive && c.hp <= c.stats.maxHp * TAIL_BEAM + NOLI);
    if (mortal.length > 1) {
      const save = row(commands, EMERGENCY_PARTY, mortal[0]!.id);
      if (save) return aim(save, mortal[0]!.id);
    }
    if (critical.length > 1) {
      const wide = row(commands, PARTY_HEAL, critical[0]!.id);
      if (wide) return aim(wide, critical[0]!.id);
    }
    if (low && hpFraction(low) < critBand) {
      const r = row(commands, FULL_HEAL, low.id);
      if (r) return aim(r, low.id);
    }
    if (hurt.length > 1) {
      const wide = row(commands, PARTY_HEAL, hurt[0]!.id);
      if (wide) return aim(wide, hurt[0]!.id);
    }
    // 4b. Refill the one resource with no other source. §6.8 stocks six Turbo
    //     Ethers (500 MP each) and the healer is the only girl who spends MP:
    //     Life is 18 and Full-Life 60, so a dry healer is a party with no
    //     revive left once the Phoenix Downs run out.
    if (actor.mp < MP_FLOOR) {
      const ether = row(commands, ['Turbo Ether', 'Ether'], actorId);
      if (ether) return aim(ether, actorId);
    }

    if (low && hpFraction(low) < TOPUP_BAND) {
      const r = row(commands, TOPUP, low.id);
      if (r) return aim(r, low.id);
    }

    // 5. Nothing to fix. Pray is 0 MP and party-wide, so the healer's idle turn
    //    still tops the Darkness users up rather than burning the bar.
    const pray = row(commands, ['Pray']);
    if (pray) return aim(pray, actorId);
    return null;
  }

  // ----------------------------------------------------------- Dark Knights
  //
  // A cast every turn, unless she is inside one Tail Beam of death — Darkness
  // charges 12.5% of her own max HP on top of whatever the boss is doing
  // [§6.4, §7.1], so she can spend herself to death without the boss's help.
  // Then she drinks.
  if (hpFraction(actor) < DARKNESS_HP_FLOOR) {
    const drink = row(commands, FULL_HEAL, actorId);
    if (drink) return aim(drink, actorId);
  }
  const target = targetable(boss) ? boss.id : undefined;

  // Black Sky first while the MP lasts [§6.4's Arcana list]. 80 MP, ten hits,
  // all-enemies, and it scales off **Strength** rather than Magic
  // [ffx2-combat-core §3.8], so a Dark Knight's 224-229 MP — a pool she spends
  // on nothing else in five battles — converts straight into damage at no HP
  // cost, which is the resource the chapter is actually short of. Measured
  // 511/600 -> 557/600.
  if (link !== 'vegnagun-leg') {
    const sky = row(commands, ['Black Sky']);
    if (sky) return aim(sky, target);
  }

  // At the Leg, and only at the Leg, every swing is single-target and aimed at
  // the Leg. §7.2: "Ignore the Nodes' 300,000 HP; **all damage goes to the
  // Leg**". §3.2 is why the all-enemy rows are wrong here — the Nodes' colour
  // machine advances "on (own turn resolves) **OR** (hit by any attack)", and
  // its GREEN face casts Cura, Regen, Shell and Protect **on the Leg**, so
  // every Darkness that splashes the Nodes is winding up the thing that heals
  // the target. The Leg's Def is 13 (§3.2), so a plain Attack gives up almost
  // nothing to armour and costs no HP. Measured 557/600 -> 577/600.
  if (link === 'vegnagun-leg' && target) {
    const swing = commands.find(
      (c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(target),
    );
    if (swing) return aim(swing, target);
  }

  if (hpFraction(actor) >= DARKNESS_HP_FLOOR) {
    const darkness = row(commands, ['Darkness']);
    if (darkness) return aim(darkness, target);
  }

  // Out of HP and out of bag: swing at the **boss**, never at a part.
  //
  // That is the §7.2 trap in the Leg fight — "Ignore the Nodes' 300,000 HP;
  // **all damage goes to the Leg** (18,220)" — and the generic strategy walks
  // straight into it, because it prefers `flags.isPart` targets and the Nodes
  // are parts with 300,000 HP each. Darkness above does not have the problem:
  // an `all-enemies` action in this engine deals its **full** damage to every
  // target rather than splitting it, so the Leg takes the same hit it would
  // from a single-target cast and the Nodes merely catch the splash. Measured
  // both ways over 200 chains: Darkness 139 wins, single-target Attack 123 -
  // which is why this branch is the fallback and not the Leg's rule.
  const attack = commands.find(
    (c) => c.enabled && c.command.kind === 'attack' && (target === undefined || c.validTargets.includes(target)),
  );
  if (attack) return aim(attack, target);
  return null;
};
