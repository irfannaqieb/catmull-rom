import type { Path, Point, CatmullRomOptions, CatmullRomResult, SampleMeta } from "./types";
import { isMinSizeArray, DEFAULT_EPSILON } from "./types";

export function catmullRom(
  path: Path,
  {
    samples = 16,
    alpha,
    parametrization = "centripetal",
    closed = false,
    dimension,
    endpointMode = "duplicate",
    epsilon = DEFAULT_EPSILON,
    includeOriginal = false,
    includeMeta = false,
  }: CatmullRomOptions = {}
): CatmullRomResult {
  if (!Array.isArray(path) || path.length < 2) {
    return {
      points: path.slice() as Path,
      meta: includeMeta ? [] : undefined,
      segmentStartIndices: includeMeta ? [0] : undefined,
    };
  }

  // check every point has at least 'dimension' coordinates
  if (dimension && !path.every((p) => isMinSizeArray(p, dimension))) {
    throw new Error("Dimension min size error");
  }

  let finalAlpha = alpha;
  if (finalAlpha === undefined) {
    switch (parametrization) {
      case "uniform":
        finalAlpha = 0.0;
        break;
      case "chordal":
        finalAlpha = 1.0;
        break;
      case "centripetal":
      default:
        finalAlpha = 0.5;
        break;
    }
  }

  const dim = dimension ?? path[0].length;
  const pts = path.map((p) => p.slice(0, dim));
  const n = pts.length;

  let paddedPts: Point[];
  if (closed) {
    paddedPts = pts;
  } else {
    if (endpointMode === "duplicate") {
      paddedPts = [pts[0], ...pts, pts[n - 1]];
    } else {
      const p0Virtual = extrapolatePoint(pts[0], pts[1], dim, epsilon);
      const pnVirtual = extrapolatePoint(pts[n - 1], pts[n - 2], dim, epsilon);
      paddedPts = [p0Virtual, ...pts, pnVirtual];
    }
  }

  const idx = (i: number) => {
    if (closed) return (i + n) % n;
    return i;
  };

  const out: Path = [];
  const meta: SampleMeta[] | undefined = includeMeta ? [] : undefined;
  const segmentStartIndices: number[] | undefined = includeMeta ? [] : undefined;

  if (!closed && includeOriginal) {
    out.push(pts[0].slice(0, dim));
    if (includeMeta) {
      meta!.push({ segment: 0, u: 0 });
      segmentStartIndices!.push(out.length - 1);
    }
  }

  const lastSegment = closed ? n : n - 1;
  for (let i = 0; i < lastSegment; i++) {
    if (includeMeta) {
      segmentStartIndices!.push(out.length);
    }

    let p0, p1, p2, p3;
    if (closed) {
      p0 = paddedPts[idx(i - 1)];
      p1 = paddedPts[idx(i)];
      p2 = paddedPts[idx(i + 1)];
      p3 = paddedPts[idx(i + 2)];
    } else {
      p0 = paddedPts[i];
      p1 = paddedPts[i + 1];
      p2 = paddedPts[i + 2];
      p3 = paddedPts[i + 3];
    }

    // chord length parameters
    const t0 = 0;
    const t1 = t0 + Math.pow(distance(p0, p1), finalAlpha);
    const t2 = t1 + Math.pow(distance(p1, p2), finalAlpha);
    const t3 = t2 + Math.pow(distance(p2, p3), finalAlpha);

    // avoid math errors due to coincident points
    const dt1 = t1 - t0 < epsilon ? t0 + epsilon : t1;
    const dt2 = t2 - t1 < epsilon ? t1 + epsilon : t2;
    const dt3 = t3 - t2 < epsilon ? t2 + epsilon : t3;

    // sampling points between p1 and p2
    for (let s = 1; s <= samples; s++) {
      const t = dt1 + (s * (dt2 - dt1)) / samples;
      const u = (t - dt1) / (dt2 - dt1);
      const c = catmullRomAt(p0, p1, p2, p3, t0, dt1, dt2, dt3, t, dim, epsilon);
      out.push(c);
      if (includeMeta) {
        meta!.push({ segment: i, u });
      }
    }

    if (!closed && i === lastSegment - 1 && includeOriginal) {
      out.push(pts[n - 1].slice(0, dim));
      if (includeMeta) {
        meta!.push({ segment: i, u: 1 });
      }
    }
  }

  return {
    points: out as Path,
    meta: includeMeta ? meta : undefined,
    segmentStartIndices: includeMeta ? segmentStartIndices : undefined,
  };
}

// euclidean distance
function distance(a: Point, b: Point): number {
  let sum = 0;
  const dim = Math.min(a.length, b.length);
  for (let i = 0; i < dim; i++) {
    const d = b[i] - a[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

function extrapolatePoint(p0: Point, p1: Point, dim: number, epsilon: number): Point {
  const out = new Array<number>(dim) as Point;
  for (let i = 0; i < dim; i++) {
    out[i] = p0[i] + (p0[i] - p1[i]);
  }
  return out;
}

function lerpTimed(
  a: number,
  b: number,
  ta: number,
  tb: number,
  t: number,
  epsilon: number
): number {
  const denom = tb - ta;
  if (Math.abs(denom) < epsilon) return a;
  const u = (t - ta) / denom;
  return (1 - u) * a + u * b;
}

function lerpVecTimed(
  A: Point,
  B: Point,
  ta: number,
  tb: number,
  t: number,
  dim: number,
  epsilon: number
): Point {
  const out = new Array<number>(dim) as Point;
  for (let i = 0; i < dim; i++) {
    out[i] = lerpTimed(A[i], B[i], ta, tb, t, epsilon);
  }
  return out;
}

function catmullRomAt(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t0: number,
  t1: number,
  t2: number,
  t3: number,
  t: number,
  dim: number,
  epsilon: number
): Point {
  const A1 = lerpVecTimed(p0, p1, t0, t1, t, dim, epsilon);
  const A2 = lerpVecTimed(p1, p2, t1, t2, t, dim, epsilon);
  const A3 = lerpVecTimed(p2, p3, t2, t3, t, dim, epsilon);

  const B1 = lerpVecTimed(A1, A2, t0, t2, t, dim, epsilon);
  const B2 = lerpVecTimed(A2, A3, t1, t3, t, dim, epsilon);

  const C = lerpVecTimed(B1, B2, t1, t2, t, dim, epsilon);
  return C;
}

export default catmullRom;
