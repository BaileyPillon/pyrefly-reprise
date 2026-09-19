// @vitest-environment jsdom
/**
 * **The chip and the stack, checked against each other.**
 *
 * The advisor prints "Magic Break → Bahamut · in Skill". Three inches to its
 * right the command window paints the rows that actually exist. Round 2 of the
 * advisor fix built the chip out of one FFX-worded table for both games, and
 * on 49 of 67 FFX-2 suggestions the two disagreed: the card said `IN SPECIAL`
 * and `IN ITEMS` over a stack reading `ATTACK / SKILL / GUNNER / BLACK-MAGE /
 * ITEM` [critic, fix-3 round 2, F1 and F2]. A third of the chips in *both*
 * games said "Attack · in Attack", directions to the row the player was
 * standing on [F3].
 *
 * So this file does not test the chip against a table. It renders **the real
 * command windows** — FFX's through `buildTopRows`, the logic its menu draws
 * from, and FFX-2's through `openCommandMenu` itself, in jsdom, reading the
 * labels back out of the DOM it produced — and replays every chapter asking
 * the advisor at every open decision. Two assertions, on every suggestion:
 *
 *  * a chip that names a submenu names **a row that is on the stack**;
 *  * an **empty** chip means the row is on the stack already, at the top level.
 *
 * Both HUDs hand the advisor and their menu the same `AvailableCommand[]`
 * (`FFXBattleHud.chooseCommand`, `FFX2BattleHud`'s `showDecision` +
 * `openCommandMenu` pair), so the two halves here are looking at one list.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleEngine,
  BattleState,
  Command,
  Decision,
  FFX2PartyBuild,
  FFXPartyBuild,
} from '../../src/battle/common/types.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as ffx2Data from '../../src/data/ffx2/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';
import { type AdvisorOptions, buildAdvisorView } from '../../src/engine/tactics/advisor.ts';
import { menuChipFor, onTheMenu } from '../../src/engine/tactics/advisor-menu.ts';
import { buildTopRows } from '../../src/ui/ffx/CommandMenuLogic.ts';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';

// ------------------------------------------------------- the two real windows

/**
 * The top-level rows FFX would paint, in the words it paints them in.
 *
 * `buildTopRows` is what `ui/ffx/CommandMenu.ts` builds its stack from (line
 * 244), and `CommandMenu`'s own view-model copies `row.cmd.label` for a direct
 * row and `row.label` for a group, which is what this reproduces.
 */
function ffxTopLabels(commands: AvailableCommand[]): string[] {
  return buildTopRows(commands).map((row) => (row.kind === 'direct' ? row.cmd.label : row.label));
}

/**
 * The top-level rows FFX-2 **actually paints**, read off the DOM.
 *
 * `openCommandMenu` renders synchronously before it returns its promise, so
 * the stack is in the container the moment the call comes back. The promise is
 * never resolved (nothing is pressed) and its `keydown` listener is left on
 * `window` — harmless here because this file dispatches no keys, and the
 * alternative is driving a whole menu to a target just to read a label.
 */
function ffx2TopLabels(commands: AvailableCommand[], actorName: string): string[] {
  const container = document.createElement('div');
  const targetLayer = document.createElement('div');
  document.body.append(container, targetLayer);
  void openCommandMenu({
    container,
    targetLayer,
    commands,
    actorName,
    previewRank: () => [],
    project: () => null,
    onPreview: () => {},
  });
  const labels = [...container.querySelectorAll('.ffx2cmd__label')].map((el) =>
    (el.textContent ?? '').trim(),
  );
  container.remove();
  targetLayer.remove();
  return labels;
}

function topLabels(state: Readonly<BattleState>, commands: AvailableCommand[], actorName: string): string[] {
  return state.game === 'ffx2' ? ffx2TopLabels(commands, actorName) : ffxTopLabels(commands);
}

// --------------------------------------------------------------- the engines

function ffxContent(): FFXContentRegistry {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  return content;
}

function ffx2Options() {
  return {
    abilities: abilityRegistryFrom(Object.values(ffx2Data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2Data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2Data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2Data.GARMENT_GRIDS)),
  };
}

function rigFor(chapterId: string, seed: number): { engine: BattleEngine; options: AdvisorOptions } {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`${chapterId} is not a chapter`);
  const setup = {
    game: chapter.game,
    party: chapter.buildRef as FFXPartyBuild | FFX2PartyBuild,
    enemies: chapter.enemyGroupRef,
    triggers: [],
    seed,
    condition: 'normal' as const,
    canEscape: false,
  };
  if (chapter.game === 'ffx') {
    const content = ffxContent();
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init(setup);
    return { engine, options: { ffxContent: content } };
  }
  const opts = ffx2Options();
  const engine = new FFX2Engine({ ...opts, minigames: false });
  engine.setSeed(seed);
  engine.init(setup);
  return { engine, options: { ffx2: { abilities: opts.abilities, items: opts.items } } };
}

function randomLegal(commands: AvailableCommand[], rng: SeededRng): Command | null {
  const rows = commands.filter(
    (c) => c.enabled && c.command.kind !== 'escape' && (c.validTargets.length > 0 || c.command.kind !== 'attack'),
  );
  if (rows.length === 0) return null;
  const row = rows[rng.int(0, rows.length - 1)]!;
  const target = row.validTargets[rng.int(0, Math.max(0, row.validTargets.length - 1))];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

// ---------------------------------------------------------------- the sweep

interface Mismatch {
  where: string;
  said: string;
  stack: string;
}

/** Replay one chapter, checking every printed chip against the painted stack. */
function sweep(chapterId: string, seed: number, play: 'intended' | 'random', budget: number) {
  const { engine, options } = rigFor(chapterId, seed);
  const rng = new SeededRng(seed * 104_729 + 7);
  const out = { decisions: 0, chips: 0, bare: 0, phantom: [] as Mismatch[], offMenu: [] as Mismatch[] };

  const tick = (engine as { tick?: (ms: number) => unknown }).tick?.bind(engine);
  for (let i = 0; i < budget * 40 && out.decisions < budget; i++) {
    const decision: Decision = engine.nextDecision();
    if (decision.kind === 'battle-over') break;
    if (decision.kind === 'waiting') {
      if (!tick) break;
      tick(Math.max(1, decision.nextEventMs));
      continue;
    }
    if (decision.kind !== 'player-input') continue;
    out.decisions += 1;

    const state = engine.state();
    const view = buildAdvisorView(state, decision, options);
    if (view) {
      const stack = topLabels(state, decision.commands, view.actorName);
      for (const s of view.suggestions) {
        const where = `${chapterId}/${play}/${view.actorName}: ${s.label}`;
        if (s.menu) {
          out.chips += 1;
          // The chip promises a row on the stack, spelled the way the stack
          // spells it — and it can never be the row itself.
          if (!stack.includes(s.menu)) {
            out.phantom.push({ where, said: `in ${s.menu}`, stack: stack.join(' / ') });
          }
          if (s.menu === s.label) {
            out.phantom.push({ where, said: `in ${s.menu} (its own row)`, stack: stack.join(' / ') });
          }
        } else {
          out.bare += 1;
          // No chip means "it is right there": the row has to be on the stack.
          if (!stack.includes(s.label)) {
            out.offMenu.push({ where, said: '(no submenu)', stack: stack.join(' / ') });
          }
        }
      }
    }

    const chosen =
      play === 'intended'
        ? (recommendedCommand(state, decision) ?? randomLegal(decision.commands, rng))
        : randomLegal(decision.commands, rng);
    if (!chosen) break;
    try {
      engine.submit(chosen);
    } catch {
      break;
    }
  }
  return out;
}

describe('every chip names a row the command window paints', () => {
  for (const chapter of CHAPTERS) {
    it(`holds across ${chapter.id} (${chapter.game}), intended and random play`, () => {
      const phantom: Mismatch[] = [];
      const offMenu: Mismatch[] = [];
      let chips = 0;
      let bare = 0;
      let decisions = 0;
      for (const seed of [11, 29, 47]) {
        for (const play of ['intended', 'random'] as const) {
          const r = sweep(chapter.id, seed, play, 40);
          phantom.push(...r.phantom);
          offMenu.push(...r.offMenu);
          chips += r.chips;
          bare += r.bare;
          decisions += r.decisions;
        }
      }
      expect(decisions).toBeGreaterThan(30);
      expect(chips + bare).toBeGreaterThan(30);
      expect(phantom.slice(0, 6)).toEqual([]);
      expect(offMenu.slice(0, 6)).toEqual([]);
    });
  }
});

// ------------------------------------------------- the rules, one at a time

/** A minimal row; only `category`, `kind` and `label` matter to the grouping. */
function row(category: string, kind: Command['kind'], label: string, extra: Record<string, unknown> = {}): AvailableCommand {
  return {
    command: { kind, id: label.toLowerCase().replace(/\s+/g, '-'), targets: [], ...extra } as unknown as Command,
    label,
    category: category as AvailableCommand['category'],
    enabled: true,
    mpCost: 0,
    validTargets: [],
  } as AvailableCommand;
}

describe('FFX and FFX-2 do not share a menu', () => {
  it('FFX-2 says Skill and Item where FFX says Special and Items', () => {
    const ffx2 = [row('skill', 'ability', 'Magic Break'), row('skill', 'ability', 'Power Break')];
    const ffx = [row('special', 'ability', 'Steal'), row('special', 'ability', 'Use')];
    const ffx2Items = [row('item', 'item', 'Potion'), row('item', 'item', 'Hi-Potion')];
    const ffxItems = [row('item', 'item', 'Potion'), row('item', 'item', 'Hi-Potion')];
    expect(menuChipFor('ffx2', ffx2, ffx2[0]!)).toBe('Skill');
    expect(menuChipFor('ffx', ffx, ffx[0]!)).toBe('Special');
    expect(menuChipFor('ffx2', ffx2Items, ffx2Items[0]!)).toBe('Item');
    expect(menuChipFor('ffx', ffxItems, ffxItems[0]!)).toBe('Items');
  });

  it("FFX-2 collapses a lone category to a top-level row; FFX's stays a submenu", () => {
    const lone = [row('attack', 'attack', 'Attack'), row('skill', 'ability', 'Trigger Happy')];
    expect(menuChipFor('ffx2', lone, lone[1]!)).toBe('');
    // Same shape in FFX: one white spell, and White Magic is still a submenu.
    const ffxLone = [row('attack', 'attack', 'Attack'), row('whitemagic', 'ability', 'Cure')];
    expect(menuChipFor('ffx', ffxLone, ffxLone[1]!)).toBe('White Magic');
  });

  it('FFX-2 spherechange is always Change, never the outfit or the category', () => {
    const change = [
      row('dressphere', 'spherechange', 'gunner', { extra: { toDressphere: 'gunner', gatesCrossed: [] } }),
      row('dressphere', 'spherechange', 'black-mage', { extra: { toDressphere: 'black-mage', gatesCrossed: [] } }),
    ];
    expect(menuChipFor('ffx2', change, change[0]!)).toBe('Change');
    // Even at a single destination — "Change" and "Change into Thief" are
    // different promises and only the first one is the game's.
    expect(menuChipFor('ffx2', [change[0]!], change[0]!)).toBe('Change');
  });

  it('Attack is never "in Attack" in either game', () => {
    const ffx = [row('attack', 'attack', 'Attack'), row('item', 'item', 'Potion'), row('item', 'item', 'Ether')];
    const ffx2 = [row('attack', 'attack', 'Attack'), row('item', 'item', 'Potion'), row('item', 'item', 'Ether')];
    expect(menuChipFor('ffx', ffx, ffx[0]!)).toBe('');
    expect(menuChipFor('ffx2', ffx2, ffx2[0]!)).toBe('');
  });

  it('FFX collapses the bench into one Switch row; FFX-2 has no bench', () => {
    const ffx = [row('attack', 'attack', 'Attack'), row('attack', 'switch', 'Kimahri', { extra: { inId: 'kimahri', outId: 'tidus' } })];
    expect(menuChipFor('ffx', ffx, ffx[1]!)).toBe('Switch');
  });

  it('FFX has no Defend row, so the card may not name one; FFX-2 does', () => {
    expect(onTheMenu('ffx', { kind: 'defend', targets: [] } as unknown as Command)).toBe(false);
    expect(onTheMenu('ffx2', { kind: 'defend', targets: [] } as unknown as Command)).toBe(true);
    expect(onTheMenu('ffx', { kind: 'attack', targets: [] } as unknown as Command)).toBe(true);
  });
});
