/**
 * Combatant -> painted-art id, and art id -> PNG urls.
 *
 * Conventions fixed by the art session:
 * - party / enemy figures: `public/art/characters/<artId>/<pose>.png`, with a
 *   sidecar `.json` carrying `{width,height,baselineY}` (read by `PaintedArt`).
 * - portraits: `public/art/portraits/<id>.png`.
 * - backdrops: `public/art/backdrops/<sceneKey>.png`.
 *
 * Two families need more than the combatant id:
 * - **FFX-2 girls** are `<girl>-<dressphere>` (`yuna-gunner`, `rikku-thief`,
 *   `paine-warrior`), so a spherechange swaps the actor's art id.
 * - **Multi-form bosses** are `<id>-<n>`, 1-based (`yunalesca-1/2/3`,
 *   `braskas-final-aeon-1/2`), so a `form-change` swaps the painting.
 *
 * Nothing here throws. A missing PNG becomes a procedural placeholder inside
 * `PaintedActor`, which is what keeps a chapter playable before its art exists.
 */

import type { AnyCombatant, FFX2Combatant, FFXCombatant } from '../battle/common/types.ts';
import { artStatesFor } from './ArtManifest.ts';
import { artUrl } from './PaintedArt.ts';

/** Poses a party member is painted in. */
export const PARTY_POSES = [
  'idle',
  'ready',
  'attack',
  'cast',
  'item',
  'hurt',
  'ko',
  'victory',
  'defend',
] as const;

/** Poses an enemy is painted in. Bosses rarely need the full party set. */
export const ENEMY_POSES = ['idle', 'attack', 'cast', 'hurt', 'ko'] as const;

/**
 * Combatant id -> art id, where the two differ.
 *
 * Multi-form bosses are resolved by {@link artIdFor} instead, because the id
 * depends on the live `formIndex`.
 */
const ART_ID_OVERRIDES: Readonly<Record<string, string>> = {
  // Seymour Flux is painted as a body plus a separate floating servant; the
  // two are real, separately-targetable combatants.
  'seymour-flux': 'seymour-flux-body',
  // One painting serves both pagodas.
  'yu-pagoda-left': 'yu-pagoda',
  'yu-pagoda-right': 'yu-pagoda',
} as const;

/** Enemies whose art id is `<id>-<formIndex+1>`. */
const FORM_ART_IDS: ReadonlySet<string> = new Set(['yunalesca', 'braskas-final-aeon']);

/** FFX-2 art ids that collide with an FFX id and need the game prefix. */
const FFX2_PREFIXED: ReadonlySet<string> = new Set(['bahamut']);

/** The painted-art id for a live combatant. */
export function artIdFor(c: AnyCombatant): string {
  const id = c.id;

  // FFX-2 girls: the dressphere is part of the painting.
  const x2 = c as FFX2Combatant;
  if (x2.dresspheres?.current) return `${id}-${x2.dresspheres.current}`;

  const enemy = (c as FFXCombatant).enemy;
  if (enemy) {
    if (FORM_ART_IDS.has(id)) return `${id}-${(enemy.formIndex ?? 0) + 1}`;
    if (FFX2_PREFIXED.has(id) && isFfx2Enemy(c)) return `ffx2-${id}`;
  }

  if (ART_ID_OVERRIDES[id]) return ART_ID_OVERRIDES[id]!;
  // `spriteKey` is the data file's own answer; it wins over the bare id.
  return c.spriteKey || id;
}

/**
 * An FFX-2 enemy carries `level` on its `EnemyFields` (FFX has no enemy level),
 * which is the cheapest signal available on a bare `Combatant`.
 */
function isFfx2Enemy(c: AnyCombatant): boolean {
  const x2 = c as FFX2Combatant;
  if (typeof x2.level === 'number') return true;
  return typeof (c as FFXCombatant).enemy?.level === 'number';
}

/** URL of one painted pose. */
export function characterUrl(artId: string, pose: string): string {
  return artUrl(`art/characters/${artId}/${pose}.png`);
}

/** URL of a 32x32 portrait. */
export function portraitUrl(id: string): string {
  return artUrl(`art/portraits/${id}.png`);
}

/** URL of a scene backdrop. */
export function backdropUrl(sceneKey: string): string {
  return artUrl(`art/backdrops/${sceneKey}.png`);
}

/** `{ pose: url }` for a whole figure, ready for `PaintedActor.loadPoses`. */
export function poseMapFor(artId: string, kind: 'party' | 'enemy'): Record<string, string> {
  const poses = kind === 'party' ? PARTY_POSES : ENEMY_POSES;
  return Object.fromEntries(poses.map((p) => [p, characterUrl(artId, p)]));
}

/**
 * What to show when a pose has not been painted yet, best first.
 *
 * Without this the presenter's own `setPose('ready')` on the acting character
 * would blank a fully-painted Tidus back to a grey silhouette, because `ready`
 * is one of the poses the art pipeline has not produced. Falling back to
 * `idle` keeps the painting on screen; the moment the real PNG lands it is
 * picked up with no code change.
 */
const POSE_FALLBACKS: Readonly<Record<string, readonly string[]>> = {
  idle: ['idle'],
  ready: ['ready', 'idle'],
  attack: ['attack', 'ready', 'idle'],
  cast: ['cast', 'attack', 'idle'],
  item: ['item', 'cast', 'idle'],
  hurt: ['hurt', 'idle'],
  ko: ['ko', 'hurt', 'idle'],
  defend: ['defend', 'ready', 'idle'],
  victory: ['victory', 'idle'],
};

/** HEAD-probe results, so a battle probes each URL at most once per session. */
const exists = new Map<string, Promise<boolean>>();

/**
 * Does this painting exist?
 *
 * `res.ok` alone is not enough: the Vite dev server answers a missing
 * `/art/.../ready.png` with **`index.html` and a 200**, so a status check says
 * every pose exists and every one of them then fails to decode. The
 * content-type is the honest signal, and it works the same way on the built
 * site, where a miss is a real 404.
 */
function probe(url: string): Promise<boolean> {
  const cached = exists.get(url);
  if (cached) return cached;
  const p = fetch(url, { method: 'HEAD', cache: 'force-cache' })
    .then((res) => res.ok && (res.headers.get('content-type') ?? '').startsWith('image/'))
    .catch(() => false);
  exists.set(url, p);
  return p;
}

/**
 * Which poses `artId` has, without asking the server.
 *
 * `public/art/manifest.json` is generated by `tools/gen/manifest.mjs` on every
 * build and lists exactly what the art fleet has produced, so the probes above
 * — one HEAD per pose per figure, most of them 404s for poses nobody has
 * painted — collapse into a lookup. Returns `null` only when there is no
 * manifest to read, and the caller then probes exactly as before.
 */
async function poseSet(artId: string): Promise<ReadonlySet<string> | null> {
  const states = await artStatesFor(artId);
  return states ? new Set(states) : null;
}

/** Does `artId` have this pose? Manifest first, HEAD probe only as a fallback. */
async function hasPose(artId: string, pose: string): Promise<boolean> {
  const set = await poseSet(artId);
  if (set) return set.has(pose);
  return probe(characterUrl(artId, pose));
}

/**
 * A pose map in which **every** pose points at art that actually exists,
 * falling back down {@link POSE_FALLBACKS} until something does.
 *
 * A figure with no art at all returns the plain map, so `PaintedActor` draws
 * its procedural stand-in exactly as before.
 */
export async function resolvePoseMap(
  artId: string,
  kind: 'party' | 'enemy',
): Promise<Record<string, string>> {
  const poses = kind === 'party' ? PARTY_POSES : ENEMY_POSES;
  const wanted = [...new Set(poses.flatMap((p) => POSE_FALLBACKS[p] ?? [p]))];
  const found = new Map<string, boolean>();
  const set = await poseSet(artId);
  if (set) {
    for (const p of wanted) found.set(p, set.has(p));
  } else {
    await Promise.all(
      wanted.map(async (p) => {
        found.set(p, await probe(characterUrl(artId, p)));
      }),
    );
  }
  if (![...found.values()].some(Boolean)) return poseMapFor(artId, kind);

  const out: Record<string, string> = {};
  for (const pose of poses) {
    const chain = POSE_FALLBACKS[pose] ?? [pose];
    const hit = chain.find((p) => found.get(p)) ?? pose;
    out[pose] = characterUrl(artId, hit);
  }
  return out;
}

/**
 * Resolve a figure against several candidate art ids, best first.
 *
 * The art session is still renaming folders — Seymour's painting lives under
 * `seymour-flux/` today and becomes `seymour-flux-body/` tomorrow — so a
 * combatant is looked up under its mapped id first and its raw id second. The
 * returned `artId` is whichever one actually had art, or the first candidate
 * when none did (and the procedural stand-in takes over).
 */
export async function resolveArt(
  candidates: readonly string[],
  kind: 'party' | 'enemy',
): Promise<{ artId: string; poses: Record<string, string> }> {
  const tried = candidates.filter((c, i) => c && candidates.indexOf(c) === i);
  for (const artId of tried) {
    if (await hasPose(artId, 'idle')) {
      return { artId, poses: await resolvePoseMap(artId, kind) };
    }
  }
  const artId = tried[0] ?? 'unknown';
  return { artId, poses: poseMapFor(artId, kind) };
}

/** Rough world height for a figure, so a boss reads as a boss. */
export function worldHeightFor(c: AnyCombatant, defaults: { party: number; enemy: number }): number {
  if (c.side !== 'enemy') return c.side === 'aeon' ? defaults.enemy * 0.7 : defaults.party;
  if (c.flags.isPart) return defaults.enemy * 0.55;
  if (c.flags.isBoss) return defaults.enemy;
  return defaults.enemy * 0.7;
}
