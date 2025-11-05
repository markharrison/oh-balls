import { SceneBase } from './scenebase.js';
import { GameScenes } from './scene.js';

export class SceneMainmenu extends SceneBase {
  constructor(manager) {
    super(manager);
  }

  enterSub() {
    this.insertControls();
  }

  insertControls() {
    this.canvasUIHandler.removeAllControls();
    this.setbackground();

    this.canvasUIHandler.addText('Main Menu', 125, 30, { fontSize: 24, align: 'center' });

    let menuItems = [
      { label: 'Start Game', callback: () => (this.nextScene = GameScenes.ballsX) },
      { label: 'Settings', callback: () => (this.nextScene = GameScenes.settings) },
    ];
    let menuOptions = { fontSize: 20, gap: 5, orientation: 'vertical' };
    this.canvasUIHandler.addMenu(30, 70, menuItems, menuOptions);
  }
}
