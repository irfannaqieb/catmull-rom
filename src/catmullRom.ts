import type { Path, Point, CatmullRomOptions } from "./types";
import { isMinSizeArray } from "./types";

const EPS = 1e-9;

export function catmullRom(
  path: Path,
  {
    samples = 16,
    alpha = 0.5,
    closed = false,
    dimension,
  }: CatmullRomOptions = {}
): Path {
  if (!Array.isArray(path) || path.length < 2) return path.slice();

  // check every point has at least 'dimension' coordinates
  if (dimension && !path.every((p) => isMinSizeArray(p, dimension))) {
    throw new Error("Dimension min size error");
  }

  const dim = dimension ?? path[0].length;
  const pts = path.map((p) => p.slice(0, dim));
  const n = pts.length;

  const idx = (i: number) => {
    if (closed) return (i + n) % n;
    return Math.max(0, Math.min(n - 1, i));
  };

  const out: Path = [];

  // for open curve, include the first point
  if (!closed) out.push(pts[0].slice(0, dim));

  const lastSegment = closed ? n : n - 1;
  for (let i = 0; i < lastSegment; i++) {
    const p0 = pts[idx(i - 1)];
    const p1 = pts[idx(i)];
    const p2 = pts[idx(i + 1)];
    const p3 = pts[idx(i + 2)];

    // chord length parameters
    const t0 = 0;
    const t1 = t0 + Math.pow(distance(p0, p1), alpha);
    const t2 = t1 + Math.pow(distance(p1, p2), alpha);
    const t3 = t2 + Math.pow(distance(p2, p3), alpha);

    // avoid math errors due to coincident points
    const dt1 = t1 - t0 < EPS ? t0 + EPS : t1;
    const dt2 = t2 - t1 < EPS ? t1 + EPS : t2;
    const dt3 = t3 - t2 < EPS ? t2 + EPS : t3;

    // sampling points between p1 and p2
    for (let s = 1; s <= samples; s++) {
      const t = dt1 + (s * (dt2 - dt1)) / samples;
      const c = catmullRomAt(p0, p1, p2, p3, t0, dt1, dt2, dt3, t, dim);
      out.push(c);
    }
  }

  return out;
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

function lerpTimed(
  a: number,
  b: number,
  ta: number,
  tb: number,
  t: number
): number {
  const denom = tb - ta;
  if (Math.abs(denom) < EPS) return a;
  const u = (t - ta) / denom;
  return (1 - u) * a + u * b;
}

function lerpVecTimed(
  A: Point,
  B: Point,
  ta: number,
  tb: number,
  t: number,
  dim: number
): Point {
  const out = new Array<number>(dim) as Point;
  for (let i = 0; i < dim; i++) {
    out[i] = lerpTimed(A[i], B[i], ta, tb, t);
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
  dim: number
): Point {
  const A1 = lerpVecTimed(p0, p1, t0, t1, t, dim);
  const A2 = lerpVecTimed(p1, p2, t1, t2, t, dim);
  const A3 = lerpVecTimed(p2, p3, t2, t3, t, dim);

  const B1 = lerpVecTimed(A1, A2, t0, t2, t, dim);
  const B2 = lerpVecTimed(A2, A3, t1, t3, t, dim);

  const C = lerpVecTimed(B1, B2, t1, t2, t, dim);
  return C;
}

export default catmullRom;
