import { SceneBase } from './scenebase.js';
import { BallManager } from './ball.js';
import { PhysicsEngine, PhysicsBodyFactory, PhysicsUtils, metersToPixels } from './physics.js';
import { LaserbeamMark } from '../lib/laserbeammark.js';
// import { wallThickness } from './constants.js';
// import { fixedTimeStep } from './constants.js';

export const wallThickness = 16;
export const fixedTimeStep = 1000 / 60; // ms per physics step (16.666...)

export class SceneBallsX extends SceneBase {
    constructor(objectManager) {
        super(objectManager);
        this.audioHandler = objectManager.get('AudioHandler');
        this.sceneManager = objectManager.get('SceneManager');
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

        this.showingDialog = false;
        this.exitToMenu = false;
        this.restartGame = false;
        this.gameOver = false;

        this.setupBoundaries();
        this.setupZapZone();
        this.setupEventHandlers();

        this._physicsAccumulator = 0;

        this.zapStart = [wallThickness, 150];
        this.zapEnd = [this.canvas.width - wallThickness, 150];

        this.laserBeam = new LaserbeamMark(this.canvas, {
            beamStyle: 'solid',
            coords1: this.zapStart,
            coords2: this.zapEnd,
        });
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

                // Danger Zone overlap detection
                if ((ballALabel === 'ball' && ballBLabel === 'zapzone') || (ballALabel === 'zapzone' && ballBLabel === 'ball')) {
                    // Ball entered Danger Zone
                    const ballBody = ballALabel === 'ball' ? bodyA : bodyB;
                    const ball = ballBody.getUserData()?.ball;

                    if (!ball.playBall) {
                        this.handleZapZone(ball);

                        // ball.enterZapZone();

                        // let TimerID = setTimeout(() => {
                        //     this.audioHandler.playSFX(`Beep`);

                        //     let TimerID2 = setTimeout(() => {
                        //         if (ball.isOnZapZone()) {
                        //             this.laserBeam.fire(1);
                        //             this.audioHandler.playSFX(`GameOver`);
                        //             this.audioHandler.stopMusic();
                        //             let TimerID3 = setTimeout(() => {
                        //                 this.handleGameOver();
                        //             }, 4000);
                        //             ball.setZapZoneTimerId(TimerID3);
                        //         }
                        //     }, 2000);
                        //     ball.setZapZoneTimerId(TimerID2);
                        // }, 2000);

                        // ball.setZapZoneTimerId(TimerID);
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
        const zapZoneHeight = 200; // px
        const zapZoneY = 300; // px (same as zapStart/zapEnd)
        const zapZoneRender = {
            fillStyle: 'rgba(255,0,0,0.2)',
            strokeStyle: '#ff0000',
            lineWidth: 2,
            width: this.canvas.width - 2 * wallThickness,
            height: zapZoneHeight,
        };
        const zapZoneBody = PhysicsBodyFactory.createRectangle(
            this.canvas.width / 2,
            zapZoneY,
            this.canvas.width - 2 * wallThickness,
            zapZoneHeight,
            {
                isStatic: true,
                userData: {
                    label: 'zapzone',
                    render: zapZoneRender,
                },
                isSensor: true,
            }
        );

        const fixture = zapZoneBody.body.getFixtureList();
        if (fixture) fixture.setSensor(true);
        this.zapZoneBody = zapZoneBody;
        this.physics.addBody(zapZoneBody);
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

    renderZapZone(body) {
        const ctx = this.ctx;

        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 6]); // Dotted line: 2px dash, 6px gap

        ctx.beginPath();
        ctx.moveTo(this.zapStart[0], this.zapStart[1]);
        ctx.lineTo(this.zapEnd[0], this.zapEnd[1]);
        ctx.stroke();

        ctx.setLineDash([]); // Reset to solid for future drawing
        ctx.restore();

        this.renderRectBody(body);
    }

    renderWallOrFloor(body) {
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

        this.laserBeam.render();

        const bodies = this.physics.getAllBodies();

        bodies.forEach((body) => {
            const label = body.getUserData().label;
            switch (label) {
                case 'leftwall':
                case 'rightwall':
                case 'ground':
                    this.renderWallOrFloor(body);
                    break;
                case 'zapzone':
                    this.renderZapZone(body);
                    break;
                default:
                    this.renderBall(body);
                    break;
            }
        });
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
            case 'KeyL':
                const randomDirection = Math.random() < 0.5 ? -1 : 1;
                this.laserBeam.fire(randomDirection);
                break;
            default:
                break;
        }
    }

    gameOverStep2() {
        this.ballManager.gameOverStep2();

        this.showingDialog = true;
        this.gameOver = true;
        this.sceneManager.doDialog('Game Over', 'Would you like to restart or exit?', ['Restart', 'Exit'], (result) => {
            this.showingDialog = false;
            if (result === 'Exit') {
                this.exitToMenu = true;
            } else if (result === 'Restart') {
                this.restartGame = true;
            }
        });
    }

    gameOverStep1() {
        this.laserBeam.fire(1);
        this.audioHandler.playSFX(`GameOver`);
        this.audioHandler.stopMusic();
        this.ballManager.gameOverStep1();

        let TimerID3 = setTimeout(() => {
            this.gameOverStep2();
        }, 4000);
    }

    handleZapZone(ball) {
        ball.enterZapZone();

        let TimerID = setTimeout(() => {
            this.audioHandler.playSFX(`Beep`);

            let TimerID2 = setTimeout(() => {
                if (ball.isOnZapZone()) {
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
        if (this.visualEffect) {
            this.visualEffect.destroy();
            this.visualEffect = null;
        }
    }

    updateFrame() {
        if (this.exitToMenu) {
            return SceneBase.GameScenes.mainmenu;
        }

        if (this.restartGame) {
            return SceneBase.GameScenes.ballsX;
        }

        if (this.showingDialog || this.gameOver) {
            return null;
        }

        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        this.updatePhysics(this.clock.deltaTime);
        this.ballManager.updateFrame();

        this.laserBeam.update(this.clock.deltaTime);

        this.renderScene();

        return null; // Stay in this scene
    }
}
