[Back to the changelog](../../CHANGELOG.md)

# 2026-09-27 · Release 24 (hotfix)

Address: https://baileypillon.github.io/pyrefly-reprise/ (main bc4e70ee)

- **FFX:** Yuna's Grand Summon now calls the aeon you pick. A crash in the picker had made it put
  Valefor out every time.

  ![Before: Valefor comes out whatever you pick](../screenshots/valefor-bug/ch09-4b-aeon-on-field.jpg)

  *Before (release 23, Chapter IX): Grand Summon skips the picker and puts Valefor out, with Lulu, Kimahri and Yuna still standing around her.*

  ![After: the picker with Ixion chosen](../screenshots/hotfix-24/ch09-2-picker-third-row.jpg)
  ![After: Ixion comes out](../screenshots/hotfix-24/ch09-4-aeon-alone-menu.jpg)

  *After (release 24): the picker opens with Ixion chosen on its third row, and Ixion comes out, with the party gone from the field.*

- **FFX:** backing out of Grand Summon, Mix or Rage with Esc returns you to the character's menu with
  the Overdrive gauge kept.

  ![Yuna's menu after backing out, with OVERDRIVE still ready](../screenshots/hotfix-24/ch09-1b-backed-out-menu.jpg)

  *Chapter IX: after backing out of Grand Summon with Esc, Yuna's menu is back, with OVERDRIVE still READY and her gauge full.*

- **FFX:** Rikku's Mix list no longer opens empty.

  ![Rikku's Mix list, with ingredients](img/release-24/rikku-mix-list.jpg)

  *Chapter VII: Rikku's Mix list shows the ingredients (Eye Drops, Echo Screen, Soft, Grenade, each x10) and waits for two to be picked into SLOT A and SLOT B.*

- **FFX:** the Overdrive lists scroll to follow the cursor (Bahamut, the fifth Grand Summon row, was
  chosen out of sight).

  ![The Grand Summon list scrolled to the chosen Bahamut](../screenshots/hotfix-24/ch10-2a-fifth-row-in-view.jpg)

  *Chapter X: the list has scrolled to keep the chosen row, Bahamut (the fifth), in view.*

- **FFX:** while an aeon is out the party leaves the field and returns when it is dismissed, KO'd or
  banished, and the status rows show the aeon's row alone.

  ![Before: the whole party stays on the field next to the aeon](../screenshots/valefor-bug/ch09-4b-aeon-on-field.jpg)

  *Before (release 23): Valefor stands among Lulu, Kimahri and Yuna, and the party's status rows stay.*

  ![After: the aeon alone on the field, with its own row](../screenshots/hotfix-24/ch10-4-aeon-alone-menu.jpg)

  *After (release 24, Chapter X): the party has left the field, and the status rows show Ixion's row alone.*

  ![The party returns after the aeon is dismissed](../screenshots/hotfix-24/ch10-5-party-back.jpg)

  *The party is back once the aeon is dismissed.*
