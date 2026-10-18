/**
 * How the game finds the recording for a line: a hash of what the dialogue box holds.
 *
 * `tools/audio/voice-inventory.mjs` writes the same hash into `docs/audio/voice-line-inventory.json` as each line's `textHash`
 * (and `tools/audio/voice-ship.mjs` keys a chapter's voice manifest by it); a unit test pins this function to every row of that
 * inventory. An edited line therefore hashes to something no manifest has and simply plays silent (subtitle only) until it is
 * recorded again, which is the intended failure: the old take no longer says what the box prints.
 *
 * Pure and erasable-only TypeScript (no enum, no parameter properties): the Node tools import this file through type stripping.
 * Game case: both (shared plumbing); which chapters have recordings is decided by the manifests and `gameHasVoice`.
 */

/** cyrb53 (public domain): a synchronous 53-bit hash of a string, the same function the inventory tool uses. */
export function hash53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** The key of a line: 14 hex digits of `hash53(speaker NUL text)`, where speaker is the `SayStep.who` (`'narrator'` for a narrate step). */
export function lineKey(who: string, text: string): string {
  return hash53(`${who}\u0000${text}`).toString(16).padStart(14, '0');
}

/** What the box knows about a line it is about to print. */
export interface VoiceLineRequest {
  /** `SayStep.who`, or `'narrator'` for a narrate step. */
  who: string;
  /** The text the box prints, exactly as the script (or a stand-in) wrote it. */
  text: string;
  /** `SayStep.voiceKey`: when present it names the recording and wins over the hash (a line with two takes of the same words). */
  voiceKey?: string;
}

/** The manifest key for a request. */
export function keyFor(req: VoiceLineRequest): string {
  return req.voiceKey && req.voiceKey.length > 0 ? req.voiceKey : lineKey(req.who, req.text);
}
