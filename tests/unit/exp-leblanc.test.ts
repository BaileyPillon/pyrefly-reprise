// @vitest-environment jsdom
/**
 * **Experimental: Leblanc (new art)** — the Leblanc preview chapter (branch `exp-leblanc`; **FFX-2 only**, AGENTS.md rule 14).
 *
 * Bailey, 2026-10-06: an additional experimental chapter beside Chapter VI, with all-new paintings. What this file pins:
 *
 * 1. **Chapter VI is unchanged**: its record, its scene entry (no art namespace), the ids and URLs its figures resolve to, and the
 *    art its workspace serves (manifest rows and sha256 of every painting, against the snapshot of the release tree).
 * 2. **The experiment is the same encounter**: Chapter VI's party build, formations, scripts, music and Sensor lines by reference;
 *    the seeded engine plays it to victory with the very same event log as Chapter VI.
 * 3. **Every figure and the backdrop resolve to the experimental namespace** (`exp-leblanc-<subject>`, `exp-leblanc-last-room`), for
 *    each enemy of the three acts and for each girl in each dressphere she can wear here, and the files are there.
 * 4. **It is an experiment, not a chapter**: out of `CHAPTERS`, on the board after the eighteen, its records in the experiments'
 *    store and never the save.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { PerspectiveCamera } from 'three';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { FFX2Engine, abilityRegistryFrom, dressphereRegistryFrom, garmentGridRegistryFrom, itemRegistryFrom } from '../../src/battle/ffx2/index.ts';
import type { AnyCombatant } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_CHAIN_ORDER } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, FFX2_LEBLANC, getChapter, UNLISTED_CHAPTERS } from '../../src/data/encounters.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import {
  ART_NAMESPACES,
  EXP_LEBLANC_SCENE,
  SCENE_ART_NAMESPACE,
  artNamespaceOf,
  artNamespaceOfScene,
  baseArtId,
  inArtNamespace,
} from '../../src/data/art/artNamespace.ts';
import { artCandidatesFor, artIdFor, backdropUrl, characterUrl, isDresspherePainting } from '../../src/engine/BattlePresenterArt.ts';
import { parseArtManifest, resetArtManifest, setArtManifest, type ArtManifest } from '../../src/engine/ArtManifest.ts';
import { poseRegistrationFor } from '../../src/engine/PoseRegistration.ts';
import { getScene, loadScene, sceneKeys, type LoadedScene } from '../../src/scenes/index.ts';
import { buildChapterTiles, silhouetteKeysFor } from '../../src/app/screens/frontend/chapterGrid.ts';
import { plateArtHtml } from '../../src/app/screens/frontend/chapterPlates.ts';
import { boardProgress } from '../../src/app/screens/frontend/chapterProgress.ts';
import { chapterLabel, chapterNumeral } from '../../src/ui/common/roman.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import {
  EXPERIMENTS_KEY,
  experimentProgress,
  experimentRecord,
  recordExperimentClear,
  setExperimentStorageForTests,
} from '../../src/app/experiments/experimentRecords.ts';
import { driveChapter6, driveChapterRecord, logHash } from './helpers/ffx2ChapterDrive.ts';
import { buildExpRegistration } from '../../tools/exp-art-table.mjs';
// The tooling half of the namespace (plain JS): it must say what the TypeScript half says.
import { BASE_SCENE_KEY, NAMESPACE, SCENE_KEY, nsId } from '../../tools/exp-art-lib.mjs';

const REPO = join(__dirname, '..', '..');
const ART = join(REPO, 'public', 'art');
const HAVE_ART = existsSync(join(ART, 'manifest.json')) && existsSync(join(ART, 'characters', 'yuna-gunner', 'idle.png'));
const sha = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex');

const exp = getChapter('exp-leblanc')!;

/** What `tools/exp-install.mjs` has installed (`docs/target/exp-leblanc/installed.json`): `{ subject: { pose: record } }`. */
interface InstalledPose { sha256: string; size: [number, number]; baselineY: number; tiers: number[]; row: Record<string, number | true> }
const INSTALLED: Record<string, Record<string, InstalledPose>> = existsSync(join(REPO, 'docs', 'target', 'exp-leblanc', 'installed.json'))
  ? JSON.parse(readFileSync(join(REPO, 'docs', 'target', 'exp-leblanc', 'installed.json'), 'utf8'))
  : {};

function engineOptions() {
  return {
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false as const,
  };
}

/** Every combatant of the three acts, from the real engine (the girls at the build's own dresspheres). */
function chainCombatants(): AnyCombatant[] {
  const seen = new Map<string, AnyCombatant>();
  for (const actId of LEBLANC_CHAIN_ORDER) {
    const group = data.ENEMY_GROUPS_BY_ID[actId]!;
    const engine = new FFX2Engine(engineOptions());
    engine.setSeed(7);
    engine.init({ game: 'ffx2', party: chateauBuild, enemies: group, triggers: [], seed: 7, condition: 'normal', canEscape: false });
    for (const c of Object.values(engine.state().combatants)) seen.set(`${actId}/${c.id}`, c as AnyCombatant);
  }
  return [...seen.values()];
}

/** A girl as the stage meets her after a spherechange: her id, her build sprite key and the dressphere she now wears. */
function girlIn(memberId: string, dressphere: string): AnyCombatant {
  const m = chateauBuild.members.find((x) => x.id === memberId)!;
  return { id: m.id, name: m.name, side: 'party', spriteKey: m.spriteKey, dresspheres: { current: dressphere } } as unknown as AnyCombatant;
}

const girlsInEveryDressphere = (): AnyCombatant[] =>
  chateauBuild.members.flatMap((m) => [...new Set([m.currentDressphere, ...m.owned])].map((d) => girlIn(m.id, d)));

/** What `resolveArt` picks from a manifest: the first candidate that has an idle painting, else the first. */
function resolved(candidates: readonly string[], manifest: ArtManifest): string {
  return candidates.find((id) => manifest.subjects[id]?.states.includes('idle')) ?? candidates[0]!;
}

describe('the namespace helpers, and the tooling half that must agree with them', () => {
  it('prefixes an id once, strips it back, and leaves a base id and an absent namespace alone', () => {
    expect(inArtNamespace('exp-leblanc', 'yuna-gunner')).toBe('exp-leblanc-yuna-gunner');
    expect(inArtNamespace('exp-leblanc', 'exp-leblanc-yuna-gunner')).toBe('exp-leblanc-yuna-gunner');
    expect(inArtNamespace(undefined, 'yuna-gunner')).toBe('yuna-gunner');
    expect(baseArtId('exp-leblanc-ffx2-dr-goon')).toBe('ffx2-dr-goon');
    expect(baseArtId('leblanc')).toBe('leblanc');
    expect(artNamespaceOf('exp-leblanc-leblanc')).toBe('exp-leblanc');
    expect(artNamespaceOf('leblanc')).toBeUndefined();
  });

  it('a namespaced dressphere painting is still a dressphere painting (its fallback chain is the girls\')', () => {
    expect(isDresspherePainting('yuna-gunner')).toBe(true);
    expect(isDresspherePainting('exp-leblanc-yuna-gunner')).toBe(true);
    expect(isDresspherePainting('exp-leblanc-leblanc')).toBe(false);
    expect(isDresspherePainting('exp-leblanc-ormi')).toBe(false);
  });

  it('tools/exp-art-lib.mjs and src/data/art/artNamespace.ts say the same names', () => {
    expect(ART_NAMESPACES).toContain(NAMESPACE);
    expect(EXP_LEBLANC_SCENE).toBe(SCENE_KEY);
    expect(SCENE_ART_NAMESPACE[SCENE_KEY]).toBe(NAMESPACE);
    expect(artNamespaceOfScene(SCENE_KEY)).toBe(NAMESPACE);
    expect(artNamespaceOfScene(BASE_SCENE_KEY)).toBeUndefined();
    for (const base of ['yuna-gunner', 'leblanc', 'ffx2-dr-goon']) expect(nsId(base)).toBe(inArtNamespace(NAMESPACE, base));
  });
});

describe('Chapter VI is unchanged', () => {
  it("keeps its record: id, number, scene, thumbnail, title, and no experiment flag", () => {
    expect(FFX2_LEBLANC.id).toBe('ffx2-leblanc');
    expect(FFX2_LEBLANC.number).toBe(6);
    expect(FFX2_LEBLANC.title).toBe('Leblanc');
    expect(FFX2_LEBLANC.subtitle).toBe('A Farce, Armed');
    expect(FFX2_LEBLANC.sceneKey).toBe('leblanc-last-room');
    expect(FFX2_LEBLANC.thumbnailKey).toBe('chapter-ffx2-leblanc');
    expect(FFX2_LEBLANC.experimental).toBeUndefined();
    expect(CHAPTERS).toContain(FFX2_LEBLANC);
    expect(CHAPTER_IDS).toContain('ffx2-leblanc');
    expect(getChapter('ffx2-leblanc')).toBe(FFX2_LEBLANC);
    expect(CHAPTERS).toHaveLength(18);
    expect(CHAPTER_IDS).toHaveLength(18);
  });

  it('resolves every figure to the ids it always did: no namespace changes a candidate', () => {
    for (const c of [...chainCombatants(), ...girlsInEveryDressphere()]) {
      expect(artCandidatesFor(c), c.id).toEqual([artIdFor(c), c.spriteKey, c.id]);
      expect(artCandidatesFor(c, undefined)).toEqual(artCandidatesFor(c));
    }
  });

  it('draws the Last Room under its own scene key, with no art namespace', () => {
    expect(SCENE_ART_NAMESPACE[FFX2_LEBLANC.sceneKey]).toBeUndefined();
    expect(backdropUrl(FFX2_LEBLANC.sceneKey)).toMatch(/art\/backdrops\/leblanc-last-room\.png$/);
  });

  it.skipIf(!HAVE_ART)("serves Chapter VI's art exactly as the release tree holds it: manifest rows and the sha256 of every painting", () => {
    const snap = JSON.parse(readFileSync(join(REPO, 'tests', 'fixtures', 'exp-leblanc', 'ch6-art.json'), 'utf8'));
    const manifest = JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8'));
    expect(Object.keys(snap.subjects).length).toBeGreaterThanOrEqual(24);
    let files = 0;
    for (const [base, rec] of Object.entries<{ manifest: unknown; files: Record<string, string> }>(snap.subjects)) {
      expect(manifest.subjects[base], `manifest row of ${base}`).toEqual(rec.manifest);
      for (const [name, hash] of Object.entries(rec.files)) {
        expect(sha(join(ART, 'characters', base, name)), `${base}/${name}`).toBe(hash);
        files++;
      }
    }
    expect(files).toBeGreaterThan(400);
    expect(manifest.backdrops).toContain(snap.backdrop.key);
    expect(manifest.backdropTiers?.[snap.backdrop.key] ?? []).toEqual(snap.backdrop.tiers);
    for (const [name, hash] of Object.entries<string>(snap.backdrop.files)) expect(sha(join(ART, 'backdrops', name)), name).toBe(hash);
  });

  it.skipIf(!HAVE_ART)("serves Chapter VI's dialogue portraits and pause plates exactly as the release tree holds them (the preview's own are new files beside them)", () => {
    const snap = JSON.parse(readFileSync(join(REPO, 'tests', 'fixtures', 'exp-leblanc', 'ch6-art.json'), 'utf8'));
    const manifest = JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8'));
    let files = 0;
    for (const [name, hash] of Object.entries<string>(snap.surfaces.portraits)) {
      expect(sha(join(ART, 'portraits', name)), `portraits/${name}`).toBe(hash);
      files++;
    }
    for (const [name, hash] of Object.entries<string>(snap.surfaces.pause)) {
      expect(sha(join(ART, 'pause', name)), `pause/${name}`).toBe(hash);
      files++;
    }
    expect(files).toBeGreaterThanOrEqual(25);
    // Still listed under their own names, and the 2x masters Chapter VI's plates have are still listed.
    for (const id of snap.surfaceLists.portraits) expect(manifest.portraits, id).toContain(id);
    for (const id of snap.surfaceLists.pause) expect(manifest.pause, id).toContain(id);
    for (const id of snap.surfaceLists.pause2x) expect(manifest.pause2x, id).toContain(id);
  });
});

describe('the experiment is the same encounter', () => {
  it('is a registered, unlisted, experimental FFX-2 chapter numbered after the eighteen', () => {
    expect(exp).toBeDefined();
    expect(exp.id).toBe('exp-leblanc');
    expect(exp.game).toBe('ffx2');
    expect(exp.experimental).toBe(true);
    expect(exp.number).toBe(19);
    expect(exp.title).toBe('Experimental: Leblanc (new art)');
    expect(EXPERIMENT_CHAPTERS).toEqual([exp]);
    expect(CHAPTERS).not.toContain(exp);
    expect(CHAPTER_IDS as readonly string[]).not.toContain('exp-leblanc');
    expect(UNLISTED_CHAPTERS).not.toContain(exp);
  });

  it("reuses Chapter VI's engine data, formations, scripts, music and Sensor lines by reference", () => {
    expect(exp.buildRef).toBe(FFX2_LEBLANC.buildRef);
    expect(exp.enemyGroupRef).toBe(FFX2_LEBLANC.enemyGroupRef);
    expect(exp.scriptsRef).toBe(FFX2_LEBLANC.scriptsRef);
    expect(exp.music).toBe(FFX2_LEBLANC.music);
    expect(exp.sensorTexts).toBe(FFX2_LEBLANC.sensorTexts);
    expect(exp.location).toBe(FFX2_LEBLANC.location);
    expect(exp.sceneKey).toBe('exp-leblanc-last-room');
    expect(exp.sceneKey).not.toBe(FFX2_LEBLANC.sceneKey);
  });

  it('wears EXP, not a numeral, wherever a chapter numeral is shown, and its pause metadata says so', () => {
    expect(chapterNumeral(exp)).toBe('EXP');
    expect(chapterLabel(exp)).toBe('EXPERIMENTAL');
    expect(chapterNumeral(FFX2_LEBLANC)).toBe('VI');
    expect(chapterLabel(FFX2_LEBLANC)).toBe('CHAPTER VI');
    const meta = getChapterMeta('exp-leblanc');
    expect(meta?.numeral).toBe('EXP');
    expect(meta?.title).toBe(exp.title);
    expect(meta?.objectives).toBe(getChapterMeta('ffx2-leblanc')?.objectives);
  });

  it("plays to victory in the seeded engine, with exactly Chapter VI's event log on every seed", () => {
    for (const seed of [1, 2, 3]) {
      const mine = driveChapterRecord(exp, seed, 0);
      const theirs = driveChapter6(seed, 0);
      expect(mine.outcome, `seed ${seed}`).toBe('victory');
      expect(mine.logs).toHaveLength(3); // the three acts
      expect(logHash(mine)).toBe(logHash(theirs));
    }
  }, 120_000);
});

describe('every figure and the backdrop resolve to the experimental namespace', () => {
  const ns = artNamespaceOfScene(exp.sceneKey);

  it('the scene key names the namespace the stage reads', () => {
    expect(ns).toBe('exp-leblanc');
  });

  it('every candidate of every enemy of the three acts and of every girl in every dressphere is namespaced', () => {
    const everyone = [...chainCombatants(), ...girlsInEveryDressphere()];
    expect(everyone.length).toBeGreaterThan(10);
    for (const c of everyone) {
      const candidates = artCandidatesFor(c, ns);
      expect(candidates.length, c.id).toBeGreaterThan(0);
      for (const id of candidates) expect(id.startsWith('exp-leblanc-'), `${c.id}: ${id}`).toBe(true);
      // The base ids are untouched underneath.
      expect(candidates.map(baseArtId)).toEqual(artCandidatesFor(c));
    }
  });

  it("the backdrop is the preview's plate", () => {
    expect(backdropUrl(exp.sceneKey)).toMatch(/art\/backdrops\/exp-leblanc-last-room\.png$/);
  });

  it('the chapter card draws the preview\'s Leblanc over the preview\'s plate', () => {
    expect(silhouetteKeysFor(exp)).toEqual(['exp-leblanc-ormi']);
    const html = plateArtHtml({ id: exp.id, sceneKey: exp.sceneKey, silhouetteKeys: silhouetteKeysFor(exp), title: exp.title }, 'card');
    expect(html).toContain('art/backdrops/exp-leblanc-last-room.png');
    expect(html).toContain('art/characters/exp-leblanc-leblanc/idle.png');
    expect(html).not.toContain('art/characters/leblanc/idle.png');
    // Chapter VI's own card is the same composition over the base art.
    const six = plateArtHtml({ id: 'ffx2-leblanc', sceneKey: 'leblanc-last-room', silhouetteKeys: silhouetteKeysFor(FFX2_LEBLANC), title: 'Leblanc' }, 'card');
    expect(six).toContain('art/characters/leblanc/idle.png');
    expect(six).not.toContain('exp-leblanc');
  });

  it.skipIf(!HAVE_ART)('the workspace has every painting those ids name (a copy of Chapter VI\'s art until new art is installed), with the same pose set and sidecar fields', () => {
    const manifest = parseArtManifest(JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8')))!;
    const snap = JSON.parse(readFileSync(join(REPO, 'tests', 'fixtures', 'exp-leblanc', 'ch6-art.json'), 'utf8'));
    expect(manifest.backdrops).toContain('exp-leblanc-last-room');
    expect(manifest.backdrops).toContain('leblanc-last-room');
    const installed = existsSync(join(REPO, 'docs', 'target', 'exp-leblanc', 'installed.json'))
      ? (JSON.parse(readFileSync(join(REPO, 'docs', 'target', 'exp-leblanc', 'installed.json'), 'utf8')) as Record<string, Record<string, unknown>>)
      : {};
    // The 2026-10-07 art repairs (D-462) replaced 225 of Chapter VI's paintings, and the hidden chapter is frozen at release 39.3 for its placeholder poses (the driver's
    // decision (b) of that day: those rare poses stay exactly as shipped). So a placeholder is compared with the hash its file had in 39.3, which ch6-art-pre-repair.json
    // records for every file the repairs changed, and with Chapter VI's present hash (ch6-art.json) for every file they did not.
    const frozen = (JSON.parse(readFileSync(join(REPO, 'tests', 'fixtures', 'exp-leblanc', 'ch6-art-pre-repair.json'), 'utf8')) as { files: Record<string, string> }).files;
    for (const base of [...snap.girls, ...snap.enemies]) {
      const mine = manifest.subjects[nsId(base)];
      expect(mine, `manifest row of ${nsId(base)}`).toBeDefined();
      const theirs = manifest.subjects[base]!;
      for (const state of theirs.states) {
        expect(mine!.states, `${nsId(base)} lacks ${state}`).toContain(state);
        const png = join(ART, 'characters', nsId(base), `${state}.png`);
        const json = join(ART, 'characters', nsId(base), `${state}.json`);
        expect(existsSync(png) && existsSync(json), `${nsId(base)}/${state}`).toBe(true);
        if (!installed[base]?.[state]) {
          // A placeholder: the painting as release 39.3 shipped it, byte for byte, as a real copy (never a link to the release file).
          expect(sha(png), `${base}/${state}`).toBe(frozen[`${base}/${state}.png`] ?? snap.subjects[base].files[`${state}.png`]);
        }
      }
    }
  });

  it.skipIf(!HAVE_ART)("resolves each girl in each dressphere, and every enemy, to the same painting as Chapter VI's, inside the namespace", () => {
    const manifest = parseArtManifest(JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8')))!;
    for (const c of [...chainCombatants(), ...girlsInEveryDressphere()]) {
      const base = resolved(artCandidatesFor(c), manifest);
      const mine = resolved(artCandidatesFor(c, ns), manifest);
      expect(mine, `${c.id}`).toBe(`exp-leblanc-${base}`);
      expect(manifest.subjects[mine]?.states.includes('idle'), `${mine} has an idle painting`).toBe(true);
    }
  });

  it('a pose of a figure with no new idle is registered exactly as its base painting is (one head size, one stance)', () => {
    // r394 (D-510): the base rows now also carry a `head` box, which the engine holds to the idle's size on screen (`HeadLock.ts`). The experiment's table is
    // generated by `tools/exp-art-table.mjs`, whose `cleanRow` keeps four keys, so its rows carry none and the hidden chapter is NOT head-locked (the driver's
    // call whether it should be: one line in `cleanRow` and a regeneration). Everything else of a row is still compared whole.
    const sansHead = (row: ReturnType<typeof poseRegistrationFor>): ReturnType<typeof poseRegistrationFor> => {
      if (!row) return row;
      const { head: _head, ...rest } = row;
      return rest;
    };
    const installedSubjects = Object.keys(INSTALLED);
    let checked = 0;
    // The figures with no new idle yet: the girls' other dresspheres (a spherechange draws them).
    for (const [base, poses] of [['paine-thief', ['idle', 'attack', 'ko', 'victory']], ['rikku-warrior', ['idle', 'attack', 'ko', 'ready']], ['yuna-thief', ['idle', 'attack', 'hurt']], ['yuna-songstress', ['idle', 'attack']], ['paine-songstress', ['idle', 'attack', 'ko']]] as const) {
      if (installedSubjects.includes(base)) continue; // its rows are measured or rescaled: the next tests
      for (const pose of poses) {
        const theirs = poseRegistrationFor(characterUrl(base, pose));
        const mine = poseRegistrationFor(characterUrl(nsId(base), pose));
        expect(mine, `${base}/${pose}`).toEqual(sansHead(theirs));
        expect(mine?.head, `${base}/${pose} carries no head box`).toBeUndefined();
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(8);
  });

  it("a figure whose idle was installed registers the new idle by its measure, and every placeholder pose rescaled to the new idle's pixel density", () => {
    const snap = JSON.parse(readFileSync(join(REPO, 'tests', 'fixtures', 'exp-leblanc', 'ch6-art.json'), 'utf8'));
    for (const [base, poses] of Object.entries(INSTALLED)) {
      const idle = poses['idle'];
      if (!idle) continue;
      const mine = (pose: string) => poseRegistrationFor(characterUrl(nsId(base), pose));
      expect(mine('idle'), `${base}/idle`).toEqual(idle.row);
      const states: string[] = snap.subjects[base].manifest.states;
      // The old idle's baseline: Chapter VI's sidecar when the art is here, else the ratio the table itself carries (the attack row's scale over the base row's).
      const oldBaseline = HAVE_ART ? (JSON.parse(readFileSync(join(ART, 'characters', base, 'idle.json'), 'utf8')).baselineY as number) : NaN;
      const ratio = idle.baselineY / oldBaseline;
      for (const pose of ['attack', 'cast', 'hurt', 'victory'] as const) {
        if (poses[pose] || !states.includes(pose) || !HAVE_ART) continue; // installed itself: measured
        const theirs = poseRegistrationFor(characterUrl(base, pose));
        const sidecarScale = JSON.parse(readFileSync(join(ART, 'characters', base, `${pose}.json`), 'utf8')).scale as number | undefined;
        expect(mine(pose)?.scale, `${base}/${pose}`).toBeCloseTo((theirs?.scale ?? sidecarScale ?? 1) * ratio, 3);
        expect(mine(pose)?.stanceX, `${base}/${pose}`).toBe(theirs?.stanceX);
      }
    }
  });

  it.skipIf(!HAVE_ART)('every installed painting is the file the record says (its sha256), with its sidecar and its exact 2x, 3x and 4x masters listed', () => {
    const manifest = JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8'));
    for (const [base, poses] of Object.entries(INSTALLED)) {
      for (const [pose, rec] of Object.entries(poses)) {
        const png = join(ART, 'characters', nsId(base), `${pose}.png`);
        expect(sha(png), `${base}/${pose}`).toBe(rec.sha256);
        const side = JSON.parse(readFileSync(join(ART, 'characters', nsId(base), `${pose}.json`), 'utf8'));
        expect([side.width, side.height]).toEqual(rec.size);
        expect(side.baselineY).toBe(rec.baselineY);
        expect(['right', 'left', 'front']).toContain(side.facing);
        expect(side.expNamespace).toBe('exp-leblanc');
        expect(manifest.subjects[nsId(base)].tiers?.[pose] ?? []).toEqual(rec.tiers);
        for (const n of rec.tiers) expect(existsSync(join(ART, 'characters', nsId(base), `${pose}@${n}x.png`)), `${pose}@${n}x`).toBe(true);
      }
    }
  });
});

describe('the registration table builder (tools/exp-art-table.mjs)', () => {
  const base = { registration: { sub: { idle: { stanceX: 100 }, attack: { scale: 1.1, stanceX: 80 }, ko: {}, hurt: { feetRow: 300 } } }, ko: { sub: 0.6, other: 0.5 } };
  const sidecars: Record<string, { baselineY?: number; scale?: number }> = { 'sub/idle': { baselineY: 1000 }, 'sub/cast': { scale: 0.9 }, 'sub/hurt': {} };
  const opts = { readSidecar: (s: string, p: string) => sidecars[`${s}/${p}`] ?? null, statesOf: () => ['idle', 'attack', 'cast', 'ko', 'hurt'] };

  it('with nothing installed every row is the base row (a KO the base leaves to the KO table takes its value as an explicit scale)', () => {
    const t = buildExpRegistration(base, ['sub', 'other'], {}, opts);
    expect(Object.keys(t)).toEqual(['exp-leblanc-sub']);
    expect(t['exp-leblanc-sub']).toEqual({ attack: { scale: 1.1, stanceX: 80 }, hurt: { feetRow: 300 }, idle: { stanceX: 100 }, ko: { scale: 0.6 } });
  });

  it('a new idle takes its measured row; every other pose, and every pose the old subject has, is rescaled by new baseline over old', () => {
    const t = buildExpRegistration(base, ['sub'], { sub: { idle: { baselineY: 1300, row: { stanceX: 222 } } } }, opts)['exp-leblanc-sub']!;
    expect(t['idle']).toEqual({ stanceX: 222 });
    expect(t['attack']).toEqual({ scale: 1.43, stanceX: 80 }); // 1.1 x 1.3
    expect(t['cast']).toEqual({ scale: 1.17 }); // the sidecar's 0.9 x 1.3, a pose the base table had no row for
    expect(t['ko']).toEqual({ scale: 0.78 }); // the KO table's 0.6 x 1.3
    expect(t['hurt']).toEqual({ feetRow: 300, scale: 1.3 }); // no scale anywhere: 1 x 1.3
  });

  it('a pose installed beside the new idle keeps its own measured row, untouched by the ratio', () => {
    const t = buildExpRegistration(base, ['sub'], { sub: { idle: { baselineY: 1300, row: { stanceX: 222 } }, attack: { baselineY: 900, row: { scale: 0.95, stanceX: 150 } } } }, opts)['exp-leblanc-sub']!;
    expect(t['attack']).toEqual({ scale: 0.95, stanceX: 150 });
  });
});

describe('the scene registry: the same room over its own plate and namespace', () => {
  const loaded: LoadedScene[] = [];

  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      const stub: object = new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? undefined : stub), apply: () => stub, set: () => true });
      return new Proxy({} as Record<string | symbol, unknown>, {
        get(target, prop) {
          if (prop in target) return target[prop];
          if (prop === 'canvas') return this;
          if (prop === 'getImageData' || prop === 'createImageData') return (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4), width: w, height: h });
          if (prop === 'measureText') return () => ({ width: 10 });
          return () => stub;
        },
        set(target, prop, value) {
          target[prop] = value;
          return true;
        },
      }) as never;
    });
    setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
  });

  afterAll(() => {
    for (const scene of loaded) scene.dispose();
    resetArtManifest();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function stage(key: string): Promise<LoadedScene> {
    const scene = await loadScene(key, new PerspectiveCamera(40, 16 / 9, 0.1, 200));
    loaded.push(scene);
    return scene;
  }

  it("publishes the namespace on the preview's scene and none on Chapter VI's", async () => {
    const mine = await stage('exp-leblanc-last-room');
    const theirs = await stage('leblanc-last-room');
    expect(mine.key).toBe('exp-leblanc-last-room');
    expect(mine.slots.artNamespace).toBe('exp-leblanc');
    expect(theirs.slots.artNamespace).toBeUndefined();
    expect('artNamespace' in theirs.slots).toBe(false);
  }, 60_000);

  it("stages the same room: the same party and enemy marks and heights as Chapter VI's", async () => {
    const mine = await stage('exp-leblanc-last-room');
    const theirs = await stage('leblanc-last-room');
    expect(mine.slots.party).toEqual(theirs.slots.party);
    expect(mine.slots.enemy).toEqual(theirs.slots.enemy);
    expect(mine.slots.partyHeight).toBe(theirs.slots.partyHeight);
    expect(mine.slots.enemyHeight).toBe(theirs.slots.enemyHeight);
    expect(mine.slots.enemyLaneX).toEqual(theirs.slots.enemyLaneX);
  }, 60_000);

  it('is listed in the scene table, and the factory and the table agree on the namespace', () => {
    expect(sceneKeys()).toContain('exp-leblanc-last-room');
    expect(getScene('exp-leblanc-last-room')!.slots.artNamespace).toBe('exp-leblanc');
    expect(getScene('leblanc-last-room')!.slots.artNamespace).toBeUndefined();
  });
});

describe('an experiment, not a chapter: the board, the store, the save', () => {
  /** The board has no experiment card (it is hidden behind its word, `exp-leblanc-door.test.ts`); these tests hand the experiment in to read what its card would be. */
  const WITH_CARD = { experiments: EXPERIMENT_CHAPTERS } as const;
  let save: SaveStore;
  let store: Record<string, string>;
  beforeEach(() => {
    window.localStorage.clear();
    save = new SaveStore();
    store = {};
    setExperimentStorageForTests({ getItem: (k) => store[k] ?? null, setItem: (k, v) => void (store[k] = v) });
  });
  afterAll(() => setExperimentStorageForTests(undefined));

  it('has no card by default; handed in, it is the last card of the FFX-2 group, after the eighteen, labelled EXP', () => {
    expect(buildChapterTiles(save)).toHaveLength(18);
    const tiles = buildChapterTiles(save, WITH_CARD);
    const last = tiles[tiles.length - 1]!;
    expect(last.id).toBe('exp-leblanc');
    expect(last.numeral).toBe('EXP');
    expect(last.title).toBe('Experimental: Leblanc (new art)');
    expect(last.game).toBe('ffx2');
    expect(last.sceneKey).toBe('exp-leblanc-last-room');
    expect(last.playable).toBe(true);
    expect(tiles.filter((t) => !t.chapter?.experimental)).toHaveLength(18);
  });

  it("keeps its attempts and clears in the experiments' store and writes nothing to the save", () => {
    const before = JSON.stringify(save.snapshot());
    experimentProgress.recordAttempt('exp-leblanc');
    experimentProgress.recordClear('exp-leblanc', 123_456, 40);
    expect(experimentRecord('exp-leblanc')).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 123_456 });
    expect(experimentProgress.chapter('exp-leblanc').bestTimeMs).toBe(123_456);
    expect(Object.keys(JSON.parse(store[EXPERIMENTS_KEY]!))).toEqual(['exp-leblanc']);
    expect(JSON.stringify(save.snapshot())).toBe(before);
    expect(save.snapshot().chapters['exp-leblanc']).toBeUndefined();
    expect(window.localStorage.getItem('pyrefly-reprise:save:v1') ?? '').not.toContain('exp-leblanc');
  });

  it('its card shows the cleared ribbon from the experiments\' store, never from the save', () => {
    expect(buildChapterTiles(save, WITH_CARD).at(-1)!.cleared).toBe(false);
    recordExperimentClear('exp-leblanc', 99_000);
    expect(buildChapterTiles(save, WITH_CARD).at(-1)!.cleared).toBe(true);
    expect(save.isCleared('exp-leblanc')).toBe(false);
  });

  it('has a pip on the progress strip but is no part of "N of M": that stays the eighteen', () => {
    let progress = boardProgress(buildChapterTiles(save, WITH_CARD), 0);
    expect(progress.total).toBe(18);
    expect(progress.pips).toHaveLength(19);
    expect(progress.pips.at(-1)).toMatchObject({ id: 'exp-leblanc', numeral: 'EXP', lit: false });
    recordExperimentClear('exp-leblanc', 99_000);
    progress = boardProgress(buildChapterTiles(save, WITH_CARD), 0);
    expect(progress.beaten).toBe(0);
    expect(progress.total).toBe(18);
    expect(progress.pips.at(-1)!.lit).toBe(true);
  });
});

describe("the experiment's room is pale, so its HUD takes more ink (and only its HUD)", () => {
  const read = (rel: string): string => readFileSync(join(process.cwd(), rel), 'utf8');

  it("BattleScreen puts the scene's art namespace on the root, and takes it off for a scene with none", () => {
    const src = read('src/app/screens/BattleScreen.ts');
    expect(src).toContain("this.root.dataset['artNamespace'] = scene.slots.artNamespace;");
    expect(src).toContain("delete this.root.dataset['artNamespace'];");
    expect(SCENE_ART_NAMESPACE[EXP_LEBLANC_SCENE]).toBe('exp-leblanc');
  });

  it('the FFX-2 HUD stylesheet names the namespace once, with the three ink tokens, and the shared tokens are untouched', () => {
    const css = read('src/ui/ffx2/ffx2-hud.css').replace(/\r\n/g, '\n');
    const rule = css.match(/\[data-art-namespace='exp-leblanc'\] \.ig \{([^}]*)\}/);
    expect(rule, 'the scoped rule').not.toBeNull();
    const body = rule![1]!;
    expect(body).toMatch(/--ig-ink-panel: rgba\(11, 10, 18, 0\.92\)/);
    expect(body).toMatch(/--ig-ink-chip: rgba\(11, 10, 18, 0\.8\)/);
    expect(body).toMatch(/--ig-ink-acting: rgba\(11, 10, 18, 0\.96\)/);
    expect(css.split("data-art-namespace='exp-leblanc'").length - 1).toBe(1);
    const tokens = read('src/ui/inkgold/tokens.css');
    expect(tokens).toContain('--ig-ink-panel: rgba(11, 10, 18, 0.84);');
    expect(tokens).toContain('--ig-ink-chip: rgba(11, 10, 18, 0.62);');
    expect(tokens).toContain('--ig-ink-acting: rgba(11, 10, 18, 0.94);');
  });
});
