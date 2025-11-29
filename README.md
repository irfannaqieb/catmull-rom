# Catmull-Rom Spline

A TypeScript implementation of Catmull-Rom spline interpolation for generating smooth curves through control points.

## Installation

```bash
npm install catmull-rom
```

## Usage

```typescript
import { catmullRom } from 'catmull-rom';

// Example: interpolate points on a 2D curve
const points = [
  [0, 0],
  [1, 2],
  [2, 1],
  [3, 3]
];

// Basic usage with default options
const result = catmullRom(points);
console.log(result.points); // Array of interpolated points

// With custom options
const result2 = catmullRom(points, {
  samples: 32,           // More points = smoother curve
  parametrization: 'centripetal', // or 'uniform' or 'chordal'
  includeOriginal: true  // Include original control points
});

// Closed curve (loop)
const closedResult = catmullRom(points, {
  closed: true,
  samples: 20
});

// 3D curve example
const points3D = [
  [0, 0, 0],
  [1, 1, 1],
  [2, 0, 2]
];
const result3D = catmullRom(points3D, { dimension: 3 });
```

## API

### `catmullRom(path, options?)`

Generates smooth curve points using the Catmull-Rom spline algorithm.

#### Parameters

- **path** (`Path`): Array of control points. Each point is an array of numbers (e.g., `[x, y]` for 2D, `[x, y, z]` for 3D). Minimum 2 points required.

- **options** (`CatmullRomOptions`, optional): Configuration object with the following properties:

  - **samples** (`integer`, default: `16`): Number of points sampled per segment. Higher values produce smoother curves with more points.

  - **parametrization** (`"uniform" | "chordal" | "centripetal"`, default: `"centripetal"`):
    - `"uniform"`: Uniform spacing (alpha = 0.0)
    - `"chordal"`: Chord length parametrization (alpha = 1.0)
    - `"centripetal"`: Centripetal parametrization (alpha = 0.5) - recommended for avoiding self-intersections

  - **alpha** (`number`, optional): Numeric alpha value override. Takes precedence over `parametrization` if provided.

  - **closed** (`boolean`, default: `false`): If `true`, treats the path as a closed loop (connects last point to first).

  - **dimension** (`integer`, optional): Clamp the number of coordinates used per point (e.g., `2` for 2D, `3` for 3D). If not provided, uses the length of the first point.

  - **endpointMode** (`"duplicate" | "extrapolate"`, default: `"duplicate"`): Only used when `closed=false`. Determines how to handle missing neighbors at the ends:
    - `"duplicate"`: Repeat the first/last point
    - `"extrapolate"`: Create virtual points by linear extrapolation

  - **epsilon** (`number`, default: `1e-9`): Tolerance for zero-length segments and division-by-zero protections.

  - **includeOriginal** (`boolean`, default: `false`): Include the original input points in the output array. Useful for debugging or when you need the control points in the result.

  - **includeMeta** (`boolean`, default: `false`): Return metadata for each sampled point (segment index and normalized parameter `u`).

#### Returns

Returns a `CatmullRomResult` object:

```typescript
{
  points: Path;                    // Array of interpolated points
  meta?: ReadonlyArray<SampleMeta>; // Optional: metadata for each point
  segmentStartIndices?: ReadonlyArray<integer>; // Optional: indices where segments start
}
```

Where `SampleMeta` contains:

- `segment`: The segment index (0-based)
- `u`: Normalized parameter value (0 to 1) within the segment

#### Examples

```typescript
// Basic 2D curve
const result = catmullRom([[0, 0], [1, 1], [2, 0]]);
// result.points: [[...], [...], ...] - interpolated points

// High-quality smooth curve
const smooth = catmullRom(points, {
  samples: 64,
  parametrization: 'centripetal'
});

// With metadata
const withMeta = catmullRom(points, {
  includeMeta: true,
  samples: 20
});
// withMeta.meta: [{ segment: 0, u: 0.05 }, ...]
// withMeta.segmentStartIndices: [0, 20, 40, ...]

// Closed loop
const circle = catmullRom([
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1]
], {
  closed: true,
  samples: 16
});
```

## Demo

An interactive visualization demo is included to test the Catmull-Rom implementation.

### Building the Demo

1. Build the library and compile the demo TypeScript:
   ```bash
   npm run demo:build
   ```

2. Serve the demo directory with a local web server (required for ES modules):
   ```bash
   npx serve demo
   ```
   Or use any other static file server of your choice.

3. Open your browser and navigate to the URL shown (typically `http://localhost:3000`).


## License

MIT - See LICENSE file for details