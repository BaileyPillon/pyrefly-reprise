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
 * preset the chapter ships (GP5 a, GP6 a): Yuna as White Mage, Rikku and Paine as Dark Knights.
 * Two Dark Knights on Darkness plus a healer, Protect first `[verified: 4 sources]`; Remedy on
 * Looming Glacier's Stop (§4.2); on Nooj, the Dark Knights kept above 5,000 HP for Lightfall
 * (§4.3, §5). It picks only among the rows the engine offers.
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
 */

import type { AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';
import { DEN_OF_WOE_BOSS_IDS } from '../../data/guides/ffx2-den-of-woe.ts';

/** The three shades: the tactic and the guide register the same ids. */
export const DEN_OF_WOE_TACTIC_IDS: readonly CombatantId[] = DEN_OF_WOE_BOSS_IDS;

/** The HP a Dark Knight must keep through Lightfall (5,000 to all, research §4.3). */
const DK_FLOOR = 5000;
/** Nooj's HP from which the line prepares for Lightfall (the bench's window). */
const PREP_FROM = 8000;
/** "Early in each link": the White Mage's first turns, as the bench line counts them. */
const GUARD_TURNS = 8;

function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find(
    (c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id,
  );
  return r ? ({ ...r.command, targets } as Command) : null;
}

/** Nooj is near the end and Lightfall is still to come. */
function prepWindow(foe: AnyCombatant): boolean {
  return foe.id === 'shade-nooj' && foe.hp <= PREP_FROM && !(foe as { aiMemory?: Record<string, unknown> }).aiMemory?.['lightfallFired'];
}

/**
 * The party's turns so far this link, from the log (each link re-inits the engine, so the log is
 * the link's own): the bench line's counter of player decisions.
 */
function partyTurns(log: readonly { type: string; actorId?: string }[], party: readonly AnyCombatant[]): number {
  const ids = new Set(party.map((u) => u.id));
  return log.filter((e) => e.type === 'turn-start' && e.actorId !== undefined && ids.has(e.actorId)).length;
}

function yunaTurn(commands: AvailableCommand[], self: AnyCombatant, party: AnyCombatant[], foe: AnyCombatant, turn: number): Command | null {
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
  if (prepWindow(foe)) {
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

function knightTurn(commands: AvailableCommand[], self: AnyCombatant, party: AnyCombatant[], foe: AnyCombatant): Command | null {
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
  // Darkness costs 1/8 of max HP: in Nooj's end window, never pay it down to Lightfall's 5,000.
  if (prepWindow(foe) && self.hp - Math.ceil(self.stats.maxHp / 8) <= DK_FLOOR) {
    const swing = attack();
    if (swing) return swing;
  }
  return use(commands, 'ability', 'x2-dark-knight-darkness', []) ?? attack();
}

export const ffx2DenOfWoe: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const foe = state.enemyIds
    .map((id) => state.combatants[id])
    .find((c): c is AnyCombatant => !!c && c.side === 'enemy' && c.alive && (DEN_OF_WOE_TACTIC_IDS as readonly string[]).includes(c.id));
  if (!foe) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  if (actorId === 'yuna') return yunaTurn(commands, self, party, foe, partyTurns(state.log as readonly { type: string; actorId?: string }[], party));
  return knightTurn(commands, self, party, foe);
};

export default ffx2DenOfWoe;
