/**
 * **The Magus Sisters' one Summon row is labelled "Magus Sisters" in both chapters that own them** (FFX only; Chapter XXVII Mirror Aeons and the hidden Chapter 28, the Last Summoning).
 *
 * The label is the game's own: `FFX_Data.vbf` `command.bin` row 0xFF (command 0x30FF), field 0, whose help text is "Summon the Magus Sisters." (label `[R]`, a static read). Only the list's row and the Grand Summon
 * picker's entry are renamed (`battle/ffx/aeon-duel.ts#summonLabel`, used by `commands.ts` and `pickerParams.ts`); the three keep their own names (Cindy, Sandy, Mindy) in battle.
 *
 * Also pinned here, because it comes from the same fact (`ctx.rt.sisters` is set by both chapters): Chapter XXVII's Grand Summon picker now lists ONE entry for the Sisters, so its list goes from nine entries to
 * seven (Sandy and Mindy are no longer separate entries), as the game's list has one.
 */
import { describe, expect, it } from 'vitest';
import type { BattleEngine, Decision, FFXCombatant } from '../../../src/battle/common/types.ts';
import { SISTERS_SUMMON_LABEL } from '../../../src/battle/ffx/aeon-duel.ts';
import { grandSummonEntries } from '../../../src/battle/ffx/pickerParams.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { firstLinkSetup, newEngine as newLastSummoningEngine } from '../helpers/lastSummoningDrive.ts';
import * as H from '../helpers/mirrorAeonsDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** Advance (defending) to Yuna's input. */
function yunaInput(engine: BattleEngine): Input {
  for (let guard = 0; guard < 40; guard++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error('the battle ended');
    if (d.kind !== 'player-input') continue;
    if (d.actorId === 'yuna') return d;
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error('no input for Yuna');
}

const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;

describe('the label is the game’s own', () => {
  it('is "Magus Sisters"', () => {
    expect(SISTERS_SUMMON_LABEL).toBe('Magus Sisters');
  });
});

describe.each([
  ['Chapter XXVII (Mirror Aeons)', () => H.newEngine(1), ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'yojimbo', 'cindy']],
  ['Chapter 28 (the Last Summoning), the first link (Valefor given up, the others still held)', async () => newLastSummoningEngine((await firstLinkSetup(['valefor'], 1)).setup), ['ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'cindy']],
] as const)('%s', (_name, make, pickerIds) => {
  it('lists the Sisters as ONE Summon row labelled "Magus Sisters", and no row for Cindy, Sandy or Mindy by name', async () => {
    const engine = (await make()) as BattleEngine;
    const labels = yunaInput(engine).commands.filter((c) => c.command.kind === 'summon').map((c) => c.label);
    expect(labels.filter((l) => l === 'Magus Sisters')).toHaveLength(1);
    for (const gone of ['Cindy', 'Sandy', 'Mindy']) expect(labels, gone).not.toContain(gone);
  });

  it('lists ONE Sisters entry in the Grand Summon picker, named "Magus Sisters", in roster order, under the id of the lead Sister', async () => {
    const engine = (await make()) as BattleEngine;
    yunaInput(engine);
    const entries = grandSummonEntries(ctxOf(engine));
    expect(entries.map((e) => e.id)).toEqual([...pickerIds]);
    const sisters = entries.filter((e) => e.id === 'cindy');
    expect(sisters.map((e) => e.name)).toEqual(['Magus Sisters']);
    expect(entries.filter((e) => e.id !== 'cindy').every((e) => e.name !== 'Magus Sisters')).toBe(true);
  });

  it('keeps the three Sisters’ own names in battle once they are summoned', async () => {
    const engine = (await make()) as BattleEngine;
    const row = yunaInput(engine).commands.find((c) => c.command.kind === 'summon' && c.label === 'Magus Sisters');
    expect(row?.enabled).toBe(true);
    engine.submit({ ...row!.command, targets: [] });
    const names = ['cindy', 'sandy', 'mindy'].map((id) => (engine.state().combatants[id] as FFXCombatant).name);
    expect(names).toEqual(['Cindy', 'Sandy', 'Mindy']);
    expect(engine.state().aeonId).toBe('cindy');
  });
});
