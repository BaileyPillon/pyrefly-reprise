/**
 * The arithmetic of the FFX camera tracking audit (`tools/ffxcam-audit.mjs` records, `tools/ffxcam-audit-report.mjs` prints; FFX only): from one record, a verdict per frame, and from the verdicts the lost
 * stretches and the tables. Pure functions over plain data, so `tests/unit/ffxcam-audit-lib.test.ts` can run them on synthetic records.
 *
 * **Loses track** (the brief): a frame loses track when none of the subjects of its beat is in frame, where in frame means at least {@link SEEN_MIN} (30 percent) of the figure's box is on screen
 * (`src/engine/ffxcam/framing.ts`; the fractions are in the record). The subjects of a frame (`src/engine/ffxcam/shotSubjects.ts` reads them the same way):
 *
 * - while an action is open and a shot of its own is running: the actor and its targets (the targets of the opening, plus the target of every impact);
 * - for the default views (Enter, Select, Normal), the airship scenes, the victory and the defeat, and whenever no action is open: the party and Evrae; the frame loses track only when none of them is in frame.
 *
 * A figure that is not on screen at all because it is hidden (Evrae faded out in a range shift) is no subject, and neither is one the record does not track (Cid, who is never drawn: his shots are judged by
 * their targets, and with no subject left a frame gets no verdict). A frame's time is the virtual time to the next frame (16 ms, capped at 100 so a pause in the record is not counted).
 *
 * Game case: FFX only.
 */

/** A figure is in frame when at least this fraction of its box is on screen (the value of `SEEN_MIN` in `framing.ts`). */
export const SEEN_MIN = 0.3;

/** The tracked figures of the first records (later ones say their own in `cfg.ids`). */
export const DEFAULT_IDS = ['tidus', 'wakka', 'rikku', 'evrae'];

/** The programs that are views of the whole fight: the default view, the airship scenes, the victory and the defeat (ids of Bailey's local transcription). */
export const DEFAULT_VIEW_PROGRAMS = new Set(['hiku15_00.w3.f3', 'hiku15_00.w3.f10', 'system_01.w1.f31', 'system_01.w1.f5']);

/** A second reading beside "in frame": the best-placed subject takes less than this fraction of the picture's height (a speck). Not part of the verdict. */
export const SPECK_HEIGHT = 0.04;

/** A gap in the record longer than this (a scene swapped, a pause) ends a lost stretch. */
export const GAP_MS = 400;

/**
 * Column indices of a frame row (`ffxcam-audit-page.mjs`): five fixed, then a fraction and an apparent height per tracked figure, then eye, look-at, roll, field of view, six numbers of box per figure, the net's
 * state (0 idle, 1 blending in, 2 holding, 3 blending out) and the airship's range (1 far); then, in records made since the phone fix, the **window reading** (a fraction per figure, through the three.js camera,
 * of what the viewport shows) and the window's four edges (x0, x1, y0, y1 in the canvas's normalised device coordinates: a phone's slide shows in them).
 */
export const layout = (n) => ({ frame: 0, t: 1, steps: 2, prog: 3, beat: 4, fr: 5, eye: 5 + 2 * n, ref: 8 + 2 * n, roll: 11 + 2 * n, fov: 12 + 2 * n, boxes: 13 + 2 * n, net: 13 + 8 * n, range: 14 + 8 * n, win: 15 + 8 * n, rect: 15 + 9 * n });

/**
 * Which reading of "in frame" a verdict uses. `net` is the one the game's safety net judges by (`framing.ts`, asked for the window's shape: the picture centred on the camera's axis); `window` is what the player
 * sees, through the camera's own matrices and the part of the canvas inside the viewport, a phone's slide included. They agree on any window the render fills. `auto` is `window` when the record has it.
 */
export const READINGS = ['auto', 'net', 'window'];

/** The open action (actor and targets) after each beat of the record. */
export function openActions(beats) {
  const out = [];
  let open = null;
  for (const b of beats) {
    if (b.beat === 'actionOpen' || b.beat === 'overdriveStart') open = { actor: b.actor, targets: [...b.targets] };
    else if (b.beat === 'impact' && open) {
      for (const t of b.targets) if (!open.targets.includes(t)) open.targets.push(t);
    } else if (b.beat === 'actionClose' || b.beat === 'turnStart' || b.beat === 'battleStart' || b.beat === 'victory') open = null;
    out.push(open ? { actor: open.actor, targets: [...open.targets] } : null);
  }
  return out;
}

/**
 * One record into per-frame verdicts. `reading` (see {@link READINGS}) picks which fraction a verdict uses; a record made before the window columns existed has only the net's reading and answers with it.
 * Every row says which one it used (`reading`) and carries Evrae's fraction (`evrae`, null when the record does not track him or he is hidden), for the report's "is the boss on screen" line.
 */
export function analyse(rec, file = '', seen = SEEN_MIN, reading = 'auto') {
  const IDS = rec.cfg?.ids ?? DEFAULT_IDS;
  const whole = rec.cfg?.wholeFight ? new Set(rec.cfg.wholeFight) : DEFAULT_VIEW_PROGRAMS; // the table camera's record names its own whole-fight shots
  const C = layout(IDS.length);
  const opens = openActions(rec.beats);
  const frames = rec.frames;
  const useWindow = reading !== 'net' && frames.length > 0 && frames[0].length >= C.rect + 4;
  const bossAt = IDS.indexOf('evrae');
  const rows = [];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const next = frames[i + 1];
    const dt = next ? Math.min(next[C.t] - f[C.t], 100) : 16;
    const beat = rec.beats[f[C.beat]] ?? null;
    const program = rec.programs[f[C.prog]] ?? '-';
    const open = opens[f[C.beat]] ?? null;
    const frac = {};
    const app = {};
    IDS.forEach((id, k) => {
      frac[id] = useWindow ? f[C.win + k] : f[C.fr + 2 * k];
      app[id] = f[C.fr + 2 * k + 1];
    });
    const defaultRule = !open || whole.has(program);
    const asked = defaultRule ? IDS : [open.actor, ...open.targets];
    const subjects = asked.filter((id) => IDS.includes(id) && frac[id] >= 0);
    const best = subjects.length ? Math.max(...subjects.map((id) => frac[id])) : null;
    const bestApp = subjects.length ? Math.max(...subjects.map((id) => (frac[id] >= seen ? app[id] : 0))) : null;
    rows.push({ i, t: f[C.t], dt, step: f[C.steps], program, beat: beat ? beat.beat : 'none', beatIndex: f[C.beat], rule: defaultRule ? 'default' : 'action', subjects, best, bestApp, lost: best !== null && best < seen, speck: best !== null && best >= seen && bestApp !== null && bestApp < SPECK_HEIGHT, net: C.net < f.length ? f[C.net] : 0, far: C.range < f.length ? f[C.range] === 1 : null, reading: useWindow ? 'window' : 'net', evrae: bossAt >= 0 && frac.evrae >= 0 ? frac.evrae : null, file });
  }
  return rows;
}

/** Lost stretches: runs of consecutive lost frames. */
export function stretches(rows) {
  const out = [];
  let cur = null;
  for (const r of rows) {
    if (r.lost && cur && r.t - cur.lastT <= GAP_MS) {
      cur.ms += r.dt;
      cur.lastT = r.t;
      cur.last = r;
      cur.programs.add(r.program);
    } else if (r.lost) {
      cur = { first: r, last: r, ms: r.dt, lastT: r.t, programs: new Set([r.program]) };
      out.push(cur);
    } else cur = null;
  }
  return out;
}

/** Totals and lost time per key. */
export function group(rows, keyOf) {
  const m = new Map();
  for (const r of rows) {
    const k = keyOf(r);
    const e = m.get(k) ?? { total: 0, lost: 0, frames: 0 };
    e.total += r.dt;
    e.frames++;
    if (r.lost) e.lost += r.dt;
    m.set(k, e);
  }
  return m;
}

/** The program a net event's key names: keys are `<beat>:<program>:<subjects>`. */
export const programOfKey = (key) => key.split(':')[1] ?? '-';
