/**
 * The instruments of lane r43-critic-tools are reachable by the people who need them (PR-0450: "a next-round report line per instrument"; a module nothing reaches is hard rule 4's
 * "built but wired to nothing"). The deep review's gap pass owns the browser and writes the delivery and legibility captures; round 25's wrote its own scripts and they mis-measured.
 * This holds that its prompt now names the library's instruments with the subject and the evidence folder filled in, that the prep-and-delivery auditor asks for the cold-load
 * evidence, that the capture owner is told the inline continuity probe is gone, and that the files the prompts name exist and are documented where a reviewer reads. A workflow
 * script cannot be imported (it is the body of an async function with `agent`, `phase`, `parallel` as globals), so it is run with those stubbed and its prompts are read.
 *
 * Game case: both (shared critic plumbing).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as new (...names: string[]) => (...values: unknown[]) => Promise<unknown>;

interface Call { label: string; prompt: string }

async function prompts(args: Record<string, unknown>): Promise<Call[]> {
  const source = read('critic/runner/deep.js').replace('export const meta = ', 'const meta = ');
  const calls: Call[] = [];
  const answer = (label: string): unknown => {
    if (label === 'capture-owner') return { index: 'index.json', encounters: [], notes: '', issues: [{ id: 'X-1', severity: 'major', title: 'a major' }] };
    if (label.startsWith('audit:')) return { categories: [], issues: [], capturesNeeded: ['coldload.mjs run'] };
    if (label === 'chief-critic') return { reportPath: 'r', scoreOutput: '', clearOutput: '', top: [] };
    return { answered: [], issues: [], results: [] };
  };
  const agent = async (prompt: string, opts: { label: string }): Promise<unknown> => { calls.push({ label: opts.label, prompt }); return answer(opts.label); };
  const parallel = async (fns: (() => Promise<unknown>)[]): Promise<unknown[]> => Promise.all(fns.map((f) => f()));
  await new AsyncFunction('args', 'agent', 'phase', 'parallel', 'log', 'workflow', source)(args, agent, () => undefined, parallel, () => undefined, async () => ({}));
  return calls;
}

const ARGS = { round: '26', sha: 'abc1234', bundle: 'bnd', review: 'deep', live: 'https://echoesofspira.com/', changed: 'release 43' };

describe('the deep review reaches the instruments', () => {
  it('tells the gap pass to run coldload.mjs and sweep.mjs with the subject and the evidence folder, alone, and to copy each REPORT LINE', async () => {
    const gap = (await prompts(ARGS)).find((c) => c.label === 'gap-capture')!;
    expect(gap.prompt).toContain("node critic/runner/lib/coldload.mjs --base=https://echoesofspira.com/ --evidence='D:/Final Fantasy/critic/rounds/round-26/evidence'");
    expect(gap.prompt).toContain("node critic/runner/lib/sweep.mjs <battle|phone|prep|matrix> --base=https://echoesofspira.com/ --evidence='D:/Final Fantasy/critic/rounds/round-26/evidence'");
    expect(gap.prompt).toMatch(/never a script written for the round/);
    expect(gap.prompt).toMatch(/delivery\.mjs timed a warm second load, pause-matrix\.mjs swept an 11 px floor/);
    expect(gap.prompt).toMatch(/PYREFLY_BROWSER=gpu, one at a time and alone on the host/);
    expect(gap.prompt).toMatch(/copy the REPORT LINE each prints/);
    expect(gap.prompt).toMatch(/stays UNVERIFIED/);
  });

  it('takes the candidate\'s own base when the orchestrator names one', async () => {
    const gap = (await prompts({ ...ARGS, base: 'http://127.0.0.1:5500/' })).find((c) => c.label === 'gap-capture')!;
    expect(gap.prompt).toContain('node critic/runner/lib/coldload.mjs --base=http://127.0.0.1:5500/');
  });

  it('has the prep-and-delivery auditor ask for the cold-load evidence and discount a busy host or a broken protocol', async () => {
    const a = (await prompts(ARGS)).find((c) => c.label === 'audit:prep-delivery')!;
    expect(a.prompt).toMatch(/library cold-load instrument \(critic\/runner\/lib\/coldload\.mjs, PR-0450\)/);
    expect(a.prompt).toMatch(/gaps\/coldload\/out\.json with its REPORT LINE/);
    expect(a.prompt).toMatch(/busy host or a broken protocol is not an idle-host number/);
  });

  it('tells the capture owner that the inline continuity probe is gone', async () => {
    const c = (await prompts(ARGS)).find((x) => x.label === 'capture-owner')!;
    expect(c.prompt).toMatch(/Do not pass --continuity to route\.mjs/);
    expect(c.prompt).toMatch(/inline probe numbers are never scored \(PR-0450\)/);
  });
});

describe('what the prompts name exists and is written down where a reviewer reads', () => {
  it('has the instruments, their pure halves and their types', () => {
    for (const f of ['coldload', 'coldload-pure', 'sweep', 'legibility-pure', 'gap-boot', 'continuity-wash']) {
      expect(existsSync(resolve(ROOT, `critic/runner/lib/${f}.mjs`)), `${f}.mjs`).toBe(true);
      expect(existsSync(resolve(ROOT, `critic/runner/lib/${f}.d.mts`)), `${f}.d.mts`).toBe(true);
    }
  });

  it('documents each instrument and its report line in the library README, and points CHK-002, CHK-003, the delivery check and CHK-027 at them', () => {
    const readme = read('critic/runner/lib/README.md');
    for (const s of ['`coldload.mjs`', '`sweep.mjs`', '`gap-boot.mjs`', 'REPORT LINE', 'continuity-wash.mjs', 'CONT_DEDICATED=1', 'PR-0397', 'PR-0433', 'LONG_FIGHT_BUDGET_MS']) expect(readme, s).toContain(s);
    const checks = read('critic/CHECKS.md');
    expect(checks.match(/LIVE INSTRUMENT \(r43, PR-0450 b\)/g)).toHaveLength(2); // CHK-002 and CHK-003
    expect(checks).toContain('COLD LOAD (r43, PR-0450 a)');
    expect(checks).toContain("8. **The Save Sphere's wash (r43");
  });

  it('has the sweep and the cold load print the line the report carries', () => {
    expect(read('critic/runner/lib/sweep.mjs')).toContain('console.log(`REPORT LINE: ${out.reportLine}`)');
    expect(read('critic/runner/lib/coldload.mjs')).toContain('console.log(`REPORT LINE: ${reportLine}`)');
  });
});
