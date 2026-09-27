/**
 * FOC22-02 (focused review a44297ca, CHK-004): in Chapter XI (Anima) the advisor
 * kept naming Remedy in Item for a girl under Itchy, whose menu offers only CHANGE.
 *
 * Itchy "seals every command except L1 and Escape until you spherechange", and a
 * spherechange clears it [research/ffx2-combat-core.md §2.8, `[verified: 2 sources]`].
 * The engine offers exactly that (`src/battle/ffx2/targeting.ts#buildCommands`); the
 * advisor could not price a spherechange, so the card had nothing for the one board
 * where the answer is certain.
 *
 * Driven on the real FFX-2 engine, Chapter XI's Anima link, following the card.
 * Game case: FFX-2 only (FFX has no Itchy and no spherechange).
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleSetup, Command, Decision } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { FALLEN_AEONS_CHAIN_ORDER } from '../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { buildAdvisorView, ownedRow, sameCommand } from '../../src/engine/tactics/advisor.ts';
import { changeLabel, lockedToChange } from '../../src/engine/tactics/advisor-change.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

interface ItchyBoard {
  seed: number;
  actorId: string;
  commands: AvailableCommand[];
  suggestions: { command: Command; label: string; menu: string; reason: string }[];
}

/** Every decision taken by a girl under Itchy, following the card, on the Anima link. */
function itchyBoards(seeds: readonly number[]): ItchyBoard[] {
  const out: ItchyBoard[] = [];
  for (const seed of seeds) {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    const setup: BattleSetup = {
      game: 'ffx2', party: farplaneBuild, enemies: data.ENEMY_GROUPS_BY_ID[FALLEN_AEONS_CHAIN_ORDER[2]!]!,
      triggers: [], seed, condition: 'normal', canEscape: false,
    };
    engine.setSeed(seed);
    engine.init(setup);
    for (let i = 0; i < 20_000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
      if (d.kind !== 'player-input') continue;
      const input = d as Input;
      const state = engine.state();
      const view = buildAdvisorView(state, { actorId: input.actorId, commands: input.commands });
      if (state.combatants[input.actorId]?.statuses['itchy'] !== undefined) {
        out.push({ seed, actorId: input.actorId, commands: input.commands, suggestions: view?.suggestions ?? [] });
      }
      const top = view?.suggestions[0]?.command;
      const row = input.commands.find((c) => c.enabled && c.command.kind !== 'escape');
      engine.submit(top ?? ({ ...row!.command, targets: row!.validTargets.slice(0, 1) } as Command));
    }
  }
  return out;
}

describe('FOC22-02: the advisor names only what an Itchy girl\'s menu offers (FFX-2, Chapter XI)', () => {
  const boards = itchyBoards([1, 2, 3]);

  it('reaches Itchy boards at all (Pain lands it on the Anima link)', () => {
    expect(boards.length).toBeGreaterThan(0);
  });

  it('the menu for an Itchy girl is Change only, and the lock is recognised', () => {
    for (const b of boards) {
      const offered = b.commands.filter((c) => c.enabled && c.command.kind !== 'escape');
      expect(offered.every((c) => c.command.kind === 'spherechange')).toBe(true);
      expect(lockedToChange(b.commands)).toBe(true);
    }
  });

  it('the card names Change on every Itchy board, never an item or a spell', () => {
    for (const b of boards) {
      expect(b.suggestions.length, `seed ${b.seed} ${b.actorId}`).toBeGreaterThan(0);
      for (const s of b.suggestions) {
        expect(s.command.kind, `seed ${b.seed} ${b.actorId}: ${s.label} in ${s.menu}`).toBe('spherechange');
        expect(s.menu).toBe('Change');
        expect(s.reason).toMatch(/Itchy/);
      }
    }
  });

  it('every named Change is a row on that menu, by the name the Change submenu prints', () => {
    for (const b of boards) {
      for (const s of b.suggestions) {
        const row = ownedRow(b.commands, s.command);
        expect(row).not.toBeNull();
        expect(sameCommand(row!.command, s.command)).toBe(true);
        // `ui/ffx2/CommandMenu.ts#spherechangeLabel`: "Black Mage", "Gunner".
        expect(s.label).toBe(changeLabel(row!.command));
        expect(s.label).toMatch(/^[A-Z][a-z]+( [A-Z][a-z]+)*( \(Special\))?$/);
      }
    }
  });

  it('two Change rows are two commands: the destination is part of the identity', () => {
    const b = boards.find((x) => x.commands.filter((c) => c.command.kind === 'spherechange').length >= 2)!;
    const [a, c] = b.commands.filter((x) => x.command.kind === 'spherechange');
    expect(sameCommand(a!.command, c!.command)).toBe(false);
    expect(ownedRow(b.commands, c!.command)).toBe(c);
  });

  it('a menu with anything else on it is not locked', () => {
    const attack = { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: [] } as unknown as AvailableCommand;
    const change = boards[0]!.commands.find((c) => c.command.kind === 'spherechange')!;
    expect(lockedToChange([attack, change])).toBe(false);
    expect(lockedToChange([{ ...attack, enabled: false }, change])).toBe(true);
    expect(lockedToChange([])).toBe(false);
  });
});
