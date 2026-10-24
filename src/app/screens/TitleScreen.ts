import './frontend/frontend.css';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { audio } from '../../audio/index.ts';
import { enterDemoTitle, type DemoTitle } from '../demo/demoTitle.ts'; // R61: the conference demo's QR corner and its 60-second attract loop (`?demo=1` only)
import { installInkGoldStyles, playWipe, prefersReducedMotion } from '../../ui/inkgold/index.ts';
import type { Briefing } from '../../ui/coach/Briefing.ts';
import { makeBriefing } from './raiseBriefing.ts';
import { onboardingLive } from '../../ui/coach/coachState.ts';
import { ParallaxField, normalisePointer } from './frontend/parallax.ts';
import { MoteField } from './frontend/motes.ts';
import { titleMarkup, upgradeTitlePlanes } from './frontend/titleMarkup.ts';
import { TITLE_PLACEHOLDERS, decodeTitleLayers, revealTitleWhenDecoded } from './frontend/titleReveal.ts';
import './frontend/title-echo.css';
import { readSetting } from '../SaveData.ts';
import { DEFAULT_TITLE_ART, TITLE_ARTS, cycle, titleArtOf, titleArtPick, type TitleArt } from '../saveFrontend.ts';
import { beginFrontEndWarm, holdForNextScreen, prefetchModeFrom, startFrontEndWarm } from './frontendWarm.ts';
import { briefingDue } from './raiseBriefing.ts';
import { BTS_KEY, BTS_LIVE } from '../changelog/behindTheScenes.ts';
import { TitleInfo } from './frontend/titleInfo.ts';
import { BTS_ACTION, CHANGELOG_ACTION, CHANGELOG_KEY, TITLE_ART_ACTION, TITLE_ART_KEY } from './frontend/titleInfoHtml.ts';

/** The cross-fade between two title pictures (release 61): the old screen leaves over this long. About 300 ms (Bailey's pick: "A key in the bottom row", with a cross-fade). */
export const TITLE_CROSSFADE_MS = 300;
/** The longest the T key waits for the next picture to decode before it fades anyway (it is normally cached or a local file: a few ms). */
const TITLE_SWAP_DECODE_CAP_MS = 1500;

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
  /**
   * Which title screen is up: read from the save on every `enter` (`Settings.titleArt`, `saveFrontend.ts`); since release 61 The Echo unless the player picked the Farplane painting,
   * and the T key changes it live.
   */
  private art: TitleArt = DEFAULT_TITLE_ART;
  private advancing = false;
  /** A T-key cross-fade is running (a second press waits for it). */
  private swapping = false;
  /** The screen that is leaving during a cross-fade: the old picture's own nodes, over the new one, fading out. */
  private ghost: HTMLElement | null = null;
  private stage: HTMLElement | null = null;
  private parallax: ParallaxField | null = null;
  private motes: MoteField | null = null;
  private reduceMotion = false;
  /** Auron's briefing, while it is being replayed from here. */
  private briefing: Briefing | null = null;
  /** The CHANGELOG panel (and, behind its switch, BEHIND THE SCENES) over the title. */
  private info: TitleInfo | null = null;
  /** The booth's additions to the title, in demo mode only (`demo/demoTitle.ts`): made on the first frame, so it is independent of how `enter` draws the picture. */
  private demo: DemoTitle | null = null;
  private demoChecked = false;

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
   *
   * `L` opens the CHANGELOG panel and `T` BEHIND THE SCENES, which exists only while its switch is on (Bailey, 2026-10-08;
   * `frontend/titleInfo.ts`). They are handled here for the same reason as `B`: no abstract button, and no global binding.
   */
  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey || e.altKey || this.advancing) return;
    // `L` opens the changelog, and `T` BEHIND THE SCENES while its switch is on (Bailey, 2026-10-08). A held key opens once.
    if (e.code === CHANGELOG_KEY) {
      if (!e.repeat) this.info?.open('changelog');
      return;
    }
    if (BTS_LIVE && e.code === BTS_KEY) {
      if (!e.repeat) this.info?.open('bts');
      return;
    }
    // `T` cycles the title pictures (release 61). It is the BEHIND THE SCENES letter too, so that entry wins above while its switch is on (a test pins that the two never coexist).
    if (e.code === TITLE_ART_KEY) {
      if (!e.repeat) this.cycleArt();
      return;
    }
    // Dark launch: no chip, no key (`ui/coach/coachState.ts` ONBOARDING_LIVE).
    if (e.code === 'KeyB' && onboardingLive()) void this.replayBriefing();
  };

  override enter(): void {
    installInkGoldStyles();
    this.reduceMotion = prefersReducedMotion() || readSetting('reduceMotion') === true;

    // 39.5 (Bailey, 2026-10-07): the player's choice of title screen; release 61 (2026-10-21): The Echo is the default and the Farplane painting the selectable one.
    // The Echo is one plane with its lettering painted in, so the markup leaves the HTML wordmark out (`titleMarkup`'s `art`).
    this.mountArt(titleArtOf(readSetting('titleArt')), false);
    this.info = new TitleInfo(this.root, this.app, () => this.reduceMotion, () => this.advancing);
    // The briefing's and the board's paintings (PR-0065) start at the player's first key or pointer input, not when the title appears (PR-0405, `?prefetch=`).
    beginFrontEndWarm(this.app, () => briefingDue(this.app), prefetchModeFrom(window.location.search));

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

  /**
   * Draw the title for `art` into the root: its markup, its reveal, its motes and its parallax. `enter` calls it with the saved choice; the T key calls it again for the next
   * picture (`swapArt`), with `swapped` true: that picture is drawn at once (the layers are not held back for a decode and the placeholder is not shown), because the screen
   * that is leaving covers it until it has decoded.
   */
  private mountArt(art: TitleArt, swapped: boolean): void {
    this.art = art;
    this.motes?.dispose();
    this.motes = null;
    this.root.className = `screen fe fe-title ig${art === 'echo' ? ' fe-title--echo' : ''}`;
    this.root.innerHTML = titleMarkup({ briefingChip: onboardingLive(), art });
    this.stage = this.root;
    if (swapped) {
      this.root.style.setProperty('--fe-title-ph', `url("${TITLE_PLACEHOLDERS[art]}")`);
      this.root.classList.add('fe-title--decoded');
      this.root.dataset['titleReveal'] = 'swapped';
    } else {
      // A-16: the placeholder first, every layer in once decoded (`frontend/titleReveal.ts`).
      void revealTitleWhenDecoded(this.root, { placeholder: TITLE_PLACEHOLDERS[art] });
    }
    // The 2688px master, once the manifest says it is on disk. Never awaited:
    // the 1x plate is already decoding and the screen is correct without it.
    // The Echo has no 2x master (its markup is never offered one), so there is nothing to upgrade.
    if (art === 'farplane') void upgradeTitlePlanes(this.root);

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
    if (art === 'echo') for (const layer of layers) layer.scale = 1;
    this.parallax = new ParallaxField({ layers, reduceMotion: this.reduceMotion });
    this.layout();
  }

  /**
   * The T key (or a click or a tap on the TITLE ART entry): the next title picture, saved as the player's pick. Nothing happens while the screen is leaving, a panel is open, or
   * the last cross-fade has not finished. Both games: the title is the front door of FFX and FFX-2 alike.
   */
  private cycleArt(): void {
    if (this.advancing || this.swapping || this.info?.openKind) return;
    if (this.briefing && !this.briefing.finished) return;
    void this.swapArt(cycle(TITLE_ARTS, this.art, 1));
  }

  /**
   * Change to `next` with a short cross-fade (`TITLE_CROSSFADE_MS`; none under REDUCE MOTION). The pick is saved first, in the setting the OPTIONS row writes
   * (`titleArtPick`), so a reload in the middle of the fade keeps it. The leaving screen's own nodes move into a ghost laid over the new screen, the new picture is
   * mounted under it and decoded, and the ghost fades out: no frame shows an empty or half-loaded picture.
   */
  private async swapArt(next: TitleArt): Promise<void> {
    this.swapping = true;
    try {
      this.app.save.setSettings(titleArtPick(next));
      const ghost = this.takeGhost();
      this.mountArt(next, true);
      await decodeTitleLayers(this.root, TITLE_SWAP_DECODE_CAP_MS);
      await this.fadeGhost(ghost);
    } finally {
      this.swapping = false;
    }
  }

  /** Move the title that is up into a ghost over the root (same classes and variables, `pointer-events: none`), so it can fade out above what replaces it. Null with no parent to lay it in. */
  private takeGhost(): HTMLElement | null {
    const parent = this.root.parentElement;
    if (!parent) return null;
    this.ghost?.remove();
    const ghost = document.createElement('div');
    ghost.className = this.root.className.replace(/(^|\s)screen(?=\s|$)/, '$1fe-title__ghost');
    ghost.style.cssText = this.root.style.cssText;
    ghost.style.pointerEvents = 'none';
    ghost.setAttribute('aria-hidden', 'true');
    while (this.root.firstChild) ghost.appendChild(this.root.firstChild);
    parent.appendChild(ghost);
    this.ghost = ghost;
    return ghost;
  }

  private fadeGhost(ghost: HTMLElement | null): Promise<void> {
    if (!ghost) return Promise.resolve();
    const done = (): void => {
      ghost.remove();
      if (this.ghost === ghost) this.ghost = null;
    };
    if (this.reduceMotion) {
      done();
      return Promise.resolve();
    }
    ghost.style.transition = `opacity ${TITLE_CROSSFADE_MS}ms ease`;
    void ghost.offsetWidth; // the opacity is 1 for one frame, so the change below is a transition and not a jump
    ghost.style.opacity = '0';
    return new Promise<void>((resolve) =>
      window.setTimeout(() => {
        done();
        resolve();
      }, TITLE_CROSSFADE_MS + 40),
    );
  }

  override exit(): void {
    this.ghost?.remove();
    this.ghost = null;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKey);
    this.root.removeEventListener('pointermove', this.onPointerMove);
    this.motes?.dispose();
    this.motes = null;
    this.parallax = null;
    this.briefing?.skip();
    this.briefing = null;
    this.info?.dispose();
    this.info = null;
    this.demo?.dispose();
    this.demo = null;
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
    if (!this.demoChecked) [this.demoChecked, this.demo] = [true, enterDemoTitle(this.app)]; // R61: null outside demo mode
    this.demo?.update(this.advancing || this.briefing !== null);
    if (this.reduceMotion) return;
    this.parallax?.update(dt);
    this.motes?.update(dt);
  }

  override handleInput(input: InputSnapshot): void {
    // The booth's attract card is up, or was a moment ago: the press that wakes it is the card's, never also the title's Start (`demo/boothAttract.ts`, lane "booth").
    if (this.demo?.holding()) return;
    // While the briefing is up it owns the screen: it holds the keyboard claim,
    // and a stray Enter here would start the flow behind it.
    if (this.briefing && !this.briefing.finished) return;
    // The stick aims the parallax; it is the gamepad's half of "moves with
    // pointer / stick / time" and costs nothing when the stick is at rest.
    if (!this.reduceMotion) this.parallax?.setStick(input.axis.x, input.axis.y);
    if (input.actions.includes('title:briefing')) return void this.replayBriefing();
    // The hint row's entries (a click or a tap on one resolves to its own action, never to the plate's confirm).
    if (!this.advancing && input.actions.includes(CHANGELOG_ACTION)) return void this.info?.open('changelog');
    if (BTS_LIVE && !this.advancing && input.actions.includes(BTS_ACTION)) return void this.info?.open('bts');
    // The TITLE ART entry (release 61): a click or a tap on it, never the plate's confirm.
    if (!this.advancing && input.actions.includes(TITLE_ART_ACTION)) return void this.cycleArt();
    // A pad's Y does what T does (release 61, decision 169: every demo action by pad; the hint row names it). Only from a pad: Shift, Tab and Q are `triangle` on a keyboard too.
    if (!this.advancing && input.lastDevice === 'gamepad' && input.justPressed('triangle')) return void this.cycleArt();
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
    // PR-0405: the press that leaves the title is the first input when it came by a pad or a trigger (a key or a click has started this already).
    startFrontEndWarm(this.app, briefingDue(this.app));
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
      info: this.info?.snapshot() ?? null,
      demo: this.demo ? { idleSeconds: this.demo.idleSeconds() } : null,
    };
  }
}
