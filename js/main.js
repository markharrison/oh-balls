import { SceneManager } from './screenmanager.js';
import { InputHandler } from './input.js';
import { Config } from './config.js';

class Main {
    constructor() {
        this.canvas = document.getElementById('idCanvasControl');
        this.running = false;
        this.rafId = null;

        // Initialize configuration
        this.config = new Config();
        // Try to load saved configuration from localStorage
        this.config.loadFromLocalStorage();

        this.inputHandler = new InputHandler();

        this.sceneManager = new SceneManager(this.canvas);
        this.sceneManager.registerInputHandler(this.inputHandler);
        this.sceneManager.registerConfig(this.config);
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
        // Save configuration before destroying
        if (this.config) {
            this.config.saveToLocalStorage();
        }

        // stop the loop and cancel any pending animation frame
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        this.sceneManager = null;
        this.inputHandler = null;
        this.config = null;
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
