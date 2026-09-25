/**
 * Chapter XIII — Paragon, then Trema, on Cloister 100 of the Via Infinito: the line the sources'
 * clears use [research/ffx2-trema.md §5, §12.3].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, Spherechange, the Alchemist's
 * stash. Registered under the FFX-2 game in `./lookup.ts`, so an FFX board never reaches it.
 *
 * ## The line
 *
 * It is the **intended** line of the chapter's benches (`tests/unit/helpers/tremaLines.ts`
 * `LINES.intended`, `docs/plans/trema-bench.md`), written as a tactic. It picks only among the
 * rows the engine offers, so a row a kit does not carry is simply never picked: that is how the
 * kit options (`src/data/ffx2/builds/via-infinito-kit.ts`, OFF) stay behind their own switch.
 *
 * 1. **Revive** a downed girl: Rikku from her stash or a Phoenix Down; a Dark Knight revives
 *    Rikku first (she is the healer).
 * 2. **Drain his MP first** on Trema (`[verified: 4 sources]`): a Soul Spring when the kit carries
 *    one, else Rikku changes to Gunner for Target MP until he is below Demi's 10 MP, then back.
 *    TR4 b (`[single source]` + `[conflict]` T-5): the guide says so.
 * 3. **Megalixir** when two girls are under 45 %; a Mega-Potion under 80 % when the kit has them.
 * 4. **Curtains**: Shell against Paragon's Genesis (magic); Protect against Trema's physical
 *    chain, and Shell ahead of each Meteor line (TR3 a: magical, `[conflict]` T-3).
 * 5. **Remedy** Confuse, Itchy and Stop.
 * 6. **An X-Potion** for one girl under 60 %.
 * 7. **The Dark Knights**: Darkness on Trema; a plain Attack on Paragon, **never Darkness** (an
 *    attack Protect cannot reduce draws Big Bang, research §4.1). The Attack is also right for a
 *    Paragon with no counter, so this line holds for every option.
 *
 * Returns `null` (the generic ladder) when neither Paragon nor Trema is on the field.
 */

import type { AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** Every combatant id the chapter can field: the tactic and the guide register them all. */
export const TREMA_CHAPTER_BOSS_IDS: readonly CombatantId[] = ['trema', 'paragon'];

/** Demi costs 10 MP (research §4.2): the drain's target. */
const DRAIN_BELOW = 10;
const MENACED = ['confuse', 'itchy', 'stop'] as const;

const isParagon = (id: string): boolean => id === 'paragon' || id.startsWith('paragon-');
const isTrema = (id: string): boolean => id === 'trema' || id.startsWith('trema-');

/** The offered row for `kind` + `id`, aimed at `targets`. */
function use(commands: AvailableCommand[], kind: string, id: string, targets: CombatantId[]): Command | null {
  const r = commands.find(
    (c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id,
  );
  return r ? ({ ...r.command, targets } as Command) : null;
}

function spherechangeTo(commands: AvailableCommand[], dressphere: string): Command | null {
  const r = commands.find(
    (c) =>
      c.enabled &&
      c.command.kind === 'spherechange' &&
      (c.command as { extra?: { toDressphere?: string } }).extra?.toDressphere === dressphere,
  );
  return r ? ({ ...r.command } as Command) : null;
}

function sphereOf(c: AnyCombatant | undefined): string | undefined {
  return (c as { dresspheres?: { current?: string } } | undefined)?.dresspheres?.current;
}

/** A plain swing: the Attack row, or the Dark Knight's own Attack ability when that is the row offered. */
function attack(commands: AvailableCommand[], foe: AnyCombatant): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === 'attack');
  if (r) return { ...r.command, targets: [foe.id] } as Command;
  return use(commands, 'ability', 'x2-dark-knight-attack', [foe.id]);
}

function rikkuTurn(commands: AvailableCommand[], self: AnyCombatant, party: AnyCombatant[], foe: AnyCombatant): Command | null {
  const onTrema = isTrema(foe.id);
  const stash = sphereOf(self) === 'alchemist';
  const living = party.filter((u) => u.alive);
  const lacking = (status: string): boolean => living.filter((u) => !has(u, status)).length >= 2;
  const down = party.find((u) => !u.alive);
  if (down) {
    const back = (stash ? use(commands, 'ability', 'x2-alchemist-stash-phoenix-down', [down.id]) : null) ??
      use(commands, 'item', 'x2-phoenix-down', [down.id]);
    if (back) return back;
  }
  if (onTrema && foe.mp >= DRAIN_BELOW) {
    const soul = use(commands, 'item', 'x2-soul-spring', [foe.id]);
    if (soul) return soul;
    if (sphereOf(self) === 'gunner') {
      const drain = use(commands, 'ability', 'x2-gunner-target-mp', [foe.id]);
      if (drain) return drain;
    } else {
      const change = spherechangeTo(commands, 'gunner');
      if (change) return change;
    }
  } else if (sphereOf(self) === 'gunner') {
    const home = spherechangeTo(commands, 'alchemist');
    if (home) return home;
  }
  const below = (f: number): number => living.filter((u) => hpFraction(u) < f).length;
  if (below(0.45) >= 2) {
    const all = use(commands, 'item', 'x2-megalixir', []);
    if (all) return all;
  }
  if (below(0.8) >= 2) {
    const mega = use(commands, 'item', 'x2-mega-potion', []);
    if (mega) return mega;
  }
  if (!onTrema && lacking('shell')) {
    const shell = use(commands, 'item', 'x2-lunar-curtain', []);
    if (shell) return shell;
  }
  if (onTrema && lacking('protect')) {
    const protect = use(commands, 'item', 'x2-light-curtain', []);
    if (protect) return protect;
  }
  if (onTrema) {
    const line = hpFraction(foe) > 0.5 ? 0.5 : hpFraction(foe) > 0.25 ? 0.25 : 0;
    if (line > 0 && hpFraction(foe) < line + 0.08 && lacking('shell')) {
      const shell = use(commands, 'item', 'x2-lunar-curtain', []);
      if (shell) return shell;
    }
  }
  const menaced = living.find((u) => MENACED.some((s) => has(u, s)));
  if (menaced) {
    const cure = (stash ? use(commands, 'ability', 'x2-alchemist-stash-remedy', [menaced.id]) : null) ??
      use(commands, 'item', 'x2-remedy', [menaced.id]);
    if (cure) return cure;
  }
  const lowest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (lowest && hpFraction(lowest) < 0.6 && stash) {
    const one = use(commands, 'ability', 'x2-alchemist-stash-x-potion', [lowest.id]) ??
      use(commands, 'ability', 'x2-alchemist-stash-elixir', [lowest.id]);
    if (one) return one;
  }
  return attack(commands, foe);
}

function knightTurn(commands: AvailableCommand[], self: AnyCombatant, party: AnyCombatant[], foe: AnyCombatant): Command | null {
  if (has(self, 'itchy')) {
    // Itchy leaves little to press (§2.8): hold for Rikku's Remedy when a Defend row is offered;
    // with only a spherechange left, the generic ladder takes the turn (`null`).
    const hold = commands.find((c) => c.enabled && c.command.kind === 'defend');
    return hold ? ({ ...hold.command, targets: [] } as Command) : null;
  }
  const rikku = party.find((u) => u.id === 'rikku');
  if (rikku && !rikku.alive) {
    const pd = use(commands, 'item', 'x2-phoenix-down', [rikku.id]);
    if (pd) return pd;
  }
  if (hpFraction(self) < 0.25) {
    const all = use(commands, 'item', 'x2-megalixir', []);
    if (all) return all;
  }
  if (isTrema(foe.id)) {
    const dark = use(commands, 'ability', 'x2-dark-knight-darkness', []);
    if (dark) return dark;
  }
  return attack(commands, foe);
}

export const ffx2Trema: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const foe = state.enemyIds
    .map((id) => state.combatants[id])
    .find((c): c is AnyCombatant => !!c && c.side === 'enemy' && c.alive && (isParagon(c.id) || isTrema(c.id)));
  if (!foe) return null;
  const party = activeParty(engine);
  const self = party.find((c) => c.id === actorId);
  if (!self) return null;
  return actorId === 'rikku' ? rikkuTurn(commands, self, party, foe) : knightTurn(commands, self, party, foe);
};

export default ffx2Trema;
