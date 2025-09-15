export class LaserbeamMark {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lasers = [];
        this.defaultOptions = {
            beamStyle: options.beamStyle ?? 'solid',
            coords1: options.coords1 ?? [0, canvas.height / 2],
            coords2: options.coords2 ?? [canvas.width, canvas.height / 2],
            shootDuration: options.shootDuration ?? 800,
            fadeDuration: options.fadeDuration ?? 800,
            beamColor: options.beamColor ?? '#00ffff',
            glowColor: options.glowColor ?? '#00ffff',
            tipColor: options.tipColor ?? (options.glowColor ?? '#00ffff'),
            glowSize: options.glowSize ?? 24,
            beamWidth: options.beamWidth ?? 4,
            tipSize: options.tipSize ?? 24,
            tipStyle: options.tipStyle ?? 'arrow',
            particleConfig: Object.assign(
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
            )
        };
    }

    // Backwards compatibility: fire a laser with default options
    fire(direction = 1) {
        return this.addLaser(direction, {});
    }

    // Add a new laser beam with custom options
    addLaser(direction = 1, options = {}) {
        const laserOptions = Object.assign({}, this.defaultOptions, options);
        
        const laser = {
            id: Date.now() + Math.random(), // Unique ID for each laser
            active: true,
            opacity: 1,
            progress: 0,
            timer: 0,
            phase: direction === 0 ? 'fade' : 'shoot',
            direction: direction,
            particles: [],
            ...laserOptions
        };

        if (direction === 0) {
            laser.progress = 1;
        }

        this.lasers.push(laser);
        return laser.id;
    }

    // Remove a specific laser by ID
    removeLaser(id) {
        const index = this.lasers.findIndex(laser => laser.id === id);
        if (index !== -1) {
            this.lasers.splice(index, 1);
            return true;
        }
        return false;
    }

    // Get the number of active lasers
    getActiveLaserCount() {
        return this.lasers.filter(laser => laser.active).length;
    }

    // Clear all lasers
    clearAllLasers() {
        this.lasers = [];
    }

    // Destroy all lasers and clean up resources
    destroy() {
        if (Array.isArray(this.lasers)) {
            for (let i = 0; i < this.lasers.length; i++) {
                const laser = this.lasers[i];
                if (laser && Array.isArray(laser.particles)) {
                    laser.particles.length = 0;
                }

                for (const key in laser) {
                    if (Object.hasOwnProperty.call(laser, key)) {
                        laser[key] = null;
                    }
                }
            }
        }

        this.lasers = [];
        this.canvas = null;
        this.ctx = null;
        this.defaultOptions = null;
    }

    update(dt) {
        // Update all active lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            if (!laser.active) {
                this.lasers.splice(i, 1);
                continue;
            }

            laser.timer += dt;
            
            if (laser.phase === 'shoot') {
                laser.progress = Math.min(1, laser.timer / laser.shootDuration);
                if (laser.progress >= 1) {
                    laser.phase = 'fade';
                    laser.timer = 0;
                }
            } else if (laser.phase === 'fade') {
                laser.opacity = 1 - Math.min(1, laser.timer / laser.fadeDuration);
                if (laser.opacity <= 0) {
                    laser.active = false;
                    laser.phase = 'idle';
                }
            }
            
            this._updateParticles(laser, dt);
        }
    }

    render() {
        // Render all active lasers
        for (const laser of this.lasers) {
            if (!laser.active) continue;
            this._renderLaser(laser);
        }
    }

    _renderLaser(laser) {
        const ctx = this.ctx;

        let x0, y0, x1, y1;
        if (laser.direction >= 0) {
            [x0, y0] = laser.coords1;
            [x1, y1] = laser.coords2;
        } else {
            [x0, y0] = laser.coords2;
            [x1, y1] = laser.coords1;
        }

        const tipX = x0 + (x1 - x0) * laser.progress;
        const tipY = y0 + (y1 - y0) * laser.progress;
        ctx.save();
        ctx.globalAlpha = laser.opacity;
        ctx.shadowColor = laser.glowColor;
        ctx.shadowBlur = laser.glowSize;
        ctx.lineCap = 'round';
        ctx.lineWidth = laser.beamWidth;
        ctx.strokeStyle = laser.beamColor;
        switch (laser.beamStyle) {
            case 'solid':
                this._drawSolidBeam(x0, y0, tipX, tipY);
                break;
            case 'dashed':
                this._drawDashedBeam(x0, y0, tipX, tipY);
                break;
            case 'crackling':
                this._drawCracklingBeam(x0, y0, tipX, tipY, laser);
                break;
            case 'tazer':
                this._drawTazerBeam(x0, y0, tipX, tipY, laser);
                break;
            case 'pulsing':
                this._drawPulsingBeam(x0, y0, tipX, tipY, laser);
                break;
            case 'charged':
                this._drawChargedBeam(x0, y0, tipX, tipY, laser);
                break;
            case 'plasma':
                this._drawPlasmaBeam(x0, y0, tipX, tipY, laser);
                break;
            case 'disruptor':
                this._drawDisruptorBeam(x0, y0, tipX, tipY, laser);
                break;
            default:
                this._drawSolidBeam(x0, y0, tipX, tipY);
                break;
        }
        ctx.shadowBlur = 0;

        if (laser.direction !== 0 && laser.phase === 'shoot') {
            this._drawBeamTip(tipX, tipY, x0, y0, x1, y1, laser);
        }

        if (laser.phase === 'shoot') {
            this._emitParticles(tipX, tipY, laser);
        }
        this._renderParticles(ctx, laser);
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

    _drawCracklingBeam(x0, y0, x1, y1, laser) {
        const distance = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
        const segments = Math.floor(distance / 8);
        const crackleAmount = laser.beamWidth * 1.5;

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

    _drawTazerBeam(x0, y0, x1, y1, laser) {
        const distance = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
        const segments = Math.floor(distance / 12);
        const tazerAmount = laser.beamWidth * 4;

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

    _drawPulsingBeam(x0, y0, x1, y1, laser) {
        const pulseSpeed = 3;
        const pulseAmount = 0.6;
        const pulse = Math.sin(laser.timer * pulseSpeed * 0.01) * pulseAmount + 1;

        this.ctx.lineWidth = laser.beamWidth * pulse;
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
    }

    _drawChargedBeam(x0, y0, x1, y1, laser) {
        const beamCount = 4;
        const spread = laser.beamWidth * 0.8;

        this.ctx.lineWidth = laser.beamWidth * 0.3;

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

    _drawPlasmaBeam(x0, y0, x1, y1, laser) {
        this.ctx.save();
        this.ctx.lineWidth = laser.beamWidth * 3;
        this.ctx.globalAlpha = laser.opacity * 0.3;
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();

        this.ctx.lineWidth = laser.beamWidth * 1.8;
        this.ctx.globalAlpha = laser.opacity * 0.6;
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();

        this.ctx.lineWidth = laser.beamWidth * 0.8;
        this.ctx.globalAlpha = laser.opacity;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
        this.ctx.restore();
    }

    _drawDisruptorBeam(x0, y0, x1, y1, laser) {
        const fragments = 3;
        const fragmentSeparation = laser.beamWidth * 2;
        const mergeChance = 0.3;

        const dx = x1 - x0;
        const dy = y1 - y0;
        const length = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / length;
        const perpY = dx / length;

        this.ctx.lineWidth = laser.beamWidth / fragments;

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

    _drawBeamTip(tipX, tipY, x0, y0, x1, y1, laser) {
        this.ctx.save();
        this.ctx.globalAlpha = laser.opacity * 0.9;
        this.ctx.fillStyle = laser.tipColor;
        this.ctx.shadowColor = laser.tipColor;
        this.ctx.shadowBlur = laser.glowSize * 1.5;

        if (laser.tipStyle === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(tipX, tipY, laser.tipSize * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            const dx = x1 - x0;
            const dy = y1 - y0;
            const angle = Math.atan2(dy, dx);

            this.ctx.translate(tipX, tipY);
            this.ctx.rotate(angle);

            this.ctx.beginPath();
            this.ctx.moveTo(laser.tipSize, 0);
            this.ctx.lineTo(-laser.tipSize * 0.4, -laser.tipSize * 0.3);
            this.ctx.lineTo(-laser.tipSize * 0.4, laser.tipSize * 0.3);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    _emitParticles(x, y, laser) {
        const sparkCount = Math.floor(laser.particleConfig.rate * 5);
        for (let i = 0; i < sparkCount; i++) {
            if (Math.random() < laser.particleConfig.rate) {
                const angle = Math.random() * Math.PI * 2;
                const speed = laser.particleConfig.speed * (1 + Math.random() * 2);

                laser.particles.push({
                    x: x + (Math.random() - 0.5) * laser.beamWidth * 0.5,
                    y: y + (Math.random() - 0.5) * laser.beamWidth * 0.5,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: laser.particleConfig.life * (0.5 + Math.random() * 0.5),
                    age: 0,
                    size: laser.particleConfig.size * (0.3 + Math.random() * 0.4),
                    length: 8 + Math.random() * 12,
                    color: laser.particleConfig.color,
                    glowColor: laser.particleConfig.glowColor,
                    fade: laser.particleConfig.fade,
                    trail: Math.random() > 0.5,
                });
            }
        }
    }

    _updateParticles(laser, dt) {
        for (let p of laser.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.age += dt;
        }
        laser.particles = laser.particles.filter((p) => p.age < p.life);
    }

    _renderParticles(ctx, laser) {
        for (let p of laser.particles) {
            const alpha = p.fade ? 1 - p.age / p.life : 1;
            if (alpha <= 0.01) continue;

            ctx.save();
            ctx.globalAlpha = alpha * laser.opacity;

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
