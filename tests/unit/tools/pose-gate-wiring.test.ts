/**
 * **The pose gate is wired where it cannot be walked around** (pose continuity, W1; both games). Bailey, 2026-10-16: "pose continuity is the strongest recurring
 * issue we need a permanent fix for this please." The gate is only as good as the places that call it, and the deploy script cannot be run in a test, so these
 * read its text: stage one (`enforcePoseGate`) runs before the build, at the top level of `main()` (outside the `--skip-tests` branch) and before the release gate
 * that `--owner-override` reaches; stage two (`enforceBuiltPaintings`) runs on the build's art list before anything is published; the install ends in the gate;
 * `npm test` runs the gate's tests; the rule and the install steps are written down where an agent starts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from './pose-gate-fixtures.ts';

const read = (...p: string[]): string => readFileSync(join(ROOT, ...p), 'utf8').replace(/\r\n/g, '\n');
const deploy = read('tools', 'deploy-pages.mjs');
const at = (needle: string | RegExp): number => {
  const i = typeof needle === 'string' ? deploy.indexOf(needle) : deploy.search(needle);
  expect(i, `deploy-pages.mjs should contain ${String(needle)}`).toBeGreaterThan(-1);
  return i;
};

describe('tools/deploy-pages.mjs', () => {
  it('imports the two stages from the gate library where they run, not at the top (the unit tests that import this module should not load the image decoder)', () => {
    expect(deploy).toMatch(/\n {2}const \{ enforceBuiltPaintings, enforcePoseGate \} = await import\('\.\/pose-gate-lib\.mjs'\);\n/);
    expect(deploy).not.toMatch(/^import .* from '\.\/pose-gate-lib\.mjs';/m);
  });

  it('stage one runs at the top level of main(), after the --skip-tests branch closes, and before the build', () => {
    expect(deploy).toMatch(/\n {2}const poseGate = await enforcePoseGate\(\{ root: ROOT, baseRef: lastDeployedSha\(ROOT\), log, fail \}\);\n/);
    const skipBranch = at('preflight: skipping tsc/vitest (--skip-tests)');
    const stageOne = at('await enforcePoseGate(');
    expect(stageOne).toBeGreaterThan(skipBranch);
    expect(deploy.slice(skipBranch, stageOne)).not.toMatch(/SKIP_TESTS|ALLOW_DIRTY|OWNER_OVERRIDE|process\.argv|args\[/);
    expect(stageOne).toBeLessThan(at("runNpx(['vite', 'build'"));
  });

  it('stage one runs before the release gate that --owner-override reaches, and neither stage names the override or the skip flag', () => {
    expect(at('await enforcePoseGate(')).toBeLessThan(at('= releaseGateFor(plan, mainSha);'));
    for (const call of ['await enforcePoseGate(', 'enforceBuiltPaintings(']) {
      const line = deploy.slice(at(call), deploy.indexOf('\n', at(call)));
      expect(line).not.toMatch(/OVERRIDE|SKIP|ALLOW_DIRTY/i);
    }
  });

  it('stage two judges the build\'s art list after the art references are audited and before anything is published', () => {
    const stageTwo = at('enforceBuiltPaintings({ dist: DIST, result: poseGate, log, fail });');
    expect(stageTwo).toBeGreaterThan(at('auditArtReferences(DIST)'));
    expect(stageTwo).toBeLessThan(at('publishToCloudflare({'));
    expect(stageTwo).toBeLessThan(at('= releaseGateFor(plan, mainSha);'));
  });

  it('says in its header that the pose gate is not relaxed by --owner-override or --skip-tests', () => {
    expect(deploy).toMatch(/--skip-tests {3}skip `npx tsc --noEmit` and `npx vitest run` \(never the pose gate below\)/);
    expect(deploy).toMatch(/Nothing else is relaxed[^\n]*the pose gate/);
  });
});

describe('the rest of the wiring', () => {
  it('`npm test` runs every file under tests/unit, and so the gate\'s', () => {
    expect(JSON.parse(read('package.json')).scripts.test).toBe('vitest run');
    expect(read('vitest.config.ts')).toContain("include: ['tests/unit/**/*.test.ts']");
  });

  it('the install ends in the gate: art-install registers, then runs tools/pose-gate.mjs --check on the installed subjects', () => {
    const lib = read('tools', 'art-install-lib.mjs');
    expect(lib).toContain("join(root, 'tools', 'pose-gate.mjs'), '--check', '--art', art, '--root', root, '--subjects', subjects.join(',')");
    expect(lib.indexOf("['measure', python")).toBeLessThan(lib.indexOf("['table', python"));
    expect(lib.indexOf("['table', python")).toBeLessThan(lib.indexOf("['gate', process.execPath"));
    const cli = read('tools', 'art-install.mjs');
    expect(cli).toContain('register({ subjects, target, root, python })');
    expect(cli).toMatch(/get\('--target'\)/);
    expect(cli).toMatch(/if \(!target\) \{ console\.error\('art-install: --target <the art folder> is required/); // no default: never public/art by accident
    expect(cli).not.toContain("get('--target',"); // a default would be the second argument
  });

  it('AGENTS.md carries hard rule 16 and the two commands', () => {
    const agents = read('AGENTS.md');
    expect(agents).toMatch(/\n16\. \*\*No painting ships without a pose record or a waiver/);
    expect(agents).toContain("**`tools/art-install.mjs` is the install path for character paintings**");
    expect(agents).toContain("Bailey's own quoted words");
    expect(agents).toContain('neither `--skip-tests` nor `--owner-override` covers it');
    expect(agents).toContain('`node tools/pose-gate.mjs --check`');
  });

  it('docs/ART-PIPELINE.md carries the install steps and the waiver rules', () => {
    const doc = read('docs', 'ART-PIPELINE.md');
    expect(doc).toContain('### Installing character art: the only path');
    for (const needle of ['node tools/art-install.mjs --target', '--replace --backup', 'hard-linked', 'docs/target/pose-waivers.json', "Bailey's own words, quoted", 'stale-reading', 'dist-release']) {
      expect(doc, needle).toContain(needle);
    }
  });
});
