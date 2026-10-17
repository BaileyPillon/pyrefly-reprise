/**
 * Which figures are drawn as a rig, and why not when they are not.
 *
 * A figure is drawn as a rig ({@link chooseRig}) when ALL of: the switch allows it ({@link rigSwitch}), `/art/rigs/<subject>/rig.json` loads and reads
 * (`RigData.readRig`), its `gate.status` is `ok`, its `costume.painting` is this figure's idle painting, and it is for this subject. Anything else is a reason, and
 * the stage builds the painting set exactly as it always has. The reason is logged once per subject (`[rig] kimahri on|off (reason)`) and kept for
 * `window.__pyrefly.rigs()` (`src/debug/rigApi.ts`).
 *
 * Where rigs live: dev serves `D:/pyrefly-art-rigs` at `/art/rigs/` (`tools/vite-rig-art.mjs`); a release build takes them from a release art mirror (TODO in
 * `docs/handoff/rig-engine.md`).
 *
 * **No request for a rig that is not there.** The art manifest lists the subjects that ship a rig (`ArtManifest.rigs`, written by `tools/gen/manifest.mjs`), and only
 * those are asked for: a 404 per figure on every battle would be a console error, and a build with no rigs must be silent. `?rig=on` (a person or a check saying "look
 * for it") asks anyway.
 */
import { artUrl } from '../PaintedArt.ts';
import { loadArtManifest } from '../ArtManifest.ts';
import { costumeMatches, gateProblem, readRig, type RigData } from './RigData.ts';
import type { RigActor, RigAsset } from './RigActor.ts';
import { validateFeet } from './RigValidate.ts';

export interface RigChoice {
  subject: string;
  on: boolean;
  /** The reason in the log line: `gate ok, 11 parts, 3 keys`, `no rig.json`, `switch off (?rig=off)`, ... */
  reason: string;
  asset?: RigAsset;
  /** Problems that do not stop the rig (the pipeline's gate is what blocks one): a planted key whose sole is off the floor row. Logged once as a warning. */
  warnings?: string[];
}

// -------------------------------------------------------------------- switch

/** `?rig=on|off` from a query string; null when absent or anything else. */
export function rigFromQuery(search: string): boolean | null {
  try {
    const v = new URLSearchParams(search).get('rig');
    return v === 'on' ? true : v === 'off' ? false : null;
  } catch {
    return null;
  }
}

/**
 * Whether rigs may be drawn at all: `?rig=on|off` first (it overrides the setting), then the hidden `fxRig` setting the stage is handed (`setting`; anything but an
 * explicit `false` is on), then on. `reason` says which decided.
 */
export function rigSwitch(setting?: () => boolean, search = globalThis.location?.search ?? ''): { on: boolean; reason: string } {
  const q = rigFromQuery(search);
  if (q !== null) return { on: q, reason: q ? '?rig=on' : '?rig=off' };
  if (setting && setting() === false) return { on: false, reason: 'the fxRig setting is off' };
  return { on: true, reason: 'default' };
}

// ---------------------------------------------------------------------- load

const reads = new Map<string, Promise<{ data: RigData } | { reason: string }>>();

/** The folder a subject's rig is in, as a URL (base-aware). */
export function rigBaseUrl(subject: string): string {
  return artUrl(`art/rigs/${subject}`);
}

async function readSubject(subject: string): Promise<{ data: RigData } | { reason: string }> {
  const url = `${rigBaseUrl(subject)}/rig.json`;
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-cache' });
  } catch {
    return { reason: 'no rig.json' };
  }
  if (!res.ok) return { reason: 'no rig.json' };
  let json: unknown;
  try {
    json = JSON.parse(await res.text()); // the dev server answers a missing file with index.html and a 200: that is not JSON
  } catch {
    return { reason: 'no rig.json' };
  }
  const read = readRig(json);
  return read.ok ? { data: read.data } : { reason: `invalid rig.json: ${read.reason}` };
}

/** Does the art manifest list a rig for this subject? A missing manifest, or one with no `rigs`, lists none. */
async function manifestLists(subject: string): Promise<boolean> {
  const m = await loadArtManifest();
  return m?.rigs?.includes(subject) === true;
}

/** Forget what was read (a dev reloading a rig it just changed). */
export function clearRigCache(): void {
  reads.clear();
  decided.clear();
}

const decided = new Map<string, RigChoice>();
const users = new Map<string, Set<string>>();
const live = new Map<string, RigActor>();

/**
 * Decide for one figure. `idleUrl` is the idle painting the stage resolved for it (the rig's costume must be that painting). Never rejects. Logs once per subject
 * and decision.
 */
export async function chooseRig(subject: string, idleUrl: string | undefined, sw: { on: boolean; reason: string }, dressphere = false, listed: (subject: string) => Promise<boolean> = manifestLists): Promise<RigChoice> {
  const done = (c: RigChoice): RigChoice => note(c);
  if (!sw.on) return done({ subject, on: false, reason: `switch off (${sw.reason})` });
  if (sw.reason !== '?rig=on' && !(await listed(subject))) return done({ subject, on: false, reason: 'no rig listed in the art manifest' });
  let got = reads.get(subject);
  if (!got) reads.set(subject, (got = readSubject(subject)));
  const r = await got;
  if ('reason' in r) return done({ subject, on: false, reason: r.reason });
  const { data } = r;
  const gate = gateProblem(data);
  if (gate) return done({ subject, on: false, reason: gate });
  if (data.name !== subject) return done({ subject, on: false, reason: `the rig is for "${data.name}"` });
  if (!idleUrl) return done({ subject, on: false, reason: 'no idle painting' });
  if (!costumeMatches(data, idleUrl)) return done({ subject, on: false, reason: `costume ${data.costume.painting} is not this figure's idle painting` });
  const warnings = validateFeet(data).map((i) => i.message);
  return done({
    subject,
    on: true,
    reason: `gate ok, ${data.parts.length} parts, ${data.bones.length} bones, ${data.keys.size} keys${warnings.length ? `, ${warnings.length} feet warning(s)` : ''}`,
    asset: { data, base: rigBaseUrl(subject), ...(dressphere ? { dressphere: true } : {}) },
    ...(warnings.length ? { warnings } : {}),
  });
}

/** Record a decision and log it the first time the subject (or its decision) is seen. */
function note(c: RigChoice): RigChoice {
  const before = decided.get(c.subject);
  decided.set(c.subject, c);
  if (!before || before.on !== c.on || before.reason !== c.reason) {
    console.info(`[rig] ${c.subject} ${c.on ? 'on' : 'off'} (${c.reason})`);
    for (const w of c.warnings ?? []) console.warn(`[rig] ${c.subject}: ${w}`);
  }
  return c;
}

/** A build that threw (a texture missing, a shader patch that no longer applies): the figure is the painting set, and the reason is on record. */
export function noteRigFailure(subject: string, why: string): RigChoice {
  const c: RigChoice = { subject, on: false, reason: `build failed: ${why}` };
  decided.set(subject, c);
  console.warn(`[rig] ${subject} off (${c.reason})`);
  return c;
}

// ------------------------------------------------------------------ registry

/** The stage tells the registry which combatant draws which subject, and the live actor, for `rigs()`. */
export function registerRigUse(subject: string, id: string, actor?: RigActor): void {
  let set = users.get(subject);
  if (!set) users.set(subject, (set = new Set()));
  set.add(id);
  if (actor) live.set(id, actor);
}

export function unregisterRigUse(id: string): void {
  live.delete(id);
}

export interface RigReportEntry {
  subject: string;
  on: boolean;
  reason: string;
  ids: string[];
  warnings?: string[];
  info?: ReturnType<RigActor['rigInfo']>;
}

/** What `window.__pyrefly.rigs()` returns: every subject decided so far, and who is using it. */
export function rigReport(): RigReportEntry[] {
  return [...decided.values()]
    .map((c) => {
      const ids = [...(users.get(c.subject) ?? [])].sort();
      const first = ids.map((id) => live.get(id)).find((a): a is RigActor => !!a);
      return { subject: c.subject, on: c.on, reason: c.reason, ids, ...(c.warnings ? { warnings: c.warnings } : {}), ...(first ? { info: first.rigInfo() } : {}) };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));
}
