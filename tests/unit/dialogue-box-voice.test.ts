// @vitest-environment jsdom
/**
 * The dialogue box with a recorded voice: the recording starts with the text, a spoken line is never cut by its own timer,
 * Confirm stops the voice and a voice failure is never a wait. Fake port, fake clock; the real director is covered elsewhere.
 * Game case: both (shared plumbing; the box does not know a game).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { narrate, say } from '../../src/story/dsl.ts';
import { DialogueBox } from '../../src/ui/common/DialogueBox.ts';
import { VOICE_ADVANCE_FADE_MS, type VoiceLineRequest, type VoicePlayback, type VoicePort } from '../../src/story/voice/voicePort.ts';

let wall = 10_000;

/** A recording that the test ends by hand (`hold = 0`), standing for the director's run. */
class FakePlayback implements VoicePlayback {
  hold: number;
  stops: number[] = [];
  constructor(readonly durationMs: number, hold = durationMs + 200) { this.hold = hold; }
  holdMs(): number { return this.hold; }
  stop(fadeMs?: number): void { this.stops.push(fadeMs ?? -1); this.hold = 0; }
}
class FakePort implements VoicePort {
  begun: VoiceLineRequest[] = [];
  runs: FakePlayback[] = [];
  next: FakePlayback | null = null;
  spokenMs(): number { return 0; }
  begin(req: VoiceLineRequest): VoicePlayback | null {
    this.begun.push(req);
    const run = this.next;
    if (run) this.runs.push(run);
    this.next = null;
    return run;
  }
  stop(): void {}
}

function mount(port?: VoicePort, opts: { autoMode?: boolean } = {}) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const box = new DialogueBox({ root, ...(port ? { voice: port } : {}), ...(opts.autoMode ? { autoMode: true } : {}) });
  box.mount();
  return box;
}
/** Type the whole line out (a second is more than any test line needs). */
const typeOut = (box: DialogueBox) => box.update(1);
const tick = (box: DialogueBox, ms: number) => { wall += ms; box.update(0); };
const settled = (p: Promise<void>) => { let done = false; void p.then(() => (done = true)); return () => new Promise<boolean>((r) => setTimeout(() => r(done), 0)); };

beforeEach(() => {
  wall = 10_000;
  vi.spyOn(performance, 'now').mockImplementation(() => wall);
});
afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('starting the recording with the line', () => {
  it('asks for the line by its speaker, text and voiceKey, at the instant the text starts', () => {
    const port = new FakePort();
    const box = mount(port);
    void box.say(say('tidus', 'Hey!', { voiceKey: 'two-takes' }));
    void box.say(say('yuna', 'Yes.'));
    expect(port.begun).toEqual([{ who: 'tidus', text: 'Hey!', voiceKey: 'two-takes' }, { who: 'yuna', text: 'Yes.' }]);
  });

  it('a narrate line is the narrator\'s', () => {
    const port = new FakePort();
    const box = mount(port);
    void box.narrate(narrate('We went on.'));
    expect(port.begun).toEqual([{ who: 'narrator', text: 'We went on.' }]);
  });

  it('with no voice port, or a line with no recording, the box is exactly what it was', async () => {
    const plain = mount();
    const done = settled(plain.say(say('auron', 'Hmph.', { auto: 300 })));
    typeOut(plain);
    tick(plain, 301);
    expect(await done()).toBe(true);

    const port = new FakePort(); // begin() answers null: no recording
    const box = mount(port);
    const done2 = settled(box.say(say('auron', 'Hmph.', { auto: 300 })));
    typeOut(box);
    tick(box, 301);
    expect(await done2()).toBe(true);
  });
});

describe('a voice failure is never a crash', () => {
  it('a port that throws on begin, on holdMs or on stop leaves the line to show and advance as it always did', async () => {
    const throwing: VoicePort = { spokenMs: () => 0, begin: () => { throw new Error('no audio'); }, stop: () => {} };
    const box = mount(throwing);
    const done = settled(box.say(say('tidus', 'Hey!', { auto: 300 })));
    typeOut(box);
    tick(box, 301);
    expect(await done()).toBe(true);

    const port = new FakePort();
    const angry = new FakePlayback(5000);
    angry.holdMs = () => { throw new Error('clock'); };
    angry.stop = () => { throw new Error('stop'); };
    port.next = angry;
    const box2 = mount(port);
    const done2 = settled(box2.say(say('tidus', 'Hey!', { auto: 300 })));
    typeOut(box2);
    tick(box2, 301);
    expect(await done2()).toBe(true);
  });
});

describe('a spoken line is never cut by its own timer', () => {
  it('holds past the line\'s auto until the voice is done, then advances', async () => {
    const port = new FakePort();
    const box = mount(port);
    const run = (port.next = new FakePlayback(5000));
    const done = settled(box.say(say('yuna', 'May they rest.', { auto: 600 })));
    typeOut(box);
    tick(box, 700); // the line\'s own 600 ms has passed
    expect(await done()).toBe(false);
    tick(box, 3000);
    expect(await done()).toBe(false);
    run.hold = 0; // the voice finishes
    tick(box, 16);
    expect(await done()).toBe(true);
  });

  it('holds an AUTO-mode line for its voice as well as for its reading-speed hold', async () => {
    const port = new FakePort();
    const box = mount(port, { autoMode: true });
    const run = (port.next = new FakePlayback(5000));
    const done = settled(box.say(say('auron', 'It is not over.')));
    typeOut(box);
    tick(box, 5000); // far past the reading-speed hold
    expect(await done()).toBe(false);
    run.hold = 0;
    tick(box, 16);
    expect(await done()).toBe(true);
  });

  it('a voice that fails mid-line stops holding at once: a voice failure is never a wait', async () => {
    const port = new FakePort();
    const box = mount(port);
    const run = (port.next = new FakePlayback(5000));
    const done = settled(box.say(say('tidus', 'Hey!', { auto: 600 })));
    typeOut(box);
    tick(box, 700);
    expect(await done()).toBe(false);
    run.hold = 0; // decode failed, context suspended, watchdog: the playback answers 0
    tick(box, 16);
    expect(await done()).toBe(true);
  });

  it('a line that waits on Confirm is not advanced by the end of its voice', async () => {
    const port = new FakePort();
    const box = mount(port);
    const run = (port.next = new FakePlayback(1000));
    const done = settled(box.say(say('tidus', 'Hey!'))); // no auto, AUTO off: waits for the player
    typeOut(box);
    run.hold = 0;
    tick(box, 10_000);
    expect(await done()).toBe(false);
  });
});

describe('advancing, skipping and tearing down', () => {
  it('Confirm while the text is still typing finishes the text and leaves the voice speaking', async () => {
    const port = new FakePort();
    const box = mount(port);
    const run = (port.next = new FakePlayback(5000));
    const done = settled(box.say(say('tidus', 'Hey! You there. Listen to me, will you?')));
    box.update(0.1); // partway through the text
    box.forceAdvance();
    expect(run.stops).toEqual([]);
    expect(await done()).toBe(false);
  });

  it('Confirm on a line that has finished typing advances and stops the voice with a 60 ms fade', async () => {
    const port = new FakePort();
    const box = mount(port);
    const run = (port.next = new FakePlayback(5000));
    const done = settled(box.say(say('tidus', 'Hey!')));
    typeOut(box);
    box.forceAdvance();
    expect(await done()).toBe(true);
    expect(run.stops).toEqual([VOICE_ADVANCE_FADE_MS]);
  });

  it('the next line stops the previous one before its own recording starts', () => {
    const port = new FakePort();
    const box = mount(port);
    const first = (port.next = new FakePlayback(5000));
    void box.say(say('tidus', 'Hey!'));
    const second = (port.next = new FakePlayback(3000));
    void box.say(say('yuna', 'Yes.'));
    expect(first.stops).toHaveLength(1);
    expect(second.stops).toEqual([]);
  });

  it.each([
    ['hide() (skip-scene teardown)', (b: DialogueBox) => b.hide()],
    ['unmount()', (b: DialogueBox) => b.unmount()],
  ])('%s stops the voice', (_name, act) => {
    const port = new FakePort();
    const box = mount(port);
    const run = (port.next = new FakePlayback(5000));
    void box.say(say('tidus', 'Hey!'));
    act(box);
    expect(run.stops).toHaveLength(1);
  });

  it('opening a choice stops the voice of the line before it', () => {
    const port = new FakePort();
    const box = mount(port);
    const run = (port.next = new FakePlayback(5000));
    void box.say(say('tidus', 'Which way?'));
    void box.choice({ type: 'choice', resultKey: 'k', options: [{ label: 'Left', value: 'l' }, { label: 'Right', value: 'r' }] });
    expect(run.stops).toHaveLength(1);
  });
});
