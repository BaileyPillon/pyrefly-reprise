/**
 * **The commands a formation script switches off, in the engine** (re-parity RC10, lane "FFX Isaaru commands"; **FFX only**; the model of the game and the data are
 * `parity-ffx-isaaru-commands.test.ts`; the handoff is `docs/handoff/re-parity-rc10-ffx-isaaru-commands.md`):
 *
 * 1. **The engine** keeps the rows of those commands on Yuna's menu **greyed, with no reason** (the game's draw loop skips a row only for -4; a disabled command answers -1, so
 *    it is drawn greyed), so the only rows she can pick are Summon and Grand Summon; it refuses a submitted one with the turn kept open, leaves the aeons' menus and every
 *    other chapter alone, and applies "everyone" to a bigger party too.
 * 2. **The pure rule**: the mapping of a row to the game command (every kind and every ability category), whose side loses it, and the one switch.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import type { AbilityDef, AvailableCommand, Command, Decision, EnemyGroupDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXEngine, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../src/data/ffx/index.ts';
import { highbridgeBuild } from '../../src/data/ffx/builds/highbridge.ts';
import {
  COMMAND_OFF_ANY, FORMATION_COMMAND_DISABLES, GAME_COMMAND, applyFormationCommandDisables, commandOff, commandRefused, greyDisabledRows, menuCommandOf,
} from '../../src/battle/ffx/formation-commands.ts';
import { ONLY_AN_AEON } from '../../src/battle/ffx/aeon-duel.ts';
import { buildTopRows, firstEnabledIndex, rowEnabled } from '../../src/ui/ffx/CommandMenuLogic.ts';
import { topRowVM } from '../../src/ui/ffx/commandMenuRows.ts';
import { commandHelpText } from '../../src/ui/ffx/commandHelp.ts';
import { actor, content, grandSummon, newEngine, nextInput, pass, row, setupFor, type Input } from './helpers/isaaruUnits.ts';

/** The three formation files of Isaaru's contest and the engine group each one is (Fist, Wing and Sword are the first, second and third link). */
const ISAARU_FORMATIONS: Readonly<Record<string, string>> = { bvyt09_10: 'isaaru-grothia', bvyt09_11: 'isaaru-pterya', bvyt09_12: 'isaaru-spathi' };

// ---------------------------------------------------------------------------------------------------------------------- the engine

const LINK_IDS = Object.values(ISAARU_FORMATIONS) as ('isaaru-grothia' | 'isaaru-pterya' | 'isaaru-spathi')[];

/** A representative submitted command for each command the script switches off (and the ones it does not), as `submit()` would receive it. */
const SWITCHED_OFF: readonly [string, Command][] = [
  ['Attack', { kind: 'attack', targets: ['grothia'] }],
  ['Item', { kind: 'item', id: 'potion', targets: ['yuna'] }],
  ['White Magic', { kind: 'ability', id: 'cura', targets: ['yuna'] }],
  ['Special', { kind: 'ability', id: 'pray', targets: ['yuna'] }],
  ['Special (Scan)', { kind: 'ability', id: 'scan', targets: ['grothia'] }],
  ['Switch', { kind: 'switch', targets: [], extra: { outId: 'yuna', inId: 'auron' } }],
  ['Escape', { kind: 'escape', targets: [], extra: { mode: 'single' } }],
  ['Flee', { kind: 'escape', targets: [], extra: { mode: 'party' } }],
];

/** Is this a row the formation script switched off for Yuna (the game's Attack, Item, Skill, Special, Black Magic and White Magic commands, and Switch and Escape)? */
const isSwitchedOffRow = (c: AvailableCommand): boolean =>
  c.command.kind === 'attack' || c.command.kind === 'item' || c.command.kind === 'switch' || c.command.kind === 'escape'
  || (c.command.kind === 'ability' && ['skill', 'special', 'blackmagic', 'whitemagic'].includes(c.category));

describe('the engine: Yuna\'s menu in Isaaru\'s three battles can pick only Summon and Grand Summon; every other command is drawn greyed with no reason', () => {
  for (const [file, link] of Object.entries(ISAARU_FORMATIONS)) {
    it(`${file} (${link}): the rows she can pick are Summon rows and Grand Summon; the switched-off commands keep their rows, greyed, no reason; each is refused with the turn kept open`, () => {
      const engine = newEngine(link as (typeof LINK_IDS)[number], 3);
      expect(engine.state().flags[COMMAND_OFF_ANY]).toBe(true);
      const d = nextInput(engine)!;
      expect(d.actorId).toBe('yuna');
      const kinds = d.commands.map((c) => c.command.kind);
      expect(kinds.filter((k) => k === 'summon')).toHaveLength(5);
      // What she can pick (the cursor skips a greyed row): Summon and Grand Summon, and nothing else.
      expect(new Set(d.commands.filter((c) => c.enabled).map((c) => c.command.kind))).toEqual(new Set(['summon', 'overdrive']));
      // Greyed, not hidden (the game's draw loop skips a row only for -4; a disabled command answers -1): Attack, the Item rows, Skill, Special and the magic lists keep their
      // rows, `enabled: false`, and carry no `disabledReason` (the original prints none, not even the duel's older "Only an aeon can fight an aeon").
      const off = d.commands.filter(isSwitchedOffRow);
      for (const [kind, id] of [['attack', undefined], ['item', 'potion'], ['ability', 'cura'], ['ability', 'pray'], ['ability', 'scan']] as const) {
        expect(row(d.commands, kind, id), `${kind}:${id}`).toBeDefined();
      }
      expect(off.length).toBeGreaterThan(5);
      for (const c of off) {
        expect(c.enabled, c.label).toBe(false);
        expect(c.disabledReason, c.label).toBeUndefined();
        expect('disabledReason' in c, c.label).toBe(false);
      }
      expect(row(d.commands, 'overdrive', 'grand-summon')).toMatchObject({ enabled: true });
      expect(row(d.commands, 'trigger', 'talk')).toMatchObject({ enabled: false }); // greyed by the older B6 rule; no Isaaru script touches Talk (0x3105)
      const before = engine.state().log.length;
      for (const [name, cmd] of SWITCHED_OFF) expect(engine.submit(cmd), name).toEqual([]);
      expect(engine.state().log.length).toBe(before); // no action, no message, nothing spent
      expect(nextInput(engine)!.actorId).toBe('yuna'); // the turn is still hers
      // What stays open: Summon and Grand Summon work; the aeon's own menu is untouched (Attack, its abilities, Dismiss), and Dismiss works.
      engine.submit(grandSummon('shiva'));
      const a = nextInput(engine)!;
      expect(a.actorId).toBe('shiva');
      expect(a.commands.some((c) => c.command.kind === 'attack' && c.enabled)).toBe(true);
      expect(a.commands.some((c) => c.command.kind === 'ability')).toBe(true);
      expect(row(a.commands, 'dismiss')).toMatchObject({ enabled: true });
      expect(engine.submit({ kind: 'dismiss', targets: [] }).some((e) => e.type === 'dismiss')).toBe(true);
      expect(nextInput(engine)!.actorId).toBe('yuna');
    });
  }

  it('the lists are in the battle state, so a fork (the move advisor\'s dry runs) sees the same menu', () => {
    const engine = newEngine('isaaru-grothia', 4);
    const fork = (engine as ReturnType<typeof createFFXEngine>).fork(99);
    expect(fork.state().flags[COMMAND_OFF_ANY]).toBe(true);
    const commands = nextInput(fork)!.commands;
    expect(new Set(commands.filter((c) => c.enabled).map((c) => c.command.kind))).toEqual(new Set(['summon', 'overdrive']));
    expect(row(commands, 'attack')).toMatchObject({ enabled: false }); // greyed, not hidden, in the fork too
    expect(fork.submit({ kind: 'attack', targets: ['grothia'] })).toEqual([]);
  });

  it('no row of ours maps to Weapon or Armor (the original\'s equipment swaps, which the engine has no row for): those two disables take nothing away', () => {
    const ctx = { content: { ability: (id: string) => ALL_ABILITIES.find((a) => a.id === id) } } as never;
    for (const a of ALL_ABILITIES) {
      for (const cmd of [{ kind: 'ability', id: a.id, targets: [] }, { kind: 'overdrive', id: a.id, targets: [] }] as Command[]) {
        const id = menuCommandOf(ctx, cmd);
        expect(id === undefined || (id !== GAME_COMMAND.weapon && id !== GAME_COMMAND.armor), a.id).toBe(true);
      }
    }
  });

  it('with the list taken off the group, Yuna has her whole menu back (Attack, Cura, Pray, the items) and every command works', () => {
    const group = { ...(ENEMY_GROUPS_BY_ID['isaaru-grothia'] as EnemyGroupDef) };
    delete (group as { commandDisables?: unknown }).commandDisables;
    const e = createFFXEngine({ content, autoResolveMinigames: true });
    e.init({ ...setupFor('isaaru-grothia', 6), enemies: group });
    expect(e.state().flags[COMMAND_OFF_ANY]).toBeUndefined();
    const d = nextInput(e)!;
    for (const [kind, id] of [['attack', undefined], ['ability', 'cura'], ['ability', 'pray'], ['item', 'potion']] as const) expect(row(d.commands, kind, id), `${kind}:${id}`).toBeDefined();
    expect(e.submit({ kind: 'ability', id: 'cura', targets: ['yuna'] }).some((x) => x.type === 'action-start')).toBe(true);
  });

  it('a bigger party in the same battle: Switch, Escape and Flee are greyed for everyone (a bench, canEscape and a Flee row are all there), while Attack and the rest stay usable for everyone but Yuna', () => {
    const base = ENEMY_GROUPS_BY_ID['isaaru-grothia'] as EnemyGroupDef;
    const make = (group: EnemyGroupDef): Input[] => {
      const e = createFFXEngine({ content, autoResolveMinigames: true });
      e.init({ game: 'ffx', party: highbridgeBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: true });
      const seen: Input[] = [];
      for (let i = 0; i < 400 && !seen.some((s) => s.actorId === 'yuna'); i++) {
        const d = e.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        if (!seen.some((s) => s.actorId === d.actorId)) seen.push(d);
        if (d.actorId === 'yuna') break; // her first menu is what the test reads; the others' turns before it are spent on a move they can make
        e.submit(pass(d)); // a legal move to reach the others' turns; refusals leave the turn open, so only a legal one advances
      }
      return seen;
    };
    const plain = make({ ...base, canEscape: true, commandDisables: undefined });
    const off = make({ ...base, canEscape: true });
    const kindsOf = (ds: Input[], id: string) => ds.find((d) => d.actorId === id)?.commands.map((c) => c.command.kind) ?? [];
    // Without the list the highbridge party has the rows the test is about; with it, the three are gone for the member who is not Yuna, and Yuna's eight go too.
    const tidusPlain = kindsOf(plain, 'tidus');
    expect(tidusPlain.length).toBeGreaterThan(0);
    expect(tidusPlain).toContain('switch');
    expect(tidusPlain).toContain('escape');
    expect(plain.find((d) => d.actorId === 'tidus')!.commands.some((c) => c.command.kind === 'escape' && c.command.extra?.mode === 'party')).toBe(true);
    // The rows of a switched-off command are still drawn, greyed with no reason, and nothing the player can pick is left of them.
    const usable = (ds: Input[], id: string) => ds.find((d) => d.actorId === id)?.commands.filter((c) => c.enabled).map((c) => c.command.kind) ?? [];
    const greyedOf = (ds: Input[], id: string) => ds.find((d) => d.actorId === id)?.commands.filter((c) => !c.enabled && c.disabledReason === undefined).map((c) => c.command.kind) ?? [];
    expect(kindsOf(off, 'tidus')).toEqual(kindsOf(plain, 'tidus')); // the same rows are on the menu: greyed, not taken away
    const tidusUsable = usable(off, 'tidus');
    expect(tidusUsable.length).toBeGreaterThan(0);
    expect(tidusUsable).not.toContain('switch');
    expect(tidusUsable).not.toContain('escape'); // the Escape row and the Flee row are both `escape`
    // Attack is switched off for Yuna alone: Tidus's Attack row is on his menu with the duel's own older reason (only an aeon can fight an aeon), not the formation's no-reason grey.
    expect(row(off.find((d) => d.actorId === 'tidus')!.commands, 'attack')).toMatchObject({ enabled: false, disabledReason: ONLY_AN_AEON });
    expect(tidusUsable).toContain('item');
    expect(greyedOf(off, 'tidus')).toEqual(expect.arrayContaining(['switch', 'escape']));
    const yunaUsable = usable(off, 'yuna');
    for (const gone of ['attack', 'item', 'switch', 'escape', 'ability']) expect(yunaUsable, `yuna ${gone}`).not.toContain(gone);
    expect(greyedOf(off, 'yuna')).toEqual(expect.arrayContaining(['attack', 'item', 'switch', 'escape', 'ability']));
  });
});

describe('the FFX command window draws the greyed, reason-less rows (its pure view-model, no DOM)', () => {
  it("Yuna's first menu: Attack and the Item, Skill, Special and magic groups are greyed rows; the cursor opens on a Summon or Grand Summon row; the help slab prints the effect alone", () => {
    const d = nextInput(newEngine('isaaru-grothia', 3))!;
    const top = buildTopRows(d.commands);
    const attack = top.find((r) => r.kind === 'direct' && r.cmd.command.kind === 'attack')!;
    expect(attack, 'the Attack row is on the window').toBeDefined();
    expect(topRowVM(attack)).toMatchObject({ enabled: false, group: false });
    for (const category of ['item', 'special', 'whitemagic']) {
      const group = top.find((r) => r.kind === 'group' && r.category === category);
      expect(group, `the ${category} group is on the window`).toBeDefined();
      expect(rowEnabled(group!), category).toBe(false);
      expect(topRowVM(group!).enabled, category).toBe(false);
    }
    const first = top[firstEnabledIndex(top)]!;
    expect(first.kind === 'group' && (first.category === 'summon' || first.category === 'overdrive')).toBe(true);
    // The help slab: a greyed row with no reason prints the effect alone, never "undefined" and no "reason - " prefix.
    const cura = row(d.commands, 'ability', 'cura')!;
    expect(cura.enabled).toBe(false);
    expect(cura.disabledReason).toBeUndefined();
    const text = commandHelpText(cura);
    expect(text).not.toMatch(/undefined|— /);
    expect(text).toBe(commandHelpText({ ...cura, enabled: true }));
  });
});

describe('every other FFX chapter plays as it did: no formation list in the state, and its first menu still has an Attack row', () => {
  const CHAPTERS = [
    'seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'seymour-natus', 'seymour-omnis',
    'sin-fins-core', 'sin-face', 'sinspawn-gui', 'mirror-aeons', 'exp-fayth',
  ];
  beforeAll(async () => {
    await registerBattleContent();
  });
  for (const id of CHAPTERS) {
    it(`${id}: Attack on the first menu, no formation list in the state`, () => {
      const chapter = getChapter(id)!;
      expect(chapter.game).toBe('ffx');
      const setup = setupForChapter(chapter, 1);
      const engine = new FFXEngine({ autoResolveMinigames: true });
      engine.setSeed(setup.seed);
      engine.init(setup);
      expect(engine.state().flags[COMMAND_OFF_ANY]).toBeUndefined();
      expect(Object.keys(engine.state().flags).filter((k) => k.startsWith('formation.cmdOff'))).toEqual([]);
      let d: Decision = engine.nextDecision();
      for (let i = 0; i < 400 && d.kind !== 'player-input' && d.kind !== 'battle-over'; i++) d = engine.nextDecision();
      expect(d.kind).toBe('player-input');
      if (d.kind === 'player-input') expect(d.commands.some((c) => c.command.kind === 'attack')).toBe(true);
    });
  }

  it('Biran and Yenke carries exactly one entry of the kind (RC11: Kimahri\'s Switch, the script\'s third call), which forbids nothing with an empty bench and has no Attack to touch', () => {
    const chapter = getChapter('biran-yenke')!;
    const setup = setupForChapter(chapter, 1);
    const engine = new FFXEngine({ autoResolveMinigames: true });
    engine.setSeed(setup.seed);
    engine.init(setup);
    expect(engine.state().flags[COMMAND_OFF_ANY]).toBe(true);
    expect(Object.keys(engine.state().flags).filter((k) => k.startsWith('formation.cmdOff:'))).toEqual(['formation.cmdOff:kimahri:' + 0x3002]);
    let d: Decision = engine.nextDecision();
    for (let i = 0; i < 400 && d.kind !== 'player-input' && d.kind !== 'battle-over'; i++) d = engine.nextDecision();
    expect(d.kind).toBe('player-input');
    if (d.kind === 'player-input') expect(d.commands.some((c) => c.command.kind === 'attack' && c.enabled)).toBe(true);
  });

  it('and Isaaru\'s chapter, set up the way the app sets it up, has the list from the first link', () => {
    const chapter = getChapter('isaaru-via-purifico')!;
    const engine = new FFXEngine({ autoResolveMinigames: true });
    const setup = setupForChapter(chapter, 1);
    engine.setSeed(setup.seed);
    engine.init(setup);
    expect(engine.state().flags[COMMAND_OFF_ANY]).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------------- the pure rule

function fakeCtx(flags: Record<string, unknown>, abilities: Record<string, Partial<AbilityDef>> = {}) {
  return { state: { flags }, content: { ability: (id: string) => abilities[id] } } as never;
}
const mk = (side: string, id = 'x') => ({ side, id }) as unknown as FFXCombatant;

describe('the pure rule', () => {
  it('the switch is on, and the ids are the game\'s', () => {
    expect(FORMATION_COMMAND_DISABLES).toBe(true);
    expect(GAME_COMMAND).toEqual({
      attack: 0x3000, item: 0x3001, switch: 0x3002, escape: 0x3003, weapon: 0x3004, armor: 0x3005, flee: 0x3018, skill: 0x3113, special: 0x3114, blackMagic: 0x3115, whiteMagic: 0x3116,
    });
  });

  it('a row belongs to the command of its kind, and an ability row to the command of its category; Summon, Grand Summon, Dismiss, Defend and the triggers belong to none', () => {
    const ctx = fakeCtx({}, {
      a: { category: 'skill' }, b: { category: 'special' }, c: { category: 'blackmagic' }, d: { category: 'whitemagic' }, e: { category: 'summon' }, f: { category: 'overdrive' },
      g: { category: 'aeon' }, h: { category: 'item' }, i: { category: 'enemy' }, j: { category: 'attack' },
    });
    const ability = (id: string): Command => ({ kind: 'ability', id, targets: [] });
    expect(menuCommandOf(ctx, { kind: 'attack', targets: [] })).toBe(0x3000);
    expect(menuCommandOf(ctx, { kind: 'item', id: 'potion', targets: [] })).toBe(0x3001);
    expect(menuCommandOf(ctx, { kind: 'switch', targets: [], extra: { outId: 'a', inId: 'b' } })).toBe(0x3002);
    expect(menuCommandOf(ctx, { kind: 'escape', targets: [], extra: { mode: 'single' } })).toBe(0x3003);
    expect(menuCommandOf(ctx, { kind: 'escape', targets: [], extra: { mode: 'party' } })).toBe(0x3018);
    expect(menuCommandOf(ctx, ability('a'))).toBe(0x3113);
    expect(menuCommandOf(ctx, ability('b'))).toBe(0x3114);
    expect(menuCommandOf(ctx, ability('c'))).toBe(0x3115);
    expect(menuCommandOf(ctx, ability('d'))).toBe(0x3116);
    for (const id of ['e', 'f', 'g', 'h', 'i', 'j', 'unknown']) expect(menuCommandOf(ctx, ability(id)), id).toBeUndefined();
    for (const cmd of [
      { kind: 'summon', id: 'shiva', targets: [] }, { kind: 'dismiss', targets: [] }, { kind: 'defend', targets: [] }, { kind: 'trigger', id: 'talk', targets: [] },
      { kind: 'overdrive', id: 'grand-summon', targets: [] },
    ] as Command[]) {
      expect(menuCommandOf(ctx, cmd), cmd.kind).toBeUndefined();
    }
  });

  it('"everyone" is every character and aeon and never a monster; a named member is that member only; only the listed command is refused', () => {
    const ctx = fakeCtx({});
    applyFormationCommandDisables(ctx, { id: 'g', game: 'ffx', enemies: [], commandDisables: [{ who: 'everyone', command: 0x3002 }, { who: 'yuna', command: 0x3000 }] } as unknown as EnemyGroupDef);
    expect((ctx as never as { state: { flags: Record<string, unknown> } }).state.flags[COMMAND_OFF_ANY]).toBe(true);
    for (const side of ['party', 'aeon']) expect(commandOff(ctx, mk(side, 'tidus'), 0x3002), side).toBe(true);
    expect(commandOff(ctx, mk('enemy', 'grothia'), 0x3002)).toBe(false);
    expect(commandOff(ctx, mk('party', 'yuna'), 0x3000)).toBe(true);
    expect(commandOff(ctx, mk('party', 'tidus'), 0x3000)).toBe(false);
    expect(commandOff(ctx, mk('aeon', 'shiva'), 0x3000)).toBe(false);
    expect(commandOff(ctx, mk('enemy', 'yuna'), 0x3000)).toBe(false);
    expect(commandOff(ctx, mk('party', 'yuna'), 0x3001)).toBe(false);
    expect(commandRefused(ctx, mk('party', 'yuna'), { kind: 'attack', targets: [] })).toBe(true);
    expect(commandRefused(ctx, mk('party', 'yuna'), { kind: 'summon', id: 'shiva', targets: [] })).toBe(false);
    expect(commandRefused(ctx, mk('party', 'tidus'), { kind: 'attack', targets: [] })).toBe(false);
    expect(commandRefused(ctx, mk('enemy', 'grothia'), { kind: 'switch', targets: [], extra: { outId: 'a', inId: 'b' } })).toBe(false);
  });

  it('a group that lists nothing sets nothing, and the menu rule hands back the very same rows when nothing is switched off, or for a monster; a switched-off row is greyed, no reason, as a copy', () => {
    const ctx = fakeCtx({});
    applyFormationCommandDisables(ctx, { id: 'g', game: 'ffx', enemies: [] } as unknown as EnemyGroupDef);
    expect(Object.keys((ctx as never as { state: { flags: Record<string, unknown> } }).state.flags)).toEqual([]);
    const rows = [{ command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: [] }] as AvailableCommand[];
    expect(greyDisabledRows(ctx, mk('party', 'yuna'), rows)).toBe(rows);
    const on = fakeCtx({ [COMMAND_OFF_ANY]: true, 'formation.cmdOff:yuna:12288': true });
    const greyed = greyDisabledRows(on, mk('party', 'yuna'), rows);
    expect(greyed).toHaveLength(1); // kept, not taken out
    expect(greyed[0]).toEqual({ command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: false, validTargets: [] });
    expect('disabledReason' in greyed[0]!).toBe(false);
    expect(rows[0]!.enabled).toBe(true); // the input is never changed
    // A row that carried a reason of its own (the duel's older one) loses it: the original prints none for a switched-off command.
    const reasoned = [{ ...rows[0]!, enabled: false, disabledReason: 'Only an aeon can fight an aeon' }] as AvailableCommand[];
    expect('disabledReason' in greyDisabledRows(on, mk('party', 'yuna'), reasoned)[0]!).toBe(false);
    expect(greyDisabledRows(on, mk('party', 'tidus'), rows)).toEqual(rows); // a copy, with nothing greyed
    expect(greyDisabledRows(on, mk('party', 'tidus'), reasoned)[0]!.disabledReason).toBe('Only an aeon can fight an aeon'); // another member's row is left as it was
    expect(greyDisabledRows(on, mk('enemy', 'yuna'), rows)).toBe(rows);
  });
});

// ---------------------------------------------------------------------------------------------------------------------- the actor in the engine is who the data says

describe('the names the data uses are the engine\'s', () => {
  it('Yuna is the combatant id "yuna" in all three links, and the party and the aeons the lists name are not enemies', () => {
    for (const link of LINK_IDS) {
      const e = newEngine(link, 8);
      expect(actor(e, 'yuna').side).toBe('party');
      expect(actor(e, 'shiva').side).toBe('aeon');
    }
  });
});
