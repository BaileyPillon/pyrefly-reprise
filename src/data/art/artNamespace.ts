/**
 * **Art namespaces**: a chapter that draws its figures and backdrop from a SEPARATE set of paintings (branch `exp-leblanc`).
 *
 * Bailey (2026-10-06): the Leblanc preview "will be an additional experimental chapter. keep the current leblanc chapter",
 * with all-new ChatGPT Images art. The experimental chapter runs Chapter VI's engine data, groups, scripts and music
 * unchanged; only the paintings differ. A painting is found by an art id (`public/art/characters/<id>/<pose>.png`) and a
 * backdrop by the scene key (`public/art/backdrops/<key>.png`), so a namespace is a **prefix on the id** and a **scene key of
 * its own**: `yuna-gunner` becomes `exp-leblanc-yuna-gunner`, and the scene `exp-leblanc-last-room` draws
 * `backdrops/exp-leblanc-last-room.png`. Everything that already keys on an id or a scene key (the manifest, the pose
 * registration tables, the hi-res tiers, the sidecars) works for the new set with no new mechanism.
 *
 * How a figure learns its namespace: the **scene** says (`SceneStaging.artNamespace`, set by the scene factory), the stage
 * prefixes every id it resolves (`BattlePresenterStage.add` and `setArt`, and the preload that warms the same files).
 * Chapter VI's scene sets none, so every id it resolves is exactly what it was; the experimental chapter changes nothing for it.
 *
 * Pure: no `three`, no DOM. The tooling half is `tools/exp-art-lib.mjs`; `tests/unit/exp-leblanc-art-namespace.test.ts` keeps
 * the two in step.
 *
 * Game case: the mechanism is shared plumbing (both games); its only user is FFX-2's experimental Leblanc.
 */

/** Every art namespace there is. A subject id that starts `<namespace>-` belongs to it. */
export const ART_NAMESPACES = ['exp-leblanc'] as const;
export type ArtNamespace = (typeof ART_NAMESPACES)[number];

/** The experimental Leblanc chapter's scene key: `public/art/backdrops/exp-leblanc-last-room.png` is its plate. */
export const EXP_LEBLANC_SCENE = 'exp-leblanc-last-room';

/** Which namespace a scene draws its figures from. A scene absent here uses the base art (every shipped chapter). */
export const SCENE_ART_NAMESPACE: Readonly<Record<string, ArtNamespace>> = {
  [EXP_LEBLANC_SCENE]: 'exp-leblanc',
};

/** The namespace a scene key draws from, or `undefined` for the base art. */
export function artNamespaceOfScene(sceneKey: string | undefined): ArtNamespace | undefined {
  return sceneKey !== undefined && Object.hasOwn(SCENE_ART_NAMESPACE, sceneKey) ? SCENE_ART_NAMESPACE[sceneKey] : undefined;
}

/** The namespace an art id already belongs to, or `undefined` for a base id. */
export function artNamespaceOf(artId: string): ArtNamespace | undefined {
  return ART_NAMESPACES.find((ns) => artId.startsWith(`${ns}-`));
}

/**
 * `id` inside `namespace`: `inArtNamespace('exp-leblanc', 'yuna-gunner')` is `exp-leblanc-yuna-gunner`. With no namespace the id
 * comes back untouched, and an id that is already inside a namespace is never prefixed twice.
 */
export function inArtNamespace(namespace: string | undefined, artId: string): string {
  if (!namespace || artNamespaceOf(artId) !== undefined) return artId;
  return `${namespace}-${artId}`;
}

/** The base id of an art id: `exp-leblanc-yuna-gunner` is `yuna-gunner`; a base id comes back as it was. */
export function baseArtId(artId: string): string {
  const ns = artNamespaceOf(artId);
  return ns ? artId.slice(ns.length + 1) : artId;
}
