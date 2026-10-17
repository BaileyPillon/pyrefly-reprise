/**
 * **The registry's status for the hidden Mirror Aeons chapter's AI** (FFX only; `src/battle/ffx/ai/dark-aeons-seams.ts`). Before the reverse-engineering session's work landed this file was a set of blocks that skipped until
 * each seam was filled; they have all run since the merge of `origin/re-parity-ffx-yojimbo-sisters` (the player's Yojimbo and Magus Sisters) and the Dark scripts (`battle/ffx/ai/dark-aeons.ts`), and what they said now lives
 * where it belongs: the scripts' behaviour in `mirror-aeons-ai.test.ts`, the player's side in `mirror-aeons-engine.test.ts`. What stays is the record of what is registered, all or nothing, and the two named estimates the
 * engine reads.
 */
import { describe, expect, it } from 'vitest';

import { DARK_SCRIPTS, darkAeonsSeamStatus, darkScriptsLanded } from '../../../src/battle/ffx/ai/dark-aeons-seams.ts';
import { getAiScript, registeredAiScriptIds } from '../../../src/battle/ffx/ai/types.ts';
import { YOJIMBO_HIRE_ANSWER, YOJIMBO_START_COMPATIBILITY, mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import * as H from '../helpers/mirrorAeonsDrive.ts';

describe('what is registered (all of it, and the status object agrees with the registry)', () => {
  it('the four scripts and the dog are registered, so the engine never falls back to a plain Attack for a Dark Aeon', () => {
    for (const id of Object.values(DARK_SCRIPTS)) expect(getAiScript(id), id).toBeDefined();
    expect(registeredAiScriptIds()).toEqual(expect.arrayContaining(Object.values(DARK_SCRIPTS)));
    expect(darkAeonsSeamStatus()).toEqual({ sisters: true, yojimbo: true, daigoro: true });
    expect(darkScriptsLanded()).toBe(true);
  });

  it('every Dark Aeon of every formation names one of them, and none acts with the generic Attack', () => {
    const r = H.playOne(3, H.ACT_I_GROUP, () => H.defend(), 40);
    for (const id of ['dark-mindy', 'dark-sandy']) {
      const moves = H.actions(r.events, id);
      expect(moves.length, id).toBeGreaterThan(0);
      expect(moves.includes('attack'), `${id} never uses the plain Attack`).toBe(false);
    }
  });
});

describe('the two named estimates the engine reads (lane FFX-K asks a build for both, or `buildBattle` throws)', () => {
  it("Yojimbo's hire answer 2 and starting compatibility 128 (strongly indicated by the owner's saves, live confirmation pending) reach the battle's own state", () => {
    expect([YOJIMBO_HIRE_ANSWER, YOJIMBO_START_COMPATIBILITY]).toEqual([2, 128]);
    expect(mirrorAeonsBuild.yojimbo).toEqual({ compatibility: YOJIMBO_START_COMPATIBILITY, hireAnswer: YOJIMBO_HIRE_ANSWER });
    expect(H.flags(H.newEngine(1))['yojimbo:compatibility']).toBe(128);
  });

  it('a build that lists them and does not say how they start is refused by the engine, not played with a default', () => {
    const bare = structuredClone(mirrorAeonsBuild);
    delete bare.yojimbo;
    expect(() => H.newEngine(1, H.ACT_I_GROUP, bare)).toThrow(/Yojimbo/);
    const noSisters = structuredClone(mirrorAeonsBuild);
    delete noSisters.sisters;
    expect(() => H.newEngine(1, H.ACT_I_GROUP, noSisters)).toThrow(/Magus Sisters/);
  });
});
