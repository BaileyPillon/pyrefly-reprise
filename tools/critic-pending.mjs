/**
 * Marker files that make "the critic has not looked at this live build yet"
 * visible. `tools/deploy-pages.mjs` writes one JSON marker per successful
 * deploy under `critic/pending/<mainShortSha>.json`; that same script's
 * startup warning and `tools/critic-status.mjs` both read the folder back.
 * The owner's rule (2026-09-18, restated in `critic/RUBRIC.md` under "The
 * loop"): every live build gets a full critic round, no exceptions. Only the
 * chief critic's report for that exact build clears its marker.
 *
 * Split out of `deploy-pages.mjs` so `tests/unit/critic-pending.test.ts` can
 * exercise the marker shape and the folder reader directly, against a temp
 * directory, without shelling out to node or running a deploy. Types live in
 * `critic-pending.d.mts`, same arrangement as `tools/deploy-classify.mjs` /
 * `.d.mts` and `tools/gen/manifest.mjs` / `.d.mts`.
 *
 * Only `writePendingMarker` and `readPendingMarkers` touch the filesystem;
 * everything else here is a pure function of its arguments.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** The marker's filename: `critic/pending/<mainSha>.json`. */
export function pendingMarkerFileName(mainSha) {
  return `${mainSha}.json`;
}

/** Join a pending dir and a `mainSha` into the marker's full path. */
export function pendingMarkerPath(pendingDir, mainSha) {
  return join(pendingDir, pendingMarkerFileName(mainSha));
}

/**
 * Build the marker's JSON content from a finished deploy's own numbers. Pass
 * the deploy script's own `isoNow` as `deployedAt` so the marker and the
 * `docs/deploys.log` line for the same run agree.
 */
export function buildPendingMarker({ mainSha, bundle, deployedAt, liveUrl, artFiles }) {
  return { mainSha, bundle, deployedAt, liveUrl, artFiles };
}

/** Pretty-printed, newline-terminated — diffable if it's ever hand-edited. */
export function formatPendingMarker(marker) {
  return `${JSON.stringify(marker, null, 2)}\n`;
}

/**
 * Hours between `deployedAt` (ISO) and `now`, rounded to one decimal. This
 * only ever feeds a human-readable label, so unparsable input reads as `0`
 * rather than `NaN` or a thrown error.
 */
export function computeAgeHours(deployedAt, now = new Date()) {
  const then = new Date(deployedAt);
  if (Number.isNaN(then.getTime())) return 0;
  const hours = (now.getTime() - then.getTime()) / (1000 * 60 * 60);
  return Math.round(hours * 10) / 10;
}

/**
 * Write one marker to `pendingDir`, creating the folder (and a `.gitkeep`, so
 * the folder exists in git even when every marker has been cleared) if
 * needed. Returns the path written. The marker file itself is small and
 * meant to be committed by whoever commits next — this function only writes
 * it to disk.
 */
export function writePendingMarker(pendingDir, marker) {
  mkdirSync(pendingDir, { recursive: true });
  const gitkeep = join(pendingDir, '.gitkeep');
  if (!existsSync(gitkeep)) writeFileSync(gitkeep, '');
  const path = pendingMarkerPath(pendingDir, marker.mainSha);
  writeFileSync(path, formatPendingMarker(marker));
  return path;
}

/**
 * Read every marker in `pendingDir`, oldest (largest `ageHours`) first. A
 * missing folder reads as no markers at all rather than an error — nothing
 * has ever been deployed yet, so nothing is pending. A marker file that fails
 * to parse as JSON is kept in the list with `parseError` set instead of being
 * silently dropped: one corrupt marker should not hide the rest, or hide
 * itself.
 */
export function readPendingMarkers(pendingDir, now = new Date()) {
  if (!existsSync(pendingDir)) return [];
  const files = readdirSync(pendingDir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const entries = [];
  for (const file of files) {
    const full = join(pendingDir, file);
    const mainShaFromFile = file.replace(/\.json$/, '');
    let data;
    try {
      data = JSON.parse(readFileSync(full, 'utf8'));
    } catch (err) {
      entries.push({
        file,
        mainSha: mainShaFromFile,
        ageHours: 0,
        parseError: err instanceof Error ? err.message : String(err),
      });
      continue;
    }
    entries.push({
      file,
      mainSha: data.mainSha ?? mainShaFromFile,
      bundle: data.bundle,
      deployedAt: data.deployedAt,
      liveUrl: data.liveUrl,
      artFiles: data.artFiles,
      ageHours: computeAgeHours(data.deployedAt, now),
    });
  }
  entries.sort((a, b) => (b.ageHours ?? 0) - (a.ageHours ?? 0));
  return entries;
}

/**
 * Lines for the "UNEVALUATED LIVE BUILDS" warning block `deploy-pages.mjs`
 * prints at the start of every run, `--dry-run` included — the warning is the
 * point, hotfixes must still ship. Always returns at least one line, so an
 * empty pending folder still shows the check ran rather than printing
 * nothing.
 */
export function formatPendingWarningBlock(entries) {
  if (!entries.length) return ['UNEVALUATED LIVE BUILDS: none'];
  const lines = [
    `UNEVALUATED LIVE BUILDS: ${entries.length} live build(s) awaiting a critic round —`,
  ];
  for (const entry of entries) {
    if (entry.parseError) {
      lines.push(`  ${entry.file}  UNREADABLE (${entry.parseError})`);
      continue;
    }
    lines.push(
      `  main=${entry.mainSha}  bundle=${entry.bundle ?? '?'}  age=${entry.ageHours}h  live=${entry.liveUrl ?? '?'}`,
    );
  }
  lines.push('  -> npm run critic:status, or read critic/RUBRIC.md ("The loop")');
  return lines;
}
