import { SceneBase } from './scenebase.js';
import { GameScenes } from './scene.js';

export class SceneSplash extends SceneBase {
  constructor(sceneManager) {
    super(sceneManager);
    this.menuEnter = null;
  }

  requestFullscreen() {
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.screen.width < 1200);

    if (isMobile) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    }
  }

  enterSub() {
    this.imageHandler = this.objectManager.getById('ImageHandler');
    this.audioHandler = this.objectManager.getById('AudioHandler');
    this.insertControls();
  }

  async insertControls() {
    this.canvasUIHandler.removeAllControls();
    this.setbackground();

    let smilesImage = await this.imageHandler.loadImage('images/smiles.png', 'smiles');

    this.canvasUIHandler.addImage(smilesImage, 440, 60, 400, 280);
    this.canvasUIHandler.addText('OH BALLS MERGE', 640, 350, { fontSize: 72, fontWeight: 'bold', align: 'center' });
    this.canvasUIHandler.addText('Version 0.002h - 17 Nov 2025', 640, 430, {
      fontSize: 24,
      align: 'center',
    });

    let menuItems = [
      {
        label: 'Enter',
        callback: () => {
          this.doEnter();
        },
      },
    ];
    let menuOptions = { fontSize: 20 };
    this.menuEnter = this.canvasUIHandler.addMenu(540, 480, menuItems, menuOptions);
  }

  async doEnter() {
    this.requestFullscreen();

    setTimeout(() => {
      this.canvasUIHandler.removeControl(this.menuEnter);
      this.canvasUIHandler.addText('Loading ....', 640, 500, { 'font-size': '24px', align: 'center' });
    }, 200);

    await this.audioHandler.waitForPreload();
    await this.audioHandler.initialize();
    setTimeout(() => {
      this.audioHandler.setVolume(this.configManager.masterVolume, this.configManager.musicVolume, this.configManager.sfxVolume);
      this.audioHandler.playMusic('MenuMusic');

      this.nextScene = GameScenes.mainmenu;
    }, 1000);
  }
}
