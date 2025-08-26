// AudioHandler: abstraction layer between game and audio library
import { AudioMark } from '../lib/audiomark.js';

export class AudioHandler {
    constructor(objectManager) {
        this.objectManager = objectManager;
        this.audioMark = new AudioMark();
    }

    initialize() {
        // this.audioMark.initialize();
        let scene = this.objectManager.get('SceneManager');
        scene.doToast('Initialize audio: ', this?.constructor?.name);
        ///        audio?.initialize();
    }

    // Example wrapper methods
    playMusic(track) {
        if (this.audioMark && typeof this.audioMark.playMusic === 'function') {
            this.audioMark.playMusic(track);
        }
    }

    stopMusic(track) {
        if (this.audioMark && typeof this.audioMark.stopMusic === 'function') {
            this.audioMark.stopMusic(track);
        }
    }

    setVolume(type, value) {
        if (this.audioMark && typeof this.audioMark.setVolume === 'function') {
            this.audioMark.setVolume(type, value);
        }
    }

    // Add more wrapper methods as needed
}
