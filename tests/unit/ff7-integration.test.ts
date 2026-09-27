// @vitest-environment jsdom
/**
 * The FF7 experiment's wiring (FF7 only, plus the shared plumbing it touches):
 * the HUD reading the real FF7 engine's commands, the edge commands (Change,
 * Defend), the item counts, the quoted dialogue and the nameless tail moves,
 * the presenter's animation bracket, and the experiment flow's results panel
 * and RETRY loop. Everything here runs the real engine (rule 3), not a fixture.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { runExperiment, type ExperimentPorts } from '../../src/app/screens/BattleScreenExperiment.ts';
import { createEngine, createHud } from '../../src/app/screens/BattleScreenWiring.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { battleSpellFx } from '../../src/app/screens/battleSpellFx.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import type { AvailableCommand, BattleEvent, CombatantId } from '../../src/battle/common/types.ts';
import { Ff7Engine } from '../../src/battle/ff7/index.ts';
import { FF7_GUARD_SCORPION } from '../../src/data/chapter-ff7-guard-scorpion.ts';
import { animatingEngine, bracketAnimations } from '../../src/engine/BattlePresenterAnimating.ts';
import { Ff7BattleHud } from '../../src/ui/ff7/Ff7BattleHud.ts';
import { buildSlots, openMenu, step, tapEdge } from '../../src/ui/ff7/ff7MenuModel.ts';
import { Screen } from '../../src/app/Screen.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';

async function ff7Engine(seed = 1): Promise<Ff7Engine> {
  return (await createEngine('ff7', setupForChapter(FF7_GUARD_SCORPION, seed))) as Ff7Engine;
}

/** Run the clock until a party member's command window opens. */
function firstMenu(engine: Ff7Engine): { actorId: CombatantId; commands: AvailableCommand[] } {
  for (let i = 0; i < 200; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return { actorId: d.actorId, commands: d.commands };
    if (d.kind === 'waiting') engine.tick(d.nextEventMs);
    if (d.kind === 'battle-over') break;
  }
  throw new Error('no menu opened');
}

afterEach(() => {
  setFf7ExperimentReadyForTests(null);
  document.body.innerHTML = '';
});

describe('the command window from the real FF7 engine', () => {
  it('fills Attack, Magic, a blank Summon and Item from its rows, and keeps Change and Defend off the edges', async () => {
    const { commands } = firstMenu(await ff7Engine());
    const slots = buildSlots(commands);
    expect(slots.map((s) => s?.label ?? null)).toEqual(['Attack', 'Magic', null, 'Item']);
    expect(slots[1]!.rows.every((r) => r.category === 'magic')).toBe(true);
    const menu = openMenu(commands);
    expect(menu.edges.change?.command.kind).toBe('row-change');
    expect(menu.edges.defend?.command.kind).toBe('defend');
  });

  it('left is Change, right is Defend, confirm chooses it, up goes back to the slots [manual p. 18]', async () => {
    const { commands } = firstMenu(await ff7Engine());
    let st = openMenu(commands);
    st = step(st, 'left').state;
    expect(st.edge).toBe('change');
    expect(step(st, 'confirm').done).toEqual({ kind: 'row-change', targets: [] });
    st = step(st, 'right').state;
    expect(st.edge).toBeNull(); // back from the left edge first
    st = step(st, 'right').state;
    expect(st.edge).toBe('defend');
    expect(step(st, 'confirm').done).toEqual({ kind: 'defend', targets: [] });
    expect(step(st, 'up').state.edge).toBeNull();
    // The touch way: one tap beside the edge moves the finger, a second chooses.
    const tapped = tapEdge(openMenu(commands), 'defend');
    expect(tapped.state.edge).toBe('defend');
    expect(tapEdge(tapped.state, 'defend').done?.kind).toBe('defend');
  });

  it('the engine takes every command the window gives it (Change and Defend spend the turn)', async () => {
    const engine = await ff7Engine();
    const { commands } = firstMenu(engine);
    const done = step(step(openMenu(commands), 'right').state, 'confirm').done!;
    const events = engine.submit(done);
    expect(events.some((e) => e.type === 'action-start' && e.command.kind === 'defend')).toBe(true);
  });
});

describe('the FF7 HUD on the real engine', () => {
  it('reads item counts from the engine bag and prints the name without the engine\'s "xN"', async () => {
    const engine = await ff7Engine();
    const hud = createHud('ff7', undefined, engine) as Ff7BattleHud;
    hud.mount(document.body);
    hud.sync(engine.state() as never, engine.gaugeSnapshot());
    const { actorId, commands } = firstMenu(engine);
    void hud.chooseCommand(actorId, commands);
    hud.commandMenu.press('down');
    hud.commandMenu.press('down'); // skips the blank Summon slot
    expect(hud.inspect().menu?.slots[hud.inspect().menu!.topIdx]?.label).toBe('Item');
    hud.commandMenu.press('confirm');
    const labels = [...document.querySelectorAll('.ff7-layer--menu .ff7-row-label')].map((e) => e.textContent);
    const [itemId, count] = Object.entries(engine.inventory())[0]!;
    expect(labels.some((l) => l && /x\d+$/.test(l))).toBe(false);
    expect(document.querySelector('[data-win="item"]')?.textContent).toContain(String(count));
    expect(itemId).toBeTruthy();
    hud.unmount();
  });

  it('opens dialogue with a quote mark and prints no name for Raise Tail and Drop Tail [gs §5.2 "<>"]', () => {
    const hud = new Ff7BattleHud({ size: () => ({ w: 1600, h: 900 }) });
    hud.mount(document.body);
    const at = (abilityId: string, abilityName: string): BattleEvent =>
      ({ seq: 1, type: 'action-start', actorId: 'guard-scorpion', command: { kind: 'ability', id: abilityId, targets: [] }, abilityId, abilityName, targets: [] }) as never;
    hud.onEvent(at('raise-tail', 'Raise Tail'));
    expect(hud.inspect().message).toBeNull();
    hud.onEvent(at('search-scope', 'Search Scope'));
    expect(hud.inspect().message).toBe('Search Scope');
    hud.update(10);
    hud.onEvent({ seq: 2, type: 'message', text: "Attack while it's tail's up!", kind: 'story' } as never);
    expect(hud.inspect().message).toBe("“Attack while it's tail's up!"); // the game's own "it's", kept (D-237..D-240)
    hud.update(10);
    hud.onEvent({ seq: 3, type: 'message', text: 'Locked On Target', kind: 'system' } as never);
    expect(hud.inspect().message).toBe('Locked On Target');
    hud.unmount();
  });
});

describe('a full Limit keeps its tap targets', () => {
  it('steps the "Limit" letter colours in place, so a tap between two steps still finds its row', () => {
    const hud = new Ff7BattleHud({ size: () => ({ w: 390, h: 844 }) });
    hud.mount(document.body);
    const limit = { command: { kind: 'limit', id: 'braver', targets: [] }, label: 'Braver', category: 'attack', mpCost: 0, enabled: true, validTargets: ['guard-scorpion'] } as unknown as AvailableCommand;
    void hud.chooseCommand('cloud', [limit]);
    const hit = document.querySelector('.ff7-hit[data-slot="0"]');
    const first = [...document.querySelectorAll<HTMLElement>('.ff7-slot[data-slot="0"] span')].map((e) => e.style.color).join();
    hud.update(0.35);
    expect(document.querySelector('.ff7-hit[data-slot="0"]')).toBe(hit); // not rebuilt
    expect(hit?.isConnected).toBe(true);
    const later = [...document.querySelectorAll<HTMLElement>('.ff7-slot[data-slot="0"] span')].map((e) => e.style.color).join();
    expect(later).not.toBe(first); // the colours still cycle [spec §3.5]
    hud.unmount();
  });
});

describe('the presenter tells the FF7 engine when an action animates', () => {
  it('brackets every burst with setAnimating(true/false), also when playback throws, and passes empty bursts through', async () => {
    const engine = await ff7Engine();
    const seen: boolean[] = [];
    const presenter = {
      play: async (events: BattleEvent[]) => {
        seen.push(engine.animating());
        if (events.length === 2) throw new Error('boom');
        return { dropped: 0 };
      },
    };
    expect(bracketAnimations(presenter, engine)).toBe(true);
    await presenter.play([{ seq: 0, type: 'wait', ms: 1 } as never]);
    await presenter.play([]);
    await expect(presenter.play([{} as never, {} as never])).rejects.toThrow('boom');
    expect(seen).toEqual([true, false, true]);
    expect(engine.animating()).toBe(false);
  });

  it('holds the clock under Recommended while an action plays (core §2.5)', async () => {
    const engine = await ff7Engine();
    expect(engine.ff7AtbMode()).toBe('recommended'); // FF7's default mode
    engine.setAnimating(true);
    expect(engine.clockHeld()).toBe(true);
    engine.setAnimating(false);
    expect(engine.clockHeld()).toBe(false);
  });

  it('leaves an engine without setAnimating (FFX, FFX-2) exactly as it was', () => {
    const play = async (): Promise<{ dropped: number }> => ({ dropped: 0 });
    const presenter = { play };
    expect(animatingEngine({ tick() {} })).toBeNull();
    expect(bracketAnimations(presenter, { tick() {} })).toBe(false);
    expect(presenter.play).toBe(play);
  });
});

describe('FF7 spell effects wait for their options round', () => {
  it('hands the stage no overlay and no skin for FF7', () => {
    expect(battleSpellFx('ff7', {} as never)).toEqual({});
  });
});

// ------------------------------------------------------------ the flow

class Fight extends Screen {
  readonly name = 'battle';
  constructor(readonly done: Promise<BattleScreenResult>) {
    super();
  }
}

function ports(outcomes: Array<'victory' | 'defeat'>, choices: Array<'retry' | 'chapter-select' | 'continue'>) {
  const battles: BattleScreenOptions[] = [];
  const panels: string[] = [];
  let swirls = 0;
  const p: ExperimentPorts = {
    show: async () => true,
    setStep: () => undefined,
    makeBattle: (o) => {
      battles.push(o);
      const outcome = outcomes[battles.length - 1] ?? 'victory';
      return new Fight(Promise.resolve({ chapterId: o.chapter.id, outcome, result: null, elapsedMs: 50_000, links: 1, preview: false } as never));
    },
    playIn: async (swap) => {
      swirls++;
      return swap();
    },
    results: async (_c, o) => {
      panels.push(o.outcome);
      return choices.shift() ?? 'continue';
    },
  };
  return { p, battles, panels, swirls: () => swirls };
}

describe('the experiment flow: results, RETRY and the way back', () => {
  it('a win comes in through the chapters\' swirl, shows the results panel once and returns', async () => {
    setFf7ExperimentReadyForTests(true);
    const r = ports(['victory'], []);
    const out = await runExperiment(FF7_GUARD_SCORPION, { seed: 5 }, r.p);
    expect(out?.outcome).toBe('victory');
    expect(r.panels).toEqual(['victory']);
    expect(r.swirls()).toBe(1);
    expect(r.battles.map((b) => b.seed)).toEqual([5]);
  });

  it('RETRY goes straight back in with seed + 1000; CHAPTER SELECT returns the defeat', async () => {
    setFf7ExperimentReadyForTests(true);
    const r = ports(['defeat', 'defeat'], ['retry', 'chapter-select']);
    const out = await runExperiment(FF7_GUARD_SCORPION, { seed: 5 }, r.p);
    expect(out?.outcome).toBe('defeat');
    expect(r.battles.map((b) => b.seed)).toEqual([5, 1005]);
    expect(r.panels).toEqual(['defeat', 'defeat']);
    expect(r.swirls()).toBe(2);
  });

  it('a lost retry that is then won ends on the win; skipResults shows no panel', async () => {
    setFf7ExperimentReadyForTests(true);
    const r = ports(['defeat', 'victory'], ['retry']);
    expect((await runExperiment(FF7_GUARD_SCORPION, { seed: 1 }, r.p))?.outcome).toBe('victory');
    const q = ports(['defeat'], []);
    expect((await runExperiment(FF7_GUARD_SCORPION, { seed: 1, skipResults: true }, q.p))?.outcome).toBe('defeat');
    expect(q.panels).toEqual([]);
  });
});
