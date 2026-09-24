// @vitest-environment jsdom
/**
 * **Where the target cursor opens, FFX-2.** Bailey, live build, 2026-09-24:
 * "when i click an attack it defaults to targeting my party member instead of
 * the enemy so every time i have to move the targeting reticule to the enemy".
 *
 * Reproduced on the live site with real keys: most X-2 skills are
 * `single-any` (Power Break, Drain, Doom, Death, Cheap Shot...), so the cursor
 * listed the girls too and opened on the leftmost figure on screen, Yuna.
 * Rule (standard FF convention; the research files do not state one): an
 * offensive command opens on an enemy, a cure or a buff on a girl, a revive on
 * a KO'd girl first (`src/battle/common/aim.ts`).
 *
 * **Game case: both** [AGENTS.md rule 14] — the rule is shared plumbing; this
 * file proves FFX-2's half on the X-2 engine and the X-2 menu.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleSetup, Command, CombatantId, Decision } from '../../src/battle/common/types.ts';
import { aimSideOf, preferredTargetIds } from '../../src/battle/common/aim.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';

const FFX2_CHAPTERS = CHAPTERS.filter((c) => c.game === 'ffx2');

function engineFor(chapter: Chapter, seed = 1): FFX2Engine {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
  });
  engine.init({
    game: 'ffx2', party: chapter.buildRef, enemies: chapter.enemyGroupRef, triggers: [],
    seed, condition: 'normal', canEscape: false,
  } as BattleSetup);
  return engine;
}

type Input = Extract<Decision, { kind: 'player-input' }>;

/** The first `count` player decisions of a chapter, each answered with an Attack. */
function decisions(chapter: Chapter, count: number): Array<{ d: Input; engine: FFX2Engine }> {
  const engine = engineFor(chapter);
  const out: Array<{ d: Input; engine: FFX2Engine }> = [];
  for (let i = 0; i < 50_000 && out.length < count; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
    if (d.kind !== 'player-input') continue;
    out.push({ d, engine });
    const atk = d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.length > 0);
    engine.submit((atk ? { ...atk.command, targets: [atk.validTargets[0]!] } : { kind: 'defend', targets: [] }) as Command);
  }
  return out;
}

const ability = (id: string) => {
  const def = data.ABILITIES[id as keyof typeof data.ABILITIES];
  if (!def) throw new Error(`no ability ${id}`);
  return def;
};

describe('FFX-2: which side each command opens on', () => {
  it.each([
    'x2-warrior-power-break', 'x2-warrior-flametongue', 'x2-dark-knight-drain', 'x2-dark-knight-doom',
    'x2-gunner-cheap-shot', 'x2-white-mage-dispel',
  ])('%s opens on an enemy', (id) => {
    expect(aimSideOf(ability(id))).toBe('foe');
  });

  it.each(['x2-white-mage-cure', 'x2-white-mage-esuna', 'x2-white-mage-regen', 'x2-shared-hero-drink'])(
    '%s opens on a girl',
    (id) => {
      expect(aimSideOf(ability(id))).toBe('ally');
    },
  );
});

describe('FFX-2 engine: every single-target row that lists both sides says which side opens', () => {
  it.each(FFX2_CHAPTERS.map((c) => [c.id, c] as const))('%s', (_id, chapter) => {
    let bothSided = 0;
    for (const { d, engine } of decisions(chapter, 12)) {
      const units = engine.state().combatants;
      const sideOf = (id: CombatantId) => units[id]?.side;
      for (const row of d.commands) {
        const sides = new Set(row.validTargets.map(sideOf));
        if (row.targeting !== 'single-any' || sides.size < 2) continue;
        bothSided += 1;
        const preferred = row.preferredTargets ?? [];
        expect(preferred.length, `${d.actorId} ${row.label}`).toBeGreaterThan(0);
        expect(new Set(preferred.map(sideOf)).size, `${d.actorId} ${row.label}`).toBe(1);
        for (const id of preferred) expect(row.validTargets).toContain(id);
        // Anything that deals damage opens on the enemy.
        const def = row.command.kind === 'ability' ? ability(row.command.id) : null;
        if (def && def.power > 0 && !def.flags.includes('heals') && def.formula !== 'healing') {
          expect(preferred.every((id) => sideOf(id) === 'enemy'), `${d.actorId} ${row.label}`).toBe(true);
        }
      }
    }
    // Every X-2 chapter's opening turns carry single-any skills (Esuna, Dispel, the Breaks, Drain).
    expect(bothSided).toBeGreaterThan(0);
  });

  it("Chapter 4: Paine's Power Break opens on Bahamut, not on Yuna", () => {
    const paine = decisions(FFX2_CHAPTERS.find((c) => c.id === 'ffx2-bahamut')!, 6).find((x) => x.d.actorId === 'paine');
    const row = paine?.d.commands.find((c) => c.label === 'Power Break');
    expect(row?.validTargets).toContain('yuna');
    expect(row?.preferredTargets).toEqual(['bahamut']);
  });

  it('Attack never needs a hint: it lists only enemies', () => {
    for (const chapter of FFX2_CHAPTERS) {
      for (const { d, engine } of decisions(chapter, 6)) {
        const atk = d.commands.find((c) => c.command.kind === 'attack');
        if (!atk) continue;
        expect(atk.validTargets.every((id) => engine.state().combatants[id]?.side === 'enemy')).toBe(true);
      }
    }
  });
});

describe('FFX-2: a revive opens on a KO\'d girl first', () => {
  const girls = [
    { id: 'yuna', side: 'party' as const, hp: 900, statuses: {} },
    { id: 'rikku', side: 'party' as const, hp: 0, statuses: { ko: {} } },
    { id: 'paine', side: 'party' as const, hp: 1100, statuses: {} },
  ];
  const phoenix = data.ITEMS['x2-phoenix-down' as keyof typeof data.ITEMS];
  const effect = typeof phoenix?.effect === 'string' ? ability(phoenix.effect) : phoenix?.effect;

  it('Phoenix Down (single-ally) prefers Rikku while she is down', () => {
    expect(effect).toBeTruthy();
    expect(preferredTargetIds(effect!, 'single-ally', 'party', girls)).toEqual(['rikku']);
  });

  it('with nobody down it gives no hint (every girl is fair)', () => {
    const up = girls.map((g) => ({ ...g, hp: 500, statuses: {} }));
    expect(preferredTargetIds(effect!, 'single-ally', 'party', up)).toBeUndefined();
  });
});

describe('FFX-2 menu, real keys: Skill > Power Break opens on the fiend although the girls stand left', () => {
  function paineTurn(): AvailableCommand[] {
    const x = decisions(FFX2_CHAPTERS.find((c) => c.id === 'ffx2-bahamut')!, 6).find((y) => y.d.actorId === 'paine');
    if (!x) throw new Error("never reached Paine's turn");
    return x.d.commands;
  }
  // Party left, the fiend right: the layout of every X-2 chapter on screen.
  const X: Record<string, number> = { yuna: 100, rikku: 250, paine: 400, bahamut: 900 };
  const key = (code: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
  };
  const active = (layer: HTMLElement): string | undefined =>
    layer.querySelector<HTMLElement>('.ffx-target:not(.ffx-target--dim)')?.dataset['targetId'];
  const selected = (c: HTMLElement): string => c.querySelector('.ig-cmd--selected .ffx2cmd__label')?.textContent ?? '';
  const walkTo = (c: HTMLElement, label: string): void => {
    for (let i = 0; i < 30 && selected(c) !== label; i++) key('ArrowDown');
    expect(selected(c)).toBe(label);
  };

  it('opens on Bahamut; the arrows still reach the girls; Enter submits Bahamut', async () => {
    document.body.innerHTML = '';
    const container = document.createElement('div');
    const targetLayer = document.createElement('div');
    document.body.append(container, targetLayer);
    const done = openCommandMenu({
      container,
      targetLayer,
      commands: paineTurn(),
      previewRank: () => ({ elapsedMs: 0, bars: [] }),
      project: (id) => ({ x: X[id] ?? 0, y: 300 }),
      projectRect: (id) => ({ x: X[id] ?? 0, y: 200, w: 100, h: 200 }),
      onPreview: () => {},
      actorName: 'Paine',
      kindOf: (id) => (id === 'bahamut' ? 'enemy' : id === 'paine' ? 'self' : 'ally'),
    });
    walkTo(container, 'Skill');
    key('Enter');
    walkTo(container, 'Power Break');
    key('Enter');
    expect(active(targetLayer)).toBe('bahamut');
    key('ArrowRight'); // wraps to the leftmost figure
    expect(active(targetLayer)).toBe('yuna');
    key('ArrowLeft');
    expect(active(targetLayer)).toBe('bahamut');
    key('Enter');
    const cmd = await done;
    expect(cmd).toMatchObject({ kind: 'ability', id: 'x2-warrior-power-break', targets: ['bahamut'] });
  });
});
