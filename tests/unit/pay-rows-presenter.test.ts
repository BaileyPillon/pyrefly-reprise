/**
 * The Pay ladder, the presenter half (`src/engine/PayRows.ts` and its one call in `BattlePresenter.chooseCommand`; **FFX only**: Mirror Aeons, Chapter XXVII).
 *
 * The real presenter over the real Chapter XXVII engine (seed 2), with a HUD that sends Yuna's first turn to Summon Yojimbo, pays him from the ladder it was shown on his own menu, and Defends everyone else
 * (hard rule 3: the rows are read from what the HUD was handed, not from the source). A person's menu is handed the ladder; the engine's own rows are what the auto strategy still sees.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AbilityCommand, AvailableCommand, BattleEvent, Command, CombatantId, MinigameResult } from '../../src/battle/common/types.ts';
import { createFFXEngine, registerFFXAbilities, registerFFXItems, registerFFXMixRecipes } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS, MIX_RECIPES } from '../../src/data/ffx/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

registerFFXAbilities(ALL_ABILITIES.filter((a) => a.game === 'ffx'));
registerFFXItems(Object.values(ITEMS).filter((i) => i.game === 'ffx'));
registerFFXMixRecipes(MIX_RECIPES);

const isPay = (r: AvailableCommand): boolean => r.command.kind === 'ability' && r.command.id === 'yojimbo-pay';

/** Yuna calls Yojimbo on her first turn; on his turn the HUD records the rows it was handed and pays from the ladder; everyone else Defends. */
class PayHud implements HudPort {
  readonly seen: BattleEvent[] = [];
  yojimboMenus: AvailableCommand[][] = [];
  summoned = false;
  paid: Command | null = null;
  menus = 0;
  constructor(private readonly choose: (rows: AvailableCommand[]) => AvailableCommand | undefined) {}
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
    if (this.menus > 60) return new Promise<Command>(() => undefined);
    if (actorId === 'yuna' && !this.summoned) {
      const row = commands.find((r) => r.command.kind === 'summon' && r.command.id === 'yojimbo');
      if (row) {
        this.summoned = true;
        return Promise.resolve({ ...row.command, targets: [] } as Command);
      }
    }
    if (actorId === 'yojimbo') {
      this.yojimboMenus.push(commands);
      const row = this.paid === null ? this.choose(commands) : undefined;
      if (row) {
        this.paid = row.command;
        return Promise.resolve(row.command);
      }
    }
    return Promise.resolve({ kind: 'defend', targets: [] });
  }
  openMinigame(): Promise<MinigameResult> {
    return Promise.reject(new Error('no minigame in this test'));
  }
}

async function settle(turns = 3000): Promise<void> {
  for (let i = 0; i < turns; i++) await Promise.resolve();
}

async function run(hud: PayHud) {
  const chapter = getChapter('mirror-aeons');
  if (!chapter) throw new Error('mirror-aeons is not a chapter');
  const engine = createFFXEngine();
  engine.init(setupForChapter(chapter, 2));
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
  for (let i = 0; i < 40 && hud.paid === null && hud.menus <= 60; i++) await settle();
  for (let i = 0; i < 4; i++) await settle(); // the Pay is carried out
  presenter.abort();
  return engine;
}

afterEach(() => vi.restoreAllMocks());

describe('the presenter hands a person the ladder of Pay rows (FFX, Chapter XXVII)', () => {
  it("Yojimbo's menu reaches the HUD as the amounts the party can pay and Dismiss; paying 100,000 from it spends exactly 100,000", async () => {
    const hud = new PayHud((rows) => rows.find((r) => r.label === 'Pay 100,000'));
    const engine = await run(hud);
    expect(hud.yojimboMenus.length).toBeGreaterThanOrEqual(1);
    const first = hud.yojimboMenus[0]!;
    const gil = 1_500_000; // the chapter's build (`ENDGAME_GIL`)
    expect(first.filter(isPay).map((r) => r.label)).toEqual(['Pay 1,000', 'Pay 10,000', 'Pay 100,000', 'Pay 1,000,000', 'Pay all']);
    expect(first.filter(isPay).map((r) => (r.command as AbilityCommand).gilSpent)).toEqual([1_000, 10_000, 100_000, 1_000_000, gil]);
    expect(first.at(-1)?.label).toBe('Dismiss');
    expect(hud.paid).toMatchObject({ kind: 'ability', id: 'yojimbo-pay', gilSpent: 100_000 });
    expect(engine.state().flags['yojimbo:gil']).toBe(gil - 100_000);
    const pays = engine.state().log.filter((e) => e.type === 'action-start' && (e as { abilityName?: string }).abilityName === 'Pay');
    expect(pays.length).toBeGreaterThanOrEqual(1);
  });

  it('paying everything takes the whole purse', async () => {
    const hud = new PayHud((rows) => rows.find((r) => /^Pay all/.test(r.label)));
    const engine = await run(hud);
    expect(hud.paid).toMatchObject({ gilSpent: 1_500_000 });
    expect(engine.state().flags['yojimbo:gil']).toBe(0);
  });
});
