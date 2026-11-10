/**
 * Test 20 of the FFX-2 Special look (step C1, tooling half; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2, and the pose tooling is both games and unchanged for every
 * other subject).
 *
 * THE PIN (written in the step-0 commit, BEFORE `tools/posescale/pose-kinds.mjs` is edited): `tests/fixtures/specials/subject-kinds.json` is `subjectKind`, `gameOf` and `sideOf` of every
 * subject in `tools/posescale/subjects.json` plus a few ids the tool never lists, taken with the unedited tool. Adding the kind `special-ffx2` must not move any of them.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { gameOf, sideOf, subjectKind } from '../../tools/posescale/pose-kinds.mjs';

const ROOT = resolve(__dirname, '..', '..');

/** The subjects of the registry, plus ids that fall to the default, a namespaced copy and an id that looks like a Special part. */
function subjectIds(): string[] {
  const subjects = JSON.parse(readFileSync(resolve(ROOT, 'tools', 'posescale', 'subjects.json'), 'utf8')) as Record<string, unknown>;
  return [...Object.keys(subjects), 'exp-leblanc-yuna-gunner', 'ff7-cloud', 'nobody-at-all', 'yuna-floral-fallal-extra', 'floral-fallal'];
}

describe('the pose kinds of every existing subject, pinned', () => {
  it('matches the snapshot taken with the unedited pose-kinds.mjs', async () => {
    const rows = subjectIds().map((id) => ({ id, kind: subjectKind(id), game: gameOf(id, undefined), side: sideOf(id) }));
    expect(rows.length).toBeGreaterThan(150);
    await expect(rows.map((r) => `${r.id} ${r.kind} ${r.game} ${r.side}`).join('\n') + '\n').toMatchFileSnapshot('../fixtures/specials/subject-kinds.txt');
  });
});
