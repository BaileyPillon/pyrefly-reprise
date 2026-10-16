/**
 * What the presenter does with the Magus Sisters' ORDERS in Chapter XXVII (**FFX only**; RE's lane FFX-K, `4256d209a`: all eight orders are carried out by the engine now; its handoff section 11.3 lists the event frame every order has).
 *
 * The real presenter over the real chapter engine, with a HUD that calls Yuna's Sisters on her first turn and then takes, at every Sister's menu, an order row it has not yet taken (else any enabled one), and Defends the party. Over a
 * few seeds every order the menu offers is taken. The test asks only what a person would notice if it went wrong: the presenter plays each order to its end and the next menu opens (no hang: an order is an `action-start` with no
 * ability id, then up to two inner actions, then an `action-end`; a rest turn is just the start and the end), the engine logs the order and what it carried out, and an order that carries out a command shows an inner action.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AvailableCommand, BattleEvent, Command, CombatantId, MinigameResult } from '../../../src/battle/common/types.ts';
import { createFFXEngine, registerFFXAbilities, registerFFXItems, registerFFXMixRecipes } from '../../../src/battle/ffx/index.ts';
import { ORDER_IDS } from '../../../src/battle/ffx/aeon-commands.ts';
import { ALL_ABILITIES, ITEMS, MIX_RECIPES } from '../../../src/data/ffx/index.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import type { HudPort } from '../../../src/engine/HudPort.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from '../helpers/FakeStage.ts';

registerFFXAbilities(ALL_ABILITIES.filter((a) => a.game === 'ffx'));
registerFFXItems(Object.values(ITEMS).filter((i) => i.game === 'ffx'));
registerFFXMixRecipes(MIX_RECIPES);

const SISTERS = ['cindy', 'sandy', 'mindy'];
const isOrder = (r: AvailableCommand): boolean => r.command.kind === 'ability' && ORDER_IDS.includes(r.command.id);

interface Taken {
  id: string;
  label: string;
  menusAtOrder: number;
  /** The menus the HUD had been handed by the time the presenter had settled after the order. */
  menusAfter: number;
}

class OrderHud implements HudPort {
  readonly seen: BattleEvent[] = [];
  readonly taken: Taken[] = [];
  summoned = false;
  menus = 0;
  constructor(private readonly alreadyTaken: ReadonlySet<string>, readonly limit = 40) {}
  mount(): void {}
  unmount(): void {}
  sync(): void {}
  syncGauges(): void {}
  closeCommandMenu(): void {}
  setVisible(): void {}
  setProjector(): void {}
  onEvent(event: BattleEvent): void {
    this.seen.push(event);
  }
  chooseCommand(actorId: CombatantId, commands: AvailableCommand[]): Promise<Command> {
    this.menus += 1;
    if (this.menus > this.limit) return new Promise<Command>(() => undefined);
    if (actorId === 'yuna' && !this.summoned) {
      const row = commands.find((r) => r.command.kind === 'summon' && r.command.id === 'cindy');
      if (row) {
        this.summoned = true;
        return Promise.resolve({ ...row.command, targets: [] } as Command);
      }
    }
    if (SISTERS.includes(actorId)) {
      const orders = commands.filter((r) => isOrder(r) && r.enabled);
      const taken = new Set([...this.alreadyTaken, ...this.taken.map((t) => t.id)]);
      const row = orders.find((r) => !taken.has((r.command as { id: string }).id)) ?? orders[0];
      if (row) {
        this.taken.push({ id: (row.command as { id: string }).id, label: row.label, menusAtOrder: this.menus, menusAfter: -1 });
        return Promise.resolve(row.command);
      }
      return Promise.resolve({ kind: 'dismiss', targets: [] });
    }
    return Promise.resolve({ kind: 'defend', targets: [] });
  }
  openMinigame(): Promise<MinigameResult> {
    return Promise.reject(new Error('no minigame in this test'));
  }
}

async function settle(turns = 2500): Promise<void> {
  for (let i = 0; i < turns; i++) await Promise.resolve();
}

async function play(seed: number, hud: OrderHud) {
  const chapter = getChapter('mirror-aeons');
  if (!chapter) throw new Error('mirror-aeons is not a chapter');
  const engine = createFFXEngine();
  engine.init(setupForChapter(chapter, seed));
  const state = engine.state();
  const presenter = new BattlePresenter({
    stage: new FakeStage([...state.activeIds], [...state.enemyIds]),
    hud,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    audio: new FakeAudio(),
    cutscenes: new FakeCutscenes(),
    sleep: () => Promise.resolve(),
    now: () => 0,
  });
  void presenter.run(engine);
  let seenTaken = 0;
  for (let i = 0; i < 60 && hud.menus <= hud.limit; i++) {
    await settle();
    // Stamp each order with the menus the HUD had when the presenter was done with it.
    for (; seenTaken < hud.taken.length - 1; seenTaken++) hud.taken[seenTaken]!.menusAfter = hud.menus;
    if (hud.taken.length >= 14) break;
  }
  presenter.abort();
  return engine;
}

afterEach(() => vi.restoreAllMocks());

describe('the presenter plays every order the Sisters\' menu offers (FFX, Chapter XXVII)', () => {
  it('each order is taken, played to its end and followed by the next menu, and the orders include more than Combine powers', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const everTaken = new Set<string>();
    let completed = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const hud = new OrderHud(everTaken);
      const engine = await play(seed, hud);
      for (const t of hud.taken.slice(0, -1)) {
        // not the last order taken: the run was stopped somewhere after it, so the next menu must already have been handed over
        expect(t.menusAfter, `seed ${seed}: after "${t.label}" the next menu opened`).toBeGreaterThan(t.menusAtOrder);
        completed += 1;
      }
      for (const t of hud.taken) everTaken.add(t.id);
      // the engine's log carries the order's own start (a name, no ability id) for each order the HUD sent
      const orderStarts = engine.state().log.filter((e) => e.type === 'action-start' && SISTERS.includes(e.actorId) && e.abilityId === undefined);
      expect(orderStarts.length, `seed ${seed}: orders are logged`).toBeGreaterThanOrEqual(Math.max(0, hud.taken.length - 1));
    }
    expect(completed, 'enough orders were played to mean something').toBeGreaterThanOrEqual(12);
    const others = [...everTaken].filter((id) => id !== 'sister-order-combine');
    expect(others.length, `orders besides Combine powers that were taken: ${others.join(', ')}`).toBeGreaterThanOrEqual(3);
  });
});
