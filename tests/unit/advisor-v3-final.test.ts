// @vitest-environment jsdom
/**
 * Advisor v3, the final fix after the second adversarial check (docs/handoff/advisor-v3.md,
 * "CHECK 2" and "FINAL FIX"). **FFX-2 only** [AGENTS.md rule 14]: only FFX-2's ATB holds a
 * confirmed command for a chain lock while the next girl's menu is open
 * [research/ffx2-combat-core.md §1.1, §1.7; PR-0076]; FFX's CTB has no held command.
 *
 *  - C2-B1: the guide NEXT the advisor borrows (`buildGuideView().next`) must not name a move the
 *    engine is **holding** for another girl (a chain-locked Mega Phoenix at Vegnagun, a Phoenix Down
 *    at the Den of Woe). The card already avoided it. (The strategy guide panel no longer shows a
 *    NEXT: it is a document since r38, and the two panels are separate.)
 *
 *  - C2-M1: when the enemy moves before another girl's charging heal lands, the card judged "one
 *    hit from down" on HP the heal in flight was about to fill, and named a different heal on the
 *    same girl. The heal in flight now counts when it lands in time (`advisor-covered.ts`); a heal
 *    **held** for a chain lock never counts, because the girl choosing may extend the chain.
 *
 * Every board below was found by running the engine (rule 3): the v3 card is followed on the
 * seeds the check (or the final fix's own probe) named.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, CombatantId, Command } from '../../src/battle/common/types.ts';
import type { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { buildAdvisorView, clearAdvisorCache, type AdvisorView } from '../../src/engine/tactics/advisor.ts';
import type { QueuedCommand } from '../../src/engine/tactics/advisor-committed.ts';
import { buildGuideView, recommendedCommand } from '../../src/engine/tactics/guide.ts';
import { chosenAlready } from '../../src/engine/tactics/guide-inflight.ts';
import { inFlight } from '../../src/engine/tactics/advisor-inflight.ts';
import { chapterById, runChapter, type DecisionContext } from '../../critic/bench/advisor-v3/drive.ts';
import { pendingCommands } from '../../critic/bench/advisor-v3/metrics.ts';

class Stop extends Error {
  constructor(readonly value: unknown) {
    super('found');
  }
}
const idOf = (c: Command | null | undefined): string => (c && 'id' in c ? String((c as { id?: unknown }).id ?? '') : '');
const aimOf = (c: Command): string => [...(c.targets as readonly string[])].sort().join(',');
const top = (v: AdvisorView | null): Command | null => v?.suggestions[0]?.command ?? null;
const v3Card = (ctx: DecisionContext): AdvisorView | null => {
  clearAdvisorCache();
  return buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, { ...ctx.advisorOptions, v3: true });
};

interface HeldBoard {
  ctx: DecisionContext;
  held: QueuedCommand;
  line: Command;
  card: AdvisorView | null;
}

/**
 * The state an enemy hit leaves a girl in: chained for 3 s (§1.7), so the engine holds the command she confirms until the window closes
 * (PR-0076). Re-parity W4 (FFX-2 only; reason "game-code parity"): at the game's gauge a hold that the chapter line then repeats no longer
 * turns up by itself in 135 seeds of either chapter, so the board is rigged to the state the check described: the choosing girl is chained
 * and confirms the chapter line's own item, which is held, and the next girl's NEXT is read. The engine's hold, the guide and the card are
 * all real; only the hit that chained her is stood in for.
 */
function chainTheChooser(ctx: DecisionContext): void {
  const u = ctx.state.combatants[ctx.decision.actorId] as unknown as { chainWindowTicks: number; chainCount: number };
  u.chainWindowTicks = 90;
  u.chainCount = Math.max(1, u.chainCount);
}

/** Follow the chapter line (chained, so its items are held) on one chapter and seed to the first decision where the line picks the held move again. */
async function heldBoard(chapter: string, seed: number, itemId: string): Promise<HeldBoard | null> {
  try {
    await runChapter(chapterById(chapter), seed, (ctx) => {
      const held = (ctx.engine as unknown as FFX2Engine).heldCommand();
      const d = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
      const line = recommendedCommand(ctx.state, d);
      if (held && held.actorId !== d.actorId && line && line.kind === 'item' && idOf(held.command) === itemId && idOf(line) === itemId &&
          aimOf(line) === aimOf(held.command)) {
        throw new Stop({ ctx, held, line, card: v3Card(ctx) });
      }
      if (!held && line && line.kind === 'item') {
        chainTheChooser(ctx);
        return line;
      }
      return top(v3Card(ctx)) ?? line;
    });
  } catch (e) {
    if (e instanceof Stop) return e.value as HeldBoard;
    throw e;
  }
  return null;
}

describe('advisor v3 final fix (FFX-2 only)', () => {
  for (const [chapter, seed, item] of [
    // Re-parity W4 (FFX-2 only; reason "game-code parity"): seed 59 under the old engine, seed 1 under the rig of `chainTheChooser` (the first seed of
    // the rigged search; the Den of Woe board below is still seed 4).
    ['ffx2-vegnagun-shuyin', 1, 'x2-mega-phoenix'],
    // Re-parity W3 (FFX-2 only; reason "game-code parity"): the Den of Woe board was seed 62; the game's draw order (hit rolls first, then
    // the variance and the critical per strike) is a different replay of every seed, so the board was searched again over the seeds in
    // order and is now seed 4 (the first on which the engine holds a Phoenix Down the chapter line picks again). Same board, same rule.
    // RC3 (FFX-2 only; reason "game-script parity" on top of W4): the Den's scripts follow the game's own now (lane c: Baralai's counter per result, his Drill Shot, the Triple Attack as
    // three Chain Attacks, Gippal's lowest-HP Attack), a different replay of every seed, so the Den board was searched again: the first seed with it is 5 (it was 4 on W4's clock). The case
    // scans forward from that seed, so a later engine change finds the next board instead of failing.
    ['ffx2-den-of-woe', 5, 'x2-phoenix-down'],
  ] as const) {
    it(`C2-B1: a held ${item} is not the NEXT the advisor borrows (${chapter} from seed ${seed})`, async () => {
      let found: HeldBoard | null = null;
      for (let s = seed; s < seed + 80 && found === null; s++) found = await heldBoard(chapter, s, item);
      expect(found, `a board where the engine holds ${item} and the chapter line picks it again`).not.toBeNull();
      const { ctx, held, line, card } = found!;
      const d = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
      // The board is the bug's: without the held command the borrowed NEXT names the move.
      expect(idOf(buildGuideView(ctx.state, d)?.next?.command)).toBe(item);
      // Handed the engine's held command, exactly as the card gets it, it does not.
      expect(chosenAlready(ctx.state, d.actorId, line, [held])).toBe(true);
      expect(idOf(buildGuideView(ctx.state, { ...d, held: [held] })?.next?.command)).not.toBe(item);
      // v3 off: the v2 panel is unchanged.
      expect(chosenAlready(ctx.state, d.actorId, line, [held], false)).toBe(false);
      // And the card, which already had the held command, does not name it either.
      const t = top(card);
      expect(t !== null && idOf(t) === item && aimOf(t) === aimOf(held.command)).toBe(false);
    }, 600_000);
  }

  /** The card with the C2-M1 rule on (the default) and off, on one board. */
  const cards = (ctx: DecisionContext): { now: AdvisorView | null; before: AdvisorView | null } => {
    const now = v3Card(ctx);
    clearAdvisorCache();
    const d = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
    const before = buildAdvisorView(ctx.state, d, { ...ctx.advisorOptions, v3: true, v3Rules: { covered: false } });
    return { now, before };
  };
  /** Futures (of 8 fixed fork seeds) in which `girl` is standing after the enemy's next move on her. */
  const standing = (ctx: DecisionContext, command: Command, girl: CombatantId): number => {
    let alive = 0;
    for (let seed = 1; seed <= 8; seed++) {
      const fork = (ctx.engine as unknown as FFX2Engine).fork(0xf1a1_0000 + seed);
      fork.setAtbMode('active');
      fork.setMenuLevel('top');
      fork.submit(command);
      let hit = false;
      for (let step = 0; step < 120; step++) {
        const events: readonly BattleEvent[] = fork.tick(100, { throughInput: true });
        const s = fork.state();
        if (events.some((e) => e.type === 'damage' && e.targetId === girl && e.sourceId !== undefined && s.combatants[e.sourceId]?.side === 'enemy')) hit = true;
        if (s.result || s.combatants[girl]?.alive === false || (hit && events.some((e) => e.type === 'action-end'))) break;
      }
      if (fork.state().combatants[girl]?.alive !== false) alive += 1;
    }
    return alive;
  };

  // Re-parity W4 (FFX-2 only; reason "game-code parity"): the Leblanc board was seed 74; the game's gauge is a different replay of every seed, so the board
  // was searched again over the seeds in order and is now seed 5 (the first on which the card used to say "one hit from down" behind a heal already charging).
  // Re-parity RNG lane (game streams, Bailey 2026-10-09): the FFX-2 streams are another deal of every seed, so the board is searched again over the
  // seeds in order (it was seed 5) and the first that shows it is used.
  it('C2-M1: a charging heal that lands in time is counted; the card names no second heal (Leblanc, the first seed that shows the board)', async () => {
    let found: { ctx: DecisionContext; now: AdvisorView | null; before: AdvisorView | null; girl: CombatantId; snap: string } | null = null;
    for (let seed = 1; seed <= 80 && found === null; seed++) {
    try {
      await runChapter(chapterById('ffx2-leblanc'), seed, (ctx) => {
        const e = ctx.engine as unknown as FFX2Engine;
        const snap = JSON.stringify([e.state(), e.heldCommand()]);
        const { now, before } = cards(ctx);
        const b = top(before);
        const girl = b?.targets[0] as CombatantId | undefined;
        const charging = inFlight(ctx.state, ctx.decision.actorId, []).filter((p) => girl && p.command.kind === 'item' && p.command.targets.includes(girl));
        if (b && girl && b.kind === 'item' && /one hit from down$/.test(before?.suggestions[0]?.reason ?? '') && charging.length > 0 && idOf(top(now)) !== idOf(b)) {
          throw new Stop({ ctx, now, before, girl, snap });
        }
        return top(now);
      });
    } catch (e) {
      if (!(e instanceof Stop)) throw e;
      found = e.value as typeof found;
    }
    }
    expect(found, 'a board where the card used to say "one hit from down" behind a heal already charging').not.toBeNull();
    const { ctx, now, before, girl, snap } = found!;
    // Neither card touched the battle [AGENTS.md rule 1].
    const e = ctx.engine as unknown as FFX2Engine;
    expect(JSON.stringify([e.state(), e.heldCommand()])).toBe(snap);
    // The card no longer claims she is one hit from down (the heal in flight takes her out of it).
    expect(now?.suggestions[0]?.reason ?? '').not.toMatch(/one hit from down/);
    // Waste, proved on forks: she stands through the enemy's next move as often without the second heal.
    expect(standing(ctx, top(now)!, girl)).toBeGreaterThanOrEqual(standing(ctx, top(before)!, girl));
  }, 600_000);

  it('C2-M1: a heal held for a chain lock covers nobody; the save stays (Vegnagun seed 1)', async () => {
    let found: { now: AdvisorView | null; before: AdvisorView | null } | null = null;
    try {
      await runChapter(chapterById('ffx2-vegnagun-shuyin'), 1, (ctx) => {
        const held = (ctx.engine as unknown as FFX2Engine).heldCommand();
        if (held && idOf(held.command) === 'x2-megalixir' && pendingCommands(ctx).length === 1) {
          // The check's board: the Megalixir is the only command in flight and it is held, and the party is down to 30 percent (stood in for the
          // beating the check described), so a girl the held heal does not cover needs a Mega-Potion.
          for (const c of Object.values(ctx.state.combatants)) if (c.side === 'party' && c.alive) (c as { hp: number }).hp = Math.floor(c.stats.maxHp * 0.3);
          const both = cards(ctx);
          if (idOf(top(both.before)) === 'x2-mega-potion') throw new Stop(both);
        }
        const { now } = cards(ctx);
        if (!held) {
          // Rigged like `heldBoard` (see `chainTheChooser`): whoever can confirms the Megalixir while chained, so the engine holds it.
          const row = ctx.decision.commands.find((c) => c.enabled && c.command.kind === 'item' && idOf(c.command) === 'x2-megalixir' && c.validTargets.length > 0);
          if (row) {
            chainTheChooser(ctx);
            return { ...row.command, targets: row.validTargets.slice(0, 1) } as Command;
          }
        }
        return top(now);
      });
    } catch (e) {
      if (!(e instanceof Stop)) throw e;
      found = e.value as typeof found;
    }
    expect(found, "the check's board: Paine's Megalixir held, a girl the held heal would not save, the card's Mega-Potion").not.toBeNull();
    // Re-parity W3 (FFX-2 only; reason "game-code parity"): seed 52 under the old draw order, seed 15 under the game's (the first seed whose
    // board is this one: Paine's Megalixir held, the card's Mega-Potion without the rule). On the old board, measured with the held command
    // counted: X-Potion on Paine, and Yuna (at 401 HP) fell in 4 of 8 futures.
    // Re-parity W4 (same reason): seed 1 under the rig above (the first seed on which the held Megalixir is the only command in flight). Seed 18, the
    // first on which the held Megalixir and the card's Mega-Potion met, had another girl's heal charging as well, which does cover someone; the rule rightly
    // moved the card there, so that board is not this test's.
    expect(idOf(top(found!.now))).toBe('x2-mega-potion');
  }, 600_000);
});
