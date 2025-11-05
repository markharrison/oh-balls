import { CanvasUIHandler } from './canvasui.js';

export class SceneBase {
  constructor(objectManager) {
    this.objectManager = objectManager;
    this.configManager = objectManager.getById('ConfigManager');
    this.sceneManager = objectManager.getById('SceneManager');

    this.canvas = objectManager.getById('Main').canvas;
    this.ctx = this.canvas.getContext('2d');

    this.nextScene = null;
  }

  setbackground() {
    this.canvasUIHandler.setBackgroundGradient(
      [
        { offset: 0, color: '#0a0e27' },
        { offset: 0.5, color: '#1a1f3a' },
        { offset: 1, color: '#2d3561' },
      ],
      'diagonal'
    );
  }

  enter() {
    this.canvasInputHandler = this.objectManager.getById('CanvasInputHandler');
    this.canvasUIHandler = this.objectManager.getById('CanvasUIHandler');

    if (typeof this.enterSub === 'function') {
      this.enterSub();
    }
  }

  exit() {
    if (typeof this.exitSub === 'function') {
      this.exitSub();
    }
  }

  updateFrame(dt) {
    if (this.nextScene != null) {
      return this.nextScene;
    }

    this.canvasInputHandler.update(dt);
    this.canvasUIHandler.update(dt);

    return null;
  }

  getSceneStateHtml() {
    const vHtml = `
        <strong>Scene: ${this.constructor.name}</strong><br>
    `;
    return vHtml;
  }
}
