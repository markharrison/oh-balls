import { LaserbeamMark } from '../lib/laserbeammark.js';

export class LaserbeamHandler {
    constructor(objectManager) {
        this.objectManager = objectManager;
        this.canvas = this.objectManager.get('Main').canvas;

        this.LaserbeamMark = this.objectManager.register(
            'LaserbeamMark',
            new LaserbeamMark(this.canvas, {
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
            this.LaserbeamMark = null;
            this.objectManager.deregister('LaserbeamMark');
        }
    }
}
