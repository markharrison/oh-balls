import { SceneManager } from './screenmanager.js';
import { InputHandler } from './input.js';
import { ConfigManager } from './config.js';
import { AudioHandler } from './audio.js';

class ObjectManager {
    // To support Dependency Injection
    constructor() {
        this.registry = {};
    }
    keyExists(key) {
        return this.registry.hasOwnProperty(key);
    }
    register(key, obj) {
        if (this.keyExists(key)) {
            alert(`ObjectManager: key '${key}' is already registered!`);
        }
        this.registry[key] = obj;

        return obj;
    }
    deregister(key) {
        if (!this.keyExists(key)) {
            alert(`ObjectManager: key '${key}' does not exist!`);
            return;
        }

        delete this.registry[key];
    }

    get(key) {
        if (!this.keyExists(key)) {
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

        this.objectManager.register('ConfigManager', new ConfigManager(this.objectManager));

        this.objectManager.register('AudioHandler', new AudioHandler(this.objectManager));

        this.sceneManager = this.objectManager.register('SceneManager', new SceneManager(this.objectManager));

        this.inputHandler = this.objectManager.register('InputHandler', new InputHandler(this.objectManager));
    }

    gameLoop() {
        if (!this.running) return;

        try {
            this.inputHandler.getInput();
            this.sceneManager.updateFrame();
        } catch (ex) {
            alert('Main loop error: ' + ex);
            this.running = false;
        }

        this.rafId = requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        if (this.running) return;

        this.sceneManager.start();

        this.running = true;
        this.gameLoop();
    }

    destroy() {
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        if (this.config) {
            this.config.saveToLocalStorage();
        }
        this.config = null;
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
