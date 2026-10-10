/**
 * FFX-2 engine constants.
 *
 * Every number here cites `research/ffx2-combat-core.md` (abbreviated `§`) or a
 * boss dossier. Confidence tags are carried through from the research verbatim.
 *
 * **Do not import anything from `src/engine/**`, `src/ui/**` or `three` here or
 * anywhere under `src/battle/`** — see `docs/ARCHITECTURE.md` "Layering rule".
 */

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

/** Ticks consumed per second at Config ATB speed = Normal. §1.2 `[single source]` */
export const TICK_RATE_BASE = 3000;

/** FFX-2's Config "ATB Mode and Speed" speed setting (`research/ffx-vs-ffx2-presentation.md:278`). */
export type AtbSpeed = 'slow' | 'normal' | 'fast';

/**
 * Config ATB speed multiplies the global tick rate — §1.2's `tickRate()`
 * verbatim: `cfgMul = slow ? 0.53 / 0.71 : fast ? 0.53 / 0.42 : 1`, i.e.
 * Slow 0.746x, Normal 1x, Fast 1.262x, derived from §2.8's status-duration
 * constants (0.71 / 0.53 / 0.42 s per duration unit at Slow / Normal / Fast).
 * `[single source]`. Kept as the research's own quotients, never rounded, so
 * the three settings reproduce §2.8's seconds exactly. FFX-2 only: FFX's CTB
 * has no tick rate.
 */
export const ATB_SPEED_MULTIPLIER: Readonly<Record<AtbSpeed, number>> = {
  slow: 0.53 / 0.71,
  normal: 1,
  fast: 0.53 / 0.42,
};

/**
 * PR-0108: at Config ATB SPEED = **Fast**, a sleeping unit never wakes on its own; at Slow and Normal
 * Sleep runs its clock [§1.5 and §2.8, `[single source: Split Infinity G1004]`; Bailey approved the ATB
 * SPEED row "fine if it's faithful"]. The statuses whose clocks the engine holds at each speed; a
 * hit still wakes a sleeper as before. FFX-2 only: FFX's CTB has no ATB speed.
 */
export const STATUS_CLOCKS_HELD_AT: Readonly<Record<AtbSpeed, ReadonlySet<string>>> = {
  slow: new Set(),
  normal: new Set(),
  fast: new Set(['sleep']),
};

/**
 * PR-0106's switch, **ON** since Bailey's word of 2026-09-27 (D-242, plan §8 Q4; built OFF by iter2-b1):
 * Leblanc's script as SinirothX prints it
 * (`research/ffx2-leblanc-syndicate.md` §19, GameFAQs FAQ 31807, **GameFAQs' reading, our estimate**):
 * the failsafe Not-So-Mighty Guard fires **once**, on her turn 25 + No Love Lost uses (read "on", as
 * the No Love Lost line is), and turn 5 of her loop is Fan Slap, not a repeat of turn 1. It conflicts
 * with the FF Wiki transcription, which the OFF script followed (§5.3; its every-turn failsafe is an
 * AUTHORED reading with no source, §19.2). The engine sets `flags.leblancScriptSinirothX` for the AI
 * when on; `Ffx2EngineOptions.leblancScriptSinirothX` overrides it for a measurement run. FFX-2 only.
 */
export const LEBLANC_SCRIPT_SINIROTHX = true;

/**
 * PR-0107's switch, **OFF** until Bailey rules: a chained link flagged
 * `EnemyGroupDef.opensAsSeparateBattle` (Chapter VI's Acts II and III, separate battles in the
 * source) opens on randomised bars (§1.6, `[single source]`) instead of the continuation's zero.
 * Sourced, but it moves Chapter VI outside its band at human pace (measured in
 * `docs/handoff/iter2-b1.md`), so the plan's stop rule keeps it off; Bailey kept it off on 2026-09-27 (D-242).
 * `Ffx2EngineOptions.separateBattleGauges` overrides it for a measurement run. FFX-2 only.
 */
export const SEPARATE_BATTLE_GAUGES = false;

/** One *drawn* full HUD bar. 24 000 ticks = 8.00 s of runway. §1.2 `[single source]` */
export const TICKS_PER_BAR = 24000;

/**
 * The gauge "value" of an untagged action — the baseline post-action runway.
 * The sheet's default recovery value, and the anchor every worked turn period
 * in §1.2 uses (`Agi 42, value 70 -> 16 279 ticks -> 5.42 s`).
 * §1.4 `[single source]`
 */
export const ATB_BASE_VALUE = 70;

/** `2xRT` doubles the baseline. Trigger Happy, Sentinel, every Dance. §1.4 `[estimate]` */
export const ATB_DOUBLE_RECOVERY_VALUE = 140;

/** Drawn bar clamps at 100%; the internal gauge is simulated to 416%. §1.2 */
export const BAR_INTERNAL_MAX = 4.16;

/** Absolute internal tick ceiling (~33.3 s). §1.2 `[single source]` */
export const ATB_INTERNAL_MAX_TICKS = 99840;

/** Haste raises the global tick rate by 5%. NOT double. §1.2 `[verified: 2 sources]` */
export const HASTE_TICK_MULTIPLIER = 1.05;

/** Slow halves the global tick rate. §1.2 `[verified: 2 sources]` */
export const SLOW_TICK_MULTIPLIER = 0.5;

/** Slow also doubles the CTIM *value*, on top of halving the rate — net x4. §1.3 */
export const SLOW_CHARGE_VALUE_MULTIPLIER = 2;

/** Charge-value tiers. §1.3 `[estimate]` — the ratios are the load-bearing part. */
export const CHARGE_VALUE_INSTANT = 0;
export const CHARGE_VALUE_SHORT = 16;
export const CHARGE_VALUE_MEDIUM = 26;
export const CHARGE_VALUE_LONG = 39;

// ---------------------------------------------------------------------------
// Chain (§1.7)
// ---------------------------------------------------------------------------

/** Chain window after a normal hit: 2 s. `[verified: 2 sources]` */
export const CHAIN_WINDOW_TICKS = 2 * TICK_RATE_BASE;

/** Chain window after a **critical** hit: 3 s. `[verified: 2 sources]` */
export const CHAIN_WINDOW_TICKS_CRIT = 3 * TICK_RATE_BASE;

/** `chainMult = CHAIN_BASE + CHAIN_STEP * chainNumber`. `[verified: 2 sources]` */
export const CHAIN_BASE = 1.4;
export const CHAIN_STEP = 0.05;

/** "Full Chain" is 99 links => x6.35. §1.7 `[single source]` */
export const CHAIN_MAX = 99;

/**
 * A target inside its chain window cannot start executing its own action.
 * §1.7 `[verified: 2 sources]`. Exposed so a difficulty toggle can disable it.
 */
export const CHAIN_LOCKS_ACTIONS = true;

/**
 * IC-1 / PR-0209, **ON** since Bailey's word of 2026-09-27 (D-242, plan §8 Q4; built OFF by iter2-b1): a hit whose result
 * is immune (Invincible, Null Physical / Null Magic, an immune affinity) opens and extends no chain
 * window. No source says it in words (§9.2: misses never chain `[verified: 3 sources]`). ON is
 * **GameFAQs' reading, our estimate** (`research/ffx2-combat-core.md` §10.1: Split_Infinity, FAQ 25872,
 * G1032, attacks on an Invincible target "will fail"; G0905 rule 8, only damaging attacks disturb the
 * gauge); SinirothX's step order (chain at step 13, immunity at step 20) is the one hint the other way.
 * Off keeps the engine as it was before D-242; `Ffx2EngineOptions.immuneHitsSkipChain` overrides it for a
 * measurement run (`tests/unit/iter2-b1-bench.test.ts`, arm `ic1`).
 */
export const IMMUNE_HITS_SKIP_CHAIN = true;

/**
 * An all-target row carrying `extra.namedTargetsOnly` hits only the ids its caller named. Its one
 * row is the Vegnagun Head's **Acta Est Fabula**, whose sourced target is "both Redoubts"
 * (`research/ffx2-vegnagun-shuyin.md` §3.4, `[verified: 2 sources]`); as `all-allies` it also healed
 * the Head itself for 9,999 every cast, which the old all-target wrap (IC-2) had hidden. A
 * boss-side change: **Bailey's call** (`docs/plans/ffx2-engine-fixes-2026-09-26.md`). `false`
 * restores the old target set; `Ffx2EngineOptions.namedTargetsOnly` overrides it for a run.
 */
export const NAMED_TARGETS_ONLY = true;

/**
 * The menu-cancel correction, **ON** (`research/ffx2-combat-core.md` §9.2, commit `ea05f877`,
 * `[verified: 2 sources]`: Split_Infinity G1041 Delay effect / G1042 Action-cancel). Release 17 built
 * "an enemy hit closes an open command menu" (decision sheet 2026-09-25 item 4 A1) from §1.1's
 * wording; §9.2 corrects §1.1: only an ability carrying a **Delay effect** (DELEF) or
 * **Action-cancel** (ACTIC) closes the menu, not every hit. `active.ts` `closesOpenMenu` asks the
 * hitting ability (`menu-cancel.ts` `carriesMenuCancel`: the `weak-delay` / `strong-delay` flags or
 * a `delay-effect` / `action-cancel` status row, all from the sourced data rows). Turned on by
 * Bailey, 2026-09-26 ("I'll take all your recommendations", answering "menu correction on (my
 * recommendation), or keep it as is"); it replaces decision item 4 A1. Measured in
 * `docs/plans/ffx2-engine-fixes-2026-09-26.md` §9.3; no boss number changes.
 * `Ffx2EngineOptions.menuCancelOnlyDelayAbilities` overrides it for a measurement run (`false`
 * replays release 17's rule). FFX-2 only.
 */
export const MENU_CANCEL_ONLY_DELAY_ABILITIES = true;

// ---------------------------------------------------------------------------
// Statuses (§2.8)
// ---------------------------------------------------------------------------

/**
 * `seconds = durationValue * 0.53` at Config ATB speed = Normal, so
 * `ticks = durationValue * 0.53 * 3000`. §2.8 `[single source]`
 */
export const SECONDS_PER_DURATION_UNIT = 0.53;
export const TICKS_PER_DURATION_UNIT = SECONDS_PER_DURATION_UNIT * TICK_RATE_BASE;

/** Remaining duration scales x2.0 on a Slowed unit, x0.95 on a Hasted one. §2.8 */
export const DURATION_SCALE_SLOW = 2.0;
export const DURATION_SCALE_HASTE = 0.95;

/** Regen / Poison payout interval. §2.3 gives the 3% but never the period. `[estimate]` */
export const STATUS_TICK_INTERVAL_TICKS = 3 * TICK_RATE_BASE;

/** Regen and Poison both move ~3% of max HP per interval. §2.3 `[verified: 2 sources]` */
export const REGEN_FRACTION = 0.03;
export const POISON_FRACTION = 0.03;

/** Auto-Life revives at 25% of max HP. §2.3 `[verified: 2 sources]` */
export const AUTO_LIFE_REVIVE_FRACTION = 0.25;

/** Up/Down stack ceiling. §2.8 `[verified: 2 sources]` */
export const STAT_STACK_MAX = 10;

// ---------------------------------------------------------------------------
// Damage pipeline and accuracy (§2.1 to §2.6) — moved to the kernels
// ---------------------------------------------------------------------------

/*
 * Re-parity W3 (FFX-2 only): the damage flowchart's and the hit check's constants (the randomiser 240..271 / 256, the defense term
 * (270 - Def) / 255, the Up/Down 12ths, the critical x2, Berserk x5/4, Protect and Shell halves, the all-target 1/2, the 9999 snap
 * and the caps, the back attack x2, the 64 / 128 / 16 / 1024 divisors, Darkness /4 and the 10 / 10 / 5 points of ACCU, EVA and LUCK stages) are the
 * kernels' own integer operations now (`kernel/damage.ts`, `pipeline.ts`, `settle.ts`, `hit.ts`, `crit.ts`), proven against
 * the exe; the hand-written float chain that read these names is gone.
 */

// ---------------------------------------------------------------------------
// Encounter-specific
// ---------------------------------------------------------------------------

/** Bahamut's deterministic 12-action loop. [ffx2-bahamut §2.1] `[verified: 2 sources]` */
export const BAHAMUT_COUNTDOWN_START = 5;

/**
 * Mega Flare's power: **14, the game's own row** (the monster-magic table, command 0x409c, `power` 14;
 * `research/re-ffx2-commands.md` section 3 and `tests/fixtures/parity/ffx2/command_rows.json`). Bailey, 2026-10-09, shown that
 * the row says 14 where the engine held 24: "Use 14 from the files". The 24 was `[estimate — reasoned]` (ffx2-bahamut §2.3: a
 * constant solved under the old hand-written damage chain against two published damage reports), held at W3 because a boss
 * number waits for Bailey. The record in `fallback-records.ts` and the data ability's record carry the same 14, and the
 * kernels read the record's power.
 */
export const MEGA_FLARE_CONSTANT = 14;

/** Enemy basic Attack constant; 16 makes step 6 a no-op. [ffx2-bahamut §2.3] `[estimate]` */
export const ENEMY_ATTACK_CONSTANT = 16;

/**
 * (Removed in re-parity W3.) `ENEMY_BASE_ACCURACY = 104` was an `[estimate]` the engine used for an enemy whose Accuracy stat
 * was 0 because the FAQs print none for Bahamut (ffx2-bahamut §1.1). The game's own monster rows carry it: every monster of
 * the seven chapters has ACC 95 (`src/data/ffx2/monster-records/`, `research/re-ffx2-commands.md` §7), and accuracy formula 2
 * (the plain Attack of every monster) reads that stat in the race of `kernel/hit.ts`. Nothing reads a baseline any more.
 */

/**
 * The Vegnagun head's cannon fail clock, counted in combined resolved turns of
 * {Head, Redoubt R, Redoubt L} from the Phase B transition.
 * [ffx2-vegnagun-shuyin §4.2.2] `[estimate]` — shipped default, not "Authentic".
 */
export const HEAD_FIRE_AT_TURN = 240;

/** Shuyin's lines 3..6 land at 48 / 96 / 144 / 192. §4.2.2 `[estimate]` */
export const HEAD_LINE_INTERVAL = 48;

/** The Core charges three times, then fires Memento Mori. §4.1 */
export const CORE_CHARGES_BEFORE_MEMENTO = 3;
