# LaserbeamMark Class Documentation

A configurable laser beam effect system with multiple visual styles, particle effects, and smooth animations.

## Basic Usage

```javascript
import { LaserbeamMark } from './lib/laserbeammark.js';

// Create a laser beam
const laser = new LaserbeamMark(canvas, {
    beamStyle: 'solid',
    coords1: [50, 100],
    coords2: [400, 100],
    beamColor: '#00ffff',
    glowColor: '#00ffff',
    tipColor: '#ffffff', // Optional: different tip color
    tipSize: 20,
});

// In your game loop
laser.update(deltaTime);
laser.render();

// Fire the laser (coords1 to coords2)
laser.fire(1);

// Fire the laser in reverse (coords2 to coords1)
laser.fire(-1);

// Instant appear then fade (no shooting animation)
laser.fire(0);
```

## Constructor Options

### Basic Properties

| Option          | Type     | Default                           | Description                                       |
| --------------- | -------- | --------------------------------- | ------------------------------------------------- |
| `coords1`       | `[x, y]` | `[0, canvas.height/2]`            | First coordinate point of the laser               |
| `coords2`       | `[x, y]` | `[canvas.width, canvas.height/2]` | Second coordinate point of the laser              |
| `shootDuration` | `number` | `800`                             | Time (ms) for beam to travel between coordinates  |
| `fadeDuration`  | `number` | `800`                             | Time (ms) for beam to fade out after reaching end |

### Visual Properties

| Option      | Type     | Default     | Description                                    |
| ----------- | -------- | ----------- | ---------------------------------------------- |
| `beamStyle` | `string` | `'solid'`   | Visual style (see Beam Styles below)           |
| `beamColor` | `string` | `'#00ffff'` | Primary color of the beam                      |
| `glowColor` | `string` | `'#00ffff'` | Color of the glow effect                       |
| `tipColor`  | `string` | `glowColor` | Color of the beam tip (defaults to glow color) |
| `beamWidth` | `number` | `4`         | Width of the beam in pixels                    |
| `glowSize`  | `number` | `24`        | Size of the glow effect                        |
| `tipSize`   | `number` | `24`        | Size of the beam tip                           |
| `tipStyle`  | `string` | `'arrow'`   | Tip style: `'arrow'` or `'circle'`             |

### Particle Configuration

| Option           | Type     | Default   | Description                   |
| ---------------- | -------- | --------- | ----------------------------- |
| `particleConfig` | `object` | See below | Particle system configuration |

#### Particle Config Properties

```javascript
particleConfig: {
    color: '#fff',           // Particle color
    glowColor: '#00ffff',    // Particle glow color
    size: 6,                 // Base particle size
    speed: 3,                // Particle movement speed
    life: 600,               // Particle lifetime (ms)
    fade: true,              // Whether particles fade out
    rate: 0.8                // Emission rate (0-1, higher = more particles)
}
```

## Beam Styles

### `'solid'`

Clean, straight laser beam - perfect for precise weapons.

### `'dashed'`

Dashed line effect - good for energy weapons with interrupted power.

### `'crackling'`

Electric crackling effect with small random deviations - ideal for electrical weapons.

### `'lightning'`

Sharp zigzag lightning bolts with dramatic turns - perfect for storm/electric effects.

### `'pulsing'`

Beam width pulses and throbs - great for charging or unstable energy weapons.

### `'charged'`

Multiple thin beams bundled together - excellent for high-tech energy rifles.

### `'plasma'`

Multi-layer glow effect with bright core - perfect for plasma cannons.

### `'disruptor'`

Fragmenting beam that splits and merges - ideal for experimental/alien weapons.

## Tip Styles

The laser beam tip can be configured using the `tipStyle` option:

### `'arrow'` (default)

Sharp diamond/arrow-shaped tip that points in the direction of beam travel. Provides clear directional indication and sharp visual impact.

### `'circle'`

Simple circular tip that glows at the beam endpoint. More subtle than arrow tips and good for energy-based weapons where direction is less important.

## Public Methods

### `fire(direction = 1)`

Starts the laser beam animation with specified direction.

**Parameters:**

-   `direction` (number):
    -   `1` = fire from coords1 to coords2 (default)
    -   `-1` = fire from coords2 to coords1 (reverse)
    -   `0` = instant appear then fade (no shooting animation)

```javascript
laser.fire(1); // Normal direction
laser.fire(-1); // Reverse direction
laser.fire(0); // Instant appear
laser.fire(); // Default (same as fire(1))
```

### `update(deltaTime)`

Updates the laser animation. Call this every frame in your game loop.

```javascript
// In your game loop
laser.update(deltaTime);
```

### `render()`

Renders the laser beam to the canvas. Call this after update() in your render loop.

```javascript
// In your render loop
laser.render();
```

## Properties

### `active` (readonly)

Boolean indicating if the laser is currently active (shooting or fading).

### `phase` (readonly)

Current animation phase: `'idle'`, `'shoot'`, or `'fade'`.

### `progress` (readonly)

Animation progress from 0 to 1 during the shoot phase.

### `opacity` (readonly)

Current opacity from 1 to 0 during the fade phase.

## Examples

### Basic Horizontal Laser

```javascript
const horizontalLaser = new LaserbeamMark(canvas, {
    coords1: [0, 200],
    coords2: [canvas.width, 200],
    beamStyle: 'solid',
    beamColor: '#ff0000',
});
```

### Lightning Effect

```javascript
const lightning = new LaserbeamMark(canvas, {
    coords1: [100, 50],
    coords2: [300, 400],
    beamStyle: 'lightning',
    beamColor: '#ffffff',
    glowColor: '#8888ff',
    tipColor: '#ffff88', // Bright yellow tip
    beamWidth: 6,
    tipSize: 30,
    tipStyle: 'arrow', // Sharp directional tip
});
```

### Energy Orb Beam

```javascript
const energyOrb = new LaserbeamMark(canvas, {
    coords1: [200, 200],
    coords2: [600, 200],
    beamStyle: 'plasma',
    beamColor: '#00ff88',
    glowColor: '#00ff88',
    tipColor: '#ffffff', // White-hot tip
    tipSize: 20,
    tipStyle: 'circle', // Circular energy tip
});
```

### Hot Laser Beam

```javascript
const hotLaser = new LaserbeamMark(canvas, {
    coords1: [50, 100],
    coords2: [750, 100],
    beamStyle: 'solid',
    beamColor: '#ff4444',
    glowColor: '#ff8888',
    tipColor: '#ffff00', // Yellow-hot tip
    tipStyle: 'arrow',
});
```

### Plasma Cannon

```javascript
const plasmaCannon = new LaserbeamMark(canvas, {
    coords1: [playerX, playerY],
    coords2: [targetX, targetY],
    beamStyle: 'plasma',
    beamColor: '#00ff88',
    glowColor: '#00ff88',
    beamWidth: 8,
    shootDuration: 300,
    fadeDuration: 1000,
});
```

### Bidirectional Laser

```javascript
const bidirectionalLaser = new LaserbeamMark(canvas, {
    coords1: [100, 100],
    coords2: [500, 300],
    beamStyle: 'charged',
});

// Fire in different directions
bidirectionalLaser.fire(1); // coords1 to coords2
bidirectionalLaser.fire(-1); // coords2 to coords1
bidirectionalLaser.fire(0); // instant appear
```

### Custom Particles

```javascript
const customLaser = new LaserbeamMark(canvas, {
    beamStyle: 'crackling',
    particleConfig: {
        color: '#ffff00',
        glowColor: '#ff8800',
        size: 8,
        speed: 5,
        life: 800,
        rate: 0.9,
    },
});
```

## Integration Example

```javascript
class GameScene {
    constructor() {
        this.laser = new LaserbeamMark(this.canvas, {
            beamStyle: 'plasma',
            coords1: [50, 150],
            coords2: [750, 150],
        });
    }

    handleInput(key) {
        if (key === 'Space') {
            // Random direction
            const direction = Math.random() < 0.5 ? 1 : -1;
            this.laser.fire(direction);
        }
        if (key === 'Enter') {
            // Instant mode
            this.laser.fire(0);
        }
    }

    update(deltaTime) {
        this.laser.update(deltaTime);
    }

    render() {
        // Clear canvas, draw other objects...
        this.laser.render();
    }
}
```

## Performance Notes

-   The laser automatically manages its particle system
-   Particles are cleaned up when they expire
-   The laser becomes inactive after the fade phase completes
-   Use reasonable particle rates (0.1 - 1.0) for good performance
-   Consider limiting the number of simultaneous laser instances

## Private Methods

The following methods are internal implementation details and should not be called directly:

-   `_drawCracklingBeam()`
-   `_drawLightningBeam()`
-   `_drawPulsingBeam()`
-   `_drawChargedBeam()`
-   `_drawPlasmaBeam()`
-   `_drawDisruptorBeam()`
-   `_emitParticles()`
-   `_updateParticles()`
-   `_renderParticles()`

## Tips

1. **Timing**: Adjust `shootDuration` and `fadeDuration` to match your game's pace
2. **Colors**: Use contrasting `beamColor` and `glowColor` for better visibility
3. **Styles**: Choose beam styles that match your game's theme
4. **Particles**: Lower particle rates for performance, higher for visual impact
5. **Positioning**: Update `startCoords` and `endCoords` dynamically for moving lasers
