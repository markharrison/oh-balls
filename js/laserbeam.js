import { LaserbeamMark } from '../lib/laserbeammark.js';

export class LaserbeamHandler {
    constructor(objectManager) {
        this.objectManager = objectManager;
        this.canvas = this.objectManager.get('Main').canvas;

        this.LaserbeamMark = this.objectManager.register(
            'LaserbeamMark',
            new LaserbeamMark(this.canvas, {
                beamStyle: 'solid',
                coords1: this.zapStart,
                coords2: this.zapEnd,
            })
        );
    }

    // Example method to fire a laser
    fire(direction) {
        this.laserId = this.LaserbeamMark.addLaser(direction);
        this.laserId = this.LaserbeamMark.addLaser(-direction);
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
