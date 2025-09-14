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
        this.LaserbeamMark.fire(direction);
    }

    render() {
        this.LaserbeamMark.render();
    }

    update(dt) {
        this.LaserbeamMark.update(dt);
    }

    destroy() {
        if (this.LaserbeamMark) {
            //         this.laserbeam1.destroy();
            this.LaserbeamMark = null;
            this.objectManager.deregister('LaserbeamMark');
        }
    }
}
