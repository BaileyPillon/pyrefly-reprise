/**
 * The recordings in memory: chapter manifests, decoded buffers and the cache that holds them.
 *
 * A chapter's lines are per-line files (`public/audio/voice/<chapter>/<line id>.mp3`), decoded on demand: a whole chapter's speech
 * decoded at once would be tens of megabytes on a phone, and a scene needs only its next few lines. Decoded buffers sit in an LRU
 * with a byte cap; a chapter's mid-battle and victory lines are pinned so a beat starts with no latency and the cache cannot drop
 * them mid-fight. Every network and decoder call is injected, so the cache, the dedupe of in-flight requests and the eviction order
 * are tested without a browser or an AudioContext.
 *
 * A failure of any kind (404, an HTML fallback page, a decode error) answers `null`: the line is text only.
 * Game case: both (shared plumbing); the manifests decide which chapters have voice.
 */

import { chapterManifestPath, parseChapterVoiceManifest, voiceFilePath, type ChapterVoiceManifest, type VoiceLineEntry } from '../../story/voice/voiceManifest.ts';

/** The part of an `AudioBuffer` the cache reads. */
export interface DecodedVoice {
  readonly length: number;
  readonly numberOfChannels: number;
  readonly duration: number;
}

export interface VoiceBankDeps<B extends DecodedVoice> {
  /** Parsed JSON for a URL under `audio/`, or `null` on any failure. */
  fetchJson(path: string): Promise<unknown>;
  /** Raw bytes for a path under `audio/`, or `null` on any failure. */
  fetchBytes(path: string): Promise<ArrayBuffer | null>;
  /** Decode with the live context; `null` when there is no context or the bytes do not decode. */
  decode(bytes: ArrayBuffer): Promise<B | null>;
}

/** Decoded cache cap, in bytes of float32 PCM (the design's 16 MB, plus room for a pinned chapter set). */
export const VOICE_CACHE_BYTES = 24e6;

interface Slot<B> {
  buffer: B;
  bytes: number;
  used: number;
}

const bytesOf = (b: DecodedVoice): number => b.length * b.numberOfChannels * 4;

export class VoiceBank<B extends DecodedVoice> {
  private readonly manifests = new Map<string, ChapterVoiceManifest | null>();
  private readonly manifestLoads = new Map<string, Promise<ChapterVoiceManifest | null>>();
  private readonly slots = new Map<string, Slot<B>>();
  private readonly loading = new Map<string, Promise<B | null>>();
  private readonly failed = new Set<string>();
  private pinned = new Set<string>();
  private tick = 0;
  /** Files requested over the network, in order (the tests and `debug()` read it). */
  readonly requests: string[] = [];

  constructor(private readonly deps: VoiceBankDeps<B>, private readonly capBytes = VOICE_CACHE_BYTES) {}

  // ------------------------------------------------------------- manifests

  /** Fetch a chapter's manifest once; a miss (no file, bad JSON) is remembered as `null`. */
  loadChapter(chapter: string): Promise<ChapterVoiceManifest | null> {
    if (this.manifests.has(chapter)) return Promise.resolve(this.manifests.get(chapter) ?? null);
    const inflight = this.manifestLoads.get(chapter);
    if (inflight) return inflight;
    const path = chapterManifestPath(chapter);
    this.requests.push(path);
    const load = this.deps
      .fetchJson(path)
      .then((raw) => parseChapterVoiceManifest(raw, chapter))
      .catch(() => null)
      .then((manifest) => {
        this.manifests.set(chapter, manifest);
        this.manifestLoads.delete(chapter);
        return manifest;
      });
    this.manifestLoads.set(chapter, load);
    return load;
  }

  /** The entry for a key once the chapter's manifest has loaded; `null` before that, or when the line has no recording. */
  entry(chapter: string | null, key: string): VoiceLineEntry | null {
    if (!chapter) return null;
    return this.manifests.get(chapter)?.lines[key] ?? null;
  }

  manifest(chapter: string): ChapterVoiceManifest | null {
    return this.manifests.get(chapter) ?? null;
  }

  // --------------------------------------------------------------- buffers

  /** A decoded buffer if it is already in memory (and counts as used). */
  peek(file: string): B | null {
    const slot = this.slots.get(file);
    if (!slot) return null;
    slot.used = ++this.tick;
    return slot.buffer;
  }

  /** Fetch and decode a file, once however many callers ask; `null` when it cannot be had. */
  ensure(file: string): Promise<B | null> {
    const have = this.peek(file);
    if (have) return Promise.resolve(have);
    if (this.failed.has(file)) return Promise.resolve(null);
    const inflight = this.loading.get(file);
    if (inflight) return inflight;
    this.requests.push(voiceFilePath(file));
    const load = this.deps
      .fetchBytes(voiceFilePath(file))
      // A file that would not come (offline, a 404) is tried again at the next line; one that came but would not decode is bad, and stays failed.
      .then(async (bytes) => (bytes ? { buffer: await this.deps.decode(bytes), bad: true } : { buffer: null, bad: false }))
      .catch(() => ({ buffer: null, bad: false }))
      .then(({ buffer, bad }) => {
        this.loading.delete(file);
        if (!buffer) {
          if (bad) this.failed.add(file);
          return null;
        }
        this.slots.set(file, { buffer, bytes: bytesOf(buffer), used: ++this.tick });
        this.evict();
        return buffer;
      });
    this.loading.set(file, load);
    return load;
  }

  /** Forget a failure so the next request tries again (the context was not running the first time). */
  retry(file: string): void {
    this.failed.delete(file);
  }

  /** Keep these files out of eviction (a chapter's mid-battle and victory lines). Replaces the previous set. */
  pin(files: Iterable<string>): void {
    this.pinned = new Set(files);
  }

  /** Drop every buffer and manifest (a new context, a test). */
  clear(): void {
    this.manifests.clear();
    this.manifestLoads.clear();
    this.slots.clear();
    this.loading.clear();
    this.failed.clear();
    this.pinned = new Set();
  }

  /** Free the least recently used unpinned buffers until the cache fits its cap. */
  private evict(): void {
    let total = this.decodedBytes;
    if (total <= this.capBytes) return;
    const order = [...this.slots.entries()].filter(([file]) => !this.pinned.has(file)).sort((a, b) => a[1].used - b[1].used);
    for (const [file, slot] of order) {
      if (total <= this.capBytes) break;
      this.slots.delete(file);
      total -= slot.bytes;
    }
  }

  get decodedBytes(): number {
    let total = 0;
    for (const slot of this.slots.values()) total += slot.bytes;
    return total;
  }

  stats(): { manifests: string[]; buffers: number; decodedBytes: number; pinned: number; failed: number; requests: number } {
    return { manifests: [...this.manifests.entries()].filter(([, m]) => m).map(([c]) => c), buffers: this.slots.size, decodedBytes: this.decodedBytes, pinned: this.pinned.size, failed: this.failed.size, requests: this.requests.length };
  }
}
