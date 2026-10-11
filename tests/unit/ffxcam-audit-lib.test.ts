/**
 * **The tracking audit's arithmetic** (`tools/ffxcam-audit-lib.mjs`; FFX only): per-frame verdicts and lost stretches over synthetic records (rule 8: no retail data, no real program ids' content; the ids here
 * are the names the report keys on). The in-frame fractions themselves are `src/engine/ffxcam/framing.ts`'s (`tests/unit/ffxcam-framing.test.ts`); this file pins what the audit does with them.
 *
 * Pins: a frame is lost when no subject of its beat has 30 percent of its box on screen (29 is lost, 30 is not); while an action is open and its own shot runs the subjects are the actor and its
 * targets (an impact adds its target; the close, a turn start and the battle's start end the action); for the default views, the scenes, the victory and the defeat, and with nothing open, they are the party
 * and Evrae; a hidden figure (-1) is nobody; an action by a figure the record does not track (Cid) is judged by its targets, and with none left it gets no verdict; a frame lasts to the next frame (capped, so a pause is not time); lost stretches are runs of
 * consecutive lost frames and a gap in the record ends one; the net column is read when the row has it.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { DEFAULT_VIEW_PROGRAMS, SEEN_MIN, analyse, group, layout, openActions, programOfKey, stretches, type AuditBeat, type AuditRecord } from '../../tools/ffxcam-audit-lib.mjs';

const IDS = ['tidus', 'wakka', 'rikku', 'evrae'];
const DEFAULT = 'hiku15_00.w3.f3';
const SHOT = 'hiku15_00.w3.f9';

/** A frame row: the fractions of the four figures (in IDS order), at time `t` ms, in `program` (an index into `programs`) after `beat` (an index into the beats). */
function row(t: number, program: number, beat: number, fractions: number[], net?: number): number[] {
  const L = layout(IDS.length);
  const out = new Array<number>(net === undefined ? L.boxes + 6 * IDS.length : L.net + 1).fill(0);
  out[L.frame] = t / 16;
  out[L.t] = t;
  out[L.steps] = Math.floor(t / 33);
  out[L.prog] = program;
  out[L.beat] = beat;
  fractions.forEach((f, k) => (out[L.fr + 2 * k] = f));
  if (net !== undefined) out[L.net] = net;
  return out;
}

const beat = (name: string, actor: string | null, targets: string[] = []): AuditBeat => ({ beat: name, actor, targets });

function record(beats: AuditBeat[], frames: number[][]): AuditRecord {
  return { seed: 1, cfg: { ids: IDS }, programs: [DEFAULT, SHOT], beats, frames };
}

describe('the verdict of a frame', () => {
  const beats = [beat('actionOpen', 'tidus', ['evrae'])];

  it('an action\'s own shot is lost when neither the actor nor its target has 30 percent on screen', () => {
    const rec = record(beats, [row(0, 1, 0, [0.29, 1, 1, 0.1]), row(16, 1, 0, [0.3, 0, 0, 0]), row(32, 1, 0, [0, 0, 0, 0.3]), row(48, 1, 0, [0.2, 0, 0, 0.2])]);
    expect(analyse(rec).map((r) => r.lost)).toEqual([true, false, false, true]);
    expect(SEEN_MIN).toBe(0.3);
  });

  it('the other figures do not rescue an action\'s shot (the party and Evrae are not its subjects)', () => {
    const rec = record(beats, [row(0, 1, 0, [0, 1, 1, 0])]); // wakka and rikku are in frame, tidus and evrae are not
    expect(analyse(rec)[0]?.lost).toBe(true);
    expect(analyse(rec)[0]?.subjects).toEqual(['tidus', 'evrae']);
  });

  it('the default view is lost only when none of the party or Evrae is in frame', () => {
    const rec = record(beats, [row(0, 0, 0, [0, 0, 0, 0.5]), row(16, 0, 0, [0, 0, 0.3, 0]), row(32, 0, 0, [0, 0, 0, 0.2])]);
    expect(analyse(rec).map((r) => r.lost)).toEqual([false, false, true]);
    expect(analyse(rec)[0]?.rule).toBe('default');
    expect(DEFAULT_VIEW_PROGRAMS.has(DEFAULT)).toBe(true);
  });

  it('with no action open (a turn start) the default rule holds even for another program', () => {
    const rec = record([beat('turnStart', 'tidus')], [row(0, 1, 0, [0, 0, 0, 0.4])]);
    expect(analyse(rec)[0]?.rule).toBe('default');
    expect(analyse(rec)[0]?.lost).toBe(false);
  });

  it('a hidden figure (-1) is nobody; if nobody is left there is no verdict', () => {
    const hidden = record(beats, [row(0, 1, 0, [0, 1, 1, -1]), row(16, 1, 0, [-1, 1, 1, -1])]);
    const rows = analyse(hidden);
    expect(rows[0]?.subjects).toEqual(['tidus']);
    expect(rows[0]?.lost).toBe(true);
    expect(rows[1]?.best).toBeNull();
    expect(rows[1]?.lost).toBe(false);
  });

  it('an action by a figure the record does not track (Cid is never drawn) is judged by its targets', () => {
    const lostShot = record([beat('actionOpen', 'cid', ['evrae'])], [row(0, 1, 0, [0, 0, 0, 0.1])]);
    expect(analyse(lostShot)[0]?.subjects).toEqual(['evrae']);
    expect(analyse(lostShot)[0]?.lost).toBe(true);
    const keptShot = record([beat('actionOpen', 'cid', ['evrae'])], [row(0, 1, 0, [0, 0, 0, 0.5])]);
    expect(analyse(keptShot)[0]?.lost).toBe(false);
  });

  it('with no subject left at all (an untracked actor and no target) a frame gets no verdict', () => {
    const rec = record([beat('actionOpen', 'cid', [])], [row(0, 1, 0, [0, 0, 0, 0])]);
    expect(analyse(rec)[0]?.best).toBeNull();
    expect(analyse(rec)[0]?.lost).toBe(false);
  });

  it('the threshold can be moved', () => {
    const rec = record(beats, [row(0, 1, 0, [0.4, 0, 0, 0])]);
    expect(analyse(rec, '', 0.5)[0]?.lost).toBe(true);
    expect(analyse(rec, '', 0.3)[0]?.lost).toBe(false);
  });
});

describe('which action is open', () => {
  it('an impact adds its target; the close, a turn start and the start of the battle end the action', () => {
    const beats = [beat('battleStart', null), beat('turnStart', 'wakka'), beat('actionOpen', 'wakka', ['evrae']), beat('impact', 'wakka', ['tidus']), beat('actionClose', 'wakka'), beat('turnStart', 'rikku')];
    const opens = openActions(beats);
    expect(opens[0]).toBeNull();
    expect(opens[1]).toBeNull();
    expect(opens[2]).toEqual({ actor: 'wakka', targets: ['evrae'] });
    expect(opens[3]).toEqual({ actor: 'wakka', targets: ['evrae', 'tidus'] });
    expect(opens[4]).toBeNull();
    expect(opens[5]).toBeNull();
  });

  it('an impact with no open action opens nothing', () => {
    expect(openActions([beat('impact', 'wakka', ['evrae'])])).toEqual([null]);
  });
});

describe('time and stretches', () => {
  it('a frame lasts to the next one, capped at 100 ms, and the last is 16', () => {
    const rec = record([beat('actionOpen', 'tidus', ['evrae'])], [row(0, 1, 0, [0, 0, 0, 0]), row(16, 1, 0, [0, 0, 0, 0]), row(1000, 1, 0, [0, 0, 0, 0])]);
    expect(analyse(rec).map((r) => r.dt)).toEqual([16, 100, 16]);
  });

  it('a lost stretch is a run of consecutive lost frames; a found frame ends it; a long gap ends it too', () => {
    const lost = [0, 0, 0, 0];
    const found = [1, 0, 0, 0];
    const frames = [row(0, 1, 0, lost), row(16, 1, 0, lost), row(32, 1, 0, found), row(48, 1, 0, lost), row(64, 1, 0, lost), row(1000, 1, 0, lost), row(1016, 1, 0, lost)];
    const rows = analyse(record([beat('actionOpen', 'tidus', ['evrae'])], frames));
    const st = stretches(rows);
    expect(st.map((s) => Math.round(s.ms))).toEqual([32, 116, 32]); // the middle one's last frame is followed by the gap: it lasts the 100 ms cap
    expect(st[0]?.first.i).toBe(0);
    expect(st[1]?.first.i).toBe(3);
    expect(st[2]?.first.i).toBe(5);
  });

  it('totals and lost time per key', () => {
    const frames = [row(0, 1, 0, [0, 0, 0, 0]), row(16, 1, 0, [1, 0, 0, 0]), row(32, 0, 0, [0, 0, 0, 0]), row(48, 0, 0, [0, 0, 0, 1])];
    const rows = analyse(record([beat('actionOpen', 'tidus', ['evrae'])], frames));
    const byProgram = group(rows, (r) => r.program);
    expect(byProgram.get(SHOT)).toEqual({ total: 32, lost: 16, frames: 2 });
    expect(byProgram.get(DEFAULT)).toEqual({ total: 32, lost: 16, frames: 2 });
  });
});

describe('the net column and the key', () => {
  it('reads the net state when the row has the column, and 0 when it does not', () => {
    const rec = record([beat('actionOpen', 'tidus', ['evrae'])], [row(0, 1, 0, [1, 0, 0, 0], 2), row(16, 1, 0, [1, 0, 0, 0])]);
    expect(analyse(rec).map((r) => r.net)).toEqual([2, 0]);
  });

  it('a net key names its program in the second field', () => {
    expect(programOfKey('actionOpen:hiku15_00.w3.f9:tidus,evrae')).toBe('hiku15_00.w3.f9');
    expect(programOfKey('x')).toBe('-');
  });
});
