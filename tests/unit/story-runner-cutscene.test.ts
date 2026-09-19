import { describe, expect, it } from 'vitest';
import {
  camera,
  fx,
  ifFlag,
  jump,
  label,
  music,
  parallel,
  say,
  setFlag,
  setPose,
  showActor,
  wait,
  beat,
  battleStart,
  choice,
  results,
  type StoryScript,
} from '../../src/story/dsl.ts';
import {
  CutsceneRunner,
  createNoopPorts,
  type CutscenePorts,
} from '../../src/story/runner/CutsceneRunner.ts';

/** A promise plus its resolver, for steps the test wants to hold open. */
function deferred<T = void>(): { promise: Promise<T>; resolve: (v: T) => void } {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

/** Records every port call in order, and lets tests hold `say`/`wait` open on demand. */
function fakePorts(log: string[], opts: { holdSay?: boolean; holdWait?: boolean } = {}): {
  ports: CutscenePorts;
  releaseSay: (line?: string) => void;
  releaseWait: () => void;
} {
  const sayGate = deferred<void>();
  const waitGate = deferred<void>();

  const ports: CutscenePorts = createNoopPorts({
    dialogue: {
      say: (step) => {
        log.push(`say:${step.who}:${step.text}`);
        return opts.holdSay ? sayGate.promise : Promise.resolve();
      },
      narrate: (step) => {
        log.push(`narrate:${step.text}`);
        return Promise.resolve();
      },
      choice: (step) => {
        log.push(`choice:${step.resultKey}`);
        return Promise.resolve(step.options[0]?.value ?? '');
      },
    },
    camera: (rig, ms) => {
      log.push(`camera:${rig}:${ms}`);
    },
    fx: (key) => {
      log.push(`fx:${key}`);
    },
    music: (track) => {
      log.push(`music:${track ?? 'null'}`);
    },
    wait: (ms) => {
      log.push(`wait:${ms}`);
      return opts.holdWait ? waitGate.promise : Promise.resolve();
    },
    moveActor: (actor, _to, ms) => {
      log.push(`move:${actor}:${ms}`);
    },
    sfx: (key) => log.push(`sfx:${key}`),
    setPose: (step) => log.push(`pose:${step.actor}:${step.state}`),
    showActor: (step) => {
      log.push(`show:${step.actor}`);
    },
    hideActor: (step) => {
      log.push(`hide:${step.actor}`);
    },
  });

  return {
    ports,
    releaseSay: (line?: string) => {
      log.push(`say-released${line ? `:${line}` : ''}`);
      sayGate.resolve();
    },
    releaseWait: () => {
      log.push('wait-released');
      waitGate.resolve();
    },
  };
}

describe('CutsceneRunner — basic playback', () => {
  it('runs steps in order and resolves "end" for a script with no battleStart/results', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    const script: StoryScript = [
      music('boss-dread'),
      say('auron', 'It is not over.'),
      camera('action', 500),
      fx('spark', 'auron'),
      wait(100),
    ];

    const result = await runner.run(script);

    expect(result).toMatchObject({ type: 'end' });
    expect(log).toEqual([
      'music:boss-dread',
      'say:auron:It is not over.',
      'camera:action:500',
      'fx:spark',
      'wait:100',
    ]);
  });

  it('resolves with battleStart when a pre-script hits its marker, and stops before later steps', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    const script: StoryScript = [say('tidus', 'Here we go.'), battleStart('blackhole'), say('tidus', 'unreachable')];

    const result = await runner.run(script);

    expect(result).toMatchObject({ type: 'battleStart', transition: 'blackhole' });
    expect(log).toEqual(['say:tidus:Here we go.']);
  });

  it('resolves with results (silent flag carried through) when a post-script hits its marker', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    const silent = await runner.run([results(true)]);
    expect(silent).toMatchObject({ type: 'results', silent: true });

    const loud = await runner.run([results()]);
    expect(loud).toMatchObject({ type: 'results', silent: false });
  });

  it('beat() allocates real wait time and never touches the dialogue port', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    await runner.run([beat(1400)]);

    expect(log).toEqual(['wait:1400']);
  });
});

describe('CutsceneRunner — flags, branching and loops', () => {
  it('setFlag/ifFlag branch on truthiness and on explicit equals', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    await runner.run([
      setFlag('met-seymour', true),
      ifFlag('met-seymour', [say('tidus', 'then-branch')], [say('tidus', 'else-branch')]),
      setFlag('mode', 'grim'),
      ifFlag('mode', [say('tidus', 'grim-branch')], [say('tidus', 'other-branch')], 'grim'),
    ]);

    expect(log).toEqual(['say:tidus:then-branch', 'say:tidus:grim-branch']);
  });

  it('takes the else branch when the flag is falsy or unset', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    await runner.run([ifFlag('never-set', [say('tidus', 'then')], [say('tidus', 'else')])]);

    expect(log).toEqual(['say:tidus:else']);
  });

  it('choice() resolves to the picked value and stores it under resultKey', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    await runner.run([
      choice('answer', [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ]),
    ]);

    expect(runner.getFlag('answer')).toBe('yes');
    expect(log).toEqual(['choice:answer']);
  });

  it('jump/label loops a bounded number of times using a counter flag', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    // A tiny counted loop: say a line, bump a counter flag, jump back while
    // under 3; the DSL has no arithmetic step, so each count is its own
    // `ifFlag(n === k)` branch that sets `n` to `k + 1` and loops.
    const script: StoryScript = [
      setFlag('n', 0),
      label('loop'),
      say('wakka', 'tick'),
      ifFlag('n', [setFlag('n', 1), jump('loop')], undefined, 0),
      ifFlag('n', [setFlag('n', 2), jump('loop')], undefined, 1),
      ifFlag('n', [setFlag('n', 3)], undefined, 2),
    ];

    const result = await runner.run(script);

    expect(result).toMatchObject({ type: 'end' });
    expect(log.filter((l) => l === 'say:wakka:tick')).toHaveLength(3);
    expect(runner.getFlag('n')).toBe(3);
  });

  it('aborts after 1000 jumps to guard against an infinite loop', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    const script: StoryScript = [label('spin'), jump('spin')];

    await expect(runner.run(script)).rejects.toThrow(/1000 jumps/);
  });

  it('throws a clear error on a jump to an unknown label', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    await expect(runner.run([jump('nowhere')])).rejects.toThrow(/unknown label "nowhere"/);
  });
});

describe('CutsceneRunner — parallel and actor steps', () => {
  it('parallel steps all fire and the runner continues once every one settles', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    await runner.run([
      parallel(showActor('auron', { ms: 400 }), setPose('kimahri', 'pray'), fx('flash')),
      say('tidus', 'after the parallel'),
    ]);

    expect(log).toContain('show:auron');
    expect(log).toContain('pose:kimahri:pray');
    expect(log).toContain('fx:flash');
    expect(log[log.length - 1]).toBe('say:tidus:after the parallel');
  });

  it('forwards optional showActor/hideActor/setPose/sfx steps to their ports', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log);
    const runner = new CutsceneRunner(ports);

    await runner.run([
      showActor('seymour', { ms: 300 }),
      setPose('seymour', 'idle'),
      { type: 'sfx', key: 'confirm' },
      { type: 'hideActor', actor: 'seymour', ms: 200 },
    ]);

    expect(log).toEqual(['show:seymour', 'pose:seymour:idle', 'sfx:confirm', 'hide:seymour']);
  });

  it('an optional port with no implementation is simply skipped, not an error', async () => {
    const runner = new CutsceneRunner(createNoopPorts());

    await expect(runner.run([showActor('auron'), { type: 'shake', px: 6, ms: 200 }])).resolves.toMatchObject({
      type: 'end',
    });
  });
});

describe('CutsceneRunner — skip-scene support', () => {
  it('skip() unblocks a dialogue line that is currently awaiting player input', async () => {
    const log: string[] = [];
    const { ports, releaseSay } = fakePorts(log, { holdSay: true });
    const runner = new CutsceneRunner(ports);

    const run = runner.run([say('auron', 'Waiting for the player...'), say('auron', 'second line')]);

    // Give the first `say` a tick to actually be awaited before we skip it.
    await Promise.resolve();
    expect(log).toEqual(['say:auron:Waiting for the player...']);

    runner.skip();
    const result = await run;

    expect(result).toMatchObject({ type: 'end' });
    // The second say still fires (skip forwards instantaneous port calls / logs
    // the call itself), but the runner did not block on it either.
    expect(log).toContain('say:auron:second line');
    void releaseSay; // never actually released — skip() is what unblocked it.
  });

  it('skip() unblocks an in-flight beat/wait', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log, { holdWait: true });
    const runner = new CutsceneRunner(ports);

    let settled = false;
    const run = runner.run([beat(2000)]).then((r) => {
      settled = true;
      return r;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    runner.skip();
    const result = await run;

    expect(settled).toBe(true);
    expect(result).toMatchObject({ type: 'end' });
  });

  it('after skip(), every later timed step resolves immediately without waiting on its port', async () => {
    const log: string[] = [];
    const runner = new CutsceneRunner(
      createNoopPorts({
        wait: () => new Promise<void>(() => {}), // never resolves on its own
      }),
    );

    runner.skip();
    const start = Date.now();
    const result = await runner.run([wait(50_000), wait(50_000), wait(50_000)]);
    expect(Date.now() - start).toBeLessThan(500);
    expect(result).toMatchObject({ type: 'end' });
    void log;
  });

  it('skip() still lets battleStart/results end the run normally', async () => {
    const log: string[] = [];
    const { ports } = fakePorts(log, { holdSay: true });
    const runner = new CutsceneRunner(ports);
    runner.skip();

    const result = await runner.run([say('tidus', 'skipped'), battleStart()]);
    expect(result).toMatchObject({ type: 'battleStart', transition: undefined });
  });
});

describe('createNoopPorts', () => {
  it('resolves choice to the first option by default', async () => {
    const runner = new CutsceneRunner(createNoopPorts());
    await runner.run([choice('pick', [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }])]);
    expect(runner.getFlag('pick')).toBe('a');
  });
});
