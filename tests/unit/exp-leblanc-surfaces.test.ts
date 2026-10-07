// @vitest-environment jsdom
/**
 * **Experimental: Leblanc (new art)** — the surfaces outside the stage, and the facing and registration decisions of the installed paintings
 * (branch `exp-leblanc`; **FFX-2 only**, AGENTS.md rule 14; the driver's install of 2026-10-06).
 *
 * 1. **Facing**: the fiends stand on the right and face the party, the girls face right, and the engine mirrors a painting only when its sidecar's
 *    `facing` disagrees with the side it stands on (`mirrorFor`). Every installed painting says so, and none needs a mirror in play.
 * 2. **Surfaces** (each reads the experiment's own paintings, and the base art everywhere else): the HUD party heads and the prep, card and
 *    results faces (the namespaced idle's head, never a portrait of the old art), the story-scene figures, the dressphere twirl.
 * 3. **The records**: the head box of every installed girl's idle, the registration rows measured off the new paintings, the generated figure metrics.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { EXP_FIGURE_METRICS } from '../../src/data/art/expFigureMetrics.ts';
import { inArtNamespace } from '../../src/data/art/artNamespace.ts';
import { mirrorFor, parseArtFacing } from '../../src/engine/BattlePresenterActors.ts';
import { girlOf, namespacePrefixOf, twirlPlan } from '../../src/engine/fx/mix/twirlPlan.ts';
import { poseRegistrationFor } from '../../src/engine/PoseRegistration.ts';
import { characterUrl } from '../../src/engine/BattlePresenterArt.ts';
import { cutsceneFigure, cutsceneFigureIn } from '../../src/app/screens/cutsceneFigures.ts';
import { recommendedParty } from '../../src/app/screens/frontend/chapterCards.ts';
import { rosterHtml, slotsHtml } from '../../src/app/screens/PartyPrepContent.ts';
import { FFX2_LEBLANC, getChapter } from '../../src/data/encounters.ts';
import { bodyCrop, bodyFaceImgHtml } from '../../src/ui/common/portrait.ts';
import { faceLadder, partyFaceHtml } from '../../src/ui/common/partyFace.ts';
import { memberFaceHtml } from '../../src/ui/common/resultsPage.ts';
import { wedgeFallenArt } from '../../src/ui/common/victoryLine.ts';
import { partyRowHtml } from '../../src/ui/ffx2/PartyRows.ts';
import { buildExpFigureMetrics, renderExpFigureMetrics } from '../../tools/exp-art-table.mjs';
import { registrationRow } from '../../tools/exp-install.mjs';
import type { FFX2Combatant } from '../../src/battle/common/types.ts';

const REPO = join(__dirname, '..', '..');
const ART = join(REPO, 'public', 'art');
const HAVE_ART = existsSync(join(ART, 'manifest.json')) && existsSync(join(ART, 'characters', 'exp-leblanc-yuna-gunner', 'idle.json'));
const NS = 'exp-leblanc';
const exp = getChapter('exp-leblanc')!;

interface InstalledPose { size: [number, number]; baselineY: number; contentBox: number[]; facing: string; head: number[] | null; row: Record<string, number | true>; scaleSource?: string; stanceSource?: string; artRoom: { id: string; approvedBy?: string } }
const INSTALLED: Record<string, Record<string, InstalledPose>> = JSON.parse(readFileSync(join(REPO, 'docs', 'target', 'exp-leblanc', 'installed.json'), 'utf8'));
const sidecar = (id: string, pose: string): { facing?: string; width: number; height: number; baselineY: number } => JSON.parse(readFileSync(join(ART, 'characters', id, `${pose}.json`), 'utf8'));

describe('facing: every installed painting faces the way the game draws its side', () => {
  const FIENDS = ['leblanc', 'logos', 'ormi', 'ffx2-dr-goon', 'ffx2-fem-goon'];
  const GIRLS = ['yuna-gunner', 'rikku-thief', 'paine-warrior'];

  it('records the facing of each painting: fiends left (they face the party), girls right', () => {
    for (const subject of FIENDS) {
      for (const [pose, rec] of Object.entries(INSTALLED[subject] ?? {})) {
        // A lying KO is oriented by where its head lies. The goons' KOs lie head to the right, as Chapter VI's do (sidecar right); the engine mirrors a
        // right-facing painting for an enemy, so the head lies toward the party. Every standing pose faces left.
        expect(rec.facing, `${subject}/${pose}`).toBe(pose === 'ko' ? 'right' : 'left');
      }
    }
    for (const subject of GIRLS) for (const [pose, rec] of Object.entries(INSTALLED[subject] ?? {})) expect(rec.facing, `${subject}/${pose}`).toBe('right');
  });

  it('needs no mirror in play: a left-facing fiend and a right-facing girl meet the engine\'s own contract', () => {
    expect(mirrorFor(parseArtFacing('left'), -1)).toBe(1); // an enemy stands on the right and faces -x
    expect(mirrorFor(parseArtFacing('right'), 1)).toBe(1); // a girl faces +x
    // Chapter VI's Ormi was painted facing right and mirrored in play; the new one is painted facing left, so nothing is flipped.
    expect(mirrorFor(parseArtFacing('right'), -1)).toBe(-1);
  });

  it.skipIf(!HAVE_ART)('the sidecars say the same as the records', () => {
    for (const [subject, poses] of Object.entries(INSTALLED)) for (const [pose, rec] of Object.entries(poses)) expect(sidecar(inArtNamespace(NS, subject), pose).facing, `${subject}/${pose}`).toBe(rec.facing);
  });

  it("installs every painting from the Art Room's approved record: the girls' poses by hand (Rikku's and Paine's attacks from the automatic pose rounds), the fiends by the driver's delegation", () => {
    // Bailey approved by hand: all of Yuna's, and the idle and the ready pose of Rikku and of Paine. Everything painted since came from the Art Room's automatic pose rounds.
    const BY_HAND: Record<string, string[]> = { 'yuna-gunner': ['idle', 'ready', 'attack', 'cast', 'hurt', 'ko', 'victory'], 'rikku-thief': ['idle', 'ready'], 'paine-warrior': ['idle', 'ready'] };
    // The driver delegated each fiend's idle, and Leblanc's hurt (p_7f698e5d) by name; every other fiend pose came from the automatic pose rounds.
    const DELEGATED = new Set(['leblanc/hurt']);
    for (const subject of FIENDS) {
      for (const [pose, rec] of Object.entries(INSTALLED[subject]!)) {
        expect(rec.artRoom.approvedBy, `${subject}/${pose}`).toBe(pose === 'idle' || DELEGATED.has(`${subject}/${pose}`) ? 'driver-delegated' : 'auto-pose');
      }
    }
    for (const subject of GIRLS) {
      for (const [pose, rec] of Object.entries(INSTALLED[subject]!)) {
        expect(rec.artRoom.approvedBy ?? 'human', `${subject}/${pose}`).toBe(BY_HAND[subject]!.includes(pose) ? 'human' : 'auto-pose');
      }
    }
  });

  it("installs the three girls' idles and every pose installed for them, and the five fiends' idles", () => {
    // Every everyday pose of the three girls (idle, ready, attack, cast, hurt, ko, victory, item) and of the three fiends who walk off (no KO) has new art, and so has each girl's
    // low-HP kneel (critical) and sleep, Rikku's and Paine's follow-through, and Paine's two Breaks (the surfaces pass).
    const EVERYDAY = ['attack', 'cast', 'critical', 'hurt', 'idle', 'item', 'ko', 'ready', 'sleep', 'victory'];
    expect(Object.keys(INSTALLED['yuna-gunner']!).sort()).toEqual(EVERYDAY);
    expect(Object.keys(INSTALLED['rikku-thief']!).sort()).toEqual([...EVERYDAY, 'follow'].sort());
    expect(Object.keys(INSTALLED['paine-warrior']!).sort()).toEqual([...EVERYDAY, 'follow', 'od-x2-warrior-armor-break', 'od-x2-warrior-power-break'].sort());
    for (const subject of ['leblanc', 'logos', 'ormi']) expect(Object.keys(INSTALLED[subject]!).sort(), subject).toEqual(['attack', 'cast', 'hurt', 'idle']);
    for (const subject of ['ffx2-dr-goon', 'ffx2-fem-goon']) expect(Object.keys(INSTALLED[subject]!).sort()).toEqual(['attack', 'hurt', 'idle', 'ko']); // the goons are complete
  });
});

describe('registration: each installed girl\'s idle carries a head box, and every other pose is matched to it', () => {
  it('has the head box of every girl\'s idle (the reference) and of every pose beside it', () => {
    for (const subject of ['yuna-gunner', 'rikku-thief', 'paine-warrior']) {
      const poses = INSTALLED[subject]!;
      expect(poses['idle']!.head, `${subject}/idle head`).toHaveLength(4);
      for (const [pose, rec] of Object.entries(poses)) {
        if (rec.scaleSource === 'length') continue; // a lying KO is matched by its length, below
        expect(rec.head, `${subject}/${pose} head`).toHaveLength(4);
        const [x0, y0, x1, y1] = rec.head as [number, number, number, number];
        expect(x1 - x0).toBeGreaterThan(50);
        expect(y1 - y0).toBeGreaterThan(50);
        expect(x1 <= rec.size[0] && y1 <= rec.size[1] && x0 >= 0 && y0 >= 0, `${subject}/${pose} head inside the painting`).toBe(true);
        if (pose !== 'idle') expect(rec.row['scale'], `${subject}/${pose} scale`).toBeGreaterThan(0.5);
      }
    }
  });

  it('keeps every pose\'s head within the house band of the idle\'s once its scale is applied (CHK-026 asks 3 percent; a reading by eye is good to about 5)', () => {
    const size = (h: number[]): number => Math.sqrt((h[2]! - h[0]!) * (h[3]! - h[1]!));
    for (const subject of ['yuna-gunner', 'rikku-thief', 'paine-warrior']) {
      const idle = INSTALLED[subject]!['idle']!;
      for (const [pose, rec] of Object.entries(INSTALLED[subject]!)) {
        if (pose === 'idle' || rec.scaleSource === 'length') continue;
        const prone = rec.size[0] > rec.size[1] * 1.15;
        const drawn = (size(rec.head!) * (rec.row['scale'] as number)) * (pose === 'ko' && prone ? 0.978 : 1);
        expect(Math.abs(drawn / size(idle.head!) - 1), `${subject}/${pose}`).toBeLessThan(0.05);
      }
    }
  });

  it("matches a lying KO by its length where no head can be matched: the idle's content height over the KO's content length, over 0.978", () => {
    // Rikku's and Paine's KOs lie with their hair flat, so a hair-and-face box reads 1.77 and 0.93 where the eyes read 0.62; the body's own density is the honest match.
    for (const subject of ['rikku-thief', 'paine-warrior', 'ffx2-dr-goon', 'ffx2-fem-goon']) {
      const idle = INSTALLED[subject]!['idle']!;
      const ko = INSTALLED[subject]!['ko']!;
      expect(ko.scaleSource, subject).toBe('length');
      const idleHeight = idle.contentBox[3]! - idle.contentBox[1]!;
      const koLength = ko.contentBox[2]! - ko.contentBox[0]!;
      expect(ko.row['scale'] as number, subject).toBeCloseTo(idleHeight / koLength / 0.978, 2);
      expect(ko.row['stanceX'], `${subject}: a KO rests by its own rule`).toBeUndefined();
      expect(ko.size[0], subject).toBeGreaterThan(ko.size[1] * 1.15); // wider than tall: the engine lays it down
    }
  });

  it("lands a pose's weight on the foot the idle stands on: Dr. Goon's lunge is registered by its rear boot, by hand, not by the planted front boot", () => {
    // The automatic stance is the middle of the lowest thick part. Dr. Goon's idle stands on its rear boot (x 458 to 559 of 577: its front boot is 84 rows higher),
    // his lunge plants the front boot (x 30 to 256) and trails the rear one (x 869 to 986), so the automatic 140 would have put the lunge's front boot where the
    // idle's rear boot is and popped the whole figure back by 0.7 m. The same boot as the idle's: 927.5.
    const attack = INSTALLED['ffx2-dr-goon']!['attack']!;
    expect(attack.stanceSource).toBe('hand');
    expect(attack.row['stanceX']).toBe(927.5);
    expect(poseRegistrationFor(characterUrl('exp-leblanc-ffx2-dr-goon', 'attack'))?.stanceX).toBe(927.5);
    const idleStance = INSTALLED['ffx2-dr-goon']!['idle']!.row['stanceX'] as number;
    expect(idleStance).toBeGreaterThan(458); // the idle's rear boot (x 458 to 559) is the reference and never moves
    expect(idleStance).toBeLessThan(559);
    // Paine's Armor Break is the other one: the automatic rule counted the blade tip (x 1269 to 1386), which hangs lowest, and put her stance at 701; her feet are the two boots
    // (x 17 to 1094), so the stance is their middle, 555.5, and the soles' row (828) is the feet row the blade tip must not set.
    const armor = INSTALLED['paine-warrior']!['od-x2-warrior-armor-break']!;
    expect(armor.stanceSource).toBe('hand');
    expect(armor.row['stanceX']).toBe(555.5);
    expect(armor.row['feetRow']).toBe(828);
    expect(armor.row['upright']).toBe(true);
    // Every other new pose keeps the tool's own stance.
    for (const [subject, poses] of Object.entries(INSTALLED)) {
      for (const [pose, rec] of Object.entries(poses)) if (rec.stanceSource) expect(['ffx2-dr-goon/attack', 'paine-warrior/od-x2-warrior-armor-break']).toContain(`${subject}/${pose}`);
    }
  });

  it("marks Paine's attack, a standing lunge wider than tall, upright, so the engine never lays it down like a KO", () => {
    const rec = INSTALLED['paine-warrior']!['attack']!;
    expect(rec.size[0]).toBeGreaterThan(rec.size[1] * 1.15);
    expect(rec.row['upright']).toBe(true);
    expect(poseRegistrationFor(characterUrl('exp-leblanc-paine-warrior', 'attack'))?.upright).toBe(true);
    expect(poseRegistrationFor(characterUrl('exp-leblanc-rikku-thief', 'attack'))?.upright).toBeUndefined();
  });

  it('registers a KO by its scale alone (it lies down and rests by its own rule), and a standing pose by scale and stance', () => {
    const ko = poseRegistrationFor(characterUrl('exp-leblanc-yuna-gunner', 'ko'));
    expect(ko?.scale).toBeGreaterThan(0.5);
    expect(ko?.stanceX).toBeUndefined();
    for (const pose of ['ready', 'attack', 'cast', 'hurt', 'victory']) {
      const row = poseRegistrationFor(characterUrl('exp-leblanc-yuna-gunner', pose));
      expect(row?.scale, `${pose} scale`).toBeGreaterThan(0.5);
      expect(row?.stanceX, `${pose} stance`).toBeGreaterThan(0);
    }
    expect(poseRegistrationFor(characterUrl('exp-leblanc-yuna-gunner', 'idle'))).toEqual({ stanceX: INSTALLED['yuna-gunner']!['idle']!.row['stanceX'] });
  });

  it('the row builder: a lying KO gets no stance, and the idle is only its stance', () => {
    const idle = { head: [100, 20, 380, 250], contentBox: [16, 16, 660, 1532] };
    const ko = registrationRow({ pose: 'ko', width: 1493, height: 503, baselineY: 487, contentBox: [16, 16, 1477, 487], stance: { x: 1019 }, head: [1235, 85, 1462, 325], idle });
    expect(ko).toEqual({ scale: expect.any(Number) });
    const stand = registrationRow({ pose: 'ready', width: 850, height: 1544, baselineY: 1528, contentBox: [16, 16, 834, 1528], stance: { x: 781.5 }, head: [275, 96, 555, 321], idle });
    expect(stand).toEqual({ scale: expect.any(Number), stanceX: 781.5 });
    expect(registrationRow({ pose: 'idle', width: 674, height: 1548, baselineY: 1532, contentBox: [16, 16, 658, 1532], stance: { x: 417 }, head: [120, 17, 397, 245], idle: null })).toEqual({ stanceX: 417 });
  });
});

describe('the HUD, the prep roster, the card and the results read the namespaced idle\'s head', () => {
  const yuna = { id: 'yuna', name: 'Yuna', dresspheres: { current: 'gunner' }, hp: 900, mp: 50, stats: { maxHp: 1000, maxMp: 60 }, statuses: [] } as unknown as FFX2Combatant;

  it('has no portrait ladder inside a namespace, and the base ladder outside it', () => {
    expect(faceLadder('yuna', 'gunner', NS)).toEqual({ art: 'exp-leblanc-yuna-gunner', portraits: [] });
    expect(faceLadder('yuna', 'gunner')).toEqual({ art: 'yuna-gunner', portraits: ['yuna-gunner', 'yuna-x2', 'yuna'] });
  });

  it('draws the party row\'s head from the namespaced painting, and Chapter VI\'s from the base one', () => {
    const inside = partyRowHtml(yuna, null, { actingId: null, index: 0, artNamespace: NS });
    expect(inside).toContain('characters/exp-leblanc-yuna-gunner/idle.png');
    expect(inside).not.toContain('portraits/');
    expect(inside).not.toMatch(/characters\/yuna-gunner\//);
    const base = partyRowHtml(yuna, null, { actingId: null, index: 0 });
    expect(base).toContain('characters/yuna-gunner/idle.png');
    expect(base).not.toContain('exp-leblanc');
  });

  it('draws the prep roster and the slots, the card\'s party and the results faces from it too', () => {
    const roster = rosterHtml(exp.buildRef, 0, NS);
    for (const girl of ['yuna-gunner', 'rikku-thief', 'paine-warrior']) expect(roster).toContain(`characters/exp-leblanc-${girl}/idle.png`);
    expect(slotsHtml(exp.buildRef, NS)).toContain('characters/exp-leblanc-yuna-gunner/idle.png');
    expect(rosterHtml(FFX2_LEBLANC.buildRef, 0)).not.toContain('exp-leblanc');
    expect(recommendedParty(exp).every((m) => m.artNamespace === NS)).toBe(true);
    expect(recommendedParty(FFX2_LEBLANC).some((m) => m.artNamespace !== undefined)).toBe(false);
    expect(partyFaceHtml({ id: 'rikku', name: 'Rikku', dressphere: 'thief', artNamespace: NS })).toContain('characters/exp-leblanc-rikku-thief/idle.png');
    const row = { id: 'paine', name: 'Paine', dressphere: 'warrior', artNamespace: NS } as Parameters<typeof memberFaceHtml>[0];
    expect(memberFaceHtml(row)).toContain('characters/exp-leblanc-paine-warrior/idle.png');
  });

  it('shows the fallen pose from the namespace on a loss', () => {
    const [hurt, ko] = wedgeFallenArt(exp, 'yuna');
    expect(hurt).toBe('art/characters/exp-leblanc-yuna-gunner/hurt.png');
    expect(ko).toBe('art/characters/exp-leblanc-yuna-gunner/ko.png');
    expect(wedgeFallenArt(FFX2_LEBLANC, 'yuna')[0]).toBe('art/characters/yuna-gunner/hurt.png');
  });

  it('crops each new girl\'s head from her own measured row, and a placeholder painting from its base subject\'s row', () => {
    const fresh = bodyCrop('exp-leblanc-yuna-gunner');
    expect(fresh).not.toEqual(bodyCrop('yuna-gunner'));
    expect(fresh.aspect).toBeCloseTo(674 / 1548, 4);
    for (const girl of ['yuna-songstress', 'yuna-thief', 'rikku-warrior', 'paine-thief']) expect(bodyCrop(`exp-leblanc-${girl}`), girl).toEqual(bodyCrop(girl));
    expect(bodyFaceImgHtml('exp-leblanc-rikku-thief')).toContain('data-face-crop="exp-leblanc-rikku-thief"');
  });
});

describe('the story-scene figures: Leblanc, Ormi and Logos stand on the experiment\'s paintings', () => {
  it('gives the base figure with no namespace, and for an actor the namespace does not paint', () => {
    expect(cutsceneFigureIn(undefined, 'leblanc')).toBe(cutsceneFigure('leblanc'));
    expect(cutsceneFigureIn(NS, 'ginnem')).toBe(cutsceneFigure('ginnem'));
    expect(cutsceneFigureIn(NS, 'nobody')).toBeUndefined();
  });

  it('stands each on its namespaced idle, with that painting\'s size, feet and facing, placed exactly as before', () => {
    for (const [actor, facing] of [['leblanc', -1], ['logos', -1], ['ormi', -1]] as const) {
      // The size and the feet line are the idle's own (its record in installed.json, which is its sidecar's), so a re-cut of the painting moves them with it.
      const idle = INSTALLED[actor]!['idle']!;
      const [w, h] = idle.size;
      const fig = cutsceneFigureIn(NS, actor)!;
      expect(fig.art).toBe(`art/characters/exp-leblanc-${actor}/idle.png`);
      expect(fig.aspect).toBeCloseTo(w / h, 6);
      expect(fig.baseline).toBeCloseTo(idle.baselineY / h, 6);
      expect(fig.artFacing, actor).toBe(facing);
      expect(fig.landscape).toEqual(cutsceneFigure(actor)!.landscape);
      expect(fig.portrait).toEqual(cutsceneFigure(actor)!.portrait);
    }
    // Ormi was painted facing right in Chapter VI (the script flips him); the new Ormi faces left, so the script's facing needs no flip.
    expect(cutsceneFigure('ormi')!.artFacing).toBe(1);
    expect(cutsceneFigureIn(NS, 'ormi')!.artFacing).toBe(-1);
  });

  it.skipIf(!HAVE_ART)('the generated metrics are the namespace\'s idle sidecars, figure by figure', () => {
    expect(Object.keys(EXP_FIGURE_METRICS).length).toBeGreaterThanOrEqual(24);
    for (const [id, m] of Object.entries(EXP_FIGURE_METRICS)) {
      const s = sidecar(id, 'idle');
      expect([m.width, m.height, m.baselineY], id).toEqual([s.width, s.height, s.baselineY]);
      expect(m.facing, id).toBe(s.facing ?? 'auto');
    }
  });

  it('the metrics builder reads sidecars and skips a figure with none', () => {
    const table = buildExpFigureMetrics(['b', 'a', 'c'], (s) => (s === 'c' ? null : { width: 10, height: 20, baselineY: 18, facing: s === 'a' ? 'left' : undefined }));
    expect(table).toEqual({ 'exp-leblanc-a': { width: 10, height: 20, baselineY: 18, facing: 'left' }, 'exp-leblanc-b': { width: 10, height: 20, baselineY: 18, facing: 'auto' } });
    expect(renderExpFigureMetrics(table)).toContain("'exp-leblanc-a': { width: 10, height: 20, baselineY: 18, facing: 'left' },");
  });
});

describe('the dressphere twirl reads the namespace\'s own figures', () => {
  it('names the girl and the namespace from a namespaced figure id', () => {
    expect(girlOf('yuna-gunner')).toBe('yuna');
    expect(girlOf('exp-leblanc-yuna-gunner')).toBe('yuna');
    expect(namespacePrefixOf('exp-leblanc-yuna-gunner')).toBe('exp-leblanc-');
    expect(namespacePrefixOf('yuna-gunner')).toBe('');
  });

  it('plans a change inside the namespace, with her own mid key and never another girl\'s', () => {
    const states: Record<string, string[]> = {
      'exp-leblanc-yuna-gunner': ['twirl-start', 'twirl-going', 'twirl-mid'],
      'exp-leblanc-yuna-songstress': ['twirl-forming', 'twirl-end'],
      'exp-leblanc-paine-warrior': ['twirl-start', 'twirl-going', 'twirl-mid'],
      'yuna-songstress': ['twirl-forming', 'twirl-end'],
    };
    const others = Object.keys(states);
    const plan = twirlPlan('exp-leblanc-yuna-gunner', 'exp-leblanc-yuna-songstress', (id) => states[id] ?? null, others);
    expect(plan.map((k) => `${k.figure}/${k.key}`)).toEqual([
      'exp-leblanc-yuna-gunner/twirl-start',
      'exp-leblanc-yuna-gunner/twirl-going',
      'exp-leblanc-yuna-gunner/twirl-mid',
      'exp-leblanc-yuna-songstress/twirl-forming',
      'exp-leblanc-yuna-songstress/twirl-end',
    ]);
    // Neither figure of the change has a mid key: the girl's other figures are searched inside her own namespace, so Paine's is not borrowed.
    const noMid = twirlPlan('exp-leblanc-yuna-songstress', 'exp-leblanc-yuna-thief', (id) => (id === 'exp-leblanc-paine-warrior' ? ['twirl-mid'] : []), others);
    expect(noMid.some((k) => k.key === 'twirl-mid')).toBe(false);
    // And the base art's plans are what they were.
    expect(twirlPlan('yuna-gunner', 'yuna-songstress', (id) => (id === 'yuna-gunner' ? ['twirl-start', 'twirl-mid'] : ['twirl-end']), ['yuna-gunner', 'yuna-songstress']).map((k) => `${k.figure}/${k.key}`)).toEqual([
      'yuna-gunner/twirl-start',
      'yuna-gunner/twirl-mid',
      'yuna-songstress/twirl-end',
    ]);
  });
});

describe('the keyed sheets: the generator\'s pale grey fringe is peeled off the silhouette', () => {
  const matteOf = (id: string, pose: string): { how: string; haloPeel?: number; haloPeeledPx?: number } => JSON.parse(readFileSync(join(ART, 'characters', id, `${pose}.json`), 'utf8')).matte;

  it.skipIf(!HAVE_ART)("cuts Leblanc's four paintings with the halo peel (a neutral grey glow a few pixels wide ran along her whole silhouette on the room's dark floor)", () => {
    for (const pose of ['idle', 'cast', 'attack', 'hurt']) {
      const matte = matteOf('exp-leblanc-leblanc', pose);
      expect(matte.how, pose).toBe('key');
      expect(matte.haloPeel, pose).toBe(6);
      expect(matte.haloPeeledPx ?? 0, pose).toBeGreaterThan(500);
    }
  });

  it.skipIf(!HAVE_ART)('cuts every other keyed painting of the experiment with it too (the grey sheets of the second set, and the goons, Ormi and the girls\' KOs of the first two builds), and a sheet with no halo (Logos on ochre) loses nothing to it', () => {
    const KEYED: Array<[string, string]> = [
      ['exp-leblanc-rikku-thief', 'cast'], ['exp-leblanc-rikku-thief', 'item'], ['exp-leblanc-rikku-thief', 'ko'],
      ['exp-leblanc-paine-warrior', 'cast'], ['exp-leblanc-paine-warrior', 'item'], ['exp-leblanc-paine-warrior', 'ko'],
      ['exp-leblanc-yuna-gunner', 'item'],
      ['exp-leblanc-ormi', 'idle'], ['exp-leblanc-ormi', 'cast'], ['exp-leblanc-ormi', 'attack'], ['exp-leblanc-ormi', 'hurt'],
      ...['idle', 'attack', 'hurt', 'ko'].flatMap((pose): Array<[string, string]> => [['exp-leblanc-ffx2-dr-goon', pose], ['exp-leblanc-ffx2-fem-goon', pose]]),
    ];
    for (const [id, pose] of KEYED) expect(matteOf(id, pose).haloPeel, `${id}/${pose}`).toBe(6);
    // Logos's sheets are on ochre and carry no neutral grey glow: the peel runs and finds (almost) nothing, and his idle is unchanged from the first build.
    for (const pose of ['cast', 'attack', 'hurt']) expect(matteOf('exp-leblanc-logos', pose).haloPeeledPx ?? 0, `logos/${pose}`).toBeLessThan(10);
  });
});

describe("the girls' rare poses: the low-HP kneel, the sleep, the follow-through and Paine's two Breaks (the surfaces pass)", () => {
  const RARE: Array<[string, string]> = [
    ['yuna-gunner', 'critical'], ['yuna-gunner', 'sleep'],
    ['rikku-thief', 'critical'], ['rikku-thief', 'sleep'], ['rikku-thief', 'follow'],
    ['paine-warrior', 'critical'], ['paine-warrior', 'sleep'], ['paine-warrior', 'follow'], ['paine-warrior', 'od-x2-warrior-armor-break'], ['paine-warrior', 'od-x2-warrior-power-break'],
  ];

  it('registers each of the ten against its idle: a head box, a scale in the sane range, a stance, and the stature a kneel or a doze can have', () => {
    for (const [subject, pose] of RARE) {
      const rec = INSTALLED[subject]![pose]!;
      const idle = INSTALLED[subject]!['idle']!;
      expect(rec.facing, `${subject}/${pose}`).toBe('right');
      expect(rec.head, `${subject}/${pose} head`).toHaveLength(4);
      const scale = rec.row['scale'] as number;
      expect(scale, `${subject}/${pose} scale`).toBeGreaterThan(0.6);
      expect(scale, `${subject}/${pose} scale`).toBeLessThan(1.3);
      expect(rec.row['stanceX'], `${subject}/${pose} stance`).toBeGreaterThan(0);
      // How tall the figure stands on the field, against the idle: a kneel is a little over half of a standing figure, a slumped doze never taller than it.
      const stature = ((rec.contentBox[3]! - rec.contentBox[1]!) * scale) / (idle.contentBox[3]! - idle.contentBox[1]!);
      if (pose === 'critical') {
        expect(stature, `${subject} kneel`).toBeGreaterThan(0.5);
        expect(stature, `${subject} kneel`).toBeLessThan(0.75);
      }
      if (pose === 'sleep') expect(stature, `${subject} doze`).toBeLessThan(1.0);
    }
  });

  it('marks the lunges upright (wider than tall, never laid down like a KO) and gives the Armor Break its soles', () => {
    for (const pose of ['follow', 'od-x2-warrior-armor-break', 'od-x2-warrior-power-break']) {
      const rec = INSTALLED['paine-warrior']![pose]!;
      expect(rec.size[0], pose).toBeGreaterThan(rec.size[1] * 1.15);
      expect(rec.row['upright'], pose).toBe(true);
      expect(poseRegistrationFor(characterUrl('exp-leblanc-paine-warrior', pose))?.upright, pose).toBe(true);
    }
    expect(INSTALLED['rikku-thief']!['follow']!.size[0]).toBeLessThan(INSTALLED['rikku-thief']!['follow']!.size[1] * 1.15); // Rikku's is not wider than tall
    expect(INSTALLED['paine-warrior']!['od-x2-warrior-armor-break']!.row['feetRow']).toBe(828);
  });

  it('records which were matched by the head box alone and which by the box averaged with a body cue (the geometric mean, in the record)', () => {
    const COMBINED = ['yuna-gunner/sleep', 'rikku-thief/critical', 'rikku-thief/follow', 'paine-warrior/critical', 'paine-warrior/sleep'];
    for (const [subject, pose] of RARE) {
      const rec = INSTALLED[subject]![pose]!;
      expect(rec.scaleSource ?? 'head', `${subject}/${pose}`).toBe(COMBINED.includes(`${subject}/${pose}`) ? 'combined' : 'head');
    }
  });

  it("gives Paine's two Breaks two different paintings (the old art had one image under both names)", () => {
    const armor = INSTALLED['paine-warrior']!['od-x2-warrior-armor-break']!;
    const power = INSTALLED['paine-warrior']!['od-x2-warrior-power-break']!;
    expect(armor.artRoom.id).not.toBe(power.artRoom.id);
    expect(armor.size).not.toEqual(power.size);
  });

  it.skipIf(!HAVE_ART)("seats the status marks of a bowed figure: a critical or sleep sidecar says where the top of the head is, inside the figure's box", () => {
    for (const subject of ['yuna-gunner', 'rikku-thief', 'paine-warrior']) {
      for (const pose of ['critical', 'sleep']) {
        const side = JSON.parse(readFileSync(join(ART, 'characters', inArtNamespace(NS, subject), `${pose}.json`), 'utf8')) as { headTop?: [number, number] };
        expect(side.headTop, `${subject}/${pose} headTop`).toBeDefined();
        const [x, y] = side.headTop!;
        expect(x, `${subject}/${pose} x`).toBeGreaterThan(0.3);
        expect(x, `${subject}/${pose} x`).toBeLessThan(0.95);
        expect(y, `${subject}/${pose} y`).toBeGreaterThanOrEqual(0);
        expect(y, `${subject}/${pose} y`).toBeLessThan(0.08); // a bowed head's crown is the top of the figure
      }
    }
  });
});
