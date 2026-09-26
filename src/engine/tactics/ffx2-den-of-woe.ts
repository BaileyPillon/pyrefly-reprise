/**
 * Chapter XV — the Den of Woe: the shades of Baralai, Gippal and Nooj, the line the sources'
 * clears use [research/ffx2-gippal-den-of-woe.md §5].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, the FFX-2 status set.
 * Registered under the FFX-2 game in `./lookup.ts`, so an FFX board never reaches it.
 *
 * ## The line
 *
 * The **intended** line of the chapter's bench (`tests/unit/helpers/denOfWoeDrive.ts`
 * `LINES.intended`; `docs/plans/den-of-woe-bench.md`), written as a tactic for the Chapter V
 * preset: Yuna as White Mage, Rikku and Paine as Dark Knights. Two Dark Knights on Darkness plus a
 * healer, Protect first `[verified: 4 sources]`; Remedy on Looming Glacier's Stop (§4.2). It picks
 * only among the rows the engine offers.
 *
 * **As shipped (Bailey's pick, 2026-09-26, "Den: both, drop the prep"):** the kit carries 3 Hero
 * Drinks and 8 more levels (both `[estimate]`), so on Nooj a girl Lightfall would kill drinks one
 * (Invincible, the sources' answer, §5), and the Lightfall prep (step 4, the plain swing) is off:
 * the Dark Knights stay on Darkness. That is the bench's `LINES.noPrep` with `heroDrink`.
 *
 * Yuna:
 * 1. **Revive**: a Mega Phoenix for two down, else a Phoenix Down (or Life).
 * 2. **Remedy** a girl in Stop, and herself when Silenced.
 * 3. **Heal**: Megalixir (or Mega-Potion) when two are under a quarter; Mega-Potion when two are
 *    under 55 %; an X-Potion (or Curaga) for one under 40 %.
 * 4. **Nooj near the end** (8,000 HP or less, Lightfall still to come): Curaga / a Mega-Potion
 *    for a Dark Knight at 5,000 HP or less.
 * 5. A Turbo Ether when her MP is under 30.
 * 6. **Protect, then Shell** on the party, early in each link.
 * 7. Cura for one under 75 %; else **Pray**.
 *
 * The Dark Knights: a Phoenix Down (Mega Phoenix for two) when Yuna is down; an X-Potion when
 * under a fifth; a plain Attack in Nooj's end window when Darkness would take her to 5,000 HP or
 * less; else **Darkness**.
 *
 * Returns `null` (the generic ladder) when no shade is on the field.
 *
 * ## The options (`docs/plans/den-of-woe-options-2026-09-25.md`)
 *
 * - **M1** (`DEN_OF_WOE_LIGHTFALL_PREP`, false as shipped): steps 4 and the plain swing drop out; the
 *   Dark Knights keep to Darkness. {@link makeDenOfWoeTactic} takes it as an option.
 * - **GP6 b** (Hero Drinks in the bag, ON as shipped): before step 4, and before a Dark Knight's
 *   Darkness, a girl Lightfall would kill (Yuna always; a Dark Knight at 5,000 HP or less) drinks one
 *   once Nooj is at 4,500 HP or less and Lightfall is still to come (our line, not game data). The
 *   step asks for a row only the bag can offer, so with the Chapter V bag alone it never fires.
 */

import type { AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';
import { DEN_OF_WOE_BOSS_IDS, DEN_OF_WOE_LIGHTFALL_PREP } from '../../data/guides/ffx2-den-of-woe.ts';

/** The three shades: the tactic and the guide register the same ids. */
export const DEN_OF_WOE_TACTIC_IDS: readonly CombatantId[] = DEN_OF_WOE_BOSS_IDS;

/** The HP a Dark Knight must keep through Lightfall (5,000 to all, research §4.3). */
const DK_FLOOR = 5000;
/** Nooj's HP from which the line prepares for Lightfall (the bench's window). */
const PREP_FROM = 8000;
/** "Early in each link": the White Mage's first turns, as the bench line counts them. */
const GUARD_TURNS = 8;
/** GP6 b: Nooj's HP from which a girl drinks a Hero Drink (the bench's what-if window; our line, not data). */
const DRINK_FROM = 4500;

/** The tactic's switches: the Lightfall prep (M1, `DEN_OF_WOE_LIGHTFALL_PREP`). */
export interface DenOfWoeTacticOptions {
  lightfallPrep: boolean;
}

function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find(
    (c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id,
  );
  return r ? ({ ...r.command, targets } as Command) : null;
}

function lightfallToCome(foe: AnyCombatant): boolean {
  return foe.id === 'shade-nooj' && !(foe as { aiMemory?: Record<string, unknown> }).aiMemory?.['lightfallFired'];
}

/** Nooj is near the end and Lightfall is still to come. */
function prepWindow(foe: AnyCombatant, o: DenOfWoeTacticOptions): boolean {
  return o.lightfallPrep && lightfallToCome(foe) && foe.hp <= PREP_FROM;
}

/**
 * GP6 b: a girl Lightfall would kill drinks a Hero Drink (Invincible) once Nooj is near it. Only when
 * the bag carries one: the shipped kit does (3, Bailey's pick 2026-09-26); the Chapter V bag alone has none.
 */
function heroDrink(commands: AvailableCommand[], self: AnyCombatant, foe: AnyCombatant): Command | null {
  if (!lightfallToCome(foe) || foe.hp > DRINK_FROM || has(self, 'invincible')) return null;
  if (self.id !== 'yuna' && self.hp > DK_FLOOR) return null;
  return use(commands, 'item', 'x2-hero-drink', [self.id]);
}

/**
 * The party's turns so far this link, from the log (each link re-inits the engine, so the log is
 * the link's own): the bench line's counter of player decisions.
 */
function partyTurns(log: readonly { type: string; actorId?: string }[], party: readonly AnyCombatant[]): number {
  const ids = new Set(party.map((u) => u.id));
  return log.filter((e) => e.type === 'turn-start' && e.actorId !== undefined && ids.has(e.actorId)).length;
}

function yunaTurn(
  commands: AvailableCommand[], self: AnyCombatant, party: AnyCombatant[], foe: AnyCombatant, turn: number, o: DenOfWoeTacticOptions,
): Command | null {
  const ko = party.filter((u) => !u.alive);
  if (ko.length >= 2) {
    const mega = use(commands, 'item', 'x2-mega-phoenix', []);
    if (mega) return mega;
  }
  if (ko[0]) {
    const back = use(commands, 'item', 'x2-phoenix-down', [ko[0].id]) ?? use(commands, 'ability', 'x2-white-mage-life', [ko[0].id]);
    if (back) return back;
  }
  const living = party.filter((u) => u.alive);
  const below = (f: number): AnyCombatant[] => living.filter((u) => hpFraction(u) < f);
  const lowest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  const stopped = living.find((u) => has(u, 'stop'));
  if (stopped) {
    const remedy = use(commands, 'item', 'x2-remedy', [stopped.id]);
    if (remedy) return remedy;
  }
  if (has(self, 'silence')) {
    const remedy = use(commands, 'item', 'x2-remedy', [self.id]);
    if (remedy) return remedy;
  }
  if (below(0.25).length >= 2) {
    const all = use(commands, 'item', 'x2-megalixir', []) ?? use(commands, 'item', 'x2-mega-potion', []);
    if (all) return all;
  }
  if (below(0.55).length >= 2) {
    const all = use(commands, 'item', 'x2-mega-potion', []);
    if (all) return all;
  }
  if (lowest && hpFraction(lowest) < 0.4) {
    const one = use(commands, 'item', 'x2-x-potion', [lowest.id]) ?? use(commands, 'ability', 'x2-white-mage-curaga', [lowest.id]);
    if (one) return one;
  }
  const drink = heroDrink(commands, self, foe);
  if (drink) return drink;
  if (prepWindow(foe, o)) {
    const knights = living.filter((u) => u.id !== 'yuna' && u.hp <= DK_FLOOR);
    if (knights.length >= 2) {
      const all = use(commands, 'item', 'x2-mega-potion', []);
      if (all) return all;
    }
    if (knights[0]) {
      const one = use(commands, 'ability', 'x2-white-mage-curaga', [knights[0].id]) ?? use(commands, 'item', 'x2-x-potion', [knights[0].id]);
      if (one) return one;
    }
  }
  if (self.mp < 30) {
    const ether = use(commands, 'item', 'x2-turbo-ether', [self.id]);
    if (ether) return ether;
  }
  if (turn < GUARD_TURNS) {
    const bare = living.find((u) => !has(u, 'protect'));
    if (bare) {
      const protect = use(commands, 'ability', 'x2-white-mage-protect', []) ?? use(commands, 'item', 'x2-light-curtain', [bare.id]);
      if (protect) return protect;
    }
    if (living.some((u) => !has(u, 'shell'))) {
      const shell = use(commands, 'ability', 'x2-white-mage-shell', []);
      if (shell) return shell;
    }
  }
  if (lowest && hpFraction(lowest) < 0.75) {
    const cura = use(commands, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (cura) return cura;
  }
  return use(commands, 'ability', 'x2-white-mage-pray', []);
}

function knightTurn(
  commands: AvailableCommand[], self: AnyCombatant, party: AnyCombatant[], foe: AnyCombatant, o: DenOfWoeTacticOptions,
): Command | null {
  const ko = party.filter((u) => !u.alive);
  if (ko.some((u) => u.id === 'yuna')) {
    const revive = (ko.length >= 2 ? use(commands, 'item', 'x2-mega-phoenix', []) : null) ?? use(commands, 'item', 'x2-phoenix-down', ['yuna']);
    if (revive) return revive;
  }
  if (hpFraction(self) < 0.2) {
    const potion = use(commands, 'item', 'x2-x-potion', [self.id]);
    if (potion) return potion;
  }
  const attack = (): Command | null => {
    const r = commands.find((c) => c.enabled && c.command.kind === 'attack');
    return r ? ({ ...r.command, targets: [foe.id] } as Command) : use(commands, 'ability', 'x2-dark-knight-attack', [foe.id]);
  };
  const drink = heroDrink(commands, self, foe);
  if (drink) return drink;
  // Darkness costs 1/8 of max HP: in Nooj's end window, never pay it down to Lightfall's 5,000.
  if (prepWindow(foe, o) && self.hp - Math.ceil(self.stats.maxHp / 8) <= DK_FLOOR) {
    const swing = attack();
    if (swing) return swing;
  }
  return use(commands, 'ability', 'x2-dark-knight-darkness', []) ?? attack();
}

/** The Den's tactic for a set of options; the shipped one reads the switch. */
export const makeDenOfWoeTactic = (o: DenOfWoeTacticOptions): Tactic => (actorId, commands, engine) => {
  const state = engine.state();
  const foe = state.enemyIds
    .map((id) => state.combatants[id])
    .find((c): c is AnyCombatant => !!c && c.side === 'enemy' && c.alive && (DEN_OF_WOE_TACTIC_IDS as readonly string[]).includes(c.id));
  if (!foe) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  if (actorId === 'yuna') return yunaTurn(commands, self, party, foe, partyTurns(state.log as readonly { type: string; actorId?: string }[], party), o);
  return knightTurn(commands, self, party, foe, o);
};

export const ffx2DenOfWoe: Tactic = makeDenOfWoeTactic({ lightfallPrep: DEN_OF_WOE_LIGHTFALL_PREP });

export default ffx2DenOfWoe;
