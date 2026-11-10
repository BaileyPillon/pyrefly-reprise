/**
 * The menus of a Special form's three plates, read off the real FFX-2 engine on a CHAPTER'S OWN party build (FFX-2 only: the three Special dresspheres exist only in FFX-2; the
 * `specialDressUp` switch is OFF in every build and ON here).
 *
 * Why this exists: the end-to-end specs (`tests/e2e/pause-with-form.spec.ts`, `special-touch-aim.spec.ts`) play a girl into her Special in the chapter she reaches it in and then open rows
 * by name. They are written and not run, so the names were once taken from the test helper's mastered rig (`specialFormState.ts#formUp`), which offers rows the chapter's own build does not
 * (review finding R3-2: Ma'at's Feather on Paine's left wing). This helper plays the same walk on `setupForChapter(chapter)`, the very setup the app builds, with the chapter's own
 * `buildRef`, and returns what each plate is offered, row by row, so a probe can print it and `special-e2e-rows.test.ts` can pin the e2e's row tables to it.
 *
 * The girls are kept alive by the same rig `specialDrive.walkTo` uses (`immortal`: a measurement input, never game data), and every plate is topped up between decisions, so a part
 * that Bahamut or Vegnagun knocks out cannot change the menu being read.
 */

import type { AvailableCommand, Command } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, type Chapter } from '../../../src/data/encounters.ts';
import { dressphereLabel } from '../../../src/ui/ffx2/dressphereIcons.ts';
import { leaveLabelOf } from '../../../src/ui/ffx2/specialLeave.ts';
import { resolveTargetMode } from '../../../src/ui/ffx/CommandMenuLogic.ts';
import { PASS_ROWS, ROW_CHANGE, firstPresent, nextChangeRow } from '../../e2e/support/special-rows.ts'; // the e2e's own rows and walk rules: one definition
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { nextInput, specialRow, unit, walkTo, type Input } from './specialDrive.ts';

/**
 * What the FFX-2 command window does with a row once it is picked (`chooseLeaf` in `ui/ffx2/CommandMenu.ts`): a row with no valid target is sent at once (`none`); a row whose `resolveTargetMode`
 * (`ui/ffx/CommandMenuLogic.ts`) is `all` opens a group cursor on every valid target (`all`); every other row opens a cursor on one target, even when only one is valid (`single`).
 */
export type Aim = 'single' | 'all' | 'none';

export interface MenuRow {
  /** The ability id (or the row's command kind, or the dress a Change row leads to). */
  id: string;
  /** The text the menu prints on the row (`.ffx2cmd__label`): the engine's `label`, except a Change row, which the menu names by the dress. */
  label: string;
  category: string;
  kind: string;
  enabled: boolean;
  disabledReason: string | null;
  /** The ability's own `Targeting` ('single-enemy', 'all-enemies', 'single-ally', ...), or null when the row carries none. */
  targeting: string | null;
  aim: Aim;
  /** `validTargets`, in the engine's order. */
  targets: string[];
  /** Which sides `targets` come from, from the live state: 'enemy', 'party', 'mixed' or 'none'. */
  side: 'enemy' | 'party' | 'mixed' | 'none';
}

/** One top-level entry of the FFX-2 command window: a leaf row, or a category that opens a submenu (the grouping rule of `groupRows` in `ui/ffx2/CommandMenu.ts`, which is not exported). */
export type UiEntry = { leaf: string } | { group: string; items: string[] };

export interface PlateMenu {
  actor: string;
  rows: MenuRow[];
  ui: UiEntry[];
}

const CATEGORY_LABELS: Record<string, string> = { attack: 'Attack', skill: 'Skill', special: 'Special', blackmagic: 'Black Magic', whitemagic: 'White Magic', summon: 'Summon', overdrive: 'Overdrive', aeon: 'Aeon', item: 'Item', dressphere: 'Dressphere', enemy: 'Enemy' };

const isChange = (c: AvailableCommand): boolean => c.command.kind === 'spherechange';

/** The label the menu prints for a row: `spherechangeLabel` and `leafRowHtml` of `ui/ffx2/CommandMenu.ts`, built from the same exported pieces. */
export function labelOf(c: AvailableCommand): string {
  const cmd = c.command;
  if (cmd.kind !== 'spherechange') return c.label;
  const leave = leaveLabelOf(c);
  if (leave) return leave;
  return cmd.extra.specialDressUp ? `${dressphereLabel(cmd.extra.toDressphere)} (Special)` : dressphereLabel(cmd.extra.toDressphere);
}

/** The window's top level for a decision's commands: categories in first-seen order, a category of one command as a leaf, every Change row in one `Change` submenu. */
export function uiOf(commands: readonly AvailableCommand[]): UiEntry[] {
  const order: string[] = [];
  const groups = new Map<string, AvailableCommand[]>();
  for (const c of commands) {
    const key = isChange(c) ? '__change' : c.category;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(c);
  }
  return order.map((key): UiEntry => {
    const items = groups.get(key)!;
    if (key === '__change') return { group: 'Change', items: items.map(labelOf) };
    if (items.length === 1) return { leaf: labelOf(items[0]!) };
    return { group: CATEGORY_LABELS[key] ?? key, items: items.map(labelOf) };
  });
}

function idOf(c: AvailableCommand): string {
  const cmd = c.command as Command & { id?: string; extra?: { toDressphere?: string } };
  if (cmd.kind === 'spherechange') return cmd.extra?.toDressphere ?? 'spherechange';
  return cmd.id ?? cmd.kind;
}

export function menuRows(d: Input, engine: FFX2Engine): MenuRow[] {
  const sideOf = (id: string): string => (engine.state().combatants[id] as { side: string }).side;
  return d.commands.map((c) => {
    const sides = new Set(c.validTargets.map(sideOf));
    const aim: Aim = c.validTargets.length === 0 ? 'none' : resolveTargetMode(c).mode === 'all' ? 'all' : 'single';
    return {
      id: idOf(c),
      label: labelOf(c),
      category: c.category,
      kind: c.command.kind,
      enabled: c.enabled,
      disabledReason: c.disabledReason ?? null,
      targeting: c.targeting ?? null,
      aim,
      targets: [...c.validTargets],
      side: sides.size === 0 ? 'none' : sides.size > 1 ? 'mixed' : sides.has('enemy') ? 'enemy' : 'party',
    };
  });
}

export const chapterOf = (id: string): Chapter => {
  const chapter = CHAPTERS.find((c) => c.id === id);
  if (!chapter) throw new Error(`no chapter ${id}`);
  return chapter;
};

/** The real engine for a chapter, set up exactly as the app sets the first link up (`setupForChapter`), the switch on, the chapter's own party build (cloned). */
export function openChapter(chapterId: string, seed = 1, specials = true): FFX2Engine {
  const chapter = chapterOf(chapterId);
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...(specials ? { specialDressUp: true } : {}) }));
  engine.setSeed(seed);
  const setup = setupForChapter(chapter, seed);
  engine.init({ ...setup, party: structuredClone(setup.party) });
  return engine;
}

const topUpAll = (engine: FFX2Engine, ids: readonly string[]): void => {
  for (const id of ids) {
    const u = unit(engine, id);
    if (u.alive) u.hp = u.stats.maxHp;
  }
};

/** Walk `girl` along her own Garment Grid to the offer of her Special on `engine` and pick it. Throws when the walk never reaches the offer. Returns the engine's live party ids afterwards. */
export function intoSpecialOnChapter(engine: FFX2Engine, girl: string): string[] {
  const walk = walkTo(engine, girl, { immortal: true });
  if (walk.input === null) throw new Error(`${girl}: the walk never reached the offer of her Special`);
  const row = specialRow(walk.input);
  if (!row) throw new Error(`${girl}: no Special Dress Up row on the decision`);
  engine.submit(row.command);
  return [...engine.state().activeIds];
}

/**
 * Play on, every plate topped up and every decision answered with Defend, and keep the menu of each of the three plates (`girl`, then `parts`) the first `times` times it is asked. Throws if
 * a plate is not asked `times` times within `budget` decisions.
 */
export function collectPlateMenus(engine: FFX2Engine, girl: string, parts: readonly string[], times = 2, budget = 600): Record<string, PlateMenu[]> {
  const plates = [girl, ...parts];
  const seen: Record<string, PlateMenu[]> = Object.fromEntries(plates.map((p) => [p, [] as PlateMenu[]]));
  for (let i = 0; i < budget; i++) {
    topUpAll(engine, [...plates, 'yuna', 'rikku', 'paine']);
    const d = nextInput(engine);
    if (d === null) break;
    const mine = seen[d.actorId];
    if (mine && mine.length < times) mine.push({ actor: d.actorId, rows: menuRows(d, engine), ui: uiOf(d.commands) });
    if (plates.every((p) => seen[p]!.length >= times)) return seen;
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error(`${girl}: the plates were not all asked ${times} times in ${budget} decisions: ${plates.map((p) => `${p}=${seen[p]!.length}`).join(' ')}`);
}

export interface GreedyWalk {
  reached: boolean;
  /** One line per menu answered, in order. */
  decisions: string[];
  /** Why the walk stopped short, or null when it reached the form. */
  failure: string | null;
  /** How many of the girl's menus came with the foe's Curse on her and the rig off (the Change list is then greyed whole); absent when none. */
  cursedMenus?: number;
}

/**
 * The walk of `tests/e2e/support/special-walk.ts#walkToForm` on the real engine: at every menu of another plate take the first of `PASS_ROWS` the menu shows enabled, at the first valid target;
 * at the girl's menu take the Change row `nextChangeRow` (the e2e's own rule, from the same file) picks among the rows the menu prints; stop when her two parts are in the live list. Capped at
 * `cap` menus, as the spec is. The rigs are the ones `specialDrive.walkTo` has: the girls' HP is topped up between menus, and with `liftCurse` the foe's Curse is taken off the girl before her
 * menu is read (the page has no such rig: Curse greys the whole Change list; the measured hazard is in the handoff, section 15).
 */
export function greedyWalk(chapterId: string, girl: string, parts: readonly string[], opts: { cap?: number; liftCurse?: boolean } = {}): GreedyWalk {
  const cap = opts.cap ?? 60;
  const engine = openChapter(chapterId);
  const worn = new Set<string>();
  const out: GreedyWalk = { reached: false, decisions: [], failure: null };
  for (let n = 0; n < cap; n++) {
    topUpAll(engine, ['yuna', 'rikku', 'paine']);
    const d = nextInput(engine);
    if (d === null) return { ...out, failure: 'the battle ended' };
    if (parts.every((p) => engine.state().activeIds.includes(p))) return { ...out, reached: true };
    if (d.actorId !== girl) {
      const plain = d.commands.filter((c) => !isChange(c));
      const pass = firstPresent(PASS_ROWS, plain.map(labelOf), plain.map((c) => !c.enabled));
      const row = pass && plain.find((c) => labelOf(c) === pass.label);
      if (!pass || !row) return { ...out, failure: `${d.actorId}'s menu offers none of ${PASS_ROWS.map((p) => p.label).join(', ')}: ${plain.map(labelOf).join(' | ')}` };
      engine.submit({ ...row.command, targets: row.validTargets.slice(0, 1) } as Command);
      out.decisions.push(`${d.actorId}: ${pass.label}`);
      continue;
    }
    const cursed = unit(engine, girl).statuses['curse'] !== undefined;
    if (opts.liftCurse && cursed) delete unit(engine, girl).statuses['curse']; // as `walkTo` does; the rows it greyed ("Cursed") are then picked as if enabled
    else if (cursed) out.cursedMenus = (out.cursedMenus ?? 0) + 1;
    const change = d.commands.filter(isChange);
    const labels = change.map(labelOf);
    const next = nextChangeRow(labels, change.map((c) => !c.enabled && !(opts.liftCurse && c.disabledReason === 'Cursed')), worn);
    if (next < 0) return { ...out, failure: `${girl}: the Change list offers no unworn dress: ${labels.join(' | ') || '(no Change row)'}` };
    worn.add(labels[next]!);
    out.decisions.push(`${girl}: ${ROW_CHANGE} -> ${labels[next]}`);
    engine.submit(change[next]!.command);
  }
  return { ...out, failure: `${girl} did not reach her Special within ${cap} menus: ${out.decisions.join(' ; ')}` };
}

/** The first menu each girl is asked for on a chapter's own build, before anyone has changed (everyone answers Defend until all three have been asked). */
export function startMenus(chapterId: string, seed = 1): Record<string, PlateMenu> {
  const engine = openChapter(chapterId, seed);
  const first: Record<string, PlateMenu> = {};
  for (let i = 0; i < 40 && Object.keys(first).length < 3; i++) {
    const d = nextInput(engine);
    if (d === null) break;
    first[d.actorId] ??= { actor: d.actorId, rows: menuRows(d, engine), ui: uiOf(d.commands) };
    engine.submit({ kind: 'defend', targets: [] });
  }
  return first;
}

/** A girl in her Special on a chapter's own build, and the menus of her three plates. */
export function chapterPartMenus(chapterId: string, girl: string, parts: readonly string[], opts: { seed?: number; times?: number } = {}): { engine: FFX2Engine; active: string[]; menus: Record<string, PlateMenu[]> } {
  const engine = openChapter(chapterId, opts.seed ?? 1);
  const active = intoSpecialOnChapter(engine, girl);
  return { engine, active, menus: collectPlateMenus(engine, girl, parts, opts.times ?? 2) };
}
