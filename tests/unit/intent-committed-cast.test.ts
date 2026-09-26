// @vitest-environment jsdom
/**
 * PR-0123 (round 13, stalled): at Chapter V link 5's first menu the intent
 * headline read "No action MOST LIKELY 83%" over an Odds table giving Attack
 * 83%, no action 17%, while the guide beside it said "WATCH Terror of
 * Zanarkand THIS TURN".
 *
 * Method check (AGENTS.md rule 15, third attempt): round 09's fix matched the
 * badge to its branch by label, and its test fed the panel a hand-built view
 * whose pass branch was spelt "No action" — the engine spells it "no action",
 * so the live panel still fell back to the top branch. And the move itself was
 * the wrong turn: Shuyin had already committed Terror of Zanarkand on the
 * FFX-2 purple charge bar (`atb.charging`), and the predictor dry-ran his
 * *next* decision instead. This file therefore drives the real chain to the
 * real menu and reads the panel the player reads, with no hand-built view.
 *
 * **Case: FFX-2 only** for the committed cast (FFX's CTB has no charge bar);
 * the badge's rolled-branch lookup is shared panel code, so **both** for that.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { BattleSetup, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { predictFFX2EnemyIntent } from '../../src/battle/ffx2/intent.ts';
import * as ffx2Data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';
import { setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView } from '../../src/engine/tactics/guide.ts';
import { EnemyIntentPanel, type IntentView } from '../../src/ui/common/EnemyIntent.ts';

function options() {
  return {
    abilities: abilityRegistryFrom(Object.values(ffx2Data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2Data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2Data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2Data.GARMENT_GRIDS)),
    minigames: false,
  };
}

function fallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  const target = row?.validTargets[0];
  if (!row) return { kind: 'defend', targets: [] };
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

/** The chain, seed 1, intended strategy, to link 5's (Shuyin's) first menu. */
function link5(): { engine: FFX2Engine; decision: Extract<Decision, { kind: 'player-input' }> } {
  const seed = 1;
  const engine = new FFX2Engine(options());
  const first = ffx2Data.ENEMY_GROUPS_BY_ID[VEGNAGUN_CHAIN_ORDER[0]!]!;
  let setup: BattleSetup = { game: 'ffx2', party: farplaneBuild, enemies: first, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  let group: EnemyGroupDef = first;
  let link = 0;
  for (let i = 0; i < 400_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      const nextId = group.nextGroupId;
      if (d.result.outcome !== 'victory' || !nextId) throw new Error(`chain stopped at link ${link + 1}`);
      const next = ffx2Data.ENEMY_GROUPS_BY_ID[nextId]!;
      setup = setupForNextLink(setup, next, engine.state(), seed + ++link);
      group = next;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (link === 4) return { engine, decision: d };
    engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d));
  }
  throw new Error('never reached link 5');
}

const live: EnemyIntentPanel[] = [];
afterEach(() => {
  while (live.length) live.pop()!.unmount();
  document.body.innerHTML = '';
});

/** The panel the player reads, fed straight from the engine's answer. */
function render(view: IntentView | null): HTMLElement {
  const overlay = document.createElement('div');
  document.body.appendChild(overlay);
  const panel = new EnemyIntentPanel({ game: 'ffx2', readVisible: () => true, writeVisible: () => undefined });
  panel.mount(overlay, { host: overlay, scale: () => 2.5, project: () => ({ x: 800, y: 400 }), avoid: () => [] });
  panel.setSource(() => view);
  live.push(panel);
  return overlay;
}

describe('PR-0123: Chapter V link 5, seed 1, first menu (FFX-2)', () => {
  it('names the move already on the charge bar, and the guide WATCH line agrees', () => {
    const { engine, decision } = link5();
    const shuyin = engine.state().combatants['shuyin'] as unknown as { atb: { charging: { commandRef: Command } | null } };
    expect(shuyin.atb.charging?.commandRef).toMatchObject({ id: 'terror-of-zanarkand' });

    const intent = engine.intent();
    expect(intent?.enemyId).toBe('shuyin');
    expect(intent?.moveName).toBe('Terror of Zanarkand');
    expect(intent?.confidence).toBe('scripted');
    expect(intent?.estimate?.perTarget.map((t) => t.targetId)).toContain('yuna');

    const guide = buildGuideView(engine.state(), { actorId: decision.actorId, commands: decision.commands }, 'wait');
    for (const w of guide?.watch ?? []) {
      if (w.timing === 'this turn') expect(w.payload).toBe(intent?.moveName);
    }

    const overlay = render(intent as unknown as IntentView);
    expect(overlay.querySelector('.eint__label')?.textContent).toBe('Terror of Zanarkand');
    expect(overlay.querySelector('.eint__conf')?.textContent).toBe('Scripted');
  });

  it("once the cast is off the bar, the headline's percent is the rolled move's own Odds row", () => {
    const { engine } = link5();
    // The same board with the committed cast taken away: the predictor now has
    // to roll Shuyin's next decision, which is the split round 13 photographed
    // (a flavour-line pass behind an Attack). Seed-1 stream position rolls the pass.
    const state = structuredClone(engine.state());
    (state.combatants['shuyin'] as unknown as { atb: { charging: unknown } }).atb.charging = null;
    const rng = new SeededRng(state.seed);
    rng.restoreState((engine as unknown as { rng: SeededRng }).rng?.saveState?.() ?? state.seed);
    const intent = predictFFX2EnemyIntent({ state, rng, abilities: options().abilities, items: options().items, snapshot: engine.gaugeSnapshot() }, 'shuyin');
    expect(intent?.confidence).toBe('likely');

    const overlay = render(intent as unknown as IntentView);
    const headline = overlay.querySelector('.eint__label')?.textContent ?? '';
    const badge = overlay.querySelector('.eint__conf')?.textContent ?? '';
    const pct = Number(/(\d+)%/.exec(badge)?.[1]);
    const odds = [...overlay.querySelectorAll('.eint__odds li')].map((li) => ({
      label: li.querySelector('span')?.textContent ?? '',
      pct: Number(/(\d+)%/.exec(li.querySelector('b')?.textContent ?? '')?.[1]),
    }));
    const own = odds.find((o) => o.label === headline);
    expect(own, `headline "${headline}" has no Odds row of its own in ${JSON.stringify(odds)}`).toBeDefined();
    expect(pct).toBe(own!.pct);
  });
});
