/**
 * The strategy guide's NEXT line labels a Switch by the member it brings in.
 *
 * `rowFor` matched a command to its menu row by kind and id only. A switch has
 * no id, so every switch took the first Switch row's label: on chapter 8 the
 * line's Kimahri hand-off (`evrae-quiet.ts` benchReach) read "NEXT RIKKU
 * Auron" while the advisor's card on the same frame said "Kimahri" (fix10c
 * verifier regression). Switch rows differ only in `extra.inId`, so that is
 * what the match now checks, as `advisor.ts` ownedRow already did.
 *
 * **Game case: both** [AGENTS.md rule 14] — `rowFor` is shared guide plumbing
 * (CHK-020); the engine run below is chapter 8, FFX's airship fight.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { buildGuideView, rowFor } from '../../src/engine/tactics/guide.ts';

function sw(label: string, inId: string): AvailableCommand {
  return {
    label, category: 'switch', mpCost: 0, enabled: true, validTargets: [],
    command: { kind: 'switch', targets: [], extra: { outId: 'rikku', inId } },
  } as unknown as AvailableCommand;
}

describe('guide rowFor — a switch row is the one for its incoming member', () => {
  const rows = [sw('Auron', 'auron'), sw('Kimahri', 'kimahri'), sw('Lulu', 'lulu')];

  it('matches on extra.inId', () => {
    const cmd = { kind: 'switch', targets: [], extra: { outId: 'rikku', inId: 'kimahri' } } as unknown as Command;
    expect(rowFor(rows, cmd)?.label).toBe('Kimahri');
  });

  it('a command without an incoming member still takes the first switch row', () => {
    const cmd = { kind: 'switch', targets: [] } as unknown as Command;
    expect(rowFor(rows, cmd)?.label).toBe('Auron');
  });
});

describe('guide rowFor — chapter 8 on the engine', () => {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));

  it('every Switch NEXT line names the member the line brings in (seeds 1-40)', () => {
    const chapter = CHAPTERS.find((c) => c.id === 'evrae-airship')!;
    let switches = 0;
    let wrong = 0;
    for (let seed = 1; seed <= 40; seed += 1) {
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.init({
        game: 'ffx', party: chapter.buildRef, enemies: ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id],
        triggers: [], seed, condition: 'normal', canEscape: false,
      } as never);
      for (let i = 0; i < 60_000; i += 1) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const next = buildGuideView(engine.state(), { actorId: d.actorId, commands: d.commands })?.next;
        if (next && next.command.kind === 'switch') {
          switches += 1;
          const inId = (next.command as { extra?: { inId?: string } }).extra?.inId;
          const name = inId ? engine.state().combatants[inId]?.name : undefined;
          if (next.label !== name) wrong += 1;
        }
        const cmd = next?.command ?? ({ kind: 'defend', targets: [] } as Command);
        if (engine.submit(cmd).length === 0) break;
      }
    }
    // Measured 2026-09-23: 120 Switch NEXT lines in 40 seeds; before this fix
    // 80 of them carried the Auron row's label.
    expect(switches).toBeGreaterThan(0);
    expect(wrong).toBe(0);
  }, 180_000);
});
