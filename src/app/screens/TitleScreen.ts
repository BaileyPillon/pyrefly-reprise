import './frontend/frontend.css';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
import { installInkGoldStyles, playWipe, prefersReducedMotion } from '../../ui/inkgold/index.ts';
import type { Briefing } from '../../ui/coach/Briefing.ts';
import { makeBriefing } from './raiseBriefing.ts';
import { onboardingLive } from '../../ui/coach/coachState.ts';
import { ParallaxField, normalisePointer } from './frontend/parallax.ts';
import { MoteField } from './frontend/motes.ts';
import { titleMarkup, upgradeTitlePlanes } from './frontend/titleMarkup.ts';
import { TITLE_PLACEHOLDERS, revealTitleWhenDecoded } from './frontend/titleReveal.ts';
import './frontend/title-echo.css';
import { readSetting } from '../SaveData.ts';
import { titleArtOf, type TitleArt } from '../saveFrontend.ts';
import { holdForNextScreen, warmFrontEnd } from './frontendWarm.ts';
import { briefingDue } from './raiseBriefing.ts';

/**
 * The title card, in the approved "Ink & Gold" presentation and now moving.
 *
 * Approved end state: `docs/concepts/polish/showpiece-frontend/after.png` —
 * "A front end that moves: parallax title and silhouette chapter cards"
 * (Bailey, 2026-09-19). The base look is the approved tile
 * `docs/screenshots/mockups/A-title.jpg` and the spec in
 * `docs/handoff/presentation-ink-and-gold.md`; what this adds is the plane
 * split, the drift and the pyreflies (and, until 2026-10-05, the two on the
 * shore: see `TITLE_CAST_ON`).
 *
 * Game-aware (AGENTS.md rule 14): **both**. The title is the front door to
 * both halves of the game; nothing about it is true of one and not the other,
 * and the strap names both by name.
 *
 * The painting is `public/art/title/keyart.png`. Since 2026-10-05 it is the Art
 * Room's "Farplane Field, the Gullwings" (proposal p_f4836b8c), which Bailey
 * approved for this screen ("it's soooo epic i love it"; see
 * `docs/handoff/title-gullwings-keyart.md`); before that it was the plate
 * `after.png` was composited from, installed on 2026-09-21. The first cut of
 * this screen used `backdrops/title.png` instead (a sea and a horizon), on a
 * brief that said "only art already in `public/art`"; that read of the rule was
 * wrong here, because the key art is this project's own picture and it is the
 * one Bailey approved.
 *
 * Two things changed from the screen this replaces, both deliberate:
 * - it is **full bleed**, not a letterboxed 640x360 stage scaled by a
 *   transform. Bailey plays at 2000x1012, which is not 16:9: the transform put
 *   ink bars down the frame and rasterised every glyph at 640x360 before
 *   blowing it up (the `fix3-pause` finding). CSS sizes everything from
 *   `--fe-k` instead, so type is drawn at its real size.
 * - the strap reads "Final Fantasy X and X-2" rather than the concept's "Five
 *   encounters · Final Fantasy X and X-2". Bailey approved three more chapters
 *   in the same message that approved this board, so the count on the plate is
 *   an incidental label that is now wrong. Flagged for Bailey in
 *   `docs/handoff/frontend-showpiece.md`.
 */
export class TitleScreen extends Screen {
  readonly name = 'title';
  /** Which title screen is up: read from the save on every `enter` (`Settings.titleArt`, `saveFrontend.ts`). */
  private art: TitleArt = 'farplane';
  private advancing = false;
  private stage: HTMLElement | null = null;
  private parallax: ParallaxField | null = null;
  private motes: MoteField | null = null;
  private reduceMotion = false;
  /** Auron's briefing, while it is being replayed from here. */
  private briefing: Briefing | null = null;

  private readonly onResize = (): void => this.layout();

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (!this.parallax) return;
    const { x, y } = normalisePointer(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    this.parallax.setPointer(x, y);
  };

  /**
   * `B` fetches the briefing back.
   *
   * Bailey's pick says "replayable from pause"; the title needs it too, because
   * the title is where a first-timer who skipped it on boot actually is, and
   * pause only exists once a chapter has started. `B` has no abstract button in
   * `app/Input.ts` and adding one there for a single screen would put a global
   * binding in a file thirty agents import — the same reasoning the pause
   * screen's `H` is written down under. Mouse and touch use the chip.
   */
  private readonly onKey = (e: KeyboardEvent): void => {
    // Dark launch: no chip, no key (`ui/coach/coachState.ts` ONBOARDING_LIVE).
    if (!onboardingLive()) return;
    if (e.code !== 'KeyB' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (this.advancing) return;
    void this.replayBriefing();
  };

  override enter(): void {
    installInkGoldStyles();
    this.reduceMotion = prefersReducedMotion() || readSetting('reduceMotion') === true;

    // 39.5 (Bailey, 2026-10-07): the player's choice of title screen. The default is today's Farplane painting; The Echo
    // is one plane with its lettering painted in, so the markup leaves the HTML wordmark out (`titleMarkup`'s `art`).
    this.art = titleArtOf(readSetting('titleArt'));
    this.root.className = `screen fe fe-title ig${this.art === 'echo' ? ' fe-title--echo' : ''}`;
    this.root.innerHTML = titleMarkup({ briefingChip: onboardingLive(), art: this.art });
    this.stage = this.root;
    // A-16: the placeholder first, every layer in once decoded (`frontend/titleReveal.ts`).
    void revealTitleWhenDecoded(this.root, { placeholder: TITLE_PLACEHOLDERS[this.art] });
    // The 2688px master, once the manifest says it is on disk. Never awaited:
    // the 1x plate is already decoding and the screen is correct without it.
    // The Echo has no 2x master (its markup is never offered one), so there is nothing to upgrade.
    if (this.art === 'farplane') void upgradeTitlePlanes(this.root);
    // The briefing's and the board's paintings, while the title waits for a key (PR-0065).
    warmFrontEnd(this.app, briefingDue(this.app));

    const motes = this.root.querySelector('.fe-title__motes');
    if (motes instanceof HTMLElement) {
      this.motes = new MoteField(motes, {
        reduceMotion: this.reduceMotion,
        // The low-effects tier halves the field rather than dropping it: the
        // frame still reads as Spira, at half the compositing cost.
        count: readSetting('lowEffects') === true ? 8 : undefined,
      });
    }

    const far = this.root.querySelector('.fe-title__plane--far');
    const near = this.root.querySelector('.fe-title__plane--near');
    const cast = this.root.querySelector('.fe-title__cast');
    // The near plane's scale was 1.11 for the old plate's open shore. At 1.11 against the far plane's 1.045 the two copies
    // of the flower band sit 2.3 % of the window height apart at rest (25 px at 1080), a visible double image where the near
    // plane fades in; 1.06 keeps them within 0.5 % and still clears the frame at full drift (frontend.css, the plane cut).
    const layers = [
      far instanceof HTMLElement ? { el: far, depth: 0.35, scale: 1.045 } : null,
      near instanceof HTMLElement ? { el: near, depth: 1, scale: 1.06 } : null,
      cast instanceof HTMLElement ? { el: cast, depth: 1.35, scale: 1 } : null,
    ].filter((l): l is { el: HTMLElement; depth: number; scale: number } => l !== null);
    // The Echo's picture is black at its edges and the ground behind it is the same black, so its one plane needs no
    // overscan to hide the drift: it is held at scale 1, which keeps the painted lettering where the picture put it.
    if (this.art === 'echo') for (const layer of layers) layer.scale = 1;
    this.parallax = new ParallaxField({ layers, reduceMotion: this.reduceMotion });

    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('keydown', this.onKey);
    if (!this.reduceMotion) {
      this.root.addEventListener('pointermove', this.onPointerMove, { passive: true });
    }
    this.layout();

    void audio.playMusic('title', { fade: 1.6 }).catch(() => {
      /* audio stays locked until the first gesture; AudioManager queues it */
    });
    void this.app.fade('clear', 700);
  }

  override exit(): void {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKey);
    this.root.removeEventListener('pointermove', this.onPointerMove);
    this.motes?.dispose();
    this.motes = null;
    this.parallax = null;
    this.briefing?.skip();
    this.briefing = null;
    this.stage = null;
  }

  /** Put the briefing back up over the title. Never starts the flow. */
  private async replayBriefing(): Promise<void> {
    if (this.briefing && !this.briefing.finished) return;
    const briefing = makeBriefing(this.app);
    this.briefing = briefing;
    try {
      await briefing.show();
    } finally {
      this.briefing = null;
    }
  }

  /**
   * The only place the frame's pixel size is read. The fields are told their
   * size here and never measure anything inside the loop, so no animation
   * frame can cost a layout.
   */
  private layout(): void {
    if (!this.stage) return;
    this.motes?.resize(this.stage.clientWidth || window.innerWidth, this.stage.clientHeight || window.innerHeight);
  }

  override update(dt: number): void {
    if (this.reduceMotion) return;
    this.parallax?.update(dt);
    this.motes?.update(dt);
  }

  override handleInput(input: InputSnapshot): void {
    // While the briefing is up it owns the screen: it holds the keyboard claim,
    // and a stray Enter here would start the flow behind it.
    if (this.briefing && !this.briefing.finished) return;
    // The stick aims the parallax; it is the gamepad's half of "moves with
    // pointer / stick / time" and costs nothing when the stick is at rest.
    if (!this.reduceMotion) this.parallax?.setStick(input.axis.x, input.axis.y);
    if (input.actions.includes('title:briefing')) return void this.replayBriefing();
    if (this.advancing) return;
    if (input.justPressed('confirm') || input.justPressed('start')) return void this.advance();
    if (input.actions.includes('confirm')) void this.advance();
  }

  /**
   * Spec "Motion & camera": every screen change is the diagonal ivory wipe.
   * The chapter loop is started at full cover so the wipe clears onto chapter
   * select rather than back onto the title.
   */
  private async advance(): Promise<void> {
    if (this.advancing) return;
    this.advancing = true;
    // PR-0326: the cue plays from its sprite or not at all; the first press used to be the arcade synth.
    void audio.playSfxFromSprite('battle-start');
    // PR-0065: the next screen's paintings first, so the wipe clears onto them (ceilinged).
    await holdForNextScreen(this.app, briefingDue(this.app));
    await playWipe(this.app.uiRoot, {
      onCover: () => {
        void this.app.startFlow();
      },
    });
  }

  override trigger(name: string): boolean {
    if (name !== 'confirm' && name !== 'start') return false;
    void this.advance();
    return true;
  }

  override snapshot(): Record<string, unknown> {
    return {
      advancing: this.advancing,
      skin: 'ink-and-gold',
      art: this.art,
      reduceMotion: this.reduceMotion,
      reveal: this.root.dataset['titleReveal'] ?? 'pending',
      motes: this.motes?.size ?? 0,
      parallax: this.parallax?.offset() ?? null,
    };
  }
}
