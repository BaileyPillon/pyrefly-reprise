/**
 * The film and the key helpers of `tools/lake-finish-capture.mjs` (the hidden Wendigo chapter's finishing-lane capture tool; FFX only), split out of it by the wendigo-finish fix pass so each file stays under 400 lines (house rule 7;
 * the earlier lane did the same for `tools/lake-capture-fps.mjs`). A verbatim move of the film (`startFilm`, `stopFilm`, `shot`, `hudHide`) and the helpers (`ward`, `setHp`, `rowsText`, `pickRow`, `menuUp`, `attackWithKeys`, the
 * coach dismissal), with the page, the paths and the shared clock handed in; the tool needs a browser and a GPU and is run under the machine-wide lock (`tools/rig-record-lock.mjs`) by its caller.
 *
 * `finishKit({ page, out, w, h, stills, ffmpeg, log, clock, commandRows, waitBattleMenu })`: `clock.t0` is the film's zero (the film sets it when the screencast starts; the caller's event marks read it).
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';

export function finishKit({ page, out, w, h, stills, ffmpeg, log, clock, commandRows, waitBattleMenu }) {
  // ---------------------------------------------------------------------------------------------- the film
  let ff = null;
  let cdp = null;
  let latest = null;
  let ticker = null;
  async function startFilm(file) {
    ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-vcodec', 'mjpeg', '-i', '-', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-preset', 'fast', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
    ff.stdin.on('error', () => undefined);
    cdp = await page.context().newCDPSession(page);
    cdp.on('Page.screencastFrame', (f) => {
      latest = Buffer.from(f.data, 'base64');
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => undefined);
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, everyNthFrame: 1, maxWidth: w, maxHeight: h });
    clock.t0 = Date.now();
    let written = 0;
    ticker = setInterval(() => {
      if (!latest || !ff?.stdin.writable) return;
      const due = Math.floor(((Date.now() - clock.t0) / 1000) * 30);
      while (written < due) {
        ff.stdin.write(latest);
        written++;
      }
    }, 8);
  }
  async function stopFilm() {
    if (!ff) return;
    clearInterval(ticker);
    await cdp.send('Page.stopScreencast').catch(() => undefined);
    await new Promise((r) => {
      ff.on('close', r);
      ff.stdin.end();
    });
    ff = null;
  }
  const shot = async (name) => {
    if (!stills) return;
    await page.screenshot({ path: join(out, `${name}.jpg`), type: 'jpeg', quality: 92 });
    log('shot', name);
  };
  const hudHide = (on) =>
    page.evaluate((hide) => {
      let s = document.getElementById('lake-capture-hide');
      if (!s) {
        s = document.createElement('style');
        s.id = 'lake-capture-hide';
        document.head.appendChild(s);
      }
      s.textContent = hide ? '#ui { visibility: hidden !important; }' : '';
    }, on);

  // ---------------------------------------------------------------------------------------------- the key helpers
  const coachUp = () => page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText));
  const dismissCoach = async () => {
    for (let i = 0; i < 4 && (await coachUp()); i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(700);
    }
  };
  const ward = () =>
    page.evaluate(() => {
      const st = window.__pyrefly?.battleState?.();
      if (!st) return;
      for (const id of [...st.activeIds, ...(st.aeonIds ?? []), ...(st.aeonId ? [st.aeonId] : [])]) {
        const c = st.combatants[id];
        if (!c) continue;
        c.stats.maxHp = 99999;
        c.hp = 99999;
        for (const s of ['petrify', 'doom', 'sleep', 'confuse', 'berserk']) {
          c.immunities[s] = 255;
          delete c.statuses[s];
        }
      }
      delete st.combatants.wendigo?.statuses.berserk; // a Berserk Wendigo has no script: it never throws the Double Punch or raises its arms
    });
  const setHp = (id, hp) =>
    page.evaluate(([i, hpNow]) => {
      window.__pyrefly.battleState().combatants[i].hp = hpNow;
    }, [id, hp]);
  const rowsText = async () => (await commandRows(page)).rows.map((r) => `${r.text}${r.disabled ? ' (greyed)' : ''}`);
  async function pickRow(re, { enter = true } = {}) {
    let walked = 0;
    for (let i = 0; i < 90; i++) {
      const { rows } = await commandRows(page);
      if (rows.length === 0) return false;
      const want = rows.findIndex((r) => re.test(r.text) && !r.disabled);
      const at = rows.findIndex((r) => r.selected);
      if (want >= 0 && at === want) {
        if (enter) await page.keyboard.press('Enter');
        await page.waitForTimeout(450);
        return true;
      }
      if (want < 0 && walked++ > 24) return false;
      await page.keyboard.press(want < 0 || want > at ? 'ArrowDown' : 'ArrowUp');
      await page.waitForTimeout(160);
    }
    return false;
  }
  const menuUp = (ms) => waitBattleMenu(page, ms).then(() => true).catch(() => false);
  async function attackWithKeys() {
    await dismissCoach();
    if (!(await menuUp(60000))) return false;
    await page.keyboard.press('Enter'); // Attack
    await page.waitForTimeout(450);
    await page.keyboard.press('Enter'); // the target the cursor starts on
    await page.waitForTimeout(500);
    return true;
  }

  return { startFilm, stopFilm, shot, hudHide, dismissCoach, ward, setHp, rowsText, pickRow, menuUp, attackWithKeys };
}
