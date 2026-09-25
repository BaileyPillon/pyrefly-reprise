/**
 * Chapter XIII (FFX-2) lines of play for `tremaDrive.ts`: small priority policies standing in for
 * a player who follows one tactic. **An input to a measurement, never game data**; nothing here
 * tunes a boss. Split out of the driver for the house 400-line rule. **FFX-2 only.**
 */

import type { Command, Decision } from '../../../src/battle/common/types.ts';
import type { FFX2Engine } from '../../../src/battle/ffx2/index.ts';

export type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = {
  id: string; side: string; hp: number; mp: number; alive: boolean; removed?: boolean;
  stats: { maxHp: number; maxMp: number }; statuses: Record<string, unknown>;
  dresspheres?: { current: string; garmentGrid: { id: string; nodePosition: number; passedGates: string[] } };
};

export interface LineOptions {
  /** What the Dark Knights swing at Paragon: a plain Attack (Protect reduces it) or Darkness (it does not). */
  paragonDk: 'attack' | 'darkness';
  /** Rikku changes to Gunner at Trema's start and uses Target MP until his MP is below this; 0 = no drain. */
  drainBelow: number;
  /**
   * Curtains: Shell against Paragon's Genesis (magic); Protect against Trema's physical chain,
   * and Shell ahead of each Meteor (TR3 = a: Meteor is magical).
   */
  curtains: boolean;
  /** Rikku cures Confuse, Itchy and Stop with a stashed Remedy. */
  remedy: boolean;
  /**
   * The kit options' play (`via-infinito-kit.ts`, OFF in the chapter): a Stamina Tonic, then a
   * Megalixir, on Paragon (method check S8); a Soul Spring for the drain and Three Stars on Trema
   * (S4, S5); Megalixirs below 60 % and Mega-Potions below 80 % (Split's 99 of each).
   */
  kit?: boolean;
  /** Itchy: wait for Rikku's Remedy (`'wait'`, the default) or spherechange out of it and back (§2.8). */
  itchy?: 'wait' | 'spherechange';
  /**
   * A Dark Knight on Valiant Lustre crosses its gates at a link's start (research §5: "cross two
   * with quick Spherechanges"): `'def'` Yellow and Blue and back (+40 Def, four changes), `'all'`
   * round the ring (+40 / +40, five changes). The ring's shape is the engine's `[estimate]`.
   */
  gates?: 'def' | 'all';
}

export const LINES = {
  /** The sources' clear: Attack on Paragon, Curtains, the drain, Darkness x2 on Trema. */
  intended: { paragonDk: 'attack', drainBelow: 10, curtains: true, remedy: true },
  /** Credibly wrong on link 1 (plan §9): Darkness on Paragon, the move that wins everywhere else. */
  darknessOnParagon: { paragonDk: 'darkness', drainBelow: 10, curtains: true, remedy: true },
  /** Credibly wrong on link 2: straight to Darkness, no drain and no Curtains. */
  noDrainNoShell: { paragonDk: 'attack', drainBelow: 0, curtains: false, remedy: true },
  /** The intended line without the drain (Curtains kept): what the drain is worth. */
  noDrain: { paragonDk: 'attack', drainBelow: 0, curtains: true, remedy: true },
  /** The kit options' clear (Split_Infinity's): the intended line with the kit's items, Itchy spherechanged away. */
  kitIntended: { paragonDk: 'attack', drainBelow: 10, curtains: true, remedy: true, kit: true, itchy: 'spherechange' },
  /** Credibly wrong with the kit, link 1: Darkness on Paragon. */
  kitDarknessOnParagon: { paragonDk: 'darkness', drainBelow: 10, curtains: true, remedy: true, kit: true, itchy: 'spherechange' },
  /** Credibly wrong with the kit, link 2: no drain, no Curtains, no Three Stars. */
  kitNoDrainNoShell: { paragonDk: 'attack', drainBelow: 0, curtains: false, remedy: true, itchy: 'spherechange' },
} satisfies Record<string, LineOptions>;

export function units(engine: FFX2Engine): Unit[] {
  return Object.values(engine.state().combatants) as unknown as Unit[];
}

function rowFor(d: Input, kind: string, id: string) {
  return d.commands.find(
    (c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id,
  );
}

function use(d: Input, kind: string, id: string, targets: string[]): Command | null {
  const row = rowFor(d, kind, id);
  return row ? ({ ...row.command, targets } as Command) : null;
}

function girls(engine: FFX2Engine): Unit[] {
  return units(engine).filter((u) => u.side === 'party' && !u.removed);
}

function boss(engine: FFX2Engine): Unit | undefined {
  return units(engine).find((u) => u.side === 'enemy' && u.alive);
}

function spherechangeTo(d: Input, dressphere: string): Command | null {
  const row = d.commands.find(
    (c) => c.enabled && c.command.kind === 'spherechange' &&
      (c.command as { extra: { toDressphere: string } }).extra.toDressphere === dressphere,
  );
  return row ? ({ ...row.command } as Command) : null;
}

const MENACED = ['confuse', 'itchy', 'stop'];

/** The next node on a gate route, or null once she is home with the gates she wanted. */
function gateStep(self: Unit, line: LineOptions): number | null {
  const grid = self.dresspheres?.garmentGrid;
  if (!line.gates || !grid || grid.id !== 'valiant-lustre') return null;
  const at = grid.nodePosition;
  const passed = grid.passedGates;
  if (line.gates === 'def') {
    if (!passed.includes('yellow')) return at === 0 ? 1 : null;
    if (!passed.includes('blue')) return at === 1 ? 2 : null;
    return at === 0 ? null : at - 1;
  }
  if (passed.length < 4 || at !== 0) return (at + 1) % 5; // Valiant Lustre: 5 nodes, [estimate]
  return null;
}

function toNode(d: Input, node: number): Command | null {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'spherechange' &&
    (c.command as { extra: { toNode: number } }).extra.toNode === node);
  return row ? ({ ...row.command } as Command) : null;
}

/** Itchy leaves only a spherechange (§2.8): take the first one offered; once clear, go home. */
function itchyChange(d: Input, self: Unit | undefined, home: string, line: LineOptions): Command | null {
  if (line.itchy !== 'spherechange' || !self) return null;
  if (self.statuses['itchy']) {
    const row = d.commands.find((c) => c.enabled && c.command.kind === 'spherechange');
    return row ? ({ ...row.command } as Command) : null;
  }
  return self.dresspheres?.current !== home ? spherechangeTo(d, home) : null;
}

/** Rikku as a competent player runs her: revive, drain (Trema), heal the party, Curtains, cure, heal one; else swing. */
export function rikkuTurn(d: Input, engine: FFX2Engine, line: LineOptions): Command | null {
  const party = girls(engine);
  const self = party.find((u) => u.id === d.actorId);
  const foe = boss(engine);
  const onTrema = foe?.id === 'trema';
  const sphere = self?.dresspheres?.current;
  const stash = sphere === 'alchemist';
  const living = party.filter((u) => u.alive);
  const lacking = (status: string) => living.filter((u) => !u.statuses[status]).length >= 2;

  const ko = party.filter((u) => !u.alive);
  if (ko[0]) {
    const revive = (stash ? use(d, 'ability', 'x2-alchemist-stash-phoenix-down', [ko[0].id]) : null) ??
      use(d, 'item', 'x2-phoenix-down', [ko[0].id]);
    if (revive) return revive;
  }
  const kit = line.kit === true;
  if (kit) {
    const change = itchyChange(d, self, 'alchemist', line);
    if (change) return change;
    // "All his MP are gone" first (his Flare kills the Alchemist): Soul Spring (S4), no Gunner stint.
    if (onTrema && foe && line.drainBelow > 0 && foe.mp >= line.drainBelow) {
      const soul = use(d, 'item', 'x2-soul-spring', [foe.id]);
      if (soul) return soul;
    }
    // A Stamina Tonic, then a Megalixir, at a link's start (method check S8); Three Stars on Trema (S5).
    if (living.some((u) => !u.statuses['max-hp-x2'])) {
      const tonic = use(d, 'item', 'x2-stamina-tonic', []);
      if (tonic) return tonic;
    }
    if (onTrema && living.some((u) => u.id !== 'rikku' && !u.statuses['spellspring'])) {
      const stars = use(d, 'item', 'x2-three-stars', []);
      if (stars) return stars;
    }
  }
  // "Drain his MP first" (Trema only; research §5, `[verified: 4 sources]`): change to Gunner, Target MP until he is below the line, change back.
  if (onTrema && foe && line.drainBelow > 0 && !kit) {
    if (foe.mp >= line.drainBelow) {
      if (sphere === 'alchemist') return spherechangeTo(d, 'gunner');
      if (sphere === 'gunner') {
        const drain = use(d, 'ability', 'x2-gunner-target-mp', [foe.id]);
        if (drain) return drain;
      }
    } else if (sphere === 'gunner') {
      return spherechangeTo(d, 'alchemist');
    }
  }
  const below = (f: number) => living.filter((u) => u.hp < u.stats.maxHp * f);
  if (below(kit ? 0.6 : 0.45).length >= 2) {
    const all = use(d, 'item', 'x2-megalixir', []);
    if (all) return all;
  }
  if (kit && below(0.8).length >= 2) {
    const mega = use(d, 'item', 'x2-mega-potion', []);
    if (mega) return mega;
  }
  if (line.curtains) {
    // Paragon: Genesis is magic, so Shell (it strips the Shell after it lands). Trema: his
    // three-hit chain is physical, so Protect; Shell ahead of each Meteor (TR3 = a).
    if (!onTrema && lacking('shell')) {
      const shell = use(d, 'item', 'x2-lunar-curtain', []);
      if (shell) return shell;
    }
    if (onTrema && lacking('protect')) {
      const protect = use(d, 'item', 'x2-light-curtain', []);
      if (protect) return protect;
    }
    if (onTrema && foe) {
      const next = foe.hp > foe.stats.maxHp / 2 ? 0.5 : foe.hp > foe.stats.maxHp / 4 ? 0.25 : 0;
      if (next > 0 && foe.hp < foe.stats.maxHp * (next + 0.08) && lacking('shell')) {
        const shell = use(d, 'item', 'x2-lunar-curtain', []);
        if (shell) return shell;
      }
    }
  }
  if (line.remedy) {
    const menaced = living.find((u) => MENACED.some((s) => u.statuses[s]));
    if (menaced) {
      const remedy = (stash ? use(d, 'ability', 'x2-alchemist-stash-remedy', [menaced.id]) : null) ??
        use(d, 'item', 'x2-remedy', [menaced.id]);
      if (remedy) return remedy;
    }
  }
  const lowest = [...living].sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (lowest && lowest.hp < lowest.stats.maxHp * 0.6 && stash) {
    const one = use(d, 'ability', 'x2-alchemist-stash-x-potion', [lowest.id]) ??
      use(d, 'ability', 'x2-alchemist-stash-elixir', [lowest.id]);
    if (one) return one;
  }
  if (foe) {
    const attack = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
    if (attack) return { ...attack.command, targets: [foe.id] } as Command;
  }
  return null;
}

export function knightTurn(d: Input, engine: FFX2Engine, line: LineOptions): Command | null {
  const party = girls(engine);
  const self = party.find((u) => u.id === d.actorId);
  const foe = boss(engine);
  if (!self || !foe) return null;
  // Itchy leaves only a spherechange: change out and back (`itchy: 'spherechange'`) or wait for the Remedy.
  const next = self.statuses['itchy'] ? null : gateStep(self, line);
  const route = next === null ? null : toNode(d, next);
  if (route) return route;
  const change = itchyChange(d, self, 'dark-knight', line);
  if (change) return change;
  if (self.statuses['itchy']) return { kind: 'defend', targets: [] };
  const rikku = party.find((u) => u.id === 'rikku');
  if (rikku && !rikku.alive) {
    const pd = use(d, 'item', 'x2-phoenix-down', [rikku.id]);
    if (pd) return pd;
  }
  if (self.hp < self.stats.maxHp * 0.25) {
    const mega = use(d, 'item', 'x2-megalixir', []);
    if (mega) return mega;
  }
  const darkness = foe.id === 'trema' || line.paragonDk === 'darkness';
  if (darkness) {
    const dk = use(d, 'ability', 'x2-dark-knight-darkness', []);
    if (dk) return dk;
  }
  const attack = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ??
    rowFor(d, 'ability', 'x2-dark-knight-attack');
  return attack ? ({ ...attack.command, targets: [foe.id] } as Command) : null;
}

export function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}
