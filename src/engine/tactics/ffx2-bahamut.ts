/**
 * Chapter 4 — Bahamut, Bevelle Underground [research/ffx2-bahamut.md].
 *
 * This is the file to edit for Chapter 4 and nothing else; the shared reading
 * helpers live in `./common.ts` and the registry in `./index.ts`.
 *
 * **The one fact the whole encounter is an expression of** (§1.2): *Defense 160
 * is enormous; Magic Defense 10 is almost nothing.* A Lv 24 Warrior's plain
 * swing does ~85 into 8,400 HP — about 99 swings to kill — so the fight is not
 * a damage race the party can win by attacking. Everything below routes around
 * Defense instead.
 *
 * **His script is a fixed 12-action loop with no HP trigger and no phases**
 * (§2.1): Curse, three Attacks, two Impulses, five dead countdown turns, Mega
 * Flare, repeat. The party therefore knows exactly what is coming and when, and
 * §2.4 does the arithmetic on it: unbuffed, the two Impulses leave everyone at
 * 39.1% of max and the following Mega Flare then kills **all three** — "Total
 * party wipe". The measured shipped run before this tactic existed did exactly
 * that: defeat in 42 turns, all three KO on the first Mega Flare.
 *
 * ### The line this tactic plays
 *
 * It is §3.1's canonical doctrine with §3.1's own documented substitution —
 * "if Alchemist isn't owned, a **White Mage with Shell, Protect and Curaga**
 * covers the role" — because `src/data/ffx2/builds/bevelle.ts` fields White
 * Mage / Dark Knight / Warrior:
 *
 * 1. **Shell on everyone, before anything else.** §3.3 tags it *Essential* and
 *    §2.4 quantifies it: Shell takes the Impulse pair from leaving 39.1% to
 *    leaving 66.0%, and halves Mega Flare, so that "under Shell *every*
 *    dressphere in the table survives from full HP". It is cast first and
 *    re-cast the moment anyone is without it. The White Mage's Shell is
 *    `all-allies`, so one cast covers the party.
 *
 *    **Shell is not the *only* survival route, and this file used to say it
 *    was.** §2.4's "minimum survival budget" table lists three, and a round-2
 *    sweep measured all three in this engine on seeds 1-30
 *    [`critic/scratch/bahamut-r2-variants.test.ts`]:
 *
 *    | §2.4 route | measured here |
 *    |---|---|
 *    | **Shell** ("everyone survives without any healing") | 30/30 wins with no Breaks at all, 54-55 turns |
 *    | **Magic Break x5** ("everyone survives trivially") | 30/30 wins with no Shell and no healing, 38-51 turns |
 *    | **Heal only** (§2.4 calls it insufficient for a 917-HP Alchemist) | 25/30 — the marginal one, exactly as §2.4 implies |
 *
 *    That is the encounter behaving as researched, not a hole: §2.4 offers the
 *    player three ways to clear the Mega Flare bar and this line takes two of
 *    them because §3.1's doctrine takes two of them. What is *not* survivable
 *    is taking none — see "the losing lines" below. The line keeps Shell
 *    because it is free (one cast, all-allies), because it is what §3.1's
 *    White Mage substitution says to open with, and because it is what makes
 *    the measured runs death-free from the first Impulse onward rather than
 *    only from the fifth Break.
 * 2. **Magic Break x5, then Mental Break x5, then Armor Break x5.** §3.3's
 *    corrected ranking, and §1.5's mechanic: a Break sets a stack level, not a
 *    stat, worth `(12 +/- n)/12` once inside the damage pipeline, 2 stacks a
 *    cast, capped at 10. Magic Break is "Best in fight" — it takes Mega Flare
 *    to x0.167 and Impulse to 6.25% of current HP, i.e. it defuses the entire
 *    win condition. Mental Break is next because it is a **flat x1.833 on the
 *    party's magic that does not care about MDef 10**. Armor Break (x1.833 on
 *    physicals) is third, "Good, not decisive". Power Break is deliberately
 *    **never cast**: §3.3 ranks it last because it neutralises turns 2-4, the
 *    threat that was never dangerous (~115-200 a hit).
 * 3. **Darkness every single turn** from the Dark Knight — §3.1 step 3, and
 *    §3.2 is the justification: it **ignores Defense 160**, hits all enemies,
 *    costs 12.5% of the user's own max HP and no MP, and "Darkness bypassing
 *    Defense 160 is the entire point". The game hands the player the Dark
 *    Knight sphere in this very dungeon, immediately before the test.
 * 4. **Top the party back up during the five countdown turns.** §2.4: "The
 *    fight's whole rhythm is: survive -> get five free turns -> spend them on
 *    damage *and* on getting back above the Mega Flare threshold."
 *
 * Measured with that line on `bevelleBuild`: **200 wins in 200 contiguous
 * seeds**, the four orchestrator seeds among them, all three girls alive at the
 * end of every one of the four, and Bahamut dead in ~47-50 player turns —
 * faster than any of the single-lever lines above
 * [`tests/unit/strategy-ffx2-bahamut.test.ts`].
 *
 * ### The losing lines, and why the encounter is still a test
 *
 * Measured on the same harness, same build, same seeds 1-30:
 *
 * * **Mash Attack**: 0/30. §1.2's thesis, arithmetically — ~90 a swing into
 *   8,400 HP behind Defense 160, and §3.3 ranks plain attacking *Poor* for
 *   exactly that reason. Defeat at ~41 turns with 3,568-3,749 HP left on him.
 * * **Darkness every turn with no mitigation at all** — no Shell, no Break, no
 *   heal: **0/30**, and it is the *fastest* loss of the lot, defeat at ~26-40
 *   turns on the **first** Mega Flare with 2,760-4,398 still on him. Routing around
 *   Defense 160 (§3.2) is necessary and is not sufficient; §2.4's wipe is not
 *   optional homework.
 *
 * So the encounter demands a mitigation lever and punishes having none. It does
 * not demand one *particular* lever, and the research does not either.
 *
 * ### Two things this tactic deliberately does not do
 *
 * * **It never cures Curse.** X-2 Curse is *"cannot spherechange"*, not the FFX
 *   Curse — it costs no HP and blocks nothing this line uses (§2.3). Spending a
 *   White Mage turn on Esuna for it would be spending the countdown window on
 *   nothing. §2.3's own design read is that Curse "is a targeted attack on the
 *   player's *systems*", which is a punishment for grid-hopping strategies;
 *   this one does not hop.
 * * **It never spherechanges.** §3.1 step 5 only reaches for a second Dark
 *   Knight "if the fight is still going once all four stats are capped", and it
 *   never is: Bahamut is dead first. Dropping a Warrior mid-fight would also
 *   throw away her Break stacks' upkeep and cost a turn for nothing.
 *
 * ### Engine defects this encounter surfaced (both fixed, both cited)
 *
 * * `validTargetIds` collapsed every `single-*` ability to **one** legal
 *   target, so the White Mage's Cure/Cura could only ever be aimed at whichever
 *   ally sorted first and she could not heal the other two at all
 *   [`src/battle/ffx2/targeting.ts`, docs/CONTRACT-CHANGES.md, 2026-09-17 `ffx2-bahamut`].
 * * Impulse and Mega Flare could be **evaded**. The engine's fallback ability
 *   table omitted `canMiss: false`, which the data record carries, and the AI
 *   script submits the engine-side ids — so party-wide magic rolled the hit
 *   table [`src/battle/ffx2/abilities-core.ts`, §2.2, §1.1]. That bug was in
 *   the *party's* favour; fixing it made the fight harder, not easier.
 *
 * ### Corrected since the first round
 *
 * The first version of this comment said the FFX-2 command menu offered no item
 * rows and that there was therefore no revive in the fight. **That is no longer
 * true** — `buildCommands` grew an Item submenu while this chapter was in
 * flight, and `bevelleBuild`'s Potions, Hi-Potions, Phoenix Downs and Curtains
 * are all offered and enabled. The tactic now reaches for them where §3.3 says
 * to; `critic/scratch/bahamut-r2-revive.test.ts` is the measurement.
 */

import type { AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import { type Tactic, activeParty, aim, has, hpFraction, revive, row, stacksOf } from './common.ts';

/**
 * The boss id this encounter fields.
 *
 * **It is not unique across the two games.** FFX's aeon Bahamut is also
 * `'bahamut'` (`src/data/ffx/aeons/index.ts:108`), so an FFX battle in which
 * Yuna summons him puts a combatant with this id on the field. `TACTICS` is
 * searched in encounter order and every FFX boss id sits ahead of this entry,
 * so the right tactic still wins the lookup today — but the tactic below does
 * not rely on that, and returns `null` unless the `'bahamut'` it found is an
 * enemy.
 */
export const FFX2_BAHAMUT_ID: CombatantId = 'bahamut';

/**
 * Break stacks to drive each Down status to.
 *
 * §1.5: **2 stacks per cast, cap 10** — five casts, and the multiplier is
 * linear in the stack count, `(12 - n)/12` on what he deals and `(12 + n)/12`
 * on what the party deals. At the cap that is x0.167 and x1.833.
 */
const BREAK_CAP = 10;

/**
 * Heal anyone below this fraction of max HP.
 *
 * Set from §2.4's cycle table rather than picked: under Shell the Impulse pair
 * leaves a character at **66.0%** of max, so a bar set just above that is the
 * one that fires exactly once per cycle, on the countdown turns the research
 * calls the party's designated window, and does not fire during the harmless
 * Attack turns (~115-200 a hit into 690-1,533 HP).
 */
const TOP_UP_AT = 0.7;

/**
 * Darkness costs **12.5% of the user's own max HP** and fails if she cannot pay
 * (§3.2). Below this she swings instead of killing herself for a chain link: a
 * dead Dark Knight is a third of the party's damage gone until somebody spends
 * a turn on the Phoenix Down, and this build's White Mage has not learned Life.
 */
const DARKNESS_FLOOR = 0.25;

/** Most hurt living active first. */
function byNeed(party: AnyCombatant[]): AnyCombatant[] {
  return party.filter((c) => c.alive).sort((a, b) => hpFraction(a) - hpFraction(b));
}

/**
 * §3.3's "Potions / Hi-Potions / Mega-Potion … **Core sustain**", as a floor
 * under the White Mage's MP.
 *
 * The canonical party's sustain engine is the Alchemist's Mix; §3.1's White
 * Mage substitution replaces it with spells, and spells run out of MP where
 * `bevelleBuild`'s 60 Potions and 20 Hi-Potions do not. Only reached when the
 * cure row is not on offer this turn, so it never spends an item the party's
 * MP could have covered.
 */
function potion(commands: AvailableCommand[], target: CombatantId): Command | null {
  const r = row(commands, ['Hi-Potion', 'Potion'], target);
  return r ? aim(r, target) : null;
}

/**
 * The White Mage's turn — §3.1's substitution for the Alchemist.
 *
 * Order is Shell, top-up, Protect, top-up, and it is the order §3.3 states:
 * Shell is *Essential* (both of the two real threats are magic), Protect is
 * merely *Useful* ("cast Shell first"), and everything after that is §2.4's
 * "getting back above the Mega Flare threshold".
 *
 * Never returns `null`: `intendedStrategy` reads a tactic's `null` as "swing",
 * and this dressphere **has no Attack command at all** (§3.4-3.6), so the
 * generic fallback would reach past the heals and pick her spherechange row.
 * Vigor is the floor — 0 MP, half her max HP, on herself.
 */
function whiteMage(commands: AvailableCommand[], party: AnyCombatant[]): Command | null {
  const needsShell = party.find((c) => c.alive && !has(c, 'shell'));
  if (needsShell) {
    const r = row(commands, ['Shell'], needsShell.id);
    if (r) return aim(r, needsShell.id);
  }

  const hurt = byNeed(party)[0];
  if (hurt && hpFraction(hurt) < TOP_UP_AT) {
    const r = row(commands, ['Cura', 'Cure'], hurt.id);
    if (r) return aim(r, hurt.id);
    const item = potion(commands, hurt.id);
    if (item) return item;
  }

  const needsProtect = party.find((c) => c.alive && !has(c, 'protect'));
  if (needsProtect) {
    const r = row(commands, ['Protect'], needsProtect.id);
    if (r) return aim(r, needsProtect.id);
  }

  if (hurt) {
    const r = row(commands, ['Cure', 'Cura'], hurt.id);
    if (r) return aim(r, hurt.id);
  }
  const vigor = row(commands, ['Vigor']);
  return vigor ? aim(vigor) : null;
}

/**
 * The Warrior's turn — §3.3's corrected Break ranking, in order.
 *
 * Magic Break first and Power Break never; see the module comment. Each Break
 * is itself a physical hit, so the fifteen casts are not lost damage — they are
 * the same ~85-156 a swing the Warrior would have dealt anyway, with the stack
 * riding along. Once all three are capped she swings, which by then is worth
 * x1.833 through capped Armor Break.
 */
function warrior(commands: AvailableCommand[], boss: AnyCombatant): Command | null {
  const ladder: ReadonlyArray<readonly [string, string]> = [
    ['Magic Break', 'mag-down'],
    ['Mental Break', 'mdef-down'],
    ['Armor Break', 'def-down'],
  ];
  for (const [label, status] of ladder) {
    if (stacksOf(boss, status) >= BREAK_CAP) continue;
    const r = row(commands, [label], boss.id);
    if (r) return aim(r, boss.id);
  }
  const attack = row(commands, ['Attack'], boss.id);
  return attack ? aim(attack, boss.id) : null;
}

/** The Dark Knight's turn — §3.1 step 3: Darkness, every single turn. */
function darkKnight(
  commands: AvailableCommand[],
  actor: AnyCombatant,
  boss: AnyCombatant,
): Command | null {
  if (hpFraction(actor) > DARKNESS_FLOOR) {
    const dark = row(commands, ['Darkness']);
    if (dark) return aim(dark, boss.id);
  }
  // Under the floor she buys her own next Darkness back rather than swinging
  // into Defense 160 for ~90 — §3.3's "Core sustain", and §3.2's Darkness "fails
  // if the user lacks the HP to pay".
  const item = potion(commands, actor.id);
  if (item) return item;
  const attack = row(commands, ['Attack'], boss.id);
  return attack ? aim(attack, boss.id) : null;
}

/**
 * Chapter 4's line.
 *
 * The role is read off the rows the engine offered rather than off the girl's
 * name, so the tactic keeps working if the build's dressphere assignment moves
 * — Shell means she is the healer this turn, Magic Break means she is the
 * Warrior, Darkness means she is the Dark Knight.
 */
export const ffx2Bahamut: Tactic | null = (actorId, commands, engine) => {
  const state = engine.state();
  const boss = state.combatants[FFX2_BAHAMUT_ID];
  const actor = state.combatants[actorId];
  if (!boss || !actor) return null;
  // FFX's aeon Bahamut shares this id — see {@link FFX2_BAHAMUT_ID}. A summoned
  // ally is not this encounter; hand the turn back to the generic rules.
  if (boss.side !== 'enemy') return null;

  const party = activeParty(engine);

  // A downed member first. This build's White Mage has not learned Life, so the
  // revive is `bevelleBuild`'s 20 Phoenix Downs — and that row is live: the
  // FFX-2 command menu now builds an Item submenu (added to
  // `src/battle/ffx2/targeting.ts buildCommands` by the Shuyin chapter, cited
  // there to ffx2-vegnagun-shuyin §7.2 / ffx2-combat-core §3.15), and it offers
  // `Phoenix Down enabled=true targets=[yuna,rikku,paine]` including the dead.
  // Measured: with Yuna and Rikku down this tactic answers
  // `{"kind":"item","id":"x2-phoenix-down","targets":["yuna"]}`
  // [`critic/scratch/bahamut-r2-revive.test.ts`]. It never fires in a shipped
  // run because nobody dies, which is the point of Shell going up first.
  const up = revive(commands, party);
  if (up) return up;

  if (row(commands, ['Shell']) || row(commands, ['Cure', 'Cura', 'Vigor'])) {
    return whiteMage(commands, party);
  }
  if (row(commands, ['Magic Break', 'Mental Break', 'Armor Break'], boss.id)) {
    return warrior(commands, boss);
  }
  if (row(commands, ['Darkness'])) return darkKnight(commands, actor, boss);

  const attack = row(commands, ['Attack'], boss.id);
  return attack ? aim(attack, boss.id) : null;
};
