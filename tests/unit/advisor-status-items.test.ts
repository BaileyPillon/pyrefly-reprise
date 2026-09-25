/**
 * Chapter VII fix pass, item (5): the move advisor on turn 1 of **Seymour and
 * Anima, Macalania Temple**, from the end-to-end run on commit 06338dbc.
 *
 * Two faults on one card:
 *
 * 1. **"4000 damage" for an item that deals none.** Petrify Grenade shatters
 *    both Guado Guardians (the engine's petrified-monster rule), which removes
 *    their 4,000 HP without a single `damage` event. The card printed a 4,000
 *    chip and "It puts Petrify on 2 of them, and 4000 damage". It now prints
 *    no damage figure and says what happened: "…, and 2 of them shatter".
 *    Whether they shatter is the engine's (and an open question with Bailey);
 *    this only makes the words true to it.
 * 2. **The card and the strategy panel disagreed on the first move.** The
 *    chapter's line (research §7 row 1: Steal from each Guardian) was dropped
 *    as a turn that "changes nothing", because a landed Steal changes only the
 *    inventory and the target's steal flags, which no `SimOutcome` carries. The
 *    no-op guard now reads the engine's own success line, so the card tops
 *    with Steal exactly as the guide's NEXT line does.
 *
 * Game case: the chapter is **FFX only**; the damage wording and the theft
 * rule are shared advisor plumbing, **both** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { macalaniaBuild } from '../../src/data/ffx/builds/macalania.ts';
import { simulateFFXCommand } from '../../src/battle/ffx/simulate.ts';
import { buildGuideView } from '../../src/engine/tactics/guide.ts';
import { buildAdvisorView } from '../../src/engine/tactics/advisor.ts';
import { dealtToEnemies } from '../../src/engine/tactics/advisor-eval.ts';
import { changesNothing } from '../../src/engine/tactics/advisor-guard.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

function firstDecision(seed: number) {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: macalaniaBuild,
    enemies: ENEMY_GROUPS_BY_ID['seymour-anima-macalania']!,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  for (let i = 0; i < 50; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'player-input') return { engine, d };
  }
  throw new Error('no player decision');
}

const shape = (c: Command): string => `${c.kind}:${'id' in c ? String(c.id) : ''}:${[...c.targets].join(',')}`;
const aimed = (row: AvailableCommand): Command => ({ ...row.command, targets: [row.validTargets[0]!] }) as Command;

describe('Macalania turn 1: the card and the strategy panel name the same move', () => {
  it('on every seed 1-10 the advisor tops with the guide\'s NEXT line (Steal)', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { engine, d } = firstDecision(seed);
      const state = engine.state();
      const next = buildGuideView(state, d)?.next;
      const top = buildAdvisorView(state, d, { ffxContent: content })?.suggestions[0];
      expect(next, `seed ${seed}`).toBeTruthy();
      expect(top, `seed ${seed}`).toBeTruthy();
      expect(shape(top!.command), `seed ${seed}`).toBe(shape(next!.command));
      if (d.actorId === 'rikku') expect(top!.label).toBe('Steal');
    }
  });
});

describe('a status item that shatters is not called damage', () => {
  it('Petrify Grenade: no damage figure, and the sentence says they shatter', () => {
    const { engine, d } = firstDecision(1);
    expect(d.actorId).toBe('rikku');
    const only = d.commands.filter((c) => c.label === 'Petrify Grenade');
    expect(only).toHaveLength(1);
    const card = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: only }, { ffxContent: content });
    const top = card!.suggestions[0]!;
    expect(top.label).toBe('Petrify Grenade');
    expect(top.estimate?.kind === 'damage' ? top.estimate.mid : 0).toBe(0);
    expect(top.reason).not.toMatch(/damage/i);
    expect(top.reason).toMatch(/shatter/);
  });

  it('dealtToEnemies: 0 for the shatter, the whole HP loss for a plain attack', () => {
    const { engine, d } = firstDecision(1);
    const state = engine.state();
    const grenade = d.commands.find((c) => c.label === 'Petrify Grenade')!;
    const shattered = simulateFFXCommand(state, d.actorId, aimed(grenade), { content })!;
    expect(shattered.damageToEnemies).toBe(4000); // HP removed, for ranking
    expect(dealtToEnemies(state, shattered)).toBe(0); // none of it dealt as damage

    const attack = d.commands.find((c) => c.command.kind === 'attack' && c.enabled)!;
    const swing = simulateFFXCommand(state, d.actorId, aimed(attack), { content })!;
    expect(dealtToEnemies(state, swing)).toBe(swing.damageToEnemies);
  });
});

describe('the no-op guard: a landed theft does something', () => {
  it('a successful Steal is not "changes nothing"; a failed one still is', () => {
    const { engine, d } = firstDecision(1);
    const steal = d.commands.find((c) => c.label === 'Steal')!;
    const cmd = aimed(steal);
    const landed = simulateFFXCommand(engine.state(), d.actorId, cmd, { content })!;
    expect(landed.events.some((e) => e.type === 'message' && /^Stole /.test(e.text))).toBe(true);
    expect(changesNothing(d.actorId, cmd, landed)).toBe(false);

    const failed = { ...landed, events: [{ seq: 0, type: 'message', text: 'Nothing was stolen!', kind: 'system' }] } as typeof landed;
    expect(changesNothing(d.actorId, cmd, failed)).toBe(true);
    const empty = { ...landed, events: [{ seq: 0, type: 'message', text: 'Nothing to steal from Seymour', kind: 'system' }] } as typeof landed;
    expect(changesNothing(d.actorId, cmd, empty)).toBe(true);
  });
});
