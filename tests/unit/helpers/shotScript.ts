/**
 * A scripted fight through every beat `BattleMoments` plays a shot for, recorded as one ordered call log (`tests/unit/shot-director.test.ts`).
 *
 * The log interleaves what the fakes were asked to do, in order: the camera's moves (`camera:idle` is a tween to a rig, `camera!:enemy` a cut, `camera:push=...`, `camera:release`,
 * `camera:roll=...`, `camera:punch`), the actors' (the party's walk on), and the chrome (`letterbox:*`, `slab:*`, `vignette:*`, `hud:*`, `cue:*`). Each beat of the script is a slice of it, so a test
 * can say what one beat did and what it left alone. Everything runs at `normal` speed unless asked, with an instant sleep, so it is deterministic and takes no time.
 *
 * The beats are arranged so each has camera work of its own to do: a turn starts while a cast's shot is still up, an Overdrive is ended by hand, a telegraph is closed by a later action.
 */

import { BattleMoments } from '../../../src/engine/BattleMoments.ts';
import type { AudioPort, MomentsPort, PlaybackSpeed } from '../../../src/engine/BattlePresenterPorts.ts';
import type { ShotDirector } from '../../../src/engine/ShotDirector.ts';
import { FakeStage, noSleep } from './FakeStage.ts';

/** A stage that may carry a director, as `PaintedStage` does for a scene that publishes one. */
export class DirectedStage extends FakeStage {
  shotDirector?: ShotDirector;
}

/** The chrome the moments raise, written into the same log as the camera. */
class LogMoments implements MomentsPort {
  private readonly log: string[];
  constructor(log: string[]) {
    this.log = log;
  }
  async letterbox(on: boolean): Promise<void> {
    this.log.push(`letterbox:${on ? 'on' : 'off'}`);
  }
  async nameSlab(opts: { title: string; kind: string }): Promise<void> {
    this.log.push(`slab:${opts.kind}:${opts.title}`);
  }
  vignette(on: boolean, opts?: { bpm?: number }): void {
    this.log.push(`vignette:${on ? `on@${opts?.bpm ?? '?'}` : 'off'}`);
  }
  clear(): void {
    this.log.push('clear');
  }
}

/** One beat of the script and the calls it made. */
export interface BeatSlice {
  /** The beat's name; a beat the script plays twice is numbered (`actionClose#2`). */
  beat: string;
  calls: string[];
}

export interface ScriptRun {
  log: string[];
  slices: BeatSlice[];
  stage: DirectedStage;
  moments: BattleMoments;
}

/** The entries of `calls` that move the camera (the fake camera writes `camera:` for a tween and `camera!:` for a cut). */
export const cameraCalls = (calls: readonly string[]): string[] => calls.filter((c) => c.startsWith('camera'));

/** `calls` without the camera's moves: what a beat does besides move the camera. */
export const withoutCamera = (calls: readonly string[]): string[] => calls.filter((c) => !c.startsWith('camera'));

/** Play the script with `director` published on the stage (or none), at `speed`. */
export async function playScript(opts: { director?: ShotDirector; speed?: PlaybackSpeed } = {}): Promise<ScriptRun> {
  const stage = new DirectedStage(['tidus', 'yuna'], ['yunalesca']);
  if (opts.director) stage.shotDirector = opts.director;
  const log = stage.calls;
  const audio: AudioPort = {
    playSfx: (key) => void log.push(`cue:${key}`),
    playMusic: () => undefined,
    stopMusic: () => undefined,
  };
  const speed = opts.speed ?? 'normal';
  const moments = new BattleMoments({
    stage,
    moments: new LogMoments(log),
    audio,
    hud: { setVisible: (visible: boolean) => void log.push(`hud:${visible}`) },
    sleep: noSleep,
    speed: () => speed,
  });

  const slices: BeatSlice[] = [];
  const seen = new Map<string, number>();
  const beat = async (name: string, run: () => unknown): Promise<void> => {
    const from = log.length;
    await run();
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    slices.push({ beat: n === 1 ? name : `${name}#${n}`, calls: log.slice(from) });
  };

  await beat('battleStart', () => moments.battleStart({ partyIds: ['tidus', 'yuna'], bossId: 'yunalesca', bossName: 'Yunalesca' }));
  await beat('actionOpen', () => moments.actionOpen('tidus', 'attack', ['yunalesca'], { abilityId: 'attack', commandKind: 'attack' }));
  await beat('impact', () => moments.impact('yunalesca', { hitIndex: 0, heavy: true }));
  await beat('actionClose', () => moments.actionClose());
  await beat('actionOpen', () => moments.actionOpen('yuna', 'cast', ['yunalesca'], { abilityId: 'fire', commandKind: 'ability' }));
  await beat('turnStart', () => moments.turnStart('tidus'));
  await beat('overdriveStart', () => moments.overdriveStart('tidus', 'Blitz Ace', ['yunalesca'], { abilityId: 'blitz-ace', commandKind: 'overdrive' }));
  await beat('overdriveEnd', () => moments.overdriveEnd());
  await beat('telegraph', () => moments.telegraph('yunalesca', 2, 'Mega Flare'));
  await beat('actionOpen', () => moments.actionOpen('tidus', 'attack', ['yunalesca'], { abilityId: 'attack', commandKind: 'attack' }));
  await beat('actionClose', () => moments.actionClose()); // the telegraph outlives the action it was raised in; this later action's close brings it down
  await beat('formChange', () => moments.formChange('yunalesca'));
  await beat('formChangeEnd', () => moments.formChangeEnd());
  await beat('victory', () => moments.victory());
  return { log, slices, stage, moments };
}
