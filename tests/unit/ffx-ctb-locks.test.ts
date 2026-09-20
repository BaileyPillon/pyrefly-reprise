/**
 * Turn-denying statuses must **deny turns**, not delete the actor from the CTB
 * queue [ffx-combat-core §1.1, §4.1, §4.2, §4.4].
 *
 * The clock is explicit about who is in the queue:
 *
 * > `nextActor = argmin(ctb) over living, non-Eject, non-Petrify actors`
 * > — `research/ffx-combat-core.md` §1.1 `[verified: 2 sources]`
 *
 * Sleep and Threaten are **not** on that exclusion list. They stop the actor
 * from *acting*; the turn still arrives, and it has to, because §4.1 says
 * Sleep's duration ticks down "by 1 at the end of the victim's own action" and
 * §4.2 says Threaten "lasts until the user's next turn". An engine that drops
 * them out of the queue can never reach either clock, which is exactly what
 * round 03 measured (blockers #3 and #4): Threaten on Yunalesca gave the boss
 * zero turns in the next 120+, and a Sleep sat on `turnsRemaining: 3` for 53.
 *
 * Also here: enemy letter tags. FFX letters **duplicates**, not the formation —
 * a lone Mortiorchis carries no letter at all.
 *
 * Game case: **FFX only** for Threaten (`ffx-combat-core.md` §11 C12 — party
 * and aeons are innately immune, and FFX-2 has no Threaten at all). The
 * queue/act split is shared plumbing, so `ffx2-status-locks.test.ts` pins the
 * same property on the ATB side, where durations run on the clock, not on turns.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  Command,
  Decision,
  FFXCombatant,
  StatusInstance,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';

function content(): FFXContentRegistry {
  const c = new FFXContentRegistry();
  c.addAbilities(ALL_ABILITIES);
  c.addItems(Object.values(ITEMS));
  return c;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function boot(groupId: string, build: any, seed = 1) {
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`no enemy group ${groupId}`);
  const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: build,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

function combatant(engine: ReturnType<typeof boot>, id: string): FFXCombatant {
  const c = (engine.state().combatants as Record<string, FFXCombatant>)[id];
  if (!c) throw new Error(`no combatant ${id}`);
  return c;
}

function sleepInstance(turns: number): StatusInstance {
  return {
    id: 'sleep',
    turnsRemaining: turns,
    ticksRemaining: null,
    charges: null,
    stacks: turns,
    permanent: false,
  };
}

function threatenInstance(userId: string): StatusInstance {
  return {
    id: 'threaten',
    turnsRemaining: null,
    ticksRemaining: null,
    charges: null,
    stacks: 1,
    permanent: false,
    sourceId: userId,
  };
}

/** Defend, or the first enabled row when this actor has no Defend. */
function defend(engine: ReturnType<typeof boot>, d: Decision & { kind: 'player-input' }): void {
  const rows = d.commands.filter((c) => c.enabled);
  const def = rows.find((c) => c.command.kind === 'defend');
  engine.submit((def?.command ?? rows[0]?.command ?? { kind: 'attack', targets: [] }) as Command);
}

/** Attack, so the fight actually progresses. */
function attack(engine: ReturnType<typeof boot>, rows: readonly AvailableCommand[]): void {
  const at = rows.find((c) => c.command.kind === 'attack');
  engine.submit((at?.command ?? rows[0]?.command ?? { kind: 'attack', targets: [] }) as Command);
}

describe('Threaten denies turns, it does not delete the enemy (§4.2, §4.4)', () => {
  // Chapter 2, the real encounter and Auron's real `threaten` command. Round 03
  // PROBE-1 drove exactly this and counted zero boss turns for the next 120+
  // turns on four of five seeds.
  //
  // Threaten is a 25 % roll on Yunalesca (§4.4's 25 % tier), so which seeds land
  // it is not fixed: the sweep requires at least one landing and requires every
  // landing to be followed by boss turns.
  it('Yunalesca acts again after a landed Threaten', () => {
    let seedsThatLanded = 0;

    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const engine = boot('yunalesca', zanarkandBuild, seed);
      const boss = combatant(engine, 'yunalesca');
      let landedAtTurn = -1;
      let bossTurnsAfter = 0;

      for (let i = 0; i < 20000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') {
          const rows = d.commands.filter((c) => c.enabled);
          const thr = rows.find((c) => c.command.kind === 'ability' && c.command.id === 'threaten');
          if (thr && landedAtTurn < 0) {
            const target = thr.validTargets[0];
            engine.submit({ kind: 'ability', id: 'threaten', targets: target ? [target] : [] } as Command);
          } else {
            attack(engine, rows);
          }
        } else if (d.kind === 'resolved') {
          for (const ev of d.events) {
            if (ev.type === 'turn-start' && landedAtTurn >= 0 && ev.actorId === 'yunalesca') {
              bossTurnsAfter += 1;
            }
          }
        }
        // The landing is read off the combatant rather than off an event: the
        // events a player's own `submit` produces are drained by that call.
        if (landedAtTurn < 0 && boss.statuses['threaten'] !== undefined) {
          landedAtTurn = engine.state().turn;
        }
        if (landedAtTurn >= 0 && engine.state().turn > landedAtTurn + 40) break;
      }

      if (landedAtTurn < 0) continue;
      seedsThatLanded += 1;
      // She loses turns to it — she does not leave the battle.
      expect(bossTurnsAfter, `seed ${seed}: boss turns in the 40 after Threaten landed`).toBeGreaterThan(0);
    }

    expect(seedsThatLanded, 'Threaten never landed on any of the eight seeds').toBeGreaterThan(0);
  });

  // §4.2: Threaten "lasts until the user's next turn, and the target's next turn
  // is then scheduled immediately after the user's". The release is keyed to
  // Auron, not to the boss reaching a turn she is barred from taking.
  it('Threaten is released by the user’s next turn, and the target then acts', () => {
    const engine = boot('yunalesca', zanarkandBuild, 1);
    const boss = combatant(engine, 'yunalesca');
    boss.statuses['threaten'] = threatenInstance('auron');

    let auronTurns = 0;
    let bossTurns = 0;
    let releasedOnAuronTurn = false;
    let stillThreatened = true;

    for (let i = 0; i < 20000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') {
        if (d.actorId === 'auron') {
          auronTurns += 1;
          if (stillThreatened && boss.statuses['threaten'] === undefined) {
            releasedOnAuronTurn = true;
            stillThreatened = false;
          }
        }
        attack(
          engine,
          d.commands.filter((c) => c.enabled),
        );
      } else if (d.kind === 'resolved') {
        for (const ev of d.events) {
          if (ev.type === 'turn-start' && ev.actorId === 'yunalesca') bossTurns += 1;
        }
      }
      if (engine.state().turn > 40) break;
    }

    expect(auronTurns, 'Auron never took a turn').toBeGreaterThan(0);
    expect(releasedOnAuronTurn, 'Threaten outlived the user’s next turn').toBe(true);
    expect(bossTurns, 'the Threatened boss never acted again').toBeGreaterThan(0);
  });

  it('a Threatened enemy is still listed in the CTB forecast', () => {
    const engine = boot('yunalesca', zanarkandBuild, 1);
    combatant(engine, 'yunalesca').statuses['threaten'] = threatenInstance('auron');
    const rows = engine.predictTurnOrder(12);
    expect(rows.some((r) => r.actorId === 'yunalesca')).toBe(true);
  });
});

describe('Sleep expires on the sleeper’s own turns (§4.1, §4.2)', () => {
  // §4.1: "Only Sleep, Silence, Darkness, Slow, Regen tick down, by 1 at the end
  // of the victim's own action." 3 turns is Sleep Attack's duration (§4.2) and
  // the duration Yunalesca's Form-I Sleep counter uses.
  it('a slept Yu Pagoda acts again, and the duration reaches zero', () => {
    const engine = boot('yu-yevon', dreamsEndBuild, 3);
    combatant(engine, 'yu-pagoda-left').statuses['sleep'] = sleepInstance(3);

    let pagodaTurns = 0;
    for (let i = 0; i < 20000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') {
        defend(engine, d);
      } else if (d.kind === 'resolved') {
        for (const ev of d.events) {
          if (ev.type === 'turn-start' && ev.actorId === 'yu-pagoda-left') pagodaTurns += 1;
        }
      }
      if (engine.state().turn > 60) break;
    }

    expect(pagodaTurns, 'the sleeper never got a turn at all').toBeGreaterThanOrEqual(3);
    expect(combatant(engine, 'yu-pagoda-left').statuses['sleep']).toBeUndefined();
  });

  it('a slept party member wakes on the clock, with nobody hitting it', () => {
    // Chapter 3: the party carries the fayth's permanent Auto-Life, so a
    // defend-only line runs long enough to watch the duration run out.
    const engine = boot('yu-yevon', dreamsEndBuild, 2);
    combatant(engine, 'tidus').statuses['sleep'] = sleepInstance(3);

    let tidusInputs = 0;
    for (let i = 0; i < 20000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') {
        if (d.actorId === 'tidus') tidusInputs += 1;
        defend(engine, d);
      }
      if (engine.state().turn > 60) break;
    }

    expect(tidusInputs, 'a sleeper never woke and never took a turn').toBeGreaterThan(0);
    expect(combatant(engine, 'tidus').statuses['sleep']).toBeUndefined();
  });
});

describe('Enemy letter tags mark duplicates, not the formation', () => {
  it('a unique enemy carries no letter (Chapter 1: Seymour Flux + Mortiorchis)', () => {
    const engine = boot('seymour-flux', gagazetBuild, 1);
    const rows = engine.predictTurnOrder(16);
    const mortiorchis = rows.filter((r) => r.actorId === 'mortiorchis');
    const seymour = rows.filter((r) => r.actorId === 'seymour-flux');
    expect(mortiorchis.length).toBeGreaterThan(0);
    expect(seymour.length).toBeGreaterThan(0);
    for (const r of [...mortiorchis, ...seymour]) expect(r.letterTag).toBeUndefined();
  });

  it('duplicates letter from A inside their own name group (Chapter 3: two Yu Pagodas)', () => {
    const engine = boot('yu-yevon', dreamsEndBuild, 1);
    const rows = engine.predictTurnOrder(24);
    const tagOf = (id: string): string | undefined => rows.find((r) => r.actorId === id)?.letterTag;

    expect(tagOf('yu-pagoda-left')).toBe('A');
    expect(tagOf('yu-pagoda-right')).toBe('B');
    // Yu Yevon is one of a kind in that formation: no letter.
    expect(tagOf('yu-yevon')).toBeUndefined();
  });
});
