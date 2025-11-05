import { MarkJSLaserbeam } from '@markharrison/markjslaserbeam';

export class LaserbeamHandler {
  constructor(objectManager) {
    this.objectManager = objectManager;
    this.canvas = this.objectManager.getById('Main').canvas;

    this.LaserbeamMark = this.objectManager.register(
      'MarkJSLaserbeam',
      new MarkJSLaserbeam(this.canvas, {
        beamStyle: 'solid',
      })
    );
  }

  // Example method to fire a laser
  fire(direction) {
    let options = {
      coords1: [0, 180],
      coords2: [this.canvas.width, 180],
      beamStyle: 'solid',
    };
    this.laserId = this.LaserbeamMark.addLaser(direction, options);
    this.laserId = this.LaserbeamMark.addLaser(-direction, options);
  }

  render() {
    this.LaserbeamMark.render();
  }

  update(dt) {
    this.LaserbeamMark.update(dt);
  }

  destroy() {
    if (this.LaserbeamMark) {
      this.LaserbeamMark.destroy();
      this.objectManager.deregister(this.LaserbeamMark);
      this.LaserbeamMark = null;
    }
  }
}
