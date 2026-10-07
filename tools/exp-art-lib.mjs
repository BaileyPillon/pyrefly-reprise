/**
 * The experimental Leblanc chapter's art workspace: names, paths and the subject list (branch `exp-leblanc`; FFX-2 only).
 *
 * Bailey (2026-10-06): "the experimental new chapter will be the leblanc preview ... an additional experimental chapter. keep the
 * current leblanc chapter ... the artwork for that experimental chapter will be chatgpt images 2.5". The chapter is Chapter VI's
 * encounter (same engine data, groups, scripts and music) drawn from a SEPARATE set of paintings, the **art namespace**
 * `exp-leblanc` (`src/data/art/artNamespace.ts` is the TypeScript half; this file is the tooling half, kept in step by
 * `tests/unit/exp-leblanc-art-namespace.test.ts`).
 *
 * The layout inside an art root (`public/art` of the worktree, which is a junction to {@link EXP_ART}):
 *
 *   characters/exp-leblanc-<subject>/<pose>.png + .json   one folder per base subject (`exp-leblanc-yuna-gunner`, `exp-leblanc-leblanc`)
 *   backdrops/exp-leblanc-last-room.png + .json (+ @2x)   the Last Room plate, the scene key `exp-leblanc-last-room`
 *   portraits/exp-leblanc-<id>.png + .json                the dialogue portraits (`yuna-x2`, `rikku-x2`, `paine`, `leblanc`, `logos`, `ormi`, `brother-x2`)
 *   pause/exp-leblanc-<plate>.png + .2x.webp + .json      the pause close-ups (`yuna-ffx2`, `rikku-ffx2`, `paine`, and the CHAPTER tab's `leblanc`)
 *
 * Nothing in this file writes anything; `exp-art.mjs` and `exp-install.mjs` do. Plain JS (no type syntax), so Node loads it as is.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The art namespace's id and the prefix of every subject folder in it. */
export const NAMESPACE = 'exp-leblanc';
/** The scene key (and so the backdrop's file stem) of the experimental chapter, and the one it copies. */
export const SCENE_KEY = 'exp-leblanc-last-room';
export const BASE_SCENE_KEY = 'leblanc-last-room';

/** The release tree's art: READ ONLY for everything in this branch (it is the shipped, approved set). */
export const RELEASE_ART = process.env.EXP_RELEASE_ART ?? 'D:/pyrefly-r39-int/public/art';
/** The experimental workspace: a hard-linked mirror of {@link RELEASE_ART} plus the namespace as real copies. `public/art` points here. */
export const EXP_ART = process.env.EXP_ART ?? 'D:/pyrefly-art-exp';

/** Files a tool rewrites in place (the generated index), so they are real copies in the mirror and never hard links. */
export const REAL_COPY_IN_MIRROR = Object.freeze(['manifest.json']);

/** The namespaced subject id for a base subject (`yuna-gunner` -> `exp-leblanc-yuna-gunner`); idempotent. */
export function nsId(base) {
  return base.startsWith(`${NAMESPACE}-`) ? base : `${NAMESPACE}-${base}`;
}

/** The base subject of a namespaced id; an id outside the namespace comes back as it was. */
export function baseId(id) {
  return id.startsWith(`${NAMESPACE}-`) ? id.slice(NAMESPACE.length + 1) : id;
}

export const readJson = (path, fallback = null) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
};

/** Poses of the subject `base` the manifest of `artRoot` lists (chosen states only, `public/art/manifest.json`). */
export function statesOf(artRoot, base) {
  const manifest = readJson(join(artRoot, 'manifest.json'), { subjects: {} });
  return manifest.subjects?.[base]?.states ?? [];
}

/**
 * Every base subject the chapter can draw, read from the game's own data (never guessed): the girls (one painting per dressphere
 * she can wear here, falling back the way `resolveArt` does) and every enemy of the three acts (`spriteKey` and each form's).
 *
 * `manifestRoot` is the art root whose manifest says which paintings exist (the release tree); the girls' fallback chain
 * `<girl>-<dressphere>`, the build's `spriteKey`, the bare id is walked against it exactly as `BattlePresenterArt.resolveArt` does.
 */
export async function chapterSubjects(manifestRoot = RELEASE_ART) {
  const url = (p) => pathToFileURL(join(REPO, p)).href;
  const { chateauBuild } = await import(url('src/data/ffx2/builds/chateau.ts'));
  const { leblancEntranceGroup } = await import(url('src/data/ffx2/enemies/leblanc-syndicate-acts.ts'));
  const { ENEMY_GROUPS_BY_ID } = await import(url('src/data/ffx2/index.ts'));
  const manifest = readJson(join(manifestRoot, 'manifest.json'), { subjects: {} });
  const hasIdle = (id) => (manifest.subjects?.[id]?.states ?? []).includes('idle');

  const girls = new Set();
  for (const m of chateauBuild.members) {
    for (const d of new Set([m.currentDressphere, ...m.owned])) {
      const winner = [`${m.id}-${d}`, m.spriteKey, m.id].find(hasIdle);
      if (winner) girls.add(winner);
    }
  }
  const enemies = new Set();
  const seen = new Set();
  for (let g = leblancEntranceGroup; g && !seen.has(g.id); g = g.nextGroupId ? ENEMY_GROUPS_BY_ID[g.nextGroupId] : undefined) {
    seen.add(g.id);
    for (const e of g.enemies) {
      enemies.add(e.spriteKey);
      for (const f of e.forms ?? []) enemies.add(f.spriteKey);
    }
  }
  return { girls: [...girls].sort(), enemies: [...enemies].sort() };
}
