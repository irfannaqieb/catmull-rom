// src/types.ts
function isMinSizeArray(array, length) {
  return array.length >= length;
}
var DEFAULT_EPSILON = 1e-9;

// src/catmullRom.ts
function catmullRom(path, {
  samples = 16,
  alpha,
  parametrization = "centripetal",
  closed = false,
  dimension,
  endpointMode = "duplicate",
  epsilon = DEFAULT_EPSILON,
  includeOriginal = false,
  includeMeta = false
} = {}) {
  if (!Array.isArray(path) || path.length < 2) {
    return {
      points: path.slice(),
      meta: includeMeta ? [] : void 0,
      segmentStartIndices: includeMeta ? [0] : void 0
    };
  }
  if (dimension && !path.every((p) => isMinSizeArray(p, dimension))) {
    throw new Error("Dimension min size error");
  }
  let finalAlpha = alpha;
  if (finalAlpha === void 0) {
    switch (parametrization) {
      case "uniform":
        finalAlpha = 0;
        break;
      case "chordal":
        finalAlpha = 1;
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
  let paddedPts;
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
  const idx = (i) => {
    if (closed)
      return (i + n) % n;
    return i;
  };
  const out = [];
  const meta = includeMeta ? [] : void 0;
  const segmentStartIndices = includeMeta ? [] : void 0;
  if (!closed && includeOriginal) {
    out.push(pts[0].slice(0, dim));
    if (includeMeta) {
      meta.push({ segment: 0, u: 0 });
      segmentStartIndices.push(out.length - 1);
    }
  }
  const lastSegment = closed ? n : n - 1;
  for (let i = 0; i < lastSegment; i++) {
    if (includeMeta) {
      segmentStartIndices.push(out.length);
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
    const t0 = 0;
    const t1 = t0 + Math.pow(distance(p0, p1), finalAlpha);
    const t2 = t1 + Math.pow(distance(p1, p2), finalAlpha);
    const t3 = t2 + Math.pow(distance(p2, p3), finalAlpha);
    const dt1 = t1 - t0 < epsilon ? t0 + epsilon : t1;
    const dt2 = t2 - t1 < epsilon ? t1 + epsilon : t2;
    const dt3 = t3 - t2 < epsilon ? t2 + epsilon : t3;
    for (let s = 1; s <= samples; s++) {
      const t = dt1 + s * (dt2 - dt1) / samples;
      const u = (t - dt1) / (dt2 - dt1);
      const c = catmullRomAt(p0, p1, p2, p3, t0, dt1, dt2, dt3, t, dim, epsilon);
      out.push(c);
      if (includeMeta) {
        meta.push({ segment: i, u });
      }
    }
    if (!closed && i === lastSegment - 1 && includeOriginal) {
      out.push(pts[n - 1].slice(0, dim));
      if (includeMeta) {
        meta.push({ segment: i, u: 1 });
      }
    }
  }
  return {
    points: out,
    meta: includeMeta ? meta : void 0,
    segmentStartIndices: includeMeta ? segmentStartIndices : void 0
  };
}
function distance(a, b) {
  let sum = 0;
  const dim = Math.min(a.length, b.length);
  for (let i = 0; i < dim; i++) {
    const d = b[i] - a[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}
function extrapolatePoint(p0, p1, dim, epsilon) {
  const out = new Array(dim);
  for (let i = 0; i < dim; i++) {
    out[i] = p0[i] + (p0[i] - p1[i]);
  }
  return out;
}
function lerpTimed(a, b, ta, tb, t, epsilon) {
  const denom = tb - ta;
  if (Math.abs(denom) < epsilon)
    return a;
  const u = (t - ta) / denom;
  return (1 - u) * a + u * b;
}
function lerpVecTimed(A, B, ta, tb, t, dim, epsilon) {
  const out = new Array(dim);
  for (let i = 0; i < dim; i++) {
    out[i] = lerpTimed(A[i], B[i], ta, tb, t, epsilon);
  }
  return out;
}
function catmullRomAt(p0, p1, p2, p3, t0, t1, t2, t3, t, dim, epsilon) {
  const A1 = lerpVecTimed(p0, p1, t0, t1, t, dim, epsilon);
  const A2 = lerpVecTimed(p1, p2, t1, t2, t, dim, epsilon);
  const A3 = lerpVecTimed(p2, p3, t2, t3, t, dim, epsilon);
  const B1 = lerpVecTimed(A1, A2, t0, t2, t, dim, epsilon);
  const B2 = lerpVecTimed(A2, A3, t1, t3, t, dim, epsilon);
  const C = lerpVecTimed(B1, B2, t1, t2, t, dim, epsilon);
  return C;
}
var catmullRom_default = catmullRom;

// demo/main.ts
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var clearBtn = document.getElementById("clearBtn");
var infoSpan = document.getElementById("info");
var points = [];
function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return [x, y];
}
function findPointNearClick(x, y, threshold = 15) {
  for (let i = points.length - 1; i >= 0; i--) {
    const [px, py] = points[i];
    const dx = x - px;
    const dy = y - py;
    const distance2 = Math.sqrt(dx * dx + dy * dy);
    if (distance2 <= threshold) {
      return i;
    }
  }
  return null;
}
canvas.addEventListener("mousemove", (e) => {
  const [x, y] = getCanvasCoords(e);
  const pointIndex = findPointNearClick(x, y);
  canvas.style.cursor = pointIndex !== null ? "pointer" : "crosshair";
});
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  if (points.length === 0) {
    infoSpan.textContent = "Click on the canvas to add control points";
    return;
  }
  if (points.length > 1) {
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (points.length >= 2) {
    try {
      const result = catmullRom_default(points, {
        samples: 32,
        includeOriginal: false,
        parametrization: "centripetal"
      });
      if (result.points.length > 0) {
        ctx.strokeStyle = "#0066cc";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(result.points[0][0], result.points[0][1]);
        for (let i = 1; i < result.points.length; i++) {
          ctx.lineTo(result.points[i][0], result.points[i][1]);
        }
        ctx.stroke();
      }
    } catch (error) {
      console.error("Error generating curve:", error);
    }
  }
  points.forEach((point, index) => {
    ctx.fillStyle = "#ff4444";
    ctx.beginPath();
    ctx.arc(point[0], point[1], 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index + 1), point[0], point[1]);
  });
  infoSpan.textContent = `${points.length} control point${points.length !== 1 ? "s" : ""} - ${points.length >= 2 ? "Curve generated" : "Add more points to generate curve"}`;
}
function drawGrid() {
  ctx.strokeStyle = "#f0f0f0";
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}
canvas.addEventListener("click", (e) => {
  const [x, y] = getCanvasCoords(e);
  const pointIndex = findPointNearClick(x, y);
  if (pointIndex !== null) {
    points.splice(pointIndex, 1);
  } else {
    points.push([x, y]);
  }
  render();
});
clearBtn.addEventListener("click", () => {
  points = [];
  render();
});
render();
