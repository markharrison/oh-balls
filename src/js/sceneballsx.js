import { SceneBase } from './scenebase.js';
import { GameScenes } from './scene.js';
import { BallManager } from './ball.js';
import { PhysicsEngine, PhysicsBodyFactory, PhysicsUtils, metersToPixels } from './physics.js';
import { LaserbeamHandler } from './laserbeam.js';
import { ParticlesHandler } from './particles.js';

export const wallThickness = 8;
export const fixedTimeStep = 1000 / 60; // ms per physics step (16.666...)

export class SceneBallsX extends SceneBase {
  constructor(objectManager) {
    super(objectManager);

    this.pressedKeys = {};
    this.singleFireKeys = new Set(['Space', 'Escape', 'ArrowDown']);
    this.repeatableKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']);
    this.leftMouseBut = false;

    this.audioHandler = objectManager.getById('AudioHandler');
    this.sceneManager = objectManager.getById('SceneManager');
    this.configManager = objectManager.getById('ConfigManager');
    this.physics = objectManager.register('PhysicsEngine', new PhysicsEngine());

    this.imageHandler = this.objectManager.getById('ImageHandler');
    this.canvasInputHandler = this.objectManager.getById('CanvasInputHandler');
    this.canvasUIHandler = this.objectManager.getById('CanvasUIHandler');
    this.canvasInputHandler.subscribe(this);

    this.physics.create();
    this.physics.setGravity(0, 300);
    this.physics.setTimeScale(1);

    // Set world reference in factory
    PhysicsBodyFactory.setWorld(this.physics.world);

    this.clock = {
      deltaTime: 0,
      currentTime: performance.now(), // Initialize with current time
      lastStatsUpdate: 0,
      cachedDeltaTime: 0,
      cachedFPS: 0,
      stepCount: 0,
      cachedStepCount: 0,
    };

    this.showingDialog = false;
    this.exitToMenu = false;
    this.restartGame = false;
    this.scoreHighest = this.configManager.getHighestScore(`BallsX-${this.configManager.gameSize}`) || 0;
    this.score = 0;
    this.clickedCoord = null;

    this.laserbeamHandler = this.objectManager.register('LaserbeamHandler', new LaserbeamHandler(this.objectManager));
    this.particlesHandler = this.objectManager.register('ParticlesHandler', new ParticlesHandler(this.objectManager));
    this.ballManager = this.objectManager.register('BallManager', new BallManager(this.objectManager));

    this.setupWallBoundaries();
    this.setupGroundBoundaries();
    this.setupZapZone();
    this.setupEventHandlers();

    this._physicsAccumulator = 0;

    this.transitionActive = true;
    this.transitionRadius = 5;
    this.transitionCenterX = this.canvas.width / 2;
    this.transitionCenterY = this.canvas.height / 2;
    this.transitionSpeed = 1000;

    this.dialogState = {
      None: 'none',
      EndGame: 'endgame',
      ExitGame: 'exitgame',
    };

    this.dialogStateValue = this.dialogState.None;
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
      fillStyle: '#000000',
      strokeStyle: '#000000',
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
      lineWidth: 1,
      width: width,
      height: wallThickness,
    };

    // Vertices relative to (0,0)
    const groundVertices = [
      { x: 625, y: 100 },
      { x: -625, y: 100 },
      { x: -625, y: -195 },
      { x: -455, y: -101.5 },
      { x: -390, y: -134 },
      { x: -195, y: -30 },
      { x: -130, y: -62.5 },
      { x: -65, y: -30 },
      { x: 0, y: -62.5 },
      { x: 65, y: -30 },
      { x: 130, y: -62.5 },
      { x: 195, y: -30 },
      { x: 390, y: -134 },
      { x: 455, y: -101.5 },
      { x: 625, y: -195 },
    ];

    let yPos = 0;
    switch (this.configManager.gameSize) {
      case 'Large':
        yPos = 720;
        break;
      case 'Medium':
        yPos = 648;
        break;
      case 'Small':
        yPos = 576;
        break;
      default:
        break;
    }

    const groundPosition = { x: width / 2, y: yPos };

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

    let yPos = 0;
    switch (this.configManager.gameSize) {
      case 'Large':
        yPos = 144;
        break;
      case 'Medium':
        yPos = 72;
        break;
      case 'Small':
        yPos = 0;
        break;
      default:
        break;
    }

    let groundImage = this.imageHandler.getImage('ground');
    if (groundImage != null) {
      this.ctx.drawImage(groundImage, 0, yPos, this.canvas.width, this.canvas.height);
    }

    let dev = false;

    if (dev) {
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
    this.ctx.fillText(`Highest: ${this.scoreHighest}  Score: ${this.score}`, 16, 6);
    this.ctx.restore();
  }

  renderIcons() {
    // render cog icon at bottom-right corner
    const iconSize = 32;
    const startX = this.canvas.width - iconSize - 10;
    // const startY = this.canvas.height - iconSize;
    // const startX = 16;
    const startY = 0;

    // // Debug: draw bounding box to visualize padding
    // this.ctx.save();
    // this.ctx.strokeStyle = 'red';
    // this.ctx.lineWidth = 2;
    // this.ctx.strokeRect(startX, startY, iconSize, iconSize);
    // this.ctx.restore();

    const cogIcon = this.imageHandler.getImage('cog');
    if (cogIcon) {
      this.ctx.drawImage(cogIcon, startX, startY, iconSize, iconSize);
    }
  }

  renderScene() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // CLIP
    if (this.transitionActive) {
      // Diagonal gradient: -45deg, #007bff to #23d5ab
      const grad = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);

      grad.addColorStop(0, '#0a0e27');
      grad.addColorStop(0.5, '#1a1f3a');
      grad.addColorStop(1, '#2d3561');

      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(this.transitionCenterX, this.transitionCenterY, this.transitionRadius, 0, Math.PI * 2);
      this.ctx.clip(); // THIS IS THE CLIPPING MASK!
    }
    // CLIP

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#00008B'); // Dark blue at top
    gradient.addColorStop(1, '#0000FF'); // Blue at bottom
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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

    this.renderIcons();

    if (this.transitionActive) {
      this.ctx.restore();
    }
  }

  inputTouchAction(type, x, y, details = {}) {
    if (this.gameOver) return;

    if (y > 50) {
      this.ballManager.handleTouchAction(type, x, y, details);
    } else {
      if (x > this.canvas.width - 42 && y < 42) {
        if (type === 'touchstart') {
          this.dialogStateValue = this.dialogState.ExitGame;
        }
      }
    }
  }

  inputMouseAction(type, x, y, leftMouseBut) {
    if (this.gameOver) return;

    this.canvas.style.cursor = 'default';

    if (y > 50) {
      if (type === 'mousemove' && leftMouseBut) {
        this.ballManager.handleTouchAction('touchmove', x, y);
      }
      if (type === 'click') {
        this.ballManager.handleTouchAction('touchend', x, y);
      }
    } else {
      if (x > this.canvas.width - 42 && y < 42) {
        if (type === 'mousemove') {
          this.canvas.style.cursor = 'pointer';
        } else if ((type = 'click')) {
          this.dialogStateValue = this.dialogState.ExitGame;
        }
      }
    }
  }

  inputKeyPressed(comboId) {
    if (this.gameOver) return;

    switch (comboId) {
      case 'ArrowLeft':
      case 'KeyA':
        this.ballManager.movePlayBall(-1);
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.ballManager.movePlayBall(1);
        break;
      case 'Left-Bumper':
      case 'Left-Dpad':
        this.ballManager.positionPlayBall(0);
        break;
      case 'Right-Bumper':
      case 'Right-Dpad':
        this.ballManager.positionPlayBall(this.canvas.width);
        break;
      case 'Up-Dpad':
        this.ballManager.positionPlayBall(this.canvas.width / 2);
        break;
      case 'ArrowDown':
      case 'Space':
      case 'Down-Dpad':
      case 'ButtonA':
        this.ballManager.dropPlayBall();
        break;
      case 'Escape':
      case 'ButtonB':
        this.dialogStateValue = this.dialogState.ExitGame;
        break;
      default:
        break;
    }
  }

  processInputLoop() {
    this.canvasInputHandler.update();

    this.repeatableKeys.forEach((key) => {
      if (this.pressedKeys[key]) {
        this.inputKeyPressed(key);
      }
    });
  }

  // resetPressedKeys() {
  //   this.pressedKeys = {};
  //   this.pressedKeys['Escape'] = true;
  //   setTimeout(() => {
  //     this.pressedKeys['Escape'] = false;
  //   }, 2000);
  // }

  onKeyDown(e) {
    if (this.singleFireKeys.has(e.code)) {
      if (this.pressedKeys[e.code]) {
        return;
      }
      this.pressedKeys[e.code] = true;
      this.inputKeyPressed(e.code);
    } else if (this.repeatableKeys.has(e.code)) {
      // Always process repeatable keys
      this.pressedKeys[e.code] = true;
      this.inputKeyPressed(e.code);
    }
  }

  onKeyUp(e) {
    this.pressedKeys[e.code] = false;
  }

  onMouseMove(x, y) {
    this.inputMouseAction('mousemove', x, y, this.leftMouseBut);
  }

  onMouseDown(x, y, button) {
    if (button === 0) this.leftMouseBut = true;
  }

  onMouseUp(x, y, button) {
    if (button === 0) this.leftMouseBut = false;
  }

  onMouseEnter(x, y) {
    this.leftMouseBut = false;
  }

  onMouseClick(x, y, button) {
    this.inputMouseAction('click', x, y, button === 0);
  }

  onTouchStart(x, y) {
    this.inputTouchAction('touchstart', x, y);
  }

  onTouchMove(x, y) {
    this.inputTouchAction('touchmove', x, y);
  }

  onTouchEnd(x, y) {
    this.inputTouchAction('touchend', x, y);
  }

  onGamepadButton(buttonIndex) {
    switch (buttonIndex) {
      case 0:
        this.inputKeyPressed('ButtonA');
        break;
      case 1:
        this.inputKeyPressed('ButtonB');
        break;
      case 4:
        this.inputKeyPressed('Left-Bumper');
        break;
      case 5:
        this.inputKeyPressed('Right-Bumper');
        break;
      case 12:
        this.inputKeyPressed('Up-Dpad');
        break;
      case 13:
        this.inputKeyPressed('Down-Dpad');
        break;
      case 14:
        this.inputKeyPressed('Left-Dpad');
        break;
      case 15:
        this.inputKeyPressed('Right-Dpad');
        break;

      default:
        break;
    }
  }

  onGamepadAxis(axisData) {
    // Handle gamepad axis event
    const { leftStick, rightStick, deadZone } = axisData;

    // Handle left stick movement
    if (leftStick) {
      const { x: leftX, y: leftY } = leftStick;

      // Handle horizontal movement (left/right)
      if (Math.abs(leftX) > deadZone) {
        if (leftX < -deadZone) {
          this.pressedKeys['ArrowLeft'] = true;
        } else if (leftX > deadZone) {
          this.pressedKeys['ArrowRight'] = true;
        }
      } else {
        this.pressedKeys['ArrowLeft'] = false;
        this.pressedKeys['ArrowRight'] = false;
      }
    }
  }

  gameOverStep2() {
    this.ballManager.gameOver_BonusBalls();

    const waitForBallsToClear = () => {
      let ballBodies = this.ballManager.getBallBodies();
      if (ballBodies.length === 0) {
        setTimeout(() => {
          this.dialogStateValue = this.dialogState.EndGame;
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

  handleZapZone2(ball) {
    if (!this.showingDialog) {
      setTimeout(() => {
        if (ball.zapBall) {
          this.gameOverStep1();
        }
      }, 2000);

      return;
    }

    setTimeout(() => this.handleZapZone2(ball), 2000);
  }

  handleZapZone(ball) {
    ball.enterZapZone();

    let TimerID = setTimeout(() => {
      this.audioHandler.playSFX(`Beep`);

      let TimerID2 = setTimeout(() => {
        if (ball.zapBall && !this.showingDialog) {
          this.gameOverStep1();
        } else {
          this.handleZapZone2(ball);
        }
      }, 2000);

      ball.setZapZoneTimerId(TimerID2);
    }, 2000);

    ball.setZapZoneTimerId(TimerID);
  }

  enter() {
    this.objectManager.getById('AudioHandler').transitionMusic('GameMusic');

    this.gameOver = false;

    this.canvasUIHandler.removeAllControls();
    this.canvasUIHandler.setBackgroundNone();
    this.ballManager.start();
  }

  exit() {
    this.objectManager.getById('AudioHandler').transitionMusic('MenuMusic');

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#111111';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.ballManager) {
      this.ballManager.destroy();
      this.objectManager.deregister(this.ballManager);
      this.ballManager = null;
    }

    if (this.physics) {
      this.physics.destroy();
      this.objectManager.deregister(this.physics);
      this.physics = null;
    }

    if (this.laserbeamHandler) {
      this.laserbeamHandler.destroy();
      this.objectManager.deregister(this.laserbeamHandler);
      this.laserbeamHandler = null;
    }

    if (this.particlesHandler) {
      this.particlesHandler.destroy();
      this.objectManager.deregister(this.particlesHandler);
      this.particlesHandler = null;
    }

    this.canvasInputHandler.unsubscribe(this);
  }

  doExitGameDialog() {
    this.showingDialog = true;

    this.canvasInputHandler.unsubscribe(this);

    this.canvasUIHandler.showModal(
      'Exit Game',
      'Are you sure you want to exit?',
      [
        {
          label: 'Yes',
          callback: () => {
            this.exitToMenu = true;
          },
        },
        {
          label: 'No',
          callback: () => {
            this.showingDialog = false;
            this.clock.currentTime = performance.now();
            //            this.resetPressedKeys();
            this.pressedKeys = {};
            setTimeout(() => {
              this.canvasInputHandler.subscribe(this);
            }, 1000);
          },
        },
      ],
      {
        escapeButtonLabel: 'No',
      }
    );
  }

  doEndGameDialog() {
    let vMsg = '';
    if (this.score > this.scoreHighest) {
      vMsg = `New High Score! ${this.score}  (Previous: ${this.scoreHighest}) \n\n`;
      this.configManager.setHighestScore(`BallsX-${this.configManager.gameSize}`, this.score);
      this.configManager.saveToLocalStorage();
    } else {
      vMsg = `Your Score: ${this.score}  (High Score to beat: ${this.scoreHighest}) \n\n`;
    }

    this.showingDialog = true;

    this.canvasUIHandler.showModal('Game Over', vMsg + 'Would you like to restart or exit?', [
      {
        label: 'Restart',
        callback: () => {
          this.restartGame = true;
        },
      },
      {
        label: 'Exit',
        callback: () => {
          this.exitToMenu = true;
        },
      },
    ]);
  }

  updateFrame() {
    if (this.exitToMenu) {
      return GameScenes.mainmenu;
    }

    if (this.restartGame) {
      return GameScenes.ballsX;
    }

    if (this.dialogStateValue === this.dialogState.ExitGame) {
      this.dialogStateValue = this.dialogState.None;
      this.doExitGameDialog();
    }
    if (this.dialogStateValue === this.dialogState.EndGame) {
      this.dialogStateValue = this.dialogState.None;
      this.doEndGameDialog();
    }

    this.processInputLoop();

    if (!this.showingDialog) {
      const currentTime = performance.now();
      const lastTime = this.clock.currentTime;
      this.clock.currentTime = currentTime;
      this.clock.deltaTime = this.clock.currentTime - lastTime;

      if (this.transitionActive) {
        this.transitionRadius += this.transitionSpeed * (this.clock.deltaTime / 1000);

        // Calculate diagonal to cover entire canvas
        const maxRadius = Math.sqrt(Math.pow(this.canvas.width / 2, 2) + Math.pow(this.canvas.height / 2, 2));

        if (this.transitionRadius >= maxRadius) {
          this.transitionActive = false;
        }
      }

      this.updatePhysics(this.clock.deltaTime);
      this.ballManager.updateFrame();

      this.particlesHandler.update(this.clock.deltaTime);

      this.laserbeamHandler.update(this.clock.deltaTime);
    }

    this.renderScene();

    this.canvasUIHandler.update(this.clock.deltaTime);

    return null; // Stay in this scene
  }
}
