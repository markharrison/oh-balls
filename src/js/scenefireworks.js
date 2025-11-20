import { SceneBase } from './scenebase.js';
import { GameScenes } from './scene.js';

class Particle {
  constructor(x, y, vx, vy, color, size = 2) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.alpha = 1;
    this.gravity = 0.15;
    this.friction = 0.98;
    this.life = 1;
    this.decay = Math.random() * 0.008 + 0.004;
  }

  update() {
    this.vy += this.gravity;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.alpha = this.life;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

class Firework {
  constructor(x, y, targetY, color) {
    this.x = x;
    this.y = y;
    this.targetY = targetY;
    this.color = color;
    this.velocity = 0;
    this.acceleration = 0.4;
    this.exploded = false;
    this.particles = [];
    this.trail = [];
    this.trailLength = 10;
  }

  update() {
    if (!this.exploded) {
      // Add trail particle
      this.trail.push({ x: this.x, y: this.y, alpha: 1 });
      if (this.trail.length > this.trailLength) {
        this.trail.shift();
      }

      // Update trail alpha
      this.trail.forEach((t, i) => {
        t.alpha = (i / this.trailLength) * 0.8;
      });

      // Move rocket upward
      this.velocity += this.acceleration;
      this.y -= this.velocity;

      // Check if reached target height
      if (this.y <= this.targetY) {
        this.explode();
      }
    } else {
      // Update explosion particles
      this.particles = this.particles.filter((p) => {
        p.update();
        return !p.isDead();
      });
    }
  }

  explode() {
    this.exploded = true;
    const particleCount = 100 + Math.random() * 50;

    // Create explosion particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 2 + Math.random() * 5;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      // Random colors or use the firework color
      let color;
      if (Math.random() > 0.3) {
        color = this.color;
      } else {
        const hue = Math.random() * 360;
        color = `hsl(${hue}, 100%, 60%)`;
      }

      const size = 1.5 + Math.random() * 2.5;
      this.particles.push(new Particle(this.x, this.y, vx, vy, color, size));
    }
  }

  draw(ctx) {
    if (!this.exploded) {
      // Draw trail
      this.trail.forEach((t) => {
        ctx.save();
        ctx.globalAlpha = t.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw rocket
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Draw explosion particles
      this.particles.forEach((p) => p.draw(ctx));
    }
  }

  isDead() {
    return this.exploded && this.particles.length === 0;
  }
}

export class SceneFireworks extends SceneBase {
  constructor(sceneManager) {
    super(sceneManager);
    this.fireworks = [];
    this.lastLaunchTime = 0;
    this.launchInterval = 800; // ms between firework launches
    this.menuBack = null;
  }

  enterSub() {
    this.insertControls();
    this.lastLaunchTime = 0;
  }

  insertControls() {
    this.canvasUIHandler.removeAllControls();

    // Set dark background for fireworks
    this.canvasUIHandler.setBackground('#000814');

    this.canvasUIHandler.addText('FIREWORKS DISPLAY', 640, 50, {
      fontSize: 48,
      fontWeight: 'bold',
      align: 'center',
      color: '#ffffff',
    });

    let menuItems = [{ label: 'Back to Menu', callback: () => this.doBack() }];

    let menuOptions = { fontSize: 18, gap: 5, orientation: 'vertical' };
    this.menuBack = this.canvasUIHandler.addMenu(540, 680, menuItems, menuOptions);
  }

  doBack() {
    this.nextScene = GameScenes.mainmenu;
  }

  launchFirework() {
    const x = 100 + Math.random() * 1080; // Random x position
    const y = 720; // Start from bottom
    const targetY = 150 + Math.random() * 250; // Random height
    const hue = Math.random() * 360;
    const color = `hsl(${hue}, 100%, 60%)`;

    this.fireworks.push(new Firework(x, y, targetY, color));
  }

  updateFrame(dt) {
    if (this.nextScene != null) {
      return this.nextScene;
    }

    // Launch new fireworks periodically
    this.lastLaunchTime += dt;
    if (this.lastLaunchTime >= this.launchInterval) {
      this.launchFirework();
      this.lastLaunchTime = 0;
      // Add some randomness to launch interval
      this.launchInterval = 500 + Math.random() * 800;
    }

    // Update all fireworks
    this.fireworks = this.fireworks.filter((f) => {
      f.update();
      return !f.isDead();
    });

    // Render
    this.render();

    // Update UI
    this.canvasInputHandler.update(dt);
    this.canvasUIHandler.update(dt);

    return null;
  }

  render() {
    // Clear canvas with semi-transparent black for trail effect
    this.ctx.fillStyle = 'rgba(0, 8, 20, 0.25)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all fireworks
    this.fireworks.forEach((f) => f.draw(this.ctx));
  }
}
