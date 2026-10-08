/**
 * The FFX voice pass, planned and (against a loopback server, never ElevenLabs) generated.
 *
 * Pins who is recorded (Tidus, Yuna, Auron in FFX chapters, nobody else), what is left out and why, the credit estimate, the safety
 * gates of a live run (both flags, the cap, the loopback-only key, files outside the repo) and the shape of the request, with a mock
 * server standing in for the service. No key of Bailey's is read and no network call leaves the machine. Game case: FFX only.
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// @ts-expect-error -- the audio tooling is plain .mjs with no declarations.
import * as V from '../../tools/audio/voice-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = JSON.parse(readFileSync(path.join(ROOT, 'docs/audio/voice-line-inventory.json'), 'utf8')) as { lines: Array<Record<string, unknown> & { id: string; game: string; voice: string; kind: string; order: number; text: string; chars: number; chapter: string; speaker: string; voiced: string }> };

describe('who is recorded', () => {
  const selected = V.selectLines(doc) as typeof doc.lines;

  it('is Tidus, Yuna and Auron in FFX chapters, and nobody else', () => {
    expect(new Set(selected.map((l) => l.voice))).toEqual(new Set(['tidus', 'yuna', 'auron']));
    expect(new Set(selected.map((l) => l.speaker))).toEqual(new Set(['tidus', 'yuna', 'auron']));
    expect(selected.every((l) => l.game === 'ffx')).toBe(true);
  });

  it('never includes FFX-2 Yuna, the narrator, the younger Auron, or an FFX-2 chapter\'s Auron (Bailey\'s scope, rule 14)', () => {
    const ids = selected.map((l) => l.speaker);
    expect(ids).not.toContain('yuna-x2');
    expect(ids).not.toContain('narrator');
    expect(ids).not.toContain('young-auron');
    expect(selected.some((l) => l.chapter.startsWith('ffx2-'))).toBe(false);
    for (const l of doc.lines.filter((x) => x.game === 'ffx2')) expect(selected.includes(l)).toBe(false);
  });

  it('leaves out the victory quips the game can never show (only the first line of a bank is served)', () => {
    const quips = selected.filter((l) => l.kind === 'quip');
    expect(quips.length).toBeGreaterThan(0);
    expect(quips.every((q) => q.order === 1)).toBe(true);
    const all = V.selectLines(doc, { includeUnservedQuips: true }) as typeof selected;
    expect(all.length - selected.length).toBe(doc.lines.filter((l) => l.game === 'ffx' && l.kind === 'quip' && l.order > 1 && ['tidus', 'yuna', 'auron'].includes(l.voice) && l.voiced === 'yes').length);
  });

  it('includes the stand-in lines these voices say when a benched speaker\'s place is taken', () => {
    expect(selected.filter((l) => l.kind === 'fallback').length).toBeGreaterThan(0);
  });

  it('records a repeated line once, and every line finds its recording', () => {
    const { recordings, recordingOf } = V.planRecordings(selected) as { recordings: typeof selected; recordingOf: Map<string, string> };
    expect(recordings.length).toBeLessThan(selected.length);
    const byId = new Map(recordings.map((r) => [r.id, r]));
    for (const l of selected) {
      const r = byId.get(recordingOf.get(l.id) as string);
      expect(r, l.id).toBeDefined();
      expect(r?.voice).toBe(l.voice);
      expect(r?.text).toBe(l.text);
    }
    expect(new Set(recordings.map((r) => `${r.voice}\u0000${r.text}`)).size).toBe(recordings.length);
  });

  it('prices the pass at its recorded characters: one credit a character on eleven_v4, a few hundred cents at most', () => {
    const { recordings } = V.planRecordings(selected) as { recordings: typeof selected };
    const chars = recordings.reduce((a, r) => a + r.chars, 0);
    expect(chars).toBeGreaterThan(4000);
    expect(chars).toBeLessThan(7000);
  });

  it('gives each line a fixed seed, a retake a different one', () => {
    const line = selected[0] as Record<string, unknown>;
    expect(V.seedFor(line)).toBe(V.seedFor(line));
    expect(V.seedFor(line, 2)).toBe((V.seedFor(line, 1) + 1) % 4294967296);
    expect(V.seedFor(line)).toBeLessThan(4294967296);
  });

  it('names takes and picks them', () => {
    expect(V.takeFile('/out', 'a.b.001', 1)).toBe(path.join('/out', 'a.b.001.mp3'));
    expect(V.takeFile('/out', 'a.b.001', 3)).toBe(path.join('/out', 'a.b.001.take3.mp3'));
    expect(V.pickedTake({ 'a.b.001': 2 }, 'a.b.001')).toBe(2);
    expect(V.pickedTake({}, 'a.b.001')).toBe(1);
    expect(V.pickedTake({ x: 'two' }, 'x')).toBe(1);
  });

  it('gives a line its scene neighbours, whoever speaks them, and a quip none', () => {
    const line = selected.find((l) => l.id === 'seymour-flux.post.008') as (typeof selected)[number];
    const n = V.neighbours(doc, line) as { previous?: string; next?: string };
    expect(n.previous).toBeTruthy();
    expect(n.next).toBeTruthy();
    const quip = selected.find((l) => l.kind === 'quip') as (typeof selected)[number];
    expect(V.neighbours(doc, quip)).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// The command line, dry and against a loopback server
// ---------------------------------------------------------------------------

interface Result { code: number; stdout: string; stderr: string }
const run = (args: string[], env: Record<string, string> = {}): Promise<Result> =>
  new Promise((resolve) => {
    execFile(process.execPath, [path.join(ROOT, 'tools/audio/voice-generate.mjs'), ...args], { cwd: ROOT, env: { ...process.env, ...env }, maxBuffer: 16 << 20 }, (err, stdout, stderr) => {
      resolve({ code: err ? ((err as NodeJS.ErrnoException & { code?: number }).code as unknown as number) || 1 : 0, stdout, stderr });
    });
  });

interface Seen { url: string; headers: http.IncomingHttpHeaders; body: Record<string, unknown> }
let server: http.Server;
let seen: Seen[] = [];
let failOnRequest = 0;
let base = '';
let home = '';
const tmp: string[] = [];
const mkTmp = (): string => { const d = mkdtempSync(path.join(os.tmpdir(), 'voice-gen-test-')); tmp.push(d); return d; };

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      seen.push({ url: req.url ?? '', headers: req.headers, body: JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') });
      if (failOnRequest && seen.length === failOnRequest) { res.writeHead(500); res.end('boom'); return; }
      res.writeHead(200, { 'content-type': 'audio/mpeg', 'request-id': `req-${seen.length}` });
      res.end(Buffer.alloc(2500, 7));
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  home = mkTmp();
  writeFileSync(path.join(home, 'key.txt'), 'dummy-key-for-the-loopback-only\n');
  writeFileSync(path.join(home, 'voices.json'), JSON.stringify({ tidus: { B: 'vid-tidus' }, yuna: { B: 'vid-yuna' }, auron: { B: 'vid-auron' }, _picked: { tidus: 'B', yuna: 'B', auron: 'B' } }));
});
afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
  for (const d of tmp) rmSync(d, { recursive: true, force: true });
});

const live = (out: string, extra: string[] = []) => run(['--out', out, ...extra], { ELEVENLABS_HOME: home, ELEVENLABS_API_BASE: base });

describe('a dry run', () => {
  it('prints the plan and the commands, reads no key and sends nothing', async () => {
    const empty = mkTmp(); // no key.txt and no voices.json here: a dry run must not need either
    seen = [];
    const r = await run([], { ELEVENLABS_HOME: empty, ELEVENLABS_API_BASE: base });
    expect(r.code).toBe(0);
    expect(r.stdout).toContain('DRY RUN: nothing was sent and no key was read');
    expect(r.stdout).toMatch(/\d+ lines -> \d+ recordings/);
    expect(r.stdout).toContain('--yes --max-credits');
    expect(seen).toEqual([]);
  }, 30_000);

  it('lists every recording with --list, and only these three voices', async () => {
    const r = await run(['--list'], { ELEVENLABS_HOME: mkTmp() });
    const rows = r.stdout.split('\n').filter((l) => /^\s+(HAVE )?\w[\w.-]+\.(pre|post|mid|quip)/.test(l));
    expect(rows.length).toBeGreaterThan(150);
    expect(rows.every((l) => /\s(tidus|yuna|auron)\s/.test(l))).toBe(true);
  }, 30_000);

  it('the committed plan document is the tool\'s own output (it cannot go stale unnoticed)', async () => {
    const out = path.join(mkTmp(), 'plan.md');
    const r = await run(['--plan-md', out], { ELEVENLABS_HOME: 'D:/Tools/elevenlabs' }); // the commands in the plan name the default folder
    expect(r.code).toBe(0);
    const fresh = readFileSync(out, 'utf8').replace(/\r\n/g, '\n');
    const committed = readFileSync(path.join(ROOT, 'docs/audio/voice-ffx-plan.md'), 'utf8').replace(/\r\n/g, '\n');
    expect(fresh).toBe(committed);
  }, 30_000);
});

describe('what a live run refuses', () => {
  it('needs --max-credits, and refuses a batch whose estimate is over it before anything is sent', async () => {
    seen = [];
    const out = path.join(mkTmp(), 'o');
    const noCap = await live(out, ['--limit', '3', '--yes']);
    expect(noCap.code).not.toBe(0);
    expect(noCap.stderr).toContain('--max-credits');
    const tooSmall = await live(out, ['--limit', '3', '--yes', '--max-credits', '5']);
    expect(tooSmall.code).not.toBe(0);
    expect(tooSmall.stderr).toContain('over the cap of 5');
    expect(seen).toEqual([]);
    expect(existsSync(out)).toBe(false);
  }, 60_000);

  it('does nothing without --yes even with a cap', async () => {
    seen = [];
    const r = await live(path.join(mkTmp(), 'o'), ['--limit', '3', '--max-credits', '500']);
    expect(r.stdout).toContain('DRY RUN');
    expect(seen).toEqual([]);
  }, 30_000);

  it('sends the key only to a loopback server', async () => {
    seen = [];
    const r = await run(['--out', path.join(mkTmp(), 'o'), '--limit', '1', '--yes', '--max-credits', '200'], { ELEVENLABS_HOME: home, ELEVENLABS_API_BASE: 'https://api.example.com' });
    expect(r.code).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain('loopback');
    expect(seen).toEqual([]);
  }, 30_000);

  it('keeps candidates out of the repo and out of public/', async () => {
    const inRepo = await live(path.join(ROOT, 'tmp-voice-candidates'), ['--limit', '1', '--yes', '--max-credits', '200']);
    expect(inRepo.code).not.toBe(0);
    expect(inRepo.stderr).toContain('outside the repo');
    const inPublic = await live(path.join(ROOT, 'public', 'audio', 'x'), ['--limit', '1']);
    expect(inPublic.code).not.toBe(0);
  }, 30_000);

  it('records only the three picked voices, and only lines of this pass', async () => {
    const lulu = await run(['--speaker', 'lulu'], { ELEVENLABS_HOME: mkTmp() });
    expect(lulu.code).not.toBe(0);
    expect(lulu.stderr).toContain('not picked yet');
    const unknown = await run(['--ids', 'nobody.pre.001'], { ELEVENLABS_HOME: mkTmp() });
    expect(unknown.code).not.toBe(0);
    expect(unknown.stderr).toContain('not a recording in this pass');
  }, 30_000);
});

describe('a live run against the loopback server', () => {
  it('sends one request per recording to the picked voice, with the right body, and writes the file and its sidecar', async () => {
    seen = [];
    const out = path.join(mkTmp(), 'o');
    const r = await live(out, ['--limit', '4', '--yes', '--max-credits', '500']);
    expect(r.code, r.stderr).toBe(0);
    expect(seen).toHaveLength(4);
    for (const s of seen) {
      expect(s.url).toMatch(/^\/v1\/text-to-speech\/vid-(tidus|yuna|auron)\?output_format=mp3_44100_128$/);
      expect(s.headers['xi-api-key']).toBe('dummy-key-for-the-loopback-only');
      expect(s.body['model_id']).toBe('eleven_v4');
      expect(typeof s.body['text']).toBe('string');
      expect(Number.isInteger(s.body['seed'])).toBe(true);
      expect(s.body).not.toHaveProperty('previous_text');
      expect(s.body).not.toHaveProperty('next_text');
      expect(JSON.stringify(s.body)).not.toContain('dummy-key'); // the key travels in a header and nowhere else
    }
    const files = readdirSync(out).sort();
    expect(files.filter((f) => f.endsWith('.mp3'))).toHaveLength(4);
    expect(files.filter((f) => f.endsWith('.json'))).toHaveLength(4);
    const first = files.find((f) => f.endsWith('.json')) as string;
    const side = JSON.parse(readFileSync(path.join(out, first), 'utf8'));
    expect(side).toMatchObject({ take: 1, model: 'eleven_v4', option: 'B', stitched: false });
    expect(side.sha256).toMatch(/^[0-9a-f]{64}$/);
    const log = readFileSync(path.join(home, 'usage.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(log.filter((e) => e.mode === 'voice-ffx' && e.status === 'ok').length).toBeGreaterThanOrEqual(4);
    expect(r.stdout).not.toContain('vid-tidus'); // voice ids are never printed
  }, 60_000);

  it('--no-seed sends no seed (the comparison Bailey heard sent none)', async () => {
    seen = [];
    const r = await live(path.join(mkTmp(), 'o'), ['--limit', '1', '--no-seed', '--yes', '--max-credits', '200']);
    expect(r.code, r.stderr).toBe(0);
    expect(seen).toHaveLength(1);
    expect(seen[0]?.body).not.toHaveProperty('seed');
  }, 30_000);

  it('skips what is already on disk, so a rerun costs nothing', async () => {
    seen = [];
    const out = path.join(mkTmp(), 'o');
    await live(out, ['--limit', '3', '--yes', '--max-credits', '500']);
    const before = seen.length;
    const again = await live(out, ['--limit', '3', '--yes', '--max-credits', '500']);
    expect(again.code).toBe(0);
    expect(again.stdout).toContain('0 to send');
    expect(seen).toHaveLength(before);
  }, 60_000);

  it('a retake keeps take 1, uses a new seed, and may carry audio tags and the scene around the line', async () => {
    seen = [];
    const out = path.join(mkTmp(), 'o');
    const id = 'seymour-flux.post.008';
    await live(out, ['--ids', id, '--yes', '--max-credits', '200']);
    const first = seen[0] as Seen;
    seen = [];
    const r = await live(out, ['--ids', id, '--take', '2', '--tags', '--stitch', '--yes', '--max-credits', '200']);
    expect(r.code, r.stderr).toBe(0);
    expect(existsSync(path.join(out, `${id}.mp3`))).toBe(true);
    expect(existsSync(path.join(out, `${id}.take2.mp3`))).toBe(true);
    const retake = seen[0] as Seen;
    expect(retake.body['seed']).toBe((first.body['seed'] as number) + 1);
    expect(typeof retake.body['previous_text']).toBe('string');
    expect(typeof retake.body['next_text']).toBe('string');
  }, 60_000);

  it('stops at the first failure and says how to carry on; the rerun sends only what is missing', async () => {
    seen = [];
    failOnRequest = 2;
    const out = path.join(mkTmp(), 'o');
    const broken = await live(out, ['--limit', '4', '--yes', '--max-credits', '500']);
    failOnRequest = 0;
    expect(broken.code).not.toBe(0);
    expect(broken.stderr).toContain('stopped after 1 recordings');
    expect(readdirSync(out).filter((f) => f.endsWith('.mp3'))).toHaveLength(1);
    seen = [];
    const resumed = await live(out, ['--limit', '4', '--yes', '--max-credits', '500']);
    expect(resumed.code, resumed.stderr).toBe(0);
    expect(seen).toHaveLength(3);
    expect(readdirSync(out).filter((f) => f.endsWith('.mp3'))).toHaveLength(4);
  }, 60_000);

  it('rejects a response that is not audio', async () => {
    // a 2500-byte body is audio-sized; the guard is for an empty or error body that came back with a 200
    const tiny = http.createServer((_req, res) => { res.writeHead(200); res.end('{"detail":"nope"}'); });
    await new Promise<void>((r) => tiny.listen(0, '127.0.0.1', r));
    const url = `http://127.0.0.1:${(tiny.address() as AddressInfo).port}`;
    mkdirSync(home, { recursive: true });
    const out = path.join(mkTmp(), 'o');
    const r = await run(['--out', out, '--limit', '1', '--yes', '--max-credits', '200'], { ELEVENLABS_HOME: home, ELEVENLABS_API_BASE: url });
    await new Promise<void>((res) => tiny.close(() => res()));
    expect(r.code).not.toBe(0);
    expect(r.stderr).toContain('not audio');
    expect(existsSync(out) ? readdirSync(out).filter((f) => f.endsWith('.mp3')) : []).toEqual([]);
  }, 30_000);
});
