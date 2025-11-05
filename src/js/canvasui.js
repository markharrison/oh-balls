// CanvasUIHandler: abstraction layer between application and CanvasUIMark library
import { MarkJSCanvasUI, Menu, Panel, Toggle, Slider, Carousel } from '@markharrison/markjscanvasui';

export class CanvasUIHandler {
  constructor(objectManager) {
    this.objectManager = objectManager;

    this.canvas = objectManager.getById('Main').canvas;

    this.configManager = this.objectManager.getById('ConfigManager');

    const canvasInputHandler = this.objectManager.getById('CanvasInputHandler');
    const inputHandler = canvasInputHandler.canvasInputMark;

    this.canvasUiMark = this.objectManager.register(
      'MarkJSCanvasUI',
      new MarkJSCanvasUI(this.canvas, {
        backgroundColor: '#0080FF',
        input: inputHandler,
      })
    );
  }

  setTheme(themeOptions = {}) {
    this.canvasUiMark.setTheme(themeOptions);
  }

  addButton(x, y, label, callback, options = {}) {
    const menu = new Menu(x, y, [{ label, callback }], { ...options });
    return this.canvasUiMark.addControl(menu);
  }

  addToggle(x, y, label, initvalue, callback, options = {}) {
    const toggle = new Toggle(x, y, label, initvalue, callback, { ...options });
    return this.canvasUiMark.addControl(toggle);
  }

  addSlider(x, y, label, min, max, initvalue, step, callback, options = {}) {
    const slider = new Slider(x, y, min, max, initvalue, step, label, callback, { ...options });
    return this.canvasUiMark.addControl(slider);
  }

  addCarousel(x, y, label, items, initvalue, callback, options = {}) {
    let selectedIndex = items.indexOf(initvalue);
    if (selectedIndex === -1) selectedIndex = 0;
    const carousel = new Carousel(x, y, items, selectedIndex, label, callback, { ...options });
    return this.canvasUiMark.addControl(carousel);
  }

  addMenu(x, y, items, options = {}) {
    const menu = new Menu(x, y, items, { ...options });
    return this.canvasUiMark.addControl(menu);
  }

  addPanel(x, y, options = {}) {
    const panel = new Panel(x, y, { ...options });
    return this.canvasUiMark.addControl(panel);
  }

  // addSlider(x, y, width, height, min, max, value, callback, options = {}) {
  //     // Updated: Slider(x, y, min, max, value, callback, { width, height, ...options })
  //     const slider = new Slider(x, y, min, max, value, callback, { width, height, ...options });
  //     return this.canvasUiMark.addControl(slider);
  // }

  // addTextField(x, y, width, height, placeholder, callback, options = {}) {
  //     // Updated: TextInput(x, y, placeholder, callback, { width, height, ...options })
  //     const textField = new TextInput(x, y, placeholder, callback, { width, height, ...options });
  //     return this.canvasUiMark.addControl(textField);
  // }

  removeControl(control) {
    return this.canvasUiMark.removeControl(control);
  }

  removeAllControls() {
    this.canvasUiMark.removeAllControlsExceptToasts();
  }

  // Text and image methods
  addText(text, x, y, options = {}) {
    if (!this._addedTexts) this._addedTexts = [];
    const textObj = this.canvasUiMark.addText(text, x, y, options);
    this._addedTexts.push({ text, x, y, options });
    return textObj;
  }

  restoreControlsAndTexts() {
    this.removeAllControls();
    // Re-add all stored text controls
    if (this._addedTexts) {
      for (const t of this._addedTexts) {
        this.canvasUiMark.addText(t.text, t.x, t.y, t.options);
      }
    }
    // Add other controls as needed here
  }

  // removeText(textObj) {
  //     const index = this.canvasUiMark.texts.indexOf(textObj);
  //     if (index > -1) {
  //         this.canvasUiMark.texts.splice(index, 1);
  //     }
  // }

  // clearTexts() {
  //     this.canvasUiMark.texts = [];
  // }

  addImage(image, x, y, width, height) {
    return this.canvasUiMark.addImage(image, x, y, width, height);
  }

  // removeImage(imageObj) {
  //     const index = this.canvasUiMark.images.indexOf(imageObj);
  //     if (index > -1) {
  //         this.canvasUiMark.images.splice(index, 1);
  //     }
  // }

  // clearImages() {
  //     this.canvasUiMark.images = [];
  // }

  setBackground(color) {
    this.canvasUiMark.setBackground(color);
  }

  setBackgroundGradient(gradient, direction = 'diagonal') {
    this.canvasUiMark.setBackgroundGradient(gradient, direction);
  }

  setBackgroundNone() {
    this.canvasUiMark.setBackgroundNone();
  }

  showModal(title, message, buttons = [], options = {}) {
    return this.canvasUiMark.showModal(title, message, buttons, options);
  }

  // closeModal(modal) {
  //     return this.canvasUiMark.closeModal(modal);
  // }

  showToast(message, type = 'info', duration = 3000) {
    return this.canvasUiMark.showToast(message, type, duration);
  }

  // Focus management methods
  // focusNext() {
  //     return this.canvasUiMark.focusNext();
  // }

  // focusPrevious() {
  //     return this.canvasUiMark.focusPrevious();
  // }

  // setFocusIndex(index) {
  //     if (index >= 0 && index < this.canvasUiMark.controls.length) {
  //         this.canvasUiMark.focusIndex = index;
  //     }
  // }

  // getFocusIndex() {
  //     return this.canvasUiMark.focusIndex;
  // }

  // Event callback methods
  setOnEscape(callback) {
    this.canvasUiMark.onEscape = callback;
  }

  clearOnEscape() {
    this.canvasUiMark.onEscape = null;
  }

  // Animation control methods
  // start() {
  //     return this.canvasUiMark.start();
  // }

  // stop() {
  //     return this.canvasUiMark.stop();
  // }

  update(dt) {
    this.canvasUiMark.update(dt);
    this.canvasUiMark.render();
  }

  // State query methods
  // hasControls() {
  //     return this.canvasUiMark.controls.length > 0;
  // }

  // getControlCount() {
  //     return this.canvasUiMark.controls.length;
  // }

  // getModalCount() {
  //     return this.canvasUiMark.modals.length;
  // }

  // isModalOpen() {
  //     return this.canvasUiMark.modals.length > 0;
  // }

  // getToastCount() {
  //     return this.canvasUiMark.toasts.length;
  // }

  // Direct access to underlying library (for advanced use)
  getCanvasUIMark() {
    return this.canvasUiMark;
  }

  destroy() {
    this.canvasUiMark.destroy();
    this.objectManager.deregister(this.canvasUiMark);
  }
}
