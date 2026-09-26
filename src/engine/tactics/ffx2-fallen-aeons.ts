/**
 * Chapter XI — Shiva, the Magus Sisters, then Anima on the Road to the Farplane: the line the
 * sources' clears use [research/ffx2-fallen-aeons.md §5].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, the aeons' action counter.
 * Registered under the FFX-2 game in `./lookup.ts`, so an FFX board (whose `shiva` and `anima`
 * are other ids) never reaches it; the combatant ids are the chapter's own (`x2-shiva`, `sandy`,
 * `cindy`, `mindy`, `x2-anima`, plan FA-G7).
 *
 * ## The line
 *
 * It is the **intended** line of the chapter's benches, written as a tactic
 * (`tests/unit/helpers/fallenAeonsDrive.ts`: `LINES.shivaIntended`, `LINES.sistersDarknessDispel`,
 * `LINES.animaIntended`; `docs/plans/fallen-aeons-bench.md`): two Dark Knights on Darkness and a
 * White Mage healing `[verified: 3 sources]`, Remedy on Stop, Dispel on Not-So-Mighty Guard, Shell
 * early and Remedy after Pain. It picks only among the rows the engine offers.
 *
 * **Yuna (White Mage)**, in this order:
 * 1. **Revive**: a Mega Phoenix for two down, else a Phoenix Down (or Life) for one.
 * 2. **Heal the party** when two girls are under a quarter (Megalixir, else Mega-Potion) or under
 *    55 % (Mega-Potion); an X-Potion (else Curaga) for one girl under 40 %.
 * 3. **Remedy**: on Shiva, a girl under Stop (Heavenly Strike, §4.1); on Anima, a girl under Pain's
 *    Silence or Darkness (§4.3).
 * 4. **A Turbo Ether** for herself under 30 MP.
 * 5. **Dispel**, on the Sisters only: a sister under Protect, Shell or Regen (Cindy's
 *    Not-So-Mighty Guard and Regen, §4.2).
 * 6. **Shell, then Protect**, early in each link (her first seven turns, counted from the link's
 *    own log).
 * 7. **Cura** for one girl under 75 %; else **Pray**.
 *
 * **The Dark Knights**: an X-Potion for herself under 20 %, else Darkness.
 *
 * Returns `null` (the generic ladder) when none of the five is on the field.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** Every combatant id the chapter fields, link by link: the tactic and the guide register the same ids. */
export const FALLEN_AEONS_BOSS_IDS: readonly CombatantId[] = ['x2-shiva', 'sandy', 'cindy', 'mindy', 'x2-anima'];

type Link = 'shiva' | 'sisters' | 'anima';

/** Her turns in a link that still open with a guard (the bench line's `turn < 8`). */
const GUARD_TURNS = 7;

function linkOf(engine: BattleEngine): Link | null {
  const s = engine.state();
  const on = (id: string): boolean => s.enemyIds.includes(id) && s.combatants[id]?.side === 'enemy';
  if (on('x2-shiva')) return 'shiva';
  if (on('x2-anima')) return 'anima';
  if (on('sandy') || on('cindy') || on('mindy')) return 'sisters';
  return null;
}

/** The offered row for `kind` + `id`, aimed at `targets`. */
function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find(
    (c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id,
  );
  return r ? ({ ...r.command, targets } as Command) : null;
}

/** How many turns the party has taken in this link: its own log (each link starts a fresh one). */
function partyTurns(engine: BattleEngine, party: readonly AnyCombatant[]): number {
  const ids = new Set(party.map((u) => u.id));
  return engine.state().log.filter((e) => e.type === 'action-start' && ids.has((e as { actorId: string }).actorId)).length;
}

function guardTurn(commands: AvailableCommand[], living: AnyCombatant[]): Command | null {
  if (living.some((u) => !has(u, 'shell'))) {
    const shell = use(commands, 'ability', 'x2-white-mage-shell', []);
    if (shell) return shell;
  }
  if (living.some((u) => !has(u, 'protect'))) {
    const protect = use(commands, 'ability', 'x2-white-mage-protect', []);
    if (protect) return protect;
  }
  return null;
}

function yunaTurn(commands: AvailableCommand[], engine: BattleEngine, self: AnyCombatant, party: AnyCombatant[], link: Link): Command | null {
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
  const below = (f: number): number => living.filter((u) => hpFraction(u) < f).length;
  const lowest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (below(0.25) >= 2) {
    const all = use(commands, 'item', 'x2-megalixir', []) ?? use(commands, 'item', 'x2-mega-potion', []);
    if (all) return all;
  }
  if (below(0.55) >= 2) {
    const all = use(commands, 'item', 'x2-mega-potion', []);
    if (all) return all;
  }
  if (lowest && hpFraction(lowest) < 0.4) {
    const one = use(commands, 'item', 'x2-x-potion', [lowest.id]) ?? use(commands, 'ability', 'x2-white-mage-curaga', [lowest.id]);
    if (one) return one;
  }
  if (link === 'shiva') {
    const stopped = living.find((u) => has(u, 'stop'));
    const cure = stopped ? use(commands, 'item', 'x2-remedy', [stopped.id]) : null;
    if (cure) return cure;
  }
  if (link === 'anima') {
    const pained = living.find((u) => has(u, 'silence') || has(u, 'darkness'));
    const cure = pained ? use(commands, 'item', 'x2-remedy', [pained.id]) : null;
    if (cure) return cure;
  }
  if (self.mp < 30) {
    const ether = use(commands, 'item', 'x2-turbo-ether', [self.id]);
    if (ether) return ether;
  }
  if (link === 'sisters') {
    const s = engine.state();
    const guarded = s.enemyIds
      .map((id) => s.combatants[id])
      .find((u): u is AnyCombatant => !!u && u.alive && (has(u, 'protect') || has(u, 'shell') || has(u, 'regen')));
    const dispel = guarded ? use(commands, 'ability', 'x2-white-mage-dispel', [guarded.id]) : null;
    if (dispel) return dispel;
  }
  if (partyTurns(engine, party) < GUARD_TURNS) {
    const guard = guardTurn(commands, living);
    if (guard) return guard;
  }
  if (lowest && hpFraction(lowest) < 0.75) {
    const cura = use(commands, 'ability', 'x2-white-mage-cura', [lowest.id]);
    if (cura) return cura;
  }
  return use(commands, 'ability', 'x2-white-mage-pray', []);
}

function knightTurn(commands: AvailableCommand[], self: AnyCombatant): Command | null {
  if (hpFraction(self) < 0.2) {
    const potion = use(commands, 'item', 'x2-x-potion', [self.id]);
    if (potion) return potion;
  }
  return use(commands, 'ability', 'x2-dark-knight-darkness', []);
}

export const ffx2FallenAeons: Tactic = (actorId, commands, engine) => {
  const link = linkOf(engine);
  if (!link) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  return actorId === 'yuna' ? yunaTurn(commands, engine, self, party, link) : knightTurn(commands, self);
};

export default ffx2FallenAeons;
