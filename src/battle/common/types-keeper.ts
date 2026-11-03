/**
 * The hidden Spectral Keeper chapter's contract additions (FFX only; the glyph platforms, `research/re-ffx-spectral-keeper.md` sections 2 to 5, `docs/handoff/ch-keeper.md`).
 *
 * **Contract file** (the types below are part of `./types.ts`'s `EnemyGroupDef` and `BattleEvent`; every change gets a `docs/CONTRACT-CHANGES.md` note). Split out so the 3,000-line `./types.ts` does not grow for them, the way
 * `./types-ff7.ts` is: `types.ts` imports these type-only. Additive and optional: absent from every other battle, so no other battle changes.
 */

/**
 * The two formation flags of the Spectral Keeper (`dome02_00`), merged into `EnemyGroupDef` by `extends`.
 */
export interface PlatformGroupFields {
  /**
   * **FFX only, "this formation runs the glyph platforms"**: the front line stands on numbered platforms (1 to 6 on a ring round the boss, 7 the aeon rock), every party member gets the **Move** command, and the formation's seven Circles are
   * the platforms (never part of the victory, only Move can aim at them). Read by `battle/ffx/platforms.ts` and nothing else; absent everywhere else, so no other battle changes.
   */
  platformRing?: true;
  /**
   * **FFX only, "the whole front line has First Strike"** (the formation script writes First Strike := 1 on the front line, RE section 2.2 item 6): the opening counters treat each of the three active members as the equipment ability First Strike does
   * (`kernel/ctb-init.ts`), so all three act before the boss's first turn. Read by `adapt/ctb.ts#openingCtb` through `platforms.ts#markFirstStrike`; absent everywhere else.
   */
  frontLineFirstStrike?: true;
}

/**
 * A character hopped from one glyph platform to another (the Move command). `from` and `to` are platform numbers, 1 to 6 on the ring, 7 the aeon rock. Presentation: the hop. Absent from every other battle.
 * (`seq` is `BattleEvent`'s base field: monotonic, unique, never reused.)
 */
export interface PlatformEvent {
  seq: number;
  type: 'platform';
  who: string;
  from: number;
  to: number;
}
