// Input Handling Module
export class InputHandler {
    constructor() {
        this.diagnosticsPanel = null;
        this.sceneManager = null;
        // keyState: true if key is currently down
        this.keyState = {};
        // gamepadState: true if gamepad button is currently down
        this.gamepadState = {};
        // (simpler) no combo mapping: track physical event.code only
        this.setupEventListeners();
    }

    registerDiagnosticsPanel(diagnosticsPanel) {
        this.diagnosticsPanel = diagnosticsPanel;
    }

    registerSceneManager(sceneManager) {
        this.sceneManager = sceneManager;
    }

    setupEventListeners() {
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    }

    buildKeyId(event) {
        const parts = [];
        if (event.ctrlKey) parts.push('Control');
        if (event.shiftKey) parts.push('Shift');
        if (event.altKey) parts.push('Alt');
        if (event.metaKey) parts.push('Meta');
        parts.push(event.code);
        return parts.join('+');
    }

    handleKeyDownOverlay(event) {
        const combo = this.buildKeyId(event);
        const keyId = event.code;

        let specialKeys = this.sceneManager.getSpecialKeys();

        if (specialKeys.includes(combo)) {
            event.preventDefault();
            if (!this.keyState[keyId]) {
                this.keyState[keyId] = true;
                this.sceneManager.inputKeyPressed(combo);
                // if (this.sceneManager && typeof this.sceneManager.inputKeyPressed === 'function') {
                //     this.sceneManager.inputKeyPressed(combo);
                // }
            }
        }
    }

    handleKeyDownCanvas(event) {
        const combo = this.buildKeyId(event);
        const keyId = event.code;

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'Escape'].includes(event.code)) {
            event.preventDefault();
        }

        // Arrow keys: just set state, repeat handled in getInput
        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
            this.keyState[keyId] = true;
            return;
        }

        if (!this.keyState[keyId]) {
            this.keyState[keyId] = true;
            this.sceneManager.inputKeyPressed(combo);
            // if (this.sceneManager && typeof this.sceneManager.inputKeyPressed === 'function') {
            //     this.sceneManager.inputKeyPressed(combo);
            // }
        }
    }

    handleKeyDown(event) {
        const overlay = document.getElementById('idCanvasOverlay');
        const overlayVisible = overlay && overlay.style.display !== 'none';

        if (overlayVisible) {
            this.handleKeyDownOverlay(event);
        } else {
            this.handleKeyDownCanvas(event);
        }
    }

    handleKeyUp(event) {
        const keyId = event.code;
        this.keyState[keyId] = false;
    }

    getInput() {
        const overlay = document.getElementById('idCanvasOverlay');
        const overlayVisible = overlay && overlay.style.display !== 'none';

        if (!overlayVisible) {
            if (this.keyState['ArrowLeft'] || this.keyState['KeyA']) {
                this.sceneManager.inputKeyPressed('ArrowLeft');
            } else if (this.keyState['ArrowRight'] || this.keyState['KeyD']) {
                this.sceneManager.inputKeyPressed('ArrowRight');
            }
        }

        // Gamepad polling
        this.pollGamepad();
    }

    pollGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];
        if (!gp) return;

        // Left thumbstick X axis for left/right auto-repeat
        const axisX = gp.axes[0] || 0;
        const deadZone = 0.3;
        if (axisX < -deadZone) {
            this.sceneManager.inputKeyPressed('ArrowLeft');
        } else if (axisX > deadZone) {
            this.sceneManager.inputKeyPressed('ArrowRight');
        }
        // D-pad up/down mapping for menus (standard gamepad mapping: 12=Up,13=Down,14=Left,15=Right)
        if (gp.buttons[12]?.pressed) {
            if (!this.gamepadState['ArrowUp']) {
                this.sceneManager.inputKeyPressed('ArrowUp');
                this.gamepadState['ArrowUp'] = true;
            }
        } else {
            this.gamepadState['ArrowUp'] = false;
        }
        if (gp.buttons[13]?.pressed) {
            if (!this.gamepadState['ArrowDown']) {
                this.sceneManager.inputKeyPressed('ArrowDown');
                this.gamepadState['ArrowDown'] = true;
            }
        } else {
            this.gamepadState['ArrowDown'] = false;
        }
        // A button (button 0) as Space
        if (gp.buttons[0]?.pressed) {
            if (!this.gamepadState['Enter']) {
                // Map A to Enter for menu selection
                this.sceneManager.inputKeyPressed('Enter');
                this.gamepadState['Enter'] = true;
            }
        } else {
            this.gamepadState['Enter'] = false;
        }
        // B button (button 1) as KeyD
        if (gp.buttons[1]?.pressed) {
            if (!this.gamepadState['KeyD']) {
                //   this.sceneManager.inputKeyPressed('KeyX');
                this.gamepadState['KeyD'] = true;
            }
        } else {
            this.gamepadState['KeyD'] = false;
        }
    }

    // Cleanup method
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}
