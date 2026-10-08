/**
 * The key the game finds a recording by is the key the inventory and the ship step write.
 *
 * `lineKey` (src/story/voice/voiceKey.ts) must equal every row's `textHash` in docs/audio/voice-line-inventory.json, which is what
 * tools/audio/voice-inventory.mjs computes with its own copy of cyrb53. If the two drift, every recording silently stops matching
 * its line: this is the pin. Game case: both (shared plumbing).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { hash53, keyFor, lineKey } from '../../src/story/voice/voiceKey.ts';

interface InventoryLine {
  id: string;
  speaker: string;
  text: string;
  textHash: string;
}
const inventory = JSON.parse(readFileSync(new URL('../../docs/audio/voice-line-inventory.json', import.meta.url), 'utf8')) as { lines: InventoryLine[] };

describe('voice line keys', () => {
  it('equals the inventory textHash of every line (speaker NUL text)', () => {
    expect(inventory.lines.length).toBeGreaterThan(900);
    const wrong = inventory.lines.filter((l) => lineKey(l.speaker, l.text) !== l.textHash).map((l) => l.id);
    expect(wrong, `lines whose key drifted from the inventory: ${wrong.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('is 14 lowercase hex digits, deterministic, and pinned for a known line', () => {
    expect(lineKey('kimahri', 'Kimahri knows this one. And this one.')).toBe('04f446bb281ef1');
    for (const l of inventory.lines.slice(0, 50)) expect(lineKey(l.speaker, l.text)).toMatch(/^[0-9a-f]{14}$/);
    expect(lineKey('tidus', 'Hey!')).toBe(lineKey('tidus', 'Hey!'));
  });

  it('separates the speaker from the text, so the same words by another speaker are another key', () => {
    expect(lineKey('tidus', 'Yes.')).not.toBe(lineKey('yuna', 'Yes.'));
    expect(lineKey('tidus', 'ab')).not.toBe(lineKey('tida', 'sab')); // the NUL separator keeps "tidus"+"ab" from colliding with a shifted split
    expect(lineKey('tidus', 'Yes.')).not.toBe(lineKey('tidus', 'Yes!'));
  });

  it('hash53 is a 53-bit integer', () => {
    const h = hash53('Echoes of Spira');
    expect(Number.isSafeInteger(h)).toBe(true);
    expect(h).toBeLessThan(2 ** 53);
    expect(hash53('a', 1)).not.toBe(hash53('a', 2));
  });

  it('a SayStep.voiceKey names the recording and wins over the hash; an empty one does not', () => {
    expect(keyFor({ who: 'yuna-x2', text: 'Um.', voiceKey: 'yuna-lenne-doubled' })).toBe('yuna-lenne-doubled');
    expect(keyFor({ who: 'tidus', text: 'Hey!', voiceKey: '' })).toBe(lineKey('tidus', 'Hey!'));
    expect(keyFor({ who: 'tidus', text: 'Hey!' })).toBe(lineKey('tidus', 'Hey!'));
  });
});
