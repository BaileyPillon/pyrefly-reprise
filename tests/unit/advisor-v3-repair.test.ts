/**
 * **Advisor v3, repair of the adversarial check** (docs/handoff/advisor-v3.md, CHECK and REPAIR).
 *
 * Every case is found by **running the engine** (AGENTS.md rule 3): a girl follows the v3 card at
 * the house human pace (`critic/bench/advisor-v3/drive.ts`) and the board is read where the check
 * said the card went wrong.
 *
 *  - FB1: a Mega-Potion that **lands inside the projection** is still Bailey's Mega-Potion: the
 *    next girl's card does not say Mega-Potion.
 *  - FM2: a projection in which a charging hit **finishes the battle** is not ranked on.
 *  - FM3: the **last copy** of an item on another girl's charge bar is not advised again.
 *  - FM5: the strategy guide's NEXT line does not name the same support move already charging.
 *  - FM4: `provedSave` is deterministic, never touches the battle, and what it promotes keeps the
 *    threatened girl alive on forks it did not sample.
 *
 * Game case: **FFX-2 only** (rule 14): only ATB opens a menu while another command is in flight.
 */

import { describe, expect, it } from 'vitest';
import type { BattleState, Command, CombatantId } from '../../src/battle/common/types.ts';
import type { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { buildAdvisorView, clearAdvisorCache, type AdvisorView } from '../../src/engine/tactics/advisor.ts';
import { boardFor } from '../../src/engine/tactics/advisor-v3.ts';
import { inFlight, type InFlightSource } from '../../src/engine/tactics/advisor-inflight.ts';
import { buildGuideView, recommendedCommand } from '../../src/engine/tactics/guide.ts';
import { chosenAlready } from '../../src/engine/tactics/guide-inflight.ts';
import { provedSave } from '../../src/engine/tactics/advisor-lethal.ts';
import { evaluate } from '../../src/engine/tactics/advisor-eval.ts';
import { forecastFromState } from '../../src/engine/tactics/advisor-forecast.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { chapterById, runChapter, type DecisionContext } from '../../critic/bench/advisor-v3/drive.ts';
import { pendingCommands, simulateFor } from '../../critic/bench/advisor-v3/metrics.ts';

class Stop extends Error {
  constructor(readonly value: unknown) {
    super('found');
  }
}
const idOf = (c: Command | null | undefined): string => (c && 'id' in c ? String((c as { id?: unknown }).id ?? '') : '');
const top = (v: AdvisorView | null): Command | null => v?.suggestions[0]?.command ?? null;
const v3Card = (ctx: DecisionContext): AdvisorView | null => {
  clearAdvisorCache();
  return buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, { ...ctx.advisorOptions, v3: true });
};
const engineOf = (ctx: DecisionContext): FFX2Engine => ctx.engine as unknown as FFX2Engine;

/** Follow the v3 card on `chapters` x `seeds` until `probe` returns something. */
async function search<T>(
  chapters: string[],
  seeds: number,
  probe: (ctx: DecisionContext, card: AdvisorView | null) => T | null,
  rig?: (ctx: DecisionContext) => void,
): Promise<T | null> {
  for (const id of chapters) {
    for (let seed = 1; seed <= seeds; seed++) {
      try {
        await runChapter(chapterById(id), seed, (ctx) => {
          rig?.(ctx);
          const card = v3Card(ctx);
          const hit = probe(ctx, card);
          if (hit !== null) throw new Stop(hit);
          return top(card);
        });
      } catch (e) {
        if (e instanceof Stop) return e.value as T;
        throw e;
      }
    }
  }
  return null;
}

describe('advisor v3 repair (FFX-2 only)', () => {
  it('FB1: a Mega-Potion that lands inside the projection is not advised again', async () => {
    const found = await search(['ffx2-vegnagun-shuyin', 'ffx2-fallen-aeons'], 40, (ctx, card) => {
      const p = pendingCommands(ctx).find((x) => idOf(x.command) === 'x2-mega-potion');
      if (!p) return null;
      const b = boardFor(ctx.state, ctx.decision.actorId, { ...ctx.advisorOptions, v3: true });
      if (!b.projection) return null;
      // Landed on the projected board: the check's case (the old rule looked only there).
      const stillThere = inFlight(b.state, ctx.decision.actorId, b.projection.stillHeld).some((x) => idOf(x.command) === 'x2-mega-potion');
      if (stillThere) return null;
      // The v3 card without the rule says Mega-Potion here: the check's case, on this board.
      clearAdvisorCache();
      const without = buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, { ...ctx.advisorOptions, v3: true, v3Rules: { onItsWay: false } });
      return idOf(top(without)) === 'x2-mega-potion' ? { ctx, card, p } : null;
    });
    expect(found, 'a board where a charging Mega-Potion lands inside the projection').not.toBeNull();
    expect(idOf(top(found!.card))).not.toBe('x2-mega-potion');
    expect(found!.card?.suggestions.some((s) => idOf(s.command) === 'x2-mega-potion')).toBe(false);
  }, 600_000);

  it('FM2: a projection in which the battle ends is not ranked on (the v2 reading stands)', async () => {
    const found = await search(['ffx2-bahamut', 'ffx2-den-of-woe', 'ffx2-vegnagun-shuyin'], 40, (ctx) => {
      if (pendingCommands(ctx).length === 0) return null;
      // Watch the forks the projection makes: one that ends with a result is the case.
      let ended = false;
      const live = engineOf(ctx);
      const watched: InFlightSource = {
        state: () => live.state(),
        heldCommand: () => live.heldCommand(),
        fork: (seed: number) => {
          const f = live.fork(seed);
          const tick = f.tick.bind(f);
          f.tick = (ms, o) => {
            const ev = tick(ms, o);
            if (f.state().result) ended = true;
            return ev;
          };
          return f;
        },
      };
      const b = boardFor(ctx.state, ctx.decision.actorId, { ...ctx.advisorOptions, v3: true, engine: () => watched });
      return ended ? { b } : null;
    });
    expect(found, 'a board where a charging hit ends the battle inside the projection').not.toBeNull();
    expect(found!.b.projection).toBeNull();
    expect(found!.b.state.result ?? null).toBeNull();
  }, 600_000);

  it('FM3: the last copy of an item already in flight is not advised again', async () => {
    // A/B on one board: with a second copy on the shelf the card names the item; with only the
    // copy already in flight left, it does not.
    const found = await search(['ffx2-leblanc', 'ffx2-vegnagun-shuyin', 'ffx2-den-of-woe', 'ffx2-fallen-aeons'], 40, (ctx, card) => {
      const t = top(card);
      if (!t || t.kind !== 'item') return null;
      // An attack item (a Grenade): the same-move rule does not cover it, only the stock rule does.
      if ((simulateFor(ctx.state, ctx.decision.actorId, t, ctx.advisorOptions)?.damageToEnemies ?? 0) <= 0) return null;
      const key = `inventory:${idOf(t)}`;
      const used = pendingCommands(ctx).filter((p) => p.command.kind === 'item' && idOf(p.command) === idOf(t)).length;
      const flags = (engineOf(ctx).state() as BattleState).flags;
      const had = flags[key];
      if (used === 0 || typeof had !== 'number') return null;
      flags[key] = used; // the probe's own engine, restored below
      const last = v3Card(ctx);
      clearAdvisorCache();
      const without = buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, { ...ctx.advisorOptions, v3: true, v3Rules: { onItsWay: false } });
      flags[key] = had;
      // Only a board where the rule is what keeps it off the card.
      return idOf(top(without)) === idOf(t) ? { item: idOf(t), last } : null;
    });
    expect(found, "a board where the card names an item another girl is also using").not.toBeNull();
    for (const s of found!.last?.suggestions ?? []) expect(idOf(s.command)).not.toBe(found!.item);
  }, 600_000);

  it("FM5: the guide's NEXT line does not name the same support move already charging", async () => {
    const found = await search(['ffx2-vegnagun-shuyin', 'ffx2-leblanc', 'ffx2-fallen-aeons', 'ffx2-den-of-woe'], 20, (ctx) => {
      const d = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
      const line = recommendedCommand(ctx.state, d);
      if (!line || !chosenAlready(ctx.state, d.actorId, line)) return null;
      return { ctx, d, line };
    });
    expect(found, 'a board where the chapter line picks a move another girl is already charging').not.toBeNull();
    const { ctx, d, line } = found!;
    // The v2 panel named it; the v3 panel does not.
    expect(chosenAlready(ctx.state, d.actorId, line, [], false)).toBe(false);
    expect(buildGuideView(ctx.state, d)?.next ?? null).toBeNull();
    const charging = inFlight(ctx.state, d.actorId, []).map((p) => `${p.command.kind}:${idOf(p.command)}`);
    expect(charging).toContain(`${line.kind}:${idOf(line)}`);
  }, 600_000);

  it('FM4: provedSave is deterministic, leaves the battle alone, and its pick holds on unseen forks', async () => {
    const found = await search(['ffx2-vegnagun-shuyin'], 40, (ctx) => {
      const live = engineOf(ctx);
      const st = ctx.state;
      const actor = ctx.decision.actorId;
      const intent = forecastFromState(st, ctx.advisorOptions);
      if (!intent?.estimate?.perTarget.some((p) => p.lethal)) return null;
      const lineCmd = intendedStrategy(actor, ctx.decision.commands, live as never);
      if (!lineCmd) return null;
      const rowOf = (c: Command) => {
        const out = simulateFor(st, actor, c, ctx.advisorOptions);
        return { suggestion: { command: c }, facts: evaluate(st, actor, c, out, [], intent).facts };
      };
      const rows = [rowOf(lineCmd)];
      for (const r of ctx.decision.commands) {
        if (!r.enabled || r.wrapsCategory || r.command.kind === 'escape' || r.command.kind === 'switch' || r.command.kind === 'spherechange') continue;
        for (const t of r.validTargets.slice(0, 4)) rows.push(rowOf({ ...r.command, targets: [t] } as Command));
      }
      const snap = (): string => JSON.stringify([live.state().nextSeq, live.state().log.length, (live as unknown as { rng: { saveState(): number } }).rng.saveState(), live.heldCommand()]);
      const before = snap();
      const a = provedSave(st, actor, live, rows);
      const b = provedSave(st, actor, live, rows);
      if (!a) return null;
      return { ctx, rows, a, b, pure: before === snap() };
    });
    expect(found, 'a board where a saving row is proved over the chapter line').not.toBeNull();
    const { ctx, rows, a, b, pure } = found!;
    expect(b).toBe(a);
    expect(pure).toBe(true);
    // Re-test on forks with seeds provedSave never uses: the promoted row keeps her alive at least
    // as often as the line.
    const threatened = a.facts.filter((f) => f.kind === 'saves-from-lethal').map((f) => f.targetId as CombatantId);
    const lives = (c: Command): number => {
      let n = 0;
      for (let k = 0; k < 8; k++) {
        const f = engineOf(ctx).fork(0xabc0 + k);
        f.setAtbMode('active');
        f.setMenuLevel('top');
        f.submit(c);
        for (let i = 0; i < 120; i++) {
          f.tick(100, { throughInput: true });
          if (threatened.some((id) => f.state().combatants[id]?.alive === false) || f.state().result) break;
        }
        if (threatened.every((id) => f.state().combatants[id]?.alive !== false)) n += 1;
      }
      return n;
    };
    expect(lives(a.suggestion.command)).toBeGreaterThanOrEqual(lives(rows[0]!.suggestion.command));
  }, 600_000);
});
