import { SceneBase } from './scenebase.js';
import { GameScenes } from './scene.js';

export class SceneSettings extends SceneBase {
  constructor(objectManager) {
    super(objectManager);

    this.keySequence = [];
    this._boundHandleKeyDown = this.handleKeyDown.bind(this);
  }

  enterSub() {
    this.loadConfig();
    this.insertControls();
    this.setupEventListeners();
  }

  exitSub() {
    this.deleteEventListeners();
  }

  loadConfig() {
    this.dev = this.configManager.dev;
  }

  saveConfig() {
    this.configManager.dev = this.dev;
    this.configManager.saveToLocalStorage();
    this.canvasUIHandler.showToast('Developer Mode ' + (this.dev ? 'Enabled' : 'Disabled'));
  }

  setupEventListeners() {
    window.addEventListener('keydown', this._boundHandleKeyDown);
  }

  deleteEventListeners() {
    window.removeEventListener('keydown', this._boundHandleKeyDown);
  }

  handleKeyDown(e) {
    this.keySequence.push(e.key.toLowerCase());
    if (this.keySequence.length > 3) this.keySequence.shift();
    if (this.keySequence.join('') === 'dev') {
      this.dev = !this.dev;
      this.keySequence = [];
      this.saveConfig();
      this.insertControls();
    }
  }

  insertControls() {
    this.canvasUIHandler.removeAllControls();

    this.canvasUIHandler.setOnEscape(() => (this.nextScene = GameScenes.mainmenu));

    this.canvasUIHandler.addText('Settings', 125, 30, { fontSize: 24, align: 'center' });

    let menuItems = [
      { label: 'Home', callback: () => (this.nextScene = GameScenes.mainmenu) },
      { label: 'Audio', callback: () => (this.nextScene = GameScenes.settingsaudio) },
      { label: 'Gameplay', callback: () => (this.nextScene = GameScenes.settingsgameplay) },
    ];
    if (this.dev) {
      menuItems.push({ label: 'Developer', callback: () => (this.nextScene = GameScenes.settingsdeveloper) });
    }

    let menuOptions = { fontSize: 20, gap: 5, orientation: 'vertical' };
    this.canvasUIHandler.addMenu(30, 70, menuItems, menuOptions);
  }
}

// ------------ Audio -------------------

export class SceneSettingsAudio extends SceneBase {
  constructor(objectManager) {
    super(objectManager);
    this.audioHandler = objectManager.getById('AudioHandler');
  }

  enterSub() {
    this.loadConfig();
    this.insertControls();
  }

  loadConfig() {
    this.masterVolume = this.configManager.masterVolume;
    this.musicVolume = this.configManager.musicVolume;
    this.sfxVolume = this.configManager.sfxVolume;
    this.audioEnabled = this.configManager.audioEnabled;
  }

  saveConfig() {
    this.configManager.masterVolume = this.masterVolume;
    this.configManager.musicVolume = this.musicVolume;
    this.configManager.sfxVolume = this.sfxVolume;
    this.configManager.audioEnabled = this.audioEnabled;
    this.configManager.saveToLocalStorage();
    this.audioHandler.updateAudioNewSettings();
    this.canvasUIHandler.showToast('Audio settings updated');
  }

  insertControls() {
    this.canvasUIHandler.removeAllControls();

    this.canvasUIHandler.setOnEscape(() => this.doEscape());

    this.canvasUIHandler.addText('Audio Settings', 320, 30, { fontSize: 24, align: 'left' });

    let panelOptions = { width: 900, height: 420, backgroundColor: '#0b689d80', borderColor: '#0000FF', borderWidth: 0 };
    this.canvasUIHandler.addPanel(300, 70, panelOptions);

    let toggleOptions = {};
    this.canvasUIHandler.addToggle(320, 100, 'Audio Enabled:', this.audioEnabled, (value) => this.doAudio(value), toggleOptions);

    let sliderOptions = {};
    this.canvasUIHandler.addSlider(320, 160, 'Master Volume:', 0, 100, this.masterVolume, 10, (value) => this.doMasterVolume(value), sliderOptions);
    this.canvasUIHandler.addSlider(320, 250, 'Music Volume:', 0, 100, this.musicVolume, 10, (value) => this.doMusicVolume(value), sliderOptions);
    this.canvasUIHandler.addSlider(320, 340, 'SFX Volume:', 0, 100, this.sfxVolume, 10, (value) => this.doSfxVolume(value), sliderOptions);

    let menuItems = [{ label: 'Save', callback: () => this.doSave() }];
    this.menuEnter = this.canvasUIHandler.addMenu(320, 430, menuItems, { width: 100, height: 40 });
  }

  doAudio(value) {
    this.audioEnabled = value;
  }
  doMasterVolume(value) {
    this.masterVolume = value;
  }
  doMusicVolume(value) {
    this.musicVolume = value;
  }
  doSfxVolume(value) {
    this.sfxVolume = value;
  }
  doSave() {
    this.saveConfig();
    this.nextScene = GameScenes.settings;
  }
  doEscape() {
    this.nextScene = GameScenes.settings;
  }
}

// ------------ Gameplay -------------------

export class SceneSettingsGameplay extends SceneBase {
  constructor(objectManager) {
    super(objectManager);
  }

  enterSub() {
    this.loadConfig();
    this.insertControls();
  }

  loadConfig() {
    this.theme = this.configManager.theme;
    this.gameSize = this.configManager.gameSize;
  }

  saveConfig() {
    this.configManager.theme = this.theme;
    this.configManager.gameSize = this.gameSize;

    this.configManager.saveToLocalStorage();
    this.nextScene = GameScenes.settings;
    this.canvasUIHandler.showToast('Gameplay Settings updated');
  }

  insertControls() {
    this.canvasUIHandler.removeAllControls();

    this.canvasUIHandler.setOnEscape(() => this.doEscape());

    this.canvasUIHandler.addText('Gameplay Settings', 320, 30, { fontSize: 24, align: 'left' });

    let panelOptions = { width: 900, height: 240, backgroundColor: '#0b689d80', borderColor: '#0000FF', borderWidth: 0 };
    this.canvasUIHandler.addPanel(300, 70, panelOptions);

    let carouselOptions = { width: 200, height: 60, orientation: 'horizontal' };
    let carouselItems = ['Default', 'One', 'Two', 'Three'];
    this.canvasUIHandler.addCarousel(320, 100, 'Theme:', carouselItems, 0, (index, value) => this.doTheme(value), carouselOptions);

    carouselItems = ['Large', 'Medium', 'Small'];
    this.canvasUIHandler.addCarousel(320, 170, 'Game Size:', carouselItems, 0, (index, value) => this.doGameSize(value), carouselOptions);

    let menuItems = [{ label: 'Save', callback: () => this.doSave() }];
    this.menuEnter = this.canvasUIHandler.addMenu(320, 240, menuItems, { width: 100, height: 40 });
  }

  doTheme(value) {
    this.theme = value;
  }

  doGameSize(value) {
    this.gameSize = value;
  }

  doSave() {
    this.saveConfig();
    this.nextScene = GameScenes.settings;
  }

  doEscape() {
    this.nextScene = GameScenes.settings;
  }
}

// ------------ Developer -------------------

export class SceneSettingsDeveloper extends SceneBase {
  constructor(objectManager) {
    super(objectManager);
  }

  enterSub() {
    this.loadConfig();
    this.insertControls();
  }

  loadConfig() {
    this.dev = this.configManager.dev;
    this.devPanel = this.configManager.devPanel;
  }

  saveConfig() {
    this.configManager.dev = this.dev;
    this.configManager.devPanel = this.devPanel;

    this.configManager.saveToLocalStorage();
    this.nextScene = GameScenes.settings;
    this.canvasUIHandler.showToast('Developer settings updated');
  }

  insertControls() {
    this.canvasUIHandler.removeAllControls();

    this.canvasUIHandler.setOnEscape(() => this.doEscape());

    this.canvasUIHandler.addText('Developer Settings', 320, 30, { fontSize: 24, align: 'left' });

    let panelOptions = { width: 900, height: 280, backgroundColor: '#0b689d80', borderColor: '#0000FF', borderWidth: 0 };
    this.canvasUIHandler.addPanel(300, 70, panelOptions);

    let toggleOptions = {};
    this.canvasUIHandler.addToggle(320, 100, 'Developer Mode:', this.dev, (value) => this.doDeveloperMode(value), toggleOptions);

    this.canvasUIHandler.addToggle(320, 160, 'Developer Panel:', this.devPanel, (value) => this.doDeveloperPanel(value), toggleOptions);

    let menuItems = [{ label: 'Save', callback: () => this.doSave() }];
    this.menuEnter = this.canvasUIHandler.addMenu(320, 240, menuItems, { width: 100, height: 40 });
  }

  doDeveloperMode(value) {
    this.dev = value;
  }

  doDeveloperPanel(value) {
    this.devPanel = value;
  }

  doSave() {
    this.saveConfig();
    this.nextScene = GameScenes.settings;
  }
  doEscape() {
    this.nextScene = GameScenes.settings;
  }
}
