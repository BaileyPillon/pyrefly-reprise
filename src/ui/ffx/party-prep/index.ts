import { registerPrepPanel } from '../../../app/screens/PartyPrepScreen.ts';
import { mountFFXPartyPrep, type PartyPrepHandle } from './PartyPrep.ts';

export { mountFFXPartyPrep, type PartyPrepHandle };

/**
 * Wires the FFX party-prep UI into `PartyPrepScreen`'s tab shell
 * (`registerPrepPanel`, see that file's header comment). This module's only
 * job is the registration side effect — `main.ts` imports it once for that
 * effect, alongside registering the HUD screenshot demo screen. Everything
 * that isn't shell plumbing lives in `PartyPrep.ts`, which stays a plain,
 * directly-testable `mountFFXPartyPrep(root, build, onDone)` export.
 *
 * One registered tab, not five: `PartyPrepScreen` only remounts a tab's panel
 * the *first* time it is opened (see its `mounted` set), so registering
 * Stats/Sphere-Grid/Equipment/Items/Overdrive as five separate panels would
 * show stale content when a player returns to an already-visited tab. A
 * single "Party" panel sidesteps that by owning its own internal tab strip
 * (`DetailPanel`), which re-renders correctly on every switch.
 */
let handle: PartyPrepHandle | null = null;

registerPrepPanel({
  id: 'ffx-party',
  label: 'Party',
  game: 'ffx',
  order: 0,
  mount(root, ctx) {
    const build = ctx.chapter.buildRef;
    if (build.game !== 'ffx') return;
    handle?.unmount();
    handle = mountFFXPartyPrep(root, build, () => {
      // PartyPrepScreen's own Enter-key handling begins the battle; a
      // synthetic Enter lets the in-panel START BATTLE button reach it
      // without a bespoke callback wired through the panel shell.
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter' }));
    });
  },
  unmount() {
    handle?.unmount();
    handle = null;
  },
});
