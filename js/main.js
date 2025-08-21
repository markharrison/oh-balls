import { SceneManager } from './screenmanager.js';
import { InputHandler } from './input.js';

class Main {
    constructor() {
        this.canvas = document.getElementById('idCanvas');
        this.running = false;
        this.rafId = null;

        this.inputHandler = new InputHandler();

        this.sceneManager = new SceneManager(this.canvas);
        this.sceneManager.registerInputHandler(this.inputHandler);
    }

    gameLoop() {
        if (!this.running) return;

        // guard against sceneManager being cleared during teardown
        if (this.sceneManager && typeof this.sceneManager.updateFrame === 'function') {
            this.sceneManager.updateFrame();
        }

        this.rafId = requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        if (this.running) return;

        this.running = true;
        this.gameLoop();
    }

    destroy() {
        // stop the loop and cancel any pending animation frame
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        this.sceneManager = null;
        this.inputHandler = null;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global game instance
    window.main = new Main();

    window.main.start();

    // Add debug command to console
});

// Handle page unload cleanup
window.addEventListener('beforeunload', () => {
    if (window.main) {
        window.main.destroy();
    }
});
