import { DiagnosticPanel } from './diagnostics.js';
import { SceneBallsX } from './sceneballsx.js';
import { SceneSplash } from './scenesplash.js';
import { SceneMainmenu } from './scenemainmenu.js';
import { SceneSettings } from './scenesettings.js';
import { SceneSettingsAudio } from './scenesettings.js';
import { SceneSettingsGameplay } from './scenesettings.js';
import { SceneSettingsDeveloper } from './scenesettings.js';
import { SceneFireworks } from './scenefireworks.js';
import { CanvasUIHandler } from './canvasui.js';
import { CanvasInputHandler } from './canvasinput.js';

export const GameScenes = Object.freeze({
  splash: 'splash',
  mainmenu: 'mainmenu',
  ballsX: 'ballsX',
  fireworks: 'fireworks',
  settings: 'settings',
  settingsaudio: 'settingsaudio',
  settingsgameplay: 'settingsgameplay',
  settingsdeveloper: 'settingsdeveloper',
});

export class SceneManager {
  constructor(objectManager) {
    this.objectManager = objectManager;
    this.canvas = objectManager.getById('Main').canvas;
    this.configManager = objectManager.getById('ConfigManager');
    this.audioManager = objectManager.getById('AudioHandler');

    this.canvasInputHandler = this.objectManager.register('CanvasInputHandler', new CanvasInputHandler(this.objectManager));

    this.canvasUIHandler = this.objectManager.register('CanvasUIHandler', new CanvasUIHandler(this.objectManager));

    const themes = {
      Theme1: {
        textColor: '#ffffff',
        controlColor: '#0080FF',
        controlSurfaceColor: '#22223b',
        controlTextColor: '#ffffff',
        controlBorderColor: '#3d5a80',
        controlFocusBorderColor: '#ffffff',
        menuButtonColor: '#22223b',
        menuButtonActiveColor: '#0080ff',
        menuButtonClickColor: '#0040ff',
        menuButtonBorderColor: '#3d5a80',
        menuButtonFocusBorderColor: '#ffffff',
        menuButtonFontSize: 18,
        modalSurfaceColor: '#181818',
        modalBorderColor: '#ffffff',
        modalTextColor: '#ffffff',
        modalText2Color: '#888888',
        modalTextFontSize: 20,
        modalText2FontSize: 16,
        panelSurfaceColor: '#ff0000',
        panelBorderColor: '#ffffff',
        borderRadius: 10,
      },
    };

    this.canvasUIHandler.setTheme(themes['Theme1']);

    this.ctx = this.canvas.getContext('2d');

    this.currentSceneKey = null;
    this.currentScene = null;
    this.devcnt = 0;
  }

  setCurrentScene(sceneKey) {
    if (this.currentScene) {
      this.currentScene.exit();
      this.objectManager.deregister(this.currentScene);
      this.currentScene = null;
    }

    switch (sceneKey) {
      case GameScenes.splash:
        this.currentScene = this.objectManager.register('SceneSplash', new SceneSplash(this.objectManager));
        break;
      case GameScenes.mainmenu:
        this.currentScene = this.objectManager.register('SceneMainmenu', new SceneMainmenu(this.objectManager));
        break;
      case GameScenes.ballsX:
        this.currentScene = this.objectManager.register('SceneBallsX', new SceneBallsX(this.objectManager));
        break;
      case GameScenes.fireworks:
        this.currentScene = this.objectManager.register('SceneFireworks', new SceneFireworks(this.objectManager));
        break;
      case GameScenes.settings:
        this.currentScene = this.objectManager.register('SceneSettings', new SceneSettings(this.objectManager));
        break;
      case GameScenes.settingsaudio:
        this.currentScene = this.objectManager.register('SceneSettingsAudio', new SceneSettingsAudio(this.objectManager));
        break;
      case GameScenes.settingsgameplay:
        this.currentScene = this.objectManager.register('SceneSettingsGameplay', new SceneSettingsGameplay(this.objectManager));
        break;
      case GameScenes.settingsdeveloper:
        this.currentScene = this.objectManager.register('SceneSettingsDeveloper', new SceneSettingsDeveloper(this.objectManager));
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

  // setupEventHandlers() {}

  start() {
    this.diagnosticsPanel = this.objectManager.register('DiagnosticPanel', new DiagnosticPanel(this.objectManager));

    if (this.configManager.devPanel && this.diagnosticsPanel) {
      this.diagnosticsPanel.enable(true);
    }

    this.setCurrentScene(GameScenes.splash);
  }

  destroy() {
    this.currentScene.exit();
    this.currentScene = null;
    this.diagnosticsPanel = null;

    this.canvasUIHandler.destroy();
    this.objectManager.deregister(this.canvasUIHandler);

    this.canvasInputHandler.destroy();
    this.objectManager.deregister(this.canvasInputHandler);
  }

  // renderSceneMain() {
  //     const ballInfoElement = document.getElementById('playBallSize');
  //     ballInfoElement.textContent = 'Harrison Digital - Scene Manager';
  // }

  // getSpecialKeys() {
  //     return this.currentScene.getSpecialKeys();
  // }

  // inputTouchAction(type, x, y, details = {}) {
  //     this.currentScene.inputTouchAction(type, x, y, details);
  // }

  // inputMouseAction(type, x, y, details = {}) {
  //     this.currentScene.inputMouseAction(type, x, y, details);
  // }

  // inputKeyPressed(comboId) {
  //     if (this.dialogEnabled) {
  //         this.doDialogInputKeyPressed(comboId);
  //         return;
  //     }

  //     switch (comboId) {
  //         case 'Control+KeyP':
  //             if (this.configManager.dev) {
  //                 this.diagnosticsPanel.toggle();
  //             }
  //             break;
  //         case 'Control+KeyD':
  //             this.devcnt += 1;
  //             if (this.devcnt === 3) {
  //                 this.configManager.dev = !this.configManager.dev;
  //                 this.configManager.saveToLocalStorage();
  //                 this.devcnt = 0;
  //                 this.doToast('Developer Mode: ', this.configManager.dev ? 'Enabled' : 'Disabled');
  //             }
  //             break;
  //         default:
  //             this.currentScene.inputKeyPressed(comboId);
  //             break;
  //     }
  // }

  updateFrame(dt) {
    const nextSceneKey = this.currentScene.updateFrame(dt);

    if (nextSceneKey !== null) {
      this.setCurrentScene(nextSceneKey);
    }

    this.diagnosticsPanel.renderPanel();
  }

  // doDialog(title, text, buttons, callback) {
  //     const dialog = document.getElementById('idCanvasDialog');
  //     dialog.innerHTML = '';
  //     if (title) {
  //         const h5 = document.createElement('h5');
  //         h5.textContent = title;
  //         dialog.appendChild(h5);
  //     }
  //     if (text) {
  //         const p = document.createElement('p');
  //         p.innerHTML = text;
  //         dialog.appendChild(p);
  //     }
  //     const btnContainer = document.createElement('div');
  //     btnContainer.className = 'd-flex justify-content-center gap-2';
  //     let firstBtn = null;
  //     buttons.forEach((button, index) => {
  //         const btn = document.createElement('button');
  //         btn.id = `idDialogButton_${index + 1}`;
  //         btn.dataset.idx = String(index + 1);
  //         btn.className = 'btn btn-primary';
  //         btn.textContent = button;
  //         btn.onclick = () => {
  //             document.getElementById('idCanvasBackdrop').style.display = 'none';
  //             document.getElementById('idCanvasDialog').style.display = 'none';
  //             if (callback) callback(btn.textContent);
  //             this.dialogEnabled = false;
  //         };
  //         btnContainer.appendChild(btn);
  //     });
  //     dialog.appendChild(btnContainer);
  //     this.dialogEnabled = true;
  //     this.dialogButtonsCount = buttons.length;
  //     document.getElementById('idCanvasBackdrop').style.display = 'block';
  //     document.getElementById('idCanvasDialog').style.display = 'block';
  //     this.doDialogSetFocus(1);
  // }

  // doDialogSetFocus(idx) {
  //     const btn = document.getElementById(`idDialogButton_${idx}`);
  //     if (btn) btn.focus();
  // }

  // doDialogInputKeyPressed(comboId) {
  //     if (!this.dialogEnabled) return;
  //     //
  //     const focusedBtn = document.activeElement;
  //     let butCurrIdx = focusedBtn ? Number(focusedBtn.dataset.idx) : 0;

  //     switch (comboId) {
  //         case 'ArrowUp':
  //         case 'ArrowLeft':
  //             if (butCurrIdx > 1) {
  //                 this.doDialogSetFocus(butCurrIdx - 1);
  //             }
  //             break;
  //         case 'ArrowDown':
  //         case 'ArrowRight':
  //             if (butCurrIdx < this.dialogButtonsCount) {
  //                 this.doDialogSetFocus(butCurrIdx + 1);
  //             }
  //             break;
  //         case 'Enter':
  //             focusedBtn.click();
  //             break;
  //         default:
  //             break;
  //     }
  // }

  // doShowOverlay() {
  //     const overlay = document.getElementById('idCanvasOverlay');
  //     if (overlay) {
  //         overlay.style.display = 'block';
  //         this.overlayEnabled = true;
  //     }
  // }

  // doHideOverlay() {
  //     const overlay = document.getElementById('idCanvasOverlay');
  //     if (overlay) {
  //         overlay.style.display = 'none';
  //         this.overlayEnabled = false;
  //     }
  // }
}
