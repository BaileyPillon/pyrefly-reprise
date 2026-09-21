/**
 * The Leblanc Syndicate party build — Chateau Leblanc, FFX-2 Chapter 2,
 * mission "Faking and Entering".
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source:
 * `research/ffx2-leblanc-syndicate.md` §7 (abbreviated `§`); spec
 * `docs/plans/chapter-leblanc-review.md` §3.
 *
 * **The single most important stat fact**: a girl's combat stats are a function
 * of (dressphere x level) only [ffx2-combat-core §5.1]. So the build is
 * `level + dressphere + garment grid + accessories + learned abilities`, and
 * the engine derives the numbers from `src/data/ffx2/dresspheres/**`.
 *
 * ### Two corrections against the Bahamut chapter that must not be copied [§7.2]
 *
 * - **Dark Knight is NOT owned here.** It is the Bevelle Underground, *later*
 *   in Chapter 2. `bevelleBuild` gives Rikku Dark Knight and that is correct
 *   *there*.
 * - **Healing Light is NOT owned here.** It is this mission's own reward.
 *
 * ### Deliberately not solved for the player
 *
 * The build gives the party every tool §8's teaching table needs — Darkness
 * Dance, Perfect Pitch, the four Breaks, Dispel, Steal, Grenades — and
 * pre-selects none of them, exactly as `bevelleBuild`'s doc comment describes
 * its own restraint. There is **no all-status guard available at this point**
 * (§7.5: the Ribbon is one dungeon away) and this build does not hand the
 * player one early: Russian Roulette's six-way roll being genuinely
 * unblockable is the point of the chapter.
 *
 * ### Why the `owned` order is not arbitrary
 *
 * `setup.ts::gridNodeContents` fills the Garment Grid's nodes from
 * `currentDressphere` followed by `owned` in order, and `buildCommands` offers
 * an L1 spherechange to the nodes **one link away** on the ring
 * [ffx2-combat-core §4.2]. So the order below is the player's own node layout,
 * and it is chosen to put each girl's second role — Yuna's Songstress, Paine's
 * White Mage, Rikku's Black Mage — one link from her starting node, which is
 * what makes §8's teaching moments reachable inside a fight this short. The
 * *set* is §7.2's; only the order is ours.
 */

import type { FFX2PartyBuild } from '../../../battle/common/types.ts';

export const chateauBuild: FFX2PartyBuild = {
  game: 'ffx2',
  // -------------------------------------------------------------------------
  // Accessories — and the one thing the engine cannot express
  // -------------------------------------------------------------------------
  //
  // §7.5's *relevant* accessories for this fight are the status guards — Silver
  // Glasses (Darkness, i.e. Flash Bomb), White Cape (Silence, i.e. Hush
  // Grenade), Beaded Brooch (both, and you took it off Ormi), Star Pendant
  // (Poison, i.e. one of Russian Roulette's six). **None of them is equipped
  // below, because `src/battle/ffx2/accessories.ts` models no status-guard
  // accessory at all** — `accessoryEffect()` is a stat table, and an unknown id
  // is a silent no-op. Equipping one would put a counter on the sheet that does
  // nothing, which is worse than not equipping it.
  //
  // So every slot below is drawn from §7.5's realistically-owned list **and**
  // from the rows the engine actually reads. The consequence is recorded rather
  // than hidden: this build is *more* exposed to Flash Bomb, Hush Grenade and
  // the Poison roll than a canonical Chapter 2 party would be, and §7.5's "there
  // is no all-status guard in this chapter" currently reads stronger here than
  // it does in the game. See `docs/handoff/chapter-leblanc-engine.md`.
  members: [
    {
      id: 'yuna',
      name: 'Yuna',
      spriteKey: 'yuna-gunner',
      portraitKey: 'yuna-x2',
      // §7.1 — band Lv 18-24, centre ~21, spread **Paine >= Rikku >= Yuna**
      // (separate EXP pools; Yuna needs the most EXP to Lv 99, Paine the least)
      // [verified: 2 sources for the spread, [estimate] for the band].
      level: 20,
      // §7.2 default, and §5.2's mirror-match fact: her Gunner acts at 4.32 s,
      // **exactly matched to Leblanc**.
      currentDressphere: 'gunner',
      // §7.2 — Yes for Gunner/Thief/Warrior/Songstress/Black Mage/White Mage,
      // Likely for Gun Mage/Alchemist/Floral Fallal. **No Dark Knight**,
      // no Samurai, Lady Luck, Berserker, Trainer or Mascot.
      owned: ['gunner', 'songstress', 'white-mage', 'black-mage', 'thief', 'warrior', 'gun-mage', 'alchemist', 'floral-fallal'],
      garmentGrid: {
        // §7.4 — Bikanel Oasis, won by beating the Syndicate in one of the three
        // *Strip Search* missions immediately before this one. 5 nodes, so
        // nodes 1 (Songstress) and 4 (Thief) are one link from her node 0.
        id: 'hour-of-need',
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {
        // §7.3 — "one or two skillsets partially invested, not mastered"
        // [estimate]. Trigger Happy is initial and is the chain engine; Cheap
        // Shot ignores Defense and is the clean answer to Ormi's Def 84 for a
        // party with no Black Mage out.
        gunner: { learned: ['x2-gunner-trigger-happy', 'x2-gunner-cheap-shot'], ap: 10 },
        // **Darkness Dance is initial (0 AP)** and is the canonical opener for
        // every Syndicate fight; **Perfect Pitch (10 AP)** is ACCU Up +10
        // levels = +100 accuracy points, which turns the Warrior's 64 % hit
        // rate on Logos' Eva 40 into a guarantee — the cheapest fix in the
        // fight [§7.3].
        songstress: { learned: ['x2-songstress-darkness-dance', 'x2-songstress-perfect-pitch'], ap: 0 },
      },
      // §7.5 — the Iron Bangle's +20 % max HP is cheap insurance against
      // Huggles; the Tiara (Mag +5, MDef +5) is stolen from Leblanc at the
      // Floating Ruins, i.e. off this same woman one chapter earlier.
      accessories: ['iron-bangle', 'tiara'],
    },
    {
      id: 'rikku',
      name: 'Rikku',
      spriteKey: 'rikku-thief',
      portraitKey: 'rikku-x2',
      level: 21,
      // §7.2 default; §5.2 the fastest unit on the field at 3.82 s; §6.3 —
      // three Elixir-tier steals and 2,740 stealable gil make this the chapter
      // that justifies the Thief.
      currentDressphere: 'thief',
      owned: ['thief', 'black-mage', 'gunner', 'warrior', 'white-mage', 'songstress', 'alchemist', 'gun-mage', 'machina-maw'],
      garmentGrid: {
        // §7.4 — the *Celsius*, automatic after the three Syndicate disguises.
        // 5 nodes: node 1 (Black Mage) and node 4 (White Mage) are one link out.
        id: 'bum-rush',
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {
        thief: { learned: ['x2-thief-steal', 'x2-thief-pilfer-gil'], ap: 10 },
        // §6.2's headline: Fira into Ormi's MDef 16 is **302**, two and a half
        // times what a Warrior's sword does through his Def 84.
        'black-mage': { learned: ['x2-black-mage-fire', 'x2-black-mage-fira', 'x2-black-mage-blizzara', 'x2-black-mage-thundara', 'x2-black-mage-watera'], ap: 0 },
      },
      // §7.5 — Favorite Outfit is Eva +10 / Luck +10, worth +20 to her
      // defenderScore in §5.1's hit check, and it is Logos' own room drop; the
      // Silver Bracer's +40 % max MP is Logos' Djose drop.
      accessories: ['favorite-outfit', 'silver-bracer'],
    },
    {
      id: 'paine',
      name: 'Paine',
      spriteKey: 'paine-warrior',
      portraitKey: 'paine',
      level: 22,
      // §7.2 default; §7.3 — **Armor Break on Ormi is the single best Break use
      // in the fight** (Def 84 -> your physicals x1.83 at the cap).
      currentDressphere: 'warrior',
      owned: ['warrior', 'white-mage', 'gunner', 'songstress', 'thief', 'black-mage', 'gun-mage', 'alchemist'],
      garmentGrid: {
        // §7.4 — Mt. Gagazet, won by beating Ormi. 4 nodes: node 1 (White Mage)
        // and node 3 (Songstress) are one link from her node 0.
        id: 'stonehewn',
        nodePosition: 0,
        passedGates: [],
        wornThisBattle: [],
      },
      abilitiesLearned: {
        // All four Breaks. **Power Break and Armor Break do nothing to Leblanc
        // and both work on the boys** — the only place in the fight where the
        // same Warrior skill is correct on two targets and dead on the third
        // [§3.1].
        warrior: {
          learned: ['x2-warrior-power-break', 'x2-warrior-armor-break', 'x2-warrior-magic-break', 'x2-warrior-mental-break', 'x2-warrior-sentinel'],
          ap: 20,
        },
        // §7.3 — Dispel needs Esuna, and **Dispel is what strips
        // Not-So-Mighty Guard**.
        'white-mage': { learned: ['x2-white-mage-cure', 'x2-white-mage-esuna', 'x2-white-mage-dispel'], ap: 0 },
      },
      // §7.5 — Muscle Belt (Str +10, Def +10) is the reward for beating the
      // Syndicate in the prologue mission; Mythril Gloves (Def +20) are 1,000
      // gil at the Zanarkand Dome.
      accessories: ['muscle-belt', 'mythril-gloves'],
    },
  ],
  // §7.6 — **all [estimate]**; no source records a canonical inventory. Every
  // line is one of Russian Roulette's six answers or one of §8's teaching
  // items: Soft for Petrify, Echo Screen for Silence and Hush Grenade, Eye
  // Drops for Flash Bomb, Holy Water for Curse (it restores spherechange),
  // Antidote for Poison, Phoenix Down for the Death roll. **Nothing answers
  // Eject**, and that is deliberate [§4.3, §7.5].
  //
  // The Grenades are the Act I item loop made explicit: base 300 to every
  // enemy, stealable from the Dr. Goon in Act I [§4.6].
  inventory: [
    { itemId: 'x2-potion', count: 60 },
    { itemId: 'x2-hi-potion', count: 20 },
    { itemId: 'x2-phoenix-down', count: 15 },
    { itemId: 'x2-soft', count: 5 },
    { itemId: 'x2-echo-screen', count: 8 },
    { itemId: 'x2-eye-drops', count: 8 },
    { itemId: 'x2-holy-water', count: 5 },
    { itemId: 'x2-antidote', count: 8 },
    { itemId: 'x2-remedy', count: 5 },
    { itemId: 'x2-ether', count: 8 },
    { itemId: 'x2-grenade', count: 4 },
    { itemId: 'x2-light-curtain', count: 3 },
    { itemId: 'x2-lunar-curtain', count: 3 },
  ],
  // §7.6 [estimate] — the band is 4,000-15,000; ship the middle.
  gil: 8000,
};

export default chateauBuild;
