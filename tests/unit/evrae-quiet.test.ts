/**
 * Chapter 8's quiet turn (`src/engine/tactics/evrae-quiet.ts`) — the line's
 * harmless turn used to end in Defend, which FFX's command window has no row
 * for, so the move advisor dropped the line and carded its best simulated row
 * (`docs/plans/chapter-evrae-finish.md` item a).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the airship fight and its
 * bench have no FFX-2 counterpart (`research/ffx-evrae-airship.md` §0.4).
 */

import { describe, expect, it } from 'vitest';
import type { AnyCombatant, AvailableCommand, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { evrae } from '../../src/engine/tactics/evrae.ts';
import { benchReach, harmlessTurn } from '../../src/engine/tactics/evrae-quiet.ts';
import { pressable } from '../../src/engine/tactics/advisor-menu.ts';

function member(id: string, hp: number, maxHp: number, statuses: Record<string, unknown> = {}): AnyCombatant {
  return { id, hp, alive: hp > 0, stats: { maxHp }, statuses } as unknown as AnyCombatant;
}

function rowOf(label: string, command: Command, validTargets: string[] = []): AvailableCommand {
  return { label, command, category: 'item', mpCost: 0, enabled: true, validTargets } as unknown as AvailableCommand;
}

const PARTY = ['tidus', 'wakka', 'rikku'];
const MENU: AvailableCommand[] = [
  rowOf('Cheer', { kind: 'ability', abilityId: 'cheer', targets: [] } as unknown as Command, PARTY),
  rowOf('Al Bhed Potion', { kind: 'item', itemId: 'al-bhed-potion', targets: [] } as unknown as Command, PARTY),
  rowOf('Potion', { kind: 'item', itemId: 'potion', targets: [] } as unknown as Command, PARTY),
  rowOf('Defend', { kind: 'defend', targets: [] } as unknown as Command),
  rowOf('Kimahri', { kind: 'switch', targets: [] } as unknown as Command),
];
const CAPPED = { cheer: { stacks: 5 } };

describe('Evrae quiet turn — a row FFX actually paints', () => {
  it('stacks Cheer while anybody on the field is short of five', () => {
    const living = [member('tidus', 1265, 1265, CAPPED), member('lulu', 700, 700)];
    expect(harmlessTurn(MENU, living)?.kind).toBe('ability');
  });

  it('with the buffs capped, tops up the one worn member with a single potion', () => {
    const living = [member('tidus', 1265, 1265, CAPPED), member('wakka', 900, 1430, CAPPED), member('rikku', 880, 880, CAPPED)];
    const cmd = harmlessTurn(MENU, living);
    expect(cmd?.kind).toBe('item');
    expect((cmd as { itemId?: string }).itemId).toBe('potion');
    expect(cmd?.targets).toEqual(['wakka']);
  });

  it('spends the Al Bhed Potion on Poison (§6.4)', () => {
    const living = [member('tidus', 1265, 1265, { ...CAPPED, poison: {} }), member('wakka', 1430, 1430, CAPPED)];
    expect((harmlessTurn(MENU, living) as { itemId?: string }).itemId).toBe('al-bhed-potion');
  });

  it('with the party full and capped, spends a spare Potion on the most fragile member, never Defend (e2e F1)', () => {
    const living = [member('tidus', 1265, 1265, { ...CAPPED, haste: {} }), member('wakka', 1430, 1430, { ...CAPPED, haste: {} })];
    const cmd = harmlessTurn(MENU, living);
    expect((cmd as { itemId?: string }).itemId).toBe('potion');
    expect(cmd?.targets).toEqual(['tidus']);
  });

  it('falls back to Defend only when the menu has no item left at all', () => {
    const living = [member('tidus', 1265, 1265, { ...CAPPED, haste: {} }), member('wakka', 1430, 1430, { ...CAPPED, haste: {} })];
    const bare = MENU.filter((r) => r.command.kind !== 'item');
    expect(harmlessTurn(bare, living)?.kind).toBe('defend');
  });

  it('hands a reachless turn to Kimahri only while an order owner stays and Reflect is up for Rikku', () => {
    const boss = member('evrae', 20_000, 32_000);
    const reflected = member('evrae', 20_000, 32_000, { reflect: {} });
    const party = [member('tidus', 1265, 1265), member('wakka', 1430, 1430), member('rikku', 880, 880)];
    expect(benchReach(MENU, party, 'tidus', boss)?.kind).toBe('switch');
    expect(benchReach(MENU, party, 'rikku', boss)).toBeNull();
    expect(benchReach(MENU, party, 'rikku', reflected)?.kind).toBe('switch');
    expect(benchReach(MENU, party, 'wakka', reflected)).toBeNull();
    const lastOwner = [member('tidus', 1265, 1265), member('wakka', 1430, 1430), member('kimahri', 1250, 1250)];
    expect(benchReach(MENU, lastOwner, 'tidus', reflected)).toBeNull();
  });
});

describe('Evrae quiet turn — run on the engine', () => {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));

  it('the line picks a pressable row on almost every turn, and never names Evrae on a charged FAR phase-2 turn', () => {
    const chapter = CHAPTERS.find((c) => c.id === 'evrae-airship')!;
    let decisions = 0;
    let unpressable = 0;
    let bait = 0;
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
        const cmd = evrae(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] };
        const st = engine.state();
        decisions += 1;
        if (!pressable(st, cmd)) unpressable += 1;
        const trap = st.flags['airship.breathCharged'] === true && st.flags['airship.range'] === 'far' && st.flags['airship.phase'] === 2;
        if (trap && (cmd.targets as readonly string[]).includes('evrae')) bait += 1;
        engine.submit(cmd);
      }
    }
    // Measured 2026-09-23 over these 40 seeds: 788 Defend turns before this
    // module, 45 after (the last order owner with the buffs capped and the
    // party full, and Kimahri on a charged FAR turn). The ceiling leaves room
    // for RNG drift without letting the old fallback back in.
    expect(unpressable).toBeLessThanOrEqual(90);
    expect(unpressable / decisions).toBeLessThan(0.05);
    expect(bait).toBe(0);
  }, 120_000);
});
