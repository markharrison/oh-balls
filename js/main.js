import { SceneManager } from './screenmanager.js';
import { InputHandler } from './input.js';
import { ConfigManager } from './config.js';
import { AudioHandler } from './audio.js';

class ObjectManager {
    constructor() {
        this.registry = {};
    }
    register(key, obj) {
        if (this.registry.hasOwnProperty(key)) {
            alert(`ObjectManager: key '${key}' is already registered!`);
        }
        this.registry[key] = obj;
    }
    deregister(key) {
        if (!this.registry.hasOwnProperty(key)) {
            alert(`ObjectManager: key '${key}' does not exist!`);
            return;
        }
        delete this.registry[key];
    }
    get(key) {
        if (!this.registry.hasOwnProperty(key)) {
            alert(`ObjectManager: key '${key}' does not exist!`);
            return null;
        }
        return this.registry[key];
    }
    getAll() {
        return this.registry;
    }
    getObjectStateHtml() {
        let vHtml = '<strong>Objects</strong><br/>';
        Object.entries(this.registry).map(([key, obj]) => {
            vHtml += `<div>${key}: ${obj?.constructor?.name || typeof obj}</div>`;
        });
        return vHtml;
    }
}

class Main {
    constructor() {
        this.canvas = document.getElementById('idCanvasControl');
        this.running = false;
        this.rafId = null;

        this.objectManager = new ObjectManager();
        this.objectManager.register('Main', this);

        this.ConfigManager = new ConfigManager();
        this.objectManager.register('ConfigManager', this.ConfigManager);

        this.inputHandler = new InputHandler(this);
        this.objectManager.register('InputHandler', this.inputHandler);

        this.audioHandler = new AudioHandler(this.objectManager);
        this.objectManager.register('AudioHandler', this.audioHandler);

        this.sceneManager = new SceneManager(this);
        this.objectManager.register('SceneManager', this.sceneManager);
 
    }

    // getObjectSummary() {
    //     return this.objectManager.getSummary();
    // }

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
