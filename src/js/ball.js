import { PhysicsBodyFactory, pixelsToMeters } from './physics.js';
import { wallThickness } from './sceneballsx.js';

export class Ball {
  constructor(objectManager, x, y, size, playBall = false) {
    this.objectManager = objectManager;
    this.sceneManager = objectManager.getById('SceneManager');
    this.sceneBallsX = objectManager.getById('SceneBallsX');

    this.playBall = playBall;
    this.deadBall = false;
    this.combiningBall = false;
    this.zapBall = false;
    this.zapZoneTimerId = null;
    this.size = size;
    this.radius = this.calculateRadius(this.size);
    let color = this.getColorForSize(this.size);

    const render = {
      radius: this.radius,
      fillStyle: color,
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

    let userData = this.physicsBody.body.getUserData();
    let radius = userData.render.radius;
    let fillStyle = userData.render.fillStyle;

    const meterRadius = pixelsToMeters(radius);
    const density = 1.0;
    let mass = meterRadius * meterRadius * Math.PI * density;

    vHtml += this.physicsBody.id + ':&nbsp;';
    vHtml += '<svg width="12" height="12" style="vertical-align:middle;"><circle cx="6" cy="6" r="6" fill="' + fillStyle + '"/></svg>&nbsp;';

    vHtml += 'Size:' + this.size + '&nbsp;';
    vHtml += 'Mass:' + mass.toFixed(2) + '&nbsp;';
    vHtml += 'Speed:' + this.physicsBody.speed.toFixed(3) + '&nbsp;';
    const pos = this.physicsBody.getPosition();
    vHtml += 'Pos:' + pos.x.toFixed(0) + ',' + pos.y.toFixed(0) + '&nbsp;';
    const vel = this.physicsBody.getVelocity();
    vHtml += 'Vel:' + vel.x.toFixed(3) + ',' + vel.y.toFixed(3) + '&nbsp;';
    vHtml += 'Ang Vel:' + this.physicsBody.getAngularVelocity().toFixed(3) + '&nbsp;';
    vHtml += this.physicsBody.isSleeping() ? 'S' : '';
    vHtml += this.playBall ? 'P' : '';
    vHtml += this.zapBall ? 'Z' : '';
    vHtml += this.deadBall ? 'D' : '';

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

  setStatic(isStatic) {
    this.physicsBody.setStatic(isStatic);
  }

  leaveZapZone() {
    this.playBall = false;
    this.zapBall = false;
    this.cancelZapZoneTimerId();
  }

  enterZapZone() {
    this.zapBall = true;
  }

  setZapZoneTimerId(timerId) {
    this.zapZoneTimerId = timerId;
  }

  cancelZapZoneTimerId() {
    if (this.zapZoneTimerId) {
      clearTimeout(this.zapZoneTimerId);
      this.zapZoneTimerId = null;
    }
  }

  release() {
    if (!this.physicsBody) {
      alert('Error: Ball physics body is null in release()');
      this.destroy();
      return;
    }
    this.physicsBody.setStatic(false);
    this.physicsBody.setAngularVelocity(0);
    this.physicsBody.setVelocity(0, 0);

    this.playBall = false;
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
    this.combiningBall = false;
  }
}

export class BallManager {
  constructor(objectManager) {
    this.objectManager = objectManager;
    this.sceneManager = objectManager.getById('SceneManager');
    this.audioHandler = objectManager.getById('AudioHandler');
    this.particlesHandler = objectManager.getById('ParticlesHandler');
    this.physics = null;
    this.sceneBallsX = null;

    this.canvasHeight = this.sceneManager.canvas.height;
    this.canvasWidth = this.sceneManager.canvas.width;

    this.gaameOver = false;
    this.playBall = null;
    this.lastCleanupTime = 0;
    this.lastDropTime = 0;
    this.lastPlayBallPosition = this.canvasWidth / 2;
    this.combineQueue = [];
  }

  getBallBodies() {
    return this.physics.getBodiesByLabel('ball') || [];
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

  ballInZapZone() {
    let ballBodies = this.getBallBodies();
    for (const ballBody of ballBodies) {
      const ball = ballBody.getUserData()?.ball;
      if (ball && ball.zapBall) {
        return true;
      }
    }
    return false;
  }

  spawnPlayBall() {
    if (this.playBall !== null) return;

    if (this.gameOver) return;

    if (performance.now() - this.lastDropTime < 1000) return;

    if (this.ballInZapZone()) return;

    const x = 512;
    const y = -100;

    this.playBall = new Ball(this.objectManager, x, y, Math.floor(Math.random() * 5) + 1, true);

    let newX = this.keepXWithinBounds(this.lastPlayBallPosition, this.playBall);

    this.playBall.setPosition(newX, 102);
  }

  dropPlayBall() {
    if (this.playBall === null) {
      return;
    }

    this.playBall.release();
    this.lastDropTime = performance.now();

    this.playBall = null;
  }

  relocatePlayBall(newX, newY) {
    newX = this.keepXWithinBounds(newX, this.playBall);

    this.playBall.setPosition(newX, newY);
    this.lastPlayBallPosition = newX;
  }

  positionPlayBall(newX) {
    if (this.playBall === null) {
      return;
    }
    const currentPos = this.playBall.getPosition();

    this.relocatePlayBall(newX, currentPos.y);
  }

  movePlayBall(direction) {
    if (this.playBall === null) {
      return;
    }

    const currentPos = this.playBall.getPosition();
    const moveDistance = 5; // Distance to move per frame
    let newX = currentPos.x + direction * moveDistance;

    this.relocatePlayBall(newX, currentPos.y);
  }

  handleTouchAction(type, x, y) {
    if (this.playBall === null) {
      return;
    }

    let currentPos = this.playBall.getPosition();
    let newX = this.keepXWithinBounds(x, this.playBall);
    this.playBall.setPosition(newX, currentPos.y);
    this.lastPlayBallPosition = newX;

    this.sceneManager.canvas.style.cursor = 'move';

    if (type === 'touchend') {
      this.dropPlayBall();

      this.sceneManager.canvas.style.cursor = 'default';
    }
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
    ballA.cancelZapZoneTimerId();
    ballB.cancelZapZoneTimerId();

    this.sceneBallsX.score += ballA.size * ballA.size * 2;

    const newSize = ballA.size < 15 ? ballA.size + 1 : 15;

    const posA = ballA.getPosition();
    const posB = ballB.getPosition();
    const newX = (posA.x + posB.x) / 2;
    const newY = (posA.y + posB.y) / 2;

    const velA = ballA.physicsBody.getVelocity();
    const velB = ballB.physicsBody.getVelocity();
    const newVelX = (velA.x + velB.x) / 2;
    const newVelY = (velA.y + velB.y) / 2;

    const newBall = new Ball(this.objectManager, newX, newY, newSize, false);

    const newColor = ballA.getColorForSize(newSize);

    newBall.physicsBody.setVelocity(newVelX, newVelY);
    newBall.physicsBody.setStatic(false);

    this.particlesHandler.combineEffect([newX, newY], newColor);

    let rnd = Math.floor(Math.random() * 6) + 1;
    this.audioHandler.playSFX(`Combine${rnd}`);

    ballA.destroy();
    ballB.destroy();
    ballA = null;
    ballB = null;
  }

  combineBalls(ballA, ballB) {
    if (ballA.combiningBall || ballB.combiningBall) {
      return false;
    }

    if (ballA.playBall || ballB.playBall) {
      return false;
    }

    ballA.combiningBall = true;
    ballB.combiningBall = true;

    this.queueCombine(ballA, ballB);
  }

  gameOver_BonusBalls() {
    let ballBodies = this.getBallBodies();

    let vHTML = 'Bonus Balls: ';
    let timer = 0;
    ballBodies.forEach((ballBody) => {
      let ball = ballBody.getUserData()?.ball;

      if (!ball.playBall && !ball.deadBall) {
        timer += 500;
        vHTML += ball.physicsBody.id + ' ';
        vHTML += '; ';

        setTimeout(() => {
          this.sceneBallsX.score += ball.size * ball.size;
          let rnd = Math.floor(Math.random() * 6) + 1;
          this.audioHandler.playSFX(`Combine${rnd}`);

          let coord = ball.getPosition();
          const color = ball.getColorForSize(ball.size);
          this.particlesHandler.combineEffect([coord.x, coord.y], color);
          ball.destroy();
          ball = null;
        }, timer);
      }
    });
  }

  gameOver_DeadBalls() {
    if (this.gameOver) return;

    this.gameOver = true;

    let ballBodies = this.getBallBodies();

    let vHTML = 'Ball Left: ';

    ballBodies.forEach((ballBody) => {
      let ball = ballBody.getUserData()?.ball;
      let timer = 500;
      vHTML += ball.physicsBody.id + ' ';

      if (ball.playBall) {
        ball.cancelZapZoneTimerId();
        ball.destroy();
        ball = null;
        vHTML += 'PlayBall ';
      } else if (ball.zapBall) {
        ball.deadBall = true;
        ball.physicsBody.fillStyle = '#000000';
        vHTML += 'Dead ';
        ball.cancelZapZoneTimerId();

        timer += 250;

        setTimeout(() => {
          let coord = ball.getPosition();
          this.particlesHandler.combineEffect([coord.x, coord.y], '#FFFFFF');

          ball.destroy();
          ball = null;
        }, timer);
      }

      vHTML += '; ';

      if (ball) ball.setStatic(true);
    });
  }

  updateFrame() {
    this.spawnPlayBall();
    this.updateBallStates();
    this.processCombineQueue();
  }

  updateBallStates() {
    let ballBodies = this.getBallBodies();

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
        const isOffScreen = pos.y > this.canvasHeight + 100;

        if (isOffScreen) {
          ball.destroy();
        }
      }
    });
  }

  start() {
    this.physics = this.objectManager.getById('PhysicsEngine');
    this.sceneBallsX = this.objectManager.getById('SceneBallsX');
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
