import { DiagnosticPanel } from './diagnostics.js';
import { SceneBase } from './scenebase.js';

import { SceneBallsX } from './sceneballsx.js';
import { SceneSplash } from './scenesplash.js';
import { SceneMainmenu } from './scenemainmenu.js';
import { SceneSettings } from './scenesettings.js';
import { SceneSettingsAudio } from './scenesettings.js';
import { SceneSettingsGameplay } from './scenesettings.js';
import { SceneSettingsDeveloper } from './scenesettings.js';

export class SceneManager {
    constructor(objectManager) {
        this.objectManager = objectManager;
        this.canvas = objectManager.get('Main').canvas;
        this.configManager = objectManager.get('ConfigManager');
        this.audioManager = objectManager.get('AudioHandler');

        this.ctx = this.canvas.getContext('2d');

        this.dialogEnabled = false;
        this.dialogButtonsCount = 0;
        this.overlayEnabled = false;

        this.currentSceneKey = null;
        this.currentScene = null;
        this.devcnt = 0;

        // this.groundImage = new window.Image();
        // this.groundImageLoaded = false;
        // this.groundImage.onload = () => {
        //     this.groundImageLoaded = true;
        // };
        // this.groundImage.src = `/images/ground.png`;
    }

    setCurrentScene(sceneKey) {
        if (this.currentScene) {
            this.currentScene.exit();
            this.objectManager.deregister(this.currentScene.constructor.name);
            this.currentScene = null;
        }

        switch (sceneKey) {
            case SceneBase.GameScenes.splash:
                this.currentScene = this.objectManager.register('SceneSplash', new SceneSplash(this.objectManager));
                break;
            case SceneBase.GameScenes.mainmenu:
                this.currentScene = this.objectManager.register('SceneMainmenu', new SceneMainmenu(this.objectManager));
                break;
            case SceneBase.GameScenes.ballsX:
                this.currentScene = this.objectManager.register('SceneBallsX', new SceneBallsX(this.objectManager));
                break;
            case SceneBase.GameScenes.settings:
                this.currentScene = this.objectManager.register('SceneSettings', new SceneSettings(this.objectManager));
                break;
            case SceneBase.GameScenes.settingsaudio:
                this.currentScene = this.objectManager.register('SceneSettingsAudio', new SceneSettingsAudio(this.objectManager));
                break;
            case SceneBase.GameScenes.settingsgameplay:
                this.currentScene = this.objectManager.register(
                    'SceneSettingsGameplay',
                    new SceneSettingsGameplay(this.objectManager)
                );
                break;
            case SceneBase.GameScenes.settingsdeveloper:
                this.currentScene = this.objectManager.register(
                    'SceneSettingsDeveloper',
                    new SceneSettingsDeveloper(this.objectManager)
                );
                break;
            default:
                alert('Unknown scene key: ' + sceneKey);
                break;
        }

        this.currentSceneKey = sceneKey;
        this.currentScene.enter();
    }

    getSceneStateHtml() {
        let vHtml = '';

        if (this.currentScene && typeof this.currentScene.getSceneStateHtml === 'function') {
            vHtml = this.currentScene.getSceneStateHtml();
        }

        return vHtml;
    }

    setupEventHandlers() {}

    start() {
        this.diagnosticsPanel = this.objectManager.register('DiagnosticPanel', new DiagnosticPanel(this.objectManager));

        this.setCurrentScene(SceneBase.GameScenes.splash);
    }

    destroy() {
        this.currentScene.exit();
        this.currentScene = null;
        this.diagnosticsPanel = null;
    }

    // renderSceneMain() {
    //     const ballInfoElement = document.getElementById('playBallSize');
    //     ballInfoElement.textContent = 'Harrison Digital - Scene Manager';
    // }

    getSpecialKeys() {
        return this.currentScene.getSpecialKeys();
    }

    inputTouchAction(type, x, y, details = {}) {
        this.currentScene.inputTouchAction(type, x, y, details);
    }

    inputKeyPressed(comboId) {
        if (this.dialogEnabled) {
            this.doDialogInputKeyPressed(comboId);
            return;
        }

        switch (comboId) {
            case 'Control+KeyP':
                if (this.configManager.dev) {
                    this.diagnosticsPanel.toggle();
                }
                break;
            case 'Control+KeyD':
                this.devcnt += 1;
                if (this.devcnt === 3) {
                    this.configManager.dev = !this.configManager.dev;
                    this.configManager.saveToLocalStorage();
                    this.devcnt = 0;
                    this.doToast('Developer Mode: ', this.configManager.dev ? 'Enabled' : 'Disabled');
                }
                break;
            default:
                this.currentScene.inputKeyPressed(comboId);
                break;
        }
    }

    updateFrame() {
        const nextSceneKey = this.currentScene.updateFrame();

        if (nextSceneKey !== null) {
            this.setCurrentScene(nextSceneKey);
        }

        // if (nextSceneKey !== null && nextSceneKey !== this.currentSceneKey) {
        //     this.setCurrentScene(nextSceneKey);
        // }

        this.diagnosticsPanel.renderPanel();
    }

    doToast(vTitle, vText = '', vType = 'info') {
        var vHtml = '';
        var vId = 'idToast-' + Math.floor(performance.now());
        var vDate = new Date();
        var vTime = vDate.toLocaleTimeString();

        const toastTypes = {
            success: { icon: '✓', borderColor: '#28a745' },
            warning: { icon: '⚠', borderColor: '#ffc107' },
            error: { icon: '✕', borderColor: '#dc3545' },
            info: { icon: 'i', borderColor: '#17a2b8' },
        };

        const config = toastTypes[vType] || toastTypes.info;

        vHtml +=
            "<div id='" +
            vId +
            "' class='custom-toast' style='background-color: rgba(255, 255, 255, 1) !important;border-left: 6px solid " +
            config.borderColor +
            "; border-radius: 8px; box-shadow: none !important; margin-bottom: 10px; max-width: 400px; padding: 16px; display: block !important; visibility: visible !important;'>";
        vHtml += "<div style='display: flex; align-items: flex-start; gap: 12px;'>";
        vHtml +=
            "<div style='display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background-color: " +
            config.borderColor +
            "; color: white; font-weight: bold; font-size: 14px; flex-shrink: 0; margin-top: 2px;'>" +
            config.icon +
            '</div>';
        vHtml += "<div style='flex: 1; min-width: 0;'>";
        vHtml +=
            "<div style='font-weight: 600; color: black; font-size: 15px; margin-bottom: " +
            (vText ? '4px' : '0') +
            ";'>" +
            vTitle +
            '</div>';
        if (vText) {
            vHtml += "<div style='color: black; font-size: 14px; line-height: 1.4; opacity: 0.8;'>" + vText + '</div>';
        }
        vHtml += '</div>';
        vHtml += "<div style='display: flex; align-items: flex-start; gap: 8px; flex-shrink: 0;'>";
        vHtml += "<small style='color: black; opacity: 0.6; font-size: 12px; margin-top: 2px;'>" + vTime + '</small>';
        vHtml +=
            "<button type='button' class='btn-close' onclick='this.closest(\".custom-toast\").remove()' style='color: black; opacity: 0.5; font-size: 18px; border: none; background: none; cursor: pointer; padding: 0; width: 16px; height: 16px;'>×</button>";
        vHtml += '</div></div></div>';

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

                // Show the toast and auto-hide after 5 seconds
                toastElement.style.display = 'block';
                setTimeout(() => {
                    if (toastElement && toastElement.parentNode) {
                        toastElement.remove();
                    }
                }, 5000);
            }
        }
    }

    doDialog(title, text, buttons, callback) {
        const dialog = document.getElementById('idCanvasDialog');
        dialog.innerHTML = '';
        if (title) {
            const h5 = document.createElement('h5');
            h5.textContent = title;
            dialog.appendChild(h5);
        }
        if (text) {
            const p = document.createElement('p');
            p.innerHTML = text;
            dialog.appendChild(p);
        }
        const btnContainer = document.createElement('div');
        btnContainer.className = 'd-flex justify-content-center gap-2';
        let firstBtn = null;
        buttons.forEach((button, index) => {
            const btn = document.createElement('button');
            btn.id = `idDialogButton_${index + 1}`;
            btn.dataset.idx = String(index + 1);
            btn.className = 'btn btn-primary';
            btn.textContent = button;
            btn.onclick = () => {
                document.getElementById('idCanvasBackdrop').style.display = 'none';
                document.getElementById('idCanvasDialog').style.display = 'none';
                if (callback) callback(btn.textContent);
                this.dialogEnabled = false;
            };
            btnContainer.appendChild(btn);
        });
        dialog.appendChild(btnContainer);
        this.dialogEnabled = true;
        this.dialogButtonsCount = buttons.length;
        document.getElementById('idCanvasBackdrop').style.display = 'block';
        document.getElementById('idCanvasDialog').style.display = 'block';
        this.doDialogSetFocus(1);
    }

    doDialogSetFocus(idx) {
        const btn = document.getElementById(`idDialogButton_${idx}`);
        if (btn) btn.focus();
    }

    doDialogInputKeyPressed(comboId) {
        if (!this.dialogEnabled) return;
        //
        const focusedBtn = document.activeElement;
        let butCurrIdx = focusedBtn ? Number(focusedBtn.dataset.idx) : 0;

        switch (comboId) {
            case 'ArrowUp':
            case 'ArrowLeft':
                if (butCurrIdx > 1) {
                    this.doDialogSetFocus(butCurrIdx - 1);
                }
                break;
            case 'ArrowDown':
            case 'ArrowRight':
                if (butCurrIdx < this.dialogButtonsCount) {
                    this.doDialogSetFocus(butCurrIdx + 1);
                }
                break;
            case 'Enter':
                focusedBtn.click();
                break;
            default:
                break;
        }
    }

    doShowOverlay() {
        const overlay = document.getElementById('idCanvasOverlay');
        if (overlay) {
            overlay.style.display = 'block';
            this.overlayEnabled = true;
        }
    }

    doHideOverlay() {
        const overlay = document.getElementById('idCanvasOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            this.overlayEnabled = false;
        }
    }
}
