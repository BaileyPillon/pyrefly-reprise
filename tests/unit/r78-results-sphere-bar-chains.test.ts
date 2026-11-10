/**
 * **Release 78 integration (FFX only): the five pooled chains and what the Sphere Level bar of their results page prints, old against new.**
 *
 * `docs/handoff/r78-fix.md` first said the bar change was "inert elsewhere, proven" (a sweep of single-link AP over every FFX chapter). The adversarial review of that branch replayed the five chapters
 * whose links are one results screen (`EnemyGroupDef.poolsChainSpoils`) and found the claim false for three of them: the Mirror Aeons (chapter 27, a LISTED chapter), the Dark Aeons (34) and the Omega Ruins
 * (43) all printed a bar past its cap before, because each link counted its levels from its own AP and dropped the remainder; they print the levels the pooled AP buys now. The Sinspawn Gui and the Flooded Ways
 * are unchanged. This file pins that truth: for each pooled chain the old rows (the old arithmetic, verbatim, as the control), the new rows, and that no new row is past its cap.
 *
 * The AP of each link is the chain's base AP (the enemies' own `rewards.ap`, no overkill; an overkilled link pays more). Every member takes two turns and the engine's levels are what `results.ts` buys from
 * the link's own AP. FFX only (the Sphere Grid is FFX's); FFX-2 is untouched.
 */
import { describe, expect, it } from 'vitest';
import { chainSpoils } from '../../src/app/screens/BattleChainSpoils.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { apForLevel } from '../../src/battle/ffx/results.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS } from '../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx/index.ts';
import { buildMemberRows, formatNumber } from '../../src/ui/common/resultsMath.ts';

/** What the page printed before release 78 (the old `sphereGridDetail`, verbatim arithmetic). */
function oldDetail(sLv: number, bankedAp: number, levelsGained: number): string {
  let rest = bankedAp;
  for (let i = 0; i < levelsGained; i++) rest -= apForLevel(sLv + i);
  const now = sLv + levelsGained;
  return `S.LV ${now} · ${formatNumber(Math.max(0, rest))}/${formatNumber(apForLevel(now))} AP`;
}

/** The levels the engine reports for one link: what `results.ts#sphereLevels` buys from this link's own AP on top of the grid's. */
function levelsOf(sLv: number, gridAp: number, linkAp: number): number {
  let banked = gridAp + linkAp;
  let levels = 0;
  while (banked >= apForLevel(sLv + levels) && levels < 255) {
    banked -= apForLevel(sLv + levels);
    levels += 1;
  }
  return levels;
}

const barOf = (detail: string): { rest: number; cap: number } => {
  const m = /· ([\d,]+)\/([\d,]+) AP$/.exec(detail)!;
  return { rest: Number(m[1]!.replace(/,/g, '')), cap: Number(m[2]!.replace(/,/g, '')) };
};

type AnyGroup = { id: string; enemies: ReadonlyArray<{ rewards?: { ap?: number } }>; nextGroupId?: string; poolsChainSpoils?: boolean };

interface Chain {
  chapterId: string;
  listed: boolean;
  rows: Array<{ id: string; oldText: string; oldDelta: number; newText: string; newDelta: number }>;
  pooledAp: number;
}

const LISTED = new Set<string>(CHAPTERS.map((c) => c.id));
const ALL = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS];

/** Every FFX chapter whose last link pools the spoils, replayed with each link's base AP. */
function replayPooledChains(): Chain[] {
  const out: Chain[] = [];
  for (const chapter of ALL) {
    if (chapter.game !== 'ffx') continue;
    const chain: AnyGroup[] = [];
    const seen = new Set<string>();
    let g = chapter.enemyGroupRef as unknown as AnyGroup | undefined;
    while (g && !seen.has(g.id)) {
      seen.add(g.id);
      chain.push(g);
      g = g.nextGroupId ? (ENEMY_GROUPS_BY_ID as unknown as Record<string, AnyGroup>)[g.nextGroupId] : undefined;
    }
    if (!chain[chain.length - 1]?.poolsChainSpoils) continue;
    const build = chapter.buildRef;
    if (build.game !== 'ffx') continue;
    const apOf = (grp: AnyGroup): number => grp.enemies.reduce((t, e) => t + (e.rewards?.ap ?? 0), 0);
    const aps = chain.map(apOf);
    const links: BattleResult[] = chain.map((_, idx) => {
      const levels: Record<string, number> = {};
      const turns: Record<string, number> = {};
      for (const m of build.members) {
        if (m.guest) continue;
        turns[m.id] = 2;
        levels[m.id] = levelsOf(m.sphereGrid.sLv, m.sphereGrid.ap, aps[idx]!);
      }
      return { outcome: 'victory', turns: 5, elapsedTicks: 1, elapsedMs: 1, ap: aps[idx]!, exp: 0, gil: 10, drops: [], overkilled: [], sphereLevelsGained: levels, turnsTaken: turns } as BattleResult;
    });
    const pooled = chainSpoils('ffx', links.slice(0, -1), links[links.length - 1]!, true);
    const rows = buildMemberRows(chapter, pooled).flatMap((row) => {
      const m = build.members.find((x) => x.id === row.id);
      if (!m) return [];
      const gained = pooled.sphereLevelsGained?.[row.id] ?? 0;
      return [{ id: row.id, oldText: oldDetail(m.sphereGrid.sLv, m.sphereGrid.ap + pooled.ap, gained), oldDelta: gained, newText: row.detail, newDelta: row.levelDelta }];
    });
    out.push({ chapterId: chapter.id, listed: LISTED.has(chapter.id), rows, pooledAp: pooled.ap });
  }
  return out;
}

describe('the five pooled FFX chains: the Sphere Level bar, old against new (release 78, FFX only)', () => {
  const chains = replayPooledChains();
  const by = (id: string): Chain => chains.find((c) => c.chapterId === id)!;

  it('there are exactly six: the Mirror Aeons (listed), the Sinspawn Gui, the Dark Aeons, the Flooded Ways, the Omega Ruins and (hidden chapter 54, FFX only, 2026-11-10) the Gauntlet', () => {
    expect(chains.map((c) => c.chapterId).sort()).toEqual(['dark-aeons', 'flooded-ways', 'gauntlet', 'mirror-aeons', 'omega-ruins', 'sinspawn-gui']);
    // The Gauntlet pools nine links: 8,000 AP each for the three area creations, 50,000 for the six Originals (the loot records, `research/re-ffx-monster-arena-creations.md` section 1).
    expect(by('gauntlet').pooledAp).toBe(3 * 8_000 + 6 * 50_000);
    expect(by('gauntlet').listed).toBe(false);
    expect(by('mirror-aeons').listed).toBe(true);
    expect(by('dark-aeons').listed).toBe(false);
    expect(by('omega-ruins').listed).toBe(false);
  });

  it('no new row is past its cap, on any of the six', () => {
    for (const c of chains) {
      for (const r of c.rows) {
        const { rest, cap } = barOf(r.newText);
        expect(rest, `${c.chapterId}/${r.id}`).toBeLessThan(cap);
      }
    }
  });

  it('the Sinspawn Gui and the Flooded Ways print exactly what they printed before (nothing was dropped between their links)', () => {
    for (const id of ['sinspawn-gui', 'flooded-ways']) {
      for (const r of by(id).rows) {
        expect(r.newText, `${id}/${r.id}`).toBe(r.oldText);
        expect(r.newDelta, `${id}/${r.id}`).toBe(r.oldDelta);
      }
    }
  });

  it('the Mirror Aeons (a LISTED chapter, 27) DO change: the old page printed a bar of 28,000 against 22,000 at the pooled 28,000 AP, the new one buys the level (S.LV +1)', () => {
    const c = by('mirror-aeons');
    expect(c.pooledAp).toBe(28_000);
    const tidus = c.rows.find((r) => r.id === 'tidus')!;
    expect([tidus.oldText, tidus.oldDelta]).toEqual(['S.LV 180 · 28,000/22,000 AP', 0]);
    expect([tidus.newText, tidus.newDelta]).toEqual(['S.LV 181 · 6,000/22,000 AP', 1]);
    for (const r of c.rows) {
      expect(barOf(r.oldText).rest, `old ${r.id}`).toBeGreaterThan(barOf(r.oldText).cap);
      expect(r.newDelta, r.id).toBe(1);
    }
  });

  it('the Dark Aeons (34, hidden) change: seven links pool 150,000 AP; the old bar was 106,000 against 22,000 and the level gain two, the new one is six', () => {
    const c = by('dark-aeons');
    expect(c.pooledAp).toBe(150_000);
    const tidus = c.rows.find((r) => r.id === 'tidus')!;
    expect([tidus.oldText, tidus.oldDelta]).toEqual(['S.LV 182 · 106,000/22,000 AP', 2]);
    expect([tidus.newText, tidus.newDelta]).toEqual(['S.LV 186 · 18,000/22,000 AP', 6]);
  });

  it('the Omega Ruins (43, hidden) change: at the links\' base AP (145,000) the old bar was 35,000 against 22,000, the new one buys the sixth level', () => {
    const c = by('omega-ruins');
    expect(c.pooledAp).toBe(145_000);
    const tidus = c.rows.find((r) => r.id === 'tidus')!;
    expect([tidus.oldText, tidus.oldDelta]).toEqual(['S.LV 185 · 35,000/22,000 AP', 5]);
    expect([tidus.newText, tidus.newDelta]).toEqual(['S.LV 186 · 13,000/22,000 AP', 6]);
  });

  it('the changed rows differ only by whole levels bought: S.LV and the gain move together and the AP line is the same pooled AP', () => {
    for (const id of ['mirror-aeons', 'dark-aeons', 'omega-ruins']) {
      for (const r of by(id).rows) {
        const o = /^S\.LV (\d+) /.exec(r.oldText)!;
        const n = /^S\.LV (\d+) /.exec(r.newText)!;
        expect(Number(n[1]) - Number(o[1]), `${id}/${r.id}`).toBe(r.newDelta - r.oldDelta);
        expect(r.newDelta - r.oldDelta, `${id}/${r.id}`).toBeGreaterThan(0);
      }
    }
  });
});
