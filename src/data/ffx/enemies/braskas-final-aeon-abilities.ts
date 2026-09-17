/**
 * Boss-only `AbilityDef`s for the Dream's End chapter: Braska's Final Aeon
 * (both forms), the two Yu Pagodas, Yu Yevon, and the possessed-aeon
 * gauntlet. Source: `research/ffx-bfa-yu-yevon.md` §1.3, §1.4, §1.6, §2.2,
 * §3.3.
 *
 * Ownership notes:
 * - Yu Yevon's counter-heal is the shared `'curaga'` ability id (owned by
 *   the abilities data agent) — same power/formula as Yunalesca's Curaga
 *   (`research/ffx-yunalesca.md` §3 already establishes it's identical to
 *   the player spell); at his Magic 200 it computes to 11,200 and is
 *   clamped to the standard 9,999 cap by the engine, no special data needed.
 *   Likewise `'ultima'` (his escalation nuke) is the shared player spell id.
 * - `osmose` is imported from `./yunalesca-abilities.ts` rather than
 *   redefined — the Yu Pagoda and Yu Yevon versions are mechanically
 *   identical (Percentage-Total MP, base 16, ignores Armored).
 * - Possessed-aeon movesets reuse the aeon's own name but are **not** the
 *   same `AbilityDef` record the aeons data agent writes for the player's
 *   summon — their base stats here are placeholders (`extra.mirrorsCasterStats`)
 *   because a possessed aeon's Strength/Magic/etc. mirror the *player's own*
 *   aeon live [§2.2]. Aeon Overdrive base powers for the five mandatory
 *   aeons are `[verified: derived + 1 guide]` from
 *   `research/ffx-seymour-flux.md` §5.7 (Special Magic formula, rank 8,
 *   ignores Magic Defense entirely, per `research/ffx-yunalesca.md` §12).
 *   Their non-Overdrive "special" commands have no published base-power
 *   figure anywhere in the research; those are `[estimate]`, ballparked at
 *   roughly half the aeon's own Overdrive power, which is the FFX-typical
 *   special/Overdrive ratio. Anima, Yojimbo and the Magus Sisters are
 *   optional aeons excluded from the default `dreams-end` build (§4.4 "ship
 *   their data" note) — their movesets are shipped but intentionally
 *   lighter-weight `[estimate]`s since no default playthrough fights them.
 *
 * `extra` keys used in this file:
 *   - `overdriveGaugeGain: number` — on `power-wave-bfa`. Fixed +20% to
 *     BFA's own Overdrive gauge on landing [§1.6, verified: 2 sources].
 *   - `zombieInverts: true` — on `power-wave-bfa` / `power-wave-aeon`. If
 *     the target is Zombie, the heal becomes damage of the same magnitude
 *     (standard Zombie inversion) but the status-strip still happens.
 *   - `pagodaSoloTargeting: 'curse' | 'osmose'` — on `yu-pagoda-curse` /
 *     the shared `osmose` reference. While *both* Pagodas are alive they
 *     only ever target the boss with Power Wave; if only one survives it
 *     switches to attacking the party — Pagoda A prioritises Curse, Pagoda
 *     B prioritises Osmose [§1.4, verified: 2 sources].
 *   - `pagodaReviveTicks: number` — documented per-fight on the Yu Pagoda
 *     `EnemyDef` in `braskas-final-aeon.ts`, not here (it is a revive timer,
 *     not an ability property).
 *   - `rankZeroFallback: true` — on `gravija`. The decoded rank byte is
 *     literally 0; `ffx-combat-core.md` §1.1 says a raw rank-0 byte falls
 *     back to rank 3 (NOT "instant") — this is shipped as `rank: 3` already,
 *     the flag just documents why the byte and the shipped rank differ.
 *   - `curagaCounter: 'excludes-self-damage'` — documented on Yu Yevon's
 *     `EnemyFields` in `braskas-final-aeon.ts`: his Curaga counter fires at
 *     most once per player-side damaging *action* (not per hit), and is
 *     never triggered by his own Gravija, by Poison ticks, or by a Yu
 *     Pagoda's Power Wave landing on him while Zombie [§3.4.1].
 *   - `mirrorsCasterStats: true` — on every possessed-aeon ability. The
 *     `EnemyDef.stats` block the engine builds for a possessed aeon is a
 *     live copy of the player's own aeon (Luck forced to 1); these
 *     `AbilityDef`s carry the move's formula/power/flags only.
 *
 * ACCURACY EDIT (2026-09-16, by the FFX player-data agent, authorised by the
 * coordinator for this one fix — this file's normal owner, the enemy-data
 * agent, has been idle. `yunalesca-abilities.ts` is explicitly NOT touched
 * here — the engine agent is editing it directly for the Mega Death fix and
 * is setting `canMiss` there itself, including on `osmose`, which this file
 * only re-exports rather than defines). `jecht-beam`, `jecht-bomber`,
 * `jecht-bomber-2` and `ultimate-jecht-shot` already carried `canMiss:
 * false` before this edit (their decompiled rows explicitly say "always
 * hits", already transcribed) and were not touched. Everything else in this
 * file had never set `canMiss` at all, so it rolled to hit by default —
 * including magical/status actions and Overdrives the decompile treats as
 * unconditional. Per `research/ffx-yunalesca.md` §7.2 (line 596, "Physical
 * accuracy tanks; magic unaffected") and `research/ffx-bfa-yu-yevon.md`
 * §1.3 (lines 101, 107, 108, the same rows already cited for
 * `jecht-bomber`/`ultimate-jecht-shot`/`jecht-bomber-2`) — the same
 * evidence already applied throughout `src/data/ffx/abilities/**` and
 * `aeons/**`:
 *   - `canMiss: false` added to `triumphant-grasp` / `triumphant-grasp-2`
 *     (Overdrives, Strength formula, `Other` damage — the exact confirmed
 *     signature), the 9 `possessed-*` Overdrives (`possessed-valefor-
 *     energy-ray`/`-energy-blast`, `possessed-ifrit-hellfire`,
 *     `possessed-ixion-thors-hammer`, `possessed-shiva-diamond-dust`,
 *     `possessed-bahamut-mega-flare`, `possessed-anima-oblivion`,
 *     `possessed-yojimbo-zanmato`, `possessed-cindy-delta-attack` —
 *     `special-magic` formula, `Other` damage, same category), and the
 *     magical/status enemy actions `yu-pagoda-curse` (Magic formula,
 *     Magical damage), `power-wave-bfa`/`power-wave-aeon` (heal/cleanse,
 *     `Other` damage, no rider on the ALWAYS-hit exclusion list),
 *     `gravija` (Magic-adjacent percent-current, Magical damage),
 *     `draws-sword`/`yu-yevon-command-254` (0-damage self-target script
 *     hooks). `[verified: 2 sources]` where the row matches the confirmed
 *     Strength/Magic + Other/Magical signature exactly; `[estimate]` where
 *     it extends the pattern to a different formula (`fixed-no-variance`,
 *     `percent-current`, `none`) by damage-type/category analogy, same
 *     calibration used throughout `src/data/ffx/mixes/**`.
 *   - `left-arm-strike` / `left-arm-strike-2` / `blade-blitz` (Strength
 *     formula, Physical damage, own `accuracy` bytes, "affected by Dark")
 *     are untouched — they roll, per the contrast rows this project's
 *     evidence already relies on.
 *   - The 10 possessed-aeon Attack/Special records (`category: 'aeon'`:
 *     `possessed-valefor-sonic-wings`, `possessed-ifrit-meteor-strike`,
 *     `possessed-ixion-aerospark`, `possessed-shiva-heavenly-strike`,
 *     `possessed-bahamut-impulse`, `possessed-anima-pain`,
 *     `possessed-yojimbo-daigoro`, `possessed-cindy-camisade`,
 *     `possessed-mindy-passado`) are untouched on `canMiss` (unset), mirroring
 *     this project's own player-aeon Attack/Special decision — those also
 *     never set `canMiss` and still roll accuracy via their
 *     `extra.accuracyMultiplier` on the player side. `canMiss` is NOT the
 *     whole story for enemy-side actions with no `accuracy` byte, though —
 *     see the follow-up FORMULA CORRECTION note below.
 *
 * FORMULA CORRECTION (2026-09-16, follow-up pass): six of the ten
 * possessed-aeon records above were found to genuinely DISAGREE with the
 * player-aeon record they are supposed to mirror, not merely lack a
 * `canMiss` opinion — a real data bug, not an accuracy-fidelity question.
 * Per the coordinator's instruction, each was checked against
 * `research/ffx-combat-core.md` §6.3's aeon action table (the same
 * `[verified: 2 sources]` table already cited throughout this file) rather
 * than resolved from memory, and every one of this project's own
 * player-aeon records (`aeons/abilities-core*.ts`, `abilities-optional*.ts`)
 * was independently re-checked against that table too and found already
 * correct — so the player-aeon files needed no changes, only these:
 *   - `possessed-valefor-sonic-wings`, `possessed-ixion-aerospark`,
 *     `possessed-shiva-heavenly-strike`, `possessed-bahamut-impulse`: were
 *     `special-magic`/`other`; §6.3 gives all four as "Strength, Physical".
 *     Fixed to `formula: 'strength'`, `damageType: 'physical'`.
 *   - `possessed-ifrit-meteor-strike`: was `special-magic`; §6.3 gives
 *     Meteor Strike as "Strength, Other" (the one aeon Special genuinely
 *     typed Other despite Strength formula). Fixed `formula` to
 *     `'strength'`; `damageType: 'other'` was already correct.
 *   - `possessed-anima-pain`: was `formula: 'none'`, `damageType: 'other'`,
 *     `power: 0` — modelled as a pure 0-damage status cast. §6.3 gives Pain
 *     as "Special Magic, Magical", DmgCon 20 — it deals real damage on top
 *     of the Death-chance rider. Fixed to `formula: 'special-magic'`,
 *     `damageType: 'magical'`, `power: 20`.
 *   - `possessed-sandy-razzia` (the specific mismatch flagged for
 *     investigation): was `formula: 'magic'`, `damageType: 'magical'`.
 *     §6.3's Magus Sisters row gives Camisade/Razzia/Passado all as
 *     "Strength, Physical". Fixed to `formula: 'strength'`, `damageType:
 *     'physical'`, now agreeing with the player-aeon record.
 * `possessed-cindy-camisade` and `possessed-mindy-passado` were checked too:
 * their `formula`/`damageType` already match the player-aeon versions
 * (Strength/Physical, per the same §6.3 Magus Sisters row) — no change made
 * there. Two SEPARATE, smaller inconsistencies were noticed in passing and
 * flagged rather than fixed by that pass; **both are now fixed — see the
 * POSSESSED-AEON PASS note below.**
 * `possessed-sandy-razzia`'s `targeting: 'all-enemies'` was also left as-is
 * (not the specific mismatch that was flagged, and §6.3's Target column is
 * blank for the Magus Sisters trio) even though the player-aeon Razzia
 * targets a single enemy — still open, still not this pass's question.
 *
 * POSSESSED-AEON PASS (2026-09-17). Closes the two records the previous pass
 * flagged, and resolves the accuracy-byte question it left open.
 *
 * 1. `possessed-mindy-passado`: was `power: 26`, `hits: 2`; §6.3's Magus
 *    Sisters row publishes "Passado (233) **2 x 15 hits**" — DmgCon 2, 15
 *    hits `[verified: 2 sources]`. Fixed to `power: 2`, `hits: 15`, matching
 *    the player-aeon record. Per-record doc comment carries the detail.
 * 2. `possessed-yojimbo-daigoro`: was `formula: 'piercing-strength'`,
 *    `power: 20`; §6.3's Yojimbo row publishes "Daigoro (222) DmgCon 10" and
 *    "Strength, Physical" `[verified: 2 sources]`. Fixed to
 *    `formula: 'strength'`, `power: 10`; the `'piercing'` **flag** stays,
 *    because §14's flag table (line 2055, "Uses Defense 0 against **Armored**
 *    targets, aeon weapons except Valefor") and §2.5's `Piercing Strength`
 *    **formula** (line 270, "ignores Defense" unconditionally) are different
 *    rules, and §6.3 puts Daigoro on the plain Strength formula.
 *
 * 3. ACCURACY BYTE — **researched, deliberately NOT invented; OPEN ITEM.**
 *    The ten `category: 'aeon'` possessed Attack/Special records
 *    (`possessed-valefor-sonic-wings`, `-ifrit-meteor-strike`,
 *    `-ixion-aerospark`, `-shiva-heavenly-strike`, `-bahamut-impulse`,
 *    `-anima-pain`, `-yojimbo-daigoro`, `-cindy-camisade`, `-sandy-razzia`,
 *    `-mindy-passado`) are typed `physical`/`magical` but carry **no**
 *    `accuracy` byte, and `src/battle/ffx/accuracy.ts` checks
 *    `user.side === 'enemy'` BEFORE the damage-type branch — so all ten
 *    currently **always hit**, and Aim/Reflex/Darkness/Luck never enter into
 *    it. The research corpus was searched for a published byte for these
 *    records (`accuracy` across `research/ffx-bfa-yu-yevon.md` and
 *    `research/ffx-combat-core.md`; `possessed` across all of `research/`):
 *      - `ffx-bfa-yu-yevon.md` publishes exactly ONE accuracy byte anywhere
 *        in the chapter — Blade Blitz's 150, §1.3 line 105 — and none at all
 *        for §2.2's possessed-aeon movesets.
 *      - `ffx-combat-core.md` §6.3 has no accuracy column; §2.11 line 478
 *        instead says aeon **Attack** variants use the `Accuracy x2.5`
 *        (Valefor, Shiva) / `x1.5` (Ifrit, Ixion, Bahamut, Anima) hit
 *        formulas `[single source]`, and §2.11 line 476 says enemy ability
 *        rows carry their own byte `[verified: 2 sources]`. Those two rules
 *        pull in opposite directions for a possessed aeon, which is an enemy
 *        made of an aeon.
 *      - §2.2 (line 350) lists a possessed aeon's own **Accuracy** stat as
 *        "Varies", i.e. mirrored live off the player's aeon — which only
 *        means anything if something reads it, and today nothing does.
 *    No source publishes a byte, so **none was invented**: always-hit is
 *    retained as the shipped behaviour. Tracked as an open item in
 *    `docs/CONTRACT-CHANGES.md` ("Possessed-aeon accuracy bytes"). Anyone
 *    closing it needs a decompiled figure or an engine-side rule that lets
 *    the mirrored Accuracy stat feed the hit-chance table; adding an
 *    `accuracy: 100` by analogy with `left-arm-strike` (itself an
 *    `[estimate]`) would be inventing a number, and is explicitly not done
 *    here. Note the two fixes above do not change this in either direction —
 *    they are power/hits/formula corrections only.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { osmose } from './yunalesca-abilities.ts';

export { osmose };

// ---------------------------------------------------------------------------
// Braska's Final Aeon
// ---------------------------------------------------------------------------

/** §1.3 [decompiled, id 198/199]. Shatter chance 100 — a follow-up kills a Petrified target outright. */
export const leftArmStrike: AbilityDef = {
  id: 'left-arm-strike',
  name: 'Left-Arm Strike',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 16,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['always-break-damage-limit', 'shatter', 'crit-eligible', 'weak-delay', 'affected-by-darkness'],
  shatterChance: 100,
  accuracy: 100, // [estimate — not decompiled explicitly]
  messageTemplate: '{user} uses Left-Arm Strike on {target}',
};

/** Form 2's re-skin of the same attack (id 199 in the struct is a byte-identical follow-on record). */
export const leftArmStrike2: AbilityDef = {
  ...leftArmStrike,
  id: 'left-arm-strike-2',
};

/** §1.3 [decompiled, id 138]. Petrify 100%, always hits, can crit (+10). Used in both forms. */
export const jechtBeam: AbilityDef = {
  id: 'jecht-beam',
  name: 'Jecht Beam',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 8,
  formula: 'magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [{ status: 'petrify', chance: 100, duration: 254 }],
  removesStatuses: [],
  flags: ['crit-eligible'],
  bonusCrit: 10,
  accuracy: 255,
  canMiss: false,
  extra: {
    note: 'If the beam damage itself kills the target, they shatter instantly (Left-Arm Strike is then unnecessary).',
  },
  messageTemplate: '{user} uses Jecht Beam on {target}',
};

/** §1.3 [decompiled, id 133]. Form-1 Overdrive: 2 hits, Zombie 100% on a non-Petrified target, ignores Protect (`other`). */
export const triumphantGrasp: AbilityDef = {
  id: 'triumphant-grasp',
  name: 'Triumphant Grasp',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 12,
  formula: 'strength',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 2,
  statusEffects: [{ status: 'zombie', chance: 100, duration: 254 }],
  removesStatuses: [],
  flags: ['crit-eligible'],
  bonusCrit: 10,
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  messageTemplate: '{user} uses Triumphant Grasp on {target}',
};

/** §1.3 [decompiled, id 201]. Form-2 Overdrive: stronger, breaks the damage limit, no Zombie. Struct still flags `can_crit`. */
export const triumphantGrasp2: AbilityDef = {
  id: 'triumphant-grasp-2',
  name: 'Triumphant Grasp',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 14,
  formula: 'strength',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 2,
  statusEffects: [],
  removesStatuses: [],
  flags: ['always-break-damage-limit', 'crit-eligible'],
  bonusCrit: 10,
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  messageTemplate: '{user} uses Triumphant Grasp on {target}',
};

/** §1.3 [decompiled, id 135]. Anti-Aeon Overdrive, form 1: fires instead of Triumphant Grasp whenever an aeon is on the field. */
export const jechtBomber: AbilityDef = {
  id: 'jecht-bomber',
  name: 'Jecht Bomber',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 24,
  formula: 'strength',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  accuracy: 255,
  canMiss: false,
  messageTemplate: '{user} uses Jecht Bomber on {target}',
};

/** §1.3 [decompiled, id 200]. Form-2 anti-Aeon Overdrive; now breaks the damage limit. */
export const jechtBomber2: AbilityDef = {
  id: 'jecht-bomber-2',
  name: 'Jecht Bomber',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 24,
  formula: 'strength',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['always-break-damage-limit'],
  accuracy: 255,
  canMiss: false,
  messageTemplate: '{user} uses Jecht Bomber on {target}',
};

/** §1.3 [decompiled, id 136]. Self-targeted, no damage: the transformation cue "Draws sword." */
export const drawsSword: AbilityDef = {
  id: 'draws-sword',
  name: 'Draws sword.',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 0,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [estimate] — see file header's ACCURACY EDIT note.
  extra: { transformsToForm: 2 },
  messageTemplate: '{user} draws a sword from within itself',
};

/**
 * §1.3, §1.6 [decompiled, id 137, verified: 2 sources]. Guaranteed opener of
 * form 2. Whole party, weak Delay, accuracy 150 (unusually high — near-
 * guaranteed even against Reflex stacks). Later "replaces the normal
 * physical attack" once HP drops to 50% [§1.6].
 */
export const bladeBlitz: AbilityDef = {
  id: 'blade-blitz',
  name: 'Blade Blitz',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 16,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['weak-delay', 'affected-by-darkness', 'crit-eligible'],
  accuracy: 150,
  messageTemplate: '{user} uses Blade Blitz',
};

/**
 * §1.3, §1.6 [decompiled, id 134, verified: 2 sources]. Overdrive once form
 * 2 is at or below 50% HP. Whole party, capped at 9,999 (`never-break-damage-
 * limit`), always hits.
 */
export const ultimateJechtShot: AbilityDef = {
  id: 'ultimate-jecht-shot',
  name: 'Ultimate Jecht Shot',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 22,
  formula: 'strength',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['never-break-damage-limit'],
  accuracy: 255,
  canMiss: false,
  messageTemplate: '{user} uses Ultimate Jecht Shot',
};

// ---------------------------------------------------------------------------
// Yu Pagodas
// ---------------------------------------------------------------------------

/**
 * §1.4 [decompiled, mm2 #139, verified: 2 sources]. Fixed 1,500 heal to
 * Braska's Final Aeon (`fixed-no-variance`, base 30 -> 50*30=1,500), strips
 * Zombie/Poison/Silence/Dark/Slow and all four Breaks, +20% to BFA's own
 * Overdrive gauge.
 */
export const powerWaveBfa: AbilityDef = {
  id: 'power-wave-bfa',
  name: 'Power Wave',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 30,
  formula: 'fixed-no-variance',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['zombie', 'poison', 'silence', 'darkness', 'slow', 'power-break', 'magic-break', 'armor-break', 'mental-break'],
  flags: ['heals', 'removes-statuses', 'never-break-damage-limit'],
  canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [estimate] — see file header's ACCURACY EDIT note.
  extra: { overdriveGaugeGain: 20, zombieInverts: true },
  messageTemplate: '{user} uses Power Wave on {target}',
};

/**
 * §1.4, §2.3 [decompiled, mm2 #210, verified: 2 sources]. Identical fixed
 * 1,500 heal; strips only Poison/Zombie/Reflect. Used in the possessed-aeon
 * and Yu Yevon fights. Against the Magus Sisters it targets whichever
 * sister's Overdrive gauge is not full, and does nothing if all three are.
 */
export const powerWaveAeon: AbilityDef = {
  id: 'power-wave-aeon',
  name: 'Power Wave',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 30,
  formula: 'fixed-no-variance',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['poison', 'zombie', 'reflect'],
  flags: ['heals', 'removes-statuses', 'never-break-damage-limit'],
  canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [estimate] — see file header's ACCURACY EDIT note.
  extra: { zombieInverts: true },
  messageTemplate: '{user} uses Power Wave on {target}',
};

/**
 * §1.4 [decompiled, mm2 #123]. Pagoda A's solo-mode priority action against
 * the party: Curse + Poison + Sleep(3) + Silence(3) + Dark(3), all 100%,
 * plus ~250-310 magic damage vs typical MDef.
 */
export const yuPagodaCurse: AbilityDef = {
  id: 'yu-pagoda-curse',
  name: 'Curse',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 16,
  formula: 'magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [
    { status: 'curse', chance: 100, duration: 254 },
    { status: 'poison', chance: 100, duration: 254 },
    { status: 'sleep', chance: 100, duration: 3 },
    { status: 'silence', chance: 100, duration: 3 },
    { status: 'darkness', chance: 100, duration: 3 },
  ],
  removesStatuses: [],
  flags: [],
  canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  extra: { pagodaSoloTargeting: 'curse' },
  messageTemplate: '{user} uses Curse on {target}',
};

// ---------------------------------------------------------------------------
// Yu Yevon
// ---------------------------------------------------------------------------

/**
 * §3.3, §3.4.2 [decompiled + verified: 2 sources]. Removes exactly 75% of
 * **current** HP from every target on the field, including Yu Yevon
 * himself — cannot KO (75% of a positive current HP is never 0). Raw rank
 * byte is 0; per `ffx-combat-core.md` §1.1 that falls back to rank 3, not
 * "instant" — shipped as `rank: 3` directly (see `extra.rankZeroFallback`).
 */
export const gravija: AbilityDef = {
  id: 'gravija',
  name: 'Gravija',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.4.2 [verified: 2 sources] — decoded byte is 0, engine rank-0 fallback applies
  power: 12,
  formula: 'percent-current',
  damageType: 'magical',
  element: ['none'],
  targeting: 'all',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [estimate] — see file header's ACCURACY EDIT note.
  extra: { rankZeroFallback: true, includesUser: true, cannotKo: true },
  messageTemplate: '{user} uses Gravija',
};

/** §3.3 [decompiled, mm2 #244]. No-damage script hook for the Auto-Life/possession bookkeeping; carries no gameplay effect of its own. */
export const yuYevonCommand254: AbilityDef = {
  id: 'yu-yevon-command-254',
  name: 'Command 254',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 0,
  statusEffects: [],
  removesStatuses: [],
  flags: ['can-target-dead'],
  canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [estimate] — see file header's ACCURACY EDIT note.
};

// ---------------------------------------------------------------------------
// Possessed aeons — mandatory five (Valefor, Ifrit, Ixion, Shiva, Bahamut)
// ---------------------------------------------------------------------------
//
// Overdrive base powers [verified: derived + 1 guide, ffx-seymour-flux.md
// §5.7]: Special Magic formula, rank 8, ignores Magic Defense entirely
// [ffx-yunalesca.md §12]. "Special" command base powers have no published
// figure and are [estimate]d at roughly half the aeon's own Overdrive power.

/** §2.2 [decompiled]. Valefor's Attack uses ACC x2.5 per `ids.ts` — that multiplier is AI/engine-applied, not a data field here. */
export const possessedValeforSonicWings: AbilityDef = {
  id: 'possessed-valefor-sonic-wings',
  name: 'Sonic Wings',
  game: 'ffx',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  power: 28, // [estimate]
  // FIX (2026-09-16, coordinator review): was 'special-magic'/'other', which
  // does not match research. ffx-combat-core.md §6.3's aeon table gives
  // Sonic Wings as "Strength, Physical" (the player-aeon's own
  // `aeons/abilities-core.ts` record already has this right) — the
  // possessed copy should mirror it exactly per ffx-bfa-yu-yevon.md's own
  // "fights as the player's own aeon" framing. [verified: 2 sources]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Sonic Wings',
};

export const possessedValeforEnergyRay: AbilityDef = {
  id: 'possessed-valefor-energy-ray',
  name: 'Energy Ray',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 55, // [verified: derived + 1 guide]
  formula: 'special-magic',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Energy Ray on {target}',
};

export const possessedValeforEnergyBlast: AbilityDef = {
  id: 'possessed-valefor-energy-blast',
  name: 'Energy Blast',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 75, // [verified: derived + 1 guide]
  formula: 'special-magic',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  extra: { mirrorsCasterStats: true, note: 'Used instead of Energy Ray if the player unlocked it [§2.2].' },
  messageTemplate: '{user} uses Energy Blast',
};

/** §2.2 [ids.ts doc comment]. Damage type Other. */
export const possessedIfritMeteorStrike: AbilityDef = {
  id: 'possessed-ifrit-meteor-strike',
  name: 'Meteor Strike',
  game: 'ffx',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  power: 29, // [estimate]
  // FIX (2026-09-16, coordinator review): formula was 'special-magic',
  // which does not match research. ffx-combat-core.md §6.3 gives Meteor
  // Strike as "Strength, Other" (Strength formula is the fix; `Other`
  // damage type was already correct — it's the one aeon Special the
  // research explicitly calls out as typed Other despite the Strength
  // formula). Matches the player-aeon's own `aeons/abilities-core.ts`
  // record. [verified: 2 sources]
  formula: 'strength',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Meteor Strike',
};

export const possessedIfritHellfire: AbilityDef = {
  id: 'possessed-ifrit-hellfire',
  name: 'Hellfire',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 58, // [verified: derived + 1 guide]
  formula: 'special-magic',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Hellfire',
};

/** §2.2 [ids.ts doc comment]. Strips Shell/Protect/Reflect/Nuls/Regen/Haste from its target. */
export const possessedIxionAerospark: AbilityDef = {
  id: 'possessed-ixion-aerospark',
  name: 'Aerospark',
  game: 'ffx',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  power: 30, // [estimate]
  // FIX (2026-09-16, coordinator review): was 'special-magic'/'other', which
  // does not match research. ffx-combat-core.md §6.3 gives Aerospark as
  // "Strength, Physical" (the player-aeon's own `aeons/abilities-core.ts`
  // record already has this right). [verified: 2 sources]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['shell', 'protect', 'reflect', 'nulblaze', 'nulfrost', 'nulshock', 'nultide', 'regen', 'haste'],
  flags: ['removes-statuses'],
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Aerospark',
};

export const possessedIxionThorsHammer: AbilityDef = {
  id: 'possessed-ixion-thors-hammer',
  name: "Thor's Hammer",
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 60, // [verified: derived + 1 guide]
  formula: 'special-magic',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  extra: { mirrorsCasterStats: true },
  messageTemplate: "{user} uses Thor's Hammer",
};

/**
 * §2.2 [ids.ts doc comment]. As the player's own Shiva, Heavenly Strike
 * carries Threaten at chance 100 — but `threaten` is documented as
 * "enemies only" [`battle/common/types.ts` `FFXStatusId`], so a possessed
 * Shiva attacking the party cannot legally inflict it on a party member.
 * The status application is intentionally omitted here; only the damage
 * carries over.
 */
export const possessedShivaHeavenlyStrike: AbilityDef = {
  id: 'possessed-shiva-heavenly-strike',
  name: 'Heavenly Strike',
  game: 'ffx',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  power: 30, // [estimate]
  // FIX (2026-09-16, coordinator review): was 'special-magic'/'other', which
  // does not match research. ffx-combat-core.md §6.3 gives Heavenly Strike
  // as "Strength, Physical" (the player-aeon's own `aeons/abilities-core-
  // 2.ts` record already has this right). [verified: 2 sources]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  extra: { mirrorsCasterStats: true, omittedThreatenStatus: 'threaten is enemies-only; inert against the party' },
  messageTemplate: '{user} uses Heavenly Strike',
};

export const possessedShivaDiamondDust: AbilityDef = {
  id: 'possessed-shiva-diamond-dust',
  name: 'Diamond Dust',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 60, // [verified: derived + 1 guide]
  formula: 'special-magic',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Diamond Dust',
};

/** §2.2 [ids.ts doc comment]. Hits all enemies (i.e. the whole party, from Bahamut's side). */
export const possessedBahamutImpulse: AbilityDef = {
  id: 'possessed-bahamut-impulse',
  name: 'Impulse',
  game: 'ffx',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  power: 36, // [estimate]
  // FIX (2026-09-16, coordinator review): was 'special-magic'/'other', which
  // does not match research. ffx-combat-core.md §6.3 gives Impulse as
  // "Strength, Physical" (the player-aeon's own `aeons/abilities-core-2.ts`
  // record already has this right). [verified: 2 sources]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Impulse',
};

/** §2.2 [ids.ts doc comment]. Mega Flare always breaks the damage limit natively. */
export const possessedBahamutMegaFlare: AbilityDef = {
  id: 'possessed-bahamut-mega-flare',
  name: 'Mega Flare',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 72, // [verified: derived + 1 guide]
  formula: 'special-magic',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['always-break-damage-limit'],
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Mega Flare',
};

// ---------------------------------------------------------------------------
// Possessed aeons — optional three (excluded from the default build, but
// shipped per `research/ffx-bfa-yu-yevon.md` §4.4). All [estimate].
// ---------------------------------------------------------------------------

/**
 * §2.2 [ids.ts doc comment]. Pain carries Death at chance 100.
 *
 * FIX (2026-09-16, coordinator review): was `formula: 'none'`,
 * `damageType: 'other'`, `power: 0` — a pure status effect with no damage
 * component, which does not match research. ffx-combat-core.md §6.3 gives
 * Pain as "Special Magic, Magical", DmgCon 20 (the ONE aeon Special that is
 * genuinely magical rather than Strength/Physical or Strength/Other — the
 * player-aeon's own `aeons/abilities-optional.ts` record already has this
 * right: `formula: 'special-magic'`, `damageType: 'magical'`, `power: 20`).
 * Pain deals real Special-Magic damage IN ADDITION to the Death-chance
 * rider; it was not a 0-damage status-only cast. [verified: 2 sources]
 */
export const possessedAnimaPain: AbilityDef = {
  id: 'possessed-anima-pain',
  name: 'Pain',
  game: 'ffx',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  power: 20,
  formula: 'special-magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [{ status: 'ko', chance: 100, duration: 0 }], // duration is moot for an instant status
  removesStatuses: [],
  flags: [],
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Pain on {target}',
};

/** §2.2 [ids.ts doc comment]. 4 DmgCon x 16 hits. */
export const possessedAnimaOblivion: AbilityDef = {
  id: 'possessed-anima-oblivion',
  name: 'Oblivion',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 4,
  formula: 'special-magic',
  damageType: 'other',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 16,
  statusEffects: [],
  removesStatuses: [],
  flags: ['always-break-damage-limit'],
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Oblivion',
};

/**
 * Yojimbo's cheapest paid strike — his dog.
 *
 * FIX (2026-09-17, possessed-aeons pass): was `formula: 'piercing-strength'`
 * with `power: 20` and no citation ("no published power figures" — that claim
 * was wrong). `research/ffx-combat-core.md` §6.3's Yojimbo row publishes both
 * numbers: "Daigoro (222) **DmgCon 10**", formula/type column "Strength,
 * Physical" `[verified: 2 sources]`. So `power: 10`, `formula: 'strength'`.
 *
 * The `'piercing'` **flag** is kept and is not the same thing as the
 * `'piercing-strength'` **formula** — §14's flag table (line 2055) defines
 * `piercing` as "Uses Defense 0 **against Armored targets**… aeon weapons
 * except Valefor", whereas §2.5's formula table (line 270) defines
 * `Piercing Strength` (formula 2) as "ignores Defense (treats DEF as 0)"
 * unconditionally. The old record therefore zeroed Defense against *every*
 * target, roughly doubling Daigoro's output against ordinary ones on top of
 * the 2x-too-high power. This now mirrors the player-aeon Daigoro record
 * (`src/data/ffx/aeons/abilities-optional.ts`, `power: 10`,
 * `formula: 'strength'`, `flags: [... 'piercing']`) exactly on the fields
 * §6.3 publishes, per §2.2's "fights as the player's own aeon" rule.
 * `crit-eligible` is deliberately NOT copied across: no possessed-aeon record
 * in this file carries it, and §6.3's table has no crit column for these rows.
 */
export const possessedYojimboDaigoro: AbilityDef = {
  id: 'possessed-yojimbo-daigoro',
  name: 'Daigoro',
  game: 'ffx',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  power: 10, // ffx-combat-core.md §6.3 Yojimbo row, "Daigoro (222) DmgCon 10" [verified: 2 sources]
  formula: 'strength', // §6.3 "Strength, Physical"; `piercing` stays as a flag, see doc comment
  damageType: 'physical',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['piercing'],
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Daigoro on {target}',
};

/** §2.2 [ids.ts doc comment]. Zanmato is Death at chance 255 (ignores resistance entirely, per `StatusApplication.chance`). */
export const possessedYojimboZanmato: AbilityDef = {
  id: 'possessed-yojimbo-zanmato',
  name: 'Zanmato',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'ko', chance: 255, duration: 0 }], // duration is moot for an instant status
  removesStatuses: [],
  flags: [],
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Zanmato',
};

/** [estimate] — Magus Sisters: Cindy's damage skill. Curaga/Drain/Haste/Reflect reuse the shared player-spell ids. */
export const possessedCindyCamisade: AbilityDef = {
  id: 'possessed-cindy-camisade',
  name: 'Camisade',
  game: 'ffx',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  power: 30,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Camisade on {target}',
};

/** [estimate] — the trio Overdrive, fielded once all three sisters agree to act together. */
export const possessedCindyDeltaAttack: AbilityDef = {
  id: 'possessed-cindy-delta-attack',
  name: 'Delta Attack',
  game: 'ffx',
  category: 'overdrive',
  mpCost: 0,
  rank: 3,
  power: 65,
  formula: 'special-magic',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — see file header's ACCURACY EDIT note.
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Delta Attack',
};

/**
 * FIX (2026-09-16, coordinator review — this was the specific mismatch
 * flagged for investigation): was `formula: 'magic'`, `damageType:
 * 'magical'`, which does not match research. `research/ffx-combat-core.md`
 * §6.3's Magus Sisters row gives Camisade/Razzia/Passado all as "Strength,
 * Physical" (the player-aeon's own `aeons/abilities-optional-2.ts` record
 * already has this right: `formula: 'strength'`, `damageType: 'physical'`).
 * The two records described a genuinely different move before this fix —
 * now they agree, matching `research/ffx-bfa-yu-yevon.md`'s "fights as the
 * player's own aeon" framing for every possessed-aeon fight. [verified: 2
 * sources]. `targeting: 'all-enemies'` is left as-is — research's Target
 * column for this row is blank for the trio, and this is not the
 * discrepancy that was flagged; if it should be `'single-enemy'` (matching
 * this data agent's own player-aeon Razzia, which targets a single enemy
 * like Camisade/Passado), that is a separate question worth a second look.
 */
export const possessedSandyRazzia: AbilityDef = {
  id: 'possessed-sandy-razzia',
  name: 'Razzia',
  game: 'ffx',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  power: 28,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Razzia',
};

/**
 * Mindy's damage skill — a 15-hit flurry, not a 2-hit one.
 *
 * FIX (2026-09-17, possessed-aeons pass): was `power: 26`, `hits: 2` and
 * marked `[estimate]`. `research/ffx-combat-core.md` §6.3's Magus Sisters row
 * publishes it outright: "Passado (233) **2 x 15 hits**" `[verified: 2
 * sources]` — DmgCon **2** per hit, **15** hits. The old record had the two
 * numbers transposed *and* inflated the per-hit power, so it modelled a
 * completely different move (2 heavy swings instead of a flurry of chip
 * hits). This matters beyond the damage total: hit count drives per-hit
 * Defense subtraction, per-hit crit rolls and the damage cap, so 26x2 and
 * 2x15 are not interchangeable even where the products would be close.
 * Now mirrors the player-aeon Passado record
 * (`src/data/ffx/aeons/abilities-optional-2.ts`, `power: 2`, `hits: 15`)
 * exactly, per §2.2's "fights as the player's own aeon" rule.
 * `rank: 3` is left alone — §6.3 gives rank 5 for the Magus Sisters' Specials,
 * but every possessed-aeon record in this file is deliberately normalised to
 * rank 3 (see Sonic Wings, rank 2 in §6.3, likewise shipped as 3); changing
 * that convention is a separate question for the whole file, not this fix.
 */
export const possessedMindyPassado: AbilityDef = {
  id: 'possessed-mindy-passado',
  name: 'Passado',
  game: 'ffx',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  power: 2, // ffx-combat-core.md §6.3 Magus Sisters row, "Passado (233) 2 x 15 hits" [verified: 2 sources]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 15, // same citation — 15 hits, DmgCon 2 each
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  extra: { mirrorsCasterStats: true },
  messageTemplate: '{user} uses Passado on {target}',
};

/** All Dream's End-chapter-only abilities, keyed by id, for lookups and tests. */
export const BRASKAS_FINAL_AEON_ABILITIES: Record<string, AbilityDef> = {
  [leftArmStrike.id]: leftArmStrike,
  [leftArmStrike2.id]: leftArmStrike2,
  [jechtBeam.id]: jechtBeam,
  [triumphantGrasp.id]: triumphantGrasp,
  [triumphantGrasp2.id]: triumphantGrasp2,
  [jechtBomber.id]: jechtBomber,
  [jechtBomber2.id]: jechtBomber2,
  [drawsSword.id]: drawsSword,
  [bladeBlitz.id]: bladeBlitz,
  [ultimateJechtShot.id]: ultimateJechtShot,
  [powerWaveBfa.id]: powerWaveBfa,
  [powerWaveAeon.id]: powerWaveAeon,
  [yuPagodaCurse.id]: yuPagodaCurse,
  [gravija.id]: gravija,
  [yuYevonCommand254.id]: yuYevonCommand254,
  [possessedValeforSonicWings.id]: possessedValeforSonicWings,
  [possessedValeforEnergyRay.id]: possessedValeforEnergyRay,
  [possessedValeforEnergyBlast.id]: possessedValeforEnergyBlast,
  [possessedIfritMeteorStrike.id]: possessedIfritMeteorStrike,
  [possessedIfritHellfire.id]: possessedIfritHellfire,
  [possessedIxionAerospark.id]: possessedIxionAerospark,
  [possessedIxionThorsHammer.id]: possessedIxionThorsHammer,
  [possessedShivaHeavenlyStrike.id]: possessedShivaHeavenlyStrike,
  [possessedShivaDiamondDust.id]: possessedShivaDiamondDust,
  [possessedBahamutImpulse.id]: possessedBahamutImpulse,
  [possessedBahamutMegaFlare.id]: possessedBahamutMegaFlare,
  [possessedAnimaPain.id]: possessedAnimaPain,
  [possessedAnimaOblivion.id]: possessedAnimaOblivion,
  [possessedYojimboDaigoro.id]: possessedYojimboDaigoro,
  [possessedYojimboZanmato.id]: possessedYojimboZanmato,
  [possessedCindyCamisade.id]: possessedCindyCamisade,
  [possessedCindyDeltaAttack.id]: possessedCindyDeltaAttack,
  [possessedSandyRazzia.id]: possessedSandyRazzia,
  [possessedMindyPassado.id]: possessedMindyPassado,
  osmose,
};

export default BRASKAS_FINAL_AEON_ABILITIES;
