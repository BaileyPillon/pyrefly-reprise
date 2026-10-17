/**
 * The Alchemist's Mix on a REAL chapter's build (re-parity RC9, lane X2-G; **FFX-2 only**): Chapter XIII (the Trema fight) gives Rikku the Alchemist dressphere at level 99 with Mix
 * learned and a bag of 99 Megalixirs, 99 Mega-Potions, 10 Light Curtains, 10 Lunar Curtains and 10 Remedies (`src/data/ffx2/builds/via-infinito.ts` and the chapter's kit). Through the app's own wiring (the content
 * registry, the chapter's set-up, the engine options the battle screen builds), a Mix of two items from that bag resolves, holds the real counts and fires its result.
 *
 * The shipped line of play never mixes (`ffx2-parity-measure`: no `x2-alchemist-mix` use in any chapter, 12 seeds), so this is the only test that puts the code on a real build.
 * The picker (a screen) is step two; the items come on the command, which is what an AI, a headless run or a test supplies.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { BattleEvent, Command, Decision, StatusId } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { getChapter } from '../../src/data/encounters.ts';
import * as data from '../../src/data/ffx2/index.ts';

const RECIPE = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx2/mix_recipe.json', import.meta.url)), 'utf8')) as { resultByPair: Record<string, number[]> };
const LIGHT = 'x2-light-curtain'; // item row 0x2032
const LUNAR = 'x2-lunar-curtain'; // item row 0x2031
const MEGALIXIR = 'x2-megalixir'; // item row 0x2009

type Input = Extract<Decision, { kind: 'player-input' }>;

/** The ability of ours whose game row is `command` (found by scanning the catalog for the record's id). */
function abilityOfRow(command: number): string {
  const found = Object.values(data.ABILITIES).filter((a) => a.ffx2Record?.id === command);
  expect(found).toHaveLength(1);
  return (found[0] as { id: string }).id;
}

async function trema(): Promise<{ engine: FFX2Engine; units: Record<string, Ffx2Unit>; flags: Record<string, unknown> }> {
  await registerBattleContent();
  const chapter = getChapter('ffx2-trema');
  if (chapter === undefined) throw new Error('Chapter XIII is not registered');
  const setup = setupForChapter(chapter, 1);
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const state = engine.state();
  return { engine, units: state.combatants as Record<string, Ffx2Unit>, flags: state.flags as Record<string, unknown> };
}

/** Run until Rikku's menu opens, answering everyone else with Defend. */
function rikkuMenu(engine: FFX2Engine, events: BattleEvent[]): Input {
  for (let i = 0; i < 30_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') {
      if (d.actorId === 'rikku') return d;
      events.push(...engine.submit({ kind: 'defend', targets: [] } as Command));
    } else if (d.kind === 'waiting') events.push(...engine.tick(Math.max(1, d.nextEventMs)));
    else if (d.kind === 'resolved') events.push(...d.events);
    else throw new Error('the battle ended before Rikku had a menu');
  }
  throw new Error('Rikku never had a menu');
}

describe("Chapter XIII's real build: Rikku mixes from the real bag", () => {
  it('she is an Alchemist with Mix learned and the bag the build names; her menu lists the Mix row, greyed until the picker exists, and it opens the overlay a picker will answer', async () => {
    const { engine, units, flags } = await trema();
    const rikku = units['rikku'] as Ffx2Unit;
    expect(rikku.dresspheres?.current).toBe('alchemist');
    expect([flags[`inventory:${LIGHT}`], flags[`inventory:${LUNAR}`], flags[`inventory:${MEGALIXIR}`]]).toEqual([10, 10, 99]);
    const menu = rikkuMenu(engine, []);
    const mix = menu.commands.find((c) => c.command.kind === 'ability' && c.command.id === 'x2-alchemist-mix');
    // Greyed on the r51 merge (the driver's item 88e): the row stays listed and opens the overlay the picker will answer, but it cannot be chosen until that screen exists
    // (`constants.ts#MIX_PICKER`), so no player picks the bare Mix and an unattended Alchemist never Mixes. The next test submits the Mix directly, as an AI or a headless run does.
    expect(mix?.enabled).toBe(false);
    expect(mix?.disabledReason).toBe('needs the item picker');
    expect(mix?.opensMinigame).toBe('rikku-mix');
    expect(menu.commands.filter((c) => c.disabledReason === 'needs the item picker'), 'only the Mix row carries the reason').toHaveLength(1);
    expect(menu.commands.find((c) => c.command.kind === 'ability' && c.command.id === 'x2-alchemist-stash-potion')?.enabled, 'her other Alchemist rows are unchanged').toBe(true);
  });

  it('the two curtains make the Wall (Shell and Protect on the party): one of each leaves the real bag at the pick, the cast fires the RESULT, and the counts stay down', async () => {
    const { engine, units, flags } = await trema();
    const events: BattleEvent[] = [];
    rikkuMenu(engine, events);
    const rikku = units['rikku'] as Ffx2Unit;
    const wall = abilityOfRow((RECIPE.resultByPair['0x2032'] as number[])[0x31] as number); // the Light Curtain then the Lunar Curtain (rows 0x32, 0x31), from the fixture
    expect(wall).toBe('x2-mix-wall');
    events.push(...engine.submit({ kind: 'ability', id: 'x2-alchemist-mix', targets: [], extra: { kind: 'rikku-mix', mix: { ingredients: [LIGHT, LUNAR], resultAbilityId: null } } } as Command));
    expect(events.find((e) => e.type === 'action-start' && e.actorId === 'rikku')).toMatchObject({ abilityId: wall });
    expect([flags[`inventory:${LIGHT}`], flags[`inventory:${LUNAR}`]], 'one of each left the real bag at the pick').toEqual([9, 9]);
    expect(rikku.itemHold).toEqual({ itemId: LIGHT, itemId2: LUNAR, got: 2, needed: 2 });
    // run to the cast: on this build the charge takes 291 logic steps and nothing in the fight interrupts it (seeds 1 to 3 alike)
    for (let i = 0; i < 20_000 && rikku.itemHold !== undefined; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') events.push(...engine.tick(Math.max(1, d.nextEventMs)));
      else if (d.kind === 'player-input') events.push(...engine.submit({ kind: 'defend', targets: [] } as Command));
      else if (d.kind === 'resolved') events.push(...d.events);
      else break;
    }
    expect(rikku.itemHold).toBeUndefined();
    expect(rikku.alive).toBe(true);
    expect(events.some((e) => e.type === 'action-end' && e.actorId === 'rikku'), 'her cast fired').toBe(true);
    expect([flags[`inventory:${LIGHT}`], flags[`inventory:${LUNAR}`]], 'the cast fired: both stay spent').toEqual([9, 9]);
    for (const id of ['yuna', 'rikku', 'paine']) {
      const u = units[id] as Ffx2Unit;
      expect(u.statuses['shell' as StatusId], `${id} has Shell`).toBeDefined();
      expect(u.statuses['protect' as StatusId], `${id} has Protect`).toBeDefined();
    }
  });

  it('the order of two different items changes the result on the real bag: the Light Curtain then a Remedy (both level 2, no blend: the first wins the tie) against the Remedy then the Light Curtain', async () => {
    const REMEDY = 'x2-remedy';
    const first = (RECIPE.resultByPair['0x2032'] as number[])[0xf] as number; // Light Curtain (0x2032) then Remedy (0x200F)
    const second = (RECIPE.resultByPair['0x200f'] as number[])[0x32] as number; // Remedy then Light Curtain
    expect(first).not.toBe(second);
    const picked: Array<string | undefined> = [];
    for (const [a, b] of [[LIGHT, REMEDY], [REMEDY, LIGHT]] as const) {
      const { engine } = await trema();
      const events: BattleEvent[] = [];
      rikkuMenu(engine, events);
      events.push(...engine.submit({ kind: 'ability', id: 'x2-alchemist-mix', targets: ['yuna'], extra: { kind: 'rikku-mix', mix: { ingredients: [a, b], resultAbilityId: null } } } as Command));
      picked.push((events.find((e) => e.type === 'action-start' && e.actorId === 'rikku') as Extract<BattleEvent, { type: 'action-start' }>).abilityId);
    }
    expect(picked).toEqual([abilityOfRow(first), abilityOfRow(second)]);
  });
});
