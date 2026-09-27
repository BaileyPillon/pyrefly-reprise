/**
 * PR-0170: the FFX target step for a lone valid target.
 *
 * Retail FFX still shows the red cursor and waits for a second confirm when
 * one enemy is the only valid target (`research/observed-ffx-steam-2026-09-26.md`
 * §2.1, Spherimorph alone, Attack). The shared `resolveTargetMode` reads one
 * valid target as a finished aim (`auto`), which fired Attack at once and left
 * nothing for Escape to back out of.
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only.** Only the FFX command menu calls
 * this; the FFX-2 half is unsourced (plan §2.1, Steam part 2) and keeps `auto`.
 * Self-only and random-target rows keep `auto`: there is nothing to aim.
 */
import type { AvailableCommand, Targeting } from '../../battle/common/types.ts';
import { resolveTargetMode, type TargetResolution } from './CommandMenuLogic.ts';

/** Rows the player never aims, even when one id is listed. */
const NOT_AIMED = new Set<Targeting>(['self', 'random-enemy', 'random-ally']);

export function ffxTargetMode(cmd: AvailableCommand): TargetResolution {
  const r = resolveTargetMode(cmd);
  if (r.mode !== 'auto') return r;
  if (cmd.targeting && NOT_AIMED.has(cmd.targeting)) return r;
  return { mode: 'choose', candidates: r.targets };
}
