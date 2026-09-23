/**
 * Chapter 6 (Leblanc) party art keys — regression guard.
 *
 * `docs/handoff/chapter-leblanc-scene.md` §6 documented a gap: the staged
 * preview (`src/scenes/leblanc-last-room-painted.ts`) asked
 * `PaintedActor.fromSubject` for a bare `paine` painted subject. That id does
 * not exist — Paine only has `portraits`/`pause` art under the bare id; her
 * full-body paintings are dressphere-keyed, the convention every FFX-2 girl's
 * art id follows (`src/engine/BattlePresenterArt.ts` class doc: `<girl>-
 * <dressphere>`, e.g. `paine-warrior`, `yuna-white-mage`). The preview fell
 * back to a placeholder tinted like Rikku, third girl from the left.
 *
 * The real battle never had this bug: `BattlePresenterArt.ts::artIdFor`
 * already derives `<id>-<dresspheres.current>` from the live combatant, which
 * is exactly `chateauBuild`'s own `spriteKey` per member. The preview scene
 * now reads that same `spriteKey` (`girlSpriteKey()` in
 * `leblanc-last-room-painted.ts`) instead of the bare id, so this test pins
 * two things: Chapter 6's party keys resolve to real manifest subjects with a
 * painted idle pose, using the *exact same convention* Chapter 4's
 * (`bevelleBuild`) party keys already use — and that the bare `paine` id
 * this bug asked for is still not a real character subject, so a future
 * regression back to it fails here first instead of silently tinting Rikku.
 *
 * `public/art/` is gitignored (AGENTS.md map), so this reads whatever the
 * local art fleet has actually produced — the same assumption
 * `tests/unit/party-face-manifest.test.ts` already makes.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Chapters 4 and 6 are both
 * FFX-2; nothing here touches the FFX (CTB) side.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bevelleBuild } from '../../../src/data/ffx2/builds/bevelle.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';

interface Manifest {
  portraits: string[];
  subjects: Record<string, { states: string[] }>;
}

const ROOT = resolve(__dirname, '../../..');
const manifest = JSON.parse(
  readFileSync(resolve(ROOT, 'public/art/manifest.json'), 'utf8'),
) as Manifest;

const BUILDS = [
  ['ffx2-bahamut (Chapter 4)', bevelleBuild],
  ['ffx2-leblanc (Chapter 6)', chateauBuild],
] as const;

describe('Chapter 6 (Leblanc) party sprites resolve the same way Chapter 4 (Bevelle Underground) does', () => {
  for (const [chapterLabel, build] of BUILDS) {
    for (const m of build.members) {
      it(`${chapterLabel}: ${m.name} (${m.spriteKey}) is a dressphere-keyed painted subject with an idle pose`, () => {
        expect(m.spriteKey).toBe(`${m.id}-${m.currentDressphere}`);
        const subject = manifest.subjects[m.spriteKey!];
        expect(subject, `${m.spriteKey} in public/art/manifest.json`).toBeDefined();
        expect(subject!.states).toContain('idle');
      });
    }
  }

  it('Paine has no bare-id painted subject — only her dressphere-keyed paintings do, which is why a scene must key off spriteKey, not the plain id', () => {
    expect(manifest.subjects['paine']).toBeUndefined();
    // The portrait/pause card art she does have under the bare id is a
    // different asset family (`hasPortraitArt`/`hasPauseArt`), not a
    // full-body `characters/paine/<pose>.png` subject.
    expect(manifest.portraits).toContain('paine');
  });

  it('Chapter 6 gives Paine the same spriteKey Chapter 4 does (both "warrior" here)', () => {
    const ch4Paine = bevelleBuild.members.find((m) => m.id === 'paine');
    const ch6Paine = chateauBuild.members.find((m) => m.id === 'paine');
    expect(ch4Paine?.spriteKey).toBe('paine-warrior');
    expect(ch6Paine?.spriteKey).toBe('paine-warrior');
  });
});
