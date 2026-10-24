# Booth script: Echoes of Spira

One page. Read it once. Keep it by the monitor. How the PC is set up: [DEMO-KIT.md](DEMO-KIT.md).

**The booth:** a 1440p monitor, headphones, a gamepad in the visitor's hands, me beside them. About 5 minutes and one fight each.

**Before visitors** (do these in order, at the start of the day and after any restart of the PC):

1. **Close every other program that uses the graphics card:** Blender, ComfyUI renders, other games, video editors. The demo shares the card with them, and they make the fights stutter.
2. **Start the kit.** In PowerShell 7 (a double-click on `start-demo.cmd` serves the kit's own `site` folder, not the conference build, so use `--dir` as below):

   ```powershell
   Set-Location 'D:\pyrefly-continuity\tools\demo-kit'
   .\start-demo.cmd --dir 'D:\pyrefly-continuity\dist-r63-play'
   .\status-demo.cmd
   ```

   The folder after `--dir` is the conference build (this one until the lock; use the locked build's folder after it). The kit opens the conference pack (`?demo=1&pack=demo`) by itself. `status-demo.cmd` prints the address in its first line, in brackets: it must end with `pack=demo`. `.\start-demo.cmd --plain` opens the plain release-62 demo instead; do not use it at the booth. Wait for the title.
3. **Press T once on the title** to unlock the sound. Chromium lets a page make sound only after a key or a click, and a gamepad press may not count. T changes the title picture and stays on the title; the title music starts and the 60-second attract reel will have sound. Do it again after every reset.
4. **Play one full fight yourself first.** The first fight in a fresh browser loads slowest: measured, 400 to 633 ms of stutter in the first fight, against about 150 to 220 ms in the ones after. It also fills the graphics driver's shader cache (the first 20 seconds of the other fight help the same way), and `reset-demo.cmd` keeps that cache.
5. **Between visitors, leave the title (or the attract card) alone for at least 15 seconds before you hand over the pad.** The next fight loads in the background behind the title. Measured: Chapter I stutter went from 958 to 167 ms, Chapter IV from 475 to 208 ms. Handing the pad over at once throws that away.

**The path:** title (The Echo) -> A at Start -> two cards (Seymour, Bahamut) -> fight -> results -> the two cards again. **Hold Back + Start for a moment: back to the title.** After 60 seconds with no one touching it, the title plays its loop and shows a QR code to the site. (This flow is built on the booth branches, not in the kit's own branch. Until it lands, the chapter board is the two cards: Chapter I and Chapter IV.)

## The 20-second pitch

"This is Echoes of Spira. It is my unofficial fan tribute to the boss fights of Final Fantasy X and X-2. It is painted, 2.5D, and lit like a modern HD-2D game. It runs in a browser, nothing to install. Pick a fight. One is from X, one is from X-2. Here is the pad."

## Pad, in four lines

- **A** picks. **B** goes back. **Left stick or D-pad** moves.
- **Start** pauses. **Hold A** skips a story scene. **Hold RB** speeds a fight up.
- **Hold Back + Start** resets to the title. That is mine, not theirs. It also puts the game's own volumes, the look (VISUAL STYLE) and the title art back to the demo's defaults, so one visitor's change in OPTIONS never reaches the next: set the room's loudness with the headphones or Windows, not in OPTIONS (release 62).
- If the pad does nothing: press any pad button once. The browser only sees a pad after a press.

## Seymour Flux (Final Fantasy X, Chapter I). A few minutes.

1. **The opening.** Tidus moves first. That is the demo setting. Say: "Look at the room before you pick anything."
2. **The look.** The ice behind is soft, the fighters are sharp, there are shafts of light and drifting sparks, and each fighter has a rim of light.
3. **A spell.** Have them cast Lulu's Black Magic or Yuna's Cure. The light on the floor and on the party changes colour. Say: "The spell lights the room."
4. **The Overdrive moment.** When a fighter's Overdrive bar is full, the OVERDRIVE row lights up. Let them use it. Say nothing. Let it play.
5. **The win.** The results panel. One A. Back to the two cards.

## Bahamut (Final Fantasy X-2, Chapter IV). Two to three minutes.

1. **The opening.** Yuna, Rikku and Paine. The bars fill, and a command holds them. The room is violet with amber lamps. The floor shines. Embers drift over the lamps.
2. **A spell.** Same pool of light.
3. **The Mega Flare moment.** Bahamut counts down 5, 4, 3, 2, 1, then fires Mega Flare at all three. Say: "You always see it coming." Use the free turns to heal. With sensible healing the girls come through it.
4. **The win.** The results panel is quiet on purpose. Chapter IV ends without a fanfare. One A.

## The Pilgrimage: mention only

Do not open it at the booth. Say: "There is also a hidden mode, the Pilgrimage. A road of four boss fights. After each win you pick one boon. It is a prototype and not final. Ask me about it."

## If something goes wrong

- **A fight looks stuck or wrong:** F5. It reloads on the title with the demo setting kept. That fight is gone. Nothing else is.
- **Still wrong:** offer the other fight. They do not depend on each other.
- **Frozen or black picture:** F5 first. Still stuck: Alt+F4, then double-click `reset-demo.cmd`. About five seconds.
- **No keyboard response:** Ctrl+Alt+Del, Task Manager, end the browser, then `reset-demo.cmd`.
- **No sound:** check the headphones are the PC's output and the volume is up. Then F5.
- **The title is silent after a start or a reset:** a browser lets a page make sound only after a key, click or touch, and a click or Enter also leaves the title. Press **T** once (it changes the title picture and stays on the title): the title music starts and the 60-second attract reel will have sound. Once at the start of the day, and once after each reset (audio pass, PC-05, 2026-10-22; measured: with no press at all the reel ran 70 s with no sound).
- **A visitor loses:** RETRY on the results panel. It is a different roll of the same fight.

**Between visitors:** `reset-demo.cmd` gives the next person an empty save and keeps the browser warm; it reopens the same address the day started with. Press **T** once on the title again, then wait the 15 seconds (step 5 above) before handing over the pad. **End of day:** `stop-demo.cmd`.
