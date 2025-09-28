import { SceneManager } from './scene.js';
import { InputHandler } from './input.js';
import { ConfigManager } from './config.js';
import { AudioHandler } from './audio.js';
import { ImageHandler } from './image.js';

class ObjectManager {
    // To support Dependency Injection
    constructor() {
        this.registry = {};
    }
    keyExists(key) {
        return this.registry.hasOwnProperty(key);
    }

    register(id, obj) {
        if (this.keyExists(id)) {
            alert(`ObjectManager: key id '${id}' is already registered!`);
        }

        const objName = obj.constructor.name;
        this.registry[id] = {
            key: id,
            objectName: objName,
            object: obj,
        };

        return obj;
    }

    deregister(obj) {
        const found = Object.entries(this.registry).find(([, registryEntry]) => registryEntry.object === obj);
        if (!found) {
            alert(`ObjectManager: object not found in registry!`);
            return null;
        }

        const [key, entry] = found;
        delete this.registry[key];
        return entry.object;
    }

    getById(id) {
        if (!this.keyExists(id)) {
            alert(`ObjectManager: key '${id}' does not exist!`);
            return null;
        }
        return this.registry[id].object;
    }

    getObjectStateHtml() {
        let vHtml = '<strong>Objects</strong><br/>';
        Object.entries(this.registry).map(([key, entry]) => {
            const objType = entry.object?.constructor?.name || typeof entry.object;
            vHtml += `<div>${key}: ${entry.objectName} (${objType})</div>`;
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
        this.objectManager.register('Main', this, 'Main game controller and entry point');

        this.objectManager.register(
            'ConfigManager',
            new ConfigManager(this.objectManager),
            'Manages game configuration and settings'
        );

        this.imageHandler = this.objectManager.register(
            'ImageHandler',
            new ImageHandler(this.objectManager),
            'Handles image loading and management'
        );
        this.imageHandler.preloadImages();

        this.audioHandler = this.objectManager.register(
            'AudioHandler',
            new AudioHandler(this.objectManager),
            'Handles audio loading and playback'
        );
        this.audioHandler.preloadAudio();

        this.sceneManager = this.objectManager.register(
            'SceneManager',
            new SceneManager(this.objectManager),
            'Manages game scenes and transitions'
        );

        this.inputHandler = this.objectManager.register(
            'InputHandler',
            new InputHandler(this.objectManager),
            'Handles user input events'
        );
    }

    gameLoop() {
        if (!this.running) return;

        try {
            this.inputHandler.getInput();
            this.sceneManager.updateFrame();
        } catch (ex) {
            alert('Main loop error: ' + ex);
            console.error(ex);
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
