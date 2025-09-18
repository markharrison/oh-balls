import { SceneBase } from './scenebase.js';
import { BallManager } from './ball.js';
import { PhysicsEngine, PhysicsBodyFactory, PhysicsUtils, metersToPixels } from './physics.js';
import { LaserbeamHandler } from './laserbeam.js';
import { ParticlesHandler } from './particles.js';

export const wallThickness = 16;
export const fixedTimeStep = 1000 / 60; // ms per physics step (16.666...)

export class SceneBallsX extends SceneBase {
    constructor(objectManager) {
        super(objectManager);
        this.audioHandler = objectManager.get('AudioHandler');
        this.sceneManager = objectManager.get('SceneManager');
        this.configManager = objectManager.get('ConfigManager');
        this.physics = objectManager.register('PhysicsEngine', new PhysicsEngine());
        this.laserbeamHandler = this.objectManager.register('LaserbeamHandler', new LaserbeamHandler(this.objectManager));
        this.particlesHandler = this.objectManager.register('ParticlesHandler', new ParticlesHandler(this.objectManager));

        this.physics.create();
        this.physics.setGravity(0, 300);
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

        // Load ground image
        this.groundImage = new window.Image();
        this.groundImageLoaded = false;
        this.groundImage.onload = () => {
            this.groundImageLoaded = true;
        };
        this.groundImage.src = '/images/large.png';

        this.showingDialog = false;
        this.exitToMenu = false;
        this.restartGame = false;
        this.scoreHighest = this.configManager.getHighestScore('BallsX') || 0;
        this.score = 0;

        this.setupWallBoundaries();
        this.setupGroundBoundaries();
        this.setupZapZone();
        this.setupEventHandlers();

        this._physicsAccumulator = 0;
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

                if ((ballALabel === 'ball' && ballBLabel === 'zapzone') || (ballALabel === 'zapzone' && ballBLabel === 'ball')) {
                    // Ball entered Danger Zone
                    const ballBody = ballALabel === 'ball' ? bodyA : bodyB;
                    const ball = ballBody.getUserData()?.ball;

                    if (!ball.playBall) {
                        this.handleZapZone(ball);
                    }
                }
            });
        });

        this.physics.on('collisionEnd', (event) => {
            const collisionPairs = PhysicsUtils.getCollisionPairs(event);
            collisionPairs.forEach(({ bodyA, bodyB }) => {
                const ballALabel = bodyA.getUserData().label;
                const ballBLabel = bodyB.getUserData().label;

                // Danger Zone exit detection
                if ((ballALabel === 'ball' && ballBLabel === 'zapzone') || (ballALabel === 'zapzone' && ballBLabel === 'ball')) {
                    // Ball left Danger Zone
                    const ballBody = ballALabel === 'ball' ? bodyA : bodyB;
                    const ball = ballBody.getUserData()?.ball;

                    ball.leaveZapZone();
                }
            });
        });
    }

    setupZapZone() {
        const zoneHeight = 400;
        const zoneWidth = this.canvas.width - 2 * wallThickness;

        const zapZoneRender = {
            fillStyle: `rgba(255,0,0,${this.configManager.dev ? 0.2 : 0})`,
            strokeStyle: '#ff0000',
            lineWidth: 0,
            width: zoneWidth,
            height: zoneHeight,
        };
        //                const zapZoneBody = PhysicsBodyFactory.createRectangle(this.canvas.width / 2, zoneHeight / 2, zoneWidth, zoneHeight, {
        const zapZoneBody = PhysicsBodyFactory.createRectangle(this.canvas.width / 2, -20, zoneWidth, zoneHeight, {
            isStatic: true,
            userData: {
                label: 'zapzone',
                render: zapZoneRender,
            },
            isSensor: true,
        });

        const fixture = zapZoneBody.body.getFixtureList();
        if (fixture) fixture.setSensor(true);
        this.zapZoneBody = zapZoneBody;
        this.physics.addBody(zapZoneBody);
    }

    setupWallBoundaries() {
        // Use shared wallThickness constant
        const width = this.canvas.width;
        const height = this.canvas.height;
        const restitution = 0.7;
        const friction = 0.5;

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

        this.physics.addBody(leftWall);
        this.physics.addBody(rightWall);
    }

    setupGroundBoundaries() {
        // Use shared wallThickness constant
        const width = this.canvas.width;
        const height = this.canvas.height;
        const restitution = 0.7;
        const friction = 0.5;

        const renderGround = {
            fillStyle: 'rgba(255, 0, 0, 0.5)',
            strokeStyle: '#ff0000',
            lineWidth: 2,
            width: width,
            height: wallThickness,
        };

        // Vertices relative to (0,0)
        const groundVertices = [
            { x: 624, y: 100 },
            { x: -624, y: 100 },
            { x: -624, y: -200 },
            { x: -100, y: -60 },
            { x: 0, y: -60 },
            { x: 100, y: -60 },
            { x: 624, y: -200 },
        ];
        const groundPosition = { x: width / 2, y: 720 };

        renderGround.polygon = {
            vertices: groundVertices,
            position: groundPosition,
        };

        const ground = PhysicsBodyFactory.createPolygon(groundVertices, {
            isStatic: true,
            friction: friction,
            restitution: restitution,
            position: groundPosition,
            userData: {
                label: 'ground',
                render: renderGround,
            },
        });
        this.physics.addBody(ground);
    }

    addBody(body) {
        this.physics.addBody(body);
    }

    removeBody(body) {
        this.physics.removeBody(body);
    }

    renderRectBody(body) {
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

    renderGround(body) {
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

        // Render polygon if defined
        if (render.polygon) {
            const vertices = render.polygon.vertices;
            const polyPos = render.polygon.position || { x: 0, y: 0 };
            ctx.beginPath();
            ctx.moveTo(vertices[0].x + polyPos.x - position.x, vertices[0].y + polyPos.y - position.y);
            for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].x + polyPos.x - position.x, vertices[i].y + polyPos.y - position.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }

    renderZapZone(body) {
        const ctx = this.ctx;

        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 6]); // Dotted line: 2px dash, 6px gap

        ctx.beginPath();
        ctx.moveTo(wallThickness, 180);
        ctx.lineTo(this.canvas.width - wallThickness, 180);
        ctx.stroke();

        ctx.setLineDash([]); // Reset to solid for future drawing
        ctx.restore();

        this.renderRectBody(body);
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
            // --- Begin Gradient to Black Center Effect ---
            ctx.save();
            ctx.shadowColor = 'rgba(255,255,255,0.7)'; // Glow color
            ctx.shadowBlur = 30; // Consistent blur
            // Create radial gradient (black center, color edge)
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, renderRadius);
            gradient.addColorStop(0, '#000');
            gradient.addColorStop(1, render.fillStyle);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, renderRadius, 0, 6.28);
            ctx.fill();
            ctx.restore();
            // --- End Gradient to Black Center Effect ---

            // Draw stroke as before
            if (ctx.strokeStyle && strokeWidth > 0) {
                ctx.stroke();
            }

            if (render.showNumber) {
                ctx.save();

                const fontSize = Math.max(24, renderRadius * 0.8);
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillStyle = '#ffffff'; // White text
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.strokeStyle = '#000000'; // Black outline for contrast
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

    renderStatusLine() {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Highest: ${this.scoreHighest}  Score: ${this.score}`, 25, 10);
        this.ctx.restore();
    }

    renderScene() {
        const footerElement = document.getElementById('idFooterInfo');
        if (footerElement) {
            footerElement.textContent = 'Harrison Digital - Oh Balls';
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw background image if loaded
        if (this.groundImageLoaded) {
            this.ctx.drawImage(this.groundImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#111111';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.laserbeamHandler.render();

        const bodies = this.physics.getAllBodies();

        bodies.forEach((body) => {
            const label = body.getUserData().label;
            switch (label) {
                case 'leftwall':
                case 'rightwall':
                    this.renderRectBody(body);
                    break;
                case 'ground':
                    this.renderGround(body);
                    break;
                case 'zapzone':
                    this.renderZapZone(body);
                    break;
                default:
                    break;
            }
        });

        bodies.forEach((body) => {
            const label = body.getUserData().label;
            switch (label) {
                case 'ball':
                    this.renderBall(body);
                    break;
                default:
                    break;
            }
        });

        this.particlesHandler.render();

        this.renderStatusLine();
    }

    inputKeyPressed(comboId) {
        if (this.gameOver) return;

        switch (comboId) {
            case 'ArrowLeft':
                this.ballManager.movePlayBall(-1);
                break;
            case 'ArrowRight':
                this.ballManager.movePlayBall(1);
                break;
            case 'ArrowDown':
            case 'Space':
                this.ballManager.dropPlayBall();
                break;
            case 'Escape':
                // Show exit confirmation dialog
                this.showingExitDialog = true;

                this.sceneManager.doDialog('Exit Game', 'Are you sure you want to exit?', ['Yes', 'No'], (result) => {
                    this.showingDialog = false;
                    this.clock.currentTime = performance.now();
                    if (result === 'Yes') {
                        this.exitToMenu = true;
                    }
                });

                break;
            case 'Control+KeyX':
                if (this.configManager.dev) {
                    const randomDirection = Math.random() < 0.5 ? -1 : 1;
                    this.laserbeamHandler.fire(randomDirection);
                }
                break;
            default:
                break;
        }
    }

    gameOverStep3() {
        let vMsg = '';
        if (this.score > this.scoreHighest) {
            vMsg = `New High Score! ${this.score}  (Previous: ${this.scoreHighest}) <br /><br />`;
            this.configManager.setHighestScore('BallsX', this.score);
            this.configManager.saveToLocalStorage();
        } else {
            vMsg = `Your Score: ${this.score}  (High Score to beat: ${this.scoreHighest}) <br /><br />`;
        }

        this.showingDialog = true;
        this.sceneManager.doDialog('Game Over', vMsg + 'Would you like to restart or exit?', ['Restart', 'Exit'], (result) => {
            this.showingDialog = false;
            if (result === 'Exit') {
                this.exitToMenu = true;
            } else if (result === 'Restart') {
                this.restartGame = true;
            }
        });
    }

    gameOverStep2() {
        this.ballManager.gameOver_BonusBalls();

        const waitForBallsToClear = () => {
            let ballBodies = this.ballManager.getBallBodies();
            if (ballBodies.length === 0) {
                setTimeout(() => {
                    this.gameOverStep3();
                }, 1000);
            } else {
                setTimeout(waitForBallsToClear, 200);
            }
        };
        waitForBallsToClear();
    }

    gameOverStep1() {
        if (this.gameOver) return;
        this.gameOver = true;

        this.laserbeamHandler.fire(1);
        this.audioHandler.stopMusic();
        this.audioHandler.playSFX(`GameOver`);

        this.ballManager.gameOver_DeadBalls();

        let TimerID = setTimeout(() => {
            this.gameOverStep2();
        }, 2000);
    }

    handleZapZone(ball) {
        ball.enterZapZone();

        let TimerID = setTimeout(() => {
            this.audioHandler.playSFX(`Beep`);

            let TimerID2 = setTimeout(() => {
                if (ball.zapBall) {
                    this.gameOverStep1();
                }
            }, 2000);

            ball.setZapZoneTimerId(TimerID2);
        }, 2000);

        ball.setZapZoneTimerId(TimerID);
    }

    enter() {
        this.objectManager.get('AudioHandler').transitionMusic('GameMusic');
        this.ballManager = this.objectManager.register('BallManager', new BallManager(this.objectManager));
        this.gameOver = false;
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

        // Clean up visual effect
        if (this.laserbeamHandler) {
            this.laserbeamHandler.destroy();
            this.laserbeamHandler = null;
            this.objectManager.deregister('LaserbeamHandler');
        }

        if (this.particlesHandler) {
            this.particlesHandler.destroy();
            this.particlesHandler = null;
            this.objectManager.deregister('ParticlesHandler');
        }
    }

    updateFrame() {
        if (this.exitToMenu) {
            return SceneBase.GameScenes.mainmenu;
        }

        if (this.restartGame) {
            return SceneBase.GameScenes.ballsX;
        }

        if (this.showingDialog) {
            return null;
        }

        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        this.updatePhysics(this.clock.deltaTime);
        this.ballManager.updateFrame();

        this.particlesHandler.update(this.clock.deltaTime);

        this.laserbeamHandler.update(this.clock.deltaTime);

        this.renderScene();

        return null; // Stay in this scene
    }
}
