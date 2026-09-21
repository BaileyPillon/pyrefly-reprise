/**
 * Party build — the deck of the ***Fahrenheit***, on the approach to Bevelle.
 *
 * Build point: Home is gone, the survivors are aboard a thousand-year-old
 * airship, Brother has found Yuna in Bevelle and Cid has put the ship on course.
 * Source: `research/ffx-evrae-airship.md` §9.
 *
 * **Game case: FFX only** [AGENTS.md rule 14] — an FFX party for an FFX
 * encounter.
 *
 * Same construction and the same caveat as `./gagazet.ts` and `./macalania.ts`:
 * an authored story-progress preset, **`[estimate]` by construction** (§9.3,
 * C-17), with `[decompiled]` base stats underneath (§9.2). Equipment model note,
 * identical to both: FFX weapons and armour grant **no stats**, only
 * auto-ability slots; only `hp-N`/`mp-N` move a `StatBlock` field.
 *
 * ---
 *
 * ## Six members, not seven. **Yuna is absent, and that is the chapter.**
 *
 * §9.1 `[verified: 2 sources]`:
 *
 * > "Yuna's absence is the encounter's design. No Wht Magic. No Cure, no Esuna
 * > from a dedicated caster, no Life… No aeons… Healing is **items only**…
 * > **That is the strongest argument for building it.**"
 *
 * The engine gives this for free and it is worth knowing why:
 * `commands.ts` gates the entire Summon block on `aeonRoster.size > 0 && user.id
 * === 'yuna'`, so a build with no `yuna` member and `aeons: []` produces **no
 * Summon row at all** — gone, not greyed. The test asserts it.
 *
 * ## Why these three are active
 *
 * Not taste — §4.2, §6.4 and §4.3 in that order.
 *
 * - **Tidus** — one of the two Trigger Command owners, plus Cheer and **Slow**,
 *   the fight's headline lever. Both work at FAR.
 * - **Rikku** — the other order owner, and `Use` is the party's only real heal.
 *   The **Al Bhed Potion** is rank 2, party-wide, exactly 1,000 HP, and cures
 *   Poison, Silence **and Petrification** — which is the thing that saves a
 *   member from the Stone Gaze → Swooping Scythe shatter. §6.4: **"Rikku is not
 *   optional in this chapter."**
 * - **Wakka** — the *only* character whose ordinary attack reaches at FAR
 *   (§4.3), plus Dark Attack / Dark Buster, which blank two of the four
 *   NEAR-cycle turns (§6.1).
 *
 * **The bench is not filler.** Lulu is the second reach (Blk Magic), Auron
 * carries **Power Break** (halves both Attack and Swooping Scythe), and Kimahri
 * carries **Lancet**, the third reach. All three switches must be legal from
 * turn one, and the switch economy is part of the chapter.
 *
 * ## Two things this preset must not "helpfully" improve
 *
 * 1. **Nobody has Stoneproof, and nobody can.** §9.5's fact-check F-1 rewrote
 *    this table: Stone Ward costs **Soft ×30** and Stoneproof costs **Petrify
 *    Grenade ×20**, and Rin does not stock Petrify Grenades aboard the ship at
 *    any price. Resistances are **subtracted** from the infliction chance, so
 *    against a 100 % Stone Gaze one Stone Ward leaves ~50 % still landing. The
 *    honest beat is **"you can buy one person half a chance"**. Rikku carries
 *    the one slot the party could afford; `equipment.ts` already maps
 *    `stone-ward → petrify`.
 * 2. **Lulu is halved on every spell she owns.** §1.2: fire, ice, lightning and
 *    water are all ×0.5 and nobody has Holy yet. Her role here is **reach, not
 *    damage** (§7.4), and giving her a workaround deletes the lesson.
 *
 * ## Gaps left open rather than guessed [AGENTS.md hard rule 6]
 *
 * - **C-17 / G-10** — the whole preset. `[estimate]`, playtest before claiming
 *   fidelity, same as every other chapter.
 * - **C-15** — whether Rin sells Al Bhed Potions aboard the ship. The item page
 *   says yes at 1,000 gil, the shop table omits them. Default **not
 *   purchasable**; the player arrives with a stack regardless (§9.5). The count
 *   below is the midpoint of §9.5's `[estimate]` 15-30.
 * - **G-9** — no source reconstructs a Sphere Grid path for this build point,
 *   so `sphereGrid.position` / `activatedNodeIds` / `spheres` are minimal,
 *   exactly as `gagazet.ts` and `macalania.ts` leave them.
 * - **§9.4's ability lists are `[estimate]`.** Where a row is borderline it is
 *   named in that member's comment rather than quietly included.
 */

import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';

/** §7.7.1 of the Flux research — every character's default weapon carries this. */
const BASE_WEAPON_BONUS_CRIT = 3;

function tidus(): FFXMemberBuild {
  return {
    id: 'tidus',
    name: 'Tidus',
    spriteKey: 'tidus',
    portraitKey: 'tidus',
    stats: {
      hp: 1150, // §9.3 [estimate]
      mp: 60,
      str: 22,
      def: 14,
      mag: 11,
      mdef: 12,
      agi: 22,
      luck: 18,
      eva: 18,
      acc: 18,
      maxHp: 1265, // Seeker's Shield HP +10%
      maxMp: 60,
    },
    hp: 1265,
    mp: 60,
    // §9.4 [estimate]. **Slow is the fight's headline lever** (§6.3) and it
    // reaches at FAR; Delay Attack matters because Evrae is the only boss in
    // the anthology that is not `immune-to-delay` (§5.6). `pull-back` and
    // `close-in` are the Trigger Commands — §4.2 [verified: 3 sources] gives
    // them to Tidus and Rikku, and only them.
    learnedAbilityIds: ['cheer', 'provoke', 'haste', 'slow', 'delay-attack', 'flee', 'pull-back', 'close-in'],
    equipment: {
      weapon: { name: 'Brotherhood', slots: 2, autoAbilities: ['strength-5'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: "Seeker's Shield", slots: 2, autoAbilities: ['hp-10'] },
    },
    overdrive: {
      gauge: 45, // [estimate]
      mode: 'warrior',
      unlockedModes: ['stoic', 'warrior'],
      // §9.4 [estimate] — Energy Rain is borderline this early and is omitted.
      unlockedOverdriveIds: ['spiral-cut', 'slice-and-dice'],
    },
    sphereGrid: { position: 'tidus-sphere-24', activatedNodeIds: [], sLv: 24, ap: 0, spheres: {} },
  };
}

function wakka(): FFXMemberBuild {
  return {
    id: 'wakka',
    name: 'Wakka',
    spriteKey: 'wakka',
    portraitKey: 'wakka',
    stats: {
      hp: 1300, // §9.3 [estimate]
      mp: 40,
      str: 24,
      def: 14,
      mag: 13,
      mdef: 12,
      agi: 12,
      luck: 19,
      eva: 9,
      acc: 38, // §9.2's accuracy outlier, carried forward
      maxHp: 1430, // Seeker's Armguard HP +10%
      maxMp: 40,
    },
    hp: 1430,
    mp: 40,
    // §9.4 [estimate]. **Dark Buster is the melee off-switch** — chance 254,
    // one turn, and it blanks Evrae's Attack without touching Swooping Scythe
    // (§6.1). His ordinary attack is the only one in the party that reaches at
    // FAR, and that is a property of the character, not of these rows.
    learnedAbilityIds: ['dark-attack', 'dark-buster', 'silence-attack', 'sleep-attack', 'aim'],
    equipment: {
      weapon: { name: 'Official Ball', slots: 2, autoAbilities: ['strength-5'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: "Seeker's Armguard", slots: 2, autoAbilities: ['hp-10'] },
    },
    overdrive: {
      gauge: 45, // [estimate]
      mode: 'warrior',
      unlockedModes: ['stoic', 'warrior'],
      // §9.4 [estimate] — Attack Reels needs blitzball prizes and is omitted.
      unlockedOverdriveIds: ['element-reels'],
    },
    sphereGrid: { position: 'wakka-sphere-24', activatedNodeIds: [], sLv: 24, ap: 0, spheres: {} },
  };
}

function rikku(): FFXMemberBuild {
  return {
    id: 'rikku',
    name: 'Rikku',
    spriteKey: 'rikku',
    portraitKey: 'rikku',
    stats: {
      hp: 880, // §9.3 [estimate]
      mp: 130,
      str: 16,
      def: 12,
      mag: 12,
      mdef: 14,
      agi: 22,
      luck: 18,
      eva: 10,
      acc: 10,
      maxHp: 880,
      maxMp: 130,
    },
    hp: 880,
    mp: 130,
    // §9.4 [estimate]. **`use` is the party's only real heal** (§6.4) and
    // `reflect` is C-14's setup — §9.4 `[single source: wiki]` has it reachable
    // via a Lv. 2 Key Sphere shortly after she joins. She is the second Trigger
    // Command owner.
    learnedAbilityIds: ['steal', 'use', 'mix', 'reflect', 'flee', 'pull-back', 'close-in'],
    equipment: {
      weapon: { name: 'Rikku Claw', slots: 2, autoAbilities: ['strength-5'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      // §9.5 F-1 — **the one Stone Ward the party can afford**: 30 Softs at 50
      // gil, one armour slot, ~50 % of a 100 % Stone Gaze still lands.
      // Stoneproof needs Petrify Grenades, which Rin does not stock here.
      armor: { name: 'Al Bhed Bracer', slots: 2, autoAbilities: ['stone-ward'] },
    },
    overdrive: {
      gauge: 40, // [estimate]
      mode: 'comrade',
      unlockedModes: ['stoic', 'comrade'],
      unlockedOverdriveIds: ['mix'],
    },
    // §9.2's note: Rikku carries a +25 starting S.Lv offset, folded in here.
    sphereGrid: { position: 'rikku-sphere-53', activatedNodeIds: [], sLv: 53, ap: 0, spheres: {} },
  };
}

function lulu(): FFXMemberBuild {
  return {
    id: 'lulu',
    name: 'Lulu',
    spriteKey: 'lulu',
    portraitKey: 'lulu',
    stats: {
      hp: 700, // §9.3 [estimate] — Poison Breath is lethal to her in two
      mp: 200,
      str: 8,
      def: 10,
      mag: 32,
      mdef: 36,
      agi: 10,
      luck: 17,
      eva: 42,
      acc: 5,
      maxHp: 700,
      maxMp: 200,
    },
    hp: 700,
    mp: 200,
    // §9.4 [estimate]. **Bio is here and it is useless** — Evrae is
    // Poison-immune with a tick byte of 0 (§6.6) — and it stays, because the
    // UI's job is to tell the player that before they burn the MP, not to hide
    // the row. Every element she owns is halved; her contribution is reach.
    learnedAbilityIds: [
      'fire', 'fira', 'blizzard', 'blizzara', 'thunder', 'thundara', 'water', 'watera',
      'bio', 'focus', 'scan',
    ],
    equipment: {
      weapon: { name: 'Moogle Wand', slots: 2, autoAbilities: ['magic-5'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Glorious Bangle', slots: 2, autoAbilities: ['hp-10'] }, // §9.5 — Rin's slot-rich line
    },
    overdrive: {
      gauge: 40, // [estimate]
      mode: 'stoic',
      unlockedModes: ['stoic'],
      unlockedOverdriveIds: ['fury'],
    },
    sphereGrid: { position: 'lulu-sphere-24', activatedNodeIds: [], sLv: 24, ap: 0, spheres: {} },
  };
}

function auron(): FFXMemberBuild {
  return {
    id: 'auron',
    name: 'Auron',
    spriteKey: 'auron',
    portraitKey: 'auron',
    stats: {
      hp: 2000, // §9.3 [estimate] — the only bar Evrae's melee does not halve
      mp: 60,
      str: 30,
      def: 22,
      mag: 8,
      mdef: 10,
      agi: 9,
      luck: 17,
      eva: 8,
      acc: 7,
      maxHp: 2000,
      maxMp: 60,
    },
    hp: 2000,
    mp: 60,
    // §9.4 [estimate]. **Power Break is the other half of the melee answer**
    // (§6.2) — resistance byte 0, halves both Attack and Swooping Scythe, and
    // stacks with Darkness. Mental Break is legal and worthless here (the stat
    // is already 0/1) and ships anyway, for the same reason Bio does.
    learnedAbilityIds: ['power-break', 'armor-break', 'magic-break', 'mental-break', 'threaten', 'guard'],
    equipment: {
      weapon: { name: 'Katana', slots: 2, autoAbilities: ['piercing'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Glorious Bracer', slots: 2, autoAbilities: ['hp-10'] },
    },
    overdrive: {
      gauge: 60, // [estimate] — he takes the hits
      mode: 'stoic',
      unlockedModes: ['stoic'],
      // §9.4 [single source] — Banishing Blade applies Power Break and Mental
      // Break together, and it is only his if two Jecht spheres were watched.
      // Shipped: the research names it for this fight by name.
      unlockedOverdriveIds: ['dragon-fang', 'shooting-star', 'banishing-blade'],
    },
    sphereGrid: { position: 'auron-sphere-26', activatedNodeIds: [], sLv: 26, ap: 0, spheres: {} },
  };
}

function kimahri(): FFXMemberBuild {
  return {
    id: 'kimahri',
    name: 'Kimahri',
    spriteKey: 'kimahri',
    portraitKey: 'kimahri',
    stats: {
      hp: 1250, // §9.3 [estimate]
      mp: 100,
      str: 20,
      def: 18,
      mag: 18,
      mdef: 12,
      agi: 10,
      luck: 18,
      eva: 9,
      acc: 9,
      maxHp: 1250,
      maxMp: 100,
    },
    hp: 1250,
    mp: 100,
    // §9.4 [estimate]. **Lancet is the third reach** (§4.3) — and there is
    // nothing to learn from it: `ronso_rage_id = 0`, so Kimahri gets no Ronso
    // Rage from Evrae (§1.1 [decompiled]). It drains HP and MP and that is all.
    learnedAbilityIds: ['lancet', 'jump', 'use'],
    equipment: {
      weapon: { name: 'Halberd', slots: 2, autoAbilities: ['piercing', 'sensor'], bonusCrit: BASE_WEAPON_BONUS_CRIT },
      armor: { name: 'Glorious Armlet', slots: 2, autoAbilities: ['hp-10'] },
    },
    overdrive: {
      gauge: 50, // [estimate]
      mode: 'stoic',
      unlockedModes: ['stoic'],
      unlockedOverdriveIds: ['jump', 'stone-breath'],
    },
    sphereGrid: { position: 'kimahri-sphere-22', activatedNodeIds: [], sLv: 22, ap: 0, spheres: {} },
  };
}

export const fahrenheitBuild: FFXPartyBuild = {
  game: 'ffx',
  // §9.1 [verified: 2 sources] — six, and **no Yuna**.
  members: [tidus(), wakka(), rikku(), lulu(), auron(), kimahri()],
  // §3.1 of the preflight: the two order owners plus the one character who can
  // hit anything from the pulled-back state.
  activeSlots: ['tidus', 'wakka', 'rikku'],
  // All three are real switches: Lulu's reach, Auron's Power Break, Kimahri's
  // Lancet. The switch economy is part of the chapter.
  reserve: ['lulu', 'auron', 'kimahri'],
  // **Empty, and it is the design.** No summoner, no aeons, no Grand Summon,
  // no Yojimbo — and therefore no Summon row in the menu at all (§9.1).
  aeons: [],
  // §9.5 [estimate], midpoints of the published ranges. The Al Bhed Potion
  // count is the balance point of the whole chapter (§6.4): 1,000 HP to all
  // three, and it cures the Petrification that Swooping Scythe would otherwise
  // turn into a permanent loss.
  inventory: [
    { itemId: 'al-bhed-potion', count: 22 },
    { itemId: 'potion', count: 25 },
    { itemId: 'hi-potion', count: 8 },
    { itemId: 'phoenix-down', count: 12 },
    { itemId: 'antidote', count: 12 },
    { itemId: 'soft', count: 12 },
    { itemId: 'eye-drops', count: 10 },
    { itemId: 'echo-screen', count: 10 },
    { itemId: 'remedy', count: 2 },
    { itemId: 'ether', count: 3 },
    { itemId: 'grenade', count: 8 },
  ],
  gil: 30_000, // §9.5 [estimate] midpoint of 20,000-40,000
  sphereInventory: {}, // [estimate] — assumed spent building the stat blocks above
};

export default fahrenheitBuild;
