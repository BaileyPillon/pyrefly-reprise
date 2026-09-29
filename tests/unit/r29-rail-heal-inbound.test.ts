// @vitest-environment jsdom
/**
 * PR-0239 (critic round 15). **FFX-2 only** [AGENTS.md rule 14]: only FFX-2's ATB opens a girl's menu
 * while another girl's command charges or is held [research/ffx2-combat-core.md 1.1, 1.7]; FFX's CTB
 * has nothing in flight.
 *
 * While a party heal charges, the strategy rail's NEXT read the board as it stands and named a Cura
 * for HP the charging Mega-Potion was about to give, while the card (which ranks on the projected
 * board) said something else. The rail now defers (no NEXT), the way it already does for the same
 * move. The board is found by running the engine (rule 3): the first Fallen Aeons decision, seed 2,
 * where the chapter's line is a heal; the in-flight Mega-Potion is handed in as a held command, the
 * same channel the FFX-2 HUD uses (`decision.held`).
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../src/engine/tactics/advisor.ts';
import type { QueuedCommand } from '../../src/engine/tactics/advisor-committed.ts';
import { buildGuideView, recommendedCommand } from '../../src/engine/tactics/guide.ts';
import { healInbound } from '../../src/engine/tactics/guide-inflight.ts';
import { chapterById, runChapter, type DecisionContext } from '../../critic/bench/advisor-v3/drive.ts';

class Stop extends Error {
  constructor(readonly value: unknown) {
    super('found');
  }
}
const idOf = (c: Command | null | undefined): string => (c && 'id' in c ? String((c as { id?: unknown }).id ?? '') : '');
const HEALS = new Set(['x2-white-mage-cura', 'x2-white-mage-cura-2', 'x2-x-potion', 'x2-mega-potion', 'x2-potion', 'x2-hi-potion']);

async function board(seed: number): Promise<{ ctx: DecisionContext; line: Command } | null> {
  try {
    await runChapter(chapterById('ffx2-fallen-aeons'), seed, (ctx) => {
      const d = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
      const line = recommendedCommand(ctx.state, d);
      if (line && HEALS.has(idOf(line))) throw new Stop({ ctx, line });
      clearAdvisorCache();
      return buildAdvisorView(ctx.state, d, { ...ctx.advisorOptions, v3: true })?.suggestions[0]?.command ?? null;
    });
  } catch (e) {
    if (e instanceof Stop) return e.value as { ctx: DecisionContext; line: Command };
    throw e;
  }
  return null;
}

describe('PR-0239: the rail defers while a heal is inbound (FFX-2 only)', () => {
  it('names no heal for HP a charging heal is about to give; nothing in flight leaves it alone', async () => {
    let found: { ctx: DecisionContext; line: Command } | null = null;
    for (const seed of [2, 3, 1, 4, 5]) {
      found = await board(seed);
      if (found) break;
    }
    expect(found, 'a Fallen Aeons board where the chapter line is a heal').not.toBeNull();
    const { ctx, line } = found!;
    const d = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
    const other = ctx.state.activeIds.find((id) => id !== d.actorId)!;
    const party = ctx.state.activeIds as string[];
    const megaPotion: Command = { kind: 'item', id: 'x2-mega-potion', targets: [party[0]!] } as never;
    const held: QueuedCommand[] = [{ actorId: other, command: megaPotion } as never];

    // Before: the rail names the heal (nothing in flight), and that is the bug's board.
    expect(idOf(buildGuideView(ctx.state, d)?.next?.command)).toBe(idOf(line));
    expect(healInbound(ctx.state, d.actorId, line, [])).toBe(false);
    // After: a party heal held or charging for another girl and the rail defers.
    expect(healInbound(ctx.state, d.actorId, line, held, true)).toBe(true);
    expect(buildGuideView(ctx.state, { ...d, held })?.next ?? null).toBeNull();
    // v3 off: the v2 panel is unchanged.
    expect(healInbound(ctx.state, d.actorId, line, held, false)).toBe(false);
  }, 600_000);

  it('never fires on FFX (CTB has nothing in flight)', () => {
    const state = { game: 'ffx', combatants: {}, activeIds: [] } as never;
    const cmd = { kind: 'attack', targets: [] } as unknown as Command;
    expect(healInbound(state, 'tidus', cmd, [], true)).toBe(false);
  });
});
