import { SceneBase } from './scenebase.js';
import { GameScenes } from './scene.js';

export class SceneMainmenu extends SceneBase {
  constructor(manager) {
    super(manager);

    this.main = this.objectManager.getById('Main');

    this.pwaInstallableListener = () => {
      this.insertControls();
    };
    window.addEventListener('pwa-installable', this.pwaInstallableListener);
  }

  enterSub() {
    this.insertControls();
  }

  exitSub() {
    window.removeEventListener('pwa-installable', this.pwaInstallableListener);
  }

  insertControls() {
    this.canvasUIHandler.removeAllControls();
    this.setbackground();

    this.canvasUIHandler.addText('Main Menu', 125, 30, { fontSize: 24, align: 'center' });

    let menuItems = [
      { label: 'Start Game', callback: () => (this.nextScene = GameScenes.ballsX) },
      { label: 'Fireworks', callback: () => (this.nextScene = GameScenes.fireworks) },
      { label: 'Settings', callback: () => (this.nextScene = GameScenes.settings) },
    ];

    if (this.main.deferredPrompt) {
      menuItems.push({ label: 'Install', callback: () => this.doInstall() });
    }

    let menuOptions = { fontSize: 20, gap: 5, orientation: 'vertical' };
    this.canvasUIHandler.addMenu(30, 70, menuItems, menuOptions);
  }

  async doInstall() {
    if (this.main.deferredPrompt) {
      this.main.deferredPrompt.prompt();
      const { outcome } = await this.main.deferredPrompt.userChoice;

      this.main.deferredPrompt = null;
      this.insertControls();
    }
  }
}
