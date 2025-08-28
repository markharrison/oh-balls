// Example usage of Line-Body Overlap Detection
// This file demonstrates how to use the LineOverlapDetector with PlankJS

import { LineOverlapDetector, createLineOverlapDetector, checkLineBodyOverlap } from './lineoverlap.js';

/**
 * Example class showing how to integrate line-body overlap detection
 * into your scene or game logic
 */
export class LineOverlapExample {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.physics = sceneManager.physics;

        // Create the line overlap detector
        this.lineDetector = createLineOverlapDetector(this.physics);

        // Example line coordinates (in pixels)
        this.lineStart = { x: 100, y: 50 };
        this.lineEnd = { x: 900, y: 400 };
    }

    /**
     * Example 1: Check if any bodies overlap with a line
     */
    checkAnyOverlap() {
        const overlaps = this.lineDetector.checkLineOverlap(this.lineStart, this.lineEnd);

        console.log(`Found ${overlaps.length} bodies overlapping the line`);

        overlaps.forEach((overlap, index) => {
            const userData = overlap.userData;
            const label = userData?.label || 'unknown';

            console.log(`Overlap ${index + 1}:`, {
                label: label,
                bodyId: userData?.id,
                intersectionPoint: overlap.point,
                normal: overlap.normal,
                fraction: overlap.fraction,
            });
        });

        return overlaps;
    }

    /**
     * Example 2: Check if only ball bodies overlap with a line
     */
    checkBallOverlap() {
        const ballOverlaps = this.lineDetector.checkLineOverlapWithBalls(this.lineStart, this.lineEnd);

        console.log(`Found ${ballOverlaps.length} balls overlapping the line`);

        ballOverlaps.forEach((overlap, index) => {
            const ball = overlap.userData?.ball;
            if (ball) {
                console.log(`Ball ${index + 1}:`, {
                    size: ball.size,
                    color: ball.color,
                    position: ball.getPosition(),
                    intersectionPoint: overlap.point,
                });
            }
        });

        return ballOverlaps;
    }

    /**
     * Example 3: Simple boolean check - is line blocked?
     */
    isLineBlocked() {
        const hasOverlap = this.lineDetector.hasLineOverlap(this.lineStart, this.lineEnd);
        console.log(`Line is ${hasOverlap ? 'blocked' : 'clear'}`);
        return hasOverlap;
    }

    /**
     * Example 4: Get the closest body to the line start
     */
    getClosestBody() {
        const closest = this.lineDetector.getClosestLineOverlap(this.lineStart, this.lineEnd);

        if (closest) {
            const label = closest.userData?.label || 'unknown';
            console.log('Closest body:', {
                label: label,
                distance: closest.fraction,
                intersectionPoint: closest.point,
            });
        } else {
            console.log('No bodies intersect the line');
        }

        return closest;
    }

    /**
     * Example 5: Check overlap with specific body types only
     */
    checkStaticBodyOverlap() {
        // Filter to only check static bodies (walls, ground, etc.)
        const staticOverlaps = this.lineDetector.checkLineOverlap(this.lineStart, this.lineEnd, (body) => {
            const label = body.getUserData()?.label;
            return ['leftwall', 'rightwall', 'ground'].includes(label);
        });

        console.log(`Found ${staticOverlaps.length} static bodies overlapping the line`);
        return staticOverlaps;
    }

    /**
     * Example 6: Dynamic line that follows mouse or moves over time
     */
    updateDynamicLine(mouseX, mouseY) {
        // Update line end to follow mouse position
        this.lineEnd = { x: mouseX, y: mouseY };

        // Check for overlaps with the new line position
        const overlaps = this.lineDetector.checkLineOverlap(this.lineStart, this.lineEnd);

        // React to overlaps (e.g., change line color, play sound, etc.)
        if (overlaps.length > 0) {
            console.log('Line is intersecting bodies');
            // Could trigger visual feedback, sound effects, etc.
        }

        return overlaps;
    }

    /**
     * Example 7: Use for line-of-sight checks
     */
    hasLineOfSight(fromPoint, toPoint) {
        // Check if there are any obstacles between two points
        // Exclude certain body types from blocking line of sight
        const hasObstacle = this.lineDetector.hasLineOverlap(fromPoint, toPoint, (body) => {
            const label = body.getUserData()?.label;
            // Only walls and static objects block line of sight, not balls
            return ['leftwall', 'rightwall', 'ground'].includes(label);
        });

        return !hasObstacle;
    }

    /**
     * Example 8: Area sweep using multiple lines
     */
    sweepArea(centerX, centerY, radius, numRays = 8) {
        const sweepResults = [];

        for (let i = 0; i < numRays; i++) {
            const angle = (i / numRays) * 2 * Math.PI;
            const endX = centerX + Math.cos(angle) * radius;
            const endY = centerY + Math.sin(angle) * radius;

            const overlaps = this.lineDetector.checkLineOverlap({ x: centerX, y: centerY }, { x: endX, y: endY });

            sweepResults.push({
                angle: angle,
                direction: { x: Math.cos(angle), y: Math.sin(angle) },
                overlaps: overlaps,
            });
        }

        console.log(`Area sweep found bodies in ${sweepResults.filter((r) => r.overlaps.length > 0).length}/${numRays} directions`);
        return sweepResults;
    }

    /**
     * Render the line and overlaps for debugging/visualization
     */
    renderLineDebug(ctx) {
        if (!ctx) return;

        // Draw the line
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.lineStart.x, this.lineStart.y);
        ctx.lineTo(this.lineEnd.x, this.lineEnd.y);
        ctx.stroke();

        // Check for overlaps and draw intersection points
        const overlaps = this.lineDetector.checkLineOverlap(this.lineStart, this.lineEnd);

        overlaps.forEach((overlap) => {
            // Draw intersection point
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(overlap.point.x, overlap.point.y, 5, 0, 2 * Math.PI);
            ctx.fill();

            // Draw normal vector
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(overlap.point.x, overlap.point.y);
            ctx.lineTo(overlap.point.x + overlap.normal.x * 20, overlap.point.y + overlap.normal.y * 20);
            ctx.stroke();
        });
    }
}

/**
 * Static utility functions for common use cases
 */
export class LineOverlapUtils {
    /**
     * Check if a laser/projectile would hit any balls
     */
    static checkLaserHit(physics, startX, startY, endX, endY) {
        const detector = new LineOverlapDetector(physics);
        return detector.checkLineOverlapByLabel({ x: startX, y: startY }, { x: endX, y: endY }, 'ball');
    }

    /**
     * Check if a path is clear for movement
     */
    static isPathClear(physics, startX, startY, endX, endY, avoidLabels = ['leftwall', 'rightwall', 'ground']) {
        const detector = new LineOverlapDetector(physics);
        return !detector.hasLineOverlap({ x: startX, y: startY }, { x: endX, y: endY }, (body) => {
            const label = body.getUserData()?.label;
            return avoidLabels.includes(label);
        });
    }

    /**
     * Find all bodies within a line sweep
     */
    static findBodiesInLine(physics, startX, startY, endX, endY, targetLabels = null) {
        const detector = new LineOverlapDetector(physics);

        if (targetLabels) {
            return detector.checkLineOverlapByLabel({ x: startX, y: startY }, { x: endX, y: endY }, targetLabels);
        } else {
            return detector.checkLineOverlap({ x: startX, y: startY }, { x: endX, y: endY });
        }
    }
}
