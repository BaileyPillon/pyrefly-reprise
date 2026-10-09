/**
 * FFX-2 ATB kernel: the entry point. How the gauge of every character is paced in the game's own units,
 * read from FFX-2.exe.
 *
 * **Game case: FFX-2 only** (FFX is CTB; its timing is `src/battle/ffx/kernel/ctb*.ts`). Source: FFX-2.exe,
 * Steam build 25501027 (SHA-256 6EA7F142...CD69), image base 0x400000. Spec: `research/re-ffx2-atb-status.md`.
 * Pure, deterministic, no DOM, no engine types (AGENTS.md rule 1). NOT wired into the engine: the engine still
 * runs a fixed 3,000 ticks a second with a 4.16x fill cap (`ffx2/gauges.ts`). Randomness comes from a
 * `draw(stream)` callback (`./rng.ts`).
 *
 * The parts, each a file under 400 lines:
 *
 * | File | Contents | Game functions (live VAs) |
 * |---|---|---|
 * | `atb-clock.ts` | rom.bin speeds, stop states, the clock gate, the Wait flag, per-step speeds | 0x6349f0, 0x6430c0, 0x633f60, 0x634ab0 |
 * | `atb-gauge.ts` | recovery, thinking, charge time, command complete, the per-character step | 0x634110, 0x634170, 0x644520, 0x640190, 0x634b10, 0x634ad0 |
 * | `atb-tick.ts` | all characters in one step, the ready order, the hand-off, the per-step requests | 0x6343a0 |
 * | `atb-start.ts` | the opening gauge, the preemptive / ambush roll and resets, the opening trim | 0x634700, 0x634870, 0x618b60, 0x634280 |
 * | `atb-interrupt.ts` | charge start and countdown, delay damage, magic cancel | 0x644f10, 0x644770, 0x61b620, 0x618dd0 |
 * | `status-timers.ts`, `status-timers-set.ts` | the status clocks (see their own headers) | 0x636e80, 0x636c70, 0x636660 |
 *
 * **One logic step.** The game advances everything once per "logic step" (`pp_battle_logic_step`, 0x61e440), in
 * this order: the ATB process (recovery, thinking, ready, the requests), the action dispatcher (the charge
 * countdown), the status process (`./status-timers.ts`). The frame pacer measures real time in "fields" of 1/60 s
 * and plans one step per two fields (1/30 s), but it also runs one step when fewer than two fields have passed;
 * whether the PC build runs 30 or 60 steps a second depends on how often the platform loop calls the main frame
 * function, and static analysis has not settled it. Use {@link stepsToSeconds} with both before quoting a time.
 */

export * from './atb-clock.ts';
export * from './atb-gauge.ts';
export * from './atb-tick.ts';
export * from './atb-start.ts';
export * from './atb-interrupt.ts';
