export class Laserbeam {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.active = false;
        this.opacity = 1;
        this.progress = 0;
        this.timer = 0;
        this.phase = 'idle'; // 'shoot', 'fade', 'idle'
        this.particles = [];
        // Configurable properties
        this.beamStyle = options.beamStyle ?? 'solid';
        this.startCoords = options.startCoords ?? [0, canvas.height / 2];
        this.endCoords = options.endCoords ?? [canvas.width, canvas.height / 2];
        this.shootDuration = options.shootDuration ?? 800; // ms
        this.fadeDuration = options.fadeDuration ?? 800; // ms
        this.beamColor = options.beamColor ?? '#00ffff';
        this.glowColor = options.glowColor ?? '#00ffff';
        this.glowSize = options.glowSize ?? 24;
        this.beamWidth = options.beamWidth ?? 4;
        this.tipSize = options.tipSize ?? 24; // Configurable tip size
        this.particleConfig = Object.assign(
            {
                color: '#fff',
                glowColor: '#00ffff',
                size: 6,
                speed: 3,
                life: 600,
                fade: true,
                rate: 0.8, // Much higher emission rate (80% chance per frame)
            },
            options.particleConfig || {}
        );
    }

    fire() {
        this.active = true;
        this.opacity = 1;
        this.progress = 0;
        this.timer = 0;
        this.phase = 'shoot';
        this.particles = [];
    }

    update(dt) {
        if (!this.active) return;
        this.timer += dt;
        if (this.phase === 'shoot') {
            this.progress = Math.min(1, this.timer / this.shootDuration);
            if (this.progress >= 1) {
                this.phase = 'fade';
                this.timer = 0;
            }
        } else if (this.phase === 'fade') {
            this.opacity = 1 - Math.min(1, this.timer / this.fadeDuration);
            if (this.opacity <= 0) {
                this.active = false;
                this.phase = 'idle';
            }
        }
        // Update particles
        this._updateParticles(dt);
    }

    render() {
        if (!this.active) return;
        const ctx = this.ctx;
        const [x0, y0] = this.startCoords;
        const [x1, y1] = this.endCoords;
        // Calculate current tip position
        const tipX = x0 + (x1 - x0) * this.progress;
        const tipY = y0 + (y1 - y0) * this.progress;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        // Glow effect
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = this.glowSize;
        ctx.lineCap = 'round';
        ctx.lineWidth = this.beamWidth;
        ctx.strokeStyle = this.beamColor;
        // Draw beam
        if (this.beamStyle === 'solid') {
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
        } else if (this.beamStyle === 'dashed') {
            ctx.setLineDash([16, 8]);
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.shadowBlur = 0;

        // Draw sharp tip (diamond/arrow shape instead of circle)
        const dx = x1 - x0;
        const dy = y1 - y0;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.globalAlpha = this.opacity * 0.9;
        ctx.fillStyle = this.glowColor;
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = this.glowSize * 1.5;

        ctx.translate(tipX, tipY);
        ctx.rotate(angle);

        // Draw sharp diamond/arrow tip using configurable tipSize
        ctx.beginPath();
        ctx.moveTo(this.tipSize, 0); // Point
        ctx.lineTo(-this.tipSize * 0.4, -this.tipSize * 0.3); // Top left
        ctx.lineTo(-this.tipSize * 0.4, this.tipSize * 0.3); // Bottom left
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Emit particles from tip
        if (this.phase === 'shoot') {
            this._emitParticles(tipX, tipY);
        }
        // Draw particles
        this._renderParticles(ctx);
        ctx.restore();
    }

    _emitParticles(x, y) {
        // Emit laser-like sparks (not confetti!)
        const sparkCount = Math.floor(this.particleConfig.rate * 5);
        for (let i = 0; i < sparkCount; i++) {
            if (Math.random() < this.particleConfig.rate) {
                // Create directional sparks that look like laser energy
                const angle = Math.random() * Math.PI * 2;
                const speed = this.particleConfig.speed * (1 + Math.random() * 2);

                this.particles.push({
                    x: x + (Math.random() - 0.5) * this.beamWidth * 0.5,
                    y: y + (Math.random() - 0.5) * this.beamWidth * 0.5,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: this.particleConfig.life * (0.5 + Math.random() * 0.5),
                    age: 0,
                    size: this.particleConfig.size * (0.3 + Math.random() * 0.4),
                    length: 8 + Math.random() * 12, // Streak length
                    color: this.particleConfig.color,
                    glowColor: this.particleConfig.glowColor,
                    fade: this.particleConfig.fade,
                    trail: Math.random() > 0.5, // Some particles have trails
                });
            }
        }
    }

    _updateParticles(dt) {
        for (let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.age += dt;
        }
        // Remove dead particles
        this.particles = this.particles.filter((p) => p.age < p.life);
    }

    _renderParticles(ctx) {
        for (let p of this.particles) {
            const alpha = p.fade ? 1 - p.age / p.life : 1;
            if (alpha <= 0.01) continue; // Skip nearly invisible particles

            ctx.save();
            ctx.globalAlpha = alpha * this.opacity;

            if (p.trail) {
                // Draw as a streak/trail for laser spark effect
                ctx.strokeStyle = p.glowColor;
                ctx.shadowColor = p.glowColor;
                ctx.shadowBlur = p.size * 3;
                ctx.lineWidth = p.size * 0.5;
                ctx.lineCap = 'round';

                const endX = p.x - p.vx * (p.length / 10);
                const endY = p.y - p.vy * (p.length / 10);

                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            } else {
                // Draw as bright spark
                ctx.shadowColor = p.glowColor;
                ctx.shadowBlur = p.size * 4;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }

            ctx.restore();
        }
    }
    // End LaserbeamEffect
}
