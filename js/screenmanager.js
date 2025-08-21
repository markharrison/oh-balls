import { DiagnosticPanel } from './diagnostics.js';
import { SceneBase } from './scenebase.js';

import { SceneBallsX } from './sceneballsx.js';
import { SceneSplash } from './scenesplash.js';
import { SceneMainmenu } from './scenemainmenu.js';
import { SceneSettings } from './scenesettings.js';
import { SceneSettingsAudio } from './scenesettings.js';

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

        this.setCurrentScene(SceneBase.GameScenes.splash);
    }

    setCurrentScene(sceneKey) {
        if (this.currentScene) {
            this.currentScene.exit();
            this.currentScene = null;
        }

        switch (sceneKey) {
            case SceneBase.GameScenes.splash:
                this.currentScene = new SceneSplash(this.canvas, this);
                break;
            case SceneBase.GameScenes.mainmenu:
                this.currentScene = new SceneMainmenu(this.canvas, this);
                break;
            case SceneBase.GameScenes.ballsX:
                this.currentScene = new SceneBallsX(this.canvas, this);
                break;
            case SceneBase.GameScenes.settings:
                this.currentScene = new SceneSettings(this.canvas, this);
                break;
            case SceneBase.GameScenes.settingsaudio:
                this.currentScene = new SceneSettingsAudio(this.canvas, this);
                break;
            default:
                break;
        }

        this.currentSceneKey = sceneKey;
        this.currentScene.enter();
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

        vHtml = this.currentScene.getSceneStateHtml();

        return vHtml;
    }

    setupEventHandlers() {}

    destroy() {
        this.currentScene.exit();
        this.currentScene = null;
        this.diagnosticsPanel = null;
    }

    renderSceneMain() {
        const ballInfoElement = document.getElementById('currentBallSize');
        ballInfoElement.textContent = 'Harrison Digital - Scene Manager';
    }

    inputKeyPressed(comboId) {
        let debug = this.diagnosticsPanel.enabled;

        switch (comboId) {
            case 'Control+KeyD':
                this.diagnosticsPanel.toggle();
                break;
            default:
                this.currentScene.inputKeyPressed(comboId);
                break;
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
