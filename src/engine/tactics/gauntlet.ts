/**
 * The hidden Gauntlet chapter (the Monster Arena's nine creations; **FFX only** [AGENTS.md rule 14]): the line the fights are played with, and the line the bench measures
 * (`tools/gauntlet-bench.mjs`, `tests/unit/helpers/gauntletBench.ts`). It returns `null` (the generic ladder) when no creature of the chapter is on the field. **Not registered yet**: the integration stage adds it
 * to `./lookup.ts` and `./index.ts` with the chapter (the tactic registry is a shared table); until then only the bench imports it.
 *
 * ## The line, and where each rule comes from
 *
 * Nothing in the fight is tuned: the creatures' numbers are the game's (`research/re-ffx-monster-arena-creations.md`), and each constant below is a lever of the line, set by what the bench measured and recorded in the
 * handoff (`docs/handoff/ch-gauntlet.md`). Tier 1 (the area three) asks:
 *
 * 1. **Cactuar King (act 1): an aeon is a shield** (`fodder`). 5/6 of its turns are a Needle that kills a 9,999-HP member (RE n 3.8) and every hit event it takes draws another; with an aeon in the front line the
 *    front line is the aeon alone (the script's targets are `FrontlineChars`), so the Needles fall on the aeon and the members live. Yuna sends the cheapest aeon in first; the aeon strikes (an Overdrive when its
 *    gauge is ready: one hit event for many blows, one counter).
 * 2. **Don Tonberry (act 2): no hit before it has arrived** (`tonberryWait`). While it walks in over four Waddles every hit but the first after each Waddle draws Karma, the attacker's kills x 100 (RE n 3.9: 50,000
 *    on this party, a certain KO); once it has arrived it counters nothing. The party waits (Defend) until the fourth Waddle is on the log, then strikes. An aeon out is the other answer (it casts Voodoo instead),
 *    and the line does not use it.
 * 3. **Jormungand (act 3)**: no rule; the plain strike (a capped Attack empties it in 6 hits, before its first turn on this party).
 * 4. **Yojimbo's Zanmato** (`zanmato`, `zanmatoAt`): Yuna calls him in at the start of the act and pays on every turn of his while the purse lasts; a Zanmato that lands kills the creature (RE n 0: Slice is not
 *    blocked). The shipped line calls him in against **none** of tier 1 (the bench: every act is won every time without him, and his route is slower than a plain strike); the bench runs the line with him against
 *    all three (`zanmato-all`) and without (preflight GA6), and the later tiers' long fights list theirs.
 * 5. **Revive the fallen, then heal under `healUnder`** (Yuna's Curaga/Cura; the bag only in an emergency). 6. **An Overdrive when the gauge is ready** (the strongest first): one hit event for many blows.
 * 7. **Quick Hit (Tidus) or the plain Attack** at the creature. The tactic only picks among the rows the engine offers.
 *
 * Tier 2 (stage 3: Earth Eater, the Greater Sphere, Catastrophe) adds three rules, each measured by an ablation of the bench (`docs/handoff/ch-gauntlet.md`):
 *
 * 8. **Greater Sphere: the aeon shield is available** (`fodderAt`, off for it as shipped). Every plain blow of the party is answered by Ultima on the whole front line (RE n 3.5), and the front line is the aeon alone while
 *    one is out; the bench found the party wins the Sphere without it (100 of 100), so the shipped line leaves it off (with it the act is slower: 36 inputs against 22).
 * 9. **Earth Eater: only Auron strikes while it stands, and everybody strikes while it lies down.** Every blow it takes standing draws a Megaton Punch (Death, a member lost on this party), so the fewest and largest blows
 *    (Auron's Piercing blow is 64,000 to 99,999 against the 22,000 to 45,000 of Tidus's Armored blow) take the running total past 100,000 with one punch; the crossing blow is not answered. Down, it is not Armored (the others'
 *    blows are about three times larger) and each blow is answered by a Flare it casts at itself (2,355 to 2,660 on a member), which is cheap: waiting out its two turns instead costs 372 inputs a fight against 26.
 * 10. **No Overdrive on the Greater Sphere** (`odBarredAt`): an Overdrive is a special with no element, which the Sphere answers with Hydraulic Press, 15/16 of everyone's maximum HP (4,687 each with Auto-Protect), lethal
 *    to anyone already wounded. The gauges carry from act to act, so in the chain they are full when the Sphere comes (97 of 100 without the rule, 100 of 100 with it).
 *
 * Tier 3 (stage 4: Th'uban, Neslug, the Ultima Buster) adds three rules, again each measured by an ablation (`docs/handoff/ch-gauntlet.md`); Th'uban needs none (the party is faster than it and empties it in 31 hits):
 *
 * 11. **Neslug in its shell: Lulu's magic** (`magicShell`). In the shell (the script publishes `gauntlet.neslug.state` = 1) every physical blow does 0, it regenerates and casts Curaga on itself; Tidus, Yuna
 *    and Auron have no attack spell of their own (the spells of Yuna's aeons and every Overdrive do pass the shell). Tidus gives his turn to Lulu (a Switch), who casts Doublecast (two blows of 99,999 for 4 MP: the weapon has One MP Cost). Without it the shell is never broken: 0 of 100, the engine ends
 *    the stalemate.
 * 12. **Lulu from the first turn against Neslug and the Ultima Buster** (`magicAt`). Her Doublecast is 199,998 an action against the 99,999 of the best physical blow, and the Ultima Buster's Arms gate physical blows only,
 *    never a spell. Against both it is the better line on every count the bench keeps (Neslug 50 inputs and no member lost a fight against 61 and 0.4 with her only in the shell; the Ultima Buster 42 inputs and no member
 *    lost against 60 and 1.0), though both are won every time either way.
 * 13. **The Ultima Buster: the Arms first** (`armsFirst`), for the members who still strike. Against the body a physical blow is 2,000 to 4,000 while an Arm lives (Defense 255, Armored, Defend) and 99,999 once both are down;
 *    each Arm is 80,000 HP and dies in a couple of blows. The strikers hit an Arm while one stands, the body after (the formation's scene regrows the Arms on the body's third or fourth turn after both fell: the line goes back
 *    to them then). Without Lulu: 60 inputs a fight, against 250 for blows at the body alone.
 */

import type { AvailableCommand, BattleEngine, CombatantId, Command, FFXCombatant } from '../../battle/common/types.ts';
import { type Tactic, aim, hpFraction, revive, row } from './common.ts';

/** The creatures' ids (`src/data/ffx/gauntlet-ids.ts`). */
export const GAUNTLET_BOSS_IDS: readonly CombatantId[] = ['cactuar-king', 'don-tonberry', 'jormungand', 'earth-eater', 'greater-sphere', 'catastrophe', 'thuban', 'neslug', 'ultima-buster'];

/** Neslug's state as its script publishes it (restated here, the tactics keep out of the battle layer's graph; pinned by `tests/unit/chapters/gauntlet-neslug.test.ts`): 0 out, 1 in its shell, 2 the shell broken. */
export const NESLUG_STATE_FLAG = 'gauntlet.neslug.state';
export const NESLUG_IN_SHELL = 1;
/** The Ultima Buster's Arms (restated, pinned by `tests/unit/chapters/gauntlet-ultima-buster.test.ts`). */
export const ULTIMA_BUSTER_ARM_IDS: readonly CombatantId[] = ['ultima-buster-arm-left', 'ultima-buster-arm-right'];
/** Lulu's Doublecast (two spells in one action: two blows of 99,999 on the preset, 2 MP each: the weapon has One MP Cost) and, failing it, the spells she casts, strongest first. */
export const LULU_DOUBLECAST = 'Doublecast';
export const LULU_SPELLS: readonly string[] = ['Ultima', 'Flare', 'Firaga'];

/** The flags Earth Eater's script publishes (restated here, the tactics keep out of the battle layer's graph; pinned by `tests/unit/chapters/gauntlet-earth-eater.test.ts`): down, and the HP damage taken since it last stood. */
export const EATER_DOWN_FLAG = 'gauntlet.earthEater.down';
export const EATER_TOTAL_FLAG = 'gauntlet.earthEater.total';
/** The line its running total must pass to knock it down (RE n 3.4; restated, pinned by the same test). */
export const EATER_KNOCK_DOWN_LINE = 100_000;

/** The row of Don Tonberry's walk-in and the Waddles it takes to arrive (RE n 3.9; restated here, the tactics keep out of the battle layer's graph; pinned by `tests/unit/chapters/gauntlet-chain.test.ts`). */
export const TONBERRY_WADDLE_ROW = 'gauntlet-waddle';
export const TONBERRY_WADDLES_TO_ARRIVE = 4;
/** The engine's own Pay row (`battle/ffx/aeon-commands.ts`). */
const PAY_ABILITY_ID = 'yojimbo-pay';
/** The gil Yojimbo is paid each time he acts (as the Dark Aeons chapter's line pays: `4 x (floor(log2) - 2) = 56` motivation). */
export const PAY_GIL = 100_000;
/** A party member is healed under this share of his HP. */
export const HEAL_UNDER = 0.6;
/** A member who is not Yuna uses an item only under this share of his HP, or when Yuna cannot heal. */
export const ITEM_HEAL_UNDER = 0.25;
/** The aeons sent in as fodder, the cheapest first. */
export const FODDER_ORDER: readonly string[] = ['Valefor', 'Ifrit', 'Ixion', 'Shiva', 'Bahamut', 'Anima'];

/** The line's rules as numbers and switches, so the bench can take one away at a time and print what each is worth. The shipped line is {@link SHIPPED_LINE}. */
export interface LineOptions {
  /** Yuna calls Yojimbo in against `zanmatoAt` and pays him each turn while the purse lasts (rule 4). */
  readonly zanmato: boolean;
  /** The creatures (ids) Yojimbo is called in against. */
  readonly zanmatoAt: readonly CombatantId[];
  /** The gil one payment is. */
  readonly payGil: number;
  /** Yuna sends an aeon in first against the creatures of `fodderAt` (rule 1). */
  readonly fodder: boolean;
  /** The creatures (ids) the aeon-as-shield rule applies to: the Cactuar King (rule 1) and, as the tier-2 bench decides, the Greater Sphere (rule 8). */
  readonly fodderAt: readonly CombatantId[];
  /** Against Earth Eater only Auron strikes while it stands (rule 9: every blow it takes standing draws a Megaton Punch, a Death), the others wait; an Overdrive ready is still used. */
  readonly eaterAuronOnly: boolean;
  /** Against Earth Eater, hit it while it lies down (rule 9: each blow is answered by a Flare it casts at itself, 2,355 to 2,660 on a member); false waits out its two turns. */
  readonly eaterPound: boolean;
  /** The party strikes Don Tonberry only after its fourth Waddle (rule 2). */
  readonly tonberryWait: boolean;
  /** A member is healed under this share of his HP (rule 5). */
  readonly healUnder: number;
  readonly itemHealUnder: number;
  /** A member spends an Overdrive when the gauge is ready (rule 6). */
  readonly useOverdrives: boolean;
  /** The creatures (ids) nobody spends an Overdrive on (rule 10): an Overdrive is a special with no element, which the Greater Sphere answers with Hydraulic Press, 15/16 of everyone's maximum HP. */
  readonly odBarredAt: readonly CombatantId[];
  /** Against Neslug while it is in its shell (rule 11: every physical blow does nothing, it regenerates and casts Curaga on itself) Lulu is switched in for Tidus and casts magic. */
  readonly magicShell: boolean;
  /** The creatures (ids) Lulu is switched in against from the first turn, to cast magic throughout (rule 12: the Ultima Buster's Arms gate physical blows only, never a spell). */
  readonly magicAt: readonly CombatantId[];
  /** Against the Ultima Buster the physical strikers hit an Arm while one lives and the body only when both are down (rule 13: the formation's scene regrows them on the body's third or fourth turn after). */
  readonly armsFirst: boolean;
  /** Quick Hit before the plain Attack for Tidus (rule 7). */
  readonly quickHit: boolean;
}

export const SHIPPED_LINE: LineOptions = {
  zanmato: true,
  zanmatoAt: [], // none of the area three needs him (the bench: 100 of 100 wins without, and a Zanmato route is slower than a plain strike); the long fights of the later tiers list theirs
  payGil: PAY_GIL,
  fodder: true,
  fodderAt: ['cactuar-king'],
  eaterAuronOnly: true,
  eaterPound: true,
  tonberryWait: true,
  healUnder: HEAL_UNDER,
  itemHealUnder: ITEM_HEAL_UNDER,
  useOverdrives: true,
  odBarredAt: ['greater-sphere'],
  magicShell: true,
  magicAt: ['neslug', 'ultima-buster'],
  armsFirst: true,
  quickHit: true,
};

const living = (engine: BattleEngine, id: CombatantId): FFXCombatant | undefined => {
  const c = engine.state().combatants[id] as FFXCombatant | undefined;
  return c !== undefined && c.alive && c.hp > 0 && !c.removed ? c : undefined;
};

/** The party's gil (Yojimbo's purse; it rides in the battle's flags as `yojimbo:gil` once Yojimbo has been called, `battle/ffx/adapt/yojimbo.ts`). */
function gilOf(engine: BattleEngine): number {
  const gil = (engine.state().flags as Record<string, unknown>)['yojimbo:gil'];
  return typeof gil === 'number' ? gil : 0;
}

const pickKind = (commands: readonly AvailableCommand[], kind: Command['kind'], target?: CombatantId): AvailableCommand | undefined =>
  commands.find((c) => c.enabled && c.command.kind === kind && (target === undefined || c.validTargets.includes(target)));

/** Earth Eater's state as its script publishes it: down or standing, and the HP damage it has taken since it last stood. */
export function eaterState(engine: BattleEngine): { down: boolean; total: number } {
  const flags = engine.state().flags as Record<string, unknown>;
  const total = flags[EATER_TOTAL_FLAG];
  return { down: flags[EATER_DOWN_FLAG] === true, total: typeof total === 'number' ? total : 0 };
}

/** Don Tonberry has walked in when its fourth Waddle is on the log. */
export function tonberryArrived(engine: BattleEngine): boolean {
  let waddles = 0;
  for (const e of engine.state().log) if (e.type === 'action-start' && e.actorId === 'don-tonberry' && e.abilityId === TONBERRY_WADDLE_ROW) waddles++;
  return waddles >= TONBERRY_WADDLES_TO_ARRIVE;
}

/** An aeon's turn: Yojimbo pays or goes home; any other aeon strikes with an Overdrive when it has one, else the plain blow, else goes home. */
function aeonTurn(commands: readonly AvailableCommand[], bossId: CombatantId, pays: boolean, payGil: number, purse: number, odBarred: boolean): Command | null {
  const home = pickKind(commands, 'dismiss');
  const pay = commands.find((c) => c.enabled && c.command.kind === 'ability' && c.command.id === PAY_ABILITY_ID);
  if (pay) return pays && purse >= payGil ? ({ ...pay.command, targets: [], gilSpent: payGil } as Command) : home ? aim(home) : null;
  const od = odBarred ? undefined : commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes(bossId));
  if (od) return aim(od, bossId);
  const swing = pickKind(commands, 'attack', bossId);
  return swing ? aim(swing, bossId) : home ? aim(home) : null;
}

/** The line with `line`'s rules (the shipped one is {@link gauntlet}). */
export const lineWith = (line: LineOptions): Tactic => (actorId, commands, engine) => {
  const state = engine.state();
  const boss = GAUNTLET_BOSS_IDS.map((id) => living(engine, id)).find((c) => c !== undefined);
  if (boss === undefined) return null;
  const me = state.combatants[actorId] as FFXCombatant | undefined;
  if (!me) return null;
  const aeonOut = state.aeonId !== null;
  const wantsZanmato = line.zanmato && line.zanmatoAt.includes(boss.id);

  // An aeon on the field strikes (or pays).
  const odBarred = line.odBarredAt.includes(boss.id);
  if (me.side === 'aeon') return aeonTurn(commands, boss.id, wantsZanmato, line.payGil, gilOf(engine), odBarred);

  // Yuna calls Yojimbo in (rule 4), or, against the King, the cheapest aeon as a shield (rule 1).
  if (me.id === 'yuna' && !aeonOut) {
    if (wantsZanmato && gilOf(engine) >= line.payGil) {
      const summon = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Yojimbo');
      if (summon) return aim(summon);
    }
    if (line.fodder && line.fodderAt.includes(boss.id)) {
      for (const name of FODDER_ORDER) {
        const summon = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === name);
        if (summon) return aim(summon);
      }
    }
  }

  // The fallen first; then Yuna's heals; the others use an item only in an emergency (rule 5).
  const party = state.activeIds.map((id) => state.combatants[id]).filter((c): c is FFXCombatant => c !== undefined && c.side === 'party');
  const rescue = revive(commands, party);
  if (rescue) return rescue;
  const hurt = party.filter((c) => c.alive && hpFraction(c) < line.healUnder).sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  const yunaStands = party.some((c) => c.id === 'yuna' && c.alive);
  if (!aeonOut && me.id === 'yuna' && hurt) {
    const spell = row(commands, hpFraction(hurt) < 0.5 ? ['Curaga', 'Cura', 'Cure'] : ['Cura', 'Cure', 'Curaga'], hurt.id);
    if (spell) return aim(spell, hurt.id);
  } else if (hurt && !aeonOut && (hpFraction(hurt) < line.itemHealUnder || !yunaStands)) {
    const potion = row(commands, ['X-Potion', 'Hi-Potion', 'Potion'], hurt.id);
    if (potion) return aim(potion, hurt.id);
  }

  // Rule 2: against Don Tonberry nobody strikes until it has walked in (an aeon out is the aeons' own turn above).
  if (boss.id === 'don-tonberry' && line.tonberryWait && !tonberryArrived(engine)) {
    const defend = pickKind(commands, 'defend');
    return defend ? aim(defend) : null;
  }

  // Rule 9: Earth Eater. Down, the party hits it (each blow is a Flare at itself, cheap) or waits out its two turns; standing, only Auron strikes (a Piercing blow is the largest, and every blow draws a punch).
  const eater = boss.id === 'earth-eater' ? eaterState(engine) : undefined;
  if (eater?.down === true && !line.eaterPound) {
    const defend = pickKind(commands, 'defend');
    return defend ? aim(defend) : null;
  }

  // Rule 6: an Overdrive when the gauge is ready: the strongest first.
  if (line.useOverdrives && !odBarred && me.id !== 'yuna') {
    for (const label of ['Slice & Dice', 'Shooting Star', 'Spiral Cut', 'Dragon Fang']) {
      const od = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.label === label && c.validTargets.includes(boss.id));
      if (od) return aim(od, boss.id);
    }
  }

  // Rules 11 and 12: Lulu's magic. She is switched in for Tidus (his turn is the swap), then casts; she drinks an Ether when her MP runs low.
  const inShell = boss.id === 'neslug' && line.magicShell && state.flags[NESLUG_STATE_FLAG] === NESLUG_IN_SHELL;
  if (!aeonOut && (inShell || line.magicAt.includes(boss.id))) {
    const luluOn = party.some((c) => c.id === 'lulu' && c.alive);
    if (!luluOn && me.id === 'tidus') {
      const swap = commands.find((c) => c.enabled && c.command.kind === 'switch' && c.label === 'Lulu');
      if (swap) return { ...swap.command, targets: [] } as Command;
    }
    if (me.id === 'lulu') {
      const cast = row(commands, [LULU_DOUBLECAST], me.id) ?? row(commands, LULU_SPELLS, boss.id);
      if (cast) return aim(cast, cast.command.kind === 'ability' && cast.label === LULU_DOUBLECAST ? me.id : boss.id);
    }
  }

  // Rule 9, standing: the others wait while Auron stands to strike.
  if (eater?.down === false && line.eaterAuronOnly && me.id !== 'auron' && party.some((c) => c.id === 'auron' && c.alive)) {
    const defend = pickKind(commands, 'defend');
    return defend ? aim(defend) : null;
  }

  // Rule 13: against the Ultima Buster a physical blow goes to an Arm while one lives (the body is gated: Defense 255, Armored and Defend); the body when both are down.
  const arm = boss.id === 'ultima-buster' && line.armsFirst ? ULTIMA_BUSTER_ARM_IDS.map((id) => living(engine, id)).find((c) => c !== undefined) : undefined;
  const mark = arm?.id ?? boss.id;

  // Rule 7: Quick Hit (Tidus) or the plain Attack at the creature.
  if (line.quickHit && me.id === 'tidus') {
    const quick = row(commands, ['Quick Hit'], mark);
    if (quick) return aim(quick, mark);
  }
  const swing = pickKind(commands, 'attack', mark);
  return swing ? aim(swing, mark) : null;
};

/** The shipped line, for the registry the integration stage adds. */
export const gauntlet: Tactic = lineWith(SHIPPED_LINE);

export default gauntlet;
