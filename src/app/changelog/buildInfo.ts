/**
 * The build number on the title screen: `Release 39.4.2 · a021787a`.
 *
 * Bailey, 2026-10-08: "build number should be shown on the title screen", small, in a corner (bottom right on a
 * desktop window; top right on a phone and below 1330 px wide, `title-info.css`). Two numbers make it:
 *
 *  - the RELEASE name, stamped by the deploy tool: `npm run deploy -- --release=39.4.2` sets `PYREFLY_RELEASE`,
 *    `vite.config.ts` defines it as `__PYREFLY_RELEASE__`, and `tools/deploy-pages.mjs` writes it into
 *    docs/deploys.log as `release=`. It is also the name the newest player note must carry (`releaseNotes.ts`);
 *  - the 8-character commit the build was made from, `__PYREFLY_BUILD_SHA__` (the same define the mark recorder reads).
 *
 * A dev server or a local build has no release name and shows the commit alone. A preview deploy is stamped
 * `Preview` and shows `Preview · <commit>`, so nobody mistakes it for a release. With neither (a source archive, no
 * git) nothing is drawn: a tag that says "unknown" is noise.
 *
 * Pure apart from reading the two defines in `readBuildInfo`: `buildTagHtml` takes the numbers as arguments, so the
 * tests give it any build they like. Game case: both (the title is the front door of both games).
 */

import { escapeHtml } from '../../ui/common/html.ts';

declare const __PYREFLY_BUILD_SHA__: string | undefined;
declare const __PYREFLY_RELEASE__: string | undefined;

/** What `tools/build-stamp.mjs` stamps on a preview deploy (a test pins the two to each other). */
export const PREVIEW_RELEASE = 'Preview';

/** A release name the deploy tool can stamp: `39.5`, `39.4.2`, `31a`. */
const RELEASE_OK = /^[0-9]+(?:\.[0-9]+)*[a-z]?$/;

/** How much of the commit is shown. */
export const SHA_LENGTH = 8;

export interface BuildInfo {
  /** `39.4.2`, `Preview`, or null for a build nobody stamped (the dev server). */
  readonly release: string | null;
  /** The first 8 characters of the commit, or null when there was no git. */
  readonly sha: string | null;
}

/** Clean the two raw defines: anything that is not a release name, or not a commit, is left out rather than shown. */
export function parseBuildInfo(release: string | null | undefined, sha: string | null | undefined): BuildInfo {
  const r = (release ?? '').trim();
  const s = (sha ?? '').trim().toLowerCase();
  return {
    release: r === PREVIEW_RELEASE || RELEASE_OK.test(r) ? r : null,
    sha: /^[0-9a-f]{7,40}$/.test(s) ? s.slice(0, SHA_LENGTH) : null,
  };
}

/** This build's numbers, from the two build-time defines (neither exists under vitest: both read as null there). */
export function readBuildInfo(): BuildInfo {
  return parseBuildInfo(
    typeof __PYREFLY_RELEASE__ !== 'undefined' ? __PYREFLY_RELEASE__ : null,
    typeof __PYREFLY_BUILD_SHA__ !== 'undefined' ? __PYREFLY_BUILD_SHA__ : null,
  );
}

/** The words of the tag as plain text, for a screen reader and for tests: `Release 39.4.2 · a021787a`. */
export function buildTagText(info: BuildInfo): string {
  const lead = info.release === null ? '' : info.release === PREVIEW_RELEASE ? PREVIEW_RELEASE : `Release ${info.release}`;
  return [lead, info.sha ?? ''].filter((p) => p !== '').join(' · ');
}

/**
 * The tag's markup, or an empty string when there is nothing to show. It sits inside the title's tap plate and takes no
 * pointer input of its own (`pointer-events: none`), so a tap on it begins the game like a tap anywhere on the title.
 */
export function buildTagHtml(info: BuildInfo = readBuildInfo()): string {
  if (info.release === null && info.sha === null) return '';
  const lead =
    info.release === null
      ? ''
      : info.release === PREVIEW_RELEASE
        ? `<span class="fe-title__build-lead"><b>${PREVIEW_RELEASE}</b></span>`
        : `<span class="fe-title__build-lead">Release <b>${escapeHtml(info.release)}</b></span>`;
  const dot = lead !== '' && info.sha !== null ? '<span class="fe-title__build-dot" aria-hidden="true">&middot;</span>' : '';
  const sha = info.sha === null ? '' : `<i class="fe-title__build-sha">${escapeHtml(info.sha)}</i>`;
  return `<div class="fe-title__build" data-build-tag>${lead}${dot}${sha}</div>`;
}
