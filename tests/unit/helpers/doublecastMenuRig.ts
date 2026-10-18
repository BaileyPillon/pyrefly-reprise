/**
 * The rig behind the Doublecast menu tests (FFX only): Chapter III's Lulu on her own turn, the real command list the FFX engine offers her, the real
 * `CommandMenu` driven by real `KeyboardEvent`s, and a stub of what the HUD hands the menu (`CommandMenuPort`).
 *
 * Chapter III gives Lulu One MP Cost, so every spell costs 1 and nothing can grey. The "disclosed edit" (the same one the mockups used, and the real-key browser check)
 * strips that one auto-ability from the engine's own copy of her and sets her MP, so the costs are the engine's real unmodified ones (Fire 4, Fira 8, Firaga 16, Bio 10).
 */

import { expect } from 'vitest';
import type { AnyCombatant, AvailableCommand, CombatantId, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../../src/data/ffx/builds/dreams-end.ts';
import { CommandMenu } from '../../../src/ui/ffx/CommandMenu.ts';
import type { CommandMenuPort } from '../../../src/ui/ffx/DoublecastFlow.ts';
import type { DoublecastView } from '../../../src/ui/ffx/doublecastModel.ts';
import type { DoublecastHelp } from '../../../src/ui/ffx/doublecastText.ts';
import type { CursorSelection } from '../../../src/ui/ffx/TargetCursor.ts';

export type Engine = ReturnType<typeof createFFXEngine>;

export interface RigOptions {
  /** Strip One MP Cost from Lulu and set her MP to this (the disclosed edit); omitted, Chapter III as shipped. */
  mp?: number;
  seed?: number;
}

/** Chapter III, Lulu's first Doublecast turn (Auron swaps her in, as the round 09 probe does). */
export function lulusTurn(opts: RigOptions = {}): { engine: Engine; commands: AvailableCommand[] } {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const seed = opts.seed ?? 1;
  const e = createFFXEngine({ content, autoResolveMinigames: true });
  e.setSeed(seed);
  e.init({ game: 'ffx', party: structuredClone(dreamsEndBuild), enemies: ENEMY_GROUPS_BY_ID['braskas-final-aeon']!, triggers: [], seed, condition: 'normal', canEscape: false } as never);
  if (opts.mp !== undefined) {
    const lulu = e.state().combatants['lulu'] as unknown as { mp: number; equipment?: Record<string, { autoAbilities?: string[] } | undefined> };
    for (const piece of Object.values(lulu.equipment ?? {})) if (piece?.autoAbilities) piece.autoAbilities = piece.autoAbilities.filter((a) => a !== 'one-mp-cost');
    lulu.mp = opts.mp;
  }
  for (let i = 0; i < 400; i++) {
    const d = e.nextDecision() as Decision;
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    if (d.actorId === 'lulu' && d.commands.some((c) => c.enabled && (c.command as { id?: string }).id === 'doublecast')) return { engine: e, commands: d.commands };
    if (d.actorId === 'auron' && !e.state().activeIds.includes('lulu')) {
      e.submit({ kind: 'switch', targets: [], extra: { outId: 'auron', inId: 'lulu' } } as unknown as Command);
      continue;
    }
    const atk = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
    const t = atk?.validTargets.find((x) => x.startsWith('yu-pagoda')) ?? atk?.validTargets[0];
    e.submit((atk ? { ...atk.command, targets: t ? [t] : [] } : { kind: 'defend', targets: [] }) as Command);
  }
  throw new Error("never reached Lulu's Doublecast");
}

export function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
}

export interface Harness {
  menu: CommandMenu;
  engine: Engine;
  commands: AvailableCommand[];
  /** The last plain help sentence the menu set. */
  help: () => string;
  /** The last two-line help offered to the HUD (null before any). */
  rich: () => DoublecastHelp | null;
  /** Every view the menu published (null = cleared), newest last. */
  views: Array<DoublecastView | null>;
  aimed: () => CombatantId | null;
  selection: () => CursorSelection | null | undefined;
  resolved: () => Command | null;
  /** How many times the menu said an aim was cancelled. */
  cancels: () => number;
  done: Promise<Command>;
}

export interface OpenOptions extends RigOptions {
  /** Replace the engine's picker (a stub, for the "re-derives no rule" tests); `false` = hand the menu none. */
  picks?: CommandMenuPort['picks'] | false;
}

/** Open Lulu's menu on the real command list, with the real engine picker unless told otherwise. */
export function openMenu(opts: OpenOptions = {}): Harness {
  const { engine, commands } = lulusTurn(opts);
  const menu = new CommandMenu();
  const order = [...engine.state().enemyIds];
  // Left to right in the engine's own order, so ArrowRight steps through it.
  menu.setProjector((id) => ({ x: 100 + Math.max(0, order.indexOf(id)) * 200, y: 300, w: 120, h: 260 }));
  document.body.append(menu.stackEl, menu.breadcrumbEl, menu.pagerEl, menu.targetCursor.el);
  let help = '';
  let rich: DoublecastHelp | null = null;
  let aimed: CombatantId | null = null;
  let cancels = 0;
  const views: Array<DoublecastView | null> = [];
  const seen: Array<CursorSelection | null> = [];
  let resolved: Command | null = null;
  const picks = opts.picks === false ? undefined : (opts.picks ?? ((actorId: string, firstId?: string) => engine.doublecastPicks(actorId, firstId)));
  menu.setPort({
    ...(picks ? { picks } : {}),
    help: (h) => {
      rich = h;
    },
    view: (v) => views.push(v),
    aimCancelled: () => {
      cancels += 1;
    },
  });
  const done = menu.open({
    actorId: 'lulu',
    commands,
    previewRank: () => [],
    combatants: engine.state().combatants as Record<CombatantId, AnyCombatant>,
    setHelp: (t) => {
      help = t;
      rich = null;
    },
    onTargetChange: (id) => {
      aimed = id;
    },
    onSelection: (sel) => seen.push(sel),
    letterTagOf: (id) => (id === 'yu-pagoda-left' ? 'A' : id === 'yu-pagoda-right' ? 'B' : undefined),
  });
  void done.then((c) => {
    resolved = c;
  });
  return { menu, engine, commands, help: () => help, rich: () => rich, views, aimed: () => aimed, selection: () => seen.at(-1), resolved: () => resolved, cancels: () => cancels, done };
}

export const selectedLabel = (): string => document.querySelector('.ig-cmd--selected .ffx-cmd__label')?.textContent ?? '';

export const visibleLabels = (): string[] => [...document.querySelectorAll('.ig-cmd .ffx-cmd__label')].map((el) => el.textContent ?? '');

/** The labels of the rows drawn greyed. */
export const greyedLabels = (): string[] => [...document.querySelectorAll('.ig-cmd--disabled .ffx-cmd__label')].map((el) => el.textContent ?? '');

/** ArrowDown until the highlighted row reads `label` (the stack wraps). */
export function walkTo(label: string): void {
  for (let i = 0; i < 40 && selectedLabel() !== label; i++) key('ArrowDown');
  expect(selectedLabel(), `could not reach ${label}`).toBe(label);
}

/** ArrowRight until the cursor is on `id`. */
export function aimAt(h: Harness, id: CombatantId): void {
  for (let i = 0; i < 8 && h.aimed() !== id; i++) key('ArrowRight');
  expect(h.aimed()).toBe(id);
}

/** Special > Doublecast: round 1's list is open. */
export function openRoundOne(): void {
  walkTo('Special');
  key('Enter');
  walkTo('Doublecast');
  key('Enter');
}

/** Choose `spell` in the open list, aim at `target`, confirm. */
export function pick(h: Harness, spell: string, target: CombatantId): void {
  walkTo(spell);
  key('Enter');
  aimAt(h, target);
  key('Enter');
}
