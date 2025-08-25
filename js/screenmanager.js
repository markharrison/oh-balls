import { DiagnosticPanel } from './diagnostics.js';
import { SceneBase } from './scenebase.js';

import { SceneBallsX } from './sceneballsx.js';
import { SceneSplash } from './scenesplash.js';
import { SceneMainmenu } from './scenemainmenu.js';
import { SceneSettings } from './scenesettings.js';
import { SceneSettingsAudio } from './scenesettings.js';
import { SceneSettingsTheme } from './scenesettings.js';

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
                this.currentScene = new SceneSplash(this);
                break;
            case SceneBase.GameScenes.mainmenu:
                this.currentScene = new SceneMainmenu(this);
                break;
            case SceneBase.GameScenes.ballsX:
                this.currentScene = new SceneBallsX(this);
                break;
            case SceneBase.GameScenes.settings:
                this.currentScene = new SceneSettings(this);
                break;
            case SceneBase.GameScenes.settingsaudio:
                this.currentScene = new SceneSettingsAudio(this);
                break;
            case SceneBase.GameScenes.settingstheme:
                this.currentScene = new SceneSettingsTheme(this);
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

    registerConfig(config) {
        this.config = config;
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

    getSpecialKeys() {
        return this.currentScene.getSpecialKeys();
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

    randomString(length) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

        if (!length) {
            length = Math.floor(Math.random() * chars.length);
        }

        var str = '';
        for (var i = 0; i < length; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
    }

    doToast(vTitle, vText) {
        var vHtml = '';
        var vId = 'idToast' + this.randomString(8);
        var vDate = new Date();
        var vTime = vDate.toLocaleTimeString();

        vHtml += "<div id='" + vId + "' class='toast fade hide'><div class='toast-header'>";
        vHtml += "<strong class='mr-auto'>" + vTitle + "</strong><small class='text-muted'>&nbsp;" + vTime + '</small>';
        vHtml += "<button type='button' class='btn-close ms-auto mb-1' data-bs-dismiss='toast' ></button>";
        vHtml += "</div><div class='toast-body' style='color: black;'>" + vText + '</div></div>';

        const toasterElement = document.getElementById('idToaster');
        if (toasterElement) {
            toasterElement.insertAdjacentHTML('beforeend', vHtml);

            const toastElement = document.getElementById(vId);
            if (toastElement) {
                // Define the cleanup function
                const cleanupToast = (event) => {
                    event.currentTarget.removeEventListener('hidden.bs.toast', cleanupToast);
                    event.currentTarget.remove();
                };

                // Add event listener for when toast is hidden
                toastElement.addEventListener('hidden.bs.toast', cleanupToast);

                // Initialize and show the toast using Bootstrap's toast API
                const toast = new bootstrap.Toast(toastElement, { delay: 10000 });
                toast.show();
            }
        }
    }
}
