// Line-Body Overlap Detection for PlankJS
// This module provides utilities to check if any bodies overlap with a line

import { pixelsToMeters, metersToPixels } from './physics.js';

/**
 * Utility class for detecting line-body overlaps using PlankJS spatial queries
 */
export class LineOverlapDetector {
    constructor(physicsEngine) {
        this.physics = physicsEngine;
        this.world = physicsEngine.world;
    }

    /**
     * Check if any bodies overlap with a line segment using raycasting
     * This is the most accurate method as PlankJS handles all shape types
     *
     * @param {Object} lineStart - {x, y} start point in pixels
     * @param {Object} lineEnd - {x, y} end point in pixels
     * @param {Function} bodyFilter - Optional filter function (body) => boolean
     * @returns {Array} Array of overlapping bodies with intersection details
     */
    checkLineOverlap(lineStart, lineEnd, bodyFilter = null) {
        if (!this.world) {
            console.warn('Physics world not available');
            return [];
        }

        // Convert pixel coordinates to meters for PlankJS
        const point1 = {
            x: pixelsToMeters(lineStart.x),
            y: pixelsToMeters(lineStart.y),
        };
        const point2 = {
            x: pixelsToMeters(lineEnd.x),
            y: pixelsToMeters(lineEnd.y),
        };

        const overlappingBodies = [];

        // Use PlankJS rayCast to detect all intersections
        this.world.rayCast(point1, point2, (fixture, point, normal, fraction) => {
            const body = fixture.getBody();

            // Apply filter if provided
            if (bodyFilter && !bodyFilter(body)) {
                return 1.0; // Continue ray casting
            }

            // Convert intersection point back to pixels
            const intersectionPoint = {
                x: metersToPixels(point.x),
                y: metersToPixels(point.y),
            };

            // Convert normal back to pixels (direction doesn't need scaling)
            const intersectionNormal = {
                x: normal.x,
                y: normal.y,
            };

            overlappingBodies.push({
                body: body,
                fixture: fixture,
                point: intersectionPoint,
                normal: intersectionNormal,
                fraction: fraction,
                userData: body.getUserData(),
            });

            return 1.0; // Continue to find all intersections
        });

        return overlappingBodies;
    }

    /**
     * Check if any bodies overlap with a line using AABB query + precise testing
     * Alternative method that first uses broad-phase AABB query, then precise ray testing
     *
     * @param {Object} lineStart - {x, y} start point in pixels
     * @param {Object} lineEnd - {x, y} end point in pixels
     * @param {Function} bodyFilter - Optional filter function (body) => boolean
     * @returns {Array} Array of overlapping bodies with intersection details
     */
    checkLineOverlapAABB(lineStart, lineEnd, bodyFilter = null) {
        if (!this.world) {
            console.warn('Physics world not available');
            return [];
        }

        // Create AABB that encompasses the line segment
        const minX = Math.min(lineStart.x, lineEnd.x);
        const maxX = Math.max(lineStart.x, lineEnd.x);
        const minY = Math.min(lineStart.y, lineEnd.y);
        const maxY = Math.max(lineStart.y, lineEnd.y);

        // Convert to meters and create AABB with small padding
        const padding = pixelsToMeters(1); // 1 pixel padding
        const aabb = new planck.AABB(
            { x: pixelsToMeters(minX) - padding, y: pixelsToMeters(minY) - padding },
            { x: pixelsToMeters(maxX) + padding, y: pixelsToMeters(maxY) + padding }
        );

        const candidateBodies = [];

        // First pass: Get all bodies that might intersect using broad-phase
        this.world.queryAABB(aabb, (fixture) => {
            const body = fixture.getBody();

            // Apply filter if provided
            if (bodyFilter && !bodyFilter(body)) {
                return true; // Continue query
            }

            candidateBodies.push({ body, fixture });
            return true; // Continue query
        });

        // Second pass: Test each candidate body precisely using ray casting
        const overlappingBodies = [];
        const point1 = {
            x: pixelsToMeters(lineStart.x),
            y: pixelsToMeters(lineStart.y),
        };
        const point2 = {
            x: pixelsToMeters(lineEnd.x),
            y: pixelsToMeters(lineEnd.y),
        };

        candidateBodies.forEach(({ body, fixture }) => {
            const shape = fixture.getShape();
            const transform = body.getTransform();

            // Create ray cast input
            const rayCastInput = {
                p1: point1,
                p2: point2,
                maxFraction: 1.0,
            };

            const rayCastOutput = {};

            // Test the shape directly with ray casting
            const hit = shape.rayCast(rayCastOutput, rayCastInput, transform, 0);

            if (hit) {
                const intersectionPoint = {
                    x: metersToPixels(point1.x + rayCastOutput.fraction * (point2.x - point1.x)),
                    y: metersToPixels(point1.y + rayCastOutput.fraction * (point2.y - point1.y)),
                };

                overlappingBodies.push({
                    body: body,
                    fixture: fixture,
                    point: intersectionPoint,
                    normal: rayCastOutput.normal,
                    fraction: rayCastOutput.fraction,
                    userData: body.getUserData(),
                });
            }
        });

        return overlappingBodies;
    }

    /**
     * Check if any bodies of specific labels overlap with a line
     *
     * @param {Object} lineStart - {x, y} start point in pixels
     * @param {Object} lineEnd - {x, y} end point in pixels
     * @param {Array|String} labels - Single label or array of labels to check
     * @returns {Array} Array of overlapping bodies with intersection details
     */
    checkLineOverlapByLabel(lineStart, lineEnd, labels) {
        const targetLabels = Array.isArray(labels) ? labels : [labels];

        return this.checkLineOverlap(lineStart, lineEnd, (body) => {
            const bodyLabel = body.getUserData()?.label;
            return targetLabels.includes(bodyLabel);
        });
    }

    /**
     * Check if any ball bodies overlap with a line
     * Convenience method for checking ball overlaps specifically
     *
     * @param {Object} lineStart - {x, y} start point in pixels
     * @param {Object} lineEnd - {x, y} end point in pixels
     * @returns {Array} Array of overlapping ball bodies with intersection details
     */
    checkLineOverlapWithBalls(lineStart, lineEnd) {
        return this.checkLineOverlapByLabel(lineStart, lineEnd, 'ball');
    }

    /**
     * Simple boolean check - returns true if ANY body overlaps with the line
     *
     * @param {Object} lineStart - {x, y} start point in pixels
     * @param {Object} lineEnd - {x, y} end point in pixels
     * @param {Function} bodyFilter - Optional filter function (body) => boolean
     * @returns {boolean} True if any body overlaps the line
     */
    hasLineOverlap(lineStart, lineEnd, bodyFilter = null) {
        if (!this.world) {
            return false;
        }

        const point1 = {
            x: pixelsToMeters(lineStart.x),
            y: pixelsToMeters(lineStart.y),
        };
        const point2 = {
            x: pixelsToMeters(lineEnd.x),
            y: pixelsToMeters(lineEnd.y),
        };

        let hasOverlap = false;

        // Use early termination for performance
        this.world.rayCast(point1, point2, (fixture, point, normal, fraction) => {
            const body = fixture.getBody();

            // Apply filter if provided
            if (bodyFilter && !bodyFilter(body)) {
                return 1.0; // Continue ray casting
            }

            hasOverlap = true;
            return 0.0; // Terminate ray casting immediately
        });

        return hasOverlap;
    }

    /**
     * Get the closest body that overlaps with a line
     *
     * @param {Object} lineStart - {x, y} start point in pixels
     * @param {Object} lineEnd - {x, y} end point in pixels
     * @param {Function} bodyFilter - Optional filter function (body) => boolean
     * @returns {Object|null} Closest overlapping body or null if none
     */
    getClosestLineOverlap(lineStart, lineEnd, bodyFilter = null) {
        if (!this.world) {
            return null;
        }

        const point1 = {
            x: pixelsToMeters(lineStart.x),
            y: pixelsToMeters(lineStart.y),
        };
        const point2 = {
            x: pixelsToMeters(lineEnd.x),
            y: pixelsToMeters(lineEnd.y),
        };

        let closestOverlap = null;

        this.world.rayCast(point1, point2, (fixture, point, normal, fraction) => {
            const body = fixture.getBody();

            // Apply filter if provided
            if (bodyFilter && !bodyFilter(body)) {
                return 1.0; // Continue ray casting
            }

            const intersectionPoint = {
                x: metersToPixels(point.x),
                y: metersToPixels(point.y),
            };

            closestOverlap = {
                body: body,
                fixture: fixture,
                point: intersectionPoint,
                normal: { x: normal.x, y: normal.y },
                fraction: fraction,
                userData: body.getUserData(),
            };

            // Return fraction to clip the ray for closest-hit behavior
            return fraction;
        });

        return closestOverlap;
    }
}

/**
 * Convenience function to create a line overlap detector
 * @param {Object} physicsEngine - Physics engine instance
 * @returns {LineOverlapDetector}
 */
export function createLineOverlapDetector(physicsEngine) {
    return new LineOverlapDetector(physicsEngine);
}

/**
 * Static helper function for quick line-body overlap checks
 * @param {Object} physicsEngine - Physics engine instance
 * @param {Object} lineStart - {x, y} start point in pixels
 * @param {Object} lineEnd - {x, y} end point in pixels
 * @param {Function} bodyFilter - Optional filter function
 * @returns {Array} Array of overlapping bodies
 */
export function checkLineBodyOverlap(physicsEngine, lineStart, lineEnd, bodyFilter = null) {
    const detector = new LineOverlapDetector(physicsEngine);
    return detector.checkLineOverlap(lineStart, lineEnd, bodyFilter);
}
