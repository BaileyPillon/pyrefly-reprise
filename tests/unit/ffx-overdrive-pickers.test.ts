// @vitest-environment jsdom
/**
 * **Hotfix 24: the Overdrive pickers get what they read** (Bailey, 2026-09-27:
 * "i tried my overdrive and i think valefor came out i had yuna selected").
 * `docs/plans/valefor-overdrive-bug-2026-09-27.md` S1.
 *
 * The engine sent Grand Summon's picker a list of id strings, the picker read
 * `.name` from objects and threw on its first render, and the presenter
 * re-submitted bare, so the engine's default roll put Valefor on the field
 * every time. Rikku's Mix picker read `ingredients` / `recipes` while the
 * engine sent `inventory`, so its list opened empty.
 *
 * Proved by running the real engine on the real chapter builds and handing the
 * real `minigame-request` params to the real overlays (hard rule 3).
 *
 * **Game case: FFX only** (rule 14). Grand Summon and Mix are FFX Overdrives;
 * FFX-2 has neither, and its engine keeps the bare re-submit it always had
 * (the last describe block).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BattleEvent, Command, Decision, FFXCombatant, MinigameResult } from '../../src/battle/common/types.ts';
import {
  createFFXEngine,
  registerFFXAbilities,
  registerFFXItems,
  registerFFXMixRecipes,
} from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS, MIX_RECIPES } from '../../src/data/ffx/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { openYunaGrandSummon } from '../../src/ui/ffx/minigames/YunaGrandSummon.ts';
import { openRikkuMix } from '../../src/ui/ffx/minigames/RikkuMix.ts';
import { MinigameCancelled } from '../../src/ui/ffx/minigames/params.ts';
import { askMinigame, backOutOfMinigame } from '../../src/engine/BattlePresenterUtil.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';

registerFFXAbilities(ALL_ABILITIES.filter((a) => a.game === 'ffx'));
registerFFXItems(Object.values(ITEMS).filter((i) => i.game === 'ffx'));
registerFFXMixRecipes(MIX_RECIPES);

type Engine = ReturnType<typeof createFFXEngine>;
type Input = Extract<Decision, { kind: 'player-input' }>;
type Request = Extract<BattleEvent, { type: 'minigame-request' }>;

/** A chapter's real build on a human-played engine (no auto-resolved minigames). */
function chapterEngine(chapterId: string, seed = 1): Engine {
  const chapter = getChapter(chapterId);
  if (!chapter) throw new Error(`${chapterId} is not a chapter`);
  const engine = createFFXEngine();
  engine.init(setupForChapter(chapter, seed));
  return engine;
}

/** Fill `who`'s gauge (setup only), then Defend everyone else until `who`'s menu opens. */
function toTurnOf(engine: Engine, who: string): Input {
  const live = engine.state().combatants[who] as FFXCombatant | undefined;
  if (!live?.overdrive) throw new Error(`${who} has no Overdrive gauge here`);
  live.overdrive.gauge = 100;
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error('the battle ended before the turn came');
    if (d.kind !== 'player-input') continue;
    if (d.actorId === who) return d;
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error(`${who}'s turn never came`);
}

function overdriveRow(d: Input, id: string): Command {
  const row = d.commands.find((r) => r.command.kind === 'overdrive' && r.command.id === id);
  if (!row?.enabled) throw new Error(`${id} is not offered (${row?.disabledReason ?? 'missing'})`);
  return { ...row.command, targets: [d.actorId] } as Command;
}

function requestOf(events: readonly BattleEvent[]): Request {
  const req = events.find((e): e is Request => e.type === 'minigame-request');
  if (!req) throw new Error(`no minigame-request in ${events.map((e) => e.type).join(', ')}`);
  return req;
}

function press(...codes: string[]): void {
  for (const code of codes) window.dispatchEvent(new KeyboardEvent('keydown', { code }));
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('Grand Summon: the engine sends the picker what it reads (Chapter IX, seed 1)', () => {
  it('each aeon arrives as { id, name, storedGauge }, in roster order', () => {
    const engine = chapterEngine('yojimbo-cavern');
    const d = toTurnOf(engine, 'yuna');
    const req = requestOf(engine.submit(overdriveRow(d, 'grand-summon')));
    const aeons = req.params['aeons'] as Array<{ id: string; name: string; storedGauge: number }>;
    expect(aeons.map((a) => a.id)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']);
    expect(aeons.map((a) => a.name)).toEqual(['Valefor', 'Ifrit', 'Ixion', 'Shiva', 'Bahamut']);
    const roster = (engine as unknown as { ctx: { rt: { aeonRoster: Map<string, { overdrive?: { gauge: number } }> } } }).ctx.rt
      .aeonRoster;
    for (const a of aeons) expect(a.storedGauge).toBe(roster.get(a.id)?.overdrive?.gauge);
    expect(aeons.some((a) => a.storedGauge > 0)).toBe(true);
  });

  it('the picker opens on those params, the 3rd row is Ixion, and Ixion is the aeon summoned', async () => {
    const engine = chapterEngine('yojimbo-cavern');
    const d = toTurnOf(engine, 'yuna');
    const command = overdriveRow(d, 'grand-summon');
    const req = requestOf(engine.submit(command));

    const picked = openYunaGrandSummon(document.body, req.params);
    const rows = [...document.querySelectorAll('.ffx-mg-list__row')];
    expect(rows.map((r) => r.firstChild?.textContent)).toEqual(['Valefor', 'Ifrit', 'Ixion', 'Shiva', 'Bahamut']);
    // The ×2 chip marks an aeon already at 100: Grand Summon then gives two Overdrives [§5.4].
    const full = (req.params['aeons'] as Array<{ storedGauge: number }>).map((a) => a.storedGauge >= 100);
    expect(rows.map((r) => r.textContent?.includes('×2'))).toEqual(full);
    press('ArrowDown', 'ArrowDown', 'Enter');
    const extra = await picked;
    expect(extra).toEqual({ kind: 'yuna-grand-summon', grandSummon: { aeonId: 'ixion' } });

    const events = engine.submit({ ...command, extra } as Command);
    const summon = events.find((e) => e.type === 'summon');
    expect(summon && 'aeonId' in summon ? summon.aeonId : null).toBe('ixion');
    expect(engine.state().aeonId).toBe('ixion');
  });

  it('a malformed entry is skipped or named by its id, never thrown on', async () => {
    const params = {
      aeons: ['valefor', null, 7, { name: 'No id' }, { id: 'ifrit', name: 'Ifrit', storedGauge: 100 }, { id: 'ixion' }],
    };
    const picked = openYunaGrandSummon(document.body, params);
    const rows = [...document.querySelectorAll('.ffx-mg-list__row')].map((r) => r.textContent);
    expect(rows).toEqual(['valefor', 'Ifrit×2', 'ixion']);
    press('ArrowDown', 'Enter');
    await expect(picked).resolves.toEqual({ kind: 'yuna-grand-summon', grandSummon: { aeonId: 'ifrit' } });
  });
});

describe('backing out of a picker returns the turn to the menu (FFX)', () => {
  it('after a back-out the same Overdrive asks again instead of rolling Valefor', () => {
    const engine = chapterEngine('yojimbo-cavern');
    const d = toTurnOf(engine, 'yuna');
    const command = overdriveRow(d, 'grand-summon');
    requestOf(engine.submit(command));

    expect(backOutOfMinigame(engine)).toBe(true);
    const again = engine.nextDecision();
    expect(again.kind === 'player-input' ? again.actorId : again.kind).toBe('yuna');
    expect((engine.state().combatants['yuna'] as FFXCombatant).overdrive?.gauge).toBe(100);

    const second = engine.submit(command);
    expect(second.some((e) => e.type === 'summon')).toBe(false);
    requestOf(second);
    expect(engine.state().aeonId ?? null).toBeNull();
  });

  it('a bare re-submit with no back-out still breaks the loop with the default roll', () => {
    const engine = chapterEngine('yojimbo-cavern');
    const d = toTurnOf(engine, 'yuna');
    const command = overdriveRow(d, 'grand-summon');
    requestOf(engine.submit(command));
    const events = engine.submit(command);
    expect(events.some((e) => e.type === 'summon')).toBe(true);
  });
});

describe('askMinigame tells a cancel and a broken overlay apart', () => {
  const hudWith = (open: () => Promise<MinigameResult>): HudPort => ({ openMinigame: open }) as unknown as HudPort;
  const request = { kind: 'yuna-grand-summon' as const, params: {} };

  it('an answer comes back as the result', async () => {
    const result: MinigameResult = { kind: 'yuna-grand-summon', grandSummon: { aeonId: 'ixion' } };
    await expect(askMinigame(hudWith(() => Promise.resolve(result)), request)).resolves.toEqual({ kind: 'result', result });
  });

  it('the player backing out is a cancel, logged as nothing worse than that', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const out = await askMinigame(hudWith(() => Promise.reject(new MinigameCancelled('yuna-grand-summon'))), request);
    expect(out).toEqual({ kind: 'cancelled' });
    expect(error).not.toHaveBeenCalled();
  });

  it('a thrown overlay is an error on the console, never a silent default', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const out = await askMinigame(hudWith(() => Promise.reject(new TypeError('boom'))), request);
    expect(out).toEqual({ kind: 'failed' });
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0]?.[0])).toContain('yuna-grand-summon');
  });

  it('no HUD at all is no answer', async () => {
    await expect(askMinigame(undefined, request)).resolves.toBeUndefined();
  });
});

describe("Rikku's Mix picker lists the bag the engine sends (Chapter VII, seed 1)", () => {
  it('the ingredients carry names and counts, and a listed pair resolves to a real mix', async () => {
    const engine = chapterEngine('seymour-anima-macalania');
    const d = toTurnOf(engine, 'rikku');
    const command = overdriveRow(d, 'mix');
    const req = requestOf(engine.submit(command));

    const picked = openRikkuMix(document.body, req.params);
    const rows = [...document.querySelectorAll('.ffx-mg-list__row')];
    expect(rows.length).toBeGreaterThan(0);
    const ingredients = req.params['ingredients'] as Array<{ itemId: string; name: string; count: number }>;
    expect(ingredients.every((i) => typeof i.name === 'string' && i.name.length > 0 && i.count > 0)).toBe(true);
    expect(rows[0]?.textContent).toContain(ingredients[0]?.name ?? '?');

    // The first row twice: the bag holds at least two of it in this build.
    expect(ingredients[0]?.count ?? 0).toBeGreaterThanOrEqual(2);
    press('Enter', 'Enter');
    const extra = await picked;
    expect(extra.kind).toBe('rikku-mix');
    const events = engine.submit({ ...command, extra } as Command);
    const start = events.find((e) => e.type === 'action-start');
    expect(start && 'abilityId' in start ? start.abilityId : null).not.toBe('mix');
    expect(events.some((e) => e.type === 'message' && 'text' in e && e.text === 'Mix failed!')).toBe(false);
  });
});

describe('FFX-2 is untouched (rule 14 absence test)', () => {
  it('an engine with no back-out keeps the bare re-submit', () => {
    expect(backOutOfMinigame({} as never)).toBe(false);
  });
});
