// @vitest-environment jsdom
/**
 * r46-scenecue (both games, shared loading plumbing): the opening scene's cue goes down the pipe first.
 *
 * Live check LV43-2: the scene bed was playing at the first spoken line in 2 of 15 runs because everything a run needs
 * starts at the card confirm and shares one link. The change is an ORDER: the opening cue alone first, the rest (the other
 * cues, the SFX parity packs, the battle's art) once its response has arrived or failed, or after a cap.
 *
 * What is proved here:
 *   1. `openingSceneCue` is derived from each chapter's own script (never listed), and agrees with `Chapter.music.scene`
 *      wherever the scene is audible at its first line; a silent opening (Chapter I) has none.
 *   2. `SceneCueGate`: opens once, by arrival or by cap; `after` runs at once when open and in order when it opens; `cancel`
 *      drops what is deferred; the switch (`?scenecue=`).
 *   3. `AudioManager.warmMusic(names, gate)` against the real loader and a fake network: the opening cue alone first, the
 *      rest after its bytes (or failure, or the cap); every way out opens the gate.
 *   4. The four cases that must behave as today (no opening cue, a cue already decoded, sound switched off, the synth
 *      fallback): no gate, and the mixer is called exactly as before.
 *   5. The real `GameFlow`: the packs and the battle's art wait for the gate, run in order when it opens (or at the cap), never
 *      run if the run ends first, and run at once when there is no gate.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { audio } from '../../src/audio/index.ts';
import { AudioManager } from '../../src/audio/AudioManager.ts';
import { chapterWarmCues, musicChapter } from '../../src/app/chapterMusicWarm.ts';
import { openingSceneCue, scriptOpensWithMusic } from '../../src/app/openingSceneCue.ts';
import { SCENE_CUE_CAP_MS, SceneCueGate, sceneCueGateFor, sceneCueSwitch, type Timers } from '../../src/app/sceneCueGate.ts';
import { sfxChapter } from '../../src/app/sfxGame.ts';
import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type CutsceneScreenOptions, type FlowScreen } from '../../src/app/screens/BattleScreenFlow.ts';
import { preloadBattle } from '../../src/app/screens/battlePreload.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, getChapter, type Chapter } from '../../src/data/encounters.ts';
import { battleStart, music, narrate, parallel, wait, type StoryScript } from '../../src/story/dsl.ts';

vi.mock('../../src/app/screens/battlePreload.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/app/screens/battlePreload.ts')>()),
  preloadBattle: vi.fn(() => Promise.resolve({ chapterId: 'x', paintings: 0, portraits: 0, ms: 0 })),
}));

const ALL: readonly Chapter[] = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS];

/** A chapter shaped like the real ones for the derivation: the game, the flow's own bed, a pre script. */
const withScript = (pre: StoryScript, scene: string | null = 'scene-zanarkand-dome', game: Chapter['game'] = 'ffx'): Chapter =>
  ({ id: 'synthetic', game, music: { scene }, scriptsRef: { pre, post: [] } }) as unknown as Chapter;

// ------------------------------------------------------------------------------------ 1. the derivation

describe('openingSceneCue: the cue playing at the opening scene\'s first spoken line, from the chapter\'s own script', () => {
  it('is the flow\'s own bed when the script says nothing about music before it speaks', () => {
    expect(openingSceneCue(withScript([narrate('The dome.'), battleStart()]))).toBe('scene-zanarkand-dome');
  });

  it('is the script\'s own first bed when it sets one before it speaks (the flow does not cue then)', () => {
    const script: StoryScript = [wait(300), music('scene-gagazet', 800), narrate('The pass.'), battleStart()];
    expect(scriptOpensWithMusic(script)).toBe(true);
    expect(openingSceneCue(withScript(script))).toBe('scene-gagazet');
  });

  it('is the last music step before the first line, and one inside a parallel counts', () => {
    expect(openingSceneCue(withScript([music('scene-gagazet'), music('boss-seymour'), narrate('x')]))).toBe('boss-seymour');
    expect(openingSceneCue(withScript([parallel(wait(100), music('scene-gagazet')), narrate('x')]))).toBe('scene-gagazet');
  });

  it('is none when the script opens with silence: the first line is silent by design (Chapter I)', () => {
    const script: StoryScript = [music(null, 600), narrate('Silence.'), music('scene-gagazet'), narrate('Now the pass.'), battleStart()];
    expect(scriptOpensWithMusic(script)).toBe(true);
    expect(openingSceneCue(withScript(script))).toBeNull();
  });

  it('ignores a bed that enters only after the first spoken line', () => {
    const script: StoryScript = [narrate('First.'), music('scene-gagazet'), narrate('Second.')];
    expect(openingSceneCue(withScript(script, null))).toBeNull();
    expect(openingSceneCue(withScript(script, 'scene-zanarkand-dome'))).toBe('scene-zanarkand-dome'); // the flow's own bed plays from the start
  });

  it('is none for a chapter with no pre script, and for FF7\'s own flow', () => {
    expect(openingSceneCue(withScript([]))).toBeNull();
    expect(openingSceneCue(withScript([narrate('x')], 'scene-zanarkand-dome', 'ff7'))).toBeNull();
    expect(openingSceneCue({ id: 'x', game: 'ffx', music: { scene: 'scene-gagazet' } } as unknown as Chapter)).toBeNull();
  });

  it('agrees with Chapter.music.scene for every chapter whose first line is audible; the rest are silent by their script', () => {
    const silent: string[] = [];
    const audible: string[] = [];
    for (const chapter of ALL) {
      const cue = openingSceneCue(chapter);
      if (cue === null) {
        silent.push(chapter.id);
        // A chapter without an opening cue is one of three kinds, each visible in the data.
        const pre = chapter.scriptsRef?.pre ?? [];
        const noScene = pre.length === 0 || chapter.game === 'ff7';
        const opensSilent = pre.some((s) => s.type === 'music' && s.track === null) && scriptOpensWithMusic(pre);
        expect(noScene || opensSilent || chapter.music.scene === null, `${chapter.id} has no opening cue and no reason for it`).toBe(true);
      } else {
        audible.push(chapter.id);
        expect(cue, `${chapter.id}: the derived opening cue is not the chapter's scene bed`).toBe(chapter.music.scene);
      }
    }
    // `SCENECUE_LIST=1 vitest run tests/unit/scene-cue-gate.test.ts` prints the derived table (the handoff's list of qualifying chapters).
    if (process.env['SCENECUE_LIST']) {
      const rows = ALL.map((c) => {
        const pre = c.scriptsRef?.pre ?? [];
        const spoken = pre.findIndex((s) => s.type === 'say' || s.type === 'narrate' || s.type === 'choice');
        const firstMusic = pre.findIndex((s) => s.type === 'music');
        return `${c.id}\t${c.game}\t${c.number}\topening cue: ${openingSceneCue(c) ?? '(none)'}\tscript steps: ${pre.length}\tfirst spoken step: ${spoken}\tfirst music step: ${firstMusic}${firstMusic >= 0 ? ` (${(pre[firstMusic] as { track: string | null }).track})` : ''}`;
      });
      console.info(`SCENECUE_LIST\n${rows.join('\n')}`);
    }
    expect(audible.length).toBeGreaterThan(10);
    expect(silent).toContain('seymour-flux'); // Chapter I opens with music(null)
    expect(audible).toContain('yunalesca');
    expect(audible).toContain('ffx2-bahamut');
  });

  it('leads the chapter\'s warm list whenever there is one, so the gated cue is the first name the mixer is given', () => {
    for (const chapter of ALL) {
      const cue = openingSceneCue(chapter);
      if (cue) expect(chapterWarmCues(chapter)[0], chapter.id).toBe(cue);
    }
  });
});

// ------------------------------------------------------------------------------------ 2. the gate

/** Timers the test fires by hand. */
function manualTimers() {
  const pending = new Map<number, { fn: () => void; ms: number }>();
  let next = 1;
  const timers: Timers = {
    set: (fn, ms) => {
      pending.set(next, { fn, ms });
      return next++;
    },
    clear: (h) => void pending.delete(h as number),
  };
  return { timers, pending, fire: () => [...pending.values()].forEach((t) => t.fn()) };
}

describe('SceneCueGate', () => {
  it('runs what is deferred in the order asked when the cue settles it, and runs later starts at once', () => {
    const t = manualTimers();
    const gate = new SceneCueGate(1000, t.timers);
    const ran: string[] = [];
    gate.after(() => ran.push('packs'));
    gate.after(() => ran.push('art'));
    expect(ran).toEqual([]);
    expect(gate.isOpen).toBe(false);
    gate.settle();
    expect(ran).toEqual(['packs', 'art']);
    expect(gate.openedBy).toBe('arrived');
    gate.after(() => ran.push('late'));
    expect(ran).toEqual(['packs', 'art', 'late']); // an open gate is "as today": no deferral
    expect(t.pending.size).toBe(0); // the cap timer is gone
  });

  it('opens by the cap when the cue never answers, once, and a late settle changes nothing', () => {
    const t = manualTimers();
    const gate = new SceneCueGate(4000, t.timers);
    expect([...t.pending.values()].map((p) => p.ms)).toEqual([4000]);
    const ran: string[] = [];
    gate.after(() => ran.push('art'));
    t.fire();
    expect(ran).toEqual(['art']);
    expect(gate.openedBy).toBe('cap');
    gate.settle();
    expect(ran).toEqual(['art']); // no second run
    expect(gate.openedBy).toBe('cap');
  });

  it('opens the awaiting warm when it settles, and when it is cancelled', async () => {
    const a = new SceneCueGate(1000, manualTimers().timers);
    a.settle();
    await expect(a.opened).resolves.toBeUndefined();
    const b = new SceneCueGate(1000, manualTimers().timers);
    b.cancel();
    await expect(b.opened).resolves.toBeUndefined();
  });

  it('a cancelled gate drops what is deferred, runs nothing later, and cannot be reopened (the run ended)', () => {
    const t = manualTimers();
    const gate = new SceneCueGate(1000, t.timers);
    const ran: string[] = [];
    gate.after(() => ran.push('art'));
    gate.cancel();
    gate.settle();
    t.fire();
    gate.after(() => ran.push('later'));
    expect(ran).toEqual([]);
    expect(gate.isOpen).toBe(false);
    expect(gate.openedBy).toBe('cancelled');
    expect(t.pending.size).toBe(0);
  });

  it('cancelling an open gate changes nothing (the starts have run)', () => {
    const gate = new SceneCueGate(1000, manualTimers().timers);
    const ran: string[] = [];
    gate.settle();
    gate.cancel();
    gate.after(() => ran.push('x'));
    expect(ran).toEqual(['x']);
    expect(gate.openedBy).toBe('arrived');
  });

  it('a deferred start that throws does not stop the ones behind it', () => {
    const gate = new SceneCueGate(1000, manualTimers().timers);
    const ran: string[] = [];
    gate.after(() => {
      throw new Error('boom');
    });
    gate.after(() => ran.push('art'));
    expect(() => gate.settle()).not.toThrow();
    expect(ran).toEqual(['art']);
  });

  it('works on the real timers too: the cap opens it', async () => {
    vi.useFakeTimers();
    try {
      const gate = new SceneCueGate(250);
      const ran: string[] = [];
      gate.after(() => ran.push('art'));
      vi.advanceTimersByTime(249);
      expect(ran).toEqual([]);
      vi.advanceTimersByTime(2);
      expect(ran).toEqual(['art']);
      await expect(gate.opened).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('the switch: ?scenecue=', () => {
  it('on by default; off, on, or a cap in milliseconds from the address', () => {
    expect(sceneCueSwitch('', true)).toEqual({ on: true, capMs: SCENE_CUE_CAP_MS });
    expect(sceneCueSwitch('', false)).toEqual({ on: false, capMs: SCENE_CUE_CAP_MS });
    expect(sceneCueSwitch('?scenecue=off', true).on).toBe(false);
    expect(sceneCueSwitch('?scenecue=on', false).on).toBe(true);
    expect(sceneCueSwitch('?scenecue=2500', false)).toEqual({ on: true, capMs: 2500 });
    expect(sceneCueSwitch('?x=1&scenecue=800', false)).toEqual({ on: true, capMs: 800 });
    expect(sceneCueSwitch('?scenecue=banana', true)).toEqual({ on: true, capMs: SCENE_CUE_CAP_MS });
    expect(sceneCueSwitch('?scenecue=-5', false).on).toBe(false);
  });
});

// ------------------------------------------------------------------------------------ 3. the mixer

const CUES = ['scene-zanarkand-dome', 'boss-yunalesca', 'victory-ffx', 'defeat-ffx'] as const;
const manifestJson = {
  version: 1,
  sampleRate: 44100,
  music: Object.fromEntries(CUES.map((name) => [name, { file: `music/${name}.mp3`, loopStart: 4, loopEnd: 80, duration: 90 }])),
};

/** A fake network: every request is logged; a music file can be held back until released, or made to fail. */
function network() {
  const log: string[] = [];
  const held = new Map<string, () => void>();
  const gates = new Map<string, Promise<void>>();
  const failing = new Set<string>();
  const hold = (name: string): void => {
    gates.set(name, new Promise<void>((resolve) => held.set(name, resolve)));
  };
  const fetchImpl = async (input: string | URL | Request): Promise<Response> => {
    const url = String(input);
    log.push(url);
    if (url.endsWith('/audio/manifest.json')) {
      await gates.get('manifest');
      return new Response(JSON.stringify(manifestJson), { status: 200 });
    }
    const name = /\/music\/([^/]+)\.mp3$/.exec(url)?.[1] ?? '';
    await gates.get(name);
    if (failing.has(name)) return new Response('', { status: 404 });
    return new Response(new TextEncoder().encode(name), { status: 200 });
  };
  const musicRequests = (): string[] => log.filter((u) => u.includes('/music/')).map((u) => /\/music\/([^/]+)\.mp3$/.exec(u)?.[1] ?? u);
  return { log, hold, release: (name: string) => held.get(name)?.(), fail: (name: string) => failing.add(name), fetchImpl, musicRequests };
}

function fakeContext() {
  class FakeParam {
    value = 1;
    setValueAtTime(v: number): void {
      this.value = v;
    }
    exponentialRampToValueAtTime(): void {}
    linearRampToValueAtTime(): void {}
    cancelScheduledValues(): void {}
  }
  class FakeNode {
    connect(): void {}
    disconnect(): void {}
  }
  return {
    state: 'running',
    sampleRate: 48000,
    currentTime: 1,
    destination: new FakeNode(),
    resume: (): Promise<void> => Promise.resolve(),
    createGain: () => Object.assign(new FakeNode(), { gain: new FakeParam() }),
    createBufferSource: () => Object.assign(new FakeNode(), { buffer: null, loop: false, loopStart: 0, loopEnd: 0, start: () => {}, stop: () => {}, onended: null as unknown }),
    decodeAudioData: async (bytes: ArrayBuffer) => ({ name: new TextDecoder().decode(bytes), duration: 90 }),
  };
}

type Net = ReturnType<typeof network>;
let net: Net;

/** A manager with a running (fake) context, as the board has by the time a card is confirmed. Its synth is a stub (a real score takes seconds). */
function unlocked(options: ConstructorParameters<typeof AudioManager>[0] = {}) {
  const am = new AudioManager({ useWorker: false, baseUrl: '/', ...options });
  const raw = am as unknown as Record<string, unknown>;
  raw['ctx'] = fakeContext();
  raw['musicBus'] = (raw['ctx'] as ReturnType<typeof fakeContext>).createGain();
  const loader = raw['loader'] as { has(n: string): boolean; synthesise: unknown };
  loader.synthesise = async (_ctx: unknown, name: string) => ({ buffer: { name, duration: 90 }, loopStart: 0, loopEnd: 1, source: 'synth' });
  return { am, loader };
}

/** Let every pending promise chain run (the fake network is all microtasks). */
async function settle(): Promise<void> {
  for (let i = 0; i < 60; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  for (let i = 0; i < 60; i++) await Promise.resolve();
}

beforeEach(() => {
  net = network();
  vi.stubGlobal('fetch', net.fetchImpl);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AudioManager.warmMusic with a gate: the opening cue alone first', () => {
  it('fetches the opening cue alone, opens the gate when its bytes are in, and only then asks for the rest', async () => {
    const { am } = unlocked();
    const gate = new SceneCueGate(60000, manualTimers().timers);
    net.hold('scene-zanarkand-dome');
    am.warmMusic([...CUES], gate);
    await settle();
    expect(net.musicRequests()).toEqual(['scene-zanarkand-dome']); // alone
    expect(gate.isOpen).toBe(false);
    net.release('scene-zanarkand-dome');
    await settle();
    expect(gate.openedBy).toBe('arrived');
    expect(net.musicRequests()).toEqual([...CUES]); // then the rest, one at a time as before
  });

  it('opens the gate on the bytes, before the decode (the link is free while the cue decodes)', async () => {
    const { am } = unlocked();
    const gate = new SceneCueGate(60000, manualTimers().timers);
    let finishDecode: () => void = () => undefined;
    const raw = am as unknown as { ctx: { decodeAudioData: (b: ArrayBuffer) => Promise<unknown> } };
    const decode = raw.ctx.decodeAudioData;
    raw.ctx.decodeAudioData = async (bytes) => {
      if (new TextDecoder().decode(bytes) === 'scene-zanarkand-dome') await new Promise<void>((resolve) => (finishDecode = resolve));
      return decode(bytes);
    };
    am.warmMusic([...CUES], gate);
    await settle();
    expect(gate.openedBy).toBe('arrived'); // the bytes are in, the decode is not
    expect(net.musicRequests()).toContain('boss-yunalesca');
    finishDecode();
    await settle();
  });

  it('opens the gate when the opening cue fails, and goes on with the rest', async () => {
    const { am } = unlocked();
    const gate = new SceneCueGate(60000, manualTimers().timers);
    net.fail('scene-zanarkand-dome');
    am.warmMusic([...CUES], gate);
    await settle();
    expect(gate.openedBy).toBe('arrived');
    expect(net.musicRequests()).toEqual([...CUES]);
  });

  it('a cue that never answers: the cap opens the gate and the rest of the cues go on while it is still in flight', async () => {
    const { am } = unlocked();
    const t = manualTimers();
    const gate = new SceneCueGate(4000, t.timers);
    net.hold('scene-zanarkand-dome');
    am.warmMusic([...CUES], gate);
    await settle();
    expect(net.musicRequests()).toEqual(['scene-zanarkand-dome']);
    t.fire(); // the cap
    await settle();
    expect(gate.openedBy).toBe('cap');
    expect(net.musicRequests()).toEqual([...CUES]);
    net.release('scene-zanarkand-dome');
    await settle();
    expect(net.musicRequests().filter((n) => n === 'scene-zanarkand-dome')).toHaveLength(1); // still one fetch
  });

  it('opens the gate at once when there is nothing to fetch for the opening cue: no rendered file, or already decoded', async () => {
    const noFile = unlocked();
    const gateA = new SceneCueGate(60000, manualTimers().timers);
    noFile.am.warmMusic(['scene-gagazet', 'boss-yunalesca'], gateA); // `scene-gagazet` is a track the manifest above does not list
    await settle();
    expect(gateA.openedBy).toBe('arrived');
    expect(net.musicRequests()).toEqual(['boss-yunalesca']); // the rest are warmed as they always were

    const cached = unlocked();
    await cached.am.playMusic('scene-zanarkand-dome');
    net.log.length = 0;
    const gateB = new SceneCueGate(60000, manualTimers().timers);
    cached.am.warmMusic(['scene-zanarkand-dome', 'boss-yunalesca'], gateB);
    await settle();
    expect(gateB.openedBy).toBe('arrived');
    expect(net.musicRequests()).toEqual(['boss-yunalesca']);
  });

  it('every way out opens the gate: audio still locked, a synth-only build, a newer run, a throwing network', async () => {
    const locked = new AudioManager({ useWorker: false, baseUrl: '/' });
    const g1 = new SceneCueGate(60000, manualTimers().timers);
    locked.warmMusic(['scene-zanarkand-dome'], g1);
    const synth = unlocked({ synthOnly: true });
    const g2 = new SceneCueGate(60000, manualTimers().timers);
    synth.am.warmMusic(['scene-zanarkand-dome'], g2);
    await settle();
    expect(g1.isOpen).toBe(true);
    expect(g2.isOpen).toBe(true);
    expect(net.log).toEqual([]);

    const { am } = unlocked();
    net.hold('manifest');
    const g3 = new SceneCueGate(60000, manualTimers().timers);
    am.warmMusic([...CUES], g3);
    await settle();
    expect(g3.isOpen).toBe(false); // still waiting for the manifest
    am.warmMusic(['boss-yunalesca']); // a newer run replaces it
    net.release('manifest');
    await settle();
    expect(g3.isOpen).toBe(true);
    expect(net.musicRequests()).toEqual(['boss-yunalesca']); // the older run fetched nothing

    vi.stubGlobal('fetch', async () => {
      throw new Error('offline');
    });
    const offline = unlocked();
    const g4 = new SceneCueGate(60000, manualTimers().timers);
    offline.am.warmMusic([...CUES], g4);
    await settle();
    expect(g4.isOpen).toBe(true);
  });

  it('without a gate it is the loop it always was: nothing waits on anything', async () => {
    const { am } = unlocked();
    net.hold('scene-zanarkand-dome');
    am.warmMusic([...CUES]);
    await settle();
    expect(net.musicRequests()).toEqual(['scene-zanarkand-dome']); // sequential, as the PR-0373 test pins
    net.release('scene-zanarkand-dome');
    await settle();
    expect(net.musicRequests()).toEqual([...CUES]);
  });
});

// ------------------------------------------------------------------------------------ 4. the four unchanged cases

describe('needsFirstFetch and sceneCueGateFor: no gate when nothing would be fetched first', () => {
  const yunalesca = (): Chapter => getChapter('yunalesca')!;

  it('a running mixer with the cue listed and sound on: a first fetch will happen, and the run gets a gate', () => {
    const { am } = unlocked();
    expect(am.needsFirstFetch('scene-zanarkand-dome')).toBe(true); // manifest not read yet counts as yes
    vi.spyOn(audio, 'needsFirstFetch').mockReturnValue(true);
    const gate = sceneCueGateFor(yunalesca(), {}, '');
    expect(gate).toBeInstanceOf(SceneCueGate);
    expect(gate?.capMs).toBe(SCENE_CUE_CAP_MS);
    gate?.cancel();
  });

  it('(1) a chapter with no opening cue: no gate, whatever the mixer says (Chapter I opens with silence)', () => {
    vi.spyOn(audio, 'needsFirstFetch').mockReturnValue(true);
    expect(sceneCueGateFor(getChapter('seymour-flux')!, {}, '')).toBeNull();
    expect(sceneCueGateFor(getChapter('ff7-guard-scorpion')!, {}, '')).toBeNull();
  });

  it('(2) a cue already decoded: no gate', async () => {
    const { am } = unlocked();
    await am.playMusic('scene-zanarkand-dome');
    expect(am.needsFirstFetch('scene-zanarkand-dome')).toBe(false);
    expect(am.needsFirstFetch('boss-yunalesca')).toBe(true);
  });

  it('(3) sound switched off (muted, or master or music at zero): no gate', () => {
    const muted = unlocked().am;
    muted.setMuted(true);
    expect(muted.needsFirstFetch('scene-zanarkand-dome')).toBe(false);
    const noMaster = unlocked().am;
    noMaster.setMasterVolume(0);
    expect(noMaster.needsFirstFetch('scene-zanarkand-dome')).toBe(false);
    const noMusic = unlocked().am;
    noMusic.setMusicVolume(0);
    expect(noMusic.needsFirstFetch('scene-zanarkand-dome')).toBe(false);
  });

  it('(4) the synth fallback: no gate when audio is locked, synth-only, or the manifest has no file for the cue', async () => {
    expect(new AudioManager({ useWorker: false }).needsFirstFetch('scene-zanarkand-dome')).toBe(false); // still locked
    expect(unlocked({ synthOnly: true }).am.needsFirstFetch('scene-zanarkand-dome')).toBe(false);
    const { am } = unlocked();
    am.warmMusic(['boss-yunalesca']); // reads the manifest
    await settle();
    expect(am.needsFirstFetch('scene-zanarkand-dome')).toBe(true);
    expect(am.needsFirstFetch('scene-gagazet')).toBe(false); // a track the manifest does not list is synthesised, not fetched
    expect(am.needsFirstFetch('not-a-track')).toBe(false);
  });

  it('the switch off, and a run that skips its cutscenes: no gate', () => {
    vi.spyOn(audio, 'needsFirstFetch').mockReturnValue(true);
    expect(sceneCueGateFor(yunalesca(), {}, '?scenecue=off')).toBeNull();
    expect(sceneCueGateFor(yunalesca(), { skipCutscenes: true }, '')).toBeNull();
    expect(sceneCueGateFor(yunalesca(), {}, '?scenecue=1500')?.capMs).toBe(1500);
  });

  it('musicChapter and sfxChapter call the mixer exactly as before when there is no gate', () => {
    const warm = vi.spyOn(audio, 'warmMusic').mockReturnValue(() => undefined);
    const packs = vi.spyOn(audio, 'loadParityPacks').mockImplementation(() => undefined);
    const done = musicChapter('yunalesca', () => undefined);
    sfxChapter('yunalesca', () => undefined)();
    expect(warm).toHaveBeenCalledTimes(1);
    expect(warm.mock.calls[0]).toHaveLength(1); // one argument: the call the PR-0373 tests pin
    expect(packs).toHaveBeenCalledTimes(1); // asked for at once
    done();
  });

  it('with a gate: the packs wait for it, the voice does not, a run that ends first never asks, and the cues get the gate', () => {
    const packs = vi.spyOn(audio, 'loadParityPacks').mockImplementation(() => undefined);
    const warm = vi.spyOn(audio, 'warmMusic').mockReturnValue(() => undefined);
    const gate = new SceneCueGate(60000, manualTimers().timers);
    const end = sfxChapter('yunalesca', () => undefined, gate);
    expect(packs).not.toHaveBeenCalled();
    gate.settle();
    expect(packs).toHaveBeenCalledWith('ffx', 'yunalesca');

    const other = new SceneCueGate(60000, manualTimers().timers);
    const endEarly = sfxChapter('ffx2-bahamut', () => undefined, other);
    endEarly(); // backed out of prep before the cue arrived
    other.settle();
    expect(packs).toHaveBeenCalledTimes(1); // the second chapter's packs were never asked for
    end();

    const third = new SceneCueGate(60000, manualTimers().timers);
    const cancel = vi.spyOn(third, 'cancel');
    musicChapter('yunalesca', () => undefined, third)();
    expect(warm).toHaveBeenCalledWith(chapterWarmCues(getChapter('yunalesca')!), third);
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});

// ------------------------------------------------------------------------------------ 5. the flow

class FakeCutscene extends Screen implements FlowScreen<void> {
  readonly name = 'cutscene';
  readonly done = Promise.resolve();
  constructor(readonly opts: CutsceneScreenOptions) {
    super();
  }
}
class FakeBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    const result = { outcome: 'victory', turns: 3, elapsedTicks: 1, elapsedMs: 0, ap: 0, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as unknown as BattleResult;
    this.done = Promise.resolve({ chapterId: opts.chapter.id, outcome: 'victory', result, elapsedMs: 1000, links: 1, preview: false });
  }
}
class FakePrep extends Screen implements FlowScreen<boolean> {
  readonly name = 'party-prep';
  readonly done: Promise<boolean>;
  constructor(readonly leave: Promise<boolean>) {
    super();
    this.done = leave;
  }
}
class Quiet extends Screen implements FlowScreen<boolean> {
  readonly name = 'results';
  readonly done = Promise.resolve(true);
}

class FakeApp {
  readonly uiRoot = document.createElement('div');
  readonly save = new SaveStore();
  readonly flow: GameFlow;
  current: Screen | null = null;
  constructor() {
    document.body.appendChild(this.uiRoot);
    this.flow = new GameFlow(this as unknown as App);
  }
  get overlayActive(): boolean {
    return false;
  }
  async replace(screen: Screen): Promise<void> {
    const previous = this.current;
    this.current = null;
    if (previous) await previous.exit();
    screen.app = this as unknown as App;
    screen.root = document.createElement('div');
    this.uiRoot.appendChild(screen.root);
    this.current = screen;
    await screen.enter();
  }
  async goto(): Promise<boolean> {
    return true;
  }
  fade(): Promise<void> {
    return Promise.resolve();
  }
  nextFrame(): Promise<void> {
    return Promise.resolve();
  }
}

describe('GameFlow.runChapter: the packs and the battle\'s art wait for the opening cue', () => {
  let app: FakeApp;
  let leavePrep: (ok: boolean) => void;
  let events: string[];
  let gateSeen: SceneCueGate | undefined;

  beforeEach(() => {
    document.body.innerHTML = '';
    events = [];
    gateSeen = undefined;
    resetFlowScreens();
    const prepLeaves = new Promise<boolean>((resolve) => (leavePrep = resolve));
    registerFlowScreens({ partyPrep: () => new FakePrep(prepLeaves) as never, cutscene: (o) => new FakeCutscene(o), results: () => new Quiet() as never, battle: (o) => new FakeBattle(o) });
    app = new FakeApp();
    vi.mocked(preloadBattle).mockClear();
    vi.mocked(preloadBattle).mockImplementation(() => {
      events.push('art');
      return Promise.resolve({ chapterId: 'x', paintings: 0, portraits: 0, ms: 0 });
    });
    vi.spyOn(audio, 'loadParityPacks').mockImplementation(() => void events.push('packs'));
    vi.spyOn(audio, 'warmMusic').mockImplementation((names, gate) => {
      events.push(`warm:${names[0]}${gate ? ':gated' : ''}`);
      gateSeen = gate as SceneCueGate | undefined;
      return () => void events.push('released');
    });
  });
  afterEach(() => {
    history.replaceState(null, '', '/');
    resetFlowScreens();
  });

  const flush = async (): Promise<void> => {
    for (let i = 0; i < 40; i++) await Promise.resolve();
  };

  it('Chapter II (FFX) with a first fetch coming: the warm gets the gate; packs and art wait; the cue\'s arrival releases them in order', async () => {
    vi.spyOn(audio, 'needsFirstFetch').mockReturnValue(true);
    const run = app.flow.runChapter('yunalesca', { seed: 1, skipResults: true });
    await flush();
    expect(events).toEqual(['warm:scene-zanarkand-dome:gated']); // the cue is asked for at once; nothing else is
    expect(gateSeen).toBeInstanceOf(SceneCueGate);
    gateSeen?.settle(); // the cue's response arrives
    expect(events).toEqual(['warm:scene-zanarkand-dome:gated', 'packs', 'art']);
    leavePrep(true);
    await run;
    expect(events.at(-1)).toBe('released');
    expect(events.filter((e) => e === 'art')).toHaveLength(1);
  });

  it('FFX-2 Chapter IV: the same, with its own cue first', async () => {
    vi.spyOn(audio, 'needsFirstFetch').mockReturnValue(true);
    const run = app.flow.runChapter('ffx2-bahamut', { seed: 1, skipResults: true });
    await flush();
    expect(events).toEqual(['warm:scene-bevelle-underground:gated']);
    gateSeen?.settle();
    expect(events).toEqual(['warm:scene-bevelle-underground:gated', 'packs', 'art']);
    leavePrep(true);
    await run;
  });

  it('a cue that never answers: the cap releases the packs and the art, so a dead link cannot stall the battle', async () => {
    history.replaceState(null, '', '/?scenecue=60'); // a real 60 ms cap; the page address is how a build is compared with itself
    vi.spyOn(audio, 'needsFirstFetch').mockReturnValue(true);
    const run = app.flow.runChapter('yunalesca', { seed: 1, skipResults: true });
    await flush();
    expect(events).toEqual(['warm:scene-zanarkand-dome:gated']);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(events).toEqual(['warm:scene-zanarkand-dome:gated', 'packs', 'art']);
    expect(gateSeen?.openedBy).toBe('cap');
    leavePrep(true);
    await run;
  });

  it('the player backs out of prep before the cue arrived: the deferred packs and art are never asked for', async () => {
    history.replaceState(null, '', '/?scenecue=60');
    vi.spyOn(audio, 'needsFirstFetch').mockReturnValue(true);
    const run = app.flow.runChapter('yunalesca', { seed: 1, skipResults: true });
    await flush();
    leavePrep(false);
    await run;
    gateSeen?.settle();
    await new Promise((resolve) => setTimeout(resolve, 200)); // well past the cap
    expect(events).toEqual(['warm:scene-zanarkand-dome:gated', 'released']);
    expect(preloadBattle).not.toHaveBeenCalled();
  });

  it('(1) Chapter I opens with silence: no gate, the packs and the art start at once, the warm is called as before', async () => {
    vi.spyOn(audio, 'needsFirstFetch').mockReturnValue(true);
    const run = app.flow.runChapter('seymour-flux', { seed: 1, skipResults: true });
    await flush();
    expect(events).toEqual(['packs', 'warm:scene-gagazet', 'art']);
    expect(gateSeen).toBeUndefined();
    leavePrep(true);
    await run;
  });

  it('(2, 3, 4) nothing to fetch first (cue decoded, sound off, synth fallback; the real mixer here is locked): no gate, everything at once', async () => {
    const run = app.flow.runChapter('yunalesca', { seed: 1, skipResults: true });
    await flush();
    expect(events).toEqual(['packs', 'warm:scene-zanarkand-dome', 'art']);
    expect(gateSeen).toBeUndefined();
    leavePrep(true);
    await run;
  });

  it('the switch off and a run without cutscenes: no gate, everything at once', async () => {
    vi.spyOn(audio, 'needsFirstFetch').mockReturnValue(true);
    const run = app.flow.runChapter('ffx2-bahamut', { seed: 1, skipCutscenes: true, skipResults: true, skipPrep: true });
    await run;
    expect(events.slice(0, 3)).toEqual(['packs', 'warm:scene-bevelle-underground', 'art']);
    expect(gateSeen).toBeUndefined();
  });

  it('a restart inside the same run asks for the art at once (the gate is open by then)', async () => {
    vi.spyOn(audio, 'needsFirstFetch').mockReturnValue(true);
    const run = app.flow.runChapter('yunalesca', { seed: 1, skipResults: true });
    await flush();
    gateSeen?.settle();
    expect(events.filter((e) => e === 'art')).toHaveLength(1);
    // A second `after` on the open gate (what the second `playChapter` of a restart does) runs at once.
    const again = vi.fn();
    gateSeen?.after(again);
    expect(again).toHaveBeenCalledTimes(1);
    leavePrep(true);
    await run;
  });
});
