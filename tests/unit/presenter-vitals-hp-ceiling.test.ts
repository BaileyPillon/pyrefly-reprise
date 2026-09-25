/**
 * **A party row never shows HP above its maximum** (critic round 11, PR-0156).
 *
 * The deep review read `Tidus 1632 /1265` on the Chapter VIII HUD
 * (`critic/rounds/round-11/evidence/evrae-airship-win/23-midfight.png`) while
 * the engine held him at 1265: Phoenix Down revives him at 632, then Rikku's
 * Al Bhed Potion restores 1000. The engine clamps (`battle/ffx/hp.ts`
 * `applyHpDelta`), but its `damage` event deliberately carries the blow, not
 * the shortfall (-1000, not -633), and the presenter's mid-burst projection
 * (`BattlePresenterVitals.ts`) floored HP at 0 with no ceiling, so the row
 * drew 632 + 1000 until the next burst re-seeded it.
 *
 * Case 1 replays that exact opening through the real engine, the real
 * `BattlePresenter` and a recording `HudPort`: Chapter VIII, seed 1, the four
 * party commands the evidence log recorded. Case 2 runs the shared projection
 * on a real state from each game. **Game case: both** — the projection is
 * shared playback plumbing (AGENTS.md rule 14, CHK-020); the defect was seen in
 * FFX and the same arithmetic ran for FFX-2.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState, Command, CombatantId } from '../../src/battle/common/types.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { applyEventToVitals, captureVitals, projectState } from '../../src/engine/BattlePresenterVitals.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import * as ffx2data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

function evraeEngine() {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const chapter = getChapter('evrae-airship');
  if (!chapter) throw new Error('no evrae-airship chapter');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: chapter.buildRef,
    enemies: chapter.enemyGroupRef,
    triggers: [],
    seed: 1,
    condition: 'normal',
    canEscape: false,
  } as never);
  return engine;
}

function ffx2State(): BattleState {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(ffx2data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2data.GARMENT_GRIDS)),
    minigames: false,
  });
  const group = ffx2data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('no ffx2-bahamut group');
  engine.setSeed(1);
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed: 1, condition: 'normal', canEscape: false });
  return engine.state();
}

/** The opening the round-11 evidence log recorded (seq 1-28): attack, attack, Phoenix Down, Al Bhed Potion. */
const OPENING: Array<{ actorId: CombatantId; command: Command }> = [
  { actorId: 'tidus', command: { kind: 'attack', targets: ['evrae'] } },
  { actorId: 'rikku', command: { kind: 'attack', targets: ['evrae'] } },
  { actorId: 'wakka', command: { kind: 'item', id: 'phoenix-down', targets: ['tidus'] } },
  { actorId: 'rikku', command: { kind: 'item', id: 'al-bhed-potion', targets: ['tidus', 'wakka', 'rikku'] } },
];

describe('PR-0156: the party row never reads HP above maximum', () => {
  it('Chapter VIII seed 1, revive then Al Bhed Potion: no row over its maximum, through the real presenter', async () => {
    const engine = evraeEngine();
    const drawn: string[] = [];
    let peakTidus = 0;
    const record = (s: BattleState): void => {
      for (const c of Object.values(s.combatants)) {
        if (!c) continue;
        if (c.id === 'tidus') peakTidus = Math.max(peakTidus, c.hp);
        if (c.hp > c.stats.maxHp) drawn.push(`${c.id} ${c.hp}/${c.stats.maxHp}`);
      }
    };
    const events: BattleEvent[] = [];
    const hud = {
      mount() {},
      unmount() {},
      setVisible() {},
      setProjector() {},
      onEvent: (e: BattleEvent) => events.push(e),
      sync: record,
      syncVitals: record,
      chooseCommand: () => Promise.reject(new Error('auto-played')),
      openMinigame: () => Promise.reject(new Error('auto-resolved')),
    } as unknown as HudPort;
    const state = engine.state();
    let presenter: BattlePresenter | null = null;
    let step = 0;
    presenter = new BattlePresenter({
      stage: new FakeStage([...state.activeIds], [...state.enemyIds]),
      hud,
      damageNumbers: new FakeDamageNumbers(),
      messageBar: new FakeMessageBar(),
      audio: new FakeAudio(),
      cutscenes: new FakeCutscenes(),
      sleep: () => Promise.resolve(),
    });
    presenter.setAutoPlay((actorId, commands) => {
      const next = OPENING[step];
      if (!next) {
        presenter?.abort();
        return commands[0]!.command;
      }
      step += 1;
      expect(actorId).toBe(next.actorId); // the seed still reproduces the evidence
      return next.command;
    });
    await presenter.run(engine as never);

    // The case really happened: Tidus was revived at 632 and then over-healed by 1000.
    expect(events.some((e) => e.type === 'revive' && e.targetId === 'tidus' && e.hp === 632)).toBe(true);
    expect(events.some((e) => e.type === 'damage' && e.targetId === 'tidus' && e.amount === -1000)).toBe(true);
    expect(drawn).toEqual([]);
    expect(peakTidus).toBe(engine.state().combatants['tidus']!.stats.maxHp);
  });

  it.each([
    ['FFX', () => evraeEngine().state()],
    ['FFX-2', ffx2State],
  ] as const)('%s: KO, revive, over-max heal and over-max MP restore stay at the ceiling', (_game, makeState) => {
    const state = makeState();
    const id = state.activeIds[0]!;
    const c = state.combatants[id]!;
    const vitals = captureVitals(state);
    applyEventToVitals(vitals, { type: 'ko', targetId: id, seq: 1 } as BattleEvent);
    applyEventToVitals(vitals, { type: 'revive', targetId: id, hp: Math.floor(c.stats.maxHp / 2), cause: 'phoenix-down', seq: 2 } as BattleEvent);
    applyEventToVitals(vitals, {
      type: 'damage', targetId: id, amount: -c.stats.maxHp, element: 'none', crit: false, hitIndex: 0, hitCount: 1, seq: 3,
    } as BattleEvent);
    applyEventToVitals(vitals, { type: 'heal', targetId: id, amount: 99_999, cause: 'regen', seq: 4 } as BattleEvent);
    applyEventToVitals(vitals, { type: 'mp-heal', targetId: id, amount: 9_999, seq: 5 } as BattleEvent);
    const shown = projectState(state, vitals).combatants[id]!;
    expect(shown.hp).toBe(c.stats.maxHp);
    expect(shown.mp).toBe(c.stats.maxMp);
    expect(shown.alive).toBe(true);
  });
});
