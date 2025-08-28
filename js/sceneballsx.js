import { SceneBase } from './scenebase.js';
import { BallManager } from './ball.js';
import { PhysicsEngine, PhysicsBodyFactory, PhysicsUtils, metersToPixels } from './physics.js';
import { LaserEffect } from './lasereffect.js';
import { createLineOverlapDetector } from './lineoverlap.js';
// import { wallThickness } from './constants.js';
// import { fixedTimeStep } from './constants.js';

export const wallThickness = 16;
export const fixedTimeStep = 1000 / 60; // ms per physics step (16.666...)

export class SceneBallsX extends SceneBase {
    constructor(objectManager) {
        super(objectManager);
        this.audioHandler = objectManager.get('AudioHandler');
        this.sceneManager = objectManager.get('SceneManager');
        // this.ballManager = objectManager.register('BallManager', new BallManager(objectManager));
        this.physics = objectManager.register('PhysicsEngine', new PhysicsEngine());

        this.physics.create();
        this.physics.setGravity(0, 300); // Gentler gravity for relaxed gameplay
        this.physics.setTimeScale(1);

        // Set world reference in factory
        PhysicsBodyFactory.setWorld(this.physics.world);

        this.clock = {
            deltaTime: 0,
            currentTime: 0,
            lastStatsUpdate: 0,
            cachedDeltaTime: 0,
            cachedFPS: 0,
            stepCount: 0,
            cachedStepCount: 0,
        };

        this.showingExitDialog = false;
        this.exitToMenu = false;

        this.setupBoundaries();
        this.setupEventHandlers();

        this._physicsAccumulator = 0;

        // Initialize laser effect
        this.laserEffect = new LaserEffect(this.canvas, this.ctx);

        // Initialize line overlap detector for spatial queries
        this.lineOverlapDetector = createLineOverlapDetector(this.physics);
    }

    getSceneStateHtml() {
        const now = performance.now();
        const timeDiff = now - this.clock.lastStatsUpdate;
        if (timeDiff > 500) {
            this.clock.cachedDeltaTime = this.clock.deltaTime.toFixed(2);
            this.clock.cachedFPS = (1000 / this.clock.deltaTime).toFixed(1);
            this.clock.cachedStepCount = ((this.clock.stepCount * 1000) / timeDiff).toFixed(1);
            this.clock.stepCount = 0;
            this.clock.lastStatsUpdate = now;
        }
        const vHtml = `
            <strong>Scene: BallsX</strong><br>
            Delta Time: ${this.clock.cachedDeltaTime}ms,&nbsp;
            FPS: ${this.clock.cachedFPS},&nbsp;
            StepsPS: ${this.clock.cachedStepCount}
            <br><hr style="border: none; border-top: 1px solid #00ff00; margin-top: 5px; margin-bottom: 5px;">
            ${this.ballManager.getBallsStateHtml()}
        `;

        return vHtml;
    }

    setupEventHandlers() {
        this.physics.on('collisionStart', (event) => {
            const collisionPairs = PhysicsUtils.getCollisionPairs(event);
            collisionPairs.forEach(({ bodyA, bodyB }) => {
                if (bodyA === bodyB) {
                    alert('Self-collision detected');
                }

                const ballALabel = bodyA.getUserData().label;
                const ballBLabel = bodyB.getUserData().label;

                if (ballALabel === 'ball' && ballBLabel === 'ball') {
                    const ballASize = bodyA.getUserData().render.size;
                    const ballBSize = bodyB.getUserData().render.size;

                    if (ballASize === ballBSize) {
                        const ballA = bodyA.getUserData()?.ball;
                        const ballB = bodyB.getUserData()?.ball;

                        this.ballManager.combineBalls(ballA, ballB);
                    }
                }
            });
        });

        this.physics.on('collisionEnd', (event) => {
            // const ballGroundCollisions = PhysicsUtils.findCollisionByLabels(event, 'ball', 'ground');
            // ballGroundCollisions.forEach(({ bodyA, bodyB }) => {
            //     const ball = bodyA.label === 'ball' ? bodyA : bodyB;
            // });
        });
    }

    setupBoundaries() {
        // Use shared wallThickness constant
        const width = this.canvas.width;
        const height = this.canvas.height;
        const restitution = 0.7;
        const friction = 0.5;

        const renderGround = {
            fillStyle: '#0080ff',
            strokeStyle: '#0080ff',

            lineWidth: 3,
            width: width,
            height: wallThickness,
        };

        const ground = PhysicsBodyFactory.createRectangle(width / 2, height - wallThickness / 2, width, wallThickness, {
            isStatic: true,
            friction: friction,
            restitution: restitution,
            userData: {
                label: 'ground',
                render: renderGround,
            },
        });

        const renderWall = {
            fillStyle: '#0080ff',
            strokeStyle: '#0080ff',
            lineWidth: 3,
            width: wallThickness,
            height: height,
        };

        const leftWall = PhysicsBodyFactory.createRectangle(wallThickness / 2, height / 2, wallThickness, height, {
            isStatic: true,
            friction: friction,
            restitution: restitution,
            userData: {
                label: 'leftwall',
                render: renderWall,
            },
        });

        const rightWall = PhysicsBodyFactory.createRectangle(width - wallThickness / 2, height / 2, wallThickness, height, {
            isStatic: true,
            friction: friction,
            restitution: restitution,
            userData: {
                label: 'rightwall',
                render: renderWall,
            },
        });

        this.physics.addBody(ground);
        this.physics.addBody(leftWall);
        this.physics.addBody(rightWall);
    }

    addBody(body) {
        this.physics.addBody(body);
    }

    removeBody(body) {
        this.physics.removeBody(body);
    }

    renderWallOrFloor(body) {
        const ctx = this.ctx;

        // Convert position from meters to pixels for rendering
        const meterPosition = body.getPosition();
        const position = {
            x: metersToPixels(meterPosition.x),
            y: metersToPixels(meterPosition.y),
        };
        const angle = body.getAngle();

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);

        let render = body.getUserData().render;

        ctx.fillStyle = render.fillStyle;
        ctx.strokeStyle = render.strokeStyle;
        ctx.lineWidth = render.lineWidth;

        const width = render.width;
        const height = render.height;

        ctx.fillRect(-width / 2, -height / 2, width, height);
        ctx.strokeRect(-width / 2, -height / 2, width, height);

        ctx.restore();
    }

    renderBall(body) {
        const ctx = this.ctx;

        const meterPosition = body.getPosition();
        const position = {
            x: metersToPixels(meterPosition.x),
            y: metersToPixels(meterPosition.y),
        };
        const angle = body.getAngle();

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);

        let render = body.getUserData().render;

        ctx.fillStyle = render.fillStyle;
        ctx.strokeStyle = render.strokeStyle;
        ctx.lineWidth = render.lineWidth;

        let physicsRadius = render.radius;

        const strokeWidth = ctx.lineWidth || 0;
        const renderRadius = physicsRadius - strokeWidth / 2;

        if (renderRadius > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, renderRadius, 0, 6.28);
            ctx.fill();

            if (ctx.strokeStyle && strokeWidth > 0) {
                ctx.stroke();
            }

            if (render.showNumber) {
                ctx.save();

                const fontSize = Math.max(24, renderRadius * 0.8);
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeText(render.size.toString(), 0, 0);

                ctx.fillText(render.size.toString(), 0, 0);

                ctx.restore();
            }
        }

        ctx.restore();
    }

    updatePhysics(deltaTime) {
        // Fixed timestep accumulator pattern
        this._physicsAccumulator += deltaTime;

        while (this._physicsAccumulator >= fixedTimeStep) {
            this.physics.update(fixedTimeStep);
            this._physicsAccumulator -= fixedTimeStep;
            this.clock.stepCount++;
        }

        this.clock.stepTime = fixedTimeStep;
    }

    renderScene() {
        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Oh Balls';
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#111111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render laser effect
        this.laserEffect.render();

        // Get all bodies and render them
        const bodies = this.physics.getAllBodies();

        bodies.forEach((body) => {
            switch (body.getUserData().label) {
                case 'leftwall':
                case 'rightwall':
                case 'ground':
                    this.renderWallOrFloor(body);
                    break;
                default:
                    this.renderBall(body);
                    break;
            }
        });
    }

    inputKeyPressed(comboId) {
        switch (comboId) {
            case 'ArrowLeft':
                this.ballManager.moveCurrentBall(-1);
                break;
            case 'ArrowRight':
                this.ballManager.moveCurrentBall(1);
                break;
            case 'ArrowDown':
            case 'Space':
                this.ballManager.dropCurrentBall();
                break;
            case 'Escape':
                // Show exit confirmation dialog
                this.showingExitDialog = true;

                this.sceneManager.doDialog('Exit Game', 'Are you sure you want to exit?', ['Yes', 'No'], (result) => {
                    this.showingExitDialog = false;
                    this.clock.currentTime = performance.now();
                    if (result === 'Yes') {
                        this.exitToMenu = true;
                    }
                });

                break;
            case 'KeyL':
                // Manual laser trigger for testing
                this.laserEffect.triggerLaser();
                break;
            default:
                break;
        }
    }

    enter() {
        this.objectManager.get('AudioHandler').transitionMusic('GameMusic');
        this.ballManager = this.objectManager.register('BallManager', new BallManager(this.objectManager));
    }

    exit() {
        this.objectManager.get('AudioHandler').transitionMusic('MenuMusic');

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#111111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Destroy BallManager first so it doesn't attempt to access physics during its teardown
        if (this.ballManager) {
            this.ballManager.destroy();
            this.ballManager = null;
            this.objectManager.deregister('BallManager');
        }

        if (this.physics) {
            this.physics.destroy();
            this.physics = null;
            this.objectManager.deregister('PhysicsEngine');
        }

        // Clean up laser effect
        if (this.laserEffect) {
            this.laserEffect.destroy();
            this.laserEffect = null;
        }
    }

    updateFrame() {
        if (this.showingExitDialog) {
            return null;
        }

        if (this.exitToMenu) {
            return SceneBase.GameScenes.mainmenu;
        }

        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        this.updatePhysics(this.clock.deltaTime);
        this.ballManager.updateFrame();

        // Update laser effect
        this.laserEffect.update(this.clock.deltaTime);

        this.renderScene();

        // Example: Check if any balls are crossing a horizontal line
        this.checkLineOverlapExample();
    }

    /**
     * Example method showing how to use line-body overlap detection
     * This demonstrates checking if any balls cross a horizontal line
     */
    checkLineOverlapExample() {
        // Define a horizontal line across the middle of the screen
        const lineStart = { x: wallThickness, y: this.canvas.height / 2 };
        const lineEnd = { x: this.canvas.width - wallThickness, y: this.canvas.height / 2 };

        // Check if any balls overlap with this line
        const ballOverlaps = this.lineOverlapDetector.checkLineOverlapWithBalls(lineStart, lineEnd);

        if (ballOverlaps.length > 0) {
            // Log information about overlapping balls
            ballOverlaps.forEach((overlap) => {
                const ball = overlap.userData?.ball;
                if (ball) {
                    console.log(`Ball size ${ball.size} crossing line at point:`, overlap.point);
                }
            });
        }
    }

    /**
     * Check if there's a clear path between two points (no walls in the way)
     * @param {number} startX - Start X coordinate in pixels
     * @param {number} startY - Start Y coordinate in pixels
     * @param {number} endX - End X coordinate in pixels
     * @param {number} endY - End Y coordinate in pixels
     * @returns {boolean} True if path is clear
     */
    isPathClear(startX, startY, endX, endY) {
        return !this.lineOverlapDetector.hasLineOverlap({ x: startX, y: startY }, { x: endX, y: endY }, (body) => {
            const label = body.getUserData()?.label;
            // Only walls block the path, not balls
            return ['leftwall', 'rightwall', 'ground'].includes(label);
        });
    }

    /**
     * Find all balls that would be hit by a laser from a point in a direction
     * @param {number} startX - Laser start X coordinate
     * @param {number} startY - Laser start Y coordinate
     * @param {number} angle - Laser angle in radians
     * @param {number} maxDistance - Maximum laser distance
     * @returns {Array} Array of balls that would be hit
     */
    getLaserTargets(startX, startY, angle, maxDistance = 1000) {
        const endX = startX + Math.cos(angle) * maxDistance;
        const endY = startY + Math.sin(angle) * maxDistance;

        return this.lineOverlapDetector.checkLineOverlapWithBalls({ x: startX, y: startY }, { x: endX, y: endY });
    }

    /**
     * Check if any balls are within a scanning line that sweeps across the screen
     * @param {number} scanY - Y coordinate of the horizontal scan line
     * @returns {Array} Array of balls crossing the scan line
     */
    scanForBalls(scanY) {
        const lineStart = { x: wallThickness, y: scanY };
        const lineEnd = { x: this.canvas.width - wallThickness, y: scanY };

        return this.lineOverlapDetector.checkLineOverlapWithBalls(lineStart, lineEnd);
    }

    /**
     * Get all bodies that overlap with a specific line
     * @param {Object} lineStart - {x, y} start point
     * @param {Object} lineEnd - {x, y} end point
     * @param {Array} filterLabels - Optional array of labels to filter by
     * @returns {Array} Array of overlapping bodies
     */
    getBodiesOnLine(lineStart, lineEnd, filterLabels = null) {
        if (filterLabels) {
            return this.lineOverlapDetector.checkLineOverlapByLabel(lineStart, lineEnd, filterLabels);
        } else {
            return this.lineOverlapDetector.checkLineOverlap(lineStart, lineEnd);
        }
    }

    /**
     * Find the closest ball to a given point using line casting in multiple directions
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} maxDistance - Maximum search distance
     * @returns {Object|null} Closest ball information or null
     */
    findClosestBall(centerX, centerY, maxDistance = 500) {
        let closestBall = null;
        let closestDistance = Infinity;

        // Cast rays in 8 directions to find the closest ball
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * 2 * Math.PI;
            const endX = centerX + Math.cos(angle) * maxDistance;
            const endY = centerY + Math.sin(angle) * maxDistance;

            const closest = this.lineOverlapDetector.getClosestLineOverlap(
                { x: centerX, y: centerY },
                { x: endX, y: endY },
                (body) => body.getUserData()?.label === 'ball'
            );

            if (closest && closest.fraction < closestDistance) {
                closestDistance = closest.fraction;
                closestBall = closest;
            }
        }

        return closestBall;

        return null; // Stay in this scene
    }
}
