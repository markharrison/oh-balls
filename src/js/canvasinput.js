import { MarkJSInput } from '@markharrison/markjsinput';

export class CanvasInputHandler {
  constructor(objectManager) {
    this.objectManager = objectManager;

    this.canvas = objectManager.getById('Main').canvas;

    this.canvasInputMark = this.objectManager.register('MarkJSInput', new MarkJSInput(this.canvas));
  }

  // Subscribe to input events
  subscribe(subscriber) {
    return this.canvasInputMark.subscribe(subscriber);
  }

  // Unsubscribe from input events
  unsubscribe(subscriber) {
    return this.canvasInputMark.unsubscribe(subscriber);
  }

  // Update input state (call each frame)
  update() {
    this.canvasInputMark.update();
  }

  // Clean up event listeners
  destroy() {
    this.canvasInputMark.destroy();
  }
}
