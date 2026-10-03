// @vitest-environment jsdom
/**
 * Chapter XII's disc line (D-216, wording (c) verbatim from D-248; FFX only).
 *
 * Auron says "Hit a disc. Three alike, and his spell reaches everyone." the
 * first time the advisor card's top row would turn a Mortiphasm disc, in
 * Chapter XII and nowhere else. These run the real Omnis engine and the real
 * advisor card, so the trigger is read off the same top row the player sees.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleState, CombatantId, Command, TurnPreview } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { buildAdvisorView, clearAdvisorCache, type AdvisorView } from '../../src/engine/tactics/advisor.ts';
import { topRowDiscTurn } from '../../src/engine/tactics/advisor-omnis.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { ALL_COACH_IDS, markById, marksFor } from '../../src/ui/coach/coachCopy.ts';
import { withCoach } from '../../src/ui/coach/CoachLayer.ts';
import { markSeen, resetCoach, setCoachingEnabled } from '../../src/ui/coach/coachState.ts';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

function engineFor(chapterId: 'seymour-omnis' | 'seymour-flux', seed: number) {
  const chapter = getChapter(chapterId)!;
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: chapter.buildRef, enemies: ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id]!, triggers: [], seed, condition: 'normal', canEscape: false } as never);
  return engine;
}

interface Decision {
  state: BattleState;
  actorId: string;
  commands: AvailableCommand[];
  view: AdvisorView | null;
}

/** The first player decision of a fresh battle, with the card the player would see. */
function firstDecision(chapterId: 'seymour-omnis' | 'seymour-flux', seed: number): Decision {
  const engine = engineFor(chapterId, seed);
  clearAdvisorCache();
  for (let i = 0; i < 5_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') {
      const view = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, { ffxContent: content, planner: true });
      return { state: engine.state(), actorId: d.actorId, commands: d.commands as AvailableCommand[], view };
    }
    if (d.kind === 'battle-over') break;
  }
  throw new Error('no player decision');
}

/** Walk the Omnis fight following the card until its top row turns a disc; return that decision. */
function omnisDiscDecision(seed: number): Decision | null {
  const engine = engineFor('seymour-omnis', seed);
  clearAdvisorCache();
  for (let i = 0; i < 60_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    const view = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, { ffxContent: content, planner: true });
    if (topRowDiscTurn(engine.state(), view)) return { state: engine.state(), actorId: d.actorId, commands: d.commands as AvailableCommand[], view };
    engine.submit(view?.suggestions[0]?.command ?? ({ kind: 'defend', targets: [] } as Command));
  }
  return null;
}

/** A HUD whose advisor card reports a fixed view, like the real `moveAdvisor.view()`. */
class CardHud implements HudPort {
  menus = 0;
  constructor(private readonly shown: AdvisorView | null) {}
  readonly moveAdvisor = { view: (): AdvisorView | null => this.shown };
  mount(): void {}
  unmount(): void {}
  sync(): void {}
  chooseCommand(): Promise<Command> {
    this.menus += 1;
    return Promise.resolve({ kind: 'defend', targets: [] } as Command);
  }
  onEvent(): void {}
  openMinigame(): Promise<never> {
    return Promise.resolve({} as never);
  }
  setVisible(): void {}
  setProjector(): void {}
}

const preview = (): TurnPreview[] => [];
const markEl = (root: HTMLElement): HTMLElement | null => root.querySelector<HTMLElement>('[data-role="coach-mark"]');

describe('Chapter XII disc line (D-216 / D-248, FFX only)', () => {
  let root: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    root = document.createElement('div');
    document.body.appendChild(root);
    resetCoach();
    setCoachingEnabled(true);
    markSeen('ffx-turn-order'); // the first menu's own line is already behind this player
  });

  it('is the approved wording exactly, spoken by Auron, FFX only, and held like every FFX line', () => {
    const mark = markById('ffx-omnis-disc');
    expect(mark?.body).toBe('“Hit a disc. Three alike, and his spell reaches everyone.”');
    expect(mark?.speaker).toBe('Auron');
    expect(mark?.game).toBe('ffx');
    expect(mark?.holds).toBe(true);
    expect(marksFor('ffx2').map((m) => m.id)).not.toContain('ffx-omnis-disc');
    expect(ALL_COACH_IDS).toContain('ffx-omnis-disc');
  });

  it('the top row reads as a disc turn on the Omnis board and as nothing in Chapter I', () => {
    const omnis = omnisDiscDecision(1);
    expect(omnis, 'a card-follower reaches a disc turn on seed 1').not.toBeNull();
    expect(topRowDiscTurn(omnis!.state, omnis!.view)?.index).toBeGreaterThanOrEqual(0);
    const ch1 = firstDecision('seymour-flux', 1);
    expect(topRowDiscTurn(ch1.state, ch1.view)).toBeNull();
    expect(topRowDiscTurn(omnis!.state, null)).toBeNull();
  }, 120_000);

  it('fires once, on the menu whose top row turns a disc, and never again', async () => {
    const d = omnisDiscDecision(1)!;
    const hud = withCoach('ffx', new CardHud(d.view), { reduceMotion: true });
    hud.mount(root);
    hud.sync(d.state, preview());
    const first = hud.chooseCommand(d.actorId as CombatantId, d.commands, preview);
    const line = markEl(root);
    expect(line?.dataset['mark']).toBe('ffx-omnis-disc');
    expect(line?.textContent).toContain('Hit a disc. Three alike, and his spell reaches everyone.');
    await first;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
    expect(markEl(root)).toBeNull();
    await hud.chooseCommand(d.actorId as CombatantId, d.commands, preview);
    expect(markEl(root), 'said once').toBeNull();
  }, 120_000);

  it('stays quiet in Chapter I, with coaching off, and when the card has no view', async () => {
    const ch1 = firstDecision('seymour-flux', 1);
    const quiet = withCoach('ffx', new CardHud(ch1.view), { reduceMotion: true });
    quiet.mount(root);
    quiet.sync(ch1.state, preview());
    await quiet.chooseCommand(ch1.actorId as CombatantId, ch1.commands, preview);
    expect(markEl(root)).toBeNull();

    const d = omnisDiscDecision(1)!;
    const none = withCoach('ffx', new CardHud(null), { reduceMotion: true });
    none.mount(root);
    none.sync(d.state, preview());
    await none.chooseCommand(d.actorId as CombatantId, d.commands, preview);
    expect(markEl(root)).toBeNull();

    setCoachingEnabled(false);
    const off = withCoach('ffx', new CardHud(d.view), { reduceMotion: true });
    off.mount(root);
    off.sync(d.state, preview());
    await off.chooseCommand(d.actorId as CombatantId, d.commands, preview);
    expect(markEl(root)).toBeNull();
  }, 120_000);
});
