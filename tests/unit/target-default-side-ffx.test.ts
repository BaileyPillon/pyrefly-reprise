// @vitest-environment jsdom
/**
 * **Where the target cursor opens, FFX.** Bailey, live build, 2026-09-24:
 * "when i click an attack it defaults to targeting my party member instead of
 * the enemy so every time i have to move the targeting reticule to the enemy".
 *
 * Reproduced on the live site with real keys, every FFX chapter: Attack and
 * every `single-enemy` row already opened on an enemy (they list nothing else);
 * the `single-any` rows — Dispel, Reflect, Phoenix Down, Copycat — list the
 * party too, and opened on the leftmost figure, a party member. Dispel (which
 * strips an enemy's buffs) is the FFX case of the bug; a revive also now opens
 * on a KO'd member first. Rule (standard FF convention; the research files do
 * not state one): `src/battle/common/aim.ts`.
 *
 * **Game case: both** [AGENTS.md rule 14] — the rule is shared plumbing; this
 * file proves FFX's half on the CTB engine and the FFX menu, and the shared
 * `TargetCursor` both menus open through.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { AnyCombatant, AvailableCommand, BattleSetup, CombatantId, Command, Decision } from '../../src/battle/common/types.ts';
import { aimSideOf, isRevive } from '../../src/battle/common/aim.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import * as data from '../../src/data/ffx/index.ts';
import { CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { CommandMenu } from '../../src/ui/ffx/CommandMenu.ts';
import { TargetCursor, type TargetEntry } from '../../src/ui/ffx/TargetCursor.ts';

type Engine = ReturnType<typeof createFFXEngine>;
type Input = Extract<Decision, { kind: 'player-input' }>;

const FFX_CHAPTERS = CHAPTERS.filter((c) => c.game === 'ffx');

function engineFor(chapter: Chapter, seed = 1): Engine {
  const content = new FFXContentRegistry();
  content.addAbilities(data.ALL_ABILITIES);
  content.addItems(Object.values(data.ITEMS));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx', party: chapter.buildRef, enemies: chapter.enemyGroupRef, triggers: chapter.scriptsRef?.mid ?? [],
    seed, condition: 'normal', canEscape: false,
  } as BattleSetup);
  return engine;
}

/** The first `count` player decisions, each answered with an Attack on the last listed enemy. */
function decisions(chapter: Chapter, count: number): Array<{ d: Input; engine: Engine; down: CombatantId[] }> {
  const engine = engineFor(chapter);
  const out: Array<{ d: Input; engine: Engine; down: CombatantId[] }> = [];
  for (let i = 0; i < 5_000 && out.length < count; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    // Who is down *now*: the engine moves on after the submit below.
    const down = Object.values(engine.state().combatants)
      .filter((c) => c.side !== 'enemy' && (c.hp <= 0 || c.statuses.ko !== undefined))
      .map((c) => c.id);
    out.push({ d, engine, down });
    const atk = d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.length > 0);
    engine.submit((atk ? { ...atk.command, targets: [atk.validTargets.at(-1)!] } : { kind: 'defend', targets: [] }) as Command);
  }
  return out;
}

const ability = (id: string) => {
  const def = data.ALL_ABILITIES.find((a) => a.id === id);
  if (!def) throw new Error(`no ability ${id}`);
  return def;
};

describe('FFX: which side each command opens on', () => {
  it.each(['dispel', 'copycat'])('%s opens on an enemy', (id) => {
    expect(aimSideOf(ability(id))).toBe('foe');
  });
  it.each(['cure', 'esuna', 'reflect'])('%s opens on a party member', (id) => {
    expect(aimSideOf(ability(id))).toBe('ally');
  });
});

describe('FFX engine: every single-target row that lists both sides says which side opens', () => {
  it.each(FFX_CHAPTERS.map((c) => [c.id, c] as const))('%s', (_id, chapter) => {
    let bothSided = 0;
    for (const { d, engine } of decisions(chapter, 12)) {
      const all = engine.state().combatants;
      const enemy = (id: CombatantId) => all[id]?.side === 'enemy';
      for (const row of d.commands) {
        if (row.command.kind === 'attack') expect(row.validTargets.every(enemy), 'Attack lists only enemies').toBe(true);
        if (row.targeting !== 'single-any' || new Set(row.validTargets.map(enemy)).size < 2) continue;
        bothSided += 1;
        const preferred = row.preferredTargets ?? [];
        expect(preferred.length, `${d.actorId} ${row.label}`).toBeGreaterThan(0);
        expect(new Set(preferred.map(enemy)).size, `${d.actorId} ${row.label}`).toBe(1);
        for (const id of preferred) expect(row.validTargets).toContain(id);
        if (row.label === 'Dispel') expect(preferred.every(enemy)).toBe(true);
        if (row.label === 'Phoenix Down' || row.label === 'Reflect') expect(preferred.some(enemy)).toBe(false);
      }
    }
    expect(bothSided).toBeGreaterThan(0); // every FFX chapter carries Phoenix Downs
  });

  it("a revive opens on the KO'd party members while anyone is down", () => {
    let checked = 0;
    for (const chapter of FFX_CHAPTERS) {
      for (const { d, down: fallen } of decisions(chapter, 40)) {
        for (const row of d.commands) {
          if (row.command.kind !== 'item' || row.label !== 'Phoenix Down') continue;
          const down = row.validTargets.filter((id) => fallen.includes(id));
          if (down.length === 0) continue;
          checked += 1;
          expect(row.preferredTargets).toEqual(down);
        }
      }
    }
    expect(checked, 'no party member went down in the sampled turns').toBeGreaterThan(0);
  });
});

// ------------------------------------------------------------- the menu, real keys

function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
}

/** Chapter 2's first Yuna turn: White Magic carries Dispel and Reflect, Items a Phoenix Down. */
function yunasTurn(): { engine: Engine; commands: AvailableCommand[] } {
  const x = decisions(FFX_CHAPTERS.find((c) => c.id === 'yunalesca')!, 8).find((y) => y.d.actorId === 'yuna');
  if (!x) throw new Error("never reached Yuna's turn");
  return { engine: x.engine, commands: x.d.commands };
}

describe('FFX menu, real keys: Dispel opens on Yunalesca although the party stands left', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  function open() {
    const { engine, commands } = yunasTurn();
    const menu = new CommandMenu();
    // Party at the left, the boss at the right: the field as FFX frames it.
    const X: Record<string, number> = { tidus: 100, yuna: 60, auron: 180, yunalesca: 800 };
    menu.setProjector((id) => ({ x: X[id] ?? 400, y: 300, w: 120, h: 260 }));
    document.body.append(menu.stackEl, menu.breadcrumbEl, menu.targetCursor.el);
    let aimed: CombatantId | null = null;
    const done = menu.open({
      actorId: 'yuna',
      commands,
      previewRank: () => [],
      combatants: engine.state().combatants as Record<CombatantId, AnyCombatant>,
      setHelp: () => {},
      onTargetChange: (id) => {
        aimed = id;
      },
    });
    return { menu, done, aimed: () => aimed };
  }
  const selected = (): string => document.querySelector('.ig-cmd--selected .ffx-cmd__label')?.textContent ?? '';
  const walkTo = (label: string): void => {
    for (let i = 0; i < 30 && selected() !== label; i++) key('ArrowDown');
    expect(selected()).toBe(label);
  };

  it('White Magic > Dispel opens on Yunalesca; the arrows still reach the party; Enter submits her', async () => {
    const h = open();
    walkTo('White Magic');
    key('Enter');
    walkTo('Dispel');
    key('Enter');
    expect(h.menu.targetCursor.activeTargetId).toBe('yunalesca');
    key('ArrowRight'); // wraps to the leftmost figure, Yuna
    expect(h.menu.targetCursor.activeTargetId).toBe('yuna');
    key('ArrowLeft');
    expect(h.menu.targetCursor.activeTargetId).toBe('yunalesca');
    key('Enter');
    expect(await h.done).toMatchObject({ kind: 'ability', id: 'dispel', targets: ['yunalesca'] });
  });

  it('Items > Phoenix Down opens on a party member, not on the boss', () => {
    const h = open();
    walkTo('Items');
    key('Enter');
    walkTo('Phoenix Down');
    key('Enter');
    expect(['tidus', 'yuna', 'auron']).toContain(h.menu.targetCursor.activeTargetId);
  });

  it('White Magic > Reflect opens on a party member', () => {
    const h = open();
    walkTo('White Magic');
    key('Enter');
    walkTo('Reflect');
    key('Enter');
    expect(h.menu.targetCursor.activeTargetId).toBe('yuna');
  });
});

describe('TargetCursor.showSingle(prefer) — shared by both menus', () => {
  const RECTS: Record<string, { x: number; y: number; w: number; h: number }> = {
    yuna: { x: 50, y: 300, w: 80, h: 200 },
    rikku: { x: 200, y: 300, w: 80, h: 200 },
    'fiend-b': { x: 900, y: 200, w: 200, h: 300 },
    'fiend-a': { x: 600, y: 200, w: 200, h: 300 },
  };
  const ENTRIES: TargetEntry[] = [
    { id: 'yuna', name: 'Yuna', kind: 'self' },
    { id: 'rikku', name: 'Rikku', kind: 'ally' },
    { id: 'fiend-b', name: 'Fiend', kind: 'enemy', tag: 'B' },
    { id: 'fiend-a', name: 'Fiend', kind: 'enemy', tag: 'A' },
  ];
  const cursor = (): TargetCursor => {
    const c = new TargetCursor();
    c.setProjector((id) => RECTS[id] ?? null);
    document.body.append(c.el);
    return c;
  };

  it('opens on the leftmost preferred entry, then walks everything left to right', () => {
    const c = cursor();
    c.showSingle(ENTRIES, 0, ['fiend-b', 'fiend-a']);
    expect(c.activeTargetId).toBe('fiend-a');
    c.step(1);
    expect(c.activeTargetId).toBe('fiend-b');
    c.step(1);
    expect(c.activeTargetId).toBe('yuna');
  });

  it('without a preference it still opens on the leftmost, as before', () => {
    const c = cursor();
    c.showSingle(ENTRIES);
    expect(c.activeTargetId).toBe('yuna');
  });

  it('a preference that names nobody listed is ignored', () => {
    const c = cursor();
    c.showSingle(ENTRIES, 0, ['someone-else']);
    expect(c.activeTargetId).toBe('yuna');
  });

  it("isRevive knows FFX's Phoenix Down effect", () => {
    const item = data.ITEMS['phoenix-down' as keyof typeof data.ITEMS] as { effect?: unknown } | undefined;
    const effect = item?.effect;
    expect(effect && typeof effect === 'object').toBe(true);
    expect(isRevive(effect as Parameters<typeof isRevive>[0])).toBe(true);
  });
});
