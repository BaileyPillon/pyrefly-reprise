/**
 * The experimental Leblanc chapter's pose registration table (`src/data/art/poseRegistrationExp.ts`), generated (branch `exp-leblanc`).
 *
 * Release 39's pose registration (`src/engine/PoseRegistration.ts`) gives every pose of a subject one head size and one stance, from
 * measured rows keyed by the art id. The experimental chapter's paintings have ids of their own (`exp-leblanc-yuna-gunner`), so they
 * need rows of their own, and the rows must describe THEIR pixels:
 *
 * - a pose that is still the placeholder (today's Chapter VI painting) gets that painting's measured row, copied from its base
 *   subject (and, for a KO the registration leaves to the KO table, `KoPoseScale.ts`'s value, so the copy draws exactly as Chapter VI);
 * - a pose with new art installed (`tools/exp-install.mjs install`) gets the row measured off the new painting, recorded in
 *   `docs/target/exp-leblanc/installed.json`, never the base subject's (a new painting is not the old one's size or stance).
 *
 * Pure but for the reads in {@link loadBaseTables}; the CLI that writes the file is `exp-install.mjs table`.
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { NAMESPACE, REPO, nsId } from './exp-art-lib.mjs';

/** The base registration rows and the KO table, as the engine reads them. */
export async function loadBaseTables() {
  const url = (p) => pathToFileURL(join(REPO, p)).href;
  // The three generated base tables, not `PoseRegistration.ts` (which includes this very table: it would not load before it exists).
  const { POSE_REGISTRATION_FFX } = await import(url('src/data/art/poseRegistrationFfx.ts'));
  const { POSE_REGISTRATION_FFX2 } = await import(url('src/data/art/poseRegistrationFfx2.ts'));
  const { POSE_REGISTRATION_FOES } = await import(url('src/data/art/poseRegistrationFoes.ts'));
  const { KO_POSE_SCALE } = await import(url('src/engine/KoPoseScale.ts'));
  return { registration: { ...POSE_REGISTRATION_FFX, ...POSE_REGISTRATION_FFX2, ...POSE_REGISTRATION_FOES }, ko: KO_POSE_SCALE };
}

/** A row without the keys the engine does not read, in the engine's key order. */
function cleanRow(row) {
  const out = {};
  for (const k of ['scale', 'stanceX', 'feetRow']) if (typeof row[k] === 'number') out[k] = row[k];
  if (row.upright === true) out.upright = true;
  return out;
}

/**
 * The table for `subjects` (base ids): `{ 'exp-leblanc-<subject>': { <pose>: row } }`.
 *
 * `installed` is `docs/target/exp-leblanc/installed.json`: `{ <subject>: { <pose>: { row: {...}, baselineY, ... } } }`; a pose listed there takes
 * its measured `row`. Every other pose of a subject takes the base row (and a KO the base leaves to the KO table takes that table's value as an
 * explicit `scale`).
 *
 * **A placeholder pose beside a new idle is rescaled.** The engine sizes every pose of a figure from the IDLE's pixel scale (world height over the
 * idle's `baselineY`) times the pose's `scale`. A new idle is a different number of pixels tall than the old one, so each pose that is still the old
 * painting must carry `scale x (new idle's baselineY / old idle's baselineY)`, or it would be drawn that much larger or smaller than the idle
 * beside it; `opts.readSidecar(subject, pose)` gives the old sidecars (their `scale`, the old idle's `baselineY`), `opts.statesOf(subject)` every pose
 * the old subject has. Without a new idle the ratio is 1 and the rows are the base rows exactly.
 */
export function buildExpRegistration({ registration, ko }, subjects, installed = {}, opts = {}) {
  const table = {};
  const readSidecar = opts.readSidecar ?? (() => null);
  const statesOf = opts.statesOf ?? (() => []);
  for (const subject of [...subjects].sort()) {
    const base = registration[subject] ?? {};
    const mine = installed[subject] ?? {};
    const newIdle = mine.idle?.baselineY;
    const oldIdle = readSidecar(subject, 'idle')?.baselineY;
    const ratio = typeof newIdle === 'number' && typeof oldIdle === 'number' && oldIdle > 0 ? newIdle / oldIdle : 1;
    const rows = {};
    for (const pose of new Set([...Object.keys(base), ...(ratio !== 1 ? statesOf(subject) : [])])) {
      if (mine[pose]?.row) continue; // measured off the new painting below
      const row = cleanRow(base[pose] ?? {});
      if (pose === 'ko' && ko[subject] !== undefined && typeof row.scale !== 'number') row.scale = ko[subject];
      if (ratio !== 1 && pose !== 'idle') {
        const was = typeof row.scale === 'number' ? row.scale : (readSidecar(subject, pose)?.scale > 0 ? readSidecar(subject, pose).scale : 1);
        row.scale = Math.round(was * ratio * 10000) / 10000;
      }
      if (Object.keys(row).length) rows[pose] = row;
    }
    for (const [pose, rec] of Object.entries(mine)) if (rec?.row) rows[pose] = cleanRow(rec.row);
    if (Object.keys(rows).length) table[nsId(subject)] = Object.fromEntries(Object.entries(rows).sort(([a], [b]) => a.localeCompare(b)));
  }
  return table;
}

/**
 * The idle metrics of every subject in the namespace, for the surfaces that draw a figure outside the stage (the story scenes, `cutsceneFigures.ts`):
 * `{ 'exp-leblanc-<subject>': { width, height, baselineY, facing } }`, read off the namespace's own idle sidecars (a placeholder carries the base
 * painting's numbers, a new idle its own). `readIdle(subject)` gives the sidecar or null.
 */
export function buildExpFigureMetrics(subjects, readIdle) {
  const out = {};
  for (const subject of [...subjects].sort()) {
    const s = readIdle(subject);
    if (!s || !(s.width > 0) || !(s.height > 0) || !(s.baselineY > 0)) continue;
    out[nsId(subject)] = { width: s.width, height: s.height, baselineY: s.baselineY, facing: ['right', 'left', 'front'].includes(s.facing) ? s.facing : 'auto' };
  }
  return out;
}

/** The TypeScript source of {@link buildExpFigureMetrics}'s table (`src/data/art/expFigureMetrics.ts`). */
export function renderExpFigureMetrics(table) {
  const lines = [
    `/**`,
    ` * Generated by \`node tools/exp-install.mjs table\` from the namespace's idle sidecars; do not edit by hand.`,
    ` * The experimental Leblanc chapter's figures, as the surfaces outside the stage need them (art namespace \`${NAMESPACE}\`, \`src/data/art/artNamespace.ts\`):`,
    ` * each idle's size, where its feet are, and which way the painting faces (\`tools/exp-art-table.mjs\`).`,
    ` */`,
    'export interface ExpFigureMetrics {',
    '  readonly width: number;',
    '  readonly height: number;',
    '  /** The row of the soles, in the painting\'s own pixels. */',
    '  readonly baselineY: number;',
    '  /** The way the painting faces (the sidecar\'s `facing`); `auto` when it says nothing. */',
    "  readonly facing: 'right' | 'left' | 'front' | 'auto';",
    '}',
    '',
    'export const EXP_FIGURE_METRICS: Readonly<Record<string, ExpFigureMetrics>> = {',
  ];
  for (const [id, m] of Object.entries(table)) lines.push(`  '${id}': { width: ${m.width}, height: ${m.height}, baselineY: ${m.baselineY}, facing: '${m.facing}' },`);
  lines.push('};', '');
  return lines.join('\n');
}

const q = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
const rowText = (row) => `{ ${Object.entries(row).map(([k, v]) => `${k}: ${typeof v === 'number' ? (Number.isInteger(v) ? `${v}.0` : v) : v}`).join(', ')} }`;

/** The TypeScript source of the table (a stable, diff-friendly layout like the generated base tables). */
export function renderExpRegistration(table) {
  const lines = [
    "import type { PoseRegistrationTable } from './poseRegistrationTypes.ts';",
    '',
    `/**`,
    ` * Generated by \`node tools/exp-install.mjs table\` from \`docs/target/exp-leblanc/installed.json\` and the base tables; do not edit by hand.`,
    ` * The experimental Leblanc chapter's rows (art namespace \`${NAMESPACE}\`, \`src/data/art/artNamespace.ts\`): a placeholder pose carries its base`,
    ` * subject's measured row, a pose with new art installed carries the row measured off the new painting (\`tools/exp-art-table.mjs\`).`,
    ` */`,
    'export const POSE_REGISTRATION_EXP: PoseRegistrationTable = {',
  ];
  for (const [subject, poses] of Object.entries(table)) {
    lines.push(`  ${q(subject)}: {`);
    for (const [pose, row] of Object.entries(poses)) lines.push(`    ${q(pose)}: ${rowText(row)},`);
    lines.push('  },');
  }
  lines.push('};', '');
  return lines.join('\n');
}
