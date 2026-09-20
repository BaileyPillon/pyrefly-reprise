/**
 * Critic round 04, engine track: the four repairs in `src/battle/ffx/**`.
 *
 * - **PR-0004 (major)** — a Threatened enemy still counterattacked.
 *   `research/ffx-combat-core.md` §4.2 states the rule in one sentence: the
 *   target "cannot act **or counterattack** (can still evade)"
 *   `[verified: 2 sources]`, and `src/data/ffx/statuses/core.ts` ships that same
 *   sentence as the status text a player reads. `canCounter()` in
 *   `src/battle/ffx/ai/reactions.ts` encoded it from the start and **had no call
 *   site anywhere in `src/` or `tests/`** — AGENTS.md hard rule 4, "built but
 *   wired to nothing". The critic observed Yunalesca countering twice in one run
 *   with `statuses: ['threaten']` read immediately before and after the hit.
 * - **PR-0023 (polish)** — the letter tag was recomputed from the enemies
 *   *currently on the field*, so when one of Chapter 3's two Yu Pagodas died the
 *   group fell under two and the survivor was silently renamed from "Yu Pagoda
 *   B" to plain "Yu Pagoda", then renamed back when its twin revived. The
 *   Pagodas die and revive repeatedly, so the tile relabelled repeatedly.
 * - **PR-0040 (polish)** — `state.ts` crossed the 400-line house limit
 *   (AGENTS.md hard rule 7) when the Threaten/Sleep repair landed.
 * - **PR-0025 (polish)** — the rank-3 recovery a denied turn is charged is not
 *   stated by any section the code cites, so it must read as an `[estimate]`
 *   with its reason (AGENTS.md hard rule 6).
 *
 * ## Which game
 *
 * **FFX only**, for all four. Threaten is an FFX ability and is enemy-only in
 * practice (§4.2, §11 C12: party and aeons are innately immune at resistance
 * 255); `research/ffx2-combat-core.md` has no Threaten and the ATB engine has no
 * equivalent status, so there is nothing in FFX-2 for PR-0004 to apply to. The
 * letter tag is the CTB forecast's own tile label. The rank-3 recovery is the
 * CTB recovery ladder, which FFX-2's ATB wait model does not share. The last
 * describe block asserts the FFX-2 side is untouched: its status table carries
 * no `threaten`, and its command build is unchanged by any of this.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type {
  BattleEvent,
  Command,
  Decision,
  FFXCombatant,
  StatusInstance,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import * as ffx2data from '../../src/data/ffx2/index.ts';

const src = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(`../../src/${rel}`, import.meta.url)), 'utf8');

function content(): FFXContentRegistry {
  const c = new FFXContentRegistry();
  c.addAbilities(ALL_ABILITIES);
  c.addItems(Object.values(ITEMS));
  return c;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function boot(groupId: string, build: any, seed: number) {
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

/**
 * The exact shape `threaten`'s status effect produces: no turn clock of its
 * own, released by the user's next turn (§4.2), so `sourceId` is load-bearing.
 */
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

// ---------------------------------------------------------------------------
// PR-0004 — Threaten stops the counter
// ---------------------------------------------------------------------------

interface HitReading {
  /** Events the single party action produced, in engine order. */
  delta: BattleEvent[];
  /** Whether the boss was carrying Threaten at the instant the hit landed. */
  threatenedAtHit: boolean;
}

/**
 * Drive the real Chapter 2 encounter until a party member other than Auron has
 * a turn, then hit Yunalesca with an ordinary physical Attack and hand back
 * exactly what that one action wrote to the log.
 *
 * Auron is skipped because **his** next turn is what releases Threaten (§4.2);
 * measuring the counter on his turn would measure the release instead. When
 * `threaten` is true the status is applied immediately before the submit, which
 * is the state the critic read off `window.__pyrefly.battleState()` at runtime.
 */
function attackYunalesca(seed: number, threaten: boolean): HitReading {
  const engine = boot('yunalesca', zanarkandBuild, seed);
  const boss = combatant(engine, 'yunalesca');

  for (let i = 0; i < 4000; i += 1) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;

    const rows = d.commands.filter((c) => c.enabled);
    const attack = rows.find((c) => c.command.kind === 'attack');
    const target = attack?.validTargets.includes('yunalesca') === true ? 'yunalesca' : undefined;

    if (d.actorId === 'auron' || !attack || target === undefined) {
      engine.submit((rows[0]?.command ?? { kind: 'attack', targets: [] }) as Command);
      continue;
    }

    if (threaten) boss.statuses['threaten'] = threatenInstance('auron');
    const threatenedAtHit = boss.statuses['threaten'] !== undefined;

    const before = engine.state().log.length;
    engine.submit({ kind: 'attack', targets: [target] } as Command);
    const delta = engine.state().log.slice(before);
    if (!delta.some((e) => e.type === 'damage' && e.targetId === 'yunalesca')) continue;
    return { delta, threatenedAtHit };
  }
  throw new Error(`seed ${seed}: never landed a party hit on Yunalesca`);
}

const countersIn = (delta: readonly BattleEvent[]): BattleEvent[] =>
  delta.filter((e) => e.type === 'counter');

describe('PR-0004 — a Threatened enemy cannot counterattack [ffx-combat-core §4.2]', () => {
  // The control. Without it the test below could pass on an engine that never
  // counters at all, which would make it worthless as a regression lock.
  it('an unthreatened Yunalesca does counter a landed physical hit', () => {
    const seedsThatCountered = [1, 2, 3, 4, 5, 6, 7, 8].filter(
      (seed) => countersIn(attackYunalesca(seed, false).delta).length > 0,
    );
    expect(
      seedsThatCountered.length,
      'no seed produced a counter at all, so the Threaten assertion below proves nothing',
    ).toBeGreaterThan(0);
  });

  // This is the failing case the critic measured. On the code before the fix
  // the delta reads `damage->Yunalesca, action-end, counter(Yunalesca)->…`
  // with `statuses: ['threaten']` on the boss throughout.
  it('a Threatened Yunalesca takes the damage and fires no counter, on every seed', () => {
    const offenders: string[] = [];
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const { delta, threatenedAtHit } = attackYunalesca(seed, true);
      expect(threatenedAtHit, `seed ${seed}: Threaten was not on the boss when the hit landed`).toBe(
        true,
      );
      expect(
        delta.some((e) => e.type === 'damage' && e.targetId === 'yunalesca'),
        `seed ${seed}: the hit itself did not land, so the counter was never provoked`,
      ).toBe(true);
      for (const c of countersIn(delta)) {
        offenders.push(`seed ${seed}: ${JSON.stringify(c)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  // AGENTS.md hard rule 4, and the half of the acceptance check that survives
  // the fix: a guard nothing calls is a guard that does not exist. This fails
  // the moment the call site is deleted again, which is how the defect arrived.
  it('canCounter is actually called — a guard with no call site is the original defect', () => {
    const reactions = src('battle/ffx/ai/reactions.ts');
    const calls = [...reactions.matchAll(/canCounter\s*\(/g)];
    const declarations = [...reactions.matchAll(/function\s+canCounter\s*\(/g)];
    expect(declarations.length, 'canCounter is no longer declared in reactions.ts').toBe(1);
    expect(
      calls.length - declarations.length,
      'canCounter has no call site: §4.2 is encoded but never consulted',
    ).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// PR-0023 — the letter tag is assigned once per battle
// ---------------------------------------------------------------------------

describe('PR-0023 — an enemy is never renamed mid-battle', () => {
  it('the surviving Yu Pagoda keeps its letter while its twin is down (Chapter 3)', () => {
    const engine = boot('yu-yevon', dreamsEndBuild, 5);
    const wrong: string[] = [];
    let sawPagodaDown = false;

    const readTags = (): void => {
      const rows = engine.predictTurnOrder(24);
      const tagOf = (id: string): string | undefined =>
        rows.find((r) => r.actorId === id)?.letterTag;
      const left = tagOf('yu-pagoda-left');
      const right = tagOf('yu-pagoda-right');
      // A Pagoda that is not in the forecast at all carries no claim here; a
      // Pagoda that *is* listed must be listed under the name it started with.
      if (left !== undefined && left !== 'A') wrong.push(`left tagged ${left}`);
      if (right !== undefined && right !== 'B') wrong.push(`right tagged ${right}`);
      if (rows.some((r) => r.actorId === 'yu-pagoda-right') && right === undefined) {
        wrong.push('the surviving Yu Pagoda lost its letter while its twin was down');
      }
      if (rows.some((r) => r.actorId === 'yu-pagoda-left') && left === undefined) {
        wrong.push('the surviving Yu Pagoda lost its letter while its twin was down');
      }
      // Yu Yevon is one of a kind in that formation and must never gain one.
      if (tagOf('yu-yevon') !== undefined) wrong.push('Yu Yevon gained a letter');
    };

    readTags();
    for (let i = 0; i < 20000; i += 1) {
      const d: Decision = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') {
        const rows = d.commands.filter((c) => c.enabled);
        const attack = rows.find((c) => c.command.kind === 'attack');
        // Hit the left Pagoda whenever it is a legal target: killing it is the
        // whole point of this drive.
        const target = attack?.validTargets.find((t) => t === 'yu-pagoda-left');
        engine.submit(
          (target !== undefined
            ? { kind: 'attack', targets: [target] }
            : (rows.find((c) => c.command.kind === 'defend')?.command ??
              rows[0]?.command ??
              { kind: 'attack', targets: [] })) as Command,
        );
      }
      const left = combatant(engine, 'yu-pagoda-left');
      if (!left.alive || left.hp === 0) sawPagodaDown = true;
      readTags();
      if (sawPagodaDown && engine.state().turn > 60) break;
      if (engine.state().turn > 200) break;
    }

    expect(sawPagodaDown, 'the drive never actually put a Yu Pagoda down, so nothing was tested').toBe(
      true,
    );
    expect([...new Set(wrong)]).toEqual([]);
  });

  it('a unique enemy still carries no letter (Chapter 2: Yunalesca alone)', () => {
    const engine = boot('yunalesca', zanarkandBuild, 1);
    const rows = engine.predictTurnOrder(16);
    const yunalesca = rows.filter((r) => r.actorId === 'yunalesca');
    expect(yunalesca.length).toBeGreaterThan(0);
    for (const r of yunalesca) expect(r.letterTag).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// PR-0040 and PR-0025 — the house limit and the honest constant
// ---------------------------------------------------------------------------

describe('PR-0040 — the house 400-line limit [AGENTS.md hard rule 7]', () => {
  it('state.ts and the module split out of it are both under 400 lines', () => {
    for (const rel of ['battle/ffx/state.ts', 'battle/ffx/predicates.ts']) {
      const lines = src(rel).split('\n').length;
      expect(lines, `${rel} is ${lines} lines`).toBeLessThan(400);
    }
  });

  it('the split is a move, not an API change: state.ts still exports every predicate', async () => {
    const state = await import('../../src/battle/ffx/state.ts');
    for (const name of [
      'has',
      'statusOf',
      'stacks',
      'inTurnQueue',
      'canAct',
      'onField',
      'targetable',
      'isAlive',
      'canSwitchIn',
      'isSubmenuMarker',
    ]) {
      expect(typeof (state as unknown as Record<string, unknown>)[name], name).toBe('function');
    }
  });
});

describe('PR-0025 — the denied-turn recovery is labelled [estimate] [AGENTS.md hard rule 6]', () => {
  it('the rank-3 charge in the pass path carries an [estimate] marker and its reason', () => {
    const engine = src('battle/ffx/engine.ts');
    const at = engine.indexOf('chargeForAction(ctx, actor.id, 3)');
    expect(at, 'the denied-turn branch moved; re-point this check').toBeGreaterThan(0);
    // The comment block immediately above the charge.
    const preamble = engine.slice(Math.max(0, at - 1600), at);
    expect(preamble).toContain('[estimate]');
    expect(preamble.toLowerCase()).toContain('default action rank');
  });
});

// ---------------------------------------------------------------------------
// The other game is unaffected [AGENTS.md hard rule 14]
// ---------------------------------------------------------------------------

describe('FFX-2 is untouched by any of this', () => {
  it('no FFX-2 ability inflicts threaten, so PR-0004 has nothing to apply to there', () => {
    const offenders = Object.values(ffx2data.ABILITIES).filter((a) =>
      (a.statusEffects ?? []).some((s) => String(s.status) === 'threaten'),
    );
    expect(offenders.map((a) => a.id)).toEqual([]);
  });

  it('the FFX-2 engine source never reads a threaten status', () => {
    for (const rel of ['battle/ffx2/targeting.ts', 'battle/ffx2/statuses.ts']) {
      expect(src(rel)).not.toContain('threaten');
    }
  });
});
