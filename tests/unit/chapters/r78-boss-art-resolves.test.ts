/**
 * **Release 78, R77-3 (FFX only for chapters 41 and 43; the Youth League, FFX-2, is listed and unchanged): the paintings of Spherimorph, Ultima Weapon, Omega Weapon and Nemesis are drawn, not a shared hooded stand-in.**
 *
 * The focused review of release 77 (6429ff15e) filed "the new Ultima Weapon, Spherimorph, Yaibal and League Warrior figures are one shared hooded silhouette". Traced: the silhouette the reviewer saw is (a) the
 * Youth League's eight fighter kinds, which have NO paintings yet (expected stand-ins, listed here), and (b) the review's own first pass, whose `dist-gate` had been left without its WebP derivatives by a cut
 * build (the review's process note), so every painting failed to load and the stage drew its procedural boss figure and the initials. The second, valid pass shows the marbled sphere and the armoured beast.
 * The code names the right keys; this file proves that **from the chapters' own data to the art index's answer**, with the real presenter code (`artCandidatesFor` + `resolveArt`, the pair the stage asks), so a rename
 * of a sprite key, a registration row, a manifest entry or a folder would fail here and not in a browser:
 *
 *  1. Every enemy body of the two hidden FFX chapters (every link of the Omega Ruins chain) resolves, against the manifest of the art mirror (`BOSS_ART_ROOT`, else `public/art`), to its own painting under its own
 *     key, with every pose the presenter asks for pointing at that subject's own files (no pose falls to another subject), and every one of those files is on disk. Skipped where the art is not installed.
 *  2. Every one of those keys has registration rows (the pose tables the stage reads) for every pose the manifest lists. Needs no art.
 *  3. The Youth League's eight fighter kinds resolve to NOTHING (a stand-in) and are the only foes of the three chapters that do: the list the handoff carries. Needs a manifest.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { AnyCombatant, EnemyDef, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { ULTIMA_GROUP_ID, OMEGA_GROUP_ID, NEMESIS_GROUP_ID } from '../../../src/data/ffx/omega-ruins-ids.ts';
import { SPHERIMORPH } from '../../../src/data/chapter-spherimorph.ts';
import { youthLeagueGroups } from '../../../src/data/ffx2/enemies/youth-league.ts';
import { YL_SPRITES } from '../../../src/data/youth-league-ids.ts';
import { POSE_REGISTRATION_FOES } from '../../../src/data/art/poseRegistrationFoes.ts';
import { artCandidatesFor, characterUrl, ENEMY_POSES, resolveArt } from '../../../src/engine/BattlePresenterArt.ts';
import { parseArtManifest, resetArtManifest, setArtManifest, type ArtManifest } from '../../../src/engine/ArtManifest.ts';

afterEach(() => resetArtManifest());

const ART_ROOT = resolve(process.env['BOSS_ART_ROOT'] ?? join(import.meta.dirname, '..', '..', '..', 'public', 'art'));
const MANIFEST_FILE = join(ART_ROOT, 'manifest.json');
const INSTALLED = existsSync(MANIFEST_FILE);
const manifestOfMirror = (): ArtManifest => {
  const parsed = parseArtManifest(JSON.parse(readFileSync(MANIFEST_FILE, 'utf8')));
  if (!parsed) throw new Error('the mirror manifest did not parse');
  return parsed;
};

/** The enemy bodies of a group list, with the group they stand in. */
const bodiesOf = (groups: readonly EnemyGroupDef[]): EnemyDef[] => groups.flatMap((g) => [...g.enemies, ...(g.parts ?? [])]);
/** The combatant shape `artCandidatesFor` reads (the id and the sprite key; no dressphere, no form). */
const asCombatant = (e: EnemyDef): AnyCombatant => ({ id: e.id, spriteKey: e.spriteKey, side: 'enemy', flags: {}, enemy: e }) as unknown as AnyCombatant;

const spherimorphGroups = (): EnemyGroupDef[] => [SPHERIMORPH.enemyGroupRef as EnemyGroupDef];
const omegaGroups = (): EnemyGroupDef[] => [ULTIMA_GROUP_ID, OMEGA_GROUP_ID, NEMESIS_GROUP_ID].map((id) => ENEMY_GROUPS_BY_ID[id] as EnemyGroupDef);

/** The four paintings the two FFX chapters draw, and the special pose each carries beside the five the presenter asks for. */
const EXPECTED: Readonly<Record<string, string>> = { spherimorph: 'overdrive', 'ultima-weapon': 'rain', 'omega-weapon': 'nova', nemesis: 'armageddon' };

describe('R77-3: the chapter data names the keys of the installed paintings (FFX only)', () => {
  it('Spherimorph is one body drawn as `spherimorph`; the Omega Ruins have three bodies, `ultima-weapon`, `omega-weapon` and `nemesis`; no other enemy stands in either chapter', () => {
    expect(bodiesOf(spherimorphGroups()).map((e) => e.spriteKey)).toEqual(['spherimorph']);
    expect(bodiesOf(omegaGroups()).map((e) => e.spriteKey)).toEqual(['ultima-weapon', 'omega-weapon', 'nemesis']);
    for (const e of [...bodiesOf(spherimorphGroups()), ...bodiesOf(omegaGroups())]) expect(e.forms?.[0]?.spriteKey, e.id).toBe(e.spriteKey);
  });

  it('the stage asks for exactly the painted key first (the mapped id, then the sprite key, then the id: all three are the same word)', () => {
    for (const e of [...bodiesOf(spherimorphGroups()), ...bodiesOf(omegaGroups())]) expect(artCandidatesFor(asCombatant(e)), e.id).toEqual([e.spriteKey, e.spriteKey, e.id]);
  });

  it('every one of the four keys has a registration row for the idle and for each pose of its own (the tables the stage and the critic read)', () => {
    for (const [key, special] of Object.entries(EXPECTED)) {
      const rows = POSE_REGISTRATION_FOES[key];
      expect(rows, `${key} has a registration table`).toBeDefined();
      for (const pose of ['idle', 'attack', 'cast', 'hurt', 'ko', special]) expect(rows![pose], `${key}/${pose}`).toBeDefined();
    }
  });
});

describe.skipIf(!INSTALLED)('R77-3: against the installed art (the mirror `BOSS_ART_ROOT` names, else `public/art`)', () => {
  it.each(Object.keys(EXPECTED))('%s: the manifest lists the subject with the idle, and every pose of its registration table', (key) => {
    const subject = manifestOfMirror().subjects[key];
    expect(subject, `${key} in the manifest`).toBeDefined();
    expect(subject!.states).toContain('idle');
    expect(subject!.states).toContain(EXPECTED[key]);
    for (const pose of Object.keys(POSE_REGISTRATION_FOES[key]!)) expect(subject!.states, `${key}/${pose} is painted`).toContain(pose);
  });

  it('every body of both chapters resolves to ITS OWN painting through the real presenter code, with every asked pose pointing at its own files, none at another subject and none at a placeholder', async () => {
    setArtManifest(manifestOfMirror());
    for (const e of [...bodiesOf(spherimorphGroups()), ...bodiesOf(omegaGroups())]) {
      const { artId, poses } = await resolveArt(artCandidatesFor(asCombatant(e)), 'enemy');
      expect(artId, `${e.id} resolves to its own key`).toBe(e.spriteKey);
      for (const pose of ENEMY_POSES) {
        const url = poses[pose]!;
        expect(url, `${e.id}/${pose}`).toContain(`/characters/${e.spriteKey}/`);
        expect(url, `${e.id}/${pose}`).toMatch(/\.png$/);
      }
      expect(poses['idle'], e.id).toBe(characterUrl(e.spriteKey!, 'idle'));
      expect(poses['attack'], `${e.id}: the subject's own attack painting`).toBe(characterUrl(e.spriteKey!, 'attack'));
      // The control that tells a manifest hit from the no-art answer: with no art at all the map is the plain one (a `telegraph.png` that does not exist); with the art the wind-up slot falls to the idle.
      expect(poses['telegraph'], `${e.id}: the wind-up slot resolved down the chain (a painted figure), not the plain no-art map`).toBe(characterUrl(e.spriteKey!, 'idle'));
    }
  });

  it('every file those poses name is on disk in the mirror (the manifest is not ahead of the folders)', async () => {
    setArtManifest(manifestOfMirror());
    for (const e of [...bodiesOf(spherimorphGroups()), ...bodiesOf(omegaGroups())]) {
      const { poses } = await resolveArt(artCandidatesFor(asCombatant(e)), 'enemy');
      for (const url of new Set(Object.values(poses))) {
        const rel = url.slice(url.indexOf('/characters/') + 1);
        expect(existsSync(join(ART_ROOT, rel)), `${e.id}: ${rel}`).toBe(true);
      }
    }
  });

  it('the Youth League is the only stand-in: its eight fighter kinds have no painting yet (listed in the handoff), and every foe of the three chapters that does not resolve is one of them (FFX-2 only)', async () => {
    setArtManifest(manifestOfMirror());
    const standIns = new Set<string>();
    for (const e of [...bodiesOf(spherimorphGroups()), ...bodiesOf(omegaGroups()), ...bodiesOf(youthLeagueGroups)]) {
      const { artId } = await resolveArt(artCandidatesFor(asCombatant(e)), 'enemy');
      if (artId !== e.spriteKey || manifestOfMirror().subjects[e.spriteKey!] === undefined) standIns.add(e.spriteKey!);
    }
    expect([...standIns].sort()).toEqual(Object.values(YL_SPRITES).sort());
  });
});
