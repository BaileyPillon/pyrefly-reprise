/**
 * The markup of the title screen's CHANGELOG entry, its panel and (behind its switch) the BEHIND THE SCENES entry.
 *
 * Pure `data -> string`, so `titleMarkup.ts` stays about the card, `titleInfo.ts` stays about behaviour, and the tests
 * can ask for any state. Option A of the measured mock-up (Bailey, 2026-10-08): the entries are words in the hint row,
 * after "B Briefing", and the panel lists releases newest first with each line tagged FFX, FFX-2 or Both.
 *
 * When the switch is off (`changelog/behindTheScenes.ts`, `BTS_LIVE`), the BEHIND THE SCENES entry, its key and its
 * action are absent from this markup: `infoEntriesHtml()` has nothing of them in it. `btsEntryHtml()` is the entry on
 * its own, so the tests can look at what the switch will add without turning it on.
 *
 * Game case: both (the title is the front door of FFX and FFX-2 alike).
 */

import { BTS_KEY_LABEL, BTS_LIVE, BTS_TITLE } from '../../changelog/behindTheScenes.ts';
import { RELEASE_NOTES, type ReleaseNote } from '../../changelog/releaseNotes.ts';
import { escapeHtml } from '../../../ui/common/html.ts';

/** The `data-action` values the entries carry (`Input.onClick` resolves a tap to the closest one). */
export const CHANGELOG_ACTION = 'title:changelog';
export const BTS_ACTION = 'title:bts';

/** The key that opens the changelog (`KeyboardEvent.code`) and the letter printed beside the entry. */
export const CHANGELOG_KEY = 'KeyL';
export const CHANGELOG_KEY_LABEL = 'L';

function entryHtml(action: string, key: string, label: string): string {
  return `<span class="fe-hint__entry" data-action="${action}" role="button" tabindex="0"><b>${key}</b> ${escapeHtml(label)}</span>`;
}

/** The BEHIND THE SCENES entry on its own: what `BTS_LIVE` adds to the row. Nothing in the build draws it while the switch is off. */
export function btsEntryHtml(): string {
  return entryHtml(BTS_ACTION, BTS_KEY_LABEL, BTS_TITLE);
}

/** The hairline and CHANGELOG: the part of the row that is always there. */
export function changelogEntryHtml(): string {
  return `<span class="fe-hint__sep" aria-hidden="true"></span>${entryHtml(CHANGELOG_ACTION, CHANGELOG_KEY_LABEL, 'Changelog')}`;
}

/** The entries that go after the briefing chip in the hint row: a hairline, CHANGELOG, and BEHIND THE SCENES only while its switch is on. */
export function infoEntriesHtml(): string {
  return changelogEntryHtml() + (BTS_LIVE ? btsEntryHtml() : '');
}

function releaseHtml(note: ReleaseNote): string {
  const lines = note.lines
    .map((l) => `<li class="fe-info__li"><span class="fe-info__chip">${escapeHtml(l.tag)}</span><span>${escapeHtml(l.text)}</span></li>`)
    .join('');
  return (
    `<article class="fe-info__rel" data-release="${escapeHtml(note.release)}">` +
    `<div class="fe-info__relhead"><h3 class="fe-info__relname">Release ${escapeHtml(note.release)}</h3>` +
    `<span class="fe-info__relmeta">${escapeHtml(note.date)}</span></div>` +
    `<ul class="fe-info__list">${lines}</ul></article>`
  );
}

/**
 * The changelog panel, the sheet and the dimmed scrim behind it. The scrim and the CLOSE button carry
 * `data-info-act="close"`; the overlay's own click handler reads that, not `data-action` (`Input` hands screens no
 * action while an exclusive keyboard claim is held).
 */
export function changelogPanelHtml(notes: readonly ReleaseNote[] = RELEASE_NOTES): string {
  const body = notes.length ? notes.map(releaseHtml).join('') : `<p class="fe-info__none">No releases are listed yet.</p>`;
  return (
    `<div class="fe-info__scrim" data-info-act="close"></div>` +
    `<div class="fe-info__wrap"><section class="fe-info__panel" role="dialog" aria-modal="true" aria-label="Changelog">` +
    `<header class="fe-info__head"><div><div class="fe-info__eyebrow">Changelog</div>` +
    `<h2 class="fe-info__title">Latest releases</h2></div>` +
    `<button class="fe-info__close" type="button" data-info-act="close"><b>Esc</b> Close</button></header>` +
    `<div class="fe-info__scroll" data-role="info-scroll" tabindex="-1">${body}</div>` +
    `<footer class="fe-info__foot"><span><b>&uarr; &darr;</b> scroll</span><span><b>Esc</b> or <b>Enter</b> close</span></footer>` +
    `</section></div>`
  );
}
