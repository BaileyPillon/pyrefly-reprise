/**
 * What the review workflows now ask for (Bailey, 2026-10-04, D-420 to D-426): `critic/runner/deep.js` runs the continuity
 * harness over every listed chapter as a required evidence step, adds the first-time-fan lens, hands both to the auditors and
 * the chief critic and tells the chief to obey the score caps; `critic/runner/focused.js` runs the harness on the changed
 * area's chapters. A workflow script cannot be imported (it is the body of an async function with `agent`, `phase`, `parallel`
 * as globals), so each one is run here with those stubbed and its prompts are read.
 *
 * Game case: both (shared critic plumbing).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..', '..');
const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as new (...names: string[]) => (...values: unknown[]) => Promise<unknown>;

interface Call { label: string; prompt: string; opts: { label: string; model?: string; phase?: string; schema?: unknown; effort?: string } }

async function runWorkflow(file: string, args: Record<string, unknown>, answer: (label: string) => unknown): Promise<{ calls: Call[]; phases: string[]; result: unknown }> {
  const source = readFileSync(resolve(ROOT, file), 'utf8').replace('export const meta = ', 'const meta = ');
  const calls: Call[] = [];
  const phases: string[] = [];
  const agent = async (prompt: string, opts: Call['opts']): Promise<unknown> => { calls.push({ label: opts.label, prompt, opts }); return answer(opts.label); };
  const parallel = async (fns: (() => Promise<unknown>)[]): Promise<unknown[]> => Promise.all(fns.map((f) => f()));
  const fn = new AsyncFunction('args', 'agent', 'phase', 'parallel', 'log', 'workflow', source);
  const result = await fn(args, agent, (t: string) => phases.push(t), parallel, () => undefined, async () => ({}));
  return { calls, phases, result };
}

const ANSWERS = (label: string): unknown => {
  if (label === 'capture-owner') return { index: 'index.json', encounters: [{ id: 'seymour-flux', completedRealFlow: true }], notes: '' };
  if (label === 'continuity-harness') return { summaryPath: 'critic/rounds/round-22/continuity/continuity-summary.json', checks: { 'CHK-026': 'FAIL', 'CHK-027': 'FAIL' }, size: 'worst head jump 24.7 percent', notes: 'ran at 59 fps' };
  if (label.startsWith('audit:')) return { categories: [], issues: [], capturesNeeded: [] };
  if (label === 'first-time-fan') return { breakers: [{ kind: 'size jumps', what: 'Yuna gets bigger when she attacks', evidence: 'strips/swap-001.jpg' }], looked: ['strips'] };
  if (label === 'chief-critic') return { reportPath: 'critic/rounds/round-22.json', scoreOutput: '', clearOutput: '', top: [] };
  return null;
};

const DEEP_ARGS = { round: '22', sha: 'abc1234', bundle: 'bnd', review: 'deep', live: 'https://echoesofspira.com/', changed: 'release 39' };

describe('critic/runner/deep.js, the continuity harness and the first-time fan', () => {
  it('runs the harness right after the capture owner and before the auditors, as a phase of its own', async () => {
    const { calls, phases } = await runWorkflow('critic/runner/deep.js', DEEP_ARGS, ANSWERS);
    expect(phases).toEqual(['Capture', 'Continuity', 'Audit', 'Gaps', 'Confirm', 'Report']);
    const labels = calls.map((c) => c.label);
    expect(labels.slice(0, 2)).toEqual(['capture-owner', 'continuity-harness']);
    expect(labels).toContain('first-time-fan');
    expect(labels.at(-1)).toBe('chief-critic');
    expect(labels.indexOf('continuity-harness')).toBeLessThan(labels.findIndex((l) => l.startsWith('audit:')));
  });

  it('tells the harness agent exactly what to run: the plan\'s chapters, on the GPU, one browser at a time, a retry that is reported', async () => {
    const { calls } = await runWorkflow('critic/runner/deep.js', DEEP_ARGS, ANSWERS);
    const h = calls.find((c) => c.label === 'continuity-harness')!;
    expect(h.opts.model).toBe('sonnet');
    expect(h.prompt).toContain("node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/");
    expect(h.prompt).toContain('critic/rounds/round-22/continuity');
    expect(h.prompt).toContain("--evidence='D:/Final Fantasy/critic/rounds/round-22/continuity'"); // the path has a space
    expect(h.prompt).toContain('--tag=r22');
    expect(h.prompt).toContain('PYREFLY_BROWSER=gpu');
    expect(h.prompt).toContain('node tools/critic-plan.mjs --json');
    expect(h.prompt).toMatch(/"chapters" array of the plan/);
    expect(h.prompt).toMatch(/REQUIRED evidence step/);
    expect(h.prompt).toMatch(/never the Claude-in-Chrome extension/);
    expect(h.prompt).toMatch(/never drop it/);
    expect(h.prompt).toContain('CHK-026');
    expect(h.prompt).toContain('CHK-027');
  });

  it('takes a narrower chapter list when the orchestrator names one, and the candidate\'s own base', async () => {
    const { calls } = await runWorkflow('critic/runner/deep.js', { ...DEEP_ARGS, continuityChapters: 'seymour-flux,ffx2-bahamut', base: 'http://127.0.0.1:5500/' }, ANSWERS);
    const h = calls.find((c) => c.label === 'continuity-harness')!;
    expect(h.prompt).toContain('--chapters=seymour-flux,ffx2-bahamut');
    expect(h.prompt).toContain('--base=http://127.0.0.1:5500/');
  });

  it('adds a reviewer whose only job is listing what breaks immersion, from the whole checklist, from pictures', async () => {
    const { calls } = await runWorkflow('critic/runner/deep.js', DEEP_ARGS, ANSWERS);
    const fan = calls.find((c) => c.label === 'first-time-fan')!;
    expect(fan.opts.model).toBe('opus');
    expect(fan.opts.phase).toBe('Audit');
    for (const item of ['size jumps', 'snapping', 'half-motion or ghosting', 'popping', 'sliding or floating feet', 'flicker', 'outline fringe', 'attacks that do not connect', 'UI covering the action', 'camera jerks', 'texture pop-in', 'jerks or teleports']) expect(fan.prompt, item).toContain(item);
    expect(fan.prompt).toMatch(/do not read critic\/RUBRIC\.md and do not score anything/);
    expect(fan.prompt).toMatch(/do not open a browser/);
    expect(fan.prompt).toContain('critic/rounds/round-22/continuity');
    expect(fan.prompt).toMatch(/strips/);
    expect(fan.prompt).toMatch(/event-locked|timed frame sequences/);
    expect(fan.prompt).toMatch(/You score nothing and fix nothing/);
  });

  it('hands the harness result to the visual and the feel auditors and to no one else', async () => {
    const { calls } = await runWorkflow('critic/runner/deep.js', DEEP_ARGS, ANSWERS);
    const audits = calls.filter((c) => c.label.startsWith('audit:'));
    expect(audits.length).toBe(6);
    for (const a of audits) {
      const wants = a.label === 'audit:visual-targets' || a.label === 'audit:feel-narrative';
      expect(a.prompt.includes('CONTINUITY EVIDENCE'), a.label).toBe(wants);
      if (wants) expect(a.prompt).toContain('"CHK-026":"FAIL"');
    }
    expect(audits.find((a) => a.label === 'audit:visual-targets')!.prompt).toMatch(/CHK-026[^.]*capped at 7\.0/);
    expect(audits.find((a) => a.label === 'audit:feel-narrative')!.prompt).toMatch(/capped at 7\.5/);
  });

  it('tells the chief to record both checks as mandatory, keep the fan\'s breakers as issues, copy the aggregate and obey the caps', async () => {
    const { calls } = await runWorkflow('critic/runner/deep.js', DEEP_ARGS, ANSWERS);
    const chief = calls.find((c) => c.label === 'chief-critic')!;
    expect(chief.prompt).toContain('Yuna gets bigger when she attacks');
    expect(chief.prompt).toContain('"CHK-026":"FAIL"');
    expect(chief.prompt).toMatch(/MANDATORY checks/);
    expect(chief.prompt).toMatch(/plus CHK-016, CHK-017, CHK-026, CHK-027/);
    expect(chief.prompt).toMatch(/subScores/);
    expect(chief.prompt).toMatch(/characterModels and animation are at most 7\.0/);
    expect(chief.prompt).toMatch(/animation is at most 7\.5/);
    expect(chief.prompt).toMatch(/snapsPerMinuteMax/);
    expect(chief.prompt).toMatch(/UNVERIFIED with the cause when the harness could not run/);
    expect(chief.prompt).toMatch(/findings are issues, never scores|issues, never scores/);
  });

  it('says UNVERIFIED, never PASS, when the harness returns nothing', async () => {
    const { calls } = await runWorkflow('critic/runner/deep.js', DEEP_ARGS, (l) => (l === 'continuity-harness' || l === 'first-time-fan' ? null : ANSWERS(l)));
    const chief = calls.find((c) => c.label === 'chief-critic')!;
    expect(chief.prompt).toContain('returned nothing: both checks are UNVERIFIED');
    const visual = calls.find((c) => c.label === 'audit:visual-targets')!;
    expect(visual.prompt).toContain('the harness returned nothing: CHK-026 and CHK-027 are UNVERIFIED');
  });
});

describe('critic/runner/focused.js, the harness on the changed area', () => {
  const FOCUSED_ARGS = { sha: 'abc1234', root: 'D:/pyrefly-release', changed: 'the battle presenter' };

  it('runs the harness over the changed area\'s chapters on the candidate and compares with live before calling a regression', async () => {
    const { calls } = await runWorkflow('critic/runner/focused.js', FOCUSED_ARGS, () => ({ reportPath: 'r', changedArea: 'PASS', ship: 'SHIP', clearOutput: '' }));
    expect(calls).toHaveLength(1);
    const p = calls[0]!.prompt;
    expect(p).toContain('(3b) CONTINUITY');
    expect(p).toContain('node critic/runner/lib/continuity.mjs --base=<the candidate\'s preview url, ending in a slash>');
    expect(p).toContain('critic/reviews/abc1234-focused/continuity');
    expect(p).toContain('--evidence="D:/Final Fantasy/critic/reviews/abc1234-focused/continuity"'); // quoted: the path has a space
    expect(p).toContain('--tag=abc1234');
    expect(p).toContain('PYREFLY_BROWSER=gpu');
    expect(p).toMatch(/one browser at a time/);
    expect(p).toContain('critic/reviews/continuity-baseline-r38/');
    expect(p).toMatch(/introducedByCandidate false and regressionVsLive false/);
    expect(p).toMatch(/NOT APPLICABLE/);
    expect(p).toMatch(/continuity \(the harness aggregate of step 3b/);
  });
});
