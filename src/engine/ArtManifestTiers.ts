/**
 * The pure half of the art manifest's masters (release 39, `ArtTier.ts`): parsing `tiers` and `backdropTiers`, reading a master's
 * name, and answering which scales a painting URL has. No DOM, no fetch; `ArtManifest.ts` owns the loading and the cache.
 */
import { logicalArtUrl } from './ArtShipped.ts';
import type { ArtManifest, ArtManifestSubject } from './ArtManifest.ts';

/** `{ name: [2, 4] }` from untrusted JSON: scales 2 to 4 only, ascending, for names `known` accepts. */
export function parseTiers(raw: unknown, known: (name: string) => boolean): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [name, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!known(name) || !Array.isArray(list)) continue;
    const scales = [...new Set(list.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 2 && n <= 4))].sort((a, b) => a - b);
    if (scales.length) out[name] = scales;
  }
  return out;
}

/** `tiers` with the older `states2x` folded in: a state listed there has its 2x master. */
export function withStates2x(tiers: Record<string, number[]>, states2x: readonly string[]): Record<string, number[]> {
  for (const state of states2x) tiers[state] = [...new Set([2, ...(tiers[state] ?? [])])].sort((a, b) => a - b);
  return tiers;
}

/** `idle@3x` -> ['idle', '3']: the stem of a master and its scale. */
const MASTER_NAME = /^(.+)@([2-4])x$/;

/** The masters a subject's state ships beyond 1x, from `tiers` and (older manifests) `states2x`. */
function masterScalesOf(subject: ArtManifestSubject | undefined, state: string): readonly number[] {
  const list = subject?.tiers?.[state];
  if (list && list.length) return list;
  return subject?.states2x?.includes(state) ? [2] : [];
}

/** `art/characters/<id>/<state>.png` or `art/backdrops/<key>.png` read apart: what the manifest indexes masters by. */
const TIERED_ASSET = /(?:^|\/)art\/(?:characters\/([^/?#]+)\/([^/?#.@]+)|backdrops\/([^/?#.@]+))\.png(?:$|[?#])/i;

export function scalesOf(manifest: ArtManifest, url: string): readonly number[] {
  const m = TIERED_ASSET.exec(logicalArtUrl(url));
  if (!m) return [];
  if (m[1] !== undefined && m[2] !== undefined) return masterScalesOf(manifest.subjects[m[1]], m[2]);
  return m[3] !== undefined ? (manifest.backdropTiers?.[m[3]] ?? []) : [];
}

/**
 * Does the manifest list the master `stem` names (`idle@3x` of a subject's states, `gagazet@2x` of a backdrop: `subjectId` null)?
 * `null` when `stem` is not a master's name at all, so the caller judges it as an ordinary painting.
 */
export function masterListed(manifest: ArtManifest, subjectId: string | null, stem: string): boolean | null {
  const m = MASTER_NAME.exec(stem);
  if (!m) return null;
  const scales = subjectId === null ? (manifest.backdropTiers?.[m[1]!] ?? []) : masterScalesOf(manifest.subjects[subjectId], m[1]!);
  return scales.includes(Number(m[2]));
}
