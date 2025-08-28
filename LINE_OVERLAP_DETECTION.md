# Line-Body Overlap Detection for PlankJS

This module provides powerful spatial query capabilities to detect when PlankJS physics bodies overlap with line segments. It leverages PlankJS's built-in raycasting and AABB query systems to provide accurate and efficient collision detection.

## Features

-   **Accurate Detection**: Uses PlankJS's native raycasting for precise line-body intersection
-   **Shape Agnostic**: Works with all PlankJS shape types (circles, boxes, polygons, edges)
-   **Multiple Query Types**: Support for different query strategies (raycast, AABB + raycast)
-   **Filtering Support**: Filter bodies by label, type, or custom criteria
-   **Performance Optimized**: Efficient broad-phase + narrow-phase detection
-   **Rich Results**: Returns intersection points, normals, and distance information

## Quick Start

```javascript
import { createLineOverlapDetector } from './lineoverlap.js';

// Create detector with your physics engine
const detector = createLineOverlapDetector(physicsEngine);

// Check if any bodies overlap with a line
const lineStart = { x: 100, y: 100 };
const lineEnd = { x: 500, y: 300 };
const overlaps = detector.checkLineOverlap(lineStart, lineEnd);

console.log(`Found ${overlaps.length} overlapping bodies`);
```

## Core Methods

### `checkLineOverlap(lineStart, lineEnd, bodyFilter?)`

The main method for detecting line-body overlaps. Returns detailed information about all intersections.

**Parameters:**

-   `lineStart`: `{x, y}` - Start point in pixels
-   `lineEnd`: `{x, y}` - End point in pixels
-   `bodyFilter`: `(body) => boolean` - Optional filter function

**Returns:** Array of overlap objects with:

-   `body`: PlankJS body object
-   `fixture`: PlankJS fixture object
-   `point`: `{x, y}` - Intersection point in pixels
-   `normal`: `{x, y}` - Surface normal at intersection
-   `fraction`: Number - Distance along ray (0-1)
-   `userData`: Body's user data

```javascript
const overlaps = detector.checkLineOverlap({ x: 0, y: 100 }, { x: 800, y: 100 });

overlaps.forEach((overlap) => {
    console.log('Hit body:', overlap.userData?.label);
    console.log('At point:', overlap.point);
    console.log('Surface normal:', overlap.normal);
    console.log('Distance ratio:', overlap.fraction);
});
```

### `hasLineOverlap(lineStart, lineEnd, bodyFilter?)`

Quick boolean check for line overlap. More efficient when you only need to know if there's an intersection.

```javascript
const isBlocked = detector.hasLineOverlap({ x: 0, y: 100 }, { x: 800, y: 100 });

if (isBlocked) {
    console.log('Path is blocked!');
}
```

### `getClosestLineOverlap(lineStart, lineEnd, bodyFilter?)`

Find the closest body along the line. Returns only the first intersection.

```javascript
const closest = detector.getClosestLineOverlap({ x: 0, y: 100 }, { x: 800, y: 100 });

if (closest) {
    console.log('Closest body at distance:', closest.fraction);
    console.log('Intersection point:', closest.point);
}
```

## Convenience Methods

### `checkLineOverlapWithBalls(lineStart, lineEnd)`

Specifically check for ball overlaps (bodies with label 'ball').

```javascript
const ballHits = detector.checkLineOverlapWithBalls({ x: 0, y: 100 }, { x: 800, y: 100 });

ballHits.forEach((hit) => {
    const ball = hit.userData?.ball;
    console.log(`Hit ball size ${ball.size} at ${hit.point.x}, ${hit.point.y}`);
});
```

### `checkLineOverlapByLabel(lineStart, lineEnd, labels)`

Filter by specific body labels.

```javascript
// Check for walls only
const wallHits = detector.checkLineOverlapByLabel({ x: 0, y: 100 }, { x: 800, y: 100 }, ['leftwall', 'rightwall', 'ground']);

// Check for multiple types
const importantHits = detector.checkLineOverlapByLabel({ x: 0, y: 100 }, { x: 800, y: 100 }, ['ball', 'obstacle', 'powerup']);
```

## Advanced Usage

### Custom Body Filtering

You can provide custom filter functions for complex queries:

```javascript
// Only check dynamic bodies
const dynamicOverlaps = detector.checkLineOverlap(lineStart, lineEnd, (body) => body.getType() === 'dynamic');

// Only check large balls
const largeBallOverlaps = detector.checkLineOverlap(lineStart, lineEnd, (body) => {
    const userData = body.getUserData();
    return userData?.label === 'ball' && userData?.ball?.size >= 5;
});

// Exclude certain bodies
const filteredOverlaps = detector.checkLineOverlap(lineStart, lineEnd, (body) => {
    const id = body.getUserData()?.id;
    return id !== excludedBodyId;
});
```

### Alternative Query Method

For very long lines or when you want to optimize broad-phase queries:

```javascript
// Uses AABB query first, then precise raycasting
const overlaps = detector.checkLineOverlapAABB(lineStart, lineEnd, bodyFilter);
```

### Static Utility Functions

For one-off queries without creating a detector instance:

```javascript
import { checkLineBodyOverlap } from './lineoverlap.js';

const overlaps = checkLineBodyOverlap(physicsEngine, lineStart, lineEnd, bodyFilter);
```

## Common Use Cases

### 1. Line of Sight Checks

```javascript
function hasLineOfSight(fromPoint, toPoint) {
    // Check if walls block the line of sight
    return !detector.hasLineOverlap(fromPoint, toPoint, (body) => {
        const label = body.getUserData()?.label;
        return ['leftwall', 'rightwall', 'ground'].includes(label);
    });
}
```

### 2. Laser/Projectile Collision

```javascript
function fireLaser(startX, startY, angle, maxDistance = 1000) {
    const endX = startX + Math.cos(angle) * maxDistance;
    const endY = startY + Math.sin(angle) * maxDistance;

    const hits = detector.checkLineOverlapWithBalls({ x: startX, y: startY }, { x: endX, y: endY });

    hits.forEach((hit) => {
        const ball = hit.userData?.ball;
        console.log(`Laser hit ball size ${ball.size}!`);
        // Damage or destroy the ball
        ball.destroy();
    });
}
```

### 3. Area Scanning

```javascript
function scanArea(centerX, centerY, radius, numRays = 12) {
    const detectedBodies = [];

    for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * 2 * Math.PI;
        const endX = centerX + Math.cos(angle) * radius;
        const endY = centerY + Math.sin(angle) * radius;

        const overlaps = detector.checkLineOverlap({ x: centerX, y: centerY }, { x: endX, y: endY });

        detectedBodies.push(...overlaps);
    }

    return detectedBodies;
}
```

### 4. Path Finding

```javascript
function isPathClear(startX, startY, endX, endY) {
    // Check if any obstacles block the path
    return !detector.hasLineOverlap({ x: startX, y: startY }, { x: endX, y: endY }, (body) => {
        const label = body.getUserData()?.label;
        return ['obstacle', 'wall', 'barrier'].includes(label);
    });
}
```

### 5. Trigger Lines

```javascript
function checkTriggerLine(triggerY) {
    // Check if any balls cross a horizontal trigger line
    const hits = detector.checkLineOverlapWithBalls({ x: 0, y: triggerY }, { x: canvasWidth, y: triggerY });

    if (hits.length > 0) {
        console.log('Trigger activated!');
        // Trigger game event
    }
}
```

## Performance Notes

1. **Coordinate System**: The detector automatically handles conversion between pixels (your game) and meters (PlankJS physics)

2. **Filtering**: Use body filters to avoid unnecessary processing of irrelevant bodies

3. **Ray Length**: Shorter rays are generally faster than longer ones

4. **Query Type**: Use `hasLineOverlap()` for boolean checks - it's more efficient than `checkLineOverlap()`

5. **Caching**: Create one detector instance and reuse it rather than creating new ones frequently

## Integration with Your Scene

```javascript
// In your scene constructor
import { createLineOverlapDetector } from './lineoverlap.js';

export class YourScene extends SceneBase {
    constructor(objectManager) {
        super(objectManager);
        // ... other initialization

        // Create line overlap detector
        this.lineDetector = createLineOverlapDetector(this.physics);
    }

    update(deltaTime) {
        // ... your update logic

        // Example: Check for laser targeting
        if (this.laserActive) {
            const targets = this.lineDetector.checkLineOverlapWithBalls(this.laserStart, this.laserEnd);
            this.handleLaserTargets(targets);
        }
    }
}
```

## Error Handling

The detector gracefully handles edge cases:

-   Invalid physics world (returns empty arrays or false)
-   Zero-length lines (returns empty arrays)
-   Lines outside world bounds (uses PlankJS's built-in handling)
-   Missing user data (provides fallback values)

```javascript
// Safe usage pattern
if (detector && physicsEngine.world) {
    const overlaps = detector.checkLineOverlap(lineStart, lineEnd);
    if (overlaps.length > 0) {
        // Process overlaps
    }
}
```

This line-body overlap detection system gives you powerful spatial query capabilities that work seamlessly with PlankJS's physics simulation, enabling rich gameplay mechanics like line-of-sight, collision detection, area scanning, and much more.
