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
 * r381-lady-luck (Bailey's recommendation after the independent check) moved two placements so each girl keeps the
 * dressphere the guide pages name: Paine's Farplane ring keeps its White Mage (V, XI, XV: the V page says to swap a White
 * Mage in before Memento Mori) and gives up Black Mage instead, and at Chapter XVI Yuna and Rikku keep their Black Mage
 * (the XVI page says Water hurts Ixion) and give up Gunner instead, so Lady Luck is the first Change row there.
 *
 * What this pins, and why each line matters:
 *  - every girl of the five chapters owns her, on the node the table below says, and her first Change menu is exactly the
 *    table's (the ring's two neighbours of node 0, in the engine's order: node 1, then the last node);
 *  - Lady Luck is one Change away for every girl but Paine in V, XI and XV, where she is two (Dark Knight, White Mage,
 *    Lady Luck) because the White Mage on her last node stays;
 *  - **node 1, the first Change row, is the dressphere it always was** (Chapter XVI excepted, where it is Lady Luck by
 *    design: Chapter XVI has no Itchy, so no autopilot Change reads it). The autopilot's Itchy answer takes the first row,
 *    so this is what keeps Chapters XI and XIII playing exactly as before (digests identical,
 *    `docs/handoff/r38-lady-luck-grid.md`, `docs/handoff/r381-lady-luck.md`);
 *  - the other two chapters own her nowhere and offer no such row;
 *  - after the Change the Skill group offers both reels, which open the minigame (the acceptance check of PR-0340).
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, Command, Decision, EnemyGroupDef, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { gridNodeContents } from '../../src/battle/ffx2/setup.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** Where Lady Luck sits (`at`), and what the girl's first Change menu reads: node 1, then the ring's last node. */
interface Place { at: number; menu: readonly string[] }

/** The Chapter 5 Farplane preset (V, XI, XV share it): Black Mage's node 4 on all three rings; Paine's White Mage stays on node 5. */
const FARPLANE: Record<string, Place> = {
  yuna: { at: 4, menu: ['gunner', 'lady-luck'] }, // Tempered Will, 5 nodes: White Mage, Gunner, Thief, Warrior, Lady Luck
  rikku: { at: 4, menu: ['gunner', 'lady-luck'] }, // Flash of Steel, 5 nodes: Dark Knight, Gunner, Thief, Warrior, Lady Luck
  paine: { at: 4, menu: ['gunner', 'white-mage'] }, // Pride of the Sword, 6: Dark Knight, Gunner, Thief, Warrior, Lady Luck, White Mage
};

/** Chapters whose story point the sources put at or after Lady Luck's pickup. */
const WITH: Record<string, Record<string, Place>> = {
  'ffx2-vegnagun-shuyin': FARPLANE, // Chapter 5
  'ffx2-fallen-aeons': FARPLANE, // Chapter 5, the Road to the Farplane
  'ffx2-den-of-woe': FARPLANE, // Chapter 5, optional
  'ffx2-trema': {
    // Chapter 5, the Via Infinito (shipped kit): Lady Luck on node 4 of Valiant Lustre's five nodes, node 1 as it was
    yuna: { at: 4, menu: ['white-mage', 'lady-luck'] },
    rikku: { at: 4, menu: ['gunner', 'lady-luck'] },
    paine: { at: 4, menu: ['warrior', 'lady-luck'] },
  },
  'ffx2-ixion-djose': {
    // the end of Chapter 3: node 1 of every ring, Gunner off; Black Mage (Water) and the Warrior stay on the last node
    yuna: { at: 1, menu: ['lady-luck', 'black-mage'] }, // Protection Halo, 5 nodes: White Mage, Lady Luck, Thief, Warrior, Black Mage
    rikku: { at: 1, menu: ['lady-luck', 'black-mage'] }, // Hour of Need, 5 nodes: Dark Knight, Lady Luck, Thief, Warrior, Black Mage
    paine: { at: 1, menu: ['lady-luck', 'warrior'] }, // Stonehewn, 4 nodes: Dark Knight, Lady Luck, Thief, Warrior
  },
};
/** Chapter 2 story points: earlier than Lady Luck's earliest pickup (Chapter 3). */
const WITHOUT = ['ffx2-bahamut', 'ffx2-leblanc'];
/** The three that share the Farplane preset. */
const FARPLANE_CHAPTERS = ['ffx2-vegnagun-shuyin', 'ffx2-fallen-aeons', 'ffx2-den-of-woe'];

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

describe("Lady Luck is on every girl's grid where the guides say she can be owned, and the Change menus are the table's", () => {
  for (const [id, places] of Object.entries(WITH)) {
    it(`${id}: all three girls own her, she is on the table's node, and the first Change menu is the table's`, () => {
      const p = party(id);
      const { menus } = firstMenus(id);
      expect([...menus.keys()].sort()).toEqual(['paine', 'rikku', 'yuna']);
      for (const m of p.members) {
        const want = places[m.id]!;
        expect(m.owned).toContain('lady-luck');
        const grid = data.GARMENT_GRIDS[m.garmentGrid.id as keyof typeof data.GARMENT_GRIDS];
        const nodes = gridNodeContents(m, grid.nodeCount);
        expect(nodes.indexOf('lady-luck'), `${id} ${m.id}: Lady Luck's node of ${grid.nodeCount}`).toBe(want.at);
        // A ring: node 0's two neighbours are node 1 and the last node, in that order.
        expect([nodes[1], nodes[grid.nodeCount - 1]], `${id} ${m.id}: the ring's neighbours of node 0`).toEqual([...want.menu]);
        const rows = changes(menus.get(m.id)!);
        expect(rows, `${id} ${m.id}: Change menu`).toEqual([...want.menu]);
      }
    });
  }

  it('Chapter XVI keeps the dresspheres the guide page needs: Black Mage for Water on Yuna and Rikku, the Warrior on Paine; only Gunner left the grid', () => {
    for (const m of party('ffx2-ixion-djose').members) {
      const grid = data.GARMENT_GRIDS[m.garmentGrid.id as keyof typeof data.GARMENT_GRIDS];
      const nodes = gridNodeContents(m, grid.nodeCount);
      expect(nodes, m.id).not.toContain('gunner');
      expect(m.owned, `${m.id} still owns Gunner`).toContain('gunner');
      expect(nodes, m.id).toContain(m.id === 'paine' ? 'warrior' : 'black-mage');
    }
  });

  it("Chapters V, XI and XV keep a White Mage one Change from Paine's Dark Knight, and Black Mage is the dressphere she gave up", () => {
    for (const id of FARPLANE_CHAPTERS) {
      const paine = party(id).members.find((m) => m.id === 'paine')!;
      const grid = data.GARMENT_GRIDS[paine.garmentGrid.id as keyof typeof data.GARMENT_GRIDS];
      const nodes = gridNodeContents(paine, grid.nodeCount);
      expect(nodes[grid.nodeCount - 1], `${id}: the last node, one Change from node 0`).toBe('white-mage');
      expect(nodes).not.toContain('black-mage');
      expect(paine.owned, `${id}: still owned`).toContain('black-mage');
    }
  });

  for (const id of WITHOUT) {
    it(`${id}: a Chapter 2 story point, so nobody owns her and no Change row names her`, () => {
      for (const m of party(id).members) expect(m.owned).not.toContain('lady-luck');
      const { menus } = firstMenus(id);
      for (const [, d] of menus) expect(changes(d)).not.toContain('lady-luck');
    });
  }
});

describe('Paine reaches Lady Luck through her White Mage in Chapters V, XI and XV (two Changes)', () => {
  for (const id of FARPLANE_CHAPTERS) {
    it(`${id}: Dark Knight to White Mage, then Lady Luck is on her Change menu beside Dark Knight`, () => {
      const ch = getChapter(id)!;
      const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
      engine.setSeed(1);
      engine.init({
        game: 'ffx2', party: ch.buildRef as FFX2PartyBuild, enemies: ch.enemyGroupRef as EnemyGroupDef,
        triggers: [], seed: 1, condition: 'normal', canEscape: false,
      });
      let changed = false;
      let seen: Input | null = null;
      for (let i = 0; i < 6_000 && !seen; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
        if (d.kind !== 'player-input') break;
        if (d.actorId === 'paine' && !changed) {
          const row = d.commands.find((c) => c.command.kind === 'spherechange' && (c.command as { extra: { toDressphere: string } }).extra.toDressphere === 'white-mage');
          expect(row, 'a White Mage row on her first Change menu').toBeDefined();
          changed = true;
          engine.submit(row!.command as Command);
          continue;
        }
        if (d.actorId === 'paine' && changed) { seen = d; break; }
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
        const target = row?.validTargets[0];
        engine.submit({ ...row!.command, targets: target ? [target] : [] } as Command);
      }
      expect(seen, 'she acts again after the Change').not.toBeNull();
      expect(changes(seen!)).toEqual(['lady-luck', 'dark-knight']); // from node 5 the ring's neighbours are node 4 and node 0
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
          // Whoever acts first with a Lady Luck row on her menu: in V, XI and XV that is never Paine (two Changes away).
          const change = d.commands.find((c) => c.command.kind === 'spherechange' && (c.command as { extra: { toDressphere: string } }).extra.toDressphere === 'lady-luck');
          if (change) {
            actor = d.actorId;
            engine.submit(change.command as Command);
            continue;
          }
        } else if (d.actorId === actor) { seen = d; break; }
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
        const target = row?.validTargets[0];
        engine.submit({ ...row!.command, targets: target ? [target] : [] } as Command);
      }
      expect(actor, 'a girl with a Lady Luck row on her first menu acts').not.toBeNull();
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
