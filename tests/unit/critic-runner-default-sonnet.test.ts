/**
 * Bailey's delegation rule (E-081, restated 2026-10-05 about 22:00 EDT): "For all mechanical implementation, file searches,
 * tests, and routine execution, use your judgment to delegate tasks to lower-power sub-agents running Sonnet." Every role of
 * the critic's review workflows therefore defaults to Sonnet, and Opus is an opt-in: `critic/runner/deep.js` takes
 * `args.opusKeys` (role keys), `critic/runner/focused.js` takes `args.model`. A workflow script cannot be imported (it is the
 * body of an async function with `agent`, `phase`, `parallel` as globals), so each one is run here with those stubbed.
 *
 * Game case: both (shared critic plumbing; tooling only).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..', '..');
const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as new (...names: string[]) => (...values: unknown[]) => Promise<unknown>;

interface Call { label: string; opts: { label: string; model?: string } }

async function runWorkflow(file: string, args: Record<string, unknown>, answer: (label: string) => unknown): Promise<Call[]> {
  const source = readFileSync(resolve(ROOT, file), 'utf8').replace('export const meta = ', 'const meta = ');
  const calls: Call[] = [];
  const agent = async (_prompt: string, opts: Call['opts']): Promise<unknown> => { calls.push({ label: opts.label, opts }); return answer(opts.label); };
  const parallel = async (fns: (() => Promise<unknown>)[]): Promise<unknown[]> => Promise.all(fns.map((f) => f()));
  const fn = new AsyncFunction('args', 'agent', 'phase', 'parallel', 'log', 'workflow', source);
  await fn(args, agent, () => undefined, parallel, () => undefined, async () => ({}));
  return calls;
}

// A capture that lists one needed gap and one top issue, so the Gaps and Confirm agents run too.
const ANSWERS = (label: string): unknown => {
  if (label === 'capture-owner') return { index: 'index.json', encounters: [{ id: 'seymour-flux', completedRealFlow: true }], notes: '', issues: [{ id: 'X-1', severity: 'major', title: 'a major' }] };
  if (label === 'continuity-harness') return { summaryPath: 'critic/rounds/round-23/continuity/continuity-summary.json', checks: { 'CHK-026': 'PASS', 'CHK-027': 'PASS' }, notes: '' };
  if (label.startsWith('audit:')) return { categories: [], issues: [{ id: 'X-2', severity: 'major', title: 'another major' }], capturesNeeded: ['one more capture'] };
  if (label === 'first-time-fan') return { breakers: [], looked: ['strips'] };
  if (label === 'chief-critic') return { reportPath: 'critic/rounds/round-23.json', scoreOutput: '', clearOutput: '', top: [] };
  return { answered: [], issues: [], results: [] };
};

const DEEP_ARGS = { round: '23', sha: 'abc1234', bundle: 'bnd', review: 'deep', live: 'https://echoesofspira.com/', changed: 'release 39.1' };

describe('critic/runner/deep.js: every role defaults to Sonnet, Opus only by opt-in', () => {
  it('runs every agent of a review on Sonnet when no key is opted in', async () => {
    const calls = await runWorkflow('critic/runner/deep.js', DEEP_ARGS, ANSWERS);
    const labels = calls.map((c) => c.label);
    for (const role of ['capture-owner', 'continuity-harness', 'first-time-fan', 'chief-critic']) expect(labels, role).toContain(role);
    expect(labels.some((l) => l.startsWith('audit:'))).toBe(true);
    for (const c of calls) expect(c.opts.model, c.label).toBe('sonnet');
  });

  it('moves a role to Opus only when args.opusKeys names it, and leaves the others on Sonnet', async () => {
    const calls = await runWorkflow('critic/runner/deep.js', { ...DEEP_ARGS, opusKeys: ['chief-critic', 'first-time-fan'] }, ANSWERS);
    for (const c of calls) expect(c.opts.model, c.label).toBe(c.label === 'chief-critic' || c.label === 'first-time-fan' ? 'opus' : 'sonnet');
  });

  it('opts an auditor, the capture owner, the gap closer and the confirmer in by their keys', async () => {
    const first = await runWorkflow('critic/runner/deep.js', DEEP_ARGS, ANSWERS);
    const auditKey = first.find((c) => c.label.startsWith('audit:'))!.label.slice('audit:'.length);
    const calls = await runWorkflow('critic/runner/deep.js', { ...DEEP_ARGS, opusKeys: [auditKey, 'capture', 'gaps', 'confirm'] }, ANSWERS);
    for (const c of calls) {
      const opted = c.label === `audit:${auditKey}` || c.label === 'capture-owner' || c.label === 'gap-capture' || c.label === 'confirm';
      expect(c.opts.model, c.label).toBe(opted ? 'opus' : 'sonnet');
    }
  });

  it('no longer reads the old sonnetKeys list (it would have meant Opus for every key left out)', async () => {
    const calls = await runWorkflow('critic/runner/deep.js', { ...DEEP_ARGS, sonnetKeys: [] }, ANSWERS);
    for (const c of calls) expect(c.opts.model, c.label).toBe('sonnet');
  });
});

describe('critic/runner/focused.js and live.js: Sonnet unless asked', () => {
  const FOCUSED_ARGS = { sha: 'abc1234', bundle: 'bnd', changed: 'release 39.1' };
  const OUT = { reportPath: 'critic/reviews/abc1234-focused.json', deployment: 'NOT APPLICABLE', changedArea: 'PASS', ship: 'SHIP', notes: '' };

  it('the focused review runs on Sonnet by default and on the model args.model names', async () => {
    const by = await runWorkflow('critic/runner/focused.js', FOCUSED_ARGS, () => OUT);
    expect(by.length).toBeGreaterThan(0);
    for (const c of by) expect(c.opts.model, c.label).toBe('sonnet');
    const opus = await runWorkflow('critic/runner/focused.js', { ...FOCUSED_ARGS, model: 'opus' }, () => OUT);
    for (const c of opus) expect(c.opts.model, c.label).toBe('opus');
  });

  it('the live verification runs on Sonnet by default', async () => {
    const calls = await runWorkflow('critic/runner/live.js', { sha: 'abc1234', bundle: 'bnd' }, () => OUT);
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c.opts.model, c.label).toBe('sonnet');
  });
});
