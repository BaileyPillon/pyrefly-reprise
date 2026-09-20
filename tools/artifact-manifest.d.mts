/** Types for `tools/artifact-manifest.mjs`, so the unit tests can import it directly. */

export interface ManifestFile { sha256: string; bytes: number; decode?: 'ok' | 'failed' | 'blank' | 'UNVERIFIED' }
export interface ArtifactManifest {
  manifestVersion: number; count: number; totalBytes: number; artifactHash: string; decodeChecked: boolean;
  audioUnverified: number; problems: string[]; files: Record<string, ManifestFile>;
}
export interface LiveVerification {
  result: 'PASS' | 'FAIL' | 'UNVERIFIED'; artifactHash: string; liveManifest: 'match' | 'mismatch' | 'missing';
  checked: number; mismatched: string[]; missing: string[]; wrongType: string[]; errors: string[]; notes: string[];
}

export declare const MANIFEST_NAME: string;
export declare function sha256(buf: Uint8Array | string): string;
export declare function artifactHashOf(files: Record<string, { sha256: string }>): string;
export declare function buildManifest(dir: string, options?: { decode?: boolean }): Promise<ArtifactManifest>;
export declare function diffManifests(
  previous: { files: Record<string, { sha256: string }> } | null | undefined,
  next: { files: Record<string, { sha256: string }> },
): { added: string[]; changed: string[]; removed: string[] };
export declare function shippedToRepoPaths(paths: string[]): string[];
export declare function selectForVerification(
  manifest: { files: Record<string, unknown> },
  options?: { changed?: string[]; sample?: number; full?: boolean },
): string[];
export declare function verifyLive(
  manifest: ArtifactManifest,
  baseUrl: string,
  options?: { changed?: string[]; sample?: number; full?: boolean; fetchImpl?: typeof fetch; bust?: string },
): Promise<LiveVerification>;
