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
 * IC-1's alternative, a named **OFF** switch: when true, a hit whose result is immune (Invincible,
 * Null Physical / Null Magic, an immune affinity) opens and extends no chain window. Whether such a
 * hit staggers is **unsourced** (§9.2: misses never chain `[verified: 3 sources]`; immune hits are not
 * covered; Split_Infinity's "will fail" is the nearest wording, an `[estimate]`). Off keeps the engine
 * as it was; `Ffx2EngineOptions.immuneHitsSkipChain` overrides it for a measurement run.
 */
export const IMMUNE_HITS_SKIP_CHAIN = false;

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
 * The menu-cancel correction, a named **OFF** switch (`research/ffx2-combat-core.md` §9.2, commit
 * `ea05f877`, `[verified: 2 sources]`: Split_Infinity G1041 / G1042). Release 17 built "an enemy hit
 * closes an open command menu" (decision sheet 2026-09-25 item 4 A1) from §1.1's wording; §9.2
 * corrects §1.1: only an ability carrying a **Delay effect** (DELEF) or **Action-cancel** (ACTIC)
 * closes the menu, not every hit. When true, `active.ts` `closesOpenMenu` asks the hitting ability
 * (`carriesMenuCancel`: the `weak-delay` / `strong-delay` flags or a `delay-effect` / `action-cancel`
 * status row, all from the sourced data rows). Off keeps release 17's behaviour until Bailey picks
 * (`docs/plans/ffx2-engine-fixes-2026-09-26.md` §9); `Ffx2EngineOptions.menuCancelOnlyDelayAbilities`
 * overrides it for a measurement run. FFX-2 only.
 */
export const MENU_CANCEL_ONLY_DELAY_ABILITIES = false;

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
// Damage pipeline (§2.1, §2.4)
// ---------------------------------------------------------------------------

/** Step 7 randomiser: `prev * rand(240..271) / 256`. §2.1 `[verified: 2 sources]` */
export const RANDOM_MIN = 240;
export const RANDOM_MAX = 271;
export const RANDOM_DIVISOR = 256;

/** Step 3 defense term numerator: `(270 - Def) / 255`. §2.1 */
export const DEFENSE_NUMERATOR = 270;
export const DEFENSE_DIVISOR = 255;

/** Steps 4/5 Up-Down denominator: `(12 +/- level) / 12`. §2.1 */
export const UPDOWN_DIVISOR = 12;

/** Step 9 critical multiplier. §2.5 `[verified: 2 sources]` */
export const CRIT_MULTIPLIER = 2;

/** Step 10 — the attacker is Berserked. **x1.25 in X-2, not FFX's x1.5.** §2.2 */
export const BERSERK_MULTIPLIER = 1.25;

/** Step 11 back attack. Not reachable in our scripted boss fights. §2.5 */
export const BACK_ATTACK_MULTIPLIER = 2;

/** Step 15: player Black/White magic cast on *all* targets. §2.1 */
export const MULTI_TARGET_MULTIPLIER = 0.5;

/**
 * Step 15 is scoped to the *player's* spell categories in the source. If a
 * future decompile shows enemy party-wide magic is halved too, flip this and
 * double the Mega Flare constant to 34 [ffx2-bahamut §2.3].
 */
export const ENEMY_MULTI_TARGET_MAGIC_IS_HALVED = false;

/** Steps 16. Protect / Shell each halve their reducible class. §2.1 */
export const PROTECT_MULTIPLIER = 0.5;
export const SHELL_MULTIPLIER = 0.5;

/** Step 18: the 9999-damage status (Cat Nip) floors any 1..9998 to 9999. §2.1 */
export const DAMAGE_9999 = 9999;

/** Step 19 caps. §2.4 `[verified: 2 sources]` */
export const DAMAGE_CAP = 9999;
export const DAMAGE_CAP_BROKEN = 99999;

/** Step 1 magic base uses `Lv * 2 + Mag`; the constant lands at step 2. §2.1 */
export const MAGIC_CONSTANT_DIVISOR = 64;
export const MAGIC_RECOVERY_CONSTANT_DIVISOR = 128;

/** Step 6 physical / special-magic constant: `prev * C / 16`. §2.1 */
export const PHYSICAL_CONSTANT_DIVISOR = 16;

/** Step 1 physical/special-magic base divisor: `(Lv + Str) * Lv * Str / 1024`. §2.1 */
export const BASE_CUBIC_DIVISOR = 1024;

// ---------------------------------------------------------------------------
// Accuracy (§2.6)
// ---------------------------------------------------------------------------

/** Darkness divides Accuracy by 4 — it does not subtract. §2.6 `[single source]` */
export const DARKNESS_ACCURACY_DIVISOR = 4;

/** ACCU / EVA Up-Down are worth flat points in the hit check. §2.8 `[verified: 2 sources]` */
export const ACCU_POINTS_PER_LEVEL = 10;
export const EVA_POINTS_PER_LEVEL = 10;

/** LUCK Up-Down is worth 5 flat points in the hit check. §2.8 */
export const LUCK_POINTS_PER_LEVEL = 5;

// ---------------------------------------------------------------------------
// Encounter-specific
// ---------------------------------------------------------------------------

/** Bahamut's deterministic 12-action loop. [ffx2-bahamut §2.1] `[verified: 2 sources]` */
export const BAHAMUT_COUNTDOWN_START = 5;

/** Mega Flare's solved damage constant. [ffx2-bahamut §2.3] `[estimate — reasoned]` */
export const MEGA_FLARE_CONSTANT = 24;

/** Enemy basic Attack constant; 16 makes step 6 a no-op. [ffx2-bahamut §2.3] `[estimate]` */
export const ENEMY_ATTACK_CONSTANT = 16;

/**
 * Accuracy an enemy action uses when the enemy's own Accuracy stat is 0.
 *
 * **Recorded conflict, resolved here.** [ffx2-bahamut §1.1] establishes that
 * Accuracy is genuinely *absent* from the Bevelle Bahamut's record and should
 * be implemented as 0 — then quotes a superseded, Luck-blind hit model
 * (`0.90 + (acc - eva)/200`) to derive an 80–89% band. §2.6 of the core doc
 * later *decoded* the real equation, and it is a flat additive points race that
 * consumes **Luck on both sides**. Under the decoded equation an enemy at
 * Accuracy 0 literally never connects, which contradicts every description of
 * the fight, so enemy actions get a baseline instead.
 *
 * 104 is the value that reproduces the dossier's own Gunner row exactly
 * (`104 + 3 luck - (4 eva + 15 luck) = 88%`). The Thief comes out dodgier than
 * the dossier's Luck-blind estimate because her Luck 26 counts — which is the
 * dossier's own design read ("the only dressphere that meaningfully dodges
 * him"), just with more teeth. `[estimate]`
 */
export const ENEMY_BASE_ACCURACY = 104;

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
