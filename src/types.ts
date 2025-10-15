export type integer = number;

export interface MinSizeArray<T> extends Array<T> {}
export function isMinSizeArray<T>(
  array: ArrayLike<T>,
  length: number
): array is MinSizeArray<T> {
  return (array as MinSizeArray<T>).length >= length;
}

// A point is a numeric vector with at least two dimensions.
export interface Point extends MinSizeArray<number> {}
export class Path extends Array<Point> {}

export type ReadonlyPoint = ReadonlyArray<number>;
export type ReadonlyPath = ReadonlyArray<ReadonlyPoint>;

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export type CatmullRomParametrization = "uniform" | "chordal" | "centripetal";

// - duplicate: pad ends by repeating the first/last point
// - extrapolate: create one-sided "virtual" points by linear extrapolation
export type EndpointMode = "duplicate" | "extrapolate";

export type CatmullRomOptions = {
  /**
   * points sampled per segment (>= 2). Higher => smoother curve, more points
   * default: 16
   */
  samples?: integer;

  /**
   * the spline parametrization:
   * - "centripetal" (default): alpha=0.5s
   * - "chordal": alpha=1.0
   * - "uniform": alpha=0.0
   */
  parametrization?: CatmullRomParametrization;

  /**
   * numeric alpha override, this takes precedence over parametrization if provided
   */
  alpha?: number;

  /**
   * treats the path as a loop (connect last -> first)
   * default: false
   */
  closed?: boolean;

  /**
   * clamp the number of coordinates used per point (e.g. 2 for 2D, 3 for 3D).
   * if not provided, uses the length of the first point
   */
  dimension?: integer;

  /**
   * only used when closed=false. Determines how to handle missing neighbors
   * at the ends to form (p0, p1, p2, p3)
   * default: "duplicate"
   */
  endpointMode?: EndpointMode;

  /**
   * tolerance for zero-length segments / division by zero protections
   * Default: 1e-9
   */
  epsilon?: number;

  /**
   * include the original input points in the output array
   * useful for debugging or personal preferences
   */
  includeOriginal?: boolean;

  /**
   * return lightweight metadata for each sampled point
   */
  includeMeta?: boolean;
};

// useful if includeMeta is true
export interface SampleMeta {
  segment: integer;
  u: number;
}

export interface CatmullRomResult {
  points: Path;
  meta?: ReadonlyArray<SampleMeta>;
  segmentStartIndices?: ReadonlyArray<integer>;
}

export const DEFAULT_EPSILON = 1e-9;

export function isPoint(value: unknown, minDim = 2): value is Point {
  return (
    Array.isArray(value) &&
    value.every((x) => typeof x === "number") &&
    value.length >= minDim
  );
}

export function isPath(value: unknown, minDim = 2): value is ReadonlyPath {
  return (
    Array.isArray(value) &&
    value.every((p) => isPoint(p as unknown as number[], minDim))
  );
}
