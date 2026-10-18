/**
 * **The FFX command menu's draw rules, engine side** (re-parity RC11, lane "FFX menu parity"; **FFX only**; switch `MENU_DRAW_PARITY`, default OFF; handoff
 * `docs/handoff/re-parity-rc11-ffx-menu-parity.md`). The HUD half (openers, the cursor) is `ui-ffx-menu-draw-parity.test.ts`.
 *
 * 1. **A model of the game** (`FFX-G11` section 4, `FFX-G11b`): the row resolver's result codes and what the draw loop (0x008A49B0) and the confirm handler (0x0089C900) do with each,
 *    written here from the notes' tables with no import from the engine; worked on the cases of the plan.
 * 2. **The engine, switch OFF**: the menu is what it was (Escape absent, Flee "Can't escape", KO'd aeons absent, no Overdrive rows under Curse, Talk for Tidus in Chapters I and II).
 * 3. **The engine, switch ON**: each item (b Overdrive, c Summon list, d Escape/Flee/Switch, e Talk) draws what the model says; the items can be taken one at a time (`skip`).
 * 4. **The invariant**: on every chapter's first link and every active member, the rows a player can pick are the same on and off, and every row that differs is a greyed row with no
 *    reason (or a Talk row that is not offered): the switch moves the picture, never the rules.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { AvailableCommand } from '../../src/battle/common/types.ts';
import { MENU_DRAW_PARITY, greyRow, menuParity, overdriveGaugeFull, setMenuDrawParity } from '../../src/battle/ffx/menu-draw-parity.ts';
import { onLastSummoningBoard } from '../../src/engine/tactics/lookup.ts';
import { TAKEN_REASON } from '../../src/data/ffx/last-summoning-ids.ts';
import { actor, ctxOf, engineFor, keyOf, menuOf, partyOf, pickable } from './helpers/menuParityDrive.ts';
import { firstLinkSetup, newEngine as newLastSummoningEngine } from './helpers/lastSummoningDrive.ts';

// ---------------------------------------------------------------------------------------------------------------------- 1. the model of the game

/** What the resolver (0x0089ACA0) is given for one row, as the notes' section 4 lists it. */
interface ModelRow {
  /** The row's disabled bit is set in the owner's bitmap (a formation script), or a class-0 entry is unavailable. */
  disabled?: boolean;
  /** The record carries the Silence flag, and the owner's Silence counter is non-zero. */
  silenceFlagAndSilenced?: boolean;
  /** The record has an Overdrive cost, and the gauge is below its maximum or the owner is Cursed. */
  overdriveRefused?: boolean;
  /** MP cost plus pending MP above the owner's MP. */
  tooLittleMp?: boolean;
  /** The row is an opener: its type (8 hides when empty, 0x10 greys) and how many entries its list holds. */
  opener?: { type: 8 | 0x10; entries: number };
}

/** The resolver's result: negative refuses, -4 is the one code the draw loop does not draw. */
function resolve(r: ModelRow): number {
  if (r.disabled) return -1;
  if (r.silenceFlagAndSilenced || r.overdriveRefused || r.tooLittleMp) return -2;
  if (r.opener) {
    if (r.opener.entries === 0) return r.opener.type === 8 ? -4 : -3;
    return 1; // the list number (any positive)
  }
  return 0xff;
}
const drawn = (code: number): boolean => code !== -4;
const grey = (code: number): boolean => code < 0 && code !== -4;
const confirmRefused = (code: number): boolean => code < 0;

describe('the model of the game: the resolver, the draw loop and the confirm handler', () => {
  it('only -4 is not drawn; every other negative result is drawn with the grey flag and refused on a confirm', () => {
    for (const code of [-1, -2, -3]) {
      expect(drawn(code), String(code)).toBe(true);
      expect(grey(code), String(code)).toBe(true);
      expect(confirmRefused(code), String(code)).toBe(true);
    }
    expect(drawn(-4)).toBe(false);
    expect(confirmRefused(-4)).toBe(true); // the cursor can sit on the empty slot
    for (const code of [0, 1, 5, 0xfe, 0xff]) {
      expect(grey(code), String(code)).toBe(false);
      expect(confirmRefused(code), String(code)).toBe(false);
    }
  });

  it('item a: an opener row is never greyed by Silence or MP (it opens), the entries inside are (-2); an empty type-8 list hides it, an empty type-0x10 list greys it', () => {
    const opener = (entries: number, type: 8 | 0x10 = 8): number => resolve({ opener: { type, entries } });
    expect(grey(opener(19))).toBe(false); // Black Magic, Silenced: the opener record has no Silence bit, so the row is the list number
    expect(grey(resolve({ silenceFlagAndSilenced: true }))).toBe(true); // a spell inside
    expect(grey(resolve({ tooLittleMp: true }))).toBe(true); // a spell at 0 MP
    expect(drawn(opener(0, 8))).toBe(false); // an empty Skill list
    expect(grey(opener(0, 0x10))).toBe(true); // Doublecast with nothing in its list
    expect(grey(opener(3, 0x10))).toBe(false); // Doublecast with spells: opens, whatever Silence did
  });

  it('item b: an Overdrive record refused for Curse or an unfilled gauge is -2, drawn grey, not left out', () => {
    expect(grey(resolve({ overdriveRefused: true }))).toBe(true);
    expect(drawn(resolve({ overdriveRefused: true }))).toBe(true);
  });

  it('items c and d: an unavailable aeon entry (class 0) and a command with its bit set are -1: drawn grey, no reason, refused', () => {
    for (const row of [{ disabled: true }, { disabled: true, opener: { type: 0x10 as const, entries: 2 } }]) {
      const code = resolve(row);
      expect(code).toBe(-1);
      expect(grey(code)).toBe(true);
      expect(drawn(code)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------- the switch itself

let restore: (() => void) | undefined;
afterEach(() => {
  off();
});
const off = (): void => {
  restore?.();
  restore = undefined;
};
const on = (skip: Parameters<typeof setMenuDrawParity>[1] = []): void => {
  restore?.(); // a second call in one test must not lose the way back to "off"
  restore = setMenuDrawParity(true, skip);
};

describe('the switch', () => {
  it('is off, with nothing skipped', () => {
    expect(MENU_DRAW_PARITY.on).toBe(false);
    expect(MENU_DRAW_PARITY.skip).toEqual([]);
    for (const item of ['openers', 'overdrive', 'summon', 'blocked', 'talk', 'cursor'] as const) expect(menuParity(item), item).toBe(false);
  });

  it('on turns every item on; skip leaves the named ones off; the returned function puts both back', () => {
    const back = setMenuDrawParity(true, ['talk', 'cursor']);
    expect(menuParity('openers')).toBe(true);
    expect(menuParity('talk')).toBe(false);
    expect(menuParity('cursor')).toBe(false);
    const inner = setMenuDrawParity(false);
    expect(menuParity('openers')).toBe(false);
    inner();
    expect(menuParity('openers')).toBe(true);
    expect(MENU_DRAW_PARITY.skip).toEqual(['talk', 'cursor']);
    back();
    expect(MENU_DRAW_PARITY).toEqual({ on: false, skip: [] });
  });

  it('greyRow is a copy with enabled false and no reason; overdriveGaugeFull ignores Curse and reads the temporary gauge', () => {
    const row = { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, rank: 1, enabled: true, validTargets: [], disabledReason: 'x' } as unknown as AvailableCommand;
    const g = greyRow(row);
    expect(g.enabled).toBe(false);
    expect('disabledReason' in g).toBe(false);
    expect(row.enabled).toBe(true);
    expect(row.disabledReason).toBe('x');
    const c = (gauge: number, temp?: number | null): never => ({ overdrive: { gauge }, statuses: { curse: {} }, aeon: temp === undefined ? undefined : { temporaryOverdrive: temp } }) as never;
    expect(overdriveGaugeFull(c(100))).toBe(true);
    expect(overdriveGaugeFull(c(99))).toBe(false);
    expect(overdriveGaugeFull(c(0, 100))).toBe(true);
    expect(overdriveGaugeFull(c(0, null))).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------- 2 and 3. the engine, off and on

beforeAll(async () => {
  await engineFor('seymour-flux'); // registers the battle content once
});

const kinds = (rows: readonly AvailableCommand[], kind: string): AvailableCommand[] => rows.filter((r) => r.command.kind === kind);
const noReason = (r: AvailableCommand): boolean => !r.enabled && r.disabledReason === undefined;

describe('item b: Curse with a full gauge keeps the Overdrive rows, greyed', () => {
  const CURSE = { id: 'curse', turnsRemaining: 254 } as never;

  it('off: a Cursed actor with a full gauge has no Overdrive row (as before); on: the rows are there, all disabled with no reason', async () => {
    const engine = await engineFor('seymour-flux');
    const tidus = actor(engine, 'tidus');
    tidus.overdrive!.gauge = 100;
    expect(kinds(menuOf(engine, 'tidus'), 'overdrive').every((r) => r.enabled)).toBe(true); // not Cursed: ready
    const readyRows = kinds(menuOf(engine, 'tidus'), 'overdrive').length;
    expect(readyRows).toBeGreaterThan(0);
    tidus.statuses.curse = CURSE;
    expect(kinds(menuOf(engine, 'tidus'), 'overdrive')).toEqual([]);
    on();
    const rows = kinds(menuOf(engine, 'tidus'), 'overdrive');
    expect(rows.length).toBe(readyRows);
    expect(rows.every(noReason)).toBe(true);
    expect(pickable(menuOf(engine, 'tidus')).some((k) => k.startsWith('overdrive'))).toBe(false); // nothing to pick: legality is the same
  });

  it('a Cursed actor with an unfilled gauge has no row in either state (the Overdrive key needs the gauge); an uncursed full gauge is enabled in both', async () => {
    const engine = await engineFor('seymour-flux');
    const tidus = actor(engine, 'tidus');
    tidus.statuses.curse = CURSE;
    tidus.overdrive!.gauge = 99;
    on();
    expect(kinds(menuOf(engine, 'tidus'), 'overdrive')).toEqual([]);
    delete tidus.statuses.curse;
    tidus.overdrive!.gauge = 100;
    const rows = kinds(menuOf(engine, 'tidus'), 'overdrive');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.enabled)).toBe(true);
  });

  it('skip "overdrive" leaves the old menu', async () => {
    const engine = await engineFor('seymour-flux');
    const tidus = actor(engine, 'tidus');
    tidus.statuses.curse = CURSE;
    tidus.overdrive!.gauge = 100;
    on(['overdrive']);
    expect(kinds(menuOf(engine, 'tidus'), 'overdrive')).toEqual([]);
  });
});

describe('item c: the Summon list keeps a knocked-out or recovering aeon, greyed', () => {
  const setup = async (): Promise<Awaited<ReturnType<typeof engineFor>>> => {
    const engine = await engineFor('braskas-final-aeon');
    const roster = ctxOf(engine).rt.aeonRoster;
    roster.get('valefor')!.hp = 0; // knocked out
    const ifrit = roster.get('ifrit')!;
    ifrit.aeon!.reviveCountdown = 5; // recovering
    return engine;
  };
  const labels = (rows: readonly AvailableCommand[]): string[] => kinds(rows, 'summon').map((r) => r.label);

  it('off: the two aeons are not on the list; on: all five are, the two disabled with no reason, the other three enabled', async () => {
    const engine = await setup();
    expect(labels(menuOf(engine, 'yuna'))).toEqual(['Ixion', 'Shiva', 'Bahamut']);
    on();
    const rows = kinds(menuOf(engine, 'yuna'), 'summon');
    expect(rows.map((r) => r.label)).toEqual(['Valefor', 'Ifrit', 'Ixion', 'Shiva', 'Bahamut']);
    expect(rows.map((r) => r.enabled)).toEqual([false, false, true, true, true]);
    expect(rows.filter((r) => !r.enabled).every(noReason)).toBe(true);
    expect(pickable(menuOf(engine, 'yuna')).filter((k) => k.startsWith('summon')).length).toBe(3);
  });

  it('with every aeon down the Summon group still has its rows (the opener opens onto a grey list); off it has none', async () => {
    const engine = await engineFor('braskas-final-aeon');
    for (const aeon of ctxOf(engine).rt.aeonRoster.values()) aeon.hp = 0;
    expect(kinds(menuOf(engine, 'yuna'), 'summon')).toEqual([]);
    on();
    const rows = kinds(menuOf(engine, 'yuna'), 'summon');
    expect(rows.length).toBe(5);
    expect(rows.every(noReason)).toBe(true);
  });

  it('the Last Summoning board rule: Chapter III never looks like the board, and a taken aeon keeps its words', async () => {
    const chapterIII = await setup();
    on();
    menuOf(chapterIII, 'yuna');
    expect(onLastSummoningBoard(chapterIII.state())).toBe(false);
    const { setup: lsSetup } = await firstLinkSetup(['valefor', 'ifrit'], 3);
    const board = newLastSummoningEngine(lsSetup);
    expect(onLastSummoningBoard(board.state())).toBe(true);
    const lsRows = (): AvailableCommand[] => kinds(menuOf(board as never, 'yuna'), 'summon');
    // a KO'd aeon that is also taken keeps the lock's reason; a KO'd aeon that is not taken has none
    ctxOf(board as never).rt.aeonRoster.get('valefor')!.hp = 0;
    ctxOf(board as never).rt.aeonRoster.get('ixion')!.hp = 0;
    const off = lsRows().map((r) => `${r.label}:${r.enabled}:${r.disabledReason}`);
    on();
    const onRows = lsRows();
    expect(onRows.find((r) => r.label === 'Valefor')!.disabledReason).toBe(TAKEN_REASON);
    expect(onRows.find((r) => r.label === 'Ixion')!.enabled).toBe(false);
    expect(onRows.find((r) => r.label === 'Ixion')!.disabledReason).toBeUndefined();
    expect(onRows.map((r) => r.label).length).toBeGreaterThanOrEqual(off.length);
    expect(onLastSummoningBoard(board.state())).toBe(true);
  });

  it('skip "summon" leaves the old list', async () => {
    const engine = await setup();
    on(['summon']);
    expect(labels(menuOf(engine, 'yuna'))).toEqual(['Ixion', 'Shiva', 'Bahamut']);
  });
});

describe('item d: a blocked Escape, Flee or Switch row is drawn greyed with no reason; legality is unchanged', () => {
  it('off: no Escape row, Flee greyed "Can\'t escape"; on: an Escape row (party only) greyed with no reason, Flee greyed with no reason', async () => {
    const engine = await engineFor('seymour-flux');
    const ctx = ctxOf(engine);
    expect(ctx.rt.canEscape).toBe(false);
    for (const id of partyOf(engine)) {
      const rows = kinds(menuOf(engine, id), 'escape');
      expect(rows.filter((r) => (r.command as { extra?: { mode?: string } }).extra?.mode === 'single'), id).toEqual([]);
      for (const r of rows) expect(r.disabledReason, id).toBe("Can't escape");
    }
    on();
    let flee = 0;
    for (const id of partyOf(engine)) {
      const rows = kinds(menuOf(engine, id), 'escape');
      expect(rows.filter((r) => (r.command as { extra?: { mode?: string } }).extra?.mode === 'single').length, id).toBe(1);
      expect(rows.every((r) => !r.enabled && r.disabledReason === undefined), id).toBe(true);
      flee += rows.filter((r) => (r.command as { extra?: { mode?: string } }).extra?.mode === 'party').length;
    }
    expect(flee).toBeGreaterThan(0); // someone has Flee, and it lost its reason
  });

  it('an actor that is not the party gets no new Escape row (an aeon\'s menu is as before)', async () => {
    const engine = await engineFor('braskas-final-aeon');
    on();
    expect(kinds(menuOf(engine, 'yuna'), 'escape').filter((r) => (r.command as { extra?: { mode?: string } }).extra?.mode === 'single').length).toBe(1);
    const valefor = ctxOf(engine).rt.aeonRoster.get('valefor')!;
    expect(kinds(menuOf(engine, valefor.id), 'escape')).toEqual([]);
  });

  it('where Escape is allowed the row is enabled and the same in both states', async () => {
    const engine = await engineFor('seymour-flux');
    ctxOf(engine).rt.canEscape = true;
    const view = (): string[] => menuOf(engine, 'tidus').filter((r) => r.command.kind !== 'trigger').map((r) => `${keyOf(r)}:${r.enabled}:${r.disabledReason}`); // Talk is item e's
    const before = view();
    on();
    expect(view()).toEqual(before);
  });

  it('Switch with a bench the formation forbids (noSwitch): off no rows; on the same rows as the bench holds, disabled with no reason', async () => {
    const engine = await engineFor('seymour-flux');
    const ctx = ctxOf(engine);
    const bench = ctx.state.reserveIds.length;
    expect(bench).toBeGreaterThan(0);
    const open = kinds(menuOf(engine, 'tidus'), 'switch');
    expect(open.length).toBe(bench);
    expect(open.some((r) => r.enabled)).toBe(true);
    ctx.rt.noSwitch = true;
    expect(kinds(menuOf(engine, 'tidus'), 'switch')).toEqual([]);
    on();
    const rows = kinds(menuOf(engine, 'tidus'), 'switch');
    expect(rows.length).toBe(bench);
    expect(rows.every(noReason)).toBe(true);
    expect(rows.map((r) => r.label)).toEqual(open.map((r) => r.label));
  });

  it('Switch with an empty bench the formation forbids: Sinspawn Gui\'s second fight and Chapter XXV (Kimahri) get one greyed "Switch" row on; none off', async () => {
    for (const [chapter, group, who] of [['sinspawn-gui', 'sinspawn-gui-2', 'yuna'], ['biran-yenke', undefined, 'kimahri']] as const) {
      const engine = await engineFor(chapter, group);
      expect(ctxOf(engine).state.reserveIds, chapter).toEqual([]);
      expect(kinds(menuOf(engine, who), 'switch'), chapter).toEqual([]);
      on();
      const rows = kinds(menuOf(engine, who), 'switch');
      expect(rows.length, chapter).toBe(1);
      expect(rows[0]!.label, chapter).toBe('Switch');
      expect(noReason(rows[0]!), chapter).toBe(true);
      off();
    }
  });

  it('a chapter that forbids nothing about Switch and has no bench gets no placeholder (the three-member parties of the others)', async () => {
    const engine = await engineFor('seymour-flux');
    ctxOf(engine).state.reserveIds.length = 0;
    on();
    expect(kinds(menuOf(engine, 'tidus'), 'switch')).toEqual([]);
  });

  it('skip "blocked" leaves the old rows', async () => {
    const engine = await engineFor('seymour-flux');
    on(['blocked']);
    const rows = kinds(menuOf(engine, 'tidus'), 'escape');
    expect(rows.filter((r) => (r.command as { extra?: { mode?: string } }).extra?.mode === 'single')).toEqual([]);
    for (const r of rows) expect(r.disabledReason).toBe("Can't escape");
  });
});

describe('item e: Talk exists only where a formation script adds it (FFX-G11b section 5)', () => {
  const talkers = (engine: Awaited<ReturnType<typeof engineFor>>): string[] => partyOf(engine).filter((id) => kinds(menuOf(engine, id), 'trigger').length > 0);

  it('Chapter I (mtgz02_00): off Tidus has a greyed Talk, on only Yuna and Kimahri have one', async () => {
    const engine = await engineFor('seymour-flux');
    const off = talkers(engine);
    expect(off).toContain('tidus');
    on();
    const onList = talkers(engine);
    expect(onList).not.toContain('tidus');
    expect(onList.sort()).toEqual(off.filter((id) => id === 'yuna' || id === 'kimahri').sort());
    expect(onList).toEqual(expect.arrayContaining(['yuna', 'kimahri']));
    // the rows that stay are the ones the engine already offered, unchanged
    const yuna = kinds(menuOf(engine, 'yuna'), 'trigger');
    expect(yuna.length).toBe(1);
    expect(yuna[0]!.enabled).toBe(true);
  });

  it('Chapter II (dome06_00): off Tidus has a greyed Talk, on nobody has one', async () => {
    const engine = await engineFor('yunalesca');
    const tidusOff = kinds(menuOf(engine, 'tidus'), 'trigger');
    expect(tidusOff.length).toBe(1);
    expect(tidusOff[0]!.enabled).toBe(false);
    on();
    expect(talkers(engine)).toEqual([]);
  });

  it('Chapter III: the first link (sins06_00) keeps Tidus\'s Talk; the Yu Yevon link and the five possessed links list Talk on Tidus today and have none on', async () => {
    const first = await engineFor('braskas-final-aeon');
    expect(talkers(first)).toEqual(['tidus']);
    on();
    expect(talkers(first)).toEqual(['tidus']);
    off();
    for (const group of ['possessed-valefor', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-bahamut', 'yu-yevon']) {
      const engine = await engineFor('braskas-final-aeon', group);
      expect(talkers(engine), `${group} off`).toEqual(['tidus']); // the build lists it (dreams-end.ts): the answer to FFX-G11b open item 2
      on();
      expect(talkers(engine), `${group} on`).toEqual([]);
      off();
    }
  });

  it('Braska\'s Final Aeon\'s script adds Talk for Tidus only: a Talk given to anyone else has no row on', async () => {
    const engine = await engineFor('braskas-final-aeon');
    actor(engine, 'yuna').learnedAbilityIds.push('talk');
    expect(talkers(engine).sort()).toEqual(['tidus', 'yuna']);
    on();
    expect(talkers(engine)).toEqual(['tidus']);
  });

  it('Macalania (VII) and Natus (X) keep their own talkers, unchanged', async () => {
    for (const chapter of ['seymour-anima-macalania', 'seymour-natus']) {
      const engine = await engineFor(chapter);
      const offRows = partyOf(engine).map((id) => kinds(menuOf(engine, id), 'trigger').map((r) => `${id}:${r.enabled}:${r.disabledReason}`));
      on();
      const onRows = partyOf(engine).map((id) => kinds(menuOf(engine, id), 'trigger').map((r) => `${id}:${r.enabled}:${r.disabledReason}`));
      expect(onRows, chapter).toEqual(offRows);
      off();
    }
  });

  it('Isaaru\'s duels (no script adds Talk): Yuna\'s greyed Talk of r54 is not built on', async () => {
    const engine = await engineFor('isaaru-via-purifico');
    expect(kinds(menuOf(engine, 'yuna'), 'trigger').length).toBe(1);
    on();
    expect(kinds(menuOf(engine, 'yuna'), 'trigger')).toEqual([]);
  });

  it('skip "talk" leaves Tidus his row', async () => {
    const engine = await engineFor('seymour-flux');
    on(['talk']);
    expect(talkers(engine)).toContain('tidus');
  });
});

// ---------------------------------------------------------------------------------------------------------------------- 4. the invariant

describe('the switch moves the picture, never the rules: on every chapter\'s first link, what a player can pick is the same on and off', () => {
  const CHAPTERS = [
    'seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'seymour-natus', 'seymour-omnis', 'isaaru-via-purifico',
    'sin-fins-core', 'sin-face', 'mirror-aeons', 'sinspawn-gui', 'exp-fayth', 'biran-yenke', 'last-summoning',
  ];
  for (const id of CHAPTERS) {
    it(`${id}`, async () => {
      const engine = await engineFor(id);
      const members = [...partyOf(engine), ...ctxOf(engine).rt.aeonRoster.values()].map((m) => (typeof m === 'string' ? m : m.id));
      const offMenus = members.map((m) => menuOf(engine, m));
      on();
      const onMenus = members.map((m) => menuOf(engine, m));
      for (const [i, member] of members.entries()) {
        const a = offMenus[i]!;
        const b = onMenus[i]!;
        expect(pickable(b), `${id} ${member}: the rows a player can pick`).toEqual(pickable(a));
        const aKeys = new Set(a.map(keyOf));
        const bKeys = new Set(b.map(keyOf));
        for (const r of b) if (!aKeys.has(keyOf(r))) expect(noReason(r), `${id} ${member}: new row ${keyOf(r)} must be a greyed row with no reason`).toBe(true);
        for (const r of a) if (!bKeys.has(keyOf(r))) expect(r.command.kind, `${id} ${member}: ${keyOf(r)} left the menu`).toBe('trigger'); // only Talk may go
        for (const r of b) {
          const was = a.find((x) => keyOf(x) === keyOf(r));
          if (was && was.enabled === r.enabled && r.enabled === false) continue; // a greyed row may lose its reason (Flee) but not gain a word
          if (was) expect(r.enabled, `${id} ${member}: ${keyOf(r)} changed legality`).toBe(was.enabled);
        }
      }
      off();
      // and with the switch off again the menus are the very ones from before
      const again = members.map((m) => menuOf(engine, m));
      expect(JSON.stringify(again)).toBe(JSON.stringify(offMenus));
    }, 60_000);
  }
});
