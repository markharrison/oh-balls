import { MarkJSParticles } from '@markharrison/markjsparticles';

export class ParticlesHandler {
  constructor(objectManager) {
    this.objectManager = objectManager;
    this.canvas = this.objectManager.getById('Main').canvas;

    this.particlesMark = this.objectManager.register('MarkJSParticles', new MarkJSParticles(this.canvas));
  }

  hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((x) => x + x)
        .join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  combineEffect(coords, color) {
    const { r, g, b } = this.hexToRgb(color);

    let rMin = Math.max(0, r - 16);
    let rMax = Math.min(255, r + 16);
    let gMin = Math.max(0, g - 16);
    let gMax = Math.min(255, g + 16);
    let bMin = Math.max(0, b - 16);
    let bMax = Math.min(255, b + 16);

    this.particlesMark.addEffect('explosion', coords, {
      rMin: rMin,
      rMax: rMax,
      gMin: gMin,
      gMax: gMax,
      bMin: bMin,
      bMax: bMax,
    });
  }

  // Example method to update particles
  update(dt) {
    this.particlesMark.update(dt);
  }

  // Example method to render particles
  render() {
    this.particlesMark.render();
  }

  destroy() {
    if (this.particlesMark) {
      this.particlesMark.destroy();
      this.objectManager.deregister(this.particlesMark);
      this.particlesMark = null;
    }
  }
}
