// Ball Module for creating and managing balls
import { PhysicsBodyFactory, PhysicsConstants, pixelsToMeters } from './physics.js';
import { wallThickness } from './sceneballsx.js';

export class Ball {
    constructor(objectManager, x, y, size) {
        this.objectManager = objectManager;
        this.sceneManager = objectManager.get('SceneManager');
        this.sceneBallsX = objectManager.get('SceneBallsX');

        this.combining = false;
        this.size = size;
        this.radius = this.calculateRadius(this.size);
        this.color = this.getColorForSize(this.size);

        const render = {
            radius: this.radius,
            fillStyle: this.color,
            strokeStyle: '#ffffff',
            lineWidth: 3,
            visible: true,
            showNumber: true,
            size: this.size,
        };

        const userData = {
            label: 'ball',
            ball: this,
            render: render,
        };

        this.physicsBody = PhysicsBodyFactory.createCircle(x, y, this.radius, {
            label: 'ball',
            density: 1,
            friction: 0.1,
            restitution: 0.8,
            linearDamping: 0.1,
            angularDamping: 0.1,
            userData: userData,
        });

        this.physicsBody.setStatic(true);

        // Add to scene
        this.sceneBallsX.addBody(this.physicsBody);
    }

    getBallStateHtml() {
        let vHtml = ``;

        // Calculate mass using meter radius for realistic physics mass
        const meterRadius = pixelsToMeters(this.radius);
        const density = 1.0; // Default density from physics body factory
        let mass = meterRadius * meterRadius * Math.PI * density;

        vHtml += this.physicsBody.id + ':&nbsp;';
        vHtml +=
            '<svg width="12" height="12" style="vertical-align:middle;"><circle cx="6" cy="6" r="6" fill="' +
            this.color +
            '"/></svg>&nbsp;';

        vHtml += 'Size:' + this.size + '&nbsp;';
        vHtml += 'Mass:' + mass.toFixed(2) + '&nbsp;';
        vHtml += 'Speed:' + this.physicsBody.speed.toFixed(3) + '&nbsp;';
        const pos = this.physicsBody.getPosition();
        vHtml += 'Pos:' + pos.x.toFixed(0) + ',' + pos.y.toFixed(0) + '&nbsp;';
        const vel = this.physicsBody.getVelocity();
        vHtml += 'Vel:' + vel.x.toFixed(3) + ',' + vel.y.toFixed(3) + '&nbsp;';
        vHtml += 'Ang Vel:' + this.physicsBody.getAngularVelocity().toFixed(3) + '&nbsp;';
        vHtml += this.physicsBody.isSleeping() ? 'S' : '';

        vHtml += '<br/>';

        return vHtml;
    }

    calculateRadius(size) {
        return 25 + (size - 1) * 10;
    }

    getColorForSize(size) {
        // Cyberpunk color palette based on size
        const colors = [
            '#ff0080', // Hot pink
            '#00ff80', // Bright green
            '#8000ff', // Purple
            '#ff8000', // Orange
            '#0080ff', // Blue
            '#ff0040', // Red-pink
            '#40ff00', // Lime
            '#ff4000', // Red-orange
            '#0040ff', // Deep blue
            '#ff00c0', // Magenta
            '#00c0ff', // Cyan
            '#c000ff', // Violet
            '#ffc000', // Gold
            '#00ffc0', // Aqua
            '#c0ff00', // Yellow-green
        ];

        return colors[(size - 1) % colors.length];
    }

    getPosition() {
        return this.physicsBody.getPosition();
    }

    setPosition(x, y) {
        this.physicsBody.setPosition(x, y);
    }

    // Release ball from static state (when dropped)
    release() {
        if (!this.physicsBody) {
            alert('Error: Ball physics body is null in release()');
            this.destroy();
            return;
        }
        this.physicsBody.setStatic(false);
        this.physicsBody.setAngularVelocity(0);
        this.physicsBody.setVelocity(0, 0);
    }

    destroy() {
        // Defensive: scene or physics may already be torn down
        try {
            if (this.sceneBallsX && this.sceneBallsX.physics) {
                this.sceneBallsX.removeBody(this.physicsBody);
            }
        } catch (ex) {
            // ignore errors during teardown
        }

        this.physicsBody = null;
        this.objectManager = null;
        this.sceneManager = null;
        this.combining = false;
    }
}

export class BallManager {
    constructor(objectManager) {
        this.objectManager = objectManager;
        this.sceneManager = objectManager.get('SceneManager');
        this.sceneBallsX = objectManager.get('SceneBallsX');
        this.audioHandler = objectManager.get('AudioHandler');

        this.canvasHeight = this.sceneManager.canvas.height;
        this.canvasWidth = this.sceneManager.canvas.width;

        this.currentBall = null;
        this.lastCleanupTime = 0;
        this.lastDropTime = 0;
        this.lastCurrentBallPosition = this.canvasWidth / 2;
        // In-memory queue for pairing balls to be combined.
        // Each entry is an object: { ballA: Ball, ballB: Ball }
        this.combineQueue = [];
    }

    getBallBodies() {
        // Defensive: scene or physics may have been destroyed during scene exit.
        if (!this.sceneBallsX || !this.sceneBallsX.physics) return [];
        return this.sceneBallsX.physics.getBodiesByLabel('ball') || [];
    }

    getBallsStateHtml() {
        let vHtml = `<strong>Ball Details</strong><br>`;

        let ballBodies = this.getBallBodies();

        ballBodies.forEach((ballBody) => {
            const ball = ballBody.getUserData()?.ball;
            if (ball) {
                vHtml += `${ball.getBallStateHtml()}`;
            }
        });

        return vHtml;
    }

    keepXWithinBounds(x, ball) {
        const ballRadius = ball.radius;
        const minX = wallThickness + ballRadius + 2;
        const maxX = this.canvasWidth - wallThickness - ballRadius - 2;
        let newX = Math.max(minX, Math.min(maxX, x));
        return newX;
    }

    spawnBall() {
        if (this.currentBall !== null) {
            return;
        }

        if (performance.now() - this.lastDropTime < 1000) {
            return;
        }

        const x = 512;
        const y = -100;

        this.currentBall = new Ball(this.objectManager, x, y, Math.floor(Math.random() * 5) + 1);

        let newX = this.keepXWithinBounds(this.lastCurrentBallPosition, this.currentBall);

        this.currentBall.setPosition(newX, 72);
    }

    dropCurrentBall() {
        if (this.currentBall === null) {
            return;
        }

        this.currentBall.release();
        this.lastDropTime = performance.now();

        this.currentBall = null;
    }

    moveCurrentBall(direction) {
        if (this.currentBall === null) {
            return;
        }

        const currentPos = this.currentBall.getPosition();
        const moveDistance = 5; // Distance to move per frame
        let newX = currentPos.x + direction * moveDistance;

        // Use keepXWithinBounds, which now uses WALL_THICKNESS
        newX = this.keepXWithinBounds(newX, this.currentBall);

        this.currentBall.setPosition(newX, currentPos.y);
        this.lastCurrentBallPosition = newX;
    }

    queueCombine(ballA, ballB) {
        if (!ballA || !ballB) return false;
        // store the Ball objects directly
        this.combineQueue.push({ ballA, ballB });
        return true;
    }

    dequeueCombine() {
        if (this.combineQueue.length === 0) return null;
        return this.combineQueue.shift();
    }

    processCombineQueue() {
        while (this.combineQueue.length > 0) {
            const entry = this.dequeueCombine();
            if (!entry) break;
            const { ballA, ballB } = entry;
            if (!ballA || !ballB) continue;

            this.combineBallsMerge(ballA, ballB);
        }
    }

    combineBallsMerge(ballA, ballB) {
        const newSize = ballA.size < 15 ? ballA.size + 1 : 15;

        const posA = ballA.getPosition();
        const posB = ballB.getPosition();
        const newX = (posA.x + posB.x) / 2;
        const newY = (posA.y + posB.y) / 2;

        const velA = ballA.physicsBody.getVelocity();
        const velB = ballB.physicsBody.getVelocity();
        const newVelX = (velA.x + velB.x) / 2;
        const newVelY = (velA.y + velB.y) / 2;

        const newBall = new Ball(this.objectManager, newX, newY, newSize);

        newBall.physicsBody.setVelocity(newVelX, newVelY);
        newBall.physicsBody.setStatic(false);

        let rnd = Math.floor(Math.random() * 6) + 1;
        this.audioHandler.playSFX(`Combine${rnd}`);

        ballA.destroy();
        ballB.destroy();
        ballA = null;
        ballB = null;
    }

    combineBalls(ballA, ballB) {
        if (ballA.combining || ballB.combining) {
            return false;
        }

        ballA.combining = true;
        ballB.combining = true;

        this.queueCombine(ballA, ballB);
    }

    updateFrame() {
        this.spawnBall();
        this.updateBallStates();
        this.processCombineQueue();
    }

    updateBallStates() {
        let ballBodies = this.getBallBodies();

        // this.stopJittering();

        this.cleanup();
    }

    cleanup() {
        let now = performance.now();
        if (now - this.lastCleanupTime < 15000) {
            return;
        }
        this.lastCleanupTime = now;

        let ballBodies = this.getBallBodies();

        ballBodies.forEach((ballBody) => {
            const ball = ballBody.getUserData()?.ball;
            if (ball) {
                const pos = ball.getPosition();
                //               const isOffScreen = pos.x < 0 || pos.x > canvasWidth || pos.y < 0 || pos.y > canvasHeight;
                const isOffScreen = pos.y > this.canvasHeight + 100; // Allow some space below the canvas

                if (isOffScreen) {
                    ball.destroy();
                }
            }
        });
    }

    destroy() {
        let ballBodies = this.getBallBodies();
        ballBodies.forEach((ballBody) => {
            let ball = ballBody.getUserData()?.ball;
            if (ball) {
                ball.destroy();
                ball = null;
            }
        });

        this.sceneManager = null;
        this.sceneBallsX = null;
        this.objectManager = null;
        this.audioHandler = null;
    }
}
