// @vitest-environment jsdom
/**
 * SFX parity, the plumbing (decision 52m, both games): a third source, `manifest.sfxParity.packs`, consulted first,
 * with the v2 slice and the first-bank cue as fallback, so a cue is never silent. Packs are cut by game and by boss.
 *
 * What this pins: the manifest parser (additive, tolerant), the pack table (rule 14: a game never fetches another
 * game's pack), the lookup order and fallbacks in `SfxSprites`, the mixer applying the P1 trim to a v2 slice and not
 * to a parity original, the chapter run asking for and giving back its packs, and the shipped manifest's packs
 * against the files and rows it names (vacuous while none has shipped; strict the day one does).
 */
import { readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioManager, audio } from '../../src/audio/AudioManager.ts';
import { EMPTY_MANIFEST, parseManifest, type AudioManifest } from '../../src/audio/manifest.ts';
import { SfxSprites } from '../../src/audio/SfxSprites.ts';
import { V2_CUES } from '../../src/audio/sfxV2/cues.ts';
import { rowTarget, type MixFile } from '../../src/audio/sfxV2/parityDerive.ts';
import { BOSS_PACKS, PARITY_PACK_NAME, corePack, packsFor } from '../../src/audio/sfxV2/packs.ts';
import { parityTrimDb } from '../../src/audio/sfxV2/parityMix.ts';
import { setSfxGame } from '../../src/audio/sfxV2/voicing.ts';
import { sfxChapter } from '../../src/app/sfxGame.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { AUDIO_BUDGET_BYTES } from '../../tools/audio/manifest-io.mjs';
import { lintPrompt } from '../../tools/audio/sfx-parity-lint.mjs';

// jsdom replaces the global URL, which `fs` then refuses: plain paths here.
const ROOT = resolve(import.meta.dirname, '../..');
const AUDIO_DIR = join(ROOT, 'public', 'audio');

const cue = (offset: number, game?: 'ffx' | 'ffx2' | 'both') => ({ offset, duration: 0.4, ...(game ? { game, lufs: -20, truePeakDb: -6, specRow: 'ffx2.test.row' } : {}) });
const raw = {
  version: 1,
  sampleRate: 44100,
  music: {},
  sfx: { file: 'sfx/sprite.mp3', duration: 10, cues: { 'hit-2': { offset: 0.05, duration: 0.3 } } },
  sfxV2: {
    file: 'sfx/sprite-v2.mp3',
    duration: 20,
    cues: { 'hit-gun': { offset: 1, duration: 0.5 }, 'shot-gun': { offset: 2, duration: 0.5 }, fire: { offset: 3, duration: 0.5 }, shell: { offset: 4, duration: 0.5 } },
  },
  sfxParity: {
    packs: {
      'ffx2-core': { file: 'sfx/parity-ffx2-core.mp3', duration: 5, cues: { 'hit-gun': cue(0.05, 'ffx2'), 'tick-both': cue(0.6, 'both'), 'ffx-only': cue(1.2, 'ffx') } },
      'ffx2-leblanc': { file: 'sfx/parity-ffx2-leblanc.mp3', duration: 3, cues: { 'hit-gun': cue(0.05, 'ffx2') } },
    },
  },
};

// ---------------------------------------------------------------- the manifest

describe('the manifest\'s third source', () => {
  it('has an empty pack list by default and for any junk', () => {
    expect(EMPTY_MANIFEST.sfxParity).toEqual({ packs: {} });
    for (const junk of [null, 42, {}, { sfxParity: 'no' }, { sfxParity: { packs: 'no' } }, { sfxParity: { packs: [] } }]) {
      expect(parseManifest(junk).sfxParity, JSON.stringify(junk)).toEqual({ packs: {} });
    }
    // The shipped manifest, and a manifest written before the key existed, both parse to "no packs".
    expect(parseManifest({ ...raw, sfxParity: undefined }).sfxParity).toEqual({ packs: {} });
  });

  it('reads a pack with its record fields, and only a pack\'s own cues keep them', () => {
    const m = parseManifest({ ...raw, sfxParity: { packs: { 'ffx2-core': { ...raw.sfxParity.packs['ffx2-core'], cues: { a: { offset: 0.05, duration: 0.4, game: 'ffx2', lufs: -24, truePeakDb: -8.1, specRow: 'ffx2.lb.warrior.swing', onsetMs: 0, peakMs: 70 } } } } } });
    expect(m.sfxParity.packs['ffx2-core']!.cues['a']).toEqual({ offset: 0.05, duration: 0.4, game: 'ffx2', lufs: -24, truePeakDb: -8.1, specRow: 'ffx2.lb.warrior.swing', onsetMs: 0, peakMs: 70 });
    expect(m.sfxV2!.cues['hit-gun']).toEqual({ offset: 1, duration: 0.5 }); // the older sprites' cues stay as they were
  });

  it('drops only what is bad: a pack with a bad name, no cues or a bad cue', () => {
    const m = parseManifest({
      ...raw,
      sfxParity: {
        packs: {
          'ffx2-core': { file: 'sfx/a.mp3', duration: 1, cues: { good: { offset: 0, duration: 0.2, game: 'ffx2' }, bad: { offset: 'x', duration: 0.2 }, odd: { offset: 0, duration: 0.2, game: 'ff7', lufs: 'loud' } } },
          'Bad Name': { file: 'sfx/b.mp3', duration: 1, cues: { a: { offset: 0, duration: 0.2 } } },
          'ffx-empty': { file: 'sfx/c.mp3', duration: 1, cues: {} },
          'ffx-nofile': { duration: 1, cues: { a: { offset: 0, duration: 0.2 } } },
        },
      },
    });
    expect(Object.keys(m.sfxParity.packs)).toEqual(['ffx2-core']);
    expect(Object.keys(m.sfxParity.packs['ffx2-core']!.cues).sort()).toEqual(['good', 'odd']);
    expect(m.sfxParity.packs['ffx2-core']!.cues['odd']).toEqual({ offset: 0, duration: 0.2 }); // an unknown game and a non-number level are ignored, the cue stays
  });
});

// ---------------------------------------------------------------- the pack table

describe('which packs a chapter run loads (rule 14)', () => {
  it('lists the boss packs first and the game\'s core pack last', () => {
    expect(packsFor('ffx', 'seymour-flux')).toEqual(['ffx-flux', 'ffx-core']);
    expect(packsFor('ffx2', 'ffx2-vegnagun-shuyin')).toEqual(['ffx2-machina', 'ffx2-shuyin', 'ffx2-core']);
    expect(packsFor('ffx2', 'ffx2-leblanc')).toEqual(['ffx2-leblanc', 'ffx2-core']);
    expect(packsFor('ffx2', 'exp-leblanc')).toEqual(['ffx2-leblanc', 'ffx2-core']); // the hidden Leblanc chapter plays the same fight
  });

  it('gives a chapter with no boss pack its game\'s core alone, and no chapter at all the core alone', () => {
    expect(packsFor('ffx', 'seymour-natus')).toEqual(['ffx-core']);
    expect(packsFor('ffx2', null)).toEqual(['ffx2-core']);
    expect(corePack('ffx2')).toBe('ffx2-core');
  });

  it('never hands a game another game\'s pack, and every table entry is a chapter of its own game', () => {
    expect(packsFor('ffx', 'ffx2-leblanc')).toEqual(['ffx-core']);
    expect(packsFor('ffx2', 'seymour-flux')).toEqual(['ffx2-core']);
    for (const [id, packs] of Object.entries(BOSS_PACKS)) {
      const chapter = getChapter(id);
      expect(chapter, `${id} is not a chapter`).toBeDefined();
      for (const pack of packs) {
        expect(pack, id).toMatch(PARITY_PACK_NAME);
        expect(pack.startsWith(`${chapter!.game}-`), `${id} (${chapter!.game}) names ${pack}`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------- the lookup

interface Marker { url: string }

function stubLoading(): { fetched: string[]; ctx: AudioContext; fail: Set<string> } {
  const fetched: string[] = [];
  const fail = new Set<string>();
  vi.stubGlobal('fetch', async (url: string | URL) => {
    const u = String(url);
    fetched.push(u);
    if ([...fail].some((f) => u.includes(f))) return { ok: false, arrayBuffer: async () => new ArrayBuffer(0) };
    return { ok: true, arrayBuffer: async () => new TextEncoder().encode(u).buffer };
  });
  const ctx = { decodeAudioData: async (b: ArrayBuffer): Promise<Marker> => ({ url: new TextDecoder().decode(b) }) } as unknown as AudioContext;
  return { fetched, ctx, fail };
}

afterEach(() => {
  vi.unstubAllGlobals();
  setSfxGame(null);
  audio.releaseParityPacks();
});

describe('SfxSprites: parity pack, then v2 slice, then the first-bank cue', () => {
  const manifest = parseManifest(raw);

  it('plays the v2 slice, with the P1 trim, when no pack is active; a parity original is not trimmed', async () => {
    const { ctx } = stubLoading();
    const sprites = new SfxSprites();
    await sprites.load(ctx, manifest, '/');
    const trim = parityTrimDb('ffx2', 'shell');
    expect(trim, 'the example cue is a real cut in the shipped table').toBeLessThan(-1);
    const v2 = sprites.pick(manifest, 'v2:shell', 'ffx2');
    expect(v2.via).toBe('v2');
    expect(v2.slice?.cue).toEqual({ offset: 4, duration: 0.5 });
    expect(v2.gain).toBeCloseTo(10 ** (trim / 20), 6); // a retail-ratio cut (FFX-2 Shell)
    expect(sprites.pick(manifest, 'v2:hit-gun', 'ffx2').gain).toBe(1); // the FFX-2 party blow keeps today's level (52n: the floor is the class level)
    expect(sprites.pick(manifest, 'v2:fire', 'ffx').gain).toBeCloseTo(10 ** (1 / 20), 6);
    expect(sprites.pick(manifest, 'v2:shot-gun', null).gain).toBe(1); // no chapter, no trim
    await sprites.loadPacks(ctx, manifest, '/', ['ffx2-core']);
    sprites.setActivePacks(['ffx2-core']);
    const parity = sprites.pick(manifest, 'v2:hit-gun', 'ffx2');
    expect(parity.via).toBe('parity');
    expect(parity.gain).toBe(1);
    expect((parity.slice!.buffer as unknown as Marker).url).toBe('/audio/sfx/parity-ffx2-core.mp3');
    expect(parity.slice!.cue.offset).toBe(0.05);
  });

  it('consults the boss pack before the core pack, in the order the chapter listed them', async () => {
    const { ctx } = stubLoading();
    const sprites = new SfxSprites();
    await sprites.loadPacks(ctx, manifest, '/', ['ffx2-leblanc', 'ffx2-core']);
    sprites.setActivePacks(['ffx2-leblanc', 'ffx2-core']);
    expect((sprites.pick(manifest, 'v2:hit-gun', 'ffx2').slice!.buffer as unknown as Marker).url).toContain('leblanc');
    sprites.setActivePacks(['ffx2-core', 'ffx2-leblanc']);
    expect((sprites.pick(manifest, 'v2:hit-gun', 'ffx2').slice!.buffer as unknown as Marker).url).toContain('core');
    expect(sprites.decoded.packs.sort()).toEqual(['ffx2-core', 'ffx2-leblanc']);
  });

  it('never lets a pack speak in the wrong game, or in no game, or after the run ends', async () => {
    const { ctx } = stubLoading();
    const sprites = new SfxSprites();
    await sprites.load(ctx, manifest, '/');
    await sprites.loadPacks(ctx, manifest, '/', ['ffx2-core']);
    sprites.setActivePacks(['ffx2-core']);
    expect(sprites.pick(manifest, 'v2:tick-both', 'ffx2').via).toBe('parity'); // a "both" cue in a pack serves either game
    expect(sprites.pick(manifest, 'v2:tick-both', 'ffx').via).toBe('parity');
    expect(sprites.pick(manifest, 'v2:ffx-only', 'ffx2').via).toBeNull(); // an FFX cue is not found by an FFX-2 chapter
    expect(sprites.pick(manifest, 'v2:hit-gun', null).via).toBe('v2'); // no game: no pack
    sprites.setActivePacks([]);
    expect(sprites.pick(manifest, 'v2:hit-gun', 'ffx2').via).toBe('v2'); // the run ended: the decoded buffer stays cached, unused
    expect(sprites.decoded.packs).toEqual(['ffx2-core']);
  });

  it('is never silent: a pack still loading, a pack that failed, and a cue nothing holds all fall back', async () => {
    const { ctx, fail } = stubLoading();
    const sprites = new SfxSprites();
    // Nothing decoded at all: a v2 key names its first-bank stand-in.
    sprites.setActivePacks(['ffx2-core']);
    for (const name of Object.keys(V2_CUES)) {
      const p = sprites.pick(manifest, `v2:${name}`, V2_CUES[name]!.game === 'ffx' ? 'ffx' : 'ffx2');
      expect(p.slice, name).toBeNull();
      expect(p.fallback, name).toBe(V2_CUES[name]!.fallback);
    }
    // The pack's fetch fails (404): the v2 slice plays.
    fail.add('parity-ffx2-core');
    await sprites.load(ctx, manifest, '/');
    await sprites.loadPacks(ctx, manifest, '/', ['ffx2-core']);
    expect(sprites.decoded.packs).toEqual([]);
    expect(sprites.pick(manifest, 'v2:hit-gun', 'ffx2').via).toBe('v2');
    // A cue neither the packs nor the v2 sprite hold: the first-bank cue.
    const none = sprites.pick(manifest, 'v2:cursor-move', 'ffx');
    expect(none).toMatchObject({ slice: null, fallback: 'cursor-move', via: null });
  });

  it('fetches only packs the manifest lists, once each, and never throws', async () => {
    const { ctx, fetched } = stubLoading();
    const sprites = new SfxSprites();
    await sprites.loadPacks(ctx, manifest, '/', ['ffx-flux', 'ffx2-core', 'ffx2-core']);
    await sprites.loadPacks(ctx, manifest, '/', ['ffx2-core']);
    expect(fetched).toEqual(['/audio/sfx/parity-ffx2-core.mp3']);
    await expect(sprites.loadPacks(ctx, null, '/', ['ffx2-core'])).resolves.toBeUndefined();
    vi.stubGlobal('fetch', async () => { throw new Error('offline'); });
    await expect(new SfxSprites().loadPacks(ctx, manifest, '/', ['ffx2-leblanc'])).resolves.toBeUndefined();
  });

  it('leaves the first-bank path exactly as it was', async () => {
    const { ctx } = stubLoading();
    const sprites = new SfxSprites();
    await sprites.load(ctx, manifest, '/');
    expect(sprites.pick(manifest, 'hit-2')).toMatchObject({ via: 'sprite', gain: 1, fallback: null });
    expect(sprites.pick(manifest, 'no-such-cue')).toMatchObject({ slice: null, via: null });
  });
});

// ---------------------------------------------------------------- the mixer

interface Played { buffer: unknown; offset?: number; duration?: number; gain: number }

function mixer(game: 'ffx' | 'ffx2' | null, packs: { name: string; buffer: unknown }[] = []): { am: AudioManager; played: Played[]; inner: Record<string, unknown> } {
  const am = new AudioManager({ useWorker: false, synthOnly: true });
  const inner = am as unknown as Record<string, unknown> & { sprites: Record<string, unknown> };
  const played: Played[] = [];
  let lastGain = { gain: { value: 1 } };
  inner['ctx'] = {
    currentTime: 1,
    createBufferSource: () => ({ buffer: null as unknown, playbackRate: { value: 1 }, connect: () => undefined, disconnect: () => undefined, onended: null, start(this: { buffer: unknown }, _when: number, offset?: number, duration?: number) { played.push({ buffer: this.buffer, offset, duration, gain: lastGain.gain.value }); } }),
    createGain: () => (lastGain = { gain: { value: 1 }, connect: () => undefined, disconnect: () => undefined } as never),
    createStereoPanner: () => ({ pan: { value: 0 }, connect: () => undefined, disconnect: () => undefined }),
  };
  inner['sfxBus'] = {};
  inner['manifest'] = parseManifest(raw);
  inner['manifestLoad'] = Promise.resolve();
  const sprites = inner['sprites'] as { v1: unknown; v2: unknown; packs: Map<string, unknown>; active: string[] };
  sprites.v1 = { id: 'v1' };
  sprites.v2 = { id: 'v2' };
  for (const p of packs) sprites.packs.set(p.name, p.buffer);
  sprites.active = packs.map((p) => p.name);
  setSfxGame(game);
  return { am, played, inner };
}

describe('the mixer plays the right source at the right level', () => {
  it('trims a v2 slice by the P1 mix and logs where it came from', () => {
    const { am, played } = mixer('ffx2');
    const trim = parityTrimDb('ffx2', 'shell');
    expect(trim, 'the example cue is a real cut in the shipped table').toBeLessThan(-1);
    am.playSfx('v2:shell');
    am.playSfx('v2:shell', { volume: 0.5 });
    expect(played).toHaveLength(2);
    expect((played[0]!.buffer as { id: string }).id).toBe('v2');
    expect(played[0]!.gain).toBeCloseTo(10 ** (trim / 20), 6);
    expect(played[1]!.gain).toBeCloseTo(0.5 * 10 ** (trim / 20), 6);
    const log = am.debug().sfxLog;
    expect(log.map((r) => r.via)).toEqual(['v2', 'v2']);
    expect(log[0]!.trimDb).toBe(trim);
    // The party's blow keeps today's level (52n): the same call takes no trim and logs none.
    am.playSfx('v2:hit-gun');
    expect(played[2]!.gain).toBeCloseTo(1, 6);
    expect(am.debug().sfxLog[2]!.trimDb).toBeUndefined();
  });

  it('plays a parity original from its pack at its own level, untrimmed', () => {
    const { am, played } = mixer('ffx2', [{ name: 'ffx2-leblanc', buffer: { id: 'leblanc' } }]);
    am.playSfx('v2:hit-gun', { volume: 0.8 });
    expect((played[0]!.buffer as { id: string }).id).toBe('leblanc');
    expect(played[0]!.offset).toBe(0.05);
    expect(played[0]!.gain).toBeCloseTo(0.8, 6);
    expect(am.debug().sfxLog[0]).toMatchObject({ via: 'parity', played: 'v2:hit-gun' });
    expect(am.debug().sfxLog[0]!.trimDb).toBeUndefined();
  });

  it('does not trim the title, chapter select or FF7 (no game), nor a first-bank cue', () => {
    const { am, played } = mixer(null);
    am.playSfx('v2:hit-gun');
    am.playSfx('hit-2');
    expect(played.map((p) => p.gain)).toEqual([1, 1]);
  });

  it('turns the confirm into the cursor\'s tick in a chapter, and leaves it alone outside one', () => {
    for (const [game, cueName] of [['ffx', 'cursor-move'], ['ffx2', 'cursor-move-x2']] as const) {
      const m = parseManifest({ ...raw, sfxV2: { ...raw.sfxV2, cues: { ...raw.sfxV2.cues, [cueName]: { offset: 4, duration: 0.2 } } } });
      const { am, played, inner } = mixer(game);
      inner['manifest'] = m;
      am.playSfx('confirm');
      am.playSfx('cursor-move');
      expect(played.map((p) => p.offset)).toEqual([4, 4]); // one sound for both
      expect(played[0]!.gain).toBeGreaterThan(1.7); // about +5 dB
      setSfxGame(null);
    }
  });
});

describe('a chapter run asks for its packs and gives them back', () => {
  it('requests the game\'s core and the boss pack, then releases them; FF7 and the title ask for none', () => {
    let released = 0;
    const done = sfxChapter('seymour-flux', () => { released++; });
    expect(audio.debug().prerendered.parity.active).toEqual(['ffx-flux', 'ffx-core']);
    done();
    expect(released).toBe(1);
    expect(audio.debug().prerendered.parity.active).toEqual([]);
    const done2 = sfxChapter('ffx2-leblanc', () => undefined);
    expect(audio.debug().prerendered.parity.active).toEqual(['ffx2-leblanc', 'ffx2-core']);
    done2();
    const done3 = sfxChapter('ff7-guard-scorpion', () => undefined);
    expect(audio.debug().prerendered.parity.active).toEqual([]);
    done3();
    expect(audio.debug().prerendered.parity.active).toEqual([]);
  });
});

// ---------------------------------------------------------------- the shipped manifest

describe('the shipped manifest\'s packs', () => {
  const shippedRaw = JSON.parse(readFileSync(join(AUDIO_DIR, 'manifest.json'), 'utf8')) as { sfxParity?: { packs?: Record<string, unknown> } };
  const shipped: AudioManifest = parseManifest(shippedRaw);
  const mix = JSON.parse(readFileSync(join(ROOT, 'docs', 'audio', 'sfx-parity-mix.json'), 'utf8')) as MixFile;

  it('declares the third source (an empty list while no pack has shipped)', () => {
    expect(shippedRaw.sfxParity, 'manifest.sfxParity').toBeDefined();
    expect(typeof shippedRaw.sfxParity!.packs).toBe('object');
    expect(Object.keys(shipped.sfxParity.packs).length, 'every listed pack parses').toBe(Object.keys(shippedRaw.sfxParity!.packs!).length);
  });

  it('ships every pack it lists at its byte count, under the gates, in the right game, at its row\'s level', () => {
    for (const [name, pack] of Object.entries(shipped.sfxParity.packs)) {
      expect(name, name).toMatch(PARITY_PACK_NAME);
      expect(pack.file, name).toBe(`sfx/parity-${name}.mp3`);
      const size = statSync(join(AUDIO_DIR, pack.file)).size;
      expect(pack.bytes, `${name} bytes`).toBe(size);
      expect(size, `${name} over the 5 MB sprite gate`).toBeLessThan(5e6);
      const game = name.split('-')[0];
      for (const [cueName, c] of Object.entries(pack.cues)) {
        expect(c.game, `${name}/${cueName} names its game`).toBeDefined();
        expect(['both', game], `${name}/${cueName} is ${c.game}`).toContain(c.game);
        expect(Number.isFinite(c.lufs), `${name}/${cueName} records its level`).toBe(true);
        expect(c.truePeakDb!, `${name}/${cueName} true peak`).toBeLessThanOrEqual(-1.1 + 0.05);
        const row = mix.rows.find((r) => r.id === c.specRow);
        const target = row ? rowTarget(mix, row) : null;
        if (target !== null) expect(Math.abs(c.lufs! - target), `${name}/${cueName} against ${c.specRow}`).toBeLessThanOrEqual(0.3);
      }
    }
  });

  it('counts every pack in the 100 MB shipping budget', () => {
    const raw2 = shippedRaw as unknown as { music: Record<string, { bytes?: number }>; sfx: { bytes?: number }; sfxV2?: { bytes?: number } };
    const total =
      Object.values(raw2.music).reduce((s, e) => s + (e.bytes ?? 0), 0) +
      (raw2.sfx.bytes ?? 0) +
      (raw2.sfxV2?.bytes ?? 0) +
      Object.values(shipped.sfxParity.packs).reduce((s, p) => s + (p.bytes ?? 0), 0);
    expect(total).toBeLessThan(AUDIO_BUDGET_BYTES);
  });
});

// ---------------------------------------------------------------- provenance and originality

interface RecordCue { pack: string; cue: string; take: string; request: Record<string, unknown>; characterCost: number; sha256Raw: string; sha256Mastered: string; specRow: string }
interface RecordFile { cues: RecordCue[]; rejected: { request: { text: string }; pack: string; cue: string; failedChecks: string[] }[]; generator: { bodyKeys: string[]; model: string } }

describe('the record of what ships and what was turned down', () => {
  const record = JSON.parse(readFileSync(join(ROOT, 'docs', 'audio', 'sfx-parity-record.json'), 'utf8')) as RecordFile;
  const shipped: AudioManifest = parseManifest(JSON.parse(readFileSync(join(AUDIO_DIR, 'manifest.json'), 'utf8')));

  it('agrees with the manifest both ways: every shipped parity cue has a record row, every record row a shipped cue', () => {
    const inManifest = Object.entries(shipped.sfxParity.packs).flatMap(([pack, p]) => Object.keys(p.cues).map((cue) => `${pack}/${cue}`)).sort();
    const inRecord = record.cues.map((c) => `${c.pack}/${c.cue}`).sort();
    expect(inRecord).toEqual(inManifest);
    for (const c of record.cues) {
      expect(shipped.sfxParity.packs[c.pack]!.cues[c.cue]!.specRow, `${c.pack}/${c.cue}`).toBe(c.specRow);
      expect(c.sha256Raw, c.take).toMatch(/^[0-9a-f]{64}$/);
      expect(c.sha256Mastered, c.take).toMatch(/^[0-9a-f]{64}$/);
      expect(Number.isFinite(c.characterCost), c.take).toBe(true);
    }
  });

  it('sent the service text and nothing else: the four body keys, a prompt that passes the lint, no audio path', () => {
    const bodies = [...record.cues.map((c) => c.request), ...record.rejected.map((r) => r.request)] as Record<string, unknown>[];
    expect(bodies.length).toBeGreaterThan(0);
    for (const body of bodies) {
      expect(Object.keys(body).filter((k) => k !== 'loop').sort()).toEqual([...record.generator.bodyKeys].sort());
      expect(body['model_id']).toBe(record.generator.model);
      expect(lintPrompt(String(body['text'])), String(body['text'])).toBeNull();
    }
    expect(JSON.stringify(record)).not.toMatch(/[A-Za-z]:[\\/]|\.(?:wav|flac|fsb|vbf)\b/);
  });

  it('keeps a rejected take out of the manifest', () => {
    expect(record.rejected.length).toBeGreaterThan(0);
    for (const r of record.rejected) {
      expect(r.failedChecks.length, `${r.pack}/${r.cue} was turned down for a reason`).toBeGreaterThan(0);
      expect(shipped.sfxParity.packs[r.pack]?.cues[r.cue], `${r.pack}/${r.cue} must not ship`).toBeUndefined();
    }
  });
});

describe('the prompt lint', () => {
  it('stops a prompt that names a game, place, character, composer or a model to imitate', () => {
    for (const bad of ['a sword swing from Final Fantasy', 'Rikku\'s dagger flurry', 'a fanfare in the style of a famous composer', 'sounds like an aeon summoned', 'the Leblanc theme', 'a Zanarkand bell', 'an imitation of a pistol']) {
      expect(lintPrompt(bad), bad).not.toBeNull();
    }
  });

  it('lets a plain description through', () => {
    for (const ok of ['A heavy sword whoosh with a low thud, a short deep whump as a heavy blade carves the air. Close-miked, realistic sound design, no music, no voice.', 'A single tiny dry glassy tick, a very short clean bright click.', 'A sinking slowdown magic, a thick heavy low drone.']) {
      expect(lintPrompt(ok), ok).toBeNull();
    }
  });
});
