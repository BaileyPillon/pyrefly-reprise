/**
 * PR-0144 (round 10): chapter 6's strategy guide keyed its Attack hints on a
 * boss being **in the fight**, not on the **target**, so after Logos fell
 * every "Attack -> Ormi" NEXT line gave Logos' Evasion 40 as its reason, and
 * the Leblanc line could never print.
 *
 * Run on the engine, Act III, the shipped line, the way the critic's probe
 * found it: every NEXT line on an Attack names the target it is aimed at.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14] — the Leblanc Syndicate is an
 * FFX-2 chapter; the new `targetId` key is shared plumbing and changes no FFX
 * guide, none of which uses it.
 */

import { describe, expect, it } from 'vitest';
import type { Decision } from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_ACT_III } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { buildGuideView } from '../../src/engine/tactics/guide.ts';

const LOGOS_LINE = "Logos' Evasion 40";
const LEBLANC_LINE = 'Her Defense 10';

describe('Chapter 6 guide — Attack hints follow the target [PR-0144]', () => {
  it('Act III, seeds 1-20: no Attack on Ormi or Leblanc is explained by Logos', () => {
    const tally = { ormi: 0, logos: 0, leblanc: 0, ormiAfterLogos: 0 };
    for (let seed = 1; seed <= 20; seed += 1) {
      const engine = new FFX2Engine({
        abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
        items: itemRegistryFrom(Object.values(data.ITEMS)),
        dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
        garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
        minigames: false,
      });
      engine.setSeed(seed);
      engine.init({
        game: 'ffx2', party: chateauBuild, enemies: data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III]!, triggers: [],
        seed, condition: 'normal', canEscape: false,
      });
      for (let i = 0; i < 20_000; i += 1) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
        if (d.kind !== 'player-input') continue;
        const next = buildGuideView(engine.state(), { actorId: d.actorId, commands: d.commands })?.next;
        if (next && next.command.kind === 'attack') {
          const logosDown = engine.state().combatants['logos']?.alive === false;
          if (next.targetId === 'ormi') {
            tally.ormi += 1;
            if (logosDown) tally.ormiAfterLogos += 1;
            expect(next.reason).not.toContain(LOGOS_LINE);
          }
          if (next.targetId === 'leblanc') {
            tally.leblanc += 1;
            expect(next.reason).toContain(LEBLANC_LINE);
          }
          if (next.targetId === 'logos') {
            tally.logos += 1;
            expect(next.reason).toContain(LOGOS_LINE);
          }
        }
        const cmd = next?.command ?? { kind: 'defend' as const, targets: [] };
        if (engine.submit(cmd).length === 0) break;
      }
    }
    // Measured 2026-09-23: 47 Attack -> Ormi lines (all after Logos fell), 23 on
    // Logos, 72 on Leblanc. Before the fix all 47 Ormi lines read Logos'
    // evasion and none of the 72 Leblanc lines printed her own hint.
    // The board the critic reported has to be reached, or the test proves nothing.
    expect(tally.ormiAfterLogos).toBeGreaterThan(0);
  }, 120_000);
});
