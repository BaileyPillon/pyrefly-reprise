/**
 * **Seymour Natus — the Highbridge build and the chapter registration.** Split
 * out of `natus-engine.test.ts` for the house 400-line rule.
 *
 * The build is `src/data/ffx/builds/highbridge.ts`: Bailey's B2 to B5 kit, and
 * since 2026-09-24 ("I'll go with all your recommendations") the Gagazet
 * preset's stat cells, the upper bound Chapter IX ships at. Every cell is
 * `[estimate]` as `gagazet.ts` labels it; the boss is never tuned.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import { highbridgeBuild } from '../../../src/data/ffx/builds/highbridge.ts';
import { fahrenheitBuild } from '../../../src/data/ffx/builds/fahrenheit.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import { macalaniaBuild } from '../../../src/data/ffx/builds/macalania.ts';
import { yojimboCavernBuild } from '../../../src/data/ffx/builds/yojimbo-cavern.ts';
import { CHAPTERS, CHAPTER_IDS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';

const GROUP_ID = 'seymour-natus';


describe('The Highbridge build and the chapter registration', () => {
  it('B2-B5: Tidus/Yuna/Kimahri open; Bahamut full, the rest partial; Yuna has no Reflect, Rikku does; Chapter VIII’s bag', () => {
    expect(highbridgeBuild.activeSlots).toEqual(['tidus', 'yuna', 'kimahri']);
    expect(highbridgeBuild.reserve).toEqual(['auron', 'wakka', 'lulu', 'rikku']);
    expect(highbridgeBuild.aeons.map((a) => a.id)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']);
    const gauges = Object.fromEntries(highbridgeBuild.aeons.map((a) => [a.id, a.overdriveGauge]));
    expect(gauges['bahamut']).toBe(100);
    for (const id of ['valefor', 'ifrit', 'ixion', 'shiva']) expect(gauges[id]).toBeLessThan(100);
    const m = (id: string) => highbridgeBuild.members.find((x) => x.id === id)!;
    expect(m('yuna').learnedAbilityIds).not.toContain('reflect');
    expect(m('rikku').learnedAbilityIds).toContain('reflect');
    expect(m('rikku').equipment.armor.autoAbilities).toContain('stone-ward');
    for (const id of ['tidus', 'auron', 'yuna']) expect(m(id).learnedAbilityIds).toContain('talk');
    for (const id of ['kimahri', 'wakka', 'lulu', 'rikku']) expect(m(id).learnedAbilityIds).not.toContain('talk');
    for (const x of highbridgeBuild.members) expect(x.learnedAbilityIds).not.toContain('pull-back');
    expect(highbridgeBuild.inventory).toEqual(fahrenheitBuild.inventory);
  });

  it('Rule 1 (Bailey, 2026-09-24): every member carries the Gagazet preset’s stat cells, the upper bound Chapter IX ships; only the stats move (Rikku’s MP is the pinned exception, see the next test)', () => {
    const grid = ['hp', 'mp', 'str', 'def', 'mag', 'mdef', 'agi', 'luck', 'eva', 'acc'] as const;
    for (const x of highbridgeBuild.members) {
      const top = gagazetBuild.members.find((g) => g.id === x.id)!;
      const cavern = yojimboCavernBuild.members.find((g) => g.id === x.id)!;
      for (const k of grid) {
        if (x.id === 'rikku' && k === 'mp') continue; // pinned to Chapter VIII's 130, not Gagazet's copy
        expect(x.stats[k], `${x.id}.${k}`).toBe(top.stats[k]);
        expect(x.stats[k], `${x.id}.${k} vs Chapter IX`).toBe(cavern.stats[k]);
      }
      const hp10 = x.equipment.armor.autoAbilities.includes('hp-10');
      expect(x.stats.maxHp, x.id).toBe(hp10 ? Math.floor((top.stats.hp * 110) / 100) : top.stats.hp);
      expect(x.hp).toBe(x.stats.maxHp);
      if (x.id !== 'rikku') expect(x.stats.maxMp).toBe(top.stats.mp);
      expect(x.mp).toBe(x.stats.maxMp);
      // Gear and gauges are the carried ones, not the mountain's (rules 3 and 4).
      const carried = (x.id === 'yuna' ? macalaniaBuild : fahrenheitBuild).members.find((g) => g.id === x.id)!;
      expect(x.equipment).toEqual(carried.equipment);
      expect(x.overdrive?.gauge).toBe(carried.overdrive?.gauge);
      expect(x.learnedAbilityIds).not.toContain('mighty-guard');
      expect(x.learnedAbilityIds).not.toContain('white-wind');
    }
    expect(highbridgeBuild.gil).toBe(fahrenheitBuild.gil);
  });

  it('Rikku’s MP is pinned to Chapter VIII’s 130, not the Gagazet copy’s 115 (Bailey, 2026-09-24 ~20:00 EDT, "I\'ll go with your recommendation"); no other cell inverts', () => {
    const rikku = highbridgeBuild.members.find((x) => x.id === 'rikku')!;
    const low = fahrenheitBuild.members.find((x) => x.id === 'rikku')!;
    const high = gagazetBuild.members.find((x) => x.id === 'rikku')!;
    expect(low.stats.mp).toBe(130);
    expect(high.stats.mp).toBe(115); // the Gagazet cell commit 186f13dd found under Chapter VIII's bound
    expect(rikku.stats.mp).toBe(130);
    expect(rikku.stats.maxMp).toBe(130);
    expect(rikku.mp).toBe(130);

    const inversions: string[] = [];
    for (const x of highbridgeBuild.members) {
      const lower = fahrenheitBuild.members.find((g) => g.id === x.id);
      if (!lower) continue; // Yuna: no Chapter VIII row
      for (const k of ['hp', 'mp', 'str', 'def', 'mag', 'mdef', 'agi', 'luck', 'eva', 'acc'] as const) {
        if (x.stats[k] < lower.stats[k]) inversions.push(`${x.id}.${k} ${lower.stats[k]}->${x.stats[k]}`);
      }
    }
    expect(inversions).toEqual([]);
  });

  it('Chapter X is registered by id, reachable, and not listed (no chapter-select card)', () => {
    const ch = getChapter('seymour-natus');
    expect(ch).toMatchObject({ game: 'ffx', number: 10, title: 'Seymour Natus', location: 'Highbridge of Bevelle — before the Main Gate' });
    expect(ch?.enemyGroupRef.id).toBe(GROUP_ID);
    expect(UNLISTED_CHAPTERS.map((c) => c.id)).toContain('seymour-natus');
    expect(CHAPTERS.map((c) => c.id)).not.toContain('seymour-natus');
    expect(CHAPTER_IDS).not.toContain('seymour-natus');
    expect(ch?.sceneKey).not.toBe('bevelle-underground'); // the FFX-2 arena (research §0.3)
    expect(ch?.sceneKey).toBe('bevelle-highbridge'); // the ship layer's scene (O-3 C)
    expect(ch?.scriptsRef.pre.at(-1)).toEqual({ type: 'battleStart' }); // the story: natus-ship-story.test.ts
    expect(ch?.scriptsRef.post.at(-1)).toEqual({ type: 'results' });
  });
});
