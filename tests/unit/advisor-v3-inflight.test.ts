/**
 * **Advisor v3: a command already on its way is not advised again** (FFX-2 only).
 *
 * Bailey, 2026-09-27: *"if i select mega potion for example and executed that command then it
 * needs to know that the mega potion is in progress so it shouldn't still tell me to mega
 * potion."* Each case below is found by **running the engine** (AGENTS.md rule 3): a girl follows
 * the card at the house human pace (`critic/bench/advisor-v3/drive.ts`), is made to press the
 * command once, and the next *other* girl's menu is read while that command is still charging or
 * held. The search keeps only boards where the **v2** card repeated it, so every case is one the
 * old card got wrong; the v3 card (the live HUD's options: the registries and the engine) must
 * not.
 *
 * Game case: **FFX-2 only** (rule 14). FFX's CTB resolves a command before the next turn opens
 * [research/ffx-combat-core.md §1.1]; `advisor-committed.test.ts` asserts FFX boards never carry
 * one.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleState, Command, CombatantId } from '../../src/battle/common/types.ts';
import { buildAdvisorView, clearAdvisorCache, type AdvisorView } from '../../src/engine/tactics/advisor.ts';
import { boardFor } from '../../src/engine/tactics/advisor-v3.ts';
import { chapterById, runChapter, type DecisionContext } from '../../critic/bench/advisor-v3/drive.ts';
import { pendingCommands, simulateFor, type Pending } from '../../critic/bench/advisor-v3/metrics.ts';

type Kind = 'mega' | 'phoenix' | 'heal' | 'buff';
interface Found { ctx: DecisionContext; pending: Pending; v2: AdvisorView | null; v3: AdvisorView | null }
class Stop extends Error {
  constructor(readonly found: Found) {
    super('found');
  }
}

const CHAPTERS = ['ffx2-vegnagun-shuyin', 'ffx2-leblanc', 'ffx2-fallen-aeons', 'ffx2-den-of-woe'];
// Re-parity W3 (FFX-2 only; reason "game-code parity"): 24 seeds, not 12. The Mega-Potion case needs two girls under 75 % at one menu, and
// with the game's draw order and damage numbers the first such board in this scan comes later (it is found within 20 seeds); the cases
// stop at the first board they find, so the larger bound costs nothing where the board is early.
const SEEDS = 24;
const HEALS = ['Potion', 'Hi-Potion', 'X-Potion', 'Cure', 'Cura', 'Curaga'];
const BUFFS = ['Light Curtain', 'Lunar Curtain', 'Protect', 'Shell', 'Haste', 'Hastega', 'Reflect'];

const idOf = (c: Command): string => ('id' in c ? String((c as { id?: unknown }).id ?? '') : '');
const aim = (c: Command): string => (c.targets as readonly CombatantId[]).join(',');
const hpf = (s: Readonly<BattleState>, id: CombatantId): number => {
  const u = s.combatants[id]!;
  return u.alive === false ? 0 : u.hp / u.stats.maxHp;
};
const top = (v: AdvisorView | null): Command | null => v?.suggestions[0]?.command ?? null;

/** The command this girl is made to press, when the board calls for it. */
function force(ctx: DecisionContext, kind: Kind): Command | null {
  const { state, decision } = ctx;
  if (pendingCommands(ctx).length > 0) return null;
  const row = (labels: string[], t?: CombatantId): AvailableCommand | undefined =>
    decision.commands.find((r) => r.enabled && labels.includes(r.label) && (t === undefined || r.validTargets.includes(t)));
  const living = state.activeIds.filter((id) => state.combatants[id]?.alive !== false);
  const aimAt = (r: AvailableCommand | undefined, t: CombatantId | undefined): Command | null =>
    r && t ? ({ ...r.command, targets: [t] } as Command) : null;
  if (kind === 'mega') {
    const r = row(['Mega-Potion']);
    return living.filter((id) => hpf(state, id) < 0.75).length >= 2 ? aimAt(r, r?.validTargets[0]) : null;
  }
  if (kind === 'phoenix') {
    const down = state.activeIds.find((id) => state.combatants[id]?.alive === false);
    return down ? aimAt(row(['Phoenix Down'], down), down) : null;
  }
  if (kind === 'heal') {
    const low = [...living].sort((a, b) => hpf(state, a) - hpf(state, b))[0];
    return low && hpf(state, low) < 0.6 ? aimAt(row(HEALS, low), low) : null;
  }
  for (const r of decision.commands.filter((x) => x.enabled && BUFFS.includes(x.label))) {
    for (const t of r.validTargets.filter((x) => living.includes(x))) {
      const c = { ...r.command, targets: [t] } as Command;
      const o = simulateFor(state, decision.actorId, c, ctx.advisorOptions);
      if (o && o.statusChanges.some((s) => s.applied && state.combatants[s.targetId]?.side !== 'enemy')) return c;
    }
  }
  return null;
}

/** The first board where the next girl's v2 card repeats the command in flight (`bites`). */
async function find(kind: Kind, bites: (ctx: DecisionContext, p: Pending, v2: AdvisorView | null) => boolean): Promise<Found | null> {
  for (const id of CHAPTERS) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      let phase: 'follow' | 'watch' | 'done' = 'follow';
      let by = '';
      try {
        await runChapter(chapterById(id), seed, (ctx) => {
          clearAdvisorCache();
          const d = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
          const v3 = buildAdvisorView(ctx.state, d, { ...ctx.advisorOptions, v3: true });
          if (phase === 'watch' && ctx.decision.actorId !== by) {
            phase = 'done';
            const p = pendingCommands(ctx).find((x) => x.actorId === by);
            const v2 = buildAdvisorView(ctx.state, d, { ...ctx.advisorOptions, v3: false });
            if (p && bites(ctx, p, v2)) throw new Stop({ ctx, pending: p, v2, v3 });
          }
          if (phase === 'follow') {
            const f = force(ctx, kind);
            if (f) {
              phase = 'watch';
              by = ctx.decision.actorId;
              return f;
            }
          }
          return top(v3);
        });
      } catch (e) {
        if (e instanceof Stop) return e.found;
        throw e;
      }
    }
  }
  return null;
}

const sameMove = (a: Command | null, b: Command): boolean => a !== null && a.kind === b.kind && idOf(a) === idOf(b);

describe('advisor v3: in-flight commands (FFX-2 only)', () => {
  it("Mega-Potion charging: the next girl's card does not say Mega-Potion (Bailey's case)", async () => {
    const f = await find('mega', (_c, p, v2) => idOf(p.command) === 'x2-mega-potion' && sameMove(top(v2), p.command));
    expect(f, 'a board where v2 repeated a charging Mega-Potion').not.toBeNull();
    expect(sameMove(top(f!.v3), f!.pending.command)).toBe(false);
    // The card ranks on the board the charging command leaves (the projection), not on this one.
    const b = boardFor(f!.ctx.state, f!.ctx.decision.actorId, { ...f!.ctx.advisorOptions, v3: true });
    expect(b.projection).not.toBeNull();
  }, 600_000);

  it('Phoenix Down held for a chain lock: the next card does not raise the same girl', async () => {
    const raises = (ctx: DecisionContext, c: Command | null): CombatantId[] =>
      c ? (simulateFor(ctx.state, ctx.decision.actorId, c, ctx.advisorOptions)?.revives ?? []) : [];
    // Held, because that is the half v2 got wrong: the live HUD never passed the held command
    // (method check §1); a Phoenix Down on the charge bar was already seen by v2.
    const f = await find('phoenix', (ctx, p, v2) => p.held && idOf(p.command) === 'x2-phoenix-down' && raises(ctx, top(v2)).includes(p.command.targets[0] as CombatantId));
    expect(f, 'a board where v2 raised a girl a Phoenix Down was already on its way to').not.toBeNull();
    expect(raises(f!.ctx, top(f!.v3))).not.toContain(f!.pending.command.targets[0]);
  }, 600_000);

  it('a single heal charging: the next card does not repeat the same heal on the same girl', async () => {
    // v2 healed the girl a charging heal was already on its way to (Cura -> Yuna behind a Potion
    // on Yuna, method check §1), priced on the HP before that heal lands.
    const healsWho = (ctx: DecisionContext, actor: CombatantId, c: Command | null): CombatantId[] =>
      c ? Object.entries(simulateFor(ctx.state, actor, c, ctx.advisorOptions)?.hpDelta ?? {})
        .filter(([id, d]) => d < 0 && ctx.state.combatants[id]?.side !== 'enemy').map(([id]) => id) : [];
    const f = await find('heal', (ctx, p, v2) => {
      const girl = p.command.targets[0] as CombatantId;
      return healsWho(ctx, ctx.decision.actorId, top(v2)).includes(girl);
    });
    expect(f, 'a board where v2 healed a girl a charging heal was already on its way to').not.toBeNull();
    const t = top(f!.v3);
    expect(sameMove(t, f!.pending.command) && aim(t!) === aim(f!.pending.command)).toBe(false);
    // And v3 priced this board on the projection, where the charging heal lands first or the
    // enemy's next move is what it has to beat.
    expect(boardFor(f!.ctx.state, f!.ctx.decision.actorId, { ...f!.ctx.advisorOptions, v3: true }).projection).not.toBeNull();
  }, 600_000);

  it('a buff charging: the next card does not put the same status on the same girl', async () => {
    const statusKeys = (ctx: DecisionContext, actor: CombatantId, c: Command | null): string[] =>
      c ? (simulateFor(ctx.state, actor, c, ctx.advisorOptions)?.statusChanges ?? [])
        .filter((s) => s.applied && ctx.state.combatants[s.targetId]?.side !== 'enemy')
        .map((s) => `${s.targetId}:${s.status}`) : [];
    const f = await find('buff', (ctx, p) => statusKeys(ctx, p.actorId, p.command).length > 0);
    expect(f, 'a board with a buff still in flight').not.toBeNull();
    const pending = new Set(statusKeys(f!.ctx, f!.pending.actorId, f!.pending.command));
    expect(statusKeys(f!.ctx, f!.ctx.decision.actorId, top(f!.v3)).filter((k) => pending.has(k))).toEqual([]);
  }, 600_000);
});
