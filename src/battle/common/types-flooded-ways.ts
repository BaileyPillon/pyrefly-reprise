/**
 * The hidden Flooded Ways chapter's contract additions (FFX only; `research/re-ffx-geosgaeno-evrae-altana.md` sections 2 and 4, `docs/handoff/ch-flooded-ways.md`).
 *
 * **Contract file** (the interface below is merged into `./types.ts`'s `EnemyGroupDef` by `extends`; every change gets a `docs/CONTRACT-CHANGES.md` note), split out like `./types-keeper.ts` so the 3,000-line
 * `./types.ts` does not grow for it. Additive and optional: absent from every other formation, so no other battle changes.
 */

export interface FloodedGroupFields {
  /**
   * **FFX only, "this is a water battle"** (the formation block's byte 3, RE 2.2): a Petrify that lands on a party member removes them from the battle at once, as a monster's does (the kernel's `petrifyShattersParty`,
   * `battle/ffx/kernel/status-inflict.ts`, which `adapt/status.ts` now passes). 54 of the game's 863 formations set it; the Via Purifico's three areas and the Baaj Temple's second fight are the first of ours
   * (Shinryu's and Echuilles's would be the next). Read by `battle/ffx/ai/flooded-ways-setup.ts`, which raises the battle flag the status step reads; absent everywhere else.
   */
  inWater?: true;
  /**
   * **FFX only, "this link opens with the boss at the HP the last link left it"** (the Via Purifico's three areas: Evrae Altana's HP rides a persistent script variable from area to area, RE 4.3). Read by
   * `app/screens/BattleScreenFloodedCarry.ts#carriedEnemyGroup`, which writes the previous link's live HP into the first enemy's starting HP when the chain re-inits. **A link whose carried boss is already dead is skipped**
   * (`skipSpentLinks`: if Evrae Altana falls in the first area the cell holds 0 and no further area comes).
   */
  carriesBossHp?: true;
  /**
   * **FFX only, "the members the water shattered stand again on entry"** (the lock's gate "will revive/bring back other party members that may have been petrified and shattered", the guides; RE 4.3, not traced in the files).
   * Read by `app/screens/BattleScreenFloodedCarry.ts#returnShattered`: a member who left the last link shattered (Eject) comes back with 1 HP (the driver's call; the files give no number). A member who was merely knocked out
   * stays knocked out, as in every chain.
   */
  returnsShattered?: true;
}
