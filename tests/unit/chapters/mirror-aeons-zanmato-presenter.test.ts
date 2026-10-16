/**
 * A landed Zanmato of Yuna's Yojimbo ends a Dark Aeon fight, and the presenter plays it in the order the engine logs it (**FFX only**; RE's lane FFX-K, `afda2d451`; the release driver's note, 2026-10-16: the real log is
 * ko, ko, ko, action-end, victory: `victory` comes AFTER the Zanmato's `action-end`, and in Act I the seam's `script-trigger` comes between them).
 *
 * The real presenter over the real chapter engine (the chapter's own triggers and mid-battle scripts), with the party's gil and Yojimbo's compatibility set so a Pay of ALL the gil buys a certain Zanmato (2^22 gil, compatibility 0,
 * hire answer 1, and the Dark Aeons' Zanmato byte cleared on the combatants: against the game's own byte 4 the chapter's hire answer 2 (an ESTIMATE) rolls one 11 times in 64 for a Pay of 100,000 and 16 for 1,000,000, RE's review of 2026-10-16; the 3 in 64 of RE's lane handoff section 10.4 is the table for hire answer 1). A HUD calls Yojimbo, pays from the ladder it is handed ("Pay all"),
 * and Defends everyone else. What is asserted is what the player sees: every foe of the group falls (one `ko` each, no `damage`), the action ends, THEN (Act I) the seam's beat plays, THEN the victory; the presenter returns a victory.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AvailableCommand, BattleEvent, Command, CombatantId, EnemyGroupDef, FFXPartyBuild, MinigameResult } from '../../../src/battle/common/types.ts';
import { createFFXEngine, registerFFXAbilities, registerFFXItems, registerFFXMixRecipes } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS, MIX_RECIPES } from '../../../src/data/ffx/index.ts';
import { MIRROR_ACT_I, MIRROR_ACT_II, sistersGroupId, yojimboGroupId } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import type { HudPort } from '../../../src/engine/HudPort.ts';
import { mirrorAeonsScripts } from '../../../src/story/scripts/mirror-aeons.ts';
import { FakeAudio, FakeDamageNumbers, FakeMessageBar, FakeStage } from '../helpers/FakeStage.ts';

registerFFXAbilities(ALL_ABILITIES.filter((a) => a.game === 'ffx'));
registerFFXItems(Object.values(ITEMS).filter((i) => i.game === 'ffx'));
registerFFXMixRecipes(MIX_RECIPES);

const GIL = 4_194_304; // 2^22: the gil's four points a doubling from 8 gil make a motivation of exactly 80 at compatibility 0

class PayAllHud implements HudPort {
  /** Every event the HUD was handed, in order, with the seam's beat marked where it played. */
  readonly order: string[] = [];
  readonly seen: BattleEvent[] = [];
  summoned = false;
  paid = false;
  menus = 0;
  mount(): void {}
  unmount(): void {}
  sync(): void {}
  syncGauges(): void {}
  closeCommandMenu(): void {}
  setVisible(): void {}
  setProjector(): void {}
  onEvent(event: BattleEvent): void {
    this.seen.push(event);
    this.order.push(event.type);
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
    if (actorId === 'yojimbo' && !this.paid) {
      const row = commands.find((r) => r.label === 'Pay all');
      if (row) {
        this.paid = true;
        return Promise.resolve(row.command);
      }
    }
    return Promise.resolve({ kind: 'defend', targets: [] });
  }
  openMinigame(): Promise<MinigameResult> {
    return Promise.reject(new Error('no minigame in this test'));
  }
}

async function playAct(group: EnemyGroupDef, seed: number) {
  const chapter = getChapter('mirror-aeons');
  if (!chapter) throw new Error('mirror-aeons is not a chapter');
  const base = setupForChapter(chapter, seed);
  const party = structuredClone(base.party) as FFXPartyBuild;
  party.gil = GIL;
  party.yojimbo = { compatibility: 0, hireAnswer: 1 };
  const engine = createFFXEngine();
  engine.init({ ...base, party, enemies: group });
  for (const id of engine.state().enemyIds) {
    const c = engine.state().combatants[id] as { enemy?: { zanmatoLevel?: number } };
    if (c.enemy) c.enemy = { ...c.enemy, zanmatoLevel: undefined }; // byte 0 on the combatant only: the shared record is not touched
  }
  const hud = new PayAllHud();
  const cutscenes = {
    played: [] as string[],
    async play(_script: unknown, opts?: { name?: string }): Promise<void> {
      cutscenes.played.push(opts?.name ?? '?');
      hud.order.push(`SEAM:${opts?.name ?? '?'}`);
    },
  };
  const state = engine.state();
  const presenter = new BattlePresenter({
    stage: new FakeStage([...state.activeIds], [...state.enemyIds]),
    hud,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    audio: new FakeAudio(),
    cutscenes,
    midScripts: mirrorAeonsScripts.midScripts ?? {},
    sleep: () => Promise.resolve(),
    now: () => 0,
  });
  const outcome = await presenter.run(engine);
  return { outcome, hud, cutscenes, engine };
}

/** The events from the Zanmato's own start to the end of the battle. */
const fromZanmato = (order: readonly string[], seen: readonly BattleEvent[]): string[] => {
  const at = seen.findIndex((e) => e.type === 'action-start' && (e as { abilityName?: string }).abilityName === 'Zanmato');
  if (at < 0) return [];
  // `order` holds the same events plus the seam marker; find the same start in it by counting the starts up to it
  const nth = seen.slice(0, at + 1).filter((e) => e.type === 'action-start').length;
  let seenStarts = 0;
  let from = -1;
  for (let i = 0; i < order.length; i++) {
    if (order[i] === 'action-start' && ++seenStarts === nth) {
      from = i;
      break;
    }
  }
  return from < 0 ? [] : order.slice(from);
};

afterEach(() => vi.restoreAllMocks());

describe("a landed Zanmato of Yuna's Yojimbo ends each act, and the presenter plays it in the engine's order", () => {
  it('Act I (the pair): both sisters fall in one action with no damage, the action ends, the seam plays, then the victory', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const group = ENEMY_GROUPS_BY_ID[sistersGroupId(MIRROR_ACT_I)]!;
    const { outcome, hud, cutscenes } = await playAct(group, 5);
    expect(outcome.kind).toBe('victory');
    expect(hud.paid, 'Yojimbo was paid from the ladder (Pay all)').toBe(true);
    const tail = fromZanmato(hud.order, hud.seen);
    expect(tail, 'the Zanmato was reached').not.toEqual([]);
    expect(tail).toEqual(['action-start', 'ko', 'ko', 'action-end', 'script-trigger', 'SEAM:sisters-fall', 'victory']);
    expect(cutscenes.played).toEqual(['sisters-fall']);
    const zanmato = hud.seen.find((e) => e.type === 'action-start' && (e as { abilityName?: string }).abilityName === 'Zanmato') as { targets: string[] };
    expect([...zanmato.targets].sort(), 'its target list is the whole group').toEqual(['dark-mindy', 'dark-sandy']);
    expect(hud.seen.filter((e) => e.type === 'ko').map((e) => (e as { targetId: string }).targetId).sort()).toEqual(['dark-mindy', 'dark-sandy']);
  });

  it('Act II (Dark Yojimbo): he falls, the action ends, then the victory; the dog (untargetable) is no part of it and no seam plays', async () => {
    const group = ENEMY_GROUPS_BY_ID[yojimboGroupId(MIRROR_ACT_II)]!;
    const { outcome, hud, cutscenes } = await playAct(group, 5);
    expect(outcome.kind).toBe('victory');
    expect(hud.paid, 'Yojimbo was paid from the ladder (Pay all)').toBe(true);
    const tail = fromZanmato(hud.order, hud.seen);
    expect(tail).toEqual(['action-start', 'ko', 'action-end', 'victory']);
    expect(cutscenes.played).toEqual([]);
    expect(hud.seen.filter((e) => e.type === 'ko').map((e) => (e as { targetId: string }).targetId)).toEqual(['dark-yojimbo']);
  });
});
