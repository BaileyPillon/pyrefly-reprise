/**
 * **Lady Luck is selectable where the guides say the girls could own her.** FFX-2 only.
 *
 * Bailey, D-361 (2026-10-03): "make Lady Luck selectable, but only where the FFX-2 guides say the girls could have
 * the dressphere at that point in the story". `research/ffx2-lady-luck-availability.md` maps the seven FFX-2
 * chapters: she is a Chapter 3 or Chapter 5 pickup (Sphere Break against Shinra in Luca), so the Chapter 3 end
 * (XVI Ixion at Djose) and the Chapter 5 chapters (V Vegnagun, XI Fallen Aeons, XIII Trema, XV Den of Woe) can have
 * her; the two Chapter 2 chapters (IV Bahamut, VI Leblanc) cannot. Before this, no shipped Garment Grid offered her
 * (critic round 20, PR-0340), so the reels of release 37 were unreachable.
 *
 * What this pins, and why each line matters:
 *  - every girl of the five chapters can Change into Lady Luck from the dressphere she starts in, one link away;
 *  - the other two chapters own her nowhere and offer no such row;
 *  - after the Change the Skill group offers both reels, which open the minigame (the acceptance check of PR-0340);
 *  - **node 1, the first Change row, is the dressphere it always was** (Paine's four-node Stonehewn at Chapter XVI
 *    excepted, where it is Lady Luck by design). The autopilot's Itchy answer takes the first row, so this is what
 *    keeps Chapters XI and XIII playing exactly as before (digests identical, `docs/handoff/r38-lady-luck-grid.md`).
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, Command, Decision, EnemyGroupDef, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { gridNodeContents } from '../../src/battle/ffx2/setup.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** Chapters whose story point the sources put at or after Lady Luck's pickup, and node 1 of each girl's grid. */
const WITH: Record<string, Record<string, string>> = {
  'ffx2-vegnagun-shuyin': { yuna: 'gunner', rikku: 'gunner', paine: 'gunner' }, // Chapter 5
  'ffx2-fallen-aeons': { yuna: 'gunner', rikku: 'gunner', paine: 'gunner' }, // Chapter 5, the Road to the Farplane
  'ffx2-den-of-woe': { yuna: 'gunner', rikku: 'gunner', paine: 'gunner' }, // Chapter 5, optional
  'ffx2-trema': { yuna: 'white-mage', rikku: 'gunner', paine: 'warrior' }, // Chapter 5, the Via Infinito (shipped kit)
  'ffx2-ixion-djose': { yuna: 'gunner', rikku: 'gunner', paine: 'lady-luck' }, // the end of Chapter 3
};
/** Chapter 2 story points: earlier than Lady Luck's earliest pickup (Chapter 3). */
const WITHOUT = ['ffx2-bahamut', 'ffx2-leblanc'];

const party = (id: string): FFX2PartyBuild => getChapter(id)!.buildRef as FFX2PartyBuild;

function firstMenus(id: string): { engine: FFX2Engine; menus: Map<string, Input>; log: Array<[string, Input]> } {
  const ch = getChapter(id)!;
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  const setup: BattleSetup = {
    game: 'ffx2', party: ch.buildRef as FFX2PartyBuild, enemies: ch.enemyGroupRef as EnemyGroupDef,
    triggers: [], seed: 1, condition: 'normal', canEscape: false,
  };
  engine.setSeed(1);
  engine.init(setup);
  const menus = new Map<string, Input>();
  const log: Array<[string, Input]> = [];
  for (let i = 0; i < 4_000 && menus.size < 3; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
    if (d.kind !== 'player-input') break;
    if (!menus.has(d.actorId)) { menus.set(d.actorId, d); log.push([d.actorId, d]); }
    const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
    const target = row?.validTargets[0];
    engine.submit({ ...row!.command, targets: target ? [target] : [] } as Command);
  }
  return { engine, menus, log };
}

const changes = (d: Input): string[] =>
  d.commands.filter((c) => c.command.kind === 'spherechange').map((c) => (c.command as { extra: { toDressphere: string } }).extra.toDressphere);

describe('Lady Luck is one Change away where the guides say she can be owned', () => {
  for (const [id, firstRow] of Object.entries(WITH)) {
    it(`${id}: all three girls own her, set her on the grid next to the worn dressphere, and can Change into her`, () => {
      const p = party(id);
      const { menus } = firstMenus(id);
      expect([...menus.keys()].sort()).toEqual(['paine', 'rikku', 'yuna']);
      for (const m of p.members) {
        expect(m.owned).toContain('lady-luck');
        const grid = data.GARMENT_GRIDS[m.garmentGrid.id as keyof typeof data.GARMENT_GRIDS];
        const nodes = gridNodeContents(m, grid.nodeCount);
        const at = nodes.indexOf('lady-luck');
        // A ring: node 0's two neighbours are node 1 and the last node.
        expect([1, grid.nodeCount - 1], `${id} ${m.id}: Lady Luck on node ${at} of ${grid.nodeCount}`).toContain(at);
        expect(nodes[1], `${id} ${m.id}: the first Change row`).toBe(firstRow[m.id]);
        const rows = changes(menus.get(m.id)!);
        expect(rows, `${id} ${m.id}: Change menu`).toContain('lady-luck');
        expect(rows.length, `${id} ${m.id}: at most two neighbours`).toBeLessThanOrEqual(2);
        // The first row is read by the autopilot's Itchy answer: it is what it always was.
        expect(rows[0], `${id} ${m.id}: the first Change row`).toBe(firstRow[m.id]);
      }
    });
  }

  for (const id of WITHOUT) {
    it(`${id}: a Chapter 2 story point, so nobody owns her and no Change row names her`, () => {
      for (const m of party(id).members) expect(m.owned).not.toContain('lady-luck');
      const { menus } = firstMenus(id);
      for (const [, d] of menus) expect(changes(d)).not.toContain('lady-luck');
    });
  }
});

describe('after the Change, both reels are on the menu and open the minigame', () => {
  for (const id of Object.keys(WITH)) {
    it(`${id}: Change to Lady Luck, then Attack Reels and Magic Reels are offered, each with its minigame`, () => {
      const ch = getChapter(id)!;
      const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
      engine.setSeed(1);
      engine.init({
        game: 'ffx2', party: ch.buildRef as FFX2PartyBuild, enemies: ch.enemyGroupRef as EnemyGroupDef,
        triggers: [], seed: 1, condition: 'normal', canEscape: false,
      });
      let actor: string | null = null;
      let seen: Input | null = null;
      for (let i = 0; i < 4_000 && !seen; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
        if (d.kind !== 'player-input') break;
        if (actor === null) {
          const change = d.commands.find((c) => c.command.kind === 'spherechange' && (c.command as { extra: { toDressphere: string } }).extra.toDressphere === 'lady-luck');
          expect(change, 'the first girl to act has a Lady Luck row').toBeDefined();
          actor = d.actorId;
          engine.submit(change!.command as Command);
          continue;
        }
        if (d.actorId === actor) { seen = d; break; }
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
        const target = row?.validTargets[0];
        engine.submit({ ...row!.command, targets: target ? [target] : [] } as Command);
      }
      expect(seen, 'she acts again after the Change').not.toBeNull();
      const reel = (needle: string) => seen!.commands.find((c) => 'id' in c.command && String(c.command.id).includes(needle));
      for (const needle of ['attack-reels', 'magic-reels']) {
        const row = reel(needle);
        expect(row, `${id}: ${needle}`).toBeDefined();
        expect(row!.enabled).toBe(true);
        expect(row!.opensMinigame).toBe('ladyluck-reels');
      }
    });
  }
});
