/**
 * FFX-2 engine constants.
 *
 * Every number here cites `research/ffx2-combat-core.md` (abbreviated `§`) or a
 * boss dossier. Confidence tags are carried through from the research verbatim.
 *
 * **Do not import anything from `src/engine/**`, `src/ui/**` or `three` here or
 * anywhere under `src/battle/`** — see `docs/ARCHITECTURE.md` "Layering rule".
 */

import { STEPS_PER_SECOND } from './clock.ts';

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

/*
 * Re-parity W4 (FFX-2 only): the engine's clock is the game's logic step (`./clock.ts`: 29.97 a second, measured), and
 * the Config ATB speed is the game's speed table (Slow 70, Normal 95, Fast 120 units a step, `kernel/atb-clock.ts`). The
 * old 3,000-ticks-a-second clock, its Config multipliers (x0.746 / 1 / x1.262), the Haste x1.05 and Slow x0.5 tick rates,
 * the 4.16x bank and the status-duration conversion (0.53 s a unit) are the kernels' own integer operations now. PR-0108
 * ("Sleep never wakes at the Fast speed") needs no switch: the timer lands exactly on 0 at a speed of 120 or 60 and
 * the game never looks at it again (`kernel/status-timers.ts`), which is also why a Hasted sleeper at Fast does wake.
 */
export type { AtbSpeed } from './clock.ts';

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

/** One *drawn* full HUD bar: 24,000 units (8.43 s of the Normal speed). Presentation only. */
export const TICKS_PER_BAR = 24000;

/**
 * The cost of the command that sets every character's STANDARD gauge: Attack (command 0x302d, ATB cost 70 in the game's
 * table). A character's opening wait, the HUD's bar length (`AtbState.required`) and the wait after a turn that played no
 * command of its own (an AI script that declined, an Escape, a Defend) are all this cost over (AGI + 1).
 * `kernel/atb-start.ts` `FFX2_START_COMMAND_ID`; `research/re-ffx2-atb-status.md` section 4.
 */
export const ATB_BASE_VALUE = 70;

/**
 * The ATB cost (Cmd+0x22) of the game's speak command, the command a boss script queues for a voice line: 60, so a voice poll recovers by
 * 60 x 10000 / (AGI + 1) units (Leg 17,142 = 181 steps, Core 16,666 = 176, Tail 5,172 = 55, Head 5,405 = 57 in phase 1 and 8,695 = 92 in
 * phase 2, Shuyin 4,477 = 48: the timer rows of docs/handoff/re-parity-ai-ffx2-a.md, from research/re-ffx2-ai-bahamut-vegnagun.md section 8).
 * A voice line in our scripts is a flavour turn that stands for that command (RC3: the engine's default for a turn that played nothing is
 * the standard gauge, ATB_BASE_VALUE, 70, which made every voice poll a sixth too long).
 */
export const SPEAK_COMMAND_ATB_COST = 60;

/** The ATB cost an ability WITHOUT a game row stands for when it is tagged `2xRT` (Trigger Happy, Sentinel, every Dance; §1.4 `[estimate]`). */
export const ATB_DOUBLE_RECOVERY_VALUE = 140;

/**
 * The cast cost an ability WITHOUT a game row stands for (`AbilityDef.chargeTicks`, the old tiers): the same formula the
 * game's `cost_cast` goes through (`value * 10000 / (AGI + 1)` units), so a derived row keeps the length it always had.
 * §1.3 `[estimate]` for the tiers; the rows the game's tables gave us carry their own.
 */
export const CHARGE_VALUE_INSTANT = 0;
export const CHARGE_VALUE_SHORT = 16;
export const CHARGE_VALUE_MEDIUM = 26;
export const CHARGE_VALUE_LONG = 39;

// ---------------------------------------------------------------------------
// Chain (§1.7)
// ---------------------------------------------------------------------------

/*
 * The chain window stands in for the game's HIT REACTION (a motion-system state the exe holds no length for: re-parity W3
 * handoff section 7). It stays the 2 s and 3 s the old engine used, now in logic steps (29.97 a second): 60 and 90.
 */
/**
 * How long a hit reaction halves the tick: **15 logic steps (0.5 s)**, MEASURED on the running game (2026-10-09,
 * `research/re-ffx2-timing-measured.md` section 5): after a weak Delay hit a girl's tick read 49 (99 halved) for 14 steps in two cases and 15
 * in the third, which is what makes her 4,000 units take 48 steps. The reaction is a motion-system state, so no number in the exe says
 * how long it lasts for another hit; this is one command's measurement used for every damaging hit (a listed open item). The 2 s of the
 * chain window below is a different clock: how long the chain counter lives.
 */
export const HIT_REACTION_STEPS = 15;

/** Chain window after a normal hit: 2 s = 60 logic steps. `[verified: 2 sources]` */
export const CHAIN_WINDOW_TICKS = Math.round(2 * STEPS_PER_SECOND);

/** Chain window after a **critical** hit: 3 s = 90 logic steps. `[verified: 2 sources]` */
export const CHAIN_WINDOW_TICKS_CRIT = Math.round(3 * STEPS_PER_SECOND);

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

/*
 * The menu-cancel correction (Bailey, 2026-09-26: only a Delay command closes an open menu, `research/ffx2-combat-core.md`
 * §9.2) is the game's own rule since re-parity W4: a hit closes the menu when its ATB damage is positive
 * (`apply_atb_damage`, `kernel/atb-interrupt.ts`), which only the commands with the Delay bits (or an ATB damage class) deal.
 * The switch `MENU_CANCEL_ONLY_DELAY_ABILITIES` and the option `menuCancelOnlyDelayAbilities` that replayed release 17's
 * "every hit closes it" are gone with `menu-cancel.ts`.
 */

// ---------------------------------------------------------------------------
// Statuses (§2.8)
// ---------------------------------------------------------------------------

/*
 * Re-parity W4 (FFX-2 only): the status clocks are the game's (`kernel/status-timers.ts`, `status-clock.ts`): a timed
 * group 2 status holds a counter that loses one count for every 1,500 units its owner's speed banks (Doom 10,000), Sleep,
 * Confusion and Berserk a timer of 150,000 / 200,000 / 200,000 units on the raw speed, and Poison and Regen pay
 * `(8 * max HP) >> 8` every 16,000 units. The old conversion (0.53 s a unit, x2.0 on a Slowed owner, x0.95 on a
 * Hasted one) and the Poison and Regen estimate (3% of max HP every 3 s) are gone with the 3,000-ticks-a-second clock.
 */

/**
 * Auto-Life revives at 25% of max HP: the game's own row for the revive it queues (command 0x3025: HP class, formula 7,
 * power 4 of 16; `research/re-ffx2-atb-status.md` section 6.7). §2.3 `[verified: 2 sources]`
 */
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

/**
 * The Mega Flare countdown's number of steps, which is also the highest number the window shows. The game's steps are 150
 * AI polls long (750 polls, 25.03 s of running clock at 29.97 steps a second). RC3: the engine's clock is the logic step now, so
 * Bahamut's countdown turns are idle waits of 150 steps each (ai/bahamut.ts; the first poll after the second Impulse is poll 1, the
 * first number comes at poll 150 and the cast at poll 750). research/re-ffx2-ai-bahamut-vegnagun.md 2.2;
 * docs/handoff/re-parity-ai-ffx2-a.md, timer row B3.
 */
export const BAHAMUT_COUNTDOWN_START = 5;

/** The polls in one countdown step (m168.src:92-141): 5 steps x 150 = 750 polls, one a logic step (RC3: read by ai/bahamut.ts). */
export const BAHAMUT_POLLS_PER_COUNTDOWN_STEP = 150;

/**
 * Whether `searchr`, the weighted target search most boss scripts use, weighs the girls by the scene's start positions
 * (`ai/script-rolls.ts`). The weight rule is proven against the exe; the live positions and the boss's facing are not tracked by
 * this engine (note section 9, "Targets in practice", [L]), so the weights use the scene's start positions with the boss facing the party.
 * Off, the search picks uniformly. Bailey's call; the handoff has the measurement of both.
 */
export const NEAR_WEIGHTED_TARGET_SEARCH = true;

/**
 * Mega Flare's power: **14, the game's own row** (the monster-magic table, command 0x409c, `power` 14;
 * `research/re-ffx2-commands.md` section 3 and `tests/fixtures/parity/ffx2/command_rows.json`). Bailey, 2026-10-09, shown that
 * the row says 14 where the engine held 24: "Use 14 from the files". The 24 was `[estimate — reasoned]` (ffx2-bahamut §2.3: a
 * constant solved under the old hand-written damage chain against two published damage reports), held at W3 because a boss
 * number waits for Bailey. The record in `fallback-records.ts` and the data ability's record carry the same 14, and the
 * kernels read the record's power.
 */
export const MEGA_FLARE_CONSTANT = 14;

/**
 * Whether a physical attack that MISSES a girl still reaches her counter check (re-parity X2-D). The game's result applier runs for
 * every hit determination, a miss included (`research/re-ffx2-ai-fallen-trema.md` 1.2, [H]), and the counter check, called from it,
 * has no hit or miss test of its own (note FFX2-G04 3.6), so Counterattack and Evade & Counter answer a miss as they answer a hit
 * (Magic Counter needs something to have landed, so a miss never gives it). Note FFX2-G04 open question 4 says the miss path "was not
 * traced"; this reading joins two notes' statements. Off, a miss gives no counter. One live check settles it: an Evade & Counter
 * girl and one enemy swing at her that misses.
 */
export const COUNTER_AFTER_MISS = true;

/** Enemy basic Attack constant; 16 makes step 6 a no-op. [ffx2-bahamut §2.3] `[estimate]` */
export const ENEMY_ATTACK_CONSTANT = 16;

/**
 * (Removed in re-parity W3.) `ENEMY_BASE_ACCURACY = 104` was an `[estimate]` the engine used for an enemy whose Accuracy stat
 * was 0 because the FAQs print none for Bahamut (ffx2-bahamut §1.1). The game's own monster rows carry it: every monster of
 * the seven chapters has ACC 95 (`src/data/ffx2/monster-records/`, `research/re-ffx2-commands.md` §7), and accuracy formula 2
 * (the plain Attack of every monster) reads that stat in the race of `kernel/hit.ts`. Nothing reads a baseline any more.
 */

/**
 * The Vegnagun head's cannon fail clock: **100**, the game's own count (re-parity AI lane FFX-2 a,
 * `research/re-ffx2-ai-bahamut-vegnagun.md` 6.1 and finding 5; it was an estimate of 240). One counter shared by {Head, Redoubt R,
 * Redoubt L}, raised by every phase-2 action poll of the three (not the Head's first and third), and the world ends on the Head's
 * first poll that finds it at 100 or more. In the game a poll that counts is one that issues a command, so the unit is turns,
 * the unit this engine counts in; what the 100 come to in seconds is how long each of their commands takes, which is the game's own
 * recovery and cast now that the clock is the logic step (RC3: re-parity W4's gauges, and the voice polls' 60, SPEAK_COMMAND_ATB_COST).
 */
export const HEAD_FIRE_AT_TURN = 100;

/** Shuyin speaks at the clock's 20, 40, 60 and 80 (lines 3 to 6) before it reaches 100 (line 7). m290.src:212-262 */
export const HEAD_LINE_INTERVAL = 20;

/** Once, at the clock's 51, the Head speaks a line of Braska's in the game; our story binding for it is Auron's `auron-halfway` (stale, listed for Bailey). m290.src:264-274 */
export const HEAD_HALFWAY_LINE_AT = 51;

/** The Core charges three times, then fires Memento Mori. §4.1 */
export const CORE_CHARGES_BEFORE_MEMENTO = 3;

/**
 * A Confused girl acts by herself (re-parity RC9 lane X2-H): at her ready moment the game's Confusion pick (exe 0x00649350, `kernel/confusion-pick.ts`) chooses her command and
 * target and she is never asked for a command. Off, a Confused girl keeps her menu, as every build before RC9 did: the switch exists so a measurement can put the old rule back
 * through a module mock, as the other lanes' switches do.
 */
export const CONFUSION_PICK = true;

/**
 * Whether the Garment Grids the data has a layout for (`data/ffx2/garment-grids/layouts.ts`) are the game's real grids (re-parity RC9 lane X2-I; `FFX2-G09`; FFX-2 only): a girl moves to a
 * dressphere node joined to hers directly or through exactly one gate node, and the move crosses that gate (`kernel/grid-path.ts`, `adapt/grid-layout.ts`). Off, every grid is the old ring of its
 * node count with the gates spread over successive links (an `[estimate]`), which is also what a grid with no layout keeps. A measurement and rollback switch; no random draw either way.
 */
export const GRID_LAYOUTS = true;

/**
 * Whether a Garment Grid lists the auto-ability rows its plate row carries (re-parity RC10 lane XD1b; `FFX2-G04` 3.4, `FFX2-G09` 3.5; FFX-2 only): a gate pair is listed once the gates it names are crossed, an
 * always-on pair as soon as the grid is worn, and the ones that keep a status or set an SOS set (Highroad Winds' SOS Haste, Double HP and Double MP of Downtrodder and Tempered Will) join the girl's automatic-status layer
 * (`adapt/auto-grid.ts`). Off, a grid lists no row, as every build before RC10. A measurement and rollback switch; no random draw either way.
 */
export const GRID_AUTO_STATUS = true;

/**
 * Whether a screen exists that lets a player choose the Alchemist's Mix's two items (re-parity RC9 lane X2-G left it for a mockup; the driver's item 88e; FFX-2 only). The engine takes a Mix with two items in
 * `extra` and makes the game's result (`adapt/mix.ts`), but the menu has no way to ask for them, so a Mix picked from the menu is the bare Mix of before: nothing happens and nothing is spent. Off, the Mix row stays
 * listed and is greyed with {@link MIX_PICKER_REASON}, so a player never picks it and an unattended Alchemist (the line the benches and the advisor play) never Mixes; the engine itself is unchanged and a test, an AI or
 * a headless run can still submit a Mix directly. Turn it on when the picker lands.
 */
export const MIX_PICKER = false;

/**
 * The reason the Mix row is greyed while {@link MIX_PICKER} is off. Short on purpose: the desktop row gives the reason about 70 px beside the name (the phone about 120 px) and cuts it with an ellipsis, and the
 * first wording, "needs the item picker" (21 letters), showed as "NEEDS THE ITE..." / "NEEDS THE ITEM ...", which reads as a missing item (r51 merge review, defect 2); "Not built yet" (13 letters) still
 * came out "NOT BUILT Y..." on desktop, so the reason is nine letters. The help line carries the reason before the Mix's effect, so the player still reads what the row does. "Not built" is the wording FFX's aeon order rows already use for a command that is listed but has no code behind it (`ffx/aeon-commands.ts`).
 */
export const MIX_PICKER_REASON = 'Not built';
