export class LaserbeamMark {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.active = false;
        this.opacity = 1;
        this.progress = 0;
        this.timer = 0;
        this.phase = 'idle';
        this.particles = [];
        this.beamStyle = options.beamStyle ?? 'solid';
        this.coords1 = options.coords1 ?? [0, canvas.height / 2];
        this.coords2 = options.coords2 ?? [canvas.width, canvas.height / 2];
        this.shootDuration = options.shootDuration ?? 800;
        this.fadeDuration = options.fadeDuration ?? 800;
        this.beamColor = options.beamColor ?? '#00ffff';
        this.glowColor = options.glowColor ?? '#00ffff';
        this.tipColor = options.tipColor ?? this.glowColor;
        this.glowSize = options.glowSize ?? 24;
        this.beamWidth = options.beamWidth ?? 4;
        this.tipSize = options.tipSize ?? 24;
        this.tipStyle = options.tipStyle ?? 'arrow';
        this.particleConfig = Object.assign(
            {
                color: '#fff',
                glowColor: '#00ffff',
                size: 6,
                speed: 3,
                life: 600,
                fade: true,
                rate: 0.8,
            },
            options.particleConfig || {}
        );
    }

    fire(direction = 1) {
        this.active = true;
        this.opacity = 1;
        this.direction = direction;

        if (direction === 0) {
            this.progress = 1;
            this.timer = 0;
            this.phase = 'fade';
        } else {
            this.progress = 0;
            this.timer = 0;
            this.phase = 'shoot';
        }

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
        this._updateParticles(dt);
    }

    render() {
        if (!this.active) return;
        const ctx = this.ctx;

        let x0, y0, x1, y1;
        if (this.direction >= 0) {
            [x0, y0] = this.coords1;
            [x1, y1] = this.coords2;
        } else {
            [x0, y0] = this.coords2;
            [x1, y1] = this.coords1;
        }

        const tipX = x0 + (x1 - x0) * this.progress;
        const tipY = y0 + (y1 - y0) * this.progress;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = this.glowSize;
        ctx.lineCap = 'round';
        ctx.lineWidth = this.beamWidth;
        ctx.strokeStyle = this.beamColor;
        switch (this.beamStyle) {
            case 'solid':
                this._drawSolidBeam(x0, y0, tipX, tipY);
                break;
            case 'dashed':
                this._drawDashedBeam(x0, y0, tipX, tipY);
                break;
            case 'crackling':
                this._drawCracklingBeam(x0, y0, tipX, tipY);
                break;
            case 'tazer':
                this._drawTazerBeam(x0, y0, tipX, tipY);
                break;
            case 'pulsing':
                this._drawPulsingBeam(x0, y0, tipX, tipY);
                break;
            case 'charged':
                this._drawChargedBeam(x0, y0, tipX, tipY);
                break;
            case 'plasma':
                this._drawPlasmaBeam(x0, y0, tipX, tipY);
                break;
            case 'disruptor':
                this._drawDisruptorBeam(x0, y0, tipX, tipY);
                break;
            default:
                this._drawSolidBeam(x0, y0, tipX, tipY);
                break;
        }
        ctx.shadowBlur = 0;

        if (this.direction !== 0 && this.phase === 'shoot') {
            this._drawBeamTip(tipX, tipY, x0, y0, x1, y1);
        }

        if (this.phase === 'shoot') {
            this._emitParticles(tipX, tipY);
        }
        this._renderParticles(ctx);
        ctx.restore();
    }

    _drawSolidBeam(x0, y0, x1, y1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
    }

    _drawDashedBeam(x0, y0, x1, y1) {
        this.ctx.setLineDash([16, 8]);
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    _drawCracklingBeam(x0, y0, x1, y1) {
        const distance = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
        const segments = Math.floor(distance / 8);
        const crackleAmount = this.beamWidth * 1.5;

        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);

        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const baseX = x0 + (x1 - x0) * t;
            const baseY = y0 + (y1 - y0) * t;

            const offsetX = (Math.random() - 0.5) * crackleAmount;
            const offsetY = (Math.random() - 0.5) * crackleAmount;

            this.ctx.lineTo(baseX + offsetX, baseY + offsetY);
        }

        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
    }

    _drawTazerBeam(x0, y0, x1, y1) {
        const distance = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
        const segments = Math.floor(distance / 12);
        const tazerAmount = this.beamWidth * 4;

        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);

        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const baseX = x0 + (x1 - x0) * t;
            const baseY = y0 + (y1 - y0) * t;

            const zigzag = i % 2 === 0 ? 1 : -1;
            const offsetX = (Math.random() - 0.5) * tazerAmount + zigzag * tazerAmount * 0.3;
            const offsetY = (Math.random() - 0.5) * tazerAmount + zigzag * tazerAmount * 0.3;

            this.ctx.lineTo(baseX + offsetX, baseY + offsetY);
        }

        this.ctx.lineTo(x1, y1);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
    }

    _drawPulsingBeam(x0, y0, x1, y1) {
        const pulseSpeed = 3;
        const pulseAmount = 0.6;
        const pulse = Math.sin(this.timer * pulseSpeed * 0.01) * pulseAmount + 1;

        this.ctx.lineWidth = this.beamWidth * pulse;
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
    }

    _drawChargedBeam(x0, y0, x1, y1) {
        const beamCount = 4;
        const spread = this.beamWidth * 0.8;

        this.ctx.lineWidth = this.beamWidth * 0.3;

        for (let i = 0; i < beamCount; i++) {
            const angle = (i / beamCount) * Math.PI * 2;
            const offsetX = Math.cos(angle) * spread;
            const offsetY = Math.sin(angle) * spread;

            this.ctx.beginPath();
            this.ctx.moveTo(x0 + offsetX, y0 + offsetY);
            this.ctx.lineTo(x1 + offsetX, y1 + offsetY);
            this.ctx.stroke();
        }
    }

    _drawPlasmaBeam(x0, y0, x1, y1) {
        this.ctx.save();
        this.ctx.lineWidth = this.beamWidth * 3;
        this.ctx.globalAlpha = this.opacity * 0.3;
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();

        this.ctx.lineWidth = this.beamWidth * 1.8;
        this.ctx.globalAlpha = this.opacity * 0.6;
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();

        this.ctx.lineWidth = this.beamWidth * 0.8;
        this.ctx.globalAlpha = this.opacity;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
        this.ctx.restore();
    }

    _drawDisruptorBeam(x0, y0, x1, y1) {
        const fragments = 3;
        const fragmentSeparation = this.beamWidth * 2;
        const mergeChance = 0.3;

        const dx = x1 - x0;
        const dy = y1 - y0;
        const length = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / length;
        const perpY = dx / length;

        this.ctx.lineWidth = this.beamWidth / fragments;

        for (let i = 0; i < fragments; i++) {
            const offset = (i - (fragments - 1) / 2) * fragmentSeparation;
            const startX = x0 + perpX * offset;
            const startY = y0 + perpY * offset;
            const endX = x1 + perpX * offset;
            const endY = y1 + perpY * offset;

            const segments = 8;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);

            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                let targetX = startX + (endX - startX) * t;
                let targetY = startY + (endY - startY) * t;

                if (Math.random() < mergeChance) {
                    const centerX = x0 + (x1 - x0) * t;
                    const centerY = y0 + (y1 - y0) * t;
                    const pullStrength = 0.7;
                    targetX = targetX * (1 - pullStrength) + centerX * pullStrength;
                    targetY = targetY * (1 - pullStrength) + centerY * pullStrength;
                }

                this.ctx.lineTo(targetX, targetY);
            }

            this.ctx.stroke();
        }
    }

    _drawBeamTip(tipX, tipY, x0, y0, x1, y1) {
        this.ctx.save();
        this.ctx.globalAlpha = this.opacity * 0.9;
        this.ctx.fillStyle = this.tipColor;
        this.ctx.shadowColor = this.tipColor;
        this.ctx.shadowBlur = this.glowSize * 1.5;

        if (this.tipStyle === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(tipX, tipY, this.tipSize * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            const dx = x1 - x0;
            const dy = y1 - y0;
            const angle = Math.atan2(dy, dx);

            this.ctx.translate(tipX, tipY);
            this.ctx.rotate(angle);

            this.ctx.beginPath();
            this.ctx.moveTo(this.tipSize, 0);
            this.ctx.lineTo(-this.tipSize * 0.4, -this.tipSize * 0.3);
            this.ctx.lineTo(-this.tipSize * 0.4, this.tipSize * 0.3);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    _emitParticles(x, y) {
        const sparkCount = Math.floor(this.particleConfig.rate * 5);
        for (let i = 0; i < sparkCount; i++) {
            if (Math.random() < this.particleConfig.rate) {
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
                    length: 8 + Math.random() * 12,
                    color: this.particleConfig.color,
                    glowColor: this.particleConfig.glowColor,
                    fade: this.particleConfig.fade,
                    trail: Math.random() > 0.5,
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
        this.particles = this.particles.filter((p) => p.age < p.life);
    }

    _renderParticles(ctx) {
        for (let p of this.particles) {
            const alpha = p.fade ? 1 - p.age / p.life : 1;
            if (alpha <= 0.01) continue;

            ctx.save();
            ctx.globalAlpha = alpha * this.opacity;

            if (p.trail) {
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
}
