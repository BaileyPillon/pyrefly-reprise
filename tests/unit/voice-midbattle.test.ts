// @vitest-environment jsdom
/**
 * A voiced line inside a mid-battle beat: the beat holds for the voice, is not cut at 8 s while a sentence is still being said,
 * stays silent in `'skip'` playback and once skipped, and a text-only player (voice off, audio asleep) gets exactly the old beat.
 * The runner, the real dialogue box and the real registry; the voice is a fake port whose clock the test moves. Game case: both
 * (shared plumbing).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMidBattleCutscenes, resetMidBattleOverrunLog } from '../../src/app/screens/BattleScreenCutscenes.ts';
import type { BattleStage } from '../../src/engine/BattlePresenterPorts.ts';
import { say, type StoryScript } from '../../src/story/dsl.ts';
import type { VoiceLineRequest, VoicePlayback, VoicePort } from '../../src/story/voice/voicePort.ts';

let wall = 50_000;

function stubStage(fielded: string[] = ['tidus', 'yuna', 'auron']): BattleStage {
  const done = (): Promise<void> => Promise.resolve();
  return {
    camera: { moveTo: done, snapTo: () => {}, shake: () => {}, punch: done, rigNames: ['idle'], rigName: 'idle' },
    vfx: { play: done, impact: done, screenFlash: () => {} },
    actor: () => undefined, sideOf: () => 'party', staged: () => fielded, project: () => null, setArt: done,
    addCombatant: () => Promise.resolve(undefined), removeCombatant: () => {},
  } as unknown as BattleStage;
}

/** The voice of one recorded line: it "speaks" for `ms`, counted on the same clock the test moves. */
function fakeVoice(ms: number, opts: { text?: boolean } = {}) {
  const log = { begun: [] as VoiceLineRequest[], stops: 0, asked: [] as VoiceLineRequest[] };
  let endsAt = 0;
  const playback: VoicePlayback = {
    durationMs: ms,
    holdMs: () => Math.max(0, endsAt - wall),
    stop: () => { log.stops++; endsAt = 0; },
  };
  const port: VoicePort = {
    spokenMs: (req) => { log.asked.push(req); return opts.text ? 0 : ms + 200; },
    begin: (req) => { log.begun.push(req); if (opts.text) return null; endsAt = wall + ms + 200; return playback; },
    stop: () => {},
  };
  return { port, log };
}

function mount(voice?: VoicePort, fielded?: string[]) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const cutscenes = createMidBattleCutscenes({ root, stage: stubStage(fielded), ...(voice ? { voice } : {}), sleep: (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 5))) });
  /** Render frames: scene time (the beat's budget, the typewriter) and the wall clock the box's own hold reads move together. */
  const pump = async (seconds: number, dt = 1 / 20): Promise<void> => {
    for (let t = 0; t < seconds; t += dt) {
      wall += dt * 1000;
      cutscenes.update(dt);
      for (let k = 0; k < 8; k++) await Promise.resolve();
    }
  };
  return { root, cutscenes, pump };
}

const beat = (text: string, auto = 1200): StoryScript => [say('tidus', text, { auto })];

beforeEach(() => {
  wall = 50_000;
  vi.spyOn(performance, 'now').mockImplementation(() => wall);
});
afterEach(() => {
  document.body.innerHTML = '';
  resetMidBattleOverrunLog();
  vi.restoreAllMocks();
});

describe('a voiced beat', () => {
  it('holds for the voice past the line\'s own 1.2 s, then ends and stops the voice cleanly', async () => {
    const { port, log } = fakeVoice(4000);
    const { cutscenes, pump } = mount(port);
    cutscenes.setAutoAdvance(true); // auto-battle: nobody presses Confirm
    let finished = false;
    void cutscenes.play(beat('The aeon is waking.'), { midBattle: true, name: 'a' }).then(() => (finished = true));
    await pump(0.1);
    expect(log.begun).toEqual([{ who: 'tidus', text: 'The aeon is waking.' }]);
    await pump(2.5); // the line's typing and 1.2 s hold are long over
    expect(finished).toBe(false);
    await pump(2.5); // the voice (4.0 s plus its tail) is over
    expect(finished).toBe(true);
    expect(log.stops).toBeGreaterThan(0); // the box hid at the end of the beat and stopped what was left of the voice
  });

  it('is not cut at 8 s while a sentence is still being said: the voiced beat is given its voiced length plus the grace', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { port } = fakeVoice(9500);
    const { cutscenes, pump } = mount(port);
    cutscenes.setAutoAdvance(true);
    let finished = false;
    void cutscenes.play(beat('A line the voice takes nine and a half seconds over.'), { midBattle: true, name: 'long' }).then(() => (finished = true));
    await pump(8.6);
    expect(finished).toBe(false); // the flat 8 s cap would have cut it already
    await pump(2.0);
    expect(finished).toBe(true);
    const messages = [...info.mock.calls, ...warn.mock.calls].map((c) => String(c[0]));
    expect(messages.filter((m) => m.includes('ran past')), 'the beat was not an overrun').toEqual([]);
  });

  it('a text-only player (the port answers 0 and no recording) gets the old beat: over at its own hold', async () => {
    const { port } = fakeVoice(4000, { text: true });
    const { cutscenes, pump } = mount(port);
    cutscenes.setAutoAdvance(true);
    let finished = false;
    void cutscenes.play(beat('The aeon is waking.'), { midBattle: true, name: 'a' }).then(() => (finished = true));
    await pump(3.0);
    expect(finished).toBe(true);
  });

  it('`skip` playback (instant) speaks nothing and does not even ask', async () => {
    const { port, log } = fakeVoice(4000);
    const { cutscenes } = mount(port);
    cutscenes.setAutoAdvance(true, { instant: true });
    await cutscenes.play(beat('The aeon is waking.'), { midBattle: true, name: 'a' });
    expect(log.begun).toEqual([]);
  });

  it('a benched speaker\'s line is spoken by the authored stand-in with the stand-in\'s own recording, and the beat is costed on every candidate', async () => {
    const { port, log } = fakeVoice(2000);
    const { cutscenes, pump } = mount(port, ['tidus']); // Wakka is not on the field
    cutscenes.setAutoAdvance(true);
    const script: StoryScript = [say('wakka', 'Ya, we hold!', { auto: 1200, fallback: [{ who: 'tidus', text: 'We hold!' }] })];
    void cutscenes.play(script, { midBattle: true, name: 'standin' });
    await pump(0.3);
    expect(log.begun).toEqual([{ who: 'tidus', text: 'We hold!' }]);
    // who speaks is decided line by line as the beat plays, so the deadline was costed on the written speaker AND the stand-in
    const asked = log.asked.map((r) => `${r.who}:${r.text}`);
    expect(asked).toEqual(expect.arrayContaining(['wakka:Ya, we hold!', 'tidus:We hold!']));
  });

  it('a beat that is skipped mid-way stops its voice and starts none for the lines left', async () => {
    const { port, log } = fakeVoice(4000);
    const { cutscenes, pump } = mount(port);
    cutscenes.setAutoAdvance(true);
    const script: StoryScript = [say('tidus', 'First.', { auto: 1200 }), say('tidus', 'Second.', { auto: 1200 }), say('tidus', 'Third.', { auto: 1200 })];
    const done = cutscenes.play(script, { midBattle: true, name: 'skipme' });
    await pump(0.5);
    expect(log.begun).toHaveLength(1);
    cutscenes.skip();
    await pump(0.5);
    await done;
    expect(log.begun).toHaveLength(1); // the runner went on calling `say` for Second and Third; neither spoke
    expect(log.stops).toBeGreaterThan(0);
  });
});
