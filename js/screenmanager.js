import { DiagnosticPanel } from './diagnostics.js';
import { SceneBase } from './scenebase.js';

import { SceneBallsX } from './sceneballsx.js';
import { SceneSplash } from './scenesplash.js';
import { SceneMainmenu } from './scenemainmenu.js';
import { SceneSettings } from './scenesettings.js';
import { SceneSettingsAudio } from './scenesettings.js';
import { SceneSettingsTheme } from './scenesettings.js';

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
            case SceneBase.GameScenes.settingstheme:
                this.currentScene = this.objectManager.register('SceneSettingsTheme', new SceneSettingsTheme(this.objectManager));
                break;
            default:
                alert('Unknown scene key: ' + sceneKey);
                break;
        }

        this.currentSceneKey = sceneKey;
        this.currentScene.enter();
    }

    // getSceneMainStateHtml() {
    //     const vHtml = `
    //         <strong>Scene: Main</strong><br>
    //     `;
    //     return vHtml;
    // }

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
    //     const ballInfoElement = document.getElementById('currentBallSize');
    //     ballInfoElement.textContent = 'Harrison Digital - Scene Manager';
    // }

    getSpecialKeys() {
        return this.currentScene.getSpecialKeys();
    }

    inputKeyPressed(comboId) {
        if (this.dialogEnabled) {
            this.doDialogInputKeyPressed(comboId);
            return;
        }

        switch (comboId) {
            case 'Control+KeyM':
                this.diagnosticsPanel.toggle();
                break;
            default:
                this.currentScene.inputKeyPressed(comboId);
                break;
        }
    }

    updateFrame() {
        const nextSceneKey = this.currentScene.updateFrame();

        if (nextSceneKey !== null && nextSceneKey !== this.currentSceneKey) {
            this.setCurrentScene(nextSceneKey);
        }

        this.diagnosticsPanel.renderPanel();
    }

    doToast(vTitle, vText = '') {
        var vHtml = '';
        var vId = 'idToast-' + Math.floor(performance.now());
        var vDate = new Date();
        var vTime = vDate.toLocaleTimeString();

        if (typeof vText === 'undefined') {
            vText = '(No message provided)';
        }

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

                // Initialize and show the toast using Bootstrap's toast API (with fallback)
                if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
                    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
                    toast.show();
                } else {
                    // Fallback when bootstrap is not available
                    toastElement.style.display = 'block';
                    setTimeout(() => {
                        if (toastElement && toastElement.parentElement) {
                            toastElement.remove();
                        }
                    }, 5000);
                }
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
            p.textContent = text;
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
