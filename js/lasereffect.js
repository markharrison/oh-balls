// Laser Effect Module for creating animated laser beams
export class LaserEffect {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isActive = false;
        this.shootDuration = 450; // Time for laser to shoot across screen (ms)
        this.fadeDuration = 2000; // Time for laser to fade out (ms) - extended for better effect
        this.startTime = 0;
        this.lastFireTime = 0;
        this.fireInterval = 5000; // Fire every 5 seconds
        this.y = 160; // Y position for laser
        this.beamEndX = 0; // Current end position of the beam
        this.beamStartX = 0; // Starting position of the beam
        this.direction = 1; // 1 for left-to-right, -1 for right-to-left

        // Animation properties
        this.animationProgress = 0;
        this.particles = [];
        this.maxParticles = 25; // Increased particles for longer visibility

        // Visual properties
        this.colors = ['#ff00cc', '#00ffcc', '#ffcc00', '#cc00ff', '#00ccff'];
        this.currentColorIndex = 0;
    }

    update(deltaTime) {
        const currentTime = performance.now();

        // Check if it's time to fire the laser
        if (currentTime - this.lastFireTime >= this.fireInterval) {
            this.fire();
            this.lastFireTime = currentTime;
        }

        // Update active laser animation
        if (this.isActive) {
            const elapsedTime = currentTime - this.startTime;
            const totalDuration = this.shootDuration + this.fadeDuration;

            if (elapsedTime <= this.shootDuration) {
                // Shooting phase - beam is moving across screen
                const shootProgress = elapsedTime / this.shootDuration;
                if (this.direction === 1) {
                    // Left to right
                    this.beamStartX = 0;
                    this.beamEndX = shootProgress * this.canvas.width;
                } else {
                    // Right to left
                    this.beamStartX = this.canvas.width - shootProgress * this.canvas.width;
                    this.beamEndX = this.canvas.width;
                }
            } else {
                // Fade phase - beam is at full width and fading
                this.beamStartX = 0;
                this.beamEndX = this.canvas.width;
            }

            // Update particles
            this.updateParticles(deltaTime);

            // Deactivate when total duration is reached (with small buffer for complete fade)
            if (elapsedTime >= totalDuration * 1.05) {
                // 5% buffer for complete fade
                this.isActive = false;
                this.particles = [];
            }
        }
    }

    fire() {
        this.isActive = true;
        this.startTime = performance.now();
        this.animationProgress = 0;

        // Toggle direction each time laser fires
        this.direction *= -1;

        // Set starting and ending positions based on direction
        if (this.direction === 1) {
            // Left to right
            this.beamStartX = 0;
            this.beamEndX = 0;
        } else {
            // Right to left
            this.beamStartX = this.canvas.width;
            this.beamEndX = this.canvas.width;
        }

        // Cycle through colors
        this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;

        // Generate particles along the beam
        this.generateParticles();
    }

    generateParticles() {
        this.particles = [];
        // Generate fewer particles initially, more will be added as beam progresses
        for (let i = 0; i < Math.floor(this.maxParticles * 0.3); i++) {
            const startX = this.direction === 1 ? Math.random() * 50 : this.canvas.width - Math.random() * 50;
            const velocityX = this.direction === 1 ? Math.random() * 3 + 2 : -(Math.random() * 3 + 2);

            this.particles.push({
                x: startX,
                y: this.y + (Math.random() - 0.5) * 10,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.8 + 0.2,
                velocityX: velocityX,
                velocityY: (Math.random() - 0.5) * 2,
                life: 1.0,
            });
        }
    }

    updateParticles(deltaTime) {
        // Add new particles at the beam front as it progresses
        if (this.isActive && this.particles.length < this.maxParticles && Math.random() < 0.7) {
            let frontX, velocityX;
            if (this.direction === 1) {
                // Left to right
                frontX = this.beamEndX - Math.random() * 30;
                velocityX = Math.random() * 2 + 1;
            } else {
                // Right to left
                frontX = this.beamStartX + Math.random() * 30;
                velocityX = -(Math.random() * 2 + 1);
            }

            if (frontX >= 0 && frontX <= this.canvas.width) {
                this.particles.push({
                    x: frontX,
                    y: this.y + (Math.random() - 0.5) * 8,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.6 + 0.4,
                    velocityX: velocityX,
                    velocityY: (Math.random() - 0.5) * 1.5,
                    life: 1.0,
                });
            }
        }

        this.particles.forEach((particle) => {
            particle.x += particle.velocityX * deltaTime * 0.1;
            particle.y += particle.velocityY * deltaTime * 0.1;
            particle.life -= deltaTime * 0.0005; // Even slower fade for smoother transition
            particle.opacity = Math.pow(particle.life, 1.5); // Smoother opacity curve
        });

        // Remove dead particles
        this.particles = this.particles.filter((particle) => particle.life > 0);
    }

    render() {
        if (!this.isActive) return;

        const ctx = this.ctx;
        const currentColor = this.colors[this.currentColorIndex];

        ctx.save();

        // Create animated opacity with shooting and fade phases
        const elapsedTime = performance.now() - this.startTime;
        let baseOpacity;

        if (elapsedTime <= this.shootDuration) {
            // During shooting phase: build up intensity
            const shootProgress = elapsedTime / this.shootDuration;
            baseOpacity = 0.3 + 0.7 * shootProgress;
        } else {
            // During fade phase: smooth exponential fade out
            const fadeTime = elapsedTime - this.shootDuration;
            const fadeProgress = Math.min(fadeTime / this.fadeDuration, 1);
            // Use smooth exponential decay for more natural fade
            const smoothFade = Math.pow(1 - fadeProgress, 2.5); // Stronger curve for better fade to zero
            baseOpacity = smoothFade; // Fade from 100% to 0% completely
        }

        // Reduce pulse intensity during fade phase for smoother transition
        let pulseIntensity;
        if (elapsedTime <= this.shootDuration) {
            pulseIntensity = 0.1; // Normal pulse during shooting
        } else {
            const fadeTime = elapsedTime - this.shootDuration;
            const fadeProgress = Math.min(fadeTime / this.fadeDuration, 1);
            pulseIntensity = 0.1 * (1 - fadeProgress * 0.8); // Reduce pulse as it fades
        }

        // Add subtle pulse effect with reduced intensity during fade
        const animationProgress = elapsedTime / (this.shootDuration + this.fadeDuration);
        const pulseOpacity = baseOpacity * (0.95 + pulseIntensity * Math.sin(animationProgress * Math.PI * 6)); // Draw outer glow (widest, most transparent)
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 20;
        ctx.globalAlpha = pulseOpacity * 0.15;
        ctx.shadowColor = currentColor;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.moveTo(this.beamStartX, this.y);
        ctx.lineTo(this.beamEndX, this.y);
        ctx.stroke();

        // Draw middle glow
        ctx.lineWidth = 12;
        ctx.globalAlpha = pulseOpacity * 0.4;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(this.beamStartX, this.y);
        ctx.lineTo(this.beamEndX, this.y);
        ctx.stroke();

        // Draw inner glow
        ctx.lineWidth = 6;
        ctx.globalAlpha = pulseOpacity * 0.7;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(this.beamStartX, this.y);
        ctx.lineTo(this.beamEndX, this.y);
        ctx.stroke();

        // Draw core beam (brightest)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = pulseOpacity;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(this.beamStartX, this.y);
        ctx.lineTo(this.beamEndX, this.y);
        ctx.stroke();

        // Draw bright beam tip effect (only during shooting phase)
        if (elapsedTime <= this.shootDuration) {
            const tipX = this.direction === 1 ? this.beamEndX : this.beamStartX;
            if (tipX >= 0 && tipX <= this.canvas.width) {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = currentColor;
                ctx.shadowBlur = 20;
                ctx.globalAlpha = pulseOpacity;
                ctx.beginPath();
                ctx.arc(tipX, this.y, 8, 0, Math.PI * 2);
                ctx.fill();

                // Bright core at tip
                ctx.fillStyle = currentColor;
                ctx.shadowBlur = 10;
                ctx.globalAlpha = pulseOpacity * 0.8;
                ctx.beginPath();
                ctx.arc(tipX, this.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Reset shadow
        ctx.shadowBlur = 0;

        // Draw particles/sparks
        this.renderParticles();

        ctx.restore();
    }

    renderParticles() {
        const ctx = this.ctx;
        const currentColor = this.colors[this.currentColorIndex];

        this.particles.forEach((particle) => {
            if (particle.life <= 0) return;

            ctx.save();
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = currentColor;
            ctx.shadowColor = currentColor;
            ctx.shadowBlur = particle.size * 2;

            // Draw spark as a small circle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            // Add a bright center
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = particle.opacity * 0.8;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    // Method to manually trigger laser (useful for testing)
    triggerLaser() {
        this.fire();
    }

    // Method to change firing interval
    setFireInterval(intervalMs) {
        this.fireInterval = intervalMs;
    }

    // Method to set laser position
    setPosition(y) {
        this.y = y;
    }

    // Method to check if laser is currently active
    isLaserActive() {
        return this.isActive;
    }

    destroy() {
        this.isActive = false;
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
    }
}
