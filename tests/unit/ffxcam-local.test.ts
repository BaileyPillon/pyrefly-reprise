/**
 * **The replayer against Bailey's own FFX camera data** (local only; skipped when the folder is absent, so the suite passes on any machine).
 *
 * The programs are a transcription of FFX's scripts and never in the repo (AGENTS.md rule 8), so everything here reads them from his folder, `D:\Tools\ffx-parity\assets\runtime\camera\evrae\`
 * (`PYREFLY_FFX_LOCAL` names another root), written by `D:\Tools\ffx-parity\assets\tools\camera-runtime\build-index.mjs`. The expected values are the camera-programs lane's own, computed by its
 * independent VM and kept in `source/INDEX.json` beside the programs, plus the two figures CAMERA.md reports for the near default view. Pins:
 *
 * 1. **the default views**: the near view's eye is where CAMERA.md reports it (about (-96.0, -136.1, 333.6), and the PS2 capture's to 0.01), the far view is the lane's;
 * 2. **Pull back** runs 185 steps and ends on the far default, **Move in** runs 231 (the lane's measured frames);
 * 3. **every program in the index** (66) loads, runs to its end with the host's default answers without throwing, finishes in the number of steps the lane's analysis allows, and calls nothing the
 *    VM does not know (the tally is printed);
 * 4. **the director** runs a whole fight on them: every beat answered, every pose finite, the programs started as the lane's beat table says, deterministic per seed.
 *
 * Game case: FFX only.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, expect, it, vi } from 'vitest';

import { ffxLocalMiddleware } from '../../tools/vite-ffx-local.mjs';
import type { ShotCtx, ShotSubject } from '../../src/engine/ShotDirector.ts';
import type { FfxCameraPrograms } from '../../src/engine/ffxcam/book.ts';
import { FfxCameraDirector } from '../../src/engine/ffxcam/director.ts';
import { FormationHost, type RosterEntry } from '../../src/engine/ffxcam/formation.ts';
import { PresentationRandom } from '../../src/engine/ffxcam/host.ts';
import { polarToCart } from '../../src/engine/ffxcam/geometry.ts';
import { buildFfxCameraPrograms, loadFfxCameraPrograms } from '../../src/engine/ffxcam/load.ts';
import { CameraSolver } from '../../src/engine/ffxcam/solver.ts';
import { CameraVm } from '../../src/engine/ffxcam/vm.ts';
import { D2R, frame, near } from './helpers/ffxcamKit.ts';
import { RecordingSink, shotCtx, subject } from './helpers/ffxcamDirectorKit.ts';

const ROOT = process.env['PYREFLY_FFX_LOCAL']?.trim() || 'D:/Tools/ffx-parity/assets/runtime';
const DIR = `${ROOT}/camera/evrae`;
const HAVE = existsSync(`${DIR}/index.json`) && existsSync(`${DIR}/source/INDEX.json`);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

interface LaneIndex {
  defaultViews: { near: { eye: number[]; ref: number[]; scrDpt: number; vfovDeg: number }; far: { eye: number[]; ref: number[]; scrDpt: number } };
  programs: Record<string, { timing: { framesPossible: number[]; camReqChains: string[] } }>;
}

function loadData(): { programs: FfxCameraPrograms; lane: LaneIndex } {
  const rawIndex = readJson(`${DIR}/index.json`) as { programs: string[] };
  const files = new Map<string, unknown>(rawIndex.programs.map((p) => [p, readJson(`${DIR}/${p}`)]));
  const built = buildFfxCameraPrograms(rawIndex, files);
  if (!('programs' in built)) throw new Error(`the local camera data is invalid: ${built.problem}`);
  return { programs: built.programs, lane: readJson(`${DIR}/source/INDEX.json`) as LaneIndex };
}

/** Stand-in characters (not game data): three party members, three monsters, three reserve. */
const ROSTER: RosterEntry[] = [
  { id: 'tidus', chr: 0, side: 'party' },
  { id: 'wakka', chr: 4, side: 'party' },
  { id: 'rikku', chr: 6, side: 'party' },
  { id: 'auron', chr: 2, side: 'reserve' },
  { id: 'kimahri', chr: 3, side: 'reserve' },
  { id: 'lulu', chr: 5, side: 'reserve' },
  { id: 'evrae', chr: 20, side: 'monster', monsterNumber: 119 },
  { id: 'cid', chr: 21, side: 'monster', monsterNumber: 149 },
  { id: 'urn', chr: 22, side: 'monster', monsterNumber: 255 },
];

function fillFrames(host: FormationHost): void {
  for (const [i, e] of ROSTER.entries()) {
    const big = e.side === 'monster';
    host.setFrame(e.chr, frame(big ? -140 : -20, -35, 40 + 20 * i, { height: big ? 200 : 60, width: big ? 120 : 30, heading: big ? 0 : Math.PI }));
  }
}

function rigOf(programs: FfxCameraPrograms, distance = 0, seed = 1): { vm: CameraVm; host: FormationHost; solver: CameraSolver; warnings: string[] } {
  const host = new FormationHost({ random: new PresentationRandom(seed), constants: programs.constants });
  host.setRoster(ROSTER);
  fillFrames(host);
  host.setProperty(20, 30, distance);
  const solver = new CameraSolver(host);
  const warnings: string[] = [];
  const vm = new CameraVm({ solver, book: programs.book, host, warn: (m) => warnings.push(m) });
  return { vm, host, solver, warnings };
}

describe.skipIf(!HAVE)('the replayer on Bailey\'s own FFX camera data', () => {
  const data = HAVE ? loadData() : null;
  const programs = (): FfxCameraPrograms => (data as NonNullable<typeof data>).programs;
  const lane = (): LaneIndex => (data as NonNullable<typeof data>).lane;

  it('loads: 66 programs, the tag tables, the actions and the range', () => {
    expect(programs().book.size).toBe(66);
    expect(programs().range?.tag).toBe(0);
    expect(Object.keys(programs().actions.party).length).toBeGreaterThan(30);
    expect(Object.keys(programs().actions.monster).length).toBeGreaterThan(5);
    expect(programs().constants['CurrentBattle']).toBeGreaterThan(0);
  });

  it('is served by the dev route and fetched by the loader: the same data as read from the disk', async () => {
    vi.stubEnv('DEV', true);
    const server = createServer((req, res) => ffxLocalMiddleware({ root: ROOT })(req, res, () => ((res.statusCode = 404), res.end())));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const port = (server.address() as AddressInfo).port;
      const viaRoute = await loadFfxCameraPrograms('evrae', ((url: string, init?: RequestInit) => fetch(`http://127.0.0.1:${port}${url}`, init)) as unknown as typeof fetch);
      expect(viaRoute).not.toBeNull();
      expect(viaRoute?.book.ids().sort()).toEqual(programs().book.ids().sort());
      expect(viaRoute?.actions).toEqual(programs().actions);
      expect(viaRoute?.constants).toEqual(programs().constants);
      expect(viaRoute?.range).toEqual(programs().range);
    } finally {
      vi.unstubAllEnvs();
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('the default views', () => {
    it('the near view is where CAMERA.md reports it: ref(-30.6985, -34.9897, 13.5121) with polar(-258.4762, -17.1948, 342) gives an eye of about (-96.0, -136.1, 333.6)', () => {
      // the arithmetic alone (CAMERA.md 1.1: eye = ref + len * (cos phi cos theta, sin phi, cos phi sin theta), degrees)
      const byHand = polarToCart([-30.6985, -34.9897, 13.5121], -258.4762 * D2R, -17.1948 * D2R, 342);
      near(byHand, [-96.0, -136.1, 333.6], 0.1);
      // the real program, replayed
      const { vm } = rigOf(programs(), 0);
      expect(vm.request({ tags: [24] })?.id).toBeDefined();
      const pose = vm.tick();
      near(pose.eye, [-96.0, -136.1, 333.6], 0.1);
      near(pose.ref, [-30.6985, -34.9897, 13.5121], 1e-3);
      // the README's correction does not move it: the script holds -258.47623 (the figure above is its 4-decimal rounding); the eye differs from the rounded one by under 1e-3
      near(pose.eye, byHand, 1e-3);
      expect(pose.scrDpt).toBe(1024);
      expect(pose.fovDeg).toBeCloseTo(26.38, 2);
      expect(pose.roll).toBe(0);
    });

    it('the near eye is the lane\'s (computed by its own VM, which matches the PS2 capture to 0.01)', () => {
      const { vm } = rigOf(programs(), 0);
      vm.request({ tags: [24] });
      const pose = vm.tick();
      near(pose.eye, lane().defaultViews.near.eye, 0.01);
      near(pose.ref, lane().defaultViews.near.ref, 0.01);
      expect(pose.fovDeg).toBeCloseTo(lane().defaultViews.near.vfovDeg, 3);
    });

    it('the far view (Evrae pulled back) is the lane\'s', () => {
      const { vm } = rigOf(programs(), 3);
      vm.request({ tags: [24] });
      const pose = vm.tick();
      near(pose.eye, lane().defaultViews.far.eye, 0.01);
      near(pose.ref, lane().defaultViews.far.ref, 0.01);
      expect(pose.scrDpt).toBe(lane().defaultViews.far.scrDpt);
    });

    it('Enter, Select and Normal are one body: the same view each, a hard cut', () => {
      for (const tag of [24, 25, 28]) {
        const { vm } = rigOf(programs(), 0);
        vm.request({ tags: [tag] });
        near(vm.tick().eye, lane().defaultViews.near.eye, 0.01);
        expect(vm.idle, `tag ${tag}`).toBe(true);
      }
    });
  });

  describe('the airship scene', () => {
    it('Pull back runs 185 steps and ends on the far default view', () => {
      const { vm } = rigOf(programs(), 0);
      vm.vars.set('battle:0x4', 1);
      vm.request({ tags: [0] });
      expect(vm.runToEnd()).toBe(185);
      const pose = vm.pose();
      near(pose.eye, lane().defaultViews.far.eye, 0.01);
      near(pose.ref, lane().defaultViews.far.ref, 0.01);
      expect(pose.scrDpt).toBe(1024);
    });

    it('Move in runs 231 steps', () => {
      const { vm } = rigOf(programs(), 3);
      vm.vars.set('battle:0x4', 2);
      vm.request({ tags: [0] });
      expect(vm.runToEnd()).toBe(231);
    });

    it('Pull back is two blends and a cut: the first leg runs 120 steps, the cut lands on the second\'s first shot', () => {
      const { vm } = rigOf(programs(), 0);
      vm.vars.set('battle:0x4', 1);
      vm.request({ tags: [0] });
      const eyes = Array.from({ length: 185 }, () => vm.tick().eye);
      const jump = (k: number): number => Math.hypot(...(eyes[k]!.map((x, i) => x - eyes[k - 1]![i]!) as [number, number, number]));
      expect(jump(120)).toBeGreaterThan(20 * jump(119)); // the hard cut at step 120 is far bigger than any blended step before it
      expect(jump(121)).toBeLessThan(jump(120) / 10);
    });
  });

  describe('every program', () => {
    it('loads, runs to its end with the host\'s default answers without throwing, and does what the lane\'s analysis says it can', () => {
      const ids = programs().book.ids();
      expect(ids).toHaveLength(66);
      const handled = new Map<string, number>();
      const ignored = new Map<string, number>();
      const queries = new Map<string, number>();
      const unknownCalls = new Map<string, number>();
      const unknownQueries = new Map<string, number>();
      const outside: string[] = [];
      for (const id of ids) {
        const { vm, warnings } = rigOf(programs(), 0, 5);
        vm.vars.set('battle:0x4', 1);
        const program = programs().book.get(id);
        expect(program, id).toBeDefined();
        expect(() => vm.start(program!), id).not.toThrow();
        const ran = vm.runToEnd(6000);
        expect(vm.idle, `${id} did not finish`).toBe(true);
        expect(warnings.filter((w) => /without waiting|did not finish|chained/.test(w)), id).toEqual([]);
        const frames = Math.max(1, ran);
        const timing = lane().programs[id]?.timing;
        // A scene driver's camReq(0, ...) STARTS the camera function and lets the driver go on (the lane counts the driver alone); the VM runs one thread, so there it is a tail call and the count is the
        // camera program's.
        const startsCamera = (timing?.camReqChains ?? []).some((c) => c.startsWith('slot 0'));
        const possible = timing?.framesPossible ?? [];
        if (!startsCamera && !possible.includes(frames)) outside.push(`${id}: ${frames} not in ${possible.join(',')}`);
        for (const [m, from] of [[handled, vm.stats.handled], [ignored, vm.stats.ignored], [queries, vm.stats.queries], [unknownCalls, vm.stats.unknownCalls], [unknownQueries, vm.stats.unknownQueries]] as const) {
          for (const [name, n] of from) m.set(name, (m.get(name) ?? 0) + n);
        }
      }
      console.log(`[ffxcam] 66 programs run: ${handled.size} calls implemented ${JSON.stringify([...handled.keys()].sort())}`);
      console.log(`[ffxcam] ${ignored.size} calls known and ignored by design ${JSON.stringify([...ignored.keys()].sort())}`);
      console.log(`[ffxcam] ${queries.size} queries answered ${JSON.stringify([...queries.keys()].sort())}`);
      console.log(`[ffxcam] unknown calls: ${unknownCalls.size} ${JSON.stringify([...unknownCalls])}; unknown queries: ${unknownQueries.size} ${JSON.stringify([...unknownQueries])}`);
      expect([...unknownCalls.keys()]).toEqual([]);
      expect([...unknownQueries.keys()]).toEqual([]);
      expect(outside).toEqual([]);
    });
  });

  describe('the director on a whole fight', () => {
    const TIDUS = subject('tidus', 'party');
    const LULU = subject('lulu', 'party');
    const EVRAE = subject('evrae', 'enemy');
    const CID = subject('cid', 'enemy');

    /** Play a fight of every kind of beat; the programs started, in order, and every pose published. */
    async function fight(seed: number, speed: 'normal' | 'skip' = 'skip'): Promise<{ started: string[]; answers: boolean[]; poses: ReturnType<RecordingSink['poses']['slice']> }> {
      const sink = new RecordingSink();
      const started: string[] = [];
      const director = new FfxCameraDirector({ programs: programs(), sink, seed, onStart: (p) => started.push(p.id), warn: () => undefined });
      director.host.setRoster(ROSTER);
      fillFrames(director.host);
      director.host.setProperty(20, 30, 0);
      const ctx: ShotCtx = shotCtx(speed);
      const answers: boolean[] = [];
      const take = async (a: boolean | Promise<boolean> | undefined): Promise<void> => void answers.push(await (a ?? false));
      const act = async (actor: ShotSubject, abilityId: string | undefined, kind: 'attack' | 'ability' | 'item', targets: ShotSubject[]): Promise<void> => {
        const action = { kind: 'cast', abilityId, commandKind: kind } as const;
        await take(director.actionOpen?.({ ...ctx, actor, targets, action }));
        for (const [i, target] of targets.entries()) await take(director.impact?.({ ...ctx, actor, action, target, hitIndex: i, heavy: false }));
        await take(director.actionClose?.({ ...ctx, actor, action }));
      };
      await take(director.battleStart?.({ ...ctx, partyIds: ['tidus', 'lulu'], boss: EVRAE, bossName: 'Evrae' }));
      await take(director.turnStart?.({ ...ctx, actor: TIDUS }));
      await act(TIDUS, undefined, 'attack', [EVRAE]);
      await act(LULU, 'fire', 'ability', [EVRAE]);
      await act(LULU, 'thunder', 'ability', [EVRAE]);
      await act(TIDUS, 'slow', 'ability', [EVRAE]);
      await act(TIDUS, 'delay-attack', 'ability', [EVRAE]);
      await act(subject('wakka', 'party'), 'dark-attack', 'ability', [EVRAE]);
      await act(TIDUS, 'potion', 'item', [TIDUS, LULU]);
      await act(EVRAE, 'evrae-poison-breath', 'ability', [TIDUS, LULU]);
      await act(EVRAE, 'evrae-photon-spray', 'ability', [TIDUS, LULU]);
      await act(EVRAE, 'evrae-attack', 'ability', [TIDUS]);
      await act(CID, 'cid-guided-missiles', 'ability', [TIDUS, LULU]);
      await take(director.overdriveStart?.({ ...ctx, actor: TIDUS, targets: [EVRAE], action: { kind: 'overdrive', abilityId: 'spiral-cut', commandKind: 'overdrive' } }));
      await take(director.overdriveEnd?.({ ...ctx, actor: TIDUS }));
      await take(director.actionClose?.({ ...ctx, actor: TIDUS }));
      director.rangeChange('pullBack', ctx);
      await take(director.turnStart?.({ ...ctx, actor: TIDUS }));
      await act(TIDUS, 'pull-back', 'ability', [EVRAE]);
      director.rangeChange('moveIn', ctx);
      await take(director.victory?.(ctx));
      director.defeat(ctx);
      return { started, answers, poses: sink.poses.slice() };
    }

    it('answers every beat, publishes only finite poses, and every program it starts exists', async () => {
      const f = await fight(3);
      expect(f.answers.length).toBeGreaterThan(30);
      expect(f.answers.every((a) => a)).toBe(true);
      expect(f.poses.length).toBeGreaterThan(30);
      for (const p of f.poses) {
        for (const n of [...p.eye, ...p.ref, p.roll, p.scrDpt, p.fovDeg]) expect(Number.isFinite(n)).toBe(true);
        expect(p.fovDeg).toBeGreaterThan(5);
        expect(p.fovDeg).toBeLessThan(90);
      }
      for (const id of new Set(f.started)) expect(programs().book.get(id), id).toBeDefined();
    });

    it('starts the programs the lane\'s beat table gives: Enter is the default view, a plain attack is accepted then the attack view, Normal closes', async () => {
      const f = await fight(3);
      expect(f.started.slice(0, 5)).toEqual(['hiku15_00.w3.f3', 'hiku15_00.w3.f3', 'hiku15_00.w3.f2', 'hiku15_00.w3.f9', 'hiku15_00.w3.f3']);
    });

    it('is deterministic per seed, and the seed changes the shots (the programs are the same ones; the dice pick the branch inside them)', async () => {
      const shots = async (seed: number): Promise<string> => JSON.stringify((await fight(seed)).poses.map((p) => p.eye));
      expect(await shots(9)).toEqual(await shots(9));
      expect((await fight(9)).started).toEqual((await fight(10)).started);
      const seeds = await Promise.all([1, 2, 3, 4, 5, 6].map(shots));
      expect(new Set(seeds).size).toBeGreaterThan(1);
    });

    it('runs at normal speed too, in real time, to a finite pose every step', async () => {
      const sink = new RecordingSink();
      const director = new FfxCameraDirector({ programs: programs(), sink, seed: 2, warn: () => undefined });
      director.host.setRoster(ROSTER);
      fillFrames(director.host);
      const ctx = shotCtx('normal');
      director.battleStart?.({ ...ctx, partyIds: ['tidus'], boss: EVRAE, bossName: 'Evrae' });
      director.actionOpen?.({ ...ctx, actor: LULU, targets: [EVRAE], action: { kind: 'cast', abilityId: 'fire', commandKind: 'ability' } });
      director.impact?.({ ...ctx, actor: LULU, action: { kind: 'cast', abilityId: 'fire', commandKind: 'ability' }, target: EVRAE, hitIndex: 0, heavy: false });
      for (let i = 0; i < 400; i++) director.advance(1000 / 60);
      for (const p of sink.poses) for (const n of [...p.eye, ...p.ref, p.roll, p.scrDpt, p.fovDeg]) expect(Number.isFinite(n)).toBe(true);
      expect(sink.poses.length).toBeGreaterThan(100);
    });
  });
});
