/**
 * **The RUN tab of party prep** (the Pilgrimage, hidden prototype, FFX only; mockup `pilgrim-mock/o2B-c`, Bailey, 2026-10-18, decision 122): the real Party Prep of the next fight with one more tab, the first, that says what the
 * run put in the pack for it. It is registered like every other panel (`registerPrepPanel`), but it is **visible only while a run's fight is up** (`PrepPanel.visible`, `./activeRun.ts`), so no other chapter's prep gains a tab.
 *
 * The tab's body is on the ivory sheet; a strip under the eyebrow (where on the road the run stands) and a row of chips (what the pack holds) are added to the prep stage and removed with the tab. The panel reads the
 * stats of the party from the shell as it always does: the fight's party is the boon'd chapter's, so the Items tab and the equipment already show the boons.
 *
 * Game case: FFX only.
 */

import './pilgrim-prep.css';
import { registerPrepPanel, type PrepPanel } from '../screens/PartyPrepScreen.ts';
import { boonById } from './boons.ts';
import { activeFight } from './activeRun.ts';
import { runPanelHtml } from './pilgrimMarkup.ts';
import { ROUTE_LENGTH } from './route.ts';
import { reached } from './runState.ts';

/** The panel's id. */
export const PILGRIM_PANEL_ID = 'pilgrim-run';

function makePanel(): PrepPanel {
  let extras: HTMLElement[] = [];
  return {
    id: PILGRIM_PANEL_ID,
    label: 'Run',
    game: 'ffx',
    order: -20,
    fullScreen: false,
    visible: () => activeFight() !== null,
    mount(root) {
      const fight = activeFight();
      if (!fight) return;
      root.innerHTML = runPanelHtml(fight.run, fight.lines);
      const stage = root.closest('.prep__sheet')?.parentElement;
      if (!stage) return;
      const n = reached(fight.run);
      const strip = document.createElement('div');
      strip.className = 'pgx-strip';
      strip.dataset['role'] = 'pilgrim-strip';
      strip.innerHTML = `Pilgrimage <b>Fight ${n} of ${ROUTE_LENGTH}</b><span class="pips">${Array.from({ length: ROUTE_LENGTH }, (_, i) => `<i class="${i < fight.run.won ? 'ok' : i === n - 1 ? 'now' : ''}"></i>`).join('')}</span>Pack <b>${fight.run.pack.length}</b>`;
      const chips = document.createElement('div');
      chips.className = 'pgx-chipsbar';
      chips.dataset['role'] = 'pilgrim-chips';
      chips.innerHTML = fight.run.pack.map((id) => `<span>${boonById(id).name}</span>`).join('');
      stage.append(strip, chips);
      extras = [strip, chips];
    },
    unmount() {
      for (const el of extras) el.remove();
      extras = [];
    },
  };
}

registerPrepPanel(makePanel());
