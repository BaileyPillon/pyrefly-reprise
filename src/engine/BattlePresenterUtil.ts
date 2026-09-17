/**
 * Small pure helpers the playback loop leans on.
 *
 * Kept beside the loop rather than inside it so `BattlePresenter.ts` stays
 * under the house 400-line cap and reads as nothing but the protocol.
 */

import type {
  AtbSnapshot,
  AvailableCommand,
  BattleEngine,
  BattleEvent,
  BattleResult,
  MinigameKind,
  MinigameResult,
  Command,
  FFX2BattleEngine,
  FFXBattleEngine,
  TurnPreview,
} from '../battle/common/types.ts';
import type { BattleOutcome } from './BattlePresenter.ts';
import type { PlaybackSpeed, PresenterDeps } from './BattlePresenterPorts.ts';
import type { StoryScript } from '../story/dsl.ts';

/** FFX gives a CTB forecast; FFX-2 gives gauges. Either drives the HUD. */
export function previewOf(engine: BattleEngine, previewCommand?: Command): TurnPreview[] | AtbSnapshot {
  const ffx = engine as Partial<FFXBattleEngine>;
  if (typeof ffx.predictTurnOrder === 'function') {
    return ffx.predictTurnOrder(10, previewCommand);
  }
  const x2 = engine as Partial<FFX2BattleEngine>;
  if (typeof x2.gaugeSnapshot === 'function') return x2.gaugeSnapshot();
  return [];
}

export function firstEnabled(commands: AvailableCommand[]): Command | null {
  const row = commands.find((c) => c.enabled) ?? commands[0];
  if (!row) return null;
  const targets = row.command.targets.length ? row.command.targets : row.validTargets.slice(0, 1);
  return { ...row.command, targets } as Command;
}

export function outcomeOf(result: BattleResult | null): BattleOutcome {
  if (!result) return { kind: 'aborted' };
  if (result.outcome === 'defeat') return { kind: 'defeat', result };
  if (result.outcome === 'escape') return { kind: 'escape', result };
  return { kind: 'victory', result };
}

export const SPEED_SCALE: Record<PlaybackSpeed, number> = { normal: 1, fast: 0.32, skip: 0 };

/** How long the presenter will wait on `HudPort.onEvent` before moving on. */
export const HUD_EVENT_BUDGET_MS = 600;

/**
 * The presenter's backstop for a cutscene runner that has stopped answering at
 * all — a port that never resolves, a runner torn down under it.
 *
 * It is **not** the pacing control: the runner caps each beat itself
 * (`story/registry.ts`'s `midBattleDeadlineMs` — 8 s for a beat, a seam's own
 * length for a seam) and cuts it short. This number only decides how long the
 * fight waits on a runner that is never coming back, which is why it stays
 * generous; `SEAM_BUDGET_MS` (26 s) has to fit under it.
 */
export const SCRIPT_BUDGET_MS = 30_000;

/**
 * Decisions in a row with nothing added to the event log before the presenter
 * calls it a livelock.
 *
 * Generous, because a legitimate turn can produce no events (a status tick
 * that changes nothing, an AI passing). A genuinely stuck engine hits this in
 * milliseconds.
 */
export const LIVELOCK_SPINS = 400;

/**
 * Player-input decisions in a row, with no enemy turn or tick between them,
 * before the presenter calls it a stuck command.
 *
 * A healthy CTB battle alternates: a player submit is followed by a resolved
 * decision (the next `turn-start`). The measured failure — a timed Overdrive
 * whose request re-fires on every bare re-submit — produced 19,916 in a row.
 */
export const INPUT_STREAK_LIMIT = 25;

/**
 * `setTimeout` even for zero, because a resolved promise is a **microtask**.
 *
 * A whole battle of `Promise.resolve()` waits never returns to the event loop,
 * so `requestAnimationFrame` never fires and the page freezes solid until the
 * last event — which is exactly what `speed: 'skip'` would otherwise do to the
 * e2e specs and the critic. A macrotask yield keeps the frame loop breathing
 * while still resolving a chapter in a couple of seconds.
 */
export const defaultSleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, Math.max(0, ms)));

/** `HudPort.onEvent` may show a transient, but never blocks playback. */
export async function notifyHud(
  hud: PresenterDeps['hud'],
  event: BattleEvent,
  sleep: (ms: number) => Promise<void>,
): Promise<void> {
  if (!hud) return;
  try {
    const p = hud.onEvent(event);
    if (p && typeof (p as Promise<void>).then === 'function') {
      await Promise.race([p, sleep(HUD_EVENT_BUDGET_MS)]);
    }
  } catch (err) {
    console.warn('[presenter] HUD onEvent threw; continuing', err);
  }
}

/** Run one mid-battle story script, then resume playback. */
export async function runMidBattleScript(
  deps: PresenterDeps,
  name: string,
  sleep: (ms: number) => Promise<void>,
): Promise<void> {
  const script: StoryScript | undefined = deps.midScripts?.[name];
  const runner = deps.cutscenes;
  if (!script || !runner) {
    // The story agent has not landed this script yet: log and keep fighting.
    if (!script) console.info(`[presenter] no mid-battle script for trigger "${name}"`);
    return;
  }
  // The HUD stays up. A mid-battle beat is a line spoken *over* a fight the
  // player is still in the middle of, and the CTB list, the party bars and the
  // enemy's charge state are the context the line is about — Paine's "That's a
  // timer" means nothing with Bahamut's countdown badge hidden. The runner dims
  // the scene instead (`app/screens/BattleScreenCutscenes.ts`, 35% as in
  // `research/visual-bible.md` §3.3/§3.14). Hiding the HUD here is what turned
  // a beat that overran into a battle with no UI on screen at all.
  try {
    // A script must never be able to wedge a battle. The runner caps each beat
    // itself; this race is the backstop for a runner that has stopped
    // answering, and it resumes the fight loudly.
    const timedOut = Symbol('cutscene-timeout');
    const raced = await Promise.race([
      runner.play(script, { midBattle: true, name }).then(() => null),
      sleep(SCRIPT_BUDGET_MS).then(() => timedOut),
    ]);
    if (raced === timedOut) {
      console.error(
        `[presenter] mid-battle script "${name}" did not finish within ` +
          `${SCRIPT_BUDGET_MS}ms; abandoning the beat and resuming the battle`,
      );
    }
  } catch (err) {
    console.warn(`[presenter] mid-battle script "${name}" failed`, err);
  }
}

/** Re-render a HUD from live engine state, never letting it throw into the loop. */
export function syncHud(hud: PresenterDeps['hud'], engine: BattleEngine): void {
  if (!hud) return;
  try {
    hud.sync(engine.state(), previewOf(engine));
  } catch (err) {
    console.warn('[presenter] HUD sync threw', err);
  }
}

/** Ask the HUD to run a minigame. `undefined` = no HUD, or it failed. */
export async function askMinigame(
  hud: PresenterDeps['hud'],
  request: { kind: MinigameKind; params: Record<string, unknown> },
): Promise<MinigameResult | undefined> {
  if (!hud) return undefined;
  try {
    return await hud.openMinigame(request.kind, request.params);
  } catch (err) {
    console.warn('[presenter] minigame overlay failed; re-submitting bare', err);
    return undefined;
  }
}
