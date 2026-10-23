/**
 * THE AUDIO PASS, VOICE, TITLES, RESULTS AND THE MASK (conference demo sound pass, 2026-10-22; decision 184).
 *
 * The pass's nine in-battle lines live in their own folder (`public/audio/voice-pass/`), so the shipped voice folder and its audit are untouched; the bank reads them only while the pass is on. These checks
 * pin: every Talk and taunt line the scripts carry has a recording under the key the game finds it by; the bank answers the extras only with the pass on and only for a chapter whose own manifest loaded;
 * the Talk scripts and triggers exist only with the pass on, `id === script`, and fit the mid-battle beat's 8 s with their recordings; the Sound Test titles name cues that exist; Chapter IV's win is silent
 * and Chapter I's fanfare is one; the mask guard and the gather window behave. What the lines sound like is Bailey's to judge (AGENTS.md rule 13).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PASS_EXTRAS_WAIT_MS, PASS_VOICE_CHAPTERS, VoiceBank, type DecodedVoice, type VoiceBankDeps } from '../../src/audio/voice/VoiceBank.ts';
// @ts-expect-error -- the audio tooling is plain .mjs with no declarations.
import { auditVoiceDir } from '../../tools/audio/voice-audit.mjs';
import { setAudioNew, setPassAddress, setPassChapter } from '../../src/audio/pass/passSwitch.ts';
import { passMidFor, passScriptsFor } from '../../src/story/scripts/seymour-flux-pass.ts';
import seymourFluxScripts from '../../src/story/scripts/seymour-flux.ts';
import { lineKey } from '../../src/story/voice/voiceKey.ts';
import { midBattleDeadlineMs, MID_SCRIPT_BUDGET_MS } from '../../src/story/registry.ts';
import { PASS_TITLES, passTitleOf } from '../../src/audio/pass/passTitles.ts';
import { hasTrack } from '../../src/audio/tracks/index.ts';
import { passSilentWin, passVictoryCue, setPassVictoryCue } from '../../src/audio/pass/passResults.ts';
import { resultsCueFor } from '../../src/app/screens/resultsMusic.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { AFTER_MS, BEFORE_MS, blowNear, inGather, noteBlowAt, noteGather, resetBlows } from '../../src/audio/pass/passMask.ts';
import type { SayStep, StoryScript } from '../../src/story/dsl.ts';

const AUDIO = new URL('../../public/audio/', import.meta.url);
const passManifest = JSON.parse(readFileSync(new URL('voice-pass/seymour-flux.json', AUDIO), 'utf8')) as { chapter: string; game: string; lines: Record<string, { id: string; file: string; ms: number; who: string }> };

afterEach(() => {
  setAudioNew(null);
  setPassAddress(undefined);
  setPassChapter(undefined);
  setPassVictoryCue(null);
  resetBlows();
});

const sayLines = (script: StoryScript): SayStep[] => script.filter((s): s is SayStep => s.type === 'say');

describe('the pass voice folder', () => {
  it("holds a recording, under the game's own key, for every Talk line and every Seymour taunt, and nothing else", () => {
    setPassChapter('seymour-flux');
    setAudioNew(true);
    const wanted = new Set<string>();
    for (const script of Object.values(passScriptsFor('seymour-flux'))) for (const l of sayLines(script)) wanted.add(lineKey(l.who, l.text));
    for (const name of ['seymour-half', 'seymour-lance']) for (const l of sayLines(seymourFluxScripts.midScripts[name]!)) wanted.add(lineKey(l.who, l.text));
    expect(wanted.size).toBe(9);
    expect([...wanted].sort()).toEqual(Object.keys(passManifest.lines).sort());
    for (const e of Object.values(passManifest.lines)) {
      expect(existsSync(new URL(`voice-pass/${e.file}`, AUDIO)), e.file).toBe(true);
      expect(e.ms, e.id).toBeGreaterThan(300);
    }
    expect(passManifest.game).toBe('ffx'); // FFX only (rule 14)
    expect(new Set(Object.values(passManifest.lines).map((e) => e.who))).toEqual(new Set(['seymour', 'yuna', 'kimahri']));
  });

  it("passes the deploy preflight's audit (tools/audio/qa.mjs --strict reads it): manifests, files, sizes, budget, no orphan", () => {
    const r = auditVoiceDir(fileURLToPath(new URL('voice-pass', AUDIO)), { requireIndex: false });
    expect(r.problems).toEqual([]);
    expect(r.totals).toMatchObject({ files: 9, chapters: 1, lines: 9 });
    // the shipped folder's audit still wants its index; the pass folder has none
    expect(auditVoiceDir(fileURLToPath(new URL('voice-pass', AUDIO))).problems.some((p: string) => p.includes('index.json is missing'))).toBe(true);
    // qa.mjs must not call these files orphans of the music manifest, and must audit them
    const qa = readFileSync(new URL('../../tools/audio/qa.mjs', import.meta.url), 'utf8');
    expect(qa).toContain("!f.startsWith('voice-pass/')");
    expect(qa).toContain("'voice-pass'");
  });

  it('lists exactly the chapters that have a pass manifest, so no other chapter asks for one', () => {
    const onDisk = readdirSync(new URL('voice-pass/', AUDIO)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
    expect([...PASS_VOICE_CHAPTERS].sort()).toEqual(onDisk.sort());
  });

  it("keeps the shipped voice folder as it was: the pass lines are not in the chapter's own manifest", () => {
    const own = JSON.parse(readFileSync(new URL('voice/seymour-flux.json', AUDIO), 'utf8')) as { lines: Record<string, unknown> };
    for (const key of Object.keys(passManifest.lines)) expect(key in own.lines, key).toBe(false);
  });
});

describe('the bank', () => {
  const buf = (): DecodedVoice => ({ length: 1000, numberOfChannels: 1, duration: 1 });
  const own = { version: 1, chapter: 'seymour-flux', game: 'ffx', lines: { aaa: { id: 'seymour-flux.pre.001', file: 'seymour-flux/a.mp3', ms: 1000, who: 'tidus' } } };
  const extra = { version: 1, chapter: 'seymour-flux', game: 'ffx', lines: { bbb: { id: 'seymour-flux.mid-talk-yuna.001', file: 'seymour-flux/b.mp3', ms: 1500, who: 'seymour' } } };
  const make = (): { bank: VoiceBank<DecodedVoice>; fetched: string[] } => {
    const fetched: string[] = [];
    const deps: VoiceBankDeps<DecodedVoice> = {
      fetchJson: async (p) => {
        fetched.push(p);
        return p === 'voice-pass/seymour-flux.json' ? extra : own;
      },
      fetchBytes: async (p) => {
        fetched.push(p);
        return new ArrayBuffer(8);
      },
      decode: async () => buf(),
    };
    return { bank: new VoiceBank(deps), fetched };
  };

  it('asks for nothing of the pass when the address does not, and answers the extras only while the pass is on', async () => {
    setPassAddress('');
    const a = make();
    await a.bank.loadChapter('seymour-flux');
    expect(a.fetched.some((p) => p.includes('voice-pass'))).toBe(false);
    setPassAddress('?pack=demo');
    const b = make();
    await b.bank.loadChapter('seymour-flux');
    expect(b.fetched).toContain('voice-pass/seymour-flux.json');
    expect(b.bank.entry('seymour-flux', 'bbb')).toBeNull(); // asked for, but the pass is not on (no demo chapter running)
    setPassChapter('seymour-flux');
    expect(b.bank.entry('seymour-flux', 'bbb')?.file).toBe('pass/seymour-flux/b.mp3');
    expect(b.bank.entry('seymour-flux', 'aaa')?.id).toBe('seymour-flux.pre.001'); // the chapter's own line is untouched
    expect(b.bank.extraLines('seymour-flux')).toHaveLength(1);
    setPassChapter('yunalesca');
    expect(b.bank.extraLines('seymour-flux')).toEqual([]);
  });

  it('asks for the pass lines of the chapters that have them and no other, so a chapter without one makes no request (a 404 apiece)', async () => {
    setPassAddress('?pack=demo');
    const fetched: string[] = [];
    const deps: VoiceBankDeps<DecodedVoice> = {
      fetchJson: async (p) => {
        fetched.push(p);
        return { version: 1, chapter: 'ffx2-bahamut', game: 'ffx', lines: { aaa: { id: 'ffx2-bahamut.pre.001', file: 'ffx2-bahamut/a.mp3', ms: 1000, who: 'tidus' } } };
      },
      fetchBytes: async () => new ArrayBuffer(8),
      decode: async () => buf(),
    };
    const bank = new VoiceBank(deps);
    expect((await bank.loadChapter('ffx2-bahamut'))?.chapter).toBe('ffx2-bahamut');
    expect(fetched.some((p) => p.includes('voice-pass'))).toBe(false);
  });

  it("does not let a pass manifest that never answers hold the chapter's own voice", async () => {
    vi.useFakeTimers();
    try {
      setPassAddress('?pack=demo');
      const deps: VoiceBankDeps<DecodedVoice> = {
        fetchJson: (p) => (p.includes('voice-pass') ? new Promise(() => undefined) : Promise.resolve(own)),
        fetchBytes: async () => new ArrayBuffer(8),
        decode: async () => buf(),
      };
      const bank = new VoiceBank(deps);
      let done = false;
      const loading = bank.loadChapter('seymour-flux').then((m) => {
        done = true;
        return m;
      });
      await vi.advanceTimersByTimeAsync(PASS_EXTRAS_WAIT_MS - 1);
      expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(2);
      expect((await loading)?.chapter).toBe('seymour-flux'); // the chapter's own manifest arrives, without the extras
      setPassChapter('seymour-flux');
      expect(bank.entry('seymour-flux', 'aaa')?.id).toBe('seymour-flux.pre.001');
      expect(bank.extraLines('seymour-flux')).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('fetches a pass recording from its own folder', async () => {
    setPassAddress('?pack=demo');
    setPassChapter('seymour-flux');
    const m = make();
    await m.bank.loadChapter('seymour-flux');
    await m.bank.ensure('pass/seymour-flux/b.mp3');
    expect(m.fetched).toContain('voice-pass/seymour-flux/b.mp3');
    await m.bank.ensure('seymour-flux/a.mp3');
    expect(m.fetched).toContain('voice/seymour-flux/a.mp3');
  });
});

describe('the Talk exchanges', () => {
  it('exist only with the pass on, for Chapter I only, with id === script', () => {
    setPassAddress('');
    expect(passMidFor('seymour-flux')).toEqual([]);
    expect(Object.keys(passScriptsFor('seymour-flux'))).toEqual([]);
    setPassAddress('?pack=demo');
    setPassChapter('seymour-flux');
    const triggers = passMidFor('seymour-flux');
    expect(triggers.map((t) => t.id).sort()).toEqual(['pass-talk-kimahri', 'pass-talk-yuna']);
    for (const t of triggers) {
      expect(t.script, t.id).toBe(t.id);
      expect(t.once).toBe(true);
      expect(t.when).toMatchObject({ type: 'ability-used', ability: 'talk' });
      expect(passScriptsFor('seymour-flux')[t.script], t.id).toBeDefined();
    }
    expect(passMidFor('ffx2-bahamut')).toEqual([]);
    expect(Object.keys(passScriptsFor('ffx2-bahamut'))).toEqual([]);
  });

  it('fit the mid-battle beat with their recordings (the recorded fight cut a longer exchange at 8 s)', () => {
    setAudioNew(true);
    setPassChapter('seymour-flux');
    const byKey = new Map(Object.entries(passManifest.lines).map(([k, e]) => [k, e.ms]));
    for (const [name, script] of Object.entries(passScriptsFor('seymour-flux'))) {
      const spoken = (s: { who: string; text: string }): number => (byKey.get(lineKey(s.who, s.text)) ?? 0) + 200;
      const deadline = midBattleDeadlineMs(script, spoken as never);
      expect(deadline, name).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
    }
  });
});

describe('the Sound Test titles', () => {
  it('name real cues, show only while the pass is on, and are 17', () => {
    expect(Object.keys(PASS_TITLES)).toHaveLength(17);
    for (const cue of Object.keys(PASS_TITLES)) expect(hasTrack(cue), cue).toBe(true);
    expect(passTitleOf('boss-bahamut')).toBeNull();
    setPassAddress('?audio=new');
    setPassChapter('ffx2-bahamut');
    expect(passTitleOf('boss-bahamut')).toBe('Mercy Withheld');
    expect(passTitleOf('boss-seymour')).toBeNull(); // Chapter I's cue already has its composed title
  });
});

describe('the end of a fight', () => {
  it("leaves Chapter IV's win without a cue under the pass, and every other result as it was", () => {
    const ch4 = getChapter('ffx2-bahamut')!;
    const ch1 = getChapter('seymour-flux')!;
    expect(resultsCueFor(ch4, 'victory')?.cue).toBe('pause'); // today (release 61)
    setPassAddress('?pack=demo');
    setPassChapter('ffx2-bahamut');
    expect(passSilentWin('ffx2-bahamut')).toBe(true);
    expect(resultsCueFor(ch4, 'victory')).toBeNull();
    expect(resultsCueFor(ch4, 'defeat')?.cue).toBe('defeat-ffx2');
    setPassChapter('seymour-flux');
    expect(resultsCueFor(ch1, 'victory')?.cue).toBe('victory-ffx');
    expect(passSilentWin('seymour-flux')).toBe(false);
  });

  it("starts Chapter I's results cue at the last blow only while the pass is on", () => {
    setPassVictoryCue('victory-ffx');
    setPassAddress('');
    expect(passVictoryCue()).toBeNull();
    setPassAddress('?pack=demo');
    setPassChapter('seymour-flux');
    expect(passVictoryCue()).toBe('victory-ffx');
  });
});

describe('the mask and the gather', () => {
  it('turns a motion sound down when a blow is due within its window, and not otherwise', () => {
    noteBlowAt(1000);
    expect(blowNear(1000 - BEFORE_MS - 1)).toBe(false);
    expect(blowNear(1000 - BEFORE_MS)).toBe(true);
    expect(blowNear(1025)).toBe(true);
    expect(blowNear(1000 + AFTER_MS)).toBe(true);
    expect(blowNear(1000 + AFTER_MS + 1)).toBe(false);
  });

  it("leaves out a landing inside an Overdrive's gather only", () => {
    resetBlows();
    noteGather(5000);
    expect(inGather(5000)).toBe(true);
    expect(inGather(7599)).toBe(true);
    expect(inGather(7601)).toBe(false);
  });
});
