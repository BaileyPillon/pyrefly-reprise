/**
 * Types for `tools/gen/cutout-guard.mjs`, so the unit tests (TypeScript, and
 * type-checked by `tsc --noEmit`) can import the guard's decision functions
 * directly instead of shelling out to node.
 *
 * Same arrangement as `black-frame.d.mts`. This file declares the module's
 * whole public surface — if you add an export over there, add it here too.
 */

export interface ComponentBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface LabelComponentsResult {
  labels: Int32Array;
  sizes: number[];
  boxes: ComponentBox[];
  count: number;
}

export interface CoverageResult {
  widthFraction: number;
  heightFraction: number;
  /** Whether this composition is one `evaluateCoverage` actually acts on. */
  checked: boolean;
  exceeds: boolean;
}

export interface ComponentsResult {
  opaquePixels: number;
  componentCount: number;
  largestPixels?: number;
  secondPixels?: number;
  secondRatio: number;
  touchesLargest: boolean | null;
  exceeds: boolean;
  labels: Int32Array;
  largestIdx: number;
}

export interface NearWhiteResult {
  fraction: number;
  largestRegionFraction: number;
  detached: boolean;
  touchesEdge: boolean;
  exceeds: boolean;
  allowanceUsed?: number;
}

export interface CutoutMeasurements {
  coverage?: Pick<CoverageResult, 'widthFraction' | 'heightFraction' | 'checked' | 'exceeds'>;
  components?: Pick<
    ComponentsResult,
    'componentCount' | 'largestPixels' | 'secondPixels' | 'secondRatio' | 'touchesLargest'
  >;
  nearWhite?: Pick<
    NearWhiteResult,
    'fraction' | 'largestRegionFraction' | 'detached' | 'touchesEdge' | 'allowanceUsed'
  >;
}

export interface CutoutVerdict {
  ok: boolean;
  reasons: string[];
  measurements: CutoutMeasurements;
  unverified?: boolean;
  error?: string;
}

export declare const OPAQUE_ALPHA_MIN: number;
export declare const CROP_COVERAGE_MAX: number;
export declare const COVERAGE_CHECKED_COMPOSITIONS: readonly string[];
export declare const SECOND_COMPONENT_MAX_RATIO: number;
export declare const COMPONENT_TOUCH_GAP_PX: number;
export declare const NEAR_WHITE_RGB_MIN: number;
export declare const NEAR_WHITE_PIXEL_FRACTION_MAX: number;
export declare const NEAR_WHITE_REGION_FRACTION_MIN: number;
export declare const REF_NEAR_WHITE_ALLOWANCE: number;

export declare function nearWhiteIsSuspect(
  flags: { detached: boolean; touchesEdge: boolean },
  composition?: string,
): boolean;

export declare function labelComponents(
  mask: Uint8Array,
  width: number,
  height: number,
): LabelComponentsResult;

export declare function evaluateCoverage(
  width: number,
  height: number,
  sourceWidth: number,
  sourceHeight: number,
  composition?: string,
): CoverageResult | null;

export declare function evaluateComponents(
  alpha: Uint8Array,
  width: number,
  height: number,
): ComponentsResult;

export declare function nearWhiteFractionOf(
  alpha: Uint8Array,
  rgb: Uint8Array,
  width: number,
  height: number,
): number;

export declare function evaluateNearWhite(
  alpha: Uint8Array,
  rgb: Uint8Array,
  width: number,
  height: number,
  components: ComponentsResult,
  opts?: { refFraction?: number | null; composition?: string },
): NearWhiteResult;

export declare function evaluateCutout(input?: {
  width?: number;
  height?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  alpha?: Uint8Array;
  rgb?: Uint8Array;
  refNearWhiteFraction?: number;
  composition?: string;
}): CutoutVerdict;

export declare function decodeRgba(
  pngPath: string,
): Promise<{ width: number; height: number; alpha: Uint8Array; rgb: Uint8Array }>;

export declare function referenceNearWhiteFraction(refPath: string | null | undefined): Promise<number | null>;

export declare function checkCutoutFile(
  outPath: string,
  opts?: { sourceWidth?: number; sourceHeight?: number; refPath?: string | null; composition?: string },
): Promise<CutoutVerdict>;

export declare function cutoutQuarantinePath(
  filePath: string,
  quarantineDir: string,
  stamp?: string,
): string;

export declare function quarantineCutout(
  filePath: string,
  quarantineDir: string,
  stamp?: string,
): string | null;
