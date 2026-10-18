/**
 * Fixtures for the pose gate's tests (pose continuity, W1; both games): a throwaway art folder of rectangle "figures" on transparent canvases, a registration table
 * for them, and a fake repository root (tables, KO scale, record) for the tests that run the CLI or `enforcePoseGate`. A rectangle is a figure the model can read
 * exactly: its alpha baseline, its stance and its height are the numbers the test names, so a failure here is a gate fault and never a painting's.
 *
 * The idle is 100 x 400 px on a 400 x 500 canvas (rows 50 to 449, ground line at 450). A pose's stature is its height over 400, so 370 px is 0.925 (in the
 * standing band) and 120 px is 0.30.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { runGate, type GateResult } from '../../../tools/pose-gate-lib.mjs';
import { proposeStatus } from '../../../tools/posescale/pose-bands.mjs';
import { loadModelInputs, readSubject, type ModelInputs, type ModelRow } from '../../../tools/posescale/pose-model.mjs';
import { rowFieldsFromReading } from '../../../tools/posescale/pose-rows.mjs';

export const ROOT = resolve(__dirname, '..', '..', '..');

export interface Fig {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** The idle's figure: 100 wide, rows 50 to 449. */
export const IDLE_FIG: Fig = { x0: 150, x1: 250, y0: 50, y1: 450 };
/** A pose 370 px tall on the same ground line: stature 0.925. */
export const TALL_FIG: Fig = { x0: 150, x1: 250, y0: 80, y1: 450 };
/** A pose 120 px tall on the same ground line: stature 0.30. */
export const TINY_FIG: Fig = { x0: 150, x1: 250, y0: 330, y1: 450 };
/** The idle's head box as fractions of its 400 x 500 painting: 100 x 50 px. */
export const IDLE_HEAD: [number, number, number, number] = [0.375, 0.1, 0.625, 0.2];
/** A head the same size in pixels, sitting at the top of the 120 px figure (so a "matched head": the head lock has nothing to fix). */
export const TINY_HEAD: [number, number, number, number] = [0.375, 0.66, 0.625, 0.76];

export const tempDir = (prefix: string): string => mkdtempSync(join(tmpdir(), prefix));

/**
 * Paint `characters/<subject>/<pose>.png`: a figure in the rectangle `fig` on a transparent W x H canvas, opaque all over its box except the top fifth of its height,
 * which is a head (the middle half of the width): so its alpha box, baseline and stance are the rectangle's and the numbers the tests name hold, and it is not a plain
 * rectangle, which the gate refuses as a `slab`. `rect: true` paints the plain rectangle. `tint` makes two files differ in bytes.
 */
export async function paint(art: string, subject: string, pose: string, fig: Fig, o: { W?: number; H?: number; tint?: number; rect?: boolean } = {}): Promise<string> {
  const W = o.W ?? 400;
  const H = o.H ?? 500;
  const dir = join(art, 'characters', subject);
  mkdirSync(dir, { recursive: true });
  const buf = Buffer.alloc(W * H * 4);
  const neck = fig.y0 + Math.round((fig.y1 - fig.y0) * 0.2);
  const shoulder = Math.round((fig.x1 - fig.x0) * 0.25);
  for (let y = fig.y0; y < fig.y1; y++) {
    for (let x = fig.x0; x < fig.x1; x++) {
      if (!o.rect && y < neck && (x < fig.x0 + shoulder || x >= fig.x1 - shoulder)) continue;
      const i = (y * W + x) * 4;
      buf[i] = 200;
      buf[i + 1] = 60 + (o.tint ?? 0);
      buf[i + 2] = 40;
      buf[i + 3] = 255;
    }
  }
  const file = join(dir, `${pose}.png`);
  await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png().toFile(file);
  return file;
}

export type Table = Record<string, Record<string, ModelRow>>;

/** The bare registration (stance and head, as `measure.py table` writes it before the install adds the status). */
export function bareTable(): Table {
  return {
    'zz-boss': {
      idle: { stanceX: 200, head: IDLE_HEAD },
      attack: { stanceX: 200, head: IDLE_HEAD },
    },
    'zz-tiny': {
      idle: { stanceX: 200, head: IDLE_HEAD },
      hurt: { stanceX: 200, head: TINY_HEAD },
    },
  };
}

/** A painted `zz-boss` (idle, attack at 0.925: in band) in an art folder. */
export async function paintBoss(art: string): Promise<void> {
  await paint(art, 'zz-boss', 'idle', IDLE_FIG);
  await paint(art, 'zz-boss', 'attack', TALL_FIG);
}

/** A painted `zz-tiny` (idle, hurt at stature 0.30 with a head the size of the idle's) in an art folder. */
export async function paintTiny(art: string): Promise<void> {
  await paint(art, 'zz-tiny', 'idle', IDLE_FIG);
  await paint(art, 'zz-tiny', 'hurt', TINY_FIG);
}

export const modelInputs = (art: string, table: Table): Promise<ModelInputs> =>
  loadModelInputs({ root: ROOT, artDir: art, table, tableSource: {}, koScale: {}, records: { subjects: {} } });

/**
 * What a fresh install would write: every painting of the subject read from its pixels, its row given the status the bands propose and the readings the
 * pixels give (`rowFieldsFromReading`), on top of the stance and head the table already had. `statuses` overrides a pose's status.
 */
export async function installedTable(art: string, bare: Table, subject = 'zz-boss', statuses: Record<string, ModelRow['status']> = {}): Promise<Table> {
  const inputs = await modelInputs(art, bare);
  const readings = await readSubject(inputs, subject);
  const out: Table = JSON.parse(JSON.stringify(bare));
  for (const r of readings) {
    const status = statuses[r.pose] ?? proposeStatus(r);
    out[subject] = { ...out[subject], [r.pose]: { ...(out[subject]?.[r.pose] ?? {}), ...rowFieldsFromReading(r, status) } };
  }
  return out;
}

/** A fake repository root the gate can load its tables from (the CLI and `enforcePoseGate` take `--root`): the four generated tables, the KO scale, the record and a decisions ledger that holds {@link BAILEY_WORDS}. */
export function fakeRoot(table: Table, o: { ledger?: object } = {}): string {
  const root = tempDir('pose-gate-root-');
  mkdirSync(join(root, 'src', 'data', 'art'), { recursive: true });
  mkdirSync(join(root, 'src', 'engine'), { recursive: true });
  mkdirSync(join(root, 'docs', 'target'), { recursive: true });
  const write = (f: string, name: string, value: unknown): void => {
    writeFileSync(join(root, 'src', 'data', 'art', f), `export const ${name} = ${JSON.stringify(value)};\n`);
  };
  write('poseRegistrationFfx.ts', 'POSE_REGISTRATION_FFX', {});
  write('poseRegistrationFfx2.ts', 'POSE_REGISTRATION_FFX2', {});
  write('poseRegistrationFoes.ts', 'POSE_REGISTRATION_FOES', table);
  write('poseRegistrationExp.ts', 'POSE_REGISTRATION_EXP', {});
  writeFileSync(join(root, 'src', 'engine', 'KoPoseScale.ts'), 'export const KO_POSE_SCALE = {};\n');
  writeFileSync(join(root, 'docs', 'target', 'pose-measure.json'), '{"subjects":{}}\n');
  writeFileSync(join(root, 'docs', 'target', 'decisions.json'), `${JSON.stringify({ decisions: [{ id: BAILEY_SOURCE, words: BAILEY_SAID }] })}\n`);
  if (o.ledger) writeFileSync(join(root, 'docs', 'target', 'pose-waivers.json'), `${JSON.stringify(o.ledger, null, 1)}\n`);
  return root;
}

/** What a fixture decision records Bailey as having said (the ledger's `words` of D-9990). */
export const BAILEY_SAID = 'pose continuity is the strongest recurring issue we need a permanent fix for this please.';
/** The decision the fixtures' waivers cite (`source`), and the decisions ledger as the gate loads it: id to his words. */
export const BAILEY_SOURCE = 'D-9990';
export const FIXTURE_DECISIONS = new Map<string, string>([[BAILEY_SOURCE, BAILEY_SAID]]);
/** Bailey's own words as the ratchet reads them: his name and a quoted sentence of his, which {@link BAILEY_SOURCE} records. */
export const BAILEY_WORDS = `Bailey, 2026-10-16: "${BAILEY_SAID}"`;

// ---- small helpers: the tsconfig has noUncheckedIndexedAccess, so a lookup that must exist says so

/** A value that must be there (an index into a list or a record the test has just built). */
export function must<T>(v: T | undefined | null, what: string): T {
  if (v === undefined || v === null) throw new Error(`fixture: missing ${what}`);
  return v;
}

/** `table[subject][pose]`, which must exist. */
export const rowOf = (t: Table, subject: string, pose: string): ModelRow => must(t[subject]?.[pose], `${subject}/${pose} row`);

/** A copy of the table with one row patched. */
export function withRow(t: Table, subject: string, pose: string, patch: Partial<ModelRow>): Table {
  const copy = JSON.parse(JSON.stringify(t)) as Table;
  copy[subject] = { ...(copy[subject] ?? {}), [pose]: { ...rowOf(t, subject, pose), ...patch } };
  return copy;
}

/** The table cut down to one subject. */
export const only = (t: Table, subject: string): Table => ({ [subject]: must(t[subject], `${subject} rows`) });

// ---- shared by the gate's repair tests (pose-gate-repair*.test.ts)

export const CANVAS_W = 400;
export const CANVAS_H = 500;

/** Paint several opaque rectangles as one painting (a figure and a prop). */
export async function paintRects(art: string, subject: string, pose: string, figs: Fig[], size: { W?: number; H?: number } = {}): Promise<void> {
  const w = size.W ?? CANVAS_W;
  const h = size.H ?? CANVAS_H;
  const dir = join(art, 'characters', subject);
  mkdirSync(dir, { recursive: true });
  const buf = Buffer.alloc(w * h * 4);
  for (const f of figs) {
    for (let y = f.y0; y < f.y1; y++) {
      for (let x = f.x0; x < f.x1; x++) {
        const i = (y * w + x) * 4;
        buf[i] = 200;
        buf[i + 1] = 60;
        buf[i + 2] = 40;
        buf[i + 3] = 255;
      }
    }
  }
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(join(dir, `${pose}.png`));
}

export const inputsFor = (art: string, table: Table, hires = false): Promise<ModelInputs> =>
  loadModelInputs({ root: ROOT, artDir: art, table, tableSource: {}, koScale: {}, records: { subjects: {} }, hires });
export const gateOf = async (art: string, table: Table, o: { subjects?: string[]; hires?: boolean } = {}): Promise<GateResult> =>
  runGate({ root: ROOT, inputs: await inputsFor(art, table, o.hires), ledger: null, subjects: o.subjects, concurrency: 1, decisions: FIXTURE_DECISIONS, pin: null });
export const codesOf = (r: GateResult, key: string): string[] => r.failures.filter((x) => `${x.subject}/${x.pose}` === key).map((x) => x.code);
export const flagsOf = (r: GateResult, key: string): string[] => must(r.entries.find((e) => e.key === key), `entry ${key}`).flags;
