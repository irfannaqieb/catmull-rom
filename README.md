# Catmull-Rom Spline

A TypeScript implementation of Catmull-Rom spline interpolation for generating smooth curves through control points.

## Installation

```bash
npm install catmull-rom
```

## Usage

```typescript
import { catmullRom } from 'catmull-rom';

// Example: interpolate points on a curve
const points = [
  { x: 0, y: 0 },
  { x: 1, y: 2 },
  { x: 2, y: 1 },
  { x: 3, y: 3 }
];

const curvePoints = catmullRom(points, 0.5); // Generate smooth curve
console.log(curvePoints);
```



## API

### `catmullRom(points, tension, segments)`

Generates smooth curve points using the Catmull-Rom spline algorithm.

- **points**: Array of control points
- **tension**: Tension parameter (default: 0.5)
- **segments**: Number of segments between points (default: 10)

Returns an array of interpolated points along the curve.

## License

MIT - See LICENSE file for details