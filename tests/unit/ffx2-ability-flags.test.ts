/**
 * Critic round 02 #11 — **`destroys-user` in the FFX-2 engine**.
 *
 * `x2-dark-knight-charon` is `formula: 'user-max-hp'`, `ignoresDefense: true`
 * and `flags: ['destroys-user']`. The flag had one reader in the whole project,
 * `src/battle/ffx/abilities.ts` — the *FFX* engine, for Kimahri's Self-Destruct
 * — and none under `src/battle/ffx2`, so in X-2 it was a free, repeatable,
 * defence-ignoring nuke with no cost at all: Rikku's HP was unchanged after
 * every cast and Chapter 4 fell in 13 turns against the intended line's 77.
 *
 * `research/ffx2-combat-core.md` §2.3 and §3.12 both state the cost in one
 * clause — "`user max HP * 2`; **the user is removed from the battle**" — and
 * that is what these assert, at the level the bug lived at: the engine, not a
 * grep.
 */

import { describe, expect, it } from 'vitest';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import type { AvailableCommand, BattleEvent, Command } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';

const MAX_DECISIONS = 40_000;
const CHARON = 'x2-dark-knight-charon';
const BAHAMUT = 'ffx2-bahamut';

function newEngine(seed: number): FFX2Engine {
  const group = data.ENEMY_GROUPS_BY_ID[BAHAMUT];
  if (!group) throw new Error('ffx2-bahamut group missing from the data layer');
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
  });
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

function charonRow(commands: AvailableCommand[]): AvailableCommand | undefined {
  return commands.find(
    (c) => c.enabled && c.command.kind === 'ability' && c.command.id === CHARON && c.validTargets.length > 0,
  );
}

function anyAttack(commands: AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.length > 0)
    ?? commands.find((c) => c.enabled && c.validTargets.length > 0);
  return r ? ({ ...r.command, targets: [r.validTargets[0]!] } as Command) : null;
}

interface CharonRun {
  outcome: string | undefined;
  turns: number;
  casts: number;
  /** Casts whose caster was **not** KO'd by the time the action finished. */
  survivedOwnCast: number;
}

/** The critic's repro, verbatim: take Charon whenever offered, otherwise Attack. */
function runCharonLine(seed: number): CharonRun {
  const engine = newEngine(seed);
  const run: CharonRun = { outcome: undefined, turns: 0, casts: 0, survivedOwnCast: 0 };
  const log: BattleEvent[] = [];

  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      run.outcome = d.result.outcome;
      break;
    }
    if (d.kind === 'resolved') {
      log.push(...d.events);
      continue;
    }
    if (d.kind === 'waiting') {
      // FFX-2 is an ATB engine: the clock only moves when the caller moves it.
      log.push(...engine.tick(d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') break;
    run.turns++;

    const charon = charonRow(d.commands);
    if (charon) {
      run.casts++;
      log.push(...engine.submit({ ...charon.command, targets: [charon.validTargets[0]!] } as Command));
      continue;
    }
    const swing = anyAttack(d.commands);
    if (!swing) break;
    log.push(...engine.submit(swing));
  }

  // Charon has a charge time, so the cost lands when the action **resolves**,
  // not when it is submitted: read it off the log rather than off the state
  // one line later.
  for (let i = 0; i < log.length; i++) {
    const e = log[i]!;
    if (e.type !== 'action-start' || (e as { abilityId?: string }).abilityId !== CHARON) continue;
    const actorId = (e as { actorId: string }).actorId;
    let died = false;
    for (let j = i + 1; j < log.length; j++) {
      const later = log[j]!;
      if (later.type === 'action-end' && (later as { actorId?: string }).actorId === actorId) break;
      if (later.type === 'ko' && (later as { targetId: string }).targetId === actorId) {
        died = true;
        break;
      }
    }
    if (!died) run.survivedOwnCast++;
  }
  return run;
}

describe('#11 Charon costs the caster the battle [ffx2-combat-core §2.3, §3.12]', () => {
  it('KOs whoever casts it, every time', () => {
    let casts = 0;
    for (const seed of [1, 2, 3, 4, 5]) {
      const run = runCharonLine(seed);
      casts += run.casts;
      // The measurement that defined the bug: "Rikku's HP is unchanged after
      // each cast (1739 -> 1739, 1087 -> 1087, 705 -> 705), alive: true,
      // removed: false".
      expect(run.survivedOwnCast, `seed ${seed}: a Charon caster walked away from it`).toBe(0);
    }
    expect(casts, 'the line has to actually reach Charon for this to prove anything').toBeGreaterThan(0);
  });

  it('stops being the free answer to Chapter 4', () => {
    const results = Array.from({ length: 15 }, (_, i) => runCharonLine(i + 1));
    const wins = results.filter((r) => r.outcome === 'victory').length;
    const turns = results.filter((r) => r.outcome === 'victory').map((r) => r.turns);
    const average = turns.length > 0 ? Math.round(turns.reduce((a, b) => a + b, 0) / turns.length) : 0;
    console.log(`Charon line: ${wins}/15 wins, average ${average} turns, ${results.reduce((n, r) => n + r.casts, 0)} casts`);

    // Before the fix: **15 of 15**, averaging 13.2 turns against the intended
    // line's 77 — "a blind scan of all 28 rows the chapter offers found it the
    // only winner". A party that spends its members one per cast cannot do
    // that; the ability is still real and still enormous, it simply costs what
    // §3.12 says it costs.
    expect(wins, 'spamming Charon must not be the chapter').toBeLessThan(15);
  });
});
