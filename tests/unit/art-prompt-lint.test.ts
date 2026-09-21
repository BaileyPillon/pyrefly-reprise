/**
 * `tools/gen/comfy.mjs` pose-prompt lint — `lintSpritePrompt`,
 * `EFFECTS_BANNED_TOKENS`, `EFFECTS_NEGATIVE`.
 *
 * 2026-09-21 incident: a `yuna-dark-knight` `attack` render prompted with
 * `holding greatsword, dark aura, black and purple, attacking, dynamic pose,
 * action pose` (plus the pipeline's own `simple background, white
 * background`) came back as a coloured swirl with duplicated blades and
 * mangled limbs — `docs/ART-PIPELINE.md` §2 item 4 had already named
 * `motion lines`/`action pose` as causing exactly this, but a written warning
 * was not enough. These tests pin down that the lint actually removes the
 * words that cause it, leaves everything else (including the pipeline's own
 * background phrase) alone, and stays out of the two compositions that have
 * no business with it.
 */
import { describe, expect, it } from 'vitest';
import {
  EFFECTS_BANNED_TOKENS,
  EFFECTS_NEGATIVE,
  LINTED_COMPOSITIONS,
  SPRITE_NEGATIVE,
  buildBackdropPrompt,
  buildCharacterPrompt,
  lintSpritePrompt,
} from '../../tools/gen/comfy.mjs';

describe('lintSpritePrompt — the incident prompt', () => {
  // The exact tags/poseTags split from the 2026-09-21 yuna-dark-knight attack
  // render (docs/concepts/art4/yuna-dark-knight/attack/cand-1.json).
  const tags =
    '1girl, yuna (ff10-2), final fantasy x-2, safe, solo, brown hair, short hair, ' +
    'single long braid, heterochromia, blue eye, green eye, dark knight, black armor, ' +
    'horned helmet, pauldrons, gauntlets, holding greatsword';
  const poseTags = 'dark aura, black and purple, attacking, dynamic pose, action pose';

  it('strips every banned effect token from --poseTags', () => {
    const result = lintSpritePrompt({ tags, poseTags, composition: 'full' });
    expect(result.poseTags).toBe('black and purple');
    expect(result.tags).toBe(tags); // identity tags are untouched
  });

  it('reports one stripped entry per banned segment, naming the token', () => {
    const result = lintSpritePrompt({ tags, poseTags, composition: 'full' });
    const tokens = result.stripped.map((s) => s.token).sort();
    expect(tokens).toEqual(['action pose', 'attacking', 'aura', 'dynamic pose']);
    expect(result.stripped.every((s) => s.field === 'poseTags')).toBe(true);
    expect(result.stripped.every((s) => s.reason === 'effect')).toBe(true);
  });

  it('comes out of the full prompt assembly without the banned tokens, and with the effects negative', () => {
    const linted = lintSpritePrompt({ tags, poseTags, composition: 'full' });
    const positive = buildCharacterPrompt({
      tags: linted.tags,
      poseTags: linted.poseTags,
      composition: 'full',
      facing: 'right',
    });
    for (const banned of ['dark aura', 'attacking', 'dynamic pose', 'action pose']) {
      expect(positive).not.toContain(banned);
    }
    // The pipeline's own documented sprite background — not a defect, must
    // survive (Bailey's 2026-09-21 correction: never strip "white background"
    // when it already matches the documented composition).
    expect(positive).toContain('simple background, white background');
    // The effects negative rides along on every sprite negative unconditionally.
    for (const tok of ['aura', 'glow', 'motion lines', 'slash effect']) {
      expect(SPRITE_NEGATIVE).toContain(tok);
    }
  });
});

describe('lintSpritePrompt — weighted tags', () => {
  it('catches a banned word inside a fully-wrapped weight group', () => {
    const result = lintSpritePrompt({
      tags: 'test',
      poseTags: '(dark aura:1.2), standing',
      composition: 'full',
    });
    expect(result.poseTags).toBe('standing');
    expect(result.stripped).toEqual([
      expect.objectContaining({ segment: '(dark aura:1.2)', token: 'aura', reason: 'effect' }),
    ]);
  });

  it('catches a banned word inside a partially-wrapped weight group', () => {
    const result = lintSpritePrompt({
      tags: 'test',
      poseTags: 'dark (aura:1.2), standing',
      composition: 'full',
    });
    expect(result.poseTags).toBe('standing');
    expect(result.stripped[0]?.token).toBe('aura');
  });

  it('reports the more specific phrase, not both, when a segment matches two tokens', () => {
    // "slash" and "slash effect" are both banned; the segment should be
    // charged to the longer, more specific phrase once, not twice.
    const result = lintSpritePrompt({ tags: 'test', poseTags: 'slash effect', composition: 'full' });
    expect(result.stripped).toHaveLength(1);
    expect(result.stripped[0]?.token).toBe('slash effect');
  });

  it('matches whole words only — "auras" style false-positives are not the goal, but a bare token inside a longer word is not banned', () => {
    // "energy" is banned; "energetic" is a different word and should survive.
    const result = lintSpritePrompt({ tags: 'test', poseTags: 'energetic pose', composition: 'full' });
    expect(result.poseTags).toContain('energetic pose');
    expect(result.stripped).toHaveLength(0);
  });
});

describe('lintSpritePrompt — every banned token, individually', () => {
  it.each(EFFECTS_BANNED_TOKENS)('strips "%s" on its own', (token) => {
    const result = lintSpritePrompt({ tags: 'test', poseTags: `standing, ${token}`, composition: 'full' });
    expect(result.poseTags).toBe('standing');
    expect(result.stripped).toHaveLength(1);
  });
});

describe('lintSpritePrompt — scope: sprites only', () => {
  it('is a no-op for --composition portrait', () => {
    const poseTags = 'dark aura, action pose';
    const result = lintSpritePrompt({ tags: 'test', poseTags, composition: 'portrait' });
    expect(result.poseTags).toBe(poseTags);
    expect(result.stripped).toHaveLength(0);
    expect(LINTED_COMPOSITIONS).not.toContain('portrait');
  });

  it('lints full, boss and prone', () => {
    for (const composition of ['full', 'boss', 'prone']) {
      const result = lintSpritePrompt({ tags: 'test', poseTags: 'dynamic pose', composition });
      expect(result.stripped).toHaveLength(1);
    }
  });

  it('never touches a backdrop prompt — runBackdrop does not call the lint at all', () => {
    // Backdrops legitimately want words this list bans for sprites (a
    // battlefield backdrop wants smoke, lightning, an explosion in the
    // distance). buildBackdropPrompt is the actual code path runBackdrop
    // uses, and it must carry these through untouched.
    const positive = buildBackdropPrompt({
      tags: 'ruined city at night, smoke, lightning, distant explosion',
    });
    for (const word of ['smoke', 'lightning', 'explosion']) {
      expect(positive).toContain(word);
    }
  });
});

describe('lintSpritePrompt — leaves everything else alone', () => {
  it('keeps ordinary costume/identity tags verbatim', () => {
    const result = lintSpritePrompt({
      tags: '1boy, tidus, final fantasy x, blonde hair, holding sword',
      poseTags: 'fighting stance, sword resting on shoulder, confident smile',
      composition: 'full',
    });
    expect(result.tags).toBe('1boy, tidus, final fantasy x, blonde hair, holding sword');
    expect(result.poseTags).toBe('fighting stance, sword resting on shoulder, confident smile');
    expect(result.stripped).toHaveLength(0);
  });

  it('does not touch "white background" when it already matches the documented sprite background', () => {
    // CHARACTER_COMPOSITION/BOSS_COMPOSITION/PORTRAIT_COMPOSITION/
    // PRONE_COMPOSITION all say "simple background, white background" today,
    // so a caller who (redundantly) writes it themselves must not have it
    // stripped — Bailey's 2026-09-21 correction.
    const result = lintSpritePrompt({
      tags: 'test, simple background, white background',
      poseTags: 'standing',
      composition: 'full',
    });
    expect(result.tags).toContain('white background');
    expect(result.stripped).toHaveLength(0);
  });
});

describe('EFFECTS_NEGATIVE', () => {
  it('is folded into SPRITE_NEGATIVE unconditionally', () => {
    for (const tok of EFFECTS_NEGATIVE.split(',').map((s) => s.trim())) {
      expect(SPRITE_NEGATIVE).toContain(tok);
    }
  });
});
