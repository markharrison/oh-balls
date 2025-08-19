import { DiagnosticPanel } from './diagnostics.js';
import { SceneBase } from './scenebase.js';

// Import scene classes after SceneBase is available
import { SceneBallsX } from './sceneballsx.js';
import { SceneSplash } from './scenesplash.js';
import { SceneMainmenu } from './scenemainmenu.js';
import { SceneSettings } from './scenesettings.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputHandler = null;

        this.clock = {
            deltaTime: 0,
            currentTime: 0,
        };

        this.diagnosticsPanel = new DiagnosticPanel();
        this.diagnosticsPanel.registerSceneManager(this);

        this.currentSceneKey = null;
        this.currentScene = null;

        // Initialize scene instances
        this.scenes = [];

        this.setCurrentScene(SceneBase.GameScenes.splash);
    }

    setCurrentScene(sceneKey) {
        if (this.currentScene) {
            this.currentScene.exit();
            this.currentScene = null;
            this.scenes[this.currentSceneKey] = null;
        }

        switch (sceneKey) {
            case SceneBase.GameScenes.splash:
                this.scenes[sceneKey] = new SceneSplash(this.canvas, this);
                break;
            case SceneBase.GameScenes.mainmenu:
                this.scenes[sceneKey] = new SceneMainmenu(this.canvas, this);
                break;
            case SceneBase.GameScenes.ballsX:
                this.scenes[sceneKey] = new SceneBallsX(this.canvas, this);
                break;
            case SceneBase.GameScenes.settings:
                this.scenes[sceneKey] = new SceneSettings(this.canvas, this);
                break;
            default:
                break;
        }

        if (this.scenes[sceneKey]) {
            this.currentSceneKey = sceneKey;
            this.currentScene = this.scenes[sceneKey];
            this.currentScene.enter();
        }
    }

    registerInputHandler(inputHandler) {
        this.inputHandler = inputHandler;
        this.inputHandler.registerSceneManager(this);
    }

    getSceneMainStateHtml() {
        const vHtml = `
            <strong>Scene: Main</strong><br>
        `;
        return vHtml;
    }

    getSceneStateHtml() {
        let vHtml = '';

        switch (this.currentSceneKey) {
            case SceneBase.GameScenes.splash:
                vHtml = this.scenes.splash.getSceneStateHtml();
                break;
            case SceneBase.GameScenes.mainmenu:
                vHtml = this.scenes.mainmenu.getSceneStateHtml();
                break;
            case SceneBase.GameScenes.main:
                vHtml = this.getSceneMainStateHtml();
                break;
            case SceneBase.GameScenes.ballsX:
                vHtml = this.scenes.ballsX.getSceneStateHtml();
                break;
            case SceneBase.GameScenes.settings:
                vHtml = this.scenes.settings.getSceneStateHtml();
                break;
            default:
                break;
        }

        return vHtml;
    }

    setupEventHandlers() {}

    destroy() {
        Object.values(this.scenes).forEach((scene) => {
            if (scene.exit) {
                scene.exit();
            }
        });
        this.scenes = null;
        this.currentScene = null;
        this.diagnosticsPanel = null;
    }

    renderSceneMain() {
        const ballInfoElement = document.getElementById('currentBallSize');
        ballInfoElement.textContent = 'Harrison Digital - Scene Manager';

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#777777';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const text = 'Scene Manager';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

        // Get all bodies and render them
    }

    inputKeyPressedSplash(code) {
        // No manual input - auto-transition handles this
    }

    inputKeyPressedMainmenu(code) {
        switch (code) {
            case 'ArrowUp':
            case 'ArrowDown':
                this.scenes.mainmenu.inputKeyPressed(code, false);
                break;
            case 'Enter':
                // Handle menu selection
                if (this.scenes.mainmenu.selectedOption === 0) {
                    // Start Game
                    this.setCurrentScene(SceneBase.GameScenes.ballsX);
                } else if (this.scenes.mainmenu.selectedOption === 1) {
                    // Settings
                    this.setCurrentScene(SceneBase.GameScenes.settings);
                }
                break;
            default:
                break;
        }
    }

    inputKeyPressed(code) {
        let debug = this.diagnosticsPanel.enabled;

        switch (code) {
            case 'KeyD':
                this.diagnosticsPanel.toggle();
                break;
            default: {
                switch (this.currentSceneKey) {
                    case SceneBase.GameScenes.splash:
                        this.inputKeyPressedSplash(code);
                        break;
                    case SceneBase.GameScenes.mainmenu:
                        this.inputKeyPressedMainmenu(code);
                        break;
                    case SceneBase.GameScenes.main:
                        this.inputKeyPressedMain(code);
                        break;
                    case SceneBase.GameScenes.ballsX:
                        this.scenes.ballsX.inputKeyPressed(code, debug);
                        break;
                    case SceneBase.GameScenes.settings:
                        this.scenes.settings.inputKeyPressed(code);
                        break;
                    default:
                        break;
                }
            }
        }
    }

    updateFrameMain() {
        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        this.renderSceneMain();
    }

    update(dt) {
        const nextSceneKey = this.currentScene.update(dt);
        if (nextSceneKey !== null && nextSceneKey !== this.currentSceneKey) {
            this.setCurrentScene(nextSceneKey);
        }
    }

    render(ctx) {
        this.currentScene.render(ctx);
    }

    updateFrame() {
        this.inputHandler.getInput();

        const currentTime = performance.now();
        const lastTime = this.clock.currentTime;
        this.clock.currentTime = currentTime;
        this.clock.deltaTime = this.clock.currentTime - lastTime;

        // Use new update/render interface
        this.update(this.clock.deltaTime);
        this.render(this.ctx);

        this.diagnosticsPanel.renderPanel();
    }
}
