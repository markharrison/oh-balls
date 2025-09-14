export class ParticlesMark {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.effects = [];
  }

  update(deltaTime) {
    const now = performance.now();
    for (let i = this.effects.length - 1; i >= 0; i--) {
      let effect = this.effects[i];
      if (effect.particles.length === 0) {
        this.effects.splice(i, 1);
        continue;
      }
      for (let ii = effect.particles.length - 1; ii >= 0; ii--) {
        let particle = effect.particles[ii];

        // Delegate movement/behaviour to the effect if it provides an updateParticle method.
        // The method may return false to indicate the particle should be removed immediately.
        if (typeof effect.updateParticle === "function") {
          const keep = effect.updateParticle(particle, deltaTime, now);
          if (keep === false) {
            effect.particles.splice(ii, 1);
            continue;
          }
        } else {
          // Backwards-compatible fallback physics
          if (particle.gravity < 0 && !particle.exploded) {
            particle.yv += particle.gravity;
            if (particle.y < particle.peakY) {
              particle.exploded = true;
              particle.xv = (Math.random() - 0.5) * 4;
              particle.yv = Math.random() * 2 + 1;
            }
          } else {
            particle.yv += particle.gravity;
          }

          particle.xv *= particle.friction;
          particle.yv *= particle.friction;

          particle.x += particle.xv;
          particle.y += particle.yv;
        }

        const age = now - particle.created;
        if (age >= particle.ttl) {
          effect.particles.splice(ii, 1);
          continue;
        }
      }
      if (effect.particles.length === 0) {
        this.effects.splice(i, 1);
      }
    }
  }

  render() {
    this.drawEffects();
  }

  drawEffects() {
    const now = performance.now();
    for (let i = this.effects.length - 1; i >= 0; i--) {
      let effect = this.effects[i];
      for (let ii = effect.particles.length - 1; ii >= 0; ii--) {
        let particle = effect.particles[ii];

        const age = now - particle.created;
        const alpha = 1 - age / particle.ttl;
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        const color = `rgb(${particle.r}, ${particle.g}, ${particle.b})`;
        this.ctx.fillStyle = color;
        // Support multiple shapes for confetti particles
        const size = Math.max(particle.size, 0.5);
        const x = particle.x;
        const y = particle.y;
        const shape = particle.shape || "circle";
        // Add a subtle glow when enabled via effect options or passed-in options
        // Priority: per-effect option (effect.options.glow) -> effect.options.glow (constructor) -> true by default
        const effectGlowStrength =
          effect &&
          effect.options &&
          typeof effect.options.glowStrength !== "undefined"
            ? Number(effect.options.glowStrength)
            : 0;

        if (effectGlowStrength > 0) {
          this.ctx.shadowColor = color;
          this.ctx.shadowBlur = Math.max(
            0,
            Math.round(size * effectGlowStrength)
          );
          this.ctx.shadowOffsetX = 0;
          this.ctx.shadowOffsetY = 0;
        } else {
          // disable shadow when strength is 0
          this.ctx.shadowBlur = 0;
        }
        if (shape === "circle") {
          this.ctx.beginPath();
          this.ctx.arc(x, y, size, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (shape === "square") {
          this.ctx.translate(x, y);
          this.ctx.rotate(particle.angle || 0);
          this.ctx.fillRect(-size, -size, size * 2, size * 2);
        } else if (shape === "rect" || shape === "ribbon") {
          // thin rectangle (ribbon)
          const w = size * (shape === "ribbon" ? 3 : 2);
          const h = size;
          this.ctx.translate(x, y);
          this.ctx.rotate(particle.angle || 0);
          this.ctx.fillRect(-w / 2, -h / 2, w, h);
        } else if (shape === "star") {
          // simple 5-pointed star
          const spikes = 5;
          const outer = size * 1.6;
          const inner = size * 0.6;
          let rot = (Math.PI / 2) * 3;
          let cx = x;
          let cy = y;
          this.ctx.beginPath();
          this.ctx.moveTo(cx, cy - outer);
          for (let s = 0; s < spikes; s++) {
            const ox = cx + Math.cos(rot) * outer;
            const oy = cy + Math.sin(rot) * outer;
            this.ctx.lineTo(ox, oy);
            rot += Math.PI / spikes;
            const ix = cx + Math.cos(rot) * inner;
            const iy = cy + Math.sin(rot) * inner;
            this.ctx.lineTo(ix, iy);
            rot += Math.PI / spikes;
          }
          this.ctx.closePath();
          this.ctx.fill();
        } else {
          // fallback circle
          this.ctx.beginPath();
          this.ctx.arc(x, y, size, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();
      }
    }
  }

  addEffect(type, coords, options = {}) {
    const [x, y] = coords;
    let effect;
    switch (type) {
      case "explosion":
        effect = new ParticlesMark.Explosion(x, y, options);
        break;
      case "confetti":
        effect = new ParticlesMark.Confetti(x, y, options);
        break;
      case "fireworks":
        effect = new ParticlesMark.Fireworks(x, y, options);
        break;
      default:
        throw new Error(`Unknown effect type: ${type}`);
    }
    this.effects.push(effect);
  }

  destroy() {
    this.effects = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  static Explosion = class {
    constructor(x, y, options) {
      this.type = "explosion";
      this.particles = [];
      this.particlesPerExplosion = options.particlesPerExplosion ?? 30;
      this.particlesMinSpeed = options.particlesMinSpeed ?? 3;
      this.particlesMaxSpeed = options.particlesMaxSpeed ?? 6;
      this.particlesMinSize = options.particlesMinSize ?? 1;
      this.particlesMaxSize = options.particlesMaxSize ?? 6;
      this.options = Object.assign(
        {
          jitter: 1,
          frictionMin: 0.96,
          frictionMax: 0.995,
          gravity: 0.02,
          lifetimeMinMs: 600,
          lifetimeMaxMs: 1400,
          rMin: 113,
          rMax: 222,
          gMin: 0,
          gMax: 100,
          bMin: 105,
          bMax: 255,
        },
        options
      );
      for (let i = 0; i < this.particlesPerExplosion; i++) {
        this.particles.push(
          new ParticlesMark.Particle(
            x,
            y,
            this.particlesMinSpeed,
            this.particlesMaxSpeed,
            this.particlesMinSize,
            this.particlesMaxSize,
            this.options
          )
        );
      }
      // Movement logic for explosion particles: simple friction + gravity
      this.updateParticle = function (particle, deltaTime, now) {
        particle.yv += particle.gravity;
        particle.xv *= particle.friction;
        particle.yv *= particle.friction;
        particle.x += particle.xv;
        particle.y += particle.yv;
        return true;
      };
    }
  };
  static Confetti = class {
    constructor(x, y, options) {
      this.type = "confetti";
      this.particles = [];
      this.particlesPerExplosion = options.particlesPerExplosion ?? 50;
      this.particlesMinSpeed = options.particlesMinSpeed ?? 1;
      this.particlesMaxSpeed = options.particlesMaxSpeed ?? 4;
      this.particlesMinSize = options.particlesMinSize ?? 2;
      this.particlesMaxSize = options.particlesMaxSize ?? 8;
      this.options = Object.assign(
        {
          jitter: 1,
          frictionMin: 0.98,
          frictionMax: 0.999,
          gravity: 0.01,
          lifetimeMinMs: 2000,
          lifetimeMaxMs: 4000,
          rMin: 200,
          rMax: 255,
          gMin: 100,
          gMax: 255,
          bMin: 50,
          bMax: 200,
        },
        options
      );
      for (let i = 0; i < this.particlesPerExplosion; i++) {
        const p = new ParticlesMark.Particle(
          x,
          y,
          this.particlesMinSpeed,
          this.particlesMaxSpeed,
          this.particlesMinSize,
          this.particlesMaxSize,
          this.options
        );
        // assign random confetti shape and rotation
        const shapes = ["square", "circle", "ribbon", "star"];
        p.shape = shapes[Math.floor(Math.random() * shapes.length)];
        p.angle = Math.random() * Math.PI * 2;
        p.angularVelocity = (Math.random() - 0.5) * 0.2;
        // per-particle sway amplitude and independent frequency/phase so pieces don't move in lockstep
        p.sway = 0.5 + Math.random() * 1.5;
        p.swayFreq = 0.6 + Math.random() * 1.6; // Hz-ish
        p.swayPhase = Math.random() * Math.PI * 2;
        this.particles.push(p);
      }
      // Confetti movement: more drag, slight horizontal sway
      this.updateParticle = function (particle, deltaTime, now) {
        // stronger horizontal sway with per-particle amplitude, frequency and phase
        const t = now * 0.001; // convert ms -> seconds for frequency
        // small, per-particle sway; scale by deltaTime so it's frame-rate friendly
        const dtFactor = Math.max(0.5, Math.min(2, deltaTime / 16));
        const swayBase = 0.02; // small base amplitude
        particle.xv +=
          Math.sin(t * (particle.swayFreq || 1) + (particle.swayPhase || 0)) *
          swayBase *
          (particle.sway || 1) *
          dtFactor;
        particle.angle =
          (particle.angle || 0) + (particle.angularVelocity || 0);
        particle.yv += particle.gravity;
        particle.xv *= particle.friction;
        particle.yv *= particle.friction;
        particle.x += particle.xv;
        particle.y += particle.yv;
        return true;
      };
    }
  };

  static Fireworks = class {
    constructor(x, y, options) {
      this.type = "fireworks";
      this.particles = [];
      this.particlesPerExplosion = options.particlesPerExplosion ?? 20;
      this.particlesMinSpeed = options.particlesMinSpeed ?? 5;
      this.particlesMaxSpeed = options.particlesMaxSpeed ?? 10;
      this.particlesMinSize = options.particlesMinSize ?? 2;
      this.particlesMaxSize = options.particlesMaxSize ?? 4;
      this.options = Object.assign(
        {
          jitter: 0.5,
          frictionMin: 0.99,
          frictionMax: 0.999,
          gravity: -0.05,
          lifetimeMinMs: 1000,
          lifetimeMaxMs: 2000,
          rMin: 255,
          rMax: 255,
          gMin: 200,
          gMax: 255,
          bMin: 0,
          bMax: 100,
        },
        options
      );
      for (let i = 0; i < this.particlesPerExplosion; i++) {
        this.particles.push(
          new ParticlesMark.Particle(
            x,
            y,
            this.particlesMinSpeed,
            this.particlesMaxSpeed,
            this.particlesMinSize,
            this.particlesMaxSize,
            this.options
          )
        );
      }
      // Fireworks movement: initial upward particles (negative gravity) that explode at peak
      this.updateParticle = function (particle, deltaTime, now) {
        if (particle.gravity < 0 && !particle.exploded) {
          particle.yv += particle.gravity;
          if (particle.y < particle.peakY) {
            particle.exploded = true;
            // give this particle a new outward burst velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            particle.xv = Math.cos(angle) * speed;
            particle.yv = Math.sin(angle) * speed;
          }
        } else {
          particle.yv += particle.gravity;
        }

        particle.xv *= particle.friction;
        particle.yv *= particle.friction;

        particle.x += particle.xv;
        particle.y += particle.yv;
        return true;
      };
    }
  };

  static Particle = class {
    constructor(x, y, minSpeed, maxSpeed, minSize, maxSize, opts = {}) {
      this.x = x;
      this.y = y;

      const angle = Math.random() * Math.PI * 2;

      const baseSpeed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
      const speedVariation = 0.5 + Math.random();
      const speed = baseSpeed * speedVariation;

      this.xv = Math.cos(angle) * speed;
      this.yv = Math.sin(angle) * speed;

      const posJitter = (opts.jitter || 0) * (Math.random() - 0.5);
      this.x += posJitter;
      this.y += posJitter;

      this.size = ParticlesMark.randRange(minSize, maxSize, false);

      const o = Object.assign({}, opts);
      if (o.frictionMin != null) o.frictionMin = Number(o.frictionMin);
      if (o.frictionMax != null) o.frictionMax = Number(o.frictionMax);
      if (o.gravity != null) o.gravity = Number(o.gravity);
      if (o.lifetimeMs != null) o.lifetimeMs = Number(o.lifetimeMs);
      if (o.lifetimeMinMs != null) o.lifetimeMinMs = Number(o.lifetimeMinMs);
      if (o.lifetimeMaxMs != null) o.lifetimeMaxMs = Number(o.lifetimeMaxMs);
      o.lifetimeJitter = o.lifetimeJitter ?? 0.5;

      const rMin = o.rMin ?? 113;
      const rMax = o.rMax ?? 222;
      const gMin = o.gMin ?? 0;
      const gMax = o.gMax ?? 100;
      const bMin = o.bMin ?? 105;
      const bMax = o.bMax ?? 255;

      this.r = Math.floor(ParticlesMark.randRange(rMin, rMax, false));
      this.g = Math.floor(ParticlesMark.randRange(gMin, gMax, false));
      this.b = Math.floor(ParticlesMark.randRange(bMin, bMax, false));

      this.friction = ParticlesMark.randRange(
        o.frictionMin ?? 0.96,
        o.frictionMax ?? 0.995,
        false
      );
      this.gravity = o.gravity ?? 0.02;

      if (this.gravity < 0) {
        this.peakY = this.y - Math.random() * 50 - 50;
        this.exploded = false;
      }

      const baseLifetimeMs =
        o.lifetimeMs != null
          ? Number(o.lifetimeMs)
          : ParticlesMark.randRange(o.lifetimeMinMs, o.lifetimeMaxMs, false);

      const j = Math.max(0, Math.min(1, Number(o.lifetimeJitter)));
      const minMul = 1 - j;
      const lifeJitter = Math.random() * j + minMul;
      this.created = performance.now();
      this.lifeJitter = lifeJitter;
      this.ttl = Math.max(16, baseLifetimeMs * lifeJitter);
    }
  };

  static randRange(min, max, integer) {
    const a = Number(min);
    const b = Number(max);
    if (integer) {
      return Math.floor(Math.random() * (b - a + 1)) + Math.floor(a);
    }
    return Math.random() * (b - a) + a;
  }
}
