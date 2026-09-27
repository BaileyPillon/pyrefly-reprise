/**
 * **Hotfix 24, the presenter half**: an Overdrive picker that throws, or that
 * the player backs out of, hands Yuna's turn back to her menu. Before, both
 * re-submitted the command bare and the engine's default roll summoned
 * Valefor with nothing but a console warning
 * (`docs/plans/valefor-overdrive-bug-2026-09-27.md` S1).
 *
 * The real presenter over the real Chapter IX engine (seed 1), with a HUD that
 * picks Grand Summon once and then Defends (hard rule 3). **FFX only**: FFX-2's
 * engine has no back-out, and keeps its bare re-submit (the absence test in
 * `ffx-overdrive-pickers.test.ts`).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AvailableCommand, BattleEvent, Command, CombatantId, FFXCombatant, MinigameResult } from '../../src/battle/common/types.ts';
import {
  createFFXEngine,
  registerFFXAbilities,
  registerFFXItems,
  registerFFXMixRecipes,
} from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS, MIX_RECIPES } from '../../src/data/ffx/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

registerFFXAbilities(ALL_ABILITIES.filter((a) => a.game === 'ffx'));
registerFFXItems(Object.values(ITEMS).filter((i) => i.game === 'ffx'));
registerFFXMixRecipes(MIX_RECIPES);

/** Yuna picks Grand Summon on her first menu and Defends after; everyone else Defends. */
class GrandSummonHud implements HudPort {
  readonly yunaMenus: number[] = [];
  readonly seen: BattleEvent[] = [];
  menus = 0;
  constructor(private readonly overlay: () => Promise<MinigameResult>) {}
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
    if (this.menus > 40) return new Promise<Command>(() => undefined); // enough; the test reads the log
    if (actorId === 'yuna') {
      this.yunaMenus.push(this.menus);
      const row = commands.find((r) => r.command.kind === 'overdrive' && r.command.id === 'grand-summon');
      if (this.yunaMenus.length === 1 && row?.enabled) return Promise.resolve({ ...row.command, targets: ['yuna'] } as Command);
    }
    return Promise.resolve({ kind: 'defend', targets: [] });
  }
  openMinigame(): Promise<MinigameResult> {
    return this.overlay();
  }
}

async function settle(turns = 3000): Promise<void> {
  for (let i = 0; i < turns; i++) await Promise.resolve();
}

async function runChapterIX(hud: GrandSummonHud) {
  const chapter = getChapter('yojimbo-cavern');
  if (!chapter) throw new Error('yojimbo-cavern is not a chapter');
  const engine = createFFXEngine();
  engine.init(setupForChapter(chapter, 1));
  const yuna = engine.state().combatants['yuna'] as FFXCombatant;
  if (!yuna.overdrive) throw new Error('Yuna has no gauge');
  yuna.overdrive.gauge = 100; // setup only
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
  for (let i = 0; i < 20 && hud.yunaMenus.length < 2 && hud.menus <= 40; i++) await settle();
  presenter.abort();
  return { engine, yuna };
}

afterEach(() => vi.restoreAllMocks());

describe('a picker that does not answer hands the turn back to the menu (FFX, Chapter IX)', () => {
  it('a thrown overlay: an error on the console, Yuna asked again, no aeon, her gauge kept', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const hud = new GrandSummonHud(() => Promise.reject(new TypeError("Cannot read properties of undefined (reading 'replace')")));
    const { engine } = await runChapterIX(hud);

    expect(error.mock.calls.some((c) => String(c[0]).includes('yuna-grand-summon'))).toBe(true);
    expect(hud.yunaMenus.length).toBeGreaterThanOrEqual(2);
    expect(hud.yunaMenus[1]).toBe((hud.yunaMenus[0] ?? 0) + 1); // straight back to her own menu
    expect(engine.state().log.some((e) => e.type === 'summon')).toBe(false);
    expect(hud.seen.filter((e) => e.type === 'minigame-request')).toHaveLength(1);
  });

  it('the player backing out: no error, Yuna asked again, no aeon', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cancelled = Object.assign(new Error('yuna-grand-summon: the player backed out of the picker'), { name: 'MinigameCancelled' });
    const hud = new GrandSummonHud(() => Promise.reject(cancelled));
    const { engine } = await runChapterIX(hud);

    expect(error).not.toHaveBeenCalled();
    expect(hud.yunaMenus[1]).toBe((hud.yunaMenus[0] ?? 0) + 1);
    expect(engine.state().log.some((e) => e.type === 'summon')).toBe(false);
  });

  it('an answer summons the aeon the player chose', async () => {
    const hud = new GrandSummonHud(() => Promise.resolve({ kind: 'yuna-grand-summon', grandSummon: { aeonId: 'ixion' } }));
    const { engine } = await runChapterIX(hud);
    const summon = engine.state().log.find((e) => e.type === 'summon');
    expect(summon && 'aeonId' in summon ? summon.aeonId : null).toBe('ixion');
  });
});
