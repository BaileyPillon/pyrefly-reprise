/**
 * The Leblanc Syndicate — Chateau Leblanc, FFX-2 Chapter 2
 * [research/ffx2-leblanc-syndicate.md].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. This is the file to edit for
 * this encounter and nothing else; the shared reading helpers live in
 * `./common.ts` and the registry in `./index.ts`.
 *
 * **Not registered.** `src/engine/tactics/index.ts` is integrator-only
 * [docs/plans/chapter-leblanc-review.md §8, track I], and registering there
 * also trips `tests/unit/strategy-guide.test.ts`'s hard `GUIDES` count, a
 * shared test this track does not own. The verifiers drive this tactic
 * directly, which is exactly what `tacticFor` will do once the chapter is
 * playable. The integrator adds **one line**, in the same commit as
 * `src/data/encounters.ts`:
 *
 * ```ts
 * { ids: [LEBLANC_BOSS_IDS], tactic: ffx2Leblanc },
 * ```
 *
 * ---
 *
 * ## The one fact the whole encounter is an expression of [§3.4]
 *
 * > **Three enemies, three different correct answers.** Ormi is a wall to
 * > physicals (Def 84) and paper to magic (MDef 16). Nothing defends Logos
 * > (Def 4) — but you have to *hit* him (Eva 40). Leblanc wants swords, not
 * > spells (Def 10, MDef 62), and she re-buffs herself.
 *
 * ## The line this tactic plays
 *
 * **Logos -> Ormi -> Leblanc** [§5.4], and the order is not a preference, it is
 * three AI facts:
 *
 * 1. **Killing either henchman switches off No Love Lost** — the trigger needs
 *    both. Logos has the least HP (989) and the worst threat (Russian
 *    Roulette's Death / Eject / Petrify roll), so he is the correct first
 *    target, which is what every published strategy independently says.
 * 2. **Ormi only reaches Huggles when he is the last enemy alive** (~1,185,
 *    more than any Lv-22 standard dressphere's pool). So he dies **second**,
 *    while Leblanc is still up. Killing Leblanc before him arms the fight's
 *    deadliest move, which is the chapter's best teaching moment and is exactly
 *    what the credible-mistake verifier does on purpose.
 * 3. **Leblanc alone is a stalemate engine, not a threat** — White Wind on an
 *    empty enemy party and Protect/Shell/Regen on herself. Last.
 *
 * On top of the order, four levers, each cited:
 *
 * - **Armor Break on Ormi** [§7.3] — "the single best Break use in the fight":
 *   Def 84 -> physicals x1.83 at the 10-stack cap. Power Break and Armor Break
 *   are **dead on Leblanc** (she is STR-Down and DEF-Down immune) and work on
 *   both boys, which is the only place in the fight where the same Warrior
 *   skill is right on two targets and wrong on the third [§3.1].
 * - **Route around Ormi's Defense, not through it** [§6.2] — a Black Mage's
 *   Fira does **302** through MDef 16, two and a half times what a Warrior's
 *   sword does through Def 84; the Gunner's **Cheap Shot** ignores Defense
 *   outright and is the non-mage answer.
 * - **Dispel Not-So-Mighty Guard** [§4.4] — Protect + Shell + Regen on all
 *   three, back roughly every 21 s. `DISPEL_REMOVES` already carries all three.
 * - **Bank a heal for Concussive Blast** [§5.4] — 281~317 to the whole party as
 *   Ormi crosses 25 % HP, and no Defense stat reduces it [§6.1].
 *
 * ## What this tactic deliberately does not do
 *
 * - **It does not open with Darkness Dance**, and that is a measured decision
 *   rather than a disagreement with the research. Darkness Dance is the
 *   canonical opener and §5.1's Darkness / 4 term is the one thing the sources
 *   fix independently of the unresolved enemy hit model (gap G1) — but in this
 *   engine a Dance lasts only **while she keeps dancing**
 *   (`extra.sustainedWhileDancing`, `src/data/ffx2/abilities/songstress.ts`),
 *   so holding the trio blind costs one of three actions for the whole fight,
 *   and what it blunts is the ordinary attacks the research already calls
 *   minor (50-130 into 640-1,090 HP) rather than the party-wide constants
 *   §6.1 says "actually move the health bars". Both lines are measured in
 *   `tests/unit/strategy-ffx2-leblanc.test.ts` and the numbers are in
 *   `docs/handoff/chapter-leblanc-engine.md`; this file plays the one that won.
 * - **It never tunes a boss.** Everything above is a player-side lever
 *   [`memory: boss-side-fix-needs-measured-options`].
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, aim, has, hpFraction, revive, row, stacksOf } from './common.ts';

/**
 * The boss ids this encounter fields, in **kill order** [§5.4].
 *
 * Acts I and II field the same three people under their earlier bestiary
 * records (`ormi-entrance`, `logos-room`, `ormi-logos-room`), so the order is
 * expressed as a ranking function rather than a fixed list.
 */
export const LEBLANC_BOSS_IDS: readonly CombatantId[] = [
  'leblanc', 'logos', 'ormi', 'logos-room', 'ormi-logos-room', 'ormi-entrance', 'dr-goon', 'fem-goon',
];

/** Lower sorts first. §5.4's order, with the Act I goons cleared out of the way first. */
function killRank(c: AnyCombatant): number {
  const id = c.id;
  if (id === 'fem-goon') return 0; // the only caster in Act I, and 167 HP
  if (id === 'dr-goon') return 1;
  if (id.startsWith('logos')) return 2; // Logos first: stops Russian Roulette, disarms No Love Lost
  if (id.startsWith('ormi')) return 3; // Ormi second, **while Leblanc is still alive**
  return 4; // Leblanc last
}

/**
 * Break stacks to drive DEF Down to on Ormi.
 *
 * §7.3 / `ffx2-bahamut.md` §1.5: **2 stacks per cast, cap 10**, worth
 * `(12 + n)/12` on what the party deals. At the cap that is x1.833.
 */
const BREAK_CAP = 10;

/**
 * Heal anyone below this fraction of max HP.
 *
 * Set from §6.1 rather than picked: Concussive Blast is **281-317 to everyone**
 * and no Defense stat reduces it, and the smallest standard pool this build
 * fields is a Lv-20 Gunner's. A bar at 55 % leaves every girl able to eat one
 * Blast, and does not fire for the ordinary 50-130 attacks.
 */
const TOP_UP_AT = 0.45;

/** Below this, top up before anything else — one more hit is lethal. */
const EMERGENCY_AT = 0.28;

const SYNDICATE_BUFFS = ['protect', 'shell', 'regen'] as const;

/** The living enemy this tactic is currently trying to kill. */
function focus(engine: BattleEngine): AnyCombatant | null {
  const s = engine.state();
  const living = s.enemyIds
    .map((id) => s.combatants[id])
    .filter((c): c is AnyCombatant => c !== undefined && c.alive && !c.flags.isPart);
  if (living.length === 0) return null;
  return [...living].sort((a, b) => killRank(a) - killRank(b) || a.hp - b.hp)[0] ?? null;
}

/** Most hurt living active first. */
function byNeed(party: AnyCombatant[]): AnyCombatant[] {
  return party.filter((c) => c.alive).sort((a, b) => hpFraction(a) - hpFraction(b));
}

/** A cure or a potion aimed at the girl who needs it, or null. */
function topUp(commands: AvailableCommand[], party: AnyCombatant[], at: number): Command | null {
  const hurt = byNeed(party)[0];
  if (!hurt || hpFraction(hurt) >= at) return null;
  const spell = row(commands, ['Cura', 'Cure'], hurt.id);
  if (spell) return aim(spell, hurt.id);
  const item = row(commands, ['Hi-Potion', 'Potion'], hurt.id);
  return item ? aim(item, hurt.id) : null;
}

/**
 * The status answers §7.6 puts in the bag, in the order they cost the party
 * most: Petrify locks a girl out of her turn entirely, Silence takes the
 * healer's whole kit, Darkness quarters her Accuracy, Curse only blocks
 * spherechange and Poison is 3 % a tick.
 *
 * **Nothing answers Eject** [§4.3, §7.5] — there is no cure, and that is the
 * point of the chapter rather than an omission here.
 */
const CURES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['petrify', ['Soft', 'Esuna', 'Remedy']],
  ['silence', ['Echo Screen', 'Esuna', 'Remedy']],
  ['darkness', ['Eye Drops', 'Esuna', 'Remedy']],
  ['curse', ['Holy Water', 'Remedy']],
  ['poison', ['Antidote', 'Esuna', 'Remedy']],
];

function cure(commands: AvailableCommand[], party: AnyCombatant[]): Command | null {
  for (const [status, labels] of CURES) {
    const afflicted = party.find((c) => c.alive && has(c, status));
    if (!afflicted) continue;
    const r = row(commands, labels, afflicted.id);
    if (r) return aim(r, afflicted.id);
  }
  return null;
}

/**
 * The two roles the fight cannot be answered without, and the L1 spherechange
 * that reaches them.
 *
 * §7.2 is explicit that Yuna's Gunner, Rikku's Thief and Paine's Warrior are
 * the canonical loadout at this point — and equally explicit [§6.2, §7.3] that
 * the two answers the fight actually wants are a **Black Mage** (Fira does 302
 * through Ormi's MDef 16 against a Warrior sword's 121 through his Def 84) and
 * a **White Mage** (Dispel is the only thing that strips Not-So-Mighty Guard,
 * and it needs Esuna first). The build deliberately does not pre-select them
 * [`src/data/ffx2/builds/chateau.ts`]; the *line* does, in the first two turns,
 * by spending exactly one ATB cycle each.
 *
 * That cost is the design intent of the L1 change — "roughly one lost turn for
 * one battle-long buff" [`src/battle/ffx2/spherechange.ts`, ffx2-combat-core
 * §4.2] — and `chateauBuild`'s `owned` order is what puts both one link from
 * each girl's starting node. Measured, the two changes are worth far more than
 * the two turns: see `docs/handoff/chapter-leblanc-engine.md`.
 *
 * Yuna is never changed. Her Gunner is `long-range`, which is the answer to
 * Logos' Evasion 40 [§6.2], and §5.2's mirror-match fact is hers.
 */
const NEEDED_ROLES = ['black-mage', 'white-mage'] as const;

/**
 * **Shipped `false`, and the measurement is the reason.** One line from being
 * flipped.
 *
 * §6.2's damage table is right about the *numbers* — a Black Mage's Fira really
 * does 302 through Ormi's MDef 16 where a Warrior's sword does 121 through his
 * Def 84 — and it is silent about the thing that decides this chapter, which is
 * that the two mage dresspheres have the smallest HP pools in the game. A
 * spherechange keeps the HP **ratio** and swaps the **pool**
 * (`spherechange.ts::refreshDerivedStats`), so putting Rikku in Black Mage and
 * Paine in White Mage takes the party from 1,034 / 934 / 1,089 to
 * 1,034 / 618 / 664 — it throws away **741 HP, a quarter of the party's total
 * pool** — for a fight whose real damage is party-wide constants that no
 * Defense stat reduces [§6.1].
 *
 * Measured on this chapter's own three-act chain, forty seeds, D = 0, nothing
 * else changed:
 *
 * | Line | Wins | Median player turns |
 * |---|---|---|
 * | **no spherechange** | **40/40** | **45** |
 * | White Mage only | 18/40 | 98 |
 * | Black Mage only | 14/40 | 74 |
 * | both | 4/40 | 88 |
 *
 * Every losing run failed in the last room, drained: the mages' pools mean the
 * party spends Acts I and II healing and arrives at Act III on fumes. Act III
 * *alone*, from full, this line clears in 9-12 turns on the same seeds — so
 * what the chain measures is the carry-over, not the room.
 *
 * **No boss number was touched to get here** (`memory:
 * boss-side-fix-needs-measured-options`). It is a player-side line, and the
 * losing branches are kept above rather than deleted because they are exactly
 * the "credible mistake" the chapter is supposed to be able to punish.
 */
export const SPHERECHANGE_INTO_MAGES = false;

function currentRoles(party: AnyCombatant[]): string[] {
  return party
    .filter((c) => c.alive)
    .map((c) => (c as { dresspheres?: { current?: string } }).dresspheres?.current)
    .filter((d): d is string => typeof d === 'string');
}

function spherechange(commands: AvailableCommand[], actor: AnyCombatant, party: AnyCombatant[]): Command | null {
  if (!SPHERECHANGE_INTO_MAGES) return null;
  if (actor.id === 'yuna') return null;
  const roles = currentRoles(party);
  for (const role of NEEDED_ROLES) {
    if (roles.includes(role)) continue;
    const r = commands.find((c) => c.enabled && c.command.kind === 'spherechange' && c.label === role);
    if (r) return { ...r.command, targets: [] } as Command;
  }
  return null;
}

/**
 * Strip Not-So-Mighty Guard — **off the focus target only**. §4.4
 *
 * Dispel is single-target and Leblanc buffs all three roughly every 21 s, so
 * stripping the whole formation is a treadmill the party cannot win: measured,
 * a line that dispelled every buffed enemy spent nine of the healer's turns on
 * it in one fight and cast two spells all battle. Stripping only the enemy the
 * party is actually hitting converts the same turn into real damage on the next
 * two, which is what §4.4's "Dispel removes all three" is for.
 */
function dispel(commands: AvailableCommand[], target: AnyCombatant): Command | null {
  if (!SYNDICATE_BUFFS.some((b) => has(target, b))) return null;
  const r = row(commands, ['Dispel'], target.id);
  return r ? aim(r, target.id) : null;
}

/**
 * The best damage this girl can put into `target`, routed by the target's own
 * defensive shape [§6.2].
 *
 * - **Ormi** (Def 84 / MDef 16): magic, or Cheap Shot, or On the Level —
 *   anything that is not a sword. His MDef 16 is why a Fira does 302 where a
 *   sword does 121.
 * - **Logos** (Def 4 / Eva 40): everything hurts him, so the question is
 *   connecting; the long-range Gunner and the two-hit Thief do, and Perfect
 *   Pitch closes the Warrior's gap.
 * - **Leblanc** (Def 10 / MDef 62): swords, not spells.
 */
function damage(commands: AvailableCommand[], target: AnyCombatant, enemiesLeft: number): Command | null {
  // **The Grenade loop** [§4.6]. A Grenade is `all-enemies`, so while two or
  // three of the Syndicate are standing one throw is worth two or three hits —
  // and §4.6 calls it "a genuinely canonical, genuinely teachable item loop"
  // precisely because the Dr. Goon in Act I carries them as a rare steal.
  // Below two enemies it is worse than a spell, so it stops.
  if (enemiesLeft >= 2) {
    const bomb = row(commands, ['Grenade'], target.id);
    if (bomb) return aim(bomb, target.id);
  }
  const wallToPhysicals = target.stats.def > target.stats.mdef;
  const ladder = wallToPhysicals
    ? ['Fira', 'Blizzara', 'Thundara', 'Watera', 'Cheap Shot', 'On the Level', 'Fire', 'Attack']
    : ['Attack', 'Trigger Happy', 'Fira', 'Blizzara', 'Thundara', 'Watera'];
  for (const label of ladder) {
    const r = row(commands, [label], target.id);
    if (r) return aim(r, target.id);
  }
  const any = row(commands, ['Attack'], target.id);
  return any ? aim(any, target.id) : null;
}

/**
 * The Warrior's ladder. **Armor Break on Ormi first** [§7.3]; on Leblanc every
 * Break except Magic/Mental Break is dead, so she is simply hit.
 */
function warrior(commands: AvailableCommand[], target: AnyCombatant, enemiesLeft: number): Command | null {
  const breaks: ReadonlyArray<readonly [string, string]> = target.id.startsWith('ormi')
    ? [['Armor Break', 'def-down']]
    : target.id === 'leblanc'
      ? [['Mental Break', 'mdef-down'], ['Magic Break', 'mag-down']]
      : [];
  for (const [label, status] of breaks) {
    if (stacksOf(target, status) >= BREAK_CAP) continue;
    const r = row(commands, [label], target.id);
    if (r) return aim(r, target.id);
  }
  return damage(commands, target, enemiesLeft);
}

/** This encounter's line. */
export const ffx2Leblanc: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const actor = state.combatants[actorId];
  if (!actor) return null;
  const target = focus(engine);
  // Not this encounter — hand the turn back to the generic rules.
  if (!target || target.side !== 'enemy') return null;
  const enemiesLeft = engine
    .state()
    .enemyIds.map((id) => engine.state().combatants[id])
    .filter((c) => c !== undefined && c.alive && !c.flags.isPart).length;

  const party = activeParty(engine);

  // 1. A downed girl first. §7.6 ships 15 Phoenix Downs, which is the only
  //    answer to Russian Roulette's Death roll.
  const up = revive(commands, party);
  if (up) return up;

  // 2. Somebody about to die. Concussive Blast is 281-317 and unreducible.
  const emergency = topUp(commands, party, EMERGENCY_AT);
  if (emergency) return emergency;

  // 3. Put the two answers on the field — one ATB cycle each, once.
  const change = spherechange(commands, actor, party);
  if (change) return change;

  // 4. Strip the guard. Until it is gone every number below is halved.
  const strip = dispel(commands, target);
  if (strip) return strip;

  // 4. The status answers §7.6 put in the bag.
  const cured = cure(commands, party);
  if (cured) return cured;

  // 5. Top up. §5.4: "budget a heal for Concussive Blast."
  const heal = topUp(commands, party, TOP_UP_AT);
  if (heal) return heal;

  // 6. Damage, routed by the target's defensive shape. The role is read off the
  //    rows the engine offered rather than off the girl's name, so the line
  //    keeps working if the build's dressphere assignment moves.
  if (row(commands, ['Armor Break', 'Mental Break', 'Magic Break'], target.id)) {
    return warrior(commands, target, enemiesLeft);
  }
  return damage(commands, target, enemiesLeft);
};

export default ffx2Leblanc;
