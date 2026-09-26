/**
 * PR-0211: a mid-battle line card sits in a top band, clear of the party.
 *
 * Game case: both (the mid-battle card is shared plumbing; observed on Jecht
 * in Chapter III, FFX, and Shinra in Chapter V, FFX-2). The measured check,
 * party quads against the card at 1600 and 2000, is the batch's capture
 * (docs/screenshots/t1-b4a/pr0211-*).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'ui', 'common', 'cutscene.css'), 'utf8');

describe('PR-0211: the beat card band', () => {
  it('anchors the beat card to the top, above the portrait overhang, on screens wider than a phone', () => {
    const block = /@media \(min-width: 561px\) \{\s*\.battle-midbeat \.dbox \.dbox__win \{([^}]*)\}/.exec(css);
    expect(block, 'the band rule').not.toBeNull();
    const top = /top:\s*([\d.]+)vw/.exec(block![1]!);
    expect(Number(top![1])).toBeGreaterThanOrEqual(6.95);
    expect(block![1]).toMatch(/bottom:\s*auto/);
  });
});
