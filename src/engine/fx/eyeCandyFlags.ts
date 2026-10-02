// Shared seam between the EYE CANDY settings page (D-317) and the MAX mix looks (D-316).
// The settings layer installs the provider; until it does, every look is on (D-297: default on).
export type EyeCandyKey =
  | 'cinemaLight'
  | 'livingPaintings'
  | 'battleSpectacle'
  | 'depthOfField'
  | 'fog'
  | 'smoothEdges'
  | 'breathing'
  | 'koCollapse'
  | 'chapterFraming'
  | 'overdriveShot'
  | 'dressphereShot'
  | 'splashArt';

let provider: ((key: EyeCandyKey) => boolean) | null = null;

/** Installed once by the settings layer; it applies the look-is-master rule and REDUCE MOTION. */
export function setEyeCandyProvider(fn: ((key: EyeCandyKey) => boolean) | null): void {
  provider = fn;
}

/** True when the named look or part should play. */
export function eyeCandyOn(key: EyeCandyKey): boolean {
  return provider ? provider(key) : true;
}
