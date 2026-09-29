/**
 * **The FFX status carry behind `carriesPartyState`** (Sin, links 1 to 3; FFX
 * only; package S of `docs/plans/sin-two-chapters-plan.md`, R7 and REVIEW
 * must-change 5). Research/ffx-sin.md §1.2 `[verified: 3 sources]`: links 1, 2
 * and 3 are one gauntlet, "the next fight will start off with your characters in
 * the same stats", so statuses carry with HP, MP and gauges. Only
 * `sin-right-fin` and `sin-genais-core` set the flag; the two FFX chains that
 * existed before (Chapter III: Braska's Final Aeon, the possessed aeons, Yu
 * Yevon; Chapter XIV: Isaaru) carry **no** statuses, exactly as before.
 *
 * Run on the real engine: the seams are `BattleScreenSetup.setupForNextLink`,
 * the screen's own carry, and each next link is initialised by the engine.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine, BattleSetup, BattleState, Command, FFXCombatant, FFXPartyBuild, StatusInstance } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

function engineOn(setup: BattleSetup): BattleEngine {
  const e = createFFXEngine({ content, autoResolveMinigames: true });
  e.init(setup);
  return e;
}

const live = (e: BattleEngine, id: string): FFXCombatant => e.state().combatants[id] as FFXCombatant;

/** Tidus casts his own Haste on himself, by a real submitted command; everyone else defends. */
function hasteTidus(e: BattleEngine): void {
  for (let i = 0; i < 400 && live(e, 'tidus').statuses['haste'] === undefined; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    const haste = d.actorId === 'tidus'
      ? d.commands.find((c) => c.enabled && c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'haste')
      : undefined;
    const command: Command = haste ? ({ ...haste.command, targets: ['tidus'] } as Command) : { kind: 'defend', targets: [] };
    e.submit(command);
  }
}

const HASTE: StatusInstance = { id: 'haste', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };

describe('Sin, links 1 -> 2 -> 3: statuses carry (§1.2 [verified: 3 sources])', () => {
  it("Haste Tidus earned against the Left Fin is on him when the Right Fin link opens, and again at Genais and the Core", () => {
    const chapter = getChapter('sin-fins-core')!;
    const first = setupForChapter(chapter, 3);
    const e1 = engineOn(first);
    hasteTidus(e1);
    expect(live(e1, 'tidus').statuses['haste']).toBeDefined();

    const right = ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.nextGroupId!]!;
    expect(right.id).toBe('sin-right-fin');
    const second = setupForNextLink(first, right, e1.state() as BattleState, 4);
    const tidusBuild = (second.party as FFXPartyBuild).members.find((m) => m.id === 'tidus')!;
    expect(tidusBuild.statuses?.['haste']).toBeDefined();
    expect(tidusBuild.hp).toBe(live(e1, 'tidus').hp);
    const e2 = engineOn(second);
    expect(live(e2, 'tidus').statuses['haste']).toBeDefined();

    const core = ENEMY_GROUPS_BY_ID[right.nextGroupId!]!;
    expect(core.id).toBe('sin-genais-core');
    const third = setupForNextLink(second, core, e2.state() as BattleState, 5);
    const e3 = engineOn(third);
    expect(live(e3, 'tidus').statuses['haste']).toBeDefined();
  });

  it('the carry leaves out KO, Eject and the command stances, and does not touch the template build', () => {
    const chapter = getChapter('sin-fins-core')!;
    const first = setupForChapter(chapter, 1);
    const e1 = engineOn(first);
    const state = structuredClone(e1.state()) as BattleState;
    const auron = state.combatants['auron'] as FFXCombatant;
    auron.statuses['defend'] = { ...HASTE, id: 'defend' };
    auron.statuses['protect'] = { ...HASTE, id: 'protect' };
    const next = setupForNextLink(first, ENEMY_GROUPS_BY_ID['sin-right-fin']!, state, 2);
    const carried = (next.party as FFXPartyBuild).members.find((m) => m.id === 'auron')!.statuses ?? {};
    expect(carried['protect']).toBeDefined();
    expect(carried['defend']).toBeUndefined();
    expect(carried['ko']).toBeUndefined();
    const template = (chapter.buildRef as FFXPartyBuild).members.find((m) => m.id === 'auron')!;
    expect(template.statuses?.['protect']).toBeUndefined();
  });
});

describe('every other FFX chain carries no statuses, exactly as before (REVIEW must-change 5)', () => {
  it.each([
    ['braskas-final-aeon', "Chapter III: Braska's Final Aeon -> the possessed aeons -> Yu Yevon"],
    ['isaaru-via-purifico', 'Chapter XIV: Isaaru'],
  ])('%s (%s)', (chapterId) => {
    const chapter = getChapter(chapterId)!;
    expect(chapter.game).toBe('ffx');
    let setup = setupForChapter(chapter, 1);
    let group = chapter.enemyGroupRef;
    let seams = 0;
    while (group.nextGroupId) {
      const next = ENEMY_GROUPS_BY_ID[group.nextGroupId];
      if (!next) break;
      expect(next.carriesPartyState).toBeUndefined();
      const e = engineOn(setup);
      const state = structuredClone(e.state()) as BattleState;
      for (const m of (setup.party as FFXPartyBuild).members) {
        const c = state.combatants[m.id] as FFXCombatant | undefined;
        if (c) c.statuses['haste'] = { ...HASTE };
      }
      const carried = setupForNextLink(setup, next, state, 2 + seams);
      const before = (setup.party as FFXPartyBuild).members;
      for (const m of (carried.party as FFXPartyBuild).members) {
        expect(m.statuses, `${chapterId} ${next.id} ${m.id}`).toEqual(before.find((b) => b.id === m.id)!.statuses);
      }
      const after = engineOn(carried);
      for (const m of (carried.party as FFXPartyBuild).members) {
        const c = live(after, m.id);
        if (c) expect(c.statuses['haste']?.permanent ?? true, `${chapterId} ${m.id}`).toBe(true);
      }
      setup = carried;
      group = next;
      seams++;
    }
    expect(seams).toBeGreaterThan(0);
  });
});
