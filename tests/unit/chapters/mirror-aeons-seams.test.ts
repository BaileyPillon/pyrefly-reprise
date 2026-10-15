/**
 * **The seams for the reverse-engineering session's work** on the hidden Mirror Aeons chapter (FFX only; `src/battle/ffx/ai/dark-aeons-seams.ts`): what is RE's, probed from the live registry and the live engine, each
 * block **skipping until its seam is filled** and then running by itself. A half-registered set of scripts fails loudly; so does a wrong shape. Nothing here writes the AI or the summon rules.
 *
 *  - the Dark aeons' AI (four scripts and the dog's bite): `registerAiScript` under the ids in `DARK_SCRIPTS`;
 *  - Yuna's Yojimbo (hire answer, compatibility, Pay, free attack): a `Pay` row on his menu once the rules land;
 *  - Yuna's Magus Sisters as one summon: summoning any Sister brings all three actors onto the field.
 */
import { describe, expect, it } from 'vitest';

import type { Command } from '../../../src/battle/common/types.ts';
import { DARK_SCRIPTS, darkAeonsSeamStatus, darkScriptsLanded } from '../../../src/battle/ffx/ai/dark-aeons-seams.ts';
import { getAiScript, registeredAiScriptIds } from '../../../src/battle/ffx/ai/types.ts';
import { sistersGroupId, yojimboGroupId, YOJIMBO_TIERS } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import { YOJIMBO_HIRE_ANSWER, YOJIMBO_START_COMPATIBILITY } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import * as H from '../helpers/mirrorAeonsDrive.ts';

const status = darkAeonsSeamStatus();

/** Summon `aeon` with Yuna on a fresh Act I engine; the engine after the summon, or null when the row is missing. */
function summoned(aeon: string, group: string = H.ACT_I_GROUP): ReturnType<typeof H.newEngine> | null {
  const e = H.newEngine(2, group);
  let d = H.nextInput(e);
  for (let i = 0; d.actorId !== 'yuna' && i < 12; i++) { e.submit(H.defend()); d = H.nextInput(e); }
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label.toLowerCase() === aeon);
  if (!row) return null;
  e.submit({ ...row.command, targets: [] } as Command);
  return e;
}

/** The player's Yojimbo rules have landed when his menu carries a Pay row. */
const yojimboRules = ((): boolean => {
  const e = summoned('yojimbo');
  if (!e) return false;
  return H.nextInput(e).commands.some((c) => /^pay/i.test(c.label));
})();

/** The Sisters are one summon when calling Cindy puts all three on the field. */
const sistersAsOne = ((): boolean => {
  const e = summoned('cindy');
  if (!e) return false;
  const active = e.state().activeIds;
  return ['cindy', 'sandy', 'mindy'].every((id) => active.includes(id));
})();

describe('what exists today (a record, not a promise)', () => {
  it('names the seams: the registered scripts are all or nothing for the sisters, and the status object agrees with the registry', () => {
    const sisters = [DARK_SCRIPTS.cindy, DARK_SCRIPTS.sandy, DARK_SCRIPTS.mindy].filter((id) => getAiScript(id) !== undefined).length;
    expect([0, 3], 'a half-registered set of sister scripts').toContain(sisters);
    expect(status.sisters).toBe(sisters === 3);
    expect(status.yojimbo).toBe(registeredAiScriptIds().includes(DARK_SCRIPTS.yojimbo));
    expect(status.daigoro).toBe(registeredAiScriptIds().includes(DARK_SCRIPTS.daigoro));
    expect(darkScriptsLanded()).toBe(status.sisters && status.yojimbo);
    // eslint-disable-next-line no-console
    console.info(`[mirror-aeons seams] sister scripts: ${status.sisters}, Yojimbo's script: ${status.yojimbo}, the dog's bite: ${status.daigoro}, the player's Yojimbo rules (a Pay row): ${yojimboRules}, the Sisters as one summon: ${sistersAsOne}`);
  });

  it('the player\'s two named estimates are what the engine will read, and nothing reads them yet', () => {
    expect([YOJIMBO_HIRE_ANSWER, YOJIMBO_START_COMPATIBILITY]).toEqual([2, 128]);
  });
});

describe.skipIf(status.sisters)('until the sisters\' scripts land: the engine\'s own fallback, a plain Attack on the party', () => {
  it('every sister acts, and only with the generic Attack (no Delta Attack is ever chosen)', () => {
    const e = H.newEngine(1);
    for (let i = 0; i < 40; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') e.submit(H.defend());
    }
    const moves = ['dark-mindy', 'dark-sandy', 'dark-cindy'].flatMap((id) => H.actions(H.log(e), id));
    expect(moves.length).toBeGreaterThan(0);
    expect(new Set(moves)).toEqual(new Set(['attack']));
  });
});

describe.skipIf(!status.sisters)('the sisters\' scripts are registered', () => {
  it('the trio opens with the joint attack on the whole front line: every gauge is 100 at the start (RE section 4.2)', () => {
    const e = H.newEngine(1);
    for (let i = 0; i < 30; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') e.submit(H.defend());
      const firstMove = ['dark-mindy', 'dark-sandy', 'dark-cindy'].flatMap((id) => H.actions(H.log(e), id))[0];
      if (firstMove !== undefined) {
        expect(firstMove).toBe('dark-delta-attack');
        return;
      }
    }
    throw new Error('no sister acted');
  });

  it('a lone sister with a full gauge uses Mega Graviton (RE section 4.2: Cindy\'s second branch)', () => {
    const e = H.newEngine(1, sistersGroupId('kino01_71'));
    H.actor(e, 'dark-cindy').overdrive!.gauge = 100;
    for (let i = 0; i < 20; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') e.submit(H.defend());
      const moves = H.actions(H.log(e), 'dark-cindy');
      if (moves.length > 0) {
        expect(moves[0]).toBe('dark-mega-graviton');
        return;
      }
    }
    throw new Error('Cindy never acted');
  });

  it('every move a sister uses is one of the rows her record lists', () => {
    const own: Record<string, string[]> = {
      'dark-cindy': ['dark-cindy-attack', 'dark-camisade', 'dark-mega-graviton', 'dark-delta-attack'],
      'dark-sandy': ['dark-sandy-attack', 'dark-razzia', 'dark-mega-graviton', 'dark-delta-attack'],
      'dark-mindy': ['dark-passado', 'dark-calamity', 'dark-mega-graviton', 'dark-delta-attack'],
    };
    const r = H.playOne(3, H.ACT_I_GROUP, () => H.defend(), 60);
    for (const [id, list] of Object.entries(own)) for (const move of H.actions(r.events, id)) expect(list, `${id} ${move}`).toContain(move);
  });
});

describe.skipIf(!status.yojimbo)('Dark Yojimbo\'s script is registered', () => {
  for (const tier of YOJIMBO_TIERS) {
    it(`${tier.file}: his gauge rises by ${tier.gaugePerTurn} after his own turns, Zanmato at a full gauge empties it, and every move is one of his rows (RE section 4.1)`, () => {
      const e = H.newEngine(1, yojimboGroupId(tier.file));
      const own = ['dark-wakizashi-all', 'dark-kozuka', 'dark-daigoro-order', 'dark-zanmato'];
      let last = H.actor(e, 'dark-yojimbo').overdrive?.gauge ?? 0;
      let acted = 0;
      for (let i = 0; i < 80 && acted < 6; i++) {
        const d = e.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') e.submit(H.defend());
        const moves = H.actions(H.log(e), 'dark-yojimbo');
        if (moves.length > acted) {
          acted = moves.length;
          const move = moves.at(-1)!;
          expect(own, move).toContain(move);
          const gauge = H.actor(e, 'dark-yojimbo').overdrive?.gauge ?? 0;
          if (move === 'dark-zanmato') expect(gauge).toBeLessThanOrEqual(tier.gaugePerTurn + 2);
          else expect(gauge).toBeGreaterThanOrEqual(Math.min(100, last + tier.gaugePerTurn));
          last = gauge;
        }
      }
      expect(acted).toBeGreaterThan(0);
    });
  }
});

describe.skipIf(!status.daigoro)('the dog\'s script is registered', () => {
  it('the dog bites with Daigoro\'s row 0x410B, with Strength 244, when Dark Yojimbo orders it', () => {
    const r = H.playOne(1, H.ACT_II_GROUP, () => H.defend(), 80);
    const bites = H.actions(r.events, 'dark-daigoro');
    for (const b of bites) expect(b).toBe('dark-daigoro-bite');
  });
});

describe.skipIf(!yojimboRules)('Yuna\'s Yojimbo has his rules', () => {
  it('his menu carries Pay, and a Pay of nothing costs him compatibility (G08 section 3.2: -20) while the gil is not taken', () => {
    const e = summoned('yojimbo')!;
    const d = H.nextInput(e);
    expect(d.commands.some((c) => /^pay/i.test(c.label))).toBe(true);
  });
});

describe.skipIf(!sistersAsOne)('Yuna\'s Magus Sisters arrive as one summon', () => {
  it('calling any one of them brings all three onto the field, each with her own gauge (RE section 5.1)', () => {
    for (const name of ['cindy', 'sandy', 'mindy']) {
      const e = summoned(name)!;
      expect(['cindy', 'sandy', 'mindy'].every((id) => e.state().activeIds.includes(id)), name).toBe(true);
    }
  });
});
